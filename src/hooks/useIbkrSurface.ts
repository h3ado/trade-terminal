import { useState, useCallback } from 'react';
import { useBridge } from '@/contexts/BridgeContext';
import { fetchVolSurface, fetchHistoricalIv, type SurfaceResponse, type HistoricalIvResponse } from '@/services/ibkrBridge';

export interface LiveSurfaceData {
  raw: SurfaceResponse;
  historical: HistoricalIvResponse;
  loadedTicker: string;
  ts: number;
}

// Bilinear interpolation into the surface iv matrix.
// Returns IV as percentage (e.g. 18.5), or null if surface is unavailable / out of range.
function interpolate(surface: SurfaceResponse, strike: number, daysToExpiry: number): number | null {
  const { strikes, expiries, iv } = surface;
  if (!strikes.length || !expiries.length || !iv.length) return null;

  // Map expiry strings → DTE
  const now = Date.now();
  const dtes = expiries.map(e => Math.max(0, (new Date(e).getTime() - now) / 86_400_000));

  // Find bounding expiry indices
  let e0 = 0, e1 = dtes.length - 1;
  for (let i = 0; i < dtes.length - 1; i++) {
    if (dtes[i] <= daysToExpiry && dtes[i + 1] >= daysToExpiry) { e0 = i; e1 = i + 1; break; }
  }
  const eRange = dtes[e1] - dtes[e0];
  const eT = eRange > 0 ? (daysToExpiry - dtes[e0]) / eRange : 0;

  // Find bounding strike indices
  let s0 = 0, s1 = strikes.length - 1;
  for (let i = 0; i < strikes.length - 1; i++) {
    if (strikes[i] <= strike && strikes[i + 1] >= strike) { s0 = i; s1 = i + 1; break; }
  }
  const sRange = strikes[s1] - strikes[s0];
  const sT = sRange > 0 ? (strike - strikes[s0]) / sRange : 0;

  // Bilinear interpolation: iv[expiryIdx][strikeIdx]
  const v00 = iv[e0]?.[s0] ?? 0;
  const v01 = iv[e0]?.[s1] ?? 0;
  const v10 = iv[e1]?.[s0] ?? 0;
  const v11 = iv[e1]?.[s1] ?? 0;

  const v0 = v00 + (v01 - v00) * sT;
  const v1 = v10 + (v11 - v10) * sT;
  const result = (v0 + (v1 - v0) * eT) * 100; // convert decimal to %

  return isFinite(result) && result > 0 ? result : null;
}

export function useIbkrSurface() {
  const { isLive } = useBridge();
  const [data, setData] = useState<LiveSurfaceData | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const load = async (ticker: string) => {
    if (!isLive) return;
    setLoading(true);
    setError(null);
    try {
      const [raw, historical] = await Promise.all([
        fetchVolSurface(ticker),
        fetchHistoricalIv(ticker),
      ]);
      setData({ raw, historical, loadedTicker: ticker, ts: Date.now() });
    } catch (e: unknown) {
      setError(e instanceof Error ? e.message : String(e));
    } finally {
      setLoading(false);
    }
  };

  // Stable interpolation function — returns null if data not loaded or out of range
  const liveIvAt = useCallback((strike: number, daysToExpiry: number): number | null => {
    if (!data) return null;
    return interpolate(data.raw, strike, daysToExpiry);
  }, [data]);

  return { data, loading, error, load, liveIvAt, isLive };
}
