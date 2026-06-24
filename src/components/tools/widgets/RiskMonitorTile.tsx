// RISK — Live risk monitor for Trading Tools popout.
// Adds a horizontal "risk thermometer" at the top keyed to exposure %.
import { useMemo } from 'react';
import { useTrades } from '@/contexts/TradeContext';
import { usePrivacy } from '@/contexts/PrivacyContext';
import { calcMaxDrawdown, calcTotalPnl } from '@/types/trade';

const DAILY_LOSS_LIMIT_PCT = 3;

export default function RiskMonitorTile() {
  const { trades } = useTrades();
  const { privacyMode, activeAccount, formatMoney } = usePrivacy();

  const r = useMemo(() => {
    const open = trades.filter(t => !t.exit);
    const totalPnl = calcTotalPnl(trades);
    const equity = (activeAccount?.balance || 0) + totalPnl;
    const exposure = open.reduce((s, t) => s + Math.abs(t.entry * t.size), 0);
    const exposurePct = equity > 0 ? (exposure / equity) * 100 : 0;

    const symMap: Record<string, number> = {};
    open.forEach(t => {
      const v = Math.abs(t.entry * t.size);
      symMap[t.symbol] = (symMap[t.symbol] || 0) + v;
    });
    const maxConc = exposure > 0 ? (Math.max(0, ...Object.values(symMap)) / exposure) * 100 : 0;

    const today = new Date().toISOString().slice(0, 10);
    const dayPnl = trades
      .filter(t => (t.date || '').slice(0, 10) === today)
      .reduce((s, t) => s + t.pnl, 0);
    const dayLossLimit = -equity * (DAILY_LOSS_LIMIT_PCT / 100);
    const distToLimit = dayPnl - dayLossLimit;

    const dd = calcMaxDrawdown(trades);
    const ddPct = equity > 0 ? (dd / equity) * 100 : 0;

    const dayVar = exposure * 0.0165;

    return { exposurePct, maxConc, dayPnl, dayLossLimit, distToLimit, dd, ddPct, dayVar };
  }, [trades, activeAccount]);

  const row = (label: string, value: string, tone: 'pos' | 'neg' | 'accent' | 'neu', sub?: string) => (
    <div className="flex items-center justify-between py-1 border-b border-border/40 last:border-0">
      <span className="text-[9px] font-mono uppercase text-muted-foreground">{label}</span>
      <div className="flex flex-col items-end">
        <span
          className={`text-[10px] font-mono font-bold tabular-nums ${
            tone === 'pos' ? 'text-positive' : tone === 'neg' ? 'text-negative' : tone === 'accent' ? 'text-accent' : 'text-foreground'
          }`}
        >
          {value}
        </span>
        {sub && <span className="text-[8px] font-mono text-muted-foreground tabular-nums">{sub}</span>}
      </div>
    </div>
  );

  const fmtPct = (v: number, sign = false) => (privacyMode ? '••' : `${sign && v >= 0 ? '+' : ''}${v.toFixed(1)}%`);

  // Risk thermometer: green → amber → red
  const thermPct = Math.min(100, r.exposurePct);
  return (
    <div className="space-y-2">
      <div>
        <div className="flex items-center justify-between mb-0.5">
          <span className="text-[8px] font-mono uppercase text-muted-foreground">Risk Thermometer</span>
          <span className={`text-[9px] font-mono font-bold tabular-nums ${r.exposurePct > 80 ? 'text-negative' : r.exposurePct > 50 ? 'text-[hsl(45,100%,60%)]' : 'text-positive'}`}>
            {fmtPct(r.exposurePct)}
          </span>
        </div>
        <div className="h-1.5 bg-surface-elevated border border-border relative overflow-hidden">
          <div className="absolute inset-0 bg-gradient-to-r from-positive via-[hsl(45,100%,60%)] to-negative opacity-30" />
          <div className="absolute top-0 bottom-0 w-px bg-foreground" style={{ left: `${thermPct}%` }} />
        </div>
      </div>

      <div className="space-y-0">
        {row('Exposure', fmtPct(r.exposurePct), r.exposurePct > 80 ? 'neg' : r.exposurePct > 50 ? 'accent' : 'pos')}
        {row('Max Concentration', fmtPct(r.maxConc), r.maxConc > 40 ? 'neg' : 'accent')}
        {row('Day VaR (95%)', formatMoney(r.dayVar), 'accent', '1d, 1σ proxy')}
        {row('Day P&L', formatMoney(r.dayPnl, { showSign: true }), r.dayPnl >= 0 ? 'pos' : 'neg')}
        {row(
          'Day Limit',
          formatMoney(r.dayLossLimit),
          r.distToLimit < 0 ? 'neg' : 'neu',
          privacyMode ? '••' : `${r.distToLimit >= 0 ? 'safe by ' : 'over by '}${formatMoney(Math.abs(r.distToLimit))}`
        )}
        {row('Max Drawdown', formatMoney(-r.dd), r.dd > 0 ? 'neg' : 'neu', fmtPct(-r.ddPct))}
      </div>
    </div>
  );
}
