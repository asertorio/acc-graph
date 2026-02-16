import { useMemo } from 'react';
import { X } from 'lucide-react';
import { useDataStore } from '../store/dataStore';
import { useFilterStore } from '../store/filterStore';
import { getEntityTypeCounts } from '../graph/graphBuilder';
import { ENTITY_COLORS } from './colorMap';
import type { EntityType } from '../types/entities';

export function ColorLegend() {
  const entities = useDataStore((s) => s.entities);
  const enabledEntityTypes = useFilterStore((s) => s.enabledEntityTypes);
  const toggleEntityType = useFilterStore((s) => s.toggleEntityType);
  const focusedEntityType = useFilterStore((s) => s.focusedEntityType);
  const setFocusedEntityType = useFilterStore((s) => s.setFocusedEntityType);
  const toggleFocusedEntityType = useFilterStore((s) => s.toggleFocusedEntityType);

  const typeCounts = useMemo(() => getEntityTypeCounts(entities), [entities]);

  const presentTypes = useMemo(() => {
    const types: EntityType[] = [];
    for (const [type] of typeCounts) {
      types.push(type as EntityType);
    }
    return types.sort((a, b) => (typeCounts.get(b) || 0) - (typeCounts.get(a) || 0));
  }, [typeCounts]);

  if (presentTypes.length === 0) return null;

  return (
    <div className="h-10 bg-white border-t border-gray-200 flex items-center gap-4 px-4 overflow-x-auto">
      {presentTypes.map((type) => {
        const colors = ENTITY_COLORS[type] || ENTITY_COLORS.unknown;
        const count = typeCounts.get(type) || 0;
        const enabled = enabledEntityTypes.has(type);
        const isFocused = focusedEntityType === type;
        return (
          <button
            key={type}
            onClick={() => toggleEntityType(type)}
            onContextMenu={(e) => {
              e.preventDefault();
              toggleFocusedEntityType(type);
            }}
            className={`flex items-center gap-1.5 shrink-0 transition-opacity ${
              enabled ? 'opacity-100' : 'opacity-40'
            }`}
          >
            <span
              className={`w-2.5 h-2.5 rounded-full ${isFocused ? 'ring-2 ring-amber-400 ring-offset-1' : ''}`}
              style={{ backgroundColor: colors.dot }}
            />
            <span className="text-xs text-gray-600">{colors.label}</span>
            <span className="text-[10px] text-gray-400">{count}</span>
          </button>
        );
      })}
      {focusedEntityType && (
        <button
          onClick={() => setFocusedEntityType(null)}
          className="flex items-center gap-1 shrink-0 text-[10px] text-amber-600 hover:text-amber-800 ml-2"
        >
          <X size={10} />
          Clear focus
        </button>
      )}
    </div>
  );
}
