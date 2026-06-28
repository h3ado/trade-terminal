// UNEMP — Unemployment & Labor Market. Single-page Bloomberg layout.
import { useState, useEffect, useMemo } from 'react';
import { useFRED } from '@/hooks/useFRED';
import { useEconCalendar } from '@/hooks/useEconCalendar';
import { apiGet } from '@/lib/api';
import {
  LineChart, Line, BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, ReferenceLine, CartesianGrid,
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

type BadgeTone = 'text-positive' | 'text-negative' | 'text-accent' | 'text-muted-foreground';

function laborStatus(key: string, val: number | null | undefined): { label: string; tone: BadgeTone } {
  if (val == null) return { label: '—', tone: 'text-muted-foreground' };
  switch (key) {
    case 'u3':   return val < 4.5 ? { label: 'HEALTHY', tone: 'text-positive' } : { label: 'ELEVATED', tone: 'text-negative' };
    case 'u6':   return val < 8   ? { label: 'HEALTHY', tone: 'text-positive' } : { label: 'ELEVATED', tone: 'text-negative' };
    case 'part': return val > 63  ? { label: 'STRONG',  tone: 'text-positive' } : val > 61 ? { label: 'NORMAL', tone: 'text-muted-foreground' } : { label: 'WEAK', tone: 'text-negative' };
    case 'epop': return val > 80  ? { label: 'STRONG',  tone: 'text-positive' } : val > 77 ? { label: 'NORMAL', tone: 'text-muted-foreground' } : { label: 'WEAK', tone: 'text-negative' };
    case 'icsa': return val < 250 ? { label: 'LOW',     tone: 'text-positive' } : val < 350 ? { label: 'NORMAL', tone: 'text-muted-foreground' } : { label: 'RISING', tone: 'text-negative' };
    default: return { label: '—', tone: 'text-muted-foreground' };
  }
}

export default function UNEMP() {
  const [histU3,     setHistU3]     = useState<HistObs[]>([]);
  const [histU6,     setHistU6]     = useState<HistObs[]>([]);
  const [histClaims, setHistClaims] = useState<HistObs[]>([]);
  const { byKey } = useFRED();
  const { events } = useEconCalendar();

  const u3     = byKey['unemployment'];
  const u6     = byKey['u6_rate'];
  const part   = byKey['participation'];
  const claims = byKey['initial_claims'];
  const cont   = byKey['cont_claims'];
  const epop   = byKey['epop_prime'];
  const hours  = byKey['avg_weekly_hrs'];

  useEffect(() => {
    apiGet<{ observations: HistObs[] }>('/api/market/macro/fred-history?series=UNRATE&limit=60')
      .then(d => setHistU3([...(d.observations ?? [])].reverse()))
      .catch(() => {});
    apiGet<{ observations: HistObs[] }>('/api/market/macro/fred-history?series=U6RATE&limit=60')
      .then(d => setHistU6([...(d.observations ?? [])].reverse()))
      .catch(() => {});
    apiGet<{ observations: HistObs[] }>('/api/market/macro/fred-history?series=ICSA&limit=60')
      .then(d => setHistClaims([...(d.observations ?? [])].reverse()))
      .catch(() => {});
  }, []);

  const overviewData = useMemo(() => histU3.slice(-24).map(o => {
    const u6pt = histU6.find(x => x.date === o.date);
    return { date: o.date.slice(0, 7), u3: o.value, u6: u6pt?.value ?? null };
  }), [histU3, histU6]);

  const trendData = useMemo(() => histU3.map(o => {
    const u6pt = histU6.find(x => x.date === o.date);
    return { date: o.date.slice(0, 7), u3: o.value, u6: u6pt?.value ?? null };
  }), [histU3, histU6]);

  const claimsData = useMemo(() =>
    histClaims.slice(-52).map(o => ({ date: o.date.slice(0, 10), claims: o.value })),
    [histClaims]
  );

  const laborCalendar = events.filter(e =>
    e.kind === 'econ' && (e.label.toUpperCase().includes('UNEMPLOYMENT') || e.label.toUpperCase().includes('EMPLOYMENT SITUATION') || e.label.toUpperCase().includes('INITIAL CLAIMS'))
  ).sort((a, b) => a.ts.localeCompare(b.ts));
  const upcoming = laborCalendar.filter(e => new Date(e.ts) > new Date()).slice(0, 3);
  const past     = laborCalendar.filter(e => new Date(e.ts) <= new Date()).slice(-6).reverse();

  function fmt(v?: number | null, dec = 1) { return v != null ? `${v.toFixed(dec)}%` : '—'; }
  function fmtK(v?: number | null) {
    if (v == null) return '—';
    return v >= 1000 ? `${(v / 1000).toFixed(1)}M` : `${v.toFixed(0)}k`;
  }

  const SCORECARD = [
    { key: 'u3',   label: 'U-3 Unemployment',      value: u3?.value,     display: fmt(u3?.value),     desc: 'Headline; full employment ≈ 4.5%' },
    { key: 'u6',   label: 'U-6 Broad Rate',         value: u6?.value,     display: fmt(u6?.value),     desc: 'Includes marginally attached + part-time for econ reasons' },
    { key: 'part', label: 'Participation Rate',      value: part?.value,   display: fmt(part?.value),   desc: 'Share of population in labor force; demographic headwinds' },
    { key: 'epop', label: 'Prime-Age EPOP (25-54)', value: epop?.value,   display: fmt(epop?.value),   desc: 'Less distorted by aging; best gauge of core labor strength' },
    { key: 'icsa', label: 'Initial Claims (wkly)',   value: claims?.value, display: fmtK(claims?.value), desc: 'Weekly new filings; <300k = healthy, >400k = concern' },
  ];

  return (
    <CmdShell
      code="UNEMP" title="Unemployment & Labor Market"
      kpis={
        <div className="grid grid-cols-7 gap-[1px] bg-border">
          <Kpi label="U-3 RATE"      value={fmt(u3?.value)}    sub={`Prior ${fmt(u3?.prev)}`}    tone={u3?.value != null && u3.value < 4.5 ? 'text-positive' : 'text-negative'} />
          <Kpi label="U-6 RATE"      value={fmt(u6?.value)}    sub="Broad unemployment"          tone="text-foreground" />
          <Kpi label="PARTICIPATION" value={fmt(part?.value)}  sub="Labor force %"               tone="text-foreground" />
          <Kpi label="PRIME EPOP"    value={fmt(epop?.value)}  sub="Age 25-54 empl. rate"        tone="text-foreground" />
          <Kpi label="INIT CLAIMS"   value={fmtK(claims?.value)} sub="Weekly (000s)"             tone="text-foreground" />
          <Kpi label="CONT CLAIMS"   value={fmtK(cont?.value)} sub="Continuing claims"           tone="text-foreground" />
          <Kpi label="AVG HRS/WK"    value={hours?.value != null ? `${hours.value.toFixed(1)}h` : '—'} sub="Avg weekly hours" tone="text-foreground" />
        </div>
      }
      footerLeft="Source: BLS · FRED UNRATE / U6RATE / CIVPART / LNS12300060 / ICSA · Monthly/Weekly"
      footerRight={`Full employment threshold ≈ 4.0–4.5% · As of ${u3?.date?.slice(0, 7) ?? '—'}`}
    >
      <div className="h-full overflow-y-auto">

        {/* Row 1: 24M chart + scorecard */}
        <div className="grid grid-cols-[55%_45%] gap-[1px] bg-border border-b border-border">
          <div className="p-3 bg-surface-deep flex flex-col gap-1">
            <div className="text-[9px] font-mono uppercase text-muted-foreground tracking-wider">24-MONTH · U-3 vs U-6 UNEMPLOYMENT RATE</div>
            <div className="h-52">
              <ResponsiveContainer width="100%" height="100%">
                <LineChart data={overviewData} margin={{ top: 4, right: 16, left: 0, bottom: 0 }}>
                  <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border)/0.4)" />
                  <XAxis dataKey="date" tick={{ fill: 'hsl(var(--muted-foreground))', fontSize: 8, fontFamily: 'monospace' }} axisLine={false} tickLine={false} interval={3} />
                  <YAxis tick={{ fill: 'hsl(var(--muted-foreground))', fontSize: 8, fontFamily: 'monospace' }} axisLine={false} tickLine={false} tickFormatter={v => `${v}%`} />
                  <Tooltip contentStyle={TOOLTIP_STYLE} formatter={(v: number) => [`${v?.toFixed(1)}%`]} />
                  <ReferenceLine y={4.5} stroke="hsl(var(--accent))" strokeDasharray="4 3" strokeWidth={1} label={{ value: 'Full emp ~4.5%', fill: 'hsl(var(--accent))', fontSize: 8, fontFamily: 'monospace' }} />
                  <Line type="monotone" dataKey="u3" stroke="hsl(var(--accent))"              strokeWidth={1.5} dot={false} name="U-3" />
                  <Line type="monotone" dataKey="u6" stroke="hsl(var(--muted-foreground)/0.7)" strokeWidth={1}   dot={false} name="U-6" strokeDasharray="4 2" />
                </LineChart>
              </ResponsiveContainer>
            </div>
            <div className="text-[8px] font-mono text-muted-foreground flex gap-4">
              <span className="flex items-center gap-1"><span className="inline-block w-5 h-0.5 bg-accent/80" />U-3 (Headline)</span>
              <span className="flex items-center gap-1"><span className="inline-block w-5 h-0.5 bg-muted-foreground/60" />U-6 (Broad, dashed)</span>
            </div>
          </div>

          <div className="bg-surface-deep flex flex-col">
            <div className="px-3 pt-3 pb-1 text-[9px] font-mono uppercase text-muted-foreground tracking-wider">LABOR MARKET HEALTH SCORECARD</div>
            <div className="flex-1 border-t border-border/40">
              {SCORECARD.map(s => {
                const status = laborStatus(s.key, s.value);
                return (
                  <div key={s.key} className="flex items-center gap-3 px-3 py-2.5 border-b border-border/30 hover:bg-surface-elevated">
                    <div className="flex-1 min-w-0">
                      <div className="text-[10px] font-mono font-bold text-foreground leading-none">{s.label}</div>
                      <div className="text-[7px] font-mono text-muted-foreground/50 leading-tight mt-0.5">{s.desc}</div>
                    </div>
                    <div className="flex items-center gap-2 shrink-0">
                      <span className="text-[12px] font-mono font-bold tabular-nums text-foreground">{s.display}</span>
                      <span className={`text-[8px] font-mono font-bold px-1.5 py-0.5 border ${status.tone} ${status.tone === 'text-positive' ? 'border-positive/30 bg-positive/5' : status.tone === 'text-negative' ? 'border-negative/30 bg-negative/5' : 'border-border/40 bg-surface-deep'}`}>
                        {status.label}
                      </span>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        </div>

        {/* Row 2: 60M trend + claims */}
        <div className="grid grid-cols-[55%_45%] gap-[1px] bg-border border-b border-border">
          <div className="p-3 bg-surface-deep flex flex-col gap-1">
            <div className="text-[9px] font-mono uppercase text-muted-foreground tracking-wider">60-MONTH HISTORY · U-3 & U-6</div>
            <div className="h-44">
              <ResponsiveContainer width="100%" height="100%">
                <LineChart data={trendData} margin={{ top: 4, right: 16, left: 0, bottom: 0 }}>
                  <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border)/0.4)" />
                  <XAxis dataKey="date" tick={{ fill: 'hsl(var(--muted-foreground))', fontSize: 8, fontFamily: 'monospace' }} axisLine={false} tickLine={false} interval={5} />
                  <YAxis tick={{ fill: 'hsl(var(--muted-foreground))', fontSize: 8, fontFamily: 'monospace' }} axisLine={false} tickLine={false} tickFormatter={v => `${v}%`} />
                  <Tooltip contentStyle={TOOLTIP_STYLE} formatter={(v: number) => [`${v?.toFixed(1)}%`]} />
                  <ReferenceLine y={4.5} stroke="hsl(var(--accent)/0.5)" strokeDasharray="4 3" strokeWidth={1} />
                  <Line type="monotone" dataKey="u3" stroke="hsl(var(--accent))"               strokeWidth={1.5} dot={false} name="U-3" />
                  <Line type="monotone" dataKey="u6" stroke="hsl(var(--muted-foreground)/0.65)" strokeWidth={1}   dot={false} name="U-6" strokeDasharray="4 2" />
                </LineChart>
              </ResponsiveContainer>
            </div>
          </div>

          <div className="bg-surface-deep flex flex-col">
            <div className="px-3 pt-3 pb-1 text-[9px] font-mono uppercase text-muted-foreground tracking-wider">JOBLESS CLAIMS · LEADING INDICATOR</div>
            <div className="grid grid-cols-2 gap-[1px] bg-border mx-3 mt-2 shrink-0">
              <div className="bg-surface-deep px-3 py-2">
                <div className="text-[8px] font-mono uppercase text-muted-foreground">Init Claims</div>
                <div className="text-[18px] font-mono font-bold text-foreground tabular-nums">{fmtK(claims?.value)}</div>
                <div className="text-[7.5px] font-mono text-muted-foreground/60">Prior: {fmtK(claims?.prev)}</div>
              </div>
              <div className="bg-surface-deep px-3 py-2">
                <div className="text-[8px] font-mono uppercase text-muted-foreground">Cont Claims</div>
                <div className="text-[18px] font-mono font-bold text-foreground tabular-nums">{fmtK(cont?.value)}</div>
                <div className="text-[7.5px] font-mono text-muted-foreground/60">People drawing benefits</div>
              </div>
            </div>
            <div className="flex-1 px-3 pt-2 pb-1 min-h-0">
              <div className="text-[8px] font-mono text-muted-foreground/60 mb-1">Initial Claims — 52 Weeks (000s)</div>
              <div className="h-28">
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={claimsData} margin={{ top: 2, right: 4, left: 0, bottom: 0 }}>
                    <XAxis dataKey="date" hide />
                    <YAxis tick={{ fill: 'hsl(var(--muted-foreground))', fontSize: 8, fontFamily: 'monospace' }} axisLine={false} tickLine={false} tickFormatter={v => `${v}k`} width={32} />
                    <Tooltip contentStyle={TOOLTIP_STYLE} formatter={(v: number) => [`${v?.toFixed(0)}k`, 'Claims']} />
                    <Bar dataKey="claims" fill="hsl(var(--accent)/0.55)" maxBarSize={6} />
                  </BarChart>
                </ResponsiveContainer>
              </div>
            </div>
          </div>
        </div>

        {/* Row 3: Calendar */}
        <div className="grid grid-cols-2 gap-[1px] bg-border">
          <div className="p-3 bg-surface-deep">
            <div className="text-[9px] font-mono uppercase text-accent tracking-wider mb-1.5">UPCOMING LABOR RELEASES</div>
            <div className="border border-border">
              {upcoming.map(e => (
                <div key={e.id} className="flex items-center gap-2 px-2 py-1.5 border-b border-border/40 hover:bg-surface-elevated">
                  <span className="text-[10px] font-mono text-accent w-20 shrink-0">{new Date(e.ts).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })}</span>
                  <span className="text-[9px] font-mono text-foreground flex-1 truncate">{e.label}</span>
                  {e.forecast != null && <span className="text-[8px] font-mono text-muted-foreground shrink-0">E: {e.forecast}</span>}
                </div>
              ))}
              {upcoming.length === 0 && <div className="px-2 py-2 text-[9px] font-mono text-muted-foreground italic">No upcoming releases loaded</div>}
            </div>
            <div className="text-[7px] font-mono text-muted-foreground/50 mt-1.5 italic">Employment situation: first Friday. Initial claims: every Thursday.</div>
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
                    {surprise   != null && <span className={`text-[9px] font-mono font-bold tabular-nums shrink-0 ${surprise < 0 ? 'text-positive' : 'text-negative'}`}>{surprise > 0 ? '+' : ''}{surprise.toFixed(1)}</span>}
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
      <div className={`text-base font-mono font-bold tabular-nums leading-tight ${tone}`}>{value}</div>
      <div className="text-[8px] font-mono text-muted-foreground/60">{sub}</div>
    </div>
  );
}
