import type { SchemaColumn, SchemaTable } from './types';

/** Curated list of valid schema files in the autodesk data extract schemas/ folder.
 *  Excludes schema.json (nested module→table→column structure that doesn't match
 *  the expected table→column format), cdc* variants, and verb_column_details files. */
export const SCHEMA_FILES = [
  'activities.json', 'admin.json', 'assets.json', 'bridge.json',
  'checklists.json', 'cost.json', 'daily_logs.json', 'documents.json',
  'forms.json', 'issues.json', 'locations.json', 'markups.json',
  'model_coordination.json', 'photos.json', 'relationships.json',
  'rfis.json', 'schedule.json', 'sheets.json', 'submittals.json',
  'transmittals.json',
] as const;

export function parseSchemaJson(jsonText: string, fileName: string): Map<string, SchemaTable> {
  const tables = new Map<string, SchemaTable>();
  try {
    const parsed = JSON.parse(jsonText);
    if (typeof parsed !== 'object' || parsed === null) return tables;

    for (const [tableName, columns] of Object.entries(parsed)) {
      if (typeof columns !== 'object' || columns === null) continue;
      const schemaTable: SchemaTable = {
        name: tableName,
        columns: columns as Record<string, SchemaColumn>,
      };
      tables.set(tableName, schemaTable);
    }
  } catch {
    // Invalid JSON - skip
  }
  return tables;
}
