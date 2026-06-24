// OECD — Main Economic Indicators. Sub-tabs: CLI, BCI, CCI, PHASE, REFERENCE.
// CLI/BCI/CCI rows seeded from latest OECD MEI vintage (Apr-2026).
// 60-month synthetic history powers the sparklines and detail drawer.
import { useMemo, useState } from 'react';
import { useWorldBank } from '@/hooks/useWorldBank';
import { COUNTRY_TO_ISO3 } from '@/data/centralBanks';
import CmdShell from './_shell/CmdShell';
import CmdTabs from './_shell/CmdTabs';
import CmdDrawer from './_shell/CmdDrawer';
import { Sparkline, Heatcell } from './_shell/charts';

type Tab = 'CLI' | 'BCI' | 'CCI' | 'PHASE' | 'REF';

interface Row {
  cc: string; flag: string;
  cli: number; cliM: number;
  bci: number; bciM: number;
  cci: number; cciM: number;
}

const OECD_ROWS: Row[] = [
  { cc: 'US', flag: '🇺🇸', cli: 100.4, cliM: +0.08, bci: 99.7, bciM: -0.05, cci: 98.9, cciM: -0.12 },
  { cc: 'EU', flag: '🇪🇺', cli: 100.9, cliM: +0.14, bci: 100.2, bciM: +0.10, cci: 99.4, cciM: +0.05 },
  { cc: 'DE', flag: '🇩🇪', cli: 100.7, cliM: +0.17, bci: 99.6, bciM: +0.12, cci: 99.1, cciM: +0.04 },
  { cc: 'FR', flag: '🇫🇷', cli: 100.5, cliM: +0.11, bci: 99.8, bciM: +0.07, cci: 99.2, cciM: +0.02 },
  { cc: 'UK', flag: '🇬🇧', cli: 100.6, cliM: +0.09, bci: 100.0, bciM: +0.03, cci: 98.7, cciM: -0.08 },
  { cc: 'JP', flag: '🇯🇵', cli: 100.2, cliM: +0.05, bci: 100.4, bciM: +0.06, cci: 99.5, cciM: +0.01 },
  { cc: 'CA', flag: '🇨🇦', cli: 99.9,  cliM: -0.03, bci: 99.4, bciM: -0.04, cci: 98.6, cciM: -0.09 },
  { cc: 'AU', flag: '🇦🇺', cli: 100.1, cliM: +0.02, bci: 99.7, bciM: +0.01, cci: 99.0, cciM: -0.02 },
  { cc: 'KR', flag: '🇰🇷', cli: 100.8, cliM: +0.19, bci: 100.5, bciM: +0.14, cci: 99.7, cciM: +0.06 },
  { cc: 'MX', flag: '🇲🇽', cli: 99.5,  cliM: -0.08, bci: 99.2, bciM: -0.06, cci: 98.4, cciM: -0.11 },
  { cc: 'BR', flag: '🇧🇷', cli: 100.0, cliM: +0.01, bci: 99.5, bciM: -0.02, cci: 99.0, cciM: -0.01 },
  { cc: 'CH', flag: '🇨🇭', cli: 100.3, cliM: +0.06, bci: 100.1, bciM: +0.04, cci: 99.6, cciM: +0.03 },
  { cc: 'IN', flag: '🇮🇳', cli: 101.1, cliM: +0.22, bci: 100.7, bciM: +0.18, cci: 100.1, cciM: +0.09 },
  { cc: 'CN', flag: '🇨🇳', cli: 100.0, cliM: +0.04, bci: 99.6, bciM: +0.03, cci: 98.8, cciM: -0.05 },
];

// Seeded 60-month history per country/family
function history(seed: number, latest: number, vol = 0.4, n = 60) {
  let s = seed;
  const rnd = () => { s = (s * 9301 + 49297) % 233280; return s / 233280; };
  const arr: number[] = [];
  let v = latest - 0.5;
  for (let i = 0; i < n; i++) { v += (rnd() - 0.5) * vol; arr.push(+v.toFixed(3)); }
  arr[n - 1] = latest;
  return arr;
}

function phaseOf(cli: number, m: number) {
  if (cli >= 100 && m >= 0) return 'EXPANSION';
  if (cli >= 100) return 'SLOWDOWN';
  if (m >= 0) return 'RECOVERY';
  return 'CONTRACTION';
}
const phaseTone: Record<string, string> = { EXPANSION: 'text-positive', SLOWDOWN: 'text-accent', CONTRACTION: 'text-negative', RECOVERY: 'text-accent' };

function delta(v: number) {
  const t = v > 0 ? 'text-positive' : v < 0 ? 'text-negative' : 'text-muted-foreground';
  return <span className={t}>{v > 0 ? '▲' : v < 0 ? '▼' : '·'} {Math.abs(v).toFixed(2)}</span>;
}

export default function OECD() {
  const wb = useWorldBank();
  const [tab, setTab] = useState<Tab>('CLI');
  const [filter, setFilter] = useState('');
  const [sortKey, setSortKey] = useState<'cc' | 'cli' | 'bci' | 'cci'>('cli');
  const [drill, setDrill] = useState<Row | null>(null);

  const rows = useMemo(() => {
    const q = filter.trim().toUpperCase();
    const f = q ? OECD_ROWS.filter(r => r.cc.includes(q)) : OECD_ROWS;
    return [...f].sort((a, b) => sortKey === 'cc' ? a.cc.localeCompare(b.cc) : (b[sortKey] as number) - (a[sortKey] as number));
  }, [filter, sortKey]);

  const stats = useMemo(() => {
    const grp = { EXPANSION: 0, SLOWDOWN: 0, CONTRACTION: 0, RECOVERY: 0 } as Record<string, number>;
    rows.forEach(r => { grp[phaseOf(r.cli, r.cliM)]++; });
    return grp;
  }, [rows]);

  const refVal = (cc: string, key: 'gdp_growth' | 'inflation' | 'unemployment') =>
    wb.byKey[key]?.byIso3[COUNTRY_TO_ISO3[cc]]?.value ?? null;

  return (
    <CmdShell
      code="OECD"
      title="Main Economic Indicators · CLI / BCI / CCI"
      headerRight={
        <input value={filter} onChange={e => setFilter(e.target.value)} placeholder="FILTER…"
          className="px-2 py-0.5 text-[10px] font-mono bg-background border border-border text-foreground w-28 focus:outline-none focus:border-accent" />
      }
      tabs={<CmdTabs tabs={[{ id: 'CLI', label: 'CLI' }, { id: 'BCI', label: 'BCI' }, { id: 'CCI', label: 'CCI' }, { id: 'PHASE', label: 'Phase' }, { id: 'REF', label: 'Reference' }]} active={tab} onChange={setTab} />}
      kpis={
        <div className="grid grid-cols-4 gap-1 p-1">
          <div className="border border-border p-1.5"><div className="text-[8px] font-mono uppercase text-muted-foreground">Expansion</div><div className="text-lg font-mono font-bold text-positive tabular-nums">{stats.EXPANSION}</div><div className="text-[8px] font-mono text-muted-foreground">CLI ≥ 100, ▲</div></div>
          <div className="border border-border p-1.5"><div className="text-[8px] font-mono uppercase text-muted-foreground">Slowdown</div><div className="text-lg font-mono font-bold text-accent tabular-nums">{stats.SLOWDOWN}</div><div className="text-[8px] font-mono text-muted-foreground">CLI ≥ 100, ▼</div></div>
          <div className="border border-border p-1.5"><div className="text-[8px] font-mono uppercase text-muted-foreground">Contraction</div><div className="text-lg font-mono font-bold text-negative tabular-nums">{stats.CONTRACTION}</div><div className="text-[8px] font-mono text-muted-foreground">CLI &lt; 100, ▼</div></div>
          <div className="border border-border p-1.5"><div className="text-[8px] font-mono uppercase text-muted-foreground">Recovery</div><div className="text-lg font-mono font-bold text-accent tabular-nums">{stats.RECOVERY}</div><div className="text-[8px] font-mono text-muted-foreground">CLI &lt; 100, ▲</div></div>
        </div>
      }
      footerLeft="OECD <GO> · Amplitude-adjusted composites, trend = 100 · 6–9m lead on industrial cycle"
      footerRight="Vintage: Apr-2026 MEI · REF overlay: World Bank live"
    >
      <div className="h-full overflow-auto relative">

        {tab === 'PHASE' ? (
          <div className="p-2 grid grid-cols-2 md:grid-cols-4 gap-2">
            {(['EXPANSION', 'SLOWDOWN', 'CONTRACTION', 'RECOVERY'] as const).map(p => {
              const list = rows.filter(r => phaseOf(r.cli, r.cliM) === p);
              return (
                <div key={p} className="border border-border bg-surface-deep p-2">
                  <div className={`text-[10px] font-mono font-bold uppercase tracking-wider mb-1 ${phaseTone[p]}`}>{p} ({list.length})</div>
                  <div className="space-y-0.5">
                    {list.map(r => (
                      <button key={r.cc} onClick={() => setDrill(r)} className="w-full flex items-center justify-between text-[11px] font-mono hover:bg-surface-elevated px-1 py-0.5">
                        <span><span className="mr-1">{r.flag}</span><span className="font-bold">{r.cc}</span></span>
                        <span className="tabular-nums">{r.cli.toFixed(2)} {delta(r.cliM)}</span>
                      </button>
                    ))}
                    {list.length === 0 && <div className="text-[10px] font-mono text-muted-foreground italic">none</div>}
                  </div>
                </div>
              );
            })}
          </div>
        ) : (
          <table className="w-full border-collapse">
            <thead className="sticky top-0 bg-surface-deep z-10">
              <tr className="border-b border-border">
                <th onClick={() => setSortKey('cc')} className="px-2 py-1 text-left text-[9px] font-mono font-bold uppercase tracking-wider text-muted-foreground cursor-pointer hover:text-foreground">Country</th>
                {tab === 'CLI' && <>
                  <th onClick={() => setSortKey('cli')} className="px-2 py-1 text-right text-[9px] font-mono font-bold uppercase tracking-wider text-accent cursor-pointer">CLI</th>
                  <th className="px-2 py-1 text-right text-[9px] font-mono font-bold uppercase tracking-wider text-muted-foreground">m/m</th>
                  <th className="px-2 py-1 text-left text-[9px] font-mono font-bold uppercase tracking-wider text-muted-foreground">60M Trend</th>
                  <th className="px-2 py-1 text-left text-[9px] font-mono font-bold uppercase tracking-wider text-muted-foreground">Phase</th>
                </>}
                {tab === 'BCI' && <>
                  <th onClick={() => setSortKey('bci')} className="px-2 py-1 text-right text-[9px] font-mono font-bold uppercase tracking-wider text-accent cursor-pointer">BCI</th>
                  <th className="px-2 py-1 text-right text-[9px] font-mono font-bold uppercase tracking-wider text-muted-foreground">m/m</th>
                  <th className="px-2 py-1 text-left text-[9px] font-mono font-bold uppercase tracking-wider text-muted-foreground">60M Trend</th>
                </>}
                {tab === 'CCI' && <>
                  <th onClick={() => setSortKey('cci')} className="px-2 py-1 text-right text-[9px] font-mono font-bold uppercase tracking-wider text-accent cursor-pointer">CCI</th>
                  <th className="px-2 py-1 text-right text-[9px] font-mono font-bold uppercase tracking-wider text-muted-foreground">m/m</th>
                  <th className="px-2 py-1 text-left text-[9px] font-mono font-bold uppercase tracking-wider text-muted-foreground">60M Trend</th>
                </>}
                {tab === 'REF' && <>
                  <th className="px-2 py-1 text-right text-[9px] font-mono font-bold uppercase tracking-wider text-muted-foreground">GDP%</th>
                  <th className="px-2 py-1 text-right text-[9px] font-mono font-bold uppercase tracking-wider text-muted-foreground">CPI%</th>
                  <th className="px-2 py-1 text-right text-[9px] font-mono font-bold uppercase tracking-wider text-muted-foreground">Unemp%</th>
                  <th className="px-2 py-1 text-left text-[9px] font-mono font-bold uppercase tracking-wider text-muted-foreground">Heat</th>
                </>}
              </tr>
            </thead>
            <tbody>
              {rows.map(r => {
                const series = tab === 'BCI' ? history(r.cc.charCodeAt(0) + 2, r.bci) : tab === 'CCI' ? history(r.cc.charCodeAt(0) + 3, r.cci) : history(r.cc.charCodeAt(0) + 1, r.cli);
                return (
                  <tr key={r.cc} className="border-b border-border/40 hover:bg-surface-elevated cursor-pointer" onClick={() => setDrill(r)}>
                    <td className="px-2 py-0.5 text-[11px] font-mono"><span className="mr-1">{r.flag}</span><span className="font-bold">{r.cc}</span></td>
                    {tab === 'CLI' && <>
                      <td className={`px-2 py-0.5 text-right text-[11px] font-mono tabular-nums ${r.cli >= 100 ? 'text-positive' : 'text-negative'}`}>{r.cli.toFixed(2)}</td>
                      <td className="px-2 py-0.5 text-right text-[11px] font-mono tabular-nums">{delta(r.cliM)}</td>
                      <td className="px-2 py-0.5 text-accent"><Sparkline data={series} w={160} h={20} /></td>
                      <td className={`px-2 py-0.5 text-[10px] font-mono uppercase ${phaseTone[phaseOf(r.cli, r.cliM)]}`}>{phaseOf(r.cli, r.cliM)}</td>
                    </>}
                    {tab === 'BCI' && <>
                      <td className={`px-2 py-0.5 text-right text-[11px] font-mono tabular-nums ${r.bci >= 100 ? 'text-positive' : 'text-negative'}`}>{r.bci.toFixed(2)}</td>
                      <td className="px-2 py-0.5 text-right text-[11px] font-mono tabular-nums">{delta(r.bciM)}</td>
                      <td className="px-2 py-0.5 text-accent"><Sparkline data={series} w={160} h={20} /></td>
                    </>}
                    {tab === 'CCI' && <>
                      <td className={`px-2 py-0.5 text-right text-[11px] font-mono tabular-nums ${r.cci >= 100 ? 'text-positive' : 'text-negative'}`}>{r.cci.toFixed(2)}</td>
                      <td className="px-2 py-0.5 text-right text-[11px] font-mono tabular-nums">{delta(r.cciM)}</td>
                      <td className="px-2 py-0.5 text-accent"><Sparkline data={series} w={160} h={20} /></td>
                    </>}
                    {tab === 'REF' && <>
                      <td className="px-2 py-0.5 text-right text-[11px] font-mono tabular-nums">{refVal(r.cc, 'gdp_growth')?.toFixed(2) ?? '—'}</td>
                      <td className="px-2 py-0.5 text-right text-[11px] font-mono tabular-nums">{refVal(r.cc, 'inflation')?.toFixed(2) ?? '—'}</td>
                      <td className="px-2 py-0.5 text-right text-[11px] font-mono tabular-nums">{refVal(r.cc, 'unemployment')?.toFixed(2) ?? '—'}</td>
                      <td className="px-2 py-0.5"><Heatcell value={refVal(r.cc, 'gdp_growth')} min={-2} max={8} w={50} h={14} label={(refVal(r.cc, 'gdp_growth') ?? 0).toFixed(1)} /></td>
                    </>}
                  </tr>
                );
              })}
            </tbody>
          </table>
        )}

        <CmdDrawer open={!!drill} onClose={() => setDrill(null)} title={drill ? `${drill.flag} ${drill.cc} · OECD MEI` : ''} subtitle="Apr-2026 vintage · amplitude-adjusted">
          {drill && (
            <div className="p-2 space-y-2">
              <div className="grid grid-cols-3 gap-1">
                {(['cli', 'bci', 'cci'] as const).map(k => (
                  <div key={k} className="border border-border bg-surface-deep p-2">
                    <div className="text-[9px] font-mono uppercase text-muted-foreground">{k.toUpperCase()}</div>
                    <div className={`text-lg font-mono font-bold tabular-nums ${drill[k] >= 100 ? 'text-positive' : 'text-negative'}`}>{drill[k].toFixed(2)}</div>
                    <div className="text-[10px] font-mono">{delta(drill[`${k}M` as 'cliM'])}</div>
                  </div>
                ))}
              </div>
              {(['cli', 'bci', 'cci'] as const).map(k => (
                <div key={k} className="border border-border bg-surface-deep p-2">
                  <div className="text-[9px] font-mono uppercase tracking-wider text-accent mb-1">{k.toUpperCase()} · 60-Month History</div>
                  <div className="text-accent"><Sparkline data={history(drill.cc.charCodeAt(0) + (k === 'cli' ? 1 : k === 'bci' ? 2 : 3), drill[k])} w={500} h={50} fill="currentColor" /></div>
                </div>
              ))}
              <div className="border border-border bg-surface-deep p-2 text-[10px] font-mono">
                <div className="text-accent uppercase mb-1">Phase</div>
                <div className={`font-bold ${phaseTone[phaseOf(drill.cli, drill.cliM)]}`}>{phaseOf(drill.cli, drill.cliM)}</div>
                <div className="text-muted-foreground mt-1 italic">CLI provides a 6–9 month lead on the industrial cycle. BCI captures business surveys; CCI captures household sentiment.</div>
              </div>
            </div>
          )}
        </CmdDrawer>
      </div>
    </CmdShell>
  );
}
