import { useEffect, useMemo } from 'react';
import type ThreeGlobe from 'three-globe';

export type Chokepoint = {
  id: string;
  name: string;
  short: string;
  lat: number;
  lng: number;
  /** Approx. % of global seaborne oil trade transiting this point. */
  oilSharePct: number;
  /** Risk tier: 1=stable, 2=watch, 3=elevated, 4=hot. */
  risk: 1 | 2 | 3 | 4;
};

/** Major maritime chokepoints. Coords WGS84, risk levels reflect 2024-25 baseline. */
export const CHOKEPOINTS: Chokepoint[] = [
  { id: 'hormuz',  name: 'Strait of Hormuz',     short: 'HRMZ', lat: 26.57,  lng: 56.25,  oilSharePct: 21, risk: 4 },
  { id: 'malacca', name: 'Strait of Malacca',    short: 'MLCC', lat: 2.50,   lng: 101.30, oilSharePct: 30, risk: 2 },
  { id: 'suez',    name: 'Suez Canal',           short: 'SUEZ', lat: 30.50,  lng: 32.35,  oilSharePct: 9,  risk: 3 },
  { id: 'babmandeb', name: 'Bab el-Mandeb',      short: 'BABM', lat: 12.58,  lng: 43.33,  oilSharePct: 12, risk: 4 },
  { id: 'panama',  name: 'Panama Canal',         short: 'PANA', lat: 9.08,   lng: -79.68, oilSharePct: 1,  risk: 3 },
  { id: 'bosporus', name: 'Bosporus / Dardanelles', short: 'BOSP', lat: 41.10, lng: 29.05, oilSharePct: 3, risk: 3 },
  { id: 'gibraltar', name: 'Strait of Gibraltar', short: 'GIBR', lat: 35.95, lng: -5.50,  oilSharePct: 8,  risk: 1 },
  { id: 'goodhope', name: 'Cape of Good Hope',   short: 'COGH', lat: -34.36, lng: 18.47,  oilSharePct: 6,  risk: 2 },
  { id: 'dover',   name: 'Strait of Dover',      short: 'DOVR', lat: 51.00,  lng: 1.50,   oilSharePct: 4,  risk: 1 },
  { id: 'sunda',   name: 'Sunda Strait',         short: 'SUND', lat: -6.00,  lng: 105.80, oilSharePct: 2,  risk: 1 },
  { id: 'lombok',  name: 'Lombok Strait',        short: 'LMBK', lat: -8.70,  lng: 115.75, oilSharePct: 2,  risk: 1 },
  { id: 'taiwan',  name: 'Taiwan Strait',        short: 'TWNS', lat: 24.50,  lng: 119.50, oilSharePct: 4,  risk: 3 },
];

/** Major dry-bulk + container shipping routes (start, end, label, weight 0..1). */
export const SHIPPING_ROUTES: { id: string; from: [number, number]; to: [number, number]; label: string; weight: number }[] = [
  { id: 'shanghai-rotterdam', from: [31.2, 121.5],  to: [51.95, 4.13],   label: 'Shanghai → Rotterdam',  weight: 1.0 },
  { id: 'shanghai-la',        from: [31.2, 121.5],  to: [33.74, -118.27], label: 'Shanghai → Los Angeles', weight: 0.95 },
  { id: 'singapore-rotterdam', from: [1.29, 103.85], to: [51.95, 4.13],  label: 'Singapore → Rotterdam', weight: 0.9 },
  { id: 'jebel-rotterdam',    from: [25.01, 55.13], to: [51.95, 4.13],   label: 'Jebel Ali → Rotterdam', weight: 0.7 },
  { id: 'santos-shanghai',    from: [-23.96, -46.33], to: [31.2, 121.5], label: 'Santos → Shanghai',    weight: 0.85 },
  { id: 'houston-rotterdam',  from: [29.74, -95.3], to: [51.95, 4.13],   label: 'Houston → Rotterdam',  weight: 0.65 },
  { id: 'busan-la',           from: [35.10, 129.04], to: [33.74, -118.27], label: 'Busan → Los Angeles', weight: 0.8 },
  { id: 'jeddah-rotterdam',   from: [21.49, 39.19], to: [51.95, 4.13],   label: 'Jeddah → Rotterdam',   weight: 0.6 },
  { id: 'mumbai-shanghai',    from: [19.07, 72.87], to: [31.2, 121.5],   label: 'Mumbai → Shanghai',    weight: 0.55 },
];

/** Risk tier → HSL color. */
function riskColor(risk: number): string {
  switch (risk) {
    case 4: return 'hsl(0, 85%, 55%)';   // hot — red
    case 3: return 'hsl(28, 95%, 55%)';  // elevated — orange
    case 2: return 'hsl(45, 90%, 55%)';  // watch — amber
    default: return 'hsl(180, 70%, 50%)'; // stable — cyan
  }
}

/**
 * Renders chokepoints as labeled rings on the globe. Layers on top of any existing
 * `ringsData` (it's safe — three-globe maintains a single rings layer).
 */
export function useChokepointsLayer(
  globeRef: React.RefObject<ThreeGlobe>,
  enabled: boolean,
  hovered: string | null,
) {
  const data = useMemo(() => (enabled ? CHOKEPOINTS : []), [enabled]);

  useEffect(() => {
    const g = globeRef.current;
    if (!g) return;
    if (!enabled) {
      (g as any).ringsData([]);
      return;
    }
    (g as any)
      .ringsData(data)
      .ringLat((d: Chokepoint) => d.lat)
      .ringLng((d: Chokepoint) => d.lng)
      .ringColor((d: Chokepoint) => () => riskColor(d.risk))
      .ringMaxRadius((d: Chokepoint) => (hovered === d.id ? 5.5 : 2.5 + d.risk * 0.6))
      .ringPropagationSpeed((d: Chokepoint) => 0.8 + d.risk * 0.2)
      .ringRepeatPeriod((d: Chokepoint) => 1800 - d.risk * 250)
      .ringAltitude(0.005);
  }, [globeRef, data, enabled, hovered]);
}

/**
 * Renders shipping routes as colored arcs. Coexists with FX arcs by routing
 * through three-globe's separate htmlElements/arcsData — but since three-globe
 * has only one arcs layer, we only enable this when the FX flow layer is OFF.
 */
export function useShippingArcsLayer(
  globeRef: React.RefObject<ThreeGlobe>,
  enabled: boolean,
  opacity: number,
) {
  const arcs = useMemo(() => {
    if (!enabled) return [];
    const a = Math.round(Math.max(0, Math.min(1, opacity)) * 255).toString(16).padStart(2, '0');
    return SHIPPING_ROUTES.map(r => ({
      ...r,
      colorStart: `hsla(195, 90%, 60%, ${opacity})`,
      colorEnd:   `hsla(195, 90%, 75%, ${opacity})`,
      _alpha: a,
    }));
  }, [enabled, opacity]);

  useEffect(() => {
    const g = globeRef.current;
    if (!g || !enabled) return;
    (g as any)
      .arcsData(arcs)
      .arcStartLat((d: any) => d.from[0])
      .arcStartLng((d: any) => d.from[1])
      .arcEndLat((d: any) => d.to[0])
      .arcEndLng((d: any) => d.to[1])
      .arcColor((d: any) => [d.colorStart, d.colorEnd])
      .arcStroke((d: any) => 0.4 + d.weight * 0.5)
      .arcAltitudeAutoScale(0.45)
      .arcDashLength(0.35)
      .arcDashGap(0.65)
      .arcDashAnimateTime(4000)
      .arcsTransitionDuration(0);
  }, [globeRef, arcs, enabled]);
}
