import { useMemo, useState } from 'react';
import { useFXRates } from '@/hooks/useFXRates';
import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  BarChart,
  Bar,
  Cell,
  ComposedChart,
  Legend,
} from 'recharts';
import { usePrivacy } from '@/contexts/PrivacyContext';
import { ExpandableResponsiveContainer } from '@/components/shared/ExpandChart';

const G10 = ['EUR', 'GBP', 'JPY', 'CHF', 'CAD', 'AUD', 'NZD', 'SEK', 'NOK'];
const EM = ['CNY', 'INR', 'BRL', 'MXN', 'KRW', 'ZAR', 'TRY'];
const HEATMAP = ['USD', 'EUR', 'GBP', 'JPY', 'CHF', 'CAD', 'AUD', 'NZD', 'SEK', 'NOK'];

const REGIMES: { name: string; ccys: string[] }[] = [
  { name: 'Majors', ccys: ['EUR', 'GBP', 'JPY', 'CHF'] },
  { name: 'Commodity', ccys: ['CAD', 'AUD', 'NZD', 'NOK'] },
  { name: 'EM Asia', ccys: ['CNY', 'KRW', 'INR'] },
  { name: 'EM LatAm', ccys: ['BRL', 'MXN'] },
  { name: 'EM EMEA', ccys: ['ZAR', 'TRY'] },
];

function hash(s: string) { let h = 0; for (let i = 0; i < s.length; i++) h = (h * 31 + s.charCodeAt(i)) | 0; return h; }
function seeded(s: string, lo: number, hi: number) { const h = Math.abs(hash(s)); return lo + ((h % 1000) / 1000) * (hi - lo); }

type Bucket = 'd1' | 'w1' | 'm1' | 'ytd';

export default function WFXMonitor() {
  const { rates, loading } = useFXRates();
  const { privacyMode } = usePrivacy();
  const redact = (v: string) => (privacyMode ? '•••••' : v);
  const [bucket, setBucket] = useState<Bucket>('d1');
  const [base, setBase] = useState('USD');

  const usdOf = (c: string) => (c === 'USD' ? 1 : rates.find(r => r.ccy === c)?.usd ?? seeded(c + 'spot', 0.5, 1.6));
  const chgOf = (c: string) => (c === 'USD' ? 0 : rates.find(r => r.ccy === c)?.change_pct ?? seeded(c + 'd1', -1, 1));

  const dxyHistory = useMemo(() => Array.from({ length: 60 }, (_, i) => ({
    d: i, v: 104 + Math.sin(i / 8) * 1.4 + Math.cos(i / 4) * 0.6,
  })), []);

  const perf = useMemo(() => {
    return [...G10, ...EM].map(c => {
      const ch = chgOf(c);
      return {
        ccy: c,
        spot: usdOf(c),
        d1: ch - chgOf(base),
        w1: ch * 2.1 + seeded(c + 'w' + base, -1, 1),
        m1: ch * 3.4 + seeded(c + 'm' + base, -2, 2),
        ytd: seeded(c + 'ytd' + base, -8, 8),
        rv: seeded(c + 'rv', 4, 14),
        iv: seeded(c + 'iv', 5, 16),
        rsi: seeded(c + 'rsi', 25, 75),
        carry: seeded(c + 'carry', -4, 6),
      };
    });
  }, [rates, base]);

  const ranked = useMemo(() => [...perf].sort((a, b) => b[bucket] - a[bucket]), [perf, bucket]);
  const carryRanked = useMemo(() => [...perf].sort((a, b) => b.carry - a.carry), [perf]);
  const volPanel = useMemo(() => perf.slice(0, 14).map(p => ({ ccy: p.ccy, rv: p.rv, iv: p.iv })), [perf]);

  const regimeStats = useMemo(() => REGIMES.map(g => {
    const arr = g.ccys.map(c => perf.find(p => p.ccy === c)).filter(Boolean) as typeof perf;
    const avg = arr.reduce((s, x) => s + x[bucket], 0) / Math.max(1, arr.length);
    const up = arr.filter(x => x[bucket] > 0).length;
    return { name: g.name, avg, up, total: arr.length };
  }), [perf, bucket]);

  // Heatmap matrix (G10 + USD): row/col % change relative
  const heatCell = (r: string, c: string) => chgOf(r) - chgOf(c);

  const heatColor = (v: number) => {
    const cap = Math.max(-2, Math.min(2, v));
    if (cap >= 0) return `hsl(var(--positive) / ${0.15 + (cap / 2) * 0.6})`;
    return `hsl(var(--negative) / ${0.15 + (-cap / 2) * 0.6})`;
  };

  return (
    <div className="space-y-3">
      <div className="flex items-center gap-2 flex-wrap">
        <span className="text-accent font-mono font-bold text-xs uppercase">World FX Monitor</span>
        <span className="text-muted-foreground font-mono text-[9px]">WFX &lt;GO&gt;</span>
        {loading && <span className="text-[9px] font-mono text-muted-foreground animate-pulse">·live</span>}
        <div className="ml-auto flex items-center gap-2">
          <label className="text-[10px] font-mono text-muted-foreground">BASE</label>
          <select value={base} onChange={e => setBase(e.target.value)} className="bg-surface-elevated border border-border text-foreground text-[10px] font-mono px-1.5 py-0.5">
            {['USD', 'EUR', 'GBP', 'JPY', 'CHF'].map(c => <option key={c}>{c}</option>)}
          </select>
          <div className="flex border border-border">
            {(['d1', 'w1', 'm1', 'ytd'] as Bucket[]).map(b => (
              <button key={b} onClick={() => setBucket(b)} className={`text-[10px] font-mono px-2 py-0.5 ${bucket === b ? 'bg-accent text-accent-foreground font-bold' : 'text-muted-foreground hover:text-foreground'}`}>
                {b.toUpperCase()}
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* KPI strip */}
      <div className="grid grid-cols-2 md:grid-cols-5 gap-2">
        {[
          { l: 'DXY', v: '104.12', c: -0.27 },
          { l: 'EUR/USD', v: (usdOf('EUR')).toFixed(4), c: chgOf('EUR') },
          { l: 'USD/JPY', v: (1 / usdOf('JPY')).toFixed(2), c: -chgOf('JPY') },
          { l: 'GBP/USD', v: (usdOf('GBP')).toFixed(4), c: chgOf('GBP') },
          { l: 'USD/CNH', v: (1 / usdOf('CNY')).toFixed(4), c: -chgOf('CNY') },
        ].map(k => (
          <div key={k.l} className="border border-border p-2">
            <div className="text-[9px] font-mono text-muted-foreground">{k.l}</div>
            <div className="text-lg font-mono font-bold text-foreground">{redact(k.v)}</div>
            <div className={`text-[9px] font-mono ${k.c < 0 ? 'text-negative' : 'text-positive'}`}>{k.c >= 0 ? '+' : ''}{k.c.toFixed(2)}%</div>
          </div>
        ))}
      </div>

      {/* DXY chart + ranking */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-3">
        <div className="lg:col-span-2 border border-border bg-surface-primary p-3">
          <div className="text-[10px] font-mono text-muted-foreground mb-1">DXY · 60D rolling</div>
          <ExpandableResponsiveContainer width="100%" height={180}>
            <LineChart data={dxyHistory}>
              <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border) / 0.3)" />
              <XAxis dataKey="d" tick={{ fontSize: 9, fontFamily: 'monospace', fill: 'hsl(var(--accent))' }} />
              <YAxis domain={['auto', 'auto']} tick={{ fontSize: 9, fontFamily: 'monospace', fill: 'hsl(var(--accent))' }} />
              <Tooltip contentStyle={{ backgroundColor: 'hsl(var(--card))', border: '1px solid hsl(var(--accent))', fontFamily: 'monospace', fontSize: 10, color: 'hsl(var(--accent))' }} itemStyle={{ color: 'hsl(var(--accent))' }} labelStyle={{ color: 'hsl(var(--accent))', fontWeight: 'bold' }} />
              <Line type="monotone" dataKey="v" stroke="hsl(var(--accent))" strokeWidth={2} dot={false} />
            </LineChart>
          </ExpandableResponsiveContainer>
        </div>
        <div className="border border-border bg-surface-primary p-3">
          <div className="text-[10px] font-mono text-muted-foreground mb-1">Ranking · {bucket.toUpperCase()} vs {base}</div>
          <ExpandableResponsiveContainer width="100%" height={180}>
            <BarChart data={ranked} layout="vertical">
              <XAxis type="number" tick={{ fontSize: 9, fontFamily: 'monospace', fill: 'hsl(var(--accent))' }} />
              <YAxis dataKey="ccy" type="category" tick={{ fontSize: 9, fontFamily: 'monospace', fill: 'hsl(var(--accent))' }} width={36} />
              <Tooltip contentStyle={{ backgroundColor: 'hsl(var(--card))', border: '1px solid hsl(var(--accent))', fontFamily: 'monospace', fontSize: 10, color: 'hsl(var(--accent))' }} itemStyle={{ color: 'hsl(var(--accent))' }} labelStyle={{ color: 'hsl(var(--accent))', fontWeight: 'bold' }} />
              <Bar dataKey={bucket}>
                {ranked.map((p, i) => <Cell key={i} fill={p[bucket] >= 0 ? 'hsl(var(--positive))' : 'hsl(var(--negative))'} />)}
              </Bar>
            </BarChart>
          </ExpandableResponsiveContainer>
        </div>
      </div>

      {/* Heatmap + Regimes */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-3">
        <div className="lg:col-span-2 border border-border bg-surface-primary p-3">
          <div className="text-[10px] font-mono text-accent uppercase mb-2">Cross Heatmap · 1D %</div>
          <div className="overflow-x-auto">
            <table className="text-[10px] font-mono">
              <thead>
                <tr>
                  <th className="px-1.5 py-1 text-muted-foreground"></th>
                  {HEATMAP.map(c => <th key={c} className="px-2 py-1 text-accent font-bold">{c}</th>)}
                </tr>
              </thead>
              <tbody>
                {HEATMAP.map(r => (
                  <tr key={r}>
                    <td className="px-1.5 py-1 text-accent font-bold">{r}</td>
                    {HEATMAP.map(c => {
                      if (r === c) return <td key={c} className="px-2 py-1 text-muted-foreground/40 text-center">—</td>;
                      const v = heatCell(r, c);
                      return (
                        <td key={c} className="px-2 py-1 text-center text-foreground font-bold" style={{ backgroundColor: heatColor(v) }}>
                          {v >= 0 ? '+' : ''}{v.toFixed(2)}
                        </td>
                      );
                    })}
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>

        <div className="border border-border bg-surface-primary p-3">
          <div className="text-[10px] font-mono text-accent uppercase mb-2">Regime Tiles · {bucket.toUpperCase()}</div>
          <div className="space-y-1.5">
            {regimeStats.map(g => (
              <div key={g.name} className="border border-border p-2 flex justify-between items-center">
                <div>
                  <div className="text-[10px] font-mono font-bold text-foreground">{g.name}</div>
                  <div className="text-[9px] font-mono text-muted-foreground">breadth {g.up}/{g.total}</div>
                </div>
                <div className={`text-sm font-mono font-bold ${g.avg >= 0 ? 'text-positive' : 'text-negative'}`}>
                  {g.avg >= 0 ? '+' : ''}{g.avg.toFixed(2)}%
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Vol panel + carry rail */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-3">
        <div className="lg:col-span-2 border border-border bg-surface-primary p-3">
          <div className="text-[10px] font-mono text-accent uppercase mb-1">Realized vs Implied Vol · 1M</div>
          <ExpandableResponsiveContainer width="100%" height={200}>
            <ComposedChart data={volPanel}>
              <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border) / 0.3)" />
              <XAxis dataKey="ccy" tick={{ fontSize: 9, fontFamily: 'monospace', fill: 'hsl(var(--accent))' }} />
              <YAxis tick={{ fontSize: 9, fontFamily: 'monospace', fill: 'hsl(var(--accent))' }} />
              <Tooltip contentStyle={{ backgroundColor: 'hsl(var(--card))', border: '1px solid hsl(var(--accent))', fontFamily: 'monospace', fontSize: 10, color: 'hsl(var(--accent))' }} itemStyle={{ color: 'hsl(var(--accent))' }} labelStyle={{ color: 'hsl(var(--accent))', fontWeight: 'bold' }} />
              <Legend wrapperStyle={{ fontFamily: 'monospace', fontSize: 9 }} />
              <Bar dataKey="rv" fill="hsl(var(--muted-foreground) / 0.55)" name="Realized" />
              <Bar dataKey="iv" fill="hsl(var(--accent))" name="Implied" />
            </ComposedChart>
          </ExpandableResponsiveContainer>
        </div>
        <div className="border border-border bg-surface-primary p-3">
          <div className="text-[10px] font-mono text-accent uppercase mb-1">Carry Ranking · 1Y</div>
          <div className="space-y-0.5">
            {carryRanked.map(p => (
              <div key={p.ccy} className="flex items-center justify-between text-[10px] font-mono py-0.5 border-b border-grid-line last:border-0">
                <span className="text-foreground w-10">{p.ccy}</span>
                <div className="flex-1 mx-2 h-1.5 bg-surface-elevated relative">
                  <div className={`absolute top-0 h-full ${p.carry >= 0 ? 'bg-positive' : 'bg-negative'}`}
                    style={{ width: `${Math.min(100, Math.abs(p.carry) * 18)}%`, left: p.carry >= 0 ? '50%' : `${50 - Math.min(50, Math.abs(p.carry) * 18)}%` }} />
                  <div className="absolute top-0 left-1/2 w-px h-full bg-border" />
                </div>
                <span className={`w-12 text-right font-bold ${p.carry >= 0 ? 'text-positive' : 'text-negative'}`}>{p.carry >= 0 ? '+' : ''}{p.carry.toFixed(2)}%</span>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Master table */}
      <div className="border border-border overflow-x-auto">
        <table className="w-full text-[10px] font-mono">
          <thead>
            <tr className="bg-surface-elevated border-b border-border">
              {['CCY', 'SPOT vs USD', '1D %', '1W %', '1M %', 'YTD %', 'REAL VOL', 'IMPL VOL', 'CARRY', 'RSI(14)'].map(h => (
                <th key={h} className="px-2 py-1.5 text-accent font-bold text-right first:text-left">{h}</th>
              ))}
            </tr>
          </thead>
          <tbody>
            {perf.map((p, i) => (
              <tr key={p.ccy} className={`border-b border-grid-line last:border-0 ${i % 2 ? 'bg-surface-elevated/30' : ''}`}>
                <td className="px-2 py-1 text-accent font-bold">{p.ccy}</td>
                <td className="px-2 py-1 text-right text-foreground">{redact(p.spot.toFixed(4))}</td>
                {[p.d1, p.w1, p.m1, p.ytd].map((v, j) => (
                  <td key={j} className={`px-2 py-1 text-right font-bold ${v >= 0 ? 'text-positive' : 'text-negative'}`}>
                    {v >= 0 ? '+' : ''}{v.toFixed(2)}%
                  </td>
                ))}
                <td className="px-2 py-1 text-right text-foreground">{p.rv.toFixed(1)}</td>
                <td className="px-2 py-1 text-right text-foreground">{p.iv.toFixed(1)}</td>
                <td className={`px-2 py-1 text-right font-bold ${p.carry >= 0 ? 'text-positive' : 'text-negative'}`}>{p.carry >= 0 ? '+' : ''}{p.carry.toFixed(2)}%</td>
                <td className={`px-2 py-1 text-right font-bold ${p.rsi > 70 ? 'text-negative' : p.rsi < 30 ? 'text-positive' : 'text-muted-foreground'}`}>{p.rsi.toFixed(0)}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
