// ============================================================
// TinyEmpire — Enemy AI System
// ============================================================
//
// Manages an enemy village that spawns at a far map corner,
// generates military units over time, and launches periodic
// raid parties toward the player's town center.
// Includes basic combat: nearby enemy/player units fight.
// ============================================================

import type { GameState, Unit, UnitType, TileCoord } from '../types/index.ts';
import { isoToScreen } from '../core/math.ts';
import { EventBus } from '../core/events.ts';

// ---- Timing constants --------------------------------------------------

const FIRST_SPAWN_DELAY = 60;   // seconds before first enemy spawns
const SPAWN_INTERVAL = 25;       // seconds between enemy unit spawns
const FIRST_RAID_DELAY = 120;    // seconds before first raid
const MIN_RAID_COOLDOWN = 40;    // minimum seconds between raids
const MIN_UNITS_FOR_RAID = 3;    // minimum idle enemy units to launch a raid

// ---- Combat constants --------------------------------------------------

const COMBAT_RANGE = 20;         // world-pixels: range to start fighting
const COMBAT_DPS = 5;            // damage per second (mutual)
const TOWER_DPS = 3;             // damage from watch towers
const TOWER_RANGE = 80;          // watch tower attack range in world-pixels

// ---- Unit escalation by raid number ------------------------------------

const RAID_UNIT_TYPES: UnitType[] = [
  'clubman', 'clubman', 'axeman', 'axeman',
  'swordsman', 'archer', 'swordsman', 'cavalry',
  'knight', 'legion', 'champion',
];

const UNIT_HP: Partial<Record<UnitType, number>> = {
  clubman: 40, axeman: 50, swordsman: 65, legion: 80, champion: 100,
  archer: 35, cavalry: 70, knight: 90,
};

// ========================================================================

export class EnemySystem {
  private events: EventBus;

  constructor(events: EventBus) {
    this.events = events;
  }

  /** Initialize enemy village at a far corner of the map. */
  initEnemy(state: GameState): void {
    const map = state.map;
    // Find player town center position
    const tc = state.buildings.find(b => b.type === 'townCenter');
    const tcCol = tc ? tc.tile.col : Math.floor(map.width / 2);
    const tcRow = tc ? tc.tile.row : Math.floor(map.height / 2);

    // Pick the farthest corner from the town center
    const corners: TileCoord[] = [
      { col: 5, row: 5 },
      { col: map.width - 6, row: 5 },
      { col: 5, row: map.height - 6 },
      { col: map.width - 6, row: map.height - 6 },
    ];
    let bestCorner = corners[0];
    let bestDist = 0;
    for (const c of corners) {
      const dx = c.col - tcCol;
      const dy = c.row - tcRow;
      const dist = dx * dx + dy * dy;
      if (dist > bestDist) {
        bestDist = dist;
        bestCorner = c;
      }
    }

    // Clear the enemy village area (small grass zone)
    for (let dr = -2; dr <= 2; dr++) {
      for (let dc = -2; dc <= 2; dc++) {
        const c = bestCorner.col + dc;
        const r = bestCorner.row + dr;
        if (c >= 0 && r >= 0 && c < map.width && r < map.height) {
          const tile = map.tiles[r][c];
          if (tile.type.startsWith('water')) continue;
          tile.type = 'grass1';
          tile.resourceAmount = 0;
        }
      }
    }

    // Set center tile to dirt so it stands out visually
    const centerTile = map.tiles[bestCorner.row]?.[bestCorner.col];
    if (centerTile && !centerTile.type.startsWith('water')) {
      centerTile.type = 'dirt1';
    }

    // Reveal tiles in a radius around the enemy village so it appears on minimap
    const REVEAL_RADIUS = 3;
    for (let dr = -REVEAL_RADIUS; dr <= REVEAL_RADIUS; dr++) {
      for (let dc = -REVEAL_RADIUS; dc <= REVEAL_RADIUS; dc++) {
        const c = bestCorner.col + dc;
        const r = bestCorner.row + dr;
        if (c >= 0 && r >= 0 && c < map.width && r < map.height) {
          map.tiles[r][c].revealed = true;
        }
      }
    }

    state.enemyState = {
      villageTile: bestCorner,
      unitSpawnTimer: 0,
      raidTimer: 0,
      raidCooldown: FIRST_RAID_DELAY,
      raidsLaunched: 0,
    };
  }

  /** Called every game tick. */
  update(state: GameState, dt: number): void {
    if (!state.enemyState) return;
    const es = state.enemyState;

    // ---- Spawn enemy units -----------------------------------------------
    es.unitSpawnTimer += dt;
    if (es.unitSpawnTimer >= (es.raidsLaunched === 0 ? FIRST_SPAWN_DELAY : SPAWN_INTERVAL)) {
      es.unitSpawnTimer = 0;
      this.spawnEnemyUnit(state);
    }

    // ---- Launch raids ----------------------------------------------------
    es.raidTimer += dt;
    if (es.raidTimer >= es.raidCooldown) {
      this.tryLaunchRaid(state);
    }

    // ---- Auto-defense: idle military units engage nearby enemies ----------
    this.autoDefense(state);

    // ---- Combat ----------------------------------------------------------
    this.updateCombat(state, dt);

    // ---- Tower defense ---------------------------------------------------
    this.updateTowerDefense(state, dt);

    // ---- Cleanup dead units ----------------------------------------------
    this.removeDeadUnits(state);
  }

  // ---- Spawning ----------------------------------------------------------

  private spawnEnemyUnit(state: GameState): void {
    const es = state.enemyState!;
    const typeIndex = Math.min(es.raidsLaunched, RAID_UNIT_TYPES.length - 1);
    const type = RAID_UNIT_TYPES[typeIndex];
    const hp = UNIT_HP[type] ?? 40;
    const pos = isoToScreen(es.villageTile.col, es.villageTile.row);

    const unit: Unit = {
      id: state.nextUnitId++,
      type,
      owner: 'enemy',
      pos: {
        x: pos.x + (Math.random() - 0.5) * 20,
        y: pos.y + (Math.random() - 0.5) * 16,
      },
      targetPos: null,
      hp,
      maxHp: hp,
      state: 'idle',
      assignedTo: null,
      carryType: null,
      carryAmount: 0,
      animFrame: 0,
      animTimer: 0,
      facingRight: true,
    };

    state.units.push(unit);
  }

  // ---- Raid launching ----------------------------------------------------

  private tryLaunchRaid(state: GameState): void {
    const es = state.enemyState!;
    const villagePos = isoToScreen(es.villageTile.col, es.villageTile.row);

    // Count idle enemy units near village
    const idleEnemies = state.units.filter(u => {
      if (u.owner !== 'enemy') return false;
      if (u.state !== 'idle') return false;
      const dx = u.pos.x - villagePos.x;
      const dy = u.pos.y - villagePos.y;
      return dx * dx + dy * dy < 100 * 100;
    });

    if (idleEnemies.length < MIN_UNITS_FOR_RAID) return;

    // Find player town center as target
    const tc = state.buildings.find(b => b.type === 'townCenter');
    if (!tc) return;
    const targetPos = isoToScreen(tc.tile.col + 1, tc.tile.row + 1);

    // Send all idle enemies toward player
    for (const unit of idleEnemies) {
      unit.targetPos = {
        x: targetPos.x + (Math.random() - 0.5) * 40,
        y: targetPos.y + (Math.random() - 0.5) * 30,
      };
      unit.state = 'moving';
    }

    // Calculate estimated arrival time
    const dist = Math.sqrt(
      (villagePos.x - targetPos.x) ** 2 + (villagePos.y - targetPos.y) ** 2,
    );
    const speed = 40; // approximate enemy speed
    const eta = Math.round(dist / speed);

    const totalHp = idleEnemies.reduce((s, u) => s + u.hp, 0);
    this.events.emit({
      type: 'raidIncoming',
      strength: totalHp,
      timeUntil: eta,
    });
    this.events.emit({
      type: 'notification',
      message: `Raid incoming! ${idleEnemies.length} enemies approaching!`,
      color: '#E04040',
    });

    es.raidTimer = 0;
    es.raidsLaunched++;
    es.raidCooldown = Math.max(MIN_RAID_COOLDOWN, es.raidCooldown - 10);
  }

  // ---- Auto-defense: idle player military units engage nearby enemies -----

  private static readonly AUTO_DEFENSE_RANGE = 80;
  private static readonly MILITARY_TYPES = new Set<string>([
    'clubman', 'axeman', 'swordsman', 'legion', 'champion',
    'archer', 'crossbowman', 'longbowman', 'skirmisher',
    'scout', 'cavalry', 'knight', 'paladin',
    'handCannoneer', 'musketeer', 'rifleman', 'tank', 'sniper',
  ]);

  private autoDefense(state: GameState): void {
    const enemies = state.units.filter(u => u.owner === 'enemy' && u.hp > 0);
    if (enemies.length === 0) return;

    for (const unit of state.units) {
      if (unit.owner !== 'player') continue;
      if (unit.state !== 'idle') continue;
      if (!EnemySystem.MILITARY_TYPES.has(unit.type)) continue;

      // Find nearest enemy within auto-defense range
      let closestEnemy: Unit | null = null;
      let closestDist = EnemySystem.AUTO_DEFENSE_RANGE;

      for (const enemy of enemies) {
        const dx = enemy.pos.x - unit.pos.x;
        const dy = enemy.pos.y - unit.pos.y;
        const dist = Math.sqrt(dx * dx + dy * dy);
        if (dist < closestDist) {
          closestDist = dist;
          closestEnemy = enemy;
        }
      }

      if (closestEnemy) {
        // Move to intercept
        unit.targetPos = {
          x: closestEnemy.pos.x + (Math.random() - 0.5) * 8,
          y: closestEnemy.pos.y + (Math.random() - 0.5) * 6,
        };
        unit.state = 'moving';
      }
    }
  }

  // ---- Combat ------------------------------------------------------------

  private updateCombat(state: GameState, dt: number): void {
    const playerUnits = state.units.filter(u => u.owner === 'player');
    const enemyUnits = state.units.filter(u => u.owner === 'enemy');

    for (const enemy of enemyUnits) {
      // Skip enemies that are too far away or already dead
      if (enemy.hp <= 0) continue;

      let closestPlayer: Unit | null = null;
      let closestDist = COMBAT_RANGE;

      for (const player of playerUnits) {
        if (player.hp <= 0) continue;
        const dx = player.pos.x - enemy.pos.x;
        const dy = player.pos.y - enemy.pos.y;
        const dist = Math.sqrt(dx * dx + dy * dy);
        if (dist < closestDist) {
          closestDist = dist;
          closestPlayer = player;
        }
      }

      if (closestPlayer) {
        // Both units enter combat
        enemy.state = 'fighting';
        enemy.targetPos = null;
        closestPlayer.state = 'fighting';
        closestPlayer.targetPos = null;

        // Mutual damage
        const dmg = COMBAT_DPS * dt;
        enemy.hp -= dmg;
        closestPlayer.hp -= dmg * 0.7; // player takes slightly less damage

        // Face each other
        enemy.facingRight = closestPlayer.pos.x > enemy.pos.x;
        closestPlayer.facingRight = enemy.pos.x > closestPlayer.pos.x;

        // Animation
        enemy.animTimer += dt;
        if (enemy.animTimer > 0.2) {
          enemy.animTimer = 0;
          enemy.animFrame = (enemy.animFrame + 1) % 4;
        }
      } else if (enemy.state === 'fighting') {
        // No more opponent nearby, go idle
        enemy.state = 'idle';
      }
    }

    // Also let player units exit fighting when no enemies nearby
    for (const player of playerUnits) {
      if (player.state !== 'fighting') continue;
      const nearEnemy = enemyUnits.some(e => {
        if (e.hp <= 0) return false;
        const dx = e.pos.x - player.pos.x;
        const dy = e.pos.y - player.pos.y;
        return Math.sqrt(dx * dx + dy * dy) < COMBAT_RANGE * 1.5;
      });
      if (!nearEnemy) {
        player.state = 'idle';
      }
    }
  }

  // ---- Tower defense -----------------------------------------------------

  private updateTowerDefense(state: GameState, dt: number): void {
    const towers = state.buildings.filter(
      b => (b.type === 'watchTower' || b.type === 'bombardTower') && b.constructionProgress >= 1,
    );
    if (towers.length === 0) return;

    const enemies = state.units.filter(u => u.owner === 'enemy' && u.hp > 0);
    if (enemies.length === 0) return;

    for (const tower of towers) {
      const tPos = isoToScreen(tower.tile.col, tower.tile.row);
      const dps = tower.type === 'bombardTower' ? TOWER_DPS * 2 : TOWER_DPS;

      for (const enemy of enemies) {
        const dx = enemy.pos.x - tPos.x;
        const dy = enemy.pos.y - tPos.y;
        const dist = Math.sqrt(dx * dx + dy * dy);
        if (dist < TOWER_RANGE) {
          enemy.hp -= dps * dt;
          break; // each tower targets one enemy at a time
        }
      }
    }
  }

  // ---- Cleanup -----------------------------------------------------------

  private removeDeadUnits(state: GameState): void {
    let raidDefeated = false;
    const beforeEnemyCount = state.units.filter(u => u.owner === 'enemy').length;

    for (let i = state.units.length - 1; i >= 0; i--) {
      const unit = state.units[i];
      if (unit.hp > 0) continue;

      if (unit.owner === 'player') {
        state.population--;
      }

      state.units.splice(i, 1);

      // Remove from selection
      const selIdx = state.selectedUnitIds.indexOf(unit.id);
      if (selIdx >= 0) state.selectedUnitIds.splice(selIdx, 1);
    }

    const afterEnemyCount = state.units.filter(u => u.owner === 'enemy').length;

    // Check if raid was defeated (had enemies moving/fighting, now none)
    if (beforeEnemyCount > 0 && afterEnemyCount === 0) {
      raidDefeated = true;
    }

    if (raidDefeated) {
      this.events.emit({ type: 'raidDefeated' });
      this.events.emit({
        type: 'notification',
        message: 'Raid defeated!',
        color: '#60C040',
      });
    }
  }
}
