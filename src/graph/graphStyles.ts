import type { Stylesheet } from 'cytoscape';
import { ENTITY_COLORS } from '../legend/colorMap';
import type { EntityType } from '../types/entities';

export function buildStylesheet(focusedEntityType: EntityType | null): Stylesheet[] {
  const styles: Stylesheet[] = [
    {
      selector: 'node',
      style: {
        label: 'data(displayName)',
        'text-valign': 'bottom',
        'text-halign': 'center',
        'font-size': '10px',
        'text-max-width': '100px',
        'text-wrap': 'ellipsis',
        'background-color': '#9ca3af',
        'border-width': 2,
        'border-color': '#6b7280',
        width: 30,
        height: 30,
        'overlay-padding': '4px',
        'text-margin-y': 4,
      },
    },
    {
      selector: 'edge',
      style: {
        width: 1.5,
        'line-color': '#d1d5db',
        'target-arrow-color': '#d1d5db',
        'target-arrow-shape': 'triangle',
        'curve-style': 'bezier',
        'arrow-scale': 0.8,
        opacity: 0.7,
        'overlay-padding': '8px', // Make edges easier to click
        'overlay-opacity': 0,
      },
    },
    {
      selector: 'edge.implied',
      style: {
        'line-style': 'dashed',
        'line-dash-pattern': [6, 3],
        'line-color': '#9ca3af',
        'target-arrow-color': '#9ca3af',
        width: 2,
        opacity: 0.5,
      },
    },
    {
      selector: 'node:selected',
      style: {
        'border-width': 4,
        'border-color': '#2563eb',
        'overlay-color': '#2563eb',
        'overlay-opacity': 0.15,
      },
    },
    {
      selector: 'node.hover',
      style: {
        'border-width': 3,
        'overlay-opacity': 0.1,
      },
    },
    {
      selector: 'edge:selected',
      style: {
        'line-color': '#2563eb',
        'target-arrow-color': '#2563eb',
        width: 3,
        opacity: 1,
      },
    },
    {
      selector: 'edge.hover',
      style: {
        width: 3,
        opacity: 1,
        'line-color': '#6b7280',
        'target-arrow-color': '#6b7280',
      },
    },
    {
      selector: 'node.opaque',
      style: {
        'background-opacity': 0.5,
        'border-style': 'dashed',
      },
    },
    {
      selector: 'node.dimmed',
      style: {
        opacity: 0.2,
      },
    },
    {
      selector: 'edge.dimmed',
      style: {
        opacity: 0.1,
      },
    },
    {
      selector: 'node.highlighted',
      style: {
        opacity: 1,
        'border-width': 3,
      },
    },
    {
      selector: 'edge.highlighted',
      style: {
        opacity: 1,
        width: 2.5,
        'line-color': '#6b7280',
        'target-arrow-color': '#6b7280',
      },
    },
  ];

  // When a focus type is active, inject attribute-based dim/highlight rules
  // BEFORE the hover class rules so hover can override focus during interaction
  if (focusedEntityType) {
    // Insert focus rules before the hover rules (dimmed/highlighted)
    // Find the index of node.dimmed to insert before it
    const dimmedIndex = styles.findIndex(
      (s) => 'selector' in s && s.selector === 'node.dimmed'
    );
    const focusRules: Stylesheet[] = [
      {
        selector: `node[entityType != "${focusedEntityType}"]`,
        style: {
          opacity: 0.15,
          'text-opacity': 0.3,
        },
      },
      {
        selector: 'edge',
        style: {
          opacity: 0.08,
        },
      },
      {
        selector: `node[entityType = "${focusedEntityType}"]`,
        style: {
          opacity: 1,
          'border-width': 3,
        },
      },
    ];
    styles.splice(dimmedIndex, 0, ...focusRules);
  }

  // Per-entity-type styles
  for (const [type, colors] of Object.entries(ENTITY_COLORS)) {
    styles.push({
      selector: `node[entityType="${type}"]`,
      style: {
        'background-color': colors.bg,
        'border-color': colors.border,
        color: colors.text,
      },
    });
  }

  return styles;
}
