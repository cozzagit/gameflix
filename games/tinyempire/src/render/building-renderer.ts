// ============================================================
// TinyEmpire — Building Renderer
// ============================================================
//
// Draws all buildings procedurally using canvas primitives.
// Every building type has a unique hand-coded silhouette.
// Adjacent stone walls connect visually.
// ============================================================

import type { Building } from '../types/index.ts';
import { isoToScreen } from '../core/math.ts';
import { COLORS, getAgePalette } from './colors.ts';
import { getCurrentStyle, getCurrentStyleId, styledRect, wobble, pencilColor } from './styles.ts';

// ---- Building footprint sizes in tiles --------------------------------

const BUILDING_SIZE: Record<string, number> = {
  house: 1, lumberCamp: 1, miningCamp: 1, watchTower: 1,
  stoneWall: 1, gate: 1, mill: 1, blacksmith: 1, outpost: 1,
  bombardTower: 1, granary: 1, lumberYard: 1, stoneVault: 1, treasury: 1,
  townCenter: 2, farm: 2, market: 2, bank: 2,
  barracks: 2, archeryRange: 2, stable: 2, siegeWorkshop: 2,
  university: 2, temple: 2, monastery: 2, cannonFoundry: 2,
  castle: 3, imperialPalace: 3, wonder: 3,
};

function getBuildingSize(type: string): number {
  return BUILDING_SIZE[type] ?? 1;
}

function buildingScreenCenter(col: number, row: number, size: number) {
  const centerCol = col + (size - 1) / 2;
  const centerRow = row + (size - 1) / 2;
  return isoToScreen(centerCol, centerRow);
}

type Palette = ReturnType<typeof getAgePalette>;

// Unique accent colors per building type for visual differentiation
const BUILDING_ACCENTS: Record<string, { door: string; detail: string; roofTint: string }> = {
  house:        { door: '#5A3820', detail: '#A0C8E0', roofTint: '' },
  townCenter:   { door: '#3A2010', detail: '#FFD040', roofTint: '' },
  farm:         { door: '', detail: '#60A828', roofTint: '' },
  lumberCamp:   { door: '', detail: '#A07040', roofTint: '#6B4226' },
  miningCamp:   { door: '', detail: '#A8A098', roofTint: '#686058' },
  barracks:     { door: '#3A2010', detail: '#C03030', roofTint: '#802020' },
  archeryRange: { door: '#3A2010', detail: '#507828', roofTint: '#405820' },
  stable:       { door: '#5A3820', detail: '#D8C060', roofTint: '#8B6030' },
  watchTower:   { door: '', detail: '#C8A050', roofTint: '' },
  mill:         { door: '#5A3820', detail: '#E8A020', roofTint: '' },
  granary:      { door: '#5A3820', detail: '#D8C080', roofTint: '#C8A040' },
  blacksmith:   { door: '', detail: '#FF6020', roofTint: '#404040' },
  market:       { door: '', detail: '#D06040', roofTint: '#E8D050' },
  temple:       { door: '#2A1A08', detail: '#FFD040', roofTint: '#D0A070' },
  university:   { door: '#3A2010', detail: '#3070D0', roofTint: '#2050A0' },
  bank:         { door: '#3A2010', detail: '#FFD040', roofTint: '#C09030' },
  monastery:    { door: '#2A1A08', detail: '#9060A0', roofTint: '#604070' },
  castle:       { door: '#1A0A00', detail: '#C8A050', roofTint: '#505860' },
  siegeWorkshop:{ door: '', detail: '#7A6040', roofTint: '#504030' },
  cannonFoundry:{ door: '', detail: '#404040', roofTint: '#303030' },
  stoneVault:   { door: '#505050', detail: '#808080', roofTint: '#686058' },
  treasury:     { door: '#3A2010', detail: '#FFD040', roofTint: '#C09030' },
  lumberYard:   { door: '', detail: '#8B5E3C', roofTint: '#6B4226' },
  outpost:      { door: '', detail: '#C8B068', roofTint: '' },
  bombardTower: { door: '', detail: '#C03030', roofTint: '#404040' },
  wonder:       { door: '#1A0A00', detail: '#FFD040', roofTint: '#C8A050' },
  imperialPalace:{ door: '#3A2010', detail: '#FFE060', roofTint: '#D0A050' },
};

function getBuildingAccent(type: string) {
  return BUILDING_ACCENTS[type] ?? { door: '#3A2010', detail: '#C8A050', roofTint: '' };
}

// ---- Ground shadow (dark ellipse, offset for depth) -------------------

function drawShadow(
  ctx: CanvasRenderingContext2D,
  cx: number, cy: number,
  rx: number, ry: number,
): void {
  const style = getCurrentStyle();

  switch (style.buildingShadowStyle) {
    case 'drop': {
      // Comic: offset black rectangle below-right
      ctx.save();
      ctx.globalAlpha = 0.25;
      ctx.fillStyle = '#000000';
      ctx.fillRect(cx - rx + 2, cy + 2, rx * 2, ry * 2);
      ctx.restore();
      break;
    }
    case 'glow': {
      // Neon: colored glow ellipse
      ctx.save();
      ctx.globalAlpha = 0.3;
      ctx.fillStyle = '#00dda8';
      ctx.beginPath();
      ctx.ellipse(cx, cy + 2, rx * 1.2, ry * 1.2, 0, 0, Math.PI * 2);
      ctx.fill();
      ctx.restore();
      break;
    }
    default: {
      // Pixel: original ellipse shadow
      ctx.save();
      ctx.globalAlpha = 0.22;
      ctx.fillStyle = '#000000';
      ctx.beginPath();
      ctx.ellipse(cx + 2, cy + 3, rx * 1.1, ry, 0.15, 0, Math.PI * 2);
      ctx.fill();
      ctx.restore();
      break;
    }
  }
}

// ---- Cross-hatching for pencil sketch shadows -------------------------

function drawCrossHatch(
  ctx: CanvasRenderingContext2D,
  x: number, y: number, w: number, h: number,
): void {
  ctx.strokeStyle = 'rgba(60,55,50,0.12)';
  ctx.lineWidth = 0.2;
  const step = 3;
  for (let i = -h; i < w; i += step) {
    ctx.beginPath();
    ctx.moveTo(x + Math.max(0, i), y + Math.max(0, -i));
    ctx.lineTo(x + Math.min(w, i + h), y + Math.min(h, h - i));
    ctx.stroke();
  }
}

// ---- Pencil sketch: stroke-only rectangle with wobble -----------------

function sketchRect(
  ctx: CanvasRenderingContext2D,
  x: number, y: number, w: number, h: number,
): void {
  ctx.beginPath();
  ctx.moveTo(wobble(x), wobble(y));
  ctx.lineTo(wobble(x + w), wobble(y));
  ctx.lineTo(wobble(x + w), wobble(y + h));
  ctx.lineTo(wobble(x), wobble(y + h));
  ctx.closePath();
  ctx.stroke();
}

// ---- Pencil sketch: stroke-only triangle with wobble ------------------

function sketchTriangle(
  ctx: CanvasRenderingContext2D,
  x1: number, y1: number,
  x2: number, y2: number,
  x3: number, y3: number,
): void {
  ctx.beginPath();
  ctx.moveTo(wobble(x1), wobble(y1));
  ctx.lineTo(wobble(x2), wobble(y2));
  ctx.lineTo(wobble(x3), wobble(y3));
  ctx.closePath();
  ctx.stroke();
}

// ---- Pencil sketch: draw a comic flag (line + triangle outline) -------

function drawComicFlag(
  ctx: CanvasRenderingContext2D,
  x: number, y: number,
): void {
  const pc = pencilColor();
  ctx.strokeStyle = pc;
  ctx.lineWidth = 0.3;
  // Pole
  ctx.beginPath();
  ctx.moveTo(x, y);
  ctx.lineTo(x, y - 8);
  ctx.stroke();
  // Flag triangle outline
  sketchTriangle(ctx, x, y - 8, x + 5, y - 6, x, y - 4);
}

// ---- Construction scaffold overlay ------------------------------------

function drawScaffold(
  ctx: CanvasRenderingContext2D,
  cx: number, cy: number,
  w: number, h: number,
  progress: number,
): void {
  ctx.save();
  ctx.globalAlpha = 0.5 + 0.5 * progress;
  ctx.strokeStyle = '#C8A050';
  ctx.lineWidth = 0.5;
  const step = 4;
  for (let i = 0; i < w; i += step) {
    ctx.beginPath();
    ctx.moveTo(cx - w / 2 + i, cy - h);
    ctx.lineTo(cx - w / 2 + i, cy);
    ctx.stroke();
  }
  ctx.beginPath();
  ctx.moveTo(cx - w / 2, cy - h * progress);
  ctx.lineTo(cx + w / 2, cy - h * progress);
  ctx.stroke();
  ctx.restore();
}

// ---- Flag (waving on tall buildings) ----------------------------------

function drawFlag(
  ctx: CanvasRenderingContext2D,
  x: number, y: number,
  color: string, tick: number,
): void {
  ctx.strokeStyle = '#806030';
  ctx.lineWidth = 1;
  ctx.beginPath();
  ctx.moveTo(x, y);
  ctx.lineTo(x, y - 8);
  ctx.stroke();
  const wave = Math.sin(tick * 0.08) * 1.5;
  ctx.fillStyle = color;
  ctx.beginPath();
  ctx.moveTo(x, y - 8);
  ctx.lineTo(x + 5 + wave, y - 6);
  ctx.lineTo(x, y - 4);
  ctx.closePath();
  ctx.fill();
}

// ---- Smoke (pixel trail from chimneys) --------------------------------

function drawSmoke(
  ctx: CanvasRenderingContext2D,
  x: number, y: number, tick: number,
): void {
  for (let i = 0; i < 3; i++) {
    const age = ((tick + i * 20) % 60) / 60;
    const sx = x + Math.sin(age * Math.PI * 2 + i) * 1.5;
    const sy = y - age * 8;
    ctx.globalAlpha = (1 - age) * 0.5;
    ctx.fillStyle = '#B8B0A0';
    ctx.fillRect(sx, sy, 1, 1);
  }
  ctx.globalAlpha = 1;
}

// ---- Wall neighbor lookup (for connected walls) -----------------------

function getWallNeighbors(
  building: Building,
  wallPositions: Set<string>,
): { n: boolean; s: boolean; e: boolean; w: boolean } {
  const { col, row } = building.tile;
  return {
    n: wallPositions.has(`${col},${row - 1}`),
    s: wallPositions.has(`${col},${row + 1}`),
    e: wallPositions.has(`${col + 1},${row}`),
    w: wallPositions.has(`${col - 1},${row}`),
  };
}

// ====================================================================
// Individual building draw functions
// ====================================================================

// ---- HD style: gradient-shaded house -----------------------------------

function drawHdHouse(ctx: CanvasRenderingContext2D, cx: number, cy: number, p: Palette, tick: number): void {
  const bw = 10, bh = 8;
  drawShadow(ctx, cx, cy, bw + 2, 4);

  // Wall with vertical gradient (light top, dark bottom)
  const wallGrad = ctx.createLinearGradient(cx, cy - bh, cx, cy);
  wallGrad.addColorStop(0, p.wall);
  wallGrad.addColorStop(1, '#8A7A5A');
  ctx.fillStyle = wallGrad;
  ctx.fillRect(cx - bw / 2, cy - bh, bw, bh);

  // Ambient occlusion at base
  ctx.fillStyle = 'rgba(0,0,0,0.1)';
  ctx.fillRect(cx - bw / 2, cy - 2, bw, 2);

  // Right wall shadow (3D depth)
  const sideGrad = ctx.createLinearGradient(cx + bw / 2 - 3, cy, cx + bw / 2, cy);
  sideGrad.addColorStop(0, 'rgba(0,0,0,0)');
  sideGrad.addColorStop(1, 'rgba(0,0,0,0.15)');
  ctx.fillStyle = sideGrad;
  ctx.fillRect(cx + bw / 2 - 3, cy - bh, 3, bh);

  // Door with gradient
  const doorGrad = ctx.createLinearGradient(cx - 1, cy - 4, cx + 2, cy);
  doorGrad.addColorStop(0, '#6A4828');
  doorGrad.addColorStop(1, '#3A2010');
  ctx.fillStyle = doorGrad;
  ctx.fillRect(cx - 1, cy - 4, 3, 4);
  // Door handle dot
  ctx.fillStyle = '#C8A050';
  ctx.fillRect(cx + 0.5, cy - 2, 0.5, 0.5);

  // Window with glass reflection
  ctx.fillStyle = '#7AB8E0';
  ctx.fillRect(cx - bw / 2 + 2, cy - bh + 2, 3, 2);
  ctx.fillStyle = 'rgba(255,255,255,0.3)';
  ctx.fillRect(cx - bw / 2 + 2, cy - bh + 2, 1.5, 1);

  // Roof with gradient
  const roofGrad = ctx.createLinearGradient(cx, cy - bh - 5, cx, cy - bh);
  roofGrad.addColorStop(0, p.roof);
  roofGrad.addColorStop(1, '#A08040');
  ctx.fillStyle = roofGrad;
  ctx.beginPath();
  ctx.moveTo(cx, cy - bh - 5);
  ctx.lineTo(cx + bw / 2 + 2, cy - bh);
  ctx.lineTo(cx - bw / 2 - 2, cy - bh);
  ctx.closePath();
  ctx.fill();
  // Roof highlight edge
  ctx.fillStyle = 'rgba(255,255,200,0.1)';
  ctx.beginPath();
  ctx.moveTo(cx, cy - bh - 5);
  ctx.lineTo(cx - bw / 2 - 2, cy - bh);
  ctx.lineTo(cx, cy - bh);
  ctx.closePath();
  ctx.fill();

  // Chimney with gradient
  const chimGrad = ctx.createLinearGradient(cx + 2, cy - bh - 7, cx + 4, cy - bh - 7);
  chimGrad.addColorStop(0, '#C0A880');
  chimGrad.addColorStop(1, '#907050');
  ctx.fillStyle = chimGrad;
  ctx.fillRect(cx + 2, cy - bh - 7, 2.5, 4);
  drawSmoke(ctx, cx + 3, cy - bh - 7, tick);
}

// ---- HD style: gradient-shaded town center ------------------------------

function drawHdTownCenter(ctx: CanvasRenderingContext2D, cx: number, cy: number, p: Palette, tick: number): void {
  const bw = 22, bh = 14;
  drawShadow(ctx, cx, cy, bw + 3, 6);

  // Main wall with gradient
  const wallGrad = ctx.createLinearGradient(cx, cy - bh, cx, cy);
  wallGrad.addColorStop(0, p.wall);
  wallGrad.addColorStop(1, '#908060');
  ctx.fillStyle = wallGrad;
  ctx.fillRect(cx - bw / 2, cy - bh, bw, bh);

  // Ambient occlusion
  ctx.fillStyle = 'rgba(0,0,0,0.08)';
  ctx.fillRect(cx - bw / 2, cy - 2, bw, 2);

  // Right shadow
  const sideGrad = ctx.createLinearGradient(cx + bw / 2 - 4, cy, cx + bw / 2, cy);
  sideGrad.addColorStop(0, 'rgba(0,0,0,0)');
  sideGrad.addColorStop(1, 'rgba(0,0,0,0.12)');
  ctx.fillStyle = sideGrad;
  ctx.fillRect(cx + bw / 2 - 4, cy - bh, 4, bh);

  // Door arch with gradient
  const doorGrad = ctx.createLinearGradient(cx - 3, cy - 8, cx + 3, cy);
  doorGrad.addColorStop(0, '#4A3018');
  doorGrad.addColorStop(1, '#2A1808');
  ctx.fillStyle = doorGrad;
  ctx.fillRect(cx - 3, cy - 8, 6, 8);
  // Arch top
  ctx.beginPath();
  ctx.arc(cx, cy - 8, 3, Math.PI, 0);
  ctx.fill();

  // Windows with glass effect
  for (const wx of [cx - bw / 2 + 3, cx + bw / 2 - 7]) {
    ctx.fillStyle = '#6AA8D0';
    ctx.fillRect(wx, cy - bh + 3, 4, 3);
    ctx.fillStyle = 'rgba(255,255,255,0.25)';
    ctx.fillRect(wx, cy - bh + 3, 2, 1.5);
    // Window frame
    ctx.fillStyle = 'rgba(0,0,0,0.15)';
    ctx.fillRect(wx + 1.8, cy - bh + 3, 0.4, 3);
    ctx.fillRect(wx, cy - bh + 4.3, 4, 0.4);
  }

  // Crenellations with gradient
  ctx.fillStyle = p.accent;
  for (let i = 0; i < 5; i++) {
    const mx = cx - bw / 2 + i * 5;
    const grad = ctx.createLinearGradient(mx, cy - bh - 3, mx, cy - bh);
    grad.addColorStop(0, p.accent);
    grad.addColorStop(1, '#907030');
    ctx.fillStyle = grad;
    ctx.fillRect(mx, cy - bh - 3, 3, 3);
  }

  // Roof with gradient
  const roofGrad = ctx.createLinearGradient(cx, cy - bh - 8, cx, cy - bh);
  roofGrad.addColorStop(0, p.roof);
  roofGrad.addColorStop(1, '#908060');
  ctx.fillStyle = roofGrad;
  ctx.beginPath();
  ctx.moveTo(cx, cy - bh - 8);
  ctx.lineTo(cx + bw / 2 + 2, cy - bh);
  ctx.lineTo(cx - bw / 2 - 2, cy - bh);
  ctx.closePath();
  ctx.fill();
  // Roof highlight
  ctx.fillStyle = 'rgba(255,255,200,0.08)';
  ctx.beginPath();
  ctx.moveTo(cx, cy - bh - 8);
  ctx.lineTo(cx - bw / 2 - 2, cy - bh);
  ctx.lineTo(cx, cy - bh);
  ctx.closePath();
  ctx.fill();

  drawFlag(ctx, cx, cy - bh - 8, p.accent, tick);
}

function drawHouse(ctx: CanvasRenderingContext2D, cx: number, cy: number, p: Palette, tick: number): void {
  const bw = 10, bh = 8;
  const sid = getCurrentStyleId();

  if (sid === 'hd') {
    drawHdHouse(ctx, cx, cy, p, tick);
    return;
  }

  if (sid === 'comic') {
    // Pencil sketch house: outlines only
    const pc = pencilColor();
    ctx.strokeStyle = pc;
    ctx.lineWidth = 0.4;
    // Wall rectangle
    sketchRect(ctx, cx - bw / 2, cy - bh, bw, bh);
    // Triangle roof
    sketchTriangle(ctx, cx, cy - bh - 5, cx + bw / 2 + 1, cy - bh, cx - bw / 2 - 1, cy - bh);
    // Door
    ctx.lineWidth = 0.3;
    sketchRect(ctx, cx - 1, cy - 4, 3, 4);
    // Window cross
    ctx.beginPath();
    ctx.moveTo(cx - bw / 2 + 2, cy - bh + 2);
    ctx.lineTo(cx - bw / 2 + 5, cy - bh + 2);
    ctx.lineTo(cx - bw / 2 + 5, cy - bh + 4);
    ctx.lineTo(cx - bw / 2 + 2, cy - bh + 4);
    ctx.closePath();
    ctx.stroke();
    ctx.beginPath();
    ctx.moveTo(cx - bw / 2 + 3.5, cy - bh + 2);
    ctx.lineTo(cx - bw / 2 + 3.5, cy - bh + 4);
    ctx.moveTo(cx - bw / 2 + 2, cy - bh + 3);
    ctx.lineTo(cx - bw / 2 + 5, cy - bh + 3);
    ctx.stroke();
    // Cross-hatch on right side
    drawCrossHatch(ctx, cx + 1, cy - bh, bw / 2 - 1, bh);
    void tick;
  } else if (sid === 'neon') {
    drawShadow(ctx, cx, cy, bw, 3);
    // Neon: wireframe house
    styledRect(ctx, cx - bw / 2, cy - bh, bw, bh, p.wall, '#00dda8');
    styledRect(ctx, cx - 1, cy - 4, 3, 4, '#5A3820', '#ffaa00');
    // Roof wireframe
    ctx.strokeStyle = '#00dda8';
    ctx.lineWidth = 0.5;
    ctx.shadowBlur = 2;
    ctx.shadowColor = '#00dda8';
    ctx.beginPath();
    ctx.moveTo(cx, cy - bh - 5);
    ctx.lineTo(cx + bw / 2 + 1, cy - bh);
    ctx.lineTo(cx - bw / 2 - 1, cy - bh);
    ctx.closePath();
    ctx.stroke();
    ctx.shadowBlur = 0;
  } else {
    // Pixel: original
    drawShadow(ctx, cx, cy, bw, 3);
    ctx.fillStyle = p.wall;
    ctx.fillRect(cx - bw / 2, cy - bh, bw, bh);
    ctx.fillStyle = 'rgba(0,0,0,0.12)';
    ctx.fillRect(cx + bw / 2 - 2, cy - bh, 2, bh);
    ctx.fillStyle = '#5A3820';
    ctx.fillRect(cx - 1, cy - 4, 3, 4);
    ctx.fillStyle = '#A0C8E0';
    ctx.fillRect(cx - bw / 2 + 2, cy - bh + 2, 3, 2);
    ctx.fillStyle = p.roof;
    ctx.beginPath();
    ctx.moveTo(cx, cy - bh - 5);
    ctx.lineTo(cx + bw / 2 + 1, cy - bh);
    ctx.lineTo(cx - bw / 2 - 1, cy - bh);
    ctx.closePath();
    ctx.fill();
    ctx.fillStyle = p.wall;
    ctx.fillRect(cx + 2, cy - bh - 7, 2, 4);
    drawSmoke(ctx, cx + 3, cy - bh - 7, tick);
  }
}

function drawTownCenter(ctx: CanvasRenderingContext2D, cx: number, cy: number, p: Palette, tick: number): void {
  const bw = 22, bh = 14;
  const sid = getCurrentStyleId();

  if (sid === 'hd') {
    drawHdTownCenter(ctx, cx, cy, p, tick);
    return;
  }

  if (sid === 'comic') {
    // Pencil sketch town center
    const pc = pencilColor();
    ctx.strokeStyle = pc;
    ctx.lineWidth = 0.5;
    // Main building outline
    sketchRect(ctx, cx - bw / 2, cy - bh, bw, bh);
    // Peaked roof
    sketchTriangle(ctx, cx, cy - bh - 8, cx + bw / 2 + 2, cy - bh, cx - bw / 2 - 2, cy - bh);
    // Door
    ctx.lineWidth = 0.3;
    sketchRect(ctx, cx - 3, cy - 8, 6, 8);
    // Windows (cross marks)
    for (const wx of [cx - 7, cx + 5]) {
      ctx.beginPath();
      ctx.moveTo(wx, cy - bh + 3); ctx.lineTo(wx + 3, cy - bh + 6);
      ctx.moveTo(wx + 3, cy - bh + 3); ctx.lineTo(wx, cy - bh + 6);
      ctx.stroke();
    }
    // Flag
    drawComicFlag(ctx, cx, cy - bh - 8);
    // Cross-hatch on right wall
    drawCrossHatch(ctx, cx + 2, cy - bh, bw / 2 - 2, bh);
    void tick;
  } else if (sid === 'neon') {
    drawShadow(ctx, cx, cy, bw, 5);
    // Neon: wireframe with glow
    styledRect(ctx, cx - bw / 2, cy - bh, bw, bh, p.wall, '#00dda8');
    styledRect(ctx, cx - 3, cy - 8, 6, 8, '#3A2010', '#ffaa00');
    // Roof wireframe
    ctx.strokeStyle = '#00dda8'; ctx.lineWidth = 0.5;
    ctx.shadowBlur = 3; ctx.shadowColor = '#00dda8';
    ctx.beginPath();
    ctx.moveTo(cx, cy - bh - 8);
    ctx.lineTo(cx + bw / 2 + 2, cy - bh);
    ctx.lineTo(cx - bw / 2 - 2, cy - bh);
    ctx.closePath(); ctx.stroke();
    ctx.shadowBlur = 0;
    drawFlag(ctx, cx, cy - bh - 8, '#00ffc8', tick);
  } else {
    // Pixel: original
    drawShadow(ctx, cx, cy, bw, 5);
    ctx.fillStyle = p.wall;
    ctx.fillRect(cx - bw / 2, cy - bh, bw, bh);
    ctx.fillStyle = 'rgba(0,0,0,0.1)';
    ctx.fillRect(cx + bw / 2 - 3, cy - bh, 3, bh);
    ctx.fillStyle = '#3A2010';
    ctx.fillRect(cx - 3, cy - 8, 6, 8);
    ctx.fillStyle = '#A0C8E0';
    ctx.fillRect(cx - bw / 2 + 3, cy - bh + 3, 4, 3);
    ctx.fillRect(cx + bw / 2 - 7, cy - bh + 3, 4, 3);
    ctx.fillStyle = p.accent;
    for (let i = 0; i < 5; i++) ctx.fillRect(cx - bw / 2 + i * 5, cy - bh - 3, 3, 3);
    ctx.fillStyle = p.roof;
    ctx.beginPath();
    ctx.moveTo(cx, cy - bh - 8);
    ctx.lineTo(cx + bw / 2 + 2, cy - bh);
    ctx.lineTo(cx - bw / 2 - 2, cy - bh);
    ctx.closePath(); ctx.fill();
    drawFlag(ctx, cx, cy - bh - 8, p.accent, tick);
  }
}

function drawFarm(ctx: CanvasRenderingContext2D, cx: number, cy: number): void {
  const fw = 22, fh = 8;
  const sid = getCurrentStyleId();

  if (sid === 'comic') {
    // Pencil sketch farm: rectangle with parallel crop lines
    const pc = pencilColor();
    ctx.strokeStyle = pc;
    ctx.lineWidth = 0.4;
    sketchRect(ctx, cx - fw / 2, cy - fh, fw, fh);
    // Crop rows as horizontal pencil lines
    ctx.lineWidth = 0.4;
    for (let r = 1; r < 4; r++) {
      const y = cy - fh + r * 2;
      ctx.beginPath();
      ctx.moveTo(wobble(cx - fw / 2 + 1), wobble(y));
      ctx.lineTo(wobble(cx + fw / 2 - 1), wobble(y));
      ctx.stroke();
    }
  } else {
    drawShadow(ctx, cx, cy, fw, 4);
    ctx.fillStyle = '#B08050';
    ctx.fillRect(cx - fw / 2, cy - fh, fw, fh);
    const rowH = fh / 4;
    for (let r = 0; r < 4; r++) {
      ctx.fillStyle = r % 2 === 0 ? '#60A828' : '#48801A';
      ctx.fillRect(cx - fw / 2, cy - fh + r * rowH, fw, rowH - 1);
    }
  }
}

function drawLumberCamp(ctx: CanvasRenderingContext2D, cx: number, cy: number, p: Palette): void {
  drawShadow(ctx, cx, cy, 9, 3);
  ctx.fillStyle = '#8B5E3C';
  for (let i = 0; i < 3; i++) ctx.fillRect(cx - 5 + i, cy - 3 - i, 8, 2);
  ctx.fillStyle = p.roof;
  ctx.beginPath();
  ctx.moveTo(cx - 6, cy - 5); ctx.lineTo(cx + 6, cy - 5);
  ctx.lineTo(cx + 4, cy); ctx.lineTo(cx - 4, cy);
  ctx.closePath();
  ctx.fill();
}

function drawMiningCamp(ctx: CanvasRenderingContext2D, cx: number, cy: number, p: Palette): void {
  drawShadow(ctx, cx, cy, 9, 3);
  ctx.fillStyle = COLORS.terrain.stone[0];
  ctx.beginPath(); ctx.ellipse(cx - 3, cy - 2, 4, 2, -0.2, 0, Math.PI * 2); ctx.fill();
  ctx.beginPath(); ctx.ellipse(cx + 3, cy - 3, 3, 2, 0.1, 0, Math.PI * 2); ctx.fill();
  ctx.fillStyle = p.wall;
  ctx.fillRect(cx - 4, cy - 7, 8, 5);
  ctx.fillStyle = p.roof;
  ctx.beginPath();
  ctx.moveTo(cx, cy - 9); ctx.lineTo(cx + 5, cy - 7); ctx.lineTo(cx - 5, cy - 7);
  ctx.closePath(); ctx.fill();
}

function drawBarracks(ctx: CanvasRenderingContext2D, cx: number, cy: number, p: Palette): void {
  const bw = 18, bh = 11;
  const sid = getCurrentStyleId();

  if (sid === 'comic') {
    // Pencil sketch barracks
    const pc = pencilColor();
    ctx.strokeStyle = pc;
    ctx.lineWidth = 0.4;
    sketchRect(ctx, cx - bw / 2, cy - bh, bw, bh);
    // Flat roof line
    ctx.beginPath();
    ctx.moveTo(wobble(cx - bw / 2 - 1), wobble(cy - bh - 2));
    ctx.lineTo(wobble(cx + bw / 2 + 1), wobble(cy - bh - 2));
    ctx.stroke();
    // Door
    ctx.lineWidth = 0.3;
    sketchRect(ctx, cx - 2, cy - 6, 4, 6);
    // Weapon rack: vertical lines on right
    for (let i = 0; i < 4; i++) {
      const wx = cx + bw / 2 + 2 + i * 2;
      ctx.beginPath();
      ctx.moveTo(wobble(wx), cy - 8);
      ctx.lineTo(wobble(wx), cy - 1);
      ctx.stroke();
    }
    drawCrossHatch(ctx, cx - bw / 2, cy - bh, bw / 3, bh);
  } else {
    drawShadow(ctx, cx, cy, bw, 4);
    ctx.fillStyle = p.wall;
    ctx.fillRect(cx - bw / 2, cy - bh, bw, bh);
    ctx.fillStyle = '#3A2010';
    ctx.fillRect(cx - 2, cy - 6, 4, 6);
    ctx.strokeStyle = '#808080'; ctx.lineWidth = 0.7;
    for (let i = 0; i < 4; i++) {
      const wx = cx + bw / 2 + 2 + i * 2;
      ctx.beginPath(); ctx.moveTo(wx, cy - 8); ctx.lineTo(wx, cy - 1); ctx.stroke();
      ctx.fillStyle = '#C0C0C0'; ctx.fillRect(wx - 0.5, cy - 9, 1.5, 1.5);
    }
    ctx.fillStyle = p.roof;
    ctx.fillRect(cx - bw / 2 - 1, cy - bh - 2, bw + 2, 3);
    ctx.fillStyle = p.accent;
    ctx.fillRect(cx - bw / 2, cy - bh - 1, bw, 1);
  }
}

function drawWatchTower(ctx: CanvasRenderingContext2D, cx: number, cy: number, p: Palette, tick: number): void {
  const sid = getCurrentStyleId();

  if (sid === 'comic') {
    // Pencil sketch watch tower: tall thin rectangle + flag
    const pc = pencilColor();
    ctx.strokeStyle = pc;
    ctx.lineWidth = 0.4;
    sketchRect(ctx, cx - 3, cy - 14, 6, 14);
    drawComicFlag(ctx, cx, cy - 14);
    drawCrossHatch(ctx, cx, cy - 14, 3, 14);
  } else {
    drawShadow(ctx, cx, cy, 6, 2);
    ctx.fillStyle = p.wall;
    ctx.fillRect(cx - 3, cy - 14, 6, 14);
    ctx.fillStyle = '#2A1A08';
    ctx.fillRect(cx - 0.5, cy - 12, 1, 3);
    ctx.fillRect(cx - 0.5, cy - 7, 1, 3);
    ctx.fillStyle = p.accent;
    for (let i = 0; i < 3; i++) ctx.fillRect(cx - 3 + i * 3, cy - 16, 2, 2);
    drawFlag(ctx, cx, cy - 16, p.accent, tick);
  }
}

// ---- STONE WALL (connected along iso diagonals) ----------------------
// In iso projection:
//   col+1 neighbor is at screen offset (+16, +8)  "east"
//   col-1 neighbor is at screen offset (-16, -8)  "west"
//   row+1 neighbor is at screen offset (-16, +8)  "south"
//   row-1 neighbor is at screen offset (+16, -8)  "north"

function drawWallConnector(
  ctx: CanvasRenderingContext2D, cx: number, cy: number,
  dx: number, dy: number, wallH: number, color: string,
): void {
  // Draw a thick line from center toward the neighbor halfway (8px, 4px)
  const hx = dx * 0.5;
  const hy = dy * 0.5;
  ctx.fillStyle = color;
  // Draw as a parallelogram-ish shape
  ctx.beginPath();
  ctx.moveTo(cx - 3, cy - wallH);
  ctx.lineTo(cx + 3, cy - wallH);
  ctx.lineTo(cx + hx + 3, cy - wallH + hy);
  ctx.lineTo(cx + hx - 3, cy - wallH + hy);
  ctx.closePath();
  ctx.fill();
  // Fill the bottom part too
  ctx.beginPath();
  ctx.moveTo(cx - 3, cy);
  ctx.lineTo(cx + 3, cy);
  ctx.lineTo(cx + hx + 3, cy + hy);
  ctx.lineTo(cx + hx - 3, cy + hy);
  ctx.closePath();
  ctx.fill();
  // Connect top and bottom
  ctx.fillRect(
    Math.min(cx, cx + hx) - 3,
    Math.min(cy - wallH, cy - wallH + hy),
    Math.abs(hx) + 6,
    wallH + Math.abs(hy),
  );
}

function drawStoneWall(
  ctx: CanvasRenderingContext2D, cx: number, cy: number, p: Palette,
  neighbors: { n: boolean; s: boolean; e: boolean; w: boolean },
): void {
  const wallH = 6;

  // Draw iso connectors toward neighbors FIRST (behind main block)
  // Iso offsets: e=(+16,+8), w=(-16,-8), s=(-16,+8), n=(+16,-8)
  if (neighbors.e) drawWallConnector(ctx, cx, cy, 16, 8, wallH, p.wall);
  if (neighbors.w) drawWallConnector(ctx, cx, cy, -16, -8, wallH, p.wall);
  if (neighbors.s) drawWallConnector(ctx, cx, cy, -16, 8, wallH, p.wall);
  if (neighbors.n) drawWallConnector(ctx, cx, cy, 16, -8, wallH, p.wall);

  // Main wall block (on top)
  ctx.fillStyle = p.wall;
  ctx.fillRect(cx - 5, cy - wallH, 10, wallH);

  // Stone texture: mortar lines
  ctx.fillStyle = 'rgba(0,0,0,0.12)';
  ctx.fillRect(cx - 5, cy - 4, 10, 1);
  ctx.fillRect(cx - 5, cy - 2, 10, 1);
  // Vertical mortar
  ctx.fillRect(cx, cy - wallH, 1, wallH);

  // Top highlight
  ctx.fillStyle = 'rgba(255,255,255,0.1)';
  ctx.fillRect(cx - 5, cy - wallH, 10, 1);

  // Crenellations (battlements)
  ctx.fillStyle = p.wall;
  ctx.fillRect(cx - 6, cy - wallH - 2, 3, 2);
  ctx.fillRect(cx - 1, cy - wallH - 2, 3, 2);
  ctx.fillRect(cx + 4, cy - wallH - 2, 3, 2);
  // Crenellation shadow
  ctx.fillStyle = 'rgba(0,0,0,0.15)';
  ctx.fillRect(cx - 3, cy - wallH - 1, 2, 1);
  ctx.fillRect(cx + 2, cy - wallH - 1, 2, 1);
}

// ---- GATE (archway in wall) -------------------------------------------

function drawGate(ctx: CanvasRenderingContext2D, cx: number, cy: number, p: Palette): void {
  const wallH = 7;
  ctx.fillStyle = p.wall;
  ctx.fillRect(cx - 6, cy - wallH, 4, wallH);
  ctx.fillRect(cx + 2, cy - wallH, 4, wallH);
  ctx.fillRect(cx - 6, cy - wallH - 1, 12, 2);
  ctx.fillStyle = '#1A0A00';
  ctx.fillRect(cx - 2, cy - 5, 4, 5);
  ctx.fillRect(cx - 1, cy - 6, 2, 1);
  ctx.strokeStyle = '#606060'; ctx.lineWidth = 0.5;
  ctx.beginPath();
  ctx.moveTo(cx - 1, cy - 5); ctx.lineTo(cx - 1, cy);
  ctx.moveTo(cx + 1, cy - 5); ctx.lineTo(cx + 1, cy);
  ctx.stroke();
}

// ---- MILL (windmill blades) -------------------------------------------

function drawMill(ctx: CanvasRenderingContext2D, cx: number, cy: number, p: Palette, tick: number): void {
  drawShadow(ctx, cx, cy, 8, 3);
  ctx.fillStyle = p.wall;
  ctx.fillRect(cx - 4, cy - 9, 8, 9);
  ctx.fillStyle = p.roof;
  ctx.beginPath();
  ctx.moveTo(cx, cy - 14); ctx.lineTo(cx + 5, cy - 9); ctx.lineTo(cx - 5, cy - 9);
  ctx.closePath(); ctx.fill();
  // Rotating blades
  const angle = tick * 0.04;
  ctx.strokeStyle = '#8B6B3C'; ctx.lineWidth = 1;
  for (let i = 0; i < 4; i++) {
    const a = angle + (i * Math.PI) / 2;
    ctx.beginPath();
    ctx.moveTo(cx, cy - 11);
    ctx.lineTo(cx + Math.cos(a) * 7, cy - 11 + Math.sin(a) * 4);
    ctx.stroke();
  }
  ctx.fillStyle = '#5A3820';
  ctx.beginPath(); ctx.arc(cx, cy - 11, 1, 0, Math.PI * 2); ctx.fill();
}

// ---- GRANARY (grain sacks) -------------------------------------------

function drawGranary(ctx: CanvasRenderingContext2D, cx: number, cy: number, p: Palette): void {
  drawShadow(ctx, cx, cy, 10, 3);
  ctx.fillStyle = p.wall;
  ctx.fillRect(cx - 6, cy - 8, 12, 8);
  ctx.fillStyle = '#5A3820';
  ctx.fillRect(cx - 3, cy - 6, 6, 6);
  // Grain sacks
  ctx.fillStyle = '#D8C080';
  ctx.beginPath(); ctx.arc(cx - 1, cy - 2, 2, 0, Math.PI * 2); ctx.fill();
  ctx.beginPath(); ctx.arc(cx + 1, cy - 2, 2, 0, Math.PI * 2); ctx.fill();
  ctx.beginPath(); ctx.arc(cx, cy - 4, 2, 0, Math.PI * 2); ctx.fill();
  ctx.fillStyle = p.roof;
  ctx.beginPath();
  ctx.moveTo(cx, cy - 12); ctx.lineTo(cx + 7, cy - 8); ctx.lineTo(cx - 7, cy - 8);
  ctx.closePath(); ctx.fill();
}

// ---- LUMBER YARD (stacked logs) --------------------------------------

function drawLumberYard(ctx: CanvasRenderingContext2D, cx: number, cy: number, p: Palette): void {
  drawShadow(ctx, cx, cy, 10, 3);
  for (let row = 0; row < 3; row++) {
    for (let i = 0; i < 4 - row; i++) {
      const lx = cx - 7 + i * 4 + row * 2;
      const ly = cy - 2 - row * 3;
      ctx.fillStyle = '#8B5E3C';
      ctx.beginPath(); ctx.arc(lx, ly, 2, 0, Math.PI * 2); ctx.fill();
      ctx.fillStyle = '#C8A070';
      ctx.beginPath(); ctx.arc(lx, ly, 1, 0, Math.PI * 2); ctx.fill();
    }
  }
  ctx.fillStyle = '#6B4226';
  ctx.fillRect(cx - 9, cy - 10, 2, 10);
  ctx.fillRect(cx + 7, cy - 10, 2, 10);
  ctx.fillStyle = p.roof;
  ctx.fillRect(cx - 10, cy - 11, 20, 2);
}

// ---- STONE VAULT (iron door with rivets) -----------------------------

function drawStoneVault(ctx: CanvasRenderingContext2D, cx: number, cy: number, _p: Palette): void {
  drawShadow(ctx, cx, cy, 10, 3);
  ctx.fillStyle = COLORS.terrain.stone[0];
  ctx.fillRect(cx - 7, cy - 10, 14, 10);
  ctx.fillStyle = 'rgba(0,0,0,0.1)';
  for (let i = 1; i < 4; i++) ctx.fillRect(cx - 7, cy - 10 + i * 3, 14, 1);
  ctx.fillStyle = '#505050';
  ctx.fillRect(cx - 3, cy - 6, 6, 6);
  ctx.fillStyle = '#808080';
  ctx.fillRect(cx - 2, cy - 5, 1, 1); ctx.fillRect(cx + 1, cy - 5, 1, 1);
  ctx.fillRect(cx - 2, cy - 2, 1, 1); ctx.fillRect(cx + 1, cy - 2, 1, 1);
  ctx.fillStyle = COLORS.terrain.stone[1];
  ctx.fillRect(cx - 8, cy - 11, 16, 2);
}

// ---- TREASURY (gold accents) -----------------------------------------

function drawTreasury(ctx: CanvasRenderingContext2D, cx: number, cy: number, p: Palette): void {
  drawShadow(ctx, cx, cy, 10, 3);
  ctx.fillStyle = p.wall;
  ctx.fillRect(cx - 7, cy - 9, 14, 9);
  ctx.fillStyle = COLORS.resources.gold;
  ctx.fillRect(cx - 7, cy - 9, 14, 1);
  ctx.fillRect(cx - 7, cy - 1, 14, 1);
  ctx.fillStyle = '#3A2010';
  ctx.fillRect(cx - 2, cy - 5, 4, 5);
  ctx.fillStyle = COLORS.resources.gold;
  ctx.beginPath(); ctx.arc(cx, cy - 7, 2, 0, Math.PI * 2); ctx.fill();
  ctx.fillStyle = p.roof;
  ctx.beginPath();
  ctx.moveTo(cx, cy - 13); ctx.lineTo(cx + 8, cy - 9); ctx.lineTo(cx - 8, cy - 9);
  ctx.closePath(); ctx.fill();
  ctx.fillStyle = COLORS.resources.gold;
  ctx.fillRect(cx - 1, cy - 14, 2, 2);
}

// ---- OUTPOST (elevated platform) -------------------------------------

function drawOutpost(ctx: CanvasRenderingContext2D, cx: number, cy: number, p: Palette, tick: number): void {
  drawShadow(ctx, cx, cy, 8, 3);
  ctx.fillStyle = '#6B4226';
  ctx.fillRect(cx - 6, cy - 16, 2, 16);
  ctx.fillRect(cx + 4, cy - 16, 2, 16);
  ctx.fillStyle = p.wall;
  ctx.fillRect(cx - 7, cy - 17, 14, 3);
  ctx.fillStyle = '#6B4226';
  ctx.fillRect(cx - 7, cy - 20, 1, 3);
  ctx.fillRect(cx + 6, cy - 20, 1, 3);
  ctx.fillRect(cx - 7, cy - 20, 14, 1);
  drawFlag(ctx, cx, cy - 20, p.accent, tick);
}

// ---- BOMBARD TOWER (cannon barrel) -----------------------------------

function drawBombardTower(ctx: CanvasRenderingContext2D, cx: number, cy: number, _p: Palette): void {
  drawShadow(ctx, cx, cy, 7, 3);
  ctx.fillStyle = COLORS.terrain.stone[1];
  ctx.fillRect(cx - 5, cy - 18, 10, 18);
  ctx.fillStyle = 'rgba(0,0,0,0.1)';
  for (let i = 1; i < 6; i++) ctx.fillRect(cx - 5, cy - 18 + i * 3, 10, 1);
  ctx.fillStyle = '#404040';
  ctx.fillRect(cx - 1, cy - 10, 8, 2);
  ctx.fillStyle = COLORS.terrain.stone[0];
  for (let i = 0; i < 4; i++) ctx.fillRect(cx - 5 + i * 3, cy - 20, 2, 2);
}

// ---- ARCHERY RANGE (targets) -----------------------------------------

function drawArcheryRange(ctx: CanvasRenderingContext2D, cx: number, cy: number, p: Palette): void {
  drawShadow(ctx, cx, cy, 14, 4);
  ctx.fillStyle = '#6B4226';
  ctx.fillRect(cx - 11, cy - 4, 2, 4);
  ctx.fillRect(cx - 11, cy - 4, 10, 1);
  for (let i = 0; i < 3; i++) {
    const tx = cx + 2 + i * 5;
    const ty = cy - 6 - i;
    ctx.fillStyle = '#6B4226';
    ctx.fillRect(tx, ty, 1, 6 + i);
    ctx.fillStyle = '#E0D8B0';
    ctx.beginPath(); ctx.arc(tx, ty - 1, 3, 0, Math.PI * 2); ctx.fill();
    ctx.fillStyle = '#D04040';
    ctx.beginPath(); ctx.arc(tx, ty - 1, 2, 0, Math.PI * 2); ctx.fill();
    ctx.fillStyle = '#FFD040';
    ctx.beginPath(); ctx.arc(tx, ty - 1, 1, 0, Math.PI * 2); ctx.fill();
  }
  ctx.fillStyle = p.roof;
  ctx.fillRect(cx - 12, cy - 8, 10, 2);
}

// ---- STABLE (barn with horse silhouette) ------------------------------

function drawStable(ctx: CanvasRenderingContext2D, cx: number, cy: number, p: Palette): void {
  const bw = 22, bh = 12;
  drawShadow(ctx, cx, cy, bw, 5);
  ctx.fillStyle = p.wall;
  ctx.fillRect(cx - bw / 2, cy - bh, bw, bh);
  ctx.fillStyle = '#5A3820';
  ctx.fillRect(cx - 4, cy - 8, 8, 8);
  // X brace on door
  ctx.strokeStyle = '#7A5830'; ctx.lineWidth = 0.7;
  ctx.beginPath();
  ctx.moveTo(cx - 3, cy - 7); ctx.lineTo(cx + 3, cy - 1);
  ctx.moveTo(cx + 3, cy - 7); ctx.lineTo(cx - 3, cy - 1);
  ctx.stroke();
  ctx.fillStyle = '#D8C060';
  ctx.fillRect(cx - 3, cy - 2, 6, 2);
  // Gambrel roof
  ctx.fillStyle = p.roof;
  ctx.beginPath();
  ctx.moveTo(cx, cy - bh - 6);
  ctx.lineTo(cx + 6, cy - bh - 2);
  ctx.lineTo(cx + bw / 2 + 1, cy - bh);
  ctx.lineTo(cx - bw / 2 - 1, cy - bh);
  ctx.lineTo(cx - 6, cy - bh - 2);
  ctx.closePath(); ctx.fill();
  // Horse head
  ctx.fillStyle = '#6B4E2A';
  ctx.fillRect(cx + bw / 2 - 5, cy - 6, 3, 4);
  ctx.fillRect(cx + bw / 2 - 4, cy - 8, 2, 2);
}

// ---- SIEGE WORKSHOP (catapult frame) ----------------------------------

function drawSiegeWorkshop(ctx: CanvasRenderingContext2D, cx: number, cy: number, p: Palette): void {
  drawShadow(ctx, cx, cy, 14, 5);
  ctx.fillStyle = '#6B4226';
  ctx.fillRect(cx - 11, cy - 12, 2, 12);
  ctx.fillRect(cx + 9, cy - 12, 2, 12);
  ctx.fillStyle = p.roof;
  ctx.fillRect(cx - 12, cy - 13, 24, 2);
  ctx.fillStyle = '#7A6040';
  ctx.fillRect(cx - 4, cy - 4, 8, 4);
  ctx.strokeStyle = '#6B4226'; ctx.lineWidth = 1.5;
  ctx.beginPath(); ctx.moveTo(cx, cy - 4); ctx.lineTo(cx - 3, cy - 10); ctx.stroke();
  ctx.fillStyle = '#503820';
  ctx.beginPath(); ctx.arc(cx - 4, cy, 2, 0, Math.PI * 2); ctx.fill();
  ctx.beginPath(); ctx.arc(cx + 4, cy, 2, 0, Math.PI * 2); ctx.fill();
}

// ---- MARKET (striped awning + goods) ----------------------------------

function drawMarket(ctx: CanvasRenderingContext2D, cx: number, cy: number, p: Palette): void {
  drawShadow(ctx, cx, cy, 14, 5);
  ctx.fillStyle = p.wall;
  ctx.fillRect(cx - 11, cy - 4, 22, 4);
  const goods = [COLORS.resources.food, COLORS.resources.wood, COLORS.resources.gold, COLORS.resources.stone];
  for (let i = 0; i < 4; i++) {
    ctx.fillStyle = goods[i];
    ctx.fillRect(cx - 8 + i * 5, cy - 6, 3, 2);
  }
  for (let i = 0; i < 6; i++) {
    ctx.fillStyle = i % 2 === 0 ? p.accent : '#F0E8D0';
    ctx.fillRect(cx - 12 + i * 4, cy - 10, 4, 2);
  }
  ctx.fillStyle = '#6B4226';
  ctx.fillRect(cx - 11, cy - 10, 1, 10);
  ctx.fillRect(cx + 10, cy - 10, 1, 10);
}

// ---- BLACKSMITH (forge glow + anvil sparks) ---------------------------

function drawBlacksmith(ctx: CanvasRenderingContext2D, cx: number, cy: number, p: Palette, tick: number): void {
  const bw = 14, bh = 10;
  drawShadow(ctx, cx, cy, bw, 4);
  ctx.fillStyle = p.wall;
  ctx.fillRect(cx - bw / 2, cy - bh, bw, bh);
  ctx.fillStyle = COLORS.terrain.stone[2];
  ctx.fillRect(cx + 3, cy - bh - 6, 4, 8);
  drawSmoke(ctx, cx + 5, cy - bh - 6, tick);
  ctx.fillStyle = '#FF6020';
  ctx.fillRect(cx + 3, cy - 4, 4, 2);
  ctx.fillStyle = '#404040';
  ctx.fillRect(cx - 6, cy - 3, 4, 1);
  ctx.fillRect(cx - 5, cy - 4, 2, 1);
  if (tick % 6 < 3) {
    ctx.fillStyle = '#FFD040'; ctx.fillRect(cx - 7 + (tick % 3), cy - 5, 1, 1);
    ctx.fillStyle = '#FF8020'; ctx.fillRect(cx - 4 - (tick % 2), cy - 6, 1, 1);
  }
  ctx.fillStyle = p.roof;
  ctx.beginPath();
  ctx.moveTo(cx - 2, cy - bh - 4);
  ctx.lineTo(cx + bw / 2 + 1, cy - bh);
  ctx.lineTo(cx - bw / 2 - 1, cy - bh);
  ctx.closePath(); ctx.fill();
}

// ---- UNIVERSITY (tall spire + windows) --------------------------------

function drawUniversity(ctx: CanvasRenderingContext2D, cx: number, cy: number, p: Palette): void {
  const bw = 20, bh = 13;
  drawShadow(ctx, cx, cy, bw, 5);
  ctx.fillStyle = p.wall;
  ctx.fillRect(cx - bw / 2, cy - bh, bw, bh);
  ctx.fillStyle = '#A0C8E0';
  for (let i = 0; i < 4; i++) ctx.fillRect(cx - 7 + i * 5, cy - bh + 3, 3, 3);
  ctx.fillStyle = '#3A2010';
  ctx.fillRect(cx - 2, cy - 5, 4, 5);
  ctx.fillStyle = p.roof;
  ctx.beginPath();
  ctx.moveTo(cx, cy - bh - 10);
  ctx.lineTo(cx + bw / 2 + 1, cy - bh);
  ctx.lineTo(cx - bw / 2 - 1, cy - bh);
  ctx.closePath(); ctx.fill();
  // Book symbol
  ctx.fillStyle = '#8B2020';
  ctx.fillRect(cx - 2, cy - 8, 4, 2);
  ctx.fillStyle = '#F0E8D0';
  ctx.fillRect(cx - 1, cy - 8, 2, 2);
}

// ---- TEMPLE (columns + pediment) --------------------------------------

function drawTemple(ctx: CanvasRenderingContext2D, cx: number, cy: number, p: Palette): void {
  drawShadow(ctx, cx, cy, 14, 5);
  ctx.fillStyle = COLORS.terrain.stone[0];
  ctx.fillRect(cx - 12, cy - 2, 24, 2);
  ctx.fillStyle = p.wall;
  for (let i = 0; i < 4; i++) ctx.fillRect(cx - 8 + i * 6, cy - 12, 2, 10);
  ctx.fillStyle = '#2A1A08';
  ctx.fillRect(cx - 5, cy - 10, 10, 8);
  ctx.fillStyle = p.roof;
  ctx.beginPath();
  ctx.moveTo(cx, cy - 18); ctx.lineTo(cx + 12, cy - 12); ctx.lineTo(cx - 12, cy - 12);
  ctx.closePath(); ctx.fill();
  ctx.fillStyle = COLORS.resources.gold;
  ctx.fillRect(cx - 0.5, cy - 20, 1, 3);
  ctx.fillRect(cx - 1.5, cy - 19, 3, 1);
}

// ---- MONASTERY (cloister arches + bell tower) -------------------------

function drawMonastery(ctx: CanvasRenderingContext2D, cx: number, cy: number, p: Palette, tick: number): void {
  const bw = 22, bh = 11;
  drawShadow(ctx, cx, cy, bw, 5);
  ctx.fillStyle = p.wall;
  ctx.fillRect(cx - bw / 2, cy - bh, bw, bh);
  ctx.fillStyle = '#2A1A08';
  for (let i = 0; i < 3; i++) {
    ctx.fillRect(cx - 8 + i * 6, cy - 5, 4, 5);
  }
  ctx.fillStyle = p.wall;
  ctx.fillRect(cx + 6, cy - bh - 6, 5, 6);
  ctx.fillStyle = COLORS.resources.gold;
  ctx.beginPath(); ctx.arc(cx + 8, cy - bh - 2, 1.5, 0, Math.PI * 2); ctx.fill();
  ctx.fillStyle = p.roof;
  ctx.beginPath();
  ctx.moveTo(cx + 8, cy - bh - 10);
  ctx.lineTo(cx + 12, cy - bh - 6);
  ctx.lineTo(cx + 5, cy - bh - 6);
  ctx.closePath(); ctx.fill();
  ctx.fillRect(cx - bw / 2 - 1, cy - bh - 1, bw - 4, 2);
  void tick;
}

// ---- BANK (columns + gold coin emblem) --------------------------------

function drawBank(ctx: CanvasRenderingContext2D, cx: number, cy: number, p: Palette): void {
  const bw = 22, bh = 12;
  drawShadow(ctx, cx, cy, bw, 5);
  ctx.fillStyle = p.wall;
  ctx.fillRect(cx - bw / 2, cy - bh, bw, bh);
  ctx.fillStyle = '#E0D8C0';
  ctx.fillRect(cx - 6, cy - bh + 1, 2, bh - 1);
  ctx.fillRect(cx + 4, cy - bh + 1, 2, bh - 1);
  ctx.fillStyle = '#3A2010';
  ctx.fillRect(cx - 2, cy - 6, 4, 6);
  ctx.fillStyle = COLORS.resources.gold;
  ctx.beginPath(); ctx.arc(cx, cy - 9, 2.5, 0, Math.PI * 2); ctx.fill();
  ctx.fillStyle = p.roof;
  ctx.beginPath();
  ctx.moveTo(cx, cy - bh - 5);
  ctx.lineTo(cx + bw / 2 + 1, cy - bh);
  ctx.lineTo(cx - bw / 2 - 1, cy - bh);
  ctx.closePath(); ctx.fill();
}

// ---- CANNON FOUNDRY (smoke stacks) ------------------------------------

function drawCannonFoundry(ctx: CanvasRenderingContext2D, cx: number, cy: number, p: Palette, tick: number): void {
  const bw = 22, bh = 11;
  drawShadow(ctx, cx, cy, bw, 5);
  ctx.fillStyle = p.wall;
  ctx.fillRect(cx - bw / 2, cy - bh, bw, bh);
  ctx.fillStyle = COLORS.terrain.stone[2];
  ctx.fillRect(cx - 6, cy - bh - 8, 3, 8);
  ctx.fillRect(cx + 3, cy - bh - 8, 3, 8);
  drawSmoke(ctx, cx - 5, cy - bh - 8, tick);
  drawSmoke(ctx, cx + 4, cy - bh - 8, tick + 30);
  ctx.fillStyle = '#FF6020';
  ctx.fillRect(cx - 3, cy - 3, 6, 2);
  ctx.fillStyle = '#404040';
  ctx.fillRect(cx + bw / 2 - 3, cy - 4, 6, 2);
  ctx.fillStyle = p.roof;
  ctx.fillRect(cx - bw / 2 - 1, cy - bh - 1, bw + 2, 2);
}

// ---- CASTLE (towers + crenellations) ----------------------------------

function drawCastle(ctx: CanvasRenderingContext2D, cx: number, cy: number, p: Palette, tick: number): void {
  const bw = 28, bh = 18;
  drawShadow(ctx, cx, cy, bw, 6);
  ctx.fillStyle = COLORS.terrain.stone[0];
  ctx.fillRect(cx - bw / 2 + 4, cy - bh, bw - 8, bh);
  const towerW = 6, towerH = bh + 4;
  ctx.fillStyle = COLORS.terrain.stone[1];
  ctx.fillRect(cx - bw / 2, cy - towerH, towerW, towerH);
  ctx.fillRect(cx + bw / 2 - towerW, cy - towerH, towerW, towerH);
  ctx.fillStyle = COLORS.terrain.stone[0];
  for (let i = 0; i < 3; i++) {
    ctx.fillRect(cx - bw / 2 + i * 2, cy - towerH - 2, 1, 2);
    ctx.fillRect(cx + bw / 2 - towerW + i * 2, cy - towerH - 2, 1, 2);
  }
  for (let i = 0; i < 5; i++) ctx.fillRect(cx - 7 + i * 4, cy - bh - 2, 2, 2);
  ctx.fillStyle = '#1A0A00';
  ctx.fillRect(cx - 3, cy - 8, 6, 8);
  ctx.fillRect(cx - 2, cy - 9, 4, 1);
  ctx.fillStyle = '#2A1A08';
  ctx.fillRect(cx - 7, cy - 14, 1, 3);
  ctx.fillRect(cx + 6, cy - 14, 1, 3);
  drawFlag(ctx, cx - bw / 2 + 3, cy - towerH - 2, p.accent, tick);
}

// ---- IMPERIAL PALACE (dome) -------------------------------------------

function drawImperialPalace(ctx: CanvasRenderingContext2D, cx: number, cy: number, p: Palette, tick: number): void {
  const bw = 30, bh = 16;
  drawShadow(ctx, cx, cy, bw, 7);
  ctx.fillStyle = COLORS.terrain.stone[0];
  ctx.fillRect(cx - bw / 2 - 2, cy - 2, bw + 4, 2);
  ctx.fillStyle = p.wall;
  ctx.fillRect(cx - bw / 2, cy - bh, bw, bh);
  ctx.fillStyle = '#E8E0D0';
  for (let i = 0; i < 6; i++) ctx.fillRect(cx - 12 + i * 5, cy - bh + 2, 2, bh - 2);
  ctx.fillStyle = p.roof;
  ctx.beginPath(); ctx.arc(cx, cy - bh, 10, Math.PI, 0); ctx.fill();
  ctx.fillStyle = COLORS.resources.gold;
  ctx.beginPath(); ctx.arc(cx, cy - bh - 10, 1.5, 0, Math.PI * 2); ctx.fill();
  ctx.fillRect(cx - 0.5, cy - bh - 8, 1, 2);
  ctx.fillStyle = '#3A2010';
  ctx.fillRect(cx - 3, cy - 8, 6, 8);
  ctx.fillStyle = '#A0C8E0';
  ctx.fillRect(cx - 10, cy - 12, 3, 3);
  ctx.fillRect(cx + 7, cy - 12, 3, 3);
  drawFlag(ctx, cx, cy - bh - 10, p.accent, tick);
}

// ---- WONDER (step pyramid + gold capstone) ----------------------------

function drawWonder(ctx: CanvasRenderingContext2D, cx: number, cy: number, _p: Palette, tick: number): void {
  drawShadow(ctx, cx, cy, 20, 8);
  for (let tier = 0; tier < 4; tier++) {
    const tw = 36 - tier * 8;
    const ty = cy - tier * 6;
    ctx.fillStyle = tier % 2 === 0 ? COLORS.terrain.stone[0] : COLORS.terrain.stone[1];
    ctx.fillRect(cx - tw / 2, ty - 6, tw, 6);
  }
  ctx.fillStyle = COLORS.resources.gold;
  ctx.beginPath();
  ctx.moveTo(cx, cy - 28); ctx.lineTo(cx + 4, cy - 24); ctx.lineTo(cx - 4, cy - 24);
  ctx.closePath(); ctx.fill();
  ctx.save();
  ctx.globalAlpha = 0.3 + 0.1 * Math.sin(tick * 0.05);
  ctx.fillStyle = COLORS.resources.gold;
  ctx.beginPath(); ctx.arc(cx, cy - 26, 6, 0, Math.PI * 2); ctx.fill();
  ctx.restore();
  ctx.fillStyle = '#1A0A00';
  ctx.fillRect(cx - 3, cy - 5, 6, 5);
}

// ---- HD generic building (gradient walls, roof, shadow, lighting) ------

function drawHdGenericBuilding(
  ctx: CanvasRenderingContext2D,
  cx: number, cy: number,
  size: number,
  p: Palette,
  tick: number,
  type: string,
): void {
  const bw = 8 + size * 6;
  const bh = 6 + size * 4;
  const accent = getBuildingAccent(type);
  drawShadow(ctx, cx, cy, bw + 2, bh * 0.4);

  // Wall with gradient
  const wallGrad = ctx.createLinearGradient(cx, cy - bh, cx, cy);
  wallGrad.addColorStop(0, p.wall);
  wallGrad.addColorStop(1, '#807060');
  ctx.fillStyle = wallGrad;
  ctx.fillRect(cx - bw / 2, cy - bh, bw, bh);

  // Ambient occlusion
  ctx.fillStyle = 'rgba(0,0,0,0.08)';
  ctx.fillRect(cx - bw / 2, cy - 2, bw, 2);

  // Right shadow
  ctx.fillStyle = 'rgba(0,0,0,0.1)';
  ctx.fillRect(cx + bw / 2 - 2, cy - bh, 2, bh);

  // Door with accent color
  if (accent.door) {
    ctx.fillStyle = accent.door;
    ctx.fillRect(cx - 2, cy - 5, 4, 5);
  }

  // Detail accent stripe (unique per building)
  ctx.fillStyle = accent.detail;
  ctx.fillRect(cx - bw / 2, cy - bh, bw, 1); // top border
  ctx.fillRect(cx - bw / 2, cy - 1, bw, 1);   // bottom border

  // Unique detail based on type category
  if (accent.detail !== p.accent) {
    // Small icon/symbol in the accent color
    ctx.fillStyle = accent.detail;
    ctx.fillRect(cx - 2, cy - bh + 2, 4, 3); // accent badge
  }

  // Roof with tint or default
  const roofColor = accent.roofTint || p.roof;
  const roofGrad = ctx.createLinearGradient(cx, cy - bh - size * 3, cx, cy - bh);
  roofGrad.addColorStop(0, roofColor);
  roofGrad.addColorStop(1, '#807060');
  ctx.fillStyle = roofGrad;
  ctx.beginPath();
  ctx.moveTo(cx, cy - bh - size * 3);
  ctx.lineTo(cx + bw / 2 + 1, cy - bh);
  ctx.lineTo(cx - bw / 2 - 1, cy - bh);
  ctx.closePath();
  ctx.fill();
  // Roof highlight
  ctx.fillStyle = 'rgba(255,255,200,0.07)';
  ctx.beginPath();
  ctx.moveTo(cx, cy - bh - size * 3);
  ctx.lineTo(cx - bw / 2 - 1, cy - bh);
  ctx.lineTo(cx, cy - bh);
  ctx.closePath();
  ctx.fill();

  if (size >= 2) drawFlag(ctx, cx, cy - bh - size * 3, accent.detail, tick);
}

// ---- Generic pencil sketch building (for types without custom comic code) ----

function drawComicGenericBuilding(
  ctx: CanvasRenderingContext2D,
  cx: number, cy: number,
  size: number,
  type: string,
): void {
  const pc = pencilColor();
  ctx.strokeStyle = pc;

  const bw = 8 + size * 6;
  const bh = 6 + size * 4;

  ctx.lineWidth = 0.4;
  // Main body outline
  sketchRect(ctx, cx - bw / 2, cy - bh, bw, bh);
  // Roof line
  sketchTriangle(ctx, cx, cy - bh - size * 3, cx + bw / 2 + 1, cy - bh, cx - bw / 2 - 1, cy - bh);
  // Door
  ctx.lineWidth = 0.3;
  sketchRect(ctx, cx - 2, cy - 5, 4, 5);
  // Cross-hatch on right side
  drawCrossHatch(ctx, cx, cy - bh, bw / 2, bh);
  // Label text in pencil
  ctx.fillStyle = pc;
  ctx.font = '4px monospace';
  ctx.textAlign = 'center';
  ctx.fillText(type, cx, cy - bh - size * 3 - 2);
  // Flag for larger buildings
  if (size >= 2) {
    drawComicFlag(ctx, cx, cy - bh - size * 3);
  }
}

// ====================================================================
// Public class
// ====================================================================

export class BuildingRenderer {
  render(
    ctx: CanvasRenderingContext2D,
    buildings: Building[],
    ageId: string,
    tick: number,
  ): void {
    // Pre-build wall position set for connected walls
    const wallPositions = new Set<string>();
    for (const b of buildings) {
      if (b.type === 'stoneWall' || b.type === 'gate') {
        wallPositions.add(`${b.tile.col},${b.tile.row}`);
      }
    }

    for (const building of buildings) {
      const { tile, type, constructionProgress } = building;
      const size = getBuildingSize(type);
      const scr  = buildingScreenCenter(tile.col, tile.row, size);
      const cx   = scr.x;
      const cy   = scr.y;
      const palette = getAgePalette(ageId);

      ctx.save();

      if (constructionProgress < 1) {
        ctx.globalAlpha = 0.4 + 0.5 * constructionProgress;
      }

      const comicCustomTypes = new Set([
        'house', 'townCenter', 'farm', 'barracks', 'watchTower',
      ]);
      const hdCustomTypes = new Set(['house', 'townCenter']);
      const sid2 = getCurrentStyleId();
      const isComic = sid2 === 'comic';
      const isHd = sid2 === 'hd';

      if (isComic && !comicCustomTypes.has(type)) {
        drawComicGenericBuilding(ctx, cx, cy, size, type);
      } else if (isHd && !hdCustomTypes.has(type)) {
        drawHdGenericBuilding(ctx, cx, cy, size, palette, tick, type);
      } else {
        switch (type) {
          case 'house':        drawHouse(ctx, cx, cy, palette, tick); break;
          case 'townCenter':   drawTownCenter(ctx, cx, cy, palette, tick); break;
          case 'farm':         drawFarm(ctx, cx, cy); break;
          case 'lumberCamp':   drawLumberCamp(ctx, cx, cy, palette); break;
          case 'miningCamp':   drawMiningCamp(ctx, cx, cy, palette); break;
          case 'barracks':     drawBarracks(ctx, cx, cy, palette); break;
          case 'watchTower':   drawWatchTower(ctx, cx, cy, palette, tick); break;
          case 'stoneWall':    drawStoneWall(ctx, cx, cy, palette, getWallNeighbors(building, wallPositions)); break;
          case 'gate':         drawGate(ctx, cx, cy, palette); break;
          case 'mill':         drawMill(ctx, cx, cy, palette, tick); break;
          case 'granary':      drawGranary(ctx, cx, cy, palette); break;
          case 'lumberYard':   drawLumberYard(ctx, cx, cy, palette); break;
          case 'stoneVault':   drawStoneVault(ctx, cx, cy, palette); break;
          case 'treasury':     drawTreasury(ctx, cx, cy, palette); break;
          case 'outpost':      drawOutpost(ctx, cx, cy, palette, tick); break;
          case 'bombardTower': drawBombardTower(ctx, cx, cy, palette); break;
          case 'archeryRange': drawArcheryRange(ctx, cx, cy, palette); break;
          case 'stable':       drawStable(ctx, cx, cy, palette); break;
          case 'siegeWorkshop':drawSiegeWorkshop(ctx, cx, cy, palette); break;
          case 'market':       drawMarket(ctx, cx, cy, palette); break;
          case 'blacksmith':   drawBlacksmith(ctx, cx, cy, palette, tick); break;
          case 'university':   drawUniversity(ctx, cx, cy, palette); break;
          case 'temple':       drawTemple(ctx, cx, cy, palette); break;
          case 'monastery':    drawMonastery(ctx, cx, cy, palette, tick); break;
          case 'bank':         drawBank(ctx, cx, cy, palette); break;
          case 'cannonFoundry':drawCannonFoundry(ctx, cx, cy, palette, tick); break;
          case 'castle':       drawCastle(ctx, cx, cy, palette, tick); break;
          case 'imperialPalace':drawImperialPalace(ctx, cx, cy, palette, tick); break;
          case 'wonder':       drawWonder(ctx, cx, cy, palette, tick); break;
          default: {
            // Fallback for any unknown type
            if (isComic) {
              drawComicGenericBuilding(ctx, cx, cy, size, type);
            } else {
              const bw = 8 + size * 6;
              const bh = 6 + size * 4;
              drawShadow(ctx, cx, cy, bw, bh * 0.35);
              ctx.fillStyle = palette.wall;
              ctx.fillRect(cx - bw / 2, cy - bh, bw, bh);
              ctx.fillStyle = palette.roof;
              ctx.beginPath();
              ctx.moveTo(cx, cy - bh - size * 3);
              ctx.lineTo(cx + bw / 2 + 1, cy - bh);
              ctx.lineTo(cx - bw / 2 - 1, cy - bh);
              ctx.closePath(); ctx.fill();
              if (size >= 2) drawFlag(ctx, cx, cy - bh - size * 3, palette.accent, tick);
            }
            break;
          }
        }
      }

      // Scaffold overlay if not yet complete
      if (constructionProgress < 1) {
        const bw = 8 + size * 6;
        const bh = 6 + size * 4;
        drawScaffold(ctx, cx, cy, bw, bh, constructionProgress);
      }

      ctx.restore();

      // HP bar for damaged buildings
      if (building.hp < building.maxHp) {
        const barW = 12 + size * 4;
        const barX = cx - barW / 2;
        const barY = cy - (6 + size * 4) - 8;
        const ratio = building.hp / building.maxHp;
        ctx.fillStyle = '#300000';
        ctx.fillRect(barX, barY, barW, 2);
        ctx.fillStyle = ratio > 0.5 ? COLORS.ui.textGreen : COLORS.ui.textRed;
        ctx.fillRect(barX, barY, barW * ratio, 2);
      }
    }
  }
}
