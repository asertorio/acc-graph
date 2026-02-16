import { useRef, useEffect, useCallback, useMemo } from 'react';
import CytoscapeComponent from 'react-cytoscapejs';
import type cytoscape from 'cytoscape';
import { useDataStore } from '../store/dataStore';
import { useFilterStore } from '../store/filterStore';
import { useGraphStore } from '../store/graphStore';
import { buildGraphElements } from './graphBuilder';
import { buildStylesheet } from './graphStyles';
import { getLayoutOptions } from './layouts';
import { registerExtensions } from './extensions';

registerExtensions();

function getCluster(cy: cytoscape.Core, nodeId: string) {
  const root = cy.getElementById(nodeId);
  if (!root.length) return cy.collection();

  let nodes = cy.collection().add(root);
  let frontier = root.openNeighborhood('node');

  while (frontier.nonempty()) {
    nodes = nodes.add(frontier);
    frontier = frontier.openNeighborhood('node').difference(nodes);
  }

  return nodes.add(nodes.edgesWith(nodes));
}

function highlightNeighbors(cy: cytoscape.Core, nodeId: string, cluster: boolean) {
  const node = cy.getElementById(nodeId);
  if (!node.length) return;
  const neighborhood = cluster
    ? getCluster(cy, nodeId)
    : node.neighborhood().add(node);
  cy.elements().not(neighborhood).addClass('dimmed');
  neighborhood.addClass('highlighted');
}

function clearHighlights(cy: cytoscape.Core) {
  cy.elements().removeClass('dimmed highlighted');
}

export function GraphCanvas() {
  const cyRef = useRef<cytoscape.Core | null>(null);
  const prevLayoutRef = useRef<string>('');

  const entities = useDataStore((s) => s.entities);
  const relationships = useDataStore((s) => s.relationships);
  const enabledEntityTypes = useFilterStore((s) => s.enabledEntityTypes);
  const selectedPersonIds = useFilterStore((s) => s.selectedPersonIds);
  const showRelatedOnly = useFilterStore((s) => s.showRelatedOnly);
  const focusedEntityType = useFilterStore((s) => s.focusedEntityType);
  const statusFilter = useFilterStore((s) => s.statusFilter);
  const preserveConnectivity = useFilterStore((s) => s.preserveConnectivity);
  const metadataFilters = useFilterStore((s) => s.metadataFilters);
  const layout = useGraphStore((s) => s.layout);
  const spacingFactor = useGraphStore((s) => s.spacingFactor);
  const selectedNodeId = useGraphStore((s) => s.selectedNodeId);
  const clusterHighlight = useGraphStore((s) => s.clusterHighlight);

  const elements = useMemo(() => {
    return buildGraphElements(entities, relationships, {
      enabledEntityTypes,
      selectedPersonIds,
      showRelatedOnly,
      statusFilter,
      preserveConnectivity,
      metadataFilters,
    });
  }, [entities, relationships, enabledEntityTypes, selectedPersonIds, showRelatedOnly, statusFilter, preserveConnectivity, metadataFilters]);

  const stylesheet = useMemo(() => buildStylesheet(focusedEntityType), [focusedEntityType]);

  const flatElements = useMemo(() => {
    return [...elements.nodes, ...elements.edges];
  }, [elements]);

  const layoutOptions = useMemo(() => {
    return getLayoutOptions(layout, elements.nodes.length, spacingFactor);
  }, [layout, elements.nodes.length, spacingFactor]);

  // Track whether handlers have been registered on the current cy instance
  const handlersRegisteredRef = useRef<cytoscape.Core | null>(null);

  const handleCyRef = useCallback((cy: cytoscape.Core) => {
    cyRef.current = cy;
    // Expose for dev/testing
    if (import.meta.env.DEV) {
      (window as unknown as Record<string, unknown>).__cy = cy;
    }

    // Only register handlers once per cy instance
    if (handlersRegisteredRef.current === cy) return;
    handlersRegisteredRef.current = cy;

    cy.on('tap', 'node', (evt) => {
      evt.target.select();  // Apply Cytoscape's :selected pseudo-class
      const nodeId = evt.target.id();
      useGraphStore.getState().setSelectedNodeId(nodeId);  // This also clears selectedEdgeId
    });

    cy.on('tap', 'edge', (evt) => {
      evt.target.select();  // Apply Cytoscape's :selected pseudo-class
      const edgeId = evt.target.id();
      useGraphStore.getState().setSelectedEdgeId(edgeId);  // This also clears selectedNodeId
    });

    cy.on('tap', (evt) => {
      if (evt.target === cy) {
        cy.elements().deselect();  // Clear Cytoscape's selection state
        useGraphStore.getState().setSelectedNodeId(null);
        useGraphStore.getState().setSelectedEdgeId(null);
      }
    });

    cy.on('mouseover', 'node', (evt) => {
      evt.target.addClass('hover');
      const { clusterHighlight: cluster } = useGraphStore.getState();
      highlightNeighbors(cy, evt.target.id(), cluster);
    });

    cy.on('mouseout', 'node', (evt) => {
      evt.target.removeClass('hover');
      clearHighlights(cy);
      // Re-apply selection highlights if a node is selected
      const { selectedNodeId: selId, clusterHighlight: cluster } = useGraphStore.getState();
      if (selId) {
        highlightNeighbors(cy, selId, cluster);
      }
    });
  }, []);

  // Run layout when elements or layout name changes
  useEffect(() => {
    const cy = cyRef.current;
    if (!cy || flatElements.length === 0) return;

    const layoutKey = `${layout}-${flatElements.length}-${spacingFactor}`;
    if (prevLayoutRef.current === layoutKey) return;
    prevLayoutRef.current = layoutKey;

    // Small delay to let elements render
    const timer = setTimeout(() => {
      cy.batch(() => {
        // Layout is applied automatically by react-cytoscapejs
      });
      const layoutInstance = cy.layout(layoutOptions);
      layoutInstance.run();
    }, 100);

    return () => clearTimeout(timer);
  }, [flatElements.length, layout, spacingFactor, layoutOptions]);

  // Highlight selected node (persists until deselected)
  useEffect(() => {
    const cy = cyRef.current;
    if (!cy) return;
    clearHighlights(cy);
    if (selectedNodeId) {
      highlightNeighbors(cy, selectedNodeId, clusterHighlight);
    }
  }, [selectedNodeId, clusterHighlight]);


  if (flatElements.length === 0) {
    return (
      <div className="flex-1 flex items-center justify-center text-gray-400">
        <p>No data to display. Load a folder or adjust filters.</p>
      </div>
    );
  }

  return (
    <CytoscapeComponent
      elements={flatElements}
      stylesheet={stylesheet}
      layout={layoutOptions}
      cy={handleCyRef}
      className="flex-1"
      style={{ width: '100%', height: '100%' }}
      minZoom={0.1}
      maxZoom={4}
      wheelSensitivity={1}
    />
  );
}
