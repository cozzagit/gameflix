// ============================================================
// Machina — Input Manager
// ============================================================

import { GAME_W, GAME_H } from './types';

export class InputManager {
  public x = 0;
  public y = 0;
  public isDown = false;
  public dragStartX = 0;
  public dragStartY = 0;
  public dx = 0;
  public dy = 0;

  private canvas: HTMLCanvasElement;
  private scaleX = 1;
  private scaleY = 1;
  private offsetX = 0;
  private offsetY = 0;

  private downHandlers: Array<(x: number, y: number) => void> = [];
  private moveHandlers: Array<(x: number, y: number) => void> = [];
  private upHandlers: Array<() => void> = [];

  constructor(canvas: HTMLCanvasElement) {
    this.canvas = canvas;
    this.updateScale();

    canvas.addEventListener('mousedown', (e) => this.handleDown(e.clientX, e.clientY));
    canvas.addEventListener('mousemove', (e) => this.handleMove(e.clientX, e.clientY));
    canvas.addEventListener('mouseup', () => this.handleUp());
    canvas.addEventListener('mouseleave', () => { if (this.isDown) this.handleUp(); });

    canvas.addEventListener('touchstart', (e) => {
      e.preventDefault();
      const t = e.touches[0];
      this.handleDown(t.clientX, t.clientY);
    }, { passive: false });
    canvas.addEventListener('touchmove', (e) => {
      e.preventDefault();
      const t = e.touches[0];
      this.handleMove(t.clientX, t.clientY);
    }, { passive: false });
    canvas.addEventListener('touchend', (e) => {
      e.preventDefault();
      this.handleUp();
    }, { passive: false });

    window.addEventListener('resize', () => this.updateScale());
  }

  updateScale(): void {
    const rect = this.canvas.getBoundingClientRect();
    this.scaleX = GAME_W / rect.width;
    this.scaleY = GAME_H / rect.height;
    this.offsetX = rect.left;
    this.offsetY = rect.top;
  }

  private toGame(clientX: number, clientY: number): [number, number] {
    return [
      (clientX - this.offsetX) * this.scaleX,
      (clientY - this.offsetY) * this.scaleY,
    ];
  }

  private handleDown(cx: number, cy: number): void {
    const [gx, gy] = this.toGame(cx, cy);
    this.x = gx;
    this.y = gy;
    this.isDown = true;
    this.dragStartX = gx;
    this.dragStartY = gy;
    this.dx = 0;
    this.dy = 0;
    for (const h of this.downHandlers) h(gx, gy);
  }

  private handleMove(cx: number, cy: number): void {
    const [gx, gy] = this.toGame(cx, cy);
    this.dx = gx - this.x;
    this.dy = gy - this.y;
    this.x = gx;
    this.y = gy;
    for (const h of this.moveHandlers) h(gx, gy);
  }

  private handleUp(): void {
    this.isDown = false;
    this.dx = 0;
    this.dy = 0;
    for (const h of this.upHandlers) h();
  }

  onDown(fn: (x: number, y: number) => void): void { this.downHandlers.push(fn); }
  onMove(fn: (x: number, y: number) => void): void { this.moveHandlers.push(fn); }
  onUp(fn: () => void): void { this.upHandlers.push(fn); }

  clearHandlers(): void {
    this.downHandlers = [];
    this.moveHandlers = [];
    this.upHandlers = [];
  }
}
