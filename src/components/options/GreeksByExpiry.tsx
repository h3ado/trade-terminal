// GRK sub-panel: portfolio Greeks broken down by expiry bucket.
const rows = [
  { exp: "0DTE",  delta: 18,  gamma: 2.1,  vega: 12,  theta: -34 },
  { exp: "1W",    delta: 42,  gamma: 1.6,  vega: 48,  theta: -22 },
  { exp: "2W",    delta: 36,  gamma: 1.2,  vega: 64,  theta: -14 },
  { exp: "1M",    delta: 24,  gamma: 0.8,  vega: 86,  theta:  -9 },
  { exp: "3M",    delta: 14,  gamma: 0.4,  vega: 64,  theta:  -8 },
  { exp: "6M+",   delta:  8,  gamma: 0.3,  vega: 38,  theta:  -7 },
];

export default function GreeksByExpiry({ redact = false }: { redact?: boolean }) {
  return (
    <div className="card-terminal p-2">
      <h3 className="text-sm font-mono font-bold text-foreground uppercase tracking-wider mb-2">Greeks by Expiry</h3>
      {redact ? (
        <div className="h-[220px] flex items-center justify-center text-muted-foreground font-mono text-xs">•• REDACTED ••</div>
      ) : (
        <table className="w-full text-[10px] font-mono">
          <thead className="text-muted-foreground border-b border-border">
            <tr>
              <th className="text-left py-1">Bucket</th>
              <th className="text-right">Δ</th>
              <th className="text-right">Γ</th>
              <th className="text-right">Vega</th>
              <th className="text-right">Theta</th>
            </tr>
          </thead>
          <tbody>
            {rows.map((r) => (
              <tr key={r.exp} className="border-b border-border/40">
                <td className="py-1 text-foreground">{r.exp}</td>
                <td className="text-right text-foreground">{r.delta}</td>
                <td className="text-right text-foreground">{r.gamma.toFixed(2)}</td>
                <td className="text-right text-foreground">{r.vega}</td>
                <td className="text-right text-rose-400">{r.theta}</td>
              </tr>
            ))}
            <tr className="border-t border-border bg-surface-elevated">
              <td className="py-1 text-accent font-bold">TOTAL</td>
              <td className="text-right text-foreground font-bold">{rows.reduce((s, r) => s + r.delta, 0)}</td>
              <td className="text-right text-foreground font-bold">{rows.reduce((s, r) => s + r.gamma, 0).toFixed(2)}</td>
              <td className="text-right text-foreground font-bold">{rows.reduce((s, r) => s + r.vega, 0)}</td>
              <td className="text-right text-rose-400 font-bold">{rows.reduce((s, r) => s + r.theta, 0)}</td>
            </tr>
          </tbody>
        </table>
      )}
    </div>
  );
}
