import { useEffect, useMemo, useRef } from 'react';
import * as THREE from 'three';
import type ThreeGlobe from 'three-globe';
import type { FXRate } from '@/hooks/useFXRates';

/**
 * FX hubs (lat/lng of the major currency centers we draw flow arcs between).
 * Edges are drawn between the most-traded pairs (BIS Triennial top corridors).
 */
const HUBS: Record<string, { name: string; lat: number; lng: number }> = {
  USD: { name: 'New York',   lat: 40.71,  lng:  -74.01 },
  EUR: { name: 'Frankfurt',  lat: 50.11,  lng:    8.68 },
  GBP: { name: 'London',     lat: 51.51,  lng:   -0.13 },
  JPY: { name: 'Tokyo',      lat: 35.68,  lng:  139.69 },
  CHF: { name: 'Zurich',     lat: 47.37,  lng:    8.54 },
  AUD: { name: 'Sydney',     lat: -33.87, lng:  151.21 },
  CAD: { name: 'Toronto',    lat: 43.65,  lng:  -79.38 },
  HKD: { name: 'Hong Kong',  lat: 22.30,  lng:  114.17 },
  SGD: { name: 'Singapore',  lat:  1.35,  lng:  103.82 },
  CNY: { name: 'Shanghai',   lat: 31.23,  lng:  121.47 },
};

// Top FX corridors by volume (BIS-inspired). Each is [base, quote] where base→quote.
const CORRIDORS: [string, string][] = [
  ['EUR', 'USD'],
  ['USD', 'JPY'],
  ['GBP', 'USD'],
  ['AUD', 'USD'],
  ['USD', 'CAD'],
  ['USD', 'CHF'],
  ['USD', 'CNY'],
  ['USD', 'HKD'],
  ['USD', 'SGD'],
  ['EUR', 'GBP'],
  ['EUR', 'JPY'],
  ['EUR', 'CHF'],
  ['GBP', 'JPY'],
];

type ArcDatum = {
  startLat: number; startLng: number; endLat: number; endLng: number;
  base: string; quote: string;
  /** signed change of base vs quote in % (positive = base strengthening) */
  delta: number;
  color: string[];
  stroke: number;
  /** hashed corridor id for hover lookups */
  id: string;
};

/** Resolve cross-rate change between two currencies given their USD-anchored series. */
function crossDelta(base: string, quote: string, byCcy: Record<string, FXRate>): number {
  const b = byCcy[base];
  const q = byCcy[quote];
  // USD itself has no row; treat as 0 change.
  const bChg = base === 'USD' ? 0 : b?.change_pct ?? 0;
  const qChg = quote === 'USD' ? 0 : q?.change_pct ?? 0;
  return bChg - qChg;
}

/**
 * Imperatively renders FX flow arcs on the existing three-globe instance.
 * Static by default; arc currently hovered gets the dash animation.
 */
export function useFXArcsLayer(
  globeRef: React.RefObject<ThreeGlobe>,
  rates: FXRate[],
  enabled: boolean,
  opacity: number,
  hoveredCorridorId: string | null,
) {
  const byCcy = useMemo(() => {
    const map: Record<string, FXRate> = {};
    for (const r of rates) map[r.ccy] = r;
    return map;
  }, [rates]);

  const arcs: ArcDatum[] = useMemo(() => {
    if (!enabled) return [];
    return CORRIDORS.flatMap(([base, quote]) => {
      const a = HUBS[base];
      const b = HUBS[quote];
      if (!a || !b) return [];
      const delta = crossDelta(base, quote, byCcy);
      const positive = delta >= 0;
      // green if base strengthening, red if weakening, vs quote
      const main = positive ? '#22c55e' : '#ef4444';
      return [{
        startLat: a.lat, startLng: a.lng,
        endLat: b.lat, endLng: b.lng,
        base, quote, delta,
        color: [main, main],
        stroke: 0.25 + Math.min(Math.abs(delta), 2) * 0.25,
        id: `${base}/${quote}`,
      }];
    });
  }, [byCcy, enabled]);

  useEffect(() => {
    const g = globeRef.current;
    if (!g) return;
    if (!enabled) {
      try { (g as any).arcsData([]); } catch { /* noop */ }
      return;
    }
    (g as any)
      .arcsData(arcs)
      .arcStartLat((d: ArcDatum) => d.startLat)
      .arcStartLng((d: ArcDatum) => d.startLng)
      .arcEndLat((d: ArcDatum) => d.endLat)
      .arcEndLng((d: ArcDatum) => d.endLng)
      .arcColor((d: ArcDatum) => {
        const isHover = hoveredCorridorId === d.id;
        const a = Math.round((isHover ? 1 : opacity) * 255).toString(16).padStart(2, '0');
        return d.color.map(c => `${c}${a}`);
      })
      .arcStroke((d: ArcDatum) => (hoveredCorridorId === d.id ? d.stroke + 0.25 : d.stroke))
      .arcAltitudeAutoScale((d: ArcDatum) => (hoveredCorridorId === d.id ? 0.55 : 0.35))
      .arcDashLength((d: ArcDatum) => (hoveredCorridorId === d.id ? 0.5 : 1))
      .arcDashGap((d: ArcDatum) => (hoveredCorridorId === d.id ? 0.3 : 0))
      .arcDashAnimateTime((d: ArcDatum) => (hoveredCorridorId === d.id ? 2200 : 0))
      .arcsTransitionDuration(0);
  }, [globeRef, arcs, enabled, opacity, hoveredCorridorId]);
}

export const FX_HUBS = HUBS;
export const FX_CORRIDORS = CORRIDORS;
