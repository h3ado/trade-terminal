import { ExpandableResponsiveContainer } from '@/components/shared/ExpandChart';
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ReferenceLine,
  Cell,
} from 'recharts';

const gammaData = [
  { strike: 570, gamma: -45 }, { strike: 575, gamma: -32 }, { strike: 580, gamma: -18 },
  { strike: 585, gamma: 25 }, { strike: 590, gamma: 62 }, { strike: 592, gamma: 85 },
  { strike: 594, gamma: 120 }, { strike: 595, gamma: 95 }, { strike: 597, gamma: 55 },
  { strike: 600, gamma: 42 }, { strike: 605, gamma: -15 }, { strike: 610, gamma: -38 },
  { strike: 615, gamma: -22 }, { strike: 620, gamma: -12 },
];

const CustomTooltip = ({ active, payload, label }: any) => {
  if (!active || !payload) return null;
  const val = payload[0]?.value;
  return (
    <div className="bg-card border border-border p-2 shadow-lg font-mono text-[10px]">
      <p className="text-muted-foreground mb-1">Strike: ${label}</p>
      <p className={val >= 0 ? "text-up" : "text-down"}>GEX: {val > 0 ? "+" : ""}{val}M</p>
    </div>
  );
};

interface Props { ticker?: string; redact?: boolean }

const GammaLevelsChart = ({ ticker = "SPY", redact = false }: Props) => {
  return (
    <div className="card-terminal p-2">
      <div className="flex items-center justify-between mb-4">
        <div>
          <h3 className="text-sm font-mono font-bold text-foreground uppercase tracking-wider">Gamma Exposure (GEX) — {ticker}</h3>
          <p className="text-[10px] font-mono text-muted-foreground mt-0.5">Dealer gamma by strike · Pin at $594</p>
        </div>
        <div className="flex items-center gap-4 text-[10px] font-mono">
          <div className="flex items-center gap-1.5"><div className="w-2.5 h-2.5 bg-chart-up" /><span className="text-muted-foreground">Call Wall</span></div>
          <div className="flex items-center gap-1.5"><div className="w-2.5 h-2.5 bg-chart-down" /><span className="text-muted-foreground">Put Wall</span></div>
        </div>
      </div>
      {redact ? (
        <div className="h-[260px] flex items-center justify-center text-muted-foreground font-mono text-xs">•• REDACTED ••</div>
      ) : (
        <ExpandableResponsiveContainer width="100%" height={260}>
          <BarChart data={gammaData} margin={{ top: 5, right: 10, left: -10, bottom: 0 }}>
            <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" vertical={false} />
            <XAxis dataKey="strike" tick={{ fontSize: 10, fill: "hsl(var(--muted-foreground))", fontFamily: "monospace" }} tickFormatter={(v) => `$${v}`} stroke="hsl(var(--border))" />
            <YAxis tick={{ fontSize: 10, fill: "hsl(var(--muted-foreground))", fontFamily: "monospace" }} tickFormatter={(v) => `${v}M`} stroke="hsl(var(--border))" />
            <Tooltip content={<CustomTooltip />} />
            <ReferenceLine y={0} stroke="hsl(var(--muted-foreground))" />
            <ReferenceLine x={594} stroke="hsl(var(--accent))" strokeDasharray="4 4" strokeWidth={1} />
            <Bar dataKey="gamma">
              {gammaData.map((entry, i) => (
                <Cell key={i} fill={entry.gamma >= 0 ? "hsl(var(--positive))" : "hsl(var(--negative))"} fillOpacity={0.85} />
              ))}
            </Bar>
          </BarChart>
        </ExpandableResponsiveContainer>
      )}
    </div>
  );
};

export default GammaLevelsChart;
