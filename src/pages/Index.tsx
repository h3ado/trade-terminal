import { useState, useRef, useEffect, useMemo } from 'react';
import { MacroTab, macroTabs } from '@/components/TopNav';
import { FxTab, fxTabs } from '@/components/ForexNav';
import { PrivacyProvider, usePrivacy } from '@/contexts/PrivacyContext';
import { MacroCountryProvider } from '@/contexts/MacroCountryContext';
import { FxBaseProvider } from '@/contexts/FxBaseContext';
import { ChevronRight } from 'lucide-react';
import { ViewType, OptionsTab } from '@/types/trade';
import { TradeProvider, useTrades } from '@/contexts/TradeContext';
import AddTradeModal from '@/components/AddTradeModal';
import TerminalHeader from '@/components/TerminalHeader';
import TopNav from '@/components/TopNav';
import ForexNav from '@/components/ForexNav';
import ToolsPanel from '@/components/ToolsPanel';
import NavBreadcrumb from '@/components/NavBreadcrumb';
import TradingCmdBar from '@/components/TradingCmdBar';
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
import COTData from '@/components/macro/COTData';
import NewsView from '@/components/views/NewsView';
import NewsQuiz from '@/components/news/NewsQuiz';
import OptionsView from '@/components/views/OptionsView';
import CommandPalette from '@/components/CommandPalette';
import EconCalendarOverlay from '@/components/calendar/EconCalendarOverlay';
import BloombergFKeyBar from '@/components/terminal/BloombergFKeyBar';
import Launchpad from '@/components/launchpad/Launchpad';
import SecurityView from '@/components/views/SecurityView';
import WEIMonitor from '@/components/monitors/WEIMonitor';
import WBMonitor from '@/components/monitors/WBMonitor';
import GLCOMonitor from '@/components/monitors/GLCOMonitor';
import TOPMonitor from '@/components/monitors/TOPMonitor';
import { ECO, ECST, ECFC, ECWB, STAT, ECTR, COUN, OECD, EIU, FED, FOMC, FFIP, CENB, SRSK, WLST } from '@/components/macro/cmd';
import { useNavHistory } from '@/hooks/useNavHistory';
import type { NewsScope } from '@/hooks/useGdeltNews';

const VIEW_LABELS: Record<ViewType, string> = {
  dashboard: 'Dashboard',
  trades: 'All Trades',
  analytics: 'Analytics',
  calendar: 'Calendar',
  performance: 'Performance',
  journal: 'Journal',
  playbooks: 'Playbooks',
  mistakes: 'Mistakes',
  goals: 'Goals',
  macro: 'Macro',
  forex: 'Forex',
  cot: 'COT Data',
  globe: 'Markets Globe',
  news: 'News Terminal',
  quiz: 'Weekly Quiz',
  options: 'Options',
  launchpad: 'Launchpad',
  mwei: 'WEI Monitor',
  mwb: 'WB Monitor',
  mglco: 'GLCO Monitor',
  mtop: 'TOP Monitor',
  meco: 'ECO · Econ Calendar',
  mecst: 'ECST · Stats Matrix',
  mecfc: 'ECFC · Forecasts',
  mecwb: 'ECWB · Workbook',
  mstat: 'STAT · Directory',
  mectr: 'ECTR · Trade Flows',
  mcoun: 'COUN · Country',
  moecd: 'OECD Indicators',
  meiu: 'EIU · Country Risk',
  mfed: 'FED · Reserve Portal',
  mfomc: 'FOMC Archive',
  mffip: 'FFIP · Implied Probs',
  mcenb: 'CENB · Central Banks',
  msrsk: 'SRSK · Sovereign Risk',
  security: 'Security',
};

const TRADING_VIEWS: ViewType[] = ['dashboard', 'trades', 'analytics', 'calendar', 'performance', 'journal', 'playbooks', 'mistakes', 'goals'];

function buildTrail(view: ViewType, macroTab: MacroTab, fxTab: FxTab): { trail: string[]; label: string } {
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
  if (TRADING_VIEWS.includes(view)) {
    return { trail: ['TRADING', VIEW_LABELS[view]], label: `TRADING › ${VIEW_LABELS[view]}` };
  }
  return { trail: [VIEW_LABELS[view]], label: VIEW_LABELS[view] };
}

function IndexInner() {
  const [activeView, setActiveView] = useState<ViewType>('launchpad');
  const [toolsCollapsed, setToolsCollapsed] = useState(false);
  const [showAddModal, setShowAddModal] = useState(false);
  const [toolsWidth, setToolsWidth] = useState(320);
  const [macroTab, setMacroTab] = useState<MacroTab>('overview');
  const [fxTab, setFxTab] = useState<FxTab>('home');
  const [securityTicker, setSecurityTicker] = useState<string>('AAPL');
  const [newsArgs, setNewsArgs] = useState<{ scope: NewsScope; value: string; ai: boolean; topic?: string; pinOnly?: boolean; sort?: 'recent' | 'velocity'; source?: 'all' | 'x' | 'potus' | 'fed'; rightPane?: 'detail' | 'map' | 'heat' }>({ scope: 'global', value: '', ai: false });
  const [optionsArgs, setOptionsArgs] = useState<{ tab: OptionsTab; ticker: string; sub?: string; earnFilter?: import('@/hooks/useEarningsCalendar').EarnFilter }>({ tab: 'dash', ticker: 'SPY' });
  const [progressKey, setProgressKey] = useState(0);
  const resizingRef = useRef(false);
  const startXRef = useRef(0);
  const startWidthRef = useRef(0);

  const initial = useMemo(() => {
    const { trail, label } = buildTrail('launchpad', 'overview', 'home');
    return { view: 'launchpad' as ViewType, macroTab: 'overview' as MacroTab, fxTab: 'home' as FxTab, label, trail };
  }, []);
  const nav = useNavHistory(initial);

  // Push every nav change into history + trigger progress bar.
  useEffect(() => {
    const { trail, label } = buildTrail(activeView, macroTab, fxTab);
    nav.push({ view: activeView, macroTab, fxTab, label, trail });
    setProgressKey(k => k + 1);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [activeView, macroTab, fxTab]);

  // Sync back/forward changes from history -> local state.
  useEffect(() => {
    const cur = nav.current;
    if (!cur) return;
    if (cur.view !== activeView) setActiveView(cur.view);
    if (cur.macroTab && cur.macroTab !== macroTab) setMacroTab(cur.macroTab);
    if (cur.fxTab && cur.fxTab !== fxTab) setFxTab(cur.fxTab);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [nav.current]);

  useEffect(() => {
    const onMouseMove = (e: MouseEvent) => {
      if (!resizingRef.current) return;
      const delta = e.clientX - startXRef.current;
      const newWidth = Math.min(600, Math.max(200, startWidthRef.current + delta));
      setToolsWidth(newWidth);
    };
    const onMouseUp = () => {
      if (resizingRef.current) {
        resizingRef.current = false;
        document.body.style.cursor = '';
        document.body.style.userSelect = '';
      }
    };
    window.addEventListener('mousemove', onMouseMove);
    window.addEventListener('mouseup', onMouseUp);
    return () => {
      window.removeEventListener('mousemove', onMouseMove);
      window.removeEventListener('mouseup', onMouseUp);
    };
  }, []);

  const { activeAccountId } = usePrivacy();
  const { setAccountFilter } = useTrades();

  useEffect(() => {
    setAccountFilter(activeAccountId);
  }, [activeAccountId, setAccountFilter]);

  // Nav back/forward via CLI codes
  useEffect(() => {
    const onBack = () => nav.back();
    const onFwd = () => nav.forward();
    window.addEventListener('lovable:nav-back', onBack);
    window.addEventListener('lovable:nav-forward', onFwd);
    return () => {
      window.removeEventListener('lovable:nav-back', onBack);
      window.removeEventListener('lovable:nav-forward', onFwd);
    };
  }, [nav]);

  // CLI dispatches news args via a custom event so the CLI itself stays generic.
  useEffect(() => {
    const handler = (e: Event) => {
      const d = (e as CustomEvent).detail as { scope?: NewsScope; value?: string; ai?: boolean; topic?: string; pinOnly?: boolean; sort?: 'recent' | 'velocity'; source?: 'all' | 'x' | 'potus' | 'fed'; rightPane?: 'detail' | 'map' | 'heat' } | undefined;
      setNewsArgs({
        scope: d?.scope ?? 'global',
        value: d?.value ?? '',
        ai: !!d?.ai,
        topic: d?.topic,
        pinOnly: !!d?.pinOnly,
        sort: d?.sort ?? 'recent',
        source: d?.source ?? 'all',
        rightPane: d?.rightPane ?? 'detail',
      });
    };
    window.addEventListener('lovable:news-args', handler);
    return () => window.removeEventListener('lovable:news-args', handler);
  }, []);

  // CLI dispatches options args via a custom event.
  useEffect(() => {
    const handler = (e: Event) => {
      const d = (e as CustomEvent).detail as { tab?: OptionsTab; ticker?: string; sub?: string; earnFilter?: import('@/hooks/useEarningsCalendar').EarnFilter } | undefined;
      setOptionsArgs({
        tab: d?.tab ?? 'dash',
        ticker: (d?.ticker ?? 'SPY').toUpperCase(),
        sub: d?.sub,
        earnFilter: d?.earnFilter,
      });
    };
    window.addEventListener('lovable:options-args', handler);
    return () => window.removeEventListener('lovable:options-args', handler);
  }, []);

  // CLI dispatches security ticker via a custom event.
  useEffect(() => {
    const handler = (e: Event) => {
      const d = (e as CustomEvent).detail as { ticker?: string } | undefined;
      if (d?.ticker) setSecurityTicker(d.ticker.toUpperCase());
    };
    window.addEventListener('lovable:security-args', handler);
    return () => window.removeEventListener('lovable:security-args', handler);
  }, []);

  const renderView = () => {
    switch (activeView) {
      case 'dashboard': return <DashboardView />;
      case 'trades': return <TradesView />;
      case 'analytics': return <AnalyticsView />;
      case 'calendar': return <CalendarView />;
      case 'performance': return <PerformanceView />;
      case 'journal': return <JournalView />;
      case 'playbooks': return <PlaybooksView />;
      case 'mistakes': return <MistakesView />;
      case 'goals': return <GoalsView />;
      case 'macro': return <MacroView activeTab={macroTab} />;
      case 'forex': return <ForexView activeTab={fxTab} onTabChange={setFxTab} />;
      case 'cot': return <COTData />;
      case 'globe': return <GlobeView />;
      case 'news': return <NewsView initialScope={newsArgs.scope} initialValue={newsArgs.value} initialAiBrief={newsArgs.ai} initialTopic={newsArgs.topic} initialPinOnly={newsArgs.pinOnly} initialSort={newsArgs.sort} initialSource={newsArgs.source} initialRightPane={newsArgs.rightPane} />;
      case 'quiz': return <NewsQuiz />;
      case 'options': return <OptionsView initialTab={optionsArgs.tab} initialTicker={optionsArgs.ticker} initialSub={optionsArgs.sub} initialEarnFilter={optionsArgs.earnFilter} />;
      case 'launchpad': return <Launchpad />;
      case 'mwei': return <WEIMonitor />;
      case 'mwb': return <WBMonitor />;
      case 'mglco': return <GLCOMonitor />;
      case 'mtop': return <TOPMonitor />;
      case 'meco': return <ECO />;
      case 'mecst': return <ECST />;
      case 'mecfc': return <ECFC />;
      case 'mecwb': return <ECWB />;
      case 'mstat': return <STAT />;
      case 'mectr': return <ECTR />;
      case 'mcoun': return <COUN />;
      case 'moecd': return <OECD />;
      case 'meiu': return <EIU />;
      case 'mfed': return <FED />;
      case 'mfomc': return <FOMC />;
      case 'mffip': return <FFIP />;
      case 'mcenb': return <CENB />;
      case 'msrsk': return <SRSK />;
      case 'mwlst': return <WLST />;
      case 'security': return <SecurityView ticker={securityTicker} />;
      default: return <Launchpad />;
    }
  };

  const isTradingView = TRADING_VIEWS.includes(activeView);
  const viewKey = `${activeView}:${macroTab}:${fxTab}`;

  return (
    <div className="h-screen bg-background flex flex-col overflow-hidden">
      <TerminalHeader onAddTrade={() => setShowAddModal(true)} onNavigate={setActiveView} onMacroTab={setMacroTab} onFxTab={(t) => { setFxTab(t); setActiveView('forex'); }} />
      <NavBreadcrumb
        trail={nav.current?.trail ?? ['Dashboard']}
        canBack={nav.canBack}
        canForward={nav.canForward}
        onBack={nav.back}
        onForward={nav.forward}
      />
      <div className="flex-1 flex overflow-hidden">
        {!toolsCollapsed && (
          <div
            className="h-full flex-shrink-0 relative"
            style={{ width: toolsWidth, minWidth: toolsWidth, maxWidth: toolsWidth }}
          >
            <div className="h-full overflow-hidden">
              <ToolsPanel collapsed={toolsCollapsed} onToggle={() => setToolsCollapsed(!toolsCollapsed)} />
            </div>
            <div
              onMouseDown={(e) => {
                e.preventDefault();
                resizingRef.current = true;
                startXRef.current = e.clientX;
                startWidthRef.current = toolsWidth;
                document.body.style.cursor = 'col-resize';
                document.body.style.userSelect = 'none';
              }}
              className="absolute top-0 right-0 w-1 h-full cursor-col-resize z-20 group hover:bg-accent/40 transition-colors"
            >
              <div className="absolute top-1/2 -translate-y-1/2 right-0 w-0.5 h-12 bg-border group-hover:bg-accent transition-colors" />
            </div>
          </div>
        )}
        <div className="flex-1 flex flex-col min-w-0 overflow-hidden">
          {(() => {
            const fullBleed = ['globe','cot','news','forex','journal','quiz','launchpad','options','security','mwei','mwb','mglco','mtop','meco','mecst','mecfc','mecwb','mstat','mectr','mcoun','moecd','meiu','mfed','mfomc','mffip','mcenb','msrsk','mwlst'];
            const isFullBleed = fullBleed.includes(activeView);
            const mainPad = ['news','options'].includes(activeView) || isFullBleed ? 'p-0' : 'p-4';
            return (
              <>
                {!isFullBleed && (
                  <TopNav activeView={activeView} onViewChange={setActiveView} activeMacroTab={macroTab} onMacroTabChange={setMacroTab} />
                )}
                {activeView === 'forex' && (
                  <ForexNav activeTab={fxTab} onTabChange={setFxTab} />
                )}
                <main className={`flex-1 min-h-0 relative ${mainPad} ${isFullBleed ? 'overflow-hidden flex flex-col' : 'overflow-y-auto'}`}>
                  <div
                    key={progressKey}
                    className="absolute top-0 left-0 right-0 h-[2px] bg-accent z-40 pointer-events-none animate-nav-progress"
                  />
                  {toolsCollapsed && (
                    <button onClick={() => setToolsCollapsed(false)}
                      className="fixed left-0 top-1/2 -translate-y-1/2 z-30 bg-surface-elevated border border-border border-l-0 px-1 py-3 hover:bg-accent hover:text-accent-foreground transition-colors rounded-r">
                      <ChevronRight className="w-4 h-4" />
                    </button>
                  )}
                  <div key={viewKey} className={`animate-fade-in ${isFullBleed ? 'flex-1 min-h-0 flex flex-col' : ''}`}>
                    {renderView()}
                  </div>
                </main>
              </>
            );
          })()}
        </div>
      </div>
      <BloombergFKeyBar onLaunchpad={() => setActiveView('launchpad')} />
      {showAddModal && <AddTradeModal onClose={() => setShowAddModal(false)} />}
      <EconCalendarOverlay />
      <CommandPalette />
    </div>
  );
}

export default function Index() {
  return (
    <TradeProvider>
      <PrivacyProvider>
        <MacroCountryProvider>
          <FxBaseProvider>
            <IndexInner />
          </FxBaseProvider>
        </MacroCountryProvider>
      </PrivacyProvider>
    </TradeProvider>
  );
}
