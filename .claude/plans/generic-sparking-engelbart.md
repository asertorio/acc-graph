# ACC Graph - Relationship Graph Visualizer

## Context

The `autodesk_data_extract` folder contains 254 CSV files exported from Autodesk Construction Cloud (ACC) via Data Connector, plus 51 JSON schema files. The goal is to build a web application that visualizes the relationships between entities (issues, assets, photos, RFIs, schedule activities, etc.) as an interactive graph, with filtering, detail panels, and future extensibility for API integration, map views, and cross-project relationships.

**Stack:** React 18 + TypeScript + Vite + Cytoscape.js + Tailwind CSS

---

## Phase 1: Project Scaffolding & Data Layer

### Step 1 - Initialize project
Create a new Vite React-TS project inside `acc-graph/`:
```
acc-graph/          (the application)
  autodesk_data_extract/   (existing data, stays where it is)
```

**Dependencies:**
- `react`, `react-dom`, `cytoscape`, `react-cytoscapejs`, `cytoscape-cose-bilkent`, `cytoscape-popper`
- `papaparse` (CSV parsing with BOM handling)
- `zustand` (state management)
- `tailwindcss`, `lucide-react` (styling & icons)
- `@tippy.js/react` (tooltips)
- Dev: `@types/cytoscape`, `@types/papaparse`, `typescript`, `vite`, `@vitejs/plugin-react`

### Step 2 - Type definitions
- `src/types/entities.ts` - `EntityRecord`, `EntityCollection`, `EntitySet`, `PersonReference`
- `src/types/relationships.ts` - `Relationship` type
- `src/types/graph.ts` - Cytoscape element types, layout names
- `src/types/filters.ts` - Filter state types

### Step 3 - Domain mapper configuration
`src/utils/domainMapper.ts` - Maps `(domain, entityType)` from the relationships CSV to the correct CSV file, primary key column, display name column, and person columns.

**Critical ID resolution discoveries:**
| Domain | Entity Type | CSV File | Primary Key | Display Name |
|--------|------------|----------|-------------|--------------|
| `autodesk-bim360-issue` | `issue` | `issues_issues.csv` | `issue_id` | `title` |
| `autodesk-bim360-asset` | `asset` | `assets_assets.csv` | `id` | `client_asset_id` |
| `autodesk-construction-photo` | `photo` | `photos_photos.csv` | `uid` (not `id`) | `title` |
| `autodesk-construction-schedule` | `activity` | `schedule_activities.csv` | composite: `{schedule_id}-{unique_id}` | `name` |
| `autodesk-bim360-rfi` | `rfi` | `rfis_rfis.csv` | `id` | `title` |
| `autodesk-construction-markup` | `markup` | `markups_markup.csv` | `uid` | `markup_text` |
| `autodesk-bim360-modelcoordination` | `documentlineage`, `container`, `scope` | No CSV | N/A | Show as opaque nodes |
| `autodesk-construction-form` | `form` | `forms_forms.csv` | `id` | `name` |
| `autodesk-bim360-cost` | `pco` | `cost_change_orders.csv` | `id` | `name` |

### Step 4 - CSV parsing layer
- `src/data/parsers/csvParser.ts` - PapaParse wrapper (handles BOM characters present in the CSVs)
- `src/data/parsers/relationshipParser.ts` - Parse `relationships_entity_relationship.csv`, filter out `is_deleted='t'`
- `src/data/parsers/entityResolver.ts` - Resolve `(domain, entitytype, id)` tuples to entity records

### Step 5 - Data source abstraction
- `src/data/sources/DataSource.ts` - Interface: `loadEntities()`, `loadRelationships()`, `loadSchemas()`, `loadUsers()`
- `src/data/sources/CsvDataSource.ts` - Implementation using File System Access API (`window.showDirectoryPicker()`) with drag-and-drop fallback

This abstraction allows swapping in an API data source later without changing the UI.

### Step 6 - Schema loader
- `src/data/schemas/schemaLoader.ts` - Parse JSON schema files from `schemas/` subfolder
- `src/data/schemas/schemaRegistry.ts` - Registry mapping table names to column definitions (data_type, notes, ordinal_position)

### Step 7 - Zustand stores
- `src/store/dataStore.ts` - Raw loaded data: entities, relationships, schemas, users, loading state
- `src/store/filterStore.ts` - Active filters: enabled entity types, selected persons, show-related-only toggle
- `src/store/graphStore.ts` - Graph state: selected node, hovered node, layout choice

---

## Phase 2: Graph Visualization

### Step 8 - Graph element builder
`src/graph/graphBuilder.ts` - Transforms `EntityCollection` + `Relationship[]` + `FilterState` into Cytoscape node/edge arrays:
1. Collect entities referenced in non-deleted relationships
2. Apply entity type filter
3. Apply person filter (if active)
4. Apply "show related only" filter
5. Build node definitions with `{ id, entityType, domain, displayName, ...metadata }`
6. Build edge definitions from relationship_guid

### Step 9 - Styling & colors
`src/graph/graphStyles.ts` - Cytoscape stylesheet with per-type colors:
- Issues: red, Assets: blue, Photos: green, Activities: purple, RFIs: amber, Forms: pink, Markups: teal, Change Orders: lime, Documents: violet, Opaque nodes: gray

`src/legend/colorMap.ts` - Central color map referenced by styles and legend component

### Step 10 - Graph canvas component
`src/graph/GraphCanvas.tsx` - Wraps `react-cytoscapejs`:
- Registers event handlers: `tap` (select node), `mouseover`/`mouseout` (hover tooltip)
- Manages Cytoscape instance ref
- Applies cose-bilkent layout (force-directed with good clustering)
- Re-renders when filtered elements change

### Step 11 - Cytoscape extensions
`src/graph/extensions.ts` - Register `cytoscape-cose-bilkent` (layout) and `cytoscape-popper` (tooltips)

---

## Phase 3: UI & Interactions

### Step 12 - Application layout
```
+----------------------------------------------------------+
|  Header: ACC Graph  |  [Select Folder]  |  [Layout v]    |
+------------+-------------------------------+--------------+
|            |                               |              |
|  Filter    |      Graph Canvas             |   Detail     |
|  Panel     |      (Cytoscape)              |   Panel      |
|  (left)    |                               |   (right,    |
|            |                               |    on click)  |
+------------+-------------------------------+--------------+
|  Color Legend (bottom)                                    |
+----------------------------------------------------------+
```

### Step 13 - Tooltip on hover
Use `cytoscape-popper` + Tippy.js to show tooltip on node hover:
- Entity type badge (colored), display name, status, created date

### Step 14 - Detail panel (right side)
`src/panels/DetailPanel.tsx` - Slides in when a node is clicked:
- Header: entity type badge + display name
- Schema-driven field rendering: ordered by `ordinal_position`, formatted by `data_type`
- Person fields resolved to names via `admin_users.csv` (`autodesk_id` column)
- "Related Items" section listing connected entities
- "No data available" state for opaque nodes (entities with no CSV data)

`src/panels/EntityFieldRenderer.tsx` - Renders fields by type:
- `timestamp: SQL` -> formatted date
- `boolean` -> Yes/No badge
- `string: UUID` -> monospace
- `enum: string` -> colored badge
- Person IDs -> resolved user name + email

### Step 15 - Filter panel (left side)
`src/filters/FilterPanel.tsx`:
- **Entity type checkboxes** with color dots + count badges (clickable to toggle)
- **"Show All" / "Show Related Only" toggle**
- **Person filter** - searchable dropdown of users from `admin_users.csv`, multi-select
  - When active: only shows entities where selected person appears in any person column (assignee, owner, creator, etc.)
  - People are NEVER shown as graph nodes
- **Reset Filters** button

### Step 16 - Color legend
`src/legend/ColorLegend.tsx` - Bottom bar showing only entity types present in current data, with color dot + label + count. Clicking toggles filter.

### Step 17 - Folder loading UX
- **Empty state**: Prominent "Select Folder" button with instructions
- **Loading state**: Progress bar showing current file being parsed
- **Error state**: Show which files failed
- **Loaded state**: Graph + summary stats (X nodes, Y edges, Z types)

---

## Phase 4: Polish & Edge Cases

### Step 18 - Edge case handling
- BOM characters in CSVs (PapaParse handles natively)
- Entities in relationships with no matching CSV -> opaque/phantom nodes
- Composite schedule activity IDs (`{schedule_id}-{unique_id}`)
- Empty/null fields in detail panel
- Long field values truncated with expand
- Deleted relationships filtered out

### Step 19 - Performance
- Debounce filter changes (avoid re-layout on every toggle)
- `cy.batch()` for bulk element updates
- Lazy-load entity details on click
- cose-bilkent layout with `animate: true` for smooth transitions

### Step 20 - Keyboard shortcuts
- `Escape` to close detail panel
- Tab navigation in filter panel

---

## Future Phases (design accommodated, not implemented)

- **ACC API integration**: `ApiDataSource` implementing same `DataSource` interface, OAuth flow
- **Thumbnails**: API calls to fetch item preview images, displayed on nodes/detail panel
- **Draw relationships**: `cytoscape-edgehandles` extension for click-drag edge creation
- **Map view**: `cytoscape-leaflet` extension for GPS-located items (photos have lat/lng, projects have latitude/longitude)
- **Multi-project**: Compound/group nodes in Cytoscape to group by project, cross-project edges
- **Live data connector**: Real-time data source option

---

## Directory Structure

```
acc-graph/
  src/
    app/           App.tsx, main.tsx
    data/
      sources/     DataSource.ts (interface), CsvDataSource.ts
      parsers/     csvParser.ts, relationshipParser.ts, entityResolver.ts
      schemas/     schemaLoader.ts, schemaRegistry.ts, types.ts
    graph/         GraphCanvas.tsx, graphBuilder.ts, graphStyles.ts, layouts.ts, extensions.ts
    panels/        DetailPanel.tsx, EntityFieldRenderer.tsx, fieldFormatters.ts
    filters/       FilterPanel.tsx, filterEngine.ts
    legend/        ColorLegend.tsx, colorMap.ts
    store/         dataStore.ts, filterStore.ts, graphStore.ts
    types/         entities.ts, relationships.ts, graph.ts, filters.ts
    utils/         domainMapper.ts, personResolver.ts
  public/
  autodesk_data_extract/   (existing data)
```

---

## Verification Plan

1. **Build**: `npm run dev` starts without errors
2. **Load data**: Select the `autodesk_data_extract` folder -> all CSVs parse, progress shown
3. **Graph renders**: Nodes appear colored by type, edges connect related items
4. **Hover tooltip**: Hovering a node shows summary popup
5. **Click detail**: Clicking a node opens right panel with all entity fields
6. **Filter by type**: Unchecking "Assets" hides all asset nodes and their edges
7. **Filter by person**: Selecting a user shows only entities they're involved with
8. **Show Related Only**: Toggle hides orphan nodes (those with no relationships)
9. **Color legend**: Shows correct types with counts, clicking toggles filter
10. **Opaque nodes**: Entities without CSV data show with gray styling and "No data" in detail panel
