/**
 * Markets & Flows extension layers — shipping lanes & chokepoint stress,
 * country ETF flows (1W net), FX carry, and crypto liquidity hubs/corridors.
 *
 * All data is curated/static (weekly snapshot). Color helpers reuse the same
 * Bloomberg ramp idioms as `markets.ts`.
 */

// ─── Shipping lanes (lng, lat) — coarse polylines for major corridors ────────
export type ShippingLane = {
  id: string;
  name: string;
  /** Ordered [lng, lat] waypoints. */
  path: [number, number][];
};

export const SHIPPING_LANES: ShippingLane[] = [
  { id: 'asia-eu-suez', name: 'Asia ↔ Europe via Suez', path: [
    [103.8, 1.3],   // Singapore
    [80.0, 6.0],    // SW of Sri Lanka
    [55.0, 12.5],   // Gulf of Aden
    [43.5, 12.6],   // Bab el-Mandeb
    [38.5, 22.0],   // Red Sea
    [33.6, 27.2],   // Suez
    [32.3, 31.3],   // Port Said
    [22.0, 35.0],   // Mediterranean
    [5.0, 36.5],    // Gibraltar approach
    [-5.6, 36.0],   // Strait of Gibraltar
    [4.5, 51.95],   // Rotterdam
  ]},
  { id: 'asia-eu-cape', name: 'Asia ↔ Europe via Cape (Red Sea diversion)', path: [
    [103.8, 1.3],   // Singapore
    [80.0, 6.0],
    [55.0, -5.0],
    [40.0, -20.0],
    [25.0, -34.5],  // Cape of Good Hope
    [0.0, -10.0],
    [-15.0, 15.0],
    [-9.0, 38.7],   // Lisbon
    [4.5, 51.95],   // Rotterdam
  ]},
  { id: 'me-asia-hormuz', name: 'Gulf → East Asia via Hormuz/Malacca', path: [
    [50.16, 26.64], // Ras Tanura
    [56.4, 25.5],   // Strait of Hormuz
    [60.0, 22.0],
    [75.0, 8.0],
    [95.0, 5.5],
    [103.8, 1.3],   // Singapore (Malacca)
    [114.2, 22.3],  // Hong Kong
    [121.5, 25.0],  // Taiwan Strait
    [120.4, 36.1],  // Qingdao
  ]},
  { id: 'transpac-n', name: 'Trans-Pacific North (Asia ↔ US W.Coast)', path: [
    [139.65, 35.45], // Yokohama
    [160.0, 42.0],
    [-170.0, 50.0],
    [-140.0, 48.0],
    [-122.7, 37.7],  // SF
    [-118.2, 33.7],  // LA/Long Beach
  ]},
  { id: 'panama', name: 'Panama Canal corridor (US Gulf ↔ Asia)', path: [
    [-90.07, 29.95],  // New Orleans
    [-83.0, 22.0],
    [-79.5, 9.3],     // Panama Canal
    [-95.0, 8.0],
    [-130.0, 15.0],
    [-160.0, 25.0],
    [139.65, 35.45],  // Yokohama
  ]},
  { id: 'bosphorus', name: 'Black Sea grain (Odesa → Bosphorus → Med)', path: [
    [30.74, 46.48],   // Odesa
    [29.0, 41.0],     // Bosphorus
    [26.0, 39.0],     // Aegean
    [29.92, 31.20],   // Alexandria
  ]},
  { id: 'us-eu-atlantic', name: 'Trans-Atlantic (US E.Coast ↔ N.Europe)', path: [
    [-74.0, 40.7],    // NY
    [-50.0, 45.0],
    [-20.0, 50.0],
    [-1.0, 50.5],     // English Channel
    [4.5, 51.95],     // Rotterdam
  ]},
];

// ─── Chokepoint stress (curated 0..100) ──────────────────────────────────────
export type ChokepointStress = {
  id: string;
  name: string;
  lat: number;
  lng: number;
  /** 0..100, blends conflict, transit-delta, diversion. */
  stress: number;
  /** Rough share of seaborne crude (%). */
  crudePct?: number;
  notes: string;
};

export const CHOKEPOINT_STRESS: ChokepointStress[] = [
  { id: 'hormuz',  name: 'Strait of Hormuz',     lat: 26.57, lng: 56.25, stress: 72, crudePct: 21, notes: 'Iran tensions; tanker harassment risk' },
  { id: 'bab',     name: 'Bab el-Mandeb',        lat: 12.58, lng: 43.33, stress: 88, crudePct: 9,  notes: 'Houthi missile/drone attacks; diversions ongoing' },
  { id: 'suez',    name: 'Suez Canal',           lat: 30.04, lng: 32.34, stress: 65, crudePct: 8,  notes: 'Throughput down ~50% vs baseline' },
  { id: 'malacca', name: 'Strait of Malacca',    lat:  2.50, lng:101.50, stress: 28, crudePct: 30, notes: 'Piracy elevated; capacity strained' },
  { id: 'panama',  name: 'Panama Canal',         lat:  9.08, lng: -79.68, stress: 42, crudePct: 1,  notes: 'Drought-driven slot reductions' },
  { id: 'bosp',    name: 'Bosphorus',            lat: 41.11, lng: 29.07, stress: 38, crudePct: 3,  notes: 'Russia/Ukraine grain corridor risk' },
  { id: 'kerch',   name: 'Kerch Strait',         lat: 45.31, lng: 36.50, stress: 78, crudePct: 1,  notes: 'Active conflict zone' },
  { id: 'taiwan',  name: 'Taiwan Strait',        lat: 24.50, lng:120.00, stress: 55, crudePct: 0,  notes: 'PLA exercises; semis-supply choke' },
  { id: 'denmark', name: 'Danish Straits',       lat: 55.50, lng: 10.50, stress: 30, crudePct: 5,  notes: 'Russian shadow fleet inspections' },
  { id: 'capeg',   name: 'Cape of Good Hope',    lat:-34.40, lng: 18.50, stress: 18, crudePct: 0,  notes: 'Re-routed traffic surge from Red Sea' },
];

export function chokeStressColor(s: number): string {
  const t = Math.max(0, Math.min(1, s / 100));
  const hue = 60 - t * 60; // amber → red
  return `hsl(${hue.toFixed(0)}, 92%, ${56 - t * 8}%)`;
}

// ─── Country ETF flows (1W net, $M) ──────────────────────────────────────────
/** Positive = inflows, negative = outflows. ISO_A2 keyed. */
export const ETF_FLOWS_1W: Record<string, { etf: string; netUsdM: number; aumUsdB: number }> = {
  US: { etf: 'SPY',  netUsdM:  +4820, aumUsdB: 590 },
  JP: { etf: 'EWJ',  netUsdM:  +1180, aumUsdB:  18 },
  CN: { etf: 'FXI',  netUsdM:   -680, aumUsdB:   6 },
  IN: { etf: 'INDA', netUsdM:   +540, aumUsdB:  11 },
  KR: { etf: 'EWY',  netUsdM:   +210, aumUsdB:   4 },
  TW: { etf: 'EWT',  netUsdM:   +320, aumUsdB:   5 },
  HK: { etf: 'EWH',  netUsdM:    -85, aumUsdB:   1 },
  BR: { etf: 'EWZ',  netUsdM:   -240, aumUsdB:   5 },
  MX: { etf: 'EWW',  netUsdM:    +95, aumUsdB:   2 },
  AR: { etf: 'ARGT', netUsdM:    +60, aumUsdB:   1 },
  CL: { etf: 'ECH',  netUsdM:    -25, aumUsdB:   0.5 },
  GB: { etf: 'EWU',  netUsdM:   +175, aumUsdB:   3 },
  DE: { etf: 'EWG',  netUsdM:    -90, aumUsdB:   1 },
  FR: { etf: 'EWQ',  netUsdM:    +45, aumUsdB:   0.7 },
  IT: { etf: 'EWI',  netUsdM:    -15, aumUsdB:   0.5 },
  ES: { etf: 'EWP',  netUsdM:    +20, aumUsdB:   0.6 },
  NL: { etf: 'EWN',  netUsdM:    +30, aumUsdB:   0.4 },
  CH: { etf: 'EWL',  netUsdM:    +55, aumUsdB:   1 },
  SE: { etf: 'EWD',  netUsdM:    +12, aumUsdB:   0.3 },
  PL: { etf: 'EPOL', netUsdM:    +18, aumUsdB:   0.4 },
  TR: { etf: 'TUR',  netUsdM:    -45, aumUsdB:   0.4 },
  ZA: { etf: 'EZA',  netUsdM:    -32, aumUsdB:   0.4 },
  SA: { etf: 'KSA',  netUsdM:    +28, aumUsdB:   0.5 },
  AE: { etf: 'UAE',  netUsdM:    +15, aumUsdB:   0.1 },
  SG: { etf: 'EWS',  netUsdM:    +22, aumUsdB:   0.5 },
  AU: { etf: 'EWA',  netUsdM:    +85, aumUsdB:   1 },
  NZ: { etf: 'ENZL', netUsdM:    -10, aumUsdB:   0.1 },
  TH: { etf: 'THD',  netUsdM:    -18, aumUsdB:   0.2 },
  ID: { etf: 'EIDO', netUsdM:    -22, aumUsdB:   0.4 },
  MY: { etf: 'EWM',  netUsdM:    -12, aumUsdB:   0.2 },
  PH: { etf: 'EPHE', netUsdM:    -8,  aumUsdB:   0.1 },
  VN: { etf: 'VNM',  netUsdM:    +14, aumUsdB:   0.5 },
  EG: { etf: 'EGPT', netUsdM:    -6,  aumUsdB:   0.05 },
  IL: { etf: 'EIS',  netUsdM:    +35, aumUsdB:   0.2 },
  CA: { etf: 'EWC',  netUsdM:   +110, aumUsdB:   3 },
};

/** Diverging blue (outflow) ↔ orange (inflow) ramp. Caps |net| at $2000M. */
export function etfFlowColor(netUsdM: number): string {
  const t = Math.max(-1, Math.min(1, netUsdM / 2000));
  if (t >= 0) {
    const a = t;
    return `hsla(28, 95%, ${60 - a * 10}%, ${0.25 + a * 0.45})`;
  }
  const a = -t;
  return `hsla(210, 85%, ${60 - a * 8}%, ${0.25 + a * 0.45})`;
}

// ─── FX carry (vs USD policy rate) ───────────────────────────────────────────
export type CarryPoint = {
  iso: string;
  capital: string;
  lat: number;
  lng: number;
  /** Carry in basis points vs US (policy rate diff). */
  carryBps: number;
  /** 1m implied vol % (curated). */
  vol1m: number;
};

export const FX_CARRY: CarryPoint[] = [
  { iso: 'BR', capital: 'Brasília',     lat: -15.8, lng: -47.9, carryBps: 875, vol1m: 13.5 },
  { iso: 'MX', capital: 'Mexico City',  lat:  19.4, lng: -99.1, carryBps: 500, vol1m: 11.2 },
  { iso: 'TR', capital: 'Ankara',       lat:  39.9, lng:  32.9, carryBps:3800, vol1m: 22.0 },
  { iso: 'ZA', capital: 'Pretoria',     lat: -25.7, lng:  28.2, carryBps: 300, vol1m: 14.8 },
  { iso: 'IN', capital: 'New Delhi',    lat:  28.6, lng:  77.2, carryBps: 175, vol1m:  5.5 },
  { iso: 'ID', capital: 'Jakarta',      lat:  -6.2, lng: 106.8, carryBps: 125, vol1m:  7.5 },
  { iso: 'PH', capital: 'Manila',       lat:  14.6, lng: 121.0, carryBps: 125, vol1m:  6.8 },
  { iso: 'CO', capital: 'Bogotá',       lat:   4.7, lng: -74.1, carryBps: 400, vol1m: 12.5 },
  { iso: 'CL', capital: 'Santiago',     lat: -33.5, lng: -70.7, carryBps:  50, vol1m: 11.8 },
  { iso: 'PL', capital: 'Warsaw',       lat:  52.2, lng:  21.0, carryBps: 125, vol1m:  8.5 },
  { iso: 'HU', capital: 'Budapest',     lat:  47.5, lng:  19.0, carryBps: 200, vol1m:  9.8 },
  { iso: 'JP', capital: 'Tokyo',        lat:  35.7, lng: 139.7, carryBps:-400, vol1m:  9.5 },
  { iso: 'CH', capital: 'Bern',         lat:  46.9, lng:   7.4, carryBps:-425, vol1m:  6.5 },
  { iso: 'EU', capital: 'Frankfurt',    lat:  50.1, lng:   8.7, carryBps:-200, vol1m:  6.8 },
  { iso: 'GB', capital: 'London',       lat:  51.5, lng:  -0.1, carryBps:   0, vol1m:  6.5 },
  { iso: 'AU', capital: 'Canberra',     lat: -35.3, lng: 149.1, carryBps: -40, vol1m:  9.0 },
  { iso: 'NZ', capital: 'Wellington',   lat: -41.3, lng: 174.8, carryBps: -75, vol1m: 10.2 },
];

/** Carry color: green = positive, blue-purple = negative (funder). */
export function carryColor(bps: number): string {
  if (bps >= 0) {
    const t = Math.min(1, bps / 1500);
    return `hsl(${(150 - t * 30).toFixed(0)}, 85%, ${(55 - t * 5).toFixed(0)}%)`;
  }
  const t = Math.min(1, -bps / 500);
  return `hsl(${(220 + t * 40).toFixed(0)}, 75%, ${(60 - t * 5).toFixed(0)}%)`;
}

// ─── Crypto liquidity hubs ───────────────────────────────────────────────────
export type CryptoHub = {
  id: string;
  name: string;
  lat: number;
  lng: number;
  /** Rough 24h spot share (%) attributable to the hub. */
  sharePct: number;
  kind: 'exchange' | 'mining' | 'regulated';
};

export const CRYPTO_HUBS: CryptoHub[] = [
  { id: 'bnb-ae',   name: 'Binance · Dubai',          lat: 25.20, lng:  55.27, sharePct: 22, kind: 'exchange' },
  { id: 'cb-us',    name: 'Coinbase · San Francisco', lat: 37.77, lng:-122.42, sharePct: 11, kind: 'regulated' },
  { id: 'okx-sg',   name: 'OKX · Singapore',          lat:  1.35, lng: 103.82, sharePct:  9, kind: 'exchange' },
  { id: 'bybit-ae', name: 'Bybit · Dubai',            lat: 25.10, lng:  55.18, sharePct:  8, kind: 'exchange' },
  { id: 'upbit-kr', name: 'Upbit · Seoul',            lat: 37.55, lng: 127.00, sharePct:  6, kind: 'regulated' },
  { id: 'bithumb',  name: 'Bithumb · Seoul',          lat: 37.50, lng: 127.04, sharePct:  3, kind: 'regulated' },
  { id: 'kraken',   name: 'Kraken · San Francisco',   lat: 37.78, lng:-122.41, sharePct:  4, kind: 'regulated' },
  { id: 'kucoin',   name: 'KuCoin · Seychelles',      lat: -4.62, lng:  55.45, sharePct:  3, kind: 'exchange' },
  { id: 'bitfinex', name: 'Bitfinex · Hong Kong',     lat: 22.30, lng: 114.17, sharePct:  2, kind: 'exchange' },
  { id: 'gemini',   name: 'Gemini · New York',        lat: 40.71, lng: -74.00, sharePct:  2, kind: 'regulated' },
  { id: 'bitflyer', name: 'bitFlyer · Tokyo',         lat: 35.68, lng: 139.76, sharePct:  2, kind: 'regulated' },
  { id: 'mining-tx',name: 'BTC Mining · Texas',       lat: 31.97, lng:-99.90,  sharePct: 12, kind: 'mining' },
  { id: 'mining-kz',name: 'BTC Mining · Kazakhstan',  lat: 48.02, lng:  66.92, sharePct:  4, kind: 'mining' },
  { id: 'mining-ru',name: 'BTC Mining · Irkutsk',     lat: 52.29, lng: 104.30, sharePct:  4, kind: 'mining' },
  { id: 'mining-py',name: 'BTC Mining · Paraguay',    lat:-25.30, lng: -57.60, sharePct:  2, kind: 'mining' },
  { id: 'sv-bukele',name: 'Bitcoin Beach · El Salv.', lat: 13.49, lng: -89.30, sharePct:  1, kind: 'regulated' },
];

export const CRYPTO_HUB_COLOR: Record<CryptoHub['kind'], string> = {
  exchange:  'hsl(195, 95%, 60%)',
  regulated: 'hsl(150, 80%, 55%)',
  mining:    'hsl(33, 100%, 55%)',
};

/** Top stablecoin / informal corridors. [from, to, label, intensity 0..1] */
export const STABLECOIN_CORRIDORS: {
  id: string; from: [number, number]; to: [number, number]; label: string; intensity: number;
}[] = [
  { id: 'tr-ru', from: [29.0, 41.01], to: [37.6, 55.75], label: 'USDT · TR ↔ RU', intensity: 0.95 },
  { id: 'ng-us', from: [3.38, 6.52],  to: [-74.0, 40.7], label: 'USDT · NG → US', intensity: 0.78 },
  { id: 'ar-us', from: [-58.4, -34.6], to: [-80.2, 25.8], label: 'USDT · AR → US (Miami)', intensity: 0.85 },
  { id: 'ph-ae', from: [121.0, 14.6], to: [55.27, 25.20], label: 'USDC · PH → AE remit', intensity: 0.55 },
  { id: 've-us', from: [-66.9, 10.5], to: [-80.2, 25.8], label: 'USDT · VE → US', intensity: 0.72 },
  { id: 'kr-us', from: [127.0, 37.55], to: [-122.42, 37.77], label: 'KRW kimchi · KR ↔ US', intensity: 0.45 },
  { id: 'ae-in', from: [55.27, 25.20], to: [77.2, 28.6], label: 'USDC · AE → IN', intensity: 0.50 },
];

// ─── Real yields helper ──────────────────────────────────────────────────────
/** Real yield ramp: deeply negative red → 0 amber → positive teal. Caps at ±8%. */
export function realYieldColor(realPct: number | null | undefined): string {
  if (realPct == null || !Number.isFinite(realPct)) return 'hsl(220, 15%, 30%)';
  const t = Math.max(-1, Math.min(1, realPct / 8));
  if (t >= 0) {
    const a = t;
    return `hsla(170, 80%, ${50 - a * 8}%, ${0.30 + a * 0.45})`;
  }
  const a = -t;
  return `hsla(0, 85%, ${58 - a * 6}%, ${0.30 + a * 0.45})`;
}
