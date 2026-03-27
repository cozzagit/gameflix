// ─── Screens: Title, Level Select, Case Solved ──────────────────────

import { GAME_W, GAME_H, COLORS, type LevelProgress } from './types';
import { TOTAL_LEVELS } from './scenes/index';
import { roundRect, drawTextShadow } from './renderer';

// ─── Title Screen ────────────────────────────────────────────────────

export function drawTitleScreen(ctx: CanvasRenderingContext2D, time: number): void {
  // Dark background with subtle warmth
  const bg = ctx.createRadialGradient(GAME_W / 2, GAME_H / 2 - 50, 100, GAME_W / 2, GAME_H / 2, 600);
  bg.addColorStop(0, '#1E1828');
  bg.addColorStop(0.5, '#110E18');
  bg.addColorStop(1, '#06060A');
  ctx.fillStyle = bg;
  ctx.fillRect(0, 0, GAME_W, GAME_H);

  // Atmospheric particles (more visible)
  ctx.fillStyle = 'rgba(255,245,224,0.08)';
  for (let i = 0; i < 40; i++) {
    const px = (Math.sin(time * 0.0003 + i * 1.7) * 0.5 + 0.5) * GAME_W;
    const py = (Math.cos(time * 0.0004 + i * 2.3) * 0.5 + 0.5) * GAME_H;
    ctx.beginPath();
    ctx.arc(px, py, 1 + Math.sin(time * 0.002 + i) * 0.5, 0, Math.PI * 2);
    ctx.fill();
  }

  // Flashlight beam effect on title — sweeping across
  const beamX = GAME_W / 2 + Math.sin(time * 0.0008) * 150;
  const beamY = 280 + Math.cos(time * 0.001) * 40;
  const beamGrad = ctx.createRadialGradient(beamX, beamY, 0, beamX, beamY, 300);
  beamGrad.addColorStop(0, 'rgba(255,245,224,0.15)');
  beamGrad.addColorStop(0.4, 'rgba(255,245,224,0.05)');
  beamGrad.addColorStop(1, 'rgba(255,245,224,0)');
  ctx.fillStyle = beamGrad;
  ctx.fillRect(0, 0, GAME_W, GAME_H);

  // Title
  const titlePulse = 0.8 + Math.sin(time * 0.002) * 0.2;
  ctx.save();
  ctx.textAlign = 'center';
  ctx.font = 'bold 80px Georgia, serif';
  ctx.fillStyle = 'rgba(0,0,0,0.5)';
  ctx.fillText('OMBRE', GAME_W / 2 + 3, 300 + 3);
  ctx.fillStyle = `rgba(232,213,183,${titlePulse})`;
  ctx.fillText('OMBRE', GAME_W / 2, 300);

  // Subtitle
  ctx.font = 'italic 24px Georgia, serif';
  ctx.fillStyle = `rgba(124,58,237,${titlePulse * 0.8})`;
  ctx.fillText('Ogni ombra nasconde un segreto', GAME_W / 2, 345);

  // Magnifying glass icon
  ctx.strokeStyle = `rgba(232,213,183,${titlePulse * 0.5})`;
  ctx.lineWidth = 2;
  ctx.beginPath();
  ctx.arc(GAME_W / 2, 220, 25, 0, Math.PI * 2);
  ctx.stroke();
  ctx.beginPath();
  ctx.moveTo(GAME_W / 2 + 18, 238);
  ctx.lineTo(GAME_W / 2 + 32, 252);
  ctx.stroke();

  // Play button — prominent
  const btnW = 280, btnH = 60;
  const btnX = GAME_W / 2 - btnW / 2, btnY = 420;

  // Glow behind button
  ctx.shadowColor = 'rgba(124,58,237,0.5)';
  ctx.shadowBlur = 25;
  ctx.fillStyle = 'rgba(124,58,237,0.35)';
  roundRect(ctx, btnX, btnY, btnW, btnH, 12);
  ctx.fill();
  ctx.shadowBlur = 0;

  ctx.strokeStyle = 'rgba(180,130,255,0.8)';
  ctx.lineWidth = 2;
  roundRect(ctx, btnX, btnY, btnW, btnH, 12);
  ctx.stroke();

  ctx.font = 'bold 24px Georgia, serif';
  ctx.fillStyle = '#E8D5B7';
  ctx.fillText('INIZIA L\'INDAGINE', GAME_W / 2, btnY + 38);

  // Hint text
  ctx.font = 'italic 15px Georgia, serif';
  ctx.fillStyle = 'rgba(200,200,220,0.5)';
  ctx.fillText('Muovi il mouse per illuminare, clicca per scoprire', GAME_W / 2, btnY + 80);

  // Credits
  ctx.font = '14px Georgia, serif';
  ctx.fillStyle = 'rgba(200,200,220,0.35)';
  ctx.fillText('Un gioco Gameflix — Mysterium', GAME_W / 2, GAME_H - 40);

  ctx.restore();
}

export function getTitlePlayButton(): { x: number; y: number; w: number; h: number } {
  return { x: GAME_W / 2 - 130, y: 420, w: 260, h: 55 };
}

// ─── Level Select Screen ────────────────────────────────────────────

const levelNames = [
  'La Scrivania del Detective', 'La Biblioteca Segreta', 'Il Giardino', 'Il Treno delle 21:30',
  "L'Atelier dell'Artista", 'La Cappella', 'Il Porto', 'La Camera Sigillata',
];

export function drawLevelSelect(
  ctx: CanvasRenderingContext2D,
  time: number,
  levelProgress: Record<number, LevelProgress>,
): void {
  // Background
  ctx.fillStyle = '#0A0A14';
  ctx.fillRect(0, 0, GAME_W, GAME_H);

  // Subtle particles
  ctx.fillStyle = 'rgba(255,245,224,0.03)';
  for (let i = 0; i < 20; i++) {
    const px = (Math.sin(time * 0.0002 + i * 2.1) * 0.5 + 0.5) * GAME_W;
    const py = (Math.cos(time * 0.0003 + i * 1.7) * 0.5 + 0.5) * GAME_H;
    ctx.beginPath();
    ctx.arc(px, py, 1, 0, Math.PI * 2);
    ctx.fill();
  }

  // Title
  ctx.textAlign = 'center';
  ctx.font = 'bold 36px Georgia, serif';
  ctx.fillStyle = COLORS.mysteryText;
  ctx.fillText('SCEGLI IL CASO', GAME_W / 2, 60);

  // Level cards - 2 rows of 4
  const cardW = 230, cardH = 130, padX = 30, padY = 20;
  const startX = (GAME_W - (cardW * 4 + padX * 3)) / 2;
  const startY = 100;

  for (let i = 0; i < TOTAL_LEVELS; i++) {
    const col = i % 4;
    const row = Math.floor(i / 4);
    const cx = startX + col * (cardW + padX);
    const cy = startY + row * (cardH + padY + 40);
    const progress = levelProgress[i + 1];
    const isCompleted = progress?.completed;
    const isLocked = i > 0 && !levelProgress[i]?.completed;

    // Card background
    ctx.fillStyle = isLocked ? 'rgba(30,30,40,0.5)' : 'rgba(30,28,40,0.8)';
    roundRect(ctx, cx, cy, cardW, cardH, 8);
    ctx.fill();

    // Border
    ctx.strokeStyle = isCompleted ? COLORS.foundClue : isLocked ? 'rgba(60,60,80,0.3)' : COLORS.accentViolet;
    ctx.lineWidth = isCompleted ? 2 : 1;
    roundRect(ctx, cx, cy, cardW, cardH, 8);
    ctx.stroke();

    // Chapter number
    ctx.font = '12px Georgia, serif';
    ctx.textAlign = 'left';
    ctx.fillStyle = isLocked ? 'rgba(80,80,100,0.4)' : 'rgba(124,58,237,0.7)';
    ctx.fillText(`Capitolo ${i + 1}`, cx + 15, cy + 22);

    // Level name
    ctx.font = 'bold 18px Georgia, serif';
    ctx.fillStyle = isLocked ? 'rgba(80,80,100,0.4)' : COLORS.mysteryText;
    ctx.fillText(levelNames[i], cx + 15, cy + 48);

    // Stars
    if (isCompleted && progress) {
      for (let s = 0; s < 3; s++) {
        ctx.font = '16px sans-serif';
        ctx.fillStyle = s < progress.stars ? '#FFD700' : 'rgba(100,100,100,0.3)';
        ctx.fillText(s < progress.stars ? '\u2605' : '\u2606', cx + 15 + s * 20, cy + 75);
      }
      ctx.font = '12px Georgia, serif';
      ctx.fillStyle = 'rgba(200,200,220,0.5)';
      ctx.fillText(`${progress.score} punti`, cx + 15, cy + 100);
    } else if (isLocked) {
      ctx.font = '30px sans-serif';
      ctx.textAlign = 'center';
      ctx.fillStyle = 'rgba(80,80,100,0.3)';
      ctx.fillText('\uD83D\uDD12', cx + cardW / 2, cy + 85);
    } else {
      ctx.font = '12px Georgia, serif';
      ctx.fillStyle = 'rgba(200,200,220,0.4)';
      ctx.fillText('Clicca per iniziare', cx + 15, cy + 100);
    }
  }

  // Back button
  ctx.textAlign = 'center';
  ctx.font = '16px Georgia, serif';
  ctx.fillStyle = 'rgba(200,200,220,0.4)';
  ctx.fillText('\u2190 Indietro', 80, GAME_H - 30);

  // Total score
  let totalScore = 0;
  Object.values(levelProgress).forEach(p => { totalScore += p.score; });
  if (totalScore > 0) {
    ctx.font = '16px Georgia, serif';
    ctx.fillStyle = COLORS.mysteryText;
    ctx.fillText(`Punteggio totale: ${totalScore}`, GAME_W / 2, GAME_H - 30);
  }
}

export function getLevelSelectClick(
  mx: number, my: number,
  levelProgress: Record<number, LevelProgress>,
): number | 'back' | null {
  // Back button
  if (mx < 160 && my > GAME_H - 50) return 'back';

  const cardW = 230, cardH = 130, padX = 30, padY = 20;
  const startX = (GAME_W - (cardW * 4 + padX * 3)) / 2;
  const startY = 100;

  for (let i = 0; i < TOTAL_LEVELS; i++) {
    const col = i % 4;
    const row = Math.floor(i / 4);
    const cx = startX + col * (cardW + padX);
    const cy = startY + row * (cardH + padY + 40);
    const isLocked = i > 0 && !levelProgress[i]?.completed;

    if (!isLocked && mx >= cx && mx <= cx + cardW && my >= cy && my <= cy + cardH) {
      return i;
    }
  }
  return null;
}

// ─── Case Solved Overlay ────────────────────────────────────────────

export function drawCaseSolved(
  ctx: CanvasRenderingContext2D,
  time: number,
  mystery: string,
  solution: string,
  score: number,
  stars: number,
  animProgress: number,
): void {
  // Dark overlay
  ctx.fillStyle = `rgba(5,5,10,${Math.min(animProgress * 1.5, 0.85)})`;
  ctx.fillRect(0, 0, GAME_W, GAME_H);

  if (animProgress < 0.3) return;

  const fadeIn = Math.min((animProgress - 0.3) / 0.3, 1);

  ctx.save();
  ctx.globalAlpha = fadeIn;
  ctx.textAlign = 'center';

  // Gold border frame
  const frameX = 200, frameY = 100, frameW = 800, frameH = 550;
  ctx.strokeStyle = COLORS.clueHighlight;
  ctx.lineWidth = 2;
  roundRect(ctx, frameX, frameY, frameW, frameH, 15);
  ctx.stroke();

  // Inner background
  ctx.fillStyle = 'rgba(15,15,25,0.95)';
  roundRect(ctx, frameX + 5, frameY + 5, frameW - 10, frameH - 10, 12);
  ctx.fill();

  // "CASO RISOLTO"
  const solvedPulse = 0.8 + Math.sin(time * 0.003) * 0.2;
  ctx.font = 'bold 42px Georgia, serif';
  ctx.fillStyle = `rgba(255,215,0,${solvedPulse})`;
  ctx.fillText('CASO RISOLTO', GAME_W / 2, frameY + 70);

  // Decorative line
  ctx.strokeStyle = 'rgba(255,215,0,0.3)';
  ctx.lineWidth = 1;
  ctx.beginPath();
  ctx.moveTo(frameX + 100, frameY + 90);
  ctx.lineTo(frameX + frameW - 100, frameY + 90);
  ctx.stroke();

  // Mystery question
  ctx.font = 'italic 20px Georgia, serif';
  ctx.fillStyle = COLORS.accentViolet;
  ctx.fillText(`"${mystery}"`, GAME_W / 2, frameY + 130);

  // Solution
  ctx.font = '16px Georgia, serif';
  ctx.fillStyle = COLORS.mysteryText;
  // Word wrap solution
  const words = solution.split(' ');
  let line = '';
  let ly = frameY + 180;
  words.forEach(word => {
    const testLine = line + word + ' ';
    const metrics = ctx.measureText(testLine);
    if (metrics.width > frameW - 120) {
      ctx.fillText(line.trim(), GAME_W / 2, ly);
      line = word + ' ';
      ly += 25;
    } else {
      line = testLine;
    }
  });
  if (line.trim()) {
    ctx.fillText(line.trim(), GAME_W / 2, ly);
  }

  // Stars
  const starsY = frameY + 320;
  ctx.font = '40px sans-serif';
  for (let s = 0; s < 3; s++) {
    ctx.fillStyle = s < stars ? '#FFD700' : 'rgba(100,100,100,0.3)';
    ctx.fillText(s < stars ? '\u2605' : '\u2606', GAME_W / 2 - 50 + s * 50, starsY);
  }

  // Score
  ctx.font = 'bold 28px Georgia, serif';
  ctx.fillStyle = COLORS.clueHighlight;
  ctx.fillText(`${score} PUNTI`, GAME_W / 2, starsY + 60);

  // Continue button
  const btnW = 240, btnH = 50;
  const btnX = GAME_W / 2 - btnW / 2, btnY = frameY + frameH - 90;
  ctx.fillStyle = 'rgba(124,58,237,0.2)';
  roundRect(ctx, btnX, btnY, btnW, btnH, 8);
  ctx.fill();
  ctx.strokeStyle = COLORS.accentViolet;
  ctx.lineWidth = 1.5;
  roundRect(ctx, btnX, btnY, btnW, btnH, 8);
  ctx.stroke();
  ctx.font = '18px Georgia, serif';
  ctx.fillStyle = COLORS.mysteryText;
  ctx.fillText('CONTINUA', GAME_W / 2, btnY + 32);

  ctx.globalAlpha = 1;
  ctx.restore();
}

export function getCaseSolvedButton(): { x: number; y: number; w: number; h: number } {
  return { x: GAME_W / 2 - 120, y: 100 + 550 - 90, w: 240, h: 50 };
}
