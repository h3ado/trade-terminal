import { Router } from 'express';

const router = Router();

const YF_UA = 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36';

const INDEX_MAP = [
  { abbr: 'NYSE',  sym: 'SPX',      yf: '^GSPC',      mcap_usd_t: 50.0 },
  { abbr: 'NDAQ',  sym: 'NDX',      yf: '^IXIC',      mcap_usd_t: 25.0 },
  { abbr: 'CME',   sym: 'DJI',      yf: '^DJI',       mcap_usd_t: 12.0 },
  { abbr: 'LSE',   sym: 'FTSE',     yf: '^FTSE',      mcap_usd_t:  3.5 },
  { abbr: 'PAR',   sym: 'CAC',      yf: '^FCHI',      mcap_usd_t:  3.0 },
  { abbr: 'XETR',  sym: 'DAX',      yf: '^GDAXI',     mcap_usd_t:  2.5 },
  { abbr: 'SIX',   sym: 'SMI',      yf: '^SSMI',      mcap_usd_t:  1.8 },
  { abbr: 'AMS',   sym: 'AEX',      yf: '^AEX',       mcap_usd_t:  1.0 },
  { abbr: 'BME',   sym: 'IBEX',     yf: '^IBEX35',    mcap_usd_t:  0.8 },
  { abbr: 'BIT',   sym: 'FTSEMIB',  yf: 'FTSEMIB.MI', mcap_usd_t:  0.7 },
  { abbr: 'TSE',   sym: 'N225',     yf: '^N225',      mcap_usd_t:  6.0 },
  { abbr: 'HKEX',  sym: 'HSI',      yf: '^HSI',       mcap_usd_t:  4.5 },
  { abbr: 'SSE',   sym: 'SSEC',     yf: '000001.SS',  mcap_usd_t:  7.0 },
  { abbr: 'KRX',   sym: 'KOSPI',    yf: '^KS11',      mcap_usd_t:  1.7 },
  { abbr: 'ASX',   sym: 'AXJO',     yf: '^AXJO',      mcap_usd_t:  1.6 },
  { abbr: 'TSX',   sym: 'TSX',      yf: '^GSPTSE',    mcap_usd_t:  2.8 },
  { abbr: 'BSE',   sym: 'SENSEX',   yf: '^BSESN',     mcap_usd_t:  4.0 },
  { abbr: 'B3',    sym: 'BVSP',     yf: '^BVSP',      mcap_usd_t:  0.9 },
  { abbr: 'BMV',   sym: 'MXX',      yf: '^MXX',       mcap_usd_t:  0.5 },
  { abbr: 'JSE',   sym: 'J203',     yf: '^J203.JO',   mcap_usd_t:  1.0 },
];

// ─── Seeded fallback (correct field names, deterministic by day) ──────────────

const SEED_BASES: Record<string, { base: number; vol: number }> = {
  '^GSPC':      { base: 6650,   vol: 0.6 },
  '^IXIC':      { base: 24500,  vol: 0.8 },
  '^DJI':       { base: 47000,  vol: 0.5 },
  '^FTSE':      { base: 8400,   vol: 0.5 },
  '^FCHI':      { base: 7800,   vol: 0.6 },
  '^GDAXI':     { base: 19500,  vol: 0.7 },
  '^SSMI':      { base: 12200,  vol: 0.4 },
  '^AEX':       { base: 920,    vol: 0.6 },
  '^IBEX35':    { base: 11800,  vol: 0.7 },
  'FTSEMIB.MI': { base: 35000,  vol: 0.7 },
  '^N225':      { base: 39500,  vol: 0.8 },
  '^HSI':       { base: 19800,  vol: 1.0 },
  '000001.SS':  { base: 3200,   vol: 0.7 },
  '^KS11':      { base: 2600,   vol: 0.7 },
  '^AXJO':      { base: 8200,   vol: 0.5 },
  '^GSPTSE':    { base: 24500,  vol: 0.5 },
  '^BSESN':     { base: 80000,  vol: 0.7 },
  '^BVSP':      { base: 130000, vol: 1.0 },
  '^MXX':       { base: 56000,  vol: 0.8 },
  '^J203.JO':   { base: 86000,  vol: 0.7 },
};

function seededRng(seed: number) {
  let s = seed;
  return () => { s = (s * 16807) % 2147483647; return (s - 1) / 2147483646; };
}

function seededIndex(yf: string) {
  const { base, vol } = SEED_BASES[yf] ?? { base: 1000, vol: 0.5 };
  const day = Math.floor(Date.now() / 86400_000);
  const rng = seededRng(day * 997 + base);
  const change_pct = +((rng() - 0.49) * vol * 2).toFixed(2);
  const close = +(base * (1 + change_pct / 100)).toFixed(0);
  const prev_close = +(close / (1 + change_pct / 100)).toFixed(0);
  return { close, prev_close, change_pct };
}

// ─── Yahoo Finance batch quote ─────────────────────────────────────────────────

async function fetchYFBatch(): Promise<Map<string, any>> {
  const symbols = INDEX_MAP.map(i => i.yf).join(',');
  const url = `https://query1.finance.yahoo.com/v7/finance/quote?symbols=${encodeURIComponent(symbols)}&fields=regularMarketPrice,regularMarketPreviousClose,regularMarketChangePercent,shortName`;
  const r = await fetch(url, {
    headers: { 'User-Agent': YF_UA, Accept: 'application/json', Referer: 'https://finance.yahoo.com/' },
  });
  if (!r.ok) throw new Error(`Yahoo Finance v7 ${r.status}`);
  const j = await r.json() as any;
  const results: any[] = j?.quoteResponse?.result ?? [];
  return new Map<string, any>(results.map((q: any) => [q.symbol, q]));
}

// ─── Index cache ──────────────────────────────────────────────────────────────

let indicesCache: { ts: number; data: unknown } | null = null;
const INDICES_TTL = 2 * 60_000;

router.get('/indices', async (_req, res) => {
  if (indicesCache && Date.now() - indicesCache.ts < INDICES_TTL) {
    res.json(indicesCache.data); return;
  }

  let quoteMap = new Map<string, any>();
  let source = 'seeded';
  try {
    quoteMap = await fetchYFBatch();
    source = 'yahoo';
  } catch (e) {
    console.warn('[indices] YF batch failed, using seeded:', String(e));
  }

  const indices = INDEX_MAP.map(({ abbr, sym, yf, mcap_usd_t }) => {
    const q = quoteMap.get(yf);
    if (q?.regularMarketPrice != null) {
      return {
        abbr,
        symbol: sym,
        close: q.regularMarketPrice as number,
        prev_close: (q.regularMarketPreviousClose ?? null) as number | null,
        change_pct: (q.regularMarketChangePercent ?? null) as number | null,
        mcap_usd_t,
        movers: [],
      };
    }
    return { abbr, symbol: sym, ...seededIndex(yf), mcap_usd_t, movers: [] };
  });

  const data = { indices, ts: Date.now(), source };
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
