// ============================================================
// Level 5 — Gli Specchi (The Mirrors)
// Redirect a light beam using rotatable mirrors to hit a crystal.
// ============================================================

import { MechanismLevel, C, GAME_W, GAME_H } from '../types';
import {
  drawBackground, drawMetalPanel, drawFrame, drawHUD,
  drawBrushedMetal, drawRivet, drawCornerRivets,
  lighten, darken, dist
} from '../renderer';
import { EffectsEngine } from '../effects';
import { playClank, playSuccess, playHeavyClunk } from '../audio';

const AREA_X = 150;
const AREA_Y = 100;
const AREA_W = 900;
const AREA_H = 600;

interface Mirror {
  x: number;
  y: number;
  angle: number; // 0 = / , 1 = \ , 2 = / (same as 0, wraps), 3 = \ (same as 1, wraps)
  animAngle: number;
}

// With 4 cardinal directions and 2 mirror types (/ and \):
// / mirror: right→up, down→left, left→down, up→right
// \ mirror: right→down, up→left, left→up, down→right

interface Obstacle {
  x: number;
  y: number;
  w: number;
  h: number;
}

interface BeamSegment {
  x1: number; y1: number;
  x2: number; y2: number;
}

// Direction: 0=right, 1=down, 2=left, 3=up
type Dir = 0 | 1 | 2 | 3;
const DX: Record<Dir, number> = { 0: 1, 1: 0, 2: -1, 3: 0 };
const DY: Record<Dir, number> = { 0: 0, 1: 1, 2: 0, 3: -1 };

export class Level5Mirrors implements MechanismLevel {
  id = 5;
  name = 'Gli Specchi';
  subtitle = 'Guida la luce verso il cristallo';
  moves = 0;
  elapsed = 0;
  solved = false;

  private mirrors: Mirror[] = [];
  private obstacles: Obstacle[] = [];
  private beam: BeamSegment[] = [];
  private sourceX = AREA_X + 30;
  private sourceY = AREA_Y + 200;
  private targetX = AREA_X + AREA_W - 50;
  private targetY = AREA_Y + AREA_H - 150;
  private effects = new EffectsEngine();
  private solveAnim = 0;
  private crystalPulse = 0;
  private hitTarget = false;

  init(): void {
    this.moves = 0;
    this.elapsed = 0;
    this.solved = false;
    this.solveAnim = 0;
    this.effects.clear();
    this.hitTarget = false;

    // Source at left, y=300. Target at right, y=550.
    // Solution path: source→right→M1(300,300)→down→M2(300,550)→right→M3(700,550)→up→M4(700,300)→right→target
    // M1 needs '\' to go right→down
    // M2 needs '/' to go down→right  (wait: / does down→left, not down→right)
    // Let me recalculate:
    // / mirror: right→up, down→left, left→down, up→right
    // \ mirror: right→down, up→left, left→up, down→right
    // Path: →right hits M1, needs right→down = '\'
    //        ↓down hits M2, needs down→right = impossible with / or \
    // Actually: down→left (/) or down→right (\)... wait no.
    // / : {right→up, down→left, left→down, up→right}
    // \ : {right→down, down→right... no}
    // Let me re-check:
    // / mirror at 45°: incoming right reflects to up, incoming down reflects to left
    // \ mirror at 135°: incoming right reflects to down, incoming up reflects to left
    // So for down→right we need... neither / nor \ does that.
    // \ does: right→down, up→left. And reverse: down→right? No — reflections are symmetric:
    // \ : right↔down, left↔up
    // / : right↔up, left↔down
    // So \ DOES do down→right!

    // Corrected solution:
    // →right hits M1(400,300): need right→down = '\' (angle=1)
    // ↓down hits M2(400,550): need down→right = '\' (angle=1)
    // →right hits M3(800,550): need right→up = '/' (angle=0)
    // ↑up hits M4(800,300): need up→right = '/' (angle=0)
    // →right reaches target(1000,300)

    this.sourceX = AREA_X + 30;
    this.sourceY = AREA_Y + 200; // y=300
    this.targetX = AREA_X + AREA_W - 50;
    this.targetY = AREA_Y + 200; // same height as source — beam must go around

    // Mirrors start at wrong angles so player must rotate them
    this.mirrors = [
      { x: 400, y: 300, angle: 0, animAngle: 0 },  // needs to be 1 (\)
      { x: 400, y: 550, angle: 0, animAngle: 0 },  // needs to be 1 (\)
      { x: 800, y: 550, angle: 1, animAngle: Math.PI / 4 },  // needs to be 0 (/)
      { x: 800, y: 300, angle: 1, animAngle: Math.PI / 4 },  // needs to be 0 (/)
    ];

    // Obstacles — block the direct path from source to target
    this.obstacles = [
      { x: 520, y: 270, w: 180, h: 60 },
    ];

    this.traceBeam();
  }

  reset(): void {
    this.init();
  }

  /** Trace the beam path from source through mirrors */
  private traceBeam(): void {
    this.beam = [];
    this.hitTarget = false;

    let x = this.sourceX;
    let y = this.sourceY;
    let dir: Dir = 0; // start going right

    for (let step = 0; step < 20; step++) {
      // Find nearest mirror or boundary in current direction
      let nearestDist = Infinity;
      let nearestMirror: Mirror | null = null;
      let hitX = x;
      let hitY = y;

      // Check mirrors
      for (const m of this.mirrors) {
        // Check if mirror is in the beam's path
        let d = -1;
        const tolerance = 25;

        if (dir === 0 && Math.abs(m.y - y) < tolerance && m.x > x) {
          d = m.x - x;
        } else if (dir === 1 && Math.abs(m.x - x) < tolerance && m.y > y) {
          d = m.y - y;
        } else if (dir === 2 && Math.abs(m.y - y) < tolerance && m.x < x) {
          d = x - m.x;
        } else if (dir === 3 && Math.abs(m.x - x) < tolerance && m.y < y) {
          d = y - m.y;
        }

        if (d > 0 && d < nearestDist) {
          // Check if obstacle blocks the path
          let blocked = false;
          for (const obs of this.obstacles) {
            if (this.lineIntersectsRect(x, y, m.x, m.y, obs)) {
              if (dist(x, y, obs.x + obs.w / 2, obs.y + obs.h / 2) < d) {
                blocked = true;
              }
            }
          }
          if (!blocked) {
            nearestDist = d;
            nearestMirror = m;
            hitX = m.x;
            hitY = m.y;
          }
        }
      }

      // Check if beam hits target
      const targetTolerance = 30;
      let targetDist = Infinity;
      if (dir === 0 && Math.abs(this.targetY - y) < targetTolerance && this.targetX > x) {
        targetDist = this.targetX - x;
      } else if (dir === 1 && Math.abs(this.targetX - x) < targetTolerance && this.targetY > y) {
        targetDist = this.targetY - y;
      } else if (dir === 2 && Math.abs(this.targetY - y) < targetTolerance && this.targetX < x) {
        targetDist = x - this.targetX;
      } else if (dir === 3 && Math.abs(this.targetX - x) < targetTolerance && this.targetY < y) {
        targetDist = y - this.targetY;
      }

      if (targetDist < nearestDist) {
        this.beam.push({ x1: x, y1: y, x2: this.targetX, y2: this.targetY });
        this.hitTarget = true;
        break;
      }

      if (!nearestMirror) {
        // Beam goes to edge
        const edgeX = dir === 0 ? AREA_X + AREA_W : dir === 2 ? AREA_X : x;
        const edgeY = dir === 1 ? AREA_Y + AREA_H : dir === 3 ? AREA_Y : y;
        this.beam.push({ x1: x, y1: y, x2: edgeX, y2: edgeY });
        break;
      }

      this.beam.push({ x1: x, y1: y, x2: hitX, y2: hitY });

      // Reflect: mirror angle determines new direction
      // angle 0 = / : right↔up (0↔3), left↔down (2↔1)
      // angle 1 = \ : right↔down (0↔1), left↔up (2↔3)
      const mirrorType = nearestMirror.angle % 2;
      if (mirrorType === 0) {
        // / mirror: right↔up, left↔down
        const reflections: Record<Dir, Dir> = { 0: 3, 3: 0, 2: 1, 1: 2 };
        dir = reflections[dir];
      } else {
        // \ mirror: right↔down, left↔up
        const reflections: Record<Dir, Dir> = { 0: 1, 1: 0, 2: 3, 3: 2 };
        dir = reflections[dir];
      }

      x = hitX;
      y = hitY;
    }
  }

  private lineIntersectsRect(x1: number, y1: number, x2: number, y2: number, r: Obstacle): boolean {
    // Simple AABB check for line
    const minX = Math.min(x1, x2);
    const maxX = Math.max(x1, x2);
    const minY = Math.min(y1, y2);
    const maxY = Math.max(y1, y2);
    return !(maxX < r.x || minX > r.x + r.w || maxY < r.y || minY > r.y + r.h);
  }

  isSolved(): boolean {
    return this.solved || this.hitTarget;
  }

  onPointerDown(x: number, y: number): void {
    if (this.solved) return;

    for (const m of this.mirrors) {
      if (dist(x, y, m.x, m.y) < 30) {
        m.angle = m.angle === 0 ? 1 : 0;
        this.moves++;
        playClank();
        this.traceBeam();

        if (this.hitTarget && !this.solved) {
          this.solved = true;
          this.effects.emitSparks(this.targetX, this.targetY, 15);
          this.effects.emitGlow(this.targetX, this.targetY, C.WARM_LIGHT, 20);
          setTimeout(() => {
            playSuccess();
            playHeavyClunk();
          }, 200);
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
      this.solveAnim = Math.min(1, this.solveAnim + dt * 0.6);
    }
    this.crystalPulse += dt * 3;

    // Animate mirror angles
    for (const m of this.mirrors) {
      // angle 0 = / → visual rotation -45° = -PI/4
      // angle 1 = \ → visual rotation +45° = +PI/4
      const target = m.angle === 0 ? -Math.PI / 4 : Math.PI / 4;
      const diff = target - m.animAngle;
      if (Math.abs(diff) > 0.01) {
        m.animAngle += diff * Math.min(1, dt * 12);
      }
    }

    this.effects.update(dt);
  }

  render(ctx: CanvasRenderingContext2D): void {
    drawBackground(ctx);

    // Panel
    const panelX = 80;
    const panelY = 70;
    const panelW = GAME_W - 160;
    const panelH = GAME_H - 110;
    drawMetalPanel(ctx, panelX, panelY, panelW, panelH, '#1A1A28', 10);
    drawFrame(ctx, panelX, panelY, panelW, panelH, 10);

    // Obstacles
    for (const obs of this.obstacles) {
      ctx.save();
      ctx.shadowColor = 'rgba(0,0,0,0.5)';
      ctx.shadowBlur = 6;
      ctx.shadowOffsetX = 2;
      ctx.shadowOffsetY = 2;
      const obsGrad = ctx.createLinearGradient(obs.x, obs.y, obs.x + obs.w, obs.y + obs.h);
      obsGrad.addColorStop(0, '#4A4A5A');
      obsGrad.addColorStop(0.5, '#3A3A4A');
      obsGrad.addColorStop(1, '#2A2A3A');
      ctx.fillStyle = obsGrad;
      ctx.fillRect(obs.x, obs.y, obs.w, obs.h);
      ctx.shadowBlur = 0;
      ctx.strokeStyle = 'rgba(255,255,255,0.1)';
      ctx.lineWidth = 1;
      ctx.strokeRect(obs.x, obs.y, obs.w, obs.h);
      ctx.restore();
    }

    // Light source
    ctx.save();
    ctx.shadowColor = C.WARM_LIGHT;
    ctx.shadowBlur = 20;
    ctx.fillStyle = C.WARM_LIGHT;
    ctx.beginPath();
    ctx.arc(this.sourceX, this.sourceY, 12, 0, Math.PI * 2);
    ctx.fill();
    ctx.shadowBlur = 0;
    // Arrow
    ctx.strokeStyle = C.WARM_LIGHT;
    ctx.lineWidth = 2;
    ctx.beginPath();
    ctx.moveTo(this.sourceX + 15, this.sourceY);
    ctx.lineTo(this.sourceX + 30, this.sourceY);
    ctx.lineTo(this.sourceX + 25, this.sourceY - 5);
    ctx.moveTo(this.sourceX + 30, this.sourceY);
    ctx.lineTo(this.sourceX + 25, this.sourceY + 5);
    ctx.stroke();
    ctx.font = 'bold 11px "Georgia", serif';
    ctx.textAlign = 'center';
    ctx.fillStyle = C.WARM_LIGHT;
    ctx.fillText('LUCE', this.sourceX, this.sourceY - 20);
    ctx.restore();

    // Crystal target
    ctx.save();
    const pulseR = 18 + Math.sin(this.crystalPulse) * 3;
    const crystalColor = this.hitTarget ? '#FF88FF' : '#8844AA';
    ctx.shadowColor = crystalColor;
    ctx.shadowBlur = this.hitTarget ? 25 : 10;

    // Crystal shape (diamond)
    ctx.fillStyle = crystalColor;
    ctx.beginPath();
    ctx.moveTo(this.targetX, this.targetY - pulseR);
    ctx.lineTo(this.targetX + pulseR * 0.7, this.targetY);
    ctx.lineTo(this.targetX, this.targetY + pulseR);
    ctx.lineTo(this.targetX - pulseR * 0.7, this.targetY);
    ctx.closePath();
    ctx.fill();

    // Inner highlight
    ctx.fillStyle = 'rgba(255,255,255,0.3)';
    ctx.beginPath();
    ctx.moveTo(this.targetX, this.targetY - pulseR * 0.5);
    ctx.lineTo(this.targetX + pulseR * 0.2, this.targetY);
    ctx.lineTo(this.targetX, this.targetY + pulseR * 0.3);
    ctx.lineTo(this.targetX - pulseR * 0.2, this.targetY);
    ctx.closePath();
    ctx.fill();

    ctx.shadowBlur = 0;
    ctx.font = 'bold 11px "Georgia", serif';
    ctx.textAlign = 'center';
    ctx.fillStyle = crystalColor;
    ctx.fillText('CRISTALLO', this.targetX, this.targetY + pulseR + 15);
    ctx.restore();

    // Draw beam
    for (let i = 0; i < this.beam.length; i++) {
      const seg = this.beam[i];
      ctx.save();
      // Glow
      ctx.strokeStyle = C.WARM_LIGHT;
      ctx.shadowColor = C.WARM_LIGHT;
      ctx.shadowBlur = 15;
      ctx.lineWidth = 4;
      ctx.globalAlpha = 0.4;
      ctx.beginPath();
      ctx.moveTo(seg.x1, seg.y1);
      ctx.lineTo(seg.x2, seg.y2);
      ctx.stroke();

      // Core
      ctx.shadowBlur = 8;
      ctx.lineWidth = 2;
      ctx.globalAlpha = 0.9;
      ctx.strokeStyle = '#FFFFFF';
      ctx.beginPath();
      ctx.moveTo(seg.x1, seg.y1);
      ctx.lineTo(seg.x2, seg.y2);
      ctx.stroke();
      ctx.restore();
    }

    // Mirrors
    for (const m of this.mirrors) {
      ctx.save();
      ctx.translate(m.x, m.y);

      // Mirror base circle
      const baseGrad = ctx.createRadialGradient(0, 0, 0, 0, 0, 20);
      baseGrad.addColorStop(0, '#555555');
      baseGrad.addColorStop(1, '#333333');
      ctx.fillStyle = baseGrad;
      ctx.beginPath();
      ctx.arc(0, 0, 20, 0, Math.PI * 2);
      ctx.fill();

      // Mirror surface — use animated angle
      ctx.rotate(m.animAngle);

      // Reflective surface
      const mirGrad = ctx.createLinearGradient(-22, 0, 22, 0);
      mirGrad.addColorStop(0, '#CCCCDD');
      mirGrad.addColorStop(0.3, '#FFFFFF');
      mirGrad.addColorStop(0.5, '#EEEEFF');
      mirGrad.addColorStop(0.7, '#FFFFFF');
      mirGrad.addColorStop(1, '#AAAACC');
      ctx.fillStyle = mirGrad;
      ctx.fillRect(-22, -3, 44, 6);

      // Frame
      ctx.strokeStyle = '#888888';
      ctx.lineWidth = 1.5;
      ctx.strokeRect(-22, -3, 44, 6);

      ctx.restore();
    }

    // Rainbow burst on solve
    if (this.solveAnim > 0 && this.solveAnim < 0.8) {
      ctx.save();
      ctx.globalAlpha = (1 - this.solveAnim) * 0.4;
      const rainbow = ['#FF0000', '#FF8800', '#FFFF00', '#00FF00', '#0088FF', '#8800FF'];
      for (let i = 0; i < rainbow.length; i++) {
        const angle = (i / rainbow.length) * Math.PI * 2 + this.solveAnim * 5;
        const r = this.solveAnim * 200;
        ctx.strokeStyle = rainbow[i];
        ctx.lineWidth = 3;
        ctx.shadowColor = rainbow[i];
        ctx.shadowBlur = 10;
        ctx.beginPath();
        ctx.moveTo(this.targetX, this.targetY);
        ctx.lineTo(
          this.targetX + Math.cos(angle) * r,
          this.targetY + Math.sin(angle) * r
        );
        ctx.stroke();
      }
      ctx.restore();
    }

    // Hint
    if (!this.solved && this.moves === 0) {
      ctx.save();
      ctx.textAlign = 'center';
      ctx.font = 'italic 14px "Georgia", serif';
      ctx.fillStyle = C.TEXT_DIM;
      ctx.fillText('Clicca uno specchio per ruotarlo e deviare la luce verso il cristallo', GAME_W / 2, GAME_H - 55);
      ctx.restore();
    }

    this.effects.render(ctx);
    drawHUD(ctx, this.name, this.subtitle, this.moves, this.elapsed);
  }
}
