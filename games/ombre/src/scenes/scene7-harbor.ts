// ─── Level 7: Il Porto (The Harbor) ─────────────────────────────────

import { type SceneData, type Clue } from '../types';

function makeClues(): Clue[] {
  return [
    { id: 'boot-prints', x: 400, y: 620, radius: 25, name: 'Impronte bagnate', description: 'Impronte fresche di stivali bagnati sul molo', found: false },
    { id: 'cargo-label', x: 700, y: 520, radius: 22, name: 'Etichetta strappata', description: 'Un\'etichetta del carico strappata da una cassa', found: false },
    { id: 'compass', x: 250, y: 540, radius: 22, name: 'Bussola guasta', description: 'Una bussola che non punta a nord', found: false },
    { id: 'cut-rope', x: 550, y: 480, radius: 22, name: 'Corda tagliata', description: 'Una corda tagliata di recente con fibre fresche', found: false },
    { id: 'lighthouse', x: 1050, y: 200, radius: 28, name: 'Segnale luminoso', description: 'Un segnale irregolare dal faro', found: false },
    { id: 'anchor', x: 150, y: 650, radius: 25, name: 'Ancora con simboli', description: 'Un\'ancora con iscrizioni straniere', found: false },
  ];
}

function draw(ctx: CanvasRenderingContext2D, time: number): void {
  // ── Night sky ──
  const skyGrad = ctx.createLinearGradient(0, 0, 0, 350);
  skyGrad.addColorStop(0, '#050510');
  skyGrad.addColorStop(0.6, '#0A0A20');
  skyGrad.addColorStop(1, '#101830');
  ctx.fillStyle = skyGrad;
  ctx.fillRect(0, 0, 1200, 350);

  // Stars
  ctx.fillStyle = 'rgba(255,255,255,0.3)';
  const stars = [
    [80, 30], [200, 50], [350, 20], [500, 45], [650, 30],
    [800, 55], [950, 35], [1100, 50], [130, 70], [420, 65],
    [700, 60], [880, 40], [1050, 25], [270, 40], [580, 55],
    [760, 20], [920, 65], [380, 35], [1150, 45],
  ];
  stars.forEach(([sx, sy]) => {
    const tw = 0.2 + Math.sin(time * 0.002 + sx * 0.1) * 0.2;
    ctx.globalAlpha = tw;
    ctx.beginPath();
    ctx.arc(sx, sy, 0.8, 0, Math.PI * 2);
    ctx.fill();
  });
  ctx.globalAlpha = 1;

  // ── Fog layer ──
  ctx.fillStyle = 'rgba(60,70,90,0.08)';
  for (let fi = 0; fi < 5; fi++) {
    const fogX = ((time * 0.02 + fi * 300) % 1600) - 200;
    ctx.beginPath();
    ctx.ellipse(fogX, 300 + fi * 20, 200, 30, 0, 0, Math.PI * 2);
    ctx.fill();
  }

  // ── Water ──
  const waterGrad = ctx.createLinearGradient(0, 300, 0, 500);
  waterGrad.addColorStop(0, '#0A1020');
  waterGrad.addColorStop(0.5, '#0E1428');
  waterGrad.addColorStop(1, '#081018');
  ctx.fillStyle = waterGrad;
  ctx.fillRect(0, 300, 1200, 200);

  // Water wave effect
  ctx.strokeStyle = 'rgba(80,100,140,0.08)';
  ctx.lineWidth = 1;
  for (let wy = 310; wy < 500; wy += 15) {
    ctx.beginPath();
    for (let wx = 0; wx < 1200; wx += 5) {
      const waveY = wy + Math.sin(wx * 0.02 + time * 0.002 + wy * 0.1) * 3;
      if (wx === 0) ctx.moveTo(wx, waveY);
      else ctx.lineTo(wx, waveY);
    }
    ctx.stroke();
  }

  // ── Lighthouse (far right, distance) ──
  const lhX = 1050, lhBaseY = 280;
  // Base
  ctx.fillStyle = '#555';
  ctx.beginPath();
  ctx.moveTo(lhX - 15, lhBaseY);
  ctx.lineTo(lhX - 10, lhBaseY - 120);
  ctx.lineTo(lhX + 10, lhBaseY - 120);
  ctx.lineTo(lhX + 15, lhBaseY);
  ctx.closePath();
  ctx.fill();
  // Red band
  ctx.fillStyle = '#8B2020';
  ctx.fillRect(lhX - 12, lhBaseY - 60, 24, 20);
  // Lamp room
  ctx.fillStyle = '#666';
  ctx.fillRect(lhX - 12, lhBaseY - 130, 24, 15);
  // Roof
  ctx.fillStyle = '#444';
  ctx.beginPath();
  ctx.moveTo(lhX - 15, lhBaseY - 130);
  ctx.lineTo(lhX, lhBaseY - 150);
  ctx.lineTo(lhX + 15, lhBaseY - 130);
  ctx.closePath();
  ctx.fill();

  // Clue 5: Lighthouse signal - irregular flashing
  const signalPhase = (time * 0.003) % 10;
  const isOn = signalPhase < 1 || (signalPhase > 2 && signalPhase < 2.5) || (signalPhase > 4 && signalPhase < 6);
  if (isOn) {
    const beamGrad = ctx.createRadialGradient(lhX, lhBaseY - 135, 0, lhX, lhBaseY - 135, 80);
    beamGrad.addColorStop(0, 'rgba(255,255,200,0.4)');
    beamGrad.addColorStop(0.3, 'rgba(255,255,200,0.1)');
    beamGrad.addColorStop(1, 'rgba(255,255,200,0)');
    ctx.fillStyle = beamGrad;
    ctx.beginPath();
    ctx.arc(lhX, lhBaseY - 135, 80, 0, Math.PI * 2);
    ctx.fill();
    // Beam
    ctx.save();
    ctx.globalAlpha = 0.06;
    ctx.fillStyle = '#FFFFC8';
    const beamAngle = Math.sin(time * 0.001) * 0.3 - 0.5;
    ctx.beginPath();
    ctx.moveTo(lhX, lhBaseY - 135);
    ctx.lineTo(lhX + Math.cos(beamAngle) * 400, lhBaseY - 135 + Math.sin(beamAngle) * 400);
    ctx.lineTo(lhX + Math.cos(beamAngle + 0.1) * 400, lhBaseY - 135 + Math.sin(beamAngle + 0.1) * 400);
    ctx.closePath();
    ctx.fill();
    ctx.globalAlpha = 1;
    ctx.restore();
  }

  // ── Dock/pier ──
  ctx.fillStyle = '#3A2E22';
  ctx.fillRect(200, 480, 700, 20);
  // Dock planks
  ctx.strokeStyle = 'rgba(20,15,10,0.4)';
  ctx.lineWidth = 0.5;
  for (let dx = 200; dx < 900; dx += 25) {
    ctx.beginPath();
    ctx.moveTo(dx, 480);
    ctx.lineTo(dx, 500);
    ctx.stroke();
  }
  // Dock surface extends
  ctx.fillStyle = '#3A2E22';
  ctx.fillRect(100, 500, 900, 250);
  // Wood grain on dock
  ctx.strokeStyle = 'rgba(20,15,10,0.2)';
  for (let dy = 510; dy < 750; dy += 8) {
    ctx.beginPath();
    ctx.moveTo(100, dy);
    ctx.lineTo(1000, dy + Math.sin(dy * 0.1) * 2);
    ctx.stroke();
  }
  // Plank lines
  for (let dx = 100; dx < 1000; dx += 60) {
    ctx.beginPath();
    ctx.moveTo(dx, 500);
    ctx.lineTo(dx, 750);
    ctx.stroke();
  }

  // ── Dock pillars ──
  ctx.fillStyle = '#2A1E16';
  for (const px of [250, 450, 650, 850]) {
    ctx.fillRect(px - 8, 480, 16, 30);
    // Pillar in water
    ctx.fillStyle = '#1E1612';
    ctx.fillRect(px - 6, 460, 12, 40);
    ctx.fillStyle = '#2A1E16';
  }

  // ── Moored boat ──
  const boatX = 300, boatY = 380;
  // Hull
  ctx.fillStyle = '#2A1E14';
  ctx.beginPath();
  ctx.moveTo(boatX - 80, boatY);
  ctx.quadraticCurveTo(boatX - 100, boatY + 40, boatX - 60, boatY + 50);
  ctx.lineTo(boatX + 100, boatY + 50);
  ctx.quadraticCurveTo(boatX + 120, boatY + 40, boatX + 110, boatY);
  ctx.closePath();
  ctx.fill();
  // Deck
  ctx.fillStyle = '#3A2E22';
  ctx.beginPath();
  ctx.moveTo(boatX - 80, boatY);
  ctx.lineTo(boatX + 110, boatY);
  ctx.lineTo(boatX + 100, boatY + 8);
  ctx.lineTo(boatX - 70, boatY + 8);
  ctx.closePath();
  ctx.fill();
  // Cabin
  ctx.fillStyle = '#2A2018';
  ctx.fillRect(boatX - 20, boatY - 30, 60, 30);
  ctx.fillStyle = '#1A1A2E';
  ctx.fillRect(boatX - 10, boatY - 25, 15, 12);
  ctx.fillRect(boatX + 15, boatY - 25, 15, 12);
  // Mast
  ctx.strokeStyle = '#4A3A2A';
  ctx.lineWidth = 4;
  ctx.beginPath();
  ctx.moveTo(boatX + 40, boatY);
  ctx.lineTo(boatX + 40, boatY - 100);
  ctx.stroke();
  // Mooring rope to dock
  ctx.strokeStyle = '#8A7A5A';
  ctx.lineWidth = 2;
  ctx.beginPath();
  ctx.moveTo(boatX - 60, boatY + 5);
  ctx.quadraticCurveTo(boatX - 40, boatY + 60, 250, 490);
  ctx.stroke();
  // Water reflection
  ctx.fillStyle = 'rgba(10,16,24,0.5)';
  ctx.beginPath();
  ctx.ellipse(boatX + 10, boatY + 60, 90, 15, 0, 0, Math.PI * 2);
  ctx.fill();

  // Bob gently
  const bobY = Math.sin(time * 0.001) * 2;
  ctx.save();
  ctx.translate(0, bobY);
  ctx.restore();

  // ── Cargo crates ──
  const cratePositions = [
    { x: 650, y: 520, w: 70, h: 60 },
    { x: 730, y: 530, w: 55, h: 50 },
    { x: 680, y: 480, w: 50, h: 45 },
  ];
  cratePositions.forEach(c => {
    ctx.fillStyle = '#4A3A28';
    ctx.fillRect(c.x, c.y, c.w, c.h);
    ctx.strokeStyle = '#3A2A18';
    ctx.lineWidth = 1;
    ctx.strokeRect(c.x, c.y, c.w, c.h);
    // Cross braces
    ctx.beginPath();
    ctx.moveTo(c.x, c.y);
    ctx.lineTo(c.x + c.w, c.y + c.h);
    ctx.moveTo(c.x + c.w, c.y);
    ctx.lineTo(c.x, c.y + c.h);
    ctx.strokeStyle = 'rgba(30,20,10,0.3)';
    ctx.stroke();
    // Metal bands
    ctx.fillStyle = '#555';
    ctx.fillRect(c.x, c.y + 5, c.w, 3);
    ctx.fillRect(c.x, c.y + c.h - 8, c.w, 3);
  });

  // Clue 2: Torn cargo label
  ctx.save();
  ctx.translate(700, 520);
  ctx.rotate(-0.1);
  ctx.fillStyle = '#E8D5A0';
  ctx.fillRect(0, 0, 30, 18);
  // Torn edge
  ctx.fillStyle = '#4A3A28';
  ctx.beginPath();
  ctx.moveTo(28, 0);
  for (let t = 0; t < 18; t += 3) {
    ctx.lineTo(26 + Math.random() * 6, t);
  }
  ctx.lineTo(28, 18);
  ctx.closePath();
  ctx.fill();
  // Partial text
  ctx.font = '5px monospace';
  ctx.fillStyle = '#333';
  ctx.fillText('DEST: T', 3, 8);
  ctx.fillText('N.237', 3, 15);
  ctx.restore();

  // ── Rope coils ──
  ctx.strokeStyle = '#8A7A5A';
  ctx.lineWidth = 3;
  for (let r = 0; r < 4; r++) {
    ctx.beginPath();
    ctx.ellipse(550, 520 + r * 3, 25, 8, 0, 0, Math.PI * 2);
    ctx.stroke();
  }

  // Clue 4: Recently cut rope
  ctx.strokeStyle = '#8A7A5A';
  ctx.lineWidth = 3;
  ctx.beginPath();
  ctx.moveTo(550, 480);
  ctx.lineTo(570, 470);
  ctx.stroke();
  // Fresh cut end - lighter colored fibers
  ctx.strokeStyle = '#C4B48A';
  ctx.lineWidth = 1;
  for (let f = 0; f < 6; f++) {
    ctx.beginPath();
    ctx.moveTo(568 + Math.random() * 4, 468 + Math.random() * 4);
    ctx.lineTo(572 + Math.random() * 5, 465 + Math.random() * 5);
    ctx.stroke();
  }

  // ── Lantern (on dock post) ──
  const lanternX = 850, lanternY = 440;
  // Post
  ctx.fillStyle = '#333';
  ctx.fillRect(lanternX - 3, lanternY, 6, 60);
  // Lantern body
  ctx.fillStyle = '#444';
  ctx.fillRect(lanternX - 8, lanternY - 20, 16, 25);
  // Glass
  ctx.fillStyle = 'rgba(255,200,80,0.15)';
  ctx.fillRect(lanternX - 6, lanternY - 18, 12, 20);
  // Top
  ctx.fillStyle = '#333';
  ctx.beginPath();
  ctx.moveTo(lanternX - 10, lanternY - 20);
  ctx.lineTo(lanternX, lanternY - 28);
  ctx.lineTo(lanternX + 10, lanternY - 20);
  ctx.closePath();
  ctx.fill();
  // Lantern glow
  const lanternGlow = ctx.createRadialGradient(lanternX, lanternY - 10, 0, lanternX, lanternY - 10, 50);
  lanternGlow.addColorStop(0, 'rgba(255,200,80,0.06)');
  lanternGlow.addColorStop(1, 'rgba(255,200,80,0)');
  ctx.fillStyle = lanternGlow;
  ctx.fillRect(lanternX - 50, lanternY - 60, 100, 100);

  // Clue 1: Wet boot prints on dock
  ctx.fillStyle = 'rgba(30,40,50,0.25)';
  ctx.beginPath();
  ctx.ellipse(390, 615, 12, 5, -0.2, 0, Math.PI * 2);
  ctx.fill();
  ctx.beginPath();
  ctx.ellipse(410, 630, 12, 5, -0.15, 0, Math.PI * 2);
  ctx.fill();
  ctx.beginPath();
  ctx.ellipse(395, 640, 12, 5, -0.2, 0, Math.PI * 2);
  ctx.fill();
  // Water in prints
  ctx.fillStyle = 'rgba(60,80,120,0.15)';
  ctx.beginPath();
  ctx.ellipse(390, 615, 8, 3, -0.2, 0, Math.PI * 2);
  ctx.fill();
  ctx.beginPath();
  ctx.ellipse(410, 630, 8, 3, -0.15, 0, Math.PI * 2);
  ctx.fill();

  // Clue 3: Compass
  ctx.save();
  ctx.translate(250, 540);
  ctx.fillStyle = '#B8860B';
  ctx.beginPath();
  ctx.arc(0, 0, 15, 0, Math.PI * 2);
  ctx.fill();
  ctx.fillStyle = '#F5F0E0';
  ctx.beginPath();
  ctx.arc(0, 0, 12, 0, Math.PI * 2);
  ctx.fill();
  // Cardinal points
  ctx.font = '5px sans-serif';
  ctx.fillStyle = '#333';
  ctx.textAlign = 'center';
  ctx.fillText('N', 0, -6);
  ctx.fillText('S', 0, 10);
  ctx.fillText('E', 8, 2);
  ctx.fillText('O', -8, 2);
  // Needle pointing wrong way (east instead of north)
  ctx.strokeStyle = '#E63946';
  ctx.lineWidth = 1.5;
  ctx.beginPath();
  ctx.moveTo(-6, 2);
  ctx.lineTo(8, -1);
  ctx.stroke();
  ctx.fillStyle = '#E63946';
  ctx.beginPath();
  ctx.moveTo(8, -1);
  ctx.lineTo(5, -3);
  ctx.lineTo(5, 1);
  ctx.closePath();
  ctx.fill();
  ctx.restore();

  // Clue 6: Anchor with foreign markings
  ctx.save();
  ctx.translate(150, 650);
  ctx.strokeStyle = '#555';
  ctx.lineWidth = 4;
  // Anchor shank
  ctx.beginPath();
  ctx.moveTo(0, -30);
  ctx.lineTo(0, 20);
  ctx.stroke();
  // Cross bar
  ctx.beginPath();
  ctx.moveTo(-20, -20);
  ctx.lineTo(20, -20);
  ctx.stroke();
  // Flukes
  ctx.beginPath();
  ctx.moveTo(-15, 20);
  ctx.quadraticCurveTo(-25, 30, -20, 35);
  ctx.stroke();
  ctx.beginPath();
  ctx.moveTo(15, 20);
  ctx.quadraticCurveTo(25, 30, 20, 35);
  ctx.stroke();
  // Ring at top
  ctx.beginPath();
  ctx.arc(0, -35, 6, 0, Math.PI * 2);
  ctx.stroke();
  // Foreign markings
  ctx.font = '6px serif';
  ctx.fillStyle = 'rgba(150,130,100,0.5)';
  ctx.textAlign = 'center';
  ctx.fillText('XVMK', 0, 5);
  ctx.fillText('ODESSA', 0, -8);
  ctx.restore();

  // ── Distant city lights ──
  ctx.fillStyle = 'rgba(255,200,100,0.03)';
  for (let cl = 0; cl < 30; cl++) {
    const cx = 50 + cl * 38;
    const cy = 290 + Math.sin(cl * 0.5) * 8;
    ctx.beginPath();
    ctx.arc(cx, cy, 1 + Math.random(), 0, Math.PI * 2);
    ctx.fill();
  }
}

export function createScene7(): SceneData {
  return {
    id: 7,
    title: 'Il Porto',
    subtitle: 'Capitolo VII',
    mystery: 'Cosa trasportava la nave fantasma?',
    solution: 'Le impronte, l\'etichetta, la bussola, la corda, il segnale e l\'ancora rivelano un contrabbando notturno con una nave proveniente da Odessa.',
    clues: makeClues(),
    draw,
  };
}
