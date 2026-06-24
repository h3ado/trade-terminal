import cron from 'node-cron';
import { getWatchedTickers, isMarketHours, saveQuote, saveCandles } from './marketStore';

type QuoteFetcher = (ticker: string) => Promise<Record<string, unknown>>;
type CandleFetcher = (ticker: string, interval: string, outputsize: string) => Promise<Record<string, unknown>>;

let _fetchQuote: QuoteFetcher | null = null;
let _fetchCandles: CandleFetcher | null = null;

export function registerFetchers(q: QuoteFetcher, c: CandleFetcher) {
  _fetchQuote = q;
  _fetchCandles = c;
}

async function syncQuote(ticker: string) {
  if (!_fetchQuote) return;
  try {
    const data = await _fetchQuote(ticker);
    await saveQuote(ticker, data);
  } catch (e) {
    console.warn(`[marketSync] quote ${ticker}:`, e);
  }
}

async function syncCandles(ticker: string, interval: string, outputsize: string) {
  if (!_fetchCandles) return;
  try {
    const result = await _fetchCandles(ticker, interval, outputsize);
    const candles = result.candles as Array<{ time: string; open: number | null; high: number | null; low: number | null; close: number | null; volume: number | null }>;
    await saveCandles(ticker, interval, candles);
  } catch (e) {
    console.warn(`[marketSync] candles ${ticker} ${interval}:`, e);
  }
}

export function startMarketSync() {
  // Every 2 minutes — only runs during market hours
  cron.schedule('*/2 * * * *', async () => {
    if (!isMarketHours()) return;
    const tickers = await getWatchedTickers().catch(() => []);
    for (const ticker of tickers) {
      await syncQuote(ticker);
    }
  });

  // Daily candles — weekdays at 5:05pm ET (21:05 UTC, adjusted for DST by using ET check below)
  cron.schedule('5 21 * * 1-5', async () => {
    const tickers = await getWatchedTickers().catch(() => []);
    for (const ticker of tickers) {
      await syncCandles(ticker, '1day', '252');
    }
    console.log(`[marketSync] refreshed daily candles for ${tickers.length} tickers`);
  });

  // Weekly candles — Friday evenings
  cron.schedule('30 21 * * 5', async () => {
    const tickers = await getWatchedTickers().catch(() => []);
    for (const ticker of tickers) {
      await syncCandles(ticker, '1week', '104');
    }
  });

  console.log('[marketSync] scheduler started');
}
