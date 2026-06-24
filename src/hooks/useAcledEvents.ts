/**
 * Direct ACLED conflict events feed for the 2D map. Server-cached 30 min;
 * we re-poll every 5 min so heat clusters animate in roughly real time.
 */
import { useEffect, useState } from 'react';
import { apiGet } from '@/lib/api';

export type AcledEvent = {
  id: string;
  subType: string;
  severity: 1 | 2 | 3 | 4 | 5;
  title: string;
  location: string;
  country: string;
  lat: number;
  lng: number;
  ts: number;
  fatalities: number;
  url?: string;
};

const REFRESH_MS = 5 * 60_000;

export function useAcledEvents(enabled: boolean) {
  const [events, setEvents] = useState<AcledEvent[]>([]);
  const [live, setLive] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!enabled) return;
    let cancelled = false;
    const load = async () => {
      try {
        const data = await apiGet<{ events?: AcledEvent[] }>('/api/market/events/acled-events');
        if (cancelled) return;
        const next = (data?.events ?? []) as AcledEvent[];
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
  }, [enabled]);

  return { events, live, error };
}
