// ScopeBar: horizontal chip bar for the most-used filters.
import { SlidersHorizontal, Pin, Flame, Search, X } from 'lucide-react';
import type { NewsScope, NewsQuery } from '@/hooks/useGdeltNews';

interface Props {
  scope: NewsScope;
  value: string;
  topic: string;
  timespan: NewsQuery['timespan'];
  tone: NewsQuery['tone'];
  pinOnly: boolean;
  sort: 'recent' | 'velocity';
  source: 'all' | 'x' | 'potus' | 'fed';
  onScope: (s: NewsScope) => void;
  onValue: (v: string) => void;
  onTopic: (t: string) => void;
  onTimespan: (t: NewsQuery['timespan']) => void;
  onTone: (t: NewsQuery['tone']) => void;
  onPinToggle: () => void;
  onSortToggle: () => void;
  onSource: (s: 'all' | 'x' | 'potus' | 'fed') => void;
  onOpenFilters: () => void;
}

const SCOPES: NewsScope[] = ['global', 'country', 'ticker', 'keyword'];
const TOPICS = ['', 'central-bank', 'earnings', 'geopolitics', 'energy', 'crypto', 'regulation'];
const TIMES: NewsQuery['timespan'][] = ['1h', '6h', '24h', '72h', '7d'];
const TONES: { v: NewsQuery['tone']; l: string }[] = [
  { v: 'all', l: 'ALL' }, { v: 'pos', l: 'POS' }, { v: 'neg', l: 'NEG' },
];
const SOURCES: ('all' | 'x' | 'potus' | 'fed')[] = ['all', 'x', 'potus', 'fed'];

function Chip({ active, children, onClick, title }: { active?: boolean; children: React.ReactNode; onClick?: () => void; title?: string }) {
  return (
    <button
      onClick={onClick}
      title={title}
      className={`text-[9px] font-mono uppercase font-bold border px-1.5 py-0.5 tracking-wider whitespace-nowrap transition-colors ${
        active
          ? 'bg-accent text-accent-foreground border-accent'
          : 'border-border text-muted-foreground hover:bg-surface-elevated hover:text-foreground'
      }`}
    >
      {children}
    </button>
  );
}

export default function ScopeBar(p: Props) {
  return (
    <div className="flex items-center gap-1 px-2 py-1 border-b border-border bg-surface-deep flex-shrink-0 overflow-x-auto">
      {/* Scope */}
      <div className="flex items-center gap-px">
        {SCOPES.map((s) => (
          <Chip key={s} active={p.scope === s} onClick={() => p.onScope(s)}>
            {s}
          </Chip>
        ))}
      </div>

      {p.scope !== 'global' && (
        <div className="relative ml-1 flex items-center">
          <Search className="w-3 h-3 absolute left-1.5 top-1/2 -translate-y-1/2 text-muted-foreground" />
          <input
            value={p.value}
            onChange={(e) => p.onValue(e.target.value)}
            placeholder={p.scope === 'country' ? 'US, JP…' : p.scope === 'ticker' ? 'NVDA, BTC…' : 'oil, fed…'}
            className="bg-surface-elevated border border-border text-[10px] text-foreground pl-6 pr-5 py-0.5 outline-none focus:border-accent w-[120px] font-mono"
          />
          {p.value && (
            <button onClick={() => p.onValue('')} className="absolute right-1 top-1/2 -translate-y-1/2">
              <X className="w-3 h-3 text-muted-foreground hover:text-accent" />
            </button>
          )}
        </div>
      )}

      <span className="text-border mx-1">│</span>

      {/* Timespan */}
      <div className="flex items-center gap-px">
        {TIMES.map((t) => (
          <Chip key={t} active={p.timespan === t} onClick={() => p.onTimespan(t)}>{t}</Chip>
        ))}
      </div>

      <span className="text-border mx-1">│</span>

      {/* Tone */}
      <div className="flex items-center gap-px">
        {TONES.map((t) => (
          <Chip key={t.v} active={p.tone === t.v} onClick={() => p.onTone(t.v)}>{t.l}</Chip>
        ))}
      </div>

      <span className="text-border mx-1">│</span>

      {/* Topic (compact) */}
      <div className="flex items-center gap-px">
        {TOPICS.slice(0, 5).map((t) => (
          <Chip key={t || 'any'} active={p.topic === t} onClick={() => p.onTopic(t)}>
            {t || 'any'}
          </Chip>
        ))}
      </div>

      <span className="text-border mx-1">│</span>

      {/* Source */}
      <div className="flex items-center gap-px">
        {SOURCES.map((s) => (
          <Chip key={s} active={p.source === s} onClick={() => p.onSource(s)}>{s}</Chip>
        ))}
      </div>

      <div className="ml-auto flex items-center gap-1 pl-2">
        <Chip active={p.sort === 'velocity'} onClick={p.onSortToggle} title="Sort by velocity">
          <Flame className="w-3 h-3 inline-block -mt-0.5 mr-0.5" />HOT
        </Chip>
        <Chip active={p.pinOnly} onClick={p.onPinToggle} title="Show pinned only">
          <Pin className="w-3 h-3 inline-block -mt-0.5 mr-0.5" />PIN
        </Chip>
        <Chip onClick={p.onOpenFilters} title="More filters (F6)">
          <SlidersHorizontal className="w-3 h-3 inline-block -mt-0.5 mr-0.5" />MORE
        </Chip>
      </div>
    </div>
  );
}
