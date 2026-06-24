import { useWorldBank } from '@/hooks/useWorldBank';

interface Props {
  /** ISO3 country code (e.g. 'USA', 'CHN', 'DEU'). */
  iso3: string;
  countryName?: string;
}

function fmtNum(v: number | null, unit: string): string {
  if (v == null) return '—';
  if (unit === 'USD') {
    if (v >= 1e12) return `$${(v / 1e12).toFixed(2)}T`;
    if (v >= 1e9) return `$${(v / 1e9).toFixed(1)}B`;
    if (v >= 1e6) return `$${(v / 1e6).toFixed(0)}M`;
    return `$${v.toLocaleString(undefined, { maximumFractionDigits: 0 })}`;
  }
  if (unit === 'people') {
    if (v >= 1e9) return `${(v / 1e9).toFixed(2)}B`;
    if (v >= 1e6) return `${(v / 1e6).toFixed(1)}M`;
    return v.toLocaleString();
  }
  return `${v.toFixed(2)}${unit}`;
}

const KEYS = ['gdp_usd', 'gdp_per_cap', 'gdp_growth', 'inflation', 'unemployment', 'population', 'current_acct', 'govt_debt'];

/** Compact strip of World Bank indicators for one country. */
export default function WorldBankStrip({ iso3, countryName }: Props) {
  const { byKey, loading, error, ts } = useWorldBank();

  return (
    <div className="border border-accent/40 bg-accent/5 px-2 py-1.5 flex items-center gap-3 font-mono text-[10px] overflow-x-auto">
      <span className="text-accent font-bold uppercase tracking-wider whitespace-nowrap">
        LIVE · WORLD BANK · {countryName ?? iso3}{loading && !ts ? ' …' : ''}
      </span>
      {error && <span className="text-negative whitespace-nowrap">err: {error}</span>}
      {!error && KEYS.map((k) => {
        const ind = byKey[k];
        const d = ind?.byIso3[iso3];
        if (!ind) return <span key={k} className="text-muted-foreground whitespace-nowrap">{k}: —</span>;
        return (
          <span key={k} className="whitespace-nowrap flex items-center gap-1">
            <span className="text-muted-foreground uppercase">{ind.label}</span>
            <span className="text-foreground font-bold">{fmtNum(d?.value ?? null, ind.unit)}</span>
            {d?.year && <span className="text-muted-foreground/60">{d.year}</span>}
          </span>
        );
      })}
      {ts && (
        <span className="ml-auto text-muted-foreground/50 whitespace-nowrap">
          upd {new Date(ts).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}
        </span>
      )}
    </div>
  );
}
