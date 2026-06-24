/**
 * UNHCR major displacement corridors — refugees, asylum seekers, IDPs.
 * Data from UNHCR Global Trends 2023-2024 and mid-year statistics.
 *
 * countK: thousands of people (refugees + asylum seekers in host country
 *         from the origin country, approximate).
 * cause: primary driver of displacement.
 *
 * Rendered as great-circle arcs (same pattern as remittances.ts).
 * Arc width = log(countK); color = amber (100k) → deep red (2M+).
 */

export type DisplacementCause =
  | 'conflict'
  | 'political'
  | 'climate'
  | 'economic'
  | 'mixed';

export type RefugeeFlow = {
  id: string;
  fromName: string;
  fromIso: string;
  toName: string;
  toIso: string;
  fromLngLat: [number, number];  // [lng, lat]
  toLngLat:   [number, number];
  countK: number;                // thousands of people
  cause: DisplacementCause;
  notes?: string;
};

export const REFUGEE_FLOWS: RefugeeFlow[] = [

  // ── Ukraine (Russia invasion Feb 2022) ───────────────────────────────────
  { id: 'ua-pl', fromName: 'Ukraine', fromIso: 'UA', toName: 'Poland', toIso: 'PL',
    fromLngLat: [30.52, 50.45], toLngLat: [19.14, 51.92], countK: 965,
    cause: 'conflict', notes: 'Largest displaced population in Europe since WW2' },
  { id: 'ua-de', fromName: 'Ukraine', fromIso: 'UA', toName: 'Germany', toIso: 'DE',
    fromLngLat: [30.52, 50.45], toLngLat: [13.40, 52.52], countK: 1160,
    cause: 'conflict', notes: 'Germany\'s largest refugee intake since 2015 crisis' },
  { id: 'ua-cz', fromName: 'Ukraine', fromIso: 'UA', toName: 'Czech Republic', toIso: 'CZ',
    fromLngLat: [30.52, 50.45], toLngLat: [14.42, 50.09], countK: 365,
    cause: 'conflict' },
  { id: 'ua-ro', fromName: 'Ukraine', fromIso: 'UA', toName: 'Romania', toIso: 'RO',
    fromLngLat: [30.52, 50.45], toLngLat: [26.10, 44.43], countK: 78,
    cause: 'conflict' },
  { id: 'ua-sk', fromName: 'Ukraine', fromIso: 'UA', toName: 'Slovakia', toIso: 'SK',
    fromLngLat: [30.52, 50.45], toLngLat: [17.11, 48.15], countK: 115,
    cause: 'conflict' },
  { id: 'ua-it', fromName: 'Ukraine', fromIso: 'UA', toName: 'Italy', toIso: 'IT',
    fromLngLat: [30.52, 50.45], toLngLat: [12.49, 41.89], countK: 170,
    cause: 'conflict' },
  { id: 'ua-es', fromName: 'Ukraine', fromIso: 'UA', toName: 'Spain', toIso: 'ES',
    fromLngLat: [30.52, 50.45], toLngLat: [-3.70, 40.42], countK: 210,
    cause: 'conflict' },
  { id: 'ua-ru', fromName: 'Ukraine', fromIso: 'UA', toName: 'Russia', toIso: 'RU',
    fromLngLat: [30.52, 50.45], toLngLat: [37.62, 55.75], countK: 1200,
    cause: 'conflict', notes: 'Forced/voluntary displacement to Russia; most not recognized as refugees' },

  // ── Syria ─────────────────────────────────────────────────────────────────
  { id: 'sy-tr', fromName: 'Syria', fromIso: 'SY', toName: 'Turkey', toIso: 'TR',
    fromLngLat: [36.28, 33.51], toLngLat: [32.86, 39.93], countK: 3500,
    cause: 'conflict', notes: 'World\'s largest single refugee host (Turkey); #1 globally by count' },
  { id: 'sy-lb', fromName: 'Syria', fromIso: 'SY', toName: 'Lebanon', toIso: 'LB',
    fromLngLat: [36.28, 33.51], toLngLat: [35.53, 33.89], countK: 780,
    cause: 'conflict', notes: 'Highest per-capita refugee load globally; economic strain on Lebanon' },
  { id: 'sy-jo', fromName: 'Syria', fromIso: 'SY', toName: 'Jordan', toIso: 'JO',
    fromLngLat: [36.28, 33.51], toLngLat: [35.94, 31.96], countK: 650,
    cause: 'conflict' },
  { id: 'sy-de', fromName: 'Syria', fromIso: 'SY', toName: 'Germany', toIso: 'DE',
    fromLngLat: [36.28, 33.51], toLngLat: [13.40, 52.52], countK: 890,
    cause: 'conflict', notes: 'Merkel era 2015-2016; majority have TRP status' },
  { id: 'sy-se', fromName: 'Syria', fromIso: 'SY', toName: 'Sweden', toIso: 'SE',
    fromLngLat: [36.28, 33.51], toLngLat: [18.06, 59.33], countK: 115,
    cause: 'conflict' },

  // ── Venezuela ─────────────────────────────────────────────────────────────
  { id: 've-co', fromName: 'Venezuela', fromIso: 'VE', toName: 'Colombia', toIso: 'CO',
    fromLngLat: [-66.88, 10.48], toLngLat: [-74.08, 4.71], countK: 2900,
    cause: 'mixed', notes: '~30% of all Venezuelan migrants; Colombian TPS program' },
  { id: 've-pe', fromName: 'Venezuela', fromIso: 'VE', toName: 'Peru', toIso: 'PE',
    fromLngLat: [-66.88, 10.48], toLngLat: [-77.04, -12.05], countK: 1500,
    cause: 'mixed' },
  { id: 've-ec', fromName: 'Venezuela', fromIso: 'VE', toName: 'Ecuador', toIso: 'EC',
    fromLngLat: [-66.88, 10.48], toLngLat: [-78.52, -0.23], countK: 480,
    cause: 'mixed' },
  { id: 've-cl', fromName: 'Venezuela', fromIso: 'VE', toName: 'Chile', toIso: 'CL',
    fromLngLat: [-66.88, 10.48], toLngLat: [-70.67, -33.45], countK: 440,
    cause: 'mixed' },
  { id: 've-ar', fromName: 'Venezuela', fromIso: 'VE', toName: 'Argentina', toIso: 'AR',
    fromLngLat: [-66.88, 10.48], toLngLat: [-58.38, -34.60], countK: 180,
    cause: 'mixed' },
  { id: 've-us', fromName: 'Venezuela', fromIso: 'VE', toName: 'United States', toIso: 'US',
    fromLngLat: [-66.88, 10.48], toLngLat: [-80.20, 25.78], countK: 600,
    cause: 'mixed', notes: 'CBP encounters; TPS 2023; Florida/Texas destination' },
  { id: 've-br', fromName: 'Venezuela', fromIso: 'VE', toName: 'Brazil', toIso: 'BR',
    fromLngLat: [-66.88, 10.48], toLngLat: [-51.93, 2.82], countK: 510,
    cause: 'mixed', notes: 'Boa Vista/Roraima; Operação Acolhida UNHCR relocation' },

  // ── Afghanistan ───────────────────────────────────────────────────────────
  { id: 'af-pk', fromName: 'Afghanistan', fromIso: 'AF', toName: 'Pakistan', toIso: 'PK',
    fromLngLat: [67.71, 33.94], toLngLat: [72.85, 30.38], countK: 1700,
    cause: 'political', notes: 'Post-Taliban takeover Aug 2021; Pakistan deportation policy 2023-24' },
  { id: 'af-ir', fromName: 'Afghanistan', fromIso: 'AF', toName: 'Iran', toIso: 'IR',
    fromLngLat: [67.71, 33.94], toLngLat: [51.39, 35.69], countK: 800,
    cause: 'political', notes: 'Undocumented flows; Iran forced returns' },
  { id: 'af-de', fromName: 'Afghanistan', fromIso: 'AF', toName: 'Germany', toIso: 'DE',
    fromLngLat: [67.71, 33.94], toLngLat: [13.40, 52.52], countK: 280,
    cause: 'political', notes: 'Significant Afghan diaspora; SIV/staff evacuees 2021' },

  // ── South Sudan ───────────────────────────────────────────────────────────
  { id: 'ss-ug', fromName: 'South Sudan', fromIso: 'SS', toName: 'Uganda', toIso: 'UG',
    fromLngLat: [30.22, 6.86], toLngLat: [32.58, 0.32], countK: 1100,
    cause: 'conflict', notes: 'Bidibidi and Bidi Bidi settlements; world\'s 3rd largest refugee camp' },
  { id: 'ss-sd', fromName: 'South Sudan', fromIso: 'SS', toName: 'Sudan', toIso: 'SD',
    fromLngLat: [30.22, 6.86], toLngLat: [32.53, 15.55], countK: 820,
    cause: 'conflict', notes: 'Now doubly affected by Sudan civil war' },
  { id: 'ss-et', fromName: 'South Sudan', fromIso: 'SS', toName: 'Ethiopia', toIso: 'ET',
    fromLngLat: [30.22, 6.86], toLngLat: [38.90, 8.98], countK: 330,
    cause: 'conflict' },
  { id: 'ss-ke', fromName: 'South Sudan', fromIso: 'SS', toName: 'Kenya', toIso: 'KE',
    fromLngLat: [30.22, 6.86], toLngLat: [36.82, -1.29], countK: 135,
    cause: 'conflict', notes: 'Kakuma camp' },

  // ── Sudan civil war (2023-) ──────────────────────────────────────────────
  { id: 'sd-eg', fromName: 'Sudan', fromIso: 'SD', toName: 'Egypt', toIso: 'EG',
    fromLngLat: [32.53, 15.55], toLngLat: [31.25, 30.06], countK: 890,
    cause: 'conflict', notes: 'SAF vs RSF civil war since Apr 2023' },
  { id: 'sd-td', fromName: 'Sudan', fromIso: 'SD', toName: 'Chad', toIso: 'TD',
    fromLngLat: [32.53, 15.55], toLngLat: [15.06, 12.11], countK: 680,
    cause: 'conflict' },
  { id: 'sd-ss', fromName: 'Sudan', fromIso: 'SD', toName: 'South Sudan', toIso: 'SS',
    fromLngLat: [32.53, 15.55], toLngLat: [30.22, 6.86], countK: 580,
    cause: 'conflict', notes: 'Returnees + new arrivals' },
  { id: 'sd-et', fromName: 'Sudan', fromIso: 'SD', toName: 'Ethiopia', toIso: 'ET',
    fromLngLat: [32.53, 15.55], toLngLat: [38.90, 8.98], countK: 260,
    cause: 'conflict' },

  // ── Myanmar / Rohingya ────────────────────────────────────────────────────
  { id: 'mm-bd', fromName: 'Myanmar', fromIso: 'MM', toName: 'Bangladesh', toIso: 'BD',
    fromLngLat: [96.17, 16.87], toLngLat: [90.33, 23.84], countK: 960,
    cause: 'conflict', notes: 'Cox\'s Bazar Rohingya camps; 2017 genocide; world\'s largest stateless pop' },
  { id: 'mm-th', fromName: 'Myanmar', fromIso: 'MM', toName: 'Thailand', toIso: 'TH',
    fromLngLat: [96.17, 16.87], toLngLat: [100.52, 13.75], countK: 100,
    cause: 'political', notes: 'Post-coup 2021 arrivals + Mae Sot refugee villages' },
  { id: 'mm-in', fromName: 'Myanmar', fromIso: 'MM', toName: 'India', toIso: 'IN',
    fromLngLat: [96.17, 16.87], toLngLat: [93.95, 24.82], countK: 55,
    cause: 'political', notes: 'Mizoram & Manipur borderland arrivals' },

  // ── Somalia ───────────────────────────────────────────────────────────────
  { id: 'so-ke', fromName: 'Somalia', fromIso: 'SO', toName: 'Kenya', toIso: 'KE',
    fromLngLat: [45.34, 2.05], toLngLat: [41.85, 2.55], countK: 340,
    cause: 'conflict', notes: 'Dadaab camp; protracted displacement since 1991' },
  { id: 'so-et', fromName: 'Somalia', fromIso: 'SO', toName: 'Ethiopia', toIso: 'ET',
    fromLngLat: [45.34, 2.05], toLngLat: [41.60, 5.10], countK: 230,
    cause: 'mixed', notes: 'Dollo Ado camps' },
  { id: 'so-ye', fromName: 'Somalia', fromIso: 'SO', toName: 'Yemen', toIso: 'YE',
    fromLngLat: [45.34, 2.05], toLngLat: [48.52, 15.55], countK: 35,
    cause: 'mixed', notes: 'Unusual flow toward conflict-affected Yemen; economic' },

  // ── DRC ───────────────────────────────────────────────────────────────────
  { id: 'cd-ug', fromName: 'DRC', fromIso: 'CD', toName: 'Uganda', toIso: 'UG',
    fromLngLat: [23.66, -4.32], toLngLat: [32.58, 0.32], countK: 490,
    cause: 'conflict', notes: 'Eastern DRC M23 conflict; Beni/Butembo displacement' },
  { id: 'cd-tz', fromName: 'DRC', fromIso: 'CD', toName: 'Tanzania', toIso: 'TZ',
    fromLngLat: [23.66, -4.32], toLngLat: [34.89, -6.19], countK: 230,
    cause: 'conflict' },
  { id: 'cd-rw', fromName: 'DRC', fromIso: 'CD', toName: 'Rwanda', toIso: 'RW',
    fromLngLat: [23.66, -4.32], toLngLat: [30.06, -1.94], countK: 80,
    cause: 'conflict', notes: 'Rwanda-DRC tension over M23 support allegations' },

  // ── Ethiopia ──────────────────────────────────────────────────────────────
  { id: 'et-sd', fromName: 'Ethiopia', fromIso: 'ET', toName: 'Sudan', toIso: 'SD',
    fromLngLat: [38.90, 8.98], toLngLat: [36.10, 14.90], countK: 600,
    cause: 'conflict', notes: 'Tigray war displacement; now doubly displaced by Sudan conflict' },

  // ── Gaza (2023-2024 crisis) ───────────────────────────────────────────────
  { id: 'ps-eg', fromName: 'Gaza', fromIso: 'PS', toName: 'Egypt', toIso: 'EG',
    fromLngLat: [34.38, 31.42], toLngLat: [31.25, 30.06], countK: 95,
    cause: 'conflict', notes: 'Rafah crossing; Egypt Sinai buffer zone; partial evacuation' },

  // ── El Salvador / Honduras / Guatemala → US (Northern Triangle) ───────────
  { id: 'sv-us', fromName: 'El Salvador', fromIso: 'SV', toName: 'United States', toIso: 'US',
    fromLngLat: [-89.22, 13.69], toLngLat: [-87.65, 29.00], countK: 380,
    cause: 'mixed', notes: 'Gang violence + poverty; CBP Title 42 ended 2023' },
  { id: 'hn-us', fromName: 'Honduras', fromIso: 'HN', toName: 'United States', toIso: 'US',
    fromLngLat: [-87.20, 14.08], toLngLat: [-87.65, 29.00], countK: 520,
    cause: 'mixed' },
  { id: 'gt-us', fromName: 'Guatemala', fromIso: 'GT', toName: 'United States', toIso: 'US',
    fromLngLat: [-90.52, 14.64], toLngLat: [-87.65, 29.00], countK: 640,
    cause: 'mixed', notes: 'Indigenous Maya communities; climate / drought component' },

  // ── Sahel / West Africa ──────────────────────────────────────────────────
  { id: 'ml-mr', fromName: 'Mali', fromIso: 'ML', toName: 'Mauritania', toIso: 'MR',
    fromLngLat: [-8.00, 17.57], toLngLat: [-15.98, 18.07], countK: 96,
    cause: 'conflict', notes: 'Sahel jihadist insurgency; JNIM/ISGS attacks' },
  { id: 'bf-ci', fromName: 'Burkina Faso', fromIso: 'BF', toName: 'Côte d\'Ivoire', toIso: 'CI',
    fromLngLat: [-1.56, 12.36], toLngLat: [-5.55, 6.40], countK: 80,
    cause: 'conflict', notes: 'Sahel spillover to coastal West Africa; 1M+ internally displaced in BF' },
];

/** Color by displacement size: amber (100k) → orange → deep red (1.5M+). */
export function refugeeFlowColor(countK: number): string {
  const t = Math.min(1, Math.log10(Math.max(1, countK)) / Math.log10(2000));
  const hue = 45 - t * 45;  // amber → red
  return `hsl(${hue.toFixed(0)}, 90%, ${55 - t * 8}%)`;
}
