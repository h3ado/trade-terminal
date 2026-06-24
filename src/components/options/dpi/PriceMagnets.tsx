// Price magnets — top strikes by gravitational score.
import { useMemo } from "react";
import { seeded, fmtUsd, fmtPct } from "../shared/mockSeries";

export interface Magnet {
  strike: number;
  side: "C" | "P";
  gex: number;
  oi: number;
  distPct: number;
  dominantExpiry: string;
  score: number;
  contributors: { expiry: string; oi: number; gex: number; hedge: number }[];
}

interface Props { ticker: string; spot: number; onSelect: (m: Magnet) => void; redact?: boolean }

export default function PriceMagnets({ ticker, spot, onSelect, redact }: Props) {
  const magnets = useMemo<Magnet[]>(() => {
    const r = seeded(ticker, "magnets");
    const out: Magnet[] = [];
    for (let i = 0; i < 8; i++) {
      const strike = Math.round(spot + (r() - 0.5) * 30);
      const oi = Math.floor(8000 + r() * 90000);
      const gex = (r() - 0.4) * 1_800_000_000;
      const dist = ((strike - spot) / spot) * 100;
      const expiries = ["0DTE", "1DTE", "3DTE", "Weekly", "Monthly"];
      out.push({
        strike,
        side: gex >= 0 ? "C" : "P",
        gex,
        oi,
        distPct: dist,
        dominantExpiry: expiries[Math.floor(r() * expiries.length)],
        score: +(Math.abs(gex) / 1e8 * (1 / (1 + Math.abs(dist)))).toFixed(1),
        contributors: Array.from({ length: 4 }).map(() => ({
          expiry: expiries[Math.floor(r() * expiries.length)],
          oi: Math.floor(r() * 30000),
          gex: (r() - 0.5) * 4e8,
          hedge: Math.floor((r() - 0.5) * 50000),
        })),
      });
    }
    return out.sort((a, b) => b.score - a.score);
  }, [ticker, spot]);

  return (
    <div className="border border-border bg-surface-deep p-3">
      <div className="flex items-center justify-between mb-2">
        <div className="text-[10px] font-mono font-bold text-accent uppercase tracking-wider">Price Magnets</div>
        <div className="text-[9px] font-mono text-muted-foreground">Top 8 by gravitational score</div>
      </div>
      <table className="w-full text-[10px] font-mono">
        <thead className="bg-surface-elevated">
          <tr className="text-muted-foreground">
            <th className="px-2 py-1 text-left">Strike</th>
            <th className="px-2 py-1 text-left">Side</th>
            <th className="px-2 py-1 text-right">Dist</th>
            <th className="px-2 py-1 text-right">$GEX</th>
            <th className="px-2 py-1 text-right">OI</th>
            <th className="px-2 py-1 text-left">Expiry</th>
            <th className="px-2 py-1 text-right">Score</th>
          </tr>
        </thead>
        <tbody>
          {magnets.map((m, i) => (
            <tr key={i} onClick={() => onSelect(m)}
              className="border-t border-border hover:bg-surface-elevated cursor-pointer">
              <td className="px-2 py-1 tabular-nums font-bold">{m.strike}</td>
              <td className={`px-2 py-1 ${m.side === "C" ? "text-up" : "text-down"}`}>{m.side}</td>
              <td className={`px-2 py-1 text-right tabular-nums ${m.distPct >= 0 ? "text-up" : "text-down"}`}>
                {redact ? "••" : fmtPct(m.distPct, 2)}
              </td>
              <td className={`px-2 py-1 text-right tabular-nums ${m.gex >= 0 ? "text-up" : "text-down"}`}>
                {redact ? "••" : fmtUsd(m.gex)}
              </td>
              <td className="px-2 py-1 text-right tabular-nums">{redact ? "••" : m.oi.toLocaleString()}</td>
              <td className="px-2 py-1 text-muted-foreground">{m.dominantExpiry}</td>
              <td className="px-2 py-1 text-right tabular-nums text-accent font-bold">{redact ? "••" : m.score.toFixed(1)}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
