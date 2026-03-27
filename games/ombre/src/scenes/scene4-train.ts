// ─── Level 4: Il Treno (The Train) ──────────────────────────────────

import { type SceneData, type Clue } from '../types';
import { drawWoodGrain, drawWindow, roundRect } from '../renderer';

function makeClues(): Clue[] {
  return [
    { id: 'lipstick', x: 850, y: 230, radius: 22, name: 'Traccia di rossetto', description: 'Un segno di rossetto sul vetro del finestrino', found: false },
    { id: 'ticket', x: 400, y: 510, radius: 22, name: 'Biglietto', description: 'Un tagliando caduto tra i cuscini del sedile', found: false },
    { id: 'handkerchief', x: 700, y: 160, radius: 22, name: 'Fazzoletto monogrammato', description: 'Un fazzoletto con le iniziali sulla cappelliera', found: false },
    { id: 'vial', x: 1050, y: 380, radius: 22, name: 'Fiala misteriosa', description: 'Una piccola fiala di liquido nella tasca del cappotto', found: false },
    { id: 'coded-message', x: 550, y: 250, radius: 22, name: 'Messaggio in codice', description: 'Un messaggio cifrato inciso nella cornice dello specchio', found: false },
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

  // Ornate wallpaper pattern
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
  // Decorative molding pattern
  ctx.fillStyle = '#6A5A48';
  for (let mx = 0; mx < 1200; mx += 30) {
    ctx.beginPath();
    ctx.arc(mx, 20, 4, 0, Math.PI * 2);
    ctx.fill();
  }

  // ── Floor ──
  ctx.fillStyle = '#1E1612';
  ctx.fillRect(0, 620, 1200, 180);
  // Carpet
  ctx.fillStyle = '#4A1A20';
  ctx.fillRect(50, 630, 1100, 150);
  ctx.strokeStyle = '#6A2A30';
  ctx.lineWidth = 2;
  ctx.strokeRect(60, 640, 1080, 130);
  // Carpet pattern
  ctx.fillStyle = '#5A2228';
  for (let cx = 80; cx < 1130; cx += 40) {
    ctx.beginPath();
    ctx.arc(cx, 700, 8, 0, Math.PI * 2);
    ctx.fill();
  }

  // ── Left Window ──
  const winX = 50, winY = 100, winW = 250, winH = 300;
  // Window frame
  ctx.fillStyle = '#5A4A38';
  ctx.fillRect(winX - 8, winY - 8, winW + 16, winH + 16);
  drawWindow(ctx, winX, winY, winW, winH, time, true);
  // Curtains
  ctx.fillStyle = '#6A2030';
  // Left curtain
  ctx.beginPath();
  ctx.moveTo(winX - 5, winY - 5);
  ctx.quadraticCurveTo(winX + 30, winY + 100, winX + 20, winY + winH + 5);
  ctx.lineTo(winX - 5, winY + winH + 5);
  ctx.closePath();
  ctx.fill();
  // Right curtain
  ctx.beginPath();
  ctx.moveTo(winX + winW + 5, winY - 5);
  ctx.quadraticCurveTo(winX + winW - 30, winY + 100, winX + winW - 20, winY + winH + 5);
  ctx.lineTo(winX + winW + 5, winY + winH + 5);
  ctx.closePath();
  ctx.fill();
  // Curtain rod
  ctx.fillStyle = '#B8860B';
  ctx.fillRect(winX - 20, winY - 15, winW + 40, 5);
  ctx.beginPath();
  ctx.arc(winX - 20, winY - 12, 6, 0, Math.PI * 2);
  ctx.fill();
  ctx.beginPath();
  ctx.arc(winX + winW + 20, winY - 12, 6, 0, Math.PI * 2);
  ctx.fill();

  // ── Right Window (larger) ──
  const rWinX = 750, rWinY = 100, rWinW = 300, rWinH = 300;
  ctx.fillStyle = '#5A4A38';
  ctx.fillRect(rWinX - 8, rWinY - 8, rWinW + 16, rWinH + 16);
  drawWindow(ctx, rWinX, rWinY, rWinW, rWinH, time, true);
  // Curtains
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

  // Clue 1: Lipstick mark on right window glass
  ctx.save();
  ctx.fillStyle = '#C44060';
  ctx.globalAlpha = 0.5;
  ctx.beginPath();
  ctx.ellipse(850, 230, 8, 5, 0.2, 0, Math.PI * 2);
  ctx.fill();
  ctx.beginPath();
  ctx.ellipse(850, 238, 7, 4, -0.1, 0, Math.PI * 2);
  ctx.fill();
  ctx.globalAlpha = 1;
  ctx.restore();

  // ── Left Seat (velvet) ──
  const seatY = 450;
  // Seat back
  ctx.fillStyle = '#3A1520';
  roundRect(ctx, 60, seatY - 100, 280, 120, 10);
  ctx.fill();
  // Velvet texture on back
  ctx.fillStyle = 'rgba(80,30,40,0.3)';
  for (let vy = seatY - 90; vy < seatY + 10; vy += 8) {
    ctx.beginPath();
    ctx.moveTo(70, vy);
    ctx.lineTo(330, vy);
    ctx.strokeStyle = 'rgba(60,20,30,0.2)';
    ctx.lineWidth = 1;
    ctx.stroke();
  }
  // Button tufts
  ctx.fillStyle = '#5A2530';
  for (let bx = 100; bx < 320; bx += 50) {
    for (let by = seatY - 80; by < seatY; by += 40) {
      ctx.beginPath();
      ctx.arc(bx, by, 4, 0, Math.PI * 2);
      ctx.fill();
    }
  }
  // Seat cushion
  ctx.fillStyle = '#4A1A28';
  roundRect(ctx, 55, seatY + 20, 290, 60, 8);
  ctx.fill();
  ctx.fillStyle = '#5A2230';
  roundRect(ctx, 60, seatY + 15, 280, 55, 8);
  ctx.fill();

  // Clue 2: Ticket stub between cushions
  ctx.save();
  ctx.translate(400, 510);
  ctx.rotate(-0.1);
  ctx.fillStyle = '#E8D5A0';
  ctx.fillRect(-20, -6, 40, 14);
  ctx.fillStyle = '#8B0000';
  ctx.fillRect(-20, -6, 40, 3);
  ctx.font = '5px monospace';
  ctx.fillStyle = '#333';
  ctx.textAlign = 'center';
  ctx.fillText('VAGONE 7', 0, 4);
  // Perforated edge
  ctx.strokeStyle = '#AAA';
  ctx.setLineDash([2, 2]);
  ctx.beginPath();
  ctx.moveTo(-20, 0);
  ctx.lineTo(20, 0);
  ctx.stroke();
  ctx.setLineDash([]);
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

  // ── Small Table (between seats) ──
  ctx.fillStyle = '#5A4030';
  ctx.fillRect(380, seatY + 10, 120, 8);
  drawWoodGrain(ctx, 380, seatY + 10, 120, 8);
  // Table leg
  ctx.fillStyle = '#4A3020';
  ctx.fillRect(435, seatY + 18, 10, 100);
  // Table base
  ctx.fillStyle = '#3A2818';
  ctx.beginPath();
  ctx.ellipse(440, seatY + 118, 30, 8, 0, 0, Math.PI * 2);
  ctx.fill();

  // ── Mirror (between windows, on wall) ──
  const mirX = 450, mirY = 140;
  ctx.fillStyle = '#B8860B';
  ctx.fillRect(mirX - 4, mirY - 4, 128, 158);
  ctx.fillStyle = '#8B6914';
  ctx.fillRect(mirX, mirY, 120, 150);
  // Mirror reflection - dark/moody
  const mirGrad = ctx.createLinearGradient(mirX, mirY, mirX + 120, mirY + 150);
  mirGrad.addColorStop(0, '#2A2A3A');
  mirGrad.addColorStop(0.5, '#3A3A4A');
  mirGrad.addColorStop(1, '#2A2A35');
  ctx.fillStyle = mirGrad;
  ctx.fillRect(mirX + 3, mirY + 3, 114, 144);
  // Reflection highlight
  ctx.fillStyle = 'rgba(100,100,130,0.1)';
  ctx.beginPath();
  ctx.moveTo(mirX + 10, mirY + 10);
  ctx.lineTo(mirX + 40, mirY + 10);
  ctx.lineTo(mirX + 10, mirY + 60);
  ctx.closePath();
  ctx.fill();

  // Clue 5: Coded message scratched into mirror frame
  ctx.save();
  ctx.font = '6px monospace';
  ctx.fillStyle = 'rgba(150,130,80,0.4)';
  ctx.fillText('V-I-I  X-I-V', mirX + 5, mirY + 155);
  ctx.fillText('III-XX', mirX + 90, mirY - 1);
  ctx.restore();

  // ── Luggage Rack (top, above right seat) ──
  ctx.strokeStyle = '#B8860B';
  ctx.lineWidth = 3;
  ctx.beginPath();
  ctx.moveTo(750, 50);
  ctx.lineTo(1130, 50);
  ctx.stroke();
  // Rack supports
  for (const rx of [780, 950, 1100]) {
    ctx.beginPath();
    ctx.moveTo(rx, 50);
    ctx.lineTo(rx, 30);
    ctx.stroke();
  }
  // Mesh/bars
  ctx.lineWidth = 1;
  for (let rb = 760; rb < 1120; rb += 15) {
    ctx.beginPath();
    ctx.moveTo(rb, 50);
    ctx.lineTo(rb, 80);
    ctx.stroke();
  }
  ctx.beginPath();
  ctx.moveTo(750, 65);
  ctx.lineTo(1130, 65);
  ctx.moveTo(750, 80);
  ctx.lineTo(1130, 80);
  ctx.stroke();

  // Suitcase on rack
  ctx.fillStyle = '#5A3A20';
  roundRect(ctx, 820, 55, 100, 25, 3);
  ctx.fill();
  ctx.strokeStyle = '#8B6914';
  ctx.lineWidth = 1;
  ctx.strokeRect(830, 58, 80, 19);
  // Suitcase clasp
  ctx.fillStyle = '#B8860B';
  ctx.fillRect(865, 58, 10, 4);

  // Clue 3: Monogrammed handkerchief on luggage rack
  ctx.save();
  ctx.translate(700, 160);
  ctx.rotate(0.15);
  ctx.fillStyle = '#F5F0E8';
  ctx.fillRect(0, 0, 28, 28);
  // Lace border
  ctx.strokeStyle = '#DDD';
  ctx.lineWidth = 0.5;
  ctx.setLineDash([2, 2]);
  ctx.strokeRect(2, 2, 24, 24);
  ctx.setLineDash([]);
  // Monogram
  ctx.font = 'italic 10px Georgia';
  ctx.fillStyle = '#4A1A4A';
  ctx.textAlign = 'center';
  ctx.fillText('L.M.', 14, 18);
  ctx.restore();

  // ── Coat Hook (right wall) ──
  ctx.fillStyle = '#B8860B';
  ctx.beginPath();
  ctx.arc(1100, 280, 6, 0, Math.PI * 2);
  ctx.fill();
  ctx.fillRect(1095, 280, 10, 5);
  // Coat hanging
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
  // Coat collar
  ctx.fillStyle = '#2A2A3A';
  ctx.beginPath();
  ctx.moveTo(1080, 285);
  ctx.lineTo(1100, 310);
  ctx.lineTo(1120, 285);
  ctx.closePath();
  ctx.fill();
  // Coat pocket
  ctx.strokeStyle = '#151520';
  ctx.lineWidth = 1;
  ctx.beginPath();
  ctx.moveTo(1080, 380);
  ctx.lineTo(1080, 420);
  ctx.lineTo(1100, 420);
  ctx.stroke();

  // Clue 4: Vial in coat pocket
  ctx.save();
  ctx.translate(1050, 380);
  ctx.fillStyle = 'rgba(100,200,150,0.4)';
  ctx.fillRect(0, 0, 6, 18);
  ctx.fillStyle = '#555';
  ctx.fillRect(-1, -2, 8, 4);
  ctx.restore();

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
  // Lamp glow
  const lampGlow = ctx.createRadialGradient(600, 50, 0, 600, 80, 100);
  lampGlow.addColorStop(0, 'rgba(255,230,160,0.05)');
  lampGlow.addColorStop(1, 'rgba(255,230,160,0)');
  ctx.fillStyle = lampGlow;
  ctx.fillRect(500, 40, 200, 120);

  // ── Passing scenery effect through windows ──
  const scrollX = (time * 0.1) % 400;
  ctx.save();
  ctx.globalAlpha = 0.05;
  ctx.fillStyle = '#1A3A1A';
  // Trees passing by left window
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
    id: 4,
    title: 'Il Treno',
    subtitle: 'Capitolo IV',
    mystery: 'Cosa è successo nel vagone 7?',
    solution: 'Il rossetto, il biglietto, il fazzoletto, la fiala e il messaggio cifrato svelano un avvelenamento pianificato nel vagone.',
    clues: makeClues(),
    draw,
  };
}
