// CFTC — Live COT net positioning from CFTC public data via useCFTC hook.
import { useCFTC } from '@/hooks/useCFTC';

const SHOW: { ticker: string; name: string }[] = [
  { ticker: 'ES',  name: 'S&P 500 Mini' },
  { ticker: 'NQ',  name: 'Nasdaq Mini'  },
  { ticker: 'CL',  name: 'WTI Crude'   },
  { ticker: 'GC',  name: 'Gold'         },
  { ticker: 'SI',  name: 'Silver'       },
  { ticker: 'ZB',  name: 'US 30Y'       },
  { ticker: 'ZN',  name: 'US 10Y'       },
  { ticker: '6E',  name: 'Euro FX'      },
  { ticker: '6J',  name: 'Yen'          },
];

function biasColor(bias?: string) {
  if (bias === 'Bullish') return 'text-positive';
  if (bias === 'Bearish') return 'text-negative';
  return 'text-muted-foreground';
}

export default function CftcTile() {
  const { rows, loading, error, reportDate } = useCFTC();

  const byTicker = Object.fromEntries(rows.map(r => [r.ticker, r]));

  const display = SHOW.map(s => ({ ...s, row: byTicker[s.ticker] }));

  const maxNet = Math.max(
    ...display.map(d => Math.abs(d.row?.managedMoney ?? 0)),
    1
  );

  return (
    <div className="flex flex-col h-full min-h-0">
      <div className="px-2 py-1 text-[9px] font-mono font-bold text-muted-foreground uppercase border-b border-border bg-surface-deep flex justify-between items-center">
        <span>CFTC · COT Positioning</span>
        {loading && <span className="text-accent">···</span>}
        {error && <span className="text-negative text-[8px]">ERR</span>}
      </div>

      <div className="flex items-center gap-2 h-5 px-1 bg-surface-deep border-b border-border text-[8px] font-mono uppercase text-muted-foreground">
        <span className="w-8">SYM</span>
        <span className="w-16 truncate">NAME</span>
        <span className="flex-1 text-center">NET (MGD $)</span>
        <span className="w-12 text-right">W/W</span>
        <span className="w-10 text-right">RANK</span>
      </div>

      <div className="flex-1 min-h-0 overflow-auto">
        {display.map(({ ticker, name, row }) => {
          const net = row?.managedMoney ?? null;
          const chg = row?.week ?? null;
          const rank = row?.pctRank ?? null;
          const w = net != null ? Math.min(100, (Math.abs(net) / maxNet) * 100) : 0;
          const pos = (net ?? 0) >= 0;

          return (
            <div key={ticker} className="flex items-center gap-2 h-6 px-1 border-b border-border/40 hover:bg-surface-elevated">
              <span className={`text-[10px] font-mono font-bold w-8 ${biasColor(row?.bias)}`}>{ticker}</span>
              <span className="text-[9px] font-mono uppercase text-muted-foreground w-16 truncate">{name}</span>
              <div className="flex-1 h-3 relative bg-surface-deep border border-border/40 flex">
                <div className="w-1/2 flex justify-end">
                  {!pos && <div className="h-full bg-negative/60" style={{ width: `${w}%` }} />}
                </div>
                <div className="w-px bg-border/60" />
                <div className="w-1/2">
                  {pos && <div className="h-full bg-positive/60" style={{ width: `${w}%` }} />}
                </div>
              </div>
              <span className={`w-12 text-right text-[9px] font-mono tabular-nums ${(chg ?? 0) >= 0 ? 'text-positive' : 'text-negative'}`}>
                {chg != null ? `${chg >= 0 ? '+' : ''}${(chg / 1000).toFixed(1)}k` : '—'}
              </span>
              <span className="w-10 text-right text-[9px] font-mono text-muted-foreground tabular-nums">
                {rank != null ? `${rank.toFixed(0)}%` : '—'}
              </span>
            </div>
          );
        })}

        {rows.length === 0 && !loading && (
          <div className="px-2 py-3 text-center text-[9px] font-mono text-muted-foreground">
            No COT data — CFTC publishes Fridays
          </div>
        )}
      </div>

      {reportDate && (
        <div className="px-2 py-0.5 text-[8px] font-mono text-muted-foreground border-t border-border/40 bg-surface-deep">
          Report: {reportDate}
        </div>
      )}
    </div>
  );
}
