import { useEffect, useMemo } from 'react';
import * as THREE from 'three';
import type ThreeGlobe from 'three-globe';
import type { Storm, StormForecastPoint } from '@/hooks/useStorms';

/**
 * Renders active tropical cyclones on the globe via three-globe's
 * `customLayerData` slot. Each storm becomes:
 *   • a pulsing color-coded sphere at the current (or scrubbed) position
 *   • a forecast track (rings stepping out along the predicted path)
 *
 * Time scrubber integration: when `scrubOffsetHours` is non-zero, the eye
 * position is interpolated along the forecast track (great-circle slerp
 * between adjacent forecast points). The eye fades out past the end of the
 * forecast horizon, and dims when scrubbed into the past (no historical
 * track is available from the source).
 */
export const STORM_CAT_META: Record<number, { label: string; color: string }> = {
  [-1]: { label: 'TD',  color: '#9ca3af' },
  [0]:  { label: 'TS',  color: '#38bdf8' },
  [1]:  { label: 'CAT1', color: '#22c55e' },
  [2]:  { label: 'CAT2', color: '#eab308' },
  [3]:  { label: 'CAT3', color: '#f97316' },
  [4]:  { label: 'CAT4', color: '#ef4444' },
  [5]:  { label: 'CAT5', color: '#a21caf' },
};

export function stormColor(cat: number): string {
  return STORM_CAT_META[cat]?.color ?? '#9ca3af';
}

type Renderable =
  | { kind: 'eye'; storm: Storm; lat: number; lng: number; alpha: number; cat: number }
  | { kind: 'fcst'; storm: Storm; lat: number; lng: number; tau: number; passed: boolean }
  | { kind: 'track'; storm: Storm; scrubOffsetHours: number };

/**
 * Spherical linear interpolation between two lat/lng points on a unit sphere.
 * Used so storm eye glides along the great-circle path between forecast
 * points instead of jumping linearly in degrees (which warps near the poles).
 */
function slerpLatLng(
  a: { lat: number; lng: number },
  b: { lat: number; lng: number },
  t: number,
): { lat: number; lng: number } {
  const toRad = Math.PI / 180;
  const toDeg = 180 / Math.PI;
  const ax = Math.cos(a.lat * toRad) * Math.cos(a.lng * toRad);
  const ay = Math.cos(a.lat * toRad) * Math.sin(a.lng * toRad);
  const az = Math.sin(a.lat * toRad);
  const bx = Math.cos(b.lat * toRad) * Math.cos(b.lng * toRad);
  const by = Math.cos(b.lat * toRad) * Math.sin(b.lng * toRad);
  const bz = Math.sin(b.lat * toRad);
  const dot = Math.max(-1, Math.min(1, ax * bx + ay * by + az * bz));
  const omega = Math.acos(dot);
  if (omega < 1e-6) return { lat: a.lat, lng: a.lng };
  const sinO = Math.sin(omega);
  const k0 = Math.sin((1 - t) * omega) / sinO;
  const k1 = Math.sin(t * omega) / sinO;
  const x = k0 * ax + k1 * bx;
  const y = k0 * ay + k1 * by;
  const z = k0 * az + k1 * bz;
  const lat = Math.asin(z) * toDeg;
  const lng = Math.atan2(y, x) * toDeg;
  return { lat, lng };
}

/**
 * Interpolate the storm's position at `tau` hours from observation along
 * its forecast track. Returns null if outside the available horizon.
 */
function interpolateStormAt(
  storm: Storm,
  tau: number,
): { lat: number; lng: number; cat: number } | null {
  // Build sequence: t=0 is current eye, then forecast points by tau.
  const pts: Array<StormForecastPoint & { isNow?: boolean }> = [
    { lat: storm.lat, lng: storm.lng, tau: 0, wind: storm.windKt, isNow: true },
    ...[...storm.forecast].sort((a, b) => a.tau - b.tau),
  ];
  if (tau <= 0) return { lat: storm.lat, lng: storm.lng, cat: storm.category };
  const last = pts[pts.length - 1];
  if (tau > last.tau) return null;
  for (let i = 0; i < pts.length - 1; i++) {
    const a = pts[i];
    const b = pts[i + 1];
    if (tau >= a.tau && tau <= b.tau) {
      const span = b.tau - a.tau || 1;
      const t = (tau - a.tau) / span;
      const { lat, lng } = slerpLatLng(a, b, t);
      // Approximate category: hold current category (NHC forecasts include
      // wind but mapping to Saffir-Simpson here would be lossy).
      return { lat, lng, cat: storm.category };
    }
  }
  return { lat: storm.lat, lng: storm.lng, cat: storm.category };
}

/**
 * Approximate NHC 5-day cone of uncertainty half-width in km, by tau hours.
 * Source: NHC published average track-error bounds, rounded.
 */
function coneHalfWidthKm(tauHours: number): number {
  // Linear interp through known anchors (12h, 24h, 48h, 72h, 96h, 120h)
  const ANCHORS: Array<[number, number]> = [
    [0, 0], [12, 45], [24, 75], [48, 130], [72, 200], [96, 280], [120, 370],
  ];
  if (tauHours <= 0) return 0;
  for (let i = 0; i < ANCHORS.length - 1; i++) {
    const [t0, w0] = ANCHORS[i];
    const [t1, w1] = ANCHORS[i + 1];
    if (tauHours >= t0 && tauHours <= t1) {
      const k = (tauHours - t0) / (t1 - t0);
      return w0 + k * (w1 - w0);
    }
  }
  // Past 120h: extrapolate gently
  return ANCHORS[ANCHORS.length - 1][1] + (tauHours - 120) * 1.5;
}

const EARTH_RADIUS_KM = 6371;
// three-globe uses radius=100 internally for the globe sphere.
const GLOBE_RADIUS_UNITS = 100;
function kmToGlobeUnits(km: number): number {
  return (km / EARTH_RADIUS_KM) * GLOBE_RADIUS_UNITS;
}

/**
 * Build a continuous Line tracing the great-circle forecast path of a storm,
 * densified by slerping between adjacent forecast points. Vertices are
 * emitted in world space so the parent object sits at the globe origin.
 * Track is split into two materials: already-passed segments dimmed, the
 * forward portion drawn brighter — driven by the time scrubber.
 *
 * Also emits a translucent uncertainty cone (NHC 5-day style) as a
 * triangle-strip mesh tangent to the globe surface, widening with tau.
 */
function buildTrackLine(
  g: ThreeGlobe,
  storm: Storm,
  scrubOffsetHours: number,
  opacity: number,
): THREE.Object3D {
  const group = new THREE.Group();
  const sorted = [...storm.forecast].sort((a, b) => a.tau - b.tau);
  const path: Array<{ lat: number; lng: number; tau: number }> = [
    { lat: storm.lat, lng: storm.lng, tau: 0 },
    ...sorted.map(p => ({ lat: p.lat, lng: p.lng, tau: p.tau })),
  ];
  if (path.length < 2) return group;

  const SUBDIV = 12;
  const ALT = 0.013;
  const CONE_ALT = 0.0125; // sit just under the line so it doesn't z-fight
  const passedPts: THREE.Vector3[] = [];
  const futurePts: THREE.Vector3[] = [];
  let prevBucket: 'passed' | 'future' | null = null;

  // Densified centerline samples (kept for cone construction)
  type Sample = { v: THREE.Vector3; tau: number; lat: number; lng: number };
  const samples: Sample[] = [];

  for (let i = 0; i < path.length - 1; i++) {
    const a = path[i];
    const b = path[i + 1];
    for (let s = 0; s <= SUBDIV; s++) {
      if (i > 0 && s === 0) continue;
      const t = s / SUBDIV;
      const tau = a.tau + (b.tau - a.tau) * t;
      const p = slerpLatLng(a, b, t);
      const c = (g as any).getCoords(p.lat, p.lng, ALT);
      const v = new THREE.Vector3(c.x, c.y, c.z);
      samples.push({ v, tau, lat: p.lat, lng: p.lng });
      const bucket: 'passed' | 'future' = tau <= scrubOffsetHours ? 'passed' : 'future';
      if (bucket === 'passed') passedPts.push(v);
      else futurePts.push(v);
      if (prevBucket && prevBucket !== bucket) {
        if (bucket === 'future' && passedPts.length > 0) {
          futurePts.unshift(passedPts[passedPts.length - 1]);
        } else if (bucket === 'passed' && futurePts.length > 0) {
          passedPts.unshift(futurePts[futurePts.length - 1]);
        }
      }
      prevBucket = bucket;
    }
  }

  const color = new THREE.Color(stormColor(storm.category));

  // ── Uncertainty cone ────────────────────────────────────────────────
  // For each centerline sample, build left/right offset points in the local
  // tangent plane, perpendicular to the local heading. Offset distance grows
  // with tau using NHC-shaped widening.
  if (samples.length >= 2) {
    const left: THREE.Vector3[] = [];
    const right: THREE.Vector3[] = [];
    for (let i = 0; i < samples.length; i++) {
      const s = samples[i];
      // Heading vector via central difference (great-circle tangent).
      const prev = samples[Math.max(0, i - 1)];
      const next = samples[Math.min(samples.length - 1, i + 1)];
      const heading = new THREE.Vector3().subVectors(next.v, prev.v);
      if (heading.lengthSq() < 1e-8) continue;
      heading.normalize();
      // Surface normal at this point = direction from globe center.
      const normal = s.v.clone().normalize();
      // Right perpendicular = heading × normal (in tangent plane)
      const rightDir = new THREE.Vector3().crossVectors(heading, normal).normalize();
      const halfWidthUnits = kmToGlobeUnits(coneHalfWidthKm(s.tau));
      // Offset in tangent plane, then re-project back onto sphere of CONE_ALT.
      const targetR = GLOBE_RADIUS_UNITS * (1 + CONE_ALT);
      const lOff = s.v.clone().addScaledVector(rightDir, -halfWidthUnits).setLength(targetR);
      const rOff = s.v.clone().addScaledVector(rightDir,  halfWidthUnits).setLength(targetR);
      left.push(lOff);
      right.push(rOff);
    }
    if (left.length >= 2) {
      // Build triangle strip: alternating left/right vertices.
      const positions: number[] = [];
      for (let i = 0; i < left.length; i++) {
        positions.push(left[i].x,  left[i].y,  left[i].z);
        positions.push(right[i].x, right[i].y, right[i].z);
      }
      const indices: number[] = [];
      for (let i = 0; i < left.length - 1; i++) {
        const a0 = i * 2, a1 = a0 + 1, b0 = a0 + 2, b1 = a0 + 3;
        indices.push(a0, b0, a1);
        indices.push(a1, b0, b1);
      }
      const geom = new THREE.BufferGeometry();
      geom.setAttribute('position', new THREE.Float32BufferAttribute(positions, 3));
      geom.setIndex(indices);
      const mat = new THREE.MeshBasicMaterial({
        color,
        transparent: true,
        opacity: 0.13 * opacity,
        side: THREE.DoubleSide,
        depthWrite: false,
      });
      group.add(new THREE.Mesh(geom, mat));

      // Cone outline (subtle edge so the boundary is legible)
      const outlinePts = [...left, ...right.slice().reverse(), left[0]];
      const outlineGeom = new THREE.BufferGeometry().setFromPoints(outlinePts);
      const outlineMat = new THREE.LineBasicMaterial({
        color,
        transparent: true,
        opacity: 0.35 * opacity,
      });
      group.add(new THREE.Line(outlineGeom, outlineMat));
    }
  }

  // ── Centerline (drawn on top of the cone) ───────────────────────────
  if (futurePts.length >= 2) {
    const geom = new THREE.BufferGeometry().setFromPoints(futurePts);
    const mat = new THREE.LineBasicMaterial({
      color,
      transparent: true,
      opacity: 0.75 * opacity,
    });
    group.add(new THREE.Line(geom, mat));
  }
  if (passedPts.length >= 2) {
    const geom = new THREE.BufferGeometry().setFromPoints(passedPts);
    const mat = new THREE.LineBasicMaterial({
      color,
      transparent: true,
      opacity: 0.22 * opacity,
    });
    group.add(new THREE.Line(geom, mat));
  }
  return group;
}

export function useStormsLayer(
  globeRef: React.RefObject<ThreeGlobe>,
  storms: Storm[],
  enabled: boolean,
  opacity: number,
  scrubOffsetHours = 0,
) {
  const data = useMemo<Renderable[]>(() => {
    if (!enabled) return [];
    const out: Renderable[] = [];
    for (const s of storms) {
      // Eye: interpolated along forecast track when scrubbing forward.
      // When scrubbing backward, hold at observed position but dim it (we
      // don't have historical track data from NHC).
      let eyeLat = s.lat;
      let eyeLng = s.lng;
      let alpha = 1;
      let cat = s.category;
      if (scrubOffsetHours > 0) {
        const interp = interpolateStormAt(s, scrubOffsetHours);
        if (!interp) {
          // Past forecast horizon — fade to zero so storm disappears.
          alpha = 0;
        } else {
          eyeLat = interp.lat;
          eyeLng = interp.lng;
          cat = interp.cat;
        }
      } else if (scrubOffsetHours < 0) {
        // Before observation time: dim to show this is extrapolated/unknown.
        alpha = 0.45;
      }
      if (alpha > 0.01) {
        out.push({ kind: 'eye', storm: s, lat: eyeLat, lng: eyeLng, alpha, cat });
      }
      // Continuous polyline for the forecast track (great-circle slerp segments)
      if (s.forecast.length > 0) {
        out.push({ kind: 'track', storm: s, scrubOffsetHours });
      }
      // Forecast track waypoint dots
      for (const p of s.forecast) {
        out.push({
          kind: 'fcst',
          storm: s,
          lat: p.lat,
          lng: p.lng,
          tau: p.tau,
          passed: scrubOffsetHours > p.tau,
        });
      }
    }
    return out;
  }, [storms, enabled, scrubOffsetHours]);

  useEffect(() => {
    const g = globeRef.current;
    if (!g) return;
    if (!enabled || data.length === 0) {
      try { (g as any).customLayerData([]); } catch { /* noop */ }
      return;
    }

    (g as any)
      .customLayerData(data)
      .customLayerLat((d: Renderable) => d.kind === 'track' ? 0 : d.lat)
      .customLayerLng((d: Renderable) => d.kind === 'track' ? 0 : d.lng)
      .customLayerAltitude(() => 0.012)
      .customThreeObject((d: Renderable) => {
        if (d.kind === 'eye') {
          const cat = Math.max(-1, d.cat);
          const radius = 1.2 + Math.max(0, cat) * 0.55;
          const geom = new THREE.SphereGeometry(radius, 18, 18);
          const mat = new THREE.MeshBasicMaterial({
            color: new THREE.Color(stormColor(cat)),
            transparent: true,
            opacity: 0.9 * opacity * d.alpha,
          });
          const mesh = new THREE.Mesh(geom, mat);
          if (cat >= 1) {
            const ringGeom = new THREE.TorusGeometry(radius * 1.6, radius * 0.12, 8, 32);
            const ringMat = new THREE.MeshBasicMaterial({
              color: new THREE.Color(stormColor(cat)),
              transparent: true,
              opacity: 0.45 * opacity * d.alpha,
            });
            const ring = new THREE.Mesh(ringGeom, ringMat);
            ring.rotation.x = Math.PI / 2;
            mesh.add(ring);
          }
          (mesh as any).__stormId = d.storm.id;
          return mesh;
        }
        if (d.kind === 'fcst') {
          // Forecast point — small dot, fades with tau and dims further once
          // the scrubber has passed it.
          const fade = Math.max(0.18, 1 - d.tau / 120);
          const passedFade = d.passed ? 0.35 : 1;
          const geom = new THREE.SphereGeometry(0.45, 10, 10);
          const mat = new THREE.MeshBasicMaterial({
            color: new THREE.Color(stormColor(d.storm.category)),
            transparent: true,
            opacity: 0.55 * fade * passedFade * opacity,
          });
          return new THREE.Mesh(geom, mat);
        }
        // d.kind === 'track' — continuous polyline along forecast path.
        // Vertices are pre-projected into world space (slerp-densified between
        // forecast points so the line hugs the great-circle), then the parent
        // mesh sits at the globe origin so coords are absolute.
        return buildTrackLine(g as any, d.storm, d.scrubOffsetHours, opacity);
      })
      .customThreeObjectUpdate((obj: THREE.Object3D, d: Renderable) => {
        if (d.kind === 'track') {
          obj.position.set(0, 0, 0);
          return;
        }
        const coords = (g as any).getCoords(d.lat, d.lng, 0.012);
        obj.position.set(coords.x, coords.y, coords.z);
      });
  }, [globeRef, data, enabled, opacity]);
}
