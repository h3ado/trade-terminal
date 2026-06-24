// Daily wrap — 6-bullet end-of-day summary. Stored in news_daily_wrap.
import { corsHeaders } from "https://esm.sh/@supabase/supabase-js@2.95.0/cors";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.95.0";
import { z } from "https://esm.sh/zod@3.23.8";

const BodySchema = z.object({
  headlines: z.array(z.object({
    title: z.string().max(400),
    domain: z.string().max(120).optional(),
  })).max(120).default([]),
  force: z.boolean().default(false),
});

const SYSTEM = `You are a Bloomberg desk closer. Produce a 6-bullet end-of-day market wrap (US close).
Output STRICT JSON: { "headline": string, "bullets": [ { "label": "MOVERS"|"DATA"|"GEOPOL"|"CB"|"ENERGY"|"TOMORROW", "text": string } ], "tomorrow_catalysts": string[] }
Each bullet text <= 30 words. Be specific (numbers, tickers).`;

Deno.serve(async (req: Request) => {
  if (req.method === "OPTIONS") return new Response("ok", { headers: corsHeaders });
  try {
    const sb = createClient(Deno.env.get("SUPABASE_URL")!, Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!);
    const today = new Date().toISOString().slice(0, 10);

    if (req.method === "GET") {
      const { data } = await sb.from("news_daily_wrap").select("*").order("wrap_date", { ascending: false }).limit(7);
      return new Response(JSON.stringify({ wraps: data ?? [] }), { headers: { ...corsHeaders, "Content-Type": "application/json" } });
    }

    const parsed = BodySchema.safeParse(await req.json().catch(() => ({})));
    if (!parsed.success) return new Response(JSON.stringify({ error: parsed.error.flatten().fieldErrors }), { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } });
    const { headlines, force } = parsed.data;

    if (!force) {
      const { data: existing } = await sb.from("news_daily_wrap").select("*").eq("wrap_date", today).maybeSingle();
      if (existing) return new Response(JSON.stringify(existing), { headers: { ...corsHeaders, "Content-Type": "application/json" } });
    }
    if (headlines.length === 0) return new Response(JSON.stringify({ error: "no_headlines" }), { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } });

    const apiKey = Deno.env.get("LOVABLE_API_KEY")!;
    const text = headlines.slice(0, 100).map((h, i) => `${i + 1}. [${h.domain ?? "?"}] ${h.title}`).join("\n");
    const aiRes = await fetch("https://ai.gateway.lovable.dev/v1/chat/completions", {
      method: "POST",
      headers: { Authorization: `Bearer ${apiKey}`, "Content-Type": "application/json" },
      body: JSON.stringify({
        model: "google/gemini-2.5-pro",
        response_format: { type: "json_object" },
        messages: [{ role: "system", content: SYSTEM }, { role: "user", content: `Today: ${today}\n\nHeadlines:\n${text}` }],
      }),
    });
    if (!aiRes.ok) return new Response(JSON.stringify({ error: "ai_error", status: aiRes.status }), { status: aiRes.status === 402 ? 402 : 502, headers: { ...corsHeaders, "Content-Type": "application/json" } });
    let summary: unknown = {};
    try { summary = JSON.parse((await aiRes.json())?.choices?.[0]?.message?.content ?? "{}"); } catch { summary = {}; }

    const row = { wrap_date: today, summary, generated_at: new Date().toISOString() };
    await sb.from("news_daily_wrap").upsert(row);
    return new Response(JSON.stringify(row), { headers: { ...corsHeaders, "Content-Type": "application/json" } });
  } catch (err) {
    const msg = err instanceof Error ? err.message : "unknown";
    return new Response(JSON.stringify({ error: msg }), { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } });
  }
});
