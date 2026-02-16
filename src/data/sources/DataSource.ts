import type { EntityRecord, UserRecord } from '../../types/entities';
import type { Relationship } from '../../types/relationships';
import type { SchemaTable } from '../schemas/types';

export interface LoadProgress {
  current: number;
  total: number;
  currentFile: string;
}

export interface DataLoadResult {
  entities: Map<string, EntityRecord>;
  relationships: Relationship[];
  schemas: Map<string, SchemaTable>;
  users: UserRecord[];
  lookups: Map<string, Array<Record<string, string>>>;
}

export interface DataSource {
  loadAll(onProgress?: (progress: LoadProgress) => void): Promise<DataLoadResult>;
}
