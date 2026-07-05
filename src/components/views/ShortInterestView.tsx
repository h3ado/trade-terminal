// SHORT — Short Interest Monitor. SI%, days-to-cover, borrow fee, squeeze score.
// Deterministic model data (no live feed) — labeled SIMULATED in footer.
import { useMemo, useState } from 'react';
import CmdShell from '@/components/macro/cmd/_shell/CmdShell';
import CmdTabs from '@/components/macro/cmd/_shell/CmdTabs';
import { seeded } from '@/components/options/shared/mockSeries';

interface NameMeta { sym: string; name: string; sector: string; floatM: number; }

const UNIVERSE: NameMeta[] = [
  { sym: 'GME',  name: 'GameStop',            sector: 'Consumer',   floatM: 305 },
  { sym: 'AMC',  name: 'AMC Entertainment',   sector: 'Consumer',   floatM: 258 },
  { sym: 'CVNA', name: 'Carvana',             sector: 'Consumer',   floatM: 92 },
  { sym: 'BYND', name: 'Beyond Meat',         sector: 'Consumer',   floatM: 63 },
  { sym: 'UPST', name: 'Upstart Holdings',    sector: 'Financials', floatM: 82 },
  { sym: 'AFRM', name: 'Affirm Holdings',     sector: 'Financials', floatM: 290 },
  { sym: 'COIN', name: 'Coinbase Global',     sector: 'Financials', floatM: 205 },
  { sym: 'HOOD', name: 'Robinhood Markets',   sector: 'Financials', floatM: 760 },
  { sym: 'PLTR', name: 'Palantir Tech',       sector: 'Technology', floatM: 2050 },
  { sym: 'SMCI', name: 'Super Micro Computer',sector: 'Technology', floatM: 55 },
  { sym: 'MSTR', name: 'MicroStrategy',       sector: 'Technology', floatM: 175 },
  { sym: 'RIVN', name: 'Rivian Automotive',   sector: 'Consumer',   floatM: 910 },
  { sym: 'LCID', name: 'Lucid Group',         sector: 'Consumer',   floatM: 1450 },
  { sym: 'NKLA', name: 'Nikola',              sector: 'Industrials',floatM: 470 },
  { sym: 'MARA', name: 'Marathon Digital',    sector: 'Technology', floatM: 285 },
  { sym: 'RIOT', name: 'Riot Platforms',      sector: 'Technology', floatM: 320 },
  { sym: 'CVAX', name: 'Novavax',             sector: 'Healthcare', floatM: 128 },
  { sym: 'W',    name: 'Wayfair',             sector: 'Consumer',   floatM: 78 },
  { sym: 'CHWY', name: 'Chewy',               sector: 'Consumer',   floatM: 260 },
  { sym: 'FUBO', name: 'FuboTV',              sector: 'Comm Svcs',  floatM: 300 },
  { sym: 'SIRI', name: 'Sirius XM',           sector: 'Comm Svcs',  floatM: 340 },
  { sym: 'DKNG', name: 'DraftKings',          sector: 'Consumer',   floatM: 430 },
  { sym: 'ENVX', name: 'Enovix',              sector: 'Technology', floatM: 150 },
  { sym: 'IONQ', name: 'IonQ',                sector: 'Technology', floatM: 210 },
];

interface Row {
  sym: string; name: string; sector: string;
  siPct: number;          // short interest as % of float
  sharesShortM: number;   // millions
  dtc: number;            // days to cover
  borrowFee: number;      // annualized %
  htb: boolean;           // hard to borrow
  utilization: number;    // % of lendable on loan
  siChg: number;          // change in SI% since prior report
  squeeze: number;        // 0-100 composite squeeze score
  price: number;
}

function buildRow(m: NameMeta): Row {
  const r = seeded(m.sym, 'short');
  const siPct = +(6 + r() * 42).toFixed(1);              // 6% – 48%
  const sharesShortM = +((m.floatM * siPct) / 100).toFixed(1);
  const avgVolM = +(Math.max(0.4, m.floatM * (0.008 + r() * 0.05))).toFixed(2);
  const dtc = +(sharesShortM / avgVolM).toFixed(1);
  const borrowFee = +(0.3 + r() * (siPct > 30 ? 90 : 22)).toFixed(1);
  const utilization = +Math.min(99.9, 40 + r() * 60).toFixed(1);
  const htb = borrowFee > 15 || utilization > 92;
  const siChg = +((r() - 0.45) * 9).toFixed(1);
  const price = +(3 + r() * 340).toFixed(2);
  // composite squeeze score: weighted SI%, DTC, borrow fee, utilization
  const squeeze = Math.round(Math.min(100,
    (siPct / 48) * 34 +
    (Math.min(dtc, 12) / 12) * 26 +
    (Math.min(borrowFee, 100) / 100) * 22 +
    (utilization / 100) * 18,
  ));
  return { sym: m.sym, name: m.name, sector: m.sector, siPct, sharesShortM, dtc, borrowFee, htb, utilization, siChg, squeeze, price };
}

type Tab = 'all' | 'high' | 'squeeze' | 'htb';
const TABS: { id: Tab; label: string }[] = [
  { id: 'all',     label: 'ALL' },
  { id: 'high',    label: 'HIGH SI' },
  { id: 'squeeze', label: 'SQUEEZE RISK' },
  { id: 'htb',     label: 'HARD-TO-BORROW' },
];

function SqueezeMeter({ v }: { v: number }) {
  const color = v >= 75 ? 'bg-negative' : v >= 50 ? 'bg-accent' : v >= 30 ? 'bg-[hsl(50,100%,55%)]' : 'bg-positive';
  const txt = v >= 75 ? 'text-negative' : v >= 50 ? 'text-accent' : v >= 30 ? 'text-[hsl(50,100%,55%)]' : 'text-positive';
  return (
    <div className="flex items-center gap-1.5 w-full">
      <div className="flex-1 h-1.5 bg-border overflow-hidden rounded-sm">
        <div className={`h-full ${color}`} style={{ width: `${v}%` }} />
      </div>
      <span className={`w-6 text-right text-[9px] font-mono font-bold ${txt}`}>{v}</span>
    </div>
  );
}

export default function ShortInterestView() {
  const [tab, setTab] = useState<Tab>('all');
  const [sortKey, setSortKey] = useState<keyof Row>('squeeze');

  const rows = useMemo(() => UNIVERSE.map(buildRow), []);

  const filtered = useMemo(() => {
    let r = rows;
    if (tab === 'high')    r = r.filter(x => x.siPct >= 20);
    if (tab === 'squeeze') r = r.filter(x => x.squeeze >= 55);
    if (tab === 'htb')     r = r.filter(x => x.htb);
    return [...r].sort((a, b) => (b[sortKey] as number) - (a[sortKey] as number));
  }, [rows, tab, sortKey]);

  const avgSI = (rows.reduce((s, r) => s + r.siPct, 0) / rows.length).toFixed(1);
  const highSqz = rows.filter(r => r.squeeze >= 55).length;
  const htbCount = rows.filter(r => r.htb).length;

  const Th = ({ k, children, w, align = 'right' }: { k?: keyof Row; children: React.ReactNode; w: string; align?: 'left' | 'right' }) => (
    <button
      onClick={() => k && setSortKey(k)}
      className={`${w} shrink-0 text-[8px] font-mono uppercase ${align === 'right' ? 'text-right' : 'text-left'} ${k ? 'hover:text-accent' : ''} ${sortKey === k ? 'text-accent' : 'text-muted-foreground'}`}
    >
      {children}{sortKey === k ? ' ▾' : ''}
    </button>
  );

  return (
    <CmdShell
      code="SHORT"
      title="Short Interest Monitor"
      headerRight={
        <div className="flex items-center gap-3 text-[9px] font-mono">
          <span className="text-muted-foreground">AVG SI <span className="text-foreground font-bold">{avgSI}%</span></span>
          <span className="text-accent">⚡ {highSqz} SQUEEZE</span>
          <span className="text-negative">🔒 {htbCount} HTB</span>
        </div>
      }
      tabs={<CmdTabs tabs={TABS.map(t =>
        t.id === 'squeeze' ? { ...t, label: `SQUEEZE RISK (${highSqz})` } :
        t.id === 'htb' ? { ...t, label: `HARD-TO-BORROW (${htbCount})` } : t
      )} active={tab} onChange={t => setTab(t as Tab)} />}
      footerLeft="Squeeze score = weighted SI% + days-to-cover + borrow fee + utilization · HTB = fee>15% or util>92%"
      footerRight="SIMULATED MODEL DATA · not a live feed"
    >
      <div className="flex flex-col h-full min-h-0">
        <div className="flex items-center px-2 py-1 border-b border-border bg-surface-deep">
          <Th w="w-14" align="left">SYM</Th>
          <span className="flex-1 text-[8px] font-mono text-muted-foreground uppercase">NAME</span>
          <Th w="w-16" k="siPct">SI % FLT</Th>
          <Th w="w-16" k="sharesShortM">SHRS SHT</Th>
          <Th w="w-14" k="siChg">Δ SI</Th>
          <Th w="w-12" k="dtc">DTC</Th>
          <Th w="w-16" k="borrowFee">FEE %</Th>
          <Th w="w-14" k="utilization">UTIL %</Th>
          <Th w="w-16" k="price">PRICE</Th>
          <Th w="w-28" k="squeeze">SQUEEZE</Th>
        </div>
        <div className="flex-1 min-h-0 overflow-y-auto">
          {filtered.map((r, i) => (
            <div key={r.sym} className={`flex items-center px-2 py-[4px] border-b border-border/40 text-[9px] font-mono ${i % 2 ? 'bg-surface-elevated/20' : ''} hover:bg-white/[0.03]`}>
              <span className="w-14 shrink-0 font-bold text-accent flex items-center gap-1">
                {r.sym}{r.htb && <span className="text-negative text-[7px]" title="Hard to borrow">🔒</span>}
              </span>
              <div className="flex-1 min-w-0">
                <span className="text-foreground truncate block leading-tight">{r.name}</span>
                <span className="text-[7px] text-muted-foreground">{r.sector}</span>
              </div>
              <span className={`w-16 text-right shrink-0 tabular-nums font-bold ${r.siPct >= 30 ? 'text-negative' : r.siPct >= 20 ? 'text-accent' : 'text-foreground'}`}>{r.siPct}%</span>
              <span className="w-16 text-right shrink-0 tabular-nums text-muted-foreground">{r.sharesShortM}M</span>
              <span className={`w-14 text-right shrink-0 tabular-nums ${r.siChg >= 0 ? 'text-negative' : 'text-positive'}`}>{r.siChg >= 0 ? '+' : ''}{r.siChg}</span>
              <span className={`w-12 text-right shrink-0 tabular-nums ${r.dtc >= 5 ? 'text-accent font-bold' : 'text-foreground'}`}>{r.dtc}</span>
              <span className={`w-16 text-right shrink-0 tabular-nums ${r.borrowFee >= 15 ? 'text-negative font-bold' : r.borrowFee >= 5 ? 'text-accent' : 'text-muted-foreground'}`}>{r.borrowFee}%</span>
              <span className="w-14 text-right shrink-0 tabular-nums text-muted-foreground">{r.utilization}%</span>
              <span className="w-16 text-right shrink-0 tabular-nums text-foreground">${r.price}</span>
              <span className="w-28 shrink-0 pl-2"><SqueezeMeter v={r.squeeze} /></span>
            </div>
          ))}
          {filtered.length === 0 && (
            <div className="flex items-center justify-center py-10 text-[10px] font-mono text-muted-foreground">No names match this filter</div>
          )}
        </div>
      </div>
    </CmdShell>
  );
}
