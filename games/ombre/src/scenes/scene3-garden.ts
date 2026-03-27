// ─── Level 3: Il Giardino (The Garden) ──────────────────────────────

import { type SceneData, type Clue } from '../types';
import { drawFloor } from '../renderer';

function makeClues(): Clue[] {
  return [
    { id: 'footprints', x: 950, y: 620, radius: 28, name: 'Impronte fresche', description: 'Impronte di stivali nel fango vicino al cancello', found: false },
    { id: 'fabric', x: 780, y: 320, radius: 22, name: 'Lembo di stoffa', description: 'Un pezzo di tessuto impigliato nelle spine della siepe', found: false },
    { id: 'locket', x: 350, y: 600, radius: 22, name: 'Medaglione', description: 'Un medaglione mezzo sepolto alla base dell\'albero', found: false },
    { id: 'envelope', x: 550, y: 520, radius: 25, name: 'Busta nella fontana', description: 'Una busta nascosta nel bacino della fontana', found: false },
    { id: 'scratches', x: 150, y: 480, radius: 22, name: 'Graffi sulla serratura', description: 'Segni di scasso sulla serratura del capanno', found: false },
  ];
}

function draw(ctx: CanvasRenderingContext2D, time: number): void {
  // ── Sky - twilight ──
  const skyGrad = ctx.createLinearGradient(0, 0, 0, 400);
  skyGrad.addColorStop(0, '#0A0A1E');
  skyGrad.addColorStop(0.4, '#1A1A3E');
  skyGrad.addColorStop(0.7, '#2A1A2A');
  skyGrad.addColorStop(1, '#3A2030');
  ctx.fillStyle = skyGrad;
  ctx.fillRect(0, 0, 1200, 400);

  // Stars
  ctx.fillStyle = 'rgba(255,255,255,0.4)';
  const starPositions = [
    [100, 30], [250, 60], [400, 25], [550, 50], [700, 35],
    [850, 55], [1050, 40], [150, 90], [350, 80], [600, 100],
    [900, 75], [1100, 85], [180, 45], [480, 70], [750, 45],
  ];
  starPositions.forEach(([sx, sy]) => {
    const twinkle = 0.3 + Math.sin(time * 0.003 + sx) * 0.3;
    ctx.globalAlpha = twinkle;
    ctx.beginPath();
    ctx.arc(sx, sy, 1, 0, Math.PI * 2);
    ctx.fill();
  });
  ctx.globalAlpha = 1;

  // Moon
  ctx.fillStyle = '#E8E0C0';
  ctx.beginPath();
  ctx.arc(1050, 80, 30, 0, Math.PI * 2);
  ctx.fill();
  ctx.fillStyle = '#0A0A1E';
  ctx.beginPath();
  ctx.arc(1060, 75, 28, 0, Math.PI * 2);
  ctx.fill();

  // ── Ground ──
  const groundGrad = ctx.createLinearGradient(0, 350, 0, 800);
  groundGrad.addColorStop(0, '#2A3A20');
  groundGrad.addColorStop(0.3, '#1E2A16');
  groundGrad.addColorStop(1, '#141E10');
  ctx.fillStyle = groundGrad;
  ctx.fillRect(0, 350, 1200, 450);

  // Grass texture
  ctx.strokeStyle = 'rgba(40,60,30,0.4)';
  ctx.lineWidth = 1;
  for (let gx = 0; gx < 1200; gx += 8) {
    const gh = 5 + Math.random() * 10;
    ctx.beginPath();
    ctx.moveTo(gx, 360 + Math.random() * 30);
    ctx.lineTo(gx + 2, 360 + Math.random() * 30 - gh);
    ctx.stroke();
  }

  // ── Stone path ──
  ctx.fillStyle = '#4A4A40';
  for (let px = 400; px < 1100; px += 55) {
    const py = 550 + Math.sin(px * 0.02) * 20;
    ctx.beginPath();
    ctx.ellipse(px, py, 22, 12, Math.random() * 0.3, 0, Math.PI * 2);
    ctx.fill();
    ctx.strokeStyle = 'rgba(0,0,0,0.3)';
    ctx.lineWidth = 1;
    ctx.stroke();
  }

  // ── Old Tree (center-left) ──
  const treeX = 350, treeBaseY = 600;
  // Trunk
  ctx.fillStyle = '#3A2A1A';
  ctx.beginPath();
  ctx.moveTo(treeX - 25, treeBaseY);
  ctx.lineTo(treeX - 15, treeBaseY - 200);
  ctx.lineTo(treeX + 15, treeBaseY - 200);
  ctx.lineTo(treeX + 25, treeBaseY);
  ctx.closePath();
  ctx.fill();
  // Bark texture
  ctx.strokeStyle = 'rgba(20,15,5,0.4)';
  ctx.lineWidth = 1;
  for (let by = treeBaseY; by > treeBaseY - 195; by -= 12) {
    ctx.beginPath();
    ctx.moveTo(treeX - 20 + (treeBaseY - by) * 0.05, by);
    ctx.quadraticCurveTo(treeX + Math.sin(by * 0.1) * 5, by - 6, treeX + 20 - (treeBaseY - by) * 0.05, by);
    ctx.stroke();
  }
  // Branches
  ctx.strokeStyle = '#3A2A1A';
  ctx.lineWidth = 8;
  ctx.beginPath();
  ctx.moveTo(treeX, treeBaseY - 180);
  ctx.quadraticCurveTo(treeX - 60, treeBaseY - 250, treeX - 120, treeBaseY - 260);
  ctx.stroke();
  ctx.lineWidth = 6;
  ctx.beginPath();
  ctx.moveTo(treeX, treeBaseY - 160);
  ctx.quadraticCurveTo(treeX + 80, treeBaseY - 230, treeX + 130, treeBaseY - 220);
  ctx.stroke();
  ctx.lineWidth = 5;
  ctx.beginPath();
  ctx.moveTo(treeX - 5, treeBaseY - 190);
  ctx.quadraticCurveTo(treeX - 30, treeBaseY - 280, treeX - 50, treeBaseY - 300);
  ctx.stroke();
  // Foliage
  ctx.fillStyle = '#1A3A1A';
  const foliagePositions = [
    [-120, -270, 40], [-60, -290, 35], [0, -310, 45],
    [50, -280, 38], [120, -240, 35], [-40, -260, 30],
    [80, -250, 32], [-80, -250, 28], [30, -295, 30],
  ];
  foliagePositions.forEach(([fx, fy, fr]) => {
    ctx.beginPath();
    ctx.arc(treeX + fx, treeBaseY + fy, fr, 0, Math.PI * 2);
    ctx.fill();
  });
  // Darker foliage overlay
  ctx.fillStyle = '#0E2A0E';
  foliagePositions.forEach(([fx, fy, fr]) => {
    ctx.beginPath();
    ctx.arc(treeX + fx + 5, treeBaseY + fy + 5, fr * 0.7, 0, Math.PI * 2);
    ctx.fill();
  });
  // Roots
  ctx.fillStyle = '#3A2A1A';
  ctx.beginPath();
  ctx.moveTo(treeX - 25, treeBaseY);
  ctx.quadraticCurveTo(treeX - 50, treeBaseY + 10, treeX - 60, treeBaseY + 5);
  ctx.lineTo(treeX - 55, treeBaseY + 15);
  ctx.lineTo(treeX - 20, treeBaseY + 10);
  ctx.closePath();
  ctx.fill();
  ctx.beginPath();
  ctx.moveTo(treeX + 25, treeBaseY);
  ctx.quadraticCurveTo(treeX + 45, treeBaseY + 8, treeX + 55, treeBaseY + 3);
  ctx.lineTo(treeX + 50, treeBaseY + 12);
  ctx.lineTo(treeX + 20, treeBaseY + 10);
  ctx.closePath();
  ctx.fill();

  // Clue 3: Locket at tree base
  ctx.fillStyle = '#B8860B';
  ctx.beginPath();
  ctx.arc(350, 600, 7, 0, Math.PI * 2);
  ctx.fill();
  ctx.strokeStyle = '#8B6914';
  ctx.lineWidth = 1;
  ctx.stroke();
  // Chain
  ctx.strokeStyle = '#B8860B';
  ctx.lineWidth = 0.8;
  ctx.beginPath();
  ctx.moveTo(350, 593);
  ctx.lineTo(355, 585);
  ctx.stroke();
  // Dirt partially covering
  ctx.fillStyle = '#2A3A20';
  ctx.beginPath();
  ctx.ellipse(352, 604, 12, 5, 0, 0, Math.PI);
  ctx.fill();

  // ── Fountain (center) ──
  const fountX = 550, fountY = 480;
  // Base
  ctx.fillStyle = '#6A6A60';
  ctx.beginPath();
  ctx.ellipse(fountX, fountY + 40, 60, 18, 0, 0, Math.PI * 2);
  ctx.fill();
  // Basin
  ctx.fillStyle = '#5A5A50';
  ctx.beginPath();
  ctx.ellipse(fountX, fountY + 30, 55, 15, 0, 0, Math.PI * 2);
  ctx.fill();
  // Water
  ctx.fillStyle = '#1A2A3A';
  ctx.beginPath();
  ctx.ellipse(fountX, fountY + 28, 48, 12, 0, 0, Math.PI * 2);
  ctx.fill();
  // Water shimmer
  ctx.fillStyle = `rgba(100,150,200,${0.1 + Math.sin(time * 0.003) * 0.05})`;
  ctx.beginPath();
  ctx.ellipse(fountX, fountY + 28, 48, 12, 0, 0, Math.PI * 2);
  ctx.fill();
  // Pedestal
  ctx.fillStyle = '#7A7A70';
  ctx.fillRect(fountX - 12, fountY - 30, 24, 60);
  // Top ornament
  ctx.fillStyle = '#8A8A7A';
  ctx.beginPath();
  ctx.arc(fountX, fountY - 35, 15, 0, Math.PI * 2);
  ctx.fill();
  // Water drip
  const dripY = (time * 0.05) % 40;
  ctx.fillStyle = 'rgba(100,150,200,0.3)';
  ctx.beginPath();
  ctx.ellipse(fountX, fountY - 15 + dripY, 2, 3, 0, 0, Math.PI * 2);
  ctx.fill();

  // Clue 4: Envelope in fountain basin
  ctx.save();
  ctx.translate(550, 520);
  ctx.rotate(0.15);
  ctx.fillStyle = '#D4C8A0';
  ctx.globalAlpha = 0.7;
  ctx.fillRect(-15, -8, 30, 18);
  ctx.strokeStyle = '#B0A080';
  ctx.lineWidth = 0.5;
  ctx.strokeRect(-15, -8, 30, 18);
  // Seal
  ctx.fillStyle = '#8B0000';
  ctx.beginPath();
  ctx.arc(0, 2, 4, 0, Math.PI * 2);
  ctx.fill();
  ctx.globalAlpha = 1;
  ctx.restore();

  // ── Bench ──
  ctx.fillStyle = '#4A3A2A';
  ctx.fillRect(600, 580, 120, 8);
  ctx.fillRect(600, 600, 120, 8);
  // Bench legs
  ctx.fillRect(605, 608, 6, 30);
  ctx.fillRect(714, 608, 6, 30);
  // Back support
  ctx.fillRect(600, 560, 6, 50);
  ctx.fillRect(714, 560, 6, 50);
  ctx.fillRect(600, 555, 120, 5);
  ctx.fillRect(600, 570, 120, 4);

  // ── Hedge (right side, tall) ──
  ctx.fillStyle = '#1A3A1A';
  ctx.fillRect(720, 250, 160, 200);
  ctx.fillStyle = '#0E2E0E';
  // Hedge leaf texture
  for (let hy = 260; hy < 440; hy += 12) {
    for (let hx = 725; hx < 875; hx += 14) {
      ctx.beginPath();
      ctx.arc(hx + Math.random() * 5, hy + Math.random() * 5, 5 + Math.random() * 3, 0, Math.PI * 2);
      ctx.fill();
    }
  }
  // Hedge top (rounded)
  ctx.fillStyle = '#1A3A1A';
  for (let htx = 720; htx < 880; htx += 20) {
    ctx.beginPath();
    ctx.arc(htx, 250, 15, 0, Math.PI * 2);
    ctx.fill();
  }

  // Clue 2: Torn fabric on hedge
  ctx.fillStyle = '#8B4513';
  ctx.save();
  ctx.translate(780, 320);
  ctx.rotate(0.3);
  ctx.fillRect(0, 0, 15, 8);
  // Frayed edge
  ctx.strokeStyle = '#8B4513';
  ctx.lineWidth = 0.5;
  for (let f = 0; f < 5; f++) {
    ctx.beginPath();
    ctx.moveTo(15, f * 2);
    ctx.lineTo(18 + Math.random() * 3, f * 2 + Math.random() * 2);
    ctx.stroke();
  }
  ctx.restore();

  // ── Iron Gate (far right) ──
  const gateX = 1000, gateY = 280;
  // Gate posts
  ctx.fillStyle = '#3A3A3A';
  ctx.fillRect(gateX - 10, gateY, 15, 350);
  ctx.fillRect(gateX + 100, gateY, 15, 350);
  // Post tops
  ctx.fillStyle = '#4A4A4A';
  ctx.beginPath();
  ctx.arc(gateX - 2, gateY, 10, 0, Math.PI * 2);
  ctx.fill();
  ctx.beginPath();
  ctx.arc(gateX + 108, gateY, 10, 0, Math.PI * 2);
  ctx.fill();
  // Gate bars
  ctx.strokeStyle = '#2A2A2A';
  ctx.lineWidth = 3;
  for (let bar = 0; bar < 7; bar++) {
    const bx = gateX + 10 + bar * 14;
    ctx.beginPath();
    ctx.moveTo(bx, gateY + 20);
    ctx.lineTo(bx, gateY + 300);
    ctx.stroke();
    // Spear tops
    ctx.beginPath();
    ctx.moveTo(bx, gateY + 15);
    ctx.lineTo(bx - 3, gateY + 25);
    ctx.lineTo(bx + 3, gateY + 25);
    ctx.closePath();
    ctx.fillStyle = '#2A2A2A';
    ctx.fill();
  }
  // Cross bars
  ctx.beginPath();
  ctx.moveTo(gateX + 5, gateY + 100);
  ctx.lineTo(gateX + 100, gateY + 100);
  ctx.moveTo(gateX + 5, gateY + 220);
  ctx.lineTo(gateX + 100, gateY + 220);
  ctx.stroke();

  // Clue 1: Fresh footprints in mud near gate
  ctx.fillStyle = '#3A2A18';
  ctx.beginPath();
  ctx.ellipse(940, 615, 12, 5, -0.3, 0, Math.PI * 2);
  ctx.fill();
  ctx.beginPath();
  ctx.ellipse(955, 630, 12, 5, -0.2, 0, Math.PI * 2);
  ctx.fill();
  ctx.beginPath();
  ctx.ellipse(965, 610, 12, 5, -0.3, 0, Math.PI * 2);
  ctx.fill();
  // Mud area
  ctx.fillStyle = '#2A1A0A';
  ctx.beginPath();
  ctx.ellipse(950, 620, 40, 20, 0, 0, Math.PI * 2);
  ctx.fill();
  // Footprints on top (shoe treads)
  ctx.fillStyle = '#1A0A00';
  ctx.beginPath();
  ctx.ellipse(940, 615, 10, 4, -0.3, 0, Math.PI * 2);
  ctx.fill();
  ctx.beginPath();
  ctx.ellipse(960, 625, 10, 4, -0.2, 0, Math.PI * 2);
  ctx.fill();

  // ── Garden Shed (left) ──
  ctx.fillStyle = '#3A3028';
  ctx.fillRect(80, 400, 130, 150);
  // Roof
  ctx.fillStyle = '#2A2A28';
  ctx.beginPath();
  ctx.moveTo(70, 400);
  ctx.lineTo(145, 360);
  ctx.lineTo(220, 400);
  ctx.closePath();
  ctx.fill();
  // Wood planks
  ctx.strokeStyle = 'rgba(20,15,10,0.3)';
  ctx.lineWidth = 0.5;
  for (let sx = 80; sx < 210; sx += 18) {
    ctx.beginPath();
    ctx.moveTo(sx, 400);
    ctx.lineTo(sx, 550);
    ctx.stroke();
  }
  // Door
  ctx.fillStyle = '#2A2018';
  ctx.fillRect(120, 440, 50, 110);
  ctx.strokeStyle = '#3A3028';
  ctx.lineWidth = 1;
  ctx.strokeRect(120, 440, 50, 110);
  // Door handle and lock
  ctx.fillStyle = '#666';
  ctx.beginPath();
  ctx.arc(163, 500, 4, 0, Math.PI * 2);
  ctx.fill();

  // Clue 5: Scratch marks on shed lock
  ctx.strokeStyle = '#888';
  ctx.lineWidth = 0.8;
  for (let s = 0; s < 6; s++) {
    ctx.beginPath();
    ctx.moveTo(158 + Math.random() * 10, 495 + Math.random() * 10);
    ctx.lineTo(162 + Math.random() * 6, 498 + Math.random() * 6);
    ctx.stroke();
  }
  // Lock
  ctx.fillStyle = '#555';
  ctx.fillRect(160, 496, 8, 10);
  ctx.beginPath();
  ctx.arc(164, 496, 5, Math.PI, 0, true);
  ctx.strokeStyle = '#555';
  ctx.lineWidth = 2;
  ctx.stroke();

  // ── Flower beds ──
  const flowerColors = ['#E63946', '#FF6B6B', '#FFD700', '#FF69B4', '#DDA0DD'];
  for (let fx = 450; fx < 700; fx += 25) {
    ctx.fillStyle = '#2A4A2A';
    ctx.beginPath();
    ctx.ellipse(fx, 650 + Math.sin(fx * 0.05) * 5, 4, 8, 0, 0, Math.PI * 2);
    ctx.fill();
    ctx.fillStyle = flowerColors[Math.floor(fx * 0.04) % flowerColors.length];
    ctx.beginPath();
    ctx.arc(fx, 642 + Math.sin(fx * 0.05) * 5, 3, 0, Math.PI * 2);
    ctx.fill();
  }

  // ── Vines on wall/gate ──
  ctx.strokeStyle = '#1A3A1A';
  ctx.lineWidth = 2;
  ctx.beginPath();
  ctx.moveTo(1000, 300);
  ctx.quadraticCurveTo(990, 350, 995, 400);
  ctx.quadraticCurveTo(988, 450, 992, 500);
  ctx.stroke();
  // Vine leaves
  ctx.fillStyle = '#1A3A1A';
  for (let vl = 320; vl < 500; vl += 30) {
    ctx.beginPath();
    ctx.ellipse(990 + Math.sin(vl * 0.1) * 8, vl, 6, 4, Math.sin(vl) * 0.5, 0, Math.PI * 2);
    ctx.fill();
  }
}

export function createScene3(): SceneData {
  return {
    id: 3,
    title: 'Il Giardino',
    subtitle: 'Capitolo III',
    mystery: 'Chi è fuggito dal giardino?',
    solution: 'Le impronte, la stoffa, il medaglione, la busta e i graffi raccontano di una fuga precipitosa attraverso il giardino.',
    clues: makeClues(),
    draw,
  };
}
