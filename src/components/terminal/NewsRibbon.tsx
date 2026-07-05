// Persistent scrolling news headline strip — sits above the F-key bar.
// Uses the lightweight useNewsHeadlines hook (wire-only, 3-min TTL).
import { useNewsHeadlines } from '@/hooks/useNewsHeadlines';

export default function NewsRibbon() {
  const articles = useNewsHeadlines();

  if (articles.length === 0) return null;

  // Take top 25 headlines, duplicate for seamless loop
  const items = articles.slice(0, 25);
  const loop = [...items, ...items];

  return (
    <div
      className="relative overflow-hidden border-t border-border bg-surface-deep h-[18px] flex-shrink-0 group"
      title="Pause to read — hover"
    >
      {/* Label badge */}
      <div className="absolute inset-y-0 left-0 z-10 flex items-center px-2 bg-surface-deep border-r border-border">
        <span className="text-[7px] font-mono font-bold text-amber-400 uppercase tracking-widest animate-pulse-dot">
          ● WIRE
        </span>
      </div>

      {/* Scrolling content */}
      <div
        className="absolute inset-y-0 left-[52px] right-0 flex items-center"
        style={{ overflow: 'hidden' }}
      >
        <div className="flex items-center gap-5 whitespace-nowrap animate-[newsticker_240s_linear_infinite] group-hover:[animation-play-state:paused]">
          {loop.map((a, i) => (
            <span key={`${a.id}-${i}`} className="flex items-center gap-1.5 flex-shrink-0">
              <span className="text-amber-400/40 text-[8px]">◆</span>
              {a.tier === 1 && (
                <span className="text-[7px] font-mono font-bold bg-accent text-accent-foreground px-0.5">T1</span>
              )}
              <span className="text-[9px] font-mono text-foreground/80">{a.title}</span>
              {a.domain && (
                <span className="text-[8px] font-mono text-muted-foreground">[{a.domain}]</span>
              )}
            </span>
          ))}
        </div>
      </div>

      <style>{`
        @keyframes newsticker {
          0%   { transform: translateX(0); }
          100% { transform: translateX(-50%); }
        }
      `}</style>
    </div>
  );
}
