import { Particle, CANVAS_W, CANVAS_H } from './types';

export class ParticleSystem {
  particles: Particle[] = [];

  /** Ambient dust motes floating in warm light */
  spawnDust(): void {
    if (this.particles.filter(p => p.type === 'dust').length > 25) return;
    const x = Math.random() * CANVAS_W;
    const y = Math.random() * CANVAS_H;
    this.particles.push({
      x,
      y,
      vx: (Math.random() - 0.5) * 0.3,
      vy: -0.1 - Math.random() * 0.2,
      life: 0,
      maxLife: 300 + Math.random() * 400,
      size: 1 + Math.random() * 2,
      color: '#FFD700',
      alpha: 0,
      type: 'dust',
    });
  }

  /** Golden particle burst on solve */
  spawnSolveBurst(cx: number, cy: number): void {
    for (let i = 0; i < 80; i++) {
      const angle = Math.random() * Math.PI * 2;
      const speed = 1 + Math.random() * 5;
      const hue = 40 + Math.random() * 20;
      this.particles.push({
        x: cx + (Math.random() - 0.5) * 60,
        y: cy + (Math.random() - 0.5) * 30,
        vx: Math.cos(angle) * speed,
        vy: Math.sin(angle) * speed - 1,
        life: 0,
        maxLife: 60 + Math.random() * 60,
        size: 2 + Math.random() * 4,
        color: `hsl(${hue}, 100%, ${60 + Math.random() * 30}%)`,
        alpha: 1,
        type: 'gold',
      });
    }
  }

  /** Light rays on solve */
  spawnRays(cx: number, cy: number): void {
    for (let i = 0; i < 12; i++) {
      const angle = (i / 12) * Math.PI * 2;
      this.particles.push({
        x: cx,
        y: cy,
        vx: Math.cos(angle) * 2,
        vy: Math.sin(angle) * 2,
        life: 0,
        maxLife: 80,
        size: 3,
        color: '#FFD700',
        alpha: 0.7,
        type: 'ray',
        angle,
      });
    }
  }

  update(): void {
    for (let i = this.particles.length - 1; i >= 0; i--) {
      const p = this.particles[i];
      p.life++;
      p.x += p.vx;
      p.y += p.vy;

      const progress = p.life / p.maxLife;

      if (p.type === 'dust') {
        p.vx += (Math.random() - 0.5) * 0.05;
        if (progress < 0.2) {
          p.alpha = progress / 0.2 * 0.25;
        } else if (progress > 0.8) {
          p.alpha = (1 - progress) / 0.2 * 0.25;
        } else {
          p.alpha = 0.25;
        }
      } else if (p.type === 'gold') {
        p.vy += 0.03;
        p.vx *= 0.98;
        p.vy *= 0.98;
        p.alpha = 1 - progress;
        p.size *= 0.99;
      } else if (p.type === 'ray') {
        p.alpha = 0.7 * (1 - progress);
        p.size = 3 + progress * 80;
      }

      if (p.life >= p.maxLife) {
        this.particles.splice(i, 1);
      }
    }
  }

  draw(ctx: CanvasRenderingContext2D): void {
    for (const p of this.particles) {
      ctx.save();
      ctx.globalAlpha = p.alpha;

      if (p.type === 'ray') {
        const angle = p.angle ?? 0;
        const len = p.size * 3;
        const grad = ctx.createLinearGradient(
          p.x, p.y,
          p.x + Math.cos(angle) * len,
          p.y + Math.sin(angle) * len
        );
        grad.addColorStop(0, 'rgba(255,215,0,0.4)');
        grad.addColorStop(1, 'rgba(255,215,0,0)');
        ctx.strokeStyle = grad;
        ctx.lineWidth = 2 + (1 - p.life / p.maxLife) * 4;
        ctx.beginPath();
        ctx.moveTo(p.x, p.y);
        ctx.lineTo(
          p.x + Math.cos(angle) * len,
          p.y + Math.sin(angle) * len
        );
        ctx.stroke();
      } else {
        ctx.fillStyle = p.color;
        ctx.beginPath();
        ctx.arc(p.x, p.y, p.size, 0, Math.PI * 2);
        ctx.fill();

        // Glow for gold particles
        if (p.type === 'gold' && p.size > 2) {
          ctx.globalAlpha = p.alpha * 0.3;
          ctx.beginPath();
          ctx.arc(p.x, p.y, p.size * 2.5, 0, Math.PI * 2);
          ctx.fill();
        }
      }

      ctx.restore();
    }
  }

  clear(): void {
    this.particles = this.particles.filter(p => p.type === 'dust');
  }
}
