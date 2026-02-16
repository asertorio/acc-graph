import type { EntityRecord } from '../types/entities';

export type StatusFilterMode = 'all' | 'open' | 'closed';
export type ItemStatus = 'open' | 'closed' | 'unknown';

// Map entity types to their open/closed status values
const OPEN_STATUS_VALUES: Record<string, Set<string>> = {
  issue: new Set([
    'open',
    'work_completed',
    'ready_to_inspect',
    'not_approved',
    'in_dispute',
    'answered',
    'draft',
    'pending',
    'in_progress',
  ]),
  coordinationother: new Set([
    'open',
    'work_completed',
    'ready_to_inspect',
    'not_approved',
    'in_dispute',
    'answered',
    'draft',
    'pending',
    'in_progress',
  ]),
  rfi: new Set(['draft', 'submitted', 'open', 'openRev1', 'openRev2', 'answeredManager']),
  form: new Set(['in_progress']),
};

const CLOSED_STATUS_VALUES: Record<string, Set<string>> = {
  issue: new Set(['closed', 'void', 'completed', 'in_review']),
  coordinationother: new Set(['closed', 'void', 'completed', 'in_review']),
  rfi: new Set(['answered', 'answeredRev1', 'closed']),
  form: new Set(['closed', 'archived', 'discarded']),
};

/**
 * Determines if an entity has a status field that we can filter on.
 * Only Issues, RFIs, and Forms have status fields.
 */
export function entityHasStatus(entity: EntityRecord): boolean {
  const statusField = entity.fields['status'];
  if (!statusField) return false;

  // Check if this entity type has known status values
  return (
    OPEN_STATUS_VALUES[entity.entityType] !== undefined ||
    CLOSED_STATUS_VALUES[entity.entityType] !== undefined
  );
}

/**
 * Gets the status of an entity (open, closed, or unknown).
 */
export function getItemStatus(entity: EntityRecord): ItemStatus {
  const statusField = entity.fields['status'];
  if (!statusField) return 'unknown';

  const statusValue = statusField.toLowerCase().trim();

  // Check if it's an open status
  const openSet = OPEN_STATUS_VALUES[entity.entityType];
  if (openSet && openSet.has(statusValue)) {
    return 'open';
  }

  // Check if it's a closed status
  const closedSet = CLOSED_STATUS_VALUES[entity.entityType];
  if (closedSet && closedSet.has(statusValue)) {
    return 'closed';
  }

  return 'unknown';
}

/**
 * Checks if an entity passes the status filter.
 * Entities without status fields always pass through.
 */
export function entityPassesStatusFilter(
  entity: EntityRecord,
  statusFilter: StatusFilterMode
): boolean {
  // If filtering is disabled (all), pass through
  if (statusFilter === 'all') return true;

  // If entity doesn't have a status field, pass through
  // (Assets, Photos, Activities, Markups, etc. are always visible)
  if (!entityHasStatus(entity)) return true;

  // Apply status filter
  const itemStatus = getItemStatus(entity);

  // Unknown statuses pass through (we don't want to hide items with unexpected status values)
  if (itemStatus === 'unknown') return true;

  return itemStatus === statusFilter;
}
