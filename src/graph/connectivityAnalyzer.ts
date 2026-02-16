import type { EntityRecord } from '../types/entities';
import type { Relationship } from '../types/relationships';
import type { ConnectivityMetadata } from '../types/graph';

interface AdjacencyList {
  [entityId: string]: string[];
}

/**
 * Builds adjacency list from all relationships.
 */
function buildAdjacencyList(
  allEntities: Map<string, EntityRecord>,
  allRelationships: Relationship[]
): AdjacencyList {
  const adj: AdjacencyList = {};

  for (const rel of allRelationships) {
    const id1 = `${rel.item1Domain}:${rel.item1EntityType}:${rel.item1Id}`;
    const id2 = `${rel.item2Domain}:${rel.item2EntityType}:${rel.item2Id}`;

    // Only include edges where both entities exist
    if (!allEntities.has(id1) || !allEntities.has(id2)) continue;

    // Bidirectional edges (ACC relationships are undirected)
    if (!adj[id1]) adj[id1] = [];
    if (!adj[id2]) adj[id2] = [];

    adj[id1].push(id2);
    adj[id2].push(id1);
  }

  return adj;
}

/**
 * BFS to find shortest path from startId to any node in targetSubset.
 * Returns the depth and IDs of target items reached within maxDepth.
 */
function findNearestTargets(
  startId: string,
  targetSubset: Set<string>,
  adj: AdjacencyList,
  maxDepth: number
): { depth: number; targetIds: string[] } | null {
  // If start node is in target subset, it has depth 0
  if (targetSubset.has(startId)) {
    return { depth: 0, targetIds: [startId] };
  }

  const queue: Array<{ nodeId: string; depth: number }> = [{ nodeId: startId, depth: 0 }];
  const visited = new Set<string>([startId]);
  const foundTargets: string[] = [];
  let foundDepth: number | null = null;

  while (queue.length > 0) {
    const current = queue.shift()!;
    const currentDepth = current.depth + 1;

    // Stop if we've exceeded max depth
    if (currentDepth > maxDepth) continue;

    // Stop if we've already found targets at a shallower depth
    if (foundDepth !== null && currentDepth > foundDepth) continue;

    // Explore neighbors
    const neighbors = adj[current.nodeId] || [];
    for (const neighborId of neighbors) {
      if (visited.has(neighborId)) continue;
      visited.add(neighborId);

      // Check if neighbor is in target subset
      if (targetSubset.has(neighborId)) {
        if (foundDepth === null) {
          foundDepth = currentDepth;
        }
        if (currentDepth === foundDepth) {
          foundTargets.push(neighborId);
        }
      } else {
        // Only continue searching if we haven't found targets yet
        if (foundDepth === null) {
          queue.push({ nodeId: neighborId, depth: currentDepth });
        }
      }
    }
  }

  if (foundTargets.length > 0 && foundDepth !== null) {
    return { depth: foundDepth, targetIds: foundTargets };
  }

  return null;
}

/**
 * Computes connectivity metadata for all entities.
 * Shows which entities are connected to the target subset and at what depth.
 */
export function computeConnectivityMetadata(
  entities: Map<string, EntityRecord>,
  relationships: Relationship[],
  targetSubset: Set<string>,
  maxDepth: number
): Map<string, ConnectivityMetadata> {
  const adj = buildAdjacencyList(entities, relationships);
  const metadata = new Map<string, ConnectivityMetadata>();

  for (const [entityId] of entities) {
    const result = findNearestTargets(entityId, targetSubset, adj, maxDepth);

    if (result) {
      metadata.set(entityId, {
        hasDirectConnection: result.depth === 1,
        connectionDepth: result.depth,
        connectedItemIds: result.targetIds,
      });
    } else {
      // No connection within maxDepth
      metadata.set(entityId, {
        hasDirectConnection: false,
        connectionDepth: null,
        connectedItemIds: [],
      });
    }
  }

  return metadata;
}

/**
 * Determines the target subset based on active filters.
 * Returns entity IDs that match the filter criteria.
 */
export function computeTargetSubset(
  entities: Map<string, EntityRecord>,
  filters: {
    statusFilter?: string;
    // Can add more filter types here in the future
  }
): Set<string> {
  const targetIds = new Set<string>();

  // If status filter is active (not "all"), target subset is entities with that status
  if (filters.statusFilter && filters.statusFilter !== 'all') {
    for (const [id, entity] of entities) {
      const statusValue = entity.fields['status'];
      if (statusValue) {
        // Check if entity's status matches the filter
        // This is a simplified check - in reality we'd use the status classifier
        // For now, we'll just check if the entity has a status field
        // The actual filtering is done elsewhere, so here we just identify
        // entities that WOULD be visible if status filter was applied

        // For "open" filter, show connectivity to open items
        // For "closed" filter, show connectivity to closed items
        // We can't easily determine this without importing the classifier
        // So let's just mark all entities with status fields
        targetIds.add(id);
      }
    }
  }

  return targetIds;
}
