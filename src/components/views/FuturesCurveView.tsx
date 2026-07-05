// FUTS — Futures Curve Monitor. Term structure / contango-backwardation across the board.
// Deterministic model data (no live feed) — labeled SIMULATED in footer.
import { useMemo, useState } from 'react';
import {
  LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, ReferenceLine,
} from 'recharts';
import CmdShell from '@/components/macro/cmd/_shell/CmdShell';
import CmdTabs from '@/components/macro/cmd/_shell/CmdTabs';
import { seeded } from '@/components/options/shared/mockSeries';

// ── contract universe ─────────────────────────────────────────────────────────

type Sector = 'energy' | 'metals' | 'ags' | 'rates' | 'index';

interface Product {
  root: string;      // futures root symbol
  name: string;
  sector: Sector;
  unit: string;
  base: number;      // front-month spot-ish price
  vol: number;       // per-contract price wiggle
  /** structural bias: >0 contango, <0 backwardation (annualized fraction) */
  bias: number;
  months: number;    // contracts to model
}

const PRODUCTS: Product[] = [
  { root: 'CL', name: 'WTI Crude Oil',    sector: 'energy', unit: '$/bbl',   base: 78.4,   vol: 0.9,  bias: -0.06, months: 12 },
  { root: 'BZ', name: 'Brent Crude',      sector: 'energy', unit: '$/bbl',   base: 82.1,   vol: 0.9,  bias: -0.05, months: 12 },
  { root: 'NG', name: 'Natural Gas',      sector: 'energy', unit: '$/MMBtu', base: 2.86,   vol: 0.08, bias:  0.22, months: 12 },
  { root: 'RB', name: 'RBOB Gasoline',    sector: 'energy', unit: '$/gal',   base: 2.44,   vol: 0.04, bias: -0.04, months: 12 },
  { root: 'HO', name: 'Heating Oil',      sector: 'energy', unit: '$/gal',   base: 2.51,   vol: 0.04, bias: -0.02, months: 12 },
  { root: 'GC', name: 'Gold',             sector: 'metals', unit: '$/oz',    base: 2338,   vol: 14,   bias:  0.05, months: 12 },
  { root: 'SI', name: 'Silver',           sector: 'metals', unit: '$/oz',    base: 29.6,   vol: 0.4,  bias:  0.05, months: 12 },
  { root: 'HG', name: 'Copper',           sector: 'metals', unit: '$/lb',    base: 4.51,   vol: 0.05, bias:  0.03, months: 12 },
  { root: 'PL', name: 'Platinum',         sector: 'metals', unit: '$/oz',    base: 998,    vol: 8,    bias:  0.04, months: 12 },
  { root: 'PA', name: 'Palladium',        sector: 'metals', unit: '$/oz',    base: 942,    vol: 12,   bias: -0.03, months: 12 },
  { root: 'ZC', name: 'Corn',             sector: 'ags',    unit: '¢/bu',    base: 442,    vol: 5,    bias:  0.08, months: 9 },
  { root: 'ZW', name: 'Wheat (SRW)',      sector: 'ags',    unit: '¢/bu',    base: 578,    vol: 8,    bias:  0.10, months: 9 },
  { root: 'ZS', name: 'Soybeans',         sector: 'ags',    unit: '¢/bu',    base: 1188,   vol: 11,   bias:  0.06, months: 9 },
  { root: 'KC', name: 'Coffee (Arabica)', sector: 'ags',    unit: '¢/lb',    base: 227,    vol: 4,    bias: -0.07, months: 9 },
  { root: 'SB', name: 'Sugar #11',        sector: 'ags',    unit: '¢/lb',    base: 19.8,   vol: 0.3,  bias: -0.04, months: 9 },
  { root: 'CT', name: 'Cotton',           sector: 'ags',    unit: '¢/lb',    base: 71.2,   vol: 1.0,  bias:  0.03, months: 9 },
];

const MONTH_CODES = ['F','G','H','J','K','M','N','Q','U','V','X','Z']; // Jan..Dec
const MONTH_NAMES = ['JAN','FEB','MAR','APR','MAY','JUN','JUL','AUG','SEP','OCT','NOV','DEC'];

interface ContractPt {
  label: string;     // e.g. "CLN25"
  monthLabel: string;// e.g. "JUL 25"
  n: number;         // months out (0 = front)
  price: number;
  chg: number;       // day change
  chgPct: number;
}

interface Curve {
  product: Product;
  contracts: ContractPt[];
  front: number;
  back: number;
  structure: 'CONTANGO' | 'BACKWARD' | 'FLAT';
  spread: number;      // back - front (absolute)
  spreadPct: number;   // vs front
  rollYield: number;   // annualized % (front vs 2nd month, negative = cost of carry drag)
  dayChgPct: number;
}

function buildCurve(p: Product): Curve {
  const rnd = seeded(p.root, 'futs');
  // current month index (deterministic — derived from a fixed epoch to avoid Date.now churn)
  const startMonth = Math.floor(rnd() * 12);
  const contracts: ContractPt[] = [];
  for (let n = 0; n < p.months; n++) {
    const carry = p.base * p.bias * (n / 12);          // structural drift
    const noise = (rnd() - 0.5) * 2 * p.vol * 0.6;     // small per-contract noise
    const price = +(p.base + carry + noise).toFixed(p.base > 100 ? 2 : 3);
    const chgPct = +((rnd() - 0.48) * 2.4).toFixed(2);
    const chg = +(price * chgPct / 100).toFixed(p.base > 100 ? 2 : 3);
    const mi = (startMonth + n) % 12;
    const yr = 25 + Math.floor((startMonth + n) / 12);
    contracts.push({
      label: `${p.root}${MONTH_CODES[mi]}${yr}`,
      monthLabel: `${MONTH_NAMES[mi]} ${yr}`,
      n, price, chg, chgPct,
    });
  }
  const front = contracts[0].price;
  const second = contracts[1]?.price ?? front;
  const back = contracts[contracts.length - 1].price;
  const spread = +(back - front).toFixed(3);
  const spreadPct = +((spread / front) * 100).toFixed(2);
  const structure = Math.abs(spreadPct) < 0.4 ? 'FLAT' : spread > 0 ? 'CONTANGO' : 'BACKWARD';
  // annualized roll yield front→2nd month (1-month roll × 12)
  const rollYield = +(((front - second) / front) * 12 * 100).toFixed(1);
  const dayChgPct = contracts[0].chgPct;
  return { product: p, contracts, front, back, structure, spread, spreadPct, rollYield, dayChgPct };
}

// ── UI helpers ────────────────────────────────────────────────────────────────

const SECTORS: { id: Sector | 'all'; label: string }[] = [
  { id: 'all',    label: 'ALL' },
  { id: 'energy', label: 'ENERGY' },
  { id: 'metals', label: 'METALS' },
  { id: 'ags',    label: 'AGRICULTURE' },
];

function StructBadge({ s }: { s: Curve['structure'] }) {
  const cls = s === 'CONTANGO' ? 'text-negative border-negative/40 bg-negative/10'
    : s === 'BACKWARD' ? 'text-positive border-positive/40 bg-positive/10'
    : 'text-muted-foreground border-border bg-surface-elevated';
  return <span className={`px-1.5 py-[1px] text-[8px] font-mono font-bold border ${cls}`}>{s}</span>;
}

function fmt(v: number, base: number) {
  return base > 100 ? v.toFixed(2) : v.toFixed(3);
}

// ── main ──────────────────────────────────────────────────────────────────────

export default function FuturesCurveView() {
  const [sector, setSector] = useState<Sector | 'all'>('all');
  const [selRoot, setSelRoot] = useState('CL');

  const curves = useMemo(() => PRODUCTS.map(buildCurve), []);
  const visible = useMemo(
    () => sector === 'all' ? curves : curves.filter(c => c.product.sector === sector),
    [curves, sector],
  );
  const selected = curves.find(c => c.product.root === selRoot) ?? curves[0];

  const chartData = selected.contracts.map(c => ({
    month: c.monthLabel.replace(' ', "'"),
    price: c.price,
  }));
  const cMin = Math.min(...selected.contracts.map(c => c.price));
  const cMax = Math.max(...selected.contracts.map(c => c.price));
  const pad = (cMax - cMin) * 0.15 || cMax * 0.02;

  const contangoCount = curves.filter(c => c.structure === 'CONTANGO').length;
  const backwardCount = curves.filter(c => c.structure === 'BACKWARD').length;

  return (
    <CmdShell
      code="FUTS"
      title="Futures Curve Monitor — Term Structure"
      headerRight={
        <div className="flex items-center gap-3 text-[9px] font-mono">
          <span className="text-negative">▲ {contangoCount} CONTANGO</span>
          <span className="text-positive">▼ {backwardCount} BACKWARD</span>
        </div>
      }
      tabs={<CmdTabs tabs={SECTORS} active={sector} onChange={s => setSector(s)} />}
      footerLeft="Contango = deferred > front (carry cost) · Backwardation = front > deferred (tight supply) · Roll yield annualized front→M2"
      footerRight="SIMULATED MODEL DATA · not a live feed"
    >
      <div className="flex h-full min-h-0">

        {/* ── left: product grid ── */}
        <div className="w-[46%] min-w-0 border-r border-border flex flex-col min-h-0">
          <div className="flex text-[8px] font-mono text-muted-foreground border-b border-border px-2 py-1 bg-surface-deep">
            <span className="w-16 shrink-0">PRODUCT</span>
            <span className="flex-1">NAME</span>
            <span className="w-16 text-right shrink-0">FRONT</span>
            <span className="w-14 text-right shrink-0">DAY%</span>
            <span className="w-20 text-right shrink-0">M1→Mn%</span>
            <span className="w-20 text-right shrink-0">STRUCTURE</span>
          </div>
          <div className="flex-1 min-h-0 overflow-y-auto">
            {visible.map(c => {
              const active = c.product.root === selRoot;
              return (
                <button
                  key={c.product.root}
                  onClick={() => setSelRoot(c.product.root)}
                  className={`w-full flex items-center px-2 py-[5px] border-b border-border/50 text-[9px] font-mono text-left transition-colors ${
                    active ? 'bg-accent/15 border-l-2 border-l-accent' : 'hover:bg-white/[0.03] border-l-2 border-l-transparent'
                  }`}
                >
                  <span className="w-16 shrink-0 font-bold text-accent">{c.product.root}</span>
                  <span className="flex-1 truncate text-foreground">{c.product.name}</span>
                  <span className="w-16 text-right shrink-0 text-foreground font-bold tabular-nums">{fmt(c.front, c.product.base)}</span>
                  <span className={`w-14 text-right shrink-0 tabular-nums ${c.dayChgPct >= 0 ? 'text-positive' : 'text-negative'}`}>
                    {c.dayChgPct >= 0 ? '+' : ''}{c.dayChgPct}%
                  </span>
                  <span className={`w-20 text-right shrink-0 tabular-nums ${c.spreadPct >= 0 ? 'text-negative' : 'text-positive'}`}>
                    {c.spreadPct >= 0 ? '+' : ''}{c.spreadPct}%
                  </span>
                  <span className="w-20 flex justify-end shrink-0"><StructBadge s={c.structure} /></span>
                </button>
              );
            })}
          </div>
        </div>

        {/* ── right: selected curve detail ── */}
        <div className="flex-1 min-w-0 flex flex-col min-h-0">
          {/* header */}
          <div className="flex items-center gap-4 px-3 py-2 border-b border-border bg-surface-primary">
            <div className="flex flex-col">
              <span className="text-[13px] font-mono font-bold text-accent">{selected.product.root}</span>
              <span className="text-[8px] font-mono text-muted-foreground">{selected.product.unit}</span>
            </div>
            <div className="flex flex-col">
              <span className="text-[10px] font-mono text-foreground">{selected.product.name}</span>
              <StructBadge s={selected.structure} />
            </div>
            <div className="ml-auto grid grid-cols-3 gap-x-5 gap-y-0.5 text-[9px] font-mono">
              <div><span className="text-muted-foreground">Front </span><span className="text-foreground font-bold">{fmt(selected.front, selected.product.base)}</span></div>
              <div><span className="text-muted-foreground">Back </span><span className="text-foreground font-bold">{fmt(selected.back, selected.product.base)}</span></div>
              <div><span className="text-muted-foreground">Spread </span><span className={selected.spread >= 0 ? 'text-negative font-bold' : 'text-positive font-bold'}>{selected.spread >= 0 ? '+' : ''}{fmt(selected.spread, selected.product.base)}</span></div>
              <div><span className="text-muted-foreground">M1→Mn </span><span className={selected.spreadPct >= 0 ? 'text-negative font-bold' : 'text-positive font-bold'}>{selected.spreadPct >= 0 ? '+' : ''}{selected.spreadPct}%</span></div>
              <div><span className="text-muted-foreground">Roll Yld </span><span className={selected.rollYield >= 0 ? 'text-positive font-bold' : 'text-negative font-bold'}>{selected.rollYield >= 0 ? '+' : ''}{selected.rollYield}%</span></div>
              <div><span className="text-muted-foreground">Contracts </span><span className="text-foreground font-bold">{selected.contracts.length}</span></div>
            </div>
          </div>

          {/* chart */}
          <div className="h-[190px] border-b border-border p-2 shrink-0">
            <ResponsiveContainer width="100%" height="100%">
              <LineChart data={chartData} margin={{ top: 6, right: 12, bottom: 0, left: 0 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" vertical={false} />
                <XAxis dataKey="month" tick={{ fontSize: 8, fontFamily: 'monospace', fill: 'hsl(var(--muted-foreground))' }} tickLine={false} axisLine={false} interval={0} angle={-30} textAnchor="end" height={30} />
                <YAxis domain={[cMin - pad, cMax + pad]} tick={{ fontSize: 8, fontFamily: 'monospace', fill: 'hsl(var(--muted-foreground))' }} width={44} axisLine={false} tickLine={false} tickFormatter={v => fmt(v, selected.product.base)} />
                <Tooltip
                  contentStyle={{ background: 'hsl(var(--card))', border: '1px solid hsl(var(--border))', fontFamily: 'monospace', fontSize: 9 }}
                  labelStyle={{ color: 'hsl(var(--accent))', fontWeight: 'bold' }}
                  itemStyle={{ color: 'hsl(var(--foreground))' }}
                  formatter={(v: number) => [fmt(v, selected.product.base), 'Price']}
                />
                <ReferenceLine y={selected.front} stroke="hsl(var(--accent))" strokeDasharray="2 4" strokeWidth={1} />
                <Line
                  dataKey="price"
                  stroke={selected.structure === 'BACKWARD' ? 'hsl(var(--positive))' : 'hsl(var(--negative))'}
                  strokeWidth={2}
                  dot={{ r: 2, fill: selected.structure === 'BACKWARD' ? 'hsl(var(--positive))' : 'hsl(var(--negative))' }}
                />
              </LineChart>
            </ResponsiveContainer>
          </div>

          {/* contract ladder */}
          <div className="flex-1 min-h-0 overflow-y-auto">
            <div className="flex text-[8px] font-mono text-muted-foreground border-b border-border px-3 py-1 bg-surface-deep sticky top-0">
              <span className="w-20 shrink-0">CONTRACT</span>
              <span className="flex-1">MONTH</span>
              <span className="w-20 text-right shrink-0">PRICE</span>
              <span className="w-16 text-right shrink-0">CHG</span>
              <span className="w-16 text-right shrink-0">CHG%</span>
              <span className="w-20 text-right shrink-0">vs FRONT</span>
            </div>
            {selected.contracts.map((c, i) => {
              const vsFront = +(((c.price - selected.front) / selected.front) * 100).toFixed(2);
              return (
                <div key={c.label} className={`flex items-center px-3 py-[3px] border-b border-border/40 text-[9px] font-mono ${i === 0 ? 'bg-accent/10' : i % 2 ? 'bg-surface-elevated/20' : ''}`}>
                  <span className="w-20 shrink-0 font-bold text-accent">{c.label}</span>
                  <span className="flex-1 text-muted-foreground">{c.monthLabel}{i === 0 && <span className="text-accent ml-1">◄ FRONT</span>}</span>
                  <span className="w-20 text-right shrink-0 text-foreground font-bold tabular-nums">{fmt(c.price, selected.product.base)}</span>
                  <span className={`w-16 text-right shrink-0 tabular-nums ${c.chg >= 0 ? 'text-positive' : 'text-negative'}`}>{c.chg >= 0 ? '+' : ''}{fmt(c.chg, selected.product.base)}</span>
                  <span className={`w-16 text-right shrink-0 tabular-nums ${c.chgPct >= 0 ? 'text-positive' : 'text-negative'}`}>{c.chgPct >= 0 ? '+' : ''}{c.chgPct}%</span>
                  <span className={`w-20 text-right shrink-0 tabular-nums ${vsFront >= 0 ? 'text-negative' : 'text-positive'}`}>{i === 0 ? '—' : `${vsFront >= 0 ? '+' : ''}${vsFront}%`}</span>
                </div>
              );
            })}
          </div>
        </div>
      </div>
    </CmdShell>
  );
}
