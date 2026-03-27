// ─── Level 2: La Biblioteca (The Library) ───────────────────────────

import { type SceneData, type Clue } from '../types';
import { drawWoodGrain, drawBook, drawCandle, drawWall, drawFloor } from '../renderer';

function makeClues(): Clue[] {
  return [
    { id: 'pulled-book', x: 185, y: 280, radius: 20, name: 'Libro sporgente', description: 'Un libro sporge dallo scaffale con un dorso di colore diverso', found: false },
    { id: 'desk-message', x: 600, y: 530, radius: 25, name: 'Messaggio inciso', description: 'Un messaggio nascosto inciso nella superficie del tavolo', found: false },
    { id: 'floor-tile', x: 300, y: 680, radius: 25, name: 'Mattonella allentata', description: 'Una mattonella vicino alla scala è allentata', found: false },
    { id: 'globe-map', x: 950, y: 450, radius: 28, name: 'Mappa nel globo', description: 'Una crepa nel globo rivela una mappa nascosta', found: false },
    { id: 'odd-candle', x: 750, y: 395, radius: 20, name: 'Candela anomala', description: 'Una candela con cera di colore diverso dalle altre', found: false },
  ];
}

function draw(ctx: CanvasRenderingContext2D, time: number): void {
  // ── Walls ──
  drawWall(ctx, 0, 0, 1200, 600, '#1E1812', '#151010');

  // Wainscoting
  ctx.fillStyle = '#2A1E14';
  ctx.fillRect(0, 400, 1200, 200);
  ctx.strokeStyle = '#3A2E1E';
  ctx.lineWidth = 2;
  ctx.beginPath();
  ctx.moveTo(0, 400);
  ctx.lineTo(1200, 400);
  ctx.stroke();

  // ── Floor - stone tiles ──
  drawFloor(ctx, 600, 200, '#3A3430', '#2A2420');
  // Tile pattern
  ctx.strokeStyle = 'rgba(0,0,0,0.2)';
  ctx.lineWidth = 1;
  for (let ty = 600; ty < 800; ty += 40) {
    for (let tx = 0; tx < 1200; tx += 50) {
      ctx.strokeRect(tx, ty, 50, 40);
    }
  }

  // Clue 3: Loose floor tile
  ctx.fillStyle = '#3E3834';
  ctx.fillRect(280, 660, 50, 40);
  ctx.strokeStyle = '#555';
  ctx.lineWidth = 1;
  ctx.strokeRect(280, 660, 50, 40);
  // Slight offset to show it's loose
  ctx.fillStyle = '#1A1410';
  ctx.fillRect(282, 698, 46, 3);

  // ── Left bookshelf ──
  const shelfX = 40, shelfY = 50, shelfW = 250, shelfH = 530;
  ctx.fillStyle = '#3E2F1C';
  ctx.fillRect(shelfX, shelfY, shelfW, shelfH);
  drawWoodGrain(ctx, shelfX, shelfY, shelfW, shelfH, 'rgba(20,10,5,0.2)');
  // Shelf dividers
  for (let s = 0; s < 6; s++) {
    ctx.fillStyle = '#4A3828';
    ctx.fillRect(shelfX, shelfY + s * 88, shelfW, 6);
  }
  // Books on each shelf
  const colors1 = ['#6B1A1A', '#1A3A5A', '#3A2A5A', '#5A4A1A', '#1A4A3A', '#4A1A3A', '#8B4513', '#2F2F4F'];
  for (let row = 0; row < 5; row++) {
    let bx = shelfX + 5;
    for (let b = 0; b < 10; b++) {
      const bw = 12 + Math.random() * 12;
      const bh = 65 + Math.random() * 15;
      const color = colors1[(row * 10 + b) % colors1.length];

      // Clue 1: One specific book sticks out
      if (row === 2 && b === 5) {
        drawBook(ctx, bx, shelfY + row * 88 + 8 + (80 - bh), bw + 3, bh, '#C4A030', '#FFF');
        // Make it protrude
        ctx.fillStyle = '#C4A030';
        ctx.fillRect(bx, shelfY + row * 88 + 8 + (80 - bh), bw + 3, bh);
        ctx.fillStyle = 'rgba(0,0,0,0.15)';
        ctx.fillRect(bx + bw + 1, shelfY + row * 88 + 10 + (80 - bh), 5, bh - 2);
      } else {
        drawBook(ctx, bx, shelfY + row * 88 + 8 + (80 - bh), bw, bh, color);
      }
      bx += bw + 2;
    }
  }

  // ── Right bookshelf ──
  const rShelfX = 1000;
  ctx.fillStyle = '#3E2F1C';
  ctx.fillRect(rShelfX, shelfY, 170, shelfH);
  drawWoodGrain(ctx, rShelfX, shelfY, 170, shelfH, 'rgba(20,10,5,0.2)');
  for (let s = 0; s < 6; s++) {
    ctx.fillStyle = '#4A3828';
    ctx.fillRect(rShelfX, shelfY + s * 88, 170, 6);
  }
  const colors2 = ['#4A1A1A', '#1A2A4A', '#2A3A2A', '#5A3A1A', '#3A1A4A'];
  for (let row = 0; row < 5; row++) {
    let bx = rShelfX + 5;
    for (let b = 0; b < 6; b++) {
      const bw = 12 + Math.random() * 12;
      const bh = 60 + Math.random() * 18;
      drawBook(ctx, bx, shelfY + row * 88 + 8 + (80 - bh), bw, bh, colors2[(row * 6 + b) % colors2.length]);
      bx += bw + 2;
    }
  }

  // ── Reading Desk ──
  const deskX = 450, deskY = 480, deskW = 350, deskH = 120;
  ctx.fillStyle = 'rgba(0,0,0,0.2)';
  ctx.fillRect(deskX + 8, deskY + 8, deskW, deskH);
  ctx.fillStyle = '#4A3020';
  ctx.fillRect(deskX, deskY, deskW, deskH);
  drawWoodGrain(ctx, deskX, deskY, deskW, deskH);
  ctx.fillStyle = '#5A3E2C';
  ctx.fillRect(deskX, deskY, deskW, 4);
  // Desk legs
  ctx.fillStyle = '#3A2818';
  ctx.fillRect(deskX + 20, deskY + deskH, 15, 80);
  ctx.fillRect(deskX + deskW - 35, deskY + deskH, 15, 80);

  // Clue 2: Hidden message carved in desk
  ctx.save();
  ctx.strokeStyle = 'rgba(80,70,50,0.4)';
  ctx.lineWidth = 0.8;
  ctx.font = 'italic 9px Georgia';
  ctx.fillStyle = 'rgba(80,70,50,0.35)';
  ctx.fillText('SOTTO LA TERZA', 570, 525);
  ctx.fillText('PIETRA', 590, 537);
  ctx.restore();

  // Open book on desk
  ctx.fillStyle = '#F5E6CA';
  ctx.fillRect(500, deskY + 15, 80, 55);
  ctx.fillStyle = '#F0E0BE';
  ctx.fillRect(580, deskY + 15, 80, 55);
  // Book spine
  ctx.fillStyle = '#8B4513';
  ctx.fillRect(578, deskY + 12, 4, 60);
  // Text on pages
  ctx.fillStyle = 'rgba(30,20,10,0.3)';
  for (let tl = 0; tl < 8; tl++) {
    ctx.fillRect(505, deskY + 22 + tl * 6, 60 + Math.random() * 15, 1.5);
    ctx.fillRect(585, deskY + 22 + tl * 6, 60 + Math.random() * 15, 1.5);
  }

  // ── Ladder (left of center) ──
  ctx.strokeStyle = '#5A4030';
  ctx.lineWidth = 6;
  // Rails
  ctx.beginPath();
  ctx.moveTo(330, 80);
  ctx.lineTo(310, 680);
  ctx.stroke();
  ctx.beginPath();
  ctx.moveTo(370, 80);
  ctx.lineTo(350, 680);
  ctx.stroke();
  // Rungs
  ctx.lineWidth = 4;
  for (let r = 0; r < 8; r++) {
    const ry = 120 + r * 70;
    ctx.beginPath();
    ctx.moveTo(312 + r * 2.5, ry);
    ctx.lineTo(368 - r * 2.5, ry);
    ctx.stroke();
  }

  // ── Globe (right) ──
  const globeX = 950, globeY = 445;
  // Stand
  ctx.strokeStyle = '#8B6914';
  ctx.lineWidth = 3;
  ctx.beginPath();
  ctx.moveTo(globeX - 20, globeY + 60);
  ctx.lineTo(globeX, globeY + 40);
  ctx.lineTo(globeX + 20, globeY + 60);
  ctx.stroke();
  ctx.beginPath();
  ctx.moveTo(globeX, globeY + 40);
  ctx.lineTo(globeX, globeY - 5);
  ctx.stroke();
  // Globe sphere
  const globeGrad = ctx.createRadialGradient(globeX - 8, globeY - 15, 0, globeX, globeY, 35);
  globeGrad.addColorStop(0, '#4A7A5A');
  globeGrad.addColorStop(0.5, '#3A6A4A');
  globeGrad.addColorStop(1, '#2A4A3A');
  ctx.fillStyle = globeGrad;
  ctx.beginPath();
  ctx.arc(globeX, globeY, 35, 0, Math.PI * 2);
  ctx.fill();
  // Meridian
  ctx.strokeStyle = '#8B6914';
  ctx.lineWidth = 1.5;
  ctx.beginPath();
  ctx.ellipse(globeX, globeY, 36, 36, 0, 0, Math.PI * 2);
  ctx.stroke();
  // Continents hint
  ctx.fillStyle = '#5A8A4A';
  ctx.beginPath();
  ctx.ellipse(globeX - 10, globeY - 8, 12, 8, 0.3, 0, Math.PI * 2);
  ctx.fill();
  ctx.beginPath();
  ctx.ellipse(globeX + 12, globeY + 5, 8, 12, -0.2, 0, Math.PI * 2);
  ctx.fill();

  // Clue 4: Crack in globe
  ctx.strokeStyle = '#1A1A1A';
  ctx.lineWidth = 1.5;
  ctx.beginPath();
  ctx.moveTo(globeX + 15, globeY - 20);
  ctx.lineTo(globeX + 20, globeY - 10);
  ctx.lineTo(globeX + 18, globeY);
  ctx.lineTo(globeX + 22, globeY + 8);
  ctx.stroke();
  // Paper visible through crack
  ctx.fillStyle = '#F5E6CA';
  ctx.fillRect(globeX + 17, globeY - 8, 4, 12);

  // ── Candelabra (center table) ──
  const candleBaseX = 700, candleBaseY = deskY + 5;
  // Base
  ctx.fillStyle = '#8B6914';
  ctx.beginPath();
  ctx.ellipse(candleBaseX, candleBaseY, 25, 6, 0, 0, Math.PI * 2);
  ctx.fill();
  ctx.fillRect(candleBaseX - 3, candleBaseY - 30, 6, 30);
  // Arms
  ctx.beginPath();
  ctx.moveTo(candleBaseX - 3, candleBaseY - 25);
  ctx.lineTo(candleBaseX - 30, candleBaseY - 35);
  ctx.lineTo(candleBaseX - 30, candleBaseY - 38);
  ctx.stroke();
  ctx.beginPath();
  ctx.moveTo(candleBaseX + 3, candleBaseY - 25);
  ctx.lineTo(candleBaseX + 30, candleBaseY - 35);
  ctx.lineTo(candleBaseX + 30, candleBaseY - 38);
  ctx.stroke();

  // Normal candles
  drawCandle(ctx, candleBaseX - 30, candleBaseY - 38, 30, time, '#F5E6CA');
  drawCandle(ctx, candleBaseX, candleBaseY - 30, 35, time + 500, '#F5E6CA');

  // Clue 5: Odd candle - different wax color (red instead of cream)
  drawCandle(ctx, candleBaseX + 30, candleBaseY - 38, 28, time + 1000, '#C44040');

  // ── Rug on floor ──
  ctx.fillStyle = '#4A1A1A';
  ctx.fillRect(400, 630, 400, 100);
  ctx.strokeStyle = '#6A2A2A';
  ctx.lineWidth = 2;
  ctx.strokeRect(405, 635, 390, 90);
  ctx.strokeRect(415, 645, 370, 70);
  // Pattern
  ctx.fillStyle = '#5A2828';
  for (let px = 425; px < 780; px += 30) {
    ctx.beginPath();
    ctx.arc(px, 680, 6, 0, Math.PI * 2);
    ctx.fill();
  }

  // ── Wall sconces ──
  for (const sx of [500, 800]) {
    ctx.fillStyle = '#8B6914';
    ctx.fillRect(sx - 3, 180, 6, 15);
    ctx.beginPath();
    ctx.arc(sx, 178, 8, Math.PI, 0, true);
    ctx.fill();
    // Small flame
    const fl = Math.sin(time * 0.008 + sx) * 2;
    ctx.fillStyle = `rgba(255,200,80,${0.4 + Math.sin(time * 0.01 + sx) * 0.1})`;
    ctx.beginPath();
    ctx.ellipse(sx, 170 + fl, 3, 6, 0, 0, Math.PI * 2);
    ctx.fill();
  }

  // ── Ceiling beam ──
  ctx.fillStyle = '#2A1E14';
  ctx.fillRect(0, 0, 1200, 20);
  ctx.fillStyle = '#3A2E1E';
  ctx.fillRect(0, 15, 1200, 8);
}

export function createScene2(): SceneData {
  return {
    id: 2,
    title: 'La Biblioteca',
    subtitle: 'Capitolo II',
    mystery: 'Dove conduce il passaggio segreto?',
    solution: 'Il libro sporgente, il messaggio inciso, la mattonella, la mappa nel globo e la candela rossa indicano un passaggio sotto la terza pietra.',
    clues: makeClues(),
    draw,
  };
}
