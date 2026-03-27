import { Particle } from './types';

const particles: Particle[] = [];
const MAX_PARTICLES = 200;

export function spawnParticles(x: number, y: number, color: string, count: number = 8): void {
  for (let i = 0; i < count && particles.length < MAX_PARTICLES; i++) {
    const angle = Math.random() * Math.PI * 2;
    const speed = 0.5 + Math.random() * 2;
    particles.push({
      x,
      y,
      vx: Math.cos(angle) * speed,
      vy: Math.sin(angle) * speed,
      life: 1,
      maxLife: 0.5 + Math.random() * 0.8,
      color,
      size: 1 + Math.random() * 3,
    });
  }
}

export function spawnBeamHitParticles(x: number, y: number, r: number, g: number, b: number): void {
  const color = `rgb(${r * 255}, ${g * 255}, ${b * 255})`;
  spawnParticles(x, y, color, 3);
}

export function updateParticles(dt: number): void {
  for (let i = particles.length - 1; i >= 0; i--) {
    const p = particles[i];
    p.x += p.vx;
    p.y += p.vy;
    p.vx *= 0.97;
    p.vy *= 0.97;
    p.life -= dt / p.maxLife;
    if (p.life <= 0) {
      particles.splice(i, 1);
    }
  }
}

export function renderParticles(ctx: CanvasRenderingContext2D): void {
  for (const p of particles) {
    const alpha = Math.max(0, p.life);
    ctx.save();
    ctx.globalAlpha = alpha;
    ctx.shadowColor = p.color;
    ctx.shadowBlur = 8;
    ctx.fillStyle = p.color;
    ctx.beginPath();
    ctx.arc(p.x, p.y, p.size * alpha, 0, Math.PI * 2);
    ctx.fill();
    ctx.restore();
  }
}

export function clearParticles(): void {
  particles.length = 0;
}
