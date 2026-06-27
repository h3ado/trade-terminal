// AI Options Copilot — floating right-rail chat panel with streaming.
import { useState, useRef, useEffect, KeyboardEvent } from "react";
import ReactMarkdown from "react-markdown";
import { X, Send } from "lucide-react";
import { toast } from "@/components/ui/sonner";
import { apiPost } from "@/lib/api";

interface Msg { role: "user" | "assistant"; content: string }

interface Props {
  open: boolean;
  onClose: () => void;
  ticker: string;
  module: string;
}

export default function CopilotPanel({ open, onClose, ticker, module }: Props) {
  const [messages, setMessages] = useState<Msg[]>([]);
  const [input, setInput] = useState("");
  const [streaming, setStreaming] = useState(false);
  const scrollRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    scrollRef.current?.scrollTo({ top: scrollRef.current.scrollHeight, behavior: "smooth" });
  }, [messages]);

  if (!open) return null;

  const send = async () => {
    const text = input.trim();
    if (!text || streaming) return;
    const userMsg: Msg = { role: "user", content: text };
    const next = [...messages, userMsg];
    setMessages(next);
    setInput("");
    setStreaming(true);

    let assistant = "";
    const upsert = (chunk: string) => {
      assistant += chunk;
      setMessages(prev => {
        const last = prev[prev.length - 1];
        if (last?.role === "assistant") {
          return prev.map((m, i) => i === prev.length - 1 ? { ...m, content: assistant } : m);
        }
        return [...prev, { role: "assistant", content: assistant }];
      });
    };

    try {
      const resp = await apiPost<{ text?: string }>("/api/market/options/options-copilot", { messages: next, ticker, module });
      upsert(resp.text ?? "");
    } catch (e) {
      console.error(e);
      toast.error("Copilot error", { description: e instanceof Error ? e.message : "Unknown" });
    } finally {
      setStreaming(false);
    }
  };

  const onKey = (e: KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === "Enter" && !e.shiftKey) { e.preventDefault(); send(); }
  };

  const suggestions = [
    "Explain the current GEX positioning",
    "Find cheap vol setups",
    "What's the dealer regime?",
    "Build a defined-risk earnings play",
  ];

  return (
    <div className="fixed top-0 right-0 bottom-0 w-full sm:w-[420px] bg-surface-deep border-l border-border flex flex-col z-50 shadow-2xl">
      <div className="flex items-center justify-between border-b border-border px-3 py-2 bg-background">
        <div className="flex items-baseline gap-2">
          <span className="text-[11px] font-mono font-bold text-accent">AISK</span>
          <span className="text-[10px] font-mono uppercase tracking-wider">Options Copilot</span>
          <span className="text-[9px] font-mono text-muted-foreground">{ticker} · {module.toUpperCase()}</span>
        </div>
        <button onClick={onClose} className="text-muted-foreground hover:text-foreground"><X size={14} /></button>
      </div>

      <div ref={scrollRef} className="flex-1 overflow-y-auto p-3 space-y-3">
        {messages.length === 0 && (
          <div className="space-y-2">
            <div className="text-[10px] font-mono text-muted-foreground uppercase tracking-wider">Try asking</div>
            {suggestions.map(s => (
              <button key={s} onClick={() => setInput(s)}
                className="block w-full text-left text-[10px] font-mono border border-border bg-surface-elevated hover:border-accent px-2 py-1.5">
                {s}
              </button>
            ))}
          </div>
        )}
        {messages.map((m, i) => (
          <div key={i} className={`text-[11px] font-mono ${m.role === "user" ? "text-foreground" : "text-foreground/90"}`}>
            <div className={`text-[9px] uppercase tracking-wider mb-1 ${m.role === "user" ? "text-accent" : "text-up"}`}>
              {m.role === "user" ? "you" : "copilot"}
            </div>
            <div className={`border-l-2 ${m.role === "user" ? "border-accent" : "border-up"} pl-2 prose prose-invert prose-sm max-w-none [&_p]:my-1 [&_pre]:bg-surface-elevated [&_code]:text-accent`}>
              <ReactMarkdown>{m.content || (streaming && i === messages.length - 1 ? "…" : "")}</ReactMarkdown>
            </div>
          </div>
        ))}
      </div>

      <div className="border-t border-border p-2">
        <div className="flex gap-2">
          <textarea
            value={input}
            onChange={e => setInput(e.target.value)}
            onKeyDown={onKey}
            placeholder="Ask the copilot…"
            rows={2}
            className="flex-1 bg-surface-elevated border border-border px-2 py-1.5 text-[11px] font-mono resize-none focus:outline-none focus:border-accent"
          />
          <button onClick={send} disabled={streaming || !input.trim()}
            className="px-3 bg-accent text-accent-foreground font-bold disabled:opacity-30">
            <Send size={14} />
          </button>
        </div>
        <div className="text-[8px] font-mono text-muted-foreground mt-1">Press ? to toggle · Enter to send · Shift+Enter newline</div>
      </div>
    </div>
  );
}
