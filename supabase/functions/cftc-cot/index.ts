import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers':
    'authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version',
};

type CotRow = {
  asset: string;
  market: string;
  ticker: string;
  openInterest: number;
  commercials: number;
  managedMoney: number;
  nonReportable: number;
  week: number;
  fourWeek: number;
  pctRank: number;
  bias: 'Bullish' | 'Bearish' | 'Neutral';
  reportDate: string | null;
};

type ReportRow = Record<string, string | number>;

type CotResponse = {
  rows: CotRow[];
  historyRows: CotRow[];
  legacyRows: ReportRow[];
  disaggRows: ReportRow[];
  tffRows: ReportRow[];
  citRows: ReportRow[];
  reportDate: string | null;
  source: string;
  cached: boolean;
  ts: number;
};

const DATASETS = {
  legacy: '6dca-aqww',
  disagg: '72hh-3qpy',
  tff: 'gpe5-46if',
  cit: 'jun7-fc8e',
};

const WATCHLIST = [
  { ticker: 'CL', asset: 'Energy', match: ['CRUDE OIL, LIGHT SWEET', 'NYMEX'] },
  { ticker: 'BZ', asset: 'Energy', match: ['BRENT CRUDE OIL', 'ICE FUTURES EUROPE'] },
  { ticker: 'NG', asset: 'Energy', match: ['NATURAL GAS', 'NYMEX'] },
  { ticker: 'RB', asset: 'Energy', match: ['GASOLINE BLENDSTOCK', 'NYMEX'] },
  { ticker: 'HO', asset: 'Energy', match: ['NY HARBOR ULSD', 'NYMEX'] },
  { ticker: 'GC', asset: 'Metals', match: ['GOLD', 'COMMODITY EXCHANGE'] },
  { ticker: 'SI', asset: 'Metals', match: ['SILVER', 'COMMODITY EXCHANGE'] },
  { ticker: 'HG', asset: 'Metals', match: ['COPPER', 'COMMODITY EXCHANGE'] },
  { ticker: 'PL', asset: 'Metals', match: ['PLATINUM', 'NYMEX'] },
  { ticker: 'PA', asset: 'Metals', match: ['PALLADIUM', 'NYMEX'] },
  { ticker: 'ZC', asset: 'Grains', match: ['CORN', 'CHICAGO BOARD OF TRADE'] },
  { ticker: 'ZS', asset: 'Grains', match: ['SOYBEANS', 'CHICAGO BOARD OF TRADE'] },
  { ticker: 'ZM', asset: 'Grains', match: ['SOYBEAN MEAL', 'CHICAGO BOARD OF TRADE'] },
  { ticker: 'ZL', asset: 'Grains', match: ['SOYBEAN OIL', 'CHICAGO BOARD OF TRADE'] },
  { ticker: 'ZW', asset: 'Grains', match: ['WHEAT', 'CHICAGO BOARD OF TRADE'] },
  { ticker: 'KE', asset: 'Grains', match: ['KC HRW WHEAT', 'CHICAGO BOARD OF TRADE'] },
  { ticker: 'KC', asset: 'Softs', match: ['COFFEE C', 'ICE FUTURES U.S.'] },
  { ticker: 'SB', asset: 'Softs', match: ['SUGAR NO. 11', 'ICE FUTURES U.S.'] },
  { ticker: 'CT', asset: 'Softs', match: ['COTTON NO. 2', 'ICE FUTURES U.S.'] },
  { ticker: 'CC', asset: 'Softs', match: ['COCOA', 'ICE FUTURES U.S.'] },
  { ticker: 'OJ', asset: 'Softs', match: ['FCOJ-A', 'ICE FUTURES U.S.'] },
  { ticker: 'LE', asset: 'Livestock', match: ['LIVE CATTLE', 'CHICAGO MERCANTILE EXCHANGE'] },
  { ticker: 'GF', asset: 'Livestock', match: ['FEEDER CATTLE', 'CHICAGO MERCANTILE EXCHANGE'] },
  { ticker: 'HE', asset: 'Livestock', match: ['LEAN HOGS', 'CHICAGO MERCANTILE EXCHANGE'] },
  { ticker: '6E', asset: 'FX', match: ['EURO FX', 'CHICAGO MERCANTILE EXCHANGE'] },
  { ticker: '6B', asset: 'FX', match: ['BRITISH POUND', 'CHICAGO MERCANTILE EXCHANGE'] },
  { ticker: '6J', asset: 'FX', match: ['JAPANESE YEN', 'CHICAGO MERCANTILE EXCHANGE'] },
  { ticker: '6A', asset: 'FX', match: ['AUSTRALIAN DOLLAR', 'CHICAGO MERCANTILE EXCHANGE'] },
  { ticker: '6C', asset: 'FX', match: ['CANADIAN DOLLAR', 'CHICAGO MERCANTILE EXCHANGE'] },
  { ticker: '6S', asset: 'FX', match: ['SWISS FRANC', 'CHICAGO MERCANTILE EXCHANGE'] },
  { ticker: '6M', asset: 'FX', match: ['MEXICAN PESO', 'CHICAGO MERCANTILE EXCHANGE'] },
  { ticker: 'ZT', asset: 'Rates', match: ['2-YEAR U.S. TREASURY NOTES', 'CHICAGO BOARD OF TRADE'] },
  { ticker: 'ZF', asset: 'Rates', match: ['5-YEAR U.S. TREASURY NOTES', 'CHICAGO BOARD OF TRADE'] },
  { ticker: 'ZN', asset: 'Rates', match: ['10-YEAR U.S. TREASURY NOTES', 'CHICAGO BOARD OF TRADE'] },
  { ticker: 'ZB', asset: 'Rates', match: ['U.S. TREASURY BONDS', 'CHICAGO BOARD OF TRADE'] },
  { ticker: 'UB', asset: 'Rates', match: ['ULTRA U.S. TREASURY BONDS', 'CHICAGO BOARD OF TRADE'] },
  { ticker: 'ES', asset: 'Equity', match: ['E-MINI S&P 500', 'CHICAGO MERCANTILE EXCHANGE'] },
  { ticker: 'NQ', asset: 'Equity', match: ['NASDAQ-100', 'CHICAGO MERCANTILE EXCHANGE'] },
  { ticker: 'YM', asset: 'Equity', match: ['$5 DOW', 'CHICAGO BOARD OF TRADE'] },
  { ticker: 'RTY', asset: 'Equity', match: ['RUSSELL E-MINI', 'CHICAGO MERCANTILE EXCHANGE'] },
  { ticker: 'VX', asset: 'Volatility', match: ['VIX FUTURES', 'CBOE FUTURES EXCHANGE'] },
];

const num = (v: unknown) => Number.isFinite(Number(v)) ? Number(v) : 0;
const net = (row: any, longKey: string, shortKey: string) => num(row[longKey]) - num(row[shortKey]);
const titleCase = (s: string) => s.toLowerCase().replace(/\b\w/g, c => c.toUpperCase()).replace(/ - .*/, '');
const db = createClient(Deno.env.get('SUPABASE_URL') ?? '', Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? '');

async function fetchJson(dataset: string, where: string, limit = 5000): Promise<any[]> {
  const params = new URLSearchParams({ '$limit': String(limit), '$order': 'report_date_as_yyyy_mm_dd DESC' });
  if (where) params.set('$where', where);
  const url = `https://publicreporting.cftc.gov/resource/${dataset}.json?${params.toString()}`;
  const res = await fetch(url, { headers: { accept: 'application/json', 'User-Agent': 'lovable-cot/1.0' } });
  if (!res.ok) throw new Error(`CFTC ${dataset} ${res.status}: ${(await res.text()).slice(0, 240)}`);
  return await res.json();
}

function latestByMarket(rows: any[]) {
  const map = new Map<string, any>();
  for (const row of rows) {
    const key = String(row.market_and_exchange_names ?? row.contract_market_name ?? '');
    if (!map.has(key)) map.set(key, row);
  }
  return [...map.values()];
}

function pick(rowset: any[], spec: typeof WATCHLIST[number]) {
  return rowset.find(row => {
    const name = String(row.market_and_exchange_names ?? '').toUpperCase();
    return spec.match.every(part => name.includes(part));
  }) ?? rowset.find(row => String(row.market_and_exchange_names ?? '').toUpperCase().includes(spec.match[0]));
}

function percentile(history: any[], current: number) {
  const vals = history.map(row => net(row, 'm_money_positions_long_all', 'm_money_positions_short_all')).filter(Number.isFinite);
  if (vals.length < 2) return 50;
  return Math.round((vals.filter(v => v <= current).length / vals.length) * 100);
}

function buildCotRows(disaggAll: any[]): CotRow[] {
  const latest = latestByMarket(disaggAll);
  return WATCHLIST.map(spec => {
    const row = pick(latest, spec);
    if (!row) return null;
    const marketName = titleCase(String(row.contract_market_name || row.market_and_exchange_names || spec.ticker));
    const managed = net(row, 'm_money_positions_long_all', 'm_money_positions_short_all');
    const commercial = net(row, 'prod_merc_positions_long', 'prod_merc_positions_short');
    const nonReport = net(row, 'nonrept_positions_long_all', 'nonrept_positions_short_all');
    const week = net(row, 'change_in_m_money_long_all', 'change_in_m_money_short_all');
    const marketHistory = disaggAll.filter(r => String(r.market_and_exchange_names) === String(row.market_and_exchange_names)).slice(0, 156);
    const fourWeekBase = marketHistory[4] ? net(marketHistory[4], 'm_money_positions_long_all', 'm_money_positions_short_all') : managed - week;
    const rank = percentile(marketHistory, managed);
    return { asset: spec.asset, market: marketName, ticker: spec.ticker, openInterest: num(row.open_interest_all), commercials: commercial, managedMoney: managed, nonReportable: nonReport, week, fourWeek: managed - fourWeekBase, pctRank: rank, bias: rank >= 70 ? 'Bullish' : rank <= 30 ? 'Bearish' : 'Neutral', reportDate: row.report_date_as_yyyy_mm_dd ?? null };
  }).filter(Boolean) as CotRow[];
}

function buildCotHistory(disaggAll: any[]): CotRow[] {
  return WATCHLIST.flatMap(spec => {
    const rows = disaggAll.filter(row => {
      const name = String(row.market_and_exchange_names ?? '').toUpperCase();
      return spec.match.every(part => name.includes(part));
    }).slice(0, 156);
    return rows.map((row, index) => {
      const marketName = titleCase(String(row.contract_market_name || row.market_and_exchange_names || spec.ticker));
      const managed = net(row, 'm_money_positions_long_all', 'm_money_positions_short_all');
      const commercial = net(row, 'prod_merc_positions_long', 'prod_merc_positions_short');
      const nonReport = net(row, 'nonrept_positions_long_all', 'nonrept_positions_short_all');
      const week = net(row, 'change_in_m_money_long_all', 'change_in_m_money_short_all');
      const fourWeekBase = rows[index + 4] ? net(rows[index + 4], 'm_money_positions_long_all', 'm_money_positions_short_all') : managed - week;
      const rank = percentile(rows.slice(index), managed);
      return { asset: spec.asset, market: marketName, ticker: spec.ticker, openInterest: num(row.open_interest_all), commercials: commercial, managedMoney: managed, nonReportable: nonReport, week, fourWeek: managed - fourWeekBase, pctRank: rank, bias: rank >= 70 ? 'Bullish' : rank <= 30 ? 'Bearish' : 'Neutral', reportDate: row.report_date_as_yyyy_mm_dd ?? null };
    });
  });
}

async function persistHistory(response: CotResponse) {
  if (!response.reportDate) return;
  await db.from('cot_snapshots').upsert({ report_date: response.reportDate, source: response.source, market_rows: response.rows.length, legacy_rows: response.legacyRows.length, disagg_rows: response.disaggRows.length, tff_rows: response.tffRows.length, cit_rows: response.citRows.length, ingested_at: new Date().toISOString() }, { onConflict: 'report_date' });
  const marketRows = response.historyRows.filter(row => row.reportDate).map(row => ({ report_date: row.reportDate, asset: row.asset, market: row.market, ticker: row.ticker, open_interest: row.openInterest, commercials: row.commercials, managed_money: row.managedMoney, non_reportable: row.nonReportable, week_change: row.week, four_week_change: row.fourWeek, pct_rank: row.pctRank, bias: row.bias, raw: row }));
  for (let i = 0; i < marketRows.length; i += 500) await db.from('cot_market_history').upsert(marketRows.slice(i, i + 500), { onConflict: 'report_date,ticker' });
  const reportRows = [
    ...response.legacyRows.map(row => ({ report_date: response.reportDate, report_type: 'legacy', market: String(row.market ?? ''), ticker: String(row.ticker ?? ''), row_data: row })),
    ...response.disaggRows.map(row => ({ report_date: response.reportDate, report_type: 'disagg', market: String(row.market ?? ''), ticker: String(row.ticker ?? ''), row_data: row })),
    ...response.tffRows.map(row => ({ report_date: response.reportDate, report_type: 'tff', market: String(row.market ?? ''), ticker: String(row.ticker ?? ''), row_data: row })),
    ...response.citRows.map(row => ({ report_date: response.reportDate, report_type: 'cit', market: String(row.market ?? ''), ticker: String(row.ticker ?? ''), row_data: row })),
  ];
  for (let i = 0; i < reportRows.length; i += 500) await db.from('cot_report_history').upsert(reportRows.slice(i, i + 500), { onConflict: 'report_date,report_type,market,ticker' });
}

function buildLegacy(rows: any[]): ReportRow[] {
  return latestByMarket(rows).slice(0, 80).map(row => ({ market: titleCase(String(row.contract_market_name || row.market_and_exchange_names)), ticker: String(row.cftc_contract_market_code ?? ''), nonCommercialLong: num(row.noncomm_positions_long_all), nonCommercialShort: num(row.noncomm_positions_short_all), commercialLong: num(row.comm_positions_long_all), commercialShort: num(row.comm_positions_short_all), spreading: num(row.noncomm_postions_spread_all), nonReportable: net(row, 'nonrept_positions_long_all', 'nonrept_positions_short_all') }));
}

function buildDisagg(rows: any[]): ReportRow[] {
  return latestByMarket(rows).slice(0, 80).map(row => ({ market: titleCase(String(row.contract_market_name || row.market_and_exchange_names)), ticker: String(row.cftc_contract_market_code ?? ''), producer: net(row, 'prod_merc_positions_long', 'prod_merc_positions_short'), swapDealer: net(row, 'swap_positions_long_all', 'swap__positions_short_all'), managedMoney: net(row, 'm_money_positions_long_all', 'm_money_positions_short_all'), otherReportable: net(row, 'other_rept_positions_long', 'other_rept_positions_short'), nonReportable: net(row, 'nonrept_positions_long_all', 'nonrept_positions_short_all') }));
}

function buildTff(rows: any[]): ReportRow[] {
  return latestByMarket(rows).slice(0, 80).map(row => ({ market: titleCase(String(row.contract_market_name || row.market_and_exchange_names)), ticker: String(row.cftc_contract_market_code ?? ''), dealer: net(row, 'dealer_positions_long_all', 'dealer_positions_short_all'), assetManager: net(row, 'asset_mgr_positions_long', 'asset_mgr_positions_short'), leveragedFunds: net(row, 'lev_money_positions_long', 'lev_money_positions_short'), otherReportable: net(row, 'other_rept_positions_long', 'other_rept_positions_short'), rank: Math.round(num(row.pct_of_oi_lev_money_long) - num(row.pct_of_oi_lev_money_short)) }));
}

function buildCit(rows: any[]): ReportRow[] {
  return latestByMarket(rows).slice(0, 80).map(row => ({ market: titleCase(String(row.contract_market_name || row.market_and_exchange_names)), ticker: String(row.cftc_contract_market_code ?? ''), indexLong: num(row.noncomm_positions_long_all), indexShort: num(row.noncomm_positions_short_all), pctOi: Math.round(num(row.pct_of_oi_noncomm_long_all)), weekly: net(row, 'change_in_noncomm_long_all', 'change_in_noncomm_short_all') }));
}

let cache: CotResponse | null = null;
const TTL_MS = 6 * 60 * 60_000;

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') return new Response('ok', { headers: corsHeaders });
  try {
    if (cache && Date.now() - cache.ts < TTL_MS) return new Response(JSON.stringify({ ...cache, cached: true }), { headers: { ...corsHeaders, 'Content-Type': 'application/json' } });
    const latestRows = await fetchJson(DATASETS.disagg, '', 1);
    const latestDate = latestRows[0]?.report_date_as_yyyy_mm_dd;
    const dateWhere = latestDate ? `report_date_as_yyyy_mm_dd='${latestDate}'` : '';
    const [disaggAll, legacyLatest, tffLatest, citLatest] = await Promise.all([fetchJson(DATASETS.disagg, '', 10000), fetchJson(DATASETS.legacy, dateWhere, 5000), fetchJson(DATASETS.tff, dateWhere, 5000), fetchJson(DATASETS.cit, dateWhere, 5000)]);
    const response: CotResponse = { rows: buildCotRows(disaggAll), historyRows: buildCotHistory(disaggAll), legacyRows: buildLegacy(legacyLatest), disaggRows: buildDisagg(disaggAll.filter(row => row.report_date_as_yyyy_mm_dd === latestDate)), tffRows: buildTff(tffLatest), citRows: buildCit(citLatest), reportDate: latestDate ?? null, source: 'CFTC public reporting', cached: false, ts: Date.now() };
    await persistHistory(response);
    cache = response;
    return new Response(JSON.stringify(response), { headers: { ...corsHeaders, 'Content-Type': 'application/json' } });
  } catch (e) {
    console.error('cftc-cot failed', e);
    return new Response(JSON.stringify({ error: String((e as Error)?.message ?? e) }), { status: 502, headers: { ...corsHeaders, 'Content-Type': 'application/json' } });
  }
});
