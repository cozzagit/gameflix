// ─── Visual Effects ───────────────────────────────────────────────
// CRT scanlines, phosphor glow, sparks, morse decoration

import { CANVAS_W, CANVAS_H, COLORS, Particle } from './types';

// ─── Scanline Effect ──────────────────────────────────────────────

let scanlineOffset = 0;

export function drawScanlines(ctx: CanvasRenderingContext2D, intensity: number = 0.12): void {
  scanlineOffset = (scanlineOffset + 0.5) % 4;
  ctx.save();
  for (let y = scanlineOffset; y < CANVAS_H; y += 4) {
    ctx.fillStyle = `rgba(0,0,0,${intensity})`;
    ctx.fillRect(0, y, CANVAS_W, 2);
  }
  ctx.restore();
}

// ─── CRT Curvature Effect ─────────────────────────────────────────

export function drawCRTCurvature(ctx: CanvasRenderingContext2D): void {
  ctx.save();
  // Vignette: darken edges
  const gradient = ctx.createRadialGradient(
    CANVAS_W / 2, CANVAS_H / 2, CANVAS_W * 0.3,
    CANVAS_W / 2, CANVAS_H / 2, CANVAS_W * 0.75
  );
  gradient.addColorStop(0, 'rgba(0,0,0,0)');
  gradient.addColorStop(0.7, 'rgba(0,0,0,0.1)');
  gradient.addColorStop(1, 'rgba(0,0,0,0.5)');
  ctx.fillStyle = gradient;
  ctx.fillRect(0, 0, CANVAS_W, CANVAS_H);
  ctx.restore();
}

// ─── Phosphor Glow ────────────────────────────────────────────────

export function drawPhosphorGlow(ctx: CanvasRenderingContext2D, x: number, y: number, w: number, h: number): void {
  ctx.save();
  ctx.shadowColor = COLORS.greenGlow;
  ctx.shadowBlur = 20;
  ctx.strokeStyle = `${COLORS.green}15`;
  ctx.lineWidth = 2;
  ctx.strokeRect(x - 5, y - 5, w + 10, h + 10);
  ctx.shadowBlur = 0;
  ctx.restore();
}

// ─── Screen Glow Effect ───────────────────────────────────────────

export function drawScreenGlow(ctx: CanvasRenderingContext2D, x: number, y: number, w: number, h: number): void {
  ctx.save();
  const glow = ctx.createRadialGradient(
    x + w / 2, y + h / 2, Math.min(w, h) * 0.3,
    x + w / 2, y + h / 2, Math.max(w, h) * 0.7
  );
  glow.addColorStop(0, 'rgba(0,255,65,0.03)');
  glow.addColorStop(1, 'rgba(0,255,65,0)');
  ctx.fillStyle = glow;
  ctx.fillRect(x, y, w, h);
  ctx.restore();
}

// ─── Morse Code Decoration (dots running along edges) ─────────────

let morseDecoTime = 0;

export function drawMorseDecoration(ctx: CanvasRenderingContext2D, dt: number): void {
  morseDecoTime += dt;
  ctx.save();
  ctx.globalAlpha = 0.3;

  // Top edge
  const pattern = [1, 1, 1, 0, 3, 0, 1, 0, 3, 3, 0, 1, 1, 0, 3, 0, 1, 3, 0, 0];
  let px = ((morseDecoTime * 30) % 40) - 40;
  for (let i = 0; px < CANVAS_W + 10; i++) {
    const sym = pattern[i % pattern.length];
    if (sym === 1) {
      ctx.fillStyle = COLORS.greenDim;
      ctx.beginPath();
      ctx.arc(px, 6, 2, 0, Math.PI * 2);
      ctx.fill();
      px += 8;
    } else if (sym === 3) {
      ctx.fillStyle = COLORS.greenDim;
      ctx.fillRect(px, 4, 12, 4);
      px += 18;
    } else {
      px += 8;
    }
  }

  // Bottom edge
  px = CANVAS_W - ((morseDecoTime * 25) % 40);
  for (let i = 0; px > -10; i++) {
    const sym = pattern[(i + 5) % pattern.length];
    if (sym === 1) {
      ctx.fillStyle = COLORS.greenDim;
      ctx.beginPath();
      ctx.arc(px, CANVAS_H - 6, 2, 0, Math.PI * 2);
      ctx.fill();
      px -= 8;
    } else if (sym === 3) {
      ctx.fillStyle = COLORS.greenDim;
      ctx.fillRect(px - 12, CANVAS_H - 8, 12, 4);
      px -= 18;
    } else {
      px -= 8;
    }
  }

  ctx.globalAlpha = 1;
  ctx.restore();
}

// ─── Particle System ──────────────────────────────────────────────

const particles: Particle[] = [];

export function spawnParticles(x: number, y: number, count: number, type: Particle['type'] = 'spark'): void {
  for (let i = 0; i < count; i++) {
    const angle = Math.random() * Math.PI * 2;
    const speed = 30 + Math.random() * 80;
    particles.push({
      x,
      y,
      vx: Math.cos(angle) * speed,
      vy: Math.sin(angle) * speed,
      life: 0.5 + Math.random() * 0.8,
      maxLife: 0.5 + Math.random() * 0.8,
      size: 1 + Math.random() * 3,
      color: type === 'spark' ? COLORS.green :
        type === 'glow' ? COLORS.greenGlow :
          type === 'decrypt' ? COLORS.amber : COLORS.greenDim,
      alpha: 1,
      type,
    });
  }
}

export function updateParticles(dt: number): void {
  for (let i = particles.length - 1; i >= 0; i--) {
    const p = particles[i];
    p.life -= dt;
    if (p.life <= 0) {
      particles.splice(i, 1);
      continue;
    }
    p.x += p.vx * dt;
    p.y += p.vy * dt;
    p.vy += 40 * dt; // slight gravity
    p.alpha = p.life / p.maxLife;
    p.vx *= 0.98;
    p.vy *= 0.98;
  }
}

export function drawParticles(ctx: CanvasRenderingContext2D): void {
  ctx.save();
  for (const p of particles) {
    ctx.globalAlpha = p.alpha;
    ctx.fillStyle = p.color;
    if (p.type === 'spark' || p.type === 'decrypt') {
      ctx.fillRect(p.x - p.size / 2, p.y - p.size / 2, p.size, p.size);
    } else {
      ctx.beginPath();
      ctx.arc(p.x, p.y, p.size, 0, Math.PI * 2);
      ctx.fill();
    }
    // Glow
    if (p.type === 'glow' || p.type === 'decrypt') {
      ctx.shadowColor = p.color;
      ctx.shadowBlur = 8;
      ctx.beginPath();
      ctx.arc(p.x, p.y, p.size * 0.5, 0, Math.PI * 2);
      ctx.fill();
      ctx.shadowBlur = 0;
    }
  }
  ctx.globalAlpha = 1;
  ctx.restore();
}

// ─── Classified Stamp ─────────────────────────────────────────────

export function drawClassifiedStamp(ctx: CanvasRenderingContext2D, x: number, y: number, rotation: number = -0.15, scale: number = 1): void {
  ctx.save();
  ctx.translate(x, y);
  ctx.rotate(rotation);
  ctx.scale(scale, scale);

  // Outer border
  ctx.strokeStyle = COLORS.classified;
  ctx.lineWidth = 3;
  ctx.globalAlpha = 0.7;
  ctx.strokeRect(-80, -22, 160, 44);

  // Text
  ctx.fillStyle = COLORS.classified;
  ctx.font = `bold 28px ${FONTS_MONO}`;
  ctx.textAlign = 'center';
  ctx.textBaseline = 'middle';
  ctx.fillText('CLASSIFICATO', 0, 0);

  // Double border
  ctx.strokeRect(-84, -26, 168, 52);

  ctx.globalAlpha = 1;
  ctx.restore();
}

const FONTS_MONO = '"Courier New", Courier, monospace';

// ─── Redacted Text ────────────────────────────────────────────────

export function drawRedactedText(ctx: CanvasRenderingContext2D, x: number, y: number, width: number): void {
  ctx.save();
  ctx.fillStyle = COLORS.greenDark;
  ctx.globalAlpha = 0.4;
  const blockWidth = 40 + Math.random() * 60;
  let cx = x;
  while (cx < x + width) {
    const bw = Math.min(blockWidth, x + width - cx);
    ctx.fillRect(cx, y - 6, bw - 4, 14);
    cx += bw;
  }
  ctx.globalAlpha = 1;
  ctx.restore();
}

// ─── Flicker effect ───────────────────────────────────────────────

let flickerTimer = 0;
let flickerAlpha = 0;

export function updateFlicker(dt: number): number {
  flickerTimer += dt;
  if (flickerTimer > 3 + Math.random() * 5) {
    flickerAlpha = 0.05 + Math.random() * 0.1;
    flickerTimer = 0;
  }
  flickerAlpha *= 0.9;
  return flickerAlpha;
}

export function drawFlicker(ctx: CanvasRenderingContext2D, alpha: number): void {
  if (alpha > 0.001) {
    ctx.save();
    ctx.fillStyle = `rgba(0,255,65,${alpha})`;
    ctx.fillRect(0, 0, CANVAS_W, CANVAS_H);
    ctx.restore();
  }
}

// ─── Screen Border ────────────────────────────────────────────────

export function drawScreenBorder(ctx: CanvasRenderingContext2D): void {
  ctx.save();
  ctx.strokeStyle = COLORS.screenBorder;
  ctx.lineWidth = 4;
  ctx.strokeRect(2, 2, CANVAS_W - 4, CANVAS_H - 4);

  // Corner brackets
  const cs = 20;
  const corners = [
    [0, 0, 1, 1],
    [CANVAS_W, 0, -1, 1],
    [0, CANVAS_H, 1, -1],
    [CANVAS_W, CANVAS_H, -1, -1],
  ];
  ctx.strokeStyle = COLORS.greenDim;
  ctx.lineWidth = 2;
  for (const [cx, cy, dx, dy] of corners) {
    ctx.beginPath();
    ctx.moveTo(cx + dx * cs, cy + dy * 2);
    ctx.lineTo(cx + dx * 2, cy + dy * 2);
    ctx.lineTo(cx + dx * 2, cy + dy * cs);
    ctx.stroke();
  }
  ctx.restore();
}
