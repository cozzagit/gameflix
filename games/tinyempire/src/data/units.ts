// ============================================================
// TinyEmpire — Unit Configuration Data
// ============================================================

import type { AgeId, Resources } from '../types/index.ts';

export interface UnitConfig {
  type: string;
  name: string;
  hp: number;
  attack: number;
  defense: number;
  speed: number; // pixels per second
  cost: Resources;
  trainTime: number; // seconds
  unlockedAtAge: AgeId;
  category: 'villager' | 'infantry' | 'ranged' | 'cavalry' | 'siege' | 'special';
  foodUpkeep: number; // food per second consumed while alive (military only)
}

export const UNIT_CONFIGS: Record<string, UnitConfig> = {

  // ── Villager ─────────────────────────────────────────────
  villager: {
    type: 'villager',
    name: 'Villager',
    hp: 25,
    attack: 2,
    defense: 0,
    speed: 30,
    cost: { food: 50, wood: 0, stone: 0, gold: 0 },
    trainTime: 8,
    unlockedAtAge: 'stone',
    category: 'villager',
    foodUpkeep: 0,
  },

  // ── Stone Age Infantry ────────────────────────────────────
  clubman: {
    type: 'clubman',
    name: 'Clubman',
    hp: 20,
    attack: 3,
    defense: 0,
    speed: 25,
    cost: { food: 30, wood: 0, stone: 0, gold: 0 },
    trainTime: 10,
    unlockedAtAge: 'stone',
    category: 'infantry',
    foodUpkeep: 0.3,
  },

  // ── Tool Age ─────────────────────────────────────────────
  axeman: {
    type: 'axeman',
    name: 'Axeman',
    hp: 35,
    attack: 6,
    defense: 2,
    speed: 25,
    cost: { food: 40, wood: 0, stone: 0, gold: 10 },
    trainTime: 15,
    unlockedAtAge: 'tool',
    category: 'infantry',
    foodUpkeep: 0.4,
  },

  scout: {
    type: 'scout',
    name: 'Scout',
    hp: 40,
    attack: 3,
    defense: 0,
    speed: 50,
    cost: { food: 40, wood: 0, stone: 0, gold: 0 },
    trainTime: 12,
    unlockedAtAge: 'tool',
    category: 'cavalry',
    foodUpkeep: 0.2,
  },

  // ── Bronze Age ───────────────────────────────────────────
  swordsman: {
    type: 'swordsman',
    name: 'Swordsman',
    hp: 55,
    attack: 9,
    defense: 4,
    speed: 25,
    cost: { food: 40, wood: 0, stone: 0, gold: 20 },
    trainTime: 20,
    unlockedAtAge: 'bronze',
    category: 'infantry',
    foodUpkeep: 0.5,
  },

  archer: {
    type: 'archer',
    name: 'Archer',
    hp: 30,
    attack: 8,
    defense: 1,
    speed: 28,
    cost: { food: 0, wood: 30, stone: 0, gold: 20 },
    trainTime: 18,
    unlockedAtAge: 'bronze',
    category: 'ranged',
    foodUpkeep: 0.4,
  },

  cavalry: {
    type: 'cavalry',
    name: 'Cavalry',
    hp: 70,
    attack: 10,
    defense: 3,
    speed: 40,
    cost: { food: 60, wood: 0, stone: 0, gold: 40 },
    trainTime: 25,
    unlockedAtAge: 'bronze',
    category: 'cavalry',
    foodUpkeep: 0.6,
  },

  priest: {
    type: 'priest',
    name: 'Priest',
    hp: 25,
    attack: 0,
    defense: 1,
    speed: 20,
    cost: { food: 0, wood: 0, stone: 0, gold: 100 },
    trainTime: 30,
    unlockedAtAge: 'bronze',
    category: 'special',
    foodUpkeep: 0.3,
  },

  // ── Iron Age ─────────────────────────────────────────────
  legion: {
    type: 'legion',
    name: 'Legion',
    hp: 80,
    attack: 14,
    defense: 7,
    speed: 25,
    cost: { food: 60, wood: 0, stone: 0, gold: 40 },
    trainTime: 25,
    unlockedAtAge: 'iron',
    category: 'infantry',
    foodUpkeep: 0.5,
  },

  crossbowman: {
    type: 'crossbowman',
    name: 'Crossbowman',
    hp: 40,
    attack: 14,
    defense: 2,
    speed: 26,
    cost: { food: 0, wood: 40, stone: 0, gold: 30 },
    trainTime: 22,
    unlockedAtAge: 'iron',
    category: 'ranged',
    foodUpkeep: 0.5,
  },

  knight: {
    type: 'knight',
    name: 'Knight',
    hp: 100,
    attack: 15,
    defense: 6,
    speed: 38,
    cost: { food: 80, wood: 0, stone: 0, gold: 60 },
    trainTime: 30,
    unlockedAtAge: 'iron',
    category: 'cavalry',
    foodUpkeep: 0.6,
  },

  batteringRam: {
    type: 'batteringRam',
    name: 'Battering Ram',
    hp: 150,
    attack: 25,
    defense: 10,
    speed: 15,
    cost: { food: 0, wood: 150, stone: 0, gold: 80 },
    trainTime: 40,
    unlockedAtAge: 'iron',
    category: 'siege',
    foodUpkeep: 0.8,
  },

  catapult: {
    type: 'catapult',
    name: 'Catapult',
    hp: 60,
    attack: 30,
    defense: 2,
    speed: 12,
    cost: { food: 0, wood: 200, stone: 0, gold: 150 },
    trainTime: 50,
    unlockedAtAge: 'iron',
    category: 'siege',
    foodUpkeep: 0.8,
  },

  // ── Medieval Age ─────────────────────────────────────────
  champion: {
    type: 'champion',
    name: 'Champion',
    hp: 120,
    attack: 20,
    defense: 10,
    speed: 25,
    cost: { food: 80, wood: 0, stone: 0, gold: 60 },
    trainTime: 30,
    unlockedAtAge: 'medieval',
    category: 'infantry',
    foodUpkeep: 0.6,
  },

  longbowman: {
    type: 'longbowman',
    name: 'Longbowman',
    hp: 50,
    attack: 18,
    defense: 3,
    speed: 26,
    cost: { food: 0, wood: 50, stone: 0, gold: 40 },
    trainTime: 25,
    unlockedAtAge: 'medieval',
    category: 'ranged',
    foodUpkeep: 0.5,
  },

  paladin: {
    type: 'paladin',
    name: 'Paladin',
    hp: 160,
    attack: 22,
    defense: 10,
    speed: 36,
    cost: { food: 100, wood: 0, stone: 0, gold: 100 },
    trainTime: 35,
    unlockedAtAge: 'medieval',
    category: 'cavalry',
    foodUpkeep: 0.8,
  },

  trebuchet: {
    type: 'trebuchet',
    name: 'Trebuchet',
    hp: 80,
    attack: 50,
    defense: 0,
    speed: 8,
    cost: { food: 0, wood: 300, stone: 0, gold: 250 },
    trainTime: 60,
    unlockedAtAge: 'medieval',
    category: 'siege',
    foodUpkeep: 1.0,
  },

  handCannoneer: {
    type: 'handCannoneer',
    name: 'Hand Cannoneer',
    hp: 40,
    attack: 30,
    defense: 2,
    speed: 22,
    cost: { food: 60, wood: 0, stone: 0, gold: 80 },
    trainTime: 30,
    unlockedAtAge: 'medieval',
    category: 'ranged',
    foodUpkeep: 0.6,
  },

  // ── Imperial Age ─────────────────────────────────────────
  warElephant: {
    type: 'warElephant',
    name: 'War Elephant',
    hp: 300,
    attack: 35,
    defense: 12,
    speed: 18,
    cost: { food: 200, wood: 0, stone: 0, gold: 150 },
    trainTime: 50,
    unlockedAtAge: 'imperial',
    category: 'cavalry',
    foodUpkeep: 1.2,
  },

  bombardCannon: {
    type: 'bombardCannon',
    name: 'Bombard Cannon',
    hp: 100,
    attack: 60,
    defense: 4,
    speed: 15,
    cost: { food: 0, wood: 300, stone: 0, gold: 400 },
    trainTime: 60,
    unlockedAtAge: 'imperial',
    category: 'siege',
    foodUpkeep: 1.0,
  },

  skirmisher: {
    type: 'skirmisher',
    name: 'Skirmisher',
    hp: 60,
    attack: 22,
    defense: 5,
    speed: 28,
    cost: { food: 40, wood: 0, stone: 0, gold: 30 },
    trainTime: 25,
    unlockedAtAge: 'imperial',
    category: 'ranged',
    foodUpkeep: 0.5,
  },

  eliteChampion: {
    type: 'eliteChampion',
    name: 'Elite Champion',
    hp: 160,
    attack: 28,
    defense: 14,
    speed: 25,
    cost: { food: 100, wood: 0, stone: 0, gold: 80 },
    trainTime: 35,
    unlockedAtAge: 'imperial',
    category: 'infantry',
    foodUpkeep: 0.8,
  },

};
