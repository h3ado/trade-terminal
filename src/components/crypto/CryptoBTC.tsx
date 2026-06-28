import CryptoCoinDetail from './CryptoCoinDetail';

function Ph({ label }: { label: string }) {
  return (
    <div className="px-2 py-[3px] border-b border-border bg-surface-elevated shrink-0">
      <span className="text-[8px] text-accent font-bold uppercase tracking-widest">{label}</span>
    </div>
  );
}

const BTC_EXTRA = (
  <>
    <Ph label="Bitcoin Halvings & Supply" />
    <div className="flex-1 min-h-0 overflow-y-auto px-2 py-1 font-mono text-[9px]">
      {[
        { date: '2009-01-03', event: 'Genesis Block — Satoshi mines 50 BTC',         reward: '50 BTC' },
        { date: '2012-11-28', event: '1st Halving',                                   reward: '25 BTC' },
        { date: '2016-07-09', event: '2nd Halving',                                   reward: '12.5 BTC' },
        { date: '2020-05-11', event: '3rd Halving',                                   reward: '6.25 BTC' },
        { date: '2024-04-20', event: '4th Halving (current)',                         reward: '3.125 BTC' },
        { date: '~2028',      event: '5th Halving (est.)',                            reward: '1.5625 BTC' },
      ].map(h => (
        <div key={h.date} className="flex gap-2 py-[3px] border-b border-border/20">
          <span className="text-muted-foreground shrink-0 w-[72px]">{h.date}</span>
          <span className="text-foreground flex-1">{h.event}</span>
          <span className="text-accent font-bold shrink-0">{h.reward}</span>
        </div>
      ))}
      <div className="mt-2 space-y-[2px] border-t border-border/40 pt-1">
        {[
          { l: 'Max Supply',       v: '21,000,000 BTC' },
          { l: 'Mined to date',    v: '~19.7M BTC (93.8%)' },
          { l: 'Remaining',        v: '~1.3M BTC' },
          { l: 'Lost coins est.',  v: '3–4M BTC (irrecoverable)' },
          { l: 'Consensus',        v: 'Proof-of-Work (SHA-256)' },
          { l: 'Block time',       v: '~10 minutes' },
        ].map(r => (
          <div key={r.l} className="flex justify-between text-[8px]">
            <span className="text-muted-foreground">{r.l}</span>
            <span className="text-foreground font-semibold">{r.v}</span>
          </div>
        ))}
      </div>
    </div>
  </>
);

export default function CryptoBTC() {
  return <CryptoCoinDetail coinId="bitcoin" title="Bitcoin" extra={BTC_EXTRA} />;
}
