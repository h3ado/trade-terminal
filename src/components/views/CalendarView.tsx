import { useMemo, useState } from 'react';
import ViewHeader from '@/components/ViewHeader';
import { ChevronLeft, ChevronRight, TrendingUp, TrendingDown, Target, BarChart3, Flame } from 'lucide-react';
import { useTrades } from '@/contexts/TradeContext';
import { usePrivacy } from '@/contexts/PrivacyContext';
import { calcTotalPnl, calcWinRate, calcProfitFactor, calcExpectancy, calcMaxDrawdown, Trade } from '@/types/trade';

export default function CalendarView() {
  const { trades } = useTrades();
  const { privacyMode } = usePrivacy();
  const pm = privacyMode;
  const [monthOffset, setMonthOffset] = useState(0);
  const [selectedDay, setSelectedDay] = useState<number | null>(null);
  const [viewMode, setViewMode] = useState<'month' | 'week'>('month');

  const calData = useMemo(() => {
    const now = new Date();
    const targetDate = new Date(now.getFullYear(), now.getMonth() + monthOffset, 1);
    const year = targetDate.getFullYear();
    const month = targetDate.getMonth();
    const firstDay = new Date(year, month, 1).getDay();
    const daysInMonth = new Date(year, month + 1, 0).getDate();
    const todayDate = new Date();
    const isCurrentMonth = todayDate.getFullYear() === year && todayDate.getMonth() === month;
    const today = isCurrentMonth ? todayDate.getDate() : -1;

    // Group trades by day with detailed info
    const dailyMap: Record<number, {
      pnl: number; count: number; wins: number; losses: number;
      symbols: Set<string>; trades: Trade[];
      totalFees: number; bestTrade: number; worstTrade: number;
      types: Set<string>; strategies: Set<string>;
      avgRR: number; leveragedTrades: number;
    }> = {};

    trades.forEach(t => {
      const d = new Date(t.date.replace(' ', 'T'));
      if (d.getFullYear() === year && d.getMonth() === month) {
        const day = d.getDate();
        if (!dailyMap[day]) dailyMap[day] = {
          pnl: 0, count: 0, wins: 0, losses: 0,
          symbols: new Set(), trades: [],
          totalFees: 0, bestTrade: -Infinity, worstTrade: Infinity,
          types: new Set(), strategies: new Set(),
          avgRR: 0, leveragedTrades: 0,
        };
        dailyMap[day].pnl += t.pnl;
        dailyMap[day].count++;
        dailyMap[day].symbols.add(t.symbol);
        dailyMap[day].trades.push(t);
        dailyMap[day].totalFees += t.fees + (t.commission || 0) + (t.swap || 0);
        dailyMap[day].bestTrade = Math.max(dailyMap[day].bestTrade, t.pnl);
        dailyMap[day].worstTrade = Math.min(dailyMap[day].worstTrade, t.pnl);
        dailyMap[day].types.add(t.type);
        dailyMap[day].strategies.add(t.strategy);
        if (t.leverage) dailyMap[day].leveragedTrades++;
        if (t.pnl > 0) dailyMap[day].wins++;
        else dailyMap[day].losses++;
      }
    });

    // Calculate avg R:R per day
    Object.values(dailyMap).forEach(d => {
      const rrs = d.trades.map(t => parseFloat(t.rr) || 0);
      d.avgRR = rrs.length ? rrs.reduce((s, r) => s + r, 0) / rrs.length : 0;
    });

    // Build calendar grid
    const cells: {
      day: number; weekend: boolean; today: boolean;
      pnl?: number; trades?: number; wins?: number; losses?: number;
      symbols?: string[]; totalFees?: number; bestTrade?: number; worstTrade?: number;
      types?: string[]; avgRR?: number; dayTrades?: Trade[];
    }[] = [];
    for (let i = 0; i < firstDay; i++) cells.push({ day: 0, weekend: false, today: false });
    for (let d = 1; d <= daysInMonth; d++) {
      const dow = new Date(year, month, d).getDay();
      cells.push({
        day: d,
        weekend: dow === 0 || dow === 6,
        today: d === today,
        pnl: dailyMap[d]?.pnl,
        trades: dailyMap[d]?.count,
        wins: dailyMap[d]?.wins,
        losses: dailyMap[d]?.losses,
        symbols: dailyMap[d]?.symbols ? Array.from(dailyMap[d].symbols) : undefined,
        totalFees: dailyMap[d]?.totalFees,
        bestTrade: dailyMap[d]?.bestTrade === -Infinity ? undefined : dailyMap[d]?.bestTrade,
        worstTrade: dailyMap[d]?.worstTrade === Infinity ? undefined : dailyMap[d]?.worstTrade,
        types: dailyMap[d]?.types ? Array.from(dailyMap[d].types) : undefined,
        avgRR: dailyMap[d]?.avgRR,
        dayTrades: dailyMap[d]?.trades,
      });
    }

    const monthTrades = trades.filter(t => {
      const d = new Date(t.date.replace(' ', 'T'));
      return d.getFullYear() === year && d.getMonth() === month;
    });

    const tradingDays = Object.keys(dailyMap).length;
    const profitDays = Object.values(dailyMap).filter(d => d.pnl > 0).length;
    const lossDays = Object.values(dailyMap).filter(d => d.pnl < 0).length;
    const avgDaily = tradingDays > 0 ? calcTotalPnl(monthTrades) / tradingDays : 0;
    const totalPnl = calcTotalPnl(monthTrades);
    const winRate = calcWinRate(monthTrades);
    const totalTradesCount = monthTrades.length;
    const profitFactor = calcProfitFactor(monthTrades);
    const expectancy = calcExpectancy(monthTrades);
    const maxDrawdown = calcMaxDrawdown(monthTrades);
    const totalFees = monthTrades.reduce((s, t) => s + t.fees + (t.commission || 0) + (t.swap || 0), 0);

    // Best and worst days
    const dayEntries = Object.entries(dailyMap);
    const bestDayEntry = dayEntries.length ? dayEntries.reduce((a, b) => a[1].pnl > b[1].pnl ? a : b) : null;
    const worstDayEntry = dayEntries.length ? dayEntries.reduce((a, b) => a[1].pnl < b[1].pnl ? a : b) : null;

    // Weekly summaries
    const weeks: { weekNum: number; pnl: number; trades: number; wins: number; losses: number; fees: number; bestDay: number; worstDay: number }[] = [];
    let weekPnl = 0, weekTrades = 0, weekWins = 0, weekLosses = 0, weekNum = 1, weekFees = 0, weekBest = -Infinity, weekWorst = Infinity;
    for (let d = 1; d <= daysInMonth; d++) {
      const dow = new Date(year, month, d).getDay();
      if (dailyMap[d]) {
        weekPnl += dailyMap[d].pnl;
        weekTrades += dailyMap[d].count;
        weekWins += dailyMap[d].wins;
        weekLosses += dailyMap[d].losses;
        weekFees += dailyMap[d].totalFees;
        weekBest = Math.max(weekBest, dailyMap[d].pnl);
        weekWorst = Math.min(weekWorst, dailyMap[d].pnl);
      }
      if (dow === 6 || d === daysInMonth) {
        if (weekTrades > 0) {
          weeks.push({ weekNum, pnl: weekPnl, trades: weekTrades, wins: weekWins, losses: weekLosses, fees: weekFees, bestDay: weekBest, worstDay: weekWorst });
        }
        weekPnl = 0; weekTrades = 0; weekWins = 0; weekLosses = 0; weekNum++; weekFees = 0; weekBest = -Infinity; weekWorst = Infinity;
      }
    }

    // Streaks within month
    let curStreak = 0, maxWinStreak = 0, maxLossStreak = 0, curType = '';
    for (let d = 1; d <= daysInMonth; d++) {
      if (dailyMap[d]) {
        const type = dailyMap[d].pnl >= 0 ? 'win' : 'loss';
        if (type === curType) curStreak++;
        else { curStreak = 1; curType = type; }
        if (type === 'win') maxWinStreak = Math.max(maxWinStreak, curStreak);
        else maxLossStreak = Math.max(maxLossStreak, curStreak);
      }
    }

    // Daily P&L for sparkline
    const dailyPnls: { day: number; pnl: number }[] = [];
    for (let d = 1; d <= daysInMonth; d++) {
      if (dailyMap[d]) dailyPnls.push({ day: d, pnl: dailyMap[d].pnl });
    }

    // Cumulative P&L
    let cumPnl = 0;
    const cumulativePnl = dailyPnls.map(dp => {
      cumPnl += dp.pnl;
      return { day: dp.day, pnl: dp.pnl, cumPnl };
    });

    // Instrument breakdown
    const typeBreakdown: Record<string, { count: number; pnl: number }> = {};
    monthTrades.forEach(t => {
      if (!typeBreakdown[t.type]) typeBreakdown[t.type] = { count: 0, pnl: 0 };
      typeBreakdown[t.type].count++;
      typeBreakdown[t.type].pnl += t.pnl;
    });

    const monthNames = ['January', 'February', 'March', 'April', 'May', 'June', 'July', 'August', 'September', 'October', 'November', 'December'];

    return {
      cells, monthName: monthNames[month], year, profitDays, lossDays, tradingDays, avgDaily, totalPnl,
      winRate, totalTradesCount, bestDay: bestDayEntry, worstDay: worstDayEntry,
      weeks, maxWinStreak, maxLossStreak, profitFactor, expectancy, maxDrawdown, totalFees,
      dailyPnls, cumulativePnl, typeBreakdown, dailyMap,
    };
  }, [trades, monthOffset]);

  // Selected day details
  const selectedDayData = useMemo(() => {
    if (!selectedDay || !calData.dailyMap[selectedDay]) return null;
    const d = calData.dailyMap[selectedDay];
    return {
      pnl: d.pnl, count: d.count, wins: d.wins, losses: d.losses,
      trades: d.trades, totalFees: d.totalFees,
      bestTrade: d.bestTrade, worstTrade: d.worstTrade,
      winRate: d.count > 0 ? (d.wins / d.count) * 100 : 0,
      symbols: Array.from(d.symbols),
      types: Array.from(d.types),
      strategies: Array.from(d.strategies),
    };
  }, [selectedDay, calData.dailyMap]);

  const fmtPnl = (v: number) => pm ? '•••••' : `${v >= 0 ? '+' : ''}$${v.toFixed(0)}`;

  return (
    <div>
      <div className="flex justify-between items-center mb-3 pb-2 border-b border-border">
        <h2 className="text-[13px] text-accent uppercase tracking-wider font-mono">Trading Calendar</h2>
        <div className="flex items-center gap-3">
          <ViewHeader />
          <button onClick={() => setMonthOffset(o => o - 1)} className="p-1 text-muted-foreground hover:text-accent transition-colors">
            <ChevronLeft className="w-4 h-4" />
          </button>
          <span className="text-[12px] font-mono font-bold min-w-[140px] text-center">
            {calData.monthName} {calData.year}
          </span>
          <button onClick={() => setMonthOffset(o => o + 1)} className="p-1 text-muted-foreground hover:text-accent transition-colors">
            <ChevronRight className="w-4 h-4" />
          </button>
          {monthOffset !== 0 && (
            <button onClick={() => setMonthOffset(0)} className="text-[10px] font-mono text-accent hover:underline">TODAY</button>
          )}
        </div>
      </div>

      {/* Stats row - enhanced */}
      <div className="grid grid-cols-2 lg:grid-cols-5 xl:grid-cols-10 gap-2 mb-4">
        {[
          { label: 'Monthly P&L', value: fmtPnl(calData.totalPnl), valueClass: calData.totalPnl >= 0 ? 'text-positive' : 'text-negative', type: calData.totalPnl >= 0 ? 'positive' as const : 'negative' as const },
          { label: 'Win Rate', value: `${calData.winRate.toFixed(1)}%`, valueClass: calData.winRate >= 50 ? 'text-positive' : 'text-negative' },
          { label: 'Trades', value: String(calData.totalTradesCount) },
          { label: 'Profit Days', value: `${calData.profitDays}/${calData.tradingDays}`, type: 'positive' as const },
          { label: 'Loss Days', value: `${calData.lossDays}/${calData.tradingDays}`, type: 'negative' as const },
          { label: 'Avg Daily', value: fmtPnl(calData.avgDaily), valueClass: calData.avgDaily >= 0 ? 'text-positive' : 'text-negative' },
          { label: 'Profit Factor', value: calData.profitFactor === Infinity ? '∞' : calData.profitFactor.toFixed(2) },
          { label: 'Max Drawdown', value: pm ? '•••' : `$${calData.maxDrawdown.toFixed(0)}`, type: 'negative' as const },
          { label: 'Win Streak', value: `${calData.maxWinStreak}d`, type: 'positive' as const },
          { label: 'Total Fees', value: pm ? '•••' : `$${calData.totalFees.toFixed(0)}` },
        ].map((s, i) => (
          <div key={i} className={`bg-card border border-border p-2.5 relative ${
            s.type === 'positive' ? 'stat-bar-positive-top' : s.type === 'negative' ? 'stat-bar-negative-top' : 'stat-bar-accent-top'
          }`}>
            <div className="text-data-muted text-[9px] uppercase tracking-wide mb-0.5 font-body">{s.label}</div>
            <div className={`text-sm font-bold font-mono ${s.valueClass || ''}`}>{s.value}</div>
          </div>
        ))}
      </div>

      {/* Instrument Type Breakdown */}
      {Object.keys(calData.typeBreakdown).length > 1 && (
        <div className="flex gap-2 mb-3 flex-wrap">
          {Object.entries(calData.typeBreakdown).map(([type, data]) => (
            <div key={type} className="bg-card border border-border px-3 py-1.5 flex items-center gap-2">
              <span className="text-[10px] font-mono font-bold text-accent uppercase">{type}</span>
              <span className="text-[9px] font-mono text-muted-foreground">{data.count}</span>
              <span className={`text-[9px] font-mono font-bold ${data.pnl >= 0 ? 'text-positive' : 'text-negative'}`}>
                {fmtPnl(data.pnl)}
              </span>
            </div>
          ))}
        </div>
      )}

      {/* Monthly P&L Sparkline */}
      {calData.cumulativePnl.length > 1 && (
        <div className="bg-card border border-border p-3 mb-4">
          <div className="text-[9px] font-mono text-accent uppercase tracking-wider mb-2">Cumulative P&L</div>
          <div className="h-16 flex items-end gap-0.5">
            {calData.dailyPnls.map((dp, i) => {
              const maxAbs = Math.max(...calData.dailyPnls.map(d => Math.abs(d.pnl)), 1);
              const h = Math.max(2, (Math.abs(dp.pnl) / maxAbs) * 60);
              return (
                <div key={i} className="flex-1 flex flex-col items-center justify-end" title={`Day ${dp.day}: ${dp.pnl >= 0 ? '+' : ''}$${dp.pnl.toFixed(0)}`}>
                  <div
                    style={{ height: `${h}px` }}
                    className={`w-full min-w-[3px] ${dp.pnl >= 0 ? 'bg-positive/70' : 'bg-negative/70'} hover:opacity-100 opacity-80 transition-opacity cursor-pointer`}
                    onClick={() => setSelectedDay(dp.day)}
                  />
                  <span className="text-[6px] font-mono text-muted-foreground mt-0.5">{dp.day}</span>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* Calendar grid */}
      <div className="bg-card border border-border p-4">
        <div className="grid grid-cols-7 gap-2 mb-3">
          {['SUN', 'MON', 'TUE', 'WED', 'THU', 'FRI', 'SAT'].map(d => (
            <div key={d} className="text-center text-accent font-bold text-[10px] py-1.5 font-mono">{d}</div>
          ))}
        </div>
        <div className="grid grid-cols-7 gap-2">
          {calData.cells.map((cell, i) => {
            if (cell.day === 0) return <div key={`empty-${i}`} />;
            let bg = 'bg-surface-primary';
            let borderClass = 'border-border';
            if (cell.pnl !== undefined) {
              if (cell.pnl > 500) { bg = 'bg-positive/15'; borderClass = 'border-positive'; }
              else if (cell.pnl > 0) { bg = 'bg-positive/5'; borderClass = 'border-positive/30'; }
              else if (cell.pnl < -500) { bg = 'bg-negative/15'; borderClass = 'border-negative'; }
              else if (cell.pnl < 0) { bg = 'bg-negative/5'; borderClass = 'border-negative/30'; }
            }
            if (cell.today) { borderClass = 'border-accent border-2'; }
            if (cell.weekend && cell.pnl === undefined) { bg = 'bg-surface-elevated'; }
            const isSelected = selectedDay === cell.day;

            const isBestDay = calData.bestDay && parseInt(calData.bestDay[0]) === cell.day;
            const isWorstDay = calData.worstDay && parseInt(calData.worstDay[0]) === cell.day;

            return (
              <div
                key={cell.day}
                onClick={() => cell.trades ? setSelectedDay(isSelected ? null : cell.day) : undefined}
                className={`min-h-[100px] ${bg} border ${borderClass} p-2 relative transition-all ${
                  cell.trades ? 'cursor-pointer hover:border-accent/50' : ''
                } ${isSelected ? 'ring-1 ring-accent' : ''}`}
              >
                <div className={`text-[10px] font-mono font-bold flex items-center gap-1 ${cell.weekend ? 'text-muted-foreground' : ''}`}>
                  {cell.day}{cell.today ? <span className="text-accent text-[8px]">TODAY</span> : ''}
                  {isBestDay && <span className="text-[7px] text-positive">★</span>}
                  {isWorstDay && <span className="text-[7px] text-negative">★</span>}
                </div>
                {cell.pnl !== undefined && (
                  <>
                    <div className={`text-[12px] font-mono font-bold mt-1 ${cell.pnl >= 0 ? 'text-positive' : 'text-negative'}`}>
                      {fmtPnl(cell.pnl)}
                    </div>
                    <div className="text-[9px] text-muted-foreground font-body">
                      {cell.trades} trade{cell.trades !== 1 ? 's' : ''}
                    </div>
                    <div className="text-[8px] font-mono mt-0.5">
                      <span className="text-positive">{cell.wins}W</span>
                      <span className="text-muted-foreground">/</span>
                      <span className="text-negative">{cell.losses}L</span>
                    </div>
                    {cell.types && cell.types.length > 0 && (
                      <div className="flex gap-0.5 mt-0.5 flex-wrap">
                        {cell.types.map(type => (
                          <span key={type} className="text-[6px] font-mono px-1 py-0 bg-surface-elevated border border-border text-muted-foreground uppercase">
                            {type.slice(0, 3)}
                          </span>
                        ))}
                      </div>
                    )}
                    {cell.symbols && cell.symbols.length > 0 && (
                      <div className="text-[7px] text-muted-foreground font-mono mt-0.5 truncate">
                        {cell.symbols.slice(0, 3).join(' ')}
                        {cell.symbols.length > 3 && ` +${cell.symbols.length - 3}`}
                      </div>
                    )}
                    {cell.totalFees && cell.totalFees > 0 && (
                      <div className="text-[7px] text-muted-foreground font-mono mt-0.5">
                        Fees: ${cell.totalFees.toFixed(0)}
                      </div>
                    )}
                  </>
                )}
              </div>
            );
          })}
        </div>
      </div>

      {/* Selected Day Detail Panel */}
      {selectedDayData && selectedDay && (
        <div className="mt-4 bg-card border border-accent/30 p-4">
          <div className="flex justify-between items-center mb-3">
            <h3 className="text-accent text-[12px] font-mono font-bold uppercase">
              {calData.monthName} {selectedDay} — Day Detail
            </h3>
            <button onClick={() => setSelectedDay(null)} className="text-muted-foreground hover:text-foreground text-[10px] font-mono">
              Close ✕
            </button>
          </div>

          <div className="grid grid-cols-3 lg:grid-cols-6 gap-2 mb-3">
            <div className="bg-surface-elevated border border-border p-2">
              <div className="text-[8px] text-muted-foreground uppercase font-body">P&L</div>
              <div className={`text-sm font-bold font-mono ${selectedDayData.pnl >= 0 ? 'text-positive' : 'text-negative'}`}>
                {fmtPnl(selectedDayData.pnl)}
              </div>
            </div>
            <div className="bg-surface-elevated border border-border p-2">
              <div className="text-[8px] text-muted-foreground uppercase font-body">Win Rate</div>
              <div className={`text-sm font-bold font-mono ${selectedDayData.winRate >= 50 ? 'text-positive' : 'text-negative'}`}>
                {selectedDayData.winRate.toFixed(0)}%
              </div>
            </div>
            <div className="bg-surface-elevated border border-border p-2">
              <div className="text-[8px] text-muted-foreground uppercase font-body">Trades</div>
              <div className="text-sm font-bold font-mono">{selectedDayData.count}</div>
            </div>
            <div className="bg-surface-elevated border border-border p-2">
              <div className="text-[8px] text-muted-foreground uppercase font-body">Best Trade</div>
              <div className="text-sm font-bold font-mono text-positive">
                {pm ? '•••' : `+$${selectedDayData.bestTrade.toFixed(0)}`}
              </div>
            </div>
            <div className="bg-surface-elevated border border-border p-2">
              <div className="text-[8px] text-muted-foreground uppercase font-body">Worst Trade</div>
              <div className="text-sm font-bold font-mono text-negative">
                {pm ? '•••' : `$${selectedDayData.worstTrade.toFixed(0)}`}
              </div>
            </div>
            <div className="bg-surface-elevated border border-border p-2">
              <div className="text-[8px] text-muted-foreground uppercase font-body">Fees</div>
              <div className="text-sm font-bold font-mono">{pm ? '•••' : `$${selectedDayData.totalFees.toFixed(2)}`}</div>
            </div>
          </div>

          {/* Day's trade list */}
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="bg-surface-primary">
                  {['Time', 'Symbol', 'Type', 'Side', 'Entry', 'Exit', 'Size', 'P&L', 'Strategy'].map(h => (
                    <th key={h} className="px-2 py-1.5 text-left text-[9px] text-accent uppercase font-mono font-bold border-b border-border">{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {selectedDayData.trades.map((t, i) => (
                  <tr key={i} className="hover:bg-surface-elevated transition-colors border-b border-border/50">
                    <td className="px-2 py-1.5 text-[9px] font-mono">{t.date.split(' ')[1] || '—'}</td>
                    <td className="px-2 py-1.5 text-[9px] font-mono font-bold">{t.symbol}</td>
                    <td className="px-2 py-1.5 text-[9px] font-body">
                      {t.type}
                      {t.leverage && <span className="text-accent ml-0.5">{t.leverage}x</span>}
                    </td>
                    <td className={`px-2 py-1.5 text-[9px] font-mono ${t.side === 'LONG' || t.side === 'CALL' ? 'text-positive' : 'text-negative'}`}>
                      {t.side}
                    </td>
                    <td className="px-2 py-1.5 text-[9px] font-mono">{pm ? '•••' : `$${t.entry.toFixed(2)}`}</td>
                    <td className="px-2 py-1.5 text-[9px] font-mono">{pm ? '•••' : `$${t.exit.toFixed(2)}`}</td>
                    <td className="px-2 py-1.5 text-[9px] font-mono">
                      {pm ? '•' : t.size}
                      {t.contractSize && <span className="text-muted-foreground">×{t.contractSize}</span>}
                    </td>
                    <td className={`px-2 py-1.5 text-[9px] font-mono font-bold ${t.pnl >= 0 ? 'text-positive' : 'text-negative'}`}>
                      {pm ? '•••••' : `${t.pnl >= 0 ? '+' : ''}$${t.pnl.toFixed(2)}`}
                    </td>
                    <td className="px-2 py-1.5 text-[9px] font-body truncate max-w-[80px]">{t.strategy}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Weekly Summary - enhanced */}
      {calData.weeks.length > 0 && (
        <>
          <div className="flex justify-between items-center mt-6 mb-3 pb-2 border-b border-border">
            <h2 className="text-[13px] text-accent uppercase tracking-wider font-mono">Weekly Summary</h2>
          </div>
          <div className="bg-card border border-border overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="bg-surface-primary">
                  {['Week', 'P&L', 'Net (- Fees)', 'Trades', 'W/L', 'Win Rate', 'Best Day', 'Worst Day', 'Fees'].map(h => (
                    <th key={h} className="px-3 py-2.5 text-left text-[10px] text-accent uppercase font-mono font-bold border-b border-border">{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {calData.weeks.map(w => {
                  const wr = w.trades > 0 ? (w.wins / (w.wins + w.losses)) * 100 : 0;
                  const net = w.pnl - w.fees;
                  return (
                    <tr key={w.weekNum} className="hover:bg-surface-elevated transition-colors border-b border-border/50">
                      <td className="px-3 py-2 text-[10px] font-mono font-bold">Week {w.weekNum}</td>
                      <td className={`px-3 py-2 text-[10px] font-mono font-bold ${w.pnl >= 0 ? 'text-positive' : 'text-negative'}`}>
                        {fmtPnl(w.pnl)}
                      </td>
                      <td className={`px-3 py-2 text-[10px] font-mono ${net >= 0 ? 'text-positive' : 'text-negative'}`}>
                        {fmtPnl(net)}
                      </td>
                      <td className="px-3 py-2 text-[10px] font-mono">{w.trades}</td>
                      <td className="px-3 py-2 text-[10px] font-mono">
                        <span className="text-positive">{w.wins}</span>/<span className="text-negative">{w.losses}</span>
                      </td>
                      <td className={`px-3 py-2 text-[10px] font-mono font-bold ${wr >= 50 ? 'text-positive' : 'text-negative'}`}>
                        {wr.toFixed(0)}%
                      </td>
                      <td className="px-3 py-2 text-[10px] font-mono text-positive">
                        {w.bestDay > -Infinity ? fmtPnl(w.bestDay) : '—'}
                      </td>
                      <td className="px-3 py-2 text-[10px] font-mono text-negative">
                        {w.worstDay < Infinity ? fmtPnl(w.worstDay) : '—'}
                      </td>
                      <td className="px-3 py-2 text-[10px] font-mono text-muted-foreground">
                        {pm ? '•••' : `$${w.fees.toFixed(0)}`}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </>
      )}

      {/* Best/Worst Day Detail */}
      {(calData.bestDay || calData.worstDay) && (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mt-6">
          {calData.bestDay && calData.bestDay[1].pnl > 0 && (
            <div className="bg-card border border-positive/30 p-3 stat-bar-positive-top cursor-pointer hover:border-positive transition-colors"
              onClick={() => setSelectedDay(parseInt(calData.bestDay![0]))}>
              <div className="text-positive text-[11px] font-mono font-bold uppercase mb-2">
                <Flame className="w-3.5 h-3.5 inline mr-1" />
                Best Day — {calData.monthName} {calData.bestDay[0]}
              </div>
              <div className="text-positive text-2xl font-mono font-bold">{fmtPnl(calData.bestDay[1].pnl)}</div>
              <div className="text-[10px] text-muted-foreground font-body mt-1">
                {calData.bestDay[1].count} trades • {calData.bestDay[1].wins}W / {calData.bestDay[1].losses}L • Click for details
              </div>
            </div>
          )}
          {calData.worstDay && calData.worstDay[1].pnl < 0 && (
            <div className="bg-card border border-negative/30 p-3 stat-bar-negative-top cursor-pointer hover:border-negative transition-colors"
              onClick={() => setSelectedDay(parseInt(calData.worstDay![0]))}>
              <div className="text-negative text-[11px] font-mono font-bold uppercase mb-2">
                <TrendingDown className="w-3.5 h-3.5 inline mr-1" />
                Worst Day — {calData.monthName} {calData.worstDay[0]}
              </div>
              <div className="text-negative text-2xl font-mono font-bold">{fmtPnl(calData.worstDay[1].pnl)}</div>
              <div className="text-[10px] text-muted-foreground font-body mt-1">
                {calData.worstDay[1].count} trades • {calData.worstDay[1].wins}W / {calData.worstDay[1].losses}L • Click for details
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
