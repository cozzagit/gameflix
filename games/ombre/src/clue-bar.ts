// ─── Clue Bar UI (Bottom of Screen) ──────────────────────────────────

import { type Clue, GAME_W, GAME_H, COLORS } from './types';
import { roundRect, drawMagnifyingGlass } from './renderer';

const BAR_H = 70;
const BAR_Y = GAME_H - BAR_H;
const ICON_SIZE = 40;
const ICON_PAD = 12;

export function drawClueBar(
  ctx: CanvasRenderingContext2D,
  clues: Clue[],
  time: number,
): void {
  // Bar background
  ctx.save();
  ctx.fillStyle = 'rgba(10,10,20,0.85)';
  ctx.fillRect(0, BAR_Y, GAME_W, BAR_H);
  ctx.strokeStyle = 'rgba(124,58,237,0.4)';
  ctx.lineWidth = 1;
  ctx.beginPath();
  ctx.moveTo(0, BAR_Y);
  ctx.lineTo(GAME_W, BAR_Y);
  ctx.stroke();

  const found = clues.filter(c => c.found).length;
  const total = clues.length;

  // Clue count text
  ctx.font = '16px Georgia, serif';
  ctx.fillStyle = COLORS.mysteryText;
  ctx.textAlign = 'left';
  ctx.fillText(`Indizi: ${found}/${total}`, 20, BAR_Y + 25);

  // Draw clue icons
  const startX = 20;
  const iconY = BAR_Y + 40;

  clues.forEach((clue, i) => {
    const ix = startX + i * (ICON_SIZE + ICON_PAD);

    if (clue.found) {
      // Found - green box with check
      ctx.fillStyle = 'rgba(16,185,129,0.2)';
      roundRect(ctx, ix, iconY, ICON_SIZE, ICON_SIZE * 0.6, 4);
      ctx.fill();
      ctx.strokeStyle = COLORS.foundClue;
      ctx.lineWidth = 1;
      roundRect(ctx, ix, iconY, ICON_SIZE, ICON_SIZE * 0.6, 4);
      ctx.stroke();

      // Mini check
      ctx.strokeStyle = COLORS.foundClue;
      ctx.lineWidth = 2;
      ctx.beginPath();
      ctx.moveTo(ix + 10, iconY + 13);
      ctx.lineTo(ix + 17, iconY + 19);
      ctx.lineTo(ix + 30, iconY + 7);
      ctx.stroke();
    } else {
      // Not found - dim box with ?
      ctx.fillStyle = 'rgba(60,60,80,0.3)';
      roundRect(ctx, ix, iconY, ICON_SIZE, ICON_SIZE * 0.6, 4);
      ctx.fill();
      ctx.strokeStyle = 'rgba(100,100,120,0.4)';
      ctx.lineWidth = 1;
      roundRect(ctx, ix, iconY, ICON_SIZE, ICON_SIZE * 0.6, 4);
      ctx.stroke();

      ctx.font = '14px Georgia, serif';
      ctx.fillStyle = 'rgba(100,100,120,0.6)';
      ctx.textAlign = 'center';
      ctx.fillText('?', ix + ICON_SIZE / 2, iconY + 18);
    }
  });

  // "CASO RISOLTO!" if all found
  if (found === total && total > 0) {
    const pulse = 0.7 + Math.sin(time * 0.004) * 0.3;
    ctx.font = 'bold 20px Georgia, serif';
    ctx.textAlign = 'right';
    ctx.fillStyle = `rgba(255,215,0,${pulse})`;
    ctx.fillText('CASO RISOLTO!', GAME_W - 20, BAR_Y + 30);
  } else {
    // Timer display
    ctx.font = '14px Georgia, serif';
    ctx.textAlign = 'right';
    ctx.fillStyle = 'rgba(200,200,220,0.5)';
  }

  ctx.restore();
}

export function getClueBarHeight(): number {
  return BAR_H;
}
