import { useState, useRef, useEffect } from 'react';
import { Bookmark, Trash2 } from 'lucide-react';
import { useViewStore } from '../store/viewStore';

export function ViewManager() {
  const [isOpen, setIsOpen] = useState(false);
  const [newName, setNewName] = useState('');
  const popoverRef = useRef<HTMLDivElement>(null);
  const savedViews = useViewStore((s) => s.savedViews);
  const saveCurrentView = useViewStore((s) => s.saveCurrentView);
  const loadView = useViewStore((s) => s.loadView);
  const deleteView = useViewStore((s) => s.deleteView);

  // Close popover on outside click
  useEffect(() => {
    if (!isOpen) return;
    function handleClick(e: MouseEvent) {
      if (popoverRef.current && !popoverRef.current.contains(e.target as Node)) {
        setIsOpen(false);
      }
    }
    document.addEventListener('mousedown', handleClick);
    return () => document.removeEventListener('mousedown', handleClick);
  }, [isOpen]);

  const handleSave = () => {
    const name = newName.trim();
    if (!name) return;
    saveCurrentView(name);
    setNewName('');
  };

  const handleLoad = (id: string) => {
    loadView(id);
    setIsOpen(false);
  };

  return (
    <div className="relative" ref={popoverRef}>
      <button
        onClick={() => setIsOpen(!isOpen)}
        className={`p-1.5 rounded hover:bg-gray-100 ${
          isOpen ? 'bg-gray-100 text-blue-600' : 'text-gray-500'
        }`}
        title="Saved views"
      >
        <Bookmark size={16} />
      </button>

      {isOpen && (
        <div className="absolute right-0 top-full mt-1 w-64 bg-white border border-gray-200 rounded-lg shadow-lg z-30">
          <div className="p-2 border-b border-gray-100">
            <h3 className="text-xs font-semibold text-gray-500 uppercase tracking-wider">Saved Views</h3>
          </div>

          {savedViews.length > 0 ? (
            <div className="max-h-48 overflow-y-auto">
              {savedViews.map((view) => (
                <div
                  key={view.id}
                  className="flex items-center gap-2 px-2 py-1.5 hover:bg-gray-50 group"
                >
                  <button
                    onClick={() => handleLoad(view.id)}
                    className="flex-1 text-left min-w-0"
                  >
                    <p className="text-xs text-gray-700 truncate">{view.name}</p>
                    <p className="text-[10px] text-gray-400">
                      {view.enabledEntityTypes.length} types, {view.layout}
                    </p>
                  </button>
                  <button
                    onClick={() => deleteView(view.id)}
                    className="p-1 rounded text-gray-300 hover:text-red-500 hover:bg-red-50 opacity-0 group-hover:opacity-100 transition-opacity shrink-0"
                    title="Delete view"
                  >
                    <Trash2 size={12} />
                  </button>
                </div>
              ))}
            </div>
          ) : (
            <p className="px-3 py-4 text-xs text-gray-400 text-center italic">
              No saved views yet
            </p>
          )}

          <div className="p-2 border-t border-gray-100 flex gap-1.5">
            <input
              type="text"
              placeholder="View name..."
              value={newName}
              onChange={(e) => setNewName(e.target.value)}
              onKeyDown={(e) => e.key === 'Enter' && handleSave()}
              className="flex-1 text-xs border border-gray-200 rounded px-2 py-1 focus:outline-none focus:border-blue-400 min-w-0"
            />
            <button
              onClick={handleSave}
              disabled={!newName.trim()}
              className="px-2 py-1 text-xs bg-blue-600 text-white rounded hover:bg-blue-700 disabled:opacity-40 shrink-0"
            >
              Save
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
