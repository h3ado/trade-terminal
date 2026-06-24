/**
 * NHC-style cone of uncertainty for tropical cyclone forecast tracks.
 * Radii are 5-year average track-error climatology (67% probability circles)
 * in nautical miles, by basin and forecast hour (tau).
 */

type LL = { lat: number; lng: number };
type Storm = { lat: number; lng: number; basin: string; forecast: { lat: number; lng: number; tau: number }[] };

const NM_TO_KM = 1.852;
const EARTH_KM = 6371;

const RADII_NM_AL: Record<number, number> = {
  0: 0, 12: 26, 24: 41, 36: 55, 48: 70, 60: 86, 72: 102, 96: 151, 120: 198,
};
const RADII_NM_EP: Record<number, number> = {
  0: 0, 12: 25, 24: 38, 36: 51, 48: 66, 60: 80, 72: 95, 96: 141, 120: 187,
};

export function coneRadiusNm(basin: string, tau: number): number {
  const table = (basin === 'EP' || basin === 'CP') ? RADII_NM_EP : RADII_NM_AL;
  const taus = Object.keys(table).map(Number).sort((a, b) => a - b);
  if (tau <= taus[0]) return table[taus[0]];
  if (tau >= taus[taus.length - 1]) return table[taus[taus.length - 1]];
  for (let i = 1; i < taus.length; i++) {
    if (tau <= taus[i]) {
      const t0 = taus[i - 1], t1 = taus[i];
      const f = (tau - t0) / (t1 - t0);
      return table[t0] + (table[t1] - table[t0]) * f;
    }
  }
  return table[taus[taus.length - 1]];
}

const toRad = (d: number) => d * Math.PI / 180;
const toDeg = (r: number) => r * 180 / Math.PI;

/** Initial bearing (degrees) from a → b. */
function bearing(a: LL, b: LL): number {
  const φ1 = toRad(a.lat), φ2 = toRad(b.lat);
  const Δλ = toRad(b.lng - a.lng);
  const y = Math.sin(Δλ) * Math.cos(φ2);
  const x = Math.cos(φ1) * Math.sin(φ2) - Math.sin(φ1) * Math.cos(φ2) * Math.cos(Δλ);
  return (toDeg(Math.atan2(y, x)) + 360) % 360;
}

/** Destination point given start, bearing (deg), distance (km). */
function destination(start: LL, brgDeg: number, distKm: number): LL {
  const δ = distKm / EARTH_KM;
  const θ = toRad(brgDeg);
  const φ1 = toRad(start.lat), λ1 = toRad(start.lng);
  const φ2 = Math.asin(Math.sin(φ1) * Math.cos(δ) + Math.cos(φ1) * Math.sin(δ) * Math.cos(θ));
  const λ2 = λ1 + Math.atan2(
    Math.sin(θ) * Math.sin(δ) * Math.cos(φ1),
    Math.cos(δ) - Math.sin(φ1) * Math.sin(φ2),
  );
  return { lat: toDeg(φ2), lng: ((toDeg(λ2) + 540) % 360) - 180 };
}

/**
 * Build a closed cone polygon (lat/lng vertices) by walking right-side offsets
 * forward through the forecast points then left-side offsets back to start.
 * Returns [] when there are no forecast points.
 */
export function buildConePolygon(s: Storm): LL[] {
  if (!s.forecast || s.forecast.length === 0) return [];
  const pts: { ll: LL; tau: number }[] = [{ ll: { lat: s.lat, lng: s.lng }, tau: 0 }];
  for (const p of s.forecast) pts.push({ ll: { lat: p.lat, lng: p.lng }, tau: p.tau });

  const right: LL[] = [];
  const left: LL[] = [];
  for (let i = 0; i < pts.length; i++) {
    const prev = pts[Math.max(0, i - 1)].ll;
    const next = pts[Math.min(pts.length - 1, i + 1)].ll;
    const brg = bearing(prev, next);
    const r = coneRadiusNm(s.basin, pts[i].tau) * NM_TO_KM;
    right.push(destination(pts[i].ll, (brg + 90) % 360, r));
    left.push(destination(pts[i].ll, (brg + 270) % 360, r));
  }
  return [...right, ...left.reverse()];
}
