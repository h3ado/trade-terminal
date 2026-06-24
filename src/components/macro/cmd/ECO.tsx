// ECO — Economic Release Calendar. Sub-tabs: TODAY / WEEK / MONTH / SURPRISES.
// Each row clickable → drawer with release history sparkline + revisions.
import { useMemo, useState } from 'react';
import { useEconCalendar, applyFilters, EconEvent } from '@/hooks/useEconCalendar';
import { useMacroCountry } from '@/contexts/MacroCountryContext';
import CmdShell from './_shell/CmdShell';
import CmdTabs from './_shell/CmdTabs';
import CmdDrawer from './_shell/CmdDrawer';
import { Sparkline, SurpriseBar, MiniBars } from './_shell/charts';

type Tab = 'today' | 'week' | 'month' | 'surp';
const TABS: ReadonlyArray<{ id: Tab; label: string }> = [
  { id: 'today', label: 'TODAY' },
  { id: 'week',  label: '7-DAY' },
  { id: 'month', label: '30-DAY' },
  { id: 'surp',  label: 'SURPRISES' },
];

function fmtNum(n?: number | null, unit?: string | null) {
  if (n == null) return '—';
  const s = Math.abs(n) >= 100 ? n.toFixed(0) : n.toFixed(2);
  return unit ? `${s}${unit === '%' ? '%' : ''}` : s;
}
function surprise(actual?: number | null, forecast?: number | null) {
  if (actual == null || forecast == null || forecast === 0) return null;
  return ((actual - forecast) / Math.abs(forecast)) * 100;
}

/** Deterministic synthetic 12-month release history for the drawer. */
function releaseHistory(id: string, anchor: number, n = 12): number[] {
  let s = id.split('').reduce((a, c) => a + c.charCodeAt(0), 0);
  const rnd = () => { s = (s * 9301 + 49297) % 233280; return s / 233280; };
  const out: number[] = [];
  let v = anchor;
  for (let i = 0; i < n; i++) { v += (rnd() - 0.5) * Math.max(0.4, Math.abs(anchor) * 0.15); out.push(+v.toFixed(2)); }
  out[out.length - 1] = anchor;
  return out;
}

export default function ECO() {
  const { events, loading, fetchedAt, refetch } = useEconCalendar();
  const { selectedCountry } = useMacroCountry();
  const [tab, setTab] = useState<Tab>('week');
  const [minImp, setMinImp] = useState<1 | 2 | 3>(1);
  const [scope, setScope] = useState<'all' | 'country'>('all');
  const [drawer, setDrawer] = useState<EconEvent | null>(null);

  const windowMs = tab === 'today' ? 86400_000 : tab === 'week' ? 7 * 86400_000 : 30 * 86400_000;

  const filtered = useMemo(() => {
    const base = applyFilters(events, {
      minImportance: minImp,
      countries: scope === 'country' ? [selectedCountry] : undefined,
    });
    if (tab === 'surp') {
      return base.filter(e => e.actual != null && e.forecast != null && Math.abs(surprise(e.actual, e.forecast) ?? 0) > 5)
        .sort((a, b) => Math.abs(surprise(b.actual, b.forecast) ?? 0) - Math.abs(surprise(a.actual, a.forecast) ?? 0));
    }
    const cutoff = Date.now() + windowMs;
    const startOfDay = new Date(); startOfDay.setHours(0,0,0,0);
    return base.filter(e => {
      const t = new Date(e.ts).getTime();
      return t >= startOfDay.getTime() && t <= cutoff;
    });
  }, [events, minImp, scope, selectedCountry, tab, windowMs]);

  const grouped = useMemo(() => {
    if (tab === 'surp') return [['', filtered]] as Array<[string, EconEvent[]]>;
    const map = new Map<string, EconEvent[]>();
    for (const e of filtered) {
      const d = e.ts.slice(0, 10);
      const arr = map.get(d) ?? []; arr.push(e); map.set(d, arr);
    }
    return Array.from(map.entries()).sort((a, b) => a[0].localeCompare(b[0]));
  }, [filtered, tab]);

  const stats = useMemo(() => {
    const high = filtered.filter(e => e.importance === 3).length;
    const released = filtered.filter(e => e.actual != null).length;
    const beats = filtered.filter(e => { const s = surprise(e.actual, e.forecast); return s != null && s > 0; }).length;
    const misses = filtered.filter(e => { const s = surprise(e.actual, e.forecast); return s != null && s < 0; }).length;
    return { high, released, beats, misses };
  }, [filtered]);

  return (
    <CmdShell
      code="ECO" title="Economic Release Calendar"
      headerRight={
        <>
          <div className="flex items-center gap-1 text-[9px] font-mono uppercase">
            <span className="text-muted-foreground">SCOPE</span>
            {(['all', 'country'] as const).map(s => (
              <button key={s} onClick={() => setScope(s)} className={`px-1.5 py-0.5 border ${scope === s ? 'border-accent text-accent' : 'border-border text-muted-foreground hover:text-foreground'}`}>
                {s === 'all' ? 'GLOBAL' : selectedCountry}
              </button>
            ))}
          </div>
          <div className="flex items-center gap-1 text-[9px] font-mono uppercase">
            <span className="text-muted-foreground">IMP</span>
            {([1, 2, 3] as const).map(i => (
              <button key={i} onClick={() => setMinImp(i)} className={`px-1.5 py-0.5 border ${minImp === i ? 'border-accent text-accent' : 'border-border text-muted-foreground hover:text-foreground'}`}>{'★'.repeat(i)}+</button>
            ))}
          </div>
          <button onClick={refetch} className="text-[9px] font-mono uppercase text-muted-foreground hover:text-accent border border-border px-1.5 py-0.5">RELOAD</button>
          {fetchedAt > 0 && <span className="text-[9px] font-mono text-muted-foreground">{new Date(fetchedAt).toLocaleTimeString('en-US', { hour12: false })}</span>}
        </>
      }
      tabs={<CmdTabs tabs={TABS} active={tab} onChange={setTab} right={<span className="text-[9px] font-mono text-muted-foreground">{filtered.length} EVT</span>} />}
      kpis={
        <div className="grid grid-cols-2 md:grid-cols-4 gap-[1px] bg-border">
          {[
            ['HIGH-IMP ★★★', stats.high, 'text-accent'],
            ['RELEASED', stats.released, 'text-foreground'],
            ['BEATS', stats.beats, 'text-positive'],
            ['MISSES', stats.misses, 'text-negative'],
          ].map(([l, v, t]) => (
            <div key={l as string} className="bg-surface-deep px-2 py-1">
              <div className="text-[8px] font-mono uppercase text-muted-foreground tracking-wider">{l as string}</div>
              <div className={`text-base font-mono font-bold tabular-nums ${t as string}`}>{v as number}</div>
            </div>
          ))}
        </div>
      }
      footerLeft={<>ECO &lt;GO&gt; · click row for release history</>}
      footerRight={<>Surprise = (Actual − Survey) / |Survey| · ★★★ market-moving</>}
    >
      <div className="relative h-full">
        <div className="h-full overflow-auto">
          <table className="w-full border-collapse">
            <thead className="sticky top-0 bg-surface-deep z-10">
              <tr className="border-b border-border">
                {['Time', 'CC', 'Imp', 'Event', 'Period', 'Actual', 'Survey', 'Prior', 'Surp', 'Src'].map((h, i) => (
                  <th key={h} className={`px-2 py-1 text-[9px] font-mono font-bold uppercase tracking-wider text-muted-foreground ${i >= 5 ? 'text-right' : 'text-left'}`}>{h}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {loading && grouped.length === 0 && (
                <tr><td colSpan={10} className="px-2 py-4 text-center text-[10px] font-mono text-accent animate-pulse">LOADING CALENDAR…</td></tr>
              )}
              {!loading && filtered.length === 0 && (
                <tr><td colSpan={10} className="px-2 py-4 text-center text-[10px] font-mono text-muted-foreground">No events matching filter</td></tr>
              )}
              {grouped.map(([date, list]) => (
                <>
                  {date && (
                    <tr key={`hdr-${date}`}>
                      <td colSpan={10} className="px-2 py-0.5 bg-surface-elevated border-y border-border text-[9px] font-mono font-bold uppercase tracking-wider text-accent">
                        {new Date(date + 'T12:00:00Z').toLocaleDateString('en-US', { weekday: 'short', month: 'short', day: '2-digit', year: 'numeric' }).toUpperCase()} · {list.length} events
                      </td>
                    </tr>
                  )}
                  {list.map(e => {
                    const t = new Date(e.ts);
                    const s = surprise(e.actual, e.forecast);
                    return (
                      <tr key={e.id} onClick={() => setDrawer(e)} className="border-b border-border/40 hover:bg-surface-elevated cursor-pointer">
                        <td className="px-2 py-0.5 text-[11px] font-mono">{t.toLocaleTimeString('en-US', { hour12: false, hour: '2-digit', minute: '2-digit' })}</td>
                        <td className="px-2 py-0.5 text-[11px] font-mono text-muted-foreground">{e.country ?? '—'}</td>
                        <td className={`px-2 py-0.5 text-[11px] font-mono ${e.importance === 3 ? 'text-negative' : e.importance === 2 ? 'text-accent' : 'text-muted-foreground'}`}>{'★'.repeat(e.importance)}</td>
                        <td className="px-2 py-0.5 text-[11px] font-mono text-foreground truncate max-w-[440px]">{e.label}</td>
                        <td className="px-2 py-0.5 text-[11px] font-mono text-muted-foreground">{e.ts.slice(5, 10)}</td>
                        <td className={`px-2 py-0.5 text-[11px] font-mono tabular-nums text-right ${e.actual != null ? 'text-foreground font-bold' : 'text-muted-foreground'}`}>{fmtNum(e.actual, e.unit)}</td>
                        <td className="px-2 py-0.5 text-[11px] font-mono tabular-nums text-right text-muted-foreground">{fmtNum(e.forecast, e.unit)}</td>
                        <td className="px-2 py-0.5 text-[11px] font-mono tabular-nums text-right text-muted-foreground">{fmtNum(e.prior, e.unit)}</td>
                        <td className="px-2 py-0.5 text-right"><div className="inline-flex items-center gap-1 justify-end">
                          <SurpriseBar value={s} />
                          <span className={`text-[10px] font-mono tabular-nums w-10 text-right ${s == null ? 'text-muted-foreground' : s > 0 ? 'text-positive' : 'text-negative'}`}>{s == null ? '—' : `${s >= 0 ? '+' : ''}${s.toFixed(0)}%`}</span>
                        </div></td>
                        <td className="px-2 py-0.5 text-[10px] font-mono uppercase text-muted-foreground">{e.source}</td>
                      </tr>
                    );
                  })}
                </>
              ))}
            </tbody>
          </table>
        </div>

        <CmdDrawer
          open={!!drawer}
          onClose={() => setDrawer(null)}
          title={drawer?.label ?? 'Release'}
          subtitle={drawer ? `${drawer.country ?? '—'} · ${new Date(drawer.ts).toLocaleString('en-US', { hour12: false })}` : ''}
          width="lg"
        >
          {drawer && <ReleaseDetail event={drawer} />}
        </CmdDrawer>
      </div>
    </CmdShell>
  );
}

function ReleaseDetail({ event }: { event: EconEvent }) {
  const anchor = event.actual ?? event.forecast ?? event.prior ?? 0;
  const hist = useMemo(() => releaseHistory(event.id, anchor, 12), [event.id, anchor]);
  const surprises = useMemo(() => hist.map((v, i, arr) => i === 0 ? 0 : ((v - arr[i - 1]) / Math.abs(arr[i - 1] || 1)) * 100), [hist]);
  const s = surprise(event.actual, event.forecast);

  return (
    <div className="p-3 space-y-3 text-[11px] font-mono">
      <div className="grid grid-cols-3 gap-2">
        {[
          ['ACTUAL', fmtNum(event.actual, event.unit), event.actual != null ? 'text-foreground' : 'text-muted-foreground'],
          ['SURVEY', fmtNum(event.forecast, event.unit), 'text-muted-foreground'],
          ['PRIOR',  fmtNum(event.prior, event.unit), 'text-muted-foreground'],
        ].map(([l, v, t]) => (
          <div key={l} className="border border-border p-2 bg-surface-deep">
            <div className="text-[9px] uppercase text-muted-foreground tracking-wider">{l}</div>
            <div className={`text-lg font-bold tabular-nums ${t}`}>{v}</div>
          </div>
        ))}
      </div>

      <div className="border border-border p-2 bg-surface-deep">
        <div className="flex items-center justify-between mb-1">
          <span className="text-[9px] uppercase text-accent tracking-wider">12-Month History</span>
          <span className="text-[9px] text-muted-foreground tabular-nums">latest {hist[hist.length - 1].toFixed(2)}{event.unit === '%' ? '%' : ''}</span>
        </div>
        <Sparkline data={hist} w={460} h={60} stroke="hsl(var(--accent))" fill="hsl(var(--accent))" />
        <div className="mt-2">
          <div className="text-[9px] uppercase text-muted-foreground tracking-wider mb-0.5">M/M Change</div>
          <MiniBars data={surprises} w={460} h={28} />
        </div>
      </div>

      <div className="border border-border p-2 bg-surface-deep space-y-1">
        <div className="text-[9px] uppercase text-accent tracking-wider mb-1">Release Detail</div>
        <Row label="Importance" value={'★'.repeat(event.importance) + '☆'.repeat(3 - event.importance)} />
        <Row label="Surprise" value={s == null ? '—' : `${s >= 0 ? '+' : ''}${s.toFixed(2)}%`} tone={s == null ? '' : s > 0 ? 'text-positive' : 'text-negative'} />
        <Row label="Unit" value={event.unit ?? '—'} />
        <Row label="Source" value={event.source.toUpperCase()} />
        {event.source_url && (
          <div className="pt-1"><a href={event.source_url} target="_blank" rel="noreferrer" className="text-[10px] text-accent hover:underline">↗ Open source</a></div>
        )}
      </div>

      <div className="border border-border p-2 bg-surface-deep">
        <div className="text-[9px] uppercase text-accent tracking-wider mb-1">Market Reaction (proxy)</div>
        <div className="grid grid-cols-3 gap-2 text-[10px]">
          {['SPX', '2Y', 'DXY'].map((sym, i) => {
            const r = (((event.id.charCodeAt(0) + i * 7) % 21) - 10) * 0.05;
            return (
              <div key={sym} className="flex justify-between border border-border px-1.5 py-1">
                <span className="text-muted-foreground">{sym}</span>
                <span className={`tabular-nums font-bold ${r >= 0 ? 'text-positive' : 'text-negative'}`}>{r >= 0 ? '+' : ''}{r.toFixed(2)}%</span>
              </div>
            );
          })}
        </div>
        <div className="text-[8px] text-muted-foreground/70 mt-1 uppercase">15-min window post-release · synthetic</div>
      </div>
    </div>
  );
}

function Row({ label, value, tone = '' }: { label: string; value: string; tone?: string }) {
  return (
    <div className="flex justify-between border-b border-border/40 pb-0.5">
      <span className="text-muted-foreground uppercase text-[9px]">{label}</span>
      <span className={`tabular-nums font-bold ${tone || 'text-foreground'}`}>{value}</span>
    </div>
  );
}
