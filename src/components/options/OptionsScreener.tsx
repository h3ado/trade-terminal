// SCAN sub-panel: cross-ticker options screener with simple filters.
import { useMemo, useState } from "react";

interface Row {
  sym: string; price: number; ivr: number; ivPct: number; ivRv: number; ivDelta: number;
  em: number; gex: "POS" | "NEG"; earn: number | null; volOi: number;
  skew: number; term: number; q: number;
}

const ROWS: Row[] = [
  { sym: "SPY",  price: 582,  ivr: 28, ivPct: 41, ivRv: 1.08, ivDelta:  0.4, em: 1.4, gex: "POS", earn: null, volOi: 0.42, skew: -3.2, term:  1.1, q: 78 },
  { sym: "QQQ",  price: 488,  ivr: 33, ivPct: 49, ivRv: 1.14, ivDelta:  0.8, em: 1.6, gex: "POS", earn: null, volOi: 0.51, skew: -2.8, term:  0.9, q: 74 },
  { sym: "TSLA", price: 248,  ivr: 72, ivPct: 88, ivRv: 1.45, ivDelta:  2.1, em: 4.8, gex: "NEG", earn: 12,   volOi: 0.88, skew: -5.4, term: -0.6, q: 62 },
  { sym: "NVDA", price: 142,  ivr: 64, ivPct: 81, ivRv: 1.31, ivDelta:  1.4, em: 3.9, gex: "NEG", earn: 8,    volOi: 0.71, skew: -4.7, term: -0.3, q: 85 },
  { sym: "AMD",  price: 162,  ivr: 58, ivPct: 71, ivRv: 1.22, ivDelta: -0.5, em: 3.4, gex: "POS", earn: 22,   volOi: 0.66, skew: -3.9, term:  0.4, q: 69 },
  { sym: "META", price: 612,  ivr: 41, ivPct: 58, ivRv: 1.18, ivDelta:  0.2, em: 2.8, gex: "POS", earn: 35,   volOi: 0.39, skew: -3.1, term:  0.6, q: 72 },
  { sym: "AAPL", price: 232,  ivr: 24, ivPct: 32, ivRv: 0.94, ivDelta: -0.3, em: 1.8, gex: "POS", earn: 41,   volOi: 0.31, skew: -2.4, term:  0.9, q: 68 },
  { sym: "GOOG", price: 188,  ivr: 35, ivPct: 51, ivRv: 1.09, ivDelta:  0.1, em: 2.4, gex: "POS", earn: 18,   volOi: 0.44, skew: -3.0, term:  0.5, q: 71 },
  { sym: "MSFT", price: 442,  ivr: 22, ivPct: 28, ivRv: 0.96, ivDelta:  0.0, em: 2.1, gex: "POS", earn: 28,   volOi: 0.27, skew: -2.2, term:  0.7, q: 80 },
  { sym: "AMZN", price: 218,  ivr: 38, ivPct: 54, ivRv: 1.12, ivDelta:  0.6, em: 2.9, gex: "NEG", earn: 14,   volOi: 0.52, skew: -3.4, term:  0.2, q: 66 },
  { sym: "NFLX", price: 698,  ivr: 56, ivPct: 68, ivRv: 1.26, ivDelta:  1.2, em: 4.2, gex: "POS", earn: 6,    volOi: 0.61, skew: -4.2, term: -0.1, q: 70 },
  { sym: "COIN", price: 244,  ivr: 81, ivPct: 92, ivRv: 1.62, ivDelta:  3.4, em: 6.4, gex: "NEG", earn: 19,   volOi: 0.94, skew: -6.1, term: -0.9, q: 58 },
];

interface Props {
  onOpen?: (sym: string) => void;
  redact?: boolean;
}

export default function OptionsScreener({ onOpen, redact = false }: Props) {
  const [minIvr, setMinIvr] = useState(0);
  const [gexFilter, setGexFilter] = useState<"ALL" | "POS" | "NEG">("ALL");
  const [earnDays, setEarnDays] = useState<number>(60);
  const [sort, setSort] = useState<keyof Row>("ivr");
  const [preset, setPreset] = useState<string>("none");

  const filtered = useMemo(() => {
    let rows = ROWS
      .filter((r) => r.ivr >= minIvr)
      .filter((r) => gexFilter === "ALL" ? true : r.gex === gexFilter)
      .filter((r) => r.earn === null || r.earn <= earnDays);
    if (preset === "squeeze")    rows = rows.filter((r) => r.ivr >= 60);
    if (preset === "cheap_vol")  rows = rows.filter((r) => r.ivRv < 1.05);
    if (preset === "skew_pop")   rows = rows.filter((r) => r.skew < -4);
    if (preset === "earn_stub")  rows = rows.filter((r) => (r.earn ?? 99) <= 14);
    return rows.sort((a, b) => (b[sort] as number) - (a[sort] as number));
  }, [minIvr, gexFilter, earnDays, sort, preset]);

  const presets: [string, string][] = [
    ["none", "ALL"], ["squeeze", "IVR SQUEEZE"], ["cheap_vol", "CHEAP VOL"], ["skew_pop", "SKEW POP"], ["earn_stub", "EARN STUB"],
  ];

  return (
    <div className="card-terminal p-2">
      <div className="flex flex-wrap items-end gap-3 mb-2">
        <div>
          <div className="text-[9px] font-mono text-muted-foreground uppercase tracking-wider">Min IV Rank</div>
          <input type="number" value={minIvr} onChange={(e) => setMinIvr(parseInt(e.target.value) || 0)}
            className="w-16 bg-surface-elevated border border-border px-1.5 py-0.5 text-[10px] font-mono text-foreground focus:outline-none focus:border-accent" />
        </div>
        <div>
          <div className="text-[9px] font-mono text-muted-foreground uppercase tracking-wider">GEX</div>
          <div className="flex gap-1">
            {(["ALL", "POS", "NEG"] as const).map((g) => (
              <button key={g} onClick={() => setGexFilter(g)}
                className={`px-2 py-0.5 text-[10px] font-mono border ${gexFilter === g ? "bg-accent text-accent-foreground border-accent" : "border-border text-muted-foreground hover:text-foreground"}`}>{g}</button>
            ))}
          </div>
        </div>
        <div>
          <div className="text-[9px] font-mono text-muted-foreground uppercase tracking-wider">Earnings ≤ days</div>
          <input type="number" value={earnDays} onChange={(e) => setEarnDays(parseInt(e.target.value) || 60)}
            className="w-16 bg-surface-elevated border border-border px-1.5 py-0.5 text-[10px] font-mono text-foreground focus:outline-none focus:border-accent" />
        </div>
        <div className="ml-auto text-[9px] font-mono text-muted-foreground">{filtered.length} / {ROWS.length} match</div>
      </div>
      <div className="flex flex-wrap gap-1 mb-3">
        {presets.map(([k, l]) => (
          <button key={k} onClick={() => setPreset(k)}
            className={`px-2 py-0.5 text-[10px] font-mono border ${preset === k ? "bg-accent text-accent-foreground border-accent" : "border-border text-muted-foreground hover:text-foreground"}`}>{l}</button>
        ))}
      </div>

      <div className="overflow-x-auto">
        <table className="w-full text-[10px] font-mono tabular-nums">
          <thead className="text-muted-foreground border-b border-border">
            <tr>
              {([
                ["sym", "Sym"], ["price", "Px"], ["ivr", "IVR"], ["ivPct", "IV%"], ["ivRv", "IV/RV"], ["ivDelta", "1dΔIV"],
                ["skew", "Skew"], ["term", "Term"], ["em", "EM%"], ["gex", "GEX"], ["earn", "Earn"], ["volOi", "V/OI"], ["q", "Q"],
              ] as [keyof Row, string][]).map(([k, label]) => (
                <th key={k} className={`px-1.5 py-1 ${k === "sym" ? "text-left" : "text-right"} cursor-pointer hover:text-foreground whitespace-nowrap`} onClick={() => setSort(k)}>
                  {label}{sort === k ? " ↓" : ""}
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {filtered.map((r) => (
              <tr key={r.sym} className="border-b border-border/40 hover:bg-surface-elevated cursor-pointer" onClick={() => onOpen?.(r.sym)}>
                <td className="px-1.5 py-1 text-accent font-bold">{r.sym}</td>
                <td className="px-1.5 py-1 text-right text-foreground">{redact ? "••" : r.price.toFixed(2)}</td>
                <td className="px-1.5 py-1 text-right text-foreground">{r.ivr}</td>
                <td className="px-1.5 py-1 text-right text-foreground">{r.ivPct}</td>
                <td className={`px-1.5 py-1 text-right ${r.ivRv > 1.2 ? "text-rose-400" : "text-foreground"}`}>{r.ivRv.toFixed(2)}</td>
                <td className={`px-1.5 py-1 text-right ${r.ivDelta >= 0 ? "text-up" : "text-down"}`}>{r.ivDelta >= 0 ? "+" : ""}{r.ivDelta.toFixed(1)}</td>
                <td className={`px-1.5 py-1 text-right ${r.skew < -4 ? "text-down" : "text-foreground"}`}>{r.skew.toFixed(1)}</td>
                <td className={`px-1.5 py-1 text-right ${r.term < 0 ? "text-down" : "text-foreground"}`}>{r.term.toFixed(1)}</td>
                <td className="px-1.5 py-1 text-right text-foreground">{r.em.toFixed(1)}%</td>
                <td className={`px-1.5 py-1 text-right ${r.gex === "POS" ? "text-emerald-400" : "text-rose-400"}`}>{r.gex}</td>
                <td className="px-1.5 py-1 text-right text-foreground">{r.earn === null ? "—" : `${r.earn}d`}</td>
                <td className={`px-1.5 py-1 text-right ${r.volOi > 0.7 ? "text-accent" : "text-foreground"}`}>{r.volOi.toFixed(2)}</td>
                <td className="px-1.5 py-1 text-right text-accent font-bold">{r.q}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
