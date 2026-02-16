import type { EntityRecord } from '../types/entities';

export function getPersonIdsFromEntities(entities: Map<string, EntityRecord>): Set<string> {
  const personIds = new Set<string>();
  for (const entity of entities.values()) {
    for (const col of entity.personFields) {
      const val = entity.fields[col];
      if (val) personIds.add(val);
    }
  }
  return personIds;
}
