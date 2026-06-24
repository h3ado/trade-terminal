// Intraday Net GEX line chart from market open to close.
import { ExpandableResponsiveContainer } from '@/components/shared/ExpandChart';
import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
} from 'recharts';

const SLOTS = ["10:00","10:30","11:00","11:30","12:00","12:30","13:00","13:30","14:00","14:30","15:00","15:30","16:00"];
const data = SLOTS.map((t, i) => ({
  t,
  gex: Math.round(220 + Math.sin(i * 0.6) * 25 + Math.cos(i * 1.2) * 12),
}));

interface Props { ticker?: string; redact?: boolean }

export default function IntradayGexChart({ ticker = "SPY", redact = false }: Props) {
  return (
    <div className="card-terminal p-2">
      <div className="flex items-center justify-between mb-2">
        <h3 className="text-sm font-mono font-bold text-foreground uppercase tracking-wider">Intraday Net GEX</h3>
        <div className="text-[10px] font-mono text-muted-foreground">Current <span className="text-foreground font-bold">232M</span></div>
      </div>
      {redact ? (
        <div className="h-[240px] flex items-center justify-center text-muted-foreground font-mono text-xs">•• REDACTED ••</div>
      ) : (
        <ExpandableResponsiveContainer width="100%" height={240}>
          <LineChart data={data} margin={{ top: 5, right: 10, left: -10, bottom: 0 }}>
            <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
            <XAxis dataKey="t" tick={{ fontSize: 9, fill: "hsl(var(--muted-foreground))", fontFamily: "monospace" }} stroke="hsl(var(--border))" />
            <YAxis tick={{ fontSize: 9, fill: "hsl(var(--muted-foreground))", fontFamily: "monospace" }} tickFormatter={(v) => `${v}M`} stroke="hsl(var(--border))" />
            <Tooltip
              contentStyle={{ background: "hsl(var(--card))", border: "1px solid hsl(var(--border))", fontFamily: "monospace", fontSize: 10 }}
              formatter={(v: number) => [`${v}M`, "Net GEX"]}
            />
            <Line type="monotone" dataKey="gex" stroke="hsl(var(--foreground))" strokeWidth={2} dot={false} />
          </LineChart>
        </ExpandableResponsiveContainer>
      )}
    </div>
  );
}
