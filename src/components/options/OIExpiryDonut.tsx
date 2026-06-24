// Open Interest by expiry bucket — donut + share table.
import { ExpandableResponsiveContainer } from '@/components/shared/ExpandChart';
import {
  PieChart,
  Pie,
  Cell,
} from 'recharts';

const buckets = [
  { name: "0DTE",    share: 57, color: "hsl(var(--accent))" },
  { name: "1-5DTE",  share: 32, color: "hsl(var(--positive))" },
  { name: "5-30DTE", share: 17, color: "hsl(var(--negative))" },
  { name: "30+DTE",  share: 15, color: "hsl(45 90% 55%)" },
];

interface Props { ticker?: string; redact?: boolean }

export default function OIExpiryDonut({ ticker = "SPY", redact = false }: Props) {
  return (
    <div className="card-terminal p-2">
      <h3 className="text-sm font-mono font-bold text-foreground uppercase tracking-wider mb-2">OI by Expiry Bucket</h3>
      <div className="grid grid-cols-2 gap-3 items-center">
        <div className="relative h-[200px]">
          {redact ? (
            <div className="absolute inset-0 flex items-center justify-center text-muted-foreground font-mono text-xs">••</div>
          ) : (
            <>
              <ExpandableResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie data={buckets} dataKey="share" innerRadius={45} outerRadius={75} stroke="hsl(var(--background))" strokeWidth={1}>
                    {buckets.map((b, i) => <Cell key={i} fill={b.color} />)}
                  </Pie>
                  <Pie data={buckets} dataKey="share" innerRadius={20} outerRadius={42} stroke="hsl(var(--background))" strokeWidth={1} startAngle={90} endAngle={450}>
                    {buckets.map((b, i) => <Cell key={i} fill={b.color} fillOpacity={0.55} />)}
                  </Pie>
                </PieChart>
              </ExpandableResponsiveContainer>
              <div className="absolute inset-0 flex flex-col items-center justify-center pointer-events-none">
                <div className="text-[9px] font-mono text-muted-foreground">OI Dist</div>
                <div className="text-sm font-mono font-bold text-accent">{ticker}</div>
              </div>
            </>
          )}
        </div>
        <table className="w-full text-[10px] font-mono tabular-nums">
          <thead>
            <tr className="text-muted-foreground border-b border-border">
              <th className="text-left py-1">Name</th>
              <th className="text-right py-1">Share</th>
            </tr>
          </thead>
          <tbody>
            {buckets.map((b, i) => (
              <tr key={b.name} className="border-b border-grid-line">
                <td className="py-1.5">
                  <span className="text-muted-foreground mr-1">{i + 1})</span>
                  <span className="text-foreground font-bold">{b.name}</span>
                </td>
                <td className="text-right py-1.5 font-bold" style={{ color: b.color }}>{redact ? "••" : `${b.share}%`}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
