import type { EntityType } from './entities';
import type { LayoutName } from './graph';

export interface SavedView {
  id: string;
  name: string;
  createdAt: number;
  enabledEntityTypes: EntityType[];
  selectedPersonIds: string[];
  showRelatedOnly: boolean;
  focusedEntityType: EntityType | null;
  layout: LayoutName;
  spacingFactor: number;
}
