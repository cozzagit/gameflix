// ============================================================
// TinyEmpire — Particle Renderer
// ============================================================
//
// Draws all active particles.  Each particle is a 1–2 px filled
// rectangle.  Alpha fades out during the last 30 % of the particle's
// lifetime so they disappear smoothly.
// ============================================================

import type { Particle } from '../types/index.ts';

// The fraction of lifetime at which fading begins (0 → 1 scale)
const FADE_THRESHOLD = 0.7;

export class ParticleRenderer {
  render(
    ctx: CanvasRenderingContext2D,
    particles: Particle[],
  ): void {
    for (const p of particles) {
      if (!p.active) continue;

      // Compute normalised remaining life (0 = dead, 1 = brand-new)
      const lifeFraction = p.life / p.maxLife;

      // Alpha: full opacity until FADE_THRESHOLD, then linear fade to 0
      let alpha = 1;
      if (lifeFraction < FADE_THRESHOLD) {
        alpha = lifeFraction / FADE_THRESHOLD; // 0 .. 1
      }

      ctx.save();
      ctx.globalAlpha = alpha;
      ctx.fillStyle   = p.color;

      // Clamp size to 1–2 px as per spec
      const sz = Math.max(1, Math.min(2, Math.round(p.size)));
      ctx.fillRect(
        Math.round(p.x - sz / 2),
        Math.round(p.y - sz / 2),
        sz,
        sz,
      );
      ctx.restore();
    }
  }
}
