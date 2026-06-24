// QSCR sub-panel: per-factor breakdown bars for the current ticker's Q-Score.
interface Props { ticker?: string; redact?: boolean }

const factors = [
  { key: "Liquidity", v: 84 },
  { key: "Edge",      v: 71 },
  { key: "IV Rank",   v: 62 },
  { key: "Trend",     v: 58 },
  { key: "Risk",      v: 46 },
  { key: "Catalyst",  v: 77 },
];

const leaderboard = [
  { sym: "SPY",  score: 88 },
  { sym: "QQQ",  score: 84 },
  { sym: "TSLA", score: 79 },
  { sym: "NVDA", score: 76 },
  { sym: "AMD",  score: 71 },
  { sym: "META", score: 68 },
];

export default function QFactorBars({ ticker = "SPY", redact = false }: Props) {
  return (
    <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
      <div className="card-terminal p-2">
        <h3 className="text-sm font-mono font-bold text-foreground uppercase tracking-wider mb-3">{ticker} · Q-Score Factors</h3>
        {redact ? (
          <div className="h-[200px] flex items-center justify-center text-muted-foreground font-mono text-xs">•• REDACTED ••</div>
        ) : (
          <div className="space-y-2">
            {factors.map((f) => (
              <div key={f.key} className="flex items-center gap-2 text-[10px] font-mono">
                <span className="w-20 text-muted-foreground uppercase tracking-wider">{f.key}</span>
                <div className="flex-1 bg-surface-elevated h-2 relative">
                  <div className="absolute inset-y-0 left-0 bg-accent" style={{ width: `${f.v}%` }} />
                </div>
                <span className="w-8 text-right text-foreground">{f.v}</span>
              </div>
            ))}
          </div>
        )}
      </div>

      <div className="card-terminal p-2">
        <h3 className="text-sm font-mono font-bold text-foreground uppercase tracking-wider mb-3">Leaderboard</h3>
        <table className="w-full text-[10px] font-mono">
          <thead className="text-muted-foreground border-b border-border">
            <tr><th className="text-left py-1">Rank</th><th className="text-left">Symbol</th><th className="text-right">Score</th></tr>
          </thead>
          <tbody>
            {leaderboard.map((r, i) => (
              <tr key={r.sym} className={`border-b border-border/40 ${r.sym === ticker ? "bg-accent/10" : ""}`}>
                <td className="py-1 text-muted-foreground">#{i + 1}</td>
                <td className="text-accent font-bold">{r.sym}</td>
                <td className="text-right text-foreground">{redact ? "••" : r.score}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
