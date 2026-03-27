// ============================================================
// TinyEmpire — Age Configuration Data
// ============================================================

import type { AgeId, BuildingType, Resources, StorageCaps } from '../types/index.ts';

export interface AgeConfig {
  id: AgeId;
  name: string;
  index: number;
  advanceCost: Resources;
  advanceTime: number; // seconds
  advanceRequirements: {
    minVillagers: number;
    requiredBuildings: BuildingType[];
  };
  storageCaps: StorageCaps;
  productionMultiplier: number;
  unlockedBuildings: BuildingType[];
  unlockedUnits: string[];
}

export const AGE_CONFIGS: Record<AgeId, AgeConfig> = {

  stone: {
    id: 'stone',
    name: 'Stone Age',
    index: 0,
    advanceCost: { food: 0, wood: 0, stone: 0, gold: 0 },
    advanceTime: 0,
    advanceRequirements: {
      minVillagers: 0,
      requiredBuildings: [],
    },
    storageCaps: { food: 500, wood: 500, stone: 200, gold: 100 },
    productionMultiplier: 1.0,
    unlockedBuildings: [
      'townCenter',
      'house',
      'farm',
      'mill',
      'granary',
      'lumberCamp',
      'watchTower',
      'stoneWall',
      'outpost',
    ],
    unlockedUnits: ['villager', 'clubman'],
  },

  tool: {
    id: 'tool',
    name: 'Tool Age',
    index: 1,
    advanceCost: { food: 200, wood: 100, stone: 0, gold: 0 },
    advanceTime: 30,
    advanceRequirements: {
      minVillagers: 8,
      requiredBuildings: ['lumberCamp'],
    },
    storageCaps: { food: 1200, wood: 1000, stone: 500, gold: 300 },
    productionMultiplier: 1.3,
    unlockedBuildings: [
      'lumberCamp',
      'miningCamp',
      'lumberYard',
      'barracks',
      'market',
      'blacksmith',
    ],
    unlockedUnits: ['axeman', 'scout'],
  },

  bronze: {
    id: 'bronze',
    name: 'Bronze Age',
    index: 2,
    advanceCost: { food: 500, wood: 300, stone: 200, gold: 50 },
    advanceTime: 60,
    advanceRequirements: {
      minVillagers: 15,
      requiredBuildings: ['market', 'barracks'],
    },
    storageCaps: { food: 3000, wood: 2500, stone: 1200, gold: 800 },
    productionMultiplier: 1.7,
    unlockedBuildings: [
      'archeryRange',
      'stable',
      'temple',
      'gate',
      'stoneVault',
    ],
    unlockedUnits: ['swordsman', 'archer', 'cavalry', 'priest'],
  },

  iron: {
    id: 'iron',
    name: 'Iron Age',
    index: 3,
    advanceCost: { food: 1200, wood: 800, stone: 600, gold: 300 },
    advanceTime: 90,
    advanceRequirements: {
      minVillagers: 25,
      requiredBuildings: ['stoneWall'],
    },
    storageCaps: { food: 8000, wood: 6000, stone: 3000, gold: 2000 },
    productionMultiplier: 2.2,
    unlockedBuildings: [
      'university',
      'siegeWorkshop',
      'bombardTower',
      'treasury',
    ],
    unlockedUnits: ['legion', 'crossbowman', 'knight', 'batteringRam', 'catapult'],
  },

  medieval: {
    id: 'medieval',
    name: 'Medieval Age',
    index: 4,
    advanceCost: { food: 3000, wood: 2000, stone: 1500, gold: 1000 },
    advanceTime: 120,
    advanceRequirements: {
      minVillagers: 35,
      requiredBuildings: ['university'],
    },
    storageCaps: { food: 20000, wood: 15000, stone: 8000, gold: 5000 },
    productionMultiplier: 3.0,
    unlockedBuildings: [
      'castle',
      'bank',
      'monastery',
      'wonder',
    ],
    unlockedUnits: ['champion', 'longbowman', 'paladin', 'trebuchet', 'handCannoneer'],
  },

  imperial: {
    id: 'imperial',
    name: 'Imperial Age',
    index: 5,
    advanceCost: { food: 8000, wood: 5000, stone: 4000, gold: 3000 },
    advanceTime: 180,
    advanceRequirements: {
      minVillagers: 45,
      requiredBuildings: ['castle'],
    },
    storageCaps: { food: 50000, wood: 40000, stone: 20000, gold: 15000 },
    productionMultiplier: 4.0,
    unlockedBuildings: [
      'cannonFoundry',
      'imperialPalace',
    ],
    unlockedUnits: ['warElephant', 'bombardCannon', 'skirmisher', 'eliteChampion'],
  },

  renaissance: {
    id: 'renaissance',
    name: 'Renaissance Age',
    index: 6,
    advanceCost: { food: 15000, wood: 10000, stone: 8000, gold: 6000 },
    advanceTime: 240,
    advanceRequirements: {
      minVillagers: 55,
      requiredBuildings: ['wonder'],
    },
    storageCaps: { food: 80000, wood: 60000, stone: 30000, gold: 25000 },
    productionMultiplier: 5.0,
    unlockedBuildings: ['arsenal'],
    unlockedUnits: ['musketeer', 'galleon'],
  },

  industrial: {
    id: 'industrial',
    name: 'Industrial Age',
    index: 7,
    advanceCost: { food: 30000, wood: 20000, stone: 15000, gold: 12000 },
    advanceTime: 300,
    advanceRequirements: {
      minVillagers: 65,
      requiredBuildings: ['arsenal'],
    },
    storageCaps: { food: 150000, wood: 120000, stone: 60000, gold: 50000 },
    productionMultiplier: 7.0,
    unlockedBuildings: ['factory'],
    unlockedUnits: ['rifleman', 'steamCannon'],
  },

  modern: {
    id: 'modern',
    name: 'Modern Age',
    index: 8,
    advanceCost: { food: 60000, wood: 40000, stone: 30000, gold: 25000 },
    advanceTime: 360,
    advanceRequirements: {
      minVillagers: 75,
      requiredBuildings: ['factory'],
    },
    storageCaps: { food: 300000, wood: 250000, stone: 120000, gold: 100000 },
    productionMultiplier: 10.0,
    unlockedBuildings: [],
    unlockedUnits: ['tank', 'sniper'],
  },

};

// Ordered array of ages for sequential iteration
export const AGE_ORDER: AgeId[] = [
  'stone',
  'tool',
  'bronze',
  'iron',
  'medieval',
  'imperial',
  'renaissance',
  'industrial',
  'modern',
];

export function getNextAge(current: AgeId): AgeId | null {
  const idx = AGE_ORDER.indexOf(current);
  if (idx < 0 || idx >= AGE_ORDER.length - 1) return null;
  return AGE_ORDER[idx + 1];
}

export function getAgeIndex(id: AgeId): number {
  return AGE_ORDER.indexOf(id);
}
