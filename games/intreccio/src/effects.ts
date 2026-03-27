/**
 * Particle effects system for golden dust, sparkles, and celebration bursts.
 */

import { Particle, CANVAS_W, CANVAS_H } from './types';

export class ParticleSystem {
  particles: Particle[] = [];

  clear(): void {
    this.particles = [];
  }

  /** Floating ambient golden dust */
  spawnDust(): void {
    if (this.particles.length > 200) return;
    this.particles.push({
      x: Math.random() * CANVAS_W,
      y: CANVAS_H + 5,
      vx: (Math.random() - 0.5) * 0.3,
      vy: -(0.2 + Math.random() * 0.4),
      life: 300 + Math.random() * 200,
      maxLife: 300 + Math.random() * 200,
      size: 1 + Math.random() * 2,
      color: '#FFD700',
      alpha: 0.1 + Math.random() * 0.2,
      type: 'dust',
    });
  }

  /** Sparkle burst at a specific position (for word found) */
  spawnSparkles(cx: number, cy: number, count: number = 20): void {
    for (let i = 0; i < count; i++) {
      const angle = (Math.PI * 2 * i) / count + Math.random() * 0.3;
      const speed = 1 + Math.random() * 3;
      this.particles.push({
        x: cx,
        y: cy,
        vx: Math.cos(angle) * speed,
        vy: Math.sin(angle) * speed,
        life: 40 + Math.random() * 30,
        maxLife: 40 + Math.random() * 30,
        size: 2 + Math.random() * 3,
        color: Math.random() > 0.5 ? '#FFD700' : '#FFF8E1',
        alpha: 0.8 + Math.random() * 0.2,
        type: 'sparkle',
      });
    }
  }

  /** Golden rays for level complete */
  spawnRays(cx: number, cy: number): void {
    for (let i = 0; i < 12; i++) {
      const angle = (Math.PI * 2 * i) / 12;
      this.particles.push({
        x: cx,
        y: cy,
        vx: Math.cos(angle) * 2,
        vy: Math.sin(angle) * 2,
        life: 60,
        maxLife: 60,
        size: 3,
        color: '#FFD700',
        alpha: 0.6,
        type: 'ray',
        angle,
      });
    }
  }

  /** Big celebration burst */
  spawnCelebration(cx: number, cy: number): void {
    this.spawnSparkles(cx, cy, 40);
    this.spawnRays(cx, cy);

    // Extra floating particles
    for (let i = 0; i < 30; i++) {
      this.particles.push({
        x: cx + (Math.random() - 0.5) * 200,
        y: cy + (Math.random() - 0.5) * 150,
        vx: (Math.random() - 0.5) * 2,
        vy: -(0.5 + Math.random() * 1.5),
        life: 80 + Math.random() * 60,
        maxLife: 80 + Math.random() * 60,
        size: 1.5 + Math.random() * 2.5,
        color: Math.random() > 0.3 ? '#FFD700' : '#FFECB3',
        alpha: 0.5 + Math.random() * 0.5,
        type: 'gold',
      });
    }
  }

  update(): void {
    for (let i = this.particles.length - 1; i >= 0; i--) {
      const p = this.particles[i];
      p.x += p.vx;
      p.y += p.vy;
      p.life--;

      if (p.type === 'dust') {
        p.vx += (Math.random() - 0.5) * 0.02;
        p.alpha = Math.min(p.alpha, (p.life / p.maxLife) * 0.3);
      } else if (p.type === 'sparkle') {
        p.vx *= 0.96;
        p.vy *= 0.96;
        p.alpha = (p.life / p.maxLife) * 0.8;
        p.size *= 0.98;
      } else if (p.type === 'gold') {
        p.vy *= 0.99;
        p.alpha = (p.life / p.maxLife) * 0.6;
      } else if (p.type === 'ray') {
        p.alpha = (p.life / p.maxLife) * 0.5;
        p.size += 0.1;
      }

      if (p.life <= 0 || p.y < -10 || p.x < -10 || p.x > CANVAS_W + 10) {
        this.particles.splice(i, 1);
      }
    }
  }

  draw(ctx: CanvasRenderingContext2D): void {
    ctx.save();
    for (const p of this.particles) {
      ctx.globalAlpha = p.alpha;

      if (p.type === 'ray') {
        // Draw as a line/streak
        const len = 15 + p.size * 3;
        ctx.strokeStyle = p.color;
        ctx.lineWidth = 1.5;
        ctx.beginPath();
        ctx.moveTo(p.x, p.y);
        ctx.lineTo(
          p.x + Math.cos(p.angle || 0) * len,
          p.y + Math.sin(p.angle || 0) * len,
        );
        ctx.stroke();
      } else if (p.type === 'sparkle') {
        // Draw as a 4-point star
        ctx.fillStyle = p.color;
        const s = p.size;
        ctx.beginPath();
        ctx.moveTo(p.x, p.y - s);
        ctx.lineTo(p.x + s * 0.3, p.y - s * 0.3);
        ctx.lineTo(p.x + s, p.y);
        ctx.lineTo(p.x + s * 0.3, p.y + s * 0.3);
        ctx.lineTo(p.x, p.y + s);
        ctx.lineTo(p.x - s * 0.3, p.y + s * 0.3);
        ctx.lineTo(p.x - s, p.y);
        ctx.lineTo(p.x - s * 0.3, p.y - s * 0.3);
        ctx.closePath();
        ctx.fill();
      } else {
        // Circle
        ctx.fillStyle = p.color;
        ctx.beginPath();
        ctx.arc(p.x, p.y, p.size, 0, Math.PI * 2);
        ctx.fill();
      }
    }
    ctx.globalAlpha = 1;
    ctx.restore();
  }
}
