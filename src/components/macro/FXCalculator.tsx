import { useMemo, useState } from 'react';
import { useFXRates } from '@/hooks/useFXRates';
import { usePrivacy } from '@/contexts/PrivacyContext';

const COMMON = ['USD', 'EUR', 'GBP', 'JPY', 'CHF', 'CAD', 'AUD', 'NZD', 'CNY', 'INR', 'MXN', 'BRL', 'KRW', 'ZAR', 'SEK', 'NOK', 'SGD', 'HKD', 'TRY', 'PLN'];

export default function FXCalculator() {
  const { rates } = useFXRates();
  const { privacyMode } = usePrivacy(); const redact = (v: any) => privacyMode ? "•••••" : String(v);
  const [amt, setAmt] = useState('10000');
  const [from, setFrom] = useState('USD');
  const [to, setTo] = useState('EUR');
  const [days, setDays] = useState('30');
  const [fwdPts, setFwdPts] = useState('12');

  const usdOf = (c: string) => rates.find(r => r.ccy === c)?.usd ?? (c === 'USD' ? 1 : 1);
  const cross = useMemo(() => {
    const f = usdOf(from); const t = usdOf(to);
    return t ? f / t : 0;
  }, [rates, from, to]);

  const converted = (parseFloat(amt) || 0) * cross;
  const fwdRate = cross + (parseFloat(fwdPts) || 0) / 10000;
  const fwdConverted = (parseFloat(amt) || 0) * fwdRate;

  return (
    <div className="space-y-3">
      <div className="flex items-center gap-2">
        <span className="text-accent font-mono font-bold text-xs uppercase">FX Calculator</span>
        <span className="text-muted-foreground font-mono text-[9px]">FXCA &lt;GO&gt;</span>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-3">
        <div className="border border-border bg-surface-primary p-3">
          <div className="text-[10px] font-mono text-accent font-bold uppercase mb-2">Spot Conversion</div>
          <div className="grid grid-cols-[1fr_auto_1fr] gap-2 items-end">
            <div>
              <div className="text-[9px] font-mono text-muted-foreground">AMOUNT</div>
              <input value={amt} onChange={e => setAmt(e.target.value)} type="number"
                className="w-full px-2 py-1.5 bg-surface-elevated border border-border text-foreground text-sm font-mono focus:outline-none focus:border-accent" />
              <select value={from} onChange={e => setFrom(e.target.value)} className="mt-1 w-full px-2 py-1 bg-surface-elevated border border-border text-foreground text-[10px] font-mono focus:outline-none focus:border-accent">
                {COMMON.map(c => <option key={c}>{c}</option>)}
              </select>
            </div>
            <div className="text-accent font-mono text-2xl pb-2">→</div>
            <div>
              <div className="text-[9px] font-mono text-muted-foreground">CONVERTED</div>
              <div className="w-full px-2 py-1.5 bg-surface-elevated border border-border text-positive text-sm font-mono font-bold">
                {redact(converted.toLocaleString('en-US', { maximumFractionDigits: 2 }))}
              </div>
              <select value={to} onChange={e => setTo(e.target.value)} className="mt-1 w-full px-2 py-1 bg-surface-elevated border border-border text-foreground text-[10px] font-mono focus:outline-none focus:border-accent">
                {COMMON.map(c => <option key={c}>{c}</option>)}
              </select>
            </div>
          </div>
          <div className="mt-3 grid grid-cols-2 gap-2 text-[10px] font-mono">
            <div className="border border-border p-2"><div className="text-muted-foreground">SPOT RATE</div><div className="text-foreground font-bold">{redact(cross.toFixed(6))}</div></div>
            <div className="border border-border p-2"><div className="text-muted-foreground">INVERSE</div><div className="text-foreground font-bold">{redact((1 / (cross || 1)).toFixed(6))}</div></div>
          </div>
        </div>

        <div className="border border-border bg-surface-primary p-3">
          <div className="text-[10px] font-mono text-accent font-bold uppercase mb-2">Forward Value-Date</div>
          <div className="grid grid-cols-2 gap-2">
            <div>
              <div className="text-[9px] font-mono text-muted-foreground">DAYS</div>
              <input value={days} onChange={e => setDays(e.target.value)} type="number"
                className="w-full px-2 py-1.5 bg-surface-elevated border border-border text-foreground text-sm font-mono focus:outline-none focus:border-accent" />
            </div>
            <div>
              <div className="text-[9px] font-mono text-muted-foreground">FWD POINTS (pips)</div>
              <input value={fwdPts} onChange={e => setFwdPts(e.target.value)} type="number"
                className="w-full px-2 py-1.5 bg-surface-elevated border border-border text-foreground text-sm font-mono focus:outline-none focus:border-accent" />
            </div>
          </div>
          <div className="mt-3 space-y-2 text-[10px] font-mono">
            <div className="border border-border p-2 flex justify-between"><span className="text-muted-foreground">VALUE DATE</span><span className="text-foreground font-bold">T+{days}</span></div>
            <div className="border border-border p-2 flex justify-between"><span className="text-muted-foreground">FWD RATE</span><span className="text-foreground font-bold">{redact(fwdRate.toFixed(6))}</span></div>
            <div className="border border-border p-2 flex justify-between"><span className="text-muted-foreground">FWD CONVERTED</span><span className="text-positive font-bold">{redact(fwdConverted.toLocaleString('en-US', { maximumFractionDigits: 2 }))} {to}</span></div>
            <div className="border border-border p-2 flex justify-between"><span className="text-muted-foreground">IMPLIED CARRY (ann)</span><span className={`font-bold ${fwdRate >= cross ? 'text-positive' : 'text-negative'}`}>{(((fwdRate / cross - 1) * 365 / Math.max(parseFloat(days) || 1, 1)) * 100).toFixed(3)}%</span></div>
          </div>
        </div>
      </div>

      <div className="border border-border overflow-x-auto">
        <div className="bg-surface-elevated px-2 py-1 border-b border-border">
          <span className="text-accent font-mono font-bold text-[10px] uppercase">Cross-Rate Matrix (against {from})</span>
        </div>
        <table className="w-full text-[10px] font-mono">
          <thead>
            <tr className="border-b border-grid-line">
              {['CCY', '1 ' + from + ' =', 'INVERSE', '1Y FWD'].map(c => <th key={c} className="px-2 py-1 text-muted-foreground text-right first:text-left">{c}</th>)}
            </tr>
          </thead>
          <tbody>
            {COMMON.filter(c => c !== from).map((c, i) => {
              const rate = usdOf(from) / (usdOf(c) || 1);
              return (
                <tr key={c} className={`border-b border-grid-line ${i % 2 ? 'bg-surface-elevated/30' : ''}`}>
                  <td className="px-2 py-1 text-accent font-bold">{c}</td>
                  <td className="px-2 py-1 text-right text-foreground">{redact(rate.toFixed(6))}</td>
                  <td className="px-2 py-1 text-right text-muted-foreground">{redact((1 / (rate || 1)).toFixed(6))}</td>
                  <td className="px-2 py-1 text-right text-foreground">{redact((rate * 1.005).toFixed(6))}</td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
    </div>
  );
}
