/**
 * OpenSanctions / OFAC SDN — per-country counts for choropleth coloring.
 * Refreshed every 12h — matches the edge cache.
 */
import { useEffect, useMemo, useState } from 'react';
import { apiGet } from '@/lib/api';

export type SanctionsCountry = {
  iso: string;       // ISO-A2 country code (uppercased)
  count: number;
  entities: string[]; // sample of up to 5 entity names
};

const REFRESH_MS = 12 * 60 * 60_000;

export function useLiveSanctions() {
  const [countries, setCountries] = useState<SanctionsCountry[]>([]);
  const [live, setLive] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;
    const load = async () => {
      try {
        const data = await apiGet<{ countries?: SanctionsCountry[] }>('/api/market/events/ofac-sanctions');
        if (cancelled) return;
        const next = (data?.countries ?? []) as SanctionsCountry[];
        setCountries(next);
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

  const byIso = useMemo(() => {
    const m = new Map<string, SanctionsCountry>();
    for (const c of countries) m.set(c.iso, c);
    return m;
  }, [countries]);

  return { countries, byIso, live, error };
}
