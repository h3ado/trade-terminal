import type { SecurityFundamentals } from '@/hooks/useSecurityData';

function fmtValue(n: number | null | undefined): string {
  if (n == null || !isFinite(n)) return '—';
  const abs = Math.abs(n);
  if (abs >= 1e9) return `$${(n / 1e9).toFixed(1)}B`;
  if (abs >= 1e6) return `$${(n / 1e6).toFixed(1)}M`;
  if (abs >= 1e3) return `$${(n / 1e3).toFixed(0)}K`;
  return `$${Math.abs(n).toFixed(0)}`;
}

function fmtShares(n: number | null | undefined): string {
  if (n == null) return '—';
  const abs = Math.abs(n);
  if (abs >= 1e6) return `${(n / 1e6).toFixed(1)}M`;
  if (abs >= 1e3) return `${(n / 1e3).toFixed(0)}K`;
  return n.toLocaleString();
}

function classifyTransaction(description: string): 'buy' | 'sell' | 'exercise' | 'other' {
  const d = description.toLowerCase();
  if (d.includes('sale') || d.includes('sold') || d.includes('sell')) return 'sell';
  if (d.includes('purchase') || d.includes('bought') || d.includes('acquisition')) return 'buy';
  if (d.includes('exercise') || d.includes('option') || d.includes('vesting') || d.includes('vest')) return 'exercise';
  return 'other';
}

const TX_COLORS: Record<string, string> = {
  buy:      'text-positive',
  sell:     'text-negative',
  exercise: 'text-muted-foreground',
  other:    'text-foreground',
};

const TX_LABELS: Record<string, string> = {
  buy: 'BUY', sell: 'SELL', exercise: 'VEST', other: 'OTHER',
};

interface Props {
  fundamentals: SecurityFundamentals;
}

export default function InsTab({ fundamentals }: Props) {
  const txns = fundamentals.insiders?.transactions ?? [];

  // Stats
  const buys  = txns.filter(t => classifyTransaction(t.description) === 'buy');
  const sells = txns.filter(t => classifyTransaction(t.description) === 'sell');
  const buyValue  = buys.reduce((s, t)  => s + Math.abs(t.value ?? 0), 0);
  const sellValue = sells.reduce((s, t) => s + Math.abs(t.value ?? 0), 0);

  return (
    <div className="p-4 space-y-5 overflow-y-auto h-full font-mono text-xs">
      {/* Summary */}
      <section>
        <SectionHeader>Insider Activity Summary</SectionHeader>
        <div className="grid grid-cols-4 gap-3 mt-2">
          <StatCard label="Buy Txns"   value={String(buys.length)}      color="text-positive" />
          <StatCard label="Buy Value"  value={fmtValue(buyValue)}        color="text-positive" />
          <StatCard label="Sell Txns"  value={String(sells.length)}     color="text-negative" />
          <StatCard label="Sell Value" value={fmtValue(sellValue)}       color="text-negative" />
        </div>
        {txns.length > 0 && (
          <div className="mt-2 flex items-center gap-2">
            <div className="flex-1 h-1.5 bg-surface-elevated rounded-full overflow-hidden">
              {(buyValue + sellValue) > 0 && (
                <div
                  className="h-full bg-positive rounded-full"
                  style={{ width: `${Math.min(100, (buyValue / (buyValue + sellValue)) * 100).toFixed(0)}%` }}
                />
              )}
            </div>
            <span className="text-[9px] text-muted-foreground">
              Buy/Sell ratio: {(buyValue + sellValue) > 0
                ? `${((buyValue / (buyValue + sellValue)) * 100).toFixed(0)}% buy`
                : 'N/A'}
            </span>
          </div>
        )}
      </section>

      {/* Transaction table */}
      <section>
        <SectionHeader>Recent Insider Transactions</SectionHeader>
        {txns.length === 0 ? (
          <div className="flex items-center justify-center py-8 text-muted-foreground text-[10px]">
            No insider transactions available
          </div>
        ) : (
          <table className="w-full mt-2">
            <thead>
              <tr className="text-[9px] text-muted-foreground border-b border-border">
                <th className="text-left py-0.5 pr-3 font-normal">Date</th>
                <th className="text-left py-0.5 pr-3 font-normal">Name</th>
                <th className="text-left py-0.5 pr-3 font-normal">Role</th>
                <th className="text-left py-0.5 pr-3 font-normal">Type</th>
                <th className="text-right py-0.5 pr-3 font-normal">Shares</th>
                <th className="text-right py-0.5 font-normal">Value</th>
              </tr>
            </thead>
            <tbody>
              {txns.map((t, i) => {
                const txType = classifyTransaction(t.description);
                const colorClass = TX_COLORS[txType];
                return (
                  <tr key={i} className="border-b border-border/40 hover:bg-surface-elevated group">
                    <td className="py-0.5 pr-3 text-muted-foreground">{t.date}</td>
                    <td className="py-0.5 pr-3 font-semibold">{t.name}</td>
                    <td className="py-0.5 pr-3 text-muted-foreground text-[9px]">{t.relation}</td>
                    <td className={`py-0.5 pr-3 text-[9px] font-bold uppercase ${colorClass}`}>
                      {TX_LABELS[txType]}
                    </td>
                    <td className={`py-0.5 pr-3 text-right tabular-nums ${colorClass}`}>
                      {fmtShares(t.shares)}
                    </td>
                    <td className={`py-0.5 text-right tabular-nums font-bold ${colorClass}`}>
                      {fmtValue(t.value)}
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        )}
      </section>
    </div>
  );
}

function SectionHeader({ children }: { children: React.ReactNode }) {
  return (
    <div className="flex items-center gap-2 border-b border-accent/30 pb-1">
      <span className="text-[9px] text-accent font-bold uppercase tracking-widest">{children}</span>
    </div>
  );
}

function StatCard({ label, value, color }: { label: string; value: string; color: string }) {
  return (
    <div className="border border-border p-2 space-y-0.5">
      <div className="text-[9px] text-muted-foreground">{label}</div>
      <div className={`text-sm font-bold tabular-nums ${color}`}>{value}</div>
    </div>
  );
}
