import { Router } from 'express';

const router = Router();

const HIGH_IMP = /(payroll|nonfarm|cpi|ppi|gdp|fomc|rate decision|jobless|unemployment|pce|retail sales|ism)/i;
const MED_IMP = /(housing|claims|industrial|sentiment|trade balance|inventories|durable)/i;

// ─── Econ calendar (FRED release dates) ──────────────────────────────────────

let econCache: { ts: number; data: unknown } | null = null;
const ECON_TTL = 600_000;

router.get('/econ', async (_req, res) => {
  if (econCache && Date.now() - econCache.ts < ECON_TTL) { res.json(econCache.data); return; }
  const fredKey = process.env.FRED_API_KEY;
  if (!fredKey) { res.json({ events: [], fetchedAt: Date.now() }); return; }
  try {
    const today = new Date().toISOString().slice(0, 10);
    const end = new Date(Date.now() + 30 * 86400_000).toISOString().slice(0, 10);
    const url = `https://api.stlouisfed.org/fred/releases/dates?api_key=${fredKey}&file_type=json&realtime_start=${today}&realtime_end=${end}&include_release_dates_with_no_data=true&order_by=release_date&sort_order=asc&limit=200`;
    const r = await fetch(url);
    if (!r.ok) throw new Error(`FRED releases ${r.status}`);
    const j = await r.json() as any;
    const events = (j.release_dates ?? []).map((rd: any) => {
      const name = rd.release_name;
      const importance: 1 | 2 | 3 = HIGH_IMP.test(name) ? 3 : MED_IMP.test(name) ? 2 : 1;
      return { id: `fred-${rd.release_id}-${rd.date}`, source: 'FRED', kind: 'econ', ts: `${rd.date}T13:30:00Z`, country: 'US', label: name, importance, prior: null, forecast: null, actual: null, unit: null, source_url: `https://fred.stlouisfed.org/release?rid=${rd.release_id}` };
    }).slice(0, 80);
    const data = { events, fetchedAt: Date.now() };
    econCache = { ts: Date.now(), data };
    res.json(data);
  } catch (e) { res.json({ events: [], fetchedAt: Date.now(), error: String(e) }); }
});

// ─── Earnings calendar (Finnhub) ─────────────────────────────────────────────

let earningsCache: { ts: number; data: unknown } | null = null;
const EARNINGS_TTL = 900_000;

router.get('/earnings', async (_req, res) => {
  if (earningsCache && Date.now() - earningsCache.ts < EARNINGS_TTL) { res.json(earningsCache.data); return; }
  const fhKey = process.env.FINNHUB_API_KEY;
  if (!fhKey) { res.json({ events: [], fetchedAt: Date.now() }); return; }
  try {
    const from = new Date().toISOString().slice(0, 10);
    const to = new Date(Date.now() + 14 * 86400_000).toISOString().slice(0, 10);
    const r = await fetch(`https://finnhub.io/api/v1/calendar/earnings?from=${from}&to=${to}&token=${fhKey}`, {
      headers: { 'User-Agent': 'trade-terminal/1.0' }, signal: AbortSignal.timeout(10000),
    });
    if (!r.ok) throw new Error(`Finnhub earnings ${r.status}`);
    const j = await r.json() as any;
    const events = (j.earningsCalendar ?? []).map((e: any) => {
      const h = (e.hour ?? '').toLowerCase();
      const timeOffset = h === 'bmo' ? 'T12:00:00Z' : h === 'amc' ? 'T21:00:00Z' : 'T20:00:00Z';
      const when = h === 'bmo' ? 'BMO' : h === 'amc' ? 'AMC' : 'TNS';
      return {
        id: `fh-${e.symbol}-${e.date}`,
        source: 'Finnhub', kind: 'earnings', ts: `${e.date}${timeOffset}`,
        country: 'US', ticker: e.symbol, label: e.symbol,
        importance: 2 as const,
        eps_est: e.epsEstimate ?? null,
        eps_prior: e.epsActual ?? null,
        when,
        source_url: `https://finance.yahoo.com/quote/${e.symbol}`,
      };
    });
    const data = { events, fetchedAt: Date.now() };
    earningsCache = { ts: Date.now(), data };
    res.json(data);
  } catch (e) { res.json({ events: [], fetchedAt: Date.now(), error: String(e) }); }
});

// ─── Central bank schedule ────────────────────────────────────────────────────

const CB_SCHEDULE = [
  { ts: '2026-06-11T18:00:00Z', country: 'US', label: 'FOMC Statement & SEP', current_rate: 4.00, est_change_bps: -25 },
  { ts: '2026-06-19T07:30:00Z', country: 'CH', label: 'SNB Rate Decision', current_rate: 0.25, est_change_bps: 0 },
  { ts: '2026-06-26T11:00:00Z', country: 'CA', label: 'BoC Overnight Rate', current_rate: 2.75, est_change_bps: -25 },
  { ts: '2026-07-09T11:45:00Z', country: 'EU', label: 'ECB Rate Decision', current_rate: 2.50, est_change_bps: -25 },
  { ts: '2026-07-30T18:00:00Z', country: 'US', label: 'FOMC Statement', current_rate: 3.75, est_change_bps: 0 },
  { ts: '2026-08-07T11:00:00Z', country: 'GB', label: 'BoE MPC Decision', current_rate: 3.75, est_change_bps: -25 },
];

router.get('/cb', (_req, res) => {
  const now = Date.now();
  const horizon = now + 90 * 86400_000;
  const events = CB_SCHEDULE.filter(e => { const t = new Date(e.ts).getTime(); return t >= now - 3600_000 && t <= horizon; }).map((e, i) => ({ id: `cb-${e.country}-${e.ts}-${i}`, source: 'CB', kind: 'cb', importance: 3, ...e }));
  res.json({ events, fetchedAt: Date.now() });
});

export default router;
