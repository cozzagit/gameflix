// ============================================================
// Level 2 — Le Leve (The Levers)
// 5 levers in Lights Out style. Toggle lever + neighbors.
// ============================================================

import { MechanismLevel, C, GAME_W, GAME_H } from '../types';
import {
  drawBackground, drawMetalPanel, drawFrame, drawHUD,
  drawBrushedMetal, drawRivet, drawCornerRivets, drawSubtitle,
  roundRect, easeOutCubic, lighten, darken
} from '../renderer';
import { EffectsEngine } from '../effects';
import { playLeverClick, playSuccess, playHeavyClunk } from '../audio';

const NUM_LEVERS = 5;
const LEVER_SPACING = 120;
const LEVER_START_X = GAME_W / 2 - (NUM_LEVERS - 1) * LEVER_SPACING / 2;
const LEVER_Y = GAME_H / 2 + 20;
const LEVER_SLOT_W = 30;
const LEVER_SLOT_H = 120;
const LEVER_BALL_R = 16;

export class Level2Levers implements MechanismLevel {
  id = 2;
  name = 'Le Leve';
  subtitle = 'Porta tutte le leve in alto';
  moves = 0;
  elapsed = 0;
  solved = false;

  private levers: boolean[] = []; // true = UP
  private leverAnim: number[] = []; // 0 = down, 1 = up, animated
  private effects = new EffectsEngine();
  private solveAnim = 0;

  init(): void {
    this.moves = 0;
    this.elapsed = 0;
    this.solved = false;
    this.solveAnim = 0;
    this.effects.clear();

    // Generate a solvable starting config (apply 3-5 random toggles from all-up)
    this.levers = [true, true, true, true, true];
    this.leverAnim = [1, 1, 1, 1, 1];
    const toggleCount = 3 + Math.floor(Math.random() * 3);
    for (let i = 0; i < toggleCount; i++) {
      const idx = Math.floor(Math.random() * NUM_LEVERS);
      this.applyToggle(idx);
    }
    // Make sure it's not already solved
    if (this.levers.every(l => l)) {
      this.applyToggle(2);
    }
    // Snap animations to state
    for (let i = 0; i < NUM_LEVERS; i++) {
      this.leverAnim[i] = this.levers[i] ? 1 : 0;
    }
  }

  reset(): void {
    this.init();
  }

  private applyToggle(idx: number): void {
    this.levers[idx] = !this.levers[idx];
    if (idx > 0) this.levers[idx - 1] = !this.levers[idx - 1];
    if (idx < NUM_LEVERS - 1) this.levers[idx + 1] = !this.levers[idx + 1];
  }

  isSolved(): boolean {
    return this.solved || this.levers.every(l => l);
  }

  onPointerDown(x: number, y: number): void {
    if (this.solved) return;

    for (let i = 0; i < NUM_LEVERS; i++) {
      const lx = LEVER_START_X + i * LEVER_SPACING;
      if (x >= lx - LEVER_SLOT_W && x <= lx + LEVER_SLOT_W &&
          y >= LEVER_Y - LEVER_SLOT_H / 2 - 20 && y <= LEVER_Y + LEVER_SLOT_H / 2 + 20) {
        this.applyToggle(i);
        this.moves++;
        playLeverClick();
        this.effects.emitSparks(lx, LEVER_Y, 4);

        if (this.isSolved()) {
          this.solved = true;
          setTimeout(() => {
            playSuccess();
            playHeavyClunk();
          }, 200);
          for (let j = 0; j < NUM_LEVERS; j++) {
            this.effects.emitGlow(
              LEVER_START_X + j * LEVER_SPACING,
              LEVER_Y - LEVER_SLOT_H / 2,
              C.WARM_LIGHT, 8
            );
          }
        }
        break;
      }
    }
  }

  onPointerMove(_x: number, _y: number): void { }
  onPointerUp(): void { }

  update(dt: number): void {
    if (!this.solved) {
      this.elapsed += dt;
    } else {
      this.solveAnim = Math.min(1, this.solveAnim + dt * 0.8);
    }

    // Animate levers
    for (let i = 0; i < NUM_LEVERS; i++) {
      const target = this.levers[i] ? 1 : 0;
      const diff = target - this.leverAnim[i];
      this.leverAnim[i] += diff * Math.min(1, dt * 12);
    }

    this.effects.update(dt);
  }

  render(ctx: CanvasRenderingContext2D): void {
    drawBackground(ctx);

    // Main panel
    const panelX = 100;
    const panelY = 80;
    const panelW = GAME_W - 200;
    const panelH = GAME_H - 130;
    drawMetalPanel(ctx, panelX, panelY, panelW, panelH, '#1A1A28', 10);
    drawFrame(ctx, panelX, panelY, panelW, panelH, 10);

    // Status indicators above levers
    for (let i = 0; i < NUM_LEVERS; i++) {
      const lx = LEVER_START_X + i * LEVER_SPACING;
      const indicatorY = LEVER_Y - LEVER_SLOT_H / 2 - 50;

      // Indicator light
      ctx.save();
      const isUp = this.leverAnim[i] > 0.5;
      const glowColor = isUp ? C.GREEN_GLOW : C.RED_GLOW;
      ctx.shadowColor = glowColor;
      ctx.shadowBlur = isUp ? 12 : 4;
      ctx.fillStyle = isUp ? '#00CC66' : '#882222';
      ctx.beginPath();
      ctx.arc(lx, indicatorY, 8, 0, Math.PI * 2);
      ctx.fill();
      ctx.shadowBlur = 0;
      ctx.restore();
    }

    // Draw lever slots and levers
    for (let i = 0; i < NUM_LEVERS; i++) {
      const lx = LEVER_START_X + i * LEVER_SPACING;
      const anim = this.leverAnim[i];

      // Slot background
      ctx.save();
      const slotGrad = ctx.createLinearGradient(lx - LEVER_SLOT_W / 2, 0, lx + LEVER_SLOT_W / 2, 0);
      slotGrad.addColorStop(0, '#0A0A14');
      slotGrad.addColorStop(0.3, '#181828');
      slotGrad.addColorStop(0.7, '#181828');
      slotGrad.addColorStop(1, '#0A0A14');
      ctx.fillStyle = slotGrad;
      roundRect(ctx, lx - LEVER_SLOT_W / 2, LEVER_Y - LEVER_SLOT_H / 2, LEVER_SLOT_W, LEVER_SLOT_H, 4);
      ctx.fill();

      // Slot border
      ctx.strokeStyle = '#333340';
      ctx.lineWidth = 1;
      roundRect(ctx, lx - LEVER_SLOT_W / 2, LEVER_Y - LEVER_SLOT_H / 2, LEVER_SLOT_W, LEVER_SLOT_H, 4);
      ctx.stroke();
      ctx.restore();

      // Lever handle (moves along slot)
      const leverY = LEVER_Y + LEVER_SLOT_H / 2 - 20 - anim * (LEVER_SLOT_H - 40);

      // Lever shaft
      ctx.save();
      const shaftGrad = ctx.createLinearGradient(lx - 5, 0, lx + 5, 0);
      shaftGrad.addColorStop(0, darken(C.BRASS, 20));
      shaftGrad.addColorStop(0.5, lighten(C.BRASS, 10));
      shaftGrad.addColorStop(1, darken(C.BRASS, 20));
      ctx.fillStyle = shaftGrad;
      ctx.fillRect(lx - 5, leverY, 10, LEVER_Y + LEVER_SLOT_H / 2 - leverY);
      ctx.restore();

      // Lever ball
      ctx.save();
      ctx.shadowColor = 'rgba(0,0,0,0.5)';
      ctx.shadowBlur = 6;
      ctx.shadowOffsetX = 2;
      ctx.shadowOffsetY = 2;

      const ballGrad = ctx.createRadialGradient(
        lx - LEVER_BALL_R * 0.3, leverY - LEVER_BALL_R * 0.3, 0,
        lx, leverY, LEVER_BALL_R
      );
      ballGrad.addColorStop(0, lighten(C.BRASS, 40));
      ballGrad.addColorStop(0.4, C.BRASS);
      ballGrad.addColorStop(1, darken(C.BRASS, 30));
      ctx.fillStyle = ballGrad;
      ctx.beginPath();
      ctx.arc(lx, leverY, LEVER_BALL_R, 0, Math.PI * 2);
      ctx.fill();

      ctx.shadowBlur = 0;
      // Specular highlight
      ctx.fillStyle = 'rgba(255,255,255,0.3)';
      ctx.beginPath();
      ctx.arc(lx - 4, leverY - 5, 4, 0, Math.PI * 2);
      ctx.fill();
      ctx.restore();

      // Label
      ctx.save();
      ctx.textAlign = 'center';
      ctx.textBaseline = 'top';
      ctx.font = 'bold 14px "Georgia", serif';
      ctx.fillStyle = C.TEXT_DIM;
      ctx.fillText(`${i + 1}`, lx, LEVER_Y + LEVER_SLOT_H / 2 + 15);
      ctx.restore();
    }

    // Hint text
    if (!this.solved && this.moves === 0) {
      ctx.save();
      ctx.textAlign = 'center';
      ctx.font = 'italic 14px "Georgia", serif';
      ctx.fillStyle = C.TEXT_DIM;
      ctx.fillText('Clicca una leva per attivarla (cambia anche le adiacenti)', GAME_W / 2, GAME_H - 65);
      ctx.restore();
    }

    // Solve glow
    if (this.solveAnim > 0) {
      ctx.save();
      ctx.globalAlpha = this.solveAnim * 0.4;
      const glow = ctx.createRadialGradient(GAME_W / 2, LEVER_Y, 10, GAME_W / 2, LEVER_Y, 300);
      glow.addColorStop(0, C.WARM_LIGHT);
      glow.addColorStop(1, 'rgba(255,215,0,0)');
      ctx.fillStyle = glow;
      ctx.fillRect(panelX, panelY, panelW, panelH);
      ctx.restore();
    }

    this.effects.render(ctx);
    drawHUD(ctx, this.name, this.subtitle, this.moves, this.elapsed);
  }
}
