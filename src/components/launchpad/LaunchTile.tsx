// LaunchTile: a single tile in the Launchpad workspace.
// Header doubles as drag handle (".tile-drag") and inline CLI for swapping content.
import { useState, useRef, useEffect, KeyboardEvent } from 'react';
import { X, Maximize2, Minimize2, ChevronDown } from 'lucide-react';
import WEIMonitor from '@/components/monitors/WEIMonitor';
import WBMonitor from '@/components/monitors/WBMonitor';
import GLCOMonitor from '@/components/monitors/GLCOMonitor';
import TOPMonitor from '@/components/monitors/TOPMonitor';
import DashboardView from '@/components/views/DashboardView';
import TradesView from '@/components/views/TradesView';
import PerformanceView from '@/components/views/PerformanceView';
import JournalView from '@/components/views/JournalView';
import ForexView from '@/components/views/ForexView';
import OptionsView from '@/components/views/OptionsView';
import NewsView from '@/components/views/NewsView';
import MacroView from '@/components/views/MacroView';
import GlobeView from '@/components/views/GlobeView';
import CalendarView from '@/components/views/CalendarView';
import AnalyticsView from '@/components/views/AnalyticsView';
import GoalsView from '@/components/views/GoalsView';
import PlaybooksView from '@/components/views/PlaybooksView';
import MistakesView from '@/components/views/MistakesView';
import COTData from '@/components/macro/COTData';
import NewsQuiz from '@/components/news/NewsQuiz';
import PositionsTile from '@/components/tools/widgets/PositionsTile';
import RiskMonitorTile from '@/components/tools/widgets/RiskMonitorTile';
import AlertsTile from '@/components/tools/widgets/AlertsTile';
import CalcHub from '@/components/tools/widgets/CalcHub';
import CorrMatrix from '@/components/tools/widgets/CorrMatrix';
import OpraPricer from '@/components/tools/widgets/OpraPricer';
import PreMarketScan from '@/components/tools/widgets/PreMarketScan';
import EquityChart from '@/components/charts/EquityChart';
import DrawdownChart from '@/components/charts/DrawdownChart';
import DistributionChart from '@/components/charts/DistributionChart';
import DailyPnLChart from '@/components/charts/DailyPnLChart';
import HeatTile from './tiles/HeatTile';
import MoversTile from './tiles/MoversTile';
import IndexFuturesTile from './tiles/IndexFuturesTile';
import WatchlistTile from './tiles/WatchlistTile';
import FedWatchTile from './tiles/FedWatchTile';
import EconMiniTile from './tiles/EconMiniTile';
import EarningsMiniTile from './tiles/EarningsMiniTile';
import CftcTile from './tiles/CftcTile';
import CryptoTile from './tiles/CryptoTile';
import FxBoardTile from './tiles/FxBoardTile';
import EnergyTile from './tiles/EnergyTile';
import YieldCurveTile from './tiles/YieldCurveTile';
import MiniChartTile from './tiles/MiniChartTile';
import MarketInternals from '@/components/macro/MarketInternals';
import NetLiquidity from '@/components/macro/NetLiquidity';
import SqueezeScanner from '@/components/macro/SqueezeScanner';
import SectorRotation from '@/components/macro/SectorRotation';
import AttributionView from '@/components/views/AttributionView';
import PositionSizerView from '@/components/views/PositionSizerView';
import ModulePicker, { MODULE_BY_CODE } from './ModulePicker';

function renderByCode(code: string) {
  switch (code) {
    case 'WEI':  return <WEIMonitor />;
    case 'WB':   return <WBMonitor />;
    case 'GLCO': return <GLCOMonitor />;
    case 'TOP':  return <TOPMonitor />;
    case 'DASH': return <DashboardView />;
    case 'TRDS': return <TradesView />;
    case 'PERF': return <PerformanceView />;
    case 'JRNL': return <JournalView />;
    case 'FX':
    case 'FORX': return <ForexView activeTab="home" />;
    case 'OPT':  return <OptionsView />;
    case 'NEWS': return <NewsView />;
    case 'MACR': return <MacroView activeTab="overview" />;
    case 'GLOB': return <GlobeView />;
    case 'CAL':  return <CalendarView />;
    case 'ANLY': return <AnalyticsView />;
    case 'GOAL': return <GoalsView />;
    case 'PLAY': return <PlaybooksView />;
    case 'MIST': return <MistakesView />;
    case 'COT':  return <COTData />;
    case 'QUIZ': return <NewsQuiz />;
    case 'POS':  return <div className="p-2"><PositionsTile /></div>;
    case 'RISK': return <div className="p-2"><RiskMonitorTile /></div>;
    case 'ALRT': return <div className="p-2"><AlertsTile /></div>;
    case 'CALC': return <div className="p-2"><CalcHub /></div>;
    case 'CORR': return <div className="p-2"><CorrMatrix /></div>;
    case 'OPRA': return <div className="p-2"><OpraPricer /></div>;
    case 'SCAN': return <div className="p-2"><PreMarketScan /></div>;
    case 'EQTY': return <MiniChartTile title="EQTY · Equity Curve"><EquityChart /></MiniChartTile>;
    case 'DDWN': return <MiniChartTile title="DDWN · Drawdown"><DrawdownChart /></MiniChartTile>;
    case 'DIST': return <MiniChartTile title="DIST · P&L Distribution"><DistributionChart /></MiniChartTile>;
    case 'DAYP': return <MiniChartTile title="DAYP · Daily P&L"><DailyPnLChart /></MiniChartTile>;
    case 'HEAT': return <HeatTile />;
    case 'MOVR': return <MoversTile />;
    case 'INDX': return <IndexFuturesTile />;
    case 'WATCH':return <WatchlistTile />;
    case 'FED':  return <FedWatchTile />;
    case 'ECON': return <EconMiniTile />;
    case 'EARN': return <EarningsMiniTile />;
    case 'CFTC': return <CftcTile />;
    case 'CRYP': return <CryptoTile />;
    case 'FXBD': return <FxBoardTile />;
    case 'ENRG': return <EnergyTile />;
    case 'YLDC': return <YieldCurveTile />;
    case 'CBNK':   return <NewsView initialScope="keyword" initialValue="central bank" />;
    case 'GEO':    return <NewsView initialScope="keyword" initialValue="geopolitics" />;
    case 'WIRE':   return <NewsView initialScope="global" initialValue="" initialSource="all" />;
    case 'MINT':   return <MarketInternals />;
    case 'NETLIQ': return <NetLiquidity />;
    case 'SQZZ':   return <SqueezeScanner />;
    case 'ROTN':   return <SectorRotation />;
    case 'ATTR':   return <AttributionView />;
    case 'POSIZ':  return <PositionSizerView />;
    default:       return <div className="p-4 text-[10px] font-mono text-muted-foreground">Unknown module: {code}</div>;
  }
}

interface Props {
  code: string;
  onChangeCode: (code: string) => void;
  onMaximize?: () => void;
  isMaximized?: boolean;
  onRemove?: () => void;
}

export default function LaunchTile({ code, onChangeCode, onMaximize, isMaximized, onRemove }: Props) {
  const [pickerOpen, setPickerOpen] = useState(false);
  const [editing, setEditing] = useState(false);
  const [draft, setDraft] = useState(code);
  const [flash, setFlash] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);
  const opt = MODULE_BY_CODE[code];

  useEffect(() => { if (editing) inputRef.current?.focus(); }, [editing]);

  const commit = () => {
    const c = draft.trim().toUpperCase();
    if (c && MODULE_BY_CODE[c]) {
      onChangeCode(c);
      setEditing(false);
    } else {
      setFlash(true);
      setTimeout(() => setFlash(false), 400);
    }
  };

  const onKey = (e: KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Enter') { e.preventDefault(); commit(); }
    else if (e.key === 'Escape') { setEditing(false); setDraft(code); }
    else if (e.key === '?') { e.preventDefault(); setPickerOpen(true); setEditing(false); }
  };

  return (
    <div className={`relative flex flex-col h-full min-h-0 bg-background border ${flash ? 'border-negative' : 'border-border'}`}>
      <div className="tile-drag flex-shrink-0 flex items-center gap-2 px-2 h-5 bg-surface-deep border-b border-border cursor-move">
        {editing ? (
          <input
            ref={inputRef}
            value={draft}
            onChange={e => setDraft(e.target.value.toUpperCase())}
            onBlur={commit}
            onKeyDown={onKey}
            onMouseDown={e => e.stopPropagation()}
            className="bg-transparent border border-accent px-1 w-16 text-[10px] font-mono font-bold text-accent uppercase focus:outline-none"
            maxLength={5}
            placeholder="CODE"
          />
        ) : (
          <button
            onMouseDown={e => e.stopPropagation()}
            onClick={() => { setDraft(code); setEditing(true); }}
            onDoubleClick={() => setPickerOpen(o => !o)}
            className="text-[10px] font-mono font-bold text-accent uppercase hover:text-foreground transition-colors"
            title="Click to type a code, double-click to browse"
          >
            {code}
          </button>
        )}
        <button
          onMouseDown={e => e.stopPropagation()}
          onClick={() => setPickerOpen(o => !o)}
          className="p-0.5 text-muted-foreground hover:text-accent transition-colors"
          title="Browse modules"
        >
          <ChevronDown className="w-2.5 h-2.5" />
        </button>
        <span className="text-[9px] font-mono text-muted-foreground uppercase truncate">{opt?.label ?? '—'}</span>
        <div className="ml-auto flex items-center gap-0.5">
          {onMaximize && (
            <button
              onMouseDown={e => e.stopPropagation()}
              onClick={onMaximize}
              className="p-0.5 text-muted-foreground hover:text-accent transition-colors"
              title={isMaximized ? 'Restore' : 'Maximize'}
            >
              {isMaximized ? <Minimize2 className="w-3 h-3" /> : <Maximize2 className="w-3 h-3" />}
            </button>
          )}
          {onRemove && (
            <button
              onMouseDown={e => e.stopPropagation()}
              onClick={onRemove}
              className="p-0.5 text-muted-foreground hover:text-negative transition-colors"
              title="Remove tile"
            >
              <X className="w-3 h-3" />
            </button>
          )}
        </div>
        {pickerOpen && (
          <ModulePicker selected={code} onPick={onChangeCode} onClose={() => setPickerOpen(false)} />
        )}
      </div>
      <div className="flex-1 min-h-0 overflow-auto">
        {renderByCode(code)}
      </div>
    </div>
  );
}
