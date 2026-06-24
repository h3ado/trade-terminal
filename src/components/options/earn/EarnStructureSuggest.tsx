// Suggests a structure based on IV/expected-move characteristics.
import { useSmartTicket } from "../ticket/useSmartTicket";

interface Props { ticker: string; ivRank: number; expectedMove: number; histMove: number; spot: number; dte: number; }

export default function EarnStructureSuggest({ ticker, ivRank, expectedMove, histMove, spot, dte }: Props) {
  const ticket = useSmartTicket();
  const overpriced = expectedMove > histMove * 1.15;
  const underpriced = expectedMove < histMove * 0.85;

  const suggestions = overpriced
    ? [
        { name: "Short Iron Fly", rationale: "Implied > historical move; collect rich premium with defined risk.", legs: [
          { action: "SELL" as const, qty: 1, type: "CALL" as const, strike: Math.round(spot), expiry: dateAdd(dte) },
          { action: "SELL" as const, qty: 1, type: "PUT" as const, strike: Math.round(spot), expiry: dateAdd(dte) },
          { action: "BUY" as const, qty: 1, type: "CALL" as const, strike: Math.round(spot * (1 + expectedMove/100 * 1.5)), expiry: dateAdd(dte) },
          { action: "BUY" as const, qty: 1, type: "PUT" as const, strike: Math.round(spot * (1 - expectedMove/100 * 1.5)), expiry: dateAdd(dte) },
        ]},
        { name: "Calendar (sell front, buy back)", rationale: "Capture IV crush in front month while staying long vega.", legs: [
          { action: "SELL" as const, qty: 1, type: "CALL" as const, strike: Math.round(spot), expiry: dateAdd(dte) },
          { action: "BUY" as const, qty: 1, type: "CALL" as const, strike: Math.round(spot), expiry: dateAdd(dte + 30) },
        ]},
      ]
    : underpriced
    ? [
        { name: "Long Straddle", rationale: "Implied < historical move; pay cheap premium for the gap.", legs: [
          { action: "BUY" as const, qty: 1, type: "CALL" as const, strike: Math.round(spot), expiry: dateAdd(dte) },
          { action: "BUY" as const, qty: 1, type: "PUT" as const, strike: Math.round(spot), expiry: dateAdd(dte) },
        ]},
      ]
    : [
        { name: "Long Strangle (wing)", rationale: "Neutral pricing; lean directional with cheap wings.", legs: [
          { action: "BUY" as const, qty: 1, type: "CALL" as const, strike: Math.round(spot * 1.04), expiry: dateAdd(dte) },
          { action: "BUY" as const, qty: 1, type: "PUT" as const, strike: Math.round(spot * 0.96), expiry: dateAdd(dte) },
        ]},
      ];

  return (
    <div className="card-terminal p-2">
      <div className="flex items-baseline gap-2 mb-2">
        <span className="text-[10px] font-mono font-bold text-accent">SUGGESTED STRUCTURES</span>
        <span className="text-[9px] font-mono text-muted-foreground">IVR {ivRank} · IM {expectedMove}% vs HM {histMove}%</span>
      </div>
      <div className="space-y-2">
        {suggestions.map(s => (
          <div key={s.name} className="border border-border bg-surface-deep px-3 py-2 flex items-center justify-between">
            <div>
              <div className="text-[11px] font-mono font-bold text-foreground">{s.name}</div>
              <div className="text-[9px] font-mono text-muted-foreground">{s.rationale}</div>
            </div>
            <button onClick={() => ticket.open({ ticker, legs: s.legs })}
              className="px-3 py-1 text-[10px] font-mono border border-border hover:border-accent hover:text-accent">OPEN TKT</button>
          </div>
        ))}
      </div>
    </div>
  );
}

function dateAdd(days: number) {
  const d = new Date(Date.now() + days * 86400000);
  return `${d.getUTCFullYear()}-${(d.getUTCMonth()+1).toString().padStart(2,"0")}-${d.getUTCDate().toString().padStart(2,"0")}`;
}
