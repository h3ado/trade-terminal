import { useEffect, useState } from 'react';
import { apiGet } from '@/lib/api';

export type FXRate = {
  ccy: string;
  /** value of 1 unit of ccy in USD */
  usd: number;
  /** 24h % change vs USD; positive = strengthened */
  change_pct: number | null;
};

type State = {
  rates: FXRate[];
  loading: boolean;
  error: string | null;
  ts: number | null;
};

let memo: { ts: number; rates: FXRate[] } | null = null;
const TTL = 60_000;

/** Live FX rates vs USD, polled every 60s through the fx-rates edge function. */
export function useFXRates(): State {
  const [state, setState] = useState<State>({
    rates: memo?.rates ?? [],
    loading: !memo,
    error: null,
    ts: memo?.ts ?? null,
  });

  useEffect(() => {
    let cancelled = false;
    const load = async () => {
      if (memo && Date.now() - memo.ts < TTL) {
        setState({ rates: memo.rates, loading: false, error: null, ts: memo.ts });
        return;
      }
      try {
        const data = await apiGet<{ rates?: FXRate[] }>('/api/market/forex/fx-rates');
        const rates = (data?.rates ?? []) as FXRate[];
        memo = { ts: Date.now(), rates };
        if (!cancelled) setState({ rates, loading: false, error: null, ts: memo.ts });
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
