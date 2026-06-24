/**
 * Arctic shipping routes — opening progressively as sea-ice extent shrinks.
 * By mid-2020s, summer navigation is commercially viable on the NSR.
 * Critical for energy traders (Russia sanctions/LNG), shipping analysts,
 * and climate-risk investors.
 *
 * Distances and transit times versus Suez/Panama canal routes are the
 * primary commercial metric. All paths are [lng, lat] waypoints.
 */

export type ArcticRouteStatus = 'OPERATIONAL' | 'SEASONAL' | 'EMERGING';

export type ArcticRoute = {
  id: string;
  name: string;
  shortName: string;
  status: ArcticRouteStatus;
  /** Open summer months (approximate) */
  seasonMonths?: string;
  /** Nautical miles saved vs Suez/Panama (positive = saves distance) */
  nmSavedVsSuez?: number;
  /** Days saved vs Suez/Panama */
  daysSavedVsSuez?: number;
  /** Icebreaker escort required? */
  icebreakerRequired: boolean;
  /** Controlling jurisdiction */
  jurisdiction: string;
  notes?: string;
  path: [number, number][];
};

export const ARCTIC_ROUTES: ArcticRoute[] = [
  {
    id: 'nsr',
    name: 'Northern Sea Route (NSR)',
    shortName: 'NSR',
    status: 'SEASONAL',
    seasonMonths: 'Jul–Nov (nuclear icebreaker: year-round)',
    nmSavedVsSuez: 4000,
    daysSavedVsSuez: 10,
    icebreakerRequired: true,
    jurisdiction: 'Russia (requires transit permit under UNCLOS Art. 234)',
    notes: 'Russia charges transit fees; sanctioned LNG cargo from Yamal/Arctic-2 must use NSR. China eyeing "Polar Silk Road." ~35 commercial transits in 2023, rising.',
    path: [
      [32.04, 69.07],   // Murmansk
      [52.00, 71.50],   // Novaya Zemlya entrance
      [58.00, 73.00],   // Kara Sea
      [70.00, 73.50],   // Ob/Yamal peninsula
      [80.00, 73.00],   // Kara Sea west
      [90.00, 73.50],   // Severnaya Zemlya
      [102.00, 73.00],  // Laptev Sea
      [112.00, 72.50],  // Laptev-East Siberian
      [126.00, 72.00],  // East Siberian Sea
      [140.00, 70.50],  // Kolyma delta
      [155.00, 70.00],  // Chaun Bay
      [168.00, 66.50],  // Bering Strait
      [170.00, 63.98],  // Nome AK approach
    ],
  },
  {
    id: 'nwp',
    name: 'Northwest Passage (NWP)',
    shortName: 'NWP',
    status: 'SEASONAL',
    seasonMonths: 'Aug–Oct (limited; multi-year ice risk)',
    nmSavedVsSuez: 3000,
    daysSavedVsSuez: 7,
    icebreakerRequired: true,
    jurisdiction: 'Canada claims internal waters (disputed by US/EU as international strait)',
    notes: 'Historically frozen; commercially navigated for first time 2007. Canada-US legal dispute on sovereignty. Short season limits commercial viability. Churchill MB developing as deep-water Arctic port.',
    path: [
      [-75.00, 76.50],  // Lancaster Sound
      [-85.00, 74.00],  // McClure Strait approach
      [-100.00, 74.50], // Queen Maud Gulf
      [-110.00, 72.00], // Simpson Strait
      [-120.00, 70.00], // Coronation Gulf
      [-130.00, 69.50], // Amundsen Gulf
      [-140.00, 70.00], // Beaufort Sea
      [-155.00, 71.00], // Alaska coast
      [-168.00, 66.50], // Bering Strait
    ],
  },
  {
    id: 'transpolar',
    name: 'Transpolar Route',
    shortName: 'TPR',
    status: 'EMERGING',
    seasonMonths: 'Projected viable: 2040s (summer only)',
    nmSavedVsSuez: 4500,
    daysSavedVsSuez: 12,
    icebreakerRequired: true,
    jurisdiction: 'International waters (UNCLOS high seas beyond 200nm EEZ)',
    notes: 'Crosses directly over North Pole. No current ice-free transit. Nuclear icebreaker required. Most economical route when viable. Contested by Russia/Canada on jurisdictional grounds.',
    path: [
      [32.04, 69.07],   // Murmansk
      [40.00, 76.00],   // Barents entrance
      [0.00, 85.00],    // Near North Pole
      [-45.00, 83.00],  // Crossing high Arctic
      [-75.00, 76.50],  // Lancaster Sound
      [-168.00, 66.50], // Bering Strait
    ],
  },
];

// Key Arctic infrastructure ports
export type ArcticPort = {
  id: string;
  name: string;
  lat: number;
  lng: number;
  country: string;
  meta?: string;
  status: 'OPERATIONAL' | 'EXPANDING' | 'PLANNED';
};

export const ARCTIC_PORTS: ArcticPort[] = [
  { id: 'murmansk', name: 'Murmansk', lat: 68.97, lng: 33.07, country: 'RU',
    meta: 'Ice-free year-round · Russia NSR western terminus · nuclear icebreaker base', status: 'OPERATIONAL' },
  { id: 'sabetta', name: 'Sabetta LNG Port', lat: 71.27, lng: 72.05, country: 'RU',
    meta: 'Yamal LNG export · Novatek · NSR eastern leg gateway · sanctioned', status: 'OPERATIONAL' },
  { id: 'tiksi', name: 'Tiksi', lat: 71.64, lng: 128.87, country: 'RU',
    meta: 'Laptev Sea · Limited capacity · Russian federal upgrade underway', status: 'EXPANDING' },
  { id: 'pevek', name: 'Pevek', lat: 69.70, lng: 170.27, country: 'RU',
    meta: 'Easternmost NSR port · floating nuclear power plant (Akademik Lomonosov) · Arctic 2 LNG staging', status: 'OPERATIONAL' },
  { id: 'churchill', name: 'Port of Churchill', lat: 58.78, lng: -94.19, country: 'CA',
    meta: 'Hudson Bay · NWP southern gateway · grain export · ownership transferred 2017', status: 'OPERATIONAL' },
  { id: 'nuuk', name: 'Nuuk (Godthab)', lat: 64.17, lng: -51.74, country: 'GL',
    meta: 'Greenland capital · deep-water port planned · rare earth access · geopolitical spotlight', status: 'EXPANDING' },
  { id: 'longyearbyen', name: 'Longyearbyen', lat: 78.22, lng: 15.65, country: 'NO',
    meta: 'Svalbard · International scientific base · Norway + Russia presence · tourism + research', status: 'OPERATIONAL' },
  { id: 'prudhoe-bay', name: 'Prudhoe Bay / Deadhorse', lat: 70.19, lng: -148.46, country: 'US',
    meta: 'Alaska North Slope oil hub · Trans-Alaska Pipeline terminus · ANWR debate', status: 'OPERATIONAL' },
];

export const ROUTE_STATUS_COLOR: Record<ArcticRouteStatus, string> = {
  OPERATIONAL: 'hsl(195, 90%, 65%)',
  SEASONAL:    'hsl(170, 85%, 60%)',
  EMERGING:    'hsl(220, 70%, 60%)',
};
