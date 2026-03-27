// ─── Game Controller ──────────────────────────────────────────────
// Main game loop, state management, input handling

import {
  CANVAS_W, CANVAS_H, COLORS, GameScreen, SaveData, LevelDef,
  Button, clamp, TutorialInfo,
} from './types';
import { LEVELS } from './levels';
import {
  drawEncryptedMessage, drawTypewriterInput, drawCaesarWheel,
  drawMirror, drawNumberGrid, drawSubstitutionTable,
  drawMorseReference, drawAtbashTable, drawVigenereGrid,
  drawFrequencyChart, drawMultiStepProgress, drawHUD,
  drawToolDescription, drawButton, drawTutorialPanel,
  drawExitButton, drawInputLabel, drawCipherToolLabel,
} from './renderer';
import {
  drawScanlines, drawCRTCurvature, drawMorseDecoration,
  drawScreenBorder, spawnParticles, updateParticles,
  drawParticles, updateFlicker, drawFlicker,
  drawClassifiedStamp,
} from './effects';
import {
  drawTitleScreen, drawLevelSelectScreen,
  drawLevelCompleteScreen, drawGameCompleteScreen,
} from './screens';
import {
  initAudio, playTypewriterKey, playTypewriterReturn,
  playLetterMatch, playLetterWrong, playWheelClick,
  playDecryptSuccess, playErrorBuzz, playHintReveal,
  playButtonClick, playLevelStart, playGameComplete,
} from './audio';

const SAVE_KEY = 'codice_save';

export class Game {
  private canvas: HTMLCanvasElement;
  private ctx: CanvasRenderingContext2D;
  private screen: GameScreen = 'title';
  private time: number = 0;
  private lastTime: number = 0;
  private animating: boolean = false;

  // Save data
  private saveData: SaveData = { levels: {}, totalScore: 0 };

  // Level state
  private currentLevel: LevelDef | null = null;
  private currentLevelIndex: number = 0;
  private playerInput: string = '';
  private levelTime: number = 0;
  private hintsUsed: number = 0;
  private revealedLetters: Set<number> = new Set();
  private cursorBlink: boolean = true;
  private cursorTimer: number = 0;
  private levelScore: number = 0;
  private levelStars: number = 0;

  // Multi-step levels
  private currentStep: number = 0;
  private stepCompleted: boolean[] = [];
  private currentStepEncrypted: string = '';

  // Cipher wheel state
  private wheelRotation: number = 0;
  private wheelDragging: boolean = false;
  private wheelDragStartAngle: number = 0;

  // Tutorial state
  private showTutorial: boolean = false;

  // UI state
  private buttons: Button[] = [];
  private hoveredLevel: number = -1;
  private levelCompleteAnim: number = 0;
  private shakeTimer: number = 0;
  private shakeIntensity: number = 0;

  // Input
  private mouseX: number = 0;
  private mouseY: number = 0;
  private audioInitialized: boolean = false;

  constructor(canvas: HTMLCanvasElement) {
    this.canvas = canvas;
    this.ctx = canvas.getContext('2d')!;
    this.setupCanvas();
    this.loadSave();
    this.setupInput();
  }

  private setupCanvas(): void {
    this.canvas.width = CANVAS_W;
    this.canvas.height = CANVAS_H;

    const resize = () => {
      const w = window.innerWidth;
      const h = window.innerHeight;
      const isPortrait = h > w;
      let scale: number;
      if (isPortrait) {
        scale = w / CANVAS_W;
      } else {
        scale = Math.min(w / CANVAS_W, h / CANVAS_H);
      }
      this.canvas.style.width = `${CANVAS_W * scale}px`;
      this.canvas.style.height = `${CANVAS_H * scale}px`;
      this.canvas.style.position = 'absolute';
      this.canvas.style.left = `${(w - CANVAS_W * scale) / 2}px`;
      this.canvas.style.top = `${Math.max(0, (h - CANVAS_H * scale) / 2)}px`;
    };
    resize();
    window.addEventListener('resize', resize);
  }

  private loadSave(): void {
    try {
      const raw = localStorage.getItem(SAVE_KEY);
      if (raw) {
        this.saveData = JSON.parse(raw);
      }
    } catch (_) {
      this.saveData = { levels: {}, totalScore: 0 };
    }
  }

  private saveSave(): void {
    try {
      localStorage.setItem(SAVE_KEY, JSON.stringify(this.saveData));
    } catch (_) {
      // Silently ignore
    }
  }

  private setupInput(): void {
    // Mouse/touch
    const getPos = (e: MouseEvent | TouchEvent): { x: number; y: number } => {
      const rect = this.canvas.getBoundingClientRect();
      const scaleX = CANVAS_W / rect.width;
      const scaleY = CANVAS_H / rect.height;
      const clientX = 'touches' in e ? e.touches[0]?.clientX ?? 0 : e.clientX;
      const clientY = 'touches' in e ? e.touches[0]?.clientY ?? 0 : e.clientY;
      return {
        x: (clientX - rect.left) * scaleX,
        y: (clientY - rect.top) * scaleY,
      };
    };

    this.canvas.addEventListener('mousemove', (e) => {
      const pos = getPos(e);
      this.mouseX = pos.x;
      this.mouseY = pos.y;
      this.updateHovers();
    });

    this.canvas.addEventListener('mousedown', (e) => {
      this.ensureAudio();
      const pos = getPos(e);
      this.handleClick(pos.x, pos.y);
    });

    this.canvas.addEventListener('touchstart', (e) => {
      e.preventDefault();
      this.ensureAudio();
      const pos = getPos(e);
      this.mouseX = pos.x;
      this.mouseY = pos.y;
      this.handleClick(pos.x, pos.y);
    }, { passive: false });

    // Keyboard
    window.addEventListener('keydown', (e) => {
      this.ensureAudio();
      this.handleKeyDown(e);
    });
  }

  private ensureAudio(): void {
    if (!this.audioInitialized) {
      initAudio();
      this.audioInitialized = true;
    }
  }

  private updateHovers(): void {
    // Update button hovers
    for (const btn of this.buttons) {
      btn.hovered = this.isPointInRect(this.mouseX, this.mouseY, btn.x, btn.y, btn.w, btn.h);
    }

    // Level select hover
    if (this.screen === 'levelSelect') {
      this.hoveredLevel = -1;
      const gridX = 80;
      const gridY = 120;
      const cardW = 190;
      const cardH = 250;
      const gapX = 20;
      const gapY = 20;

      for (let i = 0; i < LEVELS.length; i++) {
        const col = i % 5;
        const row = Math.floor(i / 5);
        const x = gridX + col * (cardW + gapX);
        const y = gridY + row * (cardH + gapY);
        if (this.isPointInRect(this.mouseX, this.mouseY, x, y, cardW, cardH)) {
          this.hoveredLevel = i;
          break;
        }
      }
    }

    // Update cursor style
    const isOverClickable = this.buttons.some((b) => b.hovered) || this.hoveredLevel >= 0;
    this.canvas.style.cursor = isOverClickable ? 'pointer' : 'default';
  }

  private isPointInRect(px: number, py: number, x: number, y: number, w: number, h: number): boolean {
    return px >= x && px <= x + w && py >= y && py <= y + h;
  }

  private handleClick(x: number, y: number): void {
    // Check buttons
    for (const btn of this.buttons) {
      if (this.isPointInRect(x, y, btn.x, btn.y, btn.w, btn.h)) {
        playButtonClick();
        this.handleAction(btn.action);
        return;
      }
    }

    // Level select cards
    if (this.screen === 'levelSelect' && this.hoveredLevel >= 0) {
      const levelIdx = this.hoveredLevel;
      const isUnlocked = levelIdx === 0 || this.saveData.levels[levelIdx]?.completed || false;
      if (isUnlocked) {
        playButtonClick();
        this.startLevel(levelIdx);
      }
    }
  }

  private handleAction(action: string): void {
    switch (action) {
      case 'play':
        this.screen = 'levelSelect';
        this.buildButtons();
        break;
      case 'back':
        this.screen = 'title';
        this.buildButtons();
        break;
      case 'hint':
        this.useHint();
        break;
      case 'nextLevel':
        if (this.currentLevelIndex + 1 < LEVELS.length) {
          this.startLevel(this.currentLevelIndex + 1);
        } else {
          this.screen = 'gameComplete';
          playGameComplete();
          this.buildButtons();
        }
        break;
      case 'levelSelect':
        this.screen = 'levelSelect';
        this.showTutorial = false;
        this.buildButtons();
        break;
      case 'exit':
        this.screen = 'levelSelect';
        this.showTutorial = false;
        this.buildButtons();
        break;
      case 'toggleTutorial':
        this.showTutorial = !this.showTutorial;
        break;
      case 'restart':
        if (this.currentLevel) {
          this.startLevel(this.currentLevelIndex);
        }
        break;
      case 'resetProgress':
        this.saveData = { levels: {}, totalScore: 0 };
        this.saveSave();
        this.screen = 'title';
        this.buildButtons();
        break;
    }
  }

  private buildButtons(): void {
    this.buttons = [];

    switch (this.screen) {
      case 'title':
        this.buttons.push({
          x: CANVAS_W / 2 - 120, y: 520, w: 240, h: 50,
          label: 'INIZIA MISSIONE', action: 'play', hovered: false,
        });
        if (this.saveData.totalScore > 0) {
          this.buttons.push({
            x: CANVAS_W / 2 - 100, y: 590, w: 200, h: 40,
            label: 'RESET PROGRESSI', action: 'resetProgress', hovered: false,
          });
        }
        break;

      case 'levelSelect':
        // Exit button (X) top-left
        this.buttons.push({
          x: 10, y: 5, w: 32, h: 32,
          label: 'X', action: 'back', hovered: false,
        });
        this.buttons.push({
          x: 20, y: CANVAS_H - 50, w: 120, h: 36,
          label: '< INDIETRO', action: 'back', hovered: false,
        });
        break;

      case 'playing':
        // Exit button (X) top-left
        this.buttons.push({
          x: 10, y: 5, w: 32, h: 32,
          label: 'X', action: 'exit', hovered: false,
        });
        // Hint button - more prominent
        this.buttons.push({
          x: CANVAS_W - 240, y: CANVAS_H - 55, w: 220, h: 40,
          label: '\u{1F4A1} SUGGERIMENTO (Rivela una lettera)', action: 'hint', hovered: false,
        });
        // Tutorial toggle button
        this.buttons.push({
          x: 20, y: CANVAS_H - 55, w: 160, h: 36,
          label: '? ISTRUZIONI', action: 'toggleTutorial', hovered: false,
        });
        break;

      case 'levelComplete':
        this.buttons.push({
          x: CANVAS_W / 2 - 130, y: CANVAS_H / 2 + 120, w: 120, h: 40,
          label: 'LIVELLI', action: 'levelSelect', hovered: false,
        });
        if (this.currentLevelIndex + 1 < LEVELS.length) {
          this.buttons.push({
            x: CANVAS_W / 2 + 10, y: CANVAS_H / 2 + 120, w: 120, h: 40,
            label: 'AVANTI >', action: 'nextLevel', hovered: false,
          });
        } else {
          this.buttons.push({
            x: CANVAS_W / 2 + 10, y: CANVAS_H / 2 + 120, w: 120, h: 40,
            label: 'FINALE', action: 'nextLevel', hovered: false,
          });
        }
        break;

      case 'gameComplete':
        this.buttons.push({
          x: CANVAS_W / 2 - 100, y: 520, w: 200, h: 50,
          label: 'MENU PRINCIPALE', action: 'back', hovered: false,
        });
        break;
    }
  }

  private startLevel(index: number): void {
    this.currentLevelIndex = index;
    this.currentLevel = LEVELS[index];
    this.playerInput = '';
    this.levelTime = 0;
    this.hintsUsed = 0;
    this.revealedLetters = new Set();
    this.levelScore = 0;
    this.levelStars = 0;
    this.wheelRotation = 0;
    this.currentStep = 0;
    this.stepCompleted = [];
    this.levelCompleteAnim = 0;
    this.shakeTimer = 0;

    // Multi-step setup
    if (this.currentLevel.steps) {
      this.stepCompleted = this.currentLevel.steps.map(() => false);
      this.currentStepEncrypted = this.currentLevel.steps[0].encrypted;
    } else {
      this.currentStepEncrypted = this.currentLevel.encrypted;
    }

    this.screen = 'playing';
    // Show tutorial automatically on level 1
    this.showTutorial = index === 0;
    this.buildButtons();
    playLevelStart();
  }

  private useHint(): void {
    if (!this.currentLevel) return;

    const answer = this.getCurrentAnswer();
    // Find first unrevealed letter not yet typed correctly
    for (let i = 0; i < answer.length; i++) {
      if (!this.revealedLetters.has(i) &&
        (i >= this.playerInput.length || this.playerInput[i].toUpperCase() !== answer[i].toUpperCase())) {
        this.revealedLetters.add(i);
        // Auto-fill the hint letter
        const inputArr = this.playerInput.split('');
        while (inputArr.length <= i) inputArr.push(' ');
        inputArr[i] = answer[i];
        this.playerInput = inputArr.join('').replace(/\s+$/, '');
        // Trim trailing spaces, but fill up to the hint position
        if (this.playerInput.length < i + 1) {
          this.playerInput = this.playerInput.padEnd(i + 1);
          this.playerInput = this.playerInput.substring(0, i) + answer[i];
        }
        this.hintsUsed++;
        playHintReveal();
        spawnParticles(CANVAS_W / 2, CANVAS_H - 100, 8, 'decrypt');

        // Check completion
        this.checkAnswer();
        return;
      }
    }
  }

  private getCurrentAnswer(): string {
    if (!this.currentLevel) return '';
    if (this.currentLevel.steps && this.currentStep < this.currentLevel.steps.length) {
      return this.currentLevel.steps[this.currentStep].answer;
    }
    return this.currentLevel.answer;
  }

  private getCurrentEncrypted(): string {
    if (!this.currentLevel) return '';
    if (this.currentLevel.steps && this.currentStep < this.currentLevel.steps.length) {
      return this.currentLevel.steps[this.currentStep].encrypted;
    }
    return this.currentLevel.encrypted;
  }

  private handleKeyDown(e: KeyboardEvent): void {
    if (this.screen !== 'playing' || !this.currentLevel) return;

    const answer = this.getCurrentAnswer();

    if (e.key === 'Backspace') {
      if (this.playerInput.length > 0) {
        // Don't delete revealed hint letters
        let deleteIdx = this.playerInput.length - 1;
        while (deleteIdx >= 0 && this.revealedLetters.has(deleteIdx)) {
          deleteIdx--;
        }
        if (deleteIdx >= 0) {
          this.playerInput = this.playerInput.substring(0, deleteIdx);
          playTypewriterKey();
        }
      }
      return;
    }

    if (e.key === 'Enter') {
      playTypewriterReturn();
      this.checkAnswer();
      return;
    }

    // Only accept letters
    if (e.key.length === 1 && /[a-zA-Z]/.test(e.key)) {
      if (this.playerInput.length < answer.length) {
        // Skip over revealed hint positions
        let insertIdx = this.playerInput.length;
        while (this.revealedLetters.has(insertIdx) && insertIdx < answer.length) {
          this.playerInput += answer[insertIdx];
          insertIdx++;
        }
        if (insertIdx < answer.length) {
          this.playerInput += e.key.toUpperCase();
          playTypewriterKey();

          // Check if letter matches
          const lastIdx = this.playerInput.length - 1;
          if (this.playerInput[lastIdx].toUpperCase() === answer[lastIdx].toUpperCase()) {
            playLetterMatch();
            spawnParticles(
              CANVAS_W / 2 + (lastIdx - answer.length / 2) * 20,
              CANVAS_H - 100,
              3,
              'spark'
            );
          }

          // Auto-check when all letters typed
          if (this.playerInput.length >= answer.length) {
            setTimeout(() => this.checkAnswer(), 200);
          }
        }
      }
    }
  }

  private checkAnswer(): void {
    if (!this.currentLevel) return;
    const answer = this.getCurrentAnswer();

    if (this.playerInput.toUpperCase() === answer.toUpperCase()) {
      // Step or level completed
      if (this.currentLevel.steps && this.currentStep < this.currentLevel.steps.length - 1) {
        // Complete this step, move to next
        this.stepCompleted[this.currentStep] = true;
        this.currentStep++;
        this.playerInput = '';
        this.revealedLetters = new Set();
        this.currentStepEncrypted = this.currentLevel.steps[this.currentStep].encrypted;
        playDecryptSuccess();
        spawnParticles(CANVAS_W / 2, CANVAS_H / 2, 20, 'decrypt');
      } else {
        // Level complete
        if (this.currentLevel.steps) {
          this.stepCompleted[this.currentStep] = true;
        }
        this.completeLevel();
      }
    } else if (this.playerInput.length >= answer.length) {
      // Wrong answer
      playErrorBuzz();
      this.shakeTimer = 0.3;
      this.shakeIntensity = 5;
      // Clear wrong input
      setTimeout(() => {
        this.playerInput = '';
        // Re-apply revealed hints
        const ans = this.getCurrentAnswer();
        for (const idx of this.revealedLetters) {
          while (this.playerInput.length < idx) this.playerInput += ' ';
          this.playerInput = this.playerInput.substring(0, idx) + ans[idx] +
            this.playerInput.substring(idx + 1);
        }
        this.playerInput = this.playerInput.replace(/\s+$/, '');
      }, 300);
    }
  }

  private completeLevel(): void {
    if (!this.currentLevel) return;

    // Calculate score
    let score = 100;
    if (this.levelTime < 30) score += 50;
    else if (this.levelTime < 60) score += 25;
    if (this.hintsUsed === 0) score += 30;

    // Stars
    let stars = 1;
    if (score >= 130) stars = 3;
    else if (score >= 100) stars = 2;

    this.levelScore = score;
    this.levelStars = stars;

    // Update save data
    const prev = this.saveData.levels[this.currentLevel.id];
    if (!prev || score > prev.bestScore) {
      this.saveData.levels[this.currentLevel.id] = {
        completed: true,
        stars: prev ? Math.max(prev.stars, stars) : stars,
        bestScore: prev ? Math.max(prev.bestScore, score) : score,
        bestTime: prev ? Math.min(prev.bestTime, this.levelTime) : this.levelTime,
      };
    } else {
      this.saveData.levels[this.currentLevel.id] = {
        ...prev,
        completed: true,
        stars: Math.max(prev.stars, stars),
      };
    }

    // Unlock next level
    if (this.currentLevelIndex + 1 < LEVELS.length) {
      const nextId = this.currentLevelIndex + 1;
      if (!this.saveData.levels[nextId]) {
        this.saveData.levels[nextId] = {
          completed: false, stars: 0, bestScore: 0, bestTime: Infinity,
        };
      }
    }

    // Update total
    this.saveData.totalScore = Object.values(this.saveData.levels)
      .reduce((sum, lp) => sum + lp.bestScore, 0);

    this.saveSave();
    this.screen = 'levelComplete';
    this.levelCompleteAnim = 0;
    this.buildButtons();
    playDecryptSuccess();
    spawnParticles(CANVAS_W / 2, CANVAS_H / 2, 40, 'decrypt');
  }

  // ─── Main Loop ────────────────────────────────────────────────

  start(): void {
    this.buildButtons();
    this.lastTime = performance.now();
    this.animating = true;
    requestAnimationFrame((t) => this.loop(t));
  }

  private loop(timestamp: number): void {
    if (!this.animating) return;

    const dt = Math.min(0.05, (timestamp - this.lastTime) / 1000);
    this.lastTime = timestamp;
    this.time += dt;

    this.update(dt);
    this.render(dt);

    requestAnimationFrame((t) => this.loop(t));
  }

  private update(dt: number): void {
    // Cursor blink
    this.cursorTimer += dt;
    if (this.cursorTimer > 0.5) {
      this.cursorBlink = !this.cursorBlink;
      this.cursorTimer = 0;
    }

    // Level timer
    if (this.screen === 'playing') {
      this.levelTime += dt;
    }

    // Level complete animation
    if (this.screen === 'levelComplete') {
      this.levelCompleteAnim = Math.min(1, this.levelCompleteAnim + dt * 1.5);
    }

    // Shake decay
    if (this.shakeTimer > 0) {
      this.shakeTimer -= dt;
    }

    // Particles
    updateParticles(dt);
  }

  private render(dt: number): void {
    const ctx = this.ctx;

    // Shake offset
    let shakeX = 0;
    let shakeY = 0;
    if (this.shakeTimer > 0) {
      shakeX = (Math.random() - 0.5) * this.shakeIntensity * 2;
      shakeY = (Math.random() - 0.5) * this.shakeIntensity * 2;
    }

    ctx.save();
    ctx.translate(shakeX, shakeY);

    // Clear
    ctx.fillStyle = COLORS.bg;
    ctx.fillRect(-10, -10, CANVAS_W + 20, CANVAS_H + 20);

    // Screen content
    switch (this.screen) {
      case 'title':
        drawTitleScreen(ctx, this.time, this.buttons);
        break;
      case 'levelSelect':
        drawLevelSelectScreen(ctx, this.time, this.saveData, this.buttons, this.hoveredLevel);
        break;
      case 'playing':
        this.renderPlaying(ctx, dt);
        break;
      case 'levelComplete':
        this.renderPlaying(ctx, dt);
        drawLevelCompleteScreen(
          ctx, this.time, this.currentLevel!.id,
          this.levelScore, this.levelStars, this.levelTime,
          this.hintsUsed, this.currentLevel!.answer,
          this.levelCompleteAnim, this.buttons
        );
        break;
      case 'gameComplete':
        drawGameCompleteScreen(ctx, this.time, this.saveData.totalScore, this.buttons);
        break;
    }

    // Particles (always on top)
    drawParticles(ctx);

    // Global effects
    drawMorseDecoration(ctx, dt);
    drawScanlines(ctx);
    drawCRTCurvature(ctx);
    drawScreenBorder(ctx);

    // Flicker
    const flickerAlpha = updateFlicker(dt);
    drawFlicker(ctx, flickerAlpha);

    ctx.restore();
  }

  private getTutorialInfo(): TutorialInfo | null {
    if (!this.currentLevel) return null;
    const cipherType = this.currentLevel.steps && this.currentStep < this.currentLevel.steps.length
      ? this.currentLevel.steps[this.currentStep].cipherType
      : this.currentLevel.cipherType;

    switch (cipherType) {
      case 'caesar': {
        const shift = this.currentLevel.cipherParam ?? 3;
        return {
          title: 'CIFRARIO DI CESARE',
          lines: [
            `Ogni lettera e\u0300 stata spostata di ${shift} posizioni nell'alfabeto.`,
            'Per decifrare, sposta ogni lettera indietro dello stesso numero.',
            'Decifra il messaggio e digita la risposta.',
          ],
          example: `A\u2192${String.fromCharCode(65 + (typeof shift === 'number' ? shift : 3))}, B\u2192${String.fromCharCode(66 + (typeof shift === 'number' ? shift : 3))}, C\u2192${String.fromCharCode(67 + (typeof shift === 'number' ? shift : 3))}...`,
        };
      }
      case 'reverse':
        return {
          title: 'TESTO INVERTITO',
          lines: [
            'Il messaggio e\u0300 scritto al contrario.',
            'Leggi le lettere da destra a sinistra per rivelarlo.',
            'Decifra il messaggio e digita la risposta.',
          ],
          example: 'CIAO \u2192 OAIC',
        };
      case 'a1z26':
        return {
          title: 'CIFRARIO A1Z26',
          lines: [
            'Ogni lettera e\u0300 sostituita dal suo numero nell\'alfabeto.',
            'A=1, B=2, C=3, ... Z=26.',
            'Converti i numeri in lettere e digita la risposta.',
          ],
          example: '1=A, 2=B, 3=C ... 26=Z',
        };
      case 'keyword':
        return {
          title: 'CIFRARIO A SOSTITUZIONE',
          lines: [
            'L\'alfabeto cifrato inizia con una parola chiave,',
            'poi continua con le lettere rimanenti.',
            'Usa la tabella per decifrare ogni lettera.',
          ],
          example: `Chiave: ${this.currentLevel.cipherParam}`,
        };
      case 'morse':
        return {
          title: 'CODICE MORSE',
          lines: [
            'Ogni lettera e\u0300 codificata con punti e linee.',
            'Usa la tabella di riferimento per decodificare.',
            'Digita la parola corrispondente.',
          ],
          example: '.- = A, -... = B, -.-. = C',
        };
      case 'atbash':
        return {
          title: 'CIFRARIO ATBASH',
          lines: [
            'L\'alfabeto viene invertito: A\u2194Z, B\u2194Y, C\u2194X...',
            'Ogni lettera viene sostituita col suo speculare.',
            'Usa la tabella per decifrare.',
          ],
          example: 'A\u2194Z, B\u2194Y, C\u2194X, D\u2194W...',
        };
      case 'vigenere':
        return {
          title: 'CIFRARIO DI VIGENERE',
          lines: [
            'Una chiave ciclica sposta ogni lettera di un valore diverso.',
            'Incrocia la riga della chiave con la colonna del testo cifrato.',
            'La chiave si ripete per tutta la lunghezza del messaggio.',
          ],
          example: `Chiave: ${this.currentLevel.cipherParam}`,
        };
      case 'multi':
        return {
          title: 'CIFRATURA MULTIPLA',
          lines: [
            'Il messaggio e\u0300 cifrato con piu\u0300 metodi in sequenza.',
            'Decifra un passaggio alla volta nell\'ordine indicato.',
            'Completa tutti i passaggi per rivelare il messaggio.',
          ],
        };
      default:
        return null;
    }
  }

  private renderPlaying(ctx: CanvasRenderingContext2D, dt: number): void {
    if (!this.currentLevel) return;
    const level = this.currentLevel;

    // HUD with level indicator
    drawHUD(ctx, level.id, level.title, this.levelScore, this.levelTime, this.hintsUsed, LEVELS.length);

    // Tool description
    drawToolDescription(ctx, level.toolDescription);

    // Encrypted message display
    const encrypted = this.getCurrentEncrypted();
    drawEncryptedMessage(ctx, encrypted, this.time);

    // Cipher-specific tool visualization with label
    this.renderCipherTool(ctx, level, dt);

    // Input label
    drawInputLabel(ctx);

    // Typewriter input
    const answer = this.getCurrentAnswer();
    drawTypewriterInput(ctx, this.playerInput, answer, this.cursorBlink, this.time);

    // Buttons (exit, hint, tutorial)
    for (const btn of this.buttons) {
      drawButton(ctx, btn);
    }

    // Multi-step progress
    if (level.steps) {
      drawMultiStepProgress(
        ctx, 30, 450,
        level.steps.map((s, i) => ({
          description: s.description,
          completed: this.stepCompleted[i] || false,
        })),
        this.currentStep
      );
    }

    // Frequency analysis (for relevant cipher types)
    if (['caesar', 'keyword', 'atbash', 'vigenere'].includes(level.cipherType)) {
      drawFrequencyChart(ctx, 850, 520, encrypted);
    }

    // Tutorial overlay (on top of everything)
    if (this.showTutorial) {
      const tutorial = this.getTutorialInfo();
      if (tutorial) {
        drawTutorialPanel(ctx, tutorial, this.time);
      }
    }
  }

  private renderCipherTool(ctx: CanvasRenderingContext2D, level: LevelDef, dt: number): void {
    const currentCipherType = level.steps && this.currentStep < level.steps.length
      ? level.steps[this.currentStep].cipherType
      : level.cipherType;

    const currentParam = level.steps && this.currentStep < level.steps.length
      ? level.steps[this.currentStep].param
      : level.cipherParam;

    switch (currentCipherType) {
      case 'caesar': {
        const shift = typeof currentParam === 'number' ? currentParam : 3;
        drawCipherToolLabel(ctx, 300, 280, `RUOTA DI CESARE (Spostamento: ${shift})`);
        drawCaesarWheel(ctx, 300, 420, shift, undefined, Math.sin(this.time * 0.5) * 0.3);
        // Also draw a second wheel for ROT7
        if (shift >= 5) {
          drawCaesarWheel(ctx, 600, 420, shift, undefined, Math.sin(this.time * 0.5 + 1) * 0.3);
        }
        break;
      }

      case 'reverse':
        drawCipherToolLabel(ctx, CANVAS_W / 2, 280, 'SPECCHIO — Leggi al contrario');
        drawMirror(ctx, CANVAS_W / 2, 380, this.getCurrentEncrypted(), this.time);
        break;

      case 'a1z26': {
        const nums = this.getCurrentEncrypted().split('-').map((n) => parseInt(n, 10)).filter((n) => !isNaN(n));
        drawCipherToolLabel(ctx, 400, 262, 'TABELLA NUMERI-LETTERE — Ogni numero = una lettera');
        drawNumberGrid(ctx, 180, 280, nums);
        break;
      }

      case 'keyword': {
        const keyword = typeof currentParam === 'string' ? currentParam : 'ROMA';
        drawCipherToolLabel(ctx, 400, 282, `TABELLA DI SOSTITUZIONE — Chiave: ${keyword}`);
        drawSubstitutionTable(ctx, 100, 300, keyword);
        break;
      }

      case 'morse':
        drawCipherToolLabel(ctx, 400, 262, 'TABELLA CODICE MORSE — Punti e linee');
        drawMorseReference(ctx, 120, 280);
        break;

      case 'atbash':
        drawCipherToolLabel(ctx, 400, 282, 'TABELLA ATBASH — Alfabeto inverso');
        drawAtbashTable(ctx, 100, 300);
        break;

      case 'vigenere': {
        const key = typeof currentParam === 'string' ? currentParam : 'LUX';
        drawCipherToolLabel(ctx, 300, 262, `GRIGLIA DI VIGENERE — Chiave: ${key}`);
        drawVigenereGrid(ctx, 100, 280, key);
        break;
      }

      case 'multi':
        // Show tool for current step
        if (level.steps && this.currentStep < level.steps.length) {
          const step = level.steps[this.currentStep];
          this.renderCipherTool(ctx, {
            ...level,
            cipherType: step.cipherType,
            cipherParam: step.param,
            steps: undefined,
          } as LevelDef, dt);
        }
        break;
    }
  }
}
