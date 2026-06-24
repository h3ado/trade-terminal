// Bloomberg-style options matrix with extra columns + per-row drill-down drawer.
import { useState } from "react";
import OptionDetailDrawer from "./shared/OptionDetailDrawer";
import Sparkline from "./shared/Sparkline";
import { seeded, sparkline, fmtUsd } from "./shared/mockSeries";

interface Row {
  expiry: string; strike: number; type: "C" | "P";
  delta: number; gamma: number; theta: number; vega: number; vanna: number; charm: number;
  iv: number; ivDelta: number; oi: number; oiDelta: number; vol: number;
  bid: number; ask: number; theo: number;
  gex: number; score: number; smart: boolean;
}

function buildRows(ticker: string): Row[] {
  const rnd = seeded(ticker, "matrix");
  const dtes = ["0DTE", "1DTE", "2DTE", "5DTE", "30DTE", "60DTE"];
  const spot = 482 + rnd() * 20;
  const rows: Row[] = [];
  dtes.forEach((d) => {
    [-2, 0, 2].forEach((off) => {
      const isCall = off >= 0;
      const k = Math.round(spot + off * 5);
      const iv = 14 + rnd() * 14;
      const bid = +(rnd() * 4 + 1).toFixed(2);
      const ask = +(bid + rnd() * 0.1 + 0.05).toFixed(2);
      const theo = +(((bid + ask) / 2) * (0.96 + rnd() * 0.08)).toFixed(2);
      rows.push({
        expiry: d, strike: k, type: isCall ? "C" : "P",
        delta: +((isCall ? 1 : -1) * (0.2 + rnd() * 0.6)).toFixed(2),
        gamma: +(rnd() * 0.09).toFixed(3),
        theta: +(-rnd() * 1.5).toFixed(2),
        vega:  +(rnd() * 0.4).toFixed(2),
        vanna: +(rnd() * 0.03).toFixed(3),
        charm: +(rnd() * 0.02).toFixed(3),
        iv: +iv.toFixed(1),
        ivDelta: +((rnd() - 0.5) * 2).toFixed(1),
        oi: Math.round(8_000 + rnd() * 50_000),
        oiDelta: Math.round((rnd() - 0.4) * 12_000),
        vol: Math.round(2_000 + rnd() * 30_000),
        bid, ask, theo,
        gex: Math.round((isCall ? 1 : -1) * (rnd() * 100_000_000)),
        score: Math.round(40 + rnd() * 60),
        smart: rnd() > 0.7,
      });
    });
  });
  return rows;
}

interface Props { ticker?: string; redact?: boolean }

export default function OptionsMatrix({ ticker = "SPY", redact = false }: Props) {
  const r = (s: string | number) => redact ? "••" : String(s);
  const rows = buildRows(ticker);
  const [open, setOpen] = useState<Row | null>(null);
  const ivSpark = open ? sparkline(ticker, `iv-${open.strike}-${open.expiry}`, open.iv, 0.06) : [];
  const pxSpark = open ? sparkline(ticker, `px-${open.strike}-${open.expiry}`, (open.bid + open.ask) / 2, 0.08) : [];
  const spread = open ? (open.ask - open.bid) : 0;
  const edge = open ? (open.theo - (open.bid + open.ask) / 2) : 0;

  return (
    <>
      <div className="card-terminal p-2">
        <div className="flex items-center justify-between mb-3">
          <div>
            <h3 className="text-sm font-mono font-bold text-foreground uppercase tracking-wider">Options Matrix — {ticker}</h3>
            <p className="text-[10px] font-mono text-muted-foreground mt-0.5">Strikes across expirations · click row to drill in</p>
          </div>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full text-[10px] font-mono tabular-nums">
            <thead>
              <tr className="border-b border-border text-accent text-[9px] uppercase">
                {["DTE", "Strike", "T", "Δ", "Γ", "Θ", "Vega", "Vanna", "Charm", "IV%", "IVΔ", "Sprd%", "Edge", "OI", "OIΔ", "V/OI", "GEX", "Score", ""].map((h) => (
                  <th key={h} className="text-left py-1.5 px-1.5 font-bold tracking-wider whitespace-nowrap">{h}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {rows.map((row, i) => {
                const sprdPct = ((row.ask - row.bid) / ((row.bid + row.ask) / 2)) * 100;
                const edgeVal = row.theo - (row.bid + row.ask) / 2;
                const volOi = row.vol / Math.max(row.oi, 1);
                return (
                  <tr key={i} className="border-b border-border/40 hover:bg-secondary/50 cursor-pointer transition-colors" onClick={() => setOpen(row)}>
                    <td className="py-1 px-1.5 text-muted-foreground">{row.expiry}</td>
                    <td className="py-1 px-1.5 font-bold text-foreground">${r(row.strike)}</td>
                    <td className="py-1 px-1.5">
                      <span className={`px-1 text-[9px] font-bold ${row.type === "C" ? "bg-chart-up/15 text-up" : "bg-chart-down/15 text-down"}`}>{row.type}</span>
                    </td>
                    <td className="py-1 px-1.5 text-foreground">{r(row.delta)}</td>
                    <td className="py-1 px-1.5 text-foreground">{r(row.gamma)}</td>
                    <td className="py-1 px-1.5 text-down">{r(row.theta)}</td>
                    <td className="py-1 px-1.5 text-foreground">{r(row.vega)}</td>
                    <td className="py-1 px-1.5 text-[hsl(280_70%_65%)]">{r(row.vanna)}</td>
                    <td className="py-1 px-1.5 text-[hsl(180_70%_55%)]">{r(row.charm)}</td>
                    <td className="py-1 px-1.5 text-foreground">{r(row.iv)}</td>
                    <td className={`py-1 px-1.5 ${row.ivDelta >= 0 ? "text-up" : "text-down"}`}>{r(`${row.ivDelta >= 0 ? "+" : ""}${row.ivDelta}`)}</td>
                    <td className={`py-1 px-1.5 ${sprdPct > 5 ? "text-down" : "text-muted-foreground"}`}>{r(sprdPct.toFixed(1))}</td>
                    <td className={`py-1 px-1.5 ${edgeVal >= 0 ? "text-up" : "text-down"}`}>{r(edgeVal.toFixed(2))}</td>
                    <td className="py-1 px-1.5 text-foreground">{r((row.oi / 1000).toFixed(1) + "K")}</td>
                    <td className={`py-1 px-1.5 ${row.oiDelta >= 0 ? "text-up" : "text-down"}`}>{r(`${row.oiDelta >= 0 ? "+" : ""}${(row.oiDelta / 1000).toFixed(1)}K`)}</td>
                    <td className={`py-1 px-1.5 ${volOi > 0.7 ? "text-accent" : "text-foreground"}`}>{r(volOi.toFixed(2))}</td>
                    <td className={`py-1 px-1.5 ${row.gex >= 0 ? "text-up" : "text-down"}`}>{r(fmtUsd(row.gex))}</td>
                    <td className="py-1 px-1.5">
                      <div className="flex items-center gap-1">
                        <div className="w-6 h-1 bg-secondary overflow-hidden"><div className="h-full bg-accent" style={{ width: `${row.score}%` }} /></div>
                        <span className="text-accent font-bold">{row.score}</span>
                      </div>
                    </td>
                    <td className="py-1 px-1.5">{row.smart && <span className="text-accent text-[10px]">★</span>}</td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>

      <OptionDetailDrawer
        open={!!open}
        onOpenChange={(o) => !o && setOpen(null)}
        code={open ? `${ticker} ${open.strike}${open.type} ${open.expiry}` : ""}
        title="Contract Detail"
        subtitle={open ? `Bid ${open.bid.toFixed(2)} / Ask ${open.ask.toFixed(2)} · Theo ${open.theo.toFixed(2)}` : ""}
        kpis={open ? [
          { label: "Δ", value: redact ? "••" : String(open.delta), tone: open.delta >= 0 ? "up" : "down" },
          { label: "Γ", value: redact ? "••" : String(open.gamma), tone: "accent" },
          { label: "Θ", value: redact ? "••" : String(open.theta), tone: "down" },
          { label: "Vega", value: redact ? "••" : String(open.vega) },
          { label: "Vanna", value: redact ? "••" : String(open.vanna) },
          { label: "Charm", value: redact ? "••" : String(open.charm) },
          { label: "IV", value: redact ? "••" : `${open.iv}%`, tone: "accent" },
          { label: "OI", value: redact ? "••" : open.oi.toLocaleString() },
          { label: "Vol", value: redact ? "••" : open.vol.toLocaleString() },
          { label: "Spread", value: redact ? "••" : `${spread.toFixed(2)} (${((spread / ((open.bid + open.ask) / 2)) * 100).toFixed(1)}%)`, tone: spread / ((open.bid + open.ask) / 2) > 0.05 ? "down" : "neutral" },
          { label: "Edge", value: redact ? "••" : `$${edge.toFixed(2)}`, tone: edge >= 0 ? "up" : "down" },
          { label: "GEX", value: redact ? "••" : fmtUsd(open.gex), tone: open.gex >= 0 ? "up" : "down" },
        ] : []}
      >
        {open && (
          <>
            <div>
              <div className="text-[10px] font-mono uppercase text-muted-foreground mb-1">Intraday Mid Price</div>
              <div className="border border-border bg-surface-elevated p-2">
                <Sparkline data={pxSpark} width={480} height={80} color="auto" className="w-full" />
              </div>
            </div>
            <div>
              <div className="text-[10px] font-mono uppercase text-muted-foreground mb-1">30-Day Implied Vol</div>
              <div className="border border-border bg-surface-elevated p-2">
                <Sparkline data={ivSpark} width={480} height={80} color="hsl(var(--accent))" className="w-full" />
              </div>
            </div>
            <div>
              <div className="text-[10px] font-mono uppercase text-muted-foreground mb-1">Recent Time & Sales (mock)</div>
              <div className="border border-border bg-surface-elevated">
                {Array.from({ length: 8 }).map((_, i) => {
                  const rnd = seeded(ticker, `ts-${open.strike}-${i}`);
                  const sz = Math.floor(rnd() * 200 + 1);
                  const px = +((open.bid + (open.ask - open.bid) * rnd())).toFixed(2);
                  const side = rnd() > 0.5 ? "ASK" : "BID";
                  return (
                    <div key={i} className="grid grid-cols-4 gap-2 px-2 py-0.5 text-[10px] font-mono tabular-nums border-b border-border/40 last:border-0">
                      <span className="text-muted-foreground">{`${14}:${(20 + i).toString().padStart(2, "0")}:${Math.floor(rnd() * 60).toString().padStart(2, "0")}`}</span>
                      <span className="text-right text-foreground">{px.toFixed(2)}</span>
                      <span className="text-right text-foreground">{sz}</span>
                      <span className={`text-right font-bold ${side === "ASK" ? "text-up" : "text-down"}`}>{side}</span>
                    </div>
                  );
                })}
              </div>
            </div>
          </>
        )}
      </OptionDetailDrawer>
    </>
  );
}
