// ============================================================
// TinyEmpire — Tile Renderer
// ============================================================
//
// Draws the isometric map using canvas primitives only (no sprites).
// Each tile is a 32×16 diamond.  Only tiles whose screen-space center
// is inside [−margin, canvasWidth+margin] × [−margin, canvasHeight+margin]
// are submitted to the canvas — this is the culling pass.
// ============================================================

import type { GameMap, Camera } from '../types/index.ts';
import { isoToScreen } from '../core/math.ts';
import { COLORS, getTileBaseColor } from './colors.ts';
import { getCurrentStyle, getCurrentStyleId, applyStyleToColor, wobble, pencilColor } from './styles.ts';

// Tile half-dimensions (keep in sync with math.ts constants)
const HALF_W = 16; // px  (full tile = 32px wide)
const HALF_H = 8;  // px  (full tile = 16px tall)

// How many px outside the canvas edge we still render (avoids pop-in)
const CULL_MARGIN = 64;

// ---- Helper: draw a single iso diamond ---------------------------------

function drawDiamond(
  ctx: CanvasRenderingContext2D,
  cx: number,
  cy: number,
  fill: string,
  edgeColor?: string,
): void {
  const sid = getCurrentStyleId();

  if (sid === 'comic') {
    // Pencil sketch: faint color wash + pencil outline
    ctx.beginPath();
    ctx.moveTo(cx, cy - HALF_H);
    ctx.lineTo(cx + HALF_W, cy);
    ctx.lineTo(cx, cy + HALF_H);
    ctx.lineTo(cx - HALF_W, cy);
    ctx.closePath();
    ctx.fillStyle = fill;
    ctx.fill();
    ctx.strokeStyle = pencilColor();
    ctx.lineWidth = 0.25;
    ctx.stroke();
    return;
  }

  if (sid === 'hd') {
    // HD: gradient-filled diamond with lighting
    ctx.beginPath();
    ctx.moveTo(cx, cy - HALF_H);
    ctx.lineTo(cx + HALF_W, cy);
    ctx.lineTo(cx, cy + HALF_H);
    ctx.lineTo(cx - HALF_W, cy);
    ctx.closePath();
    ctx.fillStyle = fill;
    ctx.fill();
    // Top-left highlight (sunlight)
    ctx.fillStyle = 'rgba(255,255,200,0.06)';
    ctx.beginPath();
    ctx.moveTo(cx, cy - HALF_H);
    ctx.lineTo(cx - HALF_W, cy);
    ctx.lineTo(cx, cy);
    ctx.closePath();
    ctx.fill();
    // Bottom-right shadow
    ctx.fillStyle = 'rgba(0,0,0,0.06)';
    ctx.beginPath();
    ctx.moveTo(cx, cy + HALF_H);
    ctx.lineTo(cx + HALF_W, cy);
    ctx.lineTo(cx, cy);
    ctx.closePath();
    ctx.fill();
    // Subtle edge
    if (edgeColor) {
      ctx.strokeStyle = edgeColor;
      ctx.lineWidth = 0.3;
      ctx.stroke();
    }
    return;
  }

  ctx.beginPath();
  ctx.moveTo(cx,           cy - HALF_H);
  ctx.lineTo(cx + HALF_W,  cy);
  ctx.lineTo(cx,           cy + HALF_H);
  ctx.lineTo(cx - HALF_W,  cy);
  ctx.closePath();

  ctx.fillStyle = fill;
  ctx.fill();

  if (edgeColor) {
    ctx.strokeStyle = edgeColor;
    ctx.lineWidth = 0.5;
    ctx.stroke();
  }

  // Neon: subtle grid lines between tiles
  const style = getCurrentStyle();
  if (style.tileGridColor) {
    ctx.strokeStyle = style.tileGridColor;
    ctx.lineWidth = 0.3;
    ctx.stroke();
  }
}

// ---- Helper: draw a neon glow circle around resource tiles ---------------

function drawResourceGlow(
  ctx: CanvasRenderingContext2D,
  cx: number,
  cy: number,
  color: string,
): void {
  ctx.save();
  ctx.globalAlpha = 0.2;
  ctx.fillStyle = color;
  ctx.beginPath();
  ctx.arc(cx, cy - HALF_H, 8, 0, Math.PI * 2);
  ctx.fill();
  ctx.restore();
}

// ---- Helper: derive darker edge colour from fill -----------------------

function darkenHex(hex: string, amount = 24): string {
  const n = parseInt(hex.slice(1), 16);
  const r = Math.max(0, ((n >> 16) & 0xff) - amount);
  const g = Math.max(0, ((n >>  8) & 0xff) - amount);
  const b = Math.max(0, ( n        & 0xff) - amount);
  return `#${((r << 16) | (g << 8) | b).toString(16).padStart(6, '0')}`;
}

// ---- Helper: animated water colour ------------------------------------

function waterColor(col: number, row: number, tick: number): string {
  // Cheap shimmer: offset the wave phase per-tile so tiles don't all pulse together
  const phase = ((col * 3 + row * 5 + tick / 6) & 0xff) / 255;
  const t = 0.5 + 0.5 * Math.sin(phase * Math.PI * 2);
  // Interpolate between water[0] and water[3]
  const w = COLORS.terrain.water;
  const idxA = 0;
  const idxB = (Math.floor((col * 7 + row * 11) & 3)) % w.length;
  const blend = t * 0.4; // subtle shift
  // Parse and blend the two hex colours
  const parseHex = (h: string) => ({
    r: parseInt(h.slice(1, 3), 16),
    g: parseInt(h.slice(3, 5), 16),
    b: parseInt(h.slice(5, 7), 16),
  });
  const ca = parseHex(w[idxA]);
  const cb = parseHex(w[idxB]);
  const ri = Math.round(ca.r + (cb.r - ca.r) * blend);
  const gi = Math.round(ca.g + (cb.g - ca.g) * blend);
  const bi = Math.round(ca.b + (cb.b - ca.b) * blend);
  return `#${((ri << 16) | (gi << 8) | bi).toString(16).padStart(6, '0')}`;
}

// ---- Helper: very faint color wash for comic (pencil sketch) mode ------

function comicTileWash(type: string): string {
  switch (type) {
    case 'grass1': case 'grass2': case 'grass3':
      return 'rgba(120,180,80,0.08)';
    case 'forest':
      return 'rgba(80,140,60,0.10)';
    case 'water1': case 'water2':
      return 'rgba(80,140,200,0.10)';
    case 'stoneDeposit':
      return 'rgba(140,140,150,0.08)';
    case 'goldDeposit':
      return 'rgba(200,180,80,0.10)';
    case 'berryBush':
      return 'rgba(160,80,120,0.08)';
    case 'deerHerd':
      return 'rgba(160,140,80,0.08)';
    case 'desert':
      return 'rgba(210,190,130,0.10)';
    case 'snow':
      return 'rgba(200,210,220,0.08)';
    default:
      return 'rgba(120,180,80,0.06)';
  }
}

// ---- Helper: draw wavy pencil lines for water (comic mode) -----------

function drawComicWater(
  ctx: CanvasRenderingContext2D,
  cx: number,
  cy: number,
): void {
  ctx.strokeStyle = pencilColor();
  ctx.lineWidth = 0.25;
  for (let i = -2; i <= 2; i++) {
    const y = cy + i * 3;
    ctx.beginPath();
    ctx.moveTo(wobble(cx - 10), wobble(y));
    ctx.quadraticCurveTo(wobble(cx - 5), wobble(y - 1.5), wobble(cx), wobble(y));
    ctx.quadraticCurveTo(wobble(cx + 5), wobble(y + 1.5), wobble(cx + 10), wobble(y));
    ctx.stroke();
  }
}

// ---- Helper: draw sketchy rocks for comic mode -----------------------

function drawComicRocks(
  ctx: CanvasRenderingContext2D,
  cx: number,
  cy: number,
): void {
  const pc = pencilColor();
  ctx.strokeStyle = pc;
  ctx.lineWidth = 0.35;
  // Three small irregular circles
  const positions = [[-4, 2], [3, 3], [0, 0]];
  for (const [ox, oy] of positions) {
    ctx.beginPath();
    ctx.arc(wobble(cx + ox, 0.8), wobble(cy - HALF_H + oy, 0.8), 2.5, 0, Math.PI * 2);
    ctx.stroke();
  }
}

// ---- Helper: draw sketchy berry bush for comic mode ------------------

function drawComicBerryBush(
  ctx: CanvasRenderingContext2D,
  cx: number,
  cy: number,
): void {
  const pc = pencilColor();
  ctx.strokeStyle = pc;
  ctx.lineWidth = 0.3;
  // Leaf outline
  ctx.beginPath();
  ctx.ellipse(wobble(cx), wobble(cy - HALF_H + 1), 6, 3.5, 0, 0, Math.PI * 2);
  ctx.stroke();
  // Small dots for berries
  ctx.fillStyle = pc;
  const positions = [[-3, 0], [0, -1], [3, 1], [-1, 2]];
  for (const [bx, by] of positions) {
    ctx.beginPath();
    ctx.arc(wobble(cx + bx), wobble(cy - HALF_H + by), 1, 0, Math.PI * 2);
    ctx.fill();
  }
}

// ---- Helper: draw sketchy deer for comic mode ------------------------

function drawComicDeer(
  ctx: CanvasRenderingContext2D,
  cx: number,
  cy: number,
): void {
  const pc = pencilColor();
  ctx.strokeStyle = pc;
  ctx.lineWidth = 0.3;
  // Deer 1: simple body outline + stick legs
  ctx.beginPath();
  ctx.ellipse(wobble(cx - 4), wobble(cy - HALF_H - 1), 4, 2, 0, 0, Math.PI * 2);
  ctx.stroke();
  // Head
  ctx.beginPath();
  ctx.arc(wobble(cx - 8), wobble(cy - HALF_H - 3), 1.5, 0, Math.PI * 2);
  ctx.stroke();
  // Legs
  ctx.beginPath();
  ctx.moveTo(cx - 6, cy - HALF_H + 1); ctx.lineTo(cx - 6, cy - HALF_H + 4);
  ctx.moveTo(cx - 3, cy - HALF_H + 1); ctx.lineTo(cx - 3, cy - HALF_H + 4);
  ctx.stroke();
  // Deer 2 (smaller, offset)
  ctx.beginPath();
  ctx.ellipse(wobble(cx + 3), wobble(cy - HALF_H), 3, 1.5, 0, 0, Math.PI * 2);
  ctx.stroke();
  ctx.beginPath();
  ctx.moveTo(cx + 1, cy - HALF_H + 1.5); ctx.lineTo(cx + 1, cy - HALF_H + 4);
  ctx.moveTo(cx + 4, cy - HALF_H + 1.5); ctx.lineTo(cx + 4, cy - HALF_H + 4);
  ctx.stroke();
}

// ---- HD style: detailed gradient tree --------------------------------

function drawHdTree(
  ctx: CanvasRenderingContext2D,
  cx: number, cy: number,
): void {
  // Rich trunk with gradient
  const trunkGrad = ctx.createLinearGradient(cx - 2, cy - HALF_H, cx + 2, cy - HALF_H);
  trunkGrad.addColorStop(0, '#8B6030');
  trunkGrad.addColorStop(0.5, '#5A3818');
  trunkGrad.addColorStop(1, '#3A2008');
  ctx.fillStyle = trunkGrad;
  ctx.fillRect(cx - 1.5, cy - HALF_H - 2, 3, 5);

  // Foliage: layered radial gradients for depth
  const layers = [
    { ox: 0, oy: -6, r: 6, c1: '#2A7010', c2: '#1A5008' },
    { ox: -3, oy: -5, r: 4, c1: '#3A9020', c2: '#2A7010' },
    { ox: 3, oy: -5, r: 4, c1: '#3A9020', c2: '#2A7010' },
    { ox: 0, oy: -8, r: 4, c1: '#50B030', c2: '#3A8820' },
  ];
  for (const l of layers) {
    const grad = ctx.createRadialGradient(
      cx + l.ox, cy - HALF_H + l.oy, 0,
      cx + l.ox, cy - HALF_H + l.oy, l.r,
    );
    grad.addColorStop(0, l.c1);
    grad.addColorStop(1, l.c2);
    ctx.fillStyle = grad;
    ctx.beginPath();
    ctx.arc(cx + l.ox, cy - HALF_H + l.oy, l.r, 0, Math.PI * 2);
    ctx.fill();
  }

  // Highlight spots (sunlight hitting leaves)
  ctx.fillStyle = 'rgba(180,255,100,0.15)';
  ctx.beginPath();
  ctx.arc(cx - 1, cy - HALF_H - 7, 2, 0, Math.PI * 2);
  ctx.fill();
}

// ---- HD style: detailed rock cluster ---------------------------------

function drawHdRocks(
  ctx: CanvasRenderingContext2D,
  cx: number, cy: number,
  isGold: boolean,
): void {
  const baseColor = isGold ? '#C8A030' : '#808078';
  const highlightColor = isGold ? '#FFE070' : '#B0B0A8';
  const shadowColor = isGold ? '#806820' : '#505048';

  const rocks = [
    { ox: -4, oy: 2, rx: 4, ry: 3 },
    { ox: 3, oy: 3, rx: 3, ry: 2.5 },
    { ox: 0, oy: 0, rx: 3.5, ry: 2.5 },
  ];

  for (const r of rocks) {
    const rcx = cx + r.ox;
    const rcy = cy - HALF_H + r.oy;
    // Main rock with gradient
    const grad = ctx.createRadialGradient(rcx - 1, rcy - 1, 0, rcx, rcy, r.rx);
    grad.addColorStop(0, highlightColor);
    grad.addColorStop(0.6, baseColor);
    grad.addColorStop(1, shadowColor);
    ctx.fillStyle = grad;
    ctx.beginPath();
    ctx.ellipse(rcx, rcy, r.rx, r.ry, -0.2, 0, Math.PI * 2);
    ctx.fill();
  }
}

// ---- HD style: detailed berry bush -----------------------------------

function drawHdBerryBush(
  ctx: CanvasRenderingContext2D,
  cx: number, cy: number,
): void {
  // Leaf mass with gradient
  const leafGrad = ctx.createRadialGradient(cx, cy - HALF_H, 0, cx, cy - HALF_H + 1, 7);
  leafGrad.addColorStop(0, '#5AA038');
  leafGrad.addColorStop(0.7, '#3A7020');
  leafGrad.addColorStop(1, '#2A5818');
  ctx.fillStyle = leafGrad;
  ctx.beginPath();
  ctx.ellipse(cx, cy - HALF_H + 1, 7, 4.5, 0, 0, Math.PI * 2);
  ctx.fill();

  // Berries with glossy highlight
  const berryPositions = [[-3, 0], [0, -1], [3, 1], [-1, 2], [2, -1]];
  for (const [bx, by] of berryPositions) {
    const bcx = cx + bx;
    const bcy = cy - HALF_H + by;
    // Berry gradient
    const bGrad = ctx.createRadialGradient(bcx - 0.3, bcy - 0.3, 0, bcx, bcy, 1.8);
    bGrad.addColorStop(0, '#FF4080');
    bGrad.addColorStop(0.5, '#C02060');
    bGrad.addColorStop(1, '#801040');
    ctx.fillStyle = bGrad;
    ctx.beginPath();
    ctx.arc(bcx, bcy, 1.8, 0, Math.PI * 2);
    ctx.fill();
    // Tiny white highlight
    ctx.fillStyle = 'rgba(255,255,255,0.4)';
    ctx.beginPath();
    ctx.arc(bcx - 0.5, bcy - 0.5, 0.5, 0, Math.PI * 2);
    ctx.fill();
  }
}

// ---- Helper: draw a simple stylised tree on top of the base diamond ---

function drawTree(
  ctx: CanvasRenderingContext2D,
  cx: number,
  cy: number,
): void {
  const sid = getCurrentStyleId();

  if (sid === 'comic') {
    // Clean pencil sketch tree
    const pc = pencilColor();
    ctx.strokeStyle = pc;
    ctx.lineWidth = 0.4;
    // Trunk
    ctx.beginPath();
    ctx.moveTo(cx, cy - HALF_H + 1);
    ctx.lineTo(cx, cy - HALF_H - 4);
    ctx.stroke();
    // Foliage — single clean circle
    ctx.lineWidth = 0.3;
    ctx.beginPath();
    ctx.arc(cx, cy - HALF_H - 5, 4, 0, Math.PI * 2);
    ctx.stroke();
  } else if (sid === 'hd') {
    drawHdTree(ctx, cx, cy);
  } else if (sid === 'neon') {
    // Neon: glowing line tree
    ctx.strokeStyle = '#00ff60';
    ctx.lineWidth = 0.5;
    ctx.shadowBlur = 2;
    ctx.shadowColor = '#00ff60';
    // Trunk line
    ctx.beginPath();
    ctx.moveTo(cx, cy - HALF_H + 1);
    ctx.lineTo(cx, cy - HALF_H - 6);
    ctx.stroke();
    // Foliage triangle outline
    ctx.beginPath();
    ctx.moveTo(cx, cy - HALF_H - 8);
    ctx.lineTo(cx + 5, cy - HALF_H - 1);
    ctx.lineTo(cx - 5, cy - HALF_H - 1);
    ctx.closePath();
    ctx.stroke();
    ctx.shadowBlur = 0;
  } else {
    // Pixel: original
    ctx.fillStyle = '#6B4226';
    ctx.fillRect(cx - 1, cy - HALF_H - 3, 2, 4);
    ctx.fillStyle = '#306818';
    ctx.beginPath();
    ctx.moveTo(cx, cy - HALF_H - 8);
    ctx.lineTo(cx + 5, cy - HALF_H - 1);
    ctx.lineTo(cx - 5, cy - HALF_H - 1);
    ctx.closePath(); ctx.fill();
    ctx.fillStyle = '#408020';
    ctx.beginPath();
    ctx.moveTo(cx, cy - HALF_H - 5);
    ctx.lineTo(cx + 6, cy - HALF_H + 1);
    ctx.lineTo(cx - 6, cy - HALF_H + 1);
    ctx.closePath(); ctx.fill();
  }
}

// ---- Helper: draw a rock cluster on the base tile ----------------------

function drawRockCluster(
  ctx: CanvasRenderingContext2D,
  cx: number,
  cy: number,
  color: string,
): void {
  ctx.fillStyle = color;
  // Three rough ellipses offset so they look like rocks
  ctx.beginPath();
  ctx.ellipse(cx - 4, cy - HALF_H + 2, 4, 3, -0.3, 0, Math.PI * 2);
  ctx.fill();
  ctx.beginPath();
  ctx.ellipse(cx + 3, cy - HALF_H + 3, 3, 2, 0.2, 0, Math.PI * 2);
  ctx.fill();
  ctx.beginPath();
  ctx.ellipse(cx,     cy - HALF_H,     3, 2, 0,   0, Math.PI * 2);
  ctx.fill();

  // Highlight on top rock
  ctx.fillStyle = 'rgba(255,255,255,0.2)';
  ctx.beginPath();
  ctx.ellipse(cx - 1, cy - HALF_H - 1, 2, 1, 0, 0, Math.PI * 2);
  ctx.fill();
}

// ---- Helper: draw a berry bush -----------------------------------------

function drawBerryBush(
  ctx: CanvasRenderingContext2D,
  cx: number,
  cy: number,
): void {
  // Leaf mass
  ctx.fillStyle = '#4A8030';
  ctx.beginPath();
  ctx.ellipse(cx, cy - HALF_H + 1, 6, 4, 0, 0, Math.PI * 2);
  ctx.fill();

  // Berries: small circles
  const berryColor = '#C02060';
  const positions = [
    [-3, -HALF_H + 0], [0, -HALF_H - 1], [3, -HALF_H + 1], [-1, -HALF_H + 2],
  ];
  ctx.fillStyle = berryColor;
  for (const [bx, by] of positions) {
    ctx.beginPath();
    ctx.arc(cx + bx, cy + by, 1.5, 0, Math.PI * 2);
    ctx.fill();
  }
}

// ---- Helper: draw a deer herd -------------------------------------------

function drawDeerHerd(
  ctx: CanvasRenderingContext2D,
  cx: number,
  cy: number,
  tick: number,
): void {
  // Two small deer silhouettes with subtle idle animation
  const bob = Math.sin(tick * 0.08) * 0.5;

  // Deer 1 (left)
  ctx.fillStyle = '#8B6B3A';
  // Body
  ctx.fillRect(cx - 7, cy - HALF_H - 2 + bob, 6, 3);
  // Head
  ctx.fillRect(cx - 8, cy - HALF_H - 4 + bob, 2, 2);
  // Legs
  ctx.fillStyle = '#6B4E2A';
  ctx.fillRect(cx - 6, cy - HALF_H + 1 + bob, 1, 2);
  ctx.fillRect(cx - 3, cy - HALF_H + 1 + bob, 1, 2);

  // Deer 2 (right, slightly offset timing)
  const bob2 = Math.sin(tick * 0.08 + 2) * 0.5;
  ctx.fillStyle = '#9B7B4A';
  ctx.fillRect(cx + 1, cy - HALF_H - 1 + bob2, 5, 3);
  ctx.fillRect(cx + 5, cy - HALF_H - 3 + bob2, 2, 2);
  ctx.fillStyle = '#6B4E2A';
  ctx.fillRect(cx + 2, cy - HALF_H + 2 + bob2, 1, 2);
  ctx.fillRect(cx + 4, cy - HALF_H + 2 + bob2, 1, 2);
}

// ========================================================================

export class TileRenderer {
  render(
    ctx: CanvasRenderingContext2D,
    map: GameMap,
    camera: Camera,
    canvasWidth: number,
    canvasHeight: number,
    tick: number,
  ): void {
    const { width, height, tiles } = map;

    // Pre-compute inverse camera transform so we can map the viewport
    // corners back to iso-space for culling.
    const invZoom = 1 / camera.zoom;

    // Viewport bounds in world-space (before iso projection)
    const vpLeft   = (0            - canvasWidth  * 0.5) * invZoom + camera.x;
    const vpRight  = (canvasWidth  - canvasWidth  * 0.5) * invZoom + camera.x;
    const vpTop    = (0            - canvasHeight * 0.5) * invZoom + camera.y;
    const vpBottom = (canvasHeight - canvasHeight * 0.5) * invZoom + camera.y;

    for (let row = 0; row < height; row++) {
      for (let col = 0; col < width; col++) {
        const scr = isoToScreen(col, row);

        // Viewport culling
        if (
          scr.x < vpLeft   - CULL_MARGIN ||
          scr.x > vpRight  + CULL_MARGIN ||
          scr.y < vpTop    - CULL_MARGIN ||
          scr.y > vpBottom + CULL_MARGIN
        ) {
          continue;
        }

        const tile = tiles[row][col];
        const cx = scr.x;
        const cy = scr.y;

        // ---- Base diamond fill ----
        const style = getCurrentStyle();
        const sid = getCurrentStyleId();
        let baseFill: string;
        if (sid === 'comic') {
          // Pencil sketch: very faint color wash over paper
          baseFill = comicTileWash(tile.type);
        } else if (tile.type === 'water1' || tile.type === 'water2') {
          baseFill = waterColor(col, row, tick);
        } else {
          baseFill = getTileBaseColor(tile.type, col, row);
        }

        // Apply style color adjustments (brightness + saturation) — skip for comic
        if (sid !== 'comic') {
          baseFill = applyStyleToColor(baseFill);
        }

        const edgeColor = sid === 'comic' ? undefined : darkenHex(baseFill, style.tileEdgeDarken);
        drawDiamond(ctx, cx, cy, baseFill, edgeColor);

        // ---- Tile-type overlays ----
        if (sid === 'comic') {
          // Pencil sketch overlays
          switch (tile.type) {
            case 'forest':
              if (tile.resourceAmount > 0) drawTree(ctx, cx, cy);
              break;
            case 'water1': case 'water2':
              drawComicWater(ctx, cx, cy);
              break;
            case 'stoneDeposit':
              if (tile.resourceAmount > 0) drawComicRocks(ctx, cx, cy);
              break;
            case 'goldDeposit':
              if (tile.resourceAmount > 0) drawComicRocks(ctx, cx, cy);
              break;
            case 'berryBush':
              if (tile.resourceAmount > 0) drawComicBerryBush(ctx, cx, cy);
              break;
            case 'deerHerd':
              if (tile.resourceAmount > 0) drawComicDeer(ctx, cx, cy);
              break;
            default:
              break;
          }
        } else {
          switch (tile.type) {
            case 'forest':
              if (tile.resourceAmount > 0) {
                drawTree(ctx, cx, cy);
                if (style.tileGlow) drawResourceGlow(ctx, cx, cy, '#00ff40');
              }
              break;

            case 'stoneDeposit':
              if (tile.resourceAmount > 0) {
                if (sid === 'hd') drawHdRocks(ctx, cx, cy, false);
                else drawRockCluster(ctx, cx, cy, COLORS.terrain.stone[0]);
                if (style.tileGlow) drawResourceGlow(ctx, cx, cy, '#a0a0ff');
              }
              break;

            case 'goldDeposit':
              if (tile.resourceAmount > 0) {
                if (sid === 'hd') drawHdRocks(ctx, cx, cy, true);
                else drawRockCluster(ctx, cx, cy, COLORS.resources.gold);
                if (style.tileGlow) drawResourceGlow(ctx, cx, cy, '#ffd040');
              }
              break;

            case 'berryBush':
              if (tile.resourceAmount > 0) {
                if (sid === 'hd') drawHdBerryBush(ctx, cx, cy);
                else drawBerryBush(ctx, cx, cy);
                if (style.tileGlow) drawResourceGlow(ctx, cx, cy, '#ff40a0');
              }
              break;

            case 'deerHerd':
              if (tile.resourceAmount > 0) {
                drawDeerHerd(ctx, cx, cy, tick);
                if (style.tileGlow) drawResourceGlow(ctx, cx, cy, '#ffaa40');
              }
              break;

            default:
              break;
          }
        }

        // ---- Fog of war ----
        if (!tile.revealed) {
          drawDiamond(ctx, cx, cy, style.fogColor);
        }
      }
    }
  }
}
