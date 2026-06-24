/**
 * Major retail chain reference points — Supermarkets, Restaurants, General
 * Merchandise, Discount, Apparel. Sample of flagship/HQ/regional sites.
 */
import type { PointFeature } from './infra';

export type RetailKind = 'super' | 'rest' | 'gen' | 'disc' | 'app';

export const RETAIL: (PointFeature & { retailKind: RetailKind })[] = [
  // Supermarkets
  { id: 'kroger-hq', retailKind: 'super', name: 'Kroger HQ Cincinnati', kind: 'retail', lat: 39.10, lng: -84.51, size: 4, operator: 'Kroger', country: 'US' },
  { id: 'wfm-austin', retailKind: 'super', name: 'Whole Foods HQ', kind: 'retail', lat: 30.27, lng: -97.74, size: 3, operator: 'Whole Foods', country: 'US' },
  { id: 'tesco-hq', retailKind: 'super', name: 'Tesco HQ Welwyn', kind: 'retail', lat: 51.81, lng: -0.20, size: 4, operator: 'Tesco', country: 'UK' },
  { id: 'carrefour-hq', retailKind: 'super', name: 'Carrefour HQ Massy', kind: 'retail', lat: 48.73, lng: 2.27, size: 4, operator: 'Carrefour', country: 'FR' },
  { id: 'aldi-essen', retailKind: 'super', name: 'Aldi Süd HQ', kind: 'retail', lat: 51.45, lng: 6.99, size: 4, operator: 'Aldi', country: 'DE' },
  { id: 'lidl-hq', retailKind: 'super', name: 'Lidl HQ Neckarsulm', kind: 'retail', lat: 49.20, lng: 9.22, size: 4, operator: 'Lidl', country: 'DE' },
  { id: 'aeon-hq', retailKind: 'super', name: 'Aeon HQ Chiba', kind: 'retail', lat: 35.65, lng: 140.04, size: 4, operator: 'Aeon', country: 'JP' },

  // Restaurants
  { id: 'mcd-chi', retailKind: 'rest', name: 'McDonald\'s HQ Chicago', kind: 'retail', lat: 41.88, lng: -87.66, size: 4, operator: 'McDonald\'s', country: 'US' },
  { id: 'sbux-seattle', retailKind: 'rest', name: 'Starbucks HQ', kind: 'retail', lat: 47.58, lng: -122.34, size: 4, operator: 'Starbucks', country: 'US' },
  { id: 'yum-louisville', retailKind: 'rest', name: 'Yum! Brands HQ', kind: 'retail', lat: 38.21, lng: -85.59, size: 4, operator: 'Yum!', country: 'US' },
  { id: 'qsr-toronto', retailKind: 'rest', name: 'Restaurant Brands Intl HQ', kind: 'retail', lat: 43.65, lng: -79.38, size: 3, operator: 'RBI', country: 'CA' },
  { id: 'cmg-newport', retailKind: 'rest', name: 'Chipotle HQ', kind: 'retail', lat: 33.61, lng: -117.92, size: 3, operator: 'Chipotle', country: 'US' },

  // General Merchandise
  { id: 'wmt-bentonville', retailKind: 'gen', name: 'Walmart HQ Bentonville', kind: 'retail', lat: 36.37, lng: -94.21, size: 5, operator: 'Walmart', country: 'US' },
  { id: 'tgt-mpls', retailKind: 'gen', name: 'Target HQ Minneapolis', kind: 'retail', lat: 44.97, lng: -93.27, size: 4, operator: 'Target', country: 'US' },
  { id: 'cost-issaquah', retailKind: 'gen', name: 'Costco HQ', kind: 'retail', lat: 47.54, lng: -122.04, size: 4, operator: 'Costco', country: 'US' },
  { id: 'amzn-go-nyc', retailKind: 'gen', name: 'Amazon Fresh NYC', kind: 'retail', lat: 40.74, lng: -73.99, size: 3, operator: 'Amazon', country: 'US' },

  // Discount
  { id: 'dg-goodlettsville', retailKind: 'disc', name: 'Dollar General HQ', kind: 'retail', lat: 36.32, lng: -86.71, size: 4, operator: 'Dollar General', country: 'US' },
  { id: 'dltr-chesapeake', retailKind: 'disc', name: 'Dollar Tree HQ', kind: 'retail', lat: 36.81, lng: -76.21, size: 3, operator: 'Dollar Tree', country: 'US' },
  { id: 'fived-cincy', retailKind: 'disc', name: 'Five Below HQ', kind: 'retail', lat: 39.95, lng: -75.16, size: 3, operator: 'Five Below', country: 'US' },

  // Apparel
  { id: 'nke-beaverton', retailKind: 'app', name: 'Nike HQ Beaverton', kind: 'retail', lat: 45.51, lng: -122.83, size: 4, operator: 'Nike', country: 'US' },
  { id: 'adi-herzo', retailKind: 'app', name: 'Adidas HQ Herzogenaurach', kind: 'retail', lat: 49.57, lng: 10.88, size: 4, operator: 'Adidas', country: 'DE' },
  { id: 'lulu-vancouver', retailKind: 'app', name: 'Lululemon HQ', kind: 'retail', lat: 49.27, lng: -123.13, size: 3, operator: 'Lululemon', country: 'CA' },
  { id: 'inditex-arteixo', retailKind: 'app', name: 'Inditex HQ (Zara)', kind: 'retail', lat: 43.30, lng: -8.51, size: 4, operator: 'Inditex', country: 'ES' },
  { id: 'hm-stockholm', retailKind: 'app', name: 'H&M HQ Stockholm', kind: 'retail', lat: 59.32, lng: 18.06, size: 4, operator: 'H&M', country: 'SE' },
  { id: 'uniqlo-tokyo', retailKind: 'app', name: 'Uniqlo HQ', kind: 'retail', lat: 35.66, lng: 139.70, size: 4, operator: 'Fast Retailing', country: 'JP' },
];

export const RETAIL_COLOR: Record<RetailKind, string> = {
  super: 'hsl(150, 75%, 55%)',
  rest: 'hsl(0, 80%, 60%)',
  gen: 'hsl(220, 80%, 60%)',
  disc: 'hsl(40, 95%, 55%)',
  app: 'hsl(310, 75%, 65%)',
};

export const RETAIL_KIND_LABEL: Record<RetailKind, string> = {
  super: 'Supermarkets',
  rest: 'Restaurants',
  gen: 'General Merch',
  disc: 'Discount',
  app: 'Apparel',
};
