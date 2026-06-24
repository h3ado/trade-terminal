import { useEffect, useState } from 'react';
import { apiGet } from '@/lib/api';

export type Vessel = {
  mmsi: number;
  lat: number;
  lng: number;
  cog: number;
  sog: number;
  shipType: number | null;
  category: 'tanker' | 'cargo' | 'other';
  name: string | null;
  chokepoint: string;
  ts: number;
};

type State = {
  vessels: Vessel[];
  loading: boolean;
  error: string | null;
  ts: number | null;
};

let memo: { ts: number; vessels: Vessel[] } | null = null;
const TTL = 60_000;

/**
 * Live vessel positions near maritime chokepoints, polled every 60s through
 * the `ais-vessels` edge function. Disabled by default — pass `enabled=false`
 * to skip network calls when the layer is hidden.
 */
export function useAISVessels(enabled: boolean): State {
  const [state, setState] = useState<State>({
    vessels: memo?.vessels ?? [],
    loading: enabled && !memo,
    error: null,
    ts: memo?.ts ?? null,
  });

  useEffect(() => {
    if (!enabled) return;
    let cancelled = false;
    const load = async () => {
      if (memo && Date.now() - memo.ts < TTL) {
        setState({ vessels: memo.vessels, loading: false, error: null, ts: memo.ts });
        return;
      }
      try {
        const data = await apiGet<{ vessels?: Vessel[] }>('/api/market/events/ais-vessels');
        const vessels = (data?.vessels ?? []) as Vessel[];
        memo = { ts: Date.now(), vessels };
        if (!cancelled) setState({ vessels, loading: false, error: null, ts: memo.ts });
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
