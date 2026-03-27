// ─── Clue Board — Phase 2: Connect the Clues ─────────────────────────

import { type Clue, type Connection, GAME_W, GAME_H, COLORS } from './types';
import { roundRect } from './renderer';

// ─── Layout Constants ────────────────────────────────────────────────

const CARD_W = 170;
const CARD_H = 90;
const BOARD_PAD = 40;

interface CardLayout {
  clue: Clue;
  x: number;
  y: number;
  w: number;
  h: number;
}

interface PlayerConnection {
  fromId: string;
  toId: string;
  correct: boolean | null; // null = not validated yet
  animTime: number;
}

// ─── State ───────────────────────────────────────────────────────────

let cards: CardLayout[] = [];
let playerConnections: PlayerConnection[] = [];
let dragging: { fromId: string; mouseX: number; mouseY: number } | null = null;
let validatedCount = 0;
let wrongShakeTime = 0;
let wrongShakeId = '';
let boardAnimProgress = 0;
let allConnectionsMade = false;

// ─── Public API ──────────────────────────────────────────────────────

export function initClueBoard(clues: Clue[]): void {
  cards = layoutCards(clues);
  playerConnections = [];
  dragging = null;
  validatedCount = 0;
  wrongShakeTime = 0;
  wrongShakeId = '';
  boardAnimProgress = 0;
  allConnectionsMade = false;
}

export function isAllConnectionsMade(): boolean {
  return allConnectionsMade;
}

export function updateClueBoard(dt: number): void {
  boardAnimProgress = Math.min(1, boardAnimProgress + dt * 1.5);

  // Remove wrong connections after animation
  if (wrongShakeTime > 0) {
    wrongShakeTime -= dt;
    if (wrongShakeTime <= 0) {
      playerConnections = playerConnections.filter(c => c.correct !== false);
      wrongShakeId = '';
    }
  }
}

export function handleClueBoardMouseMove(mx: number, my: number): void {
  if (dragging) {
    dragging.mouseX = mx;
    dragging.mouseY = my;
  }
}

export function handleClueBoardClick(
  mx: number, my: number,
  requiredConnections: Connection[],
): 'connection-correct' | 'connection-wrong' | 'all-done' | null {
  // Check if clicking on a card
  for (const card of cards) {
    const cx = card.x;
    const cy = card.y;
    if (mx >= cx && mx <= cx + card.w && my >= cy && my <= cy + card.h) {
      if (!dragging) {
        // Start dragging from this card
        dragging = { fromId: card.clue.id, mouseX: mx, mouseY: my };
        return null;
      } else {
        // End dragging on this card
        const fromId = dragging.fromId;
        const toId = card.clue.id;
        dragging = null;

        if (fromId === toId) return null;

        // Check if this connection already exists
        const exists = playerConnections.some(
          c => (c.fromId === fromId && c.toId === toId) ||
               (c.fromId === toId && c.toId === fromId)
        );
        if (exists) return null;

        // Check if this is a correct connection
        const isCorrect = requiredConnections.some(
          rc => (rc.clueA === fromId && rc.clueB === toId) ||
                (rc.clueA === toId && rc.clueB === fromId)
        );

        playerConnections.push({
          fromId,
          toId,
          correct: isCorrect ? true : false,
          animTime: performance.now(),
        });

        if (isCorrect) {
          validatedCount++;
          if (validatedCount >= requiredConnections.length) {
            allConnectionsMade = true;
            return 'all-done';
          }
          return 'connection-correct';
        } else {
          wrongShakeTime = 1.0;
          wrongShakeId = `${fromId}-${toId}`;
          return 'connection-wrong';
        }
      }
    }
  }

  // Clicked on empty space — cancel drag
  dragging = null;
  return null;
}

export function drawClueBoard(
  ctx: CanvasRenderingContext2D,
  now: number,
  requiredConnectionCount: number,
): void {
  const alpha = Math.min(boardAnimProgress, 1);
  ctx.save();
  ctx.globalAlpha = alpha;

  // Dark background
  ctx.fillStyle = COLORS.boardBg;
  ctx.fillRect(0, 0, GAME_W, GAME_H);

  // Board title
  ctx.textAlign = 'center';
  ctx.font = 'bold 32px Georgia, serif';
  ctx.fillStyle = COLORS.mysteryText;
  ctx.fillText('COLLEGA GLI INDIZI', GAME_W / 2, 50);

  // Subtitle
  ctx.font = 'italic 16px Georgia, serif';
  ctx.fillStyle = 'rgba(200,200,220,0.6)';
  ctx.fillText(
    `Collega gli indizi correlati trascinando da una carta all'altra (${validatedCount}/${requiredConnectionCount})`,
    GAME_W / 2, 80,
  );

  // Draw connection lines (validated)
  for (const conn of playerConnections) {
    const cardA = cards.find(c => c.clue.id === conn.fromId);
    const cardB = cards.find(c => c.clue.id === conn.toId);
    if (!cardA || !cardB) continue;

    const ax = cardA.x + cardA.w / 2;
    const ay = cardA.y + cardA.h / 2;
    const bx = cardB.x + cardB.w / 2;
    const by = cardB.y + cardB.h / 2;

    let shakeX = 0;
    let shakeY = 0;
    if (conn.correct === false && wrongShakeTime > 0) {
      shakeX = Math.sin(now * 0.05) * 5 * wrongShakeTime;
      shakeY = Math.cos(now * 0.07) * 3 * wrongShakeTime;
    }

    ctx.save();
    ctx.strokeStyle = conn.correct === true
      ? COLORS.connectionGreen
      : COLORS.connectionWrong;
    ctx.lineWidth = 3;
    ctx.shadowColor = conn.correct === true
      ? COLORS.connectionGreen
      : COLORS.connectionWrong;
    ctx.shadowBlur = 10;
    ctx.globalAlpha = conn.correct === false ? Math.max(0, wrongShakeTime) : 0.8;
    ctx.beginPath();
    ctx.moveTo(ax + shakeX, ay + shakeY);
    ctx.lineTo(bx + shakeX, by + shakeY);
    ctx.stroke();
    ctx.restore();
  }

  // Draw dragging line
  if (dragging) {
    const fromCard = cards.find(c => c.clue.id === dragging!.fromId);
    if (fromCard) {
      ctx.save();
      ctx.strokeStyle = 'rgba(255,245,224,0.5)';
      ctx.lineWidth = 2;
      ctx.setLineDash([8, 8]);
      ctx.beginPath();
      ctx.moveTo(fromCard.x + fromCard.w / 2, fromCard.y + fromCard.h / 2);
      ctx.lineTo(dragging.mouseX, dragging.mouseY);
      ctx.stroke();
      ctx.setLineDash([]);
      ctx.restore();
    }
  }

  // Draw cards
  for (const card of cards) {
    const isSource = dragging?.fromId === card.clue.id;
    const isConnectedCorrectly = playerConnections.some(
      c => c.correct === true && (c.fromId === card.clue.id || c.toId === card.clue.id)
    );

    ctx.save();

    // Card background
    ctx.fillStyle = isSource ? '#3A3858' : COLORS.cardBg;
    roundRect(ctx, card.x, card.y, card.w, card.h, 8);
    ctx.fill();

    // Card border
    ctx.strokeStyle = isConnectedCorrectly
      ? COLORS.connectionGreen
      : isSource
        ? COLORS.clueHighlight
        : COLORS.cardBorder;
    ctx.lineWidth = isSource ? 2 : 1;
    roundRect(ctx, card.x, card.y, card.w, card.h, 8);
    ctx.stroke();

    // Clue icon (small magnifying glass)
    ctx.fillStyle = isConnectedCorrectly ? COLORS.connectionGreen : COLORS.clueHighlight;
    ctx.font = '14px sans-serif';
    ctx.textAlign = 'left';
    ctx.fillText('\uD83D\uDD0D', card.x + 10, card.y + 22);

    // Clue name
    ctx.font = 'bold 14px Georgia, serif';
    ctx.fillStyle = COLORS.mysteryText;
    ctx.textAlign = 'left';
    ctx.fillText(card.clue.name, card.x + 30, card.y + 22);

    // Clue description (word wrap)
    ctx.font = '11px Georgia, serif';
    ctx.fillStyle = 'rgba(200,200,220,0.7)';
    wrapText(ctx, card.clue.description, card.x + 10, card.y + 42, card.w - 20, 14);

    ctx.restore();
  }

  ctx.globalAlpha = 1;
  ctx.restore();
}

// ─── Helpers ─────────────────────────────────────────────────────────

function layoutCards(clues: Clue[]): CardLayout[] {
  const result: CardLayout[] = [];
  const count = clues.length;

  // Layout in 2 rows
  const cols = Math.ceil(count / 2);
  const totalW = cols * (CARD_W + 20) - 20;
  const startX = (GAME_W - totalW) / 2;
  const startY = 120;
  const rowGap = CARD_H + 250; // large gap for connection lines

  for (let i = 0; i < count; i++) {
    const row = Math.floor(i / cols);
    const col = i % cols;
    // For second row, offset slightly for visual interest
    const rowOffset = row === 1 ? (CARD_W + 20) / 2 * (count % 2 === 1 ? 0 : 0) : 0;
    const rowCols = row === 0 ? Math.min(cols, count) : count - cols;
    const rowTotalW = rowCols * (CARD_W + 20) - 20;
    const rowStartX = (GAME_W - rowTotalW) / 2;

    result.push({
      clue: clues[i],
      x: rowStartX + col * (CARD_W + 20) + rowOffset,
      y: startY + row * rowGap,
      w: CARD_W,
      h: CARD_H,
    });
  }

  return result;
}

function wrapText(
  ctx: CanvasRenderingContext2D,
  text: string,
  x: number, y: number,
  maxW: number, lineH: number,
): void {
  const words = text.split(' ');
  let line = '';
  let cy = y;

  for (const word of words) {
    const test = line + word + ' ';
    if (ctx.measureText(test).width > maxW && line.length > 0) {
      ctx.fillText(line.trim(), x, cy);
      line = word + ' ';
      cy += lineH;
    } else {
      line = test;
    }
  }
  if (line.trim()) {
    ctx.fillText(line.trim(), x, cy);
  }
}
