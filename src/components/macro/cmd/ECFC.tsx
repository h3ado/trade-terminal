// ECFC — Economic Forecast Matrix.
// Sub-tabs: CONSENSUS / DISPERSION / ERROR / PATH. 2024 → 2030 horizon.
import { useMemo, useState } from 'react';
import { useWorldBank } from '@/hooks/useWorldBank';
import { useMacroCountry } from '@/contexts/MacroCountryContext';
import { COUNTRY_TO_ISO3, CENTRAL_BANKS } from '@/data/centralBanks';
import { FC_COUNTRIES, FC_METRICS, FC_YEARS, type FcMetric, type FcCountry } from '@/data/macro/weoForecasts';
import CmdShell from './_shell/CmdShell';
import CmdTabs from './_shell/CmdTabs';
import { Sparkline, Histogram } from './_shell/charts';
import { ExpandableResponsiveContainer } from '@/components/shared/ExpandChart';
import {
  LineChart,
  Line,
  Area,
  AreaChart,
  ComposedChart,
  XAxis,
  YAxis,
  Tooltip,
  ReferenceLine,
  CartesianGrid,
} from 'recharts';

type Tab = 'consensus' | 'dispersion' | 'error' | 'path';
const TABS: ReadonlyArray<{ id: Tab; label: string }> = [
  { id: 'consensus',  label: 'CONSENSUS' },
  { id: 'dispersion', label: 'DISPERSION' },
  { id: 'error',      label: 'FORECAST ERROR' },
  { id: 'path',       label: 'PATH (FOCUS)' },
];

function tone(value: number, mean: number, favorHigh: boolean) {
  const d = (value - mean) * (favorHigh ? 1 : -1);
  if (Math.abs(d) < 0.1) return 'text-foreground';
  return d > 0 ? 'text-positive' : 'text-negative';
}

export default function ECFC() {
  const wb = useWorldBank();
  const { selectedCountry } = useMacroCountry();
  const [tab, setTab] = useState<Tab>('consensus');
  const [metric, setMetric] = useState<FcMetric>('gdp');

  const meta = FC_METRICS.find(m => m.key === metric)!;
  const focus = FC_COUNTRIES.find(c => c.cc === selectedCountry) ?? FC_COUNTRIES[0];

  const yearMeans = useMemo(() => {
    return FC_YEARS.map(y => {
      const arr = FC_COUNTRIES.map(c => c.metrics[metric][y].mean);
      return arr.reduce((s, v) => s + v, 0) / arr.length;
    });
  }, [metric]);

  const realizedFor = (cc: string): number | null => {
    if (metric === 'rate') return CENTRAL_BANKS.find(c => c.code === cc)?.rate ?? null;
    const wbKey = metric === 'gdp' ? 'gdp_growth' : metric === 'cpi' ? 'inflation' : metric === 'unemp' ? 'unemployment' : metric === 'ca' ? 'current_acct' : null;
    if (!wbKey) return null;
    return wb.byKey[wbKey]?.byIso3[COUNTRY_TO_ISO3[cc]]?.value ?? null;
  };

  return (
    <CmdShell
      code="ECFC" title="Economic Forecast Matrix"
      headerRight={
        <div className="flex items-center gap-1">
          {FC_METRICS.map(m => (
            <button key={m.key} onClick={() => setMetric(m.key)} className={`px-2 py-0.5 text-[10px] font-mono uppercase border ${metric === m.key ? 'bg-accent text-background border-accent' : 'border-border text-muted-foreground hover:text-foreground'}`}>{m.key.toUpperCase()}</button>
          ))}
        </div>
      }
      tabs={<CmdTabs tabs={TABS} active={tab} onChange={setTab} right={<span className="text-[9px] font-mono text-muted-foreground uppercase">Survey: Jun-2026 · n≈45 panelists · 2024/25 realized</span>} />}
      kpis={
        <div className="px-2 py-1 flex items-center gap-3 text-[10px] font-mono">
          <span className="text-accent uppercase tracking-wider">{meta.label}</span>
          <span className="text-muted-foreground">Unit: {meta.unit}</span>
          <span className="text-muted-foreground">Favor: {meta.favorHigh ? 'higher' : 'lower'}</span>
          <span className="text-muted-foreground ml-auto">Countries: {FC_COUNTRIES.length}</span>
        </div>
      }
      footerLeft={<>ECFC &lt;GO&gt; · {tab.toUpperCase()} view · {metric.toUpperCase()}</>}
      footerRight={<>Color: green = favorable vs G14 mean · σ = std. dev.</>}
    >
      <div className="h-full overflow-auto">
        {tab === 'consensus' && <ConsensusView metric={metric} meta={meta} yearMeans={yearMeans} realizedFor={realizedFor} selectedCountry={selectedCountry} />}
        {tab === 'dispersion' && <DispersionView metric={metric} />}
        {tab === 'error' && <ErrorView metric={metric} meta={meta} />}
        {tab === 'path' && <PathView focus={focus} metric={metric} meta={meta} realized={realizedFor(focus.cc)} />}
      </div>
    </CmdShell>
  );
}

function ConsensusView({ metric, meta, yearMeans, realizedFor, selectedCountry }: { metric: FcMetric; meta: typeof FC_METRICS[number]; yearMeans: number[]; realizedFor: (cc: string) => number | null; selectedCountry: string }) {
  return (
    <table className="w-full border-collapse">
      <thead className="sticky top-0 bg-surface-deep z-10">
        <tr className="border-b border-border">
          <th rowSpan={2} className="px-2 py-1 text-left text-[9px] font-mono font-bold uppercase text-muted-foreground border-r border-border sticky left-0 bg-surface-deep">Country</th>
          <th rowSpan={2} className="px-2 py-1 text-right text-[9px] font-mono font-bold uppercase text-muted-foreground border-r border-border">Realized</th>
          {FC_YEARS.map(y => (
            <th key={y} colSpan={4} className={`px-2 py-0.5 text-center text-[9px] font-mono font-bold uppercase tracking-wider border-r border-border ${y === '2024' || y === '2025' ? 'text-muted-foreground' : 'text-accent'}`}>
              {y}{(y === '2024' || y === '2025') ? '' : 'E'}
            </th>
          ))}
        </tr>
        <tr className="border-b border-border">
          {FC_YEARS.map(y => (
            <>
              <th key={y + 'm'} className="px-2 py-0.5 text-right text-[8px] font-mono uppercase text-muted-foreground">Mean</th>
              <th key={y + 'l'} className="px-2 py-0.5 text-right text-[8px] font-mono uppercase text-muted-foreground">Low</th>
              <th key={y + 'h'} className="px-2 py-0.5 text-right text-[8px] font-mono uppercase text-muted-foreground">High</th>
              <th key={y + 's'} className="px-2 py-0.5 text-right text-[8px] font-mono uppercase text-muted-foreground border-r border-border">σ</th>
            </>
          ))}
        </tr>
      </thead>
      <tbody>
        {FC_COUNTRIES.map(c => {
          const sel = c.cc === selectedCountry;
          const realized = realizedFor(c.cc);
          return (
            <tr key={c.cc} className={`border-b border-border/40 hover:bg-surface-elevated ${sel ? 'bg-surface-elevated/60' : ''}`}>
              <td className="px-2 py-0.5 text-[11px] font-mono border-r border-border sticky left-0 bg-background"><span className="mr-1">{c.flag}</span><span className={`font-bold ${sel ? 'text-accent' : ''}`}>{c.cc}</span></td>
              <td className="px-2 py-0.5 text-right text-[11px] font-mono tabular-nums text-muted-foreground border-r border-border">{realized != null ? realized.toFixed(2) : '—'}</td>
              {FC_YEARS.map((y, yi) => {
                const fc = c.metrics[metric][y];
                const t = tone(fc.mean, yearMeans[yi], meta.favorHigh);
                return (
                  <>
                    <td className={`px-2 py-0.5 text-right text-[11px] font-mono tabular-nums font-bold ${t}`}>{fc.mean.toFixed(2)}</td>
                    <td className="px-2 py-0.5 text-right text-[11px] font-mono tabular-nums text-muted-foreground">{fc.low.toFixed(2)}</td>
                    <td className="px-2 py-0.5 text-right text-[11px] font-mono tabular-nums text-muted-foreground">{fc.high.toFixed(2)}</td>
                    <td className="px-2 py-0.5 text-right text-[11px] font-mono tabular-nums text-muted-foreground border-r border-border">{fc.sd.toFixed(2)}</td>
                  </>
                );
              })}
            </tr>
          );
        })}
        <tr className="border-t-2 border-accent bg-surface-deep">
          <td className="px-2 py-0.5 text-[10px] font-mono font-bold text-accent uppercase border-r border-border sticky left-0 bg-surface-deep">G14 MEAN</td>
          <td className="px-2 py-0.5 border-r border-border" />
          {yearMeans.map((m, i) => (
            <>
              <td key={i + 'mm'} className="px-2 py-0.5 text-right text-[11px] font-mono font-bold tabular-nums text-accent">{m.toFixed(2)}</td>
              <td colSpan={3} className="border-r border-border" />
            </>
          ))}
        </tr>
      </tbody>
    </table>
  );
}

function DispersionView({ metric }: { metric: FcMetric }) {
  // For each year ≥ 2026, draw a histogram of mean forecasts across countries.
  const years = FC_YEARS.filter(y => Number(y) >= 2026);
  return (
    <div className="p-2 grid grid-cols-1 md:grid-cols-3 lg:grid-cols-5 gap-2">
      {years.map(y => {
        const data = FC_COUNTRIES.map(c => c.metrics[metric][y].mean);
        const mean = data.reduce((s, v) => s + v, 0) / data.length;
        const min = Math.min(...data), max = Math.max(...data);
        return (
          <div key={y} className="border border-border bg-surface-deep p-2">
            <div className="flex items-center justify-between mb-1">
              <span className="text-[10px] font-mono font-bold text-accent uppercase">{y}E</span>
              <span className="text-[9px] font-mono text-muted-foreground tabular-nums">μ {mean.toFixed(2)}</span>
            </div>
            <Histogram data={data} bins={8} w={180} h={60} markValue={mean} />
            <div className="mt-1 flex justify-between text-[9px] font-mono text-muted-foreground tabular-nums">
              <span>min {min.toFixed(2)}</span>
              <span>max {max.toFixed(2)}</span>
            </div>
          </div>
        );
      })}
    </div>
  );
}

function ErrorView({ metric, meta }: { metric: FcMetric; meta: typeof FC_METRICS[number] }) {
  // Compare forecasted 2024/2025 against the realized print (already encoded in seed).
  return (
    <table className="w-full border-collapse">
      <thead className="sticky top-0 bg-surface-deep z-10">
        <tr className="border-b border-border">
          <th className="px-2 py-1 text-left text-[9px] font-mono font-bold uppercase text-muted-foreground">Country</th>
          {(['2024', '2025'] as const).map(y => (
            <>
              <th colSpan={3} className="px-2 py-1 text-center text-[9px] font-mono font-bold uppercase text-accent border-l border-border">{y}</th>
            </>
          ))}
        </tr>
        <tr className="border-b border-border">
          <th className="px-2 py-0.5" />
          {(['2024', '2025'] as const).map(y => (
            <>
              <th key={y + 'f'} className="px-2 py-0.5 text-right text-[8px] font-mono uppercase text-muted-foreground border-l border-border">Forecast</th>
              <th key={y + 'a'} className="px-2 py-0.5 text-right text-[8px] font-mono uppercase text-muted-foreground">Actual</th>
              <th key={y + 'e'} className="px-2 py-0.5 text-right text-[8px] font-mono uppercase text-muted-foreground">Error</th>
            </>
          ))}
        </tr>
      </thead>
      <tbody>
        {FC_COUNTRIES.map(c => (
          <tr key={c.cc} className="border-b border-border/40 hover:bg-surface-elevated">
            <td className="px-2 py-0.5 text-[11px] font-mono"><span className="mr-1">{c.flag}</span><span className="font-bold">{c.cc}</span> <span className="text-muted-foreground">{c.name}</span></td>
            {(['2024', '2025'] as const).map(y => {
              const fc = c.metrics[metric][y];
              const r = fc.realized;
              const err = r != null ? r - fc.mean : null;
              const tonecls = err == null ? 'text-muted-foreground' : Math.abs(err) < 0.2 ? 'text-foreground' : (meta.favorHigh ? err > 0 : err < 0) ? 'text-positive' : 'text-negative';
              return (
                <>
                  <td className="px-2 py-0.5 text-right text-[11px] font-mono tabular-nums text-muted-foreground border-l border-border">{fc.mean.toFixed(2)}</td>
                  <td className="px-2 py-0.5 text-right text-[11px] font-mono tabular-nums text-foreground">{r != null ? r.toFixed(2) : '—'}</td>
                  <td className={`px-2 py-0.5 text-right text-[11px] font-mono tabular-nums font-bold ${tonecls}`}>{err == null ? '—' : `${err >= 0 ? '+' : ''}${err.toFixed(2)}`}</td>
                </>
              );
            })}
          </tr>
        ))}
      </tbody>
    </table>
  );
}

function PathView({ focus, metric, meta, realized }: { focus: FcCountry; metric: FcMetric; meta: typeof FC_METRICS[number]; realized: number | null }) {
  const data = FC_YEARS.map(y => {
    const fc = focus.metrics[metric][y];
    return { year: y, mean: fc.mean, low: fc.low, high: fc.high, realized: fc.realized ?? null };
  });
  return (
    <div className="p-3 space-y-3">
      <div className="border border-border bg-surface-deep p-2">
        <div className="flex items-center justify-between mb-1">
          <div>
            <span className="text-[10px] font-mono font-bold text-accent uppercase">{focus.flag} {focus.name}</span>
            <span className="text-[10px] font-mono text-muted-foreground ml-2">{meta.label}</span>
          </div>
          <span className="text-[10px] font-mono text-muted-foreground">Live realized: <span className="text-foreground font-bold">{realized != null ? realized.toFixed(2) : '—'}{meta.unit === '%' ? '%' : ''}</span></span>
        </div>
        <div className="h-64">
          <ExpandableResponsiveContainer width="100%" height="100%">
            <ComposedChart data={data}>
              <CartesianGrid stroke="hsl(var(--border))" strokeDasharray="2 4" />
              <XAxis dataKey="year" stroke="hsl(var(--muted-foreground))" tick={{ fontSize: 10, fontFamily: 'monospace' }} />
              <YAxis stroke="hsl(var(--muted-foreground))" tick={{ fontSize: 10, fontFamily: 'monospace' }} />
              <Tooltip contentStyle={{ background: 'hsl(var(--surface-deep))', border: '1px solid hsl(var(--border))', fontFamily: 'monospace', fontSize: 11 }} />
              <Area type="monotone" dataKey="high" stackId="band" stroke="none" fill="hsl(var(--accent))" fillOpacity={0.12} />
              <Area type="monotone" dataKey="low" stackId="band2" stroke="none" fill="hsl(var(--background))" />
              <Line type="monotone" dataKey="mean" stroke="hsl(var(--accent))" strokeWidth={2} dot={{ r: 3 }} />
              <Line type="monotone" dataKey="realized" stroke="hsl(var(--positive))" strokeWidth={2} dot={{ r: 4 }} />
              <ReferenceLine x="2025" stroke="hsl(var(--border))" label={{ value: 'forecast →', position: 'top', fill: 'hsl(var(--muted-foreground))', fontSize: 9 }} />
            </ComposedChart>
          </ExpandableResponsiveContainer>
        </div>
      </div>

      <div className="grid grid-cols-7 gap-1">
        {data.map(d => (
          <div key={d.year} className="border border-border bg-surface-deep p-2">
            <div className="text-[9px] font-mono uppercase text-muted-foreground">{d.year}</div>
            <div className="text-base font-mono font-bold tabular-nums text-foreground">{d.mean.toFixed(2)}</div>
            <div className="text-[9px] font-mono tabular-nums text-muted-foreground">{d.low.toFixed(2)} – {d.high.toFixed(2)}</div>
            {d.realized != null && <div className="text-[9px] font-mono tabular-nums text-positive">act {d.realized.toFixed(2)}</div>}
          </div>
        ))}
      </div>
    </div>
  );
}
