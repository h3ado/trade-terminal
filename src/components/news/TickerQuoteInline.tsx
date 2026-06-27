import { useEffect, useState } from 'react';
import { apiGet } from '@/lib/api';

interface Quote {
  ticker: string;
  price: number | null;
  changePct: number | null;
  name?: string;
}

// Same ticker regex used by TickerVelocityRail
const TICKER_RE = /\b([A-Z]{2,5})\b/g;
const SKIP = new Set(['FED','SEC','ECB','BOE','BOJ','CEO','CFO','IPO','GDP','CPI','ETF','SPX','FOMC','US','EU','UK','JP','USD','EUR','GBP','JPY','AI','IT']);

export function extractTicker(title: string): string | null {
  const matches = [...title.matchAll(TICKER_RE)].map(m => m[1]).filter(t => !SKIP.has(t));
  return matches[0] ?? null;
}

interface Props {
  ticker: string;
}

export default function TickerQuoteInline({ ticker }: Props) {
  const [quote, setQuote] = useState<Quote | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let cancelled = false;
    setLoading(true);
    setQuote(null);
    apiGet<Quote>(`/api/market/security/${encodeURIComponent(ticker)}/overview`)
      .then(d => {
        if (!cancelled && d?.price != null) setQuote({ ticker, price: d.price, changePct: d.changePct, name: d.name });
      })
      .catch(() => {})
      .finally(() => { if (!cancelled) setLoading(false); });
    return () => { cancelled = true; };
  }, [ticker]);

  if (loading) {
    return (
      <div className="flex items-center gap-2 px-1 py-0.5 border border-border/40 bg-surface-deep animate-pulse">
        <span className="text-[9px] font-mono font-bold text-accent w-10">{ticker}</span>
        <div className="h-2.5 w-16 bg-surface-elevated rounded" />
      </div>
    );
  }

  if (!quote) return null;

  const up = (quote.changePct ?? 0) >= 0;
  return (
    <div className="flex items-center gap-2 px-1 py-0.5 border border-border/40 bg-surface-deep font-mono">
      <span className="text-[9px] font-bold text-accent w-10">{quote.ticker}</span>
      {quote.name && <span className="text-[9px] text-muted-foreground truncate max-w-[120px]">{quote.name}</span>}
      <span className="ml-auto text-[10px] font-bold text-foreground">${quote.price?.toFixed(2)}</span>
      <span className={`text-[9px] font-bold ${up ? 'text-green-400' : 'text-red-400'}`}>
        {up ? '+' : ''}{quote.changePct?.toFixed(2)}%
      </span>
    </div>
  );
}
