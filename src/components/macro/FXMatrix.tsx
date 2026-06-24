import { useState } from 'react';
import { useMacroCountry } from '@/contexts/MacroCountryContext';
import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
} from 'recharts';
import { ChevronDown, ChevronRight } from 'lucide-react';
import { ExpandableResponsiveContainer } from '@/components/shared/ExpandChart';

const currencies = ['USD', 'EUR', 'GBP', 'JPY', 'CHF', 'CAD', 'AUD', 'NZD'];

const rates: Record<string, Record<string, number>> = {
  USD: { USD: 1, EUR: 0.9228, GBP: 0.7912, JPY: 151.42, CHF: 0.8812, CAD: 1.3578, AUD: 1.5312, NZD: 1.6482 },
  EUR: { USD: 1.0836, EUR: 1, GBP: 0.8574, JPY: 164.08, CHF: 0.9549, CAD: 1.4714, AUD: 1.6592, NZD: 1.7862 },
  GBP: { USD: 1.2639, EUR: 1.1663, GBP: 1, JPY: 191.38, CHF: 1.1137, CAD: 1.7158, AUD: 1.9349, NZD: 2.0830 },
  JPY: { USD: 0.006605, EUR: 0.006095, GBP: 0.005225, JPY: 1, CHF: 0.005820, CAD: 0.008969, AUD: 0.010113, NZD: 0.010888 },
  CHF: { USD: 1.1349, EUR: 1.0472, GBP: 0.8979, JPY: 171.83, CHF: 1, CAD: 1.5409, AUD: 1.7371, NZD: 1.8701 },
  CAD: { USD: 0.7365, EUR: 0.6796, GBP: 0.5828, JPY: 111.52, CHF: 0.6490, CAD: 1, AUD: 1.1273, NZD: 1.2138 },
  AUD: { USD: 0.6531, EUR: 0.6027, GBP: 0.5168, JPY: 98.88, CHF: 0.5757, CAD: 0.8871, AUD: 1, NZD: 1.0764 },
  NZD: { USD: 0.6067, EUR: 0.5599, GBP: 0.4801, JPY: 91.87, CHF: 0.5347, CAD: 0.8238, AUD: 0.9290, NZD: 1 },
};

const changes: Record<string, Record<string, number>> = {
  USD: { USD: 0, EUR: -0.12, GBP: 0.08, JPY: 0.34, CHF: -0.05, CAD: 0.22, AUD: 0.41, NZD: 0.18 },
  EUR: { USD: 0.12, EUR: 0, GBP: 0.20, JPY: 0.46, CHF: 0.07, CAD: 0.34, AUD: 0.53, NZD: 0.30 },
  GBP: { USD: -0.08, EUR: -0.20, GBP: 0, JPY: 0.26, CHF: -0.13, CAD: 0.14, AUD: 0.33, NZD: 0.10 },
  JPY: { USD: -0.34, EUR: -0.46, GBP: -0.26, JPY: 0, CHF: -0.39, CAD: -0.12, AUD: 0.07, NZD: -0.16 },
  CHF: { USD: 0.05, EUR: -0.07, GBP: 0.13, JPY: 0.39, CHF: 0, CAD: 0.27, AUD: 0.46, NZD: 0.23 },
  CAD: { USD: -0.22, EUR: -0.34, GBP: -0.14, JPY: 0.12, CHF: -0.27, CAD: 0, AUD: 0.19, NZD: -0.04 },
  AUD: { USD: -0.41, EUR: -0.53, GBP: -0.33, JPY: -0.07, CHF: -0.46, CAD: -0.19, AUD: 0, NZD: -0.23 },
  NZD: { USD: -0.18, EUR: -0.30, GBP: -0.10, JPY: 0.16, CHF: -0.23, CAD: 0.04, AUD: 0.23, NZD: 0 },
};

const majorPairs = [
  { pair: 'EUR/USD', bid: 1.0834, ask: 1.0838, chg: 0.12, high: 1.0862, low: 1.0798 },
  { pair: 'GBP/USD', bid: 1.2637, ask: 1.2641, chg: -0.08, high: 1.2688, low: 1.2601 },
  { pair: 'USD/JPY', bid: 151.40, ask: 151.44, chg: 0.34, high: 151.72, low: 150.88 },
  { pair: 'USD/CHF', bid: 0.8810, ask: 0.8814, chg: -0.05, high: 0.8842, low: 0.8778 },
  { pair: 'AUD/USD', bid: 0.6529, ask: 0.6533, chg: -0.41, high: 0.6568, low: 0.6512 },
  { pair: 'USD/CAD', bid: 1.3576, ask: 1.3580, chg: 0.22, high: 1.3612, low: 1.3548 },
  { pair: 'NZD/USD', bid: 0.6065, ask: 0.6069, chg: -0.18, high: 0.6098, low: 0.6042 },
  { pair: 'EUR/GBP', bid: 0.8572, ask: 0.8576, chg: 0.20, high: 0.8598, low: 0.8548 },
];

// Currency-to-country mapping for highlighting
const currencyCountry: Record<string, string> = {
  USD: 'US', EUR: 'EU', GBP: 'UK', JPY: 'JP', CHF: 'CH', CAD: 'CA', AUD: 'AU', NZD: 'AU',
};

// DXY chart data
const dxyHistory = [
  { date: 'Jan', value: 102.4 }, { date: 'Feb', value: 103.8 }, { date: 'Mar', value: 104.2 },
  { date: 'Apr', value: 103.6 }, { date: 'May', value: 104.8 }, { date: 'Jun', value: 105.2 },
  { date: 'Jul', value: 104.4 }, { date: 'Aug', value: 103.2 }, { date: 'Sep', value: 105.8 },
  { date: 'Oct', value: 106.4 }, { date: 'Nov', value: 104.8 }, { date: 'Mar 26', value: 104.12 },
];

const emFX = [
  { pair: 'USD/CNY', rate: 7.2442, chg: 0.08, ytd: 1.2 },
  { pair: 'USD/INR', rate: 83.42, chg: 0.02, ytd: 0.8 },
  { pair: 'USD/BRL', rate: 4.9812, chg: -0.34, ytd: -2.4 },
  { pair: 'USD/MXN', rate: 16.92, chg: 0.18, ytd: -4.2 },
  { pair: 'USD/KRW', rate: 1342.80, chg: 0.22, ytd: 2.8 },
  { pair: 'USD/ZAR', rate: 18.42, chg: -0.14, ytd: -1.8 },
  { pair: 'USD/TRY', rate: 32.18, chg: 0.42, ytd: 8.4 },
  { pair: 'USD/PLN', rate: 3.9842, chg: -0.28, ytd: -3.2 },
];

export default function FXMatrix() {
  const { selectedCountry, countryInfo } = useMacroCountry();
  const highlightCurrency = countryInfo.currency;
  const [selectedPair, setSelectedPair] = useState<string | null>(null);
  const [selectedEM, setSelectedEM] = useState<string | null>(null);

  return (
    <div className="space-y-3">
      <div className="flex items-center gap-2">
        <span className="text-sm">{countryInfo.flag}</span>
        <span className="text-accent font-mono font-bold text-xs uppercase">FX Cross Rates & Majors</span>
        <span className="text-muted-foreground font-mono text-[9px]">FXCR &lt;GO&gt;</span>
      </div>

      {/* DXY + summary */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-3">
        <div className="border border-border bg-surface-primary p-3">
          <div className="text-[10px] font-mono text-muted-foreground mb-2">Dollar Index (DXY) — 12 Month</div>
          <ExpandableResponsiveContainer width="100%" height={160}>
            <LineChart data={dxyHistory}>
              <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
              <XAxis dataKey="date" tick={{ fontSize: 9, fontFamily: 'monospace', fill: 'hsl(var(--accent))' }} />
              <YAxis domain={['auto', 'auto']} tick={{ fontSize: 9, fontFamily: 'monospace', fill: 'hsl(var(--accent))' }} />
              <Tooltip contentStyle={{ backgroundColor: 'hsl(var(--card))', border: '1px solid hsl(var(--accent))', fontFamily: 'monospace', fontSize: 10, color: 'hsl(var(--accent))' }} itemStyle={{ color: 'hsl(var(--accent))' }} labelStyle={{ color: 'hsl(var(--accent))', fontWeight: 'bold' }} />
              <Line type="monotone" dataKey="value" stroke="hsl(var(--accent))" strokeWidth={2} dot={false} />
            </LineChart>
          </ExpandableResponsiveContainer>
        </div>
        <div className="grid grid-cols-2 gap-2">
          <div className="border border-border p-2">
            <div className="text-[9px] font-mono text-muted-foreground">DXY INDEX</div>
            <div className="text-xl font-mono font-bold text-foreground">104.12</div>
            <div className="text-[9px] font-mono text-negative">▼ 0.28 (-0.27%)</div>
          </div>
          <div className="border border-border p-2">
            <div className="text-[9px] font-mono text-muted-foreground">EUR/USD</div>
            <div className="text-xl font-mono font-bold text-positive">1.0836</div>
            <div className="text-[9px] font-mono text-positive">▲ +0.12%</div>
          </div>
          <div className="border border-border p-2">
            <div className="text-[9px] font-mono text-muted-foreground">GBP/USD</div>
            <div className="text-xl font-mono font-bold text-negative">1.2639</div>
            <div className="text-[9px] font-mono text-negative">▼ -0.08%</div>
          </div>
          <div className="border border-border p-2">
            <div className="text-[9px] font-mono text-muted-foreground">USD/JPY</div>
            <div className="text-xl font-mono font-bold text-negative">151.42</div>
            <div className="text-[9px] font-mono text-negative">▲ +0.34% (¥ weak)</div>
          </div>
        </div>
      </div>

      {/* Cross Rate Matrix */}
      <div className="border border-border overflow-x-auto">
        <table className="w-full text-[10px] font-mono">
          <thead>
            <tr className="bg-surface-elevated border-b border-border">
              <th className="px-2 py-1.5 text-accent font-bold text-left">BASE↓ / QTE→</th>
              {currencies.map(c => (
                <th key={c} className={`px-2 py-1.5 font-bold text-right ${c === highlightCurrency ? 'text-accent bg-accent/10' : 'text-accent'}`}>{c}</th>
              ))}
            </tr>
          </thead>
          <tbody>
            {currencies.map((base, i) => (
              <tr key={base} className={`border-b border-grid-line ${base === highlightCurrency ? 'bg-accent/5' : i % 2 === 0 ? '' : 'bg-surface-elevated/30'}`}>
                <td className={`px-2 py-1 font-bold ${base === highlightCurrency ? 'text-accent' : 'text-accent'}`}>{base}</td>
                {currencies.map(quote => {
                  const rate = rates[base][quote];
                  const chg = changes[base][quote];
                  const isDiag = base === quote;
                  return (
                    <td key={quote} className={`px-2 py-1 text-right ${isDiag ? 'bg-accent/5 text-muted-foreground' : ''}`}>
                      {isDiag ? (
                        <span className="text-muted-foreground/30">—</span>
                      ) : (
                        <div>
                          <div className="text-foreground font-bold">{rate < 1 ? rate.toFixed(4) : rate < 10 ? rate.toFixed(4) : rate.toFixed(2)}</div>
                          <div className={`text-[8px] ${chg > 0 ? 'text-positive' : chg < 0 ? 'text-negative' : 'text-muted-foreground'}`}>
                            {chg > 0 ? '+' : ''}{chg.toFixed(2)}%
                          </div>
                        </div>
                      )}
                    </td>
                  );
                })}
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-3">
        {/* Major Pairs */}
        <div className="border border-border overflow-hidden">
          <div className="bg-surface-elevated px-2 py-1 border-b border-border">
            <span className="text-accent font-mono font-bold text-[10px] uppercase">G10 Major Pairs — Bid/Ask</span>
          </div>
          <table className="w-full text-[10px] font-mono">
            <thead>
              <tr className="border-b border-grid-line">
                <th className="text-left px-2 py-1 text-muted-foreground">PAIR</th>
                <th className="text-right px-2 py-1 text-muted-foreground">BID</th>
                <th className="text-right px-2 py-1 text-muted-foreground">ASK</th>
                <th className="text-right px-2 py-1 text-muted-foreground">SPRD</th>
                <th className="text-right px-2 py-1 text-muted-foreground">CHG %</th>
              </tr>
            </thead>
            <tbody>
              {majorPairs.map((p, i) => (
                <>
                <tr key={p.pair} onClick={() => setSelectedPair(selectedPair === p.pair ? null : p.pair)} className={`border-b border-grid-line last:border-0 cursor-pointer transition-colors ${selectedPair === p.pair ? 'bg-accent/15' : p.pair.includes(highlightCurrency) ? 'bg-accent/10' : i % 2 === 0 ? 'hover:bg-accent/5' : 'bg-surface-elevated/30 hover:bg-accent/5'}`}>
                  <td className="px-2 py-1 text-foreground font-bold flex items-center gap-1">
                    {selectedPair === p.pair ? <ChevronDown className="w-2.5 h-2.5 text-accent" /> : <ChevronRight className="w-2.5 h-2.5 text-muted-foreground" />}
                    {p.pair}
                  </td>
                  <td className="px-2 py-1 text-right text-foreground">{p.bid.toFixed(4)}</td>
                  <td className="px-2 py-1 text-right text-foreground">{p.ask.toFixed(4)}</td>
                  <td className="px-2 py-1 text-right text-muted-foreground">{((p.ask - p.bid) * (p.bid > 100 ? 100 : 10000)).toFixed(1)}</td>
                  <td className={`px-2 py-1 text-right font-bold ${p.chg >= 0 ? 'text-positive' : 'text-negative'}`}>
                    {p.chg >= 0 ? '+' : ''}{p.chg.toFixed(2)}%
                  </td>
                </tr>
                {selectedPair === p.pair && (
                  <tr className="border-b border-grid-line"><td colSpan={5} className="p-0">
                    <div className="bg-surface-elevated/50 border-t border-accent/20 p-3 animate-in slide-in-from-top-1 duration-200 grid grid-cols-3 gap-3">
                      <div>
                        <div className="text-[8px] font-mono text-accent font-bold uppercase mb-1">Session Data</div>
                        {[{ l: 'Day High', v: p.high.toFixed(4), c: 'text-positive' }, { l: 'Day Low', v: p.low.toFixed(4), c: 'text-negative' }, { l: 'Day Range', v: `${((p.high - p.low) * (p.bid > 100 ? 100 : 10000)).toFixed(1)} pips` }, { l: 'Mid Price', v: ((p.bid + p.ask) / 2).toFixed(5) }].map(r => (
                          <div key={r.l} className="flex justify-between py-0.5 text-[9px] font-mono">
                            <span className="text-muted-foreground">{r.l}</span><span className={`font-bold ${r.c || 'text-foreground'}`}>{r.v}</span>
                          </div>
                        ))}
                      </div>
                      <div>
                        <div className="text-[8px] font-mono text-accent font-bold uppercase mb-1">Forward Points</div>
                        {[{ l: '1W Fwd', v: `${(p.chg * 2.4).toFixed(1)} pips` }, { l: '1M Fwd', v: `${(p.chg * 8.2).toFixed(1)} pips` }, { l: '3M Fwd', v: `${(p.chg * 22.8).toFixed(1)} pips` }, { l: 'Carry (ann)', v: `${(Math.random() * 4 - 2).toFixed(2)}%` }].map(r => (
                          <div key={r.l} className="flex justify-between py-0.5 text-[9px] font-mono">
                            <span className="text-muted-foreground">{r.l}</span><span className="font-bold text-foreground">{r.v}</span>
                          </div>
                        ))}
                      </div>
                      <div>
                        <div className="text-[8px] font-mono text-accent font-bold uppercase mb-1">Volatility</div>
                        {[{ l: '1W IV', v: `${(8 + Math.random() * 4).toFixed(1)}%` }, { l: '1M IV', v: `${(7 + Math.random() * 3).toFixed(1)}%` }, { l: '3M IV', v: `${(7.5 + Math.random() * 2.5).toFixed(1)}%` }, { l: '25Δ RR', v: `${(Math.random() * 2 - 1).toFixed(2)} vol` }].map(r => (
                          <div key={r.l} className="flex justify-between py-0.5 text-[9px] font-mono">
                            <span className="text-muted-foreground">{r.l}</span><span className="font-bold text-foreground">{r.v}</span>
                          </div>
                        ))}
                      </div>
                    </div>
                  </td></tr>
                )}
                </>
              ))}
            </tbody>
          </table>
        </div>

        {/* EM FX */}
        <div className="border border-border overflow-hidden">
          <div className="bg-surface-elevated px-2 py-1 border-b border-border">
            <span className="text-accent font-mono font-bold text-[10px] uppercase">Emerging Market FX</span>
          </div>
          <table className="w-full text-[10px] font-mono">
            <thead>
              <tr className="border-b border-grid-line">
                <th className="text-left px-2 py-1 text-muted-foreground">PAIR</th>
                <th className="text-right px-2 py-1 text-muted-foreground">RATE</th>
                <th className="text-right px-2 py-1 text-muted-foreground">CHG %</th>
                <th className="text-right px-2 py-1 text-muted-foreground">YTD %</th>
              </tr>
            </thead>
            <tbody>
              {emFX.map((e, i) => (
                <>
                <tr key={e.pair} onClick={() => setSelectedEM(selectedEM === e.pair ? null : e.pair)} className={`border-b border-grid-line last:border-0 cursor-pointer transition-colors ${selectedEM === e.pair ? 'bg-accent/15' : i % 2 === 0 ? 'hover:bg-accent/5' : 'bg-surface-elevated/30 hover:bg-accent/5'}`}>
                  <td className="px-2 py-1 text-foreground font-bold flex items-center gap-1">
                    {selectedEM === e.pair ? <ChevronDown className="w-2.5 h-2.5 text-accent" /> : <ChevronRight className="w-2.5 h-2.5 text-muted-foreground" />}
                    {e.pair}
                  </td>
                  <td className="px-2 py-1 text-right text-foreground font-bold">{e.rate < 10 ? e.rate.toFixed(4) : e.rate.toFixed(2)}</td>
                  <td className={`px-2 py-1 text-right font-bold ${e.chg >= 0 ? 'text-negative' : 'text-positive'}`}>
                    {e.chg >= 0 ? '+' : ''}{e.chg.toFixed(2)}%
                  </td>
                  <td className={`px-2 py-1 text-right ${e.ytd >= 0 ? 'text-negative' : 'text-positive'}`}>
                    {e.ytd >= 0 ? '+' : ''}{e.ytd.toFixed(1)}%
                  </td>
                </tr>
                {selectedEM === e.pair && (
                  <tr className="border-b border-grid-line"><td colSpan={4} className="p-0">
                    <div className="bg-surface-elevated/50 border-t border-accent/20 p-3 animate-in slide-in-from-top-1 duration-200 grid grid-cols-2 gap-3">
                      <div>
                        <div className="text-[8px] font-mono text-accent font-bold uppercase mb-1">EM FX Details</div>
                        {[{ l: 'YTD Change', v: `${e.ytd >= 0 ? '+' : ''}${e.ytd}%`, c: e.ytd >= 0 ? 'text-negative' : 'text-positive' }, { l: '52W High', v: `${(e.rate * 1.08).toFixed(e.rate < 10 ? 4 : 2)}` }, { l: '52W Low', v: `${(e.rate * 0.92).toFixed(e.rate < 10 ? 4 : 2)}` }, { l: 'Central Bank Rate', v: `${(Math.random() * 10 + 2).toFixed(2)}%` }].map(r => (
                          <div key={r.l} className="flex justify-between py-0.5 text-[9px] font-mono"><span className="text-muted-foreground">{r.l}</span><span className={`font-bold ${r.c || 'text-foreground'}`}>{r.v}</span></div>
                        ))}
                      </div>
                      <div>
                        <div className="text-[8px] font-mono text-accent font-bold uppercase mb-1">Risk Metrics</div>
                        {[{ l: '1M Vol', v: `${(10 + Math.random() * 8).toFixed(1)}%` }, { l: '3M Vol', v: `${(9 + Math.random() * 6).toFixed(1)}%` }, { l: 'CDS 5Y', v: `${(50 + Math.random() * 200).toFixed(0)}bp` }, { l: 'FX Reserves', v: `$${(20 + Math.random() * 300).toFixed(0)}B` }].map(r => (
                          <div key={r.l} className="flex justify-between py-0.5 text-[9px] font-mono"><span className="text-muted-foreground">{r.l}</span><span className="font-bold text-foreground">{r.v}</span></div>
                        ))}
                      </div>
                    </div>
                  </td></tr>
                )}
                </>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
