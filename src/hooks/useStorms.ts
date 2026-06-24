import { useEffect, useState } from 'react';
import { apiGet } from '@/lib/api';

export type StormForecastPoint = { lat: number; lng: number; tau: number; wind?: number };

export type Storm = {
  id: string;
  name: string;
  basin: 'AL' | 'EP' | 'CP' | 'WP' | 'IO' | 'SH';
  classification: string;
  category: number;        // -1 TD, 0 TS, 1-5 hurricane
  lat: number;
  lng: number;
  windKt: number;
  pressureMb: number | null;
  movementDeg: number | null;
  movementKt: number | null;
  forecast: StormForecastPoint[];
  updated: string;
};

type State = {
  storms: Storm[];
  loading: boolean;
  error: string | null;
  ts: number | null;
};

let memo: { ts: number; storms: Storm[] } | null = null;
const TTL = 10 * 60_000;

/**
 * Active tropical cyclones (NHC Atlantic + East Pacific). Polled every 10 min
 * via the `storms` edge function. Skips network calls when `enabled=false`.
 */
export function useStorms(enabled: boolean): State {
  const [state, setState] = useState<State>({
    storms: memo?.storms ?? [],
    loading: enabled && !memo,
    error: null,
    ts: memo?.ts ?? null,
  });

  useEffect(() => {
    if (!enabled) return;
    let cancelled = false;
    const load = async () => {
      if (memo && Date.now() - memo.ts < TTL) {
        setState({ storms: memo.storms, loading: false, error: null, ts: memo.ts });
        return;
      }
      try {
        const data = await apiGet<{ storms?: Storm[] }>('/api/market/events/storms');
        const storms = (data?.storms ?? []) as Storm[];
        memo = { ts: Date.now(), storms };
        if (!cancelled) setState({ storms, loading: false, error: null, ts: memo.ts });
      } catch (e: any) {
        if (!cancelled) setState(s => ({ ...s, loading: false, error: String(e?.message ?? e) }));
      }
    };
    load();
    const id = window.setInterval(load, TTL);
    return () => { cancelled = true; window.clearInterval(id); };
  }, [enabled]);

  return state;
}
