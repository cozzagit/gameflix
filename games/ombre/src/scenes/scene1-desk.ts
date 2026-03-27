// ─── Level 1: La Scrivania del Detective — Tutorial ──────────────────

import { type SceneData, type Clue } from '../types';
import { drawWoodGrain, drawWall, drawWindow, drawFrame, drawFloor } from '../renderer';

function makeClues(): Clue[] {
  return [
    {
      id: 'impronta',
      x: 300, y: 450, radius: 25,
      name: 'Impronta',
      description: "Un'impronta di scarpa bagnata vicino alla porta. Misura 42, suola da scarpa elegante.",
      found: false,
    },
    {
      id: 'biglietto',
      x: 600, y: 380, radius: 25,
      name: 'Biglietto',
      description: "Un biglietto scritto a mano: 'Dobbiamo parlare. \u00C8 urgente. \u2014M.' L'inchiostro \u00E8 fresco.",
      found: false,
    },
    {
      id: 'tazza',
      x: 800, y: 420, radius: 25,
      name: 'Tazza',
      description: 'Una seconda tazza di caff\u00E8 sulla scrivania. Tu ne avevi lasciata solo una.',
      found: false,
    },
    {
      id: 'orologio',
      x: 500, y: 300, radius: 28,
      name: 'Orologio',
      description: "L'orologio a muro \u00E8 fermo alle 23:47. Qualcuno l'ha urtato.",
      found: false,
    },
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

  // ── Door frame (left) for the footprint clue ──
  ctx.fillStyle = '#3E2F1C';
  ctx.fillRect(20, 80, 120, 420);
  ctx.fillStyle = '#2A1E14';
  ctx.fillRect(30, 90, 100, 400);
  // Door handle
  ctx.fillStyle = '#B8860B';
  ctx.beginPath();
  ctx.arc(115, 290, 6, 0, Math.PI * 2);
  ctx.fill();

  // ── Window (upper right) ──
  drawWindow(ctx, 850, 60, 180, 220, time, true);

  // ── Framed picture on wall ──
  drawFrame(ctx, 200, 100, 120, 90);
  ctx.fillStyle = '#1A2A3A';
  ctx.fillRect(200, 100, 120, 90);
  ctx.fillStyle = '#2A3A4A';
  ctx.fillRect(210, 140, 20, 50);
  ctx.fillRect(240, 120, 15, 70);
  ctx.fillRect(270, 130, 25, 60);
  ctx.fillRect(300, 150, 12, 40);

  // ── Clock on wall (Clue: orologio - stopped at 23:47) ──
  ctx.beginPath();
  ctx.arc(500, 300, 35, 0, Math.PI * 2);
  ctx.fillStyle = '#F5F0E0';
  ctx.fill();
  ctx.strokeStyle = '#3E2F1C';
  ctx.lineWidth = 4;
  ctx.stroke();
  // Clock numbers
  ctx.font = '8px Georgia';
  ctx.fillStyle = '#333';
  ctx.textAlign = 'center';
  for (let i = 1; i <= 12; i++) {
    const a = (i / 12) * Math.PI * 2 - Math.PI / 2;
    ctx.fillText(String(i), 500 + Math.cos(a) * 27, 303 + Math.sin(a) * 27);
  }
  // Hands frozen at 23:47 (11:47)
  // Hour hand at ~11.78 position
  const hourAngle = ((11 + 47 / 60) / 12) * Math.PI * 2 - Math.PI / 2;
  ctx.strokeStyle = '#222';
  ctx.lineWidth = 2.5;
  ctx.beginPath();
  ctx.moveTo(500, 300);
  ctx.lineTo(500 + Math.cos(hourAngle) * 18, 300 + Math.sin(hourAngle) * 18);
  ctx.stroke();
  // Minute hand at 47 minutes
  const minAngle = (47 / 60) * Math.PI * 2 - Math.PI / 2;
  ctx.lineWidth = 1.5;
  ctx.beginPath();
  ctx.moveTo(500, 300);
  ctx.lineTo(500 + Math.cos(minAngle) * 25, 300 + Math.sin(minAngle) * 25);
  ctx.stroke();
  // Clock is slightly tilted to show it was bumped
  ctx.save();
  ctx.strokeStyle = 'rgba(100,50,50,0.3)';
  ctx.lineWidth = 1;
  ctx.beginPath();
  ctx.arc(500, 300, 37, -0.3, 0.1);
  ctx.stroke();
  ctx.restore();

  // ── Floor ──
  drawFloor(ctx, 500, 300, '#3A2E22', '#2A2018');
  ctx.strokeStyle = 'rgba(20,15,10,0.3)';
  ctx.lineWidth = 1;
  for (let fx = 0; fx < 1200; fx += 60) {
    ctx.beginPath();
    ctx.moveTo(fx, 500);
    ctx.lineTo(fx, 800);
    ctx.stroke();
  }

  // ── Clue 1: Wet footprint near door ──
  ctx.save();
  ctx.globalAlpha = 0.4;
  ctx.fillStyle = '#4A6070';
  // Shoe shape
  ctx.beginPath();
  ctx.ellipse(300, 450, 14, 22, -0.15, 0, Math.PI * 2);
  ctx.fill();
  ctx.beginPath();
  ctx.ellipse(300, 425, 10, 8, -0.15, 0, Math.PI * 2);
  ctx.fill();
  // Water marks around it
  ctx.fillStyle = 'rgba(74,96,112,0.2)';
  ctx.beginPath();
  ctx.ellipse(315, 460, 6, 3, 0, 0, Math.PI * 2);
  ctx.fill();
  ctx.beginPath();
  ctx.ellipse(285, 440, 4, 2, 0.5, 0, Math.PI * 2);
  ctx.fill();
  ctx.globalAlpha = 1;
  ctx.restore();

  // ── Desk ──
  const deskX = 380, deskY = 380, deskW = 640, deskH = 200;
  ctx.fillStyle = 'rgba(0,0,0,0.3)';
  ctx.fillRect(deskX + 10, deskY + 10, deskW, deskH);
  ctx.fillStyle = '#5D4037';
  ctx.fillRect(deskX, deskY, deskW, deskH);
  drawWoodGrain(ctx, deskX, deskY, deskW, deskH);
  ctx.fillStyle = '#7B5B42';
  ctx.fillRect(deskX, deskY, deskW, 4);
  ctx.fillStyle = '#4A3028';
  ctx.fillRect(deskX + 20, deskY + deskH, 20, 100);
  ctx.fillRect(deskX + deskW - 40, deskY + deskH, 20, 100);

  // ── Clue 2: Handwritten note on desk ──
  ctx.save();
  ctx.translate(585, 365);
  ctx.rotate(0.05);
  ctx.fillStyle = '#FAFAF0';
  ctx.fillRect(0, 0, 90, 60);
  ctx.shadowColor = 'rgba(0,0,0,0.2)';
  ctx.shadowBlur = 3;
  // Handwritten text on the note
  ctx.font = 'italic 9px Georgia';
  ctx.fillStyle = '#1A1A4A';
  ctx.textAlign = 'left';
  ctx.fillText('Dobbiamo parlare.', 8, 20);
  ctx.fillText('\u00C8 urgente.', 8, 35);
  ctx.fillText('\u2014M.', 55, 50);
  ctx.restore();

  // ── Coffee cup 1 (yours) ──
  const cup1X = 700, cup1Y = deskY + 10;
  ctx.fillStyle = '#F8F0E0';
  ctx.beginPath();
  ctx.ellipse(cup1X, cup1Y + 35, 22, 8, 0, 0, Math.PI * 2);
  ctx.fill();
  ctx.fillStyle = '#EEEAE0';
  ctx.fillRect(cup1X - 20, cup1Y, 40, 35);
  ctx.beginPath();
  ctx.ellipse(cup1X, cup1Y, 20, 7, 0, 0, Math.PI * 2);
  ctx.fillStyle = '#3E2F1C';
  ctx.fill();
  ctx.strokeStyle = '#E8E0D0';
  ctx.lineWidth = 3;
  ctx.beginPath();
  ctx.arc(cup1X + 22, cup1Y + 18, 10, -0.8, 0.8);
  ctx.stroke();

  // ── Clue 3: Second coffee cup (the visitor's) ──
  const cup2X = 800, cup2Y = deskY + 20;
  ctx.fillStyle = '#F8F0E0';
  ctx.beginPath();
  ctx.ellipse(cup2X, cup2Y + 35, 20, 7, 0, 0, Math.PI * 2);
  ctx.fill();
  ctx.fillStyle = '#EEEAE0';
  ctx.fillRect(cup2X - 18, cup2Y, 36, 32);
  ctx.beginPath();
  ctx.ellipse(cup2X, cup2Y, 18, 6, 0, 0, Math.PI * 2);
  ctx.fillStyle = '#3E2F1C';
  ctx.fill();
  ctx.strokeStyle = '#E8E0D0';
  ctx.lineWidth = 3;
  ctx.beginPath();
  ctx.arc(cup2X + 20, cup2Y + 16, 9, -0.8, 0.8);
  ctx.stroke();
  // Lipstick mark on the rim
  ctx.fillStyle = 'rgba(180,60,80,0.5)';
  ctx.beginPath();
  ctx.ellipse(cup2X - 12, cup2Y + 2, 4, 2, 0.3, 0, Math.PI * 2);
  ctx.fill();
  // Still warm — steam
  ctx.strokeStyle = 'rgba(200,200,220,0.12)';
  ctx.lineWidth = 1;
  for (let s = 0; s < 2; s++) {
    ctx.beginPath();
    const sx = cup2X - 5 + s * 10;
    ctx.moveTo(sx, cup2Y - 3);
    ctx.quadraticCurveTo(sx + 4 * Math.sin(time * 0.002 + s), cup2Y - 18, sx - 2, cup2Y - 30);
    ctx.stroke();
  }

  // ── Desk Lamp ──
  const lampX = 440, lampBaseY = deskY;
  ctx.fillStyle = '#2A2A2A';
  ctx.beginPath();
  ctx.ellipse(lampX, lampBaseY, 30, 8, 0, 0, Math.PI * 2);
  ctx.fill();
  ctx.strokeStyle = '#3A3A3A';
  ctx.lineWidth = 4;
  ctx.beginPath();
  ctx.moveTo(lampX, lampBaseY);
  ctx.lineTo(lampX - 10, lampBaseY - 80);
  ctx.lineTo(lampX + 30, lampBaseY - 100);
  ctx.stroke();
  ctx.fillStyle = '#2F4F2F';
  ctx.beginPath();
  ctx.moveTo(lampX + 5, lampBaseY - 100);
  ctx.lineTo(lampX + 55, lampBaseY - 80);
  ctx.lineTo(lampX + 50, lampBaseY - 75);
  ctx.lineTo(lampX + 10, lampBaseY - 95);
  ctx.closePath();
  ctx.fill();

  // ── Notepad ──
  ctx.fillStyle = '#FFFFF0';
  ctx.fillRect(530, deskY + 60, 80, 100);
  ctx.strokeStyle = '#CCC';
  ctx.lineWidth = 0.5;
  for (let nl = 0; nl < 100; nl += 8) {
    ctx.beginPath();
    ctx.moveTo(530, deskY + 68 + nl);
    ctx.lineTo(610, deskY + 68 + nl);
    ctx.stroke();
  }

  // ── Pen ──
  ctx.save();
  ctx.translate(620, deskY + 90);
  ctx.rotate(0.3);
  ctx.fillStyle = '#1A1A6A';
  ctx.fillRect(0, 0, 60, 4);
  ctx.fillStyle = '#FFD700';
  ctx.fillRect(0, 0, 8, 4);
  ctx.restore();

  // ── Bookshelf on wall (left side) ──
  ctx.fillStyle = '#3E2F1C';
  ctx.fillRect(160, 150, 130, 200);
  drawWoodGrain(ctx, 160, 150, 130, 200, 'rgba(20,10,5,0.2)');
  ctx.fillStyle = '#4A3828';
  for (let sy = 0; sy < 4; sy++) {
    ctx.fillRect(160, 150 + sy * 50, 130, 5);
  }
  const bookColors = ['#8B0000', '#2F4F4F', '#4A3A8A', '#8B6914', '#2A4A2A', '#5A2A2A'];
  let bx = 165;
  for (let sh = 0; sh < 3; sh++) {
    bx = 165;
    for (let b = 0; b < 5; b++) {
      const bw = 10 + (b * 3 + sh * 7) % 8;
      const bh = 35 + (b * 5 + sh * 3) % 10;
      ctx.fillStyle = bookColors[(sh * 5 + b) % bookColors.length];
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
    title: 'La Scrivania del Detective',
    subtitle: 'Capitolo I \u2014 Tutorial',
    storyIntro: "Qualcuno \u00E8 entrato nel tuo ufficio mentre eri fuori. Niente \u00E8 stato rubato, ma qualcosa non quadra. Scopri chi \u00E8 stato e perch\u00E9.",
    mystery: "Chi ha visitato l'ufficio stanotte?",
    solution: "Era Maria, la tua collega. \u00C8 venuta in fretta (ha urtato l'orologio), si \u00E8 seduta alla tua scrivania (la tazza), e ti ha lasciato un messaggio urgente. Le scarpe eleganti e la firma 'M.' confermano.",
    clues: makeClues(),
    requiredConnections: [
      { clueA: 'biglietto', clueB: 'tazza' },
      { clueA: 'impronta', clueB: 'orologio' },
    ],
    deductionQuestion: "Chi \u00E8 entrato nel tuo ufficio?",
    deductionOptions: [
      {
        text: 'Un ladro',
        correct: false,
        explanation: "Non \u00E8 stato rubato nulla. Un ladro non si sarebbe seduto a bere caff\u00E8 e scrivere un biglietto.",
      },
      {
        text: 'La tua collega Maria',
        correct: true,
        explanation: "Esatto! La firma 'M.' sul biglietto, le scarpe eleganti taglia 42, la seconda tazza di caff\u00E8 e la fretta (orologio urtato) indicano Maria.",
      },
      {
        text: 'Il portiere del palazzo',
        correct: false,
        explanation: "Le scarpe eleganti taglia 42 non corrispondono a un portiere. Inoltre il biglietto \u00E8 firmato 'M.'",
      },
      {
        text: 'Un estraneo',
        correct: false,
        explanation: "Un estraneo non avrebbe accesso all'ufficio, non saprebbe dove ti siedi, e non lascerebbe un biglietto personale.",
      },
    ],
    solutionNarrative: "Era Maria, la tua collega. \u00C8 venuta in fretta (ha urtato l'orologio alle 23:47), si \u00E8 seduta alla tua scrivania (la seconda tazza di caff\u00E8), e ti ha lasciato un messaggio urgente firmato 'M.' Le scarpe eleganti confermano che non era un intruso.",
    draw,
  };
}
