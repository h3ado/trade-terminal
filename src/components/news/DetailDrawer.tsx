// DetailDrawer: right slide-in holding article detail + AI brief + thesis + deep + map + heat tabs.
import { useState, useEffect } from 'react';
import SidePanel from './SidePanel';
import AiBriefPanel from '@/components/news/AiBriefPanel';
import ThesisPanel from '@/components/news/ThesisPanel';
import DeepSearchPanel from '@/components/news/DeepSearchPanel';
import HeadlineQAPopover from '@/components/news/HeadlineQAPopover';
import NewsGlobeMap from '@/components/news/NewsGlobeMap';
import ToneHeatGrid from '@/components/news/ToneHeatGrid';
import TickerVelocityRail from '@/components/news/TickerVelocityRail';
import type { NewsArticle, GeoEvent, NewsScope } from '@/hooks/useGdeltNews';

type Tab = 'detail' | 'thesis' | 'deep' | 'map' | 'heat';

interface Props {
  open: boolean;
  onClose: () => void;
  active?: NewsArticle;
  articles: NewsArticle[];
  rawArticles: NewsArticle[];
  geoEvents: GeoEvent[];
  scope: NewsScope;
  value: string;
  briefHeadlines: NewsArticle[];
  autoBrief: boolean;
  redact: boolean;
  isPinned: (id: string) => boolean;
  onTogglePin: (id: string) => void;
  onFocusById: (id: string) => void;
  onScopeChange: (s: NewsScope, v?: string) => void;
  initialTab?: Tab;
}

const TABS: { v: Tab; l: string }[] = [
  { v: 'detail', l: 'DETAIL' },
  { v: 'thesis', l: 'THESIS' },
  { v: 'deep', l: 'DEEP' },
  { v: 'map', l: 'MAP' },
  { v: 'heat', l: 'HEAT' },
];

export default function DetailDrawer(p: Props) {
  const [tab, setTab] = useState<Tab>(p.initialTab ?? 'detail');
  useEffect(() => { if (p.initialTab) setTab(p.initialTab); }, [p.initialTab]);

  const a = p.active;

  return (
    <SidePanel open={p.open} onClose={p.onClose} title={`STORY · ${a?.domain ?? '—'}`} width={420}>
      <div className="flex border-b border-border bg-surface-deep flex-shrink-0">
        {TABS.map((t) => (
          <button
            key={t.v}
            onClick={() => setTab(t.v)}
            className={`flex-1 text-[9px] uppercase font-bold py-1 border-r border-border last:border-r-0 tracking-wider ${
              tab === t.v ? 'bg-accent text-accent-foreground' : 'text-muted-foreground hover:bg-surface-elevated'
            }`}
          >
            {t.l}
          </button>
        ))}
      </div>

      <TickerVelocityRail
        articles={p.rawArticles}
        redact={p.redact}
        onSelect={(t) => p.onScopeChange('ticker', t)}
      />

      {tab === 'map' && <NewsGlobeMap events={p.geoEvents} redact={p.redact} />}
      {tab === 'heat' && <ToneHeatGrid articles={p.articles} redact={p.redact} onSelect={p.onFocusById} />}
      {tab === 'thesis' && <ThesisPanel scope={p.scope} value={p.value} headlines={p.articles} redact={p.redact} />}
      {tab === 'deep' && <DeepSearchPanel initialQuery={p.value} />}

      {tab === 'detail' && (a ? (
        <div className="p-2 space-y-3">
          <div>
            <div className="flex items-center gap-1.5 text-[9px] font-mono mb-1 flex-wrap">
              <span className="text-accent uppercase font-bold">{a.domain}</span>
              <span className="text-muted-foreground">·</span>
              <span className="text-muted-foreground">tone {a.tone.toFixed(2)}</span>
              {a.topic && (<><span className="text-muted-foreground">·</span><span className="text-accent uppercase">{a.topic}</span></>)}
              {a.country && (<><span className="text-muted-foreground">·</span><span className="text-muted-foreground truncate">{a.country}</span></>)}
              <button
                onClick={() => p.onTogglePin(a.id)}
                className={`ml-auto text-[9px] uppercase font-bold px-1 border ${p.isPinned(a.id) ? 'bg-accent text-accent-foreground border-accent' : 'border-border text-muted-foreground hover:bg-surface-elevated'}`}
              >
                {p.isPinned(a.id) ? 'Pinned' : 'Pin'}
              </button>
            </div>
            <a
              href={a.url}
              target="_blank"
              rel="noreferrer noopener"
              className="text-[12px] font-mono font-bold text-foreground hover:text-accent leading-tight block"
            >
              {a.title}
            </a>
          </div>

          {a.image && (
            <img src={a.image} alt="" className="w-full max-h-40 object-cover border border-border" />
          )}

          {a.sources && a.sources.length > 1 && (
            <div>
              <div className="text-[9px] uppercase text-accent font-bold mb-1">
                Cluster · {p.redact ? '••' : a.sources.length} sources
              </div>
              <div className="space-y-0.5 max-h-32 overflow-y-auto">
                {a.sources.map((s, i) => (
                  <a
                    key={i}
                    href={s.url}
                    target="_blank"
                    rel="noreferrer noopener"
                    className="block text-[10px] font-mono text-muted-foreground hover:text-accent truncate"
                  >· {s.domain}</a>
                ))}
              </div>
            </div>
          )}

          <AiBriefPanel
            scope={p.scope === 'global' ? 'global' : p.scope}
            value={p.value}
            headlines={p.briefHeadlines}
            autoOnMount={p.autoBrief}
          />

          <HeadlineQAPopover headline={a} context={p.articles.slice(0, 12)} />
        </div>
      ) : (
        <div className="p-4 text-[10px] font-mono text-muted-foreground">Select a headline to see details.</div>
      ))}
    </SidePanel>
  );
}
