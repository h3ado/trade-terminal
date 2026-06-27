import { Router } from 'express';
import { getQuote, saveQuote, getCandles, saveCandles, getFundamentals, saveFundamentals, getPeers, savePeers } from '../../lib/marketStore';
import { registerFetchers } from '../../lib/marketSync';

const router = Router();

const TWELVE_KEY = () => process.env.TWELVE_DATA_API_KEY ?? '';
const FINNHUB_KEY = () => process.env.FINNHUB_API_KEY ?? '';

// In-memory cache for indicators only (derived from Twelve Data, not worth persisting)
const indicatorsCache = new Map<string, { ts: number; data: Record<string, unknown> }>();
const INDICATORS_TTL = 5 * 60_000;
const fulfilled = <T,>(r: PromiseSettledResult<T>): r is PromiseFulfilledResult<T> => r.status === 'fulfilled';

async function twelveGet(path: string, key: string): Promise<any> {
  const sep = path.includes('?') ? '&' : '?';
  const url = `https://api.twelvedata.com${path}${sep}apikey=${key}`;
  const r = await fetch(url, { headers: { 'User-Agent': 'trade-terminal/1.0' } });
  if (!r.ok) throw new Error(`Twelve Data ${r.status}: ${path}`);
  const j = await r.json() as any;
  if (j?.code && j.code !== 200) throw new Error(j.message ?? `Twelve Data error: ${path}`);
  return j;
}

// ─── Finnhub helpers ──────────────────────────────────────────────────────────

async function finnhubGet(path: string, key: string): Promise<any> {
  const sep = path.includes('?') ? '&' : '?';
  const r = await fetch(`https://finnhub.io/api/v1${path}${sep}token=${key}`, {
    headers: { 'User-Agent': 'trade-terminal/1.0', Accept: 'application/json' },
  });
  if (!r.ok) throw new Error(`Finnhub ${r.status}: ${path}`);
  return r.json();
}

async function finnhubOverview(ticker: string, key: string): Promise<Record<string, unknown>> {
  const [q, p] = await Promise.all([
    finnhubGet(`/quote?symbol=${encodeURIComponent(ticker)}`, key),
    finnhubGet(`/stock/profile2?symbol=${encodeURIComponent(ticker)}`, key),
  ]);
  const prev = q.pc ?? null;
  const price = q.c ?? null;
  return {
    ticker,
    name: p.name ?? ticker,
    exchange: p.exchange ?? '',
    currency: p.currency ?? 'USD',
    price,
    open: q.o ?? null,
    high: q.h ?? null,
    low: q.l ?? null,
    prevClose: prev,
    change: price != null && prev != null ? price - prev : null,
    changePct: q.dp ?? null,
    volume: null,
    avgVolume: null,
    fiftyTwoWeekHigh: null,
    fiftyTwoWeekLow: null,
    isMarketOpen: q.t != null && (Date.now() / 1000 - q.t) < 600,
    ts: Date.now(),
    _source: 'finnhub',
  };
}

async function finnhubChart(ticker: string, interval: string, outputsize: string): Promise<Record<string, unknown>> {
  const key = FINNHUB_KEY();
  const days = parseInt(outputsize, 10) || 90;
  const res = interval === '1day' ? 'D' : interval === '1week' ? 'W' : 'M';
  const to = Math.floor(Date.now() / 1000);
  const msPerDay = 86400;
  const lookback = interval === '1day' ? days : interval === '1week' ? days * 7 : days * 30;
  const from = to - lookback * msPerDay;
  const j = await finnhubGet(`/stock/candle?symbol=${encodeURIComponent(ticker)}&resolution=${res}&from=${from}&to=${to}`, key);
  if (j.s !== 'ok' || !j.t) throw new Error('Finnhub no candle data');
  const candles = (j.t as number[]).map((t: number, i: number) => ({
    time: new Date(t * 1000).toISOString().slice(0, 10),
    open:  (j.o?.[i]  ?? null) as number | null,
    high:  (j.h?.[i]  ?? null) as number | null,
    low:   (j.l?.[i]  ?? null) as number | null,
    close: (j.c?.[i]  ?? null) as number | null,
    volume:(j.v?.[i]  ?? null) as number | null,
  })).filter(c => c.open != null);
  return { ticker, interval, candles, ts: Date.now(), _source: 'finnhub' };
}

// ─── Internal API fetchers (used by routes and marketSync) ───────────────────

export async function fetchQuoteFromAPI(ticker: string): Promise<Record<string, unknown>> {
  const key = TWELVE_KEY();
  if (key) {
    const quote = await twelveGet(`/quote?symbol=${encodeURIComponent(ticker)}`, key);
    return {
      ticker,
      name: quote.name ?? ticker,
      exchange: quote.exchange ?? '',
      currency: quote.currency ?? 'USD',
      price: parseFloat(quote.close) || null,
      open: parseFloat(quote.open) || null,
      high: parseFloat(quote.high) || null,
      low: parseFloat(quote.low) || null,
      prevClose: parseFloat(quote.previous_close) || null,
      change: parseFloat(quote.change) || null,
      changePct: parseFloat(quote.percent_change) || null,
      volume: parseInt(quote.volume, 10) || null,
      avgVolume: parseInt(quote.average_volume, 10) || null,
      fiftyTwoWeekHigh: parseFloat(quote.fifty_two_week?.high) || null,
      fiftyTwoWeekLow: parseFloat(quote.fifty_two_week?.low) || null,
      isMarketOpen: quote.is_market_open ?? null,
      ts: Date.now(),
      _source: 'twelvedata',
    };
  }
  const fhKey = FINNHUB_KEY();
  if (fhKey) return finnhubOverview(ticker, fhKey);
  return yfOverview(ticker);
}

export async function fetchCandlesFromAPI(ticker: string, interval: string, outputsize: string): Promise<Record<string, unknown>> {
  const key = TWELVE_KEY();
  if (key) {
    const ts = await twelveGet(
      `/time_series?symbol=${encodeURIComponent(ticker)}&interval=${interval}&outputsize=${outputsize}`,
      key,
    );
    const candles = (ts.values ?? []).map((v: any) => ({
      time: v.datetime.slice(0, 10),
      open: parseFloat(v.open),
      high: parseFloat(v.high),
      low: parseFloat(v.low),
      close: parseFloat(v.close),
      volume: parseInt(v.volume, 10) || 0,
    })).reverse();
    return { ticker, interval, candles, ts: Date.now(), _source: 'twelvedata' };
  }
  // Finnhub free tier does not include historical candles — use Yahoo Finance v8 (no auth required)
  return yfChart(ticker, interval, outputsize);
}

// Register fetchers for background sync
registerFetchers(fetchQuoteFromAPI, fetchCandlesFromAPI);

// GET /api/market/security/:ticker/overview
router.get('/:ticker/overview', async (req, res) => {
  const ticker = req.params.ticker.toUpperCase();

  // DB-first
  const fromDB = await getQuote(ticker);
  if (fromDB) { res.json({ ...fromDB, cached: true }); return; }

  // Fetch from API, persist to DB, return
  try {
    const data = await fetchQuoteFromAPI(ticker);
    await saveQuote(ticker, data);
    res.json({ ...data, cached: false });
  } catch (e) {
    res.status(502).json({ error: `No market data API configured. Add TWELVE_DATA_API_KEY or FINNHUB_API_KEY to server/.env — ${e}` });
  }
});

// GET /api/market/security/:ticker/chart?interval=1day&outputsize=90
router.get('/:ticker/chart', async (req, res) => {
  const ticker = req.params.ticker.toUpperCase();
  const interval = (req.query.interval as string) || '1day';
  const outputsize = (req.query.outputsize as string) || '90';

  // DB-first
  const fromDB = await getCandles(ticker, interval);
  if (fromDB) { res.json({ ...fromDB, cached: true }); return; }

  try {
    const result = await fetchCandlesFromAPI(ticker, interval, outputsize);
    const candles = result.candles as Array<{ time: string; open: number | null; high: number | null; low: number | null; close: number | null; volume: number | null }>;
    await saveCandles(ticker, interval, candles);
    res.json({ ...result, cached: false });
  } catch (e) {
    res.status(502).json({ error: `No market data API configured. Add TWELVE_DATA_API_KEY or FINNHUB_API_KEY to server/.env — ${e}` });
  }
});

// GET /api/market/security/:ticker/indicators?interval=1day&outputsize=90
router.get('/:ticker/indicators', async (req, res) => {
  const key = TWELVE_KEY();
  const ticker = req.params.ticker.toUpperCase();
  const interval = (req.query.interval as string) || '1day';
  const outputsize = (req.query.outputsize as string) || '90';
  const cacheKey = `${ticker}:${interval}:${outputsize}`;
  const cached = indicatorsCache.get(cacheKey);
  if (cached && Date.now() - cached.ts < INDICATORS_TTL) {
    res.json({ ...cached.data, cached: true }); return;
  }
  if (!key) {
    res.status(500).json({ error: 'TWELVE_DATA_API_KEY not configured' }); return;
  }
  const sym = encodeURIComponent(ticker);
  const base = `&interval=${interval}&outputsize=${outputsize}`;
  try {
    const [rsiRaw, macdRaw, bbandsRaw] = await Promise.all([
      twelveGet(`/rsi?symbol=${sym}&time_period=14${base}`, key),
      twelveGet(`/macd?symbol=${sym}&fast_period=12&slow_period=26&signal_period=9${base}`, key),
      twelveGet(`/bbands?symbol=${sym}&time_period=20${base}`, key),
    ]);

    const parseValues = (raw: any, keys: string[]) =>
      (raw?.values ?? []).map((v: any) => ({
        time: v.datetime.slice(0, 10),
        ...Object.fromEntries(keys.map(k => [k, parseFloat(v[k]) || null])),
      })).reverse();

    const data: Record<string, unknown> = {
      ticker,
      interval,
      rsi: parseValues(rsiRaw, ['rsi']),
      macd: parseValues(macdRaw, ['macd', 'macd_signal', 'macd_hist']),
      bbands: parseValues(bbandsRaw, ['upper_band', 'middle_band', 'lower_band']),
      ts: Date.now(),
    };
    indicatorsCache.set(cacheKey, { ts: Date.now(), data });
    res.json({ ...data, cached: false });
  } catch (e) {
    res.status(502).json({ error: String(e) });
  }
});

// ─── Yahoo Finance session (crumb auth required since 2024) ──────────────────

let yfSession: { cookie: string; crumb: string; ts: number } | null = null;
const YF_SESSION_TTL = 50 * 60_000; // 50 min — crumbs expire ~1 hr

const YF_UA = 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/124.0.0.0 Safari/537.36';

async function getYFSession(): Promise<{ cookie: string; crumb: string }> {
  if (yfSession && Date.now() - yfSession.ts < YF_SESSION_TTL) return yfSession;

  const ACCEPT = 'text/html,application/xhtml+xml,application/xml;q=0.9,image/avif,image/webp,*/*;q=0.8';
  const extractCookies = (r: Response): string => {
    const raw = (r.headers as any).getSetCookie?.() ?? [];
    if (raw.length) return raw.map((c: string) => c.split(';')[0]).join('; ');
    return (r.headers.get('set-cookie') ?? '').split(',').map((c: string) => c.trim().split(';')[0]).filter(Boolean).join('; ');
  };

  // Step 1: load Yahoo Finance to establish cookies
  const r1 = await fetch('https://finance.yahoo.com/', {
    headers: { 'User-Agent': YF_UA, Accept: ACCEPT, 'Accept-Language': 'en-US,en;q=0.9' },
    redirect: 'follow',
  });
  const cookie1 = extractCookies(r1);
  const html1 = await r1.text();

  // Try extracting crumb from page HTML
  const m1 = html1.match(/"crumb"\s*:\s*"([^"\\]+)"/);
  if (m1?.[1]) {
    yfSession = { cookie: cookie1, crumb: m1[1], ts: Date.now() };
    return yfSession;
  }

  // Step 2: try getcrumb on query2 first (different rate-limit bucket from query1)
  for (const host of ['query2.finance.yahoo.com', 'query1.finance.yahoo.com']) {
    try {
      const r2 = await fetch(`https://${host}/v1/test/getcrumb`, {
        headers: { 'User-Agent': YF_UA, Cookie: cookie1, Accept: 'text/plain,*/*', Referer: 'https://finance.yahoo.com/' },
      });
      if (r2.ok) {
        const crumb = (await r2.text()).trim();
        if (crumb && !crumb.includes('<') && crumb.length < 50) {
          yfSession = { cookie: cookie1, crumb, ts: Date.now() };
          return yfSession;
        }
      }
    } catch { /* try next host */ }
  }

  // Step 3: load a quote page which may embed the crumb in its HTML
  const r3 = await fetch('https://finance.yahoo.com/quote/AAPL', {
    headers: { 'User-Agent': YF_UA, Cookie: cookie1, Accept: ACCEPT, Referer: 'https://finance.yahoo.com/' },
    redirect: 'follow',
  });
  const cookie3 = extractCookies(r3) || cookie1;
  const html3 = await r3.text();
  const m3 = html3.match(/"crumb"\s*:\s*"([^"\\]+)"/) ?? html3.match(/crumb=([A-Za-z0-9%._-]+)/);
  if (m3?.[1]) {
    const crumb = decodeURIComponent(m3[1]);
    yfSession = { cookie: cookie3, crumb, ts: Date.now() };
    return yfSession;
  }

  throw new Error('Could not obtain Yahoo Finance crumb after 3 attempts');
}

// v8 chart API works without crumb — use it directly for overview + chart fallbacks
async function yfV8(ticker: string, params: Record<string, string>): Promise<any> {
  const qs = new URLSearchParams(params).toString();
  const url = `https://query1.finance.yahoo.com/v8/finance/chart/${encodeURIComponent(ticker)}?${qs}`;
  const r = await fetch(url, { headers: { 'User-Agent': YF_UA, Accept: 'application/json' } });
  if (!r.ok) throw new Error(`Yahoo Finance v8 ${r.status}`);
  return r.json();
}

// v11 quoteSummary requires crumb — use session with retry
async function yfFetch(path: string, params: Record<string, string> = {}): Promise<any> {
  const doFetch = async () => {
    const { cookie, crumb } = await getYFSession();
    const qs = new URLSearchParams({ ...params, crumb }).toString();
    const sep = path.includes('?') ? '&' : '?';
    const r = await fetch(`https://query1.finance.yahoo.com${path}${sep}${qs}`, {
      headers: { 'User-Agent': YF_UA, Cookie: cookie, Accept: 'application/json' },
    });
    if (r.status === 429 || r.status === 401) {
      yfSession = null; // force session refresh
      throw new Error(`need_retry:${r.status}`);
    }
    if (!r.ok) throw new Error(`Yahoo Finance ${r.status}`);
    return r.json();
  };
  try { return await doFetch(); }
  catch (e) {
    if (String(e).includes('need_retry')) return doFetch(); // one retry with fresh session
    throw e;
  }
}

// ─── Yahoo Finance overview fallback (when Twelve Data key is absent) ─────────

async function yfOverview(ticker: string): Promise<Record<string, unknown>> {
  const j = await yfV8(ticker, { interval: '1d', range: '2d', includePrePost: 'false' });
  const meta = j?.chart?.result?.[0]?.meta ?? {};
  const prevClose = meta.chartPreviousClose ?? meta.previousClose ?? null;
  const price = meta.regularMarketPrice ?? null;
  return {
    ticker,
    name: meta.shortName ?? meta.longName ?? ticker,
    exchange: meta.exchangeName ?? '',
    currency: meta.currency ?? 'USD',
    price,
    open: null,
    high: meta.regularMarketDayHigh ?? null,
    low:  meta.regularMarketDayLow  ?? null,
    prevClose,
    change: price != null && prevClose != null ? price - prevClose : null,
    changePct: price != null && prevClose != null ? ((price - prevClose) / prevClose) * 100 : null,
    volume: meta.regularMarketVolume ?? null,
    avgVolume: null,
    fiftyTwoWeekHigh: meta.fiftyTwoWeekHigh ?? null,
    fiftyTwoWeekLow:  meta.fiftyTwoWeekLow  ?? null,
    isMarketOpen: meta.marketState === 'REGULAR',
    ts: Date.now(),
    _source: 'yahoo',
  };
}

async function yfChart(ticker: string, interval: string, outputsize: string): Promise<Record<string, unknown>> {
  const days = parseInt(outputsize, 10) || 90;
  const rangeMap: Record<string, string> = {
    '1day':  days <= 30 ? '1mo' : days <= 90 ? '3mo' : days <= 180 ? '6mo' : days <= 365 ? '1y' : '5y',
    '1week': days <= 52 ? '1y' : '5y',
    '1month': '10y',
  };
  const range = rangeMap[interval] ?? '3mo';
  const yfInterval = interval === '1day' ? '1d' : interval === '1week' ? '1wk' : '1mo';
  const j = await yfV8(ticker, { interval: yfInterval, range });
  const result = j?.chart?.result?.[0];
  if (!result) throw new Error('No chart data from Yahoo Finance');
  const ts: number[] = result.timestamp ?? [];
  const q = result.indicators?.quote?.[0] ?? {};
  const candles = ts.map((t: number, i: number) => ({
    time: new Date(t * 1000).toISOString().slice(0, 10),
    open:  (q.open?.[i]   ?? null) as number | null,
    high:  (q.high?.[i]   ?? null) as number | null,
    low:   (q.low?.[i]    ?? null) as number | null,
    close: (q.close?.[i]  ?? null) as number | null,
    volume:(q.volume?.[i] ?? null) as number | null,
  })).filter(c => c.open != null);
  return { ticker, interval, candles, ts: Date.now(), _source: 'yahoo' };
}

// ─── Yahoo Finance fundamentals ───────────────────────────────────────────────

function yahooRaw(obj: unknown): number | null {
  if (obj !== null && typeof obj === 'object' && 'raw' in obj) return (obj as { raw: number }).raw;
  if (typeof obj === 'number') return obj;
  return null;
}

function yahooFmt(obj: unknown): string {
  if (obj !== null && typeof obj === 'object' && 'fmt' in obj) return (obj as { fmt: string }).fmt;
  if (typeof obj === 'string') return obj;
  return '—';
}

async function finnhubFundamentals(ticker: string, key: string): Promise<Record<string, unknown>> {
  const sym = encodeURIComponent(ticker);
  const [profile, metrics, recs, target, earnings] = await Promise.allSettled([
    finnhubGet(`/stock/profile2?symbol=${sym}`, key),
    finnhubGet(`/stock/metric?symbol=${sym}&metric=all`, key),
    finnhubGet(`/stock/recommendation?symbol=${sym}`, key),
    finnhubGet(`/stock/price-target?symbol=${sym}`, key),
    finnhubGet(`/stock/earnings?symbol=${sym}`, key),
  ]);
  const p = profile.status === 'fulfilled' ? profile.value : {};
  const m = metrics.status === 'fulfilled' ? (metrics.value?.metric ?? {}) : {};
  const recArr = recs.status === 'fulfilled' ? (recs.value ?? []) : [];
  const tgt = target.status === 'fulfilled' ? target.value : {};
  const earnArr = earnings.status === 'fulfilled' ? (earnings.value ?? []) : [];

  const latestRec = recArr[0] ?? null;
  return {
    ticker,
    profile: {
      sector: p.finnhubIndustry ?? null,
      industry: p.finnhubIndustry ?? null,
      employees: p.employeeTotal ?? null,
      website: p.weburl ?? null,
      country: p.country ?? null,
      city: null,
      state: null,
      description: null,
      officers: [],
    },
    keyStats: {
      marketCap: p.marketCapitalization ? p.marketCapitalization * 1e6 : null,
      enterpriseValue: m['enterpriseValue'] ?? null,
      trailingPE: m['peBasicExclExtraTTM'] ?? m['peTTM'] ?? null,
      forwardPE: m['peNormalizedAnnual'] ?? null,
      pegRatio: m['pegRatio'] ?? null,
      priceToBook: m['pbAnnual'] ?? null,
      beta: m['beta'] ?? null,
      dividendRate: m['dividendsPerShareAnnual'] ?? null,
      dividendYield: m['dividendYieldIndicatedAnnual'] ?? null,
      payoutRatio: m['payoutRatioAnnual'] ?? null,
      exDividendDate: '—',
      shortPercentFloat: m['shortInterestPercentage'] ?? null,
      earningsDate: '—',
    },
    financials: {
      revenueGrowth: m['revenueGrowth3Y'] ?? null,
      earningsGrowth: m['epsGrowth3Y'] ?? null,
      grossMargins: m['grossMargin'] ?? null,
      operatingMargins: m['operatingMargin'] ?? null,
      profitMargins: m['netProfitMarginAnnual'] ?? null,
      returnOnEquity: m['roeRfy'] ?? m['roeAnnual'] ?? null,
      returnOnAssets: m['roaRfy'] ?? m['roaAnnual'] ?? null,
      freeCashflow: m['freeCashFlowAnnual'] ? m['freeCashFlowAnnual'] * 1e6 : null,
      totalDebt: m['totalDebt/totalEquityAnnual'] ?? null,
      totalCash: null,
      targetMeanPrice: tgt.targetMean ?? null,
      targetLowPrice: tgt.targetLow ?? null,
      targetHighPrice: tgt.targetHigh ?? null,
      annualIncome: [],
      quarterlyIncome: [],
    },
    estimates: {
      trend: [],
      history: earnArr.slice(0, 8).map((e: any) => ({
        quarter: e.period ?? '',
        epsEstimate: e.estimate ?? null,
        epsActual: e.actual ?? null,
        surprise: e.surprisePercent ?? null,
      })),
    },
    analyst: {
      recommendations: latestRec ? {
        period: latestRec.period,
        strongBuy: latestRec.strongBuy ?? 0,
        buy: latestRec.buy ?? 0,
        hold: latestRec.hold ?? 0,
        sell: latestRec.sell ?? 0,
        strongSell: latestRec.strongSell ?? 0,
      } : null,
      upgrades: [],
      targetMean: tgt.targetMean ?? null,
      targetLow: tgt.targetLow ?? null,
      targetHigh: tgt.targetHigh ?? null,
      numAnalysts: tgt.numberOfAnalysts ?? null,
    },
    ownership: {
      insiderPctHeld: null,
      institutionPctHeld: null,
      institutionFloatPct: null,
      institutionCount: null,
      holders: [],
    },
    insiders: { transactions: [] },
    _source: 'finnhub',
    ts: Date.now(),
  };
}

const EMPTY_FUNDAMENTALS = {
  profile: { sector: null, industry: null, employees: null, website: null, country: null, city: null, state: null, description: null, officers: [] },
  keyStats: { marketCap: null, enterpriseValue: null, trailingPE: null, forwardPE: null, pegRatio: null, priceToBook: null, beta: null, dividendRate: null, dividendYield: null, payoutRatio: null, exDividendDate: '—', shortPercentFloat: null, earningsDate: '—' },
  financials: { revenueGrowth: null, earningsGrowth: null, grossMargins: null, operatingMargins: null, profitMargins: null, returnOnEquity: null, returnOnAssets: null, freeCashflow: null, totalDebt: null, totalCash: null, targetMeanPrice: null, targetLowPrice: null, targetHighPrice: null, annualIncome: [], quarterlyIncome: [] },
  estimates: { trend: [], history: [] },
  analyst: { recommendations: null, upgrades: [], targetMean: null, targetLow: null, targetHigh: null, numAnalysts: null },
  ownership: { insiderPctHeld: null, institutionPctHeld: null, institutionFloatPct: null, institutionCount: null, holders: [] },
  insiders: { transactions: [] },
};

const YF_MODULES = [
  'assetProfile',
  'summaryDetail',
  'financialData',
  'defaultKeyStatistics',
  'incomeStatementHistory',
  'incomeStatementHistoryQuarterly',
  'earningsTrend',
  'earningsHistory',
  'upgradeDowngradeHistory',
  'recommendationTrend',
  'institutionOwnership',
  'majorHoldersBreakdown',
  'insiderTransactions',
].join(',');

router.get('/:ticker/fundamentals', async (req, res) => {
  const ticker = req.params.ticker.toUpperCase();

  // DB-first
  const fromDB = await getFundamentals(ticker);
  if (fromDB) { res.json({ ...fromDB, cached: true }); return; }

  // Try Finnhub (reliable free tier) then Yahoo Finance
  const fhKey = FINNHUB_KEY();
  if (fhKey) {
    try {
      const data = await finnhubFundamentals(ticker, fhKey);
      await saveFundamentals(ticker, data);
      res.json({ ...data, cached: false }); return;
    } catch (e) {
      console.warn(`[fundamentals] Finnhub failed for ${ticker}:`, e);
    }
  }

  try {
    const j = await yfFetch(`/v11/finance/quoteSummary/${encodeURIComponent(ticker)}`, { modules: YF_MODULES });
    if (j?.quoteSummary?.error) throw new Error(j.quoteSummary.error.description ?? 'Yahoo Finance error');
    const d = j?.quoteSummary?.result?.[0];
    if (!d) throw new Error('No data returned from Yahoo Finance');

    const ap = d.assetProfile ?? {};
    const sd = d.summaryDetail ?? {};
    const fd = d.financialData ?? {};
    const ks = d.defaultKeyStatistics ?? {};
    const income = (d.incomeStatementHistory?.incomeStatementHistory ?? []) as any[];
    const incomeQ = (d.incomeStatementHistoryQuarterly?.incomeStatementHistory ?? []) as any[];
    const trend = (d.earningsTrend?.trend ?? []) as any[];
    const history = (d.earningsHistory?.history ?? []) as any[];
    const upgrades = (d.upgradeDowngradeHistory?.history ?? []) as any[];
    const recTrend = (d.recommendationTrend?.trend ?? []) as any[];
    const mhb = d.majorHoldersBreakdown ?? {};
    const instOwn = (d.institutionOwnership?.ownershipList ?? []) as any[];
    const insTx = (d.insiderTransactions?.transactions ?? []) as any[];

    const normalizeStatement = (stmts: any[]) => stmts.map(s => ({
      endDate: yahooFmt(s.endDate),
      totalRevenue: yahooRaw(s.totalRevenue),
      grossProfit: yahooRaw(s.grossProfit),
      operatingIncome: yahooRaw(s.operatingIncome),
      netIncome: yahooRaw(s.netIncome),
      basicEPS: yahooRaw(s.basicEps),
      ebitda: yahooRaw(s.ebitda),
    }));

    const data: Record<string, unknown> = {
      ticker,
      profile: {
        sector: ap.sector ?? null,
        industry: ap.industry ?? null,
        employees: ap.fullTimeEmployees ?? null,
        website: ap.website ?? null,
        country: ap.country ?? null,
        city: ap.city ?? null,
        state: ap.state ?? null,
        description: ap.longBusinessSummary ?? null,
        officers: (ap.companyOfficers ?? []).slice(0, 6).map((o: any) => ({
          name: o.name,
          title: o.title,
          totalPay: yahooRaw(o.totalPay),
        })),
      },
      keyStats: {
        marketCap: yahooRaw(sd.marketCap),
        enterpriseValue: yahooRaw(ks.enterpriseValue),
        trailingPE: yahooRaw(sd.trailingPE),
        forwardPE: yahooRaw(sd.forwardPE),
        pegRatio: yahooRaw(ks.pegRatio),
        priceToBook: yahooRaw(ks.priceToBook),
        beta: yahooRaw(sd.beta),
        dividendRate: yahooRaw(sd.dividendRate),
        dividendYield: yahooRaw(sd.dividendYield),
        payoutRatio: yahooRaw(sd.payoutRatio),
        exDividendDate: yahooFmt(sd.exDividendDate),
        shortPercentFloat: yahooRaw(ks.shortPercentOfFloat),
        earningsDate: yahooFmt((sd.earningsTimestamp ?? sd.earningsTimestampStart)),
      },
      financials: {
        revenueGrowth: yahooRaw(fd.revenueGrowth),
        earningsGrowth: yahooRaw(fd.earningsGrowth),
        grossMargins: yahooRaw(fd.grossMargins),
        operatingMargins: yahooRaw(fd.operatingMargins),
        profitMargins: yahooRaw(fd.profitMargins),
        returnOnEquity: yahooRaw(fd.returnOnEquity),
        returnOnAssets: yahooRaw(fd.returnOnAssets),
        freeCashflow: yahooRaw(fd.freeCashflow),
        totalDebt: yahooRaw(fd.totalDebt),
        totalCash: yahooRaw(fd.totalCash),
        targetMeanPrice: yahooRaw(fd.targetMeanPrice),
        targetLowPrice: yahooRaw(fd.targetLowPrice),
        targetHighPrice: yahooRaw(fd.targetHighPrice),
        annualIncome: normalizeStatement(income.slice(0, 4)),
        quarterlyIncome: normalizeStatement(incomeQ.slice(0, 4)),
      },
      estimates: {
        trend: trend.map((t: any) => ({
          period: t.period,
          periodLabel: t.endDate ?? t.period,
          epsAvg: yahooRaw(t.earningsEstimate?.avg),
          epsLow: yahooRaw(t.earningsEstimate?.low),
          epsHigh: yahooRaw(t.earningsEstimate?.high),
          epsAnalysts: yahooRaw(t.earningsEstimate?.numberOfAnalysts),
          revAvg: yahooRaw(t.revenueEstimate?.avg),
          revLow: yahooRaw(t.revenueEstimate?.low),
          revHigh: yahooRaw(t.revenueEstimate?.high),
          revAnalysts: yahooRaw(t.revenueEstimate?.numberOfAnalysts),
        })),
        history: history.slice(0, 8).map((h: any) => ({
          quarter: yahooFmt(h.quarter),
          epsEstimate: yahooRaw(h.epsEstimate),
          epsActual: yahooRaw(h.epsActual),
          surprise: yahooRaw(h.surprisePercent),
        })),
      },
      analyst: {
        recommendations: recTrend.slice(0, 1).map((t: any) => ({
          period: t.period,
          strongBuy: t.strongBuy ?? 0,
          buy: t.buy ?? 0,
          hold: t.hold ?? 0,
          sell: t.sell ?? 0,
          strongSell: t.strongSell ?? 0,
        }))[0] ?? null,
        upgrades: upgrades.slice(0, 20).map((u: any) => ({
          firm: u.firm,
          action: u.action,
          toGrade: u.toGrade,
          fromGrade: u.fromGrade,
          date: new Date((u.epochGradeDate ?? 0) * 1000).toISOString().slice(0, 10),
        })),
        targetMean: yahooRaw(fd.targetMeanPrice),
        targetLow: yahooRaw(fd.targetLowPrice),
        targetHigh: yahooRaw(fd.targetHighPrice),
        numAnalysts: yahooRaw(fd.numberOfAnalystOpinions),
      },
      ownership: {
        insiderPctHeld:      yahooRaw(mhb.insidersPercentHeld),
        institutionPctHeld:  yahooRaw(mhb.institutionsPercentHeld),
        institutionFloatPct: yahooRaw(mhb.institutionsFloatPercentHeld),
        institutionCount:    yahooRaw(mhb.institutionsCount),
        holders: instOwn.slice(0, 15).map((o: any) => ({
          organization: o.organization ?? '',
          reportDate:   yahooFmt(o.reportDate),
          pctHeld:      yahooRaw(o.pctHeld),
          shares:       yahooRaw(o.shares),
          value:        yahooRaw(o.value),
        })),
      },
      insiders: {
        transactions: insTx.slice(0, 20).map((t: any) => ({
          name:        t.filerName ?? '',
          relation:    t.filerRelation ?? '',
          date:        yahooFmt(t.startDate),
          description: t.transactionText ?? '',
          shares:      yahooRaw(t.shares),
          value:       yahooRaw(t.value),
          ownership:   t.ownership ?? '',
        })),
      },
      ts: Date.now(),
    };

    await saveFundamentals(ticker, data);
    res.json({ ...data, cached: false });
  } catch (e) {
    console.error(`[fundamentals] ${ticker}:`, e);
    res.json({ ticker, ...EMPTY_FUNDAMENTALS, ts: Date.now(), cached: false, _error: String(e) });
  }
});

// ─── Peer comparison ──────────────────────────────────────────────────────────

async function fetchPeerData(symbol: string): Promise<Record<string, unknown>> {
  const j = await yfFetch(`/v11/finance/quoteSummary/${encodeURIComponent(symbol)}`, {
    modules: 'price,summaryDetail,defaultKeyStatistics,financialData',
  });
  const d = j?.quoteSummary?.result?.[0];
  if (!d) throw new Error(`no data for ${symbol}`);
  const p = d.price ?? {};
  const sd = d.summaryDetail ?? {};
  const ks = d.defaultKeyStatistics ?? {};
  const fd = d.financialData ?? {};
  return {
    ticker: symbol,
    name: p.shortName ?? p.longName ?? symbol,
    marketCap:     yahooRaw(p.marketCap),
    price:         yahooRaw(p.regularMarketPrice),
    changePct:     yahooRaw(p.regularMarketChangePercent),
    trailingPE:    yahooRaw(sd.trailingPE),
    forwardPE:     yahooRaw(sd.forwardPE),
    pegRatio:      yahooRaw(ks.pegRatio),
    revenueGrowth: yahooRaw(fd.revenueGrowth),
    profitMargins: yahooRaw(fd.profitMargins),
    returnOnEquity:yahooRaw(fd.returnOnEquity),
  };
}

router.get('/:ticker/peers', async (req, res) => {
  const ticker = req.params.ticker.toUpperCase();

  // DB-first
  const fromDB = await getPeers(ticker);
  if (fromDB) { res.json({ peers: fromDB, cached: true }); return; }

  const fhKey = FINNHUB_KEY();
  if (fhKey) {
    try {
      const peersJ = await finnhubGet(`/stock/peers?symbol=${encodeURIComponent(ticker)}`, fhKey);
      const symbols: string[] = (peersJ ?? []).filter((s: string) => s !== ticker).slice(0, 5);
      if (symbols.length > 0) {
        const peerData = await Promise.allSettled(symbols.map(async (sym) => {
          const q = await finnhubGet(`/quote?symbol=${encodeURIComponent(sym)}`, fhKey);
          const p = await finnhubGet(`/stock/profile2?symbol=${encodeURIComponent(sym)}`, fhKey).catch(() => ({}));
          return {
            ticker: sym, name: p.name ?? sym,
            marketCap: p.marketCapitalization ? p.marketCapitalization * 1e6 : null,
            price: q.c ?? null, changePct: q.dp ?? null,
            trailingPE: null, forwardPE: null, pegRatio: null,
            revenueGrowth: null, profitMargins: null, returnOnEquity: null,
          };
        }));
        const peers = peerData
          .filter(fulfilled)
          .map(r => r.value);
        await savePeers(ticker, peers, 'finnhub');
        res.json({ peers, cached: false }); return;
      }
    } catch (e) {
      console.warn(`[peers] Finnhub failed for ${ticker}:`, e);
    }
  }

  try {
    const recJ = await yfFetch(`/v6/finance/recommendationsbysymbol/${encodeURIComponent(ticker)}`);
    const recs = recJ?.finance?.result?.[0]?.recommendedSymbols ?? [];
    const symbols: string[] = recs.slice(0, 5).map((r: any) => r.symbol as string);
    if (symbols.length === 0) { res.json({ peers: [], cached: false }); return; }

    const results = await Promise.allSettled(symbols.map(fetchPeerData));
    const peers = results
      .filter(fulfilled)
      .map(r => r.value);
    await savePeers(ticker, peers, 'yahoo');
    res.json({ peers, cached: false });
  } catch (e) {
    console.error(`[peers] ${ticker}:`, e);
    res.json({ peers: [], cached: false, _error: String(e) });
  }
});

// ─── AI Analyst ───────────────────────────────────────────────────────────────

import Anthropic from '@anthropic-ai/sdk';

router.post('/:ticker/ai-analyst', async (req, res) => {
  const ticker = req.params.ticker.toUpperCase();
  const { question } = req.body as { question?: string };
  if (!question?.trim()) { res.status(400).json({ error: 'question required' }); return; }

  const apiKey = process.env.ANTHROPIC_API_KEY;
  if (!apiKey) { res.status(500).json({ error: 'ANTHROPIC_API_KEY not configured' }); return; }

  // Pull cached fundamentals for context (best-effort)
  const cached = await getFundamentals(ticker);
  let context = '';
  if (cached) {
    const d = cached as any;
    const p = d.profile ?? {};
    const ks = d.keyStats ?? {};
    const f = d.financials ?? {};
    const a = d.analyst ?? {};
    const est = d.estimates ?? {};
    const own = d.ownership ?? {};

    const pct = (n: number | null) => n != null ? `${(n * 100).toFixed(1)}%` : 'N/A';
    const money = (n: number | null) => {
      if (n == null) return 'N/A';
      if (Math.abs(n) >= 1e12) return `$${(n / 1e12).toFixed(2)}T`;
      if (Math.abs(n) >= 1e9)  return `$${(n / 1e9).toFixed(1)}B`;
      if (Math.abs(n) >= 1e6)  return `$${(n / 1e6).toFixed(1)}M`;
      return `$${n.toFixed(2)}`;
    };
    const num = (n: number | null, d = 2) => n != null ? n.toFixed(d) : 'N/A';

    const recentEarnings = (est.history ?? []).slice(0, 4).map((h: any) =>
      `${h.quarter}: est $${num(h.epsEstimate)} actual $${num(h.epsActual)} (${h.surprise != null ? (h.surprise >= 0 ? '+' : '') + num(h.surprise * 100, 1) + '%' : 'N/A'})`
    ).join(', ');

    const recCounts = a.recommendations;
    const recSummary = recCounts
      ? `Strong Buy: ${recCounts.strongBuy}, Buy: ${recCounts.buy}, Hold: ${recCounts.hold}, Sell: ${recCounts.sell}, Strong Sell: ${recCounts.strongSell}`
      : 'N/A';

    context = `
TICKER: ${ticker}
COMPANY: ${p.sector ?? 'N/A'} — ${p.industry ?? 'N/A'} (${p.country ?? 'N/A'}, ${p.employees?.toLocaleString() ?? 'N/A'} employees)

KEY STATISTICS:
- Market Cap: ${money(ks.marketCap)}
- Enterprise Value: ${money(ks.enterpriseValue)}
- Trailing P/E: ${num(ks.trailingPE)}x | Forward P/E: ${num(ks.forwardPE)}x | PEG: ${num(ks.pegRatio)}x
- Price/Book: ${num(ks.priceToBook)}x | Beta: ${num(ks.beta)}
- Short Float: ${pct(ks.shortPercentFloat)}
- Dividend Yield: ${pct(ks.dividendYield)}

FINANCIALS (TTM):
- Revenue Growth YoY: ${pct(f.revenueGrowth)} | EPS Growth: ${pct(f.earningsGrowth)}
- Gross Margin: ${pct(f.grossMargins)} | Op Margin: ${pct(f.operatingMargins)} | Net Margin: ${pct(f.profitMargins)}
- ROE: ${pct(f.returnOnEquity)} | ROA: ${pct(f.returnOnAssets)}
- Free Cash Flow: ${money(f.freeCashflow)} | Total Debt: ${money(f.totalDebt)} | Cash: ${money(f.totalCash)}

EARNINGS HISTORY (last 4 quarters): ${recentEarnings || 'N/A'}

ANALYST CONSENSUS: ${recSummary}
- Price Target: Mean ${money(a.targetMean)}, Range ${money(a.targetLow)}–${money(a.targetHigh)}
- Analysts covering: ${a.numAnalysts ?? 'N/A'}

OWNERSHIP:
- Institutional: ${pct(own.institutionPctHeld)} | Insider: ${pct(own.insiderPctHeld)} | # Institutions: ${own.institutionCount ?? 'N/A'}
`.trim();
  }

  const systemPrompt = `You are a senior equity analyst with expertise in fundamental analysis, valuation, and market research. You have access to real-time financial data for ${ticker}.

${context ? `Here is the current data for ${ticker}:\n\n${context}\n\n` : ''}Answer the user's question concisely and analytically. Use specific numbers from the data when relevant. Be direct and professional — no fluff. Format your response with clear sections if the answer is multi-part. Highlight key risks and opportunities. If data is missing, say so and provide general analytical context instead.`;

  try {
    const client = new Anthropic({ apiKey });
    const msg = await client.messages.create({
      model: 'claude-haiku-4-5-20251001',
      max_tokens: 1500,
      system: systemPrompt,
      messages: [{ role: 'user', content: question.trim() }],
    });

    const answer = msg.content
      .filter(b => b.type === 'text')
      .map(b => (b as { type: 'text'; text: string }).text)
      .join('');

    res.json({ answer, ticker, question: question.trim(), ts: Date.now() });
  } catch (e) {
    res.status(502).json({ error: String(e) });
  }
});

export default router;
