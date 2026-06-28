// JOLTS — Job Openings and Labor Turnover Survey deep-dive. Single-page Bloomberg layout.
import { useState, useEffect, useMemo } from 'react';
import { useFRED } from '@/hooks/useFRED';
import { useEconCalendar } from '@/hooks/useEconCalendar';
import { apiGet } from '@/lib/api';
import {
  LineChart, Line, BarChart, Bar, Cell, XAxis, YAxis, Tooltip, ResponsiveContainer, ReferenceLine, CartesianGrid,
} from 'recharts';
import CmdShell from './_shell/CmdShell';

type HistObs = { date: string; value: number | null };

const TOOLTIP_STYLE = {
  background: 'hsl(var(--surface-deep))',
  border: '1px solid hsl(var(--border))',
  fontSize: 10,
  fontFamily: 'monospace',
  color: 'hsl(var(--foreground))',
};

type FlowStatus = 'TIGHT' | 'NORMAL' | 'SLACK';

function joltsStatus(key: string, val?: number | null): { label: FlowStatus; tone: string } {
  if (val == null) return { label: 'NORMAL', tone: 'text-muted-foreground' };
  if (key === 'openings') {
    if (val >= 8000) return { label: 'TIGHT', tone: 'text-positive' };
    if (val <= 5500) return { label: 'SLACK', tone: 'text-negative' };
    return { label: 'NORMAL', tone: 'text-accent' };
  }
  if (key === 'hires') {
    if (val >= 5500) return { label: 'TIGHT', tone: 'text-positive' };
    if (val <= 4000) return { label: 'SLACK', tone: 'text-negative' };
    return { label: 'NORMAL', tone: 'text-accent' };
  }
  if (key === 'quits') {
    if (val >= 3.0) return { label: 'TIGHT', tone: 'text-positive' };
    if (val <= 1.8) return { label: 'SLACK', tone: 'text-negative' };
    return { label: 'NORMAL', tone: 'text-accent' };
  }
  if (key === 'layoffs') {
    if (val <= 1.0) return { label: 'TIGHT', tone: 'text-positive' };
    if (val >= 1.8) return { label: 'SLACK', tone: 'text-negative' };
    return { label: 'NORMAL', tone: 'text-accent' };
  }
  if (key === 'tightness') {
    if (val >= 1.8) return { label: 'TIGHT', tone: 'text-positive' };
    if (val <= 1.0) return { label: 'SLACK', tone: 'text-negative' };
    return { label: 'NORMAL', tone: 'text-accent' };
  }
  return { label: 'NORMAL', tone: 'text-accent' };
}

export default function JOLTS() {
  const [histOpenings, setHistOpenings] = useState<HistObs[]>([]);
  const [histHires,    setHistHires]    = useState<HistObs[]>([]);
  const [histQuits,    setHistQuits]    = useState<HistObs[]>([]);
  const [histUnemp,    setHistUnemp]    = useState<HistObs[]>([]);
  const { byKey } = useFRED();
  const { events } = useEconCalendar();

  const openingsKpi = byKey['job_openings'];
  const layoffsKpi  = byKey['jolts_layoffs'];

  useEffect(() => {
    apiGet<{ observations: HistObs[] }>('/api/market/macro/fred-history?series=JTSJOL&limit=60')
      .then(d => setHistOpenings([...(d.observations ?? [])].reverse()))
      .catch(() => {});
    apiGet<{ observations: HistObs[] }>('/api/market/macro/fred-history?series=JTSHIR&limit=60')
      .then(d => setHistHires([...(d.observations ?? [])].reverse()))
      .catch(() => {});
    apiGet<{ observations: HistObs[] }>('/api/market/macro/fred-history?series=JTSQUR&limit=60')
      .then(d => setHistQuits([...(d.observations ?? [])].reverse()))
      .catch(() => {});
    apiGet<{ observations: HistObs[] }>('/api/market/macro/fred-history?series=UNEMPLOY&limit=60')
      .then(d => setHistUnemp([...(d.observations ?? [])].reverse()))
      .catch(() => {});
  }, []);

  const openingsData12m = useMemo(() => histOpenings.slice(-12).map(o => ({
    date: o.date.slice(0, 7), openings: o.value != null ? +(o.value / 1000).toFixed(0) : null,
  })), [histOpenings]);

  const chart60m = useMemo(() => {
    const maxLen = Math.min(histOpenings.length, histHires.length);
    return histOpenings.slice(-60).map((o, idx) => {
      const hObs = histHires[histHires.length - 60 + idx];
      const uObs = histUnemp[histUnemp.length - 60 + idx];
      const tightness = o.value != null && uObs?.value && uObs.value > 0
        ? +((o.value / 1000) / (uObs.value / 1000)).toFixed(2) : null;
      return {
        date: o.date.slice(0, 7),
        openings: o.value != null ? +(o.value / 1000).toFixed(0) : null,
        hires:    hObs?.value != null ? +(hObs.value / 1000).toFixed(0) : null,
        tightness,
      };
    });
  }, [histOpenings, histHires, histUnemp]);

  const latestOpenings = histOpenings[histOpenings.length - 1]?.value;
  const latestHires    = histHires[histHires.length - 1]?.value;
  const latestQuits    = histQuits[histQuits.length - 1]?.value;
  const latestUnemp    = histUnemp[histUnemp.length - 1]?.value;
  const tightness      = latestOpenings != null && latestUnemp != null && latestUnemp > 0
    ? +((latestOpenings / latestUnemp)).toFixed(2) : null;

  const joltsCalendar = events.filter(e => e.kind === 'econ' && e.label.toUpperCase().includes('JOLTS')).sort((a, b) => a.ts.localeCompare(b.ts));
  const upcoming = joltsCalendar.filter(e => new Date(e.ts) > new Date()).slice(0, 4);
  const past     = joltsCalendar.filter(e => new Date(e.ts) <= new Date()).slice(-6).reverse();

  function fmtK(v?: number | null) { return v != null ? `${(v / 1000).toFixed(1)}M` : '—'; }
  function fmtPct(v?: number | null) { return v != null ? `${v.toFixed(1)}%` : '—'; }
  function fmtRatio(v?: number | null) { return v != null ? `${v.toFixed(2)}x` : '—'; }

  const FLOWS = [
    { key: 'openings', label: 'Job Openings', value: latestOpenings, prev: openingsKpi?.prev,  display: fmtK(latestOpenings),   desc: 'Unfilled positions; demand for labor' },
    { key: 'hires',    label: 'Hires (Total)', value: latestHires,   prev: null,                display: fmtK(latestHires),      desc: 'New hires added to payroll this month' },
    { key: 'quits',    label: 'Quit Rate',     value: latestQuits,   prev: null,                display: fmtPct(latestQuits),    desc: '≥3%: workers confident in finding new jobs' },
    { key: 'layoffs',  label: 'Layoffs Rate',  value: layoffsKpi?.value, prev: layoffsKpi?.prev, display: fmtPct(layoffsKpi?.value), desc: 'Involuntary separations — low = stable labor market' },
    { key: 'tightness', label: 'Tightness Ratio', value: tightness, prev: null,                display: fmtRatio(tightness),    desc: 'Openings ÷ Unemployed — >1 = more jobs than seekers' },
  ];

  return (
    <CmdShell
      code="JOLTS" title="Job Openings & Labor Turnover — Demand vs Supply"
      kpis={
        <div className="grid grid-cols-5 gap-[1px] bg-border">
          <Kpi label="JOB OPENINGS"   value={fmtK(latestOpenings)}       sub={`Prior ${fmtK(openingsKpi?.prev == null ? null : openingsKpi.prev * 1000)}`}    tone={(latestOpenings ?? 0) >= 7000 ? 'text-positive' : 'text-negative'} />
          <Kpi label="HIRES"          value={fmtK(latestHires)}           sub="Total new hires"              tone="text-foreground" />
          <Kpi label="QUIT RATE"      value={fmtPct(latestQuits)}         sub="High = confident workers"     tone={(latestQuits ?? 0) >= 2.5 ? 'text-positive' : 'text-negative'} />
          <Kpi label="LAYOFFS RATE"   value={fmtPct(layoffsKpi?.value)}   sub={`Prior ${fmtPct(layoffsKpi?.prev)}`} tone={(layoffsKpi?.value ?? 2) <= 1.2 ? 'text-positive' : 'text-negative'} />
          <Kpi label="TIGHTNESS"      value={fmtRatio(tightness)}         sub="Openings / Unemployed"        tone={(tightness ?? 0) >= 1.5 ? 'text-positive' : (tightness ?? 0) >= 1.0 ? 'text-accent' : 'text-negative'} />
        </div>
      }
      footerLeft="Source: BLS · FRED JTSJOL / JTSHIR / JTSQUR / JTSLAY · Monthly ~6-week lag"
      footerRight={`Openings as of ${histOpenings[histOpenings.length - 1]?.date?.slice(0, 7) ?? '—'}`}
    >
      <div className="h-full overflow-y-auto">

        {/* Row 1: 12M openings bar + flows table */}
        <div className="grid grid-cols-[55%_45%] gap-[1px] bg-border border-b border-border">
          <div className="p-3 bg-surface-deep flex flex-col gap-1">
            <div className="text-[9px] font-mono uppercase text-muted-foreground tracking-wider">JOB OPENINGS — LAST 12 MONTHS (JTSJOL, THOUSANDS)</div>
            <div className="h-52">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={openingsData12m} margin={{ top: 4, right: 16, left: 0, bottom: 0 }}>
                  <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border)/0.4)" vertical={false} />
                  <XAxis dataKey="date" tick={{ fill: 'hsl(var(--muted-foreground))', fontSize: 8, fontFamily: 'monospace' }} axisLine={false} tickLine={false} />
                  <YAxis tick={{ fill: 'hsl(var(--muted-foreground))', fontSize: 8, fontFamily: 'monospace' }} axisLine={false} tickLine={false} tickFormatter={v => `${v}k`} />
                  <Tooltip contentStyle={TOOLTIP_STYLE} formatter={(v: number) => [`${v}k`, 'Job Openings']} />
                  <ReferenceLine y={7200} stroke="hsl(var(--accent)/0.5)" strokeDasharray="4 3" strokeWidth={1} label={{ value: '7.2M pre-pandemic', fill: 'hsl(var(--accent))', fontSize: 8, position: 'insideTopLeft' }} />
                  <Bar dataKey="openings" fill="hsl(var(--accent)/0.65)" maxBarSize={32} name="Openings (k)" />
                </BarChart>
              </ResponsiveContainer>
            </div>
          </div>

          <div className="bg-surface-deep flex flex-col">
            <div className="px-3 pt-3 pb-1 text-[9px] font-mono uppercase text-muted-foreground tracking-wider">JOLTS FLOW INDICATORS · LABOR MARKET STATUS</div>
            <div className="flex-1 overflow-y-auto border border-border mx-3 mb-3">
              {FLOWS.map(f => {
                const { label: statusLabel, tone: statusTone } = joltsStatus(f.key, f.value);
                return (
                  <div key={f.key} className="px-3 py-2.5 border-b border-border/40 hover:bg-surface-elevated">
                    <div className="flex items-center justify-between mb-0.5">
                      <span className="text-[10px] font-mono font-bold text-foreground">{f.label}</span>
                      <div className="flex items-center gap-2">
                        <span className={`text-[8px] font-mono px-1.5 py-0.5 border ${statusTone} border-current/30`}>{statusLabel}</span>
                        <span className={`text-[15px] font-mono font-bold tabular-nums ${statusTone}`}>{f.display}</span>
                      </div>
                    </div>
                    <div className="text-[7.5px] font-mono text-muted-foreground/55">{f.desc}</div>
                  </div>
                );
              })}
            </div>
          </div>
        </div>

        {/* Row 2: 60M openings line + hires vs openings dual */}
        <div className="grid grid-cols-[55%_45%] gap-[1px] bg-border border-b border-border">
          <div className="p-3 bg-surface-deep flex flex-col gap-1">
            <div className="text-[9px] font-mono uppercase text-muted-foreground tracking-wider">60-MONTH OPENINGS TREND (THOUSANDS)</div>
            <div className="h-44">
              <ResponsiveContainer width="100%" height="100%">
                <LineChart data={chart60m} margin={{ top: 4, right: 16, left: 0, bottom: 0 }}>
                  <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border)/0.4)" vertical={false} />
                  <XAxis dataKey="date" tick={{ fill: 'hsl(var(--muted-foreground))', fontSize: 7, fontFamily: 'monospace' }} axisLine={false} tickLine={false} interval={5} />
                  <YAxis tick={{ fill: 'hsl(var(--muted-foreground))', fontSize: 8, fontFamily: 'monospace' }} axisLine={false} tickLine={false} tickFormatter={v => `${v}k`} />
                  <Tooltip contentStyle={TOOLTIP_STYLE} formatter={(v: number) => [`${v}k`, 'Openings']} />
                  <Line dataKey="openings" stroke="hsl(var(--accent))" strokeWidth={2} dot={false} name="Openings (k)" />
                </LineChart>
              </ResponsiveContainer>
            </div>
          </div>

          <div className="p-3 bg-surface-deep flex flex-col gap-1">
            <div className="text-[9px] font-mono uppercase text-muted-foreground tracking-wider">60M HIRES vs OPENINGS — GAP = FILLING DIFFICULTY</div>
            <div className="h-44">
              <ResponsiveContainer width="100%" height="100%">
                <LineChart data={chart60m} margin={{ top: 4, right: 16, left: 0, bottom: 0 }}>
                  <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border)/0.4)" vertical={false} />
                  <XAxis dataKey="date" tick={{ fill: 'hsl(var(--muted-foreground))', fontSize: 7, fontFamily: 'monospace' }} axisLine={false} tickLine={false} interval={5} />
                  <YAxis tick={{ fill: 'hsl(var(--muted-foreground))', fontSize: 8, fontFamily: 'monospace' }} axisLine={false} tickLine={false} tickFormatter={v => `${v}k`} />
                  <Tooltip contentStyle={TOOLTIP_STYLE} formatter={(v: number, name: string) => [`${v}k`, name]} />
                  <Line dataKey="openings" stroke="hsl(var(--accent))"              strokeWidth={2} dot={false} name="Openings (k)" />
                  <Line dataKey="hires"    stroke="hsl(var(--positive)/0.8)"        strokeWidth={1.5} dot={false} name="Hires (k)" strokeDasharray="4 3" />
                </LineChart>
              </ResponsiveContainer>
            </div>
            <div className="flex gap-4 text-[7px] font-mono text-muted-foreground/60 justify-end mt-1">
              <span className="flex items-center gap-1"><span className="w-3 h-0.5 bg-accent inline-block" />Openings</span>
              <span className="flex items-center gap-1"><span className="w-3 h-0.5 bg-positive inline-block opacity-80" />Hires</span>
            </div>
            <div className="text-[7px] font-mono text-muted-foreground/40 italic">Gap ↑ = harder to fill positions (tight labor mkt). Gap ↓ = easier hiring (slack mkt).</div>
          </div>
        </div>

        {/* Row 3: Calendar footer */}
        <div className="grid grid-cols-2 gap-[1px] bg-border">
          <div className="p-3 bg-surface-deep">
            <div className="text-[9px] font-mono uppercase text-accent tracking-wider mb-1.5">UPCOMING JOLTS RELEASES</div>
            <div className="border border-border">
              {upcoming.length > 0 ? upcoming.map(e => (
                <div key={e.id} className="flex items-center gap-2 px-2 py-1.5 border-b border-border/40 hover:bg-surface-elevated">
                  <span className="text-[10px] font-mono text-accent w-22 shrink-0">{new Date(e.ts).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })}</span>
                  <span className="text-[9px] font-mono text-foreground flex-1 truncate">{e.label}</span>
                </div>
              )) : (
                <div className="px-3 py-2 text-[9px] font-mono text-muted-foreground italic">No upcoming JOLTS releases loaded</div>
              )}
            </div>
          </div>
          <div className="p-3 bg-surface-deep">
            <div className="text-[9px] font-mono uppercase text-muted-foreground tracking-wider mb-1.5">RECENT RELEASES · BEAT / MISS</div>
            <div className="border border-border">
              {past.length > 0 ? past.map(e => {
                const surprise = e.actual != null && e.forecast != null ? e.actual - e.forecast : null;
                return (
                  <div key={e.id} className="flex items-center gap-2 px-2 py-1.5 border-b border-border/40 hover:bg-surface-elevated">
                    <span className="text-[9px] font-mono text-muted-foreground shrink-0">{new Date(e.ts).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: '2-digit' })}</span>
                    <span className="text-[9px] font-mono text-foreground flex-1 truncate">{e.label}</span>
                    {e.actual   != null && <span className="text-[9px] font-mono font-bold text-foreground tabular-nums shrink-0">A: {e.actual}</span>}
                    {e.forecast != null && <span className="text-[8px] font-mono text-muted-foreground tabular-nums shrink-0">E: {e.forecast}</span>}
                    {surprise   != null && <span className={`text-[9px] font-mono font-bold tabular-nums shrink-0 ${surprise > 0 ? 'text-positive' : 'text-negative'}`}>{surprise > 0 ? '+' : ''}{surprise.toFixed(0)}k</span>}
                  </div>
                );
              }) : (
                <div className="px-3 py-2 text-[9px] font-mono text-muted-foreground italic">No past JOLTS releases loaded</div>
              )}
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
