// ============================================================
// TinyEmpire — Animal System
// ============================================================
//
// Manages roaming wildlife (deer, boar) that wander the map.
// Animals provide food when hunted by villagers.
// They move randomly, flee when a unit approaches, and
// are rendered as small animated sprites on the map.
// ============================================================

import type { GameState, Vec2 } from '../types/index.ts';
import { isoToScreen, screenToIso } from '../core/math.ts';

export interface Animal {
  id: number;
  type: 'deer' | 'boar';
  pos: Vec2;
  targetPos: Vec2 | null;
  hp: number;
  maxHp: number;
  food: number;         // food yielded when killed
  speed: number;
  wanderTimer: number;  // seconds until next wander move
  fleeTimer: number;    // seconds of active fleeing
  animFrame: number;
  animTimer: number;
  facingRight: boolean;
  alive: boolean;
}

const FLEE_DISTANCE = 50;   // world-pixels: flee if player unit within this
const FLEE_SPEED = 55;
const WANDER_SPEED = 15;
const WANDER_INTERVAL_MIN = 3;
const WANDER_INTERVAL_MAX = 8;
const WANDER_RANGE = 40;

let nextAnimalId = 1;

export class AnimalSystem {
  animals: Animal[] = [];

  /** Spawn initial wildlife on revealed/near-center tiles */
  initAnimals(state: GameState): void {
    this.animals = [];
    const map = state.map;
    const cx = Math.floor(map.width / 2);
    const cy = Math.floor(map.height / 2);

    // Spawn deer herds in clusters around the map
    const spots: Array<{ col: number; row: number; count: number; type: 'deer' | 'boar' }> = [];

    // Deer: medium distance from center
    for (let i = 0; i < 5; i++) {
      const angle = (i / 5) * Math.PI * 2 + Math.random() * 0.5;
      const dist = 12 + Math.random() * 10;
      const col = Math.round(cx + Math.cos(angle) * dist);
      const row = Math.round(cy + Math.sin(angle) * dist);
      if (col > 2 && col < map.width - 2 && row > 2 && row < map.height - 2) {
        spots.push({ col, row, count: 2 + Math.floor(Math.random() * 2), type: 'deer' });
      }
    }

    // Boar: closer to center, fewer
    for (let i = 0; i < 3; i++) {
      const angle = (i / 3) * Math.PI * 2 + Math.random();
      const dist = 8 + Math.random() * 6;
      const col = Math.round(cx + Math.cos(angle) * dist);
      const row = Math.round(cy + Math.sin(angle) * dist);
      if (col > 2 && col < map.width - 2 && row > 2 && row < map.height - 2) {
        spots.push({ col, row, count: 1 + Math.floor(Math.random() * 2), type: 'boar' });
      }
    }

    for (const spot of spots) {
      const tile = map.tiles[spot.row]?.[spot.col];
      if (!tile) continue;
      if (tile.type.startsWith('water')) continue;

      for (let j = 0; j < spot.count; j++) {
        const pos = isoToScreen(spot.col + (Math.random() - 0.5) * 2, spot.row + (Math.random() - 0.5) * 2);
        const animal: Animal = {
          id: nextAnimalId++,
          type: spot.type,
          pos: { x: pos.x, y: pos.y },
          targetPos: null,
          hp: spot.type === 'deer' ? 15 : 30,
          maxHp: spot.type === 'deer' ? 15 : 30,
          food: spot.type === 'deer' ? 100 : 200,
          speed: spot.type === 'deer' ? WANDER_SPEED : WANDER_SPEED * 0.7,
          wanderTimer: Math.random() * WANDER_INTERVAL_MAX,
          fleeTimer: 0,
          animFrame: 0,
          animTimer: 0,
          facingRight: Math.random() > 0.5,
          alive: true,
        };
        this.animals.push(animal);
      }
    }
  }

  update(state: GameState, dt: number): void {
    const playerUnits = state.units.filter(u => u.owner === 'player');

    for (const animal of this.animals) {
      if (!animal.alive) continue;

      // Check for nearby player units → flee
      let fleeFrom: Vec2 | null = null;
      let closestDist = FLEE_DISTANCE;
      for (const unit of playerUnits) {
        const dx = unit.pos.x - animal.pos.x;
        const dy = unit.pos.y - animal.pos.y;
        const dist = Math.sqrt(dx * dx + dy * dy);
        if (dist < closestDist) {
          closestDist = dist;
          fleeFrom = unit.pos;
        }
      }

      if (fleeFrom && closestDist < FLEE_DISTANCE) {
        // Flee away from the nearest player unit
        const dx = animal.pos.x - fleeFrom.x;
        const dy = animal.pos.y - fleeFrom.y;
        const len = Math.sqrt(dx * dx + dy * dy) || 1;
        animal.targetPos = {
          x: animal.pos.x + (dx / len) * 60,
          y: animal.pos.y + (dy / len) * 40,
        };
        animal.fleeTimer = 2;
        animal.speed = FLEE_SPEED;
      } else if (animal.fleeTimer > 0) {
        animal.fleeTimer -= dt;
        if (animal.fleeTimer <= 0) {
          animal.speed = animal.type === 'deer' ? WANDER_SPEED : WANDER_SPEED * 0.7;
          animal.targetPos = null;
        }
      } else {
        // Wander randomly
        animal.wanderTimer -= dt;
        if (animal.wanderTimer <= 0) {
          animal.wanderTimer = WANDER_INTERVAL_MIN + Math.random() * (WANDER_INTERVAL_MAX - WANDER_INTERVAL_MIN);
          animal.targetPos = {
            x: animal.pos.x + (Math.random() - 0.5) * WANDER_RANGE * 2,
            y: animal.pos.y + (Math.random() - 0.5) * WANDER_RANGE,
          };
        }
      }

      // Move toward target
      if (animal.targetPos) {
        const dx = animal.targetPos.x - animal.pos.x;
        const dy = animal.targetPos.y - animal.pos.y;
        const dist = Math.sqrt(dx * dx + dy * dy);
        const step = animal.speed * dt;

        if (dist <= step) {
          animal.pos.x = animal.targetPos.x;
          animal.pos.y = animal.targetPos.y;
          animal.targetPos = null;
        } else {
          animal.pos.x += (dx / dist) * step;
          animal.pos.y += (dy / dist) * step;
          animal.facingRight = dx > 0;
        }

        // Walk animation
        animal.animTimer += dt;
        if (animal.animTimer >= 0.2) {
          animal.animTimer -= 0.2;
          animal.animFrame = (animal.animFrame + 1) % 4;
        }
      } else {
        // Idle: gentle bobbing
        animal.animTimer += dt;
        if (animal.animTimer >= 0.5) {
          animal.animTimer -= 0.5;
          animal.animFrame = (animal.animFrame + 1) % 2;
        }
      }

      // Keep animals on revealed map area (clamp to map bounds)
      const iso = screenToIso(animal.pos.x, animal.pos.y);
      const col = Math.round(iso.x);
      const row = Math.round(iso.y);
      if (col < 1 || row < 1 || col >= state.map.width - 1 || row >= state.map.height - 1) {
        // Bounce back toward center
        const center = isoToScreen(state.map.width / 2, state.map.height / 2);
        animal.targetPos = {
          x: center.x + (Math.random() - 0.5) * 60,
          y: center.y + (Math.random() - 0.5) * 40,
        };
      }
    }

    // Remove dead animals
    this.animals = this.animals.filter(a => a.alive);
  }

  /** Called when a villager "hunts" at a deerHerd tile — kill nearest animal */
  killNearestAnimal(x: number, y: number, radius: number): number {
    let best: Animal | null = null;
    let bestDist = radius;
    for (const a of this.animals) {
      if (!a.alive) continue;
      const dx = a.pos.x - x;
      const dy = a.pos.y - y;
      const dist = Math.sqrt(dx * dx + dy * dy);
      if (dist < bestDist) {
        bestDist = dist;
        best = a;
      }
    }
    if (best) {
      best.alive = false;
      return best.food;
    }
    return 0;
  }
}
