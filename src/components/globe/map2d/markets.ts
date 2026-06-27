/**
 * Markets & Macro overlay datasets for the 2D map.
 *
 * Curated weekly snapshots — no edge function required. All values approximate
 * recent observations and are intended for visualization, not trading.
 *
 * Country lookup keys use ISO_A2 to match the GeoJSON properties used by
 * `Map2D.tsx`. Capital lat/lng powers CDS bubbles.
 */

// ─── ISO_A2 → currency code ──────────────────────────────────────────────────
export const COUNTRY_CCY: Record<string, string> = {
  US: 'USD', CA: 'CAD', MX: 'MXN', BR: 'BRL', AR: 'ARS', CL: 'CLP', CO: 'COP', PE: 'PEN',
  GB: 'GBP', IE: 'EUR', FR: 'EUR', DE: 'EUR', IT: 'EUR', ES: 'EUR', PT: 'EUR', NL: 'EUR',
  BE: 'EUR', AT: 'EUR', GR: 'EUR', FI: 'EUR', LU: 'EUR',
  CH: 'CHF', SE: 'SEK', NO: 'NOK', DK: 'DKK', PL: 'PLN', CZ: 'CZK', HU: 'HUF', RO: 'RON',
  TR: 'TRY', RU: 'RUB', UA: 'UAH',
  CN: 'CNY', JP: 'JPY', KR: 'KRW', TW: 'TWD', HK: 'HKD', SG: 'SGD', MY: 'MYR', TH: 'THB',
  ID: 'IDR', PH: 'PHP', VN: 'VND', IN: 'INR', PK: 'PKR', BD: 'BDT',
  AU: 'AUD', NZ: 'NZD',
  ZA: 'ZAR', NG: 'NGN', EG: 'EGP', MA: 'MAD', KE: 'KES',
  AE: 'AED', SA: 'SAR', QA: 'QAR', IL: 'ILS',
};

// ─── Sovereign 10Y yields (approx, % — weekly snapshot) ─────────────────────
export const SOV_YIELD_10Y: Record<string, { lvl: number; chg1m: number }> = {
  US: { lvl: 4.32, chg1m: -0.18 },
  CA: { lvl: 3.51, chg1m: -0.15 }, MX: { lvl: 9.85, chg1m: 0.22 },
  BR: { lvl: 12.10, chg1m: 0.35 }, CL: { lvl: 5.95, chg1m: 0.10 }, CO: { lvl: 9.20, chg1m: 0.05 },
  GB: { lvl: 4.45, chg1m: -0.10 }, DE: { lvl: 2.42, chg1m: -0.20 }, FR: { lvl: 3.18, chg1m: -0.05 },
  IT: { lvl: 3.65, chg1m: -0.12 }, ES: { lvl: 3.10, chg1m: -0.18 }, PT: { lvl: 3.05, chg1m: -0.20 },
  NL: { lvl: 2.65, chg1m: -0.18 }, BE: { lvl: 2.95, chg1m: -0.16 }, AT: { lvl: 2.92, chg1m: -0.18 },
  GR: { lvl: 3.35, chg1m: -0.10 }, IE: { lvl: 2.78, chg1m: -0.15 },
  CH: { lvl: 0.55, chg1m: -0.05 }, SE: { lvl: 2.25, chg1m: -0.12 }, NO: { lvl: 4.05, chg1m: 0.05 },
  DK: { lvl: 2.65, chg1m: -0.15 }, PL: { lvl: 5.55, chg1m: 0.05 }, CZ: { lvl: 4.20, chg1m: 0.00 },
  HU: { lvl: 6.95, chg1m: 0.18 }, RO: { lvl: 7.20, chg1m: 0.10 },
  TR: { lvl: 28.50, chg1m: 0.50 }, RU: { lvl: 14.20, chg1m: 0.40 },
  CN: { lvl: 1.92, chg1m: -0.08 }, JP: { lvl: 1.05, chg1m: 0.05 }, KR: { lvl: 3.05, chg1m: -0.05 },
  TW: { lvl: 1.55, chg1m: -0.02 }, HK: { lvl: 3.85, chg1m: -0.10 }, SG: { lvl: 2.95, chg1m: -0.08 },
  TH: { lvl: 2.45, chg1m: -0.05 }, ID: { lvl: 6.85, chg1m: 0.10 }, MY: { lvl: 3.85, chg1m: -0.02 },
  PH: { lvl: 6.20, chg1m: 0.05 }, VN: { lvl: 3.05, chg1m: 0.00 },
  IN: { lvl: 6.85, chg1m: -0.05 }, PK: { lvl: 13.20, chg1m: -0.20 },
  AU: { lvl: 4.40, chg1m: -0.05 }, NZ: { lvl: 4.55, chg1m: -0.10 },
  ZA: { lvl: 9.85, chg1m: 0.10 }, NG: { lvl: 17.50, chg1m: 0.30 }, EG: { lvl: 24.50, chg1m: 0.20 },
  AE: { lvl: 4.15, chg1m: -0.10 }, SA: { lvl: 4.85, chg1m: -0.05 }, IL: { lvl: 4.55, chg1m: -0.15 },
};

// ─── Sovereign 2Y yields (%, weekly snapshot) — for yield curve spread ───────
export const SOV_YIELD_2Y: Record<string, { lvl: number; chg1m: number }> = {
  US: { lvl: 4.65, chg1m: -0.22 }, CA: { lvl: 3.72, chg1m: -0.18 }, MX: { lvl: 10.40, chg1m: 0.15 },
  BR: { lvl: 13.80, chg1m: 0.40 }, CL: { lvl: 6.10, chg1m: 0.08 },
  GB: { lvl: 4.52, chg1m: -0.12 }, DE: { lvl: 2.65, chg1m: -0.22 }, FR: { lvl: 2.90, chg1m: -0.08 },
  IT: { lvl: 3.42, chg1m: -0.15 }, ES: { lvl: 2.88, chg1m: -0.20 },
  NL: { lvl: 2.68, chg1m: -0.20 }, CH: { lvl: 0.35, chg1m: -0.06 },
  SE: { lvl: 2.10, chg1m: -0.15 }, NO: { lvl: 4.08, chg1m: 0.04 },
  PL: { lvl: 5.80, chg1m: 0.04 }, CZ: { lvl: 3.90, chg1m: -0.02 },
  HU: { lvl: 6.80, chg1m: 0.15 }, TR: { lvl: 32.50, chg1m: 0.45 }, RU: { lvl: 15.80, chg1m: 0.55 },
  CN: { lvl: 1.72, chg1m: -0.10 }, JP: { lvl: 0.72, chg1m: 0.08 }, KR: { lvl: 2.92, chg1m: -0.06 },
  TW: { lvl: 1.25, chg1m: -0.04 }, SG: { lvl: 3.05, chg1m: -0.10 }, HK: { lvl: 4.20, chg1m: -0.12 },
  IN: { lvl: 6.68, chg1m: -0.06 }, PK: { lvl: 12.80, chg1m: -0.25 },
  AU: { lvl: 4.28, chg1m: -0.08 }, NZ: { lvl: 4.38, chg1m: -0.12 },
  ZA: { lvl: 9.45, chg1m: 0.08 }, NG: { lvl: 18.20, chg1m: 0.35 }, EG: { lvl: 26.00, chg1m: 0.25 },
  SA: { lvl: 5.10, chg1m: -0.06 }, AE: { lvl: 4.30, chg1m: -0.12 }, IL: { lvl: 4.80, chg1m: -0.20 },
};

// ─── Sovereign 5Y CDS spreads (bps, weekly snapshot) ────────────────────────
export type CDSPoint = { iso: string; capital: string; lat: number; lng: number; bps: number };
export const SOV_CDS_5Y: CDSPoint[] = [
  { iso: 'US', capital: 'Washington', lat: 38.9, lng: -77.0, bps: 38 },
  { iso: 'CA', capital: 'Ottawa', lat: 45.4, lng: -75.7, bps: 32 },
  { iso: 'MX', capital: 'Mexico City', lat: 19.4, lng: -99.1, bps: 105 },
  { iso: 'BR', capital: 'Brasília', lat: -15.8, lng: -47.9, bps: 178 },
  { iso: 'AR', capital: 'Buenos Aires', lat: -34.6, lng: -58.4, bps: 760 },
  { iso: 'CL', capital: 'Santiago', lat: -33.5, lng: -70.7, bps: 78 },
  { iso: 'CO', capital: 'Bogotá', lat: 4.7, lng: -74.1, bps: 165 },
  { iso: 'PE', capital: 'Lima', lat: -12.0, lng: -77.0, bps: 92 },
  { iso: 'GB', capital: 'London', lat: 51.5, lng: -0.1, bps: 25 },
  { iso: 'DE', capital: 'Berlin', lat: 52.5, lng: 13.4, bps: 12 },
  { iso: 'FR', capital: 'Paris', lat: 48.9, lng: 2.4, bps: 35 },
  { iso: 'IT', capital: 'Rome', lat: 41.9, lng: 12.5, bps: 70 },
  { iso: 'ES', capital: 'Madrid', lat: 40.4, lng: -3.7, bps: 42 },
  { iso: 'PT', capital: 'Lisbon', lat: 38.7, lng: -9.1, bps: 38 },
  { iso: 'GR', capital: 'Athens', lat: 38.0, lng: 23.7, bps: 75 },
  { iso: 'IE', capital: 'Dublin', lat: 53.3, lng: -6.3, bps: 30 },
  { iso: 'NL', capital: 'Amsterdam', lat: 52.4, lng: 4.9, bps: 18 },
  { iso: 'BE', capital: 'Brussels', lat: 50.8, lng: 4.4, bps: 28 },
  { iso: 'CH', capital: 'Bern', lat: 46.9, lng: 7.4, bps: 8 },
  { iso: 'SE', capital: 'Stockholm', lat: 59.3, lng: 18.1, bps: 14 },
  { iso: 'NO', capital: 'Oslo', lat: 59.9, lng: 10.8, bps: 12 },
  { iso: 'PL', capital: 'Warsaw', lat: 52.2, lng: 21.0, bps: 65 },
  { iso: 'CZ', capital: 'Prague', lat: 50.1, lng: 14.4, bps: 45 },
  { iso: 'HU', capital: 'Budapest', lat: 47.5, lng: 19.0, bps: 145 },
  { iso: 'RO', capital: 'Bucharest', lat: 44.4, lng: 26.1, bps: 175 },
  { iso: 'TR', capital: 'Ankara', lat: 39.9, lng: 32.9, bps: 285 },
  { iso: 'RU', capital: 'Moscow', lat: 55.8, lng: 37.6, bps: 850 },
  { iso: 'UA', capital: 'Kyiv', lat: 50.5, lng: 30.5, bps: 1850 },
  { iso: 'CN', capital: 'Beijing', lat: 39.9, lng: 116.4, bps: 65 },
  { iso: 'JP', capital: 'Tokyo', lat: 35.7, lng: 139.7, bps: 22 },
  { iso: 'KR', capital: 'Seoul', lat: 37.6, lng: 127.0, bps: 35 },
  { iso: 'TW', capital: 'Taipei', lat: 25.0, lng: 121.5, bps: 95 },
  { iso: 'HK', capital: 'Hong Kong', lat: 22.3, lng: 114.2, bps: 55 },
  { iso: 'SG', capital: 'Singapore', lat: 1.3, lng: 103.8, bps: 20 },
  { iso: 'TH', capital: 'Bangkok', lat: 13.8, lng: 100.5, bps: 50 },
  { iso: 'ID', capital: 'Jakarta', lat: -6.2, lng: 106.8, bps: 95 },
  { iso: 'MY', capital: 'Kuala Lumpur', lat: 3.1, lng: 101.7, bps: 55 },
  { iso: 'PH', capital: 'Manila', lat: 14.6, lng: 121.0, bps: 92 },
  { iso: 'VN', capital: 'Hanoi', lat: 21.0, lng: 105.8, bps: 105 },
  { iso: 'IN', capital: 'New Delhi', lat: 28.6, lng: 77.2, bps: 75 },
  { iso: 'PK', capital: 'Islamabad', lat: 33.7, lng: 73.0, bps: 580 },
  { iso: 'AU', capital: 'Canberra', lat: -35.3, lng: 149.1, bps: 18 },
  { iso: 'NZ', capital: 'Wellington', lat: -41.3, lng: 174.8, bps: 22 },
  { iso: 'ZA', capital: 'Pretoria', lat: -25.7, lng: 28.2, bps: 220 },
  { iso: 'NG', capital: 'Abuja', lat: 9.1, lng: 7.5, bps: 480 },
  { iso: 'EG', capital: 'Cairo', lat: 30.0, lng: 31.2, bps: 525 },
  { iso: 'MA', capital: 'Rabat', lat: 34.0, lng: -6.8, bps: 145 },
  { iso: 'AE', capital: 'Abu Dhabi', lat: 24.5, lng: 54.4, bps: 42 },
  { iso: 'SA', capital: 'Riyadh', lat: 24.7, lng: 46.7, bps: 55 },
  { iso: 'QA', capital: 'Doha', lat: 25.3, lng: 51.5, bps: 45 },
  { iso: 'IL', capital: 'Jerusalem', lat: 31.8, lng: 35.2, bps: 135 },
];

// ─── Policy rates (%, weekly snapshot) ──────────────────────────────────────
export const POLICY_RATE: Record<string, { lvl: number; chg1y: number }> = {
  US: { lvl: 4.50, chg1y: -1.00 }, CA: { lvl: 3.25, chg1y: -1.75 }, MX: { lvl: 9.50, chg1y: -1.75 },
  BR: { lvl: 13.25, chg1y: 1.50 }, CL: { lvl: 5.00, chg1y: -3.75 }, CO: { lvl: 8.50, chg1y: -4.50 },
  GB: { lvl: 4.50, chg1y: -0.75 }, DE: { lvl: 2.50, chg1y: -1.75 }, FR: { lvl: 2.50, chg1y: -1.75 },
  IT: { lvl: 2.50, chg1y: -1.75 }, ES: { lvl: 2.50, chg1y: -1.75 }, NL: { lvl: 2.50, chg1y: -1.75 },
  CH: { lvl: 0.25, chg1y: -1.50 }, SE: { lvl: 2.00, chg1y: -2.25 }, NO: { lvl: 4.00, chg1y: -0.50 },
  PL: { lvl: 5.75, chg1y: 0.00 }, CZ: { lvl: 3.75, chg1y: -3.25 }, HU: { lvl: 6.50, chg1y: -3.25 },
  TR: { lvl: 42.50, chg1y: -7.50 }, RU: { lvl: 21.00, chg1y: 5.00 },
  CN: { lvl: 3.10, chg1y: -0.35 }, JP: { lvl: 0.50, chg1y: 0.50 }, KR: { lvl: 2.75, chg1y: -0.75 },
  HK: { lvl: 4.75, chg1y: -1.00 }, SG: { lvl: 3.25, chg1y: -0.50 }, TW: { lvl: 2.00, chg1y: 0.125 },
  TH: { lvl: 2.00, chg1y: -0.50 }, ID: { lvl: 5.75, chg1y: -0.50 }, MY: { lvl: 3.00, chg1y: 0.00 },
  PH: { lvl: 5.75, chg1y: -1.00 }, VN: { lvl: 4.50, chg1y: 0.00 },
  IN: { lvl: 6.25, chg1y: -0.25 }, PK: { lvl: 11.00, chg1y: -11.00 },
  AU: { lvl: 4.10, chg1y: -0.25 }, NZ: { lvl: 3.75, chg1y: -1.75 },
  ZA: { lvl: 7.50, chg1y: -0.75 }, NG: { lvl: 27.50, chg1y: 5.00 }, EG: { lvl: 27.25, chg1y: 6.00 },
  AE: { lvl: 4.40, chg1y: -1.00 }, SA: { lvl: 5.00, chg1y: -1.00 }, IL: { lvl: 4.50, chg1y: 0.00 },
};

// ─── Inflation YoY (%, weekly snapshot) ─────────────────────────────────────
export const CPI_YOY: Record<string, { lvl: number; chg1y: number }> = {
  US: { lvl: 3.0, chg1y: -0.4 }, CA: { lvl: 1.9, chg1y: -1.1 }, MX: { lvl: 4.1, chg1y: -0.6 },
  BR: { lvl: 5.1, chg1y: 0.3 }, CL: { lvl: 4.2, chg1y: 0.6 }, CO: { lvl: 5.2, chg1y: -3.0 },
  GB: { lvl: 3.0, chg1y: -0.2 }, DE: { lvl: 2.3, chg1y: 0.1 }, FR: { lvl: 1.8, chg1y: -0.7 },
  IT: { lvl: 1.7, chg1y: 0.5 }, ES: { lvl: 2.9, chg1y: 0.3 }, NL: { lvl: 3.2, chg1y: 0.5 },
  CH: { lvl: 0.4, chg1y: -0.9 }, SE: { lvl: 1.0, chg1y: -1.5 }, NO: { lvl: 2.3, chg1y: -2.5 },
  PL: { lvl: 5.0, chg1y: 2.5 }, CZ: { lvl: 2.8, chg1y: 0.7 }, HU: { lvl: 5.5, chg1y: 1.7 },
  TR: { lvl: 42.0, chg1y: -22.0 }, RU: { lvl: 9.5, chg1y: 1.5 },
  CN: { lvl: 0.5, chg1y: 0.4 }, JP: { lvl: 3.7, chg1y: 1.5 }, KR: { lvl: 2.0, chg1y: -0.8 },
  TW: { lvl: 2.1, chg1y: -0.2 }, SG: { lvl: 1.5, chg1y: -1.4 }, TH: { lvl: 1.0, chg1y: 0.4 },
  ID: { lvl: 1.8, chg1y: -1.0 }, MY: { lvl: 1.7, chg1y: -0.1 }, PH: { lvl: 2.9, chg1y: -0.9 },
  VN: { lvl: 3.6, chg1y: -0.2 }, IN: { lvl: 5.2, chg1y: -0.3 }, PK: { lvl: 4.1, chg1y: -19.0 },
  AU: { lvl: 2.4, chg1y: -1.2 }, NZ: { lvl: 2.2, chg1y: -1.8 },
  ZA: { lvl: 3.2, chg1y: -2.2 }, NG: { lvl: 24.5, chg1y: -8.0 }, EG: { lvl: 24.0, chg1y: -8.0 },
  AE: { lvl: 1.7, chg1y: -0.6 }, SA: { lvl: 2.0, chg1y: 0.4 }, IL: { lvl: 3.4, chg1y: 0.7 },
};

// ─── GDP growth YoY (%, approximate current) ─────────────────────────────────
export const GDP_GROWTH: Record<string, { lvl: number; chg1y: number }> = {
  US: { lvl: 2.4, chg1y: 0.3 }, CA: { lvl: 1.8, chg1y: 0.2 }, MX: { lvl: 1.2, chg1y: -0.8 },
  BR: { lvl: 2.5, chg1y: 0.1 }, AR: { lvl: 4.8, chg1y: 8.2 }, CL: { lvl: 2.0, chg1y: 0.6 },
  CO: { lvl: 1.8, chg1y: -0.4 }, PE: { lvl: 2.5, chg1y: 0.3 },
  GB: { lvl: 1.0, chg1y: 0.2 }, DE: { lvl: 0.4, chg1y: 0.8 }, FR: { lvl: 1.1, chg1y: 0.3 },
  IT: { lvl: 0.7, chg1y: 0.2 }, ES: { lvl: 2.8, chg1y: 0.1 }, NL: { lvl: 1.8, chg1y: 0.6 },
  BE: { lvl: 1.2, chg1y: 0.2 }, AT: { lvl: 0.8, chg1y: 0.5 }, GR: { lvl: 2.0, chg1y: 0.2 },
  PT: { lvl: 2.2, chg1y: -0.1 }, IE: { lvl: 4.5, chg1y: 1.0 },
  CH: { lvl: 1.5, chg1y: 0.2 }, SE: { lvl: 1.0, chg1y: 0.6 }, NO: { lvl: 2.0, chg1y: 0.4 },
  DK: { lvl: 2.2, chg1y: 0.5 }, PL: { lvl: 3.2, chg1y: 0.2 }, CZ: { lvl: 1.8, chg1y: 0.5 },
  HU: { lvl: 2.5, chg1y: 0.8 }, RO: { lvl: 2.8, chg1y: 0.2 },
  TR: { lvl: 3.5, chg1y: -0.8 }, RU: { lvl: 1.8, chg1y: -1.0 }, UA: { lvl: -3.5, chg1y: 1.2 },
  CN: { lvl: 4.8, chg1y: -0.2 }, JP: { lvl: 0.8, chg1y: 0.5 }, KR: { lvl: 2.1, chg1y: 0.3 },
  TW: { lvl: 3.2, chg1y: -0.5 }, HK: { lvl: 2.5, chg1y: 1.0 }, SG: { lvl: 2.8, chg1y: 0.4 },
  TH: { lvl: 2.5, chg1y: 0.8 }, ID: { lvl: 5.0, chg1y: 0.1 }, MY: { lvl: 4.5, chg1y: 0.2 },
  PH: { lvl: 5.8, chg1y: -0.2 }, VN: { lvl: 6.5, chg1y: 0.3 },
  IN: { lvl: 6.5, chg1y: -0.4 }, PK: { lvl: 2.5, chg1y: 2.2 }, BD: { lvl: 5.5, chg1y: -0.5 },
  AU: { lvl: 1.5, chg1y: 0.2 }, NZ: { lvl: 0.8, chg1y: 0.5 },
  ZA: { lvl: 1.0, chg1y: 0.2 }, NG: { lvl: 3.2, chg1y: 0.3 }, EG: { lvl: 4.2, chg1y: -0.5 },
  KE: { lvl: 5.0, chg1y: 0.2 }, MA: { lvl: 3.5, chg1y: 0.5 },
  AE: { lvl: 4.0, chg1y: 0.2 }, SA: { lvl: 2.5, chg1y: 1.0 }, QA: { lvl: 2.0, chg1y: 0.5 },
  IL: { lvl: 3.5, chg1y: -3.5 },
};

// ─── Unemployment rate (%, approximate current) ──────────────────────────────
export const UNEMPLOYMENT: Record<string, { lvl: number; chg1y: number }> = {
  US: { lvl: 4.2, chg1y: 0.5 }, CA: { lvl: 6.8, chg1y: 0.8 }, MX: { lvl: 3.1, chg1y: 0.1 },
  BR: { lvl: 6.8, chg1y: -1.2 }, AR: { lvl: 6.5, chg1y: -3.0 }, CL: { lvl: 8.2, chg1y: 0.2 },
  CO: { lvl: 9.8, chg1y: -0.5 }, PE: { lvl: 6.2, chg1y: 0.2 },
  GB: { lvl: 4.5, chg1y: 0.3 }, DE: { lvl: 3.5, chg1y: 0.4 }, FR: { lvl: 7.2, chg1y: -0.1 },
  IT: { lvl: 6.1, chg1y: -0.4 }, ES: { lvl: 11.5, chg1y: -0.8 }, GR: { lvl: 9.5, chg1y: -0.9 },
  PT: { lvl: 6.4, chg1y: -0.3 }, NL: { lvl: 3.8, chg1y: 0.2 }, BE: { lvl: 5.5, chg1y: 0.0 },
  CH: { lvl: 2.4, chg1y: 0.2 }, SE: { lvl: 8.5, chg1y: 0.3 }, NO: { lvl: 4.0, chg1y: 0.3 },
  PL: { lvl: 3.0, chg1y: 0.0 }, CZ: { lvl: 2.9, chg1y: 0.1 }, HU: { lvl: 4.2, chg1y: 0.2 },
  TR: { lvl: 8.8, chg1y: -0.5 }, RU: { lvl: 2.4, chg1y: -0.5 },
  CN: { lvl: 5.1, chg1y: 0.1 }, JP: { lvl: 2.5, chg1y: -0.1 }, KR: { lvl: 3.0, chg1y: 0.1 },
  TW: { lvl: 3.5, chg1y: -0.1 }, SG: { lvl: 2.0, chg1y: -0.1 }, HK: { lvl: 3.1, chg1y: 0.1 },
  IN: { lvl: 8.5, chg1y: -0.5 }, ID: { lvl: 5.2, chg1y: -0.3 }, TH: { lvl: 1.1, chg1y: 0.1 },
  PH: { lvl: 4.1, chg1y: -0.3 }, VN: { lvl: 2.3, chg1y: -0.1 }, MY: { lvl: 3.4, chg1y: -0.1 },
  AU: { lvl: 4.0, chg1y: 0.2 }, NZ: { lvl: 5.1, chg1y: 0.5 },
  ZA: { lvl: 32.5, chg1y: 0.2 }, NG: { lvl: 5.3, chg1y: -0.2 }, EG: { lvl: 7.1, chg1y: -0.5 },
  SA: { lvl: 7.5, chg1y: -0.5 }, AE: { lvl: 2.7, chg1y: -0.1 },
  IL: { lvl: 4.5, chg1y: 1.5 },
};

// ─── Government debt as % of GDP (approximate) ───────────────────────────────
export const DEBT_GDP: Record<string, number> = {
  US: 124, CA: 107, MX: 53, BR: 89, AR: 80, CL: 40, CO: 57, PE: 35,
  GB: 101, DE: 65, FR: 111, IT: 140, ES: 107, PT: 105, NL: 48, BE: 105,
  AT: 78, GR: 162, IE: 43,
  CH: 17, SE: 33, NO: 18, DK: 29, PL: 58, CZ: 44, HU: 73, RO: 55,
  TR: 32, RU: 22, UA: 82,
  CN: 88, JP: 261, KR: 51, TW: 27, SG: 168, HK: 1,
  TH: 63, ID: 40, MY: 66, PH: 58, VN: 40, IN: 82, PK: 77,
  AU: 47, NZ: 46,
  ZA: 74, NG: 41, EG: 89, MA: 72, KE: 68,
  SA: 26, AE: 30, QA: 48, IL: 62,
};

// ─── Current account balance as % of GDP ─────────────────────────────────────
export const CURRENT_ACCOUNT: Record<string, number> = {
  US: -3.2, CA: -1.5, MX: -0.8, BR: -2.1, AR: 0.3, CL: -3.2, CO: -3.5, PE: 0.5,
  GB: -3.5, DE: 5.5, FR: -1.5, IT: 1.2, ES: 2.0, PT: 1.5, NL: 8.5, BE: -1.5,
  CH: 9.0, SE: 6.0, NO: 22.0, DK: 9.5, PL: -2.5, CZ: -0.8, HU: -0.5, RO: -7.5,
  TR: -2.5, RU: 2.5,
  CN: 1.5, JP: 3.5, KR: 3.8, TW: 13.5, SG: 17.0, HK: 12.0,
  TH: 2.5, ID: -1.0, MY: 3.5, PH: -2.8, VN: 3.5, IN: -1.1, PK: -1.5,
  AU: -1.5, NZ: -6.5,
  ZA: -2.0, NG: 1.5, EG: -3.5,
  SA: 3.5, AE: 8.5, QA: 15.0, KW: 20.0, IL: 4.0,
};

// ─── Manufacturing PMI (current reading, 50 = neutral) ───────────────────────
export const MFG_PMI: Record<string, { lvl: number; chg1m: number }> = {
  US: { lvl: 50.2, chg1m:  0.3 }, CA: { lvl: 49.5, chg1m: -0.2 }, MX: { lvl: 48.8, chg1m: -0.5 },
  BR: { lvl: 51.5, chg1m:  0.4 }, AR: { lvl: 52.0, chg1m:  1.2 },
  GB: { lvl: 45.8, chg1m: -0.8 }, DE: { lvl: 44.5, chg1m:  0.5 }, FR: { lvl: 46.0, chg1m:  0.3 },
  IT: { lvl: 49.2, chg1m:  0.8 }, ES: { lvl: 51.0, chg1m:  0.2 }, NL: { lvl: 50.5, chg1m:  0.4 },
  SE: { lvl: 49.5, chg1m:  0.3 }, PL: { lvl: 50.8, chg1m:  1.0 }, CZ: { lvl: 50.2, chg1m:  0.5 },
  TR: { lvl: 52.5, chg1m: -0.3 }, RU: { lvl: 53.0, chg1m:  0.4 },
  CN: { lvl: 49.5, chg1m: -0.3 }, JP: { lvl: 48.7, chg1m: -0.5 }, KR: { lvl: 50.8, chg1m:  0.4 },
  TW: { lvl: 51.5, chg1m:  0.5 }, IN: { lvl: 58.5, chg1m:  0.8 }, ID: { lvl: 52.0, chg1m:  0.3 },
  TH: { lvl: 50.5, chg1m:  0.2 }, VN: { lvl: 54.0, chg1m:  0.5 }, MY: { lvl: 50.3, chg1m:  0.1 },
  AU: { lvl: 48.5, chg1m: -0.2 }, NZ: { lvl: 47.5, chg1m: -0.5 },
  ZA: { lvl: 50.5, chg1m:  0.5 }, SA: { lvl: 55.0, chg1m:  0.3 }, AE: { lvl: 54.5, chg1m:  0.2 },
};

// ─── Color ramps ────────────────────────────────────────────────────────────

// ─── Military spending % of GDP (SIPRI 2024 data) ────────────────────────────
export const MILITARY_SPEND_GDP: Record<string, number> = {
  UA: 37.0, RU: 6.7, IL: 5.3, PL: 4.2, GR: 3.1, US: 3.4, QA: 3.3,
  SA: 6.0, AE: 5.5, KW: 5.1, JO: 4.8, OM: 4.5,
  KR: 2.8, SG: 3.1, AU: 2.1, NO: 1.9, GB: 2.3,
  CN: 1.7, IN: 2.4, PK: 3.2,
  FR: 2.1, DE: 2.1, FI: 2.4, SE: 1.7, LV: 2.3, EE: 3.2, LT: 2.9,
  TR: 1.5, EG: 1.2, MA: 3.3, NG: 0.6, ZA: 0.8,
  CA: 1.4, JP: 1.2, IT: 1.4, ES: 1.3, NL: 1.8, BE: 1.2,
  CH: 0.7, AT: 0.8, PT: 1.5, CZ: 2.1, HU: 2.1, RO: 1.7,
  ID: 0.7, TH: 1.3, PH: 1.4, MY: 1.0, VN: 2.4,
  BR: 1.1, AR: 0.7, CL: 1.8, CO: 3.2, PE: 1.4,
  AZ: 5.8, AM: 4.9, KZ: 0.9,
};

// ─── FX reserves (months of import cover — IMF IFS data) ─────────────────────
export const FX_RESERVES_MONTHS: Record<string, number> = {
  CN: 18, TW: 24, KR: 8, SG: 22, HK: 28, JP: 22,
  IN: 11, PK: 2, BD: 3, LK: 3,
  SA: 24, QA: 28, AE: 12, KW: 20, OM: 8,
  TH: 11, ID: 7, MY: 7, PH: 9, VN: 4,
  EG: 4, MA: 8, NG: 5, KE: 4, TZ: 5, ZA: 6,
  BR: 18, MX: 5, CL: 7, CO: 9, PE: 22, AR: 1,
  RU: 16, KZ: 6, UA: 4,
  NO: 12, CH: 18, CZ: 8, PL: 6, HU: 5, RO: 5,
  AU: 4, NZ: 4, CA: 3,
  US: 1, GB: 1, DE: 1, FR: 1, IT: 1,
  TR: 3, IL: 15,
};

/** ±% green↔red diverging ramp (FX heat). |pct| capped at 3. */
export function fxHeatColor(pct: number | null | undefined): string {
  if (pct == null || !Number.isFinite(pct)) return 'hsl(220, 15%, 30%)';
  const t = Math.max(-1, Math.min(1, pct / 3));
  if (t >= 0) {
    const a = t; // 0..1
    return `hsla(150, 80%, ${50 - a * 10}%, ${0.18 + a * 0.45})`;
  }
  const a = -t;
  return `hsla(0, 85%, ${55 - a * 5}%, ${0.18 + a * 0.45})`;
}

/** Yield level cool↔hot ramp. lvl in % (0..30). */
export function yieldColor(lvl: number | null | undefined): string {
  if (lvl == null || !Number.isFinite(lvl)) return 'hsl(220, 15%, 30%)';
  const t = Math.max(0, Math.min(1, lvl / 15));
  // teal (200) → orange (30) → deep red (0)
  const hue = 200 - t * 200;
  return `hsla(${hue.toFixed(0)}, 85%, ${50 - t * 10}%, ${0.30 + t * 0.40})`;
}

/** CDS spread bps → ramp. Caps at 800 bps. */
export function cdsColor(bps: number): string {
  const t = Math.max(0, Math.min(1, bps / 500));
  const hue = 60 - t * 60; // amber → red
  return `hsl(${hue.toFixed(0)}, 90%, ${55 - t * 10}%)`;
}

/** Policy rate or CPI level → ramp. Caps at 20%. */
export function macroLevelColor(lvl: number | null | undefined): string {
  if (lvl == null || !Number.isFinite(lvl)) return 'hsl(220, 15%, 30%)';
  const t = Math.max(0, Math.min(1, lvl / 12));
  const hue = 220 - t * 220; // blue → red
  return `hsla(${hue.toFixed(0)}, 80%, ${52 - t * 8}%, ${0.30 + t * 0.40})`;
}

/** GDP growth diverging: red (contraction) → neutral → green (strong growth). Caps at ±8%. */
export function gdpColor(lvl: number | null | undefined): string {
  if (lvl == null || !Number.isFinite(lvl)) return 'hsl(220, 15%, 30%)';
  const t = Math.max(-1, Math.min(1, lvl / 6));
  if (t >= 0) {
    return `hsla(150, 80%, ${50 - t * 8}%, ${0.25 + t * 0.45})`;
  }
  const a = -t;
  return `hsla(0, 85%, ${55 - a * 5}%, ${0.25 + a * 0.45})`;
}

/** Unemployment → warm ramp: green (low) → red (high). Caps at 25%. */
export function unemployColor(lvl: number | null | undefined): string {
  if (lvl == null || !Number.isFinite(lvl)) return 'hsl(220, 15%, 30%)';
  const t = Math.max(0, Math.min(1, lvl / 20));
  const hue = 150 - t * 150; // green → red
  return `hsla(${hue.toFixed(0)}, 80%, ${52 - t * 10}%, ${0.25 + t * 0.45})`;
}

/** Debt/GDP ramp: teal (low) → amber → deep red (high). Caps at 200%. */
export function debtGdpColor(lvl: number | null | undefined): string {
  if (lvl == null || !Number.isFinite(lvl)) return 'hsl(220, 15%, 30%)';
  const t = Math.max(0, Math.min(1, lvl / 150));
  const hue = 180 - t * 180;
  return `hsla(${hue.toFixed(0)}, 80%, ${52 - t * 10}%, ${0.28 + t * 0.42})`;
}

/** Current account diverging: blue (surplus) → neutral gray → orange (deficit). Caps at ±15%. */
export function currentAccountColor(lvl: number | null | undefined): string {
  if (lvl == null || !Number.isFinite(lvl)) return 'hsl(220, 15%, 30%)';
  const t = Math.max(-1, Math.min(1, lvl / 12));
  if (t >= 0) return `hsla(210, 85%, ${55 - t * 8}%, ${0.25 + t * 0.45})`;
  const a = -t;
  return `hsla(28, 95%, ${56 - a * 8}%, ${0.25 + a * 0.45})`;
}

/** PMI diverging: red (<47) → amber (47-50) → green (>53). */
export function pmiColor(lvl: number | null | undefined): string {
  if (lvl == null || !Number.isFinite(lvl)) return 'hsl(220, 15%, 30%)';
  const t = Math.max(-1, Math.min(1, (lvl - 50) / 8));
  if (t >= 0) return `hsla(150, 80%, ${50 - t * 8}%, ${0.25 + t * 0.45})`;
  const a = -t;
  return `hsla(${a > 0.5 ? 0 : 35}, 90%, ${55 - a * 8}%, ${0.28 + a * 0.42})`;
}

/** Military spending % GDP ramp: green (low) → amber → red (wartime). Caps at 10%. */
export function milSpendColor(pct: number | null | undefined): string {
  if (pct == null || !Number.isFinite(pct)) return 'hsl(220, 15%, 30%)';
  const t = Math.max(0, Math.min(1, pct / 8));
  const hue = 140 - t * 140;  // green → red
  return `hsla(${hue.toFixed(0)}, 85%, ${52 - t * 10}%, ${0.20 + t * 0.45})`;
}

/** FX reserves (months of import cover) ramp: red (scarce) → amber → teal (ample). Caps at 24mo. */
export function reservesColor(months: number | null | undefined): string {
  if (months == null || !Number.isFinite(months)) return 'hsl(220, 15%, 30%)';
  const t = Math.max(0, Math.min(1, months / 18));
  if (t >= 0.5) {
    const a = (t - 0.5) * 2;
    return `hsla(185, 80%, ${48 - a * 6}%, ${0.22 + a * 0.40})`;
  }
  const a = 1 - t * 2;
  return `hsla(${a > 0.7 ? 0 : 35}, 88%, ${54 - a * 8}%, ${0.22 + a * 0.40})`;
}

/**
 * 2Y/10Y yield spread ramp.
 * spread = 2Y − 10Y (positive = normal; negative = inverted = recession signal).
 * Inverted (< -0.5%): deep red. Flat (-0.5 to 0): amber. Normal (> 0): teal → green.
 */
export function spreadColor(spread: number | null | undefined): string {
  if (spread == null || !Number.isFinite(spread)) return 'hsl(220, 15%, 30%)';
  if (spread < 0) {
    const a = Math.min(1, -spread / 2);
    return `hsla(${a > 0.5 ? 0 : 30}, 90%, ${55 - a * 8}%, ${0.22 + a * 0.45})`;
  }
  const a = Math.min(1, spread / 1.5);
  return `hsla(175, 80%, ${50 - a * 6}%, ${0.18 + a * 0.35})`;
}
