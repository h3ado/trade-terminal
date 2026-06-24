// OVME sub-panel: 25-delta risk reversal & butterfly per tenor.
const ROWS = [
  { tenor: "1W",  rr: -2.4, bf: 1.1, atm: 14.5 },
  { tenor: "2W",  rr: -2.1, bf: 1.3, atm: 15.6 },
  { tenor: "1M",  rr: -1.8, bf: 1.5, atm: 16.8 },
  { tenor: "2M",  rr: -1.4, bf: 1.7, atm: 17.9 },
  { tenor: "3M",  rr: -1.1, bf: 1.9, atm: 18.6 },
  { tenor: "6M",  rr: -0.6, bf: 2.2, atm: 19.4 },
];

interface Props { ticker?: string; redact?: boolean }

export default function SkewDelta({ ticker = "SPY", redact = false }: Props) {
  return (
    <div className="card-terminal p-2">
      <div className="flex items-center justify-between mb-2">
        <h3 className="text-sm font-mono font-bold text-foreground uppercase tracking-wider">{ticker} · 25Δ Skew</h3>
        <div className="text-[9px] font-mono text-muted-foreground">Risk Reversal · Butterfly · ATM</div>
      </div>
      {redact ? (
        <div className="h-[220px] flex items-center justify-center text-muted-foreground font-mono text-xs">•• REDACTED ••</div>
      ) : (
        <table className="w-full text-[10px] font-mono">
          <thead className="text-muted-foreground border-b border-border">
            <tr>
              <th className="text-left py-1">Tenor</th>
              <th className="text-right">25Δ RR</th>
              <th className="text-right">25Δ BF</th>
              <th className="text-right">ATM IV</th>
              <th className="text-right">Put Skew</th>
              <th className="text-right">Call Skew</th>
            </tr>
          </thead>
          <tbody>
            {ROWS.map((r) => (
              <tr key={r.tenor} className="border-b border-border/40">
                <td className="py-1 text-foreground">{r.tenor}</td>
                <td className={`text-right ${r.rr < 0 ? "text-rose-400" : "text-emerald-400"}`}>{r.rr.toFixed(2)}</td>
                <td className="text-right text-foreground">{r.bf.toFixed(2)}</td>
                <td className="text-right text-foreground">{r.atm.toFixed(1)}%</td>
                <td className="text-right text-rose-300">{(r.atm + Math.abs(r.rr) / 2).toFixed(1)}%</td>
                <td className="text-right text-emerald-300">{(r.atm - Math.abs(r.rr) / 2).toFixed(1)}%</td>
              </tr>
            ))}
          </tbody>
        </table>
      )}
    </div>
  );
}
