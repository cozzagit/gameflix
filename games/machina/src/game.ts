// ============================================================
// Machina — Main Game Class
// ============================================================

import {
  GAME_W, GAME_H, GameState, MechanismLevel,
  LevelProgress, loadProgress, saveProgress, calcStars
} from './types';
import { InputManager } from './input';
import { initAudio } from './audio';
import { createLevel, LEVEL_COUNT } from './levels';
import {
  renderTitle, hitTestTitlePlay,
  renderLevelSelect, hitTestLevelCard, hitTestLevelSelectBack,
  renderLevelComplete, hitTestCompleteNext, hitTestCompleteLevels,
  hitTestHUDBack
} from './screens';

export class Game {
  private canvas: HTMLCanvasElement;
  private ctx: CanvasRenderingContext2D;
  private input: InputManager;
  private state: GameState = GameState.TITLE;
  private currentLevel: MechanismLevel | null = null;
  private currentLevelId = 0;
  private progress: LevelProgress[];
  private time = 0;
  private lastTime = 0;
  private completionStars = 0;
  private audioInitialized = false;

  constructor(canvas: HTMLCanvasElement) {
    this.canvas = canvas;
    this.ctx = canvas.getContext('2d')!;
    this.input = new InputManager(canvas);
    this.progress = loadProgress();

    this.resize();
    window.addEventListener('resize', () => this.resize());

    this.setupInput();
  }

  private resize(): void {
    const ratio = GAME_W / GAME_H;
    let w = window.innerWidth;
    let h = window.innerHeight;
    if (w / h > ratio) {
      w = h * ratio;
    } else {
      h = w / ratio;
    }
    this.canvas.width = GAME_W;
    this.canvas.height = GAME_H;
    this.canvas.style.width = `${w}px`;
    this.canvas.style.height = `${h}px`;
    this.canvas.style.marginTop = `${(window.innerHeight - h) / 2}px`;
    this.input.updateScale();
  }

  private setupInput(): void {
    this.input.onDown((x, y) => {
      if (!this.audioInitialized) {
        initAudio();
        this.audioInitialized = true;
      }

      switch (this.state) {
        case GameState.TITLE:
          if (hitTestTitlePlay(x, y)) {
            this.state = GameState.LEVEL_SELECT;
          }
          break;

        case GameState.LEVEL_SELECT:
          if (hitTestLevelSelectBack(x, y)) {
            this.state = GameState.TITLE;
            break;
          }
          const levelIdx = hitTestLevelCard(x, y);
          if (levelIdx >= 0 && this.progress[levelIdx].unlocked) {
            this.startLevel(levelIdx + 1);
          }
          break;

        case GameState.PLAYING:
          if (hitTestHUDBack(x, y)) {
            this.state = GameState.LEVEL_SELECT;
            this.currentLevel = null;
            break;
          }
          if (this.currentLevel && !this.currentLevel.solved) {
            this.currentLevel.onPointerDown(x, y);
          }
          break;

        case GameState.LEVEL_COMPLETE:
          if (hitTestCompleteNext(this.currentLevelId - 1, x, y)) {
            this.startLevel(this.currentLevelId + 1);
          } else if (hitTestCompleteLevels(this.currentLevelId - 1, x, y)) {
            this.state = GameState.LEVEL_SELECT;
            this.currentLevel = null;
          }
          break;
      }
    });

    this.input.onMove((x, y) => {
      if (this.state === GameState.PLAYING && this.currentLevel) {
        this.currentLevel.onPointerMove(x, y);
      }
    });

    this.input.onUp(() => {
      if (this.state === GameState.PLAYING && this.currentLevel) {
        this.currentLevel.onPointerUp();
      }
    });
  }

  private startLevel(id: number): void {
    this.currentLevelId = id;
    this.currentLevel = createLevel(id);
    this.currentLevel.init();
    this.state = GameState.PLAYING;
  }

  private completeLevel(): void {
    if (!this.currentLevel) return;

    const stars = calcStars(
      this.currentLevelId,
      this.currentLevel.moves,
      this.currentLevel.elapsed
    );
    this.completionStars = stars;

    const idx = this.currentLevelId - 1;
    const p = this.progress[idx];
    p.completed = true;
    if (stars > p.stars) p.stars = stars;
    if (this.currentLevel.moves < p.bestMoves) p.bestMoves = this.currentLevel.moves;
    if (this.currentLevel.elapsed < p.bestTime) p.bestTime = this.currentLevel.elapsed;

    // Unlock next level
    if (this.currentLevelId < LEVEL_COUNT) {
      this.progress[this.currentLevelId].unlocked = true;
    }

    saveProgress(this.progress);
    this.state = GameState.LEVEL_COMPLETE;
  }

  start(): void {
    this.lastTime = performance.now();
    this.loop();
  }

  private loop = (): void => {
    const now = performance.now();
    const dt = Math.min(0.1, (now - this.lastTime) / 1000);
    this.lastTime = now;
    this.time += dt;

    this.update(dt);
    this.render();

    requestAnimationFrame(this.loop);
  };

  private update(dt: number): void {
    if (this.state === GameState.PLAYING && this.currentLevel) {
      this.currentLevel.update(dt);

      // Check if level was just solved
      if (this.currentLevel.solved && this.state === GameState.PLAYING) {
        // Wait a bit for the solve animation
        if (this.currentLevel.elapsed > 0) {
          // Delay transition to complete screen
          setTimeout(() => {
            if (this.state === GameState.PLAYING) {
              this.completeLevel();
            }
          }, 1500);
        }
      }
    }
  }

  private render(): void {
    const ctx = this.ctx;
    ctx.clearRect(0, 0, GAME_W, GAME_H);

    switch (this.state) {
      case GameState.TITLE:
        renderTitle(ctx, this.time);
        break;

      case GameState.LEVEL_SELECT:
        renderLevelSelect(ctx, this.progress, this.time);
        break;

      case GameState.PLAYING:
        if (this.currentLevel) {
          this.currentLevel.render(ctx);
        }
        break;

      case GameState.LEVEL_COMPLETE:
        // Render level in background
        if (this.currentLevel) {
          this.currentLevel.render(ctx);
        }
        renderLevelComplete(
          ctx,
          this.currentLevelId - 1,
          this.completionStars,
          this.currentLevel?.moves || 0,
          this.currentLevel?.elapsed || 0,
          this.time
        );
        break;
    }
  }
}
