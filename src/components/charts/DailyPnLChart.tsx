import { useEffect, useRef, useCallback, useMemo } from 'react';
import { useTrades } from '@/contexts/TradeContext';
import { usePrivacy } from '@/contexts/PrivacyContext';
import { getDatePnl } from '@/types/trade';

export default function DailyPnLChart() {
  const { trades } = useTrades();
  const { privacyMode } = usePrivacy();
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const mouseRef = useRef<{ x: number; y: number } | null>(null);

  const { data, dayLabels } = useMemo(() => {
    const datePnl = getDatePnl(trades);
    return {
      data: datePnl.map(d => d.pnl),
      dayLabels: datePnl.map(d => {
        const [, m, day] = d.date.split('-');
        const months = ['', 'Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
        return `${months[parseInt(m)]} ${parseInt(day)}`;
      }),
    };
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

    if (data.length === 0) return;

    const max = Math.max(...data.map(Math.abs), 1);
    const ml = 60, mr = 40, mt = 50, mb = 40;
    const cw = w - ml - mr, ch = h - mt - mb;
    const zero = mt + ch / 2;

    ctx.strokeStyle = 'hsl(220, 10%, 16%)';
    ctx.lineWidth = 0.5;
    for (let i = 0; i <= 4; i++) {
      const y = mt + (ch / 4) * i;
      ctx.beginPath(); ctx.moveTo(ml, y); ctx.lineTo(w - mr, y); ctx.stroke();
    }

    ctx.strokeStyle = 'hsl(220, 10%, 20%)';
    ctx.lineWidth = 1;
    ctx.beginPath(); ctx.moveTo(ml, zero); ctx.lineTo(w - mr, zero); ctx.stroke();

    // Y labels
    ctx.fillStyle = 'hsl(215, 10%, 35%)';
    ctx.font = '10px "Space Mono", monospace';
    ctx.textAlign = 'right';
    if (pm) {
      ctx.fillText('▲', ml - 10, mt + 4);
      ctx.fillText('0', ml - 10, zero + 4);
      ctx.fillText('▼', ml - 10, h - mb + 4);
    } else {
      ctx.fillText(`+$${(max / 1000).toFixed(1)}K`, ml - 10, mt + 4);
      ctx.fillText('$0', ml - 10, zero + 4);
      ctx.fillText(`-$${(max / 1000).toFixed(1)}K`, ml - 10, h - mb + 4);
    }

    const barW = cw / data.length;

    let hoveredIdx = -1;
    if (mouse && mouse.x >= ml && mouse.x <= w - mr) {
      hoveredIdx = Math.floor((mouse.x - ml) / barW);
      if (hoveredIdx >= data.length) hoveredIdx = data.length - 1;
    }

    data.forEach((v, i) => {
      const x = ml + i * barW + 2;
      const barH = (Math.abs(v) / max) * (ch / 2);
      const y = v >= 0 ? zero - barH : zero;
      const bw = barW - 4;
      const isHovered = i === hoveredIdx;

      ctx.fillStyle = v >= 0 ? 'hsl(145, 75%, 70%)' : 'hsl(0, 80%, 55%)';
      ctx.globalAlpha = isHovered ? 1 : 0.7;
      ctx.fillRect(x, y, bw, barH);
      ctx.globalAlpha = 1;

      if (isHovered) {
        ctx.strokeStyle = 'hsl(210, 20%, 95%)';
        ctx.lineWidth = 1.5;
        ctx.strokeRect(x, y, bw, barH);
      } else {
        ctx.strokeStyle = v >= 0 ? 'hsl(145, 75%, 70%)' : 'hsl(0, 80%, 55%)';
        ctx.lineWidth = 0.5;
        ctx.strokeRect(x, y, bw, barH);
      }
    });

    ctx.fillStyle = 'hsl(30, 100%, 50%)';
    ctx.font = 'bold 11px "Space Mono", monospace';
    ctx.textAlign = 'left';
    ctx.fillText('DAILY P&L', 16, 20);

    const winDays = data.filter(v => v > 0).length;
    const lossDays = data.filter(v => v < 0).length;
    const avg = data.reduce((s, v) => s + v, 0) / data.length;
    ctx.fillStyle = 'hsl(215, 10%, 60%)';
    ctx.font = '10px "Space Mono", monospace';
    ctx.textAlign = 'right';
    ctx.fillText(`WIN DAYS: ${winDays}`, w - 16, 20);
    ctx.fillText(`LOSS DAYS: ${lossDays}`, w - 16, 34);
    ctx.fillStyle = avg >= 0 ? 'hsl(145, 75%, 70%)' : 'hsl(0, 80%, 55%)';
    ctx.fillText(pm ? `AVG: •••••` : `AVG: ${avg >= 0 ? '+' : ''}$${avg.toFixed(0)}`, w - 16, 48);

    if (hoveredIdx >= 0 && hoveredIdx < data.length && mouse) {
      const v = data[hoveredIdx];
      const x = ml + hoveredIdx * barW + barW / 2;
      const barH = (Math.abs(v) / max) * (ch / 2);
      const barTop = v >= 0 ? zero - barH : zero;

      ctx.strokeStyle = 'hsla(215, 10%, 50%, 0.4)';
      ctx.lineWidth = 0.5;
      ctx.setLineDash([3, 3]);
      ctx.beginPath(); ctx.moveTo(x, mt); ctx.lineTo(x, h - mb); ctx.stroke();
      ctx.setLineDash([]);

      const tooltipW = 130, tooltipH = 42;
      let tx = x + 12, ty = barTop - 10;
      if (tx + tooltipW > w - mr) tx = x - tooltipW - 12;
      if (ty < mt) ty = mt + 5;
      if (ty + tooltipH > h - mb) ty = h - mb - tooltipH - 5;

      ctx.fillStyle = 'hsla(220, 15%, 11%, 0.95)';
      ctx.fillRect(tx, ty, tooltipW, tooltipH);
      ctx.strokeStyle = 'hsl(220, 10%, 25%)';
      ctx.lineWidth = 1;
      ctx.strokeRect(tx, ty, tooltipW, tooltipH);

      ctx.font = '9px "Space Mono", monospace';
      ctx.textAlign = 'left';
      ctx.fillStyle = 'hsl(30, 100%, 50%)';
      ctx.fillText(dayLabels[hoveredIdx] || `Day ${hoveredIdx + 1}`, tx + 8, ty + 14);
      ctx.fillStyle = v >= 0 ? 'hsl(145, 75%, 70%)' : 'hsl(0, 80%, 55%)';
      ctx.font = 'bold 10px "Space Mono", monospace';
      ctx.fillText(pm ? (v >= 0 ? 'Positive' : 'Negative') : `${v >= 0 ? '+' : ''}$${v.toLocaleString()}`, tx + 8, ty + 30);

      const running = data.slice(0, hoveredIdx + 1).reduce((s, d) => s + d, 0);
      ctx.font = '8px "Space Mono", monospace';
      ctx.fillStyle = 'hsl(215, 10%, 50%)';
      ctx.textAlign = 'right';
      ctx.fillText(pm ? `Σ •••••` : `Σ ${running >= 0 ? '+' : ''}$${running.toLocaleString()}`, tx + tooltipW - 8, ty + 14);
    }
  }, [data, dayLabels, privacyMode]);

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
