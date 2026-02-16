import { create } from 'zustand';
import type { LayoutName } from '../types/graph';

interface GraphState {
  selectedNodeId: string | null;
  selectedEdgeId: string | null;
  hoveredNodeId: string | null;
  layout: LayoutName;
  spacingFactor: number;
  clusterHighlight: boolean;

  setSelectedNodeId: (id: string | null) => void;
  setSelectedEdgeId: (id: string | null) => void;
  setHoveredNodeId: (id: string | null) => void;
  setLayout: (layout: LayoutName) => void;
  setSpacingFactor: (factor: number) => void;
  setClusterHighlight: (value: boolean) => void;
}

export const useGraphStore = create<GraphState>((set) => ({
  selectedNodeId: null,
  selectedEdgeId: null,
  hoveredNodeId: null,
  layout: 'cose-bilkent',
  spacingFactor: 1.0,
  clusterHighlight: false,

  setSelectedNodeId: (id) => set({ selectedNodeId: id, selectedEdgeId: null }),
  setSelectedEdgeId: (id) => set({ selectedEdgeId: id, selectedNodeId: null }),
  setHoveredNodeId: (id) => set({ hoveredNodeId: id }),
  setLayout: (layout) => set({ layout }),
  setSpacingFactor: (factor) => set({ spacingFactor: factor }),
  setClusterHighlight: (value) => set({ clusterHighlight: value }),
}));
