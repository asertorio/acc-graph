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
      layout: graphState.layout,
      spacingFactor: graphState.spacingFactor,
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

    const graphStore = useGraphStore.getState();
    graphStore.setLayout(view.layout);
    graphStore.setSpacingFactor(view.spacingFactor);
  },

  deleteView: (id) => {
    const next = get().savedViews.filter((v) => v.id !== id);
    saveToStorage(next);
    set({ savedViews: next });
  },
}));
