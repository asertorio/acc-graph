import { useCallback, useEffect, useRef, useState } from 'react';
import { Search, X, ChevronUp, ChevronDown } from 'lucide-react';
import { useDataStore } from '../store/dataStore';
import { useGraphStore } from '../store/graphStore';
import type { EntityRecord } from '../types/entities';

function searchEntities(entities: Map<string, EntityRecord>, query: string): Set<string> {
  const matches = new Set<string>();
  if (!query) return matches;

  const lowerQuery = query.toLowerCase();

  for (const [id, entity] of entities) {
    // Search displayName
    if (entity.displayName?.toLowerCase().includes(lowerQuery)) {
      matches.add(id);
      continue;
    }

    // Search all field values
    let found = false;
    for (const value of Object.values(entity.fields)) {
      if (value?.toLowerCase().includes(lowerQuery)) {
        found = true;
        break;
      }
    }
    if (found) {
      matches.add(id);
    }
  }

  return matches;
}

export function SearchBar() {
  const entities = useDataStore((s) => s.entities);
  const searchQuery = useGraphStore((s) => s.searchQuery);
  const setSearchQuery = useGraphStore((s) => s.setSearchQuery);
  const setSearchMatchIds = useGraphStore((s) => s.setSearchMatchIds);
  const searchMatchIds = useGraphStore((s) => s.searchMatchIds);
  const setSelectedNodeId = useGraphStore((s) => s.setSelectedNodeId);

  const [localQuery, setLocalQuery] = useState(searchQuery);
  const [activeMatchIndex, setActiveMatchIndex] = useState(0);
  const debounceRef = useRef<ReturnType<typeof setTimeout> | undefined>(undefined);
  const inputRef = useRef<HTMLInputElement>(null);

  // Debounce search
  useEffect(() => {
    debounceRef.current = setTimeout(() => {
      setSearchQuery(localQuery);
      const matches = searchEntities(entities, localQuery);
      setSearchMatchIds(matches);
      setActiveMatchIndex(0);
    }, 200);

    return () => clearTimeout(debounceRef.current);
  }, [localQuery, entities, setSearchQuery, setSearchMatchIds]);

  const matchArray = Array.from(searchMatchIds);

  const navigateToMatch = useCallback(
    (index: number) => {
      if (matchArray.length === 0) return;
      const wrappedIndex = ((index % matchArray.length) + matchArray.length) % matchArray.length;
      setActiveMatchIndex(wrappedIndex);
      const id = matchArray[wrappedIndex];
      setSelectedNodeId(id);

      // Fit the graph view to the selected node
      const cy = (window as unknown as Record<string, unknown>).__cy as
        | { getElementById: (id: string) => { length: number; position: () => { x: number; y: number } }; animate: (opts: unknown) => void }
        | undefined;
      if (cy) {
        const node = cy.getElementById(id);
        if (node.length) {
          const pos = node.position();
          cy.animate({
            center: { eles: node },
            zoom: { level: 2, position: pos },
            duration: 300,
          });
        }
      }
    },
    [matchArray, setSelectedNodeId],
  );

  const handleKeyDown = useCallback(
    (e: React.KeyboardEvent) => {
      if (e.key === 'Enter') {
        e.preventDefault();
        if (e.shiftKey) {
          navigateToMatch(activeMatchIndex - 1);
        } else {
          navigateToMatch(activeMatchIndex + 1);
        }
      }
      if (e.key === 'Escape') {
        setLocalQuery('');
        setSearchQuery('');
        setSearchMatchIds(new Set());
        inputRef.current?.blur();
      }
    },
    [activeMatchIndex, navigateToMatch, setSearchQuery, setSearchMatchIds],
  );

  const handleClear = useCallback(() => {
    setLocalQuery('');
    setSearchQuery('');
    setSearchMatchIds(new Set());
    setSelectedNodeId(null);
    inputRef.current?.focus();
  }, [setSearchQuery, setSearchMatchIds, setSelectedNodeId]);

  // Keyboard shortcut: Ctrl+F / Cmd+F to focus search
  useEffect(() => {
    const handler = (e: KeyboardEvent) => {
      if ((e.ctrlKey || e.metaKey) && e.key === 'f') {
        e.preventDefault();
        inputRef.current?.focus();
        inputRef.current?.select();
      }
    };
    window.addEventListener('keydown', handler);
    return () => window.removeEventListener('keydown', handler);
  }, []);

  return (
    <div className="flex items-center gap-1 relative">
      <div className="relative flex items-center">
        <Search size={14} className="absolute left-2 text-gray-400 pointer-events-none" />
        <input
          ref={inputRef}
          type="text"
          value={localQuery}
          onChange={(e) => setLocalQuery(e.target.value)}
          onKeyDown={handleKeyDown}
          placeholder="Search entities..."
          className="w-52 pl-7 pr-7 py-1 text-xs border border-gray-200 rounded bg-white focus:outline-none focus:border-blue-400 focus:ring-1 focus:ring-blue-200 placeholder:text-gray-400"
        />
        {localQuery && (
          <button
            onClick={handleClear}
            className="absolute right-1.5 text-gray-400 hover:text-gray-600"
          >
            <X size={12} />
          </button>
        )}
      </div>

      {searchQuery && (
        <div className="flex items-center gap-0.5 text-xs text-gray-500">
          <span className="tabular-nums min-w-[3.5rem] text-center">
            {searchMatchIds.size > 0 ? (
              <>{activeMatchIndex + 1} / {searchMatchIds.size}</>
            ) : (
              'No results'
            )}
          </span>
          {searchMatchIds.size > 0 && (
            <>
              <button
                onClick={() => navigateToMatch(activeMatchIndex - 1)}
                className="p-0.5 rounded hover:bg-gray-100 text-gray-400 hover:text-gray-600"
                title="Previous match (Shift+Enter)"
              >
                <ChevronUp size={14} />
              </button>
              <button
                onClick={() => navigateToMatch(activeMatchIndex + 1)}
                className="p-0.5 rounded hover:bg-gray-100 text-gray-400 hover:text-gray-600"
                title="Next match (Enter)"
              >
                <ChevronDown size={14} />
              </button>
            </>
          )}
        </div>
      )}
    </div>
  );
}
