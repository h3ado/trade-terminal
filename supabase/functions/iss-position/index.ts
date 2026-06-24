// Live ISS position. Primary: wheretheiss.at (HTTPS, no key, reliable).
// Fallback: open-notify (HTTP, often blocked in edge runtimes).
// Always returns HTTP 200 with a `fallback` flag on error so the client
// can degrade gracefully instead of treating it as a crash.
import { corsHeaders } from "https://esm.sh/@supabase/supabase-js@2.95.0/cors";

const PRIMARY_ISS = "https://api.wheretheiss.at/v1/satellites/25544";
const FALLBACK_ISS = "http://api.open-notify.org/iss-now.json";
const PEOPLE_URL = "http://api.open-notify.org/astros.json";

async function getIss(): Promise<{ lat: number; lng: number; ts: number } | null> {
  try {
    const r = await fetch(PRIMARY_ISS, { headers: { "User-Agent": "lovable-globe/1.0" } });
    if (r.ok) {
      const j = await r.json();
      const lat = Number(j?.latitude);
      const lng = Number(j?.longitude);
      if (Number.isFinite(lat) && Number.isFinite(lng)) {
        return { lat, lng, ts: (Number(j?.timestamp) || Math.floor(Date.now() / 1000)) * 1000 };
      }
    } else {
      await r.text();
    }
  } catch (e) {
    console.error("primary ISS fetch failed:", e);
  }
  try {
    const r = await fetch(FALLBACK_ISS, { headers: { "User-Agent": "lovable-globe/1.0" } });
    if (r.ok) {
      const j = await r.json();
      const lat = Number(j?.iss_position?.latitude);
      const lng = Number(j?.iss_position?.longitude);
      if (Number.isFinite(lat) && Number.isFinite(lng)) {
        return { lat, lng, ts: (Number(j?.timestamp) || Math.floor(Date.now() / 1000)) * 1000 };
      }
    } else {
      await r.text();
    }
  } catch (e) {
    console.error("fallback ISS fetch failed:", e);
  }
  return null;
}

async function getCrew(): Promise<{ name: string; craft: string }[]> {
  try {
    const r = await fetch(PEOPLE_URL, { headers: { "User-Agent": "lovable-globe/1.0" } });
    if (!r.ok) { await r.text(); return []; }
    const j = await r.json();
    return (j?.people ?? []).map((p: any) => ({ name: String(p.name ?? ""), craft: String(p.craft ?? "") }));
  } catch (e) {
    console.error("crew fetch failed:", e);
    return [];
  }
}

Deno.serve(async (req: Request) => {
  if (req.method === "OPTIONS") return new Response("ok", { headers: corsHeaders });
  try {
    const [iss, crew] = await Promise.all([getIss(), getCrew()]);
    if (!iss) {
      // Return 200 with a fallback signal — keeps the client out of error state.
      return new Response(
        JSON.stringify({ error: "ISS position unavailable", fallback: true, iss: null, crew, fetchedAt: Date.now() }),
        { status: 200, headers: { ...corsHeaders, "Content-Type": "application/json" } },
      );
    }
    return new Response(JSON.stringify({ iss, crew, fetchedAt: Date.now() }), {
      headers: { ...corsHeaders, "Content-Type": "application/json", "Cache-Control": "public, max-age=5" },
    });
  } catch (e) {
    console.error("iss-position fatal:", e);
    return new Response(
      JSON.stringify({ error: String(e), fallback: true, iss: null, crew: [] }),
      { status: 200, headers: { ...corsHeaders, "Content-Type": "application/json" } },
    );
  }
});
