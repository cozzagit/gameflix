// ============================================================
// TinyEmpire — Building Configuration Data
// ============================================================

import type { AgeId, BuildingType, Resources, ResourceType } from '../types/index.ts';

export interface BuildingConfig {
  type: BuildingType;
  name: string;
  description: string;
  size: { cols: number; rows: number };
  baseCost: Resources;
  buildTime: number; // seconds
  maxLevel: number;
  populationProvided: number; // housing capacity added when built
  populationRequired: number; // villagers needed to construct
  unlockedAtAge: AgeId;
  category: 'economy' | 'military' | 'defense' | 'special';
  gatherBonus?: { resource: ResourceType; multiplier: number }; // bonus multiplier added per level
  productionRate?: Partial<Resources>; // passive resource production per second at level 1
}

export const BUILDING_CONFIGS: Record<BuildingType, BuildingConfig> = {

  // ── Core ────────────────────────────────────────────────────
  townCenter: {
    type: 'townCenter',
    name: 'Town Center',
    description: 'The heart of your empire. Trains villagers and acts as a resource drop-off point.',
    size: { cols: 2, rows: 2 },
    baseCost: { food: 0, wood: 0, stone: 0, gold: 0 },
    buildTime: 0,
    maxLevel: 3,
    populationProvided: 10,
    populationRequired: 0,
    unlockedAtAge: 'stone',
    category: 'special',
  },

  // ── Housing ─────────────────────────────────────────────────
  house: {
    type: 'house',
    name: 'House',
    description: 'Provides housing for your population. Each level adds more capacity.',
    size: { cols: 1, rows: 1 },
    baseCost: { food: 0, wood: 30, stone: 0, gold: 0 },
    buildTime: 10,
    maxLevel: 3,
    populationProvided: 5,
    populationRequired: 1,
    unlockedAtAge: 'stone',
    category: 'economy',
  },

  // ── Food Production ─────────────────────────────────────────
  farm: {
    type: 'farm',
    name: 'Farm',
    description: 'Grows food automatically. Higher levels yield more crops per harvest cycle.',
    size: { cols: 2, rows: 2 },
    baseCost: { food: 0, wood: 60, stone: 0, gold: 0 },
    buildTime: 15,
    maxLevel: 5,
    populationProvided: 0,
    populationRequired: 1,
    unlockedAtAge: 'stone',
    category: 'economy',
    productionRate: { food: 1.4 },
  },

  mill: {
    type: 'mill',
    name: 'Mill',
    description: 'Boosts food gathering speed for villagers working nearby fields.',
    size: { cols: 1, rows: 1 },
    baseCost: { food: 0, wood: 60, stone: 0, gold: 0 },
    buildTime: 12,
    maxLevel: 3,
    populationProvided: 0,
    populationRequired: 1,
    unlockedAtAge: 'stone',
    category: 'economy',
    gatherBonus: { resource: 'food', multiplier: 0.10 },
  },

  granary: {
    type: 'granary',
    name: 'Granary',
    description: 'Expands food storage capacity by 50% per level.',
    size: { cols: 1, rows: 1 },
    baseCost: { food: 0, wood: 100, stone: 0, gold: 0 },
    buildTime: 20,
    maxLevel: 3,
    populationProvided: 0,
    populationRequired: 1,
    unlockedAtAge: 'stone',
    category: 'economy',
  },

  // ── Wood & Stone ────────────────────────────────────────────
  lumberCamp: {
    type: 'lumberCamp',
    name: 'Lumber Camp',
    description: 'Increases wood gathering efficiency for all nearby woodcutters.',
    size: { cols: 1, rows: 1 },
    baseCost: { food: 0, wood: 50, stone: 0, gold: 0 },
    buildTime: 12,
    maxLevel: 3,
    populationProvided: 0,
    populationRequired: 1,
    unlockedAtAge: 'tool',
    category: 'economy',
    gatherBonus: { resource: 'wood', multiplier: 0.10 },
  },

  miningCamp: {
    type: 'miningCamp',
    name: 'Mining Camp',
    description: 'Increases stone and gold mining speed for villagers assigned here.',
    size: { cols: 1, rows: 1 },
    baseCost: { food: 0, wood: 80, stone: 0, gold: 0 },
    buildTime: 12,
    maxLevel: 3,
    populationProvided: 0,
    populationRequired: 1,
    unlockedAtAge: 'tool',
    category: 'economy',
    gatherBonus: { resource: 'stone', multiplier: 0.10 },
  },

  // ── Storage ─────────────────────────────────────────────────
  lumberYard: {
    type: 'lumberYard',
    name: 'Lumber Yard',
    description: 'Expands wood storage capacity by 50% per level.',
    size: { cols: 1, rows: 1 },
    baseCost: { food: 0, wood: 120, stone: 0, gold: 0 },
    buildTime: 20,
    maxLevel: 3,
    populationProvided: 0,
    populationRequired: 1,
    unlockedAtAge: 'tool',
    category: 'economy',
  },

  stoneVault: {
    type: 'stoneVault',
    name: 'Stone Vault',
    description: 'Expands stone storage capacity by 50% per level.',
    size: { cols: 1, rows: 1 },
    baseCost: { food: 0, wood: 80, stone: 60, gold: 0 },
    buildTime: 20,
    maxLevel: 3,
    populationProvided: 0,
    populationRequired: 1,
    unlockedAtAge: 'bronze',
    category: 'economy',
  },

  treasury: {
    type: 'treasury',
    name: 'Treasury',
    description: 'Expands gold storage capacity by 50% per level.',
    size: { cols: 1, rows: 1 },
    baseCost: { food: 0, wood: 100, stone: 80, gold: 0 },
    buildTime: 20,
    maxLevel: 3,
    populationProvided: 0,
    populationRequired: 1,
    unlockedAtAge: 'iron',
    category: 'economy',
  },

  // ── Trade & Finance ─────────────────────────────────────────
  market: {
    type: 'market',
    name: 'Market',
    description: 'Enables resource trading between types. Higher levels improve exchange rates.',
    size: { cols: 2, rows: 2 },
    baseCost: { food: 0, wood: 150, stone: 50, gold: 0 },
    buildTime: 30,
    maxLevel: 3,
    populationProvided: 0,
    populationRequired: 2,
    unlockedAtAge: 'tool',
    category: 'economy',
  },

  bank: {
    type: 'bank',
    name: 'Bank',
    description: 'Generates a passive gold income over time.',
    size: { cols: 2, rows: 2 },
    baseCost: { food: 0, wood: 0, stone: 400, gold: 300 },
    buildTime: 60,
    maxLevel: 3,
    populationProvided: 0,
    populationRequired: 3,
    unlockedAtAge: 'medieval',
    category: 'economy',
    productionRate: { gold: 0.5 },
  },

  // ── Military Training ────────────────────────────────────────
  barracks: {
    type: 'barracks',
    name: 'Barracks',
    description: 'Trains infantry units. Higher levels unlock stronger troops and faster training.',
    size: { cols: 2, rows: 2 },
    baseCost: { food: 0, wood: 120, stone: 0, gold: 0 },
    buildTime: 20,
    maxLevel: 3,
    populationProvided: 0,
    populationRequired: 2,
    unlockedAtAge: 'tool',
    category: 'military',
  },

  archeryRange: {
    type: 'archeryRange',
    name: 'Archery Range',
    description: 'Trains ranged units. Upgrade to access crossbowmen and longbowmen.',
    size: { cols: 2, rows: 2 },
    baseCost: { food: 0, wood: 180, stone: 0, gold: 80 },
    buildTime: 35,
    maxLevel: 3,
    populationProvided: 0,
    populationRequired: 2,
    unlockedAtAge: 'bronze',
    category: 'military',
  },

  stable: {
    type: 'stable',
    name: 'Stable',
    description: 'Trains cavalry units. Higher levels unlock knights and paladins.',
    size: { cols: 2, rows: 2 },
    baseCost: { food: 0, wood: 200, stone: 100, gold: 0 },
    buildTime: 40,
    maxLevel: 3,
    populationProvided: 0,
    populationRequired: 2,
    unlockedAtAge: 'bronze',
    category: 'military',
  },

  siegeWorkshop: {
    type: 'siegeWorkshop',
    name: 'Siege Workshop',
    description: 'Constructs siege engines for assaulting enemy fortifications.',
    size: { cols: 2, rows: 2 },
    baseCost: { food: 0, wood: 300, stone: 200, gold: 100 },
    buildTime: 50,
    maxLevel: 3,
    populationProvided: 0,
    populationRequired: 3,
    unlockedAtAge: 'iron',
    category: 'military',
  },

  cannonFoundry: {
    type: 'cannonFoundry',
    name: 'Cannon Foundry',
    description: 'Forges imperial-era artillery and war elephants.',
    size: { cols: 2, rows: 2 },
    baseCost: { food: 0, wood: 800, stone: 500, gold: 400 },
    buildTime: 100,
    maxLevel: 3,
    populationProvided: 0,
    populationRequired: 4,
    unlockedAtAge: 'imperial',
    category: 'military',
  },

  // ── Defenses ────────────────────────────────────────────────
  watchTower: {
    type: 'watchTower',
    name: 'Watch Tower',
    description: 'Reveals fog of war and fires arrows at approaching enemies.',
    size: { cols: 1, rows: 1 },
    baseCost: { food: 0, wood: 50, stone: 100, gold: 0 },
    buildTime: 25,
    maxLevel: 3,
    populationProvided: 0,
    populationRequired: 1,
    unlockedAtAge: 'stone',
    category: 'defense',
  },

  stoneWall: {
    type: 'stoneWall',
    name: 'Stone Wall',
    description: 'Blocks enemy movement. Upgrade to increase durability.',
    size: { cols: 1, rows: 1 },
    baseCost: { food: 0, wood: 0, stone: 30, gold: 0 },
    buildTime: 10,
    maxLevel: 2,
    populationProvided: 0,
    populationRequired: 1,
    unlockedAtAge: 'stone',
    category: 'defense',
  },

  gate: {
    type: 'gate',
    name: 'Gate',
    description: 'A wall section that can be opened to let friendly units through.',
    size: { cols: 1, rows: 1 },
    baseCost: { food: 0, wood: 40, stone: 80, gold: 0 },
    buildTime: 20,
    maxLevel: 1,
    populationProvided: 0,
    populationRequired: 1,
    unlockedAtAge: 'bronze',
    category: 'defense',
  },

  bombardTower: {
    type: 'bombardTower',
    name: 'Bombard Tower',
    description: 'A heavily fortified tower that lobs cannonballs at enemies.',
    size: { cols: 1, rows: 1 },
    baseCost: { food: 0, wood: 0, stone: 500, gold: 300 },
    buildTime: 80,
    maxLevel: 3,
    populationProvided: 0,
    populationRequired: 3,
    unlockedAtAge: 'iron',
    category: 'defense',
  },

  outpost: {
    type: 'outpost',
    name: 'Outpost',
    description: 'A small forward post that reveals surrounding fog of war.',
    size: { cols: 1, rows: 1 },
    baseCost: { food: 0, wood: 50, stone: 25, gold: 0 },
    buildTime: 15,
    maxLevel: 1,
    populationProvided: 0,
    populationRequired: 1,
    unlockedAtAge: 'stone',
    category: 'defense',
  },

  // ── Research & Upgrades ──────────────────────────────────────
  blacksmith: {
    type: 'blacksmith',
    name: 'Blacksmith',
    description: 'Researches weapon and armour upgrades for military units.',
    size: { cols: 2, rows: 2 },
    baseCost: { food: 0, wood: 0, stone: 200, gold: 150 },
    buildTime: 40,
    maxLevel: 3,
    populationProvided: 0,
    populationRequired: 2,
    unlockedAtAge: 'tool',
    category: 'special',
  },

  university: {
    type: 'university',
    name: 'University',
    description: 'Unlocks advanced technologies that boost production and military power.',
    size: { cols: 2, rows: 2 },
    baseCost: { food: 0, wood: 300, stone: 0, gold: 250 },
    buildTime: 55,
    maxLevel: 3,
    populationProvided: 0,
    populationRequired: 3,
    unlockedAtAge: 'iron',
    category: 'special',
  },

  // ── Religious & Support ──────────────────────────────────────
  temple: {
    type: 'temple',
    name: 'Temple',
    description: 'Heals nearby units over time and increases population morale.',
    size: { cols: 2, rows: 2 },
    baseCost: { food: 0, wood: 0, stone: 200, gold: 150 },
    buildTime: 45,
    maxLevel: 3,
    populationProvided: 0,
    populationRequired: 2,
    unlockedAtAge: 'bronze',
    category: 'special',
  },

  monastery: {
    type: 'monastery',
    name: 'Monastery',
    description: 'Trains monks and researches powerful religious technologies.',
    size: { cols: 2, rows: 2 },
    baseCost: { food: 0, wood: 0, stone: 350, gold: 400 },
    buildTime: 70,
    maxLevel: 3,
    populationProvided: 0,
    populationRequired: 3,
    unlockedAtAge: 'medieval',
    category: 'special',
  },

  // ── Elite Military ───────────────────────────────────────────
  castle: {
    type: 'castle',
    name: 'Castle',
    description: 'An imposing fortification that trains elite units and fires bolts at attackers.',
    size: { cols: 3, rows: 3 },
    baseCost: { food: 0, wood: 0, stone: 1000, gold: 500 },
    buildTime: 120,
    maxLevel: 3,
    populationProvided: 0,
    populationRequired: 5,
    unlockedAtAge: 'medieval',
    category: 'military',
  },

  // ── Victory / Prestige ───────────────────────────────────────
  wonder: {
    type: 'wonder',
    name: 'Wonder',
    description: 'A monumental construction that triggers a victory countdown when completed.',
    size: { cols: 4, rows: 4 },
    baseCost: { food: 5000, wood: 5000, stone: 5000, gold: 5000 },
    buildTime: 300,
    maxLevel: 1,
    populationProvided: 0,
    populationRequired: 10,
    unlockedAtAge: 'medieval',
    category: 'special',
  },

  imperialPalace: {
    type: 'imperialPalace',
    name: 'Imperial Palace',
    description: 'The seat of imperial power. Boosts all production and unlocks unique technologies.',
    size: { cols: 3, rows: 3 },
    baseCost: { food: 0, wood: 0, stone: 2000, gold: 2000 },
    buildTime: 150,
    maxLevel: 3,
    populationProvided: 20,
    populationRequired: 8,
    unlockedAtAge: 'imperial',
    category: 'special',
    productionRate: { gold: 1.0 },
  },

  // ── Renaissance / Industrial / Modern ──────────────────────

  arsenal: {
    type: 'arsenal',
    name: 'Arsenal',
    description: 'A weapons storehouse that enables advanced military production.',
    size: { cols: 2, rows: 2 },
    baseCost: { food: 0, wood: 2000, stone: 1500, gold: 800 },
    buildTime: 120,
    maxLevel: 3,
    populationProvided: 0,
    populationRequired: 6,
    unlockedAtAge: 'renaissance',
    category: 'military',
  },

  factory: {
    type: 'factory',
    name: 'Factory',
    description: 'An industrial production facility that greatly boosts resource output.',
    size: { cols: 2, rows: 2 },
    baseCost: { food: 0, wood: 4000, stone: 3000, gold: 2000 },
    buildTime: 150,
    maxLevel: 3,
    populationProvided: 0,
    populationRequired: 8,
    unlockedAtAge: 'industrial',
    category: 'economy',
    productionRate: { food: 3.0, wood: 2.0, stone: 1.0 },
  },

};
