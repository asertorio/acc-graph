import type { EntityType } from './entities';

export type StatusFilterMode = 'all' | 'open' | 'closed';

export type FilterOperator = 'equals' | 'not_equals' | 'contains' | 'in' | 'not_in';

export interface MetadataFilter {
  fieldName: string;              // CSV column name
  operator: FilterOperator;
  value: string | string[];
  appliesTo?: EntityType[];       // Optional: limit to specific types
}

export interface FilterState {
  enabledEntityTypes: Set<EntityType>;
  selectedPersonIds: Set<string>;
  showRelatedOnly: boolean;
  statusFilter: StatusFilterMode;
  preserveConnectivity: boolean;
  connectivityIndicatorsEnabled: boolean;
  maxConnectivityDepth: number;
  metadataFilters: MetadataFilter[];
}
