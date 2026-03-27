import { Particle, Sparkle } from './types';

export function createMergeParticles(x: number, y: number, color: string, count: number = 20): Particle[] {
  const particles: Particle[] = [];
  for (let i = 0; i < count; i++) {
    const angle = (Math.PI * 2 * i) / count + (Math.random() - 0.5) * 0.5;
    const speed = 60 + Math.random() * 120;
    particles.push({
      x,
      y,
      vx: Math.cos(angle) * speed,
      vy: Math.sin(angle) * speed,
      life: 0.6 + Math.random() * 0.4,
      maxLife: 0.6 + Math.random() * 0.4,
      color,
      size: 2 + Math.random() * 4,
    });
  }
  return particles;
}

export function createDiscoveryBurst(x: number, y: number, count: number = 40): Particle[] {
  const particles: Particle[] = [];
  const colors = ['#FFD700', '#FFA000', '#FFEB3B', '#FFF176', '#FFFFFF'];
  for (let i = 0; i < count; i++) {
    const angle = (Math.PI * 2 * i) / count + (Math.random() - 0.5) * 0.3;
    const speed = 80 + Math.random() * 200;
    particles.push({
      x,
      y,
      vx: Math.cos(angle) * speed,
      vy: Math.sin(angle) * speed,
      life: 0.8 + Math.random() * 0.6,
      maxLife: 0.8 + Math.random() * 0.6,
      color: colors[Math.floor(Math.random() * colors.length)],
      size: 3 + Math.random() * 5,
    });
  }
  return particles;
}

export function createInvalidPuff(x: number, y: number): Particle[] {
  const particles: Particle[] = [];
  for (let i = 0; i < 10; i++) {
    const angle = Math.random() * Math.PI * 2;
    const speed = 30 + Math.random() * 50;
    particles.push({
      x,
      y,
      vx: Math.cos(angle) * speed,
      vy: Math.sin(angle) * speed,
      life: 0.3 + Math.random() * 0.2,
      maxLife: 0.3 + Math.random() * 0.2,
      color: '#888888',
      size: 2 + Math.random() * 3,
    });
  }
  return particles;
}

export function updateParticles(particles: Particle[], dt: number): Particle[] {
  return particles.filter(p => {
    p.x += p.vx * dt;
    p.y += p.vy * dt;
    p.vx *= 0.97;
    p.vy *= 0.97;
    p.life -= dt;
    return p.life > 0;
  });
}

export function createSparkle(canvasW: number, canvasH: number): Sparkle {
  return {
    x: Math.random() * canvasW,
    y: Math.random() * canvasH,
    vx: (Math.random() - 0.5) * 10,
    vy: -5 - Math.random() * 15,
    life: 2 + Math.random() * 3,
    maxLife: 2 + Math.random() * 3,
    size: 1 + Math.random() * 2,
    alpha: 0,
  };
}

export function updateSparkles(sparkles: Sparkle[], dt: number, canvasW: number, canvasH: number): Sparkle[] {
  const filtered = sparkles.filter(s => {
    s.x += s.vx * dt;
    s.y += s.vy * dt;
    s.life -= dt;
    const t = 1 - s.life / s.maxLife;
    s.alpha = t < 0.2 ? t / 0.2 : t > 0.8 ? (1 - t) / 0.2 : 1;
    s.alpha *= 0.4;
    return s.life > 0;
  });

  // Maintain ~30 sparkles
  while (filtered.length < 30) {
    filtered.push(createSparkle(canvasW, canvasH));
  }

  return filtered;
}

export function drawParticles(ctx: CanvasRenderingContext2D, particles: Particle[]): void {
  for (const p of particles) {
    const alpha = Math.max(0, p.life / p.maxLife);
    ctx.globalAlpha = alpha;
    ctx.fillStyle = p.color;
    ctx.beginPath();
    ctx.arc(p.x, p.y, p.size * alpha, 0, Math.PI * 2);
    ctx.fill();
  }
  ctx.globalAlpha = 1;
}

export function drawSparkles(ctx: CanvasRenderingContext2D, sparkles: Sparkle[]): void {
  for (const s of sparkles) {
    ctx.globalAlpha = s.alpha;
    ctx.fillStyle = '#FFFFFF';
    ctx.beginPath();
    // Draw small diamond
    ctx.moveTo(s.x, s.y - s.size);
    ctx.lineTo(s.x + s.size * 0.5, s.y);
    ctx.lineTo(s.x, s.y + s.size);
    ctx.lineTo(s.x - s.size * 0.5, s.y);
    ctx.closePath();
    ctx.fill();
  }
  ctx.globalAlpha = 1;
}
