/** Central config for field display rules in the detail panel. */

// Fields that are always hidden regardless of entity type
const GLOBAL_HIDDEN_FIELDS = new Set([
  'bim360_account_id',
  'bim360_project_id',
  'deleted_at',
  'deleted_by',
  'snapshot_urn',
  'linked_document_urn',
]);

// Primary key columns per entity type (the entity's own ID — not useful to display)
const PRIMARY_KEY_FIELDS = new Set([
  'issue_id',
  'id',
  'uid',
]);

export function isFieldHidden(fieldName: string): boolean {
  return GLOBAL_HIDDEN_FIELDS.has(fieldName) || PRIMARY_KEY_FIELDS.has(fieldName);
}

// Maps field name → lookup table name in lookupRegistry
export const ENRICHED_FIELDS: Record<string, string> = {
  type_id: 'issueTypes',
  subtype_id: 'issueSubtypes',
  root_cause_id: 'rootCauses',
  root_cause_category_id: 'rootCauseCategories',
  location_id: 'locations',
  category_id: 'assetCategories',
  status_id: 'assetStatuses',
  template_id: 'formTemplates',
  company_id: 'companies',
};

const ACRONYMS: Record<string, string> = {
  id: 'ID',
  rfi: 'RFI',
  url: 'URL',
  uid: 'UID',
  wbs: 'WBS',
  gps: 'GPS',
  pco: 'PCO',
};

export function formatFieldName(name: string, isEnriched: boolean): string {
  let formatted = name
    .split('_')
    .map((word) => ACRONYMS[word.toLowerCase()] ?? (word.charAt(0).toUpperCase() + word.slice(1)))
    .join(' ');

  // Strip trailing " Id" or " ID" when the field is an enriched lookup
  if (isEnriched) {
    formatted = formatted.replace(/ ID$/i, '');
  }

  return formatted;
}
