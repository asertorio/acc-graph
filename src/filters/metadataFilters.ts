import type { EntityRecord } from '../types/entities';
import type { MetadataFilter, FilterOperator } from '../types/filters';

/**
 * Applies a single metadata filter to an entity.
 * Returns true if the entity passes the filter (should be included).
 */
export function applyMetadataFilter(
  entity: EntityRecord,
  filter: MetadataFilter
): boolean {
  // Check if filter applies to this entity type
  if (filter.appliesTo && filter.appliesTo.length > 0) {
    if (!filter.appliesTo.includes(entity.entityType)) {
      return true; // Filter doesn't apply to this entity type, pass through
    }
  }

  const fieldValue = entity.fields[filter.fieldName];

  // Handle missing field values
  if (fieldValue === undefined || fieldValue === null || fieldValue === '') {
    // If field is missing, fail filters that require a value
    return filter.operator === 'not_equals' || filter.operator === 'not_in';
  }

  // Apply operator logic
  switch (filter.operator) {
    case 'equals':
      return fieldValue === filter.value;

    case 'not_equals':
      return fieldValue !== filter.value;

    case 'contains':
      if (typeof filter.value !== 'string') return false;
      return fieldValue.toLowerCase().includes(filter.value.toLowerCase());

    case 'in':
      if (!Array.isArray(filter.value)) return false;
      return filter.value.some(v =>
        fieldValue.toLowerCase() === v.toLowerCase()
      );

    case 'not_in':
      if (!Array.isArray(filter.value)) return true;
      return !filter.value.some(v =>
        fieldValue.toLowerCase() === v.toLowerCase()
      );

    default:
      return true;
  }
}

/**
 * Applies all metadata filters to an entity.
 * Returns true if the entity passes ALL filters (AND logic).
 */
export function applyAllMetadataFilters(
  entity: EntityRecord,
  filters: MetadataFilter[]
): boolean {
  // Handle empty or undefined filters array
  if (!filters || filters.length === 0) {
    return true;
  }

  for (const filter of filters) {
    if (!applyMetadataFilter(entity, filter)) {
      return false;
    }
  }
  return true;
}

/**
 * Converts status filter to metadata filter for uniform processing.
 */
export function statusFilterToMetadataFilter(
  statusFilterMode: string
): MetadataFilter | null {
  if (statusFilterMode === 'all') {
    return null; // No filter
  }

  // Get the status values for open vs closed
  const openStatusValues = [
    'open',
    'work_completed',
    'ready_to_inspect',
    'not_approved',
    'in_dispute',
    'answered',
    'draft',
    'pending',
    'in_progress',
  ];

  const closedStatusValues = [
    'closed',
    'void',
    'completed',
    'in_review',
    'archived',
    'discarded',
    'answeredRev1',
  ];

  const values = statusFilterMode === 'open' ? openStatusValues : closedStatusValues;

  return {
    fieldName: 'status',
    operator: 'in',
    value: values,
    appliesTo: ['issue', 'rfi', 'form', 'coordinationother'],
  };
}
