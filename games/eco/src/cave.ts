import { CaveLevel, CaveWall } from './types';

// Helper to create a rectangular room from walls
function rect(x: number, y: number, w: number, h: number, type: CaveWall['type'] = 'stone'): CaveWall[] {
  return [
    { x1: x, y1: y, x2: x + w, y2: y, type },
    { x1: x + w, y1: y, x2: x + w, y2: y + h, type },
    { x1: x + w, y1: y + h, x2: x, y2: y + h, type },
    { x1: x, y1: y + h, x2: x, y2: y, type },
  ];
}

// Helper: line segment
function wall(x1: number, y1: number, x2: number, y2: number, type: CaveWall['type'] = 'stone'): CaveWall {
  return { x1, y1, x2, y2, type };
}

// ── Level 1: Il Primo Eco (Tutorial) ──────────────────────
const level1: CaveLevel = {
  name: 'Il Primo Eco',
  subtitle: 'Tutorial',
  tutorialText: 'Clicca per emettere un impulso sonoro.\nLe onde riveleranno la caverna.\nUsa WASD o le frecce per muoverti.',
  maxPulses: 15,
  playerStart: { x: 150, y: 400 },
  exit: { x: 1050, y: 400, radius: 22 },
  crystals: [
    { x: 400, y: 300, collected: false },
    { x: 600, y: 500, collected: false },
    { x: 850, y: 350, collected: false },
  ],
  hazards: [],
  walls: [
    // Outer room
    wall(80, 250, 500, 250),
    wall(80, 250, 80, 550),
    wall(80, 550, 500, 550),
    wall(500, 250, 500, 330),
    wall(500, 470, 500, 550),
    // Corridor
    wall(500, 330, 700, 330),
    wall(500, 470, 700, 470),
    // Second room
    wall(700, 250, 700, 330),
    wall(700, 470, 700, 550),
    wall(700, 250, 1120, 250),
    wall(700, 550, 1120, 550),
    wall(1120, 250, 1120, 550),
  ],
};

// ── Level 2: Il Bivio ─────────────────────────────────────
const level2: CaveLevel = {
  name: 'Il Bivio',
  subtitle: 'La scelta giusta',
  maxPulses: 12,
  playerStart: { x: 150, y: 400 },
  exit: { x: 1050, y: 250, radius: 22 },
  crystals: [
    { x: 400, y: 250, collected: false },
    { x: 900, y: 250, collected: false },
  ],
  hazards: [],
  walls: [
    // Start room
    wall(80, 300, 350, 300),
    wall(80, 500, 350, 500),
    wall(80, 300, 80, 500),
    // Fork top path (correct)
    wall(350, 300, 350, 180),
    wall(350, 180, 1100, 180),
    wall(350, 300, 600, 300),
    wall(600, 300, 600, 320),
    wall(600, 320, 1100, 320),
    wall(1100, 180, 1100, 320),
    // Fork bottom path (dead end)
    wall(350, 500, 350, 620),
    wall(350, 620, 900, 620),
    wall(350, 500, 600, 500),
    wall(600, 500, 600, 480),
    wall(600, 480, 900, 480),
    wall(900, 480, 900, 620),
  ],
};

// ── Level 3: La Grotta Nascosta ───────────────────────────
const level3: CaveLevel = {
  name: 'La Grotta Nascosta',
  subtitle: 'Esplora ogni angolo',
  maxPulses: 12,
  playerStart: { x: 100, y: 400 },
  exit: { x: 1100, y: 400, radius: 22 },
  crystals: [
    { x: 300, y: 200, collected: false },
    { x: 350, y: 220, collected: false },
    { x: 700, y: 600, collected: false },
    { x: 750, y: 620, collected: false },
  ],
  hazards: [],
  walls: [
    // Main corridor
    wall(50, 350, 1150, 350),
    wall(50, 450, 1150, 450),
    wall(50, 350, 50, 450),
    wall(1150, 350, 1150, 450),
    // Hidden room top (opening at x=250-320)
    wall(250, 350, 250, 140),
    wall(320, 350, 320, 140),
    wall(250, 140, 450, 140),
    wall(320, 140, 450, 140),
    wall(450, 140, 450, 280),
    wall(250, 280, 250, 140),
    wall(250, 280, 450, 280),
    // Hidden room bottom (opening at x=650-720)
    wall(650, 450, 650, 560),
    wall(720, 450, 720, 560),
    wall(650, 560, 650, 680),
    wall(720, 560, 720, 680),
    wall(650, 680, 850, 680),
    wall(720, 560, 850, 560),
    wall(850, 560, 850, 680),
  ],
};

// ── Level 4: Le Stalattiti ────────────────────────────────
const level4: CaveLevel = {
  name: 'Le Stalattiti',
  subtitle: 'Attento ai pericoli',
  maxPulses: 10,
  playerStart: { x: 100, y: 400 },
  exit: { x: 1100, y: 400, radius: 22 },
  crystals: [
    { x: 600, y: 380, collected: false },
    { x: 900, y: 420, collected: false },
  ],
  hazards: [
    { x: 400, y: 370, radius: 14 },
    { x: 420, y: 430, radius: 14 },
    { x: 700, y: 350, radius: 14 },
    { x: 720, y: 450, radius: 14 },
    { x: 850, y: 390, radius: 12 },
  ],
  walls: [
    wall(50, 280, 500, 280),
    wall(50, 520, 500, 520),
    wall(50, 280, 50, 520),
    wall(500, 280, 500, 330),
    wall(500, 470, 500, 520),
    wall(500, 330, 800, 310),
    wall(500, 470, 800, 490),
    wall(800, 310, 800, 340),
    wall(800, 460, 800, 490),
    wall(800, 340, 1150, 320),
    wall(800, 460, 1150, 480),
    wall(1150, 320, 1150, 480),
  ],
};

// ── Level 5: Il Lago Sotterraneo ──────────────────────────
const level5: CaveLevel = {
  name: 'Il Lago Sotterraneo',
  subtitle: 'Acque profonde',
  maxPulses: 10,
  playerStart: { x: 100, y: 200 },
  exit: { x: 1100, y: 600, radius: 22 },
  crystals: [
    { x: 200, y: 350, collected: false },
    { x: 1000, y: 350, collected: false },
    { x: 600, y: 200, collected: false },
  ],
  hazards: [],
  walls: [
    // Top corridor
    wall(50, 120, 1150, 120),
    wall(50, 280, 450, 280),
    wall(50, 120, 50, 280),
    wall(750, 280, 1150, 280),
    wall(1150, 120, 1150, 280),
    // Lake (water walls)
    wall(350, 350, 850, 350, 'water'),
    wall(350, 550, 850, 550, 'water'),
    wall(350, 350, 350, 550, 'water'),
    wall(850, 350, 850, 550, 'water'),
    // Left passage around lake
    wall(50, 280, 50, 680),
    wall(250, 350, 250, 680),
    wall(50, 680, 250, 680),
    // Right passage around lake
    wall(950, 350, 950, 680),
    wall(1150, 280, 1150, 680),
    wall(950, 680, 1150, 680),
    // Bottom connection
    wall(250, 680, 450, 680),
    wall(750, 680, 950, 680),
    wall(450, 620, 450, 680),
    wall(750, 620, 750, 680),
    wall(450, 620, 750, 620),
  ],
};

// ── Level 6: Il Labirinto di Cristallo ────────────────────
const level6: CaveLevel = {
  name: 'Il Labirinto di Cristallo',
  subtitle: 'Splendore sotterraneo',
  maxPulses: 10,
  playerStart: { x: 100, y: 400 },
  exit: { x: 1100, y: 400, radius: 22 },
  crystals: [
    { x: 300, y: 200, collected: false },
    { x: 500, y: 600, collected: false },
    { x: 700, y: 200, collected: false },
    { x: 900, y: 600, collected: false },
    { x: 600, y: 400, collected: false },
    { x: 1000, y: 300, collected: false },
  ],
  hazards: [
    { x: 400, y: 400, radius: 12 },
    { x: 800, y: 400, radius: 12 },
  ],
  walls: [
    // Outer bounds
    wall(50, 100, 1150, 100),
    wall(50, 700, 1150, 700),
    wall(50, 100, 50, 700),
    wall(1150, 100, 1150, 700),
    // Crystal chamber walls
    wall(200, 100, 200, 300, 'crystal'),
    wall(200, 300, 400, 300, 'crystal'),
    wall(400, 100, 400, 300, 'crystal'),
    wall(200, 500, 200, 700, 'crystal'),
    wall(200, 500, 400, 500, 'crystal'),
    wall(400, 500, 400, 700, 'crystal'),
    wall(600, 100, 600, 300, 'crystal'),
    wall(600, 300, 800, 300, 'crystal'),
    wall(800, 100, 800, 300, 'crystal'),
    wall(600, 500, 600, 700, 'crystal'),
    wall(600, 500, 800, 500, 'crystal'),
    wall(800, 500, 800, 700, 'crystal'),
    // Internal corridors
    wall(400, 350, 600, 350),
    wall(400, 450, 600, 450),
    wall(800, 350, 1000, 350),
    wall(800, 450, 1000, 450),
  ],
};

// ── Level 7: Le Correnti ──────────────────────────────────
const level7: CaveLevel = {
  name: 'Le Correnti',
  subtitle: 'Risparmia energia',
  maxPulses: 8,
  playerStart: { x: 100, y: 100 },
  exit: { x: 1100, y: 700, radius: 22 },
  crystals: [
    { x: 500, y: 150, collected: false },
    { x: 1050, y: 350, collected: false },
  ],
  hazards: [
    { x: 600, y: 350, radius: 12 },
    { x: 300, y: 550, radius: 12 },
  ],
  walls: [
    // Winding path: top-right
    wall(50, 50, 700, 50),
    wall(50, 200, 550, 200),
    wall(50, 50, 50, 200),
    wall(700, 50, 700, 270),
    wall(550, 200, 550, 270),
    wall(550, 270, 700, 270),
    // Down-right
    wall(700, 270, 1150, 270),
    wall(700, 420, 1150, 420),
    wall(1150, 270, 1150, 420),
    // Down-left
    wall(100, 420, 700, 420),
    wall(100, 570, 700, 570),
    wall(100, 420, 100, 570),
    // Down-right again to exit
    wall(700, 570, 700, 640),
    wall(700, 640, 1150, 640),
    wall(700, 570, 1150, 570),
    wall(1150, 640, 1150, 750),
    wall(700, 750, 1150, 750),
    wall(700, 640, 700, 750),
  ],
};

// ── Level 8: La Camera delle Gemme ────────────────────────
const level8: CaveLevel = {
  name: 'La Camera delle Gemme',
  subtitle: 'Il cerchio di cristalli',
  maxPulses: 8,
  playerStart: { x: 100, y: 400 },
  exit: { x: 600, y: 400, radius: 22 },
  crystals: (() => {
    const cs: Crystal[] = [];
    for (let i = 0; i < 8; i++) {
      const a = (i / 8) * Math.PI * 2;
      cs.push({
        x: 600 + Math.cos(a) * 200,
        y: 400 + Math.sin(a) * 200,
        collected: false,
      });
    }
    return cs;
  })(),
  hazards: [
    { x: 450, y: 300, radius: 14 },
    { x: 750, y: 300, radius: 14 },
    { x: 450, y: 500, radius: 14 },
    { x: 750, y: 500, radius: 14 },
  ],
  walls: [
    // Large circular-ish chamber
    wall(50, 330, 300, 330),
    wall(50, 470, 300, 470),
    wall(50, 330, 50, 470),
    wall(300, 330, 300, 120),
    wall(300, 470, 300, 680),
    wall(300, 120, 900, 120),
    wall(300, 680, 900, 680),
    wall(900, 120, 900, 680),
  ],
};

// ── Level 9: L'Abisso ─────────────────────────────────────
const level9: CaveLevel = {
  name: "L'Abisso",
  subtitle: 'Il vuoto infinito',
  maxPulses: 6,
  playerStart: { x: 100, y: 400 },
  exit: { x: 1100, y: 400, radius: 22 },
  crystals: [
    { x: 400, y: 200, collected: false },
    { x: 800, y: 600, collected: false },
  ],
  hazards: [
    { x: 500, y: 400, radius: 16 },
    { x: 700, y: 300, radius: 16 },
    { x: 900, y: 500, radius: 16 },
  ],
  walls: [
    // Very sparse walls — mostly open void
    wall(50, 50, 1150, 50),
    wall(50, 750, 1150, 750),
    wall(50, 50, 50, 750),
    wall(1150, 50, 1150, 750),
    // A few internal pillars
    wall(300, 200, 350, 200),
    wall(350, 200, 350, 350),
    wall(600, 450, 600, 600),
    wall(600, 600, 650, 600),
    wall(900, 150, 950, 150),
    wall(950, 150, 950, 300),
  ],
};

// ── Level 10: La Via dell'Eco ─────────────────────────────
const level10: CaveLevel = {
  name: "La Via dell'Eco",
  subtitle: 'La sfida finale',
  maxPulses: 5,
  playerStart: { x: 100, y: 400 },
  exit: { x: 1080, y: 680, radius: 22 },
  crystals: [
    { x: 250, y: 200, collected: false },
    { x: 600, y: 150, collected: false },
    { x: 900, y: 300, collected: false },
    { x: 400, y: 600, collected: false },
  ],
  hazards: [
    { x: 350, y: 400, radius: 12 },
    { x: 550, y: 350, radius: 12 },
    { x: 750, y: 500, radius: 12 },
    { x: 950, y: 400, radius: 12 },
    { x: 850, y: 650, radius: 12 },
  ],
  walls: [
    // Outer
    wall(50, 50, 1150, 50),
    wall(50, 750, 1150, 750),
    wall(50, 50, 50, 750),
    wall(1150, 50, 1150, 750),
    // Chamber 1
    wall(50, 300, 250, 300),
    wall(250, 100, 250, 300),
    wall(250, 100, 450, 100),
    wall(450, 100, 450, 250),
    wall(250, 500, 250, 750),
    wall(250, 500, 50, 500),
    // Crystal corridor
    wall(450, 250, 700, 250, 'crystal'),
    wall(450, 250, 450, 450),
    wall(450, 450, 700, 450),
    wall(700, 250, 700, 450),
    // Water section
    wall(300, 550, 600, 550, 'water'),
    wall(300, 700, 600, 700, 'water'),
    wall(300, 550, 300, 700, 'water'),
    wall(600, 550, 600, 700, 'water'),
    // Right maze
    wall(700, 250, 900, 250),
    wall(900, 50, 900, 250),
    wall(700, 450, 700, 550),
    wall(700, 550, 900, 550),
    wall(900, 350, 900, 550),
    wall(900, 350, 1150, 350),
    wall(900, 550, 900, 620),
    wall(900, 620, 1050, 620),
    wall(1050, 620, 1050, 750),
  ],
};

import type { Crystal } from './types';

export const LEVELS: CaveLevel[] = [
  level1, level2, level3, level4, level5,
  level6, level7, level8, level9, level10,
];
