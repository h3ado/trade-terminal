// Side-by-side options chain (Calls left | Strike center | Puts right) with score, GEX, OI Δ.
import { useMemo, useState } from "react";

interface Row {
  strike: number;
  call: { score: number; gex: number; oiDelta: number; oi: number; vol: number; iv: number; theta: number; gamma: number; delta: number; bid: number; ask: number };
  put:  { bid: number; ask: number; delta: number; gamma: number; theta: number; iv: number; vol: number; oi: number; oiDelta: number; gex: number; score: number };
}

const SPOT = 432;
const STRIKES = [423, 426, 428, 430, 432, 434, 436, 438, 441];

function genRow(strike: number): Row {
  const dist = strike - SPOT;
  const ivBase = 24 + Math.abs(dist) * 0.2;
  return {
    strike,
    call: {
      score: 99,
      gex: Math.round((1 + Math.random() * 3) * 1000) * 1000,
      oiDelta: Math.round(700 + Math.random() * 2000),
      oi: Math.round(10_000 + Math.random() * 65_000),
      vol: 28_600,
      iv: +(ivBase + Math.random() * 1.5).toFixed(1),
      theta: -(8 + Math.random() * 5).toFixed(2) as unknown as number,
      gamma: +(0.07 + Math.random() * 0.05).toFixed(3),
      delta: +(0.33 + Math.max(0, -dist) * 0.02 + Math.random() * 0.05).toFixed(2),
      bid: +(4 + Math.random() * 3).toFixed(2),
      ask: +(4.2 + Math.random() * 3).toFixed(2),
    },
    put: {
      bid: +(3.9 + Math.random() * 3).toFixed(2),
      ask: +(4.2 + Math.random() * 3).toFixed(2),
      delta: +(-(0.33 + Math.max(0, dist) * 0.02 + Math.random() * 0.05)).toFixed(2),
      gamma: +(0.07 + Math.random() * 0.05).toFixed(3),
      theta: -(8 + Math.random() * 5).toFixed(2) as unknown as number,
      iv: +(ivBase + Math.random() * 1.5).toFixed(1),
      vol: 28_600,
      oi: Math.round(10_000 + Math.random() * 65_000),
      oiDelta: Math.round(700 + Math.random() * 2000),
      gex: -Math.round((0.4 + Math.random() * 2.5) * 1_000_000),
      score: 99,
    },
  };
}

const fmtK = (n: number) => Math.abs(n) >= 1_000_000 ? `${(n / 1_000_000).toFixed(1)}M` : Math.abs(n) >= 1000 ? `${(n / 1000).toFixed(1)}K` : `${n}`;
const fmtSigned = (n: number) => `${n >= 0 ? "+" : ""}${fmtK(n)}`;

interface Props { ticker?: string; redact?: boolean }

const EXPS = ["All", "0DTE", "1DTE", "2DTE", "5DTE", "14DTE", "30DTE"];
const SCORES = ["All", "50", "70", "85"];

export default function SideBySideChain({ ticker = "SPY", redact = false }: Props) {
  const [exp, setExp] = useState("All");
  const [type, setType] = useState<"ALL" | "CALLS" | "PUTS">("ALL");
  const [layout, setLayout] = useState<"SPLIT" | "FLAT">("SPLIT");
  const [scoreMin, setScoreMin] = useState("All");

  const rows = useMemo(() => STRIKES.map(genRow), []);
  const r = (v: string | number) => (redact ? "••" : String(v));

  return (
    <div className="card-terminal p-2">
      {/* filter bar */}
      <div className="flex flex-wrap items-center gap-3 border-b border-border pb-2 mb-2 text-[10px] font-mono">
        <Group label="EXP" options={EXPS} value={exp} onChange={setExp} />
        <Group label="TYPE" options={["ALL", "CALLS", "PUTS"]} value={type} onChange={(v) => setType(v as any)} />
      </div>
      <div className="flex flex-wrap items-center justify-between text-[10px] font-mono mb-2">
        <div className="text-muted-foreground">Side-by-Side Options Chain — <span className="text-foreground">{ticker}</span></div>
        <div className="text-muted-foreground">{rows.length * 2} contracts loaded</div>
      </div>
      <div className="flex items-center gap-3 text-[10px] font-mono mb-2">
        <Group label="LAYOUT" options={["SPLIT", "FLAT"]} value={layout} onChange={(v) => setLayout(v as any)} />
        <Group label="SCORE ≥" options={SCORES} value={scoreMin} onChange={setScoreMin} />
      </div>

      <div className="overflow-x-auto">
        <table className="w-full text-[10px] font-mono tabular-nums border-collapse">
          <thead>
            <tr className="bg-chart-up/10 text-up text-center">
              <th colSpan={10} className="py-1 tracking-widest">— CALLS —</th>
              <th className="bg-secondary text-foreground tracking-widest">STRIKE</th>
              <th colSpan={10} className="bg-chart-down/10 text-down py-1 tracking-widest">— PUTS —</th>
            </tr>
            <tr className="text-muted-foreground border-b border-border">
              {["Score","GEX","OI Δ","OI","Vol","IV%","Θ","Γ","Δ","Bid/Ask"].map((h) => (
                <th key={"c" + h} className="text-right py-1 px-1.5">{h}</th>
              ))}
              <th className="text-center py-1 px-1.5 text-accent">$</th>
              {["Bid/Ask","Δ","Γ","Θ","IV%","Vol","OI","OI Δ","GEX","Score"].map((h) => (
                <th key={"p" + h} className="text-right py-1 px-1.5">{h}</th>
              ))}
            </tr>
          </thead>
          <tbody>
            {rows.map((row) => {
              const atm = row.strike === SPOT;
              return (
                <tr key={row.strike} className={`border-b border-grid-line hover:bg-surface-elevated ${atm ? "bg-accent/5" : ""}`}>
                  <td className="text-right py-1 px-1.5 text-up font-bold">{r(row.call.score)}</td>
                  <td className="text-right py-1 px-1.5 text-up">{r(fmtK(row.call.gex))}</td>
                  <td className="text-right py-1 px-1.5 text-up">{r(`+${row.call.oiDelta}`)}</td>
                  <td className="text-right py-1 px-1.5 text-foreground">{r(fmtK(row.call.oi))}</td>
                  <td className="text-right py-1 px-1.5 text-muted-foreground">{r(fmtK(row.call.vol))}</td>
                  <td className="text-right py-1 px-1.5 text-foreground">{r(row.call.iv)}</td>
                  <td className="text-right py-1 px-1.5 text-down">{r(row.call.theta)}</td>
                  <td className="text-right py-1 px-1.5 text-foreground">{r(row.call.gamma)}</td>
                  <td className="text-right py-1 px-1.5 text-foreground">{r(row.call.delta)}</td>
                  <td className="text-right py-1 px-1.5 text-up">{r(`${row.call.bid} ${row.call.ask}`)}</td>
                  <td className={`text-center py-1 px-2 font-bold ${atm ? "text-accent" : "text-foreground"}`}>
                    ${row.strike}
                    {atm && <div className="text-[8px] text-accent/70">ATM</div>}
                  </td>
                  <td className="text-right py-1 px-1.5 text-down">{r(`${row.put.bid} ${row.put.ask}`)}</td>
                  <td className="text-right py-1 px-1.5 text-down">{r(row.put.delta)}</td>
                  <td className="text-right py-1 px-1.5 text-foreground">{r(row.put.gamma)}</td>
                  <td className="text-right py-1 px-1.5 text-down">{r(row.put.theta)}</td>
                  <td className="text-right py-1 px-1.5 text-foreground">{r(row.put.iv)}</td>
                  <td className="text-right py-1 px-1.5 text-muted-foreground">{r(fmtK(row.put.vol))}</td>
                  <td className="text-right py-1 px-1.5 text-foreground">{r(fmtK(row.put.oi))}</td>
                  <td className="text-right py-1 px-1.5 text-up">{r(`+${row.put.oiDelta}`)}</td>
                  <td className="text-right py-1 px-1.5 text-down">{r(fmtSigned(row.put.gex))}</td>
                  <td className="text-right py-1 px-1.5 text-up font-bold">{r(row.put.score)}</td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
    </div>
  );
}

function Group<T extends string>({ label, options, value, onChange }: { label: string; options: T[]; value: T; onChange: (v: T) => void }) {
  return (
    <div className="flex items-center gap-1">
      <span className="text-muted-foreground uppercase">{label}:</span>
      {options.map((o) => (
        <button
          key={o}
          onClick={() => onChange(o)}
          className={`px-1.5 py-0.5 ${value === o ? "bg-accent text-accent-foreground font-bold" : "text-muted-foreground hover:text-foreground hover:bg-surface-elevated"}`}
        >
          {o}
        </button>
      ))}
    </div>
  );
}
