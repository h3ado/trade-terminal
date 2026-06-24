import { Router } from 'express';

const router = Router();

// ─── Indices (mock with deterministic daily drift) ───────────────────────────

const SYMBOLS = [
  { abbr: 'NYSE', sym: 'SPX', base: 6650, mcap_usd_t: 50.0, vol: 0.6 },
  { abbr: 'NDAQ', sym: 'NDX', base: 24500, mcap_usd_t: 25.0, vol: 0.8 },
  { abbr: 'CME', sym: 'DJI', base: 47000, mcap_usd_t: 12.0, vol: 0.5 },
  { abbr: 'LSE', sym: 'FTSE', base: 8400, mcap_usd_t: 3.5, vol: 0.5 },
  { abbr: 'PAR', sym: 'CAC', base: 7800, mcap_usd_t: 3.0, vol: 0.6 },
  { abbr: 'XETR', sym: 'DAX', base: 19500, mcap_usd_t: 2.5, vol: 0.7 },
  { abbr: 'SIX', sym: 'SMI', base: 12200, mcap_usd_t: 1.8, vol: 0.4 },
  { abbr: 'AMS', sym: 'AEX', base: 920, mcap_usd_t: 1.0, vol: 0.6 },
  { abbr: 'BME', sym: 'IBEX', base: 11800, mcap_usd_t: 0.8, vol: 0.7 },
  { abbr: 'BIT', sym: 'FTSEMIB', base: 35000, mcap_usd_t: 0.7, vol: 0.7 },
  { abbr: 'TSE', sym: 'N225', base: 39500, mcap_usd_t: 6.0, vol: 0.8 },
  { abbr: 'HKEX', sym: 'HSI', base: 19800, mcap_usd_t: 4.5, vol: 1.0 },
  { abbr: 'SSE', sym: 'SSEC', base: 3200, mcap_usd_t: 7.0, vol: 0.7 },
  { abbr: 'KRX', sym: 'KOSPI', base: 2600, mcap_usd_t: 1.7, vol: 0.7 },
  { abbr: 'ASX', sym: 'AXJO', base: 8200, mcap_usd_t: 1.6, vol: 0.5 },
  { abbr: 'TSX', sym: 'TSX', base: 24500, mcap_usd_t: 2.8, vol: 0.5 },
  { abbr: 'BSE', sym: 'SENSEX', base: 80000, mcap_usd_t: 4.0, vol: 0.7 },
  { abbr: 'B3', sym: 'BVSP', base: 130000, mcap_usd_t: 0.9, vol: 1.0 },
  { abbr: 'BMV', sym: 'MXX', base: 56000, mcap_usd_t: 0.5, vol: 0.8 },
  { abbr: 'JSE', sym: 'J203', base: 86000, mcap_usd_t: 1.0, vol: 0.7 },
];

function seededRandom(seed: number) {
  let s = seed;
  return () => { s = (s * 16807 + 0) % 2147483647; return (s - 1) / 2147483646; };
}

function getIndexValue(base: number, vol: number): { value: number; changePct: number } {
  const day = Math.floor(Date.now() / 86400_000);
  const r = seededRandom(day * 997 + base);
  const dailyChange = (r() - 0.49) * vol * 2;
  return {
    value: +(base * (1 + dailyChange / 100)).toFixed(0),
    changePct: +dailyChange.toFixed(2),
  };
}

let indicesCache: { ts: number; data: unknown } | null = null;
const INDICES_TTL = 30_000;

router.get('/indices', (_req, res) => {
  if (indicesCache && Date.now() - indicesCache.ts < INDICES_TTL) {
    res.json(indicesCache.data); return;
  }
  const indices = SYMBOLS.map(s => {
    const { value, changePct } = getIndexValue(s.base, s.vol);
    return { ...s, value, changePct };
  });
  const data = { indices, ts: Date.now() };
  indicesCache = { ts: Date.now(), data };
  res.json(data);
});

// ─── CoinGecko crypto prices ──────────────────────────────────────────────────

let cryptoCache: { ts: number; coins: unknown[] } | null = null;
const CRYPTO_TTL = 60_000;

router.get('/coingecko-prices', async (_req, res) => {
  if (cryptoCache && Date.now() - cryptoCache.ts < CRYPTO_TTL) {
    res.json({ coins: cryptoCache.coins, ts: cryptoCache.ts, source: 'coingecko', cached: true }); return;
  }
  try {
    const url = 'https://api.coingecko.com/api/v3/coins/markets'
      + '?vs_currency=usd&order=market_cap_desc&per_page=50&page=1&price_change_percentage=24h,7d';
    const r = await fetch(url, { headers: { 'User-Agent': 'trade-terminal/1.0', accept: 'application/json' } });
    if (!r.ok) throw new Error(`coingecko ${r.status}`);
    const raw = await r.json() as any[];
    const coins = raw.map(c => ({
      id: c.id, symbol: (c.symbol ?? '').toUpperCase(), name: c.name, image: c.image,
      price: c.current_price, marketCap: c.market_cap, marketCapRank: c.market_cap_rank,
      volume24h: c.total_volume,
      change24hPct: c.price_change_percentage_24h_in_currency ?? c.price_change_percentage_24h ?? null,
      change7dPct: c.price_change_percentage_7d_in_currency ?? null,
      ath: c.ath, athChangePct: c.ath_change_percentage,
      high24h: c.high_24h, low24h: c.low_24h,
      supply: c.circulating_supply, maxSupply: c.max_supply,
    }));
    cryptoCache = { ts: Date.now(), coins };
    res.json({ coins, ts: cryptoCache.ts, source: 'coingecko', cached: false });
  } catch (e) {
    res.status(502).json({ error: String(e), coins: [] });
  }
});

export default router;
