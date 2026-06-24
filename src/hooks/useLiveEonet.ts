/**
 * NASA EONET open natural events — volcanoes, storms, drought, etc.
 * Refreshed every 30 min — matches the edge cache.
 */
import { useEffect, useState } from 'react';
import { apiGet } from '@/lib/api';

export type EonetEvent = {
  id: string;
  title: string;
  category: string;
  categoryTitle: string;
  date: string | null;
  source: string | null;
  lat: number;
  lng: number;
};

const REFRESH_MS = 30 * 60_000;

export function useLiveEonet() {
  const [events, setEvents] = useState<EonetEvent[]>([]);
  const [live, setLive] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;
    const load = async () => {
      try {
        const data = await apiGet<{ events?: EonetEvent[] }>('/api/market/events/nasa-eonet');
        if (cancelled) return;
        const next = (data?.events ?? []) as EonetEvent[];
        setEvents(next);
        setLive(next.length > 0);
        setError(null);
      } catch (e: any) {
        if (!cancelled) { setError(String(e?.message ?? e)); setLive(false); }
      }
    };
    load();
    const id = window.setInterval(load, REFRESH_MS);
    return () => { cancelled = true; clearInterval(id); };
  }, []);

  return { events, live, error };
}
