import {
  W, H, COL, PLAYER_RADIUS, CRYSTAL_RADIUS, EXIT_RADIUS,
  wallColor, RevealedWall, SonarWave, Crystal, Hazard, TrailPoint,
} from './types';
import { Particle } from './types';

export class Renderer {
  private ctx: CanvasRenderingContext2D;
  private time: number = 0;

  constructor(private canvas: HTMLCanvasElement) {
    this.ctx = canvas.getContext('2d')!;
    canvas.width = W;
    canvas.height = H;
  }

  clear(): void {
    this.ctx.fillStyle = COL.bg;
    this.ctx.fillRect(0, 0, W, H);
  }

  setTime(t: number): void {
    this.time = t;
  }

  // ── Revealed walls ────────────────────────────────────
  drawRevealedWalls(walls: Map<unknown, RevealedWall>): void {
    const ctx = this.ctx;
    for (const rw of walls.values()) {
      if (rw.brightness <= 0) continue;
      const color = wallColor(rw.wall.type);
      const alpha = rw.brightness;

      ctx.save();
      ctx.strokeStyle = color;
      ctx.globalAlpha = alpha;
      ctx.lineWidth = 3;
      ctx.shadowColor = color;
      ctx.shadowBlur = 12 * alpha;
      ctx.beginPath();
      ctx.moveTo(rw.wall.x1, rw.wall.y1);
      ctx.lineTo(rw.wall.x2, rw.wall.y2);
      ctx.stroke();

      // Draw a second pass for glow intensity
      ctx.shadowBlur = 25 * alpha;
      ctx.lineWidth = 1.5;
      ctx.globalAlpha = alpha * 0.6;
      ctx.stroke();
      ctx.restore();
    }
  }

  // ── Sonar waves ───────────────────────────────────────
  drawWaves(waves: SonarWave[]): void {
    const ctx = this.ctx;
    for (const wave of waves) {
      const progress = wave.radius / wave.maxRadius;
      const alpha = (1 - progress) * 0.8;
      const width = PLAYER_RADIUS - progress * 2;
      if (alpha <= 0 || width <= 0.3) continue;

      ctx.save();
      ctx.strokeStyle = COL.wave;
      ctx.globalAlpha = alpha;
      ctx.lineWidth = Math.max(0.5, width);
      ctx.shadowColor = COL.wave;
      ctx.shadowBlur = 15 * (1 - progress);
      ctx.beginPath();
      ctx.arc(wave.cx, wave.cy, wave.radius, 0, Math.PI * 2);
      ctx.stroke();

      // Inner ring (finer)
      if (wave.radius > 5) {
        ctx.globalAlpha = alpha * 0.3;
        ctx.lineWidth = 0.5;
        ctx.shadowBlur = 5;
        ctx.beginPath();
        ctx.arc(wave.cx, wave.cy, wave.radius - 4, 0, Math.PI * 2);
        ctx.stroke();
      }
      ctx.restore();
    }
  }

  // ── Player ────────────────────────────────────────────
  drawPlayer(x: number, y: number, trail: TrailPoint[]): void {
    const ctx = this.ctx;

    // Trail
    for (let i = 0; i < trail.length; i++) {
      const tp = trail[i];
      const age = this.time - tp.time;
      const alpha = Math.max(0, 1 - age / 3) * 0.3;
      if (alpha <= 0) continue;
      ctx.save();
      ctx.fillStyle = COL.player;
      ctx.globalAlpha = alpha;
      ctx.beginPath();
      ctx.arc(tp.x, tp.y, 1.5, 0, Math.PI * 2);
      ctx.fill();
      ctx.restore();
    }

    // Player glow
    const pulse = 0.7 + Math.sin(this.time * 3) * 0.3;
    ctx.save();
    ctx.fillStyle = COL.player;
    ctx.globalAlpha = 0.15 * pulse;
    ctx.shadowColor = COL.player;
    ctx.shadowBlur = 30;
    ctx.beginPath();
    ctx.arc(x, y, PLAYER_RADIUS * 3, 0, Math.PI * 2);
    ctx.fill();

    // Player core
    ctx.globalAlpha = 1;
    ctx.shadowBlur = 20 * pulse;
    ctx.beginPath();
    ctx.arc(x, y, PLAYER_RADIUS, 0, Math.PI * 2);
    ctx.fill();

    // Bright center
    ctx.fillStyle = '#E0F2FE';
    ctx.globalAlpha = 0.9;
    ctx.shadowBlur = 0;
    ctx.beginPath();
    ctx.arc(x, y, PLAYER_RADIUS * 0.4, 0, Math.PI * 2);
    ctx.fill();
    ctx.restore();
  }

  // ── Crystals ──────────────────────────────────────────
  drawCrystals(crystals: Crystal[], revealedWalls: Map<unknown, RevealedWall>): void {
    const ctx = this.ctx;
    for (const c of crystals) {
      if (c.collected) continue;

      // Only visible if nearby wall is revealed (within ~100px of any revealed wall)
      let nearReveal = false;
      let maxBrightness = 0;
      for (const rw of revealedWalls.values()) {
        const mx = (rw.wall.x1 + rw.wall.x2) / 2;
        const my = (rw.wall.y1 + rw.wall.y2) / 2;
        const dist = Math.sqrt((c.x - mx) ** 2 + (c.y - my) ** 2);
        if (dist < 200 && rw.brightness > 0.1) {
          nearReveal = true;
          maxBrightness = Math.max(maxBrightness, rw.brightness);
        }
      }
      if (!nearReveal) continue;

      const sparkle = 0.6 + Math.sin(this.time * 5 + c.x) * 0.4;
      ctx.save();
      ctx.fillStyle = COL.crystal;
      ctx.globalAlpha = maxBrightness * sparkle;
      ctx.shadowColor = COL.crystal;
      ctx.shadowBlur = 15 * maxBrightness;

      // Diamond shape
      ctx.beginPath();
      ctx.moveTo(c.x, c.y - CRYSTAL_RADIUS);
      ctx.lineTo(c.x + CRYSTAL_RADIUS * 0.6, c.y);
      ctx.lineTo(c.x, c.y + CRYSTAL_RADIUS);
      ctx.lineTo(c.x - CRYSTAL_RADIUS * 0.6, c.y);
      ctx.closePath();
      ctx.fill();

      // Center sparkle
      ctx.fillStyle = '#FEF3C7';
      ctx.globalAlpha = maxBrightness * sparkle * 0.8;
      ctx.shadowBlur = 0;
      ctx.beginPath();
      ctx.arc(c.x, c.y, 2, 0, Math.PI * 2);
      ctx.fill();
      ctx.restore();
    }
  }

  // ── Exit portal ───────────────────────────────────────
  drawExit(x: number, y: number, radius: number, revealedWalls: Map<unknown, RevealedWall>): void {
    // Check if any revealed wall is nearby
    let nearReveal = false;
    let maxBrightness = 0;
    for (const rw of revealedWalls.values()) {
      const mx = (rw.wall.x1 + rw.wall.x2) / 2;
      const my = (rw.wall.y1 + rw.wall.y2) / 2;
      const dist = Math.sqrt((x - mx) ** 2 + (y - my) ** 2);
      if (dist < 250 && rw.brightness > 0.05) {
        nearReveal = true;
        maxBrightness = Math.max(maxBrightness, rw.brightness);
      }
    }
    if (!nearReveal) return;

    const ctx = this.ctx;
    const pulse = 0.5 + Math.sin(this.time * 2) * 0.5;

    ctx.save();
    // Outer glow
    ctx.fillStyle = COL.exit;
    ctx.globalAlpha = maxBrightness * 0.1 * pulse;
    ctx.shadowColor = COL.exit;
    ctx.shadowBlur = 40;
    ctx.beginPath();
    ctx.arc(x, y, radius * 2.5, 0, Math.PI * 2);
    ctx.fill();

    // Main circle
    ctx.globalAlpha = maxBrightness * 0.5;
    ctx.shadowBlur = 25;
    ctx.beginPath();
    ctx.arc(x, y, radius, 0, Math.PI * 2);
    ctx.fill();

    // Inner ring
    ctx.strokeStyle = COL.exit;
    ctx.globalAlpha = maxBrightness * 0.8;
    ctx.lineWidth = 2;
    ctx.shadowBlur = 15;
    ctx.beginPath();
    ctx.arc(x, y, radius * 0.6, 0, Math.PI * 2);
    ctx.stroke();

    // Center dot
    ctx.fillStyle = '#D1FAE5';
    ctx.globalAlpha = maxBrightness * pulse;
    ctx.shadowBlur = 0;
    ctx.beginPath();
    ctx.arc(x, y, 3, 0, Math.PI * 2);
    ctx.fill();
    ctx.restore();
  }

  // ── Hazards ───────────────────────────────────────────
  drawHazards(hazards: Hazard[], revealedWalls: Map<unknown, RevealedWall>): void {
    const ctx = this.ctx;
    for (const h of hazards) {
      let maxBrightness = 0;
      for (const rw of revealedWalls.values()) {
        const mx = (rw.wall.x1 + rw.wall.x2) / 2;
        const my = (rw.wall.y1 + rw.wall.y2) / 2;
        const dist = Math.sqrt((h.x - mx) ** 2 + (h.y - my) ** 2);
        if (dist < 200 && rw.brightness > 0.05) {
          maxBrightness = Math.max(maxBrightness, rw.brightness);
        }
      }
      if (maxBrightness < 0.05) continue;

      const pulse = 0.5 + Math.sin(this.time * 4 + h.x * 0.1) * 0.5;

      ctx.save();
      ctx.fillStyle = COL.hazard;
      ctx.globalAlpha = maxBrightness * 0.3 * pulse;
      ctx.shadowColor = COL.hazard;
      ctx.shadowBlur = 20;
      ctx.beginPath();
      ctx.arc(h.x, h.y, h.radius * 1.5, 0, Math.PI * 2);
      ctx.fill();

      // Spike shapes
      ctx.globalAlpha = maxBrightness * 0.8;
      ctx.shadowBlur = 10;
      const spikes = 6;
      ctx.beginPath();
      for (let i = 0; i < spikes; i++) {
        const a = (i / spikes) * Math.PI * 2 + this.time * 0.5;
        const outerR = h.radius;
        const innerR = h.radius * 0.4;
        const ox = h.x + Math.cos(a) * outerR;
        const oy = h.y + Math.sin(a) * outerR;
        const a2 = a + Math.PI / spikes;
        const ix = h.x + Math.cos(a2) * innerR;
        const iy = h.y + Math.sin(a2) * innerR;
        if (i === 0) ctx.moveTo(ox, oy);
        else ctx.lineTo(ox, oy);
        ctx.lineTo(ix, iy);
      }
      ctx.closePath();
      ctx.fill();
      ctx.restore();
    }
  }

  // ── Particles ─────────────────────────────────────────
  drawParticles(particles: Particle[]): void {
    const ctx = this.ctx;
    for (const p of particles) {
      if (p.life <= 0) continue;
      ctx.save();
      ctx.fillStyle = p.color;
      ctx.globalAlpha = p.life * 0.8;
      ctx.shadowColor = p.color;
      ctx.shadowBlur = 6;
      ctx.beginPath();
      ctx.arc(p.x, p.y, p.size * p.life, 0, Math.PI * 2);
      ctx.fill();
      ctx.restore();
    }
  }

  // ── HUD ───────────────────────────────────────────────
  drawHUD(
    pulsesUsed: number,
    maxPulses: number,
    crystalsCollected: number,
    totalCrystals: number,
    levelName: string,
    timeElapsed: number,
    score: number,
  ): void {
    const ctx = this.ctx;
    ctx.save();

    // Semi-transparent top bar
    ctx.fillStyle = 'rgba(2, 2, 8, 0.6)';
    ctx.fillRect(0, 0, W, 44);
    ctx.strokeStyle = 'rgba(6, 182, 212, 0.15)';
    ctx.lineWidth = 1;
    ctx.beginPath();
    ctx.moveTo(0, 44);
    ctx.lineTo(W, 44);
    ctx.stroke();

    ctx.font = '14px "Segoe UI", system-ui, sans-serif';
    ctx.textBaseline = 'middle';

    // Pulses
    const remaining = maxPulses - pulsesUsed;
    ctx.fillStyle = remaining > 3 ? COL.wave : COL.hazard;
    ctx.textAlign = 'left';
    ctx.fillText(`\u26A1 ${remaining}/${maxPulses}`, 16, 22);

    // Pulse dots
    for (let i = 0; i < maxPulses; i++) {
      const dx = 110 + i * 12;
      ctx.beginPath();
      ctx.arc(dx, 22, 3, 0, Math.PI * 2);
      if (i < remaining) {
        ctx.fillStyle = COL.wave;
        ctx.shadowColor = COL.wave;
        ctx.shadowBlur = 6;
      } else {
        ctx.fillStyle = '#1E293B';
        ctx.shadowBlur = 0;
      }
      ctx.fill();
    }
    ctx.shadowBlur = 0;

    // Level name
    ctx.fillStyle = COL.hudBright;
    ctx.textAlign = 'center';
    ctx.fillText(levelName, W / 2, 22);

    // Crystals
    ctx.fillStyle = COL.crystal;
    ctx.textAlign = 'right';
    ctx.fillText(`\u2B26 ${crystalsCollected}/${totalCrystals}`, W - 120, 22);

    // Time
    const mins = Math.floor(timeElapsed / 60);
    const secs = Math.floor(timeElapsed % 60);
    ctx.fillStyle = COL.hud;
    ctx.fillText(
      `${mins}:${secs.toString().padStart(2, '0')}`,
      W - 16,
      22,
    );

    ctx.restore();
  }

  // ── Tutorial text ─────────────────────────────────────
  drawTutorial(text: string, alpha: number): void {
    if (alpha <= 0) return;
    const ctx = this.ctx;
    ctx.save();
    ctx.font = '16px "Segoe UI", system-ui, sans-serif';
    ctx.fillStyle = COL.hudBright;
    ctx.globalAlpha = alpha;
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.shadowColor = COL.wave;
    ctx.shadowBlur = 10;

    const lines = text.split('\n');
    lines.forEach((line, i) => {
      ctx.fillText(line, W / 2, H - 80 + i * 24);
    });
    ctx.restore();
  }
}
