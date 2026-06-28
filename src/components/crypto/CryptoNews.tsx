import { useState, useEffect, useCallback } from 'react';
import { ExternalLink, RefreshCw } from 'lucide-react';
import { apiGet } from '@/lib/api';

interface Article {
  id: string; url: string; title: string; domain: string;
  seendate: string; tone: number; topic: string;
}

const FILTERS = ['ALL', 'BITCOIN', 'ETHEREUM', 'DEFI', 'REGULATION'] as const;
type Filter = typeof FILTERS[number];

function fmtDate(iso: string) {
  try { return new Date(iso).toLocaleDateString('en-US', { month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' }); }
  catch { return iso.slice(0, 16); }
}

export default function CryptoNews() {
  const [articles, setArticles] = useState<Article[]>([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState<Filter>('ALL');

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const d = await apiGet<{ articles: Article[] }>('/api/market/news/crypto');
      setArticles(d.articles ?? []);
    } catch { setArticles([]); }
    finally { setLoading(false); }
  }, []);

  useEffect(() => { load(); const id = setInterval(load, 2 * 60_000); return () => clearInterval(id); }, [load]);

  const visible = articles.filter(a => {
    if (filter === 'ALL') return true;
    const t = a.title.toLowerCase();
    if (filter === 'BITCOIN')    return t.includes('bitcoin') || t.includes('btc');
    if (filter === 'ETHEREUM')   return t.includes('ethereum') || t.includes('eth');
    if (filter === 'DEFI')       return t.includes('defi') || t.includes('protocol') || t.includes('yield');
    if (filter === 'REGULATION') return t.includes('regul') || t.includes('sec') || t.includes('cftc') || t.includes('ban');
    return true;
  });

  return (
    <div className="flex flex-col h-full overflow-hidden font-mono text-xs bg-background">
      <div className="shrink-0 border-b border-border flex items-center gap-2 px-3 py-1.5 bg-surface-elevated">
        <span className="text-[8px] text-accent font-bold uppercase tracking-widest">Crypto News</span>
        <div className="flex gap-1 ml-2">
          {FILTERS.map(f => (
            <button key={f} onClick={() => setFilter(f)}
              className={`px-2 py-0.5 text-[8px] font-bold border transition-colors ${filter === f ? 'border-accent bg-accent/20 text-accent' : 'border-border text-muted-foreground hover:text-foreground'}`}>
              {f}
            </button>
          ))}
        </div>
        <button onClick={load} disabled={loading} className="ml-auto text-muted-foreground hover:text-accent transition-colors disabled:opacity-40">
          <RefreshCw size={10} className={loading ? 'animate-spin' : ''} />
        </button>
      </div>

      <div className="flex-1 min-h-0 overflow-y-auto">
        {loading && (
          <div className="space-y-px">
            {[...Array(8)].map((_, i) => (
              <div key={i} className="px-3 py-2 border-b border-border/30 animate-pulse flex gap-3">
                <div className="flex-1 space-y-1"><div className="h-3 bg-surface-elevated rounded w-3/4" /><div className="h-2 bg-surface-elevated rounded w-1/3" /></div>
              </div>
            ))}
          </div>
        )}
        {!loading && visible.length === 0 && (
          <div className="flex items-center justify-center h-32 text-muted-foreground text-[10px]">No articles found</div>
        )}
        {!loading && visible.map((a, i) => (
          <a key={i} href={a.url} target="_blank" rel="noopener noreferrer"
            className="flex gap-3 px-3 py-2 border-b border-border/30 hover:bg-surface-elevated group">
            <div className="flex-1 min-w-0">
              <div className="text-[10px] text-foreground group-hover:text-accent leading-snug line-clamp-2">{a.title}</div>
              <div className="flex items-center gap-2 mt-0.5">
                <span className="text-[8px] text-muted-foreground">{a.domain}</span>
                <span className="text-[8px] text-muted-foreground">{fmtDate(a.seendate)}</span>
                {a.tone != null && (
                  <span className={`text-[8px] font-bold ${a.tone > 1 ? 'text-positive' : a.tone < -1 ? 'text-negative' : 'text-muted-foreground'}`}>
                    {a.tone > 1 ? '▲' : a.tone < -1 ? '▼' : '●'} {a.tone.toFixed(1)}
                  </span>
                )}
              </div>
            </div>
            <ExternalLink size={10} className="shrink-0 mt-0.5 opacity-0 group-hover:opacity-100 text-accent" />
          </a>
        ))}
      </div>
    </div>
  );
}
