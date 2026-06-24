import { useEffect, useRef, useCallback, useMemo } from 'react';
import { useTrades } from '@/contexts/TradeContext';
import { usePrivacy } from '@/contexts/PrivacyContext';
import { getDatePnl } from '@/types/trade';

export default function DrawdownChart() {
  const { trades } = useTrades();
  const { privacyMode } = usePrivacy();
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const mouseRef = useRef<{ x: number; y: number } | null>(null);

  const { data, dateLabels } = useMemo(() => {
    const datePnl = getDatePnl(trades);
    if (datePnl.length === 0) return { data: [0], dateLabels: ['N/A'] };

    const startBalance = 100000;
    let running = startBalance;
    let peak = startBalance;
    const ddData: number[] = [];
    const labels: string[] = [];

    datePnl.forEach(d => {
      running += d.pnl;
      if (running > peak) peak = running;
      const dd = ((running - peak) / peak) * 100;
      ddData.push(dd);
      const [, m, day] = d.date.split('-');
      const months = ['', 'Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
      labels.push(`${months[parseInt(m)]} ${parseInt(day)}`);
    });

    return { data: ddData, dateLabels: labels };
  }, [trades]);

  const draw = useCallback(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    canvas.width = canvas.offsetWidth * 2;
    canvas.height = canvas.offsetHeight * 2;
    ctx.scale(2, 2);
    const w = canvas.offsetWidth, h = canvas.offsetHeight;
    const mouse = mouseRef.current;

    ctx.fillStyle = 'hsl(220, 20%, 7%)';
    ctx.fillRect(0, 0, w, h);

    if (data.length < 2) return;

    const max = Math.max(...data.map(Math.abs), 0.1);
    const ml = 60, mr = 40, mt = 40, mb = 40;
    const cw = w - ml - mr, ch = h - mt - mb;

    ctx.strokeStyle = 'hsl(220, 10%, 16%)';
    ctx.lineWidth = 0.5;
    for (let i = 0; i <= 5; i++) {
      const y = mt + (ch / 5) * i;
      ctx.beginPath(); ctx.moveTo(ml, y); ctx.lineTo(w - mr, y); ctx.stroke();
    }

    // Y labels — drawdown is already percentage-based, always show
    ctx.fillStyle = 'hsl(215, 10%, 35%)';
    ctx.font = '10px "Space Mono", monospace';
    ctx.textAlign = 'right';
    for (let i = 0; i <= 5; i++) {
      const val = -(max / 5) * i;
      ctx.fillText(`${val.toFixed(1)}%`, ml - 10, mt + (ch / 5) * i + 4);
    }

    ctx.strokeStyle = 'hsl(220, 10%, 25%)';
    ctx.lineWidth = 1;
    ctx.beginPath(); ctx.moveTo(ml, mt); ctx.lineTo(w - mr, mt); ctx.stroke();

    const grad = ctx.createLinearGradient(0, mt, 0, h - mb);
    grad.addColorStop(0, 'hsla(0, 80%, 55%, 0.05)');
    grad.addColorStop(1, 'hsla(0, 80%, 55%, 0.3)');
    ctx.fillStyle = grad;
    ctx.beginPath();
    ctx.moveTo(ml, mt);
    data.forEach((v, i) => {
      const x = ml + (i / (data.length - 1)) * cw;
      const y = mt + (Math.abs(v) / max) * ch;
      ctx.lineTo(x, y);
    });
    ctx.lineTo(ml + cw, mt);
    ctx.closePath();
    ctx.fill();

    ctx.strokeStyle = 'hsl(0, 80%, 55%)';
    ctx.lineWidth = 2;
    ctx.beginPath();
    data.forEach((v, i) => {
      const x = ml + (i / (data.length - 1)) * cw;
      const y = mt + (Math.abs(v) / max) * ch;
      i === 0 ? ctx.moveTo(x, y) : ctx.lineTo(x, y);
    });
    ctx.stroke();

    // Max DD marker
    const maxDDi = data.indexOf(Math.min(...data));
    if (maxDDi >= 0) {
      const maxX = ml + (maxDDi / (data.length - 1)) * cw;
      const maxY = mt + (Math.abs(data[maxDDi]) / max) * ch;
      ctx.strokeStyle = 'hsl(30, 100%, 50%)';
      ctx.lineWidth = 1.5;
      ctx.beginPath(); ctx.arc(maxX, maxY, 5, 0, Math.PI * 2); ctx.stroke();
      ctx.fillStyle = 'hsl(0, 80%, 55%)';
      ctx.beginPath(); ctx.arc(maxX, maxY, 3, 0, Math.PI * 2); ctx.fill();
      ctx.fillStyle = 'hsl(30, 100%, 50%)';
      ctx.font = '10px "Space Mono", monospace';
      ctx.textAlign = 'left';
      ctx.fillText(`MAX DD: ${data[maxDDi].toFixed(1)}%`, maxX + 10, maxY - 6);
    }

    ctx.fillStyle = 'hsl(30, 100%, 50%)';
    ctx.font = 'bold 11px "Space Mono", monospace';
    ctx.textAlign = 'left';
    ctx.fillText('DRAWDOWN ANALYSIS', 16, 20);

    ctx.fillStyle = 'hsl(215, 10%, 60%)';
    ctx.font = '10px "Space Mono", monospace';
    ctx.textAlign = 'right';
    ctx.fillText(`MAX: ${Math.min(...data).toFixed(1)}%`, w - 16, 20);
    ctx.fillText(`CURRENT: ${data[data.length - 1].toFixed(1)}%`, w - 16, 34);

    if (mouse && mouse.x >= ml && mouse.x <= w - mr && mouse.y >= mt && mouse.y <= h - mb) {
      const ratio = (mouse.x - ml) / cw;
      const idx = Math.round(ratio * (data.length - 1));
      const clampedIdx = Math.max(0, Math.min(data.length - 1, idx));
      const px = ml + (clampedIdx / (data.length - 1)) * cw;
      const py = mt + (Math.abs(data[clampedIdx]) / max) * ch;
      const val = data[clampedIdx];

      ctx.strokeStyle = 'hsla(215, 10%, 50%, 0.5)';
      ctx.lineWidth = 0.5;
      ctx.setLineDash([3, 3]);
      ctx.beginPath(); ctx.moveTo(px, mt); ctx.lineTo(px, h - mb); ctx.stroke();
      ctx.beginPath(); ctx.moveTo(ml, py); ctx.lineTo(w - mr, py); ctx.stroke();
      ctx.setLineDash([]);

      ctx.fillStyle = 'hsl(220, 20%, 7%)';
      ctx.beginPath(); ctx.arc(px, py, 5, 0, Math.PI * 2); ctx.fill();
      ctx.strokeStyle = 'hsl(0, 80%, 55%)';
      ctx.lineWidth = 2;
      ctx.beginPath(); ctx.arc(px, py, 5, 0, Math.PI * 2); ctx.stroke();
      ctx.fillStyle = 'hsl(0, 80%, 55%)';
      ctx.beginPath(); ctx.arc(px, py, 2, 0, Math.PI * 2); ctx.fill();

      let recoveryDays = 0;
      if (val < 0) {
        for (let j = clampedIdx + 1; j < data.length; j++) {
          recoveryDays++;
          if (data[j] === 0) break;
        }
      }

      const tooltipW = 145, tooltipH = 52;
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
      ctx.fillText(dateLabels[clampedIdx] || `Day ${clampedIdx + 1}`, tx + 8, ty + 14);
      ctx.fillStyle = val === 0 ? 'hsl(145, 75%, 70%)' : 'hsl(0, 80%, 55%)';
      ctx.font = 'bold 10px "Space Mono", monospace';
      ctx.fillText(`${val.toFixed(2)}%`, tx + 8, ty + 28);
      ctx.font = '8px "Space Mono", monospace';
      ctx.fillStyle = 'hsl(215, 10%, 50%)';
      ctx.fillText(val === 0 ? 'At peak (no drawdown)' : recoveryDays > 0 ? `Recovery: ~${recoveryDays} days` : 'Not yet recovered', tx + 8, ty + 42);

      ctx.fillStyle = 'hsla(220, 15%, 11%, 0.9)';
      ctx.fillRect(0, py - 8, ml - 4, 16);
      ctx.fillStyle = 'hsl(0, 80%, 55%)';
      ctx.font = '9px "Space Mono", monospace';
      ctx.textAlign = 'right';
      ctx.fillText(`${val.toFixed(1)}%`, ml - 6, py + 3);
    }
  }, [data, dateLabels, privacyMode]);

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
