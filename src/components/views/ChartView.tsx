// CHART — Full Chart Workstation (lightweight-charts v5)
// Data: /api/market/security/:ticker/chart (Twelve Data / Finnhub / Yahoo Finance -> DB cache)
import { useEffect, useRef, useState, useCallback } from 'react';
import {
  createChart,
  CandlestickSeries,
  LineSeries,
  HistogramSeries,
  type IChartApi,
  type Time,
} from 'lightweight-charts';
import { apiGet } from '@/lib/api';
import { seeded } from '@/components/options/shared/mockSeries';

// ── types ─────────────────────────────────────────────────────────────────────

interface Candle {
  time: string;
  open: number;
  high: number;
  low: number;
  close: number;
  volume: number | null;
}

interface ChartCandle {
  time: Time;
  open: number;
  high: number;
  low: number;
  close: number;
}

// ── indicator math ─────────────────────────────────────────────────────────────

function sma(closes: number[], n: number): (number | null)[] {
  return closes.map((_, i) => {
    if (i < n - 1) return null;
    return closes.slice(i - n + 1, i + 1).reduce((s, v) => s + v, 0) / n;
  });
}

function ema(closes: number[], n: number): (number | null)[] {
  const k = 2 / (n + 1);
  const out: (number | null)[] = new Array(closes.length).fill(null);
  let prev: number | null = null;
  for (let i = 0; i < closes.length; i++) {
    if (i < n - 1) continue;
    if (prev === null) {
      prev = closes.slice(0, n).reduce((s, v) => s + v, 0) / n;
      out[i] = prev;
      continue;
    }
    prev = closes[i] * k + prev * (1 - k);
    out[i] = prev;
  }
  return out;
}

function bollingerBands(closes: number[], n = 20, mult = 2) {
  const mid = sma(closes, n);
  return closes.map((_, i) => {
    if (mid[i] === null) return { upper: null, mid: null, lower: null };
    const slice = closes.slice(i - n + 1, i + 1);
    const mean = mid[i] as number;
    const std = Math.sqrt(slice.reduce((s, v) => s + (v - mean) ** 2, 0) / n);
    return { upper: mean + mult * std, mid: mean, lower: mean - mult * std };
  });
}

function rsi(closes: number[], period = 14): (number | null)[] {
  const out: (number | null)[] = new Array(closes.length).fill(null);
  if (closes.length < period + 1) return out;
  let gains = 0, losses = 0;
  for (let i = 1; i <= period; i++) {
    const d = closes[i] - closes[i - 1];
    if (d > 0) gains += d; else losses -= d;
  }
  let avgGain = gains / period, avgLoss = losses / period;
  out[period] = avgLoss === 0 ? 100 : 100 - 100 / (1 + avgGain / avgLoss);
  for (let i = period + 1; i < closes.length; i++) {
    const d = closes[i] - closes[i - 1];
    avgGain = (avgGain * (period - 1) + Math.max(d, 0)) / period;
    avgLoss = (avgLoss * (period - 1) + Math.max(-d, 0)) / period;
    out[i] = avgLoss === 0 ? 100 : 100 - 100 / (1 + avgGain / avgLoss);
  }
  return out;
}

function macd(closes: number[], fast = 12, slow = 26, signal = 9) {
  const emaFast = ema(closes, fast);
  const emaSlow = ema(closes, slow);
  const macdLine = closes.map((_, i) => {
    if (emaFast[i] === null || emaSlow[i] === null) return null;
    return (emaFast[i] as number) - (emaSlow[i] as number);
  });
  const validMacd = macdLine.filter((v): v is number => v !== null);
  const sigLine = ema(validMacd, signal);
  let sigIdx = 0;
  const signalOut: (number | null)[] = macdLine.map(v => {
    if (v === null) return null;
    return sigLine[sigIdx++] ?? null;
  });
  const histogram = macdLine.map((m, i) => {
    if (m === null || signalOut[i] === null) return null;
    return m - (signalOut[i] as number);
  });
  return { macdLine, signalLine: signalOut, histogram };
}

// ── new indicator math ─────────────────────────────────────────────────────────

function vwap(candles: Candle[]): (number | null)[] {
  let cumPV = 0, cumVol = 0, currentDate = '';
  return candles.map(c => {
    const date = c.time.slice(0, 10);
    if (date !== currentDate) { cumPV = 0; cumVol = 0; currentDate = date; }
    const typ = (c.high + c.low + c.close) / 3;
    const vol = c.volume ?? 0;
    cumPV += typ * vol;
    cumVol += vol;
    return cumVol === 0 ? null : cumPV / cumVol;
  });
}

function atr(candles: Candle[], period = 14): (number | null)[] {
  const out: (number | null)[] = new Array(candles.length).fill(null);
  let trSum = 0;
  let smoothed: number | null = null;
  for (let i = 0; i < candles.length; i++) {
    const pc = i === 0 ? candles[i].open : candles[i - 1].close;
    const tr = Math.max(candles[i].high - candles[i].low, Math.abs(candles[i].high - pc), Math.abs(candles[i].low - pc));
    if (i < period - 1) { trSum += tr; continue; }
    if (i === period - 1) { trSum += tr; smoothed = trSum / period; out[i] = smoothed; continue; }
    smoothed = smoothed! * (period - 1) / period + tr / period;
    out[i] = smoothed;
  }
  return out;
}

function keltnerChannels(candles: Candle[], emaPeriod = 20, atrPeriod = 14, mult = 1.5) {
  const closes = candles.map(c => c.close);
  const mid = ema(closes, emaPeriod);
  const atrVals = atr(candles, atrPeriod);
  return candles.map((_, i) => {
    if (mid[i] === null || atrVals[i] === null) return { upper: null, mid: null, lower: null };
    return {
      upper: (mid[i] as number) + mult * (atrVals[i] as number),
      mid: mid[i] as number,
      lower: (mid[i] as number) - mult * (atrVals[i] as number),
    };
  });
}

function stochastic(candles: Candle[], kPeriod = 14, kSmooth = 3, dPeriod = 3) {
  const fastK: (number | null)[] = candles.map((_, i) => {
    if (i < kPeriod - 1) return null;
    const slice = candles.slice(i - kPeriod + 1, i + 1);
    const lo = Math.min(...slice.map(c => c.low));
    const hi = Math.max(...slice.map(c => c.high));
    return hi === lo ? 50 : ((candles[i].close - lo) / (hi - lo)) * 100;
  });
  const smoothK: (number | null)[] = fastK.map((_, i) => {
    const window = fastK.slice(Math.max(0, i - kSmooth + 1), i + 1).filter((v): v is number => v !== null);
    return window.length < kSmooth ? null : window.reduce((s, v) => s + v, 0) / kSmooth;
  });
  const smoothD: (number | null)[] = smoothK.map((_, i) => {
    const window = smoothK.slice(Math.max(0, i - dPeriod + 1), i + 1).filter((v): v is number => v !== null);
    return window.length < dPeriod ? null : window.reduce((s, v) => s + v, 0) / dPeriod;
  });
  return { k: smoothK, d: smoothD };
}

function obv(candles: Candle[]): number[] {
  let val = 0;
  return candles.map((c, i) => {
    if (i > 0) {
      if (c.close > candles[i - 1].close) val += c.volume ?? 0;
      else if (c.close < candles[i - 1].close) val -= c.volume ?? 0;
    }
    return val;
  });
}

function adxCalc(candles: Candle[], period = 14): { adx: (number | null)[]; diPlus: (number | null)[]; diMinus: (number | null)[] } {
  const n = candles.length;
  const adxOut: (number | null)[] = new Array(n).fill(null);
  const dpOut: (number | null)[] = new Array(n).fill(null);
  const dmOut: (number | null)[] = new Array(n).fill(null);
  if (n < period * 2) return { adx: adxOut, diPlus: dpOut, diMinus: dmOut };

  let trSum = 0, dpSum = 0, dmSum = 0;
  for (let i = 1; i <= period; i++) {
    const { high: h, low: l } = candles[i];
    const { high: ph, low: pl, close: pc } = candles[i - 1];
    trSum += Math.max(h - l, Math.abs(h - pc), Math.abs(l - pc));
    const up = h - ph, down = pl - l;
    dpSum += up > down && up > 0 ? up : 0;
    dmSum += down > up && down > 0 ? down : 0;
  }
  dpOut[period] = trSum > 0 ? (dpSum / trSum) * 100 : 0;
  dmOut[period] = trSum > 0 ? (dmSum / trSum) * 100 : 0;

  let dxAccum = 0, dxCount = 0;
  for (let i = period + 1; i < n; i++) {
    const { high: h, low: l } = candles[i];
    const { high: ph, low: pl, close: pc } = candles[i - 1];
    const tr = Math.max(h - l, Math.abs(h - pc), Math.abs(l - pc));
    const up = h - ph, down = pl - l;
    trSum = trSum - trSum / period + tr;
    dpSum = dpSum - dpSum / period + (up > down && up > 0 ? up : 0);
    dmSum = dmSum - dmSum / period + (down > up && down > 0 ? down : 0);
    const diP = trSum > 0 ? (dpSum / trSum) * 100 : 0;
    const diM = trSum > 0 ? (dmSum / trSum) * 100 : 0;
    dpOut[i] = diP; dmOut[i] = diM;
    const dx = (diP + diM) === 0 ? 0 : (Math.abs(diP - diM) / (diP + diM)) * 100;
    if (i < period * 2) {
      dxAccum += dx; dxCount++;
      if (i === period * 2 - 1) adxOut[i] = dxCount > 0 ? dxAccum / dxCount : 0;
    } else {
      adxOut[i] = adxOut[i - 1] !== null ? ((adxOut[i - 1] as number) * (period - 1) + dx) / period : dx;
    }
  }
  return { adx: adxOut, diPlus: dpOut, diMinus: dmOut };
}

function parabolicSar(candles: Candle[], initAf = 0.02, maxAf = 0.2): { sar: (number | null)[]; bullish: boolean[] } {
  const n = candles.length;
  const sarOut: (number | null)[] = new Array(n).fill(null);
  const bullish: boolean[] = new Array(n).fill(true);
  if (n < 2) return { sar: sarOut, bullish };

  let isBull = candles[1].close > candles[0].close;
  let sarVal = isBull ? candles[0].low : candles[0].high;
  let ep = isBull ? candles[0].high : candles[0].low;
  let af = initAf;

  for (let i = 1; i < n; i++) {
    const c = candles[i];
    const prev1 = candles[i - 1];
    const prev2 = i >= 2 ? candles[i - 2] : prev1;
    let newSar = sarVal + af * (ep - sarVal);

    if (isBull) {
      newSar = Math.min(newSar, prev1.low, prev2.low);
      if (c.low < newSar) {
        isBull = false; sarVal = ep; ep = c.low; af = initAf;
        newSar = sarVal + af * (ep - sarVal);
      } else {
        if (c.high > ep) { ep = c.high; af = Math.min(af + initAf, maxAf); }
        sarVal = newSar;
      }
    } else {
      newSar = Math.max(newSar, prev1.high, prev2.high);
      if (c.high > newSar) {
        isBull = true; sarVal = ep; ep = c.high; af = initAf;
        newSar = sarVal + af * (ep - sarVal);
      } else {
        if (c.low < ep) { ep = c.low; af = Math.min(af + initAf, maxAf); }
        sarVal = newSar;
      }
    }
    sarOut[i] = newSar;
    bullish[i] = isBull;
  }
  return { sar: sarOut, bullish };
}

function pivotPoints(candles: Candle[]) {
  if (candles.length < 2) return null;
  const prev = candles[candles.length - 2];
  const { high: H, low: L, close: C } = prev;
  const pp = (H + L + C) / 3;
  return { pp, r1: 2 * pp - L, r2: pp + (H - L), s1: 2 * pp - H, s2: pp - (H - L) };
}

// ── synthetic fallback ─────────────────────────────────────────────────────────

function syntheticCandles(ticker: string, n = 200): Candle[] {
  const r = seeded(ticker, 'chart');
  const today = Date.now();
  let close = 100 + r() * 400;
  const candles: Candle[] = [];
  for (let i = n; i >= 0; i--) {
    const date = new Date(today - i * 24 * 60 * 60 * 1000);
    if (date.getDay() === 0 || date.getDay() === 6) continue;
    const open = close * (1 + (r() - 0.5) * 0.02);
    const high = Math.max(open, close) * (1 + r() * 0.015);
    const low = Math.min(open, close) * (1 - r() * 0.015);
    close = open + (r() - 0.5) * open * 0.03;
    candles.push({
      time: date.toISOString().slice(0, 10),
      open: +open.toFixed(2), high: +high.toFixed(2),
      low: +low.toFixed(2), close: +close.toFixed(2),
      volume: Math.round(1e6 + r() * 9e6),
    });
  }
  return candles;
}

// ── chart theme ────────────────────────────────────────────────────────────────

const BG = '#0a0a0f', TEXT = '#8b8b9e', GRID = '#1a1a2e';
const UP = '#22c55e', DOWN = '#ef4444';

const baseChartOpts = {
  layout: { background: { color: BG }, textColor: TEXT, fontFamily: '"JetBrains Mono","Fira Mono",monospace', fontSize: 10 },
  grid: { vertLines: { color: GRID }, horzLines: { color: GRID } },
  crosshair: { vertLine: { labelBackgroundColor: '#222' }, horzLine: { labelBackgroundColor: '#222' } },
  rightPriceScale: { borderColor: GRID, scaleMargins: { top: 0.05, bottom: 0.05 } },
  timeScale: { borderColor: GRID, timeVisible: true, secondsVisible: false },
  handleScroll: true, handleScale: true,
} as const;

// ── indicator keys & metadata ──────────────────────────────────────────────────

type IndicatorKey =
  'SMA20' | 'SMA50' | 'SMA200' | 'EMA9' | 'EMA21' | 'BB' | 'VOL'  // original
  | 'VWAP' | 'KC' | 'PSAR' | 'PIVOTS'                               // new overlays
  | 'RSI' | 'MACD' | 'STOCH' | 'OBV' | 'ADX';                      // oscillators

const IND_LABELS: Record<IndicatorKey, string> = {
  SMA20: 'SMA 20', SMA50: 'SMA 50', SMA200: 'SMA 200', EMA9: 'EMA 9', EMA21: 'EMA 21',
  BB: 'BB 20,2', VOL: 'Volume',
  VWAP: 'VWAP', KC: 'KC 20,1.5', PSAR: 'PSAR', PIVOTS: 'PIVOTS',
  RSI: 'RSI 14', MACD: 'MACD', STOCH: 'STOCH', OBV: 'OBV', ADX: 'ADX 14',
};

const IND_COLORS: Record<IndicatorKey, string> = {
  SMA20: '#3b82f6', SMA50: '#f59e0b', SMA200: '#a78bfa', EMA9: '#06b6d4', EMA21: '#ec4899',
  BB: '#6b7280', VOL: '#374151',
  VWAP: '#a78bfa', KC: '#06b6d4', PSAR: '#94a3b8', PIVOTS: '#e2e8f0',
  RSI: '#f97316', MACD: '#f97316', STOCH: '#f59e0b', OBV: '#10b981', ADX: '#f97316',
};

const OVERLAY_KEYS: IndicatorKey[] = ['SMA20', 'SMA50', 'SMA200', 'EMA9', 'EMA21', 'BB', 'VWAP', 'KC', 'PSAR', 'PIVOTS', 'VOL'];
const OSCILLATOR_KEYS: IndicatorKey[] = ['RSI', 'MACD', 'STOCH', 'OBV', 'ADX'];
const DEFAULT_ON: IndicatorKey[] = ['SMA20', 'VOL'];
const MAX_OSCILLATORS = 3;

// ── intervals ──────────────────────────────────────────────────────────────────

const INTERVALS = [
  { label: '1m',  api: '1min',   outputsize: 200 },
  { label: '5m',  api: '5min',   outputsize: 200 },
  { label: '15m', api: '15min',  outputsize: 200 },
  { label: '30m', api: '30min',  outputsize: 200 },
  { label: '1h',  api: '1h',     outputsize: 200 },
  { label: '4h',  api: '4h',     outputsize: 200 },
  { label: '1D',  api: '1day',   outputsize: 365 },
  { label: '1W',  api: '1week',  outputsize: 200 },
  { label: '1M',  api: '1month', outputsize: 120 },
];
const INTRADAY_APIs = new Set(['1min', '5min', '15min', '30min', '1h', '4h']);

// ── OHLCV hover bar ────────────────────────────────────────────────────────────

interface OHLCVInfo { time: string; o: number; h: number; l: number; c: number; v: number; chg: number; chgPct: number }

function OHLCVBar({ info, ticker }: { info: OHLCVInfo | null; ticker: string }) {
  if (!info) return (
    <div className="flex items-center gap-3 px-3 py-1 bg-[#0a0a0f] border-b border-[#1a1a2e] text-[9px] font-mono text-muted-foreground">
      <span className="text-accent font-bold">{ticker}</span>
      <span>Hover chart for OHLCV</span>
    </div>
  );
  const pos = info.chg >= 0;
  return (
    <div className="flex items-center gap-3 px-3 py-1 bg-[#0a0a0f] border-b border-[#1a1a2e] text-[9px] font-mono flex-wrap">
      <span className="text-accent font-bold">{ticker}</span>
      <span className="text-muted-foreground">{info.time}</span>
      {(['O', 'H', 'L', 'C'] as const).map((k, idx) => (
        <span key={k}><span className="text-muted-foreground">{k} </span><span className="text-foreground font-bold">{[info.o, info.h, info.l, info.c][idx].toFixed(2)}</span></span>
      ))}
      <span><span className="text-muted-foreground">V </span><span className="text-foreground">{info.v >= 1e6 ? `${(info.v / 1e6).toFixed(2)}M` : info.v >= 1e3 ? `${(info.v / 1e3).toFixed(0)}K` : String(info.v)}</span></span>
      <span className={pos ? 'text-positive' : 'text-negative'}>{pos ? '+' : ''}{info.chg.toFixed(2)} ({pos ? '+' : ''}{info.chgPct.toFixed(2)}%)</span>
    </div>
  );
}

// ── main component ─────────────────────────────────────────────────────────────

interface Props { initialTicker?: string }

export default function ChartView({ initialTicker = 'AAPL' }: Props) {
  const [ticker, setTicker] = useState(initialTicker.toUpperCase());
  const [inputVal, setInputVal] = useState(initialTicker.toUpperCase());
  const [intervalIdx, setIntervalIdx] = useState(6);
  const [indicators, setIndicators] = useState<Set<IndicatorKey>>(new Set(DEFAULT_ON));
  const [candles, setCandles] = useState<Candle[]>([]);
  const [loading, setLoading] = useState(false);
  const [synthetic, setSynthetic] = useState(false);
  const [ohlcvInfo, setOhlcvInfo] = useState<OHLCVInfo | null>(null);

  const mainRef = useRef<HTMLDivElement>(null);
  const paneRefs = useRef<(HTMLDivElement | null)[]>([null, null, null]);
  const mainChart = useRef<IChartApi | null>(null);
  const paneCharts = useRef<(IChartApi | null)[]>([null, null, null]);

  const isIntradayInterval = INTRADAY_APIs.has(INTERVALS[intervalIdx].api);
  const activeOscillators = OSCILLATOR_KEYS.filter(k => indicators.has(k)).slice(0, MAX_OSCILLATORS);
  const activeOscCount = OSCILLATOR_KEYS.filter(k => indicators.has(k)).length;

  const toggleIndicator = useCallback((k: IndicatorKey) => {
    setIndicators(prev => {
      const next = new Set(prev);
      if (next.has(k)) { next.delete(k); return next; }
      if (OSCILLATOR_KEYS.includes(k) && OSCILLATOR_KEYS.filter(ok => next.has(ok)).length >= MAX_OSCILLATORS) return prev;
      next.add(k);
      return next;
    });
  }, []);

  // ── data fetch ────────────────────────────────────────────────────────────────

  const fetchCandles = useCallback(async (sym: string, ivl: typeof INTERVALS[0]) => {
    setLoading(true);
    try {
      const data = await apiGet(`/api/market/security/${encodeURIComponent(sym)}/chart?interval=${ivl.api}&outputsize=${ivl.outputsize}`);
      const raw: Candle[] = (data.candles ?? []).filter((c: Candle) => c.open && c.close);
      if (raw.length < 5) throw new Error('Insufficient data');
      setCandles(raw);
      setSynthetic(false);
    } catch {
      setCandles(syntheticCandles(sym));
      setSynthetic(true);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { fetchCandles(ticker, INTERVALS[intervalIdx]); }, [ticker, intervalIdx, fetchCandles]);

  // ── chart construction ────────────────────────────────────────────────────────

  useEffect(() => {
    if (!mainRef.current || candles.length === 0) return;

    // Tear down previous
    mainChart.current?.remove();
    paneCharts.current.forEach(c => c?.remove());
    mainChart.current = null;
    paneCharts.current = [null, null, null];

    const closes = candles.map(c => c.close);
    const chartData: { time: Time; open: number; high: number; low: number; close: number }[] =
      candles.map(c => ({ time: c.time as Time, open: c.open, high: c.high, low: c.low, close: c.close }));

    const hasVol = indicators.has('VOL');

    // ── main chart ──────────────────────────────────────────────────────────────
    const chart = createChart(mainRef.current, {
      ...baseChartOpts,
      width: mainRef.current.clientWidth,
      height: mainRef.current.clientHeight,
      rightPriceScale: {
        borderColor: GRID,
        scaleMargins: hasVol ? { top: 0.02, bottom: 0.22 } : { top: 0.02, bottom: 0.05 },
      },
    });
    mainChart.current = chart;

    // Candlestick series
    const candleSeries = chart.addSeries(CandlestickSeries, {
      upColor: UP, downColor: DOWN, borderUpColor: UP, borderDownColor: DOWN, wickUpColor: UP, wickDownColor: DOWN,
    });
    candleSeries.setData(chartData);

    // Crosshair OHLCV info
    chart.subscribeCrosshairMove(param => {
      if (!param.time || !param.seriesData) { setOhlcvInfo(null); return; }
      const cd = param.seriesData.get(candleSeries) as ChartCandle | undefined;
      if (!cd) { setOhlcvInfo(null); return; }
      const chg = cd.close - cd.open;
      setOhlcvInfo({
        time: String(param.time), o: cd.open, h: cd.high, l: cd.low, c: cd.close,
        v: candles.find(c => c.time === String(param.time))?.volume ?? 0,
        chg, chgPct: cd.open !== 0 ? (chg / cd.open) * 100 : 0,
      });
    });

    // Volume
    if (hasVol) {
      const volSeries = chart.addSeries(HistogramSeries, { priceFormat: { type: 'volume' }, priceScaleId: 'vol' });
      chart.priceScale('vol').applyOptions({ scaleMargins: { top: 0.8, bottom: 0 } });
      volSeries.setData(candles.map(c => ({ time: c.time as Time, value: c.volume ?? 0, color: c.close >= c.open ? `${UP}55` : `${DOWN}55` })));
    }

    // Bollinger Bands
    if (indicators.has('BB')) {
      const bb = bollingerBands(closes);
      const bbStyle = { lineWidth: 1 as const, color: IND_COLORS.BB, lineStyle: 2 as const };
      const upper = chart.addSeries(LineSeries, bbStyle);
      const mid_ = chart.addSeries(LineSeries, { ...bbStyle, lineStyle: 0 as const });
      const lower = chart.addSeries(LineSeries, bbStyle);
      upper.setData(candles.map((c, i) => ({ time: c.time as Time, value: bb[i].upper ?? NaN })).filter(d => !isNaN(d.value)));
      mid_.setData(candles.map((c, i) => ({ time: c.time as Time, value: bb[i].mid ?? NaN })).filter(d => !isNaN(d.value)));
      lower.setData(candles.map((c, i) => ({ time: c.time as Time, value: bb[i].lower ?? NaN })).filter(d => !isNaN(d.value)));
    }

    // SMA / EMA overlays
    const lineOverlays: [IndicatorKey, (number | null)[], string][] = [
      ['SMA20', sma(closes, 20), IND_COLORS.SMA20],
      ['SMA50', sma(closes, 50), IND_COLORS.SMA50],
      ['SMA200', sma(closes, 200), IND_COLORS.SMA200],
      ['EMA9', ema(closes, 9), IND_COLORS.EMA9],
      ['EMA21', ema(closes, 21), IND_COLORS.EMA21],
    ];
    for (const [key, vals, color] of lineOverlays) {
      if (!indicators.has(key)) continue;
      const series = chart.addSeries(LineSeries, { color, lineWidth: 1, lastValueVisible: true, priceLineVisible: false });
      series.setData(candles.map((c, i) => ({ time: c.time as Time, value: vals[i] as number })).filter(d => d.value != null && !isNaN(d.value)));
    }

    // VWAP
    if (indicators.has('VWAP')) {
      const vwapVals = vwap(candles);
      const s = chart.addSeries(LineSeries, { color: IND_COLORS.VWAP, lineWidth: 1, lastValueVisible: true, priceLineVisible: false });
      s.setData(candles.map((c, i) => ({ time: c.time as Time, value: vwapVals[i] ?? NaN })).filter(d => !isNaN(d.value)));
    }

    // Keltner Channels
    if (indicators.has('KC')) {
      const kc = keltnerChannels(candles);
      const kcStyle = { lineWidth: 1 as const, color: IND_COLORS.KC, lineStyle: 2 as const, priceLineVisible: false, lastValueVisible: false };
      const kcU = chart.addSeries(LineSeries, kcStyle);
      const kcM = chart.addSeries(LineSeries, { ...kcStyle, lineStyle: 0 as const, lastValueVisible: true });
      const kcL = chart.addSeries(LineSeries, kcStyle);
      kcU.setData(candles.map((c, i) => ({ time: c.time as Time, value: kc[i].upper ?? NaN })).filter(d => !isNaN(d.value)));
      kcM.setData(candles.map((c, i) => ({ time: c.time as Time, value: kc[i].mid ?? NaN })).filter(d => !isNaN(d.value)));
      kcL.setData(candles.map((c, i) => ({ time: c.time as Time, value: kc[i].lower ?? NaN })).filter(d => !isNaN(d.value)));
    }

    // Parabolic SAR (markers on candlestick series)
    if (indicators.has('PSAR')) {
      const { sar, bullish } = parabolicSar(candles);
      const markers = candles
        .map((c, i) => sar[i] === null ? null : {
          time: c.time as Time,
          position: bullish[i] ? 'belowBar' as const : 'aboveBar' as const,
          color: bullish[i] ? UP : DOWN,
          shape: 'circle' as const,
          size: 0.4,
        })
        .filter((m): m is NonNullable<typeof m> => m !== null);
      candleSeries.setMarkers(markers);
    }

    // Pivot Points
    if (indicators.has('PIVOTS')) {
      const pivots = pivotPoints(candles);
      if (pivots) {
        const firstTime = candles[0].time as Time;
        const lastTime = candles[candles.length - 1].time as Time;
        const pivotLines: [string, number, string, number][] = [
          ['PP', pivots.pp, '#e2e8f0', 0],
          ['R1', pivots.r1, '#f87171', 2],
          ['R2', pivots.r2, '#ef4444', 2],
          ['S1', pivots.s1, '#4ade80', 2],
          ['S2', pivots.s2, '#22c55e', 2],
        ];
        for (const [title, level, color, lineStyle] of pivotLines) {
          const s = chart.addSeries(LineSeries, { color, lineWidth: 1, lineStyle: lineStyle as 0|1|2|3|4, priceLineVisible: false, lastValueVisible: true, title });
          s.setData([{ time: firstTime, value: level }, { time: lastTime, value: level }]);
        }
      }
    }

    // ── oscillator sub-panes ────────────────────────────────────────────────────
    const newPaneCharts: (IChartApi | null)[] = [null, null, null];

    activeOscillators.forEach((key, i) => {
      const el = paneRefs.current[i];
      if (!el) return;
      const isLast = i === activeOscillators.length - 1;
      const pc = createChart(el, {
        ...baseChartOpts,
        width: el.clientWidth,
        height: el.clientHeight,
        timeScale: { ...baseChartOpts.timeScale, visible: isLast },
        rightPriceScale: { borderColor: GRID, scaleMargins: { top: 0.1, bottom: 0.1 } },
      });
      newPaneCharts[i] = pc;

      switch (key) {
        case 'RSI': {
          const rsiVals = rsi(closes);
          const rs = pc.addSeries(LineSeries, { color: IND_COLORS.RSI, lineWidth: 1, lastValueVisible: true, priceLineVisible: false });
          rs.setData(candles.map((c, j) => ({ time: c.time as Time, value: rsiVals[j] ?? NaN })).filter(d => !isNaN(d.value)));
          const ob = pc.addSeries(LineSeries, { color: `${DOWN}66`, lineWidth: 1, lineStyle: 2, priceLineVisible: false, lastValueVisible: false });
          const os = pc.addSeries(LineSeries, { color: `${UP}66`, lineWidth: 1, lineStyle: 2, priceLineVisible: false, lastValueVisible: false });
          ob.setData(candles.map(c => ({ time: c.time as Time, value: 70 })));
          os.setData(candles.map(c => ({ time: c.time as Time, value: 30 })));
          break;
        }
        case 'MACD': {
          const { macdLine, signalLine, histogram: macdHist } = macd(closes);
          const ms = pc.addSeries(LineSeries, { color: '#3b82f6', lineWidth: 1, lastValueVisible: true, priceLineVisible: false });
          const ss = pc.addSeries(LineSeries, { color: '#f59e0b', lineWidth: 1, lastValueVisible: true, priceLineVisible: false });
          const hs = pc.addSeries(HistogramSeries, { priceLineVisible: false, lastValueVisible: false });
          ms.setData(candles.map((c, j) => ({ time: c.time as Time, value: macdLine[j] ?? NaN })).filter(d => !isNaN(d.value)));
          ss.setData(candles.map((c, j) => ({ time: c.time as Time, value: signalLine[j] ?? NaN })).filter(d => !isNaN(d.value)));
          hs.setData(candles.map((c, j) => ({ time: c.time as Time, value: macdHist[j] ?? NaN, color: (macdHist[j] ?? 0) >= 0 ? `${UP}88` : `${DOWN}88` })).filter(d => !isNaN(d.value)));
          break;
        }
        case 'STOCH': {
          const { k, d } = stochastic(candles);
          const ks = pc.addSeries(LineSeries, { color: IND_COLORS.STOCH, lineWidth: 1, lastValueVisible: true, priceLineVisible: false });
          const ds = pc.addSeries(LineSeries, { color: '#3b82f6', lineWidth: 1, lastValueVisible: true, priceLineVisible: false });
          const obS = pc.addSeries(LineSeries, { color: `${DOWN}55`, lineWidth: 1, lineStyle: 2, priceLineVisible: false, lastValueVisible: false });
          const osS = pc.addSeries(LineSeries, { color: `${UP}55`, lineWidth: 1, lineStyle: 2, priceLineVisible: false, lastValueVisible: false });
          ks.setData(candles.map((c, j) => ({ time: c.time as Time, value: k[j] ?? NaN })).filter(d => !isNaN(d.value)));
          ds.setData(candles.map((c, j) => ({ time: c.time as Time, value: d[j] ?? NaN })).filter(d => !isNaN(d.value)));
          obS.setData(candles.map(c => ({ time: c.time as Time, value: 80 })));
          osS.setData(candles.map(c => ({ time: c.time as Time, value: 20 })));
          break;
        }
        case 'OBV': {
          const obvVals = obv(candles);
          const os = pc.addSeries(LineSeries, { color: IND_COLORS.OBV, lineWidth: 1, lastValueVisible: true, priceLineVisible: false });
          os.setData(candles.map((c, j) => ({ time: c.time as Time, value: obvVals[j] })));
          break;
        }
        case 'ADX': {
          const { adx, diPlus, diMinus } = adxCalc(candles);
          const adxS = pc.addSeries(LineSeries, { color: IND_COLORS.ADX, lineWidth: 1.5, lastValueVisible: true, priceLineVisible: false });
          const dpS = pc.addSeries(LineSeries, { color: UP, lineWidth: 1, lastValueVisible: true, priceLineVisible: false });
          const dmS = pc.addSeries(LineSeries, { color: DOWN, lineWidth: 1, lastValueVisible: true, priceLineVisible: false });
          const refS = pc.addSeries(LineSeries, { color: '#6b7280', lineWidth: 1, lineStyle: 2, priceLineVisible: false, lastValueVisible: false });
          adxS.setData(candles.map((c, j) => ({ time: c.time as Time, value: adx[j] ?? NaN })).filter(d => !isNaN(d.value)));
          dpS.setData(candles.map((c, j) => ({ time: c.time as Time, value: diPlus[j] ?? NaN })).filter(d => !isNaN(d.value)));
          dmS.setData(candles.map((c, j) => ({ time: c.time as Time, value: diMinus[j] ?? NaN })).filter(d => !isNaN(d.value)));
          refS.setData(candles.map(c => ({ time: c.time as Time, value: 25 })));
          break;
        }
      }
    });

    paneCharts.current = newPaneCharts;

    // ── sync timescales ─────────────────────────────────────────────────────────
    const allPanes = newPaneCharts.filter((c): c is IChartApi => c !== null);
    if (allPanes.length > 0) {
      chart.timeScale().subscribeVisibleLogicalRangeChange(range => {
        if (range) allPanes.forEach(p => p.timeScale().setVisibleLogicalRange(range));
      });
      allPanes.forEach(pane => {
        pane.timeScale().subscribeVisibleLogicalRangeChange(range => {
          if (range) {
            chart.timeScale().setVisibleLogicalRange(range);
            allPanes.filter(p => p !== pane).forEach(p => p.timeScale().setVisibleLogicalRange(range));
          }
        });
      });
    }

    // ── resize observer ─────────────────────────────────────────────────────────
    const ro = new ResizeObserver(() => {
      if (mainRef.current) chart.resize(mainRef.current.clientWidth, mainRef.current.clientHeight);
      newPaneCharts.forEach((pc, i) => {
        const el = paneRefs.current[i];
        if (pc && el) pc.resize(el.clientWidth, el.clientHeight);
      });
    });
    if (mainRef.current) ro.observe(mainRef.current);

    chart.timeScale().fitContent();

    return () => {
      ro.disconnect();
      chart.remove();
      paneCharts.current.forEach(c => c?.remove());
      mainChart.current = null;
      paneCharts.current = [null, null, null];
    };
  }, [candles, indicators]);

  // ── ticker submit ─────────────────────────────────────────────────────────────

  const submitTicker = () => {
    const t = inputVal.trim().toUpperCase();
    if (t && t !== ticker) setTicker(t);
  };

  return (
    <div className="flex flex-col h-full bg-[#0a0a0f] text-foreground overflow-hidden">
      {/* ── toolbar ── */}
      <div className="flex items-start gap-2 px-3 py-1.5 border-b border-[#1a1a2e] bg-[#0d0d14] flex-wrap shrink-0">
        {/* Ticker */}
        <div className="flex items-center border border-[#1a1a2e] bg-[#0a0a0f]">
          <span className="text-[9px] font-mono text-muted-foreground px-2">SYM</span>
          <input
            value={inputVal}
            onChange={e => setInputVal(e.target.value.toUpperCase())}
            onKeyDown={e => e.key === 'Enter' && submitTicker()}
            onBlur={submitTicker}
            className="bg-transparent text-accent text-[11px] font-mono font-bold w-20 py-0.5 pr-2 outline-none uppercase"
            spellCheck={false} autoComplete="off"
          />
        </div>

        {/* Timeframe */}
        <div className="flex border border-[#1a1a2e]">
          {INTERVALS.map((iv, i) => (
            <button key={iv.label} onClick={() => setIntervalIdx(i)}
              className={`px-2 py-0.5 text-[8px] font-mono border-r border-[#1a1a2e] last:border-r-0 transition-colors ${i === intervalIdx ? 'bg-accent text-black font-bold' : 'text-muted-foreground hover:text-foreground hover:bg-[#1a1a2e]'}`}>
              {iv.label}
            </button>
          ))}
        </div>

        {/* OVERLAYS group */}
        <div className="flex items-center gap-1 flex-wrap">
          <span className="text-[7px] font-mono text-muted-foreground border-r border-[#1a1a2e] pr-1.5 mr-0.5 self-stretch flex items-center">OVERLAYS</span>
          {OVERLAY_KEYS.map(k => {
            const isVwapNA = k === 'VWAP' && !isIntradayInterval && indicators.has(k);
            return (
              <button key={k} onClick={() => toggleIndicator(k)}
                title={k === 'VWAP' && !isIntradayInterval ? 'VWAP is session-cumulative — not meaningful on daily+ intervals' : undefined}
                className={`px-2 py-0.5 text-[8px] font-mono border transition-colors ${indicators.has(k) ? 'font-bold' : 'border-[#1a1a2e] text-muted-foreground hover:text-foreground hover:bg-[#1a1a2e]'}`}
                style={indicators.has(k) ? { borderColor: IND_COLORS[k], color: IND_COLORS[k] } : {}}>
                {IND_LABELS[k]}{isVwapNA ? ' !' : ''}
              </button>
            );
          })}
        </div>

        {/* OSCILLATORS group */}
        <div className="flex items-center gap-1 flex-wrap">
          <span className="text-[7px] font-mono text-muted-foreground border-r border-[#1a1a2e] pr-1.5 mr-0.5 self-stretch flex items-center">OSC</span>
          {OSCILLATOR_KEYS.map(k => {
            const isActive = indicators.has(k);
            const isLocked = !isActive && activeOscCount >= MAX_OSCILLATORS;
            return (
              <button key={k} onClick={() => !isLocked && toggleIndicator(k)}
                title={isLocked ? 'Maximum 3 oscillator panes' : undefined}
                className={`px-2 py-0.5 text-[8px] font-mono border transition-colors ${isLocked ? 'border-[#1a1a2e] text-muted-foreground/30 cursor-not-allowed' : isActive ? 'font-bold' : 'border-[#1a1a2e] text-muted-foreground hover:text-foreground hover:bg-[#1a1a2e]'}`}
                style={!isLocked && isActive ? { borderColor: IND_COLORS[k], color: IND_COLORS[k] } : {}}>
                {IND_LABELS[k]}
              </button>
            );
          })}
          {activeOscCount >= MAX_OSCILLATORS && <span className="text-[7px] font-mono text-amber-500 ml-1">MAX 3</span>}
        </div>

        <div className="ml-auto flex items-center gap-2">
          {loading && <span className="text-[8px] font-mono text-muted-foreground animate-pulse">Loading…</span>}
          {synthetic && !loading && <span className="text-[8px] font-mono text-amber-500">MODEL DATA</span>}
        </div>
      </div>

      {/* ── OHLCV bar ── */}
      <OHLCVBar info={ohlcvInfo} ticker={ticker} />

      {/* ── chart panes ── */}
      <div className="flex-1 min-h-0 flex flex-col">
        <div ref={mainRef} className="flex-1 min-h-0" />

        {activeOscillators.map((key, i) => (
          <div key={key} className="shrink-0 border-t border-[#1a1a2e] relative" style={{ height: 120 }}>
            <span className="absolute top-1 left-2 text-[8px] font-mono z-10" style={{ color: IND_COLORS[key] }}>{IND_LABELS[key]}</span>
            <div ref={el => { paneRefs.current[i] = el; }} className="w-full h-full" />
          </div>
        ))}
      </div>

      {/* ── footer ── */}
      <div className="flex items-center px-3 border-t border-[#1a1a2e] h-[14px] shrink-0">
        <span className="text-[7px] font-mono text-muted-foreground">lwc v5 · SMA · EMA · BB · VWAP · KC · PSAR · PIVOTS · RSI · MACD · STOCH · OBV · ADX</span>
        <span className="ml-auto text-[7px] font-mono text-muted-foreground">{candles.length} bars · {INTERVALS[intervalIdx].api}</span>
      </div>
    </div>
  );
}
