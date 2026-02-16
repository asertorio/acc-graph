/** Module-level singleton maps for resolving foreign-key IDs to human-readable labels. */

// tableName → (id → displayLabel)
let lookups: Map<string, Map<string, string>> = new Map();

export interface LookupTableDef {
  tableName: string;
  csvFile: string;
  keyColumn: string;
  valueColumn: string;
}

export const LOOKUP_TABLES: LookupTableDef[] = [
  { tableName: 'issueTypes', csvFile: 'issues_issue_types.csv', keyColumn: 'issue_type_id', valueColumn: 'issue_type' },
  { tableName: 'issueSubtypes', csvFile: 'issues_issue_subtypes.csv', keyColumn: 'issue_subtype_id', valueColumn: 'issue_subtype' },
  { tableName: 'rootCauses', csvFile: 'issues_root_causes.csv', keyColumn: 'root_cause_id', valueColumn: 'title' },
  { tableName: 'rootCauseCategories', csvFile: 'issues_root_cause_categories.csv', keyColumn: 'root_cause_category_id', valueColumn: 'root_cause_category' },
  { tableName: 'locations', csvFile: 'locations_nodes.csv', keyColumn: 'id', valueColumn: 'name' },
  { tableName: 'assetCategories', csvFile: 'assets_categories.csv', keyColumn: 'id', valueColumn: 'name' },
  { tableName: 'assetStatuses', csvFile: 'assets_asset_statuses.csv', keyColumn: 'id', valueColumn: 'label' },
  { tableName: 'formTemplates', csvFile: 'forms_form_templates.csv', keyColumn: 'id', valueColumn: 'name' },
  { tableName: 'companies', csvFile: 'admin_companies.csv', keyColumn: 'id', valueColumn: 'name' },
];

export function setLookups(data: Map<string, Array<Record<string, string>>>): void {
  lookups = new Map();
  for (const def of LOOKUP_TABLES) {
    const rows = data.get(def.tableName);
    if (!rows) continue;
    const map = new Map<string, string>();
    for (const row of rows) {
      const key = row[def.keyColumn];
      const value = row[def.valueColumn];
      if (key && value) map.set(key, value);
    }
    lookups.set(def.tableName, map);
  }
}

export function resolveLookup(tableName: string, id: string): string | null {
  if (!id) return null;
  return lookups.get(tableName)?.get(id) ?? null;
}
