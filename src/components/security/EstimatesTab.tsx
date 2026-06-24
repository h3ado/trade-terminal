import type { SecurityFundamentals } from '@/hooks/useSecurityData';

function fmtEps(n: number | null | undefined): string {
  if (n == null || !isFinite(n)) return '—';
  return `$${n.toFixed(2)}`;
}

function fmtRev(n: number | null | undefined): string {
  if (n == null || !isFinite(n)) return '—';
  const abs = Math.abs(n);
  if (abs >= 1e12) return `$${(n / 1e12).toFixed(2)}T`;
  if (abs >= 1e9)  return `$${(n / 1e9).toFixed(1)}B`;
  if (abs >= 1e6)  return `$${(n / 1e6).toFixed(1)}M`;
  return `$${n.toLocaleString()}`;
}

function fmtPeriod(p: string): string {
  const map: Record<string, string> = {
    '0q': 'Cur Q',
    '+1q': 'Next Q',
    '0y': 'Cur Year',
    '+1y': 'Next Year',
  };
  return map[p] ?? p;
}

interface Props {
  fundamentals: SecurityFundamentals;
}

export default function EstimatesTab({ fundamentals }: Props) {
  const { estimates } = fundamentals;
  const trend = estimates.trend ?? [];
  const history = estimates.history ?? [];

  return (
    <div className="p-4 space-y-5 overflow-y-auto h-full font-mono text-xs">
      {/* Forward estimates */}
      <section>
        <SectionHeader>Earnings &amp; Revenue Estimates</SectionHeader>
        {trend.length === 0 ? (
          <div className="text-muted-foreground text-center py-4">No estimate data available</div>
        ) : (
          <table className="w-full mt-2">
            <thead>
              <tr className="text-[9px] text-muted-foreground border-b border-border">
                <th className="text-left py-0.5 pr-3 font-normal w-28">Metric</th>
                {trend.map(t => (
                  <th key={t.period} className="text-right py-0.5 pr-2 font-normal">{fmtPeriod(t.period)}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              <EstRow label="EPS (Mean)"     values={trend.map(t => fmtEps(t.epsAvg))} bold />
              <EstRow label="EPS (Low)"      values={trend.map(t => fmtEps(t.epsLow))} dim />
              <EstRow label="EPS (High)"     values={trend.map(t => fmtEps(t.epsHigh))} dim />
              <EstRow label="# EPS Analysts" values={trend.map(t => t.epsAnalysts?.toFixed(0) ?? '—')} dim />
              <EstRow label="" values={[]} />
              <EstRow label="Rev (Mean)"     values={trend.map(t => fmtRev(t.revAvg))} bold />
              <EstRow label="Rev (Low)"      values={trend.map(t => fmtRev(t.revLow))} dim />
              <EstRow label="Rev (High)"     values={trend.map(t => fmtRev(t.revHigh))} dim />
              <EstRow label="# Rev Analysts" values={trend.map(t => t.revAnalysts?.toFixed(0) ?? '—')} dim />
            </tbody>
          </table>
        )}
      </section>

      {/* Earnings history */}
      <section>
        <SectionHeader>Earnings History (Actual vs Estimate)</SectionHeader>
        {history.length === 0 ? (
          <div className="text-muted-foreground text-center py-4">No history available</div>
        ) : (
          <table className="w-full mt-2">
            <thead>
              <tr className="text-[9px] text-muted-foreground border-b border-border">
                <th className="text-left py-0.5 pr-3 font-normal">Period</th>
                <th className="text-right py-0.5 pr-3 font-normal">Estimate</th>
                <th className="text-right py-0.5 pr-3 font-normal">Actual</th>
                <th className="text-right py-0.5 pr-3 font-normal">Surprise</th>
                <th className="text-right py-0.5 font-normal">Result</th>
              </tr>
            </thead>
            <tbody>
              {history.map((h, i) => {
                const beat = (h.surprise ?? 0) >= 0;
                const surprise = h.surprise != null ? `${h.surprise >= 0 ? '+' : ''}${(h.surprise * 100).toFixed(1)}%` : '—';
                return (
                  <tr key={i} className="border-b border-border/40 hover:bg-surface-elevated">
                    <td className="py-0.5 pr-3 text-muted-foreground">{h.quarter}</td>
                    <td className="py-0.5 pr-3 text-right tabular-nums">{fmtEps(h.epsEstimate)}</td>
                    <td className="py-0.5 pr-3 text-right tabular-nums font-semibold">{fmtEps(h.epsActual)}</td>
                    <td className={`py-0.5 pr-3 text-right tabular-nums font-semibold ${beat ? 'text-positive' : 'text-negative'}`}>
                      {surprise}
                    </td>
                    <td className={`py-0.5 text-right text-[9px] font-bold ${beat ? 'text-positive' : 'text-negative'}`}>
                      {beat ? '✓ BEAT' : '✗ MISS'}
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

function EstRow({ label, values, bold, dim }: { label: string; values: string[]; bold?: boolean; dim?: boolean }) {
  if (!label && values.length === 0) return <tr><td colSpan={99} className="py-0.5 border-b border-border/20" /></tr>;
  return (
    <tr className={`border-b border-border/40 hover:bg-surface-elevated ${dim ? 'opacity-70' : ''}`}>
      <td className="py-0.5 pr-3 text-[9px] text-muted-foreground">{label}</td>
      {values.map((v, i) => (
        <td key={i} className={`py-0.5 pr-2 text-right tabular-nums text-[10px] ${bold ? 'font-bold text-foreground' : 'text-muted-foreground'}`}>
          {v}
        </td>
      ))}
    </tr>
  );
}
