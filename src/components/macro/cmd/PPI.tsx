// PPI — Producer Price Index deep-dive. Single-page Bloomberg layout.
import { useState, useEffect, useMemo } from 'react';
import { useFRED } from '@/hooks/useFRED';
import { useEconCalendar } from '@/hooks/useEconCalendar';
import { apiGet } from '@/lib/api';
import {
  LineChart, Line, BarChart, Bar, Cell, XAxis, YAxis, Tooltip, ResponsiveContainer, ReferenceLine, CartesianGrid,
} from 'recharts';
import CmdShell from './_shell/CmdShell';

type HistObs = { date: string; value: number | null };

function toYoY(obs: HistObs[]): Array<{ date: string; yoy: number | null }> {
  return obs.slice(12).map((o, i) => ({
    date: o.date.slice(0, 7),
    yoy: o.value != null && obs[i]?.value ? +((o.value / obs[i].value - 1) * 100).toFixed(2) : null,
  }));
}

const PIPELINE_STAGES = [
  { stage: 'Crude Materials',    desc: 'Raw inputs: metals, lumber, crude petroleum, farm products. Most volatile, ~6-12 month lead.', liveKey: '' },
  { stage: 'Intermediate Goods', desc: 'Partially processed: steel, chemicals, paper, components. ~3-6 month lead to CPI.',           liveKey: '' },
  { stage: 'Finished Goods',     desc: 'PPI headline (PPIFGS) — ready for sale. ~1-3 month lead to consumer prices.',                   liveKey: 'ppi' },
  { stage: 'Consumer Prices',    desc: 'CPI — final demand pass-through. Typically lags PPI by 1-3 months.',                           liveKey: 'cpi' },
];

const TOOLTIP_STYLE = {
  background: 'hsl(var(--surface-deep))',
  border: '1px solid hsl(var(--border))',
  fontSize: 10,
  fontFamily: 'monospace',
  color: 'hsl(var(--foreground))',
};

export default function PPI() {
  const [histPpi,  setHistPpi]  = useState<HistObs[]>([]);
  const [histCore, setHistCore] = useState<HistObs[]>([]);
  const [histCpi,  setHistCpi]  = useState<HistObs[]>([]);
  const { byKey } = useFRED();
  const { events } = useEconCalendar();

  const ppi  = byKey['ppi_yoy'];
  const core = byKey['core_ppi_yoy'];
  const cpi  = byKey['cpi_yoy'];

  useEffect(() => {
    apiGet<{ observations: HistObs[] }>('/api/market/macro/fred-history?series=PPIFGS&limit=72')
      .then(d => setHistPpi([...(d.observations ?? [])].reverse()))
      .catch(() => {});
    apiGet<{ observations: HistObs[] }>('/api/market/macro/fred-history?series=WPUFD49116&limit=72')
      .then(d => setHistCore([...(d.observations ?? [])].reverse()))
      .catch(() => {});
    apiGet<{ observations: HistObs[] }>('/api/market/macro/fred-history?series=CPIAUCSL&limit=72')
      .then(d => setHistCpi([...(d.observations ?? [])].reverse()))
      .catch(() => {});
  }, []);

  const ppiYoY  = useMemo(() => toYoY(histPpi),  [histPpi]);
  const coreYoY = useMemo(() => toYoY(histCore), [histCore]);
  const cpiYoY  = useMemo(() => toYoY(histCpi),  [histCpi]);

  const chartData = useMemo(() => ppiYoY.map(p => {
    const c = cpiYoY.find(x => x.date === p.date);
    const k = coreYoY.find(x => x.date === p.date);
    return { date: p.date, ppi: p.yoy, cpi: c?.yoy ?? null, core: k?.yoy ?? null };
  }), [ppiYoY, cpiYoY, coreYoY]);

  const spread = ppi?.value != null && cpi?.value != null ? +(ppi.value - cpi.value).toFixed(2) : null;
  const pipelineSignal = spread == null ? '—' : spread > 1 ? 'PRESSURING' : spread < -1 ? 'COOLING' : 'NEUTRAL';
  const pipelineColor  = spread != null && spread > 1 ? 'text-negative' : spread != null && spread < -1 ? 'text-positive' : 'text-muted-foreground';

  const trend3m = chartData.length >= 4
    ? +((chartData[chartData.length - 1].ppi ?? 0) - (chartData[chartData.length - 4].ppi ?? 0)).toFixed(2)
    : null;

  const liveVals: Record<string, string> = { ppi: fmt(ppi?.value), cpi: fmt(cpi?.value) };

  const ppiCalendar = events.filter(e => e.kind === 'econ' && e.label.toUpperCase().includes('PPI')).sort((a, b) => a.ts.localeCompare(b.ts));
  const upcoming = ppiCalendar.filter(e => new Date(e.ts) > new Date()).slice(0, 3);
  const past     = ppiCalendar.filter(e => new Date(e.ts) <= new Date()).slice(-6).reverse();

  function fmt(v?: number | null) { return v != null ? `${v.toFixed(2)}%` : '—'; }
  function signFmt(v: number | null | undefined) { return v == null ? '—' : `${v > 0 ? '+' : ''}${v.toFixed(2)}%`; }
  function chgClass(v?: number | null) { return (v ?? 0) > 0 ? 'text-negative' : (v ?? 0) < 0 ? 'text-positive' : 'text-muted-foreground'; }

  return (
    <CmdShell
      code="PPI" title="Producer Price Index — Cost Pipeline"
      kpis={
        <div className="grid grid-cols-5 gap-[1px] bg-border">
          <Kpi label="PPI FINISHED YoY" value={fmt(ppi?.value)}  sub={`Prior ${fmt(ppi?.prev)}`}  tone={chgClass(ppi?.change)} />
          <Kpi label="CORE PPI YoY"     value={fmt(core?.value)} sub={`Prior ${fmt(core?.prev)}`} tone={chgClass(core?.change)} />
          <Kpi label="CPI YoY (REF)"    value={fmt(cpi?.value)}  sub="Downstream pass-through"    tone={chgClass(cpi?.change)} />
          <Kpi label="PPI−CPI SPREAD"   value={signFmt(spread)}  sub="Pipeline pressure gap"      tone={spread != null && spread > 0 ? 'text-negative' : 'text-positive'} />
          <Kpi label="PIPELINE SIGNAL"  value={pipelineSignal}   sub=">1pp = pressuring CPI"      tone={pipelineColor} />
        </div>
      }
      footerLeft="Source: BLS · FRED PPIFGS / WPUFD49116 · Monthly"
      footerRight={`PPI leads CPI by 1–3 months · As of ${ppi?.date?.slice(0, 7) ?? '—'}`}
    >
      <div className="h-full overflow-y-auto">

        {/* Row 1: 24M chart + pipeline */}
        <div className="grid grid-cols-[55%_45%] gap-[1px] bg-border border-b border-border">
          <div className="p-3 bg-surface-deep flex flex-col gap-1">
            <div className="text-[9px] font-mono uppercase text-muted-foreground tracking-wider">24-MONTH TREND · PPI vs CORE vs CPI</div>
            <div className="h-52">
              <ResponsiveContainer width="100%" height="100%">
                <LineChart data={chartData.slice(-24)} margin={{ top: 4, right: 16, left: 0, bottom: 0 }}>
                  <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border)/0.4)" />
                  <XAxis dataKey="date" tick={{ fill: 'hsl(var(--muted-foreground))', fontSize: 8, fontFamily: 'monospace' }} axisLine={false} tickLine={false} interval={3} />
                  <YAxis tick={{ fill: 'hsl(var(--muted-foreground))', fontSize: 8, fontFamily: 'monospace' }} axisLine={false} tickLine={false} tickFormatter={v => `${v}%`} />
                  <Tooltip contentStyle={TOOLTIP_STYLE} formatter={(v: number) => [`${v?.toFixed(2)}%`]} />
                  <ReferenceLine y={0} stroke="hsl(var(--border))" strokeWidth={1} />
                  <ReferenceLine y={2} stroke="hsl(var(--accent)/0.35)" strokeDasharray="4 3" strokeWidth={1} />
                  <Line type="monotone" dataKey="ppi"  stroke="hsl(var(--accent))"              strokeWidth={1.5} dot={false} name="PPI YoY" />
                  <Line type="monotone" dataKey="core" stroke="hsl(var(--accent)/0.55)"          strokeWidth={1}   dot={false} name="Core PPI" strokeDasharray="4 2" />
                  <Line type="monotone" dataKey="cpi"  stroke="hsl(var(--muted-foreground)/0.65)" strokeWidth={1}  dot={false} name="CPI YoY"  strokeDasharray="2 2" />
                </LineChart>
              </ResponsiveContainer>
            </div>
            <div className="text-[8px] font-mono text-muted-foreground flex gap-4">
              <span className="flex items-center gap-1"><span className="inline-block w-5 h-0.5 bg-accent/80" />PPI YoY</span>
              <span className="flex items-center gap-1"><span className="inline-block w-5 h-0.5 bg-accent/50" />Core PPI</span>
              <span className="flex items-center gap-1"><span className="inline-block w-5 h-0.5 bg-muted-foreground/60" />CPI</span>
            </div>
          </div>

          <div className="bg-surface-deep flex flex-col">
            <div className="px-3 pt-3 pb-2 text-[9px] font-mono uppercase text-muted-foreground tracking-wider">INFLATION PIPELINE · COST PASS-THROUGH</div>
            <div className="flex-1 px-3 space-y-0 pb-2">
              {PIPELINE_STAGES.map((s, i) => (
                <div key={s.stage} className="flex gap-3">
                  <div className="flex flex-col items-center">
                    <div className={`w-6 h-6 rounded-full border-2 flex items-center justify-center text-[9px] font-mono font-bold shrink-0
                      ${i === 2 ? 'border-accent text-accent bg-accent/10' : 'border-border text-muted-foreground'}`}>
                      {i + 1}
                    </div>
                    {i < PIPELINE_STAGES.length - 1 && <div className="w-px flex-1 bg-border/50 my-1 min-h-[14px]" />}
                  </div>
                  <div className="flex-1 pb-3 min-w-0">
                    <div className="flex items-center justify-between gap-1">
                      <span className="text-[10px] font-mono font-bold text-foreground leading-none">{s.stage}</span>
                      {s.liveKey && <span className={`text-[11px] font-mono font-bold tabular-nums shrink-0 ${chgClass(s.liveKey === 'ppi' ? ppi?.change : cpi?.change)}`}>{liveVals[s.liveKey]}</span>}
                    </div>
                    <div className="text-[7.5px] font-mono text-muted-foreground/60 leading-tight mt-0.5">{s.desc}</div>
                  </div>
                </div>
              ))}
            </div>
            {spread != null && (
              <div className={`mx-3 mb-3 px-3 py-2 border text-[9px] font-mono ${spread > 1 ? 'border-negative/40 bg-negative/5 text-negative' : 'border-positive/40 bg-positive/5 text-positive'}`}>
                {spread > 1 ? `PIPELINE PRESSURE: PPI ${signFmt(spread)} above CPI — consumer prices may follow` : `PIPELINE COOLING: PPI−CPI spread is ${signFmt(spread)}`}
              </div>
            )}
          </div>
        </div>

        {/* Row 2: 60M history + signals */}
        <div className="grid grid-cols-[55%_45%] gap-[1px] bg-border border-b border-border">
          <div className="p-3 bg-surface-deep flex flex-col gap-1">
            <div className="text-[9px] font-mono uppercase text-muted-foreground tracking-wider">60-MONTH HISTORY · PPI YoY WITH CPI OVERLAY</div>
            <div className="h-44">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={chartData} margin={{ top: 4, right: 16, left: 0, bottom: 0 }}>
                  <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border)/0.4)" vertical={false} />
                  <XAxis dataKey="date" tick={{ fill: 'hsl(var(--muted-foreground))', fontSize: 8, fontFamily: 'monospace' }} axisLine={false} tickLine={false} interval={5} />
                  <YAxis tick={{ fill: 'hsl(var(--muted-foreground))', fontSize: 8, fontFamily: 'monospace' }} axisLine={false} tickLine={false} tickFormatter={v => `${v}%`} />
                  <Tooltip contentStyle={TOOLTIP_STYLE} formatter={(v: number) => [`${v?.toFixed(2)}%`]} />
                  <ReferenceLine y={0} stroke="hsl(var(--border))" strokeWidth={1} />
                  <Bar dataKey="ppi" maxBarSize={10} name="PPI YoY">
                    {chartData.map((d, i) => (
                      <Cell key={i} fill={(d.ppi ?? 0) >= 0 ? 'hsl(var(--negative)/0.6)' : 'hsl(var(--positive)/0.6)'} />
                    ))}
                  </Bar>
                  <Line type="monotone" dataKey="cpi" stroke="hsl(var(--muted-foreground)/0.6)" strokeWidth={1} dot={false} name="CPI" strokeDasharray="3 2" />
                </BarChart>
              </ResponsiveContainer>
            </div>
          </div>

          <div className="bg-surface-deep flex flex-col divide-y divide-border/40">
            <div className="px-3 pt-3 pb-1 text-[9px] font-mono uppercase text-muted-foreground tracking-wider">SIGNALS & MOMENTUM</div>

            <div className="px-3 py-2.5 space-y-2.5">
              <div className="text-[8px] font-mono text-muted-foreground/60 uppercase mb-1">Current Readings</div>
              <SignalRow label="PPI Finished Goods"      value={fmt(ppi?.value)}  sub={`MoM chg: ${signFmt(ppi?.change)}`} />
              <SignalRow label="Core PPI (ex food/nrg)" value={fmt(core?.value)} sub={`Prior: ${fmt(core?.prev)}`} />
              <SignalRow label="CPI (downstream)"        value={fmt(cpi?.value)}  sub="~1-3mo lagged from PPI" />
            </div>

            <div className="px-3 py-2.5 space-y-2.5">
              <div className="text-[8px] font-mono text-muted-foreground/60 uppercase mb-1">Spread & Trend</div>
              <div className="flex items-center justify-between">
                <div>
                  <div className="text-[10px] font-mono text-foreground">PPI−CPI Spread</div>
                  <div className="text-[7px] font-mono text-muted-foreground/50">+ve = PPI pressuring CPI higher</div>
                </div>
                <div className={`text-[18px] font-mono font-bold tabular-nums ${spread != null && spread > 1 ? 'text-negative' : spread != null && spread < -1 ? 'text-positive' : 'text-foreground'}`}>{signFmt(spread)}</div>
              </div>
              <div className="flex items-center justify-between">
                <div>
                  <div className="text-[10px] font-mono text-foreground">3-Month PPI Trend</div>
                  <div className="text-[7px] font-mono text-muted-foreground/50">YoY vs 3 months prior</div>
                </div>
                <div className={`text-[15px] font-mono font-bold tabular-nums ${trend3m != null && trend3m > 0 ? 'text-negative' : 'text-positive'}`}>{signFmt(trend3m)}</div>
              </div>
            </div>

            <div className="px-3 py-2 text-[7.5px] font-mono text-muted-foreground/50 flex-1 leading-relaxed">
              PPI leads CPI by ~1-3 months via supply chain pass-through. Spread &gt;2pp historically precedes CPI acceleration within 6 months. Core PPI (ex food+energy) tracks sticky manufactured goods & services.
            </div>
          </div>
        </div>

        {/* Row 3: Calendar */}
        <div className="grid grid-cols-2 gap-[1px] bg-border">
          <div className="p-3 bg-surface-deep">
            <div className="text-[9px] font-mono uppercase text-accent tracking-wider mb-1.5">UPCOMING PPI RELEASES</div>
            <div className="border border-border">
              {upcoming.map(e => (
                <div key={e.id} className="flex items-center gap-2 px-2 py-1.5 border-b border-border/40 hover:bg-surface-elevated">
                  <span className="text-[10px] font-mono text-accent w-20 shrink-0">{new Date(e.ts).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })}</span>
                  <span className="text-[9px] font-mono text-foreground flex-1 truncate">{e.label}</span>
                  {e.forecast != null && <span className="text-[8px] font-mono text-muted-foreground shrink-0">E: {e.forecast}</span>}
                </div>
              ))}
              {upcoming.length === 0 && <div className="px-2 py-2 text-[9px] font-mono text-muted-foreground italic">No upcoming PPI releases loaded</div>}
            </div>
            <div className="text-[7px] font-mono text-muted-foreground/50 mt-1.5 italic">BLS releases PPI ~1 week before CPI each month</div>
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
                    {surprise   != null && <span className={`text-[9px] font-mono font-bold tabular-nums shrink-0 ${surprise > 0 ? 'text-negative' : 'text-positive'}`}>{surprise > 0 ? '+' : ''}{surprise.toFixed(2)}</span>}
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
    <div className="bg-surface-deep px-2 py-1.5">
      <div className="text-[8px] font-mono uppercase text-muted-foreground tracking-wider">{label}</div>
      <div className={`text-lg font-mono font-bold tabular-nums leading-tight ${tone}`}>{value}</div>
      <div className="text-[8px] font-mono text-muted-foreground/60">{sub}</div>
    </div>
  );
}

function SignalRow({ label, value, sub }: { label: string; value: string; sub: string }) {
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
