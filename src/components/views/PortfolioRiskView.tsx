// PORT — Portfolio Risk Analyzer
// Reads real trades from TradeContext (already fetched from /api/trades).
// No new backend endpoints required.
import { useMemo, useState } from 'react';
import {
  AreaChart, Area, BarChart, Bar, LineChart, Line,
  XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer,
  ReferenceLine, Cell,
} from 'recharts';
import CmdShell from '@/components/macro/cmd/_shell/CmdShell';
import CmdTabs from '@/components/macro/cmd/_shell/CmdTabs';
import { useTrades } from '@/contexts/TradeContext';
import {
  Trade,
  calcSharpeRatio, calcMaxDrawdown, calcMaxDrawdownPct,
  calcWinRate, calcTotalPnl, calcProfitFactor, calcExpectancy,
  calcAvgWin, calcAvgLoss, groupBySymbol, groupByType,
} from '@/types/trade';

// ── helpers ───────────────────────────────────────────────────────────────────

function sortino(trades: Trade[]): number {
  if (trades.length < 2) return 0;
  const returns = trades.map(t => t.pnl);
  const mean = returns.reduce((s, r) => s + r, 0) / returns.length;
  const downside = returns.filter(r => r < 0);
  if (downside.length === 0) return mean > 0 ? Infinity : 0;
  const downVar = downside.reduce((s, r) => s + r * r, 0) / downside.length;
  return mean / Math.sqrt(downVar);
}

function var95(trades: Trade[]): number {
  if (trades.length < 5) return 0;
  const sorted = [...trades.map(t => t.pnl)].sort((a, b) => a - b);
  const idx = Math.floor(sorted.length * 0.05);
  return Math.abs(sorted[idx] ?? sorted[0] ?? 0);
}

function calmar(trades: Trade[], startBalance = 100_000): number {
  if (trades.length < 2) return 0;
  const annualReturn = calcTotalPnl(trades) / startBalance;
  const dd = Math.abs(calcMaxDrawdownPct(trades, startBalance)) / 100;
  return dd === 0 ? 0 : annualReturn / dd;
}

function equityCurve(trades: Trade[], startBalance = 100_000) {
  const sorted = [...trades].sort((a, b) => a.date.localeCompare(b.date));
  let balance = startBalance;
  let peak = startBalance;
  const curve: { date: string; balance: number; drawdown: number; pnl: number }[] = [];
  for (const t of sorted) {
    balance += t.pnl;
    if (balance > peak) peak = balance;
    const dd = peak > 0 ? ((balance - peak) / peak) * 100 : 0;
    curve.push({ date: t.date.slice(0, 10), balance, drawdown: dd, pnl: t.pnl });
  }
  return curve;
}

function dailyPnl(trades: Trade[]) {
  const map: Record<string, number> = {};
  for (const t of trades) {
    const d = t.date.slice(0, 10);
    map[d] = (map[d] ?? 0) + t.pnl;
  }
  return Object.entries(map).sort(([a], [b]) => a.localeCompare(b)).map(([date, pnl]) => ({ date, pnl }));
}

function rollingN(trades: Trade[], n: number, fn: (ts: Trade[]) => number) {
  const sorted = [...trades].sort((a, b) => a.date.localeCompare(b.date));
  return sorted.map((_, i) => {
    const window = sorted.slice(Math.max(0, i - n + 1), i + 1);
    return { date: sorted[i].date.slice(0, 10), value: window.length >= 3 ? fn(window) : null };
  });
}

function pearsonR(a: number[], b: number[]): number {
  const n = Math.min(a.length, b.length);
  if (n < 2) return 0;
  const meanA = a.slice(0, n).reduce((s, v) => s + v, 0) / n;
  const meanB = b.slice(0, n).reduce((s, v) => s + v, 0) / n;
  let num = 0, da = 0, db = 0;
  for (let i = 0; i < n; i++) {
    const x = a[i] - meanA, y = b[i] - meanB;
    num += x * y; da += x * x; db += y * y;
  }
  const denom = Math.sqrt(da * db);
  return denom === 0 ? 0 : num / denom;
}

function correlationMatrix(trades: Trade[]) {
  const byDate: Record<string, Record<string, number>> = {};
  for (const t of trades) {
    const d = t.date.slice(0, 10);
    if (!byDate[d]) byDate[d] = {};
    byDate[d][t.symbol] = (byDate[d][t.symbol] ?? 0) + t.pnl;
  }
  const symbols = [...new Set(trades.map(t => t.symbol))].slice(0, 10);
  const dates = Object.keys(byDate).sort();
  const series: Record<string, number[]> = {};
  for (const sym of symbols) {
    series[sym] = dates.map(d => byDate[d][sym] ?? 0);
  }
  const matrix: { a: string; b: string; r: number }[] = [];
  for (let i = 0; i < symbols.length; i++) {
    for (let j = 0; j < symbols.length; j++) {
      matrix.push({ a: symbols[i], b: symbols[j], r: pearsonR(series[symbols[i]], series[symbols[j]]) });
    }
  }
  return { symbols, matrix };
}

function fmt(n: number, digits = 0) {
  return n.toLocaleString('en-US', { minimumFractionDigits: digits, maximumFractionDigits: digits });
}
function fmtPct(n: number) { return `${n >= 0 ? '+' : ''}${n.toFixed(2)}%`; }
function fmtDollar(n: number) {
  const abs = Math.abs(n);
  const s = abs >= 1000 ? `$${(abs / 1000).toFixed(1)}K` : `$${abs.toFixed(0)}`;
  return n < 0 ? `-${s}` : s;
}

// ── sub-components ─────────────────────────────────────────────────────────────

function StatBox({ label, value, sub, pos, neg }: {
  label: string; value: string; sub?: string; pos?: boolean; neg?: boolean;
}) {
  return (
    <div className="border border-border p-2 flex flex-col gap-0.5">
      <span className="text-[7px] font-mono text-muted-foreground uppercase tracking-widest">{label}</span>
      <span className={`text-[13px] font-mono font-bold tabular-nums leading-none ${pos ? 'text-positive' : neg ? 'text-negative' : 'text-foreground'}`}>{value}</span>
      {sub && <span className="text-[8px] font-mono text-muted-foreground">{sub}</span>}
    </div>
  );
}

const TT_STYLE = { background: 'hsl(var(--card))', border: '1px solid hsl(var(--border))', fontFamily: 'monospace', fontSize: 9 };

// ── overview ───────────────────────────────────────────────────────────────────

function OverviewTab({ trades }: { trades: Trade[] }) {
  const totalPnl = calcTotalPnl(trades);
  const winRate = calcWinRate(trades);
  const sharpe = calcSharpeRatio(trades);
  const sortino_ = sortino(trades);
  const maxDD = calcMaxDrawdown(trades);
  const maxDDPct = calcMaxDrawdownPct(trades);
  const pf = calcProfitFactor(trades);
  const exp = calcExpectancy(trades);
  const var_ = var95(trades);
  const calmar_ = calmar(trades);
  const avgW = calcAvgWin(trades);
  const avgL = calcAvgLoss(trades);
  const best = Math.max(...trades.map(t => t.pnl));
  const worst = Math.min(...trades.map(t => t.pnl));

  const curve = equityCurve(trades);

  return (
    <div className="flex-1 min-h-0 overflow-y-auto">
      <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-6 gap-0 border-b border-border">
        <StatBox label="Total P&L" value={fmtDollar(totalPnl)} pos={totalPnl > 0} neg={totalPnl < 0} />
        <StatBox label="Win Rate" value={`${winRate.toFixed(1)}%`} pos={winRate > 55} neg={winRate < 45} />
        <StatBox label="Profit Factor" value={isFinite(pf) ? pf.toFixed(2) : '∞'} pos={pf > 1.5} neg={pf < 1} />
        <StatBox label="Expectancy" value={fmtDollar(exp)} sub="per trade" pos={exp > 0} neg={exp < 0} />
        <StatBox label="Avg Win" value={fmtDollar(avgW)} sub={`${trades.filter(t => t.pnl > 0).length} wins`} pos />
        <StatBox label="Avg Loss" value={fmtDollar(avgL)} sub={`${trades.filter(t => t.pnl < 0).length} losses`} neg />
        <StatBox label="Sharpe Ratio" value={sharpe.toFixed(2)} sub="trade-level" pos={sharpe > 1} neg={sharpe < 0} />
        <StatBox label="Sortino Ratio" value={isFinite(sortino_) ? sortino_.toFixed(2) : '∞'} sub="downside dev" pos={sortino_ > 1} neg={sortino_ < 0} />
        <StatBox label="Max Drawdown" value={fmtDollar(maxDD)} neg sub={`${Math.abs(maxDDPct).toFixed(1)}% of equity`} />
        <StatBox label="Calmar Ratio" value={calmar_.toFixed(2)} sub="return/maxDD" pos={calmar_ > 1} neg={calmar_ < 0} />
        <StatBox label="VaR (95%)" value={fmtDollar(var_)} sub="5th percentile loss" neg />
        <StatBox label="Best / Worst" value={`${fmtDollar(best)} / ${fmtDollar(worst)}`} />
      </div>

      <div className="p-3">
        <div className="text-[7px] font-mono text-accent uppercase tracking-widest mb-2">Equity Curve</div>
        <div className="h-[180px]">
          <ResponsiveContainer width="100%" height="100%">
            <AreaChart data={curve} margin={{ top: 4, right: 8, bottom: 0, left: 0 }}>
              <defs>
                <linearGradient id="eqGrad" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="10%" stopColor={totalPnl >= 0 ? 'hsl(var(--positive))' : 'hsl(var(--negative))'} stopOpacity={0.3} />
                  <stop offset="95%" stopColor={totalPnl >= 0 ? 'hsl(var(--positive))' : 'hsl(var(--negative))'} stopOpacity={0} />
                </linearGradient>
              </defs>
              <CartesianGrid strokeDasharray="2 4" stroke="hsl(var(--border))" vertical={false} />
              <XAxis dataKey="date" tick={{ fontSize: 8, fontFamily: 'monospace', fill: 'hsl(var(--muted-foreground))' }} axisLine={false} tickLine={false} interval="preserveStartEnd" />
              <YAxis tick={{ fontSize: 8, fontFamily: 'monospace', fill: 'hsl(var(--muted-foreground))' }} width={60} tickFormatter={v => `$${(v/1000).toFixed(0)}K`} axisLine={false} tickLine={false} />
              <Tooltip contentStyle={TT_STYLE} formatter={(v: number) => [`$${fmt(v)}`, 'Balance']} />
              <ReferenceLine y={100000} stroke="hsl(var(--border))" strokeDasharray="4 4" />
              <Area dataKey="balance" stroke={totalPnl >= 0 ? 'hsl(var(--positive))' : 'hsl(var(--negative))'} strokeWidth={1.5} fill="url(#eqGrad)" dot={false} />
            </AreaChart>
          </ResponsiveContainer>
        </div>
      </div>

      <div className="p-3 border-t border-border">
        <div className="text-[7px] font-mono text-accent uppercase tracking-widest mb-2">Drawdown</div>
        <div className="h-[100px]">
          <ResponsiveContainer width="100%" height="100%">
            <AreaChart data={curve} margin={{ top: 4, right: 8, bottom: 0, left: 0 }}>
              <CartesianGrid strokeDasharray="2 4" stroke="hsl(var(--border))" vertical={false} />
              <XAxis dataKey="date" tick={{ fontSize: 8, fontFamily: 'monospace', fill: 'hsl(var(--muted-foreground))' }} axisLine={false} tickLine={false} interval="preserveStartEnd" />
              <YAxis tick={{ fontSize: 8, fontFamily: 'monospace', fill: 'hsl(var(--muted-foreground))' }} width={40} tickFormatter={v => `${v.toFixed(0)}%`} axisLine={false} tickLine={false} />
              <Tooltip contentStyle={TT_STYLE} formatter={(v: number) => [`${v.toFixed(2)}%`, 'Drawdown']} />
              <ReferenceLine y={0} stroke="hsl(var(--border))" />
              <Area dataKey="drawdown" stroke="hsl(var(--negative))" strokeWidth={1.5} fill="hsl(var(--negative) / 0.15)" dot={false} />
            </AreaChart>
          </ResponsiveContainer>
        </div>
      </div>
    </div>
  );
}

// ── allocation ─────────────────────────────────────────────────────────────────

function AllocationBar({ label, value, max, color, sub }: {
  label: string; value: number; max: number; color: string; sub?: string;
}) {
  const pct = max === 0 ? 0 : (Math.abs(value) / Math.abs(max)) * 100;
  return (
    <div className="flex items-center gap-2 py-1 border-b border-border/30">
      <span className="text-[9px] font-mono text-muted-foreground w-24 shrink-0 truncate">{label}</span>
      <div className="flex-1 h-3 bg-border/40 overflow-hidden">
        <div className={`h-full ${color}`} style={{ width: `${pct}%` }} />
      </div>
      <span className="text-[9px] font-mono font-bold tabular-nums w-16 text-right text-foreground">{fmtDollar(value)}</span>
      {sub && <span className="text-[8px] font-mono text-muted-foreground w-12 text-right">{sub}</span>}
    </div>
  );
}

function AllocationTab({ trades }: { trades: Trade[] }) {
  const byType = groupByType(trades);
  const bySymbol = groupBySymbol(trades).slice(0, 15);

  const bySector = useMemo(() => {
    const map: Record<string, { pnl: number; count: number }> = {};
    for (const t of trades) {
      const s = t.sector || 'Unknown';
      if (!map[s]) map[s] = { pnl: 0, count: 0 };
      map[s].pnl += t.pnl;
      map[s].count++;
    }
    return Object.entries(map).map(([sector, d]) => ({ sector, ...d })).sort((a, b) => b.pnl - a.pnl);
  }, [trades]);

  const byStrategy = useMemo(() => {
    const map: Record<string, { pnl: number; count: number }> = {};
    for (const t of trades) {
      const s = t.strategy || 'Unknown';
      if (!map[s]) map[s] = { pnl: 0, count: 0 };
      map[s].pnl += t.pnl;
      map[s].count++;
    }
    return Object.entries(map).map(([strategy, d]) => ({ strategy, ...d })).sort((a, b) => b.pnl - a.pnl);
  }, [trades]);

  const maxSymbol = Math.max(...bySymbol.map(s => Math.abs(s.totalPnl)), 1);
  const maxSector = Math.max(...bySector.map(s => Math.abs(s.pnl)), 1);
  const maxStrat = Math.max(...byStrategy.map(s => Math.abs(s.pnl)), 1);

  const daily = dailyPnl(trades);
  const maxDaily = Math.max(...daily.map(d => Math.abs(d.pnl)), 1);

  return (
    <div className="flex-1 min-h-0 overflow-y-auto">
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-0 border-b border-border">
        {/* By type */}
        <div className="p-3 border-r border-border">
          <div className="text-[7px] font-mono text-accent uppercase tracking-widest mb-2">By Instrument Type</div>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-0 mb-3">
            {byType.map(t => (
              <div key={t.type} className="border border-border p-2">
                <div className="text-[7px] font-mono text-muted-foreground">{t.type}</div>
                <div className={`text-[12px] font-mono font-bold ${t.totalPnl >= 0 ? 'text-positive' : 'text-negative'}`}>{fmtDollar(t.totalPnl)}</div>
                <div className="text-[8px] font-mono text-muted-foreground">{t.trades} trades · {t.winRate.toFixed(0)}% WR</div>
              </div>
            ))}
          </div>

          <div className="text-[7px] font-mono text-accent uppercase tracking-widest mb-2 mt-3">By Strategy</div>
          {byStrategy.slice(0, 8).map(s => (
            <AllocationBar key={s.strategy} label={s.strategy} value={s.pnl}
              max={maxStrat} color={s.pnl >= 0 ? 'bg-positive' : 'bg-negative'}
              sub={`${s.count}T`} />
          ))}
        </div>

        {/* By sector */}
        <div className="p-3">
          <div className="text-[7px] font-mono text-accent uppercase tracking-widest mb-2">By Sector</div>
          {bySector.map(s => (
            <AllocationBar key={s.sector} label={s.sector} value={s.pnl}
              max={maxSector} color={s.pnl >= 0 ? 'bg-positive' : 'bg-negative'}
              sub={`${s.count}T`} />
          ))}
        </div>
      </div>

      {/* By symbol */}
      <div className="p-3 border-b border-border">
        <div className="text-[7px] font-mono text-accent uppercase tracking-widest mb-2">Top 15 Symbols by P&L</div>
        {bySymbol.map(s => (
          <AllocationBar key={s.symbol} label={s.symbol} value={s.totalPnl}
            max={maxSymbol} color={s.totalPnl >= 0 ? 'bg-positive' : 'bg-negative'}
            sub={`${s.winRate.toFixed(0)}% WR`} />
        ))}
      </div>

      {/* Daily P&L bars */}
      <div className="p-3">
        <div className="text-[7px] font-mono text-accent uppercase tracking-widest mb-2">Daily P&L</div>
        <div className="h-[120px]">
          <ResponsiveContainer width="100%" height="100%">
            <BarChart data={daily} margin={{ top: 2, right: 8, bottom: 0, left: 0 }}>
              <CartesianGrid strokeDasharray="2 4" stroke="hsl(var(--border))" vertical={false} />
              <XAxis dataKey="date" tick={{ fontSize: 8, fontFamily: 'monospace', fill: 'hsl(var(--muted-foreground))' }} axisLine={false} tickLine={false} interval="preserveStartEnd" />
              <YAxis tick={{ fontSize: 8, fontFamily: 'monospace', fill: 'hsl(var(--muted-foreground))' }} width={50} tickFormatter={v => fmtDollar(v)} axisLine={false} tickLine={false} />
              <Tooltip contentStyle={TT_STYLE} formatter={(v: number) => [fmtDollar(v), 'P&L']} />
              <ReferenceLine y={0} stroke="hsl(var(--border))" />
              <Bar dataKey="pnl">
                {daily.map((d, i) => (
                  <Cell key={i} fill={d.pnl >= 0 ? 'hsl(var(--positive))' : 'hsl(var(--negative))'} opacity={0.8} />
                ))}
              </Bar>
            </BarChart>
          </ResponsiveContainer>
        </div>
      </div>
    </div>
  );
}

// ── P&L waterfall ──────────────────────────────────────────────────────────────

function PnlTab({ trades }: { trades: Trade[] }) {
  const sorted = [...trades].sort((a, b) => a.date.localeCompare(b.date));
  const wins = sorted.filter(t => t.pnl > 0);
  const losses = sorted.filter(t => t.pnl < 0);

  // Histogram bins
  const bins = 20;
  const all = sorted.map(t => t.pnl);
  const minP = Math.min(...all);
  const maxP = Math.max(...all);
  const step = (maxP - minP) / bins || 1;
  const hist: { center: number; count: number; isPos: boolean }[] = [];
  for (let i = 0; i < bins; i++) {
    const lo = minP + i * step, hi = lo + step;
    const center = (lo + hi) / 2;
    const count = all.filter(p => p >= lo && (i === bins - 1 ? p <= hi : p < hi)).length;
    hist.push({ center: +center.toFixed(0), count, isPos: center >= 0 });
  }

  // Cumulative P&L per trade
  const waterfall = sorted.map((t, i) => {
    const cumPnl = sorted.slice(0, i + 1).reduce((s, x) => s + x.pnl, 0);
    return { i: i + 1, pnl: t.pnl, cum: cumPnl, symbol: t.symbol };
  });

  return (
    <div className="flex-1 min-h-0 overflow-y-auto">
      <div className="grid grid-cols-2 md:grid-cols-4 gap-0 border-b border-border">
        <StatBox label="Gross Profit" value={fmtDollar(wins.reduce((s, t) => s + t.pnl, 0))} pos />
        <StatBox label="Gross Loss" value={fmtDollar(losses.reduce((s, t) => s + t.pnl, 0))} neg />
        <StatBox label="Largest Win" value={wins.length ? fmtDollar(Math.max(...wins.map(t => t.pnl))) : '—'} pos />
        <StatBox label="Largest Loss" value={losses.length ? fmtDollar(Math.min(...losses.map(t => t.pnl))) : '—'} neg />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-0 border-b border-border">
        <div className="p-3 border-r border-border">
          <div className="text-[7px] font-mono text-accent uppercase tracking-widest mb-2">Cumulative P&L per Trade</div>
          <div className="h-[180px]">
            <ResponsiveContainer width="100%" height="100%">
              <LineChart data={waterfall} margin={{ top: 4, right: 8, bottom: 0, left: 0 }}>
                <CartesianGrid strokeDasharray="2 4" stroke="hsl(var(--border))" vertical={false} />
                <XAxis dataKey="i" tick={{ fontSize: 8, fontFamily: 'monospace', fill: 'hsl(var(--muted-foreground))' }} axisLine={false} tickLine={false} label={{ value: 'trade #', fontSize: 8, fill: 'hsl(var(--muted-foreground))', position: 'insideBottomRight', dy: 8 }} />
                <YAxis tick={{ fontSize: 8, fontFamily: 'monospace', fill: 'hsl(var(--muted-foreground))' }} width={55} tickFormatter={v => fmtDollar(v)} axisLine={false} tickLine={false} />
                <Tooltip contentStyle={TT_STYLE} formatter={(v: number, name: string) => [fmtDollar(v), name === 'cum' ? 'Cum P&L' : 'Trade P&L']} labelFormatter={(v: number) => `Trade #${v}`} />
                <ReferenceLine y={0} stroke="hsl(var(--border))" />
                <Line dataKey="cum" stroke="hsl(var(--accent))" strokeWidth={1.5} dot={false} />
              </LineChart>
            </ResponsiveContainer>
          </div>
        </div>

        <div className="p-3">
          <div className="text-[7px] font-mono text-accent uppercase tracking-widest mb-2">P&L Distribution</div>
          <div className="h-[180px]">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={hist} margin={{ top: 4, right: 8, bottom: 0, left: 0 }}>
                <CartesianGrid strokeDasharray="2 4" stroke="hsl(var(--border))" vertical={false} />
                <XAxis dataKey="center" tick={{ fontSize: 7, fontFamily: 'monospace', fill: 'hsl(var(--muted-foreground))' }} axisLine={false} tickLine={false} tickFormatter={v => fmtDollar(Number(v))} />
                <YAxis tick={{ fontSize: 8, fontFamily: 'monospace', fill: 'hsl(var(--muted-foreground))' }} width={25} axisLine={false} tickLine={false} />
                <Tooltip contentStyle={TT_STYLE} formatter={(v: number) => [v, 'Trades']} labelFormatter={(v: number) => fmtDollar(Number(v))} />
                <ReferenceLine x={0} stroke="hsl(var(--border))" />
                <Bar dataKey="count">
                  {hist.map((b, i) => <Cell key={i} fill={b.isPos ? 'hsl(var(--positive))' : 'hsl(var(--negative))'} opacity={0.75} />)}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>
      </div>

      {/* Trade-level P&L bars */}
      <div className="p-3">
        <div className="text-[7px] font-mono text-accent uppercase tracking-widest mb-2">Individual Trade P&L (all {sorted.length} trades)</div>
        <div className="h-[120px]">
          <ResponsiveContainer width="100%" height="100%">
            <BarChart data={waterfall} margin={{ top: 2, right: 8, bottom: 0, left: 0 }}>
              <CartesianGrid strokeDasharray="2 4" stroke="hsl(var(--border))" vertical={false} />
              <XAxis dataKey="i" hide />
              <YAxis tick={{ fontSize: 8, fontFamily: 'monospace', fill: 'hsl(var(--muted-foreground))' }} width={55} tickFormatter={v => fmtDollar(v)} axisLine={false} tickLine={false} />
              <Tooltip contentStyle={TT_STYLE} formatter={(v: number) => [fmtDollar(v), 'P&L']} labelFormatter={(v: number) => `#${v} ${waterfall[v - 1]?.symbol ?? ''}`} />
              <ReferenceLine y={0} stroke="hsl(var(--border))" />
              <Bar dataKey="pnl" maxBarSize={8}>
                {waterfall.map((w, i) => <Cell key={i} fill={w.pnl >= 0 ? 'hsl(var(--positive))' : 'hsl(var(--negative))'} opacity={0.8} />)}
              </Bar>
            </BarChart>
          </ResponsiveContainer>
        </div>
      </div>
    </div>
  );
}

// ── risk ───────────────────────────────────────────────────────────────────────

function RiskTab({ trades }: { trades: Trade[] }) {
  const rollingSharpe = rollingN(trades, 20, calcSharpeRatio);
  const rollingSortino = rollingN(trades, 20, sortino);
  const curve = equityCurve(trades);

  const setups = ['A+', 'A', 'B', 'C'] as const;
  const bySetup = setups.map(s => {
    const ts = trades.filter(t => t.setup === s);
    return { setup: s, count: ts.length, pnl: calcTotalPnl(ts), wr: calcWinRate(ts), exp: calcExpectancy(ts) };
  });

  return (
    <div className="flex-1 min-h-0 overflow-y-auto">
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-0 border-b border-border">
        <div className="p-3 border-r border-border">
          <div className="text-[7px] font-mono text-accent uppercase tracking-widest mb-2">Rolling 20-Trade Sharpe</div>
          <div className="h-[160px]">
            <ResponsiveContainer width="100%" height="100%">
              <LineChart data={rollingSharpe} margin={{ top: 4, right: 8, bottom: 0, left: 0 }}>
                <CartesianGrid strokeDasharray="2 4" stroke="hsl(var(--border))" vertical={false} />
                <XAxis dataKey="date" tick={{ fontSize: 8, fontFamily: 'monospace', fill: 'hsl(var(--muted-foreground))' }} axisLine={false} tickLine={false} interval="preserveStartEnd" />
                <YAxis tick={{ fontSize: 8, fontFamily: 'monospace', fill: 'hsl(var(--muted-foreground))' }} width={35} axisLine={false} tickLine={false} />
                <Tooltip contentStyle={TT_STYLE} formatter={(v: number | null) => [v != null ? v.toFixed(2) : '—', 'Sharpe (20T)']} />
                <ReferenceLine y={0} stroke="hsl(var(--border))" />
                <ReferenceLine y={1} stroke="hsl(var(--positive))" strokeDasharray="3 3" strokeOpacity={0.4} />
                <Line dataKey="value" stroke="hsl(var(--accent))" strokeWidth={1.5} dot={false} connectNulls={false} />
              </LineChart>
            </ResponsiveContainer>
          </div>
        </div>
        <div className="p-3">
          <div className="text-[7px] font-mono text-accent uppercase tracking-widest mb-2">Rolling 20-Trade Sortino</div>
          <div className="h-[160px]">
            <ResponsiveContainer width="100%" height="100%">
              <LineChart data={rollingSortino} margin={{ top: 4, right: 8, bottom: 0, left: 0 }}>
                <CartesianGrid strokeDasharray="2 4" stroke="hsl(var(--border))" vertical={false} />
                <XAxis dataKey="date" tick={{ fontSize: 8, fontFamily: 'monospace', fill: 'hsl(var(--muted-foreground))' }} axisLine={false} tickLine={false} interval="preserveStartEnd" />
                <YAxis tick={{ fontSize: 8, fontFamily: 'monospace', fill: 'hsl(var(--muted-foreground))' }} width={35} axisLine={false} tickLine={false} />
                <Tooltip contentStyle={TT_STYLE} formatter={(v: number | null) => [v != null ? v.toFixed(2) : '—', 'Sortino (20T)']} />
                <ReferenceLine y={0} stroke="hsl(var(--border))" />
                <ReferenceLine y={1} stroke="hsl(var(--positive))" strokeDasharray="3 3" strokeOpacity={0.4} />
                <Line dataKey="value" stroke="hsl(var(--positive))" strokeWidth={1.5} dot={false} connectNulls={false} />
              </LineChart>
            </ResponsiveContainer>
          </div>
        </div>
      </div>

      {/* Setup quality */}
      <div className="p-3 border-b border-border">
        <div className="text-[7px] font-mono text-accent uppercase tracking-widest mb-2">Setup Quality Breakdown</div>
        <div className="border border-border">
          <div className="flex text-[7px] font-mono text-muted-foreground border-b border-border px-2 py-1 bg-surface-deep uppercase">
            <span className="w-14 shrink-0">Setup</span>
            <span className="w-16 shrink-0 text-right">Trades</span>
            <span className="w-20 shrink-0 text-right">Total P&L</span>
            <span className="w-16 shrink-0 text-right">Win Rate</span>
            <span className="flex-1 text-right">Expectancy</span>
          </div>
          {bySetup.map(s => (
            <div key={s.setup} className="flex items-center px-2 py-1.5 border-b border-border/30 text-[9px] font-mono hover:bg-white/[0.02]">
              <span className="w-14 shrink-0 font-bold text-accent">{s.setup}</span>
              <span className="w-16 shrink-0 text-right tabular-nums">{s.count}</span>
              <span className={`w-20 shrink-0 text-right tabular-nums font-bold ${s.pnl >= 0 ? 'text-positive' : 'text-negative'}`}>{s.count > 0 ? fmtDollar(s.pnl) : '—'}</span>
              <span className="w-16 shrink-0 text-right tabular-nums">{s.count > 0 ? `${s.wr.toFixed(1)}%` : '—'}</span>
              <span className={`flex-1 text-right tabular-nums ${s.exp >= 0 ? 'text-positive' : 'text-negative'}`}>{s.count > 0 ? fmtDollar(s.exp) : '—'}</span>
            </div>
          ))}
        </div>
      </div>

      {/* Underwater curve */}
      <div className="p-3">
        <div className="text-[7px] font-mono text-accent uppercase tracking-widest mb-2">Drawdown Periods</div>
        <div className="h-[120px]">
          <ResponsiveContainer width="100%" height="100%">
            <AreaChart data={curve} margin={{ top: 4, right: 8, bottom: 0, left: 0 }}>
              <CartesianGrid strokeDasharray="2 4" stroke="hsl(var(--border))" vertical={false} />
              <XAxis dataKey="date" tick={{ fontSize: 8, fontFamily: 'monospace', fill: 'hsl(var(--muted-foreground))' }} axisLine={false} tickLine={false} interval="preserveStartEnd" />
              <YAxis tick={{ fontSize: 8, fontFamily: 'monospace', fill: 'hsl(var(--muted-foreground))' }} width={40} tickFormatter={v => `${v.toFixed(0)}%`} axisLine={false} tickLine={false} />
              <Tooltip contentStyle={TT_STYLE} formatter={(v: number) => [`${v.toFixed(2)}%`, 'DD']} />
              <ReferenceLine y={0} stroke="hsl(var(--border))" />
              <Area dataKey="drawdown" stroke="hsl(var(--negative))" strokeWidth={1.5} fill="hsl(var(--negative) / 0.2)" dot={false} />
            </AreaChart>
          </ResponsiveContainer>
        </div>
      </div>
    </div>
  );
}

// ── correlation ────────────────────────────────────────────────────────────────

function rColor(r: number) {
  if (r >= 0.7) return 'hsl(var(--negative))';
  if (r >= 0.4) return 'hsl(var(--accent))';
  if (r >= 0.1) return 'hsl(50 100% 55%)';
  if (r >= -0.1) return 'hsl(var(--muted-foreground))';
  if (r >= -0.4) return 'hsl(210 80% 60%)';
  return 'hsl(210 90% 45%)';
}

function CorrelationTab({ trades }: { trades: Trade[] }) {
  const { symbols, matrix } = useMemo(() => correlationMatrix(trades), [trades]);

  if (symbols.length < 2) return (
    <div className="flex-1 flex items-center justify-center text-muted-foreground text-[10px] font-mono text-center px-8">
      Need trades in at least 2 different symbols to compute correlation.<br />
      Add more trades to unlock this view.
    </div>
  );

  return (
    <div className="flex-1 min-h-0 overflow-y-auto p-3">
      <div className="text-[7px] font-mono text-accent uppercase tracking-widest mb-3">Symbol-to-Symbol P&L Correlation (daily returns)</div>

      <div className="overflow-x-auto">
        <table className="border-collapse text-[8px] font-mono">
          <thead>
            <tr>
              <th className="w-16 h-8 text-muted-foreground text-right pr-2 font-normal border-b border-r border-border"></th>
              {symbols.map(s => (
                <th key={s} className="w-14 h-8 text-muted-foreground font-bold text-center border-b border-border px-1 truncate max-w-[56px]">{s}</th>
              ))}
            </tr>
          </thead>
          <tbody>
            {symbols.map(rowSym => (
              <tr key={rowSym}>
                <td className="text-right pr-2 py-0.5 font-bold text-foreground border-r border-border whitespace-nowrap">{rowSym}</td>
                {symbols.map(colSym => {
                  const cell = matrix.find(m => m.a === rowSym && m.b === colSym);
                  const r = cell?.r ?? 0;
                  const isDiag = rowSym === colSym;
                  return (
                    <td key={colSym} className="text-center py-0.5 px-1 border border-border/30"
                      style={{ background: isDiag ? 'hsl(var(--surface-deep))' : `${rColor(r)}22` }}>
                      <span style={{ color: isDiag ? 'hsl(var(--muted-foreground))' : rColor(r) }}
                        className="font-bold tabular-nums">
                        {isDiag ? '1.00' : r.toFixed(2)}
                      </span>
                    </td>
                  );
                })}
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      <div className="mt-4 flex gap-4 text-[8px] font-mono flex-wrap">
        {[
          { color: 'hsl(var(--negative))', label: '≥0.7 High positive — trade together' },
          { color: 'hsl(var(--accent))', label: '0.4–0.7 Moderate positive' },
          { color: 'hsl(50 100% 55%)', label: '0.1–0.4 Mild positive' },
          { color: 'hsl(var(--muted-foreground))', label: '−0.1–0.1 Uncorrelated — best diversifier' },
          { color: 'hsl(210 80% 60%)', label: '−0.4 to −0.1 Mild negative' },
          { color: 'hsl(210 90% 45%)', label: '<−0.4 Strong negative hedge' },
        ].map(l => (
          <div key={l.label} className="flex items-center gap-1">
            <div className="w-3 h-3 rounded-sm flex-shrink-0" style={{ background: l.color }} />
            <span className="text-muted-foreground">{l.label}</span>
          </div>
        ))}
      </div>
    </div>
  );
}

// ── tabs ───────────────────────────────────────────────────────────────────────

type Tab = 'overview' | 'allocation' | 'pnl' | 'risk' | 'correlation';
const TABS: { id: Tab; label: string }[] = [
  { id: 'overview',     label: 'OVERVIEW' },
  { id: 'allocation',   label: 'ALLOCATION' },
  { id: 'pnl',         label: 'P&L' },
  { id: 'risk',         label: 'RISK' },
  { id: 'correlation',  label: 'CORRELATION' },
];

// ── main ───────────────────────────────────────────────────────────────────────

export default function PortfolioRiskView() {
  const { trades, loading } = useTrades();
  const [tab, setTab] = useState<Tab>('overview');

  const totalPnl = useMemo(() => calcTotalPnl(trades), [trades]);
  const n = trades.length;

  return (
    <CmdShell
      code="PORT"
      title="Portfolio Risk Analyzer"
      headerRight={
        <span className="text-[9px] font-mono text-muted-foreground px-2">
          {n} trades · {fmtDollar(totalPnl)} total P&L
        </span>
      }
      tabs={<CmdTabs tabs={TABS} active={tab} onChange={t => setTab(t as Tab)} />}
      footerLeft="Sharpe · Sortino · Calmar · VaR · Drawdown · Correlation"
      footerRight="Live — reads from DB via TradeContext"
    >
      {loading ? (
        <div className="flex-1 flex items-center justify-center text-muted-foreground text-[10px] font-mono animate-pulse">
          Loading trades from database…
        </div>
      ) : n === 0 ? (
        <div className="flex-1 flex items-center justify-center text-muted-foreground text-[10px] font-mono text-center px-8">
          No trades found.<br />Add trades via NEW to see portfolio analytics.
        </div>
      ) : (
        <>
          {tab === 'overview'    && <OverviewTab trades={trades} />}
          {tab === 'allocation'  && <AllocationTab trades={trades} />}
          {tab === 'pnl'        && <PnlTab trades={trades} />}
          {tab === 'risk'        && <RiskTab trades={trades} />}
          {tab === 'correlation' && <CorrelationTab trades={trades} />}
        </>
      )}
    </CmdShell>
  );
}
