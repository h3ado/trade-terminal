/**
 * Global remittance corridors (World Bank / Knomad 2023-2024 data).
 * Remittances drive FX demand in receiving countries and reveal informal
 * capital flows — useful for EM FX traders, sovereign credit analysts,
 * and development finance investors.
 *
 * fromLngLat / toLngLat: [lng, lat] of approximate hub cities.
 * valueUsdB: annual flow in USD billions.
 */

export type RemittanceFlow = {
  id: string;
  from: string;         // display label
  fromIso: string;
  to: string;
  toIso: string;
  fromLngLat: [number, number];
  toLngLat:   [number, number];
  valueUsdB: number;
  /** % of recipient country GDP */
  pctGdp?: number;
  notes?: string;
};

export const REMITTANCE_FLOWS: RemittanceFlow[] = [

  // ── From United States ────────────────────────────────────────────────────
  { id: 'us-mx', from: 'United States', fromIso: 'US', to: 'Mexico', toIso: 'MX',
    fromLngLat: [-87.65, 41.85], toLngLat: [-99.13, 19.43], valueUsdB: 63.0,
    pctGdp: 4.2, notes: 'Largest single corridor globally; ~40M Mexican-Americans' },
  { id: 'us-in', from: 'United States', fromIso: 'US', to: 'India', toIso: 'IN',
    fromLngLat: [-73.94, 40.65], toLngLat: [77.21, 28.61], valueUsdB: 32.0,
    notes: 'H-1B tech workers dominant; inflows into Kerala, Punjab' },
  { id: 'us-ph', from: 'United States', fromIso: 'US', to: 'Philippines', toIso: 'PH',
    fromLngLat: [-118.40, 33.94], toLngLat: [120.98, 14.60], valueUsdB: 11.0,
    pctGdp: 2.8, notes: 'Filipino diaspora ~4M in US; Ilocos/Visayas top recipients' },
  { id: 'us-cn', from: 'United States', fromIso: 'US', to: 'China', toIso: 'CN',
    fromLngLat: [-122.42, 37.77], toLngLat: [121.47, 31.23], valueUsdB: 14.0,
    notes: 'Chinese diaspora; declining with capital controls' },
  { id: 'us-gt', from: 'United States', fromIso: 'US', to: 'Guatemala', toIso: 'GT',
    fromLngLat: [-87.65, 41.85], toLngLat: [-90.52, 14.64], valueUsdB: 18.8,
    pctGdp: 19.8, notes: 'Largest share of recipient GDP in Central America' },
  { id: 'us-hn', from: 'United States', fromIso: 'US', to: 'Honduras', toIso: 'HN',
    fromLngLat: [-87.65, 41.85], toLngLat: [-87.20, 14.08], valueUsdB: 8.3,
    pctGdp: 22.6 },
  { id: 'us-sv', from: 'United States', fromIso: 'US', to: 'El Salvador', toIso: 'SV',
    fromLngLat: [-87.65, 41.85], toLngLat: [-89.20, 13.69], valueUsdB: 7.5,
    pctGdp: 24.1 },
  { id: 'us-do', from: 'United States', fromIso: 'US', to: 'Dominican Rep.', toIso: 'DO',
    fromLngLat: [-73.94, 40.65], toLngLat: [-70.16, 18.48], valueUsdB: 10.0,
    pctGdp: 10.5 },
  { id: 'us-ht', from: 'United States', fromIso: 'US', to: 'Haiti', toIso: 'HT',
    fromLngLat: [-73.94, 40.65], toLngLat: [-72.34, 18.54], valueUsdB: 3.5,
    pctGdp: 37.0, notes: 'Highest remittance % GDP in Western Hemisphere' },
  { id: 'us-ng', from: 'United States', fromIso: 'US', to: 'Nigeria', toIso: 'NG',
    fromLngLat: [-73.94, 40.65], toLngLat: [3.38, 6.52], valueUsdB: 4.2,
    notes: 'Diaspora via informal hawala; USD demand driver' },
  { id: 'us-vn', from: 'United States', fromIso: 'US', to: 'Vietnam', toIso: 'VN',
    fromLngLat: [-118.40, 33.94], toLngLat: [106.69, 10.82], valueUsdB: 3.8 },

  // ── From UAE ──────────────────────────────────────────────────────────────
  { id: 'ae-in', from: 'UAE', fromIso: 'AE', to: 'India', toIso: 'IN',
    fromLngLat: [55.30, 25.20], toLngLat: [77.21, 28.61], valueUsdB: 20.0,
    pctGdp: 0.6, notes: '~3.5M Indian workers in UAE; Kerala largest recipient state' },
  { id: 'ae-pk', from: 'UAE', fromIso: 'AE', to: 'Pakistan', toIso: 'PK',
    fromLngLat: [55.30, 25.20], toLngLat: [73.05, 33.72], valueUsdB: 5.8,
    pctGdp: 1.8 },
  { id: 'ae-ph', from: 'UAE', fromIso: 'AE', to: 'Philippines', toIso: 'PH',
    fromLngLat: [55.30, 25.20], toLngLat: [120.98, 14.60], valueUsdB: 5.0 },
  { id: 'ae-eg', from: 'UAE', fromIso: 'AE', to: 'Egypt', toIso: 'EG',
    fromLngLat: [55.30, 25.20], toLngLat: [31.25, 30.06], valueUsdB: 3.8 },
  { id: 'ae-bd', from: 'UAE', fromIso: 'AE', to: 'Bangladesh', toIso: 'BD',
    fromLngLat: [55.30, 25.20], toLngLat: [90.41, 23.81], valueUsdB: 2.5 },
  { id: 'ae-np', from: 'UAE', fromIso: 'AE', to: 'Nepal', toIso: 'NP',
    fromLngLat: [55.30, 25.20], toLngLat: [85.32, 27.71], valueUsdB: 1.8,
    pctGdp: 8.0 },
  { id: 'ae-lk', from: 'UAE', fromIso: 'AE', to: 'Sri Lanka', toIso: 'LK',
    fromLngLat: [55.30, 25.20], toLngLat: [80.64, 7.87], valueUsdB: 1.2 },

  // ── From Saudi Arabia ─────────────────────────────────────────────────────
  { id: 'sa-in', from: 'Saudi Arabia', fromIso: 'SA', to: 'India', toIso: 'IN',
    fromLngLat: [46.68, 24.68], toLngLat: [77.21, 28.61], valueUsdB: 11.0 },
  { id: 'sa-pk', from: 'Saudi Arabia', fromIso: 'SA', to: 'Pakistan', toIso: 'PK',
    fromLngLat: [46.68, 24.68], toLngLat: [73.05, 33.72], valueUsdB: 9.0,
    pctGdp: 2.8 },
  { id: 'sa-eg', from: 'Saudi Arabia', fromIso: 'SA', to: 'Egypt', toIso: 'EG',
    fromLngLat: [46.68, 24.68], toLngLat: [31.25, 30.06], valueUsdB: 6.0,
    pctGdp: 2.0, notes: 'Egypt FX crisis 2022-24 partly driven by remittance decline' },
  { id: 'sa-ph', from: 'Saudi Arabia', fromIso: 'SA', to: 'Philippines', toIso: 'PH',
    fromLngLat: [46.68, 24.68], toLngLat: [120.98, 14.60], valueUsdB: 4.0 },
  { id: 'sa-bd', from: 'Saudi Arabia', fromIso: 'SA', to: 'Bangladesh', toIso: 'BD',
    fromLngLat: [46.68, 24.68], toLngLat: [90.41, 23.81], valueUsdB: 3.5,
    pctGdp: 1.5 },
  { id: 'sa-np', from: 'Saudi Arabia', fromIso: 'SA', to: 'Nepal', toIso: 'NP',
    fromLngLat: [46.68, 24.68], toLngLat: [85.32, 27.71], valueUsdB: 1.5 },

  // ── From Kuwait & Qatar ───────────────────────────────────────────────────
  { id: 'kw-in', from: 'Kuwait', fromIso: 'KW', to: 'India', toIso: 'IN',
    fromLngLat: [47.98, 29.37], toLngLat: [77.21, 28.61], valueUsdB: 4.5 },
  { id: 'qa-in', from: 'Qatar', fromIso: 'QA', to: 'India', toIso: 'IN',
    fromLngLat: [51.53, 25.29], toLngLat: [77.21, 28.61], valueUsdB: 3.5,
    notes: 'Post-World Cup spike; ~800k Indian workers in Qatar' },
  { id: 'qa-pk', from: 'Qatar', fromIso: 'QA', to: 'Pakistan', toIso: 'PK',
    fromLngLat: [51.53, 25.29], toLngLat: [73.05, 33.72], valueUsdB: 2.0 },
  { id: 'qa-np', from: 'Qatar', fromIso: 'QA', to: 'Nepal', toIso: 'NP',
    fromLngLat: [51.53, 25.29], toLngLat: [85.32, 27.71], valueUsdB: 1.5 },

  // ── From United Kingdom ───────────────────────────────────────────────────
  { id: 'uk-in', from: 'UK', fromIso: 'GB', to: 'India', toIso: 'IN',
    fromLngLat: [-0.13, 51.51], toLngLat: [77.21, 28.61], valueUsdB: 5.0 },
  { id: 'uk-ng', from: 'UK', fromIso: 'GB', to: 'Nigeria', toIso: 'NG',
    fromLngLat: [-0.13, 51.51], toLngLat: [3.38, 6.52], valueUsdB: 3.5,
    pctGdp: 0.7, notes: 'Strong Nigerian diaspora in London; Poundsterling FX demand' },
  { id: 'uk-pk', from: 'UK', fromIso: 'GB', to: 'Pakistan', toIso: 'PK',
    fromLngLat: [-0.13, 51.51], toLngLat: [73.05, 33.72], valueUsdB: 4.0 },
  { id: 'uk-gh', from: 'UK', fromIso: 'GB', to: 'Ghana', toIso: 'GH',
    fromLngLat: [-0.13, 51.51], toLngLat: [-0.20, 5.56], valueUsdB: 1.8 },
  { id: 'uk-zm', from: 'UK', fromIso: 'GB', to: 'Zimbabwe', toIso: 'ZW',
    fromLngLat: [-0.13, 51.51], toLngLat: [30.91, -17.83], valueUsdB: 1.2 },

  // ── From Germany ──────────────────────────────────────────────────────────
  { id: 'de-tr', from: 'Germany', fromIso: 'DE', to: 'Turkey', toIso: 'TR',
    fromLngLat: [13.40, 52.52], toLngLat: [32.86, 39.93], valueUsdB: 2.8,
    notes: '~3M Turkish diaspora in Germany; TRY demand driver' },
  { id: 'de-pl', from: 'Germany', fromIso: 'DE', to: 'Poland', toIso: 'PL',
    fromLngLat: [13.40, 52.52], toLngLat: [21.01, 52.23], valueUsdB: 2.5,
    notes: 'EU labour mobility; declining with Polish wage convergence' },
  { id: 'de-ro', from: 'Germany', fromIso: 'DE', to: 'Romania', toIso: 'RO',
    fromLngLat: [13.40, 52.52], toLngLat: [26.10, 44.43], valueUsdB: 2.0 },

  // ── From Russia ───────────────────────────────────────────────────────────
  { id: 'ru-uz', from: 'Russia', fromIso: 'RU', to: 'Uzbekistan', toIso: 'UZ',
    fromLngLat: [37.62, 55.75], toLngLat: [69.26, 41.30], valueUsdB: 4.0,
    pctGdp: 11.5, notes: 'Post-war surge; ~5M Uzbeks in Russia' },
  { id: 'ru-tj', from: 'Russia', fromIso: 'RU', to: 'Tajikistan', toIso: 'TJ',
    fromLngLat: [37.62, 55.75], toLngLat: [68.79, 38.56], valueUsdB: 2.5,
    pctGdp: 30.0, notes: 'Highest remittance/GDP ratio in world; Tajik workers flood Russia' },
  { id: 'ru-ky', from: 'Russia', fromIso: 'RU', to: 'Kyrgyzstan', toIso: 'KG',
    fromLngLat: [37.62, 55.75], toLngLat: [74.60, 42.87], valueUsdB: 2.0,
    pctGdp: 27.0 },
  { id: 'ru-am', from: 'Russia', fromIso: 'RU', to: 'Armenia', toIso: 'AM',
    fromLngLat: [37.62, 55.75], toLngLat: [44.51, 40.18], valueUsdB: 1.8,
    pctGdp: 11.0 },

  // ── From China ────────────────────────────────────────────────────────────
  { id: 'cn-ph', from: 'China', fromIso: 'CN', to: 'Philippines', toIso: 'PH',
    fromLngLat: [121.47, 31.23], toLngLat: [120.98, 14.60], valueUsdB: 2.0,
    notes: 'Overseas Filipino in CN; also Chinese POGO sector workers' },
  { id: 'cn-pg', from: 'China', fromIso: 'CN', to: 'Papua New Guinea', toIso: 'PG',
    fromLngLat: [121.47, 31.23], toLngLat: [147.19, -9.44], valueUsdB: 0.5,
    pctGdp: 2.0, notes: 'BRI workers; informal flows undercount' },

  // ── Intra-Africa ──────────────────────────────────────────────────────────
  { id: 'za-zw', from: 'South Africa', fromIso: 'ZA', to: 'Zimbabwe', toIso: 'ZW',
    fromLngLat: [28.04, -26.20], toLngLat: [31.05, -17.83], valueUsdB: 1.5,
    pctGdp: 5.8, notes: '~2M Zimbabwean workers in SA; informal channels dominant' },
  { id: 'za-mz', from: 'South Africa', fromIso: 'ZA', to: 'Mozambique', toIso: 'MZ',
    fromLngLat: [28.04, -26.20], toLngLat: [35.30, -25.97], valueUsdB: 0.8 },
  { id: 'ci-ml', from: 'Côte d\'Ivoire', fromIso: 'CI', to: 'Mali', toIso: 'ML',
    fromLngLat: [-5.55, 6.40], toLngLat: [-8.00, 12.65], valueUsdB: 0.6,
    notes: 'Malian cocoa workers in Côte d\'Ivoire; informal corridor' },
  { id: 'gh-tg', from: 'Ghana', fromIso: 'GH', to: 'Togo', toIso: 'TG',
    fromLngLat: [-0.20, 5.56], toLngLat: [1.22, 6.14], valueUsdB: 0.3 },

  // ── Asia-Pacific ──────────────────────────────────────────────────────────
  { id: 'sg-in', from: 'Singapore', fromIso: 'SG', to: 'India', toIso: 'IN',
    fromLngLat: [103.82, 1.35], toLngLat: [77.21, 28.61], valueUsdB: 3.0 },
  { id: 'au-ph', from: 'Australia', fromIso: 'AU', to: 'Philippines', toIso: 'PH',
    fromLngLat: [151.21, -33.87], toLngLat: [120.98, 14.60], valueUsdB: 1.8 },
  { id: 'jp-ph', from: 'Japan', fromIso: 'JP', to: 'Philippines', toIso: 'PH',
    fromLngLat: [139.69, 35.68], toLngLat: [120.98, 14.60], valueUsdB: 1.5 },
  { id: 'jp-vn', from: 'Japan', fromIso: 'JP', to: 'Vietnam', toIso: 'VN',
    fromLngLat: [139.69, 35.68], toLngLat: [105.85, 21.03], valueUsdB: 1.2,
    notes: 'Kenshusei/Tokutei ginou workers; ~540k Vietnamese in Japan' },
];

/** Diverging ramp: large flows warm orange; small flows cool teal. Caps at $70B. */
export function remittanceColor(valueUsdB: number): string {
  const t = Math.min(1, valueUsdB / 50);
  // Teal → amber → orange
  const hue = 180 - t * 155;
  return `hsl(${hue.toFixed(0)}, 85%, ${55 - t * 8}%)`;
}
