/**
 * Corporate facilities — Administration HQs, Distribution hubs, Manufacturing
 * plants, R&D centers. Bloomberg MAP "Factories" overlay parity.
 */
import type { PointFeature } from './infra';

export type FactoryKind = 'admin' | 'distribution' | 'manufacturing' | 'rnd';

export const FACTORIES: (PointFeature & { factoryKind: FactoryKind })[] = [
  // Manufacturing
  { id: 'tsmc-hsinchu', factoryKind: 'manufacturing', name: 'TSMC Fab 12 (Hsinchu)', kind: 'factory', lat: 24.78, lng: 121.00, size: 5, meta: '5nm/3nm logic', operator: 'TSMC', country: 'TW' },
  { id: 'tsmc-arizona', factoryKind: 'manufacturing', name: 'TSMC Arizona', kind: 'factory', lat: 33.72, lng: -112.10, size: 4, meta: '4nm · $40B', operator: 'TSMC', country: 'US' },
  { id: 'samsung-pyeongtaek', factoryKind: 'manufacturing', name: 'Samsung P3 Pyeongtaek', kind: 'factory', lat: 36.99, lng: 127.06, size: 5, meta: 'World\'s largest fab', operator: 'Samsung', country: 'KR' },
  { id: 'intel-ohio', factoryKind: 'manufacturing', name: 'Intel Ohio One', kind: 'factory', lat: 40.05, lng: -82.83, size: 4, meta: '$20B fab cluster', operator: 'Intel', country: 'US' },
  { id: 'asml-veldhoven', factoryKind: 'manufacturing', name: 'ASML Veldhoven', kind: 'factory', lat: 51.42, lng: 5.46, size: 5, meta: 'EUV lithography', operator: 'ASML', country: 'NL' },
  { id: 'tesla-fremont', factoryKind: 'manufacturing', name: 'Tesla Fremont', kind: 'factory', lat: 37.49, lng: -121.94, size: 4, meta: 'Model S/X/3/Y', operator: 'Tesla', country: 'US' },
  { id: 'tesla-shanghai', factoryKind: 'manufacturing', name: 'Tesla Gigafactory Shanghai', kind: 'factory', lat: 30.86, lng: 121.79, size: 5, meta: '~950k vehicles/yr', operator: 'Tesla', country: 'CN' },
  { id: 'tesla-berlin', factoryKind: 'manufacturing', name: 'Tesla Gigafactory Berlin', kind: 'factory', lat: 52.39, lng: 13.81, size: 4, meta: 'Model Y EU', operator: 'Tesla', country: 'DE' },
  { id: 'tesla-austin', factoryKind: 'manufacturing', name: 'Tesla Gigafactory Texas', kind: 'factory', lat: 30.22, lng: -97.62, size: 4, meta: 'Cybertruck · Model Y', operator: 'Tesla', country: 'US' },
  { id: 'byd-shenzhen', factoryKind: 'manufacturing', name: 'BYD Shenzhen', kind: 'factory', lat: 22.59, lng: 114.10, size: 4, meta: 'EV + battery HQ', operator: 'BYD', country: 'CN' },
  { id: 'foxconn-zhengzhou', factoryKind: 'manufacturing', name: 'Foxconn iPhone City', kind: 'factory', lat: 34.52, lng: 113.84, size: 5, meta: '~50% world iPhones', operator: 'Foxconn', country: 'CN' },
  { id: 'boeing-everett', factoryKind: 'manufacturing', name: 'Boeing Everett', kind: 'factory', lat: 47.91, lng: -122.27, size: 5, meta: '787/777 final assembly', operator: 'Boeing', country: 'US' },
  { id: 'airbus-toulouse', factoryKind: 'manufacturing', name: 'Airbus Toulouse', kind: 'factory', lat: 43.63, lng: 1.37, size: 5, meta: 'A320/A350 final assembly', operator: 'Airbus', country: 'FR' },
  { id: 'vw-wolfsburg', factoryKind: 'manufacturing', name: 'VW Wolfsburg', kind: 'factory', lat: 52.43, lng: 10.79, size: 4, meta: 'Largest auto plant EU', operator: 'Volkswagen', country: 'DE' },
  { id: 'toyota-toyota-city', factoryKind: 'manufacturing', name: 'Toyota Motomachi', kind: 'factory', lat: 35.08, lng: 137.16, size: 5, meta: 'Lexus + flagship lines', operator: 'Toyota', country: 'JP' },

  // Administration / HQ
  { id: 'aapl-hq', factoryKind: 'admin', name: 'Apple Park', kind: 'factory', lat: 37.33, lng: -122.01, size: 5, meta: 'AAPL HQ', operator: 'Apple', country: 'US' },
  { id: 'msft-hq', factoryKind: 'admin', name: 'Microsoft Redmond', kind: 'factory', lat: 47.64, lng: -122.13, size: 5, meta: 'MSFT HQ', operator: 'Microsoft', country: 'US' },
  { id: 'goog-hq', factoryKind: 'admin', name: 'Googleplex', kind: 'factory', lat: 37.42, lng: -122.08, size: 5, meta: 'GOOGL HQ', operator: 'Alphabet', country: 'US' },
  { id: 'meta-hq', factoryKind: 'admin', name: 'Meta Menlo Park', kind: 'factory', lat: 37.48, lng: -122.15, size: 4, meta: 'META HQ', operator: 'Meta', country: 'US' },
  { id: 'nvda-hq', factoryKind: 'admin', name: 'NVIDIA HQ', kind: 'factory', lat: 37.37, lng: -121.96, size: 5, meta: 'NVDA HQ', operator: 'NVIDIA', country: 'US' },
  { id: 'amzn-hq', factoryKind: 'admin', name: 'Amazon Spheres', kind: 'factory', lat: 47.61, lng: -122.34, size: 5, meta: 'AMZN HQ', operator: 'Amazon', country: 'US' },
  { id: 'tsla-hq', factoryKind: 'admin', name: 'Tesla HQ Austin', kind: 'factory', lat: 30.22, lng: -97.62, size: 4, meta: 'TSLA HQ', operator: 'Tesla', country: 'US' },
  { id: 'jpm-hq', factoryKind: 'admin', name: 'JPMorgan 270 Park', kind: 'factory', lat: 40.76, lng: -73.97, size: 4, meta: 'JPM HQ', operator: 'JPMorgan', country: 'US' },
  { id: 'shell-hq', factoryKind: 'admin', name: 'Shell HQ London', kind: 'factory', lat: 51.50, lng: -0.12, size: 4, meta: 'SHEL HQ', operator: 'Shell', country: 'UK' },
  { id: 'aramco-hq', factoryKind: 'admin', name: 'Saudi Aramco HQ', kind: 'factory', lat: 26.35, lng: 50.10, size: 5, meta: '2222.SR HQ', operator: 'Aramco', country: 'SA' },

  // Distribution
  { id: 'amzn-bfi4', factoryKind: 'distribution', name: 'Amazon BFI4 Kent', kind: 'factory', lat: 47.41, lng: -122.27, size: 3, meta: 'Sortation hub', operator: 'Amazon', country: 'US' },
  { id: 'amzn-cvg', factoryKind: 'distribution', name: 'Amazon Air CVG', kind: 'factory', lat: 39.04, lng: -84.66, size: 4, meta: 'Air-cargo super-hub', operator: 'Amazon', country: 'US' },
  { id: 'fedex-mem', factoryKind: 'distribution', name: 'FedEx World Hub', kind: 'factory', lat: 35.04, lng: -89.98, size: 5, meta: 'Memphis super-hub', operator: 'FedEx', country: 'US' },
  { id: 'ups-sdf', factoryKind: 'distribution', name: 'UPS Worldport', kind: 'factory', lat: 38.18, lng: -85.74, size: 5, meta: 'Louisville super-hub', operator: 'UPS', country: 'US' },
  { id: 'dhl-lej', factoryKind: 'distribution', name: 'DHL Hub Leipzig', kind: 'factory', lat: 51.42, lng: 12.24, size: 4, meta: 'EU air-hub', operator: 'DHL', country: 'DE' },
  { id: 'maersk-rtm', factoryKind: 'distribution', name: 'Maersk APM Rotterdam', kind: 'factory', lat: 51.95, lng: 4.05, size: 4, meta: 'Container terminal', operator: 'Maersk', country: 'NL' },

  // R&D
  { id: 'goog-x', factoryKind: 'rnd', name: 'Google X (Moonshot)', kind: 'factory', lat: 37.42, lng: -122.09, size: 4, meta: 'Waymo · Wing · Verily', operator: 'Alphabet', country: 'US' },
  { id: 'msft-research', factoryKind: 'rnd', name: 'Microsoft Research', kind: 'factory', lat: 47.64, lng: -122.14, size: 4, meta: 'AI · quantum', operator: 'Microsoft', country: 'US' },
  { id: 'nvda-research', factoryKind: 'rnd', name: 'NVIDIA Research', kind: 'factory', lat: 37.37, lng: -121.96, size: 4, meta: 'GPU + CUDA', operator: 'NVIDIA', country: 'US' },
  { id: 'cern', factoryKind: 'rnd', name: 'CERN', kind: 'factory', lat: 46.23, lng: 6.05, size: 5, meta: 'LHC · particle physics', operator: 'CERN', country: 'CH' },
  { id: 'mit', factoryKind: 'rnd', name: 'MIT Media Lab', kind: 'factory', lat: 42.36, lng: -71.09, size: 4, meta: 'CSAIL · Media Lab', operator: 'MIT', country: 'US' },
  { id: 'imec', factoryKind: 'rnd', name: 'imec Leuven', kind: 'factory', lat: 50.86, lng: 4.68, size: 4, meta: 'Semiconductor R&D', operator: 'imec', country: 'BE' },
  { id: 'aist', factoryKind: 'rnd', name: 'AIST Tsukuba', kind: 'factory', lat: 36.07, lng: 140.13, size: 3, meta: 'Industrial science', operator: 'AIST', country: 'JP' },
  { id: 'huawei-shenzhen', factoryKind: 'rnd', name: 'Huawei Songshan Lake', kind: 'factory', lat: 22.93, lng: 113.91, size: 4, meta: 'R&D campus', operator: 'Huawei', country: 'CN' },
];

export const FACTORY_COLOR: Record<FactoryKind, string> = {
  admin: 'hsl(220, 90%, 65%)',
  distribution: 'hsl(280, 70%, 65%)',
  manufacturing: 'hsl(28, 95%, 55%)',
  rnd: 'hsl(165, 80%, 55%)',
};

export const FACTORY_KIND_LABEL: Record<FactoryKind, string> = {
  admin: 'Administration',
  distribution: 'Distribution',
  manufacturing: 'Manufacturing',
  rnd: 'R&D',
};
