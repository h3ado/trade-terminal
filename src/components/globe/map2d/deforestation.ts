/**
 * Deforestation hotspot regions — critical for commodity traders (soy, palm oil,
 * beef, timber), carbon credit investors, and ESG/climate risk analysis.
 *
 * lossRateKm2yr: approximate annual tree cover loss (km²/yr, recent 3-yr avg).
 * driver: primary deforestation driver.
 * protection: legal status of the area.
 *
 * Sources: Global Forest Watch (Hansen/UMD), PRODES (Brazil), FAO FRA 2020,
 *          ESA Land Cover, Global Fire Emissions Database (GFED).
 */

export type DeforestationDriver =
  | 'agriculture'   // pasture / crop conversion
  | 'logging'       // commercial/illegal logging
  | 'mining'        // artisanal/industrial mining
  | 'fire'          // fire (intentional clearing + escaped)
  | 'infrastructure'; // roads, dams, urban expansion

export type ProtectionStatus = 'UNPROTECTED' | 'PARTIAL' | 'PROTECTED' | 'INDIGENOUS';

export type DeforestationFeature = {
  id: string;
  name: string;
  lat: number;
  lng: number;
  lossRateKm2yr: number;
  driver: DeforestationDriver;
  protection: ProtectionStatus;
  country: string;
  meta?: string;
  /** Commodity linkage (what's driving conversion) */
  commodity?: string;
};

export const DEFORESTATION_HOTSPOTS: DeforestationFeature[] = [

  // ── Brazilian Amazon ──────────────────────────────────────────────────────
  { id: 'amazon-para-east', name: 'Pará (Eastern Arc)', driver: 'agriculture',
    lat: -4.80, lng: -50.50, lossRateKm2yr: 6200, protection: 'UNPROTECTED',
    country: 'BR', commodity: 'beef/soy',
    meta: 'Highest absolute loss in Brazil; arc of deforestation frontier; BNDES/Cerrado connections' },
  { id: 'amazon-mato-grosso', name: 'Mato Grosso Deforestation Arc', driver: 'agriculture',
    lat: -11.50, lng: -55.00, lossRateKm2yr: 4800, protection: 'PARTIAL',
    country: 'BR', commodity: 'soy/corn',
    meta: 'World\'s largest soy exporter state; BR-163 corridor accelerating loss; MATOPIBA agri-frontier' },
  { id: 'amazon-rondonia', name: 'Rondônia (BR-364 corridor)', driver: 'agriculture',
    lat: -10.80, lng: -62.80, lossRateKm2yr: 2200, protection: 'UNPROTECTED',
    country: 'BR', commodity: 'beef/timber',
    meta: 'Classic fishbone deforestation pattern; illegal logging + cattle ranching; Madeira river basin' },
  { id: 'amazon-amazonas', name: 'Amazonas (Madeira tributaries)', driver: 'fire',
    lat: -6.50, lng: -64.00, lossRateKm2yr: 1800, protection: 'INDIGENOUS',
    country: 'BR', commodity: 'fire/gold',
    meta: 'Yanomami territory invasion by illegal gold miners (garimpeiros); 2023 humanitarian crisis' },
  { id: 'amazon-acre', name: 'Acre (Bolivia border)', driver: 'agriculture',
    lat: -9.50, lng: -70.50, lossRateKm2yr: 900, protection: 'PARTIAL',
    country: 'BR', commodity: 'beef',
    meta: 'Cross-border deforestation with Bolivia; IIRSA highway pressure' },
  { id: 'amazon-maranhao', name: 'Maranhão (cerrado-amazon transition)', driver: 'agriculture',
    lat: -5.50, lng: -46.50, lossRateKm2yr: 1200, protection: 'UNPROTECTED',
    country: 'BR', commodity: 'soy',
    meta: 'MATOPIBA frontier; rapid soy expansion on cerrado savanna' },

  // ── Brazilian Cerrado ──────────────────────────────────────────────────────
  { id: 'cerrado-bahia', name: 'Western Bahia (Cerrado)', driver: 'agriculture',
    lat: -12.00, lng: -45.00, lossRateKm2yr: 2800, protection: 'UNPROTECTED',
    country: 'BR', commodity: 'soy/cotton',
    meta: 'MATOPIBA hotspot; soy+cotton doubling area; less legally protected than Amazon' },
  { id: 'cerrado-mato-grosso-sul', name: 'Mato Grosso do Sul (Cerrado)', driver: 'agriculture',
    lat: -19.50, lng: -55.00, lossRateKm2yr: 1600, protection: 'PARTIAL',
    country: 'BR', commodity: 'soy/sugarcane',
    meta: 'Sugar+soy conversion; remnant cerrado patches under pressure' },
  { id: 'cerrado-goias', name: 'Goiás (Cerrado remnants)', driver: 'agriculture',
    lat: -15.50, lng: -49.50, lossRateKm2yr: 1400, protection: 'PARTIAL',
    country: 'BR', commodity: 'soy/ethanol',
    meta: 'Savanna corridor fragmenting; irrigation expansion for agri' },

  // ── Southeast Asia ────────────────────────────────────────────────────────
  { id: 'borneo-kalimantan', name: 'Kalimantan (Central)', driver: 'agriculture',
    lat: -1.50, lng: 113.50, lossRateKm2yr: 4200, protection: 'PARTIAL',
    country: 'ID', commodity: 'palm oil',
    meta: 'Fastest peat forest loss; RSPO-certified oil palm expanding but enforcement weak; orangutan critical' },
  { id: 'borneo-sabah', name: 'Sabah (Malaysia)', driver: 'agriculture',
    lat: 5.50, lng: 117.50, lossRateKm2yr: 800, protection: 'PARTIAL',
    country: 'MY', commodity: 'palm oil/timber',
    meta: 'Deforestation slowing but illegal logging persistent; palm oil #1 export' },
  { id: 'borneo-sarawak', name: 'Sarawak (Malaysia)', driver: 'logging',
    lat: 2.50, lng: 113.00, lossRateKm2yr: 600, protection: 'UNPROTECTED',
    country: 'MY', commodity: 'timber/palm oil',
    meta: 'Concession logging scandal; Taib Mahmud era legacy; some improvement post-2020' },
  { id: 'sumatra-riau', name: 'Riau (Sumatra peat)', driver: 'agriculture',
    lat: 0.50, lng: 102.00, lossRateKm2yr: 2400, protection: 'UNPROTECTED',
    country: 'ID', commodity: 'palm oil/pulp',
    meta: 'Peat fire capital of world (2015 mega-fires); APP/APRIL paper pulp controversies; drainage ongoing' },
  { id: 'sumatra-aceh', name: 'Aceh (Leuser Ecosystem)', driver: 'logging',
    lat: 3.80, lng: 97.50, lossRateKm2yr: 600, protection: 'INDIGENOUS',
    country: 'ID', commodity: 'timber',
    meta: 'Last place where tiger/elephant/orangutan/rhino co-exist; illegal logging from inside protected area' },
  { id: 'mekong-myanmar', name: 'Myanmar Uplands', driver: 'agriculture',
    lat: 21.00, lng: 96.50, lossRateKm2yr: 3200, protection: 'UNPROTECTED',
    country: 'MM', commodity: 'timber/agriculture',
    meta: 'Post-coup enforcement collapse; timber exports to China spike; hotspot since 2021' },
  { id: 'mekong-laos', name: 'Laos Northern Highlands', driver: 'infrastructure',
    lat: 20.50, lng: 103.00, lossRateKm2yr: 1200, protection: 'PARTIAL',
    country: 'LA', commodity: 'timber/agriculture',
    meta: 'Dam construction + BRI road corridor; Chinese concession agriculture; teak logging' },
  { id: 'mekong-cambodia', name: 'Cardamom Mountains / Mekong Cambodia', driver: 'agriculture',
    lat: 11.50, lng: 103.50, lossRateKm2yr: 900, protection: 'PARTIAL',
    country: 'KH', commodity: 'cassava/rubber',
    meta: 'Rapid cassava+rubber expansion; illegal concessions; protected area encroachment' },
  { id: 'papua-west', name: 'West Papua (Indonesia)', driver: 'agriculture',
    lat: -2.50, lng: 134.00, lossRateKm2yr: 1800, protection: 'INDIGENOUS',
    country: 'ID', commodity: 'palm oil',
    meta: 'Last frontier forest in Asia; massive palm oil concessions despite indigenous title' },
  { id: 'papua-new-guinea-hghlds', name: 'PNG Highlands', driver: 'logging',
    lat: -5.80, lng: 143.00, lossRateKm2yr: 600, protection: 'PARTIAL',
    country: 'PG', commodity: 'timber',
    meta: 'Customary land logging; SABLs (Special Agriculture & Business Leases) scandal' },

  // ── Congo Basin ───────────────────────────────────────────────────────────
  { id: 'congo-mai-ndombe', name: 'Mai-Ndombe (DRC)', driver: 'agriculture',
    lat: -2.50, lng: 18.50, lossRateKm2yr: 3600, protection: 'UNPROTECTED',
    country: 'CD', commodity: 'charcoal/cassava',
    meta: 'Africa\'s highest deforestation loss; subsistence + charcoal fuel for Kinshasa; 80% peatland' },
  { id: 'congo-tshopo', name: 'Tshopo (DRC)', driver: 'logging',
    lat: 0.50, lng: 25.00, lossRateKm2yr: 1800, protection: 'UNPROTECTED',
    country: 'CD', commodity: 'timber/charcoal',
    meta: 'Industrial logging concessions; illegal Chinese operators; ITTO monitoring gap' },
  { id: 'congo-equateur', name: 'Équateur Province (DRC)', driver: 'fire',
    lat: 1.00, lng: 20.50, lossRateKm2yr: 1400, protection: 'UNPROTECTED',
    country: 'CD', commodity: 'charcoal',
    meta: 'Shifting cultivation fires; population pressure; REDD+ projects active' },
  { id: 'cameroon-south', name: 'Cameroon Rainforest Belt', driver: 'logging',
    lat: 4.00, lng: 12.00, lossRateKm2yr: 900, protection: 'PARTIAL',
    country: 'CM', commodity: 'timber',
    meta: 'Forest Management Units (FMU) poorly policed; FSC certification gap; WCS Cameroon' },
  { id: 'gabon-ogooue', name: 'Gabon (Ogooué basin)', driver: 'logging',
    lat: -0.50, lng: 11.50, lossRateKm2yr: 300, protection: 'PARTIAL',
    country: 'GA', commodity: 'timber',
    meta: 'Relatively low but increasing; China-linked timber exports; national park buffer test' },

  // ── Latin America (non-Brazil) ────────────────────────────────────────────
  { id: 'chaco-bolivia', name: 'Gran Chaco (Bolivia)', driver: 'agriculture',
    lat: -18.00, lng: -61.50, lossRateKm2yr: 1400, protection: 'UNPROTECTED',
    country: 'BO', commodity: 'soy/beef',
    meta: 'Second-fastest deforestation globally by rate; Bolivian lowlands; soy+beef driven' },
  { id: 'chaco-paraguay', name: 'Gran Chaco (Paraguay)', driver: 'agriculture',
    lat: -20.50, lng: -60.00, lossRateKm2yr: 1200, protection: 'UNPROTECTED',
    country: 'PY', commodity: 'beef',
    meta: 'World\'s 2nd highest deforestation rate per capita; zero-deforestation law has loopholes' },
  { id: 'chaco-argentina', name: 'Argentine Chaco', driver: 'agriculture',
    lat: -27.00, lng: -61.00, lossRateKm2yr: 800, protection: 'PARTIAL',
    country: 'AR', commodity: 'soy',
    meta: 'Soy frontier push into dry forest; Salta/Santiago del Estero high deforestation rates' },
  { id: 'colombia-amazon', name: 'Colombian Amazon / Caquetá', driver: 'agriculture',
    lat: 1.00, lng: -74.50, lossRateKm2yr: 1800, protection: 'PARTIAL',
    country: 'CO', commodity: 'beef/coca',
    meta: 'Peace deal areas opened to colonisation; FARC withdrawal created deforestation surge 2016+' },
  { id: 'peru-amazon-madre', name: 'Madre de Dios (Peru)', driver: 'mining',
    lat: -12.00, lng: -70.80, lossRateKm2yr: 700, protection: 'INDIGENOUS',
    country: 'PE', commodity: 'gold',
    meta: 'Illegal artisanal gold mining (ASGM); mercury pollution in rivers; Madre de Dios protected area' },
  { id: 'ecuador-amazon', name: 'Ecuador Amazon (Sucumbíos)', driver: 'infrastructure',
    lat: -0.10, lng: -76.80, lossRateKm2yr: 500, protection: 'PARTIAL',
    country: 'EC', commodity: 'oil/agriculture',
    meta: 'Texaco/Chevron oil legacy; new Block 22 controversy; Amazon road frontier' },

  // ── Russia / Boreal ───────────────────────────────────────────────────────
  { id: 'russia-siberia-fires', name: 'Siberian Boreal Fires (Sakha/Krasnoyarsk)', driver: 'fire',
    lat: 63.00, lng: 125.00, lossRateKm2yr: 12000, protection: 'UNPROTECTED',
    country: 'RU', commodity: 'fire (climate-driven)',
    meta: 'Largest annual tree cover loss globally by area; permafrost thaw fires; carbon feedback loop' },
  { id: 'russia-komi-logging', name: 'Komi Republic Logging (Russia)', driver: 'logging',
    lat: 62.00, lng: 55.00, lossRateKm2yr: 800, protection: 'PARTIAL',
    country: 'RU', commodity: 'timber',
    meta: 'Primary boreal forest; illegal logging despite Komi\'s UNESCO status' },

  // ── West Africa ───────────────────────────────────────────────────────────
  { id: 'cote-ivoire-cocoa', name: 'Côte d\'Ivoire (Cocoa belt)', driver: 'agriculture',
    lat: 6.50, lng: -6.00, lossRateKm2yr: 1800, protection: 'UNPROTECTED',
    country: 'CI', commodity: 'cocoa',
    meta: 'Lost 90% of original forest; cocoa expansion into protected areas; EU deforestation regulation pressure' },
  { id: 'ghana-cocoa', name: 'Ghana Cocoa Belt', driver: 'agriculture',
    lat: 6.80, lng: -2.50, lossRateKm2yr: 900, protection: 'PARTIAL',
    country: 'GH', commodity: 'cocoa',
    meta: 'Illegal chainsaw logging + cocoa expansion; EUDR 2025 compliance pressure on Olam/Barry Callebaut' },
];

/** Color ramp: green (low loss) → amber → deep red (extreme loss). Capped at 6000 km²/yr. */
export function deforestationColor(lossRateKm2yr: number): string {
  const t = Math.min(1, lossRateKm2yr / 5000);
  const hue = 130 - t * 130;  // green → red
  return `hsl(${hue.toFixed(0)}, ${75 + t * 15}%, ${55 - t * 10}%)`;
}

export const DRIVER_COLOR: Record<DeforestationDriver, string> = {
  agriculture:    'hsl(45, 90%, 55%)',
  logging:        'hsl(25, 80%, 50%)',
  mining:         'hsl(50, 70%, 45%)',
  fire:           'hsl(0, 90%, 55%)',
  infrastructure: 'hsl(200, 60%, 50%)',
};

export const DRIVER_LABEL: Record<DeforestationDriver, string> = {
  agriculture:    'Agriculture (cattle/crops)',
  logging:        'Commercial / Illegal Logging',
  mining:         'Mining (artisanal/industrial)',
  fire:           'Fire (clearing / climate)',
  infrastructure: 'Roads / Dams / Urban',
};
