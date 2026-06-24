// FXFA — Side-by-side macro fundamentals for the two currencies in a pair.
import { useMemo, useState } from 'react';
import FxProChart from '@/components/forex/chart/FxProChart';

const PAIRS = [
  'EUR/USD', 'GBP/USD', 'USD/JPY', 'USD/CHF', 'AUD/USD', 'NZD/USD', 'USD/CAD',
  'USD/CNH', 'USD/MXN', 'USD/BRL', 'USD/ZAR', 'USD/TRY', 'EUR/GBP', 'EUR/JPY', 'GBP/JPY',
];

interface Metric { k: string; label: string; unit: string; ranges: [number, number]; better: 'higher' | 'lower' | 'neutral'; }

const METRICS: Metric[] = [
  { k: 'gdp',   label: 'GDP YoY',          unit: '%', ranges: [-2, 8],   better: 'higher' },
  { k: 'cpi',   label: 'CPI YoY',          unit: '%', ranges: [-1, 12],  better: 'lower' },
  { k: 'core',  label: 'Core CPI YoY',     unit: '%', ranges: [0, 8],    better: 'lower' },
  { k: 'pol',   label: 'Policy Rate',      unit: '%', ranges: [0, 9],    better: 'neutral' },
  { k: 'y2',    label: '2Y Yield',         unit: '%', ranges: [0, 8],    better: 'neutral' },
  { k: 'y10',   label: '10Y Yield',        unit: '%', ranges: [0, 8],    better: 'neutral' },
  { k: 'une',   label: 'Unemployment',     unit: '%', ranges: [2, 12],   better: 'lower' },
  { k: 'ca',    label: 'Current Acct/GDP', unit: '%', ranges: [-5, 8],   better: 'higher' },
  { k: 'debt',  label: 'Debt/GDP',         unit: '%', ranges: [40, 260], better: 'lower' },
  { k: 'pmi',   label: 'Composite PMI',    unit: '',  ranges: [42, 60],  better: 'higher' },
  { k: 'ret',   label: 'Retail Sales YoY', unit: '%', ranges: [-4, 8],   better: 'higher' },
  { k: 'tb',    label: 'Trade Balance',    unit: 'b', ranges: [-90, 90], better: 'higher' },
];

function hash(s: string) { let h = 0; for (let i = 0; i < s.length; i++) h = (h * 31 + s.charCodeAt(i)) | 0; return h; }
function seeded(s: string, lo: number, hi: number) { return lo + ((Math.abs(hash(s)) % 1000) / 1000) * (hi - lo); }

function sparkPath(seed: string, n = 24): string {
  const pts: number[] = [];
  for (let i = 0; i < n; i++) {
    pts.push(0.5 + Math.sin(i / 4 + hash(seed)) * 0.3 + (seeded(seed + i, -0.15, 0.15)));
  }
  const w = 80, h = 20;
  return pts.map((y, i) => `${i === 0 ? 'M' : 'L'}${(i / (n - 1)) * w},${(1 - y) * h}`).join(' ');
}

export default function FXFundamentals() {
  const [pair, setPair] = useState('EUR/USD');
  const [b, q] = pair.split('/');

  const rows = useMemo(() => METRICS.map(m => {
    const a = seeded(b + m.k, m.ranges[0], m.ranges[1]);
    const c = seeded(q + m.k, m.ranges[0], m.ranges[1]);
    return { m, a, c };
  }), [pair]);

  const events = useMemo(() => {
    const ev = [
      { ccy: b, t: 'Today 14:00', e: `${b} CPI YoY`, imp: 3 },
      { ccy: q, t: 'Tomorrow 09:30', e: `${q} Retail Sales`, imp: 2 },
      { ccy: b, t: '+2d 19:00', e: `${b} CB Decision`, imp: 3 },
      { ccy: q, t: '+4d 13:30', e: `${q} NFP / Jobs`, imp: 3 },
      { ccy: b, t: '+6d 12:00', e: `${b} PMI Flash`, imp: 2 },
      { ccy: q, t: '+9d 10:00', e: `${q} GDP QoQ`, imp: 2 },
    ];
    return ev;
  }, [pair]);

  const diff = (a: number, c: number, better: Metric['better']) => {
    const d = a - c;
    if (better === 'neutral') return { d, cls: '' };
    const good = (better === 'higher' && d > 0) || (better === 'lower' && d < 0);
    return { d, cls: good ? 'text-positive' : 'text-negative' };
  };

  return (
    <div className="space-y-3">
      <div className="flex items-center gap-2 flex-wrap">
        <span className="text-accent font-mono font-bold text-xs uppercase">FX Fundamentals</span>
        <span className="text-muted-foreground font-mono text-[9px]">FXFA &lt;GO&gt;</span>
        <div className="ml-auto flex items-center gap-2">
          <label className="text-[10px] font-mono text-muted-foreground uppercase tracking-wider">PAIR</label>
          <select value={pair} onChange={e => setPair(e.target.value)}
            className="bg-surface-elevated border border-border text-foreground text-[10px] font-mono px-1.5 py-0.5 uppercase tracking-wider">
            {PAIRS.map(p => <option key={p}>{p}</option>)}
          </select>
        </div>
      </div>

      <FxProChart
        symbol={pair.replace('/', '')}
        title={`· ${pair} SPOT`}
        height={220}
        digits={pair.includes('JPY') ? 3 : 5}
        initialCfg={{ timeframe: '1D', range: '1Y', type: 'candle' }}
      />

      <div className="border border-border bg-surface-primary">
        <div className="px-2 py-1 border-b border-border text-[10px] font-mono uppercase tracking-wider text-accent flex items-center gap-3">
          <span>Side-by-Side Macro Compare</span>
          <span className="text-muted-foreground">·</span>
          <span className="text-foreground">{b}</span>
          <span className="text-muted-foreground">vs</span>
          <span className="text-foreground">{q}</span>
        </div>
        <table className="w-full text-[10px] font-mono">
          <thead>
            <tr className="bg-background border-b border-border text-muted-foreground uppercase tracking-wider">
              <th className="text-left px-2 py-1 text-[9px]">Metric</th>
              <th className="text-right px-2 py-1 text-[9px]">{b}</th>
              <th className="text-right px-2 py-1 text-[9px]">{q}</th>
              <th className="text-right px-2 py-1 text-[9px]">Diff ({b}-{q})</th>
              <th className="text-center px-2 py-1 text-[9px] w-24">12M Trend ({b})</th>
            </tr>
          </thead>
          <tbody>
            {rows.map(({ m, a, c }) => {
              const d = diff(a, c, m.better);
              return (
                <tr key={m.k} className="border-b border-grid-line last:border-0 hover:bg-background">
                  <td className="px-2 py-1 text-foreground">{m.label}</td>
                  <td className="px-2 py-1 text-right text-foreground">{a.toFixed(2)}{m.unit}</td>
                  <td className="px-2 py-1 text-right text-foreground">{c.toFixed(2)}{m.unit}</td>
                  <td className={`px-2 py-1 text-right font-bold ${d.cls}`}>{d.d >= 0 ? '+' : ''}{d.d.toFixed(2)}{m.unit}</td>
                  <td className="px-2 py-1">
                    <svg width="80" height="20" className="mx-auto block">
                      <path d={sparkPath(b + m.k)} stroke="hsl(var(--accent))" strokeWidth="1" fill="none" />
                    </svg>
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>

      <div className="border border-border bg-surface-primary">
        <div className="px-2 py-1 border-b border-border text-[10px] font-mono uppercase tracking-wider text-accent">
          Upcoming Econ Events · {b} + {q}
        </div>
        <table className="w-full text-[10px] font-mono">
          <thead>
            <tr className="bg-background border-b border-border text-muted-foreground uppercase tracking-wider">
              <th className="text-left px-2 py-1 text-[9px]">When</th>
              <th className="text-left px-2 py-1 text-[9px]">CCY</th>
              <th className="text-left px-2 py-1 text-[9px]">Event</th>
              <th className="text-center px-2 py-1 text-[9px]">Imp</th>
            </tr>
          </thead>
          <tbody>
            {events.map((e, i) => (
              <tr key={i} className="border-b border-grid-line last:border-0">
                <td className="px-2 py-1 text-muted-foreground">{e.t}</td>
                <td className="px-2 py-1 text-accent font-bold">{e.ccy}</td>
                <td className="px-2 py-1 text-foreground">{e.e}</td>
                <td className="px-2 py-1 text-center text-accent">{'★'.repeat(e.imp)}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
