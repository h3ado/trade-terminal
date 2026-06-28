// ROTN — Sector Rotation. RRG-style scatter + performance table + money flow.
import { useMemo, useState, useEffect } from 'react';
import CmdShell from './cmd/_shell/CmdShell';
import CmdTabs from './cmd/_shell/CmdTabs';

type Tab = 'rrg' | 'perf' | 'flow';
const TABS: { id: Tab; label: string }[] = [
  { id: 'rrg',  label: 'RRG CHART' },
  { id: 'perf', label: 'PERFORMANCE' },
  { id: 'flow', label: 'MONEY FLOW' },
];

const SECTORS = [
  { sym: 'XLK',  name: 'Technology',       color: '#60a5fa' },
  { sym: 'XLF',  name: 'Financials',       color: '#f59e0b' },
  { sym: 'XLE',  name: 'Energy',           color: '#f97316' },
  { sym: 'XLV',  name: 'Health Care',      color: '#34d399' },
  { sym: 'XLY',  name: 'Cons. Discret.',   color: '#a78bfa' },
  { sym: 'XLP',  name: 'Cons. Staples',    color: '#94a3b8' },
  { sym: 'XLI',  name: 'Industrials',      color: '#fbbf24' },
  { sym: 'XLU',  name: 'Utilities',        color: '#6ee7b7' },
  { sym: 'XLB',  name: 'Materials',        color: '#fb7185' },
  { sym: 'XLRE', name: 'Real Estate',      color: '#c084fc' },
  { sym: 'XLC',  name: 'Comm. Services',   color: '#38bdf8' },
];

const QUADRANTS = [
  { label: 'LEADING',   x: 1, y: 1, cls: 'text-positive' },
  { label: 'WEAKENING', x: 1, y: -1, cls: 'text-accent' },
  { label: 'LAGGING',   x: -1, y: -1, cls: 'text-negative' },
  { label: 'IMPROVING', x: -1, y: 1, cls: 'text-blue-400' },
];

// Seeded helpers
function hash(s: string) { let h = 2166136261; for (const c of s) { h ^= c.charCodeAt(0); h = Math.imul(h, 16777619); } return h >>> 0; }
function seeded(key: string, lo: number, hi: number) { return lo + (hash(key) / 0xffffffff) * (hi - lo); }

interface SectorPoint {
  sym: string;
  name: string;
  color: string;
  rs: number;      // Relative strength vs SPY (-2 to +2)
  mom: number;     // RS momentum (-2 to +2)
  tail: { rs: number; mom: number }[];
  perf1d: number;
  perf1w: number;
  perf1m: number;
  perf3m: number;
  volRatio: number;  // volume ratio vs 20d avg
  flowBn: number;    // estimated flow $B
}

function buildData(): SectorPoint[] {
  const dayKey = new Date().toISOString().slice(0, 10);
  return SECTORS.map(s => {
    const rs  = seeded(s.sym + ':rs:' + dayKey, -1.8, 1.8);
    const mom = seeded(s.sym + ':mom:' + dayKey, -1.8, 1.8);
    const tail = Array.from({ length: 4 }, (_, i) => ({
      rs:  seeded(s.sym + ':rs:t' + i, rs - 0.5, rs + 0.2),
      mom: seeded(s.sym + ':mom:t' + i, mom - 0.3, mom + 0.3),
    }));
    return {
      ...s,
      rs:  +rs.toFixed(2),
      mom: +mom.toFixed(2),
      tail,
      perf1d: +seeded(s.sym + ':1d', -2.5, 2.5).toFixed(2),
      perf1w: +seeded(s.sym + ':1w', -5, 5).toFixed(2),
      perf1m: +seeded(s.sym + ':1m', -10, 10).toFixed(2),
      perf3m: +seeded(s.sym + ':3m', -18, 18).toFixed(2),
      volRatio: +seeded(s.sym + ':vr', 0.6, 2.5).toFixed(2),
      flowBn:   +seeded(s.sym + ':fl', -2.5, 3.5).toFixed(2),
    };
  });
}

function quadrantOf(rs: number, mom: number) {
  if (rs >= 0 && mom >= 0) return 'LEADING';
  if (rs >= 0 && mom < 0)  return 'WEAKENING';
  if (rs < 0  && mom < 0)  return 'LAGGING';
  return 'IMPROVING';
}

// ─── RRG Chart ───────────────────────────────────────────────────────────────

function RRGChart({ sectors }: { sectors: SectorPoint[] }) {
  const W = 500, H = 460, CX = W / 2, CY = H / 2, R = 2.2;
  const toSvg = (v: number, center: number) => center + (v / R) * (center - 40);

  return (
    <svg viewBox={`0 0 ${W} ${H}`} className="w-full h-full max-h-[460px]" style={{ fontFamily: 'monospace' }}>
      {/* Quadrant fills */}
      <rect x={CX} y={40}  width={CX - 40} height={CY - 40}  fill="hsl(var(--positive)/0.06)" />
      <rect x={CX} y={CY}  width={CX - 40} height={CY - 40}  fill="hsl(var(--accent)/0.06)" />
      <rect x={40} y={CY}  width={CX - 40} height={CY - 40}  fill="hsl(var(--negative)/0.06)" />
      <rect x={40} y={40}  width={CX - 40} height={CY - 40}  fill="hsl(45,80%,50%,0.06)" />

      {/* Axes */}
      <line x1={40} y1={CY} x2={W - 40} y2={CY} stroke="hsl(var(--border))" strokeWidth="0.8" />
      <line x1={CX} y1={40} x2={CX} y2={H - 40} stroke="hsl(var(--border))" strokeWidth="0.8" />

      {/* Quadrant labels */}
      {QUADRANTS.map(q => (
        <text key={q.label}
          x={q.x > 0 ? W - 45 : 45}
          y={q.y > 0 ? 52 : H - 45}
          fontSize="8" fill={q.cls === 'text-positive' ? 'hsl(var(--positive))' : q.cls === 'text-negative' ? 'hsl(var(--negative))' : q.cls === 'text-accent' ? 'hsl(var(--accent))' : 'hsl(210,80%,65%)'}
          textAnchor={q.x > 0 ? 'end' : 'start'} fontWeight="bold"
        >{q.label}</text>
      ))}

      {/* Axis labels */}
      <text x={W - 42} y={CY - 4} fontSize="7" fill="hsl(var(--muted-foreground))" textAnchor="end">RS (+)</text>
      <text x={42}    y={CY - 4} fontSize="7" fill="hsl(var(--muted-foreground))">RS (−)</text>
      <text x={CX}    y={36}     fontSize="7" fill="hsl(var(--muted-foreground))" textAnchor="middle">Momentum (+)</text>
      <text x={CX}    y={H - 30} fontSize="7" fill="hsl(var(--muted-foreground))" textAnchor="middle">Momentum (−)</text>

      {/* Sector dots + tails */}
      {sectors.map(s => {
        const cx = toSvg(s.rs, CX), cy = toSvg(-s.mom, CY);
        const tailPts = s.tail.map(t => ({ x: toSvg(t.rs, CX), y: toSvg(-t.mom, CY) }));

        return (
          <g key={s.sym}>
            {/* Tail */}
            {tailPts.map((t, i) => i < tailPts.length - 1 && (
              <line key={i} x1={tailPts[i].x} y1={tailPts[i].y} x2={tailPts[i+1].x} y2={tailPts[i+1].y}
                stroke={s.color} strokeWidth="0.8" opacity={0.3 + i * 0.1} />
            ))}
            {tailPts.map((t, i) => (
              <circle key={i} cx={t.x} cy={t.y} r={2} fill={s.color} opacity={0.2 + i * 0.1} />
            ))}
            {/* Main dot */}
            <circle cx={cx} cy={cy} r={7} fill={s.color} opacity={0.85} />
            <text x={cx} y={cy + 3} fontSize="6" fill="#000" textAnchor="middle" fontWeight="bold">{s.sym.replace('XL', '')}</text>
          </g>
        );
      })}
    </svg>
  );
}

// ─── Performance Tab ──────────────────────────────────────────────────────────

function PerfTab({ sectors }: { sectors: SectorPoint[] }) {
  const [sortKey, setSortKey] = useState<'perf1d' | 'perf1w' | 'perf1m' | 'perf3m'>('perf1m');
  const sorted = [...sectors].sort((a, b) => b[sortKey] - a[sortKey]);
  const cols: { key: typeof sortKey; label: string }[] = [
    { key: 'perf1d', label: '1D' }, { key: 'perf1w', label: '1W' },
    { key: 'perf1m', label: '1M' }, { key: 'perf3m', label: '3M' },
  ];
  const maxAbs = (k: typeof sortKey) => Math.max(...sectors.map(s => Math.abs(s[k])));

  return (
    <div className="flex flex-col h-full min-h-0 overflow-y-auto">
      <table className="w-full text-[9px] font-mono">
        <thead className="sticky top-0 bg-surface-deep border-b border-border">
          <tr>
            <th className="text-left px-2 py-1 text-[8px] text-muted-foreground font-normal">SECTOR</th>
            <th className="text-left px-2 py-1 text-[8px] text-muted-foreground font-normal">ETF</th>
            {cols.map(c => (
              <th key={c.key} className="px-2 py-1 cursor-pointer" onClick={() => setSortKey(c.key)}>
                <span className={`text-[8px] uppercase font-normal ${sortKey === c.key ? 'text-accent font-bold' : 'text-muted-foreground'}`}>{c.label} {sortKey === c.key ? '▼' : ''}</span>
              </th>
            ))}
            <th className="text-left px-2 py-1 text-[8px] text-muted-foreground font-normal">QUADRANT</th>
          </tr>
        </thead>
        <tbody>
          {sorted.map((s, rank) => {
            const quad = quadrantOf(s.rs, s.mom);
            const quadCls = quad === 'LEADING' ? 'text-positive' : quad === 'IMPROVING' ? 'text-blue-400' : quad === 'LAGGING' ? 'text-negative' : 'text-accent';
            return (
              <tr key={s.sym} className="border-b border-border/20 hover:bg-surface-elevated">
                <td className="px-2 py-1">
                  <div className="flex items-center gap-1.5">
                    <span className="text-[8px] text-muted-foreground w-3">{rank + 1}</span>
                    <span className="w-1.5 h-1.5 rounded-full shrink-0" style={{ backgroundColor: s.color }} />
                    <span className="text-foreground">{s.name}</span>
                  </div>
                </td>
                <td className="px-2 py-1 font-bold text-accent">{s.sym}</td>
                {cols.map(c => {
                  const v = s[c.key];
                  const barW = Math.min(100, Math.abs(v) / maxAbs(c.key) * 100);
                  return (
                    <td key={c.key} className="px-2 py-1">
                      <div className="flex items-center gap-1">
                        <span className={`w-10 text-right tabular-nums font-bold ${v > 0 ? 'text-positive' : v < 0 ? 'text-negative' : 'text-muted-foreground'}`}>
                          {v > 0 ? '+' : ''}{v.toFixed(2)}%
                        </span>
                        <div className="w-12 h-1.5 bg-surface-deep rounded-sm overflow-hidden">
                          <div className={`h-full rounded-sm ${v >= 0 ? 'bg-positive' : 'bg-negative'}`} style={{ width: `${barW}%` }} />
                        </div>
                      </div>
                    </td>
                  );
                })}
                <td className={`px-2 py-1 text-[8px] font-bold ${quadCls}`}>{quad}</td>
              </tr>
            );
          })}
        </tbody>
      </table>
    </div>
  );
}

// ─── Money Flow Tab ───────────────────────────────────────────────────────────

function FlowTab({ sectors }: { sectors: SectorPoint[] }) {
  const sorted = [...sectors].sort((a, b) => b.flowBn - a.flowBn);
  const maxAbs = Math.max(...sectors.map(s => Math.abs(s.flowBn)));
  const totalIn  = sectors.filter(s => s.flowBn > 0).reduce((sum, s) => sum + s.flowBn, 0);
  const totalOut = sectors.filter(s => s.flowBn < 0).reduce((sum, s) => sum + s.flowBn, 0);

  return (
    <div className="flex flex-col h-full min-h-0 overflow-y-auto">
      <div className="flex border-b border-border bg-surface-deep flex-shrink-0">
        {[
          { label: 'Total Inflows', value: `$${totalIn.toFixed(1)}B`, tone: 'text-positive' },
          { label: 'Total Outflows', value: `$${Math.abs(totalOut).toFixed(1)}B`, tone: 'text-negative' },
          { label: 'Net Flow', value: `${(totalIn + totalOut) >= 0 ? '+' : ''}$${(totalIn + totalOut).toFixed(1)}B`, tone: (totalIn + totalOut) >= 0 ? 'text-positive' : 'text-negative' },
          { label: 'Largest Inflow', value: sorted[0]?.sym ?? '—', tone: 'text-accent' },
          { label: 'Largest Outflow', value: sorted[sorted.length - 1]?.sym ?? '—', tone: 'text-accent' },
        ].map(k => (
          <div key={k.label} className="flex flex-col px-3 py-1.5 border-r border-border/50 last:border-r-0">
            <span className="text-[8px] text-muted-foreground uppercase tracking-widest">{k.label}</span>
            <span className={`text-[13px] font-bold font-mono ${k.tone}`}>{k.value}</span>
          </div>
        ))}
      </div>
      <div className="flex-1 p-3 space-y-2">
        {sorted.map(s => {
          const barW = Math.min(100, Math.abs(s.flowBn) / maxAbs * 100);
          const isPos = s.flowBn >= 0;
          return (
            <div key={s.sym} className="flex items-center gap-3 text-[9px] font-mono">
              <span className="w-10 font-bold text-accent">{s.sym}</span>
              <span className="w-28 text-muted-foreground truncate">{s.name}</span>
              <div className="flex-1 flex items-center h-3">
                <div className="flex-1 flex justify-end">
                  {!isPos && <div className="h-2 bg-negative rounded-l-sm" style={{ width: `${barW}%` }} />}
                </div>
                <div className="w-px h-3 bg-border shrink-0 mx-1" />
                <div className="flex-1">
                  {isPos && <div className="h-2 bg-positive rounded-r-sm" style={{ width: `${barW}%` }} />}
                </div>
              </div>
              <span className={`w-14 text-right font-bold tabular-nums ${isPos ? 'text-positive' : 'text-negative'}`}>
                {isPos ? '+' : ''}${s.flowBn.toFixed(1)}B
              </span>
              <span className="text-[8px] text-muted-foreground w-8 tabular-nums">{s.volRatio.toFixed(1)}×V</span>
            </div>
          );
        })}
        <p className="text-[8px] text-muted-foreground pt-2">Flow estimated from ETF net volume × price. V = vol ratio vs 20D avg.</p>
      </div>
    </div>
  );
}

// ─── Main ─────────────────────────────────────────────────────────────────────

export default function SectorRotation() {
  const [tab, setTab] = useState<Tab>('rrg');
  const sectors = useMemo(() => buildData(), []);

  const leadCount = sectors.filter(s => quadrantOf(s.rs, s.mom) === 'LEADING').length;
  const lagCount  = sectors.filter(s => quadrantOf(s.rs, s.mom) === 'LAGGING').length;

  return (
    <CmdShell
      code="ROTN"
      title="Sector Rotation"
      tabs={<CmdTabs tabs={TABS} active={tab} onChange={t => setTab(t as Tab)} />}
      footerLeft="Relative Rotation Graph (RRG) · GICS sectors vs SPY benchmark"
      footerRight={`Leading: ${leadCount} · Lagging: ${lagCount} · SYNTHETIC`}
    >
      {tab === 'rrg' && (
        <div className="flex h-full min-h-0 overflow-hidden">
          {/* Chart */}
          <div className="flex-1 min-w-0 flex items-center justify-center p-2 overflow-hidden">
            <RRGChart sectors={sectors} />
          </div>
          {/* Legend */}
          <div className="w-44 shrink-0 border-l border-border flex flex-col overflow-y-auto">
            <div className="px-2 py-1 border-b border-border bg-surface-deep text-[8px] text-muted-foreground uppercase font-bold">Sectors</div>
            {sectors.map(s => {
              const quad = quadrantOf(s.rs, s.mom);
              const quadCls = quad === 'LEADING' ? 'text-positive' : quad === 'IMPROVING' ? 'text-blue-400' : quad === 'LAGGING' ? 'text-negative' : 'text-accent';
              return (
                <div key={s.sym} className="flex items-center gap-1.5 px-2 py-1 border-b border-border/20 text-[8px] font-mono">
                  <span className="w-2 h-2 rounded-full shrink-0" style={{ backgroundColor: s.color }} />
                  <span className="font-bold text-accent w-10 shrink-0">{s.sym}</span>
                  <span className={`text-[7px] ${quadCls}`}>{quad.slice(0, 4)}</span>
                </div>
              );
            })}
            <div className="p-2 mt-auto border-t border-border text-[7px] text-muted-foreground space-y-0.5">
              <div className="text-positive font-bold">LEADING: Strong RS + Rising Mom</div>
              <div className="text-accent font-bold">WEAKENING: Strong RS + Falling Mom</div>
              <div className="text-negative font-bold">LAGGING: Weak RS + Falling Mom</div>
              <div className="text-blue-400 font-bold">IMPROVING: Weak RS + Rising Mom</div>
            </div>
          </div>
        </div>
      )}
      {tab === 'perf' && <PerfTab sectors={sectors} />}
      {tab === 'flow' && <FlowTab sectors={sectors} />}
    </CmdShell>
  );
}
