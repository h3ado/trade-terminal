import { useMemo, useState } from 'react';
import { useFXRates } from '@/hooks/useFXRates';
import { usePrivacy } from '@/contexts/PrivacyContext';
import FxProChart from '@/components/forex/chart/FxProChart';
import { ExpandableResponsiveContainer } from '@/components/shared/ExpandChart';
import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
} from 'recharts';


const PAIRS = [
  'EUR/USD', 'GBP/USD', 'USD/JPY', 'USD/CHF', 'AUD/USD', 'NZD/USD', 'USD/CAD',
  'USD/CNY', 'USD/HKD', 'USD/SGD', 'USD/KRW', 'USD/INR', 'USD/MXN', 'USD/BRL',
  'USD/ZAR', 'USD/TRY', 'USD/SEK', 'USD/NOK', 'EUR/GBP', 'EUR/JPY', 'GBP/JPY',
];

function hash(s: string) { let h = 0; for (let i = 0; i < s.length; i++) h = (h * 31 + s.charCodeAt(i)) | 0; return h; }
function seeded(s: string, lo: number, hi: number) { const h = Math.abs(hash(s)); return lo + ((h % 1000) / 1000) * (hi - lo); }

export default function FXInfoPortal() {
  const { rates, loading } = useFXRates();
  const { privacyMode } = usePrivacy();
  const redact = (v: string) => (privacyMode ? '•••••' : v);

  const [pair, setPair] = useState('EUR/USD');
  const [b, q] = pair.split('/');

  const usdOf = (c: string) => (c === 'USD' ? 1 : rates.find(r => r.ccy === c)?.usd ?? NaN);
  const chgOf = (c: string) => (c === 'USD' ? 0 : rates.find(r => r.ccy === c)?.change_pct ?? 0);
  const spot = useMemo(() => {
    const v = usdOf(b) / usdOf(q);
    return isFinite(v) ? v : seeded(pair + 's', 0.8, 1.5);
  }, [pair, rates]);
  const chg = useMemo(() => chgOf(b) - chgOf(q), [pair, rates]);

  const intraday = useMemo(() => Array.from({ length: 96 }, (_, i) => ({
    t: i, v: spot * (1 + Math.sin(i / 12 + hash(pair)) * 0.0015 + (i - 48) * 0.00002),
  })), [pair, spot]);

  const forwards = useMemo(() => {
    const tenors = ['1W', '1M', '3M', '6M', '1Y', '2Y', '5Y'];
    const days = [7, 30, 90, 180, 365, 730, 1825];
    const carry = seeded(pair + 'c', -0.04, 0.04);
    return tenors.map((t, i) => {
      const fwd = spot * (1 + carry * (days[i] / 365));
      const pts = (fwd - spot) * 10000;
      return { tenor: t, fwd, pts };
    });
  }, [pair, spot]);

  const vols = useMemo(() => {
    const tenors = ['1W', '2W', '1M', '2M', '3M', '6M', '9M', '1Y'];
    const base = seeded(pair + 'v', 5, 12);
    return tenors.map((t, i) => ({
      tenor: t,
      atm: base + Math.log(i + 2) * 0.6 + seeded(pair + t, -0.3, 0.3),
      rr25: seeded(pair + 'rr' + t, -1.5, 1.5),
      bf25: seeded(pair + 'bf' + t, 0.1, 0.8),
    }));
  }, [pair]);

  const realized1M = seeded(pair + 'rv', 4, 11);
  const implied1M = vols[2]?.atm ?? 7;

  const forecasts = useMemo(() => {
    const quarters = ['Q+1', 'Q+2', 'Q+3', 'Q+4', '1Y'];
    return quarters.map((qq, i) => {
      const drift = (seeded(pair + qq, -0.04, 0.04)) * (i + 1) * 0.25;
      const med = spot * (1 + drift);
      const sd = spot * 0.025 * (i + 1) * 0.4;
      return { period: qq, med, hi: med + sd, lo: med - sd, n: Math.floor(seeded(pair + 'n' + qq, 18, 48)) };
    });
  }, [pair, spot]);

  const y2 = { b: seeded(b + 'y2', 0.5, 5.5), q: seeded(q + 'y2', 0.5, 5.5) };
  const y10 = { b: seeded(b + 'y10', 1, 5.5), q: seeded(q + 'y10', 1, 5.5) };
  const carry1Y = (forwards[4].fwd / spot - 1) * 100;

  const events = [
    { d: 'Today 14:00', e: `${b} CPI YoY`, imp: 3 },
    { d: 'Tomorrow 09:30', e: `${q} Retail Sales`, imp: 2 },
    { d: '+2d 19:00', e: `${b} CB Decision`, imp: 3 },
    { d: '+4d 13:30', e: `${q} NFP / Jobs`, imp: 3 },
    { d: '+6d 12:00', e: `${b} PMI Flash`, imp: 2 },
    { d: '+9d 10:00', e: `${q} GDP QoQ`, imp: 2 },
  ];

  return (
    <div className="space-y-3">
      <div className="flex items-center gap-2 flex-wrap">
        <span className="text-accent font-mono font-bold text-xs uppercase">FX Information Portal</span>
        <span className="text-muted-foreground font-mono text-[9px]">FXIP &lt;GO&gt;</span>
        {loading && <span className="text-[9px] font-mono text-muted-foreground animate-pulse">·live</span>}
        <div className="ml-auto flex items-center gap-2">
          <label className="text-[10px] font-mono text-muted-foreground">PAIR</label>
          <select value={pair} onChange={e => setPair(e.target.value)} className="bg-surface-elevated border border-border text-foreground text-[10px] font-mono px-1.5 py-0.5">
            {PAIRS.map(p => <option key={p}>{p}</option>)}
          </select>
        </div>
      </div>

      {/* Sticky header strip */}
      <div className="grid grid-cols-2 md:grid-cols-6 gap-2 border border-border bg-surface-primary p-2">
        <div><div className="text-[9px] font-mono text-muted-foreground">PAIR</div><div className="text-sm font-mono font-bold text-accent">{pair}</div></div>
        <div><div className="text-[9px] font-mono text-muted-foreground">SPOT</div><div className="text-sm font-mono font-bold text-foreground">{redact(spot.toFixed(5))}</div></div>
        <div><div className="text-[9px] font-mono text-muted-foreground">1D Δ</div><div className={`text-sm font-mono font-bold ${chg >= 0 ? 'text-positive' : 'text-negative'}`}>{chg >= 0 ? '+' : ''}{chg.toFixed(2)}%</div></div>
        <div><div className="text-[9px] font-mono text-muted-foreground">IV 1M</div><div className="text-sm font-mono font-bold text-foreground">{implied1M.toFixed(2)}</div></div>
        <div><div className="text-[9px] font-mono text-muted-foreground">FWD 3M (pts)</div><div className="text-sm font-mono font-bold text-foreground">{forwards[2].pts.toFixed(1)}</div></div>
        <div><div className="text-[9px] font-mono text-muted-foreground">CARRY 1Y</div><div className={`text-sm font-mono font-bold ${carry1Y >= 0 ? 'text-positive' : 'text-negative'}`}>{carry1Y >= 0 ? '+' : ''}{carry1Y.toFixed(2)}%</div></div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-3">
        {/* Spot chart — FxProChart with indicators + expand */}
        <div className="lg:col-span-2 flex flex-col gap-2">
          <FxProChart
            symbol={pair.replace('/', '')}
            title={`· ${pair}`}
            height={240}
            digits={pair.includes('JPY') ? 3 : 5}
            initialCfg={{ timeframe: '1h', range: '5D', type: 'candle' }}
          />
          <div className="grid grid-cols-4 gap-2 text-[10px] font-mono">
            {[['1D', chg], ['1W', chg * 2.1], ['1M', chg * 3.4], ['YTD', seeded(pair + 'ytd', -8, 8)]].map(([l, v]) => (
              <div key={l as string} className="border border-border p-1.5 bg-surface-primary">
                <div className="text-[9px] text-muted-foreground">{l}</div>
                <div className={`font-bold ${(v as number) >= 0 ? 'text-positive' : 'text-negative'}`}>{(v as number) >= 0 ? '+' : ''}{(v as number).toFixed(2)}%</div>
              </div>
            ))}
          </div>
        </div>


        {/* Carry & rate diff */}
        <div className="border border-border bg-surface-primary p-3">
          <div className="text-[10px] font-mono text-accent uppercase mb-2">Carry & Rate Differential</div>
          <table className="w-full text-[10px] font-mono">
            <tbody>
              <tr className="border-b border-grid-line"><td className="py-1 text-muted-foreground">{b} 2Y</td><td className="text-right text-foreground">{y2.b.toFixed(2)}%</td></tr>
              <tr className="border-b border-grid-line"><td className="py-1 text-muted-foreground">{q} 2Y</td><td className="text-right text-foreground">{y2.q.toFixed(2)}%</td></tr>
              <tr className="border-b border-grid-line"><td className="py-1 text-accent font-bold">2Y Diff</td><td className={`text-right font-bold ${y2.b - y2.q >= 0 ? 'text-positive' : 'text-negative'}`}>{(y2.b - y2.q).toFixed(2)}%</td></tr>
              <tr className="border-b border-grid-line"><td className="py-1 text-muted-foreground">{b} 10Y</td><td className="text-right text-foreground">{y10.b.toFixed(2)}%</td></tr>
              <tr className="border-b border-grid-line"><td className="py-1 text-muted-foreground">{q} 10Y</td><td className="text-right text-foreground">{y10.q.toFixed(2)}%</td></tr>
              <tr className="border-b border-grid-line"><td className="py-1 text-accent font-bold">10Y Diff</td><td className={`text-right font-bold ${y10.b - y10.q >= 0 ? 'text-positive' : 'text-negative'}`}>{(y10.b - y10.q).toFixed(2)}%</td></tr>
              <tr className="border-b border-grid-line"><td className="py-1 text-muted-foreground">Carry 1Y (fwd)</td><td className={`text-right font-bold ${carry1Y >= 0 ? 'text-positive' : 'text-negative'}`}>{carry1Y.toFixed(2)}%</td></tr>
              <tr><td className="py-1 text-muted-foreground">Carry / Vol</td><td className="text-right font-bold text-foreground">{(carry1Y / implied1M).toFixed(2)}</td></tr>
            </tbody>
          </table>
        </div>

        {/* Forward curve */}
        <div className="border border-border bg-surface-primary p-3">
          <div className="text-[10px] font-mono text-accent uppercase mb-1">Forward Curve</div>
          <ExpandableResponsiveContainer width="100%" height={140}>
            <LineChart data={forwards}>
              <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border) / 0.3)" />
              <XAxis dataKey="tenor" tick={{ fontSize: 9, fontFamily: 'monospace', fill: 'hsl(var(--accent))' }} />
              <YAxis domain={['auto', 'auto']} tick={{ fontSize: 9, fontFamily: 'monospace', fill: 'hsl(var(--accent))' }} />
              <Tooltip contentStyle={{ backgroundColor: 'hsl(var(--card))', border: '1px solid hsl(var(--accent))', fontFamily: 'monospace', fontSize: 10, color: 'hsl(var(--accent))' }} itemStyle={{ color: 'hsl(var(--accent))' }} labelStyle={{ color: 'hsl(var(--accent))', fontWeight: 'bold' }} />
              <Line type="monotone" dataKey="fwd" stroke="hsl(var(--accent))" strokeWidth={2} dot={false} />
            </LineChart>
          </ExpandableResponsiveContainer>
          <table className="w-full text-[10px] font-mono mt-1">
            <thead><tr className="text-muted-foreground"><th className="text-left">Tenor</th><th className="text-right">Outright</th><th className="text-right">Pts</th></tr></thead>
            <tbody>
              {forwards.map(f => (
                <tr key={f.tenor} className="border-t border-grid-line">
                  <td className="py-0.5 text-foreground">{f.tenor}</td>
                  <td className="text-right text-foreground">{f.fwd.toFixed(5)}</td>
                  <td className={`text-right ${f.pts >= 0 ? 'text-positive' : 'text-negative'}`}>{f.pts.toFixed(1)}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        {/* Options vols */}
        <div className="border border-border bg-surface-primary p-3 lg:col-span-2">
          <div className="text-[10px] font-mono text-accent uppercase mb-1">Options · ATM IV Term + Skew</div>
          <ExpandableResponsiveContainer width="100%" height={140}>
            <LineChart data={vols}>
              <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border) / 0.3)" />
              <XAxis dataKey="tenor" tick={{ fontSize: 9, fontFamily: 'monospace', fill: 'hsl(var(--accent))' }} />
              <YAxis tick={{ fontSize: 9, fontFamily: 'monospace', fill: 'hsl(var(--accent))' }} />
              <Tooltip contentStyle={{ backgroundColor: 'hsl(var(--card))', border: '1px solid hsl(var(--accent))', fontFamily: 'monospace', fontSize: 10, color: 'hsl(var(--accent))' }} itemStyle={{ color: 'hsl(var(--accent))' }} labelStyle={{ color: 'hsl(var(--accent))', fontWeight: 'bold' }} />
              <Line type="monotone" dataKey="atm" stroke="hsl(var(--accent))" strokeWidth={2} dot={false} name="ATM IV" />
              <Line type="monotone" dataKey="rr25" stroke="hsl(var(--positive))" strokeWidth={1.5} dot={false} name="25Δ RR" />
              <Line type="monotone" dataKey="bf25" stroke="hsl(var(--negative))" strokeWidth={1.5} dot={false} name="25Δ BF" />
            </LineChart>
          </ExpandableResponsiveContainer>
          <div className="grid grid-cols-3 gap-2 mt-2 text-[10px] font-mono">
            <div className="border border-border p-1.5"><div className="text-[9px] text-muted-foreground">Realized 1M</div><div className="font-bold text-foreground">{realized1M.toFixed(2)}</div></div>
            <div className="border border-border p-1.5"><div className="text-[9px] text-muted-foreground">Implied 1M</div><div className="font-bold text-foreground">{implied1M.toFixed(2)}</div></div>
            <div className="border border-border p-1.5"><div className="text-[9px] text-muted-foreground">IV − RV</div><div className={`font-bold ${implied1M - realized1M >= 0 ? 'text-negative' : 'text-positive'}`}>{(implied1M - realized1M).toFixed(2)}</div></div>
          </div>
        </div>

        {/* Forecasts */}
        <div className="border border-border bg-surface-primary p-3">
          <div className="text-[10px] font-mono text-accent uppercase mb-1">Consensus Forecast</div>
          <table className="w-full text-[10px] font-mono">
            <thead className="text-muted-foreground"><tr><th className="text-left">Period</th><th className="text-right">Lo</th><th className="text-right">Med</th><th className="text-right">Hi</th><th className="text-right">n</th></tr></thead>
            <tbody>
              {forecasts.map(f => (
                <tr key={f.period} className="border-t border-grid-line">
                  <td className="py-1 text-accent">{f.period}</td>
                  <td className="text-right text-negative">{f.lo.toFixed(4)}</td>
                  <td className="text-right text-foreground font-bold">{f.med.toFixed(4)}</td>
                  <td className="text-right text-positive">{f.hi.toFixed(4)}</td>
                  <td className="text-right text-muted-foreground">{f.n}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        {/* Events */}
        <div className="border border-border bg-surface-primary p-3 lg:col-span-3">
          <div className="text-[10px] font-mono text-accent uppercase mb-1">News & Events ({b} + {q})</div>
          <table className="w-full text-[10px] font-mono">
            <thead><tr className="text-muted-foreground border-b border-border"><th className="text-left py-1">When</th><th className="text-left">Event</th><th className="text-center">Importance</th></tr></thead>
            <tbody>
              {events.map((e, i) => (
                <tr key={i} className="border-b border-grid-line last:border-0">
                  <td className="py-1 text-muted-foreground">{e.d}</td>
                  <td className="text-foreground">{e.e}</td>
                  <td className="text-center text-accent">{'★'.repeat(e.imp)}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
