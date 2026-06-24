// Last 8 earnings prints: expected vs actual, gap, post-event moves.
function hash(s: string): number { let h = 2166136261; for (let i = 0; i < s.length; i++) { h ^= s.charCodeAt(i); h = Math.imul(h, 16777619); } return h >>> 0; }
function rng(seed: number) { let a = seed; return () => { a |= 0; a = (a + 0x6D2B79F5) | 0; let t = a; t = Math.imul(t ^ (t >>> 15), t | 1); t ^= t + Math.imul(t ^ (t >>> 7), t | 61); return ((t ^ (t >>> 14)) >>> 0) / 4294967296; }; }

interface Props { ticker: string; redact?: boolean; }

export default function EarnHistoryTable({ ticker, redact = false }: Props) {
  const r = rng(hash(ticker + ":earnh"));
  const rows = Array.from({ length: 8 }, (_, i) => {
    const q = 4 - (i % 4);
    const y = 2025 - Math.floor(i / 4);
    const expected = +(0.5 + r() * 4).toFixed(2);
    const actual = +(expected * (0.85 + r() * 0.45)).toFixed(2);
    const gap = +((actual / expected - 1) * 100).toFixed(1);
    const d1 = +((r() - 0.45) * 12).toFixed(2);
    const d5 = +(d1 + (r() - 0.5) * 6).toFixed(2);
    return { period: `Q${q} '${(y % 100).toString().padStart(2,"0")}`, expected, actual, gap, d1, d5 };
  });

  return (
    <div className="card-terminal p-2">
      <div className="flex items-baseline gap-2 mb-2">
        <span className="text-[10px] font-mono font-bold text-accent">PRINT HISTORY</span>
        <span className="text-[9px] font-mono text-muted-foreground">{ticker} · last 8 quarters</span>
      </div>
      <table className="w-full text-[10px] font-mono tabular-nums">
        <thead className="text-muted-foreground border-b border-border">
          <tr>
            <th className="text-left px-1.5 py-1">Period</th>
            <th className="text-right px-1.5 py-1">Est EPS</th>
            <th className="text-right px-1.5 py-1">Actual</th>
            <th className="text-right px-1.5 py-1">Gap%</th>
            <th className="text-right px-1.5 py-1">1d%</th>
            <th className="text-right px-1.5 py-1">5d%</th>
          </tr>
        </thead>
        <tbody>
          {rows.map(r => (
            <tr key={r.period} className="border-b border-border/30">
              <td className="px-1.5 py-1 text-foreground">{r.period}</td>
              <td className="px-1.5 py-1 text-right text-muted-foreground">{redact ? "••" : r.expected.toFixed(2)}</td>
              <td className="px-1.5 py-1 text-right text-foreground">{redact ? "••" : r.actual.toFixed(2)}</td>
              <td className={`px-1.5 py-1 text-right ${r.gap >= 0 ? "text-up" : "text-down"}`}>{redact ? "••" : (r.gap >= 0 ? "+" : "") + r.gap}%</td>
              <td className={`px-1.5 py-1 text-right ${r.d1 >= 0 ? "text-up" : "text-down"}`}>{redact ? "••" : (r.d1 >= 0 ? "+" : "") + r.d1}%</td>
              <td className={`px-1.5 py-1 text-right ${r.d5 >= 0 ? "text-up" : "text-down"}`}>{redact ? "••" : (r.d5 >= 0 ? "+" : "") + r.d5}%</td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
