// Commodity production sites — major oil/gas fields, LNG terminals, mines, and ag belts.
// Rendered as colored bubbles on the globe sized by relative output. Static curated dataset
// (no live feed needed for v1) — the goal is to show the *origin* end of the trade chain
// that pairs with our chokepoints (transit) and shipping arcs (destination).
import { useEffect, useMemo } from 'react';
import type ThreeGlobe from 'three-globe';

export type CommodityType =
  | 'oil'        // crude / oil field / oil hub
  | 'gas'        // LNG terminal / gas field
  | 'copper'
  | 'lithium'
  | 'gold'
  | 'iron'
  | 'agri';      // grain / soy / corn / wheat belt

export type CommoditySite = {
  id: string;
  name: string;
  country: string;
  type: CommodityType;
  lat: number;
  lng: number;
  /** Relative output 0..1 used for bubble size + altitude. */
  output: number;
  /** Short note shown in tooltip (operator, capacity). */
  note: string;
};

// Curated set of globally significant production / export nodes.
// Outputs are *relative weights*, not absolute values — calibrated so the
// most important sites pop visually without dwarfing everything else.
export const COMMODITY_SITES: CommoditySite[] = [
  // ─── Oil — supergiant fields & export hubs ───────────────────────────
  { id: 'ghawar',       name: 'Ghawar Field',           country: 'SAU', type: 'oil', lat: 25.43, lng: 49.83, output: 1.00, note: 'Saudi Aramco · ~3.8 mb/d' },
  { id: 'rumaila',      name: 'Rumaila Field',          country: 'IRQ', type: 'oil', lat: 30.00, lng: 47.50, output: 0.55, note: 'BP/CNPC · ~1.4 mb/d' },
  { id: 'permian',      name: 'Permian Basin',          country: 'USA', type: 'oil', lat: 31.80, lng: -102.40, output: 0.95, note: 'US shale · ~6.2 mb/d' },
  { id: 'bakken',       name: 'Bakken Formation',       country: 'USA', type: 'oil', lat: 47.80, lng: -103.30, output: 0.45, note: 'US shale · ~1.2 mb/d' },
  { id: 'urals',        name: 'Western Siberia',        country: 'RUS', type: 'oil', lat: 61.25, lng: 73.40, output: 0.85, note: 'Rosneft/Lukoil · ~6.0 mb/d' },
  { id: 'cantarell',    name: 'Cantarell',              country: 'MEX', type: 'oil', lat: 19.40, lng: -92.20, output: 0.30, note: 'Pemex offshore' },
  { id: 'campos',       name: 'Campos / Santos Basin',  country: 'BRA', type: 'oil', lat: -22.40, lng: -40.10, output: 0.55, note: 'Petrobras pre-salt · ~3.4 mb/d' },
  { id: 'kashagan',     name: 'Kashagan',               country: 'KAZ', type: 'oil', lat: 46.10, lng: 51.50, output: 0.40, note: 'NCOC · ~0.4 mb/d' },
  { id: 'forties',      name: 'Forties Field',          country: 'GBR', type: 'oil', lat: 57.73, lng: 0.98, output: 0.25, note: 'North Sea · Apache' },
  { id: 'bonny',        name: 'Bonny Light',            country: 'NGA', type: 'oil', lat: 4.45, lng: 7.17, output: 0.40, note: 'Shell terminal' },
  { id: 'ras-tanura',   name: 'Ras Tanura Terminal',    country: 'SAU', type: 'oil', lat: 26.65, lng: 50.16, output: 0.90, note: 'World\'s largest oil port' },

  // ─── LNG / gas hubs ──────────────────────────────────────────────────
  { id: 'qatar-lng',    name: 'Ras Laffan LNG',         country: 'QAT', type: 'gas', lat: 25.91, lng: 51.55, output: 0.95, note: 'QatarEnergy · 77 Mtpa' },
  { id: 'sabine-pass',  name: 'Sabine Pass LNG',        country: 'USA', type: 'gas', lat: 29.74, lng: -93.87, output: 0.80, note: 'Cheniere · 30 Mtpa' },
  { id: 'gorgon',       name: 'Gorgon LNG',             country: 'AUS', type: 'gas', lat: -20.68, lng: 115.55, output: 0.65, note: 'Chevron · 15.6 Mtpa' },
  { id: 'yamal',        name: 'Yamal LNG',              country: 'RUS', type: 'gas', lat: 71.27, lng: 72.05, output: 0.55, note: 'Novatek · 17.4 Mtpa' },
  { id: 'bintulu',      name: 'Bintulu LNG',            country: 'MYS', type: 'gas', lat: 3.23, lng: 113.05, output: 0.55, note: 'Petronas · 30 Mtpa' },
  { id: 'henry-hub',    name: 'Henry Hub',              country: 'USA', type: 'gas', lat: 30.00, lng: -92.50, output: 0.70, note: 'US natgas benchmark' },
  { id: 'groningen',    name: 'Groningen Field',        country: 'NLD', type: 'gas', lat: 53.30, lng: 6.83, output: 0.20, note: 'Winding down' },

  // ─── Copper ──────────────────────────────────────────────────────────
  { id: 'escondida',    name: 'Escondida',              country: 'CHL', type: 'copper', lat: -24.27, lng: -69.07, output: 1.00, note: 'BHP · world\'s #1 Cu mine' },
  { id: 'collahuasi',   name: 'Collahuasi',             country: 'CHL', type: 'copper', lat: -20.97, lng: -68.72, output: 0.65, note: 'Anglo/Glencore · 600 kt/y' },
  { id: 'grasberg',     name: 'Grasberg',               country: 'IDN', type: 'copper', lat: -4.06, lng: 137.12, output: 0.80, note: 'Freeport · Cu + Au' },
  { id: 'kamoa',        name: 'Kamoa-Kakula',           country: 'COD', type: 'copper', lat: -10.75, lng: 25.27, output: 0.55, note: 'Ivanhoe · highest-grade' },
  { id: 'oyu-tolgoi',   name: 'Oyu Tolgoi',             country: 'MNG', type: 'copper', lat: 43.00, lng: 106.85, output: 0.45, note: 'Rio Tinto' },
  { id: 'morenci',      name: 'Morenci',                country: 'USA', type: 'copper', lat: 33.07, lng: -109.37, output: 0.40, note: 'Freeport-McMoRan' },

  // ─── Lithium ─────────────────────────────────────────────────────────
  { id: 'salar-atacama',name: 'Salar de Atacama',       country: 'CHL', type: 'lithium', lat: -23.50, lng: -68.25, output: 1.00, note: 'SQM/Albemarle brine' },
  { id: 'greenbushes',  name: 'Greenbushes',            country: 'AUS', type: 'lithium', lat: -33.87, lng: 116.06, output: 0.95, note: 'Tianqi/Albemarle · spodumene' },
  { id: 'salar-uyuni',  name: 'Salar de Uyuni',         country: 'BOL', type: 'lithium', lat: -20.13, lng: -67.49, output: 0.30, note: 'Largest reserves, low output' },
  { id: 'pilbara',      name: 'Pilgangoora',            country: 'AUS', type: 'lithium', lat: -21.10, lng: 118.95, output: 0.55, note: 'Pilbara Minerals' },
  { id: 'jiangxi',      name: 'Yichun (Jiangxi)',       country: 'CHN', type: 'lithium', lat: 27.81, lng: 114.40, output: 0.50, note: 'Lepidolite · Ganfeng' },

  // ─── Gold ────────────────────────────────────────────────────────────
  { id: 'nevada-gold',  name: 'Nevada Gold Mines',      country: 'USA', type: 'gold', lat: 40.50, lng: -116.40, output: 1.00, note: 'Barrick/Newmont JV · 3.3 Moz' },
  { id: 'muruntau',     name: 'Muruntau',               country: 'UZB', type: 'gold', lat: 41.50, lng: 64.60, output: 0.85, note: 'NMMC · world\'s largest open pit' },
  { id: 'olimpiada',    name: 'Olimpiada',              country: 'RUS', type: 'gold', lat: 59.30, lng: 92.95, output: 0.70, note: 'Polyus · 1.4 Moz' },
  { id: 'pueblo-viejo', name: 'Pueblo Viejo',           country: 'DOM', type: 'gold', lat: 18.97, lng: -70.17, output: 0.50, note: 'Barrick/Newmont' },
  { id: 'kibali',       name: 'Kibali',                 country: 'COD', type: 'gold', lat: 3.18, lng: 29.55, output: 0.45, note: 'Barrick/AngloGold' },
  { id: 'cadia',        name: 'Cadia',                  country: 'AUS', type: 'gold', lat: -33.45, lng: 148.96, output: 0.55, note: 'Newmont' },

  // ─── Iron ore ────────────────────────────────────────────────────────
  { id: 'pilbara-iron', name: 'Pilbara Iron',           country: 'AUS', type: 'iron', lat: -22.50, lng: 119.00, output: 1.00, note: 'BHP/Rio/FMG · ~900 Mt/y' },
  { id: 'carajas',      name: 'Carajás',                country: 'BRA', type: 'iron', lat: -6.07, lng: -50.16, output: 0.80, note: 'Vale · highest-grade' },
  { id: 'mesabi',       name: 'Mesabi Range',           country: 'USA', type: 'iron', lat: 47.50, lng: -92.50, output: 0.30, note: 'Cleveland-Cliffs' },
  { id: 'kursk',        name: 'Kursk Magnetic',         country: 'RUS', type: 'iron', lat: 51.30, lng: 37.50, output: 0.45, note: 'Metalloinvest' },

  // ─── Agriculture (grain belts) ───────────────────────────────────────
  { id: 'us-corn',      name: 'US Corn Belt',           country: 'USA', type: 'agri', lat: 41.50, lng: -93.00, output: 1.00, note: 'IA/IL/NE corn + soy' },
  { id: 'br-soy',       name: 'Mato Grosso Soy',        country: 'BRA', type: 'agri', lat: -12.00, lng: -56.00, output: 0.95, note: 'World\'s #1 soy exporter' },
  { id: 'ar-pampas',    name: 'Argentine Pampas',       country: 'ARG', type: 'agri', lat: -34.50, lng: -62.00, output: 0.70, note: 'Soy + corn + wheat' },
  { id: 'ua-wheat',     name: 'Ukraine Wheat Belt',     country: 'UKR', type: 'agri', lat: 49.00, lng: 32.00, output: 0.60, note: 'Black Sea grain' },
  { id: 'ru-wheat',     name: 'Russian Black Earth',    country: 'RUS', type: 'agri', lat: 51.50, lng: 42.00, output: 0.85, note: 'World\'s #1 wheat exporter' },
  { id: 'au-wheat',     name: 'WA Wheatbelt',           country: 'AUS', type: 'agri', lat: -32.00, lng: 117.50, output: 0.50, note: 'Western Australia' },
  { id: 'in-punjab',    name: 'Punjab/Haryana',         country: 'IND', type: 'agri', lat: 30.50, lng: 75.50, output: 0.65, note: 'Wheat + rice basket' },
  { id: 'cn-northeast', name: 'NE China Plains',        country: 'CHN', type: 'agri', lat: 45.00, lng: 125.00, output: 0.75, note: 'Heilongjiang corn + soy' },
  { id: 'ca-prairies',  name: 'Canadian Prairies',      country: 'CAN', type: 'agri', lat: 51.00, lng: -106.00, output: 0.60, note: 'Wheat + canola' },
  { id: 'fr-grain',     name: 'Beauce / Picardy',       country: 'FRA', type: 'agri', lat: 49.50, lng: 2.50, output: 0.45, note: 'EU\'s #1 grain producer' },
];

const TYPE_META: Record<CommodityType, { label: string; hue: number; sat: number; light: number }> = {
  oil:     { label: 'Oil',         hue: 28,  sat: 95, light: 55 },
  gas:     { label: 'Gas / LNG',   hue: 195, sat: 90, light: 60 },
  copper:  { label: 'Copper',      hue: 18,  sat: 75, light: 50 },
  lithium: { label: 'Lithium',     hue: 280, sat: 70, light: 65 },
  gold:    { label: 'Gold',        hue: 48,  sat: 95, light: 55 },
  iron:    { label: 'Iron Ore',    hue: 0,   sat: 60, light: 50 },
  agri:    { label: 'Agriculture', hue: 110, sat: 65, light: 50 },
};

export const COMMODITY_TYPE_META = TYPE_META;

export function commodityColor(type: CommodityType, opacity = 1): string {
  const m = TYPE_META[type];
  return `hsla(${m.hue}, ${m.sat}%, ${m.light}%, ${opacity})`;
}

/**
 * Renders commodity production sites as bubbles using three-globe's `customLayerData`.
 * We use the custom layer (not points) because:
 *  - the exchanges layer already owns `pointsData`
 *  - bubble heights/colors must vary per commodity type
 *  - `customLayerData` accepts arbitrary Object3D meshes
 */
export function useCommoditySitesLayer(
  globeRef: React.RefObject<ThreeGlobe>,
  enabled: boolean,
  opacity: number,
  typeFilter: Set<CommodityType> | null,
) {
  const data = useMemo(() => {
    if (!enabled) return [];
    return COMMODITY_SITES.filter(s => !typeFilter || typeFilter.has(s.type));
  }, [enabled, typeFilter]);

  useEffect(() => {
    const g = globeRef.current;
    if (!g) return;
    if (!enabled || data.length === 0) {
      try { (g as any).customLayerData([]); } catch { /* noop */ }
      return;
    }
    // Use three-globe's built-in HTML elements for hover labels, plus custom
    // 3D meshes for the bubble itself.
    import('three').then((THREE) => {
      (g as any)
        .customLayerData(data)
        .customLayerLat((d: CommoditySite) => d.lat)
        .customLayerLng((d: CommoditySite) => d.lng)
        .customLayerAltitude((d: CommoditySite) => 0.012 + d.output * 0.06)
        .customThreeObject((d: CommoditySite) => {
          const radius = 0.6 + d.output * 1.6;
          const geom = new THREE.SphereGeometry(radius, 16, 16);
          const mat = new THREE.MeshBasicMaterial({
            color: new THREE.Color(commodityColor(d.type, 1)),
            transparent: true,
            opacity,
          });
          const mesh = new THREE.Mesh(geom, mat);
          (mesh as any).__commodity = d;
          return mesh;
        })
        .customThreeObjectUpdate((obj: any, d: CommoditySite) => {
          // Re-anchor altitude when data updates
          const alt = 0.012 + d.output * 0.06;
          Object.assign(obj.position, (g as any).getCoords(d.lat, d.lng, alt));
        });
    });
  }, [globeRef, data, enabled, opacity]);
}
