// Perplexity Sonar wrapper — citation-rich deep search.
import { corsHeaders } from "https://esm.sh/@supabase/supabase-js@2.95.0/cors";
import { z } from "https://esm.sh/zod@3.23.8";

const BodySchema = z.object({
  query: z.string().min(2).max(400),
  recency: z.enum(["hour", "day", "week", "month"]).default("day"),
});

Deno.serve(async (req: Request) => {
  if (req.method === "OPTIONS") return new Response("ok", { headers: corsHeaders });
  if (req.method !== "POST") return new Response(JSON.stringify({ error: "method" }), { status: 405, headers: corsHeaders });
  try {
    const auth = req.headers.get("Authorization") ?? "";
    if (!auth.startsWith("Bearer ")) return new Response(JSON.stringify({ error: "unauthorized" }), { status: 401, headers: { ...corsHeaders, "Content-Type": "application/json" } });

    const parsed = BodySchema.safeParse(await req.json().catch(() => ({})));
    if (!parsed.success) return new Response(JSON.stringify({ error: parsed.error.flatten().fieldErrors }), { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } });
    const { query, recency } = parsed.data;

    const pkey = Deno.env.get("PERPLEXITY_API_KEY");
    if (!pkey) {
      return new Response(JSON.stringify({ error: "no_perplexity", message: "Connect Perplexity in Connectors to enable DEEP search." }), { status: 503, headers: { ...corsHeaders, "Content-Type": "application/json" } });
    }

    const r = await fetch("https://api.perplexity.ai/chat/completions", {
      method: "POST",
      headers: { Authorization: `Bearer ${pkey}`, "Content-Type": "application/json" },
      body: JSON.stringify({
        model: "sonar-pro",
        messages: [
          { role: "system", content: "You are a markets research analyst. Be concise, factual, cite all claims. Use bullet points." },
          { role: "user", content: query },
        ],
        search_recency_filter: recency,
      }),
    });
    if (!r.ok) {
      const t = await r.text().catch(() => "");
      return new Response(JSON.stringify({ error: "perplexity_error", status: r.status, detail: t.slice(0, 200) }), { status: 502, headers: { ...corsHeaders, "Content-Type": "application/json" } });
    }
    const j = await r.json();
    return new Response(JSON.stringify({
      answer: j?.choices?.[0]?.message?.content ?? "",
      citations: j?.citations ?? [],
      model: j?.model ?? "sonar-pro",
    }), { headers: { ...corsHeaders, "Content-Type": "application/json" } });
  } catch (err) {
    const msg = err instanceof Error ? err.message : "unknown";
    return new Response(JSON.stringify({ error: msg }), { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } });
  }
});
