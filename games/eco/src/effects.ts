import { Particle, COL } from './types';

export class EffectsSystem {
  particles: Particle[] = [];

  /** Spawn particles along a wave ring hitting a wall */
  spawnWaveHit(x: number, y: number, color: string, count: number = 5): void {
    for (let i = 0; i < count; i++) {
      const angle = Math.random() * Math.PI * 2;
      const speed = 10 + Math.random() * 30;
      this.particles.push({
        x,
        y,
        vx: Math.cos(angle) * speed,
        vy: Math.sin(angle) * speed,
        life: 1.0,
        maxLife: 0.8 + Math.random() * 0.6,
        color,
        size: 1 + Math.random() * 2,
      });
    }
  }

  /** Crystal sparkle */
  spawnCrystalSparkle(x: number, y: number): void {
    for (let i = 0; i < 12; i++) {
      const angle = Math.random() * Math.PI * 2;
      const speed = 20 + Math.random() * 60;
      this.particles.push({
        x,
        y,
        vx: Math.cos(angle) * speed,
        vy: Math.sin(angle) * speed,
        life: 1.0,
        maxLife: 0.6 + Math.random() * 0.8,
        color: COL.crystal,
        size: 1.5 + Math.random() * 2.5,
      });
    }
  }

  /** Water ripple particles */
  spawnWaterRipple(x: number, y: number): void {
    for (let i = 0; i < 4; i++) {
      const angle = Math.random() * Math.PI * 2;
      const speed = 5 + Math.random() * 15;
      this.particles.push({
        x,
        y,
        vx: Math.cos(angle) * speed,
        vy: Math.sin(angle) * speed,
        life: 1.0,
        maxLife: 1.0 + Math.random() * 1.0,
        color: COL.water,
        size: 1 + Math.random() * 1.5,
      });
    }
  }

  /** Dust motes near revealed surfaces */
  spawnDust(x: number, y: number): void {
    this.particles.push({
      x: x + (Math.random() - 0.5) * 30,
      y: y + (Math.random() - 0.5) * 30,
      vx: (Math.random() - 0.5) * 4,
      vy: (Math.random() - 0.5) * 4 - 2,
      life: 1.0,
      maxLife: 2.0 + Math.random() * 2.0,
      color: '#334155',
      size: 0.8 + Math.random() * 1.2,
    });
  }

  /** Exit portal particles */
  spawnExitParticle(x: number, y: number, radius: number): void {
    const angle = Math.random() * Math.PI * 2;
    const r = radius * (0.5 + Math.random() * 0.5);
    this.particles.push({
      x: x + Math.cos(angle) * r,
      y: y + Math.sin(angle) * r,
      vx: Math.cos(angle) * 5,
      vy: Math.sin(angle) * 5 - 8,
      life: 1.0,
      maxLife: 0.8 + Math.random() * 0.6,
      color: COL.exit,
      size: 1.5 + Math.random() * 2,
    });
  }

  update(dt: number): void {
    for (const p of this.particles) {
      p.x += p.vx * dt;
      p.y += p.vy * dt;
      p.vx *= 0.97;
      p.vy *= 0.97;
      p.life -= dt / p.maxLife;
    }
    this.particles = this.particles.filter(p => p.life > 0);
  }

  reset(): void {
    this.particles = [];
  }
}
