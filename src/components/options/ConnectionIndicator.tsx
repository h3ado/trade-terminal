// Compact LIVE/MOCK indicator + connection popover, restyled to the
// Bloomberg shell tokens (deep-black surfaces, JetBrains Mono, 0 radius).
import { useState } from "react";
import { useBridge } from "@/contexts/BridgeContext";

const ConnectionIndicator = () => {
  const { isLive, checking, error, bridgeUrl, connect, disconnect, status } = useBridge();
  const [open, setOpen] = useState(false);
  const [urlInput, setUrlInput] = useState(bridgeUrl);

  const handleConnect = async () => { await connect(urlInput); };

  return (
    <div className="relative">
      <button
        onClick={() => setOpen(!open)}
        className="flex items-center gap-1.5 px-1.5 py-0.5 border border-border bg-background hover:border-accent transition-colors font-mono"
        title={isLive ? "Connected to TWS" : "Using mock data"}
      >
        <span
          className="w-1.5 h-1.5"
          style={{
            background: checking ? 'hsl(var(--accent))' : isLive ? 'hsl(var(--positive))' : 'hsl(var(--negative))',
            boxShadow: isLive ? '0 0 6px hsl(var(--positive))' : 'none',
          }}
        />
        <span className={`text-[9px] font-bold uppercase tracking-wider ${isLive ? 'text-positive' : 'text-muted-foreground'}`}>
          {checking ? '...' : isLive ? 'LIVE' : 'MOCK'}
        </span>
      </button>

      {open && (
        <div className="absolute right-0 top-full mt-1 z-50 w-72 bg-surface-deep border border-accent font-mono shadow-2xl">
          <div className="px-2 py-1 bg-background border-b border-accent text-[10px] font-bold uppercase tracking-wider text-accent">
            TWS Bridge Connection
          </div>
          <div className="p-2 space-y-2">
            <div className="flex items-center justify-between">
              <span className="text-[10px] text-muted-foreground uppercase">Status</span>
              <span className={`text-[10px] font-bold ${isLive ? 'text-positive' : 'text-negative'}`}>
                {isLive ? 'CONNECTED' : 'DISCONNECTED'}
              </span>
            </div>
            {status && (
              <div className="flex items-center justify-between">
                <span className="text-[10px] text-muted-foreground uppercase">TWS</span>
                <span className="text-[10px] text-foreground">{status.tws_host}:{status.tws_port}</span>
              </div>
            )}
            {error && (
              <div className="text-[9px] px-2 py-1 border border-negative/40 bg-negative/10 text-negative">
                {error}
              </div>
            )}
            <div>
              <label className="text-[9px] block mb-1 text-muted-foreground uppercase tracking-wider">Bridge URL</label>
              <input
                value={urlInput}
                onChange={(e) => setUrlInput(e.target.value)}
                onKeyDown={(e) => e.key === 'Enter' && handleConnect()}
                className="w-full text-[11px] px-2 py-1 bg-background border border-border text-accent font-mono focus:outline-none focus:border-accent"
                placeholder="http://localhost:5555"
              />
            </div>
            <div className="flex gap-1">
              {!isLive ? (
                <button
                  onClick={handleConnect}
                  disabled={checking}
                  className={`flex-1 text-[10px] font-bold py-1 border uppercase tracking-wider transition-colors ${checking ? 'border-border text-muted-foreground' : 'border-positive bg-positive text-background'}`}
                >
                  {checking ? 'CONNECTING...' : 'CONNECT'}
                </button>
              ) : (
                <button onClick={disconnect} className="flex-1 text-[10px] font-bold py-1 border border-negative text-negative uppercase tracking-wider">
                  DISCONNECT
                </button>
              )}
              <button onClick={() => setOpen(false)} className="text-[10px] px-2 py-1 border border-border text-muted-foreground uppercase tracking-wider hover:text-foreground">CLOSE</button>
            </div>
            <p className="text-[8px] leading-relaxed text-muted-foreground">
              Run a local bridge: <code className="text-accent">python server.py</code> with TWS / IB Gateway open and API enabled.
            </p>
          </div>
        </div>
      )}
    </div>
  );
};

export default ConnectionIndicator;
