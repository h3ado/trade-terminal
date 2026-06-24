import { useState } from 'react';
import { apiPost } from '@/lib/api';
import type { NewsArticle } from '@/hooks/useGdeltNews';
import { Loader2, MessageSquare, X } from 'lucide-react';

interface Props {
  headline: NewsArticle;
  context: NewsArticle[];
}

type Turn = { role: 'user' | 'assistant'; content: string };

export default function HeadlineQAPopover({ headline, context }: Props) {
  const [open, setOpen] = useState(false);
  const [q, setQ] = useState('');
  const [turns, setTurns] = useState<Turn[]>([]);
  const [loading, setLoading] = useState(false);

  const ask = async () => {
    if (!q.trim()) return;
    const question = q.trim();
    setQ('');
    setTurns(t => [...t, { role: 'user', content: question }]);
    setLoading(true);
    try {
      const data = await apiPost<{ answer?: string }>('/api/market/news/qa', {
        question,
        headline: { title: headline.title, url: headline.url, domain: headline.domain },
        context: context.slice(0, 12).map(c => ({ title: c.title, domain: c.domain })),
        history: turns.slice(-6),
      });
      const ans = data?.answer ?? '(no answer)';
      setTurns(t => [...t, { role: 'assistant', content: ans }]);
    } catch (e) {
      const msg = e instanceof Error ? e.message : 'failed';
      setTurns(t => [...t, { role: 'assistant', content: `! ${msg}` }]);
    } finally { setLoading(false); }
  };

  return (
    <div className="border border-border bg-surface-elevated/40">
      <button
        onClick={() => setOpen(o => !o)}
        className="w-full flex items-center gap-1 px-2 py-1 text-[9px] uppercase font-bold text-muted-foreground hover:text-accent"
      >
        <MessageSquare className="w-3 h-3" />
        Ask AI about this headline
        {open ? <X className="w-3 h-3 ml-auto" /> : null}
      </button>
      {open && (
        <div className="p-2 space-y-2 border-t border-border">
          <div className="space-y-1 max-h-48 overflow-y-auto text-[10px] font-mono">
            {turns.map((t, i) => (
              <div key={i} className={t.role === 'user' ? 'text-accent' : 'text-foreground leading-snug'}>
                <span className="text-muted-foreground uppercase text-[8px] mr-1">{t.role === 'user' ? 'YOU' : 'AI'}</span>
                {t.content}
              </div>
            ))}
            {loading && <div className="text-muted-foreground animate-pulse text-[9px]">thinking…</div>}
          </div>
          <div className="flex gap-1">
            <input
              value={q}
              onChange={e => setQ(e.target.value)}
              onKeyDown={e => e.key === 'Enter' && ask()}
              placeholder="What's the market angle?"
              className="flex-1 bg-background border border-border text-[10px] text-foreground px-1.5 py-1 outline-none focus:border-accent"
            />
            <button onClick={ask} disabled={loading} className="text-[9px] uppercase font-bold text-accent border border-accent px-2 hover:bg-accent hover:text-accent-foreground disabled:opacity-50">
              {loading ? <Loader2 className="w-3 h-3 animate-spin" /> : 'Ask'}
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
