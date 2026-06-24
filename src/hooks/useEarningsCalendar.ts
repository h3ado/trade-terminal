import { useEffect, useState } from 'react';
import { apiGet } from '@/lib/api';

export interface EarnEvent {
  id: string;
  ts: string;
  ticker: string;
  label: string;
  importance: 1 | 2 | 3;
  when?: 'BMO' | 'AMC' | 'TNS' | null;
  eps_est?: number | null;
  eps_prior?: number | null;
  source_url?: string;
}

export interface EarnFilter {
  window?: 'today' | 'tom' | 'week' | 'month';
  session?: 'BMO' | 'AMC';
  minImportance?: 1 | 2 | 3;
  ticker?: string;
}

const CACHE_KEY = 'lovable:earn-cal-cache';
const TTL = 15 * 60 * 1000;

function windowEnd(w: EarnFilter['window']): number {
  const now = Date.now();
  if (w === 'today') return now + 86400000;
  if (w === 'tom') return now + 2 * 86400000;
  if (w === 'month') return now + 30 * 86400000;
  return now + 7 * 86400000; // default week
}

export function useEarningsCalendar(filter: EarnFilter = {}) {
  const [events, setEvents] = useState<EarnEvent[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;
    async function load() {
      setLoading(true);
      try {
        let raw: EarnEvent[] = [];
        const cached = typeof window !== 'undefined' ? localStorage.getItem(CACHE_KEY) : null;
        if (cached) {
          const parsed = JSON.parse(cached);
          if (Date.now() - parsed.fetchedAt < TTL) raw = parsed.events;
        }
        if (raw.length === 0) {
          const data = await apiGet<{ events?: EarnEvent[] }>('/api/market/calendar/earnings');
          raw = (data?.events ?? []) as EarnEvent[];
          try { localStorage.setItem(CACHE_KEY, JSON.stringify({ events: raw, fetchedAt: Date.now() })); } catch {}
        }
        if (cancelled) return;
        setEvents(raw);
      } catch (e) {
        if (!cancelled) setError(String(e));
      } finally {
        if (!cancelled) setLoading(false);
      }
    }
    load();
    return () => { cancelled = true; };
  }, []);

  const end = windowEnd(filter.window);
  const filtered = events.filter((ev) => {
    const t = new Date(ev.ts).getTime();
    if (Number.isNaN(t)) return false;
    if (t > end) return false;
    if (filter.window === 'today' && t < Date.now() - 6 * 3600000) return false;
    if (filter.session && ev.when !== filter.session) return false;
    if (filter.minImportance && ev.importance < filter.minImportance) return false;
    if (filter.ticker && ev.ticker.toUpperCase() !== filter.ticker.toUpperCase()) return false;
    return true;
  }).sort((a, b) => new Date(a.ts).getTime() - new Date(b.ts).getTime());

  return { events: filtered, allEvents: events, loading, error };
}
