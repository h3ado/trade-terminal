import { useMemo, useState } from 'react';
import { usePrivacy } from '@/contexts/PrivacyContext';
import {
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  BarChart,
  Bar,
  Cell,
  AreaChart,
  Area,
} from 'recharts';
import ExpandableChartCard from '@/components/forex/chart/ExpandableChartCard';
import FxProChart from '@/components/forex/chart/FxProChart';
import { ExpandableResponsiveContainer } from '@/components/shared/ExpandChart';

const G10 = ['EUR', 'GBP', 'JPY', 'CHF', 'CAD', 'AUD', 'NZD', 'SEK', 'NOK'];
const EM = ['BRL', 'MXN', 'ZAR', 'TRY', 'INR', 'IDR', 'PLN', 'HUF', 'CLP', 'COP'];

function hash(s: string) { let h = 0; for (let i = 0; i < s.length; i++) h = (h * 31 + s.charCodeAt(i)) | 0; return h; }
function seeded(s: string, lo: number, hi: number) { return lo + ((Math.abs(hash(s)) % 1000) / 1000) * (hi - lo); }

type Funding = 'JPY' | 'CHF' | 'USD' | 'EUR';

export default function FXCarryMonitor() {
  const { privacyMode } = usePrivacy();
  const redact = (v: string) => (privacyMode ? '•••••' : v);
  const [funding, setFunding] = useState<Funding>('JPY');

  const fundRate = funding === 'JPY' ? 0.25 : funding === 'CHF' ? 1.25 : funding === 'EUR' ? 3.25 : 5.25;

  const carryRows = useMemo(() => [...G10, ...EM].filter(c => c !== funding).map(c => {
    const targetRate = seeded(c + 'rate', 0.5, 18);
    const carry = targetRate - fundRate;
    const vol = seeded(c + 'vol', 6, 22);
    const sharpe = carry / vol;
    const dd = -seeded(c + 'dd', 4, 24);
    return {
      ccy: c, rate: +targetRate.toFixed(2), carry: +carry.toFixed(2), vol: +vol.toFixed(1),
      sharpe: +sharpe.toFixed(2), dd: +dd.toFixed(1),
      mtd: +seeded(c + 'mtd', -3, 5).toFixed(2),
      ytd: +seeded(c + 'ytd', -8, 18).toFixed(2),
    };
  }).sort((a, b) => b.sharpe - a.sharpe), [funding]);

  const basket = useMemo(() => Array.from({ length: 252 }, (_, i) => ({
    d: i,
    eq: 100 * (1 + seeded('basket' + funding, 0.02, 0.18) * (i / 252)) + Math.sin(i / 11) * 2.4,
    risk: 100 + Math.cos(i / 9) * 5,
  })), [funding]);

  const drawdown = useMemo(() => {
    let peak = 0;
    return basket.map(b => {
      peak = Math.max(peak, b.eq);
      return { d: b.d, dd: +((b.eq / peak - 1) * 100).toFixed(2) };
    });
  }, [basket]);

  const regime = useMemo(() => carryRows.slice(0, 5).reduce((s, r) => s + r.sharpe, 0), [carryRows]);
  const topPair = `${carryRows[0]?.ccy ?? 'USD'}${funding}`;

  return (
    <div className="space-y-3">
      <div className="flex items-center gap-2 flex-wrap">
        <span className="text-accent font-mono font-bold text-xs uppercase">FX Carry Trade Monitor</span>
        <span className="text-muted-foreground font-mono text-[9px]">CARRY &lt;GO&gt;</span>
        <div className="ml-auto flex items-center gap-2">
          <label className="text-[10px] font-mono text-muted-foreground">FUND</label>
          <div className="flex border border-border">
            {(['JPY', 'CHF', 'USD', 'EUR'] as Funding[]).map(f => (
              <button key={f} onClick={() => setFunding(f)} className={`text-[10px] font-mono px-2 py-0.5 ${funding === f ? 'bg-accent text-accent-foreground font-bold' : 'text-muted-foreground hover:text-foreground'}`}>{f}</button>
            ))}
          </div>
        </div>
      </div>

      <div className="grid grid-cols-2 md:grid-cols-4 gap-2">
        <div className="border border-border p-2"><div className="text-[9px] font-mono text-muted-foreground">FUND RATE</div><div className="text-base font-mono font-bold text-foreground">{fundRate.toFixed(2)}%</div></div>
        <div className="border border-border p-2"><div className="text-[9px] font-mono text-muted-foreground">REGIME SCORE</div><div className={`text-base font-mono font-bold ${regime >= 0 ? 'text-positive' : 'text-negative'}`}>{regime.toFixed(2)}</div></div>
        <div className="border border-border p-2"><div className="text-[9px] font-mono text-muted-foreground">TOP CARRY</div><div className="text-base font-mono font-bold text-accent">{carryRows[0]?.ccy} +{carryRows[0]?.carry.toFixed(1)}%</div></div>
        <div className="border border-border p-2"><div className="text-[9px] font-mono text-muted-foreground">REGIME</div><div className={`text-base font-mono font-bold ${regime > 0.3 ? 'text-positive' : regime < -0.3 ? 'text-negative' : 'text-muted-foreground'}`}>{regime > 0.3 ? 'RISK-ON' : regime < -0.3 ? 'RISK-OFF' : 'NEUTRAL'}</div></div>
      </div>

      <FxProChart
        symbol={topPair}
        title={`· TOP CARRY PAIR ${topPair}`}
        height={200}
        digits={funding === 'JPY' ? 3 : 5}
        initialCfg={{ timeframe: '1D', range: '3M', type: 'candle', ema20: true, ema50: true }}
      />

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-3">
        <div className="lg:col-span-2">
          <ExpandableChartCard title={`Top-5 Carry Basket · 1Y equity curve (funded ${funding})`} defaultHeight={220}>
            {(h) => (
              <ExpandableResponsiveContainer width="100%" height={h}>
                <AreaChart data={basket}>
                  <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border) / 0.3)" />
                  <XAxis dataKey="d" tick={{ fontSize: 9, fontFamily: 'monospace', fill: 'hsl(var(--accent))' }} />
                  <YAxis tick={{ fontSize: 9, fontFamily: 'monospace', fill: 'hsl(var(--accent))' }} domain={['auto', 'auto']} />
                  <Tooltip contentStyle={{ backgroundColor: 'hsl(var(--card))', border: '1px solid hsl(var(--accent))', fontFamily: 'monospace', fontSize: 10, color: 'hsl(var(--accent))' }} itemStyle={{ color: 'hsl(var(--accent))' }} labelStyle={{ color: 'hsl(var(--accent))', fontWeight: 'bold' }} />
                  <Area type="monotone" dataKey="eq" stroke="hsl(var(--accent))" fill="hsl(var(--accent) / 0.2)" />
                </AreaChart>
              </ExpandableResponsiveContainer>
            )}
          </ExpandableChartCard>
        </div>
        <ExpandableChartCard title="Drawdown" defaultHeight={220}>
          {(h) => (
            <ExpandableResponsiveContainer width="100%" height={h}>
              <AreaChart data={drawdown}>
                <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border) / 0.3)" />
                <XAxis dataKey="d" tick={{ fontSize: 9, fontFamily: 'monospace', fill: 'hsl(var(--accent))' }} />
                <YAxis tick={{ fontSize: 9, fontFamily: 'monospace', fill: 'hsl(var(--accent))' }} />
                <Tooltip contentStyle={{ backgroundColor: 'hsl(var(--card))', border: '1px solid hsl(var(--accent))', fontFamily: 'monospace', fontSize: 10, color: 'hsl(var(--accent))' }} itemStyle={{ color: 'hsl(var(--accent))' }} labelStyle={{ color: 'hsl(var(--accent))', fontWeight: 'bold' }} />
                <Area type="monotone" dataKey="dd" stroke="hsl(var(--negative))" fill="hsl(var(--negative) / 0.25)" />
              </AreaChart>
            </ExpandableResponsiveContainer>
          )}
        </ExpandableChartCard>
      </div>

      <ExpandableChartCard title={`Sharpe Ranking · funded ${funding}`} defaultHeight={220}>
        {(h) => (
          <ExpandableResponsiveContainer width="100%" height={h}>
            <BarChart data={carryRows.slice(0, 12)}>
              <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border) / 0.3)" />
              <XAxis dataKey="ccy" tick={{ fontSize: 9, fontFamily: 'monospace', fill: 'hsl(var(--accent))' }} />
              <YAxis tick={{ fontSize: 9, fontFamily: 'monospace', fill: 'hsl(var(--accent))' }} />
              <Tooltip contentStyle={{ backgroundColor: 'hsl(var(--card))', border: '1px solid hsl(var(--accent))', fontFamily: 'monospace', fontSize: 10, color: 'hsl(var(--accent))' }} itemStyle={{ color: 'hsl(var(--accent))' }} labelStyle={{ color: 'hsl(var(--accent))', fontWeight: 'bold' }} />
              <Bar dataKey="sharpe">{carryRows.slice(0, 12).map((r, i) => <Cell key={i} fill={r.sharpe >= 0 ? 'hsl(var(--positive))' : 'hsl(var(--negative))'} />)}</Bar>
            </BarChart>
          </ExpandableResponsiveContainer>
        )}
      </ExpandableChartCard>

      <div className="border border-border overflow-x-auto">
        <table className="w-full text-[10px] font-mono">
          <thead>
            <tr className="bg-surface-elevated border-b border-border">
              {['CCY', 'TARGET RATE', 'CARRY vs '+funding, 'VOL', 'SHARPE', 'MAX DD', 'MTD %', 'YTD %'].map(h => (
                <th key={h} className="px-2 py-1.5 text-accent font-bold text-right first:text-left">{h}</th>
              ))}
            </tr>
          </thead>
          <tbody>
            {carryRows.map((r, i) => (
              <tr key={r.ccy} className={`border-b border-grid-line last:border-0 ${i % 2 ? 'bg-surface-elevated/30' : ''}`}>
                <td className="px-2 py-1 text-accent font-bold">{r.ccy}</td>
                <td className="px-2 py-1 text-right text-foreground">{redact(r.rate.toFixed(2))}%</td>
                <td className={`px-2 py-1 text-right font-bold ${r.carry >= 0 ? 'text-positive' : 'text-negative'}`}>{r.carry >= 0 ? '+' : ''}{r.carry.toFixed(2)}%</td>
                <td className="px-2 py-1 text-right text-foreground">{r.vol.toFixed(1)}</td>
                <td className={`px-2 py-1 text-right font-bold ${r.sharpe >= 0 ? 'text-positive' : 'text-negative'}`}>{r.sharpe.toFixed(2)}</td>
                <td className="px-2 py-1 text-right text-negative">{r.dd.toFixed(1)}%</td>
                <td className={`px-2 py-1 text-right ${r.mtd >= 0 ? 'text-positive' : 'text-negative'}`}>{r.mtd >= 0 ? '+' : ''}{r.mtd.toFixed(2)}%</td>
                <td className={`px-2 py-1 text-right ${r.ytd >= 0 ? 'text-positive' : 'text-negative'}`}>{r.ytd >= 0 ? '+' : ''}{r.ytd.toFixed(2)}%</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
