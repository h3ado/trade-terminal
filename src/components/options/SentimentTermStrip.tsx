// SENT sub-panel: Put/Call sparkline + VIX term + fear/greed gauge.
import { ExpandableResponsiveContainer } from '@/components/shared/ExpandChart';
import {
  LineChart,
  Line,
  YAxis,
} from 'recharts';

const pcr = Array.from({ length: 30 }, (_, i) => ({ d: i, v: 0.85 + Math.sin(i / 4) * 0.18 + (i > 22 ? 0.1 : 0) }));
const vix = [
  { tenor: "VIX9D", v: 13.4 },
  { tenor: "VIX",   v: 14.8 },
  { tenor: "VIX3M", v: 16.1 },
  { tenor: "VIX6M", v: 17.0 },
];
const fg = 62;

interface Props { redact?: boolean }

export default function SentimentTermStrip({ redact = false }: Props) {
  return (
    <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
      <div className="card-terminal p-2">
        <div className="flex items-center justify-between">
          <span className="text-[10px] font-mono uppercase text-muted-foreground tracking-wider">Put/Call Ratio (30d)</span>
          <span className="text-sm font-mono font-bold text-foreground">{redact ? "••" : pcr[pcr.length - 1].v.toFixed(2)}</span>
        </div>
        {!redact && (
          <ExpandableResponsiveContainer width="100%" height={70}>
            <LineChart data={pcr} margin={{ top: 5, right: 0, left: 0, bottom: 0 }}>
              <YAxis hide domain={["auto", "auto"]} />
              <Line type="monotone" dataKey="v" stroke="hsl(var(--accent))" strokeWidth={1.6} dot={false} />
            </LineChart>
          </ExpandableResponsiveContainer>
        )}
      </div>

      <div className="card-terminal p-2">
        <div className="flex items-center justify-between mb-2">
          <span className="text-[10px] font-mono uppercase text-muted-foreground tracking-wider">VIX Term</span>
          <span className="text-[9px] font-mono text-emerald-400">CONTANGO</span>
        </div>
        <div className="space-y-1">
          {vix.map((r) => (
            <div key={r.tenor} className="flex items-center gap-2">
              <span className="text-[10px] font-mono w-14 text-muted-foreground">{r.tenor}</span>
              <div className="flex-1 bg-surface-elevated h-1.5 relative">
                <div className="absolute inset-y-0 left-0 bg-accent" style={{ width: `${(r.v / 25) * 100}%` }} />
              </div>
              <span className="text-[10px] font-mono w-10 text-right text-foreground">{redact ? "••" : r.v.toFixed(1)}</span>
            </div>
          ))}
        </div>
      </div>

      <div className="card-terminal p-2">
        <div className="flex items-center justify-between mb-2">
          <span className="text-[10px] font-mono uppercase text-muted-foreground tracking-wider">Fear / Greed</span>
          <span className="text-sm font-mono font-bold text-emerald-400">{redact ? "••" : fg}</span>
        </div>
        <div className="relative h-3 bg-gradient-to-r from-rose-500 via-amber-400 to-emerald-500">
          <div className="absolute top-0 bottom-0 w-0.5 bg-foreground" style={{ left: `${fg}%` }} />
        </div>
        <div className="flex justify-between text-[9px] font-mono text-muted-foreground mt-1">
          <span>EXTREME FEAR</span><span>NEUTRAL</span><span>EXTREME GREED</span>
        </div>
      </div>
    </div>
  );
}
