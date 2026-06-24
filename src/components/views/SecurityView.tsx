import { useEffect, useRef, useState, useCallback } from 'react';
import {
  createChart,
  CandlestickSeries,
  HistogramSeries,
  LineSeries,
  type IChartApi,
  type ISeriesApi,
  type CandlestickSeriesPartialOptions,
  type HistogramSeriesPartialOptions,
  type LineSeriesPartialOptions,
} from 'lightweight-charts';
import { RefreshCw, TrendingUp, TrendingDown, Minus, ExternalLink } from 'lucide-react';
import { useSecurityData, type ChartRange, type OHLCVCandle, type BBPoint, type MACDPoint, type IndicatorPoint } from '@/hooks/useSecurityData';
import { useTrades } from '@/contexts/TradeContext';
import DesTab from '@/components/security/DesTab';
import FinancialsTab from '@/components/security/FinancialsTab';
import EstimatesTab from '@/components/security/EstimatesTab';
import AnalystTab from '@/components/security/AnalystTab';
import OwnTab from '@/components/security/OwnTab';
import CompTab from '@/components/security/CompTab';
import InsTab from '@/components/security/InsTab';
import AiTab from '@/components/security/AiTab';

// Terminal theme colors (matches CSS variables)
const CHART_THEME = {
  background: '#000000',
  text: '#c8d3df',
  grid: '#141414',
  border: '#141414',
  upColor: '#38a838',      // hsl(120,60%,45%)
  downColor: '#d63333',    // hsl(0,72%,51%)
  wickUp: '#38a838',
  wickDown: '#d63333',
  volume: '#1f2937',
  sma20: '#f97316',        // orange (accent)
  sma50: '#60a5fa',        // blue
  bbUpper: '#818cf8',
  bbMid: '#6366f1',
  bbLower: '#818cf8',
  rsi: '#a78bfa',
  macdLine: '#60a5fa',
  macdSignal: '#fb923c',
  macdHistUp: '#38a838',
  macdHistDown: '#d63333',
};

const RANGES: ChartRange[] = ['1W', '1M', '3M', '6M', '1Y', '5Y'];

type OverlayKey = 'sma20' | 'sma50' | 'bb' | 'rsi' | 'macd';

function calcSMA(candles: OHLCVCandle[], period: number): { time: string; value: number }[] {
  const out: { time: string; value: number }[] = [];
  for (let i = period - 1; i < candles.length; i++) {
    const sum = candles.slice(i - period + 1, i + 1).reduce((a, c) => a + c.close, 0);
    out.push({ time: candles[i].time, value: sum / period });
  }
  return out;
}

function fmt(n: number | null | undefined, decimals = 2): string {
  if (n == null || !isFinite(n)) return '—';
  return n.toLocaleString('en-US', { minimumFractionDigits: decimals, maximumFractionDigits: decimals });
}

function fmtVol(n: number | null | undefined): string {
  if (n == null) return '—';
  if (n >= 1e9) return `${(n / 1e9).toFixed(1)}B`;
  if (n >= 1e6) return `${(n / 1e6).toFixed(1)}M`;
  if (n >= 1e3) return `${(n / 1e3).toFixed(0)}K`;
  return String(n);
}

function fmtPct(n: number | null | undefined): string {
  if (n == null || !isFinite(n)) return '—';
  return `${n >= 0 ? '+' : ''}${n.toFixed(2)}%`;
}

type BottomTab = 'news' | 'trades';
type MainTab = 'gp' | 'des' | 'fa' | 'ee' | 'anr' | 'own' | 'comp' | 'ins' | 'ai';

const MAIN_TABS: { id: MainTab; label: string; code: string }[] = [
  { id: 'gp',   label: 'Graph',       code: 'GP'   },
  { id: 'des',  label: 'Description', code: 'DES'  },
  { id: 'fa',   label: 'Financials',  code: 'FA'   },
  { id: 'ee',   label: 'Estimates',   code: 'EE'   },
  { id: 'anr',  label: 'Analyst',     code: 'ANR'  },
  { id: 'own',  label: 'Ownership',   code: 'OWN'  },
  { id: 'comp', label: 'Peers',       code: 'COMP' },
  { id: 'ins',  label: 'Insiders',    code: 'INS'  },
  { id: 'ai',   label: 'AI Analyst',  code: 'AI'   },
];

interface Props {
  ticker: string;
}

export default function SecurityView({ ticker }: Props) {
  const [range, setRange] = useState<ChartRange>('3M');
  const [activeOverlays, setActiveOverlays] = useState<Set<OverlayKey>>(new Set(['sma20', 'sma50']));
  const [bottomTab, setBottomTab] = useState<BottomTab>('news');
  const [mainTab, setMainTab] = useState<MainTab>('gp');

  const { overview, chart, indicators, fundamentals, peers, fundamentalsLoading, peersLoading, overviewLoading, chartLoading, error, refetchChart, refetchFundamentals } = useSecurityData(ticker, range);
  const { trades } = useTrades();
  const tickerTrades = trades.filter(t => t.symbol.toUpperCase() === ticker.toUpperCase());

  // --- Chart refs ---
  const containerRef = useRef<HTMLDivElement>(null);
  const chartRef = useRef<IChartApi | null>(null);
  const candleRef = useRef<ISeriesApi<'Candlestick'> | null>(null);
  const volRef = useRef<ISeriesApi<'Histogram'> | null>(null);
  const sma20Ref = useRef<ISeriesApi<'Line'> | null>(null);
  const sma50Ref = useRef<ISeriesApi<'Line'> | null>(null);
  const bbUpperRef = useRef<ISeriesApi<'Line'> | null>(null);
  const bbMidRef = useRef<ISeriesApi<'Line'> | null>(null);
  const bbLowerRef = useRef<ISeriesApi<'Line'> | null>(null);
  const rsiRef = useRef<ISeriesApi<'Line'> | null>(null);
  const macdRef = useRef<ISeriesApi<'Histogram'> | null>(null);
  const macdLineRef = useRef<ISeriesApi<'Line'> | null>(null);
  const macdSignalRef = useRef<ISeriesApi<'Line'> | null>(null);

  const toggleOverlay = (key: OverlayKey) => {
    setActiveOverlays(prev => {
      const next = new Set(prev);
      if (next.has(key)) next.delete(key); else next.add(key);
      return next;
    });
  };

  // --- Init chart ---
  useEffect(() => {
    if (!containerRef.current) return;

    const c = createChart(containerRef.current, {
      layout: {
        background: { color: CHART_THEME.background },
        textColor: CHART_THEME.text,
        fontSize: 10,
        fontFamily: 'ui-monospace, monospace',
      },
      grid: {
        vertLines: { color: CHART_THEME.grid },
        horzLines: { color: CHART_THEME.grid },
      },
      crosshair: { mode: 1 },
      timeScale: {
        borderColor: CHART_THEME.border,
        timeVisible: true,
        secondsVisible: false,
      },
      rightPriceScale: { borderColor: CHART_THEME.border },
      width: containerRef.current.clientWidth,
      height: containerRef.current.clientHeight,
    });

    const candles = c.addSeries(CandlestickSeries, {
      upColor: CHART_THEME.upColor,
      downColor: CHART_THEME.downColor,
      borderUpColor: CHART_THEME.upColor,
      borderDownColor: CHART_THEME.downColor,
      wickUpColor: CHART_THEME.wickUp,
      wickDownColor: CHART_THEME.wickDown,
    } as CandlestickSeriesPartialOptions);

    const vol = c.addSeries(HistogramSeries, {
      color: CHART_THEME.volume,
      priceFormat: { type: 'volume' },
      priceScaleId: 'vol',
    } as HistogramSeriesPartialOptions);
    c.priceScale('vol').applyOptions({ scaleMargins: { top: 0.85, bottom: 0 } });

    const sma20 = c.addSeries(LineSeries, {
      color: CHART_THEME.sma20,
      lineWidth: 1,
      priceLineVisible: false,
      lastValueVisible: false,
      crosshairMarkerVisible: false,
    } as LineSeriesPartialOptions);

    const sma50 = c.addSeries(LineSeries, {
      color: CHART_THEME.sma50,
      lineWidth: 1,
      priceLineVisible: false,
      lastValueVisible: false,
      crosshairMarkerVisible: false,
    } as LineSeriesPartialOptions);

    const bbUpper = c.addSeries(LineSeries, {
      color: CHART_THEME.bbUpper,
      lineWidth: 1,
      lineStyle: 2,
      priceLineVisible: false,
      lastValueVisible: false,
      crosshairMarkerVisible: false,
    } as LineSeriesPartialOptions);
    const bbMid = c.addSeries(LineSeries, {
      color: CHART_THEME.bbMid,
      lineWidth: 1,
      lineStyle: 2,
      priceLineVisible: false,
      lastValueVisible: false,
      crosshairMarkerVisible: false,
    } as LineSeriesPartialOptions);
    const bbLower = c.addSeries(LineSeries, {
      color: CHART_THEME.bbLower,
      lineWidth: 1,
      lineStyle: 2,
      priceLineVisible: false,
      lastValueVisible: false,
      crosshairMarkerVisible: false,
    } as LineSeriesPartialOptions);

    // RSI in pane 1
    const rsi = c.addSeries(LineSeries, {
      color: CHART_THEME.rsi,
      lineWidth: 1,
      priceLineVisible: false,
      lastValueVisible: true,
    } as LineSeriesPartialOptions, 1);

    // MACD in pane 2
    const macdH = c.addSeries(HistogramSeries, {
      priceLineVisible: false,
      lastValueVisible: false,
    } as HistogramSeriesPartialOptions, 2);
    const macdL = c.addSeries(LineSeries, {
      color: CHART_THEME.macdLine,
      lineWidth: 1,
      priceLineVisible: false,
      lastValueVisible: false,
    } as LineSeriesPartialOptions, 2);
    const macdS = c.addSeries(LineSeries, {
      color: CHART_THEME.macdSignal,
      lineWidth: 1,
      priceLineVisible: false,
      lastValueVisible: false,
    } as LineSeriesPartialOptions, 2);

    chartRef.current = c;
    candleRef.current = candles;
    volRef.current = vol;
    sma20Ref.current = sma20;
    sma50Ref.current = sma50;
    bbUpperRef.current = bbUpper;
    bbMidRef.current = bbMid;
    bbLowerRef.current = bbLower;
    rsiRef.current = rsi;
    macdRef.current = macdH;
    macdLineRef.current = macdL;
    macdSignalRef.current = macdS;

    const ro = new ResizeObserver(() => {
      if (containerRef.current) {
        c.applyOptions({
          width: containerRef.current.clientWidth,
          height: containerRef.current.clientHeight,
        });
      }
    });
    ro.observe(containerRef.current);

    return () => {
      ro.disconnect();
      c.remove();
    };
  }, []); // only once

  // --- Load chart data ---
  useEffect(() => {
    if (!chart?.candles.length) return;
    const c = chart.candles;

    candleRef.current?.setData(c.map(v => ({
      time: v.time as any,
      open: v.open,
      high: v.high,
      low: v.low,
      close: v.close,
    })));

    volRef.current?.setData(c.map(v => ({
      time: v.time as any,
      value: v.volume,
      color: v.close >= v.open ? `${CHART_THEME.upColor}66` : `${CHART_THEME.downColor}66`,
    })));

    sma20Ref.current?.setData(calcSMA(c, 20).map(v => ({ time: v.time as any, value: v.value })));
    sma50Ref.current?.setData(calcSMA(c, 50).map(v => ({ time: v.time as any, value: v.value })));

    if (indicators) {
      const bb = indicators.bbands.filter((v): v is BBPoint & { upper_band: number; middle_band: number; lower_band: number } =>
        v.upper_band != null && v.middle_band != null && v.lower_band != null
      );
      bbUpperRef.current?.setData(bb.map(v => ({ time: v.time as any, value: v.upper_band })));
      bbMidRef.current?.setData(bb.map(v => ({ time: v.time as any, value: v.middle_band })));
      bbLowerRef.current?.setData(bb.map(v => ({ time: v.time as any, value: v.lower_band })));

      const rsiData = indicators.rsi.filter((v): v is IndicatorPoint & { rsi: number } => v.rsi != null);
      rsiRef.current?.setData(rsiData.map(v => ({ time: v.time as any, value: v.rsi })));

      const macdData = indicators.macd.filter((v): v is MACDPoint & { macd: number; macd_signal: number; macd_hist: number } =>
        v.macd != null && v.macd_signal != null && v.macd_hist != null
      );
      macdRef.current?.setData(macdData.map(v => ({
        time: v.time as any,
        value: v.macd_hist,
        color: v.macd_hist >= 0 ? CHART_THEME.macdHistUp : CHART_THEME.macdHistDown,
      })));
      macdLineRef.current?.setData(macdData.map(v => ({ time: v.time as any, value: v.macd })));
      macdSignalRef.current?.setData(macdData.map(v => ({ time: v.time as any, value: v.macd_signal })));
    }

    chartRef.current?.timeScale().fitContent();
  }, [chart, indicators]);

  // --- Overlay visibility ---
  useEffect(() => {
    sma20Ref.current?.applyOptions({ visible: activeOverlays.has('sma20') } as any);
    sma50Ref.current?.applyOptions({ visible: activeOverlays.has('sma50') } as any);
    bbUpperRef.current?.applyOptions({ visible: activeOverlays.has('bb') } as any);
    bbMidRef.current?.applyOptions({ visible: activeOverlays.has('bb') } as any);
    bbLowerRef.current?.applyOptions({ visible: activeOverlays.has('bb') } as any);
    rsiRef.current?.applyOptions({ visible: activeOverlays.has('rsi') } as any);
    macdRef.current?.applyOptions({ visible: activeOverlays.has('macd') } as any);
    macdLineRef.current?.applyOptions({ visible: activeOverlays.has('macd') } as any);
    macdSignalRef.current?.applyOptions({ visible: activeOverlays.has('macd') } as any);
  }, [activeOverlays]);

  const openNews = useCallback(() => {
    window.dispatchEvent(new CustomEvent('lovable:news-args', {
      detail: { scope: 'ticker', value: ticker },
    }));
    setBottomTab('news');
  }, [ticker]);

  const isUp = (overview?.changePct ?? 0) >= 0;

  // 52w position bar width
  const fiftyTwoRange = overview
    ? ((overview.price ?? 0) - (overview.fiftyTwoWeekLow ?? 0)) /
      Math.max(1, (overview.fiftyTwoWeekHigh ?? 0) - (overview.fiftyTwoWeekLow ?? 0))
    : 0;

  return (
    <div className="flex flex-col h-full font-mono text-xs overflow-hidden">
      {/* --Header -- */}
      <div className="flex items-center gap-3 px-3 py-2 border-b border-border bg-surface-elevated shrink-0 flex-wrap">
        <div className="flex items-center gap-2">
          <span className="text-accent font-bold text-sm tracking-widest">{ticker}</span>
          <span className="text-[9px] text-muted-foreground uppercase">US Equity</span>
        </div>
        {overview && (
          <>
            <span className="text-muted-foreground">|</span>
            <span className="text-foreground font-semibold truncate max-w-[180px]">{overview.name}</span>
            <span className="text-muted-foreground">|</span>
            <span className={`text-base font-bold tabular-nums ${isUp ? 'text-positive' : 'text-negative'}`}>
              {overview.currency === 'USD' ? '$' : ''}{fmt(overview.price)}
            </span>
            <span className={`flex items-center gap-1 text-[11px] font-bold tabular-nums ${isUp ? 'text-positive' : 'text-negative'}`}>
              {isUp ? <TrendingUp size={12} /> : overview.changePct === 0 ? <Minus size={12} /> : <TrendingDown size={12} />}
              {fmt(overview.change)} ({fmtPct(overview.changePct)})
            </span>
            <span className={`text-[9px] px-1.5 py-0.5 font-bold uppercase ${
              overview.isMarketOpen ? 'bg-positive/20 text-positive' : 'bg-muted-foreground/20 text-muted-foreground'
            }`}>
              {overview.isMarketOpen ? 'OPEN' : 'CLOSED'}
            </span>
          </>
        )}
        {overviewLoading && !overview && (
          <span className="text-muted-foreground text-[10px] animate-pulse">Loading {ticker}...</span>
        )}
        {error && <span className="text-negative text-[10px]">{error}</span>}
        <div className="ml-auto flex items-center gap-2">
          <span className="text-[9px] text-muted-foreground">{overview?.exchange}</span>
          <button
            onClick={() => { refetchChart(); refetchFundamentals(); }}
            className="text-muted-foreground hover:text-accent transition-colors"
            title="Refresh all data"
          >
            <RefreshCw size={11} className={chartLoading || fundamentalsLoading ? 'animate-spin' : ''} />
          </button>
        </div>
      </div>

      {/* --Bloomberg-style tab bar -- */}
      <div className="flex items-stretch border-b border-border bg-surface-deep shrink-0">
        {MAIN_TABS.map(tab => (
          <button
            key={tab.id}
            onClick={() => setMainTab(tab.id)}
            className={`px-3 py-1.5 text-[9px] font-bold uppercase tracking-widest border-r border-border transition-colors flex items-center gap-1.5 ${
              mainTab === tab.id
                ? 'bg-accent text-accent-foreground'
                : 'text-muted-foreground hover:text-foreground hover:bg-surface-elevated'
            }`}
          >
            <span className="opacity-60">{tab.code}</span>
            <span>{tab.label}</span>
          </button>
        ))}
        {((mainTab !== 'gp' && mainTab !== 'ai' && fundamentalsLoading) || (mainTab === 'comp' && peersLoading)) && (
          <span className="ml-auto pr-3 flex items-center text-[9px] text-muted-foreground animate-pulse">Loading...</span>
        )}
      </div>

      {/* --Non-GP tabs (DES / FA / EE / ANR) -- */}
      {mainTab !== 'gp' && (
        <div className="flex-1 min-h-0 overflow-hidden">
          {!fundamentals && fundamentalsLoading && (
            <div className="flex items-center justify-center h-full text-muted-foreground text-[10px] animate-pulse">
              Fetching fundamental data…
            </div>
          )}
          {!fundamentals && !fundamentalsLoading && (
            <div className="flex flex-col items-center justify-center h-full gap-2 text-muted-foreground text-[10px]">
              <span>Fundamental data unavailable for {ticker}</span>
              <button onClick={refetchFundamentals} className="text-accent hover:underline">Retry</button>
            </div>
          )}
          {fundamentals && mainTab === 'des' && (
            <DesTab fundamentals={fundamentals} overview={overview} />
          )}
          {fundamentals && mainTab === 'fa' && (
            <FinancialsTab fundamentals={fundamentals} />
          )}
          {fundamentals && mainTab === 'ee' && (
            <EstimatesTab fundamentals={fundamentals} />
          )}
          {fundamentals && mainTab === 'anr' && (
            <AnalystTab fundamentals={fundamentals} currentPrice={overview?.price} />
          )}
          {fundamentals && mainTab === 'own' && (
            <OwnTab fundamentals={fundamentals} />
          )}
          {mainTab === 'comp' && (
            <CompTab ticker={ticker} peers={peers} loading={peersLoading} />
          )}
          {fundamentals && mainTab === 'ins' && (
            <InsTab fundamentals={fundamentals} />
          )}
          {mainTab === 'ai' && (
            <AiTab ticker={ticker} fundamentals={fundamentals} overview={overview} />
          )}
        </div>
      )}

      {/* --Body -- */}
      {mainTab === 'gp' && <>
      <div className="flex flex-1 min-h-0 overflow-hidden">
        {/* Chart column */}
        <div className="flex flex-col flex-1 min-w-0 border-r border-border">
          {/* Toolbar */}
          <div className="flex items-center gap-3 px-2 py-1 border-b border-border shrink-0 bg-surface-deep">
            <div className="flex items-center gap-0.5">
              {RANGES.map(r => (
                <button
                  key={r}
                  onClick={() => setRange(r)}
                  className={`px-1.5 py-0.5 text-[9px] font-bold uppercase transition-colors ${
                    range === r ? 'bg-accent text-accent-foreground' : 'text-muted-foreground hover:text-foreground'
                  }`}
                >
                  {r}
                </button>
              ))}
            </div>
            <div className="h-3 w-px bg-border" />
            <div className="flex items-center gap-0.5">
              {([
                { key: 'sma20' as OverlayKey, label: 'SMA20', color: CHART_THEME.sma20 },
                { key: 'sma50' as OverlayKey, label: 'SMA50', color: CHART_THEME.sma50 },
                { key: 'bb' as OverlayKey, label: 'BB', color: CHART_THEME.bbUpper },
                { key: 'rsi' as OverlayKey, label: 'RSI', color: CHART_THEME.rsi },
                { key: 'macd' as OverlayKey, label: 'MACD', color: CHART_THEME.macdLine },
              ] as const).map(({ key, label, color }) => (
                <button
                  key={key}
                  onClick={() => toggleOverlay(key)}
                  className={`px-1.5 py-0.5 text-[9px] font-bold uppercase border transition-colors ${
                    activeOverlays.has(key)
                      ? 'border-transparent text-black'
                      : 'border-border text-muted-foreground hover:text-foreground'
                  }`}
                  style={activeOverlays.has(key) ? { backgroundColor: color } : {}}
                >
                  {label}
                </button>
              ))}
            </div>
          </div>

          {/* Chart canvas */}
          <div ref={containerRef} className="flex-1 min-h-0" />
        </div>

        {/* Stats panel */}
        <div className="w-52 shrink-0 flex flex-col border-l border-border overflow-y-auto bg-surface-deep">
          <div className="px-2 py-1.5 border-b border-border bg-surface-elevated">
            <span className="text-[9px] text-accent font-bold uppercase tracking-widest">Quote</span>
          </div>
          {overview ? (
            <div className="px-2 py-2 space-y-2">
              <StatRow label="Price" value={`${overview.currency === 'USD' ? '$' : ''}${fmt(overview.price)}`} />
              <StatRow
                label="Change"
                value={`${fmtPct(overview.changePct)}`}
                valueClass={isUp ? 'text-positive' : 'text-negative'}
              />
              <StatRow label="Open" value={`$${fmt(overview.open)}`} />
              <StatRow label="High" value={`$${fmt(overview.high)}`} />
              <StatRow label="Low" value={`$${fmt(overview.low)}`} />
              <StatRow label="Prev Close" value={`$${fmt(overview.prevClose)}`} />
              <div className="border-t border-border pt-2 mt-2 space-y-2">
                <StatRow label="Volume" value={fmtVol(overview.volume)} />
                <StatRow label="Avg Volume" value={fmtVol(overview.avgVolume)} />
              </div>
              <div className="border-t border-border pt-2 mt-2">
                <div className="flex justify-between text-[9px] text-muted-foreground mb-1">
                  <span>52W Low</span>
                  <span>52W High</span>
                </div>
                <div className="h-1 bg-surface-elevated rounded-full overflow-hidden">
                  <div
                    className="h-full bg-accent rounded-full"
                    style={{ width: `${Math.min(100, Math.max(0, fiftyTwoRange * 100)).toFixed(0)}%` }}
                  />
                </div>
                <div className="flex justify-between text-[9px] text-muted-foreground mt-1">
                  <span>${fmt(overview.fiftyTwoWeekLow)}</span>
                  <span>${fmt(overview.fiftyTwoWeekHigh)}</span>
                </div>
              </div>
              <div className="border-t border-border pt-2 mt-2 space-y-2">
                <StatRow label="Exchange" value={overview.exchange || '—'} />
                <StatRow label="Currency" value={overview.currency || '—'} />
              </div>
            </div>
          ) : (
            <div className="px-2 py-4 text-muted-foreground text-[10px] text-center">
              {overviewLoading ? 'Loading...' : 'No data'}
            </div>
          )}

          {/* Indicator legend */}
          {activeOverlays.size > 0 && (
            <div className="px-2 py-1.5 border-t border-border mt-auto">
              <div className="text-[9px] text-accent font-bold uppercase tracking-widest mb-1">Overlays</div>
              <div className="space-y-0.5">
                {activeOverlays.has('sma20') && <LegendDot color={CHART_THEME.sma20} label="SMA 20" />}
                {activeOverlays.has('sma50') && <LegendDot color={CHART_THEME.sma50} label="SMA 50" />}
                {activeOverlays.has('bb') && <LegendDot color={CHART_THEME.bbUpper} label="Bollinger Bands (20)" />}
                {activeOverlays.has('rsi') && <LegendDot color={CHART_THEME.rsi} label="RSI 14" />}
                {activeOverlays.has('macd') && <LegendDot color={CHART_THEME.macdLine} label="MACD (12/26/9)" />}
              </div>
            </div>
          )}
        </div>
      </div>
      {/* -- Bottom panel -- */}
      <div className="shrink-0 border-t border-border" style={{ height: '200px' }}>
        <div className="flex border-b border-border bg-surface-elevated">
          {(['news', 'trades'] as BottomTab[]).map(tab => (
            <button
              key={tab}
              onClick={() => tab === 'news' ? openNews() : setBottomTab(tab)}
              className={`px-3 py-1.5 text-[10px] font-bold uppercase tracking-widest border-r border-border transition-colors ${
                bottomTab === tab ? 'bg-accent text-accent-foreground' : 'text-muted-foreground hover:text-foreground'
              }`}
            >
              {tab === 'news' ? 'News' : `Journal (${tickerTrades.length})`}
            </button>
          ))}
        </div>
        <div className="overflow-y-auto h-[calc(100%-28px)] px-2 py-1">
          {bottomTab === 'news' && (
            <div className="flex items-center justify-center h-full gap-2 text-muted-foreground text-[10px]">
              <ExternalLink size={12} />
              <button
                onClick={openNews}
                className="hover:text-accent underline"
              >
                Open {ticker} news in News Terminal
              </button>
            </div>
          )}
          {bottomTab === 'trades' && (
            tickerTrades.length === 0 ? (
              <div className="flex items-center justify-center h-full text-muted-foreground text-[10px]">
                No journal trades for {ticker}
              </div>
            ) : (
              <table className="w-full text-[10px]">
                <thead>
                  <tr className="text-muted-foreground border-b border-border">
                    <th className="text-left py-0.5 pr-2 font-normal">Date</th>
                    <th className="text-left py-0.5 pr-2 font-normal">Side</th>
                    <th className="text-right py-0.5 pr-2 font-normal">Entry</th>
                    <th className="text-right py-0.5 pr-2 font-normal">Exit</th>
                    <th className="text-right py-0.5 font-normal">P&L</th>
                  </tr>
                </thead>
                <tbody>
                  {tickerTrades.slice(0, 20).map(t => (
                    <tr key={t.id} className="border-b border-border/50 hover:bg-surface-elevated">
                      <td className="py-0.5 pr-2 text-muted-foreground">{t.date}</td>
                      <td className={`py-0.5 pr-2 font-bold ${t.side === 'LONG' || t.side === 'CALL' ? 'text-positive' : 'text-negative'}`}>
                        {t.side}
                      </td>
                      <td className="py-0.5 pr-2 text-right tabular-nums">${fmt(t.entry)}</td>
                      <td className="py-0.5 pr-2 text-right tabular-nums">${fmt(t.exit)}</td>
                      <td className={`py-0.5 text-right tabular-nums font-bold ${t.pnl >= 0 ? 'text-positive' : 'text-negative'}`}>
                        {t.pnl >= 0 ? '+' : ''}{fmt(t.pnl)}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            )
          )}
        </div>
      </div>
      </>}
    </div>
  );
}

function StatRow({ label, value, valueClass = 'text-foreground' }: { label: string; value: string; valueClass?: string }) {
  return (
    <div className="flex items-center justify-between gap-2">
      <span className="text-[9px] text-muted-foreground shrink-0">{label}</span>
      <span className={`text-[10px] font-bold tabular-nums ${valueClass}`}>{value}</span>
    </div>
  );
}

function LegendDot({ color, label }: { color: string; label: string }) {
  return (
    <div className="flex items-center gap-1.5">
      <div className="w-3 h-0.5 rounded-full shrink-0" style={{ backgroundColor: color }} />
      <span className="text-[9px] text-muted-foreground">{label}</span>
    </div>
  );
}
