/**
 * Sovereign credit ratings — S&P, Moody's, Fitch. Primary dataset for bond
 * traders, sovereign debt analysis, and CDS pricing context.
 *
 * Ratings are approximate as of mid-2026. Outlook reflects the most recent
 * action from any of the three agencies.
 *
 * Scale (S&P notation used as canonical; Moody's/Fitch mapped separately):
 *   AAA / Aaa / AAA  → score 21  (risk-free benchmark)
 *   AA+ / Aa1 / AA+  → score 20
 *   AA  / Aa2 / AA   → score 19
 *   AA- / Aa3 / AA-  → score 18
 *   A+  / A1  / A+   → score 17
 *   A   / A2  / A    → score 16
 *   A-  / A3  / A-   → score 15
 *   BBB+/ Baa1/ BBB+ → score 14  (lowest IG)
 *   BBB / Baa2/ BBB  → score 13
 *   BBB-/ Baa3/ BBB- → score 12  (IG/HY boundary)
 *   BB+ / Ba1 / BB+  → score 11
 *   BB  / Ba2 / BB   → score 10
 *   BB- / Ba3 / BB-  → score  9
 *   B+  / B1  / B+   → score  8
 *   B   / B2  / B    → score  7
 *   B-  / B3  / B-   → score  6
 *   CCC+/ Caa1/ CCC+ → score  5
 *   CCC / Caa2/ CCC  → score  4
 *   CCC-/ Caa3/ CCC- → score  3
 *   CC  / Ca  / CC   → score  2
 *   C / D / SD        → score  1 / 0
 */

export type RatingOutlook = 'Stable' | 'Positive' | 'Negative' | 'Watch+' | 'Watch-' | 'NR';
export type RatingTier = 'IG' | 'HY' | 'SD' | 'NR';

export type SovereignRating = {
  sp: string;
  moody: string;
  fitch: string;
  outlook: RatingOutlook;
  /** Most recent action note */
  note?: string;
};

export const SOVEREIGN_RATINGS: Record<string, SovereignRating> = {
  // ── AAA / Prime ──────────────────────────────────────────────────────────
  AU:  { sp: 'AAA',  moody: 'Aaa',  fitch: 'AAA',  outlook: 'Stable', note: 'Commodity-backed fiscal resilience' },
  CA:  { sp: 'AAA',  moody: 'Aaa',  fitch: 'AA+',  outlook: 'Stable' },
  DE:  { sp: 'AAA',  moody: 'Aaa',  fitch: 'AAA',  outlook: 'Stable' },
  DK:  { sp: 'AAA',  moody: 'Aaa',  fitch: 'AAA',  outlook: 'Stable' },
  LU:  { sp: 'AAA',  moody: 'Aaa',  fitch: 'AAA',  outlook: 'Stable' },
  NL:  { sp: 'AAA',  moody: 'Aaa',  fitch: 'AAA',  outlook: 'Stable' },
  NO:  { sp: 'AAA',  moody: 'Aaa',  fitch: 'AAA',  outlook: 'Stable', note: 'Oil Fund $1.7T' },
  SE:  { sp: 'AAA',  moody: 'Aaa',  fitch: 'AAA',  outlook: 'Stable' },
  SG:  { sp: 'AAA',  moody: 'Aaa',  fitch: 'AAA',  outlook: 'Stable' },
  CH:  { sp: 'AAA',  moody: 'Aaa',  fitch: 'AAA',  outlook: 'Stable' },
  NZ:  { sp: 'AA+',  moody: 'Aaa',  fitch: 'AA+',  outlook: 'Stable' },

  // ── AA range ──────────────────────────────────────────────────────────────
  FI:  { sp: 'AA+',  moody: 'Aa1',  fitch: 'AA+',  outlook: 'Stable' },
  AT:  { sp: 'AA+',  moody: 'Aa1',  fitch: 'AA+',  outlook: 'Stable' },
  US:  { sp: 'AA+',  moody: 'Aa1',  fitch: 'AA+',  outlook: 'Stable', note: 'S&P downgraded 2011; Moody\'s 2023; debt ceiling risk' },
  HK:  { sp: 'AA+',  moody: 'Aa3',  fitch: 'AA-',  outlook: 'Stable' },
  GB:  { sp: 'AA',   moody: 'Aa3',  fitch: 'AA-',  outlook: 'Stable', note: 'Post-Liz Truss fiscal credibility restored' },
  BE:  { sp: 'AA',   moody: 'Aa3',  fitch: 'AA-',  outlook: 'Stable' },
  FR:  { sp: 'AA-',  moody: 'Aa2',  fitch: 'AA-',  outlook: 'Negative', note: 'Fiscal slippage; political instability' },
  IE:  { sp: 'AA',   moody: 'A1',   fitch: 'AA-',  outlook: 'Stable', note: 'Tech MNC windfall taxes' },
  KR:  { sp: 'AA',   moody: 'Aa2',  fitch: 'AA-',  outlook: 'Stable' },
  TW:  { sp: 'AA',   moody: 'Aa3',  fitch: 'AA',   outlook: 'Stable', note: 'Geopolitical risk discount' },
  CZ:  { sp: 'AA-',  moody: 'Aa3',  fitch: 'AA-',  outlook: 'Stable' },

  // ── A range ───────────────────────────────────────────────────────────────
  JP:  { sp: 'A+',   moody: 'A1',   fitch: 'A+',   outlook: 'Stable', note: 'Debt/GDP 261%; BOJ YCC normalisation' },
  CN:  { sp: 'A+',   moody: 'A1',   fitch: 'A+',   outlook: 'Stable', note: 'Property sector stress; local govt debt' },
  ES:  { sp: 'A',    moody: 'Baa1', fitch: 'A-',   outlook: 'Positive', note: 'Tourism recovery; deficit narrowing' },
  CL:  { sp: 'A',    moody: 'A2',   fitch: 'A-',   outlook: 'Stable', note: 'Copper windfall; pension reform uncertainty' },
  PL:  { sp: 'A-',   moody: 'A2',   fitch: 'A-',   outlook: 'Stable' },
  IS:  { sp: 'A',    moody: 'A2',   fitch: 'A',    outlook: 'Stable' },
  SA:  { sp: 'A+',   moody: 'A1',   fitch: 'A+',   outlook: 'Positive', note: 'Vision 2030; oil price dependency' },
  AE:  { sp: 'AA',   moody: 'Aa2',  fitch: 'AA-',  outlook: 'Stable' },
  QA:  { sp: 'AA',   moody: 'Aa3',  fitch: 'AA-',  outlook: 'Stable', note: 'LNG revenue; North Field expansion' },
  KW:  { sp: 'A+',   moody: 'A1',   fitch: 'AA-',  outlook: 'Stable' },
  IL:  { sp: 'A+',   moody: 'A2',   fitch: 'A+',   outlook: 'Negative', note: 'War-related fiscal pressure; Oct 2023 downgrade cycle' },
  EE:  { sp: 'AA-',  moody: 'A1',   fitch: 'AA-',  outlook: 'Stable' },
  LT:  { sp: 'A+',   moody: 'A2',   fitch: 'A-',   outlook: 'Stable' },
  LV:  { sp: 'A+',   moody: 'A3',   fitch: 'A-',   outlook: 'Stable' },
  SK:  { sp: 'A+',   moody: 'A2',   fitch: 'A',    outlook: 'Stable' },
  MY:  { sp: 'A-',   moody: 'A3',   fitch: 'BBB+', outlook: 'Stable' },
  TH:  { sp: 'BBB+', moody: 'Baa1', fitch: 'BBB+', outlook: 'Stable' },
  PT:  { sp: 'A-',   moody: 'A3',   fitch: 'A-',   outlook: 'Positive', note: 'Successive upgrades from junk; budget surplus' },

  // ── BBB (Investment Grade border) ─────────────────────────────────────────
  IT:  { sp: 'BBB',  moody: 'Baa3', fitch: 'BBB',  outlook: 'Stable', note: 'Highest IG debt/GDP in EU; MES backstop critical' },
  GR:  { sp: 'BBB-', moody: 'Ba1',  fitch: 'BBB-', outlook: 'Positive', note: 'Returned to IG in 2023 (S&P); Moody\'s still HY' },
  IN:  { sp: 'BBB-', moody: 'Baa3', fitch: 'BBB-', outlook: 'Stable', note: 'Lowest IG; fiscal consolidation path' },
  MX:  { sp: 'BBB',  moody: 'Baa2', fitch: 'BBB-', outlook: 'Negative', note: 'Nearshoring benefit vs fiscal/rule-of-law risk' },
  ID:  { sp: 'BBB',  moody: 'Baa2', fitch: 'BBB',  outlook: 'Stable' },
  PH:  { sp: 'BBB',  moody: 'Baa2', fitch: 'BBB',  outlook: 'Stable' },
  PE:  { sp: 'BBB',  moody: 'Baa2', fitch: 'BBB',  outlook: 'Stable', note: 'Political instability discount' },
  CO:  { sp: 'BB+',  moody: 'Baa2', fitch: 'BB+',  outlook: 'Stable', note: 'S&P/Fitch HY; Moody\'s IG; Petro fiscal policies' },
  RO:  { sp: 'BBB-', moody: 'Baa3', fitch: 'BBB-', outlook: 'Negative', note: 'Twin deficit deterioration; EU cohesion funds' },
  HU:  { sp: 'BBB',  moody: 'Baa2', fitch: 'BBB',  outlook: 'Stable', note: 'Rule of law / EU funds tension' },
  VN:  { sp: 'BB+',  moody: 'Ba2',  fitch: 'BB+',  outlook: 'Positive', note: 'Strong FDI inflows; approaching IG' },
  KZ:  { sp: 'BBB',  moody: 'Baa2', fitch: 'BBB',  outlook: 'Stable' },
  MA:  { sp: 'BB+',  moody: 'Ba1',  fitch: 'BB+',  outlook: 'Positive' },
  JO:  { sp: 'BB-',  moody: 'B1',   fitch: 'BB-',  outlook: 'Positive' },
  HR:  { sp: 'BBB+', moody: 'Baa2', fitch: 'BBB+', outlook: 'Stable', note: 'Eurozone entry 2023 benefit' },
  BG:  { sp: 'BBB',  moody: 'Baa1', fitch: 'BBB',  outlook: 'Stable' },
  BA:  { sp: 'B',    moody: 'B3',   fitch: 'B',    outlook: 'Stable' },

  // ── BB (High Yield) ───────────────────────────────────────────────────────
  BR:  { sp: 'BB',   moody: 'Ba2',  fitch: 'BB',   outlook: 'Stable', note: 'Fiscal framework stress; Lula spending' },
  ZA:  { sp: 'BB-',  moody: 'Ba2',  fitch: 'BB-',  outlook: 'Stable', note: 'Load-shedding; Eskom reform; ANC coalition' },
  TR:  { sp: 'BB-',  moody: 'B1',   fitch: 'BB-',  outlook: 'Positive', note: 'Orthodox monetary policy return; Simsek credibility' },
  NG:  { sp: 'B',    moody: 'B2',   fitch: 'B',    outlook: 'Stable', note: 'FX unification; subsidy removal; oil theft' },
  AZ:  { sp: 'BB+',  moody: 'Ba1',  fitch: 'BB+',  outlook: 'Stable' },
  UZ:  { sp: 'BB-',  moody: 'B1',   fitch: 'BB-',  outlook: 'Stable' },
  UA:  { sp: 'B',    moody: 'Caa3', fitch: 'CCC',  outlook: 'Watch+', note: 'War economy; IMF program; restructuring done' },
  EG:  { sp: 'B',    moody: 'B3',   fitch: 'B',    outlook: 'Positive', note: 'IMF bailout 2024; FX reform; Ras El-Hekma deal' },
  PK:  { sp: 'CCC+', moody: 'Caa3', fitch: 'CCC-', outlook: 'Positive', note: 'IMF SBA 2023; FX reserves rebuilt from near-zero' },
  AR:  { sp: 'CCC',  moody: 'Ca',   fitch: 'CC',   outlook: 'Watch+', note: 'Milei shock therapy; bondholder recovery improving' },
  KE:  { sp: 'B',    moody: 'B2',   fitch: 'B',    outlook: 'Stable', note: 'Eurobond refinanced; IMF program' },
  TZ:  { sp: 'B+',   moody: 'B1',   fitch: 'B+',   outlook: 'Stable' },
  GH:  { sp: 'SD',   moody: 'Ca',   fitch: 'RD',   outlook: 'Watch+', note: 'Defaulted 2022; restructuring in progress' },
  ET:  { sp: 'CCC',  moody: 'Caa2', fitch: 'CCC',  outlook: 'Stable', note: 'G20 DSSI beneficiary; Tigray war fiscal damage' },
  ZM:  { sp: 'SD',   moody: 'Ca',   fitch: 'RD',   outlook: 'Watch+', note: 'First post-pandemic default 2020; G20 restructured 2023' },
  RU:  { sp: 'SD',   moody: 'Ca',   fitch: 'D',    outlook: 'NR', note: 'Sanctions-driven default 2022; cut off from Western capital' },
  SL:  { sp: 'SD',   moody: 'Ca',   fitch: 'RD',   outlook: 'Watch-', note: 'Economic collapse 2022; IMF Extended Fund' },
  MZ:  { sp: 'CCC+', moody: 'Caa1', fitch: 'CCC',  outlook: 'Stable' },
  EC:  { sp: 'B-',   moody: 'Caa1', fitch: 'CCC+', outlook: 'Negative', note: 'Noboa austerity; oil production decline' },
  VE:  { sp: 'SD',   moody: 'C',    fitch: 'D',    outlook: 'NR', note: 'Hyperinflation; sanctions; oil sector collapse' },
};

// ─── Rating → numeric score ───────────────────────────────────────────────────
const SP_SCALE: Record<string, number> = {
  'AAA': 21, 'AA+': 20, 'AA': 19, 'AA-': 18,
  'A+': 17, 'A': 16, 'A-': 15,
  'BBB+': 14, 'BBB': 13, 'BBB-': 12,
  'BB+': 11, 'BB': 10, 'BB-': 9,
  'B+': 8, 'B': 7, 'B-': 6,
  'CCC+': 5, 'CCC': 4, 'CCC-': 3,
  'CC': 2, 'C': 1, 'D': 0, 'SD': 0, 'RD': 0, 'NR': -1,
};

export function ratingScore(rating: string): number {
  return SP_SCALE[rating] ?? -1;
}

/** IG = ≥12 (BBB-); HY = 1-11; SD = 0; NR = -1 */
export function ratingTier(score: number): RatingTier {
  if (score < 0) return 'NR';
  if (score === 0) return 'SD';
  if (score >= 12) return 'IG';
  return 'HY';
}

/** Color ramp: AAA = deep green → IG = teal → BB = amber → B = orange → CCC/D = red → NR = gray */
export function ratingColor(score: number): string {
  if (score < 0) return 'hsla(220, 15%, 40%, 0.15)';  // NR
  if (score === 0) return 'hsla(0, 0%, 40%, 0.45)';   // SD/D
  if (score >= 18) return `hsla(145, 75%, ${48 - (21 - score) * 1}%, ${0.25 + (score - 18) * 0.05})`;  // AAA-AA
  if (score >= 12) {
    const t = (score - 12) / 6;  // 0 (BBB-) → 1 (AA-)
    return `hsla(${170 - t * 30}, 75%, ${48 - t * 4}%, ${0.22 + t * 0.15})`;  // teal → green
  }
  if (score >= 6) {
    const t = (score - 6) / 5;   // 0 (B-) → 1 (BB+)
    return `hsla(${35 + t * 20}, 88%, ${52 - t * 4}%, ${0.30 + t * 0.10})`;  // red-orange → amber
  }
  // CCC range (1-5)
  const t = score / 5;
  return `hsla(0, 90%, ${48 - t * 6}%, ${0.38 + t * 0.10})`;
}

/** Outlook color for badge/border accent. */
export function outlookColor(outlook: RatingOutlook): string {
  switch (outlook) {
    case 'Positive': case 'Watch+': return 'hsl(150, 80%, 55%)';
    case 'Negative': case 'Watch-': return 'hsl(0, 85%, 55%)';
    default:         return 'hsl(220, 15%, 55%)';
  }
}

export const RATING_TIER_LABEL: Record<RatingTier, string> = {
  IG: 'Investment Grade',
  HY: 'High Yield',
  SD: 'Selective Default',
  NR: 'Not Rated',
};
