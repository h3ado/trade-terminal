/**
 * Overseas military installations — air bases, army garrisons, joint facilities.
 * Naval bases are in infra.ts (NAVAL_BASES). This layer adds the air/ground
 * dimension and non-US powers. Critical for geopolitical risk overlays.
 *
 * Sources: BRAC database, USAF/Army GAO reports, IISS Military Balance, public SOFA agreements.
 */

export type MilBranch = 'air' | 'army' | 'joint' | 'intelligence' | 'special_ops';
export type MilOperator = 'US' | 'UK' | 'FR' | 'CN' | 'RU' | 'AU' | 'TR' | 'DE' | 'JP' | 'IN';

export type MilitaryBaseFeature = {
  id: string;
  name: string;
  operator: MilOperator;
  branch: MilBranch;
  lat: number;
  lng: number;
  country: string;
  /** Host-nation ISO-A2 code */
  hostIso: string;
  meta?: string;
  personnel?: number;   // approximate
  status: 'OPERATIONAL' | 'PLANNED' | 'DISPUTED';
};

export const MILITARY_BASES: MilitaryBaseFeature[] = [

  // ── US Air Force ──────────────────────────────────────────────────────────
  { id: 'ramstein', name: 'Ramstein Air Base', operator: 'US', branch: 'air',
    lat: 49.44, lng: 7.60, country: 'DE', hostIso: 'DE', personnel: 54000,
    meta: 'USAFE HQ · Germany · drone ops hub', status: 'OPERATIONAL' },
  { id: 'spangdahlem', name: 'Spangdahlem Air Base', operator: 'US', branch: 'air',
    lat: 50.13, lng: 6.69, country: 'DE', hostIso: 'DE', personnel: 5000,
    meta: 'NATO air operations · Germany', status: 'OPERATIONAL' },
  { id: 'lakenheath', name: 'RAF Lakenheath', operator: 'US', branch: 'air',
    lat: 52.41, lng: 0.56, country: 'UK', hostIso: 'GB', personnel: 9000,
    meta: 'USAF largest UK base · F-35A · B61-12 nuclear', status: 'OPERATIONAL' },
  { id: 'mildenhall', name: 'RAF Mildenhall', operator: 'US', branch: 'air',
    lat: 52.36, lng: 0.49, country: 'UK', hostIso: 'GB', personnel: 5000,
    meta: 'Tanker wing · KC-135 / E-3 AWACS', status: 'OPERATIONAL' },
  { id: 'incirlik', name: 'Incirlik Air Base', operator: 'US', branch: 'air',
    lat: 37.00, lng: 35.43, country: 'TR', hostIso: 'TR', personnel: 1500,
    meta: 'NATO nuclear sharing · B61 storage · strained US-TR relations', status: 'OPERATIONAL' },
  { id: 'aviano', name: 'Aviano Air Base', operator: 'US', branch: 'air',
    lat: 46.03, lng: 12.60, country: 'IT', hostIso: 'IT', personnel: 4500,
    meta: 'Italy · F-16 · NATO southern flank', status: 'OPERATIONAL' },
  { id: 'moron', name: 'Morón Air Base', operator: 'US', branch: 'air',
    lat: 37.17, lng: -5.62, country: 'ES', hostIso: 'ES', personnel: 2200,
    meta: 'Spain · USMC SPMAGTF-CR · AFRICOM support', status: 'OPERATIONAL' },
  { id: 'kadena', name: 'Kadena Air Base', operator: 'US', branch: 'air',
    lat: 26.36, lng: 127.77, country: 'JP', hostIso: 'JP', personnel: 18000,
    meta: 'Largest USAF base in Asia · F-15C/D · Okinawa', status: 'OPERATIONAL' },
  { id: 'misawa', name: 'Misawa Air Base', operator: 'US', branch: 'air',
    lat: 40.70, lng: 141.37, country: 'JP', hostIso: 'JP', personnel: 5000,
    meta: 'SIGINT hub · F-16 · Northern Japan', status: 'OPERATIONAL' },
  { id: 'yokota', name: 'Yokota Air Base', operator: 'US', branch: 'air',
    lat: 35.75, lng: 139.35, country: 'JP', hostIso: 'JP', personnel: 14000,
    meta: 'USFJ HQ · C-130 airlift · Tokyo area', status: 'OPERATIONAL' },
  { id: 'osan', name: 'Osan Air Base', operator: 'US', branch: 'air',
    lat: 37.09, lng: 127.03, country: 'KR', hostIso: 'KR', personnel: 10000,
    meta: '7th Air Force HQ · A-10 / F-16 · South Korea', status: 'OPERATIONAL' },
  { id: 'kunsan', name: 'Kunsan Air Base', operator: 'US', branch: 'air',
    lat: 35.90, lng: 126.62, country: 'KR', hostIso: 'KR', personnel: 4500,
    meta: 'F-16CJ · Yellow Sea coast · KPAF threat axis', status: 'OPERATIONAL' },
  { id: 'udeid', name: 'Al Udeid Air Base', operator: 'US', branch: 'air',
    lat: 25.12, lng: 51.31, country: 'QA', hostIso: 'QA', personnel: 10000,
    meta: 'AFCENT HQ · Qatar · B-52 + tankers · CENTCOM operations', status: 'OPERATIONAL' },
  { id: 'ali-al-salem', name: 'Ali Al Salem Air Base', operator: 'US', branch: 'air',
    lat: 29.34, lng: 47.52, country: 'KW', hostIso: 'KW', personnel: 3500,
    meta: 'Kuwait · A-10 / F/A-18 · Northern Arabian Gulf', status: 'OPERATIONAL' },
  { id: 'al-dhafra', name: 'Al Dhafra Air Base', operator: 'US', branch: 'air',
    lat: 24.25, lng: 54.55, country: 'AE', hostIso: 'AE', personnel: 4500,
    meta: 'UAE · F-35A · RQ-4 · U-2 · CENTCOM ISR hub', status: 'OPERATIONAL' },
  { id: 'diego-garcia', name: 'Diego Garcia (BIOT)', operator: 'US', branch: 'joint',
    lat: -7.31, lng: 72.41, country: 'IO', hostIso: 'IO', personnel: 3500,
    meta: 'Indian Ocean pivot · B-52 staging · nuclear-capable bombers', status: 'OPERATIONAL' },
  { id: 'andersen-guam', name: 'Andersen AFB (Guam)', operator: 'US', branch: 'air',
    lat: 13.58, lng: 144.93, country: 'GU', hostIso: 'US', personnel: 5000,
    meta: 'Pacific bomber hub · B-1B / B-52 rotations · PACOM', status: 'OPERATIONAL' },
  { id: 'thule', name: 'Pituffik Space Base (Thule)', operator: 'US', branch: 'intelligence',
    lat: 76.54, lng: -68.70, country: 'GL', hostIso: 'DK', personnel: 200,
    meta: 'Space surveillance + early warning radar · Greenland · BMEWS', status: 'OPERATIONAL' },
  { id: 'al-tanf', name: 'Al-Tanf Garrison', operator: 'US', branch: 'special_ops',
    lat: 33.50, lng: 38.68, country: 'SY', hostIso: 'SY', personnel: 900,
    meta: 'Syria · unconventional warfare · Iranian supply line disruption', status: 'OPERATIONAL' },

  // ── US Army ───────────────────────────────────────────────────────────────
  { id: 'wiesbaden', name: 'Clay Kaserne (Wiesbaden)', operator: 'US', branch: 'army',
    lat: 50.04, lng: 8.25, country: 'DE', hostIso: 'DE', personnel: 7000,
    meta: 'USAREUR-AF HQ · V Corps · Germany', status: 'OPERATIONAL' },
  { id: 'camp-humphreys', name: 'Camp Humphreys', operator: 'US', branch: 'army',
    lat: 36.96, lng: 126.96, country: 'KR', hostIso: 'KR', personnel: 40000,
    meta: 'USFK HQ · Largest US overseas base · Pyeongtaek', status: 'OPERATIONAL' },
  { id: 'vicenza', name: 'Caserma Ederle (Vicenza)', operator: 'US', branch: 'army',
    lat: 45.57, lng: 11.55, country: 'IT', hostIso: 'IT', personnel: 3500,
    meta: 'SETAF-AF HQ · Airborne Brigade · Italy', status: 'OPERATIONAL' },
  { id: 'stuttgart', name: 'EUCOM HQ (Stuttgart-Patch)', operator: 'US', branch: 'army',
    lat: 48.73, lng: 9.11, country: 'DE', hostIso: 'DE', personnel: 10000,
    meta: 'EUCOM + AFRICOM HQ · Stuttgart · Germany', status: 'OPERATIONAL' },
  { id: 'grafenwoehr', name: 'Grafenwöhr Training Area', operator: 'US', branch: 'army',
    lat: 49.69, lng: 11.93, country: 'DE', hostIso: 'DE', personnel: 12000,
    meta: 'Largest US army range in Europe · Abrams armor · NATO readiness', status: 'OPERATIONAL' },
  { id: 'camp-arifjan', name: 'Camp Arifjan', operator: 'US', branch: 'army',
    lat: 29.18, lng: 48.05, country: 'KW', hostIso: 'KW', personnel: 13500,
    meta: 'ARCENT HQ · Kuwait · pre-positioning logistics', status: 'OPERATIONAL' },

  // ── UK Overseas Bases ─────────────────────────────────────────────────────
  { id: 'akrotiri', name: 'RAF Akrotiri (SBA)', operator: 'UK', branch: 'air',
    lat: 34.59, lng: 32.99, country: 'CY', hostIso: 'CY', personnel: 3000,
    meta: 'Sovereign Base Area · Cyprus · RAF Typhoon · SIGINT', status: 'OPERATIONAL' },
  { id: 'dhekelia', name: 'Dhekelia SBA', operator: 'UK', branch: 'army',
    lat: 34.99, lng: 33.75, country: 'CY', hostIso: 'CY', personnel: 2000,
    meta: 'Sovereign Base Area · Cyprus · garrison + intelligence', status: 'OPERATIONAL' },
  { id: 'mount-pleasant', name: 'Mount Pleasant Complex', operator: 'UK', branch: 'joint',
    lat: -51.82, lng: -58.45, country: 'FK', hostIso: 'FK', personnel: 1200,
    meta: 'Falkland Islands · RAF Typhoon · South Atlantic deterrence', status: 'OPERATIONAL' },
  { id: 'brunei-garrison', name: 'British Garrison Brunei', operator: 'UK', branch: 'army',
    lat: 4.94, lng: 114.95, country: 'BN', hostIso: 'BN', personnel: 900,
    meta: 'Jungle warfare training · Gurkha battalion', status: 'OPERATIONAL' },
  { id: 'belize-garrison', name: 'British Army Belize', operator: 'UK', branch: 'army',
    lat: 17.27, lng: -88.76, country: 'BZ', hostIso: 'BZ', personnel: 250,
    meta: 'Training · tropical · Belize', status: 'OPERATIONAL' },
  { id: 'gibraltar-garrison', name: 'Gibraltar Naval Base', operator: 'UK', branch: 'joint',
    lat: 36.13, lng: -5.35, country: 'GI', hostIso: 'GI', personnel: 1000,
    meta: 'Gibraltar · Spain sovereignty dispute · Med chokepoint', status: 'OPERATIONAL' },
  { id: 'raf-ascension', name: 'Ascension Island RAF', operator: 'UK', branch: 'air',
    lat: -7.97, lng: -14.39, country: 'SH', hostIso: 'SH', personnel: 500,
    meta: 'UK Overseas Territory · mid-Atlantic staging · GPS ground station', status: 'OPERATIONAL' },

  // ── France ────────────────────────────────────────────────────────────────
  { id: 'ndjamena', name: 'Base Aérienne Kossei (N\'Djamena)', operator: 'FR', branch: 'air',
    lat: 12.13, lng: 15.04, country: 'TD', hostIso: 'TD', personnel: 1000,
    meta: 'Opération Barkhane HQ (downsizing) · Sahel operations · Chad', status: 'OPERATIONAL' },
  { id: 'djibouti-fr', name: 'CDF Djibouti', operator: 'FR', branch: 'joint',
    lat: 11.57, lng: 43.14, country: 'DJ', hostIso: 'DJ', personnel: 1500,
    meta: 'Largest French overseas base · Djibouti · HOA operations', status: 'OPERATIONAL' },
  { id: 'dakar-fr', name: 'Éléments Français au Sénégal', operator: 'FR', branch: 'army',
    lat: 14.69, lng: -17.44, country: 'SN', hostIso: 'SN', personnel: 350,
    meta: 'French pre-positioned forces · West Africa · under review', status: 'OPERATIONAL' },
  { id: 'reunion-fr', name: 'FAZSOI (La Réunion)', operator: 'FR', branch: 'joint',
    lat: -21.11, lng: 55.53, country: 'RE', hostIso: 'FR', personnel: 1900,
    meta: 'Indian Ocean garrison · Réunion + Mayotte', status: 'OPERATIONAL' },
  { id: 'abu-dhabi-fr', name: 'CIF Abu Dhabi', operator: 'FR', branch: 'air',
    lat: 24.43, lng: 54.65, country: 'AE', hostIso: 'AE', personnel: 650,
    meta: 'First permanent French base in Middle East · Mirage 2000 + Rafale', status: 'OPERATIONAL' },
  { id: 'kourou-fr', name: 'Centre Spatial Guyanais / Legion', operator: 'FR', branch: 'special_ops',
    lat: 5.09, lng: -52.77, country: 'GF', hostIso: 'FR', personnel: 1200,
    meta: 'French Guiana · Space launch + Foreign Legion garrison · Ariane/Vega', status: 'OPERATIONAL' },

  // ── China ─────────────────────────────────────────────────────────────────
  { id: 'djibouti-cn', name: 'PLA Support Base (Djibouti)', operator: 'CN', branch: 'joint',
    lat: 11.55, lng: 43.17, country: 'DJ', hostIso: 'DJ', personnel: 400,
    meta: 'China\'s first overseas military base · 2017 · adjacent to US Camp Lemonnier', status: 'OPERATIONAL' },
  { id: 'ream-cn', name: 'Ream Naval Base (Cambodia)', operator: 'CN', branch: 'joint',
    lat: 10.50, lng: 103.64, country: 'KH', hostIso: 'KH', personnel: 200,
    meta: 'De facto PLA-N access · Gulf of Thailand · US/ASEAN concern', status: 'OPERATIONAL' },
  { id: 'gwadar-cn', name: 'Gwadar Port (CPEC hub)', operator: 'CN', branch: 'joint',
    lat: 25.12, lng: 62.33, country: 'PK', hostIso: 'PK', personnel: 100,
    meta: 'Dual-use port · CPEC · 40-yr lease · PLA-N access potential', status: 'OPERATIONAL' },
  { id: 'hambantota-cn', name: 'Hambantota Port', operator: 'CN', branch: 'joint',
    lat: 6.12, lng: 81.12, country: 'LK', hostIso: 'LK', personnel: 50,
    meta: '99-yr lease 2017 · Sri Lanka debt-trap · Indian Ocean chokepoint', status: 'OPERATIONAL' },
  { id: 'scs-spratlys', name: 'Spratly Outposts (Fiery Cross etc.)', operator: 'CN', branch: 'joint',
    lat: 9.55, lng: 114.34, country: 'SCS', hostIso: 'PH', personnel: 2000,
    meta: 'Militarized artificial islands · Fiery Cross/Subi/Mischief reefs · contested', status: 'DISPUTED' },
  { id: 'tajikistan-cn', name: 'PLA Outpost (Tajikistan)', operator: 'CN', branch: 'intelligence',
    lat: 37.14, lng: 74.05, country: 'TJ', hostIso: 'TJ', personnel: 300,
    meta: 'Reported PLA presence · Wakhan Corridor · covert 2016-', status: 'OPERATIONAL' },

  // ── Russia ────────────────────────────────────────────────────────────────
  { id: 'khmeimim', name: 'Khmeimim Air Base (Syria)', operator: 'RU', branch: 'air',
    lat: 35.40, lng: 35.95, country: 'SY', hostIso: 'SY', personnel: 3000,
    meta: 'Russian air hub in Syria · Su-35/Su-34 · S-400 · opened 2015', status: 'OPERATIONAL' },
  { id: 'mali-wagner', name: 'Bamako/Mali (Africa Corps)', operator: 'RU', branch: 'special_ops',
    lat: 12.65, lng: -8.00, country: 'ML', hostIso: 'ML', personnel: 2000,
    meta: 'Former Wagner → Africa Corps · Malian junta · replaced French forces', status: 'OPERATIONAL' },
  { id: 'burkina-wagner', name: 'Ouagadougou (Africa Corps)', operator: 'RU', branch: 'special_ops',
    lat: 12.36, lng: -1.53, country: 'BF', hostIso: 'BF', personnel: 500,
    meta: 'Africa Corps · junta security pact · post-French', status: 'OPERATIONAL' },
  { id: 'niger-wagner', name: 'Niamey (Africa Corps)', operator: 'RU', branch: 'special_ops',
    lat: 13.51, lng: 2.12, country: 'NE', hostIso: 'NE', personnel: 1000,
    meta: 'Russian trainers · Niger junta · US forces relocated', status: 'OPERATIONAL' },
  { id: 'venezuela-ru', name: 'Venezuela (Liaison/access)', operator: 'RU', branch: 'intelligence',
    lat: 10.49, lng: -66.88, country: 'VE', hostIso: 'VE', personnel: 50,
    meta: 'Reported RU military liaison + TU-160 overflight rights', status: 'OPERATIONAL' },

  // ── Other powers ──────────────────────────────────────────────────────────
  { id: 'turkey-somalia', name: 'TURKSOM (Mogadishu)', operator: 'TR', branch: 'army',
    lat: 2.08, lng: 45.33, country: 'SO', hostIso: 'SO', personnel: 500,
    meta: 'Largest overseas military training base · Turkey', status: 'OPERATIONAL' },
  { id: 'turkey-qatar', name: 'Tariq Bin Ziyad Base (Qatar)', operator: 'TR', branch: 'joint',
    lat: 25.39, lng: 51.45, country: 'QA', hostIso: 'QA', personnel: 3000,
    meta: 'Turkish forces in Qatar · post-2017 blockade · symbolic deterrence', status: 'OPERATIONAL' },
  { id: 'turkey-libya', name: 'Misrata Base (Libya)', operator: 'TR', branch: 'joint',
    lat: 32.38, lng: 15.09, country: 'LY', hostIso: 'LY', personnel: 2000,
    meta: 'Turkish intervention · GNA support · Bayraktar TB2 · proxy war', status: 'OPERATIONAL' },
  { id: 'australia-darwin', name: 'RAAF Darwin / MRF-D', operator: 'AU', branch: 'joint',
    lat: -12.43, lng: 130.87, country: 'AU', hostIso: 'AU', personnel: 2500,
    meta: 'US Marine Rotational Force-Darwin · ~2,500 USMC + RAN · AUKUS hub', status: 'OPERATIONAL' },
  { id: 'india-andaman', name: 'India Andaman Naval Command', operator: 'IN', branch: 'joint',
    lat: 11.67, lng: 92.74, country: 'IN', hostIso: 'IN', personnel: 3000,
    meta: 'Indian Ocean gateway · Malacca chokepoint · expanding base infrastructure', status: 'OPERATIONAL' },
];

export const MIL_OPERATOR_COLOR: Record<MilOperator, string> = {
  US: 'hsl(220, 85%, 60%)',
  UK: 'hsl(0, 80%, 60%)',
  FR: 'hsl(215, 85%, 55%)',
  CN: 'hsl(0, 90%, 50%)',
  RU: 'hsl(0, 0%, 55%)',
  AU: 'hsl(48, 90%, 55%)',
  TR: 'hsl(15, 85%, 55%)',
  DE: 'hsl(48, 95%, 50%)',
  JP: 'hsl(340, 80%, 60%)',
  IN: 'hsl(25, 85%, 55%)',
};

export const MIL_BRANCH_LABEL: Record<MilBranch, string> = {
  air:           'Air Force',
  army:          'Army / Marines',
  joint:         'Joint / Multi-Service',
  intelligence:  'Intelligence / SIGINT',
  special_ops:   'Special Operations',
};
