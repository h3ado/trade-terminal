import { useState } from 'react';
import { useFXRates } from '@/hooks/useFXRates';
import { usePrivacy } from '@/contexts/PrivacyContext';

const REGIONS: Record<string, string[]> = {
  G10: ['EUR', 'GBP', 'JPY', 'CHF', 'CAD', 'AUD', 'NZD', 'SEK', 'NOK'],
  Europe: ['EUR', 'GBP', 'CHF', 'SEK', 'NOK', 'DKK', 'PLN', 'CZK', 'HUF', 'RON'],
  Asia: ['JPY', 'CNY', 'HKD', 'SGD', 'KRW', 'TWD', 'INR', 'IDR', 'THB', 'MYR', 'PHP', 'VND'],
  LatAm: ['MXN', 'BRL', 'CLP', 'COP', 'PEN', 'ARS', 'UYU'],
  MENA: ['AED', 'SAR', 'QAR', 'ILS', 'EGP', 'TRY', 'IRR'],
  Africa: ['ZAR', 'NGN', 'EGP', 'KES', 'MAD', 'GHS'],
  CIS: ['RUB', 'KZT', 'UAH', 'GEL', 'AMD'],
};

const NDF = new Set(['BRL', 'KRW', 'TWD', 'INR', 'IDR', 'PHP', 'CLP', 'COP', 'PEN', 'ARS', 'EGP']);

function h(s: string) { let v = 0; for (let i = 0; i < s.length; i++) v = (v * 31 + s.charCodeAt(i)) | 0; return Math.abs(v); }
function seed(s: string, lo: number, hi: number) { return lo + ((h(s) % 1000) / 1000) * (hi - lo); }

export default function CurrencyTKC() {
  const [region, setRegion] = useState('G10');
  const { rates } = useFXRates();
  const { privacyMode } = usePrivacy(); const redact = (v: any) => privacyMode ? "•••••" : String(v);

  const list = REGIONS[region];

  return (
    <div className="space-y-3">
      <div className="flex items-center gap-2">
        <span className="text-accent font-mono font-bold text-xs uppercase">Regional Currency Overview</span>
        <span className="text-muted-foreground font-mono text-[9px]">TKC &lt;GO&gt;</span>
      </div>

      <div className="flex gap-1 border-b border-border">
        {Object.keys(REGIONS).map(r => (
          <button key={r} onClick={() => setRegion(r)}
            className={`px-3 py-1.5 text-[10px] font-mono ${region === r ? 'bg-accent text-accent-foreground font-bold' : 'text-muted-foreground hover:bg-surface-elevated'}`}>
            {r}
          </button>
        ))}
      </div>

      <div className="border border-border overflow-x-auto">
        <table className="w-full text-[10px] font-mono">
          <thead>
            <tr className="bg-surface-elevated border-b border-border">
              {['CCY', 'PAIR', 'SPOT', 'BID', 'ASK', '1D Δ', 'DAY HI', 'DAY LO', 'CB FIX', 'NDF'].map(c => (
                <th key={c} className="px-2 py-1.5 text-accent font-bold text-right first:text-left">{c}</th>
              ))}
            </tr>
          </thead>
          <tbody>
            {list.map((c, i) => {
              const r = rates.find(x => x.ccy === c);
              const spot = r ? 1 / (r.usd || 1) : seed(c + 'sp', 0.5, 200);
              const chg = r?.change_pct ?? seed(c + 'ch', -1.5, 1.5);
              const bid = spot * 0.99985, ask = spot * 1.00015;
              const hi = spot * (1 + Math.abs(chg) / 200);
              const lo = spot * (1 - Math.abs(chg) / 200);
              const fmt = (n: number) => n < 10 ? n.toFixed(4) : n.toFixed(2);
              return (
                <tr key={c} className={`border-b border-grid-line ${i % 2 ? 'bg-surface-elevated/30' : ''}`}>
                  <td className="px-2 py-1 text-accent font-bold">{c}</td>
                  <td className="px-2 py-1 text-muted-foreground">USD/{c}</td>
                  <td className="px-2 py-1 text-right text-foreground font-bold">{redact(fmt(spot))}</td>
                  <td className="px-2 py-1 text-right text-foreground">{redact(fmt(bid))}</td>
                  <td className="px-2 py-1 text-right text-foreground">{redact(fmt(ask))}</td>
                  <td className={`px-2 py-1 text-right font-bold ${chg >= 0 ? 'text-positive' : 'text-negative'}`}>{chg >= 0 ? '+' : ''}{chg.toFixed(2)}%</td>
                  <td className="px-2 py-1 text-right text-positive">{redact(fmt(hi))}</td>
                  <td className="px-2 py-1 text-right text-negative">{redact(fmt(lo))}</td>
                  <td className="px-2 py-1 text-right text-foreground">{redact(fmt(spot * (1 + seed(c + 'f', -0.0005, 0.0005))))}</td>
                  <td className="px-2 py-1 text-right">{NDF.has(c) ? <span className="text-accent">●</span> : <span className="text-muted-foreground/40">—</span>}</td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
    </div>
  );
}
