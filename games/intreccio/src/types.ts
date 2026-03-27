// ─── Game Constants ───────────────────────────────────────────────

export const CANVAS_W = 1200;
export const CANVAS_H = 800;

export const COLORS = {
  bg: '#1a1610',
  bgLight: '#2A2218',
  brass: '#B8860B',
  brassLight: '#DAA520',
  brassHighlight: '#E8C84A',
  brassDark: '#8B6508',
  parchment: '#D4C5A9',
  parchmentDark: '#BFB092',
  gold: '#FFD700',
  goldGlow: '#F5D061',
  goldDim: '#C4A535',
  hexFill: '#3E2C18',
  hexFillLight: '#5A4028',
  hexBorder: '#8B7340',
  hexSelected: '#DAA520',
  hexFound: '#C4A535',
  letterLight: '#FFF8E1',
  letterDark: '#1A1A2E',
  white: '#FFFFFF',
  shadowDark: 'rgba(0,0,0,0.5)',
  errorRed: '#A52A2A',
};

// ─── Types ────────────────────────────────────────────────────────

export type GameScreen = 'title' | 'levelSelect' | 'playing' | 'levelComplete';

/** Axial hex coordinate */
export interface HexCoord {
  row: number;
  col: number;
}

/** A single hex cell in the grid */
export interface HexCell {
  row: number;
  col: number;
  letter: string;
  /** Pixel center x */
  cx: number;
  /** Pixel center y */
  cy: number;
  /** Is part of a found word */
  found: boolean;
  /** Index of which found word it belongs to (-1 if not found) */
  foundWordIdx: number;
  /** Animation: shake offset */
  shakeX: number;
  shakeY: number;
  /** Animation: glow intensity 0-1 */
  glow: number;
  /** Animation: selection pulse 0-1 */
  selectPulse: number;
}

/** A word hidden in the grid with its path */
export interface HiddenWord {
  word: string;
  path: HexCoord[];
  found: boolean;
}

/** Level definition */
export interface LevelDef {
  id: number;
  gridRows: number;
  gridCols: number;
  words: string[];
  /** Pre-computed grid letters (row-major). If not provided, generated at runtime. */
  grid: string[][];
  /** Pre-computed word paths */
  wordPaths: { word: string; path: HexCoord[] }[];
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
  type: 'dust' | 'gold' | 'ray' | 'sparkle';
  angle?: number;
}

// ─── Utility Functions ────────────────────────────────────────────

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
