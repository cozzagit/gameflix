// ============================================================
// Machina — Particle & Visual Effects
// ============================================================

import { Particle, C } from './types';

export class EffectsEngine {
  private particles: Particle[] = [];

  clear(): void {
    this.particles = [];
  }

  /** Emit sparks at a point */
  emitSparks(x: number, y: number, count: number = 8): void {
    for (let i = 0; i < count; i++) {
      const angle = Math.random() * Math.PI * 2;
      const speed = 50 + Math.random() * 150;
      this.particles.push({
        x, y,
        vx: Math.cos(angle) * speed,
        vy: Math.sin(angle) * speed,
        life: 0.3 + Math.random() * 0.4,
        maxLife: 0.3 + Math.random() * 0.4,
        size: 1.5 + Math.random() * 2.5,
        color: Math.random() > 0.5 ? C.WARM_LIGHT : '#FF8C00',
        type: 'spark',
      });
    }
  }

  /** Emit dust motes floating gently */
  emitDust(x: number, y: number, count: number = 4): void {
    for (let i = 0; i < count; i++) {
      this.particles.push({
        x: x + (Math.random() - 0.5) * 40,
        y: y + (Math.random() - 0.5) * 40,
        vx: (Math.random() - 0.5) * 10,
        vy: -5 - Math.random() * 15,
        life: 1.0 + Math.random() * 1.5,
        maxLife: 1.0 + Math.random() * 1.5,
        size: 1 + Math.random() * 2,
        color: '#D4C5A0',
        type: 'dust',
      });
    }
  }

  /** Emit steam wisps */
  emitSteam(x: number, y: number, count: number = 6): void {
    for (let i = 0; i < count; i++) {
      this.particles.push({
        x: x + (Math.random() - 0.5) * 20,
        y,
        vx: (Math.random() - 0.5) * 20,
        vy: -30 - Math.random() * 40,
        life: 0.8 + Math.random() * 1.0,
        maxLife: 0.8 + Math.random() * 1.0,
        size: 4 + Math.random() * 8,
        color: '#AABBCC',
        type: 'steam',
      });
    }
  }

  /** Emit glow particles */
  emitGlow(x: number, y: number, color: string, count: number = 5): void {
    for (let i = 0; i < count; i++) {
      const angle = Math.random() * Math.PI * 2;
      const speed = 10 + Math.random() * 30;
      this.particles.push({
        x: x + (Math.random() - 0.5) * 10,
        y: y + (Math.random() - 0.5) * 10,
        vx: Math.cos(angle) * speed,
        vy: Math.sin(angle) * speed,
        life: 0.5 + Math.random() * 0.8,
        maxLife: 0.5 + Math.random() * 0.8,
        size: 2 + Math.random() * 4,
        color,
        type: 'glow',
      });
    }
  }

  update(dt: number): void {
    for (let i = this.particles.length - 1; i >= 0; i--) {
      const p = this.particles[i];
      p.life -= dt;
      if (p.life <= 0) {
        this.particles.splice(i, 1);
        continue;
      }
      p.x += p.vx * dt;
      p.y += p.vy * dt;
      if (p.type === 'spark') {
        p.vy += 200 * dt; // gravity
        p.vx *= 0.98;
      }
      if (p.type === 'steam') {
        p.size += 3 * dt;
        p.vx += (Math.random() - 0.5) * 5;
      }
    }
  }

  render(ctx: CanvasRenderingContext2D): void {
    ctx.save();
    for (const p of this.particles) {
      const alpha = Math.min(1, p.life / p.maxLife);
      ctx.globalAlpha = alpha;
      if (p.type === 'spark') {
        ctx.fillStyle = p.color;
        ctx.shadowColor = p.color;
        ctx.shadowBlur = 6;
        ctx.beginPath();
        ctx.arc(p.x, p.y, p.size * alpha, 0, Math.PI * 2);
        ctx.fill();
        ctx.shadowBlur = 0;
      } else if (p.type === 'dust') {
        ctx.fillStyle = p.color;
        ctx.globalAlpha = alpha * 0.4;
        ctx.beginPath();
        ctx.arc(p.x, p.y, p.size, 0, Math.PI * 2);
        ctx.fill();
      } else if (p.type === 'steam') {
        ctx.fillStyle = p.color;
        ctx.globalAlpha = alpha * 0.2;
        ctx.beginPath();
        ctx.arc(p.x, p.y, p.size, 0, Math.PI * 2);
        ctx.fill();
      } else if (p.type === 'glow') {
        ctx.fillStyle = p.color;
        ctx.shadowColor = p.color;
        ctx.shadowBlur = 10;
        ctx.globalAlpha = alpha * 0.7;
        ctx.beginPath();
        ctx.arc(p.x, p.y, p.size * alpha, 0, Math.PI * 2);
        ctx.fill();
        ctx.shadowBlur = 0;
      }
    }
    ctx.restore();
  }
}
