import type { LayoutOptions } from 'cytoscape';
import type { LayoutName } from '../types/graph';

export function getLayoutOptions(name: LayoutName, nodeCount: number, spacingFactor = 1.0): LayoutOptions {
  const animate = nodeCount < 500;

  switch (name) {
    case 'cose-bilkent':
      return {
        name: 'cose-bilkent',
        animate,
        animationDuration: animate ? 800 : 0,
        nodeDimensionsIncludeLabels: true,
        idealEdgeLength: Math.round(160 * spacingFactor),
        nodeRepulsion: Math.round(8500 * spacingFactor),
        edgeElasticity: 0.35,
        nestingFactor: 0.1,
        gravity: 0.18 / spacingFactor,
        numIter: 2500,
        tile: true,
        tilingPaddingVertical: Math.round(60 * spacingFactor),
        tilingPaddingHorizontal: Math.round(60 * spacingFactor),
        fit: true,
        padding: 40,
      } as LayoutOptions;

    case 'grid':
      return {
        name: 'grid',
        animate,
        animationDuration: 500,
        fit: true,
        padding: 30,
        condense: true,
      } as LayoutOptions;

    case 'circle':
      return {
        name: 'circle',
        animate,
        animationDuration: 500,
        fit: true,
        padding: 30,
      } as LayoutOptions;

    case 'concentric':
      return {
        name: 'concentric',
        animate,
        animationDuration: 500,
        fit: true,
        padding: 30,
        concentric: (node: { degree: () => number }) => node.degree(),
        levelWidth: () => 2,
      } as LayoutOptions;

    case 'breadthfirst':
      return {
        name: 'breadthfirst',
        animate,
        animationDuration: 500,
        fit: true,
        padding: 30,
        directed: true,
      } as LayoutOptions;

    default:
      return { name: 'cose-bilkent' } as LayoutOptions;
  }
}
