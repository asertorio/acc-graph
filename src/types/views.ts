import type { EntityType } from './entities';
import type { LayoutName } from './graph';
import type { StatusFilterMode, MetadataFilter } from './filters';

export interface SavedView {
  id: string;
  name: string;
  createdAt: number;
  enabledEntityTypes: EntityType[];
  selectedPersonIds: string[];
  showRelatedOnly: boolean;
  focusedEntityType: EntityType | null;
  statusFilter: StatusFilterMode;
  preserveConnectivity: boolean;
  metadataFilters: MetadataFilter[];
  layout: LayoutName;
  spacingFactor: number;
  clusterHighlight: boolean;
}
