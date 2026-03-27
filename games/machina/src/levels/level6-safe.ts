// ============================================================
// Level 6 — La Cassaforte (The Safe)
// Combination safe dial. Rotate dial to enter R37-L15-R42.
// ============================================================

import { MechanismLevel, C, GAME_W, GAME_H } from '../types';
import {
  drawBackground, drawMetalPanel, drawFrame, drawHUD,
  drawBrushedMetal, drawRivet, drawCornerRivets,
  roundRect, lighten, darken, dist
} from '../renderer';
import { EffectsEngine } from '../effects';
import { playDialTick, playSuccess, playHeavyClunk, playClank } from '../audio';

const DIAL_CX = GAME_W / 2;
const DIAL_CY = GAME_H / 2 + 20;
const DIAL_R = 150;
const NUM_TICKS = 50;

// Combination: R37, L15, R42
const COMBO = [37, 15, 42];
const COMBO_DIRS = [1, -1, 1]; // 1=right(CW), -1=left(CCW)

export class Level6Safe implements MechanismLevel {
  id = 6;
  name = 'La Cassaforte';
  subtitle = 'Inserisci la combinazione';
  moves = 0;
  elapsed = 0;
  solved = false;

  private dialAngle = 0; // Current dial angle in radians
  private dragging = false;
  private lastDragAngle = 0;
  private currentNumber = 0; // What number the dial points to
  private comboStep = 0; // 0, 1, 2
  private enteredNumbers: number[] = [];
  private lastTickNumber = 0;
  private effects = new EffectsEngine();
  private solveAnim = 0;
  private doorAnim = 0;
  private handleAnim = 0;
  private rotationAccum = 0; // accumulated rotation since last combo step
  private prevNumber = 0;
  private dwellTime = 0; // time spent on correct number while slow
  private dragSpeed = 0;
  private readonly DWELL_THRESHOLD = 0.35; // seconds to dwell

  init(): void {
    this.moves = 0;
    this.elapsed = 0;
    this.solved = false;
    this.solveAnim = 0;
    this.doorAnim = 0;
    this.handleAnim = 0;
    this.dialAngle = 0;
    this.dragging = false;
    this.currentNumber = 0;
    this.comboStep = 0;
    this.enteredNumbers = [];
    this.lastTickNumber = 0;
    this.rotationAccum = 0;
    this.prevNumber = 0;
    this.dwellTime = 0;
    this.dragSpeed = 0;
    this.effects.clear();
  }

  reset(): void {
    this.init();
  }

  private angleToNumber(angle: number): number {
    // Normalize angle to [0, 2PI)
    let a = (-angle) % (Math.PI * 2);
    if (a < 0) a += Math.PI * 2;
    const num = Math.round((a / (Math.PI * 2)) * NUM_TICKS) % NUM_TICKS;
    return num;
  }

  isSolved(): boolean {
    return this.solved;
  }

  onPointerDown(x: number, y: number): void {
    if (this.solved) return;
    const d = dist(x, y, DIAL_CX, DIAL_CY);
    if (d <= DIAL_R + 20) {
      this.dragging = true;
      this.lastDragAngle = Math.atan2(y - DIAL_CY, x - DIAL_CX);
    }
  }

  onPointerMove(x: number, y: number): void {
    if (!this.dragging || this.solved) return;

    const angle = Math.atan2(y - DIAL_CY, x - DIAL_CX);
    let delta = angle - this.lastDragAngle;
    if (delta > Math.PI) delta -= Math.PI * 2;
    if (delta < -Math.PI) delta += Math.PI * 2;

    this.dialAngle += delta;
    this.lastDragAngle = angle;
    this.rotationAccum += delta;

    // Update current number
    const newNum = this.angleToNumber(this.dialAngle);
    if (newNum !== this.lastTickNumber) {
      playDialTick();
      this.lastTickNumber = newNum;
    }
    this.prevNumber = this.currentNumber;
    this.currentNumber = newNum;
    this.dragSpeed = Math.abs(delta);
  }

  onPointerUp(): void {
    this.dragging = false;
  }

  private tryComboStep(): void {
    if (this.comboStep >= 3) return;
    const expectedDir = COMBO_DIRS[this.comboStep];
    const minRotation = Math.PI / 2;
    const rotationCorrect = this.comboStep === 0
      ? Math.abs(this.rotationAccum) > minRotation
      : (expectedDir === 1 ? this.rotationAccum > minRotation : this.rotationAccum < -minRotation);

    if (rotationCorrect) {
      this.enteredNumbers.push(this.currentNumber);
      this.comboStep++;
      this.moves++;
      this.rotationAccum = 0;
      this.dwellTime = 0;
      playClank();
      this.effects.emitSparks(DIAL_CX, DIAL_CY - DIAL_R - 10, 5);

      if (this.comboStep >= 3) {
        this.solved = true;
        setTimeout(() => {
          playSuccess();
          playHeavyClunk();
        }, 300);
        this.effects.emitSparks(DIAL_CX, DIAL_CY, 20);
        this.effects.emitGlow(DIAL_CX, DIAL_CY, C.WARM_LIGHT, 15);
      }
    }
  }

  update(dt: number): void {
    if (!this.solved) {
      this.elapsed += dt;
      this.dragSpeed *= 0.85; // decay speed

      // Dwell check: on correct number + slow movement
      const onTarget = this.comboStep < 3 && this.currentNumber === COMBO[this.comboStep];
      const isSettled = this.dragSpeed < 0.015;

      if (onTarget && isSettled) {
        this.dwellTime += dt;
      } else {
        this.dwellTime = 0;
      }

      if (this.dwellTime >= this.DWELL_THRESHOLD) {
        this.tryComboStep();
      }
    } else {
      this.solveAnim = Math.min(1, this.solveAnim + dt * 0.5);
      this.handleAnim = Math.min(1, this.handleAnim + dt * 0.8);
      if (this.handleAnim >= 0.8) {
        this.doorAnim = Math.min(1, this.doorAnim + dt * 0.5);
      }
    }
    this.effects.update(dt);
  }

  render(ctx: CanvasRenderingContext2D): void {
    drawBackground(ctx);

    // Safe body
    const safeX = GAME_W / 2 - 250;
    const safeY = 100;
    const safeW = 500;
    const safeH = 600;

    // Safe door
    ctx.save();
    ctx.shadowColor = 'rgba(0,0,0,0.6)';
    ctx.shadowBlur = 15;
    ctx.shadowOffsetX = 5;
    ctx.shadowOffsetY = 5;

    const doorGrad = ctx.createLinearGradient(safeX, safeY, safeX + safeW, safeY + safeH);
    doorGrad.addColorStop(0, '#5A5A6A');
    doorGrad.addColorStop(0.3, '#4A4A5A');
    doorGrad.addColorStop(0.7, '#3A3A4A');
    doorGrad.addColorStop(1, '#2A2A3A');
    ctx.fillStyle = doorGrad;
    roundRect(ctx, safeX, safeY, safeW, safeH, 8);
    ctx.fill();
    ctx.shadowBlur = 0;

    // Safe border
    ctx.strokeStyle = '#6A6A7A';
    ctx.lineWidth = 3;
    roundRect(ctx, safeX, safeY, safeW, safeH, 8);
    ctx.stroke();

    // Corner rivets on safe
    drawCornerRivets(ctx, safeX, safeY, safeW, safeH, 20, 5);
    // Extra rivets
    drawRivet(ctx, safeX + safeW / 2, safeY + 20, 4);
    drawRivet(ctx, safeX + safeW / 2, safeY + safeH - 20, 4);

    // Hinges on left side
    for (let i = 0; i < 3; i++) {
      const hy = safeY + 80 + i * 200;
      ctx.fillStyle = '#3A3A3A';
      ctx.fillRect(safeX - 5, hy - 15, 15, 30);
      drawRivet(ctx, safeX + 2, hy - 8, 3);
      drawRivet(ctx, safeX + 2, hy + 8, 3);
    }
    ctx.restore();

    // Clue area (top of safe)
    // Clock showing 3 and 7 -> 37
    ctx.save();
    ctx.textAlign = 'center';
    ctx.font = 'italic 14px "Georgia", serif';
    ctx.fillStyle = 'rgba(200,180,130,0.4)';
    ctx.fillText('III VII', safeX + safeW - 70, safeY + 50);
    ctx.fillText('XV', safeX + 70, safeY + safeH - 50);
    ctx.fillText('XLII', safeX + safeW - 70, safeY + safeH - 50);
    ctx.restore();

    // Dial background (chrome circle)
    ctx.save();
    ctx.shadowColor = 'rgba(0,0,0,0.5)';
    ctx.shadowBlur = 12;
    ctx.shadowOffsetX = 3;
    ctx.shadowOffsetY = 3;

    const dialBg = ctx.createRadialGradient(
      DIAL_CX - DIAL_R * 0.2, DIAL_CY - DIAL_R * 0.2, 0,
      DIAL_CX, DIAL_CY, DIAL_R + 15
    );
    dialBg.addColorStop(0, '#CCCCDD');
    dialBg.addColorStop(0.3, '#AAAABB');
    dialBg.addColorStop(0.7, '#888899');
    dialBg.addColorStop(1, '#555566');
    ctx.fillStyle = dialBg;
    ctx.beginPath();
    ctx.arc(DIAL_CX, DIAL_CY, DIAL_R + 15, 0, Math.PI * 2);
    ctx.fill();
    ctx.shadowBlur = 0;
    ctx.restore();

    // Dial face
    ctx.save();
    const dialFace = ctx.createRadialGradient(
      DIAL_CX - DIAL_R * 0.15, DIAL_CY - DIAL_R * 0.15, 0,
      DIAL_CX, DIAL_CY, DIAL_R
    );
    dialFace.addColorStop(0, '#222233');
    dialFace.addColorStop(1, '#111122');
    ctx.fillStyle = dialFace;
    ctx.beginPath();
    ctx.arc(DIAL_CX, DIAL_CY, DIAL_R, 0, Math.PI * 2);
    ctx.fill();

    // Tick marks and numbers
    for (let i = 0; i < NUM_TICKS; i++) {
      const a = (i / NUM_TICKS) * Math.PI * 2 - Math.PI / 2;
      const isMajor = i % 5 === 0;
      const innerR = isMajor ? DIAL_R - 25 : DIAL_R - 15;
      const outerR = DIAL_R - 5;

      ctx.strokeStyle = isMajor ? '#CCCCDD' : '#666677';
      ctx.lineWidth = isMajor ? 2 : 1;
      ctx.beginPath();
      ctx.moveTo(
        DIAL_CX + Math.cos(a + this.dialAngle) * innerR,
        DIAL_CY + Math.sin(a + this.dialAngle) * innerR
      );
      ctx.lineTo(
        DIAL_CX + Math.cos(a + this.dialAngle) * outerR,
        DIAL_CY + Math.sin(a + this.dialAngle) * outerR
      );
      ctx.stroke();

      // Numbers at major ticks
      if (isMajor) {
        const numR = DIAL_R - 38;
        ctx.textAlign = 'center';
        ctx.textBaseline = 'middle';
        ctx.font = 'bold 16px "Georgia", serif';
        ctx.fillStyle = '#CCCCDD';
        ctx.fillText(
          `${i}`,
          DIAL_CX + Math.cos(a + this.dialAngle) * numR,
          DIAL_CY + Math.sin(a + this.dialAngle) * numR
        );
      }
    }

    // Center knob
    const knobGrad = ctx.createRadialGradient(
      DIAL_CX - 5, DIAL_CY - 5, 0,
      DIAL_CX, DIAL_CY, 25
    );
    knobGrad.addColorStop(0, '#BBBBCC');
    knobGrad.addColorStop(0.5, '#888899');
    knobGrad.addColorStop(1, '#444455');
    ctx.fillStyle = knobGrad;
    ctx.beginPath();
    ctx.arc(DIAL_CX, DIAL_CY, 25, 0, Math.PI * 2);
    ctx.fill();

    // Pointer/marker at top
    ctx.fillStyle = C.RED_GLOW;
    ctx.shadowColor = C.RED_GLOW;
    ctx.shadowBlur = 6;
    ctx.beginPath();
    ctx.moveTo(DIAL_CX, DIAL_CY - DIAL_R - 15);
    ctx.lineTo(DIAL_CX - 8, DIAL_CY - DIAL_R - 28);
    ctx.lineTo(DIAL_CX + 8, DIAL_CY - DIAL_R - 28);
    ctx.closePath();
    ctx.fill();
    ctx.shadowBlur = 0;
    ctx.restore();

    // Current number display
    ctx.save();
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.font = 'bold 36px "Georgia", serif';
    ctx.fillStyle = C.WARM_LIGHT;
    ctx.fillText(`${this.currentNumber}`, DIAL_CX, DIAL_CY - DIAL_R - 50);
    ctx.restore();

    // Combo progress display
    ctx.save();
    ctx.textAlign = 'center';
    ctx.font = '16px "Georgia", serif';
    const comboY = safeY + 80;
    for (let i = 0; i < 3; i++) {
      const dir = COMBO_DIRS[i] === 1 ? 'D' : 'S';
      const label = `${dir}:`;
      const isComplete = i < this.comboStep;
      const isCurrent = i === this.comboStep;

      ctx.fillStyle = isComplete ? C.GREEN_GLOW : (isCurrent ? C.WARM_LIGHT : C.TEXT_DIM);
      ctx.fillText(
        isComplete ? `${label}${this.enteredNumbers[i]} \u2713` : (isCurrent ? `${label}??` : `${label}--`),
        DIAL_CX + (i - 1) * 100,
        comboY
      );
    }
    ctx.restore();

    // Direction hint
    if (!this.solved && this.comboStep < 3) {
      ctx.save();
      ctx.textAlign = 'center';
      ctx.font = 'italic 14px "Georgia", serif';
      ctx.fillStyle = C.TEXT_DIM;
      const dirText = COMBO_DIRS[this.comboStep] === 1 ? 'Ruota a DESTRA' : 'Ruota a SINISTRA';
      ctx.fillText(dirText, DIAL_CX, safeY + 110);
      ctx.restore();
    }

    // Handle (right side of safe)
    ctx.save();
    const handleX = safeX + safeW - 70;
    const handleY = DIAL_CY + 180;
    const handleRotation = this.handleAnim * Math.PI / 2;

    ctx.translate(handleX, handleY);
    ctx.rotate(handleRotation);

    // Handle bar
    const hGrad = ctx.createLinearGradient(-40, -8, -40, 8);
    hGrad.addColorStop(0, '#AAAAAA');
    hGrad.addColorStop(0.5, '#777777');
    hGrad.addColorStop(1, '#444444');
    ctx.fillStyle = hGrad;
    ctx.fillRect(-40, -8, 80, 16);

    // Handle knob
    const kGrad = ctx.createRadialGradient(-2, -2, 0, 0, 0, 10);
    kGrad.addColorStop(0, '#CCCCCC');
    kGrad.addColorStop(1, '#555555');
    ctx.fillStyle = kGrad;
    ctx.beginPath();
    ctx.arc(0, 0, 10, 0, Math.PI * 2);
    ctx.fill();

    ctx.restore();

    // Door open animation
    if (this.doorAnim > 0) {
      ctx.save();
      ctx.globalAlpha = this.doorAnim * 0.6;
      const glowGrad = ctx.createRadialGradient(DIAL_CX, DIAL_CY, 20, DIAL_CX, DIAL_CY, 250);
      glowGrad.addColorStop(0, C.WARM_LIGHT);
      glowGrad.addColorStop(1, 'rgba(255,215,0,0)');
      ctx.fillStyle = glowGrad;
      ctx.fillRect(safeX, safeY, safeW, safeH);
      ctx.restore();
    }

    // Hint
    if (!this.solved && this.moves === 0) {
      ctx.save();
      ctx.textAlign = 'center';
      ctx.font = 'italic 14px "Georgia", serif';
      ctx.fillStyle = C.TEXT_DIM;
      ctx.fillText('Trascina la manopola per ruotare. Cerca gli indizi romani sulla cassaforte.', GAME_W / 2, GAME_H - 55);
      ctx.restore();
    }

    this.effects.render(ctx);
    drawHUD(ctx, this.name, this.subtitle, this.moves, this.elapsed);
  }
}
