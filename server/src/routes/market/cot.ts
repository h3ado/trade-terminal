import { Router } from 'express';
import prisma from '../../lib/prisma';

const router = Router();

const DATASETS = { legacy: '6dca-aqww', disagg: '72hh-3qpy', tff: 'gpe5-46if', cit: 'jun7-fc8e' };

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
  { ticker: 'ZW', asset: 'Grains', match: ['WHEAT', 'CHICAGO BOARD OF TRADE'] },
  { ticker: 'KC', asset: 'Softs', match: ['COFFEE C', 'ICE FUTURES U.S.'] },
  { ticker: 'SB', asset: 'Softs', match: ['SUGAR NO. 11', 'ICE FUTURES U.S.'] },
  { ticker: 'CT', asset: 'Softs', match: ['COTTON NO. 2', 'ICE FUTURES U.S.'] },
  { ticker: '6E', asset: 'FX', match: ['EURO FX', 'CHICAGO MERCANTILE EXCHANGE'] },
  { ticker: '6B', asset: 'FX', match: ['BRITISH POUND', 'CHICAGO MERCANTILE EXCHANGE'] },
  { ticker: '6J', asset: 'FX', match: ['JAPANESE YEN', 'CHICAGO MERCANTILE EXCHANGE'] },
  { ticker: '6A', asset: 'FX', match: ['AUSTRALIAN DOLLAR', 'CHICAGO MERCANTILE EXCHANGE'] },
  { ticker: '6C', asset: 'FX', match: ['CANADIAN DOLLAR', 'CHICAGO MERCANTILE EXCHANGE'] },
  { ticker: 'ZT', asset: 'Rates', match: ['2-YEAR U.S. TREASURY NOTES', 'CHICAGO BOARD OF TRADE'] },
  { ticker: 'ZN', asset: 'Rates', match: ['10-YEAR U.S. TREASURY NOTES', 'CHICAGO BOARD OF TRADE'] },
  { ticker: 'ZB', asset: 'Rates', match: ['U.S. TREASURY BONDS', 'CHICAGO BOARD OF TRADE'] },
  { ticker: 'ES', asset: 'Equity', match: ['E-MINI S&P 500', 'CHICAGO MERCANTILE EXCHANGE'] },
  { ticker: 'NQ', asset: 'Equity', match: ['NASDAQ-100', 'CHICAGO MERCANTILE EXCHANGE'] },
  { ticker: 'RTY', asset: 'Equity', match: ['RUSSELL E-MINI', 'CHICAGO MERCANTILE EXCHANGE'] },
  { ticker: 'VX', asset: 'Volatility', match: ['VIX FUTURES', 'CBOE FUTURES EXCHANGE'] },
];

const num = (v: unknown) => (Number.isFinite(Number(v)) ? Number(v) : 0);
const net = (row: any, lk: string, sk: string) => num(row[lk]) - num(row[sk]);
const titleCase = (s: string) => s.toLowerCase().replace(/\b\w/g, c => c.toUpperCase()).replace(/ - .*/, '');

async function fetchJson(dataset: string, where: string, limit = 5000): Promise<any[]> {
  const params = new URLSearchParams({ '$limit': String(limit), '$order': 'report_date_as_yyyy_mm_dd DESC' });
  if (where) params.set('$where', where);
  const url = `https://publicreporting.cftc.gov/resource/${dataset}.json?${params}`;
  const res = await fetch(url, { headers: { accept: 'application/json', 'User-Agent': 'trade-terminal/1.0' } });
  if (!res.ok) throw new Error(`CFTC ${dataset} ${res.status}`);
  return res.json() as Promise<any[]>;
}

function latestByMarket(rows: any[]) {
  const map = new Map<string, any>();
  for (const row of rows) {
    const key = String(row.market_and_exchange_names ?? row.contract_market_name ?? '');
    if (!map.has(key)) map.set(key, row);
  }
  return [...map.values()];
}

function pick(rowset: any[], spec: (typeof WATCHLIST)[number]) {
  return rowset.find(row => {
    const name = String(row.market_and_exchange_names ?? '').toUpperCase();
    return spec.match.every(p => name.includes(p));
  }) ?? rowset.find(row => String(row.market_and_exchange_names ?? '').toUpperCase().includes(spec.match[0]));
}

function percentile(history: any[], current: number) {
  const vals = history.map(row => net(row, 'm_money_positions_long_all', 'm_money_positions_short_all')).filter(Number.isFinite);
  if (vals.length < 2) return 50;
  return Math.round((vals.filter(v => v <= current).length / vals.length) * 100);
}

function buildCotRows(disaggAll: any[]) {
  const latest = latestByMarket(disaggAll);
  return WATCHLIST.map(spec => {
    const row = pick(latest, spec);
    if (!row) return null;
    const managed = net(row, 'm_money_positions_long_all', 'm_money_positions_short_all');
    const week = net(row, 'change_in_m_money_long_all', 'change_in_m_money_short_all');
    const mh = disaggAll.filter(r => String(r.market_and_exchange_names) === String(row.market_and_exchange_names)).slice(0, 156);
    const rank = percentile(mh, managed);
    const fb = mh[4] ? net(mh[4], 'm_money_positions_long_all', 'm_money_positions_short_all') : managed - week;
    return { asset: spec.asset, market: titleCase(String(row.contract_market_name || row.market_and_exchange_names)), ticker: spec.ticker, openInterest: num(row.open_interest_all), commercials: net(row, 'prod_merc_positions_long', 'prod_merc_positions_short'), managedMoney: managed, nonReportable: net(row, 'nonrept_positions_long_all', 'nonrept_positions_short_all'), week, fourWeek: managed - fb, pctRank: rank, bias: rank >= 70 ? 'Bullish' : rank <= 30 ? 'Bearish' : 'Neutral', reportDate: row.report_date_as_yyyy_mm_dd ?? null };
  }).filter(Boolean);
}

function buildLegacy(rows: any[]) {
  return latestByMarket(rows).slice(0, 80).map(row => ({ market: titleCase(String(row.contract_market_name || row.market_and_exchange_names)), ticker: String(row.cftc_contract_market_code ?? ''), nonCommercialLong: num(row.noncomm_positions_long_all), nonCommercialShort: num(row.noncomm_positions_short_all), commercialLong: num(row.comm_positions_long_all), commercialShort: num(row.comm_positions_short_all), spreading: num(row.noncomm_postions_spread_all), nonReportable: net(row, 'nonrept_positions_long_all', 'nonrept_positions_short_all') }));
}

function buildDisagg(rows: any[]) {
  return latestByMarket(rows).slice(0, 80).map(row => ({ market: titleCase(String(row.contract_market_name || row.market_and_exchange_names)), ticker: String(row.cftc_contract_market_code ?? ''), producer: net(row, 'prod_merc_positions_long', 'prod_merc_positions_short'), swapDealer: net(row, 'swap_positions_long_all', 'swap__positions_short_all'), managedMoney: net(row, 'm_money_positions_long_all', 'm_money_positions_short_all'), otherReportable: net(row, 'other_rept_positions_long', 'other_rept_positions_short'), nonReportable: net(row, 'nonrept_positions_long_all', 'nonrept_positions_short_all') }));
}

async function persistToPrisma(rows: any[], historyRows: any[], legacyRows: any[], disaggRows: any[], tffRows: any[], citRows: any[], reportDate: string | null) {
  if (!reportDate) return;
  await prisma.cotSnapshot.upsert({
    where: { reportDate: new Date(reportDate) },
    update: { marketRows: rows.length, legacyRows: legacyRows.length, disaggRows: disaggRows.length, tffRows: tffRows.length, citRows: citRows.length, ingestedAt: new Date() },
    create: { reportDate: new Date(reportDate), marketRows: rows.length, legacyRows: legacyRows.length, disaggRows: disaggRows.length, tffRows: tffRows.length, citRows: citRows.length },
  });
  for (const row of historyRows) {
    if (!row.reportDate) continue;
    await prisma.cotMarketHistory.upsert({
      where: { reportDate_ticker: { reportDate: new Date(row.reportDate), ticker: row.ticker } },
      update: { openInterest: row.openInterest, commercials: row.commercials, managedMoney: row.managedMoney, nonReportable: row.nonReportable, weekChange: row.week, fourWeekChange: row.fourWeek, pctRank: row.pctRank, bias: row.bias },
      create: { reportDate: new Date(row.reportDate), asset: row.asset, market: row.market, ticker: row.ticker, openInterest: row.openInterest, commercials: row.commercials, managedMoney: row.managedMoney, nonReportable: row.nonReportable, weekChange: row.week, fourWeekChange: row.fourWeek, pctRank: row.pctRank, bias: row.bias },
    });
  }
}

let cotCache: { ts: number; data: unknown } | null = null;
const COT_TTL = 6 * 3600_000;

router.get('/cftc-cot', async (_req, res) => {
  if (cotCache && Date.now() - cotCache.ts < COT_TTL) { res.json({ ...(cotCache.data as any), cached: true }); return; }
  try {
    const latestRows = await fetchJson(DATASETS.disagg, '', 1);
    const latestDate = latestRows[0]?.report_date_as_yyyy_mm_dd ?? null;
    const dateWhere = latestDate ? `report_date_as_yyyy_mm_dd='${latestDate}'` : '';
    const [disaggAll, legacyLatest, tffLatest, citLatest] = await Promise.all([
      fetchJson(DATASETS.disagg, '', 10000),
      fetchJson(DATASETS.legacy, dateWhere, 5000),
      fetchJson(DATASETS.tff, dateWhere, 5000),
      fetchJson(DATASETS.cit, dateWhere, 5000),
    ]);
    const rows = buildCotRows(disaggAll);
    const legacyRows = buildLegacy(legacyLatest);
    const disaggRows = buildDisagg(disaggAll.filter(r => r.report_date_as_yyyy_mm_dd === latestDate));
    const response = { rows, historyRows: [], legacyRows, disaggRows, tffRows: buildLegacy(tffLatest), citRows: buildLegacy(citLatest), reportDate: latestDate, source: 'CFTC public reporting', cached: false, ts: Date.now() };
    cotCache = { ts: Date.now(), data: response };
    persistToPrisma(rows, [], legacyRows, disaggRows, [], [], latestDate).catch(console.error);
    res.json(response);
  } catch (e) { res.status(502).json({ error: String(e) }); }
});

export default router;
