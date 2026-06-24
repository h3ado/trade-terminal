// Earnings & Event Playbook — implied move, history, IV crush model, structure suggestions.
import { useMemo } from "react";
import EarnHistoryTable from "./EarnHistoryTable";
import EarnCalendarRail from "./EarnCalendarRail";
import EarnStructureSuggest from "./EarnStructureSuggest";
import { ExpandableResponsiveContainer } from '@/components/shared/ExpandChart';
import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  Tooltip,
  CartesianGrid,
  ReferenceLine,
} from 'recharts';

interface Props { ticker: string; redact?: boolean; }

function hash(s: string): number { let h = 2166136261; for (let i = 0; i < s.length; i++) { h ^= s.charCodeAt(i); h = Math.imul(h, 16777619); } return h >>> 0; }
function rng(seed: number) { let a = seed; return () => { a |= 0; a = (a + 0x6D2B79F5) | 0; let t = a; t = Math.imul(t ^ (t >>> 15), t | 1); t ^= t + Math.imul(t ^ (t >>> 7), t | 61); return ((t ^ (t >>> 14)) >>> 0) / 4294967296; }; }

function pad(n: number) { return n < 10 ? "0" + n : "" + n; }

export default function EarnPlaybook({ ticker, redact = false }: Props) {
  const data = useMemo(() => {
    const r = rng(hash(ticker + ":earn"));
    const dte = Math.floor(r() * 30) + 2;
    const date = new Date(Date.now() + dte * 86400000);
    const spot = +(50 + r() * 600).toFixed(2);
    const impliedMovePct = +(2.5 + r() * 6).toFixed(2);
    const straddle = +(spot * impliedMovePct / 100).toFixed(2);
    const ivPre = +(45 + r() * 50).toFixed(1);
    const ivPost = +(ivPre * (0.4 + r() * 0.2)).toFixed(1);
    const histAvg = +(impliedMovePct * (0.7 + r() * 0.6)).toFixed(2);
    const crush = Array.from({ length: 8 }, (_, i) => ({
      day: i - 3,
      iv: i < 3 ? +(ivPre * (0.95 + i * 0.02 + r() * 0.02)).toFixed(1)
        : i === 3 ? ivPre
        : +(ivPre - (ivPre - ivPost) * Math.min(1, (i - 3) / 2)).toFixed(1),
    }));
    return { dte, date, spot, impliedMovePct, straddle, ivPre, ivPost, histAvg, crush };
  }, [ticker]);

  return (
    <div className="space-y-3">
      <EarnCalendarRail ticker={ticker} />

      <div className="grid grid-cols-2 md:grid-cols-6 gap-px bg-border border border-border">
        {[
          { l: "Next event", v: `${data.date.getUTCFullYear()}-${pad(data.date.getUTCMonth()+1)}-${pad(data.date.getUTCDate())}` },
          { l: "DTE", v: `${data.dte}d`, c: "text-accent" },
          { l: "Spot", v: redact ? "••" : data.spot.toFixed(2) },
          { l: "ATM straddle", v: redact ? "••" : `$${data.straddle}` },
          { l: "Implied move", v: redact ? "••" : `±${data.impliedMovePct}%`, c: "text-accent" },
          { l: "8q avg move", v: redact ? "••" : `±${data.histAvg}%` },
        ].map(s => (
          <div key={s.l} className="bg-surface-deep px-3 py-1.5">
            <div className="text-[8px] font-mono text-muted-foreground uppercase tracking-wider">{s.l}</div>
            <div className={`text-[12px] font-mono font-bold tabular-nums ${s.c ?? "text-foreground"}`}>{s.v}</div>
          </div>
        ))}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-3">
        <div className="card-terminal p-2">
          <div className="flex items-baseline gap-2 mb-2">
            <span className="text-[10px] font-mono font-bold text-accent">IV CRUSH MODEL</span>
            <span className="text-[9px] font-mono text-muted-foreground">Front IV pre/post event · {ticker}</span>
          </div>
          <ExpandableResponsiveContainer width="100%" height={200}>
            <LineChart data={data.crush} margin={{ top: 4, right: 8, left: -16, bottom: 0 }}>
              <CartesianGrid stroke="hsl(var(--border))" strokeDasharray="2 3" />
              <XAxis dataKey="day" tick={{ fontSize: 9, fontFamily: "monospace", fill: "hsl(var(--muted-foreground))" }}
                label={{ value: "Days from print", fill: "hsl(var(--muted-foreground))", fontSize: 9, position: "insideBottom", offset: -2 }} />
              <YAxis tick={{ fontSize: 9, fontFamily: "monospace", fill: "hsl(var(--muted-foreground))" }} />
              <Tooltip contentStyle={{ background: "hsl(var(--surface-deep))", border: "1px solid hsl(var(--border))", fontFamily: "monospace", fontSize: 10 }} />
              <ReferenceLine x={0} stroke="hsl(var(--accent))" strokeDasharray="2 3" label={{ value: "Print", fill: "hsl(var(--accent))", fontSize: 9 }} />
              <Line type="monotone" dataKey="iv" stroke="hsl(var(--accent))" strokeWidth={2} dot={{ r: 3 }} />
            </LineChart>
          </ExpandableResponsiveContainer>
          <div className="text-[9px] font-mono text-muted-foreground mt-1">
            Pre <span className="text-accent">{data.ivPre}%</span> → Post <span className="text-down">{data.ivPost}%</span>
            <span className="ml-2">(crush ≈ {((1 - data.ivPost / data.ivPre) * 100).toFixed(0)}%)</span>
          </div>
        </div>

        <EarnHistoryTable ticker={ticker} redact={redact} />
      </div>

      <EarnStructureSuggest ticker={ticker} ivRank={Math.round(data.ivPre)} expectedMove={data.impliedMovePct} histMove={data.histAvg} spot={data.spot} dte={data.dte} />
    </div>
  );
}
