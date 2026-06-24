import { useEffect, useMemo } from 'react';
import type ThreeGlobe from 'three-globe';
import type { GlobeMarket } from '../AdvancedGlobe';
import type { IndexQuote } from '@/hooks/useIndices';

/**
 * Replaces the default exchange points with bubbles sized by free-float market cap
 * and colored by today's index % move. Hooks into three-globe's `pointsData`.
 *
 * Falls through (no-op) when disabled or when no data is available — the existing
 * exchange points effect in AdvancedGlobe will then handle rendering.
 */
export function useBubblesLayer(
  globeRef: React.RefObject<ThreeGlobe>,
  markets: GlobeMarket[],
  byAbbr: Record<string, IndexQuote>,
  enabled: boolean,
  selected: number | null,
  hovered: number | null,
) {
  const data = useMemo(() => {
    if (!enabled) return null;
    return markets.map((m, i) => {
      const q = byAbbr[m.abbr];
      const pct = q?.change_pct ?? null;
      const mcap = q?.mcap_usd_t ?? 0.5;
      return { m, i, q, pct, mcap };
    });
  }, [enabled, markets, byAbbr]);

  useEffect(() => {
    const g = globeRef.current;
    if (!g || !enabled || !data) return;
    (g as any)
      .pointsData(data)
      .pointLat((d: any) => d.m.lat)
      .pointLng((d: any) => d.m.lng)
      .pointColor((d: any) => {
        if (d.pct == null) return '#64748b';
        return d.pct >= 0 ? '#22c55e' : '#ef4444';
      })
      .pointAltitude((d: any) =>
        d.i === selected ? 0.10 : d.i === hovered ? 0.06 : 0.02 + Math.min(d.mcap / 60, 0.04),
      )
      .pointRadius((d: any) => 0.3 + Math.sqrt(Math.max(d.mcap, 0.1)) * 0.35)
      .pointsMerge(false);
  }, [globeRef, data, enabled, selected, hovered]);
}
