// OVME Backtester — strategy builder + mock historical backtest.
import { useMemo, useState } from "react";
import { OvmeDeal } from "./OvmeWorkspace";
import { runBacktest, STRATEGY_PRESETS, Leg, BacktestFilter } from "../shared/mockBacktest";
import {
  LineChart,
  Line,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  Tooltip,
  ReferenceLine,
} from 'recharts';
import { fmtUsd } from "../shared/mockSeries";
import { toast } from "@/components/ui/use-toast";
import { apiPost } from "@/lib/api";
import { ExpandableResponsiveContainer } from '@/components/shared/ExpandChart';

interface Props { deal: OvmeDeal; redact?: boolean }

export default function OvmeBacktest({ deal, redact }: Props) {
  const [legs, setLegs] = useState<Leg[]>(STRATEGY_PRESETS["Bull Call Spread"]);
  const [filter, setFilter] = useState<BacktestFilter>({ ivBucket: "all", term: "all", skew: "all" });
  const [templateName, setTemplateName] = useState("");
  const [saving, setSaving] = useState(false);

  const stats = useMemo(() => runBacktest(deal.ticker, legs, filter), [deal.ticker, legs, filter]);

  const addLeg = () => {
    if (legs.length >= 4) return;
    setLegs([...legs, { id: String(Date.now()), side: "LONG", type: "CALL", strikeOffset: 0, expiryDays: 30, qty: 1 }]);
  };
  const removeLeg = (id: string) => setLegs(legs.filter(l => l.id !== id));
  const updateLeg = (id: string, patch: Partial<Leg>) =>
    setLegs(legs.map(l => l.id === id ? { ...l, ...patch } : l));

  const saveTemplate = async () => {
    if (!templateName.trim()) { toast({ title: "Name required" }); return; }
    setSaving(true);
    try {
      await apiPost('/api/option-strategy-templates', {
        ticker: deal.ticker, name: templateName, legs,
        stats: { winRate: stats.winRate, sharpe: stats.sharpe, profitFactor: stats.profitFactor, totalPnl: stats.totalPnl },
      });
      toast({ title: "Template saved" });
      setTemplateName("");
    } catch (e: any) { toast({ title: "Save failed", description: e.message }); }
    finally { setSaving(false); }
  };

  const equityData = stats.equityCurve.map((v, i) => ({ i, v }));

  return (
    <div className="space-y-3">
      {/* Preset chips */}
      <div className="flex flex-wrap gap-1.5">
        {Object.keys(STRATEGY_PRESETS).map(name => (
          <button key={name} onClick={() => setLegs(STRATEGY_PRESETS[name])}
            className="px-2 py-1 text-[9px] font-mono border border-border bg-surface-elevated hover:border-accent hover:text-accent uppercase tracking-wider">
            {name}
          </button>
        ))}
      </div>

      {/* Builder */}
      <div className="border border-border bg-surface-deep p-3">
        <div className="flex items-center justify-between mb-2">
          <div className="text-[10px] font-mono font-bold text-accent uppercase tracking-wider">Legs ({legs.length}/4)</div>
          <button onClick={addLeg} disabled={legs.length >= 4}
            className="text-[9px] font-mono text-accent disabled:opacity-30">+ Add Leg</button>
        </div>
        <table className="w-full text-[10px] font-mono">
          <thead className="bg-surface-elevated text-muted-foreground">
            <tr>
              <th className="px-2 py-1 text-left">Side</th>
              <th className="px-2 py-1 text-left">Type</th>
              <th className="px-2 py-1 text-right">Strike ±$</th>
              <th className="px-2 py-1 text-right">DTE</th>
              <th className="px-2 py-1 text-right">Qty</th>
              <th className="px-2 py-1"></th>
            </tr>
          </thead>
          <tbody>
            {legs.map(l => (
              <tr key={l.id} className="border-t border-border">
                <td className="px-2 py-1">
                  <select value={l.side} onChange={e => updateLeg(l.id, { side: e.target.value as Leg["side"] })}
                    className="bg-transparent border border-border px-1 text-[10px] font-mono">
                    <option>LONG</option><option>SHORT</option>
                  </select>
                </td>
                <td className="px-2 py-1">
                  <select value={l.type} onChange={e => updateLeg(l.id, { type: e.target.value as Leg["type"] })}
                    className="bg-transparent border border-border px-1 text-[10px] font-mono">
                    <option>CALL</option><option>PUT</option>
                  </select>
                </td>
                <td className="px-2 py-1">
                  <input type="number" value={l.strikeOffset} onChange={e => updateLeg(l.id, { strikeOffset: parseFloat(e.target.value) || 0 })}
                    className="w-16 bg-transparent border border-border px-1 text-right tabular-nums" />
                </td>
                <td className="px-2 py-1">
                  <input type="number" value={l.expiryDays} onChange={e => updateLeg(l.id, { expiryDays: parseInt(e.target.value) || 1 })}
                    className="w-14 bg-transparent border border-border px-1 text-right tabular-nums" />
                </td>
                <td className="px-2 py-1">
                  <input type="number" value={l.qty} onChange={e => updateLeg(l.id, { qty: parseInt(e.target.value) || 1 })}
                    className="w-12 bg-transparent border border-border px-1 text-right tabular-nums" />
                </td>
                <td className="px-2 py-1 text-right">
                  {legs.length > 1 && <button onClick={() => removeLeg(l.id)} className="text-down hover:opacity-70">×</button>}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* Regime slicer */}
      <div className="flex flex-wrap items-center gap-3 border border-border bg-surface-deep px-3 py-2">
        <span className="text-[9px] font-mono uppercase tracking-wider text-muted-foreground">Regime Filter</span>
        {(["ivBucket", "term", "skew"] as const).map(key => (
          <div key={key} className="flex items-center gap-1">
            <span className="text-[9px] font-mono text-muted-foreground">{key === "ivBucket" ? "IV" : key.toUpperCase()}</span>
            <select value={(filter as any)[key]} onChange={e => setFilter({ ...filter, [key]: e.target.value as any })}
              className="bg-transparent border border-border px-1 text-[10px] font-mono">
              {key === "ivBucket" && <><option value="all">all</option><option value="low">low</option><option value="mid">mid</option><option value="high">high</option></>}
              {key === "term" && <><option value="all">all</option><option value="contango">contango</option><option value="backwardation">backwardation</option></>}
              {key === "skew" && <><option value="all">all</option><option value="steep">steep</option><option value="flat">flat</option></>}
            </select>
          </div>
        ))}
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-7 gap-1.5">
        {[
          { l: "TRADES", v: stats.trades.toString() },
          { l: "WIN%", v: redact ? "••" : `${stats.winRate}%`, tone: stats.winRate >= 55 ? "up" : "down" },
          { l: "AVG P&L", v: redact ? "••" : fmtUsd(stats.avgPnl), tone: stats.avgPnl >= 0 ? "up" : "down" },
          { l: "TOTAL", v: redact ? "••" : fmtUsd(stats.totalPnl), tone: stats.totalPnl >= 0 ? "up" : "down" },
          { l: "MAX DD", v: redact ? "••" : fmtUsd(-stats.maxDD), tone: "down" },
          { l: "SHARPE", v: redact ? "••" : stats.sharpe.toFixed(2), tone: stats.sharpe >= 1 ? "up" : "neutral" },
          { l: "PF", v: redact ? "••" : stats.profitFactor.toFixed(2), tone: stats.profitFactor >= 1.2 ? "up" : "down" },
        ].map(s => (
          <div key={s.l} className="border border-border bg-surface-elevated px-2 py-1.5">
            <div className="text-[9px] font-mono uppercase tracking-wider text-muted-foreground">{s.l}</div>
            <div className={`text-[12px] font-mono font-bold tabular-nums ${s.tone === "up" ? "text-up" : s.tone === "down" ? "text-down" : "text-foreground"}`}>{s.v}</div>
          </div>
        ))}
      </div>

      {/* Equity curve + histogram */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-3">
        <div className="border border-border bg-surface-deep p-3">
          <div className="text-[10px] font-mono font-bold text-accent uppercase tracking-wider mb-2">Equity Curve</div>
          <div className="h-[200px]">
            <ExpandableResponsiveContainer>
              <LineChart data={equityData}>
                <XAxis dataKey="i" hide />
                <YAxis tick={{ fontSize: 9, fontFamily: "monospace", fill: "hsl(var(--muted-foreground))" }} />
                <ReferenceLine y={0} stroke="hsl(var(--border))" />
                <Tooltip contentStyle={{ background: "hsl(var(--surface-deep))", border: "1px solid hsl(var(--border))", fontSize: 10, fontFamily: "monospace" }}
                  formatter={(v: number) => [redact ? "••" : fmtUsd(v), "Equity"]} />
                <Line dataKey="v" stroke="hsl(var(--accent))" strokeWidth={1.5} dot={false} />
              </LineChart>
            </ExpandableResponsiveContainer>
          </div>
        </div>
        <div className="border border-border bg-surface-deep p-3">
          <div className="text-[10px] font-mono font-bold text-accent uppercase tracking-wider mb-2">P&L Distribution</div>
          <div className="h-[200px]">
            <ExpandableResponsiveContainer>
              <BarChart data={stats.histogram}>
                <XAxis dataKey="bucket" tick={{ fontSize: 8, fontFamily: "monospace", fill: "hsl(var(--muted-foreground))" }} />
                <YAxis tick={{ fontSize: 9, fontFamily: "monospace", fill: "hsl(var(--muted-foreground))" }} />
                <Tooltip contentStyle={{ background: "hsl(var(--surface-deep))", border: "1px solid hsl(var(--border))", fontSize: 10, fontFamily: "monospace" }} />
                <Bar dataKey="count" fill="hsl(var(--accent))" />
              </BarChart>
            </ExpandableResponsiveContainer>
          </div>
        </div>
      </div>

      {/* Save template */}
      <div className="flex items-center gap-2 border border-border bg-surface-deep px-3 py-2">
        <span className="text-[9px] font-mono uppercase tracking-wider text-muted-foreground">Save Template</span>
        <input value={templateName} onChange={e => setTemplateName(e.target.value)} placeholder="e.g. SPY 30d call spread"
          className="flex-1 bg-surface-elevated border border-border px-2 py-1 text-[10px] font-mono focus:outline-none focus:border-accent" />
        <button onClick={saveTemplate} disabled={saving}
          className="px-3 py-1 text-[10px] font-mono bg-accent text-accent-foreground font-bold disabled:opacity-50">
          {saving ? "..." : "SAVE"}
        </button>
      </div>
    </div>
  );
}
