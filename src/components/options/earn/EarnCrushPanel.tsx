import { useMemo } from 'react';
import { ExpandableResponsiveContainer } from '@/components/shared/ExpandChart';
import {
  AreaChart,
  Area,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ReferenceLine,
} from 'recharts';

interface Props { ticker: string; redact?: boolean; }

function hash(s: string) { let h = 2166136261; for (let i = 0; i < s.length; i++) { h ^= s.charCodeAt(i); h = Math.imul(h, 16777619); } return h >>> 0; }
function rng(seed: number) { let a = seed; return () => { a |= 0; a = (a + 0x6D2B79F5) | 0; let t = a; t = Math.imul(t ^ (t >>> 15), t | 1); t ^= t + Math.imul(t ^ (t >>> 7), t | 61); return ((t ^ (t >>> 14)) >>> 0) / 4294967296; }; }

export default function EarnCrushPanel({ ticker, redact = false }: Props) {
  const { data, frontPre, frontPost, backPre, backPost } = useMemo(() => {
    const r = rng(hash(ticker + ':crush'));
    const fPre = +(45 + r() * 55).toFixed(1);
    const fPost = +(fPre * (0.4 + r() * 0.2)).toFixed(1);
    const bPre = +(fPre * (0.7 + r() * 0.1)).toFixed(1);
    const bPost = +(bPre * (0.85 + r() * 0.08)).toFixed(1);
    const data = Array.from({ length: 15 }, (_, i) => {
      const day = i - 7;
      const drift = (n: number) => n * (0.97 + r() * 0.06);
      const front = day < 0 ? drift(fPre + day * 0.4) : day === 0 ? fPre : fPre - (fPre - fPost) * Math.min(1, day / 2);
      const back = day < 0 ? drift(bPre + day * 0.15) : day === 0 ? bPre : bPre - (bPre - bPost) * Math.min(1, day / 3);
      return { day, front: +front.toFixed(1), back: +back.toFixed(1) };
    });
    return { data, frontPre: fPre, frontPost: fPost, backPre: bPre, backPost: bPost };
  }, [ticker]);

  return (
    <div className="card-terminal p-2">
      <div className="flex items-baseline gap-2 mb-2">
        <span className="text-[10px] font-mono font-bold text-accent">IV CRUSH SURFACE</span>
        <span className="text-[9px] font-mono text-muted-foreground">Front vs back month · T-7 → T+7 · {ticker}</span>
      </div>
      <ExpandableResponsiveContainer width="100%" height={260}>
        <AreaChart data={data} margin={{ top: 4, right: 8, left: -16, bottom: 0 }}>
          <defs>
            <linearGradient id="crush-front" x1="0" y1="0" x2="0" y2="1">
              <stop offset="0%" stopColor="hsl(var(--accent))" stopOpacity={0.4} />
              <stop offset="100%" stopColor="hsl(var(--accent))" stopOpacity={0} />
            </linearGradient>
            <linearGradient id="crush-back" x1="0" y1="0" x2="0" y2="1">
              <stop offset="0%" stopColor="hsl(var(--muted-foreground))" stopOpacity={0.3} />
              <stop offset="100%" stopColor="hsl(var(--muted-foreground))" stopOpacity={0} />
            </linearGradient>
          </defs>
          <CartesianGrid stroke="hsl(var(--border))" strokeDasharray="2 3" />
          <XAxis dataKey="day" tick={{ fontSize: 9, fontFamily: 'monospace', fill: 'hsl(var(--accent))' }} />
          <YAxis tick={{ fontSize: 9, fontFamily: 'monospace', fill: 'hsl(var(--accent))' }} />
          <Tooltip contentStyle={{ background: 'hsl(var(--surface-deep))', border: '1px solid hsl(var(--border))', fontFamily: 'monospace', fontSize: 10 }} />
          <ReferenceLine x={0} stroke="hsl(var(--accent))" strokeDasharray="2 3" label={{ value: 'Print', fill: 'hsl(var(--accent))', fontSize: 9 }} />
          <Area type="monotone" dataKey="front" stroke="hsl(var(--accent))" strokeWidth={2} fill="url(#crush-front)" />
          <Area type="monotone" dataKey="back" stroke="hsl(var(--muted-foreground))" strokeWidth={1.5} fill="url(#crush-back)" />
        </AreaChart>
      </ExpandableResponsiveContainer>
      <div className="grid grid-cols-2 gap-3 mt-2 text-[10px] font-mono">
        <div className="border border-border bg-surface-deep px-2 py-1.5">
          <div className="text-[8px] uppercase text-muted-foreground">Front month</div>
          <div className="text-foreground">
            Pre <span className="text-accent">{redact ? '••' : frontPre + '%'}</span> →
            Post <span className="text-down">{redact ? '••' : frontPost + '%'}</span>
            <span className="ml-1 text-muted-foreground">({redact ? '••' : Math.round((1 - frontPost / frontPre) * 100) + '%'})</span>
          </div>
        </div>
        <div className="border border-border bg-surface-deep px-2 py-1.5">
          <div className="text-[8px] uppercase text-muted-foreground">Back month</div>
          <div className="text-foreground">
            Pre <span className="text-accent">{redact ? '••' : backPre + '%'}</span> →
            Post <span className="text-down">{redact ? '••' : backPost + '%'}</span>
            <span className="ml-1 text-muted-foreground">({redact ? '••' : Math.round((1 - backPost / backPre) * 100) + '%'})</span>
          </div>
        </div>
      </div>
    </div>
  );
}
