import { useState } from 'react';
import { ExternalLink } from 'lucide-react';
import type { SecurityFundamentals } from '@/hooks/useSecurityData';

function fmtBig(n: number | null | undefined): string {
  if (n == null || !isFinite(n)) return '—';
  const abs = Math.abs(n);
  if (abs >= 1e12) return `$${(n / 1e12).toFixed(2)}T`;
  if (abs >= 1e9)  return `$${(n / 1e9).toFixed(2)}B`;
  if (abs >= 1e6)  return `$${(n / 1e6).toFixed(1)}M`;
  return `$${n.toLocaleString()}`;
}

function fmtPct(n: number | null | undefined): string {
  if (n == null || !isFinite(n)) return '—';
  return `${(n * 100).toFixed(2)}%`;
}

function fmtNum(n: number | null | undefined, decimals = 2): string {
  if (n == null || !isFinite(n)) return '—';
  return n.toLocaleString('en-US', { minimumFractionDigits: decimals, maximumFractionDigits: decimals });
}

function fmtPay(n: number | null | undefined): string {
  if (n == null) return '—';
  if (n >= 1e6) return `$${(n / 1e6).toFixed(1)}M`;
  return `$${(n / 1e3).toFixed(0)}K`;
}

interface Props {
  fundamentals: SecurityFundamentals;
  overview?: { price?: number | null; fiftyTwoWeekLow?: number | null; fiftyTwoWeekHigh?: number | null } | null;
}

export default function DesTab({ fundamentals, overview }: Props) {
  const [expanded, setExpanded] = useState(false);
  const { profile, keyStats } = fundamentals;

  const desc = profile.description ?? '';
  const shortDesc = desc.slice(0, 400);
  const needsMore = desc.length > 400;

  return (
    <div className="p-4 space-y-5 overflow-y-auto h-full font-mono text-xs">
      {/* Company info grid */}
      <section>
        <SectionHeader>Company Profile</SectionHeader>
        <div className="grid grid-cols-2 gap-x-8 gap-y-1 mt-2">
          <FieldRow label="Sector"    value={profile.sector} />
          <FieldRow label="Industry"  value={profile.industry} />
          <FieldRow label="Employees" value={profile.employees?.toLocaleString()} />
          <FieldRow label="Country"   value={profile.country} />
          <FieldRow label="HQ"        value={[profile.city, profile.state].filter(Boolean).join(', ') || null} />
          <FieldRow label="Website"
            value={
              profile.website
                ? <a href={profile.website} target="_blank" rel="noreferrer"
                    className="text-accent hover:underline flex items-center gap-1">
                    {profile.website.replace(/^https?:\/\//, '')}
                    <ExternalLink size={9} />
                  </a>
                : null
            }
          />
        </div>
      </section>

      {/* Key stats */}
      <section>
        <SectionHeader>Key Statistics</SectionHeader>
        <div className="grid grid-cols-2 gap-x-8 gap-y-1 mt-2">
          <FieldRow label="Market Cap"       value={fmtBig(keyStats.marketCap)} />
          <FieldRow label="Enterprise Value" value={fmtBig(keyStats.enterpriseValue)} />
          <FieldRow label="Trailing P/E"     value={keyStats.trailingPE != null ? `${fmtNum(keyStats.trailingPE)}x` : null} />
          <FieldRow label="Forward P/E"      value={keyStats.forwardPE != null ? `${fmtNum(keyStats.forwardPE)}x` : null} />
          <FieldRow label="PEG Ratio"        value={keyStats.pegRatio != null ? `${fmtNum(keyStats.pegRatio)}x` : null} />
          <FieldRow label="Price / Book"     value={keyStats.priceToBook != null ? `${fmtNum(keyStats.priceToBook)}x` : null} />
          <FieldRow label="Beta"             value={fmtNum(keyStats.beta)} />
          <FieldRow label="Short Float"      value={keyStats.shortPercentFloat != null ? fmtPct(keyStats.shortPercentFloat) : null} />
          <FieldRow label="Dividend"
            value={keyStats.dividendRate != null
              ? `$${fmtNum(keyStats.dividendRate)} (${fmtPct(keyStats.dividendYield)})`
              : 'None'}
          />
          <FieldRow label="Ex-Div Date"  value={keyStats.exDividendDate !== '—' ? keyStats.exDividendDate : null} />
          <FieldRow label="Earnings Date" value={keyStats.earningsDate !== '—' ? keyStats.earningsDate : null} />
          {overview && (
            <FieldRow label="52W Range"
              value={`$${fmtNum(overview.fiftyTwoWeekLow)} – $${fmtNum(overview.fiftyTwoWeekHigh)}`}
            />
          )}
        </div>
      </section>

      {/* Description */}
      {desc && (
        <section>
          <SectionHeader>Business Description</SectionHeader>
          <p className="mt-2 text-[11px] leading-relaxed text-foreground/80 whitespace-pre-wrap">
            {expanded || !needsMore ? desc : shortDesc + '…'}
          </p>
          {needsMore && (
            <button
              onClick={() => setExpanded(v => !v)}
              className="mt-1 text-accent text-[10px] hover:underline"
            >
              {expanded ? 'Show less' : 'Show more'}
            </button>
          )}
        </section>
      )}

      {/* Executives */}
      {profile.officers.length > 0 && (
        <section>
          <SectionHeader>Key Executives</SectionHeader>
          <table className="w-full mt-2">
            <thead>
              <tr className="text-[9px] text-muted-foreground border-b border-border">
                <th className="text-left py-0.5 pr-3 font-normal">Name</th>
                <th className="text-left py-0.5 pr-3 font-normal">Title</th>
                <th className="text-right py-0.5 font-normal">Total Comp</th>
              </tr>
            </thead>
            <tbody>
              {profile.officers.map((o, i) => (
                <tr key={i} className="border-b border-border/40 hover:bg-surface-elevated">
                  <td className="py-0.5 pr-3 font-semibold">{o.name}</td>
                  <td className="py-0.5 pr-3 text-muted-foreground">{o.title}</td>
                  <td className="py-0.5 text-right tabular-nums">{fmtPay(o.totalPay)}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </section>
      )}
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

function FieldRow({ label, value }: { label: string; value?: string | null | React.ReactNode }) {
  return (
    <div className="flex items-baseline justify-between gap-2 py-0.5">
      <span className="text-[9px] text-muted-foreground shrink-0 w-28">{label}</span>
      <span className="text-[10px] font-semibold text-right truncate">
        {value ?? <span className="text-muted-foreground">—</span>}
      </span>
    </div>
  );
}
