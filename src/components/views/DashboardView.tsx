import { useState, useEffect, useRef, useCallback, useMemo, createContext, useContext } from 'react';
import ViewHeader from '@/components/ViewHeader';
import { Trade, calcWinRate, calcTotalPnl, calcAvgWin, calcAvgLoss, calcProfitFactor, calcExpectancy, calcTotalFees, groupBySymbol, groupByDay, groupBySector, getDatePnl } from '@/types/trade';
import { useTrades } from '@/contexts/TradeContext';
import { usePrivacy } from '@/contexts/PrivacyContext';
import EquityChart from '@/components/charts/EquityChart';
import DailyPnLChart from '@/components/charts/DailyPnLChart';
import DistributionChart from '@/components/charts/DistributionChart';
import DrawdownChart from '@/components/charts/DrawdownChart';
import {
  Settings, Eye, EyeOff, ChevronUp, ChevronDown, Maximize2, Minimize2,
  TrendingUp, TrendingDown, BarChart3, Activity, Clock, Target,
  Flame, Zap, Calendar, PieChart, Award, AlertTriangle, ArrowUpDown,
  X, GripVertical, Filter, SlidersHorizontal
} from 'lucide-react';

// ── Expanded widget context ──
const ExpandedWidgetContext = createContext<{
  expandedId: WidgetId | null;
  setExpandedId: (id: WidgetId | null) => void;
}>({ expandedId: null, setExpandedId: () => {} });

// ── Widget Types ──
type WidgetSize = 'sm' | 'md' | 'lg' | 'full';
type WidgetId =
  | 'stats' | 'equity' | 'dailyPnl' | 'distribution' | 'drawdown'
  | 'recentTrades' | 'streak' | 'riskMeter' | 'volumeHeatmap'
  | 'topPerformers' | 'worstPerformers' | 'monthlyReturns'
  | 'openPositions' | 'cumulativeR' | 'winByDay' | 'avgHoldTime'
  | 'sectorExposure' | 'tradeFrequency' | 'rulesAdherence' | 'quickMetrics'
  | 'pnlBySetup' | 'largestTrades' | 'timeOfDay' | 'rMultiple' | 'consecWinLoss';

interface WidgetConfig {
  id: WidgetId;
  label: string;
  icon: React.ReactNode;
  visible: boolean;
  size: WidgetSize;
  defaultSize: WidgetSize;
}

const INITIAL_WIDGETS: WidgetConfig[] = [
  { id: 'stats', label: 'Key Statistics', icon: <BarChart3 className="w-3.5 h-3.5" />, visible: true, size: 'full', defaultSize: 'full' },
  { id: 'equity', label: 'Equity Curve', icon: <TrendingUp className="w-3.5 h-3.5" />, visible: true, size: 'lg', defaultSize: 'lg' },
  { id: 'streak', label: 'Win/Loss Streak', icon: <Flame className="w-3.5 h-3.5" />, visible: true, size: 'sm', defaultSize: 'sm' },
  { id: 'riskMeter', label: 'Risk Meter', icon: <AlertTriangle className="w-3.5 h-3.5" />, visible: true, size: 'sm', defaultSize: 'sm' },
  { id: 'dailyPnl', label: 'Daily P&L', icon: <BarChart3 className="w-3.5 h-3.5" />, visible: true, size: 'md', defaultSize: 'md' },
  { id: 'topPerformers', label: 'Top Performers', icon: <Award className="w-3.5 h-3.5" />, visible: true, size: 'md', defaultSize: 'md' },
  { id: 'distribution', label: 'P&L Distribution', icon: <Activity className="w-3.5 h-3.5" />, visible: true, size: 'md', defaultSize: 'md' },
  { id: 'winByDay', label: 'Win Rate by Day', icon: <Calendar className="w-3.5 h-3.5" />, visible: true, size: 'md', defaultSize: 'md' },
  { id: 'drawdown', label: 'Drawdown', icon: <TrendingDown className="w-3.5 h-3.5" />, visible: true, size: 'md', defaultSize: 'md' },
  { id: 'sectorExposure', label: 'Sector Exposure', icon: <PieChart className="w-3.5 h-3.5" />, visible: true, size: 'md', defaultSize: 'md' },
  { id: 'monthlyReturns', label: 'Monthly Returns', icon: <Calendar className="w-3.5 h-3.5" />, visible: true, size: 'full', defaultSize: 'full' },
  { id: 'volumeHeatmap', label: 'Volume by Hour', icon: <Clock className="w-3.5 h-3.5" />, visible: true, size: 'md', defaultSize: 'md' },
  { id: 'avgHoldTime', label: 'Avg Hold Time', icon: <Clock className="w-3.5 h-3.5" />, visible: true, size: 'sm', defaultSize: 'sm' },
  { id: 'tradeFrequency', label: 'Trade Frequency', icon: <Zap className="w-3.5 h-3.5" />, visible: true, size: 'md', defaultSize: 'md' },
  { id: 'cumulativeR', label: 'Cumulative R', icon: <Target className="w-3.5 h-3.5" />, visible: true, size: 'md', defaultSize: 'md' },
  { id: 'openPositions', label: 'Open Positions', icon: <ArrowUpDown className="w-3.5 h-3.5" />, visible: true, size: 'full', defaultSize: 'full' },
  { id: 'worstPerformers', label: 'Worst Performers', icon: <TrendingDown className="w-3.5 h-3.5" />, visible: true, size: 'md', defaultSize: 'md' },
  { id: 'rulesAdherence', label: 'Rules Adherence', icon: <Target className="w-3.5 h-3.5" />, visible: true, size: 'md', defaultSize: 'md' },
  { id: 'quickMetrics', label: 'Quick Metrics', icon: <Zap className="w-3.5 h-3.5" />, visible: true, size: 'sm', defaultSize: 'sm' },
  { id: 'recentTrades', label: 'Recent Trades', icon: <BarChart3 className="w-3.5 h-3.5" />, visible: true, size: 'full', defaultSize: 'full' },
  { id: 'pnlBySetup', label: 'P&L by Setup', icon: <Target className="w-3.5 h-3.5" />, visible: true, size: 'md', defaultSize: 'md' },
  { id: 'largestTrades', label: 'Largest Trades', icon: <TrendingUp className="w-3.5 h-3.5" />, visible: true, size: 'md', defaultSize: 'md' },
  { id: 'timeOfDay', label: 'Time of Day P&L', icon: <Clock className="w-3.5 h-3.5" />, visible: true, size: 'md', defaultSize: 'md' },
  { id: 'rMultiple', label: 'R-Multiple Dist.', icon: <Activity className="w-3.5 h-3.5" />, visible: true, size: 'md', defaultSize: 'md' },
  { id: 'consecWinLoss', label: 'Consec. Win/Loss', icon: <Flame className="w-3.5 h-3.5" />, visible: true, size: 'sm', defaultSize: 'sm' },
];

const STORAGE_KEY = 'dashboard-widgets-config';

function loadWidgets(): WidgetConfig[] {
  try {
    const saved = localStorage.getItem(STORAGE_KEY);
    if (saved) {
      const parsed: WidgetConfig[] = JSON.parse(saved);
      // Merge with defaults to add any new widgets
      const ids = new Set(parsed.map(w => w.id));
      const merged = [...parsed];
      INITIAL_WIDGETS.forEach(w => { if (!ids.has(w.id)) merged.push(w); });
      return merged.map(w => ({
        ...w,
        icon: INITIAL_WIDGETS.find(iw => iw.id === w.id)?.icon || <BarChart3 className="w-3.5 h-3.5" />,
      }));
    }
  } catch {}
  return INITIAL_WIDGETS;
}

function saveWidgets(widgets: WidgetConfig[]) {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(widgets.map(({ icon, ...rest }) => rest)));
}

// ── Size helpers ──
function sizeToClass(size: WidgetSize): string {
  switch (size) {
    case 'sm': return 'col-span-1';
    case 'md': return 'col-span-1 lg:col-span-2';
    case 'lg': return 'col-span-1 lg:col-span-3';
    case 'full': return 'col-span-1 lg:col-span-4';
  }
}

const SIZE_LABELS: Record<WidgetSize, string> = { sm: '1/4', md: '1/2', lg: '3/4', full: 'Full' };
const SIZE_ORDER: WidgetSize[] = ['sm', 'md', 'lg', 'full'];
function nextSize(size: WidgetSize): WidgetSize {
  return SIZE_ORDER[(SIZE_ORDER.indexOf(size) + 1) % SIZE_ORDER.length];
}

// ════════════════════════════════════════
// DASHBOARD
// ════════════════════════════════════════
export default function DashboardView() {
  const [widgets, setWidgets] = useState<WidgetConfig[]>(loadWidgets);
  const [editMode, setEditMode] = useState(false);
  const [dragIdx, setDragIdx] = useState<number | null>(null);
  const [expandedId, setExpandedId] = useState<WidgetId | null>(null);

  useEffect(() => { saveWidgets(widgets); }, [widgets]);

  const move = (idx: number, dir: -1 | 1) => {
    const next = idx + dir;
    if (next < 0 || next >= widgets.length) return;
    const arr = [...widgets];
    [arr[idx], arr[next]] = [arr[next], arr[idx]];
    setWidgets(arr);
  };

  const toggleVis = (id: WidgetId) => setWidgets(ws => ws.map(w => w.id === id ? { ...w, visible: !w.visible } : w));
  const cycleSize = (id: WidgetId) => setWidgets(ws => ws.map(w => w.id === id ? { ...w, size: nextSize(w.size) } : w));
  const setSize = (id: WidgetId, size: WidgetSize) => setWidgets(ws => ws.map(w => w.id === id ? { ...w, size } : w));
  const resetLayout = () => { setWidgets(INITIAL_WIDGETS); };
  const showAll = () => setWidgets(ws => ws.map(w => ({ ...w, visible: true })));
  const hideAll = () => setWidgets(ws => ws.map(w => ({ ...w, visible: false })));

  const visible = widgets.filter(w => w.visible);
  const visibleCount = visible.length;
  const totalCount = widgets.length;

  // Close expanded on Escape
  useEffect(() => {
    const handler = (e: KeyboardEvent) => { if (e.key === 'Escape') setExpandedId(null); };
    window.addEventListener('keydown', handler);
    return () => window.removeEventListener('keydown', handler);
  }, []);

  return (
    <ExpandedWidgetContext.Provider value={{ expandedId, setExpandedId }}>
      <div className="relative pb-16">
        <div className="flex justify-end mb-3"><ViewHeader /></div>
        {editMode && (
          <div className="mb-3 bg-card border border-accent/30 p-2 flex items-center gap-2 flex-wrap">
            <Settings className="w-4 h-4 text-accent animate-spin" style={{ animationDuration: '3s' }} />
            <span className="text-[11px] font-mono font-bold text-accent uppercase tracking-wider">
              Customize Dashboard
            </span>
            <span className="text-[10px] font-mono text-muted-foreground ml-1">
              {visibleCount}/{totalCount} widgets
            </span>
            <div className="flex-1" />
            <button onClick={showAll} className="text-[9px] font-mono uppercase text-muted-foreground hover:text-positive px-2 py-1 border border-border hover:border-positive transition-colors">
              Show All
            </button>
            <button onClick={hideAll} className="text-[9px] font-mono uppercase text-muted-foreground hover:text-negative px-2 py-1 border border-border hover:border-negative transition-colors">
              Hide All
            </button>
            <button onClick={resetLayout} className="text-[9px] font-mono uppercase text-muted-foreground hover:text-accent px-2 py-1 border border-border hover:border-accent transition-colors">
              Reset
            </button>
            <button onClick={() => setEditMode(false)} className="text-[9px] font-mono uppercase bg-accent text-accent-foreground px-3 py-1 hover:opacity-90 transition-opacity font-bold">
              ✓ Done
            </button>
          </div>
        )}

        {/* Widget Grid */}
        <div className="grid grid-cols-1 lg:grid-cols-4 gap-3">
          {visible.map((w, vi) => (
            <div key={w.id} className={`${sizeToClass(w.size)} relative group`}>
              {editMode && (
                <div className="absolute inset-0 z-10 border-2 border-dashed border-accent/30 bg-accent/5 pointer-events-none" />
              )}
              {editMode && (
                <div className="absolute top-1 right-1 z-20 flex gap-0.5">
                  <button onClick={() => { const idx = widgets.findIndex(ww => ww.id === w.id); move(idx, -1); }}
                    className="p-1 bg-card border border-border text-muted-foreground hover:text-accent hover:border-accent transition-colors">
                    <ChevronUp className="w-3 h-3" />
                  </button>
                  <button onClick={() => { const idx = widgets.findIndex(ww => ww.id === w.id); move(idx, 1); }}
                    className="p-1 bg-card border border-border text-muted-foreground hover:text-accent hover:border-accent transition-colors">
                    <ChevronDown className="w-3 h-3" />
                  </button>
                  {/* Size selector dropdown */}
                  <div className="relative group/size">
                    <button className="px-1.5 py-1 bg-card border border-border text-[8px] font-mono text-muted-foreground hover:text-accent hover:border-accent transition-colors uppercase font-bold">
                      {SIZE_LABELS[w.size]}
                    </button>
                    <div className="absolute top-full right-0 mt-0.5 bg-card border border-border shadow-lg z-30 hidden group-hover/size:flex flex-col min-w-[60px]">
                      {SIZE_ORDER.map(s => (
                        <button key={s} onClick={() => setSize(w.id, s)}
                          className={`px-2 py-1 text-[8px] font-mono uppercase text-left hover:bg-accent/10 transition-colors ${w.size === s ? 'text-accent font-bold' : 'text-muted-foreground'}`}>
                          {SIZE_LABELS[s]}
                        </button>
                      ))}
                    </div>
                  </div>
                  <button onClick={() => toggleVis(w.id)}
                    className="p-1 bg-card border border-border text-negative hover:bg-negative/20 hover:border-negative transition-colors">
                    <X className="w-3 h-3" />
                  </button>
                </div>
              )}
              {renderWidget(w.id)}
            </div>
          ))}
        </div>

        {/* Hidden widgets tray */}
        {editMode && widgets.some(w => !w.visible) && (
          <div className="mt-4 bg-card border border-border p-3">
            <div className="text-[10px] font-mono text-muted-foreground uppercase tracking-wider mb-2">
              Hidden Widgets — click to add back
            </div>
            <div className="flex flex-wrap gap-1.5">
              {widgets.filter(w => !w.visible).map(w => (
                <button
                  key={w.id}
                  onClick={() => toggleVis(w.id)}
                  className="flex items-center gap-1.5 px-2.5 py-1.5 bg-surface-elevated border border-border text-[10px] font-mono text-muted-foreground hover:text-accent hover:border-accent transition-colors"
                >
                  {w.icon}
                  <span>{w.label}</span>
                  <span className="text-positive text-[10px]">+</span>
                </button>
              ))}
            </div>
          </div>
        )}

        {/* Edit Gear FAB */}
        {!editMode && (
          <button
            onClick={() => setEditMode(true)}
            className="fixed bottom-6 right-6 z-40 p-3 border border-border shadow-lg bg-surface-elevated text-muted-foreground hover:text-accent hover:border-accent transition-all group"
            title="Customize Dashboard"
          >
            <Settings className="w-5 h-5 group-hover:rotate-90 transition-transform duration-300" />
          </button>
        )}

        {/* Expanded widget overlay */}
        {expandedId && (
          <div className="fixed inset-0 z-50 bg-background/90 backdrop-blur-sm flex items-center justify-center p-4" onClick={() => setExpandedId(null)}>
            <div className="w-full max-w-6xl h-[85vh] overflow-auto bg-card border border-accent/30 shadow-2xl flex flex-col" onClick={e => e.stopPropagation()}>
              <div className="flex items-center justify-between px-4 py-2 bg-surface-elevated border-b border-border flex-shrink-0">
                <span className="text-[11px] font-mono font-bold text-accent uppercase tracking-wider">
                  {widgets.find(w => w.id === expandedId)?.label || expandedId}
                </span>
                <button onClick={() => setExpandedId(null)} className="p-1.5 text-muted-foreground hover:text-accent transition-colors">
                  <Minimize2 className="w-4 h-4" />
                </button>
              </div>
              <div className="p-6 flex-1 min-h-0">
                {renderWidget(expandedId)}
              </div>
            </div>
          </div>
        )}
      </div>
    </ExpandedWidgetContext.Provider>
  );
}

// ════════════════════════════════════════
// WIDGET RENDERER
// ════════════════════════════════════════
function renderWidget(id: WidgetId) {
  switch (id) {
    case 'stats': return <StatsWidget />;
    case 'equity': return <ChartWidget title="Equity Curve" widgetId="equity"><EquityChart /></ChartWidget>;
    case 'dailyPnl': return <ChartWidget title="Daily P&L" widgetId="dailyPnl"><DailyPnLChart /></ChartWidget>;
    case 'distribution': return <ChartWidget title="Distribution" widgetId="distribution"><DistributionChart /></ChartWidget>;
    case 'drawdown': return <ChartWidget title="Drawdown" widgetId="drawdown"><DrawdownChart /></ChartWidget>;
    case 'recentTrades': return <RecentTradesWidget />;
    case 'streak': return <StreakWidget />;
    case 'riskMeter': return <RiskMeterWidget />;
    case 'volumeHeatmap': return <VolumeHeatmapWidget />;
    case 'topPerformers': return <PerformersWidget type="top" />;
    case 'worstPerformers': return <PerformersWidget type="worst" />;
    case 'monthlyReturns': return <MonthlyReturnsWidget />;
    case 'openPositions': return <OpenPositionsWidget />;
    case 'cumulativeR': return <CumulativeRWidget />;
    case 'winByDay': return <WinByDayWidget />;
    case 'avgHoldTime': return <AvgHoldTimeWidget />;
    case 'sectorExposure': return <SectorExposureWidget />;
    case 'tradeFrequency': return <TradeFrequencyWidget />;
    case 'rulesAdherence': return <RulesAdherenceWidget />;
    case 'quickMetrics': return <QuickMetricsWidget />;
    case 'pnlBySetup': return <PnlBySetupWidget />;
    case 'largestTrades': return <LargestTradesWidget />;
    case 'timeOfDay': return <TimeOfDayWidget />;
    case 'rMultiple': return <RMultipleWidget />;
    case 'consecWinLoss': return <ConsecWinLossWidget />;
    default: return null;
  }
}

// ── Shared Shell with expand + filter ──
function WidgetShell({ title, icon, children, className = '', widgetId, filterOptions, onFilterChange, activeFilter }: {
  title: string; icon?: React.ReactNode; children: React.ReactNode; className?: string;
  widgetId?: WidgetId; filterOptions?: string[]; onFilterChange?: (f: string) => void; activeFilter?: string;
}) {
  const { expandedId, setExpandedId } = useContext(ExpandedWidgetContext);
  const [showFilters, setShowFilters] = useState(false);
  const isExpanded = widgetId && expandedId === widgetId;

  return (
    <div className={`bg-card border border-border overflow-hidden group/widget hover:border-accent/30 transition-colors flex flex-col ${isExpanded ? 'h-full' : 'h-full'} ${className}`}>
      <div className="flex items-center gap-1.5 px-3 py-2 bg-surface-elevated border-b border-border flex-shrink-0">
        {icon}
        <span className="text-[10px] text-accent uppercase tracking-wider font-mono font-bold">{title}</span>
        {activeFilter && activeFilter !== 'All' && (
          <span className="text-[8px] font-mono bg-accent/20 text-accent px-1.5 py-0.5 ml-1">{activeFilter}</span>
        )}
        <div className="flex-1" />
        {filterOptions && filterOptions.length > 0 && (
          <button onClick={() => setShowFilters(!showFilters)} className={`p-1 transition-colors ${showFilters ? 'text-accent' : 'text-muted-foreground hover:text-accent opacity-0 group-hover/widget:opacity-100'}`}>
            <Filter className="w-3 h-3" />
          </button>
        )}
        {widgetId && !isExpanded && (
          <button onClick={() => setExpandedId(expandedId === widgetId ? null : widgetId)}
            className="p-1 text-muted-foreground hover:text-accent opacity-0 group-hover/widget:opacity-100 transition-all">
            <Maximize2 className="w-3 h-3" />
          </button>
        )}
      </div>
      {showFilters && filterOptions && (
        <div className="flex flex-wrap gap-1 px-3 py-1.5 bg-surface-elevated/50 border-b border-border flex-shrink-0">
          {filterOptions.map(f => (
            <button key={f} onClick={() => onFilterChange?.(f)}
              className={`text-[8px] font-mono uppercase px-2 py-0.5 border transition-colors ${activeFilter === f ? 'border-accent text-accent bg-accent/10' : 'border-border text-muted-foreground hover:border-accent/50'}`}>
              {f}
            </button>
          ))}
        </div>
      )}
      <div className={`p-3 ${isExpanded ? 'flex-1 min-h-0 overflow-auto' : ''}`}>{children}</div>
    </div>
  );
}

function ChartWidget({ title, children, widgetId }: { title: string; children: React.ReactNode; widgetId?: WidgetId }) {
  const { expandedId, setExpandedId } = useContext(ExpandedWidgetContext);
  const isExpanded = widgetId && expandedId === widgetId;

  return (
    <div className={`bg-card border border-border overflow-hidden hover:border-accent/30 transition-colors group/chart relative ${isExpanded ? 'h-full' : 'h-[320px]'}`}>
      {widgetId && !isExpanded && (
        <button onClick={() => setExpandedId(expandedId === widgetId ? null : widgetId)}
          className="absolute top-2 right-2 z-10 p-1.5 bg-card/80 border border-border text-muted-foreground hover:text-accent hover:border-accent opacity-0 group-hover/chart:opacity-100 transition-all">
          <Maximize2 className="w-3 h-3" />
        </button>
      )}
      {children}
    </div>
  );
}

// ════════════════════════════════════════
// INDIVIDUAL WIDGETS
// ════════════════════════════════════════

// ── Stats ──
function StatsWidget() {
  const { trades } = useTrades();
  const { privacyMode, activeAccount } = usePrivacy();
  const totalPnl = calcTotalPnl(trades);
  const winRate = calcWinRate(trades);
  const wins = trades.filter(t => t.pnl > 0);
  const losses = trades.filter(t => t.pnl < 0);
  const pf = calcProfitFactor(trades);
  const exp = calcExpectancy(trades);

  const pm = privacyMode;
  const bal = activeAccount.balance;
  const fmtD = (v: number) => pm ? `${bal ? ((v / bal) * 100).toFixed(1) : '0.0'}%` : `$${v.toFixed(0)}`;
  const fmtDS = (v: number) => pm ? `${bal ? ((v / bal) * 100).toFixed(1) : '0.0'}%` : `${v >= 0 ? '+' : ''}$${v.toFixed(0)}`;

  const stats = [
    { label: 'Total P&L', value: fmtDS(totalPnl), cls: totalPnl >= 0 ? 'text-positive' : 'text-negative', sub: `${trades.length} trades`, subCls: '', type: (totalPnl >= 0 ? 'positive' : 'negative') as 'positive' | 'negative' | undefined },
    { label: 'Win Rate', value: `${winRate.toFixed(1)}%`, cls: '', sub: `${wins.length}W / ${losses.length}L`, subCls: winRate >= 50 ? 'text-positive' : 'text-negative', type: (winRate >= 50 ? 'positive' : 'negative') as 'positive' | 'negative' | undefined },
    { label: 'Avg Win', value: fmtD(calcAvgWin(trades)), cls: 'text-positive', sub: `${wins.length} trades`, subCls: '', type: undefined },
    { label: 'Avg Loss', value: fmtD(calcAvgLoss(trades)), cls: 'text-negative', sub: `${losses.length} trades`, subCls: '', type: 'negative' as const },
    { label: 'Profit Factor', value: pf === Infinity ? '∞' : pf.toFixed(2), cls: '', sub: pf >= 1.5 ? 'Good' : 'Needs Work', subCls: pf >= 1.5 ? 'text-positive' : 'text-negative', type: undefined },
    { label: 'Expectancy', value: fmtD(exp), cls: exp >= 0 ? 'text-positive' : 'text-negative', sub: 'Per Trade', subCls: '', type: (exp >= 0 ? 'positive' : 'negative') as 'positive' | 'negative' | undefined },
  ];
  return (
    <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-2">
      {stats.map(s => (
        <div key={s.label} className={`bg-card border border-border p-2.5 relative ${
          s.type === 'positive' ? 'stat-bar-positive-top' : s.type === 'negative' ? 'stat-bar-negative-top' : 'stat-bar-accent-top'
        }`}>
          <div className="text-data-muted text-[9px] uppercase tracking-wide mb-1 font-body">{s.label}</div>
          <div className={`text-base font-bold font-mono ${s.cls}`}>{s.value}</div>
          <div className={`text-[9px] font-body ${s.subCls || 'text-muted-foreground'}`}>{s.sub}</div>
        </div>
      ))}
    </div>
  );
}

// ── Win/Loss Streak ──
function StreakWidget() {
  const { trades } = useTrades();
  const { privacyMode } = usePrivacy();
  const streaks = trades.slice(0, 10).map(t => ({ result: t.pnl > 0 ? 'W' : 'L', pnl: t.pnl }));
  if (streaks.length === 0) return <WidgetShell title="Win/Loss Streak" icon={<Flame className="w-3.5 h-3.5 text-accent" />} widgetId="streak"><div className="text-[10px] text-muted-foreground">No trades yet</div></WidgetShell>;
  const currentStreak = (() => {
    let count = 0;
    const first = streaks[0].result;
    for (const s of streaks) {
      if (s.result === first) count++; else break;
    }
    return { type: first, count };
  })();
  const bestWin = Math.max(...streaks.filter(s => s.result === 'W').map(s => s.pnl));
  const worstLoss = Math.min(...streaks.filter(s => s.result === 'L').map(s => s.pnl));

  return (
    <WidgetShell title="Win/Loss Streak" icon={<Flame className="w-3.5 h-3.5 text-accent" />} widgetId="streak">
      <div className="flex gap-1 mb-3 flex-wrap">
        {streaks.map((s, i) => (
          <div key={i} className={`w-6 h-6 flex items-center justify-center text-[9px] font-mono font-bold border ${
            s.result === 'W' ? 'bg-positive/20 border-positive/40 text-positive' : 'bg-negative/20 border-negative/40 text-negative'
          }`}>{s.result}</div>
        ))}
      </div>
      <div className="space-y-1.5 text-[10px] font-mono">
        <div className="flex justify-between">
          <span className="text-muted-foreground">Current</span>
          <span className={currentStreak.type === 'W' ? 'text-positive' : 'text-negative'}>
            {currentStreak.count}{currentStreak.type} streak
          </span>
        </div>
        <div className="flex justify-between">
          <span className="text-muted-foreground">Best Win</span>
          <span className="text-positive">{privacyMode ? '•••••' : `+$${bestWin.toLocaleString()}`}</span>
        </div>
        <div className="flex justify-between">
          <span className="text-muted-foreground">Worst Loss</span>
          <span className="text-negative">{privacyMode ? '•••••' : `$${worstLoss.toLocaleString()}`}</span>
        </div>
      </div>
    </WidgetShell>
  );
}

// ── Risk Meter ──
function RiskMeterWidget() {
  const { trades } = useTrades();
  const today = new Date().toISOString().split('T')[0];
  const todayTrades = trades.filter(t => t.date.split(' ')[0] === today);
  const dailyLoss = calcTotalPnl(todayTrades.filter(t => t.pnl < 0));
  const dailyLimit = -1000;
  const totalExposure = trades.slice(0, 20).reduce((s, t) => s + Math.abs(t.pnl), 0);
  const maxExposure = 50000;
  const riskPercent = Math.min(Math.round((totalExposure / maxExposure) * 100), 100);

  return (
    <WidgetShell title="Risk Meter" icon={<AlertTriangle className="w-3.5 h-3.5 text-accent" />} widgetId="riskMeter">
      <div className="space-y-3">
        <div className="relative">
          <div className="h-3 bg-surface-elevated border border-border overflow-hidden">
            <div
              className="h-full transition-all duration-500"
              style={{
                width: `${riskPercent}%`,
                background: riskPercent < 20 ? 'hsl(var(--positive))' : riskPercent < 35 ? 'hsl(var(--accent))' : 'hsl(var(--negative))',
              }}
            />
          </div>
          <div className="flex justify-between text-[8px] font-mono text-muted-foreground mt-0.5">
            <span>LOW</span><span>MED</span><span>HIGH</span>
          </div>
        </div>
        <div className="space-y-1 text-[10px] font-mono">
          <div className="flex justify-between">
            <span className="text-muted-foreground">Exposure</span>
            <span className="text-accent">{riskPercent}%</span>
          </div>
          <div className="flex justify-between">
            <span className="text-muted-foreground">Daily Loss</span>
            <span className="text-negative">${dailyLoss.toFixed(0)}</span>
          </div>
          <div className="flex justify-between">
            <span className="text-muted-foreground">Daily Limit</span>
            <span className="text-foreground">${dailyLimit}</span>
          </div>
          <div className="h-1.5 bg-surface-elevated border border-border mt-1">
            <div className="h-full bg-negative" style={{ width: `${Math.min((Math.abs(dailyLoss) / Math.abs(dailyLimit)) * 100, 100)}%` }} />
          </div>
          <div className="text-[8px] text-muted-foreground text-right">{Math.min(((Math.abs(dailyLoss) / Math.abs(dailyLimit)) * 100), 100).toFixed(0)}% of daily limit used</div>
        </div>
      </div>
    </WidgetShell>
  );
}

// ── Volume Heatmap ──
function VolumeHeatmapWidget() {
  const { trades } = useTrades();
  const hours = ['6a', '7a', '8a', '9a', '10a', '11a', '12p', '1p', '2p', '3p', '4p'];
  const hourNums = [6, 7, 8, 9, 10, 11, 12, 13, 14, 15, 16];
  const days = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri'];
  const dayNums = [1, 2, 3, 4, 5]; // JS getDay: Mon=1..Fri=5

  const data = useMemo(() => {
    const grid = days.map(() => hours.map(() => 0));
    trades.forEach(t => {
      const d = new Date(t.date.replace(' ', 'T'));
      const dayIdx = dayNums.indexOf(d.getDay());
      const hourIdx = hourNums.indexOf(d.getHours());
      if (dayIdx >= 0 && hourIdx >= 0) grid[dayIdx][hourIdx]++;
    });
    return grid;
  }, [trades]);
  const max = Math.max(...data.flat(), 1);

  return (
    <WidgetShell title="Volume by Hour" icon={<Clock className="w-3.5 h-3.5 text-accent" />} widgetId="volumeHeatmap">
      <div className="overflow-x-auto">
        <table className="w-full">
          <thead>
            <tr>
              <th className="w-8" />
              {hours.map(h => (
                <th key={h} className="text-[8px] font-mono text-muted-foreground px-0.5 pb-1">{h}</th>
              ))}
            </tr>
          </thead>
          <tbody>
            {days.map((day, di) => (
              <tr key={day}>
                <td className="text-[9px] font-mono text-muted-foreground pr-1">{day}</td>
                {data[di].map((v, hi) => {
                  const intensity = v / max;
                  return (
                    <td key={hi} className="p-0.5">
                      <div
                        className="w-full aspect-square border border-border/50 flex items-center justify-center text-[7px] font-mono"
                        style={{
                          background: v === 0 ? 'hsl(var(--surface-elevated))' : `hsla(var(--positive), ${0.15 + intensity * 0.7})`,
                          color: intensity > 0.5 ? 'hsl(var(--primary-foreground))' : 'hsl(var(--muted-foreground))',
                        }}
                      >
                        {v || ''}
                      </div>
                    </td>
                  );
                })}
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </WidgetShell>
  );
}

// ── Top/Worst Performers ──
function PerformersWidget({ type }: { type: 'top' | 'worst' }) {
  const { trades } = useTrades();
  const { privacyMode } = usePrivacy();
  const bySymbol = useMemo(() => groupBySymbol(trades), [trades]);
  const sorted = type === 'top'
    ? bySymbol.filter(s => s.totalPnl > 0).slice(0, 5)
    : bySymbol.filter(s => s.totalPnl < 0).sort((a, b) => a.totalPnl - b.totalPnl).slice(0, 5);
  const allSymbols = sorted.map(s => ({ symbol: s.symbol, pnl: s.totalPnl, trades: s.trades, wr: Math.round(s.winRate) }));
  const maxAbs = allSymbols.length ? Math.max(...allSymbols.map(s => Math.abs(s.pnl))) : 1;

  return (
    <WidgetShell
      title={type === 'top' ? 'Top Performers' : 'Worst Performers'}
      icon={type === 'top' ? <Award className="w-3.5 h-3.5 text-accent" /> : <TrendingDown className="w-3.5 h-3.5 text-accent" />}
      widgetId={type === 'top' ? 'topPerformers' : 'worstPerformers'}
    >
      <div className="space-y-2">
        {allSymbols.map(s => (
          <div key={s.symbol}>
            <div className="flex items-center justify-between text-[10px] font-mono mb-0.5">
              <span className="font-bold">{s.symbol}</span>
              <span className={s.pnl >= 0 ? 'text-positive' : 'text-negative'}>
                {privacyMode ? '•••••' : `${s.pnl >= 0 ? '+' : ''}$${s.pnl.toLocaleString()}`}
              </span>
            </div>
            <div className="h-1.5 bg-surface-elevated border border-border overflow-hidden">
              <div className="h-full" style={{ width: `${(Math.abs(s.pnl) / maxAbs) * 100}%`, background: s.pnl >= 0 ? 'hsl(var(--positive))' : 'hsl(var(--negative))' }} />
            </div>
            <div className="flex justify-between text-[8px] text-muted-foreground mt-0.5">
              <span>{s.trades} trades</span><span>WR: {s.wr}%</span>
            </div>
          </div>
        ))}
        {allSymbols.length === 0 && <div className="text-[10px] text-muted-foreground">No data</div>}
      </div>
    </WidgetShell>
  );
}

// ── Monthly Returns Grid ──
function MonthlyReturnsWidget() {
  const { trades } = useTrades();
  const { privacyMode } = usePrivacy();
  const months = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];

  const { years, returns } = useMemo(() => {
    const map: Record<number, number[]> = {};
    trades.forEach(t => {
      const d = new Date(t.date.replace(' ', 'T'));
      const y = d.getFullYear();
      if (!map[y]) map[y] = new Array(12).fill(0);
      map[y][d.getMonth()] += t.pnl;
    });
    const yrs = Object.keys(map).map(Number).sort();
    return { years: yrs, returns: map };
  }, [trades]);

  const max = Math.max(...Object.values(returns).flat().map(Math.abs).filter(v => v > 0), 1);

  return (
    <WidgetShell title="Monthly Returns" icon={<Calendar className="w-3.5 h-3.5 text-accent" />} widgetId="monthlyReturns">
      <div className="overflow-x-auto">
        <table className="w-full">
          <thead>
            <tr>
              <th className="text-[9px] font-mono text-muted-foreground text-left pr-2 pb-1">Year</th>
              {months.map(m => <th key={m} className="text-[8px] font-mono text-muted-foreground px-0.5 pb-1">{m}</th>)}
              <th className="text-[8px] font-mono text-muted-foreground px-1 pb-1">YTD</th>
            </tr>
          </thead>
          <tbody>
            {years.map(year => {
              const ytd = returns[year].reduce((s, v) => s + v, 0);
              return (
                <tr key={year}>
                  <td className="text-[10px] font-mono font-bold pr-2 py-0.5">{year}</td>
                  {returns[year].map((v, i) => {
                    const intensity = Math.abs(v) / max;
                    return (
                      <td key={i} className="p-0.5">
                        <div
                          className="h-7 flex items-center justify-center text-[8px] font-mono font-bold border border-border/50"
                          style={{
                            background: v > 0 ? `hsla(var(--positive), ${0.15 + intensity * 0.5})` : v < 0 ? `hsla(var(--negative), ${0.15 + intensity * 0.5})` : 'hsl(var(--surface-elevated))',
                            color: v !== 0 ? 'hsl(var(--foreground))' : 'hsl(var(--muted-foreground))',
                          }}
                        >
                          {v !== 0 ? (privacyMode ? (v > 0 ? '▲' : '▼') : `${v > 0 ? '+' : ''}$${Math.abs(v).toFixed(0)}`) : '—'}
                        </div>
                      </td>
                    );
                  })}
                  <td className="p-0.5">
                    <div className={`h-7 flex items-center justify-center text-[9px] font-mono font-bold border border-border ${
                      ytd >= 0 ? 'text-positive' : 'text-negative'
                    } bg-surface-elevated`}>
                      {privacyMode ? (ytd >= 0 ? '▲' : '▼') : `${ytd > 0 ? '+' : ''}$${ytd.toFixed(0)}`}
                    </div>
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
    </WidgetShell>
  );
}

// ── Open Positions ──
function OpenPositionsWidget() {
  const { trades } = useTrades();
  const { privacyMode } = usePrivacy();
  // Show last 4 trades as "open" for demo - in a real app these would be filtered by status
  const positions = useMemo(() => trades.slice(0, 4).map(t => ({
    symbol: t.symbol,
    side: t.side,
    entry: t.entry,
    current: t.exit,
    size: t.size,
    unrealizedPnl: t.pnl,
    change: ((t.exit - t.entry) / t.entry) * 100,
  })), [trades]);
  const totalUnrealized = positions.reduce((s, p) => s + p.unrealizedPnl, 0);

  return (
    <WidgetShell title="Open Positions" icon={<ArrowUpDown className="w-3.5 h-3.5 text-accent" />} widgetId="openPositions">
      <div className="overflow-x-auto">
        <table className="w-full">
          <thead>
            <tr>
              {['Symbol', 'Side', 'Entry', 'Current', 'Size', 'Unrealized', '%'].map(h => (
                <th key={h} className="text-[9px] font-mono text-accent uppercase px-2 py-1.5 text-left border-b border-border">{h}</th>
              ))}
            </tr>
          </thead>
          <tbody>
            {positions.map((p, i) => (
              <tr key={i} className="border-b border-grid-line hover:bg-surface-elevated transition-colors">
                <td className="px-2 py-1.5 text-[10px] font-mono font-bold">{p.symbol}</td>
                <td className={`px-2 py-1.5 text-[10px] font-mono ${p.side === 'LONG' || p.side === 'CALL' ? 'text-positive' : 'text-negative'}`}>{p.side}</td>
                <td className="px-2 py-1.5 text-[10px] font-mono">{privacyMode ? '•••' : `$${p.entry.toFixed(2)}`}</td>
                <td className="px-2 py-1.5 text-[10px] font-mono">{privacyMode ? '•••' : `$${p.current.toFixed(2)}`}</td>
                <td className="px-2 py-1.5 text-[10px] font-mono">{privacyMode ? '•' : p.size}</td>
                <td className={`px-2 py-1.5 text-[10px] font-mono font-bold ${p.unrealizedPnl >= 0 ? 'text-positive' : 'text-negative'}`}>
                  {privacyMode ? '•••••' : `${p.unrealizedPnl >= 0 ? '+' : ''}$${p.unrealizedPnl.toFixed(0)}`}
                </td>
                <td className={`px-2 py-1.5 text-[10px] font-mono ${p.change >= 0 ? 'text-positive' : 'text-negative'}`}>
                  {p.change >= 0 ? '+' : ''}{p.change.toFixed(2)}%
                </td>
              </tr>
            ))}
          </tbody>
        </table>
        <div className="flex justify-end px-2 py-2 border-t border-border">
          <span className="text-[10px] font-mono text-muted-foreground mr-2">Total Unrealized:</span>
          <span className={`text-[10px] font-mono font-bold ${totalUnrealized >= 0 ? 'text-positive' : 'text-negative'}`}>
            {privacyMode ? '•••••' : `${totalUnrealized >= 0 ? '+' : ''}$${totalUnrealized.toLocaleString()}`}
          </span>
        </div>
      </div>
    </WidgetShell>
  );
}

// ── Cumulative R ──
function CumulativeRWidget() {
  const { trades } = useTrades();
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const mouseRef = useRef<{ x: number; y: number } | null>(null);

  const { rData, tradeLabels } = useMemo(() => {
    const sorted = [...trades].sort((a, b) => a.date.localeCompare(b.date));
    const data = [0];
    const labels = ['Start'];
    sorted.slice(-30).forEach(t => {
      const rVal = parseFloat(t.rr) || 0;
      const r = t.pnl >= 0 ? rVal : -rVal;
      data.push(data[data.length - 1] + r);
      labels.push(`${t.symbol} ${t.date.split(' ')[0]}`);
    });
    return { rData: data, tradeLabels: labels };
  }, [trades]);

  const draw = useCallback(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;
    canvas.width = canvas.offsetWidth * 2;
    canvas.height = canvas.offsetHeight * 2;
    ctx.scale(2, 2);
    const w = canvas.offsetWidth, h = canvas.offsetHeight;
    const mouse = mouseRef.current;
    ctx.fillStyle = 'hsl(220, 20%, 7%)';
    ctx.fillRect(0, 0, w, h);
    if (rData.length < 2) return;
    const max = Math.max(...rData);
    const min = Math.min(...rData);
    const range = max - min || 1;
    const ml = 30, mr = 10, mt = 10, mb = 20;
    const cw = w - ml - mr, ch = h - mt - mb;
    ctx.strokeStyle = 'hsl(220, 10%, 16%)';
    ctx.lineWidth = 0.5;
    for (let i = 0; i <= 3; i++) {
      const y = mt + (ch / 3) * i;
      ctx.beginPath(); ctx.moveTo(ml, y); ctx.lineTo(w - mr, y); ctx.stroke();
      ctx.fillStyle = 'hsl(215, 10%, 35%)';
      ctx.font = '8px "Space Mono", monospace';
      ctx.textAlign = 'right';
      ctx.fillText(`${(max - (range / 3) * i).toFixed(0)}R`, ml - 4, y + 3);
    }
    const grad = ctx.createLinearGradient(0, mt, 0, h - mb);
    grad.addColorStop(0, 'hsla(145, 75%, 70%, 0.2)');
    grad.addColorStop(1, 'hsla(145, 75%, 70%, 0)');
    ctx.fillStyle = grad;
    ctx.beginPath();
    ctx.moveTo(ml, h - mb);
    rData.forEach((v, i) => {
      const x = ml + (i / (rData.length - 1)) * cw;
      const y = mt + ((max - v) / range) * ch;
      ctx.lineTo(x, y);
    });
    ctx.lineTo(ml + cw, h - mb);
    ctx.closePath();
    ctx.fill();
    ctx.strokeStyle = 'hsl(145, 75%, 70%)';
    ctx.lineWidth = 1.5;
    ctx.beginPath();
    rData.forEach((v, i) => {
      const x = ml + (i / (rData.length - 1)) * cw;
      const y = mt + ((max - v) / range) * ch;
      i === 0 ? ctx.moveTo(x, y) : ctx.lineTo(x, y);
    });
    ctx.stroke();
    rData.forEach((v, i) => {
      const x = ml + (i / (rData.length - 1)) * cw;
      const y = mt + ((max - v) / range) * ch;
      ctx.fillStyle = 'hsl(145, 75%, 70%)';
      ctx.beginPath(); ctx.arc(x, y, 1.5, 0, Math.PI * 2); ctx.fill();
    });
    if (mouse && mouse.x >= ml && mouse.x <= w - mr) {
      const ratio = (mouse.x - ml) / cw;
      const ci = Math.max(0, Math.min(rData.length - 1, Math.round(ratio * (rData.length - 1))));
      const px = ml + (ci / (rData.length - 1)) * cw;
      const py = mt + ((max - rData[ci]) / range) * ch;
      const val = rData[ci];
      const delta = ci > 0 ? (val - rData[ci - 1]).toFixed(1) : '0.0';
      ctx.strokeStyle = 'hsla(215, 10%, 50%, 0.4)';
      ctx.lineWidth = 0.5;
      ctx.setLineDash([2, 2]);
      ctx.beginPath(); ctx.moveTo(px, mt); ctx.lineTo(px, h - mb); ctx.stroke();
      ctx.beginPath(); ctx.moveTo(ml, py); ctx.lineTo(w - mr, py); ctx.stroke();
      ctx.setLineDash([]);
      ctx.fillStyle = 'hsl(220, 20%, 7%)';
      ctx.beginPath(); ctx.arc(px, py, 4, 0, Math.PI * 2); ctx.fill();
      ctx.strokeStyle = 'hsl(145, 75%, 70%)';
      ctx.lineWidth = 1.5;
      ctx.beginPath(); ctx.arc(px, py, 4, 0, Math.PI * 2); ctx.stroke();
      const tw = 130, th = 38;
      let tx = px + 8, ty = py - th - 4;
      if (tx + tw > w - mr) tx = px - tw - 8;
      if (ty < mt) ty = py + 8;
      ctx.fillStyle = 'hsla(220, 15%, 11%, 0.95)';
      ctx.fillRect(tx, ty, tw, th);
      ctx.strokeStyle = 'hsl(220, 10%, 25%)';
      ctx.lineWidth = 0.5;
      ctx.strokeRect(tx, ty, tw, th);
      ctx.font = '8px "Space Mono", monospace';
      ctx.textAlign = 'left';
      ctx.fillStyle = 'hsl(30, 100%, 50%)';
      ctx.fillText(tradeLabels[ci], tx + 6, ty + 12);
      ctx.fillStyle = 'hsl(145, 75%, 70%)';
      ctx.font = 'bold 9px "Space Mono", monospace';
      ctx.fillText(`${val.toFixed(1)}R`, tx + 6, ty + 24);
      ctx.fillStyle = Number(delta) >= 0 ? 'hsl(145, 75%, 70%)' : 'hsl(0, 80%, 55%)';
      ctx.font = '8px "Space Mono", monospace';
      ctx.fillText(`Δ ${Number(delta) >= 0 ? '+' : ''}${delta}R`, tx + 6, ty + 34);
    }
  }, [rData, tradeLabels]);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const handleMove = (e: MouseEvent) => {
      const rect = canvas.getBoundingClientRect();
      mouseRef.current = { x: e.clientX - rect.left, y: e.clientY - rect.top };
      draw();
    };
    const handleLeave = () => { mouseRef.current = null; draw(); };
    draw();
    canvas.addEventListener('mousemove', handleMove);
    canvas.addEventListener('mouseleave', handleLeave);
    window.addEventListener('resize', draw);
    return () => {
      canvas.removeEventListener('mousemove', handleMove);
      canvas.removeEventListener('mouseleave', handleLeave);
      window.removeEventListener('resize', draw);
    };
  }, [draw]);

  return (
    <WidgetShell title="Cumulative R" icon={<Target className="w-3.5 h-3.5 text-accent" />} widgetId="cumulativeR">
      <div className="min-h-[140px] flex-1">
        <canvas ref={canvasRef} className="w-full h-full cursor-crosshair" />
      </div>
      <div className="flex justify-between text-[9px] font-mono mt-1">
        <span className="text-muted-foreground">Total: <span className="text-positive">{rData[rData.length - 1].toFixed(1)}R</span></span>
        <span className="text-muted-foreground">Avg: <span className="text-foreground">{(rData[rData.length - 1] / Math.max(rData.length - 1, 1)).toFixed(2)}R</span>/trade</span>
      </div>
    </WidgetShell>
  );
}

// ── Win Rate by Day ──
function WinByDayWidget() {
  const { trades } = useTrades();
  const days = useMemo(() => groupByDay(trades), [trades]);
  const maxTrades = Math.max(...days.map(d => d.wins + d.losses), 1);

  return (
    <WidgetShell title="Win Rate by Day" icon={<Calendar className="w-3.5 h-3.5 text-accent" />} widgetId="winByDay">
      <div className="space-y-2">
        {days.map(d => (
          <div key={d.day}>
            <div className="flex items-center justify-between text-[10px] font-mono mb-0.5">
              <span className="w-8 font-bold">{d.day}</span>
              <span className={d.winRate >= 60 ? 'text-positive' : d.winRate >= 50 ? 'text-accent' : 'text-negative'}>{d.winRate.toFixed(0)}%</span>
            </div>
            <div className="h-2 bg-surface-elevated border border-border overflow-hidden flex">
              <div className="h-full bg-positive" style={{ width: `${(d.wins / maxTrades) * 100}%` }} />
              <div className="h-full bg-negative" style={{ width: `${(d.losses / maxTrades) * 100}%` }} />
            </div>
            <div className="flex justify-between text-[8px] text-muted-foreground mt-0.5">
              <span>{d.wins}W</span>
              <span>{d.losses}L</span>
            </div>
          </div>
        ))}
      </div>
    </WidgetShell>
  );
}

// ── Avg Hold Time ──
function AvgHoldTimeWidget() {
  const { trades } = useTrades();
  const holdTimes = useMemo(() => {
    const buckets = [
      { label: 'Scalps (<5m)', keys: ['2m', '5m'], count: 0 },
      { label: 'Day (<1h)', keys: ['12m', '25m', '45m', '1h'], count: 0 },
      { label: 'Swing (1d+)', keys: ['2h', '4h', '1d', '2d', '3d', '5d'], count: 0 },
      { label: 'Position (1w+)', keys: ['1w', '2w'], count: 0 },
    ];
    trades.forEach(t => { buckets.forEach(b => { if (b.keys.includes(t.holdTime)) b.count++; }); });
    const total = trades.length || 1;
    return buckets.map(b => ({ label: b.label, pct: Math.round((b.count / total) * 100), count: b.count }));
  }, [trades]);

  return (
    <WidgetShell title="Avg Hold Time" icon={<Clock className="w-3.5 h-3.5 text-accent" />} widgetId="avgHoldTime">
      <div className="space-y-2">
        {holdTimes.map(h => (
          <div key={h.label}>
            <div className="flex items-center justify-between text-[9px] font-mono mb-0.5">
              <span className="text-muted-foreground">{h.label}</span>
              <span className="text-foreground">{h.pct}%</span>
            </div>
            <div className="h-1.5 bg-surface-elevated border border-border overflow-hidden">
              <div className="h-full bg-accent" style={{ width: `${h.pct}%` }} />
            </div>
            <div className="text-[7px] text-muted-foreground text-right mt-0.5">{h.count} trades</div>
          </div>
        ))}
      </div>
    </WidgetShell>
  );
}

// ── Sector Exposure ──
function SectorExposureWidget() {
  const { trades } = useTrades();
  const { privacyMode } = usePrivacy();
  const sectors = useMemo(() => groupBySector(trades), [trades]);
  const colors = [
    'hsl(var(--positive))', 'hsl(var(--accent))', 'hsl(210, 60%, 50%)', 'hsl(280, 60%, 50%)', 'hsl(var(--negative))', 'hsl(50, 60%, 50%)'
  ];

  return (
    <WidgetShell title="Sector Exposure" icon={<PieChart className="w-3.5 h-3.5 text-accent" />} widgetId="sectorExposure">
      <div className="h-4 flex overflow-hidden border border-border mb-3">
        {sectors.map((s, i) => (
          <div key={s.sector} className="h-full" style={{ width: `${s.pct}%`, background: colors[i] }} title={`${s.sector}: ${s.pct}%`} />
        ))}
      </div>
      <div className="space-y-1.5">
        {sectors.map((s, i) => (
          <div key={s.sector} className="flex items-center gap-2 text-[9px] font-mono">
            <div className="w-2 h-2 flex-shrink-0" style={{ background: colors[i] }} />
            <span className="flex-1 text-muted-foreground">{s.sector}</span>
            <span className="text-foreground">{s.pct}%</span>
            <span className={`min-w-[50px] text-right ${s.totalPnl >= 0 ? 'text-positive' : 'text-negative'}`}>
              {privacyMode ? '•••' : `${s.totalPnl >= 0 ? '+' : ''}$${s.totalPnl.toLocaleString()}`}
            </span>
          </div>
        ))}
      </div>
    </WidgetShell>
  );
}

// ── Trade Frequency ──
function TradeFrequencyWidget() {
  const { trades } = useTrades();
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const mouseRef = useRef<{ x: number; y: number } | null>(null);

  const { weeklyData, weekLabels } = useMemo(() => {
    // Group trades into weekly buckets (last 12 weeks)
    const now = new Date();
    const weeks: Record<string, number> = {};
    const labels: string[] = [];
    const data: number[] = [];
    for (let i = 11; i >= 0; i--) {
      const weekStart = new Date(now);
      weekStart.setDate(weekStart.getDate() - i * 7);
      const key = `W${12 - i}`;
      const weekEnd = new Date(weekStart);
      weekEnd.setDate(weekEnd.getDate() + 7);
      const count = trades.filter(t => {
        const td = new Date(t.date.replace(' ', 'T'));
        return td >= weekStart && td < weekEnd;
      }).length;
      labels.push(key);
      data.push(count);
    }
    return { weeklyData: data, weekLabels: labels };
  }, [trades]);

  const draw = useCallback(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;
    canvas.width = canvas.offsetWidth * 2;
    canvas.height = canvas.offsetHeight * 2;
    ctx.scale(2, 2);
    const w = canvas.offsetWidth, h = canvas.offsetHeight;
    const mouse = mouseRef.current;
    ctx.fillStyle = 'hsl(220, 20%, 7%)';
    ctx.fillRect(0, 0, w, h);
    const max = Math.max(...weeklyData, 1);
    const ml = 25, mr = 5, mt = 5, mb = 15;
    const cw = w - ml - mr, ch = h - mt - mb;
    const barW = cw / weeklyData.length;
    let hoveredIdx = -1;
    if (mouse && mouse.x >= ml && mouse.x <= w - mr) {
      hoveredIdx = Math.floor((mouse.x - ml) / barW);
      if (hoveredIdx >= weeklyData.length) hoveredIdx = weeklyData.length - 1;
    }
    weeklyData.forEach((v, i) => {
      const x = ml + i * barW + 2;
      const barH = (v / max) * ch;
      const y = mt + ch - barH;
      const isHovered = i === hoveredIdx;
      ctx.globalAlpha = isHovered ? 1 : 0.7;
      ctx.fillStyle = `hsla(30, 100%, 50%, ${0.4 + (v / max) * 0.6})`;
      ctx.fillRect(x, y, barW - 4, barH);
      ctx.globalAlpha = 1;
      if (isHovered) {
        ctx.strokeStyle = 'hsl(210, 20%, 95%)';
        ctx.lineWidth = 1;
        ctx.strokeRect(x, y, barW - 4, barH);
      }
    });
    const avg = weeklyData.reduce((s, v) => s + v, 0) / weeklyData.length;
    const avgY = mt + ch - (avg / max) * ch;
    ctx.strokeStyle = 'hsl(145, 75%, 70%)';
    ctx.lineWidth = 1;
    ctx.setLineDash([3, 3]);
    ctx.beginPath(); ctx.moveTo(ml, avgY); ctx.lineTo(w - mr, avgY); ctx.stroke();
    ctx.setLineDash([]);
    ctx.fillStyle = 'hsl(215, 10%, 35%)';
    ctx.font = '7px "Space Mono", monospace';
    ctx.textAlign = 'left';
    ctx.fillText(`avg: ${avg.toFixed(0)}`, ml, avgY - 3);
    if (hoveredIdx >= 0 && hoveredIdx < weeklyData.length && mouse) {
      const v = weeklyData[hoveredIdx];
      const x = ml + hoveredIdx * barW + barW / 2;
      const barH = (v / max) * ch;
      const barTop = mt + ch - barH;
      const diff = v - avg;
      const tw = 95, th = 28;
      let tx = x + 8, ty = barTop - th - 4;
      if (tx + tw > w - mr) tx = x - tw - 8;
      if (ty < mt) ty = barTop + 8;
      ctx.fillStyle = 'hsla(220, 15%, 11%, 0.95)';
      ctx.fillRect(tx, ty, tw, th);
      ctx.strokeStyle = 'hsl(220, 10%, 25%)';
      ctx.lineWidth = 0.5;
      ctx.strokeRect(tx, ty, tw, th);
      ctx.font = '8px "Space Mono", monospace';
      ctx.textAlign = 'left';
      ctx.fillStyle = 'hsl(30, 100%, 50%)';
      ctx.fillText(weekLabels[hoveredIdx], tx + 6, ty + 12);
      ctx.fillStyle = 'hsl(210, 20%, 95%)';
      ctx.font = 'bold 9px "Space Mono", monospace';
      ctx.fillText(`${v} trades`, tx + 6, ty + 24);
      ctx.fillStyle = diff >= 0 ? 'hsl(145, 75%, 70%)' : 'hsl(0, 80%, 55%)';
      ctx.font = '7px "Space Mono", monospace';
      ctx.textAlign = 'right';
      ctx.fillText(`${diff >= 0 ? '+' : ''}${diff.toFixed(0)} vs avg`, tx + tw - 6, ty + 24);
    }
  }, [weeklyData, weekLabels]);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const handleMove = (e: MouseEvent) => {
      const rect = canvas.getBoundingClientRect();
      mouseRef.current = { x: e.clientX - rect.left, y: e.clientY - rect.top };
      draw();
    };
    const handleLeave = () => { mouseRef.current = null; draw(); };
    draw();
    canvas.addEventListener('mousemove', handleMove);
    canvas.addEventListener('mouseleave', handleLeave);
    window.addEventListener('resize', draw);
    return () => {
      canvas.removeEventListener('mousemove', handleMove);
      canvas.removeEventListener('mouseleave', handleLeave);
      window.removeEventListener('resize', draw);
    };
  }, [draw]);

  return (
    <WidgetShell title="Trade Frequency" icon={<Zap className="w-3.5 h-3.5 text-accent" />} widgetId="tradeFrequency">
      <div className="min-h-[120px] flex-1">
        <canvas ref={canvasRef} className="w-full h-full cursor-crosshair" />
      </div>
      <div className="flex justify-between text-[9px] font-mono mt-1">
        <span className="text-muted-foreground">12 weeks</span>
        <span className="text-muted-foreground">Total: <span className="text-foreground">{weeklyData.reduce((s, v) => s + v, 0)}</span> trades</span>
      </div>
    </WidgetShell>
  );
}

// ── Rules Adherence ──
function RulesAdherenceWidget() {
  const { trades } = useTrades();
  const rules = useMemo(() => {
    const total = trades.length || 1;
    const withMistake = trades.filter(t => t.mistake).length;
    const withStopTag = trades.filter(t => t.tags.includes('Stop Loss')).length;
    // Group by date to count days with >3 trades
    const byDate: Record<string, number> = {};
    trades.forEach(t => { const d = t.date.split(' ')[0]; byDate[d] = (byDate[d] || 0) + 1; });
    const daysUnder3 = Object.values(byDate).filter(c => c <= 3).length;
    const totalDays = Object.keys(byDate).length || 1;
    const revengeTrades = trades.filter(t => t.mistake === 'Revenge Trading').length;
    const mistakeTrades = trades.filter(t => t.mistake).length;

    return [
      { rule: 'Stop loss placed', adherence: Math.round((withStopTag / total) * 100) },
      { rule: 'No mistakes', adherence: Math.round(((total - mistakeTrades) / total) * 100) },
      { rule: 'No revenge trades', adherence: Math.round(((total - revengeTrades) / total) * 100) },
      { rule: 'Max 3 trades/day', adherence: Math.round((daysUnder3 / totalDays) * 100) },
      { rule: 'A/A+ setups only', adherence: Math.round((trades.filter(t => t.setup === 'A+' || t.setup === 'A').length / total) * 100) },
    ];
  }, [trades]);

  return (
    <WidgetShell title="Rules Adherence" icon={<Target className="w-3.5 h-3.5 text-accent" />} widgetId="rulesAdherence">
      <div className="space-y-2">
        {rules.map(r => (
          <div key={r.rule}>
            <div className="flex items-center justify-between text-[9px] font-mono mb-0.5">
              <span className="text-muted-foreground truncate mr-2">{r.rule}</span>
              <span className={r.adherence >= 90 ? 'text-positive' : r.adherence >= 70 ? 'text-accent' : 'text-negative'}>
                {r.adherence}%
              </span>
            </div>
            <div className="h-1.5 bg-surface-elevated border border-border overflow-hidden">
              <div
                className="h-full transition-all"
                style={{
                  width: `${r.adherence}%`,
                  background: r.adherence >= 90 ? 'hsl(var(--positive))' : r.adherence >= 70 ? 'hsl(var(--accent))' : 'hsl(var(--negative))',
                }}
              />
            </div>
          </div>
        ))}
        <div className="text-[8px] text-muted-foreground text-right pt-1 border-t border-border">
          Overall: <span className="text-accent font-bold">
            {Math.round(rules.reduce((s, r) => s + r.adherence, 0) / rules.length)}%
          </span>
        </div>
      </div>
    </WidgetShell>
  );
}

// ── Quick Metrics ──
function QuickMetricsWidget() {
  const { trades } = useTrades();
  const { privacyMode } = usePrivacy();
  const pm = privacyMode;
  const fmtD = (v: number) => pm ? '•••••' : `${v >= 0 ? '+' : ''}$${v.toFixed(0)}`;
  const metrics = useMemo(() => {
    const now = new Date();
    const today = now.toISOString().split('T')[0];
    const weekAgo = new Date(now); weekAgo.setDate(weekAgo.getDate() - 7);
    const monthStart = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}`;

    const todayTrades = trades.filter(t => t.date.split(' ')[0] === today);
    const todayWins = todayTrades.filter(t => t.pnl > 0).length;
    const todayLosses = todayTrades.filter(t => t.pnl < 0).length;
    const todayPnl = calcTotalPnl(todayTrades);
    const weekTrades = trades.filter(t => new Date(t.date.replace(' ', 'T')) >= weekAgo);
    const weekPnl = calcTotalPnl(weekTrades);
    const mtdTrades = trades.filter(t => t.date.startsWith(monthStart));
    const bestTrade = trades.length ? Math.max(...trades.map(t => t.pnl)) : 0;

    return [
      { label: 'Trades Today', value: String(todayTrades.length), sub: `${todayWins}W ${todayLosses}L` },
      { label: 'Today P&L', value: fmtD(todayPnl), cls: todayPnl >= 0 ? 'text-positive' : 'text-negative' },
      { label: 'Week P&L', value: fmtD(weekPnl), cls: weekPnl >= 0 ? 'text-positive' : 'text-negative' },
      { label: 'Best Trade', value: pm ? '•••••' : `+$${bestTrade.toFixed(0)}`, cls: 'text-positive' },
      { label: 'Total Fees', value: pm ? '•••••' : `$${calcTotalFees(trades).toFixed(0)}`, cls: 'text-accent' },
      { label: 'Trades MTD', value: String(mtdTrades.length) },
    ];
  }, [trades, pm]);

  return (
    <WidgetShell title="Quick Metrics" icon={<Zap className="w-3.5 h-3.5 text-accent" />} widgetId="quickMetrics">
      <div className="space-y-1.5">
        {metrics.map(m => (
          <div key={m.label} className="flex items-center justify-between text-[9px] font-mono py-0.5 border-b border-border/50 last:border-0">
            <span className="text-muted-foreground">{m.label}</span>
            <div className="text-right">
              <span className={`font-bold ${m.cls || 'text-foreground'}`}>{m.value}</span>
              {m.sub && <span className="text-muted-foreground ml-1.5">{m.sub}</span>}
            </div>
          </div>
        ))}
      </div>
    </WidgetShell>
  );
}

// ── Recent Trades ──
function RecentTradesWidget() {
  const { trades } = useTrades();
  const { privacyMode } = usePrivacy();
  const recentTrades = trades.slice(0, 5);
  return (
    <WidgetShell title="Recent Trades" icon={<BarChart3 className="w-3.5 h-3.5 text-accent" />} widgetId="recentTrades">
      <div className="overflow-x-auto -mx-3">
        <table className="w-full">
          <thead>
            <tr>
              {['Date', 'Symbol', 'Side', 'Entry', 'Exit', 'P&L', 'R:R', 'Tags'].map(h => (
                <th key={h} className="px-2 py-1.5 text-left text-[9px] text-accent uppercase font-mono font-bold tracking-wide border-b border-border">{h}</th>
              ))}
            </tr>
          </thead>
          <tbody>
            {recentTrades.map(trade => (
              <tr key={trade.id} className="hover:bg-surface-elevated transition-colors border-b border-grid-line">
                <td className="px-2 py-1.5 text-[10px] font-mono">{trade.date.split(' ')[0]}</td>
                <td className="px-2 py-1.5 text-[10px] font-mono font-bold">{trade.symbol}</td>
                <td className={`px-2 py-1.5 text-[10px] font-mono ${
                  trade.side === 'LONG' || trade.side === 'CALL' ? 'text-positive' : 'text-negative'
                }`}>{trade.side}</td>
                <td className="px-2 py-1.5 text-[10px] font-mono">{privacyMode ? '•••' : `$${trade.entry.toFixed(2)}`}</td>
                <td className="px-2 py-1.5 text-[10px] font-mono">{privacyMode ? '•••' : `$${trade.exit.toFixed(2)}`}</td>
                <td className={`px-2 py-1.5 text-[10px] font-mono font-bold ${trade.pnl >= 0 ? 'text-positive' : 'text-negative'}`}>
                  {privacyMode ? '•••••' : `${trade.pnl >= 0 ? '+' : ''}$${trade.pnl.toFixed(2)}`}
                </td>
                <td className="px-2 py-1.5 text-[10px] font-mono">{trade.rr}</td>
                <td className="px-2 py-1.5">
                  {trade.tags.map(tag => (
                    <span key={tag} className="inline-block px-1.5 py-0.5 bg-surface-elevated border border-border text-[8px] mr-0.5 mb-0.5 font-body">{tag}</span>
                  ))}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </WidgetShell>
  );
}

// ── P&L by Setup Grade ──
function PnlBySetupWidget() {
  const { trades } = useTrades();
  const { privacyMode } = usePrivacy();
  const setups = useMemo(() => {
    const grades: Record<string, { pnl: number; count: number; wins: number }> = {};
    trades.forEach(t => {
      if (!grades[t.setup]) grades[t.setup] = { pnl: 0, count: 0, wins: 0 };
      grades[t.setup].pnl += t.pnl;
      grades[t.setup].count++;
      if (t.pnl > 0) grades[t.setup].wins++;
    });
    return ['A+', 'A', 'B', 'C'].map(g => ({
      grade: g,
      pnl: grades[g]?.pnl || 0,
      count: grades[g]?.count || 0,
      wr: grades[g] ? Math.round((grades[g].wins / grades[g].count) * 100) : 0,
    }));
  }, [trades]);
  const maxPnl = Math.max(...setups.map(s => Math.abs(s.pnl)), 1);

  return (
    <WidgetShell title="P&L by Setup" icon={<Target className="w-3.5 h-3.5 text-accent" />} widgetId="pnlBySetup">
      <div className="space-y-3">
        {setups.map(s => (
          <div key={s.grade}>
            <div className="flex items-center justify-between text-[10px] font-mono mb-0.5">
              <span className="font-bold">{s.grade} Setup</span>
              <span className={s.pnl >= 0 ? 'text-positive' : 'text-negative'}>
                {privacyMode ? '•••••' : `${s.pnl >= 0 ? '+' : ''}$${s.pnl.toLocaleString()}`}
              </span>
            </div>
            <div className="h-2 bg-surface-elevated border border-border overflow-hidden">
              <div className="h-full" style={{ width: `${(Math.abs(s.pnl) / maxPnl) * 100}%`, background: s.pnl >= 0 ? 'hsl(var(--positive))' : 'hsl(var(--negative))' }} />
            </div>
            <div className="flex justify-between text-[8px] text-muted-foreground mt-0.5">
              <span>{s.count} trades</span><span>WR: {s.wr}%</span>
            </div>
          </div>
        ))}
      </div>
    </WidgetShell>
  );
}

// ── Largest Trades ──
function LargestTradesWidget() {
  const { trades } = useTrades();
  const { privacyMode } = usePrivacy();
  const largest = useMemo(() => {
    return [...trades].sort((a, b) => Math.abs(b.pnl) - Math.abs(a.pnl)).slice(0, 8);
  }, [trades]);

  return (
    <WidgetShell title="Largest Trades" icon={<TrendingUp className="w-3.5 h-3.5 text-accent" />} widgetId="largestTrades">
      <div className="space-y-1">
        {largest.map((t, i) => (
          <div key={t.id} className="flex items-center gap-2 text-[9px] font-mono py-1 border-b border-border/50 last:border-0">
            <span className="text-muted-foreground w-4 text-right">#{i + 1}</span>
            <span className="font-bold w-12">{t.symbol}</span>
            <span className={`text-[8px] px-1 ${t.side === 'LONG' || t.side === 'CALL' ? 'bg-positive/20 text-positive' : 'bg-negative/20 text-negative'}`}>{t.side}</span>
            <span className="text-muted-foreground flex-1">{t.date.split(' ')[0]}</span>
            <span className={`font-bold ${t.pnl >= 0 ? 'text-positive' : 'text-negative'}`}>
              {privacyMode ? '•••••' : `${t.pnl >= 0 ? '+' : ''}$${t.pnl.toLocaleString()}`}
            </span>
          </div>
        ))}
        {largest.length === 0 && <div className="text-[10px] text-muted-foreground">No trades yet</div>}
      </div>
    </WidgetShell>
  );
}

// ── Time of Day P&L ──
function TimeOfDayWidget() {
  const { trades } = useTrades();
  const { privacyMode } = usePrivacy();
  const hourData = useMemo(() => {
    const buckets: Record<string, { pnl: number; count: number }> = {};
    const labels = ['Pre-Mkt (4-9)', 'Open (9-10)', 'Morning (10-12)', 'Midday (12-14)', 'Afternoon (14-16)', 'Close (16-17)'];
    const ranges = [[4, 9], [9, 10], [10, 12], [12, 14], [14, 16], [16, 17]];
    labels.forEach(l => { buckets[l] = { pnl: 0, count: 0 }; });
    trades.forEach(t => {
      const d = new Date(t.date.replace(' ', 'T'));
      const h = d.getHours();
      for (let i = 0; i < ranges.length; i++) {
        if (h >= ranges[i][0] && h < ranges[i][1]) {
          buckets[labels[i]].pnl += t.pnl;
          buckets[labels[i]].count++;
          break;
        }
      }
    });
    return labels.map(l => ({ label: l, ...buckets[l] }));
  }, [trades]);
  const maxPnl = Math.max(...hourData.map(d => Math.abs(d.pnl)), 1);

  return (
    <WidgetShell title="Time of Day P&L" icon={<Clock className="w-3.5 h-3.5 text-accent" />} widgetId="timeOfDay">
      <div className="space-y-2">
        {hourData.map(d => (
          <div key={d.label}>
            <div className="flex items-center justify-between text-[9px] font-mono mb-0.5">
              <span className="text-muted-foreground truncate mr-2">{d.label}</span>
              <span className={d.pnl >= 0 ? 'text-positive' : 'text-negative'}>
                {privacyMode ? '•••••' : `${d.pnl >= 0 ? '+' : ''}$${d.pnl.toFixed(0)}`}
              </span>
            </div>
            <div className="h-1.5 bg-surface-elevated border border-border overflow-hidden">
              <div className="h-full" style={{ width: `${(Math.abs(d.pnl) / maxPnl) * 100}%`, background: d.pnl >= 0 ? 'hsl(var(--positive))' : 'hsl(var(--negative))' }} />
            </div>
            <div className="text-[7px] text-muted-foreground text-right mt-0.5">{d.count} trades</div>
          </div>
        ))}
      </div>
    </WidgetShell>
  );
}

// ── R-Multiple Distribution ──
function RMultipleWidget() {
  const { trades } = useTrades();
  const rDist = useMemo(() => {
    const buckets = [
      { label: '<-3R', min: -Infinity, max: -3, count: 0 },
      { label: '-3 to -2R', min: -3, max: -2, count: 0 },
      { label: '-2 to -1R', min: -2, max: -1, count: 0 },
      { label: '-1 to 0R', min: -1, max: 0, count: 0 },
      { label: '0 to 1R', min: 0, max: 1, count: 0 },
      { label: '1 to 2R', min: 1, max: 2, count: 0 },
      { label: '2 to 3R', min: 2, max: 3, count: 0 },
      { label: '>3R', min: 3, max: Infinity, count: 0 },
    ];
    trades.forEach(t => {
      const rVal = parseFloat(t.rr) || 0;
      const r = t.pnl >= 0 ? rVal : -rVal;
      for (const b of buckets) {
        if (r >= b.min && r < b.max) { b.count++; break; }
      }
    });
    return buckets;
  }, [trades]);
  const maxCount = Math.max(...rDist.map(b => b.count), 1);

  return (
    <WidgetShell title="R-Multiple Dist." icon={<Activity className="w-3.5 h-3.5 text-accent" />} widgetId="rMultiple">
      <div className="space-y-1">
        {rDist.map(b => (
          <div key={b.label} className="flex items-center gap-2 text-[9px] font-mono">
            <span className="text-muted-foreground w-16 text-right">{b.label}</span>
            <div className="flex-1 h-3 bg-surface-elevated border border-border overflow-hidden">
              <div className="h-full" style={{
                width: `${(b.count / maxCount) * 100}%`,
                background: b.min >= 0 ? 'hsl(var(--positive))' : 'hsl(var(--negative))',
              }} />
            </div>
            <span className="text-foreground w-4 text-right">{b.count}</span>
          </div>
        ))}
        <div className="text-[8px] text-muted-foreground text-center pt-1 border-t border-border">
          Avg R: <span className="text-accent font-bold">
            {trades.length ? (trades.reduce((s, t) => s + (t.pnl >= 0 ? parseFloat(t.rr) || 0 : -(parseFloat(t.rr) || 0)), 0) / trades.length).toFixed(2) : '0.00'}R
          </span>
        </div>
      </div>
    </WidgetShell>
  );
}

// ── Consecutive Win/Loss ──
function ConsecWinLossWidget() {
  const { trades } = useTrades();
  const stats = useMemo(() => {
    const sorted = [...trades].sort((a, b) => a.date.localeCompare(b.date));
    let maxWin = 0, maxLoss = 0, curWin = 0, curLoss = 0;
    sorted.forEach(t => {
      if (t.pnl > 0) { curWin++; curLoss = 0; maxWin = Math.max(maxWin, curWin); }
      else { curLoss++; curWin = 0; maxLoss = Math.max(maxLoss, curLoss); }
    });
    // Current streak
    let current = 0, currentType = '';
    for (let i = sorted.length - 1; i >= 0; i--) {
      if (i === sorted.length - 1) {
        currentType = sorted[i].pnl > 0 ? 'W' : 'L';
        current = 1;
      } else if ((sorted[i].pnl > 0 ? 'W' : 'L') === currentType) {
        current++;
      } else break;
    }
    return { maxWin, maxLoss, current, currentType };
  }, [trades]);

  return (
    <WidgetShell title="Consec. Win/Loss" icon={<Flame className="w-3.5 h-3.5 text-accent" />} widgetId="consecWinLoss">
      <div className="space-y-3">
        <div className="grid grid-cols-2 gap-2">
          <div className="border border-border p-2 text-center">
            <div className="text-[8px] font-mono text-muted-foreground uppercase">Max Win Streak</div>
            <div className="text-lg font-mono font-bold text-positive">{stats.maxWin}</div>
          </div>
          <div className="border border-border p-2 text-center">
            <div className="text-[8px] font-mono text-muted-foreground uppercase">Max Loss Streak</div>
            <div className="text-lg font-mono font-bold text-negative">{stats.maxLoss}</div>
          </div>
        </div>
        <div className="border border-border p-2 text-center">
          <div className="text-[8px] font-mono text-muted-foreground uppercase">Current Streak</div>
          <div className={`text-lg font-mono font-bold ${stats.currentType === 'W' ? 'text-positive' : 'text-negative'}`}>
            {stats.current}{stats.currentType || '—'}
          </div>
        </div>
        <div className="flex justify-between text-[8px] font-mono text-muted-foreground border-t border-border pt-1">
          <span>Based on {trades.length} trades</span>
          <span className="text-accent">Chronological order</span>
        </div>
      </div>
    </WidgetShell>
  );
}
