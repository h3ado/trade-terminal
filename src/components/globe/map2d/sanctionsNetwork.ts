/**
 * Sanctions network: arcs from sanctioning bodies (US/EU/UK/UN) → sanctioned
 * targets. Tier color comes from `SANCTION_TIER` in geopolitics.ts.
 */
import { SANCTIONED_COUNTRIES, SANCTION_TIER } from './geopolitics';

export type SanctionsBody = 'US' | 'EU' | 'UK' | 'UN';

// Origin coordinates (governmental seat).
export const SANCTIONS_BODIES: Record<SanctionsBody, { name: string; lat: number; lng: number }> = {
  US: { name: 'OFAC · Washington',  lat: 38.89, lng:  -77.03 },
  EU: { name: 'EU Council · Brussels', lat: 50.85, lng:    4.35 },
  UK: { name: 'OFSI · London',      lat: 51.50, lng:   -0.13 },
  UN: { name: 'UN Security Council · NYC', lat: 40.75, lng:  -73.97 },
};

// Approximate target capitals for sanctioned states.
const TARGET_COORDS: Record<string, { lat: number; lng: number; capital: string }> = {
  RU: { lat: 55.75, lng:  37.62, capital: 'Moscow' },
  IR: { lat: 35.69, lng:  51.39, capital: 'Tehran' },
  KP: { lat: 39.02, lng: 125.75, capital: 'Pyongyang' },
  SY: { lat: 33.51, lng:  36.28, capital: 'Damascus' },
  CU: { lat: 23.13, lng: -82.38, capital: 'Havana' },
  VE: { lat: 10.48, lng: -66.90, capital: 'Caracas' },
  BY: { lat: 53.90, lng:  27.56, capital: 'Minsk' },
  MM: { lat: 19.74, lng:  96.10, capital: 'Naypyidaw' },
};

// Which bodies sanction which targets (curated; reflects current postings).
const SANCTIONS_MATRIX: Record<string, SanctionsBody[]> = {
  RU: ['US', 'EU', 'UK', 'UN'],
  IR: ['US', 'EU', 'UK', 'UN'],
  KP: ['US', 'EU', 'UK', 'UN'],
  SY: ['US', 'EU', 'UK'],
  CU: ['US'],
  VE: ['US', 'EU', 'UK'],
  BY: ['US', 'EU', 'UK'],
  MM: ['US', 'EU', 'UK'],
};

export const TIER_COLOR: Record<'COMPREHENSIVE' | 'SECTORAL' | 'TARGETED', string> = {
  COMPREHENSIVE: 'hsl(0, 90%, 55%)',
  SECTORAL:      'hsl(28, 95%, 55%)',
  TARGETED:      'hsl(48, 95%, 60%)',
};

export type SanctionLink = {
  id: string;
  body: SanctionsBody;
  bodyName: string;
  fromLat: number; fromLng: number;
  iso: string;
  capital: string;
  toLat: number; toLng: number;
  tier: 'COMPREHENSIVE' | 'SECTORAL' | 'TARGETED';
  color: string;
};

export function buildSanctionLinks(
  liveByIso: Map<string, { count: number }>,
  liveActive: boolean,
): SanctionLink[] {
  const out: SanctionLink[] = [];
  const isos = liveActive
    ? Array.from(new Set([...SANCTIONED_COUNTRIES, ...Array.from(liveByIso.keys())]))
        .filter(iso => TARGET_COORDS[iso])
    : Array.from(SANCTIONED_COUNTRIES);
  for (const iso of isos) {
    const tgt = TARGET_COORDS[iso];
    if (!tgt) continue;
    const tier = SANCTION_TIER[iso] ?? 'TARGETED';
    const bodies = SANCTIONS_MATRIX[iso] ?? ['US'];
    for (const body of bodies) {
      const src = SANCTIONS_BODIES[body];
      out.push({
        id: `${body}-${iso}`,
        body, bodyName: src.name,
        fromLat: src.lat, fromLng: src.lng,
        iso, capital: tgt.capital,
        toLat: tgt.lat, toLng: tgt.lng,
        tier, color: TIER_COLOR[tier],
      });
    }
  }
  return out;
}
