// ─── Level 2: La Biblioteca Segreta ──────────────────────────────────

import { type SceneData, type Clue } from '../types';
import { drawWoodGrain, drawBook, drawCandle, drawWall, drawFloor } from '../renderer';

function makeClues(): Clue[] {
  return [
    {
      id: 'libro',
      x: 350, y: 350, radius: 22,
      name: 'Libro aperto',
      description: 'Un libro di storia aperto sulla pagina dei Templari. Diversi passaggi sono sottolineati.',
      found: false,
    },
    {
      id: 'mappa',
      x: 700, y: 400, radius: 25,
      name: 'Mappa',
      description: "Una mappa dell'Italia con un cerchio rosso su Castel del Monte, Puglia.",
      found: false,
    },
    {
      id: 'lettera',
      x: 250, y: 500, radius: 22,
      name: 'Lettera',
      description: "Una lettera dal Vaticano: 'Caro Professore, la preghiamo di non proseguire le ricerche. Distinti saluti.'",
      found: false,
    },
    {
      id: 'diario',
      x: 550, y: 300, radius: 25,
      name: 'Diario',
      description: "L'ultimo appunto del diario: 'Ho trovato il collegamento. Devo andare a verificare di persona.'",
      found: false,
    },
    {
      id: 'biglietto-treno',
      x: 850, y: 450, radius: 22,
      name: 'Biglietto treno',
      description: 'Un biglietto ferroviario per Bari, data di oggi, ora 6:15.',
      found: false,
    },
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
  ctx.strokeStyle = 'rgba(0,0,0,0.2)';
  ctx.lineWidth = 1;
  for (let ty = 600; ty < 800; ty += 40) {
    for (let tx = 0; tx < 1200; tx += 50) {
      ctx.strokeRect(tx, ty, 50, 40);
    }
  }

  // ── Left bookshelf ──
  const shelfX = 40, shelfY = 50, shelfW = 250, shelfH = 530;
  ctx.fillStyle = '#3E2F1C';
  ctx.fillRect(shelfX, shelfY, shelfW, shelfH);
  drawWoodGrain(ctx, shelfX, shelfY, shelfW, shelfH, 'rgba(20,10,5,0.2)');
  for (let s = 0; s < 6; s++) {
    ctx.fillStyle = '#4A3828';
    ctx.fillRect(shelfX, shelfY + s * 88, shelfW, 6);
  }
  const colors1 = ['#6B1A1A', '#1A3A5A', '#3A2A5A', '#5A4A1A', '#1A4A3A', '#4A1A3A', '#8B4513', '#2F2F4F'];
  for (let row = 0; row < 5; row++) {
    let bx = shelfX + 5;
    for (let b = 0; b < 10; b++) {
      const bw = 12 + (row * 10 + b) % 12;
      const bh = 65 + (row * 7 + b * 3) % 15;
      const color = colors1[(row * 10 + b) % colors1.length];
      drawBook(ctx, bx, shelfY + row * 88 + 8 + (80 - bh), bw, bh, color);
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
      const bw = 12 + (row * 6 + b) % 12;
      const bh = 60 + (row * 5 + b * 4) % 18;
      drawBook(ctx, bx, shelfY + row * 88 + 8 + (80 - bh), bw, bh, colors2[(row * 6 + b) % colors2.length]);
      bx += bw + 2;
    }
  }

  // ── Reading Desk with open book (Clue 1: libro) ──
  const deskX = 300, deskY = 320, deskW = 180, deskH = 80;
  ctx.fillStyle = 'rgba(0,0,0,0.2)';
  ctx.fillRect(deskX + 5, deskY + 5, deskW, deskH);
  ctx.fillStyle = '#4A3020';
  ctx.fillRect(deskX, deskY, deskW, deskH);
  drawWoodGrain(ctx, deskX, deskY, deskW, deskH);
  ctx.fillStyle = '#3A2818';
  ctx.fillRect(deskX + 15, deskY + deskH, 10, 60);
  ctx.fillRect(deskX + deskW - 25, deskY + deskH, 10, 60);

  // Open book on this desk (Templars)
  ctx.fillStyle = '#F5E6CA';
  ctx.fillRect(320, deskY + 10, 65, 50);
  ctx.fillStyle = '#F0E0BE';
  ctx.fillRect(385, deskY + 10, 65, 50);
  ctx.fillStyle = '#8B4513';
  ctx.fillRect(383, deskY + 8, 4, 54);
  // Underlined text on pages
  ctx.fillStyle = 'rgba(30,20,10,0.3)';
  for (let tl = 0; tl < 6; tl++) {
    ctx.fillRect(325, deskY + 18 + tl * 7, 50, 1.5);
    ctx.fillRect(390, deskY + 18 + tl * 7, 50, 1.5);
  }
  // Red underlines (highlighted passages)
  ctx.strokeStyle = 'rgba(200,50,50,0.5)';
  ctx.lineWidth = 1;
  ctx.beginPath();
  ctx.moveTo(325, deskY + 26);
  ctx.lineTo(370, deskY + 26);
  ctx.moveTo(390, deskY + 33);
  ctx.lineTo(435, deskY + 33);
  ctx.stroke();

  // ── Map on wall (Clue 2: mappa) ──
  ctx.fillStyle = '#F5E6CA';
  ctx.fillRect(660, 360, 100, 80);
  ctx.strokeStyle = '#8B6914';
  ctx.lineWidth = 2;
  ctx.strokeRect(658, 358, 104, 84);
  // Italy shape (simplified)
  ctx.strokeStyle = '#4A3020';
  ctx.lineWidth = 1;
  ctx.beginPath();
  ctx.moveTo(695, 375);
  ctx.lineTo(710, 380);
  ctx.lineTo(715, 395);
  ctx.lineTo(708, 410);
  ctx.lineTo(700, 425);
  ctx.lineTo(710, 430);
  ctx.lineTo(705, 420);
  ctx.stroke();
  // Red circle on Castel del Monte area
  ctx.strokeStyle = '#E63946';
  ctx.lineWidth = 2;
  ctx.beginPath();
  ctx.arc(710, 418, 8, 0, Math.PI * 2);
  ctx.stroke();

  // ── Clue 3: Vatican letter on a side table ──
  ctx.fillStyle = '#4A3020';
  ctx.fillRect(210, 470, 100, 60);
  drawWoodGrain(ctx, 210, 470, 100, 60);
  // Letter
  ctx.save();
  ctx.translate(225, 475);
  ctx.rotate(-0.03);
  ctx.fillStyle = '#FAFAEF';
  ctx.fillRect(0, 0, 70, 50);
  // Vatican seal (simplified circle)
  ctx.fillStyle = '#DAA520';
  ctx.beginPath();
  ctx.arc(35, 12, 6, 0, Math.PI * 2);
  ctx.fill();
  ctx.font = '5px Georgia';
  ctx.fillStyle = '#333';
  ctx.textAlign = 'left';
  ctx.fillText('Caro Prof.', 5, 26);
  ctx.fillText('Non prosegua', 5, 33);
  ctx.fillText('le ricerche.', 5, 40);
  ctx.restore();

  // ── Diary on main desk (Clue 4: diario) ──
  ctx.fillStyle = '#5A3A1A';
  ctx.fillRect(520, 270, 80, 60);
  ctx.strokeStyle = '#3A2010';
  ctx.lineWidth = 1;
  ctx.strokeRect(520, 270, 80, 60);
  // Diary pages
  ctx.fillStyle = '#F5F0E0';
  ctx.fillRect(525, 275, 70, 50);
  ctx.font = '6px Georgia';
  ctx.fillStyle = '#333';
  ctx.textAlign = 'left';
  ctx.fillText('Ho trovato il', 530, 288);
  ctx.fillText('collegamento.', 530, 296);
  ctx.fillText('Devo andare a', 530, 304);
  ctx.fillText('verificare...', 530, 312);

  // ── Train ticket on floor (Clue 5: biglietto-treno) ──
  ctx.save();
  ctx.translate(840, 445);
  ctx.rotate(0.15);
  ctx.fillStyle = '#E8D5A0';
  ctx.fillRect(0, 0, 50, 25);
  ctx.fillStyle = '#8B0000';
  ctx.fillRect(0, 0, 50, 4);
  ctx.font = '5px monospace';
  ctx.fillStyle = '#333';
  ctx.textAlign = 'center';
  ctx.fillText('TRENITALIA', 25, 12);
  ctx.fillText('Roma > Bari', 25, 19);
  ctx.fillText('6:15', 25, 25);
  ctx.restore();

  // ── Candelabra ──
  const candleBaseX = 900, candleBaseY = 400;
  ctx.fillStyle = '#8B6914';
  ctx.beginPath();
  ctx.ellipse(candleBaseX, candleBaseY, 25, 6, 0, 0, Math.PI * 2);
  ctx.fill();
  ctx.fillRect(candleBaseX - 3, candleBaseY - 30, 6, 30);
  drawCandle(ctx, candleBaseX - 20, candleBaseY - 38, 30, time, '#F5E6CA');
  drawCandle(ctx, candleBaseX, candleBaseY - 30, 35, time + 500, '#F5E6CA');
  drawCandle(ctx, candleBaseX + 20, candleBaseY - 38, 28, time + 1000, '#F5E6CA');

  // ── Ladder ──
  ctx.strokeStyle = '#5A4030';
  ctx.lineWidth = 6;
  ctx.beginPath();
  ctx.moveTo(130, 80);
  ctx.lineTo(110, 600);
  ctx.stroke();
  ctx.beginPath();
  ctx.moveTo(170, 80);
  ctx.lineTo(150, 600);
  ctx.stroke();
  ctx.lineWidth = 4;
  for (let r = 0; r < 7; r++) {
    const ry = 120 + r * 70;
    ctx.beginPath();
    ctx.moveTo(112 + r * 2.5, ry);
    ctx.lineTo(168 - r * 2.5, ry);
    ctx.stroke();
  }

  // ── Globe ──
  const globeX = 950, globeY = 510;
  ctx.strokeStyle = '#8B6914';
  ctx.lineWidth = 3;
  ctx.beginPath();
  ctx.moveTo(globeX - 15, globeY + 40);
  ctx.lineTo(globeX, globeY + 25);
  ctx.lineTo(globeX + 15, globeY + 40);
  ctx.stroke();
  ctx.beginPath();
  ctx.moveTo(globeX, globeY + 25);
  ctx.lineTo(globeX, globeY);
  ctx.stroke();
  const globeGrad = ctx.createRadialGradient(globeX - 5, globeY - 10, 0, globeX, globeY, 25);
  globeGrad.addColorStop(0, '#4A7A5A');
  globeGrad.addColorStop(1, '#2A4A3A');
  ctx.fillStyle = globeGrad;
  ctx.beginPath();
  ctx.arc(globeX, globeY - 10, 25, 0, Math.PI * 2);
  ctx.fill();

  // ── Rug ──
  ctx.fillStyle = '#4A1A1A';
  ctx.fillRect(400, 640, 400, 100);
  ctx.strokeStyle = '#6A2A2A';
  ctx.lineWidth = 2;
  ctx.strokeRect(405, 645, 390, 90);

  // ── Wall sconces ──
  for (const sx of [500, 800]) {
    ctx.fillStyle = '#8B6914';
    ctx.fillRect(sx - 3, 180, 6, 15);
    ctx.beginPath();
    ctx.arc(sx, 178, 8, Math.PI, 0, true);
    ctx.fill();
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
    title: 'La Biblioteca Segreta',
    subtitle: 'Capitolo II',
    storyIntro: "Il professor Rossi \u00E8 scomparso dalla biblioteca dell'universit\u00E0. L'ultima persona a vederlo dice che stava cercando qualcosa di importante. Trova cosa cercava e dove \u00E8 andato.",
    mystery: 'Dove \u00E8 andato il Professor Rossi?',
    solution: 'Il professore ha scoperto un collegamento tra i Templari e Castel del Monte, ed \u00E8 partito per Bari per verificare di persona.',
    clues: makeClues(),
    requiredConnections: [
      { clueA: 'libro', clueB: 'mappa' },
      { clueA: 'diario', clueB: 'biglietto-treno' },
    ],
    deductionQuestion: 'Dove \u00E8 andato il Professor Rossi?',
    deductionOptions: [
      {
        text: 'A Roma, al Vaticano',
        correct: false,
        explanation: 'Il Vaticano gli ha chiesto di fermarsi, non di andare l\u00EC. Il biglietto \u00E8 per Bari, non Roma.',
      },
      {
        text: 'A Castel del Monte, in Puglia',
        correct: true,
        explanation: "Esatto! Il libro sui Templari, la mappa con Castel del Monte cerchiato, il diario che parla di 'verificare di persona' e il biglietto per Bari confermano la destinazione.",
      },
      {
        text: '\u00C8 stato rapito',
        correct: false,
        explanation: 'Non ci sono segni di lotta. Ha comprato un biglietto del treno e ha scritto nel diario la sua intenzione di partire.',
      },
      {
        text: '\u00C8 nascosto nella biblioteca',
        correct: false,
        explanation: "Il biglietto del treno per Bari e l'appunto 'devo andare a verificare' dimostrano che \u00E8 partito volontariamente.",
      },
    ],
    solutionNarrative: "Il Professor Rossi ha scoperto un collegamento tra i Templari e Castel del Monte in Puglia. Nonostante l'avvertimento del Vaticano, ha deciso di partire con il treno delle 6:15 per Bari per verificare di persona. Non \u00E8 scomparso: \u00E8 in viaggio verso la verit\u00E0.",
    draw,
  };
}
