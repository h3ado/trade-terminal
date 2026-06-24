import { useEffect, useRef, useCallback, useMemo } from 'react';
import { useTrades } from '@/contexts/TradeContext';
import { usePrivacy } from '@/contexts/PrivacyContext';

export default function DistributionChart() {
  const { trades } = useTrades();
  const { privacyMode } = usePrivacy();
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const mouseRef = useRef<{ x: number; y: number } | null>(null);

  const { bins, labels, total } = useMemo(() => {
    if (trades.length === 0) return { bins: [], labels: [], total: 0 };

    const pnls = trades.map(t => t.pnl);
    const minPnl = Math.min(...pnls);
    const maxPnl = Math.max(...pnls);
    const numBins = 15;
    const binWidth = (maxPnl - minPnl) / numBins || 1;

    const binCounts = new Array(numBins).fill(0);
    const binLabels: string[] = [];

    for (let i = 0; i < numBins; i++) {
      const low = minPnl + i * binWidth;
      binLabels.push(low >= 0 ? `$${(low / 1000).toFixed(1)}K` : `-$${(Math.abs(low) / 1000).toFixed(1)}K`);
    }

    pnls.forEach(p => {
      let idx = Math.floor((p - minPnl) / binWidth);
      if (idx >= numBins) idx = numBins - 1;
      if (idx < 0) idx = 0;
      binCounts[idx]++;
    });

    return { bins: binCounts, labels: binLabels, total: trades.length };
  }, [trades]);

  const draw = useCallback(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;
    const pm = privacyMode;

    canvas.width = canvas.offsetWidth * 2;
    canvas.height = canvas.offsetHeight * 2;
    ctx.scale(2, 2);
    const w = canvas.offsetWidth, h = canvas.offsetHeight;
    const mouse = mouseRef.current;

    ctx.fillStyle = 'hsl(220, 20%, 7%)';
    ctx.fillRect(0, 0, w, h);

    if (bins.length === 0) return;

    const max = Math.max(...bins, 1);
    const ml = 60, mr = 40, mt = 50, mb = 60;
    const cw = w - ml - mr, ch = h - mt - mb;

    ctx.strokeStyle = 'hsl(220, 10%, 16%)';
    ctx.lineWidth = 0.5;
    for (let i = 0; i <= 5; i++) {
      const y = mt + (ch / 5) * i;
      ctx.beginPath(); ctx.moveTo(ml, y); ctx.lineTo(w - mr, y); ctx.stroke();
    }

    const barW = cw / bins.length;
    const midIdx = Math.floor(bins.length / 2);

    let hoveredIdx = -1;
    if (mouse && mouse.x >= ml && mouse.x <= w - mr) {
      hoveredIdx = Math.floor((mouse.x - ml) / barW);
      if (hoveredIdx >= bins.length) hoveredIdx = bins.length - 1;
    }

    bins.forEach((v, i) => {
      const x = ml + i * barW + 3;
      const barH = (v / max) * ch;
      const y = h - mb - barH;
      const bw = barW - 6;
      const isLoss = i < midIdx;
      const isHovered = i === hoveredIdx;

      ctx.globalAlpha = isHovered ? 1 : 0.75;
      ctx.fillStyle = isLoss
        ? `hsla(0, 80%, 55%, ${0.4 + (1 - i / midIdx) * 0.6})`
        : `hsla(145, 75%, 70%, ${0.4 + ((i - midIdx) / (bins.length - midIdx)) * 0.6})`;
      ctx.fillRect(x, y, bw, barH);
      ctx.globalAlpha = 1;

      if (isHovered) {
        ctx.strokeStyle = 'hsl(210, 20%, 95%)';
        ctx.lineWidth = 1.5;
      } else {
        ctx.strokeStyle = isLoss ? 'hsl(0, 80%, 55%)' : 'hsl(145, 75%, 70%)';
        ctx.lineWidth = 0.5;
      }
      ctx.strokeRect(x, y, bw, barH);
    });

    // Bell curve overlay
    ctx.strokeStyle = 'hsl(30, 100%, 50%)';
    ctx.lineWidth = 1.5;
    ctx.beginPath();
    bins.forEach((v, i) => {
      const x = ml + i * barW + barW / 2;
      const y = h - mb - (v / max) * ch;
      i === 0 ? ctx.moveTo(x, y) : ctx.lineTo(x, y);
    });
    ctx.stroke();

    // X labels — hide dollar ranges in privacy mode
    ctx.fillStyle = 'hsl(215, 10%, 35%)';
    ctx.font = '9px "Space Mono", monospace';
    ctx.textAlign = 'center';
    labels.forEach((label, i) => {
      if (i % 3 === 0 || i === midIdx) {
        const x = ml + i * barW + barW / 2;
        ctx.fillText(pm ? (i < midIdx ? 'Loss' : i === midIdx ? '~0' : 'Win') : label, x, h - mb + 15);
      }
    });

    ctx.fillStyle = 'hsl(30, 100%, 50%)';
    ctx.font = 'bold 11px "Space Mono", monospace';
    ctx.textAlign = 'left';
    ctx.fillText('P&L DISTRIBUTION', 16, 20);

    ctx.fillStyle = 'hsl(215, 10%, 60%)';
    ctx.font = '10px "Space Mono", monospace';
    ctx.textAlign = 'right';
    ctx.fillText(`TOTAL: ${total} trades`, w - 16, 20);

    if (hoveredIdx >= 0 && hoveredIdx < bins.length && mouse) {
      const v = bins[hoveredIdx];
      const x = ml + hoveredIdx * barW + barW / 2;
      const barH = (v / max) * ch;
      const barTop = h - mb - barH;
      const pct = ((v / total) * 100).toFixed(1);
      const cumulative = bins.slice(0, hoveredIdx + 1).reduce((s, b) => s + b, 0);
      const cumPct = ((cumulative / total) * 100).toFixed(1);

      ctx.strokeStyle = 'hsla(215, 10%, 50%, 0.4)';
      ctx.lineWidth = 0.5;
      ctx.setLineDash([3, 3]);
      ctx.beginPath(); ctx.moveTo(x, mt); ctx.lineTo(x, h - mb); ctx.stroke();
      ctx.beginPath(); ctx.moveTo(ml, barTop); ctx.lineTo(w - mr, barTop); ctx.stroke();
      ctx.setLineDash([]);

      const tooltipW = 140, tooltipH = 52;
      let tx = x + 12, ty = barTop - 10;
      if (tx + tooltipW > w - mr) tx = x - tooltipW - 12;
      if (ty < mt) ty = mt + 5;

      ctx.fillStyle = 'hsla(220, 15%, 11%, 0.95)';
      ctx.fillRect(tx, ty, tooltipW, tooltipH);
      ctx.strokeStyle = 'hsl(220, 10%, 25%)';
      ctx.lineWidth = 1;
      ctx.strokeRect(tx, ty, tooltipW, tooltipH);

      ctx.font = '9px "Space Mono", monospace';
      ctx.textAlign = 'left';
      ctx.fillStyle = 'hsl(30, 100%, 50%)';
      ctx.fillText(pm ? `Bin ${hoveredIdx + 1}` : `Range: ${labels[hoveredIdx]}`, tx + 8, ty + 14);
      ctx.fillStyle = 'hsl(210, 20%, 95%)';
      ctx.fillText(`${v} trades (${pct}%)`, tx + 8, ty + 28);
      ctx.fillStyle = 'hsl(215, 10%, 50%)';
      ctx.fillText(`Cumulative: ${cumPct}%`, tx + 8, ty + 42);
    }
  }, [bins, labels, total, privacyMode]);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const handleMove = (e: MouseEvent) => {
      const rect = canvas.getBoundingClientRect();
      mouseRef.current = { x: e.clientX - rect.left, y: e.clientY - rect.top };
      draw();
    };
    const handleLeave = () => { mouseRef.current = null; draw(); };
    draw();
    canvas.addEventListener('mousemove', handleMove);
    canvas.addEventListener('mouseleave', handleLeave);
    window.addEventListener('resize', draw);
    return () => {
      canvas.removeEventListener('mousemove', handleMove);
      canvas.removeEventListener('mouseleave', handleLeave);
      window.removeEventListener('resize', draw);
    };
  }, [draw]);

  return (
    <div className="bg-card border border-border p-4 h-full min-h-[400px]">
      <canvas ref={canvasRef} className="w-full h-full cursor-crosshair" />
    </div>
  );
}
