import {
  W, H, PLAYER_SPEED, PLAYER_RADIUS, CRYSTAL_RADIUS, EXIT_RADIUS,
  GameState, LevelResult, TrailPoint, CaveLevel,
} from './types';
import { LEVELS } from './cave';
import { SonarSystem } from './sonar';
import { EffectsSystem } from './effects';
import { Renderer } from './renderer';
import { ScreenRenderer } from './screens';
import {
  playSonarPing, playCrystalChime, playHazardBuzz,
  playLevelComplete, playFail, startAmbient, stopAmbient, playStep,
} from './audio';

export class Game {
  private canvas: HTMLCanvasElement;
  private renderer: Renderer;
  private screens: ScreenRenderer;
  private sonar: SonarSystem;
  private effects: EffectsSystem;

  private state: GameState = 'title';
  private currentLevel: number = 0;
  private level: CaveLevel | null = null;

  // Player state
  private px: number = 0;
  private py: number = 0;
  private targetX: number = 0;
  private targetY: number = 0;
  private moving: boolean = false;
  private trail: TrailPoint[] = [];
  private lastStepTime: number = 0;

  // Game state
  private pulsesUsed: number = 0;
  private crystalsCollected: number = 0;
  private levelStartTime: number = 0;
  private gameTime: number = 0;
  private lastFrameTime: number = 0;

  // Input
  private keys: Set<string> = new Set();
  private hoveredLevel: number = -1;

  // Results
  private levelResults: Map<number, LevelResult> = new Map();
  private lastResult: LevelResult | null = null;
  private gameOverReason: string = '';

  // Tutorial
  private tutorialAlpha: number = 1;
  private tutorialShown: boolean = false;

  constructor(canvas: HTMLCanvasElement) {
    this.canvas = canvas;
    this.renderer = new Renderer(canvas);
    this.screens = new ScreenRenderer(canvas);
    this.sonar = new SonarSystem();
    this.effects = new EffectsSystem();

    this.loadResults();
    this.bindInput();
    this.lastFrameTime = performance.now() / 1000;
    this.loop();
  }

  private loadResults(): void {
    try {
      const saved = localStorage.getItem('eco_results');
      if (saved) {
        const arr: [number, LevelResult][] = JSON.parse(saved);
        this.levelResults = new Map(arr);
      }
    } catch (_) { /* ignore */ }
  }

  private saveResults(): void {
    try {
      const arr = Array.from(this.levelResults.entries());
      localStorage.setItem('eco_results', JSON.stringify(arr));
    } catch (_) { /* ignore */ }
  }

  private bindInput(): void {
    window.addEventListener('keydown', (e) => {
      this.keys.add(e.key);
      if (e.key === 'Escape') {
        if (this.state === 'playing') {
          this.state = 'levelSelect';
          stopAmbient();
        } else if (this.state === 'levelSelect') {
          this.state = 'title';
        }
      }
    });

    window.addEventListener('keyup', (e) => {
      this.keys.delete(e.key);
    });

    this.canvas.addEventListener('mousemove', (e) => {
      const rect = this.canvas.getBoundingClientRect();
      const scaleX = W / rect.width;
      const scaleY = H / rect.height;
      const mx = (e.clientX - rect.left) * scaleX;
      const my = (e.clientY - rect.top) * scaleY;

      if (this.state === 'levelSelect') {
        this.hoveredLevel = this.screens.getLevelAt(mx, my);
      }
    });

    this.canvas.addEventListener('click', (e) => {
      const rect = this.canvas.getBoundingClientRect();
      const scaleX = W / rect.width;
      const scaleY = H / rect.height;
      const mx = (e.clientX - rect.left) * scaleX;
      const my = (e.clientY - rect.top) * scaleY;

      this.handleClick(mx, my);
    });
  }

  private handleClick(mx: number, my: number): void {
    switch (this.state) {
      case 'title':
        this.state = 'levelSelect';
        break;

      case 'levelSelect': {
        const idx = this.screens.getLevelAt(mx, my);
        if (idx >= 0) {
          const unlocked = idx === 0 || this.levelResults.has(idx - 1);
          if (unlocked) {
            this.startLevel(idx);
          }
        }
        break;
      }

      case 'playing':
        this.emitPulse();
        break;

      case 'levelComplete':
        if (this.lastResult) {
          if (this.lastResult.level < LEVELS.length - 1) {
            this.startLevel(this.lastResult.level + 1);
          } else {
            this.state = 'levelSelect';
          }
        }
        break;

      case 'gameOver':
        this.startLevel(this.currentLevel);
        break;
    }
  }

  private startLevel(idx: number): void {
    this.currentLevel = idx;
    this.level = deepCloneLevel(LEVELS[idx]);
    this.px = this.level.playerStart.x;
    this.py = this.level.playerStart.y;
    this.targetX = this.px;
    this.targetY = this.py;
    this.moving = false;
    this.pulsesUsed = 0;
    this.crystalsCollected = 0;
    this.trail = [];
    this.tutorialAlpha = this.level.tutorialText ? 1 : 0;
    this.tutorialShown = false;
    this.sonar.reset();
    this.effects.reset();
    this.levelStartTime = this.gameTime;
    this.state = 'playing';
    startAmbient();
  }

  private emitPulse(): void {
    if (!this.level) return;
    if (this.pulsesUsed >= this.level.maxPulses) return;

    this.pulsesUsed++;
    this.sonar.emitWave(this.px, this.py, this.gameTime);
    playSonarPing();

    // Fade tutorial after first pulse
    if (!this.tutorialShown) {
      this.tutorialShown = true;
    }
  }

  private loop = (): void => {
    const now = performance.now() / 1000;
    const dt = Math.min(now - this.lastFrameTime, 0.05);
    this.lastFrameTime = now;
    this.gameTime = now;

    this.update(dt);
    this.render();
    requestAnimationFrame(this.loop);
  };

  private update(dt: number): void {
    if (this.state !== 'playing' || !this.level) return;

    // ── Player movement via WASD / arrows ──
    let dx = 0;
    let dy = 0;
    if (this.keys.has('w') || this.keys.has('W') || this.keys.has('ArrowUp')) dy -= 1;
    if (this.keys.has('s') || this.keys.has('S') || this.keys.has('ArrowDown')) dy += 1;
    if (this.keys.has('a') || this.keys.has('A') || this.keys.has('ArrowLeft')) dx -= 1;
    if (this.keys.has('d') || this.keys.has('D') || this.keys.has('ArrowRight')) dx += 1;

    if (dx !== 0 || dy !== 0) {
      const len = Math.sqrt(dx * dx + dy * dy);
      dx /= len;
      dy /= len;
      const newX = this.px + dx * PLAYER_SPEED * dt;
      const newY = this.py + dy * PLAYER_SPEED * dt;

      if (!this.collidesWithWall(newX, newY)) {
        this.px = newX;
        this.py = newY;

        // Trail
        if (this.gameTime - this.lastStepTime > 0.15) {
          this.trail.push({ x: this.px, y: this.py, time: this.gameTime });
          this.lastStepTime = this.gameTime;
          if (this.trail.length % 4 === 0) playStep();
        }
      }
    }

    // Clamp to canvas
    this.px = Math.max(PLAYER_RADIUS, Math.min(W - PLAYER_RADIUS, this.px));
    this.py = Math.max(PLAYER_RADIUS, Math.min(H - PLAYER_RADIUS, this.py));

    // Clean old trail
    this.trail = this.trail.filter(t => this.gameTime - t.time < 3);

    // ── Sonar system ──
    this.sonar.update(dt, this.gameTime, this.level.walls);

    // ── Effects ──
    this.effects.update(dt);

    // Spawn dust near revealed walls occasionally
    if (Math.random() < 0.1) {
      for (const rw of this.sonar.revealedWalls.values()) {
        if (rw.brightness > 0.3 && Math.random() < 0.05) {
          const t = Math.random();
          const wx = rw.wall.x1 + (rw.wall.x2 - rw.wall.x1) * t;
          const wy = rw.wall.y1 + (rw.wall.y2 - rw.wall.y1) * t;
          this.effects.spawnDust(wx, wy);
        }
        // Water ripples
        if (rw.wall.type === 'water' && rw.brightness > 0.4 && Math.random() < 0.03) {
          const t = Math.random();
          const wx = rw.wall.x1 + (rw.wall.x2 - rw.wall.x1) * t;
          const wy = rw.wall.y1 + (rw.wall.y2 - rw.wall.y1) * t;
          this.effects.spawnWaterRipple(wx, wy);
        }
      }
    }

    // Exit particles
    const exitRevealed = this.isNearRevealed(this.level.exit.x, this.level.exit.y, 250);
    if (exitRevealed && Math.random() < 0.15) {
      this.effects.spawnExitParticle(
        this.level.exit.x, this.level.exit.y, this.level.exit.radius,
      );
    }

    // ── Crystal collection ──
    for (const c of this.level.crystals) {
      if (c.collected) continue;
      const dist = Math.sqrt((this.px - c.x) ** 2 + (this.py - c.y) ** 2);
      if (dist < PLAYER_RADIUS + CRYSTAL_RADIUS) {
        c.collected = true;
        this.crystalsCollected++;
        playCrystalChime();
        this.effects.spawnCrystalSparkle(c.x, c.y);
      }
    }

    // ── Hazard check ──
    for (const h of this.level.hazards) {
      const dist = Math.sqrt((this.px - h.x) ** 2 + (this.py - h.y) ** 2);
      if (dist < PLAYER_RADIUS + h.radius) {
        playHazardBuzz();
        playFail();
        stopAmbient();
        this.gameOverReason = 'Hai colpito un ostacolo!';
        this.state = 'gameOver';
        return;
      }
    }

    // ── Exit check ──
    const exitDist = Math.sqrt(
      (this.px - this.level.exit.x) ** 2 +
      (this.py - this.level.exit.y) ** 2,
    );
    if (exitDist < PLAYER_RADIUS + EXIT_RADIUS) {
      this.completeLevel();
      return;
    }

    // ── Out of pulses check ──
    // Only fail if out of pulses AND no waves alive AND no revealed walls
    if (this.pulsesUsed >= this.level.maxPulses &&
        this.sonar.waves.length === 0 &&
        this.sonar.revealedWalls.size === 0) {
      // Give player a chance — don't immediately fail
      // They can still move in darkness if they remember the layout
    }

    // Tutorial fade
    if (this.tutorialShown) {
      this.tutorialAlpha = Math.max(0, this.tutorialAlpha - dt * 0.3);
    }
  }

  private isNearRevealed(x: number, y: number, range: number): boolean {
    for (const rw of this.sonar.revealedWalls.values()) {
      if (rw.brightness < 0.05) continue;
      const mx = (rw.wall.x1 + rw.wall.x2) / 2;
      const my = (rw.wall.y1 + rw.wall.y2) / 2;
      const dist = Math.sqrt((x - mx) ** 2 + (y - my) ** 2);
      if (dist < range) return true;
    }
    return false;
  }

  private collidesWithWall(nx: number, ny: number): boolean {
    if (!this.level) return false;
    const r = PLAYER_RADIUS;

    for (const w of this.level.walls) {
      const dist = pointToSegmentDist(nx, ny, w.x1, w.y1, w.x2, w.y2);
      if (dist < r + 2) {
        return true;
      }
    }
    return false;
  }

  private completeLevel(): void {
    if (!this.level) return;
    stopAmbient();
    playLevelComplete();

    const timeElapsed = this.gameTime - this.levelStartTime;
    const totalCrystals = this.level.crystals.length;
    const remaining = this.level.maxPulses - this.pulsesUsed;

    let score = 100; // base
    score += this.crystalsCollected * 25;
    score += remaining * 20;
    if (timeElapsed < 30) score += 50;
    else if (timeElapsed < 60) score += 25;

    // Stars
    let stars = 1;
    if (this.crystalsCollected === totalCrystals && remaining >= 2) {
      stars = 3;
    } else if (remaining >= 1 || this.crystalsCollected >= Math.ceil(totalCrystals / 2)) {
      stars = 2;
    }

    const result: LevelResult = {
      level: this.currentLevel,
      score,
      stars,
      crystalsCollected: this.crystalsCollected,
      crystalsTotal: totalCrystals,
      pulsesRemaining: remaining,
      timeSeconds: timeElapsed,
    };

    // Keep best result
    const prev = this.levelResults.get(this.currentLevel);
    if (!prev || result.score > prev.score) {
      this.levelResults.set(this.currentLevel, result);
    }
    this.lastResult = result;
    this.saveResults();

    // Report score to Gameflix
    this.reportScore(score);

    this.state = 'levelComplete';
  }

  private reportScore(score: number): void {
    try {
      window.parent.postMessage({ type: 'GAME_SCORE', score }, '*');
    } catch (_) { /* not in iframe */ }
  }

  private render(): void {
    this.renderer.setTime(this.gameTime);

    switch (this.state) {
      case 'title':
        this.screens.drawTitle(this.gameTime);
        break;

      case 'levelSelect':
        this.screens.drawLevelSelect(this.gameTime, this.levelResults, this.hoveredLevel);
        break;

      case 'playing':
        this.renderGame();
        break;

      case 'levelComplete':
        this.renderGame();
        if (this.lastResult) {
          this.screens.drawLevelComplete(this.lastResult, this.gameTime);
        }
        break;

      case 'gameOver':
        this.renderGame();
        this.screens.drawGameOver(this.gameOverReason, this.gameTime);
        break;
    }
  }

  private renderGame(): void {
    if (!this.level) return;

    this.renderer.clear();

    // Draw revealed walls
    this.renderer.drawRevealedWalls(this.sonar.revealedWalls);

    // Draw sonar waves
    this.renderer.drawWaves(this.sonar.waves);

    // Draw hazards
    this.renderer.drawHazards(this.level.hazards, this.sonar.revealedWalls);

    // Draw crystals
    this.renderer.drawCrystals(this.level.crystals, this.sonar.revealedWalls);

    // Draw exit
    this.renderer.drawExit(
      this.level.exit.x, this.level.exit.y, this.level.exit.radius,
      this.sonar.revealedWalls,
    );

    // Draw particles
    this.renderer.drawParticles(this.effects.particles);

    // Draw player
    this.renderer.drawPlayer(this.px, this.py, this.trail);

    // Draw HUD
    const timeElapsed = this.gameTime - this.levelStartTime;
    this.renderer.drawHUD(
      this.pulsesUsed,
      this.level.maxPulses,
      this.crystalsCollected,
      this.level.crystals.length,
      this.level.name,
      timeElapsed,
      0,
    );

    // Draw tutorial
    if (this.level.tutorialText && this.tutorialAlpha > 0) {
      this.renderer.drawTutorial(this.level.tutorialText, this.tutorialAlpha);
    }
  }
}

// ── Helpers ─────────────────────────────────────────────────

function pointToSegmentDist(
  px: number, py: number,
  x1: number, y1: number,
  x2: number, y2: number,
): number {
  const dx = x2 - x1;
  const dy = y2 - y1;
  const lenSq = dx * dx + dy * dy;
  if (lenSq < 0.001) return Math.sqrt((px - x1) ** 2 + (py - y1) ** 2);

  let t = ((px - x1) * dx + (py - y1) * dy) / lenSq;
  t = Math.max(0, Math.min(1, t));

  const closestX = x1 + t * dx;
  const closestY = y1 + t * dy;
  return Math.sqrt((px - closestX) ** 2 + (py - closestY) ** 2);
}

function deepCloneLevel(level: CaveLevel): CaveLevel {
  return {
    ...level,
    walls: level.walls.map(w => ({ ...w })),
    crystals: level.crystals.map(c => ({ ...c })),
    hazards: level.hazards.map(h => ({ ...h })),
    exit: { ...level.exit },
    playerStart: { ...level.playerStart },
  };
}
