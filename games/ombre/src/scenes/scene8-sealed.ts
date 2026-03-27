// ─── Level 8: La Camera Sigillata (The Sealed Room) ─────────────────

import { type SceneData, type Clue } from '../types';
import { drawWall, drawFloor, drawWoodGrain, drawWindow, drawFrame, drawCandle, roundRect } from '../renderer';

function makeClues(): Clue[] {
  return [
    { id: 'glass', x: 650, y: 430, radius: 22, name: 'Bicchiere con residuo', description: 'Un bicchiere con un residuo sospetto sul tavolo', found: false },
    { id: 'false-book', x: 180, y: 280, radius: 22, name: 'Libro falso', description: 'Un libro con una texture diversa sullo scaffale', found: false },
    { id: 'soot', x: 950, y: 500, radius: 25, name: 'Segni di fuliggine', description: 'Segni nel camino indicano che qualcuno si è arrampicato', found: false },
    { id: 'clock', x: 800, y: 180, radius: 22, name: 'Meccanismo rotto', description: 'Un meccanismo ad orologeria rotto sulla mensola', found: false },
    { id: 'draft', x: 120, y: 370, radius: 25, name: 'Corrente d\'aria', description: 'Polvere in movimento dietro la libreria rivela una corrente', found: false },
    { id: 'thread', x: 500, y: 200, radius: 22, name: 'Filo sul chiavistello', description: 'Un filo sottile impigliato nel chiavistello della finestra', found: false },
    { id: 'compartment', x: 680, y: 500, radius: 22, name: 'Scomparto segreto', description: 'Uno scomparto nascosto nella gamba del tavolo', found: false },
  ];
}

function draw(ctx: CanvasRenderingContext2D, time: number): void {
  // ── Walls - elegant study ──
  drawWall(ctx, 0, 0, 1200, 570, '#251E18', '#1C1612');

  // Wainscoting panels
  ctx.fillStyle = '#2A221A';
  ctx.fillRect(0, 350, 1200, 220);
  ctx.strokeStyle = '#3A3228';
  ctx.lineWidth = 1;
  // Panel outlines
  for (let px = 20; px < 1180; px += 150) {
    ctx.strokeRect(px, 360, 130, 200);
  }

  // Crown molding
  ctx.fillStyle = '#3A3228';
  ctx.fillRect(0, 0, 1200, 15);
  ctx.fillStyle = '#4A4238';
  ctx.fillRect(0, 12, 1200, 5);

  // ── Floor ──
  drawFloor(ctx, 570, 230, '#3A3028', '#2A2018');
  // Parquet pattern
  ctx.strokeStyle = 'rgba(20,15,10,0.2)';
  ctx.lineWidth = 0.5;
  for (let fy = 570; fy < 800; fy += 20) {
    const isEven = ((fy - 570) / 20) % 2 === 0;
    for (let fx = isEven ? 0 : 30; fx < 1200; fx += 60) {
      ctx.strokeRect(fx, fy, 60, 20);
    }
  }

  // ── Body outline (chalk) ──
  ctx.strokeStyle = 'rgba(255,255,255,0.15)';
  ctx.lineWidth = 2;
  ctx.beginPath();
  // Head
  ctx.arc(500, 620, 15, 0, Math.PI * 2);
  ctx.stroke();
  ctx.beginPath();
  // Body
  ctx.moveTo(500, 635);
  ctx.lineTo(500, 690);
  // Arms
  ctx.moveTo(500, 650);
  ctx.lineTo(465, 670);
  ctx.moveTo(500, 650);
  ctx.lineTo(540, 665);
  // Legs
  ctx.moveTo(500, 690);
  ctx.lineTo(475, 730);
  ctx.moveTo(500, 690);
  ctx.lineTo(530, 725);
  ctx.stroke();

  // ── Bookshelf (left wall) ──
  const bsX = 50, bsY = 100, bsW = 180, bsH = 400;
  ctx.fillStyle = '#3A2E22';
  ctx.fillRect(bsX, bsY, bsW, bsH);
  drawWoodGrain(ctx, bsX, bsY, bsW, bsH, 'rgba(20,10,5,0.15)');
  // Shelves
  for (let s = 0; s < 5; s++) {
    ctx.fillStyle = '#4A3E32';
    ctx.fillRect(bsX, bsY + s * 80, bsW, 5);
  }
  // Books
  const colors = ['#6B1A1A', '#1A3A5A', '#3A2A5A', '#5A4A1A', '#1A4A3A', '#4A1A3A', '#2F4F2F', '#4A3A1A'];
  for (let row = 0; row < 4; row++) {
    let bx = bsX + 5;
    for (let b = 0; b < 7; b++) {
      const bw = 10 + Math.random() * 12;
      const bh = 55 + Math.random() * 18;
      const isClue = row === 2 && b === 3;
      ctx.fillStyle = isClue ? '#5A5A50' : colors[(row * 7 + b) % colors.length];
      ctx.fillRect(bx, bsY + row * 80 + 7 + (73 - bh), bw, bh);

      if (isClue) {
        // Clue 2: False book - different texture (fabric-like instead of leather)
        ctx.fillStyle = 'rgba(100,100,90,0.3)';
        for (let ty = bsY + row * 80 + 7 + (73 - bh); ty < bsY + row * 80 + 7 + 73; ty += 3) {
          ctx.fillRect(bx, ty, bw, 1);
        }
      }
      bx += bw + 2;
    }
  }

  // Clue 5: Draft - dust particles moving near bookshelf
  ctx.save();
  const dustCount = 8;
  for (let d = 0; d < dustCount; d++) {
    const phase = (time * 0.001 + d * 0.8) % 4;
    const dx = bsX + bsW + 5 + Math.sin(phase * 2) * 10;
    const dy = bsY + 150 + d * 25 + Math.sin(time * 0.002 + d) * 5;
    ctx.fillStyle = 'rgba(180,170,150,0.15)';
    ctx.beginPath();
    ctx.arc(dx, dy, 1.5, 0, Math.PI * 2);
    ctx.fill();
  }
  // Slight gap between bookshelf and wall
  ctx.fillStyle = '#0A0808';
  ctx.fillRect(bsX - 3, bsY + 50, 3, 300);
  ctx.restore();

  // ── Window (center) ──
  const winX = 380, winY = 100, winW = 200, winH = 200;
  ctx.fillStyle = '#5A4A38';
  ctx.fillRect(winX - 8, winY - 8, winW + 16, winH + 16);
  drawWindow(ctx, winX, winY, winW, winH, time, false);
  // Window latch
  ctx.fillStyle = '#B8860B';
  ctx.fillRect(winX + winW / 2 - 3, winY + winH - 15, 6, 15);
  // Lock indicator
  ctx.fillStyle = '#8B6914';
  ctx.beginPath();
  ctx.arc(winX + winW / 2, winY + winH - 18, 4, 0, Math.PI * 2);
  ctx.fill();

  // Clue 6: Thread on window latch
  ctx.strokeStyle = 'rgba(200,200,200,0.3)';
  ctx.lineWidth = 0.5;
  ctx.beginPath();
  ctx.moveTo(winX + winW / 2 + 2, winY + winH - 15);
  ctx.quadraticCurveTo(winX + winW / 2 + 15, winY + winH - 20, winX + winW / 2 + 20, winY + winH - 10);
  ctx.quadraticCurveTo(winX + winW / 2 + 18, winY + winH - 5, winX + winW / 2 + 25, winY + winH);
  ctx.stroke();
  // Thread is thin and barely visible
  ctx.strokeStyle = 'rgba(150,150,160,0.2)';
  ctx.beginPath();
  ctx.moveTo(winX + winW / 2 + 25, winY + winH);
  ctx.lineTo(winX + winW / 2 + 30, winY + winH + 8);
  ctx.stroke();

  // Curtains
  ctx.fillStyle = '#3A1A20';
  ctx.beginPath();
  ctx.moveTo(winX - 5, winY - 5);
  ctx.quadraticCurveTo(winX + 20, winY + 80, winX + 15, winY + winH + 5);
  ctx.lineTo(winX - 5, winY + winH + 5);
  ctx.closePath();
  ctx.fill();
  ctx.beginPath();
  ctx.moveTo(winX + winW + 5, winY - 5);
  ctx.quadraticCurveTo(winX + winW - 20, winY + 80, winX + winW - 15, winY + winH + 5);
  ctx.lineTo(winX + winW + 5, winY + winH + 5);
  ctx.closePath();
  ctx.fill();

  // ── Table (center) ──
  const tableX = 580, tableY = 400, tableW = 220, tableH = 100;
  ctx.fillStyle = 'rgba(0,0,0,0.2)';
  ctx.fillRect(tableX + 5, tableY + 5, tableW, tableH);
  ctx.fillStyle = '#4A3828';
  ctx.fillRect(tableX, tableY, tableW, tableH);
  drawWoodGrain(ctx, tableX, tableY, tableW, tableH);
  // Edge detail
  ctx.fillStyle = '#5A4838';
  ctx.fillRect(tableX, tableY, tableW, 4);
  // Table legs (ornate)
  ctx.fillStyle = '#3A2818';
  ctx.fillRect(tableX + 15, tableY + tableH, 12, 80);
  ctx.fillRect(tableX + tableW - 27, tableY + tableH, 12, 80);
  // Leg carvings
  ctx.strokeStyle = '#4A3828';
  ctx.lineWidth = 1;
  ctx.beginPath();
  ctx.arc(tableX + 21, tableY + tableH + 40, 8, 0, Math.PI * 2);
  ctx.stroke();

  // Clue 7: Hidden compartment in table leg
  ctx.save();
  ctx.fillStyle = '#3A2818';
  ctx.fillRect(tableX + tableW - 30, tableY + tableH + 30, 18, 20);
  // Slight gap showing compartment
  ctx.fillStyle = '#1A1008';
  ctx.fillRect(tableX + tableW - 28, tableY + tableH + 48, 14, 2);
  // Something inside
  ctx.fillStyle = '#E8D5A0';
  ctx.fillRect(tableX + tableW - 26, tableY + tableH + 42, 10, 5);
  ctx.restore();

  // Clue 1: Glass with residue on table
  ctx.save();
  ctx.fillStyle = 'rgba(200,220,240,0.15)';
  ctx.fillRect(645, 410, 16, 25);
  ctx.beginPath();
  ctx.ellipse(653, 410, 9, 4, 0, 0, Math.PI * 2);
  ctx.fillStyle = 'rgba(200,220,240,0.1)';
  ctx.fill();
  // Residue at bottom
  ctx.fillStyle = 'rgba(180,160,100,0.3)';
  ctx.beginPath();
  ctx.ellipse(653, 433, 6, 2, 0, 0, Math.PI * 2);
  ctx.fill();
  // Ring mark on table
  ctx.strokeStyle = 'rgba(100,90,70,0.15)';
  ctx.lineWidth = 1;
  ctx.beginPath();
  ctx.arc(653, 428, 10, 0, Math.PI * 2);
  ctx.stroke();
  ctx.restore();

  // ── Fireplace (right wall) ──
  const fpX = 850, fpY = 250;
  // Mantle
  ctx.fillStyle = '#5A5050';
  ctx.fillRect(fpX - 20, fpY - 10, 200, 15);
  ctx.fillStyle = '#4A4040';
  ctx.fillRect(fpX - 10, fpY + 5, 180, 10);
  // Fireplace opening
  ctx.fillStyle = '#0A0808';
  ctx.beginPath();
  ctx.moveTo(fpX, fpY + 15);
  ctx.lineTo(fpX + 20, fpY + 15);
  ctx.quadraticCurveTo(fpX + 80, fpY - 30, fpX + 140, fpY + 15);
  ctx.lineTo(fpX + 160, fpY + 15);
  ctx.lineTo(fpX + 160, fpY + 200);
  ctx.lineTo(fpX, fpY + 200);
  ctx.closePath();
  ctx.fill();
  // Fireplace surround (stone)
  ctx.strokeStyle = '#5A5050';
  ctx.lineWidth = 8;
  ctx.beginPath();
  ctx.moveTo(fpX - 5, fpY + 200);
  ctx.lineTo(fpX - 5, fpY + 15);
  ctx.quadraticCurveTo(fpX + 80, fpY - 35, fpX + 165, fpY + 15);
  ctx.lineTo(fpX + 165, fpY + 200);
  ctx.stroke();
  // Hearth
  ctx.fillStyle = '#3A3430';
  ctx.fillRect(fpX - 15, fpY + 200, 190, 20);
  // Ashes
  ctx.fillStyle = '#2A2624';
  ctx.beginPath();
  ctx.ellipse(fpX + 80, fpY + 190, 50, 10, 0, 0, Math.PI * 2);
  ctx.fill();
  // Cold embers
  ctx.fillStyle = '#1A1614';
  for (let e = 0; e < 8; e++) {
    ctx.beginPath();
    ctx.arc(fpX + 50 + Math.random() * 60, fpY + 180 + Math.random() * 15, 3 + Math.random() * 4, 0, Math.PI * 2);
    ctx.fill();
  }

  // Clue 3: Soot marks - handprints/scuff marks inside fireplace
  ctx.fillStyle = 'rgba(20,18,15,0.4)';
  // Handprint smears on inner wall
  ctx.beginPath();
  ctx.ellipse(fpX + 30, fpY + 100, 8, 12, 0.3, 0, Math.PI * 2);
  ctx.fill();
  ctx.beginPath();
  ctx.ellipse(fpX + 35, fpY + 70, 6, 10, -0.2, 0, Math.PI * 2);
  ctx.fill();
  // Scuff marks (feet)
  ctx.fillStyle = 'rgba(30,28,24,0.5)';
  ctx.fillRect(fpX + 60, fpY + 170, 30, 8);
  ctx.fillRect(fpX + 50, fpY + 160, 25, 6);
  // Soot trail going up
  ctx.fillStyle = 'rgba(20,18,15,0.2)';
  for (let sy = fpY + 50; sy > fpY - 20; sy -= 15) {
    ctx.beginPath();
    ctx.arc(fpX + 80 + Math.sin(sy * 0.1) * 10, sy, 5, 0, Math.PI * 2);
    ctx.fill();
  }

  // ── Mantle decorations ──
  // Clue 4: Broken clockwork mechanism
  ctx.save();
  ctx.translate(800, 180);
  // Clock face (broken)
  ctx.fillStyle = '#C0B090';
  ctx.beginPath();
  ctx.arc(0, 0, 18, 0, Math.PI * 2);
  ctx.fill();
  ctx.strokeStyle = '#8B6914';
  ctx.lineWidth = 2;
  ctx.stroke();
  // Cracked glass
  ctx.strokeStyle = 'rgba(0,0,0,0.2)';
  ctx.lineWidth = 0.5;
  ctx.beginPath();
  ctx.moveTo(-5, -15);
  ctx.lineTo(3, 0);
  ctx.lineTo(-2, 12);
  ctx.stroke();
  // Hands stuck at an angle
  ctx.strokeStyle = '#333';
  ctx.lineWidth = 1.5;
  ctx.beginPath();
  ctx.moveTo(0, 0);
  ctx.lineTo(-8, -10);
  ctx.stroke();
  ctx.lineWidth = 1;
  ctx.beginPath();
  ctx.moveTo(0, 0);
  ctx.lineTo(12, 3);
  ctx.stroke();
  // Gear pieces fallen
  ctx.fillStyle = '#B8860B';
  ctx.beginPath();
  ctx.arc(25, 12, 4, 0, Math.PI * 2);
  ctx.fill();
  ctx.strokeStyle = '#8B6914';
  ctx.lineWidth = 0.5;
  ctx.beginPath();
  ctx.arc(25, 12, 4, 0, Math.PI * 2);
  ctx.stroke();
  // Gear teeth
  for (let g = 0; g < 6; g++) {
    const ga = (g / 6) * Math.PI * 2;
    ctx.fillRect(25 + Math.cos(ga) * 3 - 1, 12 + Math.sin(ga) * 3 - 1, 2, 2);
  }
  ctx.restore();

  // Vase on mantle
  ctx.fillStyle = '#4A6A4A';
  ctx.beginPath();
  ctx.moveTo(fpX + 140, fpY - 10);
  ctx.quadraticCurveTo(fpX + 130, fpY - 40, fpX + 135, fpY - 50);
  ctx.quadraticCurveTo(fpX + 145, fpY - 55, fpX + 155, fpY - 50);
  ctx.quadraticCurveTo(fpX + 160, fpY - 40, fpX + 150, fpY - 10);
  ctx.closePath();
  ctx.fill();

  // ── Chandelier ──
  ctx.strokeStyle = '#8B6914';
  ctx.lineWidth = 2;
  ctx.beginPath();
  ctx.moveTo(600, 0);
  ctx.lineTo(600, 50);
  ctx.stroke();
  // Chain links
  for (let cl = 5; cl < 50; cl += 8) {
    ctx.beginPath();
    ctx.ellipse(600, cl, 3, 4, 0, 0, Math.PI * 2);
    ctx.stroke();
  }
  // Chandelier arms
  ctx.lineWidth = 2;
  const chandelierArms = [-60, -30, 0, 30, 60];
  chandelierArms.forEach(offset => {
    ctx.beginPath();
    ctx.moveTo(600, 50);
    ctx.quadraticCurveTo(600 + offset, 60, 600 + offset * 1.5, 55);
    ctx.stroke();
    // Candle holders
    drawCandle(ctx, 600 + offset * 1.5, 55, 15, time + offset * 100, '#F5E6CA');
  });

  // ── Paintings on wall ──
  drawFrame(ctx, 280, 120, 60, 80, '#5D3A1A');
  ctx.fillStyle = '#3A4A3A';
  ctx.fillRect(280, 120, 60, 80);
  // Landscape
  ctx.fillStyle = '#4A5A4A';
  ctx.fillRect(280, 155, 60, 20);
  ctx.fillStyle = '#2A3A4A';
  ctx.fillRect(280, 120, 60, 35);

  drawFrame(ctx, 700, 80, 80, 60, '#5D3A1A');
  ctx.fillStyle = '#4A3A2A';
  ctx.fillRect(700, 80, 80, 60);

  // ── Rug under table ──
  ctx.fillStyle = '#3A1A20';
  ctx.beginPath();
  ctx.ellipse(690, 580, 140, 60, 0, 0, Math.PI * 2);
  ctx.fill();
  ctx.strokeStyle = '#4A2A28';
  ctx.lineWidth = 2;
  ctx.beginPath();
  ctx.ellipse(690, 580, 130, 55, 0, 0, Math.PI * 2);
  ctx.stroke();
  ctx.beginPath();
  ctx.ellipse(690, 580, 115, 48, 0, 0, Math.PI * 2);
  ctx.stroke();

  // ── Small chair (near table) ──
  ctx.fillStyle = '#3A2818';
  // Seat
  ctx.fillRect(730, 480, 50, 8);
  // Back
  ctx.fillRect(730, 430, 5, 50);
  ctx.fillRect(775, 430, 5, 50);
  ctx.fillRect(730, 430, 50, 5);
  ctx.fillRect(730, 450, 50, 3);
  // Legs
  ctx.fillRect(732, 488, 4, 40);
  ctx.fillRect(774, 488, 4, 40);
}

export function createScene8(): SceneData {
  return {
    id: 8,
    title: 'La Camera Sigillata',
    subtitle: 'Capitolo VIII',
    storyIntro: 'Un uomo \u00E8 stato trovato morto in una stanza chiusa dall\'interno. Porte e finestre sbarrate. Eppure l\'assassino \u00E8 riuscito a fuggire. Come?',
    mystery: 'Come \u00E8 uscito l\'assassino dalla stanza chiusa?',
    solution: 'L\'assassino \u00E8 uscito dal camino, usando il filo per chiudere la finestra dall\'esterno e creare l\'illusione della stanza sigillata.',
    clues: makeClues(),
    requiredConnections: [
      { clueA: 'soot', clueB: 'draft' },
      { clueA: 'thread', clueB: 'clock' },
      { clueA: 'glass', clueB: 'compartment' },
    ],
    deductionQuestion: 'Come \u00E8 uscito l\'assassino?',
    deductionOptions: [
      { text: 'Dalla porta, aveva un complice', correct: false, explanation: 'La porta era chiusa dall\'interno con il chiavistello. Nessun complice poteva richiuderla.' },
      { text: 'Dal camino, usando un filo per la finestra', correct: true, explanation: 'La fuliggine nel camino, la corrente d\'aria, il filo sul chiavistello della finestra: l\'assassino \u00E8 salito dal camino e ha usato il filo per chiudere la finestra dall\'esterno.' },
      { text: 'Era gi\u00E0 morto quando la stanza \u00E8 stata chiusa', correct: false, explanation: 'Il bicchiere con il residuo e l\'orologio rotto indicano che qualcun altro era presente.' },
      { text: 'Da un passaggio segreto dietro la libreria', correct: false, explanation: 'La corrente d\'aria proviene dal camino, non dalla libreria. Lo scomparto nel tavolo conteneva solo documenti.' },
    ],
    solutionNarrative: 'L\'assassino ha avvelenato la vittima (residuo nel bicchiere), poi \u00E8 uscito arrampicandosi nel camino (fuliggine). Ha usato un filo sottile passato attraverso la finestra per chiudere il chiavistello dall\'esterno, creando l\'illusione della stanza sigillata. L\'orologio rotto segna l\'ora del delitto, e lo scomparto segreto nel tavolo conteneva i documenti che l\'assassino cercava.',
    draw,
  };
}
