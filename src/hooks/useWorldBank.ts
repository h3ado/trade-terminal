import { useEffect, useState } from 'react';
import { apiGet } from '@/lib/api';

export type WBDatum = {
  iso3: string;
  iso2: string;
  country: string;
  year: number | null;
  value: number | null;
};

export type WBIndicator = {
  key: string;
  code: string;
  label: string;
  unit: string;
  byIso3: Record<string, WBDatum>;
};

type State = {
  byKey: Record<string, WBIndicator>;
  loading: boolean;
  error: string | null;
  ts: number | null;
};

let memo: { ts: number; byKey: Record<string, WBIndicator> } | null = null;
const TTL = 60 * 60_000; // 1h client-side; server caches 24h

/**
 * Live World Bank country indicators (GDP, inflation, debt, etc.).
 * Returns indicators keyed by stable keys defined in the
 * `worldbank-indicators` edge function. Use `byKey[k].byIso3[iso3]` to
 * look up a country's latest observation.
 */
export function useWorldBank(): State {
  const [state, setState] = useState<State>({
    byKey: memo?.byKey ?? {},
    loading: !memo,
    error: null,
    ts: memo?.ts ?? null,
  });

  useEffect(() => {
    let cancelled = false;
    const load = async () => {
      if (memo && Date.now() - memo.ts < TTL) {
        setState({ byKey: memo.byKey, loading: false, error: null, ts: memo.ts });
        return;
      }
      try {
        const data = await apiGet<{ indicators?: WBIndicator[] }>('/api/market/macro/worldbank-indicators');
        const list = (data?.indicators ?? []) as WBIndicator[];
        const byKey: Record<string, WBIndicator> = {};
        for (const i of list) byKey[i.key] = i;
        memo = { ts: Date.now(), byKey };
        if (!cancelled) setState({ byKey, loading: false, error: null, ts: memo.ts });
      } catch (e: any) {
        if (!cancelled) setState((s) => ({ ...s, loading: false, error: String(e?.message ?? e) }));
      }
    };
    load();
    const id = window.setInterval(load, TTL);
    return () => { cancelled = true; window.clearInterval(id); };
  }, []);

  return state;
}
