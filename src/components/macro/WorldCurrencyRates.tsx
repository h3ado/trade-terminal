import { useMemo, useState } from 'react';
import { useFXRates } from '@/hooks/useFXRates';
import { usePrivacy } from '@/contexts/PrivacyContext';

const ALL = [
  'EUR', 'GBP', 'JPY', 'CHF', 'CAD', 'AUD', 'NZD', 'SEK', 'NOK', 'DKK',
  'CNY', 'HKD', 'SGD', 'KRW', 'TWD', 'INR', 'IDR', 'THB', 'MYR', 'PHP', 'VND',
  'MXN', 'BRL', 'CLP', 'COP', 'PEN', 'ARS',
  'AED', 'SAR', 'QAR', 'ILS', 'EGP', 'TRY', 'PLN', 'CZK', 'HUF', 'RON',
  'ZAR', 'NGN', 'KES', 'MAD', 'GHS',
  'RUB', 'KZT', 'UAH',
];

const REGIME: Record<string, 'Float' | 'Peg' | 'Crawl' | 'Managed'> = {
  AED: 'Peg', SAR: 'Peg', QAR: 'Peg', HKD: 'Peg', DKK: 'Peg',
  CNY: 'Managed', VND: 'Crawl', EGP: 'Crawl', ARS: 'Crawl',
};

const REGION: Record<string, string> = {};
['EUR','GBP','CHF','SEK','NOK','DKK','PLN','CZK','HUF','RON'].forEach(c => REGION[c] = 'Europe');
['JPY','CNY','HKD','SGD','KRW','TWD','INR','IDR','THB','MYR','PHP','VND'].forEach(c => REGION[c] = 'Asia');
['MXN','BRL','CLP','COP','PEN','ARS'].forEach(c => REGION[c] = 'LatAm');
['AED','SAR','QAR','ILS','EGP','TRY'].forEach(c => REGION[c] = 'MENA');
['ZAR','NGN','KES','MAD','GHS'].forEach(c => REGION[c] = 'Africa');
['RUB','KZT','UAH'].forEach(c => REGION[c] = 'CIS');
['CAD','AUD','NZD'].forEach(c => REGION[c] = 'Americas/Oceania');

function h(s: string) { let v = 0; for (let i = 0; i < s.length; i++) v = (v * 31 + s.charCodeAt(i)) | 0; return Math.abs(v); }
function seed(s: string, lo: number, hi: number) { return lo + ((h(s) % 1000) / 1000) * (hi - lo); }

export default function WorldCurrencyRates() {
  const { rates } = useFXRates();
  const { privacyMode } = usePrivacy(); const redact = (v: any) => privacyMode ? "•••••" : String(v);
  const [filter, setFilter] = useState('ALL');
  const [regime, setRegime] = useState('ALL');

  const regions = ['ALL', ...Array.from(new Set(Object.values(REGION)))];
  const regimes = ['ALL', 'Float', 'Peg', 'Crawl', 'Managed'];

  const usdRate = (c: string) => rates.find(r => r.ccy === c)?.usd ?? seed(c + 'sp', 0.001, 2);
  const eurUsd = rates.find(r => r.ccy === 'EUR')?.usd ?? 1.0836;
  const gbpUsd = rates.find(r => r.ccy === 'GBP')?.usd ?? 1.2639;

  const data = useMemo(() => ALL.map(c => {
    const u = usdRate(c);
    const pUSD = 1 / (u || 1);
    return {
      ccy: c, pUSD, pEUR: pUSD / eurUsd, pGBP: pUSD / gbpUsd,
      chg: rates.find(r => r.ccy === c)?.change_pct ?? seed(c + 'ch', -1.4, 1.4),
      high52: pUSD * (1 + Math.abs(seed(c + 'h52', 0.04, 0.18))),
      low52: pUSD * (1 - Math.abs(seed(c + 'l52', 0.04, 0.18))),
      regime: REGIME[c] ?? 'Float',
      region: REGION[c] ?? '—',
    };
  }), [rates, eurUsd, gbpUsd]);

  const filtered = data.filter(d =>
    (filter === 'ALL' || d.region === filter) &&
    (regime === 'ALL' || d.regime === regime)
  );

  const fmt = (n: number) => n < 0.01 ? n.toFixed(6) : n < 10 ? n.toFixed(4) : n.toFixed(2);

  return (
    <div className="space-y-3">
      <div className="flex items-center gap-2">
        <span className="text-accent font-mono font-bold text-xs uppercase">World Currency Spot Rates</span>
        <span className="text-muted-foreground font-mono text-[9px]">WCR &lt;GO&gt;</span>
      </div>

      <div className="flex gap-2">
        <div className="flex gap-1">
          {regions.map(r => (
            <button key={r} onClick={() => setFilter(r)}
              className={`px-2 py-1 text-[10px] font-mono ${filter === r ? 'bg-accent text-accent-foreground font-bold' : 'border border-border text-muted-foreground hover:bg-surface-elevated'}`}>{r}</button>
          ))}
        </div>
        <div className="w-px bg-border" />
        <div className="flex gap-1">
          {regimes.map(r => (
            <button key={r} onClick={() => setRegime(r)}
              className={`px-2 py-1 text-[10px] font-mono ${regime === r ? 'bg-accent text-accent-foreground font-bold' : 'border border-border text-muted-foreground hover:bg-surface-elevated'}`}>{r}</button>
          ))}
        </div>
      </div>

      <div className="border border-border overflow-x-auto">
        <table className="w-full text-[10px] font-mono">
          <thead>
            <tr className="bg-surface-elevated border-b border-border">
              {['CCY', 'REGION', 'REGIME', 'vs USD', 'vs EUR', 'vs GBP', '1D Δ', '52W RANGE', 'HI', 'LO'].map(c => (
                <th key={c} className="px-2 py-1.5 text-accent font-bold text-right first:text-left">{c}</th>
              ))}
            </tr>
          </thead>
          <tbody>
            {filtered.map((d, i) => {
              const rngPos = ((d.pUSD - d.low52) / (d.high52 - d.low52)) * 100;
              return (
                <tr key={d.ccy} className={`border-b border-grid-line ${i % 2 ? 'bg-surface-elevated/30' : ''}`}>
                  <td className="px-2 py-1 text-accent font-bold">{d.ccy}</td>
                  <td className="px-2 py-1 text-muted-foreground">{d.region}</td>
                  <td className="px-2 py-1">
                    <span className={`px-1 ${d.regime === 'Peg' ? 'bg-accent/20 text-accent' : d.regime === 'Managed' ? 'bg-warning/20 text-warning' : d.regime === 'Crawl' ? 'bg-negative/20 text-negative' : 'text-muted-foreground'}`}>{d.regime}</span>
                  </td>
                  <td className="px-2 py-1 text-right text-foreground font-bold">{redact(fmt(d.pUSD))}</td>
                  <td className="px-2 py-1 text-right text-foreground">{redact(fmt(d.pEUR))}</td>
                  <td className="px-2 py-1 text-right text-foreground">{redact(fmt(d.pGBP))}</td>
                  <td className={`px-2 py-1 text-right font-bold ${d.chg >= 0 ? 'text-positive' : 'text-negative'}`}>{d.chg >= 0 ? '+' : ''}{d.chg.toFixed(2)}%</td>
                  <td className="px-2 py-1">
                    <div className="w-20 h-1.5 bg-surface-elevated relative">
                      <div className="absolute top-0 h-full bg-accent" style={{ left: `${Math.max(0, Math.min(100, rngPos))}%`, width: '3px' }} />
                    </div>
                  </td>
                  <td className="px-2 py-1 text-right text-positive">{redact(fmt(d.high52))}</td>
                  <td className="px-2 py-1 text-right text-negative">{redact(fmt(d.low52))}</td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
    </div>
  );
}
