// ─── Level 4: L'Atelier dell'Artista ─────────────────────────────────

import { type SceneData, type Clue } from '../types';
import { drawWall, drawFloor, drawFrame, drawWoodGrain, roundRect } from '../renderer';

function makeClues(): Clue[] {
  return [
    {
      id: 'pennello',
      x: 350, y: 400, radius: 22,
      name: 'Pennello',
      description: 'Un pennello con vernice fresca. Ma Marco non usa questo tipo di pennello per i restauri.',
      found: false,
    },
    {
      id: 'telecamera',
      x: 700, y: 280, radius: 25,
      name: 'Telecamera',
      description: 'La telecamera di sicurezza punta verso la finestra, non verso il quadro. Qualcuno l\'ha spostata.',
      found: false,
    },
    {
      id: 'impronta-scarpa',
      x: 500, y: 500, radius: 22,
      name: 'Impronta',
      description: 'Impronte di scarpe piccole sotto la finestra. Marco porta il 44.',
      found: false,
    },
    {
      id: 'email',
      x: 250, y: 350, radius: 25,
      name: 'Email',
      description: "Email stampata: 'Il compratore \u00E8 pronto. Consegna venerd\u00EC notte.' Firmata 'G.'",
      found: false,
    },
    {
      id: 'registro',
      x: 800, y: 420, radius: 22,
      name: 'Registro',
      description: "Il registro visitatori mostra che Giulia, l'assistente di galleria, \u00E8 entrata alle 23:00 di venerd\u00EC.",
      found: false,
    },
  ];
}

function draw(ctx: CanvasRenderingContext2D, time: number): void {
  // ── Walls ──
  drawWall(ctx, 0, 0, 1200, 550, '#2E2622', '#241E1A');

  // ── Skylight ──
  ctx.fillStyle = '#3A3A48';
  ctx.beginPath();
  ctx.moveTo(400, 0);
  ctx.lineTo(800, 0);
  ctx.lineTo(750, 40);
  ctx.lineTo(450, 40);
  ctx.closePath();
  ctx.fill();
  ctx.fillStyle = '#1A1A2E';
  ctx.fillRect(460, 5, 280, 30);
  const moonGrad = ctx.createRadialGradient(600, 30, 0, 600, 200, 200);
  moonGrad.addColorStop(0, 'rgba(150,150,200,0.04)');
  moonGrad.addColorStop(1, 'rgba(150,150,200,0)');
  ctx.fillStyle = moonGrad;
  ctx.fillRect(400, 0, 400, 400);

  // ── Floor - paint-stained wood ──
  drawFloor(ctx, 550, 250, '#4A3A2A', '#3A2A1A');
  drawWoodGrain(ctx, 0, 550, 1200, 250);
  const splatColors = ['#E63946', '#3A6AEA', '#FFD700', '#1A8A4A', '#8A3ACA'];
  splatColors.forEach((c, i) => {
    ctx.fillStyle = c;
    ctx.globalAlpha = 0.15;
    ctx.beginPath();
    ctx.ellipse(200 + i * 180, 620 + Math.sin(i) * 30, 15 + i * 3, 8, i * 0.5, 0, Math.PI * 2);
    ctx.fill();
  });
  ctx.globalAlpha = 1;

  // ── Clue 3: Small footprints near window ──
  ctx.save();
  ctx.globalAlpha = 0.35;
  ctx.fillStyle = '#5A5550';
  // Small shoe prints (size ~36-37)
  ctx.beginPath();
  ctx.ellipse(490, 500, 8, 14, -0.1, 0, Math.PI * 2);
  ctx.fill();
  ctx.beginPath();
  ctx.ellipse(510, 490, 8, 14, 0.05, 0, Math.PI * 2);
  ctx.fill();
  ctx.beginPath();
  ctx.ellipse(490, 480, 6, 5, -0.1, 0, Math.PI * 2);
  ctx.fill();
  ctx.beginPath();
  ctx.ellipse(510, 470, 6, 5, 0.05, 0, Math.PI * 2);
  ctx.fill();
  ctx.globalAlpha = 1;
  ctx.restore();

  // ── Easel with painting (center-left) ──
  const easelX = 350, easelY = 180;
  ctx.strokeStyle = '#5A4030';
  ctx.lineWidth = 6;
  ctx.beginPath();
  ctx.moveTo(easelX + 40, easelY);
  ctx.lineTo(easelX + 80, easelY + 450);
  ctx.stroke();
  ctx.beginPath();
  ctx.moveTo(easelX - 30, easelY + 50);
  ctx.lineTo(easelX - 50, easelY + 450);
  ctx.stroke();
  ctx.beginPath();
  ctx.moveTo(easelX + 90, easelY + 50);
  ctx.lineTo(easelX + 110, easelY + 450);
  ctx.stroke();
  ctx.fillStyle = '#5A4030';
  ctx.fillRect(easelX - 40, easelY + 320, 140, 8);

  // Canvas on easel — the fake painting
  const canvasX = easelX - 50, canvasY = easelY + 20;
  const canvasW = 180, canvasH = 280;
  drawFrame(ctx, canvasX, canvasY, canvasW, canvasH, '#6A5030');
  const paintGrad = ctx.createLinearGradient(canvasX, canvasY, canvasX, canvasY + canvasH);
  paintGrad.addColorStop(0, '#4A3A2A');
  paintGrad.addColorStop(1, '#3A2A1A');
  ctx.fillStyle = paintGrad;
  ctx.fillRect(canvasX, canvasY, canvasW, canvasH);
  ctx.fillStyle = '#5A4A3A';
  ctx.fillRect(canvasX + 10, canvasY + 10, canvasW - 20, canvasH - 20);
  // Figure in painting
  ctx.fillStyle = '#3A3030';
  ctx.beginPath();
  ctx.ellipse(canvasX + 90, canvasY + 80, 30, 35, 0, 0, Math.PI * 2);
  ctx.fill();
  ctx.fillRect(canvasX + 60, canvasY + 110, 60, 120);

  // ── Clue 1: Wrong brush near easel ──
  ctx.save();
  ctx.translate(340, 390);
  ctx.rotate(0.4);
  // A flat-tip brush (wrong for restoration — too wide)
  ctx.fillStyle = '#DAA520';
  ctx.fillRect(0, 0, 5, 50);
  ctx.fillStyle = '#CCC';
  ctx.fillRect(-1, 48, 7, 8);
  // Wide flat bristles with fresh paint
  ctx.fillStyle = '#3A6AEA';
  ctx.fillRect(-3, 56, 11, 12);
  ctx.restore();

  // ── Clue 4: Printed email on a side table ──
  ctx.fillStyle = '#4A3020';
  ctx.fillRect(200, 320, 120, 60);
  drawWoodGrain(ctx, 200, 320, 120, 60);
  // Email printout
  ctx.save();
  ctx.translate(215, 325);
  ctx.rotate(-0.02);
  ctx.fillStyle = '#FAFAF5';
  ctx.fillRect(0, 0, 80, 50);
  ctx.font = '5px monospace';
  ctx.fillStyle = '#333';
  ctx.textAlign = 'left';
  ctx.fillText('Da: G.', 5, 10);
  ctx.fillText('Oggetto: Consegna', 5, 18);
  ctx.fillText('Il compratore \u00E8', 5, 28);
  ctx.fillText('pronto. Venerd\u00EC', 5, 35);
  ctx.fillText('notte. \u2014G.', 5, 42);
  ctx.restore();

  // ── Security camera on wall (Clue 2: telecamera) ──
  ctx.save();
  ctx.fillStyle = '#333';
  ctx.fillRect(690, 265, 25, 18);
  ctx.fillStyle = '#222';
  ctx.beginPath();
  ctx.moveTo(715, 270);
  ctx.lineTo(730, 275);
  ctx.lineTo(715, 280);
  ctx.closePath();
  ctx.fill();
  // Red light (active)
  const blink = Math.sin(time * 0.003) > 0;
  ctx.fillStyle = blink ? '#E63946' : '#600';
  ctx.beginPath();
  ctx.arc(695, 270, 2, 0, Math.PI * 2);
  ctx.fill();
  // Arrow showing it points toward window (wrong direction)
  ctx.strokeStyle = 'rgba(230,57,70,0.4)';
  ctx.lineWidth = 1;
  ctx.setLineDash([4, 4]);
  ctx.beginPath();
  ctx.moveTo(730, 275);
  ctx.lineTo(800, 275);
  ctx.stroke();
  ctx.setLineDash([]);
  ctx.restore();

  // ── Clue 5: Visitor register on reception desk ──
  ctx.fillStyle = '#5A4030';
  ctx.fillRect(760, 400, 120, 50);
  drawWoodGrain(ctx, 760, 400, 120, 50);
  // Register book
  ctx.fillStyle = '#2A2A4A';
  ctx.fillRect(775, 405, 90, 40);
  ctx.fillStyle = '#F5F0E0';
  ctx.fillRect(780, 410, 40, 30);
  ctx.fillStyle = '#F0EBD8';
  ctx.fillRect(820, 410, 40, 30);
  // Entries
  ctx.font = '5px Georgia';
  ctx.fillStyle = '#333';
  ctx.textAlign = 'left';
  ctx.fillText('Marco 9:00', 783, 418);
  ctx.fillText('Giulia 23:00', 783, 426);
  ctx.fillStyle = '#E63946';
  ctx.fillText('Ven. notte', 783, 434);

  // ── Paint Table ──
  const tableX = 500, tableY = 480;
  ctx.fillStyle = 'rgba(0,0,0,0.2)';
  ctx.fillRect(tableX + 5, tableY + 5, 200, 80);
  ctx.fillStyle = '#5A4030';
  ctx.fillRect(tableX, tableY, 200, 80);
  drawWoodGrain(ctx, tableX, tableY, 200, 80);
  ctx.fillStyle = '#4A3020';
  ctx.fillRect(tableX + 10, tableY + 80, 8, 70);
  ctx.fillRect(tableX + 182, tableY + 80, 8, 70);

  // Palette
  ctx.fillStyle = '#8B6914';
  ctx.beginPath();
  ctx.ellipse(600, tableY + 20, 50, 25, 0, 0, Math.PI * 2);
  ctx.fill();
  const paletteColors = [
    { x: 590, y: tableY + 8, c: '#E63946', s: 6 },
    { x: 605, y: tableY + 5, c: '#3A6AEA', s: 7 },
    { x: 620, y: tableY + 10, c: '#FFD700', s: 5 },
    { x: 635, y: tableY + 8, c: '#1A8A4A', s: 6 },
  ];
  paletteColors.forEach(p => {
    ctx.fillStyle = p.c;
    ctx.beginPath();
    ctx.arc(p.x, p.y, p.s, 0, Math.PI * 2);
    ctx.fill();
  });

  // Brushes in jar
  ctx.fillStyle = '#6A6A70';
  ctx.fillRect(650, tableY - 10, 25, 40);
  ctx.fillStyle = '#5A5A60';
  ctx.beginPath();
  ctx.ellipse(662, tableY - 10, 13, 5, 0, 0, Math.PI * 2);
  ctx.fill();
  const brushColors = ['#8B4513', '#5A3A1A', '#DAA520', '#2A1A0A'];
  brushColors.forEach((c, i) => {
    ctx.fillStyle = c;
    ctx.save();
    ctx.translate(655 + i * 5, tableY - 10);
    ctx.rotate(-0.1 + i * 0.08);
    ctx.fillRect(-1, -40, 3, 40);
    ctx.fillStyle = '#333';
    ctx.beginPath();
    ctx.moveTo(-2, -40);
    ctx.lineTo(3, -40);
    ctx.lineTo(0.5, -50);
    ctx.closePath();
    ctx.fill();
    ctx.restore();
  });

  // ── Covered Painting (back wall) ──
  ctx.fillStyle = '#DDDAC8';
  ctx.beginPath();
  ctx.moveTo(900, 100);
  ctx.lineTo(980, 100);
  ctx.lineTo(990, 350);
  ctx.lineTo(890, 350);
  ctx.closePath();
  ctx.fill();
  ctx.strokeStyle = 'rgba(180,175,160,0.5)';
  ctx.lineWidth = 1;
  ctx.beginPath();
  ctx.moveTo(920, 100);
  ctx.quadraticCurveTo(915, 200, 910, 350);
  ctx.stroke();
  ctx.beginPath();
  ctx.moveTo(960, 100);
  ctx.quadraticCurveTo(965, 230, 970, 350);
  ctx.stroke();

  // ── Window (where footprints lead) ──
  ctx.fillStyle = '#3E2F1C';
  ctx.fillRect(465, 200, 90, 140);
  ctx.fillStyle = '#1A1A3E';
  ctx.fillRect(470, 205, 80, 130);
  ctx.fillStyle = '#3E2F1C';
  ctx.fillRect(508, 205, 4, 130);
  ctx.fillRect(470, 268, 80, 4);
  // Window slightly ajar
  ctx.fillStyle = '#0A0A14';
  ctx.fillRect(550, 300, 3, 35);

  // ── Stool ──
  ctx.fillStyle = '#5A4030';
  ctx.beginPath();
  ctx.ellipse(150, 520, 20, 8, 0, 0, Math.PI * 2);
  ctx.fill();
  ctx.fillStyle = '#4A3020';
  ctx.fillRect(146, 520, 3, 60);
  ctx.fillRect(150, 520, 3, 60);
  ctx.fillRect(154, 520, 3, 60);

  // ── Turpentine bottle ──
  ctx.fillStyle = 'rgba(150,180,140,0.3)';
  ctx.fillRect(710, tableY + 5, 15, 35);
  ctx.fillStyle = '#555';
  ctx.fillRect(710, tableY, 15, 8);
}

export function createScene5(): SceneData {
  return {
    id: 4,
    title: "L'Atelier dell'Artista",
    subtitle: 'Capitolo IV',
    storyIntro: "Un quadro prezioso \u00E8 stato sostituito con un falso nella galleria Corsini. L'ultimo a lavorare sul quadro era il restauratore Marco. Ma \u00E8 davvero lui il colpevole?",
    mystery: 'Chi ha sostituito il quadro?',
    solution: "Giulia, l'assistente di galleria, ha organizzato tutto: ha spostato la telecamera, \u00E8 entrata venerd\u00EC notte e ha scambiato il quadro con un falso.",
    clues: makeClues(),
    requiredConnections: [
      { clueA: 'telecamera', clueB: 'registro' },
      { clueA: 'email', clueB: 'impronta-scarpa' },
    ],
    deductionQuestion: 'Chi ha sostituito il quadro?',
    deductionOptions: [
      {
        text: 'Marco, il restauratore',
        correct: false,
        explanation: "Il pennello non \u00E8 del tipo che Marco usa, e le impronte sono troppo piccole (Marco porta il 44). Non \u00E8 lui.",
      },
      {
        text: "Giulia, l'assistente",
        correct: true,
        explanation: "Esatto! L'email firmata 'G.', le scarpe piccole (non taglia 44), la sua presenza venerd\u00EC notte nel registro e la telecamera spostata: tutto punta a Giulia.",
      },
      {
        text: 'Un ladro esterno',
        correct: false,
        explanation: 'La telecamera \u00E8 stata spostata da qualcuno interno, e il registro mostra solo personale autorizzato.',
      },
      {
        text: 'Il direttore della galleria',
        correct: false,
        explanation: "Nessun indizio collega il direttore. L'email \u00E8 firmata 'G.' e le impronte sono piccole.",
      },
    ],
    solutionNarrative: "Giulia, l'assistente di galleria, ha orchestrato il furto. Ha spostato la telecamera di sicurezza per non essere ripresa, \u00E8 entrata alle 23:00 di venerd\u00EC (confermato dal registro), ha usato un pennello inadatto ai restauri per dipingere il falso, e ha lasciato le sue impronte piccole sotto la finestra. L'email firmata 'G.' conferma che aveva gi\u00E0 un compratore pronto.",
    draw,
  };
}
