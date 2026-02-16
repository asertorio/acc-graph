import type { SchemaColumn, SchemaTable } from './types';

let registry = new Map<string, SchemaTable>();

export function setSchemaRegistry(schemas: Map<string, SchemaTable>): void {
  registry = schemas;
}

export function getTableSchema(tableName: string): SchemaTable | undefined {
  return registry.get(tableName);
}

export function getColumnSchema(tableName: string, columnName: string): SchemaColumn | undefined {
  return registry.get(tableName)?.columns[columnName];
}

export function getOrderedColumns(tableName: string): Array<{ name: string; schema: SchemaColumn }> {
  const table = registry.get(tableName);
  if (!table) return [];
  return Object.entries(table.columns)
    .map(([name, schema]) => ({ name, schema }))
    .sort((a, b) => a.schema.ordinal_position - b.schema.ordinal_position);
}

export function getTableNameForCsv(csvFile: string): string | undefined {
  const baseName = csvFile.replace('.csv', '');
  // Direct match: issues_issues -> issues_issues
  if (registry.has(baseName)) return baseName;
  // Strip module prefix: issues_issues -> issues, assets_assets -> assets
  const parts = baseName.split('_');
  if (parts.length >= 2) {
    const withoutPrefix = parts.slice(1).join('_');
    if (registry.has(withoutPrefix)) return withoutPrefix;
  }
  // Try all registered table names
  for (const [tableName] of registry) {
    if (baseName.endsWith('_' + tableName) || baseName === tableName) return tableName;
  }
  return undefined;
}
