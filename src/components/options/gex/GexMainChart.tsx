// Main strike-level GEX chart with overlays, key-level annotations, and click-through.
import {
  ComposedChart,
  Bar,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ReferenceLine,
  ReferenceArea,
  Cell,
} from 'recharts';
import { fmtUsd, GexKeyLevels } from "../shared/mockSeries";
import { ExpandableResponsiveContainer } from '@/components/shared/ExpandChart';

interface Row { strike: number; gex: number; oi: number; vol: number }
interface Props {
  ticker: string;
  data: Row[];
  levels: GexKeyLevels;
  onSelectStrike?: (strike: number) => void;
  redact?: boolean;
}

const T = ({ active, payload, label }: any) => {
  if (!active || !payload?.length) return null;
  const d = payload[0].payload;
  return (
    <div className="bg-surface-deep border border-border p-2 font-mono text-[10px] shadow-lg">
      <div className="text-accent font-bold mb-1">Strike ${label}</div>
      <div>$GEX <span className={d.gex >= 0 ? "text-up" : "text-down"}>{fmtUsd(d.gex)}</span></div>
      <div>OI {d.oi.toLocaleString()}</div>
      <div>Vol {d.vol.toLocaleString()}</div>
      <div className="text-muted-foreground mt-1">click bar to drill down</div>
    </div>
  );
};

export default function GexMainChart({ ticker, data, levels, onSelectStrike, redact }: Props) {
  const maxOi = Math.max(...data.map((d) => d.oi), 1);
  // Scale OI to live in chart space (small ghost bars).
  const maxGex = Math.max(...data.map((d) => Math.abs(d.gex)), 1);
  const scaledOi = data.map((d) => ({ ...d, oiScaled: (d.oi / maxOi) * maxGex * 0.4 }));

  const xMin = data[0]?.strike;
  const xMax = data[data.length - 1]?.strike;

  const annotations: { x: number; label: string; tone: "up" | "down" | "accent" }[] = [
    { x: levels.callWall, label: "CALL WALL", tone: "up" },
    { x: levels.putWall, label: "PUT WALL", tone: "down" },
    { x: levels.maxPain, label: "MAX PAIN", tone: "accent" },
    { x: levels.flip, label: "Γ FLIP", tone: "accent" },
  ];
  const toneColor = (t: "up" | "down" | "accent") => t === "up" ? "hsl(var(--positive))" : t === "down" ? "hsl(var(--negative))" : "hsl(var(--accent))";

  return (
    <div className="card-terminal p-2">
      <div className="flex items-center justify-between mb-2">
        <div>
          <h3 className="text-sm font-mono font-bold text-foreground uppercase tracking-wider">GEX by Strike — {ticker}</h3>
          <p className="text-[10px] font-mono text-muted-foreground mt-0.5">
            Spot <span className="text-accent">${levels.spot}</span> · VWAP <span className="text-foreground">${levels.vwap}</span> · PDH <span className="text-up">${levels.pdh}</span> · PDL <span className="text-down">${levels.pdl}</span>
          </p>
        </div>
        <div className="flex items-center gap-3 text-[9px] font-mono text-muted-foreground">
          <span className="flex items-center gap-1"><span className="w-3 h-2.5" style={{ background: "hsl(var(--positive))" }} />+GEX</span>
          <span className="flex items-center gap-1"><span className="w-3 h-2.5" style={{ background: "hsl(var(--negative))" }} />−GEX</span>
          <span className="flex items-center gap-1"><span className="w-3 h-2.5 opacity-30" style={{ background: "hsl(var(--bb-blue))" }} />OI</span>
          <span className="flex items-center gap-1"><span className="w-3 h-px" style={{ background: "hsl(var(--accent))" }} />zero-Γ band</span>
        </div>
      </div>

      {redact ? (
        <div className="h-[320px] flex items-center justify-center text-muted-foreground font-mono text-xs">•• REDACTED ••</div>
      ) : (
        <ExpandableResponsiveContainer width="100%" height={340}>
          <ComposedChart data={scaledOi} margin={{ top: 28, right: 10, left: -10, bottom: 0 }}>
            <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" vertical={false} />
            <XAxis dataKey="strike" tick={{ fontSize: 9, fill: "hsl(var(--muted-foreground))", fontFamily: "monospace" }} tickFormatter={(v) => `${v}`} stroke="hsl(var(--border))" type="number" domain={[xMin, xMax]} />
            <YAxis tick={{ fontSize: 9, fill: "hsl(var(--muted-foreground))", fontFamily: "monospace" }} tickFormatter={(v) => `${(v / 1e6).toFixed(0)}M`} stroke="hsl(var(--border))" />
            <Tooltip content={<T />} cursor={{ fill: "hsl(var(--accent) / 0.08)" }} />

            {/* Historical zero-gamma band */}
            <ReferenceArea x1={levels.zeroGBand.lo} x2={levels.zeroGBand.hi} fill="hsl(var(--accent))" fillOpacity={0.08} stroke="hsl(var(--accent))" strokeOpacity={0.3} strokeDasharray="2 4" />

            {/* Zero baseline */}
            <ReferenceLine y={0} stroke="hsl(var(--border))" />

            {/* Price-action overlays */}
            <ReferenceLine x={levels.pdl} stroke="hsl(var(--negative))" strokeOpacity={0.4} strokeDasharray="2 3" />
            <ReferenceLine x={levels.pdh} stroke="hsl(var(--positive))" strokeOpacity={0.4} strokeDasharray="2 3" />
            <ReferenceLine x={levels.vwap} stroke="hsl(var(--muted-foreground))" strokeDasharray="1 3" />
            <ReferenceLine x={levels.spot} stroke="hsl(var(--accent))" strokeWidth={1.5} label={{ value: `SPOT ${levels.spot}`, fill: "hsl(var(--accent))", fontSize: 9, fontFamily: "monospace", position: "top" }} />

            {/* Key-level annotations */}
            {annotations.map((a) => (
              <ReferenceLine
                key={a.label}
                x={a.x}
                stroke={toneColor(a.tone)}
                strokeOpacity={0.55}
                strokeDasharray="4 3"
                label={{ value: a.label, fill: toneColor(a.tone), fontSize: 8, fontFamily: "monospace", position: "top" }}
              />
            ))}

            {/* OI ghost bars */}
            <Bar dataKey="oiScaled" fill="hsl(var(--bb-blue))" fillOpacity={0.18} barSize={14} />

            {/* GEX signed bars */}
            <Bar dataKey="gex" barSize={10} onClick={(d: any) => onSelectStrike?.(d.strike)} cursor="pointer">
              {scaledOi.map((d, i) => (
                <Cell key={i} fill={d.gex >= 0 ? "hsl(var(--positive))" : "hsl(var(--negative))"} fillOpacity={0.9} />
              ))}
            </Bar>

            {/* Volume line */}
            <Line type="monotone" dataKey="vol" stroke="hsl(var(--bb-amber))" strokeWidth={1} dot={false} strokeOpacity={0.55} />
          </ComposedChart>
        </ExpandableResponsiveContainer>
      )}
    </div>
  );
}
