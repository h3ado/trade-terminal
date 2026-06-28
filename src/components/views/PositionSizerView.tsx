import { useMemo, useState } from 'react';
import ViewHeader from '@/components/ViewHeader';
import { usePrivacy } from '@/contexts/PrivacyContext';
import { useTrades } from '@/contexts/TradeContext';
import { calcWinRate, calcAvgWin, calcAvgLoss } from '@/types/trade';

type Method = 'fixed' | 'kelly' | 'pct';

const METHOD_LABELS: Record<Method, string> = {
  fixed:  'Fixed Dollar Risk',
  kelly:  'Kelly Criterion',
  pct:    'Fixed % Risk',
};

function fmt(n: number, d = 2) {
  return n.toLocaleString('en-US', { minimumFractionDigits: d, maximumFractionDigits: d });
}

function riskOfRuin(winRate: number, avgWin: number, avgLoss: number, riskPct: number, trials = 100): number {
  if (avgLoss === 0 || winRate <= 0 || winRate >= 1) return 0;
  const r = avgWin / avgLoss;
  const p = winRate;
  const q = 1 - p;
  // Simplified formula: (q/p)^(bankroll/risk) approximation
  const edge = p * r - q;
  if (edge <= 0) return 1;
  const ratio = q / p;
  return Math.min(1, Math.pow(ratio, trials * riskPct / 100));
}

function RiskRow({ label, value, sub, tone }: { label: string; value: string; sub?: string; tone?: string }) {
  return (
    <div className="flex items-baseline justify-between py-1.5 border-b border-border/40">
      <span className="text-[9px] font-mono text-muted-foreground uppercase tracking-wider">{label}</span>
      <div className="text-right">
        <span className={`text-[13px] font-mono font-bold ${tone ?? 'text-foreground'}`}>{value}</span>
        {sub && <span className="ml-2 text-[9px] font-mono text-muted-foreground">{sub}</span>}
      </div>
    </div>
  );
}

export default function PositionSizerView() {
  const { activeAccount } = usePrivacy();
  const { trades } = useTrades();

  const balance = activeAccount?.balance ?? 0;

  const [method, setMethod] = useState<Method>('pct');
  const [riskPct, setRiskPct] = useState(1);
  const [fixedRisk, setFixedRisk] = useState(500);
  const [entry, setEntry] = useState(100);
  const [stop, setStop] = useState(97);
  const [type, setType] = useState<'equity' | 'options' | 'futures'>('equity');
  const [contractMult, setContractMult] = useState(100);

  const stats = useMemo(() => {
    const wr = calcWinRate(trades) / 100;
    const avgW = calcAvgWin(trades);
    const avgL = Math.abs(calcAvgLoss(trades));
    const r = avgL > 0 ? avgW / avgL : 1;
    const kelly = avgL > 0 ? Math.max(0, wr - (1 - wr) / r) : 0;
    return { wr, avgW, avgL, r, kelly };
  }, [trades]);

  const stopDist = Math.abs(entry - stop);
  const stopDistPct = entry > 0 ? (stopDist / entry) * 100 : 0;

  const dollarRisk = useMemo(() => {
    if (method === 'fixed') return fixedRisk;
    if (method === 'pct') return balance * riskPct / 100;
    return balance * Math.min(stats.kelly / 2, 0.05); // half-Kelly, capped 5%
  }, [method, fixedRisk, riskPct, balance, stats.kelly]);

  const shares = useMemo(() => {
    if (stopDist <= 0 || dollarRisk <= 0) return 0;
    if (type === 'options') return Math.floor(dollarRisk / (stopDist * contractMult));
    return Math.floor(dollarRisk / stopDist);
  }, [stopDist, dollarRisk, type, contractMult]);

  const positionValue = shares * entry * (type === 'options' ? contractMult : 1);
  const accountPct = balance > 0 ? (dollarRisk / balance) * 100 : 0;
  const ror = riskOfRuin(stats.wr, stats.avgW, stats.avgL, accountPct);
  const kellyFull = stats.kelly * 100;
  const kellySafe = kellyFull / 2;

  return (
    <div className="flex flex-col h-full">
      <ViewHeader title="POSIZ · Position Sizer" subtitle={`Account: ${activeAccount?.name ?? '—'}`} />
      <div className="flex-1 overflow-auto grid grid-cols-1 md:grid-cols-2 gap-0 divide-y md:divide-y-0 md:divide-x divide-border">

        {/* ── Inputs ── */}
        <div className="p-4 space-y-4">
          <div className="text-[9px] font-mono text-muted-foreground uppercase tracking-widest">Parameters</div>

          <div className="space-y-2">
            <label className="text-[9px] font-mono text-muted-foreground uppercase">Risk Method</label>
            <div className="flex gap-1">
              {(['pct', 'fixed', 'kelly'] as Method[]).map(m => (
                <button key={m} onClick={() => setMethod(m)}
                  className={`px-2 py-1 text-[9px] font-mono font-bold border ${method === m ? 'border-accent text-accent bg-accent/10' : 'border-border text-muted-foreground hover:bg-surface-elevated'}`}>
                  {m === 'pct' ? '% RISK' : m === 'fixed' ? 'FIXED $' : 'KELLY'}
                </button>
              ))}
            </div>
          </div>

          {method === 'pct' && (
            <div className="space-y-1">
              <label className="text-[9px] font-mono text-muted-foreground uppercase">Risk % per Trade</label>
              <div className="flex items-center gap-2">
                <input type="range" min={0.1} max={5} step={0.1} value={riskPct}
                  onChange={e => setRiskPct(parseFloat(e.target.value))}
                  className="flex-1 accent-accent" />
                <span className="text-[11px] font-mono font-bold text-accent w-10 text-right">{riskPct.toFixed(1)}%</span>
              </div>
            </div>
          )}

          {method === 'fixed' && (
            <div className="space-y-1">
              <label className="text-[9px] font-mono text-muted-foreground uppercase">Fixed Dollar Risk</label>
              <div className="flex items-center gap-2">
                <span className="text-[10px] font-mono text-muted-foreground">$</span>
                <input type="number" value={fixedRisk} onChange={e => setFixedRisk(Math.max(1, parseFloat(e.target.value) || 0))}
                  className="flex-1 bg-surface-deep border border-border px-2 py-1 text-[11px] font-mono text-foreground focus:outline-none focus:border-accent" />
              </div>
            </div>
          )}

          {method === 'kelly' && (
            <div className="space-y-1 text-[9px] font-mono text-muted-foreground">
              <div>Full Kelly: <span className="text-accent font-bold">{kellyFull.toFixed(1)}%</span></div>
              <div>Half Kelly (used): <span className="text-foreground font-bold">{kellySafe.toFixed(1)}%</span></div>
              {trades.length < 10 && <div className="text-[hsl(45,100%,60%)]">⚠ &lt;10 trades — Kelly unreliable</div>}
            </div>
          )}

          <div className="space-y-1">
            <label className="text-[9px] font-mono text-muted-foreground uppercase">Instrument</label>
            <div className="flex gap-1">
              {(['equity', 'options', 'futures'] as const).map(t => (
                <button key={t} onClick={() => setType(t)}
                  className={`px-2 py-1 text-[9px] font-mono font-bold border ${type === t ? 'border-accent text-accent bg-accent/10' : 'border-border text-muted-foreground hover:bg-surface-elevated'}`}>
                  {t.toUpperCase()}
                </button>
              ))}
            </div>
          </div>

          {type !== 'equity' && (
            <div className="space-y-1">
              <label className="text-[9px] font-mono text-muted-foreground uppercase">
                {type === 'options' ? 'Contract Multiplier' : 'Contract Size'}
              </label>
              <input type="number" value={contractMult} onChange={e => setContractMult(Math.max(1, parseInt(e.target.value) || 1))}
                className="w-full bg-surface-deep border border-border px-2 py-1 text-[11px] font-mono text-foreground focus:outline-none focus:border-accent" />
            </div>
          )}

          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-1">
              <label className="text-[9px] font-mono text-muted-foreground uppercase">Entry Price</label>
              <input type="number" value={entry} step={0.01} onChange={e => setEntry(parseFloat(e.target.value) || 0)}
                className="w-full bg-surface-deep border border-border px-2 py-1 text-[11px] font-mono text-foreground focus:outline-none focus:border-accent" />
            </div>
            <div className="space-y-1">
              <label className="text-[9px] font-mono text-muted-foreground uppercase">Stop Price</label>
              <input type="number" value={stop} step={0.01} onChange={e => setStop(parseFloat(e.target.value) || 0)}
                className="w-full bg-surface-deep border border-border px-2 py-1 text-[11px] font-mono text-foreground focus:outline-none focus:border-accent" />
            </div>
          </div>
        </div>

        {/* ── Outputs ── */}
        <div className="p-4">
          <div className="text-[9px] font-mono text-muted-foreground uppercase tracking-widest mb-4">Results</div>
          <div className="space-y-0">
            <RiskRow label="Account Balance" value={`$${fmt(balance, 0)}`} />
            <RiskRow label="Dollar Risk" value={`$${fmt(dollarRisk, 0)}`} sub={`${accountPct.toFixed(1)}% of account`} tone={accountPct > 2 ? 'text-[hsl(45,100%,60%)]' : 'text-foreground'} />
            <RiskRow label="Stop Distance" value={`$${fmt(stopDist)}`} sub={`${stopDistPct.toFixed(1)}%`} />
            <RiskRow
              label={type === 'equity' ? 'Shares' : type === 'options' ? 'Contracts' : 'Contracts'}
              value={shares > 0 ? shares.toLocaleString() : '—'}
              tone={shares > 0 ? 'text-accent' : 'text-muted-foreground'}
            />
            <RiskRow label="Position Value" value={shares > 0 ? `$${fmt(positionValue, 0)}` : '—'} />
            <div className="py-2" />
            <RiskRow label="Win Rate (historical)" value={trades.length ? `${(stats.wr * 100).toFixed(1)}%` : '—'} />
            <RiskRow label="Avg Win / Avg Loss" value={stats.avgL ? `${(stats.r).toFixed(2)}R` : '—'} />
            <RiskRow label="Full Kelly %" value={`${kellyFull.toFixed(1)}%`} />
            <RiskRow
              label="Risk of Ruin (100 trades)"
              value={trades.length ? `${(ror * 100).toFixed(1)}%` : '—'}
              tone={ror > 0.1 ? 'text-negative' : ror > 0.02 ? 'text-[hsl(45,100%,60%)]' : 'text-positive'}
            />
          </div>
          {trades.length < 10 && (
            <div className="mt-4 text-[8px] font-mono text-muted-foreground/60 border border-border/40 p-2">
              Historical stats based on {trades.length} trades. Add more trades for reliable Kelly &amp; RoR estimates.
            </div>
          )}
        </div>

      </div>
    </div>
  );
}
