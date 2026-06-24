/**
 * Agricultural commodity reference points: regional price/production hubs for
 * Canola, Wheat, Corn, Soy. Sample sites at major growing regions/exchanges.
 */
import type { PointFeature } from './infra';

export type CropKind = 'canola' | 'wheat' | 'corn' | 'soy' | 'rice' | 'sugar' | 'coffee' | 'cocoa' | 'cotton' | 'palmoil' | 'rubber';

export const AGRICULTURE: (PointFeature & { crop: CropKind; pricePerBu?: number })[] = [
  // Wheat
  { id: 'wheat-kansas', crop: 'wheat', pricePerBu: 5.85, name: 'Kansas Hard Red', kind: 'crop', lat: 38.50, lng: -98.50, size: 4, meta: '$5.85/bu HRW', country: 'US' },
  { id: 'wheat-paris', crop: 'wheat', pricePerBu: 5.30, name: 'Paris Milling Wheat', kind: 'crop', lat: 48.90, lng: 2.40, size: 4, meta: '€/t MATIF', country: 'FR' },
  { id: 'wheat-russia', crop: 'wheat', pricePerBu: 4.75, name: 'Black Sea Wheat', kind: 'crop', lat: 47.20, lng: 39.70, size: 5, meta: 'Rostov export', country: 'RU' },
  { id: 'wheat-ukraine', crop: 'wheat', pricePerBu: 4.60, name: 'Odesa Wheat Hub', kind: 'crop', lat: 46.48, lng: 30.74, size: 4, meta: 'Black Sea exporter', country: 'UA' },
  { id: 'wheat-australia', crop: 'wheat', pricePerBu: 6.10, name: 'WA Wheatbelt', kind: 'crop', lat: -31.50, lng: 117.00, size: 4, meta: 'Perth export', country: 'AU' },
  { id: 'wheat-india', crop: 'wheat', pricePerBu: 4.25, name: 'Punjab Wheat Belt', kind: 'crop', lat: 30.90, lng: 75.85, size: 4, meta: 'Largest producer Asia', country: 'IN' },

  // Corn
  { id: 'corn-iowa', crop: 'corn', pricePerBu: 4.35, name: 'Iowa Corn Belt', kind: 'crop', lat: 41.88, lng: -93.10, size: 5, meta: '$4.35/bu CBOT', country: 'US' },
  { id: 'corn-illinois', crop: 'corn', pricePerBu: 4.40, name: 'Illinois Corn Belt', kind: 'crop', lat: 40.00, lng: -89.00, size: 5, meta: 'Largest US state', country: 'US' },
  { id: 'corn-mato', crop: 'corn', pricePerBu: 4.10, name: 'Mato Grosso Safrinha', kind: 'crop', lat: -12.50, lng: -55.00, size: 5, meta: '2nd-crop corn BR', country: 'BR' },
  { id: 'corn-pampas', crop: 'corn', pricePerBu: 4.05, name: 'Pampas Corn', kind: 'crop', lat: -34.00, lng: -62.00, size: 4, meta: 'Argentine maize', country: 'AR' },
  { id: 'corn-jilin', crop: 'corn', pricePerBu: 4.50, name: 'Jilin Corn Belt', kind: 'crop', lat: 43.85, lng: 125.32, size: 4, meta: 'NE China', country: 'CN' },

  // Soy
  { id: 'soy-mato', crop: 'soy', pricePerBu: 12.80, name: 'Mato Grosso Soy', kind: 'crop', lat: -12.40, lng: -56.10, size: 5, meta: 'World #1 producer', country: 'BR' },
  { id: 'soy-illinois', crop: 'soy', pricePerBu: 13.10, name: 'Illinois Soy', kind: 'crop', lat: 40.30, lng: -89.30, size: 5, meta: '$13.10/bu CBOT', country: 'US' },
  { id: 'soy-iowa', crop: 'soy', pricePerBu: 13.05, name: 'Iowa Soy', kind: 'crop', lat: 41.95, lng: -93.30, size: 4, country: 'US' },
  { id: 'soy-rosario', crop: 'soy', pricePerBu: 12.65, name: 'Rosario Soy Hub', kind: 'crop', lat: -32.95, lng: -60.65, size: 5, meta: 'AR export terminal', country: 'AR' },
  { id: 'soy-paraguay', crop: 'soy', pricePerBu: 12.55, name: 'Paraguay Soy', kind: 'crop', lat: -25.30, lng: -56.50, size: 3, country: 'PY' },

  // Canola
  { id: 'canola-saskatchewan', crop: 'canola', pricePerBu: 14.50, name: 'Saskatchewan Canola', kind: 'crop', lat: 51.50, lng: -106.00, size: 5, meta: 'World #1', country: 'CA' },
  { id: 'canola-alberta', crop: 'canola', pricePerBu: 14.45, name: 'Alberta Canola', kind: 'crop', lat: 53.50, lng: -113.50, size: 4, country: 'CA' },
  { id: 'canola-manitoba', crop: 'canola', pricePerBu: 14.40, name: 'Manitoba Canola', kind: 'crop', lat: 50.00, lng: -98.00, size: 3, country: 'CA' },
  { id: 'canola-ndakota', crop: 'canola', pricePerBu: 14.30, name: 'North Dakota Canola', kind: 'crop', lat: 47.50, lng: -100.50, size: 3, country: 'US' },
  { id: 'canola-australia', crop: 'canola', pricePerBu: 14.80, name: 'WA Canola', kind: 'crop', lat: -32.50, lng: 117.50, size: 3, country: 'AU' },

  // Rice
  { id: 'rice-mekong', crop: 'rice', name: 'Mekong Delta Rice', kind: 'crop', lat: 10.20, lng: 105.80, size: 5, meta: 'Vietnam #1 export hub', country: 'VN' },
  { id: 'rice-thai-central', crop: 'rice', name: 'Central Thailand Rice', kind: 'crop', lat: 14.50, lng: 100.30, size: 5, meta: 'Jasmine rice', country: 'TH' },
  { id: 'rice-punjab-india', crop: 'rice', name: 'Punjab Rice Belt', kind: 'crop', lat: 30.85, lng: 75.70, size: 5, meta: 'Basmati · India #1 exporter', country: 'IN' },
  { id: 'rice-yangtze', crop: 'rice', name: 'Yangtze Basin Rice', kind: 'crop', lat: 30.50, lng: 113.00, size: 5, meta: 'China · Largest producer', country: 'CN' },
  { id: 'rice-java', crop: 'rice', name: 'Java Rice Belt', kind: 'crop', lat: -7.10, lng: 110.50, size: 4, meta: 'Indonesia', country: 'ID' },
  { id: 'rice-myanmar', crop: 'rice', name: 'Irrawaddy Delta', kind: 'crop', lat: 16.80, lng: 95.50, size: 4, meta: 'Myanmar rice hub', country: 'MM' },
  { id: 'rice-mississippi', crop: 'rice', name: 'Arkansas Rice Belt', kind: 'crop', lat: 34.80, lng: -91.20, size: 4, meta: 'US long-grain', country: 'US' },
  { id: 'rice-brazil-rs', crop: 'rice', name: 'Rio Grande do Sul Rice', kind: 'crop', lat: -30.00, lng: -51.00, size: 3, meta: 'Mercosur export', country: 'BR' },

  // Sugar
  { id: 'sugar-sao-paulo', crop: 'sugar', name: 'São Paulo Sugarcane', kind: 'crop', lat: -22.00, lng: -48.50, size: 5, meta: 'World #1 · Ethanol/sugar', country: 'BR' },
  { id: 'sugar-india-up', crop: 'sugar', name: 'Uttar Pradesh Sugarcane', kind: 'crop', lat: 26.50, lng: 80.50, size: 5, meta: 'India · #2 producer', country: 'IN' },
  { id: 'sugar-thai-khon', crop: 'sugar', name: 'Northeast Thailand Sugar', kind: 'crop', lat: 16.50, lng: 102.50, size: 4, meta: 'Major exporter', country: 'TH' },
  { id: 'sugar-queensland', crop: 'sugar', name: 'Queensland Sugarcane', kind: 'crop', lat: -20.00, lng: 146.50, size: 4, meta: 'AU raw sugar export', country: 'AU' },
  { id: 'sugar-cuba', crop: 'sugar', name: 'Cuba Sugar Belt', kind: 'crop', lat: 22.00, lng: -79.50, size: 3, meta: 'Historical #1', country: 'CU' },
  { id: 'sugar-florida', crop: 'sugar', name: 'Florida Everglades Sugar', kind: 'crop', lat: 26.50, lng: -80.80, size: 3, meta: 'US raw sugar', country: 'US' },

  // Coffee
  { id: 'coffee-minas', crop: 'coffee', name: 'Minas Gerais Coffee', kind: 'crop', lat: -19.50, lng: -44.50, size: 5, meta: 'Brazil · World #1 · arabica', country: 'BR' },
  { id: 'coffee-vietnam-highland', crop: 'coffee', name: 'Central Highlands Coffee', kind: 'crop', lat: 12.00, lng: 108.00, size: 5, meta: 'Robusta · World #2', country: 'VN' },
  { id: 'coffee-colombia', crop: 'coffee', name: 'Colombian Coffee Axis', kind: 'crop', lat: 4.80, lng: -75.80, size: 4, meta: 'Premium arabica', country: 'CO' },
  { id: 'coffee-ethiopia', crop: 'coffee', name: 'Ethiopian Highlands', kind: 'crop', lat: 7.50, lng: 36.80, size: 4, meta: 'Birthplace of coffee', country: 'ET' },
  { id: 'coffee-indonesia', crop: 'coffee', name: 'Sumatra Coffee', kind: 'crop', lat: 1.50, lng: 99.00, size: 4, meta: 'Mandailing/Lintong', country: 'ID' },
  { id: 'coffee-honduras', crop: 'coffee', name: 'Honduras Coffee', kind: 'crop', lat: 14.50, lng: -87.20, size: 3, meta: 'C.America export', country: 'HN' },

  // Cocoa
  { id: 'cocoa-ivory-coast', crop: 'cocoa', name: "Côte d'Ivoire Cocoa Belt", kind: 'crop', lat: 6.40, lng: -5.50, size: 5, meta: 'World #1 · ~40% global supply', country: 'CI' },
  { id: 'cocoa-ghana', crop: 'cocoa', name: 'Ghana Cocoa Belt', kind: 'crop', lat: 6.80, lng: -2.00, size: 5, meta: 'World #2 · high quality', country: 'GH' },
  { id: 'cocoa-ecuador', crop: 'cocoa', name: 'Ecuador Fine Cocoa', kind: 'crop', lat: -1.80, lng: -79.00, size: 3, meta: 'Premium Arriba', country: 'EC' },
  { id: 'cocoa-indonesia-sul', crop: 'cocoa', name: 'Sulawesi Cocoa', kind: 'crop', lat: -1.50, lng: 120.00, size: 3, meta: 'Indonesia bulk', country: 'ID' },
  { id: 'cocoa-nigeria', crop: 'cocoa', name: 'SW Nigeria Cocoa', kind: 'crop', lat: 7.20, lng: 4.50, size: 3, meta: 'Africa #3', country: 'NG' },
  { id: 'cocoa-cameroon', crop: 'cocoa', name: 'SW Cameroon Cocoa', kind: 'crop', lat: 4.20, lng: 9.50, size: 3, meta: 'Africa #4', country: 'CM' },

  // Cotton
  { id: 'cotton-xinjiang', crop: 'cotton', name: 'Xinjiang Cotton', kind: 'crop', lat: 40.50, lng: 82.00, size: 5, meta: '85% of China production', country: 'CN' },
  { id: 'cotton-texas', crop: 'cotton', name: 'Texas Cotton Belt', kind: 'crop', lat: 33.00, lng: -101.00, size: 5, meta: 'US #1 · High Plains', country: 'US' },
  { id: 'cotton-india-gujarat', crop: 'cotton', name: 'Gujarat Cotton Belt', kind: 'crop', lat: 22.50, lng: 72.00, size: 5, meta: 'India #1 state', country: 'IN' },
  { id: 'cotton-pakistan-sindh', crop: 'cotton', name: 'Sindh Cotton', kind: 'crop', lat: 25.80, lng: 68.50, size: 4, meta: 'Pakistan major', country: 'PK' },
  { id: 'cotton-uzbekistan', crop: 'cotton', name: 'Uzbekistan Cotton', kind: 'crop', lat: 40.50, lng: 63.00, size: 4, meta: 'White gold', country: 'UZ' },
  { id: 'cotton-brazil-mt', crop: 'cotton', name: 'Mato Grosso Cotton', kind: 'crop', lat: -12.00, lng: -55.50, size: 4, meta: 'Brazil fast-growing', country: 'BR' },

  // Palm Oil
  { id: 'palm-kalimantan', crop: 'palmoil', name: 'Kalimantan Palm Oil', kind: 'crop', lat: -1.00, lng: 113.00, size: 5, meta: 'Indonesia · World #1 ~60%', country: 'ID' },
  { id: 'palm-sumatra', crop: 'palmoil', name: 'Sumatra Palm Oil', kind: 'crop', lat: 0.00, lng: 101.50, size: 5, meta: 'Riau province hub', country: 'ID' },
  { id: 'palm-sabah', crop: 'palmoil', name: 'Sabah Palm Oil', kind: 'crop', lat: 5.50, lng: 117.00, size: 4, meta: 'Malaysia #1 state', country: 'MY' },
  { id: 'palm-sarawak', crop: 'palmoil', name: 'Sarawak Palm Oil', kind: 'crop', lat: 2.50, lng: 113.00, size: 4, meta: 'Malaysia', country: 'MY' },
  { id: 'palm-ghana-w', crop: 'palmoil', name: 'W. Africa Oil Palm Belt', kind: 'crop', lat: 6.00, lng: -1.20, size: 3, meta: 'Nigeria/Ghana', country: 'GH' },

  // Rubber
  { id: 'rubber-thailand-south', crop: 'rubber', name: 'Southern Thailand Rubber', kind: 'crop', lat: 7.50, lng: 99.80, size: 5, meta: 'World #1 producer', country: 'TH' },
  { id: 'rubber-sumatra-rubber', crop: 'rubber', name: 'Sumatra Rubber Belt', kind: 'crop', lat: 2.00, lng: 103.00, size: 4, meta: 'Indonesia', country: 'ID' },
  { id: 'rubber-vietnam-southeast', crop: 'rubber', name: 'SE Vietnam Rubber', kind: 'crop', lat: 11.00, lng: 107.00, size: 4, meta: 'Vietnam', country: 'VN' },
  { id: 'rubber-malaysia-west', crop: 'rubber', name: 'West Malaysia Rubber', kind: 'crop', lat: 3.00, lng: 101.50, size: 3, meta: 'Natural rubber SMR', country: 'MY' },
  { id: 'rubber-liberia', crop: 'rubber', name: 'Liberia Rubber Plantations', kind: 'crop', lat: 6.30, lng: -9.50, size: 3, meta: 'Firestone legacy', country: 'LR' },
];

export const CROP_COLOR: Record<CropKind, string> = {
  canola:  'hsl(50, 95%, 55%)',
  wheat:   'hsl(40, 75%, 60%)',
  corn:    'hsl(48, 100%, 50%)',
  soy:     'hsl(80, 60%, 50%)',
  rice:    'hsl(100, 50%, 65%)',
  sugar:   'hsl(320, 80%, 65%)',
  coffee:  'hsl(22, 80%, 45%)',
  cocoa:   'hsl(18, 70%, 38%)',
  cotton:  'hsl(200, 20%, 85%)',
  palmoil: 'hsl(90, 70%, 42%)',
  rubber:  'hsl(140, 40%, 50%)',
};

export const CROP_LABEL: Record<CropKind, string> = {
  canola:  'Canola',
  wheat:   'Wheat',
  corn:    'Corn',
  soy:     'Soybeans',
  rice:    'Rice',
  sugar:   'Sugar',
  coffee:  'Coffee',
  cocoa:   'Cocoa',
  cotton:  'Cotton',
  palmoil: 'Palm Oil',
  rubber:  'Rubber',
};
