// GEX sub-panel: charm/vanna exposure heatmap (strike × tenor).
const STRIKES = [560, 570, 575, 580, 582, 585, 590, 595, 600];
const TENORS  = ["1D", "3D", "1W", "2W", "1M"];

interface Props { ticker?: string; redact?: boolean; metric?: "charm" | "vanna" }

function val(s: number, t: number, spot: number, kind: "charm" | "vanna") {
  // Synthetic but smooth surface so users can read the shape.
  const moneyness = (s - spot) / spot;
  const base = kind === "charm" ? -Math.sin(moneyness * 18) : Math.cos(moneyness * 14);
  const decay = 1 / Math.sqrt(t + 0.5);
  return Math.round(base * decay * 100);
}

export default function CharmVannaHeatmap({ ticker = "SPY", redact = false, metric = "charm" }: Props) {
  const spot = 582;
  const cells = STRIKES.map((s, si) =>
    TENORS.map((_, ti) => val(s, ti + 1, spot, metric))
  );
  const max = Math.max(...cells.flat().map(Math.abs)) || 1;

  return (
    <div className="card-terminal p-2">
      <div className="flex items-center justify-between mb-2">
        <h3 className="text-sm font-mono font-bold text-foreground uppercase tracking-wider">
          {ticker} · {metric === "charm" ? "Charm (dΔ/dt)" : "Vanna (dΔ/dσ)"}
        </h3>
        <div className="text-[9px] font-mono text-muted-foreground">Spot {spot}</div>
      </div>
      {redact ? (
        <div className="h-[240px] flex items-center justify-center text-muted-foreground font-mono text-xs">•• REDACTED ••</div>
      ) : (
        <div className="overflow-x-auto">
          <table className="w-full text-[10px] font-mono">
            <thead>
              <tr className="text-muted-foreground">
                <th className="text-left py-1">Strike</th>
                {TENORS.map((t) => <th key={t} className="text-right px-2">{t}</th>)}
              </tr>
            </thead>
            <tbody>
              {STRIKES.map((s, si) => (
                <tr key={s} className={s === spot ? "bg-accent/10" : ""}>
                  <td className="py-1 text-foreground">{s}</td>
                  {cells[si].map((v, ti) => {
                    const intensity = Math.abs(v) / max;
                    const bg = v >= 0
                      ? `hsl(var(--accent) / ${(intensity * 0.6).toFixed(2)})`
                      : `hsl(0 70% 50% / ${(intensity * 0.6).toFixed(2)})`;
                    return (
                      <td key={ti} className="text-right px-2 py-1 text-foreground"
                        style={{ background: bg }}>
                        {v > 0 ? `+${v}` : v}
                      </td>
                    );
                  })}
                </tr>
              ))}
            </tbody>
          </table>
          <div className="mt-2 flex items-center gap-3 text-[9px] font-mono text-muted-foreground">
            <span className="inline-block w-3 h-3" style={{ background: "hsl(var(--accent) / 0.6)" }} /> positive
            <span className="inline-block w-3 h-3" style={{ background: "hsl(0 70% 50% / 0.6)" }} /> negative
          </div>
        </div>
      )}
    </div>
  );
}
