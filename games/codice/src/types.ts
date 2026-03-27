// ─── Game Constants ───────────────────────────────────────────────

export const CANVAS_W = 1200;
export const CANVAS_H = 800;

export const ALPHABET = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ';

export const COLORS = {
  bg: '#0a1a0a',
  bgLight: '#0f2a0f',
  bgMid: '#122612',
  terminal: '#0d200d',
  green: '#00FF41',
  greenDim: '#00AA2A',
  greenDark: '#005518',
  greenGlow: '#00FF41',
  greenFaint: '#003d10',
  amber: '#FFB000',
  amberDim: '#AA7500',
  red: '#FF2020',
  redDim: '#AA1515',
  white: '#E0FFE0',
  whiteDim: '#80AA80',
  screenBorder: '#1a3a1a',
  panelBg: '#0a150a',
  panelBorder: '#1a4a1a',
  classified: '#CC0000',
  gold: '#FFD700',
  scanline: 'rgba(0,0,0,0.15)',
};

export const FONTS = {
  mono: '"Courier New", Courier, monospace',
  terminal: '"Lucida Console", "Courier New", monospace',
};

// ─── Types ────────────────────────────────────────────────────────

export type CipherType = 'caesar' | 'reverse' | 'a1z26' | 'keyword' | 'morse' | 'atbash' | 'vigenere' | 'multi';

export type GameScreen = 'title' | 'levelSelect' | 'playing' | 'levelComplete' | 'gameComplete';

export interface LevelDef {
  id: number;
  title: string;
  subtitle: string;
  cipherType: CipherType;
  encrypted: string;
  answer: string;
  hint: string;
  toolDescription: string;
  cipherParam?: string | number;
  steps?: LevelStep[];
}

export interface LevelStep {
  cipherType: CipherType;
  encrypted: string;
  answer: string;
  param?: string | number;
  description: string;
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
  type: 'spark' | 'glow' | 'morse' | 'decrypt';
}

export interface Button {
  x: number;
  y: number;
  w: number;
  h: number;
  label: string;
  action: string;
  hovered: boolean;
}

// ─── Utility Functions ────────────────────────────────────────────

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
