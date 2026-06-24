/**
 * Curated commodity flow corridors — crude oil, LNG, grains.
 * Volume is normalized 0..1 for line-thickness scaling.
 */

export type Commodity = 'crude' | 'lng' | 'grain' | 'coal' | 'copper' | 'iron' | 'chips';

export type CommodityFlow = {
  id: string;
  commodity: Commodity;
  fromName: string;
  toName: string;
  fromLngLat: [number, number]; // [lng, lat]
  toLngLat: [number, number];
  volume: number; // 0..1
};

export const COMMODITY_COLOR: Record<Commodity, string> = {
  crude:  'hsl(15, 85%, 55%)',
  lng:    'hsl(48, 95%, 60%)',
  grain:  'hsl(45, 70%, 55%)',
  coal:   'hsl(220, 15%, 55%)',
  copper: 'hsl(20, 80%, 55%)',
  iron:   'hsl(10, 65%, 45%)',
  chips:  'hsl(195, 90%, 65%)',
};

export const COMMODITY_LABEL: Record<Commodity, string> = {
  crude:  'Crude Oil',
  lng:    'LNG',
  grain:  'Grains',
  coal:   'Thermal Coal',
  copper: 'Copper',
  iron:   'Iron Ore',
  chips:  'Semiconductors',
};

export const COMMODITY_FLOWS: CommodityFlow[] = [
  // ── Crude ──
  { id: 'cr-sa-cn', commodity: 'crude', fromName: 'Ras Tanura, SA', toName: 'Qingdao, CN',
    fromLngLat: [50.16, 26.64], toLngLat: [120.38, 36.07], volume: 1.0 },
  { id: 'cr-sa-in', commodity: 'crude', fromName: 'Ras Tanura, SA', toName: 'Jamnagar, IN',
    fromLngLat: [50.16, 26.64], toLngLat: [70.07, 22.47], volume: 0.85 },
  { id: 'cr-sa-jp', commodity: 'crude', fromName: 'Ras Tanura, SA', toName: 'Yokohama, JP',
    fromLngLat: [50.16, 26.64], toLngLat: [139.65, 35.45], volume: 0.55 },
  { id: 'cr-ru-cn', commodity: 'crude', fromName: 'Kozmino, RU', toName: 'Dalian, CN',
    fromLngLat: [133.65, 42.72], toLngLat: [121.61, 38.91], volume: 0.85 },
  { id: 'cr-ru-in', commodity: 'crude', fromName: 'Novorossiysk, RU', toName: 'Sikka, IN',
    fromLngLat: [37.78, 44.72], toLngLat: [69.91, 22.43], volume: 0.78 },
  { id: 'cr-ae-jp', commodity: 'crude', fromName: 'Fujairah, AE', toName: 'Chiba, JP',
    fromLngLat: [56.36, 25.12], toLngLat: [140.10, 35.60], volume: 0.45 },
  { id: 'cr-us-eu', commodity: 'crude', fromName: 'Houston, US', toName: 'Rotterdam, NL',
    fromLngLat: [-95.05, 29.73], toLngLat: [4.50, 51.95], volume: 0.65 },
  { id: 'cr-us-kr', commodity: 'crude', fromName: 'Corpus Christi, US', toName: 'Ulsan, KR',
    fromLngLat: [-97.40, 27.80], toLngLat: [129.36, 35.49], volume: 0.55 },
  { id: 'cr-no-eu', commodity: 'crude', fromName: 'Mongstad, NO', toName: 'Wilhelmshaven, DE',
    fromLngLat: [5.04, 60.81], toLngLat: [8.10, 53.52], volume: 0.40 },
  { id: 'cr-ng-in', commodity: 'crude', fromName: 'Bonny, NG', toName: 'Kochi, IN',
    fromLngLat: [7.18, 4.45], toLngLat: [76.27, 9.97], volume: 0.30 },
  { id: 'cr-br-cn', commodity: 'crude', fromName: 'Tubarão, BR', toName: 'Ningbo, CN',
    fromLngLat: [-40.27, -20.30], toLngLat: [121.55, 29.87], volume: 0.45 },

  // ── LNG ──
  { id: 'lng-qa-jp', commodity: 'lng', fromName: 'Ras Laffan, QA', toName: 'Sodegaura, JP',
    fromLngLat: [51.59, 25.92], toLngLat: [140.00, 35.43], volume: 0.85 },
  { id: 'lng-qa-kr', commodity: 'lng', fromName: 'Ras Laffan, QA', toName: 'Tongyeong, KR',
    fromLngLat: [51.59, 25.92], toLngLat: [128.43, 34.85], volume: 0.65 },
  { id: 'lng-qa-eu', commodity: 'lng', fromName: 'Ras Laffan, QA', toName: 'Milford Haven, GB',
    fromLngLat: [51.59, 25.92], toLngLat: [-5.04, 51.71], volume: 0.45 },
  { id: 'lng-us-eu', commodity: 'lng', fromName: 'Sabine Pass, US', toName: 'Zeebrugge, BE',
    fromLngLat: [-93.87, 29.73], toLngLat: [3.20, 51.34], volume: 1.0 },
  { id: 'lng-us-jp', commodity: 'lng', fromName: 'Cameron, US', toName: 'Futtsu, JP',
    fromLngLat: [-93.32, 29.81], toLngLat: [139.85, 35.32], volume: 0.55 },
  { id: 'lng-us-kr', commodity: 'lng', fromName: 'Freeport, US', toName: 'Incheon, KR',
    fromLngLat: [-95.30, 28.94], toLngLat: [126.62, 37.40], volume: 0.50 },
  { id: 'lng-au-jp', commodity: 'lng', fromName: 'Gladstone, AU', toName: 'Senboku, JP',
    fromLngLat: [151.27, -23.83], toLngLat: [135.39, 34.55], volume: 0.75 },
  { id: 'lng-au-cn', commodity: 'lng', fromName: 'Karratha, AU', toName: 'Tianjin, CN',
    fromLngLat: [116.85, -20.74], toLngLat: [117.20, 38.99], volume: 0.65 },
  { id: 'lng-ru-cn', commodity: 'lng', fromName: 'Sabetta, RU', toName: 'Tangshan, CN',
    fromLngLat: [72.05, 71.27], toLngLat: [118.88, 39.21], volume: 0.40 },

  // ── Grains ──
  { id: 'gr-us-cn', commodity: 'grain', fromName: 'New Orleans, US', toName: 'Shanghai, CN',
    fromLngLat: [-90.07, 29.95], toLngLat: [121.47, 31.23], volume: 1.0 },
  { id: 'gr-us-mx', commodity: 'grain', fromName: 'New Orleans, US', toName: 'Veracruz, MX',
    fromLngLat: [-90.07, 29.95], toLngLat: [-96.13, 19.18], volume: 0.55 },
  { id: 'gr-us-jp', commodity: 'grain', fromName: 'Portland, US', toName: 'Yokohama, JP',
    fromLngLat: [-122.68, 45.52], toLngLat: [139.65, 35.45], volume: 0.45 },
  { id: 'gr-br-cn', commodity: 'grain', fromName: 'Santos, BR', toName: 'Qingdao, CN',
    fromLngLat: [-46.33, -23.97], toLngLat: [120.38, 36.07], volume: 0.95 },
  { id: 'gr-br-eu', commodity: 'grain', fromName: 'Paranaguá, BR', toName: 'Rotterdam, NL',
    fromLngLat: [-48.51, -25.51], toLngLat: [4.50, 51.95], volume: 0.50 },
  { id: 'gr-ar-cn', commodity: 'grain', fromName: 'Rosario, AR', toName: 'Shanghai, CN',
    fromLngLat: [-60.65, -32.95], toLngLat: [121.47, 31.23], volume: 0.55 },
  { id: 'gr-ar-eg', commodity: 'grain', fromName: 'Bahía Blanca, AR', toName: 'Alexandria, EG',
    fromLngLat: [-62.29, -38.72], toLngLat: [29.92, 31.20], volume: 0.30 },
  { id: 'gr-ua-eg', commodity: 'grain', fromName: 'Odesa, UA', toName: 'Alexandria, EG',
    fromLngLat: [30.74, 46.48], toLngLat: [29.92, 31.20], volume: 0.40 },
  { id: 'gr-ua-tr', commodity: 'grain', fromName: 'Odesa, UA', toName: 'Mersin, TR',
    fromLngLat: [30.74, 46.48], toLngLat: [34.62, 36.80], volume: 0.35 },
  { id: 'gr-ru-tr', commodity: 'grain', fromName: 'Novorossiysk, RU', toName: 'Mersin, TR',
    fromLngLat: [37.78, 44.72], toLngLat: [34.62, 36.80], volume: 0.50 },
  { id: 'gr-au-cn', commodity: 'grain', fromName: 'Newcastle, AU', toName: 'Qingdao, CN',
    fromLngLat: [151.78, -32.93], toLngLat: [120.38, 36.07], volume: 0.45 },
  { id: 'gr-ca-jp', commodity: 'grain', fromName: 'Vancouver, CA', toName: 'Yokohama, JP',
    fromLngLat: [-123.12, 49.28], toLngLat: [139.65, 35.45], volume: 0.55 },

  // ── Thermal Coal ──
  { id: 'coal-au-cn', commodity: 'coal', fromName: 'Newcastle, AU', toName: 'Qingdao, CN',
    fromLngLat: [151.78, -32.93], toLngLat: [120.38, 36.07], volume: 1.0 },
  { id: 'coal-au-jp', commodity: 'coal', fromName: 'Newcastle, AU', toName: 'Yokohama, JP',
    fromLngLat: [151.78, -32.93], toLngLat: [139.65, 35.45], volume: 0.75 },
  { id: 'coal-au-kr', commodity: 'coal', fromName: 'Hay Point, AU', toName: 'Gwangyang, KR',
    fromLngLat: [148.90, -21.27], toLngLat: [127.75, 34.91], volume: 0.65 },
  { id: 'coal-au-in', commodity: 'coal', fromName: 'Hay Point, AU', toName: 'Paradip, IN',
    fromLngLat: [148.90, -21.27], toLngLat: [86.67, 20.32], volume: 0.55 },
  { id: 'coal-ru-cn', commodity: 'coal', fromName: 'Vladivostok, RU', toName: 'Tangshan, CN',
    fromLngLat: [131.90, 43.12], toLngLat: [118.88, 39.21], volume: 0.70 },
  { id: 'coal-ru-in', commodity: 'coal', fromName: 'Vanino, RU', toName: 'Krishnapatnam, IN',
    fromLngLat: [140.27, 49.08], toLngLat: [80.15, 14.18], volume: 0.40 },
  { id: 'coal-id-cn', commodity: 'coal', fromName: 'Samarinda, ID', toName: 'Guangzhou, CN',
    fromLngLat: [117.10, -0.50], toLngLat: [113.26, 23.13], volume: 0.85 },
  { id: 'coal-id-in', commodity: 'coal', fromName: 'Banjarmasin, ID', toName: 'Krishnapatnam, IN',
    fromLngLat: [114.59, -3.32], toLngLat: [80.15, 14.18], volume: 0.60 },
  { id: 'coal-us-eu', commodity: 'coal', fromName: 'Hampton Roads, US', toName: 'Amsterdam, NL',
    fromLngLat: [-76.34, 37.00], toLngLat: [4.90, 52.37], volume: 0.30 },
  { id: 'coal-col-eu', commodity: 'coal', fromName: 'Puerto Bolívar, CO', toName: 'Rotterdam, NL',
    fromLngLat: [-72.38, 11.90], toLngLat: [4.50, 51.95], volume: 0.45 },
  { id: 'coal-moz-in', commodity: 'coal', fromName: 'Nacala, MZ', toName: 'Mundra, IN',
    fromLngLat: [40.68, -14.54], toLngLat: [70.18, 22.84], volume: 0.25 },

  // ── Copper ──
  { id: 'cu-cl-cn', commodity: 'copper', fromName: 'Antofagasta, CL', toName: 'Shanghai, CN',
    fromLngLat: [-70.40, -23.65], toLngLat: [121.47, 31.23], volume: 1.0 },
  { id: 'cu-pe-cn', commodity: 'copper', fromName: 'Matarani, PE', toName: 'Ningbo, CN',
    fromLngLat: [-72.10, -17.00], toLngLat: [121.55, 29.87], volume: 0.65 },
  { id: 'cu-cl-eu', commodity: 'copper', fromName: 'Antofagasta, CL', toName: 'Hamburg, DE',
    fromLngLat: [-70.40, -23.65], toLngLat: [9.99, 53.55], volume: 0.35 },
  { id: 'cu-cl-jp', commodity: 'copper', fromName: 'Antofagasta, CL', toName: 'Yokohama, JP',
    fromLngLat: [-70.40, -23.65], toLngLat: [139.65, 35.45], volume: 0.30 },
  { id: 'cu-cd-cn', commodity: 'copper', fromName: 'Dar es Salaam, TZ', toName: 'Tianjin, CN',
    fromLngLat: [39.28, -6.82], toLngLat: [117.20, 38.99], volume: 0.55 },
  { id: 'cu-id-cn', commodity: 'copper', fromName: 'Amamapare, ID', toName: 'Shanghai, CN',
    fromLngLat: [136.82, -4.62], toLngLat: [121.47, 31.23], volume: 0.40 },
  { id: 'cu-us-cn', commodity: 'copper', fromName: 'New Orleans, US', toName: 'Tianjin, CN',
    fromLngLat: [-90.07, 29.95], toLngLat: [117.20, 38.99], volume: 0.25 },

  // ── Iron Ore ──
  { id: 'fe-au-cn', commodity: 'iron', fromName: 'Port Hedland, AU', toName: 'Qingdao, CN',
    fromLngLat: [118.59, -20.31], toLngLat: [120.38, 36.07], volume: 1.0 },
  { id: 'fe-au-jp', commodity: 'iron', fromName: 'Port Hedland, AU', toName: 'Fukuyama, JP',
    fromLngLat: [118.59, -20.31], toLngLat: [133.36, 34.49], volume: 0.45 },
  { id: 'fe-au-kr', commodity: 'iron', fromName: 'Port Hedland, AU', toName: 'Pohang, KR',
    fromLngLat: [118.59, -20.31], toLngLat: [129.37, 36.03], volume: 0.35 },
  { id: 'fe-br-cn', commodity: 'iron', fromName: 'Ponta da Madeira, BR', toName: 'Qingdao, CN',
    fromLngLat: [-44.36, -2.55], toLngLat: [120.38, 36.07], volume: 0.90 },
  { id: 'fe-br-eu', commodity: 'iron', fromName: 'Tubarão, BR', toName: 'Rotterdam, NL',
    fromLngLat: [-40.27, -20.30], toLngLat: [4.50, 51.95], volume: 0.30 },
  { id: 'fe-za-cn', commodity: 'iron', fromName: 'Saldanha Bay, ZA', toName: 'Qingdao, CN',
    fromLngLat: [17.95, -33.01], toLngLat: [120.38, 36.07], volume: 0.25 },
  { id: 'fe-in-cn', commodity: 'iron', fromName: 'Paradip, IN', toName: 'Qingdao, CN',
    fromLngLat: [86.67, 20.32], toLngLat: [120.38, 36.07], volume: 0.20 },

  // ── Semiconductors / Chips ──
  { id: 'chip-tw-us', commodity: 'chips', fromName: 'Taoyuan Airport, TW', toName: 'Los Angeles, US',
    fromLngLat: [121.23, 25.08], toLngLat: [-118.40, 33.94], volume: 1.0 },
  { id: 'chip-tw-eu', commodity: 'chips', fromName: 'Taoyuan Airport, TW', toName: 'Frankfurt, DE',
    fromLngLat: [121.23, 25.08], toLngLat: [8.56, 50.04], volume: 0.60 },
  { id: 'chip-tw-cn', commodity: 'chips', fromName: 'Kaohsiung, TW', toName: 'Shanghai, CN',
    fromLngLat: [120.30, 22.63], toLngLat: [121.47, 31.23], volume: 0.75 },
  { id: 'chip-kr-us', commodity: 'chips', fromName: 'Incheon Airport, KR', toName: 'Los Angeles, US',
    fromLngLat: [126.44, 37.46], toLngLat: [-118.40, 33.94], volume: 0.70 },
  { id: 'chip-kr-cn', commodity: 'chips', fromName: 'Pyeongtaek, KR', toName: 'Shanghai, CN',
    fromLngLat: [126.99, 36.99], toLngLat: [121.47, 31.23], volume: 0.65 },
  { id: 'chip-jp-us', commodity: 'chips', fromName: 'Tokyo Narita, JP', toName: 'San Francisco, US',
    fromLngLat: [140.39, 35.77], toLngLat: [-122.38, 37.62], volume: 0.50 },
  { id: 'chip-us-eu', commodity: 'chips', fromName: 'Portland Oregon, US', toName: 'Munich, DE',
    fromLngLat: [-122.60, 45.59], toLngLat: [11.79, 48.35], volume: 0.45 },
  { id: 'chip-nl-us', commodity: 'chips', fromName: 'Amsterdam Schiphol, NL', toName: 'Portland OR, US',
    fromLngLat: [4.76, 52.31], toLngLat: [-122.60, 45.59], volume: 0.40 },
  { id: 'chip-sg-us', commodity: 'chips', fromName: 'Changi Airport, SG', toName: 'Los Angeles, US',
    fromLngLat: [103.99, 1.36], toLngLat: [-118.40, 33.94], volume: 0.35 },
];
