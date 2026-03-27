// ============================================================
// TinyEmpire — Age Advancement Ceremony
// ============================================================
//
// Plays a dramatic 3-second visual sequence whenever the player
// advances to a new age. Renders entirely in screen-space on top
// of all other layers.
// ============================================================

interface CeremonyParticle {
  x: number;
  y: number;
  vx: number;
  vy: number;
  life: number;     // seconds remaining
  maxLife: number;  // seconds total lifetime
  color: string;
}

const PARTICLE_COLORS = ['#FFD040', '#FFF0C0', '#E8A020', '#FFC840', '#FFFBE0'] as const;
const TOTAL_DURATION = 3.0;

// Timeline markers (seconds)
const PHASE_DIM_END    = 0.5;
const PHASE_BURST_END  = 1.5;
const PHASE_TEXT_END   = 2.5;
const PHASE_FADE_END   = 3.0;

export class AgeCeremony {
  private active = false;
  private timer = 0;
  private ageName = '';
  private particles: CeremonyParticle[] = [];

  /** Trigger the ceremony for the given age name. */
  start(ageName: string): void {
    this.ageName = ageName;
    this.timer = 0;
    this.particles = [];
    this.active = true;
  }

  /** Advance animation state by dt seconds. */
  update(dt: number): void {
    if (!this.active) return;

    this.timer += dt;

    // Spawn particle burst at the start of the burst phase
    // We spawn them once when we cross 0.5s (start of burst phase)
    if (this.timer >= PHASE_DIM_END && this.timer - dt < PHASE_DIM_END) {
      this.spawnBurst();
    }

    // Update existing particles
    const toRemove: number[] = [];
    for (let i = 0; i < this.particles.length; i++) {
      const p = this.particles[i];
      p.life -= dt;
      if (p.life <= 0) {
        toRemove.push(i);
        continue;
      }
      p.x += p.vx * dt;
      p.y += p.vy * dt;
      // Decelerate
      p.vx *= 1 - 2 * dt;
      p.vy *= 1 - 2 * dt;
    }
    // Remove dead particles (reverse order to preserve indices)
    for (let i = toRemove.length - 1; i >= 0; i--) {
      this.particles.splice(toRemove[i], 1);
    }

    if (this.timer >= TOTAL_DURATION) {
      this.active = false;
      this.particles = [];
    }
  }

  /** Draw the ceremony overlay on top of everything else. */
  render(ctx: CanvasRenderingContext2D, canvasWidth: number, canvasHeight: number): void {
    if (!this.active) return;

    const t = this.timer;
    const cx = canvasWidth / 2;
    const cy = canvasHeight / 2;

    ctx.save();

    // ----------------------------------------------------------------
    // Phase 1 (0.0 – 0.5s): dim overlay fades in
    // ----------------------------------------------------------------
    if (t <= PHASE_DIM_END) {
      const alpha = 0.5 * (t / PHASE_DIM_END);
      ctx.fillStyle = `rgba(0,0,0,${alpha.toFixed(3)})`;
      ctx.fillRect(0, 0, canvasWidth, canvasHeight);
    } else {
      // Keep the dim overlay at 0.5 through the rest of the sequence
      let overlayAlpha = 0.5;
      if (t >= PHASE_TEXT_END) {
        // Fade out in the last 0.5 s
        overlayAlpha = 0.5 * (1 - (t - PHASE_TEXT_END) / (PHASE_FADE_END - PHASE_TEXT_END));
      }
      ctx.fillStyle = `rgba(0,0,0,${overlayAlpha.toFixed(3)})`;
      ctx.fillRect(0, 0, canvasWidth, canvasHeight);
    }

    // ----------------------------------------------------------------
    // Phase 2 (0.5 – 1.5s): expanding golden ring + particles
    // ----------------------------------------------------------------
    if (t >= PHASE_DIM_END && t < PHASE_BURST_END) {
      const progress = (t - PHASE_DIM_END) / (PHASE_BURST_END - PHASE_DIM_END); // 0→1

      // Ring: radius 10 → 200, stroke 3 → 1, alpha 1 → 0
      const ringRadius = 10 + progress * 190;
      const ringStroke = 3 - progress * 2;   // 3 → 1
      const ringAlpha  = 1 - progress;       // 1 → 0

      ctx.globalAlpha = ringAlpha;
      ctx.strokeStyle = '#FFD040';
      ctx.lineWidth = ringStroke;
      ctx.beginPath();
      ctx.arc(cx, cy, ringRadius, 0, Math.PI * 2);
      ctx.stroke();
      ctx.globalAlpha = 1;
    }

    // Also keep rendering the ring after burst starts fading (let it die naturally)
    if (t >= PHASE_BURST_END && t < PHASE_BURST_END + 0.3) {
      const fade = 1 - (t - PHASE_BURST_END) / 0.3;
      ctx.globalAlpha = fade * 0.4;
      ctx.strokeStyle = '#FFD040';
      ctx.lineWidth = 1;
      ctx.beginPath();
      ctx.arc(cx, cy, 200, 0, Math.PI * 2);
      ctx.stroke();
      ctx.globalAlpha = 1;
    }

    // ----------------------------------------------------------------
    // Particles (alive from burst until they naturally expire)
    // ----------------------------------------------------------------
    for (const p of this.particles) {
      const alpha = Math.max(0, p.life / p.maxLife);
      ctx.globalAlpha = alpha;
      ctx.fillStyle = p.color;
      ctx.fillRect(Math.round(p.x) - 1, Math.round(p.y) - 1, 2, 2);
    }
    ctx.globalAlpha = 1;

    // ----------------------------------------------------------------
    // Phase 3 (1.5 – 2.5s): age name text with glow
    // ----------------------------------------------------------------
    if (t >= PHASE_BURST_END && t < PHASE_FADE_END) {
      let textAlpha: number;
      if (t < PHASE_TEXT_END) {
        // Fade in over 0.3 s
        textAlpha = Math.min(1, (t - PHASE_BURST_END) / 0.3);
      } else {
        // Fade out over 0.5 s
        textAlpha = 1 - (t - PHASE_TEXT_END) / (PHASE_FADE_END - PHASE_TEXT_END);
      }
      textAlpha = Math.max(0, textAlpha);

      const label = this.ageName.toUpperCase();
      ctx.font = 'bold 16px "Segoe UI", Arial, sans-serif';
      ctx.textBaseline = 'middle';
      ctx.textAlign = 'center';

      // Glow pass — blurred (simulate with a slightly transparent wider shadow)
      ctx.globalAlpha = textAlpha * 0.6;
      ctx.fillStyle = '#FFD040';
      ctx.shadowColor = '#FFD040';
      ctx.shadowBlur = 8;
      ctx.fillText(label, cx, cy);

      // Sharp pass
      ctx.globalAlpha = textAlpha;
      ctx.shadowBlur = 0;
      ctx.fillStyle = '#FFD040';
      ctx.fillText(label, cx, cy);

      ctx.shadowBlur = 0;
      ctx.globalAlpha = 1;
      ctx.textAlign = 'left';
      ctx.textBaseline = 'alphabetic';
    }

    ctx.restore();
  }

  isActive(): boolean {
    return this.active;
  }

  // --------------------------------------------------------------------------
  // Internals
  // --------------------------------------------------------------------------

  private spawnBurst(): void {
    // Spawn 50 particles in a 480x270 virtual canvas
    // Center is roughly 240, 135
    const COUNT = 50;
    for (let i = 0; i < COUNT; i++) {
      const angle = (i / COUNT) * Math.PI * 2 + (Math.random() - 0.5) * 0.3;
      const speed = 30 + Math.random() * 70;   // pixels per second
      const life  = 0.8 + Math.random() * 1.2;
      const color = PARTICLE_COLORS[i % PARTICLE_COLORS.length];
      this.particles.push({
        x:       240,
        y:       135,
        vx:      Math.cos(angle) * speed,
        vy:      Math.sin(angle) * speed,
        life,
        maxLife: life,
        color,
      });
    }
  }
}
