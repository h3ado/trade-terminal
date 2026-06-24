import { useCallback } from 'react';
import { useUserPreference } from './useUserPreference';

/**
 * A snapshot of every part of the globe state we want to persist & recall.
 * Kept loose (`any`) for layers/camera so we don't have to thread the exact
 * `LayerState` and three.js types through Supabase JSON.
 */
export interface SavedView {
  /** Stable ID. Numbered slots use 'slot-1'..'slot-9'; names use 'name-<slug>'. */
  id: string;
  /** Numbered slot (1-9) or undefined for named views. */
  slot?: number;
  /** Human label. For slots, defaults to 'SLOT N'. */
  name: string;
  /** ISO timestamp captured at SAVE time. */
  savedAt: string;
  payload: {
    layers?: any;
    theme?: string;
    macroMetric?: string;
    econHighOnly?: boolean;
    econCBOnly?: boolean;
    scrubOffsetMin?: number;
    camera?: { x: number; y: number; z: number; tx?: number; ty?: number; tz?: number };
  };
}

const PREF_KEY = 'globe.savedViews';

/**
 * Persists named + numbered (1-9) saved views in `user_preferences`.
 * View payloads are loose JSON so we can extend them without migrations.
 */
export function useSavedViews() {
  const [views, setViews, loaded] = useUserPreference<SavedView[]>(PREF_KEY, []);

  const upsert = useCallback((view: SavedView) => {
    setViews(prev => {
      const list = prev.filter(v => v.id !== view.id);
      list.push(view);
      // Sort: slots first by number, then named alphabetically.
      list.sort((a, b) => {
        if (a.slot != null && b.slot != null) return a.slot - b.slot;
        if (a.slot != null) return -1;
        if (b.slot != null) return 1;
        return a.name.localeCompare(b.name);
      });
      return list;
    });
  }, [setViews]);

  const remove = useCallback((id: string) => {
    setViews(prev => prev.filter(v => v.id !== id));
  }, [setViews]);

  const findByKey = useCallback((key: string): SavedView | undefined => {
    const trimmed = key.trim();
    if (!trimmed) return undefined;
    // Numeric slot
    const n = Number(trimmed);
    if (Number.isInteger(n) && n >= 1 && n <= 9) {
      return views.find(v => v.slot === n);
    }
    // Named: case-insensitive
    const upper = trimmed.toUpperCase();
    return views.find(v => v.name.toUpperCase() === upper);
  }, [views]);

  return { views, loaded, upsert, remove, findByKey } as const;
}

/** Build a SavedView from a key (`1`..`9` or a free name) and payload. */
export function buildSavedView(key: string, payload: SavedView['payload']): SavedView {
  const trimmed = key.trim();
  const n = Number(trimmed);
  if (Number.isInteger(n) && n >= 1 && n <= 9) {
    return {
      id: `slot-${n}`,
      slot: n,
      name: `SLOT ${n}`,
      savedAt: new Date().toISOString(),
      payload,
    };
  }
  const slug = trimmed.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-+|-+$/g, '');
  return {
    id: `name-${slug || Math.random().toString(36).slice(2, 8)}`,
    name: trimmed.toUpperCase().slice(0, 24),
    savedAt: new Date().toISOString(),
    payload,
  };
}
