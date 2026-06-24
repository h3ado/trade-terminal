import { useMemo } from 'react';
import ViewHeader from '@/components/ViewHeader';
import { useTrades } from '@/contexts/TradeContext';
import { usePrivacy } from '@/contexts/PrivacyContext';
import { calcWinRate, calcTotalPnl, calcAvgWin, calcAvgLoss, calcExpectancy, calcProfitFactor, calcTotalFees, calcMaxDrawdownPct, getDatePnl, groupByStrategy, groupBySymbol } from '@/types/trade';

export default function PerformanceView() {
  const { trades } = useTrades();
  const { privacyMode } = usePrivacy();
  const stats = useMemo(() => {
    const wins = trades.filter(t => t.pnl > 0);
    const losses = trades.filter(t => t.pnl < 0);
    const breakeven = trades.filter(t => t.pnl === 0);
    const expectancy = calcExpectancy(trades);
    const avgRR = trades.length ? trades.reduce((s, t) => s + parseFloat(t.rr), 0) / trades.length : 0;
    const dailyPnl = getDatePnl(trades);
    const totalDays = dailyPnl.length;
    const greenDays = dailyPnl.filter(d => d.pnl > 0).length;
    const redDays = dailyPnl.filter(d => d.pnl < 0).length;
    const maxDD = calcMaxDrawdownPct(trades);
    const netProfit = calcTotalPnl(trades);
    const grossProfit = calcTotalPnl(wins);
    const grossLoss = Math.abs(calcTotalPnl(losses));
    const recoveryFactor = maxDD !== 0 ? Math.abs(netProfit / maxDD) : 0;
    const profitFactor = calcProfitFactor(trades);
    const winRate = calcWinRate(trades);
    const avgWin = calcAvgWin(trades);
    const avgLoss = calcAvgLoss(trades);
    const payoffRatio = avgLoss !== 0 ? Math.abs(avgWin / avgLoss) : 0;

    // Consecutive wins/losses
    let maxConsWin = 0, maxConsLoss = 0, curWin = 0, curLoss = 0;
    trades.forEach(t => {
      if (t.pnl > 0) { curWin++; curLoss = 0; maxConsWin = Math.max(maxConsWin, curWin); }
      else { curLoss++; curWin = 0; maxConsLoss = Math.max(maxConsLoss, curLoss); }
    });

    // SQN
    const sqn = trades.length > 0 ? (expectancy / (Math.sqrt(trades.reduce((s, t) => s + Math.pow(t.pnl - expectancy, 2), 0) / trades.length) || 1)) * Math.sqrt(trades.length) : 0;

    // Sharpe-like ratio (daily)
    const avgDailyPnl = totalDays > 0 ? dailyPnl.reduce((s, d) => s + d.pnl, 0) / totalDays : 0;
    const dailyStdDev = totalDays > 1 ? Math.sqrt(dailyPnl.reduce((s, d) => s + Math.pow(d.pnl - avgDailyPnl, 2), 0) / (totalDays - 1)) : 0;
    const sharpeRatio = dailyStdDev > 0 ? (avgDailyPnl / dailyStdDev) * Math.sqrt(252) : 0;

    // Sortino (downside deviation only)
    const downsideReturns = dailyPnl.filter(d => d.pnl < 0);
    const downsideDev = downsideReturns.length > 0 ? Math.sqrt(downsideReturns.reduce((s, d) => s + Math.pow(d.pnl, 2), 0) / downsideReturns.length) : 0;
    const sortinoRatio = downsideDev > 0 ? (avgDailyPnl / downsideDev) * Math.sqrt(252) : 0;

    // Calmar ratio
    const calmarRatio = maxDD !== 0 ? Math.abs(netProfit / maxDD) : 0;

    // Avg hold time parsing
    const holdMinutes = trades.map(t => {
      const match = t.holdTime.match(/(\d+)([mhd])/);
      if (!match) return 0;
      const val = parseInt(match[1]);
      if (match[2] === 'm') return val;
      if (match[2] === 'h') return val * 60;
      return val * 1440;
    });
    const avgHoldMin = holdMinutes.length ? holdMinutes.reduce((a, b) => a + b, 0) / holdMinutes.length : 0;
    const avgHoldStr = avgHoldMin >= 1440 ? `${(avgHoldMin / 1440).toFixed(1)}d` : avgHoldMin >= 60 ? `${(avgHoldMin / 60).toFixed(1)}h` : `${avgHoldMin.toFixed(0)}m`;

    // Fees
    const totalFees = calcTotalFees(trades);
    const avgFees = trades.length ? totalFees / trades.length : 0;

    // Kelly criterion
    const kelly = winRate > 0 && payoffRatio > 0 ? ((winRate / 100) - ((1 - winRate / 100) / payoffRatio)) * 100 : 0;

    // Largest win/loss
    const largestWin = wins.length ? Math.max(...wins.map(t => t.pnl)) : 0;
    const largestLoss = losses.length ? Math.min(...losses.map(t => t.pnl)) : 0;
    const medianPnl = (() => {
      if (!trades.length) return 0;
      const sorted = [...trades].sort((a, b) => a.pnl - b.pnl);
      const mid = Math.floor(sorted.length / 2);
      return sorted.length % 2 ? sorted[mid].pnl : (sorted[mid - 1].pnl + sorted[mid].pnl) / 2;
    })();

    // Volatility
    const pnlStdDev = trades.length > 1 ? Math.sqrt(trades.reduce((s, t) => s + Math.pow(t.pnl - (netProfit / trades.length), 2), 0) / (trades.length - 1)) : 0;

    // Best/worst day
    const bestDay = dailyPnl.length ? Math.max(...dailyPnl.map(d => d.pnl)) : 0;
    const worstDay = dailyPnl.length ? Math.min(...dailyPnl.map(d => d.pnl)) : 0;

    // Setup quality
    const setupCounts = { 'A+': 0, 'A': 0, 'B': 0, 'C': 0 };
    const setupPnl = { 'A+': 0, 'A': 0, 'B': 0, 'C': 0 };
    trades.forEach(t => { setupCounts[t.setup]++; setupPnl[t.setup] += t.pnl; });

    // Long vs Short
    const longTrades = trades.filter(t => t.side === 'LONG');
    const shortTrades = trades.filter(t => t.side === 'SHORT');
    const callTrades = trades.filter(t => t.side === 'CALL');
    const putTrades = trades.filter(t => t.side === 'PUT');

    return {
      expectancy, avgRR, maxConsWin, maxConsLoss, recoveryFactor, sqn, wins, losses, breakeven,
      netProfit, maxDD, grossProfit, grossLoss, winRate, avgWin, avgLoss, payoffRatio,
      sharpeRatio, sortinoRatio, calmarRatio, profitFactor, kelly,
      largestWin, largestLoss, medianPnl, pnlStdDev, totalFees, avgFees,
      avgHoldStr, avgHoldMin, totalDays, greenDays, redDays, bestDay, worstDay, avgDailyPnl,
      setupCounts, setupPnl, longTrades, shortTrades, callTrades, putTrades,
    };
  }, [trades]);

  // Time-based perf
  const timePerfData = useMemo(() => {
    const buckets: Record<string, typeof trades> = {
      'Morning (9:30-12:00)': [], 'Midday (12:00-14:00)': [], 'Afternoon (14:00-16:00)': [],
      'Monday': [], 'Tuesday': [], 'Wednesday': [], 'Thursday': [], 'Friday': [],
    };
    const dayNames = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];
    trades.forEach(t => {
      const parts = t.date.split(' ');
      if (parts[1]) {
        const hour = parseInt(parts[1].split(':')[0]);
        if (hour < 12) buckets['Morning (9:30-12:00)'].push(t);
        else if (hour < 14) buckets['Midday (12:00-14:00)'].push(t);
        else buckets['Afternoon (14:00-16:00)'].push(t);
      }
      const d = new Date(t.date.replace(' ', 'T'));
      const dayName = dayNames[d.getDay()];
      if (buckets[dayName]) buckets[dayName].push(t);
    });

    return Object.entries(buckets).filter(([, ts]) => ts.length > 0).map(([period, ts]) => {
      const dailyPnl = getDatePnl(ts);
      return {
        period,
        trades: ts.length,
        winRate: calcWinRate(ts),
        pnl: calcTotalPnl(ts),
        avgPnl: ts.length ? calcTotalPnl(ts) / ts.length : 0,
        bestDay: dailyPnl.length ? Math.max(...dailyPnl.map(d => d.pnl)) : 0,
        worstDay: dailyPnl.length ? Math.min(...dailyPnl.map(d => d.pnl)) : 0,
        pf: calcProfitFactor(ts),
      };
    });
  }, [trades]);

  // Strategy performance
  const stratPerf = useMemo(() => groupByStrategy(trades), [trades]);

  // Symbol performance (top 10)
  const symbolPerf = useMemo(() => groupBySymbol(trades).slice(0, 10), [trades]);

  // Monthly performance
  const monthlyPerf = useMemo(() => {
    const map: Record<string, typeof trades> = {};
    trades.forEach(t => {
      const month = t.date.split(' ')[0].substring(0, 7); // YYYY-MM
      (map[month] ??= []).push(t);
    });
    return Object.entries(map).sort(([a], [b]) => a.localeCompare(b)).map(([month, ts]) => ({
      month,
      trades: ts.length,
      winRate: calcWinRate(ts),
      pnl: calcTotalPnl(ts),
      avgPnl: ts.length ? calcTotalPnl(ts) / ts.length : 0,
      pf: calcProfitFactor(ts),
      bestTrade: Math.max(...ts.map(t => t.pnl)),
      worstTrade: Math.min(...ts.map(t => t.pnl)),
    }));
  }, [trades]);

  const fmt = (n: number, prefix = '$') => privacyMode ? '•••••' : `${n >= 0 ? '+' : ''}${prefix}${Math.abs(n).toFixed(0)}`;
  const fmtPct = (n: number) => `${n.toFixed(1)}%`;

  return (
    <div>
      <div className="flex justify-between items-center mb-3 pb-2 border-b border-border">
        <h2 className="text-[13px] text-accent uppercase tracking-wider font-mono">Core Performance Metrics</h2>
        <ViewHeader />
      </div>

      <div className="grid grid-cols-2 lg:grid-cols-4 xl:grid-cols-8 gap-2 mb-6">
        {[
          { label: 'Net Profit', value: fmt(stats.netProfit), cls: stats.netProfit >= 0 ? 'text-positive' : 'text-negative', sub: `${trades.length} trades` },
          { label: 'Win Rate', value: fmtPct(stats.winRate), cls: stats.winRate >= 50 ? 'text-positive' : 'text-negative', sub: `${stats.wins.length}W / ${stats.losses.length}L` },
          { label: 'Profit Factor', value: stats.profitFactor === Infinity ? '∞' : stats.profitFactor.toFixed(2), cls: stats.profitFactor >= 1.5 ? 'text-positive' : stats.profitFactor >= 1 ? 'text-accent' : 'text-negative', sub: 'Gross W/L' },
          { label: 'Expectancy', value: fmt(stats.expectancy), cls: stats.expectancy >= 0 ? 'text-positive' : 'text-negative', sub: 'Per Trade' },
          { label: 'Avg R:R', value: `${stats.avgRR.toFixed(2)}R`, cls: stats.avgRR >= 1.5 ? 'text-positive' : '', sub: 'Risk/Reward' },
          { label: 'Sharpe Ratio', value: stats.sharpeRatio.toFixed(2), cls: stats.sharpeRatio >= 1 ? 'text-positive' : stats.sharpeRatio >= 0 ? '' : 'text-negative', sub: 'Ann. (252d)' },
          { label: 'Max Drawdown', value: fmt(stats.maxDD), cls: 'text-negative', sub: 'Peak to Valley' },
          { label: 'SQN', value: stats.sqn.toFixed(1), cls: stats.sqn >= 3 ? 'text-positive' : stats.sqn >= 2 ? 'text-accent' : '', sub: stats.sqn >= 5 ? 'Excellent' : stats.sqn >= 3 ? 'Good' : stats.sqn >= 2 ? 'Average' : 'Poor' },
        ].map((s, i) => (
          <div key={i} className="bg-card border border-border p-2.5 relative stat-bar-accent-top">
            <div className="text-data-muted text-[9px] uppercase tracking-wide mb-1 font-body">{s.label}</div>
            <div className={`text-base font-bold font-mono ${s.cls}`}>{s.value}</div>
            <div className="text-[9px] text-muted-foreground font-body">{s.sub}</div>
          </div>
        ))}
      </div>

      {/* Risk & Ratios + Return Metrics side by side */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-6">
        <div>
          <div className="flex justify-between items-center mb-3 pb-2 border-b border-border">
            <h2 className="text-[13px] text-accent uppercase tracking-wider font-mono">Risk & Ratios</h2>
          </div>
          <div className="bg-card border border-border p-3">
            <ul className="space-y-0">
              {[
                { l: 'Payoff Ratio', v: stats.payoffRatio.toFixed(2), c: stats.payoffRatio >= 1.5 ? 'text-positive' : '' },
                { l: 'Sortino Ratio', v: stats.sortinoRatio.toFixed(2), c: stats.sortinoRatio >= 1 ? 'text-positive' : '' },
                { l: 'Calmar Ratio', v: stats.calmarRatio.toFixed(2), c: stats.calmarRatio >= 1 ? 'text-positive' : '' },
                { l: 'Recovery Factor', v: stats.recoveryFactor.toFixed(2), c: stats.recoveryFactor >= 1 ? 'text-positive' : '' },
                { l: 'Kelly Criterion', v: `${stats.kelly.toFixed(1)}%`, c: stats.kelly > 0 ? 'text-positive' : 'text-negative' },
                { l: 'P&L Std Dev', v: `$${stats.pnlStdDev.toFixed(0)}`, c: '' },
                { l: 'Median P&L', v: fmt(stats.medianPnl), c: stats.medianPnl >= 0 ? 'text-positive' : 'text-negative' },
              ].map(m => (
                <li key={m.l} className="flex justify-between py-1.5 border-b border-grid-line last:border-0 text-[11px]">
                  <span className="text-muted-foreground font-body">{m.l}</span>
                  <span className={`font-bold font-mono ${m.c}`}>{m.v}</span>
                </li>
              ))}
            </ul>
          </div>
        </div>

        <div>
          <div className="flex justify-between items-center mb-3 pb-2 border-b border-border">
            <h2 className="text-[13px] text-accent uppercase tracking-wider font-mono">Daily Statistics</h2>
          </div>
          <div className="bg-card border border-border p-3">
            <ul className="space-y-0">
              {[
                { l: 'Total Trading Days', v: String(stats.totalDays), c: '' },
                { l: 'Green Days', v: `${stats.greenDays} (${stats.totalDays ? ((stats.greenDays / stats.totalDays) * 100).toFixed(0) : 0}%)`, c: 'text-positive' },
                { l: 'Red Days', v: `${stats.redDays} (${stats.totalDays ? ((stats.redDays / stats.totalDays) * 100).toFixed(0) : 0}%)`, c: 'text-negative' },
                { l: 'Avg Daily P&L', v: fmt(stats.avgDailyPnl), c: stats.avgDailyPnl >= 0 ? 'text-positive' : 'text-negative' },
                { l: 'Best Day', v: fmt(stats.bestDay), c: 'text-positive' },
                { l: 'Worst Day', v: fmt(stats.worstDay), c: 'text-negative' },
                { l: 'Avg Hold Time', v: stats.avgHoldStr, c: '' },
              ].map(m => (
                <li key={m.l} className="flex justify-between py-1.5 border-b border-grid-line last:border-0 text-[11px]">
                  <span className="text-muted-foreground font-body">{m.l}</span>
                  <span className={`font-bold font-mono ${m.c}`}>{m.v}</span>
                </li>
              ))}
            </ul>
          </div>
        </div>
      </div>

      {/* Win/Loss Analysis */}
      <div className="flex justify-between items-center mb-3 pb-2 border-b border-border">
        <h2 className="text-[13px] text-accent uppercase tracking-wider font-mono">Win/Loss Analysis</h2>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-6">
        <div className="bg-card border border-border p-3">
          <div className="text-accent text-[11px] uppercase mb-2.5 pb-1.5 border-b border-border font-mono">Winning Trades ({stats.wins.length})</div>
          <ul className="space-y-0">
            {[
              { l: 'Gross Profit', v: `+$${stats.grossProfit.toFixed(0)}`, c: 'text-positive' },
              { l: 'Average Win', v: `$${calcAvgWin(trades).toFixed(0)}`, c: 'text-positive' },
              { l: 'Largest Win', v: `$${stats.largestWin.toFixed(0)}`, c: 'text-positive' },
              { l: 'Max Consec. Wins', v: String(stats.maxConsWin), c: 'text-positive' },
              { l: 'Win % of Total', v: `${trades.length ? ((stats.wins.length / trades.length) * 100).toFixed(1) : 0}%`, c: '' },
            ].map(m => (
              <li key={m.l} className="flex justify-between py-1.5 border-b border-grid-line last:border-0 text-[11px]">
                <span className="text-muted-foreground font-body">{m.l}</span>
                <span className={`font-bold font-mono ${m.c}`}>{m.v}</span>
              </li>
            ))}
          </ul>
        </div>
        <div className="bg-card border border-border p-3">
          <div className="text-accent text-[11px] uppercase mb-2.5 pb-1.5 border-b border-border font-mono">Losing Trades ({stats.losses.length})</div>
          <ul className="space-y-0">
            {[
              { l: 'Gross Loss', v: `$${stats.grossLoss.toFixed(0)}`, c: 'text-negative' },
              { l: 'Average Loss', v: `$${calcAvgLoss(trades).toFixed(0)}`, c: 'text-negative' },
              { l: 'Largest Loss', v: `$${stats.largestLoss.toFixed(0)}`, c: 'text-negative' },
              { l: 'Max Consec. Losses', v: String(stats.maxConsLoss), c: 'text-negative' },
              { l: 'Breakeven Trades', v: String(stats.breakeven.length), c: '' },
            ].map(m => (
              <li key={m.l} className="flex justify-between py-1.5 border-b border-grid-line last:border-0 text-[11px]">
                <span className="text-muted-foreground font-body">{m.l}</span>
                <span className={`font-bold font-mono ${m.c}`}>{m.v}</span>
              </li>
            ))}
          </ul>
        </div>
      </div>

      {/* Costs */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-2 mb-6">
        {[
          { label: 'Total Fees', value: `$${stats.totalFees.toFixed(0)}`, cls: 'text-negative', sub: 'Commissions' },
          { label: 'Avg Fee/Trade', value: `$${stats.avgFees.toFixed(2)}`, cls: '', sub: 'Per Trade' },
          { label: 'Net After Fees', value: fmt(stats.netProfit - stats.totalFees), cls: (stats.netProfit - stats.totalFees) >= 0 ? 'text-positive' : 'text-negative', sub: 'Adjusted P&L' },
          { label: 'Fee Impact', value: `${stats.grossProfit > 0 ? ((stats.totalFees / stats.grossProfit) * 100).toFixed(1) : 0}%`, cls: '', sub: '% of Gross' },
        ].map((s, i) => (
          <div key={i} className="bg-card border border-border p-2.5 relative stat-bar-accent-top">
            <div className="text-data-muted text-[9px] uppercase tracking-wide mb-1 font-body">{s.label}</div>
            <div className={`text-base font-bold font-mono ${s.cls}`}>{s.value}</div>
            <div className="text-[9px] text-muted-foreground font-body">{s.sub}</div>
          </div>
        ))}
      </div>

      {/* Setup Quality */}
      <div className="flex justify-between items-center mb-3 pb-2 border-b border-border">
        <h2 className="text-[13px] text-accent uppercase tracking-wider font-mono">Setup Quality Breakdown</h2>
      </div>
      <div className="grid grid-cols-2 md:grid-cols-4 gap-2 mb-6">
        {(['A+', 'A', 'B', 'C'] as const).map(setup => {
          const count = stats.setupCounts[setup];
          const pnl = stats.setupPnl[setup];
          const pct = trades.length ? ((count / trades.length) * 100).toFixed(0) : '0';
          return (
            <div key={setup} className="bg-card border border-border p-3">
              <div className="flex justify-between items-center mb-2">
                <span className={`text-sm font-bold font-mono ${
                  setup === 'A+' ? 'text-positive' : setup === 'A' ? 'text-accent' : setup === 'B' ? 'text-muted-foreground' : 'text-negative'
                }`}>{setup} Setup</span>
                <span className="text-[10px] font-mono text-muted-foreground">{count} ({pct}%)</span>
              </div>
              <div className={`text-lg font-bold font-mono ${pnl >= 0 ? 'text-positive' : 'text-negative'}`}>
                {fmt(pnl)}
              </div>
              <div className="text-[9px] text-muted-foreground font-body">
                Avg: {count > 0 ? fmt(pnl / count) : '$0'} / trade
              </div>
            </div>
          );
        })}
      </div>

      {/* Direction Breakdown */}
      <div className="flex justify-between items-center mb-3 pb-2 border-b border-border">
        <h2 className="text-[13px] text-accent uppercase tracking-wider font-mono">Direction Analysis</h2>
      </div>
      <div className="grid grid-cols-2 md:grid-cols-4 gap-2 mb-6">
        {[
          { label: 'Long', ts: stats.longTrades },
          { label: 'Short', ts: stats.shortTrades },
          { label: 'Calls', ts: stats.callTrades },
          { label: 'Puts', ts: stats.putTrades },
        ].filter(d => d.ts.length > 0).map(d => {
          const pnl = calcTotalPnl(d.ts);
          const wr = calcWinRate(d.ts);
          return (
            <div key={d.label} className="bg-card border border-border p-3">
              <div className="text-accent text-[10px] uppercase mb-1.5 font-mono">{d.label}</div>
              <div className={`text-lg font-bold font-mono ${pnl >= 0 ? 'text-positive' : 'text-negative'}`}>
                {fmt(pnl)}
              </div>
              <div className="text-[9px] text-muted-foreground font-body">
                {d.ts.length} trades · {wr.toFixed(0)}% WR
              </div>
            </div>
          );
        })}
      </div>

      {/* Strategy Performance */}
      {stratPerf.length > 0 && (
        <>
          <div className="flex justify-between items-center mb-3 pb-2 border-b border-border">
            <h2 className="text-[13px] text-accent uppercase tracking-wider font-mono">Strategy Performance</h2>
          </div>
          <div className="bg-card border border-border overflow-x-auto mb-6">
            <table className="w-full">
              <thead>
                <tr className="bg-surface-primary">
                  {['Strategy', 'Trades', 'Win Rate', 'P&L', 'Avg P&L'].map(h => (
                    <th key={h} className="px-3 py-2.5 text-left text-[11px] text-accent uppercase font-mono font-bold border-b border-border">{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {stratPerf.map(r => (
                  <tr key={r.strategy} className="hover:bg-surface-elevated transition-colors border-b border-grid-line">
                    <td className="px-3 py-2.5 text-[11px] font-mono font-bold">{r.strategy}</td>
                    <td className="px-3 py-2.5 text-[11px] font-mono">{r.trades}</td>
                    <td className={`px-3 py-2.5 text-[11px] font-mono ${r.winRate >= 50 ? 'text-positive' : 'text-negative'}`}>{r.winRate.toFixed(0)}%</td>
                    <td className={`px-3 py-2.5 text-[11px] font-mono font-bold ${r.totalPnl >= 0 ? 'text-positive' : 'text-negative'}`}>{fmt(r.totalPnl)}</td>
                    <td className={`px-3 py-2.5 text-[11px] font-mono ${r.avgPnl >= 0 ? 'text-positive' : 'text-negative'}`}>{fmt(r.avgPnl)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </>
      )}

      {/* Top Symbols */}
      {symbolPerf.length > 0 && (
        <>
          <div className="flex justify-between items-center mb-3 pb-2 border-b border-border">
            <h2 className="text-[13px] text-accent uppercase tracking-wider font-mono">Top Symbols (by P&L)</h2>
          </div>
          <div className="bg-card border border-border overflow-x-auto mb-6">
            <table className="w-full">
              <thead>
                <tr className="bg-surface-primary">
                  {['Symbol', 'Trades', 'Win Rate', 'P&L', 'Avg P&L', 'Best', 'Worst'].map(h => (
                    <th key={h} className="px-3 py-2.5 text-left text-[11px] text-accent uppercase font-mono font-bold border-b border-border">{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {symbolPerf.map(r => (
                  <tr key={r.symbol} className="hover:bg-surface-elevated transition-colors border-b border-grid-line">
                    <td className="px-3 py-2.5 text-[11px] font-mono font-bold">{r.symbol}</td>
                    <td className="px-3 py-2.5 text-[11px] font-mono">{r.trades}</td>
                    <td className={`px-3 py-2.5 text-[11px] font-mono ${r.winRate >= 50 ? 'text-positive' : 'text-negative'}`}>{r.winRate.toFixed(0)}%</td>
                    <td className={`px-3 py-2.5 text-[11px] font-mono font-bold ${r.totalPnl >= 0 ? 'text-positive' : 'text-negative'}`}>{fmt(r.totalPnl)}</td>
                    <td className={`px-3 py-2.5 text-[11px] font-mono ${r.avgPnl >= 0 ? 'text-positive' : 'text-negative'}`}>{fmt(r.avgPnl)}</td>
                    <td className="px-3 py-2.5 text-[11px] font-mono text-positive">{fmt(r.bestTrade)}</td>
                    <td className="px-3 py-2.5 text-[11px] font-mono text-negative">{fmt(r.worstTrade)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </>
      )}

      {/* Time-Based Performance */}
      <div className="flex justify-between items-center mb-3 pb-2 border-b border-border">
        <h2 className="text-[13px] text-accent uppercase tracking-wider font-mono">Time-Based Performance</h2>
      </div>

      <div className="bg-card border border-border overflow-x-auto mb-6">
        <table className="w-full">
          <thead>
            <tr className="bg-surface-primary">
              {['Time Period', 'Trades', 'Win Rate', 'P&L', 'Avg P&L', 'PF', 'Best Day', 'Worst Day'].map(h => (
                <th key={h} className="px-3 py-2.5 text-left text-[11px] text-accent uppercase font-mono font-bold border-b border-border">{h}</th>
              ))}
            </tr>
          </thead>
          <tbody>
            {timePerfData.map(r => (
              <tr key={r.period} className="hover:bg-surface-elevated transition-colors border-b border-grid-line">
                <td className="px-3 py-2.5 text-[11px] font-mono font-bold">{r.period}</td>
                <td className="px-3 py-2.5 text-[11px] font-mono">{r.trades}</td>
                <td className={`px-3 py-2.5 text-[11px] font-mono ${r.winRate >= 50 ? 'text-positive' : 'text-negative'}`}>{r.winRate.toFixed(0)}%</td>
                <td className={`px-3 py-2.5 text-[11px] font-mono font-bold ${r.pnl >= 0 ? 'text-positive' : 'text-negative'}`}>{fmt(r.pnl)}</td>
                <td className={`px-3 py-2.5 text-[11px] font-mono ${r.avgPnl >= 0 ? 'text-positive' : 'text-negative'}`}>{fmt(r.avgPnl)}</td>
                <td className="px-3 py-2.5 text-[11px] font-mono">{r.pf === Infinity ? '∞' : r.pf.toFixed(2)}</td>
                <td className="px-3 py-2.5 text-[11px] font-mono text-positive font-bold">{fmt(r.bestDay)}</td>
                <td className="px-3 py-2.5 text-[11px] font-mono text-negative font-bold">{fmt(r.worstDay)}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* Monthly Performance */}
      {monthlyPerf.length > 0 && (
        <>
          <div className="flex justify-between items-center mb-3 pb-2 border-b border-border">
            <h2 className="text-[13px] text-accent uppercase tracking-wider font-mono">Monthly Performance</h2>
          </div>
          <div className="bg-card border border-border overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="bg-surface-primary">
                  {['Month', 'Trades', 'Win Rate', 'P&L', 'Avg P&L', 'PF', 'Best Trade', 'Worst Trade'].map(h => (
                    <th key={h} className="px-3 py-2.5 text-left text-[11px] text-accent uppercase font-mono font-bold border-b border-border">{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {monthlyPerf.map(r => (
                  <tr key={r.month} className="hover:bg-surface-elevated transition-colors border-b border-grid-line">
                    <td className="px-3 py-2.5 text-[11px] font-mono font-bold">{r.month}</td>
                    <td className="px-3 py-2.5 text-[11px] font-mono">{r.trades}</td>
                    <td className={`px-3 py-2.5 text-[11px] font-mono ${r.winRate >= 50 ? 'text-positive' : 'text-negative'}`}>{r.winRate.toFixed(0)}%</td>
                    <td className={`px-3 py-2.5 text-[11px] font-mono font-bold ${r.pnl >= 0 ? 'text-positive' : 'text-negative'}`}>{fmt(r.pnl)}</td>
                    <td className={`px-3 py-2.5 text-[11px] font-mono ${r.avgPnl >= 0 ? 'text-positive' : 'text-negative'}`}>{fmt(r.avgPnl)}</td>
                    <td className="px-3 py-2.5 text-[11px] font-mono">{r.pf === Infinity ? '∞' : r.pf.toFixed(2)}</td>
                    <td className="px-3 py-2.5 text-[11px] font-mono text-positive">{fmt(r.bestTrade)}</td>
                    <td className="px-3 py-2.5 text-[11px] font-mono text-negative">{fmt(r.worstTrade)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </>
      )}
    </div>
  );
}
