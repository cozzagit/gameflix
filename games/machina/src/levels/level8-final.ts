// ============================================================
// Level 8 — La Macchina Finale (The Final Machine)
// Rube Goldberg: set gear, lever, mirror, valve. Press START.
// ============================================================

import { MechanismLevel, C, GAME_W, GAME_H } from '../types';
import {
  drawBackground, drawMetalPanel, drawFrame, drawHUD,
  drawBrushedMetal, drawRivet, drawCornerRivets, drawGear,
  roundRect, lighten, darken, dist, drawTitle, normalizeAngle
} from '../renderer';
import { EffectsEngine } from '../effects';
import {
  playGearGrind, playLeverClick, playClank, playSteamHiss,
  playSuccess, playHeavyClunk, playElectricalBuzz, playFluidFlow
} from '../audio';

// Sub-mechanism positions
const GEAR_CX = 200;
const GEAR_CY = 300;
const LEVER_X = 380;
const LEVER_Y = 350;
const MIRROR_X = 580;
const MIRROR_Y = 280;
const VALVE_X = 780;
const VALVE_Y = 350;
const DOOR_X = 950;
const DOOR_Y = 250;
const START_BTN_X = GAME_W / 2 - 60;
const START_BTN_Y = GAME_H - 110;
const START_BTN_W = 120;
const START_BTN_H = 45;

export class Level8Final implements MechanismLevel {
  id = 8;
  name = 'La Macchina Finale';
  subtitle = 'Prepara la macchina e premi AVVIA';
  moves = 0;
  elapsed = 0;
  solved = false;

  // Sub-mechanism states
  private gearAngle = 0; // target: PI/2 (90 degrees)
  private leverUp = false;
  private mirrorAngle = 0; // 0 or 1 (target: 1 = 45 degrees)
  private valveOpen = false;

  // Interaction
  private draggingGear = false;
  private lastGearDragAngle = 0;

  // Chain reaction animation
  private chainActive = false;
  private chainPhase = 0; // 0-5 phases
  private chainTimer = 0;

  // Visual states during chain
  private ballY = 0;
  private ballVisible = false;
  private beamActive = false;
  private steamActive = false;
  private doorOpen = 0;

  private effects = new EffectsEngine();
  private solveAnim = 0;

  init(): void {
    this.moves = 0;
    this.elapsed = 0;
    this.solved = false;
    this.solveAnim = 0;
    this.gearAngle = 0;
    this.leverUp = false;
    this.mirrorAngle = 0;
    this.valveOpen = false;
    this.draggingGear = false;
    this.chainActive = false;
    this.chainPhase = 0;
    this.chainTimer = 0;
    this.ballY = 0;
    this.ballVisible = false;
    this.beamActive = false;
    this.steamActive = false;
    this.doorOpen = 0;
    this.effects.clear();
  }

  reset(): void {
    this.init();
  }

  /** Check if all sub-mechanisms are in correct position */
  private isReady(): boolean {
    const gearOk = Math.abs(normalizeAngle(this.gearAngle) - Math.PI / 2) < 0.2;
    return gearOk && this.leverUp && this.mirrorAngle === 1 && this.valveOpen;
  }

  isSolved(): boolean {
    return this.solved;
  }

  onPointerDown(x: number, y: number): void {
    if (this.solved || this.chainActive) return;

    // Gear drag
    if (dist(x, y, GEAR_CX, GEAR_CY) < 60) {
      this.draggingGear = true;
      this.lastGearDragAngle = Math.atan2(y - GEAR_CY, x - GEAR_CX);
      return;
    }

    // Lever toggle
    if (x >= LEVER_X - 25 && x <= LEVER_X + 25 && y >= LEVER_Y - 60 && y <= LEVER_Y + 60) {
      this.leverUp = !this.leverUp;
      this.moves++;
      playLeverClick();
      return;
    }

    // Mirror toggle
    if (dist(x, y, MIRROR_X, MIRROR_Y) < 30) {
      this.mirrorAngle = (this.mirrorAngle + 1) % 2;
      this.moves++;
      playClank();
      return;
    }

    // Valve toggle
    if (dist(x, y, VALVE_X, VALVE_Y) < 30) {
      this.valveOpen = !this.valveOpen;
      this.moves++;
      playClank();
      return;
    }

    // START button
    if (x >= START_BTN_X && x <= START_BTN_X + START_BTN_W &&
        y >= START_BTN_Y && y <= START_BTN_Y + START_BTN_H) {
      if (this.isReady()) {
        this.chainActive = true;
        this.chainPhase = 0;
        this.chainTimer = 0;
        this.moves++;
        playHeavyClunk();
      } else {
        // Wrong configuration - error feedback
        this.effects.emitSparks(START_BTN_X + START_BTN_W / 2, START_BTN_Y + START_BTN_H / 2, 5);
        playClank();
      }
    }
  }

  onPointerMove(x: number, y: number): void {
    if (this.draggingGear && !this.chainActive) {
      const angle = Math.atan2(y - GEAR_CY, x - GEAR_CX);
      let delta = angle - this.lastGearDragAngle;
      if (delta > Math.PI) delta -= Math.PI * 2;
      if (delta < -Math.PI) delta += Math.PI * 2;
      this.gearAngle += delta;
      this.lastGearDragAngle = angle;
    }
  }

  onPointerUp(): void {
    if (this.draggingGear) {
      this.draggingGear = false;
      this.moves++;
    }
  }

  update(dt: number): void {
    if (!this.solved) {
      this.elapsed += dt;
    }

    // Chain reaction phases
    if (this.chainActive) {
      this.chainTimer += dt;

      switch (this.chainPhase) {
        case 0: // Gear turns and drops ball
          this.gearAngle += dt * 2;
          if (this.chainTimer > 1.0) {
            this.ballVisible = true;
            this.chainPhase = 1;
            this.chainTimer = 0;
            playGearGrind();
          }
          break;
        case 1: // Ball falls
          this.ballY += dt * 300;
          if (this.chainTimer > 0.8) {
            this.chainPhase = 2;
            this.chainTimer = 0;
            playClank();
            this.effects.emitSparks(LEVER_X, LEVER_Y - 40, 8);
          }
          break;
        case 2: // Lever activates mirror/beam
          this.beamActive = true;
          if (this.chainTimer > 0.8) {
            this.chainPhase = 3;
            this.chainTimer = 0;
            playElectricalBuzz();
            this.effects.emitGlow(MIRROR_X, MIRROR_Y, C.WARM_LIGHT, 10);
          }
          break;
        case 3: // Beam heats pipe, steam rises
          this.steamActive = true;
          if (this.chainTimer > 1.0) {
            this.chainPhase = 4;
            this.chainTimer = 0;
            playSteamHiss();
            playFluidFlow();
          }
          break;
        case 4: // Steam pressure opens door
          this.doorOpen = Math.min(1, this.doorOpen + dt * 0.8);
          if (this.doorOpen >= 0.95) {
            this.chainPhase = 5;
            this.chainTimer = 0;
            this.solved = true;
            playSuccess();
            playHeavyClunk();
            this.effects.emitSparks(DOOR_X, DOOR_Y + 50, 30);
            this.effects.emitGlow(DOOR_X, DOOR_Y + 50, C.WARM_LIGHT, 25);
          }
          break;
      }

      // Continuous effects during chain
      if (this.steamActive) {
        this.effects.emitSteam(VALVE_X, VALVE_Y - 30, 1);
      }
    }

    if (this.solved) {
      this.solveAnim = Math.min(1, this.solveAnim + dt * 0.4);
    }

    this.effects.update(dt);
  }

  render(ctx: CanvasRenderingContext2D): void {
    drawBackground(ctx);

    // Main panel
    const panelX = 40;
    const panelY = 60;
    const panelW = GAME_W - 80;
    const panelH = GAME_H - 100;
    drawMetalPanel(ctx, panelX, panelY, panelW, panelH, '#1A1A28', 10);
    drawFrame(ctx, panelX, panelY, panelW, panelH, 10);

    // Connection lines between mechanisms
    ctx.save();
    ctx.strokeStyle = 'rgba(100,100,120,0.4)';
    ctx.lineWidth = 2;
    ctx.setLineDash([5, 5]);
    // Gear -> Lever
    ctx.beginPath();
    ctx.moveTo(GEAR_CX + 50, GEAR_CY);
    ctx.lineTo(LEVER_X, LEVER_Y);
    ctx.stroke();
    // Lever -> Mirror
    ctx.beginPath();
    ctx.moveTo(LEVER_X + 30, LEVER_Y);
    ctx.lineTo(MIRROR_X, MIRROR_Y);
    ctx.stroke();
    // Mirror -> Valve
    ctx.beginPath();
    ctx.moveTo(MIRROR_X + 30, MIRROR_Y);
    ctx.lineTo(VALVE_X, VALVE_Y);
    ctx.stroke();
    // Valve -> Door
    ctx.beginPath();
    ctx.moveTo(VALVE_X + 30, VALVE_Y);
    ctx.lineTo(DOOR_X, DOOR_Y + 50);
    ctx.stroke();
    ctx.setLineDash([]);
    ctx.restore();

    // ---- 1. GEAR SUB-MECHANISM ----
    this.renderGear(ctx);

    // ---- 2. LEVER SUB-MECHANISM ----
    this.renderLever(ctx);

    // ---- 3. MIRROR SUB-MECHANISM ----
    this.renderMirror(ctx);

    // ---- 4. VALVE SUB-MECHANISM ----
    this.renderValve(ctx);

    // ---- 5. DOOR ----
    this.renderDoor(ctx);

    // Ball animation
    if (this.ballVisible && this.chainPhase >= 1 && this.chainPhase < 3) {
      ctx.save();
      const ballX = GEAR_CX + 50 + (LEVER_X - GEAR_CX - 50) * Math.min(1, this.ballY / 200);
      const ballDrawY = GEAR_CY - 30 + this.ballY;
      ctx.shadowColor = 'rgba(0,0,0,0.5)';
      ctx.shadowBlur = 4;
      const bGrad = ctx.createRadialGradient(ballX - 3, ballDrawY - 3, 0, ballX, ballDrawY, 8);
      bGrad.addColorStop(0, '#DDDDDD');
      bGrad.addColorStop(1, '#666666');
      ctx.fillStyle = bGrad;
      ctx.beginPath();
      ctx.arc(ballX, Math.min(ballDrawY, LEVER_Y - 40), 8, 0, Math.PI * 2);
      ctx.fill();
      ctx.restore();
    }

    // Light beam animation
    if (this.beamActive) {
      ctx.save();
      ctx.strokeStyle = C.WARM_LIGHT;
      ctx.shadowColor = C.WARM_LIGHT;
      ctx.shadowBlur = 12;
      ctx.lineWidth = 3;
      ctx.globalAlpha = 0.7;
      // Beam from mirror to valve area
      ctx.beginPath();
      ctx.moveTo(MIRROR_X + 20, MIRROR_Y);
      ctx.lineTo(VALVE_X - 20, MIRROR_Y);
      ctx.lineTo(VALVE_X - 20, VALVE_Y - 20);
      ctx.stroke();
      ctx.restore();
    }

    // Status indicators
    this.renderStatusPanel(ctx);

    // START button
    ctx.save();
    const ready = this.isReady() && !this.chainActive;
    const btnColor = this.chainActive ? '#2A2A3A' : (ready ? '#2A5A2A' : '#5A2A2A');
    drawMetalPanel(ctx, START_BTN_X, START_BTN_Y, START_BTN_W, START_BTN_H, btnColor, 6);
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.font = 'bold 18px "Georgia", serif';
    ctx.fillStyle = this.chainActive ? C.TEXT_DIM : (ready ? C.GREEN_GLOW : C.RED_GLOW);
    ctx.fillText(this.chainActive ? 'IN CORSO...' : 'AVVIA', START_BTN_X + START_BTN_W / 2, START_BTN_Y + START_BTN_H / 2);
    ctx.restore();

    // Solve celebration
    if (this.solved && this.solveAnim > 0.3) {
      ctx.save();
      ctx.globalAlpha = Math.min(1, (this.solveAnim - 0.3) * 2);
      drawTitle(ctx, 'MACHINA COMPLETA', GAME_W / 2, GAME_H / 2 - 50, 48, C.WARM_LIGHT);
      ctx.restore();
    }

    // Hint
    if (!this.chainActive && !this.solved && this.moves === 0) {
      ctx.save();
      ctx.textAlign = 'center';
      ctx.font = 'italic 13px "Georgia", serif';
      ctx.fillStyle = C.TEXT_DIM;
      ctx.fillText('Configura ogni meccanismo correttamente, poi premi AVVIA', GAME_W / 2, GAME_H - 55);
      ctx.restore();
    }

    this.effects.render(ctx);
    drawHUD(ctx, this.name, this.subtitle, this.moves, this.elapsed);
  }

  private renderGear(ctx: CanvasRenderingContext2D): void {
    // Label
    ctx.save();
    ctx.textAlign = 'center';
    ctx.font = 'bold 12px "Georgia", serif';
    ctx.fillStyle = C.BRONZE;
    ctx.fillText('INGRANAGGIO', GEAR_CX, GEAR_CY - 65);
    ctx.font = 'italic 10px "Georgia", serif';
    ctx.fillStyle = C.TEXT_DIM;
    ctx.fillText('(Ruota a 90\u00B0)', GEAR_CX, GEAR_CY - 52);
    ctx.restore();

    drawGear(ctx, GEAR_CX, GEAR_CY, 45, 33, 10, this.gearAngle, C.BRONZE, -Math.PI / 2);

    // Current angle indicator
    const angleDeg = Math.round((normalizeAngle(this.gearAngle) * 180) / Math.PI);
    ctx.save();
    ctx.textAlign = 'center';
    ctx.font = '11px "Georgia", serif';
    ctx.fillStyle = C.TEXT_DIM;
    ctx.fillText(`${angleDeg}\u00B0`, GEAR_CX, GEAR_CY + 55);
    ctx.restore();
  }

  private renderLever(ctx: CanvasRenderingContext2D): void {
    // Label
    ctx.save();
    ctx.textAlign = 'center';
    ctx.font = 'bold 12px "Georgia", serif';
    ctx.fillStyle = C.BRONZE;
    ctx.fillText('LEVA', LEVER_X, LEVER_Y - 65);
    ctx.font = 'italic 10px "Georgia", serif';
    ctx.fillStyle = C.TEXT_DIM;
    ctx.fillText('(Porta in alto)', LEVER_X, LEVER_Y - 52);
    ctx.restore();

    // Lever slot
    ctx.save();
    ctx.fillStyle = '#0A0A14';
    roundRect(ctx, LEVER_X - 12, LEVER_Y - 40, 24, 80, 3);
    ctx.fill();

    // Lever handle
    const leverHandleY = this.leverUp ? LEVER_Y - 30 : LEVER_Y + 20;
    const shaftGrad = ctx.createLinearGradient(LEVER_X - 4, 0, LEVER_X + 4, 0);
    shaftGrad.addColorStop(0, darken(C.BRASS, 20));
    shaftGrad.addColorStop(0.5, lighten(C.BRASS, 10));
    shaftGrad.addColorStop(1, darken(C.BRASS, 20));
    ctx.fillStyle = shaftGrad;
    ctx.fillRect(LEVER_X - 4, leverHandleY, 8, LEVER_Y + 40 - leverHandleY);

    // Ball top
    const ballGrad = ctx.createRadialGradient(LEVER_X - 3, leverHandleY - 3, 0, LEVER_X, leverHandleY, 10);
    ballGrad.addColorStop(0, lighten(C.BRASS, 40));
    ballGrad.addColorStop(1, darken(C.BRASS, 30));
    ctx.fillStyle = ballGrad;
    ctx.beginPath();
    ctx.arc(LEVER_X, leverHandleY, 10, 0, Math.PI * 2);
    ctx.fill();

    // Status indicator
    ctx.fillStyle = this.leverUp ? C.GREEN_GLOW : C.RED_GLOW;
    ctx.shadowColor = this.leverUp ? C.GREEN_GLOW : C.RED_GLOW;
    ctx.shadowBlur = 6;
    ctx.beginPath();
    ctx.arc(LEVER_X, LEVER_Y + 50, 4, 0, Math.PI * 2);
    ctx.fill();
    ctx.shadowBlur = 0;
    ctx.restore();
  }

  private renderMirror(ctx: CanvasRenderingContext2D): void {
    // Label
    ctx.save();
    ctx.textAlign = 'center';
    ctx.font = 'bold 12px "Georgia", serif';
    ctx.fillStyle = C.BRONZE;
    ctx.fillText('SPECCHIO', MIRROR_X, MIRROR_Y - 50);
    ctx.font = 'italic 10px "Georgia", serif';
    ctx.fillStyle = C.TEXT_DIM;
    ctx.fillText('(Angola a 45\u00B0)', MIRROR_X, MIRROR_Y - 37);
    ctx.restore();

    // Mirror base
    ctx.save();
    ctx.translate(MIRROR_X, MIRROR_Y);

    const baseGrad = ctx.createRadialGradient(0, 0, 0, 0, 0, 18);
    baseGrad.addColorStop(0, '#555555');
    baseGrad.addColorStop(1, '#333333');
    ctx.fillStyle = baseGrad;
    ctx.beginPath();
    ctx.arc(0, 0, 18, 0, Math.PI * 2);
    ctx.fill();

    // Mirror surface
    const mirAngle = this.mirrorAngle === 0 ? 0 : -Math.PI / 4;
    ctx.rotate(mirAngle);
    const mirGrad = ctx.createLinearGradient(-18, 0, 18, 0);
    mirGrad.addColorStop(0, '#CCCCDD');
    mirGrad.addColorStop(0.5, '#FFFFFF');
    mirGrad.addColorStop(1, '#AAAACC');
    ctx.fillStyle = mirGrad;
    ctx.fillRect(-18, -2, 36, 4);
    ctx.strokeStyle = '#888888';
    ctx.lineWidth = 1;
    ctx.strokeRect(-18, -2, 36, 4);

    ctx.restore();

    // Status
    ctx.save();
    ctx.fillStyle = this.mirrorAngle === 1 ? C.GREEN_GLOW : C.RED_GLOW;
    ctx.shadowColor = this.mirrorAngle === 1 ? C.GREEN_GLOW : C.RED_GLOW;
    ctx.shadowBlur = 6;
    ctx.beginPath();
    ctx.arc(MIRROR_X, MIRROR_Y + 35, 4, 0, Math.PI * 2);
    ctx.fill();
    ctx.shadowBlur = 0;
    ctx.restore();
  }

  private renderValve(ctx: CanvasRenderingContext2D): void {
    // Label
    ctx.save();
    ctx.textAlign = 'center';
    ctx.font = 'bold 12px "Georgia", serif';
    ctx.fillStyle = C.BRONZE;
    ctx.fillText('VALVOLA', VALVE_X, VALVE_Y - 50);
    ctx.font = 'italic 10px "Georgia", serif';
    ctx.fillStyle = C.TEXT_DIM;
    ctx.fillText('(Apri)', VALVE_X, VALVE_Y - 37);
    ctx.restore();

    // Valve body (pipe section)
    ctx.save();
    const pipeGrad = ctx.createLinearGradient(VALVE_X - 25, 0, VALVE_X + 25, 0);
    pipeGrad.addColorStop(0, darken(C.COPPER, 20));
    pipeGrad.addColorStop(0.3, lighten(C.COPPER, 10));
    pipeGrad.addColorStop(0.7, C.COPPER);
    pipeGrad.addColorStop(1, darken(C.COPPER, 20));
    ctx.fillStyle = pipeGrad;
    ctx.fillRect(VALVE_X - 25, VALVE_Y - 10, 50, 20);

    // Valve wheel
    ctx.translate(VALVE_X, VALVE_Y);
    ctx.rotate(this.valveOpen ? Math.PI / 2 : 0);

    ctx.strokeStyle = this.valveOpen ? '#44AA44' : '#AA4444';
    ctx.lineWidth = 4;
    ctx.beginPath();
    ctx.arc(0, 0, 15, 0, Math.PI * 2);
    ctx.stroke();

    // Wheel spokes
    for (let i = 0; i < 4; i++) {
      const a = (i / 4) * Math.PI * 2;
      ctx.beginPath();
      ctx.moveTo(0, 0);
      ctx.lineTo(Math.cos(a) * 15, Math.sin(a) * 15);
      ctx.stroke();
    }

    // Center
    ctx.fillStyle = '#666666';
    ctx.beginPath();
    ctx.arc(0, 0, 5, 0, Math.PI * 2);
    ctx.fill();

    ctx.restore();

    // Status
    ctx.save();
    ctx.fillStyle = this.valveOpen ? C.GREEN_GLOW : C.RED_GLOW;
    ctx.shadowColor = this.valveOpen ? C.GREEN_GLOW : C.RED_GLOW;
    ctx.shadowBlur = 6;
    ctx.beginPath();
    ctx.arc(VALVE_X, VALVE_Y + 35, 4, 0, Math.PI * 2);
    ctx.fill();
    ctx.shadowBlur = 0;
    ctx.restore();
  }

  private renderDoor(ctx: CanvasRenderingContext2D): void {
    // Door frame
    ctx.save();
    const dw = 80;
    const dh = 120;
    const dx = DOOR_X - dw / 2;
    const dy = DOOR_Y;

    // Frame
    drawBrushedMetal(ctx, dx - 6, dy - 6, dw + 12, dh + 12, '#5A4A2A');

    // Door background (what's behind)
    if (this.doorOpen > 0) {
      ctx.fillStyle = C.WARM_LIGHT;
      ctx.shadowColor = C.WARM_LIGHT;
      ctx.shadowBlur = 20 * this.doorOpen;
      ctx.globalAlpha = this.doorOpen;
      ctx.fillRect(dx, dy, dw, dh);
      ctx.shadowBlur = 0;
      ctx.globalAlpha = 1;
    }

    // Door panel (slides open to the right)
    const doorSlide = this.doorOpen * dw;
    if (doorSlide < dw) {
      const doorGrad = ctx.createLinearGradient(dx, dy, dx + dw - doorSlide, dy + dh);
      doorGrad.addColorStop(0, '#5A5A6A');
      doorGrad.addColorStop(0.5, '#4A4A5A');
      doorGrad.addColorStop(1, '#3A3A4A');
      ctx.fillStyle = doorGrad;
      ctx.fillRect(dx, dy, dw - doorSlide, dh);

      // Handle on door
      if (dw - doorSlide > 20) {
        const hx = dx + (dw - doorSlide) / 2;
        drawRivet(ctx, hx, dy + dh / 2, 4);
      }
    }

    // Label
    ctx.textAlign = 'center';
    ctx.font = 'bold 12px "Georgia", serif';
    ctx.fillStyle = C.BRONZE;
    ctx.fillText('PORTA', DOOR_X, dy - 15);

    ctx.restore();
  }

  private renderStatusPanel(ctx: CanvasRenderingContext2D): void {
    // Small status panel at bottom showing readiness
    const spX = 100;
    const spY = GAME_H - 115;
    const spW = 250;
    const spH = 50;

    drawMetalPanel(ctx, spX, spY, spW, spH, '#1A1A28', 4);

    ctx.save();
    ctx.font = '11px "Georgia", serif';
    ctx.textBaseline = 'middle';

    const items = [
      { label: 'Ingranaggio', ok: Math.abs(normalizeAngle(this.gearAngle) - Math.PI / 2) < 0.2 },
      { label: 'Leva', ok: this.leverUp },
      { label: 'Specchio', ok: this.mirrorAngle === 1 },
      { label: 'Valvola', ok: this.valveOpen },
    ];

    items.forEach((item, i) => {
      const ix = spX + 15 + i * 60;
      ctx.textAlign = 'center';
      ctx.fillStyle = item.ok ? C.GREEN_GLOW : C.RED_GLOW;
      ctx.fillText(item.ok ? '\u2713' : '\u2717', ix + 20, spY + 18);
      ctx.fillStyle = C.TEXT_DIM;
      ctx.font = '9px "Georgia", serif';
      ctx.fillText(item.label, ix + 20, spY + 35);
      ctx.font = '11px "Georgia", serif';
    });

    ctx.restore();
  }
}
