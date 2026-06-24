// PAY sub-panel: P&L heatmap across spot × days-to-expiry.
const SPOTS = [560, 570, 575, 580, 582, 585, 590, 595, 600];
const DAYS  = [0, 3, 7, 14, 21, 30];

interface Props { ticker?: string; redact?: boolean }

function cellPnl(s: number, d: number, atSpot: number, longCall: { strike: number; prem: number }) {
  // Synthetic theta decay on a long call near 582 strike.
  const intrinsic = Math.max(0, s - longCall.strike);
  const tValue = Math.max(0, (longCall.prem - intrinsic) * (d / 30));
  return Math.round((intrinsic + tValue - longCall.prem) * 100);
}

export default function PayoffHeatmap({ ticker = "SPY", redact = false }: Props) {
  const leg = { strike: 582, prem: 3.5 };
  const grid = DAYS.map((d) => SPOTS.map((s) => cellPnl(s, d, 582, leg)));
  const max = Math.max(...grid.flat().map(Math.abs)) || 1;

  return (
    <div className="card-terminal p-2">
      <div className="flex items-center justify-between mb-2">
        <h3 className="text-sm font-mono font-bold text-foreground uppercase tracking-wider">{ticker} · P&L Heatmap</h3>
        <div className="text-[9px] font-mono text-muted-foreground">Long 582C · prem 3.50</div>
      </div>
      {redact ? (
        <div className="h-[240px] flex items-center justify-center text-muted-foreground font-mono text-xs">•• REDACTED ••</div>
      ) : (
        <table className="w-full text-[10px] font-mono">
          <thead>
            <tr className="text-muted-foreground">
              <th className="text-left py-1">DTE \ Spot</th>
              {SPOTS.map((s) => <th key={s} className="text-right px-2">{s}</th>)}
            </tr>
          </thead>
          <tbody>
            {DAYS.map((d, di) => (
              <tr key={d}>
                <td className="py-1 text-foreground">{d}d</td>
                {grid[di].map((v, si) => {
                  const intensity = Math.abs(v) / max;
                  const bg = v >= 0
                    ? `hsl(142 70% 45% / ${(intensity * 0.55).toFixed(2)})`
                    : `hsl(0 70% 50% / ${(intensity * 0.55).toFixed(2)})`;
                  return (
                    <td key={si} className="text-right px-2 py-1 text-foreground" style={{ background: bg }}>
                      {v > 0 ? `+${v}` : v}
                    </td>
                  );
                })}
              </tr>
            ))}
          </tbody>
        </table>
      )}
    </div>
  );
}
