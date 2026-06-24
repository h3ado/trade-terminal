// Seeded ECST extended indicators + 60-month synthetic history per country.
// Where the WB / FRED hooks have live values they overlay these at runtime.
// History is generated deterministically from a seed so screens render fast
// and identically across reloads.

export const ECST_COUNTRIES = ['US', 'EU', 'UK', 'DE', 'FR', 'JP', 'CN', 'CA', 'AU', 'IN', 'BR', 'KR', 'MX', 'CH'] as const;
export type EcstCountry = (typeof ECST_COUNTRIES)[number];

export interface IndicatorDef {
  key: string;
  label: string;
  unit: string;
  /** Lower-is-better metrics (CPI, unemployment, debt). */
  invert?: boolean;
  /** Optional WB key for live overlay. */
  wb?: string;
  /** Optional FRED key (US only) for live overlay. */
  fred?: string;
}

export const ECST_INDICATORS: IndicatorDef[] = [
  { key: 'gdp_growth',   label: 'GDP Growth YoY',   unit: '%',  wb: 'gdp_growth',   fred: 'gdp_growth' },
  { key: 'inflation',    label: 'CPI YoY',          unit: '%',  invert: true, wb: 'inflation',    fred: 'cpi_yoy' },
  { key: 'core_cpi',     label: 'Core CPI YoY',     unit: '%',  invert: true },
  { key: 'ppi',          label: 'PPI YoY',          unit: '%',  invert: true },
  { key: 'unemployment', label: 'Unemployment',     unit: '%',  invert: true, wb: 'unemployment', fred: 'unemployment' },
  { key: 'pmi_mfg',      label: 'PMI Manufacturing', unit: '' },
  { key: 'pmi_svc',      label: 'PMI Services',     unit: '' },
  { key: 'retail_sales', label: 'Retail Sales YoY', unit: '%' },
  { key: 'ind_prod',     label: 'Industrial Prod YoY', unit: '%' },
  { key: 'real_rate',    label: 'Real Policy Rate', unit: '%' },
  { key: 'm2_yoy',       label: 'M2 Money Supply YoY', unit: '%' },
  { key: 'tot',          label: 'Terms of Trade YoY', unit: '%' },
  { key: 'current_acct', label: 'Current Acct (%GDP)', unit: '%', wb: 'current_acct' },
  { key: 'govt_debt',    label: 'Govt Debt (%GDP)', unit: '%', invert: true, wb: 'govt_debt' },
];

// Anchor values: latest 2026Q2 print per indicator × country.
export const ECST_LATEST: Record<string, Partial<Record<EcstCountry, number>>> = {
  gdp_growth:   { US: 1.8, EU: 1.2, UK: 1.1, DE: 0.9, FR: 1.0, JP: 1.0, CN: 4.5, CA: 1.7, AU: 2.0, IN: 6.8, BR: 2.3, KR: 2.1, MX: 1.6, CH: 1.4 },
  inflation:    { US: 2.7, EU: 2.0, UK: 2.6, DE: 2.1, FR: 1.9, JP: 2.1, CN: 1.2, CA: 2.2, AU: 2.7, IN: 4.6, BR: 4.1, KR: 2.3, MX: 4.2, CH: 0.8 },
  core_cpi:     { US: 3.1, EU: 2.4, UK: 3.0, DE: 2.5, FR: 2.2, JP: 1.7, CN: 0.9, CA: 2.4, AU: 3.0, IN: 4.0, BR: 3.6, KR: 2.0, MX: 3.8, CH: 1.1 },
  ppi:          { US: 2.3, EU: 1.4, UK: 1.8, DE: 1.2, FR: 1.0, JP: 2.0, CN: -0.4, CA: 1.5, AU: 2.1, IN: 3.1, BR: 5.0, KR: 1.4, MX: 3.5, CH: 0.4 },
  unemployment: { US: 4.3, EU: 6.5, UK: 4.6, DE: 6.1, FR: 7.3, JP: 2.5, CN: 5.1, CA: 6.5, AU: 4.4, IN: 4.8, BR: 7.8, KR: 2.9, MX: 3.0, CH: 2.4 },
  pmi_mfg:      { US: 50.8, EU: 49.2, UK: 49.7, DE: 48.6, FR: 48.9, JP: 50.2, CN: 50.5, CA: 50.1, AU: 49.8, IN: 56.2, BR: 51.4, KR: 50.7, MX: 49.1, CH: 47.8 },
  pmi_svc:      { US: 53.4, EU: 51.6, UK: 52.1, DE: 51.0, FR: 50.8, JP: 53.0, CN: 52.4, CA: 51.7, AU: 52.0, IN: 60.1, BR: 53.5, KR: 52.8, MX: 51.9, CH: 51.2 },
  retail_sales: { US: 3.2, EU: 1.8, UK: 2.4, DE: 1.5, FR: 1.7, JP: 2.5, CN: 4.7, CA: 2.8, AU: 3.1, IN: 7.2, BR: 4.0, KR: 3.4, MX: 3.0, CH: 1.6 },
  ind_prod:     { US: 1.4, EU: -0.6, UK: -0.3, DE: -1.5, FR: -0.4, JP: 0.8, CN: 5.8, CA: 1.0, AU: 1.5, IN: 5.1, BR: 2.4, KR: 4.2, MX: 1.1, CH: 0.6 },
  real_rate:    { US: 1.8, EU: 0.25, UK: 1.4, DE: 0.15, FR: 0.35, JP: -1.35, CN: 0.2, CA: 0.55, AU: 1.15, IN: 1.4, BR: 10.6, KR: 0.2, MX: 4.3, CH: -0.55 },
  m2_yoy:       { US: 4.1, EU: 3.5, UK: 2.8, DE: 3.6, FR: 3.4, JP: 1.9, CN: 8.2, CA: 5.0, AU: 6.1, IN: 11.3, BR: 7.5, KR: 6.4, MX: 9.0, CH: 2.2 },
  tot:          { US: 0.5, EU: 1.3, UK: 0.8, DE: 1.5, FR: 1.0, JP: -0.8, CN: -1.5, CA: 2.1, AU: 3.4, IN: -1.0, BR: 4.2, KR: 1.8, MX: 0.6, CH: 0.9 },
  current_acct: { US: -3.1, EU: 2.6, UK: -3.4, DE: 5.8, FR: -0.5, JP: 3.1, CN: 1.4, CA: -0.9, AU: -1.6, IN: -1.2, BR: -2.0, KR: 3.6, MX: -1.0, CH: 7.1 },
  govt_debt:    { US: 122, EU: 88, UK: 101, DE: 64, FR: 110, JP: 252, CN: 84, CA: 105, AU: 49, IN: 82, BR: 88, KR: 51, MX: 53, CH: 38 },
};

// Deterministic LCG random per (indicator, country)
function seededWalk(seed: number, anchor: number, vol: number, n = 60): number[] {
  let s = seed;
  const rnd = () => { s = (s * 9301 + 49297) % 233280; return s / 233280; };
  const out: number[] = [];
  let v = anchor;
  for (let i = n - 1; i >= 0; i--) {
    out.unshift(v);
    v += (rnd() - 0.5) * vol;
  }
  // Force latest to match anchor.
  out[out.length - 1] = anchor;
  return out;
}

const VOL: Record<string, number> = {
  gdp_growth: 0.4, inflation: 0.3, core_cpi: 0.2, ppi: 0.6, unemployment: 0.15,
  pmi_mfg: 0.8, pmi_svc: 0.7, retail_sales: 0.9, ind_prod: 0.7, real_rate: 0.25,
  m2_yoy: 0.5, tot: 0.7, current_acct: 0.3, govt_debt: 0.6,
};

const histCache = new Map<string, number[]>();
export function ecstHistory(indicator: string, country: EcstCountry, n = 60): number[] {
  const key = `${indicator}|${country}|${n}`;
  const cached = histCache.get(key);
  if (cached) return cached;
  const anchor = ECST_LATEST[indicator]?.[country];
  if (anchor == null) return [];
  const seed = (indicator.charCodeAt(0) * 7) + (country.charCodeAt(0) * 13) + (country.charCodeAt(1) * 17);
  const series = seededWalk(seed, anchor, VOL[indicator] ?? 0.5, n);
  histCache.set(key, series);
  return series;
}
