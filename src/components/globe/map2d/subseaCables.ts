/**
 * Major intercontinental subsea fiber-optic cable systems. Curated approximate
 * paths (lng, lat) — recognizable shapes (Marea, 2Africa, SEA-ME-WE, Asia-America
 * Gateway, etc.) good enough for at-a-glance "where does internet flow" view.
 */
export type SubseaCable = {
  id: string;
  name: string;
  capacityTbps?: number;
  owner?: string;
  inService?: number;
  path: [number, number][]; // [lng, lat]
};

export const SUBSEA_CABLES: SubseaCable[] = [
  { id: 'marea', name: 'MAREA', capacityTbps: 200, owner: 'Microsoft / Meta / Telxius', inService: 2018,
    path: [[-75.5, 36.9], [-65, 38], [-50, 39.5], [-30, 40.5], [-15, 41.5], [-5, 41], [-2.4, 43.4]] },
  { id: 'grace-hopper', name: 'Grace Hopper', capacityTbps: 350, owner: 'Google', inService: 2022,
    path: [[-74, 40.7], [-60, 42], [-40, 45], [-20, 47], [-5, 50], [-1, 50.7]] },
  { id: 'dunant', name: 'Dunant', capacityTbps: 250, owner: 'Google', inService: 2021,
    path: [[-75, 36.5], [-60, 39], [-40, 41], [-20, 43], [-3, 45.6]] },
  { id: 'aag', name: 'Asia-America Gateway', capacityTbps: 2.88, owner: 'Consortium', inService: 2009,
    path: [[-118.4, 33.7], [-150, 28], [-170, 22], [170, 18], [150, 14], [130, 12], [121, 14.6], [114.2, 22.3], [108.2, 16.1], [103.7, 1.3]] },
  { id: 'sea-me-we-5', name: 'SEA-ME-WE 5', capacityTbps: 24, owner: 'Consortium', inService: 2016,
    path: [[103.7, 1.3], [97, 5], [85, 10], [73, 15], [60, 20], [45, 25], [35, 30], [29, 31.2], [14, 38], [2, 41.4]] },
  { id: '2africa', name: '2Africa', capacityTbps: 180, owner: 'Meta + partners', inService: 2024,
    path: [[-1, 50.7], [-9, 38.7], [-17, 14.7], [-13, 8.5], [-4, 5.3], [3.4, 6.5], [9.5, 4], [12.4, -6], [18.4, -33.9], [31, -29.9], [39, -6], [43, 12], [50, 25], [58, 23.6], [55, 25.3], [49, 25.3], [73, 17], [88, 22], [97, 5], [103.7, 1.3]] },
  { id: 'transpacific-express', name: 'Trans-Pacific Express', capacityTbps: 5.12, owner: 'Consortium', inService: 2008,
    path: [[-122.4, 37.8], [-150, 35], [-170, 32], [170, 30], [150, 28], [140, 35.7], [122, 31.2]] },
  { id: 'jupiter', name: 'JUPITER', capacityTbps: 60, owner: 'Consortium', inService: 2020,
    path: [[-118.4, 33.7], [-145, 30], [-170, 26], [170, 22], [150, 24], [140, 35.7], [122, 14.6]] },
  { id: 'firmina', name: 'Firmina', capacityTbps: 500, owner: 'Google', inService: 2024,
    path: [[-80.5, 32.8], [-70, 25], [-55, 10], [-45, -5], [-40, -20], [-43, -23]] },
  { id: 'hibernia-express', name: 'Hibernia Express', capacityTbps: 100, owner: 'GTT', inService: 2015,
    path: [[-74, 40.7], [-60, 45], [-40, 50], [-20, 52], [-6.3, 53.3]] },
  { id: 'apg', name: 'Asia Pacific Gateway', capacityTbps: 54, owner: 'Consortium', inService: 2016,
    path: [[121, 14.6], [115, 18], [110, 22], [114.2, 22.3], [121.6, 25], [127, 26.5], [139.7, 35.7]] },
  { id: 'eassy', name: 'EASSy', capacityTbps: 36, owner: 'Consortium', inService: 2010,
    path: [[32.6, 30], [35, 12], [39, -6], [43.2, -11.7], [49.4, -18.1], [31, -29.9]] },
  { id: 'sail', name: 'SAIL', capacityTbps: 32, owner: 'China Telecom', inService: 2018,
    path: [[-35, -5.8], [-20, -2], [0, 2], [9.5, 4]] },
  { id: 'tata-tgn', name: 'Tata TGN-Atlantic', capacityTbps: 5.12, owner: 'Tata', inService: 2001,
    path: [[-74, 40.7], [-65, 41.3], [-30, 45], [-12, 50], [-5, 50.7]] },
];
