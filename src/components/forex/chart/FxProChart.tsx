// Toolbar + canvas wrapper. Supports inline expand and full-screen modal.
import { useMemo, useState, useEffect } from 'react';
import { Maximize2, Minimize2, Expand, X, ChevronDown } from 'lucide-react';
import FxCandleCanvas from './FxCandleCanvas';
import { useFxChartConfig, ChartCfg } from './useFxChartConfig';
import { generateSeries, Timeframe, RangeKey, TIMEFRAMES, RANGES } from './fxSeries';

interface Props {
  symbol: string;
  height?: number;
  digits?: number;
  initialCfg?: Partial<ChartCfg>;
  title?: string;
  /** Hide the expand controls (used when already inside modal). */
  hideExpand?: boolean;
}

const INDICATORS: { key: keyof ChartCfg; label: string }[] = [
  { key: 'ema20', label: 'EMA 20' },
  { key: 'ema50', label: 'EMA 50' },
  { key: 'ema200', label: 'EMA 200' },
  { key: 'bb', label: 'BB 20·2' },
  { key: 'rsi', label: 'RSI 14' },
  { key: 'macd', label: 'MACD' },
];

export default function FxProChart({ symbol, height = 320, digits = 4, initialCfg, title, hideExpand = false }: Props) {
  const [cfg, update] = useFxChartConfig(symbol, initialCfg);
  const [inlineExpanded, setInlineExpanded] = useState(false);
  const [fullscreen, setFullscreen] = useState(false);
  const [indOpen, setIndOpen] = useState(false);

  const data = useMemo(() => generateSeries(symbol, cfg.timeframe, cfg.range), [symbol, cfg.timeframe, cfg.range]);

  useEffect(() => {
    if (!fullscreen) return;
    const h = (e: KeyboardEvent) => { if (e.key === 'Escape') setFullscreen(false); };
    window.addEventListener('keydown', h);
    return () => window.removeEventListener('keydown', h);
  }, [fullscreen]);

  const effHeight = inlineExpanded ? Math.max(height, Math.floor(window.innerHeight * 0.7)) : height;

  const chrome = (chartHeight: number, inModal: boolean) => (
    <>
      {/* Toolbar */}
      <div className="flex items-center gap-1.5 border-b border-border bg-surface-deep px-2 h-6 flex-shrink-0 text-[10px] font-mono uppercase tracking-wider overflow-x-auto">
        <span className="text-accent font-bold">{symbol}</span>
        {title && <span className="text-muted-foreground">{title}</span>}
        <span className="text-muted-foreground/30">|</span>
        {/* Chart type */}
        {(['candle', 'line', 'area'] as const).map(t => (
          <button key={t} onClick={() => update({ type: t })}
            className={`px-1 py-0.5 border-b transition-colors ${cfg.type === t ? 'text-accent border-accent' : 'text-muted-foreground border-transparent hover:text-foreground'}`}>
            {t === 'candle' ? 'CDL' : t === 'line' ? 'LN' : 'AR'}
          </button>
        ))}
        <span className="text-muted-foreground/30">|</span>
        {/* Timeframe */}
        {TIMEFRAMES.map(tf => (
          <button key={tf} onClick={() => update({ timeframe: tf })}
            className={`px-1 py-0.5 border-b transition-colors ${cfg.timeframe === tf ? 'text-accent border-accent' : 'text-muted-foreground border-transparent hover:text-foreground'}`}>
            {tf}
          </button>
        ))}
        <span className="text-muted-foreground/30">|</span>
        {/* Range */}
        {RANGES.map(r => (
          <button key={r} onClick={() => update({ range: r })}
            className={`px-1 py-0.5 border-b transition-colors ${cfg.range === r ? 'text-accent border-accent' : 'text-muted-foreground border-transparent hover:text-foreground'}`}>
            {r}
          </button>
        ))}
        <span className="text-muted-foreground/30">|</span>
        {/* Indicator dropdown */}
        <div className="relative">
          <button onClick={() => setIndOpen(o => !o)}
            className="flex items-center gap-1 px-1 py-0.5 border border-border text-muted-foreground hover:text-accent hover:border-accent">
            IND <ChevronDown size={9} />
          </button>
          {indOpen && (
            <div className="absolute left-0 top-full mt-0.5 z-40 bg-surface-deep border border-accent min-w-[120px]">
              {INDICATORS.map(i => (
                <label key={i.key} className="flex items-center gap-1.5 px-2 py-1 hover:bg-background cursor-pointer">
                  <input type="checkbox" checked={!!cfg[i.key]} onChange={e => update({ [i.key]: e.target.checked } as Partial<ChartCfg>)}
                    className="accent-accent w-3 h-3" />
                  <span className="text-[10px] text-foreground">{i.label}</span>
                </label>
              ))}
            </div>
          )}
        </div>
        <span className="ml-auto" />
        {!hideExpand && !inModal && (
          <>
            <button onClick={() => setInlineExpanded(v => !v)} title={inlineExpanded ? 'Collapse' : 'Expand inline'}
              className="px-1 py-0.5 text-muted-foreground hover:text-accent">
              {inlineExpanded ? <Minimize2 size={11} /> : <Expand size={11} />}
            </button>
            <button onClick={() => setFullscreen(true)} title="Full screen"
              className="px-1 py-0.5 text-muted-foreground hover:text-accent">
              <Maximize2 size={11} />
            </button>
          </>
        )}
        {inModal && (
          <button onClick={() => setFullscreen(false)} title="Close (ESC)"
            className="px-1 py-0.5 text-muted-foreground hover:text-accent">
            <X size={12} />
          </button>
        )}
      </div>
      <div className="bg-background p-1">
        <FxCandleCanvas data={data} cfg={cfg} symbol={symbol} height={chartHeight} digits={digits} />
      </div>
    </>
  );

  return (
    <>
      <div className="border border-border bg-surface-deep flex flex-col">
        {chrome(effHeight, false)}
      </div>

      {fullscreen && (
        <div className="fixed inset-0 z-[60] bg-background/95 backdrop-blur-sm flex items-stretch justify-center p-2">
          <div className="w-full h-full border border-accent bg-surface-deep flex flex-col">
            {chrome(window.innerHeight - 60, true)}
          </div>
        </div>
      )}
    </>
  );
}
