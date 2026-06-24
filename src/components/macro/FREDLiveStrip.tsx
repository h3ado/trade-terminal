import { useFRED, type FREDIndicator } from '@/hooks/useFRED';

interface FREDLiveStripProps {
  /** Stable keys from the fred-indicators edge function. */
  keys: string[];
  /** Optional label shown on the left. */
  title?: string;
}

function fmtVal(i: FREDIndicator): string {
  if (i.value == null) return '—';
  if (i.unit === 'k') return `${i.value > 0 ? '+' : ''}${i.value}k`;
  return `${i.value.toFixed(2)}${i.unit}`;
}

function fmtChange(i: FREDIndicator): string {
  if (i.change == null) return '';
  const sign = i.change > 0 ? '+' : '';
  if (i.unit === 'k') return `${sign}${i.change}k`;
  return `${sign}${i.change.toFixed(2)}`;
}

function fmtDate(d: string | null): string {
  if (!d) return '';
  const dt = new Date(d);
  return dt.toLocaleDateString('en-US', { month: 'short', year: 'numeric' });
}

/**
 * Compact ticker-strip showing real FRED values for the requested series keys.
 * Drop above existing static charts so Bloomberg-style users see live + detail.
 */
export default function FREDLiveStrip({ keys, title = 'LIVE · FRED' }: FREDLiveStripProps) {
  const { byKey, loading, error, ts } = useFRED();

  return (
    <div className="border border-accent/40 bg-accent/5 px-2 py-1.5 flex items-center gap-3 font-mono text-[10px] overflow-x-auto">
      <span className="text-accent font-bold uppercase tracking-wider whitespace-nowrap">
        {title}
        {loading && !ts ? ' …' : ''}
      </span>
      {error && <span className="text-negative whitespace-nowrap">err: {error}</span>}
      {!error && keys.map((k) => {
        const i = byKey[k];
        if (!i) {
          return (
            <span key={k} className="text-muted-foreground whitespace-nowrap">
              {k.toUpperCase()}: —
            </span>
          );
        }
        const up = (i.change ?? 0) > 0;
        const down = (i.change ?? 0) < 0;
        return (
          <span key={k} className="whitespace-nowrap flex items-center gap-1">
            <span className="text-muted-foreground uppercase">{i.label}</span>
            <span className="text-foreground font-bold">{fmtVal(i)}</span>
            {i.change != null && (
              <span className={up ? 'text-positive' : down ? 'text-negative' : 'text-muted-foreground'}>
                ({fmtChange(i)})
              </span>
            )}
            <span className="text-muted-foreground/60">{fmtDate(i.date)}</span>
          </span>
        );
      })}
      {ts && (
        <span className="ml-auto text-muted-foreground/50 whitespace-nowrap">
          upd {new Date(ts).toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' })}
        </span>
      )}
    </div>
  );
}
