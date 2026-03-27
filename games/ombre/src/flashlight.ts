// ─── Flashlight Rendering & Mask ─────────────────────────────────────

import { type Vec2, GAME_W, GAME_H, FLASHLIGHT } from './types';

let currentPos: Vec2 = { x: GAME_W / 2, y: GAME_H / 2 };
let targetPos: Vec2 = { x: GAME_W / 2, y: GAME_H / 2 };
let wobbleTime = 0;

export function setFlashlightTarget(x: number, y: number): void {
  targetPos = { x, y };
}

export function getFlashlightPos(): Vec2 {
  return { ...currentPos };
}

export function updateFlashlight(dt: number): void {
  wobbleTime += dt * 1000;
  currentPos.x += (targetPos.x - currentPos.x) * FLASHLIGHT.lerpSpeed;
  currentPos.y += (targetPos.y - currentPos.y) * FLASHLIGHT.lerpSpeed;
}

export function applyDarknessMask(ctx: CanvasRenderingContext2D): void {
  const wx = Math.sin(wobbleTime * FLASHLIGHT.wobbleSpeed) * FLASHLIGHT.wobbleAmount;
  const wy = Math.cos(wobbleTime * FLASHLIGHT.wobbleSpeed * 0.7) * FLASHLIGHT.wobbleAmount * 0.6;
  const fx = currentPos.x + wx;
  const fy = currentPos.y + wy;

  // Use destination-in to keep only the lit area from the scene
  ctx.save();
  ctx.globalCompositeOperation = 'destination-in';

  const grad = ctx.createRadialGradient(
    fx, fy, 0,
    fx, fy, FLASHLIGHT.outerRadius,
  );
  grad.addColorStop(0, 'rgba(255,255,255,1)');
  grad.addColorStop(0.3, 'rgba(255,255,255,0.9)');
  grad.addColorStop(0.5, 'rgba(255,255,255,0.5)');
  grad.addColorStop(0.7, 'rgba(255,255,255,0.15)');
  grad.addColorStop(0.85, 'rgba(255,255,255,0.05)');
  grad.addColorStop(1, 'rgba(255,255,255,0.01)');

  ctx.fillStyle = grad;
  ctx.fillRect(0, 0, GAME_W, GAME_H);
  ctx.restore();

  // Warm tint in the lit area
  ctx.save();
  ctx.globalCompositeOperation = 'screen';
  const warmGrad = ctx.createRadialGradient(fx, fy, 0, fx, fy, FLASHLIGHT.innerRadius);
  warmGrad.addColorStop(0, 'rgba(255,245,224,0.08)');
  warmGrad.addColorStop(1, 'rgba(255,245,224,0)');
  ctx.fillStyle = warmGrad;
  ctx.fillRect(0, 0, GAME_W, GAME_H);
  ctx.restore();

  // Subtle ambient light so it's not pure black
  ctx.save();
  ctx.globalCompositeOperation = 'lighter';
  ctx.fillStyle = 'rgba(10,10,25,0.12)';
  ctx.fillRect(0, 0, GAME_W, GAME_H);
  ctx.restore();
}

export function drawFlashlightCursor(ctx: CanvasRenderingContext2D): void {
  const wx = Math.sin(wobbleTime * FLASHLIGHT.wobbleSpeed) * FLASHLIGHT.wobbleAmount;
  const wy = Math.cos(wobbleTime * FLASHLIGHT.wobbleSpeed * 0.7) * FLASHLIGHT.wobbleAmount * 0.6;
  const fx = currentPos.x + wx;
  const fy = currentPos.y + wy;

  // Small crosshair
  ctx.save();
  ctx.strokeStyle = 'rgba(255,245,224,0.4)';
  ctx.lineWidth = 1;
  ctx.beginPath();
  ctx.arc(fx, fy, 6, 0, Math.PI * 2);
  ctx.stroke();
  ctx.beginPath();
  ctx.moveTo(fx - 10, fy);
  ctx.lineTo(fx - 4, fy);
  ctx.moveTo(fx + 4, fy);
  ctx.lineTo(fx + 10, fy);
  ctx.moveTo(fx, fy - 10);
  ctx.lineTo(fx, fy - 4);
  ctx.moveTo(fx, fy + 4);
  ctx.lineTo(fx, fy + 10);
  ctx.stroke();
  ctx.restore();
}
