import { Router } from 'express';

const router = Router();

// ─── FRED indicators ──────────────────────────────────────────────────────────

const FRED_SERIES: Record<string, { id: string; label: string; unit: string; transform: 'latest' | 'yoy_pct' | 'qoq_ann_pct' }> = {
  cpi_yoy:        { id: 'CPIAUCSL', label: 'CPI YoY', unit: '%', transform: 'yoy_pct' },
  core_cpi_yoy:   { id: 'CPILFESL', label: 'Core CPI YoY', unit: '%', transform: 'yoy_pct' },
  pce_yoy:        { id: 'PCEPI', label: 'PCE YoY', unit: '%', transform: 'yoy_pct' },
  core_pce_yoy:   { id: 'PCEPILFE', label: 'Core PCE YoY', unit: '%', transform: 'yoy_pct' },
  unemployment:   { id: 'UNRATE', label: 'Unemployment', unit: '%', transform: 'latest' },
  nfp_change:     { id: 'PAYEMS', label: 'NFP Δ (k)', unit: 'k', transform: 'latest' },
  gdp_growth:     { id: 'GDPC1', label: 'Real GDP QoQ Ann.', unit: '%', transform: 'qoq_ann_pct' },
  fed_funds:      { id: 'DFEDTARU', label: 'Fed Funds Upper', unit: '%', transform: 'latest' },
  ten_year:       { id: 'DGS10', label: '10Y Treasury', unit: '%', transform: 'latest' },
  two_year:       { id: 'DGS2', label: '2Y Treasury', unit: '%', transform: 'latest' },
  m2:             { id: 'M2SL', label: 'M2 YoY', unit: '%', transform: 'yoy_pct' },
  industrial_prod: { id: 'INDPRO', label: 'Industrial Prod YoY', unit: '%', transform: 'yoy_pct' },
  retail_sales:   { id: 'RSAFS', label: 'Retail Sales YoY', unit: '%', transform: 'yoy_pct' },
};

type Obs = { date: string; value: string };
type Indicator = { key: string; id: string; label: string; unit: string; value: number | null; prev: number | null; change: number | null; date: string | null };

function num(s: string | undefined): number | null {
  if (!s || s === '.') return null;
  const v = parseFloat(s);
  return Number.isFinite(v) ? v : null;
}

function buildIndicator(key: string, obs: Obs[]): Indicator {
  const meta = FRED_SERIES[key];
  const out: Indicator = { key, id: meta.id, label: meta.label, unit: meta.unit, value: null, prev: null, change: null, date: null };
  if (!obs.length) return out;
  if (meta.transform === 'latest') {
    if (key === 'nfp_change') {
      const v0 = num(obs[0]?.value), v1 = num(obs[1]?.value), v2 = num(obs[2]?.value);
      out.date = obs[0]?.date ?? null;
      out.value = v0 != null && v1 != null ? Math.round(v0 - v1) : null;
      out.prev = v1 != null && v2 != null ? Math.round(v1 - v2) : null;
    } else {
      out.value = num(obs[0]?.value); out.prev = num(obs[1]?.value); out.date = obs[0]?.date ?? null;
    }
  } else if (meta.transform === 'yoy_pct') {
    const v0 = num(obs[0]?.value), v12 = num(obs[12]?.value), v1 = num(obs[1]?.value), v13 = num(obs[13]?.value);
    out.date = obs[0]?.date ?? null;
    out.value = v0 != null && v12 != null && v12 !== 0 ? +(((v0 - v12) / v12) * 100).toFixed(2) : null;
    out.prev = v1 != null && v13 != null && v13 !== 0 ? +(((v1 - v13) / v13) * 100).toFixed(2) : null;
  } else if (meta.transform === 'qoq_ann_pct') {
    const v0 = num(obs[0]?.value), v1 = num(obs[1]?.value), v2 = num(obs[2]?.value);
    out.date = obs[0]?.date ?? null;
    out.value = v0 != null && v1 != null && v1 > 0 ? +(Math.pow(v0 / v1, 4) - 1) * 100 : null;
    out.prev = v1 != null && v2 != null && v2 > 0 ? +(Math.pow(v1 / v2, 4) - 1) * 100 : null;
  }
  if (out.value != null && out.prev != null) out.change = +(out.value - out.prev).toFixed(2);
  return out;
}

let fredCache: { ts: number; indicators: Indicator[] } | null = null;
const FRED_TTL = 3600_000;

router.get('/fred-indicators', async (_req, res) => {
  if (fredCache && Date.now() - fredCache.ts < FRED_TTL) {
    res.json({ indicators: fredCache.indicators, ts: fredCache.ts, source: 'fred', cached: true }); return;
  }
  const apiKey = process.env.FRED_API_KEY;
  if (!apiKey) { res.json({ indicators: [], ts: Date.now(), source: 'fred', cached: false }); return; }
  try {
    const keys = Object.keys(FRED_SERIES);
    const results = await Promise.allSettled(keys.map(async k => {
      const url = `https://api.stlouisfed.org/fred/series/observations?series_id=${FRED_SERIES[k].id}&api_key=${apiKey}&file_type=json&sort_order=desc&limit=16`;
      const r = await fetch(url);
      if (!r.ok) throw new Error(`FRED ${k} ${r.status}`);
      const json = await r.json() as any;
      return buildIndicator(k, json.observations ?? []);
    }));
    const indicators: Indicator[] = results.map((r, i) => {
      if (r.status === 'fulfilled') return r.value;
      const meta = FRED_SERIES[keys[i]];
      return { key: keys[i], id: meta.id, label: meta.label, unit: meta.unit, value: null, prev: null, change: null, date: null };
    });
    fredCache = { ts: Date.now(), indicators };
    res.json({ indicators, ts: fredCache.ts, source: 'fred', cached: false });
  } catch (e) { res.status(502).json({ error: String(e) }); }
});

// ─── World Bank indicators ────────────────────────────────────────────────────

const WB_SERIES: Record<string, { code: string; label: string; unit: string }> = {
  gdp_usd:     { code: 'NY.GDP.MKTP.CD', label: 'GDP (current $)', unit: 'USD' },
  gdp_per_cap: { code: 'NY.GDP.PCAP.CD', label: 'GDP per capita', unit: 'USD' },
  gdp_growth:  { code: 'NY.GDP.MKTP.KD.ZG', label: 'GDP growth', unit: '%' },
  inflation:   { code: 'FP.CPI.TOTL.ZG', label: 'Inflation CPI', unit: '%' },
  unemployment: { code: 'SL.UEM.TOTL.ZS', label: 'Unemployment', unit: '%' },
  population:  { code: 'SP.POP.TOTL', label: 'Population', unit: 'people' },
  current_acct: { code: 'BN.CAB.XOKA.GD.ZS', label: 'Current acct (% GDP)', unit: '%' },
  govt_debt:   { code: 'GC.DOD.TOTL.GD.ZS', label: 'Govt debt (% GDP)', unit: '%' },
};

const WB_COUNTRIES = [
  'USA','CHN','JPN','DEU','IND','GBR','FRA','CAN','BRA','KOR','AUS','MEX','CHE',
  'ITA','ESP','NLD','SAU','TUR','RUS','IDN','POL','BEL','SWE','NOR','SGP','HKG',
  'IRL','ARE','AUT','ZAF','THA','VNM','PHL','MYS','EGY','NGA','ARG','CHL','COL',
  'NZL','DNK','FIN','PRT','GRC','CZE','ROU','HUN','ISR','UKR','PAK','BGD',
];

let wbCache: { ts: number; data: unknown } | null = null;
const WB_TTL = 86400_000;

router.get('/worldbank-indicators', async (_req, res) => {
  if (wbCache && Date.now() - wbCache.ts < WB_TTL) { res.json(wbCache.data); return; }
  try {
    const countries = WB_COUNTRIES.join(';');
    const entries = Object.entries(WB_SERIES);
    const results = await Promise.allSettled(entries.map(async ([key, meta]) => {
      const url = `https://api.worldbank.org/v2/country/${countries}/indicator/${meta.code}?format=json&per_page=2000&mrv=4`;
      const r = await fetch(url, { headers: { 'User-Agent': 'trade-terminal/1.0' } });
      if (!r.ok) throw new Error(`worldbank ${meta.code} ${r.status}`);
      const json = await r.json() as any[];
      const rows: any[] = Array.isArray(json) && json.length > 1 ? json[1] : [];
      const byIso3: Record<string, unknown> = {};
      for (const row of rows) {
        const iso3: string = row?.countryiso3code;
        if (!iso3 || !WB_COUNTRIES.includes(iso3)) continue;
        const value: number | null = row?.value;
        const year = row?.date ? parseInt(row.date, 10) : null;
        const existing = byIso3[iso3] as any;
        if (value != null && (!existing || existing.value == null || year! > existing.year)) {
          byIso3[iso3] = { iso3, iso2: row?.country?.id ?? '', country: row?.country?.value ?? iso3, year, value };
        } else if (!existing) {
          byIso3[iso3] = { iso3, iso2: row?.country?.id ?? '', country: row?.country?.value ?? iso3, year, value };
        }
      }
      return { key, ...meta, byIso3 };
    }));
    const series = results.map((r, i) => r.status === 'fulfilled' ? r.value : { key: entries[i][0], ...entries[i][1], byIso3: {} });
    const data = { series, ts: Date.now() };
    wbCache = { ts: Date.now(), data };
    res.json(data);
  } catch (e) { res.status(502).json({ error: String(e) }); }
});

// ─── EIA energy ───────────────────────────────────────────────────────────────

const EIA_SERIES: Record<string, { route: string; label: string; unit: string; series: string }> = {
  wti:               { route: 'petroleum/pri/spt/data', label: 'WTI Crude Spot', unit: '$/bbl', series: 'RWTC' },
  brent:             { route: 'petroleum/pri/spt/data', label: 'Brent Spot', unit: '$/bbl', series: 'RBRTE' },
  henry_hub:         { route: 'natural-gas/pri/fut/data', label: 'Henry Hub', unit: '$/MMBtu', series: 'RNGWHHD' },
  crude_stocks:      { route: 'petroleum/stoc/wstk/data', label: 'Crude Stocks (ex-SPR)', unit: 'Mbbl', series: 'WCESTUS1' },
  gasoline_stocks:   { route: 'petroleum/stoc/wstk/data', label: 'Gasoline Stocks', unit: 'Mbbl', series: 'WGTSTUS1' },
  distillate_stocks: { route: 'petroleum/stoc/wstk/data', label: 'Distillate Stocks', unit: 'Mbbl', series: 'WDISTUS1' },
  crude_production:  { route: 'petroleum/sum/snd/data', label: 'US Crude Production', unit: 'kb/d', series: 'MCRFPUS2' },
  natgas_storage:    { route: 'natural-gas/stor/wkly/data', label: 'NatGas Working Storage', unit: 'Bcf', series: 'NW2_EPG0_SWO_R48_BCF' },
};

let eiaCache: { ts: number; data: unknown } | null = null;
const EIA_TTL = 3600_000;

router.get('/eia-energy', async (_req, res) => {
  if (eiaCache && Date.now() - eiaCache.ts < EIA_TTL) { res.json(eiaCache.data); return; }
  const apiKey = process.env.EIA_API_KEY;
  if (!apiKey) { res.json({ indicators: [], ts: Date.now() }); return; }
  try {
    const entries = Object.entries(EIA_SERIES);
    const results = await Promise.allSettled(entries.map(async ([key, meta]) => {
      const url = `https://api.eia.gov/v2/${meta.route}/?api_key=${apiKey}&data[]=value&facets[series][]=${meta.series}&sort[0][column]=period&sort[0][direction]=desc&length=2`;
      const r = await fetch(url);
      if (!r.ok) throw new Error(`EIA ${key} ${r.status}`);
      const j = await r.json() as any;
      const rows: any[] = j?.response?.data ?? [];
      const v0 = rows[0]?.value != null ? parseFloat(rows[0].value) : null;
      const v1 = rows[1]?.value != null ? parseFloat(rows[1].value) : null;
      return { key, label: meta.label, unit: meta.unit, value: v0, prev: v1, change: v0 != null && v1 != null ? +(v0 - v1).toFixed(4) : null, date: rows[0]?.period ?? null };
    }));
    const indicators = results.map((r, i) => r.status === 'fulfilled' ? r.value : { key: entries[i][0], label: entries[i][1].label, unit: entries[i][1].unit, value: null, prev: null, change: null, date: null });
    const data = { indicators, ts: Date.now() };
    eiaCache = { ts: Date.now(), data };
    res.json(data);
  } catch (e) { res.status(502).json({ error: String(e) }); }
});

// ─── Yield curve (FRED treasury series) ──────────────────────────────────────

const YIELD_SERIES: Array<{ id: string; label: string; years: number }> = [
  { id: 'DGS1MO', label: '1M',  years: 1/12 },
  { id: 'DGS3MO', label: '3M',  years: 0.25 },
  { id: 'DGS6MO', label: '6M',  years: 0.5  },
  { id: 'DGS1',   label: '1Y',  years: 1    },
  { id: 'DGS2',   label: '2Y',  years: 2    },
  { id: 'DGS5',   label: '5Y',  years: 5    },
  { id: 'DGS10',  label: '10Y', years: 10   },
  { id: 'DGS20',  label: '20Y', years: 20   },
  { id: 'DGS30',  label: '30Y', years: 30   },
];

let yieldCache: { ts: number; data: unknown } | null = null;
const YIELD_TTL = 3600_000;

router.get('/yield-curve', async (_req, res) => {
  if (yieldCache && Date.now() - yieldCache.ts < YIELD_TTL) { res.json(yieldCache.data); return; }
  const fredKey = process.env.FRED_API_KEY;
  if (!fredKey) { res.json({ tenors: [], spreads: {}, inverted: false, fetchedAt: Date.now() }); return; }
  try {
    const results = await Promise.allSettled(YIELD_SERIES.map(async (s) => {
      const url = `https://api.stlouisfed.org/fred/series/observations?series_id=${s.id}&api_key=${fredKey}&file_type=json&sort_order=desc&limit=400`;
      const r = await fetch(url);
      if (!r.ok) throw new Error(`FRED ${s.id} ${r.status}`);
      const j = await r.json() as any;
      const obs: Array<{ date: string; value: string }> = (j.observations ?? []).filter((o: any) => o.value !== '.');
      const pick = (i: number): number | null => {
        const o = obs[i];
        return o ? parseFloat(o.value) : null;
      };
      return { ...s, current: pick(0), wk1: pick(7), mo1: pick(22), yr1: pick(252) };
    }));

    const tenors = results.map((r, i) =>
      r.status === 'fulfilled' ? r.value : { ...YIELD_SERIES[i], current: null, wk1: null, mo1: null, yr1: null }
    );

    const byLabel = Object.fromEntries(tenors.map(t => [t.label, t.current]));
    const s2s10  = byLabel['10Y'] != null && byLabel['2Y']  != null ? +(byLabel['10Y']! - byLabel['2Y']!).toFixed(3)  : null;
    const s3m10y = byLabel['10Y'] != null && byLabel['3M']  != null ? +(byLabel['10Y']! - byLabel['3M']!).toFixed(3)  : null;
    const s5s30  = byLabel['30Y'] != null && byLabel['5Y']  != null ? +(byLabel['30Y']! - byLabel['5Y']!).toFixed(3)  : null;

    const data = { tenors, spreads: { s2s10, s3m10y, s5s30 }, inverted: s2s10 != null && s2s10 < 0, fetchedAt: Date.now() };
    yieldCache = { ts: Date.now(), data };
    res.json(data);
  } catch (e) { res.json({ tenors: [], spreads: {}, inverted: false, fetchedAt: Date.now(), error: String(e) }); }
});

// ─── Commodity prices ─────────────────────────────────────────────────────────
// Gold via Twelve Data (XAU/USD supported on free tier)
// Silver/Wheat/Corn/Oil/Gas via Finnhub ETF proxies (GLD, SLV, WEAT, CORN, USO, UNG)

const COMM_TD: Array<{ symbol: string; name: string; category: 'Metals'; unit: string }> = [
  { symbol: 'XAU/USD', name: 'Gold', category: 'Metals', unit: '$/oz' },
];

const COMM_FH: Array<{ symbol: string; name: string; category: 'Metals' | 'Agriculture' | 'Energy'; unit: string; note: string }> = [
  { symbol: 'SLV',  name: 'Silver',   category: 'Metals',      unit: '$/sh',   note: 'iShares Silver Trust' },
  { symbol: 'WEAT', name: 'Wheat',    category: 'Agriculture', unit: '$/sh',   note: 'Teucrium Wheat ETF' },
  { symbol: 'CORN', name: 'Corn',     category: 'Agriculture', unit: '$/sh',   note: 'Teucrium Corn ETF' },
  { symbol: 'USO',  name: 'WTI Oil',  category: 'Energy',      unit: '$/sh',   note: 'US Oil Fund ETF' },
  { symbol: 'UNG',  name: 'NatGas',   category: 'Energy',      unit: '$/sh',   note: 'US Natural Gas ETF' },
];

let commCache: { ts: number; data: unknown } | null = null;
const COMM_TTL = 5 * 60_000;

router.get('/commodities', async (_req, res) => {
  if (commCache && Date.now() - commCache.ts < COMM_TTL) { res.json(commCache.data); return; }
  const tdKey = process.env.TWELVE_DATA_API_KEY;
  const fhKey = process.env.FINNHUB_API_KEY;
  try {
    const [tdResults, fhResults] = await Promise.allSettled([
      // Twelve Data: gold spot price
      tdKey ? Promise.allSettled(COMM_TD.map(async (c) => {
        const r = await fetch(`https://api.twelvedata.com/quote?symbol=${encodeURIComponent(c.symbol)}&apikey=${tdKey}`, { signal: AbortSignal.timeout(8000) });
        if (!r.ok) throw new Error(`TD ${r.status}`);
        const j = await r.json() as any;
        if (j?.code && j.code !== 200) throw new Error(j.message);
        return { ...c, last: parseFloat(j.close) || null, change: parseFloat(j.change) || null, changePct: parseFloat(j.percent_change) || null, high: parseFloat(j.high) || null, low: parseFloat(j.low) || null };
      })) : Promise.resolve([] as any),
      // Finnhub: ETF proxies for other commodities
      fhKey ? Promise.allSettled(COMM_FH.map(async (c) => {
        const r = await fetch(`https://finnhub.io/api/v1/quote?symbol=${c.symbol}&token=${fhKey}`, { signal: AbortSignal.timeout(8000) });
        if (!r.ok) throw new Error(`FH ${r.status}`);
        const j = await r.json() as any;
        const last = j.c ?? null;
        const prev = j.pc ?? null;
        return { ...c, last, change: last != null && prev != null ? +(last - prev).toFixed(4) : null, changePct: j.dp ?? null, high: j.h ?? null, low: j.l ?? null };
      })) : Promise.resolve([] as any),
    ]);

    const fulfilled = <T,>(arr: PromiseSettledResult<T>[]) =>
      arr.filter((r): r is PromiseFulfilledResult<T> => r.status === 'fulfilled').map(r => r.value);

    const tdItems = Array.isArray(tdResults) ? fulfilled(tdResults) : (tdResults as any)?.value ? fulfilled((tdResults as any).value) : [];
    const fhItems = Array.isArray(fhResults) ? fulfilled(fhResults) : (fhResults as any)?.value ? fulfilled((fhResults as any).value) : [];

    const commodities = [...tdItems, ...fhItems].filter((c: any) => c.last != null);
    const data = { commodities, fetchedAt: Date.now() };
    commCache = { ts: Date.now(), data };
    res.json(data);
  } catch (e) { res.json({ commodities: [], fetchedAt: Date.now(), error: String(e) }); }
});

export default router;
