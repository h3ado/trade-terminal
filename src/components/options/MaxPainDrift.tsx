// MAXP sub-panel: max pain drift over the last N expiries.
import { ExpandableResponsiveContainer } from '@/components/shared/ExpandChart';
import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ReferenceLine,
} from 'recharts';

const data = [
  { exp: "E-10", pain: 568, settle: 572 },
  { exp: "E-9",  pain: 572, settle: 575 },
  { exp: "E-8",  pain: 574, settle: 570 },
  { exp: "E-7",  pain: 576, settle: 578 },
  { exp: "E-6",  pain: 578, settle: 580 },
  { exp: "E-5",  pain: 580, settle: 583 },
  { exp: "E-4",  pain: 582, settle: 581 },
  { exp: "E-3",  pain: 584, settle: 585 },
  { exp: "E-2",  pain: 583, settle: 580 },
  { exp: "E-1",  pain: 582, settle: 582 },
];

interface Props { ticker?: string; redact?: boolean }

export default function MaxPainDrift({ ticker = "SPY", redact = false }: Props) {
  const current = data[data.length - 1].pain;
  return (
    <div className="card-terminal p-2">
      <div className="flex items-center justify-between mb-2">
        <h3 className="text-sm font-mono font-bold text-foreground uppercase tracking-wider">{ticker} · Max Pain Drift</h3>
        <div className="text-[9px] font-mono text-muted-foreground">Current <span className="text-accent font-bold">{current}</span></div>
      </div>
      {redact ? (
        <div className="h-[220px] flex items-center justify-center text-muted-foreground font-mono text-xs">•• REDACTED ••</div>
      ) : (
        <ExpandableResponsiveContainer width="100%" height={220}>
          <LineChart data={data} margin={{ top: 5, right: 10, left: -10, bottom: 0 }}>
            <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
            <XAxis dataKey="exp" tick={{ fontSize: 9, fill: "hsl(var(--muted-foreground))", fontFamily: "monospace" }} stroke="hsl(var(--border))" />
            <YAxis tick={{ fontSize: 9, fill: "hsl(var(--muted-foreground))", fontFamily: "monospace" }} stroke="hsl(var(--border))" />
            <Tooltip contentStyle={{ background: "hsl(var(--card))", border: "1px solid hsl(var(--border))", fontFamily: "monospace", fontSize: 10 }} />
            <ReferenceLine y={current} stroke="hsl(var(--accent))" strokeDasharray="2 2" />
            <Line type="monotone" dataKey="pain" stroke="hsl(var(--accent))" strokeWidth={2} dot={{ r: 2 }} name="Max Pain" />
            <Line type="monotone" dataKey="settle" stroke="hsl(var(--muted-foreground))" strokeWidth={1.4} dot={{ r: 1.5 }} name="Settle" />
          </LineChart>
        </ExpandableResponsiveContainer>
      )}
    </div>
  );
}
