import { useEffect, useState } from 'react';
import { Timeframe, RangeKey, defaultRangeFor } from './fxSeries';

export interface ChartCfg {
  timeframe: Timeframe;
  range: RangeKey;
  type: 'candle' | 'line' | 'area';
  ema20: boolean;
  ema50: boolean;
  ema200: boolean;
  bb: boolean;
  rsi: boolean;
  macd: boolean;
}

const DEFAULT: ChartCfg = {
  timeframe: '1D',
  range: '1Y',
  type: 'candle',
  ema20: false,
  ema50: false,
  ema200: false,
  bb: false,
  rsi: false,
  macd: false,
};

export function useFxChartConfig(symbol: string, override?: Partial<ChartCfg>) {
  const key = `fxchart:${symbol}:cfg:v1`;
  const [cfg, setCfg] = useState<ChartCfg>(() => {
    try {
      const raw = localStorage.getItem(key);
      if (raw) return { ...DEFAULT, ...override, ...JSON.parse(raw) };
    } catch {}
    return { ...DEFAULT, ...override };
  });
  useEffect(() => {
    try { localStorage.setItem(key, JSON.stringify(cfg)); } catch {}
  }, [cfg, key]);

  const update = (patch: Partial<ChartCfg>) => setCfg(c => {
    const next = { ...c, ...patch };
    if (patch.timeframe && !patch.range) next.range = defaultRangeFor(patch.timeframe);
    return next;
  });

  return [cfg, update] as const;
}
