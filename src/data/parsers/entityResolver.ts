import type { EntityRecord, EntityType } from '../../types/entities';
import type { Relationship } from '../../types/relationships';
import type { CsvParseResult } from './csvParser';
import { getDomainMapping, resolveEntityType, type DomainMapping } from '../../utils/domainMapper';

export interface EntityIndex {
  byKey: Map<string, Record<string, string>>;
}

export function buildEntityIndex(
  csvResult: CsvParseResult,
  primaryKey: string | string[],
): EntityIndex {
  const byKey = new Map<string, Record<string, string>>();

  for (const row of csvResult.data) {
    let key: string;
    if (Array.isArray(primaryKey)) {
      key = primaryKey.map(k => row[k] ?? '').join('-');
    } else {
      key = row[primaryKey] ?? '';
    }
    if (key) {
      byKey.set(key, row);
    }
  }

  return { byKey };
}

export function resolveEntity(
  domain: string,
  entityType: string,
  entityId: string,
  entityIndices: Map<string, EntityIndex>,
): EntityRecord {
  const mapping = getDomainMapping(domain, entityType);
  const resolvedType = resolveEntityType(domain, entityType);

  if (!mapping || !mapping.csvFile) {
    return {
      id: `${domain}:${entityType}:${entityId}`,
      entityType: resolvedType,
      domain,
      displayName: entityId.length > 40 ? entityId.slice(0, 40) + '...' : entityId,
      fields: {},
      personFields: [],
      isOpaque: true,
    };
  }

  const index = entityIndices.get(mapping.csvFile);
  const row = index?.byKey.get(entityId);

  if (!row) {
    return {
      id: `${domain}:${entityType}:${entityId}`,
      entityType: resolvedType,
      domain,
      displayName: entityId.length > 40 ? entityId.slice(0, 40) + '...' : entityId,
      fields: {},
      personFields: mapping.personColumns,
      isOpaque: true,
    };
  }

  const displayName = row[mapping.displayNameColumn] || entityId;

  return {
    id: `${domain}:${entityType}:${entityId}`,
    entityType: resolvedType,
    domain,
    displayName,
    fields: { ...row },
    personFields: mapping.personColumns,
    isOpaque: false,
  };
}

export function resolveAllEntities(
  relationships: Relationship[],
  entityIndices: Map<string, EntityIndex>,
): Map<string, EntityRecord> {
  const entities = new Map<string, EntityRecord>();

  for (const rel of relationships) {
    const id1 = `${rel.item1Domain}:${rel.item1EntityType}:${rel.item1Id}`;
    if (!entities.has(id1)) {
      entities.set(id1, resolveEntity(rel.item1Domain, rel.item1EntityType, rel.item1Id, entityIndices));
    }

    const id2 = `${rel.item2Domain}:${rel.item2EntityType}:${rel.item2Id}`;
    if (!entities.has(id2)) {
      entities.set(id2, resolveEntity(rel.item2Domain, rel.item2EntityType, rel.item2Id, entityIndices));
    }
  }

  return entities;
}

export function addUnrelatedEntities(
  entities: Map<string, EntityRecord>,
  entityIndices: Map<string, EntityIndex>,
  mappings: Array<{ domain: string; entityType: string; mapping: DomainMapping }>,
): void {
  for (const { domain, entityType, mapping } of mappings) {
    // Skip mappings without a CSV file (opaque entities)
    if (!mapping.csvFile) continue;

    const index = entityIndices.get(mapping.csvFile);
    if (!index) continue;

    // Iterate through all rows in the index
    for (const [primaryKey, row] of index.byKey.entries()) {
      const compositeId = `${domain}:${entityType}:${primaryKey}`;

      // Only add if not already present
      if (!entities.has(compositeId)) {
        const displayName = row[mapping.displayNameColumn] || primaryKey;

        entities.set(compositeId, {
          id: compositeId,
          entityType: mapping.entityType,
          domain,
          displayName,
          fields: { ...row },
          personFields: mapping.personColumns,
          isOpaque: false,
        });
      }
    }
  }
}
