// Deterministic mock backtest engine for option strategy templates.
// Seeded by ticker + JSON(legs). Simulates 252 events across regimes.

export interface Leg {
  id: string;
  side: "LONG" | "SHORT";
  type: "CALL" | "PUT";
  strikeOffset: number; // dollars offset from spot
  expiryDays: number;
  qty: number;
}

export interface BacktestEvent {
  date: string;
  category: "earnings" | "fomc" | "cpi" | "regular";
  ivRank: number;       // 0..100
  termSlope: number;    // - = backwardation
  skew: number;         // 25Δ RR
  pnl: number;          // strategy P&L
  daysHeld: number;
}

export interface BacktestStats {
  trades: number;
  winRate: number;
  avgPnl: number;
  totalPnl: number;
  maxDD: number;
  sharpe: number;
  profitFactor: number;
  avgDaysHeld: number;
  equityCurve: number[];
  histogram: { bucket: string; count: number }[];
  events: BacktestEvent[];
}

function hash(s: string): number {
  let h = 2166136261;
  for (let i = 0; i < s.length; i++) { h ^= s.charCodeAt(i); h = Math.imul(h, 16777619); }
  return h >>> 0;
}
function rng(seed: number) {
  let a = seed;
  return () => { a |= 0; a = (a + 0x6D2B79F5) | 0; let t = a; t = Math.imul(t ^ (t >>> 15), t | 1); t ^= t + Math.imul(t ^ (t >>> 7), t | 61); return ((t ^ (t >>> 14)) >>> 0) / 4294967296; };
}

export interface BacktestFilter { ivBucket?: "low" | "mid" | "high" | "all"; term?: "contango" | "backwardation" | "all"; skew?: "steep" | "flat" | "all" }

export function runBacktest(ticker: string, legs: Leg[], filter: BacktestFilter = {}): BacktestStats {
  const seed = hash(ticker + JSON.stringify(legs));
  const r = rng(seed);

  const netDir = legs.reduce((s, l) => s + (l.side === "LONG" ? 1 : -1) * (l.type === "CALL" ? 1 : -1) * l.qty, 0);
  const netVega = legs.reduce((s, l) => s + (l.side === "LONG" ? 1 : -1) * l.qty, 0);
  const baseEdge = 4 + netDir * 1.5 + Math.abs(netVega) * 2;

  const events: BacktestEvent[] = [];
  let cum = 0;
  const equity: number[] = [0];

  for (let i = 0; i < 252; i++) {
    const cat = (() => {
      const x = r();
      if (x < 0.05) return "earnings" as const;
      if (x < 0.10) return "fomc" as const;
      if (x < 0.16) return "cpi" as const;
      return "regular" as const;
    })();
    const ivRank = Math.round(r() * 100);
    const term = +((r() - 0.5) * 4).toFixed(2);
    const skew = +((r() - 0.5) * 6).toFixed(2);

    // Filter (we still simulate, but skip non-matching for stats)
    const ivBucket = ivRank < 33 ? "low" : ivRank < 66 ? "mid" : "high";
    const termSide = term > 0 ? "contango" : "backwardation";
    const skewSide = Math.abs(skew) > 2 ? "steep" : "flat";
    if (filter.ivBucket && filter.ivBucket !== "all" && ivBucket !== filter.ivBucket) continue;
    if (filter.term && filter.term !== "all" && termSide !== filter.term) continue;
    if (filter.skew && filter.skew !== "all" && skewSide !== filter.skew) continue;

    // P&L: edge ± regime kick ± noise
    const regimeKick = (cat === "earnings" ? 1.6 : cat === "fomc" ? 1.3 : cat === "cpi" ? 1.15 : 1);
    const noise = (r() - 0.45) * 280;
    const pnl = Math.round((baseEdge * regimeKick * (20 + r() * 30) + noise));
    cum += pnl;
    equity.push(cum);
    events.push({
      date: `D${i + 1}`,
      category: cat,
      ivRank,
      termSlope: term,
      skew,
      pnl,
      daysHeld: Math.max(1, Math.round(legs[0]?.expiryDays * (0.3 + r() * 0.7))),
    });
  }

  const wins = events.filter(e => e.pnl > 0);
  const losses = events.filter(e => e.pnl < 0);
  const grossWin = wins.reduce((s, e) => s + e.pnl, 0);
  const grossLoss = Math.abs(losses.reduce((s, e) => s + e.pnl, 0));
  const totalPnl = grossWin - grossLoss;
  const avgPnl = events.length ? totalPnl / events.length : 0;

  let peak = 0, maxDD = 0;
  equity.forEach(v => { if (v > peak) peak = v; const dd = peak - v; if (dd > maxDD) maxDD = dd; });

  const mean = avgPnl;
  const variance = events.reduce((s, e) => s + (e.pnl - mean) ** 2, 0) / Math.max(1, events.length - 1);
  const sharpe = variance > 0 ? (mean / Math.sqrt(variance)) * Math.sqrt(252) : 0;

  // histogram
  const buckets = [-2000, -1000, -500, -250, 0, 250, 500, 1000, 2000];
  const histogram = buckets.map((b, i) => {
    const next = buckets[i + 1] ?? Infinity;
    return { bucket: i === buckets.length - 1 ? `${b}+` : `${b}–${next}`, count: events.filter(e => e.pnl >= b && e.pnl < next).length };
  });

  return {
    trades: events.length,
    winRate: events.length ? +(wins.length / events.length * 100).toFixed(1) : 0,
    avgPnl: +avgPnl.toFixed(2),
    totalPnl,
    maxDD,
    sharpe: +sharpe.toFixed(2),
    profitFactor: grossLoss > 0 ? +(grossWin / grossLoss).toFixed(2) : grossWin > 0 ? 99 : 0,
    avgDaysHeld: +(events.reduce((s, e) => s + e.daysHeld, 0) / Math.max(1, events.length)).toFixed(1),
    equityCurve: equity,
    histogram,
    events,
  };
}

// Preset templates (strike offsets relative to spot)
export const STRATEGY_PRESETS: Record<string, Leg[]> = {
  "Long Call":       [{ id: "1", side: "LONG", type: "CALL", strikeOffset: 0, expiryDays: 30, qty: 1 }],
  "Long Put":        [{ id: "1", side: "LONG", type: "PUT",  strikeOffset: 0, expiryDays: 30, qty: 1 }],
  "Bull Call Spread":[
    { id: "1", side: "LONG",  type: "CALL", strikeOffset: 0,  expiryDays: 30, qty: 1 },
    { id: "2", side: "SHORT", type: "CALL", strikeOffset: 10, expiryDays: 30, qty: 1 },
  ],
  "Bear Put Spread": [
    { id: "1", side: "LONG",  type: "PUT", strikeOffset: 0,   expiryDays: 30, qty: 1 },
    { id: "2", side: "SHORT", type: "PUT", strikeOffset: -10, expiryDays: 30, qty: 1 },
  ],
  "Iron Condor":     [
    { id: "1", side: "SHORT", type: "PUT",  strikeOffset: -10, expiryDays: 30, qty: 1 },
    { id: "2", side: "LONG",  type: "PUT",  strikeOffset: -20, expiryDays: 30, qty: 1 },
    { id: "3", side: "SHORT", type: "CALL", strikeOffset: 10,  expiryDays: 30, qty: 1 },
    { id: "4", side: "LONG",  type: "CALL", strikeOffset: 20,  expiryDays: 30, qty: 1 },
  ],
  "Calendar":        [
    { id: "1", side: "SHORT", type: "CALL", strikeOffset: 0, expiryDays: 14, qty: 1 },
    { id: "2", side: "LONG",  type: "CALL", strikeOffset: 0, expiryDays: 45, qty: 1 },
  ],
  "Butterfly":       [
    { id: "1", side: "LONG",  type: "CALL", strikeOffset: -10, expiryDays: 30, qty: 1 },
    { id: "2", side: "SHORT", type: "CALL", strikeOffset: 0,   expiryDays: 30, qty: 2 },
    { id: "3", side: "LONG",  type: "CALL", strikeOffset: 10,  expiryDays: 30, qty: 1 },
  ],
};
