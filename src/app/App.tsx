import { useCallback, useEffect, useRef, useState } from 'react';
import { FolderOpen, Network, Loader2, X, Upload, Info } from 'lucide-react';
import { useDataStore } from '../store/dataStore';
import { useGraphStore } from '../store/graphStore';
import { CsvDataSource } from '../data/sources/CsvDataSource';
import { DevDataSource } from '../data/sources/DevDataSource';
import type { DataSource } from '../data/sources/DataSource';
import { setUsers } from '../utils/personResolver';
import { setLookups } from '../utils/lookupRegistry';
import { setSchemaRegistry } from '../data/schemas/schemaRegistry';
import { GraphCanvas } from '../graph/GraphCanvas';
import { FilterPanel } from '../filters/FilterPanel';
import { DetailPanel } from '../panels/DetailPanel';
import { ImpliedEdgePanel } from '../panels/ImpliedEdgePanel';
import { ColorLegend } from '../legend/ColorLegend';
import { ViewManager } from '../views/ViewManager';
import type { LayoutName } from '../types/graph';

const LAYOUTS: { value: LayoutName; label: string }[] = [
  { value: 'cose-bilkent', label: 'Force Directed' },
  { value: 'circle', label: 'Circle' },
  { value: 'grid', label: 'Grid' },
  { value: 'concentric', label: 'Concentric' },
  { value: 'breadthfirst', label: 'Hierarchy' },
];

export function App() {
  const isLoading = useDataStore((s) => s.isLoading);
  const isLoaded = useDataStore((s) => s.isLoaded);
  const loadProgress = useDataStore((s) => s.loadProgress);
  const error = useDataStore((s) => s.error);
  const entities = useDataStore((s) => s.entities);
  const relationships = useDataStore((s) => s.relationships);
  const selectedNodeId = useGraphStore((s) => s.selectedNodeId);
  const selectedEdgeId = useGraphStore((s) => s.selectedEdgeId);
  const setSelectedNodeId = useGraphStore((s) => s.setSelectedNodeId);
  const setSelectedEdgeId = useGraphStore((s) => s.setSelectedEdgeId);
  const layout = useGraphStore((s) => s.layout);
  const setLayout = useGraphStore((s) => s.setLayout);
  const spacingFactor = useGraphStore((s) => s.spacingFactor);
  const setSpacingFactor = useGraphStore((s) => s.setSpacingFactor);

  const [isSampleData, setIsSampleData] = useState(false);
  const [showWelcome, setShowWelcome] = useState(false);
  const folderInputRef = useRef<HTMLInputElement>(null);
  const autoLoadedRef = useRef(false);

  const loadData = useCallback(async (dataSource: DataSource, sample = false) => {
    const store = useDataStore.getState();
    store.setLoading(true);
    store.setError(null);

    try {
      const result = await dataSource.loadAll((progress) => {
        store.setLoadProgress(progress);
      });

      setUsers(result.users);
      setLookups(result.lookups);
      setSchemaRegistry(result.schemas);
      store.setEntities(result.entities);
      store.setRelationships(result.relationships);
      store.setSchemas(result.schemas);
      store.setUsers(result.users);
      store.setLoaded(true);
      setIsSampleData(sample);
    } catch (err) {
      store.setError(err instanceof Error ? err.message : 'Failed to load data');
    } finally {
      store.setLoading(false);
      store.setLoadProgress(null);
    }
  }, []);

  // Auto-load sample data on mount
  useEffect(() => {
    if (autoLoadedRef.current) return;
    autoLoadedRef.current = true;

    const ds = new DevDataSource();
    loadData(ds, true).then(() => {
      const dismissed = localStorage.getItem('acc-graph-welcome-dismissed');
      if (!dismissed) {
        setShowWelcome(true);
      }
    });
  }, [loadData]);

  const handleDismissWelcome = useCallback(() => {
    setShowWelcome(false);
    localStorage.setItem('acc-graph-welcome-dismissed', '1');
  }, []);

  const handleSelectFolder = useCallback(async () => {
    try {
      const ds = await CsvDataSource.fromDirectoryPicker();
      await loadData(ds, false);
    } catch (err) {
      if (err instanceof Error && err.name === 'AbortError') return;
      useDataStore.getState().setError(err instanceof Error ? err.message : 'Failed to open folder');
    }
  }, [loadData]);

  const handleFolderInput = useCallback(async (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (!files || files.length === 0) return;
    const ds = CsvDataSource.fromFileList(files);
    await loadData(ds, false);
  }, [loadData]);

  const handleDrop = useCallback(async (e: React.DragEvent) => {
    e.preventDefault();
    const items = e.dataTransfer.items;
    if (!items) return;

    const files = new Map<string, File>();
    const entries: FileSystemEntry[] = [];

    for (const item of Array.from(items)) {
      const entry = item.webkitGetAsEntry?.();
      if (entry) entries.push(entry);
    }

    await collectDroppedFiles(entries, files);
    if (files.size > 0) {
      const ds = CsvDataSource.fromDroppedItems(files);
      await loadData(ds, false);
    }
  }, [loadData]);

  const handleDragOver = useCallback((e: React.DragEvent) => {
    e.preventDefault();
  }, []);

  // Keyboard shortcut: Escape closes detail panel
  const handleKeyDown = useCallback((e: React.KeyboardEvent) => {
    if (e.key === 'Escape') {
      if (selectedNodeId) setSelectedNodeId(null);
      if (selectedEdgeId) setSelectedEdgeId(null);
    }
  }, [selectedNodeId, selectedEdgeId, setSelectedNodeId, setSelectedEdgeId]);

  return (
    <div
      className="h-screen flex flex-col bg-gray-50"
      onKeyDown={handleKeyDown}
      tabIndex={0}
      onDrop={handleDrop}
      onDragOver={handleDragOver}
    >
      {/* Header */}
      <header className="h-12 bg-white border-b border-gray-200 flex items-center px-4 gap-4 shrink-0">
        <div className="flex items-center gap-2">
          <Network size={18} className="text-blue-600" />
          <h1 className="text-sm font-bold text-gray-800">ACC Graph</h1>
        </div>

        <div className="flex items-center gap-2 ml-4">
          <button
            onClick={handleSelectFolder}
            disabled={isLoading}
            className="flex items-center gap-1.5 px-3 py-1.5 text-xs bg-blue-600 text-white rounded hover:bg-blue-700 disabled:opacity-50"
          >
            <FolderOpen size={14} />
            Select Folder
          </button>
          {/* Fallback folder input for browsers without directory picker */}
          <input
            ref={folderInputRef}
            type="file"
            /* @ts-expect-error webkitdirectory is a non-standard attribute */
            webkitdirectory=""
            directory=""
            multiple
            onChange={handleFolderInput}
            className="hidden"
          />
          <button
            onClick={() => folderInputRef.current?.click()}
            disabled={isLoading}
            className="text-xs text-gray-500 hover:text-gray-700 underline"
          >
            or browse
          </button>
        </div>

        {isLoaded && (
          <div className="flex items-center gap-3 ml-4 text-xs text-gray-500">
            {isSampleData && (
              <span className="px-2 py-0.5 bg-amber-100 text-amber-700 rounded-full text-[10px] font-medium">
                Sample Data
              </span>
            )}
            <span>{entities.size} nodes</span>
            <span>{relationships.length} edges</span>
            <button
              onClick={() => setShowWelcome(true)}
              className="text-gray-400 hover:text-gray-600"
              title="About ACC Graph"
            >
              <Info size={14} />
            </button>
          </div>
        )}

        <div className="ml-auto flex items-center gap-2">
          {isLoaded && <ViewManager />}
          <label className="text-xs text-gray-500">Layout:</label>
          <select
            value={layout}
            onChange={(e) => setLayout(e.target.value as LayoutName)}
            className="text-xs border border-gray-200 rounded px-2 py-1 bg-white"
          >
            {LAYOUTS.map((l) => (
              <option key={l.value} value={l.value}>
                {l.label}
              </option>
            ))}
          </select>
          {layout === 'cose-bilkent' && (
            <div className="flex items-center gap-1.5 ml-2">
              <label className="text-xs text-gray-500">Spacing:</label>
              <input
                type="range"
                min="0.5"
                max="2.0"
                step="0.1"
                value={spacingFactor}
                onChange={(e) => setSpacingFactor(parseFloat(e.target.value))}
                className="w-20 h-1 accent-blue-600"
              />
              <span className="text-[10px] text-gray-400 w-6 tabular-nums">{spacingFactor.toFixed(1)}</span>
            </div>
          )}
        </div>
      </header>

      {/* Main Content */}
      <div className="flex-1 flex overflow-hidden">
        {isLoaded && <FilterPanel />}

        <main className="flex-1 flex relative min-w-0">
          {!isLoaded && !isLoading && !error && <EmptyState />}

          {isLoading && <LoadingState progress={loadProgress} />}

          {error && <ErrorState error={error} />}

          {isLoaded && !isLoading && <GraphCanvas />}

          {isLoaded && selectedNodeId && !selectedEdgeId && (
            <div className="absolute top-0 right-0 bottom-0 z-20">
              <DetailPanel />
            </div>
          )}

          {isLoaded && selectedEdgeId && (
            <div className="absolute top-0 right-0 bottom-0 z-20">
              <ImpliedEdgePanel />
            </div>
          )}
        </main>
      </div>

      {/* Legend */}
      {isLoaded && <ColorLegend />}

      {/* Welcome Modal */}
      {showWelcome && (
        <WelcomeModal
          onDismiss={handleDismissWelcome}
          onSelectFolder={() => {
            handleDismissWelcome();
            handleSelectFolder();
          }}
        />
      )}
    </div>
  );
}

function EmptyState() {
  return (
    <div className="flex-1 flex flex-col items-center justify-center text-gray-400 gap-4">
      <Network size={48} className="text-gray-300" />
      <div className="text-center">
        <p className="text-lg font-medium text-gray-500">Welcome to ACC Graph</p>
        <p className="text-sm mt-1">
          Select your <code className="bg-gray-100 px-1 rounded">autodesk_data_extract</code> folder to begin
        </p>
        <p className="text-xs text-gray-400 mt-2">
          You can also drag and drop the folder here
        </p>
      </div>
    </div>
  );
}

function LoadingState({ progress }: { progress: { current: number; total: number; currentFile: string } | null }) {
  return (
    <div className="flex-1 flex flex-col items-center justify-center gap-3">
      <Loader2 size={32} className="text-blue-500 animate-spin" />
      <p className="text-sm text-gray-600">Loading data...</p>
      {progress && (
        <div className="w-64">
          <div className="flex justify-between text-xs text-gray-400 mb-1">
            <span>{progress.currentFile}</span>
            <span>{progress.current}/{progress.total}</span>
          </div>
          <div className="h-1.5 bg-gray-200 rounded-full overflow-hidden">
            <div
              className="h-full bg-blue-500 rounded-full transition-all duration-300"
              style={{ width: `${(progress.current / progress.total) * 100}%` }}
            />
          </div>
        </div>
      )}
    </div>
  );
}

function ErrorState({ error }: { error: string }) {
  return (
    <div className="flex-1 flex flex-col items-center justify-center gap-3">
      <p className="text-sm text-red-500">Error: {error}</p>
      <button
        onClick={() => useDataStore.getState().setError(null)}
        className="text-xs text-blue-500 hover:text-blue-700"
      >
        Dismiss
      </button>
    </div>
  );
}

function WelcomeModal({ onDismiss, onSelectFolder }: { onDismiss: () => void; onSelectFolder: () => void }) {
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-sm">
      <div className="bg-white rounded-xl shadow-2xl max-w-md w-full mx-4 overflow-hidden">
        <div className="bg-gradient-to-r from-blue-600 to-blue-700 px-6 py-4 flex items-center justify-between">
          <div className="flex items-center gap-2 text-white">
            <Network size={20} />
            <h2 className="font-semibold text-base">Welcome to ACC Graph</h2>
          </div>
          <button onClick={onDismiss} className="text-white/70 hover:text-white">
            <X size={18} />
          </button>
        </div>

        <div className="px-6 py-5 space-y-4">
          <p className="text-sm text-gray-600 leading-relaxed">
            You're viewing <strong>sample data</strong> to demonstrate how ACC Graph visualizes
            relationships between Autodesk Construction Cloud entities.
          </p>

          <div className="bg-gray-50 rounded-lg p-4 space-y-3">
            <p className="text-sm font-medium text-gray-700">To load your own project data:</p>
            <ol className="text-sm text-gray-600 space-y-2 list-decimal list-inside">
              <li>In ACC, select <strong>Insight</strong> from the product picker</li>
              <li>Click <strong>Data Connector</strong> at the bottom of the left panel</li>
              <li>Run or schedule an extraction</li>
              <li>Download and unzip the exported ZIP file</li>
            </ol>
          </div>

          <p className="text-xs text-gray-400">
            Your data never leaves your browser -- everything is processed locally.
          </p>
        </div>

        <div className="px-6 py-4 bg-gray-50 border-t border-gray-100 flex items-center gap-3">
          <button
            onClick={onSelectFolder}
            className="flex items-center gap-2 px-4 py-2 text-sm bg-blue-600 text-white rounded-lg hover:bg-blue-700 font-medium"
          >
            <Upload size={14} />
            Load My Data
          </button>
          <button
            onClick={onDismiss}
            className="px-4 py-2 text-sm text-gray-600 hover:text-gray-800 font-medium"
          >
            Explore Sample Data
          </button>
        </div>
      </div>
    </div>
  );
}

interface FileSystemEntry {
  isFile: boolean;
  isDirectory: boolean;
  name: string;
  file?: (cb: (file: File) => void) => void;
  createReader?: () => { readEntries: (cb: (entries: FileSystemEntry[]) => void) => void };
}

async function collectDroppedFiles(entries: FileSystemEntry[], files: Map<string, File>): Promise<void> {
  for (const entry of entries) {
    if (entry.isFile && entry.file) {
      const file = await new Promise<File>((resolve) => entry.file!(resolve));
      files.set(file.name, file);
    } else if (entry.isDirectory && entry.createReader) {
      const reader = entry.createReader();
      const subEntries = await new Promise<FileSystemEntry[]>((resolve) => reader.readEntries(resolve));
      await collectDroppedFiles(subEntries, files);
    }
  }
}
