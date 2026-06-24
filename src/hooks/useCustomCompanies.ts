/**
 * Loads the current user's custom company pins and exposes CRUD + an
 * override resolver that merges live custom data on top of seed COMPANIES.
 *
 * Override semantics:
 *   - row.override_id is set + is_deletion=true  → seed pin is hidden
 *   - row.override_id is set + is_deletion=false → seed pin is replaced by row
 *   - row.override_id is null                    → row is a brand-new pin
 */
import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { apiGet, apiPost, apiPatch, apiDelete } from '@/lib/api';
import { useAuth } from '@/contexts/AuthContext';
import { COMPANIES, type CompanyHQ, type Sector } from '@/components/globe/map2d/companies';

export type CustomCompanyRow = {
  id: string;
  user_id: string;
  name: string;
  ticker: string | null;
  sector: string | null;
  lat: number;
  lng: number;
  market_cap: number | null;
  hq: string | null;
  notes: string | null;
  override_id: string | null;
  is_deletion: boolean;
  created_at: string;
  updated_at: string;
};

export type CustomCompanyInput = {
  name: string;
  ticker?: string | null;
  sector?: Sector | null;
  lat: number;
  lng: number;
  market_cap?: number | null;
  hq?: string | null;
  notes?: string | null;
  override_id?: string | null;
};

export type ResolvedCompany = CompanyHQ & {
  __custom?: { id: string; overrideId: string | null };
};

export function useCustomCompanies() {
  const { user } = useAuth();
  const [rows, setRows] = useState<CustomCompanyRow[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const refresh = useCallback(async () => {
    if (!user) { setRows([]); return; }
    setLoading(true);
    try {
      const data = await apiGet('/api/custom-companies') as CustomCompanyRow[];
      setError(null);
      setRows(data ?? []);
    } catch (e: any) {
      setError(e?.message ?? 'Failed to load');
    }
    setLoading(false);
  }, [user]);

  useEffect(() => { refresh(); }, [refresh]);

  // Poll every 30s when user is logged in (replaces realtime subscription).
  const intervalRef = useRef<ReturnType<typeof setInterval> | null>(null);
  useEffect(() => {
    if (!user) {
      if (intervalRef.current) { clearInterval(intervalRef.current); intervalRef.current = null; }
      return;
    }
    intervalRef.current = setInterval(() => { refresh(); }, 30000);
    return () => {
      if (intervalRef.current) { clearInterval(intervalRef.current); intervalRef.current = null; }
    };
  }, [user, refresh]);

  const create = useCallback(async (input: CustomCompanyInput) => {
    if (!user) throw new Error('Not signed in');
    await apiPost('/api/custom-companies', { ...input, is_deletion: false });
  }, [user]);

  const update = useCallback(async (id: string, patch: Partial<CustomCompanyInput>) => {
    await apiPatch('/api/custom-companies/' + id, patch);
  }, []);

  const remove = useCallback(async (id: string) => {
    await apiDelete('/api/custom-companies/' + id);
  }, []);

  // Hide a seed pin by inserting a tombstone row keyed to override_id.
  const hideSeed = useCallback(async (seedId: string) => {
    if (!user) throw new Error('Not signed in');
    const seed = COMPANIES.find(c => c.id === seedId);
    if (!seed) return;
    await apiPost('/api/custom-companies', {
      name: seed.name,
      ticker: seed.ticker,
      sector: seed.sector,
      lat: seed.lat,
      lng: seed.lng,
      market_cap: seed.mcapB,
      hq: seed.country,
      override_id: seedId,
      is_deletion: true,
    });
  }, [user]);

  // Restore a seed pin by deleting all override rows for that seed id.
  const resetSeed = useCallback(async (seedId: string) => {
    const overrides = rows.filter(r => r.override_id === seedId);
    await Promise.all(overrides.map(r => apiDelete('/api/custom-companies/' + r.id)));
  }, [rows]);

  // Merge: drop seed pins that are deleted/replaced, then append custom rows.
  const resolved = useMemo<ResolvedCompany[]>(() => {
    const overrideMap = new Map<string, CustomCompanyRow>();
    const deletions = new Set<string>();
    for (const r of rows) {
      if (!r.override_id) continue;
      if (r.is_deletion) deletions.add(r.override_id);
      else overrideMap.set(r.override_id, r);
    }
    const validSectors = new Set<Sector>(['tech','finance','energy','health','consumer','industrial','comm','auto','retail']);
    const toResolved = (r: CustomCompanyRow): ResolvedCompany => ({
      id: `custom:${r.id}`,
      name: r.name,
      ticker: r.ticker ?? '',
      sector: (validSectors.has((r.sector ?? '') as Sector) ? r.sector : 'tech') as Sector,
      mcapB: Number(r.market_cap ?? 0),
      lat: Number(r.lat),
      lng: Number(r.lng),
      country: r.hq ?? '',
      __custom: { id: r.id, overrideId: r.override_id },
    });
    const out: ResolvedCompany[] = [];
    for (const seed of COMPANIES) {
      if (deletions.has(seed.id)) continue;
      const ov = overrideMap.get(seed.id);
      if (ov) out.push(toResolved(ov));
      else out.push(seed as ResolvedCompany);
    }
    for (const r of rows) {
      if (r.override_id || r.is_deletion) continue;
      out.push(toResolved(r));
    }
    return out;
  }, [rows]);

  return { rows, resolved, loading, error, refresh, create, update, remove, hideSeed, resetSeed };
}
