// OVME Skew — IV vs strike per expiry, parabolic smile across three tenors.
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

const TENORS = [
  { key: "0DTE", days: 1,  color: "hsl(var(--accent))" },
  { key: "1M",   days: 30, color: "#f59e0b" },
  { key: "3M",   days: 90, color: "hsl(var(--positive))" },
];

function strikes(atm: number) {
  const step = 5;
  return Array.from({ length: 15 }, (_, i) => atm - 35 + i * step);
}

function iv(K: number, spot: number, days: number, baseVol: number) {
  const m = (K - spot) / spot;
  const termAdj = -2 - Math.log(days + 1) * 0.6;
  const smile = m * m * 2200;
  const putSkew = m < 0 ? -m * 80 : 0;
  return Math.max(5, baseVol + termAdj + smile + putSkew);
}

interface Props { deal: OvmeDeal; redact?: boolean; liveIvAt?: (strike: number, dte: number) => number | null }

export default function OvmeSkew({ deal, redact = false, liveIvAt }: Props) {
  const ks = strikes(deal.strike);
  const data = ks.map((K) => {
    const row: Record<string, number> = { K };
    for (const t of TENORS) row[t.key] = Math.round((liveIvAt?.(K, t.days) ?? iv(K, deal.spot, t.days, deal.vol + 8)) * 10) / 10;
    return row;
  });

  // Skew metrics on the 1M tenor (proxy for 25Δ ≈ ±5% strike offset)
  const atm = liveIvAt?.(deal.spot, 30) ?? iv(deal.spot, deal.spot, 30, deal.vol + 8);
  const put25 = liveIvAt?.(deal.spot * 0.95, 30) ?? iv(deal.spot * 0.95, deal.spot, 30, deal.vol + 8);
  const call25 = liveIvAt?.(deal.spot * 1.05, 30) ?? iv(deal.spot * 1.05, deal.spot, 30, deal.vol + 8);
  const rr25 = call25 - put25;
  const bf25 = (put25 + call25) / 2 - atm;
  const slope = (put25 - call25) / 10; // per %
  const skewPercentile = Math.max(0, Math.min(100, (put25 - call25) * 8));
  const r = (n: number) => redact ? "••" : n.toFixed(2);

  return (
    <div className="space-y-3">
      <div className="card-terminal p-2">
        <div className="flex items-center justify-between mb-2">
          <span className="text-[10px] font-mono uppercase text-muted-foreground">Skew Metrics — {deal.ticker} · 1M</span>
          <span className="text-[9px] font-mono text-muted-foreground">25Δ ≈ ±5% strike</span>
        </div>
        <div className="grid grid-cols-3 md:grid-cols-6 gap-2 text-xs font-mono">
          <Cell label="ATM IV"      value={`${r(atm)}%`} tone="accent" />
          <Cell label="25Δ PUT IV"  value={`${r(put25)}%`} tone="down" />
          <Cell label="25Δ CALL IV" value={`${r(call25)}%`} tone="up" />
          <Cell label="25Δ RR"      value={r(rr25)} tone={rr25 >= 0 ? "up" : "down"} />
          <Cell label="25Δ BF"      value={r(bf25)} tone="accent" />
          <Cell label="SKEW %ILE"   value={redact ? "••" : `${skewPercentile.toFixed(0)}%`} tone="accent" />
        </div>
        <div className="mt-2 grid grid-cols-2 gap-3 text-[10px] font-mono text-muted-foreground">
          <div><span className="text-accent">RR</span> = IV(25ΔC) − IV(25ΔP). Negative = put-skew (typical equity).</div>
          <div><span className="text-accent">BF</span> = (IV(25ΔP)+IV(25ΔC))/2 − ATM. Wings premium.</div>
        </div>
      </div>

      <div className="card-terminal p-2">
      <h3 className="text-xs font-mono font-bold text-accent uppercase tracking-wider mb-3">IV Skew — {deal.ticker} · slope {redact ? "••" : slope.toFixed(3)}</h3>
      {redact ? (
        <div className="h-[420px] flex items-center justify-center text-muted-foreground font-mono text-xs">•• REDACTED ••</div>
      ) : (
        <ExpandableResponsiveContainer width="100%" height={420}>
          <LineChart data={data} margin={{ top: 5, right: 10, left: -10, bottom: 0 }}>
            <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
            <XAxis dataKey="K" tick={{ fontSize: 10, fill: "hsl(var(--muted-foreground))", fontFamily: "monospace" }} stroke="hsl(var(--border))" />
            <YAxis tick={{ fontSize: 10, fill: "hsl(var(--muted-foreground))", fontFamily: "monospace" }} stroke="hsl(var(--border))" tickFormatter={(v) => `${v}%`} domain={[0, 60]} />
            <Tooltip contentStyle={{ background: "hsl(var(--card))", border: "1px solid hsl(var(--border))", fontFamily: "monospace", fontSize: 10 }} />
            <Legend wrapperStyle={{ fontSize: 10, fontFamily: "monospace" }} />
            {TENORS.map((t) => (
              <Line key={t.key} type="monotone" dataKey={t.key} stroke={t.color} strokeWidth={2} dot={false} />
            ))}
          </LineChart>
        </ExpandableResponsiveContainer>
      )}
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
