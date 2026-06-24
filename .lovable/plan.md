## Goal
Make Launchpad modules resizable from all 8 sides/corners and freely placeable anywhere on the grid (no auto-compaction, no collision push).

## Changes

### 1. `src/components/launchpad/Launchpad.tsx`
- Restore all 8 resize handles:
  ```ts
  const HANDLES: Array<'s'|'w'|'e'|'n'|'sw'|'nw'|'se'|'ne'> =
    ['s','w','e','n','sw','nw','se','ne'];
  ```
- Keep `compactType={null}` and `preventCollision={false}` — this is what allows tiles to be dropped anywhere on the grid (including overlapping briefly) without being auto-stacked to the top. (Already set; verified.)
- No other logic changes.

### 2. `src/index.css` — Launchpad resize handle styles
Replace the current single `.react-resizable-handle-sw` block with styles for all 8 handles:
- Edges (`n`, `s`, `e`, `w`): thin 6px hit strips along the corresponding edge, centered, with `cursor: ns-resize` / `ew-resize`. Subtle accent line on hover/while-resizing.
- Corners (`ne`, `nw`, `se`, `sw`): 18px square hit targets in each corner with the matching diagonal cursor (`nesw-resize` / `nwse-resize`) and an accent-colored L-shaped `::after` indicator using two borders (matching current sw styling, mirrored per corner).
- All handles only visible when the tile is hovered or being resized (consistent with current behavior); hidden when layout is locked (the grid already drops them via `isResizable={false}`).

## Result
- Drag any edge or corner to resize, snapping to the grid cells (react-grid-layout handles snap automatically based on `rowHeight` + `cols`).
- Drag the tile header anywhere on the grid; it stays exactly where dropped (free placement, overlap allowed) because compaction and collision-prevention are off.
- Lock toggle still disables both drag and resize.

No state-shape or persistence changes; existing saved workspaces continue to work.
