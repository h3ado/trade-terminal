// Seeded mock generator for Unusual Options Activity prints.
export interface UoaPrint {
  id: string;
  ts: number;
  ticker: string;
  expiry: string;     // YYYY-MM-DD
  strike: number;
  cp: "C" | "P";
  size: number;
  premium: number;    // $ notional
  spot: number;
  mid: number;
  fillPx: number;
  side: "BUY" | "SELL";
  iv: number;
  oi: number;
  oiDelta: number;
  tags: ("SWEEP" | "BLOCK" | "REPEAT" | "OPENING" | "SPLIT")[];
}

const UNIVERSE = ["SPY","QQQ","AAPL","NVDA","TSLA","META","AMZN","MSFT","GOOG","AMD","COIN","NFLX","IWM","SMH","TLT"];

function rng(seed: number) { let a = seed; return () => { a |= 0; a = (a + 0x6D2B79F5) | 0; let t = a; t = Math.imul(t ^ (t >>> 15), t | 1); t ^= t + Math.imul(t ^ (t >>> 7), t | 61); return ((t ^ (t >>> 14)) >>> 0) / 4294967296; }; }

function pad(n: number) { return n < 10 ? "0" + n : "" + n; }
function fmtDate(d: Date) { return `${d.getUTCFullYear()}-${pad(d.getUTCMonth()+1)}-${pad(d.getUTCDate())}`; }

export function generateUoa(seed: number, count = 80): UoaPrint[] {
  const r = rng(seed);
  const now = Date.now();
  const out: UoaPrint[] = [];
  for (let i = 0; i < count; i++) {
    const ticker = UNIVERSE[Math.floor(r() * UNIVERSE.length)];
    const spot = 50 + Math.floor(r() * 600);
    const cp: "C" | "P" = r() > 0.5 ? "C" : "P";
    const strikeOff = Math.round((r() - 0.5) * 40);
    const strike = Math.max(5, spot + strikeOff);
    const dte = Math.floor(r() * 60) + 1;
    const exp = new Date(now + dte * 86400000);
    const size = Math.floor(50 + r() * 4500);
    const mid = +(0.5 + r() * 12).toFixed(2);
    const fillPx = +(mid + (r() - 0.4) * 0.4).toFixed(2);
    const premium = Math.round(size * fillPx * 100);
    const side: "BUY" | "SELL" = fillPx >= mid ? "BUY" : "SELL";
    const tags: UoaPrint["tags"] = [];
    if (size > 1500 && r() > 0.4) tags.push("SWEEP");
    if (size > 2500) tags.push("BLOCK");
    if (r() > 0.75) tags.push("REPEAT");
    if (r() > 0.55) tags.push("OPENING");
    if (r() > 0.85) tags.push("SPLIT");
    out.push({
      id: `${ticker}-${i}-${seed}`,
      ts: now - Math.floor(r() * 3600_000),
      ticker, expiry: fmtDate(exp), strike, cp, size, premium,
      spot, mid, fillPx, side,
      iv: +(15 + r() * 80).toFixed(1),
      oi: Math.floor(100 + r() * 50000),
      oiDelta: Math.floor((r() - 0.3) * 8000),
      tags,
    });
  }
  return out.sort((a, b) => b.ts - a.ts);
}
