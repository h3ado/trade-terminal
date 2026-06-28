// NFP — Non-Farm Payrolls deep-dive. Single-page Bloomberg layout.
import { useState, useEffect, useMemo } from 'react';
import { useFRED } from '@/hooks/useFRED';
import { useEconCalendar } from '@/hooks/useEconCalendar';
import { apiGet } from '@/lib/api';
import {
  LineChart, Line, BarChart, Bar, Cell, XAxis, YAxis, Tooltip, ResponsiveContainer, ReferenceLine, CartesianGrid,
} from 'recharts';
import CmdShell from './_shell/CmdShell';

type HistObs = { date: string; value: number | null };

function toMoM(obs: HistObs[]): Array<{ date: string; delta: number | null }> {
  return obs.slice(1).map((o, i) => ({
    date: o.date.slice(0, 7),
    delta: o.value != null && obs[i]?.value != null ? Math.round(o.value - obs[i].value) : null,
  }));
}

function toYoY(obs: HistObs[]): Array<{ date: string; yoy: number | null }> {
  return obs.slice(12).map((o, i) => ({
    date: o.date.slice(0, 7),
    yoy: o.value != null && obs[i]?.value ? +((o.value / obs[i].value - 1) * 100).toFixed(2) : null,
  }));
}

const TOOLTIP_STYLE = {
  background: 'hsl(var(--surface-deep))',
  border: '1px solid hsl(var(--border))',
  fontSize: 10,
  fontFamily: 'monospace',
  color: 'hsl(var(--foreground))',
};

export default function NFP() {
  const [histPayems, setHistPayems] = useState<HistObs[]>([]);
  const [histWages,  setHistWages]  = useState<HistObs[]>([]);
  const { byKey } = useFRED();
  const { events } = useEconCalendar();

  const wages = byKey['avg_hourly_earn'];

  useEffect(() => {
    apiGet<{ observations: HistObs[] }>('/api/market/macro/fred-history?series=PAYEMS&limit=73')
      .then(d => setHistPayems([...(d.observations ?? [])].reverse()))
      .catch(() => {});
    apiGet<{ observations: HistObs[] }>('/api/market/macro/fred-history?series=CES0500000003&limit=72')
      .then(d => setHistWages([...(d.observations ?? [])].reverse()))
      .catch(() => {});
  }, []);

  const momData  = useMemo(() => toMoM(histPayems), [histPayems]);
  const wagesYoY = useMemo(() => toYoY(histWages),  [histWages]);

  const avg3m  = momData.length >= 3  ? Math.round(momData.slice(-3).reduce((s, d) => s + (d.delta ?? 0), 0) / 3)  : null;
  const avg12m = momData.length >= 12 ? Math.round(momData.slice(-12).reduce((s, d) => s + (d.delta ?? 0), 0) / 12) : null;
  const latestNfp = momData.length > 0 ? momData[momData.length - 1].delta : null;

  const pace =
    avg3m == null || avg12m == null ? null
    : avg3m > avg12m * 1.15 ? 'ACCELERATING'
    : avg3m < avg12m * 0.85 ? 'COOLING'
    : 'STABLE';
  const paceColor =
    pace === 'ACCELERATING' ? 'text-positive' : pace === 'COOLING' ? 'text-negative' : 'text-muted-foreground';

  const wagePressure = (wages?.value ?? 0) > 4 ? 'ELEVATED' : 'CONTAINED';
  const wageColor    = wagePressure === 'ELEVATED' ? 'text-negative' : 'text-positive';

  const nfpCalendar = events.filter(e =>
    e.kind === 'econ' && (e.label.toUpperCase().includes('PAYROLL') || e.label.toUpperCase().includes('EMPLOYMENT SITUATION') || e.label.toUpperCase().includes('NFP'))
  ).sort((a, b) => a.ts.localeCompare(b.ts));
  const upcoming = nfpCalendar.filter(e => new Date(e.ts) > new Date()).slice(0, 3);
  const past     = nfpCalendar.filter(e => new Date(e.ts) <= new Date()).slice(-6).reverse();

  function fmtK(v?: number | null) { return v != null ? `${v > 0 ? '+' : ''}${v.toLocaleString()}k` : '—'; }
  function fmtPct(v?: number | null) { return v != null ? `${v.toFixed(2)}%` : '—'; }

  return (
    <CmdShell
      code="NFP" title="Non-Farm Payrolls — Employment Situation"
      kpis={
        <div className="grid grid-cols-4 gap-[1px] bg-border">
          <Kpi label="LATEST NFP Δ"    value={fmtK(latestNfp)}  sub={`Prior: ${fmtK(momData.length > 1 ? momData[momData.length - 2].delta : null)}`} tone={(latestNfp ?? 0) >= 0 ? 'text-positive' : 'text-negative'} />
          <Kpi label="3-MONTH AVG"     value={avg3m != null ? fmtK(avg3m) : '—'}  sub="Rolling 3-month avg"  tone="text-foreground" />
          <Kpi label="12-MONTH AVG"    value={avg12m != null ? fmtK(avg12m) : '—'} sub="Annual run rate"     tone="text-foreground" />
          <Kpi label="AVG HLY EARN YoY" value={fmtPct(wages?.value)} sub={`Prior ${fmtPct(wages?.prev)}`}   tone="text-foreground" />
        </div>
      }
      footerLeft="Source: BLS · FRED PAYEMS / CES0500000003 · Monthly"
      footerRight="Released first Friday of the month for prior month"
    >
      <div className="h-full overflow-y-auto">

        {/* Row 1: 12M bar chart + regime panel */}
        <div className="grid grid-cols-[55%_45%] gap-[1px] bg-border border-b border-border">
          <div className="p-3 bg-surface-deep flex flex-col gap-1">
            <div className="text-[9px] font-mono uppercase text-muted-foreground tracking-wider">MONTHLY JOB CHANGE (000s) — LAST 12 MONTHS</div>
            <div className="h-52">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={momData.slice(-12)} margin={{ top: 4, right: 16, left: 0, bottom: 0 }}>
                  <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border)/0.4)" vertical={false} />
                  <XAxis dataKey="date" tick={{ fill: 'hsl(var(--muted-foreground))', fontSize: 8, fontFamily: 'monospace' }} axisLine={false} tickLine={false} />
                  <YAxis tick={{ fill: 'hsl(var(--muted-foreground))', fontSize: 8, fontFamily: 'monospace' }} axisLine={false} tickLine={false} tickFormatter={v => `${v}k`} />
                  <Tooltip contentStyle={TOOLTIP_STYLE} formatter={(v: number) => [`${v > 0 ? '+' : ''}${v}k`, 'NFP Δ']} />
                  <ReferenceLine y={0} stroke="hsl(var(--border))" strokeWidth={1} />
                  {avg3m != null && <ReferenceLine y={avg3m} stroke="hsl(var(--accent))" strokeDasharray="4 3" strokeWidth={1} label={{ value: `3m avg ${avg3m}k`, fill: 'hsl(var(--accent))', fontSize: 8, fontFamily: 'monospace' }} />}
                  <Bar dataKey="delta" maxBarSize={28} name="NFP Δ">
                    {momData.slice(-12).map((d, i) => (
                      <Cell key={i} fill={(d.delta ?? 0) >= 0 ? 'hsl(var(--positive)/0.7)' : 'hsl(var(--negative)/0.7)'} />
                    ))}
                  </Bar>
                </BarChart>
              </ResponsiveContainer>
            </div>
          </div>

          <div className="bg-surface-deep flex flex-col divide-y divide-border/40">
            <div className="px-3 pt-3 pb-1 text-[9px] font-mono uppercase text-muted-foreground tracking-wider">EMPLOYMENT REGIME ANALYSIS</div>

            <div className="px-3 py-2.5 space-y-2">
              <div className="text-[8px] font-mono text-muted-foreground/60 uppercase">Average Payrolls</div>
              <RegimeRow label="3-Month Average"  value={fmtK(avg3m)}  sub="Recent trend"    />
              <RegimeRow label="12-Month Average" value={fmtK(avg12m)} sub="Annual run rate" />
              <RegimeRow label="vs 12M Average"   value={avg3m != null && avg12m != null ? `${avg3m > avg12m ? '+' : ''}${(avg3m - avg12m).toLocaleString()}k` : '—'} sub="3M vs 12M gap" />
            </div>

            <div className="px-3 py-2.5">
              <div className="text-[8px] font-mono text-muted-foreground/60 uppercase mb-2">Pace Signal</div>
              <div className="flex items-center justify-between">
                <div>
                  <div className="text-[10px] font-mono text-foreground">Job Growth Momentum</div>
                  <div className="text-[7px] font-mono text-muted-foreground/50">3M vs 12M avg ±15% threshold</div>
                </div>
                <span className={`text-[15px] font-mono font-bold ${paceColor}`}>{pace ?? '—'}</span>
              </div>
            </div>

            <div className="px-3 py-2.5">
              <div className="text-[8px] font-mono text-muted-foreground/60 uppercase mb-2">Wage Pressure</div>
              <div className="flex items-center justify-between">
                <div>
                  <div className="text-[10px] font-mono text-foreground">Avg Hourly Earnings YoY</div>
                  <div className="text-[7px] font-mono text-muted-foreground/50">&gt;4% = potential inflationary</div>
                </div>
                <div className="text-right">
                  <div className={`text-[18px] font-mono font-bold tabular-nums ${wageColor}`}>{fmtPct(wages?.value)}</div>
                  <div className={`text-[8px] font-mono font-bold ${wageColor}`}>{wagePressure}</div>
                </div>
              </div>
            </div>

            <div className="px-3 py-2 text-[7.5px] font-mono text-muted-foreground/50 flex-1 leading-relaxed">
              Breakeven job growth ≈ 100-150k/mo to absorb new entrants. Below = labor market loosening. Above 250k+ = tight. Wages above 4% with jobs above 200k = stagflation risk.
            </div>
          </div>
        </div>

        {/* Row 2: 60M history + wages chart */}
        <div className="grid grid-cols-[55%_45%] gap-[1px] bg-border border-b border-border">
          <div className="p-3 bg-surface-deep flex flex-col gap-1">
            <div className="text-[9px] font-mono uppercase text-muted-foreground tracking-wider">60-MONTH HISTORY · MONTHLY JOB CHANGE</div>
            <div className="h-44">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={momData.slice(-60)} margin={{ top: 4, right: 16, left: 0, bottom: 0 }}>
                  <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border)/0.4)" vertical={false} />
                  <XAxis dataKey="date" tick={{ fill: 'hsl(var(--muted-foreground))', fontSize: 7, fontFamily: 'monospace' }} axisLine={false} tickLine={false} interval={5} />
                  <YAxis tick={{ fill: 'hsl(var(--muted-foreground))', fontSize: 8, fontFamily: 'monospace' }} axisLine={false} tickLine={false} tickFormatter={v => `${v}k`} />
                  <Tooltip contentStyle={TOOLTIP_STYLE} formatter={(v: number) => [`${v > 0 ? '+' : ''}${v}k`, 'NFP Δ']} />
                  <ReferenceLine y={0} stroke="hsl(var(--border))" strokeWidth={1} />
                  <Bar dataKey="delta" maxBarSize={10} name="NFP Δ">
                    {momData.slice(-60).map((d, i) => (
                      <Cell key={i} fill={(d.delta ?? 0) >= 0 ? 'hsl(var(--positive)/0.65)' : 'hsl(var(--negative)/0.65)'} />
                    ))}
                  </Bar>
                </BarChart>
              </ResponsiveContainer>
            </div>
          </div>

          <div className="p-3 bg-surface-deep flex flex-col gap-1">
            <div className="text-[9px] font-mono uppercase text-muted-foreground tracking-wider">AVERAGE HOURLY EARNINGS YoY — 60 MONTHS</div>
            <div className="grid grid-cols-2 gap-[1px] bg-border mb-2 shrink-0">
              <div className="bg-surface-deep px-3 py-1.5">
                <div className="text-[8px] font-mono uppercase text-muted-foreground">AHE YoY</div>
                <div className={`text-[18px] font-mono font-bold tabular-nums ${wageColor}`}>{fmtPct(wages?.value)}</div>
              </div>
              <div className="bg-surface-deep px-3 py-1.5">
                <div className="text-[8px] font-mono uppercase text-muted-foreground">Prior</div>
                <div className="text-[18px] font-mono font-bold tabular-nums text-foreground">{fmtPct(wages?.prev)}</div>
              </div>
            </div>
            <div className="flex-1 min-h-0 h-28">
              <ResponsiveContainer width="100%" height="100%">
                <LineChart data={wagesYoY} margin={{ top: 4, right: 8, left: 0, bottom: 0 }}>
                  <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border)/0.4)" />
                  <XAxis dataKey="date" tick={{ fill: 'hsl(var(--muted-foreground))', fontSize: 7, fontFamily: 'monospace' }} axisLine={false} tickLine={false} interval={5} />
                  <YAxis tick={{ fill: 'hsl(var(--muted-foreground))', fontSize: 8, fontFamily: 'monospace' }} axisLine={false} tickLine={false} tickFormatter={v => `${v}%`} />
                  <Tooltip contentStyle={TOOLTIP_STYLE} formatter={(v: number) => [`${v?.toFixed(2)}%`, 'AHE YoY']} />
                  <ReferenceLine y={4} stroke="hsl(var(--negative)/0.5)" strokeDasharray="4 3" strokeWidth={1} label={{ value: '4%', fill: 'hsl(var(--negative))', fontSize: 8 }} />
                  <Line type="monotone" dataKey="yoy" stroke="hsl(var(--accent))" strokeWidth={1.5} dot={false} name="AHE YoY" />
                </LineChart>
              </ResponsiveContainer>
            </div>
          </div>
        </div>

        {/* Row 3: Calendar */}
        <div className="grid grid-cols-2 gap-[1px] bg-border">
          <div className="p-3 bg-surface-deep">
            <div className="text-[9px] font-mono uppercase text-accent tracking-wider mb-1.5">UPCOMING NFP RELEASES</div>
            <div className="border border-border">
              {upcoming.map(e => (
                <div key={e.id} className="flex items-center gap-2 px-2 py-1.5 border-b border-border/40 hover:bg-surface-elevated">
                  <span className="text-[10px] font-mono text-accent w-20 shrink-0">{new Date(e.ts).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })}</span>
                  <span className="text-[9px] font-mono text-foreground flex-1 truncate">{e.label}</span>
                  {e.forecast != null && <span className="text-[8px] font-mono text-muted-foreground shrink-0">E: {e.forecast}k</span>}
                </div>
              ))}
              {upcoming.length === 0 && <div className="px-2 py-2 text-[9px] font-mono text-muted-foreground italic">No upcoming NFP releases loaded</div>}
            </div>
            <div className="text-[7px] font-mono text-muted-foreground/50 mt-1.5 italic">BLS Employment Situation: first Friday of the month</div>
          </div>
          <div className="p-3 bg-surface-deep">
            <div className="text-[9px] font-mono uppercase text-muted-foreground tracking-wider mb-1.5">RECENT RELEASES · BEAT / MISS</div>
            <div className="border border-border">
              {past.map(e => {
                const surprise = e.actual != null && e.forecast != null ? e.actual - e.forecast : null;
                return (
                  <div key={e.id} className="flex items-center gap-2 px-2 py-1.5 border-b border-border/40 hover:bg-surface-elevated">
                    <span className="text-[9px] font-mono text-muted-foreground w-20 shrink-0">{new Date(e.ts).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })}</span>
                    <span className="text-[9px] font-mono text-foreground flex-1 truncate">{e.label}</span>
                    {e.actual   != null && <span className="text-[9px] font-mono font-bold text-foreground tabular-nums shrink-0">A: {e.actual}k</span>}
                    {e.forecast != null && <span className="text-[8px] font-mono text-muted-foreground tabular-nums shrink-0">E: {e.forecast}k</span>}
                    {surprise   != null && <span className={`text-[9px] font-mono font-bold tabular-nums shrink-0 ${surprise > 0 ? 'text-positive' : 'text-negative'}`}>{surprise > 0 ? '+' : ''}{Math.round(surprise)}k</span>}
                  </div>
                );
              })}
              {past.length === 0 && <div className="px-2 py-2 text-[9px] font-mono text-muted-foreground italic">No historical releases loaded</div>}
            </div>
          </div>
        </div>
      </div>
    </CmdShell>
  );
}

function Kpi({ label, value, sub, tone }: { label: string; value: string; sub: string; tone: string }) {
  return (
    <div className="bg-surface-deep px-3 py-1.5">
      <div className="text-[8px] font-mono uppercase text-muted-foreground tracking-wider">{label}</div>
      <div className={`text-xl font-mono font-bold tabular-nums leading-tight ${tone}`}>{value}</div>
      <div className="text-[9px] font-mono text-muted-foreground/60">{sub}</div>
    </div>
  );
}

function RegimeRow({ label, value, sub }: { label: string; value: string; sub: string }) {
  return (
    <div className="flex items-center justify-between gap-2">
      <div className="min-w-0">
        <div className="text-[10px] font-mono text-foreground truncate">{label}</div>
        <div className="text-[7px] font-mono text-muted-foreground/50">{sub}</div>
      </div>
      <span className="text-[12px] font-mono font-bold tabular-nums text-foreground shrink-0">{value}</span>
    </div>
  );
}
