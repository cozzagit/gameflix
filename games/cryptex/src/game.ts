import {
  CANVAS_W, CANVAS_H,
  GameScreen, SaveData, LevelProgress,
  SOLVE_ANIM_DURATION,
} from './types';
import { LEVELS } from './levels';
import { Cryptex } from './cryptex';
import { Renderer } from './renderer';
import { ParticleSystem } from './effects';
import {
  unlockAudio, playButtonClick, playSolve, playHintReveal,
} from './audio';
import {
  drawTitleScreen, drawLevelSelect, drawLevelComplete,
  getTitleButtonRects,
} from './screens';

const STORAGE_KEY = 'cryptex_save';
const MAX_HINTS = 3;

export class Game {
  private canvas: HTMLCanvasElement;
  private ctx: CanvasRenderingContext2D;
  private renderer: Renderer;
  private particles: ParticleSystem;
  private cryptex: Cryptex;

  private screen: GameScreen = 'title';
  private saveData: SaveData = { levels: {}, totalScore: 0 };

  // Level state
  private currentLevelIdx = 0;
  private levelStartTime = 0;
  private elapsedTime = 0;
  private hintsUsed = 0;
  private levelScore = 0;
  private levelStars = 0;

  // Solve animation
  private solveAnimStart = 0;
  private solveAnimProgress = 0;
  private solvedTriggered = false;

  // Level complete overlay
  private completeAnimStart = 0;
  private completeAnimProgress = 0;
  private completeRects = {
    nextRect: { x: 0, y: 0, w: 0, h: 0 },
    menuRect: { x: 0, y: 0, w: 0, h: 0 },
  };

  // Level select rects
  private levelSelectRects: { id: number; x: number; y: number; w: number; h: number }[] = [];
  private levelSelectBackRect = { x: 0, y: 0, w: 0, h: 0 };

  // UI rects for playing screen
  private hintBtnRect = { x: 0, y: 0, w: 180, h: 36 };
  private backBtnRect = { x: 20, y: 20, w: 110, h: 34 };

  // Input state
  private mouseX = 0;
  private mouseY = 0;
  private isMouseDown = false;
  private activeWheelIdx = -1;

  // Frame
  private frameCount = 0;
  private lastTime = 0;
  private dustTimer = 0;

  // Scale
  private scaleX = 1;
  private scaleY = 1;
  private offsetX = 0;
  private offsetY = 0;

  constructor(canvas: HTMLCanvasElement) {
    this.canvas = canvas;
    this.ctx = canvas.getContext('2d')!;
    this.renderer = new Renderer(this.ctx);
    this.particles = new ParticleSystem();
    this.cryptex = new Cryptex();

    this.loadSave();
    this.setupInput();
    this.resize();
    window.addEventListener('resize', () => this.resize());
  }

  private resize(): void {
    const dpr = window.devicePixelRatio || 1;
    const windowW = window.innerWidth;
    const windowH = window.innerHeight;

    const scaleToFit = Math.min(windowW / CANVAS_W, windowH / CANVAS_H);
    const displayW = CANVAS_W * scaleToFit;
    const displayH = CANVAS_H * scaleToFit;

    this.canvas.width = CANVAS_W * dpr;
    this.canvas.height = CANVAS_H * dpr;
    this.canvas.style.width = `${displayW}px`;
    this.canvas.style.height = `${displayH}px`;

    this.ctx.setTransform(dpr, 0, 0, dpr, 0, 0);

    this.scaleX = CANVAS_W / displayW;
    this.scaleY = CANVAS_H / displayH;
    this.offsetX = (windowW - displayW) / 2;
    this.offsetY = (windowH - displayH) / 2;

    this.canvas.style.position = 'absolute';
    this.canvas.style.left = `${this.offsetX}px`;
    this.canvas.style.top = `${this.offsetY}px`;
  }

  private toCanvasCoords(clientX: number, clientY: number): { x: number; y: number } {
    return {
      x: (clientX - this.offsetX) * this.scaleX,
      y: (clientY - this.offsetY) * this.scaleY,
    };
  }

  private setupInput(): void {
    // Mouse
    this.canvas.addEventListener('mousedown', (e) => {
      e.preventDefault();
      unlockAudio();
      const pos = this.toCanvasCoords(e.clientX, e.clientY);
      this.handlePointerDown(pos.x, pos.y);
    });

    this.canvas.addEventListener('mousemove', (e) => {
      const pos = this.toCanvasCoords(e.clientX, e.clientY);
      this.handlePointerMove(pos.x, pos.y);
    });

    this.canvas.addEventListener('mouseup', (e) => {
      const pos = this.toCanvasCoords(e.clientX, e.clientY);
      this.handlePointerUp(pos.x, pos.y);
    });

    // Touch
    this.canvas.addEventListener('touchstart', (e) => {
      e.preventDefault();
      unlockAudio();
      const t = e.touches[0];
      const pos = this.toCanvasCoords(t.clientX, t.clientY);
      this.handlePointerDown(pos.x, pos.y);
    }, { passive: false });

    this.canvas.addEventListener('touchmove', (e) => {
      e.preventDefault();
      const t = e.touches[0];
      const pos = this.toCanvasCoords(t.clientX, t.clientY);
      this.handlePointerMove(pos.x, pos.y);
    }, { passive: false });

    this.canvas.addEventListener('touchend', (e) => {
      e.preventDefault();
      this.handlePointerUp(this.mouseX, this.mouseY);
    }, { passive: false });
  }

  private handlePointerDown(x: number, y: number): void {
    this.mouseX = x;
    this.mouseY = y;
    this.isMouseDown = true;

    if (this.screen === 'title') {
      const btns = getTitleButtonRects();
      if (this.hitRect(x, y, btns.play)) {
        playButtonClick();
        this.startNextUncompletedLevel();
      } else if (this.hitRect(x, y, btns.select)) {
        playButtonClick();
        this.screen = 'levelSelect';
      }
      return;
    }

    if (this.screen === 'levelSelect') {
      if (this.hitRect(x, y, this.levelSelectBackRect)) {
        playButtonClick();
        this.screen = 'title';
        return;
      }
      for (const rect of this.levelSelectRects) {
        if (this.hitRect(x, y, rect)) {
          const idx = LEVELS.findIndex(l => l.id === rect.id);
          const isUnlocked = idx === 0 || this.saveData.levels[LEVELS[idx - 1]?.id]?.completed;
          if (isUnlocked) {
            playButtonClick();
            this.startLevel(idx);
          }
          return;
        }
      }
      return;
    }

    if (this.screen === 'levelComplete') {
      if (this.hitRect(x, y, this.completeRects.nextRect)) {
        playButtonClick();
        if (this.currentLevelIdx < LEVELS.length - 1) {
          this.startLevel(this.currentLevelIdx + 1);
        }
      } else if (this.hitRect(x, y, this.completeRects.menuRect)) {
        playButtonClick();
        this.screen = 'title';
      }
      return;
    }

    if (this.screen === 'playing') {
      if (this.cryptex.solved) return;

      // Back button
      if (this.hitRect(x, y, this.backBtnRect)) {
        playButtonClick();
        this.screen = 'levelSelect';
        return;
      }

      // Hint button
      if (this.hitRect(x, y, this.hintBtnRect) && this.hintsUsed < MAX_HINTS) {
        playHintReveal();
        this.cryptex.revealHint();
        this.hintsUsed++;
        return;
      }

      // Wheel drag
      const wheel = this.cryptex.hitTestWheel(x, y);
      if (wheel) {
        this.activeWheelIdx = wheel.index;
        this.cryptex.startDrag(wheel, y);
        this.canvas.style.cursor = 'grabbing';
      }
    }
  }

  private handlePointerMove(x: number, y: number): void {
    this.mouseX = x;
    this.mouseY = y;

    if (this.screen === 'playing' && this.activeWheelIdx >= 0) {
      const wheel = this.cryptex.wheels[this.activeWheelIdx];
      this.cryptex.updateDrag(wheel, y);
    }

    // Cursor style
    if (this.screen === 'playing' && this.activeWheelIdx < 0 && !this.cryptex.solved) {
      const overWheel = this.cryptex.hitTestWheel(x, y);
      this.canvas.style.cursor = overWheel ? 'grab' : 'default';
    }
  }

  private handlePointerUp(_x: number, _y: number): void {
    this.isMouseDown = false;

    if (this.screen === 'playing' && this.activeWheelIdx >= 0) {
      const wheel = this.cryptex.wheels[this.activeWheelIdx];
      this.cryptex.endDrag(wheel);
      this.activeWheelIdx = -1;
      this.canvas.style.cursor = 'default';
    }
  }

  private hitRect(px: number, py: number, rect: { x: number; y: number; w: number; h: number }): boolean {
    return px >= rect.x && px <= rect.x + rect.w && py >= rect.y && py <= rect.y + rect.h;
  }

  private startNextUncompletedLevel(): void {
    for (let i = 0; i < LEVELS.length; i++) {
      if (!this.saveData.levels[LEVELS[i].id]?.completed) {
        this.startLevel(i);
        return;
      }
    }
    // All completed, start from level 1
    this.startLevel(0);
  }

  private startLevel(idx: number): void {
    this.currentLevelIdx = idx;
    this.screen = 'playing';
    this.solvedTriggered = false;
    this.solveAnimStart = 0;
    this.solveAnimProgress = 0;
    this.completeAnimProgress = 0;
    this.hintsUsed = 0;
    this.levelScore = 0;
    this.levelStars = 0;

    const level = LEVELS[idx];
    const cryptexCY = CANVAS_H * 0.52;
    this.cryptex.init(level.word, CANVAS_W / 2, cryptexCY);

    // Position hint button
    this.hintBtnRect = {
      x: CANVAS_W / 2 - 90,
      y: cryptexCY + this.cryptex.bodyH / 2 + 30,
      w: 180,
      h: 36,
    };

    this.levelStartTime = performance.now();
    this.elapsedTime = 0;
    this.particles.clear();
  }

  private calculateScore(time: number, usedHint: boolean): { score: number; stars: number } {
    let score = 100;
    let stars = 1;

    if (time < 15) {
      score += 50;
    } else if (time < 30) {
      score += 25;
    }

    if (!usedHint) {
      score += 30;
    }

    // Stars
    if (!usedHint && time < 15) {
      stars = 3;
    } else if (!usedHint || time < 30) {
      stars = 2;
    }

    return { score, stars };
  }

  private onLevelSolved(): void {
    const usedHint = this.hintsUsed > 0;
    const result = this.calculateScore(this.elapsedTime, usedHint);
    this.levelScore = result.score;
    this.levelStars = result.stars;

    const levelId = LEVELS[this.currentLevelIdx].id;
    const existing = this.saveData.levels[levelId];

    if (!existing || result.score > existing.bestScore) {
      this.saveData.levels[levelId] = {
        completed: true,
        stars: Math.max(result.stars, existing?.stars ?? 0),
        bestScore: Math.max(result.score, existing?.bestScore ?? 0),
        bestTime: existing ? Math.min(this.elapsedTime, existing.bestTime) : this.elapsedTime,
      };
    } else {
      this.saveData.levels[levelId] = {
        ...existing,
        completed: true,
        stars: Math.max(result.stars, existing.stars),
      };
    }

    // Recalculate total score
    this.saveData.totalScore = Object.values(this.saveData.levels).reduce(
      (sum, l) => sum + l.bestScore, 0
    );

    this.saveSave();
  }

  // ─── Save/Load ──────────────────────────────────────────────────

  private loadSave(): void {
    try {
      const raw = localStorage.getItem(STORAGE_KEY);
      if (raw) {
        this.saveData = JSON.parse(raw);
      }
    } catch {
      this.saveData = { levels: {}, totalScore: 0 };
    }
  }

  private saveSave(): void {
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(this.saveData));
    } catch {
      // Storage full or unavailable
    }
  }

  // ─── Game Loop ──────────────────────────────────────────────────

  start(): void {
    this.lastTime = performance.now();
    this.loop();
  }

  private loop = (): void => {
    const now = performance.now();
    const _dt = now - this.lastTime;
    this.lastTime = now;
    this.frameCount++;

    this.update(now);
    this.draw();

    requestAnimationFrame(this.loop);
  };

  private update(now: number): void {
    // Dust particles (all screens)
    this.dustTimer++;
    if (this.dustTimer % 12 === 0) {
      this.particles.spawnDust();
    }
    this.particles.update();

    if (this.screen === 'playing') {
      if (!this.cryptex.solved) {
        this.elapsedTime = (now - this.levelStartTime) / 1000;
      }

      this.cryptex.animate();

      // Check solve with dwell
      const justSolved = this.cryptex.updateDwell(now);
      if (justSolved && !this.solvedTriggered) {
        this.solvedTriggered = true;
        this.solveAnimStart = now;
        playSolve();

        // Particle effects
        const cx = this.cryptex.bodyX + this.cryptex.bodyW / 2;
        const cy = this.cryptex.bodyY + this.cryptex.bodyH / 2;
        this.particles.spawnSolveBurst(cx, cy);
        this.particles.spawnRays(cx, cy);

        this.onLevelSolved();
      }

      if (this.solvedTriggered) {
        this.solveAnimProgress = Math.min((now - this.solveAnimStart) / SOLVE_ANIM_DURATION, 1);

        if (this.solveAnimProgress >= 1 && this.completeAnimProgress === 0) {
          this.completeAnimStart = now;
          this.screen = 'levelComplete';
        }
      }
    }

    if (this.screen === 'levelComplete') {
      this.completeAnimProgress = Math.min(
        (now - this.completeAnimStart) / 800, 1
      );
    }
  }

  private draw(): void {
    const ctx = this.ctx;

    if (this.screen === 'title') {
      drawTitleScreen(ctx, this.frameCount, this.saveData);
      this.particles.draw(ctx);
      return;
    }

    if (this.screen === 'levelSelect') {
      const result = drawLevelSelect(ctx, this.saveData, this.frameCount);
      this.levelSelectRects = result.rects;
      this.levelSelectBackRect = result.backRect;
      this.particles.draw(ctx);
      return;
    }

    // Playing or levelComplete (background scene stays)
    this.renderer.drawBackground();

    const level = LEVELS[this.currentLevelIdx];

    // Parchment with clue
    this.renderer.drawParchment(level.clue, level.id, level.category);

    // Cryptex device
    this.renderer.drawCryptexDevice(this.cryptex, this.solveAnimProgress);

    // Particles
    this.particles.draw(ctx);

    // UI (only if not in solve animation)
    if (!this.solvedTriggered) {
      // Timer
      this.renderer.drawTimer(
        this.elapsedTime,
        CANVAS_W / 2,
        this.cryptex.bodyY + this.cryptex.bodyH / 2 + this.cryptex.bodyH / 2 + 85
      );

      // Hint button
      this.renderer.drawHintButton(
        this.hintBtnRect.x, this.hintBtnRect.y,
        this.hintBtnRect.w, this.hintBtnRect.h,
        this.hintsUsed, MAX_HINTS
      );

      // Back button
      this.renderer.drawBackButton(
        this.backBtnRect.x, this.backBtnRect.y,
        this.backBtnRect.w, this.backBtnRect.h
      );
    }

    // Level complete overlay
    if (this.screen === 'levelComplete') {
      this.completeRects = drawLevelComplete(
        ctx,
        level.word,
        level.clue,
        this.levelScore,
        this.levelStars,
        this.elapsedTime,
        this.hintsUsed > 0,
        level.id,
        this.currentLevelIdx >= LEVELS.length - 1,
        this.completeAnimProgress,
        this.frameCount
      );
    }
  }
}
