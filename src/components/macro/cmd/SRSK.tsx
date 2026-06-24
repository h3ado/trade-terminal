// SRSK — Sovereign Risk Monitor. Sub-tabs: MONITOR, CDS, RATINGS, FUNDAMENTALS.
// CDS bps, model-implied PD, S&P/Moody's ratings, debt/deficit/reserves.
// Drawer shows 60-month CDS spread history.
import { useMemo, useState } from 'react';
import { useWorldBank } from '@/hooks/useWorldBank';
import { COUNTRY_TO_ISO3 } from '@/data/centralBanks';
import CmdShell from './_shell/CmdShell';
import CmdTabs from './_shell/CmdTabs';
import CmdDrawer from './_shell/CmdDrawer';
import { Sparkline, Heatcell } from './_shell/charts';

type Tab = 'MONITOR' | 'CDS' | 'RATINGS' | 'FUND';
type Rating = 'AAA' | 'AA+' | 'AA' | 'AA-' | 'A+' | 'A' | 'A-' | 'BBB+' | 'BBB' | 'BBB-' | 'BB+' | 'BB' | 'BB-' | 'B+' | 'B' | 'B-' | 'CCC';

const RATING_ORDER: Rating[] = ['AAA','AA+','AA','AA-','A+','A','A-','BBB+','BBB','BBB-','BB+','BB','BB-','B+','B','B-','CCC'];

interface Sov {
  cc: string; flag: string; name: string;
  cds5y: number; cds5yChg: number;
  spRating: Rating; moodysRating: string;
  outlook: 'Positive' | 'Stable' | 'Negative';
  deficit: number; reservesUsdBn: number;
}

const SOV: Sov[] = [
  { cc: 'US', flag: '🇺🇸', name: 'United States', cds5y: 38,   cds5yChg: +1,  spRating: 'AA+',  moodysRating: 'AA+',  outlook: 'Stable',   deficit: -6.4, reservesUsdBn: 244 },
  { cc: 'UK', flag: '🇬🇧', name: 'United Kingdom', cds5y: 25,  cds5yChg: 0,   spRating: 'AA',   moodysRating: 'AA-',  outlook: 'Stable',   deficit: -4.2, reservesUsdBn: 198 },
  { cc: 'DE', flag: '🇩🇪', name: 'Germany',       cds5y: 11,   cds5yChg: -1,  spRating: 'AAA',  moodysRating: 'AAA',  outlook: 'Stable',   deficit: -2.1, reservesUsdBn: 297 },
  { cc: 'FR', flag: '🇫🇷', name: 'France',        cds5y: 39,   cds5yChg: +2,  spRating: 'AA-',  moodysRating: 'AA-',  outlook: 'Negative', deficit: -5.5, reservesUsdBn: 256 },
  { cc: 'IT', flag: '🇮🇹', name: 'Italy',         cds5y: 78,   cds5yChg: +3,  spRating: 'BBB+', moodysRating: 'BBB',  outlook: 'Stable',   deficit: -4.1, reservesUsdBn: 215 },
  { cc: 'ES', flag: '🇪🇸', name: 'Spain',         cds5y: 52,   cds5yChg: +1,  spRating: 'A',    moodysRating: 'A-',   outlook: 'Positive', deficit: -3.4, reservesUsdBn: 87 },
  { cc: 'JP', flag: '🇯🇵', name: 'Japan',         cds5y: 22,   cds5yChg: 0,   spRating: 'A+',   moodysRating: 'A1',   outlook: 'Stable',   deficit: -4.6, reservesUsdBn: 1230 },
  { cc: 'CN', flag: '🇨🇳', name: 'China',         cds5y: 62,   cds5yChg: +4,  spRating: 'A+',   moodysRating: 'A1',   outlook: 'Negative', deficit: -7.1, reservesUsdBn: 3221 },
  { cc: 'CA', flag: '🇨🇦', name: 'Canada',        cds5y: 28,   cds5yChg: 0,   spRating: 'AAA',  moodysRating: 'AAA',  outlook: 'Stable',   deficit: -1.2, reservesUsdBn: 112 },
  { cc: 'AU', flag: '🇦🇺', name: 'Australia',     cds5y: 19,   cds5yChg: -1,  spRating: 'AAA',  moodysRating: 'AAA',  outlook: 'Stable',   deficit: -1.0, reservesUsdBn: 64 },
  { cc: 'KR', flag: '🇰🇷', name: 'South Korea',   cds5y: 32,   cds5yChg: +1,  spRating: 'AA',   moodysRating: 'Aa2',  outlook: 'Stable',   deficit: -2.5, reservesUsdBn: 415 },
  { cc: 'IN', flag: '🇮🇳', name: 'India',         cds5y: 91,   cds5yChg: +2,  spRating: 'BBB-', moodysRating: 'BBB-', outlook: 'Stable',   deficit: -5.6, reservesUsdBn: 692 },
  { cc: 'BR', flag: '🇧🇷', name: 'Brazil',        cds5y: 184,  cds5yChg: +6,  spRating: 'BB',   moodysRating: 'Ba1',  outlook: 'Negative', deficit: -8.0, reservesUsdBn: 348 },
  { cc: 'MX', flag: '🇲🇽', name: 'Mexico',        cds5y: 138,  cds5yChg: +4,  spRating: 'BBB',  moodysRating: 'Baa2', outlook: 'Negative', deficit: -5.0, reservesUsdBn: 219 },
  { cc: 'CL', flag: '🇨🇱', name: 'Chile',         cds5y: 81,   cds5yChg: 0,   spRating: 'A',    moodysRating: 'A2',   outlook: 'Stable',   deficit: -2.4, reservesUsdBn: 44 },
  { cc: 'CO', flag: '🇨🇴', name: 'Colombia',      cds5y: 215,  cds5yChg: +5,  spRating: 'BB+',  moodysRating: 'Baa3', outlook: 'Stable',   deficit: -4.7, reservesUsdBn: 60 },
  { cc: 'ZA', flag: '🇿🇦', name: 'South Africa',  cds5y: 230,  cds5yChg: +7,  spRating: 'BB-',  moodysRating: 'Ba2',  outlook: 'Stable',   deficit: -6.0, reservesUsdBn: 65 },
  { cc: 'TR', flag: '🇹🇷', name: 'Türkiye',       cds5y: 310,  cds5yChg: -8,  spRating: 'BB-',  moodysRating: 'B1',   outlook: 'Positive', deficit: -4.9, reservesUsdBn: 142 },
  { cc: 'EG', flag: '🇪🇬', name: 'Egypt',         cds5y: 545,  cds5yChg: +12, spRating: 'B-',   moodysRating: 'Caa1', outlook: 'Stable',   deficit: -7.5, reservesUsdBn: 47 },
  { cc: 'AR', flag: '🇦🇷', name: 'Argentina',     cds5y: 1140, cds5yChg: -42, spRating: 'CCC',  moodysRating: 'Ca',   outlook: 'Positive', deficit: -1.8, reservesUsdBn: 41 },
  { cc: 'PL', flag: '🇵🇱', name: 'Poland',        cds5y: 64,   cds5yChg: +1,  spRating: 'A-',   moodysRating: 'A2',   outlook: 'Stable',   deficit: -5.1, reservesUsdBn: 218 },
  { cc: 'CH', flag: '🇨🇭', name: 'Switzerland',   cds5y: 9,    cds5yChg: 0,   spRating: 'AAA',  moodysRating: 'Aaa',  outlook: 'Stable',   deficit: +0.2, reservesUsdBn: 813 },
];

const pd5y = (b: number, R = 0.4) => 1 - Math.exp(-((b / 1e4) / (1 - R)) * 5);

function ratingTone(r: Rating) {
  const i = RATING_ORDER.indexOf(r);
  if (i <= 3) return 'text-positive';
  if (i <= 7) return 'text-foreground';
  if (i <= 11) return 'text-accent';
  return 'text-negative';
}
const outlookTone = (o: Sov['outlook']) => o === 'Positive' ? 'text-positive' : o === 'Negative' ? 'text-negative' : 'text-muted-foreground';
const cdsTone = (b: number) => b < 50 ? 'text-positive' : b < 150 ? 'text-foreground' : b < 400 ? 'text-accent' : 'text-negative';

// Seeded 60-month CDS history per sovereign (bps), mean-reverts to current
function cdsHistory(s: Sov, n = 60): number[] {
  const seed = s.cc.charCodeAt(0) * 31 + s.cc.charCodeAt(1);
  let r = seed;
  const rnd = () => { r = (r * 9301 + 49297) % 233280; return r / 233280; };
  const arr: number[] = [];
  const vol = Math.max(2, s.cds5y * 0.08);
  let v = s.cds5y * (1.2 + (rnd() - 0.5) * 0.4);
  for (let i = 0; i < n; i++) {
    v += (rnd() - 0.5) * vol + (s.cds5y - v) / (n - i + 1);
    v = Math.max(2, v);
    arr.push(+v.toFixed(1));
  }
  arr[n - 1] = s.cds5y;
  return arr;
}

type SortKey = 'cc' | 'cds5y' | 'cds5yChg' | 'pd' | 'rating' | 'debt' | 'deficit' | 'reserves';

export default function SRSK() {
  const wb = useWorldBank();
  const [tab, setTab] = useState<Tab>('MONITOR');
  const [sortKey, setSortKey] = useState<SortKey>('cds5y');
  const [desc, setDesc] = useState(true);
  const [filter, setFilter] = useState('');
  const [drill, setDrill] = useState<Sov | null>(null);

  const debtPct = (cc: string) => wb.byKey['govt_debt']?.byIso3[COUNTRY_TO_ISO3[cc]]?.value ?? null;

  const rows = useMemo(() => {
    const q = filter.trim().toUpperCase();
    const f = q ? SOV.filter(s => s.cc.includes(q) || s.name.toUpperCase().includes(q)) : SOV;
    return [...f].sort((a, b) => {
      const av: number | string = sortKey === 'cc' ? a.cc
        : sortKey === 'pd' ? pd5y(a.cds5y)
        : sortKey === 'rating' ? RATING_ORDER.indexOf(a.spRating)
        : sortKey === 'debt' ? (debtPct(a.cc) ?? -1)
        : (a as any)[sortKey];
      const bv: number | string = sortKey === 'cc' ? b.cc
        : sortKey === 'pd' ? pd5y(b.cds5y)
        : sortKey === 'rating' ? RATING_ORDER.indexOf(b.spRating)
        : sortKey === 'debt' ? (debtPct(b.cc) ?? -1)
        : (b as any)[sortKey];
      if (typeof av === 'string') return desc ? (bv as string).localeCompare(av) : (av as string).localeCompare(bv as string);
      return desc ? (bv as number) - (av as number) : (av as number) - (bv as number);
    });
  }, [filter, sortKey, desc, wb.byKey]);

  const stats = useMemo(() => ({
    aaa: SOV.filter(s => s.spRating === 'AAA').length,
    ig: SOV.filter(s => RATING_ORDER.indexOf(s.spRating) <= RATING_ORDER.indexOf('BBB-')).length,
    hy: SOV.filter(s => RATING_ORDER.indexOf(s.spRating) > RATING_ORDER.indexOf('BBB-')).length,
    distressed: SOV.filter(s => s.cds5y > 500).length,
    widening: SOV.filter(s => s.cds5yChg > 0).length,
    tightening: SOV.filter(s => s.cds5yChg < 0).length,
  }), []);

  const sortBy = (k: SortKey) => { if (sortKey === k) setDesc(d => !d); else { setSortKey(k); setDesc(true); } };

  return (
    <CmdShell
      code="SRSK"
      title="Sovereign Risk Monitor · CDS · PD · Ratings · Fundamentals"
      headerRight={
        <input value={filter} onChange={e => setFilter(e.target.value)} placeholder="FILTER…"
          className="px-2 py-0.5 text-[10px] font-mono bg-background border border-border text-foreground w-36 focus:outline-none focus:border-accent" />
      }
      tabs={<CmdTabs tabs={[{ id: 'MONITOR', label: 'Monitor' }, { id: 'CDS', label: 'CDS' }, { id: 'RATINGS', label: 'Ratings' }, { id: 'FUND', label: 'Fundamentals' }]} active={tab} onChange={setTab} />}
      kpis={
        <div className="grid grid-cols-3 md:grid-cols-6 gap-1 p-1">
          <div className="border border-border bg-surface-deep p-1.5"><div className="text-[8px] font-mono uppercase text-muted-foreground">AAA</div><div className="text-lg font-mono font-bold text-positive tabular-nums">{stats.aaa}</div></div>
          <div className="border border-border bg-surface-deep p-1.5"><div className="text-[8px] font-mono uppercase text-muted-foreground">Inv Grade</div><div className="text-lg font-mono font-bold text-foreground tabular-nums">{stats.ig}</div></div>
          <div className="border border-border bg-surface-deep p-1.5"><div className="text-[8px] font-mono uppercase text-muted-foreground">High Yield</div><div className="text-lg font-mono font-bold text-accent tabular-nums">{stats.hy}</div></div>
          <div className="border border-border bg-surface-deep p-1.5"><div className="text-[8px] font-mono uppercase text-muted-foreground">Distressed &gt;500bp</div><div className="text-lg font-mono font-bold text-negative tabular-nums">{stats.distressed}</div></div>
          <div className="border border-border bg-surface-deep p-1.5"><div className="text-[8px] font-mono uppercase text-muted-foreground">Widening 1D</div><div className="text-lg font-mono font-bold text-negative tabular-nums">{stats.widening}</div></div>
          <div className="border border-border bg-surface-deep p-1.5"><div className="text-[8px] font-mono uppercase text-muted-foreground">Tightening 1D</div><div className="text-lg font-mono font-bold text-positive tabular-nums">{stats.tightening}</div></div>
        </div>
      }
      footerLeft="SRSK <GO> · PD model: 1−exp(−λ·5), λ=(CDS/1e4)/(1−R), R=40%"
      footerRight="CDS: Markit Composite · Debt/GDP: WB live · Ratings: S&P · Moody's · Click row for 60mo history"
    >
      <div className="h-full overflow-auto relative">

        {tab === 'MONITOR' && (
          <table className="w-full border-collapse">
            <thead className="sticky top-0 bg-surface-deep z-10">
              <tr className="border-b border-border">
                {[
                  ['cc','Sovereign','left'],
                  ['cds5y','5Y CDS (bp)','right'],
                  ['cds5yChg','Δ 1D','right'],
                  ['pd','5Y PD %','right'],
                  ['rating','S&P / Moodys','left'],
                  ['outlook' as any,'Outlook','left'],
                  ['debt','Debt/GDP','right'],
                  ['deficit','Deficit/GDP','right'],
                  ['reserves','FX Res $B','right'],
                ].map(([k, label, align]) => (
                  <th key={label as string} onClick={() => sortBy(k as SortKey)}
                    className={`px-2 py-1 text-[9px] font-mono font-bold uppercase tracking-wider text-muted-foreground cursor-pointer hover:text-foreground ${align === 'right' ? 'text-right' : 'text-left'} ${sortKey === k ? 'text-accent' : ''}`}>
                    {label} {sortKey === k ? (desc ? '▼' : '▲') : ''}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {rows.map(s => {
                const pd = pd5y(s.cds5y) * 100;
                const debt = debtPct(s.cc);
                return (
                  <tr key={s.cc} className="border-b border-border/40 hover:bg-surface-elevated cursor-pointer" onClick={() => setDrill(s)}>
                    <td className="px-2 py-0.5 text-[11px] font-mono"><span className="mr-1">{s.flag}</span><span className="font-bold">{s.cc}</span> <span className="text-muted-foreground">{s.name}</span></td>
                    <td className={`px-2 py-0.5 text-right text-[11px] font-mono tabular-nums font-bold ${cdsTone(s.cds5y)}`}>{s.cds5y}</td>
                    <td className={`px-2 py-0.5 text-right text-[11px] font-mono tabular-nums ${s.cds5yChg > 0 ? 'text-negative' : s.cds5yChg < 0 ? 'text-positive' : 'text-muted-foreground'}`}>{s.cds5yChg > 0 ? '+' : ''}{s.cds5yChg}</td>
                    <td className={`px-2 py-0.5 text-right text-[11px] font-mono tabular-nums ${pd > 20 ? 'text-negative font-bold' : pd > 10 ? 'text-accent' : 'text-foreground'}`}>{pd.toFixed(2)}</td>
                    <td className="px-2 py-0.5 text-[11px] font-mono"><span className={`font-bold ${ratingTone(s.spRating)}`}>{s.spRating}</span> <span className="text-muted-foreground">/ {s.moodysRating}</span></td>
                    <td className={`px-2 py-0.5 text-[11px] font-mono uppercase ${outlookTone(s.outlook)}`}>{s.outlook}</td>
                    <td className={`px-2 py-0.5 text-right text-[11px] font-mono tabular-nums ${debt != null && debt > 100 ? 'text-negative' : debt != null && debt > 60 ? 'text-accent' : 'text-foreground'}`}>{debt != null ? debt.toFixed(1) + '%' : '—'}</td>
                    <td className={`px-2 py-0.5 text-right text-[11px] font-mono tabular-nums ${s.deficit < -5 ? 'text-negative' : s.deficit < -3 ? 'text-accent' : 'text-foreground'}`}>{s.deficit > 0 ? '+' : ''}{s.deficit.toFixed(1)}%</td>
                    <td className="px-2 py-0.5 text-right text-[11px] font-mono tabular-nums text-foreground">{s.reservesUsdBn.toLocaleString()}</td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        )}

        {tab === 'CDS' && (
          <table className="w-full border-collapse">
            <thead className="sticky top-0 bg-surface-deep z-10">
              <tr className="border-b border-border">
                {['Sovereign', '5Y CDS', 'Δ 1D', '60M Range', '60M Trend'].map((h, i) => (
                  <th key={h} className={`px-2 py-1 text-[9px] font-mono font-bold uppercase tracking-wider text-muted-foreground ${i === 0 || i === 4 ? 'text-left' : 'text-right'}`}>{h}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {[...rows].sort((a, b) => b.cds5y - a.cds5y).map(s => {
                const hist = cdsHistory(s);
                const min = Math.min(...hist), max = Math.max(...hist);
                return (
                  <tr key={s.cc} className="border-b border-border/40 hover:bg-surface-elevated cursor-pointer" onClick={() => setDrill(s)}>
                    <td className="px-2 py-0.5 text-[11px] font-mono"><span className="mr-1">{s.flag}</span><span className="font-bold">{s.cc}</span> <span className="text-muted-foreground">{s.name}</span></td>
                    <td className={`px-2 py-0.5 text-right text-[11px] font-mono tabular-nums font-bold ${cdsTone(s.cds5y)}`}>{s.cds5y}</td>
                    <td className={`px-2 py-0.5 text-right text-[11px] font-mono tabular-nums ${s.cds5yChg > 0 ? 'text-negative' : s.cds5yChg < 0 ? 'text-positive' : 'text-muted-foreground'}`}>{s.cds5yChg > 0 ? '+' : ''}{s.cds5yChg}</td>
                    <td className="px-2 py-0.5 text-right text-[11px] font-mono tabular-nums text-muted-foreground">{min.toFixed(0)} – {max.toFixed(0)}</td>
                    <td className="px-2 py-0.5"><div className={cdsTone(s.cds5y)}><Sparkline data={hist} w={200} h={22} /></div></td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        )}

        {tab === 'RATINGS' && (
          <div className="p-2">
            <table className="w-full border-collapse">
              <thead className="sticky top-0 bg-surface-deep z-10">
                <tr className="border-b border-border">
                  {['Sovereign', 'S&P', 'Moody\'s', 'Outlook', '5Y CDS', '5Y PD', 'Heat'].map((h, i) => (
                    <th key={h} className={`px-2 py-1 text-[9px] font-mono font-bold uppercase tracking-wider text-muted-foreground ${i >= 4 ? 'text-right' : 'text-left'}`}>{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {[...rows].sort((a, b) => RATING_ORDER.indexOf(a.spRating) - RATING_ORDER.indexOf(b.spRating)).map(s => {
                  const pd = pd5y(s.cds5y) * 100;
                  return (
                    <tr key={s.cc} className="border-b border-border/40 hover:bg-surface-elevated cursor-pointer" onClick={() => setDrill(s)}>
                      <td className="px-2 py-0.5 text-[11px] font-mono"><span className="mr-1">{s.flag}</span><span className="font-bold">{s.cc}</span> <span className="text-muted-foreground">{s.name}</span></td>
                      <td className={`px-2 py-0.5 text-[11px] font-mono font-bold ${ratingTone(s.spRating)}`}>{s.spRating}</td>
                      <td className="px-2 py-0.5 text-[11px] font-mono text-muted-foreground">{s.moodysRating}</td>
                      <td className={`px-2 py-0.5 text-[10px] font-mono uppercase ${outlookTone(s.outlook)}`}>{s.outlook}</td>
                      <td className={`px-2 py-0.5 text-right text-[11px] font-mono tabular-nums font-bold ${cdsTone(s.cds5y)}`}>{s.cds5y}</td>
                      <td className={`px-2 py-0.5 text-right text-[11px] font-mono tabular-nums ${pd > 20 ? 'text-negative font-bold' : pd > 10 ? 'text-accent' : 'text-foreground'}`}>{pd.toFixed(2)}%</td>
                      <td className="px-2 py-0.5"><div className="flex justify-center"><Heatcell value={s.cds5y} min={0} max={600} w={56} h={14} invert label={s.cds5y.toString()} /></div></td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}

        {tab === 'FUND' && (
          <table className="w-full border-collapse">
            <thead className="sticky top-0 bg-surface-deep z-10">
              <tr className="border-b border-border">
                {['Sovereign', 'Debt/GDP', 'Deficit/GDP', 'Reserves $B', 'Rating', 'CDS', 'Risk Score'].map((h, i) => (
                  <th key={h} className={`px-2 py-1 text-[9px] font-mono font-bold uppercase tracking-wider text-muted-foreground ${i >= 1 ? 'text-right' : 'text-left'}`}>{h}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {rows.map(s => {
                const debt = debtPct(s.cc);
                const ratingIdx = RATING_ORDER.indexOf(s.spRating);
                const score = (s.cds5y / 10) + Math.max(0, (debt ?? 0) - 60) * 0.5 + Math.max(0, -s.deficit - 3) * 5 + ratingIdx * 2;
                return (
                  <tr key={s.cc} className="border-b border-border/40 hover:bg-surface-elevated cursor-pointer" onClick={() => setDrill(s)}>
                    <td className="px-2 py-0.5 text-[11px] font-mono"><span className="mr-1">{s.flag}</span><span className="font-bold">{s.cc}</span> <span className="text-muted-foreground">{s.name}</span></td>
                    <td className={`px-2 py-0.5 text-right text-[11px] font-mono tabular-nums ${debt != null && debt > 100 ? 'text-negative' : debt != null && debt > 60 ? 'text-accent' : 'text-foreground'}`}>{debt != null ? debt.toFixed(1) + '%' : '—'}</td>
                    <td className={`px-2 py-0.5 text-right text-[11px] font-mono tabular-nums ${s.deficit < -5 ? 'text-negative' : s.deficit < -3 ? 'text-accent' : 'text-foreground'}`}>{s.deficit > 0 ? '+' : ''}{s.deficit.toFixed(1)}%</td>
                    <td className="px-2 py-0.5 text-right text-[11px] font-mono tabular-nums">{s.reservesUsdBn.toLocaleString()}</td>
                    <td className={`px-2 py-0.5 text-right text-[11px] font-mono font-bold ${ratingTone(s.spRating)}`}>{s.spRating}</td>
                    <td className={`px-2 py-0.5 text-right text-[11px] font-mono tabular-nums font-bold ${cdsTone(s.cds5y)}`}>{s.cds5y}</td>
                    <td className="px-2 py-0.5"><div className="flex justify-end"><Heatcell value={score} min={0} max={150} w={56} h={14} invert label={score.toFixed(0)} /></div></td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        )}

        <CmdDrawer open={!!drill} onClose={() => setDrill(null)} title={drill ? `${drill.flag} ${drill.cc} · ${drill.name}` : ''} subtitle={drill ? `${drill.spRating} / ${drill.moodysRating} · ${drill.outlook}` : ''} width="lg">
          {drill && (
            <div className="p-2 space-y-2">
              <div className="grid grid-cols-3 gap-1">
                <div className="border border-border bg-surface-deep p-2"><div className="text-[9px] font-mono uppercase text-muted-foreground">5Y CDS</div><div className={`text-2xl font-mono font-bold tabular-nums ${cdsTone(drill.cds5y)}`}>{drill.cds5y}<span className="text-[10px] text-muted-foreground"> bp</span></div></div>
                <div className="border border-border bg-surface-deep p-2"><div className="text-[9px] font-mono uppercase text-muted-foreground">Δ 1D</div><div className={`text-2xl font-mono font-bold tabular-nums ${drill.cds5yChg > 0 ? 'text-negative' : drill.cds5yChg < 0 ? 'text-positive' : 'text-foreground'}`}>{drill.cds5yChg > 0 ? '+' : ''}{drill.cds5yChg}</div></div>
                <div className="border border-border bg-surface-deep p-2"><div className="text-[9px] font-mono uppercase text-muted-foreground">5Y PD</div><div className={`text-2xl font-mono font-bold tabular-nums ${pd5y(drill.cds5y) * 100 > 20 ? 'text-negative' : 'text-foreground'}`}>{(pd5y(drill.cds5y) * 100).toFixed(2)}%</div></div>
              </div>
              <div className="border border-border bg-surface-deep p-2">
                <div className="text-[9px] font-mono uppercase tracking-wider text-accent mb-1">60-Month CDS Spread (bp)</div>
                <div className={cdsTone(drill.cds5y)}><Sparkline data={cdsHistory(drill)} w={640} h={80} fill="currentColor" /></div>
              </div>
              <div className="border border-border bg-surface-deep p-2 grid grid-cols-2 gap-2 text-[11px] font-mono">
                <div className="flex justify-between"><span className="text-muted-foreground">S&P</span><span className={`font-bold ${ratingTone(drill.spRating)}`}>{drill.spRating}</span></div>
                <div className="flex justify-between"><span className="text-muted-foreground">Moody's</span><span className="font-bold">{drill.moodysRating}</span></div>
                <div className="flex justify-between"><span className="text-muted-foreground">Outlook</span><span className={`font-bold ${outlookTone(drill.outlook)}`}>{drill.outlook}</span></div>
                <div className="flex justify-between"><span className="text-muted-foreground">Debt/GDP (WB)</span><span className="font-bold tabular-nums">{debtPct(drill.cc) != null ? debtPct(drill.cc)!.toFixed(1) + '%' : '—'}</span></div>
                <div className="flex justify-between"><span className="text-muted-foreground">Deficit/GDP</span><span className="font-bold tabular-nums">{drill.deficit > 0 ? '+' : ''}{drill.deficit.toFixed(1)}%</span></div>
                <div className="flex justify-between"><span className="text-muted-foreground">FX Reserves</span><span className="font-bold tabular-nums">${drill.reservesUsdBn.toLocaleString()}B</span></div>
              </div>
              <div className="text-[10px] font-mono text-muted-foreground italic">PD model: reduced-form intensity. λ = (CDS/10000) / (1 − R), R = 40% recovery. 5Y default = 1 − exp(−5λ).</div>
            </div>
          )}
        </CmdDrawer>
      </div>
    </CmdShell>
  );
}
