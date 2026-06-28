import { Router } from 'express';

const router = Router();

function makeCache<T>(ttlMs: number) {
  const store = new Map<string, { ts: number; data: T }>();
  return {
    get: (key: string) => { const e = store.get(key); return e && Date.now() - e.ts < ttlMs ? e.data : null; },
    set: (key: string, data: T) => { store.set(key, { ts: Date.now(), data }); return data; },
  };
}

const fearGreedCache  = makeCache<unknown>(30 * 60_000);
const defiCache       = makeCache<unknown>(15 * 60_000);
const coinCache       = makeCache<unknown>(5  * 60_000);
const derivCache      = makeCache<unknown>(5  * 60_000);
const l2TvlCache      = makeCache<unknown>(60 * 60_000);
const fundingCache    = makeCache<unknown>(5  * 60_000);
const ohlcCache       = makeCache<unknown>(5  * 60_000);

// ─── Fear & Greed Index ───────────────────────────────────────────────────────

router.get('/fear-greed', async (_req, res) => {
  const hit = fearGreedCache.get('fg');
  if (hit) { res.json(hit); return; }
  try {
    const r = await fetch('https://api.alternative.me/fng/?limit=30', {
      headers: { 'User-Agent': 'trade-terminal/1.0' },
      signal: AbortSignal.timeout(8000),
    });
    if (!r.ok) throw new Error(`alternative.me ${r.status}`);
    const j = await r.json() as any;
    const data = {
      current: j.data?.[0] ?? null,
      history: (j.data ?? []).slice(0, 30),
      fetchedAt: Date.now(),
    };
    fearGreedCache.set('fg', data);
    res.json(data);
  } catch (e) { res.json({ current: null, history: [], fetchedAt: Date.now(), error: String(e) }); }
});

// ─── DeFi TVL (DeFiLlama, no auth) ───────────────────────────────────────────

router.get('/defi', async (_req, res) => {
  const hit = defiCache.get('defi');
  if (hit) { res.json(hit); return; }
  try {
    const r = await fetch('https://api.llama.fi/protocols', {
      headers: { 'User-Agent': 'trade-terminal/1.0' },
      signal: AbortSignal.timeout(12000),
    });
    if (!r.ok) throw new Error(`DeFiLlama ${r.status}`);
    const j = await r.json() as any[];
    const protocols = j
      .filter((p: any) => p.tvl > 0)
      .sort((a: any, b: any) => b.tvl - a.tvl)
      .slice(0, 30)
      .map((p: any) => ({
        name: p.name,
        slug: p.slug,
        logo: p.logo,
        chain: p.chain,
        category: p.category,
        tvl: p.tvl,
        change1d: p.change_1d ?? null,
        change7d: p.change_7d ?? null,
        mcapTvl: p.mcap ? +(p.mcap / p.tvl).toFixed(2) : null,
      }));

    // Chain breakdown
    const chainMap: Record<string, number> = {};
    j.forEach((p: any) => {
      if (!p.tvl) return;
      const c = p.chain ?? 'Other';
      chainMap[c] = (chainMap[c] ?? 0) + p.tvl;
    });
    const chains = Object.entries(chainMap)
      .sort((a, b) => b[1] - a[1])
      .slice(0, 8)
      .map(([chain, tvl]) => ({ chain, tvl }));

    // Category breakdown
    const catMap: Record<string, number> = {};
    j.forEach((p: any) => {
      if (!p.tvl) return;
      const c = p.category ?? 'Other';
      catMap[c] = (catMap[c] ?? 0) + p.tvl;
    });
    const categories = Object.entries(catMap)
      .sort((a, b) => b[1] - a[1])
      .slice(0, 8)
      .map(([category, tvl]) => ({ category, tvl }));

    const totalTvl = j.reduce((sum: number, p: any) => sum + (p.tvl ?? 0), 0);

    const data = { protocols, chains, categories, totalTvl, fetchedAt: Date.now() };
    defiCache.set('defi', data);
    res.json(data);
  } catch (e) { res.json({ protocols: [], chains: [], categories: [], totalTvl: 0, fetchedAt: Date.now(), error: String(e) }); }
});

// ─── Coin Detail (CoinGecko, free tier) ───────────────────────────────────────

router.get('/coin/:id', async (req, res) => {
  const id = req.params.id.toLowerCase();
  const hit = coinCache.get(id);
  if (hit) { res.json(hit); return; }
  try {
    const url = `https://api.coingecko.com/api/v3/coins/${encodeURIComponent(id)}?localization=false&tickers=false&market_data=true&community_data=true&developer_data=true&sparkline=true`;
    const r = await fetch(url, {
      headers: { 'User-Agent': 'trade-terminal/1.0', Accept: 'application/json' },
      signal: AbortSignal.timeout(12000),
    });
    if (!r.ok) throw new Error(`CoinGecko ${r.status}`);
    const j = await r.json() as any;
    const md = j.market_data ?? {};
    const data = {
      id: j.id,
      symbol: j.symbol?.toUpperCase(),
      name: j.name,
      image: j.image?.large,
      description: j.description?.en?.replace(/<[^>]+>/g, '').slice(0, 800),
      categories: j.categories?.slice(0, 5),
      links: {
        homepage: j.links?.homepage?.[0],
        whitepaper: j.links?.whitepaper,
        github: j.links?.repos_url?.github?.[0],
        reddit: j.links?.subreddit_url,
        twitter: j.links?.twitter_screen_name,
      },
      market: {
        price: md.current_price?.usd ?? null,
        marketCap: md.market_cap?.usd ?? null,
        marketCapRank: j.market_cap_rank,
        totalVolume: md.total_volume?.usd ?? null,
        high24h: md.high_24h?.usd ?? null,
        low24h: md.low_24h?.usd ?? null,
        change24h: md.price_change_percentage_24h ?? null,
        change7d: md.price_change_percentage_7d ?? null,
        change30d: md.price_change_percentage_30d ?? null,
        change1y: md.price_change_percentage_1y ?? null,
        ath: md.ath?.usd ?? null,
        athDate: md.ath_date?.usd ?? null,
        athChangePercent: md.ath_change_percentage?.usd ?? null,
        atl: md.atl?.usd ?? null,
        circulatingSupply: md.circulating_supply ?? null,
        totalSupply: md.total_supply ?? null,
        maxSupply: md.max_supply ?? null,
        fullyDilutedValuation: md.fully_diluted_valuation?.usd ?? null,
      },
      community: {
        twitterFollowers: j.community_data?.twitter_followers ?? null,
        redditSubscribers: j.community_data?.reddit_subscribers ?? null,
        redditAccountsActive: j.community_data?.reddit_accounts_active_48h ?? null,
      },
      developer: {
        forks: j.developer_data?.forks ?? null,
        stars: j.developer_data?.stars ?? null,
        subscribers: j.developer_data?.subscribers ?? null,
        totalIssues: j.developer_data?.total_issues ?? null,
        closedIssues: j.developer_data?.closed_issues ?? null,
        commitCount4Weeks: j.developer_data?.commit_count_4_weeks ?? null,
        pullRequestsMerged: j.developer_data?.pull_requests_merged ?? null,
      },
      sparkline7d: md.sparkline_7d?.price ?? [],
      fetchedAt: Date.now(),
    };
    coinCache.set(id, data);
    res.json(data);
  } catch (e) { res.status(502).json({ error: String(e) }); }
});

// ─── Derivatives exchanges (CoinGecko free) ───────────────────────────────────

router.get('/derivatives', async (_req, res) => {
  const hit = derivCache.get('deriv');
  if (hit) { res.json(hit); return; }
  try {
    const r = await fetch('https://api.coingecko.com/api/v3/derivatives/exchanges?per_page=15&page=1&order=open_interest_btc_desc', {
      headers: { 'User-Agent': 'trade-terminal/1.0', Accept: 'application/json' },
      signal: AbortSignal.timeout(10000),
    });
    if (!r.ok) throw new Error(`CoinGecko ${r.status}`);
    const j = await r.json() as any[];
    const exchanges = j.slice(0, 15).map((e: any) => ({
      id: e.id,
      name: e.name,
      openInterestBtc: e.open_interest_btc ?? null,
      tradeVolume24hBtc: e.trade_volume_24h_btc ?? null,
      numberOfPerpetualPairs: e.number_of_perpetual_pairs ?? null,
      numberOfFuturesPairs: e.number_of_futures_pairs ?? null,
    }));
    const data = { exchanges, fetchedAt: Date.now() };
    derivCache.set('deriv', data);
    res.json(data);
  } catch (e) { res.json({ exchanges: [], fetchedAt: Date.now(), error: String(e) }); }
});

// ─── L2 TVL (DeFiLlama chains, no auth) ──────────────────────────────────────

const L2_CHAINS = ['Arbitrum', 'Optimism', 'Base', 'zkSync Era', 'Polygon zkEVM', 'Starknet', 'Linea', 'Scroll'];

router.get('/l2-tvl', async (_req, res) => {
  const hit = l2TvlCache.get('l2');
  if (hit) { res.json(hit); return; }
  try {
    const r = await fetch('https://api.llama.fi/v2/chains', {
      headers: { 'User-Agent': 'trade-terminal/1.0' },
      signal: AbortSignal.timeout(10000),
    });
    if (!r.ok) throw new Error(`DeFiLlama ${r.status}`);
    const j = await r.json() as any[];
    const l2s = j
      .filter((c: any) => L2_CHAINS.includes(c.name))
      .map((c: any) => ({
        name: c.name,
        tvl: c.tvl ?? 0,
        chainId: c.chainId ?? null,
      }))
      .sort((a: any, b: any) => {
        const ia = L2_CHAINS.indexOf(a.name);
        const ib = L2_CHAINS.indexOf(b.name);
        return ia - ib;
      });
    const data = { chains: l2s, fetchedAt: Date.now() };
    l2TvlCache.set('l2', data);
    res.json(data);
  } catch (e) { res.json({ chains: [], fetchedAt: Date.now(), error: String(e) }); }
});

// ─── Funding Rates (Binance + Bybit public REST, no auth) ─────────────────────

const FUNDING_PAIRS = [
  { pair: 'BTC-PERP',  binance: 'BTCUSDT',  bybit: 'BTCUSDT' },
  { pair: 'ETH-PERP',  binance: 'ETHUSDT',  bybit: 'ETHUSDT' },
  { pair: 'SOL-PERP',  binance: 'SOLUSDT',  bybit: 'SOLUSDT' },
  { pair: 'XRP-PERP',  binance: 'XRPUSDT',  bybit: 'XRPUSDT' },
  { pair: 'DOGE-PERP', binance: 'DOGEUSDT', bybit: 'DOGEUSDT' },
  { pair: 'BNB-PERP',  binance: 'BNBUSDT',  bybit: null },
];

router.get('/funding-rates', async (_req, res) => {
  const hit = fundingCache.get('fr');
  if (hit) { res.json(hit); return; }
  try {
    // Fetch Binance premium index (includes funding rate + next funding time)
    const binanceSymbols = FUNDING_PAIRS.map(p => p.binance).join(',');
    const [binR, bybitR] = await Promise.allSettled([
      fetch(`https://fapi.binance.com/fapi/v1/premiumIndex`, {
        signal: AbortSignal.timeout(8000),
      }),
      fetch(`https://api.bybit.com/v5/market/tickers?category=linear`, {
        signal: AbortSignal.timeout(8000),
      }),
    ]);

    const binanceMap: Record<string, number> = {};
    if (binR.status === 'fulfilled' && binR.value.ok) {
      const bj = await binR.value.json() as any[];
      for (const item of bj) {
        binanceMap[item.symbol] = parseFloat(item.lastFundingRate ?? '0') * 100;
      }
    }

    const bybitMap: Record<string, number> = {};
    if (bybitR.status === 'fulfilled' && bybitR.value.ok) {
      const yj = await bybitR.value.json() as any;
      for (const item of (yj.result?.list ?? [])) {
        if (item.fundingRate != null) {
          bybitMap[item.symbol] = parseFloat(item.fundingRate) * 100;
        }
      }
    }

    const rows = FUNDING_PAIRS.flatMap(p => {
      const results = [];
      const binRate = binanceMap[p.binance];
      if (binRate !== undefined) {
        results.push({ pair: p.pair, ex: 'Binance', rate: +binRate.toFixed(4), synthetic: false });
      }
      if (p.bybit) {
        const bRate = bybitMap[p.bybit];
        if (bRate !== undefined) {
          results.push({ pair: p.pair, ex: 'Bybit', rate: +bRate.toFixed(4), synthetic: false });
        }
      }
      return results;
    });

    // If we got nothing real, return synthetic with flag
    const synthetic = rows.length === 0;
    const fallback = [
      { pair: 'BTC-PERP', ex: 'Binance', rate: 0.0082, synthetic: true },
      { pair: 'ETH-PERP', ex: 'Binance', rate: 0.0065, synthetic: true },
      { pair: 'SOL-PERP', ex: 'Binance', rate: 0.0120, synthetic: true },
    ];

    const data = { rows: synthetic ? fallback : rows, synthetic, fetchedAt: Date.now() };
    fundingCache.set('fr', data);
    res.json(data);
  } catch (e) { res.json({ rows: [], synthetic: true, fetchedAt: Date.now(), error: String(e) }); }
});

// ─── OHLC candles (CoinGecko free) ───────────────────────────────────────────

router.get('/coin/:id/ohlc', async (req, res) => {
  const id = req.params.id.toLowerCase();
  const days = req.query.days ?? '30';
  const key = `${id}-${days}`;
  const hit = ohlcCache.get(key);
  if (hit) { res.json(hit); return; }
  try {
    const url = `https://api.coingecko.com/api/v3/coins/${encodeURIComponent(id)}/ohlc?vs_currency=usd&days=${days}`;
    const r = await fetch(url, {
      headers: { 'User-Agent': 'trade-terminal/1.0', Accept: 'application/json' },
      signal: AbortSignal.timeout(12000),
    });
    if (!r.ok) throw new Error(`CoinGecko OHLC ${r.status}`);
    const j = await r.json() as [number, number, number, number, number][];
    // CoinGecko returns [timestamp, open, high, low, close]
    const candles = j.map(([t, o, h, l, c]) => ({ t, o, h, l, c }));
    const data = { candles, fetchedAt: Date.now() };
    ohlcCache.set(key, data);
    res.json(data);
  } catch (e) { res.json({ candles: [], fetchedAt: Date.now(), error: String(e) }); }
});

export default router;
