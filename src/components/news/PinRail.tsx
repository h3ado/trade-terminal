import { Pin, X } from 'lucide-react';
import type { NewsArticle } from '@/hooks/useGdeltNews';

interface Props {
  pins: string[];
  articles: NewsArticle[];
  onSelect: (id: string) => void;
  onRemove: (id: string) => void;
}

export default function PinRail({ pins, articles, onSelect, onRemove }: Props) {
  if (pins.length === 0) return null;
  const map = new Map(articles.map((a) => [a.id, a]));
  const items = pins.map((id) => map.get(id)).filter(Boolean) as NewsArticle[];
  if (items.length === 0) return null;
  return (
    <div className="flex items-center gap-1 px-2 py-1 border-b border-border bg-surface-deep overflow-x-auto">
      <Pin className="w-3 h-3 text-accent flex-shrink-0" />
      <span className="text-[9px] uppercase font-bold text-accent mr-1">PIN</span>
      {items.map((a) => (
        <div key={a.id} className="flex items-center gap-1 border border-accent/40 px-1 py-0.5 flex-shrink-0 max-w-[260px]">
          <button
            onClick={() => onSelect(a.id)}
            className="text-[10px] font-mono text-foreground hover:text-accent truncate"
            title={a.title}
          >
            {a.title}
          </button>
          <button onClick={() => onRemove(a.id)} className="text-muted-foreground hover:text-negative">
            <X className="w-3 h-3" />
          </button>
        </div>
      ))}
    </div>
  );
}
