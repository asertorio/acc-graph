import type { ElementDefinition } from 'cytoscape';

export type LayoutName = 'cose-bilkent' | 'grid' | 'circle' | 'concentric' | 'breadthfirst';

export interface ImpliedEdgeMetadata {
  isImplied: true;
  collapsedPath: Array<{
    entityId: string;
    entityType: string;
    displayName: string;
    statusValue?: string;
  }>;
  originalRelationships: string[]; // relationship GUIDs
}

export interface ConnectivityMetadata {
  hasDirectConnection: boolean;     // 1-hop to target subset
  connectionDepth: number | null;    // N-hop distance (null if no connection)
  connectedItemIds: string[];        // Entity IDs of connected items in target subset
}

export interface GraphNode extends ElementDefinition {
  data: {
    id: string;
    entityType: string;
    domain: string;
    displayName: string;
    isOpaque: boolean;
    connectivity?: ConnectivityMetadata;
    [key: string]: unknown;
  };
}

export interface GraphEdge extends ElementDefinition {
  data: {
    id: string;
    source: string;
    target: string;
    relationshipGuid?: string;
    impliedMetadata?: ImpliedEdgeMetadata;
  };
  classes?: string;
}

export type GraphElements = {
  nodes: GraphNode[];
  edges: GraphEdge[];
};
