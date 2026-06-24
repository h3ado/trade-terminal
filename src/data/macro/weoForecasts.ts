// IMF WEO-style seeded forecasts 2024 (realized) → 2030 for ECFC.
// Each country has GDP / CPI / Unemp / Rate / Curr Acct, with per-year
// {mean, low, high, sd}. 2024 / 2025 marked as REALIZED to power the error tab.

export type FcMetric = 'gdp' | 'cpi' | 'unemp' | 'rate' | 'ca';
export const FC_METRICS: { key: FcMetric; label: string; unit: string; favorHigh: boolean }[] = [
  { key: 'gdp',   label: 'Real GDP Growth',  unit: '%', favorHigh: true },
  { key: 'cpi',   label: 'CPI Inflation',    unit: '%', favorHigh: false },
  { key: 'unemp', label: 'Unemployment',     unit: '%', favorHigh: false },
  { key: 'rate',  label: 'Policy Rate (EOY)', unit: '%', favorHigh: false },
  { key: 'ca',    label: 'Current Acct (%GDP)', unit: '%', favorHigh: true },
];

export interface FcYear { mean: number; low: number; high: number; sd: number; realized?: number | null; }
export type FcCountryMetric = Record<'2024' | '2025' | '2026' | '2027' | '2028' | '2029' | '2030', FcYear>;
export interface FcCountry { cc: string; flag: string; name: string; metrics: Record<FcMetric, FcCountryMetric>; }

function band(mean: number, range: number, realized?: number | null): FcYear {
  return { mean, low: +(mean - range / 2).toFixed(2), high: +(mean + range / 2).toFixed(2), sd: +(range / 4).toFixed(2), realized: realized ?? undefined };
}

// Helper: build a 7-year path with mid-cycle convergence.
function path(mean: number[], realized: Array<number | null | undefined>, range: number[]): FcCountryMetric {
  const years: Array<'2024' | '2025' | '2026' | '2027' | '2028' | '2029' | '2030'> = ['2024','2025','2026','2027','2028','2029','2030'];
  const out: any = {};
  years.forEach((y, i) => { out[y] = band(mean[i], range[i] ?? range[0], realized[i]); });
  return out as FcCountryMetric;
}

export const FC_COUNTRIES: FcCountry[] = [
  { cc: 'US', flag: '🇺🇸', name: 'United States', metrics: {
    gdp:   path([2.5, 2.4, 1.8, 2.0, 2.0, 2.0, 1.9], [2.5, 2.4, null,null,null,null,null], [0.6,0.8,1.2,1.4,1.4,1.4,1.4]),
    cpi:   path([2.9, 2.6, 2.7, 2.3, 2.1, 2.0, 2.0], [2.9, 2.6, null,null,null,null,null], [0.4,0.6,1.0,1.0,0.8,0.8,0.8]),
    unemp: path([4.0, 4.2, 4.3, 4.2, 4.1, 4.0, 4.0], [4.0, 4.2, null,null,null,null,null], [0.3,0.4,0.7,0.8,0.8,0.8,0.8]),
    rate:  path([4.50, 4.75, 3.75, 3.25, 3.00, 3.00, 3.00], [4.50, 4.75, null,null,null,null,null], [0.25,0.5,1.0,1.2,1.0,1.0,1.0]),
    ca:    path([-3.0, -3.0, -3.1, -3.2, -3.2, -3.1, -3.0], [-3.0, -3.0, null,null,null,null,null], [0.3,0.4,0.6,0.6,0.6,0.6,0.6]),
  }},
  { cc: 'EU', flag: '🇪🇺', name: 'Eurozone', metrics: {
    gdp:   path([0.7, 1.0, 1.2, 1.4, 1.5, 1.5, 1.5], [0.7, 1.0, null,null,null,null,null], [0.5,0.5,1.0,1.0,1.0,1.0,1.0]),
    cpi:   path([2.4, 2.1, 2.0, 1.9, 2.0, 2.0, 2.0], [2.4, 2.1, null,null,null,null,null], [0.3,0.4,0.9,0.8,0.8,0.8,0.8]),
    unemp: path([6.5, 6.5, 6.5, 6.4, 6.3, 6.2, 6.2], [6.5, 6.5, null,null,null,null,null], [0.3,0.3,0.8,0.8,0.8,0.8,0.8]),
    rate:  path([3.00, 2.25, 1.75, 2.00, 2.25, 2.50, 2.50], [3.00, 2.25, null,null,null,null,null], [0.2,0.4,0.8,1.0,1.0,1.0,1.0]),
    ca:    path([2.4, 2.5, 2.6, 2.7, 2.7, 2.6, 2.5], [2.4, 2.5, null,null,null,null,null], [0.3,0.4,0.5,0.5,0.5,0.5,0.5]),
  }},
  { cc: 'UK', flag: '🇬🇧', name: 'United Kingdom', metrics: {
    gdp:   path([0.9, 1.1, 1.1, 1.4, 1.5, 1.5, 1.5], [0.9, 1.1, null,null,null,null,null], [0.5,0.6,1.1,1.0,1.0,1.0,1.0]),
    cpi:   path([2.5, 2.4, 2.6, 2.2, 2.0, 2.0, 2.0], [2.5, 2.4, null,null,null,null,null], [0.3,0.5,1.0,0.9,0.8,0.8,0.8]),
    unemp: path([4.3, 4.5, 4.6, 4.5, 4.4, 4.4, 4.4], [4.3, 4.5, null,null,null,null,null], [0.3,0.4,0.8,0.8,0.8,0.8,0.8]),
    rate:  path([4.75, 4.25, 3.50, 3.00, 2.75, 2.75, 2.75], [4.75, 4.25, null,null,null,null,null], [0.25,0.5,1.0,1.0,1.0,1.0,1.0]),
    ca:    path([-3.6, -3.5, -3.4, -3.3, -3.2, -3.1, -3.0], [-3.6, -3.5, null,null,null,null,null], [0.4,0.4,0.6,0.6,0.6,0.6,0.6]),
  }},
  { cc: 'JP', flag: '🇯🇵', name: 'Japan', metrics: {
    gdp:   path([0.3, 0.9, 1.0, 1.1, 1.0, 0.9, 0.9], [0.3, 0.9, null,null,null,null,null], [0.5,0.5,1.0,1.0,1.0,1.0,1.0]),
    cpi:   path([2.7, 2.3, 2.1, 1.8, 1.7, 1.7, 1.7], [2.7, 2.3, null,null,null,null,null], [0.4,0.4,0.8,0.8,0.7,0.7,0.7]),
    unemp: path([2.6, 2.5, 2.5, 2.5, 2.5, 2.5, 2.5], [2.6, 2.5, null,null,null,null,null], [0.2,0.2,0.5,0.5,0.5,0.5,0.5]),
    rate:  path([0.25, 0.50, 1.00, 1.25, 1.25, 1.25, 1.25], [0.25, 0.50, null,null,null,null,null], [0.1,0.2,0.5,0.5,0.5,0.5,0.5]),
    ca:    path([3.0, 3.1, 3.1, 3.1, 3.0, 3.0, 3.0], [3.0, 3.1, null,null,null,null,null], [0.3,0.4,0.6,0.6,0.6,0.6,0.6]),
  }},
  { cc: 'CN', flag: '🇨🇳', name: 'China', metrics: {
    gdp:   path([5.0, 4.7, 4.5, 4.3, 4.0, 3.8, 3.7], [5.0, 4.7, null,null,null,null,null], [0.4,0.5,1.0,1.0,1.0,1.0,1.0]),
    cpi:   path([0.2, 0.7, 1.2, 1.6, 1.8, 1.9, 2.0], [0.2, 0.7, null,null,null,null,null], [0.4,0.5,1.0,0.9,0.8,0.8,0.8]),
    unemp: path([5.1, 5.1, 5.1, 5.0, 5.0, 5.0, 5.0], [5.1, 5.1, null,null,null,null,null], [0.2,0.3,0.6,0.6,0.6,0.6,0.6]),
    rate:  path([1.65, 1.50, 1.25, 1.40, 1.50, 1.60, 1.60], [1.65, 1.50, null,null,null,null,null], [0.15,0.3,0.5,0.6,0.6,0.6,0.6]),
    ca:    path([1.5, 1.4, 1.4, 1.3, 1.2, 1.2, 1.2], [1.5, 1.4, null,null,null,null,null], [0.3,0.4,0.6,0.6,0.6,0.6,0.6]),
  }},
  { cc: 'DE', flag: '🇩🇪', name: 'Germany', metrics: {
    gdp:   path([0.0, 0.7, 0.9, 1.3, 1.5, 1.5, 1.5], [0.0, 0.7, null,null,null,null,null], [0.5,0.5,1.2,1.0,1.0,1.0,1.0]),
    cpi:   path([2.4, 2.0, 2.1, 2.0, 2.0, 2.0, 2.0], [2.4, 2.0, null,null,null,null,null], [0.3,0.4,0.8,0.8,0.7,0.7,0.7]),
    unemp: path([5.9, 6.0, 6.1, 5.9, 5.7, 5.6, 5.5], [5.9, 6.0, null,null,null,null,null], [0.3,0.3,0.8,0.8,0.8,0.8,0.8]),
    rate:  path([3.00, 2.25, 1.75, 2.00, 2.25, 2.50, 2.50], [3.00, 2.25, null,null,null,null,null], [0.2,0.4,0.8,1.0,1.0,1.0,1.0]),
    ca:    path([5.9, 5.8, 5.8, 5.7, 5.6, 5.5, 5.5], [5.9, 5.8, null,null,null,null,null], [0.3,0.4,0.5,0.5,0.5,0.5,0.5]),
  }},
  { cc: 'FR', flag: '🇫🇷', name: 'France', metrics: {
    gdp:   path([1.1, 1.0, 1.0, 1.3, 1.4, 1.4, 1.4], [1.1, 1.0, null,null,null,null,null], [0.4,0.5,1.0,1.0,1.0,1.0,1.0]),
    cpi:   path([2.3, 2.0, 1.9, 1.9, 2.0, 2.0, 2.0], [2.3, 2.0, null,null,null,null,null], [0.3,0.4,0.8,0.8,0.7,0.7,0.7]),
    unemp: path([7.4, 7.3, 7.3, 7.2, 7.1, 7.0, 7.0], [7.4, 7.3, null,null,null,null,null], [0.3,0.4,0.8,0.8,0.8,0.8,0.8]),
    rate:  path([3.00, 2.25, 1.75, 2.00, 2.25, 2.50, 2.50], [3.00, 2.25, null,null,null,null,null], [0.2,0.4,0.8,1.0,1.0,1.0,1.0]),
    ca:    path([-1.0, -0.7, -0.5, -0.4, -0.3, -0.2, -0.2], [-1.0, -0.7, null,null,null,null,null], [0.4,0.4,0.5,0.5,0.5,0.5,0.5]),
  }},
  { cc: 'CA', flag: '🇨🇦', name: 'Canada', metrics: {
    gdp:   path([1.3, 1.5, 1.7, 1.9, 2.0, 2.0, 2.0], [1.3, 1.5, null,null,null,null,null], [0.4,0.5,1.0,1.0,1.0,1.0,1.0]),
    cpi:   path([2.4, 2.3, 2.2, 2.0, 2.0, 2.0, 2.0], [2.4, 2.3, null,null,null,null,null], [0.3,0.4,0.9,0.8,0.7,0.7,0.7]),
    unemp: path([6.3, 6.4, 6.5, 6.3, 6.2, 6.1, 6.1], [6.3, 6.4, null,null,null,null,null], [0.3,0.4,0.8,0.8,0.8,0.8,0.8]),
    rate:  path([3.25, 2.75, 2.50, 2.50, 2.75, 2.75, 2.75], [3.25, 2.75, null,null,null,null,null], [0.25,0.5,1.0,1.0,1.0,1.0,1.0]),
    ca:    path([-1.0, -0.9, -0.9, -0.8, -0.7, -0.7, -0.7], [-1.0, -0.9, null,null,null,null,null], [0.3,0.4,0.5,0.5,0.5,0.5,0.5]),
  }},
  { cc: 'AU', flag: '🇦🇺', name: 'Australia', metrics: {
    gdp:   path([1.5, 1.8, 2.0, 2.3, 2.4, 2.4, 2.4], [1.5, 1.8, null,null,null,null,null], [0.4,0.5,1.0,1.0,1.0,1.0,1.0]),
    cpi:   path([3.2, 2.9, 2.7, 2.5, 2.4, 2.4, 2.4], [3.2, 2.9, null,null,null,null,null], [0.4,0.4,0.9,0.8,0.7,0.7,0.7]),
    unemp: path([4.2, 4.3, 4.4, 4.3, 4.3, 4.3, 4.3], [4.2, 4.3, null,null,null,null,null], [0.3,0.4,0.8,0.8,0.8,0.8,0.8]),
    rate:  path([4.35, 4.10, 3.50, 3.25, 3.25, 3.25, 3.25], [4.35, 4.10, null,null,null,null,null], [0.25,0.5,1.0,1.0,1.0,1.0,1.0]),
    ca:    path([-0.5, -1.0, -1.6, -1.7, -1.6, -1.5, -1.5], [-0.5, -1.0, null,null,null,null,null], [0.3,0.4,0.5,0.5,0.5,0.5,0.5]),
  }},
  { cc: 'IN', flag: '🇮🇳', name: 'India', metrics: {
    gdp:   path([7.0, 6.5, 6.8, 6.7, 6.5, 6.5, 6.5], [7.0, 6.5, null,null,null,null,null], [0.4,0.5,1.0,1.0,1.0,1.0,1.0]),
    cpi:   path([5.0, 4.8, 4.6, 4.4, 4.3, 4.2, 4.0], [5.0, 4.8, null,null,null,null,null], [0.4,0.5,1.0,1.0,0.8,0.8,0.8]),
    unemp: path([4.7, 4.8, 4.8, 4.7, 4.6, 4.5, 4.5], [4.7, 4.8, null,null,null,null,null], [0.3,0.4,0.7,0.7,0.7,0.7,0.7]),
    rate:  path([6.50, 6.25, 6.00, 5.75, 5.75, 5.75, 5.75], [6.50, 6.25, null,null,null,null,null], [0.25,0.4,0.9,1.0,1.0,1.0,1.0]),
    ca:    path([-0.7, -1.0, -1.2, -1.3, -1.4, -1.4, -1.4], [-0.7, -1.0, null,null,null,null,null], [0.3,0.4,0.5,0.5,0.5,0.5,0.5]),
  }},
  { cc: 'BR', flag: '🇧🇷', name: 'Brazil', metrics: {
    gdp:   path([2.9, 2.2, 2.0, 2.1, 2.2, 2.2, 2.2], [2.9, 2.2, null,null,null,null,null], [0.4,0.5,1.0,1.0,1.0,1.0,1.0]),
    cpi:   path([4.5, 4.3, 4.1, 3.7, 3.5, 3.4, 3.3], [4.5, 4.3, null,null,null,null,null], [0.4,0.5,1.0,1.0,0.8,0.8,0.8]),
    unemp: path([7.5, 7.6, 7.8, 7.7, 7.6, 7.5, 7.5], [7.5, 7.6, null,null,null,null,null], [0.3,0.4,0.8,0.8,0.8,0.8,0.8]),
    rate:  path([12.25, 14.25, 14.75, 12.50, 11.00, 10.50, 10.00], [12.25, 14.25, null,null,null,null,null], [0.5,0.7,1.5,1.5,1.5,1.5,1.5]),
    ca:    path([-1.6, -1.8, -2.0, -2.1, -2.1, -2.0, -2.0], [-1.6, -1.8, null,null,null,null,null], [0.3,0.4,0.5,0.5,0.5,0.5,0.5]),
  }},
  { cc: 'MX', flag: '🇲🇽', name: 'Mexico', metrics: {
    gdp:   path([1.5, 1.4, 1.6, 1.9, 2.0, 2.0, 2.0], [1.5, 1.4, null,null,null,null,null], [0.4,0.5,1.0,1.0,1.0,1.0,1.0]),
    cpi:   path([4.7, 4.4, 4.2, 3.9, 3.7, 3.5, 3.3], [4.7, 4.4, null,null,null,null,null], [0.4,0.5,1.0,1.0,0.8,0.8,0.8]),
    unemp: path([2.8, 2.9, 3.0, 3.0, 3.0, 3.0, 3.0], [2.8, 2.9, null,null,null,null,null], [0.3,0.3,0.6,0.6,0.6,0.6,0.6]),
    rate:  path([10.00, 9.00, 8.50, 7.50, 7.00, 7.00, 7.00], [10.00, 9.00, null,null,null,null,null], [0.5,0.6,1.2,1.2,1.2,1.2,1.2]),
    ca:    path([-0.4, -0.7, -1.0, -1.1, -1.1, -1.0, -1.0], [-0.4, -0.7, null,null,null,null,null], [0.3,0.4,0.5,0.5,0.5,0.5,0.5]),
  }},
  { cc: 'KR', flag: '🇰🇷', name: 'South Korea', metrics: {
    gdp:   path([2.4, 2.0, 2.1, 2.3, 2.3, 2.3, 2.3], [2.4, 2.0, null,null,null,null,null], [0.4,0.5,1.0,1.0,1.0,1.0,1.0]),
    cpi:   path([2.5, 2.3, 2.3, 2.1, 2.0, 2.0, 2.0], [2.5, 2.3, null,null,null,null,null], [0.4,0.5,0.9,0.8,0.7,0.7,0.7]),
    unemp: path([2.7, 2.8, 2.9, 2.9, 2.9, 2.9, 2.9], [2.7, 2.8, null,null,null,null,null], [0.2,0.3,0.6,0.6,0.6,0.6,0.6]),
    rate:  path([3.00, 2.75, 2.50, 2.50, 2.50, 2.50, 2.50], [3.00, 2.75, null,null,null,null,null], [0.2,0.4,0.8,0.8,0.8,0.8,0.8]),
    ca:    path([3.5, 3.6, 3.6, 3.5, 3.4, 3.3, 3.3], [3.5, 3.6, null,null,null,null,null], [0.3,0.4,0.5,0.5,0.5,0.5,0.5]),
  }},
  { cc: 'CH', flag: '🇨🇭', name: 'Switzerland', metrics: {
    gdp:   path([1.2, 1.3, 1.4, 1.5, 1.6, 1.6, 1.6], [1.2, 1.3, null,null,null,null,null], [0.4,0.5,0.9,0.9,0.9,0.9,0.9]),
    cpi:   path([1.1, 0.9, 0.8, 0.9, 1.0, 1.1, 1.1], [1.1, 0.9, null,null,null,null,null], [0.3,0.3,0.6,0.6,0.6,0.6,0.6]),
    unemp: path([2.3, 2.4, 2.4, 2.4, 2.3, 2.3, 2.3], [2.3, 2.4, null,null,null,null,null], [0.2,0.2,0.5,0.5,0.5,0.5,0.5]),
    rate:  path([0.75, 0.25, 0.25, 0.50, 0.75, 0.75, 0.75], [0.75, 0.25, null,null,null,null,null], [0.15,0.2,0.5,0.5,0.5,0.5,0.5]),
    ca:    path([7.0, 7.0, 7.1, 7.1, 7.0, 7.0, 7.0], [7.0, 7.0, null,null,null,null,null], [0.4,0.4,0.5,0.5,0.5,0.5,0.5]),
  }},
];

export const FC_YEARS = ['2024','2025','2026','2027','2028','2029','2030'] as const;
export type FcYearKey = typeof FC_YEARS[number];
