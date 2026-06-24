// Live subsea cable feed. Pulls TeleGeography's public submarine cable map
// dataset (open-source GeoJSON on GitHub Pages, no key needed).
// Cached 24h at the edge — cable data changes slowly.
import { corsHeaders } from "https://esm.sh/@supabase/supabase-js@2.95.0/cors";

// TeleGeography publishes the submarine cable map data as GeoJSON.
// The cable file contains LineString features with metadata (name, owners, RFS).
const CABLE_FEED = "https://www.submarinecablemap.com/api/v3/cable/cable-geo.json";

type CableOut = {
  id: string;
  name: string;
  owner?: string;
  inService?: number;
  capacityTbps?: number;
  path: [number, number][];
};

function pickPath(geom: any): [number, number][] {
  if (!geom) return [];
  if (geom.type === "LineString") return geom.coordinates as [number, number][];
  if (geom.type === "MultiLineString") {
    // Flatten to longest segment so the SVG renderer draws one continuous line.
    const parts = geom.coordinates as [number, number][][];
    return parts.reduce((a, b) => (b.length > a.length ? b : a), []);
  }
  return [];
}

Deno.serve(async (req: Request) => {
  if (req.method === "OPTIONS") return new Response("ok", { headers: corsHeaders });
  try {
    const r = await fetch(CABLE_FEED, { headers: { "User-Agent": "lovable-globe/1.0" } });
    if (!r.ok) throw new Error(`upstream ${r.status}`);
    const json = await r.json();
    const cables: CableOut[] = (json.features ?? [])
      .map((f: any): CableOut | null => {
        const p = f.properties ?? {};
        const path = pickPath(f.geometry);
        if (path.length < 2) return null;
        const rfs = Number(String(p.rfs ?? p.in_service ?? "").slice(0, 4));
        return {
          id: String(f.id ?? p.slug ?? p.name ?? crypto.randomUUID()),
          name: String(p.name ?? "Unnamed cable"),
          owner: p.owners ? String(p.owners) : undefined,
          inService: Number.isFinite(rfs) && rfs > 1900 ? rfs : undefined,
          // Capacity isn't in the public dataset — leave undefined; UI handles it.
          path,
        };
      })
      .filter(Boolean) as CableOut[];
    return new Response(JSON.stringify({ cables, fetchedAt: Date.now() }), {
      headers: {
        ...corsHeaders,
        "Content-Type": "application/json",
        "Cache-Control": "public, max-age=86400",
      },
    });
  } catch (e) {
    return new Response(JSON.stringify({ error: String(e), cables: [] }), {
      status: 502,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
