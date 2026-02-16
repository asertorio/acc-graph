import type { EntityRecord } from '../types/entities';
import type { Relationship } from '../types/relationships';
import type { GraphElements, GraphNode, GraphEdge } from '../types/graph';
import type { FilterState, MetadataFilter } from '../types/filters';
import { buildImpliedEdges } from './impliedEdgeBuilder';
import { applyAllMetadataFilters, statusFilterToMetadataFilter } from '../filters/metadataFilters';

export function buildGraphElements(
  entities: Map<string, EntityRecord>,
  relationships: Relationship[],
  filters: FilterState,
): GraphElements {
  const {
    enabledEntityTypes,
    selectedPersonIds,
    showRelatedOnly,
    statusFilter,
    preserveConnectivity,
    metadataFilters,
  } = filters;

  // Build combined metadata filters (status filter + custom metadata filters)
  const allMetadataFilters: MetadataFilter[] = metadataFilters ? [...metadataFilters] : [];
  const statusMetadataFilter = statusFilterToMetadataFilter(statusFilter);
  if (statusMetadataFilter) {
    allMetadataFilters.push(statusMetadataFilter);
  }

  // First, identify all entities that pass entity type and metadata filters
  // These are "candidate" nodes that could be visible
  const candidateIds = new Set<string>();
  for (const [id, entity] of entities) {
    if (!enabledEntityTypes.has(entity.entityType)) continue;

    // Apply all metadata filters (status + custom)
    if (!applyAllMetadataFilters(entity, allMetadataFilters)) continue;

    candidateIds.add(id);
  }

  // Track which entity IDs are connected via relationships
  const connectedIds = new Set<string>();
  const validEdges: GraphEdge[] = [];

  // Build edges between candidate entities
  for (const rel of relationships) {
    const id1 = `${rel.item1Domain}:${rel.item1EntityType}:${rel.item1Id}`;
    const id2 = `${rel.item2Domain}:${rel.item2EntityType}:${rel.item2Id}`;

    const entity1 = entities.get(id1);
    const entity2 = entities.get(id2);

    if (!entity1 || !entity2) continue;

    // Both must be candidates (pass entity type and status filters)
    if (!candidateIds.has(id1)) continue;
    if (!candidateIds.has(id2)) continue;

    // Person filter - at least one endpoint must match
    if (selectedPersonIds.size > 0) {
      const e1HasPerson = entityMatchesPerson(entity1, selectedPersonIds);
      const e2HasPerson = entityMatchesPerson(entity2, selectedPersonIds);
      if (!e1HasPerson && !e2HasPerson) continue;
    }

    connectedIds.add(id1);
    connectedIds.add(id2);

    validEdges.push({
      data: {
        id: `edge-${rel.relationshipGuid}`,
        source: id1,
        target: id2,
        relationshipGuid: rel.relationshipGuid,
      },
    });
  }

  // If preserve connectivity is enabled, find implied edges between candidate nodes
  // This creates edges between candidates that are connected through non-candidates (filtered-out nodes)
  let impliedEdges: GraphEdge[] = [];
  if (preserveConnectivity) {
    impliedEdges = buildImpliedEdges(candidateIds, entities, relationships, 5);
    // Add source and target of implied edges to connectedIds
    for (const edge of impliedEdges) {
      connectedIds.add(edge.data.source);
      connectedIds.add(edge.data.target);
    }
  }

  // Build nodes from candidate entities
  const nodes: GraphNode[] = [];
  for (const id of candidateIds) {
    const entity = entities.get(id);
    if (!entity) continue;

    // If "show related only" is enabled, only include connected nodes
    if (showRelatedOnly && !connectedIds.has(id)) continue;

    // Person filter on individual nodes: show if matches person OR is connected
    if (selectedPersonIds.size > 0 && !entityMatchesPerson(entity, selectedPersonIds) && !connectedIds.has(id)) {
      continue;
    }

    nodes.push({
      data: {
        id,
        entityType: entity.entityType,
        domain: entity.domain,
        displayName: entity.displayName || entity.entityType,
        isOpaque: entity.isOpaque,
      },
      classes: entity.isOpaque ? 'opaque' : undefined,
    });
  }

  // Combine edges
  const nodeIds = new Set(nodes.map(n => n.data.id));
  const edges = [
    ...validEdges.filter(e => nodeIds.has(e.data.source) && nodeIds.has(e.data.target)),
    ...impliedEdges.filter(e => nodeIds.has(e.data.source) && nodeIds.has(e.data.target)),
  ];

  return { nodes, edges };
}

function entityMatchesPerson(entity: EntityRecord, personIds: Set<string>): boolean {
  for (const col of entity.personFields) {
    const val = entity.fields[col];
    if (val && personIds.has(val)) return true;
  }
  return false;
}

export function getEntityTypeCounts(entities: Map<string, EntityRecord>): Map<string, number> {
  const counts = new Map<string, number>();
  for (const entity of entities.values()) {
    counts.set(entity.entityType, (counts.get(entity.entityType) || 0) + 1);
  }
  return counts;
}
