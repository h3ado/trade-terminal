// Mock generators for vol-arb lab: cone, IV/RV history, dispersion.
function hash(s: string): number { let h = 2166136261; for (let i = 0; i < s.length; i++) { h ^= s.charCodeAt(i); h = Math.imul(h, 16777619); } return h >>> 0; }
function rng(seed: number) { let a = seed; return () => { a |= 0; a = (a + 0x6D2B79F5) | 0; let t = a; t = Math.imul(t ^ (t >>> 15), t | 1); t ^= t + Math.imul(t ^ (t >>> 7), t | 61); return ((t ^ (t >>> 14)) >>> 0) / 4294967296; }; }

export interface ConePoint { window: number; p10: number; p25: number; p50: number; p75: number; p90: number; iv: number; }
export interface IvRvPoint { day: number; iv: number; rv: number; spread: number; }
export interface DispersionRow { ticker: string; weight: number; iv: number; }

export function getVolCone(ticker: string): ConePoint[] {
  const r = rng(hash(ticker + ":cone"));
  const base = 14 + r() * 18;
  const windows = [10, 20, 30, 60, 90, 120, 180, 252];
  return windows.map(w => {
    const center = base + (r() - 0.5) * 4 + Math.log(w) * 0.6;
    const wide = 6 + r() * 4;
    return {
      window: w,
      p10: +(center - wide).toFixed(1),
      p25: +(center - wide * 0.5).toFixed(1),
      p50: +center.toFixed(1),
      p75: +(center + wide * 0.5).toFixed(1),
      p90: +(center + wide).toFixed(1),
      iv: +(center + (r() - 0.3) * 2).toFixed(1),
    };
  });
}

export function getIvRvSeries(ticker: string, days = 90): IvRvPoint[] {
  const r = rng(hash(ticker + ":ivrv"));
  const out: IvRvPoint[] = [];
  let iv = 18 + r() * 10;
  let rv = iv * 0.9;
  for (let d = 0; d < days; d++) {
    iv += (r() - 0.5) * 1.4;
    rv += (r() - 0.5) * 1.6;
    iv = Math.max(8, Math.min(70, iv));
    rv = Math.max(5, Math.min(65, rv));
    out.push({ day: d, iv: +iv.toFixed(2), rv: +rv.toFixed(2), spread: +(iv - rv).toFixed(2) });
  }
  return out;
}

export function getDispersion(index: string): { indexIv: number; basketIv: number; rows: DispersionRow[] } {
  const r = rng(hash(index + ":disp"));
  const components = ["AAPL","MSFT","NVDA","GOOG","AMZN","META","TSLA","BRK.B","JPM","JNJ"];
  const rows = components.map(c => ({
    ticker: c,
    weight: +(2 + r() * 10).toFixed(1),
    iv: +(15 + r() * 35).toFixed(1),
  }));
  const basketIv = +(rows.reduce((s, x) => s + x.iv * x.weight, 0) / rows.reduce((s, x) => s + x.weight, 0)).toFixed(1);
  const indexIv = +(basketIv * (0.65 + r() * 0.2)).toFixed(1);
  return { indexIv, basketIv, rows: rows.sort((a, b) => b.weight - a.weight) };
}

export function getRolldown(ticker: string): { dte: number; iv: number; thetaPnl: number }[] {
  const r = rng(hash(ticker + ":roll"));
  const dtes = [7, 14, 21, 30, 45, 60, 90, 120];
  return dtes.map(d => ({
    dte: d,
    iv: +(15 + r() * 20 - d * 0.02).toFixed(1),
    thetaPnl: +((45 / Math.max(d, 7)) * (1 + (r() - 0.5) * 0.3) * 12).toFixed(1),
  }));
}
