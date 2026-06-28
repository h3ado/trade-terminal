// STAT — Statistics Directory.
// Sub-tabs: BROWSE / SEARCH / RECENT / FAVORITES.
import { useEffect, useMemo, useState } from 'react';
import CmdShell from './_shell/CmdShell';
import CmdTabs from './_shell/CmdTabs';

type Tab = 'browse' | 'search' | 'recent' | 'favorites';
const TABS: ReadonlyArray<{ id: Tab; label: string }> = [
  { id: 'browse',    label: 'BROWSE' },
  { id: 'search',    label: 'SEARCH' },
  { id: 'recent',    label: 'RECENT' },
  { id: 'favorites', label: 'FAVORITES' },
];

type Owner = 'macro' | 'markets' | 'fx' | 'options' | 'news' | 'trading';

interface Entry {
  code: string;
  title: string;
  description: string;
  active: boolean;
  vintage: string;
  freq: 'live' | 'daily' | 'weekly' | 'monthly' | 'quarterly';
  source: string;
  owner: Owner;
}

interface Section { code: string; title: string; entries: Entry[]; }

const OWNER_COLOR: Record<Owner, string> = {
  macro:   'text-[hsl(210,80%,65%)] border-[hsl(210,80%,50%)]',
  markets: 'text-positive border-positive',
  fx:      'text-[hsl(185,70%,55%)] border-[hsl(185,70%,55%)]',
  options: 'text-[hsl(280,65%,70%)] border-[hsl(280,65%,60%)]',
  news:    'text-bb-amber border-bb-amber',
  trading: 'text-muted-foreground border-border',
};
const OWNER_BORDER: Record<Owner, string> = {
  macro:   'border-l-[hsl(210,80%,50%)]',
  markets: 'border-l-positive',
  fx:      'border-l-[hsl(185,70%,55%)]',
  options: 'border-l-[hsl(280,65%,60%)]',
  news:    'border-l-bb-amber',
  trading: 'border-l-border',
};

const DIRECTORY: Section[] = [
  { code: 'A', title: 'Economic Indicators & Research', entries: [
    { code: 'ECO',  title: 'Release Calendar',        description: 'Time / importance / surprise tracker',            vintage: 'live',   freq: 'live',     source: 'FRED + Cal',   owner: 'macro',   active: true },
    { code: 'ECST', title: 'Statistics Matrix',       description: 'Cross-country macro KPI grid',                   vintage: '2026Q2', freq: 'monthly',  source: 'WB + FRED',    owner: 'macro',   active: true },
    { code: 'ECFC', title: 'Forecast Matrix',         description: 'Mean / range / σ 2024–2030',                     vintage: 'Jun-26', freq: 'monthly',  source: 'WEO survey',   owner: 'macro',   active: true },
    { code: 'ECWB', title: 'Workbook',                description: 'Pivot table builder + CSV export',               vintage: 'live',   freq: 'live',     source: 'WB + FRED',    owner: 'macro',   active: true },
    { code: 'ECTR', title: 'Bilateral Trade Flows',   description: 'Top-20 partners with sparklines',                vintage: '2025FY', freq: 'monthly',  source: 'ITC TradeMap', owner: 'macro',   active: true },
    { code: 'OECD', title: 'OECD Indicators',         description: 'CLI / BCI / CCI cycle classifier',               vintage: 'Apr-26', freq: 'monthly',  source: 'OECD MEI',     owner: 'macro',   active: true },
    { code: 'EIU',  title: 'Country Risk Card',       description: 'Multi-dim risk scores per country',              vintage: 'Q2-26',  freq: 'quarterly',source: 'EIU reports',  owner: 'macro',   active: true },
    { code: 'COUN', title: 'Country Dashboard',       description: 'Macro · CB · equity · calendar',                 vintage: 'live',   freq: 'live',     source: 'WB + FRED',    owner: 'macro',   active: true },
    { code: 'REAL', title: 'Real Rates & Breakevens', description: 'TIPS curve, breakeven spreads, real yields',     vintage: 'live',   freq: 'live',     source: 'FRED',         owner: 'macro',   active: true },
    { code: 'BOP',  title: 'Balance of Payments',     description: 'Current + capital + financial account',          vintage: 'Q2-26',  freq: 'quarterly',source: 'IMF BOP',      owner: 'macro',   active: true },
    { code: 'NRGY', title: 'Energy Balance',          description: 'Production / consumption / inventories',         vintage: 'live',   freq: 'weekly',   source: 'EIA',          owner: 'macro',   active: true },
    { code: 'MFG',  title: 'Manufacturing & Orders',  description: 'PMI, ISM, durable goods, factory orders',        vintage: 'live',   freq: 'monthly',  source: 'ISM + FRED',   owner: 'macro',   active: true },
    { code: 'CONS', title: 'Consumer Health',         description: 'Confidence, retail, credit, savings',            vintage: 'live',   freq: 'monthly',  source: 'FRED',         owner: 'macro',   active: true },
    { code: 'FCI',  title: 'Financial Conditions',    description: 'Composite FCI, sub-indices, regime',             vintage: 'live',   freq: 'daily',    source: 'FRED + calc',  owner: 'macro',   active: true },
    { code: 'STAT', title: 'Statistics Directory',    description: 'This screen — index of all CMDs',                              vintage: 'live',   freq: 'live',      source: 'internal', owner: 'macro',   active: true },
    { code: 'MACR', title: 'Macro Terminal (legacy)', description: 'Legacy tabbed macro workspace',                                vintage: 'live',   freq: 'live',      source: 'internal', owner: 'macro',   active: true },
    { code: 'CPI',  title: 'Consumer Price Index',    description: 'Headline & core inflation trends, components, release history', vintage: 'live',   freq: 'monthly',   source: 'FRED',     owner: 'macro',   active: true },
    { code: 'PPI',  title: 'Producer Price Index',    description: 'PPI pipeline: crude → intermediate → finished goods',          vintage: 'live',   freq: 'monthly',   source: 'FRED',     owner: 'macro',   active: true },
    { code: 'UNEMP',title: 'Unemployment & Labor',    description: 'U-3/U-6, participation rate, initial & continuing claims',     vintage: 'live',   freq: 'monthly',   source: 'FRED',     owner: 'macro',   active: true },
    { code: 'NFP',  title: 'Non-Farm Payrolls',       description: 'Monthly jobs, wages, 3m avg, beat/miss tracker',               vintage: 'live',   freq: 'monthly',   source: 'FRED',     owner: 'macro',   active: true },
    { code: 'GDP',  title: 'GDP Growth',              description: 'Real GDP QoQ ann., components, global comparison',             vintage: 'live',   freq: 'quarterly', source: 'FRED',     owner: 'macro',   active: true },
    { code: 'PCE',  title: "PCE Deflator (Fed Target)",description: 'Core PCE YoY vs 2% target, PCE vs CPI comparison',           vintage: 'live',   freq: 'monthly',   source: 'FRED',     owner: 'macro',   active: true },
    { code: 'JOLTS',title: 'JOLTS — Job Openings',    description: 'Openings, hires, quits, openings/unemployed ratio',            vintage: 'live',   freq: 'monthly',   source: 'FRED',     owner: 'macro',   active: true },
    { code: 'ISM',  title: 'ISM PMI Monitor',         description: 'Manufacturing PMI, 50-threshold regime, industrial proxy',     vintage: 'live',   freq: 'monthly',   source: 'FRED',     owner: 'macro',   active: true },
  ]},
  { code: 'B', title: 'Central Banks & Sovereign', entries: [
    { code: 'CENB', title: 'Central Bank Portal',     description: 'Global policy rates + meetings calendar',        vintage: 'live',   freq: 'live',     source: 'CB feeds',     owner: 'macro',   active: true },
    { code: 'FED',  title: 'Federal Reserve',         description: 'Speeches, balance sheet, voter roster',          vintage: 'live',   freq: 'live',     source: 'Fed',          owner: 'macro',   active: true },
    { code: 'FOMC', title: 'FOMC Archive',            description: 'Meetings, dissent votes, rate-path chart',       vintage: 'live',   freq: 'live',     source: 'Fed',          owner: 'macro',   active: true },
    { code: 'FFIP', title: 'Fed-Funds Implied Probs', description: 'WIRP-style probability matrix',                  vintage: 'live',   freq: 'live',     source: 'CME FedWatch', owner: 'macro',   active: true },
    { code: 'SRSK', title: 'Sovereign Risk',          description: 'CDS, PD, ratings, debt, deficit',                vintage: 'live',   freq: 'daily',    source: 'Markit + WB',  owner: 'macro',   active: true },
  ]},
  { code: 'C', title: 'Equities & Cross-Asset', entries: [
    { code: 'WEI',  title: 'World Equity Indices',    description: 'Live closes, %Δ, market-cap weighted',           vintage: 'live',   freq: 'live',     source: 'TwelveData',   owner: 'markets', active: true },
    { code: 'WEIF', title: 'World Equity Futures',    description: 'Equity index futures, basis, fair-value',        vintage: 'live',   freq: 'live',     source: 'TwelveData',   owner: 'markets', active: true },
    { code: 'WPE',  title: 'World P/E & Valuations',  description: 'Trailing / fwd P/E, CAPE, ERP',                  vintage: 'live',   freq: 'daily',    source: 'TwelveData',   owner: 'markets', active: true },
    { code: 'WB',   title: 'World Bond Yields',       description: 'Sovereign curves, 2s10s, real yields',           vintage: 'live',   freq: 'live',     source: 'FRED',         owner: 'markets', active: true },
    { code: 'GLCO', title: 'Global Commodities',      description: 'Energy / metals / softs / grains',               vintage: 'live',   freq: 'live',     source: 'TwelveData',   owner: 'markets', active: true },
    { code: 'TOP',  title: 'Top Movers',              description: 'Cross-asset leaders & laggards',                 vintage: 'live',   freq: 'live',     source: 'TwelveData',   owner: 'markets', active: true },
    { code: 'COT',  title: 'Commitments of Traders',  description: 'Net positioning by trader class',                vintage: 'weekly', freq: 'weekly',   source: 'CFTC',         owner: 'markets', active: true },
    { code: 'GLOB', title: 'Markets Globe (3D)',      description: '3D interactive global market view',              vintage: 'live',   freq: 'live',     source: 'composite',    owner: 'markets', active: true },
    { code: 'MAP',  title: 'Markets Map (2D)',        description: 'Interactive 2D map with data layers',            vintage: 'live',   freq: 'live',     source: 'composite',    owner: 'markets', active: true },
    { code: 'LAUN', title: 'Launchpad (Multi-Panel)', description: 'Multi-panel workspace launcher',                 vintage: 'live',   freq: 'live',     source: 'internal',     owner: 'markets', active: true },
  ]},
  { code: 'D', title: 'Foreign Exchange', entries: [
    { code: 'FX',   title: 'Forex Terminal',          description: 'FX home dashboard',                              vintage: 'live',   freq: 'live',     source: 'TwelveData',   owner: 'fx',      active: true },
    { code: 'WFX',  title: 'World FX Monitor',        description: 'All majors + EM crosses',                        vintage: 'live',   freq: 'live',     source: 'TwelveData',   owner: 'fx',      active: true },
    { code: 'FXC',  title: 'FX Cross-Rate Matrix',    description: 'Pairwise spot grid',                             vintage: 'live',   freq: 'live',     source: 'TwelveData',   owner: 'fx',      active: true },
    { code: 'FXIP', title: 'FX Information Portal',   description: 'Pair fundamentals + news',                       vintage: 'live',   freq: 'live',     source: 'composite',    owner: 'fx',      active: true },
    { code: 'FXFA', title: 'FX Fundamentals',         description: 'Side-by-side macro compare for a pair',          vintage: 'live',   freq: 'daily',    source: 'composite',    owner: 'fx',      active: false },
    { code: 'FXTF', title: 'FX Technical Chart',      description: 'Full-screen pro chart with indicators',          vintage: 'live',   freq: 'live',     source: 'TwelveData',   owner: 'fx',      active: false },
    { code: 'FXFC', title: 'FX Consensus Forecasts',  description: 'Bank median forecasts 1m–24m',                   vintage: 'Q2-26',  freq: 'monthly',  source: 'survey',       owner: 'fx',      active: true },
    { code: 'FXCA', title: 'FX Calculator',           description: 'Conversion + cross calc',                        vintage: 'live',   freq: 'live',     source: 'TwelveData',   owner: 'fx',      active: true },
    { code: 'TKC',  title: 'Regional Currency View',  description: 'Per-region currency overview',                   vintage: 'live',   freq: 'live',     source: 'TwelveData',   owner: 'fx',      active: true },
    { code: 'WCR',  title: 'World Spot Rates',        description: 'All-currency spot board',                        vintage: 'live',   freq: 'live',     source: 'TwelveData',   owner: 'fx',      active: true },
    { code: 'WCRS', title: 'FX Performance Ranking',  description: 'YTD / 1m / 1w returns vs USD',                   vintage: 'live',   freq: 'daily',    source: 'TwelveData',   owner: 'fx',      active: true },
    { code: 'FRD',  title: 'FX Forwards & Carry',     description: 'Forward points + carry table',                   vintage: 'live',   freq: 'daily',    source: 'composite',    owner: 'fx',      active: true },
    { code: 'WIRA', title: 'International Reserves',  description: 'CB FX reserves by country',                      vintage: 'Q2-26',  freq: 'quarterly',source: 'IMF COFER',    owner: 'fx',      active: true },
    { code: 'FXV',  title: 'FX Vol Surface',          description: 'Implied vol by tenor / delta',                   vintage: 'live',   freq: 'live',     source: 'composite',    owner: 'fx',      active: true },
    { code: 'FXOP', title: 'FX Options Quick-Look',   description: 'Risk reversals, butterflies',                    vintage: 'live',   freq: 'live',     source: 'composite',    owner: 'fx',      active: true },
    { code: 'CARRY',title: 'FX Carry Trade Monitor',  description: 'Carry returns, Sharpe, drawdown',                vintage: 'live',   freq: 'daily',    source: 'composite',    owner: 'fx',      active: true },
    { code: 'FXH',  title: 'FX History',              description: 'Historical spot / vol archive',                  vintage: 'live',   freq: 'daily',    source: 'TwelveData',   owner: 'fx',      active: true },
    { code: 'FXNW', title: 'FX News & Wires',         description: 'Curated FX headlines',                           vintage: 'live',   freq: 'live',     source: 'GDELT',        owner: 'fx',      active: true },
  ]},
  { code: 'E', title: 'Options & Derivatives', entries: [
    { code: 'DASH', title: 'Options Dashboard',       description: 'Top-level options workspace',                    vintage: 'live',   freq: 'live',     source: 'composite',    owner: 'options', active: true },
    { code: 'OMON', title: 'Options Matrix / Chain',  description: 'Full option chain with greeks',                  vintage: 'live',   freq: 'live',     source: 'composite',    owner: 'options', active: true },
    { code: 'GAMMA',title: 'Gamma Levels',            description: 'Strike gamma map + walls',                       vintage: 'live',   freq: 'live',     source: 'composite',    owner: 'options', active: true },
    { code: 'GEX',  title: 'GEX Profile',             description: 'Net dealer gamma exposure',                      vintage: 'live',   freq: 'live',     source: 'composite',    owner: 'options', active: true },
    { code: 'OVME', title: 'Vol Surface / Smile',     description: 'IV surface + term structure + smile',            vintage: 'live',   freq: 'live',     source: 'composite',    owner: 'options', active: true },
    { code: 'MAXP', title: 'Max Pain',                description: 'OI-weighted max-pain strike',                    vintage: 'live',   freq: 'live',     source: 'composite',    owner: 'options', active: true },
    { code: 'PAY',  title: 'Payoff Lab',              description: 'Multi-leg payoff builder',                       vintage: 'live',   freq: 'live',     source: 'internal',     owner: 'options', active: true },
    { code: 'FLOW', title: 'Dealer Flow Feed',        description: 'Block trades, sweeps, unusual OI',               vintage: 'live',   freq: 'live',     source: 'composite',    owner: 'options', active: true },
    { code: 'SENT', title: 'Options Sentiment',       description: 'P/C ratio, skew, sentiment score',               vintage: 'live',   freq: 'live',     source: 'composite',    owner: 'options', active: true },
    { code: 'GRK',  title: 'Greeks Book',             description: 'Portfolio greeks + scenario analysis',           vintage: 'live',   freq: 'live',     source: 'internal',     owner: 'options', active: true },
    { code: 'QSCR', title: 'Q-Scores',                description: 'Quant scoring across tickers',                   vintage: 'live',   freq: 'daily',    source: 'internal',     owner: 'options', active: true },
    { code: 'SCAN', title: 'Options Screener',        description: 'Filter chains by criteria',                      vintage: 'live',   freq: 'live',     source: 'composite',    owner: 'options', active: true },
    { code: 'SPRD', title: 'Spread Builder',          description: 'Build verticals / condors / flies',              vintage: 'live',   freq: 'live',     source: 'internal',     owner: 'options', active: true },
    { code: 'SKEW', title: 'IV Term Structure',       description: 'Term-structure of implied vol',                  vintage: 'live',   freq: 'live',     source: 'composite',    owner: 'options', active: true },
    { code: 'SMILE',title: 'Volatility Smile',        description: 'Strike-vs-IV smile',                             vintage: 'live',   freq: 'live',     source: 'composite',    owner: 'options', active: true },
    { code: 'CHARM',title: 'Charm Heatmap',           description: 'Charm by strike / expiry',                       vintage: 'live',   freq: 'live',     source: 'composite',    owner: 'options', active: true },
    { code: 'VANNA',title: 'Vanna Heatmap',           description: 'Vanna by strike / expiry',                       vintage: 'live',   freq: 'live',     source: 'composite',    owner: 'options', active: true },
    { code: 'SCEN', title: 'Greeks Scenario',         description: 'Scenario P&L on portfolio',                      vintage: 'live',   freq: 'live',     source: 'internal',     owner: 'options', active: true },
    { code: 'EARN', title: 'Earnings Hub',            description: 'IV crush, playbook, calendar',                   vintage: 'live',   freq: 'daily',    source: 'composite',    owner: 'options', active: true },
  ]},
  { code: 'F', title: 'News, Research & Calendar', entries: [
    { code: 'NEWS', title: 'News Terminal',           description: 'Bloomberg-style 2-col tape · GDELT + AI',        vintage: 'live',   freq: 'live',     source: 'GDELT + AI',   owner: 'news',    active: true },
    { code: 'ECAL', title: 'Econ + Earnings Calendar',description: 'Econ + earnings + CB events calendar',           vintage: 'live',   freq: 'live',     source: 'composite',    owner: 'news',    active: true },
    { code: 'QUIZ', title: 'Macro Quiz',              description: 'AI-generated market comprehension checks',       vintage: 'live',   freq: 'live',     source: 'AI',           owner: 'news',    active: true },
    { code: 'SQUAWK',title:'Audio Squawk',            description: 'T1 headlines audio feed',                        vintage: 'live',   freq: 'live',     source: 'curated',      owner: 'news',    active: true },
    { code: 'TV',   title: 'TV Clips Drawer',         description: 'CNBC / Bloomberg clips',                         vintage: 'live',   freq: 'live',     source: 'curated',      owner: 'news',    active: true },
  ]},
  { code: 'G', title: 'Trading & Workflow', entries: [
    { code: 'JRNL', title: 'Journal Dashboard',       description: 'Trading journal overview',                       vintage: 'live',   freq: 'live',     source: 'internal',     owner: 'trading', active: true },
    { code: 'TRDS', title: 'Trades',                  description: 'Trade blotter',                                  vintage: 'live',   freq: 'live',     source: 'internal',     owner: 'trading', active: true },
    { code: 'PERF', title: 'Performance',             description: 'P&L, Sharpe, hit-rate analytics',               vintage: 'live',   freq: 'live',     source: 'internal',     owner: 'trading', active: true },
    { code: 'ANLY', title: 'Analytics',               description: 'Deeper trade analytics',                         vintage: 'live',   freq: 'live',     source: 'internal',     owner: 'trading', active: true },
    { code: 'CAL',  title: 'Calendar',                description: 'Personal trade calendar',                        vintage: 'live',   freq: 'live',     source: 'internal',     owner: 'trading', active: true },
    { code: 'GOAL', title: 'Goals',                   description: 'Trading goals + progress tracking',              vintage: 'live',   freq: 'live',     source: 'internal',     owner: 'trading', active: true },
    { code: 'PLAY', title: 'Playbooks',               description: 'Saved trade setups',                             vintage: 'live',   freq: 'live',     source: 'internal',     owner: 'trading', active: true },
    { code: 'MIST', title: 'Mistakes',                description: 'Mistake log + review',                           vintage: 'live',   freq: 'live',     source: 'internal',     owner: 'trading', active: true },
    { code: 'NOTE', title: 'Journal Notes',           description: 'Freeform notes',                                 vintage: 'live',   freq: 'live',     source: 'internal',     owner: 'trading', active: true },
    { code: 'NEW',  title: 'New Trade',               description: 'Open the new-trade modal',                       vintage: 'live',   freq: 'live',     source: 'internal',     owner: 'trading', active: true },
    { code: 'PRIV', title: 'Toggle Privacy Mode',     description: 'Redact balances & P&L',                          vintage: 'live',   freq: 'live',     source: 'internal',     owner: 'trading', active: true },
    { code: 'ACCT', title: 'Account Manager',         description: 'Manage trading accounts',                        vintage: 'live',   freq: 'live',     source: 'internal',     owner: 'trading', active: true },
    { code: 'BACK', title: 'Navigate Back',           description: 'Go back in history',                             vintage: 'live',   freq: 'live',     source: 'internal',     owner: 'trading', active: true },
    { code: 'FWD',  title: 'Navigate Forward',        description: 'Go forward in history',                          vintage: 'live',   freq: 'live',     source: 'internal',     owner: 'trading', active: true },
    { code: 'HELP', title: 'Help',                    description: 'CLI help / keyboard shortcuts',                   vintage: 'live',   freq: 'live',     source: 'internal',     owner: 'trading', active: true },
  ]},
];

const FAV_KEY = 'stat:favs';
const RECENT_KEY = 'stat:recent';
const MAX_RECENT = 20;

function loadSet(k: string): string[] { try { const raw = localStorage.getItem(k); return raw ? JSON.parse(raw) : []; } catch { return []; } }

const ALL = DIRECTORY.flatMap(s => s.entries);

export default function STAT() {
  const [tab, setTab] = useState<Tab>('browse');
  const [section, setSection] = useState('ALL');
  const [q, setQ] = useState('');
  const [favs, setFavs] = useState<string[]>(() => loadSet(FAV_KEY));
  const [recent, setRecent] = useState<string[]>(() => loadSet(RECENT_KEY));

  useEffect(() => { localStorage.setItem(FAV_KEY, JSON.stringify(favs)); }, [favs]);
  useEffect(() => { localStorage.setItem(RECENT_KEY, JSON.stringify(recent)); }, [recent]);

  const toggleFav = (code: string) => setFavs(f => f.includes(code) ? f.filter(c => c !== code) : [code, ...f]);
  const open = (code: string) => {
    setRecent(r => [code, ...r.filter(c => c !== code)].slice(0, MAX_RECENT));
    try { window.dispatchEvent(new CustomEvent('lovable:cli-execute', { detail: { code } })); } catch {}
  };

  const browseSections = useMemo(() => DIRECTORY.filter(s => section === 'ALL' || s.code === section), [section]);

  const searchResults = useMemo(() => {
    const needle = q.trim().toUpperCase();
    if (!needle) return [];
    return ALL.filter(e =>
      e.code.includes(needle) ||
      e.title.toUpperCase().includes(needle) ||
      e.description.toUpperCase().includes(needle) ||
      e.source.toUpperCase().includes(needle) ||
      e.owner.toUpperCase().includes(needle)
    );
  }, [q]);

  const recentEntries = recent.map(c => ALL.find(e => e.code === c)).filter(Boolean) as Entry[];
  const favEntries = favs.map(c => ALL.find(e => e.code === c)).filter(Boolean) as Entry[];

  const liveCount = ALL.filter(e => e.active).length;
  const buildCount = ALL.length - liveCount;

  return (
    <CmdShell
      code="STAT" title="Statistics Directory"
      headerRight={
        <div className="flex items-center gap-1">
          {tab === 'browse' && (
            <>
              <button onClick={() => setSection('ALL')} className={`px-2 py-0.5 text-[10px] font-mono uppercase border ${section === 'ALL' ? 'bg-accent text-background border-accent' : 'border-border text-muted-foreground hover:border-accent/60'}`}>ALL</button>
              {DIRECTORY.map(s => (
                <button key={s.code} onClick={() => setSection(s.code)} className={`px-2 py-0.5 text-[10px] font-mono uppercase border ${section === s.code ? 'bg-accent text-background border-accent' : 'border-border text-muted-foreground hover:border-accent/60'}`}>{s.code}</button>
              ))}
            </>
          )}
          {tab === 'search' && (
            <input autoFocus value={q} onChange={e => setQ(e.target.value)} placeholder="SEARCH CODE / TITLE / SOURCE / TEAM…" className="px-2 py-0.5 text-[10px] font-mono bg-background border border-border text-foreground w-80 focus:outline-none focus:border-accent" />
          )}
        </div>
      }
      tabs={<CmdTabs tabs={TABS} active={tab} onChange={setTab} />}
      kpis={
        <div className="grid grid-cols-2 md:grid-cols-5 gap-[1px] bg-border">
          <Kpi label="DATASETS" value={ALL.length} tone="text-foreground" />
          <Kpi label="LIVE" value={liveCount} tone="text-positive" />
          <Kpi label="BUILD" value={buildCount} tone="text-accent" />
          <Kpi label="FAVORITES" value={favs.length} tone="text-bb-amber" />
          <Kpi label="SECTIONS" value={DIRECTORY.length} tone="text-foreground" />
        </div>
      }
      footerLeft={<>STAT &lt;GO&gt; · click row or code to open · ★ to favorite</>}
      footerRight={<>{liveCount} live · {buildCount} in development · {DIRECTORY.length} sections</>}
    >
      <div className="h-full overflow-auto">
        {tab === 'browse' && (
          <div className="p-1 space-y-2">
            {browseSections.map(s => <SectionBlock key={s.code} section={s} favs={favs} onOpen={open} onFav={toggleFav} />)}
          </div>
        )}
        {tab === 'search' && (
          <div className="p-1">
            {searchResults.length === 0
              ? <EmptyState msg={q ? `No matches for "${q}"` : 'Type to search across all datasets and teams'} />
              : <FlatBlock entries={searchResults} favs={favs} onOpen={open} onFav={toggleFav} />
            }
          </div>
        )}
        {tab === 'recent' && (
          <div className="p-1">
            {recentEntries.length === 0
              ? <EmptyState msg="No recent items yet — open any dataset and it will appear here." />
              : <FlatBlock entries={recentEntries} favs={favs} onOpen={open} onFav={toggleFav} />
            }
          </div>
        )}
        {tab === 'favorites' && (
          <div className="p-1">
            {favEntries.length === 0
              ? <EmptyState msg="No favorites yet — click ★ on any row to pin it here." />
              : <FlatBlock entries={favEntries} favs={favs} onOpen={open} onFav={toggleFav} />
            }
          </div>
        )}
      </div>
    </CmdShell>
  );
}

function EmptyState({ msg }: { msg: string }) {
  return <div className="text-center text-[10px] font-mono text-muted-foreground py-12">{msg}</div>;
}

function Kpi({ label, value, tone }: { label: string; value: number; tone: string }) {
  return (
    <div className="bg-surface-deep px-3 py-1.5">
      <div className="text-[8px] font-mono uppercase text-muted-foreground tracking-wider">{label}</div>
      <div className={`text-lg font-mono font-bold tabular-nums leading-tight ${tone}`}>{value}</div>
    </div>
  );
}

function SectionBlock({ section, favs, onOpen, onFav }: { section: Section; favs: string[]; onOpen: (c: string) => void; onFav: (c: string) => void }) {
  const liveN = section.entries.filter(e => e.active).length;
  // Determine dominant owner for border color
  const ownerCounts: Partial<Record<Owner, number>> = {};
  for (const e of section.entries) ownerCounts[e.owner] = (ownerCounts[e.owner] ?? 0) + 1;
  const dominant = (Object.entries(ownerCounts).sort((a, b) => (b[1] ?? 0) - (a[1] ?? 0))[0]?.[0] ?? 'macro') as Owner;

  return (
    <div className={`border border-border bg-surface-deep border-l-2 ${OWNER_BORDER[dominant]}`}>
      <div className="px-3 py-1.5 border-b border-border bg-background/60 flex items-center gap-3">
        <span className="text-[10px] font-mono font-bold uppercase tracking-wider text-accent">
          {section.code}
        </span>
        <span className="text-[10px] font-mono font-bold uppercase tracking-wider text-foreground">
          {section.title}
        </span>
        <span className="ml-auto flex items-center gap-2 text-[9px] font-mono">
          <span className="text-positive">{liveN} live</span>
          {liveN < section.entries.length && (
            <span className="text-accent">{section.entries.length - liveN} build</span>
          )}
          <span className="text-muted-foreground/50">·</span>
          <span className="text-muted-foreground">{section.entries.length} total</span>
        </span>
      </div>
      <EntryRows entries={section.entries} favs={favs} onOpen={onOpen} onFav={onFav} />
    </div>
  );
}

function FlatBlock({ entries, favs, onOpen, onFav }: { entries: Entry[]; favs: string[]; onOpen: (c: string) => void; onFav: (c: string) => void }) {
  return (
    <div className="border border-border bg-surface-deep">
      <EntryRows entries={entries} favs={favs} onOpen={onOpen} onFav={onFav} showOwner />
    </div>
  );
}

const FREQ_STYLE: Record<Entry['freq'], string> = {
  live:      'text-positive',
  daily:     'text-foreground/70',
  weekly:    'text-foreground/60',
  monthly:   'text-muted-foreground',
  quarterly: 'text-muted-foreground/70',
};

function EntryRows({ entries, favs, onOpen, onFav, showOwner }: {
  entries: Entry[];
  favs: string[];
  onOpen: (c: string) => void;
  onFav: (c: string) => void;
  showOwner?: boolean;
}) {
  return (
    <table className="w-full border-collapse">
      <thead>
        <tr className="border-b border-border/60">
          <th className="w-6" />
          <th className="px-2 py-1 text-left text-[8px] font-mono font-bold uppercase tracking-wider text-muted-foreground/70 w-28">Code</th>
          <th className="px-2 py-1 text-left text-[8px] font-mono font-bold uppercase tracking-wider text-muted-foreground/70 w-48">Title</th>
          <th className="px-2 py-1 text-left text-[8px] font-mono font-bold uppercase tracking-wider text-muted-foreground/70">Description</th>
          {showOwner && <th className="px-2 py-1 text-left text-[8px] font-mono font-bold uppercase tracking-wider text-muted-foreground/70 w-20">Team</th>}
          <th className="px-2 py-1 text-left text-[8px] font-mono font-bold uppercase tracking-wider text-muted-foreground/70 w-28">Source</th>
          <th className="px-2 py-1 text-center text-[8px] font-mono font-bold uppercase tracking-wider text-muted-foreground/70 w-20">Freq</th>
          <th className="px-2 py-1 text-center text-[8px] font-mono font-bold uppercase tracking-wider text-muted-foreground/70 w-16">Status</th>
        </tr>
      </thead>
      <tbody>
        {entries.map((e, i) => {
          const isFav = favs.includes(e.code);
          return (
            <tr
              key={e.code}
              className={`border-b border-border/30 hover:bg-accent/10 transition-colors group ${i % 2 === 1 ? 'bg-surface-deep/40' : ''} ${!e.active ? 'opacity-60' : ''}`}
            >
              {/* Star */}
              <td className="pl-1.5 pr-0 py-1">
                <button
                  onClick={() => onFav(e.code)}
                  className={`text-[13px] leading-none ${isFav ? 'text-bb-amber' : 'text-muted-foreground/30 group-hover:text-muted-foreground/60'}`}
                  title={isFav ? 'Unfavorite' : 'Favorite'}
                >★</button>
              </td>
              {/* Code */}
              <td className="px-2 py-1">
                <button
                  onClick={() => onOpen(e.code)}
                  className="text-[11px] font-mono font-bold text-bb-amber hover:underline underline-offset-2 tracking-wide"
                  title={`Open ${e.code}`}
                >
                  {e.code} <span className="text-[9px] font-normal text-muted-foreground/50">&lt;GO&gt;</span>
                </button>
              </td>
              {/* Title */}
              <td onClick={() => onOpen(e.code)} className="px-2 py-1 text-[10px] font-mono font-semibold text-foreground cursor-pointer">
                {e.title}
              </td>
              {/* Description */}
              <td className="px-2 py-1 text-[10px] font-mono text-muted-foreground leading-tight">
                {e.description}
              </td>
              {/* Owner (search/recent/fav tabs) */}
              {showOwner && (
                <td className="px-2 py-1">
                  <span className={`text-[8px] font-mono font-bold uppercase border px-1 py-0.5 ${OWNER_COLOR[e.owner]}`}>
                    {e.owner}
                  </span>
                </td>
              )}
              {/* Source */}
              <td className="px-2 py-1 text-[9px] font-mono text-muted-foreground/70 uppercase">
                {e.source}
              </td>
              {/* Freq */}
              <td className="px-2 py-1 text-center">
                <span className={`text-[9px] font-mono uppercase ${FREQ_STYLE[e.freq]}`}>
                  {e.freq === 'live' ? '● LIVE' : e.freq}
                </span>
              </td>
              {/* Status */}
              <td className="px-2 py-1 text-center">
                {e.active
                  ? <span className="text-[9px] font-mono font-bold text-positive">● LIVE</span>
                  : <span className="text-[9px] font-mono font-bold text-accent">BUILD</span>
                }
              </td>
            </tr>
          );
        })}
      </tbody>
    </table>
  );
}
