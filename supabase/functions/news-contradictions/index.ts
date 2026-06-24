// Contradiction detector — clusters headlines by entity, scores stance variance.
import { corsHeaders } from "https://esm.sh/@supabase/supabase-js@2.95.0/cors";
import { z } from "https://esm.sh/zod@3.23.8";

const BodySchema = z.object({
  headlines: z.array(z.object({
    title: z.string().max(400),
    url: z.string().max(800),
    domain: z.string().max(120).optional(),
  })).min(5).max(80),
});

const SYSTEM = `You analyze news for contradictions. Given headlines, identify clusters where 2+ sources disagree on the same entity (ticker, country, person, policy).
Output STRICT JSON: { "clusters": [ { "entity": string, "summary": string, "stance_variance": number 0-1, "headlines": [ { "url": string, "stance": "bull"|"bear"|"neutral" } ] } ] }
Only include clusters with stance_variance >= 0.4 and >= 2 conflicting sources. Max 6 clusters.`;

Deno.serve(async (req: Request) => {
  if (req.method === "OPTIONS") return new Response("ok", { headers: corsHeaders });
  if (req.method !== "POST") return new Response(JSON.stringify({ error: "method" }), { status: 405, headers: corsHeaders });
  try {
    const auth = req.headers.get("Authorization") ?? "";
    if (!auth.startsWith("Bearer ")) return new Response(JSON.stringify({ error: "unauthorized" }), { status: 401, headers: { ...corsHeaders, "Content-Type": "application/json" } });
    const parsed = BodySchema.safeParse(await req.json().catch(() => ({})));
    if (!parsed.success) return new Response(JSON.stringify({ error: parsed.error.flatten().fieldErrors }), { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } });

    const apiKey = Deno.env.get("LOVABLE_API_KEY")!;
    const text = parsed.data.headlines.slice(0, 60).map((h, i) => `${i + 1}. [${h.domain ?? "?"}] ${h.title} :: ${h.url}`).join("\n");
    const aiRes = await fetch("https://ai.gateway.lovable.dev/v1/chat/completions", {
      method: "POST",
      headers: { Authorization: `Bearer ${apiKey}`, "Content-Type": "application/json" },
      body: JSON.stringify({
        model: "google/gemini-2.5-flash",
        response_format: { type: "json_object" },
        messages: [{ role: "system", content: SYSTEM }, { role: "user", content: text }],
      }),
    });
    if (aiRes.status === 429) return new Response(JSON.stringify({ error: "ai_rate_limit" }), { status: 429, headers: { ...corsHeaders, "Content-Type": "application/json" } });
    if (aiRes.status === 402) return new Response(JSON.stringify({ error: "ai_credits" }), { status: 402, headers: { ...corsHeaders, "Content-Type": "application/json" } });
    if (!aiRes.ok) return new Response(JSON.stringify({ error: "ai_error" }), { status: 502, headers: { ...corsHeaders, "Content-Type": "application/json" } });
    const aiJson = await aiRes.json();
    let out: unknown = {};
    try { out = JSON.parse(aiJson?.choices?.[0]?.message?.content ?? "{}"); } catch { out = { clusters: [] }; }
    return new Response(JSON.stringify(out), { headers: { ...corsHeaders, "Content-Type": "application/json" } });
  } catch (err) {
    const msg = err instanceof Error ? err.message : "unknown";
    return new Response(JSON.stringify({ error: msg }), { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } });
  }
});
