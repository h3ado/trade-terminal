import { useMemo } from 'react';
import { useFxBase } from '@/contexts/FxBaseContext';
import { usePrivacy } from '@/contexts/PrivacyContext';
import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
} from 'recharts';
import ExpandableChartCard from '@/components/forex/chart/ExpandableChartCard';
import { ExpandableResponsiveContainer } from '@/components/shared/ExpandChart';

const PAIRS = ['EURUSD', 'USDJPY', 'GBPUSD', 'USDCHF', 'AUDUSD', 'USDCAD', 'NZDUSD', 'USDCNH', 'USDMXN'];
const TENORS = ['1W', '2W', '1M', '3M', '6M', '1Y'];

function hash(s: string) { let h = 0; for (let i = 0; i < s.length; i++) h = (h * 31 + s.charCodeAt(i)) | 0; return h; }
function seeded(s: string, lo: number, hi: number) { return lo + ((Math.abs(hash(s)) % 1000) / 1000) * (hi - lo); }

export default function FXOptionsQuick() {
  const { pair, setPair } = useFxBase();
  const { privacyMode } = usePrivacy();
  const redact = (v: string) => (privacyMode ? '•••••' : v);

  const term = useMemo(() => TENORS.map(t => ({
    tenor: t,
    rr25: +(seeded(pair + t + 'rr25', -1.8, 1.8)).toFixed(2),
    rr10: +(seeded(pair + t + 'rr10', -2.6, 2.6)).toFixed(2),
    bf25: +(seeded(pair + t + 'bf25', 0.1, 1.1)).toFixed(2),
    bf10: +(seeded(pair + t + 'bf10', 0.3, 1.9)).toFixed(2),
  })), [pair]);

  const topRR = useMemo(() => PAIRS.map(p => ({
    pair: p,
    rr: +(seeded(p + 'rr1m', -2.5, 2.5)).toFixed(2),
    d: +(seeded(p + 'rrd1', -0.6, 0.6)).toFixed(2),
  })).sort((a, b) => Math.abs(b.d) - Math.abs(a.d)).slice(0, 10), []);

  const chain = useMemo(() => {
    const spot = seeded(pair + 'spot', 0.7, 1.4);
    const strikes = Array.from({ length: 9 }, (_, i) => +(spot * (0.96 + i * 0.01)).toFixed(4));
    return strikes.map(k => ({
      k,
      cIv: +(seeded(pair + k + 'civ', 7, 13)).toFixed(2),
      cBid: +(Math.max(0.0001, spot - k) + seeded(pair + k + 'cb', 0.002, 0.02)).toFixed(4),
      cAsk: +(Math.max(0.0001, spot - k) + seeded(pair + k + 'ca', 0.003, 0.022)).toFixed(4),
      pIv: +(seeded(pair + k + 'piv', 7, 13)).toFixed(2),
      pBid: +(Math.max(0.0001, k - spot) + seeded(pair + k + 'pb', 0.002, 0.02)).toFixed(4),
      pAsk: +(Math.max(0.0001, k - spot) + seeded(pair + k + 'pa', 0.003, 0.022)).toFixed(4),
    }));
  }, [pair]);

  return (
    <div className="space-y-3">
      <div className="flex items-center gap-2 flex-wrap">
        <span className="text-accent font-mono font-bold text-xs uppercase">FX Options Quick-Look</span>
        <span className="text-muted-foreground font-mono text-[9px]">FXOP &lt;GO&gt;</span>
        <div className="ml-auto flex items-center gap-2">
          <label className="text-[10px] font-mono text-muted-foreground">PAIR</label>
          <select value={pair} onChange={e => setPair(e.target.value)} className="bg-surface-elevated border border-border text-foreground text-[10px] font-mono px-1.5 py-0.5">
            {PAIRS.map(p => <option key={p}>{p}</option>)}
          </select>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-3">
        <ExpandableChartCard title="Risk Reversals · term" defaultHeight={220}>
          {(h) => (
            <ExpandableResponsiveContainer width="100%" height={h}>
              <LineChart data={term}>
                <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border) / 0.3)" />
                <XAxis dataKey="tenor" tick={{ fontSize: 9, fontFamily: 'monospace', fill: 'hsl(var(--accent))' }} />
                <YAxis tick={{ fontSize: 9, fontFamily: 'monospace', fill: 'hsl(var(--accent))' }} />
                <Tooltip contentStyle={{ backgroundColor: 'hsl(var(--card))', border: '1px solid hsl(var(--accent))', fontFamily: 'monospace', fontSize: 10, color: 'hsl(var(--accent))' }} itemStyle={{ color: 'hsl(var(--accent))' }} labelStyle={{ color: 'hsl(var(--accent))', fontWeight: 'bold' }} />
                <Legend wrapperStyle={{ fontFamily: 'monospace', fontSize: 9 }} />
                <Line type="monotone" dataKey="rr25" stroke="hsl(var(--accent))" strokeWidth={2} dot name="25Δ RR" />
                <Line type="monotone" dataKey="rr10" stroke="hsl(var(--negative))" strokeWidth={2} dot name="10Δ RR" />
              </LineChart>
            </ExpandableResponsiveContainer>
          )}
        </ExpandableChartCard>

        <ExpandableChartCard title="Butterflies · term" defaultHeight={220}>
          {(h) => (
            <ExpandableResponsiveContainer width="100%" height={h}>
              <LineChart data={term}>
                <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border) / 0.3)" />
                <XAxis dataKey="tenor" tick={{ fontSize: 9, fontFamily: 'monospace', fill: 'hsl(var(--accent))' }} />
                <YAxis tick={{ fontSize: 9, fontFamily: 'monospace', fill: 'hsl(var(--accent))' }} />
                <Tooltip contentStyle={{ backgroundColor: 'hsl(var(--card))', border: '1px solid hsl(var(--accent))', fontFamily: 'monospace', fontSize: 10, color: 'hsl(var(--accent))' }} itemStyle={{ color: 'hsl(var(--accent))' }} labelStyle={{ color: 'hsl(var(--accent))', fontWeight: 'bold' }} />
                <Legend wrapperStyle={{ fontFamily: 'monospace', fontSize: 9 }} />
                <Line type="monotone" dataKey="bf25" stroke="hsl(var(--accent))" strokeWidth={2} dot name="25Δ BF" />
                <Line type="monotone" dataKey="bf10" stroke="hsl(var(--positive))" strokeWidth={2} dot name="10Δ BF" />
              </LineChart>
            </ExpandableResponsiveContainer>
          )}
        </ExpandableChartCard>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-3">
        <div className="border border-border bg-surface-primary p-3">
          <div className="text-[10px] font-mono text-accent uppercase mb-1">Top 25Δ RR Moves · 1D</div>
          <table className="w-full text-[10px] font-mono">
            <thead>
              <tr className="border-b border-border">
                <th className="text-left text-accent px-1 py-1">Pair</th>
                <th className="text-right text-accent px-1 py-1">1M RR</th>
                <th className="text-right text-accent px-1 py-1">Δ 1D</th>
              </tr>
            </thead>
            <tbody>
              {topRR.map(p => (
                <tr key={p.pair} className="border-b border-grid-line last:border-0">
                  <td className="px-1 py-1 text-foreground font-bold">{p.pair}</td>
                  <td className={`px-1 py-1 text-right font-bold ${p.rr >= 0 ? 'text-positive' : 'text-negative'}`}>{p.rr >= 0 ? '+' : ''}{p.rr.toFixed(2)}</td>
                  <td className={`px-1 py-1 text-right font-bold ${p.d >= 0 ? 'text-positive' : 'text-negative'}`}>{p.d >= 0 ? '+' : ''}{p.d.toFixed(2)}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        <div className="lg:col-span-2 border border-border bg-surface-primary p-3 overflow-x-auto">
          <div className="text-[10px] font-mono text-accent uppercase mb-1">{pair} · 1M Chain (mock)</div>
          <table className="w-full text-[10px] font-mono">
            <thead>
              <tr className="border-b border-border">
                <th colSpan={3} className="text-center text-positive px-1 py-1">CALL</th>
                <th className="text-center text-accent px-1 py-1">STRIKE</th>
                <th colSpan={3} className="text-center text-negative px-1 py-1">PUT</th>
              </tr>
              <tr className="border-b border-border">
                <th className="text-right text-muted-foreground px-1 py-0.5">IV</th>
                <th className="text-right text-muted-foreground px-1 py-0.5">Bid</th>
                <th className="text-right text-muted-foreground px-1 py-0.5">Ask</th>
                <th></th>
                <th className="text-right text-muted-foreground px-1 py-0.5">Bid</th>
                <th className="text-right text-muted-foreground px-1 py-0.5">Ask</th>
                <th className="text-right text-muted-foreground px-1 py-0.5">IV</th>
              </tr>
            </thead>
            <tbody>
              {chain.map(r => (
                <tr key={r.k} className="border-b border-grid-line last:border-0">
                  <td className="px-1 py-1 text-right text-foreground">{r.cIv}</td>
                  <td className="px-1 py-1 text-right text-foreground">{redact(r.cBid.toFixed(4))}</td>
                  <td className="px-1 py-1 text-right text-foreground">{redact(r.cAsk.toFixed(4))}</td>
                  <td className="px-1 py-1 text-center text-accent font-bold">{r.k.toFixed(4)}</td>
                  <td className="px-1 py-1 text-right text-foreground">{redact(r.pBid.toFixed(4))}</td>
                  <td className="px-1 py-1 text-right text-foreground">{redact(r.pAsk.toFixed(4))}</td>
                  <td className="px-1 py-1 text-right text-foreground">{r.pIv}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
