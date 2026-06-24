// EIU — Country Risk Card. Sub-tabs: SCORES, TREND, COMPARE, NOTES.
// 5-dimension composite risk model (Political / Economic / Sovereign / FX /
// Banking) with 24mo trend sparklines. Live WB overlay for debt & growth.
import { useMemo, useState } from 'react';
import { useWorldBank } from '@/hooks/useWorldBank';
import { useMacroCountry } from '@/contexts/MacroCountryContext';
import { COUNTRY_TO_ISO3 } from '@/data/centralBanks';
import CmdShell from './_shell/CmdShell';
import CmdTabs from './_shell/CmdTabs';
import CmdDrawer from './_shell/CmdDrawer';
import { Sparkline, Heatcell } from './_shell/charts';

type Dim = 'political' | 'economic' | 'sovereign' | 'fx' | 'banking';
type Tab = 'SCORES' | 'TREND' | 'COMPARE' | 'NOTES';

interface Country {
  cc: string; flag: string; name: string;
  scores: Record<Dim, number>;
  trends: Record<Dim, number[]>;
  band: 'A' | 'B' | 'C' | 'D' | 'E';
  outlook: 'Improving' | 'Stable' | 'Deteriorating';
  notes: string;
}

const DIMS: Array<{ key: Dim; label: string; w: number }> = [
  { key: 'political', label: 'Political', w: 0.25 },
  { key: 'economic',  label: 'Economic',  w: 0.25 },
  { key: 'sovereign', label: 'Sovereign', w: 0.20 },
  { key: 'fx',        label: 'FX',        w: 0.15 },
  { key: 'banking',   label: 'Banking',   w: 0.15 },
];

function walk(seed: number, mean: number, vol: number, n = 24): number[] {
  let s = seed;
  const rnd = () => { s = (s * 9301 + 49297) % 233280; return s / 233280; };
  const out: number[] = []; let v = mean;
  for (let i = 0; i < n; i++) { v += (rnd() - 0.5) * vol; v = Math.max(0, Math.min(100, v)); out.push(+v.toFixed(1)); }
  out[n - 1] = mean; return out;
}
function makeCountry(cc: string, flag: string, name: string, s: Record<Dim, number>, outlook: Country['outlook'], notes: string): Country {
  const seed = cc.charCodeAt(0) * 31 + cc.charCodeAt(1);
  const trends: Record<Dim, number[]> = {
    political: walk(seed + 1, s.political, 4),
    economic:  walk(seed + 2, s.economic,  3),
    sovereign: walk(seed + 3, s.sovereign, 3),
    fx:        walk(seed + 4, s.fx,        5),
    banking:   walk(seed + 5, s.banking,   2.5),
  };
  const comp = DIMS.reduce((sum, d) => sum + s[d.key] * d.w, 0);
  const band: Country['band'] = comp < 20 ? 'A' : comp < 40 ? 'B' : comp < 60 ? 'C' : comp < 80 ? 'D' : 'E';
  return { cc, flag, name, scores: s, trends, band, outlook, notes };
}

const COUNTRIES: Country[] = [
  makeCountry('US','🇺🇸','United States',  { political: 38, economic: 32, sovereign: 22, fx: 18, banking: 24 }, 'Stable',        'Election overhang on trade policy; deficit trajectory in focus.'),
  makeCountry('UK','🇬🇧','United Kingdom', { political: 35, economic: 38, sovereign: 28, fx: 32, banking: 26 }, 'Stable',        'Fiscal slippage flagged; gilts under pressure intermittently.'),
  makeCountry('DE','🇩🇪','Germany',        { political: 30, economic: 42, sovereign: 18, fx: 22, banking: 28 }, 'Deteriorating', 'Industrial recession persists; auto/chemicals competitiveness.'),
  makeCountry('FR','🇫🇷','France',         { political: 48, economic: 44, sovereign: 38, fx: 22, banking: 30 }, 'Deteriorating', 'EDP threshold breach; political fragmentation post-snap election.'),
  makeCountry('JP','🇯🇵','Japan',          { political: 25, economic: 36, sovereign: 32, fx: 38, banking: 22 }, 'Stable',        'BoJ normalisation orderly; debt sustainability long-term concern.'),
  makeCountry('CN','🇨🇳','China',          { political: 58, economic: 52, sovereign: 38, fx: 44, banking: 56 }, 'Deteriorating', 'Property workout incomplete; LGFV refinancing pressure.'),
  makeCountry('CA','🇨🇦','Canada',         { political: 22, economic: 30, sovereign: 16, fx: 24, banking: 20 }, 'Stable',        'Housing leverage elevated; commodity terms-of-trade supportive.'),
  makeCountry('AU','🇦🇺','Australia',      { political: 18, economic: 28, sovereign: 14, fx: 26, banking: 22 }, 'Stable',        'China demand sensitivity; iron-ore prices key swing factor.'),
  makeCountry('IN','🇮🇳','India',          { political: 38, economic: 40, sovereign: 48, fx: 34, banking: 38 }, 'Improving',     'Growth momentum offset by current-account & oil-import sensitivity.'),
  makeCountry('BR','🇧🇷','Brazil',         { political: 56, economic: 58, sovereign: 62, fx: 52, banking: 44 }, 'Deteriorating', 'Fiscal rule pressure; Selic restrictive but inflation expectations slipping.'),
  makeCountry('MX','🇲🇽','Mexico',         { political: 54, economic: 48, sovereign: 50, fx: 46, banking: 38 }, 'Deteriorating', 'Judicial reform & Pemex contingent liabilities cloud outlook.'),
  makeCountry('KR','🇰🇷','South Korea',    { political: 32, economic: 36, sovereign: 24, fx: 30, banking: 30 }, 'Stable',        'Semis cycle recovery offsets household-debt drag.'),
  makeCountry('CH','🇨🇭','Switzerland',    { political: 15, economic: 22, sovereign: 12, fx: 30, banking: 32 }, 'Stable',        'CHF strength a recurring banking-sector pain point.'),
  makeCountry('TR','🇹🇷','Türkiye',        { political: 68, economic: 72, sovereign: 64, fx: 76, banking: 58 }, 'Improving',     'Orthodox policy mix taking hold; reserve rebuild ongoing.'),
  makeCountry('AR','🇦🇷','Argentina',      { political: 72, economic: 80, sovereign: 88, fx: 84, banking: 66 }, 'Improving',     'Disinflation pace surprising positively; FX controls partially lifted.'),
  makeCountry('EG','🇪🇬','Egypt',          { political: 70, economic: 74, sovereign: 78, fx: 72, banking: 60 }, 'Stable',        'IMF program anchor; external financing needs remain large.'),
  makeCountry('ZA','🇿🇦','South Africa',   { political: 58, economic: 60, sovereign: 62, fx: 54, banking: 46 }, 'Stable',        'GNU governance honeymoon; Eskom & Transnet structural drags.'),
  makeCountry('PL','🇵🇱','Poland',         { political: 42, economic: 36, sovereign: 30, fx: 28, banking: 30 }, 'Improving',     'EU funds unlock supportive; FX-mortgage rulings tail-risk.'),
];

const BAND_TONE: Record<Country['band'], string> = { A: 'text-positive', B: 'text-positive', C: 'text-accent', D: 'text-negative', E: 'text-negative font-bold' };
const composite = (s: Record<Dim, number>) => DIMS.reduce((a, d) => a + s[d.key] * d.w, 0);
const scoreTone = (v: number) => v < 25 ? 'text-positive' : v < 50 ? 'text-foreground' : v < 75 ? 'text-accent' : 'text-negative font-bold';
const outlookTone = (o: Country['outlook']) => o === 'Improving' ? 'text-positive' : o === 'Deteriorating' ? 'text-negative' : 'text-muted-foreground';

export default function EIU() {
  const wb = useWorldBank();
  const { selectedCountry } = useMacroCountry();
  const [tab, setTab] = useState<Tab>('SCORES');
  const [sortKey, setSortKey] = useState<Dim | 'composite' | 'cc'>('composite');
  const [desc, setDesc] = useState(true);
  const [filter, setFilter] = useState('');
  const [drill, setDrill] = useState<Country | null>(null);
  const [compareB, setCompareB] = useState<string>('CN');

  const rows = useMemo(() => {
    const q = filter.trim().toUpperCase();
    const f = q ? COUNTRIES.filter(c => c.cc.includes(q) || c.name.toUpperCase().includes(q)) : COUNTRIES;
    return [...f].sort((a, b) => {
      const av = sortKey === 'cc' ? a.cc : sortKey === 'composite' ? composite(a.scores) : a.scores[sortKey as Dim];
      const bv = sortKey === 'cc' ? b.cc : sortKey === 'composite' ? composite(b.scores) : b.scores[sortKey as Dim];
      if (typeof av === 'string') return desc ? (bv as string).localeCompare(av) : (av as string).localeCompare(bv as string);
      return desc ? (bv as number) - (av as number) : (av as number) - (bv as number);
    });
  }, [filter, sortKey, desc]);

  const focus = COUNTRIES.find(c => c.cc === selectedCountry) ?? COUNTRIES[0];
  const compare = COUNTRIES.find(c => c.cc === compareB) ?? COUNTRIES[1];
  const focusDebt = wb.byKey['govt_debt']?.byIso3[COUNTRY_TO_ISO3[focus.cc]]?.value ?? null;
  const focusGdp  = wb.byKey['gdp_growth']?.byIso3[COUNTRY_TO_ISO3[focus.cc]]?.value ?? null;

  const sortBy = (k: typeof sortKey) => { if (sortKey === k) setDesc(d => !d); else { setSortKey(k); setDesc(true); } };

  return (
    <CmdShell
      code="EIU"
      title="Country Risk Card · 5-Dimension Composite Model"
      headerRight={
        <input value={filter} onChange={e => setFilter(e.target.value)} placeholder="FILTER…"
          className="px-2 py-0.5 text-[10px] font-mono bg-background border border-border text-foreground w-32 focus:outline-none focus:border-accent" />
      }
      tabs={<CmdTabs tabs={[{ id: 'SCORES', label: 'Scores' }, { id: 'TREND', label: 'Trend' }, { id: 'COMPARE', label: 'Compare' }, { id: 'NOTES', label: 'Notes' }]} active={tab} onChange={setTab} />}
      kpis={
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-1 p-1">
          <div className="border border-border p-2 bg-surface-deep">
            <div className="flex items-center gap-2 mb-1">
              <span className="text-xl">{focus.flag}</span>
              <div className="flex-1 min-w-0">
                <div className="text-[12px] font-mono font-bold text-foreground uppercase truncate">{focus.name}</div>
                <div className="text-[9px] font-mono text-muted-foreground uppercase">{focus.cc} · Band {focus.band} · <span className={outlookTone(focus.outlook)}>{focus.outlook}</span></div>
              </div>
              <div className={`text-3xl font-mono font-bold tabular-nums ${BAND_TONE[focus.band]}`}>{composite(focus.scores).toFixed(0)}</div>
            </div>
          </div>
          <div className="border border-border p-2 bg-surface-deep lg:col-span-2">
            <div className="text-[9px] font-mono uppercase tracking-wider text-accent mb-1">Risk Dimensions — {focus.cc}</div>
            <div className="grid grid-cols-5 gap-1">
              {DIMS.map(d => (
                <div key={d.key} className="border border-border p-1">
                  <div className="text-[8px] font-mono uppercase text-muted-foreground">{d.label}</div>
                  <div className={`text-base font-mono font-bold tabular-nums ${scoreTone(focus.scores[d.key])}`}>{focus.scores[d.key].toFixed(0)}</div>
                  <div className={focus.scores[d.key] > 50 ? 'text-negative' : 'text-positive'}><Sparkline data={focus.trends[d.key]} w={80} h={16} /></div>
                </div>
              ))}
            </div>
          </div>
        </div>
      }
      footerLeft={`EIU <GO> · 0=safest, 100=riskiest · Composite = 0.25·POL + 0.25·ECO + 0.20·SOV + 0.15·FX + 0.15·BANK · Bands A<20 B<40 C<60 D<80 E≥80`}
      footerRight={`Live overlay (WB): ${focus.cc} debt/GDP ${focusDebt?.toFixed(1) ?? '—'}% · GDP ${focusGdp?.toFixed(2) ?? '—'}%`}
    >
      <div className="h-full overflow-auto relative">

        {tab === 'SCORES' && (
          <table className="w-full border-collapse">
            <thead className="sticky top-0 bg-surface-deep z-10">
              <tr className="border-b border-border">
                <th onClick={() => sortBy('cc')} className="px-2 py-1 text-left text-[9px] font-mono font-bold uppercase tracking-wider text-muted-foreground cursor-pointer hover:text-foreground">Country</th>
                <th onClick={() => sortBy('composite')} className={`px-2 py-1 text-right text-[9px] font-mono font-bold uppercase tracking-wider cursor-pointer hover:text-foreground ${sortKey === 'composite' ? 'text-accent' : 'text-muted-foreground'}`}>Composite</th>
                <th className="px-2 py-1 text-center text-[9px] font-mono font-bold uppercase tracking-wider text-muted-foreground">Band</th>
                {DIMS.map(d => (
                  <th key={d.key} onClick={() => sortBy(d.key)} className={`px-2 py-1 text-right text-[9px] font-mono font-bold uppercase tracking-wider cursor-pointer hover:text-foreground ${sortKey === d.key ? 'text-accent' : 'text-muted-foreground'}`}>{d.label}</th>
                ))}
                <th className="px-2 py-1 text-left text-[9px] font-mono font-bold uppercase tracking-wider text-muted-foreground">Outlook</th>
              </tr>
            </thead>
            <tbody>
              {rows.map(c => {
                const comp = composite(c.scores);
                return (
                  <tr key={c.cc} className={`border-b border-border/40 hover:bg-surface-elevated cursor-pointer ${c.cc === selectedCountry ? 'bg-surface-elevated/60' : ''}`} onClick={() => setDrill(c)}>
                    <td className="px-2 py-0.5 text-[11px] font-mono"><span className="mr-1">{c.flag}</span><span className={`font-bold ${c.cc === selectedCountry ? 'text-accent' : ''}`}>{c.cc}</span> <span className="text-muted-foreground">{c.name}</span></td>
                    <td className={`px-2 py-0.5 text-right text-[11px] font-mono tabular-nums font-bold ${scoreTone(comp)}`}>{comp.toFixed(1)}</td>
                    <td className={`px-2 py-0.5 text-center text-[11px] font-mono font-bold ${BAND_TONE[c.band]}`}>{c.band}</td>
                    {DIMS.map(d => (
                      <td key={d.key} className={`px-2 py-0.5 text-right text-[11px] font-mono tabular-nums ${scoreTone(c.scores[d.key])}`}>{c.scores[d.key].toFixed(0)}</td>
                    ))}
                    <td className={`px-2 py-0.5 text-[10px] font-mono uppercase ${outlookTone(c.outlook)}`}>{c.outlook}</td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        )}

        {tab === 'TREND' && (
          <div className="p-2 grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-1">
            {rows.map(c => {
              const comp = composite(c.scores);
              const aggTrend = c.trends.political.map((_, i) => DIMS.reduce((a, d) => a + c.trends[d.key][i] * d.w, 0));
              return (
                <button key={c.cc} onClick={() => setDrill(c)} className="border border-border bg-surface-deep p-2 text-left hover:border-accent">
                  <div className="flex items-center justify-between">
                    <span className="text-[11px] font-mono"><span className="mr-1">{c.flag}</span><span className="font-bold">{c.cc}</span> {c.name}</span>
                    <span className={`text-lg font-mono font-bold tabular-nums ${scoreTone(comp)}`}>{comp.toFixed(0)}</span>
                  </div>
                  <div className={comp > 50 ? 'text-negative mt-1' : 'text-positive mt-1'}><Sparkline data={aggTrend} w={300} h={32} fill="currentColor" /></div>
                  <div className={`text-[9px] font-mono uppercase mt-1 ${outlookTone(c.outlook)}`}>{c.outlook}</div>
                </button>
              );
            })}
          </div>
        )}

        {tab === 'COMPARE' && (
          <div className="p-2 space-y-2">
            <div className="flex items-center gap-2">
              <span className="text-[10px] font-mono uppercase text-muted-foreground">Compare {focus.cc} vs</span>
              <select value={compareB} onChange={e => setCompareB(e.target.value)} className="px-2 py-0.5 text-[10px] font-mono bg-background border border-border text-foreground">
                {COUNTRIES.filter(c => c.cc !== focus.cc).map(c => <option key={c.cc} value={c.cc}>{c.cc} · {c.name}</option>)}
              </select>
            </div>
            <table className="w-full border-collapse text-[11px] font-mono">
              <thead><tr className="border-b border-border text-[9px] uppercase text-muted-foreground"><th className="text-left px-2 py-1">Dimension</th><th className="text-right px-2">{focus.cc}</th><th className="text-right px-2">{compare.cc}</th><th className="text-right px-2">Δ</th><th className="text-center px-2">{focus.cc} heat</th><th className="text-center px-2">{compare.cc} heat</th></tr></thead>
              <tbody>
                {DIMS.map(d => {
                  const a = focus.scores[d.key], b = compare.scores[d.key], diff = a - b;
                  return (
                    <tr key={d.key} className="border-b border-border/40">
                      <td className="px-2 py-0.5 uppercase">{d.label} <span className="text-muted-foreground">w{(d.w * 100).toFixed(0)}</span></td>
                      <td className={`px-2 py-0.5 text-right tabular-nums ${scoreTone(a)}`}>{a.toFixed(0)}</td>
                      <td className={`px-2 py-0.5 text-right tabular-nums ${scoreTone(b)}`}>{b.toFixed(0)}</td>
                      <td className={`px-2 py-0.5 text-right tabular-nums font-bold ${diff > 0 ? 'text-negative' : diff < 0 ? 'text-positive' : 'text-muted-foreground'}`}>{diff > 0 ? '+' : ''}{diff.toFixed(0)}</td>
                      <td className="px-2 py-0.5"><div className="flex justify-center"><Heatcell value={a} min={0} max={100} w={48} h={14} invert label={a.toFixed(0)} /></div></td>
                      <td className="px-2 py-0.5"><div className="flex justify-center"><Heatcell value={b} min={0} max={100} w={48} h={14} invert label={b.toFixed(0)} /></div></td>
                    </tr>
                  );
                })}
                <tr className="border-t-2 border-accent">
                  <td className="px-2 py-1 uppercase font-bold">Composite</td>
                  <td className={`px-2 py-1 text-right tabular-nums font-bold ${scoreTone(composite(focus.scores))}`}>{composite(focus.scores).toFixed(1)}</td>
                  <td className={`px-2 py-1 text-right tabular-nums font-bold ${scoreTone(composite(compare.scores))}`}>{composite(compare.scores).toFixed(1)}</td>
                  <td className="px-2 py-1 text-right tabular-nums font-bold">{(composite(focus.scores) - composite(compare.scores)).toFixed(1)}</td>
                  <td colSpan={2} />
                </tr>
              </tbody>
            </table>
          </div>
        )}

        {tab === 'NOTES' && (
          <div className="p-2 grid grid-cols-1 md:grid-cols-2 gap-1">
            {rows.map(c => (
              <div key={c.cc} className="border border-border bg-surface-deep p-2">
                <div className="flex items-center justify-between mb-1">
                  <span className="text-[11px] font-mono"><span className="mr-1">{c.flag}</span><span className="font-bold">{c.cc}</span> {c.name}</span>
                  <span className={`text-[10px] font-mono uppercase ${outlookTone(c.outlook)}`}>{c.outlook}</span>
                </div>
                <div className="text-[11px] font-mono text-foreground/90 italic">{c.notes}</div>
              </div>
            ))}
          </div>
        )}

        <CmdDrawer open={!!drill} onClose={() => setDrill(null)} title={drill ? `${drill.flag} ${drill.cc} · ${drill.name}` : ''} subtitle={drill ? `Band ${drill.band} · ${drill.outlook}` : ''}>
          {drill && (
            <div className="p-2 space-y-2">
              <div className={`text-4xl font-mono font-bold tabular-nums text-center py-2 ${BAND_TONE[drill.band]}`}>{composite(drill.scores).toFixed(1)}</div>
              {DIMS.map(d => (
                <div key={d.key} className="border border-border bg-surface-deep p-2">
                  <div className="flex justify-between text-[10px] font-mono uppercase mb-1">
                    <span className="text-accent">{d.label} <span className="text-muted-foreground">w{(d.w * 100).toFixed(0)}%</span></span>
                    <span className={`font-bold tabular-nums ${scoreTone(drill.scores[d.key])}`}>{drill.scores[d.key].toFixed(0)}</span>
                  </div>
                  <div className={drill.scores[d.key] > 50 ? 'text-negative' : 'text-positive'}><Sparkline data={drill.trends[d.key]} w={490} h={40} fill="currentColor" /></div>
                </div>
              ))}
              <div className="border border-border bg-surface-deep p-2 text-[11px] font-mono italic">{drill.notes}</div>
            </div>
          )}
        </CmdDrawer>
      </div>
    </CmdShell>
  );
}
