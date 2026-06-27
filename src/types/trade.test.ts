import { describe, expect, it } from "vitest";
import { calcMaxDrawdownPct, calcPnlForTrade, calcProfitFactor } from "./trade";

describe("trade math", () => {
  it("calculates instrument-aware pnl", () => {
    expect(calcPnlForTrade({ side: "CALL", entry: 2, exit: 3.5, size: 2, type: "Option" })).toBe(300);
    expect(calcPnlForTrade({ side: "SHORT", entry: 100, exit: 95, size: 3, type: "Equity" })).toBe(15);
  });

  it("handles drawdown and zero-loss profit factor", () => {
    const trades = [
      { date: "2026-01-01", pnl: 100 },
      { date: "2026-01-02", pnl: -50 },
      { date: "2026-01-03", pnl: 25 },
    ] as any[];
    expect(calcMaxDrawdownPct(trades, 1000)).toBeCloseTo(-4.545, 2);
    expect(calcProfitFactor([{ pnl: 10 }, { pnl: 5 }] as any[])).toBe(Infinity);
  });
});
