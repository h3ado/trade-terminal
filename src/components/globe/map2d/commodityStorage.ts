/**
 * Strategic commodity storage and physical market hubs.
 * Relevant for commodity traders, physical market analysts, and supply-shock
 * risk assessment. Includes:
 *   • Strategic petroleum reserves (SPR)
 *   • LME approved warehouse networks
 *   • COMEX/gold vaults
 *   • Underground gas storage
 *   • Major grain elevator / port silos
 *   • Critical mineral stockpiles
 *
 * Capacity in native units (barrels, tonnes, BCM, etc.) in the `meta` field.
 */
import type { PointFeature } from './infra';

export type StorageKind =
  | 'spr'          // Strategic petroleum reserve
  | 'lme'          // LME approved warehouse
  | 'comex'        // COMEX/CME vault
  | 'gold_vault'   // Official gold vault / central bank
  | 'gas_storage'  // Underground gas storage (depleted field / aquifer / salt cavern)
  | 'grain'        // Strategic grain storage / port silos
  | 'rare_earth';  // Critical mineral / rare-earth stockpile

export type StorageSite = PointFeature & {
  kind: StorageKind;
  capacityNote?: string;   // human-readable capacity
  operator?: string;
};

export const STORAGE_SITES: StorageSite[] = [

  // ── US Strategic Petroleum Reserve (SPR) ─────────────────────────────────
  { id: 'spr-bryan-mound', name: 'Bryan Mound SPR', kind: 'spr',
    lat: 28.97, lng: -95.37, size: 5, country: 'US',
    capacityNote: '255M bbl capacity · largest US site', operator: 'US DOE',
    meta: 'Texas Gulf Coast · salt cavern storage · can deliver 4.4 mbpd' },
  { id: 'spr-big-hill', name: 'Big Hill SPR', kind: 'spr',
    lat: 29.96, lng: -94.09, size: 4, country: 'US',
    capacityNote: '160M bbl capacity', operator: 'US DOE',
    meta: 'Texas · Beaumont area · salt dome · max drawdown 1.1 mbpd' },
  { id: 'spr-west-hackberry', name: 'West Hackberry SPR', kind: 'spr',
    lat: 30.05, lng: -93.38, size: 4, country: 'US',
    capacityNote: '227M bbl capacity', operator: 'US DOE',
    meta: 'Louisiana · LOOP pipeline connected · sweet crude' },
  { id: 'spr-bayou-choctaw', name: 'Bayou Choctaw SPR', kind: 'spr',
    lat: 30.59, lng: -91.26, size: 3, country: 'US',
    capacityNote: '76M bbl capacity', operator: 'US DOE',
    meta: 'Louisiana Baton Rouge area · mixed crude grades' },
  { id: 'spr-de-japan', name: 'Japan SPR (Tomakomai)', kind: 'spr',
    lat: 42.64, lng: 141.60, size: 4, country: 'JP',
    capacityNote: '~175M bbl national reserve', operator: 'JOGMEC',
    meta: 'Japan state SPR; 90-day IEA obligation; distributed at 10 sites' },
  { id: 'spr-ulsan', name: 'Korea SPR (Ulsan)', kind: 'spr',
    lat: 35.55, lng: 129.30, size: 4, country: 'KR',
    capacityNote: '146M bbl total national', operator: 'KNOC',
    meta: 'South Korea SPR; IEA member; 90-day obligation; Ulsan + 8 sites' },
  { id: 'spr-wilhelmshaven', name: 'Germany SPR (EBV)', kind: 'spr',
    lat: 53.53, lng: 8.10, size: 4, country: 'DE',
    capacityNote: '~90 days import cover', operator: 'EBV GmbH',
    meta: 'Federal government oil reserves; distributed nationwide; crude + products' },
  { id: 'spr-saldanha', name: 'Saldanha Bay SPR (South Africa)', kind: 'spr',
    lat: -33.01, lng: 17.95, size: 4, country: 'ZA',
    capacityNote: '45M bbl capacity · floating + onshore', operator: 'NERSA / operators',
    meta: 'Strategic fuel fund; largest SPR in Africa; Saldanha Iron Ore port proximity' },
  { id: 'spr-cushing', name: 'Cushing Oklahoma Hub', kind: 'spr',
    lat: 35.98, lng: -96.77, size: 5, country: 'US',
    capacityNote: '90M bbl working capacity · WTI delivery point',
    meta: 'Pipeline crossroads hub; WTI futures delivery benchmark; Keystone system junction' },

  // ── LME Approved Warehouses ────────────────────────────────────────────────
  { id: 'lme-rotterdam', name: 'LME Warehouses — Rotterdam', kind: 'lme',
    lat: 51.93, lng: 4.50, size: 5, country: 'NL',
    operator: 'C. Steinweg, Istim, Metro', meta: 'Cu, Al, Zn, Ni, Pb, Sn storage · ARA hub · 20+ approved sheds' },
  { id: 'lme-antwerp', name: 'LME Warehouses — Antwerp', kind: 'lme',
    lat: 51.23, lng: 4.41, size: 4, country: 'BE',
    operator: 'Multiple', meta: 'ARA hub · aluminium dominant · Genco terminals' },
  { id: 'lme-singapore', name: 'LME Warehouses — Singapore', kind: 'lme',
    lat: 1.28, lng: 103.70, size: 4, country: 'SG',
    operator: 'Henry Bath, Metro', meta: 'Jurong Island · APAC delivery hub · tin/copper' },
  { id: 'lme-johor', name: 'LME Warehouses — Johor', kind: 'lme',
    lat: 1.47, lng: 103.76, size: 4, country: 'MY',
    operator: 'Multiple', meta: 'South Malaysia · aluminium + tin · Tanjung Langsat' },
  { id: 'lme-new-orleans', name: 'LME Warehouses — New Orleans', kind: 'lme',
    lat: 29.95, lng: -90.07, size: 4, country: 'US',
    operator: 'Pacorini, Metro', meta: 'Gulf of Mexico hub · aluminium dominant · Henry Bath' },
  { id: 'lme-detroit', name: 'LME Warehouses — Detroit', kind: 'lme',
    lat: 42.33, lng: -83.05, size: 4, country: 'US',
    operator: 'Metro International', meta: 'Former queuing scandal site 2013; aluminium dominant; still active' },
  { id: 'lme-baltimore', name: 'LME Warehouses — Baltimore', kind: 'lme',
    lat: 39.29, lng: -76.62, size: 3, country: 'US',
    operator: 'Henry Bath', meta: 'US East Coast; copper + lead' },
  { id: 'lme-busan', name: 'LME Warehouses — Busan', kind: 'lme',
    lat: 35.11, lng: 129.04, size: 3, country: 'KR',
    operator: 'Multiple', meta: 'Northeast Asian delivery hub; zinc/copper' },

  // ── COMEX / CME Gold & Silver Vaults ─────────────────────────────────────
  { id: 'comex-nyc-jp', name: 'JPMorgan COMEX Vault (NYC)', kind: 'comex',
    lat: 40.70, lng: -74.01, size: 5, country: 'US',
    capacityNote: 'Largest COMEX eligible gold', operator: 'JPMorgan Chase',
    meta: '110 William St · Eligible + registered gold & silver; COMEX delivery point' },
  { id: 'comex-nyc-hsbc', name: 'HSBC COMEX Vault (NYC)', kind: 'comex',
    lat: 40.71, lng: -74.01, size: 4, country: 'US',
    capacityNote: 'Major eligible gold vault', operator: 'HSBC Bank USA',
    meta: 'NYC COMEX delivery; largest registered gold by tonnes' },
  { id: 'comex-brinks-slc', name: 'Brinks COMEX Vault (Salt Lake City)', kind: 'comex',
    lat: 40.76, lng: -111.89, size: 3, country: 'US',
    operator: 'Brinks', meta: 'Silver dominant; CME approved; mountain West' },
  { id: 'comex-delaware', name: 'Delaware Depository', kind: 'comex',
    lat: 39.75, lng: -75.55, size: 3, country: 'US',
    operator: 'Delaware Depository', meta: 'CME/COMEX silver + gold; coin dealer storage' },

  // ── Gold Vaults (Central Bank / Official) ────────────────────────────────
  { id: 'gold-fort-knox', name: 'Fort Knox Bullion Depository', kind: 'gold_vault',
    lat: 37.89, lng: -85.96, size: 5, country: 'US',
    capacityNote: '~4,580t US gold', operator: 'US Treasury / US Mint',
    meta: 'Largest single gold reserve location; hardened military facility; 56% of US 8,133t reserve' },
  { id: 'gold-west-point', name: 'West Point Mint (Gold Vault)', kind: 'gold_vault',
    lat: 41.39, lng: -73.96, size: 4, country: 'US',
    capacityNote: '~1,740t', operator: 'US Mint',
    meta: '"Gold Bullion Capital of the World"; custodian storage for other nations' },
  { id: 'gold-ny-fed', name: 'Federal Reserve Bank of NY (Vault)', kind: 'gold_vault',
    lat: 40.71, lng: -74.01, size: 5, country: 'US',
    capacityNote: '~6,000t; largest official gold storage', operator: 'FRBNY',
    meta: 'Liberty St Manhattan; custodian for ~60 nations + IMF; gold settlement hub' },
  { id: 'gold-boe', name: 'Bank of England Gold Vault', kind: 'gold_vault',
    lat: 51.51, lng: -0.09, size: 5, country: 'GB',
    capacityNote: '~400,000 bars (~5,000t)', operator: 'Bank of England',
    meta: 'Largest custodial gold outside NY Fed; LBMA clearing hub; UK + foreign central bank gold' },
  { id: 'gold-snb', name: 'Swiss National Bank Vaults', kind: 'gold_vault',
    lat: 46.95, lng: 7.45, size: 4, country: 'CH',
    capacityNote: '1,040t Swiss national gold', operator: 'SNB',
    meta: 'Geneva + Bern vaults; ~70% held domestically since 2008 repatriation' },
  { id: 'gold-rba', name: 'RBA Gold (Bank of England custody)', kind: 'gold_vault',
    lat: -33.87, lng: 151.21, size: 3, country: 'AU',
    capacityNote: '80t in BOE custody', operator: 'Reserve Bank of Australia',
    meta: 'Australia 80t national gold; stored at BOE; subject of 2024 repatriation debate' },
  { id: 'gold-pboc', name: 'PBoC Gold Reserves (multiple)', kind: 'gold_vault',
    lat: 39.91, lng: 116.39, size: 5, country: 'CN',
    capacityNote: '2,235t official (+ undisclosed)', operator: 'PBoC',
    meta: 'World #6 official; underreported; de-dollarisation strategy; monthly reporting resumed 2022' },

  // ── Underground Gas Storage ────────────────────────────────────────────────
  { id: 'gas-rough-uk', name: 'Rough Gas Storage (UK)', kind: 'gas_storage',
    lat: 53.73, lng: 1.02, size: 5, country: 'GB',
    capacityNote: '50 BCM working capacity (historic); ~1.1 BCM post-Centrica refurb',
    operator: 'Centrica', meta: 'North Sea depleted field; Britain only major storage; critical winter buffer; closed 2017 → partial restart 2022 post-Russia crisis' },
  { id: 'gas-rehden-de', name: 'Rehden Gas Storage', kind: 'gas_storage',
    lat: 52.60, lng: 8.50, size: 5, country: 'DE',
    capacityNote: '4.3 BCM · Germany\'s largest single site', operator: 'Astora (now WINGAS)',
    meta: 'Former Gazprom subsidiary control; seizure 2022; key for NW Europe winter; 90% fill target 2022' },
  { id: 'gas-bergermeer-nl', name: 'Bergermeer Gas Storage', kind: 'gas_storage',
    lat: 52.73, lng: 4.73, size: 4, country: 'NL',
    capacityNote: '4.1 BCM · NW Europe swing storage', operator: 'TAQA',
    meta: 'Netherlands; key TTF swing; depleted gas field; Abu Dhabi TAQA owned' },
  { id: 'gas-chyow-pl', name: 'Chyów Gas Storage', kind: 'gas_storage',
    lat: 51.84, lng: 20.64, size: 4, country: 'PL',
    capacityNote: '0.9 BCM', operator: 'PGNiG / PGNIG Supply',
    meta: 'Poland main storage; critical for E. European winter security; pre-Ukrainian war strategic fill' },
  { id: 'gas-haidach-at', name: 'Haidach Gas Storage', kind: 'gas_storage',
    lat: 47.90, lng: 12.95, size: 4, country: 'AT',
    capacityNote: '2.6 BCM', operator: 'RAG / Gazprom Marketing (contested)',
    meta: 'Austria; Central European swing; Gazprom minority stake sequestered 2022' },
  { id: 'gas-ugs-ukraine', name: 'Ukraine UGS Network', kind: 'gas_storage',
    lat: 49.50, lng: 26.00, size: 5, country: 'UA',
    capacityNote: '31 BCM total (largest in Europe)', operator: 'Naftogaz/UGSF',
    meta: 'Depleted fields mainly western Ukraine; critical for EU gas security; third-party storage 2022-' },
  { id: 'gas-ugs-france', name: 'French Underground Gas Storage', kind: 'gas_storage',
    lat: 47.60, lng: 2.00, size: 4, country: 'FR',
    capacityNote: '13 BCM total', operator: 'Storengy (Engie)',
    meta: 'Multiple sites across France; aquifer dominant; strategic fill 2022 post-Russia' },

  // ── Grain Storage ─────────────────────────────────────────────────────────
  { id: 'grain-cme-delivery', name: 'Chicago CME Grain Delivery Points', kind: 'grain',
    lat: 41.86, lng: -87.70, size: 5, country: 'US',
    operator: 'Multiple', capacityNote: 'CME corn/soy/wheat delivery',
    meta: 'CBOT delivery network; Toledo OH, Chicago, St. Louis; elevator capacity tracks futures positioning' },
  { id: 'grain-new-orleans', name: 'New Orleans Gulf Grain Elevators', kind: 'grain',
    lat: 29.95, lng: -90.10, size: 5, country: 'US',
    operator: 'Bunge, Cargill, ADM, Louis Dreyfus', capacityNote: '~250M bushels Gulf export capacity',
    meta: 'Mississippi River terminus; largest US grain export complex; CIF Gulf benchmark' },
  { id: 'grain-portland', name: 'Portland OR Grain Terminals', kind: 'grain',
    lat: 45.52, lng: -122.68, size: 4, country: 'US',
    operator: 'Louis Dreyfus, Temco, TEMCO', capacityNote: '~100M bushels PNW export',
    meta: 'Pacific Northwest wheat/corn; Asia-Pacific destination; Columbia River barge feed' },
  { id: 'grain-rotterdam-ara', name: 'Rotterdam / ARA Grain Hubs', kind: 'grain',
    lat: 51.93, lng: 4.48, size: 5, country: 'NL',
    operator: 'Bunge, Louis Dreyfus, Nidera', capacityNote: 'Major European import/export hub',
    meta: 'Europe\'s grain import hub; French wheat, Black Sea grain; Rotterdam + Ghent + Antwerp' },
  { id: 'grain-novorossiysk', name: 'Novorossiysk Grain Terminal', kind: 'grain',
    lat: 44.72, lng: 37.78, size: 5, country: 'RU',
    operator: 'NCSP / United Grain Company', capacityNote: '~14 Mt/yr export',
    meta: 'Russia\'s largest Black Sea grain port; GASC Egypt tender price benchmark; Ukraine corridor competitor' },
  { id: 'grain-santos-br', name: 'Santos Grain Export Hub (Brazil)', kind: 'grain',
    lat: -23.97, lng: -46.32, size: 5, country: 'BR',
    operator: 'Cargill, ADM, Bunge, Amaggi', capacityNote: 'Largest LatAm grain port',
    meta: 'Primary Brazil soy/corn export; PARANAGUÁ + Santos combination; China price setter' },
  { id: 'grain-paranagua-br', name: 'Paranaguá Grain Port', kind: 'grain',
    lat: -25.52, lng: -48.51, size: 4, country: 'BR',
    operator: 'APPA / ADM / Bunge', capacityNote: '40 Mt/yr throughput',
    meta: 'Brazil\'s busiest agricultural port; FOB Paranaguá soy price; Mato Grosso origin via rail' },
  { id: 'grain-ukraine-odesa', name: 'Odesa / Yuzhne Grain Hub', kind: 'grain',
    lat: 46.47, lng: 30.74, size: 5, country: 'UA',
    operator: 'Kernel, Cargill, ADM', capacityNote: '~30 Mt/yr export (pre-war)',
    meta: 'Black Sea grain corridor; Grain Deal 2022-23; wheat/corn/sunflower oil; Russia threat ongoing' },
  { id: 'grain-china-dalian', name: 'Dalian Grain Futures Hub (DCE)', kind: 'grain',
    lat: 38.91, lng: 121.61, size: 4, country: 'CN',
    operator: 'DCE / Sinograin', capacityNote: 'DCE corn/soy delivery',
    meta: 'Dalian Commodity Exchange corn/soy/palm oil futures delivery; Sinograin national reserves nearby' },

  // ── Critical Mineral / Rare-Earth Stockpiles ──────────────────────────────
  { id: 'rare-earth-bayan-obo-stock', name: 'Inner Mongolia Rare Earth Processing Hub', kind: 'rare_earth',
    lat: 41.77, lng: 109.97, size: 5, country: 'CN',
    operator: 'China Northern Rare Earth', capacityNote: '60% of global rare earth production',
    meta: 'Bayan Obo mine + Baotou processing city; export quota / customs tool; LREE dominant' },
  { id: 'rare-earth-jiangxi', name: 'Jiangxi Rare Earth Cluster', kind: 'rare_earth',
    lat: 25.85, lng: 115.00, size: 4, country: 'CN',
    operator: 'JXRE / China Rare Earth Group', capacityNote: 'HREE dominant (Nd, Dy, Tb)',
    meta: 'Heavy rare earth; EV magnet material; export controls 2023 Ga/Ge; HREE refining monopoly' },
  { id: 'rare-earth-lynas-mount-pass', name: 'Mountain Pass (Rare Earth)', kind: 'rare_earth',
    lat: 35.47, lng: -115.53, size: 4, country: 'US',
    operator: 'MP Materials', capacityNote: 'Only operating US rare earth mine',
    meta: 'Lanthanum+cerium+neodymium; DoD contract; processing in US via new Fort Worth magnet plant' },
  { id: 'cobalt-katanga', name: 'Katanga Cobalt Hub (DRC)', kind: 'rare_earth',
    lat: -10.72, lng: 25.42, size: 5, country: 'CD',
    operator: 'Glencore, CMOC, ERG', capacityNote: '~70% of global cobalt supply',
    meta: 'Kolwezi + Likasi cluster; EV battery supply chain; artisanal mining controversy; CMOC challenge to Glencore' },
];

export const STORAGE_KIND_COLOR: Record<StorageKind, string> = {
  spr:         'hsl(20, 90%, 58%)',
  lme:         'hsl(200, 80%, 55%)',
  comex:       'hsl(200, 30%, 65%)',
  gold_vault:  'hsl(48, 100%, 52%)',
  gas_storage: 'hsl(185, 80%, 55%)',
  grain:       'hsl(42, 90%, 52%)',
  rare_earth:  'hsl(280, 75%, 60%)',
};

export const STORAGE_KIND_LABEL: Record<StorageKind, string> = {
  spr:         'Strategic Petroleum Reserve',
  lme:         'LME Approved Warehouse',
  comex:       'COMEX / CME Vault',
  gold_vault:  'Central Bank Gold Vault',
  gas_storage: 'Underground Gas Storage',
  grain:       'Strategic Grain Storage',
  rare_earth:  'Critical Mineral Hub',
};
