/**
 * Main game controller for Intreccio.
 * Manages game state, input handling, hex selection, word validation, and rendering.
 */

import {
  CANVAS_W, CANVAS_H, COLORS,
  GameScreen, SaveData, LevelProgress,
  HexCell, HiddenWord, HexCoord,
} from './types';
import { LEVELS } from './levels';
import {
  buildGrid, findCellAtPoint, areAdjacent,
  calculateGridOffset, HEX_SIZE,
} from './hex-grid';
import { Renderer, PANEL_WIDTH } from './renderer';
import { ParticleSystem } from './effects';
import {
  unlockAudio, playButtonClick, playHexSelect, playHexTrace,
  playWordFound, playError, playLevelComplete,
} from './audio';
import {
  drawTitleScreen, drawLevelSelect, drawLevelComplete,
  getTitleButtonRects,
} from './screens';

const STORAGE_KEY = 'intreccio_save';
const SHAKE_DURATION = 300; // ms
const FOUND_ANIM_DURATION = 600; // ms

/** Tutorial messages for level 1 */
const TUTORIAL_MESSAGES = [
  'Clicca su una lettera e trascina per collegare le lettere adiacenti',
  'Forma parole italiane per completare il livello',
];
const TUTORIAL_MSG_DURATION = 4.0; // seconds per message
const TUTORIAL_FADE_TIME = 0.8;

export class Game {
  private canvas: HTMLCanvasElement;
  private ctx: CanvasRenderingContext2D;
  private renderer: Renderer;
  private particles: ParticleSystem;

  private screen: GameScreen = 'title';
  private saveData: SaveData = { levels: {}, totalScore: 0 };

  // Level state
  private currentLevelIdx = 0;
  private cells: HexCell[] = [];
  private hiddenWords: HiddenWord[] = [];
  private selectedCells: HexCell[] = [];
  private isSelecting = false;
  private currentWord = '';

  // Tutorial state
  private tutorialTime = 0;
  private tutorialDismissed = false;

  // Timing & scoring
  private levelStartTime = 0;
  private elapsedTime = 0;
  private levelScore = 0;
  private levelStars = 0;
  private wrongAttempts = 0;

  // Animations
  private shakeTimer = 0;
  private shakeCells: HexCell[] = [];
  private foundAnimTimer = 0;
  private foundAnimCells: HexCell[] = [];
  private levelCompleteTriggered = false;
  private completeAnimStart = 0;
  private completeAnimProgress = 0;
  private completeRects = {
    nextRect: { x: 0, y: 0, w: 0, h: 0 },
    menuRect: { x: 0, y: 0, w: 0, h: 0 },
  };

  // Level select
  private levelSelectRects: { id: number; x: number; y: number; w: number; h: number }[] = [];
  private levelSelectBackRect = { x: 0, y: 0, w: 0, h: 0 };

  // Back/exit button in playing mode
  private backBtnRect = { x: 12, y: 12, w: 36, h: 36 };

  // Frame & input
  private frameCount = 0;
  private lastTime = 0;
  private dustTimer = 0;
  private mouseX = 0;
  private mouseY = 0;

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

    this.loadSave();
    this.setupInput();
    this.resize();
    window.addEventListener('resize', () => this.resize());
  }

  private resize(): void {
    const dpr = window.devicePixelRatio || 1;
    const windowW = window.innerWidth;
    const windowH = window.innerHeight;
    const isPortrait = windowH > windowW;

    let scale: number;
    if (isPortrait) {
      scale = windowW / CANVAS_W;
    } else {
      scale = Math.min(windowW / CANVAS_W, windowH / CANVAS_H);
    }

    const displayW = CANVAS_W * scale;
    const displayH = CANVAS_H * scale;

    this.canvas.width = CANVAS_W * dpr;
    this.canvas.height = CANVAS_H * dpr;
    this.canvas.style.width = `${displayW}px`;
    this.canvas.style.height = `${displayH}px`;

    this.ctx.setTransform(dpr, 0, 0, dpr, 0, 0);

    this.scaleX = CANVAS_W / displayW;
    this.scaleY = CANVAS_H / displayH;
    this.offsetX = (windowW - displayW) / 2;
    this.offsetY = Math.max(0, (windowH - displayH) / 2);

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

  // ─── Input ────────────────────────────────────────────────────────

  private setupInput(): void {
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
      if (this.levelCompleteTriggered) return;

      // Back/exit button
      if (this.hitRect(x, y, this.backBtnRect)) {
        playButtonClick();
        this.screen = 'levelSelect';
        return;
      }

      // Dismiss tutorial on first interaction
      if (this.currentLevelIdx === 0 && !this.tutorialDismissed) {
        this.tutorialDismissed = true;
      }

      // Start hex selection
      const cell = findCellAtPoint(this.cells, x, y);
      if (cell) {
        this.isSelecting = true;
        this.selectedCells = [cell];
        this.currentWord = cell.letter;
        cell.selectPulse = 1;
        playHexSelect();
      }
    }
  }

  private handlePointerMove(x: number, y: number): void {
    this.mouseX = x;
    this.mouseY = y;

    if (this.screen === 'playing' && this.isSelecting) {
      const cell = findCellAtPoint(this.cells, x, y);
      if (!cell) return;

      // Check if already in selection
      const existingIdx = this.selectedCells.findIndex(
        c => c.row === cell.row && c.col === cell.col,
      );

      if (existingIdx >= 0) {
        // If going back, allow deselecting the last cell
        if (existingIdx === this.selectedCells.length - 2) {
          this.selectedCells.pop();
          this.currentWord = this.selectedCells.map(c => c.letter).join('');
        }
        return;
      }

      // Must be adjacent to last selected cell
      const lastCell = this.selectedCells[this.selectedCells.length - 1];
      if (areAdjacent(
        { row: lastCell.row, col: lastCell.col },
        { row: cell.row, col: cell.col },
      )) {
        this.selectedCells.push(cell);
        this.currentWord += cell.letter;
        cell.selectPulse = 1;
        playHexTrace(this.selectedCells.length - 1);
      }
    }

    // Cursor
    if (this.screen === 'playing' && !this.isSelecting && !this.levelCompleteTriggered) {
      const overCell = findCellAtPoint(this.cells, x, y);
      this.canvas.style.cursor = overCell ? 'pointer' : 'default';
    }
  }

  private handlePointerUp(_x: number, _y: number): void {
    if (this.screen === 'playing' && this.isSelecting) {
      this.submitWord();
      this.isSelecting = false;
    }
  }

  // ─── Word Submission ──────────────────────────────────────────────

  private submitWord(): void {
    if (this.selectedCells.length < 2) {
      this.clearSelection();
      return;
    }

    const word = this.currentWord;
    const path = this.selectedCells.map(c => ({ row: c.row, col: c.col }));

    // Check against hidden words
    let matched = false;
    for (const hw of this.hiddenWords) {
      if (hw.found) continue;
      if (hw.word === word) {
        // Verify the path matches
        if (this.pathsMatch(path, hw.path)) {
          matched = true;
          this.onWordFound(hw);
          break;
        }
      }
    }

    if (!matched) {
      // Check if it matches any unfound word regardless of path
      // (allow finding a word via any valid path through the correct letters)
      for (const hw of this.hiddenWords) {
        if (hw.found) continue;
        if (hw.word === word) {
          matched = true;
          this.onWordFound(hw);
          break;
        }
      }
    }

    if (!matched) {
      this.onWrongWord();
    }
  }

  private pathsMatch(a: HexCoord[], b: HexCoord[]): boolean {
    if (a.length !== b.length) return false;
    for (let i = 0; i < a.length; i++) {
      if (a[i].row !== b[i].row || a[i].col !== b[i].col) return false;
    }
    return true;
  }

  private onWordFound(hw: HiddenWord): void {
    hw.found = true;

    // Mark cells as found
    for (const coord of hw.path) {
      const cell = this.cells.find(c => c.row === coord.row && c.col === coord.col);
      if (cell) {
        cell.found = true;
        cell.glow = 1;
      }
    }

    // Score
    const wordScore = 50 + hw.word.length * 10;
    this.levelScore += wordScore;

    // Effects
    const midIdx = Math.floor(hw.path.length / 2);
    const midCell = this.cells.find(
      c => c.row === hw.path[midIdx].row && c.col === hw.path[midIdx].col,
    );
    if (midCell) {
      this.particles.spawnSparkles(midCell.cx, midCell.cy, 15);
    }

    playWordFound();

    // Found animation
    this.foundAnimTimer = performance.now();
    this.foundAnimCells = hw.path.map(coord =>
      this.cells.find(c => c.row === coord.row && c.col === coord.col)!,
    ).filter(Boolean);

    // Check level complete
    const allFound = this.hiddenWords.every(w => w.found);
    if (allFound) {
      this.onLevelComplete();
    }

    this.clearSelection();
  }

  private onWrongWord(): void {
    this.wrongAttempts++;

    // Shake animation
    this.shakeTimer = performance.now();
    this.shakeCells = [...this.selectedCells];

    playError();
    this.clearSelection();
  }

  private clearSelection(): void {
    for (const cell of this.selectedCells) {
      cell.selectPulse = 0;
    }
    this.selectedCells = [];
    this.currentWord = '';
  }

  // ─── Level Management ─────────────────────────────────────────────

  private startNextUncompletedLevel(): void {
    for (let i = 0; i < LEVELS.length; i++) {
      if (!this.saveData.levels[LEVELS[i].id]?.completed) {
        this.startLevel(i);
        return;
      }
    }
    this.startLevel(0);
  }

  private startLevel(idx: number): void {
    this.currentLevelIdx = idx;
    this.screen = 'playing';
    this.levelCompleteTriggered = false;
    this.completeAnimProgress = 0;
    this.wrongAttempts = 0;
    this.levelScore = 0;
    this.levelStars = 0;
    this.selectedCells = [];
    this.currentWord = '';
    this.isSelecting = false;

    const level = LEVELS[idx];

    // Build grid
    const { offsetX, offsetY } = calculateGridOffset(
      level.gridRows, level.gridCols, CANVAS_W, CANVAS_H, PANEL_WIDTH,
    );

    this.cells = buildGrid(level.gridRows, level.gridCols, level.grid, offsetX, offsetY);

    // Build hidden words
    this.hiddenWords = level.wordPaths.map(wp => ({
      word: wp.word,
      path: wp.path,
      found: false,
    }));

    this.levelStartTime = performance.now();
    this.elapsedTime = 0;
    this.tutorialTime = 0;
    this.tutorialDismissed = false;
    this.particles.clear();
  }

  private onLevelComplete(): void {
    this.levelCompleteTriggered = true;

    // Time bonus
    if (this.elapsedTime < 60) this.levelScore += 100;
    else if (this.elapsedTime < 120) this.levelScore += 50;

    // No-error bonus
    if (this.wrongAttempts === 0) this.levelScore += 50;

    // Stars
    if (this.wrongAttempts === 0 && this.elapsedTime < 60) {
      this.levelStars = 3;
    } else if (this.wrongAttempts <= 2 && this.elapsedTime < 120) {
      this.levelStars = 2;
    } else {
      this.levelStars = 1;
    }

    // Save
    const levelId = LEVELS[this.currentLevelIdx].id;
    const existing = this.saveData.levels[levelId];

    this.saveData.levels[levelId] = {
      completed: true,
      stars: Math.max(this.levelStars, existing?.stars ?? 0),
      bestScore: Math.max(this.levelScore, existing?.bestScore ?? 0),
      bestTime: existing ? Math.min(this.elapsedTime, existing.bestTime) : this.elapsedTime,
    };

    this.saveData.totalScore = Object.values(this.saveData.levels).reduce(
      (sum, l) => sum + l.bestScore, 0,
    );
    this.saveSave();

    // Celebration
    const centerX = (CANVAS_W - PANEL_WIDTH) / 2;
    const centerY = CANVAS_H / 2;
    this.particles.spawnCelebration(centerX, centerY);

    playLevelComplete();

    // Delay before showing complete overlay
    setTimeout(() => {
      this.completeAnimStart = performance.now();
      this.screen = 'levelComplete';
    }, 1200);
  }

  // ─── Save/Load ────────────────────────────────────────────────────

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
      // Storage unavailable
    }
  }

  // ─── Utility ──────────────────────────────────────────────────────

  private hitRect(px: number, py: number, rect: { x: number; y: number; w: number; h: number }): boolean {
    return px >= rect.x && px <= rect.x + rect.w && py >= rect.y && py <= rect.y + rect.h;
  }

  // ─── Game Loop ────────────────────────────────────────────────────

  start(): void {
    this.lastTime = performance.now();
    this.loop();
  }

  private loop = (): void => {
    const now = performance.now();
    this.lastTime = now;
    this.frameCount++;

    this.update(now);
    this.draw();

    requestAnimationFrame(this.loop);
  };

  private update(now: number): void {
    // Ambient dust
    this.dustTimer++;
    if (this.dustTimer % 15 === 0) {
      this.particles.spawnDust();
    }
    this.particles.update();

    if (this.screen === 'playing') {
      if (!this.levelCompleteTriggered) {
        this.elapsedTime = (now - this.levelStartTime) / 1000;
      }

      // Update tutorial time for first level
      if (this.currentLevelIdx === 0 && !this.tutorialDismissed) {
        this.tutorialTime += 1 / 60; // approximate 60fps
      }

      // Shake animation
      if (this.shakeTimer > 0) {
        const elapsed = now - this.shakeTimer;
        if (elapsed < SHAKE_DURATION) {
          const intensity = (1 - elapsed / SHAKE_DURATION) * 4;
          for (const cell of this.shakeCells) {
            cell.shakeX = Math.sin(elapsed * 0.05) * intensity;
            cell.shakeY = Math.cos(elapsed * 0.07) * intensity * 0.5;
          }
        } else {
          for (const cell of this.shakeCells) {
            cell.shakeX = 0;
            cell.shakeY = 0;
          }
          this.shakeTimer = 0;
          this.shakeCells = [];
        }
      }

      // Found word glow decay
      for (const cell of this.cells) {
        if (cell.glow > 0) {
          cell.glow *= 0.98;
          if (cell.glow < 0.01) cell.glow = 0;
        }
        if (cell.selectPulse > 0 && !this.selectedCells.includes(cell)) {
          cell.selectPulse *= 0.9;
          if (cell.selectPulse < 0.01) cell.selectPulse = 0;
        }
      }
    }

    if (this.screen === 'levelComplete') {
      this.completeAnimProgress = Math.min(
        (now - this.completeAnimStart) / 800, 1,
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

    // Playing or levelComplete
    this.renderer.drawBackground();

    const level = LEVELS[this.currentLevelIdx];

    // Draw found word paths (subtle glow lines)
    this.renderer.drawFoundWordPaths(this.hiddenWords, this.cells, this.frameCount);

    // Draw selection trail
    if (this.selectedCells.length >= 2) {
      this.renderer.drawSelectionTrail(this.selectedCells, this.frameCount);
    }

    // Draw hex cells
    const foundPulse = Math.sin(this.frameCount * 0.03) * 0.5 + 0.5;
    for (const cell of this.cells) {
      const isSelected = this.selectedCells.some(
        sc => sc.row === cell.row && sc.col === cell.col,
      );
      const selIdx = isSelected
        ? this.selectedCells.findIndex(sc => sc.row === cell.row && sc.col === cell.col)
        : -1;

      this.renderer.drawHex(
        cell,
        isSelected,
        selIdx,
        cell.found,
        foundPulse,
        this.frameCount,
      );
    }

    // Current word display
    if (this.currentWord.length > 0) {
      const isValid = this.hiddenWords.some(
        hw => !hw.found && hw.word === this.currentWord,
      );
      this.renderer.drawCurrentWord(this.currentWord, isValid);
    }

    // Word panel
    this.renderer.drawWordPanel(
      this.hiddenWords,
      level.id,
      this.elapsedTime,
      this.levelScore,
      this.frameCount,
    );

    // Back button
    if (!this.levelCompleteTriggered) {
      this.drawBackButton();
    }

    // Tutorial overlay for level 1
    if (this.currentLevelIdx === 0 && !this.tutorialDismissed) {
      this.drawTutorialOverlay();
    }

    // Particles
    this.particles.draw(ctx);

    // Level complete overlay
    if (this.screen === 'levelComplete') {
      this.completeRects = drawLevelComplete(
        ctx,
        this.hiddenWords.filter(w => w.found).length,
        this.hiddenWords.length,
        this.levelScore,
        this.levelStars,
        this.elapsedTime,
        this.wrongAttempts,
        level.id,
        this.currentLevelIdx >= LEVELS.length - 1,
        this.completeAnimProgress,
        this.frameCount,
      );
    }
  }

  private drawTutorialOverlay(): void {
    const ctx = this.ctx;
    const totalDuration = TUTORIAL_MESSAGES.length * TUTORIAL_MSG_DURATION;

    if (this.tutorialTime >= totalDuration + TUTORIAL_FADE_TIME) return;

    const msgIndex = Math.min(
      Math.floor(this.tutorialTime / TUTORIAL_MSG_DURATION),
      TUTORIAL_MESSAGES.length - 1,
    );
    const msgTime = this.tutorialTime - msgIndex * TUTORIAL_MSG_DURATION;

    let alpha = 1;
    if (msgTime < TUTORIAL_FADE_TIME) {
      alpha = msgTime / TUTORIAL_FADE_TIME;
    } else if (msgTime > TUTORIAL_MSG_DURATION - TUTORIAL_FADE_TIME) {
      alpha = Math.max(0, (TUTORIAL_MSG_DURATION - msgTime) / TUTORIAL_FADE_TIME);
    }
    if (this.tutorialTime >= totalDuration) {
      alpha = Math.max(0, 1 - (this.tutorialTime - totalDuration) / TUTORIAL_FADE_TIME);
    }
    if (alpha <= 0) return;

    const message = TUTORIAL_MESSAGES[msgIndex];
    const areaW = CANVAS_W - PANEL_WIDTH;

    ctx.save();
    ctx.globalAlpha = alpha;

    // Semi-transparent strip
    const stripY = 55;
    const stripH = 36;
    ctx.fillStyle = 'rgba(30,22,14,0.85)';
    ctx.fillRect(50, stripY, areaW - 100, stripH);
    ctx.strokeStyle = 'rgba(180,140,60,0.4)';
    ctx.lineWidth = 1;
    ctx.strokeRect(50, stripY, areaW - 100, stripH);

    // Text
    ctx.fillStyle = COLORS.parchment;
    ctx.font = '15px "Georgia", serif';
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.fillText(message, areaW / 2, stripY + stripH / 2);

    // Dots
    const dotY = stripY + stripH + 8;
    for (let i = 0; i < TUTORIAL_MESSAGES.length; i++) {
      ctx.beginPath();
      ctx.arc(areaW / 2 + (i - (TUTORIAL_MESSAGES.length - 1) / 2) * 14, dotY, 3, 0, Math.PI * 2);
      ctx.fillStyle = i === msgIndex ? COLORS.gold : 'rgba(180,140,60,0.3)';
      ctx.fill();
    }

    ctx.restore();
  }

  private drawBackButton(): void {
    const ctx = this.ctx;
    const { x, y, w, h } = this.backBtnRect;
    const cx = x + w / 2;
    const cy = y + h / 2;
    const radius = w / 2;

    ctx.save();
    // Circle background
    ctx.fillStyle = 'rgba(140,50,50,0.7)';
    ctx.beginPath();
    ctx.arc(cx, cy, radius, 0, Math.PI * 2);
    ctx.fill();

    ctx.strokeStyle = 'rgba(200,100,100,0.5)';
    ctx.lineWidth = 1;
    ctx.stroke();

    // X symbol
    ctx.strokeStyle = '#ffffff';
    ctx.lineWidth = 2.5;
    ctx.lineCap = 'round';
    const pad = 10;
    ctx.beginPath();
    ctx.moveTo(x + pad, y + pad);
    ctx.lineTo(x + w - pad, y + h - pad);
    ctx.moveTo(x + w - pad, y + pad);
    ctx.lineTo(x + pad, y + h - pad);
    ctx.stroke();
    ctx.restore();
  }
}
