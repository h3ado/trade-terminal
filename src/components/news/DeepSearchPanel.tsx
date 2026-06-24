import { useState } from 'react';
import { apiPost } from '@/lib/api';
import { Loader2, Search } from 'lucide-react';

interface Props {
  initialQuery?: string;
}

type Result = { answer: string; citations: string[]; model?: string };

export default function DeepSearchPanel({ initialQuery = '' }: Props) {
  const [q, setQ] = useState(initialQuery);
  const [recency, setRecency] = useState<'hour' | 'day' | 'week' | 'month'>('day');
  const [res, setRes] = useState<Result | null>(null);
  const [loading, setLoading] = useState(false);
  const [err, setErr] = useState<string | null>(null);

  const run = async () => {
    if (!q.trim()) return;
    setLoading(true); setErr(null); setRes(null);
    try {
      const d = await apiPost<{ error?: string; message?: string } & Result>('/api/market/news/deepsearch', { query: q.trim(), recency });
      if (d?.error) { setErr(d.message ?? d.error); return; }
      setRes(d);
    } catch (e) {
      setErr(e instanceof Error ? e.message : 'failed');
    } finally { setLoading(false); }
  };

  return (
    <div className="p-2 space-y-2 font-mono text-[10px]">
      <div className="text-accent uppercase font-bold border-b border-border pb-1">Deep Search · Perplexity</div>
      <div className="flex gap-1">
        <div className="relative flex-1">
          <Search className="w-3 h-3 absolute left-1.5 top-1/2 -translate-y-1/2 text-muted-foreground" />
          <input
            value={q}
            onChange={e => setQ(e.target.value)}
            onKeyDown={e => e.key === 'Enter' && run()}
            placeholder="What happened with NVDA today?"
            className="w-full bg-surface-elevated border border-border text-[10px] text-foreground pl-6 pr-2 py-1 outline-none focus:border-accent"
          />
        </div>
        <button onClick={run} disabled={loading} className="text-[9px] uppercase font-bold text-accent border border-accent px-2 py-1 hover:bg-accent hover:text-accent-foreground disabled:opacity-50">
          {loading ? <Loader2 className="w-3 h-3 animate-spin" /> : 'Go'}
        </button>
      </div>
      <div className="flex gap-0.5">
        {(['hour', 'day', 'week', 'month'] as const).map(r => (
          <button
            key={r}
            onClick={() => setRecency(r)}
            className={`text-[9px] uppercase font-bold py-0.5 px-1 border ${
              recency === r ? 'bg-accent text-accent-foreground border-accent' : 'border-border text-muted-foreground hover:bg-surface-elevated'
            }`}
          >
            {r}
          </button>
        ))}
      </div>
      {err && <div className="text-negative text-[9px]">! {err}</div>}
      {res && (
        <>
          <div className="text-foreground leading-snug whitespace-pre-wrap">{res.answer}</div>
          {res.citations && res.citations.length > 0 && (
            <div className="border-t border-border pt-2">
              <div className="text-accent uppercase text-[9px] font-bold mb-1">Sources · {res.citations.length}</div>
              <div className="space-y-0.5 max-h-40 overflow-y-auto">
                {res.citations.map((c, i) => (
                  <a key={i} href={c} target="_blank" rel="noreferrer" className="block text-muted-foreground hover:text-accent truncate text-[9px]">
                    [{i + 1}] {c}
                  </a>
                ))}
              </div>
            </div>
          )}
        </>
      )}
      {!res && !loading && !err && (
        <div className="text-muted-foreground text-[9px]">Ask a markets question. Citations included. Requires Perplexity connector.</div>
      )}
    </div>
  );
}
