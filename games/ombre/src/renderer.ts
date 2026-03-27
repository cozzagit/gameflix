// ─── Shared Rendering Utilities ──────────────────────────────────────

/** Draw a rounded rectangle */
export function roundRect(
  ctx: CanvasRenderingContext2D,
  x: number, y: number, w: number, h: number, r: number,
): void {
  ctx.beginPath();
  ctx.moveTo(x + r, y);
  ctx.lineTo(x + w - r, y);
  ctx.quadraticCurveTo(x + w, y, x + w, y + r);
  ctx.lineTo(x + w, y + h - r);
  ctx.quadraticCurveTo(x + w, y + h, x + w - r, y + h);
  ctx.lineTo(x + r, y + h);
  ctx.quadraticCurveTo(x, y + h, x, y + h - r);
  ctx.lineTo(x, y + r);
  ctx.quadraticCurveTo(x, y, x + r, y);
  ctx.closePath();
}

/** Draw wood-grain pattern on a filled rect (deterministic — no Math.random) */
export function drawWoodGrain(
  ctx: CanvasRenderingContext2D,
  x: number, y: number, w: number, h: number,
  color: string = 'rgba(30,20,10,0.25)',
): void {
  ctx.strokeStyle = color;
  ctx.lineWidth = 0.5;
  for (let ly = y; ly < y + h; ly += 7) {
    ctx.beginPath();
    ctx.moveTo(x, ly);
    for (let lx = x; lx <= x + w; lx += 10) {
      ctx.lineTo(lx, ly + Math.sin(lx * 0.03 + ly * 0.1) * 2);
    }
    ctx.stroke();
  }
}

/** Draw a simple book spine */
export function drawBook(
  ctx: CanvasRenderingContext2D,
  x: number, y: number, w: number, h: number,
  color: string, titleColor: string = '#C0B090',
): void {
  ctx.fillStyle = color;
  roundRect(ctx, x, y, w, h, 2);
  ctx.fill();
  // Spine lines
  ctx.strokeStyle = 'rgba(0,0,0,0.3)';
  ctx.lineWidth = 0.5;
  ctx.beginPath();
  ctx.moveTo(x + 2, y + 3);
  ctx.lineTo(x + w - 2, y + 3);
  ctx.moveTo(x + 2, y + h - 3);
  ctx.lineTo(x + w - 2, y + h - 3);
  ctx.stroke();
  // Title mark
  ctx.fillStyle = titleColor;
  ctx.fillRect(x + 3, y + h * 0.35, w - 6, 3);
}

/** Draw a candle with flickering flame */
export function drawCandle(
  ctx: CanvasRenderingContext2D,
  x: number, y: number, h: number, time: number,
  waxColor: string = '#F5E6CA',
): void {
  // Wax body
  ctx.fillStyle = waxColor;
  roundRect(ctx, x - 6, y - h, 12, h, 2);
  ctx.fill();
  // Wick
  ctx.strokeStyle = '#333';
  ctx.lineWidth = 1;
  ctx.beginPath();
  ctx.moveTo(x, y - h);
  ctx.lineTo(x, y - h - 6);
  ctx.stroke();
  // Flame
  const flicker = Math.sin(time * 0.01) * 2 + Math.sin(time * 0.023) * 1.5;
  const flameH = 10 + flicker;
  const grad = ctx.createRadialGradient(x, y - h - 6 - flameH / 2, 0, x, y - h - 6 - flameH / 2, flameH);
  grad.addColorStop(0, 'rgba(255,255,200,0.9)');
  grad.addColorStop(0.3, 'rgba(255,180,50,0.7)');
  grad.addColorStop(1, 'rgba(255,100,20,0)');
  ctx.fillStyle = grad;
  ctx.beginPath();
  ctx.ellipse(x + flicker * 0.3, y - h - 6 - flameH / 2, 4 + flicker * 0.2, flameH / 2, 0, 0, Math.PI * 2);
  ctx.fill();
  // Glow
  const glowGrad = ctx.createRadialGradient(x, y - h - 10, 0, x, y - h - 10, 40);
  glowGrad.addColorStop(0, 'rgba(255,200,80,0.06)');
  glowGrad.addColorStop(1, 'rgba(255,200,80,0)');
  ctx.fillStyle = glowGrad;
  ctx.fillRect(x - 40, y - h - 50, 80, 80);
}

/** Draw a wall with subtle brick/plaster texture */
export function drawWall(
  ctx: CanvasRenderingContext2D,
  x: number, y: number, w: number, h: number,
  color1: string, color2: string,
): void {
  const grad = ctx.createLinearGradient(x, y, x, y + h);
  grad.addColorStop(0, color1);
  grad.addColorStop(1, color2);
  ctx.fillStyle = grad;
  ctx.fillRect(x, y, w, h);
  // Subtle texture (deterministic)
  ctx.fillStyle = 'rgba(0,0,0,0.02)';
  for (let ty = y; ty < y + h; ty += 20) {
    for (let tx = x; tx < x + w; tx += 30) {
      if (((tx * 7 + ty * 13) % 11) > 5) {
        ctx.fillRect(tx, ty, 25, 15);
      }
    }
  }
}

/** Draw a window with rain effect */
export function drawWindow(
  ctx: CanvasRenderingContext2D,
  x: number, y: number, w: number, h: number,
  time: number, hasRain: boolean = true,
): void {
  // Frame
  ctx.fillStyle = '#3E2F1C';
  ctx.fillRect(x - 4, y - 4, w + 8, h + 8);
  // Glass
  const glassGrad = ctx.createLinearGradient(x, y, x + w, y + h);
  glassGrad.addColorStop(0, '#1A1A3E');
  glassGrad.addColorStop(0.5, '#252548');
  glassGrad.addColorStop(1, '#1A1A3E');
  ctx.fillStyle = glassGrad;
  ctx.fillRect(x, y, w, h);
  // Cross bars
  ctx.fillStyle = '#3E2F1C';
  ctx.fillRect(x + w / 2 - 2, y, 4, h);
  ctx.fillRect(x, y + h / 2 - 2, w, 4);
  // Rain drops on glass
  if (hasRain) {
    ctx.fillStyle = 'rgba(150,180,220,0.15)';
    for (let i = 0; i < 20; i++) {
      const rx = x + ((i * 53 + time * 0.01) % w);
      const ry = y + ((i * 37 + time * 0.02) % h);
      ctx.beginPath();
      ctx.ellipse(rx, ry, 1, 2, 0, 0, Math.PI * 2);
      ctx.fill();
    }
  }
}

/** Draw a picture frame */
export function drawFrame(
  ctx: CanvasRenderingContext2D,
  x: number, y: number, w: number, h: number,
  frameColor: string = '#5D3A1A',
): void {
  ctx.fillStyle = frameColor;
  ctx.fillRect(x - 6, y - 6, w + 12, h + 12);
  ctx.fillStyle = '#2A1A0A';
  ctx.fillRect(x - 3, y - 3, w + 6, h + 6);
  ctx.fillStyle = '#4A3520';
  ctx.fillRect(x, y, w, h);
}

/** Draw a floor */
export function drawFloor(
  ctx: CanvasRenderingContext2D,
  y: number, h: number,
  color1: string, color2: string,
): void {
  const grad = ctx.createLinearGradient(0, y, 0, y + h);
  grad.addColorStop(0, color1);
  grad.addColorStop(1, color2);
  ctx.fillStyle = grad;
  ctx.fillRect(0, y, 1200, h);
}

/** Draw text with shadow for readability */
export function drawTextShadow(
  ctx: CanvasRenderingContext2D,
  text: string,
  x: number, y: number,
  font: string,
  color: string,
  align: CanvasTextAlign = 'center',
): void {
  ctx.textAlign = align;
  ctx.font = font;
  ctx.fillStyle = 'rgba(0,0,0,0.6)';
  ctx.fillText(text, x + 2, y + 2);
  ctx.fillStyle = color;
  ctx.fillText(text, x, y);
}

/** Draw a clue highlight pulse when flashlight is on it */
export function drawClueHighlight(
  ctx: CanvasRenderingContext2D,
  x: number, y: number, radius: number, time: number,
): void {
  const pulse = 0.5 + Math.sin(time * 0.005) * 0.3;
  const grad = ctx.createRadialGradient(x, y, 0, x, y, radius * 2);
  grad.addColorStop(0, `rgba(255,215,0,${0.3 * pulse})`);
  grad.addColorStop(1, 'rgba(255,215,0,0)');
  ctx.fillStyle = grad;
  ctx.beginPath();
  ctx.arc(x, y, radius * 2, 0, Math.PI * 2);
  ctx.fill();
}

/** Draw magnifying glass icon for found clues */
export function drawMagnifyingGlass(
  ctx: CanvasRenderingContext2D,
  x: number, y: number, size: number,
): void {
  ctx.save();
  ctx.strokeStyle = '#10B981';
  ctx.lineWidth = 2;
  ctx.beginPath();
  ctx.arc(x, y, size, 0, Math.PI * 2);
  ctx.stroke();
  ctx.beginPath();
  ctx.moveTo(x + size * 0.7, y + size * 0.7);
  ctx.lineTo(x + size * 1.4, y + size * 1.4);
  ctx.stroke();
  // Check mark inside
  ctx.strokeStyle = '#10B981';
  ctx.lineWidth = 2;
  ctx.beginPath();
  ctx.moveTo(x - size * 0.3, y);
  ctx.lineTo(x - size * 0.05, y + size * 0.3);
  ctx.lineTo(x + size * 0.35, y - size * 0.25);
  ctx.stroke();
  ctx.restore();
}
