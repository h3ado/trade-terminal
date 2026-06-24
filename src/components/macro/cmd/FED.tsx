// FED — Federal Reserve Portal. Sub-tabs: POLICY, BAL SHEET, DOTS,
// SPEECHES, VOTERS, PROJECTIONS. Live FRED data overlays seeded
// FOMC schedule + dot-plot + balance-sheet history.
import { useMemo, useState } from 'react';
import { useFRED } from '@/hooks/useFRED';
import { FOMC_MEETINGS, FED_SPEECHES, FOMC_VOTERS_2026 } from '@/data/fomc';
import CmdShell from './_shell/CmdShell';
import CmdTabs from './_shell/CmdTabs';
import CmdDrawer from './_shell/CmdDrawer';
import { Sparkline, MiniBars, Histogram } from './_shell/charts';

type Tab = 'POLICY' | 'BAL' | 'DOTS' | 'SPEECHES' | 'VOTERS' | 'PROJ';

const fmt = (v: number | null | undefined, unit = '%') => v == null || !Number.isFinite(v) ? '—' : v.toFixed(2) + (unit === '%' ? '%' : '');
const toneOf = (t: 'Hawkish' | 'Dovish' | 'Neutral') => t === 'Hawkish' ? 'text-negative' : t === 'Dovish' ? 'text-positive' : 'text-foreground';

function Kpi({ label, value, sub, tone = 'neu' }: { label: string; value: string; sub?: string; tone?: 'pos' | 'neg' | 'neu' | 'accent' }) {
  const t = tone === 'pos' ? 'text-positive' : tone === 'neg' ? 'text-negative' : tone === 'accent' ? 'text-accent' : 'text-foreground';
  return (
    <div className="border border-border p-2 bg-surface-deep min-w-0">
      <div className="text-[9px] font-mono uppercase tracking-wider text-muted-foreground truncate">{label}</div>
      <div className={`text-base font-mono font-bold tabular-nums ${t} mt-0.5`}>{value}</div>
      {sub && <div className="text-[9px] font-mono text-muted-foreground mt-0.5 truncate">{sub}</div>}
    </div>
  );
}

// Seeded balance sheet history (USD trn, monthly, last 60 months → Jun-2026)
const BAL_TOTAL = [7.85,7.92,8.05,8.20,8.35,8.50,8.62,8.73,8.81,8.85,8.90,8.92,8.93,8.93,8.91,8.88,8.82,8.74,8.65,8.55,8.45,8.35,8.24,8.13,8.02,7.91,7.80,7.71,7.62,7.53,7.45,7.38,7.31,7.24,7.18,7.12,7.06,7.01,6.96,6.92,6.88,6.84,6.81,6.78,6.75,6.72,6.69,6.66,6.63,6.60,6.57,6.55,6.52,6.50,6.48,6.46,6.44,6.42,6.41,6.40];
const BAL_TREAS = BAL_TOTAL.map(v => v * 0.62);
const BAL_MBS   = BAL_TOTAL.map(v => v * 0.30);

// 2026-03 SEP dot plot (FOMC participants, 19 dots per year)
const DOTS_2026 = [3.75, 3.75, 3.75, 3.75, 4.00, 4.00, 4.00, 4.00, 4.00, 4.00, 4.25, 4.25, 4.25, 4.25, 4.25, 4.50, 4.50, 4.50, 4.50];
const DOTS_2027 = [2.75, 3.00, 3.00, 3.25, 3.25, 3.25, 3.50, 3.50, 3.50, 3.50, 3.75, 3.75, 3.75, 3.75, 4.00, 4.00, 4.00, 4.25, 4.25];
const DOTS_2028 = [2.50, 2.75, 2.75, 2.75, 3.00, 3.00, 3.00, 3.00, 3.25, 3.25, 3.25, 3.25, 3.50, 3.50, 3.75, 3.75, 3.75, 4.00, 4.00];
const DOTS_LR   = [2.50, 2.75, 2.75, 2.75, 2.75, 2.75, 3.00, 3.00, 3.00, 3.00, 3.00, 3.00, 3.00, 3.25, 3.25, 3.25, 3.25, 3.50, 3.50];

// Mar-2026 SEP economic projections (median, central tendency low–high)
const SEP = [
  { metric: 'GDP Growth',  y2026: { med: 1.9, low: 1.6, high: 2.2 }, y2027: { med: 1.9, low: 1.7, high: 2.1 }, y2028: { med: 1.9, low: 1.8, high: 2.1 }, lr: { med: 1.8, low: 1.7, high: 2.0 } },
  { metric: 'Unemployment',y2026: { med: 4.4, low: 4.2, high: 4.6 }, y2027: { med: 4.3, low: 4.1, high: 4.5 }, y2028: { med: 4.2, low: 4.0, high: 4.4 }, lr: { med: 4.1, low: 3.9, high: 4.3 } },
  { metric: 'PCE Infl',    y2026: { med: 2.4, low: 2.2, high: 2.7 }, y2027: { med: 2.1, low: 2.0, high: 2.3 }, y2028: { med: 2.0, low: 1.9, high: 2.1 }, lr: { med: 2.0, low: 2.0, high: 2.0 } },
  { metric: 'Core PCE',    y2026: { med: 2.5, low: 2.3, high: 2.8 }, y2027: { med: 2.2, low: 2.0, high: 2.4 }, y2028: { med: 2.0, low: 2.0, high: 2.1 }, lr: { med: 2.0, low: 2.0, high: 2.0 } },
  { metric: 'Fed Funds',   y2026: { med: 3.75, low: 3.50, high: 4.25 }, y2027: { med: 3.25, low: 2.75, high: 3.75 }, y2028: { med: 3.00, low: 2.50, high: 3.50 }, lr: { med: 3.00, low: 2.75, high: 3.50 } },
];

function DotPlot({ year, dots }: { year: string; dots: number[] }) {
  const min = 2, max = 5;
  const W = 220, H = 90;
  const cols: Record<string, number> = {};
  return (
    <div className="border border-border bg-surface-deep p-2">
      <div className="flex items-baseline justify-between mb-1">
        <span className="text-[9px] font-mono uppercase tracking-wider text-accent">{year}</span>
        <span className="text-[9px] font-mono text-muted-foreground tabular-nums">median {dots[Math.floor(dots.length / 2)].toFixed(2)}%</span>
      </div>
      <svg width={W} height={H} className="block">
        {[2, 2.5, 3, 3.5, 4, 4.5, 5].map(r => {
          const y = H - ((r - min) / (max - min)) * H;
          return <g key={r}>
            <line x1={20} x2={W} y1={y} y2={y} className="stroke-border" strokeDasharray="2,2" />
            <text x={2} y={y + 3} className="fill-muted-foreground text-[8px] font-mono">{r.toFixed(1)}</text>
          </g>;
        })}
        {dots.map((d, i) => {
          const key = d.toFixed(3);
          const col = (cols[key] = (cols[key] ?? 0) + 1);
          const cx = 25 + (col - 1) * 8;
          const cy = H - ((d - min) / (max - min)) * H;
          return <circle key={i} cx={cx} cy={cy} r={3} className="fill-accent" />;
        })}
      </svg>
    </div>
  );
}

export default function FED() {
  const fred = useFRED();
  const [tab, setTab] = useState<Tab>('POLICY');
  const [drillMtg, setDrillMtg] = useState<typeof FOMC_MEETINGS[number] | null>(null);

  const ff = fred.byKey['fed_funds']?.value ?? null;
  const t10 = fred.byKey['ten_year']?.value ?? null;
  const t2 = fred.byKey['two_year']?.value ?? null;
  const cpi = fred.byKey['cpi_yoy']?.value ?? null;
  const core = fred.byKey['core_pce_yoy']?.value ?? null;
  const unemp = fred.byKey['unemployment']?.value ?? null;
  const realRate = ff != null && core != null ? +(ff - core).toFixed(2) : null;
  const slope = t10 != null && t2 != null ? +((t10 - t2) * 100).toFixed(0) : null;

  const past = useMemo(() => FOMC_MEETINGS.filter(m => m.status === 'Past').slice(-8).reverse(), []);
  const upcoming = useMemo(() => FOMC_MEETINGS.filter(m => m.status === 'Upcoming').slice(0, 6), []);
  const nextMeeting = upcoming[0];
  const daysToNext = nextMeeting ? Math.ceil((new Date(nextMeeting.date).getTime() - Date.now()) / 86400_000) : null;

  const last12mo = useMemo(() => {
    const cutoff = Date.now() - 365 * 86400_000;
    return FOMC_MEETINGS.filter(m => m.status === 'Past' && m.decisionBps != null && new Date(m.date).getTime() >= cutoff).reduce((s, m) => s + (m.decisionBps ?? 0), 0);
  }, []);

  const balLatest = BAL_TOTAL[BAL_TOTAL.length - 1];
  const balYoY = ((balLatest / BAL_TOTAL[BAL_TOTAL.length - 13]) - 1) * 100;

  return (
    <CmdShell
      code="FED"
      title="Federal Reserve Portal · Policy · Balance Sheet · Dots · Speeches"
      headerRight={<span className="text-[9px] font-mono text-muted-foreground uppercase">{fred.ts ? new Date(fred.ts).toLocaleTimeString('en-US', { hour12: false }) : '...'} · Live FRED</span>}
      tabs={<CmdTabs tabs={[{ id: 'POLICY', label: 'Policy' }, { id: 'BAL', label: 'Bal Sheet' }, { id: 'DOTS', label: 'Dots' }, { id: 'PROJ', label: 'Projections' }, { id: 'SPEECHES', label: 'Speeches' }, { id: 'VOTERS', label: 'Voters' }]} active={tab} onChange={setTab} />}
      kpis={
        <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-7 gap-1 p-1">
          <Kpi label="Fed Funds Upper" value={fmt(ff)} sub="DFEDTARU" tone="accent" />
          <Kpi label="Last 12mo Δ" value={`${last12mo > 0 ? '+' : ''}${last12mo}bps`} sub={`${FOMC_MEETINGS.filter(m => m.status === 'Past' && m.decisionBps && new Date(m.date).getTime() >= Date.now() - 365 * 86400_000).length} mtgs`} tone={last12mo < 0 ? 'pos' : last12mo > 0 ? 'neg' : 'neu'} />
          <Kpi label="Real Rate" value={realRate != null ? `${realRate}%` : '—'} sub="FF − Core PCE" tone={realRate != null && realRate > 1 ? 'neg' : 'pos'} />
          <Kpi label="Core PCE YoY" value={fmt(core)} sub="Target 2.0%" tone={core != null && core > 2.5 ? 'neg' : 'pos'} />
          <Kpi label="CPI YoY" value={fmt(cpi)} sub="Headline" tone={cpi != null && cpi > 3 ? 'neg' : 'pos'} />
          <Kpi label="Unemployment" value={fmt(unemp)} sub="Mandate" tone={unemp != null && unemp < 5 ? 'pos' : 'neg'} />
          <Kpi label="2s10s" value={slope != null ? `${slope}bps` : '—'} sub={slope != null && slope < 0 ? 'INVERTED' : 'NORMAL'} tone={slope != null && slope < 0 ? 'neg' : 'pos'} />
        </div>
      }
      footerLeft={`FED <GO> · Next mtg ${nextMeeting?.date ?? '—'} (${daysToNext ?? '—'}d) · FOMC for archive · FFIP for path`}
      footerRight="Live: FRED · Static: meetings, dot plot, balance sheet, speeches feed"
    >
      <div className="h-full overflow-auto p-1 relative">

        {tab === 'POLICY' && (
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-1">
            <div className="border border-border bg-surface-deep">
              <div className="px-2 py-1 border-b border-border"><span className="text-[9px] font-mono uppercase tracking-wider text-accent">Recent & Upcoming FOMC</span></div>
              <table className="w-full border-collapse">
                <thead><tr className="border-b border-border">
                  {['Date', 'Type', 'Decision', 'Rate', 'Vote', 'Links'].map((h, i) => (
                    <th key={h} className={`px-2 py-1 text-[9px] font-mono font-bold uppercase tracking-wider text-muted-foreground ${i >= 2 && i <= 4 ? 'text-right' : 'text-left'}`}>{h}</th>
                  ))}
                </tr></thead>
                <tbody>
                  {upcoming.map(m => {
                    const d = Math.ceil((new Date(m.date).getTime() - Date.now()) / 86400_000);
                    return (
                      <tr key={m.date} className="border-b border-border/40 bg-surface-elevated/40 cursor-pointer" onClick={() => setDrillMtg(m)}>
                        <td className="px-2 py-0.5 text-[11px] font-mono font-bold">{m.date}</td>
                        <td className="px-2 py-0.5 text-[11px] font-mono text-muted-foreground">{m.type}</td>
                        <td className="px-2 py-0.5 text-[11px] font-mono text-right text-accent">PENDING</td>
                        <td className="px-2 py-0.5 text-[11px] font-mono text-right text-muted-foreground">—</td>
                        <td className="px-2 py-0.5 text-[11px] font-mono text-right text-muted-foreground">—</td>
                        <td className="px-2 py-0.5 text-[11px] font-mono text-accent">{d}d</td>
                      </tr>
                    );
                  })}
                  {past.map(m => (
                    <tr key={m.date} className="border-b border-border/40 hover:bg-surface-elevated cursor-pointer" onClick={() => setDrillMtg(m)}>
                      <td className="px-2 py-0.5 text-[11px] font-mono">{m.date}</td>
                      <td className="px-2 py-0.5 text-[11px] font-mono text-muted-foreground">{m.type}</td>
                      <td className={`px-2 py-0.5 text-[11px] font-mono text-right font-bold tabular-nums ${(m.decisionBps ?? 0) > 0 ? 'text-negative' : (m.decisionBps ?? 0) < 0 ? 'text-positive' : 'text-muted-foreground'}`}>
                        {m.decisionBps === 0 ? 'HOLD' : `${m.decisionBps! > 0 ? '+' : ''}${m.decisionBps}bps`}
                      </td>
                      <td className="px-2 py-0.5 text-[11px] font-mono text-right tabular-nums">{m.rateAfter?.toFixed(2)}%</td>
                      <td className="px-2 py-0.5 text-[11px] font-mono text-right text-muted-foreground tabular-nums">{m.voteFor}-{m.voteAgainst}</td>
                      <td className="px-2 py-0.5 text-[10px] font-mono">
                        {m.statementUrl && <a href={m.statementUrl} target="_blank" rel="noreferrer" onClick={e => e.stopPropagation()} className="text-accent hover:underline mr-1">STMT</a>}
                        {m.minutesUrl && <a href={m.minutesUrl} target="_blank" rel="noreferrer" onClick={e => e.stopPropagation()} className="text-accent hover:underline">MIN</a>}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            <div className="border border-border bg-surface-deep">
              <div className="px-2 py-1 border-b border-border"><span className="text-[9px] font-mono uppercase tracking-wider text-accent">Fed Funds Path (Past 8 Meetings)</span></div>
              <div className="p-2">
                <div className="text-accent"><Sparkline data={FOMC_MEETINGS.filter(m => m.rateAfter != null).map(m => m.rateAfter!)} w={420} h={80} fill="currentColor" /></div>
                <div className="mt-2 text-[10px] font-mono text-muted-foreground">Latest rate {fmt(FOMC_MEETINGS.filter(m => m.rateAfter != null).slice(-1)[0]?.rateAfter)} · live FRED {fmt(ff)}</div>
              </div>
            </div>
          </div>
        )}

        {tab === 'BAL' && (
          <div className="space-y-1">
            <div className="grid grid-cols-2 md:grid-cols-4 gap-1">
              <Kpi label="Total SOMA" value={`$${balLatest.toFixed(2)}T`} sub="H.4.1 weekly" tone="accent" />
              <Kpi label="YoY Change" value={`${balYoY >= 0 ? '+' : ''}${balYoY.toFixed(2)}%`} sub="QT pace" tone={balYoY < 0 ? 'pos' : 'neg'} />
              <Kpi label="Treasuries" value={`$${(balLatest * 0.62).toFixed(2)}T`} sub="62% mix" />
              <Kpi label="Agency MBS" value={`$${(balLatest * 0.30).toFixed(2)}T`} sub="30% mix" />
            </div>
            <div className="border border-border bg-surface-deep p-2">
              <div className="text-[9px] font-mono uppercase tracking-wider text-accent mb-1">SOMA Balance Sheet · 60 Months (USD Trn)</div>
              <div className="text-accent"><Sparkline data={BAL_TOTAL} w={920} h={120} fill="currentColor" /></div>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-1">
              <div className="border border-border bg-surface-deep p-2">
                <div className="text-[9px] font-mono uppercase tracking-wider text-foreground mb-1">Treasuries</div>
                <div className="text-foreground"><Sparkline data={BAL_TREAS} w={440} h={60} fill="currentColor" /></div>
              </div>
              <div className="border border-border bg-surface-deep p-2">
                <div className="text-[9px] font-mono uppercase tracking-wider text-foreground mb-1">MBS</div>
                <div className="text-muted-foreground"><Sparkline data={BAL_MBS} w={440} h={60} fill="currentColor" /></div>
              </div>
            </div>
            <div className="border border-border bg-surface-deep p-2">
              <div className="text-[9px] font-mono uppercase tracking-wider text-accent mb-1">Monthly Change ($Bn)</div>
              <MiniBars data={BAL_TOTAL.map((v, i, a) => i === 0 ? 0 : (v - a[i - 1]) * 1000)} w={920} h={48} />
            </div>
          </div>
        )}

        {tab === 'DOTS' && (
          <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-4 gap-1">
            <DotPlot year="2026" dots={DOTS_2026} />
            <DotPlot year="2027" dots={DOTS_2027} />
            <DotPlot year="2028" dots={DOTS_2028} />
            <DotPlot year="Longer Run" dots={DOTS_LR} />
            <div className="col-span-full border border-border bg-surface-deep p-2">
              <div className="text-[9px] font-mono uppercase tracking-wider text-accent mb-1">2026 Dot Dispersion</div>
              <Histogram data={DOTS_2026} bins={12} w={900} h={48} markValue={ff ?? undefined} />
              <div className="text-[9px] font-mono text-muted-foreground mt-1">Dashed line = current Fed Funds Upper ({fmt(ff)})</div>
            </div>
          </div>
        )}

        {tab === 'PROJ' && (
          <div className="border border-border bg-surface-deep">
            <div className="px-2 py-1 border-b border-border"><span className="text-[9px] font-mono uppercase tracking-wider text-accent">Mar-2026 SEP · Central Tendency (low – median – high)</span></div>
            <table className="w-full border-collapse">
              <thead><tr className="border-b border-border">
                {['Metric', '2026', '2027', '2028', 'Longer Run'].map((h, i) => (
                  <th key={h} className={`px-2 py-1 text-[9px] font-mono font-bold uppercase tracking-wider text-muted-foreground ${i === 0 ? 'text-left' : 'text-center'}`}>{h}</th>
                ))}
              </tr></thead>
              <tbody>
                {SEP.map(s => (
                  <tr key={s.metric} className="border-b border-border/40 hover:bg-surface-elevated">
                    <td className="px-2 py-1 text-[11px] font-mono font-bold">{s.metric}</td>
                    {(['y2026', 'y2027', 'y2028', 'lr'] as const).map(y => (
                      <td key={y} className="px-2 py-1 text-center text-[11px] font-mono tabular-nums">
                        <span className="text-muted-foreground">{(s as any)[y].low.toFixed(1)}</span>
                        <span className="text-accent font-bold mx-2">{(s as any)[y].med.toFixed(1)}</span>
                        <span className="text-muted-foreground">{(s as any)[y].high.toFixed(1)}</span>
                      </td>
                    ))}
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}

        {tab === 'SPEECHES' && (
          <div className="border border-border bg-surface-deep">
            <table className="w-full border-collapse">
              <thead className="sticky top-0 bg-surface-deep"><tr className="border-b border-border">
                {['Date', 'Speaker', 'Role', 'Topic', 'Tone'].map((h, i) => (
                  <th key={h} className={`px-2 py-1 text-[9px] font-mono font-bold uppercase tracking-wider text-muted-foreground ${i === 4 ? 'text-right' : 'text-left'}`}>{h}</th>
                ))}
              </tr></thead>
              <tbody>
                {FED_SPEECHES.map((s, i) => (
                  <tr key={i} className="border-b border-border/40 hover:bg-surface-elevated">
                    <td className="px-2 py-0.5 text-[11px] font-mono text-muted-foreground">{s.date}</td>
                    <td className="px-2 py-0.5 text-[11px] font-mono font-bold">{s.speaker}</td>
                    <td className="px-2 py-0.5 text-[10px] font-mono text-muted-foreground">{s.role}</td>
                    <td className="px-2 py-0.5 text-[11px] font-mono"><a href={s.url} target="_blank" rel="noreferrer" className="hover:text-accent">{s.title}</a></td>
                    <td className={`px-2 py-0.5 text-[10px] font-mono text-right font-bold ${toneOf(s.tone)}`}>{s.tone.toUpperCase()}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}

        {tab === 'VOTERS' && (
          <div className="border border-border bg-surface-deep">
            <div className="px-2 py-1 border-b border-border"><span className="text-[9px] font-mono uppercase tracking-wider text-accent">2026 FOMC Voters ({FOMC_VOTERS_2026.length})</span></div>
            <div className="p-2 grid grid-cols-2 md:grid-cols-3 xl:grid-cols-4 gap-1">
              {FOMC_VOTERS_2026.map(v => (
                <div key={v.name} className="border border-border bg-background p-2">
                  <div className="text-[11px] font-mono font-bold text-foreground">{v.name}</div>
                  <div className="text-[9px] font-mono text-muted-foreground uppercase">{v.role}</div>
                </div>
              ))}
            </div>
          </div>
        )}

        <CmdDrawer open={!!drillMtg} onClose={() => setDrillMtg(null)} title={drillMtg ? `FOMC · ${drillMtg.date}` : ''} subtitle={drillMtg?.type === 'SEP' ? 'SEP meeting · projections released' : 'Regular meeting'}>
          {drillMtg && (
            <div className="p-2 space-y-2">
              <div className="grid grid-cols-3 gap-1">
                <Kpi label="Decision" value={drillMtg.decisionBps == null ? 'PENDING' : drillMtg.decisionBps === 0 ? 'HOLD' : `${drillMtg.decisionBps > 0 ? '+' : ''}${drillMtg.decisionBps}bp`} tone={(drillMtg.decisionBps ?? 0) < 0 ? 'pos' : (drillMtg.decisionBps ?? 0) > 0 ? 'neg' : 'neu'} />
                <Kpi label="Rate After" value={drillMtg.rateAfter != null ? `${drillMtg.rateAfter.toFixed(2)}%` : '—'} tone="accent" />
                <Kpi label="Vote" value={drillMtg.voteFor != null ? `${drillMtg.voteFor}-${drillMtg.voteAgainst}` : '—'} />
              </div>
              {drillMtg.statementUrl && <a href={drillMtg.statementUrl} target="_blank" rel="noreferrer" className="block border border-border bg-surface-deep p-2 text-[11px] font-mono text-accent hover:bg-surface-elevated">📄 Open Statement →</a>}
              {drillMtg.minutesUrl && <a href={drillMtg.minutesUrl} target="_blank" rel="noreferrer" className="block border border-border bg-surface-deep p-2 text-[11px] font-mono text-accent hover:bg-surface-elevated">📄 Open Minutes →</a>}
              <div className="border border-border bg-surface-deep p-2 text-[10px] font-mono text-muted-foreground italic">
                {drillMtg.type === 'SEP' ? 'SEP meetings publish updated Summary of Economic Projections and the dot plot.' : 'Regular meeting — statement + press conference only.'}
              </div>
            </div>
          )}
        </CmdDrawer>
      </div>
    </CmdShell>
  );
}
