// ─── Level 3: Il Treno delle 21:30 ──────────────────────────────────

import { type SceneData, type Clue } from '../types';
import { drawWoodGrain, drawWindow, roundRect } from '../renderer';

function makeClues(): Clue[] {
  return [
    {
      id: 'bicchiere',
      x: 400, y: 420, radius: 22,
      name: 'Bicchiere',
      description: 'Un bicchiere con residui biancastri sul fondo. Non \u00E8 zucchero.',
      found: false,
    },
    {
      id: 'biglietto-visita',
      x: 600, y: 350, radius: 22,
      name: 'Biglietto da visita',
      description: 'Dr. Fabbri, cardiologo. Il biglietto ha un numero di cellulare sul retro.',
      found: false,
    },
    {
      id: 'fazzoletto',
      x: 300, y: 380, radius: 22,
      name: 'Fazzoletto',
      description: "Un fazzoletto di seta con le iniziali 'V.M.' e un profumo forte di donna.",
      found: false,
    },
    {
      id: 'ricevuta',
      x: 750, y: 450, radius: 22,
      name: 'Ricevuta',
      description: 'Ricevuta della farmacia: sonnifero acquistato oggi alle 18:00.',
      found: false,
    },
    {
      id: 'foto',
      x: 500, y: 300, radius: 25,
      name: 'Foto',
      description: "Foto della vittima con una donna elegante. Sul retro: 'Per sempre tuo \u2014 V.'",
      found: false,
    },
  ];
}

function draw(ctx: CanvasRenderingContext2D, time: number): void {
  // ── Compartment walls ──
  const wallGrad = ctx.createLinearGradient(0, 0, 0, 800);
  wallGrad.addColorStop(0, '#2A1E14');
  wallGrad.addColorStop(0.4, '#3A2E22');
  wallGrad.addColorStop(1, '#1E1612');
  ctx.fillStyle = wallGrad;
  ctx.fillRect(0, 0, 1200, 800);

  // Ornate wallpaper
  ctx.fillStyle = 'rgba(80,60,40,0.1)';
  for (let py = 10; py < 800; py += 40) {
    for (let px = 10; px < 1200; px += 40) {
      ctx.beginPath();
      ctx.moveTo(px, py - 8);
      ctx.lineTo(px + 8, py);
      ctx.lineTo(px, py + 8);
      ctx.lineTo(px - 8, py);
      ctx.closePath();
      ctx.fill();
    }
  }

  // ── Ceiling molding ──
  ctx.fillStyle = '#4A3A28';
  ctx.fillRect(0, 0, 1200, 30);
  ctx.fillStyle = '#5A4A38';
  ctx.fillRect(0, 25, 1200, 8);
  ctx.fillStyle = '#6A5A48';
  for (let mx = 0; mx < 1200; mx += 30) {
    ctx.beginPath();
    ctx.arc(mx, 20, 4, 0, Math.PI * 2);
    ctx.fill();
  }

  // ── Floor + carpet ──
  ctx.fillStyle = '#1E1612';
  ctx.fillRect(0, 620, 1200, 180);
  ctx.fillStyle = '#4A1A20';
  ctx.fillRect(50, 630, 1100, 150);
  ctx.strokeStyle = '#6A2A30';
  ctx.lineWidth = 2;
  ctx.strokeRect(60, 640, 1080, 130);

  // ── Left Window ──
  const winX = 50, winY = 100, winW = 250, winH = 300;
  ctx.fillStyle = '#5A4A38';
  ctx.fillRect(winX - 8, winY - 8, winW + 16, winH + 16);
  drawWindow(ctx, winX, winY, winW, winH, time, true);
  // Curtains
  ctx.fillStyle = '#6A2030';
  ctx.beginPath();
  ctx.moveTo(winX - 5, winY - 5);
  ctx.quadraticCurveTo(winX + 30, winY + 100, winX + 20, winY + winH + 5);
  ctx.lineTo(winX - 5, winY + winH + 5);
  ctx.closePath();
  ctx.fill();
  ctx.beginPath();
  ctx.moveTo(winX + winW + 5, winY - 5);
  ctx.quadraticCurveTo(winX + winW - 30, winY + 100, winX + winW - 20, winY + winH + 5);
  ctx.lineTo(winX + winW + 5, winY + winH + 5);
  ctx.closePath();
  ctx.fill();
  ctx.fillStyle = '#B8860B';
  ctx.fillRect(winX - 20, winY - 15, winW + 40, 5);

  // ── Right Window ──
  const rWinX = 750, rWinY = 100, rWinW = 300, rWinH = 300;
  ctx.fillStyle = '#5A4A38';
  ctx.fillRect(rWinX - 8, rWinY - 8, rWinW + 16, rWinH + 16);
  drawWindow(ctx, rWinX, rWinY, rWinW, rWinH, time, true);
  ctx.fillStyle = '#6A2030';
  ctx.beginPath();
  ctx.moveTo(rWinX - 5, rWinY - 5);
  ctx.quadraticCurveTo(rWinX + 40, rWinY + 120, rWinX + 25, rWinY + rWinH + 5);
  ctx.lineTo(rWinX - 5, rWinY + rWinH + 5);
  ctx.closePath();
  ctx.fill();
  ctx.beginPath();
  ctx.moveTo(rWinX + rWinW + 5, rWinY - 5);
  ctx.quadraticCurveTo(rWinX + rWinW - 40, rWinY + 120, rWinX + rWinW - 25, rWinY + rWinH + 5);
  ctx.lineTo(rWinX + rWinW + 5, rWinY + rWinH + 5);
  ctx.closePath();
  ctx.fill();
  ctx.fillStyle = '#B8860B';
  ctx.fillRect(rWinX - 20, rWinY - 15, rWinW + 40, 5);

  // ── Left Seat ──
  const seatY = 450;
  ctx.fillStyle = '#3A1520';
  roundRect(ctx, 60, seatY - 100, 280, 120, 10);
  ctx.fill();
  ctx.fillStyle = '#5A2530';
  for (let bx = 100; bx < 320; bx += 50) {
    for (let by = seatY - 80; by < seatY; by += 40) {
      ctx.beginPath();
      ctx.arc(bx, by, 4, 0, Math.PI * 2);
      ctx.fill();
    }
  }
  ctx.fillStyle = '#5A2230';
  roundRect(ctx, 60, seatY + 15, 280, 55, 8);
  ctx.fill();

  // ── Clue 3: Silk handkerchief on left seat ──
  ctx.save();
  ctx.translate(280, 370);
  ctx.rotate(0.1);
  ctx.fillStyle = '#F0E8F5';
  ctx.fillRect(0, 0, 35, 35);
  ctx.strokeStyle = '#DAD0E8';
  ctx.lineWidth = 0.5;
  ctx.setLineDash([2, 2]);
  ctx.strokeRect(2, 2, 31, 31);
  ctx.setLineDash([]);
  ctx.font = 'italic 8px Georgia';
  ctx.fillStyle = '#6A3A7A';
  ctx.textAlign = 'center';
  ctx.fillText('V.M.', 17, 22);
  ctx.restore();

  // ── Right Seat ──
  ctx.fillStyle = '#3A1520';
  roundRect(ctx, 750, seatY - 100, 380, 120, 10);
  ctx.fill();
  ctx.fillStyle = '#5A2530';
  for (let bx = 790; bx < 1110; bx += 50) {
    for (let by = seatY - 80; by < seatY; by += 40) {
      ctx.beginPath();
      ctx.arc(bx, by, 4, 0, Math.PI * 2);
      ctx.fill();
    }
  }
  ctx.fillStyle = '#5A2230';
  roundRect(ctx, 750, seatY + 15, 380, 55, 8);
  ctx.fill();

  // ── Small Table ──
  ctx.fillStyle = '#5A4030';
  ctx.fillRect(380, seatY + 10, 120, 8);
  drawWoodGrain(ctx, 380, seatY + 10, 120, 8);
  ctx.fillStyle = '#4A3020';
  ctx.fillRect(435, seatY + 18, 10, 100);

  // ── Clue 1: Glass with residue on small table ──
  ctx.save();
  ctx.fillStyle = 'rgba(200,220,240,0.15)';
  ctx.fillRect(388, seatY - 30, 20, 40);
  ctx.beginPath();
  ctx.ellipse(398, seatY - 30, 10, 4, 0, 0, Math.PI * 2);
  ctx.fillStyle = 'rgba(200,220,240,0.2)';
  ctx.fill();
  // White residue at the bottom
  ctx.fillStyle = 'rgba(240,240,240,0.4)';
  ctx.beginPath();
  ctx.ellipse(398, seatY + 8, 7, 2, 0, 0, Math.PI * 2);
  ctx.fill();
  ctx.restore();

  // ── Mirror (between windows) ──
  const mirX = 450, mirY = 140;
  ctx.fillStyle = '#B8860B';
  ctx.fillRect(mirX - 4, mirY - 4, 128, 158);
  ctx.fillStyle = '#8B6914';
  ctx.fillRect(mirX, mirY, 120, 150);
  const mirGrad = ctx.createLinearGradient(mirX, mirY, mirX + 120, mirY + 150);
  mirGrad.addColorStop(0, '#2A2A3A');
  mirGrad.addColorStop(0.5, '#3A3A4A');
  mirGrad.addColorStop(1, '#2A2A35');
  ctx.fillStyle = mirGrad;
  ctx.fillRect(mirX + 3, mirY + 3, 114, 144);

  // ── Clue 5: Photo of victim with woman, lying near mirror ──
  ctx.save();
  ctx.translate(480, 285);
  ctx.rotate(-0.08);
  ctx.fillStyle = '#F5F0E0';
  ctx.fillRect(0, 0, 50, 40);
  ctx.fillStyle = '#CABFA5';
  ctx.fillRect(3, 3, 44, 28);
  // Two figures
  ctx.fillStyle = '#8A7560';
  ctx.beginPath();
  ctx.arc(18, 16, 6, 0, Math.PI * 2);
  ctx.fill();
  ctx.fillRect(12, 22, 12, 8);
  ctx.fillStyle = '#7A6555';
  ctx.beginPath();
  ctx.arc(35, 16, 6, 0, Math.PI * 2);
  ctx.fill();
  ctx.fillRect(29, 22, 12, 8);
  // Text on back visible at edge
  ctx.font = 'italic 5px Georgia';
  ctx.fillStyle = '#555';
  ctx.fillText('\u2014 V.', 38, 38);
  ctx.restore();

  // ── Clue 2: Business card in victim's jacket pocket area ──
  ctx.save();
  ctx.translate(585, 340);
  ctx.rotate(0.05);
  ctx.fillStyle = '#FAFAF5';
  ctx.fillRect(0, 0, 50, 28);
  ctx.font = '5px Georgia';
  ctx.fillStyle = '#222';
  ctx.textAlign = 'left';
  ctx.fillText('Dr. Fabbri', 4, 10);
  ctx.fillText('Cardiologo', 4, 17);
  ctx.font = '4px monospace';
  ctx.fillStyle = '#666';
  ctx.fillText('338-XXX-XXXX', 4, 24);
  ctx.restore();

  // ── Clue 4: Pharmacy receipt on floor near right seat ──
  ctx.save();
  ctx.translate(735, 445);
  ctx.rotate(-0.12);
  ctx.fillStyle = '#F0F0E8';
  ctx.fillRect(0, 0, 40, 55);
  ctx.font = '4px monospace';
  ctx.fillStyle = '#333';
  ctx.textAlign = 'left';
  ctx.fillText('FARMACIA', 3, 8);
  ctx.fillText('CENTRALE', 3, 14);
  ctx.fillText('----------', 3, 20);
  ctx.fillText('Sonnifero', 3, 27);
  ctx.fillText('x1', 3, 33);
  ctx.fillText('----------', 3, 39);
  ctx.fillText('18:00', 3, 46);
  ctx.restore();

  // ── Luggage Rack ──
  ctx.strokeStyle = '#B8860B';
  ctx.lineWidth = 3;
  ctx.beginPath();
  ctx.moveTo(750, 50);
  ctx.lineTo(1130, 50);
  ctx.stroke();
  for (const rx of [780, 950, 1100]) {
    ctx.beginPath();
    ctx.moveTo(rx, 50);
    ctx.lineTo(rx, 30);
    ctx.stroke();
  }

  // Suitcase on rack
  ctx.fillStyle = '#5A3A20';
  roundRect(ctx, 820, 55, 100, 25, 3);
  ctx.fill();
  ctx.strokeStyle = '#8B6914';
  ctx.lineWidth = 1;
  ctx.strokeRect(830, 58, 80, 19);

  // ── Coat Hook (right wall) ──
  ctx.fillStyle = '#B8860B';
  ctx.beginPath();
  ctx.arc(1100, 280, 6, 0, Math.PI * 2);
  ctx.fill();
  ctx.fillRect(1095, 280, 10, 5);
  ctx.fillStyle = '#1A1A2A';
  ctx.beginPath();
  ctx.moveTo(1080, 285);
  ctx.lineTo(1120, 285);
  ctx.lineTo(1130, 350);
  ctx.lineTo(1130, 550);
  ctx.lineTo(1070, 550);
  ctx.lineTo(1070, 350);
  ctx.closePath();
  ctx.fill();

  // ── Overhead lamp ──
  ctx.fillStyle = '#B8860B';
  ctx.fillRect(595, 0, 10, 40);
  ctx.fillStyle = '#F5E6CA';
  ctx.beginPath();
  ctx.moveTo(560, 50);
  ctx.lineTo(640, 50);
  ctx.lineTo(630, 40);
  ctx.lineTo(570, 40);
  ctx.closePath();
  ctx.fill();
  const lampGlow = ctx.createRadialGradient(600, 50, 0, 600, 80, 100);
  lampGlow.addColorStop(0, 'rgba(255,230,160,0.05)');
  lampGlow.addColorStop(1, 'rgba(255,230,160,0)');
  ctx.fillStyle = lampGlow;
  ctx.fillRect(500, 40, 200, 120);

  // ── Passing scenery ──
  const scrollX = (time * 0.1) % 400;
  ctx.save();
  ctx.globalAlpha = 0.05;
  ctx.fillStyle = '#1A3A1A';
  for (let t = -200; t < 500; t += 80) {
    const tx = winX + ((t - scrollX + 600) % 400) - 100;
    if (tx > winX && tx < winX + winW) {
      ctx.fillRect(tx, winY + 50, 8, 200);
      ctx.beginPath();
      ctx.arc(tx + 4, winY + 50, 20, 0, Math.PI * 2);
      ctx.fill();
    }
  }
  ctx.globalAlpha = 1;
  ctx.restore();
}

export function createScene4(): SceneData {
  return {
    id: 3,
    title: 'Il Treno delle 21:30',
    subtitle: 'Capitolo III',
    storyIntro: 'Un passeggero \u00E8 stato trovato privo di sensi nel vagone 7 del treno Roma-Milano. Tre persone erano nel vagone. Scopri cosa \u00E8 successo.',
    mystery: 'Chi ha drogato il passeggero?',
    solution: "La donna con iniziali V.M. ha acquistato il sonnifero e lo ha messo nel bicchiere della vittima. Il Dr. Fabbri era semplicemente il cardiologo della vittima.",
    clues: makeClues(),
    requiredConnections: [
      { clueA: 'bicchiere', clueB: 'ricevuta' },
      { clueA: 'fazzoletto', clueB: 'foto' },
      { clueA: 'biglietto-visita', clueB: 'bicchiere' },
    ],
    deductionQuestion: 'Chi ha drogato il passeggero?',
    deductionOptions: [
      {
        text: 'Il controllore del treno',
        correct: false,
        explanation: 'Nessun indizio collega il controllore ai fatti. Non ci sono elementi che lo riguardino.',
      },
      {
        text: 'La donna con iniziali V.M.',
        correct: true,
        explanation: "Esatto! Il fazzoletto con le iniziali V.M., la foto firmata 'V.', la ricevuta del sonnifero e i residui nel bicchiere indicano che V.M. ha drogato la vittima.",
      },
      {
        text: 'Il Dr. Fabbri',
        correct: false,
        explanation: 'Il biglietto da visita era nella tasca della vittima \u2014 il Dr. Fabbri era il suo cardiologo, non il colpevole.',
      },
      {
        text: 'Un passeggero sconosciuto',
        correct: false,
        explanation: 'Gli indizi puntano chiaramente a una persona che conosceva la vittima intimamente (la foto, il fazzoletto).',
      },
    ],
    solutionNarrative: "La donna V.M. conosceva intimamente la vittima ('Per sempre tuo \u2014 V.'). Ha acquistato un sonnifero in farmacia alle 18:00 e lo ha sciolto nel bicchiere della vittima durante il viaggio. Il fazzoletto con le sue iniziali e il profumo di donna confermano la sua presenza. Il Dr. Fabbri era solo il cardiologo della vittima.",
    draw,
  };
}
