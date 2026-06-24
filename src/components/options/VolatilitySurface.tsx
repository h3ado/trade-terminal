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

const volData = [
  { strike: 560, iv: 28.5, rv: 18.2 }, { strike: 565, iv: 26.1, rv: 18.0 }, { strike: 570, iv: 24.2, rv: 17.8 },
  { strike: 575, iv: 22.8, rv: 17.5 }, { strike: 580, iv: 21.1, rv: 17.2 }, { strike: 585, iv: 19.5, rv: 16.9 },
  { strike: 590, iv: 17.8, rv: 16.5 }, { strike: 595, iv: 16.2, rv: 16.1 }, { strike: 600, iv: 17.5, rv: 15.8 },
  { strike: 605, iv: 19.2, rv: 15.5 }, { strike: 610, iv: 21.4, rv: 15.2 }, { strike: 615, iv: 23.8, rv: 14.9 },
  { strike: 620, iv: 26.5, rv: 14.6 }, { strike: 625, iv: 29.1, rv: 14.3 }, { strike: 630, iv: 32.0, rv: 14.0 },
];

const CustomTooltip = ({ active, payload, label }: any) => {
  if (!active || !payload) return null;
  return (
    <div className="bg-card border border-border p-2 shadow-lg font-mono text-[10px]">
      <p className="text-muted-foreground mb-1">Strike: ${label}</p>
      {payload.map((entry: any, i: number) => (
        <p key={i} style={{ color: entry.color }}>{entry.name}: {entry.value.toFixed(1)}%</p>
      ))}
    </div>
  );
};

interface Props { ticker?: string; redact?: boolean }

const VolatilitySurface = ({ ticker = "SPY", redact = false }: Props) => {
  return (
    <div className="card-terminal p-2">
      <div className="flex items-center justify-between mb-4">
        <div>
          <h3 className="text-sm font-mono font-bold text-foreground uppercase tracking-wider">Volatility Skew — {ticker}</h3>
          <p className="text-[10px] font-mono text-muted-foreground mt-0.5">IV vs Realized Vol by Strike (30 DTE)</p>
        </div>
        <div className="flex items-center gap-4 text-[10px] font-mono">
          <div className="flex items-center gap-1.5"><div className="w-2.5 h-0.5 bg-[hsl(var(--accent))]" /><span className="text-muted-foreground">Implied Vol</span></div>
          <div className="flex items-center gap-1.5"><div className="w-2.5 h-0.5 bg-positive" /><span className="text-muted-foreground">Realized Vol</span></div>
        </div>
      </div>
      {redact ? (
        <div className="h-[260px] flex items-center justify-center text-muted-foreground font-mono text-xs">•• REDACTED ••</div>
      ) : (
        <ExpandableResponsiveContainer width="100%" height={260}>
          <AreaChart data={volData} margin={{ top: 5, right: 10, left: -10, bottom: 0 }}>
            <defs>
              <linearGradient id="ivGradient" x1="0" y1="0" x2="0" y2="1">
                <stop offset="0%" stopColor="hsl(var(--accent))" stopOpacity={0.3} />
                <stop offset="100%" stopColor="hsl(var(--accent))" stopOpacity={0} />
              </linearGradient>
            </defs>
            <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
            <XAxis dataKey="strike" tick={{ fontSize: 10, fill: "hsl(var(--muted-foreground))", fontFamily: "monospace" }} tickFormatter={(v) => `$${v}`} stroke="hsl(var(--border))" />
            <YAxis tick={{ fontSize: 10, fill: "hsl(var(--muted-foreground))", fontFamily: "monospace" }} tickFormatter={(v) => `${v}%`} stroke="hsl(var(--border))" />
            <Tooltip content={<CustomTooltip />} />
            <ReferenceLine x={594} stroke="hsl(var(--accent))" strokeDasharray="4 4" strokeWidth={1} />
            <Area type="monotone" dataKey="iv" stroke="hsl(var(--accent))" fill="url(#ivGradient)" strokeWidth={2} name="IV" dot={false} />
            <Area type="monotone" dataKey="rv" stroke="hsl(var(--positive))" fill="transparent" strokeWidth={1.5} strokeDasharray="4 4" name="RV" dot={false} />
          </AreaChart>
        </ExpandableResponsiveContainer>
      )}
    </div>
  );
};

export default VolatilitySurface;
