import { useEffect, useState } from 'react';
import { OptionsTab } from '@/types/trade';
import { usePrivacy } from '@/contexts/PrivacyContext';
import { BridgeProvider } from '@/contexts/BridgeContext';
import OptionsMatrix from '@/components/options/OptionsMatrix';
import GammaLevelsChart from '@/components/options/GammaLevelsChart';
import VolatilitySurface from '@/components/options/VolatilitySurface';
import QScorePanel from '@/components/options/QScorePanel';
import DealerFlowFeed from '@/components/options/DealerFlowFeed';
import ConnectionIndicator from '@/components/options/ConnectionIndicator';
import IVTermStructure from '@/components/options/IVTermStructure';
import MaxPainTable from '@/components/options/MaxPainTable';
import PayoffDiagram from '@/components/options/PayoffDiagram';
import SentimentPanel from '@/components/options/SentimentPanel';
import GreeksAggregator from '@/components/options/GreeksAggregator';
import MarketStatsStrip from '@/components/options/MarketStatsStrip';
import GexProfileChart from '@/components/options/GexProfileChart';
import IntradayGexChart from '@/components/options/IntradayGexChart';
import OIExpiryDonut from '@/components/options/OIExpiryDonut';
import SideBySideChain from '@/components/options/SideBySideChain';
import OptionsModuleRail, { OPTIONS_MODULES } from '@/components/options/OptionsModuleRail';
import { optionFKeyMap, optionSubTabs } from '@/config/options';
import OptionsSubTabs from '@/components/options/OptionsSubTabs';
import SpreadBuilder from '@/components/options/SpreadBuilder';
import CharmVannaHeatmap from '@/components/options/CharmVannaHeatmap';
import MaxPainDrift from '@/components/options/MaxPainDrift';
import PayoffHeatmap from '@/components/options/PayoffHeatmap';
import GreeksVsSpot from '@/components/options/GreeksVsSpot';
import SentimentTermStrip from '@/components/options/SentimentTermStrip';
import GreeksScenario from '@/components/options/GreeksScenario';
import GreeksByExpiry from '@/components/options/GreeksByExpiry';
import QFactorBars from '@/components/options/QFactorBars';
import OptionsScreener from '@/components/options/OptionsScreener';
import OvmeWorkspace from '@/components/options/ovme/OvmeWorkspace';
import DashKpiStrip from '@/components/options/DashKpiStrip';
import DealerTapeMini from '@/components/options/DealerTapeMini';
import GexKpiPanel from '@/components/options/GexKpiPanel';
import GreekProfileChart from '@/components/options/GreekProfileChart';
import DpiCockpit from '@/components/options/dpi/DpiCockpit';
import CopilotPanel from '@/components/options/copilot/CopilotPanel';
import GexCockpit from '@/components/options/gex/GexCockpit';
import UoaScanner from '@/components/options/uoa/UoaScanner';
import EarnHub from '@/components/options/earn/EarnHub';
import VarbWorkspace from '@/components/options/varb/VarbWorkspace';
import { SmartTicketProvider } from '@/components/options/ticket/useSmartTicket';
import AlertsDrawer from '@/components/options/alerts/AlertsDrawer';
import type { EarnFilter } from '@/hooks/useEarningsCalendar';
import { Bell } from 'lucide-react';

interface Props {
  initialTab?: OptionsTab;
  initialTicker?: string;
  initialSub?: string;
  initialEarnFilter?: EarnFilter;
}

function OptionsViewInner({ initialTab = 'dash', initialTicker = 'SPY', initialSub, initialEarnFilter }: Props) {
  const { privacyMode } = usePrivacy();
  const [tab, setTab] = useState<OptionsTab>(initialTab);
  const [sub, setSub] = useState<string>(initialSub ?? optionSubTabs[initialTab]?.[0]?.id ?? '');
  const [ticker, setTicker] = useState(initialTicker);
  const [tickerInput, setTickerInput] = useState(initialTicker);
  const [copilotOpen, setCopilotOpen] = useState(false);
  const [alertsOpen, setAlertsOpen] = useState(false);
  const [earnFilter, setEarnFilter] = useState<EarnFilter>(initialEarnFilter ?? { window: 'week' });

  useEffect(() => { if (initialEarnFilter) setEarnFilter(initialEarnFilter); }, [initialEarnFilter]);

  useEffect(() => { setTab(initialTab); setSub(initialSub ?? optionSubTabs[initialTab]?.[0]?.id ?? ''); }, [initialTab, initialSub]);
  useEffect(() => {
    if (initialTicker) {
      setTicker(initialTicker);
      setTickerInput(initialTicker);
    }
  }, [initialTicker]);

  // Reset sub-tab when switching module
  const selectModule = (id: OptionsTab) => {
    setTab(id);
    setSub(optionSubTabs[id]?.[0]?.id ?? '');
  };

  useEffect(() => {
    const handler = (e: KeyboardEvent) => {
      const target = e.target as HTMLElement | null;
      const inField = target && (target.tagName === 'INPUT' || target.tagName === 'TEXTAREA' || target.isContentEditable);
      if (e.key === '?' && !inField) { e.preventDefault(); setCopilotOpen(o => !o); return; }
      if (!optionFKeyMap[e.key]) return;
      if (inField) return;
      e.preventDefault();
      selectModule(optionFKeyMap[e.key]);
    };
    window.addEventListener('keydown', handler);
    return () => window.removeEventListener('keydown', handler);
  }, []);

  const submitTicker = (e: React.FormEvent) => {
    e.preventDefault();
    const t = tickerInput.trim().toUpperCase();
    if (t) setTicker(t);
  };

  const renderModule = () => {
    switch (tab) {
      case 'dash':
        return (
          <div className="space-y-3">
            <DashKpiStrip ticker={ticker} redact={privacyMode} />
            <MarketStatsStrip ticker={ticker} redact={privacyMode} />
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-3">
              <GexProfileChart ticker={ticker} redact={privacyMode} />
              <VolatilitySurface ticker={ticker} redact={privacyMode} />
              <IntradayGexChart ticker={ticker} redact={privacyMode} />
              <IVTermStructure ticker={ticker} redact={privacyMode} />
              <QScorePanel ticker={ticker} redact={privacyMode} />
              <OIExpiryDonut ticker={ticker} redact={privacyMode} />
              <MaxPainTable ticker={ticker} redact={privacyMode} />
              <GammaLevelsChart ticker={ticker} redact={privacyMode} />
              <DealerTapeMini ticker={ticker} redact={privacyMode} />
              <SentimentTermStrip redact={privacyMode} />
              <div className="lg:col-span-2"><GreeksAggregator redact={privacyMode} /></div>
              <div className="lg:col-span-2"><DealerFlowFeed redact={privacyMode} /></div>
            </div>
          </div>
        );

      case 'omon':
        if (sub === 'chain')  return <SideBySideChain ticker={ticker} redact={privacyMode} />;
        if (sub === 'spread') return <SpreadBuilder ticker={ticker} redact={privacyMode} />;
        return <OptionsMatrix ticker={ticker} redact={privacyMode} />;

      case 'gamma':
        return <GammaLevelsChart ticker={ticker} redact={privacyMode} />;

      case 'gex': {
        if (sub === 'cockpit' || !sub) return <GexCockpit ticker={ticker} redact={privacyMode} />;
        const inner = (() => {
          if (sub === 'intraday') return <IntradayGexChart ticker={ticker} redact={privacyMode} />;
          if (sub === 'oi')       return <OIExpiryDonut ticker={ticker} redact={privacyMode} />;
          if (sub === 'vanna_p')  return <GreekProfileChart ticker={ticker} redact={privacyMode} metric="vanna" />;
          if (sub === 'charm_p')  return <GreekProfileChart ticker={ticker} redact={privacyMode} metric="charm" />;
          if (sub === 'charm')    return <CharmVannaHeatmap ticker={ticker} redact={privacyMode} metric="charm" />;
          if (sub === 'vanna')    return <CharmVannaHeatmap ticker={ticker} redact={privacyMode} metric="vanna" />;
          return <GexProfileChart ticker={ticker} redact={privacyMode} />;
        })();
        return (
          <div className="space-y-3">
            <GexKpiPanel ticker={ticker} redact={privacyMode} />
            {inner}
          </div>
        );
      }

      case 'dpi':
        return <DpiCockpit ticker={ticker} redact={privacyMode} />;

      case 'ovme':
        return <OvmeWorkspace ticker={ticker} sub={sub || 'pricing'} redact={privacyMode} />;

      case 'maxp':
        if (sub === 'drift') return <MaxPainDrift ticker={ticker} redact={privacyMode} />;
        return <MaxPainTable ticker={ticker} redact={privacyMode} />;

      case 'pay':
        if (sub === 'greeks') return <GreeksVsSpot ticker={ticker} redact={privacyMode} />;
        if (sub === 'heat')   return <PayoffHeatmap ticker={ticker} redact={privacyMode} />;
        return <PayoffDiagram ticker={ticker} redact={privacyMode} />;

      case 'flow':
        return <DealerFlowFeed redact={privacyMode} />;

      case 'sent':
        return (
          <div className="space-y-3">
            <SentimentTermStrip redact={privacyMode} />
            <SentimentPanel ticker={ticker} redact={privacyMode} />
          </div>
        );

      case 'grk':
        if (sub === 'expiry')   return <GreeksByExpiry redact={privacyMode} />;
        if (sub === 'scenario') return <GreeksScenario redact={privacyMode} />;
        return <GreeksAggregator redact={privacyMode} />;

      case 'qscr':
        return (
          <div className="space-y-3">
            <QScorePanel ticker={ticker} redact={privacyMode} />
            <QFactorBars ticker={ticker} redact={privacyMode} />
          </div>
        );

      case 'scan':
        return <OptionsScreener redact={privacyMode} onOpen={(s) => { setTicker(s); setTickerInput(s); selectModule('dash'); }} />;

      case 'uoa':
        return <UoaScanner redact={privacyMode} />;

      case 'earn':
        return <EarnHub ticker={ticker} onTickerChange={(t) => { setTicker(t); setTickerInput(t); }} filter={earnFilter} redact={privacyMode} />;

      case 'varb':
        return <VarbWorkspace ticker={ticker} redact={privacyMode} />;
    }
  };

  const activeModule = OPTIONS_MODULES.find((m) => m.id === tab);
  const subTabs = optionSubTabs[tab] ?? [];

  return (
    <div className="flex flex-col h-full min-h-0 bg-background overflow-hidden">
      <OptionsModuleRail active={tab} onSelect={selectModule} />

      {/* Bloomberg header strip */}
      <div className="flex items-center gap-2 border-b border-accent bg-surface-deep px-2 h-7 flex-shrink-0">
        <span className="text-[10px] font-mono font-bold text-accent uppercase tracking-wider">{activeModule?.code}</span>
        <span className="text-[10px] font-mono text-muted-foreground uppercase tracking-wider truncate">{activeModule?.label}</span>
        {ticker && (
          <>
            <span className="text-muted-foreground/40">·</span>
            <span className="text-[11px] font-mono font-bold text-foreground tracking-wider">{ticker}</span>
          </>
        )}

        <div className="ml-auto flex items-center gap-1.5 flex-shrink-0">
          <form onSubmit={submitTicker} className="flex items-center">
            <input
              value={tickerInput}
              onChange={(e) => setTickerInput(e.target.value.toUpperCase())}
              className="w-20 bg-background border border-border px-2 py-0.5 text-[10px] font-mono text-foreground uppercase tracking-wider focus:outline-none focus:border-accent placeholder:text-muted-foreground"
              placeholder="TICKER"
              maxLength={6}
            />
          </form>
          <button onClick={() => setCopilotOpen(o => !o)}
            className={`px-1.5 py-0.5 text-[9px] font-mono uppercase tracking-wider border ${copilotOpen ? "border-accent text-accent" : "border-border text-muted-foreground hover:border-accent hover:text-accent"}`}
            title="Toggle copilot (?)">AISK</button>
          <button onClick={() => setAlertsOpen(true)}
            className="px-1.5 py-0.5 text-[9px] font-mono uppercase tracking-wider border border-border text-muted-foreground hover:border-accent hover:text-accent flex items-center gap-1"
            title="Alerts">
            <Bell size={9} /> ALRT
          </button>
          <ConnectionIndicator />
        </div>
      </div>

      {subTabs.length > 0 && (
        <OptionsSubTabs tabs={subTabs} active={sub} onChange={setSub} />
      )}

      <div className="flex-1 min-h-0 overflow-y-auto p-2 min-w-0 bg-background">{renderModule()}</div>

      {/* Bottom F-key bar mapped to module shortcuts. */}
      <div className="flex items-center gap-3 border-t border-border bg-surface-deep px-2 py-0.5 flex-shrink-0 text-[9px] font-mono text-muted-foreground overflow-x-auto uppercase tracking-wider">
        <span className="text-muted-foreground/60">{activeModule?.code} &lt;GO&gt;</span>
        <span className="text-muted-foreground/40">·</span>
        {Object.entries(optionFKeyMap).map(([fk, id]) => {
          const m = OPTIONS_MODULES.find((x) => x.id === id);
          if (!m) return null;
          return (
            <button key={fk} onClick={() => selectModule(id)} className="hover:text-accent whitespace-nowrap">
              <span className="text-accent">{fk}</span> {m.code}
            </button>
          );
        })}
        <span className="ml-auto text-muted-foreground/60 whitespace-nowrap">? = COPILOT · F1–F10 = MODULES</span>
      </div>

      <CopilotPanel open={copilotOpen} onClose={() => setCopilotOpen(false)} ticker={ticker} module={tab} />
      <AlertsDrawer open={alertsOpen} onClose={() => setAlertsOpen(false)} />
    </div>
  );
}

export default function OptionsView(props: Props) {
  return (
    <BridgeProvider>
      <SmartTicketProvider>
        <OptionsViewInner {...props} />
      </SmartTicketProvider>
    </BridgeProvider>
  );
}
