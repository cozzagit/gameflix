import {
  Direction, BeamColor, Piece, PieceType, Rotation,
  LightSource, Target, BeamSegment, GameState,
} from './types';

const BG_COLOR = '#0a0a1e';
const GRID_COLOR = 'rgba(60, 60, 120, 0.25)';
const GRID_ACCENT = 'rgba(80, 80, 160, 0.15)';

/** Convert BeamColor to CSS rgb string */
export function beamColorToCSS(c: BeamColor, alpha: number = 1): string {
  return `rgba(${c.r * 255}, ${c.g * 255}, ${c.b * 255}, ${alpha})`;
}

function beamColorToGlow(c: BeamColor): string {
  // Brighten for glow effect
  const r = Math.min(255, c.r * 255 + 60);
  const g = Math.min(255, c.g * 255 + 60);
  const b = Math.min(255, c.b * 255 + 60);
  return `rgb(${r}, ${g}, ${b})`;
}

export class Renderer {
  private ctx: CanvasRenderingContext2D;
  private width: number;
  private height: number;
  private gridOffsetX: number = 0;
  private gridOffsetY: number = 0;
  private cellSize: number = 0;
  private time: number = 0;

  constructor(private canvas: HTMLCanvasElement) {
    this.ctx = canvas.getContext('2d')!;
    this.width = canvas.width;
    this.height = canvas.height;
  }

  /** Compute grid layout metrics */
  computeLayout(gridCols: number, gridRows: number): { offsetX: number; offsetY: number; cellSize: number } {
    const maxGridWidth = this.width - 80;
    const maxGridHeight = this.height - 160; // room for toolbar at bottom
    const cellW = Math.floor(maxGridWidth / gridCols);
    const cellH = Math.floor(maxGridHeight / gridRows);
    this.cellSize = Math.min(cellW, cellH, 100);
    const gridW = this.cellSize * gridCols;
    const gridH = this.cellSize * gridRows;
    this.gridOffsetX = Math.floor((this.width - gridW) / 2);
    this.gridOffsetY = Math.floor((this.height - 160 - gridH) / 2) + 40;
    return { offsetX: this.gridOffsetX, offsetY: this.gridOffsetY, cellSize: this.cellSize };
  }

  /** Get pixel center of a grid cell */
  cellCenter(col: number, row: number): [number, number] {
    return [
      this.gridOffsetX + col * this.cellSize + this.cellSize / 2,
      this.gridOffsetY + row * this.cellSize + this.cellSize / 2,
    ];
  }

  /** Get pixel top-left of a grid cell */
  cellTopLeft(col: number, row: number): [number, number] {
    return [
      this.gridOffsetX + col * this.cellSize,
      this.gridOffsetY + row * this.cellSize,
    ];
  }

  /** Convert screen coordinates to grid cell */
  screenToGrid(sx: number, sy: number, gridCols: number, gridRows: number): [number, number] | null {
    const col = Math.floor((sx - this.gridOffsetX) / this.cellSize);
    const row = Math.floor((sy - this.gridOffsetY) / this.cellSize);
    if (col >= 0 && col < gridCols && row >= 0 && row < gridRows) {
      return [col, row];
    }
    return null;
  }

  updateTime(dt: number): void {
    this.time += dt;
  }

  /** Clear the screen */
  clear(): void {
    this.ctx.fillStyle = BG_COLOR;
    this.ctx.fillRect(0, 0, this.width, this.height);
  }

  /** Draw the background grid */
  drawGrid(gridCols: number, gridRows: number): void {
    const ctx = this.ctx;
    const cs = this.cellSize;

    // Subtle background grid pattern
    for (let row = 0; row < gridRows; row++) {
      for (let col = 0; col < gridCols; col++) {
        const [x, y] = this.cellTopLeft(col, row);
        ctx.strokeStyle = GRID_COLOR;
        ctx.lineWidth = 1;
        ctx.strokeRect(x, y, cs, cs);

        // Slight alternating shade
        if ((row + col) % 2 === 0) {
          ctx.fillStyle = GRID_ACCENT;
          ctx.fillRect(x, y, cs, cs);
        }
      }
    }

    // Grid border
    ctx.strokeStyle = 'rgba(80, 80, 160, 0.4)';
    ctx.lineWidth = 2;
    ctx.strokeRect(this.gridOffsetX, this.gridOffsetY, gridCols * cs, gridRows * cs);
  }

  /** Draw light sources */
  drawSources(sources: LightSource[]): void {
    const ctx = this.ctx;
    const cs = this.cellSize;

    for (const src of sources) {
      const [cx, cy] = this.cellCenter(src.col, src.row);
      const color = beamColorToCSS(src.color);
      const glowColor = beamColorToGlow(src.color);

      // Outer glow
      ctx.save();
      ctx.shadowColor = glowColor;
      ctx.shadowBlur = 20 + Math.sin(this.time * 3) * 5;

      // Source body
      ctx.fillStyle = color;
      ctx.beginPath();
      ctx.arc(cx, cy, cs * 0.3, 0, Math.PI * 2);
      ctx.fill();

      // Inner bright core
      ctx.fillStyle = '#ffffff';
      ctx.globalAlpha = 0.6 + Math.sin(this.time * 4) * 0.2;
      ctx.beginPath();
      ctx.arc(cx, cy, cs * 0.12, 0, Math.PI * 2);
      ctx.fill();

      // Direction arrow
      ctx.globalAlpha = 1;
      const arrowLen = cs * 0.35;
      let ax = 0, ay = 0;
      switch (src.direction) {
        case Direction.RIGHT: ax = arrowLen; break;
        case Direction.LEFT: ax = -arrowLen; break;
        case Direction.DOWN: ay = arrowLen; break;
        case Direction.UP: ay = -arrowLen; break;
      }
      ctx.strokeStyle = color;
      ctx.lineWidth = 3;
      ctx.beginPath();
      ctx.moveTo(cx, cy);
      ctx.lineTo(cx + ax, cy + ay);
      ctx.stroke();

      // Arrowhead
      const headSize = 6;
      ctx.fillStyle = color;
      ctx.beginPath();
      if (ax > 0) {
        ctx.moveTo(cx + ax, cy);
        ctx.lineTo(cx + ax - headSize, cy - headSize);
        ctx.lineTo(cx + ax - headSize, cy + headSize);
      } else if (ax < 0) {
        ctx.moveTo(cx + ax, cy);
        ctx.lineTo(cx + ax + headSize, cy - headSize);
        ctx.lineTo(cx + ax + headSize, cy + headSize);
      } else if (ay > 0) {
        ctx.moveTo(cx, cy + ay);
        ctx.lineTo(cx - headSize, cy + ay - headSize);
        ctx.lineTo(cx + headSize, cy + ay - headSize);
      } else if (ay < 0) {
        ctx.moveTo(cx, cy + ay);
        ctx.lineTo(cx - headSize, cy + ay + headSize);
        ctx.lineTo(cx + headSize, cy + ay + headSize);
      }
      ctx.closePath();
      ctx.fill();

      ctx.restore();
    }
  }

  /** Get color name in Italian for a beam color */
  private colorLabel(c: BeamColor): string {
    const key = `${c.r},${c.g},${c.b}`;
    const labels: Record<string, string> = {
      '1,1,1': 'Bianco',
      '1,0,0': 'Rosso',
      '0,1,0': 'Verde',
      '0,0,1': 'Blu',
      '1,1,0': 'Giallo',
      '1,0,1': 'Magenta',
      '0,1,1': 'Ciano',
    };
    return labels[key] || '';
  }

  /** Draw targets */
  drawTargets(targets: Target[]): void {
    const ctx = this.ctx;
    const cs = this.cellSize;

    for (const target of targets) {
      const [cx, cy] = this.cellCenter(target.col, target.row);
      const color = beamColorToCSS(target.requiredColor);
      const radius = cs * 0.35;

      ctx.save();

      if (target.activated) {
        // Activated glow
        ctx.shadowColor = beamColorToGlow(target.requiredColor);
        ctx.shadowBlur = 25 + Math.sin(this.time * 5) * 10;

        // Filled circle
        ctx.fillStyle = color;
        ctx.beginPath();
        ctx.arc(cx, cy, radius, 0, Math.PI * 2);
        ctx.fill();

        // Bright center
        ctx.fillStyle = '#ffffff';
        ctx.globalAlpha = 0.7;
        ctx.beginPath();
        ctx.arc(cx, cy, radius * 0.4, 0, Math.PI * 2);
        ctx.fill();
      } else {
        // Inactive - ring only
        ctx.strokeStyle = color;
        ctx.lineWidth = 3;
        ctx.shadowColor = color;
        ctx.shadowBlur = 8;
        ctx.beginPath();
        ctx.arc(cx, cy, radius, 0, Math.PI * 2);
        ctx.stroke();

        // Inner dot
        ctx.fillStyle = color;
        ctx.globalAlpha = 0.3;
        ctx.beginPath();
        ctx.arc(cx, cy, radius * 0.2, 0, Math.PI * 2);
        ctx.fill();

        // Show received color if wrong
        if (target.receivedColor && !target.activated) {
          const rcColor = beamColorToCSS(target.receivedColor, 0.4);
          ctx.globalAlpha = 0.4;
          ctx.fillStyle = rcColor;
          ctx.beginPath();
          ctx.arc(cx, cy, radius * 0.7, 0, Math.PI * 2);
          ctx.fill();
        }
      }

      // Cross-hair lines
      ctx.globalAlpha = 0.3;
      ctx.strokeStyle = color;
      ctx.lineWidth = 1;
      ctx.beginPath();
      ctx.moveTo(cx - radius - 5, cy);
      ctx.lineTo(cx + radius + 5, cy);
      ctx.moveTo(cx, cy - radius - 5);
      ctx.lineTo(cx, cy + radius + 5);
      ctx.stroke();

      // Color label below/above the target
      ctx.globalAlpha = 0.9;
      const label = this.colorLabel(target.requiredColor);
      if (label) {
        ctx.fillStyle = color;
        ctx.font = `bold ${Math.max(10, cs * 0.16)}px sans-serif`;
        ctx.textAlign = 'center';
        ctx.textBaseline = 'top';
        ctx.shadowColor = 'rgba(0,0,0,0.8)';
        ctx.shadowBlur = 4;
        ctx.fillText(label, cx, cy + radius + 4);
      }

      ctx.restore();
    }
  }

  /** Draw a single piece */
  drawPiece(col: number, row: number, piece: Piece, highlight: boolean = false): void {
    const ctx = this.ctx;
    const cs = this.cellSize;
    const [cx, cy] = this.cellCenter(col, row);

    ctx.save();
    ctx.translate(cx, cy);

    if (highlight) {
      ctx.shadowColor = '#ffffff';
      ctx.shadowBlur = 10;
    }

    switch (piece.type) {
      case PieceType.MIRROR:
        this.drawMirror(piece.rotation, cs);
        break;
      case PieceType.PRISM:
        this.drawPrism(piece.rotation, cs);
        break;
      case PieceType.FILTER_RED:
        this.drawFilter(piece.rotation, cs, '#ff3333', 'R');
        break;
      case PieceType.FILTER_GREEN:
        this.drawFilter(piece.rotation, cs, '#33ff33', 'G');
        break;
      case PieceType.FILTER_BLUE:
        this.drawFilter(piece.rotation, cs, '#3333ff', 'B');
        break;
    }

    ctx.restore();
  }

  private drawMirror(rotation: Rotation, cs: number): void {
    const ctx = this.ctx;
    const half = cs * 0.38;

    ctx.save();
    ctx.rotate((rotation * Math.PI) / 180);

    // Mirror body (\ shape at rotation 0)
    const grad = ctx.createLinearGradient(-half, -half, half, half);
    grad.addColorStop(0, '#8899bb');
    grad.addColorStop(0.3, '#ccddef');
    grad.addColorStop(0.5, '#ffffff');
    grad.addColorStop(0.7, '#ccddef');
    grad.addColorStop(1, '#8899bb');

    ctx.strokeStyle = grad;
    ctx.lineWidth = 6;
    ctx.lineCap = 'round';
    ctx.beginPath();
    ctx.moveTo(-half, -half);
    ctx.lineTo(half, half);
    ctx.stroke();

    // Shine effect
    ctx.strokeStyle = 'rgba(255, 255, 255, 0.6)';
    ctx.lineWidth = 2;
    ctx.beginPath();
    ctx.moveTo(-half + 3, -half + 3);
    ctx.lineTo(half - 3, half - 3);
    ctx.stroke();

    ctx.restore();
  }

  private drawPrism(rotation: Rotation, cs: number): void {
    const ctx = this.ctx;
    const size = cs * 0.38;

    ctx.save();
    ctx.rotate((rotation * Math.PI) / 180);

    // Triangle prism
    ctx.beginPath();
    ctx.moveTo(0, -size);
    ctx.lineTo(-size, size * 0.8);
    ctx.lineTo(size, size * 0.8);
    ctx.closePath();

    // Rainbow gradient fill
    const grad = ctx.createLinearGradient(-size, 0, size, 0);
    grad.addColorStop(0, 'rgba(255, 0, 0, 0.3)');
    grad.addColorStop(0.17, 'rgba(255, 127, 0, 0.3)');
    grad.addColorStop(0.33, 'rgba(255, 255, 0, 0.3)');
    grad.addColorStop(0.5, 'rgba(0, 255, 0, 0.3)');
    grad.addColorStop(0.67, 'rgba(0, 127, 255, 0.3)');
    grad.addColorStop(0.83, 'rgba(75, 0, 255, 0.3)');
    grad.addColorStop(1, 'rgba(148, 0, 211, 0.3)');
    ctx.fillStyle = grad;
    ctx.fill();

    // Glass-like border
    ctx.strokeStyle = 'rgba(200, 220, 255, 0.8)';
    ctx.lineWidth = 2.5;
    ctx.stroke();

    // Inner shine
    ctx.beginPath();
    ctx.moveTo(0, -size + 8);
    ctx.lineTo(-size + 10, size * 0.8 - 5);
    ctx.strokeStyle = 'rgba(255, 255, 255, 0.3)';
    ctx.lineWidth = 1.5;
    ctx.stroke();

    // Animated rainbow shimmer
    const shimmerOffset = Math.sin(this.time * 2) * 0.2;
    const shimmerGrad = ctx.createLinearGradient(-size, -size, size, size);
    shimmerGrad.addColorStop(Math.max(0, 0.0 + shimmerOffset), 'rgba(255, 0, 0, 0.15)');
    shimmerGrad.addColorStop(Math.max(0, Math.min(1, 0.33 + shimmerOffset)), 'rgba(0, 255, 0, 0.15)');
    shimmerGrad.addColorStop(Math.max(0, Math.min(1, 0.67 + shimmerOffset)), 'rgba(0, 0, 255, 0.15)');
    shimmerGrad.addColorStop(1, 'rgba(255, 0, 255, 0.15)');

    ctx.beginPath();
    ctx.moveTo(0, -size);
    ctx.lineTo(-size, size * 0.8);
    ctx.lineTo(size, size * 0.8);
    ctx.closePath();
    ctx.fillStyle = shimmerGrad;
    ctx.fill();

    ctx.restore();
  }

  private drawFilter(rotation: Rotation, cs: number, color: string, label: string): void {
    const ctx = this.ctx;
    const half = cs * 0.35;

    ctx.save();
    ctx.rotate((rotation * Math.PI) / 180);

    // Glass panel
    ctx.fillStyle = color;
    ctx.globalAlpha = 0.35;
    ctx.fillRect(-half, -half, half * 2, half * 2);
    ctx.globalAlpha = 1;

    // Border
    ctx.strokeStyle = color;
    ctx.lineWidth = 2.5;
    ctx.strokeRect(-half, -half, half * 2, half * 2);

    // Label
    ctx.fillStyle = color;
    ctx.font = `bold ${cs * 0.22}px sans-serif`;
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.fillText(label, 0, 0);

    ctx.restore();
  }

  /** Draw all beam segments with glow effect */
  drawBeams(segments: BeamSegment[]): void {
    const ctx = this.ctx;

    for (const seg of segments) {
      // Clamp to grid bounds for drawing
      const fromCol = Math.max(0, Math.min(seg.fromCol, 7));
      const fromRow = Math.max(0, Math.min(seg.fromRow, 5));
      const toCol = Math.max(0, Math.min(seg.toCol, 7));
      const toRow = Math.max(0, Math.min(seg.toRow, 5));

      const [x1, y1] = this.cellCenter(fromCol, fromRow);
      const [x2, y2] = this.cellCenter(toCol, toRow);

      const color = beamColorToCSS(seg.color);
      const glowColor = beamColorToGlow(seg.color);

      // Wide glow layer
      ctx.save();
      ctx.shadowColor = glowColor;
      ctx.shadowBlur = 18 + Math.sin(this.time * 4 + seg.fromCol) * 4;
      ctx.strokeStyle = color;
      ctx.globalAlpha = 0.3;
      ctx.lineWidth = 10;
      ctx.lineCap = 'round';
      ctx.beginPath();
      ctx.moveTo(x1, y1);
      ctx.lineTo(x2, y2);
      ctx.stroke();
      ctx.restore();

      // Medium glow layer
      ctx.save();
      ctx.shadowColor = glowColor;
      ctx.shadowBlur = 10;
      ctx.strokeStyle = color;
      ctx.globalAlpha = 0.6;
      ctx.lineWidth = 5;
      ctx.lineCap = 'round';
      ctx.beginPath();
      ctx.moveTo(x1, y1);
      ctx.lineTo(x2, y2);
      ctx.stroke();
      ctx.restore();

      // Core beam
      ctx.save();
      ctx.shadowColor = '#ffffff';
      ctx.shadowBlur = 4;
      ctx.strokeStyle = '#ffffff';
      ctx.globalAlpha = 0.5;
      ctx.lineWidth = 2;
      ctx.lineCap = 'round';
      ctx.beginPath();
      ctx.moveTo(x1, y1);
      ctx.lineTo(x2, y2);
      ctx.stroke();
      ctx.restore();
    }
  }

  /** Draw all placed pieces */
  drawPieces(
    grid: (Piece | null)[][],
    fixedGrid: (Piece | null)[][],
    gridRows: number,
    gridCols: number,
  ): void {
    for (let row = 0; row < gridRows; row++) {
      for (let col = 0; col < gridCols; col++) {
        const fixed = fixedGrid[row]?.[col];
        if (fixed) {
          this.drawPiece(col, row, fixed, false);
        }
        const placed = grid[row]?.[col];
        if (placed) {
          this.drawPiece(col, row, placed, false);
        }
      }
    }
  }

  /** Draw toolbar at bottom */
  drawToolbar(
    availablePieces: { type: PieceType; count: number }[],
    selectedType: PieceType | null,
  ): void {
    const ctx = this.ctx;
    const toolbarY = this.height - 90;
    const toolbarH = 80;
    const itemSize = 60;
    const totalWidth = availablePieces.length * (itemSize + 16);
    let startX = (this.width - totalWidth) / 2;

    // Toolbar background
    ctx.fillStyle = 'rgba(15, 15, 40, 0.85)';
    ctx.beginPath();
    const rr = 12;
    const tbx = startX - 16;
    const tbw = totalWidth + 32;
    ctx.moveTo(tbx + rr, toolbarY);
    ctx.arcTo(tbx + tbw, toolbarY, tbx + tbw, toolbarY + toolbarH, rr);
    ctx.arcTo(tbx + tbw, toolbarY + toolbarH, tbx, toolbarY + toolbarH, rr);
    ctx.arcTo(tbx, toolbarY + toolbarH, tbx, toolbarY, rr);
    ctx.arcTo(tbx, toolbarY, tbx + tbw, toolbarY, rr);
    ctx.closePath();
    ctx.fill();
    ctx.strokeStyle = 'rgba(80, 80, 160, 0.5)';
    ctx.lineWidth = 1;
    ctx.stroke();

    for (const inv of availablePieces) {
      const cx = startX + itemSize / 2;
      const cy = toolbarY + toolbarH / 2 - 5;
      const isSelected = selectedType === inv.type;

      // Selection highlight
      if (isSelected) {
        ctx.save();
        // Bright animated glow border
        ctx.shadowColor = '#88aaff';
        ctx.shadowBlur = 20 + Math.sin(this.time * 4) * 5;
        ctx.strokeStyle = '#88aaff';
        ctx.lineWidth = 3;
        ctx.strokeRect(startX - 4, toolbarY + 2, itemSize + 8, itemSize + 8);
        // Filled background highlight
        ctx.fillStyle = 'rgba(100, 140, 255, 0.15)';
        ctx.fillRect(startX - 4, toolbarY + 2, itemSize + 8, itemSize + 8);
        // "Selezionato" label
        ctx.fillStyle = '#88aaff';
        ctx.font = 'bold 9px sans-serif';
        ctx.textAlign = 'center';
        ctx.textBaseline = 'bottom';
        ctx.fillText('SELEZ.', cx, toolbarY + 2);
        ctx.restore();
      }

      // Draw mini piece
      ctx.save();
      ctx.translate(cx, cy);

      const miniCs = itemSize * 0.7;
      switch (inv.type) {
        case PieceType.MIRROR: {
          const h = miniCs * 0.35;
          const grad = ctx.createLinearGradient(-h, -h, h, h);
          grad.addColorStop(0, '#8899bb');
          grad.addColorStop(0.5, '#ffffff');
          grad.addColorStop(1, '#8899bb');
          ctx.strokeStyle = grad;
          ctx.lineWidth = 4;
          ctx.lineCap = 'round';
          ctx.beginPath();
          ctx.moveTo(-h, -h);
          ctx.lineTo(h, h);
          ctx.stroke();
          break;
        }
        case PieceType.PRISM: {
          const s = miniCs * 0.3;
          ctx.beginPath();
          ctx.moveTo(0, -s);
          ctx.lineTo(-s, s * 0.8);
          ctx.lineTo(s, s * 0.8);
          ctx.closePath();
          ctx.strokeStyle = 'rgba(200, 220, 255, 0.8)';
          ctx.lineWidth = 2;
          ctx.stroke();
          const grd = ctx.createLinearGradient(-s, 0, s, 0);
          grd.addColorStop(0, 'rgba(255, 0, 0, 0.3)');
          grd.addColorStop(0.5, 'rgba(0, 255, 0, 0.3)');
          grd.addColorStop(1, 'rgba(0, 0, 255, 0.3)');
          ctx.fillStyle = grd;
          ctx.fill();
          break;
        }
        case PieceType.FILTER_RED:
        case PieceType.FILTER_GREEN:
        case PieceType.FILTER_BLUE: {
          const colors: Record<string, [string, string]> = {
            [PieceType.FILTER_RED]: ['#ff3333', 'R'],
            [PieceType.FILTER_GREEN]: ['#33ff33', 'G'],
            [PieceType.FILTER_BLUE]: ['#3333ff', 'B'],
          };
          const [c, l] = colors[inv.type];
          const h = miniCs * 0.3;
          ctx.fillStyle = c;
          ctx.globalAlpha = 0.35;
          ctx.fillRect(-h, -h, h * 2, h * 2);
          ctx.globalAlpha = 1;
          ctx.strokeStyle = c;
          ctx.lineWidth = 2;
          ctx.strokeRect(-h, -h, h * 2, h * 2);
          ctx.fillStyle = c;
          ctx.font = `bold ${miniCs * 0.25}px sans-serif`;
          ctx.textAlign = 'center';
          ctx.textBaseline = 'middle';
          ctx.fillText(l, 0, 0);
          break;
        }
      }
      ctx.restore();

      // Count badge
      ctx.fillStyle = inv.count > 0 ? '#ffffff' : '#666666';
      ctx.font = `bold 13px sans-serif`;
      ctx.textAlign = 'center';
      ctx.textBaseline = 'top';
      ctx.fillText(`x${inv.count}`, cx, toolbarY + toolbarH - 18);

      startX += itemSize + 16;
    }
  }

  /** Get the toolbar slot index at a screen position */
  getToolbarSlot(
    sx: number,
    sy: number,
    availablePieces: { type: PieceType; count: number }[],
  ): number {
    const toolbarY = this.height - 90;
    const toolbarH = 80;
    const itemSize = 60;
    const totalWidth = availablePieces.length * (itemSize + 16);
    let startX = (this.width - totalWidth) / 2;

    if (sy < toolbarY || sy > toolbarY + toolbarH) return -1;

    for (let i = 0; i < availablePieces.length; i++) {
      if (sx >= startX && sx <= startX + itemSize) {
        return i;
      }
      startX += itemSize + 16;
    }
    return -1;
  }

  /** Draw HUD (level info, score, timer) */
  drawHUD(levelNum: number, levelName: string, score: number, elapsed: number, stars: number): void {
    const ctx = this.ctx;

    // Top bar
    ctx.fillStyle = 'rgba(15, 15, 40, 0.7)';
    ctx.fillRect(0, 0, this.width, 36);

    // Level info - leave space for exit button on the left
    ctx.fillStyle = '#8899cc';
    ctx.font = 'bold 14px sans-serif';
    ctx.textAlign = 'left';
    ctx.textBaseline = 'middle';
    ctx.fillText(`Livello ${levelNum}/10: ${levelName}`, 60, 18);

    // Timer
    const mins = Math.floor(elapsed / 60);
    const secs = Math.floor(elapsed % 60);
    const timeStr = `${mins}:${secs.toString().padStart(2, '0')}`;
    ctx.fillStyle = '#6677aa';
    ctx.font = '13px sans-serif';
    ctx.textAlign = 'right';
    ctx.fillText(timeStr, this.width - 16, 18);

    // Stars
    const starX = this.width / 2;
    ctx.textAlign = 'center';
    ctx.font = '16px sans-serif';
    let starStr = '';
    for (let i = 0; i < 3; i++) {
      starStr += i < stars ? '\u2605 ' : '\u2606 ';
    }
    ctx.fillStyle = '#ffcc44';
    ctx.fillText(starStr.trim(), starX, 18);
  }

  /** Draw level complete overlay */
  drawLevelComplete(levelNum: number, stars: number, score: number, elapsed: number): void {
    const ctx = this.ctx;

    // Dim overlay
    ctx.fillStyle = 'rgba(5, 5, 20, 0.8)';
    ctx.fillRect(0, 0, this.width, this.height);

    const centerY = this.height / 2 - 40;

    // Title
    ctx.fillStyle = '#ffffff';
    ctx.font = 'bold 36px sans-serif';
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.shadowColor = '#6688ff';
    ctx.shadowBlur = 20;
    ctx.fillText('Livello Completato!', this.width / 2, centerY - 60);
    ctx.shadowBlur = 0;

    // Stars
    ctx.font = '48px sans-serif';
    ctx.fillStyle = '#ffcc44';
    let starStr = '';
    for (let i = 0; i < 3; i++) {
      starStr += i < stars ? '\u2605 ' : '\u2606 ';
    }
    ctx.fillText(starStr.trim(), this.width / 2, centerY);

    // Score
    ctx.font = '20px sans-serif';
    ctx.fillStyle = '#aabbdd';
    ctx.fillText(`Punteggio: ${score}`, this.width / 2, centerY + 50);

    // Timer
    const mins = Math.floor(elapsed / 60);
    const secs = Math.floor(elapsed % 60);
    ctx.fillText(`Tempo: ${mins}:${secs.toString().padStart(2, '0')}`, this.width / 2, centerY + 80);

    // Buttons
    this.drawButton(this.width / 2 - 120, centerY + 120, 100, 40, 'Ripeti', '#4466aa');
    if (levelNum < 10) {
      this.drawButton(this.width / 2 + 20, centerY + 120, 100, 40, 'Avanti', '#44aa66');
    }
  }

  drawButton(x: number, y: number, w: number, h: number, text: string, color: string): void {
    const ctx = this.ctx;
    const r = 8;

    ctx.fillStyle = color;
    ctx.beginPath();
    ctx.moveTo(x + r, y);
    ctx.arcTo(x + w, y, x + w, y + h, r);
    ctx.arcTo(x + w, y + h, x, y + h, r);
    ctx.arcTo(x, y + h, x, y, r);
    ctx.arcTo(x, y, x + w, y, r);
    ctx.closePath();
    ctx.fill();

    ctx.fillStyle = '#ffffff';
    ctx.font = 'bold 15px sans-serif';
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.fillText(text, x + w / 2, y + h / 2);
  }

  /** Check if a point is inside a button area */
  isInsideButton(sx: number, sy: number, bx: number, by: number, bw: number, bh: number): boolean {
    return sx >= bx && sx <= bx + bw && sy >= by && sy <= by + bh;
  }

  /** Get level complete button positions */
  getLevelCompleteButtons(levelNum: number): { retry: [number, number, number, number]; next: [number, number, number, number] | null } {
    const centerY = this.height / 2 - 40;
    const retry: [number, number, number, number] = [this.width / 2 - 120, centerY + 120, 100, 40];
    const next: [number, number, number, number] | null = levelNum < 10 ? [this.width / 2 + 20, centerY + 120, 100, 40] : null;
    return { retry, next };
  }

  /** Draw exit button in top-left corner */
  drawExitButton(): void {
    const ctx = this.ctx;
    const x = 10;
    const y = 4;
    const size = 28;

    ctx.save();
    // Button background
    ctx.fillStyle = 'rgba(180, 60, 60, 0.7)';
    ctx.beginPath();
    ctx.arc(x + size / 2, y + size / 2, size / 2, 0, Math.PI * 2);
    ctx.fill();

    // X symbol
    ctx.strokeStyle = '#ffffff';
    ctx.lineWidth = 2.5;
    ctx.lineCap = 'round';
    const pad = 8;
    ctx.beginPath();
    ctx.moveTo(x + pad, y + pad);
    ctx.lineTo(x + size - pad, y + size - pad);
    ctx.moveTo(x + size - pad, y + pad);
    ctx.lineTo(x + pad, y + size - pad);
    ctx.stroke();
    ctx.restore();
  }

  /** Draw tutorial overlay with fading messages */
  drawTutorialOverlay(
    messages: string[],
    tutorialTime: number,
    messageDuration: number,
    fadeDuration: number,
  ): void {
    const ctx = this.ctx;
    const totalDuration = messages.length * messageDuration;

    // Don't draw if tutorial is over
    if (tutorialTime >= totalDuration + fadeDuration) return;

    // Determine which message to show
    const msgIndex = Math.min(
      Math.floor(tutorialTime / messageDuration),
      messages.length - 1,
    );
    const msgTime = tutorialTime - msgIndex * messageDuration;

    // Calculate alpha for fade in/out
    let alpha = 1;
    if (msgTime < fadeDuration) {
      alpha = msgTime / fadeDuration;
    } else if (msgTime > messageDuration - fadeDuration) {
      alpha = Math.max(0, (messageDuration - msgTime) / fadeDuration);
    }

    // If past all messages, fade out the last one
    if (tutorialTime >= totalDuration) {
      alpha = Math.max(0, 1 - (tutorialTime - totalDuration) / fadeDuration);
    }

    if (alpha <= 0) return;

    const message = messages[msgIndex];

    ctx.save();
    ctx.globalAlpha = alpha;

    // Semi-transparent background strip
    const stripY = this.gridOffsetY - 50;
    const stripH = 40;
    ctx.fillStyle = 'rgba(10, 10, 40, 0.75)';
    ctx.fillRect(40, stripY, this.width - 80, stripH);
    ctx.strokeStyle = 'rgba(100, 130, 255, 0.4)';
    ctx.lineWidth = 1;
    ctx.strokeRect(40, stripY, this.width - 80, stripH);

    // Message text
    ctx.fillStyle = '#ccddff';
    ctx.font = 'bold 15px sans-serif';
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.fillText(message, this.width / 2, stripY + stripH / 2);

    // Step indicator (dots)
    const dotY = stripY + stripH + 10;
    for (let i = 0; i < messages.length; i++) {
      ctx.beginPath();
      ctx.arc(this.width / 2 + (i - (messages.length - 1) / 2) * 14, dotY, 3, 0, Math.PI * 2);
      ctx.fillStyle = i === msgIndex ? '#88aaff' : 'rgba(100, 130, 255, 0.3)';
      ctx.fill();
    }

    ctx.restore();
  }
}
