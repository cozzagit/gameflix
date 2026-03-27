// ============================================================
// Level 3 — I Tubi (The Pipes)
// 5x5 grid of rotatable pipe segments. Connect source to drain.
// ============================================================

import { MechanismLevel, C, GAME_W, GAME_H } from '../types';
import {
  drawBackground, drawMetalPanel, drawFrame, drawHUD,
  drawBrushedMetal, drawRivet, drawCornerRivets,
  roundRect, lighten, darken
} from '../renderer';
import { EffectsEngine } from '../effects';
import { playPipeClick, playSuccess, playFluidFlow, playHeavyClunk } from '../audio';

const GRID = 5;
const CELL = 80;
const GRID_X = GAME_W / 2 - (GRID * CELL) / 2;
const GRID_Y = GAME_H / 2 - (GRID * CELL) / 2 + 30;

// Pipe types: each has openings [top, right, bottom, left]
// 0=straight(vert), 1=straight(horiz), 2=corner, 3=T-junction, 4=cross
enum PipeType {
  STRAIGHT = 0,
  CORNER = 1,
  T_JUNCTION = 2,
  CROSS = 3,
}

interface PipeCell {
  type: PipeType;
  rotation: number; // 0,1,2,3 = 0,90,180,270 degrees
  animRotation: number; // smooth animated rotation in radians
  connected: boolean;
}

// Each pipe type defines which sides are open at rotation=0
// sides: [top, right, bottom, left]
const PIPE_OPENINGS: Record<PipeType, boolean[]> = {
  [PipeType.STRAIGHT]: [true, false, true, false],    // vertical
  [PipeType.CORNER]: [true, true, false, false],       // top-right
  [PipeType.T_JUNCTION]: [true, true, false, true],    // T open top,right,left
  [PipeType.CROSS]: [true, true, true, true],          // all open
};

function getOpenings(cell: PipeCell): boolean[] {
  const base = [...PIPE_OPENINGS[cell.type]];
  const result = [false, false, false, false];
  for (let i = 0; i < 4; i++) {
    result[(i + cell.rotation) % 4] = base[i];
  }
  return result;
}

export class Level3Pipes implements MechanismLevel {
  id = 3;
  name = 'I Tubi';
  subtitle = 'Collega la sorgente allo scarico';
  moves = 0;
  elapsed = 0;
  solved = false;

  private grid: PipeCell[][] = [];
  private effects = new EffectsEngine();
  private solveAnim = 0;
  private flowAnim = 0;
  private connectedCells: Set<string> = new Set();

  init(): void {
    this.moves = 0;
    this.elapsed = 0;
    this.solved = false;
    this.solveAnim = 0;
    this.flowAnim = 0;
    this.effects.clear();
    this.connectedCells = new Set();

    // Generate a solvable puzzle by creating a path then scrambling rotations
    this.grid = [];
    for (let r = 0; r < GRID; r++) {
      this.grid[r] = [];
      for (let c = 0; c < GRID; c++) {
        this.grid[r][c] = {
          type: PipeType.STRAIGHT,
          rotation: 0,
          animRotation: 0,
          connected: false,
        };
      }
    }

    // Build a solution path from left (row 2) to right (row 2)
    // Path: (2,0) -> (2,1) -> (1,1) -> (1,2) -> (1,3) -> (2,3) -> (2,4)
    // Plus some extra pipes for complexity
    const solutionPath: [number, number][] = [
      [2, 0], [2, 1], [1, 1], [1, 2], [1, 3], [2, 3], [2, 4]
    ];

    // Set pipe types and correct rotations based on connections
    for (let i = 0; i < solutionPath.length; i++) {
      const [r, c] = solutionPath[i];
      const prev = i > 0 ? solutionPath[i - 1] : null;
      const next = i < solutionPath.length - 1 ? solutionPath[i + 1] : null;

      const needTop = (prev && prev[0] === r - 1 && prev[1] === c) || (next && next[0] === r - 1 && next[1] === c);
      const needRight = (prev && prev[0] === r && prev[1] === c + 1) || (next && next[0] === r && next[1] === c + 1);
      const needBottom = (prev && prev[0] === r + 1 && prev[1] === c) || (next && next[0] === r + 1 && next[1] === c);
      const needLeft = (prev && prev[0] === r && prev[1] === c - 1) || (next && next[0] === r && next[1] === c - 1);

      // Source/drain need side connections
      const openings = [!!needTop, !!needRight, !!needBottom, !!needLeft];
      // Special: source (leftmost) needs left opening, drain (rightmost) needs right
      if (i === 0) openings[3] = true;
      if (i === solutionPath.length - 1) openings[1] = true;

      const count = openings.filter(o => o).length;
      let type: PipeType;
      let rot = 0;

      if (count === 4) {
        type = PipeType.CROSS;
        rot = 0;
      } else if (count === 3) {
        type = PipeType.T_JUNCTION;
        // Find which side is closed
        const closedIdx = openings.indexOf(false);
        // T_JUNCTION at rot=0 has bottom closed → closedIdx=2 at rot=0
        rot = (closedIdx - 2 + 4) % 4;
      } else if (count === 2) {
        // Check if straight or corner
        if ((openings[0] && openings[2]) || (openings[1] && openings[3])) {
          type = PipeType.STRAIGHT;
          rot = openings[1] ? 1 : 0;
        } else {
          type = PipeType.CORNER;
          // Corner at rot=0: top + right
          if (openings[0] && openings[1]) rot = 0;
          else if (openings[1] && openings[2]) rot = 1;
          else if (openings[2] && openings[3]) rot = 2;
          else rot = 3; // left + top
        }
      } else {
        type = PipeType.STRAIGHT;
      }

      this.grid[r][c] = { type, rotation: rot, animRotation: rot * Math.PI / 2, connected: false };
    }

    // Fill remaining cells with random pipe types
    for (let r = 0; r < GRID; r++) {
      for (let c = 0; c < GRID; c++) {
        if (solutionPath.some(([pr, pc]) => pr === r && pc === c)) continue;
        const types = [PipeType.STRAIGHT, PipeType.CORNER, PipeType.T_JUNCTION, PipeType.STRAIGHT, PipeType.CORNER];
        this.grid[r][c] = {
          type: types[Math.floor(Math.random() * types.length)],
          rotation: Math.floor(Math.random() * 4),
          animRotation: 0,
          connected: false,
        };
        this.grid[r][c].animRotation = this.grid[r][c].rotation * Math.PI / 2;
      }
    }

    // Scramble the solution path rotations
    for (const [r, c] of solutionPath) {
      const scramble = 1 + Math.floor(Math.random() * 3);
      this.grid[r][c].rotation = (this.grid[r][c].rotation + scramble) % 4;
      this.grid[r][c].animRotation = this.grid[r][c].rotation * Math.PI / 2;
    }

    this.checkConnections();
  }

  reset(): void {
    this.init();
  }

  /** BFS from source to check connections */
  private checkConnections(): void {
    // Clear all
    for (let r = 0; r < GRID; r++) {
      for (let c = 0; c < GRID; c++) {
        this.grid[r][c].connected = false;
      }
    }
    this.connectedCells.clear();

    // Source is at row 2, col -1 (enters from left into cell [2,0])
    // We start BFS from [2,0] if it has a left opening
    const startCell = this.grid[2][0];
    const startOpenings = getOpenings(startCell);
    if (!startOpenings[3]) return; // left side not open

    const queue: [number, number][] = [[2, 0]];
    const visited = new Set<string>();
    visited.add('2,0');

    while (queue.length > 0) {
      const [r, c] = queue.shift()!;
      this.grid[r][c].connected = true;
      this.connectedCells.add(`${r},${c}`);

      const openings = getOpenings(this.grid[r][c]);
      const dirs: [number, number, number][] = [
        [-1, 0, 0], // top -> check neighbor's bottom (2)
        [0, 1, 1],  // right -> check neighbor's left (3)
        [1, 0, 2],  // bottom -> check neighbor's top (0)
        [0, -1, 3], // left -> check neighbor's right (1)
      ];

      for (const [dr, dc, side] of dirs) {
        if (!openings[side]) continue;
        const nr = r + dr;
        const nc = c + dc;
        if (nr < 0 || nr >= GRID || nc < 0 || nc >= GRID) continue;
        const key = `${nr},${nc}`;
        if (visited.has(key)) continue;

        const neighborOpenings = getOpenings(this.grid[nr][nc]);
        const oppositeSide = (side + 2) % 4;
        if (neighborOpenings[oppositeSide]) {
          visited.add(key);
          queue.push([nr, nc]);
        }
      }
    }
  }

  isSolved(): boolean {
    if (this.solved) return true;
    // Check if drain cell [2,4] is connected and has right opening
    const drainCell = this.grid[2][4];
    const drainOpenings = getOpenings(drainCell);
    return drainCell.connected && drainOpenings[1];
  }

  onPointerDown(x: number, y: number): void {
    if (this.solved) return;

    const col = Math.floor((x - GRID_X) / CELL);
    const row = Math.floor((y - GRID_Y) / CELL);

    if (row >= 0 && row < GRID && col >= 0 && col < GRID) {
      const cell = this.grid[row][col];
      cell.rotation = (cell.rotation + 1) % 4;
      this.moves++;
      playPipeClick();

      this.checkConnections();

      if (this.isSolved() && !this.solved) {
        this.solved = true;
        playFluidFlow();
        setTimeout(() => {
          playSuccess();
          playHeavyClunk();
        }, 300);
        for (let r = 0; r < GRID; r++) {
          for (let c = 0; c < GRID; c++) {
            if (this.grid[r][c].connected) {
              this.effects.emitGlow(
                GRID_X + c * CELL + CELL / 2,
                GRID_Y + r * CELL + CELL / 2,
                C.GREEN_GLOW, 3
              );
            }
          }
        }
      }
    }
  }

  onPointerMove(_x: number, _y: number): void { }
  onPointerUp(): void { }

  update(dt: number): void {
    if (!this.solved) {
      this.elapsed += dt;
    } else {
      this.solveAnim = Math.min(1, this.solveAnim + dt * 0.6);
    }

    this.flowAnim += dt * 2;

    // Animate rotations
    for (let r = 0; r < GRID; r++) {
      for (let c = 0; c < GRID; c++) {
        const cell = this.grid[r][c];
        const target = cell.rotation * Math.PI / 2;
        // Handle wrap-around smoothly
        let diff = target - cell.animRotation;
        // Always rotate forward (clockwise)
        if (diff < -0.1) diff += Math.PI * 2;
        if (Math.abs(diff) > 0.01) {
          cell.animRotation += diff * Math.min(1, dt * 15);
        } else {
          cell.animRotation = target;
        }
      }
    }

    this.effects.update(dt);
  }

  render(ctx: CanvasRenderingContext2D): void {
    drawBackground(ctx);

    // Main panel
    const panelX = 80;
    const panelY = 70;
    const panelW = GAME_W - 160;
    const panelH = GAME_H - 110;
    drawMetalPanel(ctx, panelX, panelY, panelW, panelH, '#1A1A28', 10);
    drawFrame(ctx, panelX, panelY, panelW, panelH, 10);

    // Source indicator (left)
    ctx.save();
    const srcX = GRID_X - 30;
    const srcY = GRID_Y + 2 * CELL + CELL / 2;
    ctx.shadowColor = C.GREEN_GLOW;
    ctx.shadowBlur = 15;
    ctx.fillStyle = C.GREEN_GLOW;
    ctx.beginPath();
    ctx.arc(srcX, srcY, 10, 0, Math.PI * 2);
    ctx.fill();
    ctx.shadowBlur = 0;
    ctx.font = 'bold 12px "Georgia", serif';
    ctx.textAlign = 'center';
    ctx.fillStyle = C.GREEN_GLOW;
    ctx.fillText('IN', srcX, srcY - 18);

    // Pipe from source to grid
    ctx.strokeStyle = C.COPPER;
    ctx.lineWidth = 8;
    ctx.beginPath();
    ctx.moveTo(srcX + 10, srcY);
    ctx.lineTo(GRID_X, srcY);
    ctx.stroke();
    ctx.restore();

    // Drain indicator (right)
    ctx.save();
    const drnX = GRID_X + GRID * CELL + 30;
    const drnY = GRID_Y + 2 * CELL + CELL / 2;
    const drnConnected = this.solved;
    ctx.shadowColor = drnConnected ? C.GREEN_GLOW : C.RED_GLOW;
    ctx.shadowBlur = 10;
    ctx.fillStyle = drnConnected ? C.GREEN_GLOW : '#882222';
    ctx.beginPath();
    ctx.arc(drnX, drnY, 10, 0, Math.PI * 2);
    ctx.fill();
    ctx.shadowBlur = 0;
    ctx.font = 'bold 12px "Georgia", serif';
    ctx.textAlign = 'center';
    ctx.fillStyle = drnConnected ? C.GREEN_GLOW : C.RED_GLOW;
    ctx.fillText('OUT', drnX, drnY - 18);

    // Pipe from grid to drain
    ctx.strokeStyle = C.COPPER;
    ctx.lineWidth = 8;
    ctx.beginPath();
    ctx.moveTo(GRID_X + GRID * CELL, drnY);
    ctx.lineTo(drnX - 10, drnY);
    ctx.stroke();
    ctx.restore();

    // Draw grid cells
    for (let r = 0; r < GRID; r++) {
      for (let c = 0; c < GRID; c++) {
        const cell = this.grid[r][c];
        const cx = GRID_X + c * CELL + CELL / 2;
        const cy = GRID_Y + r * CELL + CELL / 2;

        // Cell background
        ctx.save();
        ctx.fillStyle = '#141420';
        ctx.strokeStyle = '#2A2A3A';
        ctx.lineWidth = 1;
        ctx.fillRect(GRID_X + c * CELL, GRID_Y + r * CELL, CELL, CELL);
        ctx.strokeRect(GRID_X + c * CELL, GRID_Y + r * CELL, CELL, CELL);
        ctx.restore();

        // Draw pipe
        ctx.save();
        ctx.translate(cx, cy);
        ctx.rotate(cell.animRotation);

        const pipeW = 12;
        const halfCell = CELL / 2 - 4;
        const openings = PIPE_OPENINGS[cell.type]; // base openings (before rotation)

        // Pipe color
        const pipeColor = cell.connected ? '#44AA66' : C.COPPER;
        const pipeDark = cell.connected ? '#226633' : darken(C.COPPER, 30);
        const pipeLight = cell.connected ? '#66CC88' : lighten(C.COPPER, 20);

        // Draw pipe segments based on base openings (rotation is handled by ctx.rotate)
        const drawSegment = (dx: number, dy: number, horizontal: boolean) => {
          const grad = horizontal
            ? ctx.createLinearGradient(0, -pipeW / 2, 0, pipeW / 2)
            : ctx.createLinearGradient(-pipeW / 2, 0, pipeW / 2, 0);
          grad.addColorStop(0, pipeDark);
          grad.addColorStop(0.3, pipeLight);
          grad.addColorStop(0.7, pipeColor);
          grad.addColorStop(1, pipeDark);
          ctx.fillStyle = grad;

          if (horizontal) {
            ctx.fillRect(Math.min(0, dx), -pipeW / 2, Math.abs(dx), pipeW);
          } else {
            ctx.fillRect(-pipeW / 2, Math.min(0, dy), pipeW, Math.abs(dy));
          }
        };

        // Center junction
        ctx.fillStyle = pipeColor;
        ctx.fillRect(-pipeW / 2, -pipeW / 2, pipeW, pipeW);

        if (openings[0]) drawSegment(0, -halfCell, false); // top
        if (openings[1]) drawSegment(halfCell, 0, true);  // right
        if (openings[2]) drawSegment(0, halfCell, false);  // bottom
        if (openings[3]) drawSegment(-halfCell, 0, true);  // left

        // Joint rivets at center
        ctx.fillStyle = pipeDark;
        ctx.beginPath();
        ctx.arc(0, 0, 4, 0, Math.PI * 2);
        ctx.fill();
        ctx.fillStyle = pipeLight;
        ctx.beginPath();
        ctx.arc(-1, -1, 2, 0, Math.PI * 2);
        ctx.fill();

        // Flowing liquid animation if connected
        if (cell.connected && this.solved) {
          ctx.globalAlpha = 0.5 + Math.sin(this.flowAnim * 3 + c + r) * 0.3;
          ctx.fillStyle = C.GREEN_GLOW;
          ctx.shadowColor = C.GREEN_GLOW;
          ctx.shadowBlur = 6;
          ctx.beginPath();
          ctx.arc(0, 0, 3, 0, Math.PI * 2);
          ctx.fill();
          ctx.shadowBlur = 0;
          ctx.globalAlpha = 1;
        }

        ctx.restore();
      }
    }

    // Hint
    if (!this.solved && this.moves === 0) {
      ctx.save();
      ctx.textAlign = 'center';
      ctx.font = 'italic 14px "Georgia", serif';
      ctx.fillStyle = C.TEXT_DIM;
      ctx.fillText('Clicca un tubo per ruotarlo di 90\u00B0', GAME_W / 2, GAME_H - 55);
      ctx.restore();
    }

    // Solve glow
    if (this.solveAnim > 0) {
      ctx.save();
      ctx.globalAlpha = this.solveAnim * 0.3;
      const glow = ctx.createRadialGradient(GAME_W / 2, GAME_H / 2, 10, GAME_W / 2, GAME_H / 2, 300);
      glow.addColorStop(0, C.GREEN_GLOW);
      glow.addColorStop(1, 'rgba(0,255,136,0)');
      ctx.fillStyle = glow;
      ctx.fillRect(panelX, panelY, panelW, panelH);
      ctx.restore();
    }

    this.effects.render(ctx);
    drawHUD(ctx, this.name, this.subtitle, this.moves, this.elapsed);
  }
}
