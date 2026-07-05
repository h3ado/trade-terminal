// ETFF — ETF Flow Monitor. Creations/redemptions by fund and category.
// Deterministic model data (no live feed) — labeled SIMULATED in footer.
import { useMemo, useState } from 'react';
import CmdShell from '@/components/macro/cmd/_shell/CmdShell';
import CmdTabs from '@/components/macro/cmd/_shell/CmdTabs';
import { seeded } from '@/components/options/shared/mockSeries';

type Cat = 'US Equity' | 'Intl Equity' | 'Sector' | 'Fixed Income' | 'Commodity' | 'Crypto' | 'Thematic';

interface FundMeta { sym: string; name: string; cat: Cat; aumB: number; }

const FUNDS: FundMeta[] = [
  { sym: 'SPY',  name: 'SPDR S&P 500',                 cat: 'US Equity',    aumB: 548 },
  { sym: 'VOO',  name: 'Vanguard S&P 500',             cat: 'US Equity',    aumB: 462 },
  { sym: 'IVV',  name: 'iShares Core S&P 500',         cat: 'US Equity',    aumB: 478 },
  { sym: 'QQQ',  name: 'Invesco QQQ Trust',            cat: 'US Equity',    aumB: 288 },
  { sym: 'VTI',  name: 'Vanguard Total Market',        cat: 'US Equity',    aumB: 405 },
  { sym: 'IWM',  name: 'iShares Russell 2000',         cat: 'US Equity',    aumB: 64 },
  { sym: 'VEA',  name: 'Vanguard FTSE Dev Mkts',       cat: 'Intl Equity',  aumB: 128 },
  { sym: 'VWO',  name: 'Vanguard FTSE Emerg Mkts',     cat: 'Intl Equity',  aumB: 82 },
  { sym: 'EFA',  name: 'iShares MSCI EAFE',            cat: 'Intl Equity',  aumB: 58 },
  { sym: 'EEM',  name: 'iShares MSCI Emerg Mkts',      cat: 'Intl Equity',  aumB: 18 },
  { sym: 'XLK',  name: 'Tech Select Sector',           cat: 'Sector',       aumB: 72 },
  { sym: 'XLF',  name: 'Financial Select Sector',      cat: 'Sector',       aumB: 44 },
  { sym: 'XLE',  name: 'Energy Select Sector',         cat: 'Sector',       aumB: 38 },
  { sym: 'XLV',  name: 'Health Care Select Sector',    cat: 'Sector',       aumB: 41 },
  { sym: 'SMH',  name: 'VanEck Semiconductor',         cat: 'Sector',       aumB: 24 },
  { sym: 'AGG',  name: 'iShares Core US Aggregate',    cat: 'Fixed Income', aumB: 118 },
  { sym: 'BND',  name: 'Vanguard Total Bond',          cat: 'Fixed Income', aumB: 122 },
  { sym: 'TLT',  name: 'iShares 20+ Yr Treasury',      cat: 'Fixed Income', aumB: 58 },
  { sym: 'HYG',  name: 'iShares iBoxx High Yield',     cat: 'Fixed Income', aumB: 16 },
  { sym: 'LQD',  name: 'iShares iBoxx Inv Grade',      cat: 'Fixed Income', aumB: 32 },
  { sym: 'GLD',  name: 'SPDR Gold Shares',             cat: 'Commodity',    aumB: 68 },
  { sym: 'SLV',  name: 'iShares Silver Trust',         cat: 'Commodity',    aumB: 14 },
  { sym: 'USO',  name: 'US Oil Fund',                  cat: 'Commodity',    aumB: 1.4 },
  { sym: 'IBIT', name: 'iShares Bitcoin Trust',        cat: 'Crypto',       aumB: 52 },
  { sym: 'FBTC', name: 'Fidelity Wise Origin BTC',     cat: 'Crypto',       aumB: 19 },
  { sym: 'ETHA', name: 'iShares Ethereum Trust',       cat: 'Crypto',       aumB: 9.8 },
  { sym: 'ARKK', name: 'ARK Innovation',               cat: 'Thematic',     aumB: 6.2 },
  { sym: 'ICLN', name: 'iShares Global Clean Energy',  cat: 'Thematic',     aumB: 2.8 },
];

interface Row {
  sym: string; name: string; cat: Cat; aumB: number;
  flow1d: number;   // $M daily
  flow1w: number;   // $M weekly
  flowMtd: number;  // $M month-to-date
  flowPctAum: number; // 1d flow as % of AUM
}

function buildRow(m: FundMeta): Row {
  const r = seeded(m.sym, 'etff');
  // scale flows to AUM; crypto/thematic more volatile
  const volMul = m.cat === 'Crypto' ? 0.012 : m.cat === 'Thematic' ? 0.008 : 0.0035;
  const aumM = m.aumB * 1000;
  const flow1d = +((r() - 0.46) * 2 * aumM * volMul).toFixed(1);
  const flow1w = +(flow1d * (2.5 + r() * 3) * (r() > 0.3 ? 1 : -0.6)).toFixed(1);
  const flowMtd = +(flow1w * (1.8 + r() * 2.4) * (r() > 0.25 ? 1 : -0.5)).toFixed(1);
  const flowPctAum = +((flow1d / aumM) * 100).toFixed(3);
  return { sym: m.sym, name: m.name, cat: m.cat, aumB: m.aumB, flow1d, flow1w, flowMtd, flowPctAum };
}

type Tab = 'all' | 'in' | 'out' | 'cat';
const TABS: { id: Tab; label: string }[] = [
  { id: 'all', label: 'ALL FUNDS' },
  { id: 'in',  label: 'TOP INFLOWS' },
  { id: 'out', label: 'TOP OUTFLOWS' },
  { id: 'cat', label: 'BY CATEGORY' },
];

function flowStr(v: number): string {
  const a = Math.abs(v);
  const s = a >= 1000 ? `$${(a / 1000).toFixed(2)}B` : `$${a.toFixed(0)}M`;
  return `${v >= 0 ? '+' : '−'}${s}`;
}

function FlowCell({ v, w }: { v: number; w: string }) {
  return (
    <span className={`${w} text-right shrink-0 tabular-nums font-mono ${v >= 0 ? 'text-positive' : 'text-negative'}`}>
      {flowStr(v)}
    </span>
  );
}

function CategoryTab({ rows }: { rows: Row[] }) {
  const cats = useMemo(() => {
    const map = new Map<Cat, { in: number; totalAum: number; funds: number; mtd: number }>();
    rows.forEach(r => {
      const c = map.get(r.cat) ?? { in: 0, totalAum: 0, funds: 0, mtd: 0 };
      c.in += r.flow1d; c.totalAum += r.aumB; c.funds += 1; c.mtd += r.flowMtd;
      map.set(r.cat, c);
    });
    return [...map.entries()].sort((a, b) => b[1].mtd - a[1].mtd);
  }, [rows]);

  const maxAbs = Math.max(...cats.map(([, c]) => Math.abs(c.mtd)), 1);

  return (
    <div className="flex-1 min-h-0 overflow-y-auto p-2 space-y-1.5">
      {cats.map(([cat, c]) => (
        <div key={cat} className="border border-border/60 bg-surface-deep">
          <div className="flex items-center px-3 py-1.5 text-[9px] font-mono">
            <span className="w-32 shrink-0 font-bold text-accent">{cat}</span>
            <span className="w-20 shrink-0 text-muted-foreground">{c.funds} funds</span>
            <span className="w-24 shrink-0 text-muted-foreground">AUM ${c.totalAum.toFixed(0)}B</span>
            {/* diverging MTD bar */}
            <div className="flex-1 h-3 flex items-center mx-3">
              <div className="flex-1 flex justify-end pr-px">
                {c.mtd < 0 && <div className="h-full bg-negative" style={{ width: `${(Math.abs(c.mtd) / maxAbs) * 100}%` }} />}
              </div>
              <div className="w-px h-4 bg-border" />
              <div className="flex-1 pl-px">
                {c.mtd >= 0 && <div className="h-full bg-positive" style={{ width: `${(c.mtd / maxAbs) * 100}%` }} />}
              </div>
            </div>
            <span className="w-16 text-right shrink-0 text-[7px] text-muted-foreground">MTD 1D</span>
            <FlowCell v={c.mtd} w="w-24" />
            <FlowCell v={c.in} w="w-20" />
          </div>
        </div>
      ))}
    </div>
  );
}

export default function ETFFlowView() {
  const [tab, setTab] = useState<Tab>('all');
  const rows = useMemo(() => FUNDS.map(buildRow), []);

  const totalIn = rows.filter(r => r.flow1d > 0).reduce((s, r) => s + r.flow1d, 0);
  const totalOut = rows.filter(r => r.flow1d < 0).reduce((s, r) => s + r.flow1d, 0);
  const net = totalIn + totalOut;

  const visible = useMemo(() => {
    if (tab === 'in')  return [...rows].filter(r => r.flow1d > 0).sort((a, b) => b.flow1d - a.flow1d);
    if (tab === 'out') return [...rows].filter(r => r.flow1d < 0).sort((a, b) => a.flow1d - b.flow1d);
    return [...rows].sort((a, b) => b.flow1d - a.flow1d);
  }, [rows, tab]);

  return (
    <CmdShell
      code="ETFF"
      title="ETF Flow Monitor — Creations & Redemptions"
      headerRight={
        <div className="flex items-center gap-3 text-[9px] font-mono">
          <span className="text-positive">IN {flowStr(totalIn)}</span>
          <span className="text-negative">OUT {flowStr(totalOut)}</span>
          <span className={net >= 0 ? 'text-positive font-bold' : 'text-negative font-bold'}>NET {flowStr(net)}</span>
        </div>
      }
      tabs={<CmdTabs tabs={TABS} active={tab} onChange={t => setTab(t as Tab)} />}
      footerLeft="Fund flows = shares created (inflow) − redeemed (outflow) × NAV · 1D / 1W / MTD windows"
      footerRight="SIMULATED MODEL DATA · not a live feed"
    >
      {tab === 'cat' ? (
        <CategoryTab rows={rows} />
      ) : (
        <div className="flex flex-col h-full min-h-0">
          <div className="flex items-center px-3 py-1 border-b border-border bg-surface-deep text-[8px] font-mono text-muted-foreground uppercase">
            <span className="w-14 shrink-0">SYM</span>
            <span className="flex-1">FUND</span>
            <span className="w-24 shrink-0">CATEGORY</span>
            <span className="w-16 text-right shrink-0">AUM</span>
            <span className="w-24 text-right shrink-0">FLOW 1D</span>
            <span className="w-16 text-right shrink-0">% AUM</span>
            <span className="w-24 text-right shrink-0">FLOW 1W</span>
            <span className="w-24 text-right shrink-0">FLOW MTD</span>
          </div>
          <div className="flex-1 min-h-0 overflow-y-auto">
            {visible.map((r, i) => (
              <div key={r.sym} className={`flex items-center px-3 py-[4px] border-b border-border/40 text-[9px] font-mono ${i % 2 ? 'bg-surface-elevated/20' : ''} hover:bg-white/[0.03]`}>
                <span className="w-14 shrink-0 font-bold text-accent">{r.sym}</span>
                <span className="flex-1 truncate text-foreground">{r.name}</span>
                <span className="w-24 shrink-0 text-[8px] text-muted-foreground">{r.cat}</span>
                <span className="w-16 text-right shrink-0 tabular-nums text-muted-foreground">${r.aumB}B</span>
                <FlowCell v={r.flow1d} w="w-24" />
                <span className={`w-16 text-right shrink-0 tabular-nums ${r.flowPctAum >= 0 ? 'text-positive/70' : 'text-negative/70'}`}>{r.flowPctAum >= 0 ? '+' : ''}{r.flowPctAum}%</span>
                <FlowCell v={r.flow1w} w="w-24" />
                <FlowCell v={r.flowMtd} w="w-24" />
              </div>
            ))}
            {visible.length === 0 && (
              <div className="flex items-center justify-center py-10 text-[10px] font-mono text-muted-foreground">No funds match this filter</div>
            )}
          </div>
        </div>
      )}
    </CmdShell>
  );
}
