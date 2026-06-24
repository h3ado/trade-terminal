// OVME sub-panel: IV vs strike per expiry (the classic smile).
import { ExpandableResponsiveContainer } from '@/components/shared/ExpandChart';
import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
} from 'recharts';

const STRIKES = [560, 565, 570, 575, 580, 585, 590, 595, 600, 605, 610];

function smile(atm: number, skew: number) {
  return STRIKES.map((k) => {
    const m = (k - 582) / 582;
    const iv = atm + skew * Math.abs(m) * 100 + (m < 0 ? 2.5 : 0); // put-side richer
    return { k, iv: Math.round(iv * 10) / 10 };
  });
}

const expiries = [
  { name: "7D",  atm: 14.5, skew: 0.6, color: "hsl(var(--accent))" },
  { name: "30D", atm: 16.8, skew: 0.5, color: "#60a5fa" },
  { name: "60D", atm: 18.2, skew: 0.4, color: "#a78bfa" },
  { name: "90D", atm: 19.4, skew: 0.35, color: "#f472b6" },
];

interface Props { ticker?: string; redact?: boolean }

export default function IVSmile({ ticker = "SPY", redact = false }: Props) {
  const data = STRIKES.map((k, i) => {
    const row: Record<string, number> = { k };
    for (const e of expiries) row[e.name] = smile(e.atm, e.skew)[i].iv;
    return row;
  });

  return (
    <div className="card-terminal p-2">
      <div className="flex items-center justify-between mb-2">
        <h3 className="text-sm font-mono font-bold text-foreground uppercase tracking-wider">{ticker} · Volatility Smile</h3>
        <div className="text-[9px] font-mono text-muted-foreground">IV (%) vs Strike</div>
      </div>
      {redact ? (
        <div className="h-[280px] flex items-center justify-center text-muted-foreground font-mono text-xs">•• REDACTED ••</div>
      ) : (
        <ExpandableResponsiveContainer width="100%" height={280}>
          <LineChart data={data} margin={{ top: 5, right: 10, left: -10, bottom: 0 }}>
            <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
            <XAxis dataKey="k" tick={{ fontSize: 9, fill: "hsl(var(--muted-foreground))", fontFamily: "monospace" }} stroke="hsl(var(--border))" />
            <YAxis tick={{ fontSize: 9, fill: "hsl(var(--muted-foreground))", fontFamily: "monospace" }} stroke="hsl(var(--border))" tickFormatter={(v) => `${v}%`} />
            <Tooltip contentStyle={{ background: "hsl(var(--card))", border: "1px solid hsl(var(--border))", fontFamily: "monospace", fontSize: 10 }} />
            <Legend wrapperStyle={{ fontSize: 9, fontFamily: "monospace" }} />
            {expiries.map((e) => (
              <Line key={e.name} type="monotone" dataKey={e.name} stroke={e.color} strokeWidth={1.6} dot={false} />
            ))}
          </LineChart>
        </ExpandableResponsiveContainer>
      )}
    </div>
  );
}
