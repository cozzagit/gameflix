// ─── Particle Effects System ─────────────────────────────────────────

import { type Particle, type Vec2, GAME_W, GAME_H } from './types';

const particles: Particle[] = [];
const MAX_PARTICLES = 300;

export function spawnDustParticles(flashPos: Vec2, radius: number): void {
  if (particles.length > MAX_PARTICLES - 5) return;
  if (Math.random() > 0.3) return;

  const angle = Math.random() * Math.PI * 2;
  const dist = Math.random() * radius * 0.8;
  const p: Particle = {
    x: flashPos.x + Math.cos(angle) * dist,
    y: flashPos.y + Math.sin(angle) * dist,
    vx: (Math.random() - 0.5) * 0.3,
    vy: -Math.random() * 0.2 - 0.1,
    life: 1,
    maxLife: 1,
    size: Math.random() * 2 + 0.5,
    color: '#FFF5E0',
    alpha: Math.random() * 0.3 + 0.1,
  };
  particles.push(p);
}

export function spawnDiscoveryBurst(x: number, y: number): void {
  for (let i = 0; i < 25; i++) {
    const angle = (Math.PI * 2 * i) / 25 + Math.random() * 0.3;
    const speed = Math.random() * 3 + 1;
    particles.push({
      x,
      y,
      vx: Math.cos(angle) * speed,
      vy: Math.sin(angle) * speed,
      life: 1,
      maxLife: 1,
      size: Math.random() * 3 + 1,
      color: Math.random() > 0.5 ? '#FFD700' : '#FFF5E0',
      alpha: 0.9,
    });
  }
}

export function spawnRainParticles(): void {
  if (particles.length > MAX_PARTICLES - 3) return;
  if (Math.random() > 0.6) return;
  particles.push({
    x: Math.random() * GAME_W,
    y: -5,
    vx: -1,
    vy: Math.random() * 4 + 6,
    life: 3,
    maxLife: 3,
    size: 1,
    color: '#8888CC',
    alpha: 0.2,
  });
}

export function updateParticles(dt: number): void {
  for (let i = particles.length - 1; i >= 0; i--) {
    const p = particles[i];
    p.x += p.vx;
    p.y += p.vy;
    p.life -= dt;
    if (p.life <= 0 || p.y > GAME_H + 10) {
      particles.splice(i, 1);
    }
  }
}

export function drawParticles(ctx: CanvasRenderingContext2D): void {
  for (const p of particles) {
    const fade = Math.max(0, p.life / p.maxLife);
    ctx.globalAlpha = p.alpha * fade;
    ctx.fillStyle = p.color;
    if (p.vy > 5) {
      // rain - draw as line
      ctx.beginPath();
      ctx.moveTo(p.x, p.y);
      ctx.lineTo(p.x + p.vx, p.y - p.size * 4);
      ctx.strokeStyle = p.color;
      ctx.lineWidth = 0.5;
      ctx.stroke();
    } else {
      ctx.beginPath();
      ctx.arc(p.x, p.y, p.size, 0, Math.PI * 2);
      ctx.fill();
    }
  }
  ctx.globalAlpha = 1;
}

export function clearParticles(): void {
  particles.length = 0;
}
