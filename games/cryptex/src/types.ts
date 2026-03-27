// ─── Game Constants ───────────────────────────────────────────────

export const CANVAS_W = 1200;
export const CANVAS_H = 800;

export const ALPHABET = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ';
export const ALPHABET_LEN = 26;

export const WHEEL_WIDTH = 68;
export const WHEEL_HEIGHT = 180;
export const WHEEL_GAP = 8;
export const LETTER_SNAP_PX = 46;
export const LETTER_HEIGHT = 46;

export const DWELL_TIME_MS = 500;
export const SOLVE_ANIM_DURATION = 2500;

export const COLORS = {
  bg: '#1A1612',
  bgLight: '#2A2218',
  brass: '#B8860B',
  brassLight: '#DAA520',
  brassHighlight: '#E8C84A',
  brassDark: '#8B6508',
  wood: '#3E2723',
  woodLight: '#5D4037',
  woodMid: '#4E342E',
  parchment: '#D4C5A9',
  parchmentDark: '#BFB092',
  parchmentEdge: '#A89878',
  textSepia: '#2C1810',
  letterEngrave: '#1A1A2E',
  gold: '#FFD700',
  goldGlow: '#F5D061',
  goldDim: '#C4A535',
  waxRed: '#8B1A1A',
  waxRedLight: '#A52A2A',
  white: '#FFFFFF',
  shadowDark: 'rgba(0,0,0,0.5)',
};

// ─── Types ────────────────────────────────────────────────────────

export type GameScreen = 'title' | 'levelSelect' | 'playing' | 'levelComplete';

export interface LevelDef {
  id: number;
  word: string;
  clue: string;
  category: string;
}

export interface LevelProgress {
  completed: boolean;
  stars: number;
  bestScore: number;
  bestTime: number;
}

export interface SaveData {
  levels: Record<number, LevelProgress>;
  totalScore: number;
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
  alpha: number;
  type: 'dust' | 'gold' | 'ray';
  angle?: number;
}

export interface WheelState {
  index: number;
  currentLetterIndex: number;
  targetLetterIndex: number;
  animOffset: number;
  isDragging: boolean;
  dragStartY: number;
  dragAccum: number;
  x: number;
  y: number;
}

export function toRoman(num: number): string {
  const vals = [1000, 900, 500, 400, 100, 90, 50, 40, 10, 9, 5, 4, 1];
  const syms = ['M', 'CM', 'D', 'CD', 'C', 'XC', 'L', 'XL', 'X', 'IX', 'V', 'IV', 'I'];
  let result = '';
  for (let i = 0; i < vals.length; i++) {
    while (num >= vals[i]) {
      result += syms[i];
      num -= vals[i];
    }
  }
  return result;
}

export function clamp(v: number, min: number, max: number): number {
  return v < min ? min : v > max ? max : v;
}

export function lerp(a: number, b: number, t: number): number {
  return a + (b - a) * t;
}

export function easeOutCubic(t: number): number {
  return 1 - Math.pow(1 - t, 3);
}

export function easeInOutCubic(t: number): number {
  return t < 0.5 ? 4 * t * t * t : 1 - Math.pow(-2 * t + 2, 3) / 2;
}

export function easeOutBack(t: number): number {
  const c1 = 1.70158;
  const c3 = c1 + 1;
  return 1 + c3 * Math.pow(t - 1, 3) + c1 * Math.pow(t - 1, 2);
}
