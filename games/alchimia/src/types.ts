export type Category = 'naturali' | 'energia' | 'materia' | 'vita' | 'celesti' | 'base' | 'costruzioni' | 'avanzati';

export interface ElementDef {
  id: string;
  name: string;
  category: Category;
  color: string;
  glowColor: string;
  depth: number; // depth in recipe tree, base=0
}

export interface Recipe {
  a: string;
  b: string;
  result: string;
}

export interface PlacedElement {
  id: string;
  x: number;
  y: number;
  vx: number;
  vy: number;
  scale: number;
  alpha: number;
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

export interface Sparkle {
  x: number;
  y: number;
  vx: number;
  vy: number;
  life: number;
  maxLife: number;
  size: number;
  alpha: number;
}

export interface Chapter {
  id: number;
  name: string;
  subtitle: string;
  requiredDiscoveries: number;
}

export type GameScreen = 'title' | 'tutorial' | 'play' | 'chapter-complete';

export interface GameState {
  screen: GameScreen;
  discovered: Set<string>;
  score: number;
  currentChapter: number;
  chapterCompleted: boolean[];
  placedElements: PlacedElement[];
  particles: Particle[];
  sparkles: Sparkle[];
  heldElement: string | null;
  mouseX: number;
  mouseY: number;
  mouseDown: boolean;
  scrollOffset: number;
  maxScroll: number;
  discoveryAnim: DiscoveryAnim | null;
  invalidAnim: InvalidAnim | null;
  mergeAnim: MergeAnim | null;
  titleAlpha: number;
  titlePhase: number;
  hintText: string;
  hintTimer: number;
  hoveredElement: string | null;
  hoveredWorkspace: string | null;
  celebrationTimer: number;
  discoveryLog: DiscoveryLogEntry[];
  tutorialStep: number;
  tutorialTimer: number;
  showTutorialHasPlayed: boolean;
}

export interface DiscoveryLogEntry {
  name: string;
  recipe: string;
  timer: number;
}

export interface DiscoveryAnim {
  elementId: string;
  x: number;
  y: number;
  timer: number;
  maxTimer: number;
}

export interface InvalidAnim {
  x: number;
  y: number;
  timer: number;
  maxTimer: number;
}

export interface MergeAnim {
  ax: number;
  ay: number;
  bx: number;
  by: number;
  targetX: number;
  targetY: number;
  elemA: string;
  elemB: string;
  result: string;
  timer: number;
  maxTimer: number;
}
