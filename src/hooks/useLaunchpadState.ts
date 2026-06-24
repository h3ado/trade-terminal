// Launchpad state: free-grid workspaces, persisted to localStorage with v1→v2 migration.
import { useEffect, useState, useCallback } from 'react';

export interface GridItem {
  i: string;
  x: number;
  y: number;
  w: number;
  h: number;
}

export interface Tile {
  id: string;
  code: string;
}

export interface GridCfg {
  cols: number;
  rowHeight: number;
  margin: number;
}

export interface Workspace {
  id: string;
  name: string;
  tiles: Tile[];
  layout: GridItem[];
  gridCfg: GridCfg;
}

interface State {
  activeId: string;
  workspaces: Workspace[];
}

const KEY = 'lovable:launchpad:v2';
const LEGACY_KEY = 'lovable:launchpad:v1';
export const GRID_COLS = 12;
export const DEFAULT_CFG: GridCfg = { cols: 12, rowHeight: 32, margin: 4 };

function mkWs(id: string, name: string, items: Array<[string, number, number, number, number]>, cfg: GridCfg = DEFAULT_CFG): Workspace {
  return {
    id,
    name,
    tiles: items.map(([code], i) => ({ id: `${id}-t${i + 1}`, code })),
    layout: items.map(([, x, y, w, h], i) => ({ i: `${id}-t${i + 1}`, x, y, w, h })),
    gridCfg: { ...cfg },
  };
}

const DEFAULT_WORKSPACES: Workspace[] = [
  mkWs('default', 'Default', [
    ['WEI', 0, 0, 6, 8],
    ['GLCO', 6, 0, 6, 8],
    ['WB', 0, 8, 6, 8],
    ['TOP', 6, 8, 6, 8],
  ]),
  mkWs('premkt', 'Pre-Market', [
    ['SCAN', 0, 0, 6, 10],
    ['MOVR', 6, 0, 6, 6],
    ['INDX', 6, 6, 6, 4],
    ['TOP', 0, 10, 6, 6],
    ['HEAT', 6, 10, 6, 6],
  ]),
  mkWs('fomc', 'FOMC', [
    ['FED', 0, 0, 6, 8],
    ['WB', 6, 0, 6, 8],
    ['ECON', 0, 8, 6, 8],
    ['NEWS', 6, 8, 6, 8],
  ]),
  mkWs('euopen', 'EU Open', [
    ['FX', 0, 0, 6, 10],
    ['WEI', 6, 0, 6, 5],
    ['GLCO', 6, 5, 6, 5],
    ['ECON', 0, 10, 12, 6],
  ]),
  mkWs('crypto', 'Crypto', [
    ['CRYP', 0, 0, 6, 12],
    ['MOVR', 6, 0, 6, 6],
    ['HEAT', 6, 6, 6, 6],
    ['NEWS', 0, 12, 12, 6],
  ]),
  mkWs('fxdesk', 'FX Desk', [
    ['FXBD', 0, 0, 4, 12],
    ['FX', 4, 0, 8, 12],
    ['FED', 0, 12, 6, 6],
    ['ECON', 6, 12, 6, 6],
  ]),
  mkWs('earnday', 'Earnings Day', [
    ['EARN', 0, 0, 6, 10],
    ['OPT', 6, 0, 6, 10],
    ['MOVR', 0, 10, 6, 6],
    ['TOP', 6, 10, 6, 6],
  ]),
  mkWs('risk', 'Risk Review', [
    ['RISK', 0, 0, 6, 8],
    ['POS', 6, 0, 6, 8],
    ['DDWN', 0, 8, 6, 8],
    ['PERF', 6, 8, 6, 8],
  ]),
  mkWs('newswar', 'News War Room', [
    ['NEWS', 0, 0, 8, 10],
    ['GEO', 8, 0, 4, 5],
    ['WIRE', 8, 5, 4, 5],
    ['CBNK', 0, 10, 6, 6],
    ['GLOB', 6, 10, 6, 6],
  ]),
];

const DEFAULT_STATE: State = {
  activeId: 'default',
  workspaces: DEFAULT_WORKSPACES,
};

function migrateV1(): State | null {
  try {
    const raw = localStorage.getItem(LEGACY_KEY);
    if (!raw) return null;
    const parsed = JSON.parse(raw);
    if (!Array.isArray(parsed?.tiles)) return null;
    const tiles: Tile[] = parsed.tiles.map((t: any, i: number) => ({ id: `mig-${i + 1}`, code: t.code || 'DASH' }));
    const slotMap: Record<string, Array<[number, number, number, number]>> = {
      '1x1': [[0, 0, 12, 16]],
      '1x2': [[0, 0, 6, 16], [6, 0, 6, 16]],
      '2x1': [[0, 0, 12, 8], [0, 8, 12, 8]],
      '2x2': [[0, 0, 6, 8], [6, 0, 6, 8], [0, 8, 6, 8], [6, 8, 6, 8]],
    };
    const slots = slotMap[parsed.layout] || slotMap['2x2'];
    const layout: GridItem[] = tiles.map((t, i) => {
      const s = slots[i] || [0, 0, 6, 8];
      return { i: t.id, x: s[0], y: s[1], w: s[2], h: s[3] };
    });
    return {
      activeId: 'migrated',
      workspaces: [{ id: 'migrated', name: 'Migrated', tiles, layout, gridCfg: { ...DEFAULT_CFG } }, ...DEFAULT_WORKSPACES.slice(1)],
    };
  } catch {
    return null;
  }
}

function normalize(ws: Workspace): Workspace {
  return { ...ws, gridCfg: ws.gridCfg ?? { ...DEFAULT_CFG } };
}

function load(): State {
  try {
    const raw = localStorage.getItem(KEY);
    if (raw) {
      const parsed = JSON.parse(raw) as State;
      if (parsed.activeId && Array.isArray(parsed.workspaces) && parsed.workspaces.length > 0) {
        // Merge in any newer default presets the user doesn't have yet
        const existingIds = new Set(parsed.workspaces.map(w => w.id));
        const additions = DEFAULT_WORKSPACES.filter(d => !existingIds.has(d.id));
        return {
          activeId: parsed.activeId,
          workspaces: [...parsed.workspaces.map(normalize), ...additions],
        };
      }
    }
  } catch {}
  const migrated = migrateV1();
  return migrated || DEFAULT_STATE;
}

let uid = 0;
const genId = () => `t-${Date.now().toString(36)}-${(++uid).toString(36)}`;

export function useLaunchpadState() {
  const [state, setState] = useState<State>(load);

  useEffect(() => {
    try { localStorage.setItem(KEY, JSON.stringify(state)); } catch {}
  }, [state]);

  const active = state.workspaces.find(w => w.id === state.activeId) || state.workspaces[0];

  const updateActive = useCallback((fn: (w: Workspace) => Workspace) => {
    setState(s => ({
      ...s,
      workspaces: s.workspaces.map(w => w.id === s.activeId ? fn(w) : w),
    }));
  }, []);

  const setLayout = useCallback((layout: GridItem[]) => {
    updateActive(w => ({ ...w, layout }));
  }, [updateActive]);

  const setGridCfg = useCallback((cfg: GridCfg) => {
    updateActive(w => {
      if (cfg.cols === w.gridCfg.cols) return { ...w, gridCfg: cfg };
      // Rescale x/w proportionally on column change.
      const scale = cfg.cols / w.gridCfg.cols;
      const layout = w.layout.map(l => {
        const nx = Math.round(l.x * scale);
        const nw = Math.max(2, Math.round(l.w * scale));
        return { ...l, x: Math.min(cfg.cols - 2, nx), w: Math.min(cfg.cols, nw) };
      });
      return { ...w, gridCfg: cfg, layout };
    });
  }, [updateActive]);

  const setTileCode = useCallback((id: string, code: string) => {
    updateActive(w => ({ ...w, tiles: w.tiles.map(t => t.id === id ? { ...t, code } : t) }));
  }, [updateActive]);

  const addTile = useCallback((code: string) => {
    updateActive(w => {
      const id = genId();
      const maxY = w.layout.reduce((m, it) => Math.max(m, it.y + it.h), 0);
      return {
        ...w,
        tiles: [...w.tiles, { id, code }],
        layout: [...w.layout, { i: id, x: 0, y: maxY, w: Math.min(6, w.gridCfg.cols), h: 8 }],
      };
    });
  }, [updateActive]);

  const removeTile = useCallback((id: string) => {
    updateActive(w => ({
      ...w,
      tiles: w.tiles.filter(t => t.id !== id),
      layout: w.layout.filter(l => l.i !== id),
    }));
  }, [updateActive]);

  const resetActive = useCallback(() => {
    const def = DEFAULT_WORKSPACES.find(w => w.id === active.id) || DEFAULT_WORKSPACES[0];
    setState(s => ({
      ...s,
      workspaces: s.workspaces.map(w => w.id === s.activeId
        ? { ...def, id: w.id, name: w.name }
        : w),
    }));
  }, [active.id]);

  const switchWorkspace = useCallback((id: string) => {
    setState(s => ({ ...s, activeId: id }));
  }, []);

  const saveAs = useCallback((name: string) => {
    setState(s => {
      const cur = s.workspaces.find(w => w.id === s.activeId)!;
      const id = `ws-${Date.now().toString(36)}`;
      const dup: Workspace = { id, name, tiles: cur.tiles.map(t => ({ ...t })), layout: cur.layout.map(l => ({ ...l })), gridCfg: { ...cur.gridCfg } };
      return { activeId: id, workspaces: [...s.workspaces, dup] };
    });
  }, []);

  const renameActive = useCallback((name: string) => {
    updateActive(w => ({ ...w, name }));
  }, [updateActive]);

  const deleteActive = useCallback(() => {
    setState(s => {
      if (s.workspaces.length <= 1) return s;
      const remaining = s.workspaces.filter(w => w.id !== s.activeId);
      return { activeId: remaining[0].id, workspaces: remaining };
    });
  }, []);

  const duplicateActive = useCallback(() => {
    setState(s => {
      const cur = s.workspaces.find(w => w.id === s.activeId)!;
      const id = `ws-${Date.now().toString(36)}`;
      const dup: Workspace = { id, name: `${cur.name} (copy)`, tiles: cur.tiles.map(t => ({ ...t })), layout: cur.layout.map(l => ({ ...l })), gridCfg: { ...cur.gridCfg } };
      return { activeId: id, workspaces: [...s.workspaces, dup] };
    });
  }, []);

  return {
    state,
    active,
    setLayout,
    setGridCfg,
    setTileCode,
    addTile,
    removeTile,
    resetActive,
    switchWorkspace,
    saveAs,
    renameActive,
    deleteActive,
    duplicateActive,
  };
}
