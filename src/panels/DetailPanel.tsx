import { useMemo } from 'react';
import { X, ExternalLink } from 'lucide-react';
import { useDataStore } from '../store/dataStore';
import { useGraphStore } from '../store/graphStore';
import { getEntityColor } from '../legend/colorMap';
import { EntityFieldRenderer } from './EntityFieldRenderer';
import { getOrderedColumns, getTableNameForCsv } from '../data/schemas/schemaRegistry';
import { getDomainMapping } from '../utils/domainMapper';
import { isFieldHidden, ENRICHED_FIELDS } from '../utils/fieldConfig';
import type { EntityRecord } from '../types/entities';
import { getAccLink } from '../utils/accLinkBuilder';

export function DetailPanel() {
  const selectedNodeId = useGraphStore((s) => s.selectedNodeId);
  const setSelectedNodeId = useGraphStore((s) => s.setSelectedNodeId);
  const entities = useDataStore((s) => s.entities);
  const relationships = useDataStore((s) => s.relationships);

  const entity = selectedNodeId ? entities.get(selectedNodeId) : null;

  const relatedEntities = useMemo(() => {
    if (!selectedNodeId || !entity) return [];
    const related: EntityRecord[] = [];
    for (const rel of relationships) {
      const id1 = `${rel.item1Domain}:${rel.item1EntityType}:${rel.item1Id}`;
      const id2 = `${rel.item2Domain}:${rel.item2EntityType}:${rel.item2Id}`;
      if (id1 === selectedNodeId) {
        const e = entities.get(id2);
        if (e) related.push(e);
      } else if (id2 === selectedNodeId) {
        const e = entities.get(id1);
        if (e) related.push(e);
      }
    }
    return related;
  }, [selectedNodeId, entity, relationships, entities]);

  if (!entity) return null;

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

  return (
    <div className="w-80 bg-white border-l border-gray-200 flex flex-col h-full overflow-hidden shadow-lg">
      {/* Header */}
      <div className="p-4 border-b border-gray-200 flex items-start gap-3">
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 mb-1">
            <span
              className="inline-block px-2 py-0.5 text-xs font-medium rounded-full"
              style={{ backgroundColor: colors.bg, color: colors.text, border: `1px solid ${colors.border}` }}
            >
              {colors.label}
            </span>
          </div>
          <h3 className="text-sm font-semibold text-gray-900 truncate" title={entity.displayName}>
            {entity.displayName}
          </h3>
        </div>
        <button
          onClick={() => setSelectedNodeId(null)}
          className="p-1 hover:bg-gray-100 rounded text-gray-400 hover:text-gray-600"
        >
          <X size={16} />
        </button>
      </div>

      {/* ACC Link */}
      {(() => {
        const accUrl = getAccLink(entity);
        return accUrl ? (
          <div className="px-4 py-2 border-b border-gray-200">
            <a
              href={accUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center gap-1.5 text-xs text-blue-600 hover:text-blue-800"
            >
              <ExternalLink size={14} />
              View in ACC
            </a>
          </div>
        ) : null;
      })()}

      {/* Body */}
      <div className="flex-1 overflow-y-auto p-4">
        {entity.isOpaque ? (
          <div className="text-center py-8">
            <p className="text-gray-400 text-sm">No data available</p>
            <p className="text-gray-300 text-xs mt-1">
              This entity type has no corresponding CSV data
            </p>
          </div>
        ) : (
          <>
            {/* Fields */}
            <div className="mb-4">
              <h4 className="text-xs font-semibold text-gray-500 uppercase tracking-wider mb-2">
                Fields
              </h4>
              {fieldEntries.map((entry) => (
                <EntityFieldRenderer
                  key={entry.name}
                  fieldName={entry.name}
                  value={entry.value}
                  schema={entry.schema}
                  isPersonField={entry.isPerson}
                  enrichedLookup={entry.enrichedLookup}
                />
              ))}
              {fieldEntries.length === 0 && (
                <p className="text-gray-400 text-sm italic">No fields available</p>
              )}
            </div>
          </>
        )}

        {/* Related Items */}
        {relatedEntities.length > 0 && (
          <div>
            <h4 className="text-xs font-semibold text-gray-500 uppercase tracking-wider mb-2">
              Related Items ({relatedEntities.length})
            </h4>
            <div className="space-y-1">
              {relatedEntities.map((rel) => {
                const relColors = getEntityColor(rel.entityType);
                return (
                  <button
                    key={rel.id}
                    onClick={() => setSelectedNodeId(rel.id)}
                    className="w-full text-left p-2 rounded hover:bg-gray-50 flex items-center gap-2 group"
                  >
                    <span
                      className="w-2 h-2 rounded-full shrink-0"
                      style={{ backgroundColor: relColors.dot }}
                    />
                    <span className="text-xs text-gray-600 group-hover:text-gray-900 truncate">
                      {rel.displayName}
                    </span>
                    <span className="text-[10px] text-gray-400 shrink-0">
                      {relColors.label}
                    </span>
                  </button>
                );
              })}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
