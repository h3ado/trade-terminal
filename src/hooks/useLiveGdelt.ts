/**
 * Live GDELT geopolitical event density (server-aggregated to 5° cells).
 * Refreshed every 15 min — matches the edge cache.
 */
import { usePolledApi } from './usePolledApi';

export type GdeltCell = {
  lat: number; lng: number;
  count: number;
  avgTone: number;
  sample: string[];
};

const REFRESH_MS = 15 * 60_000;
const EMPTY_CELLS: GdeltCell[] = [];
const selectGdelt = (data: { cells?: GdeltCell[]; fallback?: boolean; error?: string }) => data.cells ?? EMPTY_CELLS;
const gdeltError = (_value: GdeltCell[], data: { fallback?: boolean; error?: string }) =>
  data.fallback ? String(data.error ?? 'gdelt unavailable') : null;

export function useLiveGdelt() {
  const { value: cells, live, error } = usePolledApi({
    path: '/api/market/events/gdelt-events',
    intervalMs: REFRESH_MS,
    initial: EMPTY_CELLS,
    clearOnError: true,
    select: selectGdelt,
    getError: gdeltError,
  });
  return { cells, live, error };
}
