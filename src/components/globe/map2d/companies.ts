/**
 * Corporate HQs for the largest publicly-traded companies (~80 names).
 * Coordinates are HQ city; market cap is approximate (USD billions). Used for
 * the "Companies & Markets" Bloomberg MAPS layer.
 */
export type Sector =
  | 'tech' | 'finance' | 'energy' | 'health' | 'consumer'
  | 'industrial' | 'comm' | 'auto' | 'retail';

export type CompanyHQ = {
  id: string;
  name: string;
  ticker: string;
  sector: Sector;
  mcapB: number; // USD billions
  lat: number;
  lng: number;
  country: string;
};

export const SECTOR_COLOR: Record<Sector, string> = {
  tech:       'hsl(195, 90%, 60%)',
  finance:    'hsl(33, 100%, 55%)',
  energy:     'hsl(28, 95%, 55%)',
  health:     'hsl(150, 80%, 55%)',
  consumer:   'hsl(280, 75%, 65%)',
  industrial: 'hsl(45, 85%, 55%)',
  comm:       'hsl(220, 90%, 70%)',
  auto:       'hsl(0, 80%, 60%)',
  retail:     'hsl(165, 80%, 55%)',
};

export const SECTOR_LABEL: Record<Sector, string> = {
  tech: 'Technology', finance: 'Financials', energy: 'Energy', health: 'Healthcare',
  consumer: 'Consumer', industrial: 'Industrials', comm: 'Communications',
  auto: 'Automotive', retail: 'Retail',
};

export const COMPANIES: CompanyHQ[] = [
  // ── US Tech megacaps ──
  { id: 'aapl', name: 'Apple',    ticker: 'AAPL', sector: 'tech', mcapB: 3400, lat: 37.3349, lng: -122.0090, country: 'US' },
  { id: 'msft', name: 'Microsoft', ticker: 'MSFT', sector: 'tech', mcapB: 3100, lat: 47.6396, lng: -122.1281, country: 'US' },
  { id: 'nvda', name: 'NVIDIA',   ticker: 'NVDA', sector: 'tech', mcapB: 3300, lat: 37.3705, lng: -121.9636, country: 'US' },
  { id: 'googl', name: 'Alphabet', ticker: 'GOOGL', sector: 'tech', mcapB: 2100, lat: 37.4220, lng: -122.0841, country: 'US' },
  { id: 'meta', name: 'Meta',      ticker: 'META', sector: 'comm', mcapB: 1500, lat: 37.4847, lng: -122.1477, country: 'US' },
  { id: 'amzn', name: 'Amazon',    ticker: 'AMZN', sector: 'consumer', mcapB: 1900, lat: 47.6228, lng: -122.3364, country: 'US' },
  { id: 'tsla', name: 'Tesla',     ticker: 'TSLA', sector: 'auto', mcapB: 1100, lat: 30.2225, lng: -97.6173, country: 'US' },
  { id: 'orcl', name: 'Oracle',    ticker: 'ORCL', sector: 'tech', mcapB: 500,  lat: 30.2240, lng: -97.7430, country: 'US' },
  { id: 'crm',  name: 'Salesforce', ticker: 'CRM', sector: 'tech', mcapB: 300, lat: 37.7898, lng: -122.3942, country: 'US' },
  { id: 'avgo', name: 'Broadcom',  ticker: 'AVGO', sector: 'tech', mcapB: 800, lat: 37.4071, lng: -121.9783, country: 'US' },
  { id: 'amd',  name: 'AMD',       ticker: 'AMD',  sector: 'tech', mcapB: 250, lat: 37.3733, lng: -121.9779, country: 'US' },
  { id: 'intc', name: 'Intel',     ticker: 'INTC', sector: 'tech', mcapB: 100, lat: 37.3875, lng: -121.9636, country: 'US' },
  { id: 'adbe', name: 'Adobe',     ticker: 'ADBE', sector: 'tech', mcapB: 220, lat: 37.3308, lng: -121.8932, country: 'US' },
  { id: 'nflx', name: 'Netflix',   ticker: 'NFLX', sector: 'comm', mcapB: 280, lat: 37.2566, lng: -121.9614, country: 'US' },

  // ── US Finance ──
  { id: 'jpm',  name: 'JPMorgan Chase', ticker: 'JPM', sector: 'finance', mcapB: 600, lat: 40.7549, lng: -73.9707, country: 'US' },
  { id: 'bac',  name: 'Bank of America', ticker: 'BAC', sector: 'finance', mcapB: 320, lat: 35.2271, lng: -80.8431, country: 'US' },
  { id: 'wfc',  name: 'Wells Fargo', ticker: 'WFC', sector: 'finance', mcapB: 220, lat: 37.7896, lng: -122.4011, country: 'US' },
  { id: 'gs',   name: 'Goldman Sachs', ticker: 'GS', sector: 'finance', mcapB: 150, lat: 40.7148, lng: -74.0145, country: 'US' },
  { id: 'ms',   name: 'Morgan Stanley', ticker: 'MS', sector: 'finance', mcapB: 170, lat: 40.7616, lng: -73.9842, country: 'US' },
  { id: 'brk',  name: 'Berkshire Hathaway', ticker: 'BRK.A', sector: 'finance', mcapB: 950, lat: 41.2596, lng: -95.9396, country: 'US' },
  { id: 'v',    name: 'Visa', ticker: 'V', sector: 'finance', mcapB: 540, lat: 37.7780, lng: -122.4174, country: 'US' },
  { id: 'ma',   name: 'Mastercard', ticker: 'MA', sector: 'finance', mcapB: 420, lat: 41.0270, lng: -73.7167, country: 'US' },

  // ── US Healthcare ──
  { id: 'lly',  name: 'Eli Lilly', ticker: 'LLY', sector: 'health', mcapB: 700, lat: 39.7777, lng: -86.1763, country: 'US' },
  { id: 'jnj',  name: 'Johnson & Johnson', ticker: 'JNJ', sector: 'health', mcapB: 380, lat: 40.4974, lng: -74.4470, country: 'US' },
  { id: 'unh',  name: 'UnitedHealth', ticker: 'UNH', sector: 'health', mcapB: 450, lat: 44.9716, lng: -93.4423, country: 'US' },
  { id: 'pfe',  name: 'Pfizer', ticker: 'PFE', sector: 'health', mcapB: 160, lat: 40.7434, lng: -73.9710, country: 'US' },
  { id: 'mrk',  name: 'Merck', ticker: 'MRK', sector: 'health', mcapB: 250, lat: 40.7170, lng: -74.4096, country: 'US' },
  { id: 'abbv', name: 'AbbVie', ticker: 'ABBV', sector: 'health', mcapB: 320, lat: 42.1712, lng: -87.8472, country: 'US' },

  // ── US Energy ──
  { id: 'xom',  name: 'ExxonMobil', ticker: 'XOM', sector: 'energy', mcapB: 480, lat: 32.9489, lng: -96.8259, country: 'US' },
  { id: 'cvx',  name: 'Chevron',    ticker: 'CVX', sector: 'energy', mcapB: 290, lat: 37.8716, lng: -122.2727, country: 'US' },
  { id: 'cop',  name: 'ConocoPhillips', ticker: 'COP', sector: 'energy', mcapB: 130, lat: 29.7374, lng: -95.4604, country: 'US' },

  // ── US Retail/Consumer ──
  { id: 'wmt',  name: 'Walmart', ticker: 'WMT', sector: 'retail', mcapB: 700, lat: 36.3729, lng: -94.2088, country: 'US' },
  { id: 'cost', name: 'Costco', ticker: 'COST', sector: 'retail', mcapB: 400, lat: 47.6694, lng: -122.2024, country: 'US' },
  { id: 'hd',   name: 'Home Depot', ticker: 'HD', sector: 'retail', mcapB: 410, lat: 33.8869, lng: -84.4717, country: 'US' },
  { id: 'pg',   name: 'P&G', ticker: 'PG', sector: 'consumer', mcapB: 410, lat: 39.1041, lng: -84.5184, country: 'US' },
  { id: 'ko',   name: 'Coca-Cola', ticker: 'KO', sector: 'consumer', mcapB: 280, lat: 33.7770, lng: -84.3909, country: 'US' },
  { id: 'pep',  name: 'PepsiCo', ticker: 'PEP', sector: 'consumer', mcapB: 230, lat: 41.0334, lng: -73.7167, country: 'US' },
  { id: 'mcd',  name: "McDonald's", ticker: 'MCD', sector: 'retail', mcapB: 210, lat: 41.8859, lng: -87.6228, country: 'US' },

  // ── EU ──
  { id: 'nvo',  name: 'Novo Nordisk', ticker: 'NVO', sector: 'health', mcapB: 480, lat: 55.7700, lng: 12.5450, country: 'DK' },
  { id: 'asml', name: 'ASML',         ticker: 'ASML', sector: 'tech', mcapB: 320, lat: 51.4108, lng: 5.4538, country: 'NL' },
  { id: 'sap',  name: 'SAP',          ticker: 'SAP', sector: 'tech', mcapB: 280, lat: 49.2933, lng: 8.6429, country: 'DE' },
  { id: 'lvmh', name: 'LVMH',         ticker: 'MC.PA', sector: 'consumer', mcapB: 380, lat: 48.8651, lng: 2.3074, country: 'FR' },
  { id: 'tte',  name: 'TotalEnergies', ticker: 'TTE', sector: 'energy', mcapB: 160, lat: 48.8970, lng: 2.2483, country: 'FR' },
  { id: 'shel', name: 'Shell',        ticker: 'SHEL', sector: 'energy', mcapB: 220, lat: 51.5074, lng: -0.1278, country: 'GB' },
  { id: 'bp',   name: 'BP',           ticker: 'BP',   sector: 'energy', mcapB: 100, lat: 51.5036, lng: -0.1542, country: 'GB' },
  { id: 'hsbc', name: 'HSBC',         ticker: 'HSBC', sector: 'finance', mcapB: 170, lat: 51.5044, lng: -0.0188, country: 'GB' },
  { id: 'azn',  name: 'AstraZeneca',  ticker: 'AZN',  sector: 'health', mcapB: 220, lat: 52.1762, lng: 0.1431, country: 'GB' },
  { id: 'roche', name: 'Roche',       ticker: 'ROG.SW', sector: 'health', mcapB: 240, lat: 47.5667, lng: 7.6000, country: 'CH' },
  { id: 'novn', name: 'Novartis',     ticker: 'NVS',  sector: 'health', mcapB: 230, lat: 47.5611, lng: 7.5901, country: 'CH' },
  { id: 'ubs',  name: 'UBS',          ticker: 'UBS',  sector: 'finance', mcapB: 100, lat: 47.3667, lng: 8.5409, country: 'CH' },
  { id: 'nestle', name: 'Nestlé',     ticker: 'NESN.SW', sector: 'consumer', mcapB: 270, lat: 46.4663, lng: 6.8454, country: 'CH' },
  { id: 'sieg', name: 'Siemens',      ticker: 'SIE.DE', sector: 'industrial', mcapB: 140, lat: 48.1439, lng: 11.5800, country: 'DE' },
  { id: 'volkswagen', name: 'Volkswagen', ticker: 'VOW.DE', sector: 'auto', mcapB: 60, lat: 52.4275, lng: 10.7872, country: 'DE' },
  { id: 'bmw', name: 'BMW',           ticker: 'BMW.DE', sector: 'auto', mcapB: 65, lat: 48.1768, lng: 11.5563, country: 'DE' },
  { id: 'mercedes', name: 'Mercedes-Benz', ticker: 'MBG.DE', sector: 'auto', mcapB: 75, lat: 48.7758, lng: 9.1829, country: 'DE' },

  // ── Asia ──
  { id: 'tsmc', name: 'TSMC',     ticker: 'TSM',  sector: 'tech', mcapB: 950, lat: 24.7745, lng: 121.0156, country: 'TW' },
  { id: 'samsung', name: 'Samsung Electronics', ticker: '005930.KS', sector: 'tech', mcapB: 380, lat: 37.2581, lng: 127.0436, country: 'KR' },
  { id: 'tencent', name: 'Tencent', ticker: '0700.HK', sector: 'comm', mcapB: 470, lat: 22.5395, lng: 113.9342, country: 'CN' },
  { id: 'baba', name: 'Alibaba',  ticker: 'BABA', sector: 'consumer', mcapB: 220, lat: 30.1820, lng: 120.1980, country: 'CN' },
  { id: 'icbc', name: 'ICBC',     ticker: '1398.HK', sector: 'finance', mcapB: 230, lat: 39.9105, lng: 116.4314, country: 'CN' },
  { id: 'cmb',  name: 'China Merchants Bank', ticker: '600036.SS', sector: 'finance', mcapB: 130, lat: 22.5266, lng: 113.9302, country: 'CN' },
  { id: 'ccb',  name: 'CCB',      ticker: '0939.HK', sector: 'finance', mcapB: 170, lat: 39.9050, lng: 116.4144, country: 'CN' },
  { id: 'pingan', name: 'Ping An', ticker: '2318.HK', sector: 'finance', mcapB: 130, lat: 22.5410, lng: 114.0532, country: 'CN' },
  { id: 'cnpc', name: 'PetroChina', ticker: '0857.HK', sector: 'energy', mcapB: 220, lat: 39.9136, lng: 116.3717, country: 'CN' },
  { id: 'sinopec', name: 'Sinopec', ticker: '0386.HK', sector: 'energy', mcapB: 90, lat: 39.9100, lng: 116.4220, country: 'CN' },
  { id: 'reliance', name: 'Reliance Industries', ticker: 'RELIANCE.NS', sector: 'energy', mcapB: 220, lat: 19.0596, lng: 72.8295, country: 'IN' },
  { id: 'tcs',  name: 'Tata Consultancy', ticker: 'TCS.NS', sector: 'tech', mcapB: 170, lat: 19.0760, lng: 72.8777, country: 'IN' },
  { id: 'infy', name: 'Infosys',  ticker: 'INFY', sector: 'tech', mcapB: 90,  lat: 12.9435, lng: 77.6680, country: 'IN' },
  { id: 'hdfc', name: 'HDFC Bank', ticker: 'HDB',  sector: 'finance', mcapB: 160, lat: 19.0760, lng: 72.8777, country: 'IN' },
  { id: 'toyota', name: 'Toyota', ticker: '7203.T', sector: 'auto', mcapB: 280, lat: 35.0833, lng: 137.1567, country: 'JP' },
  { id: 'sony', name: 'Sony',     ticker: '6758.T', sector: 'tech', mcapB: 110, lat: 35.6304, lng: 139.7382, country: 'JP' },
  { id: 'softbank', name: 'SoftBank Group', ticker: '9984.T', sector: 'comm', mcapB: 100, lat: 35.6657, lng: 139.7295, country: 'JP' },
  { id: 'mufg', name: 'MUFG',     ticker: 'MUFG', sector: 'finance', mcapB: 130, lat: 35.6834, lng: 139.7669, country: 'JP' },

  // ── Saudi / ME ──
  { id: 'aramco', name: 'Saudi Aramco', ticker: '2222.SR', sector: 'energy', mcapB: 1900, lat: 26.3082, lng: 50.1431, country: 'SA' },

  // ── Australia ──
  { id: 'bhp',  name: 'BHP',      ticker: 'BHP',  sector: 'industrial', mcapB: 140, lat: -37.8157, lng: 144.9526, country: 'AU' },
  { id: 'cba',  name: 'Commonwealth Bank', ticker: 'CBA.AX', sector: 'finance', mcapB: 130, lat: -33.8651, lng: 151.2099, country: 'AU' },

  // ── Canada ──
  { id: 'rbc',  name: 'Royal Bank of Canada', ticker: 'RY', sector: 'finance', mcapB: 180, lat: 43.6486, lng: -79.3787, country: 'CA' },
  { id: 'shop', name: 'Shopify',  ticker: 'SHOP', sector: 'tech', mcapB: 130, lat: 45.4199, lng: -75.6989, country: 'CA' },

  // ── LATAM ──
  { id: 'petr', name: 'Petrobras', ticker: 'PBR', sector: 'energy', mcapB: 90, lat: -22.9068, lng: -43.1729, country: 'BR' },
  { id: 'vale', name: 'Vale',     ticker: 'VALE', sector: 'industrial', mcapB: 60, lat: -22.9716, lng: -43.1879, country: 'BR' },
];
