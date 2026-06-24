import { useMemo, useState } from 'react';
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
} from 'recharts';
import { useFXRates } from '@/hooks/useFXRates';
import { usePrivacy } from '@/contexts/PrivacyContext';
import FxProChart from '@/components/forex/chart/FxProChart';
import ExpandableChartCard from '@/components/forex/chart/ExpandableChartCard';
import { ExpandableResponsiveContainer } from '@/components/shared/ExpandChart';


const PAIRS = ['EUR/USD', 'GBP/USD', 'USD/JPY', 'USD/CHF', 'AUD/USD', 'USD/CAD', 'NZD/USD', 'USD/MXN', 'USD/BRL', 'USD/CNY', 'USD/INR', 'USD/ZAR', 'USD/TRY', 'USD/KRW'];
const TENORS = [{ k: '1W', d: 7 }, { k: '1M', d: 30 }, { k: '3M', d: 90 }, { k: '6M', d: 180 }, { k: '1Y', d: 365 }, { k: '2Y', d: 730 }, { k: '5Y', d: 1825 }];

const RATE: Record<string, number> = {
  USD: 5.33, EUR: 3.75, GBP: 4.75, JPY: 0.50, CHF: 1.25, CAD: 4.50, AUD: 4.35, NZD: 5.00,
  MXN: 10.50, BRL: 11.25, CNY: 3.45, INR: 6.50, ZAR: 8.00, TRY: 50.00, KRW: 3.50,
};

const SPOT: Record<string, number> = {
  'EUR/USD': 1.0836, 'GBP/USD': 1.2639, 'USD/JPY': 151.42, 'USD/CHF': 0.8812,
  'AUD/USD': 0.6531, 'USD/CAD': 1.3578, 'NZD/USD': 0.6067, 'USD/MXN': 16.92,
  'USD/BRL': 4.9812, 'USD/CNY': 7.2442, 'USD/INR': 83.42, 'USD/ZAR': 18.42,
  'USD/TRY': 32.18, 'USD/KRW': 1342.80,
};

function fwd(spot: number, base: string, quote: string, days: number) {
  const rb = (RATE[base] ?? 5) / 100;
  const rq = (RATE[quote] ?? 5) / 100;
  return spot * Math.pow((1 + rq * days / 365) / (1 + rb * days / 365), 1);
}

export default function ForwardCurve() {
  const { privacyMode } = usePrivacy(); const redact = (v: any) => privacyMode ? "•••••" : String(v);
  useFXRates();
  const [pair, setPair] = useState('EUR/USD');
  const [base, quote] = pair.split('/');
  const spot = SPOT[pair];

  const curve = useMemo(() => TENORS.map(t => {
    const f = fwd(spot, base, quote, t.d);
    const pts = (f - spot) * (spot > 100 ? 100 : 10000);
    return { tenor: t.k, outright: f, pts };
  }), [pair, spot, base, quote]);

  const carry = PAIRS.map(p => {
    const [b, q] = p.split('/');
    const s = SPOT[p];
    const f = fwd(s, b, q, 365);
    const c = ((f / s) - 1) * 100;
    return { pair: p, spot: s, fwd1y: f, carry: -c };
  }).sort((a, b) => b.carry - a.carry);

  const fmt = (n: number) => n < 10 ? n.toFixed(4) : n.toFixed(2);

  return (
    <div className="space-y-3">
      <div className="flex items-center gap-2">
        <span className="text-accent font-mono font-bold text-xs uppercase">FX Forwards & Carry</span>
        <span className="text-muted-foreground font-mono text-[9px]">FRD &lt;GO&gt;</span>
      </div>

      <div className="flex gap-1 flex-wrap">
        {PAIRS.map(p => (
          <button key={p} onClick={() => setPair(p)}
            className={`px-2 py-1 text-[10px] font-mono ${pair === p ? 'bg-accent text-accent-foreground font-bold' : 'border border-border text-muted-foreground hover:bg-surface-elevated'}`}>{p}</button>
        ))}
      </div>

      <FxProChart
        symbol={pair.replace('/', '')}
        title={`· ${pair} SPOT HISTORY`}
        height={200}
        digits={pair.includes('JPY') ? 3 : 5}
        initialCfg={{ timeframe: '1D', range: '1Y', type: 'candle', ema20: true }}
      />


      <div className="grid grid-cols-1 lg:grid-cols-2 gap-3">
        <ExpandableChartCard title={`${pair} · Forward Outright Curve`} defaultHeight={200}>
          {(h) => (
            <ExpandableResponsiveContainer width="100%" height={h}>
              <LineChart data={curve}>
                <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border) / 0.3)" />
                <XAxis dataKey="tenor" tick={{ fontSize: 9, fontFamily: 'monospace', fill: 'hsl(var(--accent))' }} />
                <YAxis domain={['auto', 'auto']} tick={{ fontSize: 9, fontFamily: 'monospace', fill: 'hsl(var(--accent))' }} />
                <Tooltip contentStyle={{ backgroundColor: 'hsl(var(--card))', border: '1px solid hsl(var(--accent))', fontFamily: 'monospace', fontSize: 10, color: 'hsl(var(--accent))' }} itemStyle={{ color: 'hsl(var(--accent))' }} labelStyle={{ color: 'hsl(var(--accent))', fontWeight: 'bold' }} />
                <Line type="monotone" dataKey="outright" stroke="hsl(var(--accent))" strokeWidth={2} dot={{ r: 3 }} />
              </LineChart>
            </ExpandableResponsiveContainer>
          )}
        </ExpandableChartCard>
        <ExpandableChartCard title="Forward Points (pips)" defaultHeight={200}>
          {(h) => (
            <ExpandableResponsiveContainer width="100%" height={h}>
              <BarChart data={curve}>
                <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border) / 0.3)" />
                <XAxis dataKey="tenor" tick={{ fontSize: 9, fontFamily: 'monospace', fill: 'hsl(var(--accent))' }} />
                <YAxis tick={{ fontSize: 9, fontFamily: 'monospace', fill: 'hsl(var(--accent))' }} />
                <Tooltip contentStyle={{ backgroundColor: 'hsl(var(--card))', border: '1px solid hsl(var(--accent))', fontFamily: 'monospace', fontSize: 10, color: 'hsl(var(--accent))' }} itemStyle={{ color: 'hsl(var(--accent))' }} labelStyle={{ color: 'hsl(var(--accent))', fontWeight: 'bold' }} />
                <Bar dataKey="pts">{curve.map((d, i) => <Cell key={i} fill={d.pts >= 0 ? 'hsl(var(--positive))' : 'hsl(var(--negative))'} />)}</Bar>
              </BarChart>
            </ExpandableResponsiveContainer>
          )}
        </ExpandableChartCard>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-3">
        <div className="border border-border overflow-x-auto">
          <div className="bg-surface-elevated px-2 py-1 border-b border-border">
            <span className="text-accent font-mono font-bold text-[10px] uppercase">{pair} · Forward Curve</span>
          </div>
          <table className="w-full text-[10px] font-mono">
            <thead>
              <tr className="border-b border-grid-line">
                {['TENOR', 'OUTRIGHT', 'FWD PTS', 'IMPL YIELD Δ'].map(c => <th key={c} className="px-2 py-1 text-muted-foreground text-right first:text-left">{c}</th>)}
              </tr>
            </thead>
            <tbody>
              {curve.map((c, i) => (
                <tr key={c.tenor} className={`border-b border-grid-line ${i % 2 ? 'bg-surface-elevated/30' : ''}`}>
                  <td className="px-2 py-1 text-accent font-bold">{c.tenor}</td>
                  <td className="px-2 py-1 text-right text-foreground">{redact(fmt(c.outright))}</td>
                  <td className={`px-2 py-1 text-right font-bold ${c.pts >= 0 ? 'text-positive' : 'text-negative'}`}>{c.pts >= 0 ? '+' : ''}{c.pts.toFixed(1)}</td>
                  <td className="px-2 py-1 text-right text-muted-foreground">{((RATE[quote] ?? 0) - (RATE[base] ?? 0)).toFixed(2)}%</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        <div className="border border-border overflow-x-auto">
          <div className="bg-surface-elevated px-2 py-1 border-b border-border">
            <span className="text-accent font-mono font-bold text-[10px] uppercase">1Y Carry Ranking</span>
          </div>
          <table className="w-full text-[10px] font-mono">
            <thead>
              <tr className="border-b border-grid-line">
                {['PAIR', 'SPOT', '1Y FWD', 'CARRY %'].map(c => <th key={c} className="px-2 py-1 text-muted-foreground text-right first:text-left">{c}</th>)}
              </tr>
            </thead>
            <tbody>
              {carry.map((c, i) => (
                <tr key={c.pair} className={`border-b border-grid-line ${i % 2 ? 'bg-surface-elevated/30' : ''}`}>
                  <td className="px-2 py-1 text-accent font-bold">{c.pair}</td>
                  <td className="px-2 py-1 text-right text-foreground">{redact(fmt(c.spot))}</td>
                  <td className="px-2 py-1 text-right text-foreground">{redact(fmt(c.fwd1y))}</td>
                  <td className={`px-2 py-1 text-right font-bold ${c.carry >= 0 ? 'text-positive' : 'text-negative'}`}>{c.carry >= 0 ? '+' : ''}{c.carry.toFixed(2)}%</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
