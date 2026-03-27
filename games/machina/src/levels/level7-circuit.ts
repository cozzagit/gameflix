// ============================================================
// Level 7 — Il Circuito (The Circuit)
// Connect battery to 3 LEDs by dragging wire endpoints.
// ============================================================

import { MechanismLevel, C, GAME_W, GAME_H } from '../types';
import {
  drawBackground, drawMetalPanel, drawFrame, drawHUD,
  drawBrushedMetal, drawRivet, drawCornerRivets,
  roundRect, lighten, darken, dist
} from '../renderer';
import { EffectsEngine } from '../effects';
import { playClank, playSuccess, playElectricalBuzz, playHeavyClunk } from '../audio';

const BOARD_X = 150;
const BOARD_Y = 100;
const BOARD_W = 900;
const BOARD_H = 600;
const GRID_STEP = 50;

interface WirePoint {
  x: number;
  y: number;
}

interface Wire {
  points: WirePoint[];
  color: string;
  connected: boolean;
}

interface Component {
  type: 'battery' | 'led' | 'resistor';
  x: number;
  y: number;
  color?: string;
  terminalOut: WirePoint;
  terminalIn: WirePoint;
}

export class Level7Circuit implements MechanismLevel {
  id = 7;
  name = 'Il Circuito';
  subtitle = 'Collega la batteria ai LED';
  moves = 0;
  elapsed = 0;
  solved = false;

  private components: Component[] = [];
  private wires: Wire[] = [];
  private draggingWire = -1;
  private draggingEnd = -1; // 0=start, 1=end (last point)
  private effects = new EffectsEngine();
  private solveAnim = 0;
  private glowAnim = 0;

  init(): void {
    this.moves = 0;
    this.elapsed = 0;
    this.solved = false;
    this.solveAnim = 0;
    this.glowAnim = 0;
    this.effects.clear();

    // Battery at left
    const battX = BOARD_X + 80;
    const battY = BOARD_Y + BOARD_H / 2;

    // LEDs on right side
    const ledX = BOARD_X + BOARD_W - 100;

    this.components = [
      {
        type: 'battery', x: battX, y: battY, color: '#444444',
        terminalOut: { x: battX + 30, y: battY - 20 },
        terminalIn: { x: battX + 30, y: battY + 20 },
      },
      {
        type: 'led', x: ledX, y: BOARD_Y + 150, color: '#FF4444',
        terminalIn: { x: ledX - 20, y: BOARD_Y + 150 },
        terminalOut: { x: ledX + 20, y: BOARD_Y + 150 },
      },
      {
        type: 'led', x: ledX, y: BOARD_Y + 300, color: '#44FF44',
        terminalIn: { x: ledX - 20, y: BOARD_Y + 300 },
        terminalOut: { x: ledX + 20, y: BOARD_Y + 300 },
      },
      {
        type: 'led', x: ledX, y: BOARD_Y + 450, color: '#4444FF',
        terminalIn: { x: ledX - 20, y: BOARD_Y + 450 },
        terminalOut: { x: ledX + 20, y: BOARD_Y + 450 },
      },
    ];

    // Create 3 wires, each starts near battery and needs to reach an LED
    this.wires = [
      {
        points: [
          { x: battX + 50, y: battY - 40 },
          { x: battX + 100, y: battY - 40 },
          { x: battX + 100, y: BOARD_Y + 150 },
          { x: ledX - 40, y: BOARD_Y + 150 },
        ],
        color: '#FF6666',
        connected: false,
      },
      {
        points: [
          { x: battX + 50, y: battY },
          { x: battX + 150, y: battY },
          { x: battX + 150, y: BOARD_Y + 300 },
          { x: ledX - 40, y: BOARD_Y + 300 },
        ],
        color: '#66FF66',
        connected: false,
      },
      {
        points: [
          { x: battX + 50, y: battY + 40 },
          { x: battX + 200, y: battY + 40 },
          { x: battX + 200, y: BOARD_Y + 450 },
          { x: ledX - 40, y: BOARD_Y + 450 },
        ],
        color: '#6666FF',
        connected: false,
      },
    ];

    // Scramble wire endpoints away from targets
    for (const w of this.wires) {
      const last = w.points[w.points.length - 1];
      last.x = BOARD_X + 300 + Math.random() * 200;
      last.y = BOARD_Y + 100 + Math.random() * 400;
    }

    this.checkConnections();
  }

  reset(): void {
    this.init();
  }

  private snapToGrid(val: number): number {
    return Math.round(val / GRID_STEP) * GRID_STEP;
  }

  private checkConnections(): void {
    // Check if each wire's last point is near the corresponding LED terminal
    const leds = this.components.filter(c => c.type === 'led');
    for (let i = 0; i < this.wires.length; i++) {
      const w = this.wires[i];
      const lastPt = w.points[w.points.length - 1];
      const led = leds[i];
      w.connected = dist(lastPt.x, lastPt.y, led.terminalIn.x, led.terminalIn.y) < 30;
    }
  }

  isSolved(): boolean {
    return this.solved || this.wires.every(w => w.connected);
  }

  onPointerDown(x: number, y: number): void {
    if (this.solved) return;

    // Check if clicking near any wire endpoint (last point only)
    for (let i = 0; i < this.wires.length; i++) {
      const w = this.wires[i];
      const lastPt = w.points[w.points.length - 1];
      if (dist(x, y, lastPt.x, lastPt.y) < 25) {
        this.draggingWire = i;
        this.draggingEnd = 1;
        return;
      }
    }
  }

  onPointerMove(x: number, y: number): void {
    if (this.draggingWire < 0 || this.solved) return;

    const w = this.wires[this.draggingWire];
    const pt = w.points[w.points.length - 1];
    // Clamp to board
    pt.x = Math.max(BOARD_X + 20, Math.min(BOARD_X + BOARD_W - 20, x));
    pt.y = Math.max(BOARD_Y + 20, Math.min(BOARD_Y + BOARD_H - 20, y));

    // Update intermediate points for routing
    const prev = w.points[w.points.length - 2];
    if (prev) {
      prev.y = pt.y;
    }
  }

  onPointerUp(): void {
    if (this.draggingWire >= 0) {
      const w = this.wires[this.draggingWire];
      const lastPt = w.points[w.points.length - 1];

      // Snap to nearest LED terminal
      const leds = this.components.filter(c => c.type === 'led');
      const targetLed = leds[this.draggingWire];
      if (dist(lastPt.x, lastPt.y, targetLed.terminalIn.x, targetLed.terminalIn.y) < 40) {
        lastPt.x = targetLed.terminalIn.x;
        lastPt.y = targetLed.terminalIn.y;
        playClank();
      }

      this.moves++;
      this.draggingWire = -1;
      this.draggingEnd = -1;

      this.checkConnections();

      if (this.isSolved() && !this.solved) {
        this.solved = true;
        playElectricalBuzz();
        setTimeout(() => {
          playSuccess();
          playHeavyClunk();
        }, 400);
        for (const led of leds) {
          this.effects.emitGlow(led.x, led.y, led.color || C.WARM_LIGHT, 10);
        }
      }
    }
  }

  update(dt: number): void {
    if (!this.solved) {
      this.elapsed += dt;
    } else {
      this.solveAnim = Math.min(1, this.solveAnim + dt * 0.6);
    }
    this.glowAnim += dt * 3;
    this.effects.update(dt);
  }

  render(ctx: CanvasRenderingContext2D): void {
    drawBackground(ctx);

    // Panel
    const panelX = 80;
    const panelY = 70;
    const panelW = GAME_W - 160;
    const panelH = GAME_H - 110;
    drawMetalPanel(ctx, panelX, panelY, panelW, panelH, '#1A1A28', 10);
    drawFrame(ctx, panelX, panelY, panelW, panelH, 10);

    // Circuit board background
    ctx.save();
    ctx.fillStyle = '#0A3A0A';
    roundRect(ctx, BOARD_X, BOARD_Y, BOARD_W, BOARD_H, 6);
    ctx.fill();

    // PCB texture: grid lines
    ctx.strokeStyle = 'rgba(0,80,0,0.3)';
    ctx.lineWidth = 0.5;
    for (let x = BOARD_X; x <= BOARD_X + BOARD_W; x += GRID_STEP) {
      ctx.beginPath();
      ctx.moveTo(x, BOARD_Y);
      ctx.lineTo(x, BOARD_Y + BOARD_H);
      ctx.stroke();
    }
    for (let y = BOARD_Y; y <= BOARD_Y + BOARD_H; y += GRID_STEP) {
      ctx.beginPath();
      ctx.moveTo(BOARD_X, y);
      ctx.lineTo(BOARD_X + BOARD_W, y);
      ctx.stroke();
    }

    // Solder pads at grid intersections
    ctx.fillStyle = 'rgba(180,160,0,0.15)';
    for (let x = BOARD_X + GRID_STEP; x < BOARD_X + BOARD_W; x += GRID_STEP * 2) {
      for (let y = BOARD_Y + GRID_STEP; y < BOARD_Y + BOARD_H; y += GRID_STEP * 2) {
        ctx.beginPath();
        ctx.arc(x, y, 3, 0, Math.PI * 2);
        ctx.fill();
      }
    }
    ctx.restore();

    // Draw components
    for (const comp of this.components) {
      if (comp.type === 'battery') {
        this.drawBattery(ctx, comp);
      } else if (comp.type === 'led') {
        const isConnected = this.wires.some((w, i) => {
          const leds = this.components.filter(c => c.type === 'led');
          return leds[i] === comp && w.connected;
        });
        this.drawLED(ctx, comp, isConnected);
      }
    }

    // Draw wires
    for (let i = 0; i < this.wires.length; i++) {
      const w = this.wires[i];
      ctx.save();

      // Wire path
      ctx.strokeStyle = w.color;
      ctx.lineWidth = 4;
      ctx.lineJoin = 'round';
      ctx.lineCap = 'round';

      if (w.connected && this.solved) {
        ctx.shadowColor = w.color;
        ctx.shadowBlur = 8;
      }

      ctx.beginPath();
      ctx.moveTo(w.points[0].x, w.points[0].y);
      for (let j = 1; j < w.points.length; j++) {
        ctx.lineTo(w.points[j].x, w.points[j].y);
      }
      ctx.stroke();
      ctx.shadowBlur = 0;

      // Solder points
      for (const pt of w.points) {
        ctx.fillStyle = '#DAA520';
        ctx.beginPath();
        ctx.arc(pt.x, pt.y, 4, 0, Math.PI * 2);
        ctx.fill();
      }

      // Draggable endpoint indicator
      const lastPt = w.points[w.points.length - 1];
      if (!w.connected) {
        ctx.strokeStyle = w.color;
        ctx.lineWidth = 2;
        ctx.setLineDash([3, 3]);
        ctx.beginPath();
        ctx.arc(lastPt.x, lastPt.y, 12, 0, Math.PI * 2);
        ctx.stroke();
        ctx.setLineDash([]);
      }

      ctx.restore();
    }

    // Draw component terminals
    for (const comp of this.components) {
      // Terminal dots
      ctx.save();
      ctx.fillStyle = '#DAA520';
      ctx.beginPath();
      ctx.arc(comp.terminalOut.x, comp.terminalOut.y, 3, 0, Math.PI * 2);
      ctx.fill();
      ctx.beginPath();
      ctx.arc(comp.terminalIn.x, comp.terminalIn.y, 3, 0, Math.PI * 2);
      ctx.fill();
      ctx.restore();
    }

    // Hint
    if (!this.solved && this.moves === 0) {
      ctx.save();
      ctx.textAlign = 'center';
      ctx.font = 'italic 14px "Georgia", serif';
      ctx.fillStyle = C.TEXT_DIM;
      ctx.fillText('Trascina le estremit\u00E0 dei fili verso i LED corrispondenti', GAME_W / 2, GAME_H - 55);
      ctx.restore();
    }

    // Solve glow
    if (this.solveAnim > 0) {
      ctx.save();
      ctx.globalAlpha = this.solveAnim * 0.2;
      const glow = ctx.createRadialGradient(
        BOARD_X + BOARD_W / 2, BOARD_Y + BOARD_H / 2, 10,
        BOARD_X + BOARD_W / 2, BOARD_Y + BOARD_H / 2, 400
      );
      glow.addColorStop(0, '#FFFFFF');
      glow.addColorStop(1, 'rgba(255,255,255,0)');
      ctx.fillStyle = glow;
      ctx.fillRect(panelX, panelY, panelW, panelH);
      ctx.restore();
    }

    this.effects.render(ctx);
    drawHUD(ctx, this.name, this.subtitle, this.moves, this.elapsed);
  }

  private drawBattery(ctx: CanvasRenderingContext2D, comp: Component): void {
    ctx.save();
    const bw = 50;
    const bh = 80;

    // Battery body
    ctx.shadowColor = 'rgba(0,0,0,0.5)';
    ctx.shadowBlur = 6;
    const grad = ctx.createLinearGradient(comp.x - bw / 2, 0, comp.x + bw / 2, 0);
    grad.addColorStop(0, '#333333');
    grad.addColorStop(0.3, '#555555');
    grad.addColorStop(0.7, '#444444');
    grad.addColorStop(1, '#222222');
    ctx.fillStyle = grad;
    roundRect(ctx, comp.x - bw / 2, comp.y - bh / 2, bw, bh, 4);
    ctx.fill();

    ctx.shadowBlur = 0;

    // Battery cap (positive terminal)
    ctx.fillStyle = '#888888';
    ctx.fillRect(comp.x - 8, comp.y - bh / 2 - 6, 16, 8);

    // Labels
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.font = 'bold 16px "Georgia", serif';
    ctx.fillStyle = '#CCCCCC';
    ctx.fillText('+', comp.x, comp.y - bh / 4);
    ctx.fillText('\u2212', comp.x, comp.y + bh / 4);

    ctx.font = '10px "Georgia", serif';
    ctx.fillStyle = '#888888';
    ctx.fillText('9V', comp.x, comp.y);

    ctx.restore();
  }

  private drawLED(ctx: CanvasRenderingContext2D, comp: Component, lit: boolean): void {
    ctx.save();
    const r = 14;
    const color = comp.color || '#FF0000';

    // LED body (dome shape)
    ctx.shadowColor = lit ? color : 'rgba(0,0,0,0.3)';
    ctx.shadowBlur = lit ? 20 : 4;

    const grad = ctx.createRadialGradient(
      comp.x - 3, comp.y - 3, 0,
      comp.x, comp.y, r
    );
    if (lit) {
      grad.addColorStop(0, '#FFFFFF');
      grad.addColorStop(0.3, lighten(color, 30));
      grad.addColorStop(1, color);
    } else {
      grad.addColorStop(0, darken(color, 30));
      grad.addColorStop(1, darken(color, 60));
    }
    ctx.fillStyle = grad;
    ctx.beginPath();
    ctx.arc(comp.x, comp.y, r, 0, Math.PI * 2);
    ctx.fill();

    // Flat bottom
    ctx.fillStyle = '#333333';
    ctx.fillRect(comp.x - r, comp.y + r - 3, r * 2, 5);

    // Legs
    ctx.strokeStyle = '#AAAAAA';
    ctx.lineWidth = 2;
    ctx.beginPath();
    ctx.moveTo(comp.x - 5, comp.y + r + 2);
    ctx.lineTo(comp.x - 5, comp.y + r + 15);
    ctx.moveTo(comp.x + 5, comp.y + r + 2);
    ctx.lineTo(comp.x + 5, comp.y + r + 15);
    ctx.stroke();

    ctx.shadowBlur = 0;
    ctx.restore();
  }
}
