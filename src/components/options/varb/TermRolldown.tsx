// Theta roll-down P&L across the term curve for short-vol structures.
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  Tooltip,
  CartesianGrid,
  Cell,
} from 'recharts';
import { getRolldown } from "../shared/mockVol";
import { ExpandableResponsiveContainer } from '@/components/shared/ExpandChart';

interface Props { ticker: string; redact?: boolean; }

export default function TermRolldown({ ticker, redact = false }: Props) {
  const data = getRolldown(ticker);
  return (
    <div className="card-terminal p-2">
      <div className="flex items-baseline gap-2 mb-2">
        <span className="text-[10px] font-mono font-bold text-accent">TERM ROLL-DOWN</span>
        <span className="text-[9px] font-mono text-muted-foreground">Theta-carry P&L for short-vol · {ticker}</span>
      </div>
      <ExpandableResponsiveContainer width="100%" height={200}>
        <BarChart data={data} margin={{ top: 4, right: 8, left: -16, bottom: 0 }}>
          <CartesianGrid stroke="hsl(var(--border))" strokeDasharray="2 3" />
          <XAxis dataKey="dte" tick={{ fontSize: 9, fontFamily: "monospace", fill: "hsl(var(--muted-foreground))" }}
            label={{ value: "DTE", fill: "hsl(var(--muted-foreground))", fontSize: 9, position: "insideBottom", offset: -2 }} />
          <YAxis tick={{ fontSize: 9, fontFamily: "monospace", fill: "hsl(var(--muted-foreground))" }} tickFormatter={(v) => redact ? "••" : `$${v}`} />
          <Tooltip contentStyle={{ background: "hsl(var(--surface-deep))", border: "1px solid hsl(var(--border))", fontFamily: "monospace", fontSize: 10 }} />
          <Bar dataKey="thetaPnl">
            {data.map((d, i) => (
              <Cell key={i} fill={d.thetaPnl > 0 ? "hsl(var(--up))" : "hsl(var(--down))"} />
            ))}
          </Bar>
        </BarChart>
      </ExpandableResponsiveContainer>
    </div>
  );
}
