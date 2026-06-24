/**
 * Live GDELT geopolitical event density (server-aggregated to 5° cells).
 * Refreshed every 15 min — matches the edge cache.
 */
import { useEffect, useState } from 'react';
import { apiGet } from '@/lib/api';

export type GdeltCell = {
  lat: number; lng: number;
  count: number;
  avgTone: number;
  sample: string[];
};

const REFRESH_MS = 15 * 60_000;

export function useLiveGdelt() {
  const [cells, setCells] = useState<GdeltCell[]>([]);
  const [live, setLive] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;
    const load = async () => {
      try {
        const data = await apiGet<{ cells?: GdeltCell[]; fallback?: boolean; error?: string }>('/api/market/events/acled-events');
        if (cancelled) return;
        // GDELT rate-limits aggressively; treat any error or empty payload as
        // a soft "no data right now" instead of bubbling up — situation feed
        // has 4 other sources to fall back on.
        const next = (data?.cells ?? []) as GdeltCell[];
        setCells(next);
        setLive(next.length > 0);
        setError(data?.fallback ? String(data.error ?? 'gdelt unavailable') : null);
      } catch (e: any) {
        if (!cancelled) { setCells([]); setError(String(e?.message ?? e)); setLive(false); }
      }
    };
    load();
    const id = window.setInterval(load, REFRESH_MS);
    return () => { cancelled = true; clearInterval(id); };
  }, []);

  return { cells, live, error };
}
