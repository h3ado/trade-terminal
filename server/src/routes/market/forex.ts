import { Router } from 'express';

const router = Router();

const TWELVE_KEY = () => process.env.TWELVE_DATA_API_KEY ?? '';

const PAIRS: { ccy: string; symbol: string; invert: boolean }[] = [
  { ccy: 'EUR', symbol: 'EUR/USD', invert: false },
  { ccy: 'GBP', symbol: 'GBP/USD', invert: false },
  { ccy: 'JPY', symbol: 'USD/JPY', invert: true },
  { ccy: 'CHF', symbol: 'USD/CHF', invert: true },
  { ccy: 'AUD', symbol: 'AUD/USD', invert: false },
  { ccy: 'NZD', symbol: 'NZD/USD', invert: false },
  { ccy: 'CAD', symbol: 'USD/CAD', invert: true },
  { ccy: 'CNY', symbol: 'USD/CNY', invert: true },
  { ccy: 'HKD', symbol: 'USD/HKD', invert: true },
  { ccy: 'SGD', symbol: 'USD/SGD', invert: true },
  { ccy: 'KRW', symbol: 'USD/KRW', invert: true },
  { ccy: 'INR', symbol: 'USD/INR', invert: true },
  { ccy: 'MXN', symbol: 'USD/MXN', invert: true },
  { ccy: 'BRL', symbol: 'USD/BRL', invert: true },
  { ccy: 'ZAR', symbol: 'USD/ZAR', invert: true },
  { ccy: 'TRY', symbol: 'USD/TRY', invert: true },
  { ccy: 'SEK', symbol: 'USD/SEK', invert: true },
  { ccy: 'NOK', symbol: 'USD/NOK', invert: true },
];

type FxRow = { ccy: string; usd: number; change_pct: number | null };
let fxCache: { ts: number; data: FxRow[] } | null = null;
const FX_TTL = 60_000;

async function fetchPair(p: (typeof PAIRS)[number], key: string): Promise<FxRow> {
  const url = `https://api.twelvedata.com/quote?symbol=${encodeURIComponent(p.symbol)}&apikey=${key}`;
  try {
    const res = await fetch(url);
    const j = await res.json() as any;
    if (j?.code && j.code !== 200) throw new Error(j.message || 'fx error');
    const close = parseFloat(j.close);
    const prev = parseFloat(j.previous_close);
    if (!isFinite(close) || close === 0) throw new Error('bad close');
    const usd = p.invert ? 1 / close : close;
    let change_pct: number | null = null;
    if (isFinite(prev) && prev !== 0) {
      const prevUsd = p.invert ? 1 / prev : prev;
      change_pct = ((usd - prevUsd) / prevUsd) * 100;
    }
    return { ccy: p.ccy, usd, change_pct };
  } catch { return { ccy: p.ccy, usd: NaN, change_pct: null }; }
}

router.get('/fx-rates', async (_req, res) => {
  const key = TWELVE_KEY();
  if (!key) { res.json({ rates: [], cached: false, ts: Date.now() }); return; }
  if (fxCache && Date.now() - fxCache.ts < FX_TTL) {
    res.json({ rates: fxCache.data, cached: true, ts: fxCache.ts }); return;
  }
  try {
    const data: FxRow[] = [];
    for (const p of PAIRS) {
      data.push(await fetchPair(p, key));
      await new Promise(r => setTimeout(r, 150));
    }
    fxCache = { ts: Date.now(), data };
    res.json({ rates: data, cached: false, ts: fxCache.ts });
  } catch (e) {
    res.status(502).json({ error: String(e) });
  }
});

// twelve-quotes: real-time quotes for a list of symbols
router.post('/twelve-quotes', async (req, res) => {
  const key = TWELVE_KEY();
  if (!key) { res.status(500).json({ error: 'TWELVE_DATA_API_KEY not set' }); return; }
  const { symbols } = req.body as { symbols: string[] };
  if (!symbols?.length) { res.status(400).json({ error: 'symbols required' }); return; }
  try {
    const symbolParam = symbols.slice(0, 8).join(',');
    const url = `https://api.twelvedata.com/quote?symbol=${encodeURIComponent(symbolParam)}&apikey=${key}`;
    const r = await fetch(url);
    const data = await r.json();
    res.json(data);
  } catch (e) {
    res.status(502).json({ error: String(e) });
  }
});

export default router;
