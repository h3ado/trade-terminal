/**
 * Population structure data for 70+ countries.
 * Sources: UN World Population Prospects 2024, World Bank, national statistics.
 *
 * Metrics:
 *   workingAgePct  — % of population aged 15-64 (higher = more productive capacity)
 *   medianAge      — median age in years
 *   popGrowthPct   — annual population growth rate %
 *   urbanPct       — urban population as % of total
 *   popM           — total population (millions)
 *
 * These metrics drive:
 *   - Consumer demand (urbanization, working-age share)
 *   - Labour cost competitiveness
 *   - Pension / fiscal sustainability (aging = pressure)
 *   - Housing demand
 *   - Long-term economic growth potential
 */

export type DemographicMetric = 'workingAge' | 'medianAge' | 'popGrowth' | 'urban';

export type DemographicData = {
  workingAgePct: number;  // %
  medianAge: number;      // years
  popGrowthPct: number;   // % per year (negative = shrinking)
  urbanPct: number;       // % urban
  popM: number;           // millions
};

export const DEMOGRAPHICS: Record<string, DemographicData> = {
  // ── East Asia ─────────────────────────────────────────────────────────────
  CN:  { workingAgePct: 68.2, medianAge: 39.0, popGrowthPct: -0.1, urbanPct: 66.2, popM: 1408 },
  JP:  { workingAgePct: 59.0, medianAge: 49.6, popGrowthPct: -0.5, urbanPct: 91.8, popM: 124 },
  KR:  { workingAgePct: 70.2, medianAge: 44.8, popGrowthPct: -0.2, urbanPct: 81.4, popM: 51 },
  TW:  { workingAgePct: 69.5, medianAge: 43.1, popGrowthPct: -0.2, urbanPct: 79.9, popM: 23 },
  HK:  { workingAgePct: 68.8, medianAge: 45.9, popGrowthPct:  0.2, urbanPct: 100.0, popM: 7 },
  MN:  { workingAgePct: 70.8, medianAge: 30.0, popGrowthPct:  1.5, urbanPct: 69.0, popM: 3 },

  // ── South / Southeast Asia ────────────────────────────────────────────────
  IN:  { workingAgePct: 67.5, medianAge: 28.7, popGrowthPct:  0.9, urbanPct: 36.4, popM: 1430 },
  ID:  { workingAgePct: 67.9, medianAge: 30.2, popGrowthPct:  0.9, urbanPct: 58.6, popM: 278 },
  PK:  { workingAgePct: 58.5, medianAge: 22.0, popGrowthPct:  2.0, urbanPct: 37.2, popM: 232 },
  BD:  { workingAgePct: 66.2, medianAge: 28.1, popGrowthPct:  1.1, urbanPct: 40.5, popM: 172 },
  PH:  { workingAgePct: 63.5, medianAge: 25.8, popGrowthPct:  1.5, urbanPct: 48.0, popM: 115 },
  VN:  { workingAgePct: 68.8, medianAge: 32.6, popGrowthPct:  0.8, urbanPct: 37.7, popM: 98 },
  TH:  { workingAgePct: 70.8, medianAge: 40.1, popGrowthPct:  0.2, urbanPct: 51.5, popM: 71 },
  MY:  { workingAgePct: 69.5, medianAge: 30.4, popGrowthPct:  1.2, urbanPct: 77.2, popM: 34 },
  MM:  { workingAgePct: 63.9, medianAge: 28.9, popGrowthPct:  0.7, urbanPct: 31.7, popM: 54 },
  KH:  { workingAgePct: 62.9, medianAge: 27.1, popGrowthPct:  1.1, urbanPct: 24.3, popM: 17 },
  LK:  { workingAgePct: 66.5, medianAge: 33.7, popGrowthPct:  0.4, urbanPct: 18.8, popM: 22 },
  NP:  { workingAgePct: 61.9, medianAge: 25.2, popGrowthPct:  0.9, urbanPct: 21.6, popM: 30 },

  // ── Western Europe ────────────────────────────────────────────────────────
  DE:  { workingAgePct: 64.5, medianAge: 47.8, popGrowthPct:  0.1, urbanPct: 77.5, popM: 84 },
  FR:  { workingAgePct: 62.0, medianAge: 42.3, popGrowthPct:  0.2, urbanPct: 81.5, popM: 68 },
  GB:  { workingAgePct: 63.8, medianAge: 40.6, popGrowthPct:  0.5, urbanPct: 84.4, popM: 68 },
  IT:  { workingAgePct: 63.2, medianAge: 47.9, popGrowthPct: -0.2, urbanPct: 71.0, popM: 60 },
  ES:  { workingAgePct: 66.0, medianAge: 44.9, popGrowthPct:  0.5, urbanPct: 81.3, popM: 48 },
  NL:  { workingAgePct: 64.5, medianAge: 43.2, popGrowthPct:  0.4, urbanPct: 92.5, popM: 18 },
  BE:  { workingAgePct: 63.8, medianAge: 42.4, popGrowthPct:  0.4, urbanPct: 98.2, popM: 12 },
  SE:  { workingAgePct: 62.5, medianAge: 41.0, popGrowthPct:  0.6, urbanPct: 88.3, popM: 10 },
  NO:  { workingAgePct: 64.2, medianAge: 40.0, popGrowthPct:  0.7, urbanPct: 83.6, popM: 5 },
  CH:  { workingAgePct: 66.0, medianAge: 43.5, popGrowthPct:  0.9, urbanPct: 74.2, popM: 9 },
  AT:  { workingAgePct: 66.0, medianAge: 43.5, popGrowthPct:  0.5, urbanPct: 59.5, popM: 9 },
  PT:  { workingAgePct: 64.5, medianAge: 45.5, popGrowthPct: -0.3, urbanPct: 67.9, popM: 10 },
  GR:  { workingAgePct: 63.0, medianAge: 46.2, popGrowthPct: -0.4, urbanPct: 80.1, popM: 10 },
  IE:  { workingAgePct: 67.5, medianAge: 38.4, popGrowthPct:  1.2, urbanPct: 64.0, popM: 5 },
  FI:  { workingAgePct: 61.5, medianAge: 43.0, popGrowthPct:  0.1, urbanPct: 85.9, popM: 6 },
  DK:  { workingAgePct: 63.5, medianAge: 42.3, popGrowthPct:  0.4, urbanPct: 88.4, popM: 6 },

  // ── Eastern Europe ────────────────────────────────────────────────────────
  PL:  { workingAgePct: 66.5, medianAge: 41.9, popGrowthPct: -0.3, urbanPct: 60.2, popM: 38 },
  RO:  { workingAgePct: 66.5, medianAge: 43.0, popGrowthPct: -0.5, urbanPct: 54.7, popM: 19 },
  CZ:  { workingAgePct: 65.5, medianAge: 43.3, popGrowthPct:  0.4, urbanPct: 74.1, popM: 11 },
  HU:  { workingAgePct: 66.0, medianAge: 43.5, popGrowthPct:  0.0, urbanPct: 72.9, popM: 10 },
  UA:  { workingAgePct: 65.5, medianAge: 43.5, popGrowthPct: -3.5, urbanPct: 69.3, popM: 39, },
  RU:  { workingAgePct: 66.0, medianAge: 40.7, popGrowthPct: -0.4, urbanPct: 75.0, popM: 145 },
  BG:  { workingAgePct: 64.5, medianAge: 44.5, popGrowthPct: -0.6, urbanPct: 76.7, popM: 6 },
  HR:  { workingAgePct: 64.2, medianAge: 45.0, popGrowthPct: -0.3, urbanPct: 57.6, popM: 4 },
  RS:  { workingAgePct: 65.5, medianAge: 43.8, popGrowthPct: -0.4, urbanPct: 57.0, popM: 7 },

  // ── Americas ──────────────────────────────────────────────────────────────
  US:  { workingAgePct: 65.2, medianAge: 38.5, popGrowthPct:  0.5, urbanPct: 82.9, popM: 338 },
  CA:  { workingAgePct: 66.0, medianAge: 41.8, popGrowthPct:  1.2, urbanPct: 81.8, popM: 39 },
  MX:  { workingAgePct: 65.5, medianAge: 29.5, popGrowthPct:  0.9, urbanPct: 80.7, popM: 129 },
  BR:  { workingAgePct: 69.5, medianAge: 34.4, popGrowthPct:  0.7, urbanPct: 87.8, popM: 215 },
  AR:  { workingAgePct: 64.0, medianAge: 31.9, popGrowthPct:  0.9, urbanPct: 92.4, popM: 46 },
  CO:  { workingAgePct: 67.5, medianAge: 31.2, popGrowthPct:  0.8, urbanPct: 81.8, popM: 52 },
  CL:  { workingAgePct: 69.5, medianAge: 35.6, popGrowthPct:  0.7, urbanPct: 87.8, popM: 20 },
  PE:  { workingAgePct: 66.0, medianAge: 31.0, popGrowthPct:  1.0, urbanPct: 78.7, popM: 34 },
  VE:  { workingAgePct: 62.5, medianAge: 29.9, popGrowthPct: -1.5, urbanPct: 88.3, popM: 30 },
  EC:  { workingAgePct: 65.5, medianAge: 28.5, popGrowthPct:  1.1, urbanPct: 64.3, popM: 18 },
  GT:  { workingAgePct: 58.5, medianAge: 22.9, popGrowthPct:  2.0, urbanPct: 52.7, popM: 18 },

  // ── Middle East / Central Asia ────────────────────────────────────────────
  TR:  { workingAgePct: 68.8, medianAge: 32.0, popGrowthPct:  1.2, urbanPct: 76.8, popM: 85 },
  SA:  { workingAgePct: 73.5, medianAge: 30.2, popGrowthPct:  1.8, urbanPct: 84.4, popM: 36 },
  IR:  { workingAgePct: 70.5, medianAge: 32.0, popGrowthPct:  1.1, urbanPct: 76.8, popM: 87 },
  IQ:  { workingAgePct: 58.0, medianAge: 20.4, popGrowthPct:  2.3, urbanPct: 71.6, popM: 42 },
  AE:  { workingAgePct: 85.2, medianAge: 34.9, popGrowthPct:  0.7, urbanPct: 87.2, popM: 10 },
  IL:  { workingAgePct: 61.5, medianAge: 30.5, popGrowthPct:  1.8, urbanPct: 92.8, popM: 9 },
  KZ:  { workingAgePct: 67.5, medianAge: 31.3, popGrowthPct:  1.4, urbanPct: 59.2, popM: 19 },
  UZ:  { workingAgePct: 63.0, medianAge: 28.6, popGrowthPct:  1.6, urbanPct: 50.8, popM: 37 },
  EG:  { workingAgePct: 61.5, medianAge: 25.3, popGrowthPct:  1.6, urbanPct: 42.9, popM: 106 },

  // ── Africa ────────────────────────────────────────────────────────────────
  NG:  { workingAgePct: 55.0, medianAge: 18.1, popGrowthPct:  2.6, urbanPct: 53.6, popM: 223 },
  ET:  { workingAgePct: 54.5, medianAge: 19.5, popGrowthPct:  2.5, urbanPct: 22.4, popM: 126 },
  CD:  { workingAgePct: 50.5, medianAge: 17.0, popGrowthPct:  3.2, urbanPct: 46.7, popM: 100 },
  TZ:  { workingAgePct: 52.5, medianAge: 18.2, popGrowthPct:  2.9, urbanPct: 36.6, popM: 65 },
  KE:  { workingAgePct: 57.0, medianAge: 19.7, popGrowthPct:  2.2, urbanPct: 28.6, popM: 56 },
  ZA:  { workingAgePct: 65.5, medianAge: 28.0, popGrowthPct:  1.3, urbanPct: 68.1, popM: 59 },
  GH:  { workingAgePct: 57.5, medianAge: 21.1, popGrowthPct:  2.2, urbanPct: 57.7, popM: 33 },
  CI:  { workingAgePct: 54.5, medianAge: 18.8, popGrowthPct:  2.6, urbanPct: 52.3, popM: 28 },
  MA:  { workingAgePct: 66.0, medianAge: 29.8, popGrowthPct:  1.1, urbanPct: 64.1, popM: 37 },
  MZ:  { workingAgePct: 52.5, medianAge: 17.5, popGrowthPct:  2.9, urbanPct: 37.2, popM: 33 },
  UG:  { workingAgePct: 51.0, medianAge: 16.7, popGrowthPct:  3.3, urbanPct: 26.2, popM: 49 },

  // ── Oceania ───────────────────────────────────────────────────────────────
  AU:  { workingAgePct: 65.0, medianAge: 38.3, popGrowthPct:  1.4, urbanPct: 86.2, popM: 26 },
  NZ:  { workingAgePct: 64.5, medianAge: 37.5, popGrowthPct:  1.1, urbanPct: 86.5, popM: 5 },
};

export const DEMOGRAPHIC_LABEL: Record<DemographicMetric, string> = {
  workingAge: 'Working-Age Pop (%)',
  medianAge:  'Median Age (years)',
  popGrowth:  'Pop Growth Rate (%)',
  urban:      'Urbanization (%)',
};

/** Working-age % → green (high productivity) → red (extreme dependency). Optimal ~67%. */
export function workingAgeColor(pct: number | null | undefined): string {
  if (pct == null) return 'hsl(220, 15%, 30%)';
  // Peak around 70%; < 55% or > 80% are signals of stress
  const t = Math.abs(pct - 67) / 15;
  const sat = Math.min(1, t);
  return `hsla(${sat > 0.5 ? 0 : 150}, 80%, ${50 - sat * 8}%, ${0.20 + sat * 0.35})`;
}

/** Median age → blue (young pop) → amber/red (aging). Young = 15-25; aging = 40+. */
export function medianAgeColor(years: number | null | undefined): string {
  if (years == null) return 'hsl(220, 15%, 30%)';
  const t = Math.max(0, Math.min(1, (years - 15) / 35));  // 15y → 50y
  const hue = 200 - t * 200;  // blue (young) → red (old)
  return `hsla(${hue.toFixed(0)}, 80%, ${52 - t * 8}%, ${0.18 + t * 0.40})`;
}

/** Pop growth → red (shrinking) → gray (stable) → teal (growing). */
export function popGrowthColor(pct: number | null | undefined): string {
  if (pct == null) return 'hsl(220, 15%, 30%)';
  if (pct <= 0) {
    const a = Math.min(1, -pct / 2);
    return `hsla(0, 85%, ${55 - a * 8}%, ${0.20 + a * 0.40})`;
  }
  const a = Math.min(1, pct / 3);
  return `hsla(175, 80%, ${50 - a * 6}%, ${0.18 + a * 0.40})`;
}

/** Urbanization → amber (rural) → teal (highly urban). */
export function urbanColor(pct: number | null | undefined): string {
  if (pct == null) return 'hsl(220, 15%, 30%)';
  const t = Math.max(0, Math.min(1, pct / 100));
  const hue = 35 + t * 150;  // amber → teal
  return `hsla(${hue.toFixed(0)}, 75%, ${52 - t * 5}%, ${0.18 + t * 0.35})`;
}
