// ============================================================
// TinyEmpire — Unit System
// ============================================================
//
// Handles unit movement, resource gathering cycle, animation,
// training, and villager assignment.
//
// Gathering cycle for villagers:
//   1. MOVING_TO_RESOURCE — walk toward nearest resource node
//   2. WORKING — harvest at the node (animation plays)
//   3. MOVING_TO_DROPOFF — walk back to Town Center / drop-off
//   4. DROPPING_OFF — deposit resources, then back to step 1
// ============================================================

import type { GameState, Unit, UnitType, ResourceType, TileType } from '../types/index.ts';
import { isoToScreen, screenToIso } from '../core/math.ts';
import { EventBus } from '../core/events.ts';

const ANIM_FRAME_INTERVAL = 0.25;

// How long a villager harvests before carrying back (seconds)
const HARVEST_TIME = 3.0;
// How much resource per harvest trip
const HARVEST_AMOUNT = 8;

// Map resource type → tile types that provide it
const RESOURCE_TILE_MAP: Record<ResourceType, TileType[]> = {
  food: ['berryBush', 'deerHerd'],
  wood: ['forest'],
  stone: ['stoneDeposit'],
  gold: ['goldDeposit'],
};

// ---- Unit configs -------------------------------------------------------

interface UnitConfig {
  cost: { food: number; wood: number; stone: number; gold: number };
  trainTime: number;
  speed: number;
  hp: number;
  trainBuilding: string;
}

const UNIT_CONFIGS: Partial<Record<UnitType, UnitConfig>> = {
  villager:       { cost: { food: 50, wood: 0, stone: 0, gold: 0 }, trainTime: 20, speed: 40, hp: 25, trainBuilding: 'townCenter' },
  clubman:        { cost: { food: 50, wood: 0, stone: 0, gold: 0 }, trainTime: 20, speed: 45, hp: 40, trainBuilding: 'barracks' },
  axeman:         { cost: { food: 60, wood: 0, stone: 0, gold: 0 }, trainTime: 22, speed: 44, hp: 50, trainBuilding: 'barracks' },
  swordsman:      { cost: { food: 80, wood: 0, stone: 0, gold: 0 }, trainTime: 25, speed: 42, hp: 65, trainBuilding: 'barracks' },
  legion:         { cost: { food: 100, wood: 0, stone: 0, gold: 20 }, trainTime: 30, speed: 40, hp: 80, trainBuilding: 'barracks' },
  champion:       { cost: { food: 120, wood: 0, stone: 0, gold: 40 }, trainTime: 35, speed: 38, hp: 100, trainBuilding: 'barracks' },
  archer:         { cost: { food: 40, wood: 20, stone: 0, gold: 0 }, trainTime: 20, speed: 42, hp: 35, trainBuilding: 'archeryRange' },
  crossbowman:    { cost: { food: 60, wood: 30, stone: 0, gold: 0 }, trainTime: 25, speed: 40, hp: 40, trainBuilding: 'archeryRange' },
  longbowman:     { cost: { food: 70, wood: 40, stone: 0, gold: 0 }, trainTime: 28, speed: 40, hp: 45, trainBuilding: 'archeryRange' },
  skirmisher:     { cost: { food: 60, wood: 30, stone: 0, gold: 0 }, trainTime: 22, speed: 44, hp: 40, trainBuilding: 'archeryRange' },
  scout:          { cost: { food: 60, wood: 0, stone: 0, gold: 0 }, trainTime: 20, speed: 70, hp: 45, trainBuilding: 'stable' },
  cavalry:        { cost: { food: 80, wood: 0, stone: 0, gold: 20 }, trainTime: 30, speed: 65, hp: 70, trainBuilding: 'stable' },
  knight:         { cost: { food: 100, wood: 0, stone: 0, gold: 50 }, trainTime: 35, speed: 60, hp: 90, trainBuilding: 'stable' },
  paladin:        { cost: { food: 120, wood: 0, stone: 0, gold: 70 }, trainTime: 40, speed: 58, hp: 110, trainBuilding: 'stable' },
  priest:         { cost: { food: 60, wood: 0, stone: 0, gold: 50 }, trainTime: 30, speed: 38, hp: 25, trainBuilding: 'temple' },
  batteringRam:   { cost: { food: 0, wood: 200, stone: 0, gold: 0 }, trainTime: 60, speed: 20, hp: 200, trainBuilding: 'siegeWorkshop' },
  catapult:       { cost: { food: 0, wood: 150, stone: 100, gold: 0 }, trainTime: 60, speed: 22, hp: 150, trainBuilding: 'siegeWorkshop' },
  trebuchet:      { cost: { food: 0, wood: 200, stone: 150, gold: 50 }, trainTime: 75, speed: 18, hp: 140, trainBuilding: 'siegeWorkshop' },
  handCannoneer:  { cost: { food: 80, wood: 0, stone: 0, gold: 80 }, trainTime: 35, speed: 38, hp: 45, trainBuilding: 'cannonFoundry' },
  bombardCannon:  { cost: { food: 0, wood: 100, stone: 0, gold: 200 }, trainTime: 90, speed: 15, hp: 160, trainBuilding: 'cannonFoundry' },
  warElephant:    { cost: { food: 200, wood: 0, stone: 0, gold: 200 }, trainTime: 120, speed: 35, hp: 300, trainBuilding: 'stable' },
};

function getUnitConfig(type: UnitType): UnitConfig {
  return UNIT_CONFIGS[type] ?? {
    cost: { food: 100, wood: 0, stone: 0, gold: 0 },
    trainTime: 30, speed: 40, hp: 50, trainBuilding: 'barracks',
  };
}

// ====================================================================

export class UnitSystem {
  private events: EventBus;

  constructor(events: EventBus) {
    this.events = events;
  }

  update(state: GameState, dt: number): void {
    // Process training queue
    this.updateTrainingQueue(state, dt);

    for (const unit of state.units) {
      if (unit.type === 'villager' && unit.carryType !== null) {
        this.updateVillagerGathering(state, unit, dt);
      } else if (unit.state === 'moving' && unit.targetPos !== null) {
        this.moveUnit(unit, dt);
      } else if (unit.state === 'idle') {
        unit.animTimer = 0;
        unit.animFrame = 0;
      }
      // Reveal fog around moving player units
      if (unit.owner === 'player' && unit.state === 'moving') {
        this.revealFogAroundUnit(state, unit);
      }
    }
  }

  // ---- Training queue processing ----------------------------------------

  private updateTrainingQueue(state: GameState, dt: number): void {
    if (!state.trainingQueue || state.trainingQueue.length === 0) return;

    // Track which buildings have already had their first item processed this tick
    const processedBuildings = new Set<number>();

    // Process the first item per building
    for (let i = 0; i < state.trainingQueue.length; i++) {
      const item = state.trainingQueue[i];
      if (processedBuildings.has(item.buildingId)) continue;
      processedBuildings.add(item.buildingId);

      // Verify building still exists and is complete
      const building = state.buildings.find(b => b.id === item.buildingId && b.constructionProgress >= 1);
      if (!building) {
        // Building destroyed — remove this queue entry and refund nothing (resources already spent)
        state.trainingQueue.splice(i, 1);
        i--;
        continue;
      }

      // Advance progress
      item.progress += dt / item.totalTime;

      if (item.progress >= 1) {
        // Training complete — spawn the unit
        this.spawnTrainedUnit(state, building, item.unitType);
        state.trainingQueue.splice(i, 1);
        i--;
      }
    }
  }

  private spawnTrainedUnit(state: GameState, building: import('../types/index.ts').Building, type: UnitType): void {
    const config = getUnitConfig(type);
    const spawnIso = isoToScreen(
      building.tile.col + 1,
      building.tile.row + 2,
    );
    const jitter = () => (Math.random() - 0.5) * 16;

    const unit: Unit = {
      id: state.nextUnitId++,
      type,
      owner: 'player',
      pos: { x: spawnIso.x + jitter(), y: spawnIso.y + jitter() },
      targetPos: null,
      hp: config.hp,
      maxHp: config.hp,
      state: 'idle',
      assignedTo: null,
      carryType: null,
      carryAmount: 0,
      animFrame: 0,
      animTimer: 0,
      facingRight: true,
    };

    state.units.push(unit);
    state.population++;
    this.events.emit({ type: 'unitTrained', unit });
  }

  // ---- Villager gathering cycle ----------------------------------------

  private updateVillagerGathering(state: GameState, unit: Unit, dt: number): void {
    const config = getUnitConfig(unit.type);

    if (unit.state === 'moving' && unit.targetPos !== null) {
      // Moving to resource or drop-off
      this.moveUnit(unit, dt);
      return;
    }

    if (unit.state === 'working') {
      // Harvesting at the resource node
      unit.animTimer += dt;
      if (unit.animTimer >= ANIM_FRAME_INTERVAL) {
        unit.animTimer -= ANIM_FRAME_INTERVAL;
        unit.animFrame = (unit.animFrame + 1) % 4;
      }

      // Drain the tile's resourceAmount
      const tile = this.getTileAtUnit(state, unit);
      if (tile && tile.resourceAmount > 0) {
        const drain = HARVEST_AMOUNT * dt / HARVEST_TIME;
        tile.resourceAmount = Math.max(0, tile.resourceAmount - drain);

        // Tile depleted — convert to grass and redirect villager
        if (tile.resourceAmount <= 0) {
          this.depleteTile(state, unit);
          // Send to next resource node
          unit.carryAmount = 0;
          unit.assignedTo = null;
          this.sendToResource(state, unit, config);
          return;
        }
      }

      unit.carryAmount += HARVEST_AMOUNT * dt / HARVEST_TIME;

      if (unit.carryAmount >= HARVEST_AMOUNT) {
        unit.carryAmount = HARVEST_AMOUNT;
        // Full — head to drop-off
        const dropoff = this.findDropoffPos(state);
        if (dropoff) {
          unit.targetPos = dropoff;
          unit.state = 'moving';
          // Tag that we're returning (use negative assignedTo as flag)
          unit.assignedTo = -1;
        }
      }
      return;
    }

    if (unit.state === 'idle' && unit.carryType !== null) {
      // Just assigned — find a resource and go
      this.sendToResource(state, unit, config);
      return;
    }

    // Unit arrived somewhere — check what to do
    if (unit.targetPos === null) {
      if (unit.assignedTo === -1) {
        // Arrived at drop-off — deposit resources
        if (unit.carryType !== null) {
          const amount = unit.carryAmount;
          state.resources[unit.carryType] = Math.min(
            state.resources[unit.carryType] + amount,
            state.storageCaps[unit.carryType],
          );
          unit.carryAmount = 0;
        }
        // Head back to resource
        unit.assignedTo = null;
        this.sendToResource(state, unit, config);
      } else {
        // Arrived at resource node — start working
        unit.state = 'working';
        unit.animTimer = 0;
        unit.animFrame = 0;
        unit.carryAmount = 0;
      }
    }
  }

  /** Find the map tile under a unit's current position. */
  private getTileAtUnit(state: GameState, unit: Unit): import('../types/index.ts').MapTile | null {
    const iso = screenToIso(unit.pos.x, unit.pos.y);
    const col = Math.round(iso.x);
    const row = Math.round(iso.y);
    if (col < 0 || row < 0 || col >= state.map.width || row >= state.map.height) return null;
    return state.map.tiles[row][col];
  }

  /** Convert a depleted resource tile to grass. */
  private depleteTile(state: GameState, unit: Unit): void {
    const iso = screenToIso(unit.pos.x, unit.pos.y);
    const col = Math.round(iso.x);
    const row = Math.round(iso.y);
    if (col < 0 || row < 0 || col >= state.map.width || row >= state.map.height) return;

    const tile = state.map.tiles[row][col];
    const grassVariants: TileType[] = ['grass1', 'grass2', 'grass3', 'grass4'];
    tile.type = grassVariants[Math.floor(Math.random() * grassVariants.length)];
    tile.resourceAmount = 0;

    this.events.emit({
      type: 'notification',
      message: `Resource depleted!`,
      color: '#E04040',
    });
  }

  private sendToResource(state: GameState, unit: Unit, _config: UnitConfig): void {
    if (!unit.carryType) return;
    const target = this.findNearestResource(state, unit.pos.x, unit.pos.y, unit.carryType);
    if (target) {
      unit.targetPos = target;
      unit.state = 'moving';
      unit.assignedTo = 0; // going to resource (non-negative)
    } else {
      // No resource found — go idle
      unit.state = 'working'; // still "working" to show animation, just stays in place
    }
  }

  private findNearestResource(
    state: GameState,
    wx: number,
    wy: number,
    resource: ResourceType,
  ): { x: number; y: number } | null {
    const tileTypes = RESOURCE_TILE_MAP[resource];
    if (!tileTypes) return null;

    // For food, also check farms
    const map = state.map;
    let bestDist = Infinity;
    let bestPos: { x: number; y: number } | null = null;

    // Scan map for matching tile types
    for (let row = 0; row < map.height; row++) {
      for (let col = 0; col < map.width; col++) {
        const tile = map.tiles[row][col];
        if (!tile.revealed) continue;
        if (!tileTypes.includes(tile.type)) continue;
        if (tile.resourceAmount <= 0) continue;

        const pos = isoToScreen(col, row);
        const dx = pos.x - wx;
        const dy = pos.y - wy;
        const dist = dx * dx + dy * dy;
        if (dist < bestDist) {
          bestDist = dist;
          bestPos = pos;
        }
      }
    }

    // For food, also consider farm buildings
    if (resource === 'food') {
      for (const b of state.buildings) {
        if (b.type === 'farm' && b.constructionProgress >= 1) {
          const pos = isoToScreen(b.tile.col, b.tile.row);
          const dx = pos.x - wx;
          const dy = pos.y - wy;
          const dist = dx * dx + dy * dy;
          if (dist < bestDist) {
            bestDist = dist;
            bestPos = pos;
          }
        }
      }
    }

    return bestPos;
  }

  private findDropoffPos(state: GameState): { x: number; y: number } | null {
    // Find nearest Town Center or relevant drop-off building
    const dropoffs = state.buildings.filter(
      b => (b.type === 'townCenter' || b.type === 'lumberCamp' || b.type === 'miningCamp' || b.type === 'mill')
        && b.constructionProgress >= 1,
    );
    if (dropoffs.length === 0) return null;

    // Just use the first town center for simplicity
    const tc = dropoffs.find(b => b.type === 'townCenter') ?? dropoffs[0];
    const pos = isoToScreen(tc.tile.col + 1, tc.tile.row + 1);
    // Add small jitter to prevent stacking
    return {
      x: pos.x + (Math.random() - 0.5) * 12,
      y: pos.y + (Math.random() - 0.5) * 8,
    };
  }

  // ---- Generic movement ------------------------------------------------

  private moveUnit(unit: Unit, dt: number): void {
    if (!unit.targetPos) return;

    const dx = unit.targetPos.x - unit.pos.x;
    const dy = unit.targetPos.y - unit.pos.y;
    const dist = Math.sqrt(dx * dx + dy * dy);
    const config = getUnitConfig(unit.type);
    const step = config.speed * dt;

    if (dist <= step) {
      unit.pos.x = unit.targetPos.x;
      unit.pos.y = unit.targetPos.y;
      unit.targetPos = null;
      // State will be resolved by the gathering cycle or caller
      if (unit.type !== 'villager' || unit.carryType === null) {
        unit.state = 'idle';
      }
    } else {
      unit.pos.x += (dx / dist) * step;
      unit.pos.y += (dy / dist) * step;
      unit.facingRight = dx > 0;
    }

    // Walking animation
    unit.animTimer += dt;
    if (unit.animTimer >= ANIM_FRAME_INTERVAL) {
      unit.animTimer -= ANIM_FRAME_INTERVAL;
      unit.animFrame = (unit.animFrame + 1) % 4;
    }
  }

  // ---- Training --------------------------------------------------------

  trainUnit(state: GameState, type: UnitType): boolean {
    const config = getUnitConfig(type);

    if (state.resources.food < config.cost.food) return false;
    if (state.resources.wood < config.cost.wood) return false;
    if (state.resources.stone < config.cost.stone) return false;
    if (state.resources.gold < config.cost.gold) return false;

    // Count population including units currently in training queue
    const queuedPop = (state.trainingQueue ?? []).length;
    if (state.population + queuedPop >= state.populationCap) return false;

    const trainingBuilding = state.buildings.find(
      b => b.type === config.trainBuilding && b.constructionProgress >= 1,
    );
    if (!trainingBuilding) return false;

    // Deduct resources immediately
    state.resources.food -= config.cost.food;
    state.resources.wood -= config.cost.wood;
    state.resources.stone -= config.cost.stone;
    state.resources.gold -= config.cost.gold;

    // Add to training queue
    if (!state.trainingQueue) state.trainingQueue = [];
    state.trainingQueue.push({
      buildingId: trainingBuilding.id,
      unitType: type,
      progress: 0,
      totalTime: config.trainTime,
    });

    return true;
  }

  // ---- Fog of war reveal -----------------------------------------------

  revealFogAroundUnit(state: GameState, unit: Unit, radius = 5): void {
    if (unit.owner !== 'player') return;
    const iso = screenToIso(unit.pos.x, unit.pos.y);
    const col = Math.round(iso.x);
    const row = Math.round(iso.y);
    const map = state.map;
    for (let dr = -radius; dr <= radius; dr++) {
      for (let dc = -radius; dc <= radius; dc++) {
        if (dc * dc + dr * dr > radius * radius) continue;
        const c = col + dc;
        const r = row + dr;
        if (c >= 0 && r >= 0 && c < map.width && r < map.height) {
          map.tiles[r][c].revealed = true;
        }
      }
    }
  }

  // ---- Move command (right-click) -------------------------------------

  commandMove(state: GameState, worldX: number, worldY: number): void {
    for (const uid of state.selectedUnitIds) {
      const unit = state.units.find(u => u.id === uid);
      if (!unit || unit.owner !== 'player') continue;
      // Don't interrupt gathering villagers
      if (unit.type === 'villager' && unit.carryType !== null) continue;
      // Add jitter to avoid stacking
      unit.targetPos = {
        x: worldX + (Math.random() - 0.5) * 16,
        y: worldY + (Math.random() - 0.5) * 12,
      };
      unit.state = 'moving';
      unit.assignedTo = null;
    }
  }

  // ---- Assignment ------------------------------------------------------

  assignVillager(
    unit: Unit,
    _targetBuildingId: number | null,
    resourceType: ResourceType | null,
  ): void {
    unit.carryType = resourceType;
    unit.carryAmount = 0;
    unit.assignedTo = null;

    if (resourceType !== null) {
      // Will start moving to resource on next update tick
      unit.state = 'idle';
      unit.targetPos = null;
    } else {
      unit.state = 'idle';
      unit.targetPos = null;
    }
  }
}
