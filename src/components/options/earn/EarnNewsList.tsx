import { useEffect, useState } from 'react';
import { apiGet } from '@/lib/api';

interface Item { title: string; url: string; source?: string; published?: string; }

interface Props { ticker: string; }

export default function EarnNewsList({ ticker }: Props) {
  const [items, setItems] = useState<Item[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let cancelled = false;
    async function load() {
      setLoading(true);
      try {
        const data = await apiGet<{ items?: unknown[]; headlines?: unknown[]; news?: unknown[] }>('/api/market/news/earnings', { ticker });
        if (cancelled) return;
        const arr = (data?.items ?? data?.headlines ?? data?.news ?? []) as any[];
        setItems(arr.slice(0, 40).map((x) => ({
          title: x.title ?? x.headline ?? '(no title)',
          url: x.url ?? x.link ?? '#',
          source: x.source ?? x.domain,
          published: x.published ?? x.ts ?? x.date,
        })));
      } catch {
        if (!cancelled) setItems([]);
      } finally {
        if (!cancelled) setLoading(false);
      }
    }
    load();
    return () => { cancelled = true; };
  }, [ticker]);

  return (
    <div className="card-terminal">
      <div className="px-3 py-1.5 border-b border-border flex items-baseline gap-2">
        <span className="text-[10px] font-mono font-bold text-accent">EARNINGS NEWS</span>
        <span className="text-[9px] font-mono text-muted-foreground">{ticker} · {loading ? 'loading…' : `${items.length} headlines`}</span>
      </div>
      <div className="max-h-[520px] overflow-y-auto">
        {items.length === 0 && !loading && (
          <div className="px-3 py-3 text-[10px] font-mono text-muted-foreground">No earnings headlines found.</div>
        )}
        {items.map((it, i) => (
          <a key={i} href={it.url} target="_blank" rel="noreferrer"
            className="block px-3 py-1.5 border-b border-border/40 hover:bg-surface-elevated">
            <div className="text-[11px] font-mono text-foreground line-clamp-2">{it.title}</div>
            <div className="text-[8px] font-mono text-muted-foreground mt-0.5">
              {it.source ?? ''} {it.published ? `· ${new Date(it.published).toLocaleString()}` : ''}
            </div>
          </a>
        ))}
      </div>
    </div>
  );
}
