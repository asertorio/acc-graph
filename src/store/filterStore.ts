import { create } from 'zustand';
import type { EntityType } from '../types/entities';
import type { StatusFilterMode, MetadataFilter } from '../types/filters';

interface FilterState {
  enabledEntityTypes: Set<EntityType>;
  selectedPersonIds: Set<string>;
  showRelatedOnly: boolean;
  focusedEntityType: EntityType | null;
  statusFilter: StatusFilterMode;
  preserveConnectivity: boolean;
  metadataFilters: MetadataFilter[];

  toggleEntityType: (type: EntityType) => void;
  setAllEntityTypes: (types: EntityType[]) => void;
  clearEntityTypes: () => void;
  togglePerson: (personId: string) => void;
  setSelectedPersons: (personIds: string[]) => void;
  clearPersons: () => void;
  setShowRelatedOnly: (show: boolean) => void;
  setFocusedEntityType: (type: EntityType | null) => void;
  toggleFocusedEntityType: (type: EntityType) => void;
  setStatusFilter: (mode: StatusFilterMode) => void;
  setPreserveConnectivity: (preserve: boolean) => void;
  addMetadataFilter: (filter: MetadataFilter) => void;
  removeMetadataFilter: (index: number) => void;
  clearMetadataFilters: () => void;
  resetFilters: () => void;
}

const ALL_ENTITY_TYPES: EntityType[] = [
  'issue', 'asset', 'photo', 'activity', 'rfi', 'markup',
  'form', 'pco', 'documentlineage', 'container', 'scope', 'coordinationother', 'unknown',
];

export const useFilterStore = create<FilterState>((set) => ({
  enabledEntityTypes: new Set(ALL_ENTITY_TYPES),
  selectedPersonIds: new Set(),
  showRelatedOnly: true,
  focusedEntityType: null,
  statusFilter: 'all',
  preserveConnectivity: false,
  metadataFilters: [],

  toggleEntityType: (type) =>
    set((state) => {
      const next = new Set(state.enabledEntityTypes);
      if (next.has(type)) {
        next.delete(type);
      } else {
        next.add(type);
      }
      return { enabledEntityTypes: next };
    }),

  setAllEntityTypes: (types) => set({ enabledEntityTypes: new Set(types) }),

  clearEntityTypes: () => set({ enabledEntityTypes: new Set() }),

  togglePerson: (personId) =>
    set((state) => {
      const next = new Set(state.selectedPersonIds);
      if (next.has(personId)) {
        next.delete(personId);
      } else {
        next.add(personId);
      }
      return { selectedPersonIds: next };
    }),

  setSelectedPersons: (personIds) => set({ selectedPersonIds: new Set(personIds) }),

  clearPersons: () => set({ selectedPersonIds: new Set() }),

  setShowRelatedOnly: (show) => set({ showRelatedOnly: show }),

  setFocusedEntityType: (type) => set({ focusedEntityType: type }),

  toggleFocusedEntityType: (type) =>
    set((state) => ({
      focusedEntityType: state.focusedEntityType === type ? null : type,
    })),

  setStatusFilter: (mode) => set({ statusFilter: mode }),

  setPreserveConnectivity: (preserve) => set({ preserveConnectivity: preserve }),

  addMetadataFilter: (filter) =>
    set((state) => ({ metadataFilters: [...state.metadataFilters, filter] })),

  removeMetadataFilter: (index) =>
    set((state) => ({
      metadataFilters: state.metadataFilters.filter((_, i) => i !== index),
    })),

  clearMetadataFilters: () => set({ metadataFilters: [] }),

  resetFilters: () =>
    set({
      enabledEntityTypes: new Set(ALL_ENTITY_TYPES),
      selectedPersonIds: new Set(),
      showRelatedOnly: true,
      focusedEntityType: null,
      statusFilter: 'all',
      preserveConnectivity: false,
      metadataFilters: [],
    }),
}));
