import {
  Direction, BeamColor, Piece, PieceType, Rotation,
  LightSource, Target, BeamSegment, ColorAccumulator,
} from './types';

const MAX_STEPS = 100;

interface TraceState {
  grid: (Piece | null)[][];
  fixedGrid: (Piece | null)[][];
  gridCols: number;
  gridRows: number;
  targets: Target[];
}

/** Get the piece at a grid cell (player-placed or fixed) */
function getPieceAt(state: TraceState, col: number, row: number): Piece | null {
  if (row < 0 || row >= state.gridRows || col < 0 || col >= state.gridCols) return null;
  return state.grid[row][col] ?? state.fixedGrid[row][col] ?? null;
}

/** Move one step in a direction */
function step(col: number, row: number, dir: Direction): [number, number] {
  switch (dir) {
    case Direction.UP: return [col, row - 1];
    case Direction.DOWN: return [col, row + 1];
    case Direction.LEFT: return [col - 1, row];
    case Direction.RIGHT: return [col + 1, row];
  }
}

/** Check if a beam color has any visible component */
function isVisible(color: BeamColor): boolean {
  return color.r > 0 || color.g > 0 || color.b > 0;
}

/**
 * Mirror reflection.
 * Mirror at rotation 0 or 180: reflects like \  (RIGHT->DOWN, UP->LEFT, LEFT->UP, DOWN->RIGHT)
 * Mirror at rotation 90 or 270: reflects like /  (RIGHT->UP, DOWN->LEFT, LEFT->DOWN, UP->RIGHT)
 */
function reflectMirror(dir: Direction, rotation: Rotation): Direction | null {
  const isBackslash = rotation === 0 || rotation === 180;

  if (isBackslash) {
    // \ mirror
    switch (dir) {
      case Direction.RIGHT: return Direction.DOWN;
      case Direction.LEFT: return Direction.UP;
      case Direction.DOWN: return Direction.RIGHT;
      case Direction.UP: return Direction.LEFT;
    }
  } else {
    // / mirror
    switch (dir) {
      case Direction.RIGHT: return Direction.UP;
      case Direction.LEFT: return Direction.DOWN;
      case Direction.UP: return Direction.RIGHT;
      case Direction.DOWN: return Direction.LEFT;
    }
  }
}

/**
 * Prism splitting.
 * A prism takes incoming white (or multi-component) light and splits it.
 * The straight-through component and the two deflected components depend on rotation.
 *
 * Rotation 0: input from LEFT
 *   - Red goes UP
 *   - Green goes RIGHT (straight through)
 *   - Blue goes DOWN
 *
 * For other rotations/input directions, we rotate accordingly.
 * If the input is not from the "base" direction, the prism acts as a pass-through.
 *
 * We return an array of [direction, color] pairs.
 */
function prismSplit(dir: Direction, color: BeamColor, rotation: Rotation): Array<[Direction, BeamColor]> {
  // Determine the "entry" direction relative to the prism's orientation
  // Rotation 0: expects beam from LEFT, rotation 90: from UP, 180: from RIGHT, 270: from DOWN
  const entryMap: Record<number, Direction> = {
    0: Direction.LEFT,
    90: Direction.UP,
    180: Direction.RIGHT,
    270: Direction.DOWN,
  };

  // The opposite direction is where the beam comes FROM
  const oppositeDir: Record<string, Direction> = {
    [Direction.RIGHT]: Direction.LEFT,
    [Direction.LEFT]: Direction.RIGHT,
    [Direction.UP]: Direction.DOWN,
    [Direction.DOWN]: Direction.UP,
  };

  const beamFrom = oppositeDir[dir]; // where beam comes from
  const expectedFrom = entryMap[rotation];

  if (beamFrom !== expectedFrom) {
    // Beam doesn't enter from the base - just pass through
    return [[dir, color]];
  }

  // Determine split directions based on rotation
  // rotation 0: straight=RIGHT, cw=DOWN, ccw=UP
  // rotation 90: straight=DOWN, cw=LEFT, ccw=RIGHT
  // rotation 180: straight=LEFT, cw=UP, ccw=DOWN
  // rotation 270: straight=UP, cw=RIGHT, ccw=LEFT

  type DirTriple = [Direction, Direction, Direction]; // [straight, cw, ccw]
  const splitDirs: Record<number, DirTriple> = {
    0: [Direction.RIGHT, Direction.DOWN, Direction.UP],
    90: [Direction.DOWN, Direction.LEFT, Direction.RIGHT],
    180: [Direction.LEFT, Direction.UP, Direction.DOWN],
    270: [Direction.UP, Direction.RIGHT, Direction.LEFT],
  };

  const [straight, cw, ccw] = splitDirs[rotation];
  const results: Array<[Direction, BeamColor]> = [];

  // Split: green goes straight, red goes ccw (up for rot 0), blue goes cw (down for rot 0)
  if (color.g > 0) {
    results.push([straight, { r: 0, g: color.g, b: 0 }]);
  }
  if (color.r > 0) {
    results.push([ccw, { r: color.r, g: 0, b: 0 }]);
  }
  if (color.b > 0) {
    results.push([cw, { r: 0, g: 0, b: color.b }]);
  }

  return results.length > 0 ? results : [[dir, color]];
}

/**
 * Filter a beam through a color filter.
 * Only the matching color component passes through.
 */
function filterBeam(color: BeamColor, filterType: PieceType): BeamColor {
  switch (filterType) {
    case PieceType.FILTER_RED:
      return { r: color.r, g: 0, b: 0 };
    case PieceType.FILTER_GREEN:
      return { r: 0, g: color.g, b: 0 };
    case PieceType.FILTER_BLUE:
      return { r: 0, g: 0, b: color.b };
    default:
      return color;
  }
}

/** Trace a single beam ray from a starting point, accumulating segments */
function traceRay(
  startCol: number,
  startRow: number,
  dir: Direction,
  color: BeamColor,
  state: TraceState,
  segments: BeamSegment[],
  visited: Set<string>,
  depth: number,
): void {
  if (depth > MAX_STEPS || !isVisible(color)) return;

  let col = startCol;
  let row = startRow;
  let currentDir = dir;
  let currentColor = { ...color };

  for (let i = 0; i < MAX_STEPS; i++) {
    const [nextCol, nextRow] = step(col, row, currentDir);

    // Out of bounds
    if (nextCol < 0 || nextCol >= state.gridCols || nextRow < 0 || nextRow >= state.gridRows) {
      // Add segment going to edge
      segments.push({
        fromCol: col, fromRow: row,
        toCol: nextCol, toRow: nextRow,
        color: { ...currentColor },
        progress: 0,
      });
      break;
    }

    // Check for visited to prevent infinite loops
    const visitKey = `${nextCol},${nextRow},${currentDir},${currentColor.r}${currentColor.g}${currentColor.b}`;
    if (visited.has(visitKey)) break;
    visited.add(visitKey);

    // Add segment
    segments.push({
      fromCol: col, fromRow: row,
      toCol: nextCol, toRow: nextRow,
      color: { ...currentColor },
      progress: 0,
    });

    // Check what's at the next cell
    const piece = getPieceAt(state, nextCol, nextRow);

    if (!piece) {
      // Check if there's a target here
      const target = state.targets.find(t => t.col === nextCol && t.row === nextRow);
      if (target) {
        // Beam reaches target - don't continue past it
        // Color accumulation happens in the main trace function
        col = nextCol;
        row = nextRow;
        continue;
      }
      // Empty cell - continue
      col = nextCol;
      row = nextRow;
      continue;
    }

    // Piece interaction
    switch (piece.type) {
      case PieceType.MIRROR: {
        const newDir = reflectMirror(currentDir, piece.rotation);
        if (newDir) {
          col = nextCol;
          row = nextRow;
          currentDir = newDir;
        } else {
          // Beam absorbed
          return;
        }
        break;
      }

      case PieceType.PRISM: {
        const outputs = prismSplit(currentDir, currentColor, piece.rotation);
        if (outputs.length === 1 && outputs[0][0] === currentDir) {
          // Pass-through
          col = nextCol;
          row = nextRow;
          currentColor = outputs[0][1];
        } else {
          // Split into multiple beams - trace each recursively
          for (const [outDir, outColor] of outputs) {
            traceRay(nextCol, nextRow, outDir, outColor, state, segments, visited, depth + 1);
          }
          return;
        }
        break;
      }

      case PieceType.FILTER_RED:
      case PieceType.FILTER_GREEN:
      case PieceType.FILTER_BLUE: {
        const filtered = filterBeam(currentColor, piece.type);
        if (!isVisible(filtered)) return; // Beam fully blocked
        col = nextCol;
        row = nextRow;
        currentColor = filtered;
        break;
      }
    }
  }
}

/** Main beam tracing function - traces all beams from all sources */
export function traceAllBeams(
  sources: LightSource[],
  grid: (Piece | null)[][],
  fixedGrid: (Piece | null)[][],
  gridCols: number,
  gridRows: number,
  targets: Target[],
): BeamSegment[] {
  const segments: BeamSegment[] = [];
  const state: TraceState = { grid, fixedGrid, gridCols, gridRows, targets };

  // Reset targets
  for (const target of targets) {
    target.receivedColor = null;
    target.activated = false;
  }

  // Trace each source
  for (const source of sources) {
    const visited = new Set<string>();
    traceRay(source.col, source.row, source.direction, source.color, state, segments, visited, 0);
  }

  // Accumulate colors on targets
  const targetColors = new Map<string, ColorAccumulator>();
  for (const target of targets) {
    targetColors.set(`${target.col},${target.row}`, { r: 0, g: 0, b: 0 });
  }

  // Check which beams reach which targets
  for (const seg of segments) {
    const key = `${seg.toCol},${seg.toRow}`;
    const acc = targetColors.get(key);
    if (acc) {
      acc.r = Math.min(1, acc.r + seg.color.r);
      acc.g = Math.min(1, acc.g + seg.color.g);
      acc.b = Math.min(1, acc.b + seg.color.b);
    }
    // Also check fromCol,fromRow passing through a target
    const keyFrom = `${seg.fromCol},${seg.fromRow}`;
    const accFrom = targetColors.get(keyFrom);
    if (accFrom && keyFrom !== key) {
      // Beam passes through this target's cell
    }
  }

  // Also check segments that end at a target or pass through
  // We need to check all segments whose path crosses a target cell
  for (const seg of segments) {
    // Check the "to" cell for target
    for (const target of targets) {
      if (seg.toCol === target.col && seg.toRow === target.row) {
        const acc = targetColors.get(`${target.col},${target.row}`)!;
        // Already accumulated above
      }
    }
  }

  // Set target received colors and check activation
  for (const target of targets) {
    const acc = targetColors.get(`${target.col},${target.row}`)!;
    if (acc.r > 0 || acc.g > 0 || acc.b > 0) {
      target.receivedColor = { r: acc.r, g: acc.g, b: acc.b };
      target.activated =
        target.receivedColor.r === target.requiredColor.r &&
        target.receivedColor.g === target.requiredColor.g &&
        target.receivedColor.b === target.requiredColor.b;
    }
  }

  return segments;
}
