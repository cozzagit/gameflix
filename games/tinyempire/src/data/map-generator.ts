// ============================================================
// TinyEmpire — Procedural Map Generator
// ============================================================

import type { TileType, GameMap, MapTile } from '../types/index.ts';

// ── Seeded PRNG ─────────────────────────────────────────────
// Simple mulberry32 — fast, good distribution, fully deterministic.
function seededRandom(seed: number): { next: () => number } {
  let s = seed >>> 0;
  return {
    next(): number {
      s += 0x6d2b79f5;
      let t = s;
      t = Math.imul(t ^ (t >>> 15), t | 1);
      t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
      return ((t ^ (t >>> 14)) >>> 0) / 0x100000000;
    },
  };
}

type Rng = ReturnType<typeof seededRandom>;

// ── Helpers ─────────────────────────────────────────────────

function randInt(rng: Rng, min: number, max: number): number {
  return Math.floor(rng.next() * (max - min + 1)) + min;
}

function randChoice<T>(rng: Rng, arr: T[]): T {
  return arr[Math.floor(rng.next() * arr.length)];
}

const GRASS_VARIANTS: TileType[] = ['grass1', 'grass2', 'grass3', 'grass4'];
const DIRT_VARIANTS: TileType[] = ['dirt1', 'dirt2'];

function makeTile(type: TileType, resourceAmount = 0): MapTile {
  return { type, revealed: false, resourceAmount };
}

// Clamp to valid tile coordinates
function inBounds(col: number, row: number, w: number, h: number): boolean {
  return col >= 0 && col < w && row >= 0 && row < h;
}

// Euclidean distance to center
function distToCenter(col: number, row: number, cx: number, cy: number): number {
  const dx = col - cx;
  const dy = row - cy;
  return Math.sqrt(dx * dx + dy * dy);
}

// ── Cluster Placement ────────────────────────────────────────

interface PlacementOptions {
  tiles: MapTile[][];
  rng: Rng;
  width: number;
  height: number;
  centerCol: number;
  centerRow: number;
  minDist: number;  // minimum distance from center
  maxDist: number;  // maximum distance from center (use width/2 for whole map)
  padding: number;  // margin from map edge
}

function pickClusterOrigin(opts: PlacementOptions): { col: number; row: number } {
  const { rng, width, height, centerCol, centerRow, minDist, maxDist, padding } = opts;
  let col: number;
  let row: number;
  let attempts = 0;
  do {
    col = randInt(rng, padding, width - 1 - padding);
    row = randInt(rng, padding, height - 1 - padding);
    const d = distToCenter(col, row, centerCol, centerRow);
    if (d >= minDist && d <= maxDist) break;
    attempts++;
  } while (attempts < 200);
  return { col, row };
}

// Flood-expand a cluster of `count` connected tiles using random walk
function placeCluster(
  tiles: MapTile[][],
  startCol: number,
  startRow: number,
  count: number,
  tileType: TileType,
  resourceAmount: number,
  rng: Rng,
  width: number,
  height: number,
  protectedRadius: number,
  centerCol: number,
  centerRow: number,
): void {
  const frontier: Array<[number, number]> = [[startCol, startRow]];
  let placed = 0;
  const visited = new Set<string>();

  while (frontier.length > 0 && placed < count) {
    const idx = randInt(rng, 0, frontier.length - 1);
    const [c, r] = frontier.splice(idx, 1)[0];
    const key = `${c},${r}`;
    if (visited.has(key)) continue;
    visited.add(key);

    if (!inBounds(c, r, width, height)) continue;
    if (distToCenter(c, r, centerCol, centerRow) < protectedRadius) continue;

    tiles[r][c] = makeTile(tileType, resourceAmount);
    placed++;

    const neighbours: Array<[number, number]> = [
      [c + 1, r], [c - 1, r], [c, r + 1], [c, r - 1],
    ];
    for (const n of neighbours) {
      const nKey = `${n[0]},${n[1]}`;
      if (!visited.has(nKey)) frontier.push(n);
    }
  }
}

// ── River / Lake Generator ───────────────────────────────────

function placeWaterFeature(
  tiles: MapTile[][],
  rng: Rng,
  width: number,
  height: number,
  centerCol: number,
  centerRow: number,
  length: number,
): void {
  // Pick a starting point on or near an edge
  const edge = randInt(rng, 0, 3); // 0=top, 1=right, 2=bottom, 3=left
  let col: number;
  let row: number;

  switch (edge) {
    case 0: col = randInt(rng, 5, width - 6);  row = randInt(rng, 2, 8); break;
    case 1: col = randInt(rng, width - 8, width - 3); row = randInt(rng, 5, height - 6); break;
    case 2: col = randInt(rng, 5, width - 6);  row = randInt(rng, height - 8, height - 3); break;
    default: col = randInt(rng, 2, 8); row = randInt(rng, 5, height - 6); break;
  }

  // Random walk toward interior, biased away from center
  let placed = 0;
  const WATER_VARIANT: TileType = rng.next() > 0.5 ? 'water1' : 'water2';

  while (placed < length) {
    if (!inBounds(col, row, width, height)) break;
    if (distToCenter(col, row, centerCol, centerRow) < 8) break;

    tiles[row][col] = makeTile(WATER_VARIANT, 0);
    placed++;

    // Also widen the river by painting adjacent tiles occasionally
    if (rng.next() < 0.4) {
      const dc = rng.next() < 0.5 ? 1 : -1;
      const nr = row + (rng.next() < 0.5 ? 1 : -1);
      const nc = col + dc;
      if (inBounds(nc, nr, width, height) && distToCenter(nc, nr, centerCol, centerRow) > 8) {
        tiles[nr][nc] = makeTile(WATER_VARIANT, 0);
      }
    }

    // Step: bias toward center-ish interior, random walk
    const dx = centerCol - col;
    const dy = centerRow - row;
    const moveHoriz = rng.next() < 0.5;
    if (moveHoriz) {
      col += rng.next() < 0.6 ? Math.sign(dx) : (rng.next() < 0.5 ? 1 : -1);
    } else {
      row += rng.next() < 0.6 ? Math.sign(dy) : (rng.next() < 0.5 ? 1 : -1);
    }
  }
}

// ── Main Generator ───────────────────────────────────────────

export function generateMap(
  width = 64,
  height = 64,
  seed = Date.now(),
): GameMap {
  const rng = seededRandom(seed);
  const centerCol = Math.floor(width / 2);
  const centerRow = Math.floor(height / 2);

  // ── Step 1: Fill with grass ──────────────────────────────
  const tiles: MapTile[][] = [];
  for (let r = 0; r < height; r++) {
    tiles[r] = [];
    for (let c = 0; c < width; c++) {
      tiles[r][c] = makeTile(randChoice(rng, GRASS_VARIANTS), 0);
    }
  }

  // ── Step 2: Forest clusters (near center: reduced, far: normal) ──
  const forestCount = randInt(rng, 8, 12);
  for (let i = 0; i < forestCount; i++) {
    const { col, row } = pickClusterOrigin({
      tiles, rng, width, height,
      centerCol, centerRow,
      minDist: 10,
      maxDist: Math.min(width, height) / 2 - 2,
      padding: 2,
    });
    const dist = distToCenter(col, row, centerCol, centerRow);
    const forestAmount = dist < 15 ? 350 : 800;
    const clusterSize = randInt(rng, 5, 15);
    placeCluster(tiles, col, row, clusterSize, 'forest', forestAmount, rng, width, height, 9, centerCol, centerRow);
  }

  // ── Step 2b: Rich forest clusters (far from center) ────────
  const richForestCount = randInt(rng, 3, 4);
  for (let i = 0; i < richForestCount; i++) {
    const { col, row } = pickClusterOrigin({
      tiles, rng, width, height,
      centerCol, centerRow,
      minDist: 25,
      maxDist: Math.min(width, height) / 2 - 2,
      padding: 2,
    });
    const clusterSize = randInt(rng, 8, 18);
    placeCluster(tiles, col, row, clusterSize, 'forest', 1500, rng, width, height, 24, centerCol, centerRow);
  }

  // ── Step 3: Water features ───────────────────────────────
  const waterFeatures = randInt(rng, 1, 2);
  for (let i = 0; i < waterFeatures; i++) {
    const length = randInt(rng, 15, 30);
    placeWaterFeature(tiles, rng, width, height, centerCol, centerRow, length);
  }

  // ── Step 4: Stone deposits ───────────────────────────────
  // Prefer edge areas — minDist 20 from center
  const stoneClusters = randInt(rng, 4, 6);
  for (let i = 0; i < stoneClusters; i++) {
    const { col, row } = pickClusterOrigin({
      tiles, rng, width, height,
      centerCol, centerRow,
      minDist: 18,
      maxDist: Math.min(width, height) / 2 - 2,
      padding: 3,
    });
    const clusterSize = randInt(rng, 3, 5);
    placeCluster(tiles, col, row, clusterSize, 'stoneDeposit', 800, rng, width, height, 17, centerCol, centerRow);
  }

  // ── Step 4b: Rich stone clusters (far from center) ─────────
  const richStoneClusters = randInt(rng, 2, 3);
  for (let i = 0; i < richStoneClusters; i++) {
    const { col, row } = pickClusterOrigin({
      tiles, rng, width, height,
      centerCol, centerRow,
      minDist: 28,
      maxDist: Math.min(width, height) / 2 - 2,
      padding: 3,
    });
    const clusterSize = randInt(rng, 3, 5);
    placeCluster(tiles, col, row, clusterSize, 'stoneDeposit', 3000, rng, width, height, 27, centerCol, centerRow);
  }

  // ── Step 5: Gold deposits ────────────────────────────────
  // Farther from center than stone
  const goldClusters = randInt(rng, 2, 3);
  for (let i = 0; i < goldClusters; i++) {
    const { col, row } = pickClusterOrigin({
      tiles, rng, width, height,
      centerCol, centerRow,
      minDist: 22,
      maxDist: Math.min(width, height) / 2 - 2,
      padding: 3,
    });
    const clusterSize = randInt(rng, 2, 3);
    placeCluster(tiles, col, row, clusterSize, 'goldDeposit', 400, rng, width, height, 21, centerCol, centerRow);
  }

  // ── Step 5b: Rich gold clusters (far from center) ──────────
  const richGoldClusters = randInt(rng, 1, 2);
  for (let i = 0; i < richGoldClusters; i++) {
    const { col, row } = pickClusterOrigin({
      tiles, rng, width, height,
      centerCol, centerRow,
      minDist: 30,
      maxDist: Math.min(width, height) / 2 - 2,
      padding: 3,
    });
    const clusterSize = randInt(rng, 2, 3);
    placeCluster(tiles, col, row, clusterSize, 'goldDeposit', 2000, rng, width, height, 29, centerCol, centerRow);
  }

  // ── Step 6: Berry bushes near center ────────────────────
  const berryCount = randInt(rng, 4, 6);
  for (let i = 0; i < berryCount; i++) {
    const { col, row } = pickClusterOrigin({
      tiles, rng, width, height,
      centerCol, centerRow,
      minDist: 6,
      maxDist: 14,
      padding: 1,
    });
    if (inBounds(col, row, width, height)) {
      tiles[row][col] = makeTile('berryBush', 150);
    }
  }

  // ── Step 6b: Deer herds (food source, closer than berries) ──
  const deerCount = randInt(rng, 3, 5);
  for (let i = 0; i < deerCount; i++) {
    const { col, row } = pickClusterOrigin({
      tiles, rng, width, height,
      centerCol, centerRow,
      minDist: 8,
      maxDist: 18,
      padding: 2,
    });
    if (inBounds(col, row, width, height)) {
      // Only place on grass tiles
      const t = tiles[row][col].type;
      if (t.startsWith('grass') || t.startsWith('dirt')) {
        tiles[row][col] = makeTile('deerHerd', 200);
      }
    }
  }

  // ── Step 7: Dirt patches near center ────────────────────
  const dirtPatches = randInt(rng, 3, 6);
  for (let i = 0; i < dirtPatches; i++) {
    const { col, row } = pickClusterOrigin({
      tiles, rng, width, height,
      centerCol, centerRow,
      minDist: 3,
      maxDist: 12,
      padding: 1,
    });
    const patchSize = randInt(rng, 2, 5);
    // Use protected radius 0 so dirt can be close to center
    for (let p = 0; p < patchSize; p++) {
      const dc = randInt(rng, -1, 1);
      const dr = randInt(rng, -1, 1);
      const c = col + dc;
      const r = row + dr;
      if (inBounds(c, r, width, height) && distToCenter(c, r, centerCol, centerRow) > 3) {
        tiles[r][c] = makeTile(randChoice(rng, DIRT_VARIANTS), 0);
      }
    }
  }

  // ── Step 8: Clear center for town ───────────────────────
  // 5×5 clear zone guaranteed to be open grass
  const CLEAR_RADIUS = 4;
  for (let dr = -CLEAR_RADIUS; dr <= CLEAR_RADIUS; dr++) {
    for (let dc = -CLEAR_RADIUS; dc <= CLEAR_RADIUS; dc++) {
      const c = centerCol + dc;
      const r = centerRow + dr;
      if (inBounds(c, r, width, height)) {
        // Only overwrite non-grass tiles
        const t = tiles[r][c].type;
        if (t !== 'grass1' && t !== 'grass2' && t !== 'grass3' && t !== 'grass4') {
          tiles[r][c] = makeTile(randChoice(rng, GRASS_VARIANTS), 0);
        }
      }
    }
  }

  // ── Step 9: Reveal tiles near center ────────────────────
  const REVEAL_RADIUS = 10;
  for (let r = 0; r < height; r++) {
    for (let c = 0; c < width; c++) {
      if (distToCenter(c, r, centerCol, centerRow) <= REVEAL_RADIUS) {
        tiles[r][c].revealed = true;
      }
    }
  }

  return { width, height, tiles };
}
