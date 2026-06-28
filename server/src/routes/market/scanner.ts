import { Router } from 'express';
import { fetchQuoteFromAPI } from './security';

const router = Router();

const BASE_UNIVERSE = [
  'SPY', 'QQQ', 'IWM', 'AAPL', 'MSFT', 'NVDA', 'GOOGL', 'AMZN', 'META', 'TSLA',
  'AMD', 'COIN', 'PLTR', 'MARA', 'GME', 'SMCI', 'ARM', 'MRVL', 'PANW', 'CRWD',
  'BABA', 'TSM', 'NFLX', 'DIS', 'BA', 'GS', 'JPM', 'XOM', 'CVX', 'GLD',
];

let scanCache: { ts: number; data: unknown } | null = null;
const SCAN_TTL = 2 * 60_000;

function categorize(pct: number, volRatio: number): 'GAP' | 'VOL' | 'NEWS' {
  if (Math.abs(pct) >= 3) return 'GAP';
  if (volRatio >= 2.5) return 'VOL';
  return 'GAP';
}

function makeSpark(prev: number, close: number): number[] {
  return [0, 0.2, 0.35, 0.5, 0.65, 0.85, 1].map(t =>
    +((prev + (close - prev) * t)).toFixed(2)
  );
}

router.get('/premarket', async (req, res) => {
  if (scanCache && Date.now() - scanCache.ts < SCAN_TTL) {
    res.json(scanCache.data); return;
  }

  const envList = (process.env.MARKET_WATCHLIST ?? '')
    .split(',').map(s => s.trim().toUpperCase()).filter(Boolean);
  const universe = [...new Set([...envList, ...BASE_UNIVERSE])].slice(0, 40);

  const results = await Promise.allSettled(universe.map(t => fetchQuoteFromAPI(t)));

  const rows = results
    .map((r, i) => {
      if (r.status !== 'fulfilled') return null;
      const q = r.value;
      const pct = (q.changePct as number | null) ?? 0;
      const price = (q.price as number | null) ?? 0;
      const prevClose = (q.prevClose as number | null) ?? price;
      const vol = (q.volume as number | null) ?? 0;
      const avgVol = (q.avgVolume as number | null) ?? 1;
      const volRatio = avgVol > 0 ? +(vol / avgVol).toFixed(1) : 1.0;
      if (Math.abs(pct) < 0.3 && volRatio < 1.5) return null;
      return {
        sym: universe[i],
        last: +price.toFixed(2),
        pct: +pct.toFixed(2),
        vol: volRatio,
        cat: categorize(pct, volRatio),
        news: false,
        spark: makeSpark(prevClose, price),
      };
    })
    .filter(Boolean)
    .sort((a, b) => Math.abs(b!.pct) - Math.abs(a!.pct))
    .slice(0, 20);

  const data = { rows, ts: Date.now() };
  scanCache = { ts: Date.now(), data };
  res.json(data);
});

export default router;
