// AI thesis engine — generates structured trading thesis from headlines + context.
import { corsHeaders } from "https://esm.sh/@supabase/supabase-js@2.95.0/cors";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.95.0";
import { z } from "https://esm.sh/zod@3.23.8";

const BodySchema = z.object({
  scope: z.enum(["global", "country", "ticker", "keyword"]),
  value: z.string().max(120).default(""),
  headlines: z.array(z.object({
    title: z.string().max(400),
    domain: z.string().max(120).optional(),
    seendate: z.string().max(40).optional(),
    tone: z.number().optional(),
  })).max(60),
  cot: z.unknown().optional(),
});

const SYSTEM = `You are a senior macro PM. Output STRICT JSON matching the schema. Be concise, factual, never invent data.

Schema:
{
  "stance": "bullish" | "bearish" | "neutral",
  "conviction": integer 0-100,
  "key_drivers": string[] (3-6 bullets, <=20 words each),
  "counter_drivers": string[] (2-4 bullets, <=20 words each),
  "catalysts_next_7d": string[] (2-5 bullets with dates if known),
  "suggested_trades": string[] (1-3 short ideas, e.g. "Long XLE vs short SPY"),
  "summary": string (1 sentence, <=30 words)
}`;

Deno.serve(async (req: Request) => {
  if (req.method === "OPTIONS") return new Response("ok", { headers: corsHeaders });
  if (req.method !== "POST") return new Response(JSON.stringify({ error: "method" }), { status: 405, headers: corsHeaders });
  try {
    const auth = req.headers.get("Authorization") ?? "";
    if (!auth.startsWith("Bearer ")) return new Response(JSON.stringify({ error: "unauthorized" }), { status: 401, headers: { ...corsHeaders, "Content-Type": "application/json" } });

    const body = await req.json().catch(() => ({}));
    const parsed = BodySchema.safeParse(body);
    if (!parsed.success) return new Response(JSON.stringify({ error: parsed.error.flatten().fieldErrors }), { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } });
    const { scope, value, headlines, cot } = parsed.data;

    const scopeKey = `${scope}:${value || "_"}`;
    const sb = createClient(Deno.env.get("SUPABASE_URL")!, Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!);
    const { data: cached } = await sb.from("news_thesis_cache").select("payload, generated_at").eq("scope_key", scopeKey).maybeSingle();
    if (cached && Date.now() - new Date(cached.generated_at as string).getTime() < 15 * 60 * 1000) {
      return new Response(JSON.stringify({ ...(cached.payload as object), cached: true }), { headers: { ...corsHeaders, "Content-Type": "application/json" } });
    }

    const apiKey = Deno.env.get("LOVABLE_API_KEY");
    if (!apiKey) return new Response(JSON.stringify({ error: "LOVABLE_API_KEY missing" }), { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } });

    const headlinesText = headlines.slice(0, 50).map((h, i) => `${i + 1}. [${h.domain ?? "?"}] ${h.title}`).join("\n");
    const cotText = cot ? `\n\nCOT positioning context:\n${JSON.stringify(cot).slice(0, 800)}` : "";
    const userPrompt = `Scope: ${scope}${value ? ` (${value})` : ""}\n\nLast 72h headlines:\n${headlinesText}${cotText}`;

    const aiRes = await fetch("https://ai.gateway.lovable.dev/v1/chat/completions", {
      method: "POST",
      headers: { Authorization: `Bearer ${apiKey}`, "Content-Type": "application/json" },
      body: JSON.stringify({
        model: "google/gemini-2.5-pro",
        response_format: { type: "json_object" },
        messages: [{ role: "system", content: SYSTEM }, { role: "user", content: userPrompt }],
      }),
    });
    if (aiRes.status === 429) return new Response(JSON.stringify({ error: "ai_rate_limit" }), { status: 429, headers: { ...corsHeaders, "Content-Type": "application/json" } });
    if (aiRes.status === 402) return new Response(JSON.stringify({ error: "ai_credits" }), { status: 402, headers: { ...corsHeaders, "Content-Type": "application/json" } });
    if (!aiRes.ok) return new Response(JSON.stringify({ error: "ai_error" }), { status: 502, headers: { ...corsHeaders, "Content-Type": "application/json" } });

    const aiJson = await aiRes.json();
    const content = aiJson?.choices?.[0]?.message?.content ?? "{}";
    let thesis: unknown = {};
    try { thesis = JSON.parse(content); } catch { thesis = { error: "parse_failed", raw: content }; }

    await sb.from("news_thesis_cache").upsert({ scope_key: scopeKey, payload: thesis, generated_at: new Date().toISOString() });

    return new Response(JSON.stringify(thesis), { headers: { ...corsHeaders, "Content-Type": "application/json" } });
  } catch (err) {
    const msg = err instanceof Error ? err.message : "unknown";
    return new Response(JSON.stringify({ error: msg }), { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } });
  }
});
