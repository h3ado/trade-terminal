// Index vs basket dispersion view + top contributors.
import { getDispersion } from "../shared/mockVol";

interface Props { ticker: string; redact?: boolean; }

export default function DispersionPanel({ ticker, redact = false }: Props) {
  const { indexIv, basketIv, rows } = getDispersion(ticker);
  const gap = +(basketIv - indexIv).toFixed(1);

  return (
    <div className="card-terminal p-2">
      <div className="flex items-baseline gap-2 mb-2">
        <span className="text-[10px] font-mono font-bold text-accent">DISPERSION</span>
        <span className="text-[9px] font-mono text-muted-foreground">{ticker} vs basket components</span>
      </div>
      <div className="grid grid-cols-3 gap-2 text-[10px] font-mono mb-3">
        <div><div className="text-muted-foreground uppercase text-[8px]">Index IV</div><div className="text-[16px] font-bold text-accent">{redact ? "••" : indexIv}</div></div>
        <div><div className="text-muted-foreground uppercase text-[8px]">Basket avg IV</div><div className="text-[16px] font-bold text-foreground">{redact ? "••" : basketIv}</div></div>
        <div><div className="text-muted-foreground uppercase text-[8px]">Gap</div><div className={`text-[16px] font-bold ${gap > 0 ? "text-up" : "text-down"}`}>{redact ? "••" : (gap > 0 ? "+" : "") + gap}</div></div>
      </div>
      <table className="w-full text-[10px] font-mono tabular-nums">
        <thead className="text-muted-foreground border-b border-border">
          <tr><th className="text-left px-1.5 py-1">Component</th><th className="text-right px-1.5 py-1">Weight%</th><th className="text-right px-1.5 py-1">IV</th><th className="text-right px-1.5 py-1">vs Idx</th></tr>
        </thead>
        <tbody>
          {rows.map(r => {
            const diff = +(r.iv - indexIv).toFixed(1);
            return (
              <tr key={r.ticker} className="border-b border-border/30">
                <td className="px-1.5 py-1 text-accent font-bold">{r.ticker}</td>
                <td className="px-1.5 py-1 text-right text-foreground">{r.weight}</td>
                <td className="px-1.5 py-1 text-right text-foreground">{redact ? "••" : r.iv}</td>
                <td className={`px-1.5 py-1 text-right ${diff > 0 ? "text-up" : "text-down"}`}>{redact ? "••" : (diff > 0 ? "+" : "") + diff}</td>
              </tr>
            );
          })}
        </tbody>
      </table>
    </div>
  );
}
