// Weekly news quiz generator. Pulls last 7d of headlines via GDELT,
// asks Lovable AI to write 10 MCQs, caches per ISO week so all users see same quiz.
import { corsHeaders } from "https://esm.sh/@supabase/supabase-js@2.95.0/cors";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.95.0";

function isoWeekMonday(d = new Date()): string {
  const date = new Date(Date.UTC(d.getUTCFullYear(), d.getUTCMonth(), d.getUTCDate()));
  const day = date.getUTCDay() || 7; // 1..7, Mon=1
  if (day !== 1) date.setUTCDate(date.getUTCDate() - (day - 1));
  return date.toISOString().slice(0, 10);
}

async function fetchHeadlines(): Promise<{ title: string; domain: string; seendate: string; url: string }[]> {
  // GDELT DOC 2.0 — last 7 days, English, top markets / business
  const url = "https://api.gdeltproject.org/api/v2/doc/doc?query=(market%20OR%20economy%20OR%20fed%20OR%20oil%20OR%20earnings%20OR%20inflation%20OR%20geopolitics)%20sourcelang:eng&mode=artlist&maxrecords=100&timespan=1w&sort=hybridrel&format=json";
  try {
    const r = await fetch(url);
    if (!r.ok) return [];
    const j = await r.json();
    const arr = (j?.articles ?? []) as Array<{ title: string; domain: string; seendate: string; url: string }>;
    // Dedup by title prefix
    const seen = new Set<string>();
    const out: typeof arr = [];
    for (const a of arr) {
      const k = (a.title || "").slice(0, 60).toLowerCase();
      if (!k || seen.has(k)) continue;
      seen.add(k);
      out.push(a);
      if (out.length >= 60) break;
    }
    return out;
  } catch {
    return [];
  }
}

const SYSTEM = `You are a Bloomberg news desk editor writing a weekly news quiz.
Given 30-60 real headlines from the past week, write EXACTLY 10 multiple-choice questions.
Mix categories: Markets, Macro, Geopolitics, Energy, Crypto, Corporate.
Mix difficulty: 4 easy, 4 medium, 2 hard.
Each question must be answerable from the headlines provided — do not invent facts.
Return ONLY valid JSON matching this shape:
{
 "questions": [
  {
   "id": "q1",
   "category": "Markets" | "Macro" | "Geopolitics" | "Energy" | "Crypto" | "Corporate",
   "difficulty": "Easy" | "Medium" | "Hard",
   "question": "string (<= 180 chars)",
   "choices": ["A", "B", "C", "D"],
   "answerIndex": 0,
   "explanation": "1 sentence, <= 200 chars",
   "sources": [{"title":"...", "domain":"...", "url":"...", "seendate":"..."}]
  }
 ]
}`;

Deno.serve(async (req: Request) => {
  if (req.method === "OPTIONS") return new Response("ok", { headers: corsHeaders });
  if (req.method !== "POST") {
    return new Response(JSON.stringify({ error: "method not allowed" }), {
      status: 405, headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }

  try {
    const auth = req.headers.get("Authorization") ?? "";
    if (!auth.startsWith("Bearer ")) {
      return new Response(JSON.stringify({ error: "unauthorized" }), {
        status: 401, headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }
    const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
    const anonKey = Deno.env.get("SUPABASE_ANON_KEY")!;
    const serviceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
    const sb = createClient(supabaseUrl, anonKey, { global: { headers: { Authorization: auth } } });
    const { data: userData } = await sb.auth.getUser();
    if (!userData?.user) {
      return new Response(JSON.stringify({ error: "unauthorized" }), {
        status: 401, headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const body = await req.json().catch(() => ({}));
    const weekStart = typeof body?.weekStart === "string" && /^\d{4}-\d{2}-\d{2}$/.test(body.weekStart)
      ? body.weekStart : isoWeekMonday();

    // Cache check
    const admin = createClient(supabaseUrl, serviceKey);
    const { data: cached } = await admin.from("quiz_cache").select("payload").eq("week_start", weekStart).maybeSingle();
    if (cached?.payload) {
      return new Response(JSON.stringify({ weekStart, ...cached.payload, cached: true }), {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const headlines = await fetchHeadlines();
    if (headlines.length < 10) {
      return new Response(JSON.stringify({ error: "no_headlines" }), {
        status: 503, headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const apiKey = Deno.env.get("LOVABLE_API_KEY");
    if (!apiKey) {
      return new Response(JSON.stringify({ error: "LOVABLE_API_KEY missing" }), {
        status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const headlinesText = headlines.slice(0, 50).map((h, i) =>
      `${i + 1}. [${h.domain}] ${h.title} (${h.seendate}) <${h.url}>`
    ).join("\n");

    const aiRes = await fetch("https://ai.gateway.lovable.dev/v1/chat/completions", {
      method: "POST",
      headers: { "Authorization": `Bearer ${apiKey}`, "Content-Type": "application/json" },
      body: JSON.stringify({
        model: "google/gemini-2.5-flash",
        response_format: { type: "json_object" },
        messages: [
          { role: "system", content: SYSTEM },
          { role: "user", content: `Week of ${weekStart}. Headlines:\n${headlinesText}` },
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
      return new Response(JSON.stringify({ error: "ai_error", detail: t.slice(0, 300) }), {
        status: 502, headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const aiJson = await aiRes.json();
    const content = aiJson?.choices?.[0]?.message?.content ?? "{}";
    let parsed: { questions?: unknown[] };
    try { parsed = JSON.parse(content); } catch {
      return new Response(JSON.stringify({ error: "ai_parse", detail: content.slice(0, 300) }), {
        status: 502, headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }
    if (!Array.isArray(parsed.questions) || parsed.questions.length < 5) {
      return new Response(JSON.stringify({ error: "ai_shape" }), {
        status: 502, headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const payload = { questions: parsed.questions.slice(0, 10), generatedAt: new Date().toISOString() };
    await admin.from("quiz_cache").upsert({ week_start: weekStart, payload });

    return new Response(JSON.stringify({ weekStart, ...payload, cached: false }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (err) {
    const msg = err instanceof Error ? err.message : "unknown";
    return new Response(JSON.stringify({ error: msg }), {
      status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
