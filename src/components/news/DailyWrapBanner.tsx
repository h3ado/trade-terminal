import { useEffect, useState } from 'react';
import { apiGet, apiPost } from '@/lib/api';
import type { NewsArticle } from '@/hooks/useGdeltNews';
import { X, Loader2 } from 'lucide-react';

type Bullet = { label: string; text: string };
type WrapRow = { wrap_date: string; summary: { headline?: string; bullets?: Bullet[]; tomorrow_catalysts?: string[] }; generated_at: string };

interface Props {
  headlines: NewsArticle[];
  redact?: boolean;
}

export default function DailyWrapBanner({ headlines, redact }: Props) {
  const [wrap, setWrap] = useState<WrapRow | null>(null);
  const [open, setOpen] = useState(false);
  const [dismissed, setDismissed] = useState(false);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    apiGet<{ wraps: WrapRow[] }>('/api/market/news/wrap')
      .then(({ wraps }) => { if (wraps?.[0]) setWrap(wraps[0]); })
      .catch(() => {});
  }, []);

  const generate = async () => {
    setLoading(true);
    try {
      const data = await apiPost<WrapRow>('/api/market/news/wrap', {
        force: true,
        headlines: headlines.slice(0, 100).map(h => ({ title: h.title, domain: h.domain })),
      }).catch(() => null);
      if (data) setWrap(data);
    } finally { setLoading(false); }
  };

  if (dismissed) return null;
  const today = new Date().toISOString().slice(0, 10);
  const fresh = wrap && wrap.wrap_date === today;

  return (
    <>
      <div className="flex items-center gap-2 border-b border-border px-2 py-0.5 bg-surface-elevated text-[9px] font-mono flex-shrink-0">
        <span className="text-accent uppercase font-bold">Daily Wrap</span>
        <span className="text-muted-foreground">·</span>
        {fresh ? (
          <>
            <span className="text-foreground truncate max-w-[60%]">{wrap?.summary?.headline ?? '—'}</span>
            <button onClick={() => setOpen(true)} className="ml-auto text-accent hover:underline uppercase">Open</button>
          </>
        ) : (
          <>
            <span className="text-muted-foreground">No wrap for today.</span>
            <button onClick={generate} className="text-accent hover:underline uppercase ml-2 flex items-center gap-1">
              {loading ? <Loader2 className="w-3 h-3 animate-spin" /> : null} Generate
            </button>
            {wrap && <button onClick={() => setOpen(true)} className="text-muted-foreground hover:text-accent uppercase ml-2">Last wrap</button>}
          </>
        )}
        <button onClick={() => setDismissed(true)} className="ml-2 text-muted-foreground hover:text-accent">
          <X className="w-3 h-3" />
        </button>
      </div>

      {open && wrap && (
        <div className="fixed inset-0 z-50 bg-black/80 flex items-center justify-center p-4" onClick={() => setOpen(false)}>
          <div className="bg-background border border-accent max-w-2xl w-full p-4 font-mono text-[11px]" onClick={e => e.stopPropagation()}>
            <div className="flex items-center justify-between border-b border-border pb-2 mb-3">
              <span className="text-accent uppercase font-bold">Daily Wrap · {wrap.wrap_date}</span>
              <button onClick={() => setOpen(false)} className="text-muted-foreground hover:text-accent"><X className="w-4 h-4" /></button>
            </div>
            {wrap.summary?.headline && (
              <div className="text-foreground font-bold mb-3">{wrap.summary.headline}</div>
            )}
            <div className="space-y-2">
              {(wrap.summary?.bullets ?? []).map((b, i) => (
                <div key={i} className="flex gap-2">
                  <span className="text-accent uppercase font-bold w-16 flex-shrink-0">{b.label}</span>
                  <span className="text-foreground">{redact ? '•••' : b.text}</span>
                </div>
              ))}
            </div>
            {wrap.summary?.tomorrow_catalysts && wrap.summary.tomorrow_catalysts.length > 0 && (
              <div className="mt-4 border-t border-border pt-2">
                <div className="text-accent uppercase font-bold text-[10px] mb-1">Tomorrow</div>
                {wrap.summary.tomorrow_catalysts.map((c, i) => (
                  <div key={i} className="text-muted-foreground">▸ {c}</div>
                ))}
              </div>
            )}
            <div className="mt-3 text-[9px] text-muted-foreground/60">generated {new Date(wrap.generated_at).toLocaleString()}</div>
          </div>
        </div>
      )}
    </>
  );
}
