// CALC — Consolidated calculator hub. Replaces the dozen single-purpose calculator widgets.
import { useMemo, useState } from 'react';

type Tab = 'RR' | 'PIP' | 'MARGIN' | 'COMPOUND' | 'CAGR' | 'ATR' | 'PIVOT' | 'FIB' | 'BE' | 'VOL';

const TABS: { id: Tab; label: string }[] = [
  { id: 'RR', label: 'R/R' },
  { id: 'PIP', label: 'PIP' },
  { id: 'MARGIN', label: 'MARGIN' },
  { id: 'COMPOUND', label: 'COMPOUND' },
  { id: 'CAGR', label: 'CAGR' },
  { id: 'ATR', label: 'ATR' },
  { id: 'PIVOT', label: 'PIVOT' },
  { id: 'FIB', label: 'FIB' },
  { id: 'BE', label: 'B/E' },
  { id: 'VOL', label: 'VOL' },
];

function Input({ label, value, onChange, suffix }: { label: string; value: string; onChange: (v: string) => void; suffix?: string }) {
  return (
    <div className="flex items-center gap-2 h-6 border-b border-border/40">
      <span className="text-[9px] font-mono uppercase text-muted-foreground w-20 flex-shrink-0">{label}</span>
      <input
        value={value}
        onChange={e => onChange(e.target.value)}
        type="number"
        className="flex-1 min-w-0 bg-transparent border-0 text-[10px] font-mono tabular-nums text-foreground text-right focus:outline-none focus:text-accent"
      />
      {suffix && <span className="text-[9px] font-mono text-muted-foreground w-6 text-right">{suffix}</span>}
    </div>
  );
}

function Out({ label, value, tone = 'accent' }: { label: string; value: string; tone?: 'pos' | 'neg' | 'accent' | 'neu' }) {
  const cls =
    tone === 'pos' ? 'text-positive' :
    tone === 'neg' ? 'text-negative' :
    tone === 'accent' ? 'text-accent' : 'text-foreground';
  return (
    <div className="flex items-center justify-between h-6 border-b border-border/40">
      <span className="text-[9px] font-mono uppercase text-muted-foreground">{label}</span>
      <span className={`text-[11px] font-mono font-bold tabular-nums ${cls}`}>{value}</span>
    </div>
  );
}

export default function CalcHub() {
  const [tab, setTab] = useState<Tab>('RR');

  // R/R
  const [rr, setRr] = useState({ entry: '100', stop: '98', target: '106' });
  const rrOut = useMemo(() => {
    const e = +rr.entry, s = +rr.stop, t = +rr.target;
    const risk = Math.abs(e - s), reward = Math.abs(t - e);
    return { risk, reward, ratio: risk > 0 ? reward / risk : 0 };
  }, [rr]);

  // PIP
  const [pip, setPip] = useState({ lotSize: '100000', pips: '10', pipValue: '0.0001' });
  const pipOut = useMemo(() => (+pip.lotSize) * (+pip.pips) * (+pip.pipValue), [pip]);

  // MARGIN
  const [mg, setMg] = useState({ posSize: '50000', leverage: '50' });
  const mgOut = useMemo(() => (+mg.leverage > 0 ? +mg.posSize / +mg.leverage : 0), [mg]);

  // COMPOUND
  const [cp, setCp] = useState({ principal: '10000', rate: '8', years: '10', n: '12' });
  const cpOut = useMemo(() => {
    const P = +cp.principal, r = (+cp.rate) / 100, t = +cp.years, n = +cp.n;
    const total = P * Math.pow(1 + r / n, n * t);
    return { total, interest: total - P };
  }, [cp]);

  // CAGR
  const [cg, setCg] = useState({ start: '100000', end: '180000', years: '3' });
  const cgOut = useMemo(() => {
    const s = +cg.start, e = +cg.end, y = +cg.years;
    return s > 0 && y > 0 ? (Math.pow(e / s, 1 / y) - 1) * 100 : 0;
  }, [cg]);

  // ATR (simple average of provided ranges)
  const [atr, setAtr] = useState({ ranges: '2.5,3.1,1.8,2.9,3.4,2.2,2.7', mult: '2', price: '100' });
  const atrOut = useMemo(() => {
    const arr = atr.ranges.split(',').map(s => +s.trim()).filter(n => !isNaN(n));
    const a = arr.length ? arr.reduce((s, v) => s + v, 0) / arr.length : 0;
    return { atr: a, stopLong: +atr.price - a * +atr.mult, stopShort: +atr.price + a * +atr.mult };
  }, [atr]);

  // PIVOT
  const [piv, setPiv] = useState({ high: '105', low: '98', close: '102' });
  const pivOut = useMemo(() => {
    const h = +piv.high, l = +piv.low, c = +piv.close;
    const pp = (h + l + c) / 3;
    return { pp, r1: 2 * pp - l, s1: 2 * pp - h, r2: pp + (h - l), s2: pp - (h - l), r3: h + 2 * (pp - l), s3: l - 2 * (h - pp) };
  }, [piv]);

  // FIB
  const [fib, setFib] = useState({ high: '110', low: '100', dir: 'up' as 'up' | 'down' });
  const fibOut = useMemo(() => {
    const h = +fib.high, l = +fib.low, range = h - l;
    const pcts = [0, 0.236, 0.382, 0.5, 0.618, 0.786, 1];
    return pcts.map(p => ({ pct: `${(p * 100).toFixed(1)}%`, price: fib.dir === 'up' ? h - range * p : l + range * p }));
  }, [fib]);

  // BREAKEVEN
  const [be, setBe] = useState({ entries: '100,102', qtys: '50,30', fees: '5' });
  const beOut = useMemo(() => {
    const es = be.entries.split(',').map(s => +s.trim());
    const qs = be.qtys.split(',').map(s => +s.trim());
    let totalQty = 0, totalCost = 0;
    for (let i = 0; i < Math.min(es.length, qs.length); i++) {
      totalQty += qs[i];
      totalCost += es[i] * qs[i];
    }
    const breakeven = totalQty > 0 ? (totalCost + (+be.fees)) / totalQty : 0;
    return { breakeven, totalQty, totalCost };
  }, [be]);

  // VOL
  const [vol, setVol] = useState({ returns: '0.5,-0.3,1.2,-0.8,0.4,0.9,-0.2,1.5,-0.6,0.3' });
  const volOut = useMemo(() => {
    const arr = vol.returns.split(',').map(s => +s.trim()).filter(n => !isNaN(n));
    if (!arr.length) return { daily: 0, ann: 0, avg: 0 };
    const avg = arr.reduce((s, v) => s + v, 0) / arr.length;
    const variance = arr.reduce((s, v) => s + (v - avg) ** 2, 0) / arr.length;
    const daily = Math.sqrt(variance);
    return { daily, ann: daily * Math.sqrt(252), avg };
  }, [vol]);

  return (
    <div className="space-y-2">
      <div className="flex flex-wrap gap-0.5 border-b border-border pb-1">
        {TABS.map(t => (
          <button
            key={t.id}
            onClick={() => setTab(t.id)}
            className={`px-1.5 py-0.5 text-[9px] font-mono font-bold border ${
              tab === t.id ? 'bg-accent/15 text-accent border-accent/40' : 'text-muted-foreground border-border hover:bg-surface-elevated'
            }`}
          >
            {t.label}
          </button>
        ))}
      </div>

      {tab === 'RR' && (
        <div className="grid grid-cols-2 gap-x-3">
          <div>
            <Input label="Entry" value={rr.entry} onChange={v => setRr({ ...rr, entry: v })} />
            <Input label="Stop" value={rr.stop} onChange={v => setRr({ ...rr, stop: v })} />
            <Input label="Target" value={rr.target} onChange={v => setRr({ ...rr, target: v })} />
          </div>
          <div>
            <Out label="Risk" value={rrOut.risk.toFixed(2)} tone="neg" />
            <Out label="Reward" value={rrOut.reward.toFixed(2)} tone="pos" />
            <Out label="R/R" value={`${rrOut.ratio.toFixed(2)} : 1`} tone={rrOut.ratio >= 2 ? 'pos' : rrOut.ratio >= 1 ? 'accent' : 'neg'} />
          </div>
        </div>
      )}

      {tab === 'PIP' && (
        <div className="grid grid-cols-2 gap-x-3">
          <div>
            <Input label="Lot Size" value={pip.lotSize} onChange={v => setPip({ ...pip, lotSize: v })} />
            <Input label="Pips" value={pip.pips} onChange={v => setPip({ ...pip, pips: v })} />
            <Input label="Pip Val" value={pip.pipValue} onChange={v => setPip({ ...pip, pipValue: v })} />
          </div>
          <div>
            <Out label="Pip Value" value={`$${pipOut.toFixed(2)}`} />
          </div>
        </div>
      )}

      {tab === 'MARGIN' && (
        <div className="grid grid-cols-2 gap-x-3">
          <div>
            <Input label="Pos Size" value={mg.posSize} onChange={v => setMg({ ...mg, posSize: v })} />
            <Input label="Leverage" value={mg.leverage} onChange={v => setMg({ ...mg, leverage: v })} suffix=":1" />
          </div>
          <div>
            <Out label="Margin" value={`$${mgOut.toFixed(2)}`} />
          </div>
        </div>
      )}

      {tab === 'COMPOUND' && (
        <div className="grid grid-cols-2 gap-x-3">
          <div>
            <Input label="Principal" value={cp.principal} onChange={v => setCp({ ...cp, principal: v })} />
            <Input label="Rate %" value={cp.rate} onChange={v => setCp({ ...cp, rate: v })} />
            <Input label="Years" value={cp.years} onChange={v => setCp({ ...cp, years: v })} />
            <Input label="N/yr" value={cp.n} onChange={v => setCp({ ...cp, n: v })} />
          </div>
          <div>
            <Out label="Total" value={`$${cpOut.total.toLocaleString(undefined, { maximumFractionDigits: 0 })}`} tone="pos" />
            <Out label="Interest" value={`$${cpOut.interest.toLocaleString(undefined, { maximumFractionDigits: 0 })}`} />
          </div>
        </div>
      )}

      {tab === 'CAGR' && (
        <div className="grid grid-cols-2 gap-x-3">
          <div>
            <Input label="Start" value={cg.start} onChange={v => setCg({ ...cg, start: v })} />
            <Input label="End" value={cg.end} onChange={v => setCg({ ...cg, end: v })} />
            <Input label="Years" value={cg.years} onChange={v => setCg({ ...cg, years: v })} />
          </div>
          <div>
            <Out label="CAGR" value={`${cgOut.toFixed(2)}%`} tone={cgOut >= 0 ? 'pos' : 'neg'} />
          </div>
        </div>
      )}

      {tab === 'ATR' && (
        <div className="space-y-1">
          <div className="flex items-center gap-2 h-6 border-b border-border/40">
            <span className="text-[9px] font-mono uppercase text-muted-foreground w-20">Ranges</span>
            <input
              value={atr.ranges}
              onChange={e => setAtr({ ...atr, ranges: e.target.value })}
              className="flex-1 min-w-0 bg-transparent border-0 text-[10px] font-mono tabular-nums text-foreground text-right focus:outline-none focus:text-accent"
            />
          </div>
          <Input label="Mult" value={atr.mult} onChange={v => setAtr({ ...atr, mult: v })} suffix="×" />
          <Input label="Price" value={atr.price} onChange={v => setAtr({ ...atr, price: v })} />
          <Out label="ATR" value={atrOut.atr.toFixed(3)} tone="accent" />
          <Out label="Stop (L)" value={atrOut.stopLong.toFixed(2)} tone="neg" />
          <Out label="Stop (S)" value={atrOut.stopShort.toFixed(2)} tone="neg" />
        </div>
      )}

      {tab === 'PIVOT' && (
        <div className="grid grid-cols-2 gap-x-3">
          <div>
            <Input label="High" value={piv.high} onChange={v => setPiv({ ...piv, high: v })} />
            <Input label="Low" value={piv.low} onChange={v => setPiv({ ...piv, low: v })} />
            <Input label="Close" value={piv.close} onChange={v => setPiv({ ...piv, close: v })} />
          </div>
          <div>
            <Out label="R3" value={pivOut.r3.toFixed(2)} tone="pos" />
            <Out label="R2" value={pivOut.r2.toFixed(2)} tone="pos" />
            <Out label="R1" value={pivOut.r1.toFixed(2)} tone="pos" />
            <Out label="PP" value={pivOut.pp.toFixed(2)} tone="accent" />
            <Out label="S1" value={pivOut.s1.toFixed(2)} tone="neg" />
            <Out label="S2" value={pivOut.s2.toFixed(2)} tone="neg" />
            <Out label="S3" value={pivOut.s3.toFixed(2)} tone="neg" />
          </div>
        </div>
      )}

      {tab === 'FIB' && (
        <div>
          <div className="flex gap-2 mb-1">
            <Input label="High" value={fib.high} onChange={v => setFib({ ...fib, high: v })} />
            <Input label="Low" value={fib.low} onChange={v => setFib({ ...fib, low: v })} />
            <div className="flex border border-border h-6">
              {(['up', 'down'] as const).map(d => (
                <button key={d}
                  onClick={() => setFib({ ...fib, dir: d })}
                  className={`px-1.5 text-[9px] font-mono font-bold ${fib.dir === d ? 'bg-accent/15 text-accent' : 'text-muted-foreground'}`}>
                  {d.toUpperCase()}
                </button>
              ))}
            </div>
          </div>
          {fibOut.map(l => (
            <Out key={l.pct} label={l.pct} value={l.price.toFixed(2)} tone="accent" />
          ))}
        </div>
      )}

      {tab === 'BE' && (
        <div className="space-y-1">
          <div className="flex items-center gap-2 h-6 border-b border-border/40">
            <span className="text-[9px] font-mono uppercase text-muted-foreground w-20">Entries</span>
            <input value={be.entries} onChange={e => setBe({ ...be, entries: e.target.value })}
              className="flex-1 min-w-0 bg-transparent border-0 text-[10px] font-mono tabular-nums text-foreground text-right focus:outline-none focus:text-accent" />
          </div>
          <div className="flex items-center gap-2 h-6 border-b border-border/40">
            <span className="text-[9px] font-mono uppercase text-muted-foreground w-20">Qty</span>
            <input value={be.qtys} onChange={e => setBe({ ...be, qtys: e.target.value })}
              className="flex-1 min-w-0 bg-transparent border-0 text-[10px] font-mono tabular-nums text-foreground text-right focus:outline-none focus:text-accent" />
          </div>
          <Input label="Fees" value={be.fees} onChange={v => setBe({ ...be, fees: v })} />
          <Out label="Breakeven" value={beOut.breakeven.toFixed(4)} tone="accent" />
          <Out label="Total Qty" value={beOut.totalQty.toString()} />
          <Out label="Total Cost" value={`$${beOut.totalCost.toFixed(2)}`} />
        </div>
      )}

      {tab === 'VOL' && (
        <div className="space-y-1">
          <div className="flex items-center gap-2 h-6 border-b border-border/40">
            <span className="text-[9px] font-mono uppercase text-muted-foreground w-20">Returns %</span>
            <input value={vol.returns} onChange={e => setVol({ returns: e.target.value })}
              className="flex-1 min-w-0 bg-transparent border-0 text-[10px] font-mono tabular-nums text-foreground text-right focus:outline-none focus:text-accent" />
          </div>
          <Out label="Avg Return" value={`${volOut.avg.toFixed(3)}%`} tone={volOut.avg >= 0 ? 'pos' : 'neg'} />
          <Out label="Daily Vol" value={`${volOut.daily.toFixed(3)}%`} tone="accent" />
          <Out label="Annualized" value={`${volOut.ann.toFixed(2)}%`} tone="accent" />
        </div>
      )}
    </div>
  );
}
