// Synthetic OHLCV series generator. Deterministic per symbol so the chart
// is stable across rerenders. Returns ascending bars (oldest first).
export interface Candle {
  t: number;       // unix ms
  o: number;
  h: number;
  l: number;
  c: number;
  v: number;
}

export type Timeframe = '1m' | '5m' | '15m' | '1h' | '4h' | '1D' | '1W';
export type RangeKey = '1D' | '5D' | '1M' | '3M' | '6M' | '1Y' | '5Y' | 'MAX';

const TF_MS: Record<Timeframe, number> = {
  '1m': 60_000,
  '5m': 5 * 60_000,
  '15m': 15 * 60_000,
  '1h': 60 * 60_000,
  '4h': 4 * 60 * 60_000,
  '1D': 24 * 60 * 60_000,
  '1W': 7 * 24 * 60 * 60_000,
};

const RANGE_MS: Record<RangeKey, number> = {
  '1D': 24 * 60 * 60_000,
  '5D': 5 * 24 * 60 * 60_000,
  '1M': 30 * 24 * 60 * 60_000,
  '3M': 90 * 24 * 60 * 60_000,
  '6M': 180 * 24 * 60 * 60_000,
  '1Y': 365 * 24 * 60 * 60_000,
  '5Y': 5 * 365 * 24 * 60 * 60_000,
  MAX: 10 * 365 * 24 * 60 * 60_000,
};

function hash(s: string) {
  let h = 2166136261;
  for (let i = 0; i < s.length; i++) {
    h ^= s.charCodeAt(i);
    h = Math.imul(h, 16777619);
  }
  return h >>> 0;
}

function rng(seed: number) {
  let s = seed || 1;
  return () => {
    s = (s * 9301 + 49297) % 233280;
    return s / 233280;
  };
}

const BASE_PRICE: Record<string, number> = {
  EURUSD: 1.0875,
  GBPUSD: 1.2710,
  USDJPY: 149.85,
  USDCHF: 0.8920,
  AUDUSD: 0.6610,
  NZDUSD: 0.6080,
  USDCAD: 1.3690,
  USDCNH: 7.2400,
  USDMXN: 17.250,
  USDZAR: 18.450,
  USDTRY: 32.10,
  USDINR: 83.40,
  USDBRL: 5.05,
  USDKRW: 1340.0,
  DXY: 104.12,
};

export function basePriceFor(symbol: string): number {
  return BASE_PRICE[symbol.toUpperCase()] ?? 1.0;
}

export function generateSeries(symbol: string, timeframe: Timeframe, range: RangeKey, now: number = Date.now()): Candle[] {
  const step = TF_MS[timeframe];
  const span = RANGE_MS[range];
  const n = Math.max(40, Math.min(1200, Math.floor(span / step)));
  const seed = hash(symbol + ':' + timeframe);
  const rnd = rng(seed);
  const start = now - n * step;
  const base = basePriceFor(symbol);
  // Volatility scales with timeframe.
  const sigma = base * (0.0008 + step / TF_MS['1D'] * 0.004);
  const drift = (rnd() - 0.5) * sigma * 0.05;

  const out: Candle[] = [];
  let price = base * (1 + (rnd() - 0.5) * 0.03);
  for (let i = 0; i < n; i++) {
    const t = start + i * step;
    const o = price;
    // Random walk with mild mean reversion to base price.
    const mr = (base - price) * 0.005;
    const shock = (rnd() - 0.5) * 2 * sigma;
    const c = o + drift + mr + shock;
    const wickHi = Math.abs(rnd() - rnd()) * sigma * 1.2;
    const wickLo = Math.abs(rnd() - rnd()) * sigma * 1.2;
    const h = Math.max(o, c) + wickHi;
    const l = Math.min(o, c) - wickLo;
    const v = Math.floor(50_000 + rnd() * 250_000);
    out.push({ t, o, h, l, c, v });
    price = c;
  }
  return out;
}

export const TIMEFRAMES: Timeframe[] = ['1m', '5m', '15m', '1h', '4h', '1D', '1W'];
export const RANGES: RangeKey[] = ['1D', '5D', '1M', '3M', '6M', '1Y', '5Y', 'MAX'];

// Reasonable default range per timeframe.
export function defaultRangeFor(tf: Timeframe): RangeKey {
  switch (tf) {
    case '1m': return '1D';
    case '5m': return '5D';
    case '15m': return '5D';
    case '1h': return '1M';
    case '4h': return '3M';
    case '1D': return '1Y';
    case '1W': return '5Y';
  }
}
