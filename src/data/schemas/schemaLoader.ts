import type { SchemaColumn, SchemaTable } from './types';

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
