import { useState } from 'react';
import { ChevronDown, ChevronRight } from 'lucide-react';

const sentimentGauges = [
  { name: 'CNN Fear & Greed', value: 38, label: 'FEAR', color: 'text-red-400', prev: 42 },
  { name: 'AAII Bulls', value: 28.5, label: '28.5%', color: 'text-red-400', prev: 32.1 },
  { name: 'AAII Bears', value: 42.8, label: '42.8%', color: 'text-green-400', prev: 38.2 },
  { name: 'Put/Call Ratio', value: 0.92, label: '0.92', color: 'text-yellow-400', prev: 0.85 },
  { name: 'VIX', value: 18.42, label: '18.42', color: 'text-yellow-400', prev: 16.8 },
  { name: 'MOVE Index', value: 98, label: '98', color: 'text-yellow-400', prev: 92 },
];

const positioning = [
  { asset: 'S&P 500 E-mini', net: '+142K', chg: '-18K', color: 'text-red-400', lev: 'Long', crowding: 72, mm: '+285K', am: '+42K', hf: '-185K', details: { oi: '2.8M', oiChg: '+42K', maxPain: '5,180', pcRatio: '0.88', gamma: '+$4.2B', dealer: 'Long Gamma', skew: '-8.2', term: 'Backwardation' } },
  { asset: 'Nasdaq 100 E-mini', net: '+98K', chg: '-12K', color: 'text-red-400', lev: 'Long', crowding: 68, mm: '+165K', am: '+28K', hf: '-95K', details: { oi: '1.2M', oiChg: '+18K', maxPain: '17,850', pcRatio: '0.92', gamma: '+$2.8B', dealer: 'Long Gamma', skew: '-10.5', term: 'Backwardation' } },
  { asset: '10Y Treasury', net: '-425K', chg: '+32K', color: 'text-green-400', lev: 'Short', crowding: 85, mm: '-180K', am: '+95K', hf: '-340K', details: { oi: '4.2M', oiChg: '-28K', maxPain: '110-00', pcRatio: '1.12', gamma: '-$1.8B', dealer: 'Short Gamma', skew: '+2.4', term: 'Contango' } },
  { asset: 'EUR/USD', net: '+48K', chg: '+8K', color: 'text-green-400', lev: 'Long', crowding: 55, mm: '+82K', am: '+12K', hf: '-46K', details: { oi: '680K', oiChg: '+15K', maxPain: '1.0850', pcRatio: '0.78', gamma: '+$520M', dealer: 'Neutral', skew: '-1.8', term: 'Flat' } },
  { asset: 'Gold', net: '+285K', chg: '+22K', color: 'text-green-400', lev: 'Long', crowding: 78, mm: '+142K', am: '+98K', hf: '+45K', details: { oi: '520K', oiChg: '+32K', maxPain: '$2,280', pcRatio: '0.65', gamma: '+$1.2B', dealer: 'Long Gamma', skew: '-4.2', term: 'Contango' } },
  { asset: 'Crude Oil WTI', net: '+165K', chg: '-28K', color: 'text-red-400', lev: 'Long', crowding: 62, mm: '+92K', am: '+38K', hf: '+35K', details: { oi: '1.8M', oiChg: '-42K', maxPain: '$78.50', pcRatio: '0.95', gamma: '-$380M', dealer: 'Short Gamma', skew: '-6.8', term: 'Backwardation' } },
  { asset: 'US Dollar (DXY)', net: '+32K', chg: '+5K', color: 'text-green-400', lev: 'Long', crowding: 48, mm: '+58K', am: '-12K', hf: '-14K', details: { oi: '420K', oiChg: '+8K', maxPain: '103.50', pcRatio: '0.82', gamma: '+$180M', dealer: 'Neutral', skew: '+1.2', term: 'Flat' } },
];

const fundFlows = [
  { category: 'US Equity ETFs', flow1w: '+$8.2B', flow1m: '+$32.5B', ytd: '+$142B', aum: '$5.8T', top: 'SPY +$4.2B' },
  { category: 'Int\'l Equity ETFs', flow1w: '+$2.1B', flow1m: '+$8.4B', ytd: '+$48B', aum: '$1.2T', top: 'EFA +$1.8B' },
  { category: 'EM Equity ETFs', flow1w: '-$1.4B', flow1m: '-$5.2B', ytd: '-$18B', aum: '$380B', top: 'EEM -$0.8B' },
  { category: 'US Bond ETFs', flow1w: '+$5.8B', flow1m: '+$22.1B', ytd: '+$98B', aum: '$1.8T', top: 'AGG +$2.4B' },
  { category: 'HY Credit ETFs', flow1w: '-$0.8B', flow1m: '-$2.5B', ytd: '+$12B', aum: '$95B', top: 'HYG -$0.5B' },
  { category: 'Gold ETFs', flow1w: '+$1.2B', flow1m: '+$4.8B', ytd: '+$22B', aum: '$210B', top: 'GLD +$0.9B' },
  { category: 'Crypto ETFs', flow1w: '+$0.4B', flow1m: '+$2.1B', ytd: '+$28B', aum: '$68B', top: 'IBIT +$0.3B' },
];

export default function Sentiment() {
  const [selected, setSelected] = useState<string | null>(null);

  return (
    <div className="space-y-4 text-[10px] font-mono">
      <div className="border border-border p-2 bg-card">
        <div className="text-accent font-bold mb-2">1) MARKET SENTIMENT DASHBOARD — SENT</div>
        <div className="grid grid-cols-6 gap-2">
          {sentimentGauges.map(g => (
            <div key={g.name} className="border border-border p-2 text-center">
              <div className="text-[8px] text-muted-foreground">{g.name}</div>
              <div className={`text-lg font-bold ${g.color}`}>{g.label}</div>
              <div className="text-[8px] text-muted-foreground">prev: {g.prev}</div>
              <div className="mt-1 h-1.5 bg-border rounded overflow-hidden">
                <div className={`h-full rounded ${typeof g.value === 'number' && g.value > 50 ? 'bg-green-500' : 'bg-red-500'}`} style={{ width: `${typeof g.value === 'number' ? Math.min(g.value, 100) : 50}%` }} />
              </div>
            </div>
          ))}
        </div>
      </div>

      <div className="border border-border p-2 bg-card">
        <div className="text-accent font-bold mb-2">2) CFTC COMMITMENT OF TRADERS — POSITIONING</div>
        <table className="w-full">
          <thead><tr className="border-b border-border text-muted-foreground">
            <th className="text-left p-1">Asset</th><th className="text-right p-1">Net Spec</th><th className="text-right p-1">Wk Chg</th><th className="text-right p-1">Bias</th><th className="text-right p-1">Crowding</th><th className="text-right p-1">Mkt Maker</th><th className="text-right p-1">Asset Mgr</th><th className="text-right p-1">Hedge Fund</th>
          </tr></thead>
          <tbody>{positioning.map(p => (
            <><tr key={p.asset} onClick={() => setSelected(selected === p.asset ? null : p.asset)} className="border-b border-border/50 cursor-pointer hover:bg-accent/5">
              <td className="p-1">{selected === p.asset ? <ChevronDown className="w-2.5 h-2.5 inline mr-1 text-accent" /> : <ChevronRight className="w-2.5 h-2.5 inline mr-1" />}{p.asset}</td>
              <td className="text-right p-1 font-bold">{p.net}</td><td className={`text-right p-1 ${p.color}`}>{p.chg}</td>
              <td className="text-right p-1"><span className={`px-1 ${p.lev === 'Long' ? 'bg-green-500/20 text-green-400' : 'bg-red-500/20 text-red-400'}`}>{p.lev}</span></td>
              <td className="text-right p-1"><div className="inline-flex items-center gap-1"><div className="w-12 h-1.5 bg-border rounded overflow-hidden inline-block"><div className={`h-full ${p.crowding > 70 ? 'bg-red-500' : p.crowding > 50 ? 'bg-yellow-500' : 'bg-green-500'}`} style={{ width: `${p.crowding}%` }} /></div><span className="text-[8px]">{p.crowding}%</span></div></td>
              <td className="text-right p-1 text-muted-foreground">{p.mm}</td><td className="text-right p-1 text-muted-foreground">{p.am}</td><td className="text-right p-1 text-muted-foreground">{p.hf}</td>
            </tr>
            {selected === p.asset && (
              <tr key={p.asset + '-d'}><td colSpan={8} className="p-0">
                <div className="bg-card/80 border-t border-accent/20 p-3 grid grid-cols-4 gap-3">
                  <div><div className="text-[9px] text-accent font-bold mb-1">OPEN INTEREST</div>
                    {[{ l: 'Total OI', v: p.details.oi }, { l: 'OI Change', v: p.details.oiChg }].map(i => (
                      <div key={i.l} className="flex justify-between text-[9px]"><span className="text-muted-foreground">{i.l}</span><span className="font-bold">{i.v}</span></div>
                    ))}</div>
                  <div><div className="text-[9px] text-accent font-bold mb-1">OPTIONS FLOW</div>
                    {[{ l: 'Max Pain', v: p.details.maxPain }, { l: 'P/C Ratio', v: p.details.pcRatio }].map(i => (
                      <div key={i.l} className="flex justify-between text-[9px]"><span className="text-muted-foreground">{i.l}</span><span className="font-bold">{i.v}</span></div>
                    ))}</div>
                  <div><div className="text-[9px] text-accent font-bold mb-1">GAMMA</div>
                    {[{ l: 'Net Gamma', v: p.details.gamma }, { l: 'Dealer Pos', v: p.details.dealer }].map(i => (
                      <div key={i.l} className="flex justify-between text-[9px]"><span className="text-muted-foreground">{i.l}</span><span className="font-bold">{i.v}</span></div>
                    ))}</div>
                  <div><div className="text-[9px] text-accent font-bold mb-1">STRUCTURE</div>
                    {[{ l: 'Vol Skew', v: p.details.skew }, { l: 'Term Struct', v: p.details.term }].map(i => (
                      <div key={i.l} className="flex justify-between text-[9px]"><span className="text-muted-foreground">{i.l}</span><span className="font-bold">{i.v}</span></div>
                    ))}</div>
                </div>
              </td></tr>
            )}</>
          ))}</tbody>
        </table>
      </div>

      <div className="border border-border p-2 bg-card">
        <div className="text-accent font-bold mb-2">3) ETF FUND FLOWS</div>
        <table className="w-full">
          <thead><tr className="border-b border-border text-muted-foreground">
            <th className="text-left p-1">Category</th><th className="text-right p-1">1W Flow</th><th className="text-right p-1">1M Flow</th><th className="text-right p-1">YTD Flow</th><th className="text-right p-1">AUM</th><th className="text-right p-1">Top Flow</th>
          </tr></thead>
          <tbody>{fundFlows.map(f => (
            <tr key={f.category} className="border-b border-border/50 hover:bg-accent/5">
              <td className="p-1 font-bold">{f.category}</td>
              <td className={`text-right p-1 ${f.flow1w.startsWith('+') ? 'text-green-400' : 'text-red-400'}`}>{f.flow1w}</td>
              <td className={`text-right p-1 ${f.flow1m.startsWith('+') ? 'text-green-400' : 'text-red-400'}`}>{f.flow1m}</td>
              <td className={`text-right p-1 ${f.ytd.startsWith('+') ? 'text-green-400' : 'text-red-400'}`}>{f.ytd}</td>
              <td className="text-right p-1 text-muted-foreground">{f.aum}</td>
              <td className="text-right p-1 text-[9px] text-muted-foreground">{f.top}</td>
            </tr>
          ))}</tbody>
        </table>
      </div>

      <div className="text-[8px] text-muted-foreground border-t border-border pt-1 flex justify-between">
        <span>SENT — Market Sentiment & Positioning</span><span>Source: CFTC / AAII / CNN / Bloomberg</span><span>{new Date().toLocaleString()}</span>
      </div>
    </div>
  );
}
