import type { PeerRow } from '@/hooks/useSecurityData';

function fmtBig(n: number | null | undefined): string {
  if (n == null || !isFinite(n)) return '—';
  const abs = Math.abs(n);
  if (abs >= 1e12) return `$${(n / 1e12).toFixed(1)}T`;
  if (abs >= 1e9)  return `$${(n / 1e9).toFixed(0)}B`;
  if (abs >= 1e6)  return `$${(n / 1e6).toFixed(0)}M`;
  return `$${n.toFixed(0)}`;
}

function fmtPE(n: number | null | undefined): string {
  if (n == null || !isFinite(n) || n <= 0) return '—';
  return `${n.toFixed(1)}x`;
}

function fmtPct(n: number | null | undefined): string {
  if (n == null || !isFinite(n)) return '—';
  return `${(n * 100).toFixed(1)}%`;
}

function fmtChg(n: number | null | undefined): string {
  if (n == null || !isFinite(n)) return '—';
  return `${n >= 0 ? '+' : ''}${(n * 100).toFixed(2)}%`;
}

type MetricDef = {
  label: string;
  key: keyof PeerRow;
  fmt: (n: number | null | undefined) => string;
  higherIsBetter?: boolean;
};

const METRICS: MetricDef[] = [
  { label: 'Market Cap',    key: 'marketCap',      fmt: fmtBig },
  { label: 'Price',         key: 'price',          fmt: n => n != null ? `$${n.toFixed(2)}` : '—' },
  { label: 'Day Change',    key: 'changePct',      fmt: fmtChg, higherIsBetter: true },
  { label: 'Trailing P/E',  key: 'trailingPE',     fmt: fmtPE },
  { label: 'Forward P/E',   key: 'forwardPE',      fmt: fmtPE },
  { label: 'PEG Ratio',     key: 'pegRatio',       fmt: fmtPE },
  { label: 'Rev Growth',    key: 'revenueGrowth',  fmt: fmtPct, higherIsBetter: true },
  { label: 'Net Margin',    key: 'profitMargins',  fmt: fmtPct, higherIsBetter: true },
  { label: 'ROE',           key: 'returnOnEquity', fmt: fmtPct, higherIsBetter: true },
];

interface Props {
  ticker: string;
  peers: PeerRow[] | null;
  loading: boolean;
}

export default function CompTab({ ticker, peers, loading }: Props) {
  if (loading) {
    return (
      <div className="flex items-center justify-center h-full text-muted-foreground text-[10px] animate-pulse font-mono">
        Loading peer data…
      </div>
    );
  }
  if (!peers || peers.length === 0) {
    return (
      <div className="flex items-center justify-center h-full text-muted-foreground text-[10px] font-mono">
        No comparable companies found for {ticker}
      </div>
    );
  }

  const allTickers = [ticker, ...peers.map(p => p.ticker)];

  // For each metric, find min/max across peers to highlight best/worst
  const getBounds = (key: keyof PeerRow) => {
    const vals = peers.map(p => p[key] as number | null).filter((v): v is number => v != null && isFinite(v));
    if (vals.length === 0) return { min: null, max: null };
    return { min: Math.min(...vals), max: Math.max(...vals) };
  };

  return (
    <div className="p-4 overflow-y-auto h-full font-mono text-xs">
      <div className="flex items-center gap-2 border-b border-accent/30 pb-1 mb-3">
        <span className="text-[9px] text-accent font-bold uppercase tracking-widest">Comparable Companies</span>
        <span className="text-[9px] text-muted-foreground">— {allTickers.join(' · ')}</span>
      </div>

      <div className="overflow-x-auto">
        <table className="w-full min-w-max">
          <thead>
            <tr className="border-b border-border">
              <th className="text-left py-1 pr-4 text-[9px] text-muted-foreground font-normal w-28">Metric</th>
              {/* Current ticker column — highlighted */}
              <th className="text-right py-1 px-2 text-[9px] font-bold text-accent bg-accent/10 min-w-[80px]">
                {ticker}
              </th>
              {peers.map(p => (
                <th key={p.ticker} className="text-right py-1 px-2 text-[9px] font-bold text-muted-foreground min-w-[80px]">
                  {p.ticker}
                </th>
              ))}
            </tr>
            <tr className="border-b border-border/40">
              <td className="py-0.5 pr-4 text-[9px] text-muted-foreground/50">Company</td>
              <td className="py-0.5 px-2 text-right text-[9px] text-muted-foreground bg-accent/5 truncate max-w-[100px]">
                —
              </td>
              {peers.map(p => (
                <td key={p.ticker} className="py-0.5 px-2 text-right text-[9px] text-muted-foreground truncate max-w-[100px]">
                  {p.name.split(' ').slice(0, 2).join(' ')}
                </td>
              ))}
            </tr>
          </thead>
          <tbody>
            {METRICS.map(metric => {
              const bounds = getBounds(metric.key);
              return (
                <tr key={metric.key} className="border-b border-border/30 hover:bg-surface-elevated">
                  <td className="py-0.5 pr-4 text-[9px] text-muted-foreground">{metric.label}</td>
                  {/* Current ticker — no highlighting (we don't have its data here) */}
                  <td className="py-0.5 px-2 text-right text-[10px] font-semibold tabular-nums bg-accent/5 text-foreground">
                    —
                  </td>
                  {peers.map(p => {
                    const raw = p[metric.key] as number | null;
                    const formatted = metric.fmt(raw);
                    let cellClass = 'text-foreground';
                    if (raw != null && bounds.min != null && bounds.max != null && bounds.min !== bounds.max) {
                      const isTop = metric.higherIsBetter ? raw === bounds.max : raw === bounds.min;
                      const isBot = metric.higherIsBetter ? raw === bounds.min : raw === bounds.max;
                      if (isTop) cellClass = 'text-positive font-bold';
                      else if (isBot) cellClass = 'text-negative';
                    }
                    return (
                      <td key={p.ticker} className={`py-0.5 px-2 text-right text-[10px] tabular-nums ${cellClass}`}>
                        {formatted}
                      </td>
                    );
                  })}
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
      <p className="mt-3 text-[9px] text-muted-foreground">
        Green = best in peer group for that metric · Red = worst · Current ticker column shows live data on GP tab
      </p>
    </div>
  );
}
