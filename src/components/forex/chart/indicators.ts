// Technical indicator calculations operating on Candle[] arrays.
import { Candle } from './fxSeries';

export function ema(values: number[], period: number): (number | null)[] {
  const k = 2 / (period + 1);
  const out: (number | null)[] = [];
  let prev: number | null = null;
  for (let i = 0; i < values.length; i++) {
    if (i < period - 1) { out.push(null); continue; }
    if (prev === null) {
      let sum = 0;
      for (let j = i - period + 1; j <= i; j++) sum += values[j];
      prev = sum / period;
    } else {
      prev = values[i] * k + prev * (1 - k);
    }
    out.push(prev);
  }
  return out;
}

export function sma(values: number[], period: number): (number | null)[] {
  const out: (number | null)[] = [];
  let sum = 0;
  for (let i = 0; i < values.length; i++) {
    sum += values[i];
    if (i >= period) sum -= values[i - period];
    out.push(i >= period - 1 ? sum / period : null);
  }
  return out;
}

export interface BB { mid: (number | null)[]; upper: (number | null)[]; lower: (number | null)[]; }
export function bollinger(values: number[], period = 20, mult = 2): BB {
  const mid = sma(values, period);
  const upper: (number | null)[] = [];
  const lower: (number | null)[] = [];
  for (let i = 0; i < values.length; i++) {
    if (i < period - 1) { upper.push(null); lower.push(null); continue; }
    let sum2 = 0;
    const m = mid[i] as number;
    for (let j = i - period + 1; j <= i; j++) sum2 += (values[j] - m) ** 2;
    const sd = Math.sqrt(sum2 / period);
    upper.push(m + mult * sd);
    lower.push(m - mult * sd);
  }
  return { mid, upper, lower };
}

export function rsi(values: number[], period = 14): (number | null)[] {
  const out: (number | null)[] = [null];
  let avgG = 0, avgL = 0;
  for (let i = 1; i < values.length; i++) {
    const ch = values[i] - values[i - 1];
    const g = Math.max(0, ch);
    const l = Math.max(0, -ch);
    if (i <= period) {
      avgG += g; avgL += l;
      if (i === period) {
        avgG /= period; avgL /= period;
        const rs = avgL === 0 ? 100 : avgG / avgL;
        out.push(100 - 100 / (1 + rs));
      } else { out.push(null); }
    } else {
      avgG = (avgG * (period - 1) + g) / period;
      avgL = (avgL * (period - 1) + l) / period;
      const rs = avgL === 0 ? 100 : avgG / avgL;
      out.push(100 - 100 / (1 + rs));
    }
  }
  return out;
}

export interface MACD { macd: (number | null)[]; signal: (number | null)[]; hist: (number | null)[]; }
export function macd(values: number[], fast = 12, slow = 26, sig = 9): MACD {
  const emaFast = ema(values, fast);
  const emaSlow = ema(values, slow);
  const line = values.map((_, i) => {
    const f = emaFast[i], s = emaSlow[i];
    return f === null || s === null ? null : f - s;
  });
  const valid = line.map(v => v ?? 0);
  const signal = ema(valid, sig).map((v, i) => (line[i] === null ? null : v));
  const hist = line.map((v, i) => v === null || signal[i] === null ? null : v - (signal[i] as number));
  return { macd: line, signal, hist };
}

export function closes(c: Candle[]): number[] { return c.map(x => x.c); }
