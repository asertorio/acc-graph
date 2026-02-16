import type { DataSource, DataLoadResult, LoadProgress } from './DataSource';
import type { UserRecord } from '../../types/entities';
import type { SchemaTable } from '../schemas/types';
import { parseCsvText } from '../parsers/csvParser';
import { parseRelationships } from '../parsers/relationshipParser';
import { buildEntityIndex, resolveAllEntities, addUnrelatedEntities, type EntityIndex } from '../parsers/entityResolver';
import { getAllMappings } from '../../utils/domainMapper';
import { parseSchemaJson } from '../schemas/schemaLoader';
import { LOOKUP_TABLES } from '../../utils/lookupRegistry';

const DATA_DIR = '/autodesk_data_extract';

export class DevDataSource implements DataSource {
  async loadAll(onProgress?: (progress: LoadProgress) => void): Promise<DataLoadResult> {
    const mappings = getAllMappings();
    const neededCsvFiles = new Set(mappings.map(m => m.mapping.csvFile).filter(Boolean));
    neededCsvFiles.add('relationships_entity_relationship.csv');
    neededCsvFiles.add('admin_users.csv');

    const schemaFiles = [
      'activities.json', 'admin.json', 'assets.json', 'bridge.json',
      'checklists.json', 'cost.json', 'daily_logs.json', 'documents.json',
      'forms.json', 'issues.json', 'locations.json', 'markups.json',
      'model_coordination.json', 'photos.json', 'relationships.json',
      'rfis.json', 'schedule.json', 'sheets.json', 'submittals.json',
      'transmittals.json',
    ];

    const totalFiles = neededCsvFiles.size + schemaFiles.length;
    let processed = 0;

    const report = (fileName: string) => {
      processed++;
      onProgress?.({ current: processed, total: totalFiles, currentFile: fileName });
    };

    // 1. Parse relationships
    report('relationships_entity_relationship.csv');
    const relText = await fetchFile('relationships_entity_relationship.csv');
    const relCsv = parseCsvText(relText);
    const relationships = parseRelationships(relCsv);

    // 2. Parse entity CSVs
    const entityIndices = new Map<string, EntityIndex>();
    for (const csvFileName of neededCsvFiles) {
      if (csvFileName === 'relationships_entity_relationship.csv' || csvFileName === 'admin_users.csv') continue;
      report(csvFileName);
      try {
        const text = await fetchFile(csvFileName);
        const csvResult = parseCsvText(text);
        const mapping = mappings.find(m => m.mapping.csvFile === csvFileName);
        if (mapping) {
          const index = buildEntityIndex(csvResult, mapping.mapping.primaryKey);
          entityIndices.set(csvFileName, index);
        }
      } catch {
        // File might not exist
      }
    }

    // 3. Parse users
    report('admin_users.csv');
    let users: UserRecord[] = [];
    try {
      const usersText = await fetchFile('admin_users.csv');
      const usersCsv = parseCsvText(usersText);
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
    } catch {
      // Users file might not exist
    }

    // 4. Parse lookup CSVs
    const lookups = new Map<string, Array<Record<string, string>>>();
    for (const def of LOOKUP_TABLES) {
      try {
        const text = await fetchFile(def.csvFile);
        const csvResult = parseCsvText(text);
        lookups.set(def.tableName, csvResult.data);
      } catch {
        // Lookup file might not exist
      }
    }

    // 5. Resolve entities
    const entities = resolveAllEntities(relationships, entityIndices);

    // Add unrelated entities (entities without relationships)
    addUnrelatedEntities(entities, entityIndices, mappings);

    // 6. Load schemas
    const schemas = new Map<string, SchemaTable>();
    for (const schemaFile of schemaFiles) {
      report(schemaFile);
      try {
        const text = await fetchFile(`schemas/${schemaFile}`);
        const parsed = parseSchemaJson(text, schemaFile.replace('.json', ''));
        for (const [tableName, table] of parsed.entries()) {
          schemas.set(tableName, table);
        }
      } catch {
        // Schema might not exist
      }
    }

    return { entities, relationships, schemas, users, lookups };
  }
}

async function fetchFile(name: string): Promise<string> {
  const res = await fetch(`${DATA_DIR}/${name}`);
  if (!res.ok) throw new Error(`Failed to fetch ${name}: ${res.status}`);
  return res.text();
}
