import { X, ArrowRight, ExternalLink } from 'lucide-react';
import { useDataStore } from '../store/dataStore';
import { useGraphStore } from '../store/graphStore';
import { getEntityColor } from '../legend/colorMap';
import { EntityFieldRenderer } from './EntityFieldRenderer';
import { getOrderedColumns, getTableNameForCsv } from '../data/schemas/schemaRegistry';
import { getDomainMapping } from '../utils/domainMapper';
import { isFieldHidden, ENRICHED_FIELDS } from '../utils/fieldConfig';
import { getAccLink } from '../utils/accLinkBuilder';
import type { ImpliedEdgeMetadata } from '../types/graph';
import type { EntityType, EntityRecord } from '../types/entities';

export function ImpliedEdgePanel() {
  const selectedEdgeId = useGraphStore((s) => s.selectedEdgeId);
  const setSelectedEdgeId = useGraphStore((s) => s.setSelectedEdgeId);
  const entities = useDataStore((s) => s.entities);

  if (!selectedEdgeId) return null;

  // Get edge data from cytoscape instance
  let sourceId: string | null = null;
  let targetId: string | null = null;
  let impliedMetadata: ImpliedEdgeMetadata | undefined;
  let isImplied = false;

  // Check if it's an implied edge first (format: implied-{sourceId}-{targetId})
  const impliedMatch = selectedEdgeId.match(/^implied-(.+?)-(.+)$/);
  if (impliedMatch) {
    isImplied = true;
    sourceId = impliedMatch[1];
    targetId = impliedMatch[2];
  }

  // Get edge data from cytoscape (works for both regular and implied edges)
  if (typeof window !== 'undefined') {
    const cy = (window as unknown as { __cy?: cytoscape.Core }).__cy;
    if (cy) {
      const edge = cy.getElementById(selectedEdgeId);
      if (edge.length > 0) {
        // For regular edges, get source/target from edge data
        if (!isImplied) {
          sourceId = edge.data('source');
          targetId = edge.data('target');
        }
        // For implied edges, get metadata
        if (isImplied) {
          impliedMetadata = edge.data('impliedMetadata') as ImpliedEdgeMetadata | undefined;
        }
      }
    }
  }

  if (!sourceId || !targetId) return null;

  const sourceEntity = entities.get(sourceId);
  const targetEntity = entities.get(targetId);

  if (!sourceEntity || !targetEntity) return null;

  // Helper function to render entity details
  const renderEntitySection = (entity: EntityRecord, label: 'Source' | 'Target') => {
    const colors = getEntityColor(entity.entityType);
    const mapping = getDomainMapping(entity.domain, entity.entityType);
    const csvFile = mapping?.csvFile || '';
    const tableName = csvFile ? getTableNameForCsv(csvFile) : undefined;
    const orderedColumns = tableName ? getOrderedColumns(tableName) : [];
    const personFieldSet = new Set(entity.personFields);

    // Get field entries - prefer schema order, fall back to raw fields
    const fieldEntries = (orderedColumns.length > 0
      ? orderedColumns
          .filter((col) => entity.fields[col.name] !== undefined)
          .map((col) => ({
            name: col.name,
            value: entity.fields[col.name] || '',
            schema: col.schema,
            isPerson: personFieldSet.has(col.name),
            enrichedLookup: ENRICHED_FIELDS[col.name] as string | undefined,
          }))
      : Object.entries(entity.fields).map(([name, value]) => ({
          name,
          value,
          schema: undefined,
          isPerson: personFieldSet.has(name),
          enrichedLookup: ENRICHED_FIELDS[name] as string | undefined,
        }))
    ).filter((entry) => !isFieldHidden(entry.name));

    const accUrl = getAccLink(entity);

    return (
      <div className="border-b border-gray-100">
        {/* Entity Header */}
        <div className="p-4 pb-2">
          <div className="flex items-center gap-2 mb-2">
            <span
              className="inline-block px-2 py-0.5 text-xs font-medium rounded-full"
              style={{
                backgroundColor: colors.bg,
                color: colors.text,
                border: `1px solid ${colors.border}`,
              }}
            >
              {colors.label}
            </span>
            <span className="text-xs font-semibold text-gray-700">{label}</span>
          </div>
          <p className="text-sm font-medium text-gray-900 mb-2" title={entity.displayName}>
            {entity.displayName}
          </p>
          {accUrl && (
            <a
              href={accUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center gap-1.5 text-xs text-blue-600 hover:text-blue-800"
            >
              <ExternalLink size={12} />
              View in ACC
            </a>
          )}
        </div>

        {/* Entity Fields */}
        {!entity.isOpaque && fieldEntries.length > 0 && (
          <div className="px-4 pb-4">
            <h4 className="text-xs font-semibold text-gray-500 uppercase tracking-wider mb-2">
              Fields
            </h4>
            <div className="space-y-1">
              {fieldEntries.slice(0, 5).map((entry) => (
                <EntityFieldRenderer
                  key={entry.name}
                  fieldName={entry.name}
                  value={entry.value}
                  schema={entry.schema}
                  isPersonField={entry.isPerson}
                  enrichedLookup={entry.enrichedLookup}
                />
              ))}
            </div>
            {fieldEntries.length > 5 && (
              <p className="text-xs text-gray-400 italic mt-2">
                +{fieldEntries.length - 5} more fields
              </p>
            )}
          </div>
        )}
        {entity.isOpaque && (
          <div className="px-4 pb-4">
            <p className="text-xs text-gray-400 italic">No field data available</p>
          </div>
        )}
      </div>
    );
  };

  return (
    <div className="w-80 bg-white border-l border-gray-200 flex flex-col h-full overflow-hidden shadow-lg">
      {/* Header */}
      <div className="p-4 border-b border-gray-200">
        <div className="flex items-center justify-between mb-2">
          <h3 className="text-sm font-semibold text-gray-900">
            {isImplied ? 'Collapsed Path' : 'Relationship'}
          </h3>
          <button
            onClick={() => setSelectedEdgeId(null)}
            className="p-1 hover:bg-gray-100 rounded text-gray-400 hover:text-gray-600"
            title="Close"
          >
            <X size={16} />
          </button>
        </div>
        {isImplied && impliedMetadata && (
          <p className="text-xs text-gray-500">
            Connection through {impliedMetadata.collapsedPath.length} hidden node
            {impliedMetadata.collapsedPath.length !== 1 ? 's' : ''}
          </p>
        )}
      </div>

      {/* Content */}
      <div className="flex-1 overflow-y-auto">
        {/* Source Entity */}
        {renderEntitySection(sourceEntity, 'Source')}

        {/* Hidden Nodes - Only for implied edges */}
        {isImplied && impliedMetadata?.collapsedPath && impliedMetadata.collapsedPath.length > 0 && (
          <div className="p-4 border-b border-gray-100 bg-gray-50">
            <div className="flex items-center justify-center mb-3">
              <ArrowRight size={16} className="text-gray-400" />
            </div>
            <h4 className="text-xs font-semibold text-gray-500 uppercase tracking-wider mb-3">
              Hidden Nodes ({impliedMetadata.collapsedPath.length})
            </h4>
            <div className="space-y-3">
              {impliedMetadata.collapsedPath.map((node, index) => {
                const entity = entities.get(node.entityId);
                const colors = getEntityColor(node.entityType as EntityType);
                const mapping = entity ? getDomainMapping(entity.domain, entity.entityType) : null;
                const csvFile = mapping?.csvFile || '';
                const tableName = csvFile ? getTableNameForCsv(csvFile) : undefined;
                const orderedColumns = tableName ? getOrderedColumns(tableName) : [];
                const personFieldSet = entity ? new Set(entity.personFields) : new Set();

                // Get a few key fields to show
                const fieldEntries = entity
                  ? (orderedColumns.length > 0
                      ? orderedColumns
                          .filter((col) => entity.fields[col.name] !== undefined)
                          .map((col) => ({
                            name: col.name,
                            value: entity.fields[col.name] || '',
                            schema: col.schema,
                            isPerson: personFieldSet.has(col.name),
                            enrichedLookup: ENRICHED_FIELDS[col.name] as string | undefined,
                          }))
                      : Object.entries(entity.fields).map(([name, value]) => ({
                          name,
                          value,
                          schema: undefined,
                          isPerson: personFieldSet.has(name),
                          enrichedLookup: ENRICHED_FIELDS[name] as string | undefined,
                        }))
                    )
                      .filter((entry) => !isFieldHidden(entry.name))
                      .slice(0, 3) // Show only first 3 fields
                  : [];

                return (
                  <div key={node.entityId} className="bg-white rounded p-2 shadow-sm">
                    <div className="flex items-center gap-2 mb-1">
                      <span
                        className="inline-block px-1.5 py-0.5 text-[10px] font-medium rounded"
                        style={{
                          backgroundColor: colors.bg,
                          color: colors.text,
                          border: `1px solid ${colors.border}`,
                        }}
                      >
                        {colors.label}
                      </span>
                    </div>
                    <p className="text-xs font-medium text-gray-700 mb-1 truncate" title={node.displayName}>
                      {node.displayName}
                    </p>
                    {node.statusValue && (
                      <p className="text-[10px] text-gray-500">
                        Status: <span className="font-medium">{node.statusValue}</span>
                      </p>
                    )}
                    {entity && !entity.isOpaque && fieldEntries.length > 0 && (
                      <div className="mt-2 space-y-0.5 text-[10px]">
                        {fieldEntries.map((field) => (
                          <div key={field.name} className="flex gap-1">
                            <span className="text-gray-500 min-w-[60px]">{field.name}:</span>
                            <span className="text-gray-700 truncate" title={field.value}>
                              {field.value || <span className="italic text-gray-300">empty</span>}
                            </span>
                          </div>
                        ))}
                      </div>
                    )}
                    {entity?.isOpaque && (
                      <p className="text-[10px] text-gray-400 italic mt-1">No field data available</p>
                    )}
                  </div>
                );
              })}
            </div>
            <div className="flex items-center justify-center mt-3">
              <ArrowRight size={16} className="text-gray-400" />
            </div>
          </div>
        )}

        {/* Target Entity */}
        {renderEntitySection(targetEntity, 'Target')}
      </div>
    </div>
  );
}
