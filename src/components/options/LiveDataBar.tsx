interface Props {
  ticker: string;
  loading: boolean;
  error: string | null;
  loadedTicker: string | null;
  ts: number | null;
  isLive: boolean;
  onLoad: () => void;
}

function fmtTs(ts: number) {
  return new Date(ts).toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit', second: '2-digit', hour12: false });
}

export default function LiveDataBar({ ticker, loading, error, loadedTicker, ts, isLive, onLoad }: Props) {
  const isLoaded = loadedTicker === ticker && ts != null;
  const isStale = loadedTicker != null && loadedTicker !== ticker;

  let badge: React.ReactNode;
  let message: React.ReactNode;
  let button: React.ReactNode = null;

  if (!isLive) {
    badge = <span className="flex items-center gap-1 text-[8px] font-mono text-muted-foreground font-bold"><span className="w-1.5 h-1.5 rounded-full bg-muted-foreground/40" />MOCK</span>;
    message = <span className="text-[8px] font-mono text-muted-foreground/60">Bridge offline · configure in Options settings</span>;
  } else if (loading) {
    badge = <span className="flex items-center gap-1 text-[8px] font-mono text-accent font-bold"><span className="w-1.5 h-1.5 rounded-full bg-accent animate-pulse" />LIVE</span>;
    message = <span className="text-[8px] font-mono text-muted-foreground">Fetching {ticker}…</span>;
    button = <span className="px-2 py-0.5 text-[8px] font-mono border border-border text-muted-foreground/50">LOADING…</span>;
  } else if (error) {
    badge = <span className="flex items-center gap-1 text-[8px] font-mono text-negative font-bold"><span className="w-1.5 h-1.5 rounded-full bg-negative" />ERR</span>;
    message = <span className="text-[8px] font-mono text-negative/70 truncate max-w-[240px]" title={error}>{error}</span>;
    button = (
      <button onClick={onLoad} className="px-2 py-0.5 text-[8px] font-mono border border-negative/40 text-negative hover:bg-negative/10 transition-colors">
        RETRY
      </button>
    );
  } else if (isLoaded) {
    badge = <span className="flex items-center gap-1 text-[8px] font-mono text-positive font-bold"><span className="w-1.5 h-1.5 rounded-full bg-positive" />LIVE</span>;
    message = <span className="text-[8px] font-mono text-muted-foreground">{loadedTicker} · {fmtTs(ts!)}</span>;
    button = (
      <button onClick={onLoad} className="px-2 py-0.5 text-[8px] font-mono border border-border text-muted-foreground hover:border-accent hover:text-accent transition-colors">
        RELOAD
      </button>
    );
  } else {
    badge = <span className="flex items-center gap-1 text-[8px] font-mono text-accent font-bold"><span className="w-1.5 h-1.5 rounded-full bg-accent" />LIVE</span>;
    message = (
      <span className="text-[8px] font-mono text-muted-foreground">
        {isStale ? <span className="text-[hsl(45,100%,60%)]">Showing {loadedTicker} · </span> : null}
        Click LOAD for {ticker}
      </span>
    );
    button = (
      <button onClick={onLoad} className="px-2 py-0.5 text-[8px] font-mono border border-accent text-accent bg-accent/10 hover:bg-accent/20 transition-colors font-bold">
        LOAD
      </button>
    );
  }

  return (
    <div className="flex items-center gap-2 px-2 py-1 bg-surface-deep border border-border/60 text-[8px] font-mono">
      {badge}
      <span className="text-muted-foreground/30">|</span>
      <div className="flex-1 min-w-0">{message}</div>
      {button}
    </div>
  );
}
