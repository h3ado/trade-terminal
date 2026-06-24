// Options Copilot — streaming AI with mock-data tool calls.
import "https://deno.land/x/xhr@0.1.0/mod.ts";
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

// ── Mock data tools (mirror the deterministic seeds used in the UI) ──
function hash(s: string): number { let h = 2166136261; for (let i = 0; i < s.length; i++) { h ^= s.charCodeAt(i); h = Math.imul(h, 16777619); } return h >>> 0; }
function rng(seed: number) { let a = seed; return () => { a |= 0; a = (a + 0x6D2B79F5) | 0; let t = a; t = Math.imul(t ^ (t >>> 15), t | 1); t ^= t + Math.imul(t ^ (t >>> 7), t | 61); return ((t ^ (t >>> 14)) >>> 0) / 4294967296; }; }

function getRegime(ticker: string) {
  const r = rng(hash(ticker + ":dpi-snap"));
  const spot = +(480 + r() * 60).toFixed(2);
  const zeroG = +(spot + (r() - 0.5) * 8).toFixed(2);
  const netGex = Math.round((r() - 0.45) * 4_500_000_000);
  return {
    ticker, spot, zeroG,
    distToZeroPct: +(((zeroG - spot) / spot) * 100).toFixed(2),
    netGex,
    regime: netGex >= 0 ? "long-gamma" : "short-gamma",
    interpretation: netGex >= 0 ? "Dealers buy dips / sell rips. Pinning likely." : "Dealers chase trends. Vol expansion risk.",
    flipProb: Math.round(20 + r() * 65),
  };
}

function getGex(ticker: string) {
  const r = rng(hash(ticker + ":gex"));
  return {
    ticker,
    netGex: Math.round((r() - 0.45) * 4_500_000_000),
    callGex: Math.round(r() * 3_000_000_000),
    putGex: Math.round(-r() * 2_500_000_000),
    largestCallWall: Math.round(480 + r() * 30),
    largestPutWall: Math.round(450 + r() * 30),
  };
}

function getIv(ticker: string) {
  const r = rng(hash(ticker + ":iv"));
  const atm = +(15 + r() * 25).toFixed(1);
  return {
    ticker, atmIv: atm,
    ivRank: Math.round(r() * 100),
    ivPctl: Math.round(r() * 100),
    rv20: +(atm * (0.7 + r() * 0.5)).toFixed(1),
    skew25d: +((r() - 0.5) * 6).toFixed(2),
    termSlope: +((r() - 0.5) * 4).toFixed(2),
  };
}

function screen(filter: { minIvRank?: number; maxIvRank?: number; positiveSkew?: boolean }) {
  const universe = ["SPY", "QQQ", "AAPL", "NVDA", "TSLA", "IWM", "META", "AMZN", "MSFT", "GOOG", "AMD", "COIN"];
  const matches = universe.map(t => ({ ticker: t, ...getIv(t) }))
    .filter(x => filter.minIvRank ? x.ivRank >= filter.minIvRank : true)
    .filter(x => filter.maxIvRank ? x.ivRank <= filter.maxIvRank : true)
    .filter(x => filter.positiveSkew ? x.skew25d > 0 : true)
    .slice(0, 8);
  return { matches };
}

function buildStrategy(template: string, ticker: string) {
  const presets: Record<string, any[]> = {
    "long-call": [{ side: "LONG", type: "CALL", strikeOffset: 0, dte: 30, qty: 1 }],
    "bull-call-spread": [
      { side: "LONG", type: "CALL", strikeOffset: 0, dte: 30, qty: 1 },
      { side: "SHORT", type: "CALL", strikeOffset: 10, dte: 30, qty: 1 },
    ],
    "iron-condor": [
      { side: "SHORT", type: "PUT", strikeOffset: -10, dte: 30, qty: 1 },
      { side: "LONG", type: "PUT", strikeOffset: -20, dte: 30, qty: 1 },
      { side: "SHORT", type: "CALL", strikeOffset: 10, dte: 30, qty: 1 },
      { side: "LONG", type: "CALL", strikeOffset: 20, dte: 30, qty: 1 },
    ],
  };
  return { ticker, template, legs: presets[template] ?? presets["long-call"] };
}

const TOOLS = [
  { type: "function", function: { name: "getRegime", description: "Get current dealer gamma regime, zero-gamma level, and flip probability for a ticker.", parameters: { type: "object", properties: { ticker: { type: "string" } }, required: ["ticker"] } } },
  { type: "function", function: { name: "getGex", description: "Get gamma exposure snapshot: net/call/put GEX and largest walls.", parameters: { type: "object", properties: { ticker: { type: "string" } }, required: ["ticker"] } } },
  { type: "function", function: { name: "getIv", description: "Get IV metrics: ATM IV, IV rank/percentile, RV20, 25-delta skew, term slope.", parameters: { type: "object", properties: { ticker: { type: "string" } }, required: ["ticker"] } } },
  { type: "function", function: { name: "screen", description: "Screen universe for IV/skew setups.", parameters: { type: "object", properties: { minIvRank: { type: "number" }, maxIvRank: { type: "number" }, positiveSkew: { type: "boolean" } } } } },
  { type: "function", function: { name: "buildStrategy", description: "Build a multi-leg strategy template for a ticker.", parameters: { type: "object", properties: { template: { type: "string", enum: ["long-call", "bull-call-spread", "iron-condor"] }, ticker: { type: "string" } }, required: ["template", "ticker"] } } },
];

function runTool(name: string, args: any) {
  switch (name) {
    case "getRegime": return getRegime(args.ticker);
    case "getGex": return getGex(args.ticker);
    case "getIv": return getIv(args.ticker);
    case "screen": return screen(args);
    case "buildStrategy": return buildStrategy(args.template, args.ticker);
    default: return { error: "unknown tool" };
  }
}

serve(async (req) => {
  if (req.method === "OPTIONS") return new Response("ok", { headers: corsHeaders });

  try {
    const { messages, context } = await req.json();
    const LOVABLE_API_KEY = Deno.env.get("LOVABLE_API_KEY");
    if (!LOVABLE_API_KEY) throw new Error("LOVABLE_API_KEY not configured");

    const system = `You are an Options Copilot for a Bloomberg-style terminal. Be terse, analytical, and cite the numbers you used. Format with markdown — short headers, bullet points, code spans for tickers and numbers. Current context: ticker=${context?.ticker ?? "SPY"} module=${context?.module ?? "dash"}. When the user says "this" or "current", assume they mean ${context?.ticker}. Use tools whenever the user asks about positioning, regime, IV, screening, or strategy building. After tool results, give a 2-4 sentence narrated read, not a JSON dump.`;

    // First call — let the model choose tools (non-streaming so we can collect tool_calls).
    let working = [{ role: "system", content: system }, ...messages];
    for (let iter = 0; iter < 3; iter++) {
      const planRes = await fetch("https://ai.gateway.lovable.dev/v1/chat/completions", {
        method: "POST",
        headers: { Authorization: `Bearer ${LOVABLE_API_KEY}`, "Content-Type": "application/json" },
        body: JSON.stringify({ model: "google/gemini-3-flash-preview", messages: working, tools: TOOLS, tool_choice: "auto" }),
      });
      if (planRes.status === 429) return new Response(JSON.stringify({ error: "Rate limited" }), { status: 429, headers: { ...corsHeaders, "Content-Type": "application/json" } });
      if (planRes.status === 402) return new Response(JSON.stringify({ error: "Credits required" }), { status: 402, headers: { ...corsHeaders, "Content-Type": "application/json" } });
      if (!planRes.ok) {
        const t = await planRes.text();
        console.error("plan error", planRes.status, t);
        return new Response(JSON.stringify({ error: "AI gateway error" }), { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } });
      }
      const plan = await planRes.json();
      const msg = plan.choices?.[0]?.message;
      if (!msg) break;
      const toolCalls = msg.tool_calls || [];
      if (toolCalls.length === 0) {
        // No more tools — stream a final reply
        break;
      }
      working.push(msg);
      for (const tc of toolCalls) {
        let args = {};
        try { args = JSON.parse(tc.function.arguments || "{}"); } catch {}
        const result = runTool(tc.function.name, args);
        working.push({ role: "tool", tool_call_id: tc.id, content: JSON.stringify(result) });
      }
    }

    // Streaming final answer
    const streamRes = await fetch("https://ai.gateway.lovable.dev/v1/chat/completions", {
      method: "POST",
      headers: { Authorization: `Bearer ${LOVABLE_API_KEY}`, "Content-Type": "application/json" },
      body: JSON.stringify({ model: "google/gemini-3-flash-preview", messages: working, stream: true }),
    });
    if (!streamRes.ok || !streamRes.body) {
      const t = await streamRes.text();
      console.error("stream error", streamRes.status, t);
      return new Response(JSON.stringify({ error: "Stream failed" }), { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } });
    }
    return new Response(streamRes.body, { headers: { ...corsHeaders, "Content-Type": "text/event-stream" } });
  } catch (e) {
    console.error("copilot error", e);
    return new Response(JSON.stringify({ error: e instanceof Error ? e.message : "Unknown" }), { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } });
  }
});
