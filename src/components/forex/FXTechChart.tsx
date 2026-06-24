// FXTF — Dedicated full-bleed technical chart workspace.
import { useState } from 'react';
import FxProChart from '@/components/forex/chart/FxProChart';

const PAIRS = [
  'EURUSD', 'GBPUSD', 'USDJPY', 'USDCHF', 'AUDUSD', 'NZDUSD', 'USDCAD',
  'USDCNH', 'USDMXN', 'USDBRL', 'USDZAR', 'USDTRY', 'EURGBP', 'EURJPY', 'GBPJPY',
  'DXY',
];

export default function FXTechChart() {
  const [pair, setPair] = useState('EURUSD');

  return (
    <div className="flex flex-col h-full gap-2">
      <div className="flex items-center gap-2 flex-wrap">
        <span className="text-accent font-mono font-bold text-xs uppercase">FX Technical Chart</span>
        <span className="text-muted-foreground font-mono text-[9px]">FXTF &lt;GO&gt;</span>
        <div className="ml-auto flex items-center gap-1.5">
          <label className="text-[10px] font-mono text-muted-foreground uppercase tracking-wider">PAIR</label>
          <select value={pair} onChange={e => setPair(e.target.value)}
            className="bg-surface-elevated border border-border text-foreground text-[10px] font-mono px-1.5 py-0.5 uppercase tracking-wider">
            {PAIRS.map(p => <option key={p}>{p}</option>)}
          </select>
        </div>
      </div>

      <div className="flex-1 min-h-0">
        <FxProChart
          symbol={pair}
          title=""
          height={Math.max(400, window.innerHeight - 180)}
          digits={pair.includes('JPY') ? 3 : pair === 'DXY' ? 2 : 5}
          initialCfg={{ timeframe: '1D', range: '1Y', type: 'candle', ema20: true, ema50: true }}
        />
      </div>
    </div>
  );
}
