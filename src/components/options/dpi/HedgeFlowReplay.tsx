// Intraday dealer Δ-hedging flow replay with scrubber. Mock data via canvas.
import { useMemo, useRef, useState, useEffect } from "react";
import { seeded, fmtUsd } from "../shared/mockSeries";

interface Bar { t: string; price: number; flow: number; }

interface Props { ticker: string; spot: number; redact?: boolean }

export default function HedgeFlowReplay({ ticker, spot, redact }: Props) {
  const bars = useMemo<Bar[]>(() => {
    const r = seeded(ticker, "hflow");
    const out: Bar[] = [];
    let p = spot - 1.5;
    for (let i = 0; i < 78; i++) {
      const mins = 9 * 60 + 30 + i * 5;
      const h = String(Math.floor(mins / 60)).padStart(2, "0");
      const m = String(mins % 60).padStart(2, "0");
      p += (r() - 0.5) * 0.6;
      out.push({
        t: `${h}:${m}`,
        price: +p.toFixed(2),
        flow: (r() - 0.5) * 250_000_000,
      });
    }
    return out;
  }, [ticker, spot]);

  const [scrub, setScrub] = useState(bars.length - 1);
  const canvasRef = useRef<HTMLCanvasElement | null>(null);

  useEffect(() => {
    const c = canvasRef.current;
    if (!c) return;
    const dpr = window.devicePixelRatio || 1;
    const w = c.clientWidth, h = c.clientHeight;
    c.width = w * dpr; c.height = h * dpr;
    const ctx = c.getContext("2d")!;
    ctx.scale(dpr, dpr);
    ctx.clearRect(0, 0, w, h);
    const pMin = Math.min(...bars.map(b => b.price));
    const pMax = Math.max(...bars.map(b => b.price));
    const fMax = Math.max(...bars.map(b => Math.abs(b.flow)));
    const bw = w / bars.length;
    // bars below price line: flow
    bars.forEach((b, i) => {
      if (i > scrub) return;
      const x = i * bw;
      const flowH = (b.flow / fMax) * (h * 0.35);
      ctx.fillStyle = b.flow >= 0 ? "hsl(var(--up) / 0.7)" : "hsl(var(--down) / 0.7)";
      ctx.fillRect(x, h * 0.7, Math.max(1, bw - 0.5), -flowH);
    });
    // price line
    ctx.strokeStyle = "hsl(var(--accent))";
    ctx.lineWidth = 1.2;
    ctx.beginPath();
    bars.forEach((b, i) => {
      if (i > scrub) return;
      const x = i * bw + bw / 2;
      const y = h * 0.05 + ((pMax - b.price) / (pMax - pMin)) * (h * 0.5);
      if (i === 0) ctx.moveTo(x, y); else ctx.lineTo(x, y);
    });
    ctx.stroke();
    // baseline
    ctx.strokeStyle = "hsl(var(--border))";
    ctx.beginPath(); ctx.moveTo(0, h * 0.7); ctx.lineTo(w, h * 0.7); ctx.stroke();
  }, [bars, scrub]);

  const cur = bars[scrub];
  const cumFlow = bars.slice(0, scrub + 1).reduce((s, b) => s + b.flow, 0);

  return (
    <div className="border border-border bg-surface-deep p-3">
      <div className="flex items-center justify-between mb-2">
        <div className="text-[10px] font-mono font-bold text-accent uppercase tracking-wider">Hedging Flow Replay</div>
        <div className="flex items-center gap-3 text-[9px] font-mono text-muted-foreground">
          <span>{cur?.t}</span>
          <span>PX <span className="text-foreground">{redact ? "••" : cur?.price.toFixed(2)}</span></span>
          <span>Δ-FLOW <span className={cur?.flow >= 0 ? "text-up" : "text-down"}>{redact ? "••" : fmtUsd(cur?.flow ?? 0)}</span></span>
          <span>CUM <span className={cumFlow >= 0 ? "text-up" : "text-down"}>{redact ? "••" : fmtUsd(cumFlow)}</span></span>
        </div>
      </div>
      <canvas ref={canvasRef} className="w-full h-[180px]" />
      <input
        type="range" min={0} max={bars.length - 1} value={scrub}
        onChange={(e) => setScrub(parseInt(e.target.value))}
        className="w-full mt-2 accent-accent"
      />
    </div>
  );
}
