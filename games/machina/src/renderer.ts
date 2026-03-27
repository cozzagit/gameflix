// ============================================================
// Machina — Shared Rendering Utilities
// ============================================================

import { C, GAME_W, GAME_H } from './types';

/** Draw the dark textured background (simulated leather/wood grain) */
export function drawBackground(ctx: CanvasRenderingContext2D): void {
  // Base dark gradient
  const bg = ctx.createRadialGradient(GAME_W / 2, GAME_H / 2, 100, GAME_W / 2, GAME_H / 2, 600);
  bg.addColorStop(0, '#22223A');
  bg.addColorStop(1, '#0D0D1A');
  ctx.fillStyle = bg;
  ctx.fillRect(0, 0, GAME_W, GAME_H);

  // Noise texture overlay (simulated with small rects)
  ctx.globalAlpha = 0.03;
  for (let i = 0; i < 2000; i++) {
    const nx = Math.random() * GAME_W;
    const ny = Math.random() * GAME_H;
    const ns = 1 + Math.random() * 3;
    ctx.fillStyle = Math.random() > 0.5 ? '#FFFFFF' : '#000000';
    ctx.fillRect(nx, ny, ns, ns);
  }
  ctx.globalAlpha = 1;

  // Vignette
  const vig = ctx.createRadialGradient(GAME_W / 2, GAME_H / 2, 200, GAME_W / 2, GAME_H / 2, 700);
  vig.addColorStop(0, 'rgba(0,0,0,0)');
  vig.addColorStop(1, 'rgba(0,0,0,0.5)');
  ctx.fillStyle = vig;
  ctx.fillRect(0, 0, GAME_W, GAME_H);
}

/** Draw a metallic panel with beveled edges and shadow */
export function drawMetalPanel(
  ctx: CanvasRenderingContext2D,
  x: number, y: number, w: number, h: number,
  color: string = C.DARK_STEEL,
  radius: number = 8
): void {
  ctx.save();
  // Shadow
  ctx.shadowColor = 'rgba(0,0,0,0.6)';
  ctx.shadowBlur = 12;
  ctx.shadowOffsetX = 4;
  ctx.shadowOffsetY = 4;

  // Main fill
  const grad = ctx.createLinearGradient(x, y, x, y + h);
  grad.addColorStop(0, lighten(color, 20));
  grad.addColorStop(0.5, color);
  grad.addColorStop(1, darken(color, 20));
  ctx.fillStyle = grad;
  roundRect(ctx, x, y, w, h, radius);
  ctx.fill();
  ctx.shadowBlur = 0;
  ctx.shadowOffsetX = 0;
  ctx.shadowOffsetY = 0;

  // Top highlight
  ctx.strokeStyle = 'rgba(255,255,255,0.15)';
  ctx.lineWidth = 1;
  ctx.beginPath();
  ctx.moveTo(x + radius, y + 1);
  ctx.lineTo(x + w - radius, y + 1);
  ctx.stroke();

  // Bottom shadow line
  ctx.strokeStyle = 'rgba(0,0,0,0.3)';
  ctx.beginPath();
  ctx.moveTo(x + radius, y + h - 1);
  ctx.lineTo(x + w - radius, y + h - 1);
  ctx.stroke();

  ctx.restore();
}

/** Draw a brushed metal surface */
export function drawBrushedMetal(
  ctx: CanvasRenderingContext2D,
  x: number, y: number, w: number, h: number,
  baseColor: string = '#8B7355'
): void {
  ctx.save();
  const grad = ctx.createLinearGradient(x, y, x + w, y + h);
  grad.addColorStop(0, darken(baseColor, 15));
  grad.addColorStop(0.3, baseColor);
  grad.addColorStop(0.5, lighten(baseColor, 20));
  grad.addColorStop(0.7, baseColor);
  grad.addColorStop(1, darken(baseColor, 15));
  ctx.fillStyle = grad;
  ctx.fillRect(x, y, w, h);

  // Brushed lines
  ctx.globalAlpha = 0.05;
  ctx.strokeStyle = '#FFFFFF';
  ctx.lineWidth = 0.5;
  for (let ly = y; ly < y + h; ly += 2) {
    ctx.beginPath();
    ctx.moveTo(x, ly);
    ctx.lineTo(x + w, ly);
    ctx.stroke();
  }
  ctx.globalAlpha = 1;
  ctx.restore();
}

/** Draw a rivet/bolt */
export function drawRivet(ctx: CanvasRenderingContext2D, x: number, y: number, r: number = 5): void {
  ctx.save();
  // Shadow
  ctx.shadowColor = 'rgba(0,0,0,0.5)';
  ctx.shadowBlur = 3;
  ctx.shadowOffsetX = 1;
  ctx.shadowOffsetY = 1;

  const grad = ctx.createRadialGradient(x - r * 0.3, y - r * 0.3, 0, x, y, r);
  grad.addColorStop(0, '#AAAAAA');
  grad.addColorStop(0.5, '#666666');
  grad.addColorStop(1, '#333333');
  ctx.fillStyle = grad;
  ctx.beginPath();
  ctx.arc(x, y, r, 0, Math.PI * 2);
  ctx.fill();

  ctx.shadowBlur = 0;
  // Slot line
  ctx.strokeStyle = 'rgba(0,0,0,0.4)';
  ctx.lineWidth = 1;
  ctx.beginPath();
  ctx.moveTo(x - r * 0.5, y);
  ctx.lineTo(x + r * 0.5, y);
  ctx.stroke();
  ctx.restore();
}

/** Draw rivets at corners of a rectangle */
export function drawCornerRivets(
  ctx: CanvasRenderingContext2D,
  x: number, y: number, w: number, h: number,
  inset: number = 12, r: number = 4
): void {
  drawRivet(ctx, x + inset, y + inset, r);
  drawRivet(ctx, x + w - inset, y + inset, r);
  drawRivet(ctx, x + inset, y + h - inset, r);
  drawRivet(ctx, x + w - inset, y + h - inset, r);
}

/** Draw a gear shape */
export function drawGear(
  ctx: CanvasRenderingContext2D,
  cx: number, cy: number,
  outerR: number, innerR: number,
  teeth: number, rotation: number,
  color: string = C.BRONZE,
  markerAngle?: number
): void {
  ctx.save();
  ctx.translate(cx, cy);
  ctx.rotate(rotation);

  // Shadow
  ctx.shadowColor = 'rgba(0,0,0,0.5)';
  ctx.shadowBlur = 8;
  ctx.shadowOffsetX = 3;
  ctx.shadowOffsetY = 3;

  // Gear body
  const grad = ctx.createRadialGradient(
    -outerR * 0.2, -outerR * 0.2, 0,
    0, 0, outerR
  );
  grad.addColorStop(0, lighten(color, 30));
  grad.addColorStop(0.5, color);
  grad.addColorStop(1, darken(color, 25));

  ctx.fillStyle = grad;
  ctx.beginPath();
  const toothAngle = (Math.PI * 2) / teeth;
  const halfTooth = toothAngle * 0.3;
  for (let i = 0; i < teeth; i++) {
    const a = i * toothAngle;
    // Outer tooth
    ctx.lineTo(
      Math.cos(a - halfTooth) * outerR,
      Math.sin(a - halfTooth) * outerR
    );
    ctx.lineTo(
      Math.cos(a + halfTooth) * outerR,
      Math.sin(a + halfTooth) * outerR
    );
    // Inner valley
    const nextA = a + toothAngle;
    ctx.lineTo(
      Math.cos(a + halfTooth + toothAngle * 0.1) * innerR,
      Math.sin(a + halfTooth + toothAngle * 0.1) * innerR
    );
    ctx.lineTo(
      Math.cos(nextA - halfTooth - toothAngle * 0.1) * innerR,
      Math.sin(nextA - halfTooth - toothAngle * 0.1) * innerR
    );
  }
  ctx.closePath();
  ctx.fill();

  ctx.shadowBlur = 0;
  ctx.shadowOffsetX = 0;
  ctx.shadowOffsetY = 0;

  // Center hole
  const holeR = innerR * 0.35;
  ctx.fillStyle = C.DARK_BG;
  ctx.beginPath();
  ctx.arc(0, 0, holeR, 0, Math.PI * 2);
  ctx.fill();

  // Center rivet
  drawRivet(ctx, 0, 0, holeR * 0.6);

  // Marker dot
  if (markerAngle !== undefined) {
    const mx = Math.cos(markerAngle) * (innerR * 0.7);
    const my = Math.sin(markerAngle) * (innerR * 0.7);
    ctx.fillStyle = C.RED_GLOW;
    ctx.shadowColor = C.RED_GLOW;
    ctx.shadowBlur = 6;
    ctx.beginPath();
    ctx.arc(mx, my, 5, 0, Math.PI * 2);
    ctx.fill();
    ctx.shadowBlur = 0;
  }

  ctx.restore();
}

/** Draw a decorative frame around the puzzle area */
export function drawFrame(
  ctx: CanvasRenderingContext2D,
  x: number, y: number, w: number, h: number,
  thickness: number = 12
): void {
  ctx.save();
  // Outer frame
  drawBrushedMetal(ctx, x, y, w, thickness, C.BRONZE);
  drawBrushedMetal(ctx, x, y + h - thickness, w, thickness, C.BRONZE);
  drawBrushedMetal(ctx, x, y, thickness, h, C.BRONZE);
  drawBrushedMetal(ctx, x + w - thickness, y, thickness, h, C.BRONZE);

  // Corner rivets
  const ri = thickness / 2;
  drawRivet(ctx, x + ri, y + ri, 3);
  drawRivet(ctx, x + w - ri, y + ri, 3);
  drawRivet(ctx, x + ri, y + h - ri, 3);
  drawRivet(ctx, x + w - ri, y + h - ri, 3);

  // Additional rivets along edges
  const steps = Math.floor(w / 80);
  for (let i = 1; i < steps; i++) {
    drawRivet(ctx, x + i * (w / steps), y + ri, 2.5);
    drawRivet(ctx, x + i * (w / steps), y + h - ri, 2.5);
  }
  const vSteps = Math.floor(h / 80);
  for (let i = 1; i < vSteps; i++) {
    drawRivet(ctx, x + ri, y + i * (h / vSteps), 2.5);
    drawRivet(ctx, x + w - ri, y + i * (h / vSteps), 2.5);
  }

  ctx.restore();
}

/** Draw title text with metallic look */
export function drawTitle(
  ctx: CanvasRenderingContext2D,
  text: string, x: number, y: number,
  size: number = 48, color: string = C.TEXT_GOLD
): void {
  ctx.save();
  ctx.textAlign = 'center';
  ctx.textBaseline = 'middle';
  ctx.font = `bold ${size}px "Georgia", serif`;

  // Shadow
  ctx.shadowColor = 'rgba(0,0,0,0.7)';
  ctx.shadowBlur = 6;
  ctx.shadowOffsetX = 2;
  ctx.shadowOffsetY = 2;

  // Gold gradient text
  const grad = ctx.createLinearGradient(x - 100, y - size / 2, x + 100, y + size / 2);
  grad.addColorStop(0, lighten(color, 30));
  grad.addColorStop(0.5, color);
  grad.addColorStop(1, darken(color, 20));
  ctx.fillStyle = grad;
  ctx.fillText(text, x, y);

  ctx.shadowBlur = 0;
  ctx.restore();
}

/** Draw subtitle text */
export function drawSubtitle(
  ctx: CanvasRenderingContext2D,
  text: string, x: number, y: number,
  size: number = 18, color: string = C.TEXT_DIM
): void {
  ctx.save();
  ctx.textAlign = 'center';
  ctx.textBaseline = 'middle';
  ctx.font = `italic ${size}px "Georgia", serif`;
  ctx.fillStyle = color;
  ctx.fillText(text, x, y);
  ctx.restore();
}

/** Draw a button with metallic styling */
export function drawButton(
  ctx: CanvasRenderingContext2D,
  x: number, y: number, w: number, h: number,
  text: string, hover: boolean = false
): void {
  ctx.save();
  const color = hover ? '#8B6914' : '#6B5210';
  drawMetalPanel(ctx, x, y, w, h, color, 6);
  drawCornerRivets(ctx, x, y, w, h, 10, 3);

  ctx.textAlign = 'center';
  ctx.textBaseline = 'middle';
  ctx.font = 'bold 18px "Georgia", serif';
  ctx.fillStyle = hover ? C.WARM_LIGHT : C.TEXT_GOLD;
  ctx.fillText(text, x + w / 2, y + h / 2);
  ctx.restore();
}

/** Draw stars */
export function drawStars(
  ctx: CanvasRenderingContext2D,
  x: number, y: number,
  count: number, maxCount: number = 3, size: number = 14
): void {
  const totalW = maxCount * size * 2.2;
  const startX = x - totalW / 2 + size;
  for (let i = 0; i < maxCount; i++) {
    const sx = startX + i * size * 2.2;
    drawStar(ctx, sx, y, size, i < count);
  }
}

function drawStar(ctx: CanvasRenderingContext2D, x: number, y: number, r: number, filled: boolean): void {
  ctx.save();
  ctx.beginPath();
  for (let i = 0; i < 5; i++) {
    const a1 = (i * 72 - 90) * Math.PI / 180;
    const a2 = ((i * 72 + 36) - 90) * Math.PI / 180;
    if (i === 0) ctx.moveTo(x + Math.cos(a1) * r, y + Math.sin(a1) * r);
    else ctx.lineTo(x + Math.cos(a1) * r, y + Math.sin(a1) * r);
    ctx.lineTo(x + Math.cos(a2) * r * 0.45, y + Math.sin(a2) * r * 0.45);
  }
  ctx.closePath();
  if (filled) {
    ctx.fillStyle = C.WARM_LIGHT;
    ctx.shadowColor = C.WARM_LIGHT;
    ctx.shadowBlur = 6;
    ctx.fill();
    ctx.shadowBlur = 0;
  } else {
    ctx.strokeStyle = C.RIVET_GREY;
    ctx.lineWidth = 1;
    ctx.stroke();
  }
  ctx.restore();
}

/** Draw level HUD (moves, time, back button) */
export function drawHUD(
  ctx: CanvasRenderingContext2D,
  levelName: string, subtitle: string,
  moves: number, elapsed: number
): void {
  ctx.save();
  // Top bar
  drawBrushedMetal(ctx, 0, 0, GAME_W, 50, '#2A2A3E');

  // Level name
  ctx.textAlign = 'left';
  ctx.textBaseline = 'middle';
  ctx.font = 'bold 20px "Georgia", serif';
  ctx.fillStyle = C.TEXT_GOLD;
  ctx.fillText(levelName, 60, 25);

  ctx.font = 'italic 14px "Georgia", serif';
  ctx.fillStyle = C.TEXT_DIM;
  ctx.textAlign = 'left';
  const nameW = ctx.measureText(levelName).width;
  ctx.fillText(` — ${subtitle}`, 60 + nameW + 5, 25);

  // Back arrow
  ctx.fillStyle = C.TEXT_DIM;
  ctx.font = '24px "Georgia", serif';
  ctx.textAlign = 'center';
  ctx.fillText('\u2190', 25, 25);

  // Stats
  ctx.textAlign = 'right';
  ctx.font = '16px "Georgia", serif';
  ctx.fillStyle = C.TEXT_DIM;
  const mins = Math.floor(elapsed / 60);
  const secs = Math.floor(elapsed % 60);
  const timeStr = `${mins}:${secs.toString().padStart(2, '0')}`;
  ctx.fillText(`Mosse: ${moves}  |  Tempo: ${timeStr}`, GAME_W - 20, 25);

  ctx.restore();
}

// ---- Color utilities ----

export function lighten(hex: string, pct: number): string {
  const [r, g, b] = hexToRgb(hex);
  const f = 1 + pct / 100;
  return rgbToHex(
    Math.min(255, Math.round(r * f)),
    Math.min(255, Math.round(g * f)),
    Math.min(255, Math.round(b * f))
  );
}

export function darken(hex: string, pct: number): string {
  const [r, g, b] = hexToRgb(hex);
  const f = 1 - pct / 100;
  return rgbToHex(
    Math.max(0, Math.round(r * f)),
    Math.max(0, Math.round(g * f)),
    Math.max(0, Math.round(b * f))
  );
}

function hexToRgb(hex: string): [number, number, number] {
  hex = hex.replace('#', '');
  return [
    parseInt(hex.substring(0, 2), 16),
    parseInt(hex.substring(2, 4), 16),
    parseInt(hex.substring(4, 6), 16),
  ];
}

function rgbToHex(r: number, g: number, b: number): string {
  return '#' + [r, g, b].map(v => v.toString(16).padStart(2, '0')).join('');
}

/** Rounded rect helper */
export function roundRect(
  ctx: CanvasRenderingContext2D,
  x: number, y: number, w: number, h: number, r: number
): void {
  ctx.beginPath();
  ctx.moveTo(x + r, y);
  ctx.lineTo(x + w - r, y);
  ctx.quadraticCurveTo(x + w, y, x + w, y + r);
  ctx.lineTo(x + w, y + h - r);
  ctx.quadraticCurveTo(x + w, y + h, x + w - r, y + h);
  ctx.lineTo(x + r, y + h);
  ctx.quadraticCurveTo(x, y + h, x, y + h - r);
  ctx.lineTo(x, y + r);
  ctx.quadraticCurveTo(x, y, x + r, y);
  ctx.closePath();
}

/** Easing: ease out cubic */
export function easeOutCubic(t: number): number {
  return 1 - Math.pow(1 - t, 3);
}

/** Easing: ease in out cubic */
export function easeInOutCubic(t: number): number {
  return t < 0.5 ? 4 * t * t * t : 1 - Math.pow(-2 * t + 2, 3) / 2;
}

/** Distance between two points */
export function dist(x1: number, y1: number, x2: number, y2: number): number {
  return Math.sqrt((x2 - x1) ** 2 + (y2 - y1) ** 2);
}

/** Normalize angle to [0, 2pi) */
export function normalizeAngle(a: number): number {
  a = a % (Math.PI * 2);
  if (a < 0) a += Math.PI * 2;
  return a;
}
