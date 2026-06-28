import { useState, useEffect, useCallback } from 'react';
import { RefreshCw, TrendingUp } from 'lucide-react';
import { apiGet } from '@/lib/api';

interface IvData {
  ticker: string;
  atmIv: number;
  ivRank: number;
  ivPctl: number;
  rv20: number;
  skew25d: number;
  termSlope: number;
}

interface GexData {
  ticker: string;
  netGex: number;
  callGex: number;
  putGex: number;
  largestCallWall: number;
  largestPutWall: number;
}

interface RegimeData {
  ticker: string;
  spot: number;
  zeroG: number;
  distToZeroPct: number;
  netGex: number;
  regime: 'long-gamma' | 'short-gamma';
  interpretation: string;
  flipProb: number;
}

interface SnapshotData {
  iv: IvData;
  gex: GexData;
  regime: RegimeData;
}

interface Props {
  ticker: string;
}

function fmtGex(n: number): string {
  const abs = Math.abs(n);
  if (abs >= 1e9) return `${n >= 0 ? '+' : ''}${(n / 1e9).toFixed(1)}B`;
  if (abs >= 1e6) return `${n >= 0 ? '+' : ''}${(n / 1e6).toFixed(0)}M`;
  return `${n >= 0 ? '+' : ''}${n}`;
}

function StatRow({ label, value, sub }: { label: string; value: React.ReactNode; sub?: string }) {
  return (
    <div className="flex items-center justify-between py-1 border-b border-border/30">
      <span className="text-[9px] text-muted-foreground">{label}</span>
      <div className="text-right">
        <span className="text-[10px] font-semibold tabular-nums text-foreground">{value}</span>
        {sub && <span className="ml-1 text-[9px] text-muted-foreground">{sub}</span>}
      </div>
    </div>
  );
}

function RankBar({ value, label }: { value: number; label: string }) {
  const color = value > 75 ? 'bg-positive' : value > 25 ? 'bg-accent' : 'bg-negative';
  return (
    <div className="flex items-center gap-2">
      <div className="flex-1 h-1 bg-surface-elevated rounded-full overflow-hidden">
        <div className={`h-full rounded-full ${color} transition-all`} style={{ width: `${value}%` }} />
      </div>
      <span className="text-[9px] text-muted-foreground w-8 text-right">{label}</span>
    </div>
  );
}

export default function OptsTab({ ticker }: Props) {
  const [data, setData] = useState<SnapshotData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const load = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const result = await apiGet<SnapshotData>(`/api/market/options/snapshot/${encodeURIComponent(ticker)}`);
      setData(result);
    } catch (e: any) {
      setError(e.message ?? 'Failed to load options data');
    } finally {
      setLoading(false);
    }
  }, [ticker]);

  useEffect(() => { load(); }, [load]);

  const regimeBadgeClass = data?.regime.regime === 'long-gamma'
    ? 'bg-positive/20 text-positive border-positive/30'
    : 'bg-negative/20 text-negative border-negative/30';

  return (
    <div className="p-4 overflow-y-auto h-full font-mono text-xs">
      <div className="flex items-center gap-2 border-b border-accent/30 pb-1 mb-3">
        <TrendingUp size={11} className="text-accent" />
        <span className="text-[9px] text-accent font-bold uppercase tracking-widest">Options Snapshot</span>
        <span className="text-[9px] text-muted-foreground">— {ticker}</span>
        <button
          onClick={load}
          disabled={loading}
          className="ml-auto text-muted-foreground hover:text-accent transition-colors disabled:opacity-40"
          title="Refresh"
        >
          <RefreshCw size={10} className={loading ? 'animate-spin' : ''} />
        </button>
      </div>

      {loading && (
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          {[...Array(3)].map((_, i) => (
            <div key={i} className="space-y-2 animate-pulse">
              <div className="h-3 w-24 bg-surface-elevated rounded" />
              {[...Array(5)].map((_, j) => (
                <div key={j} className="h-4 bg-surface-elevated rounded" />
              ))}
            </div>
          ))}
        </div>
      )}

      {!loading && error && (
        <div className="flex flex-col items-center justify-center h-40 gap-2 text-muted-foreground text-[10px]">
          <span>Options data unavailable</span>
          <button onClick={load} className="text-accent hover:underline">Retry</button>
        </div>
      )}

      {!loading && !error && data && (
        <div className="grid grid-cols-1 md:grid-cols-3 gap-5">

          {/* Panel 1 — IV Metrics */}
          <div>
            <div className="text-[9px] text-muted-foreground font-bold uppercase tracking-widest mb-2">IV Metrics</div>
            <StatRow label="ATM IV" value={`${data.iv.atmIv.toFixed(1)}%`} />
            <div className="py-1 border-b border-border/30">
              <div className="flex items-center justify-between mb-1">
                <span className="text-[9px] text-muted-foreground">IV Rank</span>
                <span className="text-[10px] font-semibold tabular-nums">{data.iv.ivRank} / 100</span>
              </div>
              <RankBar value={data.iv.ivRank} label="" />
            </div>
            <div className="py-1 border-b border-border/30">
              <div className="flex items-center justify-between mb-1">
                <span className="text-[9px] text-muted-foreground">IV Percentile</span>
                <span className="text-[10px] font-semibold tabular-nums">{data.iv.ivPctl}th</span>
              </div>
              <RankBar value={data.iv.ivPctl} label="" />
            </div>
            <StatRow label="HV 20" value={`${data.iv.rv20.toFixed(1)}%`} />
            <StatRow
              label="IV vs HV"
              value={
                <span className={(data.iv.atmIv - data.iv.rv20) >= 0 ? 'text-positive' : 'text-negative'}>
                  {(data.iv.atmIv - data.iv.rv20) >= 0 ? '+' : ''}{(data.iv.atmIv - data.iv.rv20).toFixed(1)}%
                </span>
              }
              sub="premium"
            />
            <StatRow
              label="Skew 25Δ"
              value={`${data.iv.skew25d >= 0 ? '+' : ''}${data.iv.skew25d.toFixed(2)}`}
              sub={data.iv.skew25d > 0 ? 'puts bid' : data.iv.skew25d < 0 ? 'calls bid' : 'flat'}
            />
            <StatRow
              label="Term Slope"
              value={`${data.iv.termSlope >= 0 ? '+' : ''}${data.iv.termSlope.toFixed(2)}`}
              sub={data.iv.termSlope > 0 ? 'contango' : 'backwardation'}
            />
          </div>

          {/* Panel 2 — GEX Regime */}
          <div>
            <div className="text-[9px] text-muted-foreground font-bold uppercase tracking-widest mb-2">GEX Regime</div>

            <div className="mb-3">
              <span className={`inline-block px-2 py-1 text-[9px] font-bold border rounded tracking-wider uppercase ${regimeBadgeClass}`}>
                {data.regime.regime === 'long-gamma' ? 'Long Gamma' : 'Short Gamma'}
              </span>
            </div>

            <p className="text-[9px] text-muted-foreground leading-relaxed mb-3">
              {data.regime.interpretation}
            </p>

            <div className="py-1 border-b border-border/30">
              <div className="flex items-center justify-between mb-1">
                <span className="text-[9px] text-muted-foreground">Flip Probability</span>
                <span className="text-[10px] font-semibold tabular-nums">{data.regime.flipProb}%</span>
              </div>
              <RankBar value={data.regime.flipProb} label="" />
            </div>

            <StatRow label="Spot" value={`$${data.regime.spot.toFixed(2)}`} />
            <StatRow
              label="Zero-Gamma"
              value={`$${data.regime.zeroG.toFixed(2)}`}
              sub={`${data.regime.distToZeroPct >= 0 ? '+' : ''}${data.regime.distToZeroPct.toFixed(1)}%`}
            />
            <StatRow
              label="Net GEX"
              value={
                <span className={data.regime.netGex >= 0 ? 'text-positive' : 'text-negative'}>
                  {fmtGex(data.regime.netGex)}
                </span>
              }
            />
          </div>

          {/* Panel 3 — Gamma Walls */}
          <div>
            <div className="text-[9px] text-muted-foreground font-bold uppercase tracking-widest mb-2">Gamma Walls</div>

            {/* Visual range bar */}
            <div className="mb-4">
              {(() => {
                const lo = data.gex.largestPutWall;
                const hi = data.gex.largestCallWall;
                const spot = data.regime.spot;
                const range = hi - lo || 1;
                const spotPct = Math.min(Math.max(((spot - lo) / range) * 100, 0), 100);
                return (
                  <div className="relative">
                    <div className="h-2 bg-surface-elevated rounded-full overflow-visible relative">
                      <div className="absolute inset-y-0 left-0 bg-negative/30 rounded-l-full" style={{ width: `${spotPct}%` }} />
                      <div className="absolute inset-y-0 right-0 bg-positive/30 rounded-r-full" style={{ width: `${100 - spotPct}%` }} />
                      <div
                        className="absolute top-1/2 -translate-y-1/2 w-2 h-4 bg-accent rounded-sm border border-accent/50"
                        style={{ left: `${spotPct}%`, transform: 'translate(-50%, -50%)' }}
                        title={`Spot: $${spot.toFixed(2)}`}
                      />
                    </div>
                    <div className="flex justify-between mt-1">
                      <span className="text-[8px] text-negative">${lo}</span>
                      <span className="text-[8px] text-muted-foreground">SPOT ${spot.toFixed(0)}</span>
                      <span className="text-[8px] text-positive">${hi}</span>
                    </div>
                  </div>
                );
              })()}
            </div>

            <StatRow
              label="Call Wall (resistance)"
              value={<span className="text-positive">${data.gex.largestCallWall}</span>}
            />
            <StatRow
              label="Put Wall (support)"
              value={<span className="text-negative">${data.gex.largestPutWall}</span>}
            />
            <StatRow
              label="Call GEX"
              value={<span className="text-positive">{fmtGex(data.gex.callGex)}</span>}
            />
            <StatRow
              label="Put GEX"
              value={<span className="text-negative">{fmtGex(data.gex.putGex)}</span>}
            />
            <StatRow
              label="Net GEX"
              value={
                <span className={data.gex.netGex >= 0 ? 'text-positive' : 'text-negative'}>
                  {fmtGex(data.gex.netGex)}
                </span>
              }
            />
          </div>
        </div>
      )}

      {!loading && !error && data && (
        <p className="mt-4 text-[9px] text-muted-foreground">
          GEX data is model-derived · IV metrics are indicative · Not financial advice
        </p>
      )}
    </div>
  );
}
