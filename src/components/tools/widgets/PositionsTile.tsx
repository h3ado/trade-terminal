// POS — Open Positions mini-blotter with % move + entry-vs-now sparkline per row.
import { useTrades } from '@/contexts/TradeContext';
import { usePrivacy } from '@/contexts/PrivacyContext';
import Sparkline from './Sparkline';

export default function PositionsTile() {
  const { trades } = useTrades();
  const { privacyMode, formatMoney } = usePrivacy();
  const open = trades.filter(t => !t.exit);

  if (open.length === 0) {
    return (
      <div className="py-3 text-center text-[9px] font-mono text-muted-foreground uppercase">
        No open positions
      </div>
    );
  }

  // KPI strip
  const totalUnrl = open.reduce((s, t) => s + (t.pnl || 0), 0);
  const winners = open.filter(t => (t.pnl || 0) > 0).length;
  const losers = open.filter(t => (t.pnl || 0) < 0).length;

  return (
    <div className="space-y-0">
      <div className="grid grid-cols-3 gap-[1px] bg-border mb-1">
        <div className="bg-surface-deep px-2 py-1">
          <div className="text-[7px] font-mono uppercase text-muted-foreground">Open</div>
          <div className="text-[10px] font-mono font-bold text-accent tabular-nums">{open.length}</div>
        </div>
        <div className="bg-surface-deep px-2 py-1">
          <div className="text-[7px] font-mono uppercase text-muted-foreground">Unrl P&amp;L</div>
          <div className={`text-[10px] font-mono font-bold tabular-nums ${totalUnrl >= 0 ? 'text-positive' : 'text-negative'}`}>
            {formatMoney(totalUnrl, { showSign: true })}
          </div>
        </div>
        <div className="bg-surface-deep px-2 py-1">
          <div className="text-[7px] font-mono uppercase text-muted-foreground">W/L</div>
          <div className="text-[10px] font-mono font-bold tabular-nums">
            <span className="text-positive">{winners}</span>
            <span className="text-muted-foreground">/</span>
            <span className="text-negative">{losers}</span>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-[1fr_22px_36px_44px_36px_50px_44px] gap-1 px-1 py-1 border-b border-border bg-surface-deep">
        <span className="text-[8px] font-mono uppercase text-muted-foreground">Sym</span>
        <span className="text-[8px] font-mono uppercase text-muted-foreground text-center">S</span>
        <span className="text-[8px] font-mono uppercase text-muted-foreground text-right">Qty</span>
        <span className="text-[8px] font-mono uppercase text-muted-foreground text-right">Entry</span>
        <span className="text-[8px] font-mono uppercase text-muted-foreground" />
        <span className="text-[8px] font-mono uppercase text-muted-foreground text-right">Unrl</span>
        <span className="text-[8px] font-mono uppercase text-muted-foreground text-right">%</span>
      </div>
      {open.slice(0, 12).map(t => {
        const long = t.side === 'LONG' || t.side === 'CALL';
        const unrl = t.pnl || 0;
        const pct = t.entry > 0 && t.size > 0 ? (unrl / (t.entry * t.size)) * 100 * (long ? 1 : -1) : 0;
        // Build a synthetic spark from entry to implied current price
        const cur = t.size > 0 ? t.entry + unrl / t.size : t.entry;
        const spark = [t.entry, t.entry * 0.998, t.entry * 1.002, t.entry * 1.001, (t.entry + cur) / 2, cur];
        return (
          <div key={t.id} className="grid grid-cols-[1fr_22px_36px_44px_36px_50px_44px] gap-1 px-1 py-1 border-b border-border/40 hover:bg-surface-elevated items-center">
            <span className="text-[10px] font-mono font-bold text-foreground truncate">{t.symbol}</span>
            <span className={`text-[8px] font-mono font-bold text-center px-1 ${long ? 'text-positive bg-positive/10' : 'text-negative bg-negative/10'}`}>
              {long ? 'L' : 'S'}
            </span>
            <span className="text-[10px] font-mono tabular-nums text-foreground text-right">
              {privacyMode ? '••' : t.size}
            </span>
            <span className="text-[10px] font-mono tabular-nums text-muted-foreground text-right">
              {privacyMode ? '••' : t.entry.toFixed(2)}
            </span>
            <Sparkline values={spark} width={32} height={10} tone={unrl >= 0 ? 'pos' : 'neg'} />
            <span className={`text-[10px] font-mono font-bold tabular-nums text-right ${unrl >= 0 ? 'text-positive' : 'text-negative'}`}>
              {formatMoney(unrl, { showSign: true })}
            </span>
            <span className={`text-[9px] font-mono tabular-nums text-right ${pct >= 0 ? 'text-positive' : 'text-negative'}`}>
              {privacyMode ? '••' : `${pct >= 0 ? '+' : ''}${pct.toFixed(2)}%`}
            </span>
          </div>
        );
      })}
      <div className="px-1 py-1 text-[8px] font-mono text-muted-foreground/60 text-right">
        {open.length} open · showing {Math.min(12, open.length)}
      </div>
    </div>
  );
}
