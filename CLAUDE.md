# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Commands

- `npm run dev` — Start Vite dev server (http://localhost:5173)
- `npm run build` — TypeScript check + Vite production build (`tsc -b && vite build`)
- `npm run lint` — ESLint across all TS/TSX files
- `npm run preview` — Serve the production build locally

No test framework is configured.

## Tech Stack

- **React 19** + **TypeScript 5.9** + **Vite 7.3**
- **Tailwind CSS v4** (uses `@import "tailwindcss"` syntax in `src/index.css`, NOT the v3 `@tailwind` directives)
- **Cytoscape.js 3.33** + **react-cytoscapejs 2.0** (graph rendering)
- **cytoscape-cose-bilkent 4.1** (force-directed layout)
- **Zustand 5** (state management)
- **PapaParse 5.5** (CSV parsing)
- **Lucide React** (icons)

## Path Alias

`@` is aliased to `src/` in both Vite (`vite.config.ts`) and TypeScript (`tsconfig.app.json`). Always use `@/` imports for source files.

## Architecture

ACC Graph is a React/TypeScript app that visualizes relationships between Autodesk Construction Cloud (ACC) entities as an interactive graph. Users load a folder of CSV files (an "Autodesk data extract"), and the app parses entities, resolves relationships, and renders them with Cytoscape.js.

### Data Flow

```
Folder selection (App.tsx)
  → DataSource (CsvDataSource for production, DevDataSource for /autodesk_data_extract)
    → CSV parsing (PapaParse) + JSON schema loading
      → Entity resolution (entityResolver.ts matches relationship endpoints to CSV rows)
        → addUnrelatedEntities() adds CSV records with no relationships
          → Zustand stores (dataStore, filterStore, graphStore)
            → Graph building (graphBuilder.ts applies filters, produces Cytoscape elements)
              → Cytoscape rendering (GraphCanvas.tsx)
```

### UI Layout

```
+----------------------------------------------------------+
|  Header: ACC Graph  |  [Select Folder]  |  [Layout v]    |
+------------+-----------------------------------------+----+
|            |                                         |    |
|  Filter    |      Graph Canvas (Cytoscape)           | D  |
|  Panel     |                                         | e  |
|  (left)    |                                         | t  |
|            |                                         | a  |
|            |                                         | i  |
|            |                                         | l  |
+------------+-----------------------------------------+----+
|  Color Legend (bottom)                                    |
+----------------------------------------------------------+
```

- **FilterPanel** — left sidebar, always visible when data loaded
- **GraphCanvas** — center, `flex-1` fills remaining space
- **DetailPanel** — absolute-positioned overlay (`z-20`) on right side of `<main>`, appears on node click
- **ColorLegend** — bottom bar, shows entity types with counts

### Entity ID Convention

Composite string: `${domain}:${entityType}:${primaryKey}` (e.g. `autodesk-bim360-issue:issue:abc123`). This is the key into the entities `Map<string, EntityRecord>`.

### Domain Mapping (`src/utils/domainMapper.ts`)

Central registry that maps ACC domain + entity type pairs to their CSV file, primary key column(s), display name column, and person-reference columns. This is the single source of truth for adding support for new entity types. Some mappings have empty `csvFile` (e.g. modelcoordination entities) — these become "opaque" nodes with no field data.

Current mappings:

| Domain | Entity Type | CSV File | Primary Key | Display Name |
|--------|------------|----------|-------------|--------------|
| `autodesk-bim360-issue` | `issue` | `issues_issues.csv` | `issue_id` | `title` |
| `autodesk-bim360-issue` | `coordinationother` | `issues_issues.csv` | `issue_id` | `title` |
| `autodesk-bim360-asset` | `asset` | `assets_assets.csv` | `id` | `client_asset_id` |
| `autodesk-construction-photo` | `photo` | `photos_photos.csv` | `uid` (NOT `id`) | `title` |
| `autodesk-construction-schedule` | `activity` | `schedule_activities.csv` | composite: `[schedule_id, unique_id]` | `name` |
| `autodesk-bim360-rfi` | `rfi` | `rfis_rfis.csv` | `id` | `title` |
| `autodesk-construction-markup` | `markup` | `markups_markup.csv` | `uid` | `markup_text` |
| `autodesk-bim360-modelcoordination` | `documentlineage`, `container`, `scope` | _(none — opaque)_ | — | — |
| `autodesk-construction-form` | `form` | `forms_forms.csv` | `id` | `name` |
| `autodesk-bim360-cost` | `pco` | `cost_change_orders.csv` | `id` | `name` |

### State Management (Zustand 5)

Four stores, each in `src/store/`:
- **dataStore** — loaded entities, relationships, schemas, users, loading state
- **filterStore** — entity type toggles, selected person, show-related-only flag, focused entity type
- **graphStore** — selected node ID, hovered node ID, layout choice, cluster highlight toggle
- **viewStore** — saved/loaded named views (persisted to localStorage), snapshots filter + graph store state

Stores are accessed via hooks (`useDataStore(s => s.prop)`) in components and via `getState()` for imperative code in data-loading pipelines and Cytoscape event handlers.

### Key Modules

- **`src/data/sources/`** — `DataSource` interface with two implementations. `CsvDataSource` uses the File System Access API / file input. `DevDataSource` fetches from the local `/autodesk_data_extract` folder served by Vite.
- **`src/data/parsers/`** — CSV parsing, relationship parsing, entity resolution. `entityResolver.ts` is where CSV rows get matched to relationship endpoints and turned into `EntityRecord` objects. `addUnrelatedEntities()` ensures all CSV records appear in the graph, not just those with relationships.
- **`src/graph/`** — Cytoscape configuration: element building (`graphBuilder.ts`), stylesheet (`graphStyles.ts`), layout configs (`layouts.ts`), extension registration (`extensions.ts`).
- **`src/filters/`** — Filter UI and person-ID extraction logic.
- **`src/panels/`** — Detail panel for inspecting a selected node, rendered as an absolute-positioned overlay (`z-20`) on the right side of the graph area. Schema-aware field rendering with special formatting for timestamps, booleans, UUIDs, and person references.
- **`src/legend/`** — Color legend component; `colorMap.ts` defines the color and label for each `EntityType`.

## Autodesk Data Extract Structure

The `autodesk_data_extract/` folder contains ~254 CSV files + `schemas/` subfolder with JSON schemas. All CSVs have a UTF-8 BOM character (PapaParse handles this). Key files:

### Relationship CSV (the graph's edges)

**`relationships_entity_relationship.csv`** — Every row is a relationship between two entities:
```
bim360_account_id, bim360_project_id, relationship_guid,
item1_domain, item1_entitytype, item1_id,
item2_domain, item2_entitytype, item2_id,
created_on, deleted_on, is_deleted, is_service_owned
```
- `is_deleted='t'` rows are filtered out by `relationshipParser.ts`
- `item1_domain`/`item1_entitytype`/`item1_id` and `item2_*` map to entries in the domain mapper to find the CSV file + primary key

### Entity CSVs (the graph's nodes)

Each entity type has its own CSV (e.g. `issues_issues.csv`, `assets_assets.csv`). Naming convention: `{module}_{table}.csv`. Columns vary per entity type but all have a primary key column mapped in `domainMapper.ts`.

Person-reference columns (e.g. `assignee_id`, `owner_id`, `created_by`) store Autodesk user IDs that resolve to names via `admin_users.csv`.

### Users CSV

**`admin_users.csv`** — User records with columns: `id`, `autodesk_id`, `name`, `email`, `first_name`, `last_name`, `job_title`, `default_company_id`. The `autodesk_id` column is used to resolve person references in entity fields.

### Schema JSONs

`schemas/*.json` — Each JSON file maps table names to column definitions:
```json
{
  "table_name": {
    "column_name": {
      "data_type": "string: UUID",
      "constraints": [],
      "notes": "Description",
      "ordinal_position": 1
    }
  }
}
```
Used by DetailPanel for field ordering (`ordinal_position`) and type-aware rendering (`data_type`).

## Directory Structure

```
acc-graph/
  src/
    app/           App.tsx, main.tsx
    data/
      sources/     DataSource.ts (interface), CsvDataSource.ts, DevDataSource.ts
      parsers/     csvParser.ts, relationshipParser.ts, entityResolver.ts
      schemas/     schemaLoader.ts, schemaRegistry.ts, types.ts
    graph/         GraphCanvas.tsx, graphBuilder.ts, graphStyles.ts, layouts.ts, extensions.ts
    panels/        DetailPanel.tsx, EntityFieldRenderer.tsx, fieldFormatters.ts
    filters/       FilterPanel.tsx, filterEngine.ts
    legend/        ColorLegend.tsx, colorMap.ts
    store/         dataStore.ts, filterStore.ts, graphStore.ts, viewStore.ts
    types/         entities.ts, relationships.ts, graph.ts, filters.ts, views.ts
    utils/         domainMapper.ts, personResolver.ts
  autodesk_data_extract/   (sample data — ~254 CSVs + schemas/)
```

## Known Patterns & Pitfalls

- **Cytoscape event handlers**: `react-cytoscapejs` calls the `cy` prop callback on every `componentDidUpdate`. Use a ref guard (`handlersRegisteredRef`) to register handlers only once per cy instance. Always use `useGraphStore.getState()` inside Cytoscape event handlers to avoid stale closures — never capture Zustand selectors in the callback closure.
- **Graph highlight model**: Hover and selection both use imperative `dimmed`/`highlighted` classes on Cytoscape elements. When a node is hovered, its neighborhood (or full connected cluster if `clusterHighlight` is enabled) is highlighted and everything else is dimmed. When a node is clicked (selected), the same highlighting persists — `mouseout` re-applies the selected node's highlights instead of clearing everything. Clicking the background clears the selection and all highlights. `getCluster()` in `GraphCanvas.tsx` does a BFS to find the full connected component from a node.
- **Focus mode (stylesheet-driven)**: Focus uses declarative Cytoscape stylesheet attribute selectors (`node[entityType != "xxx"]`), NOT imperative `addClass`/`removeClass`. `buildStylesheet(focusedEntityType)` injects attribute-based dim/highlight rules when focus is active. Hover uses classes (`dimmed`/`highlighted`). These two mechanisms are intentionally separate to avoid race conditions with `react-cytoscapejs` element lifecycle updates. Never mix them — do not add class-based focus rules.
- **Entity completeness**: `resolveAllEntities()` only creates entities referenced in relationships. `addUnrelatedEntities()` must be called afterward (in both `CsvDataSource` and `DevDataSource`) to include all CSV records. The `showRelatedOnly` filter (defaults `false`) controls whether disconnected nodes display.
- **Pre-existing build errors**: `npm run build` has TypeScript errors unrelated to app logic (missing type declarations for `cytoscape-cose-bilkent`, `react-cytoscapejs`; `Stylesheet` type mismatch). The dev server (`npm run dev`) works fine.
- **Duplicate domain mappings**: Some CSV files are referenced by multiple domain/entityType pairs (e.g. `issues_issues.csv` is used by both `issue` and `coordinationother`). `addUnrelatedEntities()` handles this by skipping entities already in the map.
- **CSV BOM characters**: All Autodesk CSVs start with a UTF-8 BOM (`\uFEFF`). PapaParse handles this natively — no manual stripping needed.
- **Composite primary keys**: Schedule activities use `[schedule_id, unique_id]` as a composite key joined with `-`. This is handled by `buildEntityIndex()` in `entityResolver.ts`.
