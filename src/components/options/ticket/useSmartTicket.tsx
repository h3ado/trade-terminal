// Smart Order Ticket — global modal launched from any module.
// Provides multi-leg ticket UI with mock NBBO/liquidity, plus context to open it.
import { createContext, ReactNode, useCallback, useContext, useMemo, useState } from "react";
import { X, Plus, Trash2 } from "lucide-react";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { toast } from "@/components/ui/use-toast";
import { apiPost } from "@/lib/api";

export interface TicketLeg {
  action: "BUY" | "SELL";
  qty: number;
  type: "CALL" | "PUT";
  strike: number;
  expiry: string;
}

export interface TicketPayload {
  ticker: string;
  legs: TicketLeg[];
  note?: string;
}

interface Ctx {
  open: (p: TicketPayload) => void;
  close: () => void;
}

const SmartTicketCtx = createContext<Ctx | null>(null);

export function useSmartTicket() {
  const ctx = useContext(SmartTicketCtx);
  if (!ctx) return { open: () => {}, close: () => {} };
  return ctx;
}

function hash(s: string): number { let h = 2166136261; for (let i = 0; i < s.length; i++) { h ^= s.charCodeAt(i); h = Math.imul(h, 16777619); } return h >>> 0; }
function rng(seed: number) { let a = seed; return () => { a |= 0; a = (a + 0x6D2B79F5) | 0; let t = a; t = Math.imul(t ^ (t >>> 15), t | 1); t ^= t + Math.imul(t ^ (t >>> 7), t | 61); return ((t ^ (t >>> 14)) >>> 0) / 4294967296; }; }

function priceLeg(leg: TicketLeg) {
  const r = rng(hash(`${leg.type}${leg.strike}${leg.expiry}`));
  const mid = +(0.5 + r() * 14).toFixed(2);
  const spread = +(0.02 + r() * 0.18).toFixed(2);
  const bid = +(mid - spread / 2).toFixed(2);
  const ask = +(mid + spread / 2).toFixed(2);
  const liq = Math.max(1, Math.min(5, Math.round(5 - spread * 18)));
  return { bid, ask, mid, spread, liq };
}

export function SmartTicketProvider({ children }: { children: ReactNode }) {
  const [payload, setPayload] = useState<TicketPayload | null>(null);

  const ctx = useMemo<Ctx>(() => ({
    open: (p) => setPayload(p),
    close: () => setPayload(null),
  }), []);

  return (
    <SmartTicketCtx.Provider value={ctx}>
      {children}
      <SmartTicketDialog payload={payload} onClose={() => setPayload(null)} />
    </SmartTicketCtx.Provider>
  );
}

function SmartTicketDialog({ payload, onClose }: { payload: TicketPayload | null; onClose: () => void }) {
  const [legs, setLegs] = useState<TicketLeg[]>([]);
  const [ticker, setTicker] = useState("");
  const [working, setWorking] = useState(false);

  // sync when payload arrives
  useMemo(() => {
    if (payload) { setLegs(payload.legs); setTicker(payload.ticker); }
  }, [payload]);

  if (!payload) return null;

  const pricedLegs = legs.map(l => ({ leg: l, p: priceLeg(l) }));
  const netDebit = pricedLegs.reduce((s, x) => s + (x.leg.action === "BUY" ? 1 : -1) * x.leg.qty * x.p.mid * 100, 0);
  const avgLiq = pricedLegs.length ? Math.round(pricedLegs.reduce((s, x) => s + x.p.liq, 0) / pricedLegs.length) : 0;
  const slipBps = pricedLegs.length ? Math.round(pricedLegs.reduce((s, x) => s + x.p.spread / x.p.mid * 10000, 0) / pricedLegs.length) : 0;

  const updateLeg = (i: number, patch: Partial<TicketLeg>) =>
    setLegs(prev => prev.map((l, idx) => idx === i ? { ...l, ...patch } : l));
  const removeLeg = (i: number) => setLegs(prev => prev.filter((_, idx) => idx !== i));
  const addLeg = () => {
    const last = legs[legs.length - 1];
    setLegs(prev => [...prev, last ? { ...last, action: last.action === "BUY" ? "SELL" : "BUY" } : { action: "BUY", qty: 1, type: "CALL", strike: 100, expiry: new Date(Date.now() + 30*86400000).toISOString().slice(0,10) }]);
  };

  const saveTemplate = async () => {
    setWorking(true);
    try {
      await apiPost('/api/option-strategy-templates', {
        ticker, name: `${ticker} ${legs.length}-leg`,
        legs, stats: { netDebit, avgLiq, slipBps },
      });
      toast({ title: "Template saved" });
    } catch (e) {
      toast({ title: "Save failed", description: e instanceof Error ? e.message : "Unknown" });
    } finally { setWorking(false); }
  };

  return (
    <Dialog open onOpenChange={(v) => !v && onClose()}>
      <DialogContent className="max-w-3xl bg-surface-deep border-border" aria-describedby={undefined}>
        <DialogHeader>
          <DialogTitle className="text-[12px] font-mono uppercase tracking-wider text-accent flex items-center gap-3">
            <span>TKT</span><span className="text-foreground">Smart Order Ticket</span>
            <input value={ticker} onChange={e => setTicker(e.target.value.toUpperCase())}
              className="ml-auto w-20 bg-surface-elevated border border-border px-2 py-0.5 text-[11px] font-mono focus:outline-none focus:border-accent" />
          </DialogTitle>
        </DialogHeader>

        <div className="space-y-2">
          <table className="w-full text-[10px] font-mono tabular-nums">
            <thead className="text-muted-foreground border-b border-border">
              <tr>
                {["Action","Qty","Type","K","Expiry","Bid","Mid","Ask","Sprd","Liq",""].map(h => (
                  <th key={h} className="px-1.5 py-1 text-right">{h}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {pricedLegs.map(({ leg, p }, i) => (
                <tr key={i} className="border-b border-border/30">
                  <td className="px-1.5 py-1">
                    <select value={leg.action} onChange={e => updateLeg(i, { action: e.target.value as "BUY" | "SELL" })}
                      className={`bg-surface-elevated border border-border px-1 py-0.5 font-bold ${leg.action === "BUY" ? "text-up" : "text-down"}`}>
                      <option>BUY</option><option>SELL</option>
                    </select>
                  </td>
                  <td className="px-1.5 py-1 text-right">
                    <input type="number" value={leg.qty} onChange={e => updateLeg(i, { qty: +e.target.value || 1 })}
                      className="w-12 bg-surface-elevated border border-border px-1 py-0.5 text-right" />
                  </td>
                  <td className="px-1.5 py-1">
                    <select value={leg.type} onChange={e => updateLeg(i, { type: e.target.value as "CALL" | "PUT" })}
                      className="bg-surface-elevated border border-border px-1 py-0.5">
                      <option>CALL</option><option>PUT</option>
                    </select>
                  </td>
                  <td className="px-1.5 py-1 text-right">
                    <input type="number" value={leg.strike} onChange={e => updateLeg(i, { strike: +e.target.value || 0 })}
                      className="w-16 bg-surface-elevated border border-border px-1 py-0.5 text-right" />
                  </td>
                  <td className="px-1.5 py-1 text-right">
                    <input type="date" value={leg.expiry} onChange={e => updateLeg(i, { expiry: e.target.value })}
                      className="bg-surface-elevated border border-border px-1 py-0.5" />
                  </td>
                  <td className="px-1.5 py-1 text-right text-down">{p.bid.toFixed(2)}</td>
                  <td className="px-1.5 py-1 text-right text-accent font-bold">{p.mid.toFixed(2)}</td>
                  <td className="px-1.5 py-1 text-right text-up">{p.ask.toFixed(2)}</td>
                  <td className="px-1.5 py-1 text-right text-muted-foreground">{p.spread.toFixed(2)}</td>
                  <td className="px-1.5 py-1 text-right">
                    <span className={p.liq >= 4 ? "text-up" : p.liq >= 2 ? "text-accent" : "text-down"}>{"●".repeat(p.liq)}</span>
                  </td>
                  <td className="px-1.5 py-1 text-right">
                    <button onClick={() => removeLeg(i)} className="text-muted-foreground hover:text-down"><Trash2 size={12} /></button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>

          <button onClick={addLeg} className="flex items-center gap-1 text-[10px] font-mono text-accent hover:text-foreground border border-border px-2 py-1">
            <Plus size={12} /> Add leg
          </button>

          <div className="grid grid-cols-4 gap-2 border-t border-border pt-2 text-[10px] font-mono">
            <div><div className="text-muted-foreground uppercase text-[8px]">Net {netDebit >= 0 ? "Debit" : "Credit"}</div><div className={`text-[13px] font-bold ${netDebit >= 0 ? "text-down" : "text-up"}`}>${Math.abs(netDebit).toFixed(0)}</div></div>
            <div><div className="text-muted-foreground uppercase text-[8px]">Liquidity</div><div className={`text-[13px] font-bold ${avgLiq >= 4 ? "text-up" : avgLiq >= 2 ? "text-accent" : "text-down"}`}>{"●".repeat(avgLiq)}{"○".repeat(5-avgLiq)}</div></div>
            <div><div className="text-muted-foreground uppercase text-[8px]">Est. slip</div><div className="text-[13px] font-bold text-foreground">{slipBps} bps</div></div>
            <div><div className="text-muted-foreground uppercase text-[8px]">BP impact</div><div className="text-[13px] font-bold text-foreground">${Math.abs(Math.round(netDebit * 1.2)).toLocaleString()}</div></div>
          </div>

          <div className="flex gap-2 pt-2 border-t border-border">
            <button onClick={saveTemplate} disabled={working}
              className="px-3 py-1.5 text-[10px] font-mono border border-border text-foreground hover:border-accent hover:text-accent disabled:opacity-30">SAVE TEMPLATE</button>
            <button onClick={() => toast({ title: "Dry-run", description: `Would route ${legs.length} legs via IBKR bridge` })}
              className="px-3 py-1.5 text-[10px] font-mono border border-border text-foreground hover:border-accent hover:text-accent">DRY RUN</button>
            <button onClick={() => toast({ title: "Order submitted (mock)", description: `${ticker} ${legs.length}-leg @ mid` })}
              className="ml-auto px-4 py-1.5 text-[10px] font-mono bg-accent text-accent-foreground font-bold">SEND</button>
            <button onClick={onClose} className="px-2 py-1.5 text-muted-foreground hover:text-foreground"><X size={14} /></button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
