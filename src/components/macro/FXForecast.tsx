import { useState } from 'react';
import { usePrivacy } from '@/contexts/PrivacyContext';

const PAIRS = ['EUR/USD', 'GBP/USD', 'USD/JPY', 'USD/CHF', 'AUD/USD', 'USD/CAD', 'NZD/USD', 'EUR/GBP', 'EUR/JPY', 'USD/CNY', 'USD/MXN', 'USD/BRL', 'USD/INR', 'USD/ZAR'];
const HOUSES = ['Goldman', 'JPMorgan', 'Morgan Stanley', 'Citi', 'UBS', 'BofA', 'Barclays', 'Nomura', 'Deutsche', 'HSBC'];

function h(s: string) { let v = 0; for (let i = 0; i < s.length; i++) v = (v * 31 + s.charCodeAt(i)) | 0; return Math.abs(v); }
function seed(s: string, lo: number, hi: number) { return lo + ((h(s) % 1000) / 1000) * (hi - lo); }

const SPOT: Record<string, number> = {
  'EUR/USD': 1.0836, 'GBP/USD': 1.2639, 'USD/JPY': 151.42, 'USD/CHF': 0.8812,
  'AUD/USD': 0.6531, 'USD/CAD': 1.3578, 'NZD/USD': 0.6067, 'EUR/GBP': 0.8574,
  'EUR/JPY': 164.08, 'USD/CNY': 7.2442, 'USD/MXN': 16.92, 'USD/BRL': 4.9812,
  'USD/INR': 83.42, 'USD/ZAR': 18.42,
};

export default function FXForecast() {
  const { privacyMode } = usePrivacy(); const redact = (v: any) => privacyMode ? "•••••" : String(v);
  const [pair, setPair] = useState('EUR/USD');

  const rows = PAIRS.map(p => {
    const spot = SPOT[p];
    const drift = seed(p + 'd', -0.04, 0.04);
    return {
      pair: p, spot,
      q1: spot * (1 + drift * 0.25),
      q2: spot * (1 + drift * 0.5),
      q3: spot * (1 + drift * 0.75),
      q4: spot * (1 + drift),
      y1: spot * (1 + drift * 1.4),
      hi: spot * (1 + Math.abs(drift) * 1.6),
      lo: spot * (1 - Math.abs(drift) * 1.6),
      n: 22 + Math.floor(seed(p + 'n', 0, 14)),
      carry: seed(p + 'c', -3, 5),
    };
  });

  const sel = rows.find(r => r.pair === pair)!;
  const houses = HOUSES.map(hn => ({
    name: hn,
    q1: sel.spot * (1 + seed(hn + pair + '1', -0.03, 0.03)),
    q4: sel.spot * (1 + seed(hn + pair + '4', -0.05, 0.05)),
    y1: sel.spot * (1 + seed(hn + pair + 'y', -0.08, 0.08)),
    bias: seed(hn + pair + 'b', -1, 1) > 0 ? 'LONG' : 'SHORT',
  }));

  const fmt = (n: number) => n < 10 ? n.toFixed(4) : n.toFixed(2);

  return (
    <div className="space-y-3">
      <div className="flex items-center gap-2">
        <span className="text-accent font-mono font-bold text-xs uppercase">FX Consensus Forecasts</span>
        <span className="text-muted-foreground font-mono text-[9px]">FXFC &lt;GO&gt;</span>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-3">
        <div className="lg:col-span-2 border border-border overflow-x-auto">
          <div className="bg-surface-elevated px-2 py-1 border-b border-border">
            <span className="text-accent font-mono font-bold text-[10px] uppercase">Consensus Table — Median Forecast</span>
          </div>
          <table className="w-full text-[10px] font-mono">
            <thead>
              <tr className="border-b border-grid-line">
                {['PAIR', 'SPOT', 'Q1', 'Q2', 'Q3', 'Q4', '+1Y', 'HI', 'LO', 'N', 'CARRY'].map(c => (
                  <th key={c} className="px-2 py-1 text-muted-foreground text-right first:text-left">{c}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {rows.map((r, i) => {
                const dir = r.y1 > r.spot ? 'text-positive' : 'text-negative';
                return (
                  <tr key={r.pair} onClick={() => setPair(r.pair)}
                    className={`border-b border-grid-line cursor-pointer ${pair === r.pair ? 'bg-accent/15' : i % 2 ? 'bg-surface-elevated/30 hover:bg-accent/5' : 'hover:bg-accent/5'}`}>
                    <td className="px-2 py-1 text-foreground font-bold">{r.pair}</td>
                    <td className="px-2 py-1 text-right text-foreground">{redact(fmt(r.spot))}</td>
                    <td className={`px-2 py-1 text-right ${dir}`}>{redact(fmt(r.q1))}</td>
                    <td className={`px-2 py-1 text-right ${dir}`}>{redact(fmt(r.q2))}</td>
                    <td className={`px-2 py-1 text-right ${dir}`}>{redact(fmt(r.q3))}</td>
                    <td className={`px-2 py-1 text-right ${dir}`}>{redact(fmt(r.q4))}</td>
                    <td className={`px-2 py-1 text-right font-bold ${dir}`}>{redact(fmt(r.y1))}</td>
                    <td className="px-2 py-1 text-right text-muted-foreground">{fmt(r.hi)}</td>
                    <td className="px-2 py-1 text-right text-muted-foreground">{fmt(r.lo)}</td>
                    <td className="px-2 py-1 text-right text-muted-foreground">{r.n}</td>
                    <td className={`px-2 py-1 text-right ${r.carry >= 0 ? 'text-positive' : 'text-negative'}`}>{r.carry >= 0 ? '+' : ''}{r.carry.toFixed(2)}%</td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>

        <div className="border border-border">
          <div className="bg-surface-elevated px-2 py-1 border-b border-border">
            <span className="text-accent font-mono font-bold text-[10px] uppercase">{pair} · Contributors</span>
          </div>
          <table className="w-full text-[10px] font-mono">
            <thead>
              <tr className="border-b border-grid-line">
                {['HOUSE', 'Q1', 'Q4', '+1Y', 'BIAS'].map(c => (
                  <th key={c} className="px-2 py-1 text-muted-foreground text-right first:text-left">{c}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {houses.map((h, i) => (
                <tr key={h.name} className={`border-b border-grid-line ${i % 2 ? 'bg-surface-elevated/30' : ''}`}>
                  <td className="px-2 py-1 text-foreground font-bold">{h.name}</td>
                  <td className="px-2 py-1 text-right text-foreground">{redact(fmt(h.q1))}</td>
                  <td className="px-2 py-1 text-right text-foreground">{redact(fmt(h.q4))}</td>
                  <td className="px-2 py-1 text-right text-foreground">{redact(fmt(h.y1))}</td>
                  <td className={`px-2 py-1 text-right font-bold ${h.bias === 'LONG' ? 'text-positive' : 'text-negative'}`}>{h.bias}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
