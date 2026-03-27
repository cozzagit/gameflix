// ─── Screen Renderers ─────────────────────────────────────────────
// Title, Level Select, Level Complete, Game Complete screens

import { CANVAS_W, CANVAS_H, COLORS, FONTS, Button, SaveData, toRoman, easeOutCubic } from './types';
import { LEVELS } from './levels';
import { drawGlowText, drawTerminalText, drawPanel, drawStars, drawButton } from './renderer';
import { drawClassifiedStamp, drawRedactedText, drawMorseDecoration } from './effects';

// ─── Title Screen ─────────────────────────────────────────────────

export function drawTitleScreen(ctx: CanvasRenderingContext2D, time: number, buttons: Button[]): void {
  // Background grid
  ctx.save();
  ctx.strokeStyle = `${COLORS.greenDark}30`;
  ctx.lineWidth = 0.5;
  for (let x = 0; x < CANVAS_W; x += 40) {
    ctx.beginPath();
    ctx.moveTo(x, 0);
    ctx.lineTo(x, CANVAS_H);
    ctx.stroke();
  }
  for (let y = 0; y < CANVAS_H; y += 40) {
    ctx.beginPath();
    ctx.moveTo(0, y);
    ctx.lineTo(CANVAS_W, y);
    ctx.stroke();
  }
  ctx.restore();

  // Title
  const titlePulse = Math.sin(time * 1.5) * 0.1 + 0.9;
  ctx.save();
  ctx.globalAlpha = titlePulse;
  drawGlowText(ctx, 'CODICE', CANVAS_W / 2, 200, 72, COLORS.green);
  ctx.globalAlpha = 1;
  ctx.restore();

  // Subtitle
  drawTerminalText(ctx, 'SISTEMA DI DECRITTAZIONE', CANVAS_W / 2, 260, 16, COLORS.greenDim, 'center');

  // Typing effect for flavor text
  const flavorText = '> Inizializzazione protocollo di decodifica...';
  const visibleChars = Math.min(flavorText.length, Math.floor(time * 12) % (flavorText.length + 20));
  drawTerminalText(ctx, flavorText.substring(0, visibleChars), CANVAS_W / 2, 310, 14, COLORS.greenDark, 'center');

  // Classified stamp
  drawClassifiedStamp(ctx, CANVAS_W / 2 + 250, 180, -0.12, 0.8);

  // Redacted text decorations
  drawRedactedText(ctx, 100, 380, 200);
  drawRedactedText(ctx, 800, 400, 180);
  drawRedactedText(ctx, 150, 420, 250);

  // Cipher preview — rotating text
  const previewText = 'DPRUH KZXV JPLSV';
  ctx.save();
  ctx.font = `18px ${FONTS.mono}`;
  ctx.textAlign = 'center';
  ctx.fillStyle = COLORS.greenDark;
  ctx.globalAlpha = 0.4;
  for (let i = 0; i < previewText.length; i++) {
    const offset = Math.sin(time * 2 + i * 0.5) * 3;
    ctx.fillText(previewText[i], 350 + i * 18, 460 + offset);
  }
  ctx.globalAlpha = 1;
  ctx.restore();

  // Buttons
  for (const btn of buttons) {
    drawButton(ctx, btn);
  }

  // Version
  drawTerminalText(ctx, 'v1.0.0 // GAMEFLIX MYSTERIUM', CANVAS_W / 2, CANVAS_H - 30, 10, COLORS.greenDark, 'center');
}

// ─── Level Select Screen ──────────────────────────────────────────

export function drawLevelSelectScreen(
  ctx: CanvasRenderingContext2D,
  time: number,
  saveData: SaveData,
  buttons: Button[],
  hoveredLevel: number
): void {
  // Header
  drawGlowText(ctx, 'SELEZIONA MISSIONE', CANVAS_W / 2, 60, 32, COLORS.green);

  // Level grid (2 rows x 5 cols)
  const gridX = 80;
  const gridY = 120;
  const cardW = 190;
  const cardH = 250;
  const gapX = 20;
  const gapY = 20;

  for (let i = 0; i < LEVELS.length; i++) {
    const col = i % 5;
    const row = Math.floor(i / 5);
    const x = gridX + col * (cardW + gapX);
    const y = gridY + row * (cardH + gapY);
    const level = LEVELS[i];
    const progress = saveData.levels[level.id];
    const isCompleted = progress?.completed || false;
    const isUnlocked = i === 0 || saveData.levels[i]?.completed || false;
    const isHovered = hoveredLevel === i;

    // Card background
    ctx.save();
    ctx.fillStyle = isHovered ? COLORS.bgLight : COLORS.panelBg;
    ctx.fillRect(x, y, cardW, cardH);

    // Border
    ctx.strokeStyle = isCompleted ? COLORS.green : isUnlocked ? COLORS.greenDim : COLORS.greenDark;
    ctx.lineWidth = isHovered ? 2 : 1;
    ctx.strokeRect(x, y, cardW, cardH);

    if (isHovered && isUnlocked) {
      ctx.shadowColor = COLORS.greenGlow;
      ctx.shadowBlur = 15;
      ctx.strokeRect(x, y, cardW, cardH);
      ctx.shadowBlur = 0;
    }

    // Level number
    ctx.font = `bold 36px ${FONTS.mono}`;
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.fillStyle = isCompleted ? COLORS.green : isUnlocked ? COLORS.greenDim : COLORS.greenDark;
    ctx.fillText(toRoman(level.id), x + cardW / 2, y + 50);

    // Title
    ctx.font = `bold 13px ${FONTS.mono}`;
    ctx.fillStyle = isUnlocked ? COLORS.green : COLORS.greenDark;
    ctx.fillText(level.title, x + cardW / 2, y + 90);

    // Subtitle
    ctx.font = `10px ${FONTS.mono}`;
    ctx.fillStyle = COLORS.greenDark;
    const subtitle = isUnlocked ? level.subtitle : '???';
    ctx.fillText(subtitle, x + cardW / 2, y + 110);

    // Cipher type icon area
    if (isUnlocked) {
      ctx.font = `11px ${FONTS.mono}`;
      ctx.fillStyle = COLORS.greenDim;
      // Show encrypted preview
      const preview = level.encrypted.length > 18 ? level.encrypted.substring(0, 18) + '...' : level.encrypted;
      ctx.fillText(preview, x + cardW / 2, y + 150);
    } else {
      // Locked
      ctx.font = `30px ${FONTS.mono}`;
      ctx.fillStyle = COLORS.greenDark;
      ctx.fillText('\u{1F512}', x + cardW / 2, y + 150);
      // Redacted
      drawRedactedText(ctx, x + 20, y + 170, cardW - 40);
    }

    // Stars
    if (isCompleted && progress) {
      drawStars(ctx, x + cardW / 2, y + 195, progress.stars);
      // Best score
      ctx.font = `10px ${FONTS.mono}`;
      ctx.fillStyle = COLORS.amber;
      ctx.fillText(`${progress.bestScore} PT`, x + cardW / 2, y + 220);
    }

    // Difficulty dots
    ctx.fillStyle = COLORS.greenDark;
    const diff = Math.min(level.id, 5);
    for (let d = 0; d < 5; d++) {
      ctx.beginPath();
      ctx.arc(x + cardW / 2 - 24 + d * 12, y + cardH - 15, 3, 0, Math.PI * 2);
      ctx.fillStyle = d < diff ? COLORS.greenDim : COLORS.greenDark;
      ctx.fill();
    }

    ctx.restore();
  }

  // Back button
  for (const btn of buttons) {
    drawButton(ctx, btn);
  }
}

// ─── Level Complete Screen ────────────────────────────────────────

export function drawLevelCompleteScreen(
  ctx: CanvasRenderingContext2D,
  time: number,
  levelId: number,
  score: number,
  stars: number,
  timeElapsed: number,
  hintsUsed: number,
  answer: string,
  animProgress: number,
  buttons: Button[]
): void {
  // Darken background
  ctx.save();
  ctx.fillStyle = 'rgba(0,10,0,0.85)';
  ctx.fillRect(0, 0, CANVAS_W, CANVAS_H);
  ctx.restore();

  const progress = easeOutCubic(Math.min(1, animProgress));
  const panelH = 400 * progress;
  const panelY = CANVAS_H / 2 - panelH / 2;

  drawPanel(ctx, 250, panelY, 700, panelH, 'MESSAGGIO DECIFRATO');

  if (progress > 0.3) {
    const alpha = (progress - 0.3) / 0.7;
    ctx.save();
    ctx.globalAlpha = alpha;

    // Success header
    drawGlowText(ctx, 'DECRITTAZIONE RIUSCITA', CANVAS_W / 2, panelY + 50, 28, COLORS.green);

    // Decoded answer
    drawGlowText(ctx, answer, CANVAS_W / 2, panelY + 110, 42, COLORS.amber);

    // Stars
    drawStars(ctx, CANVAS_W / 2, panelY + 165, stars);

    // Stats
    const minutes = Math.floor(timeElapsed / 60);
    const seconds = Math.floor(timeElapsed % 60);
    const stats = [
      `TEMPO: ${String(minutes).padStart(2, '0')}:${String(seconds).padStart(2, '0')}`,
      `PUNTEGGIO: ${score}`,
      `SUGGERIMENTI: ${hintsUsed}`,
    ];

    ctx.font = `14px ${FONTS.mono}`;
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    stats.forEach((stat, i) => {
      ctx.fillStyle = COLORS.greenDim;
      ctx.fillText(stat, CANVAS_W / 2, panelY + 210 + i * 25);
    });

    // Score breakdown
    ctx.fillStyle = COLORS.greenDark;
    ctx.font = `11px ${FONTS.mono}`;
    const breakdown = [];
    breakdown.push('Base: 100');
    if (timeElapsed < 30) breakdown.push('Bonus velocita: +50');
    else if (timeElapsed < 60) breakdown.push('Bonus velocita: +25');
    if (hintsUsed === 0) breakdown.push('Bonus senza suggerimenti: +30');
    ctx.fillText(breakdown.join(' | '), CANVAS_W / 2, panelY + 300);

    // Buttons
    for (const btn of buttons) {
      drawButton(ctx, btn);
    }

    ctx.globalAlpha = 1;
    ctx.restore();
  }
}

// ─── Game Complete Screen ─────────────────────────────────────────

export function drawGameCompleteScreen(
  ctx: CanvasRenderingContext2D,
  time: number,
  totalScore: number,
  buttons: Button[]
): void {
  // Background
  ctx.save();
  ctx.fillStyle = 'rgba(0,10,0,0.9)';
  ctx.fillRect(0, 0, CANVAS_W, CANVAS_H);
  ctx.restore();

  // Title
  const pulse = Math.sin(time * 2) * 0.1 + 0.9;
  ctx.save();
  ctx.globalAlpha = pulse;
  drawGlowText(ctx, 'MISSIONE COMPLETATA', CANVAS_W / 2, 200, 48, COLORS.amber);
  ctx.globalAlpha = 1;
  ctx.restore();

  drawTerminalText(ctx, 'Tutti i codici sono stati decifrati.', CANVAS_W / 2, 270, 18, COLORS.greenDim, 'center');
  drawTerminalText(ctx, 'Sei un vero crittanalista!', CANVAS_W / 2, 300, 18, COLORS.greenDim, 'center');

  // Total score
  drawGlowText(ctx, `PUNTEGGIO TOTALE: ${totalScore}`, CANVAS_W / 2, 380, 28, COLORS.green);

  // Classified stamp
  drawClassifiedStamp(ctx, CANVAS_W / 2, 460, -0.08, 1.2);

  // Buttons
  for (const btn of buttons) {
    drawButton(ctx, btn);
  }

  // Flavor text
  const scrollText = '> Protocollo completato. Archivio classificato. Fine trasmissione.';
  const chars = Math.min(scrollText.length, Math.floor((time % 8) * 10));
  drawTerminalText(ctx, scrollText.substring(0, chars), CANVAS_W / 2, CANVAS_H - 60, 12, COLORS.greenDark, 'center');
}
