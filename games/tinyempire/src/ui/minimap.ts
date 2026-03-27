// ============================================================
// TinyEmpire — Minimap Overlay
// ============================================================
//
// Renders a small minimap in the bottom-right corner of the
// screen (above the villager bar). Shows a simplified view of
// the entire 64x64 map with tile colors, unit dots, building
// dots, and the camera viewport outline.
// ============================================================

import type { GameState } from '../types/index.ts';
import type { GameCamera } from '../core/camera.ts';
import type { Animal } from '../systems/animal-system.ts';
import { isoToScreen, screenToIso } from '../core/math.ts';

// Minimap geometry (in logical 480x270 coords)
const MM_SIZE = 80;
const MM_MARGIN_RIGHT = 4;
const MM_MARGIN_BOTTOM = 28; // above the 24px villager bar
const MM_BORDER = 1;

// Tile color lookup
const TILE_COLORS: Record<string, string> = {
  grass1:       '#4a8c3f',
  grass2:       '#4e9043',
  grass3:       '#468838',
  grass4:       '#529446',
  dirt1:        '#8b7355',
  dirt2:        '#7d6648',
  sand1:        '#c2a960',
  water1:       '#2868a8',
  water2:       '#2464a0',
  forest:       '#2d6630',
  stoneDeposit: '#888888',
  goldDeposit:  '#c8a840',
  berryBush:    '#6a3060',
  deerHerd:     '#4a8c3f', // same as grass — deer blend in
};

const UNREVEALED_COLOR = '#1a1a1a';

/**
 * Convert a tile (col, row) to a pixel offset within the minimap.
 *
 * The isometric map occupies a diamond in world-space. We project tiles
 * into a bounding box and then normalise into the minimap square.
 *
 * For a 64x64 iso map:
 *   world X range: isoToScreen(63, 0).x .. isoToScreen(0, 63).x → +1008 .. -1008
 *   world Y range: isoToScreen(0, 0).y  .. isoToScreen(63, 63).y → 0 .. 1008
 */
export class Minimap {
  /**
   * Render the minimap on the UI context.
   */
  render(
    ctx: CanvasRenderingContext2D,
    state: GameState,
    camera: GameCamera,
    animals: Animal[],
    canvasWidth: number,
    canvasHeight: number,
  ): void {
    const { map } = state;
    const mmX = canvasWidth - MM_SIZE - MM_MARGIN_RIGHT;
    const mmY = canvasHeight - MM_SIZE - MM_MARGIN_BOTTOM;

    // Background panel
    ctx.fillStyle = 'rgba(20, 15, 10, 0.75)';
    ctx.fillRect(mmX - MM_BORDER, mmY - MM_BORDER, MM_SIZE + MM_BORDER * 2, MM_SIZE + MM_BORDER * 2);

    // Gold border
    ctx.strokeStyle = '#c8a840';
    ctx.lineWidth = 1;
    ctx.strokeRect(mmX - MM_BORDER, mmY - MM_BORDER, MM_SIZE + MM_BORDER * 2, MM_SIZE + MM_BORDER * 2);

    // Scale factor: each tile maps to MM_SIZE / mapWidth pixels
    const tileScale = MM_SIZE / map.width;

    // Draw tiles
    for (let r = 0; r < map.height; r++) {
      for (let c = 0; c < map.width; c++) {
        const tile = map.tiles[r][c];
        const px = mmX + c * tileScale;
        const py = mmY + r * tileScale;

        if (!tile.revealed) {
          ctx.fillStyle = UNREVEALED_COLOR;
        } else {
          ctx.fillStyle = TILE_COLORS[tile.type] ?? '#4a8c3f';
        }

        ctx.fillRect(px, py, Math.ceil(tileScale), Math.ceil(tileScale));
      }
    }

    // Draw buildings as colored dots
    for (const building of state.buildings) {
      const bx = mmX + building.tile.col * tileScale;
      const by = mmY + building.tile.row * tileScale;
      ctx.fillStyle = '#ffd040'; // gold for player buildings
      const dotSize = Math.max(2, tileScale * 1.5);
      ctx.fillRect(bx, by, dotSize, dotSize);
    }

    // Draw enemy camp marker
    if (state.enemyState) {
      const ec = state.enemyState.villageTile;
      const ex = mmX + ec.col * tileScale;
      const ey = mmY + ec.row * tileScale;
      ctx.fillStyle = '#e04040';
      const dotSize = Math.max(3, tileScale * 2);
      ctx.fillRect(ex - dotSize / 2, ey - dotSize / 2, dotSize, dotSize);
    }

    // Draw units
    for (const unit of state.units) {
      // Convert world position to tile position
      const iso = screenToIso(unit.pos.x, unit.pos.y);
      const ux = mmX + (iso.x / map.width) * MM_SIZE;
      const uy = mmY + (iso.y / map.height) * MM_SIZE;

      if (ux < mmX || ux > mmX + MM_SIZE || uy < mmY || uy > mmY + MM_SIZE) continue;

      ctx.fillStyle = unit.owner === 'player' ? '#4080ff' : '#e04040';
      ctx.fillRect(ux - 0.5, uy - 0.5, 1.5, 1.5);
    }

    // Draw animals as tiny brown dots
    for (const animal of animals) {
      if (!animal.alive) continue;
      const iso = screenToIso(animal.pos.x, animal.pos.y);
      const ax = mmX + (iso.x / map.width) * MM_SIZE;
      const ay = mmY + (iso.y / map.height) * MM_SIZE;

      if (ax < mmX || ax > mmX + MM_SIZE || ay < mmY || ay > mmY + MM_SIZE) continue;

      ctx.fillStyle = '#8b6530';
      ctx.fillRect(ax - 0.5, ay - 0.5, 1, 1);
    }

    // Draw camera viewport rectangle
    // Get the four corners of the visible screen in world space, then to tile space
    const topLeft = camera.screenToWorld(0, 0, canvasWidth, canvasHeight);
    const topRight = camera.screenToWorld(canvasWidth, 0, canvasWidth, canvasHeight);
    const bottomLeft = camera.screenToWorld(0, canvasHeight, canvasWidth, canvasHeight);
    const bottomRight = camera.screenToWorld(canvasWidth, canvasHeight, canvasWidth, canvasHeight);

    const tlIso = screenToIso(topLeft.x, topLeft.y);
    const trIso = screenToIso(topRight.x, topRight.y);
    const blIso = screenToIso(bottomLeft.x, bottomLeft.y);
    const brIso = screenToIso(bottomRight.x, bottomRight.y);

    // Find bounding box of the viewport in tile-space
    const minCol = Math.min(tlIso.x, trIso.x, blIso.x, brIso.x);
    const maxCol = Math.max(tlIso.x, trIso.x, blIso.x, brIso.x);
    const minRow = Math.min(tlIso.y, trIso.y, blIso.y, brIso.y);
    const maxRow = Math.max(tlIso.y, trIso.y, blIso.y, brIso.y);

    const vpX = mmX + (minCol / map.width) * MM_SIZE;
    const vpY = mmY + (minRow / map.height) * MM_SIZE;
    const vpW = ((maxCol - minCol) / map.width) * MM_SIZE;
    const vpH = ((maxRow - minRow) / map.height) * MM_SIZE;

    ctx.strokeStyle = '#ffffff';
    ctx.lineWidth = 0.75;
    ctx.strokeRect(
      Math.max(vpX, mmX),
      Math.max(vpY, mmY),
      Math.min(vpW, MM_SIZE),
      Math.min(vpH, MM_SIZE),
    );
  }

  /**
   * Handle a click on the minimap. If the click is within the minimap
   * bounds, move the camera to the corresponding map position.
   * Returns true if the click was consumed.
   */
  handleClick(
    mouseX: number,
    mouseY: number,
    camera: GameCamera,
    mapWidth: number,
    mapHeight: number,
    canvasWidth: number,
    canvasHeight: number,
  ): boolean {
    const mmX = canvasWidth - MM_SIZE - MM_MARGIN_RIGHT;
    const mmY = canvasHeight - MM_SIZE - MM_MARGIN_BOTTOM;

    // Check if click is within minimap bounds
    if (
      mouseX < mmX - MM_BORDER ||
      mouseX > mmX + MM_SIZE + MM_BORDER ||
      mouseY < mmY - MM_BORDER ||
      mouseY > mmY + MM_SIZE + MM_BORDER
    ) {
      return false;
    }

    // Convert click position to tile coordinates
    const tileCol = ((mouseX - mmX) / MM_SIZE) * mapWidth;
    const tileRow = ((mouseY - mmY) / MM_SIZE) * mapHeight;

    // Convert tile to world-space and move camera there
    const worldPos = isoToScreen(tileCol, tileRow);
    camera.targetX = worldPos.x;
    camera.targetY = worldPos.y;

    return true;
  }

  /**
   * Render the minimap inside a panel at a given position, filling the panel.
   */
  renderInPanel(
    ctx: CanvasRenderingContext2D,
    state: GameState,
    camera: GameCamera,
    animals: Animal[],
    panelX: number,
    panelY: number,
    panelW: number,
    panelH: number,
  ): void {
    const { map } = state;
    const PAD = 6;
    const mmSize = Math.min(panelW - PAD * 2, panelH - PAD * 2 - 14);
    const mmX = panelX + Math.floor((panelW - mmSize) / 2);
    const mmY = panelY + PAD + 12; // leave room for title

    // Title
    ctx.fillStyle = '#FFD040';
    ctx.font = 'bold 8px "Segoe UI", Arial, sans-serif';
    ctx.textBaseline = 'top';
    ctx.textAlign = 'center';
    ctx.fillText('Minimap', panelX + panelW / 2, panelY + PAD);
    ctx.textAlign = 'left';

    // Background panel
    ctx.fillStyle = 'rgba(20, 15, 10, 0.75)';
    ctx.fillRect(mmX - MM_BORDER, mmY - MM_BORDER, mmSize + MM_BORDER * 2, mmSize + MM_BORDER * 2);

    // Gold border
    ctx.strokeStyle = '#c8a840';
    ctx.lineWidth = 1;
    ctx.strokeRect(mmX - MM_BORDER, mmY - MM_BORDER, mmSize + MM_BORDER * 2, mmSize + MM_BORDER * 2);

    // Scale factor
    const tileScale = mmSize / map.width;

    // Draw tiles
    for (let r = 0; r < map.height; r++) {
      for (let c = 0; c < map.width; c++) {
        const tile = map.tiles[r][c];
        const px = mmX + c * tileScale;
        const py = mmY + r * tileScale;

        if (!tile.revealed) {
          ctx.fillStyle = UNREVEALED_COLOR;
        } else {
          ctx.fillStyle = TILE_COLORS[tile.type] ?? '#4a8c3f';
        }

        ctx.fillRect(px, py, Math.ceil(tileScale), Math.ceil(tileScale));
      }
    }

    // Draw buildings as colored dots
    for (const building of state.buildings) {
      const bx = mmX + building.tile.col * tileScale;
      const by = mmY + building.tile.row * tileScale;
      ctx.fillStyle = '#ffd040';
      const dotSize = Math.max(2, tileScale * 1.5);
      ctx.fillRect(bx, by, dotSize, dotSize);
    }

    // Draw enemy camp marker
    if (state.enemyState) {
      const ec = state.enemyState.villageTile;
      const ex = mmX + ec.col * tileScale;
      const ey = mmY + ec.row * tileScale;
      ctx.fillStyle = '#e04040';
      const dotSize = Math.max(3, tileScale * 2);
      ctx.fillRect(ex - dotSize / 2, ey - dotSize / 2, dotSize, dotSize);
    }

    // Draw units
    for (const unit of state.units) {
      const iso = screenToIso(unit.pos.x, unit.pos.y);
      const ux = mmX + (iso.x / map.width) * mmSize;
      const uy = mmY + (iso.y / map.height) * mmSize;

      if (ux < mmX || ux > mmX + mmSize || uy < mmY || uy > mmY + mmSize) continue;

      ctx.fillStyle = unit.owner === 'player' ? '#4080ff' : '#e04040';
      ctx.fillRect(ux - 0.5, uy - 0.5, 1.5, 1.5);
    }

    // Draw animals
    for (const animal of animals) {
      if (!animal.alive) continue;
      const iso = screenToIso(animal.pos.x, animal.pos.y);
      const ax = mmX + (iso.x / map.width) * mmSize;
      const ay = mmY + (iso.y / map.height) * mmSize;

      if (ax < mmX || ax > mmX + mmSize || ay < mmY || ay > mmY + mmSize) continue;

      ctx.fillStyle = '#8b6530';
      ctx.fillRect(ax - 0.5, ay - 0.5, 1, 1);
    }

    // Camera viewport outline is omitted in panel mode for simplicity
    void camera; // used for type compatibility
  }

  /**
   * Handle a click inside the minimap panel. Moves the camera to the clicked position.
   * Returns true if the click was consumed.
   */
  handleClickInPanel(
    mouseX: number,
    mouseY: number,
    camera: GameCamera,
    mapWidth: number,
    mapHeight: number,
    panelX: number,
    panelY: number,
    panelW: number,
    panelH: number,
  ): boolean {
    const PAD = 6;
    const mmSize = Math.min(panelW - PAD * 2, panelH - PAD * 2 - 14);
    const mmX = panelX + Math.floor((panelW - mmSize) / 2);
    const mmY = panelY + PAD + 12;

    // Check if click is within minimap area
    if (
      mouseX < mmX || mouseX > mmX + mmSize ||
      mouseY < mmY || mouseY > mmY + mmSize
    ) {
      return true; // still consume click in panel area
    }

    // Convert click position to tile coordinates
    const tileCol = ((mouseX - mmX) / mmSize) * mapWidth;
    const tileRow = ((mouseY - mmY) / mmSize) * mapHeight;

    // Convert tile to world-space and move camera there
    const worldPos = isoToScreen(tileCol, tileRow);
    camera.targetX = worldPos.x;
    camera.targetY = worldPos.y;

    return true;
  }
}
