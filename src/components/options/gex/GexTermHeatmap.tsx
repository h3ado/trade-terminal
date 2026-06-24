// Strike × Expiry signed-GEX heatmap (div grid for crisp pixels).
import { GexCell, GEX_EXPIRIES, GexExpiryKey, fmtUsd } from "../shared/mockSeries";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";

interface Props {
  ticker: string;
  cells: GexCell[];
  strikes: number[];
  expiries: GexExpiryKey[];
  spot: number;
  onSelectStrike?: (strike: number) => void;
  redact?: boolean;
}

export default function GexTermHeatmap({ ticker, cells, strikes, expiries, spot, onSelectStrike, redact }: Props) {
  const max = cells.reduce((m, c) => Math.max(m, Math.abs(c.gex)), 1);
  const cellMap = new Map<string, GexCell>();
  for (const c of cells) cellMap.set(`${c.strike}|${c.expiry}`, c);
  const visibleExpiries = GEX_EXPIRIES.filter((e) => expiries.includes(e));

  return (
    <div className="card-terminal p-2">
      <div className="flex items-center justify-between mb-2">
        <div>
          <h3 className="text-sm font-mono font-bold text-foreground uppercase tracking-wider">Term-Structure Heatmap — {ticker}</h3>
          <p className="text-[10px] font-mono text-muted-foreground mt-0.5">Strike × Expiry signed $GEX · click row to drill down</p>
        </div>
        <div className="flex items-center gap-2 text-[9px] font-mono text-muted-foreground">
          <div className="flex items-center gap-1"><div className="w-3 h-2.5" style={{ background: "hsl(var(--positive))" }} /> + GEX</div>
          <div className="flex items-center gap-1"><div className="w-3 h-2.5" style={{ background: "hsl(var(--negative))" }} /> − GEX</div>
        </div>
      </div>

      {redact ? (
        <div className="h-[300px] flex items-center justify-center text-muted-foreground font-mono text-xs">•• REDACTED ••</div>
      ) : (
        <div className="overflow-auto">
          <TooltipProvider delayDuration={80}>
            <table className="w-full border-collapse text-[9px] font-mono">
              <thead>
                <tr className="text-muted-foreground">
                  <th className="text-right pr-2 py-1 sticky left-0 bg-card">STRIKE</th>
                  {visibleExpiries.map((e) => (
                    <th key={e} className="px-1 py-1 text-center font-bold">{e}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {[...strikes].reverse().map((k) => {
                  const isSpotRow = Math.abs(k - spot) < 1;
                  return (
                    <tr key={k} className={`border-t border-border hover:bg-surface-elevated cursor-pointer ${isSpotRow ? "bg-surface-elevated/40" : ""}`} onClick={() => onSelectStrike?.(k)}>
                      <td className={`text-right pr-2 py-0.5 tabular-nums sticky left-0 bg-card ${isSpotRow ? "text-accent font-bold" : "text-foreground"}`}>
                        {isSpotRow ? "→ " : ""}{k}
                      </td>
                      {visibleExpiries.map((e) => {
                        const c = cellMap.get(`${k}|${e}`);
                        if (!c) return <td key={e} />;
                        const intensity = Math.min(1, Math.abs(c.gex) / max);
                        const bg = c.gex >= 0 ? `hsl(var(--positive) / ${0.15 + intensity * 0.7})` : `hsl(var(--negative) / ${0.15 + intensity * 0.7})`;
                        return (
                          <Tooltip key={e}>
                            <TooltipTrigger asChild>
                              <td className="text-center px-1 py-0.5 border-l border-border" style={{ background: bg }}>
                                <span className="tabular-nums text-[9px] text-foreground/90">{fmtUsd(c.gex)}</span>
                              </td>
                            </TooltipTrigger>
                            <TooltipContent side="top" className="font-mono text-[10px] bg-surface-deep border-border">
                              <div className="font-bold text-accent">{k} · {e}</div>
                              <div>$GEX <span className={c.gex >= 0 ? "text-up" : "text-down"}>{fmtUsd(c.gex)}</span></div>
                              <div>OI {c.oi.toLocaleString()} · Vol {c.vol.toLocaleString()}</div>
                              <div>|Δ|-hedge {Math.abs(c.hedge).toLocaleString()} sh / 1%</div>
                            </TooltipContent>
                          </Tooltip>
                        );
                      })}
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </TooltipProvider>
        </div>
      )}
    </div>
  );
}
