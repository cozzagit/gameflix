// ============================================================
// Machina — Screens (Title, Level Select, Level Complete)
// ============================================================

import { GAME_W, GAME_H, C, LevelProgress } from './types';
import {
  drawBackground, drawTitle, drawSubtitle, drawMetalPanel,
  drawCornerRivets, drawFrame, drawStars, drawBrushedMetal, drawRivet,
  drawGear, roundRect
} from './renderer';

const LEVEL_NAMES = [
  "L'Ingranaggio",
  'Le Leve',
  'I Tubi',
  'Il Pannello Scorrevole',
  'Gli Specchi',
  'La Cassaforte',
  'Il Circuito',
  'La Macchina Finale',
];

// ---- TITLE SCREEN ----

export function renderTitle(ctx: CanvasRenderingContext2D, time: number): void {
  drawBackground(ctx);

  // Decorative gears in background
  ctx.globalAlpha = 0.12;
  drawGear(ctx, 150, 200, 80, 60, 12, time * 0.2, C.BRONZE);
  drawGear(ctx, 1050, 600, 100, 75, 16, -time * 0.15, C.COPPER);
  drawGear(ctx, 200, 650, 60, 45, 10, time * 0.3, C.BRASS);
  drawGear(ctx, 1000, 150, 70, 52, 11, -time * 0.25, C.BRONZE);
  ctx.globalAlpha = 1;

  // Central panel
  drawMetalPanel(ctx, 300, 180, 600, 440, '#1E1E30', 12);
  drawFrame(ctx, 300, 180, 600, 440, 10);

  // Title
  drawTitle(ctx, 'MACHINA', GAME_W / 2, 280, 64, C.TEXT_GOLD);

  // Subtitle
  drawSubtitle(ctx, 'Rompicapi Meccanici', GAME_W / 2, 340, 22, C.TEXT_DIM);

  // Decorative line
  ctx.strokeStyle = C.BRONZE;
  ctx.lineWidth = 1;
  ctx.globalAlpha = 0.5;
  ctx.beginPath();
  ctx.moveTo(420, 370);
  ctx.lineTo(780, 370);
  ctx.stroke();
  ctx.globalAlpha = 1;

  // Decorative gear icon in center
  drawGear(ctx, GAME_W / 2, 430, 40, 30, 8, time * 0.5, C.BRONZE);

  // Play button
  const btnX = GAME_W / 2 - 120;
  const btnY = 510;
  const btnW = 240;
  const btnH = 50;
  drawMetalPanel(ctx, btnX, btnY, btnW, btnH, '#6B5210', 6);
  drawCornerRivets(ctx, btnX, btnY, btnW, btnH, 10, 3);

  ctx.textAlign = 'center';
  ctx.textBaseline = 'middle';
  ctx.font = 'bold 22px "Georgia", serif';
  ctx.fillStyle = C.WARM_LIGHT;
  ctx.fillText('GIOCA', GAME_W / 2, btnY + btnH / 2);

  // Credits
  drawSubtitle(ctx, '8 Rompicapi Meccanici da Risolvere', GAME_W / 2, 600, 14, C.TEXT_DIM);
}

export function hitTestTitlePlay(x: number, y: number): boolean {
  return x >= 480 && x <= 720 && y >= 510 && y <= 560;
}

// ---- LEVEL SELECT ----

const CARD_W = 240;
const CARD_H = 140;
const CARD_GAP = 30;
const COLS = 4;
const START_X = (GAME_W - (COLS * CARD_W + (COLS - 1) * CARD_GAP)) / 2;
const START_Y = 160;

export function renderLevelSelect(
  ctx: CanvasRenderingContext2D,
  progress: LevelProgress[],
  time: number
): void {
  drawBackground(ctx);

  // Title
  drawTitle(ctx, 'SELEZIONA LIVELLO', GAME_W / 2, 80, 36, C.TEXT_GOLD);

  // Decorative line
  ctx.strokeStyle = C.BRONZE;
  ctx.lineWidth = 1;
  ctx.globalAlpha = 0.4;
  ctx.beginPath();
  ctx.moveTo(350, 110);
  ctx.lineTo(850, 110);
  ctx.stroke();
  ctx.globalAlpha = 1;

  // Level cards
  for (let i = 0; i < 8; i++) {
    const col = i % COLS;
    const row = Math.floor(i / COLS);
    const cx = START_X + col * (CARD_W + CARD_GAP);
    const cy = START_Y + row * (CARD_H + CARD_GAP + 20);
    const p = progress[i];

    // Card panel
    const cardColor = p.unlocked
      ? (p.completed ? '#2A3A2A' : C.DARK_STEEL)
      : '#1A1A1A';
    drawMetalPanel(ctx, cx, cy, CARD_W, CARD_H, cardColor, 6);

    if (!p.unlocked) {
      // Lock icon
      ctx.globalAlpha = 0.3;
      ctx.textAlign = 'center';
      ctx.textBaseline = 'middle';
      ctx.font = '36px "Georgia", serif';
      ctx.fillStyle = C.RIVET_GREY;
      ctx.fillText('\u{1F512}', cx + CARD_W / 2, cy + CARD_H / 2 - 5);
      ctx.font = '12px "Georgia", serif';
      ctx.fillStyle = C.TEXT_DIM;
      ctx.fillText(LEVEL_NAMES[i], cx + CARD_W / 2, cy + CARD_H - 20);
      ctx.globalAlpha = 1;
      continue;
    }

    // Level number
    ctx.textAlign = 'left';
    ctx.textBaseline = 'top';
    ctx.font = 'bold 14px "Georgia", serif';
    ctx.fillStyle = C.BRONZE;
    ctx.fillText(`Livello ${i + 1}`, cx + 15, cy + 12);

    // Level name
    ctx.font = 'bold 18px "Georgia", serif';
    ctx.fillStyle = C.TEXT_GOLD;
    ctx.fillText(LEVEL_NAMES[i], cx + 15, cy + 34);

    // Small decorative gear
    drawGear(ctx, cx + CARD_W - 30, cy + 30, 15, 11, 6, time * (0.3 + i * 0.1), C.BRONZE);

    // Stars
    if (p.completed) {
      drawStars(ctx, cx + CARD_W / 2, cy + CARD_H - 25, p.stars, 3, 10);
    } else {
      ctx.textAlign = 'center';
      ctx.font = 'italic 12px "Georgia", serif';
      ctx.fillStyle = C.TEXT_DIM;
      ctx.fillText('Non completato', cx + CARD_W / 2, cy + CARD_H - 22);
    }

    // Corner rivets
    drawCornerRivets(ctx, cx, cy, CARD_W, CARD_H, 8, 2.5);
  }

  // Back button
  drawMetalPanel(ctx, 20, 20, 100, 36, '#3A3A4A', 4);
  ctx.textAlign = 'center';
  ctx.textBaseline = 'middle';
  ctx.font = '14px "Georgia", serif';
  ctx.fillStyle = C.TEXT_DIM;
  ctx.fillText('\u2190 Menu', 70, 38);
}

export function hitTestLevelCard(x: number, y: number): number {
  for (let i = 0; i < 8; i++) {
    const col = i % COLS;
    const row = Math.floor(i / COLS);
    const cx = START_X + col * (CARD_W + CARD_GAP);
    const cy = START_Y + row * (CARD_H + CARD_GAP + 20);
    if (x >= cx && x <= cx + CARD_W && y >= cy && y <= cy + CARD_H) {
      return i;
    }
  }
  return -1;
}

export function hitTestLevelSelectBack(x: number, y: number): boolean {
  return x >= 20 && x <= 120 && y >= 20 && y <= 56;
}

// ---- LEVEL COMPLETE ----

export function renderLevelComplete(
  ctx: CanvasRenderingContext2D,
  levelId: number,
  stars: number,
  moves: number,
  elapsed: number,
  time: number
): void {
  // Dim overlay
  ctx.fillStyle = 'rgba(0,0,0,0.6)';
  ctx.fillRect(0, 0, GAME_W, GAME_H);

  // Panel
  const pw = 500;
  const ph = 380;
  const px = (GAME_W - pw) / 2;
  const py = (GAME_H - ph) / 2;
  drawMetalPanel(ctx, px, py, pw, ph, '#1E1E30', 12);
  drawFrame(ctx, px, py, pw, ph, 8);

  // Title
  drawTitle(ctx, 'LIVELLO COMPLETATO!', GAME_W / 2, py + 50, 28, C.WARM_LIGHT);

  // Level name
  drawSubtitle(ctx, LEVEL_NAMES[levelId], GAME_W / 2, py + 90, 20, C.BRONZE);

  // Stars
  drawStars(ctx, GAME_W / 2, py + 140, stars, 3, 24);

  // Stats
  ctx.textAlign = 'center';
  ctx.textBaseline = 'middle';
  ctx.font = '16px "Georgia", serif';
  ctx.fillStyle = C.TEXT_DIM;
  const mins = Math.floor(elapsed / 60);
  const secs = Math.floor(elapsed % 60);
  ctx.fillText(`Mosse: ${moves}  |  Tempo: ${mins}:${secs.toString().padStart(2, '0')}`, GAME_W / 2, py + 190);

  // Decorative gears
  drawGear(ctx, px + 60, py + ph - 60, 25, 18, 7, time * 0.4, C.BRONZE);
  drawGear(ctx, px + pw - 60, py + ph - 60, 20, 15, 6, -time * 0.5, C.COPPER);

  // Buttons
  const btnW = 180;
  const btnH = 44;
  const btnGap = 20;

  // Next level button
  if (levelId < 7) {
    const nbx = GAME_W / 2 - btnW - btnGap / 2;
    const nby = py + 240;
    drawMetalPanel(ctx, nbx, nby, btnW, btnH, '#2A5A2A', 6);
    ctx.textAlign = 'center';
    ctx.font = 'bold 16px "Georgia", serif';
    ctx.fillStyle = C.WARM_LIGHT;
    ctx.fillText('Prossimo Livello', nbx + btnW / 2, nby + btnH / 2);

    const rbx = GAME_W / 2 + btnGap / 2;
    drawMetalPanel(ctx, rbx, nby, btnW, btnH, '#3A3A4A', 6);
    ctx.fillStyle = C.TEXT_DIM;
    ctx.fillText('Selezione Livelli', rbx + btnW / 2, nby + btnH / 2);
  } else {
    // Final level - show congratulations
    drawTitle(ctx, 'MACHINA COMPLETA!', GAME_W / 2, py + 240, 22, C.WARM_LIGHT);
    const rbx = GAME_W / 2 - btnW / 2;
    const rby = py + 290;
    drawMetalPanel(ctx, rbx, rby, btnW, btnH, '#3A3A4A', 6);
    ctx.textAlign = 'center';
    ctx.font = 'bold 16px "Georgia", serif';
    ctx.fillStyle = C.TEXT_DIM;
    ctx.fillText('Selezione Livelli', rbx + btnW / 2, rby + btnH / 2);
  }
}

export function hitTestCompleteNext(levelId: number, x: number, y: number): boolean {
  if (levelId >= 7) return false;
  const pw = 500;
  const py = (GAME_H - 380) / 2;
  const btnW = 180;
  const btnGap = 20;
  const nbx = GAME_W / 2 - btnW - btnGap / 2;
  const nby = py + 240;
  return x >= nbx && x <= nbx + btnW && y >= nby && y <= nby + 44;
}

export function hitTestCompleteLevels(levelId: number, x: number, y: number): boolean {
  const pw = 500;
  const ph = 380;
  const py = (GAME_H - ph) / 2;
  const btnW = 180;
  const btnH = 44;
  const btnGap = 20;
  if (levelId < 7) {
    const rbx = GAME_W / 2 + btnGap / 2;
    const rby = py + 240;
    return x >= rbx && x <= rbx + btnW && y >= rby && y <= rby + btnH;
  } else {
    const rbx = GAME_W / 2 - btnW / 2;
    const rby = py + 290;
    return x >= rbx && x <= rbx + btnW && y >= rby && y <= rby + btnH;
  }
}

/** Check if HUD back arrow was clicked */
export function hitTestHUDBack(x: number, y: number): boolean {
  return x >= 0 && x <= 50 && y >= 0 && y <= 50;
}
