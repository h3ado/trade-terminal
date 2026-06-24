/**
 * "Crazy filters" for the 2D Mercator map. Each filter is a pure predicate on
 * an item; combine via `applyMap2DFilters`. Persisted in user_preferences via
 * useUserPreference('globe.map2dFilters', DEFAULT_MAP2D_FILTERS).
 */
import type { GlobeMarket } from '../AdvancedGlobe';
import type { Storm } from '@/hooks/useStorms';
import type { EconPin } from '../layers/econPins';
import type { IndexQuote } from '@/hooks/useIndices';
import type { FXRate } from '@/hooks/useFXRates';

// ─── Region presets ──────────────────────────────────────────────────────────

export type Continent = 'NA' | 'SA' | 'EU' | 'AS' | 'AF' | 'OC' | 'AN';
export type Hemisphere = 'all' | 'N' | 'S';

/** Lat/lng → continent code (rough bounding-box partition; good enough for viz). */
export function continentOf(lat: number, lng: number): Continent {
  if (lat < -55) return 'AN';
  if (lat > 12 && lng > -170 && lng < -50) return 'NA';
  if (lat <= 12 && lat >= -55 && lng > -90 && lng < -30) return 'SA';
  if (lat > 35 && lng > -25 && lng < 60) return 'EU';
  if (lat <= 35 && lat > -35 && lng > -20 && lng < 55) return 'AF';
  if (lng >= 110 && lat < 0) return 'OC';
  if (lng > 25 && lat > -10) return 'AS';
  return 'AS';
}

export const CONTINENT_LABEL: Record<Continent, string> = {
  NA: 'N. America', SA: 'S. America', EU: 'Europe',
  AS: 'Asia', AF: 'Africa', OC: 'Oceania', AN: 'Antarctica',
};

// ─── Filter state ────────────────────────────────────────────────────────────

export type Map2DFilters = {
  continents: Continent[];
  hemisphere: Hemisphere;
  minMcapT: number;
  minFxVolPct: number;
  todHeat: { open: boolean; pre: boolean; after: boolean; closed: boolean };
  minStormCat: number;
  minEconImpact: 0 | 1 | 2;
  minSovRisk: number;
  basemap: 'wire' | 'sat' | 'dark' | 'satellite' | 'street' | 'streetsplus' | 'traffic';
  /** Independent overlays (work on any non-wireframe basemap). */
  roadsOverlay: boolean;
  labelsOverlay: boolean;
  /** Infrastructure & overlay layer toggles (2D-only). */
  infra: {
    pipelines: boolean;
    fiber: boolean;
    hv: boolean;
    nuclear: boolean;
    ports: boolean;
    airports: boolean;
    lng: boolean;
    refineries: boolean;
    oilfields: boolean;
    mines: boolean;
    datacenters: boolean;
    ixps: boolean;
    naval: boolean;
    straits: boolean;
    cbHqs: boolean;
    tradeFlows: boolean;
    sanctions: boolean;
    seismic: boolean;
    wildfires: boolean;
    // Bloomberg MAPS parity additions:
    factories: boolean;
    retail: boolean;
    agriculture: boolean;
    fires: boolean;
    quakes: boolean;
    tectonics: boolean;
    weather: boolean;
    climateRisk: boolean;
    // Bloomberg parity batch 2:
    companies: boolean;
    subseaCables: boolean;
    terminator: boolean;
    marketClocks: boolean;
    flights: boolean;
    airQuality: boolean;
    iss: boolean;
    lightning: boolean;
    vessels: boolean;
    // Markets & Macro overlays:
    equityPulse: boolean;
    fxHeat: boolean;
    sovYield: boolean;
    sovCDS: boolean;
    commodityFlows: boolean;
    macroChoro: boolean;
    shipLanes: boolean;
    chokeStress: boolean;
    etfFlows: boolean;
    fxCarry: boolean;
    cryptoHubs: boolean;
    // Geopolitics & Risk overlays:
    acledHeat: boolean;
    gdeltTone: boolean;
    sanctionsNet: boolean;
    elections: boolean;
    travelAdv: boolean;
    // Energy transition overlays:
    renewables: boolean;
    coalPlants: boolean;
    // Supply chain overlays:
    railCorridors: boolean;
    chipFabs: boolean;
    // Geopolitics (deep):
    militaryBases: boolean;
    disputes: boolean;
    // Trade & Finance:
    arcticRoutes: boolean;
    remittances: boolean;
    sezZones: boolean;
    // Environment / ESG:
    carbonMarkets: boolean;
    deforestation: boolean;
    // Batch 3 — Financial Intelligence, Demographics, Political Risk:
    creditRatings: boolean;
    demographics: boolean;
    currencyRegime: boolean;
    refugeeFlows: boolean;
    internetFreedom: boolean;
    commodityStorage: boolean;
  };
  /** Time-window for ACLED/GDELT recency filter. */
  geoWindow: '24h' | '7d' | '30d';
  /** Macro choropleth metric when `infra.macroChoro` is on. */
  macroMetric: 'rate' | 'cpi' | 'realY' | 'gdp' | 'unemp' | 'debt' | 'ca' | 'pmi' | 'milSpend' | 'reserves' | 'rating' | 'spread' | 'netFreedom';
  /** Active demographic sub-metric when `infra.demographics` is on. */
  demographicMetric: 'workingAge' | 'medianAge' | 'popGrowth' | 'urban';
  /** Which commodities to draw when `infra.commodityFlows` is on. */
  commoditySet: { crude: boolean; lng: boolean; grain: boolean; coal: boolean; copper: boolean; iron: boolean; chips: boolean };
  /** Active rail corridor categories when `infra.railCorridors` is on. */
  railCategories: { bri: boolean; bulk: boolean; container: boolean; energy: boolean };
  /** Sector filter for the Companies layer ([] = all). */
  companySectors: string[];
  /** Min market cap (USD billions) for Companies layer. */
  minCompanyMcapB: number;
  /** Active weather metric when `infra.weather` is on. */
  weatherMetric: 'temp' | 'cloud' | 'rain' | 'soil' | 'wind';
  /** Active climate-risk metric when `infra.climateRisk` is on. */
  climateMetric: 'cyclone' | 'surge' | 'heat' | 'water' | 'reef';
  /** Time-window for fires/quakes hotspot filter. */
  hazardWindow: '24h' | '48h' | '7d' | '30d';
};

export const DEFAULT_MAP2D_FILTERS: Map2DFilters = {
  continents: [],
  hemisphere: 'all',
  minMcapT: 0,
  minFxVolPct: 0,
  todHeat: { open: true, pre: true, after: true, closed: true },
  minStormCat: -1,
  minEconImpact: 0,
  minSovRisk: 0,
  basemap: 'wire',
  roadsOverlay: false,
  labelsOverlay: false,
  infra: {
    pipelines: false, fiber: false, hv: false, nuclear: false, ports: false, airports: false,
    lng: false, refineries: false, oilfields: false, mines: false,
    datacenters: false, ixps: false, naval: false, straits: false, cbHqs: false,
    tradeFlows: false, sanctions: false, seismic: false, wildfires: false,
    factories: false, retail: false, agriculture: false,
    fires: false, quakes: false, tectonics: false,
    weather: false, climateRisk: false,
    companies: false, subseaCables: false, terminator: false, marketClocks: false, flights: false,
    airQuality: false, iss: false, lightning: false, vessels: false,
    equityPulse: false, fxHeat: false, sovYield: false, sovCDS: false,
    commodityFlows: false, macroChoro: false,
    shipLanes: false, chokeStress: false, etfFlows: false, fxCarry: false, cryptoHubs: false,
    acledHeat: false, gdeltTone: false, sanctionsNet: false,
    elections: false, travelAdv: false,
    renewables: false, coalPlants: false,
    railCorridors: false, chipFabs: false,
    militaryBases: false, disputes: false,
    arcticRoutes: false, remittances: false, sezZones: false,
    carbonMarkets: false, deforestation: false,
    creditRatings: false, demographics: false, currencyRegime: false,
    refugeeFlows: false, internetFreedom: false, commodityStorage: false,
  },
  geoWindow: '7d',
  macroMetric: 'rate',
  commoditySet: { crude: true, lng: true, grain: true, coal: false, copper: false, iron: false, chips: false },
  railCategories: { bri: true, bulk: true, container: true, energy: true },
  demographicMetric: 'workingAge',
  companySectors: [],
  minCompanyMcapB: 0,
  weatherMetric: 'temp',
  climateMetric: 'cyclone',
  hazardWindow: '7d',
};

// ─── Predicates ──────────────────────────────────────────────────────────────

const inRegion = (lat: number, lng: number, f: Map2DFilters) => {
  if (f.hemisphere === 'N' && lat < 0) return false;
  if (f.hemisphere === 'S' && lat > 0) return false;
  if (f.continents.length > 0 && !f.continents.includes(continentOf(lat, lng))) return false;
  return true;
};

export function filterMarkets(
  markets: GlobeMarket[],
  byAbbr: Record<string, IndexQuote>,
  f: Map2DFilters,
): GlobeMarket[] {
  return markets.filter(m => {
    if (!inRegion(m.lat, m.lng, f)) return false;
    if (f.minMcapT > 0) {
      const mcap = byAbbr[m.abbr]?.mcap_usd_t ?? 0;
      if (mcap < f.minMcapT) return false;
    }
    return true;
  });
}

export function todAlpha(status: GlobeMarket['status'], f: Map2DFilters): number {
  const wanted =
    (status === 'OPEN' && f.todHeat.open) ||
    (status === 'PRE' && f.todHeat.pre) ||
    (status === 'AFTER' && f.todHeat.after) ||
    (status === 'CLOSED' && f.todHeat.closed);
  if (wanted) return 1;
  const allOff = !f.todHeat.open && !f.todHeat.pre && !f.todHeat.after && !f.todHeat.closed;
  return allOff ? 1 : 0.18;
}

export function filterFXRates(rates: FXRate[], f: Map2DFilters): FXRate[] {
  if (f.minFxVolPct <= 0) return rates;
  return rates.filter(r => Math.abs(r.change_pct ?? 0) >= f.minFxVolPct);
}

export function filterStorms(storms: Storm[], f: Map2DFilters): Storm[] {
  return storms.filter(s => {
    if (s.category < f.minStormCat) return false;
    if (!inRegion(s.lat, s.lng, f)) return false;
    return true;
  });
}

export function filterEconPins(pins: EconPin[], f: Map2DFilters): EconPin[] {
  return pins.filter(p => {
    if (f.minEconImpact === 2 && p.impact !== 'HIGH') return false;
    if (f.minEconImpact === 1 && (p.impact as string) === 'LOW') return false;
    if (!inRegion(p.lat, p.lng, f)) return false;
    return true;
  });
}

// ─── Sovereign-risk synthesis ────────────────────────────────────────────────
export function sovRiskByCountry(
  fxRates: FXRate[],
  econPins: EconPin[],
): Record<string, number> {
  const out: Record<string, number> = {};
  for (const r of fxRates) {
    out[r.ccy] = Math.min(100, Math.abs(r.change_pct ?? 0) * 20);
  }
  for (const p of econPins) {
    const bump = p.impact === 'HIGH' ? 25 : (p.impact as string) === 'MED' ? 10 : 3;
    out[p.country] = Math.min(100, (out[p.country] ?? 0) + bump);
  }
  return out;
}

export function passesSovRisk(country: string, scores: Record<string, number>, f: Map2DFilters) {
  if (f.minSovRisk <= 0) return true;
  return (scores[country] ?? 0) >= f.minSovRisk;
}

// ─── Mercator projection ─────────────────────────────────────────────────────
export const MERC_MAX_LAT = 85.05112878;
export function mercator(lat: number, lng: number, w: number, h: number) {
  const clampedLat = Math.max(-MERC_MAX_LAT, Math.min(MERC_MAX_LAT, lat));
  const x = ((lng + 180) / 360) * w;
  const sinLat = Math.sin((clampedLat * Math.PI) / 180);
  const y = h * (0.5 - Math.log((1 + sinLat) / (1 - sinLat)) / (4 * Math.PI));
  return { x, y };
}

/** Inverse Mercator: (x,y) within 0..w × 0..h → (lat,lng). */
export function unmercator(x: number, y: number, w: number, h: number) {
  const lng = (x / w) * 360 - 180;
  const n = Math.PI - 2 * Math.PI * (y / h);
  const lat = (180 / Math.PI) * Math.atan(0.5 * (Math.exp(n) - Math.exp(-n)));
  return { lat, lng };
}

// ─── Great-circle math (for Measure tool) ────────────────────────────────────
const R_EARTH_KM = 6371.0088;
export function haversineKm(lat1: number, lng1: number, lat2: number, lng2: number) {
  const toRad = (d: number) => (d * Math.PI) / 180;
  const dLat = toRad(lat2 - lat1);
  const dLng = toRad(lng2 - lng1);
  const a = Math.sin(dLat / 2) ** 2 +
    Math.cos(toRad(lat1)) * Math.cos(toRad(lat2)) * Math.sin(dLng / 2) ** 2;
  return 2 * R_EARTH_KM * Math.asin(Math.sqrt(a));
}
export function initialBearingDeg(lat1: number, lng1: number, lat2: number, lng2: number) {
  const toRad = (d: number) => (d * Math.PI) / 180;
  const φ1 = toRad(lat1), φ2 = toRad(lat2), Δλ = toRad(lng2 - lng1);
  const y = Math.sin(Δλ) * Math.cos(φ2);
  const x = Math.cos(φ1) * Math.sin(φ2) - Math.sin(φ1) * Math.cos(φ2) * Math.cos(Δλ);
  return ((Math.atan2(y, x) * 180) / Math.PI + 360) % 360;
}
/** Sample N points along the great circle from A to B for SVG drawing. */
export function greatCirclePoints(
  lat1: number, lng1: number, lat2: number, lng2: number, n = 64,
): { lat: number; lng: number }[] {
  const toRad = (d: number) => (d * Math.PI) / 180;
  const toDeg = (r: number) => (r * 180) / Math.PI;
  const φ1 = toRad(lat1), λ1 = toRad(lng1), φ2 = toRad(lat2), λ2 = toRad(lng2);
  const d = 2 * Math.asin(Math.sqrt(
    Math.sin((φ2 - φ1) / 2) ** 2 + Math.cos(φ1) * Math.cos(φ2) * Math.sin((λ2 - λ1) / 2) ** 2,
  ));
  if (d === 0) return [{ lat: lat1, lng: lng1 }];
  const out: { lat: number; lng: number }[] = [];
  for (let i = 0; i <= n; i++) {
    const f = i / n;
    const A = Math.sin((1 - f) * d) / Math.sin(d);
    const B = Math.sin(f * d) / Math.sin(d);
    const x = A * Math.cos(φ1) * Math.cos(λ1) + B * Math.cos(φ2) * Math.cos(λ2);
    const y = A * Math.cos(φ1) * Math.sin(λ1) + B * Math.cos(φ2) * Math.sin(λ2);
    const z = A * Math.sin(φ1) + B * Math.sin(φ2);
    out.push({ lat: toDeg(Math.atan2(z, Math.sqrt(x * x + y * y))), lng: toDeg(Math.atan2(y, x)) });
  }
  return out;
}
