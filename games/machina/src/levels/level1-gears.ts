// ============================================================
// Level 1 — L'Ingranaggio (The Gear)
// 3 interlocking gears. Rotate the large gear to align all markers.
// ============================================================

import { MechanismLevel, C, GAME_W, GAME_H } from '../types';
import {
  drawBackground, drawGear, drawMetalPanel, drawFrame,
  drawHUD, drawCornerRivets, drawBrushedMetal, drawTitle,
  drawSubtitle, normalizeAngle, dist
} from '../renderer';
import { EffectsEngine } from '../effects';
import { playGearGrind, playSuccess, playHeavyClunk } from '../audio';

const CX = GAME_W / 2;
const CY = GAME_H / 2 + 30;

// Gear specs: [cx, cy, outerR, innerR, teeth, ratio, markerAngle]
const GEAR_LARGE_R = 120;
const GEAR_LARGE_INNER = 90;
const GEAR_LARGE_TEETH = 16;

const GEAR_MED_R = 80;
const GEAR_MED_INNER = 60;
const GEAR_MED_TEETH = 16;

const GEAR_SMALL_R = 50;
const GEAR_SMALL_INNER = 37;
const GEAR_SMALL_TEETH = 16;

// Gear positions
const LARGE_X = CX - 140;
const LARGE_Y = CY;

const MED_X = LARGE_X + GEAR_LARGE_R + GEAR_MED_R - 8;
const MED_Y = CY;

const SMALL_X = MED_X + GEAR_MED_R + GEAR_SMALL_R - 6;
const SMALL_Y = CY;

// Simple 1:1 ratios — all gears rotate at same speed but alternating direction
// This makes alignment intuitive: rotate until all 3 markers point up
const RATIO_LM = -1;
const RATIO_MS = -1;

export class Level1Gears implements MechanismLevel {
  id = 1;
  name = "L'Ingranaggio";
  subtitle = 'Allinea i marcatori rossi';
  moves = 0;
  elapsed = 0;
  solved = false;

  private largeAngle = 0;
  private dragging = false;
  private lastDragAngle = 0;
  private effects = new EffectsEngine();
  private solveAnim = 0;
  private grindTimer = 0;

  // Dwell time: player must hold alignment for 0.3s to solve
  private alignedTime = 0;
  private readonly DWELL_THRESHOLD = 0.3; // seconds
  private dragSpeed = 0; // radians per second, to detect "settling"

  // Solution: all markers at -PI/2 (top). Start offset.
  private startOffset = Math.PI; // 180 degrees — half turn to solve

  init(): void {
    this.largeAngle = this.startOffset;
    this.dragging = false;
    this.moves = 0;
    this.elapsed = 0;
    this.solved = false;
    this.solveAnim = 0;
    this.alignedTime = 0;
    this.dragSpeed = 0;
    this.effects.clear();
  }

  reset(): void {
    this.init();
  }

  private getMedAngle(): number {
    return this.largeAngle * RATIO_LM;
  }

  private getSmallAngle(): number {
    return this.getMedAngle() * RATIO_MS;
  }

  /** Check if marker at angle (relative to gear rotation) is near top (-PI/2) */
  private isMarkerAligned(gearRotation: number, markerLocalAngle: number): boolean {
    const worldAngle = normalizeAngle(gearRotation + markerLocalAngle);
    const target = normalizeAngle(-Math.PI / 2);
    const diff = Math.abs(worldAngle - target);
    return diff < 0.25 || diff > Math.PI * 2 - 0.25;
  }

  isSolved(): boolean {
    if (this.solved) return true;
    const markerAngle = -Math.PI / 2; // marker is at top of gear in local space
    return (
      this.isMarkerAligned(this.largeAngle, markerAngle) &&
      this.isMarkerAligned(this.getMedAngle(), markerAngle) &&
      this.isMarkerAligned(this.getSmallAngle(), markerAngle)
    );
  }

  onPointerDown(x: number, y: number): void {
    if (this.solved) return;
    const d = dist(x, y, LARGE_X, LARGE_Y);
    if (d <= GEAR_LARGE_R + 10) {
      this.dragging = true;
      this.lastDragAngle = Math.atan2(y - LARGE_Y, x - LARGE_X);
    }
  }

  onPointerMove(x: number, y: number): void {
    if (!this.dragging || this.solved) return;
    const angle = Math.atan2(y - LARGE_Y, x - LARGE_X);
    let delta = angle - this.lastDragAngle;
    // Handle wrap-around
    if (delta > Math.PI) delta -= Math.PI * 2;
    if (delta < -Math.PI) delta += Math.PI * 2;

    this.largeAngle += delta;
    this.lastDragAngle = angle;
    this.dragSpeed = Math.abs(delta); // track how fast user is rotating

    this.grindTimer += Math.abs(delta);
    if (this.grindTimer > 0.15) {
      playGearGrind();
      this.effects.emitDust(
        LARGE_X + Math.cos(angle) * GEAR_LARGE_R,
        LARGE_Y + Math.sin(angle) * GEAR_LARGE_R,
        2
      );
      this.grindTimer = 0;
    }
  }

  onPointerUp(): void {
    if (this.dragging) {
      this.dragging = false;
      this.moves++;
    }
  }

  update(dt: number): void {
    if (!this.solved) {
      this.elapsed += dt;

      // Dwell check: markers must be aligned AND user must be moving slowly (settling)
      const aligned = this.isSolved();
      const isSettled = this.dragSpeed < 0.02; // nearly stopped

      if (aligned && isSettled) {
        this.alignedTime += dt;
      } else {
        this.alignedTime = 0;
      }

      // Decay drag speed when not moving
      this.dragSpeed *= 0.9;

      if (this.alignedTime >= this.DWELL_THRESHOLD) {
        this.solved = true;
        playSuccess();
        playHeavyClunk();
        this.effects.emitSparks(CX, CY, 20);
        this.effects.emitGlow(CX, CY, C.WARM_LIGHT, 15);
      }
    } else {
      this.solveAnim = Math.min(1, this.solveAnim + dt * 0.8);
    }
    this.effects.update(dt);
  }

  render(ctx: CanvasRenderingContext2D): void {
    drawBackground(ctx);

    // Puzzle area panel
    const panelX = 100;
    const panelY = 80;
    const panelW = GAME_W - 200;
    const panelH = GAME_H - 130;
    drawMetalPanel(ctx, panelX, panelY, panelW, panelH, '#1A1A28', 10);
    drawFrame(ctx, panelX, panelY, panelW, panelH, 10);

    // Alignment target line at top
    ctx.save();
    ctx.strokeStyle = 'rgba(255,68,68,0.4)';
    ctx.setLineDash([4, 4]);
    ctx.lineWidth = 1;
    ctx.beginPath();
    ctx.moveTo(LARGE_X, panelY + 20);
    ctx.lineTo(SMALL_X, panelY + 20);
    ctx.stroke();
    ctx.setLineDash([]);

    // "ALLINEA QUI" text
    ctx.textAlign = 'center';
    ctx.font = 'italic 12px "Georgia", serif';
    ctx.fillStyle = 'rgba(255,68,68,0.5)';
    ctx.fillText('ALLINEA QUI \u2193', CX, panelY + 45);
    ctx.restore();

    // Draw target markers at top of each gear position
    for (const gx of [LARGE_X, MED_X, SMALL_X]) {
      ctx.save();
      ctx.fillStyle = 'rgba(255,68,68,0.2)';
      ctx.beginPath();
      ctx.moveTo(gx, panelY + 50);
      ctx.lineTo(gx - 5, panelY + 60);
      ctx.lineTo(gx + 5, panelY + 60);
      ctx.closePath();
      ctx.fill();
      ctx.restore();
    }

    // Draw gears (with solve animation sinking)
    const sinkY = this.solveAnim * 30;
    ctx.save();
    if (this.solveAnim > 0) {
      ctx.globalAlpha = 1 - this.solveAnim * 0.5;
    }

    // Large gear
    drawGear(ctx, LARGE_X, LARGE_Y + sinkY, GEAR_LARGE_R, GEAR_LARGE_INNER,
      GEAR_LARGE_TEETH, this.largeAngle, C.BRONZE, -Math.PI / 2);

    // Medium gear
    drawGear(ctx, MED_X, MED_Y + sinkY, GEAR_MED_R, GEAR_MED_INNER,
      GEAR_MED_TEETH, this.getMedAngle(), C.COPPER, -Math.PI / 2);

    // Small gear
    drawGear(ctx, SMALL_X, SMALL_Y + sinkY, GEAR_SMALL_R, GEAR_SMALL_INNER,
      GEAR_SMALL_TEETH, this.getSmallAngle(), '#9A8B5A', -Math.PI / 2);

    ctx.restore();

    // Solve glow
    if (this.solveAnim > 0) {
      ctx.save();
      ctx.globalAlpha = this.solveAnim * 0.6;
      const glow = ctx.createRadialGradient(CX, CY, 10, CX, CY, 200);
      glow.addColorStop(0, C.WARM_LIGHT);
      glow.addColorStop(1, 'rgba(255,215,0,0)');
      ctx.fillStyle = glow;
      ctx.fillRect(panelX, panelY, panelW, panelH);
      ctx.restore();
    }

    // Interaction hint
    if (!this.solved && this.moves === 0) {
      ctx.save();
      ctx.textAlign = 'center';
      ctx.font = 'italic 14px "Georgia", serif';
      ctx.fillStyle = C.TEXT_DIM;
      ctx.fillText('Trascina l\'ingranaggio grande per ruotare', CX, GAME_H - 65);
      ctx.restore();
    }

    this.effects.render(ctx);

    // HUD
    drawHUD(ctx, this.name, this.subtitle, this.moves, this.elapsed);
  }
}
