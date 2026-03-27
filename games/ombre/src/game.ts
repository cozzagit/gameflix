// ─── Main Game Class — State Machine ─────────────────────────────────

import {
  type GameState, type SceneData, type LevelProgress, type GameSave,
  GAME_W, GAME_H, FLASHLIGHT,
} from './types';
import { getScene, TOTAL_LEVELS } from './scenes/index';
import { setFlashlightTarget, updateFlashlight, applyDarknessMask, drawFlashlightCursor, getFlashlightPos } from './flashlight';
import { spawnDustParticles, spawnDiscoveryBurst, updateParticles, drawParticles, clearParticles } from './effects';
import { drawClueBar } from './clue-bar';
import { drawClueHighlight, drawTextShadow, roundRect } from './renderer';
import { drawTitleScreen, getTitlePlayButton, drawLevelSelect, getLevelSelectClick, drawCaseSolved, getCaseSolvedButton } from './screens';
import { playDiscoveryChime, playCaseSolved, playClick, playWrongClick, playLevelStart, initAudio } from './audio';

const SAVE_KEY = 'ombre_save';

export class Game {
  private canvas: HTMLCanvasElement;
  private ctx: CanvasRenderingContext2D;
  private state: GameState = 'title';
  private currentScene: SceneData | null = null;
  private currentLevel = 0;
  private levelProgress: Record<number, LevelProgress> = {};
  private levelStartTime = 0;
  private wrongClicks = 0;
  private caseSolvedTime = 0;
  private transitionAlpha = 0;
  private transitionTarget: GameState = 'title';
  private transitionLevel = 0;
  private mouseX = GAME_W / 2;
  private mouseY = GAME_H / 2;
  private scaleX = 1;
  private scaleY = 1;
  private offsetX = 0;
  private offsetY = 0;
  private lastTime = 0;
  private audioInitialized = false;
  private tutorialShown = false;
  private tutorialAlpha = 0;
  private hintsUsed = 0;
  private hintFlashTime = 0;
  private hintClueIndex = -1;

  constructor(canvas: HTMLCanvasElement) {
    this.canvas = canvas;
    this.ctx = canvas.getContext('2d')!;
    canvas.width = GAME_W;
    canvas.height = GAME_H;
    this.loadProgress();
    this.setupInput();
    this.resize();
    window.addEventListener('resize', () => this.resize());
  }

  private resize(): void {
    const w = window.innerWidth;
    const h = window.innerHeight;
    const isPortrait = h > w;
    let scale: number;
    if (isPortrait) {
      scale = w / GAME_W;
    } else {
      scale = Math.min(w / GAME_W, h / GAME_H);
    }
    this.canvas.style.width = `${GAME_W * scale}px`;
    this.canvas.style.height = `${GAME_H * scale}px`;
    this.canvas.style.position = 'absolute';
    this.canvas.style.left = `${(w - GAME_W * scale) / 2}px`;
    this.canvas.style.top = `${Math.max(0, (h - GAME_H * scale) / 2)}px`;
    this.scaleX = scale;
    this.scaleY = scale;
    const rect = this.canvas.getBoundingClientRect();
    this.offsetX = rect.left;
    this.offsetY = rect.top;
  }

  private toGameCoords(clientX: number, clientY: number): { x: number; y: number } {
    return {
      x: (clientX - this.offsetX) / this.scaleX,
      y: (clientY - this.offsetY) / this.scaleY,
    };
  }

  private setupInput(): void {
    const handleMove = (clientX: number, clientY: number) => {
      const coords = this.toGameCoords(clientX, clientY);
      this.mouseX = coords.x;
      this.mouseY = coords.y;
      if (this.state === 'playing') {
        setFlashlightTarget(coords.x, coords.y);
      }
    };

    this.canvas.addEventListener('mousemove', (e) => {
      handleMove(e.clientX, e.clientY);
    });

    this.canvas.addEventListener('touchmove', (e) => {
      e.preventDefault();
      const t = e.touches[0];
      handleMove(t.clientX, t.clientY);
    }, { passive: false });

    this.canvas.addEventListener('touchstart', (e) => {
      e.preventDefault();
      const t = e.touches[0];
      handleMove(t.clientX, t.clientY);
      this.handleClick(this.mouseX, this.mouseY);
    }, { passive: false });

    this.canvas.addEventListener('click', (e) => {
      const coords = this.toGameCoords(e.clientX, e.clientY);
      this.handleClick(coords.x, coords.y);
    });
  }

  private initAudioOnce(): void {
    if (!this.audioInitialized) {
      this.audioInitialized = true;
      initAudio();
    }
  }

  private handleClick(mx: number, my: number): void {
    this.initAudioOnce();

    switch (this.state) {
      case 'title': {
        const btn = getTitlePlayButton();
        if (mx >= btn.x && mx <= btn.x + btn.w && my >= btn.y && my <= btn.y + btn.h) {
          playClick();
          this.startTransition('level-select');
        }
        break;
      }

      case 'level-select': {
        const result = getLevelSelectClick(mx, my, this.levelProgress);
        if (result === 'back') {
          playClick();
          this.startTransition('title');
        } else if (result !== null) {
          playClick();
          this.transitionLevel = result;
          this.startTransition('playing');
        }
        break;
      }

      case 'playing': {
        if (!this.currentScene) break;

        // Exit button (top-left, 40x40)
        if (mx >= 15 && mx <= 55 && my >= 15 && my <= 55) {
          playClick();
          this.startTransition('level-select');
          break;
        }

        // Hint button (top-right area, 110x36)
        if (mx >= GAME_W - 125 && mx <= GAME_W - 15 && my >= 15 && my <= 51) {
          this.useHint();
          break;
        }

        const flashPos = getFlashlightPos();
        const dist = Math.sqrt((mx - flashPos.x) ** 2 + (my - flashPos.y) ** 2);

        // Only allow clicks within flashlight radius
        if (dist > FLASHLIGHT.outerRadius * 0.7) break;

        let foundClue = false;
        for (const clue of this.currentScene.clues) {
          if (clue.found) continue;
          const clueDist = Math.sqrt((mx - clue.x) ** 2 + (my - clue.y) ** 2);
          if (clueDist <= clue.radius + 10) {
            clue.found = true;
            foundClue = true;
            spawnDiscoveryBurst(clue.x, clue.y);
            playDiscoveryChime();

            // Check if all clues found
            if (this.currentScene.clues.every(c => c.found)) {
              this.onCaseSolved();
            }
            break;
          }
        }

        if (!foundClue) {
          // Check if click was on any interactive area at all
          let nearClue = false;
          for (const clue of this.currentScene.clues) {
            if (clue.found) continue;
            const clueDist = Math.sqrt((mx - clue.x) ** 2 + (my - clue.y) ** 2);
            if (clueDist < 60) nearClue = true;
          }
          if (!nearClue) {
            this.wrongClicks++;
            playWrongClick();
          }
        }
        break;
      }

      case 'case-solved': {
        const btn = getCaseSolvedButton();
        if (mx >= btn.x && mx <= btn.x + btn.w && my >= btn.y && my <= btn.y + btn.h) {
          playClick();
          this.startTransition('level-select');
        }
        break;
      }
    }
  }

  private startTransition(target: GameState): void {
    this.state = 'transition';
    this.transitionTarget = target;
    this.transitionAlpha = 0;
  }

  private updateCursorVisibility(): void {
    if (this.state === 'playing') {
      this.canvas.classList.add('playing');
    } else {
      this.canvas.classList.remove('playing');
    }
  }

  private onCaseSolved(): void {
    const elapsed = (performance.now() - this.levelStartTime) / 1000;
    let score = 100;
    if (elapsed < 60) score += 50;
    else if (elapsed < 120) score += 25;
    if (this.wrongClicks === 0) score += 30;

    let stars = 1;
    if (score >= 150) stars = 3;
    else if (score >= 120) stars = 2;

    const levelId = this.currentLevel + 1;
    const existing = this.levelProgress[levelId];
    if (!existing || score > existing.score) {
      this.levelProgress[levelId] = {
        completed: true,
        stars,
        score,
        bestTime: existing ? Math.min(existing.bestTime, elapsed) : elapsed,
      };
    }

    this.saveProgress();
    this.caseSolvedTime = performance.now();
    playCaseSolved();
    this.state = 'case-solved';
  }

  private useHint(): void {
    if (!this.currentScene) return;
    const unfound = this.currentScene.clues.filter(c => !c.found);
    if (unfound.length === 0) return;

    playClick();
    this.hintsUsed++;
    // Pick a random unfound clue and flash its position
    const clue = unfound[Math.floor(Math.random() * unfound.length)];
    this.hintClueIndex = this.currentScene.clues.indexOf(clue);
    this.hintFlashTime = performance.now();
    // Move flashlight toward the hint
    setFlashlightTarget(clue.x, clue.y);
  }

  private loadLevel(index: number): void {
    this.currentLevel = index;
    this.currentScene = getScene(index);
    this.levelStartTime = performance.now();
    this.wrongClicks = 0;
    this.hintsUsed = 0;
    this.hintFlashTime = 0;
    this.hintClueIndex = -1;
    this.tutorialShown = false;
    this.tutorialAlpha = 0;
    clearParticles();
    setFlashlightTarget(GAME_W / 2, GAME_H / 2);
    playLevelStart();
  }

  private saveProgress(): void {
    const save: GameSave = {
      levels: this.levelProgress,
      totalScore: Object.values(this.levelProgress).reduce((sum, p) => sum + p.score, 0),
    };
    try {
      localStorage.setItem(SAVE_KEY, JSON.stringify(save));
    } catch {
      // Storage full or unavailable
    }
  }

  private loadProgress(): void {
    try {
      const raw = localStorage.getItem(SAVE_KEY);
      if (raw) {
        const save: GameSave = JSON.parse(raw);
        this.levelProgress = save.levels;
      }
    } catch {
      // Corrupted save
    }
  }

  start(): void {
    this.lastTime = performance.now();
    this.loop();
  }

  private loop = (): void => {
    const now = performance.now();
    const dt = Math.min((now - this.lastTime) / 1000, 0.1);
    this.lastTime = now;

    this.update(dt, now);
    this.render(now);
    requestAnimationFrame(this.loop);
  };

  private update(dt: number, now: number): void {
    if (this.state === 'playing') {
      updateFlashlight(dt);
      updateParticles(dt);
      const flashPos = getFlashlightPos();
      spawnDustParticles(flashPos, FLASHLIGHT.innerRadius);

      // Tutorial fade
      if (!this.tutorialShown && now - this.levelStartTime < 4000) {
        this.tutorialAlpha = Math.min(1, (now - this.levelStartTime) / 1000);
        if (now - this.levelStartTime > 3000) {
          this.tutorialAlpha = Math.max(0, 1 - (now - this.levelStartTime - 3000) / 1000);
        }
      } else {
        this.tutorialShown = true;
        this.tutorialAlpha = 0;
      }
    }

    if (this.state === 'transition') {
      this.transitionAlpha += dt * 2.5;
      if (this.transitionAlpha >= 1) {
        this.state = this.transitionTarget;
        if (this.transitionTarget === 'playing') {
          this.loadLevel(this.transitionLevel);
        }
        this.transitionAlpha = 1;
      }
      if (this.transitionAlpha >= 1.8) {
        this.transitionAlpha = 0;
      }
    }
  }

  private render(now: number): void {
    this.updateCursorVisibility();
    const ctx = this.ctx;
    ctx.clearRect(0, 0, GAME_W, GAME_H);

    switch (this.state) {
      case 'title':
        drawTitleScreen(ctx, now);
        break;

      case 'level-select':
        drawLevelSelect(ctx, now, this.levelProgress);
        break;

      case 'playing':
        this.renderPlaying(ctx, now);
        break;

      case 'case-solved':
        this.renderPlaying(ctx, now);
        if (this.currentScene) {
          const elapsed = (now - this.caseSolvedTime) / 1000;
          const progress = this.levelProgress[this.currentLevel + 1];
          drawCaseSolved(
            ctx, now,
            this.currentScene.mystery,
            this.currentScene.solution,
            progress?.score ?? 0,
            progress?.stars ?? 0,
            Math.min(elapsed / 1.5, 1),
          );
        }
        break;

      case 'transition': {
        // Draw current screen underneath
        const fadeOut = this.transitionAlpha < 1;
        if (fadeOut) {
          // Still showing previous screen
          if (this.transitionTarget === 'playing' || this.transitionTarget === 'level-select') {
            if (this.currentScene) {
              this.renderPlaying(ctx, now);
            } else {
              drawTitleScreen(ctx, now);
            }
          } else {
            drawTitleScreen(ctx, now);
          }
        } else {
          // Showing new screen
          if (this.transitionTarget === 'level-select') {
            drawLevelSelect(ctx, now, this.levelProgress);
          } else if (this.transitionTarget === 'title') {
            drawTitleScreen(ctx, now);
          } else if (this.transitionTarget === 'playing' && this.currentScene) {
            this.renderPlaying(ctx, now);
          }
        }
        // Transition overlay
        const alpha = fadeOut ? this.transitionAlpha : 2 - this.transitionAlpha;
        ctx.fillStyle = `rgba(5,5,10,${Math.max(0, alpha)})`;
        ctx.fillRect(0, 0, GAME_W, GAME_H);
        break;
      }
    }
  }

  private renderPlaying(ctx: CanvasRenderingContext2D, now: number): void {
    if (!this.currentScene) return;

    // Draw full scene
    this.currentScene.draw(ctx, now);

    // Draw clue highlights for unfound clues near flashlight
    const flashPos = getFlashlightPos();
    for (const clue of this.currentScene.clues) {
      if (clue.found) continue;
      const dist = Math.sqrt((flashPos.x - clue.x) ** 2 + (flashPos.y - clue.y) ** 2);
      if (dist < FLASHLIGHT.outerRadius * 0.6) {
        drawClueHighlight(ctx, clue.x, clue.y, clue.radius, now);
      }
    }

    // Draw found clue markers
    for (const clue of this.currentScene.clues) {
      if (!clue.found) continue;
      ctx.save();
      ctx.fillStyle = 'rgba(16,185,129,0.15)';
      ctx.beginPath();
      ctx.arc(clue.x, clue.y, clue.radius, 0, Math.PI * 2);
      ctx.fill();
      ctx.restore();
    }

    // Draw particles (before mask so they show in light)
    drawParticles(ctx);

    // Apply darkness mask
    applyDarknessMask(ctx);

    // Draw cursor
    drawFlashlightCursor(ctx);

    // Draw clue bar (over the darkness)
    drawClueBar(ctx, this.currentScene.clues, now);

    // Draw level title briefly
    if (now - this.levelStartTime < 3000) {
      const titleAlpha = now - this.levelStartTime < 1500
        ? Math.min(1, (now - this.levelStartTime) / 500)
        : Math.max(0, 1 - (now - this.levelStartTime - 1500) / 1500);
      ctx.save();
      ctx.globalAlpha = titleAlpha;
      ctx.textAlign = 'center';
      ctx.font = '14px Georgia, serif';
      ctx.fillStyle = 'rgba(124,58,237,0.8)';
      ctx.fillText(this.currentScene.subtitle, GAME_W / 2, 40);
      ctx.font = 'bold 32px Georgia, serif';
      ctx.fillStyle = '#E8D5B7';
      ctx.fillText(this.currentScene.title, GAME_W / 2, 75);
      ctx.font = 'italic 16px Georgia, serif';
      ctx.fillStyle = 'rgba(232,213,183,0.7)';
      ctx.fillText(`"${this.currentScene.mystery}"`, GAME_W / 2, 105);
      ctx.globalAlpha = 1;
      ctx.restore();
    }

    // Tutorial hint (level 1 only)
    if (this.currentLevel === 0 && this.tutorialAlpha > 0) {
      ctx.save();
      ctx.globalAlpha = this.tutorialAlpha * 0.7;
      ctx.textAlign = 'center';
      ctx.font = '14px Georgia, serif';
      ctx.fillStyle = '#E8D5B7';
      ctx.fillText('Muovi il mouse per esplorare. Clicca sugli indizi per raccoglierli.', GAME_W / 2, GAME_H - 90);
      ctx.globalAlpha = 1;
      ctx.restore();
    }

    // Hint flash — draw a pulsing circle around the hinted clue (above darkness)
    if (this.hintClueIndex >= 0 && this.currentScene) {
      const hintElapsed = (now - this.hintFlashTime) / 1000;
      if (hintElapsed < 3) {
        const clue = this.currentScene.clues[this.hintClueIndex];
        if (clue && !clue.found) {
          const pulse = Math.sin(hintElapsed * 6) * 0.3 + 0.5;
          const fade = hintElapsed > 2 ? (3 - hintElapsed) : 1;
          ctx.save();
          ctx.globalAlpha = pulse * fade;
          ctx.strokeStyle = '#FFD700';
          ctx.lineWidth = 2;
          ctx.shadowColor = '#FFD700';
          ctx.shadowBlur = 15;
          ctx.beginPath();
          ctx.arc(clue.x, clue.y, clue.radius + 10 + Math.sin(hintElapsed * 4) * 5, 0, Math.PI * 2);
          ctx.stroke();
          ctx.restore();
        }
      } else {
        this.hintClueIndex = -1;
      }
    }

    // UI Buttons (rendered above darkness mask)
    if (this.state === 'playing') {
      // Exit button — top left
      ctx.save();
      ctx.fillStyle = 'rgba(20,20,30,0.7)';
      ctx.beginPath();
      ctx.arc(35, 35, 20, 0, Math.PI * 2);
      ctx.fill();
      ctx.strokeStyle = 'rgba(200,200,220,0.4)';
      ctx.lineWidth = 1.5;
      ctx.stroke();
      // X icon
      ctx.strokeStyle = 'rgba(200,200,220,0.7)';
      ctx.lineWidth = 2;
      ctx.beginPath();
      ctx.moveTo(28, 28); ctx.lineTo(42, 42);
      ctx.moveTo(42, 28); ctx.lineTo(28, 42);
      ctx.stroke();
      ctx.restore();

      // Hint button — top right
      const unfound = this.currentScene.clues.filter(c => !c.found).length;
      ctx.save();
      ctx.fillStyle = 'rgba(20,20,30,0.7)';
      roundRect(ctx, GAME_W - 125, 15, 110, 36, 18);
      ctx.fill();
      ctx.strokeStyle = unfound > 0 ? 'rgba(255,215,0,0.5)' : 'rgba(100,100,120,0.3)';
      ctx.lineWidth = 1.5;
      roundRect(ctx, GAME_W - 125, 15, 110, 36, 18);
      ctx.stroke();
      // Lightbulb icon
      ctx.font = '14px Georgia, serif';
      ctx.textAlign = 'center';
      ctx.fillStyle = unfound > 0 ? 'rgba(255,215,0,0.8)' : 'rgba(100,100,120,0.5)';
      ctx.fillText('💡 Indizio', GAME_W - 70, 38);
      ctx.restore();

      // Timer — bottom right
      const elapsed = Math.floor((now - this.levelStartTime) / 1000);
      const mins = Math.floor(elapsed / 60);
      const secs = elapsed % 60;
      ctx.save();
      ctx.textAlign = 'right';
      ctx.font = '14px Georgia, serif';
      ctx.fillStyle = 'rgba(200,200,220,0.5)';
      ctx.fillText(`${mins}:${secs.toString().padStart(2, '0')}`, GAME_W - 20, GAME_H - 75);
      ctx.restore();
    }
  }
}
