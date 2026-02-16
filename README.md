# ACC Graph

Interactive graph visualizer for **Autodesk Construction Cloud** data extracts. Load a folder of CSV files exported from ACC and instantly see how Issues, Assets, RFIs, Forms, Photos, Markups, Schedule Activities, and Cost Change Orders relate to each other.

**[Live Demo](https://asertorio.github.io/acc-graph/)**

## Features

- **Relationship graph** -- every entity and its connections rendered with Cytoscape.js
- **Filter by entity type** -- toggle Issues, Assets, RFIs, Photos, Forms, Markups, Activities, Change Orders, and more
- **Filter by person** -- isolate entities assigned to or created by a specific user
- **Focus mode** -- dim everything except one entity type to spotlight it
- **Detail panel** -- click any node to inspect all of its CSV fields with schema-aware formatting
- **Multiple layouts** -- Force Directed, Circle, Grid, Concentric, Hierarchy
- **Cluster highlighting** -- hover a node to highlight its full connected component
- **Saved views** -- snapshot your current filters and layout, restore them later
- **Drag-and-drop** -- drop a folder onto the page to load it
- **Runs entirely in the browser** -- no server, no uploads; your data never leaves your machine

## Supported Entity Types

| Type | CSV Source | Color |
|------|-----------|-------|
| Issues | `issues_issues.csv` | Red |
| Assets | `assets_assets.csv` | Blue |
| Photos | `photos_photos.csv` | Green |
| RFIs | `rfis_rfis.csv` | Amber |
| Forms | `forms_forms.csv` | Pink |
| Markups | `markups_markup.csv` | Teal |
| Schedule Activities | `schedule_activities.csv` | Purple |
| Change Orders (PCO) | `cost_change_orders.csv` | Lime |
| Documents / Containers / Scopes | _(Model Coordination -- opaque)_ | Gray |

Relationships are read from `relationships_entity_relationship.csv`. User names are resolved via `admin_users.csv`.

## Getting Started

### Use the hosted version

1. Go to **[asertorio.github.io/acc-graph](https://asertorio.github.io/acc-graph/)**
2. Click **Select Folder** and choose your unzipped `autodesk_data_extract` folder
3. Explore the graph

### Run locally

```bash
git clone https://github.com/asertorio/acc-graph.git
cd acc-graph
npm install
npm run dev
```

Open [http://localhost:5173](http://localhost:5173).

## How to Get an Autodesk Data Extract

To access Data Connector:

1. Select **Insight** from the product picker in Autodesk Construction Cloud
2. Click **Data connector** at the bottom of the left panel
3. Run or schedule an extraction
4. Download the exported ZIP file (contains ~250 CSV files plus JSON schemas)
5. Unzip the file
6. Point ACC Graph at the unzipped `autodesk_data_extract` folder

## Tech Stack

- [React 19](https://react.dev) + [TypeScript 5.9](https://www.typescriptlang.org)
- [Vite 7](https://vite.dev)
- [Cytoscape.js](https://js.cytoscape.org) + [react-cytoscapejs](https://github.com/plotly/react-cytoscapejs) -- graph rendering
- [cytoscape-cose-bilkent](https://github.com/cytoscape/cytoscape.js-cose-bilkent) -- force-directed layout
- [Tailwind CSS v4](https://tailwindcss.com)
- [Zustand 5](https://zustand.docs.pmnd.rs) -- state management
- [PapaParse](https://www.papaparse.com) -- CSV parsing
- [Lucide React](https://lucide.dev) -- icons

## Scripts

| Command | Description |
|---------|-------------|
| `npm run dev` | Start Vite dev server |
| `npm run build` | TypeScript check + production build |
| `npm run lint` | ESLint |
| `npm run preview` | Serve the production build locally |

## License

MIT
