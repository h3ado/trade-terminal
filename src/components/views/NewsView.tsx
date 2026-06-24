import { useEffect, useMemo, useState } from 'react';
import { Globe2, Rows, Rows3, Minus } from 'lucide-react';
import { usePrivacy } from '@/contexts/PrivacyContext';
import { useGdeltNews, type NewsQuery, type NewsScope } from '@/hooks/useGdeltNews';
import { useNewsCalendar } from '@/hooks/useNewsCalendar';
import { useNewsDensity, useNewsPins, useNewsKeyboard } from '@/hooks/useNewsPrefs';
import ToneSparkline from '@/components/news/ToneSparkline';
import PinRail from '@/components/news/PinRail';
import DailyWrapBanner from '@/components/news/DailyWrapBanner';
import SquawkPlayer from '@/components/news/SquawkPlayer';
import TVClipDrawer from '@/components/news/TVClipDrawer';
import StatusRibbon from '@/components/terminal/StatusRibbon';
import FunctionKeyBar, { type FKey } from '@/components/terminal/FunctionKeyBar';
import { useEconCalendar, useNextEvents } from '@/hooks/useEconCalendar';
import { FeaturedRow } from '@/components/news/FeaturedHeroCard';
import MediaStrip from '@/components/news/MediaStrip';
import ScopeBar from '@/components/news/ScopeBar';
import FiltersDrawer from '@/components/news/FiltersDrawer';
import TapeFeed from '@/components/news/TapeFeed';
import DetailDrawer from '@/components/news/DetailDrawer';
import NewsDetailPanel from '@/components/news/NewsDetailPanel';
import CalendarRail from '@/components/news/CalendarRail';

interface Props {
  initialScope?: NewsScope;
  initialValue?: string;
  initialAiBrief?: boolean;
  initialTopic?: string;
  initialPinOnly?: boolean;
  initialWatchOnly?: boolean;
  initialSort?: 'recent' | 'velocity';
  initialSource?: 'all' | 'x' | 'potus' | 'fed';
  initialRightPane?: 'detail' | 'map' | 'heat' | 'thesis' | 'wrap' | 'deep';
  initialDeepQuery?: string;
}

const TIMESPANS: NewsQuery['timespan'][] = ['1h', '6h', '24h', '72h', '7d'];
const TONES: { v: NewsQuery['tone']; label: string }[] = [
  { v: 'all', label: 'ALL' },
  { v: 'pos', label: 'POS' },
  { v: 'neg', label: 'NEG' },
];
const TOPICS = ['', 'central-bank', 'earnings', 'geopolitics', 'energy', 'crypto', 'regulation'];

export default function NewsView({
  initialScope = 'global',
  initialValue = '',
  initialAiBrief = false,
  initialTopic = '',
  initialPinOnly = false,
  initialWatchOnly = false,
  initialSort = 'recent',
  initialSource = 'all',
  initialRightPane = 'detail',
}: Props) {
  const { privacyMode } = usePrivacy();
  const [scope, setScope] = useState<NewsScope>(initialScope);
  const [value, setValue] = useState(initialValue);
  const [timespan, setTimespan] = useState<NewsQuery['timespan']>('24h');
  const [tone, setTone] = useState<NewsQuery['tone']>('all');
  const [topic, setTopic] = useState<string>(initialTopic);
  const [activeIndex, setActiveIndex] = useState(0);
  const [autoBrief, setAutoBrief] = useState(initialAiBrief);
  const [pinOnly, setPinOnly] = useState(initialPinOnly);
  const [, /* watchOnly placeholder */ setWatchOnly] = useState(initialWatchOnly);
  const [sort, setSort] = useState<'recent' | 'velocity'>(initialSort);
  const [source, setSource] = useState<'all' | 'x' | 'potus' | 'fed'>(initialSource);
  const [rightPane, setRightPane] = useState<'detail' | 'map' | 'heat' | 'thesis' | 'wrap' | 'deep'>(initialRightPane);
  const [squawkOpen, setSquawkOpen] = useState(false);
  const [tvOpen, setTvOpen] = useState(false);

  // Listen for CLI commands to open audio/TV
  useEffect(() => {
    const onSquawk = (e: Event) => {
      const ev = e as CustomEvent<{ open?: boolean }>;
      if (ev.detail?.open !== undefined) setSquawkOpen(ev.detail.open);
      else setSquawkOpen((v) => !v);
    };
    const onTv = () => setTvOpen((v) => !v);
    window.addEventListener('lovable:squawk-toggle', onSquawk);
    window.addEventListener('lovable:tv-toggle', onTv);
    return () => {
      window.removeEventListener('lovable:squawk-toggle', onSquawk);
      window.removeEventListener('lovable:tv-toggle', onTv);
    };
  }, []);

  const { density, setDensity, cycle: cycleDensity } = useNewsDensity();
  useEffect(() => {
    if (!localStorage.getItem('pref:news.density')) setDensity('bloomberg');
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);
  const { pins, toggle: togglePin, remove: removePin, has: isPinned } = useNewsPins();
  useNewsCalendar(); // legacy CB release polling kept for future use
  const { events: econEvents } = useEconCalendar();

  // Latency proxy: ms since last fetch
  const [tickNow, setTickNow] = useState(Date.now());
  useEffect(() => {
  const t = setInterval(() => setTickNow(Date.now()), 2000);
    return () => clearInterval(t);
  }, []);

  // Re-sync when CLI re-navigates
  useEffect(() => {
    setScope(initialScope);
    setValue(initialValue);
    setAutoBrief(initialAiBrief);
    setTopic(initialTopic);
    setPinOnly(initialPinOnly);
    setWatchOnly(initialWatchOnly);
    setSort(initialSort);
    setSource(initialSource);
    setRightPane(initialRightPane);
    setActiveIndex(0);
  }, [initialScope, initialValue, initialAiBrief, initialTopic, initialPinOnly, initialWatchOnly, initialSort, initialSource, initialRightPane]);

  const query = useMemo<NewsQuery>(
    () => ({ scope, value, timespan, tone, topic: topic || undefined }),
    [scope, value, timespan, tone, topic],
  );
  const { articles: rawArticles, toneSeries, geoEvents, loading, error, fetchedAt, refetch } = useGdeltNews(query);

  // Apply pin/sort/source filters client-side
  const articles = useMemo(() => {
    let list = rawArticles;
    if (source === 'x') list = list.filter((a) => a.domain.startsWith('@'));
    else if (source === 'potus') list = list.filter((a) => a.topic === 'potus' || a.domain.startsWith('POTUS'));
    else if (source === 'fed') list = list.filter((a) => a.domain === 'federalreserve.gov');
    if (pinOnly) list = list.filter((a) => pins.includes(a.id));
    if (sort === 'velocity') {
      // proxy for velocity: sourceCount desc
      list = [...list].sort((a, b) => (b.sourceCount ?? 1) - (a.sourceCount ?? 1));
    }
    return list;
  }, [rawArticles, pinOnly, sort, pins, source]);

  const active = articles[activeIndex] ?? articles[0];

  // Keyboard shortcuts
  useNewsKeyboard({
    j: () => setActiveIndex((i) => Math.min(i + 1, Math.max(0, articles.length - 1))),
    k: () => setActiveIndex((i) => Math.max(i - 1, 0)),
    p: () => active && togglePin(active.id),
    t: () => cycleDensity(),
    b: () => setAutoBrief(true),
    r: () => refetch(),
  });

  const briefHeadlines = useMemo(() => {
    if (!active) return [];
    const head = [active];
    if (active.sources && active.sources.length > 1) {
      for (const s of active.sources.slice(1, 8)) {
        head.push({ ...active, url: s.url, domain: s.domain });
      }
    }
    return [...head, ...articles.filter((a) => a.id !== active.id).slice(0, 12)];
  }, [active, articles]);

  const scopeLabel =
    scope === 'global' ? 'GLOBAL' :
    scope === 'country' ? `CC ${value.toUpperCase()}` :
    scope === 'ticker' ? `TICKER ${value.toUpperCase()}` :
    `KW "${value}"`;

  const handleScopeChange = (s: NewsScope, v = '') => {
    setScope(s); setValue(v); setActiveIndex(0);
  };

  const focusById = (id: string) => {
    const i = articles.findIndex((a) => a.id === id);
    if (i >= 0) setActiveIndex(i);
  };

  const latencyMs = fetchedAt ? Math.max(0, tickNow - fetchedAt) : undefined;
  // T1 in last 60s
  const t1PerMin = useMemo(() => {
    const cutoff = Date.now() - 60_000;
    return rawArticles.filter((a) => {
      if ((a.tier ?? 2) !== 1) return false;
      const m = /^(\d{4})(\d{2})(\d{2})T(\d{2})(\d{2})(\d{2})Z$/.exec(a.seendate);
      if (!m) return false;
      const t = Date.UTC(+m[1], +m[2] - 1, +m[3], +m[4], +m[5], +m[6]);
      return t >= cutoff;
    }).length;
  }, [rawArticles, tickNow]);

  // F-keys
  const fkeys: FKey[] = [
    { key: 'F1', label: 'HELP', onClick: () => window.dispatchEvent(new KeyboardEvent('keydown', { key: '/' })) },
    { key: 'F2', label: 'NEWS', onClick: () => setRightPane('detail') },
    { key: 'F3', label: 'CAL', onClick: () => window.dispatchEvent(new CustomEvent('lovable:econ-cal-open')) },
    { key: 'F4', label: 'SQUAWK', onClick: () => setSquawkOpen((v) => !v) },
    { key: 'F5', label: 'TV', onClick: () => setTvOpen((v) => !v) },
    { key: 'F6', label: 'GEOPOL', onClick: () => setTopic('geopolitics') },
    { key: 'F7', label: 'CMDTY', onClick: () => setTopic('energy') },
    { key: 'F8', label: 'LEGAL', onClick: () => setTopic('regulation') },
    { key: 'F9', label: 'CRYPTO', onClick: () => setTopic('crypto') },
    { key: 'F10', label: 'CB', onClick: () => setTopic('central-bank') },
    { key: 'F11', label: 'PIN', onClick: () => setPinOnly((v) => !v) },
    { key: 'F12', label: 'REFRESH', onClick: () => refetch() },
  ];

  // v7 redesign state
  const [filtersOpen, setFiltersOpen] = useState(false);

  const featured = useMemo(() => articles.slice(0, 3), [articles]);
  const tape = useMemo(() => articles.slice(3), [articles]);
  const nextEvents = useNextEvents(econEvents, 5);
  const nextEvent = nextEvents[0];

  return (
    <div className="h-full flex flex-col bg-background text-foreground font-mono">
      <StatusRibbon
        conn={error ? 'off' : loading ? 'delayed' : 'live'}
        latencyMs={latencyMs}
        queueDepth={loading ? 1 : 0}
        t1PerMin={t1PerMin}
        storyCount={privacyMode ? undefined : articles.length}
        fetchedAt={fetchedAt}
      />

      <MediaStrip
        articles={rawArticles}
        onSelect={focusById}
        squawkOpen={squawkOpen}
        onToggleSquawk={() => setSquawkOpen((v) => !v)}
        tvOpen={tvOpen}
        onToggleTv={() => setTvOpen((v) => !v)}
        nextEvent={nextEvent}
        onOpenCal={() => window.dispatchEvent(new CustomEvent('lovable:econ-cal-open'))}
      />

      <ScopeBar
        scope={scope}
        value={value}
        topic={topic}
        timespan={timespan}
        tone={tone}
        pinOnly={pinOnly}
        sort={sort}
        source={source}
        onScope={(s) => handleScopeChange(s, s === 'global' ? '' : value)}
        onValue={setValue}
        onTopic={setTopic}
        onTimespan={setTimespan}
        onTone={setTone}
        onPinToggle={() => setPinOnly((v) => !v)}
        onSortToggle={() => setSort(sort === 'velocity' ? 'recent' : 'velocity')}
        onSource={setSource}
        onOpenFilters={() => setFiltersOpen(true)}
      />

      {/* Sub-status: scope label + density + refresh */}
      <div className="flex items-center gap-2 border-b border-border px-2 py-0.5 bg-background flex-shrink-0 text-[9px] font-mono">
        <span className="text-accent uppercase font-bold tracking-wider">{scopeLabel}</span>
        {topic && (<><span className="text-border">│</span><span className="text-accent uppercase">{topic}</span></>)}
        {pinOnly && (<><span className="text-border">│</span><span className="text-accent uppercase">PIN</span></>)}
        {sort === 'velocity' && (<><span className="text-border">│</span><span className="text-accent uppercase">HOT</span></>)}
        <span className="text-border">│</span>
        <span className="text-muted-foreground">{privacyMode ? '•••' : articles.length} stories</span>
        <span className="text-border">│</span>
        <span className="text-muted-foreground">{timespan}</span>
        {loading && <span className="text-accent ml-1 animate-pulse">↻ updating</span>}
        {error && <span className="text-negative ml-1">! {error}</span>}
        <div className="ml-auto flex items-center gap-2">
          <button
            onClick={cycleDensity}
            className="uppercase font-bold text-muted-foreground hover:text-accent flex items-center gap-1 px-1 border border-border tracking-wider"
            title="Cycle density (T)"
          >
            {density === 'comfort' ? <Rows3 className="w-3 h-3" /> : density === 'compact' ? <Rows className="w-3 h-3" /> : density === 'tape' ? <Minus className="w-3 h-3" /> : <span className="text-[8px]">BB</span>}
            {density}
          </button>
          {fetchedAt > 0 && (
            <span className="text-muted-foreground">fetched {new Date(fetchedAt).toLocaleTimeString()}</span>
          )}
          <button onClick={refetch} className="uppercase font-bold text-accent hover:underline px-1 tracking-wider">Refresh</button>
        </div>
      </div>

      <PinRail pins={pins} articles={rawArticles} onSelect={focusById} onRemove={removePin} />
      <DailyWrapBanner headlines={rawArticles} redact={privacyMode} />

      {/* MAIN: Bloomberg 2-col split */}
      <div className="flex-1 min-h-0 flex flex-row overflow-hidden">

        {/* LEFT COLUMN: tape (55%) */}
        <div className="flex flex-col min-h-0 border-r border-border" style={{ flex: '0 0 55%', maxWidth: '55%' }}>

          {/* TOP STORIES — highlighted rows, not cards */}
          {featured.length > 0 && (
            <div className="flex-shrink-0 border-b border-border">
              <div className="flex items-center gap-2 px-2 py-0.5 bg-surface-deep border-b border-border">
                <span className="text-[9px] font-mono uppercase font-bold tracking-wider text-accent">▌ TOP</span>
                <span className="text-[9px] font-mono text-muted-foreground">T1 · {featured.length}</span>
              </div>
              {featured.map((a, i) => (
                <FeaturedRow
                  key={a.id}
                  article={a}
                  rank={i + 1}
                  active={i === activeIndex}
                  pinned={isPinned(a.id)}
                  onClick={() => setActiveIndex(i)}
                  onTogglePin={() => togglePin(a.id)}
                  redact={privacyMode}
                />
              ))}
            </div>
          )}

          {/* CALENDAR strip — next econ event */}
          <CalendarRail next={nextEvent} upcoming={nextEvents} />

          {/* TAPE header */}
          <div className="flex items-center gap-2 px-2 py-0.5 border-b border-border bg-surface-deep flex-shrink-0">
            <span className="text-[9px] font-mono uppercase font-bold tracking-wider text-accent">▌ TAPE</span>
            <span className="text-[9px] font-mono text-muted-foreground">{tape.length} stories</span>
          </div>

          {/* Scrollable tape */}
          <div className="flex-1 overflow-y-auto min-h-0">
            {loading && articles.length === 0 ? (
              <div className="p-2 space-y-px">
                {Array.from({ length: 20 }).map((_, i) => (
                  <div key={i} className="h-4 bg-surface-elevated/40 animate-pulse" />
                ))}
              </div>
            ) : articles.length === 0 ? (
              <div className="flex flex-col items-center justify-center gap-2 text-muted-foreground p-8">
                <Globe2 className="w-6 h-6 opacity-40" />
                <div className="text-[11px] font-mono">No headlines for this scope.</div>
                <button
                  onClick={() => { setPinOnly(false); setTopic(''); handleScopeChange('global', ''); }}
                  className="text-[10px] uppercase font-bold text-accent hover:underline"
                >Broaden to global</button>
              </div>
            ) : (
              <TapeFeed
                articles={tape}
                density={density}
                activeId={active?.id}
                pins={pins}
                redact={privacyMode}
                onSelect={(i) => setActiveIndex(i + featured.length)}
                onTogglePin={togglePin}
              />
            )}
          </div>

          {/* Tone sparkline — fixed at bottom of left col */}
          <div className="border-t border-border bg-surface-deep flex-shrink-0">
            <div className="px-2 py-0.5 text-[9px] font-mono uppercase text-accent font-bold border-b border-border tracking-wider">
              Tone · {scopeLabel} · {timespan}
            </div>
            <ToneSparkline data={toneSeries} height={44} />
          </div>
        </div>

        {/* RIGHT COLUMN: inline detail panel (45%) */}
        <NewsDetailPanel
          className="flex-1 min-h-0"
          active={active}
          articles={articles}
          rawArticles={rawArticles}
          geoEvents={geoEvents}
          scope={scope}
          value={value}
          briefHeadlines={briefHeadlines}
          autoBrief={autoBrief}
          redact={privacyMode}
          isPinned={isPinned}
          onTogglePin={togglePin}
          onFocusById={focusById}
          onScopeChange={handleScopeChange}
          initialTab={rightPane as 'detail' | 'thesis' | 'deep' | 'map' | 'heat'}
        />
      </div>

      <FunctionKeyBar
        keys={fkeys.map((k) =>
          k.key === 'F2'
            ? { ...k, label: 'DETAIL', onClick: () => setRightPane('detail') }
            : k.key === 'F6'
            ? { ...k, label: 'FILTERS', onClick: () => setFiltersOpen((v) => !v) }
            : k,
        )}
      />

      <SquawkPlayer articles={rawArticles} open={squawkOpen} onClose={() => setSquawkOpen(false)} />
      <TVClipDrawer open={tvOpen} onClose={() => setTvOpen(false)} />

      <FiltersDrawer
        open={filtersOpen}
        onClose={() => setFiltersOpen(false)}
        scope={scope}
        value={value}
        topic={topic}
        timespan={timespan}
        tone={tone}
        source={source}
        onScope={(s, v) => handleScopeChange(s, v ?? (s === 'global' ? '' : value))}
        onValue={setValue}
        onTopic={setTopic}
        onTimespan={setTimespan}
        onTone={setTone}
        onSource={setSource}
      />

      <DetailDrawer
        open={false}
        onClose={() => {}}
        active={active}
        articles={articles}
        rawArticles={rawArticles}
        geoEvents={geoEvents}
        scope={scope}
        value={value}
        briefHeadlines={briefHeadlines}
        autoBrief={autoBrief}
        redact={privacyMode}
        isPinned={isPinned}
        onTogglePin={togglePin}
        onFocusById={focusById}
        onScopeChange={handleScopeChange}
        initialTab="detail"
      />
    </div>
  );
}
