// Persistent ticker tape: scrolls latest T1/T2 headlines + numeric prints.
import { useMemo } from 'react';
import type { NewsArticle } from '@/hooks/useGdeltNews';

interface Props {
  articles: NewsArticle[];
  onSelect?: (id: string) => void;
}

export default function MarqueeTape({ articles, onSelect }: Props) {
  const items = useMemo(() => {
    return articles
      .filter((a) => (a.tier ?? 2) <= 2)
      .slice(0, 30);
  }, [articles]);

  if (items.length === 0) return null;

  // Duplicate for seamless loop
  const loop = [...items, ...items];

  return (
    <div className="relative overflow-hidden border-b border-border bg-background flex-shrink-0 group">
      <div className="absolute inset-y-0 left-0 z-10 px-2 flex items-center bg-surface-deep border-r border-border">
        <span className="text-[9px] font-mono font-bold text-accent uppercase tracking-wider animate-pulse">● TAPE</span>
      </div>
      <div className="flex items-center gap-6 py-1 pl-20 whitespace-nowrap animate-[marquee_120s_linear_infinite] group-hover:[animation-play-state:paused]">
        {loop.map((a, i) => {
          const tier = a.tier ?? 2;
          const tierCls = tier === 1 ? 'text-accent font-bold' : 'text-foreground';
          return (
            <button
              key={`${a.id}-${i}`}
              onClick={() => onSelect?.(a.id)}
              className="text-[10px] font-mono hover:underline flex items-center gap-1.5 tabular-nums"
            >
              <span className={`text-[8px] font-bold px-1 ${tier === 1 ? 'bg-accent text-accent-foreground' : 'bg-muted text-muted-foreground'}`}>T{tier}</span>
              <span className="text-accent/70">{a.domain}</span>
              <span className="text-muted-foreground">›</span>
              <span className={tierCls + ' truncate max-w-[480px]'}>{a.title}</span>
              {a.print && <span className="text-[8px] font-bold px-1 bg-accent/20 text-accent">{a.print}</span>}
            </button>
          );
        })}
      </div>
      <style>{`@keyframes marquee { 0% { transform: translateX(0); } 100% { transform: translateX(-50%); } }`}</style>
    </div>
  );
}
