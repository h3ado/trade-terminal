import { useEffect, useMemo } from 'react';
import type ThreeGlobe from 'three-globe';

export type MacroMetric = 'yield10y' | 'cpi' | 'gdp' | 'pmi';

export const MACRO_METRIC_META: Record<MacroMetric, {
  label: string;
  short: string;
  unit: string;
  /** Color scale midpoint (where the gradient flips green↔red). */
  pivot: number;
  /** Half-range that saturates the color scale. */
  span: number;
  /** If true, higher = better (green). If false, higher = worse (red). */
  higherIsBetter: boolean;
}> = {
  yield10y: { label: '10Y Govt Yield', short: 'YLD', unit: '%',  pivot: 3.5, span: 3.0, higherIsBetter: false },
  cpi:      { label: 'CPI YoY',        short: 'CPI', unit: '%',  pivot: 2.0, span: 4.0, higherIsBetter: false },
  gdp:      { label: 'Real GDP YoY',   short: 'GDP', unit: '%',  pivot: 2.0, span: 4.0, higherIsBetter: true  },
  pmi:      { label: 'Mfg PMI',        short: 'PMI', unit: '',   pivot: 50,  span: 6.0, higherIsBetter: true  },
};

/** ISO-3 → snapshot of latest macro readings. Static for now; swap for live feed later. */
type Row = { yield10y: number | null; cpi: number | null; gdp: number | null; pmi: number | null };
export const MACRO_BY_ISO3: Record<string, Row> = {
  USA: { yield10y: 4.28, cpi: 3.1, gdp: 2.4, pmi: 50.3 },
  CAN: { yield10y: 3.42, cpi: 2.8, gdp: 1.1, pmi: 49.7 },
  MEX: { yield10y: 9.85, cpi: 4.4, gdp: 1.5, pmi: 48.9 },
  GBR: { yield10y: 4.12, cpi: 3.4, gdp: 0.7, pmi: 49.8 },
  FRA: { yield10y: 3.05, cpi: 2.4, gdp: 0.9, pmi: 47.2 },
  DEU: { yield10y: 2.42, cpi: 2.2, gdp: -0.1, pmi: 42.5 },
  ITA: { yield10y: 3.65, cpi: 1.8, gdp: 0.6, pmi: 46.8 },
  ESP: { yield10y: 3.18, cpi: 3.0, gdp: 2.5, pmi: 51.4 },
  NLD: { yield10y: 2.62, cpi: 2.7, gdp: 0.8, pmi: 48.6 },
  BEL: { yield10y: 2.92, cpi: 3.6, gdp: 1.2, pmi: 47.5 },
  AUT: { yield10y: 2.85, cpi: 4.1, gdp: -0.6, pmi: 44.9 },
  PRT: { yield10y: 2.92, cpi: 2.4, gdp: 1.7, pmi: 49.5 },
  IRL: { yield10y: 2.62, cpi: 2.2, gdp: 3.4, pmi: 51.6 },
  GRC: { yield10y: 3.18, cpi: 2.7, gdp: 2.1, pmi: 52.4 },
  FIN: { yield10y: 2.78, cpi: 1.4, gdp: -0.5, pmi: 46.2 },
  CHE: { yield10y: 0.62, cpi: 1.2, gdp: 1.4, pmi: 49.1 },
  SWE: { yield10y: 2.18, cpi: 2.5, gdp: 0.4, pmi: 50.8 },
  NOR: { yield10y: 3.62, cpi: 3.0, gdp: 1.2, pmi: 51.2 },
  DNK: { yield10y: 2.45, cpi: 1.8, gdp: 1.9, pmi: 50.5 },
  POL: { yield10y: 5.45, cpi: 3.6, gdp: 2.8, pmi: 47.8 },
  CZE: { yield10y: 4.12, cpi: 2.4, gdp: 1.4, pmi: 46.5 },
  HUN: { yield10y: 6.85, cpi: 4.8, gdp: 1.0, pmi: 49.6 },
  TUR: { yield10y: 28.5, cpi: 49.4, gdp: 3.6, pmi: 49.2 },
  RUS: { yield10y: 14.2, cpi: 8.7, gdp: 1.8, pmi: 50.1 },
  JPN: { yield10y: 0.78, cpi: 2.6, gdp: 0.9, pmi: 49.8 },
  KOR: { yield10y: 3.42, cpi: 2.4, gdp: 2.2, pmi: 50.6 },
  CHN: { yield10y: 2.32, cpi: 0.4, gdp: 4.8, pmi: 50.4 },
  HKG: { yield10y: 4.18, cpi: 1.8, gdp: 2.6, pmi: 49.5 },
  TWN: { yield10y: 1.62, cpi: 2.2, gdp: 3.5, pmi: 51.5 },
  SGP: { yield10y: 2.85, cpi: 2.7, gdp: 2.9, pmi: 50.8 },
  IND: { yield10y: 7.12, cpi: 5.1, gdp: 7.2, pmi: 56.4 },
  IDN: { yield10y: 6.85, cpi: 2.8, gdp: 5.0, pmi: 52.4 },
  THA: { yield10y: 2.62, cpi: 0.8, gdp: 1.9, pmi: 50.2 },
  MYS: { yield10y: 3.85, cpi: 1.9, gdp: 4.2, pmi: 49.8 },
  PHL: { yield10y: 6.15, cpi: 3.4, gdp: 5.6, pmi: 51.2 },
  VNM: { yield10y: 2.92, cpi: 3.2, gdp: 6.5, pmi: 51.6 },
  AUS: { yield10y: 4.18, cpi: 3.6, gdp: 1.5, pmi: 47.5 },
  NZL: { yield10y: 4.42, cpi: 2.5, gdp: 0.6, pmi: 47.2 },
  BRA: { yield10y: 11.8, cpi: 4.5, gdp: 2.4, pmi: 51.5 },
  ARG: { yield10y: 31.5, cpi: 162.0, gdp: -1.5, pmi: 47.8 },
  CHL: { yield10y: 5.62, cpi: 3.8, gdp: 1.8, pmi: 49.1 },
  COL: { yield10y: 9.85, cpi: 5.2, gdp: 1.2, pmi: 51.8 },
  PER: { yield10y: 6.45, cpi: 2.4, gdp: 2.6, pmi: 50.5 },
  ZAF: { yield10y: 10.8, cpi: 5.3, gdp: 1.0, pmi: 49.2 },
  EGY: { yield10y: 24.5, cpi: 28.5, gdp: 2.8, pmi: 48.6 },
  NGA: { yield10y: 18.4, cpi: 33.2, gdp: 2.9, pmi: 50.4 },
  SAU: { yield10y: 4.85, cpi: 1.8, gdp: 1.5, pmi: 56.8 },
  ARE: { yield10y: 4.62, cpi: 2.1, gdp: 3.2, pmi: 56.4 },
  ISR: { yield10y: 4.95, cpi: 2.6, gdp: 1.8, pmi: 47.5 },
};

function colorFor(metric: MacroMetric, value: number | null, alpha: number): string {
  if (value === null || !isFinite(value)) return `hsla(0,0%,28%,${alpha})`;
  const meta = MACRO_METRIC_META[metric];
  const rel = (value - meta.pivot) / meta.span; // -1..+1 ish
  const clamped = Math.max(-1, Math.min(1, rel));
  // sign of "good": positive value above pivot → good if higherIsBetter
  const good = meta.higherIsBetter ? clamped : -clamped;
  const hue = good >= 0 ? 142 : 0;
  const sat = 70;
  const light = 28 + Math.min(Math.abs(good), 1) * 27;
  return `hsla(${hue},${sat}%,${light}%,${alpha})`;
}

/**
 * Recolors country polygons by the chosen macro metric. Layers on top of the base
 * countries layer (call AFTER it sets polygonsData). Falls through when disabled.
 */
export function useMacroChoroplethLayer(
  globeRef: React.RefObject<ThreeGlobe>,
  countriesData: any | null,
  metric: MacroMetric,
  enabled: boolean,
  opacity: number,
) {
  // memoize to avoid re-running effect when caller passes a new opacity ref each render
  const key = useMemo(() => `${metric}|${enabled}|${opacity}`, [metric, enabled, opacity]);

  useEffect(() => {
    const g = globeRef.current;
    if (!g || !enabled || !countriesData) return;
    (g as any).polygonCapColor((feat: any) => {
      const iso = feat?.properties?.ISO_A3 || feat?.properties?.iso_a3;
      const row = iso ? MACRO_BY_ISO3[iso] : undefined;
      const val = row ? row[metric] : null;
      return colorFor(metric, val, opacity);
    });
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [globeRef, countriesData, key]);
}
