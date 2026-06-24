import { useEffect, useState } from 'react';
import { apiPost } from '@/lib/api';
import type { NewsArticle, NewsScope } from '@/hooks/useGdeltNews';
import { Loader2, RefreshCw } from 'lucide-react';

type Thesis = {
  stance?: 'bullish' | 'bearish' | 'neutral';
  conviction?: number;
  key_drivers?: string[];
  counter_drivers?: string[];
  catalysts_next_7d?: string[];
  suggested_trades?: string[];
  summary?: string;
  cached?: boolean;
  error?: string;
};

interface Props {
  scope: NewsScope;
  value: string;
  headlines: NewsArticle[];
  redact?: boolean;
}

export default function ThesisPanel({ scope, value, headlines, redact }: Props) {
  const [thesis, setThesis] = useState<Thesis | null>(null);
  const [loading, setLoading] = useState(false);
  const [err, setErr] = useState<string | null>(null);

  const run = async () => {
    if (headlines.length === 0) return;
    setLoading(true); setErr(null);
    try {
      const data = await apiPost<Thesis>('/api/market/news/thesis', {
        scope, value,
        headlines: headlines.slice(0, 50).map(h => ({
          title: h.title, domain: h.domain, seendate: h.seendate, tone: h.tone,
        })),
      });
      setThesis(data);
    } catch (e) {
      setErr(e instanceof Error ? e.message : 'failed');
    } finally { setLoading(false); }
  };

  useEffect(() => { run(); /* eslint-disable-next-line react-hooks/exhaustive-deps */ }, [scope, value]);

  const stanceColor =
    thesis?.stance === 'bullish' ? 'text-positive' :
    thesis?.stance === 'bearish' ? 'text-negative' : 'text-muted-foreground';

  return (
    <div className="p-2 space-y-2 font-mono text-[10px]">
      <div className="flex items-center justify-between border-b border-border pb-1">
        <span className="text-accent uppercase font-bold text-[10px]">Thesis · {scope}{value ? ` ${value}` : ''}</span>
        <button onClick={run} className="text-[9px] uppercase text-muted-foreground hover:text-accent flex items-center gap-1">
          {loading ? <Loader2 className="w-3 h-3 animate-spin" /> : <RefreshCw className="w-3 h-3" />}
        </button>
      </div>
      {err && <div className="text-negative text-[9px]">! {err}</div>}
      {!thesis && loading && <div className="text-muted-foreground animate-pulse">Generating thesis…</div>}
      {thesis && !thesis.error && (
        <>
          <div className="flex items-center gap-2">
            <span className={`uppercase font-bold ${stanceColor}`}>{thesis.stance ?? '—'}</span>
            <span className="text-muted-foreground">conviction</span>
            <span className="text-foreground font-bold">{redact ? '••' : (thesis.conviction ?? 0)}</span>
            <div className="flex-1 h-1 bg-surface-elevated">
              <div className="h-full bg-accent" style={{ width: `${redact ? 0 : (thesis.conviction ?? 0)}%` }} />
            </div>
          </div>
          {thesis.summary && <div className="text-foreground leading-snug">{thesis.summary}</div>}
          {thesis.key_drivers && thesis.key_drivers.length > 0 && (
            <div>
              <div className="text-positive uppercase text-[9px] font-bold mb-0.5">Drivers</div>
              {thesis.key_drivers.map((d, i) => (
                <div key={i} className="text-muted-foreground leading-snug">▸ {d}</div>
              ))}
            </div>
          )}
          {thesis.counter_drivers && thesis.counter_drivers.length > 0 && (
            <div>
              <div className="text-negative uppercase text-[9px] font-bold mb-0.5">Counter</div>
              {thesis.counter_drivers.map((d, i) => (
                <div key={i} className="text-muted-foreground leading-snug">▸ {d}</div>
              ))}
            </div>
          )}
          {thesis.catalysts_next_7d && thesis.catalysts_next_7d.length > 0 && (
            <div>
              <div className="text-accent uppercase text-[9px] font-bold mb-0.5">Catalysts 7d</div>
              {thesis.catalysts_next_7d.map((d, i) => (
                <div key={i} className="text-muted-foreground leading-snug">▸ {d}</div>
              ))}
            </div>
          )}
          {thesis.suggested_trades && thesis.suggested_trades.length > 0 && (
            <div>
              <div className="text-accent uppercase text-[9px] font-bold mb-0.5">Trade Ideas</div>
              {thesis.suggested_trades.map((d, i) => (
                <div key={i} className="text-foreground leading-snug">▸ {d}</div>
              ))}
            </div>
          )}
          {thesis.cached && <div className="text-[8px] text-muted-foreground/60">cached · 15m</div>}
        </>
      )}
      {thesis?.error && <div className="text-negative text-[9px]">parse failed</div>}
    </div>
  );
}
