/**
 * Static "Bloomberg-style" infrastructure datasets for the 2D map. Hand-curated
 * geographic approximations — recognizable enough that traders see e.g. Druzhba
 * running W from Russia or Marea landing in Spain. Coordinates are [lng, lat]
 * tuples for ergonomic SVG paths.
 *
 * Categories:
 *   • Energy: pipelines, LNG terminals, refineries, oil fields, nuclear, HV grid
 *   • Connectivity: submarine fiber cables, data centers, internet exchanges
 *   • Logistics: ports, airports, naval bases, straits/chokepoints (incl. status)
 *   • Markets: central-bank HQs
 */

export type LngLat = [number, number];
export type LineFeature = {
  id: string;
  name: string;
  category: string;
  capacity?: string;
  status?: 'OPERATIONAL' | 'DAMAGED' | 'OFFLINE' | 'PLANNED';
  path: LngLat[];
};
export type PointFeature = {
  id: string;
  name: string;
  kind: string;
  lat: number;
  lng: number;
  size?: number;
  meta?: string;
  operator?: string;
  country?: string;
  commodity?: string;
  status?: 'OPERATIONAL' | 'OFFLINE' | 'PLANNED' | 'UNDER_CONSTRUCTION' | 'DECOM' | 'BLOCKED' | 'CONGESTED' | 'CLEAR';
};

// ─── Oil & gas pipelines ─────────────────────────────────────────────────────
export const PIPELINES: LineFeature[] = [
  { id: 'druzhba', name: 'Druzhba (Friendship)', category: 'oil', capacity: '1.4 mbpd', status: 'OPERATIONAL',
    path: [[51.7, 53.2], [44.0, 53.0], [38.0, 52.6], [30.5, 52.4], [23.5, 52.1], [19.0, 51.5], [14.6, 51.0], [11.0, 51.3]] },
  { id: 'nordstream1', name: 'Nord Stream 1', category: 'gas', capacity: '55 BCM/yr', status: 'DAMAGED',
    path: [[28.7, 60.0], [25.0, 59.8], [20.0, 58.6], [15.5, 56.0], [13.5, 54.8]] },
  { id: 'nordstream2', name: 'Nord Stream 2', category: 'gas', capacity: '55 BCM/yr', status: 'DAMAGED',
    path: [[28.7, 60.1], [25.0, 59.9], [20.0, 58.7], [15.5, 56.1], [13.5, 54.9]] },
  { id: 'tap', name: 'Trans Adriatic Pipeline', category: 'gas', capacity: '10 BCM/yr', status: 'OPERATIONAL',
    path: [[27.0, 40.6], [23.5, 40.7], [20.5, 40.5], [18.5, 40.3], [16.5, 40.5]] },
  { id: 'tanap', name: 'TANAP', category: 'gas', capacity: '16 BCM/yr', status: 'OPERATIONAL',
    path: [[44.5, 41.0], [41.0, 40.8], [37.0, 40.5], [33.0, 40.2], [29.0, 40.4], [27.0, 40.6]] },
  { id: 'powerofsiberia', name: 'Power of Siberia', category: 'gas', capacity: '38 BCM/yr', status: 'OPERATIONAL',
    path: [[120.0, 62.0], [125.0, 56.0], [128.0, 50.0], [126.5, 45.0], [122.0, 41.8], [116.4, 39.9]] },
  { id: 'keystonexl', name: 'Keystone System', category: 'oil', capacity: '0.83 mbpd', status: 'OPERATIONAL',
    path: [[-110.7, 53.5], [-104.0, 49.0], [-100.5, 44.0], [-96.0, 38.5], [-94.5, 30.0]] },
  { id: 'transalaska', name: 'Trans-Alaska Pipeline', category: 'oil', capacity: '0.5 mbpd', status: 'OPERATIONAL',
    path: [[-148.4, 70.3], [-148.0, 65.0], [-147.5, 60.0], [-149.9, 61.2]] },
  { id: 'eastsib', name: 'ESPO (East Siberia–Pacific)', category: 'oil', capacity: '1.6 mbpd', status: 'OPERATIONAL',
    path: [[80.0, 56.0], [95.0, 56.5], [110.0, 55.0], [125.0, 51.0], [132.7, 42.9]] },
  { id: 'caspianpipe', name: 'Caspian Pipeline Consortium', category: 'oil', capacity: '1.4 mbpd', status: 'OPERATIONAL',
    path: [[51.2, 47.1], [49.0, 46.0], [46.0, 45.5], [42.0, 44.8], [37.6, 44.6]] },
  { id: 'btc', name: 'Baku–Tbilisi–Ceyhan', category: 'oil', capacity: '1.2 mbpd', status: 'OPERATIONAL',
    path: [[49.9, 40.4], [45.0, 41.7], [41.0, 41.6], [37.0, 38.7], [35.8, 36.6]] },
  { id: 'yamal-europe', name: 'Yamal–Europe Pipeline', category: 'gas', capacity: '33 BCM/yr', status: 'OPERATIONAL',
    path: [[55.0, 71.0], [50.0, 65.0], [44.0, 60.0], [38.0, 55.7], [28.0, 53.1], [23.0, 52.4], [16.0, 52.5], [14.0, 52.5], [13.5, 52.4]] },
  { id: 'trans-med', name: 'Trans-Mediterranean (Transmed)', category: 'gas', capacity: '33.5 BCM/yr', status: 'OPERATIONAL',
    path: [[3.0, 36.7], [8.0, 36.5], [12.0, 37.0], [13.7, 37.5], [14.5, 38.1], [15.0, 40.0], [16.0, 41.0]] },
  { id: 'greenstream', name: 'Greenstream (Libya–Italy)', category: 'gas', capacity: '11 BCM/yr', status: 'OPERATIONAL',
    path: [[13.2, 32.9], [12.5, 35.5], [12.0, 37.5], [12.5, 39.0], [13.5, 41.0]] },
  { id: 'medgaz', name: 'Medgaz (Algeria–Spain)', category: 'gas', capacity: '8 BCM/yr', status: 'OPERATIONAL',
    path: [[2.0, 35.8], [0.0, 37.0], [-0.5, 38.0], [-1.0, 39.5], [-3.0, 40.5]] },
  { id: 'opal', name: 'OPAL Pipeline', category: 'gas', capacity: '36 BCM/yr', status: 'OPERATIONAL',
    path: [[13.5, 54.9], [13.4, 52.4], [13.7, 50.8], [12.5, 50.5]] },
  { id: 'baltic-pipe', name: 'Baltic Pipe (Norway–Poland)', category: 'gas', capacity: '10 BCM/yr', status: 'OPERATIONAL',
    path: [[6.5, 57.5], [9.0, 56.0], [11.5, 55.5], [14.5, 55.0], [16.5, 54.5], [18.5, 54.4]] },
  { id: 'scp-south-caucasus', name: 'South Caucasus Pipeline', category: 'gas', capacity: '25 BCM/yr', status: 'OPERATIONAL',
    path: [[49.9, 40.4], [44.0, 41.5], [41.7, 41.7], [39.5, 41.5], [36.5, 40.5]] },
  { id: 'colonial-pipeline', name: 'Colonial Pipeline', category: 'oil', capacity: '2.5 mbpd', status: 'OPERATIONAL',
    path: [[-95.37, 29.76], [-91.50, 32.50], [-84.40, 33.75], [-81.00, 36.00], [-78.50, 38.50], [-75.00, 39.70]] },
  { id: 'enbridge-mainline', name: 'Enbridge Mainline', category: 'oil', capacity: '3.0 mbpd', status: 'OPERATIONAL',
    path: [[-120.50, 55.50], [-110.00, 53.50], [-100.00, 50.00], [-97.00, 46.00], [-93.00, 44.00], [-87.65, 41.90]] },
  { id: 'tapi', name: 'TAPI Pipeline (planned)', category: 'gas', capacity: '33 BCM/yr', status: 'PLANNED',
    path: [[61.80, 38.00], [65.00, 36.00], [66.00, 33.50], [67.50, 30.50], [70.00, 27.00], [74.00, 24.00]] },
  { id: 'east-africa-crude', name: 'EACOP (Uganda–Tanzania)', category: 'oil', capacity: '0.24 mbpd', status: 'UNDER_CONSTRUCTION',
    path: [[31.80, 0.30], [32.50, -2.00], [33.50, -4.00], [36.00, -7.00], [39.50, -9.00]] },
  { id: 'power-siberia-2', name: 'Power of Siberia 2 (planned)', category: 'gas', capacity: '50 BCM/yr', status: 'PLANNED',
    path: [[70.00, 67.00], [80.00, 60.00], [88.00, 53.00], [95.00, 50.00], [98.00, 47.00], [100.00, 42.00], [105.00, 40.00]] },
  { id: 'nigeria-morocco', name: 'Nigeria–Morocco Gas Pipeline (planned)', category: 'gas', capacity: '30 BCM/yr', status: 'PLANNED',
    path: [[3.40, 6.45], [2.00, 13.50], [1.00, 20.00], [0.50, 26.00], [-5.00, 32.00], [-5.80, 35.50]] },
];

// ─── LNG terminals ───────────────────────────────────────────────────────────
export const LNG_TERMINALS: PointFeature[] = [
  { id: 'sabine-pass', name: 'Sabine Pass', kind: 'lng', lat: 29.73, lng: -93.87, size: 5, meta: '30 MTPA · Export', operator: 'Cheniere', country: 'US', status: 'OPERATIONAL' },
  { id: 'corpus-christi', name: 'Corpus Christi', kind: 'lng', lat: 27.83, lng: -97.33, size: 5, meta: '15 MTPA · Export', operator: 'Cheniere', country: 'US', status: 'OPERATIONAL' },
  { id: 'cameron-lng', name: 'Cameron LNG', kind: 'lng', lat: 29.79, lng: -93.32, size: 4, meta: '14.95 MTPA', operator: 'Sempra', country: 'US', status: 'OPERATIONAL' },
  { id: 'freeport-lng', name: 'Freeport LNG', kind: 'lng', lat: 28.95, lng: -95.31, size: 4, meta: '15.3 MTPA', country: 'US', status: 'OPERATIONAL' },
  { id: 'cove-point', name: 'Cove Point', kind: 'lng', lat: 38.39, lng: -76.39, size: 3, meta: '5.25 MTPA', country: 'US', status: 'OPERATIONAL' },
  { id: 'ras-laffan', name: 'Ras Laffan', kind: 'lng', lat: 25.91, lng: 51.60, size: 5, meta: '77 MTPA · World #1', operator: 'QatarEnergy', country: 'QA', status: 'OPERATIONAL' },
  { id: 'yamal-lng', name: 'Yamal LNG', kind: 'lng', lat: 71.27, lng: 72.05, size: 5, meta: '17.4 MTPA · Sanctioned', operator: 'Novatek', country: 'RU', status: 'OPERATIONAL' },
  { id: 'sakhalin-2', name: 'Sakhalin-2 LNG', kind: 'lng', lat: 46.62, lng: 143.03, size: 4, meta: '11.5 MTPA', country: 'RU', status: 'OPERATIONAL' },
  { id: 'gorgon', name: 'Gorgon LNG', kind: 'lng', lat: -20.65, lng: 115.43, size: 4, meta: '15.6 MTPA', operator: 'Chevron', country: 'AU', status: 'OPERATIONAL' },
  { id: 'wheatstone', name: 'Wheatstone', kind: 'lng', lat: -21.65, lng: 115.00, size: 4, meta: '8.9 MTPA', country: 'AU', status: 'OPERATIONAL' },
  { id: 'ichthys', name: 'Ichthys LNG', kind: 'lng', lat: -12.51, lng: 130.83, size: 4, meta: '8.9 MTPA', country: 'AU', status: 'OPERATIONAL' },
  { id: 'bontang', name: 'Bontang', kind: 'lng', lat: 0.13, lng: 117.49, size: 3, meta: '22.5 MTPA', country: 'ID', status: 'OPERATIONAL' },
  { id: 'tangguh', name: 'Tangguh', kind: 'lng', lat: -2.52, lng: 133.06, size: 3, meta: '11.4 MTPA', country: 'ID', status: 'OPERATIONAL' },
  { id: 'plng-bintulu', name: 'Bintulu', kind: 'lng', lat: 3.20, lng: 113.05, size: 4, meta: '29.3 MTPA', country: 'MY', status: 'OPERATIONAL' },
  { id: 'arzew', name: 'Arzew', kind: 'lng', lat: 35.85, lng: -0.32, size: 3, meta: '17.2 MTPA', country: 'DZ', status: 'OPERATIONAL' },
  { id: 'idku', name: 'Idku', kind: 'lng', lat: 31.32, lng: 30.30, size: 3, meta: '7.2 MTPA', country: 'EG', status: 'OPERATIONAL' },
  { id: 'damietta', name: 'Damietta', kind: 'lng', lat: 31.47, lng: 31.74, size: 3, meta: '5.0 MTPA', country: 'EG', status: 'OPERATIONAL' },
  { id: 'zeebrugge', name: 'Zeebrugge', kind: 'lng', lat: 51.34, lng: 3.18, size: 3, meta: '9.0 MTPA · Import', country: 'BE', status: 'OPERATIONAL' },
  { id: 'gate-rotterdam', name: 'Gate Rotterdam', kind: 'lng', lat: 51.96, lng: 4.05, size: 3, meta: '12 MTPA · Import', country: 'NL', status: 'OPERATIONAL' },
  { id: 'wilhelmshaven', name: 'Wilhelmshaven FSRU', kind: 'lng', lat: 53.61, lng: 8.14, size: 3, meta: '7.5 BCM · Import', country: 'DE', status: 'OPERATIONAL' },
  { id: 'futtsu', name: 'Futtsu', kind: 'lng', lat: 35.31, lng: 139.85, size: 3, meta: '10 MTPA · Import', country: 'JP', status: 'OPERATIONAL' },
  { id: 'sodegaura', name: 'Sodegaura', kind: 'lng', lat: 35.43, lng: 140.00, size: 4, meta: '17 MTPA · Import', country: 'JP', status: 'OPERATIONAL' },
  { id: 'incheon-lng', name: 'Incheon', kind: 'lng', lat: 37.40, lng: 126.60, size: 3, meta: '15 MTPA · Import', country: 'KR', status: 'OPERATIONAL' },
  { id: 'calcasieu-pass', name: 'Calcasieu Pass', kind: 'lng', lat: 29.77, lng: -93.34, size: 4, meta: '10 MTPA · Venture Global', operator: 'Venture Global', country: 'US', status: 'OPERATIONAL' },
  { id: 'plaquemines', name: 'Plaquemines LNG', kind: 'lng', lat: 29.42, lng: -89.91, size: 4, meta: '20 MTPA · Venture Global', operator: 'Venture Global', country: 'US', status: 'UNDER_CONSTRUCTION' },
  { id: 'golden-pass', name: 'Golden Pass LNG', kind: 'lng', lat: 29.87, lng: -93.89, size: 4, meta: '16 MTPA · QatarEnergy/ExxonMobil', operator: 'QatarEnergy', country: 'US', status: 'UNDER_CONSTRUCTION' },
  { id: 'port-arthur-lng', name: 'Port Arthur LNG', kind: 'lng', lat: 29.86, lng: -93.92, size: 4, meta: '13.5 MTPA · Sempra', operator: 'Sempra', country: 'US', status: 'PLANNED' },
  { id: 'rio-grande-lng', name: 'Rio Grande LNG', kind: 'lng', lat: 26.06, lng: -97.15, size: 3, meta: '27 MTPA · NextDecade', country: 'US', status: 'PLANNED' },
  { id: 'lake-charles-lng', name: 'Lake Charles LNG', kind: 'lng', lat: 30.18, lng: -93.22, size: 3, meta: '16.45 MTPA · Energy Transfer', country: 'US', status: 'PLANNED' },
  { id: 'elba-island', name: 'Elba Island', kind: 'lng', lat: 31.98, lng: -80.96, size: 3, meta: '2.5 MTPA · Shell', operator: 'Shell', country: 'US', status: 'OPERATIONAL' },
  { id: 'rovigo', name: 'Adriatic LNG (Rovigo)', kind: 'lng', lat: 44.85, lng: 12.68, size: 3, meta: '8 MTPA · ExxonMobil/QatarEnergy', country: 'IT', status: 'OPERATIONAL' },
  { id: 'elengy-dunkerque', name: 'Dunkerque LNG', kind: 'lng', lat: 51.03, lng: 2.37, size: 3, meta: '13 MTPA · Import', country: 'FR', status: 'OPERATIONAL' },
  { id: 'montoir', name: 'Montoir LNG', kind: 'lng', lat: 47.32, lng: -2.23, size: 3, meta: '10 MTPA · Import', country: 'FR', status: 'OPERATIONAL' },
  { id: 'fsru-turkey', name: 'Marmara Ereğlisi FSRU', kind: 'lng', lat: 40.98, lng: 27.96, size: 3, meta: '6 BCM · Import', country: 'TR', status: 'OPERATIONAL' },
  { id: 'tianjin-lng', name: 'Tianjin LNG', kind: 'lng', lat: 38.99, lng: 117.78, size: 4, meta: '6 MTPA · CNOOC', operator: 'CNOOC', country: 'CN', status: 'OPERATIONAL' },
  { id: 'zhuhai-lng', name: 'Zhuhai LNG', kind: 'lng', lat: 22.02, lng: 113.52, size: 3, meta: '3.5 MTPA · CNOOC', country: 'CN', status: 'OPERATIONAL' },
  { id: 'papua-png', name: 'PNG LNG', kind: 'lng', lat: -8.89, lng: 144.82, size: 4, meta: '8.5 MTPA · ExxonMobil', operator: 'ExxonMobil', country: 'PG', status: 'OPERATIONAL' },
  { id: 'coral-sul-moz', name: 'Coral Sul FLNG', kind: 'lng', lat: -11.96, lng: 40.63, size: 4, meta: '3.4 MTPA · Eni · Mozambique first', operator: 'Eni', country: 'MZ', status: 'OPERATIONAL' },
  { id: 'adnoc-das', name: 'ADNOC Das Island LNG', kind: 'lng', lat: 25.14, lng: 52.87, size: 3, meta: '5.8 MTPA · ADNOC', operator: 'ADNOC', country: 'AE', status: 'OPERATIONAL' },
  { id: 'qatar-expansion', name: 'North Field Expansion', kind: 'lng', lat: 25.78, lng: 51.48, size: 5, meta: '126 MTPA (2027) · +49 MTPA', operator: 'QatarEnergy', country: 'QA', status: 'UNDER_CONSTRUCTION' },
  { id: 'arctic-2-lng', name: 'Arctic LNG 2', kind: 'lng', lat: 71.53, lng: 68.81, size: 4, meta: '19.8 MTPA · Sanctioned', operator: 'Novatek', country: 'RU', status: 'UNDER_CONSTRUCTION' },
];

// ─── Refineries ──────────────────────────────────────────────────────────────
export const REFINERIES: PointFeature[] = [
  { id: 'jamnagar', name: 'Jamnagar', kind: 'refinery', lat: 22.36, lng: 69.84, size: 5, meta: '1.24 mbpd · World #1', operator: 'Reliance', country: 'IN', status: 'OPERATIONAL' },
  { id: 'ulsan', name: 'Ulsan', kind: 'refinery', lat: 35.50, lng: 129.36, size: 5, meta: '0.84 mbpd', operator: 'SK Energy', country: 'KR', status: 'OPERATIONAL' },
  { id: 'paraguana', name: 'Paraguaná Complex', kind: 'refinery', lat: 11.70, lng: -70.20, size: 4, meta: '0.96 mbpd', operator: 'PDVSA', country: 'VE', status: 'OPERATIONAL' },
  { id: 'port-arthur', name: 'Port Arthur', kind: 'refinery', lat: 29.86, lng: -93.95, size: 5, meta: '0.63 mbpd', operator: 'Motiva', country: 'US', status: 'OPERATIONAL' },
  { id: 'baytown', name: 'Baytown', kind: 'refinery', lat: 29.74, lng: -94.97, size: 5, meta: '0.59 mbpd', operator: 'ExxonMobil', country: 'US', status: 'OPERATIONAL' },
  { id: 'galveston-bay', name: 'Galveston Bay', kind: 'refinery', lat: 29.37, lng: -94.93, size: 4, meta: '0.59 mbpd', operator: 'Marathon', country: 'US', status: 'OPERATIONAL' },
  { id: 'garyville', name: 'Garyville', kind: 'refinery', lat: 30.04, lng: -90.62, size: 4, meta: '0.59 mbpd', operator: 'Marathon', country: 'US', status: 'OPERATIONAL' },
  { id: 'baton-rouge', name: 'Baton Rouge', kind: 'refinery', lat: 30.50, lng: -91.20, size: 4, meta: '0.50 mbpd', operator: 'ExxonMobil', country: 'US', status: 'OPERATIONAL' },
  { id: 'ras-tanura', name: 'Ras Tanura', kind: 'refinery', lat: 26.65, lng: 50.16, size: 5, meta: '0.55 mbpd', operator: 'Saudi Aramco', country: 'SA', status: 'OPERATIONAL' },
  { id: 'ruwais', name: 'Ruwais', kind: 'refinery', lat: 24.10, lng: 52.73, size: 5, meta: '0.92 mbpd', operator: 'ADNOC', country: 'AE', status: 'OPERATIONAL' },
  { id: 'mailiao', name: 'Mailiao', kind: 'refinery', lat: 23.79, lng: 120.18, size: 5, meta: '0.54 mbpd', operator: 'Formosa', country: 'TW', status: 'OPERATIONAL' },
  { id: 'singapore-jurong', name: 'Jurong', kind: 'refinery', lat: 1.27, lng: 103.70, size: 5, meta: '0.59 mbpd', operator: 'ExxonMobil', country: 'SG', status: 'OPERATIONAL' },
  { id: 'rotterdam-pernis', name: 'Pernis', kind: 'refinery', lat: 51.88, lng: 4.39, size: 4, meta: '0.40 mbpd', operator: 'Shell', country: 'NL', status: 'OPERATIONAL' },
  { id: 'antwerp-ref', name: 'Antwerp', kind: 'refinery', lat: 51.27, lng: 4.30, size: 4, meta: '0.34 mbpd', operator: 'TotalEnergies', country: 'BE', status: 'OPERATIONAL' },
  { id: 'leuna', name: 'Leuna', kind: 'refinery', lat: 51.32, lng: 12.00, size: 3, meta: '0.24 mbpd', operator: 'TotalEnergies', country: 'DE', status: 'OPERATIONAL' },
  { id: 'novocherkassk', name: 'Novocherkassk', kind: 'refinery', lat: 47.46, lng: 40.10, size: 3, meta: 'Sanctioned', country: 'RU', status: 'OPERATIONAL' },
  { id: 'omsk-ref', name: 'Omsk', kind: 'refinery', lat: 54.94, lng: 73.39, size: 4, meta: '0.42 mbpd', operator: 'Gazprom Neft', country: 'RU', status: 'OPERATIONAL' },
];

// ─── Oil & gas fields ────────────────────────────────────────────────────────
export const OIL_FIELDS: PointFeature[] = [
  { id: 'ghawar', name: 'Ghawar', kind: 'oilfield', lat: 25.43, lng: 49.62, size: 5, meta: '~3.8 mbpd · Largest', country: 'SA', commodity: 'oil', status: 'OPERATIONAL' },
  { id: 'safaniya', name: 'Safaniya', kind: 'oilfield', lat: 28.00, lng: 49.00, size: 4, meta: '~1.5 mbpd · Offshore', country: 'SA', commodity: 'oil', status: 'OPERATIONAL' },
  { id: 'burgan', name: 'Burgan', kind: 'oilfield', lat: 28.95, lng: 47.95, size: 5, meta: '~1.7 mbpd', country: 'KW', commodity: 'oil', status: 'OPERATIONAL' },
  { id: 'rumaila', name: 'Rumaila', kind: 'oilfield', lat: 30.50, lng: 47.20, size: 4, meta: '~1.4 mbpd', country: 'IQ', commodity: 'oil', status: 'OPERATIONAL' },
  { id: 'permian', name: 'Permian Basin', kind: 'oilfield', lat: 32.00, lng: -102.50, size: 5, meta: '~6.0 mbpd · Shale', country: 'US', commodity: 'oil', status: 'OPERATIONAL' },
  { id: 'bakken', name: 'Bakken', kind: 'oilfield', lat: 47.80, lng: -103.30, size: 4, meta: '~1.2 mbpd · Shale', country: 'US', commodity: 'oil', status: 'OPERATIONAL' },
  { id: 'eagle-ford', name: 'Eagle Ford', kind: 'oilfield', lat: 28.80, lng: -98.50, size: 4, meta: '~1.1 mbpd · Shale', country: 'US', commodity: 'oil', status: 'OPERATIONAL' },
  { id: 'vaca-muerta', name: 'Vaca Muerta', kind: 'oilfield', lat: -38.80, lng: -69.20, size: 4, meta: '~0.4 mbpd · Shale', country: 'AR', commodity: 'oil', status: 'OPERATIONAL' },
  { id: 'tengiz', name: 'Tengiz', kind: 'oilfield', lat: 46.10, lng: 53.50, size: 4, meta: '~0.7 mbpd', country: 'KZ', commodity: 'oil', status: 'OPERATIONAL' },
  { id: 'kashagan', name: 'Kashagan', kind: 'oilfield', lat: 46.10, lng: 51.30, size: 4, meta: '~0.4 mbpd · Offshore', country: 'KZ', commodity: 'oil', status: 'OPERATIONAL' },
  { id: 'samotlor', name: 'Samotlor', kind: 'oilfield', lat: 60.85, lng: 76.78, size: 4, meta: '~0.4 mbpd', country: 'RU', commodity: 'oil', status: 'OPERATIONAL' },
  { id: 'bovanenkovo', name: 'Bovanenkovo', kind: 'oilfield', lat: 70.40, lng: 68.40, size: 4, meta: '115 BCM/yr · Gas', country: 'RU', commodity: 'gas', status: 'OPERATIONAL' },
  { id: 'troll', name: 'Troll', kind: 'oilfield', lat: 60.65, lng: 3.70, size: 4, meta: 'Largest gas in NCS', country: 'NO', commodity: 'gas', status: 'OPERATIONAL' },
  { id: 'johan-sverdrup', name: 'Johan Sverdrup', kind: 'oilfield', lat: 58.85, lng: 2.50, size: 4, meta: '~0.72 mbpd', country: 'NO', commodity: 'oil', status: 'OPERATIONAL' },
  { id: 'lula', name: 'Lula (Tupi)', kind: 'oilfield', lat: -25.50, lng: -42.80, size: 4, meta: '~1.0 mbpd · Pre-salt', country: 'BR', commodity: 'oil', status: 'OPERATIONAL' },
  { id: 'guyana-stabroek', name: 'Stabroek Block', kind: 'oilfield', lat: 8.30, lng: -57.50, size: 4, meta: '~0.65 mbpd · ExxonMobil', country: 'GY', commodity: 'oil', status: 'OPERATIONAL' },
  { id: 'north-field', name: 'North Field', kind: 'oilfield', lat: 26.30, lng: 51.95, size: 5, meta: 'Largest gas field', country: 'QA', commodity: 'gas', status: 'OPERATIONAL' },
];

// ─── Mines & commodity sites ─────────────────────────────────────────────────
export const MINES: PointFeature[] = [
  { id: 'escondida', name: 'Escondida', kind: 'mine', lat: -24.27, lng: -69.07, size: 5, meta: '~1.1 Mt Cu/yr', operator: 'BHP', country: 'CL', commodity: 'copper', status: 'OPERATIONAL' },
  { id: 'collahuasi', name: 'Collahuasi', kind: 'mine', lat: -20.97, lng: -68.68, size: 4, meta: '0.63 Mt Cu/yr', country: 'CL', commodity: 'copper', status: 'OPERATIONAL' },
  { id: 'grasberg', name: 'Grasberg', kind: 'mine', lat: -4.06, lng: 137.12, size: 5, meta: 'Cu+Au · Freeport', country: 'ID', commodity: 'copper', status: 'OPERATIONAL' },
  { id: 'oyu-tolgoi', name: 'Oyu Tolgoi', kind: 'mine', lat: 43.00, lng: 106.85, size: 4, meta: 'Cu+Au · Rio Tinto', country: 'MN', commodity: 'copper', status: 'OPERATIONAL' },
  { id: 'kamoa-kakula', name: 'Kamoa-Kakula', kind: 'mine', lat: -10.75, lng: 25.42, size: 4, meta: '0.45 Mt Cu/yr', country: 'CD', commodity: 'copper', status: 'OPERATIONAL' },
  { id: 'salar-atacama', name: 'Salar de Atacama', kind: 'mine', lat: -23.50, lng: -68.25, size: 5, meta: 'Lithium brine · SQM/Albemarle', country: 'CL', commodity: 'lithium', status: 'OPERATIONAL' },
  { id: 'greenbushes', name: 'Greenbushes', kind: 'mine', lat: -33.85, lng: 116.06, size: 5, meta: 'Largest hard-rock Li', country: 'AU', commodity: 'lithium', status: 'OPERATIONAL' },
  { id: 'salar-uyuni', name: 'Salar de Uyuni', kind: 'mine', lat: -20.13, lng: -67.49, size: 4, meta: 'Largest Li reserve', country: 'BO', commodity: 'lithium', status: 'PLANNED' },
  { id: 'olympic-dam', name: 'Olympic Dam', kind: 'mine', lat: -30.44, lng: 136.88, size: 4, meta: 'U+Cu+Au · BHP', country: 'AU', commodity: 'uranium', status: 'OPERATIONAL' },
  { id: 'cigar-lake', name: 'Cigar Lake', kind: 'mine', lat: 58.05, lng: -104.50, size: 4, meta: 'Highest-grade U', country: 'CA', commodity: 'uranium', status: 'OPERATIONAL' },
  { id: 'mirny', name: 'Mirny', kind: 'mine', lat: 62.53, lng: 113.99, size: 3, meta: 'Diamond · Alrosa', country: 'RU', commodity: 'diamond', status: 'OPERATIONAL' },
  { id: 'witwatersrand', name: 'Witwatersrand Basin', kind: 'mine', lat: -26.20, lng: 27.85, size: 5, meta: 'Au · Historic #1', country: 'ZA', commodity: 'gold', status: 'OPERATIONAL' },
  { id: 'muruntau', name: 'Muruntau', kind: 'mine', lat: 41.50, lng: 64.58, size: 5, meta: 'Largest Au open-pit', country: 'UZ', commodity: 'gold', status: 'OPERATIONAL' },
  { id: 'carlin', name: 'Carlin Trend', kind: 'mine', lat: 40.90, lng: -116.10, size: 4, meta: 'Au · Nevada', country: 'US', commodity: 'gold', status: 'OPERATIONAL' },
  { id: 'bayan-obo', name: 'Bayan Obo', kind: 'mine', lat: 41.77, lng: 109.97, size: 5, meta: 'World #1 REE', country: 'CN', commodity: 'rare-earth', status: 'OPERATIONAL' },
  { id: 'mountain-pass', name: 'Mountain Pass', kind: 'mine', lat: 35.48, lng: -115.53, size: 4, meta: 'REE · MP Materials', country: 'US', commodity: 'rare-earth', status: 'OPERATIONAL' },
  { id: 'norilsk', name: 'Norilsk', kind: 'mine', lat: 69.35, lng: 88.20, size: 5, meta: 'Ni+Pd · Nornickel', country: 'RU', commodity: 'nickel', status: 'OPERATIONAL' },
  { id: 'sudbury', name: 'Sudbury', kind: 'mine', lat: 46.50, lng: -81.00, size: 4, meta: 'Ni+Cu', country: 'CA', commodity: 'nickel', status: 'OPERATIONAL' },
  { id: 'pilbara', name: 'Pilbara', kind: 'mine', lat: -22.50, lng: 118.50, size: 5, meta: 'Iron ore · BHP/Rio/FMG', country: 'AU', commodity: 'iron', status: 'OPERATIONAL' },
  { id: 'carajas', name: 'Carajás', kind: 'mine', lat: -6.10, lng: -50.10, size: 5, meta: 'Iron ore · Vale', country: 'BR', commodity: 'iron', status: 'OPERATIONAL' },
];

// ─── Submarine fiber cables ──────────────────────────────────────────────────
export const FIBER_CABLES: LineFeature[] = [
  { id: 'marea', name: 'MAREA', category: 'fiber', capacity: '224 Tbps', status: 'OPERATIONAL',
    path: [[-75.5, 36.8], [-60, 36], [-40, 38], [-20, 41], [-9.4, 43.4]] },
  { id: 'grace-hopper', name: 'Grace Hopper', category: 'fiber', capacity: '352 Tbps', status: 'OPERATIONAL',
    path: [[-74.0, 40.5], [-55, 42], [-30, 45], [-10, 47], [-5.5, 50.1]] },
  { id: '2africa', name: '2Africa', category: 'fiber', capacity: '180 Tbps', status: 'OPERATIONAL',
    path: [[-9.1, 38.7], [-6, 36], [-2, 35], [3, 35], [10, 33], [20, 31], [32, 31], [43, 12], [50, 1], [55, -10], [40, -25], [25, -33], [18, -33], [14, 0], [-2, 6], [-17.5, 14.7]] },
  { id: 'sea-me-we-6', name: 'SEA-ME-WE-6', category: 'fiber', capacity: '100 Tbps', status: 'OPERATIONAL',
    path: [[103.8, 1.3], [80, 8], [73, 12], [55, 13], [43, 12], [38, 22], [32.5, 31.2]] },
  { id: 'jupiter', name: 'JUPITER', category: 'fiber', capacity: '400 Tbps', status: 'OPERATIONAL',
    path: [[-118.4, 33.7], [-145, 28], [-170, 25], [165, 30], [149, 35.5], [139.7, 35.5]] },
  { id: 'echo', name: 'Echo', category: 'fiber', capacity: '144 Tbps', status: 'OPERATIONAL',
    path: [[-122.0, 37.4], [-160, 22], [175, 5], [150, -5], [125, 0], [106.8, -6.2]] },
  { id: 'amitie', name: 'Amitié', category: 'fiber', capacity: '400 Tbps', status: 'OPERATIONAL',
    path: [[-71.5, 41.6], [-50, 42], [-25, 43], [-5, 45], [-1.7, 49.3]] },
];

// ─── Power grid: nuclear plants & HV interconnects ──────────────────────────
export const NUCLEAR: PointFeature[] = [
  { id: 'kashiwazaki', name: 'Kashiwazaki-Kariwa', kind: 'nuclear', lat: 37.43, lng: 138.6, size: 5, meta: '7965 MW', country: 'JP', status: 'OPERATIONAL' },
  { id: 'bruce', name: 'Bruce', kind: 'nuclear', lat: 44.32, lng: -81.6, size: 5, meta: '6232 MW', country: 'CA', status: 'OPERATIONAL' },
  { id: 'zaporizhzhia', name: 'Zaporizhzhia', kind: 'nuclear', lat: 47.51, lng: 34.58, size: 5, meta: '5700 MW · OFFLINE', country: 'UA', status: 'OFFLINE' },
  { id: 'hanul', name: 'Hanul', kind: 'nuclear', lat: 37.09, lng: 129.38, size: 4, meta: '5928 MW', country: 'KR', status: 'OPERATIONAL' },
  { id: 'gravelines', name: 'Gravelines', kind: 'nuclear', lat: 50.99, lng: 2.13, size: 4, meta: '5460 MW', country: 'FR', status: 'OPERATIONAL' },
  { id: 'paluel', name: 'Paluel', kind: 'nuclear', lat: 49.86, lng: 0.63, size: 4, meta: '5320 MW', country: 'FR', status: 'OPERATIONAL' },
  { id: 'cattenom', name: 'Cattenom', kind: 'nuclear', lat: 49.42, lng: 6.22, size: 4, meta: '5200 MW', country: 'FR', status: 'OPERATIONAL' },
  { id: 'taishan', name: 'Taishan', kind: 'nuclear', lat: 21.92, lng: 112.98, size: 4, meta: '3500 MW', country: 'CN', status: 'OPERATIONAL' },
  { id: 'palo-verde', name: 'Palo Verde', kind: 'nuclear', lat: 33.39, lng: -112.86, size: 4, meta: '3937 MW', country: 'US', status: 'OPERATIONAL' },
  { id: 'olkiluoto', name: 'Olkiluoto', kind: 'nuclear', lat: 61.24, lng: 21.44, size: 3, meta: '4400 MW', country: 'FI', status: 'OPERATIONAL' },
  { id: 'isar', name: 'Isar', kind: 'nuclear', lat: 48.61, lng: 12.29, size: 2, meta: 'OFFLINE 2023', country: 'DE', status: 'OFFLINE' },
  { id: 'fukushima', name: 'Fukushima Daiichi', kind: 'nuclear', lat: 37.42, lng: 141.03, size: 3, meta: 'DECOM', country: 'JP', status: 'DECOM' },
  { id: 'vogtle', name: 'Vogtle 3&4', kind: 'nuclear', lat: 33.14, lng: -81.76, size: 4, meta: '2200 MW · AP1000 · First new US plant since 1978', country: 'US', status: 'OPERATIONAL' },
  { id: 'hinkley-c', name: 'Hinkley Point C', kind: 'nuclear', lat: 51.22, lng: -3.13, size: 4, meta: '3200 MW · EDF/CGNPC · Under construction', country: 'GB', status: 'UNDER_CONSTRUCTION' },
  { id: 'tianwan', name: 'Tianwan', kind: 'nuclear', lat: 34.82, lng: 119.46, size: 5, meta: '6660 MW + expansion', country: 'CN', status: 'OPERATIONAL' },
  { id: 'hongyanhe', name: 'Hongyanhe', kind: 'nuclear', lat: 40.67, lng: 121.71, size: 4, meta: '4466 MW', country: 'CN', status: 'OPERATIONAL' },
  { id: 'qinshan', name: 'Qinshan complex', kind: 'nuclear', lat: 30.44, lng: 120.95, size: 4, meta: '6600 MW · 9 units', country: 'CN', status: 'OPERATIONAL' },
  { id: 'yangjiang', name: 'Yangjiang', kind: 'nuclear', lat: 21.71, lng: 111.97, size: 4, meta: '3500 MW', country: 'CN', status: 'OPERATIONAL' },
  { id: 'barakah', name: 'Barakah', kind: 'nuclear', lat: 23.93, lng: 52.22, size: 5, meta: '5600 MW · Arab world first · KEPCO', country: 'AE', status: 'OPERATIONAL' },
  { id: 'bushehr', name: 'Bushehr', kind: 'nuclear', lat: 28.83, lng: 50.90, size: 3, meta: '1000 MW · Rosatom · Iran', country: 'IR', status: 'OPERATIONAL' },
  { id: 'cernavoda', name: 'Cernavodă', kind: 'nuclear', lat: 44.33, lng: 28.06, size: 3, meta: '1310 MW · CANDU · Romania', country: 'RO', status: 'OPERATIONAL' },
  { id: 'ringhals', name: 'Ringhals', kind: 'nuclear', lat: 57.27, lng: 12.10, size: 4, meta: '2000 MW · Sweden', country: 'SE', status: 'OPERATIONAL' },
  { id: 'temelin', name: 'Temelín', kind: 'nuclear', lat: 49.22, lng: 14.37, size: 3, meta: '2160 MW · Czech', country: 'CZ', status: 'OPERATIONAL' },
  { id: 'akkuyu', name: 'Akkuyu', kind: 'nuclear', lat: 36.14, lng: 33.54, size: 4, meta: '4800 MW · Rosatom · First Turkish plant', country: 'TR', status: 'UNDER_CONSTRUCTION' },
  { id: 'kudankulam', name: 'Kudankulam', kind: 'nuclear', lat: 8.17, lng: 77.71, size: 4, meta: '2000 MW + 4000 MW planned · Rosatom', country: 'IN', status: 'OPERATIONAL' },
  { id: 'rooppur', name: 'Rooppur', kind: 'nuclear', lat: 24.06, lng: 89.05, size: 3, meta: '2400 MW · Bangladesh · Rosatom', country: 'BD', status: 'UNDER_CONSTRUCTION' },
  { id: 'paks', name: 'Paks II', kind: 'nuclear', lat: 46.57, lng: 18.86, size: 3, meta: '2400 MW expansion · Rosatom · Hungary', country: 'HU', status: 'PLANNED' },
];

export const HV_INTERCONNECTS: LineFeature[] = [
  { id: 'norned', name: 'NorNed HVDC', category: 'hv', capacity: '700 MW', status: 'OPERATIONAL',
    path: [[5.7, 58.7], [5.0, 56.5], [5.7, 53.5], [6.8, 53.4]] },
  { id: 'nordlink', name: 'NordLink', category: 'hv', capacity: '1400 MW', status: 'OPERATIONAL',
    path: [[6.6, 58.3], [7.0, 56.0], [8.0, 54.5]] },
  { id: 'ifa2', name: 'IFA2', category: 'hv', capacity: '1000 MW', status: 'OPERATIONAL',
    path: [[-1.65, 49.65], [-1.4, 50.7], [-1.3, 50.9]] },
  { id: 'viking', name: 'Viking Link', category: 'hv', capacity: '1400 MW', status: 'OPERATIONAL',
    path: [[8.4, 55.5], [4.0, 54.0], [0.3, 53.6]] },
  { id: 'estlink', name: 'EstLink 1+2', category: 'hv', capacity: '1016 MW', status: 'OPERATIONAL',
    path: [[24.7, 59.4], [25.0, 60.2]] },
  { id: 'baltic-cable', name: 'Baltic Cable', category: 'hv', capacity: '600 MW', status: 'OPERATIONAL',
    path: [[12.9, 55.4], [13.6, 55.6], [14.2, 55.6]] },
  { id: 'pacific-dc', name: 'Pacific DC Intertie', category: 'hv', capacity: '3100 MW', status: 'OPERATIONAL',
    path: [[-119.7, 45.6], [-119.0, 42.0], [-118.4, 34.05]] },
  { id: 'britned', name: 'BritNed HVDC', category: 'hv', capacity: '1000 MW', status: 'OPERATIONAL',
    path: [[-1.5, 51.5], [3.0, 52.5], [4.5, 51.9]] },
  { id: 'nemo', name: 'Nemo Link (UK–BE)', category: 'hv', capacity: '1000 MW', status: 'OPERATIONAL',
    path: [[-1.5, 51.0], [2.2, 51.2], [2.9, 51.3]] },
  { id: 'eleclink', name: 'ElecLink (UK–FR)', category: 'hv', capacity: '1000 MW', status: 'OPERATIONAL',
    path: [[1.25, 51.10], [1.55, 50.95]] },
  { id: 'ewic', name: 'EWIC (UK–Ireland)', category: 'hv', capacity: '500 MW', status: 'OPERATIONAL',
    path: [[-3.20, 53.40], [-5.10, 54.00], [-6.20, 53.60]] },
  { id: 'celtic', name: 'Celtic Interconnector (IE–FR, planned)', category: 'hv', capacity: '700 MW', status: 'PLANNED',
    path: [[-8.40, 51.90], [-6.00, 49.50], [-4.50, 48.00], [-2.00, 47.50]] },
  { id: 'suedlink', name: 'SuedLink (North–South Germany)', category: 'hv', capacity: '4000 MW', status: 'UNDER_CONSTRUCTION',
    path: [[8.50, 54.00], [9.00, 52.50], [9.50, 50.00], [9.80, 48.50]] },
  { id: 'suedostlink', name: 'SuedOstLink (Germany)', category: 'hv', capacity: '2000 MW', status: 'UNDER_CONSTRUCTION',
    path: [[13.00, 54.00], [13.50, 51.50], [12.50, 50.00], [11.50, 49.00]] },
  { id: 'greenconnector', name: 'Hansa PowerBridge (DE–SE)', category: 'hv', capacity: '700 MW', status: 'PLANNED',
    path: [[13.50, 54.50], [15.00, 55.50], [16.00, 56.00], [18.00, 57.00]] },
  { id: 'eurasian-hvdc', name: 'Kazakhstan–Russia HVDC', category: 'hv', capacity: '1200 MW', status: 'OPERATIONAL',
    path: [[51.20, 51.20], [55.00, 53.00], [60.00, 56.00]] },
  { id: 'neptune', name: 'Neptune (UK–NL, planned)', category: 'hv', capacity: '1400 MW', status: 'PLANNED',
    path: [[-0.50, 53.00], [2.50, 53.50], [5.00, 53.00]] },
  { id: 'morocco-spain', name: 'Morocco–Spain HVDC', category: 'hv', capacity: '1400 MW', status: 'OPERATIONAL',
    path: [[-5.90, 35.80], [-5.50, 36.20]] },
];

// ─── Ports & airports ────────────────────────────────────────────────────────
export const PORTS: PointFeature[] = [
  { id: 'shanghai', name: 'Shanghai', kind: 'port', lat: 31.22, lng: 121.5, size: 5, meta: '47.3M TEU', country: 'CN' },
  { id: 'singapore', name: 'Singapore', kind: 'port', lat: 1.27, lng: 103.85, size: 5, meta: '37.3M TEU', country: 'SG' },
  { id: 'ningbo', name: 'Ningbo-Zhoushan', kind: 'port', lat: 29.87, lng: 121.55, size: 5, meta: '33.5M TEU', country: 'CN' },
  { id: 'shenzhen', name: 'Shenzhen', kind: 'port', lat: 22.55, lng: 113.92, size: 5, meta: '28.8M TEU', country: 'CN' },
  { id: 'qingdao', name: 'Qingdao', kind: 'port', lat: 36.07, lng: 120.32, size: 5, meta: '24.0M TEU', country: 'CN' },
  { id: 'busan', name: 'Busan', kind: 'port', lat: 35.10, lng: 129.04, size: 5, meta: '22.7M TEU', country: 'KR' },
  { id: 'rotterdam', name: 'Rotterdam', kind: 'port', lat: 51.92, lng: 4.48, size: 5, meta: '13.4M TEU', country: 'NL' },
  { id: 'dubai', name: 'Jebel Ali', kind: 'port', lat: 25.00, lng: 55.05, size: 4, meta: '14.4M TEU', country: 'AE' },
  { id: 'la', name: 'Los Angeles', kind: 'port', lat: 33.74, lng: -118.27, size: 4, meta: '9.9M TEU', country: 'US' },
  { id: 'longbeach', name: 'Long Beach', kind: 'port', lat: 33.75, lng: -118.21, size: 4, meta: '8.1M TEU', country: 'US' },
  { id: 'newyork-nj', name: 'NY/NJ', kind: 'port', lat: 40.66, lng: -74.05, size: 4, meta: '8.6M TEU', country: 'US' },
  { id: 'hamburg', name: 'Hamburg', kind: 'port', lat: 53.55, lng: 9.99, size: 4, meta: '8.3M TEU', country: 'DE' },
  { id: 'antwerp', name: 'Antwerp', kind: 'port', lat: 51.22, lng: 4.40, size: 4, meta: '12.0M TEU', country: 'BE' },
  { id: 'savannah', name: 'Savannah', kind: 'port', lat: 32.08, lng: -81.10, size: 3, meta: '5.5M TEU', country: 'US' },
  { id: 'mumbai', name: 'JNPT Mumbai', kind: 'port', lat: 18.95, lng: 72.95, size: 3, meta: '6.4M TEU', country: 'IN' },
  { id: 'santos', name: 'Santos', kind: 'port', lat: -23.99, lng: -46.30, size: 3, meta: '4.8M TEU', country: 'BR' },
];

export const AIRPORTS: PointFeature[] = [
  { id: 'atl', name: 'Atlanta ATL', kind: 'airport', lat: 33.64, lng: -84.43, size: 5, meta: '93.7M pax', country: 'US' },
  { id: 'dxb', name: 'Dubai DXB', kind: 'airport', lat: 25.25, lng: 55.36, size: 5, meta: '87.0M pax', country: 'AE' },
  { id: 'hnd', name: 'Tokyo HND', kind: 'airport', lat: 35.55, lng: 139.78, size: 5, meta: '79.0M pax', country: 'JP' },
  { id: 'lhr', name: 'London LHR', kind: 'airport', lat: 51.47, lng: -0.45, size: 5, meta: '79.2M pax', country: 'UK' },
  { id: 'pek', name: 'Beijing PEK', kind: 'airport', lat: 40.08, lng: 116.58, size: 5, meta: '67.0M pax', country: 'CN' },
  { id: 'lax', name: 'Los Angeles LAX', kind: 'airport', lat: 33.94, lng: -118.40, size: 4, meta: '75.0M pax', country: 'US' },
  { id: 'ord', name: 'Chicago ORD', kind: 'airport', lat: 41.97, lng: -87.90, size: 4, meta: '73.9M pax', country: 'US' },
  { id: 'cdg', name: 'Paris CDG', kind: 'airport', lat: 49.01, lng: 2.55, size: 4, meta: '67.4M pax', country: 'FR' },
  { id: 'dfw', name: 'Dallas DFW', kind: 'airport', lat: 32.90, lng: -97.04, size: 4, meta: '81.7M pax', country: 'US' },
  { id: 'fra', name: 'Frankfurt FRA', kind: 'airport', lat: 50.04, lng: 8.56, size: 4, meta: '59.4M pax', country: 'DE' },
  { id: 'icn', name: 'Seoul ICN', kind: 'airport', lat: 37.46, lng: 126.44, size: 4, meta: '56.3M pax', country: 'KR' },
  { id: 'sin', name: 'Singapore SIN', kind: 'airport', lat: 1.36, lng: 103.99, size: 4, meta: '58.9M pax', country: 'SG' },
  { id: 'ams', name: 'Amsterdam AMS', kind: 'airport', lat: 52.31, lng: 4.76, size: 4, meta: '61.9M pax', country: 'NL' },
  { id: 'hkg', name: 'Hong Kong HKG', kind: 'airport', lat: 22.31, lng: 113.91, size: 4, meta: '53.0M pax', country: 'HK' },
  { id: 'jfk', name: 'New York JFK', kind: 'airport', lat: 40.64, lng: -73.78, size: 4, meta: '62.5M pax', country: 'US' },
];

// ─── Data centers & internet exchanges ───────────────────────────────────────
export const DATA_CENTERS: PointFeature[] = [
  { id: 'aws-us-east-1', name: 'AWS us-east-1', kind: 'datacenter', lat: 39.04, lng: -77.49, size: 5, meta: 'Ashburn VA · Largest', operator: 'AWS', country: 'US' },
  { id: 'aws-us-west-2', name: 'AWS us-west-2', kind: 'datacenter', lat: 45.84, lng: -119.71, size: 4, meta: 'Oregon', operator: 'AWS', country: 'US' },
  { id: 'aws-eu-west-1', name: 'AWS eu-west-1', kind: 'datacenter', lat: 53.41, lng: -8.24, size: 4, meta: 'Ireland', operator: 'AWS', country: 'IE' },
  { id: 'aws-ap-northeast-1', name: 'AWS ap-northeast-1', kind: 'datacenter', lat: 35.69, lng: 139.69, size: 4, meta: 'Tokyo', operator: 'AWS', country: 'JP' },
  { id: 'aws-ap-southeast-1', name: 'AWS ap-southeast-1', kind: 'datacenter', lat: 1.35, lng: 103.82, size: 4, meta: 'Singapore', operator: 'AWS', country: 'SG' },
  { id: 'azure-east-us', name: 'Azure East US', kind: 'datacenter', lat: 37.43, lng: -78.65, size: 5, meta: 'Virginia', operator: 'Azure', country: 'US' },
  { id: 'azure-west-europe', name: 'Azure West EU', kind: 'datacenter', lat: 52.37, lng: 4.89, size: 4, meta: 'Netherlands', operator: 'Azure', country: 'NL' },
  { id: 'azure-southeast-asia', name: 'Azure Southeast Asia', kind: 'datacenter', lat: 1.35, lng: 103.82, size: 4, meta: 'Singapore', operator: 'Azure', country: 'SG' },
  { id: 'gcp-us-central1', name: 'GCP us-central1', kind: 'datacenter', lat: 41.26, lng: -95.86, size: 5, meta: 'Council Bluffs IA', operator: 'GCP', country: 'US' },
  { id: 'gcp-europe-west4', name: 'GCP europe-west4', kind: 'datacenter', lat: 53.43, lng: 6.84, size: 4, meta: 'Eemshaven NL', operator: 'GCP', country: 'NL' },
  { id: 'gcp-asia-east1', name: 'GCP asia-east1', kind: 'datacenter', lat: 24.05, lng: 120.50, size: 4, meta: 'Changhua TW', operator: 'GCP', country: 'TW' },
  { id: 'meta-altoona', name: 'Meta Altoona', kind: 'datacenter', lat: 41.65, lng: -93.46, size: 4, meta: 'Iowa', operator: 'Meta', country: 'US' },
  { id: 'meta-lulea', name: 'Meta Luleå', kind: 'datacenter', lat: 65.58, lng: 22.16, size: 3, meta: 'Sweden Arctic', operator: 'Meta', country: 'SE' },
];

export const IXPS: PointFeature[] = [
  { id: 'de-cix-fra', name: 'DE-CIX Frankfurt', kind: 'ixp', lat: 50.11, lng: 8.68, size: 5, meta: '>14 Tbps peak · World #1', operator: 'DE-CIX', country: 'DE' },
  { id: 'ams-ix', name: 'AMS-IX', kind: 'ixp', lat: 52.36, lng: 4.95, size: 5, meta: '>11 Tbps peak', operator: 'AMS-IX', country: 'NL' },
  { id: 'linx-lon', name: 'LINX London', kind: 'ixp', lat: 51.51, lng: -0.10, size: 4, meta: '>6 Tbps peak', operator: 'LINX', country: 'UK' },
  { id: 'eq-ash', name: 'Equinix Ashburn', kind: 'ixp', lat: 39.04, lng: -77.49, size: 5, meta: 'Largest US peering', operator: 'Equinix', country: 'US' },
  { id: 'eq-sv', name: 'Equinix Silicon Valley', kind: 'ixp', lat: 37.39, lng: -121.97, size: 4, meta: 'SV1', operator: 'Equinix', country: 'US' },
  { id: 'jpix-tokyo', name: 'JPIX Tokyo', kind: 'ixp', lat: 35.69, lng: 139.70, size: 4, meta: 'APAC hub', operator: 'JPIX', country: 'JP' },
  { id: 'hk-ix', name: 'HKIX', kind: 'ixp', lat: 22.42, lng: 114.21, size: 4, meta: 'HK', operator: 'HKIX', country: 'HK' },
  { id: 'sgix', name: 'SGIX Singapore', kind: 'ixp', lat: 1.35, lng: 103.82, size: 4, meta: 'SE Asia hub', operator: 'SGIX', country: 'SG' },
];

// ─── Naval bases & strategic straits ─────────────────────────────────────────
export const NAVAL_BASES: PointFeature[] = [
  { id: 'norfolk', name: 'Norfolk Naval Base', kind: 'naval', lat: 36.95, lng: -76.33, size: 5, meta: 'USN Atlantic HQ', country: 'US' },
  { id: 'sandiego', name: 'San Diego Naval Base', kind: 'naval', lat: 32.69, lng: -117.13, size: 5, meta: 'USN Pacific HQ', country: 'US' },
  { id: 'pearl-harbor', name: 'Pearl Harbor', kind: 'naval', lat: 21.36, lng: -157.96, size: 4, meta: 'INDOPACOM', country: 'US' },
  { id: 'yokosuka', name: 'Yokosuka', kind: 'naval', lat: 35.29, lng: 139.66, size: 4, meta: 'USN 7th Fleet HQ', country: 'JP' },
  { id: 'guam', name: 'Naval Base Guam', kind: 'naval', lat: 13.45, lng: 144.66, size: 4, meta: 'Apra Harbor', country: 'US' },
  { id: 'bahrain-fifth', name: 'NSA Bahrain', kind: 'naval', lat: 26.21, lng: 50.61, size: 4, meta: 'USN 5th Fleet HQ', country: 'BH' },
  { id: 'djibouti-lemonnier', name: 'Camp Lemonnier', kind: 'naval', lat: 11.55, lng: 43.16, size: 4, meta: 'AFRICOM hub', country: 'DJ' },
  { id: 'sevastopol', name: 'Sevastopol', kind: 'naval', lat: 44.61, lng: 33.52, size: 4, meta: 'Russian Black Sea Fleet', country: 'RU' },
  { id: 'tartus', name: 'Tartus', kind: 'naval', lat: 34.89, lng: 35.88, size: 3, meta: 'Russian Med base', country: 'SY' },
  { id: 'qingdao-naval', name: 'Qingdao Naval', kind: 'naval', lat: 36.05, lng: 120.30, size: 4, meta: 'PLAN North Sea Fleet', country: 'CN' },
  { id: 'sanya-naval', name: 'Yulin (Sanya)', kind: 'naval', lat: 18.21, lng: 109.69, size: 4, meta: 'PLAN SSBN base', country: 'CN' },
  { id: 'portsmouth', name: 'Portsmouth', kind: 'naval', lat: 50.80, lng: -1.10, size: 3, meta: 'Royal Navy', country: 'UK' },
  { id: 'toulon', name: 'Toulon', kind: 'naval', lat: 43.12, lng: 5.93, size: 3, meta: 'Marine nationale', country: 'FR' },
];

export const STRAITS: PointFeature[] = [
  { id: 'hormuz', name: 'Strait of Hormuz', kind: 'strait', lat: 26.57, lng: 56.25, size: 5, meta: '~21 mbpd · 30% global oil', status: 'CLEAR' },
  { id: 'malacca', name: 'Strait of Malacca', kind: 'strait', lat: 2.50, lng: 101.50, size: 5, meta: '~24 mbpd', status: 'CLEAR' },
  { id: 'bab-el-mandeb', name: 'Bab el-Mandeb', kind: 'strait', lat: 12.58, lng: 43.33, size: 5, meta: '~6 mbpd · Houthi attacks', status: 'CONGESTED' },
  { id: 'suez', name: 'Suez Canal', kind: 'strait', lat: 30.59, lng: 32.27, size: 5, meta: '~12% world trade', status: 'CLEAR' },
  { id: 'panama', name: 'Panama Canal', kind: 'strait', lat: 9.08, lng: -79.68, size: 5, meta: 'Drought-restricted', status: 'CONGESTED' },
  { id: 'bosphorus', name: 'Bosphorus', kind: 'strait', lat: 41.10, lng: 29.05, size: 4, meta: '~3 mbpd', status: 'CLEAR' },
  { id: 'taiwan', name: 'Taiwan Strait', kind: 'strait', lat: 24.50, lng: 119.50, size: 5, meta: '~88% global advanced chips transit', status: 'CONGESTED' },
  { id: 'dover', name: 'Dover Strait', kind: 'strait', lat: 51.00, lng: 1.50, size: 4, meta: 'Busiest shipping lane', status: 'CLEAR' },
  { id: 'gibraltar', name: 'Strait of Gibraltar', kind: 'strait', lat: 35.97, lng: -5.50, size: 4, meta: 'Med ↔ Atlantic', status: 'CLEAR' },
];

// ─── Central bank HQs ────────────────────────────────────────────────────────
export const CB_HQS: PointFeature[] = [
  { id: 'fed', name: 'Federal Reserve', kind: 'centralbank', lat: 38.892, lng: -77.046, size: 5, meta: 'FOMC · USD', country: 'US' },
  { id: 'ecb', name: 'European Central Bank', kind: 'centralbank', lat: 50.109, lng: 8.674, size: 5, meta: 'GC · EUR', country: 'DE' },
  { id: 'boj', name: 'Bank of Japan', kind: 'centralbank', lat: 35.686, lng: 139.776, size: 5, meta: 'PB · JPY', country: 'JP' },
  { id: 'pboc', name: 'PBoC', kind: 'centralbank', lat: 39.911, lng: 116.367, size: 5, meta: 'CNY', country: 'CN' },
  { id: 'boe', name: 'Bank of England', kind: 'centralbank', lat: 51.514, lng: -0.088, size: 4, meta: 'MPC · GBP', country: 'UK' },
  { id: 'snb', name: 'Swiss National Bank', kind: 'centralbank', lat: 46.948, lng: 7.444, size: 3, meta: 'CHF', country: 'CH' },
  { id: 'rba', name: 'Reserve Bank of Australia', kind: 'centralbank', lat: -33.866, lng: 151.207, size: 4, meta: 'AUD', country: 'AU' },
  { id: 'boc', name: 'Bank of Canada', kind: 'centralbank', lat: 45.421, lng: -75.703, size: 4, meta: 'CAD', country: 'CA' },
  { id: 'rbi', name: 'Reserve Bank of India', kind: 'centralbank', lat: 18.933, lng: 72.836, size: 4, meta: 'INR', country: 'IN' },
  { id: 'cbr', name: 'Central Bank of Russia', kind: 'centralbank', lat: 55.751, lng: 37.621, size: 3, meta: 'RUB · Sanctioned', country: 'RU' },
  { id: 'bcb', name: 'Banco Central do Brasil', kind: 'centralbank', lat: -15.799, lng: -47.864, size: 3, meta: 'BRL', country: 'BR' },
];

// ─── Coal-fired power plants (major, >1 GW) ─────────────────────────────────
export const COAL_PLANTS: PointFeature[] = [
  { id: 'tuoketuo', name: 'Tuoketuo', kind: 'coalplant', lat: 40.24, lng: 111.10, size: 5, meta: '6720 MW · China · World #1', country: 'CN', status: 'OPERATIONAL' },
  { id: 'datang-tuoketuo', name: 'Datang Tuoketuo', kind: 'coalplant', lat: 40.20, lng: 111.07, size: 5, meta: '5400 MW', country: 'CN', status: 'OPERATIONAL' },
  { id: 'taean', name: 'Taean', kind: 'coalplant', lat: 36.95, lng: 126.27, size: 5, meta: '6100 MW', country: 'KR', status: 'OPERATIONAL' },
  { id: 'dangdng', name: 'Dangjin', kind: 'coalplant', lat: 36.88, lng: 126.73, size: 5, meta: '4000 MW', country: 'KR', status: 'OPERATIONAL' },
  { id: 'vindhyachal', name: 'Vindhyachal', kind: 'coalplant', lat: 24.11, lng: 82.66, size: 5, meta: '6760 MW · NTPC', country: 'IN', status: 'OPERATIONAL' },
  { id: 'mundra-adani', name: 'Mundra (Adani)', kind: 'coalplant', lat: 22.84, lng: 69.70, size: 5, meta: '4620 MW', operator: 'Adani', country: 'IN', status: 'OPERATIONAL' },
  { id: 'mundra-cgpl', name: 'Mundra CGPL (Tata)', kind: 'coalplant', lat: 22.82, lng: 69.72, size: 4, meta: '4150 MW', operator: 'Tata', country: 'IN', status: 'OPERATIONAL' },
  { id: 'krishnapatnam', name: 'Krishnapatnam', kind: 'coalplant', lat: 14.22, lng: 80.12, size: 4, meta: '2640 MW', country: 'IN', status: 'OPERATIONAL' },
  { id: 'suratgarh', name: 'Suratgarh STPP', kind: 'coalplant', lat: 29.30, lng: 73.89, size: 4, meta: '1500 MW', country: 'IN', status: 'OPERATIONAL' },
  { id: 'paiton', name: 'Paiton', kind: 'coalplant', lat: -7.73, lng: 113.95, size: 4, meta: '2610 MW · Java', country: 'ID', status: 'OPERATIONAL' },
  { id: 'shandong-hua', name: 'Shandong Coal Hub', kind: 'coalplant', lat: 37.00, lng: 118.00, size: 5, meta: '>10 GW cluster', country: 'CN', status: 'OPERATIONAL' },
  { id: 'inner-mongolia-coal', name: 'Inner Mongolia Coal Hub', kind: 'coalplant', lat: 40.50, lng: 112.00, size: 5, meta: '>15 GW cluster', country: 'CN', status: 'OPERATIONAL' },
  { id: 'schkopau', name: 'Schkopau Lignite', kind: 'coalplant', lat: 51.38, lng: 11.98, size: 3, meta: '959 MW · Germany', country: 'DE', status: 'OPERATIONAL' },
  { id: 'ratcliffe', name: 'Ratcliffe-on-Soar', kind: 'coalplant', lat: 52.86, lng: -1.26, size: 3, meta: '2000 MW · UK · closing 2024', country: 'GB', status: 'OFFLINE' },
  { id: 'belchatow', name: 'Bełchatów', kind: 'coalplant', lat: 51.27, lng: 19.37, size: 5, meta: '5354 MW · Europe largest lignite', country: 'PL', status: 'OPERATIONAL' },
  { id: 'kozienice', name: 'Kozienice', kind: 'coalplant', lat: 51.58, lng: 21.55, size: 4, meta: '2826 MW · Poland', country: 'PL', status: 'OPERATIONAL' },
  { id: 'lethabo', name: 'Lethabo', kind: 'coalplant', lat: -26.86, lng: 27.62, size: 4, meta: '3558 MW · Eskom', operator: 'Eskom', country: 'ZA', status: 'OPERATIONAL' },
  { id: 'matimba', name: 'Matimba', kind: 'coalplant', lat: -23.51, lng: 27.63, size: 4, meta: '3990 MW · Eskom', operator: 'Eskom', country: 'ZA', status: 'OPERATIONAL' },
  { id: 'haramain', name: 'Hainan Coal Hub', kind: 'coalplant', lat: 19.50, lng: 110.00, size: 4, meta: 'Multiple plants ~5 GW', country: 'CN', status: 'OPERATIONAL' },
  { id: 'boxberg', name: 'Boxberg (Lignite)', kind: 'coalplant', lat: 51.43, lng: 14.58, size: 4, meta: '2427 MW · LEAG', country: 'DE', status: 'OPERATIONAL' },
  { id: 'janschwalde', name: 'Jänschwalde', kind: 'coalplant', lat: 51.84, lng: 14.47, size: 4, meta: '3000 MW · Germany', country: 'DE', status: 'OPERATIONAL' },
  { id: 'medupi', name: 'Medupi', kind: 'coalplant', lat: -23.66, lng: 27.96, size: 5, meta: '4764 MW · Eskom · delayed project', operator: 'Eskom', country: 'ZA', status: 'OPERATIONAL' },
  { id: 'yallourn', name: 'Yallourn', kind: 'coalplant', lat: -38.19, lng: 146.41, size: 3, meta: '1480 MW · Australia · closing 2028', country: 'AU', status: 'OPERATIONAL' },
  { id: 'ertan', name: 'Guohua Shenmu', kind: 'coalplant', lat: 38.58, lng: 110.55, size: 4, meta: '5400 MW · Shaanxi', country: 'CN', status: 'OPERATIONAL' },
  { id: 'ghazlan', name: 'Ghazlan', kind: 'coalplant', lat: 27.37, lng: 36.11, size: 3, meta: '2640 MW · Saudi', country: 'SA', status: 'OPERATIONAL' },
];

// ─── Color palettes ──────────────────────────────────────────────────────────
export const PIPELINE_COLOR: Record<string, string> = {
  oil: 'hsl(28, 95%, 55%)',
  gas: 'hsl(48, 95%, 60%)',
  fiber: 'hsl(195, 90%, 60%)',
  hv: 'hsl(280, 75%, 65%)',
};
export const STATUS_COLOR: Record<string, string> = {
  OPERATIONAL: 'hsl(150, 80%, 55%)',
  DAMAGED: 'hsl(0, 90%, 60%)',
  OFFLINE: 'hsl(0, 0%, 50%)',
  PLANNED: 'hsl(195, 70%, 55%)',
  UNDER_CONSTRUCTION: 'hsl(45, 95%, 55%)',
  DECOM: 'hsl(0, 0%, 40%)',
  BLOCKED: 'hsl(0, 90%, 60%)',
  CONGESTED: 'hsl(35, 95%, 60%)',
  CLEAR: 'hsl(150, 80%, 55%)',
};

export const COMMODITY_COLOR: Record<string, string> = {
  copper: 'hsl(20, 80%, 55%)',
  lithium: 'hsl(180, 80%, 60%)',
  gold: 'hsl(48, 95%, 55%)',
  uranium: 'hsl(120, 60%, 55%)',
  'rare-earth': 'hsl(300, 70%, 65%)',
  nickel: 'hsl(200, 50%, 65%)',
  iron: 'hsl(15, 70%, 50%)',
  diamond: 'hsl(0, 0%, 90%)',
  oil: 'hsl(28, 95%, 55%)',
  gas: 'hsl(48, 95%, 60%)',
};
