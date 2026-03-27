// ─── Level 6: La Cappella (The Chapel) ──────────────────────────────

import { type SceneData, type Clue } from '../types';
import { drawCandle, drawWall, roundRect } from '../renderer';

function makeClues(): Clue[] {
  return [
    { id: 'fresh-candle', x: 500, y: 410, radius: 22, name: 'Candela recente', description: 'Una candela appena bruciata, mentre le altre sono polverose', found: false },
    { id: 'stone-tile', x: 650, y: 680, radius: 25, name: 'Mattonella con simbolo', description: 'Una pietra con un motivo diverso dalle altre', found: false },
    { id: 'fresh-flowers', x: 350, y: 430, radius: 22, name: 'Fiori freschi', description: 'Fiori freschi tra quelli secchi e appassiti', found: false },
    { id: 'pew-name', x: 400, y: 580, radius: 22, name: 'Nome inciso', description: 'Un nome graffiato nel retro di un banco', found: false },
    { id: 'hidden-door', x: 1050, y: 350, radius: 25, name: 'Porta nascosta', description: 'Una piccola porta celata dietro l\'arazzo', found: false },
    { id: 'cut-rope', x: 130, y: 250, radius: 22, name: 'Corda tagliata', description: 'La corda della campana è stata tagliata di recente', found: false },
  ];
}

function draw(ctx: CanvasRenderingContext2D, time: number): void {
  // ── Stone walls ──
  const wallGrad = ctx.createLinearGradient(0, 0, 0, 800);
  wallGrad.addColorStop(0, '#1E1A16');
  wallGrad.addColorStop(1, '#141210');
  ctx.fillStyle = wallGrad;
  ctx.fillRect(0, 0, 1200, 800);

  // Stone block texture
  ctx.strokeStyle = 'rgba(40,35,30,0.3)';
  ctx.lineWidth = 0.5;
  for (let sy = 0; sy < 600; sy += 30) {
    const offset = (sy / 30) % 2 === 0 ? 0 : 35;
    for (let sx = offset; sx < 1200; sx += 70) {
      ctx.strokeRect(sx, sy, 70, 30);
    }
  }

  // ── Vaulted ceiling ──
  ctx.fillStyle = '#181614';
  ctx.beginPath();
  ctx.moveTo(0, 80);
  ctx.quadraticCurveTo(600, -20, 1200, 80);
  ctx.lineTo(1200, 0);
  ctx.lineTo(0, 0);
  ctx.closePath();
  ctx.fill();
  // Ribs
  ctx.strokeStyle = '#2A2622';
  ctx.lineWidth = 4;
  ctx.beginPath();
  ctx.moveTo(0, 80);
  ctx.quadraticCurveTo(600, 10, 1200, 80);
  ctx.stroke();
  ctx.beginPath();
  ctx.moveTo(300, 0);
  ctx.quadraticCurveTo(600, 60, 900, 0);
  ctx.stroke();

  // ── Stained glass window (center, back wall) ──
  const sgX = 450, sgY = 50, sgW = 300, sgH = 250;
  // Window arch
  ctx.fillStyle = '#2A2A3A';
  ctx.beginPath();
  ctx.moveTo(sgX, sgY + sgH);
  ctx.lineTo(sgX, sgY + 80);
  ctx.quadraticCurveTo(sgX + sgW / 2, sgY - 30, sgX + sgW, sgY + 80);
  ctx.lineTo(sgX + sgW, sgY + sgH);
  ctx.closePath();
  ctx.fill();
  // Stained glass panels
  const glassColors = [
    { x: sgX + 30, y: sgY + 100, w: 60, h: 80, c: 'rgba(100,30,30,0.3)' },
    { x: sgX + 100, y: sgY + 80, w: 50, h: 100, c: 'rgba(30,30,100,0.3)' },
    { x: sgX + 160, y: sgY + 90, w: 40, h: 90, c: 'rgba(100,80,30,0.3)' },
    { x: sgX + 210, y: sgY + 100, w: 60, h: 80, c: 'rgba(30,80,30,0.3)' },
    { x: sgX + 80, y: sgY + 190, w: 70, h: 50, c: 'rgba(80,30,80,0.3)' },
    { x: sgX + 160, y: sgY + 190, w: 70, h: 50, c: 'rgba(30,80,80,0.3)' },
  ];
  glassColors.forEach(g => {
    ctx.fillStyle = g.c;
    ctx.fillRect(g.x, g.y, g.w, g.h);
  });
  // Lead lines
  ctx.strokeStyle = '#1A1A1A';
  ctx.lineWidth = 2;
  glassColors.forEach(g => {
    ctx.strokeRect(g.x, g.y, g.w, g.h);
  });
  // Rose window at top
  ctx.fillStyle = 'rgba(150,100,50,0.2)';
  ctx.beginPath();
  ctx.arc(sgX + sgW / 2, sgY + 60, 35, 0, Math.PI * 2);
  ctx.fill();
  ctx.strokeStyle = '#1A1A1A';
  ctx.lineWidth = 1.5;
  ctx.stroke();
  for (let a = 0; a < 8; a++) {
    const angle = (a / 8) * Math.PI * 2;
    ctx.beginPath();
    ctx.moveTo(sgX + sgW / 2, sgY + 60);
    ctx.lineTo(sgX + sgW / 2 + Math.cos(angle) * 35, sgY + 60 + Math.sin(angle) * 35);
    ctx.stroke();
  }

  // ── Stone floor ──
  ctx.fillStyle = '#2A2620';
  ctx.fillRect(0, 600, 1200, 200);
  // Floor tiles
  ctx.strokeStyle = 'rgba(0,0,0,0.3)';
  ctx.lineWidth = 1;
  for (let fy = 600; fy < 800; fy += 45) {
    const fOff = ((fy - 600) / 45) % 2 === 0 ? 0 : 30;
    for (let fx = fOff; fx < 1200; fx += 60) {
      ctx.strokeRect(fx, fy, 60, 45);
    }
  }

  // Clue 2: Stone tile with different pattern
  ctx.fillStyle = '#2E2A24';
  ctx.fillRect(625, 660, 60, 45);
  ctx.strokeStyle = '#4A4438';
  ctx.lineWidth = 1;
  ctx.strokeRect(625, 660, 60, 45);
  // Cross symbol on this tile
  ctx.strokeStyle = 'rgba(100,90,70,0.4)';
  ctx.lineWidth = 1.5;
  ctx.beginPath();
  ctx.moveTo(655, 667);
  ctx.lineTo(655, 698);
  ctx.moveTo(640, 682);
  ctx.lineTo(670, 682);
  ctx.stroke();

  // ── Altar ──
  ctx.fillStyle = '#4A4440';
  ctx.fillRect(400, 380, 400, 100);
  // Altar cloth
  ctx.fillStyle = '#F5F0E8';
  ctx.fillRect(395, 375, 410, 15);
  // Cross on cloth
  ctx.strokeStyle = '#B8860B';
  ctx.lineWidth = 2;
  ctx.beginPath();
  ctx.moveTo(600, 378);
  ctx.lineTo(600, 388);
  ctx.moveTo(596, 381);
  ctx.lineTo(604, 381);
  ctx.stroke();
  // Altar decorations
  ctx.fillStyle = '#4A4440';
  ctx.fillRect(420, 480, 360, 30);

  // ── Candelabra on altar ──
  // Left candelabra (dusty normal candles)
  const cLeftX = 460;
  ctx.fillStyle = '#8B6914';
  ctx.fillRect(cLeftX - 3, 380, 6, -20);
  ctx.beginPath();
  ctx.ellipse(cLeftX, 380, 15, 4, 0, 0, Math.PI * 2);
  ctx.fill();
  drawCandle(ctx, cLeftX - 15, 360, 25, time + 100, '#D8D0C0');
  drawCandle(ctx, cLeftX, 360, 30, time + 300, '#D8D0C0');
  drawCandle(ctx, cLeftX + 15, 360, 22, time + 500, '#D8D0C0');
  // Dust on old candles
  ctx.fillStyle = 'rgba(100,90,80,0.15)';
  ctx.fillRect(cLeftX - 22, 330, 45, 5);

  // Right candelabra
  const cRightX = 740;
  ctx.fillStyle = '#8B6914';
  ctx.fillRect(cRightX - 3, 380, 6, -20);
  ctx.beginPath();
  ctx.ellipse(cRightX, 380, 15, 4, 0, 0, Math.PI * 2);
  ctx.fill();
  drawCandle(ctx, cRightX - 15, 360, 25, time + 200, '#D8D0C0');
  drawCandle(ctx, cRightX + 15, 360, 22, time + 400, '#D8D0C0');

  // Clue 1: Fresh candle (brighter, no dust, actively burning)
  drawCandle(ctx, 500, 360, 28, time, '#FFF5E0');
  // This candle is clean and bright - no dust
  ctx.fillStyle = 'rgba(255,230,160,0.08)';
  ctx.beginPath();
  ctx.arc(500, 340, 30, 0, Math.PI * 2);
  ctx.fill();

  // ── Vases with flowers ──
  // Left vase - dried flowers
  ctx.fillStyle = '#6A5A4A';
  ctx.fillRect(420, 350, 20, 30);
  ctx.beginPath();
  ctx.ellipse(430, 350, 12, 5, 0, 0, Math.PI * 2);
  ctx.fill();
  // Dead flowers
  ctx.strokeStyle = '#5A4A3A';
  ctx.lineWidth = 1;
  for (let f = 0; f < 5; f++) {
    ctx.beginPath();
    ctx.moveTo(430, 350);
    ctx.quadraticCurveTo(425 + f * 3, 325, 420 + f * 5, 310 + f * 3);
    ctx.stroke();
    ctx.fillStyle = '#4A3A2A';
    ctx.beginPath();
    ctx.arc(420 + f * 5, 310 + f * 3, 3, 0, Math.PI * 2);
    ctx.fill();
  }

  // Clue 3: Fresh flowers among dried ones
  ctx.save();
  ctx.strokeStyle = '#2A6A2A';
  ctx.lineWidth = 1.5;
  ctx.beginPath();
  ctx.moveTo(350, 430);
  ctx.quadraticCurveTo(348, 410, 345, 395);
  ctx.stroke();
  ctx.beginPath();
  ctx.moveTo(350, 430);
  ctx.quadraticCurveTo(355, 408, 358, 390);
  ctx.stroke();
  // Fresh petals
  ctx.fillStyle = '#E63946';
  ctx.beginPath();
  ctx.arc(345, 392, 5, 0, Math.PI * 2);
  ctx.fill();
  ctx.fillStyle = '#FF6B6B';
  ctx.beginPath();
  ctx.arc(358, 387, 4, 0, Math.PI * 2);
  ctx.fill();
  ctx.fillStyle = '#F5F5F5';
  ctx.beginPath();
  ctx.arc(350, 395, 3, 0, Math.PI * 2);
  ctx.fill();
  ctx.restore();

  // ── Pews (two rows) ──
  for (let row = 0; row < 2; row++) {
    for (let pew = 0; pew < 4; pew++) {
      const px = 200 + pew * 200;
      const py = 530 + row * 60;
      // Pew back
      ctx.fillStyle = '#3A2E22';
      ctx.fillRect(px, py, 160, 8);
      // Pew seat
      ctx.fillStyle = '#4A3828';
      ctx.fillRect(px, py + 15, 160, 8);
      // Pew end
      ctx.fillStyle = '#3A2E22';
      ctx.fillRect(px - 5, py - 5, 8, 35);
      ctx.fillRect(px + 157, py - 5, 8, 35);
    }
  }

  // Clue 4: Name scratched in back of pew
  ctx.save();
  ctx.font = '7px monospace';
  ctx.fillStyle = 'rgba(100,90,70,0.35)';
  ctx.fillText('ELENA R.', 385, 578);
  ctx.restore();

  // ── Tapestry (right wall) ──
  ctx.fillStyle = '#4A1A1A';
  ctx.fillRect(1000, 150, 120, 350);
  // Tapestry pattern
  ctx.fillStyle = '#5A2A1A';
  ctx.fillRect(1010, 160, 100, 330);
  // Cross pattern
  ctx.strokeStyle = '#6A3A2A';
  ctx.lineWidth = 2;
  ctx.beginPath();
  ctx.moveTo(1060, 200);
  ctx.lineTo(1060, 400);
  ctx.moveTo(1020, 300);
  ctx.lineTo(1100, 300);
  ctx.stroke();
  // Tassels at bottom
  ctx.strokeStyle = '#6A3A2A';
  ctx.lineWidth = 1;
  for (let t = 1010; t < 1110; t += 8) {
    ctx.beginPath();
    ctx.moveTo(t, 500);
    ctx.lineTo(t, 515);
    ctx.stroke();
  }

  // Clue 5: Hidden door behind tapestry
  ctx.save();
  // Door edge visible at tapestry side
  ctx.fillStyle = '#2A2220';
  ctx.fillRect(1040, 280, 4, 120);
  // Gap between tapestry and wall showing door
  ctx.fillStyle = '#1A1816';
  ctx.fillRect(1120, 250, 5, 250);
  // Door handle glimpse
  ctx.fillStyle = '#666';
  ctx.beginPath();
  ctx.arc(1050, 350, 3, 0, Math.PI * 2);
  ctx.fill();
  ctx.restore();

  // ── Bell rope (left side) ──
  ctx.strokeStyle = '#8A7A5A';
  ctx.lineWidth = 4;
  ctx.beginPath();
  ctx.moveTo(130, 0);
  ctx.lineTo(130, 200);
  ctx.stroke();
  // Rope texture
  ctx.strokeStyle = '#7A6A4A';
  ctx.lineWidth = 1;
  for (let ry = 10; ry < 200; ry += 12) {
    ctx.beginPath();
    ctx.moveTo(126, ry);
    ctx.lineTo(134, ry + 6);
    ctx.stroke();
  }

  // Clue 6: Cut rope - frayed end
  ctx.strokeStyle = '#8A7A5A';
  ctx.lineWidth = 4;
  ctx.beginPath();
  ctx.moveTo(130, 200);
  ctx.lineTo(130, 250);
  ctx.stroke();
  // Frayed cut end
  ctx.strokeStyle = '#9A8A6A';
  ctx.lineWidth = 1;
  for (let f = 0; f < 8; f++) {
    ctx.beginPath();
    ctx.moveTo(128 + Math.random() * 4, 248);
    ctx.lineTo(126 + Math.random() * 8, 255 + Math.random() * 8);
    ctx.stroke();
  }
  // The cut is clean on one side (knife cut)
  ctx.strokeStyle = '#AAA';
  ctx.lineWidth = 0.5;
  ctx.beginPath();
  ctx.moveTo(128, 250);
  ctx.lineTo(132, 249);
  ctx.stroke();

  // ── Wooden door (left) ──
  ctx.fillStyle = '#3A2818';
  ctx.fillRect(10, 200, 80, 380);
  // Planks
  ctx.strokeStyle = 'rgba(20,15,10,0.3)';
  ctx.lineWidth = 0.5;
  ctx.beginPath();
  ctx.moveTo(35, 200);
  ctx.lineTo(35, 580);
  ctx.moveTo(60, 200);
  ctx.lineTo(60, 580);
  ctx.stroke();
  // Iron bands
  ctx.fillStyle = '#333';
  ctx.fillRect(10, 280, 80, 6);
  ctx.fillRect(10, 450, 80, 6);
  // Ring handle
  ctx.strokeStyle = '#555';
  ctx.lineWidth = 3;
  ctx.beginPath();
  ctx.arc(65, 380, 10, 0, Math.PI * 2);
  ctx.stroke();
  // Keyhole
  ctx.fillStyle = '#111';
  ctx.beginPath();
  ctx.arc(60, 400, 3, 0, Math.PI * 2);
  ctx.fill();
  ctx.fillRect(58, 400, 4, 8);

  // ── Cobwebs ──
  ctx.strokeStyle = 'rgba(200,200,200,0.06)';
  ctx.lineWidth = 0.5;
  // Top left corner
  ctx.beginPath();
  ctx.moveTo(0, 0);
  ctx.quadraticCurveTo(30, 40, 80, 30);
  ctx.stroke();
  ctx.beginPath();
  ctx.moveTo(0, 0);
  ctx.quadraticCurveTo(20, 50, 60, 60);
  ctx.stroke();
  ctx.beginPath();
  ctx.moveTo(0, 0);
  ctx.quadraticCurveTo(40, 20, 100, 15);
  ctx.stroke();
  // Top right corner
  ctx.beginPath();
  ctx.moveTo(1200, 0);
  ctx.quadraticCurveTo(1170, 40, 1120, 30);
  ctx.stroke();
}

export function createScene6(): SceneData {
  return {
    id: 6,
    title: 'La Cappella',
    subtitle: 'Capitolo VI',
    storyIntro: 'Una cappella abbandonata da decenni mostra segni di visite recenti. Qualcuno viene qui di nascosto. Scopri chi e perch\u00E9.',
    mystery: 'Chi frequenta ancora la cappella abbandonata?',
    solution: 'La candela fresca, i fiori, il nome, la porta nascosta e la corda tagliata rivelano che qualcuno usa ancora questo luogo in segreto.',
    clues: makeClues(),
    requiredConnections: [
      { clueA: 'fresh-candle', clueB: 'fresh-flowers' },
      { clueA: 'pew-name', clueB: 'hidden-door' },
    ],
    deductionQuestion: 'Chi frequenta la cappella di nascosto?',
    deductionOptions: [
      { text: 'Vandali', correct: false, explanation: 'I fiori freschi e la candela indicano cura, non vandalismo.' },
      { text: 'La vedova del conte Moretti', correct: true, explanation: 'Il nome inciso sul banco, i fiori freschi e la porta segreta indicano che la vedova visita la cappella per commemorare il marito.' },
      { text: 'Un prete in pensione', correct: false, explanation: 'La corda della campana tagliata e la porta segreta suggeriscono che il visitatore non vuole essere scoperto.' },
      { text: 'Nessuno, sono segni vecchi', correct: false, explanation: 'La candela appena bruciata e i fiori freschi dimostrano visite recentissime.' },
    ],
    solutionNarrative: 'La vedova del conte Moretti visita segretamente la cappella per commemorare il marito. Ha inciso il suo nome sul banco, porta fiori freschi e accende candele. Usa una porta nascosta dietro l\'arazzo per entrare senza essere vista, e ha tagliato la corda della campana per non fare rumore.',
    draw,
  };
}
