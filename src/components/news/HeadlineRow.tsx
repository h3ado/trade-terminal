import { ExternalLink, Pin } from 'lucide-react';
import type { NewsArticle } from '@/hooks/useGdeltNews';
import type { NewsDensity } from '@/hooks/useNewsPrefs';
import { sourceCode } from '@/lib/sourceCode';

interface Props {
  article: NewsArticle;
  active?: boolean;
  onClick?: () => void;
  redact?: boolean;
  density?: NewsDensity;
  pinned?: boolean;
  onTogglePin?: () => void;
}

function toneColor(tone: number) {
  const t = Math.max(-10, Math.min(10, tone));
  if (t >= 0) return `hsl(140, 70%, ${40 + t * 2}%)`;
  return `hsl(0, 75%, ${40 + Math.abs(t) * 2}%)`;
}

function ageMinutes(ts: string): number {
  const m = /^(\d{4})(\d{2})(\d{2})T(\d{2})(\d{2})(\d{2})Z$/.exec(ts);
  if (!m) return 9999;
  const d = new Date(Date.UTC(+m[1], +m[2] - 1, +m[3], +m[4], +m[5], +m[6]));
  return (Date.now() - d.getTime()) / 60_000;
}

function tierFg(tier: number): string {
  if (tier === 1) return 'text-bb-amber';
  if (tier === 2) return 'text-foreground/80';
  return 'text-muted-foreground';
}

function timeAgo(ts: string) {
  const m = /^(\d{4})(\d{2})(\d{2})T(\d{2})(\d{2})(\d{2})Z$/.exec(ts);
  if (!m) return '';
  const d = new Date(Date.UTC(+m[1], +m[2] - 1, +m[3], +m[4], +m[5], +m[6]));
  const diff = Date.now() - d.getTime();
  const mins = Math.floor(diff / 60_000);
  if (mins < 1) return 'now';
  if (mins < 60) return `${mins}m`;
  const hrs = Math.floor(mins / 60);
  if (hrs < 24) return `${hrs}h`;
  return `${Math.floor(hrs / 24)}d`;
}

const TIER_LABEL: Record<number, { l: string; cls: string }> = {
  1: { l: 'T1', cls: 'bg-accent text-accent-foreground' },
  2: { l: 'T2', cls: 'bg-muted text-muted-foreground' },
  3: { l: 'T3', cls: 'bg-surface-elevated text-muted-foreground' },
};

function isPotus(a: NewsArticle) {
  return a.topic === 'potus' || a.domain.startsWith('POTUS');
}
function isXSource(a: NewsArticle) {
  return a.domain.startsWith('@');
}

export default function HeadlineRow({ article, active, onClick, redact, density = 'comfort', pinned, onTogglePin }: Props) {
  const color = toneColor(article.tone);
  const intensity = Math.min(1, Math.abs(article.tone) / 8);
  const tier = TIER_LABEL[article.tier ?? 2];
  const potus = isPotus(article);
  const isX = isXSource(article);

  if (density === 'bloomberg') {
    const fresh = ageMinutes(article.seendate) < 2;
    const tier = article.tier ?? 2;
    const potus = isPotus(article);
    const isX = isXSource(article);
    const code = potus ? 'PTUS' : sourceCode(article.domain);
    const timeStr = timeAgo(article.seendate).padStart(4);

    return (
      <button
        onClick={onClick}
        className={`group w-full text-left border-b border-border/20 flex items-center font-mono tabular-nums leading-none ${
          active ? 'bg-accent/20' : potus ? 'bg-negative/10 hover:bg-negative/20' : 'hover:bg-surface-elevated'
        }`}
        style={{ minHeight: '16px' }}
      >
        <span className={`w-4 flex-shrink-0 text-center text-[10px] ${fresh ? 'text-accent animate-pulse' : 'text-transparent'}`}>
          ●
        </span>
        <span className="w-[28px] flex-shrink-0 text-right text-[9px] text-muted-foreground pr-1">
          {timeStr}
        </span>
        <span className={`w-[32px] flex-shrink-0 text-[9px] font-bold tracking-tight ${
          potus ? 'text-negative animate-pulse' : isX ? 'text-bb-cyan' : 'text-bb-blue'
        }`}>
          {code}
        </span>
        <span className={`flex-1 min-w-0 text-[10px] truncate px-1 ${tierFg(tier)} ${active ? 'font-bold' : ''} ${potus ? 'text-negative font-bold' : ''}`}>
          {article.domain === 'sec.gov' && (
            <span className="text-[8px] font-bold text-bb-amber border border-bb-amber/50 px-0.5 mr-1">
              {/\b(8-K|10-Q|10-K|S-1)\b/.exec(article.title)?.[0] ?? 'SEC'}
            </span>
          )}
          {article.title}
        </span>
        {article.sourceCount && article.sourceCount > 1 && (
          <span className="flex-shrink-0 text-[8px] font-bold text-accent/80 pr-1">×{article.sourceCount}</span>
        )}
        {pinned && <span className="flex-shrink-0 text-[8px] text-accent pr-1">▪</span>}
      </button>
    );
  }

  if (density === 'tape') {
    return (
      <button
        onClick={onClick}
        className={`group w-full text-left border-b border-border/30 px-2 py-0.5 flex items-center gap-2 ${
          active ? 'bg-accent/15' : 'hover:bg-surface-elevated'
        }`}
      >
        {potus
          ? <span className="text-[8px] font-mono font-bold px-1 bg-negative text-foreground animate-pulse">POTUS</span>
          : <span className={`text-[8px] font-mono font-bold px-1 ${tier.cls}`}>{tier.l}</span>}
        <span className="text-[9px] font-mono text-muted-foreground w-8 flex-shrink-0">{timeAgo(article.seendate)}</span>
        <span className={`text-[10px] font-mono truncate flex-1 ${potus ? 'text-foreground font-bold' : 'text-foreground'}`}>
          {article.domain === 'sec.gov' && (
            <span className="text-[8px] font-bold text-bb-amber border border-bb-amber/50 px-0.5 mr-1">
              {/\b(8-K|10-Q|10-K|S-1)\b/.exec(article.title)?.[0] ?? 'SEC'}
            </span>
          )}
          {article.title}
        </span>
        <span className={`text-[8px] font-mono flex-shrink-0 ${isX ? 'text-accent' : 'text-accent/70'}`}>{article.domain}</span>
      </button>
    );
  }

  if (density === 'compact') {
    return (
      <button
        onClick={onClick}
        className={`group w-full text-left border-b border-border/40 px-2 py-1 flex items-center gap-2 ${
          active ? 'bg-accent/15' : 'hover:bg-surface-elevated'
        }`}
      >
        <div className="w-0.5 self-stretch flex-shrink-0" style={{ backgroundColor: color, opacity: 0.4 + intensity * 0.6 }} />
        {potus
          ? <span className="text-[8px] font-mono font-bold px-1 bg-negative text-foreground animate-pulse">POTUS</span>
          : <span className={`text-[8px] font-mono font-bold px-1 ${tier.cls}`}>{tier.l}</span>}
        <span className="text-[9px] font-mono text-muted-foreground w-8 flex-shrink-0">{timeAgo(article.seendate)}</span>
        <span className={`text-[10px] font-mono truncate flex-1 ${potus ? 'text-foreground font-bold' : 'text-foreground'}`}>{article.title}</span>
        {article.print && <span className="text-[8px] font-mono font-bold px-1 bg-accent/30 text-accent flex-shrink-0">{article.print}</span>}
        {article.topic && <span className="text-[8px] font-mono text-accent/70 uppercase flex-shrink-0">{article.topic}</span>}
        <span className={`text-[9px] font-mono truncate max-w-[100px] flex-shrink-0 ${isX ? 'text-accent' : 'text-accent/70'}`}>{article.domain}</span>
      </button>
    );
  }

  // Sentiment bar segments (4 cells, lit by tone bucket)
  const tBucket = Math.max(-2, Math.min(2, Math.round(article.tone / 2.5))); // -2..+2
  const segs = [-2, -1, 1, 2];
  const trustScore = Math.max(20, Math.min(99, 100 - (article.tier ?? 2) * 18 - (article.domain.startsWith('@') ? 10 : 0)));

  return (
    <button
      onClick={onClick}
      className={`group w-full text-left border-b border-border/50 px-2 py-1.5 transition-colors flex items-stretch gap-2 odd:bg-muted/[0.02] tabular-nums ${
        active ? 'bg-accent/15' : 'hover:bg-surface-elevated'
      }`}
    >
      <div
        className="w-1 flex-shrink-0 self-stretch"
        style={{ backgroundColor: color, opacity: 0.4 + intensity * 0.6 }}
        title={`Tone ${article.tone.toFixed(2)}`}
      />
      <div className="flex-1 min-w-0">
        <div className="flex items-center gap-1.5 mb-0.5 text-[9px] font-mono">
          {potus
            ? <span className="text-[8px] font-mono font-bold px-1 bg-negative text-foreground animate-pulse">POTUS</span>
            : <span className={`text-[8px] font-mono font-bold px-1 ${tier.cls}`}>{tier.l}</span>}
          {/* Trust score */}
          <span className="text-[8px] text-muted-foreground border border-border/50 px-1" title={`Source trust score (heuristic)`}>
            <span className={trustScore >= 75 ? 'text-positive' : trustScore >= 50 ? 'text-accent' : 'text-muted-foreground'}>{trustScore}</span>
          </span>
          <span className="text-muted-foreground uppercase">{timeAgo(article.seendate)}</span>
          <span className={`truncate ${isX ? 'text-accent font-bold' : 'text-accent/80'}`}>{article.domain}</span>
          {/* Sentiment bar */}
          <span className="flex items-center gap-[1px]" title={`Tone ${article.tone.toFixed(2)}`}>
            {segs.map((s) => {
              const lit = (s < 0 && tBucket <= s) || (s > 0 && tBucket >= s);
              const cls = !lit ? 'bg-border/50' : s < 0 ? 'bg-negative' : 'bg-positive';
              return <span key={s} className={`w-1.5 h-2 ${cls}`} />;
            })}
          </span>
          {article.topic && (
            <span className="text-[8px] uppercase font-bold text-accent/70 border border-accent/30 px-1">{article.topic}</span>
          )}
          {article.print && (
            <span className="text-[8px] uppercase font-bold text-accent bg-accent/15 border border-accent/40 px-1">{article.print}</span>
          )}
          {article.sourceCount && article.sourceCount > 1 && (
            <span className="px-1 bg-accent/20 text-accent font-bold">×{redact ? '••' : article.sourceCount}</span>
          )}
          {article.country && (
            <span className="text-muted-foreground/60 ml-auto truncate max-w-[80px]">{article.country}</span>
          )}
        </div>
        <div className="text-[11px] font-mono text-foreground leading-tight line-clamp-2">{article.title}</div>
      </div>
      {onTogglePin && (
        <span
          role="button"
          tabIndex={0}
          onClick={(e) => { e.stopPropagation(); onTogglePin(); }}
          onKeyDown={(e) => { if (e.key === 'Enter') { e.stopPropagation(); onTogglePin(); } }}
          className={`self-start mt-0.5 flex-shrink-0 ${pinned ? 'text-accent' : 'text-muted-foreground/40 hover:text-accent'}`}
          title={pinned ? 'Unpin' : 'Pin'}
        >
          <Pin className="w-3 h-3" />
        </span>
      )}
      <ExternalLink className="w-3 h-3 text-muted-foreground/40 group-hover:text-accent self-start mt-0.5 flex-shrink-0" />
    </button>
  );
}
