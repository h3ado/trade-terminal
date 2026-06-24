import { useMemo, useRef, useEffect } from 'react';
import ViewHeader from '@/components/ViewHeader';
import { useTrades } from '@/contexts/TradeContext';
import { calcWinRate, calcTotalPnl, calcAvgWin, calcAvgLoss, calcExpectancy, calcProfitFactor, calcTotalFees, groupBySymbol, groupByStrategy, groupBySector, groupByDay } from '@/types/trade';

export default function AnalyticsView() {
  const { trades } = useTrades();

  const stats = useMemo(() => {
    const wins = trades.filter(t => t.pnl > 0);
    const losses = trades.filter(t => t.pnl < 0);
    const holdMap: Record<string, number> = {};
    trades.forEach(t => { holdMap[t.holdTime] = (holdMap[t.holdTime] || 0) + 1; });
    const topHold = Object.entries(holdMap).sort((a, b) => b[1] - a[1])[0];
    const dailyPnl: Record<string, number> = {};
    trades.forEach(t => { const d = t.date.split(' ')[0]; dailyPnl[d] = (dailyPnl[d] || 0) + t.pnl; });
    const days = Object.values(dailyPnl);
    const bestDay = Math.max(...days, 0);
    const worstDay = Math.min(...days, 0);
    const bestDayDate = Object.entries(dailyPnl).find(([, v]) => v === bestDay)?.[0] || '';
    const worstDayDate = Object.entries(dailyPnl).find(([, v]) => v === worstDay)?.[0] || '';
    const wr = calcWinRate(trades);
    const avgW = calcAvgWin(trades);
    const avgL = Math.abs(calcAvgLoss(trades));
    const kelly = avgL > 0 ? ((wr / 100) - ((1 - wr / 100) / (avgW / avgL))) * 100 : 0;
    const pf = calcProfitFactor(trades);
    const expectancy = calcExpectancy(trades);
    const totalPnl = calcTotalPnl(trades);

    // Streaks
    let maxWinStreak = 0, maxLossStreak = 0, curWin = 0, curLoss = 0;
    const sorted = [...trades].sort((a, b) => a.date.localeCompare(b.date));
    sorted.forEach(t => {
      if (t.pnl > 0) { curWin++; curLoss = 0; maxWinStreak = Math.max(maxWinStreak, curWin); }
      else if (t.pnl < 0) { curLoss++; curWin = 0; maxLossStreak = Math.max(maxLossStreak, curLoss); }
    });

    // Avg trades per day
    const tradingDays = Object.keys(dailyPnl).length;
    const avgTradesPerDay = tradingDays > 0 ? trades.length / tradingDays : 0;

    // Largest win/loss
    const largestWin = wins.length ? Math.max(...wins.map(t => t.pnl)) : 0;
    const largestLoss = losses.length ? Math.min(...losses.map(t => t.pnl)) : 0;

    return {
      total: trades.length, winRate: wr, avgHold: topHold ? topHold[0] : 'N/A',
      bestDay, worstDay, bestDayDate, worstDayDate,
      kelly: Math.max(0, kelly), pf, expectancy, totalPnl,
      avgW, avgL, maxWinStreak, maxLossStreak,
      avgTradesPerDay, largestWin, largestLoss,
      wins: wins.length, losses: losses.length,
      totalFees: calcTotalFees(trades),
    };
  }, [trades]);

  const bySymbol = useMemo(() => groupBySymbol(trades), [trades]);
  const byStrategy = useMemo(() => groupByStrategy(trades), [trades]);
  const bySector = useMemo(() => groupBySector(trades), [trades]);
  const byDay = useMemo(() => groupByDay(trades), [trades]);

  // Time of day analysis
  const byHour = useMemo(() => {
    const hourMap: Record<number, { wins: number; losses: number; pnl: number; count: number }> = {};
    trades.forEach(t => {
      const match = t.date.match(/(\d{2}):\d{2}/);
      const hour = match ? parseInt(match[1]) : 9;
      if (!hourMap[hour]) hourMap[hour] = { wins: 0, losses: 0, pnl: 0, count: 0 };
      hourMap[hour].count++;
      hourMap[hour].pnl += t.pnl;
      if (t.pnl > 0) hourMap[hour].wins++;
      else hourMap[hour].losses++;
    });
    return Object.entries(hourMap)
      .map(([h, d]) => ({ hour: parseInt(h), ...d, winRate: d.count > 0 ? (d.wins / d.count) * 100 : 0 }))
      .sort((a, b) => a.hour - b.hour);
  }, [trades]);

  // Setup quality analysis
  const bySetup = useMemo(() => {
    const map: Record<string, { count: number; wins: number; pnl: number }> = {};
    trades.forEach(t => {
      if (!map[t.setup]) map[t.setup] = { count: 0, wins: 0, pnl: 0 };
      map[t.setup].count++;
      map[t.setup].pnl += t.pnl;
      if (t.pnl > 0) map[t.setup].wins++;
    });
    return ['A+', 'A', 'B', 'C'].map(s => ({
      setup: s,
      count: map[s]?.count || 0,
      winRate: map[s]?.count ? (map[s].wins / map[s].count) * 100 : 0,
      totalPnl: map[s]?.pnl || 0,
      avgPnl: map[s]?.count ? (map[s].pnl / map[s].count) : 0,
    }));
  }, [trades]);

  return (
    <div>
      <div className="flex justify-end mb-3"><ViewHeader /></div>

      {/* Primary Stats */}
      <div className="grid grid-cols-2 lg:grid-cols-4 xl:grid-cols-8 gap-3 mb-4">
        {[
          { label: 'Total Trades', value: String(stats.total), change: `${stats.wins}W / ${stats.losses}L` },
          { label: 'Win Rate', value: `${stats.winRate.toFixed(1)}%`, change: `${stats.winRate >= 50 ? '▲' : '▼'} Batting Avg`, changeClass: stats.winRate >= 50 ? 'text-positive' : 'text-negative', type: stats.winRate >= 50 ? 'positive' as const : 'negative' as const },
          { label: 'Total P&L', value: `${stats.totalPnl >= 0 ? '+' : ''}$${stats.totalPnl.toFixed(0)}`, valueClass: stats.totalPnl >= 0 ? 'text-positive' : 'text-negative', type: stats.totalPnl >= 0 ? 'positive' as const : 'negative' as const },
          { label: 'Profit Factor', value: stats.pf === Infinity ? '∞' : stats.pf.toFixed(2), change: stats.pf >= 1.5 ? 'Strong' : stats.pf >= 1 ? 'Break Even' : 'Weak', changeClass: stats.pf >= 1.5 ? 'text-positive' : stats.pf >= 1 ? 'text-accent' : 'text-negative' },
          { label: 'Expectancy', value: `$${stats.expectancy.toFixed(0)}`, valueClass: stats.expectancy >= 0 ? 'text-positive' : 'text-negative', change: 'Per Trade' },
          { label: 'Avg Win', value: `+$${stats.avgW.toFixed(0)}`, valueClass: 'text-positive', change: `vs -$${stats.avgL.toFixed(0)} avg loss` },
          { label: 'Kelly Criterion', value: `${stats.kelly.toFixed(1)}%`, change: 'Optimal Size' },
          { label: 'Total Fees', value: `$${stats.totalFees.toFixed(0)}`, change: `${((stats.totalFees / Math.abs(stats.totalPnl || 1)) * 100).toFixed(1)}% of P&L` },
        ].map((s, i) => (
          <div key={i} className={`bg-card border border-border p-3 relative ${
            s.type === 'positive' ? 'stat-bar-positive-top' : s.type === 'negative' ? 'stat-bar-negative-top' : 'stat-bar-accent-top'
          }`}>
            <div className="text-data-muted text-[10px] uppercase tracking-wide mb-1.5 font-body">{s.label}</div>
            <div className={`text-xl font-bold font-mono ${s.valueClass || ''}`}>{s.value}</div>
            <div className={`text-[11px] font-body ${s.changeClass || 'text-muted-foreground'}`}>{s.change}</div>
          </div>
        ))}
      </div>

      {/* Secondary Stats Row */}
      <div className="grid grid-cols-2 lg:grid-cols-4 xl:grid-cols-6 gap-3 mb-6">
        {[
          { label: 'Best Day', value: `+$${stats.bestDay.toFixed(0)}`, valueClass: 'text-positive', change: stats.bestDayDate, type: 'positive' as const },
          { label: 'Worst Day', value: `-$${Math.abs(stats.worstDay).toFixed(0)}`, valueClass: 'text-negative', change: stats.worstDayDate, type: 'negative' as const },
          { label: 'Largest Win', value: `+$${stats.largestWin.toFixed(0)}`, valueClass: 'text-positive' },
          { label: 'Largest Loss', value: `$${stats.largestLoss.toFixed(0)}`, valueClass: 'text-negative' },
          { label: 'Win Streak', value: `${stats.maxWinStreak} trades`, change: 'Max Consecutive', type: 'positive' as const },
          { label: 'Loss Streak', value: `${stats.maxLossStreak} trades`, change: 'Max Consecutive', type: 'negative' as const },
        ].map((s, i) => (
          <div key={i} className={`bg-card border border-border p-3 relative ${
            s.type === 'positive' ? 'stat-bar-positive-top' : s.type === 'negative' ? 'stat-bar-negative-top' : 'stat-bar-accent-top'
          }`}>
            <div className="text-data-muted text-[10px] uppercase tracking-wide mb-1.5 font-body">{s.label}</div>
            <div className={`text-lg font-bold font-mono ${s.valueClass || ''}`}>{s.value}</div>
            {s.change && <div className="text-[11px] text-muted-foreground font-body">{s.change}</div>}
          </div>
        ))}
      </div>

      {/* Day of Week Performance */}
      <div className="flex justify-between items-center mb-3 pb-2 border-b border-border">
        <h2 className="text-[13px] text-accent uppercase tracking-wider font-mono">Day of Week Performance</h2>
      </div>
      <div className="grid grid-cols-5 gap-3 mb-6">
        {byDay.map(d => {
          const total = d.wins + d.losses;
          const winPct = total > 0 ? (d.wins / total) * 100 : 0;
          return (
            <div key={d.day} className="bg-card border border-border p-3">
              <div className="text-accent text-[11px] font-mono font-bold mb-2">{d.day.toUpperCase()}</div>
              <div className="flex items-end gap-1 mb-2">
                <div className="flex-1 bg-surface-elevated h-8 relative overflow-hidden">
                  <div className="absolute left-0 top-0 h-full bg-positive/20" style={{ width: `${winPct}%` }} />
                  <div className="absolute right-0 top-0 h-full bg-negative/20" style={{ width: `${100 - winPct}%` }} />
                </div>
              </div>
              <div className="text-[10px] font-mono">
                <span className="text-positive">{d.wins}W</span>
                <span className="text-muted-foreground"> / </span>
                <span className="text-negative">{d.losses}L</span>
              </div>
              <div className={`text-[11px] font-mono font-bold ${d.winRate >= 50 ? 'text-positive' : 'text-negative'}`}>
                {d.winRate.toFixed(0)}% WR
              </div>
            </div>
          );
        })}
      </div>

      {/* Time of Day Analysis */}
      <div className="flex justify-between items-center mb-3 pb-2 border-b border-border">
        <h2 className="text-[13px] text-accent uppercase tracking-wider font-mono">Time of Day Analysis</h2>
      </div>
      <div className="bg-card border border-border overflow-x-auto mb-6">
        <table className="w-full">
          <thead>
            <tr className="bg-surface-primary">
              {['Hour', 'Trades', 'Wins', 'Losses', 'Win Rate', 'Total P&L', 'Avg P&L'].map(h => (
                <th key={h} className="px-3 py-2.5 text-left text-[11px] text-accent uppercase font-mono font-bold border-b border-border">{h}</th>
              ))}
            </tr>
          </thead>
          <tbody>
            {byHour.map(r => (
              <tr key={r.hour} className="hover:bg-surface-elevated transition-colors border-b border-grid-line">
                <td className="px-3 py-2 text-[11px] font-mono font-bold">{r.hour.toString().padStart(2, '0')}:00</td>
                <td className="px-3 py-2 text-[11px] font-mono">{r.count}</td>
                <td className="px-3 py-2 text-[11px] font-mono text-positive">{r.wins}</td>
                <td className="px-3 py-2 text-[11px] font-mono text-negative">{r.losses}</td>
                <td className={`px-3 py-2 text-[11px] font-mono font-bold ${r.winRate >= 50 ? 'text-positive' : 'text-negative'}`}>{r.winRate.toFixed(0)}%</td>
                <td className={`px-3 py-2 text-[11px] font-mono font-bold ${r.pnl >= 0 ? 'text-positive' : 'text-negative'}`}>{r.pnl >= 0 ? '+' : ''}${r.pnl.toFixed(0)}</td>
                <td className="px-3 py-2 text-[11px] font-mono">${(r.pnl / r.count).toFixed(0)}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* Setup Quality */}
      <div className="flex justify-between items-center mb-3 pb-2 border-b border-border">
        <h2 className="text-[13px] text-accent uppercase tracking-wider font-mono">Setup Quality Breakdown</h2>
      </div>
      <div className="grid grid-cols-2 xl:grid-cols-4 gap-3 mb-6">
        {bySetup.map(s => {
          const setupColor = s.setup === 'A+' ? 'text-positive' : s.setup === 'A' ? 'text-positive/70' : s.setup === 'B' ? 'text-accent' : 'text-negative';
          return (
            <div key={s.setup} className="bg-card border border-border p-3">
              <div className={`text-lg font-mono font-bold mb-1 ${setupColor}`}>{s.setup} Setup</div>
              <ul className="space-y-0">
                {[
                  { l: 'Trades', v: s.count },
                  { l: 'Win Rate', v: `${s.winRate.toFixed(0)}%`, c: s.winRate >= 50 ? 'text-positive' : 'text-negative' },
                  { l: 'Total P&L', v: `${s.totalPnl >= 0 ? '+' : ''}$${s.totalPnl.toFixed(0)}`, c: s.totalPnl >= 0 ? 'text-positive' : 'text-negative' },
                  { l: 'Avg P&L', v: `$${s.avgPnl.toFixed(0)}`, c: s.avgPnl >= 0 ? 'text-positive' : 'text-negative' },
                ].map(m => (
                  <li key={m.l} className="flex justify-between py-1.5 border-b border-grid-line last:border-0 text-[11px]">
                    <span className="text-muted-foreground font-body">{m.l}</span>
                    <span className={`font-bold font-mono ${m.c || ''}`}>{m.v}</span>
                  </li>
                ))}
              </ul>
            </div>
          );
        })}
      </div>

      {/* Sector Breakdown */}
      <div className="flex justify-between items-center mb-3 pb-2 border-b border-border">
        <h2 className="text-[13px] text-accent uppercase tracking-wider font-mono">Sector Exposure</h2>
      </div>
      <div className="grid grid-cols-2 md:grid-cols-3 xl:grid-cols-4 gap-3 mb-6">
        {bySector.map(s => (
          <div key={s.sector} className="bg-card border border-border p-3">
            <div className="flex justify-between items-center mb-2">
              <span className="text-accent text-[11px] font-mono font-bold uppercase">{s.sector}</span>
              <span className="text-[10px] text-muted-foreground font-mono">{s.pct}%</span>
            </div>
            <div className="w-full bg-surface-elevated h-2 mb-2">
              <div className="h-full bg-accent/50" style={{ width: `${s.pct}%` }} />
            </div>
            <div className="flex justify-between text-[10px] font-mono">
              <span className="text-muted-foreground">{s.trades} trades</span>
              <span className={s.totalPnl >= 0 ? 'text-positive' : 'text-negative'}>{s.totalPnl >= 0 ? '+' : ''}${s.totalPnl.toFixed(0)}</span>
            </div>
          </div>
        ))}
      </div>

      {/* Performance by Symbol */}
      <div className="flex justify-between items-center mb-3 pb-2 border-b border-border">
        <h2 className="text-[13px] text-accent uppercase tracking-wider font-mono">Performance by Symbol</h2>
      </div>
      <div className="bg-card border border-border overflow-x-auto mb-6">
        <table className="w-full">
          <thead>
            <tr className="bg-surface-primary">
              {['Symbol', 'Trades', 'Win Rate', 'Total P&L', 'Avg P&L', 'Best Trade', 'Worst Trade'].map(h => (
                <th key={h} className="px-3 py-2.5 text-left text-[11px] text-accent uppercase font-mono font-bold border-b border-border">{h}</th>
              ))}
            </tr>
          </thead>
          <tbody>
            {bySymbol.slice(0, 15).map(r => (
              <tr key={r.symbol} className="hover:bg-surface-elevated transition-colors border-b border-grid-line">
                <td className="px-3 py-2.5 text-[11px] font-mono font-bold">{r.symbol}</td>
                <td className="px-3 py-2.5 text-[11px] font-mono">{r.trades}</td>
                <td className={`px-3 py-2.5 text-[11px] font-mono ${r.winRate >= 50 ? 'text-positive' : 'text-negative'}`}>{r.winRate.toFixed(0)}%</td>
                <td className={`px-3 py-2.5 text-[11px] font-mono font-bold ${r.totalPnl >= 0 ? 'text-positive' : 'text-negative'}`}>{r.totalPnl >= 0 ? '+' : ''}${r.totalPnl.toFixed(0)}</td>
                <td className="px-3 py-2.5 text-[11px] font-mono">${r.avgPnl.toFixed(0)}</td>
                <td className="px-3 py-2.5 text-[11px] font-mono text-positive font-bold">+${r.bestTrade.toFixed(0)}</td>
                <td className="px-3 py-2.5 text-[11px] font-mono text-negative font-bold">${r.worstTrade.toFixed(0)}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* Strategy Breakdown */}
      <div className="flex justify-between items-center mb-3 pb-2 border-b border-border">
        <h2 className="text-[13px] text-accent uppercase tracking-wider font-mono">Strategy Breakdown</h2>
      </div>
      <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-4 gap-4">
        {byStrategy.map(s => (
          <div key={s.strategy} className="bg-card border border-border p-3">
            <div className="text-accent text-[11px] uppercase mb-2.5 pb-1.5 border-b border-border font-mono tracking-wide">{s.strategy}</div>
            <ul className="space-y-0">
              {[
                { l: 'Trades', v: s.trades },
                { l: 'Win Rate', v: `${s.winRate.toFixed(0)}%`, c: s.winRate >= 50 ? 'text-positive' : 'text-negative' },
                { l: 'Total P&L', v: `${s.totalPnl >= 0 ? '+' : ''}$${s.totalPnl.toFixed(0)}`, c: s.totalPnl >= 0 ? 'text-positive' : 'text-negative' },
                { l: 'Avg P&L', v: `$${s.avgPnl.toFixed(0)}`, c: s.avgPnl >= 0 ? 'text-positive' : 'text-negative' },
              ].map(m => (
                <li key={m.l} className="flex justify-between py-1.5 border-b border-grid-line last:border-0 text-[11px]">
                  <span className="text-muted-foreground font-body">{m.l}</span>
                  <span className={`font-bold font-mono ${m.c || ''}`}>{m.v}</span>
                </li>
              ))}
            </ul>
          </div>
        ))}
      </div>
    </div>
  );
}
