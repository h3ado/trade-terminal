// OPRA — Options Quick Pricer. Inline Black-Scholes pricer with greeks.
import { useMemo, useState } from 'react';
import { calculateBlackScholes } from '@/utils/blackScholes';
import Sparkline from './Sparkline';

interface NumRowProps { label: string; value: string; onChange: (v: string) => void; }
function NumRow({ label, value, onChange }: NumRowProps) {
  return (
    <div className="flex items-center gap-2 h-6 border-b border-border/40">
      <span className="text-[9px] font-mono uppercase text-muted-foreground w-14 flex-shrink-0">{label}</span>
      <input
        value={value}
        onChange={e => onChange(e.target.value)}
        type="number"
        className="flex-1 min-w-0 bg-transparent border-0 text-[10px] font-mono tabular-nums text-foreground text-right focus:outline-none focus:text-accent"
      />
    </div>
  );
}

function OutRow({ label, value, tone = 'neu' }: { label: string; value: string; tone?: 'pos' | 'neg' | 'accent' | 'neu' }) {
  const cls = tone === 'pos' ? 'text-positive' : tone === 'neg' ? 'text-negative' : tone === 'accent' ? 'text-accent' : 'text-foreground';
  return (
    <div className="flex items-center justify-between h-5 border-b border-border/40">
      <span className="text-[9px] font-mono uppercase text-muted-foreground">{label}</span>
      <span className={`text-[10px] font-mono font-bold tabular-nums ${cls}`}>{value}</span>
    </div>
  );
}

export default function OpraPricer() {
  const [symbol, setSymbol] = useState('SPY');
  const [spot, setSpot] = useState('482.32');
  const [strike, setStrike] = useState('485');
  const [dte, setDte] = useState('30');
  const [iv, setIv] = useState('22');
  const [rate, setRate] = useState('5');
  const [side, setSide] = useState<'C' | 'P'>('C');

  const r = useMemo(() => {
    const S = parseFloat(spot) || 0;
    const K = parseFloat(strike) || 0;
    const T = Math.max(0.0001, (parseFloat(dte) || 0) / 365);
    const sigma = (parseFloat(iv) || 0) / 100;
    const rf = (parseFloat(rate) || 0) / 100;
    const bs = calculateBlackScholes(S, K, T, rf, sigma);
    const price = side === 'C' ? bs.callPrice : bs.putPrice;
    const delta = side === 'C' ? bs.callDelta : bs.putDelta;
    const theta = side === 'C' ? bs.callTheta : bs.putTheta;
    const rho = side === 'C' ? bs.callRho : bs.putRho;
    const breakeven = side === 'C' ? K + price : K - price;
    return { price, delta, gamma: bs.gamma, theta, vega: bs.vega, rho, breakeven, S };
  }, [spot, strike, dte, iv, rate, side]);

  // IV-rank style sparkline (synthetic, illustrative)
  const ivSeries = useMemo(() => {
    const base = parseFloat(iv) || 20;
    return Array.from({ length: 24 }, (_, i) => base + Math.sin(i * 0.6) * 3 + Math.cos(i * 0.3) * 1.5);
  }, [iv]);

  return (
    <div className="space-y-2">
      <div className="flex items-center gap-1.5">
        <input
          value={symbol}
          onChange={e => setSymbol(e.target.value.toUpperCase())}
          className="w-16 px-1.5 py-1 bg-surface-elevated border border-border text-[11px] font-mono font-bold text-foreground uppercase focus:outline-none focus:border-accent"
        />
        <div className="flex border border-border">
          {(['C', 'P'] as const).map(s => (
            <button
              key={s}
              onClick={() => setSide(s)}
              className={`px-2 py-1 text-[10px] font-mono font-bold ${
                side === s
                  ? s === 'C' ? 'bg-positive/15 text-positive' : 'bg-negative/15 text-negative'
                  : 'text-muted-foreground hover:bg-surface-elevated'
              }`}
            >
              {s === 'C' ? 'CALL' : 'PUT'}
            </button>
          ))}
        </div>
        <div className="ml-auto flex items-center gap-1">
          <span className="text-[8px] font-mono text-muted-foreground uppercase">IV</span>
          <Sparkline values={ivSeries} width={48} height={14} tone="accent" />
        </div>
      </div>

      <div className="grid grid-cols-2 gap-x-3">
        <div>
          <NumRow label="Spot" value={spot} onChange={setSpot} />
          <NumRow label="Strike" value={strike} onChange={setStrike} />
          <NumRow label="DTE" value={dte} onChange={setDte} />
          <NumRow label="IV %" value={iv} onChange={setIv} />
          <NumRow label="Rate %" value={rate} onChange={setRate} />
        </div>
        <div>
          <OutRow label="Price" value={`$${r.price.toFixed(2)}`} tone="accent" />
          <OutRow label="Delta" value={r.delta.toFixed(3)} tone={r.delta >= 0 ? 'pos' : 'neg'} />
          <OutRow label="Gamma" value={r.gamma.toFixed(4)} />
          <OutRow label="Theta" value={r.theta.toFixed(3)} tone="neg" />
          <OutRow label="Vega" value={r.vega.toFixed(3)} />
          <OutRow label="Rho" value={r.rho.toFixed(3)} />
          <OutRow label="B/E" value={`$${r.breakeven.toFixed(2)}`} tone="accent" />
        </div>
      </div>
    </div>
  );
}
