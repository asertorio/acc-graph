import type { DataSource, DataLoadResult, LoadProgress } from './DataSource';
import type { UserRecord } from '../../types/entities';
import type { Relationship } from '../../types/relationships';
import type { SchemaTable } from '../schemas/types';
import { parseCsvFile } from '../parsers/csvParser';
import { parseRelationships } from '../parsers/relationshipParser';
import { buildEntityIndex, resolveAllEntities, addUnrelatedEntities, type EntityIndex } from '../parsers/entityResolver';
import { getAllMappings } from '../../utils/domainMapper';
import { parseSchemaJson } from '../schemas/schemaLoader';
import { LOOKUP_TABLES } from '../../utils/lookupRegistry';

export class CsvDataSource implements DataSource {
  private fileMap: Map<string, File>;

  constructor(files: Map<string, File>) {
    this.fileMap = files;
  }

  static async fromDirectoryPicker(): Promise<CsvDataSource> {
    const dirHandle = await window.showDirectoryPicker({ mode: 'read' });
    const files = new Map<string, File>();
    await collectFiles(dirHandle, files, '');
    return new CsvDataSource(files);
  }

  static fromFileList(fileList: FileList): CsvDataSource {
    const files = new Map<string, File>();
    for (const file of Array.from(fileList)) {
      const path = (file as File & { webkitRelativePath?: string }).webkitRelativePath || file.name;
      const name = path.split('/').pop() || file.name;
      files.set(name, file);
    }
    return new CsvDataSource(files);
  }

  static fromDroppedItems(items: Map<string, File>): CsvDataSource {
    return new CsvDataSource(items);
  }

  async loadAll(onProgress?: (progress: LoadProgress) => void): Promise<DataLoadResult> {
    const csvFiles = [...this.fileMap.entries()].filter(([name]) => name.endsWith('.csv'));
    const jsonFiles = [...this.fileMap.entries()].filter(([name]) => name.endsWith('.json'));
    const totalFiles = csvFiles.length + jsonFiles.length;
    let processed = 0;

    const report = (fileName: string) => {
      processed++;
      onProgress?.({ current: processed, total: totalFiles, currentFile: fileName });
    };

    // 1. Parse relationships CSV
    const relFile = this.fileMap.get('relationships_entity_relationship.csv');
    let relationships: Relationship[] = [];
    if (relFile) {
      report('relationships_entity_relationship.csv');
      const relCsv = await parseCsvFile(relFile);
      relationships = parseRelationships(relCsv);
    }

    // 2. Parse entity CSV files into indices
    const entityIndices = new Map<string, EntityIndex>();
    const mappings = getAllMappings();
    const neededCsvFiles = new Set(mappings.map(m => m.mapping.csvFile).filter(Boolean));

    for (const csvFileName of neededCsvFiles) {
      const file = this.fileMap.get(csvFileName);
      if (!file) continue;
      report(csvFileName);
      const csvResult = await parseCsvFile(file);
      const mapping = mappings.find(m => m.mapping.csvFile === csvFileName);
      if (mapping) {
        const index = buildEntityIndex(csvResult, mapping.mapping.primaryKey);
        entityIndices.set(csvFileName, index);
      }
    }

    // 3. Parse admin_users.csv
    const usersFile = this.fileMap.get('admin_users.csv');
    let users: UserRecord[] = [];
    if (usersFile) {
      report('admin_users.csv');
      const usersCsv = await parseCsvFile(usersFile);
      users = usersCsv.data.map(row => ({
        id: row.id || '',
        autodesk_id: row.autodesk_id || '',
        name: row.name || '',
        email: row.email || '',
        first_name: row.first_name || '',
        last_name: row.last_name || '',
        job_title: row.job_title || '',
        company_id: row.default_company_id || '',
      }));
    }

    // 4. Parse lookup CSVs
    const lookups = new Map<string, Array<Record<string, string>>>();
    for (const def of LOOKUP_TABLES) {
      const file = this.fileMap.get(def.csvFile);
      if (!file) continue;
      const csvResult = await parseCsvFile(file);
      lookups.set(def.tableName, csvResult.data);
    }

    // 5. Resolve entities
    const entities = resolveAllEntities(relationships, entityIndices);

    // Add unrelated entities (entities without relationships)
    addUnrelatedEntities(entities, entityIndices, mappings);

    // 6. Load schemas
    const schemas = new Map<string, SchemaTable>();
    for (const [name, file] of this.fileMap.entries()) {
      if (name.endsWith('.json')) {
        try {
          report(name);
          const text = await file.text();
          const parsed = parseSchemaJson(text, name.replace('.json', ''));
          for (const [tableName, table] of parsed.entries()) {
            schemas.set(tableName, table);
          }
        } catch {
          // Skip invalid JSON schema files
        }
      }
    }

    // Report remaining files
    for (const [name] of csvFiles) {
      if (!neededCsvFiles.has(name) && name !== 'relationships_entity_relationship.csv' && name !== 'admin_users.csv') {
        report(name);
      }
    }

    return { entities, relationships, schemas, users, lookups };
  }
}

async function collectFiles(
  dirHandle: FileSystemDirectoryHandle,
  files: Map<string, File>,
  _prefix: string,
): Promise<void> {
  for await (const entry of dirHandle.values()) {
    if (entry.kind === 'file') {
      const file = await (entry as FileSystemFileHandle).getFile();
      files.set(file.name, file);
    } else if (entry.kind === 'directory') {
      await collectFiles(entry as FileSystemDirectoryHandle, files, entry.name + '/');
    }
  }
}
