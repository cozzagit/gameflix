// ============================================================
// TinyEmpire — Building System
// ============================================================
//
// Handles construction progress, placement validation,
// resource deduction, and building completion events.
// ============================================================

import type { GameState, Building, BuildingType, TileCoord } from '../types/index.ts';
import { EventBus } from '../core/events.ts';
import { AGE_CONFIGS } from '../data/ages.ts';

// ---- Inline building config (since src/data/buildings.ts not yet created) ----
// Each entry describes: cost, buildTime (seconds), size, prerequisites, popCapBonus.

interface BuildingConfig {
  cost: { food: number; wood: number; stone: number; gold: number };
  buildTime: number;      // seconds to construct
  size: { cols: number; rows: number };
  prerequisiteBuildings: BuildingType[];
  populationCapBonus: number; // e.g. house adds 5
  storageCapBonus: { food: number; wood: number; stone: number; gold: number } | null;
}

const BUILDING_CONFIGS: Partial<Record<BuildingType, BuildingConfig>> = {
  townCenter: {
    cost: { food: 0, wood: 0, stone: 0, gold: 0 },
    buildTime: 0,
    size: { cols: 2, rows: 2 },
    prerequisiteBuildings: [],
    populationCapBonus: 5,
    storageCapBonus: null,
  },
  house: {
    cost: { food: 0, wood: 30, stone: 0, gold: 0 },
    buildTime: 15,
    size: { cols: 1, rows: 1 },
    prerequisiteBuildings: [],
    populationCapBonus: 5,
    storageCapBonus: null,
  },
  farm: {
    cost: { food: 0, wood: 60, stone: 0, gold: 0 },
    buildTime: 20,
    size: { cols: 2, rows: 2 },
    prerequisiteBuildings: [],
    populationCapBonus: 0,
    storageCapBonus: null,
  },
  mill: {
    cost: { food: 0, wood: 50, stone: 0, gold: 0 },
    buildTime: 25,
    size: { cols: 1, rows: 1 },
    prerequisiteBuildings: [],
    populationCapBonus: 0,
    storageCapBonus: null,
  },
  granary: {
    cost: { food: 0, wood: 60, stone: 0, gold: 0 },
    buildTime: 25,
    size: { cols: 1, rows: 1 },
    prerequisiteBuildings: [],
    populationCapBonus: 0,
    storageCapBonus: { food: 300, wood: 0, stone: 0, gold: 0 },
  },
  lumberCamp: {
    cost: { food: 0, wood: 40, stone: 0, gold: 0 },
    buildTime: 20,
    size: { cols: 1, rows: 1 },
    prerequisiteBuildings: [],
    populationCapBonus: 0,
    storageCapBonus: null,
  },
  miningCamp: {
    cost: { food: 0, wood: 50, stone: 0, gold: 0 },
    buildTime: 20,
    size: { cols: 1, rows: 1 },
    prerequisiteBuildings: ['lumberCamp'],
    populationCapBonus: 0,
    storageCapBonus: null,
  },
  lumberYard: {
    cost: { food: 0, wood: 80, stone: 40, gold: 0 },
    buildTime: 35,
    size: { cols: 1, rows: 1 },
    prerequisiteBuildings: ['lumberCamp'],
    populationCapBonus: 0,
    storageCapBonus: { food: 0, wood: 300, stone: 0, gold: 0 },
  },
  stoneVault: {
    cost: { food: 0, wood: 60, stone: 100, gold: 0 },
    buildTime: 40,
    size: { cols: 1, rows: 1 },
    prerequisiteBuildings: ['miningCamp'],
    populationCapBonus: 0,
    storageCapBonus: { food: 0, wood: 0, stone: 200, gold: 0 },
  },
  treasury: {
    cost: { food: 0, wood: 80, stone: 80, gold: 50 },
    buildTime: 50,
    size: { cols: 1, rows: 1 },
    prerequisiteBuildings: ['market'],
    populationCapBonus: 0,
    storageCapBonus: { food: 0, wood: 0, stone: 0, gold: 150 },
  },
  market: {
    cost: { food: 0, wood: 100, stone: 50, gold: 0 },
    buildTime: 40,
    size: { cols: 2, rows: 2 },
    prerequisiteBuildings: [],
    populationCapBonus: 0,
    storageCapBonus: null,
  },
  bank: {
    cost: { food: 0, wood: 150, stone: 100, gold: 200 },
    buildTime: 60,
    size: { cols: 2, rows: 2 },
    prerequisiteBuildings: ['market'],
    populationCapBonus: 0,
    storageCapBonus: { food: 0, wood: 0, stone: 0, gold: 300 },
  },
  barracks: {
    cost: { food: 0, wood: 100, stone: 0, gold: 0 },
    buildTime: 30,
    size: { cols: 2, rows: 2 },
    prerequisiteBuildings: [],
    populationCapBonus: 0,
    storageCapBonus: null,
  },
  archeryRange: {
    cost: { food: 0, wood: 100, stone: 50, gold: 0 },
    buildTime: 35,
    size: { cols: 2, rows: 2 },
    prerequisiteBuildings: ['barracks'],
    populationCapBonus: 0,
    storageCapBonus: null,
  },
  stable: {
    cost: { food: 0, wood: 120, stone: 60, gold: 0 },
    buildTime: 40,
    size: { cols: 2, rows: 2 },
    prerequisiteBuildings: ['barracks'],
    populationCapBonus: 0,
    storageCapBonus: null,
  },
  siegeWorkshop: {
    cost: { food: 0, wood: 200, stone: 100, gold: 0 },
    buildTime: 60,
    size: { cols: 2, rows: 2 },
    prerequisiteBuildings: ['barracks'],
    populationCapBonus: 0,
    storageCapBonus: null,
  },
  castle: {
    cost: { food: 0, wood: 200, stone: 400, gold: 100 },
    buildTime: 120,
    size: { cols: 3, rows: 3 },
    prerequisiteBuildings: ['university'],
    populationCapBonus: 10,
    storageCapBonus: null,
  },
  cannonFoundry: {
    cost: { food: 0, wood: 200, stone: 200, gold: 200 },
    buildTime: 90,
    size: { cols: 2, rows: 2 },
    prerequisiteBuildings: ['castle'],
    populationCapBonus: 0,
    storageCapBonus: null,
  },
  watchTower: {
    cost: { food: 0, wood: 50, stone: 0, gold: 0 },
    buildTime: 15,
    size: { cols: 1, rows: 1 },
    prerequisiteBuildings: [],
    populationCapBonus: 0,
    storageCapBonus: null,
  },
  stoneWall: {
    cost: { food: 0, wood: 10, stone: 50, gold: 0 },
    buildTime: 10,
    size: { cols: 1, rows: 1 },
    prerequisiteBuildings: [],
    populationCapBonus: 0,
    storageCapBonus: null,
  },
  gate: {
    cost: { food: 0, wood: 20, stone: 80, gold: 0 },
    buildTime: 20,
    size: { cols: 1, rows: 2 },
    prerequisiteBuildings: ['stoneWall'],
    populationCapBonus: 0,
    storageCapBonus: null,
  },
  bombardTower: {
    cost: { food: 0, wood: 100, stone: 150, gold: 80 },
    buildTime: 60,
    size: { cols: 1, rows: 1 },
    prerequisiteBuildings: ['watchTower'],
    populationCapBonus: 0,
    storageCapBonus: null,
  },
  blacksmith: {
    cost: { food: 0, wood: 80, stone: 40, gold: 0 },
    buildTime: 30,
    size: { cols: 1, rows: 1 },
    prerequisiteBuildings: [],
    populationCapBonus: 0,
    storageCapBonus: null,
  },
  university: {
    cost: { food: 0, wood: 150, stone: 100, gold: 100 },
    buildTime: 60,
    size: { cols: 2, rows: 2 },
    prerequisiteBuildings: ['blacksmith'],
    populationCapBonus: 0,
    storageCapBonus: null,
  },
  temple: {
    cost: { food: 0, wood: 100, stone: 100, gold: 50 },
    buildTime: 50,
    size: { cols: 2, rows: 2 },
    prerequisiteBuildings: [],
    populationCapBonus: 0,
    storageCapBonus: null,
  },
  monastery: {
    cost: { food: 0, wood: 150, stone: 120, gold: 80 },
    buildTime: 70,
    size: { cols: 2, rows: 2 },
    prerequisiteBuildings: ['temple'],
    populationCapBonus: 0,
    storageCapBonus: null,
  },
  outpost: {
    cost: { food: 0, wood: 40, stone: 0, gold: 0 },
    buildTime: 15,
    size: { cols: 1, rows: 1 },
    prerequisiteBuildings: [],
    populationCapBonus: 0,
    storageCapBonus: null,
  },
  wonder: {
    cost: { food: 500, wood: 1000, stone: 1000, gold: 500 },
    buildTime: 300,
    size: { cols: 3, rows: 3 },
    prerequisiteBuildings: ['university', 'castle'],
    populationCapBonus: 0,
    storageCapBonus: null,
  },
  imperialPalace: {
    cost: { food: 1000, wood: 1500, stone: 2000, gold: 1000 },
    buildTime: 360,
    size: { cols: 4, rows: 4 },
    prerequisiteBuildings: ['castle', 'wonder'],
    populationCapBonus: 20,
    storageCapBonus: null,
  },
};

/** Fallback config for unknown building types. */
function getConfig(type: BuildingType): BuildingConfig {
  return BUILDING_CONFIGS[type] ?? {
    cost: { food: 100, wood: 100, stone: 50, gold: 0 },
    buildTime: 30,
    size: { cols: 1, rows: 1 },
    prerequisiteBuildings: [],
    populationCapBonus: 0,
    storageCapBonus: null,
  };
}

export class BuildingSystem {
  private events: EventBus;

  constructor(events: EventBus) {
    this.events = events;
  }

  /**
   * Progress construction for all incomplete buildings.
   * Completes buildings and fires events when progress reaches 1.
   */
  update(state: GameState, dt: number): void {
    for (const building of state.buildings) {
      if (building.constructionProgress >= 1) continue;

      const config = getConfig(building.type);
      // Avoid division by zero for instant builds (buildTime === 0)
      const buildTime = Math.max(config.buildTime, 0.001);
      building.constructionProgress = Math.min(
        building.constructionProgress + dt / buildTime,
        1,
      );

      if (building.constructionProgress >= 1) {
        building.constructionProgress = 1;

        // Apply population cap bonus for houses (and any other pop-granting buildings)
        if (config.populationCapBonus > 0) {
          state.populationCap += config.populationCapBonus;
        }

        // Apply storage cap bonus for storage buildings
        if (config.storageCapBonus) {
          state.storageCaps.food  += config.storageCapBonus.food;
          state.storageCaps.wood  += config.storageCapBonus.wood;
          state.storageCaps.stone += config.storageCapBonus.stone;
          state.storageCaps.gold  += config.storageCapBonus.gold;
        }

        this.events.emit({ type: 'buildingComplete', building });
        this.events.emit({
          type: 'notification',
          message: `${building.type} construction complete!`,
          color: '#60C040',
        });
      }
    }
  }

  /**
   * Returns true if the player can afford and is eligible to build the given type.
   */
  canBuild(state: GameState, type: BuildingType): boolean {
    const config = getConfig(type);
    const ageConfig = AGE_CONFIGS[state.currentAge];

    // Check the building is unlocked in the current age
    // (walk all ages up to and including current)
    const AGE_ORDER = ['stone', 'tool', 'bronze', 'iron', 'medieval', 'imperial', 'renaissance', 'industrial', 'modern'] as const;
    const currentIndex = AGE_ORDER.indexOf(state.currentAge);
    let unlocked = false;
    for (let i = 0; i <= currentIndex; i++) {
      const age = AGE_ORDER[i];
      if (AGE_CONFIGS[age].unlockedBuildings.includes(type)) {
        unlocked = true;
        break;
      }
    }
    if (!unlocked) return false;

    // Check resources
    const { resources } = state;
    if (resources.food  < config.cost.food)  return false;
    if (resources.wood  < config.cost.wood)  return false;
    if (resources.stone < config.cost.stone) return false;
    if (resources.gold  < config.cost.gold)  return false;

    // Check prerequisite buildings exist and are complete
    for (const prereq of config.prerequisiteBuildings) {
      const found = state.buildings.some(
        b => b.type === prereq && b.constructionProgress >= 1,
      );
      if (!found) return false;
    }

    // Suppress unused warning — ageConfig used indirectly via currentAge check above
    void ageConfig;

    return true;
  }

  /**
   * Attempt to place a building at the given tile.
   * Returns the new Building on success, null on failure.
   */
  placeBuilding(
    state: GameState,
    type: BuildingType,
    tile: TileCoord,
  ): Building | null {
    if (!this.canBuild(state, type)) return null;

    const config = getConfig(type);

    // Check tile footprint is clear
    if (!this.isTileFree(state, tile.col, tile.row, config.size)) return null;

    // Deduct resources
    state.resources.food  -= config.cost.food;
    state.resources.wood  -= config.cost.wood;
    state.resources.stone -= config.cost.stone;
    state.resources.gold  -= config.cost.gold;

    const maxHp = 200;
    const building: Building = {
      id: state.nextBuildingId++,
      type,
      tile: { col: tile.col, row: tile.row },
      level: 1,
      constructionProgress: config.buildTime <= 0 ? 1 : 0,
      hp: maxHp,
      maxHp,
    };

    // Instant builds (e.g. town center at game start)
    if (building.constructionProgress >= 1 && config.populationCapBonus > 0) {
      state.populationCap += config.populationCapBonus;
    }

    state.buildings.push(building);
    this.events.emit({ type: 'buildingPlaced', building });

    return building;
  }

  /**
   * Returns true if all tiles in the footprint starting at (col, row)
   * are within bounds and unoccupied.
   */
  isTileFree(
    state: GameState,
    col: number,
    row: number,
    size: { cols: number; rows: number },
  ): boolean {
    const { map, buildings } = state;

    // Bounds check
    if (col < 0 || row < 0) return false;
    if (col + size.cols > map.width) return false;
    if (row + size.rows > map.height) return false;

    // Build a Set of occupied tiles for quick lookup
    const occupied = new Set<string>();
    for (const b of buildings) {
      const bc = getConfig(b.type);
      for (let dc = 0; dc < bc.size.cols; dc++) {
        for (let dr = 0; dr < bc.size.rows; dr++) {
          occupied.add(`${b.tile.col + dc},${b.tile.row + dr}`);
        }
      }
    }

    // Check the requested footprint
    for (let dc = 0; dc < size.cols; dc++) {
      for (let dr = 0; dr < size.rows; dr++) {
        const key = `${col + dc},${row + dr}`;
        if (occupied.has(key)) return false;
        // Also reject water tiles
        const tile = map.tiles[row + dr]?.[col + dc];
        if (!tile) return false;
        if (tile.type === 'water1' || tile.type === 'water2') return false;
      }
    }

    return true;
  }
}
