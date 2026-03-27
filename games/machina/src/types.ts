// ============================================================
// Machina — Types & Constants
// ============================================================

export const GAME_W = 1200;
export const GAME_H = 800;

// Color palette
export const C = {
  BRONZE:     '#CD7F32',
  COPPER:     '#B87333',
  DARK_STEEL: '#2C3E50',
  BRASS:      '#B5A642',
  WARM_LIGHT: '#FFD700',
  DARK_BG:    '#1A1A2E',
  RIVET_GREY: '#4A4A4A',
  DARK_METAL: '#1C1C2A',
  LIGHT_METAL:'#8B7355',
  GOLD_HIGH:  '#DEB76B',
  GREEN_GLOW: '#00FF88',
  RED_GLOW:   '#FF4444',
  BLUE_GLOW:  '#4488FF',
  TEAL_TRACE: '#00CED1',
  PANEL_DARK: '#12121E',
  TEXT_GOLD:  '#E8C547',
  TEXT_DIM:   '#7A7A8A',
  WHITE:      '#FFFFFF',
  BLACK:      '#000000',
} as const;

export enum GameState {
  TITLE,
  LEVEL_SELECT,
  PLAYING,
  LEVEL_COMPLETE,
}

export interface MechanismLevel {
  id: number;
  name: string;
  subtitle: string;
  init(): void;
  onPointerDown(x: number, y: number): void;
  onPointerMove(x: number, y: number): void;
  onPointerUp(): void;
  update(dt: number): void;
  render(ctx: CanvasRenderingContext2D): void;
  isSolved(): boolean;
  reset(): void;
  moves: number;
  elapsed: number;
  solved: boolean;
}

export interface Particle {
  x: number;
  y: number;
  vx: number;
  vy: number;
  life: number;
  maxLife: number;
  size: number;
  color: string;
  type: 'spark' | 'dust' | 'steam' | 'glow';
}

export interface LevelProgress {
  unlocked: boolean;
  completed: boolean;
  stars: number;
  bestMoves: number;
  bestTime: number;
}

export function loadProgress(): LevelProgress[] {
  try {
    const raw = localStorage.getItem('machina_progress');
    if (raw) return JSON.parse(raw);
  } catch { /* ignore */ }
  return Array.from({ length: 8 }, (_, i) => ({
    unlocked: i === 0,
    completed: false,
    stars: 0,
    bestMoves: Infinity,
    bestTime: Infinity,
  }));
}

export function saveProgress(p: LevelProgress[]): void {
  try {
    localStorage.setItem('machina_progress', JSON.stringify(p));
  } catch { /* ignore */ }
}

export function calcStars(level: number, moves: number, time: number): number {
  // Per-level thresholds: [3-star moves, 2-star moves, 3-star time, 2-star time]
  const thresholds: Record<number, [number, number, number, number]> = {
    1: [5, 10, 15, 30],
    2: [5, 10, 20, 40],
    3: [15, 25, 30, 60],
    4: [40, 80, 60, 120],
    5: [6, 12, 20, 45],
    6: [3, 6, 30, 60],
    7: [10, 20, 40, 80],
    8: [8, 15, 30, 60],
  };
  const t = thresholds[level] || [10, 20, 30, 60];
  let stars = 1;
  if (moves <= t[1] && time <= t[3]) stars = 2;
  if (moves <= t[0] && time <= t[2]) stars = 3;
  return stars;
}
