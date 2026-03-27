// ─── Level 1: La Scrivania (The Desk) — Tutorial ────────────────────

import { type SceneData, type Clue } from '../types';
import { drawWoodGrain, drawWall, drawWindow, drawFrame, drawFloor } from '../renderer';

function makeClues(): Clue[] {
  return [
    { id: 'fingerprint', x: 480, y: 430, radius: 25, name: 'Impronta insanguinata', description: 'Un\'impronta digitale rossa sull\'angolo del foglio', found: false },
    { id: 'photo', x: 370, y: 460, radius: 25, name: 'Fotografia strappata', description: 'Metà di una foto nascosta sotto le carte', found: false },
    { id: 'phone-number', x: 760, y: 440, radius: 25, name: 'Numero cerchiato', description: 'Un numero di telefono cerchiato in rosso sul giornale', found: false },
    { id: 'key', x: 620, y: 475, radius: 22, name: 'Chiave nascosta', description: 'Una piccola chiave dietro la tazza di caffè', found: false },
  ];
}

function draw(ctx: CanvasRenderingContext2D, time: number): void {
  // ── Background wall ──
  drawWall(ctx, 0, 0, 1200, 500, '#2C2520', '#1E1A15');

  // Wallpaper pattern - subtle damask
  ctx.fillStyle = 'rgba(60,50,40,0.15)';
  for (let py = 20; py < 500; py += 60) {
    for (let px = 20; px < 1200; px += 80) {
      ctx.beginPath();
      ctx.ellipse(px, py, 8, 15, 0, 0, Math.PI * 2);
      ctx.fill();
      ctx.beginPath();
      ctx.ellipse(px + 40, py + 30, 8, 15, 0, 0, Math.PI * 2);
      ctx.fill();
    }
  }

  // ── Window (upper right) ──
  drawWindow(ctx, 850, 60, 180, 220, time, true);

  // ── Framed picture on wall ──
  drawFrame(ctx, 200, 100, 120, 90);
  // Painting inside - abstract cityscape
  ctx.fillStyle = '#1A2A3A';
  ctx.fillRect(200, 100, 120, 90);
  ctx.fillStyle = '#2A3A4A';
  ctx.fillRect(210, 140, 20, 50);
  ctx.fillRect(240, 120, 15, 70);
  ctx.fillRect(270, 130, 25, 60);
  ctx.fillRect(300, 150, 12, 40);

  // ── Clock on wall ──
  ctx.beginPath();
  ctx.arc(550, 120, 35, 0, Math.PI * 2);
  ctx.fillStyle = '#F5F0E0';
  ctx.fill();
  ctx.strokeStyle = '#3E2F1C';
  ctx.lineWidth = 4;
  ctx.stroke();
  // Clock hands
  const hr = (time * 0.0001) % (Math.PI * 2);
  ctx.strokeStyle = '#222';
  ctx.lineWidth = 2;
  ctx.beginPath();
  ctx.moveTo(550, 120);
  ctx.lineTo(550 + Math.cos(hr) * 18, 120 + Math.sin(hr) * 18);
  ctx.stroke();
  ctx.lineWidth = 1.5;
  ctx.beginPath();
  ctx.moveTo(550, 120);
  ctx.lineTo(550 + Math.cos(hr * 12) * 25, 120 + Math.sin(hr * 12) * 25);
  ctx.stroke();
  // Clock numbers
  ctx.font = '8px Georgia';
  ctx.fillStyle = '#333';
  ctx.textAlign = 'center';
  for (let i = 1; i <= 12; i++) {
    const a = (i / 12) * Math.PI * 2 - Math.PI / 2;
    ctx.fillText(String(i), 550 + Math.cos(a) * 27, 123 + Math.sin(a) * 27);
  }

  // ── Floor ──
  drawFloor(ctx, 500, 300, '#3A2E22', '#2A2018');
  // Floor boards
  ctx.strokeStyle = 'rgba(20,15,10,0.3)';
  ctx.lineWidth = 1;
  for (let fx = 0; fx < 1200; fx += 60) {
    ctx.beginPath();
    ctx.moveTo(fx, 500);
    ctx.lineTo(fx, 800);
    ctx.stroke();
  }

  // ── Desk ──
  const deskX = 180, deskY = 380, deskW = 840, deskH = 220;
  // Desk shadow
  ctx.fillStyle = 'rgba(0,0,0,0.3)';
  ctx.fillRect(deskX + 10, deskY + 10, deskW, deskH);
  // Desk surface
  ctx.fillStyle = '#5D4037';
  ctx.fillRect(deskX, deskY, deskW, deskH);
  drawWoodGrain(ctx, deskX, deskY, deskW, deskH);
  // Desk edge highlight
  ctx.fillStyle = '#7B5B42';
  ctx.fillRect(deskX, deskY, deskW, 4);
  // Desk legs
  ctx.fillStyle = '#4A3028';
  ctx.fillRect(deskX + 20, deskY + deskH, 20, 100);
  ctx.fillRect(deskX + deskW - 40, deskY + deskH, 20, 100);
  // Drawer on right
  ctx.fillStyle = '#4E352A';
  ctx.fillRect(deskX + deskW - 180, deskY + 60, 160, 80);
  ctx.strokeStyle = '#3A2A1E';
  ctx.lineWidth = 1;
  ctx.strokeRect(deskX + deskW - 180, deskY + 60, 160, 80);
  // Drawer knob
  ctx.beginPath();
  ctx.arc(deskX + deskW - 100, deskY + 100, 5, 0, Math.PI * 2);
  ctx.fillStyle = '#B8860B';
  ctx.fill();

  // ── Desk Lamp (left side) ──
  const lampX = 250, lampBaseY = deskY;
  // Lamp base
  ctx.fillStyle = '#2A2A2A';
  ctx.beginPath();
  ctx.ellipse(lampX, lampBaseY, 30, 8, 0, 0, Math.PI * 2);
  ctx.fill();
  // Lamp arm
  ctx.strokeStyle = '#3A3A3A';
  ctx.lineWidth = 4;
  ctx.beginPath();
  ctx.moveTo(lampX, lampBaseY);
  ctx.lineTo(lampX - 10, lampBaseY - 80);
  ctx.lineTo(lampX + 30, lampBaseY - 100);
  ctx.stroke();
  // Lamp shade
  ctx.fillStyle = '#2F4F2F';
  ctx.beginPath();
  ctx.moveTo(lampX + 5, lampBaseY - 100);
  ctx.lineTo(lampX + 55, lampBaseY - 80);
  ctx.lineTo(lampX + 50, lampBaseY - 75);
  ctx.lineTo(lampX + 10, lampBaseY - 95);
  ctx.closePath();
  ctx.fill();
  // Lamp glow
  const lampGlow = ctx.createRadialGradient(lampX + 35, lampBaseY - 60, 0, lampX + 35, lampBaseY - 40, 80);
  lampGlow.addColorStop(0, 'rgba(255,230,160,0.08)');
  lampGlow.addColorStop(1, 'rgba(255,230,160,0)');
  ctx.fillStyle = lampGlow;
  ctx.fillRect(lampX - 50, lampBaseY - 130, 170, 130);

  // ── Paper stack (center-left) ──
  ctx.save();
  ctx.shadowColor = 'rgba(0,0,0,0.2)';
  ctx.shadowBlur = 4;
  ctx.shadowOffsetX = 2;
  ctx.shadowOffsetY = 2;
  // Bottom papers
  ctx.fillStyle = '#EFEFD5';
  ctx.fillRect(340, deskY + 20, 130, 90);
  ctx.fillStyle = '#F5F5DC';
  ctx.save();
  ctx.translate(345, deskY + 25);
  ctx.rotate(-0.03);
  ctx.fillRect(0, 0, 130, 90);
  ctx.restore();
  // Top paper (with fingerprint clue)
  ctx.fillStyle = '#FAFAF0';
  ctx.save();
  ctx.translate(350, deskY + 15);
  ctx.rotate(0.02);
  ctx.fillRect(0, 0, 130, 90);
  // Text lines on paper
  ctx.fillStyle = 'rgba(30,30,60,0.3)';
  for (let tl = 15; tl < 80; tl += 10) {
    ctx.fillRect(10, tl, 80 + Math.random() * 30, 2);
  }
  ctx.restore();
  ctx.restore();

  // ── Clue 1: Bloody fingerprint ──
  ctx.save();
  ctx.globalAlpha = 0.6;
  ctx.fillStyle = '#8B0000';
  ctx.beginPath();
  ctx.ellipse(480, 430, 10, 12, -0.2, 0, Math.PI * 2);
  ctx.fill();
  // fingerprint ridges
  ctx.strokeStyle = '#A00000';
  ctx.lineWidth = 0.5;
  for (let r = 3; r < 11; r += 2) {
    ctx.beginPath();
    ctx.arc(480, 430, r, 0.5, 2.5);
    ctx.stroke();
  }
  ctx.globalAlpha = 1;
  ctx.restore();

  // ── Clue 2: Torn photograph under papers ──
  ctx.save();
  ctx.fillStyle = '#DDD8C8';
  ctx.fillRect(355, deskY + 50, 40, 35);
  // Photo image hint - a face
  ctx.fillStyle = '#CABFA5';
  ctx.fillRect(358, deskY + 53, 34, 29);
  ctx.fillStyle = '#8A7560';
  ctx.beginPath();
  ctx.arc(375, deskY + 63, 8, 0, Math.PI * 2);
  ctx.fill();
  // Torn edge
  ctx.strokeStyle = '#FFF';
  ctx.lineWidth = 1;
  ctx.beginPath();
  ctx.moveTo(395, deskY + 50);
  for (let te = 0; te < 35; te += 3) {
    ctx.lineTo(393 + Math.random() * 4, deskY + 50 + te);
  }
  ctx.stroke();
  ctx.restore();

  // ── Coffee cup ──
  const cupX = 600, cupY = deskY + 10;
  ctx.fillStyle = '#F8F0E0';
  ctx.beginPath();
  ctx.ellipse(cupX, cupY + 35, 22, 8, 0, 0, Math.PI * 2);
  ctx.fill();
  ctx.fillStyle = '#EEEAE0';
  ctx.fillRect(cupX - 20, cupY, 40, 35);
  ctx.beginPath();
  ctx.ellipse(cupX, cupY, 20, 7, 0, 0, Math.PI * 2);
  ctx.fillStyle = '#3E2F1C';
  ctx.fill();
  // Handle
  ctx.strokeStyle = '#E8E0D0';
  ctx.lineWidth = 3;
  ctx.beginPath();
  ctx.arc(cupX + 22, cupY + 18, 10, -0.8, 0.8);
  ctx.stroke();
  // Steam
  ctx.strokeStyle = 'rgba(200,200,220,0.15)';
  ctx.lineWidth = 1;
  for (let s = 0; s < 3; s++) {
    ctx.beginPath();
    const sx = cupX - 8 + s * 8;
    ctx.moveTo(sx, cupY - 5);
    ctx.quadraticCurveTo(sx + 5 * Math.sin(time * 0.002 + s), cupY - 20, sx - 3, cupY - 35);
    ctx.stroke();
  }

  // ── Clue 4: Key behind coffee cup ──
  ctx.save();
  ctx.fillStyle = '#B8860B';
  // Key shaft
  ctx.fillRect(612, cupY + 30, 18, 3);
  // Key head (ring)
  ctx.beginPath();
  ctx.arc(615, cupY + 32, 5, 0, Math.PI * 2);
  ctx.strokeStyle = '#B8860B';
  ctx.lineWidth = 2;
  ctx.stroke();
  // Key teeth
  ctx.fillRect(628, cupY + 28, 2, 7);
  ctx.fillRect(625, cupY + 28, 2, 5);
  ctx.restore();

  // ── Newspaper (right side) ──
  ctx.save();
  ctx.translate(720, deskY + 15);
  ctx.rotate(0.05);
  ctx.fillStyle = '#E8E0C8';
  ctx.fillRect(0, 0, 160, 120);
  // Newspaper header
  ctx.fillStyle = '#222';
  ctx.font = 'bold 10px Georgia';
  ctx.textAlign = 'left';
  ctx.fillText('IL CORRIERE', 10, 15);
  ctx.fillStyle = '#444';
  ctx.fillRect(10, 20, 140, 1);
  // Headline
  ctx.font = 'bold 8px Georgia';
  ctx.fillStyle = '#222';
  ctx.fillText('MISTERIOSA SCOMPARSA', 10, 32);
  ctx.fillText('IN VIA ROMA', 10, 42);
  // Article text lines
  ctx.fillStyle = 'rgba(30,30,30,0.4)';
  for (let nl = 50; nl < 110; nl += 6) {
    ctx.fillRect(10, nl, 60 + Math.random() * 70, 2);
  }
  // Column divider
  ctx.fillRect(80, 48, 1, 70);

  // ── Clue 3: Circled phone number ──
  ctx.strokeStyle = '#E63946';
  ctx.lineWidth = 1.5;
  ctx.beginPath();
  ctx.ellipse(45, 78, 28, 10, 0.1, 0, Math.PI * 2);
  ctx.stroke();
  ctx.font = '7px monospace';
  ctx.fillStyle = '#222';
  ctx.fillText('06-4523-891', 20, 80);

  ctx.restore();

  // ── Phone ──
  ctx.fillStyle = '#1A1A1A';
  ctx.fillRect(520, deskY + 8, 50, 25);
  ctx.fillStyle = '#2A2A2A';
  ctx.fillRect(525, deskY + 12, 40, 17);
  // Handset cord
  ctx.strokeStyle = '#333';
  ctx.lineWidth = 2;
  ctx.beginPath();
  ctx.moveTo(525, deskY + 20);
  for (let cx = 0; cx < 30; cx += 6) {
    ctx.lineTo(520 - cx, deskY + 18 + Math.sin(cx * 0.5) * 3);
  }
  ctx.stroke();

  // ── Notepad ──
  ctx.fillStyle = '#FFFFF0';
  ctx.fillRect(430, deskY + 60, 80, 100);
  ctx.strokeStyle = '#CCC';
  ctx.lineWidth = 0.5;
  for (let nl = 0; nl < 100; nl += 8) {
    ctx.beginPath();
    ctx.moveTo(430, deskY + 68 + nl);
    ctx.lineTo(510, deskY + 68 + nl);
    ctx.stroke();
  }
  // Red margin line
  ctx.strokeStyle = 'rgba(200,100,100,0.3)';
  ctx.lineWidth = 0.5;
  ctx.beginPath();
  ctx.moveTo(450, deskY + 60);
  ctx.lineTo(450, deskY + 160);
  ctx.stroke();
  // Some handwritten text
  ctx.strokeStyle = 'rgba(30,30,80,0.4)';
  ctx.lineWidth = 1;
  ctx.beginPath();
  ctx.moveTo(455, deskY + 76);
  ctx.quadraticCurveTo(470, deskY + 73, 490, deskY + 77);
  ctx.stroke();
  ctx.beginPath();
  ctx.moveTo(455, deskY + 84);
  ctx.quadraticCurveTo(475, deskY + 81, 500, deskY + 85);
  ctx.stroke();

  // ── Pen ──
  ctx.save();
  ctx.translate(515, deskY + 90);
  ctx.rotate(0.3);
  ctx.fillStyle = '#1A1A6A';
  ctx.fillRect(0, 0, 60, 4);
  ctx.fillStyle = '#FFD700';
  ctx.fillRect(0, 0, 8, 4);
  ctx.fillStyle = '#AAA';
  ctx.fillRect(58, 1, 6, 2);
  ctx.restore();

  // ── Ashtray ──
  ctx.fillStyle = '#555';
  ctx.beginPath();
  ctx.ellipse(900, deskY + 50, 25, 8, 0, 0, Math.PI * 2);
  ctx.fill();
  ctx.fillStyle = '#444';
  ctx.beginPath();
  ctx.ellipse(900, deskY + 45, 22, 7, 0, 0, Math.PI, true);
  ctx.fill();
  // Cigarette butt
  ctx.fillStyle = '#E8E0D0';
  ctx.save();
  ctx.translate(895, deskY + 42);
  ctx.rotate(-0.5);
  ctx.fillRect(0, 0, 25, 3);
  ctx.fillStyle = '#AA6633';
  ctx.fillRect(0, 0, 8, 3);
  ctx.restore();

  // ── Bookshelf on wall (left side) ──
  ctx.fillStyle = '#3E2F1C';
  ctx.fillRect(30, 150, 130, 200);
  drawWoodGrain(ctx, 30, 150, 130, 200, 'rgba(20,10,5,0.2)');
  // Shelves
  ctx.fillStyle = '#4A3828';
  for (let sy = 0; sy < 4; sy++) {
    ctx.fillRect(30, 150 + sy * 50, 130, 5);
  }
  // Books
  const bookColors = ['#8B0000', '#2F4F4F', '#4A3A8A', '#8B6914', '#2A4A2A', '#5A2A2A'];
  let bx = 35;
  for (let sh = 0; sh < 3; sh++) {
    bx = 35;
    for (let b = 0; b < 6; b++) {
      const bw = 8 + Math.random() * 10;
      const bh = 35 + Math.random() * 10;
      ctx.fillStyle = bookColors[(sh * 6 + b) % bookColors.length];
      ctx.fillRect(bx, 155 + sh * 50 + (45 - bh), bw, bh);
      bx += bw + 1;
    }
  }

  // ── Filing cabinet (far right) ──
  ctx.fillStyle = '#4A4A4A';
  ctx.fillRect(1080, 300, 80, 200);
  ctx.strokeStyle = '#333';
  ctx.lineWidth = 1;
  for (let d = 0; d < 3; d++) {
    ctx.strokeRect(1085, 305 + d * 65, 70, 60);
    // Handle
    ctx.fillStyle = '#888';
    ctx.fillRect(1110, 330 + d * 65, 20, 5);
  }

  // ── Chair hint (bottom) ──
  ctx.fillStyle = '#2A2A2A';
  ctx.beginPath();
  ctx.arc(600, 700, 80, Math.PI, 0, true);
  ctx.fill();
  ctx.fillStyle = '#222';
  ctx.fillRect(520, 680, 160, 30);
}

export function createScene1(): SceneData {
  return {
    id: 1,
    title: 'La Scrivania',
    subtitle: 'Capitolo I',
    mystery: 'Chi ha visitato l\'ufficio stanotte?',
    solution: 'L\'impronta, la foto, il numero e la chiave indicano che il visitatore era il partner della vittima.',
    clues: makeClues(),
    draw,
  };
}
