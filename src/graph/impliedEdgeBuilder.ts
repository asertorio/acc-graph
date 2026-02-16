import type { EntityRecord } from '../types/entities';
import type { Relationship } from '../types/relationships';
import type { GraphEdge, ImpliedEdgeMetadata } from '../types/graph';

interface AdjacencyList {
  [entityId: string]: Array<{
    targetId: string;
    relationshipGuid: string;
  }>;
}

/**
 * Builds adjacency list from all relationships (including those with hidden entities).
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

    adj[id1].push({ targetId: id2, relationshipGuid: rel.relationshipGuid });
    adj[id2].push({ targetId: id1, relationshipGuid: rel.relationshipGuid });
  }

  return adj;
}

/**
 * BFS to find path from startId to any visible node, going through hidden nodes.
 * Returns null if no path found within maxPathLength.
 */
function findPathToVisibleNode(
  startId: string,
  visibleNodeIds: Set<string>,
  adj: AdjacencyList,
  allEntities: Map<string, EntityRecord>,
  maxPathLength: number
): {
  targetId: string;
  path: string[];
  relationshipGuids: string[];
} | null {
  const queue: Array<{
    nodeId: string;
    path: string[];
    relationshipGuids: string[];
  }> = [{ nodeId: startId, path: [startId], relationshipGuids: [] }];
  const visited = new Set<string>([startId]);

  while (queue.length > 0) {
    const current = queue.shift()!;

    // Stop if path is too long
    if (current.path.length > maxPathLength + 1) continue;

    // Explore neighbors
    const neighbors = adj[current.nodeId] || [];
    for (const { targetId, relationshipGuid } of neighbors) {
      if (visited.has(targetId)) continue;
      visited.add(targetId);

      const newPath = [...current.path, targetId];
      const newRelGuids = [...current.relationshipGuids, relationshipGuid];

      // Check if we reached a visible node (and it's not the start node)
      if (visibleNodeIds.has(targetId) && targetId !== startId) {
        return {
          targetId,
          path: newPath,
          relationshipGuids: newRelGuids,
        };
      }

      // Only traverse through hidden nodes
      if (!visibleNodeIds.has(targetId)) {
        queue.push({
          nodeId: targetId,
          path: newPath,
          relationshipGuids: newRelGuids,
        });
      }
    }
  }

  return null;
}

/**
 * Builds implied edges between visible nodes that have paths through hidden nodes.
 */
export function buildImpliedEdges(
  visibleNodeIds: Set<string>,
  allEntities: Map<string, EntityRecord>,
  allRelationships: Relationship[],
  maxPathLength: number = 5
): GraphEdge[] {
  const adj = buildAdjacencyList(allEntities, allRelationships);
  const impliedEdges: GraphEdge[] = [];
  const processedPairs = new Set<string>();

  // For each visible node, find paths to other visible nodes
  for (const startId of visibleNodeIds) {
    const visited = new Set<string>([startId]);
    const queue: Array<{
      nodeId: string;
      path: string[];
      relationshipGuids: string[];
    }> = [{ nodeId: startId, path: [startId], relationshipGuids: [] }];

    while (queue.length > 0) {
      const current = queue.shift()!;

      // Stop if path is too long
      if (current.path.length > maxPathLength + 1) continue;

      // Explore neighbors
      const neighbors = adj[current.nodeId] || [];
      for (const { targetId, relationshipGuid } of neighbors) {
        if (visited.has(targetId)) continue;
        visited.add(targetId);

        const newPath = [...current.path, targetId];
        const newRelGuids = [...current.relationshipGuids, relationshipGuid];

        // Check if we reached a visible node (and it's not the start node)
        if (visibleNodeIds.has(targetId) && targetId !== startId) {
          // Create implied edge if there are hidden nodes in the path
          // Path includes start and target, so hidden nodes = path length - 2
          if (newPath.length > 2) {
            // Check if we already processed this pair (in either direction)
            const pairKey =
              startId < targetId ? `${startId}::${targetId}` : `${targetId}::${startId}`;

            if (!processedPairs.has(pairKey)) {
              processedPairs.add(pairKey);

              // Extract hidden nodes (exclude start and end)
              const hiddenNodes = newPath.slice(1, -1);
              const collapsedPath = hiddenNodes.map((nodeId) => {
                const entity = allEntities.get(nodeId);
                return {
                  entityId: nodeId,
                  entityType: entity?.entityType || 'unknown',
                  displayName: entity?.displayName || nodeId,
                  statusValue: entity?.fields['status'],
                };
              });

              impliedEdges.push({
                data: {
                  id: `implied-${startId}-${targetId}`,
                  source: startId,
                  target: targetId,
                  impliedMetadata: {
                    isImplied: true,
                    collapsedPath,
                    originalRelationships: newRelGuids,
                  },
                },
                classes: 'implied',
              });
            }
          }

          // Don't continue searching from visible nodes (only traverse hidden nodes)
          continue;
        }

        // Only traverse through hidden nodes
        if (!visibleNodeIds.has(targetId)) {
          queue.push({
            nodeId: targetId,
            path: newPath,
            relationshipGuids: newRelGuids,
          });
        }
      }
    }
  }

  return impliedEdges;
}
