// Launchpad: free-grid workspace using react-grid-layout, with saved workspaces,
// adjustable cell size, alignment guides, snap overlay, module picker and lock.
import 'react-grid-layout/css/styles.css';
import 'react-resizable/css/styles.css';
import { useState, useRef, useLayoutEffect } from 'react';
import { Responsive, WidthProvider, Layout } from 'react-grid-layout/legacy';
import { Plus, RotateCcw, Lock, Unlock } from 'lucide-react';
import { useLaunchpadState, GridItem } from '@/hooks/useLaunchpadState';
import LaunchTile from './LaunchTile';
import ModulePicker from './ModulePicker';
import WorkspaceMenu from './WorkspaceMenu';
import GridSettingsPopover from './GridSettingsPopover';
import AlignmentGuides from './AlignmentGuides';

const ResponsiveGrid = WidthProvider(Responsive);
const HANDLES: Array<'s'|'w'|'e'|'n'|'sw'|'nw'|'se'|'ne'> = ['s','w','e','n','sw','nw','se','ne'];

export default function Launchpad() {
  const {
    state, active,
    setLayout, setGridCfg, setTileCode, addTile, removeTile, resetActive,
    switchWorkspace, saveAs, renameActive, deleteActive, duplicateActive,
  } = useLaunchpadState();

  const [maxedId, setMaxedId] = useState<string | null>(null);
  const [addOpen, setAddOpen] = useState(false);
  const [locked, setLocked] = useState(false);
  const [activeDrag, setActiveDrag] = useState<GridItem | null>(null);
  const [containerW, setContainerW] = useState(0);
  const gridWrapRef = useRef<HTMLDivElement>(null);

  useLayoutEffect(() => {
    const el = gridWrapRef.current;
    if (!el) return;
    const ro = new ResizeObserver(entries => {
      setContainerW(entries[0].contentRect.width);
    });
    ro.observe(el);
    return () => ro.disconnect();
  }, []);

  const { cols, rowHeight, margin } = active.gridCfg;
  const showSnap = !!activeDrag && !locked;

  // Background grid pattern (only while dragging/resizing)
  const cellW = containerW > 0 ? (containerW - margin * (cols + 1)) / cols : 0;
  const gridBg = showSnap && cellW > 0
    ? {
        backgroundImage:
          `linear-gradient(to right, hsl(var(--accent) / 0.18) 1px, transparent 1px),` +
          `linear-gradient(to bottom, hsl(var(--accent) / 0.18) 1px, transparent 1px)`,
        backgroundSize: `${cellW + margin}px ${rowHeight + margin}px`,
        backgroundPosition: `${margin}px ${margin}px`,
      }
    : undefined;

  return (
    <div className="flex flex-col h-full bg-background">
      <div className="flex items-center gap-2 px-2 py-1 bg-surface-deep border-b border-accent">
        <span className="text-[10px] font-mono font-bold text-accent uppercase tracking-wider">LAUN</span>
        <span className="text-[10px] font-mono text-muted-foreground uppercase tracking-wider">Launchpad Workspace</span>
        <span className="text-[9px] font-mono text-muted-foreground ml-2">{active.tiles.length} TILES · {cols}c · {rowHeight}px</span>
        <div className="ml-auto flex items-center gap-1">
          <div className="relative">
            <button
              onClick={() => setAddOpen(o => !o)}
              className="flex items-center gap-1 px-2 h-5 text-[10px] font-mono font-bold text-accent-foreground uppercase bg-accent hover:bg-accent/80 transition-colors"
              title="Add module"
            >
              <Plus className="w-3 h-3" /> ADD
            </button>
            {addOpen && (
              <ModulePicker
                onPick={code => { addTile(code); }}
                onClose={() => setAddOpen(false)}
              />
            )}
          </div>
          <GridSettingsPopover cfg={active.gridCfg} onChange={setGridCfg} />
          <button
            onClick={() => setLocked(l => !l)}
            className={`flex items-center gap-1 px-2 h-5 text-[10px] font-mono font-bold uppercase border border-border transition-colors ${
              locked ? 'bg-accent/20 text-accent' : 'bg-surface-elevated text-muted-foreground hover:text-foreground'
            }`}
            title={locked ? 'Unlock layout' : 'Lock layout'}
          >
            {locked ? <Lock className="w-3 h-3" /> : <Unlock className="w-3 h-3" />}
            {locked ? 'LOCKED' : 'EDIT'}
          </button>
          <button
            onClick={() => { if (confirm('Reset this workspace to defaults?')) resetActive(); }}
            className="flex items-center gap-1 px-2 h-5 text-[10px] font-mono font-bold text-muted-foreground uppercase bg-surface-elevated border border-border hover:text-foreground transition-colors"
            title="Reset workspace"
          >
            <RotateCcw className="w-3 h-3" /> RESET
          </button>
          <WorkspaceMenu
            workspaces={state.workspaces}
            activeId={state.activeId}
            onSwitch={switchWorkspace}
            onSaveAs={saveAs}
            onRename={renameActive}
            onDelete={deleteActive}
            onDuplicate={duplicateActive}
          />
        </div>
      </div>

      <div className="flex-1 p-1 min-h-0 overflow-auto relative">
        {active.tiles.length === 0 && (
          <div className="absolute inset-0 flex items-center justify-center">
            <button
              onClick={() => setAddOpen(true)}
              className="flex items-center gap-2 px-4 py-2 text-[11px] font-mono font-bold text-accent-foreground uppercase bg-accent hover:bg-accent/80 transition-colors"
            >
              <Plus className="w-4 h-4" /> ADD MODULE
            </button>
          </div>
        )}

        {maxedId && (() => {
          const t = active.tiles.find(x => x.id === maxedId);
          if (!t) return null;
          return (
            <div className="absolute inset-1 z-40 bg-background border border-accent">
              <LaunchTile
                code={t.code}
                onChangeCode={c => setTileCode(t.id, c)}
                onMaximize={() => setMaxedId(null)}
                isMaximized
                onRemove={() => { removeTile(t.id); setMaxedId(null); }}
              />
            </div>
          );
        })()}

        <div ref={gridWrapRef} className="relative" style={gridBg}>
          <ResponsiveGrid
            className="layout"
            layouts={{ lg: active.layout as unknown as Layout }}
            breakpoints={{ lg: 0 }}
            cols={{ lg: cols }}
            rowHeight={rowHeight}
            margin={[margin, margin]}
            containerPadding={[0, 0]}
            isDraggable={!locked}
            isResizable={!locked}
            draggableHandle=".tile-drag"
            resizeHandles={HANDLES}
            compactType={null}
            preventCollision={false}
            onDragStart={(_l, _o, n) => setActiveDrag({ i: n.i, x: n.x, y: n.y, w: n.w, h: n.h })}
            onDrag={(_l, _o, n) => setActiveDrag({ i: n.i, x: n.x, y: n.y, w: n.w, h: n.h })}
            onDragStop={() => setActiveDrag(null)}
            onResizeStart={(_l, _o, n) => setActiveDrag({ i: n.i, x: n.x, y: n.y, w: n.w, h: n.h })}
            onResize={(_l, _o, n) => setActiveDrag({ i: n.i, x: n.x, y: n.y, w: n.w, h: n.h })}
            onResizeStop={() => setActiveDrag(null)}
            onLayoutChange={(layout) => {
              setLayout(layout.map(l => ({ i: l.i, x: l.x, y: l.y, w: l.w, h: l.h })));
            }}
          >
            {active.tiles.map(t => (
              <div key={t.id} className="launch-tile-wrap">
                <LaunchTile
                  code={t.code}
                  onChangeCode={c => setTileCode(t.id, c)}
                  onMaximize={() => setMaxedId(t.id)}
                  onRemove={() => removeTile(t.id)}
                />
              </div>
            ))}
          </ResponsiveGrid>

          <AlignmentGuides
            active={activeDrag}
            items={active.layout}
            cols={cols}
            rowHeight={rowHeight}
            margin={margin}
            containerWidth={containerW}
          />
        </div>
      </div>
    </div>
  );
}
