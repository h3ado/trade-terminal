import type { SecurityFundamentals, RecommendationCounts } from '@/hooks/useSecurityData';

function fmtPrice(n: number | null | undefined): string {
  if (n == null || !isFinite(n)) return '—';
  return `$${n.toFixed(2)}`;
}

const GRADE_COLOR: Record<string, string> = {
  'Strong Buy': 'text-positive',
  'Buy':        'text-positive',
  'Outperform': 'text-positive',
  'Overweight': 'text-positive',
  'Positive':   'text-positive',
  'Neutral':    'text-muted-foreground',
  'Hold':       'text-muted-foreground',
  'Market Perform': 'text-muted-foreground',
  'Equal-Weight': 'text-muted-foreground',
  'Sector Perform': 'text-muted-foreground',
  'Sell':       'text-negative',
  'Underperform': 'text-negative',
  'Underweight': 'text-negative',
  'Negative':   'text-negative',
  'Strong Sell': 'text-negative',
};

function gradeColor(grade: string): string {
  return GRADE_COLOR[grade] ?? 'text-foreground';
}

function RatingBar({ label, count, total, colorClass }: {
  label: string; count: number; total: number; colorClass: string;
}) {
  const pct = total > 0 ? (count / total) * 100 : 0;
  return (
    <div className="flex items-center gap-2 py-0.5">
      <span className="text-[9px] text-muted-foreground w-24 shrink-0">{label}</span>
      <div className="flex-1 h-2 bg-surface-elevated rounded-sm overflow-hidden">
        <div
          className={`h-full rounded-sm ${colorClass}`}
          style={{ width: `${pct.toFixed(0)}%` }}
        />
      </div>
      <span className="text-[9px] font-bold text-foreground w-8 text-right tabular-nums">{count}</span>
      <span className="text-[9px] text-muted-foreground w-10 text-right tabular-nums">
        {pct.toFixed(0)}%
      </span>
    </div>
  );
}

interface Props {
  fundamentals: SecurityFundamentals;
  currentPrice?: number | null;
}

export default function AnalystTab({ fundamentals, currentPrice }: Props) {
  const { analyst } = fundamentals;
  const rec: RecommendationCounts | null = analyst.recommendations;
  const total = rec ? rec.strongBuy + rec.buy + rec.hold + rec.sell + rec.strongSell : 0;

  const upside = analyst.targetMean != null && currentPrice
    ? ((analyst.targetMean - currentPrice) / currentPrice) * 100
    : null;

  return (
    <div className="p-4 space-y-5 overflow-y-auto h-full font-mono text-xs">
      {/* Consensus */}
      <section>
        <SectionHeader>Consensus Ratings</SectionHeader>
        {rec && total > 0 ? (
          <div className="mt-2 space-y-0.5">
            <RatingBar label="Strong Buy"  count={rec.strongBuy}   total={total} colorClass="bg-positive" />
            <RatingBar label="Buy"         count={rec.buy}         total={total} colorClass="bg-positive/60" />
            <RatingBar label="Hold"        count={rec.hold}        total={total} colorClass="bg-muted-foreground/40" />
            <RatingBar label="Sell"        count={rec.sell}        total={total} colorClass="bg-negative/60" />
            <RatingBar label="Strong Sell" count={rec.strongSell}  total={total} colorClass="bg-negative" />
            <div className="text-[9px] text-muted-foreground mt-1">
              {analyst.numAnalysts ?? total} analysts covering {fundamentals.ticker}
            </div>
          </div>
        ) : (
          <div className="text-muted-foreground text-center py-4 text-[10px]">No recommendation data available</div>
        )}
      </section>

      {/* Price target */}
      <section>
        <SectionHeader>Price Target</SectionHeader>
        <div className="mt-2 grid grid-cols-3 gap-4">
          <PriceTargetCell label="Mean Target" value={fmtPrice(analyst.targetMean)}
            sub={upside != null ? `${upside >= 0 ? '+' : ''}${upside.toFixed(1)}% upside` : undefined}
            subClass={upside != null ? (upside >= 0 ? 'text-positive' : 'text-negative') : ''}
            bold
          />
          <PriceTargetCell label="Low"  value={fmtPrice(analyst.targetLow)} />
          <PriceTargetCell label="High" value={fmtPrice(analyst.targetHigh)} />
        </div>

        {/* Range bar */}
        {analyst.targetLow != null && analyst.targetHigh != null && analyst.targetMean != null && (
          <div className="mt-3">
            <div className="relative h-1 bg-surface-elevated rounded-full">
              {/* Mean marker */}
              {(() => {
                const range = analyst.targetHigh - analyst.targetLow;
                if (range <= 0) return null;
                const meanPos = ((analyst.targetMean - analyst.targetLow) / range) * 100;
                const currentPos = currentPrice
                  ? Math.max(0, Math.min(100, ((currentPrice - analyst.targetLow) / range) * 100))
                  : null;
                return (
                  <>
                    <div className="absolute top-0 h-full bg-accent/30 rounded-full" style={{ left: 0, width: '100%' }} />
                    {currentPos != null && (
                      <div className="absolute top-1/2 -translate-y-1/2 w-2 h-2 rounded-full bg-foreground border border-background z-10"
                        style={{ left: `${currentPos}%`, transform: 'translate(-50%, -50%)' }}
                        title="Current price"
                      />
                    )}
                    <div className="absolute top-1/2 -translate-y-1/2 w-2 h-2 rounded-full bg-accent z-20"
                      style={{ left: `${meanPos}%`, transform: 'translate(-50%, -50%)' }}
                      title="Mean target"
                    />
                  </>
                );
              })()}
            </div>
            <div className="flex justify-between text-[9px] text-muted-foreground mt-1">
              <span>{fmtPrice(analyst.targetLow)}</span>
              <span className="text-accent">{fmtPrice(analyst.targetMean)} target</span>
              <span>{fmtPrice(analyst.targetHigh)}</span>
            </div>
          </div>
        )}
      </section>

      {/* Upgrade/downgrade history */}
      <section>
        <SectionHeader>Recent Actions</SectionHeader>
        {analyst.upgrades.length === 0 ? (
          <div className="text-muted-foreground text-center py-4 text-[10px]">No recent analyst actions</div>
        ) : (
          <table className="w-full mt-2">
            <thead>
              <tr className="text-[9px] text-muted-foreground border-b border-border">
                <th className="text-left py-0.5 pr-3 font-normal">Date</th>
                <th className="text-left py-0.5 pr-3 font-normal">Firm</th>
                <th className="text-left py-0.5 pr-3 font-normal">Action</th>
                <th className="text-left py-0.5 pr-3 font-normal">From</th>
                <th className="text-left py-0.5 font-normal">To</th>
              </tr>
            </thead>
            <tbody>
              {analyst.upgrades.slice(0, 15).map((u, i) => {
                const actionColor =
                  u.action === 'up' ? 'text-positive' :
                  u.action === 'down' ? 'text-negative' :
                  'text-muted-foreground';
                const actionLabel =
                  u.action === 'up' ? 'Upgraded' :
                  u.action === 'down' ? 'Downgraded' :
                  'Maintained';
                return (
                  <tr key={i} className="border-b border-border/40 hover:bg-surface-elevated">
                    <td className="py-0.5 pr-3 text-muted-foreground">{u.date}</td>
                    <td className="py-0.5 pr-3 font-semibold truncate max-w-[120px]">{u.firm}</td>
                    <td className={`py-0.5 pr-3 font-bold text-[9px] uppercase ${actionColor}`}>{actionLabel}</td>
                    <td className={`py-0.5 pr-3 text-[9px] ${gradeColor(u.fromGrade)}`}>{u.fromGrade || '—'}</td>
                    <td className={`py-0.5 text-[9px] font-semibold ${gradeColor(u.toGrade)}`}>{u.toGrade || '—'}</td>
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

function PriceTargetCell({ label, value, sub, subClass, bold }: {
  label: string; value: string; sub?: string; subClass?: string; bold?: boolean;
}) {
  return (
    <div className="flex flex-col border border-border p-2">
      <span className="text-[9px] text-muted-foreground">{label}</span>
      <span className={`text-base tabular-nums ${bold ? 'font-bold text-foreground' : 'text-muted-foreground'}`}>{value}</span>
      {sub && <span className={`text-[9px] ${subClass ?? 'text-muted-foreground'}`}>{sub}</span>}
    </div>
  );
}
