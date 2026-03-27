// ============================================================
// Level 4 — Il Pannello Scorrevole (The Sliding Panel)
// 4x4 sliding puzzle with circuit traces
// ============================================================

import { MechanismLevel, C, GAME_W, GAME_H } from '../types';
import {
  drawBackground, drawMetalPanel, drawFrame, drawHUD,
  drawBrushedMetal, drawRivet, drawCornerRivets,
  roundRect, easeOutCubic, lighten, darken
} from '../renderer';
import { EffectsEngine } from '../effects';
import { playClank, playSuccess, playElectricalBuzz, playHeavyClunk } from '../audio';

const GRID = 4;
const CELL = 110;
const BOARD_X = GAME_W / 2 - (GRID * CELL) / 2;
const BOARD_Y = GAME_H / 2 - (GRID * CELL) / 2 + 30;

interface Tile {
  value: number; // 0 = empty, 1-15 = tile id
  animX: number;
  animY: number;
}

// Circuit trace patterns for each tile (1-15)
// Each tile has traces: array of [x1,y1,x2,y2] line segments in 0-1 space
const TRACE_PATTERNS: Record<number, number[][]> = {
  1:  [[0.5, 0, 0.5, 1], [0.5, 0.5, 1, 0.5]],
  2:  [[0, 0.5, 1, 0.5]],
  3:  [[0, 0.5, 0.5, 0.5], [0.5, 0.5, 0.5, 1]],
  4:  [[0.5, 0, 0.5, 0.5], [0.5, 0.5, 1, 0.5]],
  5:  [[0, 0.3, 1, 0.3], [0.5, 0.3, 0.5, 1]],
  6:  [[0, 0.5, 1, 0.5], [0.5, 0, 0.5, 0.5]],
  7:  [[0.5, 0, 0.5, 1]],
  8:  [[0, 0.5, 0.5, 0.5], [0.5, 0.5, 0.5, 0]],
  9:  [[0.5, 0, 0.5, 0.5], [0.5, 0.5, 0, 0.5]],
  10: [[0, 0.5, 1, 0.5], [0.5, 0.5, 0.5, 1]],
  11: [[0.5, 0, 0.5, 1], [0, 0.5, 0.5, 0.5]],
  12: [[0, 0.7, 1, 0.7]],
  13: [[0.5, 0, 0.5, 0.5], [0.5, 0.5, 1, 0.5]],
  14: [[0, 0.5, 0.5, 0.5], [0.5, 0.5, 0.5, 1]],
  15: [[0, 0.5, 0.5, 0.5], [0.5, 0, 0.5, 0.5]],
};

export class Level4Slider implements MechanismLevel {
  id = 4;
  name = 'Il Pannello Scorrevole';
  subtitle = 'Ordina le tessere da 1 a 15 per completare il circuito';
  moves = 0;
  elapsed = 0;
  solved = false;

  private board: Tile[][] = [];
  private emptyR = 3;
  private emptyC = 3;
  private effects = new EffectsEngine();
  private solveAnim = 0;
  private sparkTimer = 0;

  init(): void {
    this.moves = 0;
    this.elapsed = 0;
    this.solved = false;
    this.solveAnim = 0;
    this.sparkTimer = 0;
    this.effects.clear();

    // Create solved board
    this.board = [];
    let val = 1;
    for (let r = 0; r < GRID; r++) {
      this.board[r] = [];
      for (let c = 0; c < GRID; c++) {
        if (r === GRID - 1 && c === GRID - 1) {
          this.board[r][c] = { value: 0, animX: c * CELL, animY: r * CELL };
        } else {
          this.board[r][c] = { value: val++, animX: c * CELL, animY: r * CELL };
        }
      }
    }
    this.emptyR = 3;
    this.emptyC = 3;

    // Shuffle by making random valid moves (ensures solvability)
    for (let i = 0; i < 40; i++) {
      const neighbors: [number, number][] = [];
      if (this.emptyR > 0) neighbors.push([this.emptyR - 1, this.emptyC]);
      if (this.emptyR < GRID - 1) neighbors.push([this.emptyR + 1, this.emptyC]);
      if (this.emptyC > 0) neighbors.push([this.emptyR, this.emptyC - 1]);
      if (this.emptyC < GRID - 1) neighbors.push([this.emptyR, this.emptyC + 1]);
      const [nr, nc] = neighbors[Math.floor(Math.random() * neighbors.length)];
      // Swap
      const temp = this.board[nr][nc];
      this.board[nr][nc] = this.board[this.emptyR][this.emptyC];
      this.board[this.emptyR][this.emptyC] = temp;
      this.emptyR = nr;
      this.emptyC = nc;
    }

    // Set animation positions
    for (let r = 0; r < GRID; r++) {
      for (let c = 0; c < GRID; c++) {
        this.board[r][c].animX = c * CELL;
        this.board[r][c].animY = r * CELL;
      }
    }
  }

  reset(): void {
    this.init();
  }

  isSolved(): boolean {
    if (this.solved) return true;
    let val = 1;
    for (let r = 0; r < GRID; r++) {
      for (let c = 0; c < GRID; c++) {
        if (r === GRID - 1 && c === GRID - 1) {
          if (this.board[r][c].value !== 0) return false;
        } else {
          if (this.board[r][c].value !== val) return false;
          val++;
        }
      }
    }
    return true;
  }

  onPointerDown(x: number, y: number): void {
    if (this.solved) return;

    const col = Math.floor((x - BOARD_X) / CELL);
    const row = Math.floor((y - BOARD_Y) / CELL);

    if (row < 0 || row >= GRID || col < 0 || col >= GRID) return;
    if (this.board[row][col].value === 0) return;

    // Check if adjacent to empty
    const isAdj = (
      (row === this.emptyR && Math.abs(col - this.emptyC) === 1) ||
      (col === this.emptyC && Math.abs(row - this.emptyR) === 1)
    );

    if (isAdj) {
      // Swap
      const temp = this.board[row][col];
      this.board[row][col] = this.board[this.emptyR][this.emptyC];
      this.board[this.emptyR][this.emptyC] = temp;
      this.emptyR = row;
      this.emptyC = col;
      this.moves++;
      playClank();

      if (this.isSolved() && !this.solved) {
        this.solved = true;
        playElectricalBuzz();
        setTimeout(() => {
          playSuccess();
          playHeavyClunk();
        }, 400);
        // Sparks along the circuit
        for (let r = 0; r < GRID; r++) {
          for (let c = 0; c < GRID; c++) {
            if (this.board[r][c].value > 0) {
              this.effects.emitSparks(
                BOARD_X + c * CELL + CELL / 2,
                BOARD_Y + r * CELL + CELL / 2,
                3
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
      this.sparkTimer += dt;
      if (this.sparkTimer > 0.3) {
        this.sparkTimer = 0;
        const r = Math.floor(Math.random() * GRID);
        const c = Math.floor(Math.random() * GRID);
        if (this.board[r][c].value > 0) {
          this.effects.emitSparks(
            BOARD_X + c * CELL + CELL / 2,
            BOARD_Y + r * CELL + CELL / 2,
            2
          );
        }
      }
    }

    // Animate tile positions
    for (let r = 0; r < GRID; r++) {
      for (let c = 0; c < GRID; c++) {
        const tile = this.board[r][c];
        const targetX = c * CELL;
        const targetY = r * CELL;
        tile.animX += (targetX - tile.animX) * Math.min(1, dt * 15);
        tile.animY += (targetY - tile.animY) * Math.min(1, dt * 15);
      }
    }

    this.effects.update(dt);
  }

  render(ctx: CanvasRenderingContext2D): void {
    drawBackground(ctx);

    // Panel
    const panelX = 80;
    const panelY = 70;
    const panelW = GAME_W - 160;
    const panelH = GAME_H - 110;
    drawMetalPanel(ctx, panelX, panelY, panelW, panelH, '#1A1A28', 10);
    drawFrame(ctx, panelX, panelY, panelW, panelH, 10);

    // Board frame
    const frameX = BOARD_X - 8;
    const frameY = BOARD_Y - 8;
    const frameW = GRID * CELL + 16;
    const frameH = GRID * CELL + 16;
    drawBrushedMetal(ctx, frameX, frameY, frameW, frameH, '#5A4A2A');
    drawCornerRivets(ctx, frameX, frameY, frameW, frameH, 8, 3);

    // Board background
    ctx.fillStyle = '#0A0A14';
    ctx.fillRect(BOARD_X, BOARD_Y, GRID * CELL, GRID * CELL);

    // Draw tiles
    for (let r = 0; r < GRID; r++) {
      for (let c = 0; c < GRID; c++) {
        const tile = this.board[r][c];
        if (tile.value === 0) continue;

        const tx = BOARD_X + tile.animX;
        const ty = BOARD_Y + tile.animY;
        const margin = 3;

        // Tile background
        ctx.save();
        ctx.shadowColor = 'rgba(0,0,0,0.5)';
        ctx.shadowBlur = 6;
        ctx.shadowOffsetX = 2;
        ctx.shadowOffsetY = 2;

        const tileGrad = ctx.createLinearGradient(tx, ty, tx + CELL, ty + CELL);
        tileGrad.addColorStop(0, '#3A3A4E');
        tileGrad.addColorStop(0.5, '#2A2A3E');
        tileGrad.addColorStop(1, '#1A1A2E');
        ctx.fillStyle = tileGrad;
        roundRect(ctx, tx + margin, ty + margin, CELL - margin * 2, CELL - margin * 2, 4);
        ctx.fill();

        ctx.shadowBlur = 0;

        // Bevel top highlight
        ctx.strokeStyle = 'rgba(255,255,255,0.1)';
        ctx.lineWidth = 1;
        ctx.beginPath();
        ctx.moveTo(tx + margin + 4, ty + margin + 1);
        ctx.lineTo(tx + CELL - margin - 4, ty + margin + 1);
        ctx.stroke();

        // Circuit traces
        const traces = TRACE_PATTERNS[tile.value] || [];
        const traceColor = this.solved ? C.TEAL_TRACE : '#1A5A5A';
        ctx.strokeStyle = traceColor;
        ctx.lineWidth = 3;
        if (this.solved) {
          ctx.shadowColor = C.TEAL_TRACE;
          ctx.shadowBlur = 8;
        }
        for (const trace of traces) {
          ctx.beginPath();
          ctx.moveTo(
            tx + margin + trace[0] * (CELL - margin * 2),
            ty + margin + trace[1] * (CELL - margin * 2)
          );
          ctx.lineTo(
            tx + margin + trace[2] * (CELL - margin * 2),
            ty + margin + trace[3] * (CELL - margin * 2)
          );
          ctx.stroke();

          // Solder points at endpoints
          for (let pi = 0; pi < 4; pi += 2) {
            ctx.fillStyle = this.solved ? C.TEAL_TRACE : '#2A6A6A';
            ctx.beginPath();
            ctx.arc(
              tx + margin + trace[pi] * (CELL - margin * 2),
              ty + margin + trace[pi + 1] * (CELL - margin * 2),
              2.5, 0, Math.PI * 2
            );
            ctx.fill();
          }
        }
        ctx.shadowBlur = 0;

        // Tile number
        ctx.textAlign = 'center';
        ctx.textBaseline = 'middle';
        ctx.font = 'bold 28px "Georgia", serif';
        ctx.fillStyle = 'rgba(255,255,255,0.35)';
        ctx.fillText(`${tile.value}`, tx + CELL / 2, ty + CELL / 2);

        ctx.restore();
      }
    }

    // Hint
    if (!this.solved && this.moves === 0) {
      ctx.save();
      ctx.textAlign = 'center';
      ctx.font = 'italic 14px "Georgia", serif';
      ctx.fillStyle = C.TEXT_DIM;
      ctx.fillText('Clicca una tessera adiacente allo spazio vuoto per spostarla', GAME_W / 2, GAME_H - 55);
      ctx.restore();
    }

    // Solve glow
    if (this.solveAnim > 0) {
      ctx.save();
      ctx.globalAlpha = this.solveAnim * 0.25;
      const glow = ctx.createRadialGradient(
        BOARD_X + GRID * CELL / 2, BOARD_Y + GRID * CELL / 2, 10,
        BOARD_X + GRID * CELL / 2, BOARD_Y + GRID * CELL / 2, 300
      );
      glow.addColorStop(0, C.TEAL_TRACE);
      glow.addColorStop(1, 'rgba(0,206,209,0)');
      ctx.fillStyle = glow;
      ctx.fillRect(panelX, panelY, panelW, panelH);
      ctx.restore();
    }

    this.effects.render(ctx);
    drawHUD(ctx, this.name, this.subtitle, this.moves, this.elapsed);
  }
}
