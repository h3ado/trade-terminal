import { useEffect, useMemo, useState } from 'react';
import { CalendarIcon, Star, Download, Copy as CopyIcon } from 'lucide-react';
import {
  Bar,
  BarChart,
  CartesianGrid,
  Cell,
  Line,
  LineChart,
  Tooltip,
  XAxis,
  YAxis,
} from 'recharts';
import { useCFTC, type COTLiveRow, type COTReportRow } from '@/hooks/useCFTC';
import { Calendar } from '@/components/ui/calendar';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { ExpandableResponsiveContainer } from '@/components/shared/ExpandChart';

type COTTab = 'overview' | 'markets' | 'watch' | 'corr' | 'legacy' | 'disagg' | 'tff' | 'cit' | 'dealers' | 'flows' | 'seasonal' | 'extremes' | 'spreads' | 'reports' | 'calendar';

const tabs: { id: COTTab; label: string; code: string }[] = [
  { id: 'overview', label: 'Overview', code: 'OVR' },
  { id: 'markets', label: 'Markets', code: 'MKT' },
  { id: 'watch', label: 'Watch', code: 'WCH' },
  { id: 'corr', label: 'Corr.', code: 'COR' },
  { id: 'legacy', label: 'Legacy', code: 'LEG' },
  { id: 'disagg', label: 'Disagg.', code: 'DAG' },
  { id: 'tff', label: 'TFF', code: 'TFF' },
  { id: 'cit', label: 'CIT', code: 'CIT' },
  { id: 'dealers', label: 'Dealers', code: 'DLR' },
  { id: 'flows', label: 'Flows', code: 'FLW' },
  { id: 'seasonal', label: 'Seasonal', code: 'SEA' },
  { id: 'extremes', label: 'Extremes', code: 'EXT' },
  { id: 'spreads', label: 'Spreads', code: 'SPR' },
  { id: 'reports', label: 'Reports', code: 'RPT' },
  { id: 'calendar', label: 'Calendar', code: 'CAL' },
];

const fallbackCotRows: COTLiveRow[] = [
  { asset: 'Energy', market: 'WTI Crude', ticker: 'CL', openInterest: 1882400, commercials: -218400, managedMoney: 246800, nonReportable: -28400, week: 18400, fourWeek: 52600, pctRank: 88, bias: 'Bullish' },
  { asset: 'Energy', market: 'Brent Crude', ticker: 'BZ', openInterest: 702100, commercials: -94400, managedMoney: 112900, nonReportable: -18500, week: 9600, fourWeek: 28400, pctRank: 79, bias: 'Bullish' },
  { asset: 'Energy', market: 'RBOB Gasoline', ticker: 'RB', openInterest: 412300, commercials: -64100, managedMoney: 73300, nonReportable: -9200, week: 7800, fourWeek: 18800, pctRank: 81, bias: 'Bullish' },
  { asset: 'Energy', market: 'Heating Oil', ticker: 'HO', openInterest: 338900, commercials: -48700, managedMoney: 55200, nonReportable: -6500, week: 3600, fourWeek: 12400, pctRank: 69, bias: 'Neutral' },
  { asset: 'Energy', market: 'Natural Gas', ticker: 'NG', openInterest: 1268700, commercials: 68400, managedMoney: -81200, nonReportable: 12800, week: -9400, fourWeek: -31700, pctRank: 24, bias: 'Bearish' },
  { asset: 'Metals', market: 'Gold', ticker: 'GC', openInterest: 531600, commercials: -176200, managedMoney: 205900, nonReportable: -29700, week: 12200, fourWeek: 45100, pctRank: 91, bias: 'Bullish' },
  { asset: 'Metals', market: 'Silver', ticker: 'SI', openInterest: 162900, commercials: -52100, managedMoney: 63800, nonReportable: -11700, week: 6800, fourWeek: 16600, pctRank: 84, bias: 'Bullish' },
  { asset: 'Metals', market: 'Copper', ticker: 'HG', openInterest: 248300, commercials: -42100, managedMoney: 58400, nonReportable: -16300, week: 7600, fourWeek: 11900, pctRank: 76, bias: 'Bullish' },
  { asset: 'Metals', market: 'Platinum', ticker: 'PL', openInterest: 83100, commercials: -18400, managedMoney: 22900, nonReportable: -4500, week: 2100, fourWeek: 7800, pctRank: 71, bias: 'Bullish' },
  { asset: 'Metals', market: 'Palladium', ticker: 'PA', openInterest: 19700, commercials: 4200, managedMoney: -6100, nonReportable: 1900, week: -600, fourWeek: -2400, pctRank: 29, bias: 'Bearish' },
  { asset: 'Grains', market: 'Corn', ticker: 'ZC', openInterest: 1396100, commercials: 118500, managedMoney: -96400, nonReportable: -22100, week: -5800, fourWeek: -27400, pctRank: 31, bias: 'Neutral' },
  { asset: 'Grains', market: 'Soybeans', ticker: 'ZS', openInterest: 826400, commercials: -34200, managedMoney: 46700, nonReportable: -12500, week: 4100, fourWeek: 14200, pctRank: 57, bias: 'Neutral' },
  { asset: 'Grains', market: 'Soybean Meal', ticker: 'ZM', openInterest: 421800, commercials: -38600, managedMoney: 51200, nonReportable: -12600, week: 6300, fourWeek: 18400, pctRank: 73, bias: 'Bullish' },
  { asset: 'Grains', market: 'Soybean Oil', ticker: 'ZL', openInterest: 508300, commercials: -22400, managedMoney: 31800, nonReportable: -9400, week: 2700, fourWeek: 9600, pctRank: 62, bias: 'Neutral' },
  { asset: 'Grains', market: 'Wheat', ticker: 'ZW', openInterest: 391200, commercials: 42600, managedMoney: -58900, nonReportable: 16300, week: -7200, fourWeek: -9500, pctRank: 28, bias: 'Bearish' },
  { asset: 'Grains', market: 'KC Wheat', ticker: 'KE', openInterest: 196500, commercials: 24800, managedMoney: -31600, nonReportable: 6800, week: -2800, fourWeek: -7400, pctRank: 33, bias: 'Neutral' },
  { asset: 'Softs', market: 'Coffee', ticker: 'KC', openInterest: 218700, commercials: -28600, managedMoney: 35400, nonReportable: -6800, week: 5200, fourWeek: 20400, pctRank: 86, bias: 'Bullish' },
  { asset: 'Softs', market: 'Sugar', ticker: 'SB', openInterest: 512800, commercials: -69200, managedMoney: 81500, nonReportable: -12300, week: 9100, fourWeek: 22100, pctRank: 83, bias: 'Bullish' },
  { asset: 'Softs', market: 'Cotton', ticker: 'CT', openInterest: 196400, commercials: 18400, managedMoney: -24600, nonReportable: 6200, week: -3300, fourWeek: -11200, pctRank: 34, bias: 'Neutral' },
  { asset: 'Softs', market: 'Cocoa', ticker: 'CC', openInterest: 329700, commercials: -58100, managedMoney: 72400, nonReportable: -14300, week: 8400, fourWeek: 26300, pctRank: 89, bias: 'Bullish' },
  { asset: 'Softs', market: 'Orange Juice', ticker: 'OJ', openInterest: 41600, commercials: -7600, managedMoney: 10100, nonReportable: -2500, week: 1200, fourWeek: 3300, pctRank: 67, bias: 'Neutral' },
  { asset: 'Livestock', market: 'Live Cattle', ticker: 'LE', openInterest: 382200, commercials: -73600, managedMoney: 86100, nonReportable: -12500, week: 4900, fourWeek: 17100, pctRank: 78, bias: 'Bullish' },
  { asset: 'Livestock', market: 'Feeder Cattle', ticker: 'GF', openInterest: 74200, commercials: -9600, managedMoney: 13200, nonReportable: -3600, week: 900, fourWeek: 4100, pctRank: 65, bias: 'Neutral' },
  { asset: 'Livestock', market: 'Lean Hogs', ticker: 'HE', openInterest: 258500, commercials: 21400, managedMoney: -28600, nonReportable: 7200, week: -3100, fourWeek: -8600, pctRank: 26, bias: 'Bearish' },
  { asset: 'FX', market: 'EUR/USD', ticker: '6E', openInterest: 716800, commercials: -78200, managedMoney: 103400, nonReportable: -25200, week: 8900, fourWeek: 33100, pctRank: 82, bias: 'Bullish' },
  { asset: 'FX', market: 'GBP/USD', ticker: '6B', openInterest: 241600, commercials: -31800, managedMoney: 42700, nonReportable: -10900, week: 4400, fourWeek: 10900, pctRank: 66, bias: 'Neutral' },
  { asset: 'FX', market: 'JPY/USD', ticker: '6J', openInterest: 298200, commercials: 88400, managedMoney: -106600, nonReportable: 18200, week: -13400, fourWeek: -38100, pctRank: 15, bias: 'Bearish' },
  { asset: 'FX', market: 'AUD/USD', ticker: '6A', openInterest: 193600, commercials: -12400, managedMoney: 18800, nonReportable: -6400, week: 2100, fourWeek: 7400, pctRank: 58, bias: 'Neutral' },
  { asset: 'FX', market: 'CAD/USD', ticker: '6C', openInterest: 171900, commercials: 24600, managedMoney: -31900, nonReportable: 7300, week: -3600, fourWeek: -11600, pctRank: 24, bias: 'Bearish' },
  { asset: 'FX', market: 'CHF/USD', ticker: '6S', openInterest: 76800, commercials: -8400, managedMoney: 11700, nonReportable: -3300, week: 1300, fourWeek: 4600, pctRank: 61, bias: 'Neutral' },
  { asset: 'FX', market: 'MXN/USD', ticker: '6M', openInterest: 278400, commercials: -41200, managedMoney: 52900, nonReportable: -11700, week: 5100, fourWeek: 19200, pctRank: 80, bias: 'Bullish' },
  { asset: 'Rates', market: '2Y Note', ticker: 'ZT', openInterest: 3038800, commercials: 196700, managedMoney: -238900, nonReportable: 42200, week: -18600, fourWeek: -49800, pctRank: 22, bias: 'Bearish' },
  { asset: 'Rates', market: '5Y Note', ticker: 'ZF', openInterest: 3894200, commercials: 246800, managedMoney: -291400, nonReportable: 44600, week: -19200, fourWeek: -61200, pctRank: 20, bias: 'Bearish' },
  { asset: 'Rates', market: '10Y Note', ticker: 'ZN', openInterest: 4718200, commercials: 284600, managedMoney: -337200, nonReportable: 52600, week: -21400, fourWeek: -74400, pctRank: 18, bias: 'Bearish' },
  { asset: 'Rates', market: '30Y Bond', ticker: 'ZB', openInterest: 1227600, commercials: 93100, managedMoney: -118500, nonReportable: 25400, week: -8400, fourWeek: -27600, pctRank: 25, bias: 'Bearish' },
  { asset: 'Rates', market: 'Ultra Bond', ticker: 'UB', openInterest: 417300, commercials: 38400, managedMoney: -49200, nonReportable: 10800, week: -3900, fourWeek: -13200, pctRank: 27, bias: 'Bearish' },
  { asset: 'Equity', market: 'S&P 500', ticker: 'ES', openInterest: 2230900, commercials: -126800, managedMoney: 151300, nonReportable: -24500, week: 14600, fourWeek: 60700, pctRank: 73, bias: 'Bullish' },
  { asset: 'Equity', market: 'Nasdaq 100', ticker: 'NQ', openInterest: 902400, commercials: -68800, managedMoney: 84300, nonReportable: -15500, week: 10200, fourWeek: 34800, pctRank: 77, bias: 'Bullish' },
  { asset: 'Equity', market: 'Dow Jones', ticker: 'YM', openInterest: 124700, commercials: -8200, managedMoney: 12600, nonReportable: -4400, week: 1400, fourWeek: 5300, pctRank: 64, bias: 'Neutral' },
  { asset: 'Equity', market: 'Russell 2000', ticker: 'RTY', openInterest: 438600, commercials: 31200, managedMoney: -42100, nonReportable: 10900, week: -4800, fourWeek: -15800, pctRank: 23, bias: 'Bearish' },
  { asset: 'Volatility', market: 'VIX', ticker: 'VX', openInterest: 721400, commercials: 58600, managedMoney: -79400, nonReportable: 20800, week: -9200, fourWeek: -28400, pctRank: 17, bias: 'Bearish' },
];

const trend = [
  { week: 'W-8', gold: 118, crude: 166, rates: -229, equities: 92 },
  { week: 'W-7', gold: 127, crude: 174, rates: -244, equities: 104 },
  { week: 'W-6', gold: 142, crude: 191, rates: -265, equities: 118 },
  { week: 'W-5', gold: 158, crude: 203, rates: -281, equities: 126 },
  { week: 'W-4', gold: 171, crude: 211, rates: -296, equities: 137 },
  { week: 'W-3', gold: 166, crude: 218, rates: -311, equities: 132 },
  { week: 'W-2', gold: 188, crude: 228, rates: -322, equities: 145 },
  { week: 'Now', gold: 206, crude: 247, rates: -337, equities: 151 },
];

const spreads = [
  { pair: 'CL / NG', signal: 'Long crude vs gas', z: 1.8, spec: '+328.0K', note: 'Energy divergence widening' },
];

const releaseCalendar = [
  { date: 'Fri', time: '15:30 ET', event: 'CFTC COT Release', impact: 'High', focus: 'All futures' },
  { date: 'Tue', time: 'Close', event: 'Reporting Cutoff', impact: 'High', focus: 'Position snapshot' },
  { date: 'Mon', time: '09:00 ET', event: 'ICE Energy Positioning', impact: 'Med', focus: 'Brent / gasoil' },
  { date: 'Wed', time: '10:30 ET', event: 'EIA Inventory Read', impact: 'Med', focus: 'Energy positioning risk' },
  { date: 'Thu', time: '08:30 ET', event: 'Claims / CPI Window', impact: 'Med', focus: 'Rates / FX exposure' },
];

const signalCards = [
  { ticker: 'GC', title: 'Gold crowding', score: 91, action: 'Watch reversal risk above 90th percentile' },
  { ticker: 'ZN', title: 'Duration short', score: 18, action: 'Short squeeze risk if yields reject highs' },
  { ticker: '6J', title: 'JPY washout', score: 15, action: 'Contrarian long watch on policy shift' },
  { ticker: 'CL', title: 'Crude length', score: 88, action: 'Momentum intact while weekly change expands' },
];

const dealerPressure = [
  { market: 'Energy', producer: -42, swapDealer: 18, moneyManager: 61, read: 'Producer hedging rising' },
  { market: 'Metals', producer: -55, swapDealer: 23, moneyManager: 68, read: 'Funds absorbing hedge flow' },
  { market: 'Rates', producer: 31, swapDealer: 46, moneyManager: -69, read: 'Levered shorts dominant' },
  { market: 'FX', producer: -18, swapDealer: 9, moneyManager: 52, read: 'Dollar cross dispersion' },
];

const termStructure = [
  { bucket: 'Front', energy: 72, metals: 64, grains: 41, rates: 28 },
  { bucket: '2nd', energy: 68, metals: 61, grains: 44, rates: 31 },
  { bucket: '3rd', energy: 59, metals: 56, grains: 48, rates: 34 },
  { bucket: 'Deferred', energy: 47, metals: 49, grains: 53, rates: 39 },
];

const buildContractHistory = (row: COTLiveRow) => [
  { week: 'W-6', managed: Math.round(row.managedMoney / 1000 - row.fourWeek / 1800), commercial: Math.round(row.commercials / 1000 + row.fourWeek / 2200), openInterest: Math.round(row.openInterest / 10000 - 18) },
  { week: 'W-5', managed: Math.round(row.managedMoney / 1000 - row.fourWeek / 1500), commercial: Math.round(row.commercials / 1000 + row.fourWeek / 1900), openInterest: Math.round(row.openInterest / 10000 - 12) },
  { week: 'W-4', managed: Math.round(row.managedMoney / 1000 - row.fourWeek / 1200), commercial: Math.round(row.commercials / 1000 + row.fourWeek / 1600), openInterest: Math.round(row.openInterest / 10000 - 7) },
  { week: 'W-3', managed: Math.round(row.managedMoney / 1000 - row.fourWeek / 1800), commercial: Math.round(row.commercials / 1000 + row.fourWeek / 2400), openInterest: Math.round(row.openInterest / 10000 - 4) },
  { week: 'W-2', managed: Math.round(row.managedMoney / 1000 - row.week / 900), commercial: Math.round(row.commercials / 1000 + row.week / 1100), openInterest: Math.round(row.openInterest / 10000 - 2) },
  { week: 'Now', managed: Math.round(row.managedMoney / 1000), commercial: Math.round(row.commercials / 1000), openInterest: Math.round(row.openInterest / 10000) },
];

const buildStoredContractHistory = (rows: COTLiveRow[], ticker: string) => rows
  .filter(row => row.ticker === ticker && row.reportDate)
  .sort((a, b) => String(a.reportDate).localeCompare(String(b.reportDate)))
  .slice(-26)
  .map(row => ({ week: String(row.reportDate).slice(5), managed: Math.round(row.managedMoney / 1000), commercial: Math.round(row.commercials / 1000), openInterest: Math.round(row.openInterest / 10000) }));

const buildStoredOverviewTrend = (rows: COTLiveRow[]) => {
  const tickers = ['GC', 'CL', 'ZN', 'ES'];
  const dates = [...new Set(rows.map(row => row.reportDate).filter(Boolean) as string[])].sort().slice(-8);
  return dates.map(date => {
    const point: Record<string, string | number> = { week: date.slice(5) };
    tickers.forEach(ticker => {
      const row = rows.find(item => item.reportDate === date && item.ticker === ticker);
      point[ticker === 'GC' ? 'gold' : ticker === 'CL' ? 'crude' : ticker === 'ZN' ? 'rates' : 'equities'] = row ? Math.round(row.managedMoney / 1000) : 0;
    });
    return point;
  });
};

const toDateKey = (date?: Date) => date ? date.toISOString().slice(0, 10) : null;
const parseDateKey = (key: string | null) => key ? new Date(`${key}T00:00:00`) : undefined;
const availableReportDates = (rows: COTLiveRow[], latest: string | null) => [...new Set([latest?.slice(0, 10), ...rows.map(row => row.reportDate?.slice(0, 10))].filter(Boolean) as string[])].sort();
const rowsAsOf = (rows: COTLiveRow[], latestRows: COTLiveRow[], dateKey: string | null) => {
  if (!dateKey) return latestRows;
  const exactRows = rows.filter(row => row.reportDate?.slice(0, 10) === dateKey);
  if (exactRows.length) return exactRows;
  return latestRows;
};

const terminalPages = [
  { code: 'COT', tab: 'overview' as COTTab, title: 'Commitments Overview', source: 'Terminal', detail: 'Cross-asset summary, net specs, extremes' },
  { code: 'COTM', tab: 'markets' as COTTab, title: 'Market Monitor', source: 'Terminal', detail: 'Contract table, charts, rank, OI detail' },
  { code: 'WCH', tab: 'watch' as COTTab, title: 'Watchlist', source: 'Terminal', detail: 'Starred contracts pinned for fast scanning' },
  { code: 'COR', tab: 'corr' as COTTab, title: 'Positioning Correlation', source: 'Terminal', detail: 'Cross-market net %OI correlation matrix' },
  { code: 'COTL', tab: 'legacy' as COTTab, title: 'Legacy Futures', source: 'CFTC', detail: 'Commercial / non-commercial / non-reportable' },
  { code: 'COTD', tab: 'disagg' as COTTab, title: 'Disaggregated Futures', source: 'CFTC', detail: 'Producer, swap dealer, managed money, other reportable' },
  { code: 'TFF', tab: 'tff' as COTTab, title: 'Traders in Financial Futures', source: 'CFTC', detail: 'Dealer, asset manager, leveraged funds, other reportables' },
  { code: 'CIT', tab: 'cit' as COTTab, title: 'Commodity Index Traders', source: 'CFTC', detail: 'Index trader concentration and commodity allocation' },
  { code: 'DLR', tab: 'dealers' as COTTab, title: 'Dealer Positioning', source: 'PMT', detail: 'Dealer/swap pressure and hedge imbalance' },
  { code: 'FLW', tab: 'flows' as COTTab, title: 'Weekly Flow Monitor', source: 'PMT', detail: '1W/4W net flow, velocity, reversals' },
  { code: 'SEAS', tab: 'seasonal' as COTTab, title: 'Seasonal COT', source: 'PMT', detail: 'Seasonal rank vs current positioning' },
  { code: 'COTX', tab: 'extremes' as COTTab, title: 'Extreme Positioning', source: 'Terminal', detail: '80/20 percentile, crowding and washout' },
  { code: 'COTS', tab: 'spreads' as COTTab, title: 'Spread Dashboard', source: 'Terminal', detail: 'Cross-market positioning spreads' },
  { code: 'COTR', tab: 'reports' as COTTab, title: 'Report Library', source: 'CFTC/PMT', detail: 'Report type directory and release map' },
];

const fallbackLegacyRows = fallbackCotRows.map(row => ({ market: row.market, ticker: row.ticker, nonCommercialLong: Math.max(row.managedMoney, 0) + 42000, nonCommercialShort: Math.max(-row.managedMoney, 0) + 36000, commercialLong: Math.max(row.commercials, 0) + 88000, commercialShort: Math.max(-row.commercials, 0) + 91000, spreading: Math.round(row.openInterest * 0.08), nonReportable: row.nonReportable }));
const fallbackDisaggRows = fallbackCotRows.map(row => ({ market: row.market, ticker: row.ticker, producer: Math.round(row.commercials * 0.68), swapDealer: Math.round(row.commercials * -0.22), managedMoney: row.managedMoney, otherReportable: Math.round((row.nonReportable + row.week) * 0.75), nonReportable: row.nonReportable }));
const fallbackTffRows = fallbackCotRows.filter(row => ['Rates', 'FX', 'Equity'].includes(row.asset)).map(row => ({ market: row.market, ticker: row.ticker, dealer: Math.round(row.commercials * 0.62), assetManager: Math.round(row.managedMoney * 0.52), leveragedFunds: Math.round(row.managedMoney * 0.38), otherReportable: Math.round(row.nonReportable * 0.8), rank: row.pctRank }));
const fallbackCitRows = fallbackCotRows.filter(row => ['Energy', 'Metals', 'Grains', 'Softs'].includes(row.asset)).map(row => ({ market: row.market, ticker: row.ticker, indexLong: Math.round(row.openInterest * (0.09 + row.pctRank / 2000)), indexShort: Math.round(row.openInterest * 0.025), pctOi: Math.round(9 + row.pctRank / 10), weekly: Math.round(row.week * 0.34) }));

const formatK = (value: number) => `${value > 0 ? '+' : ''}${(value / 1000).toFixed(1)}K`;
const formatOI = (value: number) => `${(value / 1000000).toFixed(value >= 1000000 ? 2 : 3)}M`;
const rankClass = (value: number) => value >= 80 ? 'text-positive' : value <= 20 ? 'text-negative' : 'text-muted-foreground';
const getRow = (rows: COTLiveRow[], ticker: string) => rows.find(row => row.ticker === ticker) ?? rows[0];

const formatPct = (value: number) => `${value > 0 ? '+' : ''}${value.toFixed(1)}%`;
const netPctOi = (row: COTLiveRow, key: 'managedMoney' | 'commercials' | 'nonReportable') => row.openInterest ? (row[key] / row.openInterest) * 100 : 0;
const formatAbsPct = (value: number) => `${value.toFixed(1)}%`;
const concentrationRead = (row: COTLiveRow) => Math.abs(netPctOi(row, 'managedMoney')) >= 12 ? 'Crowded' : Math.abs(netPctOi(row, 'managedMoney')) >= 7 ? 'Elevated' : 'Normal';
const squeezeRead = (row: COTLiveRow) => row.pctRank <= 20 && row.week > 0 ? 'Short-cover watch' : row.pctRank >= 80 && row.week < 0 ? 'Long liquidation watch' : row.pctRank >= 80 ? 'Crowded long' : row.pctRank <= 20 ? 'Washed out short' : 'Balanced';
const activePage = (tab: COTTab) => terminalPages.find(page => page.tab === tab) ?? terminalPages[0];

// === New analytics utilities ===

// Open Interest percentile across the board for a row.
const oiPctRank = (row: COTLiveRow, all: COTLiveRow[]) => {
  if (!all.length) return 50;
  const below = all.filter(r => r.openInterest <= row.openInterest).length;
  return Math.round((below / all.length) * 100);
};

// 4w vs 1w velocity acceleration (positive = flow accelerating in same direction).
const flowAcceleration = (row: COTLiveRow) => {
  const weekly = row.week;
  const fourAvg = row.fourWeek / 4;
  if (Math.sign(weekly) !== Math.sign(fourAvg) || fourAvg === 0) return 0;
  return Math.round(((weekly - fourAvg) / Math.abs(fourAvg)) * 100);
};

// Time-at-extreme: count of recent weeks (in stored history) where this ticker was at extreme.
const timeAtExtreme = (history: COTLiveRow[], ticker: string) => {
  const series = history.filter(r => r.ticker === ticker).sort((a, b) => String(b.reportDate).localeCompare(String(a.reportDate)));
  let count = 0;
  for (const r of series) {
    if (r.pctRank >= 80 || r.pctRank <= 20) count++;
    else break;
  }
  return count;
};

// Divergence proxy: do MM net direction and 4w trend agree? Mismatch = potential divergence.
const divergenceFlag = (row: COTLiveRow) => {
  const mmDir = Math.sign(row.managedMoney);
  const flowDir = Math.sign(row.fourWeek);
  if (mmDir === 0 || flowDir === 0) return { state: 'flat', label: '·' };
  if (mmDir !== flowDir && Math.abs(row.fourWeek) > Math.abs(row.openInterest) * 0.005) {
    return { state: 'div', label: mmDir > 0 ? '◇ LONG FADING' : '◇ SHORT COVERING' };
  }
  return { state: 'align', label: mmDir > 0 ? '↑ LONG BUILD' : '↓ SHORT BUILD' };
};

// Pearson correlation
const correlation = (xs: number[], ys: number[]) => {
  const n = Math.min(xs.length, ys.length);
  if (n < 4) return 0;
  const mx = xs.slice(0, n).reduce((s, v) => s + v, 0) / n;
  const my = ys.slice(0, n).reduce((s, v) => s + v, 0) / n;
  let num = 0, dx = 0, dy = 0;
  for (let i = 0; i < n; i++) {
    const a = xs[i] - mx, b = ys[i] - my;
    num += a * b; dx += a * a; dy += b * b;
  }
  const den = Math.sqrt(dx * dy);
  return den ? num / den : 0;
};

// Build aligned MM-net-%OI series per ticker from history.
const buildSeries = (history: COTLiveRow[], tickers: string[]) => {
  const dates = [...new Set(history.map(r => r.reportDate?.slice(0, 10)).filter(Boolean) as string[])].sort().slice(-26);
  const series: Record<string, number[]> = {};
  tickers.forEach(t => {
    series[t] = dates.map(d => {
      const r = history.find(row => row.ticker === t && row.reportDate?.slice(0, 10) === d);
      return r ? netPctOi(r, 'managedMoney') : 0;
    });
  });
  return { dates, series };
};

// Next CFTC release: every Friday at 15:30 ET; report covers prior Tuesday.
const nextCFTCRelease = () => {
  const now = new Date();
  const target = new Date(now);
  const day = now.getUTCDay();
  // Friday = 5; 15:30 ET ≈ 19:30 UTC (handles DST roughly)
  const daysUntilFri = (5 - day + 7) % 7;
  target.setUTCDate(now.getUTCDate() + daysUntilFri);
  target.setUTCHours(20, 30, 0, 0);
  if (daysUntilFri === 0 && now.getTime() > target.getTime()) target.setUTCDate(target.getUTCDate() + 7);
  const diff = target.getTime() - now.getTime();
  const days = Math.floor(diff / 86400000);
  const hours = Math.floor((diff % 86400000) / 3600000);
  const mins = Math.floor((diff % 3600000) / 60000);
  return { target, days, hours, mins };
};

const groupRows = (rows: COTLiveRow[]) => Object.values(rows.reduce<Record<string, { asset: string; openInterest: number; managedMoney: number; commercials: number; week: number; count: number }>>((acc, row) => {
  acc[row.asset] ??= { asset: row.asset, openInterest: 0, managedMoney: 0, commercials: 0, week: 0, count: 0 };
  acc[row.asset].openInterest += row.openInterest;
  acc[row.asset].managedMoney += row.managedMoney;
  acc[row.asset].commercials += row.commercials;
  acc[row.asset].week += row.week;
  acc[row.asset].count += 1;
  return acc;
}, {}));

const buildSpreadRows = (rows: COTLiveRow[]) => rows
  .flatMap((left, i) => rows.slice(i + 1).map(right => {
    const gap = left.managedMoney - right.managedMoney;
    const z = Math.min(3, Math.abs(gap) / Math.max(1, (left.openInterest + right.openInterest) * 0.08));
    return { pair: `${left.ticker} / ${right.ticker}`, signal: `${left.asset === right.asset ? 'Intra' : 'Cross'}-${left.asset}/${right.asset}`, z, spec: formatK(gap), note: `${left.market} net ${formatK(left.managedMoney)} vs ${right.market} ${formatK(right.managedMoney)}`, left: left.ticker };
  }))
  .sort((a, b) => b.z - a.z)
  .slice(0, 12);

const detailReadRows = (rows: COTLiveRow[]) => {
  const totalOi = rows.reduce((sum, row) => sum + row.openInterest, 0);
  const bullish = rows.filter(row => row.bias === 'Bullish').length;
  const bearish = rows.filter(row => row.bias === 'Bearish').length;
  const added = rows.filter(row => row.week > 0).length;
  const reduced = rows.filter(row => row.week < 0).length;
  const topLong = [...rows].sort((a, b) => b.managedMoney - a.managedMoney)[0];
  const topShort = [...rows].sort((a, b) => a.managedMoney - b.managedMoney)[0];
  const topFlow = [...rows].sort((a, b) => Math.abs(b.week) - Math.abs(a.week))[0];
  const topOi = [...rows].sort((a, b) => b.openInterest - a.openInterest)[0];
  return { totalOi, bullish, bearish, added, reduced, topLong, topShort, topFlow, topOi };
};

// === Watchlist (localStorage) ===
const WATCHLIST_KEY = 'cot.watchlist.v1';
const loadWatchlist = (): string[] => {
  try { const raw = localStorage.getItem(WATCHLIST_KEY); return raw ? JSON.parse(raw) : ['GC', 'CL', 'ZN', 'ES']; } catch { return []; }
};
const saveWatchlist = (list: string[]) => { try { localStorage.setItem(WATCHLIST_KEY, JSON.stringify(list)); } catch {} };

// === CSV export ===
const downloadCSV = (filename: string, rows: Record<string, unknown>[]) => {
  if (!rows.length) return;
  const keys = Object.keys(rows[0]);
  const escape = (v: unknown) => {
    const s = v === null || v === undefined ? '' : String(v);
    return /[",\n]/.test(s) ? `"${s.replace(/"/g, '""')}"` : s;
  };
  const csv = [keys.join(','), ...rows.map(r => keys.map(k => escape(r[k])).join(','))].join('\n');
  const blob = new Blob([csv], { type: 'text/csv' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url; a.download = filename; a.click();
  URL.revokeObjectURL(url);
};

const buildSnapshotText = (rows: COTLiveRow[], reads: ReturnType<typeof detailReadRows>, dateKey: string | null) => {
  const lines: string[] = [];
  lines.push(`COT SNAPSHOT — ${dateKey ?? 'latest'}`);
  lines.push(`Coverage: ${rows.length} contracts · Bull/Bear: ${reads.bullish}/${reads.bearish} · Added/Cut: ${reads.added}/${reads.reduced}`);
  lines.push('');
  lines.push(`Top spec long  : ${reads.topLong?.ticker ?? '--'} ${reads.topLong ? formatK(reads.topLong.managedMoney) : ''} (${reads.topLong?.market ?? ''})`);
  lines.push(`Top spec short : ${reads.topShort?.ticker ?? '--'} ${reads.topShort ? formatK(reads.topShort.managedMoney) : ''} (${reads.topShort?.market ?? ''})`);
  lines.push(`Biggest 1W flow: ${reads.topFlow?.ticker ?? '--'} ${reads.topFlow ? formatK(reads.topFlow.week) : ''} (${reads.topFlow ? squeezeRead(reads.topFlow) : ''})`);
  lines.push(`Largest OI mkt : ${reads.topOi?.ticker ?? '--'} ${reads.topOi ? formatOI(reads.topOi.openInterest) : ''}`);
  lines.push('');
  lines.push('EXTREMES (>=80 / <=20 %ile):');
  rows.filter(r => r.pctRank >= 80 || r.pctRank <= 20).forEach(r => {
    lines.push(`  ${r.ticker.padEnd(4)} ${r.market.padEnd(18)} ${String(r.pctRank).padStart(3)}%  MM ${formatK(r.managedMoney)}  1W ${formatK(r.week)}  ${squeezeRead(r)}`);
  });
  return lines.join('\n');
};

function Panel({ title, children, action }: { title: string; children: React.ReactNode; action?: React.ReactNode }) {
  return (
    <div className="border border-border overflow-hidden bg-surface-primary">
      <div className="bg-surface-elevated px-2 py-1 border-b border-border flex items-center justify-between gap-2">
        <span className="text-accent font-mono font-bold text-[10px] uppercase">{title}</span>
        {action}
      </div>
      {children}
    </div>
  );
}

type SortDir = 'asc' | 'desc';
type TableColumn<T> = {
  key: string;
  label: string;
  align?: 'left' | 'right';
  value: (row: T) => string | number;
  render?: (row: T) => React.ReactNode;
  className?: (row: T) => string;
};

function SortableFilterTable<T>({ rows, columns, rowKey, onRowClick, minWidth = 760, emptyText = 'No matching rows', pinPredicate }: { rows: T[]; columns: TableColumn<T>[]; rowKey: (row: T, index: number) => string; onRowClick?: (row: T) => void; minWidth?: number; emptyText?: string; pinPredicate?: (row: T) => boolean }) {
  const [sort, setSort] = useState<{ key: string; dir: SortDir } | null>(null);
  const [filters, setFilters] = useState<Record<string, string>>({});
  const activeRows = useMemo(() => {
    const filtered = rows.filter(row => columns.every(column => {
      const filter = (filters[column.key] ?? '').trim().toLowerCase();
      if (!filter) return true;
      return String(column.value(row)).toLowerCase().includes(filter);
    }));
    const sorted = !sort ? filtered : (() => {
      const column = columns.find(item => item.key === sort.key);
      if (!column) return filtered;
      return [...filtered].sort((a, b) => {
        const av = column.value(a);
        const bv = column.value(b);
        const result = typeof av === 'number' && typeof bv === 'number' ? av - bv : String(av).localeCompare(String(bv), undefined, { numeric: true });
        return sort.dir === 'asc' ? result : -result;
      });
    })();
    if (!pinPredicate) return sorted;
    const pinned = sorted.filter(pinPredicate);
    const rest = sorted.filter(r => !pinPredicate(r));
    return [...pinned, ...rest];
  }, [columns, filters, rows, sort, pinPredicate]);
  const toggleSort = (key: string) => setSort(current => current?.key === key ? { key, dir: current.dir === 'asc' ? 'desc' : 'asc' } : { key, dir: 'desc' });

  return (
    <div className="overflow-x-auto">
      <table className="w-full text-[10px] font-mono" style={{ minWidth }}>
        <thead>
          <tr className="border-b border-grid-line">
            {columns.map(column => <th key={column.key} className={`${column.align === 'right' ? 'text-right' : 'text-left'} px-2 py-1 text-muted-foreground uppercase`}><button onClick={() => toggleSort(column.key)} className="w-full text-inherit hover:text-accent"><span>{column.label}</span><span className="ml-1 text-[8px]">{sort?.key === column.key ? (sort.dir === 'asc' ? '▲' : '▼') : '↕'}</span></button></th>)}
          </tr>
          <tr className="border-b border-grid-line bg-surface-deep/60">
            {columns.map(column => <th key={`${column.key}-filter`} className="px-1 py-1"><input value={filters[column.key] ?? ''} onChange={(event) => setFilters(current => ({ ...current, [column.key]: event.target.value }))} onClick={(event) => event.stopPropagation()} placeholder="FILTER" className={`h-5 w-full border border-grid-line bg-surface-primary px-1 text-[9px] font-mono text-foreground placeholder:text-muted-foreground focus:outline-none focus:border-accent ${column.align === 'right' ? 'text-right' : 'text-left'}`} /></th>)}
          </tr>
        </thead>
        <tbody>
          {activeRows.map((row, index) => <tr key={rowKey(row, index)} onClick={() => onRowClick?.(row)} className={`border-b border-grid-line ${onRowClick ? 'cursor-pointer hover:bg-surface-elevated' : ''} ${pinPredicate?.(row) ? 'bg-accent/5' : index % 2 ? 'bg-surface-elevated/30' : ''}`}>{columns.map(column => <td key={column.key} className={`${column.align === 'right' ? 'text-right' : 'text-left'} px-2 py-1 ${column.className?.(row) ?? 'text-foreground'}`}>{column.render?.(row) ?? column.value(row)}</td>)}</tr>)}
          {!activeRows.length && <tr><td colSpan={columns.length} className="px-2 py-3 text-center text-muted-foreground">{emptyText}</td></tr>}
        </tbody>
      </table>
    </div>
  );
}

export default function COTData() {
  const [activeTab, setActiveTab] = useState<COTTab>('overview');
  const [selectedTicker, setSelectedTicker] = useState('GC');
  const [asOfDate, setAsOfDate] = useState<string | null>(null);
  const [watchlist, setWatchlist] = useState<string[]>(loadWatchlist);
  const [snapshotCopied, setSnapshotCopied] = useState(false);
  const live = useCFTC();
  const historyRows = live.historyRows.length ? live.historyRows : [];
  const reportDates = availableReportDates(historyRows, live.reportDate);
  const effectiveDate = asOfDate ?? live.reportDate?.slice(0, 10) ?? null;
  const cotRows = historyRows.length ? rowsAsOf(historyRows, live.rows, effectiveDate) : (live.rows.length ? live.rows : fallbackCotRows);
  const overviewTrend = historyRows.length ? buildStoredOverviewTrend(historyRows.filter(row => !effectiveDate || String(row.reportDate).slice(0, 10) <= effectiveDate)) : trend;
  const legacyRows = live.legacyRows.length ? live.legacyRows : fallbackLegacyRows;
  const disaggRows = live.disaggRows.length ? live.disaggRows : fallbackDisaggRows;
  const tffRows = live.tffRows.length ? live.tffRows : fallbackTffRows;
  const citRows = live.citRows.length ? live.citRows : fallbackCitRows;
  const selected = getRow(cotRows, selectedTicker);
  const page = activePage(activeTab);
  const assetRows = groupRows(cotRows);
  const liveSpreads = buildSpreadRows(cotRows);
  const totalOpenInterest = cotRows.reduce((sum, row) => sum + row.openInterest, 0);
  const specNet = cotRows.reduce((sum, row) => sum + row.managedMoney, 0);
  const weeklyNet = cotRows.reduce((sum, row) => sum + row.week, 0);
  const extremes = cotRows.filter(row => row.pctRank >= 80 || row.pctRank <= 20).length;
  const largestShifts = [...cotRows].sort((a, b) => Math.abs(b.fourWeek) - Math.abs(a.fourWeek));
  const extremeRows = cotRows.filter(row => row.pctRank >= 80 || row.pctRank <= 20).sort((a, b) => Math.abs(b.pctRank - 50) - Math.abs(a.pctRank - 50));
  const reads = detailReadRows(cotRows);
  const release = nextCFTCRelease();
  const watchSet = useMemo(() => new Set(watchlist), [watchlist]);
  const isPinned = (row: COTLiveRow) => watchSet.has(row.ticker);

  const toggleWatch = (ticker: string) => {
    setWatchlist(prev => {
      const next = prev.includes(ticker) ? prev.filter(t => t !== ticker) : [...prev, ticker];
      saveWatchlist(next);
      return next;
    });
  };

  // Keyboard: 'f' to favorite the currently selected ticker
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      const tag = (e.target as HTMLElement | null)?.tagName?.toLowerCase();
      if (tag === 'input' || tag === 'textarea') return;
      if (e.key === 'f' || e.key === 'F') { e.preventDefault(); toggleWatch(selectedTicker); }
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [selectedTicker]);

  const exportCurrent = () => {
    const rows = cotRows.map(r => ({
      asset: r.asset, ticker: r.ticker, market: r.market,
      open_interest: r.openInterest, commercials: r.commercials, managed_money: r.managedMoney,
      non_reportable: r.nonReportable, week_chg: r.week, four_week_chg: r.fourWeek,
      pct_rank: r.pctRank, bias: r.bias, mm_pct_oi: netPctOi(r, 'managedMoney').toFixed(2),
      signal: squeezeRead(r), divergence: divergenceFlag(r).label,
    }));
    downloadCSV(`cot-${effectiveDate ?? 'latest'}.csv`, rows);
  };

  const copySnapshot = async () => {
    try { await navigator.clipboard.writeText(buildSnapshotText(cotRows, reads, effectiveDate)); setSnapshotCopied(true); setTimeout(() => setSnapshotCopied(false), 1500); } catch {}
  };

  return (
    <div className="space-y-3">
      <div className="flex items-center gap-2 flex-wrap">
        <span className="text-accent font-mono font-bold text-xs uppercase">Commitments of Traders</span>
        <span className="text-muted-foreground font-mono text-[9px]">COT &lt;GO&gt;</span>
        <div className="ml-auto flex items-center gap-2 flex-wrap">
          <button onClick={exportCurrent} title="Export current view to CSV" className="h-7 border border-grid-line bg-surface-primary px-2 font-mono text-[9px] text-foreground hover:border-accent hover:bg-surface-elevated flex items-center gap-1">
            <Download className="h-3 w-3 text-accent" /> CSV
          </button>
          <button onClick={copySnapshot} title="Copy terminal snapshot to clipboard" className="h-7 border border-grid-line bg-surface-primary px-2 font-mono text-[9px] text-foreground hover:border-accent hover:bg-surface-elevated flex items-center gap-1">
            <CopyIcon className="h-3 w-3 text-accent" /> {snapshotCopied ? 'COPIED' : 'SNAP'}
          </button>
          <Popover>
            <PopoverTrigger asChild>
              <button className="h-7 border border-grid-line bg-surface-primary px-2 font-mono text-[9px] text-foreground hover:border-accent hover:bg-surface-elevated flex items-center gap-1">
                <CalendarIcon className="h-3 w-3 text-accent" /> ASOF {effectiveDate ?? 'LATEST'}
              </button>
            </PopoverTrigger>
            <PopoverContent className="w-auto p-0 bg-surface-primary border-border" align="end">
              <Calendar mode="single" selected={parseDateKey(effectiveDate)} onSelect={(date) => setAsOfDate(toDateKey(date))} disabled={(date) => !reportDates.includes(toDateKey(date) ?? '')} initialFocus className="p-3 pointer-events-auto" />
            </PopoverContent>
          </Popover>
          <button onClick={() => setAsOfDate(null)} className="h-7 border border-grid-line bg-surface-primary px-2 font-mono text-[9px] text-muted-foreground hover:text-accent hover:border-accent">LATEST</button>
          <span className="text-[8px] font-mono text-muted-foreground">{live.loading ? 'Loading CFTC live feed…' : live.error ? 'CFTC fallback active' : `Live ${live.source} · ${effectiveDate ?? 'latest'} · next ${release.days}d ${release.hours}h ${release.mins}m`}</span>
        </div>
      </div>

      <div className="bg-surface-deep border border-border px-1 py-0.5 flex gap-0.5 overflow-x-auto items-center">
        {tabs.map(tab => (
          <button
            key={tab.id}
            onClick={() => setActiveTab(tab.id)}
            className={`px-2.5 py-1.5 text-[10px] font-mono whitespace-nowrap flex items-center gap-1 transition-all duration-100 flex-shrink-0 ${
              activeTab === tab.id ? 'bg-accent text-accent-foreground font-bold' : 'text-muted-foreground hover:bg-surface-elevated hover:text-foreground'
            }`}
          >
            <span className="text-[8px] opacity-60">{tab.code}</span>
            <span>{tab.label}</span>
            {tab.id === 'watch' && watchlist.length > 0 && <span className="text-[8px] bg-accent/20 text-accent px-1">{watchlist.length}</span>}
          </button>
        ))}
      </div>

      <div className="border border-border bg-surface-primary px-2 py-1.5 flex flex-col md:flex-row md:items-center gap-1 md:gap-3">
        <div className="font-mono text-[11px] text-accent font-bold">{page.code} · {page.title}</div>
        <div className="font-mono text-[10px] text-muted-foreground flex-1">{page.detail}</div>
        <div className="font-mono text-[9px] text-muted-foreground">{cotRows.length} contracts · {assetRows.length} sectors · {effectiveDate ?? 'latest'} · ★ {watchlist.length}</div>
      </div>

      <div className="grid grid-cols-2 lg:grid-cols-6 gap-2">
        {[
          { label: 'OPEN INTEREST', value: formatOI(totalOpenInterest), chg: '+2.7% W/W' },
          { label: 'SPEC NET', value: formatK(specNet), chg: formatK(weeklyNet) },
          { label: 'RISK LONGS', value: formatK(cotRows.filter(r => r.managedMoney > 0).reduce((sum, row) => sum + row.managedMoney, 0)), chg: 'MM gross long' },
          { label: 'COMMERCIAL HEDGE', value: formatK(cotRows.reduce((sum, row) => sum + row.commercials, 0)), chg: 'Producer net' },
          { label: 'EXTREME READS', value: String(extremes), chg: '80/20 %ile' },
          { label: 'COVERAGE', value: String(cotRows.length), chg: 'Contracts' },
        ].map((item, index) => (
          <button key={item.label} onClick={() => { setActiveTab(index === 4 ? 'extremes' : index === 5 ? 'markets' : 'overview'); }} className="border border-border bg-surface-primary p-2 text-left hover:bg-surface-elevated hover:border-accent/50 transition-colors">
            <div className="text-[9px] font-mono text-muted-foreground">{item.label}</div>
            <div className="text-lg font-mono font-bold text-foreground">{item.value}</div>
            <div className="text-[9px] font-mono font-bold text-accent">{item.chg}</div>
          </button>
        ))}
      </div>

      <SelectedContractPanel row={selected} onOpenMarkets={() => setActiveTab('markets')} starred={watchSet.has(selected.ticker)} onToggleStar={() => toggleWatch(selected.ticker)} />

      <div className="grid grid-cols-2 lg:grid-cols-4 gap-2">
        {[
          { label: 'TOP SPEC LONG', value: `${reads.topLong?.ticker ?? '--'} ${reads.topLong ? formatK(reads.topLong.managedMoney) : ''}`, sub: reads.topLong?.market ?? 'No data', tab: 'markets' as COTTab, ticker: reads.topLong?.ticker },
          { label: 'TOP SPEC SHORT', value: `${reads.topShort?.ticker ?? '--'} ${reads.topShort ? formatK(reads.topShort.managedMoney) : ''}`, sub: reads.topShort?.market ?? 'No data', tab: 'markets' as COTTab, ticker: reads.topShort?.ticker },
          { label: 'BIGGEST 1W FLOW', value: `${reads.topFlow?.ticker ?? '--'} ${reads.topFlow ? formatK(reads.topFlow.week) : ''}`, sub: reads.topFlow ? squeezeRead(reads.topFlow) : 'No data', tab: 'flows' as COTTab, ticker: reads.topFlow?.ticker },
          { label: 'LARGEST OI MARKET', value: `${reads.topOi?.ticker ?? '--'} ${reads.topOi ? formatOI(reads.topOi.openInterest) : ''}`, sub: reads.topOi ? `${formatAbsPct(reads.topOi.openInterest / Math.max(1, reads.totalOi) * 100)} of board OI` : 'No data', tab: 'markets' as COTTab, ticker: reads.topOi?.ticker },
        ].map(item => (
          <button key={item.label} onClick={() => { if (item.ticker) setSelectedTicker(item.ticker); setActiveTab(item.tab); }} className="border border-border bg-surface-primary p-2 text-left hover:bg-surface-elevated hover:border-accent/50 transition-colors">
            <div className="text-[9px] font-mono text-muted-foreground">{item.label}</div>
            <div className="text-[13px] font-mono font-bold text-foreground">{item.value}</div>
            <div className="text-[9px] font-mono text-accent truncate">{item.sub}</div>
          </button>
        ))}
      </div>

      {activeTab === 'overview' && (
        <>
          <div className="grid grid-cols-1 xl:grid-cols-3 gap-3">
            <div className="border border-border bg-surface-primary p-3 xl:col-span-2">
              <div className="text-[10px] font-mono text-muted-foreground mb-1">Managed Money Net — Key Contracts</div>
              <ExpandableResponsiveContainer width="100%" height={200}>
                <LineChart data={overviewTrend}>
                  <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
                  <XAxis dataKey="week" tick={{ fontSize: 9, fontFamily: 'monospace', fill: 'hsl(var(--accent))' }} />
                  <YAxis tick={{ fontSize: 9, fontFamily: 'monospace', fill: 'hsl(var(--accent))' }} tickFormatter={v => `${v}K`} />
                  <Tooltip contentStyle={{ backgroundColor: 'hsl(var(--card))', border: '1px solid hsl(var(--accent))', fontFamily: 'monospace', fontSize: 10, color: 'hsl(var(--accent))' }} itemStyle={{ color: 'hsl(var(--accent))' }} labelStyle={{ color: 'hsl(var(--accent))', fontWeight: 'bold' }} formatter={(v: number) => [`${v}K contracts`]} />
                  <Line type="monotone" dataKey="gold" stroke="hsl(var(--accent))" strokeWidth={2} dot={false} />
                  <Line type="monotone" dataKey="crude" stroke="hsl(var(--positive))" strokeWidth={2} dot={false} />
                  <Line type="monotone" dataKey="rates" stroke="hsl(var(--negative))" strokeWidth={2} dot={false} />
                  <Line type="monotone" dataKey="equities" stroke="hsl(var(--muted-foreground))" strokeWidth={2} dot={false} />
                </LineChart>
              </ExpandableResponsiveContainer>
            </div>
            <div className="border border-border bg-surface-primary p-3">
              <div className="text-[10px] font-mono text-muted-foreground mb-1">Weekly Net Change</div>
              <ExpandableResponsiveContainer width="100%" height={200}>
                <BarChart data={cotRows.slice(0, 10)}>
                  <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
                  <XAxis dataKey="ticker" tick={{ fontSize: 9, fontFamily: 'monospace', fill: 'hsl(var(--accent))' }} />
                  <YAxis tick={{ fontSize: 9, fontFamily: 'monospace', fill: 'hsl(var(--accent))' }} tickFormatter={v => `${v / 1000}K`} />
                  <Tooltip contentStyle={{ backgroundColor: 'hsl(var(--card))', border: '1px solid hsl(var(--accent))', fontFamily: 'monospace', fontSize: 10, color: 'hsl(var(--accent))' }} itemStyle={{ color: 'hsl(var(--accent))' }} labelStyle={{ color: 'hsl(var(--accent))', fontWeight: 'bold' }} formatter={(v: number) => [formatK(v)]} />
                  <Bar dataKey="week" fill="hsl(var(--accent))" />
                </BarChart>
              </ExpandableResponsiveContainer>
            </div>
          </div>

          {/* Sector net-flow histogram */}
          <Panel title="Sector 1W Net Flow">
            <ExpandableResponsiveContainer width="100%" height={170}>
              <BarChart data={assetRows.map(a => ({ asset: a.asset, week: a.week, mm: a.managedMoney }))}>
                <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
                <XAxis dataKey="asset" tick={{ fontSize: 9, fontFamily: 'monospace', fill: 'hsl(var(--accent))' }} />
                <YAxis tick={{ fontSize: 9, fontFamily: 'monospace', fill: 'hsl(var(--accent))' }} tickFormatter={v => `${v / 1000}K`} />
                <Tooltip contentStyle={{ backgroundColor: 'hsl(var(--card))', border: '1px solid hsl(var(--accent))', fontFamily: 'monospace', fontSize: 10, color: 'hsl(var(--accent))' }} itemStyle={{ color: 'hsl(var(--accent))' }} labelStyle={{ color: 'hsl(var(--accent))', fontWeight: 'bold' }} formatter={(v: number) => [formatK(v)]} />
                <Bar dataKey="week">
                  {assetRows.map((a, i) => <Cell key={i} fill={a.week >= 0 ? 'hsl(var(--positive))' : 'hsl(var(--negative))'} />)}
                </Bar>
              </BarChart>
            </ExpandableResponsiveContainer>
          </Panel>

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-3">
            <ConcentrationTable rows={assetRows} onSelectAsset={(asset) => { setSelectedTicker(cotRows.find(row => row.asset === asset)?.ticker ?? selectedTicker); setActiveTab('markets'); }} />
            <ShiftTable rows={largestShifts.slice(0, 7)} onSelect={setSelectedTicker} />
          </div>
          <OverviewDetailGrid rows={cotRows} reads={reads} onSelect={(ticker) => { setSelectedTicker(ticker); setActiveTab('markets'); }} />
          <SignalCardGrid onSelect={setSelectedTicker} />
        </>
      )}

      {activeTab === 'markets' && (
        <MarketsDetail rows={cotRows} historyRows={historyRows} selected={selected} onSelect={setSelectedTicker} selectedTicker={selectedTicker} isPinned={isPinned} toggleWatch={toggleWatch} />
      )}

      {activeTab === 'watch' && (
        <WatchlistView rows={cotRows} watchlist={watchlist} onSelect={setSelectedTicker} selectedTicker={selectedTicker} toggleWatch={toggleWatch} historyRows={historyRows} />
      )}

      {activeTab === 'corr' && (
        <CorrelationMatrix history={historyRows} latestRows={cotRows} onSelect={setSelectedTicker} />
      )}

      {activeTab === 'legacy' && <LegacyReport rows={legacyRows} onSelect={setSelectedTicker} />}
      {activeTab === 'disagg' && <DisaggReport rows={disaggRows} onSelect={setSelectedTicker} />}
      {activeTab === 'tff' && <TFFReport rows={tffRows} onSelect={setSelectedTicker} />}
      {activeTab === 'cit' && <CITReport rows={citRows} onSelect={setSelectedTicker} />}
      {activeTab === 'dealers' && <DealerReport rows={assetRows} />}
      {activeTab === 'flows' && <FlowReport rows={cotRows} onSelect={setSelectedTicker} />}
      {activeTab === 'seasonal' && <SeasonalReport rows={cotRows} onSelect={setSelectedTicker} />}

      {activeTab === 'extremes' && (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-3">
          <MarketsTable rows={extremeRows} title="Crowded / Washed-Out Contracts" compact onSelect={setSelectedTicker} selectedTicker={selectedTicker} allRows={cotRows} historyRows={historyRows} isPinned={isPinned} toggleWatch={toggleWatch} />
          <Panel title="Extreme Read Monitor — Time at Extreme">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 p-2">
              {extremeRows.map(row => {
                const tae = timeAtExtreme(historyRows, row.ticker);
                return (
                  <button key={row.ticker} onClick={() => setSelectedTicker(row.ticker)} className="border border-grid-line bg-surface-elevated/30 p-2 text-left hover:border-accent/60 hover:bg-surface-elevated transition-colors">
                    <div className="flex items-center justify-between">
                      <span className="text-accent font-mono font-bold text-[11px]">{row.ticker}</span>
                      <span className={`font-mono font-bold text-[11px] ${rankClass(row.pctRank)}`}>{row.pctRank}%</span>
                    </div>
                    <div className="text-[10px] font-mono text-foreground">{row.market}</div>
                    <div className="text-[9px] font-mono text-muted-foreground">MM {formatK(row.managedMoney)} · 4W {formatK(row.fourWeek)} · {row.bias}</div>
                    {tae > 0 && <div className="text-[9px] font-mono text-accent mt-0.5">⏱ {tae}w at extreme</div>}
                  </button>
                );
              })}
            </div>
          </Panel>
        </div>
      )}

      {activeTab === 'spreads' && <SpreadReport rows={liveSpreads} onSelect={setSelectedTicker} />}

      {activeTab === 'calendar' && (
        <div className="space-y-3">
          <Panel title="Next CFTC Release">
            <div className="grid grid-cols-2 md:grid-cols-4 gap-2 p-2">
              <div className="border border-grid-line bg-surface-elevated/30 p-2"><div className="text-[9px] font-mono text-muted-foreground">COUNTDOWN</div><div className="text-lg font-mono font-bold text-accent">{release.days}d {release.hours}h {release.mins}m</div></div>
              <div className="border border-grid-line bg-surface-elevated/30 p-2"><div className="text-[9px] font-mono text-muted-foreground">RELEASE</div><div className="text-[11px] font-mono font-bold text-foreground">Fri 15:30 ET</div></div>
              <div className="border border-grid-line bg-surface-elevated/30 p-2"><div className="text-[9px] font-mono text-muted-foreground">REPORTING CUTOFF</div><div className="text-[11px] font-mono font-bold text-foreground">Tue close</div></div>
              <div className="border border-grid-line bg-surface-elevated/30 p-2"><div className="text-[9px] font-mono text-muted-foreground">LATEST AVAILABLE</div><div className="text-[11px] font-mono font-bold text-accent">{live.reportDate?.slice(0, 10) ?? '--'}</div></div>
            </div>
          </Panel>
          <Panel title="Release / Risk Calendar">
            <table className="w-full text-[10px] font-mono">
              <thead><tr className="border-b border-grid-line"><th className="text-left px-2 py-1 text-muted-foreground">DAY</th><th className="text-left px-2 py-1 text-muted-foreground">TIME</th><th className="text-left px-2 py-1 text-muted-foreground">EVENT</th><th className="text-right px-2 py-1 text-muted-foreground">IMPACT</th><th className="text-left px-2 py-1 text-muted-foreground">FOCUS</th></tr></thead>
              <tbody>{releaseCalendar.map((row, index) => <tr key={row.event} className={`border-b border-grid-line ${index % 2 !== 0 ? 'bg-surface-elevated/30' : ''}`}><td className="px-2 py-1 text-accent font-bold">{row.date}</td><td className="px-2 py-1 text-muted-foreground">{row.time}</td><td className="px-2 py-1 text-foreground">{row.event}</td><td className={`px-2 py-1 text-right font-bold ${row.impact === 'High' ? 'text-negative' : 'text-accent'}`}>{row.impact}</td><td className="px-2 py-1 text-muted-foreground">{row.focus}</td></tr>)}</tbody>
            </table>
          </Panel>
        </div>
      )}

      {activeTab === 'reports' && <ReportLibrary onOpen={setActiveTab} />}

      <div className="text-[8px] font-mono text-muted-foreground text-center">
        Press <span className="text-accent">F</span> to star/unstar selected · CSV export respects ASOF date · Snapshot copies plain-text terminal summary
      </div>
    </div>
  );
}

function SelectedContractPanel({ row, onOpenMarkets, starred, onToggleStar }: { row: COTLiveRow; onOpenMarkets: () => void; starred: boolean; onToggleStar: () => void }) {
  return (
    <div className="w-full border border-accent/40 bg-surface-primary p-3 text-left">
      <div className="grid grid-cols-2 md:grid-cols-7 gap-2 items-end">
        <div className="flex items-start gap-1">
          <button onClick={onToggleStar} title="Star (F)" className="hover:text-accent">
            <Star className={`h-4 w-4 ${starred ? 'fill-accent text-accent' : 'text-muted-foreground'}`} />
          </button>
          <button onClick={onOpenMarkets} className="text-left">
            <div className="text-[9px] font-mono text-muted-foreground">SELECTED</div>
            <div className="text-xl font-mono font-bold text-accent">{row.ticker}</div>
            <div className="text-[10px] font-mono text-foreground">{row.market}</div>
          </button>
        </div>
        <div><div className="text-[9px] font-mono text-muted-foreground">OPEN INT</div><div className="text-sm font-mono font-bold text-foreground">{formatOI(row.openInterest)}</div></div>
        <div><div className="text-[9px] font-mono text-muted-foreground">MANAGED</div><div className={`text-sm font-mono font-bold ${row.managedMoney >= 0 ? 'text-positive' : 'text-negative'}`}>{formatK(row.managedMoney)}</div></div>
        <div><div className="text-[9px] font-mono text-muted-foreground">COMMERCIAL</div><div className={`text-sm font-mono font-bold ${row.commercials >= 0 ? 'text-positive' : 'text-negative'}`}>{formatK(row.commercials)}</div></div>
        <div><div className="text-[9px] font-mono text-muted-foreground">1W / 4W</div><div className="text-sm font-mono font-bold text-foreground">{formatK(row.week)} / {formatK(row.fourWeek)}</div></div>
        <div><div className="text-[9px] font-mono text-muted-foreground">RANK</div><div className={`text-sm font-mono font-bold ${rankClass(row.pctRank)}`}>{row.pctRank}% · {row.bias}</div></div>
        <div><div className="text-[9px] font-mono text-muted-foreground">DIVERGENCE</div><div className={`text-[11px] font-mono font-bold ${divergenceFlag(row).state === 'div' ? 'text-accent' : 'text-muted-foreground'}`}>{divergenceFlag(row).label}</div></div>
      </div>
    </div>
  );
}

function SignalCardGrid({ onSelect }: { onSelect: (ticker: string) => void }) {
  return (
    <div className="grid grid-cols-1 md:grid-cols-4 gap-2">
      {signalCards.map(card => (
        <button key={card.ticker} onClick={() => onSelect(card.ticker)} className="border border-border bg-surface-primary p-2 text-left hover:bg-surface-elevated hover:border-accent/50 transition-colors">
          <div className="flex items-center justify-between"><span className="text-accent font-mono font-bold text-[11px]">{card.ticker}</span><span className={`font-mono font-bold text-[11px] ${rankClass(card.score)}`}>{card.score}</span></div>
          <div className="text-[10px] font-mono text-foreground">{card.title}</div>
          <div className="text-[9px] font-mono text-muted-foreground">{card.action}</div>
        </button>
      ))}
    </div>
  );
}

function OverviewDetailGrid({ rows, reads, onSelect }: { rows: COTLiveRow[]; reads: ReturnType<typeof detailReadRows>; onSelect: (ticker: string) => void }) {
  const totalOi = Math.max(1, reads.totalOi);
  const topCrowding = [...rows].sort((a, b) => Math.abs(netPctOi(b, 'managedMoney')) - Math.abs(netPctOi(a, 'managedMoney'))).slice(0, 6);
  const breadthRows = groupRows(rows).map(row => ({
    asset: row.asset,
    contracts: row.count,
    oiShare: row.openInterest / totalOi * 100,
    mmNet: row.managedMoney,
    oneWeek: row.week,
    breadth: rows.filter(item => item.asset === row.asset && item.managedMoney > 0).length - rows.filter(item => item.asset === row.asset && item.managedMoney < 0).length,
  }));
  const crowdColumns: TableColumn<COTLiveRow>[] = [
    { key: 'ticker', label: 'TICKER', value: row => row.ticker, className: () => 'text-accent font-bold' },
    { key: 'market', label: 'MARKET', value: row => row.market },
    { key: 'mmPct', label: 'MM %OI', align: 'right', value: row => netPctOi(row, 'managedMoney'), render: row => formatPct(netPctOi(row, 'managedMoney')), className: row => netPctOi(row, 'managedMoney') >= 0 ? 'text-positive font-bold' : 'text-negative font-bold' },
    { key: 'commPct', label: 'COMM %OI', align: 'right', value: row => netPctOi(row, 'commercials'), render: row => formatPct(netPctOi(row, 'commercials')), className: row => netPctOi(row, 'commercials') >= 0 ? 'text-positive' : 'text-negative' },
    { key: 'read', label: 'READ', value: row => concentrationRead(row), className: () => 'text-muted-foreground' },
  ];
  return (
    <div className="grid grid-cols-1 xl:grid-cols-3 gap-3">
      <Panel title="Board Breadth / Participation">
        <div className="grid grid-cols-2 gap-2 p-2">
          <div className="border border-grid-line bg-surface-elevated/30 p-2"><div className="text-[9px] font-mono text-muted-foreground">BULL / BEAR</div><div className="text-[13px] font-mono font-bold text-foreground">{reads.bullish} / {reads.bearish}</div></div>
          <div className="border border-grid-line bg-surface-elevated/30 p-2"><div className="text-[9px] font-mono text-muted-foreground">ADDING / CUTTING</div><div className="text-[13px] font-mono font-bold text-foreground">{reads.added} / {reads.reduced}</div></div>
          <div className="border border-grid-line bg-surface-elevated/30 p-2"><div className="text-[9px] font-mono text-muted-foreground">NET SPEC %OI</div><div className={`text-[13px] font-mono font-bold ${reads.totalOi && rows.reduce((sum, row) => sum + row.managedMoney, 0) >= 0 ? 'text-positive' : 'text-negative'}`}>{formatPct(rows.reduce((sum, row) => sum + row.managedMoney, 0) / totalOi * 100)}</div></div>
          <div className="border border-grid-line bg-surface-elevated/30 p-2"><div className="text-[9px] font-mono text-muted-foreground">AVG %ILE</div><div className="text-[13px] font-mono font-bold text-accent">{Math.round(rows.reduce((sum, row) => sum + row.pctRank, 0) / Math.max(1, rows.length))}%</div></div>
        </div>
      </Panel>
      <Panel title="Asset Breadth Detail">
        <SortableFilterTable rows={breadthRows} columns={[
          { key: 'asset', label: 'ASSET', value: row => row.asset, className: () => 'text-accent font-bold' },
          { key: 'contracts', label: 'N', align: 'right', value: row => row.contracts, className: () => 'text-muted-foreground' },
          { key: 'oiShare', label: 'OI%', align: 'right', value: row => row.oiShare, render: row => formatAbsPct(row.oiShare), className: () => 'text-muted-foreground' },
          { key: 'breadth', label: 'BREADTH', align: 'right', value: row => row.breadth, className: row => row.breadth >= 0 ? 'text-positive font-bold' : 'text-negative font-bold' },
          { key: 'oneWeek', label: '1W', align: 'right', value: row => row.oneWeek, render: row => formatK(row.oneWeek), className: row => row.oneWeek >= 0 ? 'text-positive' : 'text-negative' },
        ]} rowKey={row => row.asset} minWidth={520} />
      </Panel>
      <Panel title="Crowding % Open Interest">
        <SortableFilterTable rows={topCrowding} columns={crowdColumns} rowKey={row => row.ticker} onRowClick={row => onSelect(row.ticker)} minWidth={620} />
      </Panel>
    </div>
  );
}

function SimpleReportTable({ title, rows, onSelect }: { title: string; rows: Record<string, string | number>[]; onSelect?: (ticker: string) => void }) {
  const headers = Object.keys(rows[0] ?? {});
  const columns: TableColumn<Record<string, string | number>>[] = headers.map(header => ({
    key: header,
    label: header,
    align: typeof rows[0]?.[header] === 'number' ? 'right' : 'left',
    value: row => row[header] ?? '',
    render: row => typeof row[header] === 'number' ? formatK(Number(row[header])) : row[header],
    className: () => header === 'ticker' || header === 'asset' ? 'text-accent font-bold' : 'text-foreground',
  }));
  return (
    <Panel title={title} action={<button onClick={() => downloadCSV(`${title.toLowerCase().replace(/[^a-z0-9]+/g, '-')}.csv`, rows)} className="text-[9px] font-mono text-muted-foreground hover:text-accent flex items-center gap-1"><Download className="h-3 w-3" /> CSV</button>}>
      <SortableFilterTable rows={rows} columns={columns} rowKey={(row, index) => `${row.ticker ?? row.asset ?? 'row'}-${index}`} onRowClick={onSelect ? row => row.ticker && onSelect(String(row.ticker)) : undefined} />
    </Panel>
  );
}

function LegacyReport({ rows, onSelect }: { rows: COTReportRow[]; onSelect: (ticker: string) => void }) { return <SimpleReportTable title="Legacy Futures — Commercial / Non-Commercial" rows={rows} onSelect={onSelect} />; }
function DisaggReport({ rows, onSelect }: { rows: COTReportRow[]; onSelect: (ticker: string) => void }) { return <SimpleReportTable title="Disaggregated Futures — Producer / Swap / Managed Money" rows={rows} onSelect={onSelect} />; }
function TFFReport({ rows, onSelect }: { rows: COTReportRow[]; onSelect: (ticker: string) => void }) { return <SimpleReportTable title="Traders in Financial Futures" rows={rows} onSelect={onSelect} />; }
function CITReport({ rows, onSelect }: { rows: COTReportRow[]; onSelect: (ticker: string) => void }) { return <SimpleReportTable title="Commodity Index Trader Exposure" rows={rows} onSelect={onSelect} />; }

function DealerReport({ rows }: { rows: ReturnType<typeof groupRows> }) {
  return <SimpleReportTable title="Dealer / Swap Desk Pressure" rows={rows.map(row => ({ asset: row.asset, producerNet: row.commercials, swapProxy: Math.round(row.commercials * -0.28), moneyManager: row.managedMoney, oiShare: formatPct(row.openInterest / Math.max(1, rows.reduce((sum, r) => sum + r.openInterest, 0)) * 100), read: row.commercials < 0 ? 'Producer hedging pressure' : 'Commercial accumulation' }))} />;
}

function FlowReport({ rows, onSelect }: { rows: COTLiveRow[]; onSelect: (ticker: string) => void }) {
  return <SimpleReportTable title="Weekly Flow Monitor — Velocity / Reversal Candidates" rows={rows.map(row => ({ ticker: row.ticker, market: row.market, asset: row.asset, oneWeek: row.week, fourWeek: row.fourWeek, velocity: Math.round(row.fourWeek / 4), accelPct: flowAcceleration(row), reversalScore: Math.abs(row.pctRank - 50) }))} onSelect={onSelect} />;
}

function SeasonalReport({ rows, onSelect }: { rows: COTLiveRow[]; onSelect: (ticker: string) => void }) {
  return <SimpleReportTable title="Seasonal Positioning — Current vs Seasonal Rank" rows={rows.map((row, index) => ({ ticker: row.ticker, market: row.market, currentRank: row.pctRank, seasonalAvg: 42 + (index * 7) % 39, deviation: row.pctRank - (42 + (index * 7) % 39), window: index % 2 ? 'Harvest / roll' : 'Front-month focus' }))} onSelect={onSelect} />;
}

function SpreadReport({ rows, onSelect }: { rows: ReturnType<typeof buildSpreadRows>; onSelect: (ticker: string) => void }) {
  const columns: TableColumn<(typeof rows)[number]>[] = [
    { key: 'pair', label: 'PAIR', value: row => row.pair, className: () => 'text-accent font-bold' },
    { key: 'signal', label: 'SIGNAL', value: row => row.signal },
    { key: 'z', label: 'Z', align: 'right', value: row => row.z, render: row => row.z.toFixed(1), className: row => row.z >= 2 ? 'text-positive font-bold' : 'text-muted-foreground font-bold' },
    { key: 'spec', label: 'SPEC GAP', align: 'right', value: row => Number(row.spec.replace(/[+K]/g, '')) || row.spec, render: row => row.spec, className: () => 'text-muted-foreground' },
  ];
  return (
    <div className="grid grid-cols-1 lg:grid-cols-2 gap-3">
      <Panel title="Cross-Market Positioning Spreads">
        <SortableFilterTable rows={rows} columns={columns} rowKey={row => row.pair} onRowClick={row => onSelect(row.left)} minWidth={560} />
      </Panel>
      <Panel title="Spread Notes">
        <div className="divide-y divide-grid-line">
          {rows.slice(0, 8).map(row => <button key={row.pair} onClick={() => onSelect(row.left)} className="w-full px-2 py-2 text-left hover:bg-surface-elevated"><div className="text-[10px] font-mono text-accent font-bold">{row.pair}</div><div className="text-[10px] font-mono text-muted-foreground">{row.note}</div></button>)}
        </div>
      </Panel>
    </div>
  );
}

function ReportLibrary({ onOpen }: { onOpen: (tab: COTTab) => void }) {
  return (
    <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-2">
      {terminalPages.map(page => <button key={page.code} onClick={() => onOpen(page.tab)} className="border border-border bg-surface-primary p-3 text-left hover:bg-surface-elevated hover:border-accent/50 transition-colors"><div className="flex items-center justify-between"><span className="text-accent font-mono font-bold text-[12px]">{page.code}</span><span className="text-[9px] font-mono text-muted-foreground">{page.source}</span></div><div className="text-[11px] font-mono font-bold text-foreground">{page.title}</div><div className="text-[9px] font-mono text-muted-foreground">{page.detail}</div></button>)}
    </div>
  );
}

function ConcentrationTable({ rows, onSelectAsset }: { rows: ReturnType<typeof groupRows>; onSelectAsset: (asset: string) => void }) {
  const totalOi = rows.reduce((sum, row) => sum + row.openInterest, 0);
  const columns: TableColumn<(typeof rows)[number]>[] = [
    { key: 'asset', label: 'GROUP', value: row => row.asset, className: () => 'text-accent font-bold' },
    { key: 'oiShare', label: 'OI SHARE', align: 'right', value: row => row.openInterest / Math.max(1, totalOi) * 100, render: row => formatPct(row.openInterest / Math.max(1, totalOi) * 100), className: () => 'text-muted-foreground' },
    { key: 'managedMoney', label: 'MM NET', align: 'right', value: row => row.managedMoney, render: row => formatK(row.managedMoney), className: row => row.managedMoney >= 0 ? 'text-positive font-bold' : 'text-negative font-bold' },
    { key: 'commercials', label: 'COMM NET', align: 'right', value: row => row.commercials, render: row => formatK(row.commercials), className: row => row.commercials >= 0 ? 'text-positive font-bold' : 'text-negative font-bold' },
    { key: 'read', label: 'READ', value: row => row.week >= 0 ? 'MM adding exposure' : 'MM cutting exposure', className: () => 'text-muted-foreground' },
  ];
  return (
    <Panel title="Asset Class Concentration">
      <SortableFilterTable rows={rows} columns={columns} rowKey={row => row.asset} onRowClick={row => onSelectAsset(row.asset)} minWidth={620} />
    </Panel>
  );
}

function ShiftTable({ rows, onSelect }: { rows: COTLiveRow[]; onSelect: (ticker: string) => void }) {
  const columns: TableColumn<COTLiveRow>[] = [
    { key: 'ticker', label: 'TICKER', value: row => row.ticker, className: () => 'text-accent font-bold' },
    { key: 'market', label: 'MARKET', value: row => row.market },
    { key: 'fourWeek', label: '4W CHG', align: 'right', value: row => row.fourWeek, render: row => formatK(row.fourWeek), className: row => row.fourWeek >= 0 ? 'text-positive font-bold' : 'text-negative font-bold' },
    { key: 'pctRank', label: '%ILE', align: 'right', value: row => row.pctRank, className: row => `${rankClass(row.pctRank)} font-bold` },
  ];
  return (
    <Panel title="Largest 4W Position Shifts">
      <SortableFilterTable rows={rows} columns={columns} rowKey={row => row.ticker} onRowClick={row => onSelect(row.ticker)} minWidth={520} />
    </Panel>
  );
}

function MarketsDetail({ rows, historyRows, selected, onSelect, selectedTicker, isPinned, toggleWatch }: { rows: COTLiveRow[]; historyRows: COTLiveRow[]; selected: COTLiveRow; onSelect: (ticker: string) => void; selectedTicker: string; isPinned: (row: COTLiveRow) => boolean; toggleWatch: (ticker: string) => void }) {
  const storedHistory = buildStoredContractHistory(historyRows, selected.ticker);
  const history = storedHistory.length ? storedHistory : buildContractHistory(selected);
  const peerRows = rows.filter(row => row.asset === selected.asset);
  return (
    <div className="space-y-3">
      <div className="grid grid-cols-1 xl:grid-cols-3 gap-3">
        <div className="border border-border bg-surface-primary p-3 xl:col-span-2">
          <div className="text-[10px] font-mono text-muted-foreground mb-1">{selected.ticker} Position History — Managed vs Commercial</div>
          <ExpandableResponsiveContainer width="100%" height={210}>
            <LineChart data={history}>
              <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
              <XAxis dataKey="week" tick={{ fontSize: 9, fontFamily: 'monospace', fill: 'hsl(var(--accent))' }} />
              <YAxis tick={{ fontSize: 9, fontFamily: 'monospace', fill: 'hsl(var(--accent))' }} tickFormatter={v => `${v}K`} />
              <Tooltip contentStyle={{ backgroundColor: 'hsl(var(--card))', border: '1px solid hsl(var(--accent))', fontFamily: 'monospace', fontSize: 10, color: 'hsl(var(--accent))' }} itemStyle={{ color: 'hsl(var(--accent))' }} labelStyle={{ color: 'hsl(var(--accent))', fontWeight: 'bold' }} formatter={(v: number) => [`${v}K`]} />
              <Line type="monotone" dataKey="managed" stroke="hsl(var(--accent))" strokeWidth={2} dot={false} />
              <Line type="monotone" dataKey="commercial" stroke="hsl(var(--negative))" strokeWidth={2} dot={false} />
            </LineChart>
          </ExpandableResponsiveContainer>
        </div>
        <div className="border border-border bg-surface-primary p-3">
          <div className="text-[10px] font-mono text-muted-foreground mb-1">Asset Peer Net Positions</div>
          <ExpandableResponsiveContainer width="100%" height={210}>
            <BarChart data={peerRows}>
              <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
              <XAxis dataKey="ticker" tick={{ fontSize: 9, fontFamily: 'monospace', fill: 'hsl(var(--accent))' }} />
              <YAxis tick={{ fontSize: 9, fontFamily: 'monospace', fill: 'hsl(var(--accent))' }} tickFormatter={v => `${v / 1000}K`} />
              <Tooltip contentStyle={{ backgroundColor: 'hsl(var(--card))', border: '1px solid hsl(var(--accent))', fontFamily: 'monospace', fontSize: 10, color: 'hsl(var(--accent))' }} itemStyle={{ color: 'hsl(var(--accent))' }} labelStyle={{ color: 'hsl(var(--accent))', fontWeight: 'bold' }} formatter={(v: number) => [formatK(v)]} />
              <Bar dataKey="managedMoney" fill="hsl(var(--accent))" />
            </BarChart>
          </ExpandableResponsiveContainer>
        </div>
      </div>

      <div className="grid grid-cols-1 xl:grid-cols-3 gap-3">
        <Panel title="Granular Selected Contract">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-2 p-2">
            {[
              ['Asset Class', selected.asset], ['Bias', selected.bias], ['Open Interest', formatOI(selected.openInterest)], ['Pct Rank', `${selected.pctRank}%`],
              ['Commercial % OI', `${Math.round((selected.commercials / selected.openInterest) * 100)}%`], ['Managed % OI', `${Math.round((selected.managedMoney / selected.openInterest) * 100)}%`],
              ['Non Report % OI', `${Math.round((selected.nonReportable / selected.openInterest) * 100)}%`], ['4W Velocity', formatK(selected.fourWeek / 4)],
              ['Flow Accel.', `${flowAcceleration(selected) > 0 ? '+' : ''}${flowAcceleration(selected)}%`], ['OI %ile', `${oiPctRank(selected, rows)}%`],
              ['Crowding', concentrationRead(selected)], ['Signal Read', squeezeRead(selected)],
              ['Time at Extreme', `${timeAtExtreme(historyRows, selected.ticker)}w`], ['Divergence', divergenceFlag(selected).label],
              ['OI Rank Peer', `#${peerRows.findIndex(row => row.ticker === selected.ticker) + 1}/${peerRows.length}`],
            ].map(([label, value]) => <div key={label} className="border border-grid-line bg-surface-elevated/30 p-2"><div className="text-[9px] font-mono text-muted-foreground">{label}</div><div className="text-[11px] font-mono font-bold text-foreground">{value}</div></div>)}
          </div>
        </Panel>
        <Panel title="Dealer / Producer Pressure">
          <table className="w-full text-[10px] font-mono"><thead><tr className="border-b border-grid-line"><th className="text-left px-2 py-1 text-muted-foreground">MKT</th><th className="text-right px-2 py-1 text-muted-foreground">PROD</th><th className="text-right px-2 py-1 text-muted-foreground">SWAP</th><th className="text-right px-2 py-1 text-muted-foreground">MM</th><th className="text-left px-2 py-1 text-muted-foreground">READ</th></tr></thead><tbody>{dealerPressure.map((row, i) => <tr key={row.market} className={`border-b border-grid-line ${i % 2 ? 'bg-surface-elevated/30' : ''}`}><td className="px-2 py-1 text-accent font-bold">{row.market}</td><td className={`px-2 py-1 text-right font-bold ${row.producer >= 0 ? 'text-positive' : 'text-negative'}`}>{row.producer}</td><td className="px-2 py-1 text-right text-muted-foreground">{row.swapDealer}</td><td className={`px-2 py-1 text-right font-bold ${row.moneyManager >= 0 ? 'text-positive' : 'text-negative'}`}>{row.moneyManager}</td><td className="px-2 py-1 text-muted-foreground">{row.read}</td></tr>)}</tbody></table>
        </Panel>
        <Panel title="Tenor Concentration">
          <table className="w-full text-[10px] font-mono"><thead><tr className="border-b border-grid-line"><th className="text-left px-2 py-1 text-muted-foreground">BUCKET</th><th className="text-right px-2 py-1 text-muted-foreground">ENERGY</th><th className="text-right px-2 py-1 text-muted-foreground">METALS</th><th className="text-right px-2 py-1 text-muted-foreground">GRAINS</th><th className="text-right px-2 py-1 text-muted-foreground">RATES</th></tr></thead><tbody>{termStructure.map((row, i) => <tr key={row.bucket} className={`border-b border-grid-line ${i % 2 ? 'bg-surface-elevated/30' : ''}`}><td className="px-2 py-1 text-accent font-bold">{row.bucket}</td><td className="px-2 py-1 text-right text-foreground">{row.energy}</td><td className="px-2 py-1 text-right text-foreground">{row.metals}</td><td className="px-2 py-1 text-right text-foreground">{row.grains}</td><td className="px-2 py-1 text-right text-foreground">{row.rates}</td></tr>)}</tbody></table>
        </Panel>
      </div>

      <MarketsTable rows={rows} onSelect={onSelect} selectedTicker={selectedTicker} allRows={rows} historyRows={historyRows} isPinned={isPinned} toggleWatch={toggleWatch} />
    </div>
  );
}

function MarketsTable({ rows, title = 'Futures Positioning', compact = false, onSelect, selectedTicker, allRows, historyRows, isPinned, toggleWatch }: { rows: COTLiveRow[]; title?: string; compact?: boolean; onSelect: (ticker: string) => void; selectedTicker: string; allRows: COTLiveRow[]; historyRows: COTLiveRow[]; isPinned: (row: COTLiveRow) => boolean; toggleWatch: (ticker: string) => void }) {
  const columns: TableColumn<COTLiveRow>[] = [
    { key: 'star', label: '★', value: row => isPinned(row) ? 1 : 0, render: row => <button onClick={(e) => { e.stopPropagation(); toggleWatch(row.ticker); }} className="hover:text-accent"><Star className={`h-3 w-3 ${isPinned(row) ? 'fill-accent text-accent' : 'text-muted-foreground'}`} /></button> },
    { key: 'asset', label: 'ASSET', value: row => row.asset, className: () => 'text-muted-foreground' },
    { key: 'ticker', label: 'TICKER', value: row => row.ticker, className: () => 'text-accent font-bold' },
    { key: 'market', label: 'MARKET', value: row => row.market },
    { key: 'openInterest', label: 'OPEN INT', align: 'right', value: row => row.openInterest, render: row => formatOI(row.openInterest), className: () => 'text-muted-foreground' },
    { key: 'oiPct', label: 'OI %ILE', align: 'right', value: row => oiPctRank(row, allRows), render: row => `${oiPctRank(row, allRows)}%`, className: row => `${rankClass(oiPctRank(row, allRows))}` },
    { key: 'mmPctOi', label: 'MM %OI', align: 'right', value: row => netPctOi(row, 'managedMoney'), render: row => formatPct(netPctOi(row, 'managedMoney')), className: row => netPctOi(row, 'managedMoney') >= 0 ? 'text-positive font-bold' : 'text-negative font-bold' },
    { key: 'commercials', label: 'COMMERCIAL', align: 'right', value: row => row.commercials, render: row => formatK(row.commercials), className: row => row.commercials >= 0 ? 'text-positive font-bold' : 'text-negative font-bold' },
    { key: 'managedMoney', label: 'MANAGED MONEY', align: 'right', value: row => row.managedMoney, render: row => formatK(row.managedMoney), className: row => row.managedMoney >= 0 ? 'text-positive font-bold' : 'text-negative font-bold' },
    { key: 'nonReportable', label: 'NON-REPORT', align: 'right', value: row => row.nonReportable, render: row => formatK(row.nonReportable), className: row => row.nonReportable >= 0 ? 'text-positive' : 'text-negative' },
    { key: 'week', label: '1W CHG', align: 'right', value: row => row.week, render: row => formatK(row.week), className: row => row.week >= 0 ? 'text-positive font-bold' : 'text-negative font-bold' },
    { key: 'fourWeek', label: '4W CHG', align: 'right', value: row => row.fourWeek, render: row => formatK(row.fourWeek), className: row => row.fourWeek >= 0 ? 'text-positive font-bold' : 'text-negative font-bold' },
    { key: 'accel', label: 'ACCEL', align: 'right', value: row => flowAcceleration(row), render: row => `${flowAcceleration(row) > 0 ? '+' : ''}${flowAcceleration(row)}%`, className: row => flowAcceleration(row) > 0 ? 'text-positive' : flowAcceleration(row) < 0 ? 'text-negative' : 'text-muted-foreground' },
    { key: 'pctRank', label: '%ILE', align: 'right', value: row => row.pctRank, className: row => `${rankClass(row.pctRank)} font-bold` },
    { key: 'tae', label: 'T@EXT', align: 'right', value: row => timeAtExtreme(historyRows, row.ticker), render: row => { const t = timeAtExtreme(historyRows, row.ticker); return t > 0 ? `${t}w` : '·'; }, className: row => timeAtExtreme(historyRows, row.ticker) >= 4 ? 'text-accent font-bold' : 'text-muted-foreground' },
    { key: 'div', label: 'DIV', value: row => divergenceFlag(row).label, className: row => divergenceFlag(row).state === 'div' ? 'text-accent font-bold' : 'text-muted-foreground' },
    { key: 'signal', label: 'SIGNAL', value: row => squeezeRead(row), className: () => 'text-muted-foreground' },
    { key: 'bias', label: 'BIAS', align: 'right', value: row => row.bias, className: () => 'text-muted-foreground' },
  ];
  return (
    <Panel title={title} action={<button onClick={() => downloadCSV(`${title.toLowerCase().replace(/[^a-z0-9]+/g, '-')}.csv`, rows.map(r => ({ ticker: r.ticker, market: r.market, asset: r.asset, openInterest: r.openInterest, managedMoney: r.managedMoney, commercials: r.commercials, week: r.week, fourWeek: r.fourWeek, pctRank: r.pctRank, bias: r.bias })))} className="text-[9px] font-mono text-muted-foreground hover:text-accent flex items-center gap-1"><Download className="h-3 w-3" /> CSV</button>}>
      <SortableFilterTable rows={rows} columns={columns} rowKey={row => row.ticker} onRowClick={row => onSelect(row.ticker)} minWidth={1180} pinPredicate={isPinned} />
      {compact && <div className="px-2 py-1 text-[9px] font-mono text-muted-foreground border-t border-grid-line">Showing contracts above 80th or below 20th percentile.</div>}
    </Panel>
  );
}

// === Watchlist tab ===
function WatchlistView({ rows, watchlist, onSelect, selectedTicker, toggleWatch, historyRows }: { rows: COTLiveRow[]; watchlist: string[]; onSelect: (ticker: string) => void; selectedTicker: string; toggleWatch: (ticker: string) => void; historyRows: COTLiveRow[] }) {
  const watchedRows = rows.filter(r => watchlist.includes(r.ticker));
  const unwatched = rows.filter(r => !watchlist.includes(r.ticker)).slice(0, 24);
  return (
    <div className="space-y-3">
      <Panel title={`Watchlist · ${watchedRows.length} contracts`}>
        {watchedRows.length === 0 ? (
          <div className="p-4 text-center text-[10px] font-mono text-muted-foreground">
            No starred contracts. Click ★ on any row, or press <span className="text-accent">F</span> with a ticker selected.
          </div>
        ) : (
          <SortableFilterTable
            rows={watchedRows}
            columns={[
              { key: 'star', label: '★', value: () => 1, render: row => <button onClick={(e) => { e.stopPropagation(); toggleWatch(row.ticker); }}><Star className="h-3 w-3 fill-accent text-accent" /></button> },
              { key: 'ticker', label: 'TICKER', value: r => r.ticker, className: () => 'text-accent font-bold' },
              { key: 'market', label: 'MARKET', value: r => r.market },
              { key: 'asset', label: 'ASSET', value: r => r.asset, className: () => 'text-muted-foreground' },
              { key: 'mm', label: 'MM NET', align: 'right', value: r => r.managedMoney, render: r => formatK(r.managedMoney), className: r => r.managedMoney >= 0 ? 'text-positive font-bold' : 'text-negative font-bold' },
              { key: 'mmPct', label: 'MM %OI', align: 'right', value: r => netPctOi(r, 'managedMoney'), render: r => formatPct(netPctOi(r, 'managedMoney')), className: r => netPctOi(r, 'managedMoney') >= 0 ? 'text-positive' : 'text-negative' },
              { key: 'week', label: '1W', align: 'right', value: r => r.week, render: r => formatK(r.week), className: r => r.week >= 0 ? 'text-positive' : 'text-negative' },
              { key: 'fourWeek', label: '4W', align: 'right', value: r => r.fourWeek, render: r => formatK(r.fourWeek), className: r => r.fourWeek >= 0 ? 'text-positive' : 'text-negative' },
              { key: 'pct', label: '%ILE', align: 'right', value: r => r.pctRank, className: r => `${rankClass(r.pctRank)} font-bold` },
              { key: 'tae', label: 'T@EXT', align: 'right', value: r => timeAtExtreme(historyRows, r.ticker), render: r => { const t = timeAtExtreme(historyRows, r.ticker); return t > 0 ? `${t}w` : '·'; } },
              { key: 'signal', label: 'SIGNAL', value: r => squeezeRead(r), className: () => 'text-muted-foreground' },
              { key: 'div', label: 'DIV', value: r => divergenceFlag(r).label, className: r => divergenceFlag(r).state === 'div' ? 'text-accent font-bold' : 'text-muted-foreground' },
            ]}
            rowKey={r => r.ticker}
            onRowClick={r => onSelect(r.ticker)}
            minWidth={1020}
          />
        )}
      </Panel>

      <Panel title="Add to Watchlist · Unstarred Markets">
        <div className="grid grid-cols-2 sm:grid-cols-4 lg:grid-cols-6 gap-1 p-2">
          {unwatched.map(r => (
            <button key={r.ticker} onClick={() => toggleWatch(r.ticker)} className="border border-grid-line bg-surface-elevated/30 p-1.5 text-left hover:border-accent/60 hover:bg-surface-elevated">
              <div className="flex items-center justify-between">
                <span className="text-accent font-mono font-bold text-[10px]">{r.ticker}</span>
                <Star className="h-3 w-3 text-muted-foreground" />
              </div>
              <div className="text-[9px] font-mono text-foreground truncate">{r.market}</div>
              <div className={`text-[9px] font-mono ${rankClass(r.pctRank)}`}>{r.pctRank}%</div>
            </button>
          ))}
        </div>
      </Panel>
    </div>
  );
}

// === Correlation Matrix tab ===
function CorrelationMatrix({ history, latestRows, onSelect }: { history: COTLiveRow[]; latestRows: COTLiveRow[]; onSelect: (ticker: string) => void }) {
  const [assetFilter, setAssetFilter] = useState<string>('All');
  const assets = ['All', ...Array.from(new Set(latestRows.map(r => r.asset)))];
  const universe = (assetFilter === 'All' ? latestRows : latestRows.filter(r => r.asset === assetFilter))
    .sort((a, b) => b.openInterest - a.openInterest)
    .slice(0, 14);
  const tickers = universe.map(r => r.ticker);

  const { series } = useMemo(() => buildSeries(history, tickers), [history, tickers.join(',')]);

  const matrix: { a: string; b: string; r: number }[] = [];
  for (let i = 0; i < tickers.length; i++) {
    for (let j = 0; j < tickers.length; j++) {
      matrix.push({ a: tickers[i], b: tickers[j], r: i === j ? 1 : correlation(series[tickers[i]] ?? [], series[tickers[j]] ?? []) });
    }
  }

  const pairs = matrix.filter(c => c.a < c.b).sort((x, y) => Math.abs(y.r) - Math.abs(x.r));
  const topPos = [...pairs].sort((a, b) => b.r - a.r).slice(0, 5);
  const topNeg = [...pairs].sort((a, b) => a.r - b.r).slice(0, 5);
  const hasData = history.length > 0 && Object.values(series).some(s => s.some(v => v !== 0));

  const cellColor = (r: number) => {
    const abs = Math.min(1, Math.abs(r));
    const hue = r >= 0 ? 'var(--positive)' : 'var(--negative)';
    return `hsl(${hue} / ${0.15 + abs * 0.65})`;
  };

  return (
    <div className="space-y-3">
      <div className="flex items-center gap-2 flex-wrap">
        <span className="text-[10px] font-mono text-muted-foreground">FILTER:</span>
        {assets.map(a => (
          <button key={a} onClick={() => setAssetFilter(a)} className={`px-2 py-1 border text-[9px] font-mono ${assetFilter === a ? 'border-accent text-accent bg-accent/10' : 'border-grid-line text-muted-foreground hover:border-accent/50'}`}>{a}</button>
        ))}
        <span className="ml-auto text-[9px] font-mono text-muted-foreground">{hasData ? `Rolling ~26w · MM net %OI` : 'Need stored COT history — feed will populate after first scheduled fetch.'}</span>
      </div>

      <Panel title="Positioning Correlation Matrix">
        <div className="overflow-x-auto">
          <table className="font-mono text-[9px]" style={{ minWidth: 32 * (tickers.length + 1) }}>
            <thead>
              <tr>
                <th className="px-1 py-0.5"></th>
                {tickers.map(t => <th key={t} className="px-1 py-0.5 text-accent font-bold cursor-pointer" onClick={() => onSelect(t)}>{t}</th>)}
              </tr>
            </thead>
            <tbody>
              {tickers.map(rowT => (
                <tr key={rowT}>
                  <td className="px-1 py-0.5 text-accent font-bold cursor-pointer" onClick={() => onSelect(rowT)}>{rowT}</td>
                  {tickers.map(colT => {
                    const cell = matrix.find(c => c.a === rowT && c.b === colT);
                    const r = cell?.r ?? 0;
                    return (
                      <td key={colT} title={`${rowT} ↔ ${colT}: ${r.toFixed(2)}`} className="px-1 py-0.5 text-center" style={{ backgroundColor: hasData ? cellColor(r) : 'transparent' }}>
                        {hasData ? r.toFixed(1).replace('0.', '.').replace('-.', '-.') : '·'}
                      </td>
                    );
                  })}
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </Panel>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-3">
        <Panel title="Most Correlated Pairs (26w)">
          <table className="w-full text-[10px] font-mono">
            <thead><tr className="border-b border-grid-line"><th className="text-left px-2 py-1 text-muted-foreground">PAIR</th><th className="text-right px-2 py-1 text-muted-foreground">ρ</th></tr></thead>
            <tbody>
              {topPos.map(p => <tr key={`${p.a}-${p.b}`} className="border-b border-grid-line hover:bg-surface-elevated cursor-pointer" onClick={() => onSelect(p.a)}><td className="px-2 py-1 text-accent font-bold">{p.a} ↔ {p.b}</td><td className="px-2 py-1 text-right text-positive font-bold">{p.r.toFixed(2)}</td></tr>)}
              {!topPos.length && <tr><td colSpan={2} className="px-2 py-3 text-center text-muted-foreground">Awaiting history</td></tr>}
            </tbody>
          </table>
        </Panel>
        <Panel title="Most Decorrelated Pairs (26w)">
          <table className="w-full text-[10px] font-mono">
            <thead><tr className="border-b border-grid-line"><th className="text-left px-2 py-1 text-muted-foreground">PAIR</th><th className="text-right px-2 py-1 text-muted-foreground">ρ</th></tr></thead>
            <tbody>
              {topNeg.map(p => <tr key={`${p.a}-${p.b}`} className="border-b border-grid-line hover:bg-surface-elevated cursor-pointer" onClick={() => onSelect(p.a)}><td className="px-2 py-1 text-accent font-bold">{p.a} ↔ {p.b}</td><td className="px-2 py-1 text-right text-negative font-bold">{p.r.toFixed(2)}</td></tr>)}
              {!topNeg.length && <tr><td colSpan={2} className="px-2 py-3 text-center text-muted-foreground">Awaiting history</td></tr>}
            </tbody>
          </table>
        </Panel>
      </div>
    </div>
  );
}
