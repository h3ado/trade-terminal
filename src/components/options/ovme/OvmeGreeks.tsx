// OVME Greeks — strike-grid table with full greeks + delta/gamma curves.
import { useMemo } from "react";
import { OvmeDeal, priceDeal } from "./OvmeWorkspace";
import { calculateBlackScholes } from "@/utils/blackScholes";
import { ExpandableResponsiveContainer } from '@/components/shared/ExpandChart';
import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Area,
  AreaChart,
} from 'recharts';

interface Props { deal: OvmeDeal; redact?: boolean }

function strikesAround(strike: number) {
  const step = 5;
  return Array.from({ length: 15 }, (_, i) => strike - 35 + i * step);
}

export default function OvmeGreeks({ deal, redact = false }: Props) {
  const rows = useMemo(() => {
    return strikesAround(deal.strike).map((K) => {
      const bs = calculateBlackScholes(deal.spot, K, deal.dte / 365, deal.rate / 100, deal.vol / 100);
      const price = deal.isCall ? bs.callPrice : bs.putPrice;
      const delta = deal.isCall ? bs.callDelta : bs.putDelta;
      const theta = deal.isCall ? bs.callTheta : bs.putTheta;
      const rho = deal.isCall ? bs.callRho : bs.putRho;
      // Synthetic higher-order
      const vanna = -bs.gamma * deal.spot * (bs.d2 / (deal.vol / 100)) * 0.0001;
      const charm = -bs.gamma * deal.spot * ((K - deal.spot) / deal.spot) * 50;
      const volga = bs.vega * (bs.d1 * bs.d2) / (deal.vol / 100) * 0.01;
      return { K, price, delta, gamma: bs.gamma, theta, vega: bs.vega, rho, vanna, charm, volga };
    });
  }, [deal]);

  const r = (n: number, d = 4) => (redact ? "••" : n.toFixed(d));

  return (
    <div className="space-y-3">
      <div className="card-terminal p-2">
        <div className="mb-3 flex items-center justify-between">
          <h3 className="text-xs font-mono font-bold text-accent uppercase tracking-wider">
            Greeks by Strike — {deal.ticker} {deal.isCall ? "Call" : "Put"} · {deal.dte} DTE · σ={deal.vol.toFixed(1)}%
          </h3>
        </div>
        <table className="w-full text-[10px] font-mono tabular-nums">
          <thead>
            <tr className="text-accent border-b border-border">
              <th className="text-left py-1.5 px-2">Strike</th>
              <th className="text-right py-1.5 px-2">Price</th>
              <th className="text-right py-1.5 px-2">Delta</th>
              <th className="text-right py-1.5 px-2">Gamma</th>
              <th className="text-right py-1.5 px-2">Theta</th>
              <th className="text-right py-1.5 px-2">Vega</th>
              <th className="text-right py-1.5 px-2">Rho</th>
              <th className="text-right py-1.5 px-2">Vanna</th>
              <th className="text-right py-1.5 px-2">Charm</th>
              <th className="text-right py-1.5 px-2">Volga</th>
            </tr>
          </thead>
          <tbody>
            {rows.map((row) => {
              const isAtm = row.K === deal.strike;
              return (
                <tr key={row.K} className={`border-b border-grid-line hover:bg-surface-elevated ${isAtm ? "bg-accent/10" : ""}`}>
                  <td className={`text-left py-1.5 px-2 ${isAtm ? "text-accent font-bold" : "text-foreground"}`}>{row.K}</td>
                  <td className="text-right py-1.5 px-2 text-foreground">{r(row.price, 2)}</td>
                  <td className="text-right py-1.5 px-2 text-positive">{r(row.delta)}</td>
                  <td className="text-right py-1.5 px-2 text-accent">{r(row.gamma, 5)}</td>
                  <td className="text-right py-1.5 px-2 text-negative">{r(row.theta)}</td>
                  <td className="text-right py-1.5 px-2 text-accent">{r(row.vega)}</td>
                  <td className="text-right py-1.5 px-2 text-foreground">{r(row.rho)}</td>
                  <td className="text-right py-1.5 px-2 text-muted-foreground">{r(row.vanna, 5)}</td>
                  <td className="text-right py-1.5 px-2 text-muted-foreground">{r(row.charm, 5)}</td>
                  <td className="text-right py-1.5 px-2 text-muted-foreground">{r(row.volga, 5)}</td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-3">
        <div className="card-terminal p-2">
          <h4 className="text-[10px] font-mono font-bold text-accent uppercase tracking-wider mb-2">Delta Curve</h4>
          {redact ? (
            <div className="h-[200px] flex items-center justify-center text-muted-foreground font-mono text-xs">•• REDACTED ••</div>
          ) : (
            <ExpandableResponsiveContainer width="100%" height={200}>
              <AreaChart data={rows} margin={{ top: 5, right: 10, left: -15, bottom: 0 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
                <XAxis dataKey="K" tick={{ fontSize: 9, fill: "hsl(var(--muted-foreground))", fontFamily: "monospace" }} stroke="hsl(var(--border))" />
                <YAxis tick={{ fontSize: 9, fill: "hsl(var(--muted-foreground))", fontFamily: "monospace" }} stroke="hsl(var(--border))" />
                <Tooltip contentStyle={{ background: "hsl(var(--card))", border: "1px solid hsl(var(--border))", fontFamily: "monospace", fontSize: 10 }} />
                <Area type="monotone" dataKey="delta" stroke="hsl(var(--positive))" fill="hsl(var(--positive) / 0.15)" strokeWidth={2} />
              </AreaChart>
            </ExpandableResponsiveContainer>
          )}
        </div>
        <div className="card-terminal p-2">
          <h4 className="text-[10px] font-mono font-bold text-accent uppercase tracking-wider mb-2">Gamma Curve</h4>
          {redact ? (
            <div className="h-[200px] flex items-center justify-center text-muted-foreground font-mono text-xs">•• REDACTED ••</div>
          ) : (
            <ExpandableResponsiveContainer width="100%" height={200}>
              <AreaChart data={rows} margin={{ top: 5, right: 10, left: -15, bottom: 0 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
                <XAxis dataKey="K" tick={{ fontSize: 9, fill: "hsl(var(--muted-foreground))", fontFamily: "monospace" }} stroke="hsl(var(--border))" />
                <YAxis tick={{ fontSize: 9, fill: "hsl(var(--muted-foreground))", fontFamily: "monospace" }} stroke="hsl(var(--border))" />
                <Tooltip contentStyle={{ background: "hsl(var(--card))", border: "1px solid hsl(var(--border))", fontFamily: "monospace", fontSize: 10 }} />
                <Area type="monotone" dataKey="gamma" stroke="hsl(var(--accent))" fill="hsl(var(--accent) / 0.15)" strokeWidth={2} />
              </AreaChart>
            </ExpandableResponsiveContainer>
          )}
        </div>
      </div>
    </div>
  );
}
