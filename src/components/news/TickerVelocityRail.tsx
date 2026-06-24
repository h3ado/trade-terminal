import { useMemo } from 'react';
import type { NewsArticle } from '@/hooks/useGdeltNews';

interface Props {
  articles: NewsArticle[];
  redact?: boolean;
  onSelect?: (ticker: string) => void;
}

const TICKER_RE = /\b([A-Z]{2,5})\b/g;
const STOPWORDS = new Set([
  'THE', 'AND', 'FOR', 'WITH', 'FROM', 'INTO', 'OVER', 'AFTER', 'AHEAD', 'NEW', 'OLD',
  'CEO', 'CFO', 'COO', 'CTO', 'IPO', 'LLC', 'LTD', 'INC', 'CORP', 'PLC', 'GMBH',
  'USA', 'UK', 'EU', 'UN', 'NATO', 'G7', 'G20', 'OPEC', 'API', 'GDP', 'CPI', 'PPI', 'PMI', 'NFP',
  'FED', 'ECB', 'BOJ', 'BOE', 'PBOC', 'IMF', 'WTO', 'SEC', 'DOJ', 'FDA', 'CFTC',
  'WSJ', 'CNBC', 'BBC', 'AFP', 'CNN', 'FT', 'NYT', 'AP', 'POTUS', 'AI', 'EV', 'IT',
  'OF', 'TO', 'IN', 'ON', 'AT', 'BY', 'IS', 'IT', 'AS', 'OR', 'BE', 'SO', 'IF',
  'A', 'I', 'AN', 'WAS', 'ARE', 'WAR', 'OIL', 'GAS', 'KEY', 'TOP', 'HOT', 'BIG',
  'YOY', 'QOQ', 'YTD', 'MTD', 'EPS', 'YEAR', 'YEARS', 'MONTH', 'WEEK', 'DAY',
  'NEWS', 'SAYS', 'SAID', 'MORE', 'LESS', 'HIGH', 'LOW', 'PRO', 'PLUS',
]);

function toBuckets(arr: NewsArticle[], buckets: number) {
  const now = Date.now();
  const span = 24 * 3600_000;
  const bSize = span / buckets;
  const out = new Array(buckets).fill(0);
  for (const a of arr) {
    const m = /^(\d{4})(\d{2})(\d{2})T(\d{2})(\d{2})(\d{2})Z$/.exec(a.seendate);
    if (!m) continue;
    const t = Date.UTC(+m[1], +m[2] - 1, +m[3], +m[4], +m[5], +m[6]);
    const age = now - t;
    if (age < 0 || age > span) continue;
    const idx = buckets - 1 - Math.floor(age / bSize);
    if (idx >= 0 && idx < buckets) out[idx]++;
  }
  return out;
}

function spark(buckets: number[]) {
  const max = Math.max(...buckets, 1);
  const chars = ['▁', '▂', '▃', '▄', '▅', '▆', '▇', '█'];
  return buckets.map((v) => chars[Math.min(7, Math.floor((v / max) * 7))]).join('');
}

export default function TickerVelocityRail({ articles, redact, onSelect }: Props) {
  const top = useMemo(() => {
    const counts = new Map<string, NewsArticle[]>();
    for (const a of articles) {
      const seen = new Set<string>();
      let m: RegExpExecArray | null;
      const re = new RegExp(TICKER_RE);
      while ((m = re.exec(a.title)) !== null) {
        const t = m[1];
        if (STOPWORDS.has(t) || t.length < 2) continue;
        if (seen.has(t)) continue;
        seen.add(t);
        const list = counts.get(t) ?? [];
        list.push(a);
        counts.set(t, list);
      }
    }
    const arr = Array.from(counts.entries())
      .map(([ticker, list]) => {
        const buckets = toBuckets(list, 16);
        const last24 = list.length;
        const recent6h = buckets.slice(-4).reduce((s, v) => s + v, 0);
        const earlier = Math.max(1, last24 - recent6h);
        const delta = Math.round(((recent6h * 4) / earlier - 1) * 100);
        return { ticker, count: last24, buckets, delta };
      })
      .filter((x) => x.count >= 3)
      .sort((a, b) => b.count - a.count)
      .slice(0, 8);
    return arr;
  }, [articles]);

  if (!top.length) return null;

  return (
    <div className="border-t border-border bg-surface-deep">
      <div className="px-2 py-1 text-[9px] font-mono uppercase text-accent font-bold border-b border-border flex items-center justify-between">
        <span>Ticker Velocity · 24h</span>
        <span className="text-[8px] text-muted-foreground">▲ vs prior 18h</span>
      </div>
      <div className="divide-y divide-border/40">
        {top.map((t) => (
          <button
            key={t.ticker}
            onClick={() => onSelect?.(t.ticker)}
            className={`w-full px-2 py-0.5 grid grid-cols-[44px_1fr_38px_42px] items-center gap-1 text-left hover:bg-surface-elevated ${
              t.delta > 200 ? 'text-accent' : 'text-foreground'
            }`}
          >
            <span className="text-[10px] font-mono font-bold">{t.ticker}</span>
            <span className="font-mono text-[10px] tracking-tight text-foreground/80 truncate">{spark(t.buckets)}</span>
            <span className="text-[9px] font-mono text-muted-foreground text-right">{redact ? '••' : t.count}</span>
            <span className={`text-[9px] font-mono font-bold text-right ${t.delta >= 0 ? 'text-accent' : 'text-negative'}`}>
              {redact ? '••' : `${t.delta >= 0 ? '▲' : '▼'}${Math.abs(t.delta)}%`}
            </span>
          </button>
        ))}
      </div>
    </div>
  );
}
