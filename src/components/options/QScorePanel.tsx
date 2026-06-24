import { TrendingUp, BarChart3, Waves, Calendar } from "lucide-react";

const scores = [
  { label: "Momentum", score: 78, trend: "Bullish", icon: TrendingUp, detail: "Strong upward momentum across timeframes" },
  { label: "Volatility", score: 42, trend: "Low Vol", icon: Waves, detail: "IV below historical median, compression regime" },
  { label: "Positioning", score: 85, trend: "Bullish", icon: BarChart3, detail: "Net positive GEX, dealer long gamma above spot" },
  { label: "Seasonality", score: 62, trend: "Neutral", icon: Calendar, detail: "Mixed seasonal patterns for this period" },
];

const getScoreColor = (s: number) => s >= 70 ? "text-up" : s >= 40 ? "text-neutral-val" : "text-down";
const getBarColor = (s: number) => s >= 70 ? "bg-chart-up" : s >= 40 ? "bg-chart-neutral" : "bg-chart-down";
const getTrendBg = (t: string) => t === "Bullish" ? "bg-chart-up/10 text-up" : t === "Low Vol" || t === "Neutral" ? "bg-chart-neutral/10 text-neutral-val" : "bg-chart-down/10 text-down";

interface Props { ticker?: string; redact?: boolean }

const QScorePanel = ({ ticker = "SPY", redact = false }: Props) => {
  const r = (v: number | string) => redact ? "••" : String(v);
  return (
    <div className="card-terminal p-2">
      <div className="mb-4">
        <h3 className="text-sm font-mono font-bold text-foreground uppercase tracking-wider">Q-Scores — {ticker}</h3>
        <p className="text-[10px] font-mono text-muted-foreground mt-0.5">Composite quant scores across dimensions</p>
      </div>
      <div className="space-y-3">
        {scores.map((s) => (
          <div key={s.label} className="flex items-center gap-3">
            <div className="w-7 h-7 bg-secondary flex items-center justify-center flex-shrink-0">
              <s.icon className="w-3.5 h-3.5 text-muted-foreground" />
            </div>
            <div className="flex-1 min-w-0">
              <div className="flex items-center justify-between mb-1">
                <span className="text-[11px] font-mono font-bold text-foreground">{s.label}</span>
                <div className="flex items-center gap-2">
                  <span className={`text-[10px] px-1.5 py-0.5 font-mono font-bold ${getTrendBg(s.trend)}`}>{s.trend}</span>
                  <span className={`text-sm font-mono font-bold tabular-nums ${getScoreColor(s.score)}`}>{r(s.score)}</span>
                </div>
              </div>
              <div className="w-full h-1 bg-secondary">
                <div className={`h-full transition-all ${getBarColor(s.score)}`} style={{ width: redact ? "0%" : `${s.score}%` }} />
              </div>
              <p className="text-[10px] font-mono text-muted-foreground mt-1">{s.detail}</p>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};

export default QScorePanel;
