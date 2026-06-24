import { useEffect, useRef, useState, useMemo } from 'react';
import { apiGet } from '@/lib/api';

export type EconKind = 'econ' | 'earnings' | 'cb' | 'geo';

export type EconEvent = {
  id: string;
  source: string;
  kind: EconKind;
  ts: string;            // ISO
  country?: string;
  ticker?: string;
  label: string;
  importance: 1 | 2 | 3;
  prior?: number | null;
  forecast?: number | null;
  actual?: number | null;
  unit?: string | null;
  source_url?: string;
  // earnings-specific
  eps_est?: number | null;
  eps_prior?: number | null;
  when?: 'BMO' | 'AMC' | 'TNS' | null;
  // cb-specific
  current_rate?: number | null;
  est_change_bps?: number | null;
  surprise_pct?: number | null;
};

export interface EconCalendarFilters {
  kinds?: EconKind[];
  countries?: string[];
  tickers?: string[];
  minImportance?: 1 | 2 | 3;
}

export function useEconCalendar(intervalMs = 10 * 60_000) {
  const [events, setEvents] = useState<EconEvent[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [fetchedAt, setFetchedAt] = useState(0);
  const reqId = useRef(0);

  const fetchNow = async () => {
    const id = ++reqId.current;
    setLoading(true);
    setError(null);
    try {
      const safe = <T,>(p: Promise<T>) => p.catch(() => ({ events: [] } as { events: EconEvent[] }));
      const [econ, earn, cb] = await Promise.all([
        safe(apiGet<{ events?: EconEvent[] }>('/api/market/calendar/econ')),
        safe(apiGet<{ events?: EconEvent[] }>('/api/market/calendar/earnings')),
        safe(apiGet<{ events?: EconEvent[] }>('/api/market/calendar/cb')),
      ]);
      if (id !== reqId.current) return;
      const merged: EconEvent[] = [
        ...((econ as { events?: EconEvent[] }).events ?? []),
        ...((earn as { events?: EconEvent[] }).events ?? []),
        ...((cb as { events?: EconEvent[] }).events ?? []),
      ];
      // Dedup by id, sort by ts asc
      const seen = new Set<string>();
      const dedup = merged.filter((e) => seen.has(e.id) ? false : (seen.add(e.id), true));
      dedup.sort((a, b) => a.ts.localeCompare(b.ts));
      setEvents(dedup);
      setFetchedAt(Date.now());
    } catch (e) {
      if (id !== reqId.current) return;
      setError(e instanceof Error ? e.message : 'Calendar fetch failed');
    } finally {
      if (id === reqId.current) setLoading(false);
    }
  };

  useEffect(() => {
    fetchNow();
    const t = setInterval(fetchNow, intervalMs);
    return () => clearInterval(t);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [intervalMs]);

  return { events, loading, error, fetchedAt, refetch: fetchNow };
}

export function applyFilters(events: EconEvent[], f: EconCalendarFilters): EconEvent[] {
  return events.filter((e) => {
    if (f.kinds && f.kinds.length && !f.kinds.includes(e.kind)) return false;
    if (f.minImportance && e.importance < f.minImportance) return false;
    if (f.countries && f.countries.length && !(e.country && f.countries.includes(e.country))) return false;
    if (f.tickers && f.tickers.length && !(e.ticker && f.tickers.includes(e.ticker.toUpperCase()))) return false;
    return true;
  });
}

export function useNextEvents(events: EconEvent[], n = 3) {
  return useMemo(() => {
    const now = Date.now();
    return events.filter((e) => new Date(e.ts).getTime() >= now - 60_000).slice(0, n);
  }, [events, n]);
}
