/**
 * Hexagonal grid math, generation, adjacency, and path validation.
 * Uses offset coordinates with pointy-top hexagons.
 * Odd rows are shifted right by half a hex width.
 */

import { HexCoord, HexCell } from './types';

/** Hex radius (center to vertex) */
export const HEX_SIZE = 35;
/** Hex width (flat side to flat side for pointy-top) */
export const HEX_W = HEX_SIZE * Math.sqrt(3);
/** Hex height (vertex to vertex for pointy-top) */
export const HEX_H = HEX_SIZE * 2;

/**
 * Calculate the pixel center of a hex cell given its row/col in offset coords.
 */
export function hexToPixel(row: number, col: number, offsetX: number, offsetY: number): { x: number; y: number } {
  const x = col * HEX_W + (row % 2 !== 0 ? HEX_W / 2 : 0) + offsetX;
  const y = row * HEX_H * 0.75 + offsetY;
  return { x, y };
}

/**
 * Get the 6 vertices of a pointy-top hexagon centered at (cx, cy).
 */
export function hexVertices(cx: number, cy: number, size: number = HEX_SIZE): { x: number; y: number }[] {
  const verts: { x: number; y: number }[] = [];
  for (let i = 0; i < 6; i++) {
    const angle = Math.PI / 180 * (60 * i - 30);
    verts.push({
      x: cx + size * Math.cos(angle),
      y: cy + size * Math.sin(angle),
    });
  }
  return verts;
}

/**
 * Check if a point is inside a pointy-top hexagon.
 */
export function pointInHex(px: number, py: number, cx: number, cy: number, size: number = HEX_SIZE): boolean {
  const dx = Math.abs(px - cx);
  const dy = Math.abs(py - cy);
  // Quick bounding box check
  if (dx > size || dy > size) return false;
  // Hex boundary check for pointy-top
  const w = size * Math.sqrt(3) / 2;
  if (dx > w) return false;
  if (dy > size) return false;
  // Check the slanted edges
  if (dy <= size / 2) return true;
  return (dy - size / 2) <= (size - dx / Math.sqrt(3) * 2) * 0.5;
}

/**
 * More precise point-in-hex using the actual polygon.
 */
export function pointInHexPrecise(px: number, py: number, cx: number, cy: number, size: number = HEX_SIZE): boolean {
  const verts = hexVertices(cx, cy, size);
  let inside = false;
  for (let i = 0, j = verts.length - 1; i < verts.length; j = i++) {
    const xi = verts[i].x, yi = verts[i].y;
    const xj = verts[j].x, yj = verts[j].y;
    const intersect = ((yi > py) !== (yj > py)) &&
      (px < (xj - xi) * (py - yi) / (yj - yi) + xi);
    if (intersect) inside = !inside;
  }
  return inside;
}

/**
 * Get all 6 neighbors of a hex in offset coordinates.
 * For pointy-top hexagons with odd-row offset.
 */
export function getNeighbors(row: number, col: number): HexCoord[] {
  const isOdd = row % 2 !== 0;
  if (isOdd) {
    return [
      { row: row - 1, col: col },     // top-left
      { row: row - 1, col: col + 1 }, // top-right
      { row: row, col: col - 1 },     // left
      { row: row, col: col + 1 },     // right
      { row: row + 1, col: col },     // bottom-left
      { row: row + 1, col: col + 1 }, // bottom-right
    ];
  } else {
    return [
      { row: row - 1, col: col - 1 }, // top-left
      { row: row - 1, col: col },     // top-right
      { row: row, col: col - 1 },     // left
      { row: row, col: col + 1 },     // right
      { row: row + 1, col: col - 1 }, // bottom-left
      { row: row + 1, col: col },     // bottom-right
    ];
  }
}

/**
 * Check if two hex cells are adjacent.
 */
export function areAdjacent(a: HexCoord, b: HexCoord): boolean {
  const neighbors = getNeighbors(a.row, a.col);
  return neighbors.some(n => n.row === b.row && n.col === b.col);
}

/**
 * Check if a path of hex coords forms a valid chain (each step is adjacent).
 */
export function isValidPath(path: HexCoord[]): boolean {
  for (let i = 1; i < path.length; i++) {
    if (!areAdjacent(path[i - 1], path[i])) return false;
  }
  return true;
}

/**
 * Build the hex grid cells array with pixel positions.
 */
export function buildGrid(
  rows: number,
  cols: number,
  letters: string[][],
  offsetX: number,
  offsetY: number
): HexCell[] {
  const cells: HexCell[] = [];
  for (let r = 0; r < rows; r++) {
    for (let c = 0; c < cols; c++) {
      const pos = hexToPixel(r, c, offsetX, offsetY);
      cells.push({
        row: r,
        col: c,
        letter: letters[r][c],
        cx: pos.x,
        cy: pos.y,
        found: false,
        foundWordIdx: -1,
        shakeX: 0,
        shakeY: 0,
        glow: 0,
        selectPulse: 0,
      });
    }
  }
  return cells;
}

/**
 * Find a hex cell at given pixel coordinates.
 */
export function findCellAtPoint(cells: HexCell[], px: number, py: number): HexCell | null {
  for (const cell of cells) {
    if (pointInHexPrecise(px, py, cell.cx, cell.cy, HEX_SIZE)) {
      return cell;
    }
  }
  return null;
}

/**
 * Get a cell by row/col from the cells array.
 */
export function getCellAt(cells: HexCell[], row: number, col: number): HexCell | undefined {
  return cells.find(c => c.row === row && c.col === col);
}

/**
 * Calculate grid offset to center it on canvas.
 */
export function calculateGridOffset(
  rows: number,
  cols: number,
  canvasW: number,
  canvasH: number,
  panelWidth: number
): { offsetX: number; offsetY: number } {
  // Available area (left side, leaving right for word panel)
  const areaW = canvasW - panelWidth;

  // Grid dimensions in pixels
  const gridW = cols * HEX_W + HEX_W / 2; // extra for odd row offset
  const gridH = (rows - 1) * HEX_H * 0.75 + HEX_H;

  const offsetX = (areaW - gridW) / 2 + HEX_W / 2;
  const offsetY = (canvasH - gridH) / 2 + HEX_SIZE;

  return { offsetX, offsetY };
}

/** Italian letter frequency-weighted random letter */
export function randomItalianLetter(): string {
  // Weighted by Italian frequency
  const letters = 'AAAAAABBCCCDDDDEEEEEEFFFGGGHIIIIILLLMMMNNNNNOOOOOOPPQRRRRSSSSSTTTTTUUUVZ';
  return letters[Math.floor(Math.random() * letters.length)];
}
