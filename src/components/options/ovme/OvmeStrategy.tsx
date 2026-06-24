// OVME Strategy — multi-leg builder with P&L diagram + spot/vol shift matrix.
import { useMemo, useState } from "react";
import { OvmeDeal } from "./OvmeWorkspace";
import { calculateBlackScholes } from "@/utils/blackScholes";
import { ExpandableResponsiveContainer } from '@/components/shared/ExpandChart';
import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ReferenceLine,
} from 'recharts';

interface Leg {
  isCall: boolean;
  isBuy: boolean;
  strike: number;
  qty: number;
  dte: number;
}

const TEMPLATES: { name: string; build: (d: OvmeDeal) => Leg[] }[] = [
  { name: "Long Call",         build: (d) => [{ isCall: true,  isBuy: true,  strike: d.strike,     qty: 1, dte: d.dte }] },
  { name: "Long Put",          build: (d) => [{ isCall: false, isBuy: true,  strike: d.strike,     qty: 1, dte: d.dte }] },
  { name: "Bull Call Spread",  build: (d) => [{ isCall: true,  isBuy: true,  strike: d.strike,     qty: 1, dte: d.dte }, { isCall: true,  isBuy: false, strike: d.strike + 10, qty: 1, dte: d.dte }] },
  { name: "Bear Put Spread",   build: (d) => [{ isCall: false, isBuy: true,  strike: d.strike,     qty: 1, dte: d.dte }, { isCall: false, isBuy: false, strike: d.strike - 10, qty: 1, dte: d.dte }] },
  { name: "Straddle",          build: (d) => [{ isCall: true,  isBuy: true,  strike: d.strike,     qty: 1, dte: d.dte }, { isCall: false, isBuy: true,  strike: d.strike,     qty: 1, dte: d.dte }] },
  { name: "Strangle",          build: (d) => [{ isCall: true,  isBuy: true,  strike: d.strike + 5, qty: 1, dte: d.dte }, { isCall: false, isBuy: true,  strike: d.strike - 5, qty: 1, dte: d.dte }] },
  { name: "Iron Condor",       build: (d) => [
    { isCall: false, isBuy: true,  strike: d.strike - 15, qty: 1, dte: d.dte },
    { isCall: false, isBuy: false, strike: d.strike - 5,  qty: 1, dte: d.dte },
    { isCall: true,  isBuy: false, strike: d.strike + 5,  qty: 1, dte: d.dte },
    { isCall: true,  isBuy: true,  strike: d.strike + 15, qty: 1, dte: d.dte },
  ]},
  { name: "Butterfly",         build: (d) => [
    { isCall: true, isBuy: true,  strike: d.strike - 5, qty: 1, dte: d.dte },
    { isCall: true, isBuy: false, strike: d.strike,     qty: 2, dte: d.dte },
    { isCall: true, isBuy: true,  strike: d.strike + 5, qty: 1, dte: d.dte },
  ]},
  { name: "Calendar Spread",   build: (d) => [{ isCall: true, isBuy: false, strike: d.strike, qty: 1, dte: Math.max(7, d.dte - 21) }, { isCall: true, isBuy: true, strike: d.strike, qty: 1, dte: d.dte + 30 }] },
];

function legPremium(leg: Leg, spot: number, volPct: number, ratePct: number) {
  const bs = calculateBlackScholes(spot, leg.strike, leg.dte / 365, ratePct / 100, volPct / 100);
  return (leg.isCall ? bs.callPrice : bs.putPrice) * leg.qty * (leg.isBuy ? 1 : -1);
}

function legPnlAtExpiry(leg: Leg, spotAtExp: number, entryPrem: number) {
  const intrinsic = leg.isCall ? Math.max(0, spotAtExp - leg.strike) : Math.max(0, leg.strike - spotAtExp);
  const sign = leg.isBuy ? 1 : -1;
  return (intrinsic * leg.qty * sign) - entryPrem;
}

interface Props { deal: OvmeDeal; redact?: boolean }

export default function OvmeStrategy({ deal, redact = false }: Props) {
  const [templateName, setTemplateName] = useState("Long Call");
  const [legs, setLegs] = useState<Leg[]>(() => TEMPLATES[0].build(deal));

  const applyTemplate = (name: string) => {
    const t = TEMPLATES.find((x) => x.name === name);
    if (!t) return;
    setTemplateName(name);
    setLegs(t.build(deal));
  };

  const netPrem = useMemo(() => legs.reduce((sum, l) => sum + legPremium(l, deal.spot, deal.vol, deal.rate), 0), [legs, deal]);

  // Net Greeks (current)
  const netGreeks = useMemo(() => {
    return legs.reduce(
      (acc, l) => {
        const bs = calculateBlackScholes(deal.spot, l.strike, l.dte / 365, deal.rate / 100, deal.vol / 100);
        const sign = (l.isBuy ? 1 : -1) * l.qty;
        const delta = (l.isCall ? bs.callDelta : bs.putDelta) * sign;
        const theta = (l.isCall ? bs.callTheta : bs.putTheta) * sign;
        return {
          delta: acc.delta + delta,
          gamma: acc.gamma + bs.gamma * sign,
          theta: acc.theta + theta,
          vega: acc.vega + bs.vega * sign,
        };
      },
      { delta: 0, gamma: 0, theta: 0, vega: 0 }
    );
  }, [legs, deal]);

  // P&L curve at expiry + now
  const chart = useMemo(() => {
    const lo = deal.spot * 0.92;
    const hi = deal.spot * 1.08;
    const step = (hi - lo) / 40;
    return Array.from({ length: 41 }, (_, i) => {
      const s = lo + i * step;
      let pnlExp = 0;
      let pnlNow = 0;
      for (const l of legs) {
        const entry = legPremium(l, deal.spot, deal.vol, deal.rate);
        pnlExp += legPnlAtExpiry(l, s, entry);
        const bsNow = calculateBlackScholes(s, l.strike, l.dte / 365, deal.rate / 100, deal.vol / 100);
        const nowPrem = (l.isCall ? bsNow.callPrice : bsNow.putPrice) * l.qty * (l.isBuy ? 1 : -1);
        pnlNow += nowPrem - entry;
      }
      return { s: Math.round(s * 100) / 100, pnlExp: Math.round(pnlExp * 100) / 100, pnlNow: Math.round(pnlNow * 100) / 100 };
    });
  }, [legs, deal]);

  // P&L matrix: spot shifts vs vol shifts
  const matrix = useMemo(() => {
    const spotShifts = [-5, -2.5, 0, 2.5, 5];
    const volShifts = [-10, -5, 0, 5, 10];
    const baseTotal = legs.reduce((sum, l) => sum + legPremium(l, deal.spot, deal.vol, deal.rate), 0);
    return spotShifts.map((sShift) => ({
      sShift,
      cells: volShifts.map((vShift) => {
        const newSpot = deal.spot * (1 + sShift / 100);
        const newVol = deal.vol + vShift;
        const newTotal = legs.reduce((sum, l) => sum + legPremium(l, newSpot, newVol, deal.rate), 0);
        return { vShift, pnl: newTotal - baseTotal };
      }),
    }));
  }, [legs, deal]);

  const updateLeg = (i: number, patch: Partial<Leg>) => setLegs(legs.map((l, idx) => (idx === i ? { ...l, ...patch } : l)));
  const addLeg = () => setLegs([...legs, { isCall: true, isBuy: true, strike: deal.strike, qty: 1, dte: deal.dte }]);
  const removeLeg = (i: number) => setLegs(legs.filter((_, idx) => idx !== i));

  return (
    <div className="grid grid-cols-1 lg:grid-cols-[280px_1fr] gap-3">
      {/* LEFT — templates, legs, net greeks */}
      <div className="space-y-3">
        <div className="card-terminal p-2">
          <h3 className="text-xs font-mono font-bold text-accent uppercase tracking-wider mb-2">Strategy Templates</h3>
          <div className="flex flex-wrap gap-1.5">
            {TEMPLATES.map((t) => (
              <button
                key={t.name}
                onClick={() => applyTemplate(t.name)}
                className={`px-2 py-1 text-[10px] font-mono border ${templateName === t.name ? "bg-accent/20 border-accent text-accent" : "border-border text-muted-foreground hover:border-accent/60"}`}
              >{t.name}</button>
            ))}
          </div>
        </div>

        <div className="card-terminal p-2">
          <h3 className="text-xs font-mono font-bold text-accent uppercase tracking-wider mb-2">Legs ({legs.length})</h3>
          <div className="space-y-2">
            {legs.map((l, i) => (
              <div key={i} className="border border-border p-2 bg-surface-elevated">
                <div className="flex items-center justify-between mb-2">
                  <span className="text-[9px] font-mono text-accent font-bold">LEG {i + 1}</span>
                  <button onClick={() => removeLeg(i)} className="text-[9px] font-mono text-muted-foreground hover:text-negative">×</button>
                </div>
                <div className="flex gap-1 mb-2">
                  <button onClick={() => updateLeg(i, { isCall: true })} className={`px-2 py-0.5 text-[10px] font-mono font-bold ${l.isCall ? "bg-positive/20 border border-positive text-positive" : "border border-border text-muted-foreground"}`}>C</button>
                  <button onClick={() => updateLeg(i, { isCall: false })} className={`px-2 py-0.5 text-[10px] font-mono font-bold ${!l.isCall ? "bg-negative/20 border border-negative text-negative" : "border border-border text-muted-foreground"}`}>P</button>
                  <button onClick={() => updateLeg(i, { isBuy: !l.isBuy })} className={`px-2 py-0.5 text-[10px] font-mono font-bold ml-1 ${l.isBuy ? "bg-accent/20 border border-accent text-accent" : "border border-border text-muted-foreground"}`}>{l.isBuy ? "BUY" : "SELL"}</button>
                </div>
                <div className="grid grid-cols-3 gap-1 text-[9px] font-mono text-muted-foreground">
                  <label>Strike<input type="number" value={l.strike} onChange={(e) => updateLeg(i, { strike: parseFloat(e.target.value) || 0 })} className="w-full bg-transparent border border-border px-1.5 py-0.5 text-foreground text-right tabular-nums focus:outline-none focus:border-accent" /></label>
                  <label>Qty<input type="number" value={l.qty} onChange={(e) => updateLeg(i, { qty: parseFloat(e.target.value) || 1 })} className="w-full bg-transparent border border-border px-1.5 py-0.5 text-foreground text-right tabular-nums focus:outline-none focus:border-accent" /></label>
                  <label>DTE<input type="number" value={l.dte} onChange={(e) => updateLeg(i, { dte: parseFloat(e.target.value) || 1 })} className="w-full bg-transparent border border-border px-1.5 py-0.5 text-foreground text-right tabular-nums focus:outline-none focus:border-accent" /></label>
                </div>
              </div>
            ))}
            <button onClick={addLeg} className="w-full border border-dashed border-accent/60 text-accent text-[10px] font-mono py-1.5 hover:bg-accent/10">+ ADD LEG</button>
          </div>
        </div>

        <div className="card-terminal p-2">
          <h3 className="text-xs font-mono font-bold text-accent uppercase tracking-wider mb-2">Net Greeks</h3>
          <div className="space-y-1.5 text-[11px] font-mono">
            <Row label="Net Premium" value={<span className={`tabular-nums font-bold ${netPrem >= 0 ? "text-positive" : "text-negative"}`}>{redact ? "••" : netPrem.toFixed(2)}</span>} />
            <Row label="Net Delta" value={<span className={`tabular-nums ${netGreeks.delta >= 0 ? "text-positive" : "text-negative"}`}>{redact ? "••" : netGreeks.delta.toFixed(4)}</span>} />
            <Row label="Net Gamma" value={<span className="text-accent tabular-nums">{redact ? "••" : netGreeks.gamma.toFixed(6)}</span>} />
            <Row label="Net Theta" value={<span className="text-negative tabular-nums">{redact ? "••" : netGreeks.theta.toFixed(4)}</span>} />
            <Row label="Net Vega" value={<span className="text-accent tabular-nums">{redact ? "••" : netGreeks.vega.toFixed(4)}</span>} />
          </div>
        </div>
      </div>

      {/* RIGHT — chart + matrix */}
      <div className="space-y-3 min-w-0">
        <div className="card-terminal p-2">
          <div className="flex items-center justify-between mb-2">
            <h3 className="text-xs font-mono font-bold text-accent uppercase tracking-wider">Strategy P&L — {deal.ticker} · {templateName}</h3>
          </div>
          {redact ? (
            <div className="h-[320px] flex items-center justify-center text-muted-foreground font-mono text-xs">•• REDACTED ••</div>
          ) : (
            <ExpandableResponsiveContainer width="100%" height={320}>
              <LineChart data={chart} margin={{ top: 5, right: 10, left: -10, bottom: 0 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
                <XAxis dataKey="s" tick={{ fontSize: 9, fill: "hsl(var(--muted-foreground))", fontFamily: "monospace" }} stroke="hsl(var(--border))" />
                <YAxis tick={{ fontSize: 9, fill: "hsl(var(--muted-foreground))", fontFamily: "monospace" }} stroke="hsl(var(--border))" />
                <Tooltip contentStyle={{ background: "hsl(var(--card))", border: "1px solid hsl(var(--border))", fontFamily: "monospace", fontSize: 10 }} />
                <ReferenceLine y={0} stroke="hsl(var(--muted-foreground))" />
                <ReferenceLine x={deal.spot} stroke="hsl(var(--accent))" strokeDasharray="2 2" />
                <Line type="monotone" dataKey="pnlExp" stroke="hsl(var(--accent))" strokeWidth={2} dot={false} name="P&L at Expiry" />
                <Line type="monotone" dataKey="pnlNow" stroke="hsl(var(--accent))" strokeWidth={1.4} strokeDasharray="4 3" dot={false} name="P&L Now" />
              </LineChart>
            </ExpandableResponsiveContainer>
          )}
          <div className="mt-2 flex items-center gap-4 text-[10px] font-mono">
            <span className="flex items-center gap-1"><span className="inline-block w-2 h-2 bg-accent" />P&L at Expiry</span>
            <span className="flex items-center gap-1"><span className="inline-block w-2 h-2 bg-accent/60" />P&L Now</span>
            <span className="ml-auto text-muted-foreground">Net Premium: <span className={netPrem >= 0 ? "text-positive" : "text-negative"}>{redact ? "••" : `${netPrem >= 0 ? "+" : ""}${netPrem.toFixed(2)}`}</span></span>
          </div>
        </div>

        <div className="card-terminal p-2">
          <h3 className="text-xs font-mono font-bold text-accent uppercase tracking-wider mb-3">P&L Matrix — Spot vs Vol Shifts · {templateName}</h3>
          <table className="w-full text-[10px] font-mono tabular-nums">
            <thead>
              <tr className="text-accent border-b border-border">
                <th className="text-left py-1.5 px-2">Spot \ Vol</th>
                {matrix[0].cells.map((c) => (
                  <th key={c.vShift} className="text-right py-1.5 px-2">{c.vShift > 0 ? "+" : ""}{c.vShift}%</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {matrix.map((row) => (
                <tr key={row.sShift} className="border-b border-grid-line">
                  <td className="text-left py-1.5 px-2 text-accent font-bold">{row.sShift > 0 ? "+" : ""}{row.sShift}%</td>
                  {row.cells.map((c) => {
                    const isBase = row.sShift === 0 && c.vShift === 0;
                    return (
                      <td key={c.vShift} className={`text-right py-1.5 px-2 ${isBase ? "bg-accent/20 font-bold" : ""} ${c.pnl >= 0 ? "text-positive" : "text-negative"}`}>
                        {redact ? "••" : `${c.pnl >= 0 ? "+" : ""}${c.pnl.toFixed(2)}`}
                      </td>
                    );
                  })}
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}

function Row({ label, value }: { label: string; value: React.ReactNode }) {
  return <div className="flex items-center justify-between border-b border-grid-line py-1"><span className="text-muted-foreground">{label}</span>{value}</div>;
}
