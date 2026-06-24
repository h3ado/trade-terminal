// Alert Engine — drawer with rule list, add/remove, mock evaluator triggers toasts.
import { useEffect, useState } from "react";
import { Sheet, SheetContent, SheetHeader, SheetTitle } from "@/components/ui/sheet";
import { toast } from "@/components/ui/use-toast";
import { apiGet, apiPost, apiPatch, apiDelete } from "@/lib/api";
import { Trash2, Plus } from "lucide-react";

interface AlertRule {
  id: string;
  name: string;
  ticker: string | null;
  rule_type: string;
  params: Record<string, unknown>;
  enabled: boolean;
}

const RULE_TYPES = [
  { v: "gex_flip", l: "GEX zero-Γ cross" },
  { v: "iv_pop", l: "IV ≥ Nth percentile" },
  { v: "oi_surge", l: "OI surge Δ%" },
  { v: "flow_print", l: "Dealer flow $ premium" },
  { v: "gamma_migration", l: "Zero-Γ migration > N strikes" },
];

interface Props { open: boolean; onClose: () => void; }

export default function AlertsDrawer({ open, onClose }: Props) {
  const [rules, setRules] = useState<AlertRule[]>([]);
  const [events, setEvents] = useState<{ ts: number; msg: string }[]>([]);
  const [draft, setDraft] = useState({ name: "", ticker: "", rule_type: "gex_flip", threshold: "" });

  useEffect(() => {
    if (!open) return;
    apiGet<AlertRule[]>('/api/option-alert-rules').then(setRules).catch(() => {});
  }, [open]);

  // Mock evaluator: every 12s, randomly trigger an enabled rule.
  useEffect(() => {
    const id = setInterval(() => {
      const active = rules.filter(r => r.enabled);
      if (!active.length) return;
      if (Math.random() > 0.6) {
        const r = active[Math.floor(Math.random() * active.length)];
        const msg = `${r.ticker ?? "ANY"} · ${r.name}`;
        setEvents(prev => [{ ts: Date.now(), msg }, ...prev].slice(0, 30));
        toast({ title: "ALRT triggered", description: msg });
      }
    }, 12000);
    return () => clearInterval(id);
  }, [rules]);

  const addRule = async () => {
    if (!draft.name) return;
    try {
      const data = await apiPost<AlertRule>('/api/option-alert-rules', {
        name: draft.name, ticker: draft.ticker || null,
        ruleType: draft.rule_type, params: { threshold: draft.threshold }, enabled: true,
      });
      setRules(p => [data, ...p]);
      setDraft({ name: "", ticker: "", rule_type: "gex_flip", threshold: "" });
    } catch (e: any) { toast({ title: "Add failed", description: e.message }); }
  };

  const removeRule = async (id: string) => {
    await apiDelete(`/api/option-alert-rules/${id}`).catch(() => {});
    setRules(p => p.filter(r => r.id !== id));
  };

  const toggleRule = async (r: AlertRule) => {
    await apiPatch(`/api/option-alert-rules/${r.id}`, { enabled: !r.enabled }).catch(() => {});
    setRules(p => p.map(x => x.id === r.id ? { ...x, enabled: !x.enabled } : x));
  };

  return (
    <Sheet open={open} onOpenChange={(v) => !v && onClose()}>
      <SheetContent className="bg-surface-deep border-border w-[400px] sm:max-w-[400px]">
        <SheetHeader>
          <SheetTitle className="text-[12px] font-mono uppercase tracking-wider text-accent">ALRT · Alert Engine</SheetTitle>
        </SheetHeader>

        <div className="space-y-3 mt-3">
          <div className="border border-border bg-surface-elevated p-2 space-y-1.5">
            <div className="text-[9px] font-mono text-muted-foreground uppercase tracking-wider">New rule</div>
            <input value={draft.name} onChange={e => setDraft(p => ({ ...p, name: e.target.value }))} placeholder="Name"
              className="w-full bg-surface-deep border border-border px-2 py-1 text-[10px] font-mono focus:outline-none focus:border-accent" />
            <div className="grid grid-cols-2 gap-1">
              <input value={draft.ticker} onChange={e => setDraft(p => ({ ...p, ticker: e.target.value.toUpperCase() }))} placeholder="Ticker (or blank)"
                className="bg-surface-deep border border-border px-2 py-1 text-[10px] font-mono focus:outline-none focus:border-accent" />
              <input value={draft.threshold} onChange={e => setDraft(p => ({ ...p, threshold: e.target.value }))} placeholder="Threshold"
                className="bg-surface-deep border border-border px-2 py-1 text-[10px] font-mono focus:outline-none focus:border-accent" />
            </div>
            <select value={draft.rule_type} onChange={e => setDraft(p => ({ ...p, rule_type: e.target.value }))}
              className="w-full bg-surface-deep border border-border px-2 py-1 text-[10px] font-mono">
              {RULE_TYPES.map(r => <option key={r.v} value={r.v}>{r.l}</option>)}
            </select>
            <button onClick={addRule} className="flex items-center gap-1 px-2 py-1 text-[10px] font-mono bg-accent text-accent-foreground font-bold">
              <Plus size={12} /> Add rule
            </button>
          </div>

          <div className="space-y-1">
            <div className="text-[9px] font-mono text-muted-foreground uppercase tracking-wider">Active rules ({rules.length})</div>
            {rules.map(r => (
              <div key={r.id} className="flex items-center gap-2 border border-border bg-surface-elevated px-2 py-1">
                <button onClick={() => toggleRule(r)} className={`text-[9px] font-mono px-1.5 ${r.enabled ? "bg-up text-background" : "bg-muted text-muted-foreground"}`}>{r.enabled ? "ON" : "OFF"}</button>
                <div className="flex-1 min-w-0">
                  <div className="text-[10px] font-mono text-foreground truncate">{r.name}</div>
                  <div className="text-[9px] font-mono text-muted-foreground">{r.ticker ?? "ANY"} · {r.rule_type}</div>
                </div>
                <button onClick={() => removeRule(r.id)} className="text-muted-foreground hover:text-down"><Trash2 size={12} /></button>
              </div>
            ))}
            {rules.length === 0 && <div className="text-[10px] font-mono text-muted-foreground italic">No rules yet.</div>}
          </div>

          <div className="space-y-1">
            <div className="text-[9px] font-mono text-muted-foreground uppercase tracking-wider">Recent triggers</div>
            {events.length === 0 && <div className="text-[10px] font-mono text-muted-foreground italic">Waiting…</div>}
            {events.map(e => (
              <div key={e.ts} className="text-[10px] font-mono border-l-2 border-accent pl-2">
                <span className="text-muted-foreground">{new Date(e.ts).toLocaleTimeString()}</span> <span className="text-foreground">{e.msg}</span>
              </div>
            ))}
          </div>
        </div>
      </SheetContent>
    </Sheet>
  );
}
