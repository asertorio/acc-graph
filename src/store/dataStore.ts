import { create } from 'zustand';
import type { EntityRecord, UserRecord } from '../types/entities';
import type { Relationship } from '../types/relationships';
import type { SchemaTable } from '../data/schemas/types';
import type { LoadProgress } from '../data/sources/DataSource';

interface DataState {
  entities: Map<string, EntityRecord>;
  relationships: Relationship[];
  schemas: Map<string, SchemaTable>;
  users: UserRecord[];
  isLoading: boolean;
  loadProgress: LoadProgress | null;
  error: string | null;
  isLoaded: boolean;

  setEntities: (entities: Map<string, EntityRecord>) => void;
  setRelationships: (relationships: Relationship[]) => void;
  setSchemas: (schemas: Map<string, SchemaTable>) => void;
  setUsers: (users: UserRecord[]) => void;
  setLoading: (loading: boolean) => void;
  setLoadProgress: (progress: LoadProgress | null) => void;
  setError: (error: string | null) => void;
  setLoaded: (loaded: boolean) => void;
  reset: () => void;
}

export const useDataStore = create<DataState>((set) => ({
  entities: new Map(),
  relationships: [],
  schemas: new Map(),
  users: [],
  isLoading: false,
  loadProgress: null,
  error: null,
  isLoaded: false,

  setEntities: (entities) => set({ entities }),
  setRelationships: (relationships) => set({ relationships }),
  setSchemas: (schemas) => set({ schemas }),
  setUsers: (users) => set({ users }),
  setLoading: (isLoading) => set({ isLoading }),
  setLoadProgress: (loadProgress) => set({ loadProgress }),
  setError: (error) => set({ error }),
  setLoaded: (isLoaded) => set({ isLoaded }),
  reset: () =>
    set({
      entities: new Map(),
      relationships: [],
      schemas: new Map(),
      users: [],
      isLoading: false,
      loadProgress: null,
      error: null,
      isLoaded: false,
    }),
}));
