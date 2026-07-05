import type { ReactNode } from 'react';
import type { ViewType, OptionsTab } from '@/types/trade';
import { fxTabs, type FxTab } from '@/config/fx';
import type { NewsScope } from '@/hooks/useGdeltNews';
import type { EarnFilter } from '@/hooks/useEarningsCalendar';
import DashboardView from '@/components/views/DashboardView';
import TradesView from '@/components/views/TradesView';
import AnalyticsView from '@/components/views/AnalyticsView';
import CalendarView from '@/components/views/CalendarView';
import PerformanceView from '@/components/views/PerformanceView';
import JournalView from '@/components/views/JournalView';
import PlaybooksView from '@/components/views/PlaybooksView';
import MistakesView from '@/components/views/MistakesView';
import GoalsView from '@/components/views/GoalsView';
import MacroView from '@/components/views/MacroView';
import ForexView from '@/components/views/ForexView';
import GlobeView from '@/components/views/GlobeView';
import NewsView from '@/components/views/NewsView';
import OptionsView from '@/components/views/OptionsView';
import SecurityView from '@/components/views/SecurityView';
import COTData from '@/components/macro/COTData';
import NewsQuiz from '@/components/news/NewsQuiz';
import Launchpad from '@/components/launchpad/Launchpad';
import WEIMonitor from '@/components/monitors/WEIMonitor';
import WBMonitor from '@/components/monitors/WBMonitor';
import GLCOMonitor from '@/components/monitors/GLCOMonitor';
import TOPMonitor from '@/components/monitors/TOPMonitor';
import { ECO, ECST, ECFC, ECWB, STAT, ECTR, COUN, OECD, EIU, FED, FOMC, FFIP, CENB, SRSK, WLST } from '@/components/macro/cmd';

export type MacroTab = 'overview' | 'markets' | 'yields' | 'fx' | 'commodities' | 'central' | 'calendar' | 'sectors' | 'fedwatch' | 'volatility' | 'credit' | 'pmi' | 'labor' | 'housing' | 'money' | 'gdp' | 'inflation' | 'tradeflow' | 'sovereign' | 'globalrates' | 'supplychain' | 'sentiment' | 'fiscal' | 'debt' | 'crypto' | 'realrates' | 'bop' | 'energy' | 'mfg' | 'consumer' | 'fci' | 'wei' | 'weif' | 'wpe';

export const macroTabs: { id: MacroTab; label: string; code: string }[] = [
  { id: 'overview', label: 'Econ Data', code: 'ECST' },
  { id: 'markets', label: 'World Mkts', code: 'WMKT' },
  { id: 'wei', label: 'Global Equities', code: 'WEI' },
  { id: 'weif', label: 'Index Futures', code: 'WEIF' },
  { id: 'wpe', label: 'P/E & Valuation', code: 'WPE' },
  { id: 'yields', label: 'Yield Curve', code: 'YCRV' },
  { id: 'fx', label: 'FX', code: 'FXCR' },
  { id: 'commodities', label: 'Commod.', code: 'CMDM' },
  { id: 'crypto', label: 'Crypto', code: 'CRYP' },
  { id: 'central', label: 'Central Banks', code: 'CBRT' },
  { id: 'fedwatch', label: 'Rate Watch', code: 'WIRP' },
  { id: 'calendar', label: 'Econ Cal', code: 'ECO' },
  { id: 'sectors', label: 'Sectors', code: 'SECT' },
  { id: 'volatility', label: 'Volatility', code: 'VOLM' },
  { id: 'credit', label: 'Credit', code: 'CRDM' },
  { id: 'pmi', label: 'Global PMI', code: 'GPMI' },
  { id: 'labor', label: 'Labor', code: 'LABR' },
  { id: 'housing', label: 'Housing', code: 'HOUS' },
  { id: 'money', label: 'Money Mkts', code: 'MMKT' },
  { id: 'gdp', label: 'Global GDP', code: 'WGDP' },
  { id: 'inflation', label: 'Inflation', code: 'INFL' },
  { id: 'tradeflow', label: 'Trade Flow', code: 'TRFL' },
  { id: 'sovereign', label: 'Sov Risk', code: 'SOVR' },
  { id: 'globalrates', label: 'Global Rates', code: 'RATD' },
  { id: 'supplychain', label: 'Supply Chain', code: 'SPLC' },
  { id: 'sentiment', label: 'Sentiment', code: 'SENT' },
  { id: 'fiscal', label: 'Fiscal', code: 'FISC' },
  { id: 'debt', label: 'Debt/Issuance', code: 'DDIS' },
  { id: 'realrates', label: 'Real Rates', code: 'REAL' },
  { id: 'bop', label: 'Balance of Pay', code: 'BOP' },
  { id: 'energy', label: 'Energy Bal', code: 'NRGY' },
  { id: 'mfg', label: 'Mfg & Orders', code: 'MFG' },
  { id: 'consumer', label: 'Consumer', code: 'CONS' },
  { id: 'fci', label: 'Fin Conditions', code: 'FCI' },
];

type Args = {
  macroTab: MacroTab;
  fxTab: FxTab;
  setFxTab: (tab: FxTab) => void;
  newsArgs: { scope: NewsScope; value: string; ai: boolean; topic?: string; pinOnly?: boolean; sort?: 'recent' | 'velocity'; source?: 'all' | 'x' | 'potus' | 'fed'; rightPane?: 'detail' | 'map' | 'heat' };
  optionsArgs: { tab: OptionsTab; ticker: string; sub?: string; earnFilter?: EarnFilter };
  securityTicker: string;
};

export type ViewConfig = {
  id: ViewType;
  label: string;
  code: string;
  group: 'trading' | 'macro' | 'market' | 'news' | 'system';
  fullBleed?: boolean;
  aliases?: string[];
  render: (args: Args) => ReactNode;
};

export const viewRegistry = [
  { id: 'dashboard', label: 'Dashboard', code: 'DASH', group: 'trading', render: () => <DashboardView /> },
  { id: 'trades', label: 'All Trades', code: 'TRD', group: 'trading', render: () => <TradesView /> },
  { id: 'analytics', label: 'Analytics', code: 'ANLT', group: 'trading', render: () => <AnalyticsView /> },
  { id: 'calendar', label: 'Calendar', code: 'CAL', group: 'trading', render: () => <CalendarView /> },
  { id: 'performance', label: 'Performance', code: 'PERF', group: 'trading', render: () => <PerformanceView /> },
  { id: 'journal', label: 'Journal', code: 'JRNL', group: 'trading', fullBleed: true, render: () => <JournalView /> },
  { id: 'playbooks', label: 'Playbooks', code: 'PLAY', group: 'trading', render: () => <PlaybooksView /> },
  { id: 'mistakes', label: 'Mistakes', code: 'MSTK', group: 'trading', render: () => <MistakesView /> },
  { id: 'goals', label: 'Goals', code: 'GOAL', group: 'trading', render: () => <GoalsView /> },
  { id: 'macro', label: 'Macro', code: 'MACR', group: 'macro', render: ({ macroTab }) => <MacroView activeTab={macroTab} /> },
  { id: 'forex', label: 'Forex', code: 'FX', group: 'market', fullBleed: true, render: ({ fxTab, setFxTab }) => <ForexView activeTab={fxTab} onTabChange={setFxTab} /> },
  { id: 'cot', label: 'COT Data', code: 'COT', group: 'market', fullBleed: true, render: () => <COTData /> },
  { id: 'globe', label: 'Markets Globe', code: 'GLOB', group: 'market', fullBleed: true, render: () => <GlobeView /> },
  { id: 'news', label: 'News Terminal', code: 'NEWS', group: 'news', fullBleed: true, render: ({ newsArgs }) => <NewsView initialScope={newsArgs.scope} initialValue={newsArgs.value} initialAiBrief={newsArgs.ai} initialTopic={newsArgs.topic} initialPinOnly={newsArgs.pinOnly} initialSort={newsArgs.sort} initialSource={newsArgs.source} initialRightPane={newsArgs.rightPane} /> },
  { id: 'quiz', label: 'Weekly Quiz', code: 'QUIZ', group: 'news', fullBleed: true, render: () => <NewsQuiz /> },
  { id: 'options', label: 'Options', code: 'OPT', group: 'market', fullBleed: true, render: ({ optionsArgs }) => <OptionsView initialTab={optionsArgs.tab} initialTicker={optionsArgs.ticker} initialSub={optionsArgs.sub} initialEarnFilter={optionsArgs.earnFilter} /> },
  { id: 'launchpad', label: 'Launchpad', code: 'LAUN', group: 'system', fullBleed: true, aliases: ['LP'], render: () => <Launchpad /> },
  { id: 'mwei', label: 'WEI Monitor', code: 'WEI', group: 'macro', fullBleed: true, render: () => <WEIMonitor /> },
  { id: 'mwb', label: 'WB Monitor', code: 'WB', group: 'macro', fullBleed: true, render: () => <WBMonitor /> },
  { id: 'mglco', label: 'GLCO Monitor', code: 'GLCO', group: 'macro', fullBleed: true, render: () => <GLCOMonitor /> },
  { id: 'mtop', label: 'TOP Monitor', code: 'TOP', group: 'news', fullBleed: true, render: () => <TOPMonitor /> },
  { id: 'meco', label: 'ECO · Econ Calendar', code: 'ECO', group: 'macro', fullBleed: true, render: () => <ECO /> },
  { id: 'mecst', label: 'ECST · Stats Matrix', code: 'ECST', group: 'macro', fullBleed: true, render: () => <ECST /> },
  { id: 'mecfc', label: 'ECFC · Forecasts', code: 'ECFC', group: 'macro', fullBleed: true, render: () => <ECFC /> },
  { id: 'mecwb', label: 'ECWB · Workbook', code: 'ECWB', group: 'macro', fullBleed: true, render: () => <ECWB /> },
  { id: 'mstat', label: 'STAT · Directory', code: 'STAT', group: 'macro', fullBleed: true, render: () => <STAT /> },
  { id: 'mectr', label: 'ECTR · Trade Flows', code: 'ECTR', group: 'macro', fullBleed: true, render: () => <ECTR /> },
  { id: 'mcoun', label: 'COUN · Country', code: 'COUN', group: 'macro', fullBleed: true, render: () => <COUN /> },
  { id: 'moecd', label: 'OECD Indicators', code: 'OECD', group: 'macro', fullBleed: true, render: () => <OECD /> },
  { id: 'meiu', label: 'EIU · Country Risk', code: 'EIU', group: 'macro', fullBleed: true, render: () => <EIU /> },
  { id: 'mfed', label: 'FED · Reserve Portal', code: 'FED', group: 'macro', fullBleed: true, render: () => <FED /> },
  { id: 'mfomc', label: 'FOMC Archive', code: 'FOMC', group: 'macro', fullBleed: true, render: () => <FOMC /> },
  { id: 'mffip', label: 'FFIP · Implied Probs', code: 'FFIP', group: 'macro', fullBleed: true, render: () => <FFIP /> },
  { id: 'mcenb', label: 'CENB · Central Banks', code: 'CENB', group: 'macro', fullBleed: true, render: () => <CENB /> },
  { id: 'msrsk', label: 'SRSK · Sovereign Risk', code: 'SRSK', group: 'macro', fullBleed: true, render: () => <SRSK /> },
  { id: 'mwlst', label: 'WLST · Watchlist', code: 'WLST', group: 'macro', fullBleed: true, render: () => <WLST /> },
  { id: 'security', label: 'Security', code: 'DES', group: 'market', fullBleed: true, render: ({ securityTicker }) => <SecurityView ticker={securityTicker} /> },
] satisfies ViewConfig[];

export const viewById = Object.fromEntries(viewRegistry.map(v => [v.id, v])) as Record<ViewType, ViewConfig>;
export const tradingViews = viewRegistry.filter(v => v.group === 'trading').map(v => v.id) as ViewType[];

export function buildTrail(view: ViewType, macroTab: MacroTab, fxTab: FxTab) {
  if (view === 'macro') {
    const t = macroTabs.find(m => m.id === macroTab);
    const seg = t ? `${t.label} (${t.code})` : 'Overview';
    return { trail: ['MACRO', seg], label: `MACRO › ${seg}` };
  }
  if (view === 'forex') {
    const t = fxTabs.find(f => f.id === fxTab);
    const seg = t ? `${t.label} (${t.code})` : 'Overview';
    return { trail: ['FOREX', seg], label: `FOREX › ${seg}` };
  }
  const cfg = viewById[view];
  return cfg.group === 'trading'
    ? { trail: ['TRADING', cfg.label], label: `TRADING › ${cfg.label}` }
    : { trail: [cfg.label], label: cfg.label };
}
