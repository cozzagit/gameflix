import {
  CANVAS_W, CANVAS_H, COLORS,
  SaveData, toRoman, easeOutCubic, easeInOutCubic,
} from './types';
import { LEVELS } from './levels';

/** Draws the title screen */
export function drawTitleScreen(
  ctx: CanvasRenderingContext2D,
  frameCount: number,
  saveData: SaveData
): void {
  // Background gradient
  const bgGrad = ctx.createRadialGradient(
    CANVAS_W / 2, CANVAS_H / 2, 100,
    CANVAS_W / 2, CANVAS_H / 2, 600
  );
  bgGrad.addColorStop(0, '#2A2218');
  bgGrad.addColorStop(1, COLORS.bg);
  ctx.fillStyle = bgGrad;
  ctx.fillRect(0, 0, CANVAS_W, CANVAS_H);

  // Subtle radial light
  const light = ctx.createRadialGradient(
    CANVAS_W / 2, CANVAS_H * 0.35, 20,
    CANVAS_W / 2, CANVAS_H * 0.35, 300
  );
  light.addColorStop(0, 'rgba(255,200,80,0.08)');
  light.addColorStop(1, 'rgba(0,0,0,0)');
  ctx.fillStyle = light;
  ctx.fillRect(0, 0, CANVAS_W, CANVAS_H);

  // Title
  const titleY = CANVAS_H * 0.28;
  const pulse = Math.sin(frameCount * 0.02) * 0.1 + 0.9;

  ctx.save();
  ctx.font = 'bold 72px "Georgia", "Times New Roman", serif';
  ctx.textAlign = 'center';
  ctx.textBaseline = 'middle';

  // Gold text shadow
  ctx.shadowColor = 'rgba(255,215,0,0.3)';
  ctx.shadowBlur = 30;

  // Gold gradient on text
  const titleGrad = ctx.createLinearGradient(CANVAS_W / 2 - 150, titleY - 30, CANVAS_W / 2 + 150, titleY + 30);
  titleGrad.addColorStop(0, '#C4A535');
  titleGrad.addColorStop(0.3, '#FFD700');
  titleGrad.addColorStop(0.5, '#FFECB3');
  titleGrad.addColorStop(0.7, '#FFD700');
  titleGrad.addColorStop(1, '#C4A535');
  ctx.fillStyle = titleGrad;
  ctx.globalAlpha = pulse;
  ctx.fillText('CRYPTEX', CANVAS_W / 2, titleY);
  ctx.globalAlpha = 1;
  ctx.restore();

  // Subtitle
  ctx.save();
  ctx.font = 'italic 20px "Georgia", "Times New Roman", serif';
  ctx.fillStyle = COLORS.parchmentDark;
  ctx.textAlign = 'center';
  ctx.textBaseline = 'middle';
  ctx.fillText('Il mistero delle parole perdute', CANVAS_W / 2, titleY + 50);
  ctx.restore();

  // Decorative line
  const lineY = titleY + 80;
  ctx.strokeStyle = COLORS.brassDark;
  ctx.lineWidth = 1;
  ctx.beginPath();
  ctx.moveTo(CANVAS_W / 2 - 120, lineY);
  ctx.lineTo(CANVAS_W / 2 + 120, lineY);
  ctx.stroke();

  // Diamond in center of line
  ctx.fillStyle = COLORS.brass;
  ctx.beginPath();
  ctx.moveTo(CANVAS_W / 2, lineY - 5);
  ctx.lineTo(CANVAS_W / 2 + 5, lineY);
  ctx.lineTo(CANVAS_W / 2, lineY + 5);
  ctx.lineTo(CANVAS_W / 2 - 5, lineY);
  ctx.closePath();
  ctx.fill();

  // Play button
  const btnW = 260;
  const btnH = 52;
  const btnX = CANVAS_W / 2 - btnW / 2;
  const btnY = CANVAS_H * 0.55;

  drawOrnateButton(ctx, btnX, btnY, btnW, btnH, 'Inizia il viaggio', true, frameCount);

  // Level select button
  const btn2Y = btnY + 70;
  drawOrnateButton(ctx, btnX, btn2Y, btnW, btnH, 'Seleziona livello', false, frameCount);

  // Stats
  const completedCount = Object.values(saveData.levels).filter(l => l.completed).length;
  const totalStars = Object.values(saveData.levels).reduce((s, l) => s + l.stars, 0);

  if (completedCount > 0) {
    ctx.save();
    ctx.font = '14px "Georgia", serif';
    ctx.fillStyle = COLORS.parchmentDark;
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.fillText(
      `${completedCount}/20 livelli completati  \u2022  ${totalStars} stelle  \u2022  ${saveData.totalScore} punti`,
      CANVAS_W / 2,
      CANVAS_H - 60
    );
    ctx.restore();
  }

  // Credits
  ctx.save();
  ctx.font = '11px "Georgia", serif';
  ctx.fillStyle = 'rgba(160,140,110,0.4)';
  ctx.textAlign = 'center';
  ctx.fillText('Gameflix WordForge', CANVAS_W / 2, CANVAS_H - 25);
  ctx.restore();
}

/** Draws the level select screen */
export function drawLevelSelect(
  ctx: CanvasRenderingContext2D,
  saveData: SaveData,
  frameCount: number
): { rects: { id: number; x: number; y: number; w: number; h: number }[]; backRect: { x: number; y: number; w: number; h: number } } {
  // Background
  const bgGrad = ctx.createRadialGradient(
    CANVAS_W / 2, CANVAS_H / 2, 100,
    CANVAS_W / 2, CANVAS_H / 2, 600
  );
  bgGrad.addColorStop(0, '#2A2218');
  bgGrad.addColorStop(1, COLORS.bg);
  ctx.fillStyle = bgGrad;
  ctx.fillRect(0, 0, CANVAS_W, CANVAS_H);

  // Title
  ctx.save();
  ctx.font = 'bold 36px "Georgia", "Times New Roman", serif';
  ctx.fillStyle = COLORS.gold;
  ctx.textAlign = 'center';
  ctx.textBaseline = 'middle';
  ctx.fillText('Seleziona Livello', CANVAS_W / 2, 55);
  ctx.restore();

  // Grid of levels: 5 columns x 4 rows
  const cols = 5;
  const cellW = 140;
  const cellH = 130;
  const gapX = 20;
  const gapY = 16;
  const gridW = cols * cellW + (cols - 1) * gapX;
  const startX = CANVAS_W / 2 - gridW / 2;
  const startY = 100;

  const rects: { id: number; x: number; y: number; w: number; h: number }[] = [];

  for (let i = 0; i < 20; i++) {
    const col = i % cols;
    const row = Math.floor(i / cols);
    const x = startX + col * (cellW + gapX);
    const y = startY + row * (cellH + gapY);
    const level = LEVELS[i];
    const progress = saveData.levels[level.id];
    const isUnlocked = i === 0 || saveData.levels[LEVELS[i - 1]?.id]?.completed;

    rects.push({ id: level.id, x, y, w: cellW, h: cellH });

    ctx.save();

    // Card background
    if (isUnlocked) {
      const cardGrad = ctx.createLinearGradient(x, y, x, y + cellH);
      cardGrad.addColorStop(0, 'rgba(60,45,30,0.8)');
      cardGrad.addColorStop(1, 'rgba(40,28,18,0.9)');
      ctx.fillStyle = cardGrad;
    } else {
      ctx.fillStyle = 'rgba(30,22,15,0.6)';
    }

    const r = 6;
    ctx.beginPath();
    ctx.moveTo(x + r, y);
    ctx.lineTo(x + cellW - r, y);
    ctx.arcTo(x + cellW, y, x + cellW, y + r, r);
    ctx.lineTo(x + cellW, y + cellH - r);
    ctx.arcTo(x + cellW, y + cellH, x + cellW - r, y + cellH, r);
    ctx.lineTo(x + r, y + cellH);
    ctx.arcTo(x, y + cellH, x, y + cellH - r, r);
    ctx.lineTo(x, y + r);
    ctx.arcTo(x, y, x + r, y, r);
    ctx.closePath();
    ctx.fill();

    // Border
    ctx.strokeStyle = isUnlocked
      ? (progress?.completed ? COLORS.brass : 'rgba(160,130,80,0.4)')
      : 'rgba(60,50,40,0.3)';
    ctx.lineWidth = progress?.completed ? 2 : 1;
    ctx.stroke();

    // Level number (Roman)
    ctx.font = 'bold 26px "Georgia", serif';
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.fillStyle = isUnlocked
      ? (progress?.completed ? COLORS.gold : COLORS.parchment)
      : 'rgba(80,60,40,0.4)';
    ctx.fillText(toRoman(level.id), x + cellW / 2, y + 30);

    // Word (or locked)
    ctx.font = 'italic 13px "Georgia", serif';
    ctx.fillStyle = isUnlocked ? COLORS.parchmentDark : 'rgba(80,60,40,0.3)';
    if (progress?.completed) {
      ctx.fillText(level.word, x + cellW / 2, y + 55);
    } else if (isUnlocked) {
      ctx.fillText(`${level.word.length} lettere`, x + cellW / 2, y + 55);
    } else {
      ctx.fillText('\uD83D\uDD12', x + cellW / 2, y + 55);
    }

    // Category
    ctx.font = '11px "Georgia", serif';
    ctx.fillStyle = 'rgba(160,140,110,0.4)';
    ctx.fillText(level.category, x + cellW / 2, y + 75);

    // Stars
    if (progress?.completed) {
      const starY = y + cellH - 25;
      for (let s = 0; s < 3; s++) {
        const starX = x + cellW / 2 + (s - 1) * 22;
        ctx.font = '16px serif';
        ctx.fillStyle = s < progress.stars ? COLORS.gold : 'rgba(80,60,40,0.3)';
        ctx.fillText('\u2605', starX, starY);
      }
    }

    // Score
    if (progress?.bestScore) {
      ctx.font = '11px "Georgia", serif';
      ctx.fillStyle = COLORS.parchmentDark;
      ctx.fillText(`${progress.bestScore} pt`, x + cellW / 2, y + cellH - 8);
    }

    ctx.restore();
  }

  // Back button
  const backW = 140;
  const backH = 40;
  const backX = CANVAS_W / 2 - backW / 2;
  const backY = CANVAS_H - 60;
  drawOrnateButton(ctx, backX, backY, backW, backH, '\u2190 Menu', false, frameCount);

  return {
    rects,
    backRect: { x: backX, y: backY, w: backW, h: backH }
  };
}

/** Draw level complete overlay */
export function drawLevelComplete(
  ctx: CanvasRenderingContext2D,
  word: string,
  clue: string,
  score: number,
  stars: number,
  time: number,
  usedHint: boolean,
  levelNum: number,
  isLastLevel: boolean,
  animProgress: number,
  frameCount: number
): { nextRect: { x: number; y: number; w: number; h: number }; menuRect: { x: number; y: number; w: number; h: number } } {
  const alpha = Math.min(animProgress * 2, 0.7);

  // Dark overlay
  ctx.fillStyle = `rgba(10,8,6,${alpha})`;
  ctx.fillRect(0, 0, CANVAS_W, CANVAS_H);

  if (animProgress < 0.2) {
    return {
      nextRect: { x: 0, y: 0, w: 0, h: 0 },
      menuRect: { x: 0, y: 0, w: 0, h: 0 }
    };
  }

  const cardAlpha = Math.min((animProgress - 0.2) / 0.3, 1);
  const cardScale = easeOutCubic(cardAlpha);

  ctx.save();
  ctx.globalAlpha = cardAlpha;
  ctx.translate(CANVAS_W / 2, CANVAS_H / 2);
  ctx.scale(cardScale, cardScale);
  ctx.translate(-CANVAS_W / 2, -CANVAS_H / 2);

  // Card
  const cardW = 440;
  const cardH = 380;
  const cx = CANVAS_W / 2 - cardW / 2;
  const cy = CANVAS_H / 2 - cardH / 2;
  const r = 12;

  // Card background
  const cardGrad = ctx.createLinearGradient(cx, cy, cx, cy + cardH);
  cardGrad.addColorStop(0, '#3A2A1A');
  cardGrad.addColorStop(1, '#1E140E');
  ctx.fillStyle = cardGrad;
  ctx.beginPath();
  ctx.moveTo(cx + r, cy);
  ctx.lineTo(cx + cardW - r, cy);
  ctx.arcTo(cx + cardW, cy, cx + cardW, cy + r, r);
  ctx.lineTo(cx + cardW, cy + cardH - r);
  ctx.arcTo(cx + cardW, cy + cardH, cx + cardW - r, cy + cardH, r);
  ctx.lineTo(cx + r, cy + cardH);
  ctx.arcTo(cx, cy + cardH, cx, cy + cardH - r, r);
  ctx.lineTo(cx, cy + r);
  ctx.arcTo(cx, cy, cx + r, cy, r);
  ctx.closePath();
  ctx.fill();

  // Gold border
  ctx.strokeStyle = COLORS.brass;
  ctx.lineWidth = 2;
  ctx.stroke();

  // "Risolto!" header
  ctx.font = 'bold 28px "Georgia", serif';
  ctx.fillStyle = COLORS.gold;
  ctx.textAlign = 'center';
  ctx.textBaseline = 'middle';
  ctx.shadowColor = 'rgba(255,215,0,0.3)';
  ctx.shadowBlur = 15;
  ctx.fillText('Cryptex Aperto!', CANVAS_W / 2, cy + 40);
  ctx.shadowBlur = 0;

  // Word
  ctx.font = 'bold 42px "Georgia", serif';
  ctx.fillStyle = COLORS.gold;
  ctx.fillText(word, CANVAS_W / 2, cy + 90);

  // Decorative line
  ctx.strokeStyle = COLORS.brassDark;
  ctx.lineWidth = 1;
  ctx.beginPath();
  ctx.moveTo(cx + 60, cy + 115);
  ctx.lineTo(cx + cardW - 60, cy + 115);
  ctx.stroke();

  // Clue echo
  ctx.font = 'italic 16px "Georgia", serif';
  ctx.fillStyle = COLORS.parchmentDark;
  ctx.fillText(`\u00AB ${clue} \u00BB`, CANVAS_W / 2, cy + 140);

  // Stars
  const starY = cy + 180;
  for (let s = 0; s < 3; s++) {
    const sx = CANVAS_W / 2 + (s - 1) * 40;
    ctx.font = '32px serif';
    ctx.fillStyle = s < stars ? COLORS.gold : 'rgba(80,60,40,0.4)';
    ctx.fillText('\u2605', sx, starY);
  }

  // Stats
  const statsY = cy + 220;
  ctx.font = '15px "Georgia", serif';
  ctx.fillStyle = COLORS.parchment;
  const m = Math.floor(time / 60);
  const sec = Math.floor(time % 60);
  ctx.fillText(`Tempo: ${m}:${sec.toString().padStart(2, '0')}`, CANVAS_W / 2, statsY);
  ctx.fillText(`Punteggio: ${score}`, CANVAS_W / 2, statsY + 24);
  if (usedHint) {
    ctx.font = 'italic 13px "Georgia", serif';
    ctx.fillStyle = 'rgba(180,160,130,0.6)';
    ctx.fillText('Suggerimento utilizzato', CANVAS_W / 2, statsY + 48);
  }

  ctx.restore();

  // Buttons (don't scale)
  ctx.save();
  ctx.globalAlpha = Math.min((animProgress - 0.4) / 0.3, 1);

  const btnW = 180;
  const btnH = 44;
  const btnGap = 20;
  const nextX = CANVAS_W / 2 - btnW - btnGap / 2;
  const menuX = CANVAS_W / 2 + btnGap / 2;
  const btnY = CANVAS_H / 2 + cardH / 2 - 70;

  if (!isLastLevel) {
    drawOrnateButton(ctx, nextX, btnY, btnW, btnH, 'Prossimo \u2192', true, frameCount);
  }
  drawOrnateButton(ctx, isLastLevel ? CANVAS_W / 2 - btnW / 2 : menuX, btnY, btnW, btnH, 'Menu', false, frameCount);

  ctx.restore();

  return {
    nextRect: isLastLevel ? { x: 0, y: 0, w: 0, h: 0 } : { x: nextX, y: btnY, w: btnW, h: btnH },
    menuRect: { x: isLastLevel ? CANVAS_W / 2 - btnW / 2 : menuX, y: btnY, w: btnW, h: btnH }
  };
}

/** Ornate button helper */
function drawOrnateButton(
  ctx: CanvasRenderingContext2D,
  x: number, y: number, w: number, h: number,
  text: string, primary: boolean, _frame: number
): void {
  const r = 6;

  ctx.save();

  // Shadow
  ctx.shadowColor = 'rgba(0,0,0,0.3)';
  ctx.shadowBlur = 8;
  ctx.shadowOffsetY = 3;

  // Background
  const grad = ctx.createLinearGradient(x, y, x, y + h);
  if (primary) {
    grad.addColorStop(0, COLORS.brassLight);
    grad.addColorStop(0.5, COLORS.brass);
    grad.addColorStop(1, COLORS.brassDark);
  } else {
    grad.addColorStop(0, 'rgba(80,60,40,0.7)');
    grad.addColorStop(1, 'rgba(50,35,22,0.8)');
  }

  ctx.beginPath();
  ctx.moveTo(x + r, y);
  ctx.lineTo(x + w - r, y);
  ctx.arcTo(x + w, y, x + w, y + r, r);
  ctx.lineTo(x + w, y + h - r);
  ctx.arcTo(x + w, y + h, x + w - r, y + h, r);
  ctx.lineTo(x + r, y + h);
  ctx.arcTo(x, y + h, x, y + h - r, r);
  ctx.lineTo(x, y + r);
  ctx.arcTo(x, y, x + r, y, r);
  ctx.closePath();

  ctx.fillStyle = grad;
  ctx.fill();

  ctx.shadowColor = 'transparent';

  // Border
  ctx.strokeStyle = primary ? COLORS.gold : COLORS.brassDark;
  ctx.lineWidth = 1;
  ctx.stroke();

  // Highlight line
  ctx.strokeStyle = primary ? 'rgba(255,255,200,0.2)' : 'rgba(255,255,200,0.05)';
  ctx.beginPath();
  ctx.moveTo(x + 8, y + 2);
  ctx.lineTo(x + w - 8, y + 2);
  ctx.stroke();

  // Text
  ctx.font = primary ? 'bold 17px "Georgia", serif' : '16px "Georgia", serif';
  ctx.fillStyle = primary ? COLORS.letterEngrave : COLORS.parchmentDark;
  ctx.textAlign = 'center';
  ctx.textBaseline = 'middle';
  ctx.fillText(text, x + w / 2, y + h / 2);

  ctx.restore();
}

/** Get title screen button rects */
export function getTitleButtonRects(): {
  play: { x: number; y: number; w: number; h: number };
  select: { x: number; y: number; w: number; h: number };
} {
  const btnW = 260;
  const btnH = 52;
  const btnX = CANVAS_W / 2 - btnW / 2;
  const btnY = CANVAS_H * 0.55;

  return {
    play: { x: btnX, y: btnY, w: btnW, h: btnH },
    select: { x: btnX, y: btnY + 70, w: btnW, h: btnH },
  };
}
