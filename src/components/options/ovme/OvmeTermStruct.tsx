// OVME Term Struct — ATM / 25Δ Put / 25Δ Call IV across DTE buckets.
import { OvmeDeal } from "./OvmeWorkspace";
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

const BUCKETS = [
  { label: "0DTE", days: 1 },
  { label: "1D",   days: 1 },
  { label: "5D",   days: 5 },
  { label: "2W",   days: 14 },
  { label: "1M",   days: 30 },
  { label: "2M",   days: 60 },
  { label: "3M",   days: 90 },
  { label: "6M",   days: 180 },
];

interface Props { deal: OvmeDeal; redact?: boolean; liveIvAt?: (strike: number, dte: number) => number | null }

export default function OvmeTermStruct({ deal, redact = false, liveIvAt }: Props) {
  const base = deal.vol;
  const data = BUCKETS.map((b) => {
    const atm = Math.round((liveIvAt?.(deal.spot, b.days) ?? (base + 3 + Math.log(b.days + 1) * 0.3)) * 100) / 100;
    const putSkew = 2.5 + Math.log(b.days + 1) * 0.2;
    const callSkew = 1.5 + Math.log(b.days + 1) * 0.15;
    return {
      label: b.label,
      ATM: atm,
      "25Δ Put": Math.round((atm + putSkew) * 100) / 100,
      "25Δ Call": Math.round((atm + callSkew) * 100) / 100,
    };
  });

  const front = data[0].ATM;
  const back = data[data.length - 1].ATM;
  const basis = back - front;
  const regime = basis >= 0 ? "CONTANGO" : "BACKWARDATION";
  const r = (n: number) => redact ? "••" : n.toFixed(2);
  // Mock event stubs at 1M, 2M
  const events = [{ at: "1M", kind: "FOMC" }, { at: "2M", kind: "CPI" }, { at: "3M", kind: "EARN" }];

  return (
    <div className="space-y-3">
      <div className="card-terminal p-2">
        <div className="flex items-center justify-between mb-2">
          <span className="text-[10px] font-mono uppercase text-muted-foreground">Term Metrics — {deal.ticker}</span>
          <span className={`text-[9px] font-mono font-bold ${basis >= 0 ? "text-up" : "text-down"}`}>{regime}</span>
        </div>
        <div className="grid grid-cols-3 md:grid-cols-6 gap-2 text-xs font-mono">
          <Cell label="FRONT (0DTE)" value={`${r(front)}%`} tone="accent" />
          <Cell label="BACK (6M)"   value={`${r(back)}%`}  tone="accent" />
          <Cell label="BASIS"       value={r(basis)}       tone={basis >= 0 ? "up" : "down"} />
          <Cell label="1M / 3M"     value={`${r(data[4].ATM / data[6].ATM)}`} />
          <Cell label="VRP (proxy)" value={r(basis + 1.5)} tone="accent" />
          <Cell label="EVENTS"      value={`${events.length}`} tone="neutral" />
        </div>
      </div>

      <div className="card-terminal p-2">
        <h3 className="text-xs font-mono font-bold text-accent uppercase tracking-wider mb-3">IV Term Structure — {deal.ticker}</h3>
        {redact ? (
          <div className="h-[420px] flex items-center justify-center text-muted-foreground font-mono text-xs">•• REDACTED ••</div>
        ) : (
          <ExpandableResponsiveContainer width="100%" height={420}>
            <LineChart data={data} margin={{ top: 5, right: 10, left: -10, bottom: 0 }}>
              <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
              <XAxis dataKey="label" tick={{ fontSize: 10, fill: "hsl(var(--muted-foreground))", fontFamily: "monospace" }} stroke="hsl(var(--border))" />
              <YAxis tick={{ fontSize: 10, fill: "hsl(var(--muted-foreground))", fontFamily: "monospace" }} stroke="hsl(var(--border))" tickFormatter={(v) => `${v}%`} domain={[0, "auto"]} />
              <Tooltip contentStyle={{ background: "hsl(var(--card))", border: "1px solid hsl(var(--border))", fontFamily: "monospace", fontSize: 10 }} />
              <Legend wrapperStyle={{ fontSize: 10, fontFamily: "monospace" }} />
              <Line type="monotone" dataKey="ATM"      stroke="hsl(var(--accent))"   strokeWidth={2.2} dot={{ r: 3 }} />
              <Line type="monotone" dataKey="25Δ Put"  stroke="hsl(var(--negative))" strokeWidth={1.6} strokeDasharray="4 3" dot={{ r: 2 }} />
              <Line type="monotone" dataKey="25Δ Call" stroke="hsl(var(--positive))" strokeWidth={1.6} strokeDasharray="4 3" dot={{ r: 2 }} />
            </LineChart>
          </ExpandableResponsiveContainer>
        )}
        <div className="mt-2 flex flex-wrap gap-2 text-[9px] font-mono">
          {events.map((e) => (
            <span key={e.at} className="border border-accent/40 text-accent px-1.5 py-0.5">⚑ {e.at} · {e.kind}</span>
          ))}
        </div>
      </div>
    </div>
  );
}

function Cell({ label, value, tone }: { label: string; value: string; tone?: "up" | "down" | "accent" | "neutral" }) {
  const c = tone === "up" ? "text-up" : tone === "down" ? "text-down" : tone === "accent" ? "text-accent" : "text-foreground";
  return (
    <div className="border border-border bg-surface-elevated px-2 py-1.5">
      <div className="text-[9px] uppercase text-muted-foreground tracking-wider">{label}</div>
      <div className={`text-sm font-bold tabular-nums ${c}`}>{value}</div>
    </div>
  );
}
