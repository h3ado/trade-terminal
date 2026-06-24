import { useMemo } from 'react';

interface Props { ticker: string; spot: number; impliedMovePct: number; straddle: number; redact?: boolean; }

const SCENARIOS = [
  { label: '-2σ', mult: -2 },
  { label: '-1σ', mult: -1 },
  { label: '-0.5σ', mult: -0.5 },
  { label: 'Flat', mult: 0 },
  { label: '+0.5σ', mult: 0.5 },
  { label: '+1σ', mult: 1 },
  { label: '+2σ', mult: 2 },
];

const STRUCTURES = [
  { name: 'Long Straddle', payoff: (m: number, s: number) => Math.abs(m) * s * 100 - s * 100 * 2 },
  { name: 'Short Iron Fly', payoff: (m: number, s: number) => Math.max(-Math.abs(m) * s * 100 + s * 100 * 0.6, -s * 100 * 0.8) },
  { name: 'Long 1σ Strangle', payoff: (m: number, s: number) => Math.max(0, (Math.abs(m) - 1) * s * 100) - s * 100 * 0.8 },
  { name: 'Calendar', payoff: (m: number, _s: number) => 40 - Math.abs(m) * 18 },
];

export default function EarnScenarioGrid({ ticker, spot, impliedMovePct, straddle, redact = false }: Props) {
  const rows = useMemo(() => {
    const sigma = impliedMovePct / 100;
    return STRUCTURES.map((st) => ({
      name: st.name,
      cells: SCENARIOS.map((sc) => {
        const move = sc.mult * sigma;
        const price = spot * (1 + move);
        const pnl = st.payoff(sc.mult, straddle);
        return { price, pnl };
      }),
    }));
  }, [spot, impliedMovePct, straddle]);

  return (
    <div className="card-terminal p-2">
      <div className="flex items-baseline gap-2 mb-2">
        <span className="text-[10px] font-mono font-bold text-accent">SCENARIO P&L GRID</span>
        <span className="text-[9px] font-mono text-muted-foreground">{ticker} · 1 contract · ±σ moves around print</span>
      </div>
      <table className="w-full text-[10px] font-mono tabular-nums">
        <thead className="text-muted-foreground border-b border-border">
          <tr>
            <th className="text-left px-1.5 py-1">Structure</th>
            {SCENARIOS.map((s) => (
              <th key={s.label} className="text-right px-1.5 py-1">{s.label}</th>
            ))}
          </tr>
          <tr className="text-[8px] text-muted-foreground/60">
            <td className="px-1.5 pb-1">Spot →</td>
            {SCENARIOS.map((s, i) => (
              <td key={i} className="text-right px-1.5 pb-1">
                {redact ? '••' : (spot * (1 + (s.mult * impliedMovePct) / 100)).toFixed(2)}
              </td>
            ))}
          </tr>
        </thead>
        <tbody>
          {rows.map((r) => (
            <tr key={r.name} className="border-b border-border/30">
              <td className="px-1.5 py-1 text-foreground">{r.name}</td>
              {r.cells.map((c, i) => (
                <td key={i} className={`px-1.5 py-1 text-right ${c.pnl >= 0 ? 'text-up' : 'text-down'}`}>
                  {redact ? '••' : (c.pnl >= 0 ? '+' : '') + c.pnl.toFixed(0)}
                </td>
              ))}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
