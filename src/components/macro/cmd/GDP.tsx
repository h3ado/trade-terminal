// GDP — Gross Domestic Product deep-dive. Single-page Bloomberg layout.
import { useState, useEffect, useMemo } from 'react';
import { useFRED } from '@/hooks/useFRED';
import { useEconCalendar } from '@/hooks/useEconCalendar';
import { apiGet } from '@/lib/api';
import {
  BarChart, Bar, Cell, XAxis, YAxis, Tooltip, ResponsiveContainer, ReferenceLine, CartesianGrid,
} from 'recharts';
import CmdShell from './_shell/CmdShell';

type HistObs = { date: string; value: number | null };

function toQoQAnn(obs: HistObs[]): Array<{ date: string; qoq: number | null }> {
  return obs.slice(1).map((o, i) => ({
    date: o.date.slice(0, 7),
    qoq: o.value != null && obs[i]?.value && obs[i].value > 0
      ? +(((o.value / obs[i].value) ** 4 - 1) * 100).toFixed(2)
      : null,
  }));
}

const GDP_COMPONENTS = [
  { name: 'Personal Consumption',      share: 68.4, description: 'Largest component — durables, non-durables, services' },
  { name: 'Gross Private Investment',  share: 17.5, description: 'Fixed investment + inventories; leads the cycle' },
  { name: 'Govt Expenditure',          share: 17.0, description: 'Federal + state/local; excludes transfers' },
  { name: 'Net Exports (X−M)',         share: -2.9, description: 'Trade deficit typically a drag on US GDP' },
];

const TOOLTIP_STYLE = {
  background: 'hsl(var(--surface-deep))',
  border: '1px solid hsl(var(--border))',
  fontSize: 10,
  fontFamily: 'monospace',
  color: 'hsl(var(--foreground))',
};

export default function GDP() {
  const [histGdp, setHistGdp] = useState<HistObs[]>([]);
  const [wbData,  setWbData]  = useState<any>(null);
  const { byKey } = useFRED();
  const { events } = useEconCalendar();

  const gdp       = byKey['gdp_growth'];
  const deflator  = byKey['gdp_deflator'];

  useEffect(() => {
    apiGet<{ observations: HistObs[] }>('/api/market/macro/fred-history?series=GDPC1&limit=42')
      .then(d => setHistGdp([...(d.observations ?? [])].reverse()))
      .catch(() => {});
    apiGet<any>('/api/market/macro/worldbank-indicators')
      .then(d => setWbData(d))
      .catch(() => {});
  }, []);

  const qoqData = useMemo(() => toQoQAnn(histGdp), [histGdp]);

  const avg4q = qoqData.length >= 4
    ? +(qoqData.slice(-4).reduce((s, d) => s + (d.qoq ?? 0), 0) / 4).toFixed(2)
    : null;

  const gdpCalendar = events.filter(e => e.kind === 'econ' && e.label.toUpperCase().includes('GDP')).sort((a, b) => a.ts.localeCompare(b.ts));
  const upcoming = gdpCalendar.filter(e => new Date(e.ts) > new Date()).slice(0, 3);
  const past     = gdpCalendar.filter(e => new Date(e.ts) <= new Date()).slice(-6).reverse();

  const globalGdp: Array<{ country: string; growth: number }> = [];
  if (wbData?.series) {
    const growthSeries = wbData.series.find((s: any) => s.key === 'gdp_growth');
    if (growthSeries?.byIso3) {
      const TOP = [
        { iso3: 'USA', name: 'USA' }, { iso3: 'CHN', name: 'China' },
        { iso3: 'DEU', name: 'Germany' }, { iso3: 'JPN', name: 'Japan' },
        { iso3: 'GBR', name: 'UK' }, { iso3: 'IND', name: 'India' },
        { iso3: 'FRA', name: 'France' }, { iso3: 'CAN', name: 'Canada' },
        { iso3: 'BRA', name: 'Brazil' }, { iso3: 'KOR', name: 'S.Korea' },
      ];
      for (const c of TOP) {
        const row = growthSeries.byIso3[c.iso3];
        if (row?.value != null) globalGdp.push({ country: c.name, growth: row.value });
      }
      globalGdp.sort((a, b) => b.growth - a.growth);
    }
  }

  function fmtQ(v?: number | null) { return v != null ? `${v > 0 ? '+' : ''}${v.toFixed(2)}%` : '—'; }

  const isExpanding = (gdp?.value ?? 0) >= 0;

  return (
    <CmdShell
      code="GDP" title="Gross Domestic Product — Growth Overview"
      kpis={
        <div className="grid grid-cols-4 gap-[1px] bg-border">
          <Kpi label="REAL GDP QoQ Ann." value={fmtQ(gdp?.value)}      sub={`Prior ${fmtQ(gdp?.prev)}`}      tone={isExpanding ? 'text-positive' : 'text-negative'} />
          <Kpi label="4Q AVERAGE"        value={fmtQ(avg4q)}            sub="Trailing 4-quarter avg"          tone="text-foreground" />
          <Kpi label="GDP DEFLATOR"      value={fmtQ(deflator?.value)}  sub={`Prior ${fmtQ(deflator?.prev)}`} tone={(deflator?.value ?? 0) > 0 ? 'text-negative' : 'text-positive'} />
          <Kpi label="REGIME"            value={isExpanding ? 'EXPANSION' : 'CONTRACTION'} sub={isExpanding ? 'GDP above zero' : 'Negative growth'} tone={isExpanding ? 'text-positive' : 'text-negative'} />
        </div>
      }
      footerLeft="Source: BEA · FRED GDPC1 / GDPDEF · Quarterly (annualized)"
      footerRight={`Advance estimate ~30 days after quarter end · As of ${gdp?.date?.slice(0, 4) ?? '—'}`}
    >
      <div className="h-full overflow-y-auto">

        {/* Row 1: 8Q bar chart + expenditure components */}
        <div className="grid grid-cols-[55%_45%] gap-[1px] bg-border border-b border-border">
          <div className="p-3 bg-surface-deep flex flex-col gap-1">
            <div className="text-[9px] font-mono uppercase text-muted-foreground tracking-wider">REAL GDP QoQ ANNUALIZED — LAST 8 QUARTERS</div>
            <div className="h-52">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={qoqData.slice(-8)} margin={{ top: 4, right: 16, left: 0, bottom: 0 }}>
                  <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border)/0.4)" vertical={false} />
                  <XAxis dataKey="date" tick={{ fill: 'hsl(var(--muted-foreground))', fontSize: 8, fontFamily: 'monospace' }} axisLine={false} tickLine={false} />
                  <YAxis tick={{ fill: 'hsl(var(--muted-foreground))', fontSize: 8, fontFamily: 'monospace' }} axisLine={false} tickLine={false} tickFormatter={v => `${v}%`} />
                  <Tooltip contentStyle={TOOLTIP_STYLE} formatter={(v: number) => [`${v > 0 ? '+' : ''}${v?.toFixed(2)}%`, 'GDP QoQ Ann.']} />
                  <ReferenceLine y={0} stroke="hsl(var(--border))" strokeWidth={1} />
                  <ReferenceLine y={2} stroke="hsl(var(--accent)/0.4)" strokeDasharray="4 3" strokeWidth={1} label={{ value: '2% trend', fill: 'hsl(var(--accent))', fontSize: 8 }} />
                  <Bar dataKey="qoq" maxBarSize={40} name="GDP QoQ Ann.">
                    {qoqData.slice(-8).map((d, i) => (
                      <Cell key={i} fill={(d.qoq ?? 0) >= 0 ? 'hsl(var(--positive)/0.75)' : 'hsl(var(--negative)/0.75)'} />
                    ))}
                  </Bar>
                </BarChart>
              </ResponsiveContainer>
            </div>
          </div>

          <div className="bg-surface-deep flex flex-col">
            <div className="px-3 pt-3 pb-1 text-[9px] font-mono uppercase text-muted-foreground tracking-wider">EXPENDITURE DECOMPOSITION · GDP = C + I + G + NX</div>
            <div className="flex-1 overflow-y-auto">
              {GDP_COMPONENTS.map(c => (
                <div key={c.name} className="px-3 py-2.5 border-b border-border/30 hover:bg-surface-elevated">
                  <div className="flex items-center justify-between mb-1">
                    <span className="text-[10px] font-mono font-bold text-foreground">{c.name}</span>
                    <span className={`text-[13px] font-mono font-bold tabular-nums ${c.share >= 0 ? 'text-positive' : 'text-negative'}`}>
                      {c.share > 0 ? '+' : ''}{c.share.toFixed(1)}%
                    </span>
                  </div>
                  <div className="flex items-center gap-2 mb-1">
                    <div className="flex-1 h-1.5 bg-surface-deep border border-border/20 relative">
                      {c.share >= 0
                        ? <div className="absolute inset-y-0 left-0 bg-positive/50" style={{ width: `${Math.min(100, c.share)}%` }} />
                        : <div className="absolute inset-y-0 right-0 bg-negative/50" style={{ width: `${Math.min(100, Math.abs(c.share))}%` }} />}
                    </div>
                  </div>
                  <div className="text-[7.5px] font-mono text-muted-foreground/60">{c.description}</div>
                </div>
              ))}
              <div className="px-3 py-1.5 text-[7px] font-mono text-muted-foreground/40 italic">Weights approximate; BEA updates quarterly. GDP = C + I + G + (X−M).</div>
            </div>
          </div>
        </div>

        {/* Row 2: 40Q full history (full width) */}
        <div className="border-b border-border bg-surface-deep p-3">
          <div className="text-[9px] font-mono uppercase text-muted-foreground tracking-wider mb-2">40-QUARTER HISTORY · REAL GDP QoQ ANNUALIZED (~10 YEARS)</div>
          <div className="h-36">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={qoqData} margin={{ top: 4, right: 16, left: 0, bottom: 0 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border)/0.4)" vertical={false} />
                <XAxis dataKey="date" tick={{ fill: 'hsl(var(--muted-foreground))', fontSize: 7, fontFamily: 'monospace' }} axisLine={false} tickLine={false} interval={3} />
                <YAxis tick={{ fill: 'hsl(var(--muted-foreground))', fontSize: 8, fontFamily: 'monospace' }} axisLine={false} tickLine={false} tickFormatter={v => `${v}%`} />
                <Tooltip contentStyle={TOOLTIP_STYLE} formatter={(v: number) => [`${v > 0 ? '+' : ''}${v?.toFixed(2)}%`, 'GDP QoQ Ann.']} />
                <ReferenceLine y={0} stroke="hsl(var(--border))" strokeWidth={1.5} />
                <ReferenceLine y={2} stroke="hsl(var(--accent)/0.35)" strokeDasharray="4 3" strokeWidth={1} />
                <Bar dataKey="qoq" maxBarSize={14} name="GDP QoQ Ann.">
                  {qoqData.map((d, i) => (
                    <Cell key={i} fill={(d.qoq ?? 0) >= 0 ? 'hsl(var(--positive)/0.65)' : 'hsl(var(--negative)/0.65)'} />
                  ))}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Row 3: Global GDP + context/calendar */}
        <div className="grid grid-cols-[55%_45%] gap-[1px] bg-border border-b border-border">
          <div className="p-3 bg-surface-deep">
            <div className="text-[9px] font-mono uppercase text-muted-foreground tracking-wider mb-2">GLOBAL GDP GROWTH · MAJOR ECONOMIES (WORLD BANK)</div>
            {globalGdp.length > 0 ? (
              <div className="border border-border">
                {globalGdp.map(c => (
                  <div key={c.country} className="flex items-center gap-3 px-3 py-1.5 border-b border-border/40 hover:bg-surface-elevated">
                    <span className="text-[10px] font-mono font-bold text-foreground w-16 shrink-0">{c.country}</span>
                    <div className="flex-1 h-3 relative bg-surface-deep border border-border/20 flex">
                      <div className="w-1/2 flex justify-end">
                        {c.growth < 0 && <div className="h-full bg-negative/55" style={{ width: `${Math.min(100, Math.abs(c.growth) * 8)}%` }} />}
                      </div>
                      <div className="w-px bg-border/50" />
                      <div className="w-1/2">
                        {c.growth >= 0 && <div className="h-full bg-positive/55" style={{ width: `${Math.min(100, c.growth * 8)}%` }} />}
                      </div>
                    </div>
                    <span className={`text-[11px] font-mono font-bold tabular-nums w-12 text-right shrink-0 ${c.growth >= 0 ? 'text-positive' : 'text-negative'}`}>
                      {c.growth > 0 ? '+' : ''}{c.growth.toFixed(1)}%
                    </span>
                  </div>
                ))}
              </div>
            ) : (
              <div className="px-3 py-8 text-center text-[9px] font-mono text-muted-foreground">World Bank data loading…</div>
            )}
          </div>

          <div className="bg-surface-deep flex flex-col divide-y divide-border/40">
            <div className="px-3 pt-3 pb-1 text-[9px] font-mono uppercase text-muted-foreground tracking-wider">GDP DEFLATOR & CONTEXT</div>

            <div className="px-3 py-2.5 space-y-2">
              <div className="text-[8px] font-mono text-muted-foreground/60 uppercase mb-1">Price Level (GDP Deflator)</div>
              <div className="flex items-center justify-between">
                <div>
                  <div className="text-[10px] font-mono text-foreground">GDP Price Deflator</div>
                  <div className="text-[7px] font-mono text-muted-foreground/50">QoQ annualized · broader than CPI/PCE</div>
                </div>
                <div className={`text-[18px] font-mono font-bold tabular-nums ${(deflator?.value ?? 0) > 2 ? 'text-negative' : 'text-positive'}`}>{fmtQ(deflator?.value)}</div>
              </div>
              <div className="flex items-center justify-between">
                <div>
                  <div className="text-[10px] font-mono text-foreground">Real vs Nominal Gap</div>
                  <div className="text-[7px] font-mono text-muted-foreground/50">Deflator erodes nominal GDP growth</div>
                </div>
                <span className="text-[12px] font-mono font-bold tabular-nums text-muted-foreground">
                  {gdp?.value != null && deflator?.value != null ? fmtQ(gdp.value + (deflator.value ?? 0)) : '—'}
                </span>
              </div>
            </div>

            <div className="px-3 py-2.5 space-y-1.5">
              <div className="text-[8px] font-mono text-muted-foreground/60 uppercase mb-1">Upcoming GDP Releases</div>
              {upcoming.slice(0, 3).map(e => (
                <div key={e.id} className="flex items-center gap-2">
                  <span className="text-[9px] font-mono text-accent shrink-0">{new Date(e.ts).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}</span>
                  <span className="text-[9px] font-mono text-foreground flex-1 truncate">{e.label}</span>
                </div>
              ))}
              {upcoming.length === 0 && <div className="text-[9px] font-mono text-muted-foreground italic">No upcoming releases loaded</div>}
            </div>

            <div className="px-3 py-2 text-[7.5px] font-mono text-muted-foreground/50 flex-1 leading-relaxed">
              GDP: Advance (t+30d), Preliminary (t+60d), Final (t+90d). Two consecutive negative quarters = technical recession. NBER determines official recession dates.
            </div>
          </div>
        </div>

        {/* Row 4: Calendar */}
        <div className="grid grid-cols-2 gap-[1px] bg-border">
          <div className="p-3 bg-surface-deep">
            <div className="text-[9px] font-mono uppercase text-accent tracking-wider mb-1.5">UPCOMING GDP RELEASES</div>
            <div className="border border-border">
              {upcoming.map(e => (
                <div key={e.id} className="flex items-center gap-2 px-2 py-1.5 border-b border-border/40 hover:bg-surface-elevated">
                  <span className="text-[10px] font-mono text-accent w-20 shrink-0">{new Date(e.ts).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })}</span>
                  <span className="text-[9px] font-mono text-foreground flex-1 truncate">{e.label}</span>
                </div>
              ))}
              {upcoming.length === 0 && <div className="px-2 py-2 text-[9px] font-mono text-muted-foreground italic">No upcoming GDP releases loaded</div>}
            </div>
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
                    {e.actual   != null && <span className="text-[9px] font-mono font-bold text-foreground tabular-nums shrink-0">A: {e.actual}</span>}
                    {e.forecast != null && <span className="text-[8px] font-mono text-muted-foreground tabular-nums shrink-0">E: {e.forecast}</span>}
                    {surprise   != null && <span className={`text-[9px] font-mono font-bold tabular-nums shrink-0 ${surprise > 0 ? 'text-positive' : 'text-negative'}`}>{surprise > 0 ? '+' : ''}{surprise.toFixed(2)}</span>}
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
