// ECST — Economic Statistics Matrix.
// Sub-tabs: LATEST / HISTORY / HEATMAP / EXPORT. 14 indicators × 14 countries.
import { useMemo, useState } from 'react';
import { useWorldBank } from '@/hooks/useWorldBank';
import { useFRED } from '@/hooks/useFRED';
import { useMacroCountry } from '@/contexts/MacroCountryContext';
import { COUNTRY_TO_ISO3 } from '@/data/centralBanks';
import { ECST_COUNTRIES, ECST_INDICATORS, ECST_LATEST, ecstHistory, type EcstCountry } from '@/data/macro/ecstSeries';
import CmdShell from './_shell/CmdShell';
import CmdTabs from './_shell/CmdTabs';
import CmdDrawer from './_shell/CmdDrawer';
import { Sparkline, Heatcell, MiniBars } from './_shell/charts';

type Tab = 'latest' | 'history' | 'heatmap' | 'export';
const TABS: ReadonlyArray<{ id: Tab; label: string }> = [
  { id: 'latest',  label: 'LATEST' },
  { id: 'history', label: '5Y HISTORY' },
  { id: 'heatmap', label: 'HEATMAP' },
  { id: 'export',  label: 'EXPORT' },
];

function fmt(v: number | null | undefined, unit: string) {
  if (v == null || !Number.isFinite(v)) return '—';
  if (unit === '$') return Math.abs(v) >= 1000 ? `$${(v / 1000).toFixed(1)}k` : `$${v.toFixed(0)}`;
  return v.toFixed(2);
}

export default function ECST() {
  const wb = useWorldBank();
  const fred = useFRED();
  const { selectedCountry } = useMacroCountry();
  const [tab, setTab] = useState<Tab>('latest');
  const [drawerKey, setDrawerKey] = useState<{ ind: string; cc: EcstCountry } | null>(null);

  const valueFor = (ind: typeof ECST_INDICATORS[number], cc: EcstCountry): number | null => {
    if (ind.fred && cc === 'US') {
      const f = fred.byKey[ind.fred]?.value;
      if (f != null) return f;
    }
    if (ind.wb) {
      const wbv = wb.byKey[ind.wb]?.byIso3[COUNTRY_TO_ISO3[cc]]?.value;
      if (wbv != null) return wbv;
    }
    return ECST_LATEST[ind.key]?.[cc] ?? null;
  };

  const matrix = useMemo(() => {
    return ECST_INDICATORS.map(ind => {
      const vals = ECST_COUNTRIES.map(cc => valueFor(ind, cc));
      const numeric = vals.filter((v): v is number => v != null).sort((a, b) => a - b);
      const median = numeric.length ? numeric[Math.floor(numeric.length / 2)] : 0;
      const min = numeric[0] ?? 0, max = numeric[numeric.length - 1] ?? 1;
      return { ind, vals, median, min, max };
    });
  }, [wb.byKey, fred.byKey]);

  const exportCsv = () => {
    const lines = [['Indicator', 'Unit', ...ECST_COUNTRIES].join(',')];
    for (const row of matrix) lines.push([row.ind.label, row.ind.unit, ...row.vals.map(v => v ?? '')].join(','));
    const blob = new Blob([lines.join('\n')], { type: 'text/csv' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a'); a.href = url; a.download = 'ECST_matrix.csv'; a.click();
    URL.revokeObjectURL(url);
  };

  return (
    <CmdShell
      code="ECST" title="Economic Statistics Matrix"
      headerRight={<span className="text-[9px] font-mono text-muted-foreground">{ECST_INDICATORS.length} × {ECST_COUNTRIES.length}</span>}
      tabs={<CmdTabs tabs={TABS} active={tab} onChange={setTab} right={tab === 'export' ? <button onClick={exportCsv} className="px-2 py-0.5 text-[10px] font-mono uppercase border border-accent text-accent hover:bg-accent hover:text-background">↓ CSV</button> : null} />}
      footerLeft={<>ECST &lt;GO&gt; · click a cell for 5y history</>}
      footerRight={<>Sources: World Bank · FRED (US live overlay) · Seeded vintages</>}
    >
      <div className="relative h-full">
        <div className="h-full overflow-auto">
          {tab === 'export' ? (
            <ExportView matrix={matrix} />
          ) : (
            <table className="w-full border-collapse">
              <thead className="sticky top-0 bg-surface-deep z-10">
                <tr className="border-b border-border">
                  <th className="px-2 py-1 text-left text-[9px] font-mono font-bold uppercase tracking-wider text-muted-foreground sticky left-0 bg-surface-deep">Indicator</th>
                  {ECST_COUNTRIES.map(cc => (
                    <th key={cc} className={`px-2 py-1 text-right text-[9px] font-mono font-bold uppercase tracking-wider ${cc === selectedCountry ? 'text-accent' : 'text-muted-foreground'}`}>{cc}</th>
                  ))}
                  {tab === 'latest' && <th className="px-2 py-1 text-right text-[9px] font-mono font-bold uppercase tracking-wider text-muted-foreground">Median</th>}
                  {tab === 'history' && <th className="px-2 py-1 text-left text-[9px] font-mono font-bold uppercase tracking-wider text-muted-foreground">5Y Trend ({selectedCountry})</th>}
                </tr>
              </thead>
              <tbody>
                {matrix.map(({ ind, vals, median, min, max }) => (
                  <tr key={ind.key} className="border-b border-border/40 hover:bg-surface-elevated">
                    <td className="px-2 py-0.5 text-[11px] font-mono text-foreground sticky left-0 bg-background whitespace-nowrap">
                      <span className="font-bold">{ind.label}</span><span className="text-muted-foreground"> ({ind.unit})</span>
                    </td>
                    {ECST_COUNTRIES.map((cc, i) => {
                      const v = vals[i];
                      if (tab === 'heatmap') {
                        return <td key={cc} className="px-1 py-0.5"><Heatcell value={v} min={min} max={max} invert={ind.invert} w={60} h={18} label={v != null ? v.toFixed(1) : undefined} /></td>;
                      }
                      const dev = v == null ? 0 : v - median;
                      const tone = v == null ? 'text-muted-foreground' : Math.abs(dev) < 0.001 ? 'text-foreground' : (ind.invert ? dev > 0 : dev < 0) ? 'text-negative' : 'text-positive';
                      return (
                        <td key={cc}
                            onClick={() => setDrawerKey({ ind: ind.key, cc })}
                            className={`px-2 py-0.5 text-right text-[11px] font-mono tabular-nums cursor-pointer ${tone} ${cc === selectedCountry ? 'bg-surface-elevated' : ''}`}>
                          {fmt(v, ind.unit)}
                        </td>
                      );
                    })}
                    {tab === 'latest' && (
                      <td className="px-2 py-0.5 text-right text-[11px] font-mono tabular-nums text-muted-foreground">{fmt(median, ind.unit)}</td>
                    )}
                    {tab === 'history' && (
                      <td className="px-2 py-0.5"><Sparkline data={ecstHistory(ind.key, selectedCountry as EcstCountry)} w={140} h={20} stroke={ind.invert ? 'hsl(var(--negative))' : 'hsl(var(--positive))'} /></td>
                    )}
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </div>

        <CmdDrawer
          open={!!drawerKey}
          onClose={() => setDrawerKey(null)}
          title={drawerKey ? ECST_INDICATORS.find(i => i.key === drawerKey.ind)?.label ?? '' : ''}
          subtitle={drawerKey ? `${drawerKey.cc} · 60-month series` : ''}
          width="lg"
        >
          {drawerKey && <CellDetail indKey={drawerKey.ind} cc={drawerKey.cc} value={(() => { const ind = ECST_INDICATORS.find(i => i.key === drawerKey.ind)!; return valueFor(ind, drawerKey.cc); })()} />}
        </CmdDrawer>
      </div>
    </CmdShell>
  );
}

function CellDetail({ indKey, cc, value }: { indKey: string; cc: EcstCountry; value: number | null }) {
  const ind = ECST_INDICATORS.find(i => i.key === indKey)!;
  const hist = ecstHistory(indKey, cc);
  const mom = hist.map((v, i) => i === 0 ? 0 : v - hist[i - 1]);
  const min = Math.min(...hist), max = Math.max(...hist), avg = hist.reduce((s, v) => s + v, 0) / hist.length;

  return (
    <div className="p-3 space-y-3 text-[11px] font-mono">
      <div className="grid grid-cols-4 gap-1">
        {[
          ['LATEST', value != null ? value.toFixed(2) : '—', 'text-accent'],
          ['5Y MIN', min.toFixed(2), 'text-negative'],
          ['5Y MAX', max.toFixed(2), 'text-positive'],
          ['5Y AVG', avg.toFixed(2), 'text-foreground'],
        ].map(([l, v, t]) => (
          <div key={l} className="border border-border p-2 bg-surface-deep">
            <div className="text-[9px] uppercase text-muted-foreground tracking-wider">{l}</div>
            <div className={`text-base font-bold tabular-nums ${t}`}>{v}</div>
          </div>
        ))}
      </div>

      <div className="border border-border p-2 bg-surface-deep">
        <div className="text-[9px] uppercase text-accent tracking-wider mb-1">60-Month Series</div>
        <Sparkline data={hist} w={620} h={120} stroke={ind.invert ? 'hsl(var(--negative))' : 'hsl(var(--positive))'} fill={ind.invert ? 'hsl(var(--negative))' : 'hsl(var(--positive))'} />
      </div>

      <div className="border border-border p-2 bg-surface-deep">
        <div className="text-[9px] uppercase text-accent tracking-wider mb-1">Month-over-Month Change</div>
        <MiniBars data={mom} w={620} h={56} />
      </div>

      <div className="border border-border p-2 bg-surface-deep space-y-1 text-[10px]">
        <div className="text-[9px] uppercase text-accent tracking-wider mb-1">Metadata</div>
        <div className="flex justify-between border-b border-border/40 pb-0.5"><span className="text-muted-foreground">Indicator</span><span className="font-bold">{ind.label}</span></div>
        <div className="flex justify-between border-b border-border/40 pb-0.5"><span className="text-muted-foreground">Unit</span><span className="font-bold">{ind.unit || 'index'}</span></div>
        <div className="flex justify-between border-b border-border/40 pb-0.5"><span className="text-muted-foreground">Country</span><span className="font-bold">{cc}</span></div>
        <div className="flex justify-between border-b border-border/40 pb-0.5"><span className="text-muted-foreground">Source</span><span className="font-bold">{ind.fred && cc === 'US' ? 'FRED live' : ind.wb ? 'World Bank live' : 'Seeded vintage'}</span></div>
        <div className="flex justify-between"><span className="text-muted-foreground">Polarity</span><span className="font-bold">{ind.invert ? 'lower is better' : 'higher is better'}</span></div>
      </div>
    </div>
  );
}

interface MatrixRow { ind: typeof ECST_INDICATORS[number]; vals: Array<number | null>; median: number; min: number; max: number }

function ExportView({ matrix }: { matrix: MatrixRow[] }) {
  const csv = useMemo(() => {
    const lines = [['Indicator', 'Unit', ...ECST_COUNTRIES].join(',')];
    for (const row of matrix) lines.push([row.ind.label, row.ind.unit, ...row.vals.map(v => v ?? '')].join(','));
    return lines.join('\n');
  }, [matrix]);
  return (
    <div className="p-3">
      <div className="text-[9px] font-mono uppercase text-accent tracking-wider mb-1">CSV Preview</div>
      <pre className="bg-surface-deep border border-border p-2 text-[10px] font-mono text-foreground overflow-auto max-h-[60vh] whitespace-pre">{csv}</pre>
    </div>
  );
}

