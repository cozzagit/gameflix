// ─── Main Game Class — State Machine with 3-Phase Investigation ──────

import {
  type GameState, type PlayingPhase, type SceneData, type Clue,
  type LevelProgress, type GameSave,
  GAME_W, GAME_H, FLASHLIGHT,
} from './types';
import { getScene, TOTAL_LEVELS } from './scenes/index';
import { setFlashlightTarget, updateFlashlight, applyDarknessMask, drawFlashlightCursor, getFlashlightPos } from './flashlight';
import { spawnDustParticles, spawnDiscoveryBurst, updateParticles, drawParticles, clearParticles } from './effects';
import { drawClueBar } from './clue-bar';
import { drawClueHighlight, drawTextShadow, roundRect } from './renderer';
import { drawTitleScreen, getTitlePlayButton, drawLevelSelect, getLevelSelectClick, drawCaseSolved, getCaseSolvedButton } from './screens';
import {
  playDiscoveryChime, playCaseSolved, playClick, playWrongClick,
  playLevelStart, initAudio, playConnectionCorrect, playConnectionWrong,
  playCorrectAnswer, playWrongAnswer, playPhaseTransition,
} from './audio';
import {
  initClueBoard, updateClueBoard, handleClueBoardMouseMove,
  handleClueBoardClick, drawClueBoard, isAllConnectionsMade,
} from './clue-board';

const SAVE_KEY = 'ombre_save';

export class Game {
  private canvas: HTMLCanvasElement;
  private ctx: CanvasRenderingContext2D;
  private state: GameState = 'title';
  private phase: PlayingPhase = 'intro';
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

  // Phase-specific state
  private cluePopupClue: Clue | null = null;
  private cluePopupAlpha = 0;
  private phaseTransitionAlpha = 0;
  private phaseTransitionTarget: PlayingPhase | null = null;
  private deductionSelectedIndex = -1;
  private deductionFeedback: string | null = null;
  private deductionFeedbackIsCorrect = false;
  private deductionFeedbackAlpha = 0;
  private solvedNarrativeAlpha = 0;
  private introTextAlpha = 0;
  private wrongDeductions = 0;

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
      if (this.state === 'playing' && this.phase === 'explore') {
        setFlashlightTarget(coords.x, coords.y);
      }
      if (this.state === 'playing' && this.phase === 'connect') {
        handleClueBoardMouseMove(coords.x, coords.y);
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
        this.handlePlayingClick(mx, my);
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

  private handlePlayingClick(mx: number, my: number): void {
    if (!this.currentScene) return;

    // Exit button (top-left, 40x40) — available in all phases
    if (mx >= 15 && mx <= 55 && my >= 15 && my <= 55) {
      playClick();
      this.startTransition('level-select');
      return;
    }

    switch (this.phase) {
      case 'intro':
        this.handleIntroClick(mx, my);
        break;
      case 'explore':
        this.handleExploreClick(mx, my);
        break;
      case 'clue-popup':
        this.handleCluePopupClick(mx, my);
        break;
      case 'connect':
        this.handleConnectClick(mx, my);
        break;
      case 'deduce':
        this.handleDeduceClick(mx, my);
        break;
      case 'solved':
        this.handleSolvedClick(mx, my);
        break;
    }
  }

  private handleIntroClick(mx: number, my: number): void {
    // "Inizia indagine" button
    const btnW = 280, btnH = 55;
    const btnX = GAME_W / 2 - btnW / 2, btnY = 550;
    if (mx >= btnX && mx <= btnX + btnW && my >= btnY && my <= btnY + btnH) {
      playClick();
      playLevelStart();
      this.startPhaseTransition('explore');
    }
  }

  private handleExploreClick(mx: number, my: number): void {
    if (!this.currentScene) return;

    // Hint button
    if (mx >= GAME_W - 125 && mx <= GAME_W - 15 && my >= 15 && my <= 51) {
      this.useHint();
      return;
    }

    const flashPos = getFlashlightPos();
    const dist = Math.sqrt((mx - flashPos.x) ** 2 + (my - flashPos.y) ** 2);
    if (dist > FLASHLIGHT.outerRadius * 0.7) return;

    let foundClue = false;
    for (const clue of this.currentScene.clues) {
      if (clue.found) continue;
      const clueDist = Math.sqrt((mx - clue.x) ** 2 + (my - clue.y) ** 2);
      if (clueDist <= clue.radius + 10) {
        clue.found = true;
        foundClue = true;
        spawnDiscoveryBurst(clue.x, clue.y);
        playDiscoveryChime();

        // Show clue popup
        this.cluePopupClue = clue;
        this.cluePopupAlpha = 0;
        this.phase = 'clue-popup';

        break;
      }
    }

    if (!foundClue) {
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
  }

  private handleCluePopupClick(_mx: number, _my: number): void {
    // Any click dismisses the popup
    if (this.cluePopupAlpha >= 0.8) {
      playClick();
      this.cluePopupClue = null;
      this.cluePopupAlpha = 0;

      // Check if all clues found — transition to connect phase
      if (this.currentScene && this.currentScene.clues.every(c => c.found)) {
        playPhaseTransition();
        this.startPhaseTransition('connect');
      } else {
        this.phase = 'explore';
      }
    }
  }

  private handleConnectClick(mx: number, my: number): void {
    if (!this.currentScene) return;

    const result = handleClueBoardClick(mx, my, this.currentScene.requiredConnections);
    if (result === 'connection-correct') {
      playConnectionCorrect();
    } else if (result === 'connection-wrong') {
      playConnectionWrong();
    } else if (result === 'all-done') {
      playConnectionCorrect();
      // Short delay then transition to deduction
      setTimeout(() => {
        playPhaseTransition();
        this.startPhaseTransition('deduce');
      }, 800);
    }
  }

  private handleDeduceClick(mx: number, my: number): void {
    if (!this.currentScene) return;

    // If showing feedback, click to dismiss
    if (this.deductionFeedback !== null && this.deductionFeedbackAlpha >= 0.8) {
      playClick();
      if (this.deductionFeedbackIsCorrect) {
        // Move to solved phase
        this.startPhaseTransition('solved');
      } else {
        this.deductionFeedback = null;
        this.deductionFeedbackAlpha = 0;
        this.deductionSelectedIndex = -1;
      }
      return;
    }

    // Check option buttons — must match renderDeduce layout
    const options = this.currentScene.deductionOptions;
    const startY = 230;
    const optW = 700, optH = 50;
    const optX = GAME_W / 2 - optW / 2;

    for (let i = 0; i < options.length; i++) {
      const optY = startY + i * (optH + 12);
      if (mx >= optX && mx <= optX + optW && my >= optY && my <= optY + optH) {
        this.deductionSelectedIndex = i;
        const option = options[i];

        if (option.correct) {
          playCorrectAnswer();
          this.deductionFeedback = option.explanation;
          this.deductionFeedbackIsCorrect = true;
          this.deductionFeedbackAlpha = 0;
        } else {
          playWrongAnswer();
          this.wrongDeductions++;
          this.deductionFeedback = option.explanation;
          this.deductionFeedbackIsCorrect = false;
          this.deductionFeedbackAlpha = 0;
        }
        break;
      }
    }
  }

  private handleSolvedClick(mx: number, my: number): void {
    // "Continua" button at the bottom of the narrative
    const btnW = 240, btnH = 50;
    const btnX = GAME_W / 2 - btnW / 2, btnY = 650;
    if (mx >= btnX && mx <= btnX + btnW && my >= btnY && my <= btnY + btnH) {
      if (this.solvedNarrativeAlpha >= 0.8) {
        playClick();
        this.onCaseSolved();
      }
    }
  }

  private startPhaseTransition(target: PlayingPhase): void {
    this.phaseTransitionAlpha = 0;
    this.phaseTransitionTarget = target;
  }

  private applyPhaseTransition(target: PlayingPhase): void {
    this.phase = target;
    this.phaseTransitionTarget = null;
    this.phaseTransitionAlpha = 0;

    if (target === 'connect' && this.currentScene) {
      initClueBoard(this.currentScene.clues);
    }
    if (target === 'deduce') {
      this.deductionSelectedIndex = -1;
      this.deductionFeedback = null;
      this.deductionFeedbackAlpha = 0;
    }
    if (target === 'solved') {
      this.solvedNarrativeAlpha = 0;
    }
    if (target === 'explore') {
      this.levelStartTime = performance.now();
    }
  }

  private startTransition(target: GameState): void {
    this.state = 'transition';
    this.transitionTarget = target;
    this.transitionAlpha = 0;
  }

  private updateCursorVisibility(): void {
    if (this.state === 'playing' && this.phase === 'explore') {
      this.canvas.classList.add('playing');
    } else {
      this.canvas.classList.remove('playing');
    }
  }

  private onCaseSolved(): void {
    const elapsed = (performance.now() - this.levelStartTime) / 1000;
    let score = 100;
    if (elapsed < 120) score += 50;
    else if (elapsed < 240) score += 25;
    if (this.wrongClicks <= 2) score += 20;
    if (this.wrongDeductions === 0) score += 30;

    let stars = 1;
    if (score >= 170) stars = 3;
    else if (score >= 140) stars = 2;

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
    const clue = unfound[Math.floor(Math.random() * unfound.length)];
    this.hintClueIndex = this.currentScene.clues.indexOf(clue);
    this.hintFlashTime = performance.now();
    setFlashlightTarget(clue.x, clue.y);
  }

  private loadLevel(index: number): void {
    this.currentLevel = index;
    this.currentScene = getScene(index);
    this.levelStartTime = performance.now();
    this.wrongClicks = 0;
    this.wrongDeductions = 0;
    this.hintsUsed = 0;
    this.hintFlashTime = 0;
    this.hintClueIndex = -1;
    this.tutorialShown = false;
    this.tutorialAlpha = 0;
    this.introTextAlpha = 0;
    this.phase = 'intro';
    this.cluePopupClue = null;
    this.cluePopupAlpha = 0;
    this.phaseTransitionTarget = null;
    this.phaseTransitionAlpha = 0;
    this.deductionSelectedIndex = -1;
    this.deductionFeedback = null;
    this.deductionFeedbackAlpha = 0;
    this.solvedNarrativeAlpha = 0;
    clearParticles();
    setFlashlightTarget(GAME_W / 2, GAME_H / 2);
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
      // Phase transition
      if (this.phaseTransitionTarget !== null) {
        this.phaseTransitionAlpha += dt * 2.0;
        if (this.phaseTransitionAlpha >= 1) {
          this.applyPhaseTransition(this.phaseTransitionTarget);
        }
      }

      if (this.phase === 'explore') {
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
        } else if (this.phase === 'explore') {
          this.tutorialShown = true;
          this.tutorialAlpha = 0;
        }
      }

      if (this.phase === 'clue-popup') {
        this.cluePopupAlpha = Math.min(1, this.cluePopupAlpha + dt * 3);
        // Keep flashlight and particles updating
        updateFlashlight(dt);
        updateParticles(dt);
      }

      if (this.phase === 'connect') {
        updateClueBoard(dt);
      }

      if (this.phase === 'intro') {
        this.introTextAlpha = Math.min(1, this.introTextAlpha + dt * 1.5);
      }

      if (this.phase === 'deduce') {
        if (this.deductionFeedback !== null) {
          this.deductionFeedbackAlpha = Math.min(1, this.deductionFeedbackAlpha + dt * 2.5);
        }
      }

      if (this.phase === 'solved') {
        this.solvedNarrativeAlpha = Math.min(1, this.solvedNarrativeAlpha + dt * 1.2);
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
        if (this.currentScene) {
          const elapsed = (now - this.caseSolvedTime) / 1000;
          const progress = this.levelProgress[this.currentLevel + 1];
          // Draw dark bg
          ctx.fillStyle = '#06060A';
          ctx.fillRect(0, 0, GAME_W, GAME_H);
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
        const fadeOut = this.transitionAlpha < 1;
        if (fadeOut) {
          if (this.transitionTarget === 'playing' || this.transitionTarget === 'level-select') {
            if (this.currentScene && this.state !== 'transition') {
              this.renderPlaying(ctx, now);
            } else if (this.phase === 'intro' && this.currentScene) {
              this.renderPlaying(ctx, now);
            } else {
              drawTitleScreen(ctx, now);
            }
          } else {
            drawTitleScreen(ctx, now);
          }
        } else {
          if (this.transitionTarget === 'level-select') {
            drawLevelSelect(ctx, now, this.levelProgress);
          } else if (this.transitionTarget === 'title') {
            drawTitleScreen(ctx, now);
          } else if (this.transitionTarget === 'playing' && this.currentScene) {
            this.renderPlaying(ctx, now);
          }
        }
        const alpha = fadeOut ? this.transitionAlpha : 2 - this.transitionAlpha;
        ctx.fillStyle = `rgba(5,5,10,${Math.max(0, alpha)})`;
        ctx.fillRect(0, 0, GAME_W, GAME_H);
        break;
      }
    }
  }

  private renderPlaying(ctx: CanvasRenderingContext2D, now: number): void {
    if (!this.currentScene) return;

    switch (this.phase) {
      case 'intro':
        this.renderIntro(ctx, now);
        break;
      case 'explore':
      case 'clue-popup':
        this.renderExplore(ctx, now);
        if (this.phase === 'clue-popup') {
          this.renderCluePopup(ctx);
        }
        break;
      case 'connect':
        this.renderConnect(ctx, now);
        break;
      case 'deduce':
        this.renderDeduce(ctx, now);
        break;
      case 'solved':
        this.renderSolved(ctx, now);
        break;
    }

    // Phase transition overlay
    if (this.phaseTransitionTarget !== null) {
      const alpha = this.phaseTransitionAlpha < 0.5
        ? this.phaseTransitionAlpha * 2
        : (1 - this.phaseTransitionAlpha) * 2;
      ctx.fillStyle = `rgba(5,5,10,${Math.max(0, alpha)})`;
      ctx.fillRect(0, 0, GAME_W, GAME_H);
    }

    // Exit button — always visible
    this.renderExitButton(ctx);
  }

  private renderIntro(ctx: CanvasRenderingContext2D, now: number): void {
    if (!this.currentScene) return;
    const alpha = this.introTextAlpha;

    // Dark parchment background
    const bg = ctx.createRadialGradient(GAME_W / 2, GAME_H / 2 - 50, 100, GAME_W / 2, GAME_H / 2, 600);
    bg.addColorStop(0, '#1E1828');
    bg.addColorStop(0.5, '#110E18');
    bg.addColorStop(1, '#06060A');
    ctx.fillStyle = bg;
    ctx.fillRect(0, 0, GAME_W, GAME_H);

    // Atmospheric particles
    ctx.fillStyle = 'rgba(255,245,224,0.05)';
    for (let i = 0; i < 30; i++) {
      const px = (Math.sin(now * 0.0003 + i * 1.7) * 0.5 + 0.5) * GAME_W;
      const py = (Math.cos(now * 0.0004 + i * 2.3) * 0.5 + 0.5) * GAME_H;
      ctx.beginPath();
      ctx.arc(px, py, 1, 0, Math.PI * 2);
      ctx.fill();
    }

    ctx.save();
    ctx.globalAlpha = alpha;

    // Decorative frame
    ctx.strokeStyle = 'rgba(124,58,237,0.3)';
    ctx.lineWidth = 1;
    roundRect(ctx, 150, 100, GAME_W - 300, 500, 15);
    ctx.stroke();

    // Subtitle
    ctx.textAlign = 'center';
    ctx.font = '14px Georgia, serif';
    ctx.fillStyle = 'rgba(124,58,237,0.8)';
    ctx.fillText(this.currentScene.subtitle, GAME_W / 2, 150);

    // Title
    ctx.font = 'bold 36px Georgia, serif';
    ctx.fillStyle = '#E8D5B7';
    ctx.fillText(this.currentScene.title, GAME_W / 2, 200);

    // Decorative line
    ctx.strokeStyle = 'rgba(232,213,183,0.3)';
    ctx.lineWidth = 1;
    ctx.beginPath();
    ctx.moveTo(GAME_W / 2 - 150, 220);
    ctx.lineTo(GAME_W / 2 + 150, 220);
    ctx.stroke();

    // Story intro text (word wrapped)
    ctx.font = '18px Georgia, serif';
    ctx.fillStyle = 'rgba(232,213,183,0.9)';
    this.wrapText(ctx, this.currentScene.storyIntro, GAME_W / 2, 270, GAME_W - 400, 28);

    // Mystery question
    ctx.font = 'italic 20px Georgia, serif';
    ctx.fillStyle = 'rgba(124,58,237,0.9)';
    ctx.fillText(`"${this.currentScene.mystery}"`, GAME_W / 2, 430);

    // Phase indicator
    ctx.font = '14px Georgia, serif';
    ctx.fillStyle = 'rgba(200,200,220,0.5)';
    ctx.fillText('Fase 1: ESPLORA  \u2192  Fase 2: COLLEGA  \u2192  Fase 3: DEDUCI', GAME_W / 2, 490);

    // "Inizia indagine" button
    const btnW = 280, btnH = 55;
    const btnX = GAME_W / 2 - btnW / 2, btnY = 550;
    ctx.shadowColor = 'rgba(124,58,237,0.5)';
    ctx.shadowBlur = 20;
    ctx.fillStyle = 'rgba(124,58,237,0.35)';
    roundRect(ctx, btnX, btnY, btnW, btnH, 12);
    ctx.fill();
    ctx.shadowBlur = 0;
    ctx.strokeStyle = 'rgba(180,130,255,0.8)';
    ctx.lineWidth = 2;
    roundRect(ctx, btnX, btnY, btnW, btnH, 12);
    ctx.stroke();
    ctx.font = 'bold 22px Georgia, serif';
    ctx.fillStyle = '#E8D5B7';
    ctx.fillText('INIZIA INDAGINE', GAME_W / 2, btnY + 36);

    ctx.globalAlpha = 1;
    ctx.restore();
  }

  private renderExplore(ctx: CanvasRenderingContext2D, now: number): void {
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

    // Draw particles
    drawParticles(ctx);

    // Apply darkness mask
    applyDarknessMask(ctx);

    // Draw cursor
    drawFlashlightCursor(ctx);

    // Draw clue bar
    drawClueBar(ctx, this.currentScene.clues, now);

    // Phase indicator (top center)
    ctx.save();
    ctx.textAlign = 'center';
    ctx.font = 'bold 14px Georgia, serif';
    ctx.fillStyle = 'rgba(124,58,237,0.6)';
    ctx.fillText('FASE 1: ESPLORA', GAME_W / 2, 25);
    ctx.restore();

    // Level title briefly
    if (now - this.levelStartTime < 3000) {
      const titleAlpha = now - this.levelStartTime < 1500
        ? Math.min(1, (now - this.levelStartTime) / 500)
        : Math.max(0, 1 - (now - this.levelStartTime - 1500) / 1500);
      ctx.save();
      ctx.globalAlpha = titleAlpha;
      ctx.textAlign = 'center';
      ctx.font = 'bold 28px Georgia, serif';
      ctx.fillStyle = '#E8D5B7';
      ctx.fillText(this.currentScene.title, GAME_W / 2, 65);
      ctx.font = 'italic 16px Georgia, serif';
      ctx.fillStyle = 'rgba(232,213,183,0.7)';
      ctx.fillText(`"${this.currentScene.mystery}"`, GAME_W / 2, 95);
      ctx.globalAlpha = 1;
      ctx.restore();
    }

    // Tutorial hint
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

    // Hint flash
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

    // Hint button
    if (this.phase === 'explore') {
      const unfound = this.currentScene.clues.filter(c => !c.found).length;
      ctx.save();
      ctx.fillStyle = 'rgba(20,20,30,0.7)';
      roundRect(ctx, GAME_W - 125, 15, 110, 36, 18);
      ctx.fill();
      ctx.strokeStyle = unfound > 0 ? 'rgba(255,215,0,0.5)' : 'rgba(100,100,120,0.3)';
      ctx.lineWidth = 1.5;
      roundRect(ctx, GAME_W - 125, 15, 110, 36, 18);
      ctx.stroke();
      ctx.font = '14px Georgia, serif';
      ctx.textAlign = 'center';
      ctx.fillStyle = unfound > 0 ? 'rgba(255,215,0,0.8)' : 'rgba(100,100,120,0.5)';
      ctx.fillText('\uD83D\uDCA1 Indizio', GAME_W - 70, 38);
      ctx.restore();

      // Timer
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

  private renderCluePopup(ctx: CanvasRenderingContext2D): void {
    if (!this.cluePopupClue) return;
    const alpha = this.cluePopupAlpha;

    ctx.save();
    ctx.globalAlpha = alpha;

    // Semi-transparent overlay
    ctx.fillStyle = 'rgba(5,5,10,0.5)';
    ctx.fillRect(0, 0, GAME_W, GAME_H);

    // Popup card
    const cardW = 500, cardH = 180;
    const cardX = GAME_W / 2 - cardW / 2;
    const cardY = GAME_H / 2 - cardH / 2;

    // Card background with glow
    ctx.shadowColor = 'rgba(255,215,0,0.3)';
    ctx.shadowBlur = 20;
    ctx.fillStyle = 'rgba(25,25,40,0.95)';
    roundRect(ctx, cardX, cardY, cardW, cardH, 12);
    ctx.fill();
    ctx.shadowBlur = 0;

    // Gold border
    ctx.strokeStyle = 'rgba(255,215,0,0.6)';
    ctx.lineWidth = 2;
    roundRect(ctx, cardX, cardY, cardW, cardH, 12);
    ctx.stroke();

    // "INDIZIO TROVATO" header
    ctx.textAlign = 'center';
    ctx.font = 'bold 14px Georgia, serif';
    ctx.fillStyle = '#FFD700';
    ctx.fillText('INDIZIO TROVATO', GAME_W / 2, cardY + 30);

    // Clue name
    ctx.font = 'bold 22px Georgia, serif';
    ctx.fillStyle = '#E8D5B7';
    ctx.fillText(this.cluePopupClue.name, GAME_W / 2, cardY + 65);

    // Decorative line
    ctx.strokeStyle = 'rgba(255,215,0,0.3)';
    ctx.lineWidth = 1;
    ctx.beginPath();
    ctx.moveTo(cardX + 50, cardY + 78);
    ctx.lineTo(cardX + cardW - 50, cardY + 78);
    ctx.stroke();

    // Description
    ctx.font = '16px Georgia, serif';
    ctx.fillStyle = 'rgba(232,213,183,0.9)';
    this.wrapText(ctx, this.cluePopupClue.description, GAME_W / 2, cardY + 105, cardW - 60, 22);

    // "Clicca per continuare"
    const pulse = 0.4 + Math.sin(performance.now() * 0.004) * 0.3;
    ctx.font = 'italic 13px Georgia, serif';
    ctx.fillStyle = `rgba(200,200,220,${pulse})`;
    ctx.fillText('Clicca per continuare', GAME_W / 2, cardY + cardH - 15);

    ctx.globalAlpha = 1;
    ctx.restore();
  }

  private renderConnect(ctx: CanvasRenderingContext2D, now: number): void {
    if (!this.currentScene) return;
    drawClueBoard(ctx, now, this.currentScene.requiredConnections.length);

    // Phase indicator
    ctx.save();
    ctx.textAlign = 'center';
    ctx.font = 'bold 14px Georgia, serif';
    ctx.fillStyle = 'rgba(34,197,94,0.6)';
    ctx.fillText('FASE 2: COLLEGA', GAME_W / 2, 25);
    ctx.restore();
  }

  private renderDeduce(ctx: CanvasRenderingContext2D, now: number): void {
    if (!this.currentScene) return;

    // Dark background
    ctx.fillStyle = '#0E0C14';
    ctx.fillRect(0, 0, GAME_W, GAME_H);

    // Atmospheric particles
    ctx.fillStyle = 'rgba(255,245,224,0.03)';
    for (let i = 0; i < 15; i++) {
      const px = (Math.sin(now * 0.0003 + i * 1.7) * 0.5 + 0.5) * GAME_W;
      const py = (Math.cos(now * 0.0004 + i * 2.3) * 0.5 + 0.5) * GAME_H;
      ctx.beginPath();
      ctx.arc(px, py, 1, 0, Math.PI * 2);
      ctx.fill();
    }

    // Phase indicator
    ctx.save();
    ctx.textAlign = 'center';
    ctx.font = 'bold 14px Georgia, serif';
    ctx.fillStyle = 'rgba(230,57,70,0.6)';
    ctx.fillText('FASE 3: DEDUCI', GAME_W / 2, 25);
    ctx.restore();

    // "FASE FINALE" title
    ctx.textAlign = 'center';
    ctx.font = 'bold 28px Georgia, serif';
    ctx.fillStyle = '#E8D5B7';
    ctx.fillText('DEDUCI LA SOLUZIONE', GAME_W / 2, 80);

    // Decorative line
    ctx.strokeStyle = 'rgba(232,213,183,0.3)';
    ctx.lineWidth = 1;
    ctx.beginPath();
    ctx.moveTo(GAME_W / 2 - 200, 95);
    ctx.lineTo(GAME_W / 2 + 200, 95);
    ctx.stroke();

    // Question
    ctx.font = 'italic 22px Georgia, serif';
    ctx.fillStyle = 'rgba(124,58,237,0.9)';
    ctx.fillText(this.currentScene.deductionQuestion, GAME_W / 2, 150);

    // Instructions
    ctx.font = '14px Georgia, serif';
    ctx.fillStyle = 'rgba(200,200,220,0.5)';
    ctx.fillText('Basandoti sugli indizi raccolti e i collegamenti trovati, scegli la risposta corretta:', GAME_W / 2, 190);

    // Options
    const options = this.currentScene.deductionOptions;
    const startY = 230;
    const optW = 700, optH = 50;
    const optX = GAME_W / 2 - optW / 2;

    for (let i = 0; i < options.length; i++) {
      const optY = startY + i * (optH + 12);
      const isSelected = this.deductionSelectedIndex === i;
      const isHovered = this.mouseX >= optX && this.mouseX <= optX + optW &&
                        this.mouseY >= optY && this.mouseY <= optY + optH;

      ctx.save();

      // Option background
      let bgColor = 'rgba(30,28,40,0.8)';
      let borderColor = 'rgba(74,72,104,0.5)';
      if (isSelected && this.deductionFeedbackIsCorrect) {
        bgColor = 'rgba(34,197,94,0.2)';
        borderColor = 'rgba(34,197,94,0.8)';
      } else if (isSelected && !this.deductionFeedbackIsCorrect) {
        bgColor = 'rgba(239,68,68,0.2)';
        borderColor = 'rgba(239,68,68,0.8)';
      } else if (isHovered && this.deductionFeedback === null) {
        bgColor = 'rgba(40,38,55,0.9)';
        borderColor = 'rgba(124,58,237,0.6)';
      }

      ctx.fillStyle = bgColor;
      roundRect(ctx, optX, optY, optW, optH, 8);
      ctx.fill();

      ctx.strokeStyle = borderColor;
      ctx.lineWidth = 1.5;
      roundRect(ctx, optX, optY, optW, optH, 8);
      ctx.stroke();

      // Letter (A, B, C, D)
      ctx.font = 'bold 18px Georgia, serif';
      ctx.textAlign = 'center';
      ctx.fillStyle = isHovered || isSelected ? '#E8D5B7' : 'rgba(200,200,220,0.6)';
      ctx.fillText(String.fromCharCode(65 + i), optX + 30, optY + 33);

      // Option text
      ctx.font = '17px Georgia, serif';
      ctx.textAlign = 'left';
      ctx.fillStyle = isHovered || isSelected ? '#E8D5B7' : 'rgba(200,200,220,0.8)';
      ctx.fillText(options[i].text, optX + 60, optY + 33);

      ctx.restore();
    }

    // Feedback overlay
    if (this.deductionFeedback !== null && this.deductionFeedbackAlpha > 0) {
      ctx.save();
      ctx.globalAlpha = this.deductionFeedbackAlpha;

      const fbY = startY + options.length * (optH + 12) + 20;
      const fbW = 700, fbH = 120;
      const fbX = GAME_W / 2 - fbW / 2;

      ctx.fillStyle = this.deductionFeedbackIsCorrect
        ? 'rgba(20,60,30,0.95)'
        : 'rgba(60,20,20,0.95)';
      roundRect(ctx, fbX, fbY, fbW, fbH, 10);
      ctx.fill();

      ctx.strokeStyle = this.deductionFeedbackIsCorrect ? '#22C55E' : '#EF4444';
      ctx.lineWidth = 2;
      roundRect(ctx, fbX, fbY, fbW, fbH, 10);
      ctx.stroke();

      // Header
      ctx.textAlign = 'center';
      ctx.font = 'bold 18px Georgia, serif';
      ctx.fillStyle = this.deductionFeedbackIsCorrect ? '#22C55E' : '#EF4444';
      ctx.fillText(
        this.deductionFeedbackIsCorrect ? 'CORRETTO!' : 'SBAGLIATO',
        GAME_W / 2, fbY + 30,
      );

      // Explanation
      ctx.font = '14px Georgia, serif';
      ctx.fillStyle = 'rgba(232,213,183,0.9)';
      this.wrapText(ctx, this.deductionFeedback, GAME_W / 2, fbY + 55, fbW - 40, 20);

      // Continue hint
      const pulse = 0.4 + Math.sin(performance.now() * 0.004) * 0.3;
      ctx.font = 'italic 12px Georgia, serif';
      ctx.fillStyle = `rgba(200,200,220,${pulse})`;
      ctx.fillText('Clicca per continuare', GAME_W / 2, fbY + fbH - 12);

      ctx.globalAlpha = 1;
      ctx.restore();
    }
  }

  private renderSolved(ctx: CanvasRenderingContext2D, now: number): void {
    if (!this.currentScene) return;
    const alpha = this.solvedNarrativeAlpha;

    // Dark background
    ctx.fillStyle = '#06060A';
    ctx.fillRect(0, 0, GAME_W, GAME_H);

    ctx.save();
    ctx.globalAlpha = alpha;

    // Gold frame
    const fX = 150, fY = 80, fW = GAME_W - 300, fH = 550;
    ctx.strokeStyle = '#FFD700';
    ctx.lineWidth = 2;
    roundRect(ctx, fX, fY, fW, fH, 15);
    ctx.stroke();

    // Inner background
    ctx.fillStyle = 'rgba(15,15,25,0.95)';
    roundRect(ctx, fX + 5, fY + 5, fW - 10, fH - 10, 12);
    ctx.fill();

    // "MISTERO RISOLTO"
    const pulse = 0.8 + Math.sin(now * 0.003) * 0.2;
    ctx.textAlign = 'center';
    ctx.font = 'bold 38px Georgia, serif';
    ctx.fillStyle = `rgba(255,215,0,${pulse})`;
    ctx.fillText('MISTERO RISOLTO', GAME_W / 2, fY + 60);

    // Decorative line
    ctx.strokeStyle = 'rgba(255,215,0,0.3)';
    ctx.lineWidth = 1;
    ctx.beginPath();
    ctx.moveTo(fX + 80, fY + 80);
    ctx.lineTo(fX + fW - 80, fY + 80);
    ctx.stroke();

    // Question
    ctx.font = 'italic 18px Georgia, serif';
    ctx.fillStyle = 'rgba(124,58,237,0.8)';
    ctx.fillText(`"${this.currentScene.mystery}"`, GAME_W / 2, fY + 115);

    // Solution narrative
    ctx.font = '16px Georgia, serif';
    ctx.fillStyle = '#E8D5B7';
    this.wrapText(ctx, this.currentScene.solutionNarrative, GAME_W / 2, fY + 160, fW - 100, 26);

    // "Continua" button
    if (alpha >= 0.8) {
      const btnW = 240, btnH = 50;
      const btnX = GAME_W / 2 - btnW / 2, btnY = 650;
      ctx.fillStyle = 'rgba(124,58,237,0.2)';
      roundRect(ctx, btnX, btnY, btnW, btnH, 8);
      ctx.fill();
      ctx.strokeStyle = 'rgba(124,58,237,0.7)';
      ctx.lineWidth = 1.5;
      roundRect(ctx, btnX, btnY, btnW, btnH, 8);
      ctx.stroke();
      ctx.font = '18px Georgia, serif';
      ctx.fillStyle = '#E8D5B7';
      ctx.fillText('CONTINUA', GAME_W / 2, btnY + 32);
    }

    ctx.globalAlpha = 1;
    ctx.restore();
  }

  private renderExitButton(ctx: CanvasRenderingContext2D): void {
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
  }

  private wrapText(
    ctx: CanvasRenderingContext2D,
    text: string,
    x: number, y: number,
    maxW: number, lineH: number,
  ): void {
    const words = text.split(' ');
    let line = '';
    let cy = y;
    for (const word of words) {
      const test = line + word + ' ';
      if (ctx.measureText(test).width > maxW && line.length > 0) {
        ctx.fillText(line.trim(), x, cy);
        line = word + ' ';
        cy += lineH;
      } else {
        line = test;
      }
    }
    if (line.trim()) {
      ctx.fillText(line.trim(), x, cy);
    }
  }
}
