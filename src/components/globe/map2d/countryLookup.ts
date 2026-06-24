/**
 * Unified country metadata lookup for the Country Detail Drawer.
 * Merges centroids, names, flags, currencies, equity-index abbrs, and
 * sovereign ratings from the various scattered datasets.
 */
import { COUNTRY_CCY } from './markets';

export type CountryMeta = {
  iso: string;
  name: string;
  flag: string;
  currency?: string;
  capital?: string;
  lat: number;
  lng: number;
  rating?: string;        // S&P-style sovereign rating
  equityAbbr?: string;    // matches IndexQuote.abbr
  fredCpiKey?: string;    // FRED indicator key (when available)
};

// Flag from ISO-A2 via regional indicator codepoints.
export function flagOf(iso: string): string {
  if (!iso || iso.length !== 2) return '🏳️';
  const A = 0x1f1e6;
  return String.fromCodePoint(A + iso.charCodeAt(0) - 65) +
         String.fromCodePoint(A + iso.charCodeAt(1) - 65);
}

// Sovereign ratings (S&P, approx, curated).
const RATING: Record<string, string> = {
  US: 'AA+', CA: 'AAA', MX: 'BBB', BR: 'BB', AR: 'CCC', CL: 'A', CO: 'BB+', PE: 'BBB',
  GB: 'AA', DE: 'AAA', FR: 'AA-', IT: 'BBB', ES: 'A', PT: 'A-', NL: 'AAA', BE: 'AA',
  AT: 'AA+', GR: 'BBB-', IE: 'AA', CH: 'AAA', SE: 'AAA', NO: 'AAA', DK: 'AAA',
  PL: 'A-', CZ: 'AA-', HU: 'BBB-', RO: 'BBB-', TR: 'B+', RU: 'NR', UA: 'CCC',
  CN: 'A+', JP: 'A+', KR: 'AA', TW: 'AA+', HK: 'AA+', SG: 'AAA',
  TH: 'BBB+', ID: 'BBB', MY: 'A-', PH: 'BBB+', VN: 'BB+', IN: 'BBB-', PK: 'CCC+',
  AU: 'AAA', NZ: 'AA+', ZA: 'BB-', NG: 'B-', EG: 'B-', MA: 'BB+',
  AE: 'AA', SA: 'A+', QA: 'AA', IL: 'A',
};

// Centroids (lat, lng) — pulled from existing scattered datasets.
const CENTROID: Record<string, [number, number, string]> = {
  US: [38.9, -77.0, 'Washington'], CA: [45.4, -75.7, 'Ottawa'], MX: [19.4, -99.1, 'Mexico City'],
  BR: [-15.8, -47.9, 'Brasília'], AR: [-34.6, -58.4, 'Buenos Aires'], CL: [-33.5, -70.7, 'Santiago'],
  CO: [4.7, -74.1, 'Bogotá'], PE: [-12.0, -77.0, 'Lima'],
  GB: [51.5, -0.1, 'London'], DE: [52.5, 13.4, 'Berlin'], FR: [48.9, 2.4, 'Paris'],
  IT: [41.9, 12.5, 'Rome'], ES: [40.4, -3.7, 'Madrid'], PT: [38.7, -9.1, 'Lisbon'],
  GR: [38.0, 23.7, 'Athens'], IE: [53.3, -6.3, 'Dublin'], NL: [52.4, 4.9, 'Amsterdam'],
  BE: [50.8, 4.4, 'Brussels'], AT: [48.2, 16.4, 'Vienna'], FI: [60.2, 24.9, 'Helsinki'],
  CH: [46.9, 7.4, 'Bern'], SE: [59.3, 18.1, 'Stockholm'], NO: [59.9, 10.8, 'Oslo'],
  DK: [55.7, 12.6, 'Copenhagen'], PL: [52.2, 21.0, 'Warsaw'], CZ: [50.1, 14.4, 'Prague'],
  HU: [47.5, 19.0, 'Budapest'], RO: [44.4, 26.1, 'Bucharest'],
  TR: [39.9, 32.9, 'Ankara'], RU: [55.8, 37.6, 'Moscow'], UA: [50.5, 30.5, 'Kyiv'],
  CN: [39.9, 116.4, 'Beijing'], JP: [35.7, 139.7, 'Tokyo'], KR: [37.6, 127.0, 'Seoul'],
  TW: [25.0, 121.5, 'Taipei'], HK: [22.3, 114.2, 'Hong Kong'], SG: [1.3, 103.8, 'Singapore'],
  TH: [13.8, 100.5, 'Bangkok'], ID: [-6.2, 106.8, 'Jakarta'], MY: [3.1, 101.7, 'Kuala Lumpur'],
  PH: [14.6, 121.0, 'Manila'], VN: [21.0, 105.8, 'Hanoi'],
  IN: [28.6, 77.2, 'New Delhi'], PK: [33.7, 73.0, 'Islamabad'],
  AU: [-35.3, 149.1, 'Canberra'], NZ: [-41.3, 174.8, 'Wellington'],
  ZA: [-25.7, 28.2, 'Pretoria'], NG: [9.1, 7.5, 'Abuja'], EG: [30.0, 31.2, 'Cairo'],
  MA: [34.0, -6.8, 'Rabat'], KE: [-1.3, 36.8, 'Nairobi'],
  AE: [24.5, 54.4, 'Abu Dhabi'], SA: [24.7, 46.7, 'Riyadh'], QA: [25.3, 51.5, 'Doha'],
  IL: [31.8, 35.2, 'Jerusalem'],
};

const NAME: Record<string, string> = {
  US: 'United States', CA: 'Canada', MX: 'Mexico', BR: 'Brazil', AR: 'Argentina',
  CL: 'Chile', CO: 'Colombia', PE: 'Peru',
  GB: 'United Kingdom', DE: 'Germany', FR: 'France', IT: 'Italy', ES: 'Spain',
  PT: 'Portugal', GR: 'Greece', IE: 'Ireland', NL: 'Netherlands', BE: 'Belgium',
  AT: 'Austria', FI: 'Finland', CH: 'Switzerland', SE: 'Sweden', NO: 'Norway',
  DK: 'Denmark', PL: 'Poland', CZ: 'Czechia', HU: 'Hungary', RO: 'Romania',
  TR: 'Türkiye', RU: 'Russia', UA: 'Ukraine',
  CN: 'China', JP: 'Japan', KR: 'South Korea', TW: 'Taiwan', HK: 'Hong Kong',
  SG: 'Singapore', TH: 'Thailand', ID: 'Indonesia', MY: 'Malaysia', PH: 'Philippines',
  VN: 'Vietnam', IN: 'India', PK: 'Pakistan',
  AU: 'Australia', NZ: 'New Zealand',
  ZA: 'South Africa', NG: 'Nigeria', EG: 'Egypt', MA: 'Morocco', KE: 'Kenya',
  AE: 'United Arab Emirates', SA: 'Saudi Arabia', QA: 'Qatar', IL: 'Israel',
};

// Map ISO → equity index abbr used in IndexQuote / GlobeMarket.
const EQUITY: Record<string, string> = {
  US: 'SPX', CA: 'TSX', MX: 'MXX', BR: 'IBOV',
  GB: 'UKX', DE: 'DAX', FR: 'CAC', IT: 'FTSEMIB', ES: 'IBEX', NL: 'AEX',
  CH: 'SMI', SE: 'OMX',
  CN: 'SHCOMP', JP: 'NIKKEI', KR: 'KOSPI', TW: 'TWSE', HK: 'HSI', SG: 'STI',
  IN: 'NIFTY', AU: 'ASX', ZA: 'JSE', SA: 'TASI', AE: 'ADX', IL: 'TA35',
  TR: 'XU100', RU: 'IMOEX',
};

export const COUNTRY_META: Record<string, CountryMeta> = (() => {
  const out: Record<string, CountryMeta> = {};
  for (const iso of Object.keys(CENTROID)) {
    const [lat, lng, capital] = CENTROID[iso];
    out[iso] = {
      iso,
      name: NAME[iso] ?? iso,
      flag: flagOf(iso),
      currency: COUNTRY_CCY[iso],
      capital,
      lat, lng,
      rating: RATING[iso],
      equityAbbr: EQUITY[iso],
    };
  }
  return out;
})();

/** Build / extend a country meta entry on the fly from a clicked GeoJSON country. */
export function metaFromIso(iso: string, fallbackName?: string): CountryMeta {
  const m = COUNTRY_META[iso];
  if (m) return m;
  return {
    iso,
    name: fallbackName ?? iso,
    flag: flagOf(iso),
    currency: COUNTRY_CCY[iso],
    lat: 0, lng: 0,
  };
}

/** Nearest-centroid lookup for click hit-testing as a fallback. */
export function pickCountryAt(lat: number, lng: number): CountryMeta | null {
  let best: CountryMeta | null = null;
  let bestD = Infinity;
  for (const m of Object.values(COUNTRY_META)) {
    const dx = m.lng - lng;
    const dy = m.lat - lat;
    const d = dx * dx + dy * dy;
    if (d < bestD) { bestD = d; best = m; }
  }
  return best;
}
