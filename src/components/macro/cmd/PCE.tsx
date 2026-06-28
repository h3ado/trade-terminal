// PCE — Personal Consumption Expenditures deep-dive. Single-page Bloomberg layout.
import { useState, useEffect, useMemo } from 'react';
import { useFRED } from '@/hooks/useFRED';
import { useEconCalendar, applyFilters } from '@/hooks/useEconCalendar';
import { apiGet } from '@/lib/api';
import {
  LineChart, Line, XAxis, YAxis, Tooltip, ResponsiveContainer, ReferenceLine, CartesianGrid,
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

export default function PCE() {
  const [histCore, setHistCore] = useState<HistObs[]>([]);
  const [histPce,  setHistPce]  = useState<HistObs[]>([]);
  const [histCpi,  setHistCpi]  = useState<HistObs[]>([]);
  const { byKey } = useFRED();
  const { events } = useEconCalendar();

  const corePce    = byKey['core_pce_yoy'];
  const pce        = byKey['pce_yoy'];
  const cpi        = byKey['cpi_yoy'];
  const be5y       = byKey['breakeven_5y'];
  const be10y      = byKey['breakeven_10y'];

  useEffect(() => {
    apiGet<{ observations: HistObs[] }>('/api/market/macro/fred-history?series=PCEPILFE&limit=72')
      .then(d => setHistCore([...(d.observations ?? [])].reverse()))
      .catch(() => {});
    apiGet<{ observations: HistObs[] }>('/api/market/macro/fred-history?series=PCEPI&limit=72')
      .then(d => setHistPce([...(d.observations ?? [])].reverse()))
      .catch(() => {});
    apiGet<{ observations: HistObs[] }>('/api/market/macro/fred-history?series=CPIAUCSL&limit=72')
      .then(d => setHistCpi([...(d.observations ?? [])].reverse()))
      .catch(() => {});
  }, []);

  const chartData24m = useMemo(() => {
    const baseLen = Math.min(histCore.length, histPce.length, histCpi.length);
    if (baseLen < 13) return [];
    return histCore.slice(-24).map((o, idx) => {
      const coreYoY = o.value != null && histCore[histCore.length - 24 + idx - 12]?.value
        ? +((o.value / histCore[histCore.length - 24 + idx - 12].value! - 1) * 100).toFixed(2)
        : null;
      const pceObs  = histPce[histPce.length - 24 + idx];
      const pceBase = histPce[histPce.length - 24 + idx - 12];
      const pceYoY  = pceObs?.value != null && pceBase?.value
        ? +((pceObs.value / pceBase.value - 1) * 100).toFixed(2) : null;
      const cpiObs  = histCpi[histCpi.length - 24 + idx];
      const cpiBase = histCpi[histCpi.length - 24 + idx - 12];
      const cpiYoY  = cpiObs?.value != null && cpiBase?.value
        ? +((cpiObs.value / cpiBase.value - 1) * 100).toFixed(2) : null;
      return { date: o.date.slice(0, 7), coreYoY, pceYoY, cpiYoY };
    }).filter(d => d.coreYoY != null);
  }, [histCore, histPce, histCpi]);

  const chartData60m = useMemo(() => {
    if (histCore.length < 13) return [];
    return histCore.slice(-60).map((o, idx) => {
      const offset = histCore.length - 60 + idx;
      const base12  = histCore[offset - 12];
      const coreYoY = o.value != null && base12?.value
        ? +((o.value / base12.value - 1) * 100).toFixed(2) : null;
      const pceObs  = histPce[histPce.length - 60 + idx];
      const pceBase = histPce[histPce.length - 60 + idx - 12];
      const pceYoY  = pceObs?.value != null && pceBase?.value
        ? +((pceObs.value / pceBase.value - 1) * 100).toFixed(2) : null;
      const cpiObs  = histCpi[histCpi.length - 60 + idx];
      const cpiBase = histCpi[histCpi.length - 60 + idx - 12];
      const cpiYoY  = cpiObs?.value != null && cpiBase?.value
        ? +((cpiObs.value / cpiBase.value - 1) * 100).toFixed(2) : null;
      return { date: o.date.slice(0, 7), coreYoY, pceYoY, cpiYoY };
    }).filter(d => d.coreYoY != null);
  }, [histCore, histPce, histCpi]);

  const pceCalendar    = events.filter(e => e.kind === 'econ' && (e.label.toUpperCase().includes('PCE') || e.label.toUpperCase().includes('PERSONAL INCOME'))).sort((a, b) => a.ts.localeCompare(b.ts));
  const fomcCalendar   = applyFilters(events, { kinds: ['cb'] }).sort((a, b) => a.ts.localeCompare(b.ts));
  const upcomingPce    = pceCalendar.filter(e => new Date(e.ts) > new Date()).slice(0, 4);
  const pastPce        = pceCalendar.filter(e => new Date(e.ts) <= new Date()).slice(-6).reverse();
  const upcomingFomc   = fomcCalendar.filter(e => new Date(e.ts) > new Date()).slice(0, 4);

  const gapFrom2    = corePce?.value != null ? +(corePce.value - 2).toFixed(2) : null;
  const pceVsCpi    = corePce?.value != null && cpi?.value != null ? +(cpi.value - corePce.value).toFixed(2) : null;

  function fmt(v?: number | null, digits = 2) { return v != null ? `${v > 0 ? '+' : ''}${v.toFixed(digits)}%` : '—'; }
  function abs(v?: number | null, digits = 2) { return v != null ? `${v.toFixed(digits)}%` : '—'; }

  const gapTone = gapFrom2 == null ? 'text-foreground' : gapFrom2 <= 0.1 ? 'text-positive' : gapFrom2 < 0.5 ? 'text-accent' : 'text-negative';

  return (
    <CmdShell
      code="PCE" title="Personal Consumption Expenditures — Fed Inflation Target"
      kpis={
        <div className="grid grid-cols-4 gap-[1px] bg-border">
          <Kpi label="CORE PCE YoY"      value={abs(corePce?.value)}   sub={`Prior ${abs(corePce?.prev)}`}                        tone={(corePce?.value ?? 3) > 2.5 ? 'text-negative' : 'text-positive'} />
          <Kpi label="PCE YoY"           value={abs(pce?.value)}       sub={`Prior ${abs(pce?.prev)}`}                            tone={(pce?.value ?? 3) > 2.5 ? 'text-negative' : 'text-positive'} />
          <Kpi label="GAP FROM 2% TARGET" value={fmt(gapFrom2)}        sub="Core PCE − 2.0% Fed target"                          tone={gapTone} />
          <Kpi label="PCE−CPI SPREAD"    value={fmt(pceVsCpi)}         sub="CPI tends to run above PCE"                          tone="text-foreground" />
        </div>
      }
      footerLeft="Source: BEA · FRED PCEPILFE / PCEPI · Monthly · Fed's preferred inflation gauge"
      footerRight={`Core PCE as of ${corePce?.date?.slice(0, 7) ?? '—'} · Fed targets 2% Core PCE YoY`}
    >
      <div className="h-full overflow-y-auto">

        {/* Row 1: 24M chart + Fed context */}
        <div className="grid grid-cols-[55%_45%] gap-[1px] bg-border border-b border-border">
          <div className="p-3 bg-surface-deep flex flex-col gap-1">
            {gapFrom2 != null && (
              <div className={`text-[9px] font-mono px-2 py-0.5 border rounded self-start ${gapFrom2 <= 0.1 ? 'bg-positive/10 border-positive/30 text-positive' : gapFrom2 < 0.5 ? 'bg-accent/10 border-accent/30 text-accent' : 'bg-negative/10 border-negative/30 text-negative'}`}>
                CORE PCE {gapFrom2 > 0 ? `${gapFrom2.toFixed(2)}pp ABOVE` : `${Math.abs(gapFrom2).toFixed(2)}pp BELOW`} FED 2% TARGET
              </div>
            )}
            <div className="text-[9px] font-mono uppercase text-muted-foreground tracking-wider mt-1">CORE PCE vs PCE vs CPI — 24 MONTHS YoY</div>
            <div className="h-52">
              <ResponsiveContainer width="100%" height="100%">
                <LineChart data={chartData24m} margin={{ top: 4, right: 16, left: 0, bottom: 0 }}>
                  <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border)/0.4)" vertical={false} />
                  <XAxis dataKey="date" tick={{ fill: 'hsl(var(--muted-foreground))', fontSize: 8, fontFamily: 'monospace' }} axisLine={false} tickLine={false} interval={3} />
                  <YAxis tick={{ fill: 'hsl(var(--muted-foreground))', fontSize: 8, fontFamily: 'monospace' }} axisLine={false} tickLine={false} tickFormatter={v => `${v}%`} />
                  <Tooltip contentStyle={TOOLTIP_STYLE} formatter={(v: number, name: string) => [`${v?.toFixed(2)}%`, name]} />
                  <ReferenceLine y={2} stroke="hsl(var(--positive)/0.5)" strokeDasharray="4 3" strokeWidth={1.5} label={{ value: 'Fed Target 2%', fill: 'hsl(var(--positive))', fontSize: 8, position: 'insideBottomLeft' }} />
                  <Line dataKey="coreYoY" stroke="hsl(var(--negative))"         strokeWidth={2} dot={false} name="Core PCE YoY" />
                  <Line dataKey="pceYoY"  stroke="hsl(var(--accent)/0.7)"        strokeWidth={1.5} dot={false} name="PCE YoY" strokeDasharray="4 3" />
                  <Line dataKey="cpiYoY"  stroke="hsl(var(--muted-foreground)/0.5)" strokeWidth={1} dot={false} name="CPI YoY" strokeDasharray="2 4" />
                </LineChart>
              </ResponsiveContainer>
            </div>
            <div className="flex gap-4 text-[7.5px] font-mono text-muted-foreground/60 justify-end">
              <span className="flex items-center gap-1"><span className="w-3 h-0.5 bg-negative inline-block" />Core PCE</span>
              <span className="flex items-center gap-1"><span className="w-3 h-0.5 bg-accent inline-block opacity-70" />PCE</span>
              <span className="flex items-center gap-1"><span className="w-3 h-0.5 bg-muted-foreground inline-block opacity-50" />CPI</span>
            </div>
          </div>

          <div className="bg-surface-deep flex flex-col divide-y divide-border/40">
            <div className="px-3 pt-3 pb-1 text-[9px] font-mono uppercase text-muted-foreground tracking-wider">FED POLICY CONTEXT</div>

            <div className="px-3 py-2.5 grid grid-cols-2 gap-2">
              <div>
                <div className="text-[7.5px] font-mono text-muted-foreground/60 uppercase mb-0.5">Core PCE (Fed Target)</div>
                <div className={`text-[22px] font-mono font-bold tabular-nums leading-tight ${(corePce?.value ?? 3) > 2.5 ? 'text-negative' : 'text-positive'}`}>{abs(corePce?.value)}</div>
                <div className="text-[7.5px] font-mono text-muted-foreground/50">vs 2.0% target</div>
              </div>
              <div>
                <div className="text-[7.5px] font-mono text-muted-foreground/60 uppercase mb-0.5">Gap</div>
                <div className={`text-[22px] font-mono font-bold tabular-nums leading-tight ${gapTone}`}>{fmt(gapFrom2)}</div>
                <div className="text-[7.5px] font-mono text-muted-foreground/50">pp above/below target</div>
              </div>
            </div>

            <div className="px-3 py-2.5 space-y-1.5">
              <div className="text-[8px] font-mono text-muted-foreground/60 uppercase mb-1">TIPS Inflation Breakevens (Market Expectations)</div>
              <BERow label="5Y TIPS Breakeven"  value={be5y?.value}  prev={be5y?.prev}  />
              <BERow label="10Y TIPS Breakeven" value={be10y?.value} prev={be10y?.prev} />
              <div className="text-[7px] font-mono text-muted-foreground/40 mt-1">Market-implied average inflation over 5Y / 10Y horizon.</div>
            </div>

            <div className="px-3 py-2.5 space-y-1">
              <div className="text-[8px] font-mono text-muted-foreground/60 uppercase mb-1">Structural PCE vs CPI Spread</div>
              <div className="flex items-center justify-between">
                <div>
                  <div className="text-[10px] font-mono text-foreground">CPI − Core PCE</div>
                  <div className="text-[7px] font-mono text-muted-foreground/50">CPI uses Laspeyres; PCE uses Fisher index (broader)</div>
                </div>
                <span className="text-[15px] font-mono font-bold tabular-nums text-foreground">{fmt(pceVsCpi)}</span>
              </div>
            </div>

            <div className="px-3 py-2 space-y-1 flex-1">
              <div className="text-[8px] font-mono text-muted-foreground/60 uppercase mb-1">Upcoming FOMC Meetings</div>
              {upcomingFomc.slice(0, 4).map(e => (
                <div key={e.id} className="flex items-center gap-2">
                  <span className="text-[9px] font-mono text-accent shrink-0">{new Date(e.ts).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}</span>
                  <span className="text-[9px] font-mono text-foreground flex-1 truncate">{e.label}</span>
                </div>
              ))}
              {upcomingFomc.length === 0 && <div className="text-[9px] font-mono text-muted-foreground italic">No FOMC events loaded</div>}
            </div>
          </div>
        </div>

        {/* Row 2: 60M chart + recent releases */}
        <div className="grid grid-cols-[55%_45%] gap-[1px] bg-border border-b border-border">
          <div className="p-3 bg-surface-deep flex flex-col gap-1">
            <div className="text-[9px] font-mono uppercase text-muted-foreground tracking-wider">60-MONTH HISTORY — CORE PCE / PCE / CPI YoY</div>
            <div className="h-48">
              <ResponsiveContainer width="100%" height="100%">
                <LineChart data={chartData60m} margin={{ top: 4, right: 16, left: 0, bottom: 0 }}>
                  <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border)/0.4)" vertical={false} />
                  <XAxis dataKey="date" tick={{ fill: 'hsl(var(--muted-foreground))', fontSize: 7, fontFamily: 'monospace' }} axisLine={false} tickLine={false} interval={5} />
                  <YAxis tick={{ fill: 'hsl(var(--muted-foreground))', fontSize: 8, fontFamily: 'monospace' }} axisLine={false} tickLine={false} tickFormatter={v => `${v}%`} />
                  <Tooltip contentStyle={TOOLTIP_STYLE} formatter={(v: number, name: string) => [`${v?.toFixed(2)}%`, name]} />
                  <ReferenceLine y={2} stroke="hsl(var(--positive)/0.4)" strokeDasharray="4 3" strokeWidth={1} />
                  <Line dataKey="coreYoY" stroke="hsl(var(--negative))"              strokeWidth={2} dot={false} name="Core PCE YoY" />
                  <Line dataKey="pceYoY"  stroke="hsl(var(--accent)/0.7)"            strokeWidth={1} dot={false} name="PCE YoY" strokeDasharray="4 3" />
                  <Line dataKey="cpiYoY"  stroke="hsl(var(--muted-foreground)/0.45)" strokeWidth={1} dot={false} name="CPI YoY" strokeDasharray="2 4" />
                </LineChart>
              </ResponsiveContainer>
            </div>
          </div>

          <div className="bg-surface-deep flex flex-col">
            <div className="px-3 pt-3 pb-1 text-[9px] font-mono uppercase text-muted-foreground tracking-wider">RECENT PCE RELEASES · BEAT / MISS</div>
            <div className="flex-1 border border-border mx-3 mb-3 overflow-y-auto">
              {pastPce.length > 0 ? pastPce.map(e => {
                const surprise = e.actual != null && e.forecast != null ? e.actual - e.forecast : null;
                return (
                  <div key={e.id} className="flex items-center gap-2 px-2 py-1.5 border-b border-border/40 hover:bg-surface-elevated">
                    <span className="text-[9px] font-mono text-muted-foreground shrink-0">{new Date(e.ts).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: '2-digit' })}</span>
                    <span className="text-[9px] font-mono text-foreground flex-1 truncate">{e.label}</span>
                    {e.actual   != null && <span className="text-[9px] font-mono font-bold text-foreground tabular-nums shrink-0">A: {e.actual}%</span>}
                    {e.forecast != null && <span className="text-[8px] font-mono text-muted-foreground tabular-nums shrink-0">E: {e.forecast}%</span>}
                    {surprise   != null && <span className={`text-[9px] font-mono font-bold tabular-nums shrink-0 ${surprise <= 0 ? 'text-positive' : 'text-negative'}`}>{surprise > 0 ? '+' : ''}{surprise.toFixed(2)}</span>}
                  </div>
                );
              }) : (
                <div className="px-3 py-4 text-[9px] font-mono text-muted-foreground italic text-center">No past PCE releases loaded</div>
              )}
            </div>
          </div>
        </div>

        {/* Row 3: Calendar footer */}
        <div className="grid grid-cols-2 gap-[1px] bg-border">
          <div className="p-3 bg-surface-deep">
            <div className="text-[9px] font-mono uppercase text-accent tracking-wider mb-1.5">UPCOMING PCE RELEASES</div>
            <div className="border border-border">
              {upcomingPce.length > 0 ? upcomingPce.map(e => (
                <div key={e.id} className="flex items-center gap-2 px-2 py-1.5 border-b border-border/40 hover:bg-surface-elevated">
                  <span className="text-[10px] font-mono text-accent w-22 shrink-0">{new Date(e.ts).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })}</span>
                  <span className="text-[9px] font-mono text-foreground flex-1 truncate">{e.label}</span>
                </div>
              )) : (
                <div className="px-3 py-2 text-[9px] font-mono text-muted-foreground italic">No upcoming PCE releases loaded</div>
              )}
            </div>
          </div>
          <div className="p-3 bg-surface-deep">
            <div className="text-[9px] font-mono uppercase text-accent tracking-wider mb-1.5">UPCOMING FOMC MEETINGS</div>
            <div className="border border-border">
              {upcomingFomc.slice(0, 5).map(e => (
                <div key={e.id} className="flex items-center gap-2 px-2 py-1.5 border-b border-border/40 hover:bg-surface-elevated">
                  <span className="text-[10px] font-mono text-accent w-22 shrink-0">{new Date(e.ts).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })}</span>
                  <span className="text-[9px] font-mono text-foreground flex-1 truncate">{e.label}</span>
                </div>
              ))}
              {upcomingFomc.length === 0 && <div className="px-3 py-2 text-[9px] font-mono text-muted-foreground italic">No upcoming FOMC events loaded</div>}
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

function BERow({ label, value, prev }: { label: string; value?: number | null; prev?: number | null }) {
  const chg = value != null && prev != null ? value - prev : null;
  return (
    <div className="flex items-center justify-between">
      <div>
        <div className="text-[10px] font-mono text-foreground">{label}</div>
        {prev != null && <div className="text-[7px] font-mono text-muted-foreground/50">Prior: {prev.toFixed(2)}%</div>}
      </div>
      <div className="text-right">
        <div className="text-[14px] font-mono font-bold tabular-nums text-foreground">{value != null ? `${value.toFixed(2)}%` : '—'}</div>
        {chg != null && <div className={`text-[9px] font-mono tabular-nums ${chg > 0 ? 'text-negative' : 'text-positive'}`}>{chg > 0 ? '+' : ''}{chg.toFixed(2)}pp</div>}
      </div>
    </div>
  );
}
