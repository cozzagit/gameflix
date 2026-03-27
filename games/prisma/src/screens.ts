import { LevelProgress } from './types';

const TITLE_BG = '#0a0a1e';

/** Draw the title screen */
export function drawTitleScreen(ctx: CanvasRenderingContext2D, w: number, h: number, time: number): void {
  ctx.fillStyle = TITLE_BG;
  ctx.fillRect(0, 0, w, h);

  // Animated background beams
  ctx.save();
  const beamCount = 8;
  for (let i = 0; i < beamCount; i++) {
    const angle = (i / beamCount) * Math.PI * 2 + time * 0.3;
    const cx = w / 2;
    const cy = h / 2 - 40;
    const len = 400;
    const colors = ['#ff3333', '#33ff33', '#3333ff', '#ffff33', '#ff33ff', '#33ffff', '#ffffff', '#ff8833'];
    const color = colors[i % colors.length];

    ctx.strokeStyle = color;
    ctx.globalAlpha = 0.12 + Math.sin(time * 2 + i) * 0.05;
    ctx.lineWidth = 3;
    ctx.shadowColor = color;
    ctx.shadowBlur = 20;
    ctx.beginPath();
    ctx.moveTo(cx, cy);
    ctx.lineTo(cx + Math.cos(angle) * len, cy + Math.sin(angle) * len);
    ctx.stroke();
  }
  ctx.restore();

  // Prism in center
  ctx.save();
  const pcx = w / 2;
  const pcy = h / 2 - 60;
  const ps = 60;
  ctx.translate(pcx, pcy);

  // Triangle
  ctx.beginPath();
  ctx.moveTo(0, -ps);
  ctx.lineTo(-ps, ps * 0.8);
  ctx.lineTo(ps, ps * 0.8);
  ctx.closePath();

  const grad = ctx.createLinearGradient(-ps, 0, ps, 0);
  grad.addColorStop(0, 'rgba(255, 50, 50, 0.4)');
  grad.addColorStop(0.33, 'rgba(50, 255, 50, 0.4)');
  grad.addColorStop(0.67, 'rgba(50, 50, 255, 0.4)');
  grad.addColorStop(1, 'rgba(255, 50, 255, 0.4)');
  ctx.fillStyle = grad;
  ctx.fill();
  ctx.strokeStyle = 'rgba(200, 220, 255, 0.8)';
  ctx.lineWidth = 3;
  ctx.stroke();
  ctx.restore();

  // Title
  ctx.save();
  ctx.shadowColor = '#6688ff';
  ctx.shadowBlur = 30;
  ctx.fillStyle = '#ffffff';
  ctx.font = 'bold 56px sans-serif';
  ctx.textAlign = 'center';
  ctx.textBaseline = 'middle';
  ctx.fillText('PRISMA', w / 2, h / 2 + 40);
  ctx.shadowBlur = 0;

  // Subtitle
  ctx.fillStyle = '#6688aa';
  ctx.font = '18px sans-serif';
  ctx.fillText('Puzzle di luce e colore', w / 2, h / 2 + 75);

  // Start button
  const btnY = h / 2 + 120;
  ctx.fillStyle = '#3355aa';
  roundRect(ctx, w / 2 - 80, btnY, 160, 45, 10);
  ctx.fill();
  ctx.fillStyle = '#ffffff';
  ctx.font = 'bold 18px sans-serif';
  ctx.fillText('GIOCA', w / 2, btnY + 22);

  ctx.restore();
}

/** Check title screen button hits */
export function getTitleButton(sx: number, sy: number, w: number, h: number): string | null {
  const btnY = h / 2 + 120;
  if (sx >= w / 2 - 80 && sx <= w / 2 + 80 && sy >= btnY && sy <= btnY + 45) {
    return 'play';
  }
  return null;
}

/** Draw level select screen */
export function drawLevelSelect(
  ctx: CanvasRenderingContext2D,
  w: number,
  h: number,
  progress: Map<number, LevelProgress>,
  time: number,
): void {
  ctx.fillStyle = TITLE_BG;
  ctx.fillRect(0, 0, w, h);

  // Title
  ctx.fillStyle = '#ffffff';
  ctx.font = 'bold 32px sans-serif';
  ctx.textAlign = 'center';
  ctx.textBaseline = 'middle';
  ctx.fillText('Seleziona Livello', w / 2, 50);

  // Level grid (2 rows x 5 cols)
  const cols = 5;
  const rows = 2;
  const btnW = 140;
  const btnH = 90;
  const gap = 20;
  const totalW = cols * btnW + (cols - 1) * gap;
  const totalH = rows * btnH + (rows - 1) * gap;
  const startX = (w - totalW) / 2;
  const startY = (h - totalH) / 2 + 10;

  for (let i = 0; i < 10; i++) {
    const row = Math.floor(i / cols);
    const col = i % cols;
    const x = startX + col * (btnW + gap);
    const y = startY + row * (btnH + gap);
    const levelNum = i + 1;
    const prog = progress.get(levelNum);
    const unlocked = levelNum === 1 || progress.has(levelNum - 1);

    // Button bg
    if (unlocked) {
      ctx.fillStyle = prog?.completed ? '#1a3355' : '#1a2244';
    } else {
      ctx.fillStyle = '#111122';
    }
    roundRect(ctx, x, y, btnW, btnH, 8);
    ctx.fill();

    // Border
    ctx.strokeStyle = unlocked ? (prog?.completed ? '#3366aa' : '#2244aa') : '#222233';
    ctx.lineWidth = 2;
    roundRect(ctx, x, y, btnW, btnH, 8);
    ctx.stroke();

    // Level number
    ctx.fillStyle = unlocked ? '#ffffff' : '#444455';
    ctx.font = 'bold 24px sans-serif';
    ctx.textAlign = 'center';
    ctx.fillText(`${levelNum}`, x + btnW / 2, y + 30);

    // Stars
    if (prog?.completed) {
      ctx.font = '18px sans-serif';
      ctx.fillStyle = '#ffcc44';
      let starStr = '';
      for (let s = 0; s < 3; s++) {
        starStr += s < (prog.stars || 0) ? '\u2605' : '\u2606';
      }
      ctx.fillText(starStr, x + btnW / 2, y + 58);
    } else if (!unlocked) {
      ctx.fillStyle = '#333344';
      ctx.font = '20px sans-serif';
      ctx.fillText('\u{1F512}', x + btnW / 2, y + 58);
    }
  }

  // Back button
  ctx.fillStyle = '#333355';
  roundRect(ctx, w / 2 - 60, h - 70, 120, 40, 8);
  ctx.fill();
  ctx.fillStyle = '#aabbcc';
  ctx.font = 'bold 14px sans-serif';
  ctx.fillText('Indietro', w / 2, h - 50);
}

/** Check level select screen button hits */
export function getLevelSelectButton(
  sx: number,
  sy: number,
  w: number,
  h: number,
  progress: Map<number, LevelProgress>,
): { type: 'level'; level: number } | { type: 'back' } | null {
  // Check back button
  if (sx >= w / 2 - 60 && sx <= w / 2 + 60 && sy >= h - 70 && sy <= h - 30) {
    return { type: 'back' };
  }

  // Check level buttons
  const cols = 5;
  const btnW = 140;
  const btnH = 90;
  const gap = 20;
  const totalW = cols * btnW + (cols - 1) * gap;
  const totalH = 2 * btnH + gap;
  const startX = (w - totalW) / 2;
  const startY = (h - totalH) / 2 + 10;

  for (let i = 0; i < 10; i++) {
    const row = Math.floor(i / cols);
    const col = i % cols;
    const x = startX + col * (btnW + gap);
    const y = startY + row * (btnH + gap);
    const levelNum = i + 1;
    const unlocked = levelNum === 1 || progress.has(levelNum - 1);

    if (unlocked && sx >= x && sx <= x + btnW && sy >= y && sy <= y + btnH) {
      return { type: 'level', level: levelNum };
    }
  }

  return null;
}

function roundRect(ctx: CanvasRenderingContext2D, x: number, y: number, w: number, h: number, r: number): void {
  ctx.beginPath();
  ctx.moveTo(x + r, y);
  ctx.arcTo(x + w, y, x + w, y + h, r);
  ctx.arcTo(x + w, y + h, x, y + h, r);
  ctx.arcTo(x, y + h, x, y, r);
  ctx.arcTo(x, y, x + w, y, r);
  ctx.closePath();
}
