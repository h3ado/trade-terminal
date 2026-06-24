// ECWB — Economic Workbook. Sub-tabs: LAYOUT / SAVED / TEMPLATES / EXPORT.
// Pivot table builder with sparkline column, conditional formatting and CSV.
import { useEffect, useMemo, useState } from 'react';
import { useWorldBank } from '@/hooks/useWorldBank';
import { useFRED } from '@/hooks/useFRED';
import { COUNTRY_TO_ISO3 } from '@/data/centralBanks';
import { ECST_COUNTRIES, ECST_INDICATORS, ECST_LATEST, ecstHistory, type EcstCountry } from '@/data/macro/ecstSeries';
import CmdShell from './_shell/CmdShell';
import CmdTabs from './_shell/CmdTabs';
import { Sparkline, Heatcell } from './_shell/charts';

type Tab = 'layout' | 'saved' | 'templates' | 'export';
const TABS: ReadonlyArray<{ id: Tab; label: string }> = [
  { id: 'layout',    label: 'LAYOUT' },
  { id: 'saved',     label: 'SAVED' },
  { id: 'templates', label: 'TEMPLATES' },
  { id: 'export',    label: 'EXPORT' },
];

type TimeAxis = 'latest' | 'prior' | '5y_avg' | '5y_min' | '5y_max';
const TIME_LABEL: Record<TimeAxis, string> = { latest: 'Latest', prior: '12m ago', '5y_avg': '5Y avg', '5y_min': '5Y min', '5y_max': '5Y max' };

type CondFormat = 'none' | 'tone' | 'heatmap';

interface Layout {
  name: string;
  rows: 'country' | 'indicator';
  countries: string[];
  indicators: string[];
  axis: TimeAxis;
  cond: CondFormat;
  showSpark: boolean;
}

const TEMPLATES: Layout[] = [
  { name: 'G7 HEADLINE',           rows: 'country', countries: ['US','UK','EU','DE','FR','JP','CA'], indicators: ['gdp_growth','inflation','unemployment','govt_debt','current_acct'], axis: 'latest', cond: 'tone', showSpark: true },
  { name: 'INFLATION X-SECTION',   rows: 'country', countries: ['US','EU','UK','JP','CN','BR','MX','IN'], indicators: ['inflation','core_cpi','ppi','m2_yoy','real_rate'], axis: 'latest', cond: 'heatmap', showSpark: true },
  { name: 'EM STRESS PANEL',       rows: 'country', countries: ['BR','MX','IN','KR','ZA' as any,'TR' as any].filter(c => ECST_COUNTRIES.includes(c as any)), indicators: ['inflation','real_rate','current_acct','govt_debt','unemployment'], axis: 'latest', cond: 'tone', showSpark: true },
  { name: 'DEBT SUSTAINABILITY',   rows: 'country', countries: [...ECST_COUNTRIES], indicators: ['govt_debt','current_acct','gdp_growth','real_rate'], axis: 'latest', cond: 'heatmap', showSpark: false },
  { name: 'GROWTH MOMENTUM',       rows: 'country', countries: ['US','EU','UK','JP','CN','IN','BR','KR'], indicators: ['gdp_growth','pmi_mfg','pmi_svc','retail_sales','ind_prod'], axis: 'latest', cond: 'heatmap', showSpark: true },
  { name: 'CROSS-SECTION 5Y AVG',  rows: 'country', countries: ['US','EU','UK','JP','CN','IN'], indicators: ['gdp_growth','inflation','unemployment','govt_debt'], axis: '5y_avg', cond: 'tone', showSpark: true },
];

const STORAGE_KEY = 'ecwb:v2';
const DEFAULTS: Layout[] = [TEMPLATES[0], TEMPLATES[1]];

function readStored(): Layout[] {
  try { const raw = localStorage.getItem(STORAGE_KEY); if (raw) return JSON.parse(raw); } catch {}
  return DEFAULTS;
}

function fmt(v: number | null, unit: string) {
  if (v == null || !Number.isFinite(v)) return '—';
  if (unit === '$') return Math.abs(v) >= 1000 ? `$${(v / 1000).toFixed(1)}k` : `$${v.toFixed(0)}`;
  return v.toFixed(2);
}

export default function ECWB() {
  const wb = useWorldBank();
  const fred = useFRED();
  const [layouts, setLayouts] = useState<Layout[]>(readStored);
  const [activeIdx, setActiveIdx] = useState(0);
  const [tab, setTab] = useState<Tab>('layout');
  const active = layouts[activeIdx] ?? layouts[0];

  useEffect(() => { try { localStorage.setItem(STORAGE_KEY, JSON.stringify(layouts)); } catch {} }, [layouts]);

  const live = (cc: EcstCountry, indKey: string): number | null => {
    const ind = ECST_INDICATORS.find(i => i.key === indKey);
    if (!ind) return null;
    if (ind.fred && cc === 'US') {
      const f = fred.byKey[ind.fred]?.value; if (f != null) return f;
    }
    if (ind.wb) {
      const v = wb.byKey[ind.wb]?.byIso3[COUNTRY_TO_ISO3[cc]]?.value; if (v != null) return v;
    }
    return ECST_LATEST[indKey]?.[cc] ?? null;
  };

  const cellValue = (cc: EcstCountry, indKey: string, axis: TimeAxis): number | null => {
    if (axis === 'latest') return live(cc, indKey);
    const hist = ecstHistory(indKey, cc);
    if (!hist.length) return null;
    if (axis === 'prior') return hist[Math.max(0, hist.length - 13)];
    if (axis === '5y_avg') return hist.reduce((s, v) => s + v, 0) / hist.length;
    if (axis === '5y_min') return Math.min(...hist);
    return Math.max(...hist);
  };

  const updateActive = (patch: Partial<Layout>) => setLayouts(l => l.map((x, i) => i === activeIdx ? { ...x, ...patch } : x));
  const toggleCountry = (cc: string) => updateActive({ countries: active.countries.includes(cc) ? active.countries.filter(c => c !== cc) : [...active.countries, cc] });
  const toggleIndicator = (k: string) => updateActive({ indicators: active.indicators.includes(k) ? active.indicators.filter(c => c !== k) : [...active.indicators, k] });
  const newLayout = () => {
    const name = prompt('Layout name:', 'NEW LAYOUT'); if (!name) return;
    setLayouts(l => [...l, { name: name.toUpperCase(), rows: 'country', countries: ['US','EU','UK','JP'], indicators: ['gdp_growth','inflation'], axis: 'latest', cond: 'tone', showSpark: true }]);
    setActiveIdx(layouts.length);
  };
  const dupActive = () => setLayouts(l => [...l, { ...active, name: active.name + ' COPY' }]);
  const removeActive = () => {
    if (layouts.length <= 1) return;
    if (!confirm(`Delete layout "${active.name}"?`)) return;
    setLayouts(l => l.filter((_, i) => i !== activeIdx));
    setActiveIdx(0);
  };
  

  const rowsIsCountry = active.rows === 'country';
  const rowKeys = rowsIsCountry ? active.countries : active.indicators;
  const colKeys = rowsIsCountry ? active.indicators : active.countries;

  const buildCsv = () => {
    const lines: string[] = [];
    if (rowsIsCountry) {
      lines.push(['Country', ...active.indicators.map(k => ECST_INDICATORS.find(i => i.key === k)!.label)].join(','));
      for (const cc of active.countries) lines.push([cc, ...active.indicators.map(k => cellValue(cc as EcstCountry, k, active.axis) ?? '')].join(','));
    } else {
      lines.push(['Indicator', ...active.countries].join(','));
      for (const k of active.indicators) lines.push([ECST_INDICATORS.find(i => i.key === k)!.label, ...active.countries.map(cc => cellValue(cc as EcstCountry, k, active.axis) ?? '')].join(','));
    }
    return lines.join('\n');
  };

  const exportCsv = () => {
    const blob = new Blob([buildCsv()], { type: 'text/csv' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a'); a.href = url; a.download = `${active.name.replace(/\s+/g,'_')}.csv`; a.click();
    URL.revokeObjectURL(url);
  };

  return (
    <CmdShell
      code="ECWB" title="Economic Workbook"
      headerRight={
        <div className="flex items-center gap-1">
          {layouts.map((l, i) => (
            <button key={l.name + i} onClick={() => setActiveIdx(i)} className={`px-2 py-0.5 text-[10px] font-mono uppercase border ${activeIdx === i ? 'bg-accent text-background border-accent' : 'border-border text-muted-foreground hover:text-foreground'}`}>{l.name}</button>
          ))}
          <button onClick={newLayout} className="px-2 py-0.5 text-[10px] font-mono uppercase border border-border text-muted-foreground hover:text-foreground">+</button>
          <button onClick={dupActive} className="px-2 py-0.5 text-[10px] font-mono uppercase border border-border text-muted-foreground hover:text-foreground" title="Duplicate">⎘</button>
          <button onClick={removeActive} className="px-2 py-0.5 text-[10px] font-mono uppercase border border-border text-muted-foreground hover:text-negative">DEL</button>
        </div>
      }
      tabs={<CmdTabs tabs={TABS} active={tab} onChange={setTab} right={
        <div className="flex items-center gap-1 text-[10px] font-mono">
          <button onClick={() => updateActive({ rows: rowsIsCountry ? 'indicator' : 'country' })} className="px-2 py-0.5 border border-border text-muted-foreground hover:text-foreground uppercase">PIVOT</button>
          <select value={active.axis} onChange={e => updateActive({ axis: e.target.value as TimeAxis })} className="bg-background border border-border text-foreground px-1 py-0.5 uppercase">
            {Object.entries(TIME_LABEL).map(([k, v]) => <option key={k} value={k}>{v}</option>)}
          </select>
          <select value={active.cond} onChange={e => updateActive({ cond: e.target.value as CondFormat })} className="bg-background border border-border text-foreground px-1 py-0.5 uppercase">
            <option value="none">FMT none</option>
            <option value="tone">FMT tone</option>
            <option value="heatmap">FMT heat</option>
          </select>
          <label className="flex items-center gap-1 uppercase text-muted-foreground"><input type="checkbox" checked={active.showSpark} onChange={e => updateActive({ showSpark: e.target.checked })} /> spark</label>
          <button onClick={exportCsv} className="px-2 py-0.5 border border-accent text-accent uppercase hover:bg-accent hover:text-background">↓ CSV</button>
        </div>
      } />}
      footerLeft={<>ECWB &lt;GO&gt; · {layouts.length} layouts · {tab.toUpperCase()}</>}
      footerRight={<>Live: World Bank + FRED · Hist seeded vintages</>}
    >
      <div className="h-full overflow-auto">
        {tab === 'layout' && (
          <>
            <div className="grid grid-cols-2 gap-1 p-1 bg-surface-deep border-b border-border text-[10px] font-mono">
              <div>
                <div className="text-[8px] uppercase text-muted-foreground tracking-wider mb-0.5">Countries ({active.countries.length})</div>
                <div className="flex flex-wrap gap-0.5">{ECST_COUNTRIES.map(cc => (
                  <button key={cc} onClick={() => toggleCountry(cc)} className={`px-1.5 py-0.5 border ${active.countries.includes(cc) ? 'bg-accent text-background border-accent' : 'border-border text-muted-foreground hover:text-foreground'}`}>{cc}</button>
                ))}</div>
              </div>
              <div>
                <div className="text-[8px] uppercase text-muted-foreground tracking-wider mb-0.5">Indicators ({active.indicators.length})</div>
                <div className="flex flex-wrap gap-0.5">{ECST_INDICATORS.map(i => (
                  <button key={i.key} onClick={() => toggleIndicator(i.key)} className={`px-1.5 py-0.5 border ${active.indicators.includes(i.key) ? 'bg-accent text-background border-accent' : 'border-border text-muted-foreground hover:text-foreground'}`}>{i.label}</button>
                ))}</div>
              </div>
            </div>
            <Grid active={active} rowKeys={rowKeys} colKeys={colKeys} cellValue={cellValue} />
          </>
        )}
        {tab === 'saved' && (
          <div className="p-2 space-y-1">
            {layouts.map((l, i) => (
              <div key={l.name + i} className="flex items-center justify-between border border-border bg-surface-deep px-2 py-1 text-[11px] font-mono">
                <div>
                  <span className="font-bold text-accent uppercase">{l.name}</span>
                  <span className="text-muted-foreground ml-2">{l.countries.length}C × {l.indicators.length}I · axis={TIME_LABEL[l.axis]} · fmt={l.cond}</span>
                </div>
                <div className="flex gap-1">
                  <button onClick={() => { setActiveIdx(i); setTab('layout'); }} className="px-2 py-0.5 border border-accent text-accent uppercase text-[10px]">LOAD</button>
                  <button onClick={() => setLayouts(arr => arr.filter((_, k) => k !== i))} className="px-2 py-0.5 border border-border text-muted-foreground hover:text-negative uppercase text-[10px]">DEL</button>
                </div>
              </div>
            ))}
          </div>
        )}
        {tab === 'templates' && (
          <div className="p-2 grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-2">
            {TEMPLATES.map(t => (
              <div key={t.name} className="border border-border bg-surface-deep p-2 text-[11px] font-mono">
                <div className="flex items-center justify-between mb-1">
                  <span className="text-accent uppercase font-bold">{t.name}</span>
                  <button onClick={() => { setLayouts(l => { const next = [...l, { ...t }]; setActiveIdx(next.length - 1); return next; }); setTab('layout'); }} className="px-2 py-0.5 border border-accent text-accent uppercase text-[10px] hover:bg-accent hover:text-background">LOAD</button>
                </div>
                <div className="text-[10px] text-muted-foreground">{t.countries.length} countries × {t.indicators.length} indicators · axis = {TIME_LABEL[t.axis]} · fmt = {t.cond}</div>
                <div className="mt-1 text-[10px] text-muted-foreground">Indicators: {t.indicators.map(k => ECST_INDICATORS.find(i => i.key === k)?.label).join(', ')}</div>
              </div>
            ))}
          </div>
        )}
        {tab === 'export' && (
          <div className="p-3">
            <div className="flex items-center gap-2 mb-2">
              <button onClick={exportCsv} className="px-2 py-0.5 border border-accent text-accent uppercase text-[10px] hover:bg-accent hover:text-background">↓ Download CSV</button>
              <button onClick={() => { navigator.clipboard.writeText(buildCsv()); }} className="px-2 py-0.5 border border-border text-muted-foreground uppercase text-[10px] hover:text-foreground">Copy</button>
            </div>
            <pre className="bg-surface-deep border border-border p-2 text-[10px] font-mono text-foreground overflow-auto max-h-[55vh] whitespace-pre">{buildCsv()}</pre>
          </div>
        )}
      </div>
    </CmdShell>
  );
}

function Grid({ active, rowKeys, colKeys, cellValue }: { active: Layout; rowKeys: string[]; colKeys: string[]; cellValue: (cc: EcstCountry, indKey: string, axis: TimeAxis) => number | null }) {
  const rowsIsCountry = active.rows === 'country';
  const colStats = useMemo(() => {
    return colKeys.map(ck => {
      const vals: number[] = [];
      for (const rk of rowKeys) {
        const cc = (rowsIsCountry ? rk : ck) as EcstCountry;
        const indKey = rowsIsCountry ? ck : rk;
        const v = cellValue(cc, indKey, active.axis); if (v != null) vals.push(v);
      }
      vals.sort((a, b) => a - b);
      return { min: vals[0] ?? 0, max: vals[vals.length - 1] ?? 1, median: vals[Math.floor(vals.length / 2)] ?? 0, invert: !!ECST_INDICATORS.find(i => i.key === (rowsIsCountry ? ck : (colKeys[0])))?.invert };
    });
  }, [colKeys, rowKeys, rowsIsCountry, active.axis, cellValue]);

  return (
    <table className="w-full border-collapse">
      <thead className="sticky top-0 bg-surface-deep z-10">
        <tr className="border-b border-border">
          <th className="px-2 py-1 text-left text-[9px] font-mono font-bold uppercase tracking-wider text-muted-foreground sticky left-0 bg-surface-deep">{rowsIsCountry ? 'Country' : 'Indicator'}</th>
          {colKeys.map(ck => {
            const label = rowsIsCountry ? (ECST_INDICATORS.find(i => i.key === ck)?.label ?? ck) : ck;
            return <th key={ck} className="px-2 py-1 text-right text-[9px] font-mono font-bold uppercase tracking-wider text-muted-foreground whitespace-nowrap">{label}</th>;
          })}
          {active.showSpark && <th className="px-2 py-1 text-left text-[9px] font-mono font-bold uppercase tracking-wider text-muted-foreground">5Y</th>}
        </tr>
      </thead>
      <tbody>
        {rowKeys.map(rk => (
          <tr key={rk} className="border-b border-border/40 hover:bg-surface-elevated">
            <td className="px-2 py-0.5 text-[11px] font-mono font-bold text-foreground sticky left-0 bg-background whitespace-nowrap">
              {rowsIsCountry ? rk : (ECST_INDICATORS.find(i => i.key === rk)?.label ?? rk)}
            </td>
            {colKeys.map((ck, i) => {
              const cc = (rowsIsCountry ? rk : ck) as EcstCountry;
              const indKey = rowsIsCountry ? ck : rk;
              const ind = ECST_INDICATORS.find(x => x.key === indKey);
              const v = cellValue(cc, indKey, active.axis);
              const s = colStats[i];
              if (active.cond === 'heatmap') {
                return <td key={ck} className="px-1 py-0.5"><Heatcell value={v} min={s.min} max={s.max} invert={!!ind?.invert} w={64} h={18} label={v != null ? v.toFixed(2) : undefined} /></td>;
              }
              const tone = v == null || active.cond === 'none' ? 'text-foreground' : (() => {
                const d = v - s.median; if (Math.abs(d) < 0.01) return 'text-foreground';
                return (ind?.invert ? d > 0 : d < 0) ? 'text-negative' : 'text-positive';
              })();
              return <td key={ck} className={`px-2 py-0.5 text-right text-[11px] font-mono tabular-nums ${tone}`}>{fmt(v, ind?.unit ?? '')}</td>;
            })}
            {active.showSpark && (
              <td className="px-2 py-0.5">
                {rowsIsCountry ? (
                  <Sparkline data={ecstHistory(active.indicators[0], rk as EcstCountry)} w={100} h={18} stroke="hsl(var(--accent))" />
                ) : (
                  <Sparkline data={ecstHistory(rk, (active.countries[0] ?? 'US') as EcstCountry)} w={100} h={18} stroke="hsl(var(--accent))" />
                )}
              </td>
            )}
          </tr>
        ))}
      </tbody>
    </table>
  );
}
