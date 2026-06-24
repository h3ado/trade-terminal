/**
 * Major freight rail corridors — critical for supply-chain, commodities, and
 * Belt-and-Road geopolitical overlays. Paths are [lng, lat] waypoints.
 *
 * Categories:
 *   bri     — China's Belt & Road / BRI freight corridors
 *   bulk    — Iron ore / coal bulk-haul railways
 *   container — Intermodal container corridors
 *   energy  — Oil/gas pipeline rail companions
 */

export type RailCategory = 'bri' | 'bulk' | 'container' | 'energy';

export type RailCorridor = {
  id: string;
  name: string;
  category: RailCategory;
  /** Annual freight volume (million tonnes, approximate) */
  volumeMt?: number;
  status: 'OPERATIONAL' | 'PLANNED' | 'UNDER_CONSTRUCTION';
  /** Ordered [lng, lat] waypoints */
  path: [number, number][];
};

export const RAIL_CORRIDORS: RailCorridor[] = [
  // ── BRI / China–Europe ───────────────────────────────────────────────────
  {
    id: 'bri-chengdu-duisburg', name: 'Chengdu–Duisburg (China Railway Express)', category: 'bri',
    volumeMt: 20, status: 'OPERATIONAL',
    path: [
      [104.07, 30.67],  // Chengdu
      [112.00, 34.00],  // Zhengzhou
      [117.00, 36.00],  // Jinan
      [121.00, 41.80],  // Shenyang area
      [123.00, 45.50],  // Harbin area
      [115.00, 48.00],  // Inner Mongolia
      [108.00, 50.50],  // Manzhouli approach
      [103.00, 50.30],  // Zabaykalsk (Russia)
      [80.00, 54.00],   // Siberia
      [60.00, 55.00],   // Ural crossing
      [38.00, 55.50],   // Moscow
      [23.00, 52.50],   // Brest / Poland border
      [17.00, 51.50],   // Wrocław
      [13.50, 51.50],   // Dresden
      [6.78, 51.42],    // Duisburg
    ],
  },
  {
    id: 'bri-yiwu-madrid', name: 'Yiwu–Madrid (CR Express)', category: 'bri',
    volumeMt: 8, status: 'OPERATIONAL',
    path: [
      [120.07, 29.31],  // Yiwu
      [108.00, 34.00],  // Zhengzhou hub
      [87.00, 43.50],   // Ürümqi (China-Kazakhstan border)
      [75.00, 43.00],   // Almaty approach
      [65.00, 45.00],   // Kazakhstan steppe
      [50.00, 51.00],   // Russia
      [38.00, 55.50],   // Moscow
      [23.00, 52.50],   // Warsaw/Brest
      [14.00, 50.00],   // Prague
      [8.00, 48.50],    // Stuttgart
      [-3.70, 40.42],   // Madrid
    ],
  },
  {
    id: 'bri-southern', name: 'BRI Southern Corridor (Kunming–Singapore)', category: 'bri',
    volumeMt: 15, status: 'UNDER_CONSTRUCTION',
    path: [
      [102.82, 24.88],  // Kunming
      [102.50, 22.00],  // Boten (China-Laos)
      [102.10, 19.90],  // Luang Prabang
      [102.60, 17.97],  // Vientiane
      [102.90, 15.00],  // Bangkok
      [101.70, 3.14],   // Kuala Lumpur
      [103.80, 1.35],   // Singapore
    ],
  },
  {
    id: 'bri-cpec', name: 'CPEC Rail (Karachi–Kashgar)', category: 'bri',
    volumeMt: 10, status: 'UNDER_CONSTRUCTION',
    path: [
      [67.01, 24.86],   // Karachi
      [67.00, 30.00],   // Hyderabad–Multan axis
      [70.00, 33.00],   // Lahore
      [72.00, 34.00],   // Rawalpindi
      [75.00, 36.00],   // Gilgit
      [76.50, 37.50],   // Khunjerab Pass
      [76.00, 39.00],   // Kashgar
    ],
  },
  {
    id: 'bri-mombasa-nairobi', name: 'SGR Mombasa–Nairobi–Kisumu', category: 'bri',
    volumeMt: 5, status: 'OPERATIONAL',
    path: [
      [39.68, -4.05],   // Mombasa
      [38.00, -1.50],
      [36.82, -1.28],   // Nairobi
      [34.80, -0.10],   // Kisumu
    ],
  },
  {
    id: 'bri-belgrade-budapest', name: 'Belgrade–Budapest Rail', category: 'bri',
    volumeMt: 8, status: 'UNDER_CONSTRUCTION',
    path: [
      [20.46, 44.80],   // Belgrade
      [19.00, 46.00],
      [19.04, 47.50],   // Budapest
    ],
  },
  {
    id: 'bri-east-coast-malaysia', name: 'ECRL Malaysia', category: 'bri',
    volumeMt: 12, status: 'UNDER_CONSTRUCTION',
    path: [
      [101.68, 3.14],   // Kuala Lumpur
      [102.50, 3.50],
      [103.40, 3.80],   // Gombak
      [103.60, 4.40],   // Bentong
      [102.80, 5.80],   // Raub
      [103.80, 6.12],   // Kota Bharu
    ],
  },

  // ── Bulk Commodity Rail ─────────────────────────────────────────────────
  {
    id: 'pilbara-rail', name: 'Pilbara Iron Ore Railways', category: 'bulk',
    volumeMt: 800, status: 'OPERATIONAL',
    path: [
      [117.20, -27.00], // Newman mines
      [118.00, -24.00], // Tom Price
      [116.00, -21.50], // Paraburdoo
      [118.60, -20.31], // Port Hedland
    ],
  },
  {
    id: 'carajas-rail', name: 'Carajás Railway (EFC)', category: 'bulk',
    volumeMt: 168, status: 'OPERATIONAL',
    path: [
      [-50.10, -6.10],  // Carajás mine
      [-44.36, -2.55],  // Ponta da Madeira port
    ],
  },
  {
    id: 'baffinland-tote', name: 'Saldanha Bay Iron Ore Rail', category: 'bulk',
    volumeMt: 60, status: 'OPERATIONAL',
    path: [
      [22.50, -27.00],  // Sishen mine
      [19.00, -30.00],
      [17.95, -33.01],  // Saldanha Bay
    ],
  },
  {
    id: 'trans-siberian', name: 'Trans-Siberian Railway', category: 'bulk',
    volumeMt: 120, status: 'OPERATIONAL',
    path: [
      [37.62, 55.75],   // Moscow
      [56.00, 58.00],   // Perm
      [60.50, 56.80],   // Ekaterinburg
      [73.40, 54.90],   // Omsk
      [82.90, 54.96],   // Novosibirsk
      [92.80, 56.00],   // Krasnoyarsk
      [104.30, 52.29],  // Irkutsk
      [113.50, 51.50],  // Chita
      [120.50, 48.50],  // Khabarovsk area
      [131.90, 43.12],  // Vladivostok
    ],
  },
  {
    id: 'bam-rail', name: 'BAM Railway (Baikal-Amur)', category: 'bulk',
    volumeMt: 40, status: 'OPERATIONAL',
    path: [
      [56.60, 56.80],   // Taishet
      [65.00, 56.50],
      [80.00, 57.00],
      [98.00, 55.00],   // Bratsk
      [108.00, 55.00],  // Ust-Kut
      [120.00, 53.00],
      [130.00, 51.00],  // Komsomolsk
      [140.75, 50.55],  // Sovetskaya Gavan
    ],
  },
  {
    id: 'us-transcontinental', name: 'US Intermodal Corridors (BNSF/UP)', category: 'container',
    volumeMt: 200, status: 'OPERATIONAL',
    path: [
      [-118.20, 33.74],  // LA/Long Beach
      [-114.00, 35.00],  // Mojave
      [-105.00, 39.50],  // Denver
      [-95.00, 39.00],   // Kansas City hub
      [-87.90, 41.97],   // Chicago
      [-73.78, 40.64],   // New York
    ],
  },
  {
    id: 'us-chicago-houston', name: 'US Gulf Coast Corridor', category: 'container',
    volumeMt: 80, status: 'OPERATIONAL',
    path: [
      [-87.90, 41.97],   // Chicago
      [-90.00, 38.00],   // St. Louis
      [-91.00, 33.00],
      [-95.37, 29.76],   // Houston
    ],
  },

  // ── Container Corridors ─────────────────────────────────────────────────
  {
    id: 'eu-rail-corridor-1', name: 'Rhine–Alpine Rail Corridor', category: 'container',
    volumeMt: 100, status: 'OPERATIONAL',
    path: [
      [4.90, 52.37],   // Amsterdam
      [4.48, 51.92],   // Rotterdam
      [6.50, 51.00],   // Ruhr
      [8.68, 50.11],   // Frankfurt
      [8.55, 47.38],   // Zürich
      [9.00, 46.50],   // Gotthard Tunnel
      [8.94, 45.47],   // Milano
      [8.92, 44.41],   // Genoa
    ],
  },
  {
    id: 'eu-rail-corridor-3', name: 'Scandinavian–Mediterranean Corridor', category: 'container',
    volumeMt: 60, status: 'OPERATIONAL',
    path: [
      [24.94, 60.17],  // Helsinki
      [18.06, 59.33],  // Stockholm
      [13.00, 55.60],  // Malmö/Copenhagen
      [10.00, 53.55],  // Hamburg
      [13.40, 52.52],  // Berlin
      [16.37, 48.21],  // Vienna
      [16.61, 46.06],  // Maribor
      [14.51, 46.05],  // Ljubljana
      [14.00, 45.33],  // Rijeka / Koper
    ],
  },
  {
    id: 'india-dfcc', name: 'India DFCC (Dedicated Freight Corridor)', category: 'container',
    volumeMt: 100, status: 'OPERATIONAL',
    path: [
      [72.88, 19.07],   // Mumbai
      [73.00, 22.00],   // Surat
      [75.00, 25.00],   // Udaipur
      [76.85, 28.70],   // Delhi NCR
      [80.95, 26.85],   // Lucknow
      [85.14, 25.61],   // Patna
      [88.37, 22.57],   // Kolkata
    ],
  },
  {
    id: 'japan-tokaido', name: 'Japan Tokaido/Sanyo Shinkansen (freight overlay)', category: 'container',
    volumeMt: 50, status: 'OPERATIONAL',
    path: [
      [139.70, 35.70],  // Tokyo
      [135.50, 34.69],  // Osaka
      [130.40, 33.59],  // Fukuoka
    ],
  },
  {
    id: 'australia-inland-rail', name: 'Inland Rail (Melbourne–Brisbane)', category: 'bulk',
    volumeMt: 15, status: 'UNDER_CONSTRUCTION',
    path: [
      [144.96, -37.81], // Melbourne
      [147.00, -36.00],
      [151.00, -32.00],
      [153.02, -27.47], // Brisbane
    ],
  },

  // ── Energy / Resource Rail ──────────────────────────────────────────────
  {
    id: 'russia-coal-rail', name: 'Siberian Coal Rail (Kuzbass–Ports)', category: 'energy',
    volumeMt: 220, status: 'OPERATIONAL',
    path: [
      [86.00, 54.00],   // Kemerovo / Kuzbass
      [82.90, 54.96],   // Novosibirsk
      [104.30, 52.29],  // Irkutsk
      [131.90, 43.12],  // Vladivostok
    ],
  },
  {
    id: 'wa-coal-rail', name: 'Central QLD Coal Rail (Goonyella system)', category: 'energy',
    volumeMt: 120, status: 'OPERATIONAL',
    path: [
      [148.30, -22.00], // Bowen Basin mines
      [148.90, -21.27], // Hay Point / Dalrymple Bay
    ],
  },
  {
    id: 'wa-mineral-rail', name: 'WA Goldfields/Mineral Rail Network', category: 'bulk',
    volumeMt: 40, status: 'OPERATIONAL',
    path: [
      [121.47, -30.75], // Kalgoorlie
      [118.00, -25.50],
      [116.00, -21.50], // Paraburdoo hub
    ],
  },
];

export const RAIL_CATEGORY_COLOR: Record<RailCategory, string> = {
  bri:       'hsl(28, 95%, 60%)',
  bulk:      'hsl(40, 80%, 50%)',
  container: 'hsl(195, 90%, 60%)',
  energy:    'hsl(15, 85%, 55%)',
};

export const RAIL_CATEGORY_LABEL: Record<RailCategory, string> = {
  bri:       'Belt & Road (BRI)',
  bulk:      'Bulk Commodity Rail',
  container: 'Container Corridor',
  energy:    'Energy / Resource Rail',
};
