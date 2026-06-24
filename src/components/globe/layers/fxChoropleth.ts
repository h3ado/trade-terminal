import { useEffect, useMemo } from 'react';
import type ThreeGlobe from 'three-globe';
import type { FXRate } from '@/hooks/useFXRates';

/** ISO-3 → currency mapping for choropleth. Subset covering ~90% of FX activity. */
const ISO3_TO_CCY: Record<string, string> = {
  USA: 'USD',
  CAN: 'CAD', MEX: 'MXN',
  GBR: 'GBP', FRA: 'EUR', DEU: 'EUR', ITA: 'EUR', ESP: 'EUR', NLD: 'EUR',
  BEL: 'EUR', AUT: 'EUR', PRT: 'EUR', IRL: 'EUR', GRC: 'EUR', FIN: 'EUR',
  CHE: 'CHF', SWE: 'SEK', NOR: 'NOK', DNK: 'EUR',
  TUR: 'TRY',
  JPN: 'JPY', KOR: 'KRW', CHN: 'CNY', HKG: 'HKD', SGP: 'SGD', IND: 'INR',
  AUS: 'AUD', NZL: 'NZD',
  BRA: 'BRL', ZAF: 'ZAR',
};

/** Map a delta% to a HSL color string with given alpha. */
function colorFor(delta: number | null, alpha: number): string {
  if (delta === null || !isFinite(delta)) return `hsla(0,0%,30%,${alpha})`;
  const clamped = Math.max(-2, Math.min(2, delta));
  const hue = clamped >= 0 ? 142 : 0;            // green or red
  const sat = 70;
  const light = 30 + Math.min(Math.abs(clamped) / 2, 1) * 25; // 30 → 55
  return `hsla(${hue},${sat}%,${light}%,${alpha})`;
}

/**
 * Recolors the existing country polygons by each country's currency change vs USD.
 * Designed to layer on top of the base countries layer (call AFTER it sets polygonsData).
 */
export function useFXChoroplethLayer(
  globeRef: React.RefObject<ThreeGlobe>,
  countriesData: any | null,
  rates: FXRate[],
  enabled: boolean,
  opacity: number,
) {
  const byCcy = useMemo(() => {
    const map: Record<string, FXRate> = {};
    for (const r of rates) map[r.ccy] = r;
    return map;
  }, [rates]);

  useEffect(() => {
    const g = globeRef.current;
    if (!g || !enabled || !countriesData) return;

    const lookupDelta = (feat: any): number | null => {
      const iso = feat?.properties?.ISO_A3 || feat?.properties?.iso_a3;
      const ccy = iso ? ISO3_TO_CCY[iso] : undefined;
      if (!ccy) return null;
      if (ccy === 'USD') return 0;
      return byCcy[ccy]?.change_pct ?? null;
    };

    (g as any).polygonCapColor((feat: any) => colorFor(lookupDelta(feat), opacity));
  }, [globeRef, countriesData, byCcy, enabled, opacity]);
}
