import { useEIA, type EIAIndicator } from '@/hooks/useEIA';

function fmtVal(i: EIAIndicator): string {
  if (i.value == null) return '—';
  if (i.unit === '$/bbl' || i.unit === '$/MMBtu') return `$${i.value.toFixed(2)}`;
  if (i.unit === 'Mbbl') return `${i.value.toFixed(1)}M bbl`;
  if (i.unit === 'kb/d') return `${(i.value / 1000).toFixed(2)}M b/d`;
  if (i.unit === 'Bcf') return `${i.value.toFixed(0)} Bcf`;
  return `${i.value}${i.unit}`;
}

function fmtChange(i: EIAIndicator): string {
  if (i.change == null) return '';
  const sign = i.change > 0 ? '+' : '';
  if (i.unit === '$/bbl' || i.unit === '$/MMBtu') return `${sign}$${i.change.toFixed(2)}`;
  if (i.unit === 'Mbbl') return `${sign}${i.change.toFixed(2)}M`;
  if (i.unit === 'kb/d') return `${sign}${(i.change / 1000).toFixed(2)}M`;
  if (i.unit === 'Bcf') return `${sign}${i.change.toFixed(0)}`;
  return `${sign}${i.change}`;
}

function fmtDate(d: string | null): string {
  if (!d) return '';
  const dt = new Date(d.length === 7 ? `${d}-01` : d);
  if (isNaN(dt.getTime())) return d;
  return dt.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: '2-digit' });
}

const KEYS = ['wti', 'brent', 'henry_hub', 'crude_stocks', 'gasoline_stocks', 'distillate_stocks', 'crude_production', 'natgas_storage'];

export default function EIALiveStrip() {
  const { byKey, loading, error, ts } = useEIA();

  return (
    <div className="border border-accent/40 bg-accent/5 px-2 py-1.5 flex items-center gap-3 font-mono text-[10px] overflow-x-auto">
      <span className="text-accent font-bold uppercase tracking-wider whitespace-nowrap">
        LIVE · EIA{loading && !ts ? ' …' : ''}
      </span>
      {error && <span className="text-negative whitespace-nowrap">err: {error}</span>}
      {!error && KEYS.map((k) => {
        const i = byKey[k];
        if (!i) {
          return <span key={k} className="text-muted-foreground whitespace-nowrap">{k}: —</span>;
        }
        const up = (i.change ?? 0) > 0;
        const down = (i.change ?? 0) < 0;
        return (
          <span key={k} className="whitespace-nowrap flex items-center gap-1">
            <span className="text-muted-foreground uppercase">{i.label}</span>
            <span className="text-foreground font-bold">{fmtVal(i)}</span>
            {i.change != null && i.change !== 0 && (
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
