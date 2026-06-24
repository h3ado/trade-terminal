import { useEffect, useState } from 'react';
import { apiGet } from '@/lib/api';

export type Coin = {
  id: string;
  symbol: string;
  name: string;
  image: string;
  price: number;
  marketCap: number;
  marketCapRank: number;
  volume24h: number;
  change24hPct: number | null;
  change7dPct: number | null;
  ath: number;
  athChangePct: number | null;
  high24h: number;
  low24h: number;
  supply: number | null;
  maxSupply: number | null;
};

type State = { coins: Coin[]; loading: boolean; error: string | null; ts: number | null };

let memo: { ts: number; coins: Coin[] } | null = null;
const TTL = 60_000;

/** Live top-50 crypto prices from CoinGecko via the coingecko-prices edge function. */
export function useCrypto(): State {
  const [state, setState] = useState<State>({
    coins: memo?.coins ?? [],
    loading: !memo,
    error: null,
    ts: memo?.ts ?? null,
  });

  useEffect(() => {
    let cancelled = false;
    const load = async () => {
      if (memo && Date.now() - memo.ts < TTL) {
        setState({ coins: memo.coins, loading: false, error: null, ts: memo.ts });
        return;
      }
      try {
        const data = await apiGet<{ coins?: Coin[] }>('/api/market/indices/coingecko-prices');
        const coins = (data?.coins ?? []) as Coin[];
        memo = { ts: Date.now(), coins };
        if (!cancelled) setState({ coins, loading: false, error: null, ts: memo.ts });
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
