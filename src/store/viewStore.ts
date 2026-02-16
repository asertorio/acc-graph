import { create } from 'zustand';
import type { SavedView } from '../types/views';
import type { EntityType } from '../types/entities';
import { useFilterStore } from './filterStore';
import { useGraphStore } from './graphStore';

const STORAGE_KEY = 'acc-graph-saved-views';

function loadFromStorage(): SavedView[] {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return [];
    return JSON.parse(raw) as SavedView[];
  } catch {
    return [];
  }
}

function saveToStorage(views: SavedView[]) {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(views));
}

interface ViewState {
  savedViews: SavedView[];
  saveCurrentView: (name: string) => void;
  loadView: (id: string) => void;
  deleteView: (id: string) => void;
}

export const useViewStore = create<ViewState>((set, get) => ({
  savedViews: loadFromStorage(),

  saveCurrentView: (name) => {
    const filterState = useFilterStore.getState();
    const graphState = useGraphStore.getState();

    const view: SavedView = {
      id: crypto.randomUUID(),
      name,
      createdAt: Date.now(),
      enabledEntityTypes: [...filterState.enabledEntityTypes] as EntityType[],
      selectedPersonIds: [...filterState.selectedPersonIds],
      showRelatedOnly: filterState.showRelatedOnly,
      focusedEntityType: filterState.focusedEntityType,
      statusFilter: filterState.statusFilter,
      preserveConnectivity: filterState.preserveConnectivity,
      metadataFilters: filterState.metadataFilters,
      layout: graphState.layout,
      spacingFactor: graphState.spacingFactor,
      clusterHighlight: graphState.clusterHighlight,
    };

    const next = [...get().savedViews, view];
    saveToStorage(next);
    set({ savedViews: next });
  },

  loadView: (id) => {
    const view = get().savedViews.find((v) => v.id === id);
    if (!view) return;

    const filterStore = useFilterStore.getState();
    filterStore.setAllEntityTypes(view.enabledEntityTypes);
    filterStore.setSelectedPersons(view.selectedPersonIds);
    filterStore.setShowRelatedOnly(view.showRelatedOnly);
    filterStore.setFocusedEntityType(view.focusedEntityType);
    if (view.statusFilter !== undefined) filterStore.setStatusFilter(view.statusFilter);
    if (view.preserveConnectivity !== undefined) filterStore.setPreserveConnectivity(view.preserveConnectivity);
    if (view.metadataFilters !== undefined) {
      filterStore.clearMetadataFilters();
      for (const f of view.metadataFilters) {
        filterStore.addMetadataFilter(f);
      }
    }

    const graphStore = useGraphStore.getState();
    graphStore.setLayout(view.layout);
    graphStore.setSpacingFactor(view.spacingFactor);
    if (view.clusterHighlight !== undefined) graphStore.setClusterHighlight(view.clusterHighlight);
  },

  deleteView: (id) => {
    const next = get().savedViews.filter((v) => v.id !== id);
    saveToStorage(next);
    set({ savedViews: next });
  },
}));
