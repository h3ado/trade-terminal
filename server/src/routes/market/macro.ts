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
  retail_sales:   { id: 'RSAFS',        label: 'Retail Sales YoY',      unit: '%', transform: 'yoy_pct' },
  ppi_yoy:        { id: 'PPIFGS',       label: 'PPI YoY',               unit: '%', transform: 'yoy_pct' },
  core_ppi_yoy:   { id: 'WPUFD49116',   label: 'Core PPI YoY',          unit: '%', transform: 'yoy_pct' },
  u6_rate:        { id: 'U6RATE',        label: 'U-6 Rate',              unit: '%', transform: 'latest' },
  initial_claims: { id: 'ICSA',          label: 'Initial Claims',        unit: 'k', transform: 'latest' },
  cont_claims:    { id: 'CCSA',          label: 'Continuing Claims',     unit: 'k', transform: 'latest' },
  jolts_openings: { id: 'JTSJOL',        label: 'JOLTS Openings',        unit: 'k', transform: 'latest' },
  jolts_hires:    { id: 'JTSHIR',        label: 'JOLTS Hires',           unit: 'k', transform: 'latest' },
  jolts_quits:    { id: 'JTSQUR',        label: 'JOLTS Quits Rate',      unit: '%', transform: 'latest' },
  avg_hourly_earn:{ id: 'CES0500000003', label: 'Avg Hourly Earnings',   unit: '%', transform: 'yoy_pct' },
  ism_mfg_pmi:    { id: 'NAPM',          label: 'ISM Mfg PMI',           unit: '',  transform: 'latest' },
  participation:  { id: 'CIVPART',        label: 'Labor Force Partic.',   unit: '%', transform: 'latest' },
  cpi_shelter:    { id: 'CPIHOSSL',      label: 'Shelter YoY',           unit: '%', transform: 'yoy_pct' },
  cpi_rent:       { id: 'CUSR0000SAH1',  label: 'Rent (Primary) YoY',    unit: '%', transform: 'yoy_pct' },
  cpi_food:       { id: 'CPIFABSL',      label: 'Food & Bev YoY',        unit: '%', transform: 'yoy_pct' },
  cpi_energy:     { id: 'CPIENGSL',      label: 'Energy YoY',            unit: '%', transform: 'yoy_pct' },
  cpi_medical:    { id: 'CPIMEDSL',      label: 'Medical Care YoY',      unit: '%', transform: 'yoy_pct' },
  cpi_transport:  { id: 'CPITRNSL',      label: 'Transportation YoY',    unit: '%', transform: 'yoy_pct' },
  cpi_apparel:    { id: 'CPIAPPSL',      label: 'Apparel YoY',           unit: '%', transform: 'yoy_pct' },
  cpi_services:   { id: 'CUSR0000SASLE', label: 'Services ex Energy YoY',unit: '%', transform: 'yoy_pct' },
  breakeven_5y:   { id: 'T5YIE',         label: '5Y TIPS Breakeven',     unit: '%', transform: 'latest' },
  breakeven_10y:  { id: 'T10YIE',        label: '10Y TIPS Breakeven',    unit: '%', transform: 'latest' },
  epop_prime:     { id: 'LNS12300060',   label: 'Prime-Age EPOP (25-54)',unit: '%', transform: 'latest' },
  avg_weekly_hrs: { id: 'AWHAEMP',       label: 'Avg Weekly Hours',      unit: 'hrs', transform: 'latest' },
  nfp_mfg:        { id: 'MANEMP',        label: 'Mfg Employment',        unit: 'k',   transform: 'latest' },
  gdp_deflator:   { id: 'GDPDEF',        label: 'GDP Price Deflator',    unit: '%',   transform: 'qoq_ann_pct' },
  jolts_layoffs:  { id: 'JTSLAY',        label: 'JOLTS Layoffs Rate',    unit: '%',   transform: 'latest' },
  ism_new_orders: { id: 'NAPMNOI',       label: 'ISM New Orders',        unit: '',    transform: 'latest' },
  ism_prices:     { id: 'NAPMPI',        label: 'ISM Prices Paid',       unit: '',    transform: 'latest' },
  ism_employment: { id: 'NAPMEI',        label: 'ISM Employment Index',  unit: '',    transform: 'latest' },
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

// ─── FRED raw history (for charts) ───────────────────────────────────────────

const fredHistCache = new Map<string, { ts: number; data: unknown }>();

router.get('/fred-history', async (req, res) => {
  const series = (req.query.series as string | undefined)?.toUpperCase();
  const limit   = Math.min(120, Math.max(1, parseInt((req.query.limit as string) ?? '60', 10)));
  if (!series) { res.status(400).json({ error: 'series required' }); return; }
  const cacheKey = `${series}:${limit}`;
  const cached = fredHistCache.get(cacheKey);
  if (cached && Date.now() - cached.ts < FRED_TTL) { res.json(cached.data); return; }
  const apiKey = process.env.FRED_API_KEY;
  if (!apiKey) { res.json({ series, observations: [] }); return; }
  try {
    const url = `https://api.stlouisfed.org/fred/series/observations?series_id=${series}&api_key=${apiKey}&file_type=json&sort_order=desc&limit=${limit}`;
    const r = await fetch(url);
    if (!r.ok) throw new Error(`FRED ${series} ${r.status}`);
    const json = await r.json() as any;
    const observations = (json.observations ?? []).map((o: any) => ({
      date: o.date as string,
      value: o.value === '.' ? null : parseFloat(o.value),
    }));
    const data = { series, observations };
    fredHistCache.set(cacheKey, { ts: Date.now(), data });
    res.json(data);
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

// ─── Net Liquidity Model (Fed BST − TGA − RRP) ───────────────────────────────

let netliqCache: { ts: number; data: unknown } | null = null;
const NETLIQ_TTL = 3600_000; // 1 hour — weekly FRED data

const NETLIQ_SERIES: Record<string, { id: string; label: string }> = {
  walcl:   { id: 'WALCL',      label: 'Fed Balance Sheet' },   // $B, weekly
  tga:     { id: 'WDTGAL',     label: 'Treasury General Acct' }, // $B, weekly
  rrp:     { id: 'RRPONTSYD',  label: 'ON-RRP Facility' },       // $B, daily
  spx:     { id: 'SP500',      label: 'S&P 500' },               // weekly
};

router.get('/net-liquidity', async (_req, res) => {
  if (netliqCache && Date.now() - netliqCache.ts < NETLIQ_TTL) {
    res.json({ ...(netliqCache.data as Record<string, unknown>), cached: true }); return;
  }
  const apiKey = process.env.FRED_API_KEY;
  if (!apiKey) {
    // Return synthetic data so the UI works without a key
    res.json({ synthetic: true, series: buildSyntheticNetLiq(), cached: false }); return;
  }
  try {
    const fetchSeries = async (id: string, limit = 156) => {
      const url = `https://api.stlouisfed.org/fred/series/observations?series_id=${id}&api_key=${apiKey}&file_type=json&sort_order=asc&limit=${limit}`;
      const r = await fetch(url, { headers: { 'User-Agent': 'trade-terminal/1.0' } });
      if (!r.ok) throw new Error(`FRED ${id} ${r.status}`);
      const j = await r.json() as { observations: { date: string; value: string }[] };
      return j.observations.filter(o => o.value !== '.').map(o => ({ date: o.date, value: parseFloat(o.value) }));
    };

    const [walclObs, tgaObs, rrpObs, spxObs] = await Promise.all([
      fetchSeries('WALCL', 156),
      fetchSeries('WDTGAL', 156),
      fetchSeries('RRPONTSYD', 520),  // daily, ~2 years
      fetchSeries('SP500', 156),
    ]);

    // Align to weekly (use walcl dates as anchor)
    const toMap = (obs: { date: string; value: number }[]) => {
      const m: Record<string, number> = {};
      obs.forEach(o => { m[o.date] = o.value; });
      return m;
    };
    const tgaMap = toMap(tgaObs);
    const rrpMap = toMap(rrpObs);
    const spxMap = toMap(spxObs);

    // For RRP (daily), find nearest weekly value
    const rrpDates = rrpObs.map(o => o.date).sort();
    const findLast = (arr: string[], pred: (d: string) => boolean) => {
      for (let i = arr.length - 1; i >= 0; i--) { if (pred(arr[i])) return i; } return -1;
    };
    const nearestRRP = (date: string): number | null => {
      const idx = findLast(rrpDates, d => d <= date);
      return idx >= 0 ? rrpMap[rrpDates[idx]] ?? null : null;
    };
    const nearestSPX = (date: string): number | null => {
      const dates = spxObs.map(o => o.date).sort();
      const idx = findLast(dates, d => d <= date);
      return idx >= 0 ? spxMap[dates[idx]] ?? null : null;
    };

    const series = walclObs.map(o => {
      const walcl = o.value / 1000; // billions → trillions
      const tga   = (tgaMap[o.date] ?? null);
      const rrp   = nearestRRP(o.date);
      const netliq = (tga != null && rrp != null) ? walcl - tga / 1000 - rrp / 1000 : null;
      return {
        date: o.date,
        walcl: +walcl.toFixed(3),
        tga:   tga != null ? +(tga / 1000).toFixed(3) : null,
        rrp:   rrp != null ? +(rrp / 1000).toFixed(3) : null,
        netliq: netliq != null ? +netliq.toFixed(3) : null,
        spx:   nearestSPX(o.date),
      };
    }).filter(r => r.netliq != null);

    const latest = series[series.length - 1] ?? null;
    const prev   = series[series.length - 2] ?? null;
    const data = {
      series,
      latest,
      weeklyChange: latest && prev && latest.netliq != null && prev.netliq != null ? +(latest.netliq - prev.netliq).toFixed(3) : null,
      synthetic: false,
      fetchedAt: Date.now(),
    };
    netliqCache = { ts: Date.now(), data };
    res.json({ ...data, cached: false });
  } catch (e) {
    res.json({ synthetic: true, series: buildSyntheticNetLiq(), error: String(e), cached: false });
  }
});

function buildSyntheticNetLiq() {
  const pts: { date: string; walcl: number; tga: number; rrp: number; netliq: number; spx: number }[] = [];
  const start = new Date('2022-01-05');
  let walcl = 8.9, tga = 0.45, rrp = 1.6, spx = 4700;
  for (let i = 0; i < 130; i++) {
    const d = new Date(start);
    d.setDate(start.getDate() + i * 7);
    walcl += (Math.sin(i * 0.2) * 0.04) - 0.02;
    tga   += (Math.random() - 0.5) * 0.08;
    rrp   += i < 50 ? 0.04 : -0.06;
    tga = Math.max(0.1, tga); rrp = Math.max(0, rrp);
    const netliq = +( walcl - tga - rrp).toFixed(3);
    spx += (netliq - (pts[i - 1]?.netliq ?? netliq)) * 200 + (Math.random() - 0.45) * 60;
    pts.push({ date: d.toISOString().slice(0, 10), walcl: +walcl.toFixed(3), tga: +tga.toFixed(3), rrp: +rrp.toFixed(3), netliq, spx: Math.round(spx) });
  }
  return pts;
}

// ─── Squeeze scanner ─────────────────────────────────────────────────────────

const squeezeCache = new Map<string, { ts: number; data: unknown }>();
const SQUEEZE_TTL = 5 * 60_000;

const SQUEEZE_UNIVERSE = ['SPY','QQQ','IWM','DIA','AAPL','NVDA','TSLA','META','AMZN','MSFT','GOOG','AMD','COIN','PLTR','MSTR','XLF','XLE','XLK','XLV','GLD','TLT','BTCUSD'];

router.get('/squeeze', async (req, res) => {
  const interval = (req.query.interval as string) || '1day';
  const cacheKey = interval;
  const hit = squeezeCache.get(cacheKey);
  if (hit && Date.now() - hit.ts < SQUEEZE_TTL) { res.json({ ...(hit.data as Record<string, unknown>), cached: true }); return; }

  const key = process.env.TWELVE_DATA_API_KEY;
  if (!key) {
    res.json({ rows: buildSyntheticSqueeze(interval), synthetic: true, cached: false }); return;
  }

  try {
    const results = await Promise.allSettled(
      SQUEEZE_UNIVERSE.map(async sym => {
        const ts = await (await fetch(
          `https://api.twelvedata.com/time_series?symbol=${encodeURIComponent(sym)}&interval=${interval}&outputsize=50&apikey=${key}`,
          { headers: { 'User-Agent': 'trade-terminal/1.0' } }
        )).json() as any;
        const candles: { high: number; low: number; close: number }[] =
          (ts.values ?? []).map((v: any) => ({ high: parseFloat(v.high), low: parseFloat(v.low), close: parseFloat(v.close) })).reverse();
        return { sym, ...calcSqueeze(sym, candles) };
      })
    );
    const rows = results.filter((r): r is PromiseFulfilledResult<any> => r.status === 'fulfilled').map(r => r.value);
    const data = { rows, interval, fetchedAt: Date.now(), synthetic: false };
    squeezeCache.set(cacheKey, { ts: Date.now(), data });
    res.json({ ...data, cached: false });
  } catch (e) {
    res.json({ rows: buildSyntheticSqueeze(interval), synthetic: true, error: String(e), cached: false });
  }
});

function calcSqueeze(sym: string, candles: { high: number; low: number; close: number }[]) {
  if (candles.length < 20) return { squeeze: false, fired: false, momentum: 0, barsInSqueeze: 0, spark: [], close: null };
  const closes = candles.map(c => c.close);
  const highs  = candles.map(c => c.high);
  const lows   = candles.map(c => c.low);
  const n = closes.length;

  // BB (20, 2)
  const sma20 = closes.slice(-20).reduce((s, v) => s + v, 0) / 20;
  const std20 = Math.sqrt(closes.slice(-20).reduce((s, v) => s + (v - sma20) ** 2, 0) / 20);
  const bbUpper = sma20 + 2 * std20, bbLower = sma20 - 2 * std20;

  // KC (20, 1.5 × ATR14)
  const atr14 = closes.slice(-15).slice(1).reduce((s, c, i) => {
    const h = highs[n - 14 + i] ?? c, l = lows[n - 14 + i] ?? c, pc = closes[n - 15 + i];
    return s + Math.max(h - l, Math.abs(h - pc), Math.abs(l - pc));
  }, 0) / 14;
  const kcUpper = sma20 + 1.5 * atr14, kcLower = sma20 - 1.5 * atr14;

  const squeeze = bbUpper < kcUpper && bbLower > kcLower;

  // Momentum (delta midpoint regression vs sma20)
  const mid20 = closes.slice(-20).map((c, i) => (highs[n - 20 + i] + lows[n - 20 + i]) / 2);
  const midMean = mid20.reduce((s, v) => s + v, 0) / 20;
  const momentum = closes[n - 1] - midMean;

  // Count consecutive bars in squeeze
  let barsInSqueeze = 0;
  for (let i = n - 1; i >= 0; i--) {
    const s20 = closes.slice(Math.max(0, i - 19), i + 1);
    if (s20.length < 20) break;
    const sm = s20.reduce((a, b) => a + b, 0) / 20;
    const sd = Math.sqrt(s20.reduce((a, b) => a + (b - sm) ** 2, 0) / 20);
    const atr = atr14; // approximate
    if ((sm + 2 * sd) < (sm + 1.5 * atr) && (sm - 2 * sd) > (sm - 1.5 * atr)) barsInSqueeze++;
    else break;
  }

  const fired = !squeeze && barsInSqueeze > 0;
  const spark = closes.slice(-10).map(c => +c.toFixed(2));
  return { squeeze, fired, barsInSqueeze, momentum: +momentum.toFixed(2), spark, close: closes[n - 1] };
}

function buildSyntheticSqueeze(interval: string) {
  const hash = (s: string) => { let h = 2166136261; for (const c of s) { h ^= c.charCodeAt(0); h = Math.imul(h, 16777619); } return h >>> 0; };
  const rng  = (seed: number) => { let a = seed; return () => { a = (a ^ (a << 13)) >>> 0; a = (a ^ (a >> 17)) >>> 0; a = (a ^ (a << 5)) >>> 0; return a / 0xffffffff; }; };
  return SQUEEZE_UNIVERSE.map(sym => {
    const r = rng(hash(sym + ':sqz:' + interval));
    const squeeze  = r() < 0.35;
    const fired    = !squeeze && r() < 0.25;
    const barsInSqueeze = squeeze ? Math.floor(r() * 12) + 1 : fired ? Math.floor(r() * 3) + 1 : 0;
    const momentum = +((r() - 0.48) * 6).toFixed(2);
    const close    = +(100 + r() * 400).toFixed(2);
    const spark    = Array.from({ length: 10 }, () => +(close * (0.96 + r() * 0.08)).toFixed(2));
    return { sym, squeeze, fired, barsInSqueeze, momentum, spark, close };
  });
}

export default router;
