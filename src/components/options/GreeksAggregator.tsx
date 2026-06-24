// Greeks Aggregator — portfolio-level Greeks rollup with positions table.
const positions = [
  { ticker: "SPY",  qty:  10, type: "C", strike: 595, exp: "5DTE",  delta: 0.52, gamma: 0.08, theta: -1.24, vega: 0.42, value:  5840 },
  { ticker: "SPY",  qty: -10, type: "C", strike: 605, exp: "5DTE",  delta: -0.31, gamma: -0.05, theta: 0.78, vega: -0.28, value: -2120 },
  { ticker: "QQQ",  qty:   5, type: "P", strike: 510, exp: "14DTE", delta: -0.34, gamma: 0.04, theta: -0.62, vega: 0.31, value:  1850 },
  { ticker: "NVDA", qty:   3, type: "C", strike: 140, exp: "30DTE", delta: 0.61, gamma: 0.03, theta: -0.84, vega: 0.55, value:  4280 },
  { ticker: "TSLA", qty:  -2, type: "P", strike: 250, exp: "1DTE",  delta: 0.18, gamma: -0.06, theta: 1.42, vega: -0.22, value:  -680 },
];

interface Props { ticker?: string; redact?: boolean }

export default function GreeksAggregator({ redact = false }: Props) {
  const totals = positions.reduce(
    (acc, p) => {
      const m = p.qty * 100;
      acc.delta += p.delta * m;
      acc.gamma += p.gamma * m;
      acc.theta += p.theta * Math.abs(m);
      acc.vega += p.vega * Math.abs(m);
      acc.value += p.value;
      return acc;
    },
    { delta: 0, gamma: 0, theta: 0, vega: 0, value: 0 }
  );
  const r = (s: string | number) => (redact ? "••" : String(s));

  return (
    <div className="card-terminal p-2">
      <div className="flex items-center justify-between mb-3">
        <div>
          <h3 className="text-sm font-mono font-bold text-foreground uppercase tracking-wider">Portfolio Greeks</h3>
          <p className="text-[10px] font-mono text-muted-foreground mt-0.5">Aggregated exposure across open positions</p>
        </div>
      </div>

      <div className="grid grid-cols-2 lg:grid-cols-5 gap-2 mb-3">
        {[
          { l: "Net Δ",     v: totals.delta,  fmt: (n: number) => n.toFixed(0),  c: totals.delta >= 0 ? "text-up" : "text-down", sub: "$ / 1pt" },
          { l: "Net Γ",     v: totals.gamma,  fmt: (n: number) => n.toFixed(1),  c: totals.gamma >= 0 ? "text-up" : "text-down", sub: "Δ / 1pt" },
          { l: "Net Θ",     v: totals.theta,  fmt: (n: number) => n.toFixed(0),  c: totals.theta >= 0 ? "text-up" : "text-down", sub: "$ / day" },
          { l: "Net Vega",  v: totals.vega,   fmt: (n: number) => n.toFixed(0),  c: totals.vega >= 0 ? "text-up" : "text-down",  sub: "$ / 1 IV" },
          { l: "Mkt Value", v: totals.value,  fmt: (n: number) => `$${n.toLocaleString()}`, c: totals.value >= 0 ? "text-up" : "text-down", sub: "Net" },
        ].map((m) => (
          <div key={m.l} className="border border-border bg-surface-elevated p-2">
            <div className="text-[9px] font-mono text-muted-foreground uppercase">{m.l}</div>
            <div className={`text-sm font-mono font-bold tabular-nums ${m.c}`}>{redact ? "••" : m.fmt(m.v)}</div>
            <div className="text-[9px] font-mono text-muted-foreground">{m.sub}</div>
          </div>
        ))}
      </div>

      {/* 2nd-order rollup */}
      <div className="grid grid-cols-3 md:grid-cols-6 gap-1.5 mb-4">
        {[
          { l: "Net Vanna",  v: totals.delta * 0.0008, sub: "Δ / 1% IV" },
          { l: "Net Vomma",  v: totals.vega * 0.012,   sub: "ν / 1% IV" },
          { l: "Net Charm",  v: totals.delta * 0.0021, sub: "Δ / day" },
          { l: "Net Speed",  v: totals.gamma * 0.004,  sub: "Γ / 1pt" },
          { l: "Net Zomma",  v: totals.gamma * 0.011,  sub: "Γ / 1% IV" },
          { l: "$Δ per 1%",  v: totals.delta * 5.95,   sub: "1% spot" },
        ].map((m) => (
          <div key={m.l} className="border border-border/60 bg-surface-elevated/60 px-2 py-1">
            <div className="text-[8px] font-mono text-muted-foreground uppercase tracking-wider">{m.l}</div>
            <div className={`text-[11px] font-mono font-bold tabular-nums ${m.v >= 0 ? "text-up" : "text-down"}`}>{redact ? "••" : m.v.toFixed(2)}</div>
            <div className="text-[8px] font-mono text-muted-foreground">{m.sub}</div>
          </div>
        ))}
      </div>

      <div className="overflow-x-auto">
        <table className="w-full text-[10px] font-mono tabular-nums">
          <thead>
            <tr className="text-muted-foreground border-b border-border">
              <th className="text-left py-1.5 px-2">Tkr</th>
              <th className="text-right py-1.5 px-2">Qty</th>
              <th className="text-left py-1.5 px-2">Contract</th>
              <th className="text-right py-1.5 px-2">Δ</th>
              <th className="text-right py-1.5 px-2">Γ</th>
              <th className="text-right py-1.5 px-2">Θ</th>
              <th className="text-right py-1.5 px-2">Vega</th>
              <th className="text-right py-1.5 px-2">Mkt Val</th>
            </tr>
          </thead>
          <tbody>
            {positions.map((p, i) => (
              <tr key={i} className="border-b border-grid-line hover:bg-surface-elevated">
                <td className="py-1.5 px-2 font-bold text-accent">{p.ticker}</td>
                <td className={`text-right py-1.5 px-2 ${p.qty >= 0 ? "text-up" : "text-down"}`}>{p.qty >= 0 ? "+" : ""}{p.qty}</td>
                <td className="py-1.5 px-2 text-foreground">{p.strike}{p.type} · {p.exp}</td>
                <td className={`text-right py-1.5 px-2 ${p.delta >= 0 ? "text-up" : "text-down"}`}>{r(p.delta.toFixed(2))}</td>
                <td className="text-right py-1.5 px-2 text-foreground">{r(p.gamma.toFixed(2))}</td>
                <td className={`text-right py-1.5 px-2 ${p.theta >= 0 ? "text-up" : "text-down"}`}>{r(p.theta.toFixed(2))}</td>
                <td className="text-right py-1.5 px-2 text-foreground">{r(p.vega.toFixed(2))}</td>
                <td className={`text-right py-1.5 px-2 font-bold ${p.value >= 0 ? "text-up" : "text-down"}`}>{r(`$${p.value.toLocaleString()}`)}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
