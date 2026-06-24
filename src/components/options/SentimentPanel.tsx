// Put/Call Sentiment + IV Crush watch panels.
import { Activity, AlertTriangle, TrendingDown, TrendingUp } from "lucide-react";

const pcrHistory = [
  { day: "T-9", pcr: 0.78 }, { day: "T-8", pcr: 0.82 }, { day: "T-7", pcr: 0.91 },
  { day: "T-6", pcr: 0.88 }, { day: "T-5", pcr: 0.95 }, { day: "T-4", pcr: 1.02 },
  { day: "T-3", pcr: 0.98 }, { day: "T-2", pcr: 1.05 }, { day: "T-1", pcr: 1.12 }, { day: "Now", pcr: 1.18 },
];

const earnings = [
  { ticker: "NVDA", date: "Wed AMC", iv: 78.2, ivRank: 92, expMove: "±8.4%", historicalMove: "±6.2%", crushRisk: "HIGH" },
  { ticker: "TSLA", date: "Thu AMC", iv: 64.5, ivRank: 81, expMove: "±7.1%", historicalMove: "±5.8%", crushRisk: "HIGH" },
  { ticker: "AAPL", date: "Thu AMC", iv: 38.4, ivRank: 64, expMove: "±3.2%", historicalMove: "±2.4%", crushRisk: "MED" },
  { ticker: "MSFT", date: "Tue AMC", iv: 32.1, ivRank: 58, expMove: "±2.8%", historicalMove: "±2.1%", crushRisk: "MED" },
  { ticker: "META", date: "Wed AMC", iv: 52.3, ivRank: 76, expMove: "±5.4%", historicalMove: "±4.1%", crushRisk: "HIGH" },
];

const flowSentiment = {
  bullishCalls: 62,
  bearishPuts: 38,
  vix: 14.2,
  vixDelta: -0.84,
  skewIdx: 138.4,
  skewDelta: 2.1,
};

interface Props { ticker?: string; redact?: boolean }

export default function SentimentPanel({ ticker = "SPY", redact = false }: Props) {
  const r = (s: string | number) => (redact ? "••" : String(s));
  const max = Math.max(...pcrHistory.map((d) => d.pcr));
  const min = Math.min(...pcrHistory.map((d) => d.pcr));
  const range = max - min || 1;

  return (
    <div className="space-y-3">
      {/* Sentiment Gauges */}
      <div className="card-terminal p-2">
        <div className="flex items-center justify-between mb-3">
          <div>
            <h3 className="text-sm font-mono font-bold text-foreground uppercase tracking-wider">Options Sentiment — {ticker}</h3>
            <p className="text-[10px] font-mono text-muted-foreground mt-0.5">Put/Call ratio · VIX · Skew index · Flow bias</p>
          </div>
          <span className="text-[9px] font-mono px-2 py-0.5 border border-down/40 text-down uppercase flex items-center gap-1">
            <AlertTriangle className="w-3 h-3" /> Defensive Tilt
          </span>
        </div>

        <div className="grid grid-cols-2 lg:grid-cols-4 gap-2 mb-4">
          <div className="border border-border bg-surface-elevated p-2">
            <div className="text-muted-foreground text-[9px] uppercase flex items-center gap-1">
              <Activity className="w-3 h-3" /> P/C Ratio
            </div>
            <div className="text-down tabular-nums font-bold text-base">{r("1.18")}</div>
            <div className="text-[9px] text-muted-foreground">10d avg 0.97</div>
          </div>
          <div className="border border-border bg-surface-elevated p-2">
            <div className="text-muted-foreground text-[9px] uppercase">VIX</div>
            <div className="text-up tabular-nums font-bold text-base">{r(flowSentiment.vix.toFixed(2))}</div>
            <div className="text-up text-[9px] tabular-nums">{r(`${flowSentiment.vixDelta.toFixed(2)}`)}</div>
          </div>
          <div className="border border-border bg-surface-elevated p-2">
            <div className="text-muted-foreground text-[9px] uppercase">CBOE Skew</div>
            <div className="text-down tabular-nums font-bold text-base">{r(flowSentiment.skewIdx.toFixed(1))}</div>
            <div className="text-down text-[9px] tabular-nums">+{r(flowSentiment.skewDelta.toFixed(1))}</div>
          </div>
          <div className="border border-border bg-surface-elevated p-2">
            <div className="text-muted-foreground text-[9px] uppercase">Call/Put Flow</div>
            <div className="flex items-center gap-1 mt-0.5">
              <div className="flex-1 h-3 bg-grid-line flex overflow-hidden">
                <div className="h-full bg-chart-up" style={{ width: `${flowSentiment.bullishCalls}%` }} />
                <div className="h-full bg-chart-down" style={{ width: `${flowSentiment.bearishPuts}%` }} />
              </div>
            </div>
            <div className="flex justify-between text-[9px] tabular-nums mt-0.5">
              <span className="text-up">{r(`${flowSentiment.bullishCalls}%C`)}</span>
              <span className="text-down">{r(`${flowSentiment.bearishPuts}%P`)}</span>
            </div>
          </div>
        </div>

        <div>
          <div className="text-[9px] font-mono uppercase text-muted-foreground mb-1">10-Day P/C Ratio</div>
          <div className="flex items-end gap-1 h-16">
            {pcrHistory.map((d, i) => {
              const h = ((d.pcr - min) / range) * 100;
              return (
                <div key={i} className="flex-1 flex flex-col items-center gap-0.5">
                  <div
                    className={`w-full ${d.pcr >= 1 ? "bg-chart-down" : "bg-chart-up"}`}
                    style={{ height: `${Math.max(h, 8)}%` }}
                    title={`${d.day}: ${d.pcr}`}
                  />
                  <span className="text-[8px] text-muted-foreground">{d.day}</span>
                </div>
              );
            })}
          </div>
        </div>
      </div>

      {/* Earnings IV Crush watchlist */}
      <div className="card-terminal p-2">
        <div className="mb-3">
          <h3 className="text-sm font-mono font-bold text-foreground uppercase tracking-wider">Earnings IV Crush Watch</h3>
          <p className="text-[10px] font-mono text-muted-foreground mt-0.5">Names with elevated IV into earnings · expected vs historical move</p>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full text-[10px] font-mono tabular-nums">
            <thead>
              <tr className="text-muted-foreground border-b border-border">
                <th className="text-left py-1.5 px-2">Ticker</th>
                <th className="text-left py-1.5 px-2">Report</th>
                <th className="text-right py-1.5 px-2">IV</th>
                <th className="text-right py-1.5 px-2">IV Rank</th>
                <th className="text-right py-1.5 px-2">Exp Move</th>
                <th className="text-right py-1.5 px-2">Hist Move</th>
                <th className="text-right py-1.5 px-2">Crush Risk</th>
              </tr>
            </thead>
            <tbody>
              {earnings.map((e) => {
                const color = e.crushRisk === "HIGH" ? "text-down" : e.crushRisk === "MED" ? "text-neutral-val" : "text-up";
                return (
                  <tr key={e.ticker} className="border-b border-grid-line hover:bg-surface-elevated">
                    <td className="py-1.5 px-2 font-bold text-accent">{e.ticker}</td>
                    <td className="py-1.5 px-2 text-muted-foreground">{e.date}</td>
                    <td className="text-right py-1.5 px-2 text-foreground">{r(`${e.iv.toFixed(1)}%`)}</td>
                    <td className="text-right py-1.5 px-2 text-foreground">{r(e.ivRank)}</td>
                    <td className="text-right py-1.5 px-2 text-foreground">{r(e.expMove)}</td>
                    <td className="text-right py-1.5 px-2 text-muted-foreground">{r(e.historicalMove)}</td>
                    <td className={`text-right py-1.5 px-2 font-bold ${color}`}>{e.crushRisk}</td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
