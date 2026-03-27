// ─── Renderer ─────────────────────────────────────────────────────
// All drawing routines for Codice: CRT screen, cipher tools, typewriter input

import { CANVAS_W, CANVAS_H, COLORS, FONTS, ALPHABET, LevelDef, Button } from './types';
import { buildKeywordAlphabet, getMorseMap, frequencyAnalysis } from './ciphers';
import { drawPhosphorGlow, drawScreenGlow } from './effects';

// ─── Terminal Text ────────────────────────────────────────────────

export function drawTerminalText(
  ctx: CanvasRenderingContext2D,
  text: string,
  x: number,
  y: number,
  size: number = 20,
  color: string = COLORS.green,
  align: CanvasTextAlign = 'left'
): void {
  ctx.save();
  ctx.font = `${size}px ${FONTS.mono}`;
  ctx.fillStyle = color;
  ctx.textAlign = align;
  ctx.textBaseline = 'middle';
  ctx.shadowColor = color;
  ctx.shadowBlur = 6;
  ctx.fillText(text, x, y);
  ctx.shadowBlur = 0;
  ctx.restore();
}

export function drawGlowText(
  ctx: CanvasRenderingContext2D,
  text: string,
  x: number,
  y: number,
  size: number,
  color: string = COLORS.green,
  align: CanvasTextAlign = 'center'
): void {
  ctx.save();
  ctx.font = `bold ${size}px ${FONTS.mono}`;
  ctx.textAlign = align;
  ctx.textBaseline = 'middle';
  // Glow layers
  ctx.shadowColor = color;
  ctx.shadowBlur = 20;
  ctx.fillStyle = color;
  ctx.fillText(text, x, y);
  ctx.shadowBlur = 10;
  ctx.fillText(text, x, y);
  ctx.shadowBlur = 0;
  ctx.fillStyle = '#ffffff';
  ctx.globalAlpha = 0.3;
  ctx.fillText(text, x, y);
  ctx.globalAlpha = 1;
  ctx.restore();
}

// ─── Panel Drawing ────────────────────────────────────────────────

export function drawPanel(ctx: CanvasRenderingContext2D, x: number, y: number, w: number, h: number, label?: string): void {
  ctx.save();
  // Background
  ctx.fillStyle = COLORS.panelBg;
  ctx.fillRect(x, y, w, h);
  // Border
  ctx.strokeStyle = COLORS.panelBorder;
  ctx.lineWidth = 1.5;
  ctx.strokeRect(x, y, w, h);
  // Corner accents
  const cs = 8;
  ctx.strokeStyle = COLORS.greenDim;
  ctx.lineWidth = 2;
  // Top-left
  ctx.beginPath();
  ctx.moveTo(x, y + cs);
  ctx.lineTo(x, y);
  ctx.lineTo(x + cs, y);
  ctx.stroke();
  // Top-right
  ctx.beginPath();
  ctx.moveTo(x + w - cs, y);
  ctx.lineTo(x + w, y);
  ctx.lineTo(x + w, y + cs);
  ctx.stroke();
  // Bottom-left
  ctx.beginPath();
  ctx.moveTo(x, y + h - cs);
  ctx.lineTo(x, y + h);
  ctx.lineTo(x + cs, y + h);
  ctx.stroke();
  // Bottom-right
  ctx.beginPath();
  ctx.moveTo(x + w - cs, y + h);
  ctx.lineTo(x + w, y + h);
  ctx.lineTo(x + w, y + h - cs);
  ctx.stroke();

  if (label) {
    ctx.font = `10px ${FONTS.mono}`;
    ctx.fillStyle = COLORS.greenDark;
    ctx.textAlign = 'left';
    ctx.textBaseline = 'top';
    ctx.fillText(label, x + 12, y + 4);
  }
  ctx.restore();
}

// ─── Encrypted Message Display ────────────────────────────────────

export function drawEncryptedMessage(ctx: CanvasRenderingContext2D, encrypted: string, time: number): void {
  const panelX = 80;
  const panelY = 100;
  const panelW = CANVAS_W - 160;
  const panelH = 100;

  drawPanel(ctx, panelX, panelY, panelW, panelH, 'MESSAGGIO CIFRATO');
  drawScreenGlow(ctx, panelX, panelY, panelW, panelH);

  // Encrypted text with per-character glow animation
  ctx.save();
  const fontSize = encrypted.length > 30 ? 22 : encrypted.length > 20 ? 28 : 34;
  ctx.font = `bold ${fontSize}px ${FONTS.mono}`;
  ctx.textAlign = 'center';
  ctx.textBaseline = 'middle';

  const textY = panelY + panelH / 2 + 5;
  const totalWidth = ctx.measureText(encrypted).width;
  let charX = CANVAS_W / 2 - totalWidth / 2;

  for (let i = 0; i < encrypted.length; i++) {
    const ch = encrypted[i];
    const charW = ctx.measureText(ch).width;
    const pulse = Math.sin(time * 2 + i * 0.3) * 0.15 + 0.85;
    ctx.fillStyle = COLORS.green;
    ctx.globalAlpha = pulse;
    ctx.shadowColor = COLORS.greenGlow;
    ctx.shadowBlur = 8;
    ctx.fillText(ch, charX + charW / 2, textY);
    ctx.shadowBlur = 0;
    ctx.globalAlpha = 1;
    charX += charW;
  }
  ctx.restore();
}

// ─── Typewriter Input ─────────────────────────────────────────────

export function drawTypewriterInput(
  ctx: CanvasRenderingContext2D,
  input: string,
  answer: string,
  cursorBlink: boolean,
  time: number
): void {
  const panelX = 200;
  const panelY = CANVAS_H - 130;
  const panelW = CANVAS_W - 400;
  const panelH = 60;

  drawPanel(ctx, panelX, panelY, panelW, panelH, 'INSERISCI RISPOSTA');

  ctx.save();
  const fontSize = 30;
  ctx.font = `bold ${fontSize}px ${FONTS.mono}`;
  ctx.textBaseline = 'middle';

  const textY = panelY + panelH / 2 + 2;
  const charWidth = ctx.measureText('M').width;
  const totalChars = answer.length;
  const startX = CANVAS_W / 2 - (totalChars * charWidth) / 2;

  // Draw answer slots
  for (let i = 0; i < totalChars; i++) {
    const slotX = startX + i * charWidth;

    // Underline for each slot
    ctx.strokeStyle = COLORS.greenDark;
    ctx.lineWidth = 2;
    ctx.beginPath();
    ctx.moveTo(slotX, textY + 18);
    ctx.lineTo(slotX + charWidth - 4, textY + 18);
    ctx.stroke();

    if (i < input.length) {
      const ch = input[i].toUpperCase();
      const isCorrect = ch === answer[i].toUpperCase();
      ctx.fillStyle = isCorrect ? COLORS.green : COLORS.red;
      ctx.shadowColor = isCorrect ? COLORS.greenGlow : COLORS.red;
      ctx.shadowBlur = isCorrect ? 10 : 4;
      ctx.textAlign = 'center';
      ctx.fillText(ch, slotX + charWidth / 2 - 2, textY);
      ctx.shadowBlur = 0;
    }
  }

  // Cursor
  if (cursorBlink && input.length < totalChars) {
    const cursorX = startX + input.length * charWidth;
    ctx.fillStyle = COLORS.green;
    ctx.globalAlpha = 0.7 + Math.sin(time * 6) * 0.3;
    ctx.fillRect(cursorX, textY - 14, 3, 28);
    ctx.globalAlpha = 1;
  }

  ctx.restore();
}

// ─── Caesar Cipher Wheel ──────────────────────────────────────────

export function drawCaesarWheel(
  ctx: CanvasRenderingContext2D,
  cx: number,
  cy: number,
  shift: number,
  highlightLetter?: string,
  rotation: number = 0
): void {
  const outerR = 120;
  const innerR = 85;

  // Outer ring (plaintext)
  ctx.save();
  ctx.beginPath();
  ctx.arc(cx, cy, outerR, 0, Math.PI * 2);
  ctx.strokeStyle = COLORS.greenDim;
  ctx.lineWidth = 2;
  ctx.stroke();

  ctx.beginPath();
  ctx.arc(cx, cy, outerR - 2, 0, Math.PI * 2);
  ctx.arc(cx, cy, innerR + 16, 0, Math.PI * 2);
  ctx.fillStyle = COLORS.panelBg;
  ctx.fill('evenodd');

  // Outer letters (fixed alphabet)
  ctx.font = `bold 14px ${FONTS.mono}`;
  ctx.textAlign = 'center';
  ctx.textBaseline = 'middle';
  for (let i = 0; i < 26; i++) {
    const angle = (i / 26) * Math.PI * 2 - Math.PI / 2;
    const lx = cx + Math.cos(angle) * (outerR - 10);
    const ly = cy + Math.sin(angle) * (outerR - 10);
    const letter = ALPHABET[i];
    const isHighlight = highlightLetter && letter === highlightLetter.toUpperCase();
    ctx.fillStyle = isHighlight ? COLORS.amber : COLORS.green;
    if (isHighlight) {
      ctx.shadowColor = COLORS.amber;
      ctx.shadowBlur = 8;
    }
    ctx.fillText(letter, lx, ly);
    ctx.shadowBlur = 0;
  }

  // Inner ring (shifted alphabet) — rotates
  ctx.beginPath();
  ctx.arc(cx, cy, innerR + 14, 0, Math.PI * 2);
  ctx.arc(cx, cy, innerR - 16, 0, Math.PI * 2);
  ctx.fillStyle = '#0d2a0d';
  ctx.fill('evenodd');

  ctx.strokeStyle = COLORS.greenDark;
  ctx.lineWidth = 1.5;
  ctx.beginPath();
  ctx.arc(cx, cy, innerR + 14, 0, Math.PI * 2);
  ctx.stroke();

  const animShift = shift + rotation;
  for (let i = 0; i < 26; i++) {
    const angle = ((i + animShift) / 26) * Math.PI * 2 - Math.PI / 2;
    const lx = cx + Math.cos(angle) * innerR;
    const ly = cy + Math.sin(angle) * innerR;
    ctx.fillStyle = COLORS.amber;
    ctx.font = `bold 13px ${FONTS.mono}`;
    ctx.fillText(ALPHABET[i], lx, ly);
  }

  // Center hub
  ctx.beginPath();
  ctx.arc(cx, cy, 20, 0, Math.PI * 2);
  ctx.fillStyle = COLORS.bgLight;
  ctx.fill();
  ctx.strokeStyle = COLORS.greenDim;
  ctx.lineWidth = 2;
  ctx.stroke();

  // Center dot
  ctx.beginPath();
  ctx.arc(cx, cy, 4, 0, Math.PI * 2);
  ctx.fillStyle = COLORS.green;
  ctx.fill();

  // Tick marks
  for (let i = 0; i < 26; i++) {
    const angle = (i / 26) * Math.PI * 2 - Math.PI / 2;
    ctx.beginPath();
    ctx.moveTo(cx + Math.cos(angle) * (outerR - 2), cy + Math.sin(angle) * (outerR - 2));
    ctx.lineTo(cx + Math.cos(angle) * (outerR + 3), cy + Math.sin(angle) * (outerR + 3));
    ctx.strokeStyle = COLORS.greenDark;
    ctx.lineWidth = 1;
    ctx.stroke();
  }

  ctx.restore();
}

// ─── Mirror Reflection ────────────────────────────────────────────

export function drawMirror(ctx: CanvasRenderingContext2D, cx: number, cy: number, text: string, time: number): void {
  ctx.save();
  // Mirror frame
  const w = 260;
  const h = 160;
  ctx.strokeStyle = COLORS.greenDim;
  ctx.lineWidth = 3;
  ctx.strokeRect(cx - w / 2, cy - h / 2, w, h);

  // Inner frame
  ctx.strokeStyle = COLORS.greenDark;
  ctx.lineWidth = 1;
  ctx.strokeRect(cx - w / 2 + 5, cy - h / 2 + 5, w - 10, h - 10);

  // Reflection line
  ctx.setLineDash([4, 4]);
  ctx.strokeStyle = COLORS.greenDim;
  ctx.lineWidth = 1;
  ctx.beginPath();
  ctx.moveTo(cx, cy - h / 2 + 10);
  ctx.lineTo(cx, cy + h / 2 - 10);
  ctx.stroke();
  ctx.setLineDash([]);

  // Original text (left side, reversed)
  ctx.font = `bold 24px ${FONTS.mono}`;
  ctx.textAlign = 'center';
  ctx.textBaseline = 'middle';
  ctx.fillStyle = COLORS.greenDim;
  ctx.save();
  ctx.translate(cx - 65, cy);
  ctx.scale(-1, 1);
  ctx.fillText(text, 0, 0);
  ctx.restore();

  // Arrow
  const arrowPulse = Math.sin(time * 3) * 5;
  ctx.fillStyle = COLORS.amber;
  ctx.beginPath();
  ctx.moveTo(cx - 10 + arrowPulse, cy);
  ctx.lineTo(cx + 10 + arrowPulse, cy - 8);
  ctx.lineTo(cx + 10 + arrowPulse, cy + 8);
  ctx.closePath();
  ctx.fill();

  // "SPECCHIO" label
  ctx.font = `10px ${FONTS.mono}`;
  ctx.fillStyle = COLORS.greenDark;
  ctx.textAlign = 'center';
  ctx.fillText('SPECCHIO', cx, cy - h / 2 - 8);

  ctx.restore();
}

// ─── Number Grid (A1Z26) ─────────────────────────────────────────

export function drawNumberGrid(ctx: CanvasRenderingContext2D, x: number, y: number, highlightNums?: number[]): void {
  const cellSize = 32;
  const cols = 13;
  const rows = 2;

  drawPanel(ctx, x - 10, y - 10, cols * cellSize + 20, rows * cellSize + 30, 'A1Z26');

  ctx.save();
  ctx.font = `12px ${FONTS.mono}`;
  ctx.textAlign = 'center';
  ctx.textBaseline = 'middle';

  for (let i = 0; i < 26; i++) {
    const col = i % cols;
    const row = Math.floor(i / cols);
    const cx = x + col * cellSize + cellSize / 2;
    const cy = y + row * cellSize + cellSize / 2 + 10;
    const num = i + 1;
    const isHighlight = highlightNums && highlightNums.includes(num);

    // Cell
    ctx.strokeStyle = isHighlight ? COLORS.amber : COLORS.greenDark;
    ctx.lineWidth = isHighlight ? 2 : 1;
    ctx.strokeRect(x + col * cellSize, y + row * cellSize + 10, cellSize, cellSize);

    if (isHighlight) {
      ctx.fillStyle = 'rgba(255,176,0,0.1)';
      ctx.fillRect(x + col * cellSize, y + row * cellSize + 10, cellSize, cellSize);
    }

    // Number
    ctx.fillStyle = isHighlight ? COLORS.amber : COLORS.greenDim;
    ctx.font = `bold 11px ${FONTS.mono}`;
    ctx.fillText(String(num), cx, cy - 6);
    // Letter
    ctx.fillStyle = isHighlight ? COLORS.green : COLORS.greenDark;
    ctx.font = `10px ${FONTS.mono}`;
    ctx.fillText(ALPHABET[i], cx, cy + 7);
  }
  ctx.restore();
}

// ─── Substitution Table ───────────────────────────────────────────

export function drawSubstitutionTable(
  ctx: CanvasRenderingContext2D,
  x: number,
  y: number,
  keyword: string,
  highlightPair?: [string, string]
): void {
  const sub = buildKeywordAlphabet(keyword);
  const cellW = 28;
  const cellH = 28;
  const visibleCols = Math.min(26, Math.floor((CANVAS_W - x - 40) / cellW));

  drawPanel(ctx, x - 10, y - 10, visibleCols * cellW + 20, cellH * 2 + 40, `CHIAVE: ${keyword}`);

  ctx.save();
  ctx.font = `bold 12px ${FONTS.mono}`;
  ctx.textAlign = 'center';
  ctx.textBaseline = 'middle';

  // Header labels
  ctx.fillStyle = COLORS.greenDark;
  ctx.font = `9px ${FONTS.mono}`;
  ctx.textAlign = 'right';
  ctx.fillText('CHIARO:', x - 14, y + cellH / 2 + 10);
  ctx.fillText('CIFRA:', x - 14, y + cellH + cellH / 2 + 10);

  ctx.font = `bold 12px ${FONTS.mono}`;
  ctx.textAlign = 'center';

  for (let i = 0; i < visibleCols; i++) {
    const cx = x + i * cellW + cellW / 2;
    const isHighlight = highlightPair &&
      (ALPHABET[i] === highlightPair[0] || sub[i] === highlightPair[1]);

    // Plaintext row
    ctx.strokeStyle = isHighlight ? COLORS.amber : COLORS.greenDark;
    ctx.lineWidth = isHighlight ? 2 : 1;
    ctx.strokeRect(x + i * cellW, y + 10, cellW, cellH);
    ctx.fillStyle = isHighlight ? COLORS.amber : COLORS.green;
    ctx.fillText(ALPHABET[i], cx, y + cellH / 2 + 10);

    // Ciphertext row
    ctx.strokeRect(x + i * cellW, y + cellH + 10, cellW, cellH);
    ctx.fillStyle = isHighlight ? COLORS.green : COLORS.amber;
    ctx.fillText(sub[i], cx, y + cellH + cellH / 2 + 10);

    // Arrow
    ctx.fillStyle = COLORS.greenDark;
    ctx.font = `8px ${FONTS.mono}`;
    ctx.fillText('|', cx, y + cellH + 8);
    ctx.font = `bold 12px ${FONTS.mono}`;
  }
  ctx.restore();
}

// ─── Morse Code Reference ─────────────────────────────────────────

export function drawMorseReference(ctx: CanvasRenderingContext2D, x: number, y: number, highlightLetter?: string): void {
  const morseMap = getMorseMap();
  const cols = 7;
  const cellW = 90;
  const cellH = 20;

  drawPanel(ctx, x - 10, y - 10, cols * cellW + 20, Math.ceil(26 / cols) * cellH + 30, 'CODICE MORSE');

  ctx.save();
  ctx.font = `11px ${FONTS.mono}`;
  ctx.textAlign = 'left';
  ctx.textBaseline = 'middle';

  for (let i = 0; i < 26; i++) {
    const col = i % cols;
    const row = Math.floor(i / cols);
    const cx = x + col * cellW;
    const cy = y + row * cellH + cellH / 2 + 10;
    const letter = ALPHABET[i];
    const morse = morseMap[letter];
    const isHighlight = highlightLetter && letter === highlightLetter.toUpperCase();

    ctx.fillStyle = isHighlight ? COLORS.amber : COLORS.greenDim;
    ctx.font = `bold 12px ${FONTS.mono}`;
    ctx.fillText(letter, cx, cy);
    ctx.font = `11px ${FONTS.mono}`;
    ctx.fillStyle = isHighlight ? COLORS.green : COLORS.greenDark;
    ctx.fillText(` ${morse}`, cx + 14, cy);
  }
  ctx.restore();
}

// ─── Atbash Mirror Alphabet ───────────────────────────────────────

export function drawAtbashTable(ctx: CanvasRenderingContext2D, x: number, y: number, highlightLetter?: string): void {
  const cellW = 28;
  const visibleCols = Math.min(26, Math.floor((CANVAS_W - x - 40) / cellW));

  drawPanel(ctx, x - 10, y - 10, visibleCols * cellW + 20, 80, 'ATBASH — ALFABETO INVERSO');

  ctx.save();
  ctx.font = `bold 12px ${FONTS.mono}`;
  ctx.textAlign = 'center';
  ctx.textBaseline = 'middle';

  for (let i = 0; i < visibleCols; i++) {
    const cx = x + i * cellW + cellW / 2;
    const mirror = ALPHABET[25 - i];
    const isHighlight = highlightLetter &&
      (ALPHABET[i] === highlightLetter.toUpperCase() || mirror === highlightLetter.toUpperCase());

    // Top row
    ctx.strokeStyle = isHighlight ? COLORS.amber : COLORS.greenDark;
    ctx.lineWidth = isHighlight ? 2 : 1;
    ctx.strokeRect(x + i * cellW, y + 10, cellW, 26);
    ctx.fillStyle = isHighlight ? COLORS.amber : COLORS.green;
    ctx.fillText(ALPHABET[i], cx, y + 23);

    // Arrow
    ctx.fillStyle = COLORS.greenDark;
    ctx.fillText('\u2195', cx, y + 40);

    // Bottom row
    ctx.strokeRect(x + i * cellW, y + 46, cellW, 26);
    ctx.fillStyle = isHighlight ? COLORS.green : COLORS.amber;
    ctx.fillText(mirror, cx, y + 59);
  }
  ctx.restore();
}

// ─── Vigenere Grid ────────────────────────────────────────────────

export function drawVigenereGrid(
  ctx: CanvasRenderingContext2D,
  x: number,
  y: number,
  key: string,
  highlightRow?: number,
  highlightCol?: number
): void {
  const cellSize = 18;
  const visibleSize = 16; // Show partial grid
  const panelW = (visibleSize + 1) * cellSize + 20;
  const panelH = Math.min(10, key.length + 4) * cellSize + 30;

  drawPanel(ctx, x - 10, y - 10, panelW, panelH, `VIGENERE — CHIAVE: ${key}`);

  ctx.save();
  ctx.font = `9px ${FONTS.mono}`;
  ctx.textAlign = 'center';
  ctx.textBaseline = 'middle';

  // Column headers
  for (let c = 0; c < visibleSize; c++) {
    const cx = x + (c + 1) * cellSize + cellSize / 2;
    ctx.fillStyle = highlightCol === c ? COLORS.amber : COLORS.greenDim;
    ctx.font = `bold 10px ${FONTS.mono}`;
    ctx.fillText(ALPHABET[c], cx, y + cellSize / 2 + 10);
  }

  // Show rows for key letters
  const keyLetters = key.toUpperCase().split('');
  const uniqueRows = [...new Set(keyLetters)];

  for (let r = 0; r < Math.min(uniqueRows.length + 2, 8); r++) {
    const rowIdx = r < uniqueRows.length ? ALPHABET.indexOf(uniqueRows[r]) : r;
    const ry = y + (r + 1) * cellSize + cellSize / 2 + 10;

    // Row header
    ctx.fillStyle = highlightRow === rowIdx ? COLORS.amber : COLORS.greenDim;
    ctx.font = `bold 10px ${FONTS.mono}`;
    ctx.fillText(ALPHABET[rowIdx], x + cellSize / 2, ry);

    // Row cells
    ctx.font = `9px ${FONTS.mono}`;
    for (let c = 0; c < visibleSize; c++) {
      const cx = x + (c + 1) * cellSize + cellSize / 2;
      const letter = ALPHABET[(rowIdx + c) % 26];
      const isHighlight = highlightRow === rowIdx && highlightCol === c;

      if (isHighlight) {
        ctx.fillStyle = 'rgba(255,176,0,0.2)';
        ctx.fillRect(x + (c + 1) * cellSize, y + (r + 1) * cellSize + 10, cellSize, cellSize);
        ctx.fillStyle = COLORS.amber;
        ctx.font = `bold 10px ${FONTS.mono}`;
      } else {
        ctx.fillStyle = COLORS.greenDark;
        ctx.font = `9px ${FONTS.mono}`;
      }
      ctx.fillText(letter, cx, ry);
    }
  }

  // Grid lines
  ctx.strokeStyle = `${COLORS.greenDark}40`;
  ctx.lineWidth = 0.5;
  for (let c = 0; c <= visibleSize + 1; c++) {
    ctx.beginPath();
    ctx.moveTo(x + c * cellSize, y + 10);
    ctx.lineTo(x + c * cellSize, y + panelH - 20);
    ctx.stroke();
  }

  ctx.restore();
}

// ─── Frequency Analysis Chart ─────────────────────────────────────

export function drawFrequencyChart(ctx: CanvasRenderingContext2D, x: number, y: number, text: string): void {
  const freq = frequencyAnalysis(text);
  const maxCount = Math.max(1, ...Object.values(freq));
  const barW = 14;
  const maxH = 60;
  const usedLetters = ALPHABET.split('').filter((ch) => freq[ch] > 0);

  if (usedLetters.length === 0) return;

  const panelW = usedLetters.length * (barW + 3) + 30;
  drawPanel(ctx, x - 10, y - 10, panelW, maxH + 40, 'FREQUENZA');

  ctx.save();
  ctx.font = `8px ${FONTS.mono}`;
  ctx.textAlign = 'center';
  ctx.textBaseline = 'top';

  usedLetters.forEach((ch, i) => {
    const bx = x + i * (barW + 3);
    const bh = (freq[ch] / maxCount) * maxH;
    const by = y + maxH - bh + 10;

    ctx.fillStyle = COLORS.greenDim;
    ctx.fillRect(bx, by, barW, bh);

    ctx.fillStyle = COLORS.green;
    ctx.fillText(ch, bx + barW / 2, y + maxH + 14);
    ctx.fillStyle = COLORS.greenDark;
    ctx.fillText(String(freq[ch]), bx + barW / 2, by - 10);
  });
  ctx.restore();
}

// ─── Multi-step Progress ──────────────────────────────────────────

export function drawMultiStepProgress(
  ctx: CanvasRenderingContext2D,
  x: number,
  y: number,
  steps: { description: string; completed: boolean }[],
  currentStep: number
): void {
  drawPanel(ctx, x - 10, y - 10, 350, steps.length * 30 + 30, 'PASSAGGI');

  ctx.save();
  ctx.font = `12px ${FONTS.mono}`;
  ctx.textAlign = 'left';
  ctx.textBaseline = 'middle';

  steps.forEach((step, i) => {
    const sy = y + i * 30 + 20;
    const isCurrent = i === currentStep;
    const isCompleted = step.completed;

    // Status indicator
    ctx.fillStyle = isCompleted ? COLORS.green : isCurrent ? COLORS.amber : COLORS.greenDark;
    ctx.font = `bold 14px ${FONTS.mono}`;
    ctx.fillText(isCompleted ? '[OK]' : isCurrent ? '[>>]' : '[  ]', x, sy);

    // Description
    ctx.fillStyle = isCompleted ? COLORS.greenDim : isCurrent ? COLORS.green : COLORS.greenDark;
    ctx.font = `12px ${FONTS.mono}`;
    ctx.fillText(step.description, x + 50, sy);
  });
  ctx.restore();
}

// ─── Button ───────────────────────────────────────────────────────

export function drawButton(ctx: CanvasRenderingContext2D, btn: Button): void {
  ctx.save();
  const isHovered = btn.hovered;

  // Background
  ctx.fillStyle = isHovered ? COLORS.greenDark : COLORS.panelBg;
  ctx.fillRect(btn.x, btn.y, btn.w, btn.h);

  // Border
  ctx.strokeStyle = isHovered ? COLORS.green : COLORS.greenDim;
  ctx.lineWidth = isHovered ? 2 : 1;
  ctx.strokeRect(btn.x, btn.y, btn.w, btn.h);

  // Glow on hover
  if (isHovered) {
    ctx.shadowColor = COLORS.greenGlow;
    ctx.shadowBlur = 10;
    ctx.strokeRect(btn.x, btn.y, btn.w, btn.h);
    ctx.shadowBlur = 0;
  }

  // Label
  ctx.fillStyle = isHovered ? COLORS.green : COLORS.greenDim;
  ctx.font = `bold 14px ${FONTS.mono}`;
  ctx.textAlign = 'center';
  ctx.textBaseline = 'middle';
  ctx.fillText(btn.label, btn.x + btn.w / 2, btn.y + btn.h / 2);

  ctx.restore();
}

// ─── Stars Display ────────────────────────────────────────────────

export function drawStars(ctx: CanvasRenderingContext2D, x: number, y: number, count: number, max: number = 3): void {
  ctx.save();
  ctx.font = `24px ${FONTS.mono}`;
  ctx.textAlign = 'center';
  ctx.textBaseline = 'middle';
  for (let i = 0; i < max; i++) {
    ctx.fillStyle = i < count ? COLORS.amber : COLORS.greenDark;
    ctx.fillText(i < count ? '\u2605' : '\u2606', x + i * 30 - ((max - 1) * 15), y);
  }
  ctx.restore();
}

// ─── HUD ──────────────────────────────────────────────────────────

export function drawHUD(
  ctx: CanvasRenderingContext2D,
  levelNum: number,
  levelTitle: string,
  score: number,
  timeElapsed: number,
  hintsUsed: number
): void {
  ctx.save();

  // Top bar
  ctx.fillStyle = 'rgba(0,10,0,0.8)';
  ctx.fillRect(0, 0, CANVAS_W, 40);
  ctx.strokeStyle = COLORS.greenDark;
  ctx.lineWidth = 1;
  ctx.beginPath();
  ctx.moveTo(0, 40);
  ctx.lineTo(CANVAS_W, 40);
  ctx.stroke();

  // Level info
  ctx.font = `bold 14px ${FONTS.mono}`;
  ctx.fillStyle = COLORS.green;
  ctx.textAlign = 'left';
  ctx.textBaseline = 'middle';
  ctx.fillText(`LIVELLO ${levelNum}: ${levelTitle}`, 20, 20);

  // Timer
  const minutes = Math.floor(timeElapsed / 60);
  const seconds = Math.floor(timeElapsed % 60);
  const timeStr = `${String(minutes).padStart(2, '0')}:${String(seconds).padStart(2, '0')}`;
  ctx.fillStyle = COLORS.greenDim;
  ctx.textAlign = 'center';
  ctx.fillText(timeStr, CANVAS_W / 2, 20);

  // Score
  ctx.fillStyle = COLORS.amber;
  ctx.textAlign = 'right';
  ctx.fillText(`PUNTI: ${score}`, CANVAS_W - 20, 20);

  // Hints indicator
  if (hintsUsed > 0) {
    ctx.fillStyle = COLORS.greenDark;
    ctx.font = `11px ${FONTS.mono}`;
    ctx.fillText(`SUGGERIMENTI: ${hintsUsed}`, CANVAS_W - 200, 20);
  }

  ctx.restore();
}

// ─── Level Tool Description ───────────────────────────────────────

export function drawToolDescription(ctx: CanvasRenderingContext2D, text: string): void {
  ctx.save();
  ctx.font = `12px ${FONTS.mono}`;
  ctx.fillStyle = COLORS.greenDim;
  ctx.textAlign = 'center';
  ctx.textBaseline = 'middle';
  ctx.fillText(text, CANVAS_W / 2, 80);
  ctx.restore();
}
