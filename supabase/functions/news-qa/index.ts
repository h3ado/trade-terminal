// Headline Q&A — short grounded answer about a specific headline + context.
import { corsHeaders } from "https://esm.sh/@supabase/supabase-js@2.95.0/cors";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.95.0";
import { z } from "https://esm.sh/zod@3.23.8";

const BodySchema = z.object({
  question: z.string().min(2).max(400),
  headline: z.object({
    title: z.string().max(400),
    url: z.string().max(800).optional(),
    domain: z.string().max(120).optional(),
  }),
  context: z.array(z.object({
    title: z.string().max(400),
    domain: z.string().max(120).optional(),
  })).max(20).default([]),
  history: z.array(z.object({ role: z.enum(["user", "assistant"]), content: z.string().max(2000) })).max(8).default([]),
});

const SYSTEM = `You are a sell-side analyst answering trader questions about a specific headline. Be concise (<= 120 words), factual, cite domains in parentheses. If unsure, say so.`;

Deno.serve(async (req: Request) => {
  if (req.method === "OPTIONS") return new Response("ok", { headers: corsHeaders });
  if (req.method !== "POST") return new Response(JSON.stringify({ error: "method" }), { status: 405, headers: corsHeaders });
  try {
    const auth = req.headers.get("Authorization") ?? "";
    if (!auth.startsWith("Bearer ")) return new Response(JSON.stringify({ error: "unauthorized" }), { status: 401, headers: { ...corsHeaders, "Content-Type": "application/json" } });
    const sb = createClient(Deno.env.get("SUPABASE_URL")!, Deno.env.get("SUPABASE_ANON_KEY")!, { global: { headers: { Authorization: auth } } });
    const { data: userData } = await sb.auth.getUser();
    const user = userData?.user;
    if (!user) return new Response(JSON.stringify({ error: "unauthorized" }), { status: 401, headers: { ...corsHeaders, "Content-Type": "application/json" } });

    const parsed = BodySchema.safeParse(await req.json().catch(() => ({})));
    if (!parsed.success) return new Response(JSON.stringify({ error: parsed.error.flatten().fieldErrors }), { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } });
    const { question, headline, context, history } = parsed.data;

    const apiKey = Deno.env.get("LOVABLE_API_KEY")!;
    const ctx = context.length ? `\n\nRelated last 7d:\n${context.slice(0, 15).map((c, i) => `${i + 1}. [${c.domain ?? "?"}] ${c.title}`).join("\n")}` : "";
    const userPrompt = `Headline: [${headline.domain ?? "?"}] ${headline.title}${ctx}\n\nQuestion: ${question}`;

    const messages = [
      { role: "system", content: SYSTEM },
      ...history.map(h => ({ role: h.role, content: h.content })),
      { role: "user", content: userPrompt },
    ];

    const aiRes = await fetch("https://ai.gateway.lovable.dev/v1/chat/completions", {
      method: "POST",
      headers: { Authorization: `Bearer ${apiKey}`, "Content-Type": "application/json" },
      body: JSON.stringify({ model: "google/gemini-2.5-flash", messages }),
    });
    if (aiRes.status === 429) return new Response(JSON.stringify({ error: "ai_rate_limit" }), { status: 429, headers: { ...corsHeaders, "Content-Type": "application/json" } });
    if (aiRes.status === 402) return new Response(JSON.stringify({ error: "ai_credits" }), { status: 402, headers: { ...corsHeaders, "Content-Type": "application/json" } });
    if (!aiRes.ok) return new Response(JSON.stringify({ error: "ai_error" }), { status: 502, headers: { ...corsHeaders, "Content-Type": "application/json" } });
    const answer = (await aiRes.json())?.choices?.[0]?.message?.content ?? "";

    await sb.from("news_qa_log").insert({ user_id: user.id, headline_url: headline.url ?? "", question, answer });
    return new Response(JSON.stringify({ answer }), { headers: { ...corsHeaders, "Content-Type": "application/json" } });
  } catch (err) {
    const msg = err instanceof Error ? err.message : "unknown";
    return new Response(JSON.stringify({ error: msg }), { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } });
  }
});
