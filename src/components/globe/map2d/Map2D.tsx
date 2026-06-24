/**
 * 2D Mercator map — the primary, deep, Bloomberg-grade canvas. Pan/zoom,
 * satellite basemap (CARTO Voyager), 18+ infrastructure layers, sanctions &
 * trade-flow overlays, hazard zones, click-to-pin Inspector, search/jump-to,
 * great-circle measure tool, mini-map, region bookmarks, and live cursor
 * lat/lng readout. All filters and the camera state persist via
 * useUserPreference so toggling 2D ↔ 3D and reloads preserve everything.
 */
import React, { useEffect, useMemo, useRef, useState, useCallback, startTransition } from 'react';
import { useUserPreference } from '@/hooks/useUserPreference';
import { useLiveQuakes } from '@/hooks/useLiveQuakes';
import { useLiveFires } from '@/hooks/useLiveFires';
import { useLiveFlights } from '@/hooks/useLiveFlights';
import { useAISVessels } from '@/hooks/useAISVessels';
import { useLiveAirQuality } from '@/hooks/useLiveAirQuality';
import { useLiveISS } from '@/hooks/useLiveISS';
import { useLiveLightning } from '@/hooks/useLiveLightning';
import type { GlobeMarket } from '../AdvancedGlobe';
import type { FXRate } from '@/hooks/useFXRates';
import type { IndexQuote } from '@/hooks/useIndices';
import type { Storm } from '@/hooks/useStorms';
import type { EconPin } from '../layers/econPins';
import { stormColor } from '../layers/storms';
import { FX_CORRIDORS, FX_HUBS } from '../layers/fxArcs';
import { CHOKEPOINTS } from '../layers/shipping';
import {
  DEFAULT_MAP2D_FILTERS, type Map2DFilters, type Continent, CONTINENT_LABEL,
  filterMarkets, filterFXRates, filterStorms, filterEconPins,
  sovRiskByCountry, passesSovRisk, todAlpha, mercator, unmercator,
  haversineKm, initialBearingDeg, greatCirclePoints,
} from './filters';
import {
  PIPELINES, FIBER_CABLES, HV_INTERCONNECTS, NUCLEAR, PORTS, AIRPORTS,
  LNG_TERMINALS, REFINERIES, OIL_FIELDS, MINES, DATA_CENTERS, IXPS,
  NAVAL_BASES, STRAITS, CB_HQS, COAL_PLANTS,
  PIPELINE_COLOR, STATUS_COLOR, COMMODITY_COLOR,
  type LineFeature, type PointFeature,
} from './infra';
import { SANCTIONED_COUNTRIES, SANCTION_TIER, TRADE_FLOWS, TRADE_CATEGORY_COLOR } from './geopolitics';
import { EARTHQUAKE_ZONES, WILDFIRE_HOTSPOTS, HAZARD_COLOR } from './hazards';
import { TileUnderlay } from './TileUnderlay';
import { Inspector2D, type PinnedFeature } from './Inspector2D';
import { CrosshairTooltip2D } from './CrosshairTooltip2D';
import { CountryDetailDrawer } from './CountryDetailDrawer';
import { SearchBox2D, type SearchEntry } from './SearchBox2D';
import { MeasureToggle } from './MeasureTool2D';
import { MiniMap2D } from './MiniMap2D';
import { Map2DLayerDrawer } from './Map2DLayerDrawer';
import { BASEMAP_LIST, type BasemapId } from './basemaps';
import { FACTORIES, FACTORY_COLOR } from './factories';
import { RETAIL, RETAIL_COLOR } from './retail';
import { AGRICULTURE, CROP_COLOR } from './agriculture';
import { WEATHER_FIELDS, weatherColor, WEATHER_STEP } from './weather';
import { FIRES, fireColor, FIRE_BIN_AGE } from './fires';
import { buildConePolygon } from './stormCone';
import { binFires, fireCellDeg } from './fireHeat';
import { QUAKES, quakeColor, TECTONIC_PLATES } from './earthquakes';
import { RISK_FIELDS, riskColor, RISK_STEP } from './climateRisk';
import { useLiveSubseaCables } from '@/hooks/useLiveSubseaCables';
import { useLiveGdelt } from '@/hooks/useLiveGdelt';
import { useLiveEonet } from '@/hooks/useLiveEonet';
import { useLiveSanctions } from '@/hooks/useLiveSanctions';
import { useLiveQuotes } from '@/hooks/useLiveQuotes';
import { COMPANIES, SECTOR_COLOR, type Sector } from './companies';
import { useCustomCompanies } from '@/hooks/useCustomCompanies';
import { useAuth } from '@/contexts/AuthContext';
import { CompanyPinEditor, type CompanyEditorInitial } from './CompanyPinEditor';
import { Pencil } from 'lucide-react';
import { MARKET_CLOCKS, marketStatus, localTime, terminatorPath } from './timeLight';
import { Legend2D } from './Legend2D';
import {
  COUNTRY_CCY, SOV_YIELD_10Y, SOV_CDS_5Y, POLICY_RATE, CPI_YOY,
  GDP_GROWTH, UNEMPLOYMENT, DEBT_GDP, CURRENT_ACCOUNT, MFG_PMI,
  fxHeatColor, yieldColor, cdsColor, macroLevelColor,
  gdpColor, unemployColor, debtGdpColor, currentAccountColor, pmiColor,
} from './markets';
import {
  OFFSHORE_WIND, ONSHORE_WIND, SOLAR_FARMS, HYDRO_DAMS,
  RENEWABLE_KIND_COLOR, RENEWABLE_KIND_LABEL, type RenewableFeature,
} from './renewable';
import {
  RAIL_CORRIDORS, RAIL_CATEGORY_COLOR, type RailCategory,
} from './railCorridors';
import { CHIP_FABS, FAB_COMPANY_COLOR } from './chipFabs';
import { MILITARY_BASES, MIL_OPERATOR_COLOR } from './militaryPresence';
import { DISPUTES, DISPUTE_STATUS_COLOR, DISPUTE_SEVERITY_OPACITY } from './borderDisputes';
import { ARCTIC_ROUTES, ARCTIC_PORTS, ROUTE_STATUS_COLOR } from './arcticRoutes';
import { REMITTANCE_FLOWS, remittanceColor } from './remittances';
import { ETS_BY_ISO, SUBNATIONAL_ETS, carbonPriceColor } from './carbonMarkets';
import { FREE_TRADE_ZONES, FTZ_KIND_COLOR } from './freeTradeZones';
import { DEFORESTATION_HOTSPOTS, deforestationColor } from './deforestation';
import {
  MILITARY_SPEND_GDP, FX_RESERVES_MONTHS, milSpendColor, reservesColor,
} from './markets';
import { COMMODITY_FLOWS, COMMODITY_COLOR as FLOW_COLOR, COMMODITY_LABEL, type Commodity } from './commodityFlows';
import {
  SHIPPING_LANES, CHOKEPOINT_STRESS, chokeStressColor,
  ETF_FLOWS_1W, etfFlowColor,
  FX_CARRY, carryColor,
  CRYPTO_HUBS, CRYPTO_HUB_COLOR, STABLECOIN_CORRIDORS,
  realYieldColor,
} from './marketFlows';
import { useAcledEvents } from '@/hooks/useAcledEvents';
import { ELECTIONS, daysUntil, electionPinColor } from './elections';
import { TRAVEL_ADVISORY, ADVISORY_LABEL, advisoryColor } from './travelAdvisory';
import { buildSanctionLinks } from './sanctionsNetwork';
import type { SamplePreset } from './sampleMaps';
import { Filter, Layers as LayersIcon, ZoomIn, ZoomOut, RotateCcw, Globe, Map as MapIcon } from 'lucide-react';
import { createCameraTween, snapTileZoom, wheelZoomFactor, type Camera } from './zoomTween';
import { LayerPresets, type SavedPreset } from './LayerPresets';
import { KeyboardShortcuts } from './KeyboardShortcuts';
import { decodeViewHash, writeViewHash } from './shareView';

const COUNTRIES_URL =
  'https://cdn.jsdelivr.net/npm/three-globe@2.31.0/example/country-polygons/ne_110m_admin_0_countries.geojson';

type LayerFlags = {
  countries: boolean;
  graticule: boolean;
  exchanges: boolean;
  fxFlows: boolean;
  shipRoutes: boolean;
  chokepoints: boolean;
  storms: boolean;
  econPins: boolean;
};

type Props = {
  markets: GlobeMarket[];
  fxRates: FXRate[];
  indicesByAbbr: Record<string, IndexQuote>;
  storms: Storm[];
  econPins: EconPin[];
  flags: LayerFlags;
  onMarkerClick?: (i: number) => void;
};

type Tooltip = { x: number; y: number; lines: string[]; color?: string } | null;

const ZOOM_MIN = 1;
const ZOOM_MAX = 65536; // ~z=23, sub-meter detail (max Esri Imagery serves)
const WORLD_ASPECT = 1.2;

// Region bookmarks (lng, lat, target zoom).
const BOOKMARKS: { id: string; label: string; lat: number; lng: number; zoom: number }[] = [
  { id: 'na', label: 'NA', lat: 40, lng: -100, zoom: 2.6 },
  { id: 'sa', label: 'LATAM', lat: -15, lng: -60, zoom: 2.6 },
  { id: 'eu', label: 'EU', lat: 52, lng: 12, zoom: 4.0 },
  { id: 'mena', label: 'MENA', lat: 28, lng: 40, zoom: 3.2 },
  { id: 'apac', label: 'APAC', lat: 25, lng: 115, zoom: 2.8 },
  { id: 'africa', label: 'AFRICA', lat: 5, lng: 22, zoom: 2.6 },
];

export function Map2D({ markets, fxRates, indicesByAbbr, storms, econPins, flags, onMarkerClick }: Props) {
  const [countries, setCountries] = useState<any | null>(null);
  const [filters, setFilters] = useUserPreference<Map2DFilters>('globe.map2dFilters', DEFAULT_MAP2D_FILTERS);
  const [savedPresets, setSavedPresets] = useUserPreference<SavedPreset[]>('globe.layerPresets', []);
  const f = useMemo<Map2DFilters>(() => ({
    ...DEFAULT_MAP2D_FILTERS,
    ...filters,
    todHeat: { ...DEFAULT_MAP2D_FILTERS.todHeat, ...(filters as any)?.todHeat },
    infra: { ...DEFAULT_MAP2D_FILTERS.infra, ...(filters as any)?.infra },
  }), [filters]);
  const [drawerOpen, setDrawerOpen] = useState(false);
  const [tooltip, setTooltip] = useState<Tooltip>(null);
  const [pinned, setPinned] = useState<PinnedFeature | null>(null);
  const [selectedCountry, setSelectedCountry] = useState<{ iso: string; name: string } | null>(null);
  const { user } = useAuth();
  const { cables: liveCables, live: cablesLive } = useLiveSubseaCables();
  const { cells: gdeltCells, live: gdeltLive } = useLiveGdelt();
  const { events: eonetEvents, live: eonetLive } = useLiveEonet();
  const { byIso: sanctionsByIso, live: sanctionsLive } = useLiveSanctions();
  const { events: acledEvents } = useAcledEvents(!!f.infra.acledHeat);
  const customCompanies = useCustomCompanies();
  // Live quotes hydrate the Companies layer with real prices.
  const companyTickers = useMemo(
    () => customCompanies.resolved.map(c => c.ticker).filter(Boolean) as string[],
    [customCompanies.resolved]
  );
  const { quotes: liveQuotes, live: quotesLive } = useLiveQuotes(companyTickers);
  const [companyEditMode, setCompanyEditMode] = useState(false);
  const [companyEditor, setCompanyEditor] = useState<{
    sx: number; sy: number;
    initial: CompanyEditorInitial;
    mode: 'create' | 'edit-custom' | 'edit-seed';
    customId?: string;
    overrideSeedId?: string;
  } | null>(null);

  // Live data feeds — merge with static samples so layers stay populated even if API fails.
  const { quakes: liveQuakes } = useLiveQuakes();
  const { fires: liveFires } = useLiveFires();
  const quakesSource = useMemo(() => (
    liveQuakes.length > 0 ? liveQuakes.map(q => ({ ...q, region: q.region ?? '' })) : QUAKES
  ), [liveQuakes]);
  const firesSource = useMemo(() => (
    liveFires.length > 0 ? liveFires.map(fr => ({
      id: fr.id, lat: fr.lat, lng: fr.lng, intensity: fr.intensity,
      frp: fr.frp, confidence: fr.confidence, daynight: fr.daynight,
      bin: '24h' as const, region: `FRP ${fr.frp.toFixed(0)} · conf ${fr.confidence}`,
    })) : FIRES.map(fr => ({ ...fr, frp: fr.intensity * 200, confidence: 'n', daynight: 'D' }))
  ), [liveFires]);

  // Persisted camera so 2D ↔ 3D switches preserve view.
  const [camera, setCamera] = useUserPreference<{ pan: { x: number; y: number }; zoom: number }>(
    'globe.map2dCamera', { pan: { x: 0, y: 0 }, zoom: 1 },
  );
  const [zoom, setZoomState] = useState(camera.zoom);
  const [pan, setPanState] = useState(camera.pan);
  const cameraDirty = useRef(false);

  // Debounced persistence of camera.
  useEffect(() => {
    cameraDirty.current = true;
    const id = window.setTimeout(() => {
      if (cameraDirty.current) {
        setCamera({ pan, zoom });
        cameraDirty.current = false;
      }
    }, 300);
    return () => clearTimeout(id);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [pan.x, pan.y, zoom]);

  const setZoom = (z: number | ((p: number) => number)) => setZoomState(z as any);
  // setPan is defined after baseW (below) so it can clamp Y.


  // Cursor lat/lng readout + screen-position for the crosshair tooltip.
  const [cursor, setCursor] = useState<{ lat: number; lng: number } | null>(null);
  const [cursorScreen, setCursorScreen] = useState<{ x: number; y: number } | null>(null);
  const [crosshairOn, setCrosshairOn] = useUserPreference<boolean>('globe.crosshairTooltip', true);
  const [crosshairFrozen, setCrosshairFrozen] = useState(false);
  const frozenSnapshot = useRef<{ lat: number; lng: number; x: number; y: number } | null>(null);

  // Shift-hold freezes / Esc hides the crosshair tooltip.
  useEffect(() => {
    if (!crosshairOn) return;
    const down = (e: KeyboardEvent) => {
      if (e.key === 'Shift' && cursor && cursorScreen) {
        frozenSnapshot.current = { lat: cursor.lat, lng: cursor.lng, x: cursorScreen.x, y: cursorScreen.y };
        setCrosshairFrozen(true);
      } else if (e.key === 'Escape') {
        setCrosshairOn(false);
      }
    };
    const up = (e: KeyboardEvent) => {
      if (e.key === 'Shift') { setCrosshairFrozen(false); frozenSnapshot.current = null; }
    };
    window.addEventListener('keydown', down);
    window.addEventListener('keyup', up);
    return () => {
      window.removeEventListener('keydown', down);
      window.removeEventListener('keyup', up);
    };
  }, [crosshairOn, cursor, cursorScreen, setCrosshairOn]);

  // Live tick for terminator + market clocks (60s — sun moves 0.25°/min).
  const [now, setNow] = useState(() => new Date());
  useEffect(() => {
    if (!f.infra.terminator && !f.infra.marketClocks) return;
    const id = window.setInterval(() => setNow(new Date()), 60_000);
    return () => clearInterval(id);
  }, [f.infra.terminator, f.infra.marketClocks]);

  // Measure tool state.
  const [measureMode, setMeasureMode] = useState(false);
  const [measurePts, setMeasurePts] = useState<{ lat: number; lng: number }[]>([]);


  const dragRef = useRef<{ x: number; y: number; px: number; py: number; moved: boolean } | null>(null);
  const wrapRef = useRef<HTMLDivElement>(null);
  const [view, setView] = useState({ w: 1000, h: 500 });

  // Resize observer.
  useEffect(() => {
    const el = wrapRef.current;
    if (!el) return;
    const ro = new ResizeObserver(([entry]) => {
      const { width, height } = entry.contentRect;
      setView({ w: Math.max(400, width), h: Math.max(240, height) });
    });
    ro.observe(el);
    return () => ro.disconnect();
  }, []);

  // World canvas sized to FILL the viewport at zoom=1 (cover, not contain).
  const baseW = useMemo(() => {
    const byWidth = view.w;
    const byHeight = view.h * WORLD_ASPECT;
    return Math.max(byWidth, byHeight);
  }, [view]);
  const w = baseW * zoom;
  const h = w / WORLD_ASPECT;

  // Clamp Y so the world fully covers the viewport vertically (no black bars).
  // Wrap X using modulo so panning east/west forever (or restoring an out-of-range
  // persisted pan) always keeps a world copy on screen.
  const clampPan = useCallback((p: { x: number; y: number }) => {
    const minY = Math.min(0, view.h - h);
    const maxY = Math.max(0, view.h - h);
    // Normalize x into (-w, 0] so at least one of the 3 wrap copies is in view.
    let x = p.x;
    if (w > 0 && (x > 0 || x < -w)) x = ((x % w) + w) % w - w;
    return { x, y: Math.max(minY, Math.min(maxY, p.y)) };
  }, [h, view.h, w]);
  const setPan = useCallback((p: typeof pan | ((prev: typeof pan) => typeof pan)) =>
    setPanState((prev) => clampPan(typeof p === 'function' ? (p as any)(prev) : p)),
    [clampPan]);

  // ─── Camera tween (rAF) — coalesces rapid wheel/keyboard/button events ───
  // Refs avoid re-creating the tween on every state change; React state is the
  // single source of truth, the tween just feeds it once per frame.
  const liveCameraRef = useRef<Camera>({ zoom, pan });
  liveCameraRef.current = { zoom, pan };
  const tweenRef = useRef<ReturnType<typeof createCameraTween> | null>(null);
  if (!tweenRef.current) {
    tweenRef.current = createCameraTween((c) => {
      setZoomState(c.zoom);
      setPanState(c.pan);
    });
  }
  useEffect(() => () => tweenRef.current?.dispose(), []);

  // Animate to a (zoom, pan) target. `snap=true` skips the tween (instant).
  const animateTo = useCallback((target: Camera, opts?: { snap?: boolean; clamp?: boolean }) => {
    const t = tweenRef.current!;
    const z = Math.max(ZOOM_MIN, Math.min(ZOOM_MAX, target.zoom));
    let p = target.pan;
    if (opts?.clamp !== false) {
      const newW = baseW * z;
      const newH = newW / WORLD_ASPECT;
      const minY = Math.min(0, view.h - newH);
      const maxY = Math.max(0, view.h - newH);
      let x = p.x;
      if (newW > 0 && (x > 0 || x < -newW)) x = ((x % newW) + newW) % newW - newW;
      p = { x, y: Math.max(minY, Math.min(maxY, p.y)) };
    }
    const next: Camera = { zoom: z, pan: p };
    if (opts?.snap) t.snap(next);
    else t.setTarget(liveCameraRef.current, next);
  }, [baseW, view.h]);

  // Cursor-anchored zoom: keeps the world point under (cx,cy) fixed.
  // Reads from the in-flight tween target so chained wheel ticks don't drift.
  const zoomAt = useCallback((cx: number, cy: number, factor: number, animate = true) => {
    const t = tweenRef.current!;
    const cur = t.getTarget() ?? liveCameraRef.current;
    let nextZoom = cur.zoom * factor;
    nextZoom = Math.max(ZOOM_MIN, Math.min(ZOOM_MAX, nextZoom));
    nextZoom = snapTileZoom(nextZoom);
    if (nextZoom === cur.zoom) return;
    const k = nextZoom / cur.zoom;
    const nextPan = { x: cx - (cx - cur.pan.x) * k, y: cy - (cy - cur.pan.y) * k };
    animateTo({ zoom: nextZoom, pan: nextPan }, { snap: !animate });
  }, [animateTo]);

  // Centre only when the viewport/baseW changes (NOT on every zoom — that fights
  // wheel-zoom-around-cursor). We also recentre when zoom hits the min.
  const lastBaseW = useRef(baseW);
  useEffect(() => {
    if (lastBaseW.current === baseW) return;
    lastBaseW.current = baseW;
    setPan({ x: (view.w - baseW * zoom) / 2, y: (view.h - (baseW * zoom) / WORLD_ASPECT) / 2 });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [baseW, view.w, view.h]);

  // Fetch countries once.
  useEffect(() => {
    let cancelled = false;
    fetch(COUNTRIES_URL).then(r => r.json()).then(d => { if (!cancelled) setCountries(d); }).catch(() => {});
    return () => { cancelled = true; };
  }, []);

  const proj = useCallback((lat: number, lng: number) => mercator(lat, lng, w, h), [w, h]);

  // Viewport bbox for the live flights feed (only computed when the flights layer is on).
  const flightBbox = useMemo(() => {
    if (!f.infra.flights || w <= 0 || h <= 0) return null;
    const tl = unmercator(-pan.x, -pan.y, w, h);
    const br = unmercator(-pan.x + view.w, -pan.y + view.h, w, h);
    return {
      lamin: Math.min(tl.lat, br.lat),
      lamax: Math.max(tl.lat, br.lat),
      lomin: Math.max(-180, Math.min(tl.lng, br.lng)),
      lomax: Math.min(180, Math.max(tl.lng, br.lng)),
    };
  }, [f.infra.flights, w, h, pan.x, pan.y, view.w, view.h]);
  const { flights: liveFlights, error: flightsErr } = useLiveFlights(flightBbox, !!f.infra.flights);
  const { vessels: aisVessels } = useAISVessels(!!f.infra.vessels);
  const { stations: airStations } = useLiveAirQuality(!!f.infra.airQuality);
  const { iss, crew: issCrew, trail: issTrail } = useLiveISS(!!f.infra.iss);
  const { strikes: lightningStrikes, source: lightningSource } = useLiveLightning(!!f.infra.lightning);

  // Filtered datasets.
  const sovScores = useMemo(() => sovRiskByCountry(fxRates, econPins), [fxRates, econPins]);
  const visibleMarkets = useMemo(() => filterMarkets(markets, indicesByAbbr, f), [markets, indicesByAbbr, f]);
  const visibleStorms = useMemo(() => filterStorms(storms, f), [storms, f]);
  const visibleEcon = useMemo(
    () => filterEconPins(econPins, f).filter(p => passesSovRisk(p.country, sovScores, f)),
    [econPins, f, sovScores],
  );
  const visibleFX = useMemo(() => filterFXRates(fxRates, f), [fxRates, f]);
  const fxByCcy = useMemo(() => Object.fromEntries(visibleFX.map(r => [r.ccy, r])), [visibleFX]);

  // Pre-computed storm cone polygons (lat/lng). Trig is O(forecast pts) per storm
  // and is independent of pan/zoom — memoize so we don't recompute on every drag.
  const stormCones = useMemo(() => {
    const m = new Map<string, { lat: number; lng: number }[]>();
    if (!flags.storms) return m;
    for (const s of visibleStorms) m.set(s.id, buildConePolygon(s));
    return m;
  }, [flags.storms, visibleStorms]);

  // Fire layer pre-compute: filter once, bin once. Pan no longer triggers binning.
  const fireWindowDays = useMemo(
    () => (({ '24h':1, '48h':2, '7d':7, '30d':30 } as const)[f.hazardWindow]),
    [f.hazardWindow],
  );
  const firesFiltered = useMemo(
    () => f.infra.fires ? firesSource.filter(fr => FIRE_BIN_AGE[fr.bin] <= fireWindowDays) : [],
    [f.infra.fires, firesSource, fireWindowDays],
  );
  const fireCellDegValue = useMemo(() => fireCellDeg(zoom), [zoom]);
  const fireCells = useMemo(
    () => fireCellDegValue > 0 ? binFires(firesFiltered, fireCellDegValue) : [],
    [firesFiltered, fireCellDegValue],
  );

  // SVG ring → path with antimeridian split.
  const ringToPath = useCallback((ring: number[][]): string => {
    let prevX: number | null = null;
    let path = '';
    for (let i = 0; i < ring.length; i++) {
      const [lng, lat] = ring[i];
      const { x, y } = proj(lat, lng);
      if (prevX !== null && Math.abs(x - prevX) > w / 2) {
        path += ` M ${x.toFixed(1)} ${y.toFixed(1)}`;
      } else {
        path += `${i === 0 ? 'M' : 'L'} ${x.toFixed(1)} ${y.toFixed(1)} `;
      }
      prevX = x;
    }
    return path;
  }, [proj, w]);

  const lineToPath = useCallback((line: LineFeature): string => {
    let d = '';
    let prevX: number | null = null;
    for (let i = 0; i < line.path.length; i++) {
      const [lng, lat] = line.path[i];
      const { x, y } = proj(lat, lng);
      if (prevX !== null && Math.abs(x - prevX) > w / 2) {
        d += ` M ${x.toFixed(1)} ${y.toFixed(1)}`;
      } else {
        d += `${i === 0 ? 'M' : 'L'} ${x.toFixed(1)} ${y.toFixed(1)} `;
      }
      prevX = x;
    }
    return d;
  }, [proj, w]);

  const countryPaths = useMemo(() => {
    if (!countries || !flags.countries) return null;
    const out: { d: string; risk: number; iso: string; name: string; sanctioned: boolean; sanctionsCount: number }[] = [];
    for (const feat of countries.features ?? []) {
      const iso = feat.properties?.ISO_A2 ?? feat.properties?.iso_a2 ?? '';
      const name = feat.properties?.ADMIN ?? feat.properties?.name ?? '';
      const risk = sovScores[iso] ?? 0;
      if (!passesSovRisk(iso, sovScores, f)) continue;
      // Live sanctions override seed list when feed is up.
      const liveCount = sanctionsByIso.get(iso)?.count ?? 0;
      const sanctioned = sanctionsLive ? liveCount > 0 : SANCTIONED_COUNTRIES.has(iso);
      const geom = feat.geometry;
      if (!geom) continue;
      const polys = geom.type === 'Polygon' ? [geom.coordinates] : geom.coordinates;
      for (const poly of polys) {
        for (const ring of poly) {
          out.push({ d: ringToPath(ring), risk, iso, name, sanctioned, sanctionsCount: liveCount });
        }
      }
    }
    return out;
  }, [countries, flags.countries, ringToPath, sovScores, f, sanctionsByIso, sanctionsLive]);

  // Graticule.
  const graticule = useMemo(() => {
    if (!flags.graticule) return null;
    const lines: string[] = [];
    for (let lng = -180; lng <= 180; lng += 30) {
      const a = proj(85, lng), b = proj(-85, lng);
      lines.push(`M ${a.x.toFixed(1)} ${a.y.toFixed(1)} L ${b.x.toFixed(1)} ${b.y.toFixed(1)}`);
    }
    for (let lat = -60; lat <= 60; lat += 30) {
      let d = '';
      for (let lng = -180; lng <= 180; lng += 5) {
        const p = proj(lat, lng);
        d += `${lng === -180 ? 'M' : 'L'} ${p.x.toFixed(1)} ${p.y.toFixed(1)} `;
      }
      lines.push(d);
    }
    return lines;
  }, [flags.graticule, proj]);

  // FX arcs (curved Bezier, antimeridian-aware — clip across).
  const fxArcs = useMemo(() => {
    if (!flags.fxFlows) return [];
    return FX_CORRIDORS.map(([base, quote]) => {
      const fromHub = FX_HUBS[base], toHub = FX_HUBS[quote];
      if (!fromHub || !toHub) return null;
      const r = fxByCcy[quote] ?? fxByCcy[base];
      const pct = r?.change_pct ?? 0;
      if (Math.abs(pct) < f.minFxVolPct) return null;
      const a = proj(fromHub.lat, fromHub.lng);
      const b = proj(toHub.lat, toHub.lng);
      if (Math.abs(a.x - b.x) > w / 2) return null;
      const mx = (a.x + b.x) / 2;
      const my = (a.y + b.y) / 2 - Math.min(80 * zoom, Math.abs(b.x - a.x) * 0.25);
      const color = pct >= 0 ? 'hsl(150, 80%, 55%)' : 'hsl(0, 85%, 60%)';
      return { d: `M ${a.x} ${a.y} Q ${mx} ${my} ${b.x} ${b.y}`, color, pct, key: `${base}-${quote}`, base, quote };
    }).filter(Boolean) as { d: string; color: string; pct: number; key: string; base: string; quote: string }[];
  }, [flags.fxFlows, fxByCcy, f.minFxVolPct, proj, w, zoom]);

  // Trade-flow arcs (great-circle sampled, then split at antimeridian).
  const tradeArcs = useMemo(() => {
    if (!f.infra.tradeFlows) return [];
    const out: { id: string; d: string; color: string; valueUsdB: number; from: string; to: string; cat: string }[] = [];
    for (const tf of TRADE_FLOWS) {
      const pts = greatCirclePoints(tf.fromLngLat[1], tf.fromLngLat[0], tf.toLngLat[1], tf.toLngLat[0], 32);
      let d = '';
      let prevX: number | null = null;
      for (let i = 0; i < pts.length; i++) {
        const { x, y } = proj(pts[i].lat, pts[i].lng);
        if (prevX !== null && Math.abs(x - prevX) > w / 2) d += ` M ${x.toFixed(1)} ${y.toFixed(1)}`;
        else d += `${i === 0 ? 'M' : 'L'} ${x.toFixed(1)} ${y.toFixed(1)} `;
        prevX = x;
      }
      out.push({
        id: tf.id, d,
        color: TRADE_CATEGORY_COLOR[tf.category ?? 'goods'],
        valueUsdB: tf.valueUsdB, from: tf.from, to: tf.to, cat: tf.category ?? 'goods',
      });
    }
    return out;
  }, [f.infra.tradeFlows, proj, w]);

  // Commodity flow arcs (great-circle, antimeridian-aware).
  const commodityArcs = useMemo(() => {
    if (!f.infra.commodityFlows) return [];
    const out: { id: string; d: string; color: string; volume: number;
      commodity: Commodity; fromName: string; toName: string }[] = [];
    for (const cf of COMMODITY_FLOWS) {
      if (!f.commoditySet[cf.commodity as keyof typeof f.commoditySet]) continue;
      const pts = greatCirclePoints(cf.fromLngLat[1], cf.fromLngLat[0], cf.toLngLat[1], cf.toLngLat[0], 48);
      let d = '';
      let prevX: number | null = null;
      for (let i = 0; i < pts.length; i++) {
        const { x, y } = proj(pts[i].lat, pts[i].lng);
        if (prevX !== null && Math.abs(x - prevX) > w / 2) d += ` M ${x.toFixed(1)} ${y.toFixed(1)}`;
        else d += `${i === 0 ? 'M' : 'L'} ${x.toFixed(1)} ${y.toFixed(1)} `;
        prevX = x;
      }
      out.push({
        id: cf.id, d, color: FLOW_COLOR[cf.commodity], volume: cf.volume,
        commodity: cf.commodity, fromName: cf.fromName, toName: cf.toName,
      });
    }
    return out;
  }, [f.infra.commodityFlows, f.commoditySet, proj, w]);

  // ─── Geopolitics & Risk ──────────────────────────────────────────────────
  const geoWindowMs = useMemo(() => {
    const w = f.geoWindow;
    return w === '24h' ? 86_400_000 : w === '7d' ? 7 * 86_400_000 : 30 * 86_400_000;
  }, [f.geoWindow]);

  // ACLED clusters: bin events into ~2° lat/lng cells, sum fatalities.
  const acledClusters = useMemo(() => {
    if (!f.infra.acledHeat || acledEvents.length === 0) return [];
    const cutoff = Date.now() - geoWindowMs;
    const bins = new Map<string, { lat: number; lng: number; count: number; fatalities: number; sample: string[] }>();
    for (const e of acledEvents) {
      if (e.ts < cutoff) continue;
      const bx = Math.round(e.lng / 2) * 2;
      const by = Math.round(e.lat / 2) * 2;
      const k = `${by}:${bx}`;
      const cur = bins.get(k);
      if (cur) {
        cur.count++;
        cur.fatalities += e.fatalities;
        if (cur.sample.length < 3) cur.sample.push(e.title);
      } else {
        bins.set(k, { lat: by, lng: bx, count: 1, fatalities: e.fatalities, sample: [e.title] });
      }
    }
    return Array.from(bins.values());
  }, [f.infra.acledHeat, acledEvents, geoWindowMs]);

  // GDELT tone bubbles per cell (existing 5° aggregation).
  const gdeltBubbles = useMemo(() => {
    if (!f.infra.gdeltTone) return [];
    return gdeltCells.filter(c => c.count > 0);
  }, [f.infra.gdeltTone, gdeltCells]);

  // Sanctions arcs: build great-circles from sanctioning bodies → targets.
  const sanctionArcs = useMemo(() => {
    if (!f.infra.sanctionsNet) return [];
    const links = buildSanctionLinks(sanctionsByIso, sanctionsLive);
    return links.map(l => {
      const pts = greatCirclePoints(l.fromLat, l.fromLng, l.toLat, l.toLng, 48);
      let d = '';
      let prevX: number | null = null;
      for (let i = 0; i < pts.length; i++) {
        const { x, y } = proj(pts[i].lat, pts[i].lng);
        if (prevX !== null && Math.abs(x - prevX) > w / 2) d += ` M ${x.toFixed(1)} ${y.toFixed(1)}`;
        else d += `${i === 0 ? 'M' : 'L'} ${x.toFixed(1)} ${y.toFixed(1)} `;
        prevX = x;
      }
      return { ...l, d };
    });
  }, [f.infra.sanctionsNet, sanctionsByIso, sanctionsLive, proj, w]);

  // Compose infra line collection by category.
  const infraLines = useMemo(() => {
    const out: { line: LineFeature; color: string; dash?: string; cat: string }[] = [];
    if (f.infra.pipelines) {
      for (const p of PIPELINES) {
        const base = PIPELINE_COLOR[p.category] ?? 'hsl(40, 90%, 60%)';
        const status = p.status ? STATUS_COLOR[p.status] : base;
        out.push({
          line: p,
          color: status === STATUS_COLOR.OPERATIONAL ? base : status,
          dash: p.status === 'DAMAGED' ? '4 3' : undefined,
          cat: 'pipeline',
        });
      }
    }
    if (f.infra.fiber) for (const c of FIBER_CABLES) out.push({ line: c, color: PIPELINE_COLOR.fiber, dash: '2 2', cat: 'fiber' });
    if (f.infra.hv) for (const hh of HV_INTERCONNECTS) out.push({ line: hh, color: PIPELINE_COLOR.hv, cat: 'hv' });
    if (f.infra.subseaCables) {
      for (const c of liveCables) {
        out.push({
          line: { id: c.id, name: c.name, category: 'subsea', capacity: c.capacityTbps ? `${c.capacityTbps} Tbps` : undefined, path: c.path },
          color: 'hsl(195, 90%, 60%)',
          dash: '3 2',
          cat: 'subsea',
        });
      }
    }
    return out;
  }, [f.infra, liveCables]);

  // Terminator polyline (lazily — only when toggled). Recomputed each minute.
  const terminator = useMemo(() => {
    if (!f.infra.terminator) return null;
    return terminatorPath(now);
  }, [f.infra.terminator, now]);

  // Hazard zone polygons.
  const hazardPaths = useMemo(() => {
    if (!f.infra.seismic) return [];
    return EARTHQUAKE_ZONES.map(z => ({
      id: z.id, name: z.name, severity: z.severity,
      d: ringToPath(z.ring as any),
    }));
  }, [f.infra.seismic, ringToPath]);

  // ─── Pan / zoom handlers ───
  const onMouseDown = (e: React.MouseEvent) => {
    if ((e.target as HTMLElement).closest('[data-no-drag]')) return;
    dragRef.current = { x: e.clientX, y: e.clientY, px: pan.x, py: pan.y, moved: false };
    setTooltip(null);
  };
  // rAF-throttled cursor state writes — mousemove fires 100+/s but the
  // crosshair tooltip + status bar only need ~60 Hz. Coalesces into one
  // setState per frame so we don't re-render on every pixel of motion.
  const cursorRafRef = useRef<number | null>(null);
  const pendingCursorRef = useRef<{ ll: { lat: number; lng: number } | null; sx: number; sy: number } | null>(null);
  const flushCursor = useCallback(() => {
    cursorRafRef.current = null;
    const p = pendingCursorRef.current;
    if (!p) return;
    if (p.ll) {
      setCursor(p.ll);
      setCursorScreen({ x: p.sx, y: p.sy });
    } else {
      setCursor(null);
      setCursorScreen(null);
    }
  }, []);
  useEffect(() => () => {
    if (cursorRafRef.current != null) cancelAnimationFrame(cursorRafRef.current);
  }, []);

  const onMouseMove = (e: React.MouseEvent) => {
    const dragging = !!dragRef.current;
    // Skip cursor readout while dragging — it would just be discarded.
    if (!dragging) {
      const rect = wrapRef.current?.getBoundingClientRect();
      if (rect) {
        const sx = e.clientX - rect.left;
        const sy = e.clientY - rect.top;
        const rx = sx - pan.x;
        const ry = sy - pan.y;
        const inside = rx >= 0 && rx <= w && ry >= 0 && ry <= h;
        pendingCursorRef.current = inside
          ? { ll: unmercator(rx, ry, w, h), sx, sy }
          : { ll: null, sx, sy };
        if (cursorRafRef.current == null) {
          cursorRafRef.current = requestAnimationFrame(flushCursor);
        }
      }
    }
    if (!dragRef.current) return;
    const dx = e.clientX - dragRef.current.x;
    const dy = e.clientY - dragRef.current.y;
    if (Math.abs(dx) + Math.abs(dy) > 3) dragRef.current.moved = true;
    setPan({ x: dragRef.current.px + dx, y: dragRef.current.py + dy });
    if (tooltip) setTooltip(null);
  };
  const onMouseUp = (e?: React.MouseEvent) => {
    const moved = dragRef.current?.moved;
    dragRef.current = null;
    // If measure mode and we did NOT drag, treat as click on canvas.
    if (measureMode && !moved && e && wrapRef.current) {
      const rect = wrapRef.current.getBoundingClientRect();
      const rx = e.clientX - rect.left - pan.x;
      const ry = e.clientY - rect.top - pan.y;
      if (rx >= 0 && rx <= w && ry >= 0 && ry <= h) {
        const ll = unmercator(rx, ry, w, h);
        const next = [...measurePts, ll].slice(-2);
        setMeasurePts(next);
      }
    }
    // If company edit mode and we did NOT drag and didn't hit a pin, open create form.
    if (companyEditMode && user && !moved && e && wrapRef.current) {
      const target = e.target as HTMLElement;
      if (!target.closest('[data-no-drag]')) {
        const rect = wrapRef.current.getBoundingClientRect();
        const rx = e.clientX - rect.left - pan.x;
        const ry = e.clientY - rect.top - pan.y;
        if (rx >= 0 && rx <= w && ry >= 0 && ry <= h) {
          const ll = unmercator(rx, ry, w, h);
          setCompanyEditor({
            sx: e.clientX - rect.left,
            sy: e.clientY - rect.top,
            mode: 'create',
            initial: { lat: ll.lat, lng: ll.lng, sector: 'tech' },
          });
        }
      }
    }
  };
  // Wheel zoom — registered as a non-passive native listener (see effect below)
  // so we can preventDefault. Uses normalized factor + cursor-anchored math.
  const handleWheel = useCallback((e: WheelEvent) => {
    e.preventDefault();
    const rect = wrapRef.current?.getBoundingClientRect();
    if (!rect) return;
    const cx = e.clientX - rect.left, cy = e.clientY - rect.top;
    zoomAt(cx, cy, wheelZoomFactor(e), true);
    setTooltip(null);
  }, [zoomAt]);

  useEffect(() => {
    const el = wrapRef.current;
    if (!el) return;
    el.addEventListener('wheel', handleWheel, { passive: false });
    return () => el.removeEventListener('wheel', handleWheel);
  }, [handleWheel]);

  // Double-click to zoom in 2× at cursor; shift+dblclick zooms out.
  const handleDoubleClick = useCallback((e: React.MouseEvent) => {
    if ((e.target as HTMLElement).closest('[data-no-drag]')) return;
    const rect = wrapRef.current?.getBoundingClientRect();
    if (!rect) return;
    const cx = e.clientX - rect.left, cy = e.clientY - rect.top;
    zoomAt(cx, cy, e.shiftKey ? 0.5 : 2, true);
    setTooltip(null);
  }, [zoomAt]);

  const resetView = useCallback(() => {
    animateTo({
      zoom: 1,
      pan: { x: (view.w - baseW) / 2, y: (view.h - baseW / WORLD_ASPECT) / 2 },
    });
  }, [animateTo, baseW, view.w, view.h]);

  // Recenter map on a lat/lng (used by Inspector, Search, MiniMap, Bookmarks).
  const centerOn = useCallback((lat: number, lng: number, targetZoom?: number) => {
    const newZoom = targetZoom != null
      ? Math.max(ZOOM_MIN, Math.min(ZOOM_MAX, targetZoom))
      : zoom;
    const newW = baseW * newZoom;
    const newH = newW / WORLD_ASPECT;
    const { x, y } = mercator(lat, lng, newW, newH);
    animateTo({ zoom: newZoom, pan: { x: view.w / 2 - x, y: view.h / 2 - y } });
  }, [animateTo, baseW, view.w, view.h, zoom]);

  // ── URL-hash share view ────────────────────────────────────────────────
  // Read once on mount: if `#m=lat,lng,zoom,...` is present, hydrate camera
  // + basemap + infra subset so links round-trip the user's exact view.
  const hashHydratedRef = useRef(false);
  useEffect(() => {
    if (hashHydratedRef.current) return;
    if (!window.location.hash || baseW <= 0) return;
    const v = decodeViewHash(window.location.hash);
    if (!v) { hashHydratedRef.current = true; return; }
    hashHydratedRef.current = true;
    // Apply infra + basemap, then center.
    if (v.infraOn && v.infraOn.length) {
      const nextInfra = { ...f.infra };
      for (const k of v.infraOn) (nextInfra as any)[k] = true;
      updateF({ infra: nextInfra, basemap: v.basemap ?? f.basemap });
    } else if (v.basemap && v.basemap !== f.basemap) {
      updateF({ basemap: v.basemap });
    }
    centerOn(v.lat, v.lng, v.zoom);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [baseW]);

  // Debounced write: keep `#m=...` in sync with the current view so users
  // can copy the URL bar to share.
  useEffect(() => {
    if (baseW <= 0) return;
    const id = window.setTimeout(() => {
      const newW = baseW * zoom;
      const newH = newW / WORLD_ASPECT;
      const cx = view.w / 2 - pan.x;
      const cy = view.h / 2 - pan.y;
      const { lat, lng } = unmercator(cx, cy, newW, newH);
      const infraOn = (Object.keys(f.infra) as (keyof Map2DFilters['infra'])[])
        .filter(k => f.infra[k]);
      writeViewHash({ lat, lng, zoom, basemap: f.basemap, infraOn });
    }, 400);
    return () => clearTimeout(id);
  }, [pan.x, pan.y, zoom, baseW, view.w, view.h, f.infra, f.basemap]);


  // Keyboard cheat-sheet modal (toggled by '?'). Initialized below useEffect.
  const [showHelp, setShowHelp] = useState(false);

  // Keyboard zoom: + / − around viewport center, 0 = reset. Active only when
  // the map area has hover focus (not while typing in inputs). Also handles
  // '?' (help), 'm' (measure), 'l' (layers), and Esc (close panels).
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      const tag = (e.target as HTMLElement)?.tagName;
      if (tag === 'INPUT' || tag === 'TEXTAREA' || (e.target as HTMLElement)?.isContentEditable) return;
      if (e.key === '?' || (e.key === '/' && e.shiftKey)) { setShowHelp(v => !v); e.preventDefault(); return; }
      if (e.key === 'Escape') {
        if (showHelp) { setShowHelp(false); e.preventDefault(); return; }
        if (drawerOpen) { setDrawerOpen(false); e.preventDefault(); return; }
        if (pinned) { setPinned(null); e.preventDefault(); return; }
      }
      const el = wrapRef.current;
      if (!el || !el.matches(':hover')) return;
      const rect = el.getBoundingClientRect();
      const cx = rect.width / 2, cy = rect.height / 2;
      if (e.key === '+' || e.key === '=') { zoomAt(cx, cy, 2, true); e.preventDefault(); }
      else if (e.key === '-' || e.key === '_') { zoomAt(cx, cy, 0.5, true); e.preventDefault(); }
      else if (e.key === '0') { resetView(); e.preventDefault(); }
      else if (e.key === 'm' || e.key === 'M') { setMeasureMode(v => !v); setMeasurePts([]); e.preventDefault(); }
      else if (e.key === 'l' || e.key === 'L') { setDrawerOpen(v => !v); e.preventDefault(); }
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [zoomAt, resetView, showHelp, drawerOpen, pinned]);

  // Tooltip helpers.
  const showTip = (e: React.MouseEvent, lines: string[], color?: string) => {
    const rect = wrapRef.current?.getBoundingClientRect();
    if (!rect) return;
    setTooltip({ x: e.clientX - rect.left + 12, y: e.clientY - rect.top + 12, lines, color });
  };
  const hideTip = () => setTooltip(null);

  // Filter mutations are non-urgent: wrap in startTransition so React can keep
  // the input thread responsive while heavy memo chains rebuild.
  const updateF = useCallback((patch: Partial<Map2DFilters>) => {
    startTransition(() => setFilters({ ...f, ...patch }));
  }, [f, setFilters]);
  const toggleContinent = (c: Continent) => {
    const has = f.continents.includes(c);
    updateF({ continents: has ? f.continents.filter(x => x !== c) : [...f.continents, c] });
  };
  const toggleTOD = (k: keyof Map2DFilters['todHeat']) =>
    updateF({ todHeat: { ...f.todHeat, [k]: !f.todHeat[k] } });
  const toggleInfra = (k: keyof Map2DFilters['infra']) =>
    updateF({ infra: { ...f.infra, [k]: !f.infra[k] } });

  const filterCount =
    f.continents.length +
    (f.hemisphere !== 'all' ? 1 : 0) +
    (f.minMcapT > 0 ? 1 : 0) +
    (f.minFxVolPct > 0 ? 1 : 0) +
    (f.minStormCat > -1 ? 1 : 0) +
    (f.minEconImpact > 0 ? 1 : 0) +
    (f.minSovRisk > 0 ? 1 : 0) +
    (Object.values(f.todHeat).some(v => !v) ? 1 : 0) +
    Object.values(f.infra).filter(v => v).length;

  // Search index: built from all currently-loaded datasets.
  const searchIndex = useMemo<SearchEntry[]>(() => {
    const entries: SearchEntry[] = [];
    for (const m of markets) entries.push({ id: 'mkt-' + m.abbr, label: `${m.abbr} · ${m.name}`, category: 'market', lat: m.lat, lng: m.lng });
    const pushPts = (cat: string, pts: PointFeature[]) => {
      for (const p of pts) entries.push({ id: `${cat}-${p.id}`, label: p.name, category: cat, lat: p.lat, lng: p.lng });
    };
    pushPts('port', PORTS); pushPts('airport', AIRPORTS); pushPts('nuclear', NUCLEAR);
    pushPts('lng', LNG_TERMINALS); pushPts('refinery', REFINERIES); pushPts('oilfield', OIL_FIELDS);
    pushPts('mine', MINES); pushPts('datacenter', DATA_CENTERS); pushPts('ixp', IXPS);
    pushPts('naval', NAVAL_BASES); pushPts('strait', STRAITS); pushPts('cb', CB_HQS);
    for (const cp of CHOKEPOINTS) entries.push({ id: 'cp-' + cp.id, label: cp.name, category: 'chokepoint', lat: cp.lat, lng: cp.lng });
    return entries;
  }, [markets]);

  // Measure-tool computations.
  const measureLine = useMemo(() => {
    if (measurePts.length !== 2) return null;
    const [a, b] = measurePts;
    const pts = greatCirclePoints(a.lat, a.lng, b.lat, b.lng, 96);
    let d = '';
    let prevX: number | null = null;
    for (let i = 0; i < pts.length; i++) {
      const { x, y } = proj(pts[i].lat, pts[i].lng);
      if (prevX !== null && Math.abs(x - prevX) > w / 2) d += ` M ${x.toFixed(1)} ${y.toFixed(1)}`;
      else d += `${i === 0 ? 'M' : 'L'} ${x.toFixed(1)} ${y.toFixed(1)} `;
      prevX = x;
    }
    const km = haversineKm(a.lat, a.lng, b.lat, b.lng);
    const bearing = initialBearingDeg(a.lat, a.lng, b.lat, b.lng);
    return { d, km, nm: km * 0.539957, bearing };
  }, [measurePts, proj, w]);

  // Helper renderer for point datasets with hover/click → pin.
  const renderPoints = (
    pts: PointFeature[],
    cat: string,
    color: string,
    glyph: 'circle' | 'square' | 'triangle' | 'diamond' = 'circle',
    rBase = 1.5,
  ) => pts.map(p => {
    const pt = proj(p.lat, p.lng);
    const r = (rBase + (p.size ?? 1) * 0.45) / Math.max(1, Math.sqrt(zoom));
    const onEnter = (e: React.MouseEvent) => showTip(e, [
      p.name,
      p.meta ?? '',
      [p.operator, p.country].filter(Boolean).join(' · '),
    ].filter(Boolean), color);
    const onClick = () => setPinned({ kind: 'point', category: cat, data: p });
    const common = {
      'data-no-drag': true,
      style: { cursor: 'pointer' as const },
      onMouseEnter: onEnter,
      onMouseLeave: hideTip,
      onClick,
    };
    if (glyph === 'square') {
      return <rect key={p.id} {...common} x={pt.x - r} y={pt.y - r} width={r * 2} height={r * 2} fill={color} opacity={0.85} />;
    }
    if (glyph === 'triangle') {
      return <polygon key={p.id} {...common} points={`${pt.x},${pt.y - r} ${pt.x + r},${pt.y + r} ${pt.x - r},${pt.y + r}`} fill={color} opacity={0.85} />;
    }
    if (glyph === 'diamond') {
      return <polygon key={p.id} {...common} points={`${pt.x},${pt.y - r} ${pt.x + r},${pt.y} ${pt.x},${pt.y + r} ${pt.x - r},${pt.y}`} fill={color} opacity={0.9} />;
    }
    return <circle key={p.id} {...common} cx={pt.x} cy={pt.y} r={r} fill={color} opacity={0.9} />;
  });

  return (
    <div
      ref={wrapRef}
      className="absolute inset-0 bg-surface-deep overflow-hidden cursor-grab active:cursor-grabbing select-none"
      style={{ contain: 'layout paint style', willChange: 'transform' }}
      onMouseDown={onMouseDown}
      onMouseMove={onMouseMove}
      onMouseUp={onMouseUp}
      onMouseLeave={() => { dragRef.current = null; setTooltip(null); setCursor(null); }}
      onDoubleClick={handleDoubleClick}
    >
      {/* Raster basemap underlay (any provider except wireframe). */}
      {f.basemap !== 'wire' && (
        <TileUnderlay
          basemap={f.basemap as BasemapId}
          worldW={w} worldH={h} viewW={view.w} viewH={view.h}
          panX={pan.x} panY={pan.y} svgZoom={zoom}
          showRoads={f.roadsOverlay}
          showLabels={f.labelsOverlay}
        />
      )}

      {/* Vector layer — wrapped: rendered at pan.x-w, pan.x, pan.x+w for infinite east/west scroll */}
      {[-w, 0, w].map((dx) => (
      <svg
        key={`svg-wrap-${dx}`}
        width={w}
        height={h}
        className="block absolute"
        style={{ left: pan.x + dx, top: pan.y }}
      >
        {/* Background frame (only in wireframe mode) */}
        {f.basemap === 'wire' && (
          <rect x={0} y={0} width={w} height={h} fill="hsl(220, 30%, 4%)" />
        )}

        {/* Day/Night terminator — drawn early so all features sit on top */}
        {terminator && (() => {
          // Build a closed polygon: terminator polyline + the appropriate world-edge path.
          const pts = terminator.points.map(([lng, lat]) => proj(lat, lng));
          const left = terminator.nightSide === 'N'
            ? `L ${w} 0 L 0 0 Z` // close along the top
            : `L ${w} ${h} L 0 ${h} Z`; // close along the bottom
          let d = `M ${pts[0].x} ${pts[0].y}`;
          for (let i = 1; i < pts.length; i++) d += ` L ${pts[i].x} ${pts[i].y}`;
          d += ` ${left}`;
          return (
            <g data-no-drag>
              <path d={d} fill="hsl(220, 60%, 6%)" fillOpacity={0.45} />
              <path
                d={`M ${pts[0].x} ${pts[0].y} ${pts.slice(1).map(p => `L ${p.x} ${p.y}`).join(' ')}`}
                stroke="hsl(45, 95%, 55%)" strokeWidth={Math.max(0.6, 1.2 / zoom)}
                strokeDasharray={`${4 / zoom} ${3 / zoom}`} fill="none" opacity={0.7}
              />
            </g>
          );
        })()}

        {graticule && (
          <g stroke="hsl(220, 20%, 22%)" strokeWidth={0.4 / zoom} fill="none" opacity={0.6}>
            {graticule.map((d, i) => <path key={i} d={d} />)}
          </g>
        )}

        {/* Travel advisory choropleth (US State Dept levels 1-4) */}
        {f.infra.travelAdv && countryPaths && (
          <g>
            {countryPaths.map((c, i) => {
              const adv = TRAVEL_ADVISORY[c.iso];
              if (!adv) return null;
              const fill = advisoryColor(adv.lvl);
              if (!fill) return null;
              return (
                <path key={`adv-${i}`} d={c.d} fill={fill} fillOpacity={0.32}
                  stroke={fill} strokeOpacity={0.55} strokeWidth={Math.max(0.3, 0.6 / zoom)}
                  style={{ cursor: 'pointer' }}
                  onMouseEnter={(e) => showTip(e, [
                    `${c.name} · ${ADVISORY_LABEL[adv.lvl]}`,
                    adv.reason ?? '',
                  ].filter(Boolean), fill)}
                  onMouseLeave={hideTip} />
              );
            })}
          </g>
        )}

        {f.infra.sanctions && countryPaths && (
          <g>
            {countryPaths.filter(c => c.sanctioned).map((c, i) => {
              const intensity = sanctionsLive
                ? Math.min(0.45, 0.15 + Math.log10(Math.max(1, c.sanctionsCount)) * 0.08)
                : 0.18;
              return (
                <path key={`san-${i}`} d={c.d} fill="hsl(0, 85%, 50%)" fillOpacity={intensity}
                  stroke="hsl(0, 90%, 60%)" strokeWidth={Math.max(0.6, 1.4 / zoom)} strokeDasharray="3 2" />
              );
            })}
          </g>
        )}

        {/* Hazard zones */}
        {hazardPaths.length > 0 && (
          <g>
            {hazardPaths.map(z => (
              <path key={z.id} d={z.d}
                fill={HAZARD_COLOR.seismic} fillOpacity={0.10 + z.severity * 0.04}
                stroke={HAZARD_COLOR.seismic} strokeOpacity={0.5}
                strokeWidth={Math.max(0.5, 1 / zoom)} strokeDasharray="2 3" />
            ))}
          </g>
        )}

        {countryPaths && f.basemap === 'wire' && (
          <g fill="none" strokeLinejoin="round" strokeLinecap="round">
            {countryPaths.map((c, i) => {
              const riskHue = c.risk > 0
                ? `hsl(${Math.max(0, 60 - c.risk * 0.6)}, 80%, ${50 + c.risk * 0.15}%)`
                : 'hsl(195, 70%, 55%)';
              return (
                <path
                  key={i}
                  d={c.d}
                  stroke={riskHue}
                  strokeWidth={Math.max(0.35, (c.risk > 50 ? 0.9 : 0.5) / zoom)}
                  opacity={c.risk > 0 ? 0.85 : 0.42}
                />
              );
            })}
          </g>
        )}
        {countryPaths && f.basemap === 'sat' && (
          <g fill="none">
            {countryPaths.filter(c => c.risk > 0).map((c, i) => {
              const riskHue = `hsl(${Math.max(0, 60 - c.risk * 0.6)}, 95%, 60%)`;
              return <path key={i} d={c.d} stroke={riskHue} strokeWidth={Math.max(0.8, 1.4 / Math.sqrt(zoom))} opacity={0.9} />;
            })}
          </g>
        )}

        {/* Transparent country hit-areas → click opens Country Detail Drawer */}
        {countryPaths && (
          <g data-no-drag>
            {countryPaths.map((c, i) => (
              <path
                key={`hit-${i}`}
                d={c.d}
                fill="transparent"
                stroke="transparent"
                style={{ cursor: 'pointer', pointerEvents: 'fill' }}
                onClick={(e) => {
                  e.stopPropagation();
                  if (c.iso) setSelectedCountry({ iso: c.iso, name: c.name });
                }}
              />
            ))}
          </g>
        )}

        {/* ─── Macro choropleths (FX heat / Sov Yield / Policy-Rate · CPI · Real Yield / ETF Flows / Carbon Markets) ── */}
        {countryPaths && (f.infra.fxHeat || f.infra.sovYield || f.infra.macroChoro || f.infra.etfFlows || f.infra.carbonMarkets) && (
          <g>
            {countryPaths.map((c, i) => {
              let fill: string | null = null;
              let lines: string[] = [];
              if (f.infra.fxHeat) {
                const ccy = COUNTRY_CCY[c.iso];
                const r = ccy ? fxByCcy[ccy] : undefined;
                if (r) {
                  fill = fxHeatColor(r.change_pct);
                  lines = [`${c.name} · ${ccy}/USD`, `${(r.change_pct ?? 0) >= 0 ? '+' : ''}${(r.change_pct ?? 0).toFixed(2)}% 24h`];
                }
              } else if (f.infra.sovYield) {
                const y = SOV_YIELD_10Y[c.iso];
                if (y) {
                  fill = yieldColor(y.lvl);
                  lines = [`${c.name} · 10Y Yield`, `${y.lvl.toFixed(2)}% · ${y.chg1m >= 0 ? '+' : ''}${y.chg1m.toFixed(2)} 1M`];
                }
              } else if (f.infra.carbonMarkets) {
                const ets = ETS_BY_ISO[c.iso];
                if (ets) {
                  fill = carbonPriceColor(ets.priceUsd, ets.status);
                  lines = [`${c.name} · ${ets.scheme}`, `$${ets.priceUsd}/t CO₂ · ${ets.status}${ets.emissionsMtCO2 ? ' · ' + ets.emissionsMtCO2 + ' Mt covered' : ''}`];
                }
              } else if (f.infra.macroChoro) {
                if (f.macroMetric === 'milSpend') {
                  const lvl = MILITARY_SPEND_GDP[c.iso];
                  if (lvl != null) {
                    fill = milSpendColor(lvl);
                    lines = [`${c.name} · Military Spending`, `${lvl.toFixed(1)}% of GDP (SIPRI 2024)`];
                  }
                } else if (f.macroMetric === 'reserves') {
                  const months = FX_RESERVES_MONTHS[c.iso];
                  if (months != null) {
                    fill = reservesColor(months);
                    const label = months >= 12 ? 'Ample' : months >= 6 ? 'Adequate' : months >= 3 ? 'Thin' : 'Scarce';
                    lines = [`${c.name} · FX Reserves`, `${months} months import cover · ${label}`];
                  }
                } else if (f.macroMetric === 'realY') {
                  const y = SOV_YIELD_10Y[c.iso];
                  const cpi = CPI_YOY[c.iso];
                  if (y && cpi) {
                    const real = y.lvl - cpi.lvl;
                    fill = realYieldColor(real);
                    lines = [`${c.name} · Real 10Y`, `${real >= 0 ? '+' : ''}${real.toFixed(2)}% (10Y ${y.lvl.toFixed(2)} − CPI ${cpi.lvl.toFixed(2)})`];
                  }
                } else if (f.macroMetric === 'gdp') {
                  const src = GDP_GROWTH[c.iso];
                  if (src) {
                    fill = gdpColor(src.lvl);
                    const arrow = src.chg1y > 0 ? '▲' : src.chg1y < 0 ? '▼' : '·';
                    lines = [`${c.name} · GDP Growth`, `${src.lvl >= 0 ? '+' : ''}${src.lvl.toFixed(1)}% YoY ${arrow} ${src.chg1y >= 0 ? '+' : ''}${src.chg1y.toFixed(1)} 1Y`];
                  }
                } else if (f.macroMetric === 'unemp') {
                  const src = UNEMPLOYMENT[c.iso];
                  if (src) {
                    fill = unemployColor(src.lvl);
                    const arrow = src.chg1y > 0 ? '▲' : src.chg1y < 0 ? '▼' : '·';
                    lines = [`${c.name} · Unemployment`, `${src.lvl.toFixed(1)}% ${arrow} ${src.chg1y >= 0 ? '+' : ''}${src.chg1y.toFixed(1)} 1Y`];
                  }
                } else if (f.macroMetric === 'debt') {
                  const lvl = DEBT_GDP[c.iso];
                  if (lvl != null) {
                    fill = debtGdpColor(lvl);
                    lines = [`${c.name} · Govt Debt/GDP`, `${lvl.toFixed(0)}% of GDP`];
                  }
                } else if (f.macroMetric === 'ca') {
                  const lvl = CURRENT_ACCOUNT[c.iso];
                  if (lvl != null) {
                    fill = currentAccountColor(lvl);
                    lines = [`${c.name} · Current Account`, `${lvl >= 0 ? '+' : ''}${lvl.toFixed(1)}% of GDP · ${lvl >= 0 ? 'Surplus' : 'Deficit'}`];
                  }
                } else if (f.macroMetric === 'pmi') {
                  const src = MFG_PMI[c.iso];
                  if (src) {
                    fill = pmiColor(src.lvl);
                    const arrow = src.chg1m > 0 ? '▲' : src.chg1m < 0 ? '▼' : '·';
                    lines = [`${c.name} · Mfg PMI`, `${src.lvl.toFixed(1)} ${arrow} ${src.chg1m >= 0 ? '+' : ''}${src.chg1m.toFixed(1)} 1M · ${src.lvl >= 50 ? 'Expansion' : 'Contraction'}`];
                  }
                } else {
                  const src = f.macroMetric === 'rate' ? POLICY_RATE[c.iso] : CPI_YOY[c.iso];
                  if (src) {
                    fill = macroLevelColor(src.lvl);
                    const d = src.chg1y;
                    const lbl = f.macroMetric === 'rate' ? 'Policy Rate' : 'CPI YoY';
                    const arrow = d > 0 ? '▲' : d < 0 ? '▼' : '·';
                    lines = [`${c.name} · ${lbl}`, `${src.lvl.toFixed(2)}% ${arrow} ${d >= 0 ? '+' : ''}${d.toFixed(2)} 1Y`];
                  }
                }
              } else if (f.infra.etfFlows) {
                const e = ETF_FLOWS_1W[c.iso];
                if (e) {
                  fill = etfFlowColor(e.netUsdM);
                  const sign = e.netUsdM >= 0 ? '+' : '';
                  lines = [`${c.name} · ${e.etf}`, `${sign}$${e.netUsdM.toFixed(0)}M 1W net · AUM $${e.aumUsdB.toFixed(1)}B`];
                }
              }
              if (!fill) return null;
              return (
                <path key={`macro-${i}`} d={c.d} fill={fill}
                  stroke="hsl(220, 30%, 14%)" strokeWidth={Math.max(0.3, 0.5 / zoom)}
                  style={{ cursor: 'pointer' }}
                  onMouseEnter={(e) => showTip(e, lines, fill!)}
                  onMouseLeave={hideTip} />
              );
            })}
          </g>
        )}

        {/* Commodity flow arcs */}
        {commodityArcs.length > 0 && (
          <g fill="none" data-no-drag>
            {commodityArcs.map(a => (
              <path key={a.id} d={a.d} stroke={a.color}
                strokeWidth={(0.6 + a.volume * 2.4) / Math.sqrt(zoom)}
                opacity={0.65} strokeDasharray={`${6 / zoom} ${3 / zoom}`}
                style={{ cursor: 'pointer', pointerEvents: 'visibleStroke' }}
                onMouseEnter={(e) => showTip(e, [
                  `${COMMODITY_LABEL[a.commodity]} · ${a.fromName} → ${a.toName}`,
                  `Relative volume ${(a.volume * 100).toFixed(0)}%`,
                ], a.color)}
                onMouseLeave={hideTip} />
            ))}
          </g>
        )}

        {/* Sovereign 5Y CDS bubbles */}
        {f.infra.sovCDS && (
          <g data-no-drag>
            {SOV_CDS_5Y.map(c => {
              const pt = proj(c.lat, c.lng);
              const r = (2 + Math.sqrt(c.bps) * 0.35) / Math.sqrt(zoom);
              const col = cdsColor(c.bps);
              return (
                <g key={`cds-${c.iso}`} style={{ cursor: 'pointer' }}
                  onMouseEnter={(e) => showTip(e, [`${c.iso} · ${c.capital}`, `5Y CDS ${c.bps} bps`], col)}
                  onMouseLeave={hideTip}>
                  <circle cx={pt.x} cy={pt.y} r={r * 1.8} fill={col} opacity={0.18} />
                  <circle cx={pt.x} cy={pt.y} r={r} fill={col} opacity={0.85}
                    stroke="hsl(0, 0%, 0%)" strokeWidth={r * 0.18} />
                </g>
              );
            })}
          </g>
        )}

        {/* Equity Pulse bubbles */}
        {f.infra.equityPulse && markets.map(m => {
          const q = indicesByAbbr[m.abbr];
          if (!q) return null;
          const pt = proj(m.lat, m.lng);
          const mcap = q.mcap_usd_t ?? 0.5;
          const pct = q.change_pct ?? 0;
          const r = (3 + Math.sqrt(Math.max(0.1, mcap)) * 2.4) / Math.sqrt(zoom);
          const col = pct >= 0 ? 'hsl(150, 80%, 55%)' : 'hsl(0, 85%, 60%)';
          return (
            <g key={`eqp-${m.abbr}`} data-no-drag style={{ cursor: 'pointer' }}
              onMouseEnter={(e) => showTip(e, [
                `${m.abbr} · ${m.name}`,
                `${pct >= 0 ? '+' : ''}${pct.toFixed(2)}% · $${mcap.toFixed(1)}T mcap`,
              ], col)}
              onMouseLeave={hideTip}>
              <circle cx={pt.x} cy={pt.y} r={r * 1.6} fill={col} opacity={0.14} />
              <circle cx={pt.x} cy={pt.y} r={r} fill={col} opacity={0.85}
                stroke="hsl(0, 0%, 0%)" strokeWidth={r * 0.16} />
            </g>
          );
        })}

        {/* Shipping Lanes (curated polylines, antimeridian-safe) */}
        {f.infra.shipLanes && (
          <g fill="none" data-no-drag>
            {SHIPPING_LANES.map(lane => {
              let d = '';
              let prevX: number | null = null;
              for (let i = 0; i < lane.path.length; i++) {
                const [lng, lat] = lane.path[i];
                const { x, y } = proj(lat, lng);
                if (prevX !== null && Math.abs(x - prevX) > w / 2) d += ` M ${x.toFixed(1)} ${y.toFixed(1)}`;
                else d += `${i === 0 ? 'M' : 'L'} ${x.toFixed(1)} ${y.toFixed(1)} `;
                prevX = x;
              }
              return (
                <path key={lane.id} d={d} stroke="hsl(195, 90%, 65%)"
                  strokeWidth={1.4 / Math.sqrt(zoom)} opacity={0.55}
                  strokeDasharray={`${4 / zoom} ${3 / zoom}`}
                  style={{ cursor: 'pointer', pointerEvents: 'visibleStroke' }}
                  onMouseEnter={(e) => showTip(e, [lane.name, 'Major shipping corridor'], 'hsl(195, 90%, 65%)')}
                  onMouseLeave={hideTip} />
              );
            })}
          </g>
        )}

        {/* Chokepoint Stress (pulsing dots) */}
        {f.infra.chokeStress && (
          <g data-no-drag>
            {CHOKEPOINT_STRESS.map(cp => {
              const pt = proj(cp.lat, cp.lng);
              const r = (3 + (cp.stress / 100) * 6) / Math.sqrt(zoom);
              const col = chokeStressColor(cp.stress);
              return (
                <g key={`choke-${cp.id}`} style={{ cursor: 'pointer' }}
                  onMouseEnter={(e) => showTip(e, [
                    `${cp.name} · stress ${cp.stress}/100`,
                    cp.crudePct ? `~${cp.crudePct}% seaborne crude` : '',
                    cp.notes,
                  ].filter(Boolean), col)}
                  onMouseLeave={hideTip}>
                  <circle cx={pt.x} cy={pt.y} r={r * 2.2} fill={col} opacity={0.16}>
                    <animate attributeName="r" values={`${r * 1.6};${r * 2.6};${r * 1.6}`} dur="2.4s" repeatCount="indefinite" />
                    <animate attributeName="opacity" values="0.10;0.28;0.10" dur="2.4s" repeatCount="indefinite" />
                  </circle>
                  <circle cx={pt.x} cy={pt.y} r={r} fill={col} opacity={0.92}
                    stroke="hsl(0, 0%, 0%)" strokeWidth={r * 0.18} />
                </g>
              );
            })}
          </g>
        )}

        {/* FX Carry bubbles (size = |carry|, color = sign) */}
        {f.infra.fxCarry && (
          <g data-no-drag>
            {FX_CARRY.map(c => {
              const pt = proj(c.lat, c.lng);
              const r = (2 + Math.sqrt(Math.abs(c.carryBps)) * 0.30) / Math.sqrt(zoom);
              const col = carryColor(c.carryBps);
              const sign = c.carryBps >= 0 ? '+' : '';
              return (
                <g key={`carry-${c.iso}`} style={{ cursor: 'pointer' }}
                  onMouseEnter={(e) => showTip(e, [
                    `${c.iso} · ${c.capital}`,
                    `Carry vs USD ${sign}${c.carryBps} bps`,
                    `1m vol ${c.vol1m.toFixed(1)}%`,
                  ], col)}
                  onMouseLeave={hideTip}>
                  <circle cx={pt.x} cy={pt.y} r={r * 1.7} fill={col} opacity={0.16} />
                  <circle cx={pt.x} cy={pt.y} r={r} fill={col} opacity={0.88}
                    stroke="hsl(0, 0%, 0%)" strokeWidth={r * 0.18} />
                </g>
              );
            })}
          </g>
        )}

        {/* Crypto Liquidity Hubs + Stablecoin Corridors */}
        {f.infra.cryptoHubs && (
          <g data-no-drag>
            {STABLECOIN_CORRIDORS.map(s => {
              const pts = greatCirclePoints(s.from[1], s.from[0], s.to[1], s.to[0], 48);
              let d = '';
              let prevX: number | null = null;
              for (let i = 0; i < pts.length; i++) {
                const { x, y } = proj(pts[i].lat, pts[i].lng);
                if (prevX !== null && Math.abs(x - prevX) > w / 2) d += ` M ${x.toFixed(1)} ${y.toFixed(1)}`;
                else d += `${i === 0 ? 'M' : 'L'} ${x.toFixed(1)} ${y.toFixed(1)} `;
                prevX = x;
              }
              return (
                <path key={`stbl-${s.id}`} d={d} stroke="hsl(33, 100%, 60%)" fill="none"
                  strokeWidth={(0.6 + s.intensity * 1.8) / Math.sqrt(zoom)} opacity={0.55}
                  strokeDasharray={`${3 / zoom} ${2 / zoom}`}
                  style={{ cursor: 'pointer', pointerEvents: 'visibleStroke' }}
                  onMouseEnter={(e) => showTip(e, [s.label, `Intensity ${(s.intensity * 100).toFixed(0)}%`], 'hsl(33, 100%, 60%)')}
                  onMouseLeave={hideTip} />
              );
            })}
            {CRYPTO_HUBS.map(h => {
              const pt = proj(h.lat, h.lng);
              const r = (2 + Math.sqrt(h.sharePct) * 1.2) / Math.sqrt(zoom);
              const col = CRYPTO_HUB_COLOR[h.kind];
              return (
                <g key={`crypto-${h.id}`} style={{ cursor: 'pointer' }}
                  onMouseEnter={(e) => showTip(e, [h.name, `~${h.sharePct}% 24h share · ${h.kind}`], col)}
                  onMouseLeave={hideTip}>
                  <rect x={pt.x - r} y={pt.y - r} width={r * 2} height={r * 2}
                    fill={col} opacity={0.85}
                    stroke="hsl(0, 0%, 0%)" strokeWidth={r * 0.18}
                    transform={`rotate(45 ${pt.x} ${pt.y})`} />
                </g>
              );
            })}
          </g>
        )}



        {/* Sanctions network arcs (animated, tier-colored) */}
        {sanctionArcs.length > 0 && (
          <g fill="none" data-no-drag>
            {sanctionArcs.map(a => (
              <path key={`san-arc-${a.id}`} d={a.d} stroke={a.color}
                strokeWidth={Math.max(0.8, 1.4 / Math.sqrt(zoom))}
                opacity={0.75} strokeDasharray={`${5 / zoom} ${4 / zoom}`}
                style={{ cursor: 'pointer', pointerEvents: 'visibleStroke' }}
                onMouseEnter={(e) => showTip(e, [
                  `${a.body} → ${a.iso} · ${a.capital}`,
                  `${a.bodyName}`,
                  `Tier: ${a.tier}`,
                ], a.color)}
                onMouseLeave={hideTip}>
                <animate attributeName="stroke-dashoffset" from="0" to={-30}
                  dur="1.6s" repeatCount="indefinite" />
              </path>
            ))}
          </g>
        )}

        {/* ACLED conflict heat clusters (red radial gradient, additive blend) */}
        {acledClusters.length > 0 && (
          <g data-no-drag style={{ mixBlendMode: 'screen' }}>
            {acledClusters.map((c, i) => {
              const pt = proj(c.lat, c.lng);
              const r = (8 + Math.sqrt(c.fatalities + c.count) * 3) / Math.sqrt(zoom);
              const intensity = Math.min(0.7, 0.25 + Math.log10(1 + c.fatalities) * 0.15);
              return (
                <g key={`acled-${i}`}>
                  <circle cx={pt.x} cy={pt.y} r={r * 2.2} fill="hsl(0, 90%, 50%)" opacity={intensity * 0.25} />
                  <circle cx={pt.x} cy={pt.y} r={r}
                    fill="hsl(0, 95%, 55%)" opacity={intensity}
                    style={{ cursor: 'pointer' }}
                    onMouseEnter={(e) => showTip(e, [
                      `Conflict cluster · ${c.count} event${c.count > 1 ? 's' : ''}`,
                      `${c.fatalities} fatalities (${f.geoWindow})`,
                      ...c.sample.slice(0, 2),
                    ], 'hsl(0, 95%, 55%)')}
                    onMouseLeave={hideTip} />
                </g>
              );
            })}
          </g>
        )}

        {/* GDELT news-tone bubbles */}
        {gdeltBubbles.length > 0 && (
          <g data-no-drag>
            {gdeltBubbles.map((c, i) => {
              const pt = proj(c.lat, c.lng);
              const r = (2 + Math.sqrt(c.count) * 0.9) / Math.sqrt(zoom);
              // tone: -10 (negative) → magenta; +10 (positive) → cyan
              const t = Math.max(-10, Math.min(10, c.avgTone));
              const hue = t < 0 ? 320 : 195;
              const sat = 75 + Math.min(20, Math.abs(t) * 2);
              const col = `hsl(${hue}, ${sat}%, 60%)`;
              return (
                <g key={`gdt-${i}`} style={{ cursor: 'pointer' }}
                  onMouseEnter={(e) => showTip(e, [
                    `News density · ${c.count} events`,
                    `Avg tone ${t >= 0 ? '+' : ''}${t.toFixed(1)}`,
                    ...(c.sample?.slice(0, 2) ?? []),
                  ], col)}
                  onMouseLeave={hideTip}>
                  <circle cx={pt.x} cy={pt.y} r={r * 1.6} fill={col} opacity={0.18} />
                  <circle cx={pt.x} cy={pt.y} r={r} fill={col} opacity={0.75}
                    stroke="hsl(0,0%,0%)" strokeWidth={r * 0.15} />
                </g>
              );
            })}
          </g>
        )}

        {/* Election calendar pins (capital + days countdown badge) */}
        {f.infra.elections && (
          <g data-no-drag>
            {ELECTIONS.map(e => {
              const days = daysUntil(e.date);
              if (days < -7 || days > 540) return null;
              const pt = proj(e.lat, e.lng);
              const col = electionPinColor(days);
              const r = 3 / Math.sqrt(zoom);
              const badge = days < 0 ? 'PAST' : days < 1000 ? `D${days}` : '';
              return (
                <g key={`elec-${e.id}`} style={{ cursor: 'pointer' }}
                  onMouseEnter={(ev) => showTip(ev, [
                    `${e.country} · ${e.type}`,
                    `${e.date} · ${days >= 0 ? `in ${days} days` : `${-days} days ago`}`,
                    e.notes ?? '',
                  ].filter(Boolean), col)}
                  onMouseLeave={hideTip}>
                  <circle cx={pt.x} cy={pt.y} r={r * 1.8} fill={col} opacity={0.22} />
                  <circle cx={pt.x} cy={pt.y} r={r} fill={col}
                    stroke="hsl(0,0%,0%)" strokeWidth={r * 0.2} />
                  <rect x={pt.x + r + 2} y={pt.y - 5} width={badge.length * 4 + 4} height={8}
                    fill="hsl(220,30%,8%)" stroke={col} strokeWidth={0.5} />
                  <text x={pt.x + r + 4} y={pt.y + 1.3} fontSize={6} fontFamily="monospace"
                    fill={col} style={{ pointerEvents: 'none' }}>{badge}</text>
                </g>
              );
            })}
          </g>
        )}

        {/* Trade-flow arcs */}
        {tradeArcs.length > 0 && (
          <g fill="none" data-no-drag>
            {tradeArcs.map(t => (
              <path
                key={t.id}
                d={t.d}
                stroke={t.color}
                strokeWidth={Math.max(0.4, Math.min(2.5, t.valueUsdB / 200)) / Math.sqrt(zoom)}
                opacity={0.55}
                style={{ cursor: 'pointer', pointerEvents: 'visibleStroke' }}
                onMouseEnter={(e) => showTip(e, [
                  `Trade: ${t.from} → ${t.to}`,
                  `$${t.valueUsdB}B/yr · ${t.cat.toUpperCase()}`,
                ], t.color)}
                onMouseLeave={hideTip}
              />
            ))}
          </g>
        )}

        {/* Infrastructure: pipelines / fiber / HV */}
        {infraLines.length > 0 && (
          <g fill="none" data-no-drag>
            {infraLines.map(({ line, color, dash, cat }) => (
              <path
                key={line.id}
                d={lineToPath(line)}
                stroke={color}
                strokeWidth={Math.max(0.6, 2 / Math.sqrt(zoom))}
                strokeDasharray={dash}
                opacity={0.85}
                style={{ cursor: 'pointer', pointerEvents: 'visibleStroke' }}
                onMouseEnter={(e) => showTip(e, [
                  line.name,
                  `${line.category.toUpperCase()}${line.capacity ? ' · ' + line.capacity : ''}`,
                  line.status ? `Status: ${line.status}` : '',
                ].filter(Boolean), color)}
                onMouseLeave={hideTip}
                onClick={() => setPinned({ kind: 'line', category: cat, data: line })}
              />
            ))}
          </g>
        )}

        {/* Chokepoints (legacy) + Straits */}
        {flags.chokepoints && (
          <g data-no-drag>
            {CHOKEPOINTS.map(cp => {
              const p = proj(cp.lat, cp.lng);
              return (
                <g key={cp.id} style={{ cursor: 'pointer' }}
                  onMouseEnter={(e) => showTip(e, [`Chokepoint: ${cp.name}`], 'hsl(45, 95%, 60%)')}
                  onMouseLeave={hideTip}>
                  <circle cx={p.x} cy={p.y} r={5 / zoom} fill="none" stroke="hsl(45, 95%, 60%)" strokeWidth={1 / zoom} />
                  <circle cx={p.x} cy={p.y} r={2 / zoom} fill="hsl(45, 95%, 60%)" />
                </g>
              );
            })}
          </g>
        )}
        {f.infra.straits && (
          <g data-no-drag>
            {STRAITS.map(s => {
              const p = proj(s.lat, s.lng);
              const col = STATUS_COLOR[s.status ?? 'CLEAR'] ?? 'hsl(45, 95%, 60%)';
              const r = (3 + (s.size ?? 3) * 0.5) / Math.sqrt(zoom);
              return (
                <g key={s.id} style={{ cursor: 'pointer' }}
                  onMouseEnter={(e) => showTip(e, [`⚓ ${s.name}`, s.meta ?? '', `Status: ${s.status ?? '—'}`], col)}
                  onMouseLeave={hideTip}
                  onClick={() => setPinned({ kind: 'point', category: 'strait', data: s })}>
                  <circle cx={p.x} cy={p.y} r={r + 3 / zoom} fill="none" stroke={col} strokeWidth={Math.max(0.6, 1 / zoom)} />
                  <circle cx={p.x} cy={p.y} r={r} fill={col} opacity={0.8} />
                </g>
              );
            })}
          </g>
        )}

        {/* FX arcs */}
        {flags.fxFlows && (
          <g fill="none" data-no-drag>
            {fxArcs.map(a => (
              <path key={a.key} d={a.d} stroke={a.color}
                strokeWidth={Math.min(3, 0.5 + Math.abs(a.pct) * 0.4) / Math.sqrt(zoom)}
                opacity={0.75}
                style={{ cursor: 'pointer', pointerEvents: 'visibleStroke' }}
                onMouseEnter={(e) => showTip(e, [`FX ${a.base}/${a.quote}`, `${a.pct >= 0 ? '+' : ''}${a.pct.toFixed(2)}% 24h`], a.color)}
                onMouseLeave={hideTip}
              />
            ))}
          </g>
        )}

        {/* Storms */}
        {flags.storms && visibleStorms.map(s => {
          const eye = proj(s.lat, s.lng);
          let trackD = `M ${eye.x} ${eye.y}`;
          let prevX = eye.x;
          for (const p of s.forecast) {
            const pt = proj(p.lat, p.lng);
            if (Math.abs(pt.x - prevX) > w / 2) trackD += ` M ${pt.x} ${pt.y}`;
            else trackD += ` L ${pt.x} ${pt.y}`;
            prevX = pt.x;
          }
          const color = stormColor(s.category);
          const r = (3 + Math.max(0, s.category) * 1.4) / Math.sqrt(zoom);

          // Cone of uncertainty (NHC climatology) — geometry pre-computed
          const cone = stormCones.get(s.id) ?? [];
          let coneD = '';
          if (cone.length > 2) {
            let prevPX = 0;
            for (let i = 0; i < cone.length; i++) {
              const p = proj(cone[i].lat, cone[i].lng);
              if (i === 0) { coneD += `M ${p.x.toFixed(1)} ${p.y.toFixed(1)}`; }
              else if (Math.abs(p.x - prevPX) > w / 2) coneD += ` M ${p.x.toFixed(1)} ${p.y.toFixed(1)}`;
              else coneD += ` L ${p.x.toFixed(1)} ${p.y.toFixed(1)}`;
              prevPX = p.x;
            }
            coneD += ' Z';
          }

          return (
            <g key={s.id} data-no-drag style={{ cursor: 'pointer' }}
              onMouseEnter={(e) => showTip(e, [
                `${s.name} · ${s.category >= 1 ? 'CAT' + s.category : s.classification}`,
                `Wind: ${s.windKt} kt · Basin: ${s.basin}`,
                cone.length > 2 ? '5-day cone · NHC climatology' : '',
              ].filter(Boolean), color)}
              onMouseLeave={hideTip}
              onClick={() => setPinned({ kind: 'storm', data: s })}>
              {coneD && (
                <path d={coneD} fill={color} fillOpacity={0.10}
                  stroke={color} strokeOpacity={0.35} strokeWidth={0.6 / zoom} />
              )}
              <path d={trackD} stroke={color} strokeWidth={1.2 / zoom} strokeDasharray={`${3 / zoom} ${2 / zoom}`} opacity={0.7} fill="none" />
              <circle cx={eye.x} cy={eye.y} r={r} fill={color} opacity={0.85} />
              <circle cx={eye.x} cy={eye.y} r={r + 3 / zoom} fill="none" stroke={color} strokeWidth={1 / zoom} opacity={0.5} />
            </g>
          );
        })}

        {/* Econ pins */}
        {flags.econPins && visibleEcon.map(p => {
          const pt = proj(p.lat, p.lng);
          const color = p.impact === 'HIGH' ? 'hsl(0, 90%, 60%)' : (p.impact as string) === 'MED' ? 'hsl(35, 95%, 60%)' : 'hsl(195, 70%, 55%)';
          return (
            <g key={p.id} data-no-drag style={{ cursor: 'pointer' }}
              onMouseEnter={(e) => showTip(e, [`${p.country} · ${p.event}`, `Impact: ${p.impact}`], color)}
              onMouseLeave={hideTip}
              onClick={() => setPinned({ kind: 'econ', data: p })}>
              <circle cx={pt.x} cy={pt.y} r={(p.impact === 'HIGH' ? 4 : 3) / zoom} fill={color} opacity={0.9} />
              <line x1={pt.x} y1={pt.y} x2={pt.x} y2={pt.y - 10 / zoom} stroke={color} strokeWidth={1 / zoom} opacity={0.6} />
            </g>
          );
        })}

        {/* Energy points */}
        {f.infra.lng && <g>{renderPoints(LNG_TERMINALS, 'lng', 'hsl(48, 95%, 60%)', 'diamond', 1.6)}</g>}
        {f.infra.refineries && <g>{renderPoints(REFINERIES, 'refinery', 'hsl(28, 95%, 55%)', 'square', 1.5)}</g>}
        {f.infra.oilfields && <g>{renderPoints(OIL_FIELDS, 'oilfield', 'hsl(15, 80%, 50%)', 'circle', 1.7)}</g>}

        {/* Mining */}
        {f.infra.mines && MINES.map(m => {
          const pt = proj(m.lat, m.lng);
          const r = (1.6 + (m.size ?? 1) * 0.4) / Math.max(1, Math.sqrt(zoom));
          const color = COMMODITY_COLOR[m.commodity ?? 'gold'] ?? 'hsl(40, 80%, 55%)';
          return (
            <g key={m.id} data-no-drag style={{ cursor: 'pointer' }}
              onMouseEnter={(e) => showTip(e, [m.name, m.meta ?? '', m.commodity?.toUpperCase() ?? ''], color)}
              onMouseLeave={hideTip}
              onClick={() => setPinned({ kind: 'point', category: 'mine', data: m })}>
              <polygon points={`${pt.x},${pt.y - r} ${pt.x + r},${pt.y + r * 0.4} ${pt.x + r * 0.6},${pt.y + r} ${pt.x - r * 0.6},${pt.y + r} ${pt.x - r},${pt.y + r * 0.4}`} fill={color} opacity={0.9} />
            </g>
          );
        })}

        {/* Digital */}
        {f.infra.datacenters && <g>{renderPoints(DATA_CENTERS, 'datacenter', 'hsl(195, 90%, 60%)', 'square', 1.3)}</g>}
        {f.infra.ixps && <g>{renderPoints(IXPS, 'ixp', 'hsl(220, 90%, 70%)', 'diamond', 1.4)}</g>}

        {/* Naval bases */}
        {f.infra.naval && NAVAL_BASES.map(n => {
          const pt = proj(n.lat, n.lng);
          const r = (1.6 + (n.size ?? 1) * 0.45) / Math.max(1, Math.sqrt(zoom));
          return (
            <g key={n.id} data-no-drag style={{ cursor: 'pointer' }}
              onMouseEnter={(e) => showTip(e, [`⚓ ${n.name}`, n.meta ?? '', n.country ?? ''], 'hsl(0, 80%, 55%)')}
              onMouseLeave={hideTip}
              onClick={() => setPinned({ kind: 'point', category: 'naval', data: n })}>
              <polygon points={`${pt.x - r},${pt.y - r} ${pt.x + r},${pt.y - r} ${pt.x},${pt.y + r * 1.2}`} fill="hsl(0, 80%, 55%)" opacity={0.85} />
            </g>
          );
        })}

        {/* CB HQs */}
        {f.infra.cbHqs && CB_HQS.map(c => {
          const pt = proj(c.lat, c.lng);
          const r = (2 + (c.size ?? 3) * 0.5) / Math.max(1, Math.sqrt(zoom));
          return (
            <g key={c.id} data-no-drag style={{ cursor: 'pointer' }}
              onMouseEnter={(e) => showTip(e, [`🏦 ${c.name}`, c.meta ?? ''], 'hsl(33, 100%, 55%)')}
              onMouseLeave={hideTip}
              onClick={() => setPinned({ kind: 'point', category: 'cb', data: c })}>
              <rect x={pt.x - r} y={pt.y - r} width={r * 2} height={r * 2} fill="none" stroke="hsl(33, 100%, 55%)" strokeWidth={Math.max(0.6, 1.2 / zoom)} />
              <circle cx={pt.x} cy={pt.y} r={r * 0.5} fill="hsl(33, 100%, 55%)" />
            </g>
          );
        })}

        {/* Wildfire hotspots */}
        {f.infra.wildfires && WILDFIRE_HOTSPOTS.map(p => {
          const pt = proj(p.lat, p.lng);
          const r = (2 + (p.size ?? 3) * 0.6) / Math.max(1, Math.sqrt(zoom));
          return (
            <g key={p.id} data-no-drag style={{ cursor: 'pointer' }}
              onMouseEnter={(e) => showTip(e, [`🔥 ${p.name}`, p.meta ?? ''], 'hsl(15, 95%, 55%)')}
              onMouseLeave={hideTip}
              onClick={() => setPinned({ kind: 'point', category: 'wildfire', data: p })}>
              <circle cx={pt.x} cy={pt.y} r={r * 1.6} fill="hsl(15, 95%, 55%)" opacity={0.18} />
              <circle cx={pt.x} cy={pt.y} r={r} fill="hsl(15, 95%, 55%)" opacity={0.9} />
            </g>
          );
        })}

        {/* Nuclear */}
        {f.infra.nuclear && NUCLEAR.map(n => {
          const pt = proj(n.lat, n.lng);
          const r = (2 + (n.size ?? 1) * 0.6) / Math.max(1, Math.sqrt(zoom));
          return (
            <g key={n.id} data-no-drag style={{ cursor: 'pointer' }}
              onMouseEnter={(e) => showTip(e, [`☢ ${n.name}`, n.meta ?? ''], 'hsl(280, 75%, 65%)')}
              onMouseLeave={hideTip}
              onClick={() => setPinned({ kind: 'point', category: 'nuclear', data: n })}>
              <circle cx={pt.x} cy={pt.y} r={r + 2 / zoom} fill="none" stroke="hsl(280, 75%, 65%)" strokeWidth={Math.max(0.5, 0.8 / zoom)} />
              <circle cx={pt.x} cy={pt.y} r={r} fill="hsl(280, 75%, 65%)" opacity={0.85} />
            </g>
          );
        })}

        {/* Ports */}
        {f.infra.ports && <g>{renderPoints(PORTS, 'port', 'hsl(195, 90%, 60%)', 'square', 1.5)}</g>}

        {/* Airports */}
        {f.infra.airports && <g>{renderPoints(AIRPORTS, 'airport', 'hsl(165, 80%, 55%)', 'triangle', 1.4)}</g>}

        {/* Weather field (heat-cells, drawn under everything else above features) */}
        {f.infra.weather && (
          <g data-no-drag opacity={0.45}>
            {WEATHER_FIELDS[f.weatherMetric].map((c, i) => {
              const tl = proj(c.lat + WEATHER_STEP / 2, c.lng - WEATHER_STEP / 2);
              const br = proj(c.lat - WEATHER_STEP / 2, c.lng + WEATHER_STEP / 2);
              const ww = br.x - tl.x; const hh = br.y - tl.y;
              if (ww <= 0 || hh <= 0) return null;
              return <rect key={i} x={tl.x} y={tl.y} width={ww} height={hh} fill={weatherColor(f.weatherMetric, c.v)} />;
            })}
          </g>
        )}

        {/* Climate-risk choropleth */}
        {f.infra.climateRisk && (
          <g data-no-drag opacity={0.45}>
            {RISK_FIELDS[f.climateMetric].map((c, i) => {
              const tl = proj(c.lat + RISK_STEP / 2, c.lng - RISK_STEP / 2);
              const br = proj(c.lat - RISK_STEP / 2, c.lng + RISK_STEP / 2);
              const ww = br.x - tl.x; const hh = br.y - tl.y;
              if (ww <= 0 || hh <= 0) return null;
              return <rect key={i} x={tl.x} y={tl.y} width={ww} height={hh} fill={riskColor(f.climateMetric, c.v)} />;
            })}
          </g>
        )}

        {/* Tectonic plates */}
        {f.infra.tectonics && (
          <g fill="none" data-no-drag>
            {TECTONIC_PLATES.map(t => {
              let d = ''; let prev: number | null = null;
              for (let i = 0; i < t.path.length; i++) {
                const [lng, lat] = t.path[i];
                const pt = proj(lat, lng);
                if (prev !== null && Math.abs(pt.x - prev) > w / 2) d += ` M ${pt.x} ${pt.y}`;
                else d += `${i === 0 ? 'M' : 'L'} ${pt.x} ${pt.y} `;
                prev = pt.x;
              }
              return <path key={t.id} d={d} stroke="hsl(0, 0%, 65%)" strokeWidth={Math.max(0.6, 1.2 / zoom)}
                strokeDasharray="4 3" opacity={0.7} />;
            })}
          </g>
        )}

        {/* Recent quakes */}
        {f.infra.quakes && quakesSource
          .filter(q => q.age <= ({ '24h':24, '48h':48, '7d':168, '30d':720 } as const)[f.hazardWindow])
          .map(q => {
            const pt = proj(q.lat, q.lng);
            const r = (1 + q.mag * 0.9) / Math.max(1, Math.sqrt(zoom));
            const col = quakeColor(q.mag);
            return (
              <g key={q.id} data-no-drag style={{ cursor: 'pointer' }}
                onMouseEnter={(e) => showTip(e, [`M${q.mag.toFixed(1)} · ${q.region ?? ''}`,
                  `Depth ${q.depthKm} km · ${q.age}h ago`], col)}
                onMouseLeave={hideTip}>
                <circle cx={pt.x} cy={pt.y} r={r * 1.8} fill={col} opacity={0.18} />
                <circle cx={pt.x} cy={pt.y} r={r} fill={col} opacity={0.95} />
              </g>
            );
          })
        }

        {/* Fires (time-binned) — heatmap at low zoom, individual hotspots when zoomed in.
            Filtering + binning are memoized so panning doesn't re-do the work. */}
        {f.infra.fires && (() => {
          // Viewport cull bounds in world-canvas pixel space (pan-aware, cheap).
          const vMinX = -pan.x - 80, vMaxX = -pan.x + view.w + 80;
          const vMinY = -pan.y - 80, vMaxY = -pan.y + view.h + 80;
          if (fireCellDegValue > 0) {
            const sidePx = fireCellDegValue * (w / 360);
            const out: React.ReactElement[] = [];
            for (const c of fireCells) {
              const pt = proj(c.lat, c.lng);
              if (pt.x + sidePx < vMinX || pt.x - sidePx > vMaxX ||
                  pt.y + sidePx < vMinY || pt.y - sidePx > vMaxY) continue;
              const intensity = Math.min(1, c.frpSum / 800);
              const col = fireColor(intensity);
              const op = Math.min(0.65, 0.18 + c.count * 0.04);
              out.push(
                <rect key={`fh-${c.lat}-${c.lng}`} data-no-drag
                  x={pt.x - sidePx / 2} y={pt.y - sidePx / 2}
                  width={sidePx} height={sidePx} fill={col} opacity={op}
                  shapeRendering="optimizeSpeed"
                  style={{ cursor: 'pointer' }}
                  onMouseEnter={(e) => showTip(e, [
                    `🔥 ${c.count} hotspot${c.count > 1 ? 's' : ''}`,
                    `Total FRP ${c.frpSum.toFixed(0)} MW`,
                    `${c.lat.toFixed(1)}°, ${c.lng.toFixed(1)}°`,
                  ], col)}
                  onMouseLeave={hideTip} />
              );
            }
            return out;
          }
          // Individual hotspots — viewport-culled
          const out: React.ReactElement[] = [];
          for (const fr of firesFiltered) {
            const pt = proj(fr.lat, fr.lng);
            if (pt.x < vMinX || pt.x > vMaxX || pt.y < vMinY || pt.y > vMaxY) continue;
            const frp = (fr as any).frp ?? fr.intensity * 200;
            const conf = (fr as any).confidence as string | undefined;
            const night = (fr as any).daynight === 'N';
            const sizeScale = Math.log10(1 + frp) * 0.9;
            const r = (1.2 + sizeScale) / Math.max(1, Math.sqrt(zoom));
            const col = fireColor(fr.intensity);
            const alpha = conf === 'l' ? 0.45 : conf === 'h' ? 0.95 : 0.75;
            out.push(
              <g key={fr.id} data-no-drag style={{ cursor: 'pointer' }}
                onMouseEnter={(e) => showTip(e, [
                  `🔥 ${fr.region ?? 'Hotspot'}`,
                  `FRP ${frp.toFixed(0)} MW · ${night ? 'NIGHT' : 'DAY'}${conf ? ' · conf ' + conf : ''}`,
                  `${fr.bin}`,
                ], col)}
                onMouseLeave={hideTip}>
                <circle cx={pt.x} cy={pt.y} r={r * 2.4} fill={col} opacity={alpha * 0.22} />
                <circle cx={pt.x} cy={pt.y} r={r} fill={col} opacity={alpha} />
                {night && (
                  <circle cx={pt.x} cy={pt.y} r={r * 0.45} fill="none"
                    stroke="hsl(0,0%,100%)" strokeWidth={Math.max(0.3, 0.5 / zoom)} opacity={0.7} />
                )}
              </g>
            );
          }
          return out;
        })()}

        {/* NASA EONET — open natural events (volcanoes, storms, drought, ice) */}
        {f.infra.fires && eonetEvents.map(ev => {
          const pt = proj(ev.lat, ev.lng);
          const palette: Record<string, string> = {
            volcanoes: 'hsl(0, 90%, 60%)',
            wildfires: 'hsl(20, 95%, 55%)',
            severeStorms: 'hsl(280, 80%, 65%)',
            drought: 'hsl(40, 80%, 55%)',
            seaLakeIce: 'hsl(195, 90%, 75%)',
            earthquakes: 'hsl(50, 95%, 55%)',
            floods: 'hsl(210, 90%, 60%)',
            dustHaze: 'hsl(35, 60%, 60%)',
            manmade: 'hsl(330, 80%, 60%)',
            snow: 'hsl(0, 0%, 92%)',
            tempExtremes: 'hsl(0, 80%, 55%)',
            waterColor: 'hsl(180, 80%, 55%)',
          };
          const col = palette[ev.category] ?? 'hsl(195, 90%, 60%)';
          const r = 3 / Math.max(1, Math.sqrt(zoom));
          return (
            <g key={`eonet-${ev.id}`} data-no-drag style={{ cursor: 'pointer' }}
              onMouseEnter={(e) => showTip(e, [
                `🌍 ${ev.title}`,
                `${ev.categoryTitle}${ev.date ? ' · ' + new Date(ev.date).toUTCString().slice(5, 16) : ''}`,
                'NASA EONET · LIVE',
              ], col)}
              onMouseLeave={hideTip}
              onClick={() => setPinned({ kind: 'point', category: 'eonet' as any, data: {
                id: ev.id, name: ev.title, lat: ev.lat, lng: ev.lng,
                meta: `${ev.categoryTitle}${ev.date ? ' · ' + new Date(ev.date).toISOString().slice(0, 10) : ''}`,
                operator: 'NASA EONET',
              } as any })}>
              <circle cx={pt.x} cy={pt.y} r={r * 2.4} fill={col} opacity={0.18} />
              <circle cx={pt.x} cy={pt.y} r={r} fill={col} opacity={0.95}
                stroke="hsl(0, 0%, 0%)" strokeWidth={r * 0.25} />
            </g>
          );
        })}

        {/* GDELT geopolitical event density (5° cells) — surfaces with trade-flow toggle */}
        {f.infra.tradeFlows && gdeltCells.map(cell => {
          const pt = proj(cell.lat, cell.lng);
          // Color by tone: red for negative (conflict/protest), green for positive.
          const tone = Math.max(-10, Math.min(10, cell.avgTone));
          const hue = tone < 0 ? 0 : 140;
          const radiusPx = 14 / Math.max(1, Math.sqrt(zoom)) * Math.min(2.5, 0.7 + Math.log10(Math.max(1, cell.count)) * 0.6);
          const op = Math.min(0.55, 0.12 + Math.log10(Math.max(1, cell.count)) * 0.1);
          return (
            <g key={`gd-${cell.lat}-${cell.lng}`} data-no-drag
              onMouseEnter={(e) => showTip(e, [
                `GDELT cell ${cell.lat.toFixed(0)}°,${cell.lng.toFixed(0)}°`,
                `${cell.count} events · tone ${tone.toFixed(1)}`,
                cell.sample.length ? cell.sample.join(' · ') : '',
              ].filter(Boolean), `hsl(${hue}, 80%, 60%)`)}
              onMouseLeave={hideTip}>
              <circle cx={pt.x} cy={pt.y} r={radiusPx}
                fill={`hsl(${hue}, 85%, 55%)`} opacity={op} />
            </g>
          );
        })}
        {f.infra.flights && liveFlights.map(fl => {
          const pt = proj(fl.lat, fl.lng);
          const s = 5 / Math.max(1, Math.sqrt(zoom));
          const col = fl.onGround ? 'hsl(45, 95%, 60%)' : 'hsl(195, 100%, 72%)';
          const altLine = fl.altFt != null ? `${fl.altFt.toLocaleString()} ft` : '—';
          const spdLine = fl.speedKts != null ? `${fl.speedKts} kt` : '—';
          const vrt = fl.vertRateFpm > 50 ? '↑' : fl.vertRateFpm < -50 ? '↓' : '·';
          const hitR = Math.max(10, s * 1.8);
          return (
            <g key={fl.id} data-no-drag style={{ cursor: 'pointer' }}
              transform={`translate(${pt.x.toFixed(1)} ${pt.y.toFixed(1)}) rotate(${(fl.trackDeg ?? 0).toFixed(0)})`}
              onMouseEnter={(e) => showTip(e, [
                `✈ ${fl.callsign}${fl.country ? ' · ' + fl.country : ''}`,
                `ALT ${altLine} ${vrt} · SPD ${spdLine}`,
                `TRK ${Math.round(fl.trackDeg)}°${fl.onGround ? ' · GROUND' : ''}`,
              ], col)}
              onMouseLeave={hideTip}
              onClick={() => setPinned({ kind: 'point', category: 'flight' as any, data: {
                id: fl.id, name: fl.callsign, lat: fl.lat, lng: fl.lng,
                meta: `${fl.country} · ${altLine} · ${spdLine} · TRK ${Math.round(fl.trackDeg)}°${fl.onGround ? ' · GROUND' : ''}`,
              } as any })}>
              {/* Invisible hit target for easier clicking */}
              <circle cx={0} cy={0} r={hitR} fill="transparent" />
              {/* Bold aircraft glyph with dark outline for contrast */}
              <path d={`M 0 ${-s * 1.7} L ${s * 0.55} ${s * 0.7} L 0 ${s * 0.3} L ${-s * 0.55} ${s * 0.7} Z`}
                fill={col} opacity={1} stroke="hsl(0, 0%, 0%)" strokeWidth={s * 0.22} strokeLinejoin="round" />
              <path d={`M ${-s * 1.15} ${s * 0.05} L ${s * 1.15} ${s * 0.05}`}
                stroke="hsl(0, 0%, 0%)" strokeWidth={s * 0.6} strokeLinecap="round" opacity={0.9} />
              <path d={`M ${-s * 1.1} 0 L ${s * 1.1} 0`}
                stroke={col} strokeWidth={s * 0.42} strokeLinecap="round" opacity={1} />
            </g>
          );
        })}

        {/* Live AIS vessels (chokepoint coverage) */}
        {f.infra.vessels && aisVessels.map(v => {
          const pt = proj(v.lat, v.lng);
          const s = 4 / Math.max(1, Math.sqrt(zoom));
          const col = v.category === 'tanker'
            ? 'hsl(28, 95%, 60%)'
            : v.category === 'cargo'
              ? 'hsl(195, 90%, 60%)'
              : 'hsl(140, 70%, 60%)';
          const speedLabel = v.sog > 0 ? `${v.sog.toFixed(1)} kn` : 'STOP';
          const hitR = Math.max(8, s * 1.6);
          return (
            <g key={`ais-${v.mmsi}`} data-no-drag style={{ cursor: 'pointer' }}
              transform={`translate(${pt.x.toFixed(1)} ${pt.y.toFixed(1)}) rotate(${(v.cog ?? 0).toFixed(0)})`}
              onMouseEnter={(e) => showTip(e, [
                `⚓ ${v.name ?? `MMSI ${v.mmsi}`}`,
                `${v.category.toUpperCase()} · ${speedLabel} · COG ${Math.round(v.cog)}°`,
                `${v.chokepoint} · AISStream · LIVE`,
              ], col)}
              onMouseLeave={hideTip}
              onClick={() => setPinned({ kind: 'point', category: 'vessel' as any, data: {
                id: String(v.mmsi),
                name: v.name ?? `MMSI ${v.mmsi}`,
                lat: v.lat, lng: v.lng,
                meta: `${v.category.toUpperCase()} · ${speedLabel} · ${v.chokepoint}`,
                operator: 'AIS',
              } as any })}>
              <circle cx={0} cy={0} r={hitR} fill="transparent" />
              <path d={`M 0 ${-s * 1.5} L ${s * 0.7} ${s * 0.9} L 0 ${s * 0.4} L ${-s * 0.7} ${s * 0.9} Z`}
                fill={col} opacity={0.95}
                stroke="hsl(0, 0%, 0%)" strokeWidth={s * 0.22} strokeLinejoin="round" />
            </g>
          );
        })}

        {/* Air quality (OpenAQ PM2.5) */}
        {f.infra.airQuality && airStations.map(s => {
          const pt = proj(s.lat, s.lng);
          const r = (2 + Math.min(8, Math.log10(Math.max(1, s.pm25)) * 2.2)) / Math.max(1, Math.sqrt(zoom));
          const col = `hsl(${s.hue}, 85%, 55%)`;
          return (
            <g key={`aq-${s.id}`} data-no-drag style={{ cursor: 'pointer' }}
              onMouseEnter={(e) => showTip(e, [
                `🌫 ${s.city || s.name}${s.country ? ' · ' + s.country : ''}`,
                `PM2.5 ${s.pm25} ${s.unit} · ${s.category}`,
                'OpenAQ · LIVE',
              ], col)}
              onMouseLeave={hideTip}
              onClick={() => setPinned({ kind: 'point', category: 'airquality' as any, data: {
                id: s.id, name: s.city || s.name, lat: s.lat, lng: s.lng,
                meta: `PM2.5 ${s.pm25} ${s.unit} · ${s.category}`,
                operator: 'OpenAQ',
              } as any })}>
              <circle cx={pt.x} cy={pt.y} r={r * 2.2} fill={col} opacity={0.18} />
              <circle cx={pt.x} cy={pt.y} r={r} fill={col} opacity={0.85}
                stroke="hsl(0, 0%, 0%)" strokeWidth={r * 0.2} />
            </g>
          );
        })}

        {/* Lightning strikes (last 30 min) */}
        {f.infra.lightning && lightningStrikes.map(st => {
          const pt = proj(st.lat, st.lng);
          const fade = Math.max(0.15, 1 - st.ageS / 1800);
          const r = (1.6 + fade * 2.4) / Math.max(1, Math.sqrt(zoom));
          const col = st.ageS < 60 ? 'hsl(55, 100%, 75%)' : 'hsl(45, 95%, 60%)';
          return (
            <g key={`lt-${st.id}`} data-no-drag style={{ pointerEvents: 'none' }}>
              <circle cx={pt.x} cy={pt.y} r={r * 2.6} fill={col} opacity={fade * 0.25} />
              <circle cx={pt.x} cy={pt.y} r={r} fill={col} opacity={fade}
                stroke="hsl(0, 0%, 0%)" strokeWidth={r * 0.2} />
            </g>
          );
        })}

        {/* ISS live position + ground trail */}
        {f.infra.iss && iss && (() => {
          const pt = proj(iss.lat, iss.lng);
          const s = 7 / Math.max(1, Math.sqrt(zoom));
          const col = 'hsl(195, 100%, 75%)';
          let trailD = '';
          let prevX: number | null = null;
          for (let i = 0; i < issTrail.length; i++) {
            const tp = proj(issTrail[i].lat, issTrail[i].lng);
            if (prevX !== null && Math.abs(tp.x - prevX) > w / 2) {
              trailD += ` M ${tp.x.toFixed(1)} ${tp.y.toFixed(1)}`;
            } else {
              trailD += `${i === 0 ? 'M' : 'L'} ${tp.x.toFixed(1)} ${tp.y.toFixed(1)} `;
            }
            prevX = tp.x;
          }
          return (
            <g data-no-drag>
              {trailD && (
                <path d={trailD} fill="none" stroke={col} strokeWidth={1.2}
                  strokeDasharray="3 3" opacity={0.55} />
              )}
              <g style={{ cursor: 'pointer' }} transform={`translate(${pt.x.toFixed(1)} ${pt.y.toFixed(1)})`}
                onMouseEnter={(e) => showTip(e, [
                  `🛰 ISS · International Space Station`,
                  `${iss.lat.toFixed(2)}°, ${iss.lng.toFixed(2)}° · 408 km alt`,
                  `Crew: ${issCrew.length} aboard · Open Notify · LIVE`,
                ], col)}
                onMouseLeave={hideTip}
                onClick={() => setPinned({ kind: 'point', category: 'iss' as any, data: {
                  id: 'iss', name: 'International Space Station',
                  lat: iss.lat, lng: iss.lng,
                  meta: `Crew: ${issCrew.map(c => c.name).join(', ') || '—'}`,
                  operator: 'NASA / Roscosmos',
                } as any })}>
                <circle r={s * 1.8} fill={col} opacity={0.2} />
                <circle r={s * 0.55} fill={col} opacity={1}
                  stroke="hsl(0, 0%, 0%)" strokeWidth={s * 0.15} />
                <rect x={-s * 1.4} y={-s * 0.18} width={s * 2.8} height={s * 0.36}
                  fill={col} opacity={0.85} stroke="hsl(0, 0%, 0%)" strokeWidth={s * 0.1} />
              </g>
            </g>
          );
        })()}


        {f.infra.factories && FACTORIES.map(p => {
          const pt = proj(p.lat, p.lng);
          const col = FACTORY_COLOR[p.factoryKind];
          const r = (1.5 + (p.size ?? 1) * 0.4) / Math.max(1, Math.sqrt(zoom));
          return (
            <g key={p.id} data-no-drag style={{ cursor: 'pointer' }}
              onMouseEnter={(e) => showTip(e, [p.name, p.meta ?? '', p.operator ?? ''].filter(Boolean), col)}
              onMouseLeave={hideTip}
              onClick={() => setPinned({ kind: 'point', category: 'factory', data: p })}>
              <rect x={pt.x - r} y={pt.y - r} width={r * 2} height={r * 2} fill={col} opacity={0.9} />
            </g>
          );
        })}

        {/* Retail HQs */}
        {f.infra.retail && RETAIL.map(p => {
          const pt = proj(p.lat, p.lng);
          const col = RETAIL_COLOR[p.retailKind];
          const r = (1.5 + (p.size ?? 1) * 0.4) / Math.max(1, Math.sqrt(zoom));
          return (
            <g key={p.id} data-no-drag style={{ cursor: 'pointer' }}
              onMouseEnter={(e) => showTip(e, [p.name, p.operator ?? ''].filter(Boolean), col)}
              onMouseLeave={hideTip}
              onClick={() => setPinned({ kind: 'point', category: 'retail', data: p })}>
              <circle cx={pt.x} cy={pt.y} r={r} fill={col} opacity={0.9} />
            </g>
          );
        })}

        {/* Agriculture */}
        {f.infra.agriculture && AGRICULTURE.map(p => {
          const pt = proj(p.lat, p.lng);
          const col = CROP_COLOR[p.crop];
          const r = (2 + (p.size ?? 1) * 0.5) / Math.max(1, Math.sqrt(zoom));
          return (
            <g key={p.id} data-no-drag style={{ cursor: 'pointer' }}
              onMouseEnter={(e) => showTip(e, [`${p.name}`,
                p.pricePerBu ? `$${p.pricePerBu.toFixed(2)}/bu · ${p.crop.toUpperCase()}` : p.crop.toUpperCase(),
                p.country ?? ''].filter(Boolean), col)}
              onMouseLeave={hideTip}
              onClick={() => setPinned({ kind: 'point', category: 'crop', data: p })}>
              <polygon points={`${pt.x},${pt.y - r} ${pt.x + r * 0.95},${pt.y + r * 0.55} ${pt.x - r * 0.95},${pt.y + r * 0.55}`}
                fill={col} opacity={0.9} />
            </g>
          );
        })}

        {/* Corporate HQs (Bloomberg "Companies & Markets" layer) — seed + custom */}
        {f.infra.companies && customCompanies.resolved
          .filter(c => c.mcapB >= f.minCompanyMcapB || (c as any).__custom)
          .filter(c => f.companySectors.length === 0 || f.companySectors.includes(c.sector))
          .map(c => {
            const pt = proj(c.lat, c.lng);
            const col = SECTOR_COLOR[c.sector];
            const r = (1.4 + Math.log10(Math.max(10, c.mcapB || 10)) * 0.9) / Math.max(1, Math.sqrt(zoom));
            const isCustom = !!(c as any).__custom;
            const q = c.ticker ? liveQuotes[c.ticker] : undefined;
            const liveLine = q
              ? `$${q.price.toFixed(2)} · ${q.pct >= 0 ? '+' : ''}${q.pct.toFixed(2)}%`
              : '';
            const handleClick = (e: React.MouseEvent) => {
              if (companyEditMode && user) {
                const rect = wrapRef.current?.getBoundingClientRect();
                const sx = rect ? e.clientX - rect.left : 0;
                const sy = rect ? e.clientY - rect.top : 0;
                const cust = (c as any).__custom as { id: string; overrideId: string | null } | undefined;
                if (cust) {
                  setCompanyEditor({
                    sx, sy, mode: 'edit-custom', customId: cust.id,
                    overrideSeedId: cust.overrideId ?? undefined,
                    initial: {
                      name: c.name, ticker: c.ticker, sector: c.sector,
                      market_cap: c.mcapB, hq: c.country, lat: c.lat, lng: c.lng,
                    },
                  });
                } else {
                  // Editing a seed pin → create an override row.
                  setCompanyEditor({
                    sx, sy, mode: 'edit-seed', overrideSeedId: c.id,
                    initial: {
                      name: c.name, ticker: c.ticker, sector: c.sector,
                      market_cap: c.mcapB, hq: c.country, lat: c.lat, lng: c.lng,
                    },
                  });
                }
                return;
              }
              setPinned({ kind: 'point', category: 'company', data: {
                id: c.id, name: `${c.ticker} · ${c.name}`, kind: 'company',
                lat: c.lat, lng: c.lng,
                meta: `$${(c.mcapB ?? 0).toFixed(0)}B mkt cap${isCustom ? ' · custom' : ''}${liveLine ? ` · ${liveLine}` : ''}`,
                operator: c.sector.toUpperCase(),
                country: c.country,
              } as any });
            };
            return (
              <g key={c.id} data-no-drag style={{ cursor: 'pointer' }}
                onMouseEnter={(e) => showTip(e, [
                  `${c.ticker} · ${c.name}`,
                  `${c.sector.toUpperCase()} · $${(c.mcapB ?? 0).toFixed(0)}B mkt cap`,
                  liveLine ? `LIVE  ${liveLine}` : '',
                  isCustom ? 'CUSTOM' : c.country,
                  companyEditMode ? '✏ click to edit' : '',
                ].filter(Boolean), col)}
                onMouseLeave={hideTip}
                onClick={handleClick}>
                <circle cx={pt.x} cy={pt.y} r={r + 1.5 / zoom} fill="none"
                  stroke={col} strokeWidth={Math.max(0.4, 0.7 / zoom)} opacity={0.55}
                  strokeDasharray={isCustom ? `${1.5 / zoom},${1 / zoom}` : undefined} />
                <circle cx={pt.x} cy={pt.y} r={r} fill={col} opacity={0.92} />
                {isCustom && (
                  <circle cx={pt.x} cy={pt.y} r={r + 2.5 / zoom} fill="none"
                    stroke="hsl(33, 100%, 50%)" strokeWidth={Math.max(0.3, 0.5 / zoom)} opacity={0.7} />
                )}
              </g>
            );
          })
        }

        {/* Market open clocks: pulse green if open, gray dot + local time if closed */}
        {f.infra.marketClocks && MARKET_CLOCKS.map(mc => {
          const pt = proj(mc.lat, mc.lng);
          const status = marketStatus(mc, now);
          const col = status === 'OPEN' ? 'hsl(150, 80%, 55%)' : 'hsl(0, 0%, 50%)';
          const r = 3 / Math.max(1, Math.sqrt(zoom));
          const t = localTime(mc.tz, now);
          return (
            <g key={`mc-${mc.abbr}`} data-no-drag style={{ cursor: 'pointer' }}
              onMouseEnter={(e) => showTip(e, [
                `${mc.abbr} · ${mc.name}`,
                `${status} · Local ${t}`,
                `Hours: ${mc.openH.toFixed(2)}–${mc.closeH.toFixed(2)} (${mc.tz})`,
              ], col)}
              onMouseLeave={hideTip}>
              {status === 'OPEN' && (
                <circle cx={pt.x} cy={pt.y} r={r * 2.4} fill={col} opacity={0.18}>
                  <animate attributeName="opacity" values="0.05;0.3;0.05" dur="2.5s" repeatCount="indefinite" />
                </circle>
              )}
              <circle cx={pt.x} cy={pt.y} r={r} fill={col} opacity={0.95} stroke="hsl(0, 0%, 90%)" strokeWidth={Math.max(0.3, 0.5 / zoom)} />
              {zoom > 1.4 && (
                <text x={pt.x + r + 2 / zoom} y={pt.y + 2 / zoom}
                  fill={col} fontSize={Math.max(7, 8 / Math.sqrt(zoom))} fontFamily="JetBrains Mono, monospace" fontWeight="bold">
                  {mc.abbr} {t}
                </text>
              )}
            </g>
          );
        })}

        {/* Territorial Disputes — semi-transparent polygon zones */}
        {f.infra.disputes && DISPUTES.map(d => {
          const col = DISPUTE_STATUS_COLOR[d.status];
          const opac = DISPUTE_SEVERITY_OPACITY[d.severity];
          let pathD = '';
          let prevX: number | null = null;
          for (let i = 0; i < d.ring.length; i++) {
            const [lng, lat] = d.ring[i];
            const { x, y } = proj(lat, lng);
            if (prevX !== null && Math.abs(x - prevX) > w / 2) pathD += ` M ${x.toFixed(1)} ${y.toFixed(1)}`;
            else pathD += `${i === 0 ? 'M' : 'L'} ${x.toFixed(1)} ${y.toFixed(1)} `;
            prevX = x;
          }
          pathD += ' Z';
          return (
            <g key={`dispute-${d.id}`} data-no-drag style={{ cursor: 'pointer' }}
              onMouseEnter={(e) => showTip(e, [
                `⚠ ${d.name}`,
                `Claimants: ${d.claimants.join(' / ')} · ${d.status}`,
                d.tradeRisk ?? '',
                d.meta?.slice(0, 80) ?? '',
              ].filter(Boolean), col)}
              onMouseLeave={hideTip}>
              <path d={pathD} fill={col} fillOpacity={opac}
                stroke={col} strokeOpacity={0.55}
                strokeWidth={Math.max(0.5, 1.0 / zoom)}
                strokeDasharray={d.status === 'CLAIMED' ? `${4 / zoom} ${3 / zoom}` : undefined} />
            </g>
          );
        })}

        {/* Arctic Shipping Routes */}
        {f.infra.arcticRoutes && (
          <g fill="none" data-no-drag>
            {ARCTIC_ROUTES.map(route => {
              let d = '';
              let prevX: number | null = null;
              for (let i = 0; i < route.path.length; i++) {
                const [lng, lat] = route.path[i];
                const { x, y } = proj(lat, lng);
                if (prevX !== null && Math.abs(x - prevX) > w / 2) d += ` M ${x.toFixed(1)} ${y.toFixed(1)}`;
                else d += `${i === 0 ? 'M' : 'L'} ${x.toFixed(1)} ${y.toFixed(1)} `;
                prevX = x;
              }
              const col = ROUTE_STATUS_COLOR[route.status];
              const dash = route.status === 'EMERGING' ? `${5 / zoom} ${5 / zoom}` : `${8 / zoom} ${4 / zoom}`;
              return (
                <path key={route.id} d={d} stroke={col}
                  strokeWidth={Math.max(0.8, 2.2 / Math.sqrt(zoom))}
                  strokeDasharray={dash} opacity={0.75}
                  style={{ cursor: 'pointer', pointerEvents: 'visibleStroke' }}
                  onMouseEnter={(e) => showTip(e, [
                    `🧊 ${route.name}`,
                    `${route.status}${route.seasonMonths ? ' · ' + route.seasonMonths : ''}`,
                    route.nmSavedVsSuez ? `Saves ~${route.nmSavedVsSuez} nm / ${route.daysSavedVsSuez} days vs Suez` : '',
                    route.jurisdiction,
                  ].filter(Boolean), col)}
                  onMouseLeave={hideTip} />
              );
            })}
            {ARCTIC_PORTS.map(p => {
              const pt = proj(p.lat, p.lng);
              const r = 3 / Math.max(1, Math.sqrt(zoom));
              return (
                <g key={`arctic-port-${p.id}`} data-no-drag style={{ cursor: 'pointer' }}
                  onMouseEnter={(e) => showTip(e, [`⚓ ${p.name}`, p.meta ?? ''], 'hsl(195, 90%, 65%)')}
                  onMouseLeave={hideTip}>
                  <circle cx={pt.x} cy={pt.y} r={r + 2 / zoom} fill="none"
                    stroke="hsl(195, 90%, 65%)" strokeWidth={Math.max(0.5, 0.8 / zoom)} />
                  <circle cx={pt.x} cy={pt.y} r={r} fill="hsl(195, 90%, 65%)" opacity={0.85} />
                </g>
              );
            })}
          </g>
        )}

        {/* Remittance Corridors (great-circle arcs) */}
        {f.infra.remittances && (
          <g fill="none" data-no-drag>
            {REMITTANCE_FLOWS.map(rf => {
              const pts = greatCirclePoints(rf.fromLngLat[1], rf.fromLngLat[0], rf.toLngLat[1], rf.toLngLat[0], 48);
              let d = '';
              let prevX: number | null = null;
              for (let i = 0; i < pts.length; i++) {
                const { x, y } = proj(pts[i].lat, pts[i].lng);
                if (prevX !== null && Math.abs(x - prevX) > w / 2) d += ` M ${x.toFixed(1)} ${y.toFixed(1)}`;
                else d += `${i === 0 ? 'M' : 'L'} ${x.toFixed(1)} ${y.toFixed(1)} `;
                prevX = x;
              }
              const col = remittanceColor(rf.valueUsdB);
              const sw = Math.max(0.5, (0.4 + Math.sqrt(rf.valueUsdB) * 0.22) / Math.sqrt(zoom));
              return (
                <path key={rf.id} d={d} stroke={col} strokeWidth={sw} opacity={0.60}
                  style={{ cursor: 'pointer', pointerEvents: 'visibleStroke' }}
                  onMouseEnter={(e) => showTip(e, [
                    `💸 ${rf.from} → ${rf.to}`,
                    `$${rf.valueUsdB.toFixed(1)}B/yr${rf.pctGdp ? ` · ${rf.pctGdp.toFixed(1)}% GDP` : ''}`,
                    rf.notes ?? '',
                  ].filter(Boolean), col)}
                  onMouseLeave={hideTip} />
              );
            })}
          </g>
        )}

        {/* Free Trade Zones / SEZs */}
        {f.infra.sezZones && FREE_TRADE_ZONES.map(ftz => {
          const pt = proj(ftz.lat, ftz.lng);
          const col = FTZ_KIND_COLOR[ftz.kind];
          const r = (1.8 + (ftz.tradeUsdB ? Math.log10(Math.max(1, ftz.tradeUsdB)) * 0.8 : 0.5)) / Math.max(1, Math.sqrt(zoom));
          return (
            <g key={ftz.id} data-no-drag style={{ cursor: 'pointer' }}
              onMouseEnter={(e) => showTip(e, [
                `🏭 ${ftz.name}`,
                ftz.meta ?? '',
                ftz.tradeUsdB ? `Trade: $${ftz.tradeUsdB}B/yr` : '',
                ftz.country,
              ].filter(Boolean), col)}
              onMouseLeave={hideTip}
              onClick={() => setPinned({ kind: 'point', category: 'sez' as any, data: {
                id: ftz.id, name: ftz.name, lat: ftz.lat, lng: ftz.lng,
                meta: ftz.meta, operator: ftz.operator, country: ftz.country,
              } as any })}>
              <rect x={pt.x - r} y={pt.y - r} width={r * 2} height={r * 2}
                fill={col} opacity={0.85}
                stroke="hsl(0,0%,0%)" strokeWidth={r * 0.15}
                transform={`rotate(45 ${pt.x} ${pt.y})`} />
            </g>
          );
        })}

        {/* Deforestation Hotspots */}
        {f.infra.deforestation && DEFORESTATION_HOTSPOTS.map(dh => {
          const pt = proj(dh.lat, dh.lng);
          const col = deforestationColor(dh.lossRateKm2yr);
          const r = (2.5 + Math.sqrt(dh.lossRateKm2yr) * 0.06) / Math.max(1, Math.sqrt(zoom));
          return (
            <g key={dh.id} data-no-drag style={{ cursor: 'pointer' }}
              onMouseEnter={(e) => showTip(e, [
                `🌳 ${dh.name}`,
                `~${dh.lossRateKm2yr.toLocaleString()} km²/yr · ${dh.driver}`,
                dh.commodity ? `Driver: ${dh.commodity}` : '',
                dh.meta?.slice(0, 80) ?? '',
              ].filter(Boolean), col)}
              onMouseLeave={hideTip}
              onClick={() => setPinned({ kind: 'point', category: 'deforestation' as any, data: {
                id: dh.id, name: dh.name, lat: dh.lat, lng: dh.lng,
                meta: `${dh.lossRateKm2yr.toLocaleString()} km²/yr · ${dh.driver}${dh.commodity ? ' · ' + dh.commodity : ''}`,
                operator: dh.protection,
                country: dh.country,
              } as any })}>
              <circle cx={pt.x} cy={pt.y} r={r * 2.5} fill={col} opacity={0.14}>
                <animate attributeName="opacity" values="0.08;0.22;0.08" dur="3s" repeatCount="indefinite" />
              </circle>
              <circle cx={pt.x} cy={pt.y} r={r} fill={col} opacity={0.88} />
            </g>
          );
        })}

        {/* Chip Fabrication Sites */}
        {f.infra.chipFabs && CHIP_FABS.map(fab => {
          const pt = proj(fab.lat, fab.lng);
          const col = FAB_COMPANY_COLOR[fab.company] ?? 'hsl(195, 90%, 60%)';
          const baseR = fab.status === 'OPERATIONAL' ? 2.2 : 1.4;
          const r = (baseR + (fab.capacityKwpm ? Math.sqrt(fab.capacityKwpm) * 0.12 : 0.5)) / Math.max(1, Math.sqrt(zoom));
          const opac = fab.status === 'OPERATIONAL' ? 0.90 : fab.status === 'UNDER_CONSTRUCTION' ? 0.60 : 0.40;
          const dash = fab.status === 'PLANNED' ? `${2 / zoom} ${2 / zoom}` :
                       fab.status === 'UNDER_CONSTRUCTION' ? `${3 / zoom} ${1.5 / zoom}` : undefined;
          return (
            <g key={fab.id} data-no-drag style={{ cursor: 'pointer' }}
              onMouseEnter={(e) => showTip(e, [
                `💾 ${fab.name}`,
                `${fab.company} · ${fab.node} · ${fab.status}`,
                fab.capacityKwpm ? `${fab.capacityKwpm}k WPM capacity` : '',
                fab.meta ?? '',
                fab.country + (fab.sanctioned ? ' · ⛔ SANCTIONED' : ''),
              ].filter(Boolean), col)}
              onMouseLeave={hideTip}
              onClick={() => setPinned({ kind: 'point', category: 'chipfab' as any, data: {
                id: fab.id, name: fab.name, lat: fab.lat, lng: fab.lng,
                meta: `${fab.company} · ${fab.node}${fab.capacityKwpm ? ' · ' + fab.capacityKwpm + 'k WPM' : ''}${fab.sanctioned ? ' · SANCTIONED' : ''}`,
                operator: fab.company,
                country: fab.country,
              } as any })}>
              {/* Hexagon glyph */}
              <polygon
                points={[0,1,2,3,4,5].map(i => {
                  const a = (i * 60 - 30) * Math.PI / 180;
                  return `${(pt.x + r * Math.cos(a)).toFixed(1)},${(pt.y + r * Math.sin(a)).toFixed(1)}`;
                }).join(' ')}
                fill={col} opacity={opac}
                stroke={fab.sanctioned ? 'hsl(0, 90%, 60%)' : 'hsl(0,0%,0%)'}
                strokeWidth={fab.sanctioned ? Math.max(0.8, 1.2 / zoom) : r * 0.15}
                strokeDasharray={fab.sanctioned ? `${2 / zoom} ${1 / zoom}` : dash} />
            </g>
          );
        })}

        {/* Military Bases (Overseas) */}
        {f.infra.militaryBases && MILITARY_BASES.map(base => {
          const pt = proj(base.lat, base.lng);
          const col = MIL_OPERATOR_COLOR[base.operator] ?? 'hsl(220, 80%, 60%)';
          const r = (1.8 + (base.personnel ? Math.log10(Math.max(100, base.personnel)) * 0.6 : 0.5)) / Math.max(1, Math.sqrt(zoom));
          const opac = base.status === 'DISPUTED' ? 0.5 : base.status === 'PLANNED' ? 0.35 : 0.85;
          return (
            <g key={base.id} data-no-drag style={{ cursor: 'pointer' }}
              onMouseEnter={(e) => showTip(e, [
                `🎖 ${base.name}`,
                `${base.operator} · ${base.branch.replace('_', ' ').toUpperCase()} · ${base.status}`,
                base.personnel ? `~${base.personnel.toLocaleString()} personnel` : '',
                base.meta ?? '',
              ].filter(Boolean), col)}
              onMouseLeave={hideTip}
              onClick={() => setPinned({ kind: 'point', category: 'milbase' as any, data: {
                id: base.id, name: base.name, lat: base.lat, lng: base.lng,
                meta: `${base.operator} ${base.branch} · ${base.hostIso}${base.personnel ? ' · ~' + base.personnel.toLocaleString() + ' personnel' : ''}`,
                operator: base.operator,
                country: base.hostIso,
              } as any })}>
              {/* Star polygon for military base */}
              <polygon
                points={[0,1,2,3,4].map(i => {
                  const outer = (i * 72 - 90) * Math.PI / 180;
                  const inner = ((i * 72 + 36) - 90) * Math.PI / 180;
                  return `${(pt.x + r * Math.cos(outer)).toFixed(1)},${(pt.y + r * Math.sin(outer)).toFixed(1)} ` +
                         `${(pt.x + r * 0.42 * Math.cos(inner)).toFixed(1)},${(pt.y + r * 0.42 * Math.sin(inner)).toFixed(1)}`;
                }).join(' ')}
                fill={col} opacity={opac}
                stroke="hsl(0,0%,0%)" strokeWidth={r * 0.12}
                strokeDasharray={base.status === 'DISPUTED' ? `${1.5 / zoom} ${1 / zoom}` : undefined} />
            </g>
          );
        })}

        {/* Subnational carbon market zones (point+circle) */}
        {f.infra.carbonMarkets && SUBNATIONAL_ETS.map(s => {
          const pt = proj(s.lat, s.lng);
          const col = 'hsl(150, 75%, 50%)';
          const radiusPx = (s.radiusDeg ?? 2) * (w / 360) * zoom;
          return (
            <g key={`sub-ets-${s.id}`} data-no-drag style={{ cursor: 'pointer' }}
              onMouseEnter={(e) => showTip(e, [
                `🌱 ${s.name}`,
                `${s.scheme} · $${s.priceUsd}/t CO₂`,
                `Since ${s.startYear} · ${s.coverage}`,
                s.notes ?? '',
              ].filter(Boolean), col)}
              onMouseLeave={hideTip}>
              <circle cx={pt.x} cy={pt.y} r={radiusPx} fill={col} fillOpacity={0.08}
                stroke={col} strokeOpacity={0.40} strokeWidth={Math.max(0.6, 1.2 / zoom)}
                strokeDasharray={`${5 / zoom} ${3 / zoom}`} />
              <circle cx={pt.x} cy={pt.y} r={3 / Math.sqrt(zoom)} fill={col} opacity={0.85} />
            </g>
          );
        })}

        {/* Rail Corridors */}
        {f.infra.railCorridors && (
          <g fill="none" data-no-drag>
            {RAIL_CORRIDORS.filter(r => f.railCategories[r.category as RailCategory]).map(rail => {
              let d = '';
              let prevX: number | null = null;
              for (let i = 0; i < rail.path.length; i++) {
                const [lng, lat] = rail.path[i];
                const { x, y } = proj(lat, lng);
                if (prevX !== null && Math.abs(x - prevX) > w / 2) d += ` M ${x.toFixed(1)} ${y.toFixed(1)}`;
                else d += `${i === 0 ? 'M' : 'L'} ${x.toFixed(1)} ${y.toFixed(1)} `;
                prevX = x;
              }
              const col = RAIL_CATEGORY_COLOR[rail.category];
              const dash = rail.status === 'PLANNED' ? `${4 / zoom} ${4 / zoom}` :
                           rail.status === 'UNDER_CONSTRUCTION' ? `${6 / zoom} ${3 / zoom}` : undefined;
              const opac = rail.status === 'OPERATIONAL' ? 0.65 : 0.40;
              return (
                <path key={rail.id} d={d} stroke={col}
                  strokeWidth={Math.max(0.6, (rail.status === 'OPERATIONAL' ? 1.6 : 0.9) / Math.sqrt(zoom))}
                  strokeDasharray={dash}
                  opacity={opac}
                  style={{ cursor: 'pointer', pointerEvents: 'visibleStroke' }}
                  onMouseEnter={(e) => showTip(e, [
                    `🚂 ${rail.name}`,
                    `${rail.category.toUpperCase()} · ${rail.status}`,
                    rail.volumeMt ? `~${rail.volumeMt} Mt/yr` : '',
                  ].filter(Boolean), col)}
                  onMouseLeave={hideTip} />
              );
            })}
          </g>
        )}

        {/* Renewables: offshore wind, onshore wind, solar, hydro */}
        {f.infra.renewables && (() => {
          const allRenewables: RenewableFeature[] = [
            ...OFFSHORE_WIND, ...ONSHORE_WIND, ...SOLAR_FARMS, ...HYDRO_DAMS,
          ];
          return allRenewables.map(r => {
            const pt = proj(r.lat, r.lng);
            const col = RENEWABLE_KIND_COLOR[r.kind];
            const rBase = r.kind === 'hydro' ? 2.0 : r.kind === 'solar' ? 1.5 : 1.8;
            const rPx = (rBase + Math.sqrt(Math.max(0.1, r.capacityGW)) * 0.8) / Math.max(1, Math.sqrt(zoom));
            const dash = r.status === 'PLANNED' ? `${2 / zoom} ${2 / zoom}` :
                         r.status === 'UNDER_CONSTRUCTION' ? `${3 / zoom} ${2 / zoom}` : undefined;
            const opac = r.status === 'OPERATIONAL' ? 0.88 : 0.55;
            return (
              <g key={r.id} data-no-drag style={{ cursor: 'pointer' }}
                onMouseEnter={(e) => showTip(e, [
                  `${RENEWABLE_KIND_LABEL[r.kind]}: ${r.name}`,
                  `${r.capacityGW.toFixed(2)} GW · ${r.status}`,
                  r.meta ?? '',
                  r.country ?? '',
                ].filter(Boolean), col)}
                onMouseLeave={hideTip}
                onClick={() => setPinned({ kind: 'point', category: 'renewable' as any, data: {
                  id: r.id, name: r.name, lat: r.lat, lng: r.lng,
                  meta: `${r.capacityGW.toFixed(2)} GW · ${RENEWABLE_KIND_LABEL[r.kind]} · ${r.status}${r.meta ? ' · ' + r.meta : ''}`,
                  operator: r.operator,
                  country: r.country,
                } as any })}>
                {r.kind === 'solar' ? (
                  // Solar: filled diamond
                  <polygon
                    points={`${pt.x},${pt.y - rPx} ${pt.x + rPx},${pt.y} ${pt.x},${pt.y + rPx} ${pt.x - rPx},${pt.y}`}
                    fill={col} opacity={opac}
                    stroke={r.status !== 'OPERATIONAL' ? 'hsl(0,0%,80%)' : undefined}
                    strokeWidth={r.status !== 'OPERATIONAL' ? Math.max(0.3, 0.5 / zoom) : undefined}
                    strokeDasharray={dash} />
                ) : r.kind === 'hydro' ? (
                  // Hydro: circle with cross
                  <g>
                    <circle cx={pt.x} cy={pt.y} r={rPx + 1.5 / zoom} fill="none"
                      stroke={col} strokeWidth={Math.max(0.5, 1 / zoom)} opacity={opac * 0.6} strokeDasharray={dash} />
                    <circle cx={pt.x} cy={pt.y} r={rPx} fill={col} opacity={opac} />
                  </g>
                ) : (
                  // Wind: triangle pointing up
                  <polygon
                    points={`${pt.x},${pt.y - rPx * 1.3} ${pt.x + rPx},${pt.y + rPx * 0.7} ${pt.x - rPx},${pt.y + rPx * 0.7}`}
                    fill={col} opacity={opac}
                    stroke={r.status !== 'OPERATIONAL' ? 'hsl(0,0%,80%)' : undefined}
                    strokeWidth={r.status !== 'OPERATIONAL' ? Math.max(0.3, 0.5 / zoom) : undefined}
                    strokeDasharray={dash} />
                )}
              </g>
            );
          });
        })()}

        {/* Coal-fired power plants */}
        {f.infra.coalPlants && COAL_PLANTS.map(p => {
          const pt = proj(p.lat, p.lng);
          const col = p.status === 'OFFLINE' ? 'hsl(220, 10%, 45%)' : 'hsl(220, 20%, 52%)';
          const r = (1.4 + (p.size ?? 3) * 0.45) / Math.max(1, Math.sqrt(zoom));
          return (
            <g key={p.id} data-no-drag style={{ cursor: 'pointer' }}
              onMouseEnter={(e) => showTip(e, [
                `🏭 ${p.name}`,
                p.meta ?? '',
                p.country ?? '',
              ].filter(Boolean), col)}
              onMouseLeave={hideTip}
              onClick={() => setPinned({ kind: 'point', category: 'coalplant' as any, data: p })}>
              <rect x={pt.x - r} y={pt.y - r} width={r * 2} height={r * 2}
                fill={col} opacity={p.status === 'OFFLINE' ? 0.4 : 0.82}
                stroke="hsl(220, 30%, 70%)" strokeWidth={Math.max(0.3, 0.5 / zoom)} />
              {/* Stack smoke symbol */}
              <line x1={pt.x - r * 0.4} y1={pt.y - r} x2={pt.x - r * 0.4} y2={pt.y - r * 2.0}
                stroke={col} strokeWidth={Math.max(0.4, 0.7 / zoom)} opacity={0.7} />
              <line x1={pt.x + r * 0.4} y1={pt.y - r} x2={pt.x + r * 0.4} y2={pt.y - r * 2.4}
                stroke={col} strokeWidth={Math.max(0.4, 0.7 / zoom)} opacity={0.7} />
            </g>
          );
        })}

        {/* Exchange markers */}
        {flags.exchanges && visibleMarkets.map((m) => {
          const idx = markets.indexOf(m);
          const pt = proj(m.lat, m.lng);
          const alpha = todAlpha(m.status, f);
          if (alpha === 0) return null;
          const statusColor =
            m.status === 'OPEN' ? 'hsl(150, 80%, 55%)' :
            m.status === 'PRE' ? 'hsl(45, 95%, 60%)' :
            m.status === 'AFTER' ? 'hsl(280, 65%, 65%)' :
            'hsl(0, 0%, 45%)';
          const q = indicesByAbbr[m.abbr];
          const mcap = q?.mcap_usd_t ?? 0.5;
          const r = (2 + Math.min(6, Math.sqrt(mcap) * 1.5)) / Math.max(1, Math.sqrt(zoom));
          return (
            <g key={m.abbr} data-no-drag opacity={alpha} style={{ cursor: 'pointer' }}
              onClick={() => { onMarkerClick?.(idx); setPinned({ kind: 'market', data: m, quote: q }); }}
              onMouseEnter={(e) => showTip(e, [
                `${m.abbr} · ${m.name}`,
                `${m.index} · ${m.currency}`,
                q?.change_pct != null ? `${q.change_pct >= 0 ? '+' : ''}${q.change_pct.toFixed(2)}% · $${mcap.toFixed(1)}T` : `Status: ${m.status ?? '—'}`,
              ], statusColor)}
              onMouseLeave={hideTip}>
              <circle cx={pt.x} cy={pt.y} r={r + 3 / zoom} fill="none" stroke={statusColor} strokeWidth={Math.max(0.5, 0.8 / zoom)} opacity={0.6} />
              <circle cx={pt.x} cy={pt.y} r={r} fill={statusColor} opacity={0.9} />
              {zoom > 1.2 && (
                <text x={pt.x + r + 3 / zoom} y={pt.y - r - 2 / zoom} fill="hsl(0, 0%, 90%)" fontSize={Math.max(7, 8 / Math.sqrt(zoom))} fontFamily="JetBrains Mono, monospace" fontWeight="bold">
                  {m.abbr}
                </text>
              )}
            </g>
          );
        })}


        {/* Measure tool overlay */}
        {measureLine && measurePts.length === 2 && (() => {
          const a = proj(measurePts[0].lat, measurePts[0].lng);
          const b = proj(measurePts[1].lat, measurePts[1].lng);
          return (
            <g data-no-drag>
              <path d={measureLine.d} stroke="hsl(33, 100%, 55%)" strokeWidth={2 / zoom} fill="none" strokeDasharray={`${4 / zoom} ${2 / zoom}`} />
              <circle cx={a.x} cy={a.y} r={3 / zoom} fill="hsl(33, 100%, 55%)" />
              <circle cx={b.x} cy={b.y} r={3 / zoom} fill="hsl(33, 100%, 55%)" />
            </g>
          );
        })()}
      </svg>
      ))}

      {/* Hover tooltip */}
      {tooltip && (
        <div
          className="absolute z-40 px-2 py-1 bg-surface-deep/95 border border-accent/60 backdrop-blur font-mono text-[9px] text-foreground pointer-events-none shadow-2xl max-w-[240px]"
          style={{ left: tooltip.x, top: tooltip.y, borderLeftColor: tooltip.color, borderLeftWidth: 3 }}
        >
          {tooltip.lines.map((l, i) => (
            <div key={i} className={i === 0 ? 'font-bold' : 'text-muted-foreground'}>{l}</div>
          ))}
        </div>
      )}

      {/* Top-right controls: basemap segmented + Roads/Labels overlays + drawer toggle */}
      <div className="absolute top-2 right-2 z-30 flex items-center gap-1" data-no-drag>
        <div className="flex items-center bg-surface-deep/80 border border-border backdrop-blur">
          {BASEMAP_LIST.map((bm, i) => (
            <button key={bm.id} onClick={() => updateF({ basemap: bm.id as Map2DFilters['basemap'] })}
              className={`flex items-center gap-1 px-1.5 py-1 text-[9px] font-mono uppercase font-bold ${
                i < BASEMAP_LIST.length - 1 ? 'border-r border-border' : ''
              } ${
                f.basemap === bm.id ? 'bg-accent text-accent-foreground' : 'text-muted-foreground hover:text-foreground'
              }`} title={bm.label}>
              {bm.short}
            </button>
          ))}
        </div>
        {f.basemap !== 'wire' && (
          <div className="flex items-center bg-surface-deep/80 border border-border backdrop-blur">
            <button onClick={() => updateF({ roadsOverlay: !f.roadsOverlay })}
              title="Toggle roads overlay"
              className={`px-1.5 py-1 text-[9px] font-mono uppercase font-bold border-r border-border ${
                f.roadsOverlay ? 'bg-accent text-accent-foreground' : 'text-muted-foreground hover:text-foreground'
              }`}>RDS</button>
            <button onClick={() => updateF({ labelsOverlay: !f.labelsOverlay })}
              title="Toggle labels overlay"
              className={`px-1.5 py-1 text-[9px] font-mono uppercase font-bold ${
                f.labelsOverlay ? 'bg-accent text-accent-foreground' : 'text-muted-foreground hover:text-foreground'
              }`}>LBL</button>
          </div>
        )}
        <button
          onClick={() => setDrawerOpen(true)}
          title="Layers & maps"
          className="flex items-center gap-1 px-2 py-1 text-[9px] font-mono uppercase font-bold bg-surface-deep/80 border border-border backdrop-blur text-foreground hover:bg-accent hover:text-accent-foreground"
        >
          <LayersIcon className="w-3 h-3" />
          MAPS
          {filterCount > 0 && (
            <span className="ml-0.5 px-1 bg-accent text-accent-foreground tabular-nums">{filterCount}</span>
          )}
        </button>
      </div>

      {/* Top toolbar: Measure + Bookmarks */}
      <div className="absolute top-2 left-2 z-30 flex flex-wrap items-center gap-1 max-w-[calc(100%-440px)]" data-no-drag>
        <MeasureToggle active={measureMode} onToggle={() => { setMeasureMode(v => !v); setMeasurePts([]); }} />
        <div className="flex items-center bg-surface-deep/80 border border-border backdrop-blur">
          {BOOKMARKS.map(bm => (
            <button key={bm.id} onClick={() => centerOn(bm.lat, bm.lng, bm.zoom)}
              title={`Jump to ${bm.label}`}
              className="px-1.5 py-1 text-[8px] font-mono uppercase font-bold border-r border-border last:border-r-0 text-muted-foreground hover:text-foreground hover:bg-accent/30">
              {bm.label}
            </button>
          ))}
        </div>
        <LayerPresets
          infra={f.infra}
          basemap={f.basemap}
          saved={savedPresets}
          onToggle={(infra) => updateF({ infra })}
          onApplySaved={(p) => {
            const nextInfra = { ...DEFAULT_MAP2D_FILTERS.infra };
            for (const k of p.infraOn) (nextInfra as any)[k] = true;
            updateF({ infra: nextInfra, basemap: p.basemap });
          }}
          onSave={(name) => {
            const infraOn = (Object.keys(f.infra) as (keyof Map2DFilters['infra'])[])
              .filter(k => f.infra[k]);
            setSavedPresets([
              ...savedPresets,
              { id: `${Date.now().toString(36)}`, name, basemap: f.basemap, infraOn },
            ]);
          }}
          onDelete={(id) => setSavedPresets(savedPresets.filter(p => p.id !== id))}
        />
        <button
          onClick={() => setShowHelp(true)}
          title="Keyboard shortcuts (?)"
          className="px-1.5 py-1 text-[9px] font-mono uppercase font-bold bg-surface-deep/80 border border-border backdrop-blur text-muted-foreground hover:text-foreground hover:bg-accent/30"
        >
          ?
        </button>
      </div>

      {showHelp && <KeyboardShortcuts onClose={() => setShowHelp(false)} />}

      <div className="absolute bottom-2 right-2 z-30 flex flex-col gap-0.5 bg-surface-deep/80 border border-border backdrop-blur" data-no-drag>
        <button
          onClick={() => zoomAt(view.w / 2, view.h / 2, 2, true)}
          disabled={zoom >= ZOOM_MAX}
          className="p-1.5 text-foreground hover:bg-accent hover:text-accent-foreground border-b border-border disabled:opacity-40 disabled:hover:bg-transparent"
          title="Zoom in (+)">
          <ZoomIn className="w-3 h-3" />
        </button>
        <button
          onClick={() => zoomAt(view.w / 2, view.h / 2, 0.5, true)}
          disabled={zoom <= ZOOM_MIN}
          className="p-1.5 text-foreground hover:bg-accent hover:text-accent-foreground border-b border-border disabled:opacity-40 disabled:hover:bg-transparent"
          title="Zoom out (−)">
          <ZoomOut className="w-3 h-3" />
        </button>
        <button onClick={resetView} className="p-1.5 text-foreground hover:bg-accent hover:text-accent-foreground" title="Reset view (0)">
          <RotateCcw className="w-3 h-3" />
        </button>
        <div className="text-[8px] font-mono text-muted-foreground text-center px-1 py-0.5 border-t border-border tabular-nums" title="zoom · tile-z">
          z {zoom < 10 ? zoom.toFixed(2) : zoom.toFixed(1)}
        </div>
      </div>

      {/* Bottom status bar: cursor lat/lng + scale bar + measure result */}
      <div className="absolute bottom-2 left-2 z-30 flex items-center gap-2 bg-surface-deep/80 border border-border backdrop-blur px-2 py-1 font-mono text-[9px]" data-no-drag>
        <button
          onClick={() => setCrosshairOn(v => !v)}
          className={`uppercase ${crosshairOn ? 'text-accent' : 'text-muted-foreground'} hover:text-accent`}
          title={crosshairOn ? 'Hide crosshair tooltip (Esc)' : 'Show crosshair tooltip'}
        >CRSR</button>
        <span className="text-foreground tabular-nums">
          {cursor ? `${cursor.lat.toFixed(4)}°, ${cursor.lng.toFixed(4)}°` : '—'}
        </span>
        <span className="text-border">│</span>
        {/* Scale bar — meters per pixel × 100px, latitude-corrected */}
        {(() => {
          const lat = cursor?.lat ?? 0;
          const earthCirc = 40075016.686; // m
          const mPerPx = (earthCirc * Math.cos((lat * Math.PI) / 180)) / w;
          const targetPx = 100;
          const rawM = mPerPx * targetPx;
          // Snap to a "nice" number 1/2/5 × 10^n
          const pow = Math.pow(10, Math.floor(Math.log10(rawM)));
          const mant = rawM / pow;
          const niceMant = mant < 1.5 ? 1 : mant < 3.5 ? 2 : mant < 7.5 ? 5 : 10;
          const niceM = niceMant * pow;
          const px = niceM / mPerPx;
          const label = niceM >= 1000 ? `${(niceM / 1000).toFixed(niceM >= 10000 ? 0 : 1)} km` : `${niceM.toFixed(0)} m`;
          return (
            <span className="flex items-center gap-1">
              <span className="text-muted-foreground uppercase">SCL</span>
              <span className="inline-block border-l border-r border-foreground" style={{ width: px, height: 6 }}>
                <span className="block w-full h-[2px] bg-foreground mt-[2px]" />
              </span>
              <span className="text-foreground tabular-nums">{label}</span>
            </span>
          );
        })()}
        {measureLine && (
          <>
            <span className="text-border">│</span>
            <span className="text-muted-foreground uppercase">DST</span>
            <span className="text-accent font-bold tabular-nums">{measureLine.km.toFixed(0)} km</span>
            <span className="text-muted-foreground tabular-nums">({measureLine.nm.toFixed(0)} nm)</span>
            <span className="text-border">│</span>
            <span className="text-muted-foreground uppercase">BRG</span>
            <span className="text-accent font-bold tabular-nums">{measureLine.bearing.toFixed(0)}°</span>
            <button onClick={() => setMeasurePts([])} className="text-muted-foreground hover:text-accent ml-1 uppercase">clr</button>
          </>
        )}
        {measureMode && !measureLine && (
          <span className="text-accent uppercase">click {measurePts.length === 0 ? 'point A' : 'point B'}</span>
        )}
      </div>

      {/* Legend chip (auto-derived from active layers) */}
      <Legend2D filters={f} />


      {/* Mini-map removed per design */}

      {/* Edit Companies toggle (only when layer + auth on) */}
      {f.infra.companies && user && (
        <button
          data-no-drag
          onClick={() => { setCompanyEditMode(v => !v); setCompanyEditor(null); }}
          className={`absolute bottom-2 left-2 z-40 flex items-center gap-1 px-2 py-1 text-[9px] uppercase font-bold tracking-wider border ${
            companyEditMode
              ? 'bg-accent text-accent-foreground border-accent'
              : 'bg-surface-elevated text-foreground border-border hover:border-accent'
          }`}
          title={companyEditMode ? 'Exit edit mode' : 'Edit companies — click empty map to add, click pin to edit'}
        >
          <Pencil className="w-3 h-3" />
          {companyEditMode ? 'EDITING COMPANIES' : 'EDIT COMPANIES'}
        </button>
      )}

      {/* Company pin editor */}
      {companyEditor && (
        <CompanyPinEditor
          initial={companyEditor.initial}
          sx={companyEditor.sx} sy={companyEditor.sy}
          containerW={view.w} containerH={view.h}
          title={companyEditor.mode === 'create' ? 'NEW COMPANY' : companyEditor.mode === 'edit-seed' ? 'EDIT (OVERRIDE SEED)' : 'EDIT COMPANY'}
          onCancel={() => setCompanyEditor(null)}
          onSubmit={async (v) => {
            try {
              if (companyEditor.mode === 'create') {
                await customCompanies.create({
                  ...v,
                  ticker: v.ticker || null, hq: v.hq || null, notes: v.notes || null,
                  market_cap: v.market_cap ?? null,
                  lat: companyEditor.initial.lat, lng: companyEditor.initial.lng,
                });
              } else if (companyEditor.mode === 'edit-custom' && companyEditor.customId) {
                await customCompanies.update(companyEditor.customId, {
                  ...v,
                  ticker: v.ticker || null, hq: v.hq || null, notes: v.notes || null,
                  market_cap: v.market_cap ?? null,
                });
              } else if (companyEditor.mode === 'edit-seed' && companyEditor.overrideSeedId) {
                await customCompanies.create({
                  ...v,
                  ticker: v.ticker || null, hq: v.hq || null, notes: v.notes || null,
                  market_cap: v.market_cap ?? null,
                  lat: companyEditor.initial.lat, lng: companyEditor.initial.lng,
                  override_id: companyEditor.overrideSeedId,
                });
              }
              setCompanyEditor(null);
            } catch (e) { /* error displayed in editor */ throw e; }
          }}
          onDelete={(companyEditor.mode === 'edit-custom' && companyEditor.customId) ? async () => {
            await customCompanies.remove(companyEditor.customId!);
            setCompanyEditor(null);
          } : undefined}
          onResetSeed={(companyEditor.overrideSeedId) ? async () => {
            await customCompanies.resetSeed(companyEditor.overrideSeedId!);
            setCompanyEditor(null);
          } : undefined}
        />
      )}

      {/* Crosshair tooltip — Bloomberg-style readout of all active layers under cursor */}
      {crosshairOn && cursor && cursorScreen && !dragRef.current && !measureMode && (
        <CrosshairTooltip2D
          sx={crosshairFrozen && frozenSnapshot.current ? frozenSnapshot.current.x : cursorScreen.x}
          sy={crosshairFrozen && frozenSnapshot.current ? frozenSnapshot.current.y : cursorScreen.y}
          lat={crosshairFrozen && frozenSnapshot.current ? frozenSnapshot.current.lat : cursor.lat}
          lng={crosshairFrozen && frozenSnapshot.current ? frozenSnapshot.current.lng : cursor.lng}
          containerW={view.w}
          containerH={view.h}
          frozen={crosshairFrozen}
          fxRates={fxRates}
          indicesByAbbr={indicesByAbbr}
          storms={storms}
          quakes={quakesSource}
          acledEvents={acledEvents}
          show={{
            fx: !!(f.infra.fxHeat || flags.fxFlows),
            rates: !!f.infra.sovYield,
            macro: !!f.infra.macroChoro,
            equity: !!flags.exchanges,
            acled: !!f.infra.acledHeat,
            storms: !!flags.storms,
            quakes: !!f.infra.seismic,
          }}
        />
      )}

      {/* Inspector */}
      <Inspector2D
        pinned={pinned}
        onClose={() => setPinned(null)}
        onCenter={(lat, lng) => centerOn(lat, lng, Math.max(zoom, 5))}
      />

      {/* Layer / maps drawer */}
      {drawerOpen && (
        <Map2DLayerDrawer
          filters={f}
          onToggleInfra={toggleInfra}
          onUpdate={updateF}
          onLoadPreset={(p) => {
            if (p.infraOn?.length) {
              const patch = { ...f.infra };
              for (const k of p.infraOn) (patch as any)[k] = true;
              updateF({ infra: patch });
            }
            if (p.region) centerOn(p.region.lat, p.region.lng, p.region.zoom);
            setDrawerOpen(false);
          }}
          onClose={() => setDrawerOpen(false)}
        />
      )}

      {/* Country Detail Drawer */}
      <CountryDetailDrawer
        iso={selectedCountry?.iso ?? null}
        fallbackName={selectedCountry?.name}
        onClose={() => setSelectedCountry(null)}
      />

    </div>
  );
}
