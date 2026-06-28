// ISM — Institute for Supply Management Manufacturing PMI deep-dive. Single-page Bloomberg layout.
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
    yoy: o.value != null && obs[i]?.value && obs[i].value! > 0
      ? +((o.value / obs[i].value! - 1) * 100).toFixed(2) : null,
  }));
}

const TOOLTIP_STYLE = {
  background: 'hsl(var(--surface-deep))',
  border: '1px solid hsl(var(--border))',
  fontSize: 10,
  fontFamily: 'monospace',
  color: 'hsl(var(--foreground))',
};

export default function ISM() {
  const [histPmi,     setHistPmi]     = useState<HistObs[]>([]);
  const [histIndpro,  setHistIndpro]  = useState<HistObs[]>([]);
  const [histRetail,  setHistRetail]  = useState<HistObs[]>([]);
  const { byKey } = useFRED();
  const { events } = useEconCalendar();

  const pmiKpi        = byKey['ism_pmi'];
  const newOrdersKpi  = byKey['ism_new_orders'];
  const pricesKpi     = byKey['ism_prices'];
  const employmentKpi = byKey['ism_employment'];
  const indproKpi     = byKey['indpro_yoy'];
  const retailKpi     = byKey['retail_sales_mom'];

  useEffect(() => {
    apiGet<{ observations: HistObs[] }>('/api/market/macro/fred-history?series=NAPM&limit=72')
      .then(d => setHistPmi([...(d.observations ?? [])].reverse()))
      .catch(() => {});
    apiGet<{ observations: HistObs[] }>('/api/market/macro/fred-history?series=INDPRO&limit=72')
      .then(d => setHistIndpro([...(d.observations ?? [])].reverse()))
      .catch(() => {});
    apiGet<{ observations: HistObs[] }>('/api/market/macro/fred-history?series=RSAFS&limit=72')
      .then(d => setHistRetail([...(d.observations ?? [])].reverse()))
      .catch(() => {});
  }, []);

  const pmiData12m = useMemo(() =>
    histPmi.slice(-12).map(o => ({ date: o.date.slice(0, 7), pmi: o.value })),
    [histPmi]);

  const pmiData60m = useMemo(() =>
    histPmi.slice(-60).map(o => ({ date: o.date.slice(0, 7), pmi: o.value })),
    [histPmi]);

  const indproYoY = useMemo(() => toYoY(histIndpro), [histIndpro]);

  const ismCalendar = events.filter(e => e.kind === 'econ' && (e.label.toUpperCase().includes('ISM') || e.label.toUpperCase().includes('PMI'))).sort((a, b) => a.ts.localeCompare(b.ts));
  const upcoming    = ismCalendar.filter(e => new Date(e.ts) > new Date()).slice(0, 4);
  const past        = ismCalendar.filter(e => new Date(e.ts) <= new Date()).slice(-6).reverse();

  const pmi = pmiKpi?.value ?? null;
  const isExpanding = pmi != null && pmi >= 50;

  function fmtPmi(v?: number | null) { return v != null ? v.toFixed(1) : '—'; }
  function fmtPct(v?: number | null) { return v != null ? `${v > 0 ? '+' : ''}${v.toFixed(1)}%` : '—'; }

  const SUB_INDICES = [
    {
      label: 'New Orders',
      value: newOrdersKpi?.value,
      prev: newOrdersKpi?.prev,
      threshold: 50,
      desc: 'Leading indicator for production activity',
      isAbove50: (newOrdersKpi?.value ?? 49) >= 50,
    },
    {
      label: 'Employment Index',
      value: employmentKpi?.value,
      prev: employmentKpi?.prev,
      threshold: 50,
      desc: 'Mfg hiring intentions — leads NFP by 1–2 months',
      isAbove50: (employmentKpi?.value ?? 49) >= 50,
    },
    {
      label: 'Prices Paid',
      value: pricesKpi?.value,
      prev: pricesKpi?.prev,
      threshold: 50,
      desc: 'Input cost pressure — >50 = rising costs (PPI leading)',
      isAbove50: (pricesKpi?.value ?? 49) >= 50,
    },
    {
      label: 'Ind. Production YoY',
      value: indproKpi?.value,
      prev: indproKpi?.prev,
      threshold: 0,
      desc: 'Factory output — corroborates ISM survey data',
      isAbove50: (indproKpi?.value ?? -1) >= 0,
    },
    {
      label: 'Retail Sales MoM',
      value: retailKpi?.value,
      prev: retailKpi?.prev,
      threshold: 0,
      desc: 'Consumer demand — final demand for manufactured goods',
      isAbove50: (retailKpi?.value ?? -1) >= 0,
    },
  ];

  return (
    <CmdShell
      code="ISM" title="ISM Manufacturing PMI — Purchasing Managers Index"
      kpis={
        <div className="grid grid-cols-5 gap-[1px] bg-border">
          <Kpi label="ISM PMI"        value={fmtPmi(pmi)}                  sub={`Prior ${fmtPmi(pmiKpi?.prev)}`}             tone={isExpanding ? 'text-positive' : 'text-negative'} />
          <Kpi label="REGIME"         value={isExpanding ? 'EXPANDING' : 'CONTRACTING'} sub={pmi != null ? `PMI ${pmi >= 50 ? 'above' : 'below'} 50 threshold` : '—'} tone={isExpanding ? 'text-positive' : 'text-negative'} />
          <Kpi label="NEW ORDERS"     value={fmtPmi(newOrdersKpi?.value)}  sub={`Prior ${fmtPmi(newOrdersKpi?.prev)}`}       tone={(newOrdersKpi?.value ?? 49) >= 50 ? 'text-positive' : 'text-negative'} />
          <Kpi label="PRICES PAID"    value={fmtPmi(pricesKpi?.value)}     sub={`Prior ${fmtPmi(pricesKpi?.prev)}`}          tone={(pricesKpi?.value ?? 49) >= 50 ? 'text-negative' : 'text-positive'} />
          <Kpi label="EMPLOYMENT IDX" value={fmtPmi(employmentKpi?.value)} sub={`Prior ${fmtPmi(employmentKpi?.prev)}`}      tone={(employmentKpi?.value ?? 49) >= 50 ? 'text-positive' : 'text-negative'} />
        </div>
      }
      footerLeft="Source: ISM · FRED NAPM / NAPMNOI / NAPMPI / NAPMEI · Released 1st business day of month"
      footerRight={`PMI as of ${pmiKpi?.date?.slice(0, 7) ?? '—'} · 50 = expansion/contraction threshold`}
    >
      <div className="h-full overflow-y-auto">

        {/* Row 1: PMI gauge + 12M bar chart | sub-index table */}
        <div className="grid grid-cols-[55%_45%] gap-[1px] bg-border border-b border-border">
          <div className="p-3 bg-surface-deep flex flex-col gap-2">
            {/* PMI gauge */}
            <div className="flex items-center gap-6 pb-2 border-b border-border/40">
              <div className="text-center">
                <div className="text-[8px] font-mono uppercase text-muted-foreground tracking-wider mb-1">ISM PMI</div>
                <div className={`text-[52px] font-mono font-bold tabular-nums leading-none ${isExpanding ? 'text-positive' : 'text-negative'}`}>{fmtPmi(pmi)}</div>
                <div className={`text-[10px] font-mono font-bold mt-1 px-2 py-0.5 border ${isExpanding ? 'text-positive border-positive/30 bg-positive/10' : 'text-negative border-negative/30 bg-negative/10'}`}>
                  {isExpanding ? 'EXPANDING' : 'CONTRACTING'}
                </div>
              </div>
              <div className="flex-1 space-y-1.5">
                <div className="text-[7.5px] font-mono text-muted-foreground/60 uppercase mb-2">PMI READING GUIDE</div>
                {[
                  { range: '> 55', label: 'Strong Expansion', tone: 'text-positive' },
                  { range: '50–55', label: 'Expansion',        tone: 'text-accent' },
                  { range: '45–50', label: 'Mild Contraction', tone: 'text-accent' },
                  { range: '< 45', label: 'Recession Signal',  tone: 'text-negative' },
                ].map(r => (
                  <div key={r.range} className={`flex justify-between text-[8px] font-mono ${pmi != null && ((r.range.startsWith('>') && pmi > 55) || (r.range.startsWith('5') && pmi >= 50 && pmi <= 55) || (r.range.startsWith('4') && pmi >= 45 && pmi < 50) || (r.range.startsWith('<') && pmi < 45)) ? 'font-bold ' + r.tone : 'text-muted-foreground/50'}`}>
                    <span>{r.range}</span><span>{r.label}</span>
                  </div>
                ))}
              </div>
            </div>

            {/* 12M bar */}
            <div className="text-[9px] font-mono uppercase text-muted-foreground tracking-wider">PMI — LAST 12 MONTHS</div>
            <div className="h-36">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={pmiData12m} margin={{ top: 4, right: 8, left: 0, bottom: 0 }}>
                  <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border)/0.4)" vertical={false} />
                  <XAxis dataKey="date" tick={{ fill: 'hsl(var(--muted-foreground))', fontSize: 7, fontFamily: 'monospace' }} axisLine={false} tickLine={false} />
                  <YAxis domain={[40, 65]} tick={{ fill: 'hsl(var(--muted-foreground))', fontSize: 8, fontFamily: 'monospace' }} axisLine={false} tickLine={false} />
                  <Tooltip contentStyle={TOOLTIP_STYLE} formatter={(v: number) => [v.toFixed(1), 'PMI']} />
                  <ReferenceLine y={50} stroke="hsl(var(--border))" strokeWidth={1.5} label={{ value: '50', fill: 'hsl(var(--muted-foreground))', fontSize: 8 }} />
                  <Bar dataKey="pmi" maxBarSize={28} name="ISM PMI">
                    {pmiData12m.map((d, i) => (
                      <Cell key={i} fill={(d.pmi ?? 0) >= 50 ? 'hsl(var(--positive)/0.7)' : 'hsl(var(--negative)/0.7)'} />
                    ))}
                  </Bar>
                </BarChart>
              </ResponsiveContainer>
            </div>
          </div>

          <div className="bg-surface-deep flex flex-col">
            <div className="px-3 pt-3 pb-1 text-[9px] font-mono uppercase text-muted-foreground tracking-wider">SUB-INDICES · MANUFACTURING BREAKDOWN</div>
            <div className="flex-1 overflow-y-auto border border-border mx-3 mb-3">
              {SUB_INDICES.map(s => {
                const chg = s.value != null && s.prev != null ? s.value - s.prev : null;
                return (
                  <div key={s.label} className="px-3 py-2.5 border-b border-border/40 hover:bg-surface-elevated">
                    <div className="flex items-center justify-between mb-0.5">
                      <span className="text-[10px] font-mono font-bold text-foreground">{s.label}</span>
                      <div className="flex items-center gap-2">
                        <span className={`text-[8px] font-mono px-1.5 py-0.5 border ${s.isAbove50 ? 'text-positive border-positive/30 bg-positive/5' : 'text-negative border-negative/30 bg-negative/5'}`}>
                          {s.isAbove50 ? (s.threshold === 50 ? 'EXPANDING' : 'POSITIVE') : (s.threshold === 50 ? 'CONTRACTING' : 'NEGATIVE')}
                        </span>
                        <span className={`text-[15px] font-mono font-bold tabular-nums ${s.isAbove50 ? 'text-positive' : 'text-negative'}`}>
                          {s.value != null ? (s.threshold === 50 ? s.value.toFixed(1) : fmtPct(s.value)) : '—'}
                        </span>
                      </div>
                    </div>
                    <div className="flex items-center justify-between">
                      <div className="text-[7.5px] font-mono text-muted-foreground/55">{s.desc}</div>
                      {chg != null && <span className={`text-[8px] font-mono tabular-nums shrink-0 ml-2 ${chg > 0 ? 'text-positive' : 'text-negative'}`}>{chg > 0 ? '+' : ''}{chg.toFixed(1)}</span>}
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        </div>

        {/* Row 2: 60M PMI + proxies */}
        <div className="grid grid-cols-[55%_45%] gap-[1px] bg-border border-b border-border">
          <div className="p-3 bg-surface-deep flex flex-col gap-1">
            <div className="text-[9px] font-mono uppercase text-muted-foreground tracking-wider">60-MONTH PMI HISTORY · MANUFACTURING CYCLE</div>
            <div className="h-44">
              <ResponsiveContainer width="100%" height="100%">
                <LineChart data={pmiData60m} margin={{ top: 4, right: 16, left: 0, bottom: 0 }}>
                  <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border)/0.4)" vertical={false} />
                  <XAxis dataKey="date" tick={{ fill: 'hsl(var(--muted-foreground))', fontSize: 7, fontFamily: 'monospace' }} axisLine={false} tickLine={false} interval={5} />
                  <YAxis domain={[40, 68]} tick={{ fill: 'hsl(var(--muted-foreground))', fontSize: 8, fontFamily: 'monospace' }} axisLine={false} tickLine={false} />
                  <Tooltip contentStyle={TOOLTIP_STYLE} formatter={(v: number) => [v.toFixed(1), 'ISM PMI']} />
                  <ReferenceLine y={50} stroke="hsl(var(--border))" strokeWidth={1.5} label={{ value: 'Expand/Contract', fill: 'hsl(var(--muted-foreground))', fontSize: 7 }} />
                  <Line dataKey="pmi" stroke="hsl(var(--accent))" strokeWidth={2} dot={false} name="ISM PMI" />
                </LineChart>
              </ResponsiveContainer>
            </div>
          </div>

          <div className="p-3 bg-surface-deep flex flex-col gap-2">
            <div className="text-[9px] font-mono uppercase text-muted-foreground tracking-wider">ACTIVITY PROXIES</div>
            <div className="grid grid-cols-2 gap-2">
              <div className="border border-border px-3 py-2">
                <div className="text-[8px] font-mono text-muted-foreground/60 uppercase mb-1">Ind. Production YoY</div>
                <div className={`text-[18px] font-mono font-bold tabular-nums ${(indproKpi?.value ?? -1) >= 0 ? 'text-positive' : 'text-negative'}`}>{fmtPct(indproKpi?.value)}</div>
                <div className="text-[7px] font-mono text-muted-foreground/50">Prior: {fmtPct(indproKpi?.prev)}</div>
              </div>
              <div className="border border-border px-3 py-2">
                <div className="text-[8px] font-mono text-muted-foreground/60 uppercase mb-1">Retail Sales MoM</div>
                <div className={`text-[18px] font-mono font-bold tabular-nums ${(retailKpi?.value ?? -1) >= 0 ? 'text-positive' : 'text-negative'}`}>{fmtPct(retailKpi?.value)}</div>
                <div className="text-[7px] font-mono text-muted-foreground/50">Prior: {fmtPct(retailKpi?.prev)}</div>
              </div>
            </div>

            <div className="text-[9px] font-mono uppercase text-muted-foreground tracking-wider">IND. PRODUCTION YoY — 5Y</div>
            <div className="h-28">
              <ResponsiveContainer width="100%" height="100%">
                <LineChart data={indproYoY.slice(-60)} margin={{ top: 2, right: 8, left: 0, bottom: 0 }}>
                  <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border)/0.4)" vertical={false} />
                  <XAxis dataKey="date" tick={{ fill: 'hsl(var(--muted-foreground))', fontSize: 6, fontFamily: 'monospace' }} axisLine={false} tickLine={false} interval={9} />
                  <YAxis tick={{ fill: 'hsl(var(--muted-foreground))', fontSize: 7, fontFamily: 'monospace' }} axisLine={false} tickLine={false} tickFormatter={v => `${v}%`} />
                  <Tooltip contentStyle={TOOLTIP_STYLE} formatter={(v: number) => [`${v?.toFixed(2)}%`, 'Ind. Prod YoY']} />
                  <ReferenceLine y={0} stroke="hsl(var(--border))" strokeWidth={1} />
                  <Line dataKey="yoy" stroke="hsl(var(--positive)/0.8)" strokeWidth={1.5} dot={false} name="INDPRO YoY" />
                </LineChart>
              </ResponsiveContainer>
            </div>

            <div className="text-[7px] font-mono text-muted-foreground/40 italic border-t border-border/30 pt-1.5">
              ISM Services (NMI) data is not available on FRED. Use Industrial Production and Retail Sales as corroborating indicators of broad economic activity.
            </div>
          </div>
        </div>

        {/* Row 3: Calendar footer */}
        <div className="grid grid-cols-2 gap-[1px] bg-border">
          <div className="p-3 bg-surface-deep">
            <div className="text-[9px] font-mono uppercase text-accent tracking-wider mb-1.5">UPCOMING ISM / PMI RELEASES</div>
            <div className="border border-border">
              {upcoming.length > 0 ? upcoming.map(e => (
                <div key={e.id} className="flex items-center gap-2 px-2 py-1.5 border-b border-border/40 hover:bg-surface-elevated">
                  <span className="text-[10px] font-mono text-accent w-22 shrink-0">{new Date(e.ts).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })}</span>
                  <span className="text-[9px] font-mono text-foreground flex-1 truncate">{e.label}</span>
                </div>
              )) : (
                <div className="px-3 py-2 text-[9px] font-mono text-muted-foreground italic">No upcoming ISM/PMI releases loaded</div>
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
                    {surprise   != null && <span className={`text-[9px] font-mono font-bold tabular-nums shrink-0 ${surprise > 0 ? 'text-positive' : 'text-negative'}`}>{surprise > 0 ? '+' : ''}{surprise.toFixed(1)}</span>}
                  </div>
                );
              }) : (
                <div className="px-3 py-2 text-[9px] font-mono text-muted-foreground italic">No past ISM/PMI releases loaded</div>
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
