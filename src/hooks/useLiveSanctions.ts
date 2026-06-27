/**
 * OpenSanctions / OFAC SDN — per-country counts for choropleth coloring.
 * Refreshed every 12h — matches the edge cache.
 */
import { useMemo } from 'react';
import { usePolledApi } from './usePolledApi';

export type SanctionsCountry = {
  iso: string;       // ISO-A2 country code (uppercased)
  count: number;
  entities: string[]; // sample of up to 5 entity names
};

const REFRESH_MS = 12 * 60 * 60_000;
const EMPTY_COUNTRIES: SanctionsCountry[] = [];
const selectCountries = (data: { countries?: SanctionsCountry[] }) => data.countries ?? EMPTY_COUNTRIES;

export function useLiveSanctions() {
  const { value: countries, live, error } = usePolledApi({
    path: '/api/market/events/ofac-sanctions',
    intervalMs: REFRESH_MS,
    initial: EMPTY_COUNTRIES,
    select: selectCountries,
  });

  const byIso = useMemo(() => {
    const m = new Map<string, SanctionsCountry>();
    for (const c of countries) m.set(c.iso, c);
    return m;
  }, [countries]);

  return { countries, byIso, live, error };
}
