import {
  Screen, GameState, LevelProgress, PieceType, Piece, Rotation, Direction,
} from './types';
import { LEVELS } from './levels';
import { Renderer } from './renderer';
import { traceAllBeams } from './beam-tracer';
import { playPlace, playRotate, playRemove, playActivate, playLevelComplete, playClick, playError, resumeAudio } from './audio';
import { spawnBeamHitParticles, updateParticles, renderParticles, clearParticles } from './effects';
import { drawTitleScreen, getTitleButton, drawLevelSelect, getLevelSelectButton } from './screens';

const STORAGE_KEY = 'prisma_progress';

/** Tutorial messages shown on level 1 */
const TUTORIAL_MESSAGES = [
  'Clicca sulla barra degli strumenti per selezionare un pezzo',
  'Clicca su una cella vuota per posizionarlo',
  'Clicca su un pezzo posizionato per ruotarlo',
  'Guida la luce verso i bersagli colorati',
];
const TUTORIAL_DURATION = 4.0; // seconds per message
const TUTORIAL_FADE = 0.8; // fade in/out duration

export class Game {
  private canvas: HTMLCanvasElement;
  private renderer: Renderer;
  private screen: Screen = Screen.TITLE;
  private state: GameState | null = null;
  private progress: Map<number, LevelProgress> = new Map();
  private lastTime: number = 0;
  private animTime: number = 0;
  private levelCompleteDelay: number = 0;
  private prevActivated: Set<string> = new Set();
  private tutorialTime: number = 0;
  private tutorialDismissed: boolean = false;

  constructor(canvas: HTMLCanvasElement) {
    this.canvas = canvas;
    this.renderer = new Renderer(canvas);
    this.loadProgress();
    this.setupInput();
  }

  private loadProgress(): void {
    try {
      const raw = localStorage.getItem(STORAGE_KEY);
      if (raw) {
        const data = JSON.parse(raw) as Record<string, LevelProgress>;
        for (const [k, v] of Object.entries(data)) {
          this.progress.set(Number(k), v);
        }
      }
    } catch {
      // Ignore
    }
  }

  private saveProgress(): void {
    try {
      const obj: Record<string, LevelProgress> = {};
      for (const [k, v] of this.progress.entries()) {
        obj[String(k)] = v;
      }
      localStorage.setItem(STORAGE_KEY, JSON.stringify(obj));
    } catch {
      // Ignore
    }
  }

  private setupInput(): void {
    // Click / tap
    this.canvas.addEventListener('click', (e) => {
      resumeAudio();
      const rect = this.canvas.getBoundingClientRect();
      const scaleX = this.canvas.width / rect.width;
      const scaleY = this.canvas.height / rect.height;
      const sx = (e.clientX - rect.left) * scaleX;
      const sy = (e.clientY - rect.top) * scaleY;
      this.handleClick(sx, sy);
    });

    // Right click to remove
    this.canvas.addEventListener('contextmenu', (e) => {
      e.preventDefault();
      resumeAudio();
      const rect = this.canvas.getBoundingClientRect();
      const scaleX = this.canvas.width / rect.width;
      const scaleY = this.canvas.height / rect.height;
      const sx = (e.clientX - rect.left) * scaleX;
      const sy = (e.clientY - rect.top) * scaleY;
      this.handleRightClick(sx, sy);
    });
  }

  private handleClick(sx: number, sy: number): void {
    switch (this.screen) {
      case Screen.TITLE: {
        const btn = getTitleButton(sx, sy, this.canvas.width, this.canvas.height);
        if (btn === 'play') {
          playClick();
          this.screen = Screen.LEVEL_SELECT;
        }
        break;
      }

      case Screen.LEVEL_SELECT: {
        const btn = getLevelSelectButton(sx, sy, this.canvas.width, this.canvas.height, this.progress);
        if (btn) {
          playClick();
          if (btn.type === 'back') {
            this.screen = Screen.TITLE;
          } else {
            this.startLevel(btn.level);
          }
        }
        break;
      }

      case Screen.PLAYING: {
        if (!this.state) break;

        // Check exit button click (top-left)
        if (sx >= 10 && sx <= 50 && sy >= 4 && sy <= 32) {
          playClick();
          this.screen = Screen.LEVEL_SELECT;
          break;
        }

        // Dismiss tutorial on any click (still process the click)
        if (this.state.currentLevel === 1 && !this.tutorialDismissed) {
          this.tutorialDismissed = true;
        }

        // Check toolbar click
        const slot = this.renderer.getToolbarSlot(sx, sy, this.state.availablePieces);
        if (slot >= 0) {
          const inv = this.state.availablePieces[slot];
          if (inv.count > 0) {
            playClick();
            this.state.selectedPieceType = this.state.selectedPieceType === inv.type ? null : inv.type;
          }
          break;
        }

        // Check grid click
        const levelDef = LEVELS[this.state.currentLevel - 1];
        const cell = this.renderer.screenToGrid(sx, sy, levelDef.gridCols, levelDef.gridRows);
        if (cell) {
          this.handleGridClick(cell[0], cell[1]);
        }
        break;
      }

      case Screen.LEVEL_COMPLETE: {
        if (!this.state) break;

        // Check exit button
        if (sx >= 10 && sx <= 50 && sy >= 4 && sy <= 32) {
          playClick();
          this.screen = Screen.LEVEL_SELECT;
          break;
        }

        const buttons = this.renderer.getLevelCompleteButtons(this.state.currentLevel);

        if (this.renderer.isInsideButton(sx, sy, ...buttons.retry)) {
          playClick();
          this.startLevel(this.state.currentLevel);
        } else if (buttons.next && this.renderer.isInsideButton(sx, sy, ...buttons.next)) {
          playClick();
          this.startLevel(this.state.currentLevel + 1);
        }
        break;
      }
    }
  }

  private handleRightClick(sx: number, sy: number): void {
    if (this.screen !== Screen.PLAYING || !this.state) return;

    const levelDef = LEVELS[this.state.currentLevel - 1];
    const cell = this.renderer.screenToGrid(sx, sy, levelDef.gridCols, levelDef.gridRows);
    if (!cell) return;

    const [col, row] = cell;
    const piece = this.state.grid[row][col];
    if (piece) {
      // Return piece to inventory
      const inv = this.state.availablePieces.find(p => p.type === piece.type);
      if (inv) inv.count++;
      this.state.grid[row][col] = null;
      playRemove();
      this.updateBeams();
    }
  }

  private handleGridClick(col: number, row: number): void {
    if (!this.state) return;
    const levelDef = LEVELS[this.state.currentLevel - 1];

    // Can't place on sources
    if (levelDef.sources.some(s => s.col === col && s.row === row)) return;
    // Can't place on targets
    if (levelDef.targets.some(t => t.col === col && t.row === row)) return;
    // Can't place on fixed pieces
    if (this.state.fixedGrid[row][col]) return;

    const existing = this.state.grid[row][col];

    if (existing) {
      // Rotate existing piece
      const rotations: Rotation[] = [0, 90, 180, 270];
      const idx = rotations.indexOf(existing.rotation);
      existing.rotation = rotations[(idx + 1) % 4];
      playRotate();
      this.updateBeams();
    } else if (this.state.selectedPieceType) {
      // Place new piece
      const inv = this.state.availablePieces.find(p => p.type === this.state!.selectedPieceType);
      if (inv && inv.count > 0) {
        inv.count--;
        this.state.grid[row][col] = {
          type: this.state.selectedPieceType,
          rotation: 0,
        };
        playPlace();
        if (inv.count === 0) {
          this.state.selectedPieceType = null;
        }
        this.updateBeams();
      } else {
        playError();
      }
    }
  }

  private startLevel(levelNum: number): void {
    if (levelNum < 1 || levelNum > LEVELS.length) return;

    const def = LEVELS[levelNum - 1];
    const gridRows = def.gridRows;
    const gridCols = def.gridCols;

    // Create empty grids
    const grid: (Piece | null)[][] = [];
    const fixedGrid: (Piece | null)[][] = [];
    for (let r = 0; r < gridRows; r++) {
      grid.push(new Array(gridCols).fill(null));
      fixedGrid.push(new Array(gridCols).fill(null));
    }

    // Place fixed pieces
    for (const fp of def.fixedPieces) {
      fixedGrid[fp.row][fp.col] = { ...fp.piece };
    }

    // Deep copy targets
    const targets = def.targets.map(t => ({
      ...t,
      requiredColor: { ...t.requiredColor },
      receivedColor: null as typeof t.receivedColor,
      activated: false,
    }));

    // Deep copy sources
    const sources = def.sources.map(s => ({
      ...s,
      color: { ...s.color },
    }));

    // Deep copy available pieces
    const availablePieces = def.availablePieces.map(p => ({ ...p }));

    this.state = {
      currentLevel: levelNum,
      grid,
      fixedGrid,
      sources,
      targets,
      beamSegments: [],
      availablePieces,
      selectedPieceType: availablePieces.length > 0 ? availablePieces[0].type : null,
      score: 0,
      stars: 0,
      levelComplete: false,
      startTime: performance.now(),
      elapsedTime: 0,
    };

    this.prevActivated = new Set();
    this.tutorialTime = 0;
    this.tutorialDismissed = false;
    clearParticles();
    this.renderer.computeLayout(gridCols, gridRows);
    this.screen = Screen.PLAYING;
    this.updateBeams();
  }

  private updateBeams(): void {
    if (!this.state) return;
    const def = LEVELS[this.state.currentLevel - 1];

    this.state.beamSegments = traceAllBeams(
      this.state.sources,
      this.state.grid,
      this.state.fixedGrid,
      def.gridCols,
      def.gridRows,
      this.state.targets,
    );

    // Check for newly activated targets
    for (const target of this.state.targets) {
      const key = `${target.col},${target.row}`;
      if (target.activated && !this.prevActivated.has(key)) {
        this.prevActivated.add(key);
        playActivate();
        const [cx, cy] = this.renderer.cellCenter(target.col, target.row);
        spawnBeamHitParticles(cx, cy, target.requiredColor.r, target.requiredColor.g, target.requiredColor.b);
      } else if (!target.activated && this.prevActivated.has(key)) {
        this.prevActivated.delete(key);
      }
    }

    // Check level completion
    const allActivated = this.state.targets.every(t => t.activated);
    if (allActivated && !this.state.levelComplete) {
      this.state.levelComplete = true;
      this.levelCompleteDelay = 1.0; // 1 second delay before showing complete screen

      // Calculate score and stars
      const totalPiecesUsed = this.countPlacedPieces();
      const par = def.par;
      let stars = 1;
      if (totalPiecesUsed <= par) stars = 3;
      else if (totalPiecesUsed <= par + 1) stars = 2;

      // Time bonus
      const elapsed = this.state.elapsedTime;
      const timeBonus = Math.max(0, Math.floor(300 - elapsed * 2));
      const pieceBonus = Math.max(0, (par - totalPiecesUsed + 2) * 100);
      this.state.score = 500 + pieceBonus + timeBonus;
      this.state.stars = stars;

      // Save progress
      const existing = this.progress.get(this.state.currentLevel);
      if (!existing || this.state.score > existing.bestScore) {
        this.progress.set(this.state.currentLevel, {
          completed: true,
          stars: Math.max(stars, existing?.stars || 0),
          bestScore: Math.max(this.state.score, existing?.bestScore || 0),
        });
        this.saveProgress();
      }

      playLevelComplete();
    }
  }

  private countPlacedPieces(): number {
    if (!this.state) return 0;
    let count = 0;
    for (const row of this.state.grid) {
      for (const cell of row) {
        if (cell) count++;
      }
    }
    return count;
  }

  /** Main game loop tick */
  update(timestamp: number): void {
    const dt = this.lastTime ? (timestamp - this.lastTime) / 1000 : 0.016;
    this.lastTime = timestamp;
    this.animTime += dt;

    this.renderer.updateTime(dt);
    updateParticles(dt);

    if (this.state && this.screen === Screen.PLAYING) {
      this.state.elapsedTime = (performance.now() - this.state.startTime) / 1000;

      // Update tutorial time for level 1
      if (this.state.currentLevel === 1 && !this.tutorialDismissed) {
        this.tutorialTime += dt;
      }

      // Spawn particles on beam endpoints
      if (Math.random() < 0.3) {
        for (const seg of this.state.beamSegments) {
          if (Math.random() < 0.05) {
            const [x, y] = this.renderer.cellCenter(
              Math.max(0, Math.min(seg.toCol, 7)),
              Math.max(0, Math.min(seg.toRow, 5)),
            );
            spawnBeamHitParticles(x + (Math.random() - 0.5) * 10, y + (Math.random() - 0.5) * 10,
              seg.color.r, seg.color.g, seg.color.b);
          }
        }
      }

      // Handle level complete delay
      if (this.state.levelComplete) {
        this.levelCompleteDelay -= dt;
        if (this.levelCompleteDelay <= 0) {
          this.screen = Screen.LEVEL_COMPLETE;
        }
      }
    }

    this.render();
  }

  private render(): void {
    const ctx = this.canvas.getContext('2d')!;

    switch (this.screen) {
      case Screen.TITLE:
        drawTitleScreen(ctx, this.canvas.width, this.canvas.height, this.animTime);
        break;

      case Screen.LEVEL_SELECT:
        drawLevelSelect(ctx, this.canvas.width, this.canvas.height, this.progress, this.animTime);
        break;

      case Screen.PLAYING: {
        if (!this.state) break;
        const def = LEVELS[this.state.currentLevel - 1];

        this.renderer.clear();
        this.renderer.drawGrid(def.gridCols, def.gridRows);
        this.renderer.drawBeams(this.state.beamSegments);
        this.renderer.drawPieces(this.state.grid, this.state.fixedGrid, def.gridRows, def.gridCols);
        this.renderer.drawSources(this.state.sources);
        this.renderer.drawTargets(this.state.targets);
        renderParticles(ctx);
        this.renderer.drawToolbar(this.state.availablePieces, this.state.selectedPieceType);
        this.renderer.drawHUD(
          this.state.currentLevel,
          def.name,
          this.state.score,
          this.state.elapsedTime,
          this.state.stars,
        );
        this.renderer.drawExitButton();

        // Tutorial overlay for level 1
        if (this.state.currentLevel === 1 && !this.tutorialDismissed) {
          this.renderer.drawTutorialOverlay(
            TUTORIAL_MESSAGES,
            this.tutorialTime,
            TUTORIAL_DURATION,
            TUTORIAL_FADE,
          );
        }
        break;
      }

      case Screen.LEVEL_COMPLETE: {
        if (!this.state) break;
        const def = LEVELS[this.state.currentLevel - 1];

        this.renderer.clear();
        this.renderer.drawGrid(def.gridCols, def.gridRows);
        this.renderer.drawBeams(this.state.beamSegments);
        this.renderer.drawPieces(this.state.grid, this.state.fixedGrid, def.gridRows, def.gridCols);
        this.renderer.drawSources(this.state.sources);
        this.renderer.drawTargets(this.state.targets);
        renderParticles(ctx);

        this.renderer.drawLevelComplete(
          this.state.currentLevel,
          this.state.stars,
          this.state.score,
          this.state.elapsedTime,
        );
        break;
      }
    }
  }
}
