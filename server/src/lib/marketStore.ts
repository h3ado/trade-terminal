import prisma from './prisma';

// ─── TTLs ─────────────────────────────────────────────────────────────────────

const MS = {
  min: 60_000,
  hr: 3_600_000,
  day: 86_400_000,
};

const TTL = {
  quoteMarket:   2 * MS.min,
  quoteAfter:    1 * MS.hr,
  candle1day:    6 * MS.hr,
  candle1week:   1 * MS.day,
  candle1month:  7 * MS.day,
  fundamentals:  7 * MS.day,
  peers:         1 * MS.day,
};

function etNow(): Date {
  return new Date(new Date().toLocaleString('en-US', { timeZone: 'America/New_York' }));
}

export function isMarketHours(): boolean {
  const et = etNow();
  const day = et.getDay(); // 0=Sun, 6=Sat
  if (day === 0 || day === 6) return false;
  const mins = et.getHours() * 60 + et.getMinutes();
  return mins >= 9 * 60 + 30 && mins < 16 * 60;
}

function quoteTTL(): number {
  return isMarketHours() ? TTL.quoteMarket : TTL.quoteAfter;
}

function candleTTL(interval: string): number {
  if (interval === '1week')  return TTL.candle1week;
  if (interval === '1month') return TTL.candle1month;
  return TTL.candle1day;
}

function isFresh(fetchedAt: Date, ttl: number): boolean {
  return Date.now() - fetchedAt.getTime() < ttl;
}

// ─── Quote ────────────────────────────────────────────────────────────────────

export async function getQuote(ticker: string): Promise<Record<string, unknown> | null> {
  const row = await prisma.marketQuote.findUnique({ where: { ticker } });
  if (!row || !isFresh(row.fetchedAt, quoteTTL())) return null;
  return {
    ticker: row.ticker,
    name: row.name,
    exchange: row.exchange,
    currency: row.currency,
    price: row.price,
    open: row.open,
    high: row.high,
    low: row.low,
    prevClose: row.prevClose,
    change: row.change,
    changePct: row.changePct,
    volume: row.volume,
    avgVolume: row.avgVolume,
    fiftyTwoWeekHigh: row.weekHigh52,
    fiftyTwoWeekLow:  row.weekLow52,
    isMarketOpen: row.isMarketOpen,
    _source: row.source,
    ts: row.fetchedAt.getTime(),
  };
}

export async function saveQuote(ticker: string, data: Record<string, unknown>): Promise<void> {
  await prisma.marketQuote.upsert({
    where: { ticker },
    update: {
      name:         (data.name         as string  | null) ?? null,
      exchange:     (data.exchange      as string  | null) ?? null,
      currency:     (data.currency      as string) ?? 'USD',
      price:        (data.price         as number  | null) ?? null,
      open:         (data.open          as number  | null) ?? null,
      high:         (data.high          as number  | null) ?? null,
      low:          (data.low           as number  | null) ?? null,
      prevClose:    (data.prevClose      as number  | null) ?? null,
      change:       (data.change        as number  | null) ?? null,
      changePct:    (data.changePct     as number  | null) ?? null,
      volume:       (data.volume        as number  | null) ?? null,
      avgVolume:    (data.avgVolume     as number  | null) ?? null,
      weekHigh52:   (data.fiftyTwoWeekHigh as number | null) ?? null,
      weekLow52:    (data.fiftyTwoWeekLow  as number | null) ?? null,
      isMarketOpen: (data.isMarketOpen  as boolean) ?? false,
      source:       (data._source       as string) ?? 'unknown',
      fetchedAt:    new Date(),
    },
    create: {
      ticker,
      name:         (data.name         as string  | null) ?? null,
      exchange:     (data.exchange      as string  | null) ?? null,
      currency:     (data.currency      as string) ?? 'USD',
      price:        (data.price         as number  | null) ?? null,
      open:         (data.open          as number  | null) ?? null,
      high:         (data.high          as number  | null) ?? null,
      low:          (data.low           as number  | null) ?? null,
      prevClose:    (data.prevClose      as number  | null) ?? null,
      change:       (data.change        as number  | null) ?? null,
      changePct:    (data.changePct     as number  | null) ?? null,
      volume:       (data.volume        as number  | null) ?? null,
      avgVolume:    (data.avgVolume     as number  | null) ?? null,
      weekHigh52:   (data.fiftyTwoWeekHigh as number | null) ?? null,
      weekLow52:    (data.fiftyTwoWeekLow  as number | null) ?? null,
      isMarketOpen: (data.isMarketOpen  as boolean) ?? false,
      source:       (data._source       as string) ?? 'unknown',
    },
  }).catch(e => console.error('[marketStore] saveQuote error:', e));
}

// ─── Candles ──────────────────────────────────────────────────────────────────

export async function getCandles(ticker: string, interval: string): Promise<Record<string, unknown> | null> {
  // Check freshness via the most recently fetched candle
  const latest = await prisma.marketCandle.findFirst({
    where: { ticker, interval },
    orderBy: { fetchedAt: 'desc' },
    select: { fetchedAt: true },
  });
  if (!latest || !isFresh(latest.fetchedAt, candleTTL(interval))) return null;

  const rows = await prisma.marketCandle.findMany({
    where: { ticker, interval },
    orderBy: { date: 'asc' },
  });
  return {
    ticker,
    interval,
    candles: rows.map(r => ({
      time: r.date,
      open: r.open,
      high: r.high,
      low: r.low,
      close: r.close,
      volume: r.volume,
    })),
    ts: latest.fetchedAt.getTime(),
  };
}

export async function saveCandles(
  ticker: string,
  interval: string,
  candles: Array<{ time: string; open: number | null; high: number | null; low: number | null; close: number | null; volume: number | null }>,
): Promise<void> {
  if (candles.length === 0) return;
  const now = new Date();
  // Delete existing candles for this ticker+interval and bulk insert fresh data
  await prisma.$transaction([
    prisma.marketCandle.deleteMany({ where: { ticker, interval } }),
    prisma.marketCandle.createMany({
      data: candles.map(c => ({
        ticker,
        interval,
        date: c.time,
        open: c.open,
        high: c.high,
        low: c.low,
        close: c.close,
        volume: c.volume,
        fetchedAt: now,
      })),
    }),
  ]).catch(e => console.error('[marketStore] saveCandles error:', e));
}

// ─── Fundamentals ─────────────────────────────────────────────────────────────

export async function getFundamentals(ticker: string): Promise<Record<string, unknown> | null> {
  const row = await prisma.marketFundamentals.findUnique({ where: { ticker } });
  if (!row || !isFresh(row.fetchedAt, TTL.fundamentals)) return null;
  return { ...(row.data as Record<string, unknown>), _source: row.source, ts: row.fetchedAt.getTime() };
}

export async function saveFundamentals(ticker: string, data: Record<string, unknown>): Promise<void> {
  const source = (data._source as string) ?? 'unknown';
  await prisma.marketFundamentals.upsert({
    where: { ticker },
    update: { data: data as any, source, fetchedAt: new Date() },
    create: { ticker, data: data as any, source },
  }).catch(e => console.error('[marketStore] saveFundamentals error:', e));
}

// ─── Peers ────────────────────────────────────────────────────────────────────

export async function getPeers(ticker: string): Promise<Record<string, unknown>[] | null> {
  const row = await prisma.marketPeers.findUnique({ where: { ticker } });
  if (!row || !isFresh(row.fetchedAt, TTL.peers)) return null;
  return row.peers as Record<string, unknown>[];
}

export async function savePeers(ticker: string, peers: Record<string, unknown>[], source = 'unknown'): Promise<void> {
  await prisma.marketPeers.upsert({
    where: { ticker },
    update: { peers: peers as any, source, fetchedAt: new Date() },
    create: { ticker, peers: peers as any, source },
  }).catch(e => console.error('[marketStore] savePeers error:', e));
}

// ─── Watched tickers (from MARKET_WATCHLIST env or DB trades) ─────────────────

export async function getWatchedTickers(): Promise<string[]> {
  const envList = (process.env.MARKET_WATCHLIST ?? '')
    .split(',').map(s => s.trim().toUpperCase()).filter(Boolean);

  // Also include tickers with open/recent trades from the last 90 days
  const cutoff = new Date(Date.now() - 90 * 86_400_000);
  const tradeRows = await prisma.trade.findMany({
    where: { createdAt: { gte: cutoff } },
    select: { symbol: true },
    distinct: ['symbol'],
  });
  const tradeTickers = tradeRows.map(r => r.symbol.toUpperCase());

  return [...new Set([...envList, ...tradeTickers])];
}
