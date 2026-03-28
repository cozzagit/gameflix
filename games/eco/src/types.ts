// ── Constants ──────────────────────────────────────────────
export const W = 1200;
export const H = 800;

export const WAVE_SPEED = 220;       // px/s
export const WAVE_MAX_RADIUS = 900;
export const WAVE_RING_WIDTH = 3;
export const REVEAL_DURATION = 4.0;  // seconds
export const PLAYER_SPEED = 160;     // px/s
export const PLAYER_RADIUS = 6;
export const CRYSTAL_RADIUS = 10;
export const EXIT_RADIUS = 22;
export const HAZARD_RADIUS = 14;

// ── Colours ────────────────────────────────────────────────
export const COL = {
  bg:        '#020208',
  stone:     '#06B6D4',
  water:     '#3B82F6',
  crystal:   '#F59E0B',
  exit:      '#10B981',
  hazard:    '#EF4444',
  player:    '#06B6D4',
  wave:      '#06B6D4',
  hud:       '#94A3B8',
  hudBright: '#E2E8F0',
  title:     '#06B6D4',
  subtitle:  '#94A3B8',
} as const;

// ── Types ──────────────────────────────────────────────────
export type WallType = 'stone' | 'water' | 'crystal' | 'hazard';

export interface CaveWall {
  x1: number; y1: number;
  x2: number; y2: number;
  type: WallType;
}

export interface RevealedWall {
  wall: CaveWall;
  brightness: number;  // 1.0 → 0.0
  revealTime: number;  // timestamp when first hit
}

export interface Crystal {
  x: number;
  y: number;
  collected: boolean;
}

export interface Hazard {
  x: number;
  y: number;
  radius: number;
}

export interface CaveLevel {
  name: string;
  subtitle: string;
  walls: CaveWall[];
  playerStart: { x: number; y: number };
  exit: { x: number; y: number; radius: number };
  crystals: Crystal[];
  hazards: Hazard[];
  maxPulses: number;
  tutorialText?: string;
}

export interface SonarWave {
  cx: number;
  cy: number;
  radius: number;
  maxRadius: number;
  birthTime: number;
  alive: boolean;
}

export interface Particle {
  x: number;
  y: number;
  vx: number;
  vy: number;
  life: number;
  maxLife: number;
  color: string;
  size: number;
}

export interface TrailPoint {
  x: number;
  y: number;
  time: number;
}

export type GameState = 'title' | 'levelSelect' | 'playing' | 'levelComplete' | 'gameOver';

export interface LevelResult {
  level: number;
  score: number;
  stars: number;
  crystalsCollected: number;
  crystalsTotal: number;
  pulsesRemaining: number;
  timeSeconds: number;
}

export function wallColor(type: WallType): string {
  switch (type) {
    case 'stone': return COL.stone;
    case 'water': return COL.water;
    case 'crystal': return COL.crystal;
    case 'hazard': return COL.hazard;
  }
}
