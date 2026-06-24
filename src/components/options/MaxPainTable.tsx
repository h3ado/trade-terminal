// Max Pain calculator panel — finds strike where total option holder loss is greatest.
const expiries = [
  { exp: "0DTE",  spot: 595.4, maxPain: 593, delta: -2.4, oi: "284K", pcr: 0.92 },
  { exp: "1DTE",  spot: 595.4, maxPain: 595, delta: -0.4, oi: "412K", pcr: 1.04 },
  { exp: "5DTE",  spot: 595.4, maxPain: 590, delta: -5.4, oi: "612K", pcr: 1.18 },
  { exp: "14DTE", spot: 595.4, maxPain: 600, delta: 4.6,  oi: "498K", pcr: 0.86 },
  { exp: "30DTE", spot: 595.4, maxPain: 605, delta: 9.6,  oi: "725K", pcr: 0.78 },
  { exp: "60DTE", spot: 595.4, maxPain: 610, delta: 14.6, oi: "541K", pcr: 0.71 },
  { exp: "90DTE", spot: 595.4, maxPain: 615, delta: 19.6, oi: "388K", pcr: 0.68 },
];

interface Props { ticker?: string; redact?: boolean }

export default function MaxPainTable({ ticker = "SPY", redact = false }: Props) {
  const r = (s: string | number) => (redact ? "••" : String(s));
  // Aggregate KPIs
  const callOI$ = expiries.reduce((s, e) => s + e.spot * 1_000 * 0.42, 0); // mock
  const putOI$  = expiries.reduce((s, e) => s + e.spot * 1_000 * 0.58, 0);
  const painRatio = putOI$ / callOI$;
  const avgPin = expiries.reduce((s, e) => s + e.maxPain, 0) / expiries.length;
  const distPct = ((avgPin - expiries[0].spot) / expiries[0].spot) * 100;

  return (
    <div className="card-terminal p-2">
      <div className="mb-3 flex items-start justify-between gap-3">
        <div>
          <h3 className="text-sm font-mono font-bold text-foreground uppercase tracking-wider">Max Pain — {ticker}</h3>
          <p className="text-[10px] font-mono text-muted-foreground mt-0.5">Pin levels and dealer-friendly strikes by expiry</p>
        </div>
        <div className="grid grid-cols-3 gap-1 text-[10px] font-mono">
          <Mini label="PAIN RATIO" value={r(painRatio.toFixed(2))} tone={painRatio > 1 ? "down" : "up"} />
          <Mini label="AVG PIN"    value={r(avgPin.toFixed(0))} tone="accent" />
          <Mini label="DIST %"     value={r(`${distPct >= 0 ? "+" : ""}${distPct.toFixed(2)}%`)} tone={Math.abs(distPct) < 0.5 ? "accent" : "neutral"} />
        </div>
      </div>
      <div className="overflow-x-auto">
        <table className="w-full text-[10px] font-mono tabular-nums">
          <thead>
            <tr className="text-muted-foreground border-b border-border">
              <th className="text-left py-1.5 px-2">Exp</th>
              <th className="text-right py-1.5 px-2">Spot</th>
              <th className="text-right py-1.5 px-2">Max Pain</th>
              <th className="text-right py-1.5 px-2">Δ to Pin</th>
              <th className="text-right py-1.5 px-2">Total OI</th>
              <th className="text-right py-1.5 px-2">P/C Ratio</th>
              <th className="text-right py-1.5 px-2">Pin Bias</th>
            </tr>
          </thead>
          <tbody>
            {expiries.map((e) => {
              const bias = e.delta < -2 ? "DOWN" : e.delta > 2 ? "UP" : "FLAT";
              const biasColor = bias === "UP" ? "text-up" : bias === "DOWN" ? "text-down" : "text-neutral-val";
              return (
                <tr key={e.exp} className="border-b border-grid-line hover:bg-surface-elevated">
                  <td className="py-1.5 px-2 font-bold text-accent">{e.exp}</td>
                  <td className="text-right py-1.5 px-2 text-foreground">{r(e.spot.toFixed(2))}</td>
                  <td className="text-right py-1.5 px-2 text-foreground font-bold">{r(e.maxPain)}</td>
                  <td className={`text-right py-1.5 px-2 ${e.delta >= 0 ? "text-up" : "text-down"}`}>
                    {redact ? "••" : `${e.delta >= 0 ? "+" : ""}${e.delta.toFixed(1)}`}
                  </td>
                  <td className="text-right py-1.5 px-2 text-muted-foreground">{r(e.oi)}</td>
                  <td className={`text-right py-1.5 px-2 ${e.pcr >= 1 ? "text-down" : "text-up"}`}>{r(e.pcr.toFixed(2))}</td>
                  <td className={`text-right py-1.5 px-2 font-bold ${biasColor}`}>{bias}</td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
      <div className="mt-3 text-[9px] font-mono text-muted-foreground border-t border-border pt-2">
        Dealers benefit when price closes near max-pain strike at expiration. Large Δ to pin = stronger magnet effect intraday.
      </div>
    </div>
  );
}

function Mini({ label, value, tone }: { label: string; value: string; tone?: "up" | "down" | "accent" | "neutral" }) {
  const c = tone === "up" ? "text-up" : tone === "down" ? "text-down" : tone === "accent" ? "text-accent" : "text-foreground";
  return (
    <div className="border border-border bg-surface-elevated px-2 py-1">
      <div className="text-[8px] uppercase text-muted-foreground tracking-wider">{label}</div>
      <div className={`text-[11px] font-bold tabular-nums ${c}`}>{value}</div>
    </div>
  );
}
