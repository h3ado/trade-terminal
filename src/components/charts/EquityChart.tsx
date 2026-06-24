import { useEffect, useRef, useCallback, useMemo } from 'react';
import { useTrades } from '@/contexts/TradeContext';
import { usePrivacy } from '@/contexts/PrivacyContext';

export default function EquityChart() {
  const { trades } = useTrades();
  const { privacyMode } = usePrivacy();
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const mouseRef = useRef<{ x: number; y: number } | null>(null);

  const { data, dateLabels, xLabels } = useMemo(() => {
    const sorted = [...trades].sort((a, b) => a.date.localeCompare(b.date));
    const startingBalance = 100000;
    let running = startingBalance;
    const points: number[] = [startingBalance];
    const dates: string[] = ['Start'];

    const byDate: Record<string, number> = {};
    sorted.forEach(t => {
      const d = t.date.split(' ')[0];
      byDate[d] = (byDate[d] || 0) + t.pnl;
    });

    const sortedDates = Object.keys(byDate).sort();
    sortedDates.forEach(d => {
      running += byDate[d];
      points.push(running);
      dates.push(d);
    });

    const months = new Set<string>();
    sortedDates.forEach(d => {
      const [y, m] = d.split('-');
      const key = `${y}-${m}`;
      if (!months.has(key)) months.add(key);
    });
    const monthNames = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
    const xl = Array.from(months).map(k => {
      const [, m] = k.split('-');
      return monthNames[parseInt(m) - 1];
    });

    return { data: points, dateLabels: dates, xLabels: xl };
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

    if (data.length < 2) return;

    const max = Math.max(...data);
    const min = Math.min(...data);
    const range = max - min || 1;
    const ml = 60, mr = 40, mt = 40, mb = 40;
    const cw = w - ml - mr, ch = h - mt - mb;

    // Grid
    ctx.strokeStyle = 'hsl(220, 10%, 16%)';
    ctx.lineWidth = 0.5;
    for (let i = 0; i <= 5; i++) {
      const y = mt + (ch / 5) * i;
      ctx.beginPath(); ctx.moveTo(ml, y); ctx.lineTo(w - mr, y); ctx.stroke();
    }
    const xGridCount = Math.min(xLabels.length, 7);
    for (let i = 0; i < xGridCount; i++) {
      const x = ml + (cw / (xGridCount - 1 || 1)) * i;
      ctx.beginPath(); ctx.moveTo(x, mt); ctx.lineTo(x, h - mb); ctx.stroke();
    }

    // Y labels
    ctx.fillStyle = 'hsl(215, 10%, 35%)';
    ctx.font = '10px "Space Mono", monospace';
    ctx.textAlign = 'right';
    for (let i = 0; i <= 5; i++) {
      const val = min + (range / 5) * (5 - i);
      if (pm) {
        const pct = ((val - data[0]) / data[0]) * 100;
        ctx.fillText(`${pct >= 0 ? '+' : ''}${pct.toFixed(1)}%`, ml - 10, mt + (ch / 5) * i + 4);
      } else {
        ctx.fillText(`$${(val / 1000).toFixed(0)}K`, ml - 10, mt + (ch / 5) * i + 4);
      }
    }

    // X labels
    ctx.textAlign = 'center';
    xLabels.slice(0, 7).forEach((label, i) => {
      const x = ml + (cw / (Math.min(xLabels.length, 7) - 1 || 1)) * i;
      ctx.fillText(label, x, h - mb + 20);
    });

    // Gradient fill
    const isUp = data[data.length - 1] >= data[0];
    const lineColor = isUp ? 'hsl(145, 75%, 70%)' : 'hsl(0, 80%, 55%)';
    const gradTop = isUp ? 'hsla(145, 75%, 70%, 0.25)' : 'hsla(0, 80%, 55%, 0.25)';

    const grad = ctx.createLinearGradient(0, mt, 0, h - mb);
    grad.addColorStop(0, gradTop);
    grad.addColorStop(1, 'hsla(145, 75%, 70%, 0.0)');
    ctx.fillStyle = grad;
    ctx.beginPath();
    ctx.moveTo(ml, h - mb);
    data.forEach((v, i) => {
      const x = ml + (i / (data.length - 1)) * cw;
      const y = h - mb - ((v - min) / range) * ch;
      ctx.lineTo(x, y);
    });
    ctx.lineTo(w - mr, h - mb);
    ctx.closePath();
    ctx.fill();

    // Line
    ctx.strokeStyle = lineColor;
    ctx.lineWidth = 2;
    ctx.shadowColor = lineColor;
    ctx.shadowBlur = 6;
    ctx.beginPath();
    data.forEach((v, i) => {
      const x = ml + (i / (data.length - 1)) * cw;
      const y = h - mb - ((v - min) / range) * ch;
      i === 0 ? ctx.moveTo(x, y) : ctx.lineTo(x, y);
    });
    ctx.stroke();
    ctx.shadowBlur = 0;

    // Title
    ctx.fillStyle = 'hsl(30, 100%, 50%)';
    ctx.font = 'bold 11px "Space Mono", monospace';
    ctx.textAlign = 'left';
    ctx.fillText('EQUITY CURVE', 16, 20);

    // Stats
    ctx.fillStyle = 'hsl(215, 10%, 60%)';
    ctx.font = '10px "Space Mono", monospace';
    ctx.textAlign = 'right';
    if (pm) {
      ctx.fillText('START: •••••', w - 16, 20);
      ctx.fillText('CURRENT: •••••', w - 16, 34);
    } else {
      ctx.fillText(`START: $${(data[0] / 1000).toFixed(1)}K`, w - 16, 20);
      ctx.fillText(`CURRENT: $${(data[data.length - 1] / 1000).toFixed(1)}K`, w - 16, 34);
    }
    const profit = data[data.length - 1] - data[0];
    ctx.fillStyle = profit >= 0 ? 'hsl(145, 75%, 70%)' : 'hsl(0, 80%, 55%)';
    if (pm) {
      ctx.fillText(`${profit >= 0 ? '+' : ''}${((profit / data[0]) * 100).toFixed(1)}%`, w - 16, 48);
    } else {
      ctx.fillText(`${profit >= 0 ? '+' : ''}${((profit / data[0]) * 100).toFixed(1)}% (${profit >= 0 ? '+' : ''}$${(profit / 1000).toFixed(1)}K)`, w - 16, 48);
    }

    // Interactive crosshair + tooltip
    if (mouse && mouse.x >= ml && mouse.x <= w - mr && mouse.y >= mt && mouse.y <= h - mb) {
      const ratio = (mouse.x - ml) / cw;
      const idx = Math.round(ratio * (data.length - 1));
      const clampedIdx = Math.max(0, Math.min(data.length - 1, idx));
      const px = ml + (clampedIdx / (data.length - 1)) * cw;
      const py = h - mb - ((data[clampedIdx] - min) / range) * ch;
      const val = data[clampedIdx];
      const changeFromStart = ((val - data[0]) / data[0] * 100).toFixed(2);
      const changeFromPrev = clampedIdx > 0 ? val - data[clampedIdx - 1] : 0;
      const changePrevPct = clampedIdx > 0 ? ((changeFromPrev / data[clampedIdx - 1]) * 100).toFixed(2) : '0.00';

      ctx.strokeStyle = 'hsla(215, 10%, 50%, 0.5)';
      ctx.lineWidth = 0.5;
      ctx.setLineDash([3, 3]);
      ctx.beginPath(); ctx.moveTo(px, mt); ctx.lineTo(px, h - mb); ctx.stroke();
      ctx.beginPath(); ctx.moveTo(ml, py); ctx.lineTo(w - mr, py); ctx.stroke();
      ctx.setLineDash([]);

      ctx.fillStyle = 'hsl(220, 20%, 7%)';
      ctx.beginPath(); ctx.arc(px, py, 5, 0, Math.PI * 2); ctx.fill();
      ctx.strokeStyle = lineColor;
      ctx.lineWidth = 2;
      ctx.beginPath(); ctx.arc(px, py, 5, 0, Math.PI * 2); ctx.stroke();
      ctx.fillStyle = lineColor;
      ctx.beginPath(); ctx.arc(px, py, 2, 0, Math.PI * 2); ctx.fill();

      const tooltipW = 160, tooltipH = 52;
      let tx = px + 12, ty = py - tooltipH - 8;
      if (tx + tooltipW > w - mr) tx = px - tooltipW - 12;
      if (ty < mt) ty = py + 12;

      ctx.fillStyle = 'hsla(220, 15%, 11%, 0.95)';
      ctx.fillRect(tx, ty, tooltipW, tooltipH);
      ctx.strokeStyle = 'hsl(220, 10%, 25%)';
      ctx.lineWidth = 1;
      ctx.strokeRect(tx, ty, tooltipW, tooltipH);

      ctx.font = '9px "Space Mono", monospace';
      ctx.textAlign = 'left';
      ctx.fillStyle = 'hsl(30, 100%, 50%)';
      ctx.fillText(dateLabels[clampedIdx] || `Day ${clampedIdx}`, tx + 8, ty + 14);
      ctx.fillStyle = 'hsl(210, 20%, 95%)';
      ctx.fillText(pm ? `${changeFromStart}% from start` : `$${val.toLocaleString()}`, tx + 8, ty + 28);
      ctx.fillStyle = changeFromPrev >= 0 ? 'hsl(145, 75%, 70%)' : 'hsl(0, 80%, 55%)';
      ctx.fillText(pm ? `${changeFromPrev >= 0 ? '+' : ''}${changePrevPct}% day` : `${changeFromPrev >= 0 ? '+' : ''}$${changeFromPrev.toLocaleString()}  (${changeFromStart}%)`, tx + 8, ty + 42);

      ctx.fillStyle = 'hsla(220, 15%, 11%, 0.9)';
      ctx.fillRect(0, py - 8, ml - 4, 16);
      ctx.fillStyle = lineColor;
      ctx.font = '9px "Space Mono", monospace';
      ctx.textAlign = 'right';
      if (pm) {
        const pctAtPoint = ((val - data[0]) / data[0]) * 100;
        ctx.fillText(`${pctAtPoint >= 0 ? '+' : ''}${pctAtPoint.toFixed(1)}%`, ml - 6, py + 3);
      } else {
        ctx.fillText(`$${(val / 1000).toFixed(1)}K`, ml - 6, py + 3);
      }
    }
  }, [data, dateLabels, xLabels, privacyMode]);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const handleMove = (e: MouseEvent) => {
      const rect = canvas.getBoundingClientRect();
      mouseRef.current = { x: (e.clientX - rect.left), y: (e.clientY - rect.top) };
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
    <div className="bg-card border border-border p-4 h-full min-h-[400px] relative">
      <canvas ref={canvasRef} className="w-full h-full cursor-crosshair" />
    </div>
  );
}
