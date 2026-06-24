// OMON sub-panel: build a multi-leg spread and inspect net cost + breakevens.
import { useMemo, useState } from "react";
import { ExpandableResponsiveContainer } from '@/components/shared/ExpandChart';
import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  ReferenceLine,
  Tooltip,
} from 'recharts';

type LegSide = "BUY" | "SELL";
type LegType = "C" | "P";
interface Leg { id: number; side: LegSide; type: LegType; strike: number; premium: number; qty: number }

const SEED: Leg[] = [
  { id: 1, side: "BUY",  type: "C", strike: 580, premium: 4.20, qty: 1 },
  { id: 2, side: "SELL", type: "C", strike: 590, premium: 1.85, qty: 1 },
];

interface Props { ticker?: string; redact?: boolean }

export default function SpreadBuilder({ ticker = "SPY", redact = false }: Props) {
  const [legs, setLegs] = useState<Leg[]>(SEED);
  const [spot, setSpot] = useState(582);

  const addLeg = () => setLegs([...legs, { id: Date.now(), side: "BUY", type: "C", strike: 585, premium: 2.5, qty: 1 }]);
  const removeLeg = (id: number) => setLegs(legs.filter((l) => l.id !== id));
  const updateLeg = (id: number, patch: Partial<Leg>) =>
    setLegs(legs.map((l) => (l.id === id ? { ...l, ...patch } : l)));

  const netDebit = useMemo(
    () => legs.reduce((s, l) => s + (l.side === "BUY" ? 1 : -1) * l.premium * l.qty, 0),
    [legs],
  );

  const payoff = useMemo(() => {
    const lo = spot * 0.85, hi = spot * 1.15;
    const out: { s: number; pnl: number }[] = [];
    for (let i = 0; i <= 80; i++) {
      const s = lo + ((hi - lo) * i) / 80;
      let total = 0;
      for (const l of legs) {
        const intrinsic = l.type === "C" ? Math.max(0, s - l.strike) : Math.max(0, l.strike - s);
        const legPnl = (intrinsic - l.premium) * (l.side === "BUY" ? 1 : -1) * l.qty;
        total += legPnl;
      }
      out.push({ s: Math.round(s * 100) / 100, pnl: Math.round(total * 100) / 100 });
    }
    return out;
  }, [legs, spot]);

  const breakevens = useMemo(() => {
    const bes: number[] = [];
    for (let i = 1; i < payoff.length; i++) {
      const a = payoff[i - 1], b = payoff[i];
      if ((a.pnl < 0 && b.pnl >= 0) || (a.pnl > 0 && b.pnl <= 0)) {
        const t = Math.abs(a.pnl) / (Math.abs(a.pnl) + Math.abs(b.pnl));
        bes.push(Math.round((a.s + t * (b.s - a.s)) * 100) / 100);
      }
    }
    return bes;
  }, [payoff]);

  const maxPnl = Math.max(...payoff.map((p) => p.pnl));
  const minPnl = Math.min(...payoff.map((p) => p.pnl));

  return (
    <div className="card-terminal p-2">
      <div className="flex items-center justify-between mb-3">
        <h3 className="text-sm font-mono font-bold text-foreground uppercase tracking-wider">{ticker} · Spread Builder</h3>
        <div className="flex items-center gap-2">
          <label className="text-[9px] font-mono text-muted-foreground">SPOT</label>
          <input
            type="number"
            value={spot}
            onChange={(e) => setSpot(parseFloat(e.target.value) || 0)}
            className="w-20 bg-surface-elevated border border-border px-1.5 py-0.5 text-[10px] font-mono text-foreground focus:outline-none focus:border-accent"
          />
          <button onClick={addLeg} className="px-2 py-0.5 text-[10px] font-mono bg-surface-elevated border border-border hover:border-accent text-foreground">
            + LEG
          </button>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        <div>
          <table className="w-full text-[10px] font-mono">
            <thead className="text-muted-foreground border-b border-border">
              <tr>
                <th className="text-left py-1">Side</th>
                <th className="text-left">Type</th>
                <th className="text-right">Strike</th>
                <th className="text-right">Prem</th>
                <th className="text-right">Qty</th>
                <th></th>
              </tr>
            </thead>
            <tbody>
              {legs.map((l) => (
                <tr key={l.id} className="border-b border-border/40">
                  <td className="py-1">
                    <select value={l.side} onChange={(e) => updateLeg(l.id, { side: e.target.value as LegSide })}
                      className={`bg-transparent border-0 outline-none ${l.side === "BUY" ? "text-emerald-400" : "text-rose-400"}`}>
                      <option value="BUY">BUY</option>
                      <option value="SELL">SELL</option>
                    </select>
                  </td>
                  <td>
                    <select value={l.type} onChange={(e) => updateLeg(l.id, { type: e.target.value as LegType })}
                      className="bg-transparent border-0 outline-none text-foreground">
                      <option value="C">CALL</option>
                      <option value="P">PUT</option>
                    </select>
                  </td>
                  <td className="text-right">
                    <input type="number" value={l.strike} step="1"
                      onChange={(e) => updateLeg(l.id, { strike: parseFloat(e.target.value) || 0 })}
                      className="w-16 bg-transparent border-0 text-right text-foreground outline-none" />
                  </td>
                  <td className="text-right">
                    <input type="number" value={l.premium} step="0.05"
                      onChange={(e) => updateLeg(l.id, { premium: parseFloat(e.target.value) || 0 })}
                      className="w-16 bg-transparent border-0 text-right text-foreground outline-none" />
                  </td>
                  <td className="text-right">
                    <input type="number" value={l.qty} step="1" min="1"
                      onChange={(e) => updateLeg(l.id, { qty: parseInt(e.target.value) || 1 })}
                      className="w-12 bg-transparent border-0 text-right text-foreground outline-none" />
                  </td>
                  <td className="text-right">
                    <button onClick={() => removeLeg(l.id)} className="text-muted-foreground hover:text-rose-400">✕</button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>

          <div className="grid grid-cols-2 gap-2 mt-4 text-[10px] font-mono">
            <div className="bg-surface-elevated p-2">
              <div className="text-muted-foreground text-[9px]">NET {netDebit >= 0 ? "DEBIT" : "CREDIT"}</div>
              <div className={`text-sm font-bold ${netDebit >= 0 ? "text-rose-400" : "text-emerald-400"}`}>
                {redact ? "••" : `$${Math.abs(netDebit * 100).toFixed(0)}`}
              </div>
            </div>
            <div className="bg-surface-elevated p-2">
              <div className="text-muted-foreground text-[9px]">MAX P&L</div>
              <div className="text-sm font-bold text-emerald-400">{redact ? "••" : `$${(maxPnl * 100).toFixed(0)}`}</div>
            </div>
            <div className="bg-surface-elevated p-2">
              <div className="text-muted-foreground text-[9px]">MAX LOSS</div>
              <div className="text-sm font-bold text-rose-400">{redact ? "••" : `$${(minPnl * 100).toFixed(0)}`}</div>
            </div>
            <div className="bg-surface-elevated p-2">
              <div className="text-muted-foreground text-[9px]">BREAKEVENS</div>
              <div className="text-sm font-bold text-foreground">{breakevens.length ? breakevens.join(" / ") : "—"}</div>
            </div>
          </div>
        </div>

        <div>
          {redact ? (
            <div className="h-[260px] flex items-center justify-center text-muted-foreground font-mono text-xs">•• REDACTED ••</div>
          ) : (
            <ExpandableResponsiveContainer width="100%" height={260}>
              <LineChart data={payoff} margin={{ top: 5, right: 10, left: -10, bottom: 0 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
                <XAxis dataKey="s" tick={{ fontSize: 9, fill: "hsl(var(--muted-foreground))", fontFamily: "monospace" }} stroke="hsl(var(--border))" />
                <YAxis tick={{ fontSize: 9, fill: "hsl(var(--muted-foreground))", fontFamily: "monospace" }} stroke="hsl(var(--border))" />
                <Tooltip contentStyle={{ background: "hsl(var(--card))", border: "1px solid hsl(var(--border))", fontFamily: "monospace", fontSize: 10 }} />
                <ReferenceLine y={0} stroke="hsl(var(--muted-foreground))" strokeDasharray="2 2" />
                <ReferenceLine x={spot} stroke="hsl(var(--accent))" strokeDasharray="2 2" label={{ value: "Spot", fontSize: 9, fill: "hsl(var(--accent))" }} />
                <Line type="monotone" dataKey="pnl" stroke="hsl(var(--accent))" strokeWidth={2} dot={false} />
              </LineChart>
            </ExpandableResponsiveContainer>
          )}
        </div>
      </div>
    </div>
  );
}
