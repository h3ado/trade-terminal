// Unusual Options Activity Scanner — live tape with filters + aggregate stats.
import { useEffect, useMemo, useState } from "react";
import { generateUoa, UoaPrint } from "./mockUoa";
import UoaFilters, { defaultFilters } from "./UoaFilters";
import UoaStatsStrip from "./UoaStatsStrip";
import { useSmartTicket } from "../ticket/useSmartTicket";

interface Props { redact?: boolean; }

function fmt$(n: number) {
  if (Math.abs(n) >= 1_000_000) return "$" + (n / 1_000_000).toFixed(2) + "M";
  if (Math.abs(n) >= 1_000) return "$" + (n / 1_000).toFixed(1) + "K";
  return "$" + n.toFixed(0);
}
function fmtTime(ts: number) {
  const d = new Date(ts);
  return `${d.getHours().toString().padStart(2,"0")}:${d.getMinutes().toString().padStart(2,"0")}:${d.getSeconds().toString().padStart(2,"0")}`;
}

export default function UoaScanner({ redact = false }: Props) {
  const [seed, setSeed] = useState(1);
  const [filters, setFilters] = useState(defaultFilters);
  const ticket = useSmartTicket();

  // tick every 4s to simulate live tape
  useEffect(() => {
    const id = setInterval(() => setSeed(s => s + 1), 4000);
    return () => clearInterval(id);
  }, []);

  const all = useMemo(() => generateUoa(seed, 120), [seed]);

  const rows = useMemo(() => all.filter(r => {
    if (filters.side !== "ALL" && r.side !== filters.side) return false;
    if (filters.cp !== "ALL" && r.cp !== filters.cp) return false;
    if (filters.minPremium && r.premium < filters.minPremium) return false;
    if (filters.minSize && r.size < filters.minSize) return false;
    if (filters.sweepOnly && !r.tags.includes("SWEEP")) return false;
    if (filters.repeatOnly && !r.tags.includes("REPEAT")) return false;
    if (filters.ticker && r.ticker !== filters.ticker) return false;
    return true;
  }), [all, filters]);

  return (
    <div className="space-y-2">
      <UoaStatsStrip rows={rows} redact={redact} />
      <div className="card-terminal">
        <UoaFilters state={filters} setState={setFilters} />
        <div className="overflow-x-auto max-h-[60vh] overflow-y-auto">
          <table className="w-full text-[10px] font-mono tabular-nums">
            <thead className="text-muted-foreground border-b border-border sticky top-0 bg-surface-deep z-10">
              <tr>
                {["Time","Sym","Exp","K","C/P","Side","Size","Px","Mid","Prem","IV","OI","ΔOI","Tags",""].map(h => (
                  <th key={h} className="px-1.5 py-1 text-right whitespace-nowrap">{h}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {rows.map(r => (
                <tr key={r.id} className="border-b border-border/30 hover:bg-surface-elevated">
                  <td className="px-1.5 py-0.5 text-right text-muted-foreground">{fmtTime(r.ts)}</td>
                  <td className="px-1.5 py-0.5 text-left text-accent font-bold">{r.ticker}</td>
                  <td className="px-1.5 py-0.5 text-right text-foreground">{r.expiry.slice(5)}</td>
                  <td className="px-1.5 py-0.5 text-right text-foreground">{r.strike}</td>
                  <td className={`px-1.5 py-0.5 text-right font-bold ${r.cp === "C" ? "text-up" : "text-down"}`}>{r.cp}</td>
                  <td className={`px-1.5 py-0.5 text-right font-bold ${r.side === "BUY" ? "text-up" : "text-down"}`}>{r.side}</td>
                  <td className="px-1.5 py-0.5 text-right text-foreground">{r.size.toLocaleString()}</td>
                  <td className="px-1.5 py-0.5 text-right text-foreground">{redact ? "••" : r.fillPx.toFixed(2)}</td>
                  <td className="px-1.5 py-0.5 text-right text-muted-foreground">{redact ? "••" : r.mid.toFixed(2)}</td>
                  <td className={`px-1.5 py-0.5 text-right font-bold ${r.premium > 250000 ? "text-accent" : "text-foreground"}`}>{redact ? "$••" : fmt$(r.premium)}</td>
                  <td className="px-1.5 py-0.5 text-right text-foreground">{r.iv.toFixed(0)}%</td>
                  <td className="px-1.5 py-0.5 text-right text-muted-foreground">{r.oi.toLocaleString()}</td>
                  <td className={`px-1.5 py-0.5 text-right ${r.oiDelta >= 0 ? "text-up" : "text-down"}`}>{r.oiDelta >= 0 ? "+" : ""}{r.oiDelta}</td>
                  <td className="px-1.5 py-0.5 text-right">
                    <div className="flex gap-0.5 justify-end">
                      {r.tags.map(t => (
                        <span key={t} className="px-1 text-[8px] border border-border text-accent">{t}</span>
                      ))}
                    </div>
                  </td>
                  <td className="px-1.5 py-0.5 text-right">
                    <button onClick={() => ticket.open({
                      ticker: r.ticker,
                      legs: [{ action: r.side === "BUY" ? "BUY" : "SELL", qty: 1, type: r.cp === "C" ? "CALL" : "PUT", strike: r.strike, expiry: r.expiry }],
                    })} className="px-1.5 py-0.5 text-[9px] font-mono border border-border hover:border-accent hover:text-accent">TKT</button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
