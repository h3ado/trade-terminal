/**
 * Carbon markets / Emissions Trading Schemes (ETS).
 * Relevant for energy traders, ESG investors, and industrial commodities.
 *
 * Country-level ETS coverage uses ISO-A2 keys (rendered via countryPaths
 * choropleth, same as travel advisory). Sub-national schemes (California,
 * RGGI, Tokyo) rendered as distinct point features with coverage circles.
 *
 * Price is approximate latest spot price in USD/t CO2e.
 * Coverage: sectors included (all = economy-wide; power = electricity only).
 */

export type ETSCoverage = 'all' | 'power' | 'industry' | 'power_industry';
export type ETSStatus = 'OPERATIONAL' | 'PLANNED' | 'PILOT';

export type NationalETS = {
  iso: string;         // ISO-A2
  name: string;
  scheme: string;
  priceUsd: number;
  coverage: ETSCoverage;
  status: ETSStatus;
  startYear: number;
  emissionsMtCO2?: number;  // annual covered
  notes?: string;
};

export type SubnationalETS = {
  id: string;
  name: string;
  scheme: string;
  lat: number;
  lng: number;
  priceUsd: number;
  coverage: ETSCoverage;
  status: ETSStatus;
  startYear: number;
  radiusDeg?: number;  // for circle rendering
  notes?: string;
};

// ─── National / supra-national ETS (choropleth via countryPaths) ─────────────
export const NATIONAL_ETS: NationalETS[] = [
  // ── EU + EEA (EU ETS — world's largest) ──────────────────────────────────
  { iso: 'AT', name: 'Austria', scheme: 'EU ETS', priceUsd: 68, coverage: 'power_industry', status: 'OPERATIONAL', startYear: 2005, emissionsMtCO2: 30 },
  { iso: 'BE', name: 'Belgium', scheme: 'EU ETS', priceUsd: 68, coverage: 'power_industry', status: 'OPERATIONAL', startYear: 2005, emissionsMtCO2: 40 },
  { iso: 'BG', name: 'Bulgaria', scheme: 'EU ETS', priceUsd: 68, coverage: 'power_industry', status: 'OPERATIONAL', startYear: 2007 },
  { iso: 'CY', name: 'Cyprus', scheme: 'EU ETS', priceUsd: 68, coverage: 'power_industry', status: 'OPERATIONAL', startYear: 2008 },
  { iso: 'CZ', name: 'Czech Republic', scheme: 'EU ETS', priceUsd: 68, coverage: 'power_industry', status: 'OPERATIONAL', startYear: 2004 },
  { iso: 'DK', name: 'Denmark', scheme: 'EU ETS', priceUsd: 68, coverage: 'power_industry', status: 'OPERATIONAL', startYear: 2005 },
  { iso: 'EE', name: 'Estonia', scheme: 'EU ETS', priceUsd: 68, coverage: 'power_industry', status: 'OPERATIONAL', startYear: 2005 },
  { iso: 'FI', name: 'Finland', scheme: 'EU ETS', priceUsd: 68, coverage: 'power_industry', status: 'OPERATIONAL', startYear: 2005 },
  { iso: 'FR', name: 'France', scheme: 'EU ETS', priceUsd: 68, coverage: 'power_industry', status: 'OPERATIONAL', startYear: 2005, emissionsMtCO2: 130 },
  { iso: 'DE', name: 'Germany', scheme: 'EU ETS', priceUsd: 68, coverage: 'power_industry', status: 'OPERATIONAL', startYear: 2005, emissionsMtCO2: 300, notes: 'Largest EU ETS participant' },
  { iso: 'GR', name: 'Greece', scheme: 'EU ETS', priceUsd: 68, coverage: 'power_industry', status: 'OPERATIONAL', startYear: 2005 },
  { iso: 'HR', name: 'Croatia', scheme: 'EU ETS', priceUsd: 68, coverage: 'power_industry', status: 'OPERATIONAL', startYear: 2013 },
  { iso: 'HU', name: 'Hungary', scheme: 'EU ETS', priceUsd: 68, coverage: 'power_industry', status: 'OPERATIONAL', startYear: 2005 },
  { iso: 'IE', name: 'Ireland', scheme: 'EU ETS', priceUsd: 68, coverage: 'power_industry', status: 'OPERATIONAL', startYear: 2005 },
  { iso: 'IT', name: 'Italy', scheme: 'EU ETS', priceUsd: 68, coverage: 'power_industry', status: 'OPERATIONAL', startYear: 2005, emissionsMtCO2: 160 },
  { iso: 'LT', name: 'Lithuania', scheme: 'EU ETS', priceUsd: 68, coverage: 'power_industry', status: 'OPERATIONAL', startYear: 2005 },
  { iso: 'LU', name: 'Luxembourg', scheme: 'EU ETS', priceUsd: 68, coverage: 'power_industry', status: 'OPERATIONAL', startYear: 2005 },
  { iso: 'LV', name: 'Latvia', scheme: 'EU ETS', priceUsd: 68, coverage: 'power_industry', status: 'OPERATIONAL', startYear: 2005 },
  { iso: 'MT', name: 'Malta', scheme: 'EU ETS', priceUsd: 68, coverage: 'power_industry', status: 'OPERATIONAL', startYear: 2008 },
  { iso: 'NL', name: 'Netherlands', scheme: 'EU ETS', priceUsd: 68, coverage: 'power_industry', status: 'OPERATIONAL', startYear: 2005, emissionsMtCO2: 80 },
  { iso: 'PL', name: 'Poland', scheme: 'EU ETS', priceUsd: 68, coverage: 'power_industry', status: 'OPERATIONAL', startYear: 2005, emissionsMtCO2: 200, notes: 'Coal-heavy; high political sensitivity' },
  { iso: 'PT', name: 'Portugal', scheme: 'EU ETS', priceUsd: 68, coverage: 'power_industry', status: 'OPERATIONAL', startYear: 2005 },
  { iso: 'RO', name: 'Romania', scheme: 'EU ETS', priceUsd: 68, coverage: 'power_industry', status: 'OPERATIONAL', startYear: 2007 },
  { iso: 'SE', name: 'Sweden', scheme: 'EU ETS', priceUsd: 68, coverage: 'power_industry', status: 'OPERATIONAL', startYear: 2005 },
  { iso: 'SI', name: 'Slovenia', scheme: 'EU ETS', priceUsd: 68, coverage: 'power_industry', status: 'OPERATIONAL', startYear: 2005 },
  { iso: 'SK', name: 'Slovakia', scheme: 'EU ETS', priceUsd: 68, coverage: 'power_industry', status: 'OPERATIONAL', startYear: 2005 },
  { iso: 'ES', name: 'Spain', scheme: 'EU ETS', priceUsd: 68, coverage: 'power_industry', status: 'OPERATIONAL', startYear: 2005, emissionsMtCO2: 140 },
  // EEA non-EU participants
  { iso: 'IS', name: 'Iceland', scheme: 'EU ETS', priceUsd: 68, coverage: 'power_industry', status: 'OPERATIONAL', startYear: 2013 },
  { iso: 'LI', name: 'Liechtenstein', scheme: 'EU ETS', priceUsd: 68, coverage: 'power_industry', status: 'OPERATIONAL', startYear: 2008 },
  { iso: 'NO', name: 'Norway', scheme: 'EU ETS', priceUsd: 68, coverage: 'power_industry', status: 'OPERATIONAL', startYear: 2008, notes: 'EEA; oil sector included' },

  // ── United Kingdom ────────────────────────────────────────────────────────
  { iso: 'GB', name: 'United Kingdom', scheme: 'UK ETS', priceUsd: 42, coverage: 'power_industry', status: 'OPERATIONAL', startYear: 2021, emissionsMtCO2: 150, notes: 'Post-Brexit; expanding to maritime/aviation 2026' },

  // ── Switzerland ───────────────────────────────────────────────────────────
  { iso: 'CH', name: 'Switzerland', scheme: 'CH ETS (linked EU)', priceUsd: 68, coverage: 'power_industry', status: 'OPERATIONAL', startYear: 2008, notes: 'Linked to EU ETS since 2020' },

  // ── China ─────────────────────────────────────────────────────────────────
  { iso: 'CN', name: 'China', scheme: 'China National ETS', priceUsd: 12, coverage: 'power', status: 'OPERATIONAL', startYear: 2021, emissionsMtCO2: 5100, notes: 'World\'s largest by volume (power sector only); low price limits ambition. Expanding to steel/cement.' },

  // ── South Korea ───────────────────────────────────────────────────────────
  { iso: 'KR', name: 'South Korea', scheme: 'K-ETS', priceUsd: 8, coverage: 'power_industry', status: 'OPERATIONAL', startYear: 2015, emissionsMtCO2: 600, notes: 'Third phase 2021-2025; covers 70% of national emissions' },

  // ── New Zealand ───────────────────────────────────────────────────────────
  { iso: 'NZ', name: 'New Zealand', scheme: 'NZ ETS', priceUsd: 28, coverage: 'all', status: 'OPERATIONAL', startYear: 2008, emissionsMtCO2: 50, notes: 'Includes forestry; first ETS to include agriculture sector' },

  // ── Australia ────────────────────────────────────────────────────────────
  { iso: 'AU', name: 'Australia', scheme: 'Safeguard Mechanism (reformed)', priceUsd: 34, coverage: 'industry', status: 'OPERATIONAL', startYear: 2023, emissionsMtCO2: 140, notes: 'Reformed 2023 under Albanese; covers 215 largest emitters' },

  // ── Canada (federal + provincial) ─────────────────────────────────────────
  { iso: 'CA', name: 'Canada', scheme: 'OBPS + provincial systems', priceUsd: 55, coverage: 'power_industry', status: 'OPERATIONAL', startYear: 2019, emissionsMtCO2: 300, notes: 'Federal Output-Based Pricing System; backstop for provinces without their own system. BC has own cap-and-trade.' },

  // ── Singapore ─────────────────────────────────────────────────────────────
  { iso: 'SG', name: 'Singapore', scheme: 'Singapore Carbon Tax', priceUsd: 25, coverage: 'power_industry', status: 'OPERATIONAL', startYear: 2019, notes: 'Escalating to S$50-80 by 2030; covers 80% of emissions' },

  // ── Ukraine ───────────────────────────────────────────────────────────────
  { iso: 'UA', name: 'Ukraine', scheme: 'Ukraine ETS', priceUsd: 2, coverage: 'power_industry', status: 'OPERATIONAL', startYear: 2013, notes: 'KyotoProtocol legacy; EU accession harmonisation underway' },

  // ── In development ────────────────────────────────────────────────────────
  { iso: 'IN', name: 'India', scheme: 'Carbon Credit Trading Scheme', priceUsd: 3, coverage: 'industry', status: 'PILOT', startYear: 2023, notes: 'Perform Achieve Trade → CCTS; mandatory 2026; price low' },
  { iso: 'TR', name: 'Türkiye', scheme: 'Turkey ETS (pilot)', priceUsd: 4, coverage: 'power_industry', status: 'PILOT', startYear: 2024, notes: 'EU Carbon Border Adjustment Mechanism pressure; pilot 2024' },
  { iso: 'TH', name: 'Thailand', scheme: 'Thailand ETS (voluntary→mandatory)', priceUsd: 2, coverage: 'power_industry', status: 'PILOT', startYear: 2023 },
  { iso: 'VN', name: 'Vietnam', scheme: 'Vietnam ETS (planned)', priceUsd: 1, coverage: 'power_industry', status: 'PLANNED', startYear: 2026, notes: 'Mandatory pilot 2025; full 2028' },
  { iso: 'ID', name: 'Indonesia', scheme: 'Indonesia ETS', priceUsd: 2, coverage: 'power', status: 'PILOT', startYear: 2023, notes: 'Power sector pilot; coal phase-out context' },
  { iso: 'BR', name: 'Brazil', scheme: 'Brazil ETS (Mercado Regulado)', priceUsd: 6, coverage: 'power_industry', status: 'PLANNED', startYear: 2025, notes: 'Climate Framework Law 2023; operational 2026' },
  { iso: 'CL', name: 'Chile', scheme: 'Chilean Green Tax / ETS', priceUsd: 5, coverage: 'power_industry', status: 'PLANNED', startYear: 2025 },
  { iso: 'MX', name: 'Mexico', scheme: 'Mexico ETS (pilot)', priceUsd: 2, coverage: 'power_industry', status: 'PILOT', startYear: 2020, notes: 'Pilot since 2020; transition to mandatory' },
];

// ─── Sub-national ETS schemes (rendered as point + circle) ───────────────────
export const SUBNATIONAL_ETS: SubnationalETS[] = [
  {
    id: 'california-ets', name: 'California Cap-and-Trade', scheme: 'California C&T',
    lat: 36.78, lng: -119.42, priceUsd: 32, coverage: 'all', status: 'OPERATIONAL', startYear: 2013,
    radiusDeg: 3.5,
    notes: 'AB 32; linked with Quebec. Covers ~85% of state GHG. ~$4B/yr auction revenue.',
  },
  {
    id: 'rggi', name: 'RGGI (12 NE US states)', scheme: 'Regional GHG Initiative',
    lat: 42.50, lng: -72.50, priceUsd: 15, coverage: 'power', status: 'OPERATIONAL', startYear: 2009,
    radiusDeg: 4.5,
    notes: 'CT, DE, ME, MD, MA, NH, NJ, NY, PA (limited), RI, VT, VA. Power sector only. ~$1B/yr revenue.',
  },
  {
    id: 'quebec-ets', name: 'Québec Cap-and-Trade', scheme: 'WCI Quebec-CA',
    lat: 52.50, lng: -73.00, priceUsd: 32, coverage: 'all', status: 'OPERATIONAL', startYear: 2013,
    radiusDeg: 3.0,
    notes: 'Linked with California since 2014. AB 32 equivalent in Canada.',
  },
  {
    id: 'british-columbia', name: 'BC Carbon Tax', scheme: 'BC Carbon Tax',
    lat: 54.00, lng: -125.00, priceUsd: 55, coverage: 'all', status: 'OPERATIONAL', startYear: 2008,
    radiusDeg: 3.0,
    notes: 'World\'s first broad carbon tax 2008; C$65/t in 2024.',
  },
  {
    id: 'tokyo-ets', name: 'Tokyo Cap-and-Trade', scheme: 'Tokyo Metropolitan ETS',
    lat: 35.68, lng: 139.69, priceUsd: 14, coverage: 'all', status: 'OPERATIONAL', startYear: 2010,
    radiusDeg: 1.2,
    notes: 'First mandatory urban cap-and-trade globally. Buildings+factories in metro area.',
  },
  {
    id: 'saitama-ets', name: 'Saitama ETS', scheme: 'Saitama Emissions Trading',
    lat: 35.86, lng: 139.65, priceUsd: 12, coverage: 'all', status: 'OPERATIONAL', startYear: 2011,
    radiusDeg: 0.8,
    notes: 'Linked with Tokyo; buildings-focused.',
  },
];

/** ETS price → color ramp: teal (low price) → green → amber (high price). */
export function carbonPriceColor(priceUsd: number, status: ETSStatus): string {
  if (status === 'PLANNED') return 'hsla(195, 60%, 55%, 0.12)';
  if (status === 'PILOT')   return 'hsla(170, 65%, 50%, 0.15)';
  const t = Math.min(1, priceUsd / 75);
  const hue = 175 - t * 125;  // teal → green → amber
  return `hsla(${hue.toFixed(0)}, 75%, ${52 - t * 8}%, ${0.15 + t * 0.25})`;
}

export const ETS_STATUS_LABEL: Record<ETSStatus, string> = {
  OPERATIONAL: 'Operational',
  PLANNED:     'Planned',
  PILOT:       'Pilot',
};

/** ISO-A2 keyed lookup for quick choropleth color. */
export const ETS_BY_ISO: Record<string, NationalETS> = Object.fromEntries(
  NATIONAL_ETS.map(e => [e.iso, e])
);
