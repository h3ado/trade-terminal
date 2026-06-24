// Bloomberg-style candlestick / line / area chart on Canvas with crosshair,
// OHLC readout and optional indicator overlays (EMA/BB) + sub-panels (RSI/MACD).
import { useEffect, useMemo, useRef, useState } from 'react';
import { Candle } from './fxSeries';
import { ChartCfg } from './useFxChartConfig';
import { ema, bollinger, rsi as rsiCalc, macd as macdCalc, closes } from './indicators';

interface Props {
  data: Candle[];
  cfg: ChartCfg;
  symbol: string;
  height: number;
  digits?: number;
}

const PAD_L = 10;
const PAD_R = 60;
const PAD_T = 6;
const PAD_B = 18;
const SUB_H = 70; // height of each indicator sub panel

function fmtPrice(v: number, d: number) {
  return v.toFixed(d);
}

function fmtTime(t: number) {
  const d = new Date(t);
  const yy = d.getFullYear();
  const mm = String(d.getMonth() + 1).padStart(2, '0');
  const dd = String(d.getDate()).padStart(2, '0');
  const hh = String(d.getHours()).padStart(2, '0');
  const mi = String(d.getMinutes()).padStart(2, '0');
  return `${yy}-${mm}-${dd} ${hh}:${mi}`;
}

export default function FxCandleCanvas({ data, cfg, symbol, height, digits = 4 }: Props) {
  const wrapRef = useRef<HTMLDivElement | null>(null);
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const [w, setW] = useState(800);
  const [hover, setHover] = useState<{ x: number; y: number; i: number } | null>(null);

  useEffect(() => {
    const el = wrapRef.current;
    if (!el) return;
    const obs = new ResizeObserver(entries => {
      for (const e of entries) setW(Math.max(200, e.contentRect.width));
    });
    obs.observe(el);
    return () => obs.disconnect();
  }, []);

  // Pre-compute indicator series.
  const series = useMemo(() => {
    const cls = closes(data);
    return {
      cls,
      ema20: cfg.ema20 ? ema(cls, 20) : null,
      ema50: cfg.ema50 ? ema(cls, 50) : null,
      ema200: cfg.ema200 ? ema(cls, 200) : null,
      bb: cfg.bb ? bollinger(cls, 20, 2) : null,
      rsi: cfg.rsi ? rsiCalc(cls, 14) : null,
      macd: cfg.macd ? macdCalc(cls, 12, 26, 9) : null,
    };
  }, [data, cfg.ema20, cfg.ema50, cfg.ema200, cfg.bb, cfg.rsi, cfg.macd]);

  const subPanels = (cfg.rsi ? 1 : 0) + (cfg.macd ? 1 : 0);
  const mainH = height - subPanels * SUB_H;
  const totalH = height;

  // Compute scales and draw.
  useEffect(() => {
    const c = canvasRef.current;
    if (!c) return;
    const dpr = window.devicePixelRatio || 1;
    c.width = w * dpr;
    c.height = totalH * dpr;
    const ctx = c.getContext('2d');
    if (!ctx) return;
    ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
    ctx.clearRect(0, 0, w, totalH);

    if (!data.length) return;

    const innerW = w - PAD_L - PAD_R;
    const innerH = mainH - PAD_T - PAD_B;
    const n = data.length;
    const barW = innerW / n;
    const candleW = Math.max(1, Math.min(8, barW * 0.7));

    // Price range — include BB upper/lower if present.
    let lo = Infinity, hi = -Infinity;
    for (const k of data) { if (k.l < lo) lo = k.l; if (k.h > hi) hi = k.h; }
    if (series.bb) {
      for (let i = 0; i < n; i++) {
        const u = series.bb.upper[i], l = series.bb.lower[i];
        if (u !== null && u > hi) hi = u;
        if (l !== null && l < lo) lo = l;
      }
    }
    const pad = (hi - lo) * 0.05 || hi * 0.001;
    lo -= pad; hi += pad;

    const xAt = (i: number) => PAD_L + i * barW + barW / 2;
    const yAt = (p: number) => PAD_T + (1 - (p - lo) / (hi - lo)) * innerH;

    // Grid.
    ctx.strokeStyle = 'hsla(0,0%,100%,0.05)';
    ctx.lineWidth = 1;
    ctx.font = '9px JetBrains Mono, monospace';
    ctx.fillStyle = 'hsl(220 9% 46%)';
    ctx.textBaseline = 'middle';
    const gridCount = 5;
    for (let g = 0; g <= gridCount; g++) {
      const p = lo + (hi - lo) * (g / gridCount);
      const y = yAt(p);
      ctx.beginPath();
      ctx.moveTo(PAD_L, y);
      ctx.lineTo(w - PAD_R, y);
      ctx.stroke();
      ctx.textAlign = 'left';
      ctx.fillText(fmtPrice(p, digits), w - PAD_R + 4, y);
    }
    // X axis ticks (~6 labels).
    const xTicks = 6;
    ctx.textBaseline = 'top';
    for (let g = 0; g <= xTicks; g++) {
      const idx = Math.min(n - 1, Math.floor((n - 1) * (g / xTicks)));
      const x = xAt(idx);
      ctx.strokeStyle = 'hsla(0,0%,100%,0.05)';
      ctx.beginPath();
      ctx.moveTo(x, PAD_T);
      ctx.lineTo(x, mainH - PAD_B);
      ctx.stroke();
      ctx.fillStyle = 'hsl(220 9% 46%)';
      ctx.textAlign = 'center';
      const dt = new Date(data[idx].t);
      const lab = `${dt.getMonth() + 1}/${dt.getDate()}`;
      ctx.fillText(lab, x, mainH - PAD_B + 4);
    }

    // Main series.
    if (cfg.type === 'line' || cfg.type === 'area') {
      if (cfg.type === 'area') {
        ctx.beginPath();
        for (let i = 0; i < n; i++) {
          const x = xAt(i), y = yAt(data[i].c);
          if (i === 0) ctx.moveTo(x, y); else ctx.lineTo(x, y);
        }
        ctx.lineTo(xAt(n - 1), mainH - PAD_B);
        ctx.lineTo(xAt(0), mainH - PAD_B);
        ctx.closePath();
        ctx.fillStyle = 'hsla(30, 95%, 55%, 0.12)';
        ctx.fill();
      }
      ctx.strokeStyle = 'hsl(30 95% 55%)';
      ctx.lineWidth = 1.4;
      ctx.beginPath();
      for (let i = 0; i < n; i++) {
        const x = xAt(i), y = yAt(data[i].c);
        if (i === 0) ctx.moveTo(x, y); else ctx.lineTo(x, y);
      }
      ctx.stroke();
    } else {
      for (let i = 0; i < n; i++) {
        const k = data[i];
        const x = xAt(i);
        const up = k.c >= k.o;
        const col = up ? 'hsl(142 71% 45%)' : 'hsl(0 75% 55%)';
        ctx.strokeStyle = col;
        ctx.fillStyle = col;
        // Wick
        ctx.beginPath();
        ctx.moveTo(x, yAt(k.h));
        ctx.lineTo(x, yAt(k.l));
        ctx.stroke();
        // Body
        const yo = yAt(k.o), yc = yAt(k.c);
        const top = Math.min(yo, yc);
        const h = Math.max(1, Math.abs(yc - yo));
        ctx.fillRect(x - candleW / 2, top, candleW, h);
      }
    }

    // Overlays — EMA / BB.
    const drawLine = (vals: (number | null)[], color: string, lw = 1) => {
      ctx.strokeStyle = color;
      ctx.lineWidth = lw;
      ctx.beginPath();
      let started = false;
      for (let i = 0; i < n; i++) {
        const v = vals[i];
        if (v === null || v === undefined) { started = false; continue; }
        const x = xAt(i), y = yAt(v);
        if (!started) { ctx.moveTo(x, y); started = true; } else ctx.lineTo(x, y);
      }
      ctx.stroke();
    };
    if (series.ema20) drawLine(series.ema20, 'hsl(195 90% 55%)');
    if (series.ema50) drawLine(series.ema50, 'hsl(280 80% 65%)');
    if (series.ema200) drawLine(series.ema200, 'hsl(50 90% 55%)');
    if (series.bb) {
      drawLine(series.bb.upper, 'hsla(220, 9%, 70%, 0.7)');
      drawLine(series.bb.lower, 'hsla(220, 9%, 70%, 0.7)');
      drawLine(series.bb.mid, 'hsla(220, 9%, 70%, 0.4)');
    }

    // Last-price tag.
    const last = data[n - 1].c;
    const ly = yAt(last);
    ctx.fillStyle = last >= data[n - 1].o ? 'hsl(142 71% 45%)' : 'hsl(0 75% 55%)';
    ctx.fillRect(w - PAD_R, ly - 7, PAD_R - 2, 14);
    ctx.fillStyle = 'hsl(220 13% 9%)';
    ctx.font = 'bold 10px JetBrains Mono, monospace';
    ctx.textAlign = 'left';
    ctx.textBaseline = 'middle';
    ctx.fillText(fmtPrice(last, digits), w - PAD_R + 4, ly);

    // Sub-panels.
    let subY = mainH;
    const drawSub = (title: string, draw: (top: number, h: number) => void) => {
      // Divider
      ctx.strokeStyle = 'hsla(0,0%,100%,0.08)';
      ctx.beginPath(); ctx.moveTo(0, subY); ctx.lineTo(w, subY); ctx.stroke();
      ctx.font = '9px JetBrains Mono, monospace';
      ctx.fillStyle = 'hsl(30 95% 55%)';
      ctx.textAlign = 'left'; ctx.textBaseline = 'top';
      ctx.fillText(title, PAD_L, subY + 2);
      draw(subY + 14, SUB_H - 18);
      subY += SUB_H;
    };

    if (series.rsi) {
      drawSub('RSI(14)', (top, h) => {
        const yA = (v: number) => top + (1 - v / 100) * h;
        // 30/70 lines
        ctx.strokeStyle = 'hsla(0,0%,100%,0.1)';
        ctx.setLineDash([2, 2]);
        ctx.beginPath(); ctx.moveTo(PAD_L, yA(70)); ctx.lineTo(w - PAD_R, yA(70)); ctx.stroke();
        ctx.beginPath(); ctx.moveTo(PAD_L, yA(30)); ctx.lineTo(w - PAD_R, yA(30)); ctx.stroke();
        ctx.setLineDash([]);
        ctx.fillStyle = 'hsl(220 9% 46%)'; ctx.font = '8px JetBrains Mono, monospace';
        ctx.textBaseline = 'middle'; ctx.textAlign = 'left';
        ctx.fillText('70', w - PAD_R + 4, yA(70));
        ctx.fillText('30', w - PAD_R + 4, yA(30));
        ctx.strokeStyle = 'hsl(195 90% 55%)'; ctx.lineWidth = 1;
        ctx.beginPath();
        let started = false;
        for (let i = 0; i < n; i++) {
          const v = series.rsi![i];
          if (v === null || v === undefined) { started = false; continue; }
          const x = xAt(i), y = yA(v);
          if (!started) { ctx.moveTo(x, y); started = true; } else ctx.lineTo(x, y);
        }
        ctx.stroke();
      });
    }
    if (series.macd) {
      drawSub('MACD(12,26,9)', (top, h) => {
        let mLo = Infinity, mHi = -Infinity;
        for (let i = 0; i < n; i++) {
          const a = series.macd!.macd[i], b = series.macd!.signal[i], c2 = series.macd!.hist[i];
          for (const v of [a, b, c2]) if (v !== null && v !== undefined) { if (v < mLo) mLo = v; if (v > mHi) mHi = v; }
        }
        if (mLo === Infinity) return;
        const padR = (mHi - mLo) * 0.1 || 0.0001;
        mLo -= padR; mHi += padR;
        const yA = (v: number) => top + (1 - (v - mLo) / (mHi - mLo)) * h;
        const yZero = yA(0);
        ctx.strokeStyle = 'hsla(0,0%,100%,0.1)';
        ctx.beginPath(); ctx.moveTo(PAD_L, yZero); ctx.lineTo(w - PAD_R, yZero); ctx.stroke();
        // Histogram
        for (let i = 0; i < n; i++) {
          const hv = series.macd!.hist[i];
          if (hv === null || hv === undefined) continue;
          const x = xAt(i), y = yA(hv);
          ctx.fillStyle = hv >= 0 ? 'hsla(142, 71%, 45%, 0.7)' : 'hsla(0, 75%, 55%, 0.7)';
          ctx.fillRect(x - candleW / 2, Math.min(y, yZero), candleW, Math.abs(y - yZero) || 1);
        }
        // Lines
        ctx.lineWidth = 1;
        const drawIndLine = (vals: (number | null)[], col: string) => {
          ctx.strokeStyle = col; ctx.beginPath(); let started = false;
          for (let i = 0; i < n; i++) {
            const v = vals[i];
            if (v === null || v === undefined) { started = false; continue; }
            const x = xAt(i), y = yA(v);
            if (!started) { ctx.moveTo(x, y); started = true; } else ctx.lineTo(x, y);
          }
          ctx.stroke();
        };
        drawIndLine(series.macd!.macd, 'hsl(195 90% 55%)');
        drawIndLine(series.macd!.signal, 'hsl(30 95% 55%)');
      });
    }

    // Crosshair.
    if (hover) {
      const i = hover.i;
      const x = xAt(i);
      ctx.strokeStyle = 'hsla(30, 95%, 55%, 0.4)';
      ctx.setLineDash([3, 3]);
      ctx.beginPath();
      ctx.moveTo(x, PAD_T); ctx.lineTo(x, totalH - 2); ctx.stroke();
      ctx.beginPath();
      ctx.moveTo(PAD_L, hover.y); ctx.lineTo(w - PAD_R, hover.y); ctx.stroke();
      ctx.setLineDash([]);
      // Time label
      const lab = fmtTime(data[i].t);
      ctx.fillStyle = 'hsl(220 13% 9%)';
      const tw = ctx.measureText(lab).width + 8;
      ctx.fillStyle = 'hsl(30 95% 55%)';
      ctx.fillRect(Math.min(w - PAD_R - tw, Math.max(PAD_L, x - tw / 2)), mainH - PAD_B, tw, 14);
      ctx.fillStyle = 'hsl(220 13% 9%)';
      ctx.font = 'bold 9px JetBrains Mono, monospace';
      ctx.textAlign = 'center'; ctx.textBaseline = 'middle';
      ctx.fillText(lab, Math.min(w - PAD_R - tw / 2, Math.max(PAD_L + tw / 2, x)), mainH - PAD_B + 7);
    }
  }, [data, cfg, w, totalH, mainH, hover, series, digits]);

  const onMove = (e: React.MouseEvent<HTMLCanvasElement>) => {
    const rect = e.currentTarget.getBoundingClientRect();
    const x = e.clientX - rect.left;
    const y = e.clientY - rect.top;
    const innerW = w - PAD_L - PAD_R;
    const n = data.length;
    const barW = innerW / n;
    const i = Math.max(0, Math.min(n - 1, Math.floor((x - PAD_L) / barW)));
    setHover({ x, y, i });
  };
  const onLeave = () => setHover(null);

  const hoverK = hover ? data[hover.i] : data[data.length - 1];
  const prev = data[Math.max(0, (hover ? hover.i : data.length - 1) - 1)];
  const ch = hoverK ? hoverK.c - (prev?.c ?? hoverK.o) : 0;
  const chPct = prev?.c ? (ch / prev.c) * 100 : 0;
  const up = ch >= 0;

  return (
    <div ref={wrapRef} className="relative w-full" style={{ height }}>
      {/* OHLC readout */}
      {hoverK && (
        <div className="absolute top-1 left-2 z-10 flex items-center gap-2 text-[10px] font-mono pointer-events-none">
          <span className="text-accent font-bold">{symbol}</span>
          <span className="text-muted-foreground">O</span><span className="text-foreground">{fmtPrice(hoverK.o, digits)}</span>
          <span className="text-muted-foreground">H</span><span className="text-foreground">{fmtPrice(hoverK.h, digits)}</span>
          <span className="text-muted-foreground">L</span><span className="text-foreground">{fmtPrice(hoverK.l, digits)}</span>
          <span className="text-muted-foreground">C</span><span className="text-foreground">{fmtPrice(hoverK.c, digits)}</span>
          <span className={up ? 'text-positive' : 'text-negative'}>
            {up ? '+' : ''}{fmtPrice(ch, digits)} ({up ? '+' : ''}{chPct.toFixed(2)}%)
          </span>
          <span className="text-muted-foreground">V</span><span className="text-foreground">{(hoverK.v / 1000).toFixed(0)}k</span>
        </div>
      )}
      <canvas
        ref={canvasRef}
        style={{ width: w, height: totalH, display: 'block' }}
        onMouseMove={onMove}
        onMouseLeave={onLeave}
      />
    </div>
  );
}
