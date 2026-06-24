// Deterministic seeded mock series for options modules.
// Stable per ticker — same input always returns same output.

function hash(s: string): number {
  let h = 2166136261;
  for (let i = 0; i < s.length; i++) {
    h ^= s.charCodeAt(i);
    h = Math.imul(h, 16777619);
  }
  return h >>> 0;
}

function mulberry32(seed: number) {
  let a = seed;
  return function () {
    a |= 0; a = (a + 0x6D2B79F5) | 0;
    let t = a;
    t = Math.imul(t ^ (t >>> 15), t | 1);
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

export function seeded(ticker: string, salt = "") {
  return mulberry32(hash(ticker + ":" + salt));
}

// 30d series around a base value
export function sparkline(ticker: string, salt: string, base: number, vol = 0.1, n = 30): number[] {
  const rnd = seeded(ticker, salt);
  const out: number[] = [];
  let v = base;
  for (let i = 0; i < n; i++) {
    v += (rnd() - 0.5) * 2 * vol * base;
    v = Math.max(base * 0.4, Math.min(base * 1.8, v));
    out.push(v);
  }
  return out;
}

// percentile of last value in series
export function percentile(series: number[]): number {
  const sorted = [...series].sort((a, b) => a - b);
  const last = series[series.length - 1];
  const idx = sorted.findIndex((v) => v >= last);
  return Math.round((idx / Math.max(sorted.length - 1, 1)) * 100);
}

// Dealer flow prints
export interface DealerPrint {
  time: string;
  ticker: string;
  type: "C SWP" | "P SWP" | "C BLK" | "P BLK";
  strike: number;
  expiry: string;
  premium: number;       // $
  iv: number;            // %
  spot: number;
  exchange: string;
  conditions: string;
  smart: boolean;
  ageSec: number;
}

export function genPrints(ticker: string, n = 18): DealerPrint[] {
  const rnd = seeded(ticker, "prints");
  const exchanges = ["CBOE", "ISE", "PHLX", "ARCA", "BOX", "MIAX"];
  const conds = ["SWEEP", "BLOCK", "SPLIT", "ISO", "AUTO"];
  const out: DealerPrint[] = [];
  const now = Date.now();
  for (let i = 0; i < n; i++) {
    const isCall = rnd() > 0.5;
    const isSweep = rnd() > 0.4;
    const t = new Date(now - i * 1000 * 60 * (1 + rnd() * 5));
    out.push({
      time: t.toTimeString().slice(0, 8),
      ticker,
      type: `${isCall ? "C" : "P"} ${isSweep ? "SWP" : "BLK"}` as DealerPrint["type"],
      strike: Math.round((480 + (rnd() - 0.5) * 40) * 2) / 2,
      expiry: `${Math.floor(rnd() * 45)}DTE`,
      premium: Math.round(rnd() * 4_800_000 + 200_000),
      iv: +(15 + rnd() * 25).toFixed(1),
      spot: +(480 + (rnd() - 0.5) * 6).toFixed(2),
      exchange: exchanges[Math.floor(rnd() * exchanges.length)],
      conditions: conds[Math.floor(rnd() * conds.length)],
      smart: rnd() > 0.65,
      ageSec: Math.floor(i * 60 * (1 + rnd() * 5)),
    });
  }
  return out;
}

// IV history (30d)
export function ivHistory(ticker: string, atm = 20) {
  return sparkline(ticker, "iv", atm, 0.06);
}

// OI history
export function oiHistory(ticker: string, base = 500_000) {
  return sparkline(ticker, "oi", base, 0.04);
}

// format helpers
export const fmtNum = (n: number, d = 2) => n.toLocaleString("en-US", { minimumFractionDigits: d, maximumFractionDigits: d });
export const fmtPct = (n: number, d = 1) => `${n.toFixed(d)}%`;
export const fmtUsd = (n: number) => {
  if (Math.abs(n) >= 1e9) return `$${(n / 1e9).toFixed(2)}B`;
  if (Math.abs(n) >= 1e6) return `$${(n / 1e6).toFixed(2)}M`;
  if (Math.abs(n) >= 1e3) return `$${(n / 1e3).toFixed(1)}K`;
  return `$${n.toFixed(0)}`;
};

// ============= GEX cockpit generators =============

export type GexExpiryKey = "0DTE" | "1DTE" | "7DTE" | "14DTE" | "30DTE" | "60DTE" | "90DTE";
export const GEX_EXPIRIES: GexExpiryKey[] = ["0DTE", "1DTE", "7DTE", "14DTE", "30DTE", "60DTE", "90DTE"];
export const GEX_EXPIRY_GROUPS: Record<string, GexExpiryKey[]> = {
  ALL: GEX_EXPIRIES,
  "0DTE": ["0DTE"],
  WEEKLY: ["0DTE", "1DTE", "7DTE"],
  MONTHLY: ["14DTE", "30DTE"],
  QUARTERLY: ["60DTE", "90DTE"],
};

export interface GexCell {
  strike: number;
  expiry: GexExpiryKey;
  gex: number;
  oi: number;
  vol: number;
  hedge: number;
  vanna: number;
  charm: number;
}

export function gexSpot(ticker: string): number {
  const r = seeded(ticker, "spot");
  return +(480 + (r() - 0.5) * 60).toFixed(2);
}

export function gexStrikes(spot: number, n = 21, step = 2): number[] {
  const center = Math.round(spot / step) * step;
  const half = Math.floor(n / 2);
  return Array.from({ length: n }, (_, i) => center + (i - half) * step);
}

export function gexTermGrid(ticker: string, spot: number, strikes: number[]): GexCell[] {
  const r = seeded(ticker, "gexterm");
  const out: GexCell[] = [];
  for (const expiry of GEX_EXPIRIES) {
    const dteWeight = expiry === "0DTE" ? 1.4 : expiry === "1DTE" ? 1.1 : expiry === "7DTE" ? 0.95 : expiry === "14DTE" ? 0.8 : expiry === "30DTE" ? 0.65 : expiry === "60DTE" ? 0.45 : 0.3;
    for (const k of strikes) {
      const dist = (k - spot) / spot;
      const sign = dist >= 0 ? 1 : -1;
      const bell = Math.exp(-((dist * 18) ** 2));
      const noise = (r() - 0.5) * 0.6;
      const gex = sign * (60 + 240 * bell + noise * 80) * dteWeight * 1e6;
      const oi = Math.round((2000 + bell * 24000 + r() * 4000) * dteWeight);
      const vol = Math.round(oi * (0.15 + r() * 0.4));
      const hedge = Math.round((gex / (spot * 100)) * 0.01);
      const vanna = sign * bell * (r() * 8 + 2) * 1e6 * dteWeight;
      const charm = -sign * bell * (r() * 5 + 1) * 1e6 * dteWeight;
      out.push({ strike: k, expiry, gex, oi, vol, hedge, vanna, charm });
    }
  }
  return out;
}

export function aggregateByStrike(cells: GexCell[]) {
  const map = new Map<number, { strike: number; gex: number; oi: number; vol: number; vanna: number; charm: number; callGex: number; putGex: number }>();
  for (const c of cells) {
    const prev = map.get(c.strike) ?? { strike: c.strike, gex: 0, oi: 0, vol: 0, vanna: 0, charm: 0, callGex: 0, putGex: 0 };
    prev.gex += c.gex;
    prev.oi += c.oi;
    prev.vol += c.vol;
    prev.vanna += c.vanna;
    prev.charm += c.charm;
    if (c.gex >= 0) prev.callGex += c.gex; else prev.putGex += c.gex;
    map.set(c.strike, prev);
  }
  return Array.from(map.values()).sort((a, b) => a.strike - b.strike);
}

export interface GexIntradayPoint { t: string; net: number; call: number; put: number; zeroG: number }
export function gexIntraday(ticker: string, spot: number, points = 78): GexIntradayPoint[] {
  const r = seeded(ticker, "gexintra");
  const out: GexIntradayPoint[] = [];
  let net = (r() - 0.4) * 1.5e9;
  let zeroG = spot + (r() - 0.5) * 6;
  for (let i = 0; i < points; i++) {
    net += (r() - 0.5) * 1.4e8;
    zeroG += (r() - 0.5) * 0.4;
    const call = Math.max(0, net * (0.55 + r() * 0.15)) + r() * 2e8;
    const put = Math.min(0, net - call) - r() * 1e8;
    const min = 9 * 60 + 30 + i * 5;
    const hh = String(Math.floor(min / 60)).padStart(2, "0");
    const mm = String(min % 60).padStart(2, "0");
    out.push({ t: `${hh}:${mm}`, net: +net.toFixed(0), call: +call.toFixed(0), put: +put.toFixed(0), zeroG: +zeroG.toFixed(2) });
  }
  return out;
}

export function zeroGammaHistory(ticker: string, spot: number, days = 5) {
  const r = seeded(ticker, "zgh");
  const labels = ["D-4", "D-3", "D-2", "D-1", "TODAY"].slice(-days);
  let base = spot + (r() - 0.5) * 4;
  return labels.map((day) => {
    const close = +(base + (r() - 0.5) * 1.4).toFixed(2);
    const min = +(close - (0.6 + r() * 1.4)).toFixed(2);
    const max = +(close + (0.6 + r() * 1.4)).toFixed(2);
    base = close;
    return { day, min, max, close };
  });
}

export interface GexKeyLevels { callWall: number; putWall: number; maxPain: number; flip: number; spot: number; vwap: number; pdh: number; pdl: number; zeroGBand: { lo: number; hi: number } }
export function gexKeyLevels(ticker: string, spot: number, strikes: { strike: number; gex: number; callGex: number; putGex: number; oi: number }[]): GexKeyLevels {
  const r = seeded(ticker, "gexkl");
  const callWall = strikes.reduce((best, s) => s.callGex > best.callGex ? s : best, strikes[0]).strike;
  const putWall = strikes.reduce((best, s) => s.putGex < best.putGex ? s : best, strikes[0]).strike;
  const maxPain = strikes.reduce((best, s) => s.oi > best.oi ? s : best, strikes[0]).strike;
  let cum = 0, flip = spot;
  for (const s of strikes) { cum += s.gex; if (cum >= 0) { flip = s.strike; break; } }
  const hist = zeroGammaHistory(ticker, spot, 5);
  return {
    callWall, putWall, maxPain, flip,
    spot,
    vwap: +(spot + (r() - 0.5) * 1.2).toFixed(2),
    pdh: +(spot + 2 + r() * 2).toFixed(2),
    pdl: +(spot - 2 - r() * 2).toFixed(2),
    zeroGBand: {
      lo: Math.min(...hist.map(h => h.min)),
      hi: Math.max(...hist.map(h => h.max)),
    },
  };
}

