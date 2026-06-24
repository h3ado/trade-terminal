/**
 * Active territorial disputes and unresolved sovereignty claims. Each dispute
 * is represented as a simplified polygon ring [lng, lat] for on-map rendering.
 * Critical for geopolitical risk assessment — overlaps with shipping lanes,
 * infrastructure, and market-moving conflict zones.
 *
 * Status:
 *   ACTIVE   — ongoing armed conflict or recent military confrontation
 *   OCCUPIED — one party occupying territory the other claims
 *   FROZEN   — no current fighting but sovereignty unresolved
 *   CLAIMED  — overlapping legal claims, no significant military activity
 */

export type DisputeStatus = 'ACTIVE' | 'OCCUPIED' | 'FROZEN' | 'CLAIMED';

export type DisputeFeature = {
  id: string;
  name: string;
  claimants: string[];   // ISO-A2 or display labels
  status: DisputeStatus;
  severity: 1 | 2 | 3;  // 1 = diplomatic only; 2 = military incidents; 3 = active conflict
  /** Trade/commodity impact: which goods/lanes at risk */
  tradeRisk?: string;
  meta?: string;
  /** Approximate polygon ring: ordered [lng, lat] pairs (auto-closed) */
  ring: [number, number][];
};

export const DISPUTES: DisputeFeature[] = [

  // ── East/Southeast Asia ───────────────────────────────────────────────────
  {
    id: 'south-china-sea',
    name: 'South China Sea (9-Dash Line)',
    claimants: ['CN', 'PH', 'VN', 'MY', 'BN', 'TW'],
    status: 'CLAIMED', severity: 2,
    tradeRisk: '~$5T/yr trade transits; Malacca & SCS shipping lanes',
    meta: 'China claims ~90% of SCS based on "9-dash line"; rejected by UNCLOS 2016 arbitration. Ongoing militarization of artificial islands.',
    ring: [
      [110, 22], [121, 22], [121, 16], [115, 8], [109, 3], [105, 7],
      [105, 12], [108, 16], [110, 18], [110, 22],
    ],
  },
  {
    id: 'spratlys',
    name: 'Spratly Islands',
    claimants: ['CN', 'PH', 'VN', 'MY', 'TW', 'BN'],
    status: 'OCCUPIED', severity: 2,
    tradeRisk: 'Choke on SCS trade lanes; potential ADIZ declaration',
    meta: 'Multiple countries occupy islands/reefs. China\'s Fiery Cross, Subi, Mischief reefs heavily militarized. PH regularly confronted by CCG.',
    ring: [
      [112.5, 12.0], [115.5, 12.0], [115.5, 8.5], [112.5, 8.5], [112.5, 12.0],
    ],
  },
  {
    id: 'paracels',
    name: 'Paracel Islands',
    claimants: ['CN', 'VN', 'TW'],
    status: 'OCCUPIED', severity: 1,
    meta: 'China occupied since 1974 (seized from South Vietnam). Vietnam and Taiwan maintain claims.',
    ring: [
      [111.0, 17.5], [113.0, 17.5], [113.0, 15.8], [111.0, 15.8], [111.0, 17.5],
    ],
  },
  {
    id: 'senkaku-diaoyu',
    name: 'Senkaku / Diaoyu Islands',
    claimants: ['JP', 'CN', 'TW'],
    status: 'CLAIMED', severity: 2,
    tradeRisk: 'Japan-China trade escalation risk; East China Sea oil/gas exploration',
    meta: 'Japan administers the uninhabited islands. China and Taiwan dispute sovereignty. Regular CCG incursions into Japan\'s contiguous zone.',
    ring: [
      [123.3, 26.0], [124.0, 26.0], [124.0, 25.5], [123.3, 25.5], [123.3, 26.0],
    ],
  },
  {
    id: 'taiwan-strait',
    name: 'Taiwan Strait',
    claimants: ['CN', 'TW'],
    status: 'CLAIMED', severity: 3,
    tradeRisk: '88% of global advanced chip production at risk; $1.5T annual cross-strait trade',
    meta: 'PRC claims Taiwan as a province. Regular PLA Air Force/Navy incursions across median line. TSMC, 80% of global chip output. Most market-sensitive geopolitical fault line globally.',
    ring: [
      [119.5, 27.0], [122.5, 27.0], [122.5, 21.5], [119.5, 21.5], [119.5, 27.0],
    ],
  },

  // ── South Asia ────────────────────────────────────────────────────────────
  {
    id: 'kashmir-loc',
    name: 'Kashmir (LoC / LAC)',
    claimants: ['IN', 'PK', 'CN'],
    status: 'ACTIVE', severity: 2,
    tradeRisk: 'India-Pakistan trade (minimal); nuclear flashpoint risk; CPEC security',
    meta: 'Line of Control divides Indian and Pakistani Kashmir. China controls Aksai Chin. India-Pakistan have fought 3 wars here. Nuclear states in chronic standoff. 2019 Pulwama/Balakot escalation precedent.',
    ring: [
      [72.5, 37.5], [78.0, 37.0], [79.5, 35.0], [77.0, 32.5],
      [74.5, 32.5], [73.0, 33.5], [72.5, 35.5], [72.5, 37.5],
    ],
  },
  {
    id: 'aksai-chin',
    name: 'Aksai Chin (China-India)',
    claimants: ['IN', 'CN'],
    status: 'OCCUPIED', severity: 2,
    meta: 'China administers Aksai Chin; India claims as part of Ladakh. Galwan Valley clashes 2020 (20 Indian soldiers killed). Ongoing military buildup on both sides.',
    ring: [
      [77.8, 36.0], [81.5, 36.0], [81.5, 34.0], [77.8, 34.0], [77.8, 36.0],
    ],
  },
  {
    id: 'arunachal',
    name: 'Arunachal Pradesh / South Tibet',
    claimants: ['IN', 'CN'],
    status: 'CLAIMED', severity: 1,
    meta: 'China calls it "South Tibet" (Zangnan); India administers as Arunachal Pradesh. Border incursions periodic. Sensitive due to Dalai Lama exile.',
    ring: [
      [91.5, 28.5], [97.5, 28.5], [97.5, 27.0], [91.5, 27.0], [91.5, 28.5],
    ],
  },

  // ── Middle East ───────────────────────────────────────────────────────────
  {
    id: 'ukraine-frontline',
    name: 'Ukraine War Frontline',
    claimants: ['UA', 'RU'],
    status: 'ACTIVE', severity: 3,
    tradeRisk: 'Black Sea grain; Bab-el-Mandeb energy re-routing; European gas; sanctions commodity rerouting',
    meta: 'Russia\'s full-scale invasion began Feb 2022. Front spans ~1,000km. Nuclear rhetoric persistent. Most market-moving European geopolitical event since WWII. Wheat/sunflower/corn production zone under conflict.',
    ring: [
      [33.5, 52.0], [38.0, 52.0], [40.5, 50.0], [39.5, 47.5], [37.5, 47.0],
      [35.5, 46.5], [34.0, 45.5], [33.5, 46.0], [32.0, 46.5], [31.5, 47.5],
      [32.0, 49.0], [33.5, 52.0],
    ],
  },
  {
    id: 'crimea',
    name: 'Crimea',
    claimants: ['UA', 'RU'],
    status: 'OCCUPIED', severity: 2,
    tradeRisk: 'Black Sea navigation; Azov Sea access; Russian Black Sea Fleet HQ',
    meta: 'Russia annexed Crimea in 2014. Ukraine and West don\'t recognise annexation. Kerch Bridge destroyed 2022/23. Sevastopol — Russian Black Sea Fleet HQ.',
    ring: [
      [32.5, 46.5], [36.7, 46.2], [36.7, 44.5], [32.5, 44.5], [32.5, 46.5],
    ],
  },
  {
    id: 'gaza',
    name: 'Gaza Strip',
    claimants: ['IL', 'PS'],
    status: 'ACTIVE', severity: 3,
    tradeRisk: 'Suez Canal routing shifts; regional escalation (Hezbollah, Houthi, Iran); oil risk premium',
    meta: 'Hamas-Israel war since Oct 7 2023. International shipping diverted from Red Sea. Risk of wider regional escalation. Oil benchmark risk-premium observer.',
    ring: [
      [34.22, 31.62], [34.58, 31.62], [34.58, 31.21], [34.22, 31.21], [34.22, 31.62],
    ],
  },
  {
    id: 'west-bank',
    name: 'West Bank',
    claimants: ['IL', 'PS'],
    status: 'OCCUPIED', severity: 2,
    meta: 'Israel controls Area C (~60%). Palestinian Authority governs Area A. Settlements expand. ICJ advisory opinion 2024: occupation unlawful.',
    ring: [
      [34.90, 32.60], [35.58, 32.60], [35.58, 31.35], [34.90, 31.35], [34.90, 32.60],
    ],
  },
  {
    id: 'western-sahara',
    name: 'Western Sahara',
    claimants: ['MA', 'EH'],
    status: 'OCCUPIED', severity: 1,
    tradeRisk: 'Phosphate supply (Morocco controls world\'s largest reserves)',
    meta: 'Morocco controls ~80% since 1975 Green March. Polisario Front backed by Algeria claims self-determination. Phosphate from Bou Craa critical for global fertiliser. US recognised Moroccan sovereignty 2020.',
    ring: [
      [-17.1, 27.7], [-8.7, 27.7], [-8.7, 20.8], [-17.1, 20.8], [-17.1, 27.7],
    ],
  },
  {
    id: 'nagorno-karabakh',
    name: 'Nagorno-Karabakh (Karabakh)',
    claimants: ['AZ', 'AM'],
    status: 'OCCUPIED', severity: 2,
    tradeRisk: 'Caucasus energy corridor (BTC/SCP pipelines nearby); Russia-Turkey-Iran triangle',
    meta: 'Azerbaijan retook full control in Sept 2023 blitz. Armenian population fled. Armenia-Azerbaijan border still tense. Peace treaty unsigned.',
    ring: [
      [45.0, 40.5], [47.5, 40.5], [47.5, 39.0], [45.0, 39.0], [45.0, 40.5],
    ],
  },
  {
    id: 'golan-heights',
    name: 'Golan Heights',
    claimants: ['IL', 'SY'],
    status: 'OCCUPIED', severity: 1,
    meta: 'Israel captured 1967; annexed 1981 (unrecognised except by US). Syrian government nominally claims. Oil exploration rights contested (Genie Energy).',
    ring: [
      [35.60, 33.45], [36.00, 33.45], [36.00, 32.60], [35.60, 32.60], [35.60, 33.45],
    ],
  },

  // ── Africa ────────────────────────────────────────────────────────────────
  {
    id: 'ethiopia-tigray',
    name: 'Tigray / Horn of Africa tensions',
    claimants: ['ET', 'ER'],
    status: 'FROZEN', severity: 2,
    tradeRisk: 'Djibouti port access (Ethiopia landlocked); coffee/sesame exports disruption',
    meta: 'Tigray War 2020-2022 (est. 300k–500k dead) ended with Pretoria Agreement. Eritrea-Ethiopia border still undemarcated. Ongoing displacement.',
    ring: [
      [36.5, 15.5], [40.0, 15.5], [40.0, 12.0], [36.5, 12.0], [36.5, 15.5],
    ],
  },
  {
    id: 'sudan-rss',
    name: 'Sudan Civil War',
    claimants: ['SD-SAF', 'SD-RSF'],
    status: 'ACTIVE', severity: 3,
    tradeRisk: 'Nile hydro; gold exports (SAF vs. RSF mines); Chad/Egypt refugee burden',
    meta: 'SAF vs. RSF civil war since April 2023. Khartoum destroyed. Darfur famine conditions. Gold fields contested. ~8M displaced — world\'s largest displacement crisis 2024.',
    ring: [
      [23.5, 22.0], [37.5, 22.0], [37.5, 10.0], [23.5, 10.0], [23.5, 22.0],
    ],
  },

  // ── Europe / Former Soviet ────────────────────────────────────────────────
  {
    id: 'kosovo',
    name: 'Kosovo',
    claimants: ['XK', 'RS'],
    status: 'FROZEN', severity: 1,
    meta: 'Kosovo declared independence 2008; recognised by 100+ states but not Serbia/Russia/China/5 EU states. KFOR still present. North Kosovo tensions periodic.',
    ring: [
      [20.00, 43.30], [21.80, 43.30], [21.80, 41.85], [20.00, 41.85], [20.00, 43.30],
    ],
  },
  {
    id: 'transnistria',
    name: 'Transnistria',
    claimants: ['MD', 'PMR'],
    status: 'FROZEN', severity: 1,
    meta: 'Breakaway region supported by Russia since 1992. Russian 14th Army remnant. Gas transit point. Moldova accession candidate complicates.',
    ring: [
      [28.50, 48.00], [30.10, 48.00], [30.10, 46.30], [28.50, 46.30], [28.50, 48.00],
    ],
  },
  {
    id: 'abkhazia',
    name: 'Abkhazia',
    claimants: ['GE', 'RU'],
    status: 'OCCUPIED', severity: 1,
    meta: 'Russia recognises independence since 2008 war. Georgia and most of world consider occupied. Strategic Black Sea coast.',
    ring: [
      [40.00, 43.60], [42.10, 43.60], [42.10, 42.60], [40.00, 42.60], [40.00, 43.60],
    ],
  },
  {
    id: 's-ossetia',
    name: 'South Ossetia',
    claimants: ['GE', 'RU'],
    status: 'OCCUPIED', severity: 1,
    meta: 'Russian-backed breakaway since 2008 war. Russia-Georgia energy pipeline (BTC, SCP) runs nearby. Strategically placed in Caucasus energy corridor.',
    ring: [
      [43.80, 42.50], [44.80, 42.50], [44.80, 42.00], [43.80, 42.00], [43.80, 42.50],
    ],
  },

  // ── Arctic ────────────────────────────────────────────────────────────────
  {
    id: 'arctic-claims',
    name: 'Arctic Continental Shelf Claims',
    claimants: ['RU', 'CA', 'DK', 'NO', 'US'],
    status: 'CLAIMED', severity: 1,
    tradeRisk: 'Northern Sea Route control; oil/gas (Lomonosov Ridge); rare earth seabed',
    meta: 'UNCLOS claims extend overlapping to North Pole. Russia, Canada, Denmark (Greenland) all claim Lomonosov Ridge. US not UNCLOS signatory. Accelerating as ice retreats.',
    ring: [
      [-180, 90], [180, 90], [180, 72], [-180, 72], [-180, 90],
    ],
  },

  // ── Latin America ─────────────────────────────────────────────────────────
  {
    id: 'venezuela-essequibo',
    name: 'Essequibo (Venezuela-Guyana)',
    claimants: ['VE', 'GY'],
    status: 'CLAIMED', severity: 2,
    tradeRisk: 'Massive offshore oil block at Stabroek; ExxonMobil operations',
    meta: 'Venezuela claims 2/3 of Guyana (Essequibo region). Referendum Dec 2023: Venezuelans voted to annex. Exxon/Hess $10B+ offshore block at stake. ICJ ordered Venezuela not to proceed.',
    ring: [
      [-61.50, 9.00], [-57.00, 9.00], [-57.00, 1.00], [-61.50, 1.00], [-61.50, 9.00],
    ],
  },
  {
    id: 'falklands',
    name: 'Falkland Islands / Malvinas',
    claimants: ['GB', 'AR'],
    status: 'CLAIMED', severity: 1,
    tradeRisk: 'Hydrocarbon exploration (Rockhopper); fishing rights; South Atlantic shipping',
    meta: 'UK administers; Argentina claims. 1982 war — UK retook islands. Ongoing Argentine diplomatic pressure. Oil exploration permits controversial.',
    ring: [
      [-61.50, -51.00], [-57.50, -51.00], [-57.50, -53.00], [-61.50, -53.00], [-61.50, -51.00],
    ],
  },
];

export const DISPUTE_STATUS_COLOR: Record<DisputeStatus, string> = {
  ACTIVE:   'hsl(0, 90%, 55%)',
  OCCUPIED: 'hsl(15, 90%, 55%)',
  FROZEN:   'hsl(35, 90%, 55%)',
  CLAIMED:  'hsl(48, 85%, 55%)',
};

export const DISPUTE_SEVERITY_OPACITY: Record<1 | 2 | 3, number> = {
  1: 0.08,
  2: 0.14,
  3: 0.22,
};
