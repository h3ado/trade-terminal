/**
 * Batched live quotes for the Companies layer via Twelve Data.
 * Uses direct GET to the edge function (need ?symbols= query string),
 * chunked to stay under Twelve Data's per-call symbol cap.
 */
import { useEffect, useState } from 'react';
import { apiPost } from '@/lib/api';

export type LiveQuote = { price: number; change: number; pct: number };

const CHUNK = 30;
const REFRESH_MS = 5 * 60_000;

export function useLiveQuotes(tickers: string[]) {
  const [quotes, setQuotes] = useState<Record<string, LiveQuote>>({});
  const [live, setLive] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const key = tickers.join(',');

  useEffect(() => {
    if (tickers.length === 0) return;
    let cancelled = false;
    const load = async () => {
      try {
        const out: Record<string, LiveQuote> = {};
        for (let i = 0; i < tickers.length; i += CHUNK) {
          const symbols = tickers.slice(i, i + CHUNK).filter(Boolean);
          if (!symbols.length) continue;
          const data = await apiPost<{ quotes?: Record<string, LiveQuote> }>('/api/market/forex/twelve-quotes', { symbols });
          Object.assign(out, data?.quotes ?? {});
        }
        if (!cancelled) {
          setQuotes(out);
          setLive(Object.keys(out).length > 0);
          setError(null);
        }
      } catch (e: any) {
        if (!cancelled) { setError(String(e?.message ?? e)); setLive(false); }
      }
    };
    load();
    const id = window.setInterval(load, REFRESH_MS);
    return () => { cancelled = true; clearInterval(id); };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [key]);

  return { quotes, live, error };
}
