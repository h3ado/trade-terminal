import type { SecurityFundamentals } from '@/hooks/useSecurityData';

function fmtBig(n: number | null | undefined): string {
  if (n == null || !isFinite(n)) return '—';
  if (Math.abs(n) >= 1e12) return `$${(n / 1e12).toFixed(2)}T`;
  if (Math.abs(n) >= 1e9)  return `$${(n / 1e9).toFixed(1)}B`;
  if (Math.abs(n) >= 1e6)  return `$${(n / 1e6).toFixed(0)}M`;
  return n.toLocaleString();
}

function fmtShares(n: number | null | undefined): string {
  if (n == null) return '—';
  if (n >= 1e9) return `${(n / 1e9).toFixed(2)}B`;
  if (n >= 1e6) return `${(n / 1e6).toFixed(1)}M`;
  if (n >= 1e3) return `${(n / 1e3).toFixed(0)}K`;
  return n.toLocaleString();
}

function fmtPct(n: number | null | undefined): string {
  if (n == null || !isFinite(n)) return '—';
  return `${(n * 100).toFixed(2)}%`;
}

interface Props {
  fundamentals: SecurityFundamentals;
}

export default function OwnTab({ fundamentals }: Props) {
  const { ownership } = fundamentals;
  if (!ownership) {
    return <Empty>No ownership data available</Empty>;
  }

  const insiderPct = (ownership.insiderPctHeld ?? 0) * 100;
  const instPct = (ownership.institutionPctHeld ?? 0) * 100;
  const otherPct = Math.max(0, 100 - insiderPct - instPct);

  return (
    <div className="p-4 space-y-5 overflow-y-auto h-full font-mono text-xs">
      {/* Summary bar */}
      <section>
        <SectionHeader>Ownership Breakdown</SectionHeader>
        <div className="mt-3 space-y-2">
          {/* Stacked bar */}
          <div className="flex h-4 rounded-sm overflow-hidden gap-px">
            {insiderPct > 0 && (
              <div className="bg-accent/80" style={{ width: `${insiderPct.toFixed(1)}%` }} title={`Insiders ${insiderPct.toFixed(1)}%`} />
            )}
            {instPct > 0 && (
              <div className="bg-positive/70" style={{ width: `${instPct.toFixed(1)}%` }} title={`Institutions ${instPct.toFixed(1)}%`} />
            )}
            {otherPct > 0 && (
              <div className="bg-surface-elevated flex-1" title={`Other ${otherPct.toFixed(1)}%`} />
            )}
          </div>
          <div className="flex gap-4 text-[9px]">
            <LegendChip color="bg-accent/80"     label="Insiders"     value={fmtPct(ownership.insiderPctHeld)} />
            <LegendChip color="bg-positive/70"   label="Institutions" value={fmtPct(ownership.institutionPctHeld)} />
            <LegendChip color="bg-surface-elevated border border-border" label="Other" value={`${otherPct.toFixed(1)}%`} />
          </div>
        </div>

        <div className="grid grid-cols-2 gap-x-8 gap-y-1 mt-3">
          <Stat label="Float held by Inst."   value={fmtPct(ownership.institutionFloatPct)} />
          <Stat label="# Institutions"        value={ownership.institutionCount?.toLocaleString() ?? '—'} />
        </div>
      </section>

      {/* Holder table */}
      <section>
        <SectionHeader>Top Institutional Holders</SectionHeader>
        {ownership.holders.length === 0 ? (
          <Empty>No holder data available</Empty>
        ) : (
          <table className="w-full mt-2">
            <thead>
              <tr className="text-[9px] text-muted-foreground border-b border-border">
                <th className="text-left py-0.5 pr-3 font-normal">Organization</th>
                <th className="text-right py-0.5 pr-3 font-normal">% Held</th>
                <th className="text-right py-0.5 pr-3 font-normal">Shares</th>
                <th className="text-right py-0.5 pr-3 font-normal">Value</th>
                <th className="text-right py-0.5 font-normal">Report Date</th>
              </tr>
            </thead>
            <tbody>
              {ownership.holders.map((h, i) => (
                <tr key={i} className="border-b border-border/40 hover:bg-surface-elevated">
                  <td className="py-0.5 pr-3 font-semibold truncate max-w-[180px]">{h.organization || '—'}</td>
                  <td className="py-0.5 pr-3 text-right tabular-nums text-positive">{fmtPct(h.pctHeld)}</td>
                  <td className="py-0.5 pr-3 text-right tabular-nums">{fmtShares(h.shares)}</td>
                  <td className="py-0.5 pr-3 text-right tabular-nums">{fmtBig(h.value)}</td>
                  <td className="py-0.5 text-right text-muted-foreground">{h.reportDate}</td>
                </tr>
              ))}
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

function Stat({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex items-baseline justify-between py-0.5">
      <span className="text-[9px] text-muted-foreground">{label}</span>
      <span className="text-[10px] font-bold">{value}</span>
    </div>
  );
}

function LegendChip({ color, label, value }: { color: string; label: string; value: string }) {
  return (
    <div className="flex items-center gap-1.5">
      <div className={`w-2.5 h-2.5 rounded-sm ${color}`} />
      <span className="text-muted-foreground">{label}</span>
      <span className="font-bold text-foreground">{value}</span>
    </div>
  );
}

function Empty({ children }: { children: React.ReactNode }) {
  return (
    <div className="flex items-center justify-center py-8 text-muted-foreground text-[10px]">
      {children}
    </div>
  );
}
