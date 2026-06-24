import { useEffect, useState } from 'react';
import { apiGet } from '@/lib/api';

export type FREDIndicator = {
  key: string;
  id: string;
  label: string;
  unit: string;
  value: number | null;
  prev: number | null;
  change: number | null;
  date: string | null;
};

type State = {
  byKey: Record<string, FREDIndicator>;
  loading: boolean;
  error: string | null;
  ts: number | null;
};

let memo: { ts: number; byKey: Record<string, FREDIndicator> } | null = null;
const TTL = 60 * 60_000; // 1h — FRED data updates monthly

/**
 * Live US macro indicators from the FRED API (CPI, GDP, unemployment, fed
 * funds, etc.). Cached aggressively because the underlying series are
 * monthly/quarterly. Returns indicators keyed by the stable keys defined
 * in the `fred-indicators` edge function.
 */
export function useFRED(): State {
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
        const data = await apiGet<{ indicators?: FREDIndicator[] }>('/api/market/macro/fred-indicators');
        const list = (data?.indicators ?? []) as FREDIndicator[];
        const byKey: Record<string, FREDIndicator> = {};
        for (const i of list) byKey[i.key] = i;
        memo = { ts: Date.now(), byKey };
        if (!cancelled) setState({ byKey, loading: false, error: null, ts: memo.ts });
      } catch (e: any) {
        if (!cancelled) setState(s => ({ ...s, loading: false, error: String(e?.message ?? e) }));
      }
    };
    load();
    const id = window.setInterval(load, TTL);
    return () => { cancelled = true; window.clearInterval(id); };
  }, []);

  return state;
}
