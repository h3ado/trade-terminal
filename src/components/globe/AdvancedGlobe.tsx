import { useEffect, useMemo, useRef, useState, Suspense } from 'react';
import { Canvas, useFrame, useThree, extend, type Object3DNode } from '@react-three/fiber';
import { OrbitControls, Stars } from '@react-three/drei';
import ThreeGlobe from 'three-globe';
import * as THREE from 'three';
import { Layers, X, RotateCw, Maximize2, Minimize2, Clock } from 'lucide-react';
import { useUserPreference } from '@/hooks/useUserPreference';
import { useFXRates, type FXRate } from '@/hooks/useFXRates';
import { useIndices, type IndexQuote } from '@/hooks/useIndices';
import { useFXArcsLayer, FX_CORRIDORS, FX_HUBS } from './layers/fxArcs';
import { useFXChoroplethLayer } from './layers/fxChoropleth';
import { useBubblesLayer } from './layers/bubbles';
import { useMacroChoroplethLayer, MACRO_METRIC_META, type MacroMetric } from './layers/macroChoropleth';
import { useChokepointsLayer, useShippingArcsLayer, CHOKEPOINTS } from './layers/shipping';
import { useTankersLayer } from './layers/tankers';
import { useCommoditySitesLayer, COMMODITY_TYPE_META, COMMODITY_SITES, type CommodityType } from './layers/commodities';
import { useStormsLayer, STORM_CAT_META, stormColor } from './layers/storms';
import { useEconPinsLayer, buildEconPins, ECON_IMPACT_META, type EconPin } from './layers/econPins';
import { useAISVessels } from '@/hooks/useAISVessels';
import { useStorms } from '@/hooks/useStorms';
import { GlobeErrorBoundary } from './GlobeErrorBoundary';
import { EconPinDetailDialog } from './EconPinDetailDialog';
import { TimeScrubber } from './TimeScrubber';
import { DEMO_STORM, DEMO_STORM_EVENT } from './demoStorm';
import { useSavedViews, buildSavedView, type SavedView } from '@/hooks/useSavedViews';
import { toast } from 'sonner';
import { Map2D } from './map2d/Map2D';

// ─── Saved Views events (CLI ↔ globe wiring) ──────────────────────────
export const SAVE_VIEW_EVENT = 'lovable:globe-save-view';
export const LOAD_VIEW_EVENT = 'lovable:globe-load-view';
export const LIST_VIEWS_EVENT = 'lovable:globe-list-views';
const DEV_DEMO_STORM = import.meta.env.DEV;
/** CLI helpers: dispatch a SAVE/LOAD/VIEWS request that AdvancedGlobe handles. */
export function saveGlobeView(key: string) {
  window.dispatchEvent(new CustomEvent(SAVE_VIEW_EVENT, { detail: { key } }));
}
export function loadGlobeView(key: string) {
  window.dispatchEvent(new CustomEvent(LOAD_VIEW_EVENT, { detail: { key } }));
}
export function listGlobeViews() {
  window.dispatchEvent(new CustomEvent(LIST_VIEWS_EVENT));
}

// Register three-globe as a JSX element
extend({ ThreeGlobe });
declare module '@react-three/fiber' {
  interface ThreeElements {
    threeGlobe: Object3DNode<ThreeGlobe, typeof ThreeGlobe>;
  }
}

const COUNTRIES_URL =
  'https://cdn.jsdelivr.net/npm/three-globe@2.31.0/example/country-polygons/ne_110m_admin_0_countries.geojson';

export type GlobeMarket = {
  name: string;
  abbr: string;
  lat: number;
  lng: number;
  currency: string;
  index: string;
  tz: string;
  status?: 'OPEN' | 'CLOSED' | 'PRE' | 'AFTER';
};

type ThemeKey = 'midnight' | 'dark' | 'topo' | 'contrast';
const THEMES: Record<ThemeKey, { bg: string; ocean: string; land: string; atmos: string }> = {
  midnight: { bg: '#04060d', ocean: '#0a1228', land: '#1a2540', atmos: '#3a7bd5' },
  dark:     { bg: '#0a0e14', ocean: '#0d1620', land: '#1f2a36', atmos: '#ff8c1a' },
  topo:     { bg: '#06120f', ocean: '#0a1f1a', land: '#2d4a32', atmos: '#88cc66' },
  contrast: { bg: '#000000', ocean: '#080808', land: '#3a3a3a', atmos: '#ffd700' },
};

type LayerState = {
  exchanges: { on: boolean; opacity: number };
  arcs: { on: boolean; opacity: number };
  graticule: { on: boolean; opacity: number };
  terminator: { on: boolean; opacity: number };
  atmosphere: { on: boolean; opacity: number };
  countries: { on: boolean; opacity: number };
  labels: { on: boolean; opacity: number };
  stars: { on: boolean; opacity: number };
  fxFlows: { on: boolean; opacity: number };
  fxChoro: { on: boolean; opacity: number };
  bubbles: { on: boolean; opacity: number };
  macroChoro: { on: boolean; opacity: number };
  chokepoints: { on: boolean; opacity: number };
  shipRoutes: { on: boolean; opacity: number };
  tankers: { on: boolean; opacity: number };
  commodities: { on: boolean; opacity: number };
  storms: { on: boolean; opacity: number };
  econPins: { on: boolean; opacity: number };
};

const DEFAULT_LAYERS: LayerState = {
  exchanges:  { on: true,  opacity: 1 },
  arcs:       { on: false, opacity: 0.6 },
  graticule:  { on: false, opacity: 0.3 },
  terminator: { on: true,  opacity: 0.55 },
  atmosphere: { on: true,  opacity: 0.7 },
  countries:  { on: true,  opacity: 0.85 },
  labels:     { on: true,  opacity: 1 },
  stars:      { on: true,  opacity: 0.5 },
  fxFlows:    { on: false, opacity: 0.85 },
  fxChoro:    { on: false, opacity: 0.7 },
  bubbles:    { on: false, opacity: 1 },
  macroChoro: { on: false, opacity: 0.75 },
  chokepoints:{ on: false, opacity: 1 },
  shipRoutes: { on: false, opacity: 0.85 },
  tankers:    { on: false, opacity: 0.9 },
  commodities:{ on: false, opacity: 0.85 },
  storms:     { on: false, opacity: 1 },
  econPins:   { on: false, opacity: 1 },
};


/**
 * Apply a preset layer combo via a window event so any open globe (mini or full) can react.
 * Dispatched by the CLI (e.g. `MAP FX`).
 */
export type GlobePreset = 'fx' | 'idx' | 'macro' | 'shipping' | 'ais' | 'commodities' | 'storms' | 'econ' | 'default';
export const GLOBE_PRESET_EVENT = 'lovable:globe-preset';
export function applyGlobePreset(preset: GlobePreset, opts?: { metric?: MacroMetric }) {
  window.dispatchEvent(new CustomEvent(GLOBE_PRESET_EVENT, { detail: { preset, ...opts } }));
}
function presetToLayers(preset: GlobePreset, current: LayerState): LayerState {
  if (preset === 'fx') {
    return {
      ...current,
      exchanges:  { ...current.exchanges,  on: false },
      arcs:       { ...current.arcs,       on: false },
      labels:     { ...current.labels,     on: false },
      countries:  { ...current.countries,  on: true },
      terminator: { ...current.terminator, on: true },
      atmosphere: { ...current.atmosphere, on: true },
      fxFlows:    { ...current.fxFlows,    on: true },
      fxChoro:    { ...current.fxChoro,    on: true },
      bubbles:    { ...current.bubbles,    on: false },
      macroChoro: { ...current.macroChoro, on: false },
    };
  }
  if (preset === 'idx') {
    return {
      ...current,
      exchanges:  { ...current.exchanges,  on: true },
      arcs:       { ...current.arcs,       on: false },
      labels:     { ...current.labels,     on: true },
      countries:  { ...current.countries,  on: true },
      terminator: { ...current.terminator, on: true },
      atmosphere: { ...current.atmosphere, on: true },
      fxFlows:    { ...current.fxFlows,    on: false },
      fxChoro:    { ...current.fxChoro,    on: false },
      bubbles:    { ...current.bubbles,    on: true },
      macroChoro: { ...current.macroChoro, on: false },
    };
  }
  if (preset === 'macro') {
    return {
      ...current,
      exchanges:  { ...current.exchanges,  on: false },
      arcs:       { ...current.arcs,       on: false },
      labels:     { ...current.labels,     on: false },
      countries:  { ...current.countries,  on: true },
      terminator: { ...current.terminator, on: true },
      atmosphere: { ...current.atmosphere, on: true },
      fxFlows:    { ...current.fxFlows,    on: false },
      fxChoro:    { ...current.fxChoro,    on: false },
      bubbles:    { ...current.bubbles,    on: false },
      macroChoro: { ...current.macroChoro, on: true },
      chokepoints:{ ...current.chokepoints,on: false },
      shipRoutes: { ...current.shipRoutes, on: false },
    };
  }
  if (preset === 'shipping') {
    return {
      ...current,
      exchanges:  { ...current.exchanges,  on: false },
      arcs:       { ...current.arcs,       on: false },
      labels:     { ...current.labels,     on: false },
      countries:  { ...current.countries,  on: true },
      terminator: { ...current.terminator, on: true },
      atmosphere: { ...current.atmosphere, on: true },
      fxFlows:    { ...current.fxFlows,    on: false },
      fxChoro:    { ...current.fxChoro,    on: false },
      bubbles:    { ...current.bubbles,    on: false },
      macroChoro: { ...current.macroChoro, on: false },
      chokepoints:{ ...current.chokepoints,on: true  },
      shipRoutes: { ...current.shipRoutes, on: true  },
    };
  }
  if (preset === 'ais') {
    return {
      ...current,
      exchanges:  { ...current.exchanges,  on: false },
      arcs:       { ...current.arcs,       on: false },
      labels:     { ...current.labels,     on: false },
      countries:  { ...current.countries,  on: true },
      terminator: { ...current.terminator, on: true },
      atmosphere: { ...current.atmosphere, on: true },
      fxFlows:    { ...current.fxFlows,    on: false },
      fxChoro:    { ...current.fxChoro,    on: false },
      bubbles:    { ...current.bubbles,    on: false },
      macroChoro: { ...current.macroChoro, on: false },
      chokepoints:{ ...current.chokepoints,on: true  },
      shipRoutes: { ...current.shipRoutes, on: false },
      tankers:    { ...current.tankers,    on: true  },
    };
  }
  if (preset === 'commodities') {
    return {
      ...current,
      exchanges:  { ...current.exchanges,  on: false },
      arcs:       { ...current.arcs,       on: false },
      labels:     { ...current.labels,     on: false },
      countries:  { ...current.countries,  on: true },
      terminator: { ...current.terminator, on: true },
      atmosphere: { ...current.atmosphere, on: true },
      fxFlows:    { ...current.fxFlows,    on: false },
      fxChoro:    { ...current.fxChoro,    on: false },
      bubbles:    { ...current.bubbles,    on: false },
      macroChoro: { ...current.macroChoro, on: false },
      chokepoints:{ ...current.chokepoints,on: true  },
      shipRoutes: { ...current.shipRoutes, on: true  },
      tankers:    { ...current.tankers,    on: false },
      commodities:{ ...current.commodities,on: true  },
    };
  }
  if (preset === 'storms') {
    return {
      ...current,
      exchanges:  { ...current.exchanges,  on: false },
      arcs:       { ...current.arcs,       on: false },
      labels:     { ...current.labels,     on: false },
      countries:  { ...current.countries,  on: true },
      terminator: { ...current.terminator, on: true },
      atmosphere: { ...current.atmosphere, on: true },
      fxFlows:    { ...current.fxFlows,    on: false },
      fxChoro:    { ...current.fxChoro,    on: false },
      bubbles:    { ...current.bubbles,    on: false },
      macroChoro: { ...current.macroChoro, on: false },
      chokepoints:{ ...current.chokepoints,on: false },
      shipRoutes: { ...current.shipRoutes, on: false },
      tankers:    { ...current.tankers,    on: false },
      commodities:{ ...current.commodities,on: false },
      storms:     { ...current.storms,     on: true  },
    };
  }
  if (preset === 'econ') {
    return {
      ...current,
      exchanges:  { ...current.exchanges,  on: false },
      arcs:       { ...current.arcs,       on: false },
      labels:     { ...current.labels,     on: false },
      countries:  { ...current.countries,  on: true },
      terminator: { ...current.terminator, on: true },
      atmosphere: { ...current.atmosphere, on: true },
      fxFlows:    { ...current.fxFlows,    on: false },
      fxChoro:    { ...current.fxChoro,    on: false },
      bubbles:    { ...current.bubbles,    on: false },
      macroChoro: { ...current.macroChoro, on: false },
      chokepoints:{ ...current.chokepoints,on: false },
      shipRoutes: { ...current.shipRoutes, on: false },
      tankers:    { ...current.tankers,    on: false },
      commodities:{ ...current.commodities,on: false },
      storms:     { ...current.storms,     on: false },
      econPins:   { ...current.econPins,   on: true  },
    };
  }
  return DEFAULT_LAYERS;
}

// ─── Terminator: day/night shadow as a transparent polygon ─────────────
function computeTerminator(now: Date) {
  const dayOfYear = Math.floor((now.getTime() - Date.UTC(now.getUTCFullYear(), 0, 0)) / 86400000);
  const decl = 23.44 * Math.sin((2 * Math.PI / 365) * (dayOfYear - 81)); // degrees
  const utcH = now.getUTCHours() + now.getUTCMinutes() / 60 + now.getUTCSeconds() / 3600;
  const sunLng = -((utcH / 24) * 360 - 180);
  // Build a band of points along the terminator: lat where cos(h) = -tan(decl)*tan(lat) → boundary
  const pts: [number, number][] = [];
  const declR = (decl * Math.PI) / 180;
  for (let lng = -180; lng <= 180; lng += 2) {
    const h = ((lng - sunLng) * Math.PI) / 180; // hour angle
    const tanLat = -Math.cos(h) / Math.tan(declR || 1e-6);
    const lat = (Math.atan(tanLat) * 180) / Math.PI;
    pts.push([lng, lat]);
  }
  // Determine night side: at the antisolar longitude, sun altitude is negative everywhere along same lng
  // Build a polygon covering the night hemisphere.
  const nightPolar = decl > 0 ? -90 : 90; // pole that's in night
  const nightPoly: [number, number][] = [];
  pts.forEach(p => nightPoly.push(p));
  nightPoly.push([180, nightPolar]);
  nightPoly.push([-180, nightPolar]);
  nightPoly.push(pts[0]);
  return { polygon: nightPoly, sunLng, decl };
}

// ─── Globe object (imperative; three-globe is not declarative) ─────────
function GlobeObject({
  markets,
  layers,
  theme,
  countriesData,
  selected,
  hovered,
  onMarkerClick,
  onMarkerHover,
  tick,
  fxRates,
  hoveredCorridor,
  indicesByAbbr,
  macroMetric,
  hoveredChokepoint,
  vessels,
  storms,
  econPins,
  onEconPinClick,
  scrubbedNowMs,
}: {
  markets: GlobeMarket[];
  layers: LayerState;
  theme: ThemeKey;
  countriesData: any | null;
  selected: number | null;
  hovered: number | null;
  onMarkerClick: (i: number | null) => void;
  onMarkerHover: (i: number | null) => void;
  tick: number;
  fxRates: FXRate[];
  hoveredCorridor: string | null;
  indicesByAbbr: Record<string, IndexQuote>;
  macroMetric: MacroMetric;
  hoveredChokepoint: string | null;
  vessels: import('@/hooks/useAISVessels').Vessel[];
  storms: import('@/hooks/useStorms').Storm[];
  econPins: EconPin[];
  onEconPinClick: (id: string) => void;
  scrubbedNowMs: number;
}) {
  const ref = useRef<ThreeGlobe>(null!);
  const palette = THEMES[theme];

  // Init globe basics
  useEffect(() => {
    const g = ref.current;
    if (!g) return;
    (g as any)
      .showAtmosphere(layers.atmosphere.on)
      .atmosphereColor(palette.atmos)
      .atmosphereAltitude(0.18)
      .showGraticules(layers.graticule.on);
    // Solid ocean color material
    const mat = (g as any).globeMaterial() as THREE.MeshPhongMaterial;
    mat.color = new THREE.Color(palette.ocean);
    mat.emissive = new THREE.Color(palette.ocean);
    mat.emissiveIntensity = 0.15;
    mat.shininess = 6;
  }, [theme, layers.atmosphere.on, layers.graticule.on, palette]);

  // Countries layer
  useEffect(() => {
    const g = ref.current;
    if (!g) return;
    if (!layers.countries.on || !countriesData) {
      (g as any).polygonsData([]);
      return;
    }
    (g as any)
      .polygonsData(countriesData.features)
      .polygonAltitude(0.006)
      .polygonCapColor(() => `${palette.land}${Math.round(layers.countries.opacity * 255).toString(16).padStart(2, '0')}`)
      .polygonSideColor(() => 'rgba(0,0,0,0.4)')
      .polygonStrokeColor(() => 'rgba(255,255,255,0.18)');
  }, [countriesData, layers.countries.on, layers.countries.opacity, palette]);

  // Exchange markers (points + labels)
  useEffect(() => {
    const g = ref.current;
    if (!g) return;
    if (!layers.exchanges.on) {
      (g as any).pointsData([]).labelsData([]);
      return;
    }
    const colorFor = (m: GlobeMarket) => {
      switch (m.status) {
        case 'OPEN': return '#22c55e';
        case 'PRE':
        case 'AFTER': return '#ff8c1a';
        default: return '#ef4444';
      }
    };
    (g as any)
      .pointsData(markets)
      .pointLat((m: GlobeMarket) => m.lat)
      .pointLng((m: GlobeMarket) => m.lng)
      .pointColor((m: GlobeMarket) => colorFor(m))
      .pointAltitude((_: GlobeMarket, i: number) =>
        i === selected ? 0.08 : i === hovered ? 0.05 : 0.015,
      )
      .pointRadius(0.42)
      .pointsMerge(false);

    if (layers.labels.on) {
      (g as any)
        .labelsData(markets)
        .labelLat((m: GlobeMarket) => m.lat)
        .labelLng((m: GlobeMarket) => m.lng)
        .labelText((m: GlobeMarket) => m.abbr)
        .labelSize(0.42)
        .labelDotRadius(0)
        .labelColor(() => `rgba(255,255,255,${layers.labels.opacity})`)
        .labelResolution(2)
        .labelAltitude(0.02);
    } else {
      (g as any).labelsData([]);
    }
  }, [markets, selected, hovered, layers.exchanges.on, layers.labels.on, layers.labels.opacity, tick]);

  // Arcs between open markets — only when FX flows AND shipping routes are OFF (they share arcsData).
  useEffect(() => {
    const g = ref.current;
    if (!g) return;
    if (!layers.arcs.on || layers.fxFlows.on || layers.shipRoutes.on) {
      try { (g as any).arcsData([]); } catch { /* noop */ }
      return;
    }
    const open = markets.filter(m => m.status === 'OPEN');
    const arcs: any[] = [];
    for (let i = 0; i < open.length; i++) {
      for (let j = i + 1; j < Math.min(open.length, i + 3); j++) {
        arcs.push({
          startLat: open[i].lat, startLng: open[i].lng,
          endLat: open[j].lat, endLng: open[j].lng,
          color: ['#ff8c1a', '#22c55e'],
        });
      }
    }
    (g as any)
      .arcsData(arcs)
      .arcStartLat((d: any) => d.startLat)
      .arcStartLng((d: any) => d.startLng)
      .arcEndLat((d: any) => d.endLat)
      .arcEndLng((d: any) => d.endLng)
      .arcColor((d: any) => d.color)
      .arcStroke(0.3)
      .arcAltitudeAutoScale(0.4)
      .arcDashLength(0.5)
      .arcDashGap(0.3)
      .arcDashAnimateTime(3000)
      .arcsTransitionDuration(0);
  }, [markets, layers.arcs.on, layers.fxFlows.on, layers.shipRoutes.on, tick]);

  // FX flow arcs (Phase 2 — overrides open-market arcs when on; yields to shipping when shipping on)
  useFXArcsLayer(ref, fxRates, layers.fxFlows.on && !layers.shipRoutes.on, layers.fxFlows.opacity, hoveredCorridor);

  // Shipping arcs (Phase 3 — top priority on arcsData when shipRoutes is on)
  useShippingArcsLayer(ref, layers.shipRoutes.on, layers.shipRoutes.opacity);

  // Maritime chokepoints (rings layer — independent of arcs)
  useChokepointsLayer(ref, layers.chokepoints.on, hoveredChokepoint);

  // Live AIS vessels — hex-bin density layer (independent of arcs/rings)
  useTankersLayer(ref, vessels, layers.tankers.on, layers.tankers.opacity);

  // Commodity production sites — bubbles via customLayerData
  // (storms wins when both are on, since they share customLayerData)
  useCommoditySitesLayer(ref, layers.commodities.on && !layers.storms.on, layers.commodities.opacity, null);

  // Active tropical storms — eyes + forecast tracks via customLayerData.
  // Eye position is interpolated along the forecast track based on the time
  // scrubber offset (derived from scrubbedNowMs), so storms march along
  // their predicted paths as the virtual clock advances.
  useStormsLayer(
    ref,
    storms,
    layers.storms.on,
    layers.storms.opacity,
    (scrubbedNowMs - Date.now()) / 3_600_000,
  );

  // Econ calendar pins — own slot via objectsData (independent of arcs/rings/custom)
  useEconPinsLayer(ref, econPins, layers.econPins.on, layers.econPins.opacity);

  // FX choropleth — recolors the existing country polygons when on
  useFXChoroplethLayer(ref, countriesData, fxRates, layers.fxChoro.on && layers.countries.on && !layers.macroChoro.on, layers.fxChoro.opacity);

  // Macro choropleth — wins over FX choropleth when both on
  useMacroChoroplethLayer(ref, countriesData, macroMetric, layers.macroChoro.on && layers.countries.on, layers.macroChoro.opacity);

  // Bubbles layer — overrides default exchange points with mcap-sized + %-colored bubbles
  useBubblesLayer(ref, markets, indicesByAbbr, layers.bubbles.on && layers.exchanges.on, selected, hovered);

  // Terminator polygon (night side) — driven by scrubbedNowMs so the time
  // scrubber animates day/night sweep across the globe.
  useEffect(() => {
    const g = ref.current;
    if (!g) return;
    if (!layers.terminator.on) {
      (g as any).pathsData([]);
      return;
    }
    const { polygon } = computeTerminator(new Date(scrubbedNowMs));
    (g as any)
      .pathsData([polygon])
      .pathPoints((d: any) => d)
      .pathPointLat((p: [number, number]) => p[1])
      .pathPointLng((p: [number, number]) => p[0])
      .pathColor(() => `rgba(0, 8, 24, ${layers.terminator.opacity})`)
      .pathStroke(2)
      .pathPointAlt(0.005);
  }, [layers.terminator.on, layers.terminator.opacity, scrubbedNowMs]);

  // Slow auto-rotate when nothing selected
  useFrame((_, dt) => {
    if (!ref.current) return;
    if (selected == null && hovered == null) {
      ref.current.rotation.y += dt * 0.04;
    }
  });

  // Click / hover via raycast on points
  const { camera, gl, scene } = useThree();
  useEffect(() => {
    const ray = new THREE.Raycaster();
    const ndc = new THREE.Vector2();
    const handle = (ev: PointerEvent, kind: 'click' | 'move') => {
      const rect = (gl.domElement as HTMLCanvasElement).getBoundingClientRect();
      ndc.x = ((ev.clientX - rect.left) / rect.width) * 2 - 1;
      ndc.y = -((ev.clientY - rect.top) / rect.height) * 2 + 1;
      ray.setFromCamera(ndc, camera);
      const hits = ray.intersectObject(ref.current, true);

      // Econ pin raycast — walk parent chain to find a tagged group.
      if (kind === 'click' && layers.econPins.on) {
        for (const h of hits) {
          let obj: THREE.Object3D | null = h.object;
          while (obj) {
            const id = (obj.userData as any)?.econPinId as string | undefined;
            if (id) {
              onEconPinClick(id);
              return;
            }
            obj = obj.parent;
          }
        }
      }

      // three-globe stores point user data on instanced meshes; fall back to closest-by-position
      let best: { i: number; d: number } | null = null;
      const camWorldPos = new THREE.Vector3();
      const m = new THREE.Vector3();
      markets.forEach((mk, i) => {
        // approximate marker world position (radius ~100 default)
        const phi = (90 - mk.lat) * (Math.PI / 180);
        const theta = (mk.lng + 180) * (Math.PI / 180);
        const r = 100 * 1.02;
        m.set(
          -r * Math.sin(phi) * Math.cos(theta),
          r * Math.cos(phi),
          r * Math.sin(phi) * Math.sin(theta),
        ).applyMatrix4(ref.current.matrixWorld);
        // project to screen
        const projected = m.clone().project(camera);
        const dx = projected.x - ndc.x;
        const dy = projected.y - ndc.y;
        const d = Math.hypot(dx, dy);
        // also check it's on near side
        camera.getWorldPosition(camWorldPos);
        const facing = m.clone().sub(camWorldPos).normalize().dot(
          new THREE.Vector3().subVectors(new THREE.Vector3(0, 0, 0), camWorldPos).normalize(),
        );
        if (facing < 0) return;
        if (d < 0.04 && (!best || d < best.d)) best = { i, d };
      });
      if (kind === 'click') onMarkerClick(best ? best.i : null);
      else onMarkerHover(best ? best.i : null);
    };
    const click = (e: PointerEvent) => handle(e, 'click');
    const move = (e: PointerEvent) => handle(e, 'move');
    gl.domElement.addEventListener('click', click);
    gl.domElement.addEventListener('pointermove', move);
    return () => {
      gl.domElement.removeEventListener('click', click);
      gl.domElement.removeEventListener('pointermove', move);
    };
  }, [camera, gl, markets, onMarkerClick, onMarkerHover, onEconPinClick, layers.econPins.on, scene]);

  return <threeGlobe ref={ref as any} />;
}

// ─── Layer drawer ─────────────────────────────────────────────────────
const LAYER_GROUPS: { title: string; keys: (keyof LayerState)[] }[] = [
  { title: 'MARKETS',     keys: ['exchanges', 'bubbles', 'arcs', 'labels'] },
  { title: 'FX',          keys: ['fxFlows', 'fxChoro'] },
  { title: 'MACRO',       keys: ['macroChoro'] },
  { title: 'SHIPPING',    keys: ['chokepoints', 'shipRoutes', 'tankers'] },
  { title: 'COMMODITIES', keys: ['commodities'] },
  { title: 'WEATHER',     keys: ['storms'] },
  { title: 'CALENDAR',    keys: ['econPins'] },
  { title: 'GEOGRAPHY',   keys: ['countries', 'graticule'] },
  { title: 'ENVIRONMENT', keys: ['terminator', 'atmosphere', 'stars'] },
];

const LAYER_META: Record<keyof LayerState, { label: string; color: string }> = {
  exchanges:  { label: 'Exchanges',      color: 'hsl(33,100%,55%)' },
  arcs:       { label: 'Open Arcs',      color: 'hsl(33,100%,55%)' },
  labels:     { label: 'Tickers',        color: 'hsl(33,100%,55%)' },
  fxFlows:    { label: 'FX Flow Arcs',   color: 'hsl(142,71%,45%)' },
  fxChoro:    { label: 'FX Heat (vs USD)', color: 'hsl(142,71%,45%)' },
  bubbles:    { label: 'Index Bubbles',  color: 'hsl(142,71%,45%)' },
  macroChoro: { label: 'Macro Heat',     color: 'hsl(280,65%,60%)' },
  chokepoints:{ label: 'Chokepoints',    color: 'hsl(195,90%,60%)' },
  shipRoutes: { label: 'Trade Routes',   color: 'hsl(195,90%,60%)' },
  tankers:    { label: 'Live AIS Vessels', color: 'hsl(28,95%,60%)' },
  commodities:{ label: 'Commodity Sites', color: 'hsl(48,95%,55%)' },
  storms:     { label: 'Tropical Storms', color: 'hsl(0,85%,60%)' },
  econPins:   { label: 'Econ Calendar',  color: 'hsl(15,90%,60%)' },
  countries:  { label: 'Land Polygons',  color: 'hsl(210,40%,60%)' },
  graticule:  { label: 'Graticule',      color: 'hsl(210,40%,60%)' },
  terminator: { label: 'Day / Night',    color: 'hsl(225,60%,70%)' },
  atmosphere: { label: 'Atmosphere',     color: 'hsl(225,60%,70%)' },
  stars:      { label: 'Star Field',     color: 'hsl(225,60%,70%)' },
};

function LayerDrawer({
  layers,
  setLayers,
  theme,
  setTheme,
  onClose,
  onReset,
  econHighOnly,
  setEconHighOnly,
  econCBOnly,
  setEconCBOnly,
  views,
  onSaveSlot,
  onLoadView,
  onRemoveView,
}: {
  layers: LayerState;
  setLayers: (l: LayerState) => void;
  theme: ThemeKey;
  setTheme: (t: ThemeKey) => void;
  onClose: () => void;
  onReset: () => void;
  econHighOnly: boolean;
  setEconHighOnly: (b: boolean) => void;
  econCBOnly: boolean;
  setEconCBOnly: (b: boolean) => void;
  views: SavedView[];
  onSaveSlot: (slot: number) => void;
  onLoadView: (id: string) => void;
  onRemoveView: (id: string) => void;
}) {
  const update = <K extends keyof LayerState>(k: K, patch: Partial<LayerState[K]>) =>
    setLayers({ ...layers, [k]: { ...layers[k], ...patch } });

  return (
    <div className="absolute top-2 right-2 z-30 w-60 bg-surface-deep/95 backdrop-blur border border-accent/40 shadow-2xl font-mono text-foreground">
      <div className="flex items-center justify-between px-2 py-1.5 bg-surface-elevated border-b border-border">
        <div className="flex items-center gap-1.5">
          <Layers className="w-3 h-3 text-accent" />
          <span className="text-[10px] font-bold uppercase">Layers</span>
        </div>
        <div className="flex items-center gap-0.5">
          <button onClick={onReset} title="Reset" className="p-1 hover:bg-accent/10"><RotateCw className="w-2.5 h-2.5 text-muted-foreground" /></button>
          <button onClick={onClose} title="Close" className="p-1 hover:bg-accent/10"><X className="w-2.5 h-2.5 text-muted-foreground" /></button>
        </div>
      </div>

      {/* Saved Views — numbered slots 1-9 + named list */}
      <div className="px-2 py-2 border-b border-border">
        <div className="flex items-center justify-between mb-1">
          <span className="text-[8px] uppercase text-muted-foreground">Saved Views</span>
          <span className="text-[7px] uppercase text-muted-foreground/60 tracking-wider">CLI · SAVE/LOAD</span>
        </div>
        <div className="grid grid-cols-9 gap-0.5 mb-1.5">
          {Array.from({ length: 9 }, (_, i) => i + 1).map(n => {
            const v = views.find(x => x.slot === n);
            return (
              <button
                key={n}
                onClick={() => v ? onLoadView(v.id) : onSaveSlot(n)}
                onContextMenu={e => { e.preventDefault(); if (v) onRemoveView(v.id); }}
                title={v ? `LOAD slot ${n} · saved ${new Date(v.savedAt).toLocaleString()}\nRight-click to clear` : `Click to SAVE current view to slot ${n}`}
                className={`h-5 text-[9px] font-bold tabular-nums border ${
                  v
                    ? 'border-accent bg-accent/15 text-accent hover:bg-accent/25'
                    : 'border-border text-muted-foreground/60 hover:text-foreground hover:border-muted-foreground'
                }`}
              >{n}</button>
            );
          })}
        </div>
        {views.filter(v => v.slot == null).length > 0 && (
          <div className="space-y-0.5 max-h-24 overflow-y-auto">
            {views.filter(v => v.slot == null).map(v => (
              <div key={v.id} className="flex items-center gap-1 group">
                <button
                  onClick={() => onLoadView(v.id)}
                  className="flex-1 text-left px-1 py-0.5 text-[9px] uppercase text-foreground hover:bg-accent/15 hover:text-accent border border-transparent hover:border-accent/30 truncate"
                >{v.name}</button>
                <button
                  onClick={() => onRemoveView(v.id)}
                  title="Delete view"
                  className="opacity-0 group-hover:opacity-100 p-0.5 text-muted-foreground hover:text-negative"
                ><X className="w-2.5 h-2.5" /></button>
              </div>
            ))}
          </div>
        )}
      </div>

      <div className="px-2 py-2 border-b border-border">
        <div className="text-[8px] uppercase text-muted-foreground mb-1">Theme</div>
        <div className="grid grid-cols-4 gap-0.5">
          {(['midnight', 'dark', 'topo', 'contrast'] as ThemeKey[]).map(t => (
            <button
              key={t}
              onClick={() => setTheme(t)}
              className={`py-1 text-[8px] uppercase border ${theme === t ? 'border-accent bg-accent/15 text-accent' : 'border-border text-muted-foreground hover:text-foreground'}`}
            >{t}</button>
          ))}
        </div>
      </div>

      <div className="max-h-[60vh] overflow-y-auto">
        {LAYER_GROUPS.map(group => (
          <div key={group.title} className="border-b border-border/50">
            <div className="px-2 pt-2 pb-1 text-[8px] uppercase text-muted-foreground/80 tracking-wider">{group.title}</div>
            {group.keys.map(k => {
              const meta = LAYER_META[k];
              const ls = layers[k];
              return (
                <div key={k} className="px-2 py-1.5 hover:bg-accent/5">
                  <label className="flex items-center justify-between cursor-pointer">
                    <div className="flex items-center gap-1.5">
                      <input
                        type="checkbox"
                        checked={ls.on}
                        onChange={e => update(k, { on: e.target.checked } as any)}
                        className="accent-accent w-3 h-3"
                      />
                      <span className="w-1.5 h-1.5" style={{ background: meta.color }} />
                      <span className={`text-[10px] ${ls.on ? 'text-foreground' : 'text-muted-foreground'}`}>{meta.label}</span>
                    </div>
                    <span className="text-[8px] text-muted-foreground tabular-nums">{Math.round(ls.opacity * 100)}%</span>
                  </label>
                  <input
                    type="range"
                    min={0}
                    max={1}
                    step={0.05}
                    value={ls.opacity}
                    onChange={e => update(k, { opacity: parseFloat(e.target.value) } as any)}
                    disabled={!ls.on}
                    className="w-full h-1 mt-1 accent-accent cursor-pointer disabled:opacity-30"
                  />
                </div>
              );
            })}
            {group.title === 'CALENDAR' && layers.econPins.on && (
              <div className="px-2 pb-2 pt-0.5 flex flex-col gap-1">
                <label className="flex items-center gap-1.5 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={econHighOnly}
                    onChange={e => setEconHighOnly(e.target.checked)}
                    className="accent-accent w-3 h-3"
                  />
                  <span className="w-1.5 h-1.5" style={{ background: '#ef4444' }} />
                  <span className={`text-[10px] ${econHighOnly ? 'text-foreground' : 'text-muted-foreground'}`}>HIGH impact only</span>
                </label>
                <label className="flex items-center gap-1.5 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={econCBOnly}
                    onChange={e => setEconCBOnly(e.target.checked)}
                    className="accent-accent w-3 h-3"
                  />
                  <span className="w-1.5 h-1.5" style={{ background: 'hsl(33,100%,55%)' }} />
                  <span className={`text-[10px] ${econCBOnly ? 'text-foreground' : 'text-muted-foreground'}`}>Central banks only</span>
                </label>
              </div>
            )}
          </div>
        ))}
      </div>

      {/* Footer trimmed per user request */}
    </div>
  );
}

// ─── Main exported component ──────────────────────────────────────────
export default function AdvancedGlobe({
  markets,
  expanded = false,
  onToggleExpand,
}: {
  markets: GlobeMarket[];
  expanded?: boolean;
  onToggleExpand?: () => void;
}) {
  const [storedLayers, setStoredLayers] = useUserPreference<LayerState>('globe.layers', DEFAULT_LAYERS);
  // Merge with defaults so older persisted preferences (missing newer layer keys
  // like `tankers`) don't crash with `undefined.on`.
  const layers = useMemo<LayerState>(() => {
    const merged = { ...DEFAULT_LAYERS } as LayerState;
    for (const k of Object.keys(DEFAULT_LAYERS) as (keyof LayerState)[]) {
      merged[k] = { ...DEFAULT_LAYERS[k], ...(storedLayers as any)?.[k] };
    }
    return merged;
  }, [storedLayers]);
  const setLayers = setStoredLayers;
  const [theme, setTheme] = useUserPreference<ThemeKey>('globe.theme', 'midnight');
  const [drawerOpen, setDrawerOpen] = useState(false);
  const [countries, setCountries] = useState<any | null>(null);
  const [selected, setSelected] = useState<number | null>(null);
  const [hovered, setHovered] = useState<number | null>(null);
  const [tick, setTick] = useState(0);
  const [hoveredCorridor, setHoveredCorridor] = useState<string | null>(null);
  const [hoveredChokepoint, setHoveredChokepoint] = useState<string | null>(null);
  const [selectedEconPinId, setSelectedEconPinId] = useState<string | null>(null);
  // Time scrubber state — offset in minutes from real now (negative = past).
  const [scrubOffsetMin, setScrubOffsetMin] = useState(0);
  const [scrubPlaying, setScrubPlaying] = useState(false);
  const [scrubberOpen, setScrubberOpen] = useState(false);
  const [macroMetric, setMacroMetric] = useUserPreference<MacroMetric>('globe.macroMetric', 'yield10y');
  const [econHighOnly, setEconHighOnly] = useUserPreference<boolean>('globe.econHighOnly', false);
  const [econCBOnly, setEconCBOnly] = useUserPreference<boolean>('globe.econCBOnly', false);
  // 2D/3D mode toggle — Map2D shares the same layer state + filter ecosystem.
  const [viewMode, setViewMode] = useUserPreference<'3D' | '2D'>('globe.viewMode', '3D');
  const fx = useFXRates();
  const indices = useIndices();
  const ais = useAISVessels(layers.tankers.on);
  const stormsState = useStorms(layers.storms.on);
  // Dev-only storm injection for off-season visual QA.
  const [demoStormOn, setDemoStormOn] = useState(false);
  const stormsList = useMemo(
    () => DEV_DEMO_STORM && demoStormOn ? [DEMO_STORM, ...stormsState.storms] : stormsState.storms,
    [demoStormOn, stormsState.storms],
  );
  // Virtual "now" used by the terminator and econ-pin recency. When the
  // scrubber is at LIVE (offset 0) this re-ticks every minute; otherwise it's
  // pinned to real-now + offset and only updates when the user moves the slider.
  const scrubbedNowMs = useMemo(
    () => Date.now() + scrubOffsetMin * 60_000,
    [scrubOffsetMin, tick],
  );
  const econPins = useMemo(
    () => layers.econPins.on
      ? buildEconPins(7, new Date(scrubbedNowMs), { highOnly: econHighOnly, cbOnly: econCBOnly })
      : [],
    [layers.econPins.on, scrubbedNowMs, econHighOnly, econCBOnly],
  );

  // Listen for CLI presets (e.g. MAP FX, MAP YLD)
  useEffect(() => {
    const handler = (ev: Event) => {
      const e = ev as CustomEvent<{ preset: GlobePreset; metric?: MacroMetric }>;
      setLayers(presetToLayers(e.detail.preset, layers));
      if (e.detail.metric) setMacroMetric(e.detail.metric);
    };
    window.addEventListener(GLOBE_PRESET_EVENT, handler as EventListener);
    return () => window.removeEventListener(GLOBE_PRESET_EVENT, handler as EventListener);
  }, [layers, setLayers, setMacroMetric]);

  // Listen for CLI `MAP` command to switch into 2D mode without reload.
  useEffect(() => {
    const handler = (ev: Event) => {
      const e = ev as CustomEvent<'2D' | '3D'>;
      if (e.detail === '2D' || e.detail === '3D') setViewMode(e.detail);
    };
    window.addEventListener('lovable:globe-set-view-mode', handler as EventListener);
    return () => window.removeEventListener('lovable:globe-set-view-mode', handler as EventListener);
  }, [setViewMode]);

  // Broadcast viewMode changes so external headers (GlobeView) stay in sync.
  useEffect(() => {
    window.dispatchEvent(new CustomEvent('lovable:globe-set-view-mode', { detail: viewMode }));
  }, [viewMode]);

  // Listen for CLI MAPTIM command to open the scrubber drawer
  useEffect(() => {
    const open = () => setScrubberOpen(true);
    window.addEventListener('lovable:globe-open-scrubber', open);
    return () => window.removeEventListener('lovable:globe-open-scrubber', open);
  }, []);

  // ─── Saved Views (Phase 5: persist + recall layer combos) ───────────
  const savedViews = useSavedViews();
  const controlsRef = useRef<any>(null);

  const captureCurrentPayload = (): SavedView['payload'] => {
    const payload: SavedView['payload'] = {
      layers,
      theme,
      macroMetric,
      econHighOnly,
      econCBOnly,
      scrubOffsetMin,
    };
    const ctl = controlsRef.current;
    if (ctl?.object?.position && ctl?.target) {
      const p = ctl.object.position;
      const t = ctl.target;
      payload.camera = { x: p.x, y: p.y, z: p.z, tx: t.x, ty: t.y, tz: t.z };
    }
    return payload;
  };

  const saveCurrentView = (key: string) => {
    const view = buildSavedView(key, captureCurrentPayload());
    savedViews.upsert(view);
    toast.success(`Saved view ${view.slot != null ? `slot ${view.slot}` : view.name}`);
  };

  const applyView = (view: SavedView) => {
    const p = view.payload;
    if (p.layers) setLayers(p.layers);
    if (p.theme) setTheme(p.theme as ThemeKey);
    if (p.macroMetric) setMacroMetric(p.macroMetric as MacroMetric);
    if (typeof p.econHighOnly === 'boolean') setEconHighOnly(p.econHighOnly);
    if (typeof p.econCBOnly === 'boolean') setEconCBOnly(p.econCBOnly);
    if (typeof p.scrubOffsetMin === 'number') setScrubOffsetMin(p.scrubOffsetMin);
    const ctl = controlsRef.current;
    if (p.camera && ctl?.object?.position && ctl?.target) {
      ctl.object.position.set(p.camera.x, p.camera.y, p.camera.z);
      if (p.camera.tx != null) ctl.target.set(p.camera.tx, p.camera.ty ?? 0, p.camera.tz ?? 0);
      ctl.update?.();
    }
    toast.success(`Loaded view ${view.slot != null ? `slot ${view.slot}` : view.name}`);
  };

  const applyViewById = (id: string) => {
    const v = savedViews.views.find(x => x.id === id);
    if (v) applyView(v);
  };

  // CLI bridge: SAVE / LOAD / VIEWS commands.
  useEffect(() => {
    const onSave = (ev: Event) => {
      const key = (ev as CustomEvent<{ key: string }>).detail?.key;
      if (key) saveCurrentView(key);
    };
    const onLoad = (ev: Event) => {
      const key = (ev as CustomEvent<{ key: string }>).detail?.key;
      const v = key ? savedViews.findByKey(key) : undefined;
      if (v) applyView(v);
      else toast.error(`No saved view: ${key}`);
    };
    const onList = () => {
      if (savedViews.views.length === 0) {
        toast.message('No saved views yet', { description: 'Use SAVE 1 (or SAVE oil-watch) to capture the current globe.' });
      } else {
        toast.message(`${savedViews.views.length} saved view${savedViews.views.length === 1 ? '' : 's'}`, {
          description: savedViews.views.map(v => v.slot != null ? `[${v.slot}]` : v.name).join(' · '),
        });
      }
    };
    window.addEventListener(SAVE_VIEW_EVENT, onSave);
    window.addEventListener(LOAD_VIEW_EVENT, onLoad);
    window.addEventListener(LIST_VIEWS_EVENT, onList);
    return () => {
      window.removeEventListener(SAVE_VIEW_EVENT, onSave);
      window.removeEventListener(LOAD_VIEW_EVENT, onLoad);
      window.removeEventListener(LIST_VIEWS_EVENT, onList);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [savedViews.views, layers, theme, macroMetric, econHighOnly, econCBOnly, scrubOffsetMin]);


  // Listen for dev-only synthetic hurricane toggles and force the storms
  // layer + scrubber on so visual QA can verify the path immediately.
  useEffect(() => {
    if (!DEV_DEMO_STORM) return;
    const handler = () => {
      setDemoStormOn(prev => {
        const next = !prev;
        if (next) {
          setLayers(l => ({ ...l, storms: { ...l.storms, on: true } }));
          setScrubberOpen(true);
        }
        return next;
      });
    };
    window.addEventListener(DEMO_STORM_EVENT, handler);
    return () => window.removeEventListener(DEMO_STORM_EVENT, handler);
  }, [setLayers]);
  useEffect(() => {
    let cancelled = false;
    fetch(COUNTRIES_URL)
      .then(r => r.json())
      .then(d => { if (!cancelled) setCountries(d); })
      .catch(() => {});
    return () => { cancelled = true; };
  }, []);

  // Re-render terminator + arcs every minute
  useEffect(() => {
    const id = window.setInterval(() => setTick(t => t + 1), 60_000);
    return () => clearInterval(id);
  }, []);

  const palette = THEMES[theme];
  const height = expanded ? 'h-full min-h-[420px]' : 'h-[420px]';
  const sel = selected != null ? markets[selected] : null;

  return (
    <GlobeErrorBoundary>
    <div className={`relative w-full ${height} bg-surface-deep border border-border overflow-hidden`} style={{ background: palette.bg }}>
      {viewMode === '3D' ? (
      <Canvas
        camera={{ position: [0, 0, 290], fov: 45, near: 0.1, far: 2000 }}
        dpr={[1, 2]}
        gl={{ antialias: true, alpha: false }}
        onCreated={({ gl }) => gl.setClearColor(new THREE.Color(palette.bg))}
      >
        <ambientLight intensity={0.7} />
        <directionalLight position={[200, 100, 200]} intensity={0.9} />
        <Suspense fallback={null}>
          {layers.stars.on && (
            <Stars radius={800} depth={50} count={3000} factor={6} fade speed={0.3} />
          )}
          <GlobeObject
            markets={markets}
            layers={layers}
            theme={theme}
            countriesData={countries}
            selected={selected}
            hovered={hovered}
            onMarkerClick={setSelected}
            onMarkerHover={setHovered}
            tick={tick}
            fxRates={fx.rates}
            hoveredCorridor={hoveredCorridor}
            indicesByAbbr={indices.byAbbr}
            macroMetric={macroMetric}
            hoveredChokepoint={hoveredChokepoint}
            vessels={ais.vessels}
            storms={stormsList}
            econPins={econPins}
            onEconPinClick={setSelectedEconPinId}
            scrubbedNowMs={scrubbedNowMs}
          />
        </Suspense>
        <OrbitControls
          ref={controlsRef as any}
          enablePan={false}
          enableZoom={true}
          minDistance={140}
          maxDistance={500}
          rotateSpeed={0.5}
          zoomSpeed={0.6}
          autoRotate={false}
        />
      </Canvas>
      ) : (
        <Map2D
          markets={markets}
          fxRates={fx.rates}
          indicesByAbbr={indices.byAbbr}
          storms={stormsList}
          econPins={econPins}
          flags={{
            countries: layers.countries.on,
            graticule: layers.graticule.on,
            exchanges: layers.exchanges.on,
            fxFlows: layers.fxFlows.on,
            shipRoutes: layers.shipRoutes.on,
            chokepoints: layers.chokepoints.on,
            storms: layers.storms.on,
            econPins: layers.econPins.on,
          }}
          onMarkerClick={setSelected}
        />
      )}

      {/* 3D showcase banner — nudges users to 2D for full data tools */}
      {viewMode === '3D' && (
        <div className="absolute top-2 left-1/2 -translate-x-1/2 z-20 px-2 py-1 bg-surface-deep/80 border border-border backdrop-blur font-mono text-[8px] uppercase tracking-wider text-muted-foreground pointer-events-none">
          <span className="text-accent font-bold">Showcase view</span> · switch to 2D for full data tools
        </div>
      )}
      {/* Top-left HUD: Layers + Time (3D) + MKTS toggle (both modes) */}
      <div className="absolute top-10 left-2 z-20 flex items-center gap-1">
        {viewMode === '3D' && (
          <button
            onClick={() => setDrawerOpen(o => !o)}
            className={`flex items-center gap-1 px-2 py-1 border text-[9px] font-mono uppercase font-bold backdrop-blur ${
              drawerOpen
                ? 'bg-accent text-accent-foreground border-accent'
                : 'bg-surface-deep/80 text-foreground border-border hover:border-accent'
            }`}
          >
            <Layers className="w-3 h-3" /> Layers
          </button>
        )}
        <button
          onClick={() => {
            const next = !layers.exchanges.on;
            setLayers({ ...layers, exchanges: { ...layers.exchanges, on: next }, labels: { ...layers.labels, on: next } });
          }}
          title={layers.exchanges.on ? 'Hide market venues & tickers' : 'Show market venues & tickers'}
          className={`flex items-center gap-1 px-2 py-1 border text-[9px] font-mono uppercase font-bold backdrop-blur ${
            layers.exchanges.on
              ? 'bg-accent text-accent-foreground border-accent'
              : 'bg-surface-deep/80 text-muted-foreground border-border hover:border-accent'
          }`}
        >
          MKTS
        </button>
        {viewMode === '3D' && (
          <button
            onClick={() => setScrubberOpen(o => !o)}
            title="Time scrubber (±7d)"
            className={`flex items-center gap-1 px-2 py-1 border text-[9px] font-mono uppercase font-bold backdrop-blur ${
              scrubberOpen
                ? 'bg-accent text-accent-foreground border-accent'
                : 'bg-surface-deep/80 text-foreground border-border hover:border-accent'
            }`}
          >
            <Clock className="w-3 h-3" /> Time
            {Math.abs(scrubOffsetMin) >= 1 && (
              <span className="ml-0.5 text-[hsl(15,90%,65%)]">●</span>
            )}
          </button>
        )}
        {layers.macroChoro.on && (
          <div className="flex items-center bg-surface-deep/80 border border-[hsl(280,65%,40%)] backdrop-blur ml-1">
            {(['yield10y', 'cpi', 'gdp', 'pmi'] as MacroMetric[]).map(m => (
              <button
                key={m}
                onClick={() => setMacroMetric(m)}
                className={`px-1.5 py-1 text-[9px] font-mono uppercase font-bold border-r border-border last:border-r-0 ${
                  macroMetric === m
                    ? 'bg-[hsl(280,65%,40%)] text-white'
                    : 'text-muted-foreground hover:text-foreground'
                }`}
              >
                {MACRO_METRIC_META[m].short}
              </button>
            ))}
          </div>
        )}
      </div>
      {/* Status legend */}
      <div className="absolute bottom-2 left-2 z-20 flex items-center gap-3 px-2 py-1 bg-surface-deep/85 border border-border text-[9px] font-mono backdrop-blur">
        <span className="text-muted-foreground/70 hidden">3D · {markets.length} venues</span>
        {(layers.fxFlows.on || layers.fxChoro.on) && (
          <span className={`ml-2 ${fx.loading ? 'text-muted-foreground' : fx.error ? 'text-negative' : 'text-positive'}`}>
            FX {fx.loading ? '…' : fx.error ? 'ERR' : 'LIVE'}
          </span>
        )}
        {layers.bubbles.on && (
          <span className={`ml-2 ${indices.loading ? 'text-muted-foreground' : indices.error ? 'text-negative' : 'text-accent'}`}>
            IDX {indices.loading ? '…' : indices.error ? 'ERR' : 'LIVE'}
          </span>
        )}
        {(layers.chokepoints.on || layers.shipRoutes.on) && (
          <span className="ml-2 text-[hsl(195,90%,65%)]">
            SHIP · {layers.chokepoints.on ? `${CHOKEPOINTS.length} CKPT` : ''}{layers.chokepoints.on && layers.shipRoutes.on ? ' · ' : ''}{layers.shipRoutes.on ? 'ROUTES' : ''}
          </span>
        )}
        {layers.tankers.on && (
          <span className={`ml-2 ${ais.loading ? 'text-muted-foreground' : ais.error ? 'text-negative' : 'text-[hsl(28,95%,65%)]'}`}>
            AIS {ais.loading ? '…' : ais.error ? 'ERR' : `${ais.vessels.length}`}
          </span>
        )}
        {layers.commodities.on && (
          <span className="ml-2 text-[hsl(48,95%,65%)]">
            COM · {COMMODITY_SITES.length} sites
          </span>
        )}
        {layers.storms.on && (
          <span className={`ml-2 ${stormsState.loading ? 'text-muted-foreground' : stormsState.error ? 'text-negative' : 'text-[hsl(0,85%,65%)]'}`}>
            STM {stormsState.loading ? '…' : stormsState.error ? 'ERR' : `${stormsList.length}`}{demoStormOn && <span className="ml-1 text-[hsl(33,100%,55%)]">·DEMO</span>}
          </span>
        )}
        {layers.econPins.on && (
          <span className="ml-2 text-[hsl(15,90%,65%)]">
            ECON · {econPins.length} ±7d
          </span>
        )}
      </div>

      {/* Active storms table — visible when storms layer is on */}
      {layers.storms.on && stormsList.length > 0 && (
        <div className="absolute top-2 right-[16rem] z-20 w-52 max-h-[60vh] overflow-y-auto bg-surface-deep/90 border border-border backdrop-blur font-mono">
          <div className="px-2 py-1 bg-surface-elevated border-b border-border text-[9px] uppercase font-bold text-[hsl(0,85%,65%)]">
            Active Tropical Cyclones{demoStormOn && <span className="ml-1 text-[hsl(33,100%,55%)]">· DEMO</span>}
          </div>
          {stormsList
            .slice()
            .sort((a, b) => b.windKt - a.windKt)
            .map(s => {
              const meta = STORM_CAT_META[Math.max(-1, s.category)];
              return (
                <div
                  key={s.id}
                  className="flex justify-between items-center px-2 py-0.5 text-[9px] tabular-nums hover:bg-[hsl(0,85%,40%)]/10"
                  title={`${s.name} · ${s.basin} · ${s.windKt}kt · ${s.pressureMb ?? '—'}mb`}
                >
                  <span className="text-foreground truncate mr-1">{s.name}</span>
                  <span className="font-bold" style={{ color: stormColor(s.category) }}>
                    {meta?.label ?? '—'} · {s.windKt}kt
                  </span>
                </div>
              );
            })}
        </div>
      )}

      {/* Econ calendar pins table — visible when econPins layer is on */}
      {layers.econPins.on && econPins.length > 0 && (
        <div className="absolute top-2 right-[16rem] z-20 w-56 max-h-[60vh] overflow-y-auto bg-surface-deep/90 border border-border backdrop-blur font-mono">
          <div className="px-2 py-1 bg-surface-elevated border-b border-border text-[9px] uppercase font-bold text-[hsl(15,90%,65%)] flex justify-between">
            <span>Econ Calendar · ±7d</span>
            <span className="text-muted-foreground/70">{econPins.length}</span>
          </div>
          {econPins
            .slice()
            .sort((a, b) => a.daysFromNow - b.daysFromNow)
            .map(p => {
              const isToday = p.daysFromNow === 0;
              const past = p.daysFromNow < 0;
              const dayLabel = isToday ? 'TODAY' : past ? `${p.daysFromNow}d` : `+${p.daysFromNow}d`;
              return (
                <button
                  key={p.id}
                  onClick={() => setSelectedEconPinId(p.id)}
                  className={`w-full flex justify-between items-center px-2 py-0.5 text-[9px] tabular-nums text-left ${past ? 'opacity-55' : ''} hover:bg-[hsl(15,90%,40%)]/15`}
                  title={`${p.event}\n${p.country} · ${p.date} ${p.time}\nImpact: ${p.impact}\nClick for full detail`}
                >
                  <span className="text-foreground truncate mr-1">
                    <span style={{ color: ECON_IMPACT_META[p.impact] }}>●</span> {p.country} {p.event.slice(0, 18)}
                  </span>
                  <span className={`font-bold ${isToday ? 'text-accent' : 'text-muted-foreground'}`}>{dayLabel}</span>
                </button>
              );
            })}
        </div>
      )}

      {/* FX corridor table — visible when FX layer is on; hover highlights arc */}
      {layers.fxFlows.on && fx.rates.length > 0 && (
        <div className="absolute top-2 right-[16rem] z-20 w-44 max-h-[60vh] overflow-y-auto bg-surface-deep/90 border border-border backdrop-blur font-mono">
          <div className="px-2 py-1 bg-surface-elevated border-b border-border text-[9px] uppercase font-bold text-accent">
            FX Corridors
          </div>
          {FX_CORRIDORS.map(([base, quote]) => {
            const id = `${base}/${quote}`;
            const bChg = base === 'USD' ? 0 : (fx.rates.find(r => r.ccy === base)?.change_pct ?? 0);
            const qChg = quote === 'USD' ? 0 : (fx.rates.find(r => r.ccy === quote)?.change_pct ?? 0);
            const delta = bChg - qChg;
            const isHov = hoveredCorridor === id;
            return (
              <button
                key={id}
                onMouseEnter={() => setHoveredCorridor(id)}
                onMouseLeave={() => setHoveredCorridor(null)}
                className={`w-full flex justify-between items-center px-2 py-0.5 text-[9px] tabular-nums ${isHov ? 'bg-accent/15' : 'hover:bg-accent/5'}`}
              >
                <span className="text-foreground">{base}/{quote}</span>
                <span className={delta >= 0 ? 'text-positive' : 'text-negative'}>
                  {delta >= 0 ? '+' : ''}{delta.toFixed(3)}%
                </span>
              </button>
            );
          })}
        </div>
      )}

      {/* Chokepoints table — visible when chokepoints layer is on; hover pulses ring */}
      {layers.chokepoints.on && (
        <div className="absolute top-2 right-[16rem] z-20 w-48 max-h-[60vh] overflow-y-auto bg-surface-deep/90 border border-border backdrop-blur font-mono">
          <div className="px-2 py-1 bg-surface-elevated border-b border-border text-[9px] uppercase font-bold text-[hsl(195,90%,65%)]">
            Maritime Chokepoints
          </div>
          {CHOKEPOINTS.sort((a, b) => b.risk - a.risk).map(cp => {
            const isHov = hoveredChokepoint === cp.id;
            const riskClass =
              cp.risk === 4 ? 'text-negative' :
              cp.risk === 3 ? 'text-[hsl(28,95%,60%)]' :
              cp.risk === 2 ? 'text-[hsl(45,90%,60%)]' :
              'text-[hsl(180,70%,55%)]';
            return (
              <button
                key={cp.id}
                onMouseEnter={() => setHoveredChokepoint(cp.id)}
                onMouseLeave={() => setHoveredChokepoint(null)}
                className={`w-full flex justify-between items-center px-2 py-0.5 text-[9px] tabular-nums ${isHov ? 'bg-[hsl(195,90%,40%)]/15' : 'hover:bg-[hsl(195,90%,40%)]/5'}`}
                title={`${cp.name} · ${cp.oilSharePct}% global oil`}
              >
                <span className="text-foreground truncate mr-1">{cp.short}</span>
                <span className={`${riskClass} font-bold`}>R{cp.risk} · {cp.oilSharePct}%</span>
              </button>
            );
          })}
        </div>
      )}
      {sel && (() => {
        const q = indices.byAbbr[sel.abbr];
        return (
        <div className="absolute bottom-2 right-2 z-20 w-60 bg-surface-deep/95 border border-accent/50 backdrop-blur font-mono">
          <div className="px-2 py-1 bg-surface-elevated border-b border-border flex items-center justify-between">
            <span className="text-[10px] font-bold text-accent">{sel.abbr} · {sel.index}</span>
            <button onClick={() => setSelected(null)} className="p-0.5 hover:bg-accent/10"><X className="w-2.5 h-2.5" /></button>
          </div>
          <div className="p-2 space-y-1 text-[9px]">
            <div className="flex justify-between"><span className="text-muted-foreground">Name</span><span className="text-foreground truncate ml-2">{sel.name}</span></div>
            <div className="flex justify-between"><span className="text-muted-foreground">Currency</span><span className="text-foreground">{sel.currency}</span></div>
            <div className="flex justify-between"><span className="text-muted-foreground">Status</span>
              <span className={
                sel.status === 'OPEN' ? 'text-positive font-bold' :
                sel.status === 'CLOSED' ? 'text-negative font-bold' :
                'text-accent font-bold'
              }>{sel.status ?? '—'}</span>
            </div>
            {q && (
              <>
                <div className="flex justify-between border-t border-border/50 pt-1 mt-1">
                  <span className="text-muted-foreground">Last</span>
                  <span className="text-foreground tabular-nums">{q.close?.toLocaleString() ?? '—'}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Change</span>
                  <span className={`tabular-nums font-bold ${(q.change_pct ?? 0) >= 0 ? 'text-positive' : 'text-negative'}`}>
                    {q.change_pct == null ? '—' : `${q.change_pct >= 0 ? '+' : ''}${q.change_pct.toFixed(2)}%`}
                  </span>
                </div>
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Mcap (USD T)</span>
                  <span className="text-foreground tabular-nums">{q.mcap_usd_t.toFixed(1)}</span>
                </div>
                {(q.movers?.length ?? 0) > 0 && (
                  <div className="border-t border-border/50 pt-1 mt-1">
                    <div className="text-[8px] uppercase text-muted-foreground mb-0.5">Top Movers</div>
                    {q.movers.map(m => (
                      <div key={m.sym} className="flex justify-between">
                        <span className="text-foreground">{m.sym}</span>
                        <span className={`tabular-nums ${m.pct >= 0 ? 'text-positive' : 'text-negative'}`}>
                          {m.pct >= 0 ? '+' : ''}{m.pct.toFixed(2)}%
                        </span>
                      </div>
                    ))}
                  </div>
                )}
              </>
            )}
          </div>
        </div>
        );
      })()}

      {drawerOpen && (
        <LayerDrawer
          layers={layers}
          setLayers={setLayers}
          theme={theme}
          setTheme={setTheme}
          onClose={() => setDrawerOpen(false)}
          onReset={() => { setLayers(DEFAULT_LAYERS); setTheme('midnight'); }}
          econHighOnly={econHighOnly}
          setEconHighOnly={setEconHighOnly}
          econCBOnly={econCBOnly}
          setEconCBOnly={setEconCBOnly}
          views={savedViews.views}
          onSaveSlot={(n) => saveCurrentView(String(n))}
          onLoadView={(id) => applyViewById(id)}
          onRemoveView={(id) => savedViews.remove(id)}
        />
      )}

      <EconPinDetailDialog
        pin={selectedEconPinId ? econPins.find(p => p.id === selectedEconPinId) ?? null : null}
        onClose={() => setSelectedEconPinId(null)}
      />

      {scrubberOpen && (
        <TimeScrubber
          offsetMin={scrubOffsetMin}
          setOffsetMin={setScrubOffsetMin}
          playing={scrubPlaying}
          setPlaying={setScrubPlaying}
          scrubbedNow={new Date(scrubbedNowMs)}
        />
      )}
    </div>
    </GlobeErrorBoundary>
  );
}
