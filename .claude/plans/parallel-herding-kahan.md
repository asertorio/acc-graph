# Plan: Fix Missing Nodes and Node Click Side Panel

## Context

Two bugs in the ACC Graph app:
1. **Missing nodes**: Only ~40 issues appear in the graph despite `issues_issues.csv` containing 242 records. The `resolveAllEntities()` function only creates entities that appear in `relationships_entity_relationship.csv`, completely discarding records with no relationships.
2. **Node click panel broken**: Clicking a node does not open the DetailPanel side panel to show record information.

---

## Bug 1: Missing Nodes (entities without relationships are excluded)

### Root Cause
`src/data/parsers/entityResolver.ts:80-99` — `resolveAllEntities()` iterates **only** through relationships to build the entity map. Any CSV record not referenced by at least one relationship is never added.

### Fix

**File: `src/data/parsers/entityResolver.ts`**

Add a new function `addUnrelatedEntities()` that iterates through all EntityIndex entries and creates EntityRecords for rows not already in the entities map. This requires knowing the domain+entityType for each CSV file, which is available from the domain mappings.

```
function addUnrelatedEntities(
  entities: Map<string, EntityRecord>,
  entityIndices: Map<string, EntityIndex>,
  mappings: Array<{ domain: string; entityType: string; mapping: DomainMapping }>
)
```

For each mapping with a csvFile:
1. Get the EntityIndex for that csvFile
2. For each row in the index, construct the composite ID (`domain:entityType:primaryKey`)
3. If the entity is NOT already in the map, create a full EntityRecord (non-opaque) and add it

**File: `src/data/sources/CsvDataSource.ts` (line 94)**

After calling `resolveAllEntities()`, call `addUnrelatedEntities()` passing the entity map, entity indices, and mappings.

**File: `src/data/sources/DevDataSource.ts` (line 81)**

Same change — call `addUnrelatedEntities()` after `resolveAllEntities()`.

### Existing filter support
`graphBuilder.ts:52` already has `showRelatedOnly` filter (defaults to `false` in `filterStore.ts:27`), so unconnected nodes will display by default and can be toggled off via the existing filter UI.

---

## Bug 2: Node Click Not Opening Side Panel

### Root Cause
In `src/graph/GraphCanvas.tsx:57-84`, event handlers are registered inside the `handleCyRef` callback passed as the `cy` prop to `CytoscapeComponent`. The `react-cytoscapejs` library may invoke this callback on multiple renders, causing event handlers to stack. Additionally, the callback closure captures `setSelectedNodeId` at registration time — if the library calls the callback with the same Cytoscape instance across renders, duplicate handlers accumulate.

### Fix

**File: `src/graph/GraphCanvas.tsx`**

1. In `handleCyRef`, add `cy.off('tap')` and `cy.off('mouseover', 'node')` / `cy.off('mouseout', 'node')` **before** registering new handlers to prevent stacking:

```typescript
const handleCyRef = useCallback((cy: cytoscape.Core) => {
  cyRef.current = cy;

  // Clean up any existing handlers to prevent stacking
  cy.off('tap');
  cy.off('mouseover', 'node');
  cy.off('mouseout', 'node');

  cy.on('tap', 'node', (evt) => {
    const nodeId = evt.target.id();
    setSelectedNodeId(nodeId);
  });

  cy.on('tap', (evt) => {
    if (evt.target === cy) {
      setSelectedNodeId(null);
    }
  });

  cy.on('mouseover', 'node', (evt) => {
    evt.target.addClass('hover');
    highlightNeighbors(cy, evt.target.id());
  });

  cy.on('mouseout', 'node', (evt) => {
    evt.target.removeClass('hover');
    clearHighlights(cy);
  });
}, [setSelectedNodeId]);
```

2. Remove the `setSelectedNodeId` dependency from useCallback (since Zustand selectors are stable refs) — or keep it for safety. Either way, the `cy.off()` calls prevent stacking regardless of how many times the callback runs.

---

## Files to Modify

| File | Change |
|------|--------|
| `src/data/parsers/entityResolver.ts` | Add `addUnrelatedEntities()` function |
| `src/data/sources/CsvDataSource.ts` | Call `addUnrelatedEntities()` after `resolveAllEntities()` |
| `src/data/sources/DevDataSource.ts` | Call `addUnrelatedEntities()` after `resolveAllEntities()` |
| `src/graph/GraphCanvas.tsx` | Add `cy.off()` cleanup before `cy.on()` in `handleCyRef` |

---

## Verification

1. Run `npm run dev` (or equivalent) and load the data
2. Confirm the header node count shows significantly more than 40 (should be ~242 for issues alone, plus other entity types)
3. Confirm that nodes without relationships appear as disconnected nodes in the graph
4. Click on a node — the DetailPanel should slide in from the right showing entity type badge, display name, all fields, and related items
5. Click on a disconnected (no-relationship) node — panel should show fields with "Related Items" section empty
6. Click on graph background — panel should close
7. Toggle "Show Related Only" filter — disconnected nodes should hide/show appropriately
