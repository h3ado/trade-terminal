/**
 * Semiconductor fabrication sites — the nerve centres of the global chip supply
 * chain. Critical for traders tracking TSMC, ASML, NVDA, AMAT, and geopolitical
 * risk around Taiwan. Node = process node (e.g. "N3", "14nm"). Sanctioned sites
 * are rendered with a dashed red ring.
 *
 * Sources: company investor relations, SEMI, TrendForce, WikiFab, public filings.
 */

export type FabCompany =
  | 'TSMC' | 'Samsung' | 'Intel' | 'SK Hynix' | 'Micron'
  | 'ASML' | 'GlobalFoundries' | 'SMIC' | 'Bosch' | 'Infineon'
  | 'STMicro' | 'UMC' | 'Tower' | 'Kioxia' | 'WD' | 'Nanya' | 'PSMC';

export type FabKind = 'foundry' | 'iDM' | 'equipment' | 'memory' | 'packaging';

export type ChipFabFeature = {
  id: string;
  name: string;
  company: FabCompany;
  kind: FabKind;
  lat: number;
  lng: number;
  country: string;
  /** Leading node in production, e.g. "N3", "N5", "14nm", "HBM3". */
  node: string;
  /** Nameplate wafer starts per month (kWPM), or 0 if undisclosed. */
  capacityKwpm?: number;
  status: 'OPERATIONAL' | 'UNDER_CONSTRUCTION' | 'PLANNED' | 'OFFLINE';
  sanctioned: boolean;
  meta?: string;
};

export const CHIP_FABS: ChipFabFeature[] = [

  // ── TSMC ─────────────────────────────────────────────────────────────────
  { id: 'tsmc-fab18', name: 'TSMC Fab 18 (N3/N5)', company: 'TSMC', kind: 'foundry',
    lat: 23.01, lng: 120.21, country: 'TW', node: 'N3', capacityKwpm: 100,
    status: 'OPERATIONAL', sanctioned: false, meta: 'Tainan Science Park · World #1 advanced logic' },
  { id: 'tsmc-fab12', name: 'TSMC Fab 12 (N7/N10)', company: 'TSMC', kind: 'foundry',
    lat: 24.78, lng: 120.98, country: 'TW', node: 'N7', capacityKwpm: 80,
    status: 'OPERATIONAL', sanctioned: false, meta: 'Hsinchu Science Park · NVIDIA/Apple customer' },
  { id: 'tsmc-fab14', name: 'TSMC Fab 14 (N5/N4P)', company: 'TSMC', kind: 'foundry',
    lat: 23.01, lng: 120.22, country: 'TW', node: 'N5', capacityKwpm: 60,
    status: 'OPERATIONAL', sanctioned: false, meta: 'Southern Taiwan · Apple A-series' },
  { id: 'tsmc-fab6', name: 'TSMC Fab 6 (N16/N28)', company: 'TSMC', kind: 'foundry',
    lat: 24.77, lng: 120.97, country: 'TW', node: 'N16', capacityKwpm: 50,
    status: 'OPERATIONAL', sanctioned: false, meta: 'Hsinchu · mature node volume' },
  { id: 'tsmc-arizona', name: 'TSMC Phoenix Fab 21', company: 'TSMC', kind: 'foundry',
    lat: 33.64, lng: -112.01, country: 'US', node: 'N4P', capacityKwpm: 20,
    status: 'OPERATIONAL', sanctioned: false, meta: '$65B investment · CHIPS Act · Phase 1 online 2024' },
  { id: 'tsmc-arizona-p2', name: 'TSMC Phoenix Fab 21 P2', company: 'TSMC', kind: 'foundry',
    lat: 33.63, lng: -112.00, country: 'US', node: 'N3', capacityKwpm: 30,
    status: 'UNDER_CONSTRUCTION', sanctioned: false, meta: 'Phase 2 · N3E · target 2028' },
  { id: 'tsmc-kumamoto', name: 'TSMC JASM Fab (Kumamoto)', company: 'TSMC', kind: 'foundry',
    lat: 32.80, lng: 130.78, country: 'JP', node: 'N28', capacityKwpm: 55,
    status: 'OPERATIONAL', sanctioned: false, meta: 'JASM JV with Sony/Denso · $8.6B · opened 2024' },
  { id: 'tsmc-kumamoto-p2', name: 'TSMC JASM Fab P2 (Kumamoto)', company: 'TSMC', kind: 'foundry',
    lat: 32.79, lng: 130.77, country: 'JP', node: 'N6', capacityKwpm: 40,
    status: 'UNDER_CONSTRUCTION', sanctioned: false, meta: 'Phase 2 · N6/N12 · target 2027' },
  { id: 'tsmc-dresden', name: 'TSMC ESMC Fab (Dresden)', company: 'TSMC', kind: 'foundry',
    lat: 51.06, lng: 13.77, country: 'DE', node: 'N28', capacityKwpm: 40,
    status: 'UNDER_CONSTRUCTION', sanctioned: false, meta: 'ESMC JV · Bosch/Infineon/NXP · target 2027 · €10B' },
  { id: 'tsmc-n2-kaohsiung', name: 'TSMC Fab 20 (N2)', company: 'TSMC', kind: 'foundry',
    lat: 22.61, lng: 120.32, country: 'TW', node: 'N2', capacityKwpm: 50,
    status: 'UNDER_CONSTRUCTION', sanctioned: false, meta: 'Kaohsiung · N2 gate-all-around · target 2025' },

  // ── Samsung ───────────────────────────────────────────────────────────────
  { id: 'samsung-hwaseong', name: 'Samsung Hwaseong (S-1 Line)', company: 'Samsung', kind: 'foundry',
    lat: 37.20, lng: 127.06, country: 'KR', node: '3nm', capacityKwpm: 90,
    status: 'OPERATIONAL', sanctioned: false, meta: 'GAA 3nm · SFDP campus' },
  { id: 'samsung-pyeongtaek', name: 'Samsung Pyeongtaek (P3/P4)', company: 'Samsung', kind: 'foundry',
    lat: 36.99, lng: 127.00, country: 'KR', node: '3nm', capacityKwpm: 120,
    status: 'OPERATIONAL', sanctioned: false, meta: 'Largest single fab campus · HBM3E + logic' },
  { id: 'samsung-taylor', name: 'Samsung Taylor Fab', company: 'Samsung', kind: 'foundry',
    lat: 30.57, lng: -97.43, country: 'US', node: '4nm', capacityKwpm: 30,
    status: 'UNDER_CONSTRUCTION', sanctioned: false, meta: '$17B · CHIPS Act · Taylor TX · target 2026' },
  { id: 'samsung-xian', name: 'Samsung Xi\'an (NAND)', company: 'Samsung', kind: 'memory',
    lat: 34.38, lng: 108.97, country: 'CN', node: '176L NAND', capacityKwpm: 50,
    status: 'OPERATIONAL', sanctioned: false, meta: 'Largest overseas fab · NAND flash · license scrutiny' },
  { id: 'samsung-germany', name: 'Samsung Fab (Germany TBD)', company: 'Samsung', kind: 'foundry',
    lat: 51.50, lng: 10.00, country: 'DE', node: '5nm', capacityKwpm: 20,
    status: 'PLANNED', sanctioned: false, meta: 'Exploring Germany site · EU Chips Act · TBD' },

  // ── Intel ────────────────────────────────────────────────────────────────
  { id: 'intel-chandler', name: 'Intel Chandler (Fab 52/62)', company: 'Intel', kind: 'iDM',
    lat: 33.36, lng: -111.90, country: 'US', node: 'Intel 18A', capacityKwpm: 60,
    status: 'OPERATIONAL', sanctioned: false, meta: 'Arizona campus · Intel 20A/18A · CHIPS Act $8.5B' },
  { id: 'intel-hillsboro', name: 'Intel Hillsboro (D1X)', company: 'Intel', kind: 'iDM',
    lat: 45.53, lng: -122.95, country: 'US', node: 'Intel 18A', capacityKwpm: 30,
    status: 'OPERATIONAL', sanctioned: false, meta: 'Oregon R&D fab · process development lead' },
  { id: 'intel-ohio', name: 'Intel Ohio (New Albany)', company: 'Intel', kind: 'iDM',
    lat: 40.08, lng: -82.79, country: 'US', node: 'Intel 18A', capacityKwpm: 60,
    status: 'UNDER_CONSTRUCTION', sanctioned: false, meta: '$28B · Two fabs · CHIPS Act · target 2026-2028' },
  { id: 'intel-leixlip', name: 'Intel Leixlip (Fab 24/34)', company: 'Intel', kind: 'iDM',
    lat: 53.36, lng: -6.50, country: 'IE', node: 'Intel 4', capacityKwpm: 50,
    status: 'OPERATIONAL', sanctioned: false, meta: 'Ireland campus · Meteor Lake production' },
  { id: 'intel-magdeburg', name: 'Intel Silicon Junction (Magdeburg)', company: 'Intel', kind: 'iDM',
    lat: 52.13, lng: 11.62, country: 'DE', node: 'Intel 18A', capacityKwpm: 40,
    status: 'PLANNED', sanctioned: false, meta: '€17B · EU Chips Act · target 2027 (delayed)' },
  { id: 'intel-kiryat-gat', name: 'Intel Fab 28/38 (Kiryat Gat)', company: 'Intel', kind: 'iDM',
    lat: 31.61, lng: 34.77, country: 'IL', node: 'Intel 7', capacityKwpm: 40,
    status: 'OPERATIONAL', sanctioned: false, meta: '$25B expansion · Israel largest foreign investment' },

  // ── SK Hynix ──────────────────────────────────────────────────────────────
  { id: 'skhynix-icheon', name: 'SK Hynix M14/M16 (Icheon)', company: 'SK Hynix', kind: 'memory',
    lat: 37.27, lng: 127.45, country: 'KR', node: 'HBM3E / DRAM', capacityKwpm: 120,
    status: 'OPERATIONAL', sanctioned: false, meta: 'Headquarter campus · HBM3E for NVIDIA H100/H200' },
  { id: 'skhynix-cheongju', name: 'SK Hynix M11/M15X (Cheongju)', company: 'SK Hynix', kind: 'memory',
    lat: 36.64, lng: 127.49, country: 'KR', node: '128-238L NAND', capacityKwpm: 80,
    status: 'OPERATIONAL', sanctioned: false, meta: 'Soldering NAND · Cheongju campus' },
  { id: 'skhynix-bloomington', name: 'SK Hynix Bloomington IN', company: 'SK Hynix', kind: 'memory',
    lat: 39.17, lng: -86.52, country: 'US', node: 'HBM4', capacityKwpm: 40,
    status: 'PLANNED', sanctioned: false, meta: '$3.87B CHIPS Act · advanced packaging + HBM · target 2028' },
  { id: 'skhynix-wuxi', name: 'SK Hynix Wuxi (DRAM)', company: 'SK Hynix', kind: 'memory',
    lat: 31.49, lng: 120.31, country: 'CN', node: 'DRAM 1znm', capacityKwpm: 40,
    status: 'OPERATIONAL', sanctioned: false, meta: 'China DRAM · export control scrutiny' },

  // ── Micron ───────────────────────────────────────────────────────────────
  { id: 'micron-boise', name: 'Micron Fab 10 (Boise)', company: 'Micron', kind: 'memory',
    lat: 43.61, lng: -116.20, country: 'US', node: '1β DRAM', capacityKwpm: 50,
    status: 'OPERATIONAL', sanctioned: false, meta: 'Headquarters fab · DRAM · CHIPS Act upgrade' },
  { id: 'micron-clay', name: 'Micron Clay NY Megafab', company: 'Micron', kind: 'memory',
    lat: 43.20, lng: -76.19, country: 'US', node: '1γ DRAM', capacityKwpm: 60,
    status: 'UNDER_CONSTRUCTION', sanctioned: false, meta: '$100B over 20yr · largest US semiconductor project ever' },
  { id: 'micron-singapore', name: 'Micron Singapore (Fab 10N)', company: 'Micron', kind: 'memory',
    lat: 1.38, lng: 103.79, country: 'SG', node: 'LPDDR5', capacityKwpm: 40,
    status: 'OPERATIONAL', sanctioned: false, meta: 'Mobile DRAM · $4B expansion' },
  { id: 'micron-hiroshima', name: 'Micron Hiroshima (HM)', company: 'Micron', kind: 'memory',
    lat: 34.45, lng: 132.45, country: 'JP', node: '1α DRAM', capacityKwpm: 35,
    status: 'OPERATIONAL', sanctioned: false, meta: 'Former Elpida · Japan CHIPS grant ¥46B' },
  { id: 'micron-taichung', name: 'Micron Taichung (NAND)', company: 'Micron', kind: 'memory',
    lat: 24.17, lng: 120.65, country: 'TW', node: '176L NAND', capacityKwpm: 30,
    status: 'OPERATIONAL', sanctioned: false, meta: 'Former Inotera · NAND backend' },

  // ── ASML ─────────────────────────────────────────────────────────────────
  { id: 'asml-veldhoven', name: 'ASML HQ & EUV Factory', company: 'ASML', kind: 'equipment',
    lat: 51.41, lng: 5.45, country: 'NL', node: 'High-NA EUV', capacityKwpm: 0,
    status: 'OPERATIONAL', sanctioned: false, meta: 'Global EUV monopoly · ~€8B/yr machines · export controlled to CN' },
  { id: 'asml-wilton', name: 'ASML Wilton CT (Cymer)', company: 'ASML', kind: 'equipment',
    lat: 41.19, lng: -73.43, country: 'US', node: 'DUV laser', capacityKwpm: 0,
    status: 'OPERATIONAL', sanctioned: false, meta: 'Light source manufacturing · ArF immersion' },
  { id: 'asml-berlin', name: 'ASML Berlin (Berliner Glas)', company: 'ASML', kind: 'equipment',
    lat: 52.52, lng: 13.40, country: 'DE', node: 'Optics', capacityKwpm: 0,
    status: 'OPERATIONAL', sanctioned: false, meta: 'Precision optics for EUV · Carl Zeiss SMT partner' },

  // ── GlobalFoundries ───────────────────────────────────────────────────────
  { id: 'gf-malta', name: 'GlobalFoundries Malta NY (Fab 8)', company: 'GlobalFoundries', kind: 'foundry',
    lat: 42.99, lng: -73.76, country: 'US', node: '12LP+', capacityKwpm: 60,
    status: 'OPERATIONAL', sanctioned: false, meta: 'Largest US fab by floor space · CHIPS Act $1.5B' },
  { id: 'gf-dresden', name: 'GlobalFoundries Dresden (Fab 1)', company: 'GlobalFoundries', kind: 'foundry',
    lat: 51.06, lng: 13.78, country: 'DE', node: '22FDX', capacityKwpm: 40,
    status: 'OPERATIONAL', sanctioned: false, meta: 'FD-SOI specialty · automotive/RF chips' },
  { id: 'gf-singapore', name: 'GlobalFoundries Singapore (Fab 7)', company: 'GlobalFoundries', kind: 'foundry',
    lat: 1.36, lng: 103.95, country: 'SG', node: '40LP', capacityKwpm: 40,
    status: 'OPERATIONAL', sanctioned: false, meta: 'Mature node · automotive · Singapore JV expansion' },
  { id: 'gf-burlington', name: 'GlobalFoundries Burlington VT (Fab 9)', company: 'GlobalFoundries', kind: 'foundry',
    lat: 44.48, lng: -73.22, country: 'US', node: '90nm SiGe', capacityKwpm: 15,
    status: 'OPERATIONAL', sanctioned: false, meta: 'SiGe BiCMOS · 5G RF chips · defense' },

  // ── SMIC (sanctioned) ────────────────────────────────────────────────────
  { id: 'smic-shanghai', name: 'SMIC Shanghai (Fab 1/2)', company: 'SMIC', kind: 'foundry',
    lat: 31.13, lng: 121.61, country: 'CN', node: '7nm (reverse engineered)', capacityKwpm: 70,
    status: 'OPERATIONAL', sanctioned: true, meta: 'China largest foundry · US Entity List · N+2 node controversy' },
  { id: 'smic-shenzhen', name: 'SMIC Shenzhen (SJ Fab)', company: 'SMIC', kind: 'foundry',
    lat: 22.55, lng: 113.90, country: 'CN', node: '28nm', capacityKwpm: 40,
    status: 'OPERATIONAL', sanctioned: true, meta: 'Entity List 2020 · mature node · Huawei supply' },
  { id: 'smic-beijing', name: 'SMIC Beijing (BJ Fab)', company: 'SMIC', kind: 'foundry',
    lat: 40.08, lng: 116.60, country: 'CN', node: '28nm', capacityKwpm: 45,
    status: 'OPERATIONAL', sanctioned: true, meta: 'Mature node · China defense customer base' },

  // ── European fabs ────────────────────────────────────────────────────────
  { id: 'bosch-dresden', name: 'Bosch Fab Dresden (SiC)', company: 'Bosch', kind: 'iDM',
    lat: 51.04, lng: 13.80, country: 'DE', node: '65nm SiC', capacityKwpm: 20,
    status: 'OPERATIONAL', sanctioned: false, meta: '€3B · SiC power chips for EV · opened 2021' },
  { id: 'infineon-villach', name: 'Infineon Module-3 (Villach)', company: 'Infineon', kind: 'iDM',
    lat: 46.61, lng: 13.85, country: 'AT', node: 'SiC 300mm', capacityKwpm: 25,
    status: 'OPERATIONAL', sanctioned: false, meta: '€1.6B · First 300mm SiC fab in Europe' },
  { id: 'stmicro-crolles', name: 'STMicro Crolles (FD-SOI)', company: 'STMicro', kind: 'foundry',
    lat: 45.28, lng: 5.91, country: 'FR', node: '18FDS', capacityKwpm: 30,
    status: 'OPERATIONAL', sanctioned: false, meta: 'SOITEC FD-SOI · EU Chips Act expansion · €7.5B' },
  { id: 'stmicro-catania', name: 'STMicro Catania (SiC)', company: 'STMicro', kind: 'iDM',
    lat: 37.51, lng: 15.09, country: 'IT', node: 'SiC', capacityKwpm: 15,
    status: 'OPERATIONAL', sanctioned: false, meta: 'SiC power · EV drivetrain · €730M expansion' },

  // ── Memory (other) ────────────────────────────────────────────────────────
  { id: 'kioxia-yokkaichi', name: 'Kioxia/WD Yokkaichi', company: 'Kioxia', kind: 'memory',
    lat: 34.97, lng: 136.62, country: 'JP', node: '218L NAND', capacityKwpm: 100,
    status: 'OPERATIONAL', sanctioned: false, meta: 'Kioxia + WDC JV · world NAND #2' },
  { id: 'kioxia-kitakami', name: 'Kioxia Kitakami (K1)', company: 'Kioxia', kind: 'memory',
    lat: 39.29, lng: 141.12, country: 'JP', node: '218L+ NAND', capacityKwpm: 50,
    status: 'UNDER_CONSTRUCTION', sanctioned: false, meta: '¥890B · Japan CHIPS · target 2025' },
  { id: 'umc-hsinchu', name: 'UMC Fab 12A (Hsinchu)', company: 'UMC', kind: 'foundry',
    lat: 24.79, lng: 121.01, country: 'TW', node: '22nm', capacityKwpm: 60,
    status: 'OPERATIONAL', sanctioned: false, meta: 'Mature specialty · 22nm/28nm · automotive' },
  { id: 'psmc-japan', name: 'PSMC SBI Japan Fab (Miyagi)', company: 'PSMC', kind: 'foundry',
    lat: 38.26, lng: 140.87, country: 'JP', node: '40nm', capacityKwpm: 30,
    status: 'PLANNED', sanctioned: false, meta: 'PSMC+SBI JV · ¥800B · 40nm specialty · target 2027' },
  { id: 'nanya-taoyuan', name: 'Nanya Tech Fab (Taoyuan)', company: 'Nanya', kind: 'memory',
    lat: 25.01, lng: 121.24, country: 'TW', node: '10nm DRAM', capacityKwpm: 25,
    status: 'OPERATIONAL', sanctioned: false, meta: 'Taiwan local DRAM' },
];

export const FAB_COMPANY_COLOR: Record<FabCompany, string> = {
  TSMC:            'hsl(195, 90%, 60%)',
  Samsung:         'hsl(220, 85%, 65%)',
  Intel:           'hsl(210, 80%, 55%)',
  'SK Hynix':      'hsl(170, 80%, 55%)',
  Micron:          'hsl(150, 75%, 55%)',
  ASML:            'hsl(280, 80%, 65%)',
  GlobalFoundries: 'hsl(35, 90%, 60%)',
  SMIC:            'hsl(0, 85%, 55%)',
  Bosch:           'hsl(48, 90%, 55%)',
  Infineon:        'hsl(90, 70%, 50%)',
  STMicro:         'hsl(330, 75%, 60%)',
  UMC:             'hsl(25, 80%, 55%)',
  Tower:           'hsl(60, 80%, 50%)',
  Kioxia:          'hsl(185, 80%, 55%)',
  WD:              'hsl(140, 65%, 50%)',
  Nanya:           'hsl(200, 70%, 55%)',
  PSMC:            'hsl(250, 70%, 60%)',
};

export const FAB_KIND_LABEL: Record<FabKind, string> = {
  foundry:   'Pure-Play Foundry',
  iDM:       'Integrated Device Mfr',
  equipment: 'Equipment / Tools',
  memory:    'Memory (DRAM/NAND)',
  packaging: 'Advanced Packaging',
};
