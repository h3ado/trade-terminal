import { useEffect, useState } from 'react';
import { apiGet } from '@/lib/api';

export type IndexQuote = {
  abbr: string;
  symbol: string;
  close: number | null;
  prev_close: number | null;
  change_pct: number | null;
  mcap_usd_t: number;
  movers: { sym: string; pct: number }[];
};

type State = {
  indices: IndexQuote[];
  byAbbr: Record<string, IndexQuote>;
  loading: boolean;
  error: string | null;
  ts: number | null;
};

let memo: { ts: number; rows: IndexQuote[] } | null = null;
const TTL = 60_000;

/** Live world index quotes (~60s polling) via the `indices` edge function. */
export function useIndices(): State {
  const initial: IndexQuote[] = memo?.rows ?? [];
  const [state, setState] = useState<State>({
    indices: initial,
    byAbbr: byAbbr(initial),
    loading: !memo,
    error: null,
    ts: memo?.ts ?? null,
  });

  useEffect(() => {
    let cancelled = false;
    const load = async () => {
      if (memo && Date.now() - memo.ts < TTL) {
        setState({ indices: memo.rows, byAbbr: byAbbr(memo.rows), loading: false, error: null, ts: memo.ts });
        return;
      }
      try {
        const data = await apiGet<{ indices?: IndexQuote[] }>('/api/market/indices/indices');
        const rows = (data?.indices ?? []) as IndexQuote[];
        memo = { ts: Date.now(), rows };
        if (!cancelled) setState({ indices: rows, byAbbr: byAbbr(rows), loading: false, error: null, ts: memo.ts });
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

function byAbbr(rows: IndexQuote[]): Record<string, IndexQuote> {
  const map: Record<string, IndexQuote> = {};
  for (const r of rows) map[r.abbr] = r;
  return map;
}
