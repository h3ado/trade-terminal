import { useState, useRef, useEffect } from 'react';
import { Send, Loader2, Sparkles, RotateCcw } from 'lucide-react';
import type { SecurityFundamentals, SecurityOverview } from '@/hooks/useSecurityData';
import { apiPost } from '@/lib/api';

const QUICK_QUESTIONS = [
  'What are the key risks for this stock?',
  'Is this stock over or undervalued?',
  'Summarize analyst sentiment and price targets',
  'What does the earnings trend tell us?',
  'Compare margins and ROE to typical sector peers',
  'What would make this a strong buy or sell?',
];

interface QA {
  question: string;
  answer: string;
  ts: number;
}

interface Props {
  ticker: string;
  fundamentals: SecurityFundamentals | null;
  overview: SecurityOverview | null;
}

function renderAnswer(text: string): React.ReactNode {
  // Simple markdown-ish rendering: bold (**text**), line breaks, section headers
  const lines = text.split('\n');
  return lines.map((line, i) => {
    if (line.startsWith('## ') || line.startsWith('# ')) {
      return <div key={i} className="text-accent font-bold text-[11px] mt-3 mb-1 uppercase tracking-wider">{line.replace(/^#+\s/, '')}</div>;
    }
    if (line.startsWith('**') && line.endsWith('**')) {
      return <div key={i} className="font-bold text-foreground mt-1">{line.slice(2, -2)}</div>;
    }
    if (line.startsWith('- ') || line.startsWith('• ')) {
      return (
        <div key={i} className="flex gap-2 mt-0.5">
          <span className="text-accent shrink-0">›</span>
          <span>{formatInlineBold(line.slice(2))}</span>
        </div>
      );
    }
    if (line.trim() === '') return <div key={i} className="h-1" />;
    return <div key={i} className="mt-0.5">{formatInlineBold(line)}</div>;
  });
}

function formatInlineBold(text: string): React.ReactNode {
  const parts = text.split(/(\*\*[^*]+\*\*)/g);
  return parts.map((part, i) =>
    part.startsWith('**') && part.endsWith('**')
      ? <strong key={i} className="text-foreground font-bold">{part.slice(2, -2)}</strong>
      : part
  );
}

export default function AiTab({ ticker, fundamentals, overview }: Props) {
  const [question, setQuestion] = useState('');
  const [loading, setLoading] = useState(false);
  const [history, setHistory] = useState<QA[]>([]);
  const [error, setError] = useState<string | null>(null);
  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const bottomRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [history, loading]);

  const ask = async (q: string) => {
    const trimmed = q.trim();
    if (!trimmed || loading) return;
    setQuestion('');
    setError(null);
    setLoading(true);
    try {
      const res = await apiPost<{ answer: string }>(`/api/market/security/${encodeURIComponent(ticker)}/ai-analyst`, { question: trimmed });
      setHistory(prev => [...prev, { question: trimmed, answer: res.answer, ts: Date.now() }]);
    } catch (e: any) {
      setError(e.message ?? 'AI analyst unavailable');
    } finally {
      setLoading(false);
    }
  };

  const handleKey = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      ask(question);
    }
  };

  return (
    <div className="flex flex-col h-full font-mono text-xs overflow-hidden">
      {/* Header */}
      <div className="px-4 py-2 border-b border-border bg-surface-elevated shrink-0 flex items-center gap-2">
        <Sparkles size={12} className="text-accent" />
        <span className="text-[9px] text-accent font-bold uppercase tracking-widest">AI Analyst</span>
        <span className="text-[9px] text-muted-foreground">· {ticker} · Claude Haiku</span>
        {fundamentals && (
          <span className="ml-auto text-[9px] text-positive">Context loaded</span>
        )}
        {!fundamentals && (
          <span className="ml-auto text-[9px] text-muted-foreground">Limited context (visit DES/FA tabs first)</span>
        )}
      </div>

      {/* Quick questions */}
      {history.length === 0 && !loading && (
        <div className="px-4 py-3 border-b border-border shrink-0">
          <div className="text-[9px] text-muted-foreground mb-2 uppercase tracking-wider">Quick questions</div>
          <div className="flex flex-wrap gap-1.5">
            {QUICK_QUESTIONS.map(q => (
              <button
                key={q}
                onClick={() => ask(q)}
                className="px-2 py-1 text-[9px] border border-border hover:border-accent hover:text-accent transition-colors rounded-sm"
              >
                {q}
              </button>
            ))}
          </div>
        </div>
      )}

      {/* Conversation */}
      <div className="flex-1 overflow-y-auto px-4 py-3 space-y-4">
        {history.length === 0 && !loading && (
          <div className="flex flex-col items-center justify-center h-full gap-2 text-muted-foreground/50">
            <Sparkles size={24} />
            <span className="text-[10px]">Ask anything about {ticker}</span>
          </div>
        )}
        {history.map((qa, i) => (
          <div key={i} className="space-y-2">
            {/* Question */}
            <div className="flex gap-2">
              <span className="text-[9px] text-accent font-bold shrink-0 pt-0.5">Q</span>
              <span className="text-[10px] text-foreground font-semibold">{qa.question}</span>
            </div>
            {/* Answer */}
            <div className="flex gap-2">
              <span className="text-[9px] text-muted-foreground font-bold shrink-0 pt-0.5">A</span>
              <div className="text-[10px] text-foreground/90 leading-relaxed flex-1">
                {renderAnswer(qa.answer)}
              </div>
            </div>
            {i < history.length - 1 && <div className="border-b border-border/40 pt-2" />}
          </div>
        ))}
        {loading && (
          <div className="flex gap-2">
            <span className="text-[9px] text-muted-foreground font-bold shrink-0 pt-0.5">A</span>
            <div className="flex items-center gap-1.5 text-muted-foreground text-[10px]">
              <Loader2 size={11} className="animate-spin" />
              Analyzing {ticker}…
            </div>
          </div>
        )}
        {error && (
          <div className="text-negative text-[10px] bg-negative/10 px-3 py-2">
            {error}
          </div>
        )}
        <div ref={bottomRef} />
      </div>

      {/* Input */}
      <div className="shrink-0 border-t border-border bg-surface-deep px-4 py-2">
        {history.length > 0 && (
          <div className="flex justify-end mb-1">
            <button
              onClick={() => { setHistory([]); setError(null); }}
              className="flex items-center gap-1 text-[9px] text-muted-foreground hover:text-accent transition-colors"
            >
              <RotateCcw size={9} />
              Clear history
            </button>
          </div>
        )}
        <div className="flex gap-2 items-end">
          <textarea
            ref={textareaRef}
            value={question}
            onChange={e => setQuestion(e.target.value)}
            onKeyDown={handleKey}
            placeholder={`Ask anything about ${ticker}… (Enter to send, Shift+Enter for newline)`}
            rows={2}
            className="flex-1 bg-surface-elevated border border-border px-2 py-1.5 text-[11px] resize-none focus:border-accent focus:outline-none text-foreground placeholder:text-muted-foreground/50"
            disabled={loading}
          />
          <button
            onClick={() => ask(question)}
            disabled={loading || !question.trim()}
            className="px-3 py-1.5 bg-accent text-accent-foreground text-[9px] font-bold uppercase disabled:opacity-40 hover:opacity-90 transition-opacity shrink-0 h-[52px] flex items-center gap-1.5"
          >
            {loading ? <Loader2 size={12} className="animate-spin" /> : <Send size={11} />}
            {loading ? 'Thinking' : 'Ask'}
          </button>
        </div>
        <div className="text-[9px] text-muted-foreground mt-1">
          Powered by Claude · Context includes financials, estimates, analyst ratings, and ownership data
        </div>
      </div>
    </div>
  );
}
