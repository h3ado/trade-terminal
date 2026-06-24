// OVME Pricing — deal parameters, valuation, and greeks summary.
import { OvmeDeal, priceDeal } from "./OvmeWorkspace";

interface Props { deal: OvmeDeal; setDeal: (d: OvmeDeal) => void; redact?: boolean }

function NumInput({ value, onChange, step = 1, suffix }: { value: number; onChange: (v: number) => void; step?: number; suffix?: string }) {
  return (
    <div className="relative">
      <input
        type="number"
        value={value}
        step={step}
        onChange={(e) => onChange(parseFloat(e.target.value) || 0)}
        className="w-full bg-transparent border border-accent/60 px-2 py-1 text-right font-mono text-xs text-accent focus:outline-none focus:border-accent tabular-nums"
      />
      {suffix && <span className="absolute right-2 top-1/2 -translate-y-1/2 text-[9px] font-mono text-muted-foreground pointer-events-none">{suffix}</span>}
    </div>
  );
}

export default function OvmePricing({ deal, setDeal, redact = false }: Props) {
  const bs = priceDeal(deal);
  const theo = deal.isCall ? bs.callPrice : bs.putPrice;
  const intrinsic = Math.max(0, deal.isCall ? deal.spot - deal.strike : deal.strike - deal.spot);
  const timeValue = theo - intrinsic;
  const moneyness =
    deal.isCall
      ? deal.spot > deal.strike ? "ITM" : deal.spot < deal.strike ? "OTM" : "ATM"
      : deal.spot < deal.strike ? "ITM" : deal.spot > deal.strike ? "OTM" : "ATM";
  const breakeven = deal.isCall ? deal.strike + theo : deal.strike - theo;
  const distance = ((breakeven - deal.spot) / deal.spot) * 100;

  const delta = deal.isCall ? bs.callDelta : bs.putDelta;
  const theta = deal.isCall ? bs.callTheta : bs.putTheta;
  const rho = deal.isCall ? bs.callRho : bs.putRho;
  // Higher-order (rough approximations for display)
  const vanna = -bs.gamma * deal.spot * (bs.d2 / (deal.vol / 100)) * 0.0001;
  const charm = -bs.gamma * deal.spot * 0.5 * (deal.dte / 365);
  const volga = bs.vega * (bs.d1 * bs.d2) / (deal.vol / 100) * 0.01;

  const r = (n: number, d = 4) => (redact ? "••" : n.toFixed(d));

  // Trade analytics
  const mid = theo;                                       // assume mid = theo for the demo
  const market = theo * (1 + (deal.ticker.length % 5 - 2) * 0.01); // synthetic market px
  const edge = mid - market;
  const edgePct = (edge / Math.max(market, 0.01)) * 100;
  const t = deal.dte / 365;
  const sigT = (deal.vol / 100) * Math.sqrt(Math.max(t, 1 / 365));
  const expectedMove = deal.spot * sigT;                  // 1σ $ move to expiry
  // Probability OTM (approx) → POP for long single leg = 1 − |delta| (rough)
  const pop = Math.max(0, Math.min(100, (1 - Math.abs(delta)) * 100));
  // Kelly fraction (very rough): edge / variance, capped 0..25%
  const kelly = Math.max(0, Math.min(25, (edgePct / 100) / Math.max(sigT * sigT, 0.0001) * 100));
  // 2nd-order greeks (more)
  const veta = -bs.vega * (deal.rate / 100 + (bs.d1 * (deal.vol / 100)) / (2 * Math.max(t, 0.0001))) * 0.01;
  const speed = -bs.gamma / deal.spot * (bs.d1 / ((deal.vol / 100) * Math.sqrt(Math.max(t, 0.0001))) + 1);
  const zomma = bs.gamma * ((bs.d1 * bs.d2 - 1) / (deal.vol / 100));
  const color = -bs.gamma * 0.5 * (2 * (deal.rate / 100) * t + 1) / Math.max(t, 0.0001);

  return (
    <div className="grid grid-cols-1 lg:grid-cols-3 gap-3">
      {/* Deal Parameters */}
      <div className="card-terminal p-2">
        <h3 className="text-xs font-mono font-bold text-accent uppercase tracking-wider mb-3">Deal Parameters</h3>
        <div className="flex gap-2 mb-4">
          <button
            onClick={() => setDeal({ ...deal, isCall: true })}
            className={`px-4 py-1.5 text-xs font-mono font-bold uppercase ${deal.isCall ? "bg-positive/20 border border-positive text-positive" : "border border-border text-muted-foreground"}`}
          >Call</button>
          <button
            onClick={() => setDeal({ ...deal, isCall: false })}
            className={`px-4 py-1.5 text-xs font-mono font-bold uppercase ${!deal.isCall ? "bg-negative/20 border border-negative text-negative" : "border border-border text-muted-foreground"}`}
          >Put</button>
        </div>
        <div className="space-y-2.5 text-xs font-mono">
          <Row label="Underlying" value={<span className="text-accent font-bold">{deal.ticker}</span>} />
          <Row label="Spot Price" value={<span className="text-foreground tabular-nums">{r(deal.spot, 2)}</span>} />
          <FieldRow label="Strike"><NumInput value={deal.strike} onChange={(v) => setDeal({ ...deal, strike: v })} /></FieldRow>
          <FieldRow label="DTE (days)"><NumInput value={deal.dte} onChange={(v) => setDeal({ ...deal, dte: v })} /></FieldRow>
          <FieldRow label="Vol (%)"><NumInput value={deal.vol} step={0.1} onChange={(v) => setDeal({ ...deal, vol: v })} /></FieldRow>
          <FieldRow label="Rate (%)"><NumInput value={deal.rate} step={0.05} onChange={(v) => setDeal({ ...deal, rate: v })} /></FieldRow>
          <Row label="Model" value={<span className="text-foreground">Black-Scholes</span>} />
          <Row label="Style" value={<span className="text-foreground">American</span>} />
        </div>
      </div>

      {/* Valuation */}
      <div className="card-terminal p-2">
        <h3 className="text-xs font-mono font-bold text-accent uppercase tracking-wider mb-3">Valuation</h3>
        <div className="space-y-2.5 text-xs font-mono">
          <Row label="Theo Price" value={<span className="text-accent font-bold tabular-nums">{r(theo, 4)}</span>} />
          <Row label="Intrinsic" value={<span className="text-foreground tabular-nums">{r(intrinsic, 4)}</span>} />
          <Row label="Time Value" value={<span className="text-foreground tabular-nums">{r(timeValue, 4)}</span>} />
          <Row label="Moneyness" value={<span className="text-accent font-bold">{moneyness}</span>} />
        </div>
        <div className="border-t border-border mt-4 pt-3">
          <h4 className="text-[10px] font-mono font-bold text-accent uppercase tracking-wider mb-2">Breakeven</h4>
          <div className="space-y-2 text-xs font-mono">
            <Row label={deal.isCall ? "Upside BE" : "Downside BE"} value={<span className="text-foreground tabular-nums font-bold">{r(breakeven, 2)}</span>} />
            <Row label="Distance" value={<span className={`tabular-nums ${distance >= 0 ? "text-positive" : "text-negative"}`}>{redact ? "••" : `${distance >= 0 ? "+" : ""}${distance.toFixed(2)}%`}</span>} />
          </div>
        </div>
      </div>

      {/* Greeks Summary */}
      <div className="card-terminal p-2">
        <h3 className="text-xs font-mono font-bold text-accent uppercase tracking-wider mb-3">Greeks Summary</h3>
        <div className="space-y-2.5 text-xs font-mono">
          <Row label="Delta (Δ)" value={<span className={`tabular-nums font-bold ${delta >= 0 ? "text-positive" : "text-negative"}`}>{r(delta, 4)}</span>} />
          <Row label="Gamma (Γ)" value={<span className="text-accent tabular-nums">{r(bs.gamma, 6)}</span>} />
          <Row label="Theta (Θ)" value={<span className="text-negative tabular-nums">{r(theta, 4)}</span>} />
          <Row label="Vega (ν)" value={<span className="text-accent tabular-nums">{r(bs.vega, 4)}</span>} />
          <Row label="Rho (ρ)" value={<span className="text-foreground tabular-nums">{r(rho, 4)}</span>} />
        </div>
        <div className="border-t border-border mt-4 pt-3">
          <h4 className="text-[10px] font-mono font-bold text-accent uppercase tracking-wider mb-2">2nd Order</h4>
          <div className="space-y-2 text-xs font-mono">
            <Row label="Vanna  ∂Δ/∂σ" value={<span className="text-muted-foreground tabular-nums">{r(vanna, 6)}</span>} />
            <Row label="Charm  ∂Δ/∂t" value={<span className="text-muted-foreground tabular-nums">{r(charm, 6)}</span>} />
            <Row label="Volga  ∂ν/∂σ" value={<span className="text-muted-foreground tabular-nums">{r(volga, 6)}</span>} />
            <Row label="Veta   ∂ν/∂t" value={<span className="text-muted-foreground tabular-nums">{r(veta, 6)}</span>} />
            <Row label="Speed  ∂Γ/∂S" value={<span className="text-muted-foreground tabular-nums">{r(speed, 6)}</span>} />
            <Row label="Zomma  ∂Γ/∂σ" value={<span className="text-muted-foreground tabular-nums">{r(zomma, 6)}</span>} />
            <Row label="Color  ∂Γ/∂t" value={<span className="text-muted-foreground tabular-nums">{r(color, 6)}</span>} />
          </div>
        </div>
      </div>

      {/* Trade analytics */}
      <div className="card-terminal p-2 lg:col-span-3">
        <h3 className="text-xs font-mono font-bold text-accent uppercase tracking-wider mb-3">Trade Analytics</h3>
        <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-7 gap-2 text-xs font-mono">
          <Cell label="THEO"          value={r(theo, 2)}                                tone="accent" />
          <Cell label="MARKET"        value={r(market, 2)} />
          <Cell label="EDGE $"        value={r(edge, 2)}                                tone={edge >= 0 ? "up" : "down"} />
          <Cell label="EDGE %"        value={redact ? "••" : `${edgePct.toFixed(2)}%`}  tone={edge >= 0 ? "up" : "down"} />
          <Cell label="EXP MOVE 1σ"   value={redact ? "••" : `±$${expectedMove.toFixed(2)}`} tone="accent" />
          <Cell label="POP"           value={redact ? "••" : `${pop.toFixed(0)}%`}      tone="accent" />
          <Cell label="KELLY size"    value={redact ? "••" : `${kelly.toFixed(1)}%`}    tone="neutral" />
        </div>
        <div className="mt-3 grid grid-cols-2 gap-3 text-[10px] font-mono text-muted-foreground">
          <div><span className="text-accent">EDGE</span> = theo − market. Positive = priced cheap.</div>
          <div><span className="text-accent">KELLY</span> = (edge/var) clipped to [0,25]%. Sizing aid only.</div>
        </div>
      </div>
    </div>
  );
}

function Cell({ label, value, tone }: { label: string; value: string; tone?: "up" | "down" | "accent" | "neutral" }) {
  const c = tone === "up" ? "text-up" : tone === "down" ? "text-down" : tone === "accent" ? "text-accent" : "text-foreground";
  return (
    <div className="border border-border bg-surface-elevated px-2 py-1.5">
      <div className="text-[9px] uppercase text-muted-foreground tracking-wider">{label}</div>
      <div className={`text-sm font-bold tabular-nums ${c}`}>{value}</div>
    </div>
  );
}

function Row({ label, value }: { label: string; value: React.ReactNode }) {
  return <div className="flex items-center justify-between"><span className="text-muted-foreground">{label}</span>{value}</div>;
}
function FieldRow({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div className="flex items-center justify-between gap-3">
      <span className="text-muted-foreground">{label}</span>
      <div className="w-28">{children}</div>
    </div>
  );
}
