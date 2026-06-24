// AI brief for the NEWS terminal — uses Lovable AI Gateway (no extra key).
// Summarizes a cluster of headlines into a Bloomberg-desk style brief.
import { corsHeaders } from "https://esm.sh/@supabase/supabase-js@2.95.0/cors";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.95.0";
import { z } from "https://esm.sh/zod@3.23.8";

const BodySchema = z.object({
  scope: z.enum(["global", "country", "ticker", "keyword", "cluster"]),
  value: z.string().max(120).default(""),
  headlines: z.array(z.object({
    title: z.string().max(400),
    url: z.string().max(800).optional(),
    domain: z.string().max(120).optional(),
    seendate: z.string().max(40).optional(),
    tone: z.number().optional(),
  })).max(40).default([]),
});

const SYSTEM_PROMPT = `You are a Bloomberg-desk macro analyst. Given a cluster of news headlines, produce:
1) A 5-bullet brief, each bullet <=22 words, fact-only, no fluff.
2) "Market angle:" one line on what this means for traders (assets, regions, sectors).
3) "Risk:" a single integer 0-10 (10 = systemic).
Use Markdown. Cite domains in parentheses, not URLs. Never invent facts beyond the supplied headlines.`;

Deno.serve(async (req: Request) => {
  if (req.method === "OPTIONS") return new Response("ok", { headers: corsHeaders });
  if (req.method !== "POST") {
    return new Response(JSON.stringify({ error: "method not allowed" }), {
      status: 405, headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }

  try {
    // Auth
    const auth = req.headers.get("Authorization") ?? "";
    if (!auth.startsWith("Bearer ")) {
      return new Response(JSON.stringify({ error: "unauthorized" }), {
        status: 401, headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }
    const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
    const anonKey = Deno.env.get("SUPABASE_ANON_KEY")!;
    const sb = createClient(supabaseUrl, anonKey, { global: { headers: { Authorization: auth } } });
    const { data: userData } = await sb.auth.getUser();
    const user = userData?.user;
    if (!user) {
      return new Response(JSON.stringify({ error: "unauthorized" }), {
        status: 401, headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    // Validate body
    const body = await req.json().catch(() => ({}));
    const parsed = BodySchema.safeParse(body);
    if (!parsed.success) {
      return new Response(JSON.stringify({ error: parsed.error.flatten().fieldErrors }), {
        status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }
    const { scope, value, headlines } = parsed.data;

    // Rate-limit: 10 briefs / hour / user
    const since = new Date(Date.now() - 60 * 60 * 1000).toISOString();
    const { count } = await sb
      .from("news_brief_log")
      .select("id", { count: "exact", head: true })
      .gte("created_at", since);
    if ((count ?? 0) >= 10) {
      return new Response(JSON.stringify({ error: "rate_limit", message: "10 briefs/hour limit reached" }), {
        status: 429, headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    if (headlines.length === 0) {
      return new Response(JSON.stringify({ error: "no_headlines" }), {
        status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const apiKey = Deno.env.get("LOVABLE_API_KEY");
    if (!apiKey) {
      return new Response(JSON.stringify({ error: "LOVABLE_API_KEY missing" }), {
        status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const headlinesText = headlines.slice(0, 30).map((h, i) =>
      `${i + 1}. [${h.domain ?? "?"}] ${h.title}${h.tone != null ? ` (tone ${h.tone.toFixed(1)})` : ""}`
    ).join("\n");

    const userPrompt = `Scope: ${scope}${value ? ` (${value})` : ""}\n\nHeadlines:\n${headlinesText}`;

    const aiRes = await fetch("https://ai.gateway.lovable.dev/v1/chat/completions", {
      method: "POST",
      headers: {
        "Authorization": `Bearer ${apiKey}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        model: "google/gemini-2.5-flash",
        messages: [
          { role: "system", content: SYSTEM_PROMPT },
          { role: "user", content: userPrompt },
        ],
      }),
    });

    if (aiRes.status === 429) {
      return new Response(JSON.stringify({ error: "ai_rate_limit" }), {
        status: 429, headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }
    if (aiRes.status === 402) {
      return new Response(JSON.stringify({ error: "ai_credits" }), {
        status: 402, headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }
    if (!aiRes.ok) {
      const t = await aiRes.text().catch(() => "");
      return new Response(JSON.stringify({ error: "ai_error", detail: t.slice(0, 200) }), {
        status: 502, headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const aiJson = await aiRes.json();
    const brief = aiJson?.choices?.[0]?.message?.content ?? "";

    // Risk score from the brief
    const m = /Risk:\s*([0-9]{1,2})/i.exec(brief);
    const riskScore = m ? Math.max(0, Math.min(10, parseInt(m[1], 10))) : null;

    // Citations = unique domains we passed in
    const citations = Array.from(new Set(
      headlines.map((h) => h.domain).filter((d): d is string => !!d),
    )).slice(0, 12);

    // Log
    await sb.from("news_brief_log").insert({ user_id: user.id, scope, value });

    return new Response(JSON.stringify({ brief, citations, riskScore }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (err) {
    const msg = err instanceof Error ? err.message : "unknown";
    return new Response(JSON.stringify({ error: msg }), {
      status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
