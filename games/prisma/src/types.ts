/** Cardinal directions for beam travel */
export enum Direction {
  UP = 'UP',
  DOWN = 'DOWN',
  LEFT = 'LEFT',
  RIGHT = 'RIGHT',
}

/** RGB color channels */
export interface BeamColor {
  r: number; // 0 or 1
  g: number;
  b: number;
}

/** Types of pieces the player can place */
export enum PieceType {
  MIRROR = 'MIRROR',
  PRISM = 'PRISM',
  FILTER_RED = 'FILTER_RED',
  FILTER_GREEN = 'FILTER_GREEN',
  FILTER_BLUE = 'FILTER_BLUE',
}

/** Rotation of a piece (0, 90, 180, 270 degrees) */
export type Rotation = 0 | 90 | 180 | 270;

/** A piece placed on the grid */
export interface Piece {
  type: PieceType;
  rotation: Rotation;
}

/** A light source on the grid */
export interface LightSource {
  col: number;
  row: number;
  direction: Direction;
  color: BeamColor;
}

/** A target receptor */
export interface Target {
  col: number;
  row: number;
  requiredColor: BeamColor;
  receivedColor: BeamColor | null;
  activated: boolean;
}

/** A segment of a beam ray */
export interface BeamSegment {
  fromCol: number;
  fromRow: number;
  toCol: number;
  toRow: number;
  color: BeamColor;
  progress: number; // 0..1 for animation
}

/** Available pieces for a level */
export interface PieceInventory {
  type: PieceType;
  count: number;
}

/** Fixed (non-movable) piece on grid */
export interface FixedPiece {
  col: number;
  row: number;
  piece: Piece;
}

/** Level definition */
export interface LevelDef {
  id: number;
  name: string;
  description: string;
  gridCols: number;
  gridRows: number;
  sources: LightSource[];
  targets: Target[];
  fixedPieces: FixedPiece[];
  availablePieces: PieceInventory[];
  par: number; // par number of pieces for 3 stars
}

/** Current game state */
export interface GameState {
  currentLevel: number;
  grid: (Piece | null)[][]; // [row][col]
  fixedGrid: (Piece | null)[][]; // [row][col] - non-movable pieces
  sources: LightSource[];
  targets: Target[];
  beamSegments: BeamSegment[];
  availablePieces: PieceInventory[];
  selectedPieceType: PieceType | null;
  score: number;
  stars: number;
  levelComplete: boolean;
  startTime: number;
  elapsedTime: number;
}

/** Screen states */
export enum Screen {
  TITLE = 'TITLE',
  LEVEL_SELECT = 'LEVEL_SELECT',
  PLAYING = 'PLAYING',
  LEVEL_COMPLETE = 'LEVEL_COMPLETE',
}

/** Saved progress for a level */
export interface LevelProgress {
  completed: boolean;
  stars: number;
  bestScore: number;
}

/** Particle effect */
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

/** Color combination at a cell */
export interface ColorAccumulator {
  r: number;
  g: number;
  b: number;
}
