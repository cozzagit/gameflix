// ============================================================
// TinyEmpire — Master Renderer
// ============================================================
//
// Orchestrates all sub-renderers in the correct draw order:
//
//   1. Clear canvas
//   2. Save → apply camera transform
//   3. Tiles
//   4. Buildings (back-to-front by iso depth)
//   5. Units     (back-to-front by iso depth)
//   6. Particles
//   7. Restore camera transform
//   8. [UI placeholder — added in a later pass]
//
// The camera is represented by the Camera interface from types:
//   { x, y, zoom, targetX, targetY, targetZoom }
//
// The transform formula (world → screen):
//   screenX = (worldX - camera.x) * zoom + canvasWidth  / 2
//   screenY = (worldY - camera.y) * zoom + canvasHeight / 2
//
// We apply this via ctx.translate / ctx.scale so all sub-renderers
// can work entirely in world-space coordinates.
// ============================================================

import type { GameState, Camera, Building, Unit, Particle } from '../types/index.ts';

import { TileRenderer }     from './tile-renderer.ts';
import { BuildingRenderer } from './building-renderer.ts';
import { UnitRenderer }     from './unit-renderer.ts';
import { ParticleRenderer } from './particle-renderer.ts';
import { getCurrentStyle }  from './styles.ts';

// ---- Iso depth key for painter's algorithm sort ----------------------
// Higher value → drawn later (in front).

function buildingDepth(b: Building): number {
  return b.tile.col + b.tile.row;
}

function unitDepth(u: Unit): number {
  // Convert world pixel position back to iso tile coords for a consistent
  // depth key that matches building depth.
  // world pos uses the same origin as isoToScreen, so the inverse gives
  // fractional tile coordinates.
  const col = (u.pos.x / 16 + u.pos.y / 8) / 2;
  const row = (u.pos.y / 8  - u.pos.x / 16) / 2;
  return col + row;
}

// ====================================================================
// Public class
// ====================================================================

export class Renderer {
  private readonly ctx: CanvasRenderingContext2D;
  private readonly tiles: TileRenderer;
  private readonly buildings: BuildingRenderer;
  private readonly units: UnitRenderer;
  private readonly particles: ParticleRenderer;

  constructor(
    ctx: CanvasRenderingContext2D,
    tileRenderer:     TileRenderer,
    buildingRenderer: BuildingRenderer,
    unitRenderer:     UnitRenderer,
    particleRenderer: ParticleRenderer,
  ) {
    this.ctx       = ctx;
    this.tiles     = tileRenderer;
    this.buildings = buildingRenderer;
    this.units     = unitRenderer;
    this.particles = particleRenderer;
  }

  // ---- Camera helpers ------------------------------------------------

  /** Apply the camera's world→screen transform to the canvas context. */
  private applyCamera(camera: Camera, canvasWidth: number, canvasHeight: number): void {
    const ctx = this.ctx;
    ctx.translate(canvasWidth  / 2, canvasHeight / 2);
    ctx.scale(camera.zoom, camera.zoom);
    ctx.translate(-camera.x, -camera.y);
  }

  // ---- Main entry point ----------------------------------------------

  render(
    state: GameState,
    camera: Camera,
    tick: number,
    canvasWidth: number,
    canvasHeight: number,
    particles: Particle[] = [],
  ): void {
    const ctx = this.ctx;

    // 1. Clear canvas
    ctx.fillStyle = getCurrentStyle().bgColor;
    ctx.fillRect(0, 0, canvasWidth, canvasHeight);

    // 2. Save context and apply camera transform
    ctx.save();
    this.applyCamera(camera, canvasWidth, canvasHeight);

    // 3. Render tile layer
    this.tiles.render(ctx, state.map, camera, canvasWidth, canvasHeight, tick);

    // 4. Depth-sort buildings (iso painter's algorithm: lower depth first)
    const sortedBuildings = [...state.buildings].sort(
      (a, b) => buildingDepth(a) - buildingDepth(b),
    );
    this.buildings.render(ctx, sortedBuildings, state.currentAge, tick);

    // 5. Depth-sort units the same way and render
    const sortedUnits = [...state.units].sort(
      (a, b) => unitDepth(a) - unitDepth(b),
    );
    this.units.render(ctx, sortedUnits, tick);

    // 6. Particles (drawn on top of everything in world space)
    this.particles.render(ctx, particles);

    // 7. Restore context (removes camera transform)
    ctx.restore();

    // 8. [UI LAYER PLACEHOLDER]
    // ---------------------------------------------------------------
    // The HUD, resource bar, building panel, and tooltip overlays will
    // be drawn here in a future pass, directly in screen-space so they
    // are not affected by the camera zoom/pan.
    // Example:
    //   this.hud.render(ctx, state, canvasWidth, canvasHeight);
    // ---------------------------------------------------------------
  }
}

// ====================================================================
// Factory helper — creates a fully wired Renderer in one call
// ====================================================================

export function createRenderer(ctx: CanvasRenderingContext2D): Renderer {
  return new Renderer(
    ctx,
    new TileRenderer(),
    new BuildingRenderer(),
    new UnitRenderer(),
    new ParticleRenderer(),
  );
}
