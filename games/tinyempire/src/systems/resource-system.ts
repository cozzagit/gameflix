// ============================================================
// TinyEmpire — Resource System
// ============================================================
//
// Calculates production rates each logic tick and applies
// resource deltas clamped to storage caps.
// ============================================================

import type { GameState, ResourceType } from '../types/index.ts';

// Base production per second for each villager assignment
const BASE_RATES: Record<ResourceType, number> = {
  food:  2.0,
  wood:  1.5,
  stone: 0.8,
  gold:  0.3,
};

// Building passive bonuses (per completed building of that type)
const FARM_FOOD_BONUS  = 1.4; // food/s per completed farm
const BANK_GOLD_BONUS  = 1.5; // gold/s per completed bank

// Military upkeep cost per military unit per second
const MILITARY_UPKEEP_FOOD = 0.5;

// Unit types that are considered military (require food upkeep)
const MILITARY_TYPES = new Set<string>([
  'clubman', 'axeman', 'swordsman', 'legion', 'champion',
  'archer', 'crossbowman', 'longbowman', 'skirmisher',
  'scout', 'cavalry', 'knight', 'paladin',
  'priest',
  'batteringRam', 'catapult', 'trebuchet',
  'handCannoneer', 'bombardCannon', 'warElephant',
]);

export class ResourceSystem {
  /**
   * Called every logic tick (fixed dt).
   * Mutates state.resources and state.rates in place.
   */
  update(state: GameState, dt: number): void {
    const { resources, storageCaps, units, buildings } = state;

    // ---- Derive age multiplier from current age config -------------------
    // We inline the multiplier lookup to avoid a circular import with ages.ts.
    // Multipliers match AGE_CONFIGS.productionMultiplier values.
    const ageMultipliers: Record<string, number> = {
      stone:       1.0,
      tool:        1.3,
      bronze:      1.7,
      iron:        2.2,
      medieval:    3.0,
      imperial:    4.0,
      renaissance: 5.0,
      industrial:  7.0,
      modern:      10.0,
    };
    const ageMultiplier = ageMultipliers[state.currentAge] ?? 1.0;

    // ---- Count villager assignments --------------------------------------
    const villagersOn: Record<ResourceType, number> = {
      food: 0, wood: 0, stone: 0, gold: 0,
    };

    for (const unit of units) {
      if (unit.type !== 'villager') continue;
      if (unit.state !== 'working') continue;
      const carry = unit.carryType as ResourceType | null;
      if (carry && carry in villagersOn) {
        villagersOn[carry]++;
      }
    }

    // ---- Count completed building bonuses --------------------------------
    let completedFarms = 0;
    let completedBanks = 0;
    for (const b of buildings) {
      if (b.constructionProgress < 1) continue;
      if (b.type === 'farm') completedFarms++;
      if (b.type === 'bank') completedBanks++;
    }

    // ---- Compute per-second rates ----------------------------------------
    const rates = {
      food:  villagersOn.food  * BASE_RATES.food  * ageMultiplier + completedFarms * FARM_FOOD_BONUS,
      wood:  villagersOn.wood  * BASE_RATES.wood  * ageMultiplier,
      stone: villagersOn.stone * BASE_RATES.stone * ageMultiplier,
      gold:  villagersOn.gold  * BASE_RATES.gold  * ageMultiplier + completedBanks * BANK_GOLD_BONUS,
    };

    // ---- Military upkeep (food drain) ------------------------------------
    let militaryCount = 0;
    for (const unit of units) {
      if (MILITARY_TYPES.has(unit.type)) militaryCount++;
    }
    rates.food -= militaryCount * MILITARY_UPKEEP_FOOD;

    // ---- Store rates for UI display (before clamping) --------------------
    state.rates.food  = rates.food;
    state.rates.wood  = rates.wood;
    state.rates.stone = rates.stone;
    state.rates.gold  = rates.gold;

    // ---- Apply delta to resources, clamped to caps -----------------------
    const resourceKeys: ResourceType[] = ['food', 'wood', 'stone', 'gold'];
    for (const key of resourceKeys) {
      const delta = rates[key] * dt;
      if (delta >= 0) {
        // Production: clamp to storage cap
        resources[key] = Math.min(resources[key] + delta, storageCaps[key]);
      } else {
        // Drain (e.g. upkeep): never drop below 0
        resources[key] = Math.max(resources[key] + delta, 0);
      }
    }
  }
}
