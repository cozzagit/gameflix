// ============================================================
// TinyEmpire — Render Style System
// ============================================================
//
// 3 visual styles that change colors and atmosphere:
//   - pixel: classic pixel art (default)
//   - comic: warm, vivid, saturated cel-shaded look
//   - neon: dark cyberpunk, desaturated tiles, glowing resources
//
// NO outline rectangles. Styles change palette, not shapes.
// ============================================================

export type RenderStyle = 'pixel' | 'comic' | 'neon' | 'hd';

export interface StyleConfig {
  name: string;
  tileBrightness: number;
  tileSaturation: number;
  tileEdgeDarken: number;       // how much to darken tile edges (0=none, 40=heavy)
  tileGlow: boolean;            // glow circles on resource tiles (neon)
  tileGridColor: string;        // subtle grid between tiles ('' = none)
  buildingShadowStyle: 'ellipse' | 'drop' | 'glow';
  bgColor: string;
  fogColor: string;
}

export const STYLES: Record<RenderStyle, StyleConfig> = {
  pixel: {
    name: 'Pixel Art',
    tileBrightness: 1.0,
    tileSaturation: 1.0,
    tileEdgeDarken: 24,
    tileGlow: false,
    tileGridColor: '',
    buildingShadowStyle: 'ellipse',
    bgColor: '#2a3a1a',
    fogColor: 'rgba(0,0,0,0.72)',
  },
  comic: {
    name: 'Comic',
    tileBrightness: 1.0,        // no adjustment for pencil sketch
    tileSaturation: 1.0,        // no saturation change
    tileEdgeDarken: 0,          // no edge darken — pencil outlines instead
    tileGlow: false,
    tileGridColor: '',
    buildingShadowStyle: 'drop', // unused in comic — buildings skip shadow
    bgColor: '#F5F0E8',         // cream paper
    fogColor: 'rgba(245,240,232,0.95)', // paper-colored fog
  },
  hd: {
    name: 'HD',
    tileBrightness: 1.05,
    tileSaturation: 1.15,
    tileEdgeDarken: 18,
    tileGlow: false,
    tileGridColor: '',
    buildingShadowStyle: 'ellipse',
    bgColor: '#1e3010',
    fogColor: 'rgba(15,20,10,0.75)',
  },
  neon: {
    name: 'Neon',
    tileBrightness: 0.2,        // very dark tiles
    tileSaturation: 0.4,        // desaturated ground
    tileEdgeDarken: 5,          // minimal edge darken (already dark)
    tileGlow: true,             // glow on resources
    tileGridColor: 'rgba(0,200,160,0.06)', // very subtle grid
    buildingShadowStyle: 'glow',
    bgColor: '#050510',         // near-black
    fogColor: 'rgba(2,2,8,0.92)', // deep dark fog
  },
};

/** Helper: draw a rounded rectangle (comic style uses this instead of fillRect) */
export function comicRect(
  ctx: CanvasRenderingContext2D,
  x: number, y: number, w: number, h: number,
  r = 2,
): void {
  ctx.beginPath();
  ctx.roundRect(x, y, w, h, r);
  ctx.fill();
}

/** Deterministic jitter based on position — no random, no tremble */
export function wobble(v: number, _amount = 0): number {
  return v; // disabled — clean lines look better
}

/** Consistent pencil color — no random variation per frame */
export function pencilColor(): string {
  return '#3a3530';
}

/** Helper: draw a neon wireframe rectangle (outline only, with glow) */
export function neonRect(
  ctx: CanvasRenderingContext2D,
  x: number, y: number, w: number, h: number,
  color = '#00dda8',
): void {
  ctx.save();
  ctx.strokeStyle = color;
  ctx.lineWidth = 0.5;
  ctx.shadowBlur = 3;
  ctx.shadowColor = color;
  ctx.strokeRect(x + 0.5, y + 0.5, w - 1, h - 1);
  ctx.shadowBlur = 0;
  ctx.restore();
}

/** Style-aware fillRect: pixel=normal, comic=rounded, neon=wireframe */
export function styledRect(
  ctx: CanvasRenderingContext2D,
  x: number, y: number, w: number, h: number,
  fillColor: string,
  neonColor = '#00dda8',
): void {
  const id = getCurrentStyleId();
  if (id === 'comic') {
    ctx.fillStyle = fillColor;
    comicRect(ctx, x, y, w, h, Math.min(2, w / 4, h / 4));
  } else if (id === 'neon') {
    // Dim fill + glow outline
    ctx.fillStyle = fillColor;
    ctx.globalAlpha = (ctx.globalAlpha ?? 1) * 0.3;
    ctx.fillRect(x, y, w, h);
    ctx.globalAlpha = (ctx.globalAlpha ?? 1) / 0.3; // restore
    neonRect(ctx, x, y, w, h, neonColor);
  } else {
    ctx.fillStyle = fillColor;
    ctx.fillRect(x, y, w, h);
  }
}

let currentStyle: RenderStyle = 'pixel';

export function getCurrentStyle(): StyleConfig {
  return STYLES[currentStyle];
}

export function getCurrentStyleId(): RenderStyle {
  return currentStyle;
}

export function setRenderStyle(style: RenderStyle): void {
  currentStyle = style;
}

export function cycleRenderStyle(): RenderStyle {
  const order: RenderStyle[] = ['pixel', 'comic', 'neon', 'hd'];
  const idx = order.indexOf(currentStyle);
  currentStyle = order[(idx + 1) % order.length];
  return currentStyle;
}

// ---- Color utilities ---------------------------------------------------

export function adjustBrightness(hex: string, factor: number): string {
  if (!hex.startsWith('#') || hex.length < 7) return hex;
  const n = parseInt(hex.slice(1), 16);
  const r = Math.min(255, Math.max(0, Math.round(((n >> 16) & 0xff) * factor)));
  const g = Math.min(255, Math.max(0, Math.round(((n >> 8) & 0xff) * factor)));
  const b = Math.min(255, Math.max(0, Math.round((n & 0xff) * factor)));
  return `#${((r << 16) | (g << 8) | b).toString(16).padStart(6, '0')}`;
}

export function adjustSaturation(hex: string, factor: number): string {
  if (!hex.startsWith('#') || hex.length < 7) return hex;
  const n = parseInt(hex.slice(1), 16);
  let r = (n >> 16) & 0xff;
  let g = (n >> 8) & 0xff;
  let b = n & 0xff;
  const grey = 0.299 * r + 0.587 * g + 0.114 * b;
  r = Math.min(255, Math.max(0, Math.round(grey + (r - grey) * factor)));
  g = Math.min(255, Math.max(0, Math.round(grey + (g - grey) * factor)));
  b = Math.min(255, Math.max(0, Math.round(grey + (b - grey) * factor)));
  return `#${((r << 16) | (g << 8) | b).toString(16).padStart(6, '0')}`;
}

/** Apply brightness + saturation of current style to a hex color. */
export function applyStyleToColor(hex: string): string {
  const style = getCurrentStyle();
  let result = hex;
  if (style.tileSaturation !== 1.0 && result.startsWith('#') && result.length >= 7) {
    result = adjustSaturation(result, style.tileSaturation);
  }
  if (style.tileBrightness !== 1.0 && result.startsWith('#') && result.length >= 7) {
    result = adjustBrightness(result, style.tileBrightness);
  }
  return result;
}
