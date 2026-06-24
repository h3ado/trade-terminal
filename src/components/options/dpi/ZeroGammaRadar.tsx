// Zero-gamma level radar with distance bar + 5d migration sparkline.
import { useMemo } from "react";
import {
  LineChart,
  Line,
  ReferenceLine,
  YAxis,
  Tooltip,
} from 'recharts';
import { seeded } from "../shared/mockSeries";
import { ExpandableResponsiveContainer } from '@/components/shared/ExpandChart';

interface Props { ticker: string; spot: number; zeroG: number; flipProb: number; redact?: boolean }

export default function ZeroGammaRadar({ ticker, spot, zeroG, flipProb, redact }: Props) {
  const data = useMemo(() => {
    const r = seeded(ticker, "zerog-mig");
    const arr: { t: string; zg: number }[] = [];
    let v = zeroG;
    for (let i = 5; i >= 0; i--) {
      arr.push({ t: `D-${i}`, zg: +v.toFixed(2) });
      v += (r() - 0.5) * 1.4;
    }
    return arr;
  }, [ticker, zeroG]);

  const distPct = ((zeroG - spot) / spot) * 100;
  const barPct = Math.min(100, Math.max(0, 50 + distPct * 8));

  return (
    <div className="border border-border bg-surface-deep p-3">
      <div className="flex items-center justify-between mb-2">
        <div className="text-[10px] font-mono font-bold text-accent uppercase tracking-wider">Zero-Γ Radar</div>
        <div className="text-[9px] font-mono text-muted-foreground">5d migration</div>
      </div>

      <div className="space-y-3">
        <div>
          <div className="flex justify-between text-[9px] font-mono text-muted-foreground mb-1">
            <span>SPOT {redact ? "••" : spot.toFixed(2)}</span>
            <span>ZERO-Γ {redact ? "••" : zeroG.toFixed(2)}</span>
            <span className={distPct >= 0 ? "text-up" : "text-down"}>{redact ? "••" : `${distPct >= 0 ? "+" : ""}${distPct.toFixed(2)}%`}</span>
          </div>
          <div className="relative h-2 bg-surface-elevated border border-border">
            <div className="absolute top-0 bottom-0 w-px bg-accent" style={{ left: "50%" }} />
            <div className={`absolute top-0 bottom-0 ${distPct >= 0 ? "bg-up/40" : "bg-down/40"}`}
              style={{ left: `${Math.min(50, barPct)}%`, width: `${Math.abs(barPct - 50)}%` }} />
          </div>
        </div>

        <div>
          <div className="text-[9px] font-mono text-muted-foreground mb-1">FLIP PROBABILITY (intraday)</div>
          <div className="relative h-3 bg-surface-elevated border border-border">
            <div className={`absolute inset-y-0 left-0 ${flipProb > 60 ? "bg-down/60" : flipProb > 35 ? "bg-accent/60" : "bg-up/60"}`}
              style={{ width: `${flipProb}%` }} />
            <div className="absolute inset-0 flex items-center justify-center text-[9px] font-mono font-bold">
              {redact ? "••" : `${flipProb}%`}
            </div>
          </div>
        </div>

        <div className="h-[110px]">
          <ExpandableResponsiveContainer>
            <LineChart data={data} margin={{ top: 4, right: 4, left: 4, bottom: 0 }}>
              <YAxis hide domain={["dataMin - 1", "dataMax + 1"]} />
              <ReferenceLine y={spot} stroke="hsl(var(--accent))" strokeDasharray="3 3" />
              <Tooltip
                contentStyle={{ background: "hsl(var(--surface-deep))", border: "1px solid hsl(var(--border))", fontSize: 10, fontFamily: "monospace" }}
                formatter={(v: number) => [redact ? "••" : v.toFixed(2), "Zero-Γ"]}
              />
              <Line dataKey="zg" stroke="hsl(var(--accent))" strokeWidth={1.5} dot={{ r: 2 }} />
            </LineChart>
          </ExpandableResponsiveContainer>
        </div>
      </div>
    </div>
  );
}
