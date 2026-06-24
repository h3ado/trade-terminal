/**
 * Geopolitics layer: sanctioned countries (ISO-A2) and curated bilateral
 * trade-flow arcs (top global goods flows, billions USD/yr, approx).
 */
import type { LngLat } from './infra';

export const SANCTIONED_COUNTRIES: Set<string> = new Set([
  'RU', 'IR', 'KP', 'SY', 'CU', 'VE', 'BY', 'MM',
]);

export const SANCTION_TIER: Record<string, 'COMPREHENSIVE' | 'SECTORAL' | 'TARGETED'> = {
  RU: 'SECTORAL', IR: 'COMPREHENSIVE', KP: 'COMPREHENSIVE', SY: 'COMPREHENSIVE',
  CU: 'COMPREHENSIVE', VE: 'SECTORAL', BY: 'SECTORAL', MM: 'TARGETED',
};

export type TradeFlow = {
  id: string;
  from: string;            // ISO-A2 (or display label)
  to: string;
  fromLngLat: LngLat;
  toLngLat: LngLat;
  valueUsdB: number;       // annual goods trade $B
  category?: 'goods' | 'energy' | 'tech';
};

// Approximate centroids for trade origin/destination.
const C: Record<string, LngLat> = {
  US: [-98, 39], CA: [-95, 56], MX: [-102, 23], BR: [-52, -10],
  CN: [105, 35], JP: [138, 36], KR: [128, 36], TW: [121, 24], IN: [78, 22], VN: [108, 16],
  DE: [10, 51], FR: [2.5, 47], UK: [-2, 54], NL: [5, 52], IT: [12, 42], CH: [8, 47],
  RU: [50, 60], TR: [35, 39], SA: [45, 24], AE: [54, 24], QA: [51, 25],
  AU: [134, -25], ID: [113, -2], TH: [101, 15], MY: [110, 4],
  ZA: [25, -29], NG: [8, 10], EG: [30, 27], DZ: [3, 28],
  CL: [-71, -30], PE: [-75, -10], AR: [-64, -38], CO: [-74, 4],
};

export const TRADE_FLOWS: TradeFlow[] = [
  { id: 'cn-us', from: 'CN', to: 'US', fromLngLat: C.CN, toLngLat: C.US, valueUsdB: 580, category: 'goods' },
  { id: 'us-cn', from: 'US', to: 'CN', fromLngLat: C.US, toLngLat: C.CN, valueUsdB: 148, category: 'goods' },
  { id: 'mx-us', from: 'MX', to: 'US', fromLngLat: C.MX, toLngLat: C.US, valueUsdB: 475, category: 'goods' },
  { id: 'ca-us', from: 'CA', to: 'US', fromLngLat: C.CA, toLngLat: C.US, valueUsdB: 421, category: 'goods' },
  { id: 'us-ca', from: 'US', to: 'CA', fromLngLat: C.US, toLngLat: C.CA, valueUsdB: 354, category: 'goods' },
  { id: 'de-us', from: 'DE', to: 'US', fromLngLat: C.DE, toLngLat: C.US, valueUsdB: 162, category: 'goods' },
  { id: 'jp-us', from: 'JP', to: 'US', fromLngLat: C.JP, toLngLat: C.US, valueUsdB: 145, category: 'goods' },
  { id: 'kr-us', from: 'KR', to: 'US', fromLngLat: C.KR, toLngLat: C.US, valueUsdB: 116, category: 'goods' },
  { id: 'vn-us', from: 'VN', to: 'US', fromLngLat: C.VN, toLngLat: C.US, valueUsdB: 114, category: 'goods' },
  { id: 'tw-us', from: 'TW', to: 'US', fromLngLat: C.TW, toLngLat: C.US, valueUsdB: 88, category: 'tech' },
  { id: 'in-us', from: 'IN', to: 'US', fromLngLat: C.IN, toLngLat: C.US, valueUsdB: 87, category: 'goods' },
  { id: 'cn-de', from: 'CN', to: 'DE', fromLngLat: C.CN, toLngLat: C.DE, valueUsdB: 197, category: 'goods' },
  { id: 'de-cn', from: 'DE', to: 'CN', fromLngLat: C.DE, toLngLat: C.CN, valueUsdB: 109, category: 'goods' },
  { id: 'cn-jp', from: 'CN', to: 'JP', fromLngLat: C.CN, toLngLat: C.JP, valueUsdB: 158, category: 'goods' },
  { id: 'jp-cn', from: 'JP', to: 'CN', fromLngLat: C.JP, toLngLat: C.CN, valueUsdB: 137, category: 'goods' },
  { id: 'cn-kr', from: 'CN', to: 'KR', fromLngLat: C.CN, toLngLat: C.KR, valueUsdB: 162, category: 'goods' },
  { id: 'kr-cn', from: 'KR', to: 'CN', fromLngLat: C.KR, toLngLat: C.CN, valueUsdB: 124, category: 'goods' },
  { id: 'sa-cn', from: 'SA', to: 'CN', fromLngLat: C.SA, toLngLat: C.CN, valueUsdB: 78, category: 'energy' },
  { id: 'ru-cn', from: 'RU', to: 'CN', fromLngLat: C.RU, toLngLat: C.CN, valueUsdB: 130, category: 'energy' },
  { id: 'cn-ru', from: 'CN', to: 'RU', fromLngLat: C.CN, toLngLat: C.RU, valueUsdB: 110, category: 'goods' },
  { id: 'au-cn', from: 'AU', to: 'CN', fromLngLat: C.AU, toLngLat: C.CN, valueUsdB: 124, category: 'energy' },
  { id: 'br-cn', from: 'BR', to: 'CN', fromLngLat: C.BR, toLngLat: C.CN, valueUsdB: 105, category: 'goods' },
  { id: 'cl-cn', from: 'CL', to: 'CN', fromLngLat: C.CL, toLngLat: C.CN, valueUsdB: 39, category: 'goods' },
  { id: 'qa-jp', from: 'QA', to: 'JP', fromLngLat: C.QA, toLngLat: C.JP, valueUsdB: 17, category: 'energy' },
  { id: 'ae-in', from: 'AE', to: 'IN', fromLngLat: C.AE, toLngLat: C.IN, valueUsdB: 53, category: 'energy' },
  { id: 'us-uk', from: 'US', to: 'UK', fromLngLat: C.US, toLngLat: C.UK, valueUsdB: 76, category: 'goods' },
  { id: 'uk-us', from: 'UK', to: 'US', fromLngLat: C.UK, toLngLat: C.US, valueUsdB: 64, category: 'goods' },
  { id: 'fr-de', from: 'FR', to: 'DE', fromLngLat: C.FR, toLngLat: C.DE, valueUsdB: 88, category: 'goods' },
  { id: 'nl-de', from: 'NL', to: 'DE', fromLngLat: C.NL, toLngLat: C.DE, valueUsdB: 113, category: 'goods' },
  { id: 'tr-de', from: 'TR', to: 'DE', fromLngLat: C.TR, toLngLat: C.DE, valueUsdB: 28, category: 'goods' },
];

export const TRADE_CATEGORY_COLOR: Record<NonNullable<TradeFlow['category']>, string> = {
  goods: 'hsl(195, 90%, 60%)',
  energy: 'hsl(28, 95%, 55%)',
  tech: 'hsl(280, 75%, 65%)',
};
