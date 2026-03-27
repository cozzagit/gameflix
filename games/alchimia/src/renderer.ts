import { GameState, Chapter, ElementDef } from './types';
import { ELEMENTS, getElement, CATEGORY_COLORS } from './elements';
import { drawParticles, drawSparkles } from './effects';

const W = 1200;
const H = 800;
const PANEL_W = 260;
const RIGHT_PANEL_W = 200;
const ORB_RADIUS = 28;
const GRID_COLS = 4;
const GRID_GAP = 8;
const GRID_CELL = (PANEL_W - 20) / GRID_COLS;
const WORKSPACE_X = 10;
const WORKSPACE_Y = 60;
const COMBINE_AREA_X = PANEL_W;
const COMBINE_AREA_W = W - PANEL_W - RIGHT_PANEL_W;

export const CHAPTERS: Chapter[] = [
  { id: 0, name: 'Cap. 1', subtitle: 'Gli Elementi', requiredDiscoveries: 10 },
  { id: 1, name: 'Cap. 2', subtitle: 'La Natura', requiredDiscoveries: 20 },
  { id: 2, name: 'Cap. 3', subtitle: 'La Materia', requiredDiscoveries: 35 },
  { id: 3, name: 'Cap. 4', subtitle: 'La Vita', requiredDiscoveries: 55 },
];

export function getChapterForDiscoveryCount(count: number): number {
  for (let i = CHAPTERS.length - 1; i >= 0; i--) {
    if (count >= CHAPTERS[i].requiredDiscoveries) return i;
  }
  return 0;
}

// Icon drawing functions
function drawElementIcon(ctx: CanvasRenderingContext2D, id: string, cx: number, cy: number, r: number): void {
  const s = r / 28; // scale factor
  ctx.save();
  ctx.translate(cx, cy);

  switch (id) {
    case 'terra': drawTerra(ctx, s); break;
    case 'acqua': drawAcqua(ctx, s); break;
    case 'fuoco': drawFuoco(ctx, s); break;
    case 'aria': drawAria(ctx, s); break;
    case 'fango': drawFango(ctx, s); break;
    case 'lava': drawLava(ctx, s); break;
    case 'polvere': drawPolvere(ctx, s); break;
    case 'vapore': drawVapore(ctx, s); break;
    case 'nuvola': drawNuvola(ctx, s); break;
    case 'energia': drawEnergia(ctx, s); break;
    case 'mare': drawMare(ctx, s); break;
    case 'sole': drawSole(ctx, s); break;
    case 'vento': drawVento(ctx, s); break;
    case 'pietra': drawPietra(ctx, s); break;
    case 'pioggia': drawPioggia(ctx, s); break;
    case 'fulmine': drawFulmine(ctx, s); break;
    case 'mattone': drawMattone(ctx, s); break;
    case 'pianta': drawPianta(ctx, s); break;
    case 'sabbia': drawSabbia(ctx, s); break;
    case 'metallo': drawMetallo(ctx, s); break;
    case 'arcobaleno': drawArcobaleno(ctx, s); break;
    case 'vita': drawVita(ctx, s); break;
    case 'albero': drawAlbero(ctx, s); break;
    case 'fiore': drawFiore(ctx, s); break;
    case 'vetro': drawVetro(ctx, s); break;
    case 'arma': drawArma(ctx, s); break;
    case 'ghiaccio': drawGhiaccio(ctx, s); break;
    case 'neve': drawNeve(ctx, s); break;
    case 'casa': drawCasa(ctx, s); break;
    case 'animale': drawAnimale(ctx, s); break;
    case 'foresta': drawForesta(ctx, s); break;
    case 'uomo': drawUomo(ctx, s); break;
    case 'civilta': drawCivilta(ctx, s); break;
    case 'conoscenza': drawConoscenza(ctx, s); break;
    case 'filosofia': drawFilosofia(ctx, s); break;
    case 'giardino': drawGiardino(ctx, s); break;
    case 'luna': drawLuna(ctx, s); break;
    case 'stella': drawStella(ctx, s); break;
    case 'onda': drawOnda(ctx, s); break;
    case 'deserto': drawDeserto(ctx, s); break;
    case 'cenere': drawCenere(ctx, s); break;
    case 'nebbia': drawNebbia(ctx, s); break;
    case 'freddo': drawFreddo(ctx, s); break;
    case 'muro': drawMuro(ctx, s); break;
    case 'tsunami': drawTsunami(ctx, s); break;
    case 'temporale': drawTemporale(ctx, s); break;
    case 'eruzione': drawEruzione(ctx, s); break;
    case 'cristallo': drawCristallo(ctx, s); break;
    case 'palude': drawPalude(ctx, s); break;
    case 'argilla': drawArgilla(ctx, s); break;
    case 'gemma': drawGemma(ctx, s); break;
    case 'valanga': drawValanga(ctx, s); break;
    case 'villaggio': drawVillaggio(ctx, s); break;
    case 'musica': drawMusica(ctx, s); break;
    case 'orologio': drawOrologio(ctx, s); break;
    case 'arte': drawArte(ctx, s); break;
    case 'alchimia': drawAlchimia(ctx, s); break;
    default: drawDefault(ctx, s); break;
  }

  ctx.restore();
}

function drawTerra(ctx: CanvasRenderingContext2D, s: number): void {
  // Brown mound
  ctx.fillStyle = '#6D4C21';
  ctx.beginPath();
  ctx.arc(0, 4 * s, 12 * s, Math.PI, 0);
  ctx.fill();
  // Green grass
  ctx.strokeStyle = '#4CAF50';
  ctx.lineWidth = 2 * s;
  ctx.beginPath();
  ctx.moveTo(-12 * s, 4 * s);
  ctx.quadraticCurveTo(-6 * s, -4 * s, 0, 4 * s);
  ctx.quadraticCurveTo(6 * s, -4 * s, 12 * s, 4 * s);
  ctx.stroke();
}

function drawAcqua(ctx: CanvasRenderingContext2D, s: number): void {
  ctx.fillStyle = '#42A5F5';
  ctx.beginPath();
  ctx.moveTo(0, -12 * s);
  ctx.quadraticCurveTo(12 * s, 4 * s, 0, 14 * s);
  ctx.quadraticCurveTo(-12 * s, 4 * s, 0, -12 * s);
  ctx.fill();
  // Shine
  ctx.fillStyle = 'rgba(255,255,255,0.4)';
  ctx.beginPath();
  ctx.ellipse(-3 * s, -2 * s, 2 * s, 5 * s, -0.3, 0, Math.PI * 2);
  ctx.fill();
}

function drawFuoco(ctx: CanvasRenderingContext2D, s: number): void {
  // Outer flame
  ctx.fillStyle = '#FF5722';
  ctx.beginPath();
  ctx.moveTo(0, -14 * s);
  ctx.quadraticCurveTo(10 * s, -4 * s, 8 * s, 8 * s);
  ctx.quadraticCurveTo(4 * s, 14 * s, 0, 12 * s);
  ctx.quadraticCurveTo(-4 * s, 14 * s, -8 * s, 8 * s);
  ctx.quadraticCurveTo(-10 * s, -4 * s, 0, -14 * s);
  ctx.fill();
  // Inner flame
  ctx.fillStyle = '#FFB74D';
  ctx.beginPath();
  ctx.moveTo(0, -6 * s);
  ctx.quadraticCurveTo(5 * s, 2 * s, 4 * s, 8 * s);
  ctx.quadraticCurveTo(0, 12 * s, -4 * s, 8 * s);
  ctx.quadraticCurveTo(-5 * s, 2 * s, 0, -6 * s);
  ctx.fill();
}

function drawAria(ctx: CanvasRenderingContext2D, s: number): void {
  ctx.strokeStyle = 'rgba(255,255,255,0.7)';
  ctx.lineWidth = 2 * s;
  ctx.lineCap = 'round';
  for (let i = 0; i < 3; i++) {
    const y = -6 * s + i * 6 * s;
    ctx.beginPath();
    ctx.moveTo(-10 * s, y);
    ctx.quadraticCurveTo(-3 * s, y - 5 * s, 3 * s, y);
    ctx.quadraticCurveTo(8 * s, y + 4 * s, 10 * s, y);
    ctx.stroke();
  }
}

function drawFango(ctx: CanvasRenderingContext2D, s: number): void {
  ctx.fillStyle = '#5D4037';
  ctx.beginPath();
  ctx.ellipse(0, 2 * s, 12 * s, 8 * s, 0, 0, Math.PI * 2);
  ctx.fill();
  // Bubbles
  ctx.fillStyle = '#795548';
  ctx.beginPath(); ctx.arc(-4 * s, -2 * s, 3 * s, 0, Math.PI * 2); ctx.fill();
  ctx.beginPath(); ctx.arc(5 * s, 0, 2 * s, 0, Math.PI * 2); ctx.fill();
}

function drawLava(ctx: CanvasRenderingContext2D, s: number): void {
  ctx.fillStyle = '#E65100';
  ctx.beginPath();
  ctx.ellipse(0, 2 * s, 12 * s, 8 * s, 0, 0, Math.PI * 2);
  ctx.fill();
  ctx.fillStyle = '#FFAB00';
  ctx.beginPath();
  ctx.moveTo(-4 * s, -4 * s);
  ctx.quadraticCurveTo(0, -10 * s, 2 * s, -4 * s);
  ctx.fill();
}

function drawPolvere(ctx: CanvasRenderingContext2D, s: number): void {
  ctx.fillStyle = '#BCAAA4';
  const dots = [[-6, -4], [0, -6], [6, -2], [-3, 3], [4, 5], [-7, 1], [7, -5], [1, 6]];
  for (const [dx, dy] of dots) {
    ctx.beginPath();
    ctx.arc(dx * s, dy * s, 2 * s, 0, Math.PI * 2);
    ctx.fill();
  }
}

function drawVapore(ctx: CanvasRenderingContext2D, s: number): void {
  ctx.fillStyle = 'rgba(200,230,255,0.5)';
  ctx.beginPath(); ctx.arc(-4 * s, 4 * s, 6 * s, 0, Math.PI * 2); ctx.fill();
  ctx.beginPath(); ctx.arc(4 * s, 2 * s, 5 * s, 0, Math.PI * 2); ctx.fill();
  ctx.beginPath(); ctx.arc(0, -4 * s, 4 * s, 0, Math.PI * 2); ctx.fill();
}

function drawNuvola(ctx: CanvasRenderingContext2D, s: number): void {
  ctx.fillStyle = '#CFD8DC';
  ctx.beginPath(); ctx.arc(-5 * s, 2 * s, 7 * s, 0, Math.PI * 2); ctx.fill();
  ctx.beginPath(); ctx.arc(5 * s, 2 * s, 6 * s, 0, Math.PI * 2); ctx.fill();
  ctx.beginPath(); ctx.arc(0, -3 * s, 7 * s, 0, Math.PI * 2); ctx.fill();
}

function drawEnergia(ctx: CanvasRenderingContext2D, s: number): void {
  ctx.fillStyle = '#FFD600';
  ctx.beginPath();
  ctx.moveTo(2 * s, -12 * s);
  ctx.lineTo(-6 * s, 2 * s);
  ctx.lineTo(-1 * s, 2 * s);
  ctx.lineTo(-4 * s, 12 * s);
  ctx.lineTo(6 * s, -2 * s);
  ctx.lineTo(1 * s, -2 * s);
  ctx.closePath();
  ctx.fill();
}

function drawMare(ctx: CanvasRenderingContext2D, s: number): void {
  ctx.fillStyle = '#0D47A1';
  ctx.beginPath();
  ctx.ellipse(0, 2 * s, 14 * s, 8 * s, 0, 0, Math.PI * 2);
  ctx.fill();
  ctx.strokeStyle = '#42A5F5';
  ctx.lineWidth = 1.5 * s;
  for (let i = 0; i < 3; i++) {
    const y = -2 * s + i * 4 * s;
    ctx.beginPath();
    ctx.moveTo(-8 * s, y);
    ctx.quadraticCurveTo(-4 * s, y - 3 * s, 0, y);
    ctx.quadraticCurveTo(4 * s, y + 3 * s, 8 * s, y);
    ctx.stroke();
  }
}

function drawSole(ctx: CanvasRenderingContext2D, s: number): void {
  // Rays
  ctx.strokeStyle = '#FFD54F';
  ctx.lineWidth = 2 * s;
  for (let i = 0; i < 8; i++) {
    const a = (Math.PI * 2 * i) / 8;
    ctx.beginPath();
    ctx.moveTo(Math.cos(a) * 7 * s, Math.sin(a) * 7 * s);
    ctx.lineTo(Math.cos(a) * 13 * s, Math.sin(a) * 13 * s);
    ctx.stroke();
  }
  ctx.fillStyle = '#FFB300';
  ctx.beginPath();
  ctx.arc(0, 0, 7 * s, 0, Math.PI * 2);
  ctx.fill();
}

function drawVento(ctx: CanvasRenderingContext2D, s: number): void {
  ctx.strokeStyle = '#90CAF9';
  ctx.lineWidth = 2.5 * s;
  ctx.lineCap = 'round';
  ctx.beginPath();
  ctx.moveTo(-12 * s, -4 * s);
  ctx.quadraticCurveTo(0, -12 * s, 10 * s, -4 * s);
  ctx.stroke();
  ctx.beginPath();
  ctx.moveTo(-10 * s, 3 * s);
  ctx.quadraticCurveTo(2 * s, -4 * s, 12 * s, 3 * s);
  ctx.stroke();
}

function drawPietra(ctx: CanvasRenderingContext2D, s: number): void {
  ctx.fillStyle = '#78909C';
  ctx.beginPath();
  ctx.moveTo(-8 * s, 6 * s);
  ctx.lineTo(-10 * s, -2 * s);
  ctx.lineTo(-4 * s, -8 * s);
  ctx.lineTo(5 * s, -7 * s);
  ctx.lineTo(10 * s, 0);
  ctx.lineTo(7 * s, 7 * s);
  ctx.closePath();
  ctx.fill();
  ctx.fillStyle = '#90A4AE';
  ctx.beginPath();
  ctx.moveTo(-4 * s, -8 * s);
  ctx.lineTo(5 * s, -7 * s);
  ctx.lineTo(2 * s, 0);
  ctx.lineTo(-6 * s, -1 * s);
  ctx.closePath();
  ctx.fill();
}

function drawPioggia(ctx: CanvasRenderingContext2D, s: number): void {
  // Cloud
  ctx.fillStyle = '#78909C';
  ctx.beginPath(); ctx.arc(-3 * s, -6 * s, 5 * s, 0, Math.PI * 2); ctx.fill();
  ctx.beginPath(); ctx.arc(4 * s, -5 * s, 4 * s, 0, Math.PI * 2); ctx.fill();
  // Drops
  ctx.fillStyle = '#42A5F5';
  for (const [dx, dy] of [[-5, 3], [0, 5], [5, 2]]) {
    ctx.beginPath();
    ctx.moveTo(dx * s, (dy - 3) * s);
    ctx.quadraticCurveTo((dx + 2) * s, (dy + 2) * s, dx * s, (dy + 4) * s);
    ctx.quadraticCurveTo((dx - 2) * s, (dy + 2) * s, dx * s, (dy - 3) * s);
    ctx.fill();
  }
}

function drawFulmine(ctx: CanvasRenderingContext2D, s: number): void {
  ctx.fillStyle = '#FFEA00';
  ctx.beginPath();
  ctx.moveTo(3 * s, -14 * s);
  ctx.lineTo(-7 * s, 0);
  ctx.lineTo(-1 * s, 0);
  ctx.lineTo(-5 * s, 14 * s);
  ctx.lineTo(8 * s, 0);
  ctx.lineTo(2 * s, 0);
  ctx.closePath();
  ctx.fill();
}

function drawMattone(ctx: CanvasRenderingContext2D, s: number): void {
  ctx.fillStyle = '#BF360C';
  ctx.fillRect(-10 * s, -6 * s, 20 * s, 12 * s);
  ctx.strokeStyle = '#8D6E63';
  ctx.lineWidth = 1.5 * s;
  ctx.strokeRect(-10 * s, -6 * s, 20 * s, 12 * s);
  ctx.beginPath();
  ctx.moveTo(-10 * s, 0);
  ctx.lineTo(10 * s, 0);
  ctx.stroke();
  ctx.beginPath();
  ctx.moveTo(0, -6 * s);
  ctx.lineTo(0, 0);
  ctx.stroke();
  ctx.beginPath();
  ctx.moveTo(-5 * s, 0);
  ctx.lineTo(-5 * s, 6 * s);
  ctx.stroke();
}

function drawPianta(ctx: CanvasRenderingContext2D, s: number): void {
  ctx.strokeStyle = '#388E3C';
  ctx.lineWidth = 2.5 * s;
  ctx.beginPath();
  ctx.moveTo(0, 10 * s);
  ctx.lineTo(0, -2 * s);
  ctx.stroke();
  // Leaves
  ctx.fillStyle = '#66BB6A';
  ctx.beginPath();
  ctx.ellipse(-5 * s, -4 * s, 6 * s, 3 * s, -0.5, 0, Math.PI * 2);
  ctx.fill();
  ctx.beginPath();
  ctx.ellipse(5 * s, -7 * s, 6 * s, 3 * s, 0.5, 0, Math.PI * 2);
  ctx.fill();
}

function drawSabbia(ctx: CanvasRenderingContext2D, s: number): void {
  ctx.fillStyle = '#FFE082';
  ctx.beginPath();
  ctx.moveTo(-12 * s, 6 * s);
  ctx.quadraticCurveTo(-6 * s, -2 * s, 0, 2 * s);
  ctx.quadraticCurveTo(6 * s, -2 * s, 12 * s, 6 * s);
  ctx.closePath();
  ctx.fill();
  // Dots
  ctx.fillStyle = '#FFC107';
  for (const [dx, dy] of [[-4, 3], [2, 1], [6, 4], [-7, 5]]) {
    ctx.beginPath();
    ctx.arc(dx * s, dy * s, 1 * s, 0, Math.PI * 2);
    ctx.fill();
  }
}

function drawMetallo(ctx: CanvasRenderingContext2D, s: number): void {
  const grad = ctx.createLinearGradient(-8 * s, -8 * s, 8 * s, 8 * s);
  grad.addColorStop(0, '#90A4AE');
  grad.addColorStop(0.5, '#CFD8DC');
  grad.addColorStop(1, '#607D8B');
  ctx.fillStyle = grad;
  ctx.fillRect(-8 * s, -8 * s, 16 * s, 16 * s);
  ctx.strokeStyle = '#455A64';
  ctx.lineWidth = 1.5 * s;
  ctx.strokeRect(-8 * s, -8 * s, 16 * s, 16 * s);
}

function drawArcobaleno(ctx: CanvasRenderingContext2D, s: number): void {
  const colors = ['#F44336', '#FF9800', '#FFEB3B', '#4CAF50', '#2196F3', '#9C27B0'];
  for (let i = 0; i < colors.length; i++) {
    ctx.strokeStyle = colors[i];
    ctx.lineWidth = 1.8 * s;
    ctx.beginPath();
    ctx.arc(0, 6 * s, (12 - i * 1.5) * s, Math.PI, 0);
    ctx.stroke();
  }
}

function drawVita(ctx: CanvasRenderingContext2D, s: number): void {
  ctx.fillStyle = '#E91E63';
  // Heart
  ctx.beginPath();
  ctx.moveTo(0, 4 * s);
  ctx.bezierCurveTo(-10 * s, -6 * s, -12 * s, -10 * s, 0, -4 * s);
  ctx.bezierCurveTo(12 * s, -10 * s, 10 * s, -6 * s, 0, 4 * s);
  ctx.fill();
  // Glow
  ctx.fillStyle = '#F48FB1';
  ctx.beginPath();
  ctx.arc(-3 * s, -4 * s, 2 * s, 0, Math.PI * 2);
  ctx.fill();
}

function drawAlbero(ctx: CanvasRenderingContext2D, s: number): void {
  ctx.fillStyle = '#5D4037';
  ctx.fillRect(-2 * s, 2 * s, 4 * s, 10 * s);
  ctx.fillStyle = '#2E7D32';
  ctx.beginPath();
  ctx.moveTo(0, -12 * s);
  ctx.lineTo(-10 * s, 4 * s);
  ctx.lineTo(10 * s, 4 * s);
  ctx.closePath();
  ctx.fill();
}

function drawFiore(ctx: CanvasRenderingContext2D, s: number): void {
  ctx.strokeStyle = '#388E3C';
  ctx.lineWidth = 2 * s;
  ctx.beginPath();
  ctx.moveTo(0, 12 * s);
  ctx.lineTo(0, 0);
  ctx.stroke();
  const petalColors = ['#EC407A', '#F48FB1', '#EC407A', '#F48FB1', '#EC407A'];
  for (let i = 0; i < 5; i++) {
    const a = (Math.PI * 2 * i) / 5 - Math.PI / 2;
    ctx.fillStyle = petalColors[i];
    ctx.beginPath();
    ctx.ellipse(Math.cos(a) * 5 * s, Math.sin(a) * 5 * s - 3 * s, 4 * s, 3 * s, a, 0, Math.PI * 2);
    ctx.fill();
  }
  ctx.fillStyle = '#FFC107';
  ctx.beginPath();
  ctx.arc(0, -3 * s, 3 * s, 0, Math.PI * 2);
  ctx.fill();
}

function drawVetro(ctx: CanvasRenderingContext2D, s: number): void {
  ctx.fillStyle = 'rgba(128,203,196,0.4)';
  ctx.fillRect(-7 * s, -9 * s, 14 * s, 18 * s);
  ctx.strokeStyle = '#80CBC4';
  ctx.lineWidth = 1.5 * s;
  ctx.strokeRect(-7 * s, -9 * s, 14 * s, 18 * s);
  ctx.strokeStyle = 'rgba(255,255,255,0.5)';
  ctx.beginPath();
  ctx.moveTo(-4 * s, -6 * s);
  ctx.lineTo(-4 * s, 2 * s);
  ctx.stroke();
}

function drawArma(ctx: CanvasRenderingContext2D, s: number): void {
  ctx.strokeStyle = '#78909C';
  ctx.lineWidth = 3 * s;
  ctx.lineCap = 'round';
  ctx.beginPath();
  ctx.moveTo(0, -12 * s);
  ctx.lineTo(0, 10 * s);
  ctx.stroke();
  ctx.beginPath();
  ctx.moveTo(-6 * s, 6 * s);
  ctx.lineTo(6 * s, 6 * s);
  ctx.stroke();
  ctx.fillStyle = '#B0BEC5';
  ctx.beginPath();
  ctx.moveTo(-3 * s, -12 * s);
  ctx.lineTo(0, -14 * s);
  ctx.lineTo(3 * s, -12 * s);
  ctx.closePath();
  ctx.fill();
}

function drawGhiaccio(ctx: CanvasRenderingContext2D, s: number): void {
  ctx.fillStyle = 'rgba(179,229,252,0.6)';
  ctx.beginPath();
  ctx.moveTo(0, -10 * s);
  ctx.lineTo(-8 * s, -3 * s);
  ctx.lineTo(-8 * s, 5 * s);
  ctx.lineTo(0, 10 * s);
  ctx.lineTo(8 * s, 5 * s);
  ctx.lineTo(8 * s, -3 * s);
  ctx.closePath();
  ctx.fill();
  ctx.strokeStyle = '#B3E5FC';
  ctx.lineWidth = 1.5 * s;
  ctx.stroke();
}

function drawNeve(ctx: CanvasRenderingContext2D, s: number): void {
  ctx.strokeStyle = '#FAFAFA';
  ctx.lineWidth = 2 * s;
  ctx.lineCap = 'round';
  for (let i = 0; i < 6; i++) {
    const a = (Math.PI * 2 * i) / 6;
    ctx.beginPath();
    ctx.moveTo(0, 0);
    ctx.lineTo(Math.cos(a) * 10 * s, Math.sin(a) * 10 * s);
    ctx.stroke();
    // Branch
    const mx = Math.cos(a) * 6 * s;
    const my = Math.sin(a) * 6 * s;
    ctx.beginPath();
    ctx.moveTo(mx, my);
    ctx.lineTo(mx + Math.cos(a + 0.8) * 3 * s, my + Math.sin(a + 0.8) * 3 * s);
    ctx.stroke();
  }
}

function drawCasa(ctx: CanvasRenderingContext2D, s: number): void {
  // Roof
  ctx.fillStyle = '#BF360C';
  ctx.beginPath();
  ctx.moveTo(0, -12 * s);
  ctx.lineTo(-12 * s, -2 * s);
  ctx.lineTo(12 * s, -2 * s);
  ctx.closePath();
  ctx.fill();
  // Wall
  ctx.fillStyle = '#BCAAA4';
  ctx.fillRect(-9 * s, -2 * s, 18 * s, 13 * s);
  // Door
  ctx.fillStyle = '#5D4037';
  ctx.fillRect(-3 * s, 3 * s, 6 * s, 8 * s);
  // Window
  ctx.fillStyle = '#FFF9C4';
  ctx.fillRect(4 * s, 0, 4 * s, 4 * s);
}

function drawAnimale(ctx: CanvasRenderingContext2D, s: number): void {
  // Body
  ctx.fillStyle = '#FF8A65';
  ctx.beginPath();
  ctx.ellipse(0, 2 * s, 10 * s, 6 * s, 0, 0, Math.PI * 2);
  ctx.fill();
  // Head
  ctx.beginPath();
  ctx.arc(-8 * s, -4 * s, 5 * s, 0, Math.PI * 2);
  ctx.fill();
  // Eye
  ctx.fillStyle = '#333';
  ctx.beginPath();
  ctx.arc(-9 * s, -5 * s, 1.5 * s, 0, Math.PI * 2);
  ctx.fill();
  // Legs
  ctx.strokeStyle = '#FF8A65';
  ctx.lineWidth = 2 * s;
  for (const dx of [-5, -2, 2, 5]) {
    ctx.beginPath();
    ctx.moveTo(dx * s, 7 * s);
    ctx.lineTo(dx * s, 12 * s);
    ctx.stroke();
  }
}

function drawForesta(ctx: CanvasRenderingContext2D, s: number): void {
  for (const [dx, dy, sc] of [[-6, 2, 0.7], [6, 2, 0.7], [0, -2, 0.9]]) {
    ctx.fillStyle = '#5D4037';
    ctx.fillRect((dx - 1) * s, (dy + 2) * s, 2 * sc * s, 6 * sc * s);
    ctx.fillStyle = '#1B5E20';
    ctx.beginPath();
    ctx.moveTo(dx * s, (dy - 8 * sc) * s);
    ctx.lineTo((dx - 6 * sc) * s, (dy + 2) * s);
    ctx.lineTo((dx + 6 * sc) * s, (dy + 2) * s);
    ctx.closePath();
    ctx.fill();
  }
}

function drawUomo(ctx: CanvasRenderingContext2D, s: number): void {
  // Head
  ctx.fillStyle = '#FFB74D';
  ctx.beginPath();
  ctx.arc(0, -8 * s, 5 * s, 0, Math.PI * 2);
  ctx.fill();
  // Body
  ctx.strokeStyle = '#FFC107';
  ctx.lineWidth = 2.5 * s;
  ctx.beginPath();
  ctx.moveTo(0, -3 * s);
  ctx.lineTo(0, 6 * s);
  ctx.stroke();
  // Arms
  ctx.beginPath();
  ctx.moveTo(-7 * s, 1 * s);
  ctx.lineTo(7 * s, 1 * s);
  ctx.stroke();
  // Legs
  ctx.beginPath();
  ctx.moveTo(0, 6 * s);
  ctx.lineTo(-5 * s, 13 * s);
  ctx.moveTo(0, 6 * s);
  ctx.lineTo(5 * s, 13 * s);
  ctx.stroke();
}

function drawCivilta(ctx: CanvasRenderingContext2D, s: number): void {
  // Temple columns
  ctx.fillStyle = '#FFB300';
  ctx.fillRect(-10 * s, -4 * s, 3 * s, 14 * s);
  ctx.fillRect(-3 * s, -4 * s, 3 * s, 14 * s);
  ctx.fillRect(4 * s, -4 * s, 3 * s, 14 * s);
  // Roof
  ctx.beginPath();
  ctx.moveTo(-13 * s, -4 * s);
  ctx.lineTo(0, -12 * s);
  ctx.lineTo(10 * s, -4 * s);
  ctx.closePath();
  ctx.fill();
  // Base
  ctx.fillRect(-12 * s, 10 * s, 21 * s, 2 * s);
}

function drawConoscenza(ctx: CanvasRenderingContext2D, s: number): void {
  // Book
  ctx.fillStyle = '#7E57C2';
  ctx.fillRect(-8 * s, -7 * s, 16 * s, 14 * s);
  ctx.fillStyle = '#B39DDB';
  ctx.fillRect(-6 * s, -5 * s, 12 * s, 10 * s);
  // Lines
  ctx.strokeStyle = '#7E57C2';
  ctx.lineWidth = 1 * s;
  for (let i = 0; i < 3; i++) {
    ctx.beginPath();
    ctx.moveTo(-4 * s, (-2 + i * 3) * s);
    ctx.lineTo(4 * s, (-2 + i * 3) * s);
    ctx.stroke();
  }
  // Star on cover
  ctx.fillStyle = '#FFD54F';
  ctx.beginPath();
  ctx.arc(0, -8 * s, 2 * s, 0, Math.PI * 2);
  ctx.fill();
}

function drawFilosofia(ctx: CanvasRenderingContext2D, s: number): void {
  // Eye of wisdom
  ctx.strokeStyle = '#CE93D8';
  ctx.lineWidth = 2 * s;
  ctx.beginPath();
  ctx.moveTo(-12 * s, 0);
  ctx.quadraticCurveTo(0, -10 * s, 12 * s, 0);
  ctx.quadraticCurveTo(0, 10 * s, -12 * s, 0);
  ctx.stroke();
  ctx.fillStyle = '#9C27B0';
  ctx.beginPath();
  ctx.arc(0, 0, 4 * s, 0, Math.PI * 2);
  ctx.fill();
  ctx.fillStyle = '#FFFFFF';
  ctx.beginPath();
  ctx.arc(-1 * s, -1 * s, 1.5 * s, 0, Math.PI * 2);
  ctx.fill();
}

function drawGiardino(ctx: CanvasRenderingContext2D, s: number): void {
  // Ground
  ctx.fillStyle = '#5D4037';
  ctx.fillRect(-12 * s, 6 * s, 24 * s, 4 * s);
  // Flowers
  for (const [dx, col] of [[-6, '#EC407A'], [0, '#FFEB3B'], [6, '#E040FB']] as [number, string][]) {
    ctx.strokeStyle = '#388E3C';
    ctx.lineWidth = 1.5 * s;
    ctx.beginPath();
    ctx.moveTo(dx * s, 6 * s);
    ctx.lineTo(dx * s, -2 * s);
    ctx.stroke();
    ctx.fillStyle = col;
    ctx.beginPath();
    ctx.arc(dx * s, -4 * s, 3 * s, 0, Math.PI * 2);
    ctx.fill();
  }
}

function drawLuna(ctx: CanvasRenderingContext2D, s: number): void {
  ctx.fillStyle = '#CFD8DC';
  ctx.beginPath();
  ctx.arc(0, 0, 10 * s, 0, Math.PI * 2);
  ctx.fill();
  ctx.fillStyle = '#12081e';
  ctx.beginPath();
  ctx.arc(4 * s, -3 * s, 8 * s, 0, Math.PI * 2);
  ctx.fill();
}

function drawStella(ctx: CanvasRenderingContext2D, s: number): void {
  ctx.fillStyle = '#FFF9C4';
  ctx.beginPath();
  for (let i = 0; i < 5; i++) {
    const a = (Math.PI * 2 * i) / 5 - Math.PI / 2;
    const a2 = a + Math.PI / 5;
    ctx.lineTo(Math.cos(a) * 10 * s, Math.sin(a) * 10 * s);
    ctx.lineTo(Math.cos(a2) * 4 * s, Math.sin(a2) * 4 * s);
  }
  ctx.closePath();
  ctx.fill();
}

function drawOnda(ctx: CanvasRenderingContext2D, s: number): void {
  ctx.fillStyle = '#039BE5';
  ctx.beginPath();
  ctx.moveTo(-12 * s, 4 * s);
  ctx.quadraticCurveTo(-6 * s, -8 * s, 0, 0);
  ctx.quadraticCurveTo(6 * s, 8 * s, 12 * s, -2 * s);
  ctx.lineTo(12 * s, 8 * s);
  ctx.lineTo(-12 * s, 8 * s);
  ctx.closePath();
  ctx.fill();
}

function drawDeserto(ctx: CanvasRenderingContext2D, s: number): void {
  ctx.fillStyle = '#F9A825';
  ctx.beginPath();
  ctx.moveTo(-14 * s, 8 * s);
  ctx.quadraticCurveTo(-7 * s, -4 * s, 0, 4 * s);
  ctx.quadraticCurveTo(7 * s, -6 * s, 14 * s, 6 * s);
  ctx.lineTo(14 * s, 10 * s);
  ctx.lineTo(-14 * s, 10 * s);
  ctx.closePath();
  ctx.fill();
  // Sun
  ctx.fillStyle = '#FFD54F';
  ctx.beginPath();
  ctx.arc(6 * s, -6 * s, 3 * s, 0, Math.PI * 2);
  ctx.fill();
}

function drawCenere(ctx: CanvasRenderingContext2D, s: number): void {
  ctx.fillStyle = '#9E9E9E';
  ctx.beginPath();
  ctx.ellipse(0, 4 * s, 10 * s, 5 * s, 0, 0, Math.PI * 2);
  ctx.fill();
  // Wisps
  ctx.strokeStyle = '#BDBDBD';
  ctx.lineWidth = 1 * s;
  for (const dx of [-3, 2]) {
    ctx.beginPath();
    ctx.moveTo(dx * s, 0);
    ctx.quadraticCurveTo((dx + 2) * s, -6 * s, dx * s, -10 * s);
    ctx.stroke();
  }
}

function drawNebbia(ctx: CanvasRenderingContext2D, s: number): void {
  ctx.globalAlpha = 0.4;
  ctx.fillStyle = '#B0BEC5';
  for (let i = 0; i < 4; i++) {
    ctx.beginPath();
    ctx.ellipse((i * 5 - 8) * s, (i * 3 - 4) * s, 8 * s, 3 * s, 0, 0, Math.PI * 2);
    ctx.fill();
  }
  ctx.globalAlpha = 1;
}

function drawFreddo(ctx: CanvasRenderingContext2D, s: number): void {
  ctx.strokeStyle = '#80DEEA';
  ctx.lineWidth = 2 * s;
  // Snowflake-like
  for (let i = 0; i < 4; i++) {
    const a = (Math.PI * 2 * i) / 4 + Math.PI / 4;
    ctx.beginPath();
    ctx.moveTo(0, 0);
    ctx.lineTo(Math.cos(a) * 10 * s, Math.sin(a) * 10 * s);
    ctx.stroke();
  }
  ctx.fillStyle = '#B2EBF2';
  ctx.beginPath();
  ctx.arc(0, 0, 3 * s, 0, Math.PI * 2);
  ctx.fill();
}

function drawMuro(ctx: CanvasRenderingContext2D, s: number): void {
  ctx.fillStyle = '#8D6E63';
  ctx.fillRect(-10 * s, -8 * s, 20 * s, 16 * s);
  ctx.strokeStyle = '#A1887F';
  ctx.lineWidth = 1 * s;
  // Brick pattern
  for (let row = 0; row < 4; row++) {
    const y = -8 * s + row * 4 * s;
    ctx.strokeRect(-10 * s, y, 10 * s, 4 * s);
    ctx.strokeRect(0, y, 10 * s, 4 * s);
    if (row % 2 === 1) {
      ctx.strokeRect(-5 * s, y, 10 * s, 4 * s);
    }
  }
}

function drawTsunami(ctx: CanvasRenderingContext2D, s: number): void {
  ctx.fillStyle = '#01579B';
  ctx.beginPath();
  ctx.moveTo(-12 * s, 8 * s);
  ctx.quadraticCurveTo(-8 * s, -12 * s, 4 * s, -8 * s);
  ctx.quadraticCurveTo(10 * s, -6 * s, 10 * s, 0);
  ctx.quadraticCurveTo(8 * s, -2 * s, 6 * s, 4 * s);
  ctx.lineTo(12 * s, 8 * s);
  ctx.closePath();
  ctx.fill();
  // Foam
  ctx.fillStyle = '#E3F2FD';
  ctx.beginPath();
  ctx.arc(4 * s, -8 * s, 2 * s, 0, Math.PI * 2);
  ctx.fill();
}

function drawTemporale(ctx: CanvasRenderingContext2D, s: number): void {
  // Dark cloud
  ctx.fillStyle = '#37474F';
  ctx.beginPath(); ctx.arc(-4 * s, -6 * s, 7 * s, 0, Math.PI * 2); ctx.fill();
  ctx.beginPath(); ctx.arc(5 * s, -5 * s, 5 * s, 0, Math.PI * 2); ctx.fill();
  // Lightning
  ctx.fillStyle = '#FFEA00';
  ctx.beginPath();
  ctx.moveTo(1 * s, -2 * s);
  ctx.lineTo(-3 * s, 5 * s);
  ctx.lineTo(0, 5 * s);
  ctx.lineTo(-2 * s, 12 * s);
  ctx.lineTo(4 * s, 3 * s);
  ctx.lineTo(1 * s, 3 * s);
  ctx.closePath();
  ctx.fill();
}

function drawEruzione(ctx: CanvasRenderingContext2D, s: number): void {
  // Mountain
  ctx.fillStyle = '#5D4037';
  ctx.beginPath();
  ctx.moveTo(-12 * s, 10 * s);
  ctx.lineTo(-3 * s, -4 * s);
  ctx.lineTo(3 * s, -4 * s);
  ctx.lineTo(12 * s, 10 * s);
  ctx.closePath();
  ctx.fill();
  // Lava
  ctx.fillStyle = '#FF6D00';
  ctx.beginPath();
  ctx.moveTo(-3 * s, -4 * s);
  ctx.quadraticCurveTo(-1 * s, -12 * s, 0, -10 * s);
  ctx.quadraticCurveTo(1 * s, -14 * s, 3 * s, -4 * s);
  ctx.closePath();
  ctx.fill();
  // Glow
  ctx.fillStyle = '#FFAB00';
  ctx.beginPath();
  ctx.arc(0, -6 * s, 2 * s, 0, Math.PI * 2);
  ctx.fill();
}

function drawCristallo(ctx: CanvasRenderingContext2D, s: number): void {
  ctx.fillStyle = 'rgba(206,147,216,0.5)';
  ctx.beginPath();
  ctx.moveTo(0, -12 * s);
  ctx.lineTo(6 * s, -3 * s);
  ctx.lineTo(6 * s, 6 * s);
  ctx.lineTo(0, 12 * s);
  ctx.lineTo(-6 * s, 6 * s);
  ctx.lineTo(-6 * s, -3 * s);
  ctx.closePath();
  ctx.fill();
  ctx.strokeStyle = '#CE93D8';
  ctx.lineWidth = 1.5 * s;
  ctx.stroke();
}

function drawPalude(ctx: CanvasRenderingContext2D, s: number): void {
  ctx.fillStyle = '#33691E';
  ctx.beginPath();
  ctx.ellipse(0, 4 * s, 12 * s, 6 * s, 0, 0, Math.PI * 2);
  ctx.fill();
  // Reeds
  ctx.strokeStyle = '#558B2F';
  ctx.lineWidth = 1.5 * s;
  for (const dx of [-5, 0, 6]) {
    ctx.beginPath();
    ctx.moveTo(dx * s, 2 * s);
    ctx.lineTo(dx * s, -8 * s);
    ctx.stroke();
    ctx.fillStyle = '#7CB342';
    ctx.beginPath();
    ctx.ellipse(dx * s, -9 * s, 1.5 * s, 2.5 * s, 0, 0, Math.PI * 2);
    ctx.fill();
  }
}

function drawArgilla(ctx: CanvasRenderingContext2D, s: number): void {
  ctx.fillStyle = '#D84315';
  ctx.beginPath();
  ctx.ellipse(0, 2 * s, 10 * s, 8 * s, 0, 0, Math.PI * 2);
  ctx.fill();
  // Wet shine
  ctx.fillStyle = 'rgba(255,255,255,0.2)';
  ctx.beginPath();
  ctx.ellipse(-3 * s, -1 * s, 4 * s, 2 * s, -0.3, 0, Math.PI * 2);
  ctx.fill();
}

function drawGemma(ctx: CanvasRenderingContext2D, s: number): void {
  ctx.fillStyle = '#AB47BC';
  // Diamond shape
  ctx.beginPath();
  ctx.moveTo(0, -10 * s);
  ctx.lineTo(8 * s, -2 * s);
  ctx.lineTo(0, 10 * s);
  ctx.lineTo(-8 * s, -2 * s);
  ctx.closePath();
  ctx.fill();
  // Facet
  ctx.fillStyle = '#CE93D8';
  ctx.beginPath();
  ctx.moveTo(0, -10 * s);
  ctx.lineTo(4 * s, -2 * s);
  ctx.lineTo(0, 2 * s);
  ctx.lineTo(-4 * s, -2 * s);
  ctx.closePath();
  ctx.fill();
}

function drawValanga(ctx: CanvasRenderingContext2D, s: number): void {
  ctx.fillStyle = '#FAFAFA';
  ctx.beginPath();
  ctx.moveTo(0, -10 * s);
  ctx.lineTo(-12 * s, 8 * s);
  ctx.lineTo(12 * s, 8 * s);
  ctx.closePath();
  ctx.fill();
  // Snow chunks
  ctx.fillStyle = '#E0E0E0';
  ctx.beginPath(); ctx.arc(-4 * s, 4 * s, 3 * s, 0, Math.PI * 2); ctx.fill();
  ctx.beginPath(); ctx.arc(3 * s, 2 * s, 2 * s, 0, Math.PI * 2); ctx.fill();
}

function drawVillaggio(ctx: CanvasRenderingContext2D, s: number): void {
  // Multiple small houses
  for (const [dx, sz] of [[-7, 0.6], [0, 0.7], [7, 0.55]] as [number, number][]) {
    const x = dx * s;
    ctx.fillStyle = '#BF360C';
    ctx.beginPath();
    ctx.moveTo(x, (-8 * sz) * s);
    ctx.lineTo(x - 6 * sz * s, (-2 * sz) * s);
    ctx.lineTo(x + 6 * sz * s, (-2 * sz) * s);
    ctx.closePath();
    ctx.fill();
    ctx.fillStyle = '#BCAAA4';
    ctx.fillRect(x - 5 * sz * s, (-2 * sz) * s, 10 * sz * s, 10 * sz * s);
  }
}

function drawMusica(ctx: CanvasRenderingContext2D, s: number): void {
  ctx.fillStyle = '#F06292';
  // Notes
  ctx.beginPath();
  ctx.arc(-4 * s, 4 * s, 3 * s, 0, Math.PI * 2);
  ctx.fill();
  ctx.beginPath();
  ctx.arc(6 * s, 2 * s, 3 * s, 0, Math.PI * 2);
  ctx.fill();
  // Stems
  ctx.strokeStyle = '#F06292';
  ctx.lineWidth = 2 * s;
  ctx.beginPath();
  ctx.moveTo(-1 * s, 4 * s);
  ctx.lineTo(-1 * s, -8 * s);
  ctx.lineTo(9 * s, -10 * s);
  ctx.lineTo(9 * s, 2 * s);
  ctx.stroke();
}

function drawOrologio(ctx: CanvasRenderingContext2D, s: number): void {
  ctx.fillStyle = '#8D6E63';
  ctx.beginPath();
  ctx.arc(0, 0, 10 * s, 0, Math.PI * 2);
  ctx.fill();
  ctx.fillStyle = '#FFF8E1';
  ctx.beginPath();
  ctx.arc(0, 0, 8 * s, 0, Math.PI * 2);
  ctx.fill();
  // Hands
  ctx.strokeStyle = '#5D4037';
  ctx.lineWidth = 1.5 * s;
  ctx.beginPath();
  ctx.moveTo(0, 0);
  ctx.lineTo(0, -6 * s);
  ctx.stroke();
  ctx.beginPath();
  ctx.moveTo(0, 0);
  ctx.lineTo(4 * s, -2 * s);
  ctx.stroke();
}

function drawArte(ctx: CanvasRenderingContext2D, s: number): void {
  // Palette
  ctx.fillStyle = '#D7CCC8';
  ctx.beginPath();
  ctx.ellipse(0, 0, 12 * s, 9 * s, 0, 0, Math.PI * 2);
  ctx.fill();
  // Color dots
  const colors = ['#F44336', '#2196F3', '#FFEB3B', '#4CAF50', '#9C27B0'];
  const positions = [[-5, -3], [4, -3], [0, 2], [-6, 2], [6, 1]];
  for (let i = 0; i < 5; i++) {
    ctx.fillStyle = colors[i];
    ctx.beginPath();
    ctx.arc(positions[i][0] * s, positions[i][1] * s, 2 * s, 0, Math.PI * 2);
    ctx.fill();
  }
}

function drawAlchimia(ctx: CanvasRenderingContext2D, s: number): void {
  // Flask
  ctx.fillStyle = 'rgba(255,215,0,0.3)';
  ctx.beginPath();
  ctx.moveTo(-3 * s, -10 * s);
  ctx.lineTo(-3 * s, -4 * s);
  ctx.lineTo(-9 * s, 8 * s);
  ctx.quadraticCurveTo(-9 * s, 12 * s, 0, 12 * s);
  ctx.quadraticCurveTo(9 * s, 12 * s, 9 * s, 8 * s);
  ctx.lineTo(3 * s, -4 * s);
  ctx.lineTo(3 * s, -10 * s);
  ctx.closePath();
  ctx.fill();
  ctx.strokeStyle = '#FFD700';
  ctx.lineWidth = 1.5 * s;
  ctx.stroke();
  // Bubbles
  ctx.fillStyle = '#FFD700';
  ctx.beginPath(); ctx.arc(-2 * s, 4 * s, 2 * s, 0, Math.PI * 2); ctx.fill();
  ctx.beginPath(); ctx.arc(3 * s, 6 * s, 1.5 * s, 0, Math.PI * 2); ctx.fill();
  // Star
  ctx.fillStyle = '#FFF176';
  ctx.beginPath();
  ctx.arc(0, -12 * s, 2 * s, 0, Math.PI * 2);
  ctx.fill();
}

function drawDefault(ctx: CanvasRenderingContext2D, s: number): void {
  ctx.fillStyle = 'rgba(255,255,255,0.3)';
  ctx.beginPath();
  ctx.arc(0, 0, 6 * s, 0, Math.PI * 2);
  ctx.fill();
  ctx.fillStyle = 'rgba(255,255,255,0.5)';
  ctx.font = `${10 * s}px sans-serif`;
  ctx.textAlign = 'center';
  ctx.textBaseline = 'middle';
  ctx.fillText('?', 0, 0);
}

// Draw an element orb
export function drawOrb(
  ctx: CanvasRenderingContext2D,
  elem: ElementDef,
  x: number,
  y: number,
  radius: number,
  time: number,
  highlighted: boolean = false
): void {
  ctx.save();

  const glowPulse = 0.6 + Math.sin(time * 2 + x * 0.01) * 0.2;

  // Outer glow
  const glowSize = highlighted ? radius * 2 : radius * 1.5;
  const glow = ctx.createRadialGradient(x, y, radius * 0.5, x, y, glowSize);
  glow.addColorStop(0, elem.glowColor + (highlighted ? '60' : '30'));
  glow.addColorStop(1, elem.glowColor + '00');
  ctx.fillStyle = glow;
  ctx.beginPath();
  ctx.arc(x, y, glowSize, 0, Math.PI * 2);
  ctx.fill();

  // Main orb
  const orbGrad = ctx.createRadialGradient(x - radius * 0.3, y - radius * 0.3, 0, x, y, radius);
  orbGrad.addColorStop(0, lightenColor(elem.color, 40));
  orbGrad.addColorStop(0.6, elem.color);
  orbGrad.addColorStop(1, darkenColor(elem.color, 30));
  ctx.fillStyle = orbGrad;
  ctx.beginPath();
  ctx.arc(x, y, radius, 0, Math.PI * 2);
  ctx.fill();

  // Subtle border
  ctx.strokeStyle = elem.glowColor + (highlighted ? 'CC' : '66');
  ctx.lineWidth = highlighted ? 2 : 1;
  ctx.beginPath();
  ctx.arc(x, y, radius, 0, Math.PI * 2);
  ctx.stroke();

  // Specular highlight
  ctx.globalAlpha = 0.3 * glowPulse;
  ctx.fillStyle = '#FFFFFF';
  ctx.beginPath();
  ctx.ellipse(x - radius * 0.2, y - radius * 0.3, radius * 0.3, radius * 0.15, -0.5, 0, Math.PI * 2);
  ctx.fill();
  ctx.globalAlpha = 1;

  // Icon
  drawElementIcon(ctx, elem.id, x, y, radius);

  ctx.restore();
}

function lightenColor(hex: string, amount: number): string {
  const r = Math.min(255, parseInt(hex.slice(1, 3), 16) + amount);
  const g = Math.min(255, parseInt(hex.slice(3, 5), 16) + amount);
  const b = Math.min(255, parseInt(hex.slice(5, 7), 16) + amount);
  return `rgb(${r},${g},${b})`;
}

function darkenColor(hex: string, amount: number): string {
  const r = Math.max(0, parseInt(hex.slice(1, 3), 16) - amount);
  const g = Math.max(0, parseInt(hex.slice(3, 5), 16) - amount);
  const b = Math.max(0, parseInt(hex.slice(5, 7), 16) - amount);
  return `rgb(${r},${g},${b})`;
}

// Render the full game frame
export function render(ctx: CanvasRenderingContext2D, state: GameState, time: number): void {
  ctx.clearRect(0, 0, W, H);

  // Background
  const bgGrad = ctx.createLinearGradient(0, 0, 0, H);
  bgGrad.addColorStop(0, '#12081e');
  bgGrad.addColorStop(0.5, '#1a0f2e');
  bgGrad.addColorStop(1, '#12081e');
  ctx.fillStyle = bgGrad;
  ctx.fillRect(0, 0, W, H);

  // Background sparkles
  drawSparkles(ctx, state.sparkles);

  if (state.screen === 'title') {
    renderTitle(ctx, state, time);
    return;
  }

  if (state.screen === 'tutorial') {
    renderTutorial(ctx, state, time);
    return;
  }

  if (state.screen === 'chapter-complete') {
    renderChapterComplete(ctx, state, time);
    return;
  }

  // Play screen
  renderWorkspacePanel(ctx, state, time);
  renderCombineArea(ctx, state, time);
  renderRightPanel(ctx, state, time);
  renderDiscoveryLog(ctx, state, time);
  renderParticlesAndEffects(ctx, state, time);
  renderHeldElement(ctx, state, time);
  renderHintText(ctx, state, time);
  renderExitButton(ctx, state, time);
}

function renderTitle(ctx: CanvasRenderingContext2D, state: GameState, time: number): void {
  const alpha = Math.min(1, state.titleAlpha);
  ctx.globalAlpha = alpha;

  // Title
  ctx.fillStyle = '#FFD700';
  ctx.font = 'bold 72px Georgia, serif';
  ctx.textAlign = 'center';
  ctx.textBaseline = 'middle';
  ctx.shadowColor = '#FFD700';
  ctx.shadowBlur = 20 + Math.sin(time * 2) * 10;
  ctx.fillText('ALCHIMIA', W / 2, H / 2 - 100);
  ctx.shadowBlur = 0;

  // Subtitle
  ctx.fillStyle = '#B39DDB';
  ctx.font = '24px Georgia, serif';
  ctx.fillText('L\'Arte della Combinazione', W / 2, H / 2 - 40);

  // Floating orbs decoration
  const orbDefs = [
    { id: 'terra', x: W / 2 - 140, y: H / 2 + 40 },
    { id: 'acqua', x: W / 2 - 50, y: H / 2 + 40 },
    { id: 'fuoco', x: W / 2 + 50, y: H / 2 + 40 },
    { id: 'aria', x: W / 2 + 140, y: H / 2 + 40 },
  ];
  for (const o of orbDefs) {
    const elem = getElement(o.id);
    const floatY = o.y + Math.sin(time * 1.5 + o.x * 0.01) * 8;
    drawOrb(ctx, elem, o.x, floatY, 30, time);
  }

  // Start prompt
  const blinkAlpha = 0.5 + Math.sin(time * 3) * 0.5;
  ctx.globalAlpha = alpha * blinkAlpha;
  ctx.fillStyle = '#FFFFFF';
  ctx.font = '20px Georgia, serif';
  ctx.fillText('Clicca per iniziare', W / 2, H / 2 + 140);

  // Version
  ctx.globalAlpha = alpha * 0.3;
  ctx.font = '14px sans-serif';
  ctx.fillText('Gameflix TinkerFarm', W / 2, H - 30);

  ctx.globalAlpha = 1;
}

function renderWorkspacePanel(ctx: CanvasRenderingContext2D, state: GameState, time: number): void {
  // Panel background
  ctx.fillStyle = 'rgba(18,8,30,0.85)';
  ctx.fillRect(0, 0, PANEL_W, H);

  // Border
  ctx.strokeStyle = 'rgba(179,157,219,0.3)';
  ctx.lineWidth = 1;
  ctx.beginPath();
  ctx.moveTo(PANEL_W, 0);
  ctx.lineTo(PANEL_W, H);
  ctx.stroke();

  // Title
  ctx.fillStyle = '#B39DDB';
  ctx.font = 'bold 16px Georgia, serif';
  ctx.textAlign = 'center';
  ctx.textBaseline = 'middle';
  ctx.fillText('Elementi Scoperti', PANEL_W / 2, 30);

  // Count
  ctx.fillStyle = '#7E57C2';
  ctx.font = '13px sans-serif';
  ctx.fillText(`${state.discovered.size} / ${Object.keys(ELEMENTS).length}`, PANEL_W / 2, 48);

  // Clip for scrollable area
  ctx.save();
  ctx.beginPath();
  ctx.rect(0, WORKSPACE_Y, PANEL_W, H - WORKSPACE_Y);
  ctx.clip();

  const discovered = Array.from(state.discovered).sort((a, b) => {
    const ea = ELEMENTS[a], eb = ELEMENTS[b];
    if (ea.depth !== eb.depth) return ea.depth - eb.depth;
    return ea.name.localeCompare(eb.name);
  });

  const cellSize = GRID_CELL;
  const startX = WORKSPACE_X + 10;
  const startY = WORKSPACE_Y + 10 - state.scrollOffset;

  for (let i = 0; i < discovered.length; i++) {
    const col = i % GRID_COLS;
    const row = Math.floor(i / GRID_COLS);
    const cx = startX + col * cellSize + cellSize / 2;
    const cy = startY + row * cellSize + cellSize / 2;

    if (cy < WORKSPACE_Y - cellSize || cy > H + cellSize) continue;

    const elem = ELEMENTS[discovered[i]];
    const isHovered = state.hoveredWorkspace === elem.id;
    const orbR = isHovered ? ORB_RADIUS * 0.48 : ORB_RADIUS * 0.42;

    drawOrb(ctx, elem, cx, cy, orbR, time, isHovered);

    // Name below orb
    ctx.fillStyle = isHovered ? '#FFFFFF' : 'rgba(255,255,255,0.6)';
    ctx.font = `${isHovered ? '10' : '9'}px sans-serif`;
    ctx.textAlign = 'center';
    ctx.textBaseline = 'top';
    ctx.fillText(elem.name, cx, cy + orbR + 2);
  }

  // Calculate max scroll
  const totalRows = Math.ceil(discovered.length / GRID_COLS);
  const totalHeight = totalRows * cellSize + 20;
  const visibleHeight = H - WORKSPACE_Y;
  state.maxScroll = Math.max(0, totalHeight - visibleHeight);

  ctx.restore();

  // Scroll indicator
  if (state.maxScroll > 0) {
    const scrollBarH = Math.max(30, (visibleHeight / totalHeight) * visibleHeight);
    const scrollBarY = WORKSPACE_Y + (state.scrollOffset / state.maxScroll) * (visibleHeight - scrollBarH);
    ctx.fillStyle = 'rgba(179,157,219,0.3)';
    ctx.fillRect(PANEL_W - 4, scrollBarY, 3, scrollBarH);
  }
}

function renderCombineArea(ctx: CanvasRenderingContext2D, state: GameState, time: number): void {
  const cx = COMBINE_AREA_X + COMBINE_AREA_W / 2;
  const cy = H / 2;

  // Drop zone visual boundary
  const dzMargin = 20;
  const dzX = COMBINE_AREA_X + dzMargin;
  const dzY = dzMargin;
  const dzW = COMBINE_AREA_W - dzMargin * 2;
  const dzH = H - dzMargin * 2;

  // Dashed border for drop zone
  ctx.save();
  ctx.strokeStyle = 'rgba(179,157,219,0.15)';
  ctx.lineWidth = 2;
  ctx.setLineDash([8, 8]);
  ctx.strokeRect(dzX, dzY, dzW, dzH);
  ctx.setLineDash([]);
  ctx.restore();

  // Drop zone label at the top
  ctx.fillStyle = 'rgba(179,157,219,0.25)';
  ctx.font = 'bold 13px sans-serif';
  ctx.textAlign = 'center';
  ctx.textBaseline = 'top';
  ctx.fillText('TRASCINA QUI PER COMBINARE', cx, 8);

  // Subtle center decoration
  ctx.strokeStyle = 'rgba(179,157,219,0.06)';
  ctx.lineWidth = 1;
  for (let r = 60; r < 200; r += 40) {
    ctx.beginPath();
    ctx.arc(cx, cy, r, 0, Math.PI * 2);
    ctx.stroke();
  }

  // Placed elements
  for (const pe of state.placedElements) {
    const elem = ELEMENTS[pe.id];
    if (!elem) continue;
    drawOrb(ctx, elem, pe.x, pe.y, ORB_RADIUS * pe.scale, time, state.hoveredElement === pe.id);

    // Name
    ctx.fillStyle = 'rgba(255,255,255,0.7)';
    ctx.font = '12px sans-serif';
    ctx.textAlign = 'center';
    ctx.textBaseline = 'top';
    ctx.fillText(elem.name, pe.x, pe.y + ORB_RADIUS * pe.scale + 4);
  }

  // Merge animation
  if (state.mergeAnim) {
    const ma = state.mergeAnim;
    const t = ma.timer / ma.maxTimer;
    if (t < 0.5) {
      // Elements flying toward center
      const p = t * 2;
      const easeP = 1 - (1 - p) * (1 - p);
      const axNow = ma.ax + (ma.targetX - ma.ax) * easeP;
      const ayNow = ma.ay + (ma.targetY - ma.ay) * easeP;
      const bxNow = ma.bx + (ma.targetX - ma.bx) * easeP;
      const byNow = ma.by + (ma.targetY - ma.by) * easeP;

      const elemA = ELEMENTS[ma.elemA];
      const elemB = ELEMENTS[ma.elemB];
      if (elemA) drawOrb(ctx, elemA, axNow, ayNow, ORB_RADIUS * (1 - p * 0.3), time);
      if (elemB) drawOrb(ctx, elemB, bxNow, byNow, ORB_RADIUS * (1 - p * 0.3), time);
    } else {
      // Result appearing
      const p = (t - 0.5) * 2;
      const resultElem = ELEMENTS[ma.result];
      if (resultElem) {
        const scale = 0.3 + p * 0.7;
        ctx.globalAlpha = p;
        drawOrb(ctx, resultElem, ma.targetX, ma.targetY, ORB_RADIUS * 1.2 * scale, time, true);
        ctx.globalAlpha = 1;
      }
    }
  }

  // Hint for empty area
  if (state.placedElements.length === 0 && !state.heldElement && !state.mergeAnim) {
    // Animated hint
    const hintAlpha = 0.3 + Math.sin(time * 1.5) * 0.1;
    ctx.fillStyle = `rgba(179,157,219,${hintAlpha})`;
    ctx.font = '18px Georgia, serif';
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.fillText('Trascina un elemento su un altro', cx, cy - 20);
    ctx.fillText('per combinarli', cx, cy + 10);

    // Arrow decoration
    ctx.font = '28px Georgia, serif';
    ctx.fillText('\u2b07', cx, cy + 50);
  }
}

function renderRightPanel(ctx: CanvasRenderingContext2D, state: GameState, time: number): void {
  const rx = W - RIGHT_PANEL_W;

  // Panel background
  ctx.fillStyle = 'rgba(18,8,30,0.85)';
  ctx.fillRect(rx, 0, RIGHT_PANEL_W, H);

  // Border
  ctx.strokeStyle = 'rgba(179,157,219,0.3)';
  ctx.lineWidth = 1;
  ctx.beginPath();
  ctx.moveTo(rx, 0);
  ctx.lineTo(rx, H);
  ctx.stroke();

  // Title
  ctx.fillStyle = '#FFD700';
  ctx.font = 'bold 16px Georgia, serif';
  ctx.textAlign = 'center';
  ctx.textBaseline = 'middle';
  ctx.fillText('Progresso', rx + RIGHT_PANEL_W / 2, 30);

  // Current chapter indicator
  const currentCh = CHAPTERS[state.currentChapter] || CHAPTERS[0];
  ctx.fillStyle = '#B39DDB';
  ctx.font = 'bold 12px sans-serif';
  ctx.fillText(`Capitolo ${state.currentChapter + 1}: ${state.discovered.size}/${currentCh.requiredDiscoveries} scoperte`,
    rx + RIGHT_PANEL_W / 2, 52);

  // Score
  ctx.fillStyle = '#FFFFFF';
  ctx.font = '14px sans-serif';
  ctx.fillText(`Punteggio: ${state.score}`, rx + RIGHT_PANEL_W / 2, 72);

  // Chapters
  let cy = 100;
  for (let i = 0; i < CHAPTERS.length; i++) {
    const ch = CHAPTERS[i];
    const isActive = state.currentChapter === i;
    const isComplete = state.chapterCompleted[i];
    const progress = Math.min(state.discovered.size, ch.requiredDiscoveries);

    // Chapter box
    ctx.fillStyle = isActive ? 'rgba(179,157,219,0.2)' : 'rgba(255,255,255,0.05)';
    ctx.fillRect(rx + 10, cy, RIGHT_PANEL_W - 20, 60);

    if (isActive) {
      ctx.strokeStyle = '#B39DDB';
      ctx.lineWidth = 1;
      ctx.strokeRect(rx + 10, cy, RIGHT_PANEL_W - 20, 60);
    }

    // Chapter name
    ctx.fillStyle = isComplete ? '#FFD700' : isActive ? '#FFFFFF' : 'rgba(255,255,255,0.5)';
    ctx.font = `bold 13px sans-serif`;
    ctx.textAlign = 'left';
    ctx.textBaseline = 'top';
    ctx.fillText(ch.name, rx + 18, cy + 8);

    ctx.fillStyle = isComplete ? '#FFD700' : isActive ? '#B39DDB' : 'rgba(255,255,255,0.3)';
    ctx.font = '11px sans-serif';
    ctx.fillText(ch.subtitle, rx + 18, cy + 24);

    // Progress bar
    const barX = rx + 18;
    const barY = cy + 42;
    const barW = RIGHT_PANEL_W - 40;
    const barH = 8;
    ctx.fillStyle = 'rgba(255,255,255,0.1)';
    ctx.fillRect(barX, barY, barW, barH);

    const fillW = (progress / ch.requiredDiscoveries) * barW;
    ctx.fillStyle = isComplete ? '#FFD700' : '#7E57C2';
    ctx.fillRect(barX, barY, fillW, barH);

    // Count
    ctx.fillStyle = isComplete ? '#FFD700' : 'rgba(255,255,255,0.5)';
    ctx.font = '10px sans-serif';
    ctx.textAlign = 'right';
    ctx.fillText(
      isComplete ? 'Completato!' : `${progress}/${ch.requiredDiscoveries}`,
      rx + RIGHT_PANEL_W - 18,
      cy + 8
    );

    cy += 70;
  }

  // Category legend
  cy += 20;
  ctx.fillStyle = '#B39DDB';
  ctx.font = 'bold 12px sans-serif';
  ctx.textAlign = 'left';
  ctx.fillText('Categorie', rx + 18, cy);
  cy += 20;

  const categories: [string, string][] = [
    ['base', 'Base'],
    ['naturali', 'Naturali'],
    ['energia', 'Energia'],
    ['materia', 'Materia'],
    ['vita', 'Vita'],
    ['celesti', 'Celesti'],
    ['costruzioni', 'Costruzioni'],
    ['avanzati', 'Avanzati'],
  ];

  for (const [cat, label] of categories) {
    ctx.fillStyle = CATEGORY_COLORS[cat] || '#FFFFFF';
    ctx.beginPath();
    ctx.arc(rx + 26, cy, 5, 0, Math.PI * 2);
    ctx.fill();

    ctx.fillStyle = 'rgba(255,255,255,0.6)';
    ctx.font = '11px sans-serif';
    ctx.textAlign = 'left';
    ctx.fillText(label, rx + 38, cy + 4);
    cy += 20;
  }
}

function renderParticlesAndEffects(ctx: CanvasRenderingContext2D, state: GameState, time: number): void {
  drawParticles(ctx, state.particles);

  // Discovery animation
  if (state.discoveryAnim) {
    const da = state.discoveryAnim;
    const t = da.timer / da.maxTimer;
    const elem = ELEMENTS[da.elementId];

    if (t < 0.7) {
      // Golden flash
      const flashAlpha = t < 0.1 ? t / 0.1 : t < 0.3 ? 1 : 1 - (t - 0.3) / 0.4;
      ctx.globalAlpha = flashAlpha * 0.3;
      const flashGrad = ctx.createRadialGradient(da.x, da.y, 0, da.x, da.y, 150);
      flashGrad.addColorStop(0, '#FFD700');
      flashGrad.addColorStop(1, 'transparent');
      ctx.fillStyle = flashGrad;
      ctx.beginPath();
      ctx.arc(da.x, da.y, 150, 0, Math.PI * 2);
      ctx.fill();
      ctx.globalAlpha = 1;
    }

    // "SCOPERTA!" text
    if (t > 0.1 && t < 0.85) {
      const textAlpha = t < 0.2 ? (t - 0.1) / 0.1 : t > 0.7 ? (0.85 - t) / 0.15 : 1;
      const textScale = 0.5 + Math.min(1, (t - 0.1) / 0.2) * 0.5;
      ctx.globalAlpha = textAlpha;
      ctx.fillStyle = '#FFD700';
      ctx.font = `bold ${28 * textScale}px Georgia, serif`;
      ctx.textAlign = 'center';
      ctx.textBaseline = 'middle';
      ctx.shadowColor = '#FFD700';
      ctx.shadowBlur = 15;
      ctx.fillText('SCOPERTA!', da.x, da.y - 60);
      ctx.shadowBlur = 0;

      if (elem) {
        ctx.fillStyle = '#FFFFFF';
        ctx.font = `bold ${22 * textScale}px Georgia, serif`;
        ctx.fillText(elem.name, da.x, da.y - 30);
      }
      ctx.globalAlpha = 1;
    }
  }

  // Invalid animation - clearer message
  if (state.invalidAnim) {
    const ia = state.invalidAnim;
    const t = ia.timer / ia.maxTimer;
    const alpha = t < 0.1 ? t / 0.1 : t > 0.7 ? (1 - t) / 0.3 : 1;
    ctx.globalAlpha = alpha * 0.9;

    // Background panel for the message
    const msgW = 350;
    const msgH = 50;
    const msgX = ia.x - msgW / 2;
    const msgY = ia.y - 70 - t * 15;
    ctx.fillStyle = 'rgba(80,20,20,0.85)';
    ctx.fillRect(msgX, msgY, msgW, msgH);
    ctx.strokeStyle = '#FF5252';
    ctx.lineWidth = 1.5;
    ctx.strokeRect(msgX, msgY, msgW, msgH);

    ctx.fillStyle = '#FF5252';
    ctx.font = 'bold 15px sans-serif';
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.fillText('Questa combinazione non funziona.', ia.x, msgY + 16);
    ctx.fillStyle = '#FFAB91';
    ctx.font = '13px sans-serif';
    ctx.fillText('Prova un\'altra!', ia.x, msgY + 36);
    ctx.globalAlpha = 1;
  }
}

function renderHeldElement(ctx: CanvasRenderingContext2D, state: GameState, time: number): void {
  if (!state.heldElement) return;
  const elem = ELEMENTS[state.heldElement];
  if (!elem) return;

  ctx.globalAlpha = 0.8;
  drawOrb(ctx, elem, state.mouseX, state.mouseY, ORB_RADIUS * 1.1, time, true);
  ctx.globalAlpha = 1;

  ctx.fillStyle = '#FFFFFF';
  ctx.font = '12px sans-serif';
  ctx.textAlign = 'center';
  ctx.textBaseline = 'top';
  ctx.fillText(elem.name, state.mouseX, state.mouseY + ORB_RADIUS * 1.1 + 4);
}

function renderHintText(ctx: CanvasRenderingContext2D, state: GameState, time: number): void {
  if (state.hintTimer <= 0 || !state.hintText) return;
  const alpha = Math.min(1, state.hintTimer / 0.5);
  ctx.globalAlpha = alpha;
  ctx.fillStyle = '#B39DDB';
  ctx.font = '14px sans-serif';
  ctx.textAlign = 'center';
  ctx.textBaseline = 'bottom';
  ctx.fillText(state.hintText, COMBINE_AREA_X + COMBINE_AREA_W / 2, H - 20);
  ctx.globalAlpha = 1;
}

function renderChapterComplete(ctx: CanvasRenderingContext2D, state: GameState, time: number): void {
  const ch = CHAPTERS[state.currentChapter];

  ctx.fillStyle = 'rgba(18,8,30,0.95)';
  ctx.fillRect(0, 0, W, H);

  // Title
  ctx.fillStyle = '#FFD700';
  ctx.font = 'bold 48px Georgia, serif';
  ctx.textAlign = 'center';
  ctx.textBaseline = 'middle';
  ctx.shadowColor = '#FFD700';
  ctx.shadowBlur = 20;
  ctx.fillText('Capitolo Completato!', W / 2, 100);
  ctx.shadowBlur = 0;

  ctx.fillStyle = '#B39DDB';
  ctx.font = '28px Georgia, serif';
  ctx.fillText(`${ch.name}: ${ch.subtitle}`, W / 2, 160);

  // Discovered elements in a grid
  const discovered = Array.from(state.discovered).sort((a, b) => ELEMENTS[a].depth - ELEMENTS[b].depth);
  const cols = 10;
  const cellW = 80;
  const startX = (W - cols * cellW) / 2 + cellW / 2;
  const startY = 220;

  for (let i = 0; i < discovered.length; i++) {
    const col = i % cols;
    const row = Math.floor(i / cols);
    const cx = startX + col * cellW;
    const cy = startY + row * 70;
    const elem = ELEMENTS[discovered[i]];
    drawOrb(ctx, elem, cx, cy, 20, time);
    ctx.fillStyle = 'rgba(255,255,255,0.7)';
    ctx.font = '9px sans-serif';
    ctx.textAlign = 'center';
    ctx.textBaseline = 'top';
    ctx.fillText(elem.name, cx, cy + 24);
  }

  // Continue prompt
  const blink = 0.5 + Math.sin(time * 3) * 0.5;
  ctx.globalAlpha = blink;
  ctx.fillStyle = '#FFFFFF';
  ctx.font = '20px Georgia, serif';
  ctx.textAlign = 'center';
  const isLastChapter = state.currentChapter >= CHAPTERS.length - 1;
  ctx.fillText(
    isLastChapter ? 'Hai completato Alchimia! Clicca per continuare.' : 'Clicca per continuare',
    W / 2,
    H - 60
  );
  ctx.globalAlpha = 1;

  // Score
  ctx.fillStyle = '#FFD700';
  ctx.font = '18px sans-serif';
  ctx.fillText(`Punteggio: ${state.score}`, W / 2, H - 100);
}

// ─── Tutorial Screen ──────────────────────────────────────────────

function renderTutorial(ctx: CanvasRenderingContext2D, state: GameState, time: number): void {
  ctx.fillStyle = 'rgba(18,8,30,0.95)';
  ctx.fillRect(0, 0, W, H);

  const step = state.tutorialStep;

  // Title
  ctx.fillStyle = '#FFD700';
  ctx.font = 'bold 36px Georgia, serif';
  ctx.textAlign = 'center';
  ctx.textBaseline = 'middle';
  ctx.shadowColor = '#FFD700';
  ctx.shadowBlur = 15;
  ctx.fillText('Come si Gioca', W / 2, 80);
  ctx.shadowBlur = 0;

  // Step indicators
  for (let i = 0; i < 3; i++) {
    const dotX = W / 2 - 30 + i * 30;
    ctx.fillStyle = i === step ? '#FFD700' : 'rgba(179,157,219,0.4)';
    ctx.beginPath();
    ctx.arc(dotX, 120, i === step ? 8 : 5, 0, Math.PI * 2);
    ctx.fill();
  }

  if (step === 0) {
    // Step 1: Basic instructions
    ctx.fillStyle = '#B39DDB';
    ctx.font = '22px Georgia, serif';
    ctx.fillText('Trascina un elemento su un altro per combinarli', W / 2, 200);

    ctx.fillStyle = '#FFFFFF';
    ctx.font = '18px Georgia, serif';
    ctx.fillText('Scopri nuove sostanze combinando gli elementi', W / 2, 250);

    // Show the 4 base elements
    const baseIds = ['terra', 'acqua', 'fuoco', 'aria'];
    const startX = W / 2 - 180;
    for (let i = 0; i < 4; i++) {
      const elem = getElement(baseIds[i]);
      const ex = startX + i * 120;
      const ey = 360;
      const floatY = ey + Math.sin(time * 1.5 + i) * 5;
      drawOrb(ctx, elem, ex, floatY, 35, time);
      ctx.fillStyle = '#FFFFFF';
      ctx.font = 'bold 14px sans-serif';
      ctx.textAlign = 'center';
      ctx.fillText(elem.name, ex, floatY + 45);
    }

    ctx.fillStyle = 'rgba(179,157,219,0.6)';
    ctx.font = '16px sans-serif';
    ctx.fillText('Questi sono i 4 elementi base', W / 2, 450);

  } else if (step === 1) {
    // Step 2: Animated example - Terra + Acqua -> Fango
    ctx.fillStyle = '#B39DDB';
    ctx.font = '22px Georgia, serif';
    ctx.fillText('Esempio: Combina Terra e Acqua', W / 2, 200);

    const terra = getElement('terra');
    const acqua = getElement('acqua');
    const fango = getElement('fango');

    const animT = (time * 0.5) % 3;

    if (animT < 1.5) {
      // Elements moving together
      const p = Math.min(1, animT / 1.2);
      const easeP = 1 - (1 - p) * (1 - p);
      const terraX = W / 2 - 120 + easeP * 80;
      const acquaX = W / 2 + 120 - easeP * 80;
      const y = 350;
      drawOrb(ctx, terra, terraX, y, 35 * (1 - easeP * 0.3), time);
      ctx.fillStyle = '#FFFFFF';
      ctx.font = 'bold 14px sans-serif';
      ctx.fillText('Terra', terraX, y + 45);
      drawOrb(ctx, acqua, acquaX, y, 35 * (1 - easeP * 0.3), time);
      ctx.fillText('Acqua', acquaX, y + 45);

      // Plus sign
      ctx.fillStyle = '#FFD700';
      ctx.font = 'bold 28px sans-serif';
      ctx.fillText('+', W / 2, y);
    } else {
      // Result appearing
      const p = Math.min(1, (animT - 1.5) / 0.8);
      const scale = 0.3 + p * 0.7;
      ctx.globalAlpha = p;
      drawOrb(ctx, fango, W / 2, 350, 40 * scale, time, true);
      ctx.globalAlpha = 1;

      // Arrow and name
      ctx.fillStyle = '#FFD700';
      ctx.font = 'bold 22px Georgia, serif';
      ctx.fillText('\u2192 Fango!', W / 2, 420);
    }

    ctx.fillStyle = 'rgba(179,157,219,0.6)';
    ctx.font = '16px sans-serif';
    ctx.fillText('Terra + Acqua = Fango', W / 2, 480);

  } else {
    // Step 3: Final tips
    ctx.fillStyle = '#B39DDB';
    ctx.font = '22px Georgia, serif';
    ctx.fillText('Consigli', W / 2, 200);

    const tips = [
      '\u2022 Seleziona un elemento dal pannello a sinistra',
      '\u2022 Trascinalo nell\'area centrale e rilascialo',
      '\u2022 Trascina un secondo elemento sopra il primo',
      '\u2022 Se la combinazione funziona, nasce un nuovo elemento!',
      '\u2022 Scopri tutti gli elementi per completare ogni capitolo',
    ];

    ctx.fillStyle = '#FFFFFF';
    ctx.font = '17px sans-serif';
    let ty = 270;
    for (const tip of tips) {
      ctx.fillText(tip, W / 2, ty);
      ty += 35;
    }
  }

  // Continue prompt
  const blink = 0.5 + Math.sin(time * 3) * 0.5;
  ctx.globalAlpha = blink;
  ctx.fillStyle = '#FFFFFF';
  ctx.font = '18px Georgia, serif';
  ctx.fillText(step < 2 ? 'Clicca per continuare' : 'Clicca per iniziare a giocare', W / 2, H - 60);
  ctx.globalAlpha = 1;
}

// ─── Discovery Log ───────────────────────────────────────────────

function renderDiscoveryLog(ctx: CanvasRenderingContext2D, state: GameState, time: number): void {
  if (state.discoveryLog.length === 0) return;

  const logX = COMBINE_AREA_X + 10;
  const logY = H - 30;

  ctx.save();
  for (let i = 0; i < state.discoveryLog.length; i++) {
    const entry = state.discoveryLog[i];
    const alpha = Math.min(1, entry.timer / 2);
    const y = logY - i * 22;
    if (y < 50) break;

    ctx.globalAlpha = alpha;

    // Background
    ctx.fillStyle = 'rgba(18,8,30,0.75)';
    ctx.fillRect(logX, y - 8, 320, 20);
    ctx.strokeStyle = 'rgba(255,215,0,0.3)';
    ctx.lineWidth = 0.5;
    ctx.strokeRect(logX, y - 8, 320, 20);

    // Text
    ctx.fillStyle = '#FFD700';
    ctx.font = 'bold 11px sans-serif';
    ctx.textAlign = 'left';
    ctx.textBaseline = 'middle';
    ctx.fillText(`Scoperto: ${entry.name} (${entry.recipe})`, logX + 6, y + 2);
  }
  ctx.globalAlpha = 1;
  ctx.restore();
}

// ─── Exit Button ─────────────────────────────────────────────────

function renderExitButton(ctx: CanvasRenderingContext2D, state: GameState, time: number): void {
  const bx = 5;
  const by = 5;
  const bw = 36;
  const bh = 36;

  // Check hover
  const isHovered = state.mouseX >= bx && state.mouseX <= bx + bw &&
    state.mouseY >= by && state.mouseY <= by + bh;

  ctx.save();
  ctx.fillStyle = isHovered ? 'rgba(255,50,50,0.7)' : 'rgba(255,50,50,0.3)';
  ctx.fillRect(bx, by, bw, bh);
  ctx.strokeStyle = isHovered ? '#FF5252' : 'rgba(255,50,50,0.5)';
  ctx.lineWidth = isHovered ? 2 : 1;
  ctx.strokeRect(bx, by, bw, bh);

  ctx.fillStyle = '#FFFFFF';
  ctx.font = 'bold 18px sans-serif';
  ctx.textAlign = 'center';
  ctx.textBaseline = 'middle';
  ctx.fillText('X', bx + bw / 2, by + bh / 2);
  ctx.restore();
}

// Hit test helpers
export function getWorkspaceElementAt(state: GameState, mx: number, my: number): string | null {
  if (mx < 0 || mx > PANEL_W || my < WORKSPACE_Y) return null;

  const discovered = Array.from(state.discovered).sort((a, b) => {
    const ea = ELEMENTS[a], eb = ELEMENTS[b];
    if (ea.depth !== eb.depth) return ea.depth - eb.depth;
    return ea.name.localeCompare(eb.name);
  });

  const startX = WORKSPACE_X + 10;
  const startY = WORKSPACE_Y + 10 - state.scrollOffset;

  for (let i = 0; i < discovered.length; i++) {
    const col = i % GRID_COLS;
    const row = Math.floor(i / GRID_COLS);
    const cx = startX + col * GRID_CELL + GRID_CELL / 2;
    const cy = startY + row * GRID_CELL + GRID_CELL / 2;

    const dx = mx - cx;
    const dy = my - cy;
    if (dx * dx + dy * dy < (ORB_RADIUS * 0.5) * (ORB_RADIUS * 0.5)) {
      return discovered[i];
    }
  }
  return null;
}

export function getPlacedElementAt(state: GameState, mx: number, my: number): number {
  for (let i = state.placedElements.length - 1; i >= 0; i--) {
    const pe = state.placedElements[i];
    const dx = mx - pe.x;
    const dy = my - pe.y;
    if (dx * dx + dy * dy < (ORB_RADIUS * pe.scale) * (ORB_RADIUS * pe.scale)) {
      return i;
    }
  }
  return -1;
}

export function isInCombineArea(x: number): boolean {
  return x >= COMBINE_AREA_X && x <= COMBINE_AREA_X + COMBINE_AREA_W;
}

export { W, H, PANEL_W, ORB_RADIUS, WORKSPACE_Y, COMBINE_AREA_X, COMBINE_AREA_W };
