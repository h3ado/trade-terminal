// FiltersDrawer: slide-in panel holding the full filter set.
import SidePanel from './SidePanel';
import SavedSearchesRail from '@/components/news/SavedSearchesRail';
import type { NewsScope, NewsQuery } from '@/hooks/useGdeltNews';
import { countries } from '@/contexts/MacroCountryContext';

interface Props {
  open: boolean;
  onClose: () => void;
  scope: NewsScope;
  value: string;
  topic: string;
  timespan: NewsQuery['timespan'];
  tone: NewsQuery['tone'];
  source: 'all' | 'x' | 'potus' | 'fed';
  onScope: (s: NewsScope, v?: string) => void;
  onValue: (v: string) => void;
  onTopic: (t: string) => void;
  onTimespan: (t: NewsQuery['timespan']) => void;
  onTone: (t: NewsQuery['tone']) => void;
  onSource: (s: 'all' | 'x' | 'potus' | 'fed') => void;
}

const TOPICS = ['', 'central-bank', 'earnings', 'geopolitics', 'energy', 'crypto', 'regulation'];
const TIMES: NewsQuery['timespan'][] = ['1h', '6h', '24h', '72h', '7d'];

function Group({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div>
      <div className="text-[9px] uppercase text-accent font-bold mb-1 tracking-wider">{label}</div>
      {children}
    </div>
  );
}

function Btn({ active, onClick, children }: { active?: boolean; onClick: () => void; children: React.ReactNode }) {
  return (
    <button
      onClick={onClick}
      className={`text-[10px] py-1 uppercase font-bold border ${
        active ? 'bg-accent text-accent-foreground border-accent' : 'border-border text-muted-foreground hover:bg-surface-elevated'
      }`}
    >
      {children}
    </button>
  );
}

export default function FiltersDrawer(p: Props) {
  return (
    <SidePanel open={p.open} onClose={p.onClose} title="FILTERS" width={320}>
      <div className="p-2 space-y-3">
        <Group label="Scope">
          <div className="grid grid-cols-2 gap-0.5">
            {(['global', 'country', 'ticker', 'keyword'] as NewsScope[]).map((s) => (
              <Btn key={s} active={p.scope === s} onClick={() => p.onScope(s, s === 'global' ? '' : p.value)}>{s}</Btn>
            ))}
          </div>
        </Group>

        {p.scope === 'country' && (
          <Group label="Country">
            <select
              value={p.value}
              onChange={(e) => p.onValue(e.target.value)}
              className="w-full bg-surface-elevated border border-border text-[10px] text-foreground p-1 font-mono"
            >
              <option value="">— select —</option>
              {countries.map((c) => (
                <option key={c.code} value={c.code}>{c.flag} {c.code} {c.name}</option>
              ))}
            </select>
          </Group>
        )}

        <Group label="Topic">
          <div className="grid grid-cols-2 gap-0.5">
            {TOPICS.map((t) => (
              <Btn key={t || 'any'} active={p.topic === t} onClick={() => p.onTopic(t)}>{t || 'any'}</Btn>
            ))}
          </div>
        </Group>

        <Group label="Timeframe">
          <div className="grid grid-cols-5 gap-0.5">
            {TIMES.map((t) => (
              <Btn key={t} active={p.timespan === t} onClick={() => p.onTimespan(t)}>{t}</Btn>
            ))}
          </div>
        </Group>

        <Group label="Sentiment">
          <div className="grid grid-cols-3 gap-0.5">
            {(['all', 'pos', 'neg'] as const).map((t) => (
              <Btn key={t} active={p.tone === t} onClick={() => p.onTone(t)}>{t}</Btn>
            ))}
          </div>
        </Group>

        <Group label="Source">
          <div className="grid grid-cols-4 gap-0.5">
            {(['all', 'x', 'potus', 'fed'] as const).map((s) => (
              <Btn key={s} active={p.source === s} onClick={() => p.onSource(s)}>{s}</Btn>
            ))}
          </div>
        </Group>

        <div className="border-t border-border pt-2">
          <SavedSearchesRail currentScope={p.scope} currentValue={p.value} onLoad={p.onScope} />
        </div>

        <div className="border-t border-border pt-2 text-[9px] font-mono text-muted-foreground space-y-0.5">
          <div className="text-accent uppercase font-bold mb-0.5 tracking-wider">Shortcuts</div>
          <div>J/K · next/prev headline</div>
          <div>P · pin/unpin</div>
          <div>T · cycle row density</div>
          <div>B · AI brief</div>
          <div>R · refresh</div>
          <div>F6 · this drawer · Esc · close</div>
        </div>
      </div>
    </SidePanel>
  );
}
