// ─── Constants ───────────────────────────────────────────────────────

export const GAME_W = 1200;
export const GAME_H = 800;

export const COLORS = {
  sceneDark1: '#0A0A14',
  sceneDark2: '#1A1A2E',
  flashlightWarm: '#FFF5E0',
  clueHighlight: '#FFD700',
  foundClue: '#10B981',
  mysteryText: '#E8D5B7',
  accentViolet: '#7C3AED',
  accentCrimson: '#E63946',
  connectionGreen: '#22C55E',
  connectionWrong: '#EF4444',
  boardBg: '#1A1820',
  cardBg: '#2A2838',
  cardBorder: '#4A4868',
} as const;

export const FLASHLIGHT = {
  innerRadius: 120,
  outerRadius: 250,
  lerpSpeed: 0.08,
  wobbleAmount: 3,
  wobbleSpeed: 0.002,
} as const;

// ─── Types ───────────────────────────────────────────────────────────

export interface Vec2 {
  x: number;
  y: number;
}

export interface Clue {
  id: string;
  x: number;
  y: number;
  radius: number;
  name: string;
  description: string;
  found: boolean;
}

export interface Connection {
  clueA: string;
  clueB: string;
}

export interface DeductionOption {
  text: string;
  correct: boolean;
  explanation: string;
}

export interface SceneData {
  id: number;
  title: string;
  subtitle: string;
  storyIntro: string;
  mystery: string;
  solution: string;
  clues: Clue[];
  requiredConnections: Connection[];
  deductionQuestion: string;
  deductionOptions: DeductionOption[];
  solutionNarrative: string;
  draw: (ctx: CanvasRenderingContext2D, time: number) => void;
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
}

export type PlayingPhase =
  | 'intro'
  | 'explore'
  | 'clue-popup'
  | 'connect'
  | 'deduce'
  | 'solved';

export type GameState =
  | 'title'
  | 'level-select'
  | 'playing'
  | 'case-solved'
  | 'transition';

export interface LevelProgress {
  completed: boolean;
  stars: number;
  score: number;
  bestTime: number;
}

export interface GameSave {
  levels: Record<number, LevelProgress>;
  totalScore: number;
}
