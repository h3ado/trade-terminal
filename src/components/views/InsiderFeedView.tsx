// FORM4 — Insider Trading Feed. SEC Form 4 filings: buys, sells, clusters, net flow.
// Deterministic model data (no live feed) — labeled SIMULATED in footer.
import { useMemo, useState } from 'react';
import CmdShell from '@/components/macro/cmd/_shell/CmdShell';
import CmdTabs from '@/components/macro/cmd/_shell/CmdTabs';
import { seeded } from '@/components/options/shared/mockSeries';

interface NameMeta { sym: string; company: string; px: number; }

const UNIVERSE: NameMeta[] = [
  { sym: 'NVDA', company: 'NVIDIA Corp',        px: 118 },
  { sym: 'AAPL', company: 'Apple Inc',          px: 214 },
  { sym: 'MSFT', company: 'Microsoft Corp',     px: 448 },
  { sym: 'TSLA', company: 'Tesla Inc',          px: 251 },
  { sym: 'META', company: 'Meta Platforms',     px: 505 },
  { sym: 'AMZN', company: 'Amazon.com',         px: 186 },
  { sym: 'JPM',  company: 'JPMorgan Chase',     px: 203 },
  { sym: 'PLTR', company: 'Palantir Tech',      px: 28 },
  { sym: 'COIN', company: 'Coinbase Global',    px: 232 },
  { sym: 'AMD',  company: 'Advanced Micro Dev', px: 158 },
  { sym: 'DIS',  company: 'Walt Disney',        px: 98 },
  { sym: 'INTC', company: 'Intel Corp',         px: 31 },
  { sym: 'BA',   company: 'Boeing Co',          px: 182 },
  { sym: 'GS',   company: 'Goldman Sachs',      px: 462 },
  { sym: 'WMT',  company: 'Walmart Inc',        px: 68 },
  { sym: 'XOM',  company: 'Exxon Mobil',        px: 114 },
];

const ROLES = ['CEO', 'CFO', 'COO', 'Director', 'Director', 'EVP', 'President', 'General Counsel', '10% Owner', 'Chief Accounting Officer'];
const FIRST = ['James','Mary','Robert','Patricia','John','Jennifer','Michael','Linda','David','Susan','Richard','Karen','Thomas','Nancy','Daniel','Lisa'];
const LAST = ['Smith','Johnson','Williams','Brown','Jones','Garcia','Miller','Davis','Rodriguez','Martinez','Chen','Patel','Nguyen','Kim','Cohen','Anderson'];
const TXN = ['P', 'S'] as const; // Purchase / Sale
const DAYS_AGO = ['0d', '1d', '1d', '2d', '2d', '3d', '4d', '5d', '6d', '8d', '11d', '14d'];

interface Filing {
  id: string;
  sym: string; company: string;
  insider: string; role: string;
  txn: 'P' | 'S';
  shares: number;
  price: number;
  value: number;       // $ notional
  ageIdx: number;      // recency ordering
  age: string;
  planned: boolean;    // 10b5-1 planned sale
}

function buildFilings(): Filing[] {
  const out: Filing[] = [];
  UNIVERSE.forEach(m => {
    const r = seeded(m.sym, 'form4');
    const count = 1 + Math.floor(r() * 4);  // 1-4 filings per name
    for (let i = 0; i < count; i++) {
      const buy = r() > 0.62;               // sells more common than buys
      const txn = buy ? 'P' : 'S';
      const fi = Math.floor(r() * FIRST.length);
      const li = Math.floor(r() * LAST.length);
      const role = ROLES[Math.floor(r() * ROLES.length)];
      const shares = Math.round((500 + r() * (buy ? 40000 : 120000)) / 100) * 100;
      const price = +(m.px * (0.97 + r() * 0.06)).toFixed(2);
      const value = Math.round(shares * price);
      const ageIdx = Math.floor(r() * DAYS_AGO.length);
      out.push({
        id: `${m.sym}-${i}`,
        sym: m.sym, company: m.company,
        insider: `${FIRST[fi]} ${LAST[li]}`, role,
        txn, shares, price, value,
        ageIdx, age: DAYS_AGO[ageIdx],
        planned: !buy && r() > 0.5,
      });
    }
  });
  return out.sort((a, b) => a.ageIdx - b.ageIdx);
}

type Tab = 'all' | 'buys' | 'sells' | 'clusters';
const TABS: { id: Tab; label: string }[] = [
  { id: 'all',      label: 'ALL FILINGS' },
  { id: 'buys',     label: 'BUYS' },
  { id: 'sells',    label: 'SELLS' },
  { id: 'clusters', label: 'CLUSTER BUYS' },
];

function money(v: number): string {
  if (v >= 1e9) return `$${(v / 1e9).toFixed(2)}B`;
  if (v >= 1e6) return `$${(v / 1e6).toFixed(2)}M`;
  if (v >= 1e3) return `$${(v / 1e3).toFixed(0)}K`;
  return `$${v}`;
}

export default function InsiderFeedView() {
  const [tab, setTab] = useState<Tab>('all');
  const filings = useMemo(() => buildFilings(), []);

  // cluster = a ticker with 2+ distinct insiders buying
  const clusterSyms = useMemo(() => {
    const map = new Map<string, Set<string>>();
    filings.filter(f => f.txn === 'P').forEach(f => {
      if (!map.has(f.sym)) map.set(f.sym, new Set());
      map.get(f.sym)!.add(f.insider);
    });
    return new Set([...map.entries()].filter(([, s]) => s.size >= 2).map(([sym]) => sym));
  }, [filings]);

  const visible = useMemo(() => {
    if (tab === 'buys')     return filings.filter(f => f.txn === 'P');
    if (tab === 'sells')    return filings.filter(f => f.txn === 'S');
    if (tab === 'clusters') return filings.filter(f => f.txn === 'P' && clusterSyms.has(f.sym));
    return filings;
  }, [filings, tab, clusterSyms]);

  const buyVal = filings.filter(f => f.txn === 'P').reduce((s, f) => s + f.value, 0);
  const sellVal = filings.filter(f => f.txn === 'S').reduce((s, f) => s + f.value, 0);
  const net = buyVal - sellVal;
  const buyCount = filings.filter(f => f.txn === 'P').length;
  const sellCount = filings.filter(f => f.txn === 'S').length;
  const ratio = sellCount > 0 ? (buyCount / sellCount).toFixed(2) : '∞';

  return (
    <CmdShell
      code="FORM4"
      title="Insider Trading Feed — SEC Form 4"
      headerRight={
        <div className="flex items-center gap-3 text-[9px] font-mono">
          <span className="text-positive">BUY {money(buyVal)}</span>
          <span className="text-negative">SELL {money(sellVal)}</span>
          <span className={net >= 0 ? 'text-positive font-bold' : 'text-negative font-bold'}>NET {net >= 0 ? '+' : '−'}{money(Math.abs(net))}</span>
        </div>
      }
      tabs={<CmdTabs tabs={TABS.map(t =>
        t.id === 'buys' ? { ...t, label: `BUYS (${buyCount})` } :
        t.id === 'sells' ? { ...t, label: `SELLS (${sellCount})` } :
        t.id === 'clusters' ? { ...t, label: `CLUSTER BUYS (${clusterSyms.size})` } : t
      )} active={tab} onChange={t => setTab(t as Tab)} />}
      footerLeft={`Buy/Sell filing ratio ${ratio} · Cluster = 2+ distinct insiders buying same name · P=open-market purchase, S=sale`}
      footerRight="SIMULATED MODEL DATA · not a live feed"
    >
      <div className="flex flex-col h-full min-h-0">
        {/* Net-flow bar */}
        <div className="flex items-center gap-2 px-3 py-1 border-b border-border bg-surface-deep text-[8px] font-mono">
          <span className="text-muted-foreground">NET INSIDER FLOW</span>
          <div className="flex-1 h-2 flex items-center">
            <div className="flex-1 flex justify-end pr-px">
              <div className="h-full bg-negative" style={{ width: `${(sellVal / (buyVal + sellVal)) * 100}%` }} />
            </div>
            <div className="w-px h-3 bg-foreground/40" />
            <div className="flex-1 pl-px">
              <div className="h-full bg-positive" style={{ width: `${(buyVal / (buyVal + sellVal)) * 100}%` }} />
            </div>
          </div>
          <span className="text-positive">{((buyVal / (buyVal + sellVal)) * 100).toFixed(0)}% buy</span>
        </div>

        {/* header */}
        <div className="flex items-center px-3 py-1 border-b border-border bg-surface-deep text-[8px] font-mono text-muted-foreground uppercase">
          <span className="w-10 shrink-0">AGE</span>
          <span className="w-14 shrink-0">SYM</span>
          <span className="flex-1">INSIDER / ROLE</span>
          <span className="w-12 text-center shrink-0">TXN</span>
          <span className="w-20 text-right shrink-0">SHARES</span>
          <span className="w-16 text-right shrink-0">PRICE</span>
          <span className="w-20 text-right shrink-0">VALUE</span>
        </div>

        <div className="flex-1 min-h-0 overflow-y-auto">
          {visible.map((f, i) => {
            const buy = f.txn === 'P';
            return (
              <div key={f.id} className={`flex items-center px-3 py-[4px] border-b border-border/40 text-[9px] font-mono ${i % 2 ? 'bg-surface-elevated/20' : ''} hover:bg-white/[0.03]`}>
                <span className="w-10 shrink-0 text-muted-foreground tabular-nums">{f.age}</span>
                <span className="w-14 shrink-0 font-bold text-accent flex items-center gap-1">
                  {f.sym}{clusterSyms.has(f.sym) && buy && <span className="text-positive text-[7px]" title="Cluster buy">◆</span>}
                </span>
                <div className="flex-1 min-w-0">
                  <span className="text-foreground truncate block leading-tight">{f.insider}</span>
                  <span className="text-[7px] text-muted-foreground">{f.role} · {f.company}</span>
                </div>
                <span className="w-12 text-center shrink-0">
                  <span className={`px-1.5 py-[1px] text-[8px] font-bold border ${buy ? 'text-positive border-positive/40 bg-positive/10' : 'text-negative border-negative/40 bg-negative/10'}`}>
                    {buy ? 'BUY' : 'SELL'}
                  </span>
                </span>
                <span className="w-20 text-right shrink-0 tabular-nums text-foreground">{f.shares.toLocaleString()}</span>
                <span className="w-16 text-right shrink-0 tabular-nums text-muted-foreground">${f.price}</span>
                <span className={`w-20 text-right shrink-0 tabular-nums font-bold ${buy ? 'text-positive' : 'text-negative'}`}>
                  {buy ? '+' : '−'}{money(f.value)}{f.planned && <span className="text-[7px] text-muted-foreground ml-0.5" title="10b5-1 planned">°</span>}
                </span>
              </div>
            );
          })}
          {visible.length === 0 && (
            <div className="flex items-center justify-center py-10 text-[10px] font-mono text-muted-foreground">No filings match this filter</div>
          )}
        </div>
      </div>
    </CmdShell>
  );
}
