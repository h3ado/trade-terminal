import { useEffect, useState } from 'react';
import { apiGet } from '@/lib/api';

export type EIAIndicator = {
  key: string;
  label: string;
  unit: string;
  value: number | null;
  prev: number | null;
  change: number | null;
  date: string | null;
};

type State = {
  byKey: Record<string, EIAIndicator>;
  loading: boolean;
  error: string | null;
  ts: number | null;
};

let memo: { ts: number; byKey: Record<string, EIAIndicator> } | null = null;
const TTL = 60 * 60_000;

/** Live US energy stats (oil prices, inventories, production, gas storage). */
export function useEIA(): State {
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
        const data = await apiGet<{ indicators?: EIAIndicator[] }>('/api/market/macro/eia-energy');
        const list = (data?.indicators ?? []) as EIAIndicator[];
        const byKey: Record<string, EIAIndicator> = {};
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
