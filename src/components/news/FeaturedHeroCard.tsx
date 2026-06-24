// FeaturedHeroCard: large magazine-style card for top T1 stories.
import type { NewsArticle } from '@/hooks/useGdeltNews';
import { ArrowUpRight, Pin } from 'lucide-react';
import { sourceCode } from '@/lib/sourceCode';

interface Props {
  article: NewsArticle;
  rank: number;
  active?: boolean;
  pinned?: boolean;
  onClick?: () => void;
  onTogglePin?: () => void;
  redact?: boolean;
}

function timeAgo(ts: string) {
  const m = /^(\d{4})(\d{2})(\d{2})T(\d{2})(\d{2})(\d{2})Z$/.exec(ts);
  if (!m) return '';
  const d = new Date(Date.UTC(+m[1], +m[2] - 1, +m[3], +m[4], +m[5], +m[6]));
  const mins = Math.floor((Date.now() - d.getTime()) / 60_000);
  if (mins < 1) return 'NOW';
  if (mins < 60) return `${mins}M`;
  const hrs = Math.floor(mins / 60);
  if (hrs < 24) return `${hrs}H`;
  return `${Math.floor(hrs / 24)}D`;
}

interface FeaturedRowProps {
  article: NewsArticle;
  rank: number;
  active?: boolean;
  pinned?: boolean;
  onClick?: () => void;
  onTogglePin?: () => void;
  redact?: boolean;
}

export function FeaturedRow({ article, rank, active, pinned, onClick, onTogglePin, redact }: FeaturedRowProps) {
  const tier = article.tier ?? 2;
  const isPotus = article.topic === 'potus' || article.domain.startsWith('POTUS');
  const isX = article.domain.startsWith('@');
  const fresh = (() => {
    const m = /^(\d{4})(\d{2})(\d{2})T(\d{2})(\d{2})(\d{2})Z$/.exec(article.seendate);
    if (!m) return false;
    return (Date.now() - Date.UTC(+m[1], +m[2] - 1, +m[3], +m[4], +m[5], +m[6])) / 60_000 < 2;
  })();
  const code = isPotus ? 'PTUS' : sourceCode(article.domain);

  return (
    <button
      onClick={onClick}
      className={`group w-full text-left flex items-center border-b-2 px-0 font-mono tabular-nums ${
        active
          ? 'bg-accent/25 border-b-accent'
          : isPotus
          ? 'bg-negative/10 border-b-negative hover:bg-negative/20'
          : tier === 1
          ? 'bg-bb-amber/5 border-b-bb-amber/40 hover:bg-bb-amber/10'
          : 'bg-surface-elevated border-b-border hover:bg-surface-elevated/80'
      }`}
      style={{ minHeight: '18px' }}
    >
      <span className="w-6 flex-shrink-0 text-center text-[9px] font-bold text-accent">{rank}</span>
      <span className={`w-3 flex-shrink-0 text-[9px] ${fresh ? 'text-accent animate-pulse' : 'text-transparent'}`}>●</span>
      <span className={`w-[32px] flex-shrink-0 text-[9px] font-bold tracking-tight ${
        isPotus ? 'text-negative' : isX ? 'text-bb-cyan' : 'text-bb-amber'
      }`}>
        {code}
      </span>
      <span className={`flex-1 min-w-0 text-[11px] truncate px-1 font-bold ${
        isPotus ? 'text-negative' : tier === 1 ? 'text-bb-amber' : 'text-foreground'
      }`}>
        {article.title}
      </span>
      <span className="flex-shrink-0 text-[9px] text-muted-foreground pr-2 w-[28px] text-right">
        {timeAgo(article.seendate)}
      </span>
      {article.sourceCount && article.sourceCount > 1 && (
        <span className="flex-shrink-0 text-[8px] font-bold text-accent/80 pr-2">
          ×{redact ? '••' : article.sourceCount}
        </span>
      )}
      {onTogglePin && (
        <span
          role="button"
          tabIndex={0}
          onClick={(e) => { e.stopPropagation(); onTogglePin(); }}
          onKeyDown={(e) => { if (e.key === 'Enter') { e.stopPropagation(); onTogglePin(); } }}
          className={`flex-shrink-0 pr-1 ${pinned ? 'text-accent' : 'text-muted-foreground/30 group-hover:text-muted-foreground'}`}
        >
          <Pin className="w-3 h-3" />
        </span>
      )}
    </button>
  );
}

export default function FeaturedHeroCard({ article, rank, active, pinned, onClick, onTogglePin, redact }: Props) {
  const tier = article.tier ?? 2;
  const tone = article.tone;
  const tBucket = Math.max(-2, Math.min(2, Math.round(tone / 2.5)));
  const segs = [-2, -1, 1, 2];
  const isPotus = article.topic === 'potus' || article.domain.startsWith('POTUS');
  const isX = article.domain.startsWith('@');

  return (
    <button
      onClick={onClick}
      className={`group relative text-left h-full flex flex-col border bg-surface-deep tabular-nums transition-colors ${
        active ? 'border-accent shadow-[0_0_0_1px_hsl(var(--accent))]' : 'border-border hover:border-accent/60'
      }`}
    >
      {/* Top bar */}
      <div className="flex items-center gap-1.5 px-2 py-1 border-b border-border bg-background/60 text-[9px] font-mono">
        <span className="text-accent font-bold">#{rank}</span>
        {isPotus ? (
          <span className="font-bold px-1 bg-negative text-foreground animate-pulse">POTUS</span>
        ) : (
          <span className={`font-bold px-1 ${tier === 1 ? 'bg-accent text-accent-foreground' : 'bg-muted text-muted-foreground'}`}>
            T{tier}
          </span>
        )}
        <span className={`truncate ${isX ? 'text-accent font-bold' : 'text-accent/80'}`}>{article.domain}</span>
        <span className="text-muted-foreground ml-auto">{timeAgo(article.seendate)}</span>
      </div>

      {/* Headline */}
      <div className="flex-1 flex flex-col px-2.5 py-2 gap-2 min-h-0">
        <div className="text-[13px] font-mono font-bold text-foreground leading-snug line-clamp-3 tracking-tight">
          {article.title}
        </div>

        {/* Footer meta */}
        <div className="mt-auto flex items-center gap-2 text-[9px] font-mono">
          {/* Sentiment bar */}
          <span className="flex items-center gap-[1px]" title={`Tone ${tone.toFixed(2)}`}>
            {segs.map((s) => {
              const lit = (s < 0 && tBucket <= s) || (s > 0 && tBucket >= s);
              const cls = !lit ? 'bg-border/50' : s < 0 ? 'bg-negative' : 'bg-positive';
              return <span key={s} className={`w-2 h-2.5 ${cls}`} />;
            })}
          </span>
          <span className={tone >= 0 ? 'text-positive' : 'text-negative'}>
            {tone >= 0 ? '+' : ''}{tone.toFixed(1)}
          </span>
          {article.topic && (
            <span className="text-accent/70 uppercase border border-accent/30 px-1">{article.topic}</span>
          )}
          {article.sourceCount && article.sourceCount > 1 && (
            <span className="px-1 bg-accent/20 text-accent font-bold">×{redact ? '••' : article.sourceCount}</span>
          )}
          {article.country && (
            <span className="text-muted-foreground/60 truncate max-w-[80px] ml-auto">{article.country}</span>
          )}
        </div>
      </div>

      {/* Hover actions */}
      <div className="absolute top-1 right-1 flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
        {onTogglePin && (
          <span
            role="button"
            tabIndex={0}
            onClick={(e) => { e.stopPropagation(); onTogglePin(); }}
            className={`p-1 border border-border bg-background/80 ${pinned ? 'text-accent' : 'text-muted-foreground hover:text-accent'}`}
            title={pinned ? 'Unpin' : 'Pin'}
          >
            <Pin className="w-3 h-3" />
          </span>
        )}
        <span className="p-1 border border-border bg-background/80 text-accent">
          <ArrowUpRight className="w-3 h-3" />
        </span>
      </div>
    </button>
  );
}
