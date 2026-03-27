// ============================================================
// TinyEmpire — Game Camera
// ============================================================

import { lerp, clamp } from './math.ts';

// A 64×64 tile map's isometric centre in world-pixel space.
// isoToScreen(32, 32) → x = 0, y = 512  ← centring on that point.
const DEFAULT_MAP_TILES = 64;
const ISO_TILE_W = 32;
const ISO_TILE_H = 16;

const MIN_ZOOM = 0.5;
const MAX_ZOOM = 3.0;
const LERP_SPEED = 0.1;

/**
 * Smooth-following camera with zoom support.
 *
 * Coordinate system
 * -----------------
 * "World space"  = the isometric pixel canvas before any camera transform.
 * "Screen space" = the final canvas pixels seen by the player (0-480, 0-270).
 *
 * The transform applied to the CanvasRenderingContext2D is:
 *   translate(canvasW/2 - x*zoom, canvasH/2 - y*zoom)
 *   scale(zoom, zoom)
 *
 * So world point (x, y) maps to screen point
 *   (canvasW/2 + (wx - x)*zoom, canvasH/2 + (wy - y)*zoom)
 */
export class GameCamera {
  x: number;
  y: number;
  zoom: number;
  targetX: number;
  targetY: number;
  targetZoom: number;

  constructor(initialX?: number, initialY?: number) {
    // Default: centre on the middle of a 64×64 tile isometric map.
    const mid = DEFAULT_MAP_TILES / 2;
    const defaultX = (mid - mid) * (ISO_TILE_W / 2);   // 0
    const defaultY = (mid + mid) * (ISO_TILE_H / 2);   // 512

    this.x = initialX ?? defaultX;
    this.y = initialY ?? defaultY;
    this.zoom = 1.0;
    this.targetX = this.x;
    this.targetY = this.y;
    this.targetZoom = 1.0;
  }

  /**
   * Called every render frame (or logic tick — works either way).
   * Smoothly interpolates current values toward their targets.
   */
  update(_dt: number): void {
    const t = LERP_SPEED;
    this.x = lerp(this.x, this.targetX, t);
    this.y = lerp(this.y, this.targetY, t);
    this.zoom = lerp(this.zoom, this.targetZoom, t);
  }

  /** Move the camera target by a world-space delta. */
  pan(dx: number, dy: number): void {
    this.targetX += dx;
    this.targetY += dy;
  }

  /** Set the target zoom level (clamped to [0.5, 3.0]). */
  zoomTo(level: number): void {
    this.targetZoom = clamp(level, MIN_ZOOM, MAX_ZOOM);
  }

  /** Zoom by a multiplicative delta (e.g. pass 1.1 to zoom in 10 %). */
  zoomBy(factor: number): void {
    this.zoomTo(this.targetZoom * factor);
  }

  /**
   * Convert a canvas-space screen pixel to a world-space pixel.
   * Use this to translate mouse coordinates into the game world.
   */
  screenToWorld(sx: number, sy: number, canvasWidth: number, canvasHeight: number): { x: number; y: number } {
    return {
      x: (sx - canvasWidth / 2) / this.zoom + this.x,
      y: (sy - canvasHeight / 2) / this.zoom + this.y,
    };
  }

  /**
   * Convert a world-space pixel to canvas-space screen coordinates.
   */
  worldToScreen(wx: number, wy: number, canvasWidth: number, canvasHeight: number): { x: number; y: number } {
    return {
      x: (wx - this.x) * this.zoom + canvasWidth / 2,
      y: (wy - this.y) * this.zoom + canvasHeight / 2,
    };
  }

  /**
   * Push the camera's world transform onto the canvas context.
   * Call this before drawing any world-space geometry, and always
   * pair it with `resetTransform` afterwards.
   */
  applyTransform(ctx: CanvasRenderingContext2D, canvasWidth: number, canvasHeight: number): void {
    ctx.save();
    ctx.translate(
      Math.round(canvasWidth / 2 - this.x * this.zoom),
      Math.round(canvasHeight / 2 - this.y * this.zoom),
    );
    ctx.scale(this.zoom, this.zoom);
  }

  /**
   * Pop the camera transform — call after finishing world-space drawing
   * so that subsequent UI draws are in normal screen space.
   */
  resetTransform(ctx: CanvasRenderingContext2D): void {
    ctx.restore();
  }
}
