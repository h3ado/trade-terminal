import { useState } from 'react';
import { useBridge } from '@/contexts/BridgeContext';
import { fetchGex, fetchOptionsChain } from '@/services/ibkrBridge';
import {
  type GexCell, type GexExpiryKey, type GexKeyLevels,
  aggregateByStrike, gexKeyLevels,
} from '@/components/options/shared/mockSeries';

export interface LiveGexData {
  cells: GexCell[];
  agg: ReturnType<typeof aggregateByStrike>;
  levels: GexKeyLevels;
  spot: number;
  netGex: number;
  regime: string;
  loadedTicker: string;
  ts: number;
}

function dteToBucket(dte: number): GexExpiryKey {
  if (dte <= 1)  return '0DTE';
  if (dte <= 4)  return '1DTE';
  if (dte <= 10) return '7DTE';
  if (dte <= 20) return '14DTE';
  if (dte <= 45) return '30DTE';
  if (dte <= 75) return '60DTE';
  return '90DTE';
}

export function useIbkrGex() {
  const { isLive } = useBridge();
  const [data, setData] = useState<LiveGexData | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const load = async (ticker: string) => {
    if (!isLive) return;
    setLoading(true);
    setError(null);
    try {
      const [gexResp, chainResp] = await Promise.all([
        fetchGex(ticker),
        fetchOptionsChain(ticker),
      ]);
      const spot = gexResp.spot;
      const now = Date.now();

      // Group ChainRows by (strike, expiry bucket)
      type Acc = { callRow: typeof chainResp.rows[0] | null; putRow: typeof chainResp.rows[0] | null };
      const bucketMap = new Map<string, Acc>();

      for (const row of chainResp.rows) {
        const expiryMs = new Date(row.expiry).getTime();
        const dte = Math.max(0, Math.round((expiryMs - now) / 86_400_000));
        const bucket = dteToBucket(dte);
        const key = `${row.strike}:${bucket}`;
        const existing = bucketMap.get(key) ?? { callRow: null, putRow: null };
        if (row.type === 'C') existing.callRow = row;
        else existing.putRow = row;
        bucketMap.set(key, existing);
      }

      const cells: GexCell[] = [];
      for (const [key, { callRow, putRow }] of bucketMap) {
        const [strikeStr, bucket] = key.split(':');
        const strike = parseFloat(strikeStr);
        const cr = callRow;
        const pr = putRow;
        // net GEX: calls add positive gamma exposure, puts subtract
        const callGex = cr ? Math.abs(cr.gex) : 0;
        const putGex  = pr ? Math.abs(pr.gex)  : 0;
        const netGex  = callGex - putGex;
        const oi   = (cr?.oi ?? 0) + (pr?.oi ?? 0);
        const vol  = (cr?.volume ?? 0) + (pr?.volume ?? 0);
        const hedge = (cr ? cr.delta * cr.oi : 0) * 100 - (pr ? pr.delta * pr.oi : 0) * 100;
        cells.push({
          strike,
          expiry: bucket as GexExpiryKey,
          gex: netGex,
          oi,
          vol,
          hedge: Math.round(hedge),
          vanna: 0,
          charm: 0,
        });
      }

      const agg = aggregateByStrike(cells);
      const levels = gexKeyLevels(ticker, spot, agg);
      // Override flip with bridge value when available
      if (gexResp.flipLevel != null) {
        (levels as { flip: number }).flip = gexResp.flipLevel;
      }

      setData({
        cells,
        agg,
        levels,
        spot,
        netGex: gexResp.netGex,
        regime: gexResp.regime,
        loadedTicker: ticker,
        ts: Date.now(),
      });
    } catch (e: unknown) {
      setError(e instanceof Error ? e.message : String(e));
    } finally {
      setLoading(false);
    }
  };

  return { data, loading, error, load, isLive };
}
