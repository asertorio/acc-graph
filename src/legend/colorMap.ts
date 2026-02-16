import type { EntityType } from '../types/entities';

export const ENTITY_COLORS: Record<EntityType, { bg: string; border: string; text: string; dot: string; label: string }> = {
  issue:             { bg: '#fecaca', border: '#ef4444', text: '#991b1b', dot: '#ef4444', label: 'Issues' },
  asset:             { bg: '#bfdbfe', border: '#3b82f6', text: '#1e3a8a', dot: '#3b82f6', label: 'Assets' },
  photo:             { bg: '#bbf7d0', border: '#22c55e', text: '#14532d', dot: '#22c55e', label: 'Photos' },
  activity:          { bg: '#e9d5ff', border: '#a855f7', text: '#581c87', dot: '#a855f7', label: 'Activities' },
  rfi:               { bg: '#fde68a', border: '#f59e0b', text: '#78350f', dot: '#f59e0b', label: 'RFIs' },
  markup:            { bg: '#99f6e4', border: '#14b8a6', text: '#134e4a', dot: '#14b8a6', label: 'Markups' },
  form:              { bg: '#fbcfe8', border: '#ec4899', text: '#831843', dot: '#ec4899', label: 'Forms' },
  pco:               { bg: '#d9f99d', border: '#84cc16', text: '#365314', dot: '#84cc16', label: 'Change Orders' },
  documentlineage:   { bg: '#e5e7eb', border: '#6b7280', text: '#374151', dot: '#6b7280', label: 'Documents' },
  container:         { bg: '#e5e7eb', border: '#6b7280', text: '#374151', dot: '#6b7280', label: 'Containers' },
  scope:             { bg: '#e5e7eb', border: '#6b7280', text: '#374151', dot: '#6b7280', label: 'Scopes' },
  coordinationother: { bg: '#e5e7eb', border: '#6b7280', text: '#374151', dot: '#6b7280', label: 'Coordination' },
  unknown:           { bg: '#f3f4f6', border: '#9ca3af', text: '#4b5563', dot: '#9ca3af', label: 'Unknown' },
};

export function getEntityColor(type: EntityType) {
  return ENTITY_COLORS[type] || ENTITY_COLORS.unknown;
}
