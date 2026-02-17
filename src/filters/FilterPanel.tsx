import { useMemo, useState } from 'react';
import { Filter, RotateCcw, Search, Users, ChevronDown, ChevronRight, Crosshair, X } from 'lucide-react';
import { useDataStore } from '../store/dataStore';
import { useFilterStore } from '../store/filterStore';
import { useGraphStore } from '../store/graphStore';
import { getEntityTypeCounts } from '../graph/graphBuilder';
import { ENTITY_COLORS } from '../legend/colorMap';
import { resolvePersonName } from '../utils/personResolver';
import type { EntityType } from '../types/entities';
import type { StatusFilterMode } from '../types/filters';

function ClusterHighlightToggle() {
  const clusterHighlight = useGraphStore((s) => s.clusterHighlight);
  const setClusterHighlight = useGraphStore((s) => s.setClusterHighlight);
  return (
    <>
      <label className="flex items-center gap-2 cursor-pointer">
        <input
          type="checkbox"
          checked={clusterHighlight}
          onChange={(e) => setClusterHighlight(e.target.checked)}
          className="w-3 h-3 rounded border-gray-300"
        />
        <span className="text-xs text-gray-700">Cluster highlight</span>
      </label>
      <p className="text-[10px] text-gray-400 mt-1 ml-5">Show full connected cluster</p>
    </>
  );
}

export function FilterPanel() {
  const entities = useDataStore((s) => s.entities);
  const relationships = useDataStore((s) => s.relationships);
  const users = useDataStore((s) => s.users);
  const enabledEntityTypes = useFilterStore((s) => s.enabledEntityTypes);
  const toggleEntityType = useFilterStore((s) => s.toggleEntityType);
  const setAllEntityTypes = useFilterStore((s) => s.setAllEntityTypes);
  const selectedPersonIds = useFilterStore((s) => s.selectedPersonIds);
  const togglePerson = useFilterStore((s) => s.togglePerson);
  const clearPersons = useFilterStore((s) => s.clearPersons);
  const showRelatedOnly = useFilterStore((s) => s.showRelatedOnly);
  const setShowRelatedOnly = useFilterStore((s) => s.setShowRelatedOnly);
  const focusedEntityType = useFilterStore((s) => s.focusedEntityType);
  const setFocusedEntityType = useFilterStore((s) => s.setFocusedEntityType);
  const toggleFocusedEntityType = useFilterStore((s) => s.toggleFocusedEntityType);
  const statusFilter = useFilterStore((s) => s.statusFilter);
  const setStatusFilter = useFilterStore((s) => s.setStatusFilter);
  const preserveConnectivity = useFilterStore((s) => s.preserveConnectivity);
  const setPreserveConnectivity = useFilterStore((s) => s.setPreserveConnectivity);
  const resetFilters = useFilterStore((s) => s.resetFilters);

  const [personSearch, setPersonSearch] = useState('');
  const [personExpanded, setPersonExpanded] = useState(false);

  const typeCounts = useMemo(() => getEntityTypeCounts(entities), [entities]);

  const presentTypes = useMemo(() => {
    const types: EntityType[] = [];
    for (const [type] of typeCounts) {
      types.push(type as EntityType);
    }
    return types.sort((a, b) => {
      const countDiff = (typeCounts.get(b) || 0) - (typeCounts.get(a) || 0);
      return countDiff;
    });
  }, [typeCounts]);

  const filteredUsers = useMemo(() => {
    const search = personSearch.toLowerCase();
    return users.filter(
      (u) =>
        u.name.toLowerCase().includes(search) ||
        u.email.toLowerCase().includes(search)
    );
  }, [users, personSearch]);

  const allEnabled = presentTypes.every((t) => enabledEntityTypes.has(t));

  return (
    <div className="w-56 shrink-0 bg-white border-r border-gray-200 flex flex-col h-full overflow-hidden">
      {/* Header */}
      <div className="p-3 border-b border-gray-200 flex items-center gap-2">
        <Filter size={14} className="text-gray-500" />
        <span className="text-sm font-semibold text-gray-700">Filters</span>
        <button
          onClick={() => {
            resetFilters();
            useGraphStore.getState().setClusterHighlight(false);
          }}
          className="ml-auto p-1 hover:bg-gray-100 rounded text-gray-400 hover:text-gray-600"
          title="Reset filters"
        >
          <RotateCcw size={12} />
        </button>
      </div>

      <div className="flex-1 overflow-y-auto">
        {/* Entity Types */}
        <div className="p-3 border-b border-gray-100">
          <div className="flex items-center justify-between mb-2">
            <h4 className="text-xs font-semibold text-gray-500 uppercase tracking-wider">Types</h4>
            <div className="flex items-center gap-1">
              <button
                onClick={() => setAllEntityTypes(presentTypes)}
                disabled={allEnabled}
                className={`text-[10px] px-1.5 py-0.5 rounded ${
                  allEnabled
                    ? 'text-gray-300 cursor-default'
                    : 'text-blue-500 hover:text-blue-700 hover:bg-blue-50'
                }`}
              >
                All
              </button>
              <span className="text-gray-300 text-[10px]">|</span>
              <button
                onClick={() => useFilterStore.getState().clearEntityTypes()}
                disabled={enabledEntityTypes.size === 0}
                className={`text-[10px] px-1.5 py-0.5 rounded ${
                  enabledEntityTypes.size === 0
                    ? 'text-gray-300 cursor-default'
                    : 'text-blue-500 hover:text-blue-700 hover:bg-blue-50'
                }`}
              >
                None
              </button>
            </div>
          </div>
          {focusedEntityType && (
            <button
              onClick={() => setFocusedEntityType(null)}
              className="flex items-center gap-1 text-[10px] text-amber-600 hover:text-amber-800 mb-1"
            >
              <X size={10} />
              Clear focus
            </button>
          )}
          <div className="space-y-1">
            {presentTypes.map((type) => {
              const colors = ENTITY_COLORS[type] || ENTITY_COLORS.unknown;
              const count = typeCounts.get(type) || 0;
              const enabled = enabledEntityTypes.has(type);
              const isFocused = focusedEntityType === type;
              return (
                <div
                  key={type}
                  className={`flex items-center gap-2 py-0.5 rounded px-1 -mx-1 ${
                    isFocused ? 'bg-amber-50 ring-1 ring-amber-200' : 'hover:bg-gray-50'
                  }`}
                >
                  <label className="flex items-center gap-2 flex-1 cursor-pointer min-w-0">
                    <input
                      type="checkbox"
                      checked={enabled}
                      onChange={() => toggleEntityType(type)}
                      className="w-3 h-3 rounded border-gray-300"
                    />
                    <span
                      className="w-2.5 h-2.5 rounded-full shrink-0"
                      style={{ backgroundColor: colors.dot }}
                    />
                    <span className={`text-xs flex-1 truncate ${enabled ? 'text-gray-700' : 'text-gray-400'}`}>
                      {colors.label}
                    </span>
                    <span className="text-[10px] text-gray-400 tabular-nums">{count}</span>
                  </label>
                  <button
                    onClick={() => toggleFocusedEntityType(type)}
                    className={`p-0.5 rounded shrink-0 ${
                      isFocused
                        ? 'text-amber-600 bg-amber-100'
                        : 'text-gray-300 hover:text-gray-500 hover:bg-gray-100'
                    }`}
                    title={isFocused ? 'Clear focus' : `Focus on ${colors.label}`}
                  >
                    <Crosshair size={12} />
                  </button>
                </div>
              );
            })}
          </div>
        </div>

        {/* Display Settings */}
        <div className="p-3 border-b border-gray-100 space-y-2">
          <label className="flex items-center gap-2 cursor-pointer">
            <input
              type="checkbox"
              checked={showRelatedOnly}
              onChange={(e) => setShowRelatedOnly(e.target.checked)}
              className="w-3 h-3 rounded border-gray-300"
            />
            <span className="text-xs text-gray-700">Show related only</span>
          </label>
          <p className="text-[10px] text-gray-400 mt-1 ml-5">Hide orphan nodes</p>

          <label className="flex items-center gap-2 cursor-pointer">
            <input
              type="checkbox"
              checked={preserveConnectivity}
              onChange={(e) => setPreserveConnectivity(e.target.checked)}
              className="w-3 h-3 rounded border-gray-300"
            />
            <span className="text-xs text-gray-700">Preserve connectivity</span>
          </label>
          <p className="text-[10px] text-gray-400 mt-1 ml-5">Show implied links through hidden nodes</p>

          <ClusterHighlightToggle />
        </div>

        {/* Status Filter */}
        <div className="p-3 border-b border-gray-100">
          <h4 className="text-xs font-semibold text-gray-500 uppercase tracking-wider mb-2">
            Status
          </h4>
          <p className="text-[10px] text-gray-400 mb-2">Filters Issues, RFIs, and Forms by status</p>
          <div className="space-y-1.5">
            {(['all', 'open', 'closed'] as StatusFilterMode[]).map((mode) => (
              <label key={mode} className="flex items-center gap-2 cursor-pointer">
                <input
                  type="radio"
                  name="statusFilter"
                  checked={statusFilter === mode}
                  onChange={() => setStatusFilter(mode)}
                  className="w-3 h-3 border-gray-300"
                />
                <span className="text-xs text-gray-700 capitalize">{mode}</span>
              </label>
            ))}
          </div>
        </div>

        {/* Person Filter */}
        <div className="p-3">
          <button
            onClick={() => setPersonExpanded(!personExpanded)}
            className="flex items-center gap-2 w-full mb-2"
          >
            <Users size={12} className="text-gray-500" />
            <span className="text-xs font-semibold text-gray-500 uppercase tracking-wider">
              People
            </span>
            {selectedPersonIds.size > 0 && (
              <span className="text-[10px] bg-blue-100 text-blue-700 px-1.5 rounded-full">
                {selectedPersonIds.size}
              </span>
            )}
            <span className="ml-auto">
              {personExpanded ? <ChevronDown size={12} className="text-gray-400" /> : <ChevronRight size={12} className="text-gray-400" />}
            </span>
          </button>

          {personExpanded && (
            <>
              {selectedPersonIds.size > 0 && (
                <button
                  onClick={clearPersons}
                  className="text-[10px] text-blue-500 hover:text-blue-700 mb-2"
                >
                  Clear selection
                </button>
              )}
              <div className="relative mb-2">
                <Search size={12} className="absolute left-2 top-1/2 -translate-y-1/2 text-gray-400" />
                <input
                  type="text"
                  placeholder="Search people..."
                  value={personSearch}
                  onChange={(e) => setPersonSearch(e.target.value)}
                  className="w-full pl-7 pr-2 py-1 text-xs border border-gray-200 rounded focus:outline-none focus:border-blue-400"
                />
              </div>
              <div className="max-h-48 overflow-y-auto space-y-0.5">
                {filteredUsers.map((user) => (
                  <label
                    key={user.autodesk_id}
                    className="flex items-center gap-2 py-0.5 cursor-pointer hover:bg-gray-50 rounded px-1 -mx-1"
                  >
                    <input
                      type="checkbox"
                      checked={selectedPersonIds.has(user.autodesk_id)}
                      onChange={() => togglePerson(user.autodesk_id)}
                      className="w-3 h-3 rounded border-gray-300"
                    />
                    <div className="min-w-0">
                      <p className="text-xs text-gray-700 truncate">
                        {resolvePersonName(user.autodesk_id)}
                      </p>
                      <p className="text-[10px] text-gray-400 truncate">{user.email}</p>
                    </div>
                  </label>
                ))}
                {filteredUsers.length === 0 && (
                  <p className="text-[10px] text-gray-400 italic py-2">No matching users</p>
                )}
              </div>
            </>
          )}
        </div>
      </div>

      {/* Stats */}
      <div className="px-3 py-2 border-t border-gray-200 text-[11px] text-gray-400 flex items-center gap-3">
        <span>{entities.size} nodes</span>
        <span className="text-gray-300">|</span>
        <span>{relationships.length} edges</span>
      </div>
    </div>
  );
}
