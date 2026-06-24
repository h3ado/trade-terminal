// Strategy Payoff Diagram — interactive multi-leg P&L at expiration.
import { useMemo, useState } from "react";
import { ExpandableResponsiveContainer } from '@/components/shared/ExpandChart';
import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ReferenceLine,
  ReferenceArea,
} from 'recharts';

type Leg = { side: "BUY" | "SELL"; type: "C" | "P"; strike: number; premium: number; qty: number };

type StrategyKey = "long_call" | "long_put" | "bull_call_spread" | "iron_condor" | "straddle" | "covered_call" | "custom";

const STRATEGIES: Record<StrategyKey, { label: string; legs: (spot: number) => Leg[] }> = {
  long_call:        { label: "Long Call",         legs: (s) => [{ side: "BUY",  type: "C", strike: Math.round(s),       premium: 5.20, qty: 1 }] },
  long_put:         { label: "Long Put",          legs: (s) => [{ side: "BUY",  type: "P", strike: Math.round(s),       premium: 4.80, qty: 1 }] },
  bull_call_spread: { label: "Bull Call Spread",  legs: (s) => [
    { side: "BUY",  type: "C", strike: Math.round(s),       premium: 5.20, qty: 1 },
    { side: "SELL", type: "C", strike: Math.round(s) + 10,  premium: 1.80, qty: 1 },
  ] },
  iron_condor:      { label: "Iron Condor",       legs: (s) => [
    { side: "SELL", type: "P", strike: Math.round(s) - 10,  premium: 2.40, qty: 1 },
    { side: "BUY",  type: "P", strike: Math.round(s) - 20,  premium: 0.90, qty: 1 },
    { side: "SELL", type: "C", strike: Math.round(s) + 10,  premium: 2.10, qty: 1 },
    { side: "BUY",  type: "C", strike: Math.round(s) + 20,  premium: 0.80, qty: 1 },
  ] },
  straddle:         { label: "Long Straddle",     legs: (s) => [
    { side: "BUY",  type: "C", strike: Math.round(s),       premium: 5.20, qty: 1 },
    { side: "BUY",  type: "P", strike: Math.round(s),       premium: 4.80, qty: 1 },
  ] },
  covered_call:     { label: "Covered Call",      legs: (s) => [
    { side: "SELL", type: "C", strike: Math.round(s) + 5,   premium: 3.10, qty: 1 },
  ] },
  custom: { label: "Custom", legs: () => [] },
};

interface Props { ticker?: string; redact?: boolean; spot?: number }

function legPnL(leg: Leg, price: number) {
  const intrinsic = leg.type === "C" ? Math.max(0, price - leg.strike) : Math.max(0, leg.strike - price);
  const sign = leg.side === "BUY" ? 1 : -1;
  return sign * (intrinsic - leg.premium) * leg.qty * 100;
}

export default function PayoffDiagram({ ticker = "SPY", redact = false, spot = 595 }: Props) {
  const [strategy, setStrategy] = useState<StrategyKey>("bull_call_spread");
  const legs = useMemo(() => STRATEGIES[strategy].legs(spot), [strategy, spot]);

  const data = useMemo(() => {
    const lo = spot * 0.85, hi = spot * 1.15;
    const step = (hi - lo) / 80;
    const rows: { price: number; pnl: number }[] = [];
    for (let p = lo; p <= hi; p += step) {
      rows.push({ price: +p.toFixed(2), pnl: +legs.reduce((acc, l) => acc + legPnL(l, p), 0).toFixed(2) });
    }
    return rows;
  }, [legs, spot]);

  const maxProfit = Math.max(...data.map((d) => d.pnl));
  const maxLoss = Math.min(...data.map((d) => d.pnl));
  const breakevens = data.reduce<number[]>((acc, d, i, arr) => {
    if (i === 0) return acc;
    if ((arr[i - 1].pnl < 0 && d.pnl >= 0) || (arr[i - 1].pnl > 0 && d.pnl <= 0)) acc.push(d.price);
    return acc;
  }, []);
  const netDebit = legs.reduce((acc, l) => acc + (l.side === "BUY" ? 1 : -1) * l.premium * l.qty * 100, 0);

  const r = (s: string | number) => (redact ? "••" : String(s));

  return (
    <div className="card-terminal p-2">
      <div className="flex items-center justify-between mb-3">
        <div>
          <h3 className="text-sm font-mono font-bold text-foreground uppercase tracking-wider">Payoff Diagram — {ticker}</h3>
          <p className="text-[10px] font-mono text-muted-foreground mt-0.5">Strategy P&L at expiration · Spot ${spot}</p>
        </div>
        <select
          value={strategy}
          onChange={(e) => setStrategy(e.target.value as StrategyKey)}
          className="bg-surface-elevated border border-border text-foreground text-[10px] font-mono px-2 py-1 focus:outline-none focus:border-accent"
        >
          {Object.entries(STRATEGIES).filter(([k]) => k !== "custom").map(([k, v]) => (
            <option key={k} value={k}>{v.label}</option>
          ))}
        </select>
      </div>

      <div className="h-56">
        <ExpandableResponsiveContainer width="100%" height="100%">
          <LineChart data={data} margin={{ top: 4, right: 8, left: -8, bottom: 0 }}>
            <CartesianGrid stroke="hsl(var(--grid-line))" strokeDasharray="2 2" />
            <XAxis dataKey="price" stroke="hsl(var(--muted-foreground))" tick={{ fontSize: 9, fontFamily: "monospace" }} />
            <YAxis stroke="hsl(var(--muted-foreground))" tick={{ fontSize: 9, fontFamily: "monospace" }} />
            <Tooltip
              contentStyle={{ background: "hsl(var(--card))", border: "1px solid hsl(var(--border))", fontSize: 10, fontFamily: "monospace" }}
              formatter={(v: number) => `$${v.toFixed(2)}`}
              labelFormatter={(l) => `Price: $${l}`}
            />
            <ReferenceLine y={0} stroke="hsl(var(--muted-foreground))" strokeWidth={1} />
            <ReferenceLine x={spot} stroke="hsl(var(--accent))" strokeDasharray="3 3" label={{ value: "Spot", fill: "hsl(var(--accent))", fontSize: 9 }} />
            {breakevens.map((b, i) => (
              <ReferenceLine key={i} x={b} stroke="hsl(40, 100%, 55%)" strokeDasharray="2 4" />
            ))}
            <Line type="monotone" dataKey="pnl" stroke="hsl(var(--accent))" strokeWidth={2} dot={false} />
          </LineChart>
        </ExpandableResponsiveContainer>
      </div>

      <div className="grid grid-cols-2 lg:grid-cols-4 gap-2 mt-3 text-[10px] font-mono">
        <div className="border border-border bg-surface-elevated p-2">
          <div className="text-muted-foreground text-[9px] uppercase">Max Profit</div>
          <div className="text-up tabular-nums font-bold">{r(maxProfit >= 1e6 ? "Unlimited" : `$${maxProfit.toFixed(0)}`)}</div>
        </div>
        <div className="border border-border bg-surface-elevated p-2">
          <div className="text-muted-foreground text-[9px] uppercase">Max Loss</div>
          <div className="text-down tabular-nums font-bold">{r(`$${maxLoss.toFixed(0)}`)}</div>
        </div>
        <div className="border border-border bg-surface-elevated p-2">
          <div className="text-muted-foreground text-[9px] uppercase">Net {netDebit >= 0 ? "Debit" : "Credit"}</div>
          <div className="text-foreground tabular-nums font-bold">{r(`$${Math.abs(netDebit).toFixed(0)}`)}</div>
        </div>
        <div className="border border-border bg-surface-elevated p-2">
          <div className="text-muted-foreground text-[9px] uppercase">Breakevens</div>
          <div className="text-accent tabular-nums font-bold">{redact ? "••" : breakevens.map((b) => b.toFixed(1)).join(" / ") || "—"}</div>
        </div>
      </div>

      <div className="mt-3 border-t border-border pt-2">
        <div className="text-[9px] font-mono text-muted-foreground uppercase mb-1">Legs</div>
        <div className="space-y-0.5">
          {legs.map((l, i) => (
            <div key={i} className="flex justify-between text-[10px] font-mono tabular-nums">
              <span className={l.side === "BUY" ? "text-up" : "text-down"}>{l.side}</span>
              <span className="text-foreground">{l.qty}× {ticker} {l.strike}{l.type}</span>
              <span className="text-muted-foreground">@ ${l.premium.toFixed(2)}</span>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
