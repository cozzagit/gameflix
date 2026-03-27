// ============================================================
// TinyEmpire — Progression System
// ============================================================
//
// Handles age advancement: requirement checks, resource deduction,
// and state updates when the player advances to the next age.
// ============================================================

import type { GameState, AgeId, BuildingType } from '../types/index.ts';
import { AGE_CONFIGS, AGE_ORDER, type AgeConfig } from '../data/ages.ts';
import { EventBus } from '../core/events.ts';

// Storage bonuses per building type (must mirror building-system.ts values)
const STORAGE_BONUSES: Partial<Record<BuildingType, { food: number; wood: number; stone: number; gold: number }>> = {
  granary:    { food: 300, wood: 0, stone: 0, gold: 0 },
  lumberYard: { food: 0, wood: 300, stone: 0, gold: 0 },
  stoneVault: { food: 0, wood: 0, stone: 200, gold: 0 },
  treasury:   { food: 0, wood: 0, stone: 0, gold: 150 },
  bank:       { food: 0, wood: 0, stone: 0, gold: 300 },
};

export class ProgressionSystem {
  private events: EventBus;

  constructor(events: EventBus) {
    this.events = events;
  }

  /**
   * Returns the AgeConfig for the next age, or null if already at max.
   */
  getNextAge(state: GameState): AgeConfig | null {
    const currentIndex = AGE_ORDER.indexOf(state.currentAge);
    if (currentIndex < 0 || currentIndex >= AGE_ORDER.length - 1) return null;
    const nextId = AGE_ORDER[currentIndex + 1];
    return AGE_CONFIGS[nextId];
  }

  /**
   * Check whether the player meets all requirements to advance to the next age.
   */
  canAdvanceAge(state: GameState): boolean {
    const nextAge = this.getNextAge(state);
    if (!nextAge) return false; // Already at max age

    const reqs = nextAge.advanceRequirements;

    // ---- Resource check --------------------------------------------------
    if (state.resources.food  < nextAge.advanceCost.food)  return false;
    if (state.resources.wood  < nextAge.advanceCost.wood)  return false;
    if (state.resources.stone < nextAge.advanceCost.stone) return false;
    if (state.resources.gold  < nextAge.advanceCost.gold)  return false;

    // ---- Villager count --------------------------------------------------
    const villagerCount = state.units.filter(u => u.type === 'villager').length;
    if (villagerCount < reqs.minVillagers) return false;

    // ---- Required buildings (must be complete) ----------------------------
    for (const reqBuilding of reqs.requiredBuildings) {
      const found = state.buildings.some(
        b => b.type === reqBuilding && b.constructionProgress >= 1,
      );
      if (!found) return false;
    }

    return true;
  }

  /**
   * Attempt to advance to the next age.
   * Deducts resources, updates state, fires the ageAdvanced event.
   * Returns true if the advance was successful.
   */
  advanceAge(state: GameState): boolean {
    if (!this.canAdvanceAge(state)) return false;

    const nextAge = this.getNextAge(state);
    if (!nextAge) return false;

    // Deduct advance cost
    state.resources.food  -= nextAge.advanceCost.food;
    state.resources.wood  -= nextAge.advanceCost.wood;
    state.resources.stone -= nextAge.advanceCost.stone;
    state.resources.gold  -= nextAge.advanceCost.gold;

    // Advance age state
    state.currentAge = nextAge.id as AgeId;
    state.ageIndex   = nextAge.index;

    // Update storage caps: new age base + all existing storage building bonuses
    state.storageCaps.food  = nextAge.storageCaps.food;
    state.storageCaps.wood  = nextAge.storageCaps.wood;
    state.storageCaps.stone = nextAge.storageCaps.stone;
    state.storageCaps.gold  = nextAge.storageCaps.gold;

    // Re-apply storage bonuses from completed buildings
    for (const b of state.buildings) {
      if (b.constructionProgress < 1) continue;
      const bonus = STORAGE_BONUSES[b.type];
      if (bonus) {
        state.storageCaps.food  += bonus.food;
        state.storageCaps.wood  += bonus.wood;
        state.storageCaps.stone += bonus.stone;
        state.storageCaps.gold  += bonus.gold;
      }
    }

    this.events.emit({ type: 'ageAdvanced', age: state.currentAge });
    this.events.emit({
      type: 'notification',
      message: `Advanced to ${nextAge.name}!`,
      color: '#FFD040',
    });

    return true;
  }
}
