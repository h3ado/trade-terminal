import { useState, useRef, useEffect, useMemo, useCallback } from 'react';
import { type MacroTab, buildTrail, macroTabs, viewById } from '@/config/views';
import { fxTabs, type FxTab } from '@/config/fx';
import { optionsModules } from '@/config/options';
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
import CommandPalette from '@/components/CommandPalette';
import EconCalendarOverlay from '@/components/calendar/EconCalendarOverlay';
import BloombergFKeyBar from '@/components/terminal/BloombergFKeyBar';
import { useNavHistory } from '@/hooks/useNavHistory';
import type { NewsScope } from '@/hooks/useGdeltNews';

const isView = (v: string | null): v is ViewType => !!v && v in viewById;
const isMacroTab = (v: string | null): v is MacroTab => !!v && macroTabs.some(t => t.id === v);
const isFxTab = (v: string | null): v is FxTab => !!v && fxTabs.some(t => t.id === v);
const isOptionsTab = (v: string | null): v is OptionsTab => !!v && optionsModules.some(t => t.id === v);

function IndexInner() {
  const urlState = useMemo(() => {
    const qs = new URLSearchParams(window.location.search);
    const view = isView(qs.get('view')) ? qs.get('view') as ViewType : 'launchpad';
    return {
      view,
      macroTab: isMacroTab(qs.get('macro')) ? qs.get('macro') as MacroTab : 'overview',
      fxTab: isFxTab(qs.get('fx')) ? qs.get('fx') as FxTab : 'home',
      securityTicker: (qs.get('ticker') || 'AAPL').toUpperCase(),
      optionsArgs: {
        tab: isOptionsTab(qs.get('tab')) ? qs.get('tab') as OptionsTab : 'dash',
        ticker: (qs.get('ticker') || 'SPY').toUpperCase(),
        sub: qs.get('sub') || undefined,
      },
    };
  }, []);

  const [activeView, setActiveView] = useState<ViewType>(urlState.view);
  const [toolsCollapsed, setToolsCollapsed] = useState(false);
  const [showAddModal, setShowAddModal] = useState(false);
  const [toolsWidth, setToolsWidth] = useState(320);
  const [macroTab, setMacroTab] = useState<MacroTab>(urlState.macroTab);
  const [fxTab, setFxTab] = useState<FxTab>(urlState.fxTab);
  const [securityTicker, setSecurityTicker] = useState<string>(urlState.securityTicker);
  const [newsArgs, setNewsArgs] = useState<{ scope: NewsScope; value: string; ai: boolean; topic?: string; pinOnly?: boolean; sort?: 'recent' | 'velocity'; source?: 'all' | 'x' | 'potus' | 'fed'; rightPane?: 'detail' | 'map' | 'heat' }>({ scope: 'global', value: '', ai: false });
  const [optionsArgs, setOptionsArgs] = useState<{ tab: OptionsTab; ticker: string; sub?: string; earnFilter?: import('@/hooks/useEarningsCalendar').EarnFilter }>(urlState.optionsArgs);
  const [progressKey, setProgressKey] = useState(0);
  const resizingRef = useRef(false);
  const startXRef = useRef(0);
  const startWidthRef = useRef(0);

  const initial = useMemo(() => {
    const { trail, label } = buildTrail(urlState.view, urlState.macroTab, urlState.fxTab);
    return { view: urlState.view, macroTab: urlState.macroTab, fxTab: urlState.fxTab, label, trail };
  }, [urlState]);
  const nav = useNavHistory(initial);

  const navigate = useCallback((view: ViewType) => {
    setActiveView(view);
  }, []);

  // Push every nav change into history + trigger progress bar.
  useEffect(() => {
    const { trail, label } = buildTrail(activeView, macroTab, fxTab);
    nav.push({ view: activeView, macroTab, fxTab, label, trail });
    setProgressKey(k => k + 1);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [activeView, macroTab, fxTab]);

  useEffect(() => {
    const qs = new URLSearchParams();
    qs.set('view', activeView);
    if (activeView === 'macro') qs.set('macro', macroTab);
    if (activeView === 'forex') qs.set('fx', fxTab);
    if (activeView === 'options') {
      qs.set('tab', optionsArgs.tab);
      qs.set('ticker', optionsArgs.ticker);
      if (optionsArgs.sub) qs.set('sub', optionsArgs.sub);
    }
    if (activeView === 'security') qs.set('ticker', securityTicker);
    window.history.replaceState(null, '', `/?${qs.toString()}`);
  }, [activeView, macroTab, fxTab, optionsArgs, securityTicker]);

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

  const viewKey = `${activeView}:${macroTab}:${fxTab}`;

  return (
    <div className="h-screen bg-background flex flex-col overflow-hidden">
      <TerminalHeader onAddTrade={() => setShowAddModal(true)} onNavigate={navigate} onMacroTab={setMacroTab} onFxTab={(t) => { setFxTab(t); navigate('forex'); }} />
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
            const isFullBleed = !!viewById[activeView].fullBleed;
            const mainPad = ['news','options'].includes(activeView) || isFullBleed ? 'p-0' : 'p-4';
            return (
              <>
                {!isFullBleed && (
                  <TopNav activeView={activeView} onViewChange={navigate} activeMacroTab={macroTab} onMacroTabChange={setMacroTab} />
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
                    {viewById[activeView].render({ macroTab, fxTab, setFxTab, newsArgs, optionsArgs, securityTicker })}
                  </div>
                </main>
              </>
            );
          })()}
        </div>
      </div>
      <BloombergFKeyBar onLaunchpad={() => navigate('launchpad')} />
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
