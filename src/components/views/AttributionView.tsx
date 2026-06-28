import { useMemo, useState } from 'react';
import ViewHeader from '@/components/ViewHeader';
import { useTrades } from '@/contexts/TradeContext';
import { Trade } from '@/types/trade';

type Tab = 'CLOCK' | 'GRADE' | 'HOLD' | 'SECTOR';

const TABS: Tab[] = ['CLOCK', 'GRADE', 'HOLD', 'SECTOR'];
const DAYS = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri'];
const GRADES: Trade['setup'][] = ['A+', 'A', 'B', 'C'];

function fmtPnl(n: number) {
  return `${n >= 0 ? '+' : ''}$${Math.abs(n).toLocaleString('en-US', { minimumFractionDigits: 0, maximumFractionDigits: 0 })}`;
}

function fmtPct(n: number) {
  return `${n >= 0 ? '+' : ''}${n.toFixed(1)}%`;
}

function parseHour(date: string): number {
  return parseInt(date.split(' ')[1]?.split(':')[0] ?? '9', 10);
}

function parseDow(date: string): number {
  // Returns 0=Mon … 4=Fri; Saturday/Sunday → -1
  const d = new Date(date.split(' ')[0]);
  return d.getDay() === 0 ? -1 : d.getDay() === 6 ? -1 : d.getDay() - 1;
}

// ─── Color helpers ────────────────────────────────────────────────────────────

function heatColor(val: number, maxAbs: number): string {
  if (maxAbs === 0) return 'hsl(0,0%,12%)';
  const t = Math.min(Math.abs(val) / maxAbs, 1);
  if (val > 0) return `hsl(142,${Math.round(40 + t * 55)}%,${Math.round(20 + t * 25)}%)`;
  if (val < 0) return `hsl(0,${Math.round(40 + t * 55)}%,${Math.round(20 + t * 25)}%)`;
  return 'hsl(0,0%,15%)';
}

// ─── Clock tab (hour × dow heatmap) ──────────────────────────────────────────

function ClockTab({ trades }: { trades: Trade[] }) {
  const { grid, hourTotals, maxAbs } = useMemo(() => {
    const map: Record<string, number[]> = {};
    for (const t of trades) {
      const h = parseHour(t.date);
      const d = parseDow(t.date);
      if (d < 0) continue;
      const k = `${h}:${d}`;
      if (!map[k]) map[k] = [];
      map[k].push(t.pnl);
    }
    const hours = Array.from({ length: 10 }, (_, i) => i + 9); // 9–18
    const grid: { h: number; d: number; avg: number; count: number }[] = [];
    const hourTotals: { h: number; total: number; count: number }[] = [];
    for (const h of hours) {
      let hTotal = 0, hCount = 0;
      for (let d = 0; d < 5; d++) {
        const vals = map[`${h}:${d}`] ?? [];
        const avg = vals.length ? vals.reduce((a, b) => a + b, 0) / vals.length : 0;
        grid.push({ h, d, avg, count: vals.length });
        hTotal += vals.reduce((a, b) => a + b, 0);
        hCount += vals.length;
      }
      if (hCount > 0) hourTotals.push({ h, total: hTotal, count: hCount });
    }
    const maxAbs = Math.max(...grid.map(c => Math.abs(c.avg)), 0.01);
    return { grid, hourTotals, maxAbs };
  }, [trades]);

  const CELL_W = 52;
  const CELL_H = 22;
  const COL_LABELS_W = 40;
  const ROW_LABELS_H = 18;
  const W = COL_LABELS_W + DAYS.length * CELL_W + 2;
  const H = ROW_LABELS_H + 10 * CELL_H + 2;

  const sortedHours = [...hourTotals].sort((a, b) => b.total - a.total);
  const maxBarAbs = Math.max(...hourTotals.map(h => Math.abs(h.total)), 0.01);

  return (
    <div className="flex gap-6 p-4 flex-wrap">
      <div>
        <div className="text-[9px] font-mono text-muted-foreground uppercase mb-2 tracking-widest">Avg P&amp;L by Hour × Day</div>
        <svg width={W} height={H} className="block">
          {DAYS.map((d, di) => (
            <text key={d} x={COL_LABELS_W + di * CELL_W + CELL_W / 2} y={13} textAnchor="middle"
              className="fill-muted-foreground" fontSize={9} fontFamily="monospace">{d}</text>
          ))}
          {Array.from({ length: 10 }, (_, i) => i + 9).map((h, hi) => (
            <text key={h} x={COL_LABELS_W - 4} y={ROW_LABELS_H + hi * CELL_H + CELL_H / 2 + 4}
              textAnchor="end" className="fill-muted-foreground" fontSize={9} fontFamily="monospace">
              {h < 12 ? `${h}am` : h === 12 ? '12pm' : `${h - 12}pm`}
            </text>
          ))}
          {grid.map(({ h, d, avg, count }) => {
            const hi = h - 9;
            const x = COL_LABELS_W + d * CELL_W;
            const y = ROW_LABELS_H + hi * CELL_H;
            const bg = heatColor(avg, maxAbs);
            const tone = avg >= 0 ? '#4ade80' : '#f87171';
            return (
              <g key={`${h}:${d}`}>
                <rect x={x + 1} y={y + 1} width={CELL_W - 2} height={CELL_H - 2} fill={bg} rx={2} />
                {count > 0 && (
                  <text x={x + CELL_W / 2} y={y + CELL_H / 2 + 4} textAnchor="middle"
                    fontSize={8} fontFamily="monospace" fill={tone} fontWeight="bold">
                    {avg >= 0 ? '+' : ''}{Math.round(avg)}
                  </text>
                )}
                {count === 0 && (
                  <text x={x + CELL_W / 2} y={y + CELL_H / 2 + 4} textAnchor="middle"
                    fontSize={8} fontFamily="monospace" fill="#444">—</text>
                )}
              </g>
            );
          })}
        </svg>
        <div className="text-[8px] font-mono text-muted-foreground/50 mt-1">Values = avg P&amp;L per trade ($)</div>
      </div>

      <div className="flex-1 min-w-[180px]">
        <div className="text-[9px] font-mono text-muted-foreground uppercase mb-2 tracking-widest">Best / Worst Hours</div>
        {sortedHours.map(({ h, total, count }) => {
          const barPct = (Math.abs(total) / maxBarAbs) * 100;
          const isPos = total >= 0;
          return (
            <div key={h} className="flex items-center gap-2 mb-1">
              <span className="text-[9px] font-mono text-muted-foreground w-10 text-right">
                {h < 12 ? `${h}am` : h === 12 ? '12pm' : `${h - 12}pm`}
              </span>
              <div className="flex-1 bg-surface-deep h-3 relative">
                <div
                  className={`absolute top-0 left-0 h-full ${isPos ? 'bg-positive/60' : 'bg-negative/60'}`}
                  style={{ width: `${barPct}%` }}
                />
              </div>
              <span className={`text-[9px] font-mono font-bold w-16 text-right ${isPos ? 'text-positive' : 'text-negative'}`}>
                {fmtPnl(total)}
              </span>
              <span className="text-[8px] font-mono text-muted-foreground/60">({count})</span>
            </div>
          );
        })}
        {sortedHours.length === 0 && (
          <div className="text-[9px] font-mono text-muted-foreground/50">No trade data</div>
        )}
      </div>
    </div>
  );
}

// ─── Grade tab ────────────────────────────────────────────────────────────────

function GradeTab({ trades }: { trades: Trade[] }) {
  const grades = useMemo(() => GRADES.map(g => {
    const ts = trades.filter(t => t.setup === g);
    const wins = ts.filter(t => t.pnl > 0);
    const total = ts.reduce((s, t) => s + t.pnl, 0);
    const wr = ts.length ? (wins.length / ts.length) * 100 : 0;
    const avg = ts.length ? total / ts.length : 0;
    return { grade: g, count: ts.length, total, wr, avg };
  }), [trades]);

  const maxAbs = Math.max(...grades.map(g => Math.abs(g.total)), 0.01);
  const gradeCls: Record<string, string> = { 'A+': 'text-[hsl(142,70%,55%)]', A: 'text-positive', B: 'text-[hsl(45,100%,60%)]', C: 'text-negative' };

  return (
    <div className="p-4 space-y-4 max-w-xl">
      <div className="text-[9px] font-mono text-muted-foreground uppercase tracking-widest mb-3">P&amp;L by Setup Grade</div>
      {grades.map(({ grade, count, total, wr, avg }) => {
        const barPct = (Math.abs(total) / maxAbs) * 100;
        const isPos = total >= 0;
        return (
          <div key={grade} className="grid grid-cols-[32px_1fr_60px_60px_60px_56px] gap-2 items-center">
            <span className={`text-[11px] font-mono font-bold ${gradeCls[grade]}`}>{grade}</span>
            <div className="bg-surface-deep h-4 relative">
              <div
                className={`absolute top-0 left-0 h-full ${isPos ? 'bg-positive/50' : 'bg-negative/50'}`}
                style={{ width: count > 0 ? `${barPct}%` : '0%' }}
              />
            </div>
            <span className={`text-[9px] font-mono font-bold text-right ${isPos ? 'text-positive' : 'text-negative'}`}>
              {count > 0 ? fmtPnl(total) : '—'}
            </span>
            <span className="text-[9px] font-mono text-muted-foreground text-right">{count > 0 ? `${wr.toFixed(0)}% WR` : '—'}</span>
            <span className="text-[9px] font-mono text-muted-foreground text-right">{count > 0 ? `avg ${fmtPnl(avg)}` : '—'}</span>
            <span className="text-[8px] font-mono text-muted-foreground/60 text-right">{count} trades</span>
          </div>
        );
      })}
    </div>
  );
}

// ─── Hold time tab ────────────────────────────────────────────────────────────

function HoldTab({ trades }: { trades: Trade[] }) {
  const buckets = useMemo(() => {
    const map: Record<string, Trade[]> = {};
    for (const t of trades) {
      const k = t.holdTime || 'Unknown';
      if (!map[k]) map[k] = [];
      map[k].push(t);
    }
    return Object.entries(map)
      .map(([label, ts]) => {
        const total = ts.reduce((s, t) => s + t.pnl, 0);
        const wr = (ts.filter(t => t.pnl > 0).length / ts.length) * 100;
        return { label, count: ts.length, total, wr, avg: total / ts.length };
      })
      .sort((a, b) => b.count - a.count);
  }, [trades]);

  const maxAbs = Math.max(...buckets.map(b => Math.abs(b.total)), 0.01);

  return (
    <div className="p-4 space-y-3 max-w-xl">
      <div className="text-[9px] font-mono text-muted-foreground uppercase tracking-widest mb-3">P&amp;L by Hold Time</div>
      {buckets.map(({ label, count, total, wr, avg }) => {
        const barPct = (Math.abs(total) / maxAbs) * 100;
        const isPos = total >= 0;
        return (
          <div key={label} className="grid grid-cols-[80px_1fr_60px_60px_56px] gap-2 items-center">
            <span className="text-[9px] font-mono text-foreground truncate">{label}</span>
            <div className="bg-surface-deep h-4 relative">
              <div className={`absolute top-0 left-0 h-full ${isPos ? 'bg-positive/50' : 'bg-negative/50'}`} style={{ width: `${barPct}%` }} />
            </div>
            <span className={`text-[9px] font-mono font-bold text-right ${isPos ? 'text-positive' : 'text-negative'}`}>{fmtPnl(total)}</span>
            <span className="text-[9px] font-mono text-muted-foreground text-right">{wr.toFixed(0)}% WR</span>
            <span className="text-[8px] font-mono text-muted-foreground/60 text-right">{count} trades</span>
          </div>
        );
      })}
      {buckets.length === 0 && <div className="text-[9px] font-mono text-muted-foreground/50">No trade data</div>}
    </div>
  );
}

// ─── Sector tab ───────────────────────────────────────────────────────────────

function SectorTab({ trades }: { trades: Trade[] }) {
  const sectors = useMemo(() => {
    const map: Record<string, Trade[]> = {};
    for (const t of trades) {
      const k = t.sector || 'Other';
      if (!map[k]) map[k] = [];
      map[k].push(t);
    }
    return Object.entries(map)
      .map(([label, ts]) => {
        const total = ts.reduce((s, t) => s + t.pnl, 0);
        const wr = (ts.filter(t => t.pnl > 0).length / ts.length) * 100;
        return { label, count: ts.length, total, wr, avg: total / ts.length };
      })
      .sort((a, b) => b.total - a.total);
  }, [trades]);

  const maxAbs = Math.max(...sectors.map(s => Math.abs(s.total)), 0.01);

  return (
    <div className="p-4 space-y-3 max-w-xl">
      <div className="text-[9px] font-mono text-muted-foreground uppercase tracking-widest mb-3">P&amp;L by Sector</div>
      {sectors.map(({ label, count, total, wr, avg }) => {
        const barPct = (Math.abs(total) / maxAbs) * 100;
        const isPos = total >= 0;
        return (
          <div key={label} className="grid grid-cols-[100px_1fr_64px_64px_56px] gap-2 items-center">
            <span className="text-[9px] font-mono text-foreground truncate">{label}</span>
            <div className="bg-surface-deep h-4 relative">
              <div className={`absolute top-0 left-0 h-full ${isPos ? 'bg-positive/50' : 'bg-negative/50'}`} style={{ width: `${barPct}%` }} />
            </div>
            <span className={`text-[9px] font-mono font-bold text-right ${isPos ? 'text-positive' : 'text-negative'}`}>{fmtPnl(total)}</span>
            <span className="text-[9px] font-mono text-muted-foreground text-right">{wr.toFixed(0)}% WR</span>
            <span className="text-[8px] font-mono text-muted-foreground/60 text-right">{count}</span>
          </div>
        );
      })}
      {sectors.length === 0 && <div className="text-[9px] font-mono text-muted-foreground/50">No trade data</div>}
    </div>
  );
}

// ─── Summary strip ─────────────────────────────────────────────────────────────

function SummaryStrip({ trades }: { trades: Trade[] }) {
  const stats = useMemo(() => {
    if (!trades.length) return null;
    const sorted = [...trades].sort((a, b) => a.date.localeCompare(b.date));
    let streak = 0, maxWin = 0, maxLoss = 0, cur = 0, dirIsWin = true;
    for (const t of sorted) {
      const w = t.pnl > 0;
      if (w === dirIsWin) { cur++; }
      else { cur = 1; dirIsWin = w; }
      if (dirIsWin) maxWin = Math.max(maxWin, cur);
      else maxLoss = Math.max(maxLoss, cur);
    }
    const last = sorted[sorted.length - 1];
    const lastIsWin = last.pnl > 0;
    streak = 1;
    for (let i = sorted.length - 2; i >= 0; i--) {
      if ((sorted[i].pnl > 0) === lastIsWin) streak++; else break;
    }
    return { streak, streakType: lastIsWin ? 'W' : 'L', maxWin, maxLoss, total: trades.length };
  }, [trades]);

  if (!stats) return null;
  const streakCls = stats.streakType === 'W' ? 'text-positive' : 'text-negative';

  return (
    <div className="flex items-center gap-6 px-4 py-2 border-b border-border bg-surface-deep text-[9px] font-mono">
      <span className="text-muted-foreground">STREAK</span>
      <span className={`font-bold ${streakCls}`}>{stats.streak}{stats.streakType}</span>
      <span className="text-muted-foreground">MAX WIN</span>
      <span className="text-positive font-bold">{stats.maxWin}W</span>
      <span className="text-muted-foreground">MAX LOSS</span>
      <span className="text-negative font-bold">{stats.maxLoss}L</span>
      <span className="text-muted-foreground ml-auto">{stats.total} TRADES</span>
    </div>
  );
}

// ─── Main view ────────────────────────────────────────────────────────────────

export default function AttributionView() {
  const { trades } = useTrades();
  const [tab, setTab] = useState<Tab>('CLOCK');

  return (
    <div className="flex flex-col h-full">
      <ViewHeader title="ATTR · P&amp;L Attribution" subtitle={`${trades.length} trades`} />
      <SummaryStrip trades={trades} />
      <div className="flex items-center gap-0 border-b border-border bg-surface-deep">
        {TABS.map(t => (
          <button
            key={t}
            onClick={() => setTab(t)}
            className={`px-3 py-1.5 text-[9px] font-mono font-bold uppercase tracking-wider border-r border-border transition-colors ${
              tab === t ? 'bg-accent/10 text-accent' : 'text-muted-foreground hover:text-foreground hover:bg-surface-elevated'
            }`}
          >
            {t}
          </button>
        ))}
      </div>
      <div className="flex-1 overflow-auto">
        {trades.length === 0 ? (
          <div className="flex items-center justify-center h-full">
            <div className="text-center">
              <div className="text-[11px] font-mono text-muted-foreground">No trade data</div>
              <div className="text-[9px] font-mono text-muted-foreground/50 mt-1">Add trades to see attribution analysis</div>
            </div>
          </div>
        ) : (
          <>
            {tab === 'CLOCK'  && <ClockTab trades={trades} />}
            {tab === 'GRADE'  && <GradeTab trades={trades} />}
            {tab === 'HOLD'   && <HoldTab trades={trades} />}
            {tab === 'SECTOR' && <SectorTab trades={trades} />}
          </>
        )}
      </div>
    </div>
  );
}
