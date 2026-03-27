// ─── Level 5: L'Atelier (The Atelier) ───────────────────────────────

import { type SceneData, type Clue } from '../types';
import { drawWall, drawFloor, drawFrame, drawWoodGrain, roundRect } from '../renderer';

function makeClues(): Clue[] {
  return [
    { id: 'hidden-face', x: 320, y: 310, radius: 28, name: 'Volto nascosto', description: 'Un volto dipinto sotto lo strato superiore del quadro', found: false },
    { id: 'signature', x: 850, y: 580, radius: 22, name: 'Firma nascosta', description: 'Una firma nascosta sul retro di uno schizzo', found: false },
    { id: 'key-in-tube', x: 580, y: 530, radius: 22, name: 'Chiave nel tubetto', description: 'Una chiave nascosta dentro un tubetto di colore', found: false },
    { id: 'letters-mirror', x: 950, y: 300, radius: 25, name: 'Lettere nello specchio', description: 'Lettere nascoste dietro lo specchio crepato', found: false },
    { id: 'odd-paint', x: 620, y: 490, radius: 22, name: 'Colore diverso', description: 'Un tipo di colore diverso (olio tra gli acrilici) sulla tavolozza', found: false },
    { id: 'easel-date', x: 250, y: 620, radius: 22, name: 'Data incisa', description: 'Una data graffiata nella gamba del cavalletto', found: false },
  ];
}

function draw(ctx: CanvasRenderingContext2D, time: number): void {
  // ── Walls ──
  drawWall(ctx, 0, 0, 1200, 550, '#2E2622', '#241E1A');

  // ── Skylight (top center) ──
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
  // Moonlight through skylight
  const moonGrad = ctx.createRadialGradient(600, 30, 0, 600, 200, 200);
  moonGrad.addColorStop(0, 'rgba(150,150,200,0.04)');
  moonGrad.addColorStop(1, 'rgba(150,150,200,0)');
  ctx.fillStyle = moonGrad;
  ctx.fillRect(400, 0, 400, 400);

  // ── Floor - paint-stained wood ──
  drawFloor(ctx, 550, 250, '#4A3A2A', '#3A2A1A');
  drawWoodGrain(ctx, 0, 550, 1200, 250);
  // Paint splatters on floor
  const splatColors = ['#E63946', '#3A6AEA', '#FFD700', '#1A8A4A', '#8A3ACA'];
  splatColors.forEach((c, i) => {
    ctx.fillStyle = c;
    ctx.globalAlpha = 0.15;
    ctx.beginPath();
    ctx.ellipse(200 + i * 180, 620 + Math.sin(i) * 30, 15 + i * 3, 8, i * 0.5, 0, Math.PI * 2);
    ctx.fill();
  });
  ctx.globalAlpha = 1;

  // ── Easel (center-left) ──
  const easelX = 250, easelY = 180;
  // Back leg
  ctx.strokeStyle = '#5A4030';
  ctx.lineWidth = 6;
  ctx.beginPath();
  ctx.moveTo(easelX + 40, easelY);
  ctx.lineTo(easelX + 80, easelY + 450);
  ctx.stroke();
  // Front legs
  ctx.beginPath();
  ctx.moveTo(easelX - 30, easelY + 50);
  ctx.lineTo(easelX - 50, easelY + 450);
  ctx.stroke();
  ctx.beginPath();
  ctx.moveTo(easelX + 90, easelY + 50);
  ctx.lineTo(easelX + 110, easelY + 450);
  ctx.stroke();
  // Canvas holder shelf
  ctx.fillStyle = '#5A4030';
  ctx.fillRect(easelX - 40, easelY + 320, 140, 8);
  // Cross bar
  ctx.strokeStyle = '#5A4030';
  ctx.lineWidth = 4;
  ctx.beginPath();
  ctx.moveTo(easelX - 35, easelY + 280);
  ctx.lineTo(easelX + 95, easelY + 280);
  ctx.stroke();

  // Clue 6: Date scratched into easel leg
  ctx.save();
  ctx.font = '8px monospace';
  ctx.fillStyle = 'rgba(120,100,70,0.4)';
  ctx.translate(250, 620);
  ctx.rotate(-0.05);
  ctx.fillText('14.III.1923', 0, 0);
  ctx.restore();

  // ── Canvas on easel ──
  const canvasX = easelX - 50, canvasY = easelY + 20;
  const canvasW = 180, canvasH = 280;
  drawFrame(ctx, canvasX, canvasY, canvasW, canvasH, '#6A5030');
  // Painting content - a portrait
  const paintGrad = ctx.createLinearGradient(canvasX, canvasY, canvasX, canvasY + canvasH);
  paintGrad.addColorStop(0, '#4A3A2A');
  paintGrad.addColorStop(1, '#3A2A1A');
  ctx.fillStyle = paintGrad;
  ctx.fillRect(canvasX, canvasY, canvasW, canvasH);
  // Background of painting
  ctx.fillStyle = '#5A4A3A';
  ctx.fillRect(canvasX + 10, canvasY + 10, canvasW - 20, canvasH - 20);
  // Figure silhouette
  ctx.fillStyle = '#3A3030';
  ctx.beginPath();
  ctx.ellipse(canvasX + 90, canvasY + 80, 30, 35, 0, 0, Math.PI * 2);
  ctx.fill();
  ctx.fillRect(canvasX + 60, canvasY + 110, 60, 120);
  // Painted-over face
  ctx.fillStyle = '#5A4A3A';
  ctx.beginPath();
  ctx.ellipse(canvasX + 90, canvasY + 80, 25, 30, 0, 0, Math.PI * 2);
  ctx.fill();

  // Clue 1: Hidden face visible underneath
  ctx.save();
  ctx.globalAlpha = 0.25;
  ctx.fillStyle = '#D4A574';
  ctx.beginPath();
  ctx.ellipse(320, 300, 18, 22, 0, 0, Math.PI * 2);
  ctx.fill();
  // Eyes peeking through
  ctx.fillStyle = '#2A4A6A';
  ctx.beginPath();
  ctx.ellipse(313, 295, 3, 2, 0, 0, Math.PI * 2);
  ctx.fill();
  ctx.beginPath();
  ctx.ellipse(327, 295, 3, 2, 0, 0, Math.PI * 2);
  ctx.fill();
  ctx.globalAlpha = 1;
  ctx.restore();

  // ── Paint Table ──
  const tableX = 500, tableY = 480;
  ctx.fillStyle = 'rgba(0,0,0,0.2)';
  ctx.fillRect(tableX + 5, tableY + 5, 200, 80);
  ctx.fillStyle = '#5A4030';
  ctx.fillRect(tableX, tableY, 200, 80);
  drawWoodGrain(ctx, tableX, tableY, 200, 80);
  // Table legs
  ctx.fillStyle = '#4A3020';
  ctx.fillRect(tableX + 10, tableY + 80, 8, 70);
  ctx.fillRect(tableX + 182, tableY + 80, 8, 70);

  // ── Palette on table ──
  ctx.fillStyle = '#8B6914';
  ctx.beginPath();
  ctx.ellipse(600, tableY + 20, 50, 25, 0, 0, Math.PI * 2);
  ctx.fill();
  // Thumb hole
  ctx.fillStyle = '#5A4030';
  ctx.beginPath();
  ctx.ellipse(575, tableY + 20, 8, 6, 0, 0, Math.PI * 2);
  ctx.fill();
  // Paint dabs on palette - all acrylic-looking (matte)
  const paletteColors = [
    { x: 590, y: tableY + 8, c: '#E63946', s: 6 },
    { x: 605, y: tableY + 5, c: '#3A6AEA', s: 7 },
    { x: 620, y: tableY + 10, c: '#FFD700', s: 5 },
    { x: 635, y: tableY + 8, c: '#1A8A4A', s: 6 },
    { x: 610, y: tableY + 25, c: '#F5F5F5', s: 5 },
  ];
  paletteColors.forEach(p => {
    ctx.fillStyle = p.c;
    ctx.beginPath();
    ctx.arc(p.x, p.y, p.s, 0, Math.PI * 2);
    ctx.fill();
  });

  // Clue 5: Odd paint - oil among acrylics (glossy look)
  ctx.save();
  ctx.fillStyle = '#8A3ACA';
  ctx.beginPath();
  ctx.arc(620, tableY + 25, 6, 0, Math.PI * 2);
  ctx.fill();
  // Glossy highlight to indicate oil
  ctx.fillStyle = 'rgba(255,255,255,0.3)';
  ctx.beginPath();
  ctx.arc(618, tableY + 23, 2, 0, Math.PI * 2);
  ctx.fill();
  ctx.restore();

  // ── Paint tubes ──
  const tubeY = tableY + 35;
  const tubes = [
    { x: 520, c: '#E63946' },
    { x: 545, c: '#3A6AEA' },
    { x: 570, c: '#FFD700' },
    { x: 595, c: '#1A8A4A' },
  ];
  tubes.forEach(t => {
    ctx.fillStyle = t.c;
    ctx.fillRect(t.x, tubeY, 12, 30);
    ctx.fillStyle = '#CCC';
    ctx.fillRect(t.x, tubeY + 25, 12, 8);
  });

  // Clue 3: Key hidden in a paint tube
  ctx.save();
  ctx.fillStyle = '#8A3ACA';
  ctx.fillRect(570, tubeY, 12, 30);
  ctx.fillStyle = '#CCC';
  ctx.fillRect(570, tubeY + 25, 12, 8);
  // Key tip visible
  ctx.fillStyle = '#B8860B';
  ctx.fillRect(574, tubeY + 30, 4, 6);
  ctx.restore();

  // ── Brushes in jar ──
  ctx.fillStyle = '#6A6A70';
  ctx.fillRect(650, tableY - 10, 25, 40);
  ctx.fillStyle = '#5A5A60';
  ctx.beginPath();
  ctx.ellipse(662, tableY - 10, 13, 5, 0, 0, Math.PI * 2);
  ctx.fill();
  // Brush handles
  const brushColors = ['#8B4513', '#5A3A1A', '#DAA520', '#2A1A0A'];
  brushColors.forEach((c, i) => {
    ctx.fillStyle = c;
    ctx.save();
    ctx.translate(655 + i * 5, tableY - 10);
    ctx.rotate(-0.1 + i * 0.08);
    ctx.fillRect(-1, -40, 3, 40);
    // Brush tip
    ctx.fillStyle = '#333';
    ctx.beginPath();
    ctx.moveTo(-2, -40);
    ctx.lineTo(3, -40);
    ctx.lineTo(0.5, -50);
    ctx.closePath();
    ctx.fill();
    ctx.restore();
  });

  // ── Cracked Mirror (right wall) ──
  const mirX = 900, mirY = 200, mirW = 120, mirH = 200;
  drawFrame(ctx, mirX, mirY, mirW, mirH, '#6A5A3A');
  // Mirror surface
  const mirGrad = ctx.createLinearGradient(mirX, mirY, mirX + mirW, mirY + mirH);
  mirGrad.addColorStop(0, '#3A3A4A');
  mirGrad.addColorStop(0.5, '#4A4A5A');
  mirGrad.addColorStop(1, '#3A3A45');
  ctx.fillStyle = mirGrad;
  ctx.fillRect(mirX, mirY, mirW, mirH);
  // Crack lines
  ctx.strokeStyle = 'rgba(200,200,220,0.3)';
  ctx.lineWidth = 1;
  ctx.beginPath();
  ctx.moveTo(mirX + 60, mirY + 50);
  ctx.lineTo(mirX + 80, mirY + 90);
  ctx.lineTo(mirX + 70, mirY + 140);
  ctx.stroke();
  ctx.beginPath();
  ctx.moveTo(mirX + 80, mirY + 90);
  ctx.lineTo(mirX + 110, mirY + 70);
  ctx.stroke();
  ctx.beginPath();
  ctx.moveTo(mirX + 80, mirY + 90);
  ctx.lineTo(mirX + 50, mirY + 120);
  ctx.stroke();

  // Clue 4: Letters visible behind the crack
  ctx.save();
  ctx.font = '7px Georgia';
  ctx.fillStyle = 'rgba(200,180,140,0.3)';
  ctx.fillText('A mia cara', mirX + 55, mirY + 100);
  ctx.fillText('sorella...', mirX + 60, mirY + 112);
  ctx.restore();

  // ── Scattered Sketches (floor, right) ──
  const sketches = [
    { x: 800, y: 550, r: 0.1 },
    { x: 830, y: 570, r: -0.15 },
    { x: 860, y: 540, r: 0.2 },
    { x: 820, y: 590, r: -0.05 },
  ];
  sketches.forEach((s, i) => {
    ctx.save();
    ctx.translate(s.x, s.y);
    ctx.rotate(s.r);
    ctx.fillStyle = '#F5F0E0';
    ctx.fillRect(0, 0, 60, 45);
    // Sketch lines
    ctx.strokeStyle = 'rgba(30,30,30,0.3)';
    ctx.lineWidth = 0.5;
    ctx.beginPath();
    ctx.moveTo(10, 10);
    ctx.quadraticCurveTo(30, 5 + i * 5, 50, 15);
    ctx.stroke();
    ctx.beginPath();
    ctx.arc(30, 25, 10, 0, Math.PI * 2);
    ctx.stroke();
    ctx.restore();
  });

  // Clue 2: Hidden signature on back of a sketch
  ctx.save();
  ctx.translate(850, 580);
  ctx.rotate(-0.05);
  ctx.fillStyle = '#F5F0E0';
  ctx.fillRect(0, 0, 60, 45);
  // Flipped corner showing back
  ctx.fillStyle = '#E8E0D0';
  ctx.beginPath();
  ctx.moveTo(45, 0);
  ctx.lineTo(60, 0);
  ctx.lineTo(60, 15);
  ctx.closePath();
  ctx.fill();
  // Signature visible on exposed back
  ctx.font = 'italic 6px Georgia';
  ctx.fillStyle = 'rgba(30,30,30,0.4)';
  ctx.fillText('G. Morell', 48, 10);
  ctx.restore();

  // ── Covered Painting (back wall) ──
  ctx.fillStyle = '#DDDAC8';
  ctx.beginPath();
  ctx.moveTo(700, 100);
  ctx.lineTo(780, 100);
  ctx.lineTo(790, 450);
  ctx.lineTo(690, 450);
  ctx.closePath();
  ctx.fill();
  // Drape folds
  ctx.strokeStyle = 'rgba(180,175,160,0.5)';
  ctx.lineWidth = 1;
  ctx.beginPath();
  ctx.moveTo(720, 100);
  ctx.quadraticCurveTo(715, 250, 710, 450);
  ctx.stroke();
  ctx.beginPath();
  ctx.moveTo(760, 100);
  ctx.quadraticCurveTo(765, 280, 770, 450);
  ctx.stroke();
  // Frame visible at bottom
  ctx.fillStyle = '#6A5030';
  ctx.fillRect(693, 440, 94, 10);

  // ── Stool ──
  ctx.fillStyle = '#5A4030';
  ctx.beginPath();
  ctx.ellipse(420, 560, 20, 8, 0, 0, Math.PI * 2);
  ctx.fill();
  ctx.fillStyle = '#4A3020';
  ctx.fillRect(416, 560, 3, 60);
  ctx.fillRect(420, 560, 3, 60);
  ctx.fillRect(424, 560, 3, 60);
  // Stool legs splay
  ctx.strokeStyle = '#4A3020';
  ctx.lineWidth = 3;
  ctx.beginPath();
  ctx.moveTo(418, 618);
  ctx.lineTo(408, 630);
  ctx.moveTo(422, 618);
  ctx.lineTo(422, 630);
  ctx.moveTo(426, 618);
  ctx.lineTo(436, 630);
  ctx.stroke();

  // ── Turpentine bottle ──
  ctx.fillStyle = 'rgba(150,180,140,0.3)';
  ctx.fillRect(710, tableY + 5, 15, 35);
  ctx.fillStyle = '#555';
  ctx.fillRect(710, tableY, 15, 8);
  // Label
  ctx.fillStyle = '#E8E0D0';
  ctx.fillRect(712, tableY + 15, 11, 10);
  ctx.font = '4px sans-serif';
  ctx.fillStyle = '#333';
  ctx.textAlign = 'center';
  ctx.fillText('TRMT', 717, tableY + 22);

  // ── Rag on table ──
  ctx.fillStyle = '#8A7A6A';
  ctx.beginPath();
  ctx.moveTo(510, tableY + 50);
  ctx.quadraticCurveTo(520, tableY + 45, 540, tableY + 52);
  ctx.quadraticCurveTo(535, tableY + 60, 515, tableY + 65);
  ctx.quadraticCurveTo(505, tableY + 58, 510, tableY + 50);
  ctx.fill();
  // Paint stains on rag
  ctx.fillStyle = 'rgba(230,57,70,0.3)';
  ctx.beginPath();
  ctx.arc(520, tableY + 55, 4, 0, Math.PI * 2);
  ctx.fill();
  ctx.fillStyle = 'rgba(58,106,234,0.3)';
  ctx.beginPath();
  ctx.arc(528, tableY + 52, 3, 0, Math.PI * 2);
  ctx.fill();
}

export function createScene5(): SceneData {
  return {
    id: 5,
    title: "L'Atelier",
    subtitle: 'Capitolo V',
    mystery: 'Il quadro è un falso?',
    solution: 'Il volto nascosto, la firma, la chiave, le lettere, il colore diverso e la data provano che il quadro è un falso creato per nascondere l\'originale.',
    clues: makeClues(),
    draw,
  };
}
