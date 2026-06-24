// OVME Matrix — IV heatmap across expiries × strikes with cool→hot coloring.
import { OvmeDeal } from "./OvmeWorkspace";

const EXPIRIES = [
  { label: "0DTE", days: 1 },
  { label: "1D",   days: 1 },
  { label: "5D",   days: 5 },
  { label: "2W",   days: 14 },
  { label: "1M",   days: 30 },
  { label: "2M",   days: 60 },
  { label: "3M",   days: 90 },
  { label: "6M",   days: 180 },
];

function strikes(atm: number) {
  const step = 5;
  return Array.from({ length: 15 }, (_, i) => atm - 35 + i * step);
}

// Simple skew/smile model: IV = ATMIV + skew * |moneyness| + termAdj
function ivFor(strike: number, spot: number, days: number, atmBaseVol: number) {
  const moneyness = (strike - spot) / spot;
  const termAdj = -2 - Math.log(days + 1) * 0.7;
  const smile = Math.abs(moneyness) * 100 * 1.8;
  const putSkew = moneyness < 0 ? -moneyness * 100 * 0.6 : 0;
  return atmBaseVol + termAdj + smile + putSkew;
}

function colorFor(iv: number, lo: number, hi: number) {
  const t = Math.max(0, Math.min(1, (iv - lo) / (hi - lo)));
  // green (low) → orange (mid) → red (high)
  if (t < 0.5) {
    const tt = t * 2;
    return `hsl(${130 - tt * 90}, 70%, ${10 + tt * 5}%)`;
  } else {
    const tt = (t - 0.5) * 2;
    return `hsl(${40 - tt * 40}, 80%, ${15 - tt * 5}%)`;
  }
}

function textColorFor(iv: number, lo: number, hi: number) {
  const t = Math.max(0, Math.min(1, (iv - lo) / (hi - lo)));
  if (t < 0.33) return "hsl(var(--positive))";
  if (t < 0.66) return "hsl(var(--accent))";
  return "hsl(var(--negative))";
}

interface Props { deal: OvmeDeal; redact?: boolean }

export default function OvmeMatrix({ deal, redact = false }: Props) {
  const ks = strikes(deal.strike);
  const grid = EXPIRIES.map((e) => ({
    ...e,
    cells: ks.map((K) => ({ K, iv: ivFor(K, deal.spot, e.days, deal.vol + 4) })),
  }));
  const allIvs = grid.flatMap((g) => g.cells.map((c) => c.iv));
  const lo = Math.min(...allIvs);
  const hi = Math.max(...allIvs);

  return (
    <div className="card-terminal p-2">
      <div className="flex items-center justify-between mb-3">
        <h3 className="text-xs font-mono font-bold text-accent uppercase tracking-wider">IV Matrix — {deal.ticker}</h3>
        <div className="flex items-center gap-3 text-[9px] font-mono text-muted-foreground">
          <span className="flex items-center gap-1"><span className="inline-block w-2 h-2 rounded-full bg-positive" /> Low</span>
          <span className="flex items-center gap-1"><span className="inline-block w-2 h-2 rounded-full bg-accent" /> Mid</span>
          <span className="flex items-center gap-1"><span className="inline-block w-2 h-2 rounded-full bg-negative" /> High</span>
        </div>
      </div>
      <div className="overflow-x-auto">
        <table className="w-full text-[10px] font-mono tabular-nums border-separate border-spacing-0">
          <thead>
            <tr>
              <th className="text-left py-1.5 px-2 text-accent border-b border-border">EXPIRY</th>
              {ks.map((K) => (
                <th key={K} className={`text-right py-1.5 px-2 border-b border-border ${K === deal.strike ? "text-accent font-bold border-l border-r border-l-accent border-r-accent" : "text-accent"}`}>{K}</th>
              ))}
            </tr>
          </thead>
          <tbody>
            {grid.map((row) => (
              <tr key={row.label}>
                <td className="text-left py-1.5 px-2 text-accent font-bold">{row.label}</td>
                {row.cells.map((c) => {
                  const isAtm = c.K === deal.strike;
                  return (
                    <td
                      key={c.K}
                      title={`${row.label} · K=${c.K} · IV=${c.iv.toFixed(1)}%`}
                      className={`text-right py-1.5 px-2 ${isAtm ? "font-bold border-l border-r border-l-accent border-r-accent" : ""}`}
                      style={{ background: colorFor(c.iv, lo, hi), color: textColorFor(c.iv, lo, hi) }}
                    >
                      {redact ? "••" : c.iv.toFixed(1)}
                    </td>
                  );
                })}
              </tr>
            ))}
          </tbody>
        </table>
      </div>
      <div className="text-[9px] font-mono text-muted-foreground mt-2">Hover cell for details</div>
    </div>
  );
}
