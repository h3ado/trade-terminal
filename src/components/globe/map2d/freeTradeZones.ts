/**
 * Special Economic Zones (SEZs), Free Trade Zones (FTZs), and BRI-linked
 * industrial parks. These are magnets for FDI, manufacturing investment, and
 * supply-chain re-routing — key for EM equity and trade flow analysis.
 *
 * kind:
 *   ftz       — Free Trade Zone (customs / duty-free enclave)
 *   sez       — Special Economic Zone (broader: tax, labour, regulation breaks)
 *   ifsc      — International Financial Services Centre (e.g. GIFT City)
 *   bri_park  — BRI-linked industrial/logistics park
 *   sci_park  — Science/tech park with export focus
 *   ecozone   — Export Processing Zone / Economic Zone hybrid
 */

export type FTZKind = 'ftz' | 'sez' | 'ifsc' | 'bri_park' | 'sci_park' | 'ecozone';

export type FTZFeature = {
  id: string;
  name: string;
  kind: FTZKind;
  lat: number;
  lng: number;
  country: string;
  /** ISO-A2 host country */
  hostIso: string;
  operator?: string;
  established?: number;
  meta?: string;
  /** Annual trade volume (USD billions, approximate) */
  tradeUsdB?: number;
};

export const FREE_TRADE_ZONES: FTZFeature[] = [

  // ── China Pilot FTZs ──────────────────────────────────────────────────────
  { id: 'cn-shanghai-ftz', name: 'Shanghai Pilot FTZ', kind: 'ftz',
    lat: 31.20, lng: 121.60, country: 'CN', hostIso: 'CN', established: 2013, tradeUsdB: 320,
    meta: 'First and largest; Lingang New Area 2019 expansion; CPTPP test bed' },
  { id: 'cn-guangdong-ftz', name: 'Guangdong Pilot FTZ', kind: 'ftz',
    lat: 23.03, lng: 113.45, country: 'CN', hostIso: 'CN', established: 2015, tradeUsdB: 280,
    meta: 'Nansha (GZ) + Qianhai (SZ) + Hengqin (Zhuhai); Greater Bay Area hub' },
  { id: 'cn-tianjin-ftz', name: 'Tianjin Pilot FTZ', kind: 'ftz',
    lat: 38.99, lng: 117.20, country: 'CN', hostIso: 'CN', established: 2015, tradeUsdB: 120,
    meta: 'N. China finance/leasing hub; Airbus completion centre' },
  { id: 'cn-fujian-ftz', name: 'Fujian Pilot FTZ', kind: 'ftz',
    lat: 26.07, lng: 119.30, country: 'CN', hostIso: 'CN', established: 2015,
    meta: 'Taiwan cross-strait trade focus; shipping transshipment' },
  { id: 'cn-hainan-ftp', name: 'Hainan Free Trade Port', kind: 'ftz',
    lat: 19.93, lng: 110.33, country: 'CN', hostIso: 'CN', established: 2020, tradeUsdB: 80,
    meta: 'Zero-tariff for goods by 2025; entire island = FTP; biggest China FTZ project' },
  { id: 'cn-chongqing-ftz', name: 'Chongqing Pilot FTZ', kind: 'ftz',
    lat: 29.56, lng: 106.55, country: 'CN', hostIso: 'CN', established: 2017,
    meta: 'Inland logistics hub; Chengdu-Duisburg rail gateway' },
  { id: 'cn-hubei-ftz', name: 'Hubei (Wuhan) Pilot FTZ', kind: 'ftz',
    lat: 30.59, lng: 114.30, country: 'CN', hostIso: 'CN', established: 2017,
    meta: 'Auto/high-tech manufacturing; Donghu Science City' },

  // ── UAE ───────────────────────────────────────────────────────────────────
  { id: 'ae-jafza', name: 'Jebel Ali FTZ (JAFZA)', kind: 'ftz',
    lat: 25.00, lng: 55.08, country: 'AE', hostIso: 'AE', established: 1985, tradeUsdB: 135,
    operator: 'DP World', meta: 'World\'s largest FTZ; 9,500+ companies; 33% UAE non-oil GDP' },
  { id: 'ae-kizad', name: 'KIZAD Abu Dhabi', kind: 'sez',
    lat: 24.47, lng: 54.55, country: 'AE', hostIso: 'AE', established: 2010, tradeUsdB: 40,
    operator: 'AD Ports', meta: 'Khalifa Industrial Zone; aluminium+petrochemicals anchor' },
  { id: 'ae-dic', name: 'Dubai Internet City', kind: 'sci_park',
    lat: 25.10, lng: 55.16, country: 'AE', hostIso: 'AE', established: 2000,
    meta: 'Tech hub; Google, Microsoft, Meta, Oracle all present; 0% tax' },
  { id: 'ae-difc', name: 'Dubai International Financial Centre', kind: 'ifsc',
    lat: 25.21, lng: 55.28, country: 'AE', hostIso: 'AE', established: 2004,
    meta: 'English common law; 0% corporate/personal tax; ~6,500 firms; $5T+ AUM' },
  { id: 'ae-rakftz', name: 'Ras Al Khaimah FTZ', kind: 'ftz',
    lat: 25.79, lng: 55.97, country: 'AE', hostIso: 'AE', established: 2000,
    meta: 'Low-cost FTZ; 100% foreign ownership; ceramics/pharma anchor' },
  { id: 'ae-adgm', name: 'Abu Dhabi Global Market (ADGM)', kind: 'ifsc',
    lat: 24.45, lng: 54.40, country: 'AE', hostIso: 'AE', established: 2015,
    meta: 'ADNOC/sovereign wealth finance hub; English law enclave on Al Maryah Island' },

  // ── Singapore ─────────────────────────────────────────────────────────────
  { id: 'sg-jurong', name: 'Jurong Island Industrial Estate', kind: 'sez',
    lat: 1.27, lng: 103.70, country: 'SG', hostIso: 'SG', established: 1995, tradeUsdB: 60,
    meta: 'Petrochemical/energy hub; Shell, ExxonMobil, Chevron; integrated with port' },
  { id: 'sg-changi-ftz', name: 'Changi Airport FTZ', kind: 'ftz',
    lat: 1.36, lng: 103.99, country: 'SG', hostIso: 'SG', established: 1981,
    meta: 'Air cargo FTZ; 5 sub-zones; 1.9M tonnes/yr air freight' },
  { id: 'sg-one-north', name: 'One-North Science Park', kind: 'sci_park',
    lat: 1.30, lng: 103.79, country: 'SG', hostIso: 'SG', established: 2001,
    meta: 'Biotech/pharma/fintech cluster; NUS, A*STAR anchor' },

  // ── India ─────────────────────────────────────────────────────────────────
  { id: 'in-gift-city', name: 'GIFT City (IFSC)', kind: 'ifsc',
    lat: 23.17, lng: 72.68, country: 'IN', hostIso: 'IN', established: 2015,
    meta: 'India\'s first IFSC; offshore banking, insurance, capital markets; 0% STCG' },
  { id: 'in-kandla-sez', name: 'Kandla SEZ (Deendayal Port)', kind: 'sez',
    lat: 23.05, lng: 70.22, country: 'IN', hostIso: 'IN', established: 1965, tradeUsdB: 8,
    meta: 'India\'s first EPZ; textiles, chemicals, engineering' },
  { id: 'in-noida-sez', name: 'NSEZ Noida', kind: 'sez',
    lat: 28.57, lng: 77.34, country: 'IN', hostIso: 'IN', established: 1986,
    meta: 'IT/garment exports; near Delhi NCR manufacturing' },
  { id: 'in-sriperumbudur', name: 'Sriperumbudur SEZ', kind: 'sci_park',
    lat: 12.97, lng: 79.95, country: 'IN', hostIso: 'IN', established: 2005, tradeUsdB: 15,
    meta: 'Electronics hub; Foxconn iPhone assembly; Samsung, Hyundai' },

  // ── Ireland ───────────────────────────────────────────────────────────────
  { id: 'ie-shannon', name: 'Shannon FTZ', kind: 'ftz',
    lat: 52.70, lng: -8.86, country: 'IE', hostIso: 'IE', established: 1959,
    meta: 'World\'s first FTZ (1959); Shannon airport; aircraft leasing sector anchor' },
  { id: 'ie-ifsc-dublin', name: 'Dublin IFSC', kind: 'ifsc',
    lat: 53.35, lng: -6.24, country: 'IE', hostIso: 'IE', established: 1987, tradeUsdB: 30,
    meta: 'US tech/pharma EU HQs (Apple, Google, Microsoft, Pfizer); 12.5% corp tax' },

  // ── Vietnam ───────────────────────────────────────────────────────────────
  { id: 'vn-binh-duong', name: 'Binh Duong Industrial Parks', kind: 'ecozone',
    lat: 10.98, lng: 106.65, country: 'VN', hostIso: 'VN', established: 1996, tradeUsdB: 28,
    meta: 'Largest industrial zone cluster in Vietnam; Samsung, Intel, Canon present' },
  { id: 'vn-dong-nai', name: 'Dong Nai Industrial Parks', kind: 'ecozone',
    lat: 11.07, lng: 107.17, country: 'VN', hostIso: 'VN', established: 1994, tradeUsdB: 20,
    meta: 'Near HCMC; auto (Toyota)/electronics manufacturing' },
  { id: 'vn-da-nang', name: 'Da Nang High-Tech Park', kind: 'sci_park',
    lat: 16.05, lng: 108.20, country: 'VN', hostIso: 'VN', established: 2010,
    meta: 'IT software exports; Intel packaging+test; Samsung' },
  { id: 'vn-hai-phong', name: 'DEEP C Industrial Zone (Hai Phong)', kind: 'ecozone',
    lat: 20.88, lng: 106.65, country: 'VN', hostIso: 'VN', established: 2006, tradeUsdB: 15,
    meta: 'N. Vietnam gateway; Foxconn, LG Electronics, Bridgestone' },

  // ── Malaysia ──────────────────────────────────────────────────────────────
  { id: 'my-iskandar', name: 'Iskandar Malaysia (Johor)', kind: 'sez',
    lat: 1.47, lng: 103.76, country: 'MY', hostIso: 'MY', established: 2006, tradeUsdB: 20,
    meta: 'Johor Bahru SEZ; adjacent Singapore; Forest City (Alibaba/Country Garden); data centre boom' },
  { id: 'my-penang-ftz', name: 'Penang FTZ', kind: 'ftz',
    lat: 5.35, lng: 100.40, country: 'MY', hostIso: 'MY', established: 1972, tradeUsdB: 55,
    meta: '\"Silicon Valley of the East\"; Intel, Micron, Bosch, NXP, Infineon chip manufacturing' },

  // ── Panama ────────────────────────────────────────────────────────────────
  { id: 'pa-colon', name: 'Colón Free Trade Zone', kind: 'ftz',
    lat: 9.37, lng: -79.89, country: 'PA', hostIso: 'PA', established: 1948, tradeUsdB: 25,
    meta: 'Americas\' largest FTZ; adjacent to Panama Canal; electronics/pharmaceuticals re-export hub' },
  { id: 'pa-ptp', name: 'Panama Pacifico (Howard AFB SEZ)', kind: 'sez',
    lat: 8.92, lng: -79.60, country: 'PA', hostIso: 'PA', established: 2007,
    meta: 'Former US Howard AFB; Dell, 3M, Caterpillar logistics hub' },

  // ── Egypt ─────────────────────────────────────────────────────────────────
  { id: 'eg-sczone', name: 'Suez Canal Economic Zone (SCZone)', kind: 'ecozone',
    lat: 30.59, lng: 32.29, country: 'EG', hostIso: 'EG', established: 2015, tradeUsdB: 10,
    meta: 'East Port Said + Ain Sokhna + Ismailia + Qantara West; Canal-linked logistics; Chinese investment' },
  { id: 'eg-tieda', name: 'TEDA Suez (Sino-Egyptian FTZ)', kind: 'bri_park',
    lat: 29.92, lng: 32.52, country: 'EG', hostIso: 'EG', established: 2000, operator: 'TEDA Group',
    meta: 'Chinese BRI industrial park; cement, petroleum equipment, fibre glass' },

  // ── BRI-Linked Industrial Parks ───────────────────────────────────────────
  { id: 'kh-sihanoukville', name: 'Sihanoukville SEZ', kind: 'bri_park',
    lat: 10.61, lng: 103.52, country: 'KH', hostIso: 'KH', established: 2008, operator: 'SIHANOUKVILLE SEZ Co.',
    meta: 'Chinese-backed; garments/electronics; casino controversy; China-Cambodia BRI anchor' },
  { id: 'lk-colombo-port-city', name: 'Colombo Port City (CHEC)', kind: 'bri_park',
    lat: 6.92, lng: 79.85, country: 'LK', hostIso: 'LK', established: 2016, operator: 'China Harbour Engineering',
    meta: '269 ha reclaimed land; Hambantota sister project; financial services + FTZ' },
  { id: 'zm-lusaka-itez', name: 'Lusaka East MFEZ', kind: 'bri_park',
    lat: -15.41, lng: 28.30, country: 'ZM', hostIso: 'ZM', established: 2012, operator: 'CNMC',
    meta: 'China Non-Ferrous Metals Mining; copper processing; resource linkage' },
  { id: 'ug-kampala-itez', name: 'Uganda-China Industrial Park', kind: 'bri_park',
    lat: 0.31, lng: 32.61, country: 'UG', hostIso: 'UG', established: 2015,
    meta: 'Mbale + Kampala; steel/construction materials; UCTIA cooperative' },
  { id: 'et-hawassa', name: 'Hawassa Industrial Park', kind: 'ecozone',
    lat: 7.06, lng: 38.48, country: 'ET', hostIso: 'ET', established: 2016,
    meta: 'Chinese-built eco-industrial park; garments; PVH, Gap, H&M supply chain anchor' },
  { id: 'pk-gwadar-sez', name: 'Gwadar FTZ (CPEC)', kind: 'bri_park',
    lat: 25.11, lng: 62.35, country: 'PK', hostIso: 'PK', established: 2016, operator: 'COPHC',
    meta: 'CPEC cornerstone; duty-free for 23 years; port-adjacent logistics + manufacturing' },
  { id: 'kz-khorgos', name: 'Khorgos International Centre (Kazakhstan)', kind: 'bri_park',
    lat: 44.23, lng: 80.27, country: 'KZ', hostIso: 'KZ', established: 2012,
    meta: 'China-Kazakhstan Khorgos border; dry port; Belt & Road transit logistics hub' },
  { id: 'by-great-stone', name: 'Great Stone Industrial Park (Belarus)', kind: 'bri_park',
    lat: 53.86, lng: 28.12, country: 'BY', hostIso: 'BY', established: 2012, operator: 'China-Belarus JIIP',
    meta: 'China-Belarus JV; industrial park near Minsk; EU sanctions targeted' },

  // ── Latin America ─────────────────────────────────────────────────────────
  { id: 'mx-ciudad-juarez-maquilas', name: 'Ciudad Juárez Maquiladora Zone', kind: 'ecozone',
    lat: 31.73, lng: -106.49, country: 'MX', hostIso: 'MX', established: 1965, tradeUsdB: 20,
    meta: 'IMMEX program; near US border; auto parts, electronics; USMCA nearshoring beneficiary' },
  { id: 'mx-monterrey-industry', name: 'Monterrey Industrial Corridor', kind: 'ecozone',
    lat: 25.69, lng: -100.32, country: 'MX', hostIso: 'MX', established: 1980, tradeUsdB: 35,
    meta: 'Nearshoring boom 2022+; Samsung, ACER, Kia, Trane. Tesla Nuevo León nearby.' },
  { id: 'br-manaus-ftz', name: 'Manaus Free Trade Zone', kind: 'ftz',
    lat: -3.11, lng: -60.03, country: 'BR', hostIso: 'BR', established: 1967, tradeUsdB: 20,
    meta: 'Amazon FTZ; electronics (Foxconn, Samsung) + motorbikes; tax incentive to protect Amazon' },
  { id: 'pa-colon-2', name: 'Barranquilla FTZ (Colombia)', kind: 'ftz',
    lat: 10.96, lng: -74.80, country: 'CO', hostIso: 'CO', established: 1993, tradeUsdB: 8,
    meta: 'Colombia Caribbean coast; manufacturing/logistics; Procaps pharma' },

  // ── Africa ────────────────────────────────────────────────────────────────
  { id: 'ke-epz', name: 'Kenya EPZ / Tatu City SEZ', kind: 'ecozone',
    lat: -1.02, lng: 37.00, country: 'KE', hostIso: 'KE', established: 1990,
    meta: 'Export Processing Zones + Tatu City new urban SEZ (Rendeavour); Google, Cheki' },
  { id: 'ng-lekki-ftz', name: 'Lekki FTZ (Nigeria)', kind: 'ftz',
    lat: 6.45, lng: 4.05, country: 'NG', hostIso: 'NG', established: 2006, operator: 'Tolaram',
    meta: 'Largest FTZ in sub-Saharan Africa; Lekki deep-sea port 2023 opening; Chinese investment' },
  { id: 'ma-tanger-zone', name: 'Tanger Med FTZ', kind: 'ftz',
    lat: 35.88, lng: -5.50, country: 'MA', hostIso: 'MA', established: 2007, tradeUsdB: 10,
    meta: 'Morocco\'s Tangier Med industrial zone; Renault, Stellantis auto manufacturing; Africa-EU gateway' },
];

export const FTZ_KIND_COLOR: Record<FTZKind, string> = {
  ftz:       'hsl(195, 90%, 60%)',
  sez:       'hsl(150, 80%, 55%)',
  ifsc:      'hsl(33, 100%, 55%)',
  bri_park:  'hsl(0, 85%, 55%)',
  sci_park:  'hsl(280, 75%, 65%)',
  ecozone:   'hsl(45, 85%, 55%)',
};

export const FTZ_KIND_LABEL: Record<FTZKind, string> = {
  ftz:       'Free Trade Zone',
  sez:       'Special Economic Zone',
  ifsc:      'Financial Centre (IFSC)',
  bri_park:  'BRI Industrial Park',
  sci_park:  'Science / Tech Park',
  ecozone:   'Export Processing Zone',
};
