// CORR — Correlation matrix heatmap for the user's watchlist. Tone-mapped cells.
import { useMemo, useState } from 'react';

const SYMBOLS = ['SPY', 'QQQ', 'IWM', 'DIA', 'XLF', 'XLE', 'GLD', 'TLT'];

// Deterministic pseudo-correlations seeded by symbol pair + window so the heatmap shifts
// when the user changes the lookback. No external data required for v1.
function pseudoCorr(a: string, b: string, win: number) {
  if (a === b) return 1;
  const seed = (a.charCodeAt(0) * 31 + b.charCodeAt(1) * 17 + win) % 200;
  return Math.round(((seed - 100) / 100) * 100) / 100;
}

function cellTone(v: number) {
  if (v >= 0.7) return 'bg-positive/40 text-positive';
  if (v >= 0.3) return 'bg-positive/15 text-positive';
  if (v > -0.3) return 'bg-muted/10 text-muted-foreground';
  if (v > -0.7) return 'bg-negative/15 text-negative';
  return 'bg-negative/40 text-negative';
}

const WINDOWS = [20, 60, 120] as const;

export default function CorrMatrix() {
  const [win, setWin] = useState<(typeof WINDOWS)[number]>(60);
  const [hover, setHover] = useState<{ r: number; c: number } | null>(null);

  const grid = useMemo(
    () => SYMBOLS.map(a => SYMBOLS.map(b => pseudoCorr(a, b, win))),
    [win]
  );

  return (
    <div className="space-y-2">
      <div className="flex items-center gap-1">
        <span className="text-[8px] font-mono uppercase text-muted-foreground">Window</span>
        <div className="flex border border-border">
          {WINDOWS.map(w => (
            <button
              key={w}
              onClick={() => setWin(w)}
              className={`px-1.5 py-0.5 text-[9px] font-mono font-bold ${
                win === w ? 'bg-accent/15 text-accent' : 'text-muted-foreground hover:bg-surface-elevated'
              }`}
            >
              {w}D
            </button>
          ))}
        </div>
        <span className="ml-auto text-[8px] font-mono text-muted-foreground/60">rolling</span>
      </div>

      <table className="w-full border-collapse">
        <thead>
          <tr>
            <th className="w-8" />
            {SYMBOLS.map((s, j) => (
              <th
                key={s}
                className={`text-[8px] font-mono p-0.5 text-center ${hover?.c === j ? 'text-accent' : 'text-muted-foreground'}`}
              >
                {s}
              </th>
            ))}
          </tr>
        </thead>
        <tbody>
          {SYMBOLS.map((row, i) => (
            <tr key={row}>
              <td className={`text-[8px] font-mono font-bold p-0.5 ${hover?.r === i ? 'text-accent' : 'text-muted-foreground'}`}>
                {row}
              </td>
              {grid[i].map((v, j) => {
                const isHover = hover && (hover.r === i || hover.c === j);
                return (
                  <td
                    key={j}
                    onMouseEnter={() => setHover({ r: i, c: j })}
                    onMouseLeave={() => setHover(null)}
                    className={`text-[8px] font-mono font-bold tabular-nums p-0.5 text-center border border-border/40 cursor-default ${
                      i === j ? 'bg-surface-elevated text-muted-foreground' : cellTone(v)
                    } ${isHover ? 'ring-1 ring-accent/60' : ''}`}
                  >
                    {i === j ? '—' : v.toFixed(2)}
                  </td>
                );
              })}
            </tr>
          ))}
        </tbody>
      </table>

      <div className="flex items-center gap-2 justify-center pt-1">
        <div className="flex items-center gap-0.5">
          <div className="w-2 h-2 bg-negative/40 border border-border" />
          <span className="text-[7px] font-mono text-muted-foreground">−1</span>
        </div>
        <div className="flex items-center gap-0.5">
          <div className="w-2 h-2 bg-muted/10 border border-border" />
          <span className="text-[7px] font-mono text-muted-foreground">0</span>
        </div>
        <div className="flex items-center gap-0.5">
          <div className="w-2 h-2 bg-positive/40 border border-border" />
          <span className="text-[7px] font-mono text-muted-foreground">+1</span>
        </div>
      </div>
    </div>
  );
}
