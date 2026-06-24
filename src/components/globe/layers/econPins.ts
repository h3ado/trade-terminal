import { useEffect, useMemo } from 'react';
import * as THREE from 'three';
import type ThreeGlobe from 'three-globe';
import { events as ALL_EVENTS, type EconEvent } from '@/components/macro/EconCalendar';

/**
 * Renders econ-calendar event pins on the globe — central-bank decisions,
 * CPI/NFP/GDP prints — colored by impact and lifted by recency. Pins land at
 * the capital of each event's country. Uses three-globe's `htmlElementsData`
 * so pins are crisp DOM nodes instead of competing with the bubbles slot.
 */

// ── Capital coordinates for every country code that appears in EconCalendar ──
const COUNTRY_LATLNG: Record<string, [number, number]> = {
  US: [38.9, -77.0],     // Washington DC
  EU: [50.85, 4.35],     // Brussels (ECB events also fired here for visualization)
  UK: [51.5, -0.13],     // London
  GB: [51.5, -0.13],
  DE: [52.52, 13.40],    // Berlin
  FR: [48.85, 2.35],
  ES: [40.42, -3.70],
  IT: [41.90, 12.50],
  CH: [46.95, 7.45],
  SE: [59.33, 18.07],
  NO: [59.91, 10.75],
  JP: [35.68, 139.69],
  CN: [39.91, 116.40],
  HK: [22.30, 114.17],
  KR: [37.57, 126.98],
  IN: [28.61, 77.21],
  AU: [-35.28, 149.13],  // Canberra
  NZ: [-41.29, 174.78],
  CA: [45.42, -75.69],   // Ottawa
  MX: [19.43, -99.13],
  BR: [-15.79, -47.88],
  RU: [55.75, 37.62],
  TR: [39.93, 32.86],
  ZA: [-25.75, 28.19],
  SG: [1.35, 103.82],
  TW: [25.04, 121.56],
  ID: [-6.21, 106.85],
  TH: [13.75, 100.50],
  AE: [24.45, 54.39],
  SA: [24.71, 46.68],
};

export type EconPin = {
  id: string;
  lat: number;
  lng: number;
  country: string;
  event: string;
  impact: EconEvent['impact'];
  date: string;
  time: string;
  daysFromNow: number;   // negative = past, 0 = today, positive = upcoming
  forecast: string;
  previous: string;
  actual?: string;
};

const IMPACT_COLOR: Record<EconEvent['impact'], string> = {
  HIGH: '#ef4444',
  MED:  '#f59e0b',
  LOW:  '#64748b',
};
export const ECON_IMPACT_META = IMPACT_COLOR;

function dayDiff(dateStr: string, today: Date): number {
  const [y, m, d] = dateStr.split('-').map(Number);
  const evt = Date.UTC(y, (m ?? 1) - 1, d ?? 1);
  const now = Date.UTC(today.getUTCFullYear(), today.getUTCMonth(), today.getUTCDate());
  return Math.round((evt - now) / 86400000);
}

/**
 * Filter the imported event set to a ±N day window around today and project
 * each event onto its country capital. Skips events whose country we don't map.
 */
export function buildEconPins(
  windowDays = 7,
  today: Date = new Date(),
  filter?: { highOnly?: boolean; cbOnly?: boolean },
): EconPin[] {
  const out: EconPin[] = [];
  for (let i = 0; i < ALL_EVENTS.length; i++) {
    const e = ALL_EVENTS[i];
    const diff = dayDiff(e.date, today);
    if (Math.abs(diff) > windowDays) continue;
    if (filter?.highOnly && e.impact !== 'HIGH') continue;
    if (filter?.cbOnly && !/Interest Rate|FOMC|BOJ|BOC|BoE|ECB|RBA|RBNZ|SNB|PBOC|MPC/i.test(e.event)) continue;
    const c = COUNTRY_LATLNG[e.country];
    if (!c) continue;
    out.push({
      id: `${e.country}-${e.date}-${e.time}-${i}`,
      lat: c[0],
      lng: c[1],
      country: e.country,
      event: e.event,
      impact: e.impact,
      date: e.date,
      time: e.time,
      daysFromNow: diff,
      forecast: e.forecast,
      previous: e.previous,
      actual: e.actual,
    });
  }
  return out;
}

export function useEconPinsLayer(
  globeRef: React.RefObject<ThreeGlobe>,
  pins: EconPin[],
  enabled: boolean,
  opacity: number,
) {
  const data = useMemo(() => (enabled ? pins : []), [enabled, pins]);

  useEffect(() => {
    const g = globeRef.current;
    if (!g) return;
    if (!enabled || data.length === 0) {
      try { (g as any).objectsData([]); } catch { /* noop */ }
      return;
    }

    (g as any)
      .objectsData(data)
      .objectLat((d: EconPin) => d.lat)
      .objectLng((d: EconPin) => d.lng)
      .objectAltitude((d: EconPin) => {
        // Lift upcoming events higher than past events; today sits in the middle.
        if (d.daysFromNow < 0) return 0.02;
        if (d.daysFromNow === 0) return 0.05;
        return 0.03 + Math.min(0.07, d.daysFromNow * 0.008);
      })
      .objectThreeObject((d: EconPin) => {
        const color = new THREE.Color(IMPACT_COLOR[d.impact]);
        const past = d.daysFromNow < 0;
        const today = d.daysFromNow === 0;
        const grp = new THREE.Group();
        // Tag the group + children so raycasts in AdvancedGlobe can map a hit
        // back to the originating pin without sharing data structures.
        grp.userData.econPinId = d.id;
        grp.userData.kind = 'econPin';

        // Vertical stem
        const stemH = 2 + (d.impact === 'HIGH' ? 1 : 0);
        const stemGeom = new THREE.CylinderGeometry(0.08, 0.08, stemH, 6);
        const stemMat = new THREE.MeshBasicMaterial({
          color,
          transparent: true,
          opacity: opacity * (past ? 0.4 : 0.9),
        });
        const stem = new THREE.Mesh(stemGeom, stemMat);
        stem.position.y = stemH / 2;
        grp.add(stem);

        // Sphere head
        const headR = today ? 0.7 : d.impact === 'HIGH' ? 0.55 : 0.4;
        const headGeom = new THREE.SphereGeometry(headR, 14, 14);
        const headMat = new THREE.MeshBasicMaterial({
          color,
          transparent: true,
          opacity: opacity * (past ? 0.4 : 1),
        });
        const head = new THREE.Mesh(headGeom, headMat);
        head.position.y = stemH;
        grp.add(head);

        // Pulse ring for today's events
        if (today) {
          const ringGeom = new THREE.TorusGeometry(headR * 1.8, 0.08, 8, 24);
          const ringMat = new THREE.MeshBasicMaterial({
            color,
            transparent: true,
            opacity: opacity * 0.6,
          });
          const ring = new THREE.Mesh(ringGeom, ringMat);
          ring.position.y = stemH;
          ring.rotation.x = Math.PI / 2;
          grp.add(ring);
        }

        return grp;
      });
  }, [globeRef, data, enabled, opacity]);
}
