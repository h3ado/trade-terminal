// OFAC SDN sanctions list — direct from US Treasury (free, no key, public domain).
// We pull the consolidated sanctions list (XML index) and bucket entities by
// country code. Cached 24h at the edge — the list updates daily at most.
import { corsHeaders } from "https://esm.sh/@supabase/supabase-js@2.95.0/cors";

// Treasury OFAC consolidated SDN list in XML format (direct, no redirect).
const FEED = "https://sanctionslistservice.ofac.treas.gov/api/publicationpreview/exports/sdn.xml";

// ISO-A3 -> ISO-A2 fallback for the country names that appear in OFAC entries.
// Keep this small — most entries either omit country or use a recognizable form.
const NAME_TO_ISO2: Record<string, string> = {
  "RUSSIA": "RU", "IRAN": "IR", "NORTH KOREA": "KP", "KOREA, NORTH": "KP",
  "SYRIA": "SY", "CUBA": "CU", "VENEZUELA": "VE", "BELARUS": "BY",
  "BURMA": "MM", "MYANMAR": "MM", "CHINA": "CN", "AFGHANISTAN": "AF",
  "IRAQ": "IQ", "LIBYA": "LY", "LEBANON": "LB", "YEMEN": "YE",
  "SUDAN": "SD", "SOUTH SUDAN": "SS", "SOMALIA": "SO", "ZIMBABWE": "ZW",
  "UKRAINE": "UA", "NICARAGUA": "NI", "MALI": "ML", "CENTRAL AFRICAN REPUBLIC": "CF",
  "DEMOCRATIC REPUBLIC OF THE CONGO": "CD", "ETHIOPIA": "ET", "TURKEY": "TR",
  "PAKISTAN": "PK", "INDIA": "IN", "PHILIPPINES": "PH", "MEXICO": "MX",
  "COLOMBIA": "CO", "BRAZIL": "BR", "PANAMA": "PA", "HAITI": "HT",
  "PALESTINIAN": "PS", "WEST BANK": "PS", "GAZA": "PS",
};

Deno.serve(async (req: Request) => {
  if (req.method === "OPTIONS") return new Response("ok", { headers: corsHeaders });
  try {
    const r = await fetch(FEED, { headers: { "User-Agent": "lovable-globe/1.0", "Accept": "application/xml" } });
    if (!r.ok) throw new Error(`ofac ${r.status}`);
    const xml = await r.text();

    const byCountry = new Map<string, { count: number; entities: string[] }>();
    // Cheap regex parse — we only need the country tag + lastName per entry.
    // Each <sdnEntry> has zero or more <address><country>...</country></address>
    // and a <lastName> or <firstName>+<lastName>.
    const entries = xml.split("<sdnEntry>");
    for (const e of entries) {
      const countries = [...e.matchAll(/<country>([^<]+)<\/country>/gi)].map(m => m[1].trim());
      if (countries.length === 0) continue;
      const lastName = (e.match(/<lastName>([^<]+)<\/lastName>/i)?.[1] ?? "").trim();
      const firstName = (e.match(/<firstName>([^<]+)<\/firstName>/i)?.[1] ?? "").trim();
      const name = [firstName, lastName].filter(Boolean).join(" ").trim() || "Unknown";
      const seen = new Set<string>();
      for (const country of countries) {
        const upper = country.toUpperCase();
        const iso = NAME_TO_ISO2[upper] ?? (country.length === 2 ? upper : null);
        if (!iso || seen.has(iso)) continue;
        seen.add(iso);
        let agg = byCountry.get(iso);
        if (!agg) { agg = { count: 0, entities: [] }; byCountry.set(iso, agg); }
        agg.count += 1;
        if (agg.entities.length < 5) agg.entities.push(name);
      }
    }
    const countries = [...byCountry.entries()].map(([iso, v]) => ({
      iso, count: v.count, entities: v.entities,
    })).sort((a, b) => b.count - a.count);
    return new Response(JSON.stringify({ countries, fetchedAt: Date.now() }), {
      headers: { ...corsHeaders, "Content-Type": "application/json", "Cache-Control": "public, max-age=86400" },
    });
  } catch (e) {
    return new Response(JSON.stringify({ error: String(e), countries: [] }), {
      status: 502, headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
