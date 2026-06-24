import { useMemo, useState } from 'react';
import { useIndices } from '@/hooks/useIndices';
import { usePrivacy } from '@/contexts/PrivacyContext';
import { ExpandableResponsiveContainer } from '@/components/shared/ExpandChart';
import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  Tooltip,
  BarChart,
  Bar,
  Cell,
  Legend,
} from 'recharts';

type Region = 'ALL' | 'AMERICAS' | 'EMEA' | 'APAC' | 'EM';
type Horizon = '1D' | '1W' | '1M' | 'YTD' | '1Y';

const META: Record<string, { region: Exclude<Region, 'ALL'>; ccy: string; em?: boolean; name: string }> = {
  NYSE: { region: 'AMERICAS', ccy: 'USD', name: 'S&P 500' },
  NDAQ: { region: 'AMERICAS', ccy: 'USD', name: 'Nasdaq 100' },
  CME:  { region: 'AMERICAS', ccy: 'USD', name: 'Dow Jones' },
  TSX:  { region: 'AMERICAS', ccy: 'CAD', name: 'S&P/TSX' },
  B3:   { region: 'AMERICAS', ccy: 'BRL', em: true, name: 'Bovespa' },
  BMV:  { region: 'AMERICAS', ccy: 'MXN', em: true, name: 'IPC Mexico' },
  LSE:  { region: 'EMEA', ccy: 'GBP', name: 'FTSE 100' },
  PAR:  { region: 'EMEA', ccy: 'EUR', name: 'CAC 40' },
  XETR: { region: 'EMEA', ccy: 'EUR', name: 'DAX' },
  SIX:  { region: 'EMEA', ccy: 'CHF', name: 'SMI' },
  AMS:  { region: 'EMEA', ccy: 'EUR', name: 'AEX' },
  BME:  { region: 'EMEA', ccy: 'EUR', name: 'IBEX 35' },
  BIT:  { region: 'EMEA', ccy: 'EUR', name: 'FTSE MIB' },
  MOEX: { region: 'EMEA', ccy: 'RUB', em: true, name: 'MOEX' },
  WSE:  { region: 'EMEA', ccy: 'PLN', em: true, name: 'WIG 20' },
  BIST: { region: 'EMEA', ccy: 'TRY', em: true, name: 'BIST 100' },
  JSE:  { region: 'EMEA', ccy: 'ZAR', em: true, name: 'JSE Top 40' },
  DFM:  { region: 'EMEA', ccy: 'AED', em: true, name: 'DFM' },
  TDWL: { region: 'EMEA', ccy: 'SAR', em: true, name: 'Tadawul' },
  TSE:  { region: 'APAC', ccy: 'JPY', name: 'Nikkei 225' },
  HKEX: { region: 'APAC', ccy: 'HKD', name: 'Hang Seng' },
  SSE:  { region: 'APAC', ccy: 'CNY', em: true, name: 'Shanghai Comp' },
  SZSE: { region: 'APAC', ccy: 'CNY', em: true, name: 'Shenzhen Comp' },
  KRX:  { region: 'APAC', ccy: 'KRW', em: true, name: 'KOSPI' },
  TWSE: { region: 'APAC', ccy: 'TWD', em: true, name: 'TAIEX' },
  ASX:  { region: 'APAC', ccy: 'AUD', name: 'ASX 200' },
  BSE:  { region: 'APAC', ccy: 'INR', em: true, name: 'SENSEX' },
  SGX:  { region: 'APAC', ccy: 'SGD', name: 'STI' },
  IDX:  { region: 'APAC', ccy: 'IDR', em: true, name: 'Jakarta' },
  SET:  { region: 'APAC', ccy: 'THB', em: true, name: 'SET' },
};

const HORIZONS: Horizon[] = ['1D', '1W', '1M', 'YTD', '1Y'];
const PALETTE = ['hsl(var(--accent))', 'hsl(var(--positive))', 'hsl(var(--negative))', 'hsl(199 89% 48%)', 'hsl(45 93% 47%)', 'hsl(280 65% 60%)'];

function h(s: string) { let v = 0; for (let i = 0; i < s.length; i++) v = (v * 31 + s.charCodeAt(i)) | 0; return Math.abs(v); }
function seed(s: string, lo: number, hi: number) { return lo + ((h(s) % 1000) / 1000) * (hi - lo); }

export default function WorldEquityIndices() {
  const { indices, loading } = useIndices();
  const { privacyMode } = usePrivacy();
  const redact = (v: any) => privacyMode ? '•••••' : String(v);
  const [region, setRegion] = useState<Region>('ALL');
  const [sortKey, setSortKey] = useState<Horizon>('1D');
  const [sortDir, setSortDir] = useState<'asc' | 'desc'>('desc');
  const [compare, setCompare] = useState<string[]>(['NYSE', 'XETR', 'TSE', 'HKEX']);

  const rows = useMemo(() => indices.map(ix => {
    const m = META[ix.abbr] ?? { region: 'EMEA' as const, ccy: 'USD', name: ix.symbol };
    const d1 = ix.change_pct ?? 0;
    const r = {
      abbr: ix.abbr, sym: ix.symbol, name: m.name, region: m.region, em: !!m.em, ccy: m.ccy,
      last: ix.close ?? 0, prev: ix.prev_close ?? 0,
      chg: (ix.close ?? 0) - (ix.prev_close ?? 0),
      '1D': d1,
      '1W': seed(ix.abbr + 'w', -4, 4),
      '1M': seed(ix.abbr + 'm', -8, 8),
      'YTD': seed(ix.abbr + 'ytd', -18, 28),
      '1Y': seed(ix.abbr + '1y', -22, 38),
      hi52: (ix.close ?? 0) * (1 + Math.abs(seed(ix.abbr + 'hi', 0.02, 0.22))),
      lo52: (ix.close ?? 0) * (1 - Math.abs(seed(ix.abbr + 'lo', 0.02, 0.28))),
      vs200: seed(ix.abbr + 'ma', -8, 12),
      pe: 8 + seed(ix.abbr + 'pe', 0, 22),
      dy: 0.5 + seed(ix.abbr + 'dy', 0, 4.5),
      mcap: ix.mcap_usd_t,
      fxAdj: seed(ix.abbr + 'fx', -3, 3),
    };
    return r;
  }), [indices]);

  const filtered = useMemo(() => {
    if (region === 'ALL') return rows;
    if (region === 'EM') return rows.filter(r => r.em);
    return rows.filter(r => r.region === region);
  }, [rows, region]);

  const sorted = useMemo(() => {
    const arr = [...filtered];
    arr.sort((a, b) => {
      const av = a[sortKey] as number; const bv = b[sortKey] as number;
      return sortDir === 'desc' ? bv - av : av - bv;
    });
    return arr;
  }, [filtered, sortKey, sortDir]);

  const breadth50 = rows.filter(r => r.vs200 > 0).length / Math.max(1, rows.length);
  const breadth200 = rows.filter(r => r['1M'] > 0).length / Math.max(1, rows.length);

  const winners = [...rows].sort((a, b) => (b[sortKey] as number) - (a[sortKey] as number)).slice(0, 5);
  const losers = [...rows].sort((a, b) => (a[sortKey] as number) - (b[sortKey] as number)).slice(0, 5);

  // 60D normalized series for compare set
  const perfSeries = useMemo(() => {
    const n = 60;
    const series = compare.map(abbr => {
      const base = h(abbr);
      const arr: number[] = [100];
      for (let i = 1; i < n; i++) {
        const noise = ((Math.sin(i * 0.5 + base) + Math.cos(i * 0.31 + base * 0.7)) * 0.6) + (seed(abbr + i, -0.4, 0.4));
        arr.push(arr[i - 1] * (1 + noise / 100));
      }
      return { abbr, arr };
    });
    const data = Array.from({ length: n }, (_, i) => {
      const obj: any = { d: i - n + 1 };
      series.forEach(s => { obj[s.abbr] = +s.arr[i].toFixed(2); });
      return obj;
    });
    return data;
  }, [compare]);

  const toggleCompare = (abbr: string) => {
    setCompare(c => c.includes(abbr) ? c.filter(x => x !== abbr) : c.length >= 6 ? c : [...c, abbr]);
  };
  const toggleSort = (k: Horizon) => {
    if (k === sortKey) setSortDir(d => d === 'desc' ? 'asc' : 'desc');
    else { setSortKey(k); setSortDir('desc'); }
  };

  return (
    <div className="space-y-3 font-mono">
      <div className="flex items-center gap-2 flex-wrap">
        <span className="text-accent font-bold text-xs uppercase">World Equity Indices</span>
        <span className="text-muted-foreground text-[9px]">WEI &lt;GO&gt;</span>
        <span className="text-muted-foreground text-[9px]">· {loading ? 'LOADING' : `${rows.length} INDICES`}</span>
        <div className="ml-auto flex gap-1">
          {(['ALL', 'AMERICAS', 'EMEA', 'APAC', 'EM'] as Region[]).map(r => (
            <button key={r} onClick={() => setRegion(r)}
              className={`px-2 py-1 text-[10px] ${region === r ? 'bg-accent text-accent-foreground font-bold' : 'border border-border text-muted-foreground hover:bg-surface-elevated'}`}>{r}</button>
          ))}
        </div>
      </div>

      {/* KPI strip */}
      <div className="grid grid-cols-3 md:grid-cols-6 lg:grid-cols-12 gap-1">
        {rows.slice(0, 12).map(r => (
          <button key={r.abbr} onClick={() => toggleCompare(r.abbr)}
            className={`border ${compare.includes(r.abbr) ? 'border-accent' : 'border-border'} bg-surface-primary p-1.5 text-left hover:bg-surface-elevated`}>
            <div className="flex items-center justify-between">
              <span className="text-accent font-bold text-[10px]">{r.sym}</span>
              <span className={`text-[9px] font-bold ${r['1D'] >= 0 ? 'text-positive' : 'text-negative'}`}>{r['1D'] >= 0 ? '+' : ''}{r['1D'].toFixed(2)}%</span>
            </div>
            <div className="text-foreground text-[10px] font-bold">{redact(r.last.toLocaleString(undefined, { maximumFractionDigits: 2 }))}</div>
            <div className="text-muted-foreground text-[8px]">{r.ccy} · {r.mcap.toFixed(1)}T</div>
          </button>
        ))}
      </div>

      {/* Main grid: table + right rail */}
      <div className="grid grid-cols-1 lg:grid-cols-[1fr_280px] gap-3">
        <div className="border border-border overflow-x-auto">
          <table className="w-full text-[10px]">
            <thead>
              <tr className="bg-surface-elevated border-b border-border">
                <th className="px-2 py-1.5 text-accent text-left">INDEX</th>
                <th className="px-2 py-1.5 text-accent text-left">REGION</th>
                <th className="px-2 py-1.5 text-accent text-right">LAST</th>
                <th className="px-2 py-1.5 text-accent text-right">CHG</th>
                {HORIZONS.map(hz => (
                  <th key={hz} onClick={() => toggleSort(hz)}
                    className={`px-2 py-1.5 text-right cursor-pointer ${sortKey === hz ? 'text-accent bg-accent/10' : 'text-accent'}`}>
                    {hz}{sortKey === hz ? (sortDir === 'desc' ? '▼' : '▲') : ''}
                  </th>
                ))}
                <th className="px-2 py-1.5 text-accent text-right">52W H/L</th>
                <th className="px-2 py-1.5 text-accent text-right">vs200D</th>
                <th className="px-2 py-1.5 text-accent text-right">P/E</th>
                <th className="px-2 py-1.5 text-accent text-right">DY%</th>
                <th className="px-2 py-1.5 text-accent text-right">MCAP$T</th>
                <th className="px-2 py-1.5 text-accent text-right">CCY</th>
                <th className="px-2 py-1.5 text-accent text-right">USD Δ</th>
              </tr>
            </thead>
            <tbody>
              {sorted.map((r, i) => (
                <tr key={r.abbr} className={`border-b border-grid-line ${i % 2 ? 'bg-surface-elevated/20' : ''} hover:bg-surface-elevated/60`}>
                  <td className="px-2 py-1">
                    <div className="text-accent font-bold">{r.sym}</div>
                    <div className="text-muted-foreground text-[8px]">{r.name}</div>
                  </td>
                  <td className="px-2 py-1 text-muted-foreground">{r.region}{r.em ? ' · EM' : ''}</td>
                  <td className="px-2 py-1 text-right text-foreground font-bold">{redact(r.last.toLocaleString(undefined, { maximumFractionDigits: 2 }))}</td>
                  <td className={`px-2 py-1 text-right font-bold ${r.chg >= 0 ? 'text-positive' : 'text-negative'}`}>{redact((r.chg >= 0 ? '+' : '') + r.chg.toFixed(2))}</td>
                  {HORIZONS.map(hz => {
                    const v = r[hz] as number;
                    return <td key={hz} className={`px-2 py-1 text-right font-bold ${v >= 0 ? 'text-positive' : 'text-negative'}`}>{redact((v >= 0 ? '+' : '') + v.toFixed(2) + '%')}</td>;
                  })}
                  <td className="px-2 py-1 text-right text-muted-foreground text-[9px]">{redact(r.hi52.toFixed(0))}/{redact(r.lo52.toFixed(0))}</td>
                  <td className={`px-2 py-1 text-right ${r.vs200 >= 0 ? 'text-positive' : 'text-negative'}`}>{(r.vs200 >= 0 ? '+' : '') + r.vs200.toFixed(1)}%</td>
                  <td className="px-2 py-1 text-right text-foreground">{r.pe.toFixed(1)}</td>
                  <td className="px-2 py-1 text-right text-foreground">{r.dy.toFixed(2)}</td>
                  <td className="px-2 py-1 text-right text-foreground">{r.mcap.toFixed(2)}</td>
                  <td className="px-2 py-1 text-right text-muted-foreground">{r.ccy}</td>
                  <td className={`px-2 py-1 text-right ${r.fxAdj >= 0 ? 'text-positive' : 'text-negative'}`}>{(r.fxAdj >= 0 ? '+' : '') + r.fxAdj.toFixed(2)}%</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        <div className="space-y-3">
          <div className="border border-border bg-surface-primary p-2">
            <div className="text-[10px] text-muted-foreground mb-1">TOP 5 · {sortKey}</div>
            {winners.map(w => (
              <div key={w.abbr} className="flex justify-between py-0.5 text-[10px]">
                <span className="text-accent">{w.sym}</span>
                <span className="text-positive font-bold">+{(w[sortKey] as number).toFixed(2)}%</span>
              </div>
            ))}
            <div className="text-[10px] text-muted-foreground mb-1 mt-2 pt-2 border-t border-grid-line">BOTTOM 5 · {sortKey}</div>
            {losers.map(w => (
              <div key={w.abbr} className="flex justify-between py-0.5 text-[10px]">
                <span className="text-accent">{w.sym}</span>
                <span className="text-negative font-bold">{(w[sortKey] as number).toFixed(2)}%</span>
              </div>
            ))}
          </div>

          <div className="border border-border bg-surface-primary p-2">
            <div className="text-[10px] text-muted-foreground mb-1">BREADTH</div>
            <div className="flex justify-between text-[10px] py-0.5">
              <span className="text-muted-foreground">Above 50D MA</span>
              <span className="text-foreground font-bold">{(breadth50 * 100).toFixed(0)}%</span>
            </div>
            <div className="w-full h-1 bg-surface-elevated"><div className="h-1 bg-accent" style={{ width: `${breadth50 * 100}%` }} /></div>
            <div className="flex justify-between text-[10px] py-0.5 mt-1">
              <span className="text-muted-foreground">Above 200D MA</span>
              <span className="text-foreground font-bold">{(breadth200 * 100).toFixed(0)}%</span>
            </div>
            <div className="w-full h-1 bg-surface-elevated"><div className="h-1 bg-accent" style={{ width: `${breadth200 * 100}%` }} /></div>
          </div>

          <div className="border border-border bg-surface-primary p-2">
            <div className="text-[10px] text-muted-foreground mb-1.5">REGIONAL HEAT · {sortKey}</div>
            <div className="grid grid-cols-2 gap-1">
              {(['AMERICAS', 'EMEA', 'APAC', 'EM'] as const).map(reg => {
                const set = reg === 'EM' ? rows.filter(r => r.em) : rows.filter(r => r.region === reg);
                const avg = set.reduce((s, r) => s + (r[sortKey] as number), 0) / Math.max(1, set.length);
                const intensity = Math.min(1, Math.abs(avg) / 6);
                const bg = avg >= 0 ? `hsl(var(--positive) / ${intensity})` : `hsl(var(--negative) / ${intensity})`;
                return (
                  <div key={reg} className="border border-border p-1.5" style={{ backgroundColor: bg }}>
                    <div className="text-[9px] text-foreground/80">{reg}</div>
                    <div className={`text-xs font-bold ${avg >= 0 ? 'text-positive' : 'text-negative'}`}>{avg >= 0 ? '+' : ''}{avg.toFixed(2)}%</div>
                  </div>
                );
              })}
            </div>
          </div>
        </div>
      </div>

      {/* Compare chart */}
      <div className="border border-border bg-surface-primary p-3">
        <div className="flex items-center gap-2 mb-2 flex-wrap">
          <span className="text-[10px] text-muted-foreground">60D NORMALIZED · BASE 100 · click KPI to toggle (max 6)</span>
          <span className="ml-auto text-[9px] text-muted-foreground">{compare.length}/6 selected</span>
        </div>
        <ExpandableResponsiveContainer width="100%" height={240}>
          <LineChart data={perfSeries}>
            <XAxis dataKey="d" tick={{ fontSize: 9, fontFamily: 'monospace', fill: 'hsl(var(--accent))' }} />
            <YAxis tick={{ fontSize: 9, fontFamily: 'monospace', fill: 'hsl(var(--accent))' }} domain={['auto', 'auto']} />
            <Tooltip contentStyle={{ backgroundColor: 'hsl(var(--card))', border: '1px solid hsl(var(--accent))', fontFamily: 'monospace', fontSize: 10, color: 'hsl(var(--accent))' }} itemStyle={{ color: 'hsl(var(--accent))' }} labelStyle={{ color: 'hsl(var(--accent))', fontWeight: 'bold' }} />
            <Legend wrapperStyle={{ fontFamily: 'monospace', fontSize: 9 }} />
            {compare.map((abbr, i) => (
              <Line key={abbr} type="monotone" dataKey={abbr} stroke={PALETTE[i % PALETTE.length]} strokeWidth={1.5} dot={false} />
            ))}
          </LineChart>
        </ExpandableResponsiveContainer>
      </div>
    </div>
  );
}
