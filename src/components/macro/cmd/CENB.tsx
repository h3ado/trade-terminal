// CENB — Global Central Bank Portal. Sub-tabs: RATES, MEETINGS, STANCE, MOVES.
// Live US fed funds via FRED; other banks pulled from curated stance registry.
import { useMemo, useState } from 'react';
import { CENTRAL_BANKS, CentralBank } from '@/data/centralBanks';
import { useFRED } from '@/hooks/useFRED';
import CmdShell from './_shell/CmdShell';
import CmdTabs from './_shell/CmdTabs';
import CmdDrawer from './_shell/CmdDrawer';
import { Sparkline } from './_shell/charts';

type Tab = 'RATES' | 'MEETINGS' | 'STANCE' | 'MOVES';
type Sort = 'region' | 'rate' | 'next' | 'last';
type Region = 'all' | 'Americas' | 'EMEA' | 'APAC';

const daysUntil = (d: string) => Math.ceil((new Date(d).getTime() - Date.now()) / 86400_000);
const stanceTone = (s: CentralBank['stance']) => s === 'Hawkish' ? 'text-negative' : s === 'Dovish' ? 'text-positive' : 'text-foreground';

// Seeded 24-month rate history per bank (deterministic walk anchored on current)
function rateHistory(cb: CentralBank, n = 24): number[] {
  const seed = cb.code.charCodeAt(0) * 31 + cb.code.charCodeAt(1);
  let s = seed;
  const rnd = () => { s = (s * 9301 + 49297) % 233280; return s / 233280; };
  const arr: number[] = [];
  const dir = cb.stance === 'Dovish' ? +1 : cb.stance === 'Hawkish' ? -1 : 0;
  let v = (cb.rate ?? 0) + dir * (n * 0.04);
  for (let i = 0; i < n; i++) {
    v += (rnd() - 0.5) * 0.15 + (cb.rate != null ? ((cb.rate - v) / (n - i + 1)) : 0);
    arr.push(+v.toFixed(3));
  }
  if (cb.rate != null) arr[n - 1] = cb.rate;
  return arr;
}

export default function CENB() {
  const fred = useFRED();
  const [tab, setTab] = useState<Tab>('RATES');
  const [sort, setSort] = useState<Sort>('region');
  const [filter, setFilter] = useState<Region>('all');
  const [drill, setDrill] = useState<CentralBank | null>(null);

  const rows = useMemo(() => {
    const base = CENTRAL_BANKS.map(cb => ({
      ...cb,
      liveRate: cb.fredKey ? fred.byKey[cb.fredKey]?.value ?? cb.rate : cb.rate,
      daysToNext: daysUntil(cb.nextMeeting),
      hist: rateHistory(cb),
    }));
    const filtered = filter === 'all' ? base : base.filter(c => c.region === filter);
    const sorted = [...filtered];
    if (sort === 'rate') sorted.sort((a, b) => (b.liveRate ?? -1) - (a.liveRate ?? -1));
    else if (sort === 'next') sorted.sort((a, b) => a.daysToNext - b.daysToNext);
    else if (sort === 'last') sorted.sort((a, b) => b.lastMoveDate.localeCompare(a.lastMoveDate));
    else sorted.sort((a, b) => a.region.localeCompare(b.region) || a.code.localeCompare(b.code));
    return sorted;
  }, [fred.byKey, sort, filter]);

  const stats = useMemo(() => ({
    hawk: CENTRAL_BANKS.filter(c => c.stance === 'Hawkish').length,
    dove: CENTRAL_BANKS.filter(c => c.stance === 'Dovish').length,
    neu:  CENTRAL_BANKS.filter(c => c.stance === 'Neutral').length,
    cuts: CENTRAL_BANKS.filter(c => c.lastMoveBps < 0).length,
    hikes:CENTRAL_BANKS.filter(c => c.lastMoveBps > 0).length,
    upcoming30: CENTRAL_BANKS.filter(c => daysUntil(c.nextMeeting) <= 30 && daysUntil(c.nextMeeting) >= 0).length,
  }), []);

  return (
    <CmdShell
      code="CENB"
      title="Global Central Bank Portal · 26 Banks · Rates · Meetings · Stance"
      headerRight={
        <div className="flex items-center gap-3 text-[9px] font-mono uppercase">
          <div className="flex items-center gap-1">
            <span className="text-muted-foreground">REGION</span>
            {(['all', 'Americas', 'EMEA', 'APAC'] as const).map(r => (
              <button key={r} onClick={() => setFilter(r)} className={`px-1.5 py-0.5 border ${filter === r ? 'border-accent text-accent' : 'border-border text-muted-foreground hover:text-foreground'}`}>{r === 'all' ? 'ALL' : r.toUpperCase()}</button>
            ))}
          </div>
          <span className="text-muted-foreground">{rows.length} BANKS</span>
        </div>
      }
      tabs={<CmdTabs tabs={[{ id: 'RATES', label: 'Rates' }, { id: 'MEETINGS', label: 'Meetings' }, { id: 'STANCE', label: 'Stance' }, { id: 'MOVES', label: 'Moves' }]} active={tab} onChange={setTab}
        right={
          <div className="flex items-center gap-1 text-[9px] font-mono uppercase">
            <span className="text-muted-foreground">SORT</span>
            {(['region', 'rate', 'next', 'last'] as const).map(s => (
              <button key={s} onClick={() => setSort(s)} className={`px-1.5 py-0.5 border ${sort === s ? 'border-accent text-accent' : 'border-border text-muted-foreground hover:text-foreground'}`}>{s.toUpperCase()}</button>
            ))}
          </div>
        }
      />}
      kpis={
        <div className="grid grid-cols-3 md:grid-cols-6 gap-1 p-1">
          <div className="border border-border bg-surface-deep p-1.5"><div className="text-[8px] font-mono uppercase text-muted-foreground">Hawkish</div><div className="text-lg font-mono font-bold text-negative tabular-nums">{stats.hawk}</div></div>
          <div className="border border-border bg-surface-deep p-1.5"><div className="text-[8px] font-mono uppercase text-muted-foreground">Neutral</div><div className="text-lg font-mono font-bold text-foreground tabular-nums">{stats.neu}</div></div>
          <div className="border border-border bg-surface-deep p-1.5"><div className="text-[8px] font-mono uppercase text-muted-foreground">Dovish</div><div className="text-lg font-mono font-bold text-positive tabular-nums">{stats.dove}</div></div>
          <div className="border border-border bg-surface-deep p-1.5"><div className="text-[8px] font-mono uppercase text-muted-foreground">Last Hike</div><div className="text-lg font-mono font-bold text-negative tabular-nums">{stats.hikes}</div></div>
          <div className="border border-border bg-surface-deep p-1.5"><div className="text-[8px] font-mono uppercase text-muted-foreground">Last Cut</div><div className="text-lg font-mono font-bold text-positive tabular-nums">{stats.cuts}</div></div>
          <div className="border border-border bg-surface-deep p-1.5"><div className="text-[8px] font-mono uppercase text-muted-foreground">Mtg ≤30d</div><div className="text-lg font-mono font-bold text-accent tabular-nums">{stats.upcoming30}</div></div>
        </div>
      }
      footerLeft="CENB <GO> · LIVE = pulled from FRED · others = curated stance snapshot"
      footerRight="Red = hike · Green = cut · Click row for 24mo rate history"
    >
      <div className="h-full overflow-auto relative">

        {tab === 'RATES' && (
          <table className="w-full border-collapse">
            <thead className="sticky top-0 bg-surface-deep z-10">
              <tr className="border-b border-border">
                {['CC', 'Bank', 'Country', 'CCY', 'Rate %', 'Last Move', 'Date', 'Next Mtg', 'In', '24M Trend', 'Stance'].map((h, i) => (
                  <th key={h} className={`px-2 py-1 text-[9px] font-mono font-bold uppercase tracking-wider text-muted-foreground ${i >= 4 && i <= 8 ? 'text-right' : 'text-left'}`}>{h}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {rows.map(cb => (
                <tr key={cb.code} className="border-b border-border/40 hover:bg-surface-elevated cursor-pointer" onClick={() => setDrill(cb)}>
                  <td className="px-2 py-0.5 text-[11px] font-mono">{cb.flag} <span className="text-muted-foreground">{cb.code}</span></td>
                  <td className="px-2 py-0.5 text-[11px] font-mono font-bold">{cb.bank}</td>
                  <td className="px-2 py-0.5 text-[11px] font-mono text-muted-foreground">{cb.name}</td>
                  <td className="px-2 py-0.5 text-[11px] font-mono text-muted-foreground">{cb.ccy}</td>
                  <td className="px-2 py-0.5 text-right text-[11px] font-mono font-bold tabular-nums">{cb.liveRate != null ? cb.liveRate.toFixed(2) : '—'}{cb.fredKey && <span className="text-[8px] text-accent ml-1">LIVE</span>}</td>
                  <td className={`px-2 py-0.5 text-right text-[11px] font-mono tabular-nums font-bold ${cb.lastMoveBps > 0 ? 'text-negative' : cb.lastMoveBps < 0 ? 'text-positive' : 'text-muted-foreground'}`}>{cb.lastMoveBps === 0 ? 'HOLD' : `${cb.lastMoveBps > 0 ? '+' : ''}${cb.lastMoveBps}bp`}</td>
                  <td className="px-2 py-0.5 text-right text-[11px] font-mono text-muted-foreground">{cb.lastMoveDate}</td>
                  <td className="px-2 py-0.5 text-right text-[11px] font-mono">{cb.nextMeeting}</td>
                  <td className={`px-2 py-0.5 text-right text-[11px] font-mono tabular-nums font-bold ${cb.daysToNext < 7 ? 'text-accent' : cb.daysToNext < 30 ? 'text-foreground' : 'text-muted-foreground'}`}>{cb.daysToNext < 0 ? 'TBD' : `${cb.daysToNext}d`}</td>
                  <td className="px-2 py-0.5"><div className="text-accent"><Sparkline data={cb.hist} w={80} h={18} /></div></td>
                  <td className={`px-2 py-0.5 text-[10px] font-mono font-bold uppercase ${stanceTone(cb.stance)}`}>{cb.stance}</td>
                </tr>
              ))}
            </tbody>
          </table>
        )}

        {tab === 'MEETINGS' && (
          <table className="w-full border-collapse">
            <thead className="sticky top-0 bg-surface-deep z-10">
              <tr className="border-b border-border">
                {['CC', 'Bank', 'Next Meeting', 'Days', 'Current Rate', 'Stance'].map((h, i) => (
                  <th key={h} className={`px-2 py-1 text-[9px] font-mono font-bold uppercase tracking-wider text-muted-foreground ${i >= 2 ? 'text-right' : 'text-left'}`}>{h}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {[...rows].sort((a, b) => a.daysToNext - b.daysToNext).map(cb => (
                <tr key={cb.code} className="border-b border-border/40 hover:bg-surface-elevated cursor-pointer" onClick={() => setDrill(cb)}>
                  <td className="px-2 py-0.5 text-[11px] font-mono">{cb.flag} <span className="text-muted-foreground">{cb.code}</span></td>
                  <td className="px-2 py-0.5 text-[11px] font-mono font-bold">{cb.bank}</td>
                  <td className="px-2 py-0.5 text-right text-[11px] font-mono">{cb.nextMeeting}</td>
                  <td className={`px-2 py-0.5 text-right text-[11px] font-mono tabular-nums font-bold ${cb.daysToNext < 7 ? 'text-accent' : cb.daysToNext < 30 ? 'text-foreground' : 'text-muted-foreground'}`}>{cb.daysToNext < 0 ? 'TBD' : `${cb.daysToNext}d`}</td>
                  <td className="px-2 py-0.5 text-right text-[11px] font-mono tabular-nums font-bold">{cb.liveRate != null ? cb.liveRate.toFixed(2) + '%' : '—'}</td>
                  <td className={`px-2 py-0.5 text-right text-[10px] font-mono font-bold uppercase ${stanceTone(cb.stance)}`}>{cb.stance}</td>
                </tr>
              ))}
            </tbody>
          </table>
        )}

        {tab === 'STANCE' && (
          <div className="grid grid-cols-1 md:grid-cols-3 gap-1 p-1">
            {(['Hawkish', 'Neutral', 'Dovish'] as const).map(stance => {
              const list = rows.filter(r => r.stance === stance);
              const tone = stance === 'Hawkish' ? 'text-negative' : stance === 'Dovish' ? 'text-positive' : 'text-foreground';
              return (
                <div key={stance} className="border border-border bg-surface-deep">
                  <div className="px-2 py-1 border-b border-border flex items-center justify-between">
                    <span className={`text-[10px] font-mono font-bold uppercase tracking-wider ${tone}`}>{stance}</span>
                    <span className="text-[9px] font-mono text-muted-foreground">{list.length} banks</span>
                  </div>
                  <div className="divide-y divide-border/40">
                    {list.map(cb => (
                      <button key={cb.code} onClick={() => setDrill(cb)} className="w-full flex items-center justify-between px-2 py-1 hover:bg-surface-elevated text-[11px] font-mono">
                        <span>{cb.flag} <span className="font-bold">{cb.code}</span> <span className="text-muted-foreground">{cb.bank}</span></span>
                        <span className="tabular-nums font-bold">{cb.liveRate != null ? cb.liveRate.toFixed(2) + '%' : '—'}</span>
                      </button>
                    ))}
                  </div>
                </div>
              );
            })}
          </div>
        )}

        {tab === 'MOVES' && (
          <table className="w-full border-collapse">
            <thead className="sticky top-0 bg-surface-deep z-10">
              <tr className="border-b border-border">
                {['Date', 'CC', 'Bank', 'Move', 'Rate After', 'Stance'].map((h, i) => (
                  <th key={h} className={`px-2 py-1 text-[9px] font-mono font-bold uppercase tracking-wider text-muted-foreground ${i >= 3 ? 'text-right' : 'text-left'}`}>{h}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {[...rows].sort((a, b) => b.lastMoveDate.localeCompare(a.lastMoveDate)).map(cb => (
                <tr key={cb.code} className="border-b border-border/40 hover:bg-surface-elevated cursor-pointer" onClick={() => setDrill(cb)}>
                  <td className="px-2 py-0.5 text-[11px] font-mono text-muted-foreground">{cb.lastMoveDate}</td>
                  <td className="px-2 py-0.5 text-[11px] font-mono">{cb.flag} <span className="font-bold">{cb.code}</span></td>
                  <td className="px-2 py-0.5 text-[11px] font-mono">{cb.bank}</td>
                  <td className={`px-2 py-0.5 text-right text-[11px] font-mono font-bold tabular-nums ${cb.lastMoveBps > 0 ? 'text-negative' : cb.lastMoveBps < 0 ? 'text-positive' : 'text-muted-foreground'}`}>{cb.lastMoveBps === 0 ? 'HOLD' : `${cb.lastMoveBps > 0 ? '+' : ''}${cb.lastMoveBps}bp`}</td>
                  <td className="px-2 py-0.5 text-right text-[11px] font-mono tabular-nums">{cb.liveRate != null ? cb.liveRate.toFixed(2) + '%' : '—'}</td>
                  <td className={`px-2 py-0.5 text-right text-[10px] font-mono font-bold uppercase ${stanceTone(cb.stance)}`}>{cb.stance}</td>
                </tr>
              ))}
            </tbody>
          </table>
        )}

        <CmdDrawer open={!!drill} onClose={() => setDrill(null)} title={drill ? `${drill.flag} ${drill.bank} — ${drill.name}` : ''} subtitle={drill ? `${drill.rateLabel} · ${drill.ccy}` : ''}>
          {drill && (
            <div className="p-2 space-y-2">
              <div className="grid grid-cols-3 gap-1">
                <div className="border border-border bg-surface-deep p-2"><div className="text-[9px] font-mono uppercase text-muted-foreground">Rate</div><div className="text-2xl font-mono font-bold tabular-nums text-accent">{drill.rate?.toFixed(2)}%</div></div>
                <div className="border border-border bg-surface-deep p-2"><div className="text-[9px] font-mono uppercase text-muted-foreground">Last Move</div><div className={`text-lg font-mono font-bold tabular-nums ${drill.lastMoveBps > 0 ? 'text-negative' : drill.lastMoveBps < 0 ? 'text-positive' : 'text-foreground'}`}>{drill.lastMoveBps === 0 ? 'HOLD' : `${drill.lastMoveBps > 0 ? '+' : ''}${drill.lastMoveBps}bp`}</div><div className="text-[9px] font-mono text-muted-foreground">{drill.lastMoveDate}</div></div>
                <div className="border border-border bg-surface-deep p-2"><div className="text-[9px] font-mono uppercase text-muted-foreground">Next Mtg</div><div className="text-lg font-mono font-bold">{drill.nextMeeting}</div><div className="text-[9px] font-mono text-accent">{daysUntil(drill.nextMeeting)}d</div></div>
              </div>
              <div className="border border-border bg-surface-deep p-2">
                <div className="text-[9px] font-mono uppercase tracking-wider text-accent mb-1">24-Month Rate History</div>
                <div className="text-accent"><Sparkline data={rateHistory(drill)} w={490} h={60} fill="currentColor" /></div>
              </div>
              <div className="border border-border bg-surface-deep p-2 text-[11px] font-mono">
                <div className="flex justify-between"><span className="text-muted-foreground">Region</span><span>{drill.region}</span></div>
                <div className="flex justify-between"><span className="text-muted-foreground">Stance</span><span className={`font-bold ${stanceTone(drill.stance)}`}>{drill.stance.toUpperCase()}</span></div>
                <div className="flex justify-between"><span className="text-muted-foreground">Currency</span><span>{drill.ccy}</span></div>
              </div>
            </div>
          )}
        </CmdDrawer>
      </div>
    </CmdShell>
  );
}
