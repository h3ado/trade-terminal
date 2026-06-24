import { useMemo, useState } from 'react';

const TOPICS = ['All', 'CB', 'Intervention', 'Carry', 'EM', 'G10', 'Crypto'] as const;
type Topic = typeof TOPICS[number];

const SAMPLE = [
  { t: '14:42', topic: 'CB',           pair: 'EURUSD', src: 'ECB Wire',     h: 'Lagarde: rates well into restrictive territory; flags FX pass-through' },
  { t: '14:18', topic: 'Intervention', pair: 'USDJPY', src: 'Nikkei',       h: 'MoF Kanda: ready for decisive action against speculative FX moves' },
  { t: '13:55', topic: 'EM',           pair: 'USDMXN', src: 'Banxico',      h: 'Banxico minutes signal cautious easing path; peso vulnerable to UST' },
  { t: '13:08', topic: 'CB',           pair: 'USDJPY', src: 'BOJ',          h: 'Ueda: will not hesitate to act if FX volatility excessive' },
  { t: '12:34', topic: 'Carry',        pair: 'AUDJPY', src: 'JPM Research', h: 'Aussie–yen carry resumes after dovish RBA cooling; sharpe 1.4' },
  { t: '11:51', topic: 'CB',           pair: 'EURUSD', src: 'Fed',          h: 'Williams: another rate cut appropriate over time; dollar slips' },
  { t: '11:20', topic: 'G10',          pair: 'GBPUSD', src: 'Reuters',      h: 'UK services CPI surprise tilts BoE pricing hawkish; cable +0.6%' },
  { t: '10:42', topic: 'Crypto',       pair: 'BTCUSD', src: 'CoinDesk',     h: 'BTC dominance vs DXY at 6m high; spot ETF flows accelerate' },
  { t: '09:30', topic: 'CB',           pair: 'GBPUSD', src: 'BOE',          h: 'Bailey: services inflation remains too high; sterling firms' },
  { t: '08:15', topic: 'Intervention', pair: 'USDCHF', src: 'SNB',          h: 'Schlegel: ready to intervene in FX market if needed' },
  { t: '07:58', topic: 'EM',           pair: 'USDTRY', src: 'CBRT',         h: 'Erkan: tight stance maintained; lira range-trading near record lows' },
  { t: '07:12', topic: 'G10',          pair: 'AUDUSD', src: 'RBA Minutes',  h: 'RBA balanced; markets price first cut Q2 next year' },
];

export default function FXNews() {
  const [topic, setTopic] = useState<Topic>('All');
  const [q, setQ] = useState('');
  const filtered = useMemo(() => SAMPLE.filter(n =>
    (topic === 'All' || n.topic === topic) &&
    (q === '' || n.h.toLowerCase().includes(q.toLowerCase()) || n.pair.toLowerCase().includes(q.toLowerCase()))
  ), [topic, q]);

  return (
    <div className="space-y-3">
      <div className="flex items-center gap-2 flex-wrap">
        <span className="text-accent font-mono font-bold text-xs uppercase">FX News & Wires</span>
        <span className="text-muted-foreground font-mono text-[9px]">FXNW &lt;GO&gt;</span>
        <div className="ml-auto flex items-center gap-2">
          <input value={q} onChange={e => setQ(e.target.value)} placeholder="filter…" className="bg-surface-elevated border border-border text-foreground text-[10px] font-mono px-2 py-0.5 placeholder:text-muted-foreground" />
          <div className="flex border border-border flex-wrap">
            {TOPICS.map(t => (
              <button key={t} onClick={() => setTopic(t)} className={`text-[10px] font-mono px-2 py-0.5 ${topic === t ? 'bg-accent text-accent-foreground font-bold' : 'text-muted-foreground hover:text-foreground'}`}>{t}</button>
            ))}
          </div>
        </div>
      </div>

      <div className="border border-border bg-surface-primary">
        <table className="w-full text-[10px] font-mono">
          <thead>
            <tr className="bg-surface-elevated border-b border-border">
              <th className="text-left text-accent px-2 py-1 w-14">TIME</th>
              <th className="text-left text-accent px-2 py-1 w-20">TOPIC</th>
              <th className="text-left text-accent px-2 py-1 w-20">PAIR</th>
              <th className="text-left text-accent px-2 py-1 w-28">SRC</th>
              <th className="text-left text-accent px-2 py-1">HEADLINE</th>
            </tr>
          </thead>
          <tbody>
            {filtered.map((n, i) => (
              <tr key={i} className="border-b border-grid-line last:border-0 hover:bg-surface-elevated/30">
                <td className="px-2 py-1 text-muted-foreground">{n.t}</td>
                <td className="px-2 py-1 text-accent font-bold">{n.topic}</td>
                <td className="px-2 py-1 text-foreground font-bold">{n.pair}</td>
                <td className="px-2 py-1 text-muted-foreground">{n.src}</td>
                <td className="px-2 py-1 text-foreground">{n.h}</td>
              </tr>
            ))}
            {filtered.length === 0 && (
              <tr><td colSpan={5} className="px-2 py-4 text-center text-muted-foreground">No matching headlines.</td></tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}
