// CPI — Consumer Price Index deep-dive. Single-page Bloomberg layout.
import { useState, useEffect, useMemo } from 'react';
import { useFRED } from '@/hooks/useFRED';
import { useEconCalendar } from '@/hooks/useEconCalendar';
import { apiGet } from '@/lib/api';
import {
  LineChart, Line, XAxis, YAxis, Tooltip, ResponsiveContainer, ReferenceLine, CartesianGrid,
} from 'recharts';
import CmdShell from './_shell/CmdShell';

type HistObs = { date: string; value: number | null };

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

const COMPONENTS = [
  { key: 'cpi_shelter',   label: 'Shelter',             weight: 36.2, note: 'Largest driver — lags 12-18mo' },
  { key: 'cpi_services',  label: 'Services ex Energy',  weight: 25.7, note: '"Supercore" — sticky, Fed focus' },
  { key: 'cpi_transport', label: 'Transportation',       weight: 17.3, note: 'Vehicles, airfare, auto insurance' },
  { key: 'cpi_food',      label: 'Food & Beverages',    weight: 13.9, note: 'At-home + away-from-home' },
  { key: 'cpi_energy',    label: 'Energy',               weight: 7.0,  note: 'Gasoline, utilities; volatile' },
  { key: 'cpi_medical',   label: 'Medical Care',         weight: 6.5,  note: 'Services + commodities' },
  { key: 'cpi_rent',      label: 'Rent (Primary Res.)',  weight: 7.8,  note: 'Subset of Shelter basket' },
  { key: 'cpi_apparel',   label: 'Apparel',              weight: 2.5,  note: 'Clothing & footwear' },
];

export default function CPI() {
  const [histCpi,   setHistCpi]   = useState<HistObs[]>([]);
  const [histCore,  setHistCore]  = useState<HistObs[]>([]);
  const [recentObs, setRecentObs] = useState<HistObs[]>([]);
  const { byKey } = useFRED();
  const { events } = useEconCalendar();

  useEffect(() => {
    apiGet<{ observations: HistObs[] }>('/api/market/macro/fred-history?series=CPIAUCSL&limit=72')
      .then(d => setHistCpi([...(d.observations ?? [])].reverse()))
      .catch(() => {});
    apiGet<{ observations: HistObs[] }>('/api/market/macro/fred-history?series=CPILFESL&limit=72')
      .then(d => setHistCore([...(d.observations ?? [])].reverse()))
      .catch(() => {});
    apiGet<{ observations: HistObs[] }>('/api/market/macro/fred-history?series=CPIAUCSL&limit=5')
      .then(d => setRecentObs([...(d.observations ?? [])].reverse()))
      .catch(() => {});
  }, []);

  const cpiYoY  = useMemo(() => toYoY(histCpi), [histCpi]);
  const coreYoY = useMemo(() => toYoY(histCore), [histCore]);

  const chartData = useMemo(() => cpiYoY.map(p => {
    const cp = coreYoY.find(c => c.date === p.date);
    return { date: p.date, cpi: p.yoy, core: cp?.yoy ?? null };
  }), [cpiYoY, coreYoY]);

  // Trailing 3M annualized CPI from last 3 MoM changes
  const annualized3m = useMemo(() => {
    if (recentObs.length < 4) return null;
    const last4 = recentObs.slice(-4);
    const moms: number[] = [];
    for (let i = 1; i < last4.length; i++) {
      const prev = last4[i - 1].value;
      const curr = last4[i].value;
      if (prev != null && curr != null && prev > 0) moms.push((curr / prev - 1) * 100);
    }
    if (moms.length < 3) return null;
    return +(moms.reduce((a, b) => a + b, 0) / moms.length * 12).toFixed(2);
  }, [recentObs]);

  const cpi   = byKey['cpi_yoy'];
  const core  = byKey['core_cpi_yoy'];
  const be5y  = byKey['breakeven_5y'];
  const be10y = byKey['breakeven_10y'];

  const spread = cpi?.value != null && core?.value != null ? +(cpi.value - core.value).toFixed(2) : null;

  const pace =
    annualized3m == null     ? null
    : annualized3m < 2.0    ? 'BELOW TARGET'
    : annualized3m < 2.5    ? 'ON TARGET'
    : annualized3m < 3.5    ? 'ELEVATED'
    : 'ACCELERATING';
  const paceColor =
    pace === 'BELOW TARGET' || pace === 'ON TARGET' ? 'text-positive'
    : pace === 'ELEVATED'   ? 'text-accent'
    : 'text-negative';

  const maxContrib = useMemo(() => {
    const vals = COMPONENTS.map(c => {
      const v = byKey[c.key]?.value;
      return v != null ? Math.abs(v * c.weight / 100) : 0;
    });
    return Math.max(...vals, 0.01);
  }, [byKey]);

  const cpiCalendar = events
    .filter(e => e.kind === 'econ' && e.label.toUpperCase().includes('CPI'))
    .sort((a, b) => a.ts.localeCompare(b.ts));
  const upcoming = cpiCalendar.filter(e => new Date(e.ts) > new Date()).slice(0, 3);
  const past     = cpiCalendar.filter(e => new Date(e.ts) <= new Date()).slice(-6).reverse();

  function fmt(v: number | null | undefined, dec = 2) {
    return v != null ? `${v.toFixed(dec)}%` : '—';
  }
  function signFmt(v: number | null | undefined) {
    if (v == null) return '—';
    return `${v > 0 ? '+' : ''}${v.toFixed(2)}%`;
  }
  function chgClass(v: number | null | undefined) {
    return (v ?? 0) > 0 ? 'text-negative' : (v ?? 0) < 0 ? 'text-positive' : 'text-muted-foreground';
  }

  return (
    <CmdShell
      code="CPI" title="Consumer Price Index — Full Breakdown"
      kpis={
        <div className="grid grid-cols-7 gap-[1px] bg-border">
          <Kpi label="CPI YoY"   value={fmt(cpi?.value)}                sub={`Prior ${fmt(cpi?.prev)}`}               tone={chgClass(cpi?.change)} />
          <Kpi label="CORE CPI"  value={fmt(core?.value)}               sub={`Prior ${fmt(core?.prev)}`}              tone={chgClass(core?.change)} />
          <Kpi label="SHELTER"   value={fmt(byKey['cpi_shelter']?.value)}  sub="wt 36.2%"  tone={chgClass(byKey['cpi_shelter']?.change)} />
          <Kpi label="ENERGY"    value={fmt(byKey['cpi_energy']?.value)}   sub="wt 7.0%"   tone={chgClass(byKey['cpi_energy']?.change)} />
          <Kpi label="FOOD"      value={fmt(byKey['cpi_food']?.value)}     sub="wt 13.9%"  tone={chgClass(byKey['cpi_food']?.change)} />
          <Kpi label="MEDICAL"   value={fmt(byKey['cpi_medical']?.value)}  sub="wt 6.5%"   tone={chgClass(byKey['cpi_medical']?.change)} />
          <Kpi label="RENT"      value={fmt(byKey['cpi_rent']?.value)}     sub="wt 7.8%"   tone={chgClass(byKey['cpi_rent']?.change)} />
        </div>
      }
      footerLeft="Source: BLS · FRED · Monthly · Sub-components = YoY % change"
      footerRight={`Fed target: 2.0% · Core excl. food & energy · As of ${cpi?.date?.slice(0, 7) ?? '—'}`}
    >
      <div className="h-full overflow-y-auto">

        {/* ── Row 1: 24M chart left | component breakdown right ── */}
        <div className="grid grid-cols-[55%_45%] gap-[1px] bg-border border-b border-border">

          <div className="p-3 bg-surface-deep flex flex-col gap-1">
            <div className="text-[9px] font-mono uppercase text-muted-foreground tracking-wider">24-MONTH TREND · CPI vs CORE vs 2% TARGET</div>
            <div className="h-52">
              <ResponsiveContainer width="100%" height="100%">
                <LineChart data={chartData.slice(-24)} margin={{ top: 4, right: 16, left: 0, bottom: 0 }}>
                  <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border)/0.4)" />
                  <XAxis dataKey="date" tick={{ fill: 'hsl(var(--muted-foreground))', fontSize: 8, fontFamily: 'monospace' }} axisLine={false} tickLine={false} interval={3} />
                  <YAxis tick={{ fill: 'hsl(var(--muted-foreground))', fontSize: 8, fontFamily: 'monospace' }} axisLine={false} tickLine={false} tickFormatter={v => `${v}%`} />
                  <Tooltip contentStyle={TOOLTIP_STYLE} formatter={(v: number) => [`${v?.toFixed(2)}%`]} />
                  <ReferenceLine y={2} stroke="hsl(var(--accent))" strokeDasharray="4 3" strokeWidth={1} label={{ value: '2%', fill: 'hsl(var(--accent))', fontSize: 8, fontFamily: 'monospace' }} />
                  <Line type="monotone" dataKey="cpi"  stroke="hsl(var(--negative))" strokeWidth={1.5} dot={false} name="CPI YoY" />
                  <Line type="monotone" dataKey="core" stroke="hsl(var(--accent))"   strokeWidth={1.5} dot={false} name="Core CPI" strokeDasharray="4 2" />
                </LineChart>
              </ResponsiveContainer>
            </div>
            <div className="text-[8px] font-mono text-muted-foreground flex gap-4">
              <span className="flex items-center gap-1"><span className="inline-block w-5 h-0.5 bg-negative/80" />CPI YoY</span>
              <span className="flex items-center gap-1"><span className="inline-block w-5 h-0.5 bg-accent/80 border-dashed" />Core CPI (dashed)</span>
            </div>
          </div>

          <div className="bg-surface-deep flex flex-col">
            <div className="px-3 pt-3 pb-1 text-[9px] font-mono uppercase text-muted-foreground tracking-wider">COMPONENT BREAKDOWN · YoY % & CONTRIBUTION</div>
            <div className="grid px-3 py-1 border-b border-border text-[8px] font-mono uppercase text-muted-foreground/60"
              style={{ gridTemplateColumns: '1fr 42px 48px 52px 52px' }}>
              <span>Component</span>
              <span className="text-right">Wt%</span>
              <span className="text-right">YoY</span>
              <span className="text-right">Contrib</span>
              <span className="pl-2">Bar</span>
            </div>
            <div className="flex-1 overflow-y-auto">
              {COMPONENTS.map(c => {
                const ind    = byKey[c.key];
                const yoy    = ind?.value ?? null;
                const contrib = yoy != null ? +(yoy * c.weight / 100).toFixed(2) : null;
                const barPct = contrib != null ? Math.min(100, Math.abs(contrib) / maxContrib * 100) : 0;
                const isPos  = (yoy ?? 0) >= 0;
                return (
                  <div key={c.key}
                    className="grid items-center px-3 py-[5px] border-b border-border/30 hover:bg-surface-elevated text-[9px] font-mono"
                    style={{ gridTemplateColumns: '1fr 42px 48px 52px 52px' }}>
                    <div>
                      <div className="text-foreground font-medium leading-none">{c.label}</div>
                      <div className="text-muted-foreground/50 text-[7px] leading-none mt-0.5">{c.note}</div>
                    </div>
                    <span className="text-right text-muted-foreground tabular-nums">{c.weight.toFixed(1)}</span>
                    <span className={`text-right tabular-nums font-bold ${isPos ? 'text-negative' : 'text-positive'}`}>
                      {fmt(yoy)}
                    </span>
                    <span className={`text-right tabular-nums text-[8px] ${isPos ? 'text-negative/80' : 'text-positive/80'}`}>
                      {contrib != null ? `${contrib > 0 ? '+' : ''}${contrib.toFixed(2)}pp` : '—'}
                    </span>
                    <div className="pl-2 flex items-center h-3">
                      <div className="relative flex-1 h-1.5 bg-surface-deep border border-border/20">
                        {contrib != null && (
                          <div
                            className={`absolute inset-y-0 left-0 ${isPos ? 'bg-negative/55' : 'bg-positive/55'}`}
                            style={{ width: `${barPct}%` }}
                          />
                        )}
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
            <div className="px-3 py-1.5 border-t border-border/40 text-[7px] font-mono text-muted-foreground/40 italic">
              Contrib = YoY × Wt / 100 · Weights: BLS 2023–24 Urban Consumers
            </div>
          </div>
        </div>

        {/* ── Row 2: 60M history left | projections right ── */}
        <div className="grid grid-cols-[55%_45%] gap-[1px] bg-border border-b border-border">

          <div className="p-3 bg-surface-deep flex flex-col gap-1">
            <div className="text-[9px] font-mono uppercase text-muted-foreground tracking-wider">60-MONTH HISTORY · CPI & CORE YoY</div>
            <div className="h-48">
              <ResponsiveContainer width="100%" height="100%">
                <LineChart data={chartData} margin={{ top: 4, right: 16, left: 0, bottom: 0 }}>
                  <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border)/0.4)" />
                  <XAxis dataKey="date" tick={{ fill: 'hsl(var(--muted-foreground))', fontSize: 8, fontFamily: 'monospace' }} axisLine={false} tickLine={false} interval={5} />
                  <YAxis tick={{ fill: 'hsl(var(--muted-foreground))', fontSize: 8, fontFamily: 'monospace' }} axisLine={false} tickLine={false} tickFormatter={v => `${v}%`} />
                  <Tooltip contentStyle={TOOLTIP_STYLE} formatter={(v: number) => [`${v?.toFixed(2)}%`]} />
                  <ReferenceLine y={2} stroke="hsl(var(--accent))"          strokeDasharray="4 3" strokeWidth={1} label={{ value: '2%', fill: 'hsl(var(--accent))',  fontSize: 8 }} />
                  <ReferenceLine y={4} stroke="hsl(var(--negative)/0.35)"   strokeDasharray="2 3" strokeWidth={1} />
                  <Line type="monotone" dataKey="cpi"  stroke="hsl(var(--negative))" strokeWidth={1.5} dot={false} name="CPI YoY" />
                  <Line type="monotone" dataKey="core" stroke="hsl(var(--accent))"   strokeWidth={1}   dot={false} name="Core CPI" strokeDasharray="4 2" />
                </LineChart>
              </ResponsiveContainer>
            </div>
          </div>

          <div className="bg-surface-deep flex flex-col divide-y divide-border/40">

            <div className="px-3 pt-3 pb-1 text-[9px] font-mono uppercase text-muted-foreground tracking-wider shrink-0">
              PROJECTIONS & MARKET SIGNALS
            </div>

            {/* TIPS breakevens */}
            <div className="px-3 py-2.5">
              <div className="text-[8px] font-mono text-muted-foreground/60 uppercase mb-2">Market-Implied (TIPS Breakevens)</div>
              <div className="space-y-2">
                <ProjectionRow label="5Y TIPS Breakeven"  value={fmt(be5y?.value)}  desc="Market-implied avg CPI over 5 years" />
                <ProjectionRow label="10Y TIPS Breakeven" value={fmt(be10y?.value)} desc="Long-run inflation anchor (T10YIE)" />
              </div>
            </div>

            {/* Trailing 3M annualized */}
            <div className="px-3 py-2.5">
              <div className="text-[8px] font-mono text-muted-foreground/60 uppercase mb-2">Trend-Implied</div>
              <div className="flex items-center justify-between">
                <div>
                  <div className="text-[10px] font-mono text-foreground">Trailing 3M Annualized</div>
                  <div className="text-[7px] font-mono text-muted-foreground/50">Avg of last 3 MoM × 12</div>
                </div>
                <div className="text-right">
                  <div className={`text-[18px] font-mono font-bold tabular-nums leading-none ${
                    annualized3m != null && annualized3m > 2.5 ? 'text-negative'
                    : annualized3m != null && annualized3m < 2  ? 'text-positive'
                    : 'text-foreground'}`}>
                    {annualized3m != null ? `${annualized3m.toFixed(2)}%` : '—'}
                  </div>
                  {pace && <div className={`text-[8px] font-mono font-bold mt-0.5 ${paceColor}`}>{pace}</div>}
                </div>
              </div>
            </div>

            {/* Key differentials */}
            <div className="px-3 py-2.5">
              <div className="text-[8px] font-mono text-muted-foreground/60 uppercase mb-2">Key Differentials</div>
              <div className="space-y-2">
                <ProjectionRow
                  label="Headline vs Core Spread"
                  value={spread != null ? signFmt(spread) : '—'}
                  desc="Transitory (food/energy) vs sticky components"
                />
                <ProjectionRow
                  label="Supercore (Services ex Nrg)"
                  value={fmt(byKey['cpi_services']?.value)}
                  desc="Persistent inflation gauge; Fed watches closely"
                />
              </div>
            </div>

            {/* Breakeven bar chart */}
            <div className="px-3 py-2.5 flex-1">
              <div className="text-[8px] font-mono text-muted-foreground/60 uppercase mb-2">BREAKEVEN vs 2% TARGET</div>
              {[
                { label: '5Y BE',   val: be5y?.value },
                { label: '10Y BE',  val: be10y?.value },
                { label: '3M Ann.', val: annualized3m },
              ].map(r => (
                <div key={r.label} className="flex items-center gap-2 mb-2">
                  <span className="text-[8px] font-mono text-muted-foreground w-12 shrink-0">{r.label}</span>
                  <div className="flex-1 h-2 bg-surface-deep border border-border/20 relative">
                    {r.val != null && (
                      <>
                        <div className="absolute inset-y-0 bg-accent/30" style={{ left: '40%', width: '1px' }} />
                        <div
                          className={`absolute inset-y-0 left-0 ${r.val > 2.5 ? 'bg-negative/50' : r.val < 1.5 ? 'bg-positive/50' : 'bg-accent/50'}`}
                          style={{ width: `${Math.min(100, (r.val / 5) * 100)}%` }}
                        />
                      </>
                    )}
                  </div>
                  <span className={`text-[9px] font-mono font-bold tabular-nums w-12 text-right shrink-0 ${
                    r.val != null && r.val > 2.5 ? 'text-negative' : r.val != null && r.val < 2 ? 'text-positive' : 'text-foreground'}`}>
                    {r.val != null ? `${r.val.toFixed(2)}%` : '—'}
                  </span>
                </div>
              ))}
              <div className="text-[7px] font-mono text-muted-foreground/40">▲ 2% target at 40% bar · FRED T5YIE / T10YIE</div>
            </div>
          </div>
        </div>

        {/* ── Row 3: Release calendar (two-column) ── */}
        <div className="grid grid-cols-2 gap-[1px] bg-border">

          <div className="p-3 bg-surface-deep">
            <div className="text-[9px] font-mono uppercase text-accent tracking-wider mb-1.5">UPCOMING RELEASES</div>
            <div className="border border-border">
              {upcoming.map(e => (
                <div key={e.id} className="flex items-center gap-2 px-2 py-1.5 border-b border-border/40 hover:bg-surface-elevated">
                  <span className="text-[10px] font-mono text-accent w-20 shrink-0">
                    {new Date(e.ts).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })}
                  </span>
                  <span className="text-[9px] font-mono text-foreground flex-1 truncate">{e.label}</span>
                  {e.forecast != null && (
                    <span className="text-[8px] font-mono text-muted-foreground shrink-0">Est: {e.forecast}{e.unit ?? ''}</span>
                  )}
                </div>
              ))}
              {upcoming.length === 0 && (
                <div className="px-2 py-2 text-[9px] font-mono text-muted-foreground italic">No upcoming releases loaded</div>
              )}
            </div>
            <div className="text-[7px] font-mono text-muted-foreground/50 mt-1.5 italic">BLS releases CPI ~2 weeks after reference month</div>
          </div>

          <div className="p-3 bg-surface-deep">
            <div className="text-[9px] font-mono uppercase text-muted-foreground tracking-wider mb-1.5">RECENT RELEASES · BEAT / MISS</div>
            <div className="border border-border">
              {past.map(e => {
                const surprise = e.actual != null && e.forecast != null ? e.actual - e.forecast : null;
                return (
                  <div key={e.id} className="flex items-center gap-2 px-2 py-1.5 border-b border-border/40 hover:bg-surface-elevated">
                    <span className="text-[9px] font-mono text-muted-foreground w-20 shrink-0">
                      {new Date(e.ts).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })}
                    </span>
                    <span className="text-[9px] font-mono text-foreground flex-1 truncate">{e.label}</span>
                    {e.actual   != null && <span className="text-[9px] font-mono font-bold text-foreground tabular-nums shrink-0">A: {e.actual}{e.unit ?? ''}</span>}
                    {e.forecast != null && <span className="text-[8px] font-mono text-muted-foreground tabular-nums shrink-0">E: {e.forecast}{e.unit ?? ''}</span>}
                    {surprise   != null && (
                      <span className={`text-[9px] font-mono font-bold tabular-nums shrink-0 ${surprise > 0 ? 'text-negative' : 'text-positive'}`}>
                        {surprise > 0 ? '+' : ''}{surprise.toFixed(2)}
                      </span>
                    )}
                  </div>
                );
              })}
              {past.length === 0 && (
                <div className="px-2 py-2 text-[9px] font-mono text-muted-foreground italic">No historical releases loaded</div>
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
    <div className="bg-surface-deep px-2 py-1.5">
      <div className="text-[8px] font-mono uppercase text-muted-foreground tracking-wider">{label}</div>
      <div className={`text-lg font-mono font-bold tabular-nums leading-tight ${tone}`}>{value}</div>
      <div className="text-[8px] font-mono text-muted-foreground/60">{sub}</div>
    </div>
  );
}

function ProjectionRow({ label, value, desc }: { label: string; value: string; desc: string }) {
  return (
    <div className="flex items-center justify-between gap-2">
      <div className="min-w-0">
        <div className="text-[10px] font-mono text-foreground leading-none truncate">{label}</div>
        <div className="text-[7px] font-mono text-muted-foreground/50 leading-none mt-0.5">{desc}</div>
      </div>
      <div className="text-[15px] font-mono font-bold tabular-nums text-foreground shrink-0">{value}</div>
    </div>
  );
}
