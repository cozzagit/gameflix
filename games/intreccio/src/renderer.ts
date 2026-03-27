/**
 * Renderer for the Intreccio hex grid game.
 * Draws golden beveled hexagons, selection trails, word panels, and effects.
 */

import { CANVAS_W, CANVAS_H, COLORS, HexCell, HiddenWord, lerp } from './types';
import { HEX_SIZE, hexVertices } from './hex-grid';

/** Panel width for the word list on the right side */
export const PANEL_WIDTH = 260;

export class Renderer {
  private ctx: CanvasRenderingContext2D;

  constructor(ctx: CanvasRenderingContext2D) {
    this.ctx = ctx;
  }

  /** Draw the warm parchment background with subtle texture */
  drawBackground(): void {
    const ctx = this.ctx;

    // Base dark background
    const bgGrad = ctx.createRadialGradient(
      CANVAS_W / 2, CANVAS_H / 2, 100,
      CANVAS_W / 2, CANVAS_H / 2, 700,
    );
    bgGrad.addColorStop(0, '#2A2018');
    bgGrad.addColorStop(1, COLORS.bg);
    ctx.fillStyle = bgGrad;
    ctx.fillRect(0, 0, CANVAS_W, CANVAS_H);

    // Subtle warm light from center
    const light = ctx.createRadialGradient(
      (CANVAS_W - PANEL_WIDTH) / 2, CANVAS_H / 2, 30,
      (CANVAS_W - PANEL_WIDTH) / 2, CANVAS_H / 2, 400,
    );
    light.addColorStop(0, 'rgba(255,200,80,0.04)');
    light.addColorStop(1, 'rgba(0,0,0,0)');
    ctx.fillStyle = light;
    ctx.fillRect(0, 0, CANVAS_W, CANVAS_H);

    // Paper texture noise (subtle)
    ctx.save();
    ctx.globalAlpha = 0.02;
    for (let i = 0; i < 400; i++) {
      const x = Math.random() * CANVAS_W;
      const y = Math.random() * CANVAS_H;
      const s = Math.random() * 3;
      ctx.fillStyle = Math.random() > 0.5 ? '#FFD700' : '#000000';
      ctx.fillRect(x, y, s, s);
    }
    ctx.restore();
  }

  /** Draw a single hexagonal tile with metallic golden bevel */
  drawHex(
    cell: HexCell,
    isSelected: boolean,
    selectionIndex: number,
    isFoundWord: boolean,
    foundWordPulse: number,
    frameCount: number,
  ): void {
    const ctx = this.ctx;
    const { cx, cy } = cell;
    const ox = cell.shakeX || 0;
    const oy = cell.shakeY || 0;
    const x = cx + ox;
    const y = cy + oy;

    const verts = hexVertices(x, y, HEX_SIZE - 1);

    ctx.save();

    // Glow behind hex if selected or found
    if (isSelected || isFoundWord) {
      const glowColor = isFoundWord
        ? `rgba(255,215,0,${0.15 + foundWordPulse * 0.1})`
        : `rgba(255,200,80,${0.2 + (cell.selectPulse || 0) * 0.15})`;
      ctx.shadowColor = glowColor;
      ctx.shadowBlur = isFoundWord ? 15 + foundWordPulse * 10 : 12;
    }

    // Hex fill
    ctx.beginPath();
    ctx.moveTo(verts[0].x, verts[0].y);
    for (let i = 1; i < 6; i++) {
      ctx.lineTo(verts[i].x, verts[i].y);
    }
    ctx.closePath();

    // Metallic gradient fill
    let fillGrad: CanvasGradient;
    if (isFoundWord) {
      fillGrad = ctx.createLinearGradient(x - HEX_SIZE, y - HEX_SIZE, x + HEX_SIZE, y + HEX_SIZE);
      const shimmer = Math.sin(frameCount * 0.03 + x * 0.01) * 0.1 + 0.9;
      fillGrad.addColorStop(0, `rgba(180,140,40,${shimmer})`);
      fillGrad.addColorStop(0.3, `rgba(218,165,32,${shimmer})`);
      fillGrad.addColorStop(0.5, `rgba(255,223,100,${shimmer})`);
      fillGrad.addColorStop(0.7, `rgba(218,165,32,${shimmer})`);
      fillGrad.addColorStop(1, `rgba(160,120,30,${shimmer})`);
    } else if (isSelected) {
      fillGrad = ctx.createLinearGradient(x - HEX_SIZE, y - HEX_SIZE, x + HEX_SIZE, y + HEX_SIZE);
      fillGrad.addColorStop(0, '#6B5020');
      fillGrad.addColorStop(0.4, '#8B6508');
      fillGrad.addColorStop(0.6, '#B8860B');
      fillGrad.addColorStop(1, '#6B5020');
    } else {
      fillGrad = ctx.createLinearGradient(x - HEX_SIZE, y - HEX_SIZE, x + HEX_SIZE, y + HEX_SIZE);
      fillGrad.addColorStop(0, '#4A3520');
      fillGrad.addColorStop(0.3, '#5A4028');
      fillGrad.addColorStop(0.5, '#6B4E30');
      fillGrad.addColorStop(0.7, '#5A4028');
      fillGrad.addColorStop(1, '#3E2C18');
    }
    ctx.fillStyle = fillGrad;
    ctx.fill();

    // Reset shadow for border drawing
    ctx.shadowColor = 'transparent';
    ctx.shadowBlur = 0;

    // Beveled edges - light top-left, dark bottom-right
    // Top-left highlight (vertices 4,5,0)
    ctx.beginPath();
    ctx.moveTo(verts[4].x, verts[4].y);
    ctx.lineTo(verts[5].x, verts[5].y);
    ctx.lineTo(verts[0].x, verts[0].y);
    ctx.lineTo(verts[1].x, verts[1].y);
    ctx.strokeStyle = isFoundWord
      ? 'rgba(255,240,180,0.5)'
      : isSelected ? 'rgba(255,220,120,0.4)' : 'rgba(200,180,120,0.2)';
    ctx.lineWidth = 1.5;
    ctx.stroke();

    // Bottom-right shadow (vertices 1,2,3)
    ctx.beginPath();
    ctx.moveTo(verts[1].x, verts[1].y);
    ctx.lineTo(verts[2].x, verts[2].y);
    ctx.lineTo(verts[3].x, verts[3].y);
    ctx.lineTo(verts[4].x, verts[4].y);
    ctx.strokeStyle = isFoundWord
      ? 'rgba(80,60,20,0.5)'
      : isSelected ? 'rgba(40,30,10,0.5)' : 'rgba(20,15,5,0.4)';
    ctx.lineWidth = 1.5;
    ctx.stroke();

    // Main border
    ctx.beginPath();
    ctx.moveTo(verts[0].x, verts[0].y);
    for (let i = 1; i < 6; i++) {
      ctx.lineTo(verts[i].x, verts[i].y);
    }
    ctx.closePath();
    ctx.strokeStyle = isFoundWord
      ? COLORS.gold
      : isSelected ? COLORS.brassLight : COLORS.hexBorder;
    ctx.lineWidth = isFoundWord ? 2 : 1;
    ctx.stroke();

    // Letter with embossed effect
    const letter = cell.letter;
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';

    // Shadow (engraved look)
    ctx.font = 'bold 22px "Georgia", "Times New Roman", serif';
    ctx.fillStyle = 'rgba(0,0,0,0.5)';
    ctx.fillText(letter, x + 0.5, y + 1.5);

    // Main letter
    if (isFoundWord) {
      ctx.fillStyle = '#FFF8E1';
      ctx.shadowColor = 'rgba(255,215,0,0.4)';
      ctx.shadowBlur = 8;
    } else if (isSelected) {
      ctx.fillStyle = '#FFE0A0';
    } else {
      ctx.fillStyle = COLORS.parchment;
    }
    ctx.fillText(letter, x, y);

    // Highlight on letter (emboss top)
    ctx.shadowBlur = 0;
    ctx.shadowColor = 'transparent';
    ctx.fillStyle = isFoundWord
      ? 'rgba(255,255,240,0.3)'
      : 'rgba(255,255,240,0.1)';
    ctx.fillText(letter, x - 0.5, y - 0.5);

    ctx.restore();
  }

  /** Draw the selection trail connecting selected hexagons */
  drawSelectionTrail(selectedCells: HexCell[], frameCount: number): void {
    if (selectedCells.length < 2) return;
    const ctx = this.ctx;

    ctx.save();

    // Glowing trail line
    ctx.strokeStyle = 'rgba(255,215,0,0.4)';
    ctx.lineWidth = 6;
    ctx.lineCap = 'round';
    ctx.lineJoin = 'round';
    ctx.shadowColor = 'rgba(255,200,80,0.3)';
    ctx.shadowBlur = 10;

    ctx.beginPath();
    ctx.moveTo(selectedCells[0].cx, selectedCells[0].cy);

    for (let i = 1; i < selectedCells.length; i++) {
      const prev = selectedCells[i - 1];
      const curr = selectedCells[i];
      // Slight curve for calligraphic feel
      const mx = (prev.cx + curr.cx) / 2;
      const my = (prev.cy + curr.cy) / 2;
      const offset = Math.sin(frameCount * 0.05 + i) * 2;
      ctx.quadraticCurveTo(
        mx + offset,
        my + offset,
        curr.cx,
        curr.cy,
      );
    }

    ctx.stroke();

    // Inner bright line
    ctx.strokeStyle = 'rgba(255,240,180,0.6)';
    ctx.lineWidth = 2;
    ctx.shadowBlur = 0;

    ctx.beginPath();
    ctx.moveTo(selectedCells[0].cx, selectedCells[0].cy);
    for (let i = 1; i < selectedCells.length; i++) {
      const prev = selectedCells[i - 1];
      const curr = selectedCells[i];
      const mx = (prev.cx + curr.cx) / 2;
      const my = (prev.cy + curr.cy) / 2;
      const offset = Math.sin(frameCount * 0.05 + i) * 2;
      ctx.quadraticCurveTo(mx + offset, my + offset, curr.cx, curr.cy);
    }
    ctx.stroke();

    ctx.restore();
  }

  /** Draw the currently formed word above the grid */
  drawCurrentWord(word: string, isValid: boolean): void {
    if (!word) return;
    const ctx = this.ctx;

    const areaW = CANVAS_W - PANEL_WIDTH;

    ctx.save();
    ctx.font = 'bold 28px "Georgia", "Times New Roman", serif';
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';

    // Glow
    ctx.shadowColor = isValid ? 'rgba(255,215,0,0.5)' : 'rgba(200,180,120,0.3)';
    ctx.shadowBlur = 15;

    ctx.fillStyle = isValid ? COLORS.gold : COLORS.parchment;
    ctx.fillText(word, areaW / 2, 35);

    ctx.restore();
  }

  /** Draw the word list panel on the right side */
  drawWordPanel(
    hiddenWords: HiddenWord[],
    levelNum: number,
    elapsedTime: number,
    score: number,
    frameCount: number,
  ): void {
    const ctx = this.ctx;
    const panelX = CANVAS_W - PANEL_WIDTH;

    // Panel background
    const panelGrad = ctx.createLinearGradient(panelX, 0, CANVAS_W, 0);
    panelGrad.addColorStop(0, 'rgba(30,22,14,0.9)');
    panelGrad.addColorStop(1, 'rgba(20,15,10,0.95)');
    ctx.fillStyle = panelGrad;
    ctx.fillRect(panelX, 0, PANEL_WIDTH, CANVAS_H);

    // Panel left border
    ctx.strokeStyle = COLORS.brassDark;
    ctx.lineWidth = 2;
    ctx.beginPath();
    ctx.moveTo(panelX, 0);
    ctx.lineTo(panelX, CANVAS_H);
    ctx.stroke();

    // Highlight line
    ctx.strokeStyle = 'rgba(180,140,60,0.15)';
    ctx.lineWidth = 1;
    ctx.beginPath();
    ctx.moveTo(panelX + 1, 0);
    ctx.lineTo(panelX + 1, CANVAS_H);
    ctx.stroke();

    // Level title
    ctx.save();
    ctx.font = 'bold 20px "Georgia", serif';
    ctx.fillStyle = COLORS.gold;
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.fillText(`Livello ${levelNum}/12`, panelX + PANEL_WIDTH / 2, 35);
    ctx.restore();

    // Decorative line
    ctx.strokeStyle = COLORS.brassDark;
    ctx.lineWidth = 1;
    ctx.beginPath();
    ctx.moveTo(panelX + 30, 55);
    ctx.lineTo(panelX + PANEL_WIDTH - 30, 55);
    ctx.stroke();

    // Timer
    const m = Math.floor(elapsedTime / 60);
    const s = Math.floor(elapsedTime % 60);
    ctx.save();
    ctx.font = '15px "Georgia", serif';
    ctx.fillStyle = COLORS.parchmentDark;
    ctx.textAlign = 'center';
    ctx.fillText(`${m}:${s.toString().padStart(2, '0')}`, panelX + PANEL_WIDTH / 2, 75);
    ctx.restore();

    // Score
    ctx.save();
    ctx.font = '14px "Georgia", serif';
    ctx.fillStyle = COLORS.goldDim;
    ctx.textAlign = 'center';
    ctx.fillText(`${score} punti`, panelX + PANEL_WIDTH / 2, 95);
    ctx.restore();

    // Word list header
    ctx.save();
    ctx.font = 'italic 14px "Georgia", serif';
    ctx.fillStyle = COLORS.parchmentDark;
    ctx.textAlign = 'center';
    ctx.fillText('Parole da trovare', panelX + PANEL_WIDTH / 2, 125);
    ctx.restore();

    // Word list
    const startY = 155;
    const lineHeight = 36;

    hiddenWords.forEach((hw, i) => {
      const y = startY + i * lineHeight;

      ctx.save();

      if (hw.found) {
        // Found word - golden
        const pulse = Math.sin(frameCount * 0.02 + i * 0.5) * 0.1 + 0.9;

        ctx.font = 'bold 18px "Georgia", serif';
        ctx.fillStyle = COLORS.gold;
        ctx.globalAlpha = pulse;
        ctx.textAlign = 'left';
        ctx.fillText(hw.word, panelX + 25, y);

        // Checkmark
        ctx.fillStyle = COLORS.gold;
        ctx.font = '16px serif';
        ctx.fillText('\u2713', panelX + PANEL_WIDTH - 35, y);
      } else {
        // Hidden word - show blanks
        ctx.font = '18px "Georgia", serif';
        ctx.fillStyle = 'rgba(160,140,110,0.5)';
        ctx.textAlign = 'left';
        const blanks = hw.word.split('').map(() => '_').join(' ');
        ctx.fillText(blanks, panelX + 25, y);

        // Letter count
        ctx.font = '12px "Georgia", serif';
        ctx.fillStyle = 'rgba(140,120,90,0.4)';
        ctx.textAlign = 'right';
        ctx.fillText(`${hw.word.length}`, panelX + PANEL_WIDTH - 20, y);
      }

      ctx.restore();
    });

    // Progress bar at bottom
    const foundCount = hiddenWords.filter(w => w.found).length;
    const total = hiddenWords.length;
    const barY = CANVAS_H - 50;
    const barW = PANEL_WIDTH - 50;
    const barH = 8;
    const barX = panelX + 25;

    // Background
    ctx.fillStyle = 'rgba(60,45,30,0.6)';
    ctx.beginPath();
    ctx.roundRect(barX, barY, barW, barH, 4);
    ctx.fill();

    // Fill
    const progress = foundCount / total;
    if (progress > 0) {
      const fillGrad = ctx.createLinearGradient(barX, barY, barX + barW * progress, barY);
      fillGrad.addColorStop(0, COLORS.brassDark);
      fillGrad.addColorStop(0.5, COLORS.gold);
      fillGrad.addColorStop(1, COLORS.brassLight);
      ctx.fillStyle = fillGrad;
      ctx.beginPath();
      ctx.roundRect(barX, barY, barW * progress, barH, 4);
      ctx.fill();
    }

    // Progress text
    ctx.save();
    ctx.font = '12px "Georgia", serif';
    ctx.fillStyle = COLORS.parchmentDark;
    ctx.textAlign = 'center';
    ctx.fillText(`${foundCount} / ${total}`, panelX + PANEL_WIDTH / 2, barY + barH + 18);
    ctx.restore();
  }

  /** Draw found word glow paths on the grid */
  drawFoundWordPaths(
    hiddenWords: HiddenWord[],
    cells: HexCell[],
    frameCount: number,
  ): void {
    const ctx = this.ctx;

    for (const hw of hiddenWords) {
      if (!hw.found) continue;

      // Draw connecting line between found word cells
      const pathCells = hw.path.map(coord =>
        cells.find(c => c.row === coord.row && c.col === coord.col)
      ).filter(Boolean) as HexCell[];

      if (pathCells.length < 2) continue;

      ctx.save();
      const alpha = 0.15 + Math.sin(frameCount * 0.02) * 0.05;
      ctx.strokeStyle = `rgba(255,215,0,${alpha})`;
      ctx.lineWidth = 4;
      ctx.lineCap = 'round';
      ctx.lineJoin = 'round';

      ctx.beginPath();
      ctx.moveTo(pathCells[0].cx, pathCells[0].cy);
      for (let i = 1; i < pathCells.length; i++) {
        ctx.lineTo(pathCells[i].cx, pathCells[i].cy);
      }
      ctx.stroke();
      ctx.restore();
    }
  }
}
