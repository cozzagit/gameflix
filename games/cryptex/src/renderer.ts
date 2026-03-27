import {
  CANVAS_W, CANVAS_H, COLORS, WHEEL_WIDTH, WHEEL_HEIGHT,
  ALPHABET, ALPHABET_LEN, LETTER_HEIGHT,
  toRoman, easeOutCubic, lerp,
} from './types';
import { Cryptex } from './cryptex';
import { ParticleSystem } from './effects';

/**
 * All rendering for the Cryptex game.
 * Draws the scene, parchment, cryptex device, wheels, and UI.
 */
export class Renderer {
  private ctx: CanvasRenderingContext2D;
  private bgPattern: CanvasPattern | null = null;
  private frameCount = 0;

  constructor(ctx: CanvasRenderingContext2D) {
    this.ctx = ctx;
    this.createBgPattern();
  }

  private createBgPattern(): void {
    const c = document.createElement('canvas');
    c.width = 128;
    c.height = 128;
    const cx = c.getContext('2d')!;

    // Dark leather texture
    cx.fillStyle = COLORS.bg;
    cx.fillRect(0, 0, 128, 128);

    for (let i = 0; i < 800; i++) {
      const x = Math.random() * 128;
      const y = Math.random() * 128;
      const a = 0.02 + Math.random() * 0.06;
      cx.fillStyle = Math.random() > 0.5
        ? `rgba(255,220,180,${a})`
        : `rgba(0,0,0,${a})`;
      cx.fillRect(x, y, 1 + Math.random() * 2, 1);
    }

    this.bgPattern = this.ctx.createPattern(c, 'repeat');
  }

  /** Draw the full background */
  drawBackground(): void {
    const ctx = this.ctx;
    this.frameCount++;

    // Base dark background
    ctx.fillStyle = COLORS.bg;
    ctx.fillRect(0, 0, CANVAS_W, CANVAS_H);

    // Leather texture
    if (this.bgPattern) {
      ctx.fillStyle = this.bgPattern;
      ctx.fillRect(0, 0, CANVAS_W, CANVAS_H);
    }

    // Vignette
    const vignette = ctx.createRadialGradient(
      CANVAS_W / 2, CANVAS_H / 2, CANVAS_W * 0.25,
      CANVAS_W / 2, CANVAS_H / 2, CANVAS_W * 0.7
    );
    vignette.addColorStop(0, 'rgba(0,0,0,0)');
    vignette.addColorStop(1, 'rgba(0,0,0,0.5)');
    ctx.fillStyle = vignette;
    ctx.fillRect(0, 0, CANVAS_W, CANVAS_H);

    // Warm light from top-left
    const warmLight = ctx.createRadialGradient(
      200, 100, 50,
      CANVAS_W / 2, CANVAS_H / 2, CANVAS_W * 0.6
    );
    warmLight.addColorStop(0, 'rgba(255,200,100,0.06)');
    warmLight.addColorStop(0.5, 'rgba(255,180,80,0.02)');
    warmLight.addColorStop(1, 'rgba(0,0,0,0)');
    ctx.fillStyle = warmLight;
    ctx.fillRect(0, 0, CANVAS_W, CANVAS_H);
  }

  /** Draw the parchment scroll with clue */
  drawParchment(clue: string, levelNum: number, category: string): void {
    const ctx = this.ctx;
    const px = CANVAS_W / 2 - 340;
    const py = 40;
    const pw = 680;
    const ph = 145;

    ctx.save();

    // Shadow
    ctx.shadowColor = 'rgba(0,0,0,0.5)';
    ctx.shadowBlur = 20;
    ctx.shadowOffsetY = 5;

    // Parchment body
    const parchGrad = ctx.createLinearGradient(px, py, px, py + ph);
    parchGrad.addColorStop(0, '#DDD0B4');
    parchGrad.addColorStop(0.3, COLORS.parchment);
    parchGrad.addColorStop(0.7, COLORS.parchment);
    parchGrad.addColorStop(1, COLORS.parchmentDark);

    // Rounded rectangle
    const r = 8;
    ctx.beginPath();
    ctx.moveTo(px + r, py);
    ctx.lineTo(px + pw - r, py);
    ctx.arcTo(px + pw, py, px + pw, py + r, r);
    ctx.lineTo(px + pw, py + ph - r);
    ctx.arcTo(px + pw, py + ph, px + pw - r, py + ph, r);
    ctx.lineTo(px + r, py + ph);
    ctx.arcTo(px, py + ph, px, py + ph - r, r);
    ctx.lineTo(px, py + r);
    ctx.arcTo(px, py, px + r, py, r);
    ctx.closePath();

    ctx.fillStyle = parchGrad;
    ctx.fill();

    ctx.shadowColor = 'transparent';

    // Parchment texture - subtle lines
    ctx.save();
    ctx.clip();
    for (let y = 0; y < ph; y += 4) {
      ctx.strokeStyle = `rgba(160,140,110,${0.05 + Math.random() * 0.05})`;
      ctx.lineWidth = 0.5;
      ctx.beginPath();
      ctx.moveTo(px, py + y);
      ctx.lineTo(px + pw, py + y);
      ctx.stroke();
    }
    // Aged spots
    for (let i = 0; i < 15; i++) {
      const sx = px + Math.random() * pw;
      const sy = py + Math.random() * ph;
      ctx.fillStyle = `rgba(140,120,90,${0.03 + Math.random() * 0.05})`;
      ctx.beginPath();
      ctx.arc(sx, sy, 3 + Math.random() * 8, 0, Math.PI * 2);
      ctx.fill();
    }
    ctx.restore();

    // Border
    ctx.strokeStyle = COLORS.parchmentEdge;
    ctx.lineWidth = 2;
    ctx.beginPath();
    ctx.moveTo(px + r, py);
    ctx.lineTo(px + pw - r, py);
    ctx.arcTo(px + pw, py, px + pw, py + r, r);
    ctx.lineTo(px + pw, py + ph - r);
    ctx.arcTo(px + pw, py + ph, px + pw - r, py + ph, r);
    ctx.lineTo(px + r, py + ph);
    ctx.arcTo(px, py + ph, px, py + ph - r, r);
    ctx.lineTo(px, py + r);
    ctx.arcTo(px, py, px + r, py, r);
    ctx.closePath();
    ctx.stroke();

    // Wax seal (top-left corner area)
    this.drawWaxSeal(px + 45, py + ph / 2);

    // Level number in Roman numerals (top-right)
    ctx.font = '600 16px "Georgia", "Times New Roman", serif';
    ctx.fillStyle = COLORS.parchmentEdge;
    ctx.textAlign = 'right';
    ctx.textBaseline = 'top';
    ctx.fillText(`Livello ${toRoman(levelNum)}`, px + pw - 20, py + 14);

    // Category
    ctx.font = 'italic 13px "Georgia", "Times New Roman", serif';
    ctx.fillStyle = 'rgba(44,24,16,0.5)';
    ctx.fillText(category, px + pw - 20, py + 34);

    // Clue text - centered, italic serif
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';

    const maxWidth = pw - 140;
    const lines = this.wrapText(clue, maxWidth, 'italic 22px "Georgia", "Times New Roman", serif');

    ctx.font = 'italic 22px "Georgia", "Times New Roman", serif';
    ctx.fillStyle = COLORS.textSepia;

    const lineHeight = 28;
    const totalTextH = lines.length * lineHeight;
    const startY = py + ph / 2 - totalTextH / 2 + lineHeight / 2;

    // Decorative quote marks
    ctx.font = 'italic 36px "Georgia", "Times New Roman", serif';
    ctx.fillStyle = 'rgba(44,24,16,0.25)';
    if (lines.length > 0) {
      const firstLineW = this.measureLineWidth(lines[0], 'italic 22px "Georgia", "Times New Roman", serif');
      ctx.fillText('\u00AB', CANVAS_W / 2 - firstLineW / 2 - 18, startY);
      const lastLineW = this.measureLineWidth(lines[lines.length - 1], 'italic 22px "Georgia", "Times New Roman", serif');
      ctx.fillText('\u00BB', CANVAS_W / 2 + lastLineW / 2 + 18, startY + (lines.length - 1) * lineHeight);
    }

    ctx.font = 'italic 22px "Georgia", "Times New Roman", serif';
    ctx.fillStyle = COLORS.textSepia;
    for (let i = 0; i < lines.length; i++) {
      ctx.fillText(lines[i], CANVAS_W / 2 + 20, startY + i * lineHeight);
    }

    ctx.restore();
  }

  private measureLineWidth(text: string, font: string): number {
    this.ctx.save();
    this.ctx.font = font;
    const w = this.ctx.measureText(text).width;
    this.ctx.restore();
    return w;
  }

  private drawWaxSeal(cx: number, cy: number): void {
    const ctx = this.ctx;

    // Seal blob with irregular edge
    ctx.save();
    ctx.beginPath();
    const points = 24;
    for (let i = 0; i <= points; i++) {
      const a = (i / points) * Math.PI * 2;
      const r = 22 + Math.sin(a * 5) * 3 + Math.cos(a * 3) * 2;
      const x = cx + Math.cos(a) * r;
      const y = cy + Math.sin(a) * r;
      if (i === 0) ctx.moveTo(x, y);
      else ctx.lineTo(x, y);
    }
    ctx.closePath();

    const sealGrad = ctx.createRadialGradient(cx - 4, cy - 4, 2, cx, cy, 24);
    sealGrad.addColorStop(0, '#B22222');
    sealGrad.addColorStop(0.5, COLORS.waxRed);
    sealGrad.addColorStop(1, '#5B0E0E');
    ctx.fillStyle = sealGrad;
    ctx.fill();

    // Embossed 'C' for Cryptex
    ctx.font = 'bold 22px "Georgia", serif';
    ctx.fillStyle = 'rgba(200,160,120,0.4)';
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.fillText('C', cx, cy + 1);

    ctx.font = 'bold 22px "Georgia", serif';
    ctx.fillStyle = 'rgba(255,200,160,0.2)';
    ctx.fillText('C', cx - 0.5, cy - 0.5);

    ctx.restore();
  }

  /** Draw the cryptex device */
  drawCryptexDevice(cryptex: Cryptex, solveProgress: number): void {
    const ctx = this.ctx;
    const { bodyX, bodyY, bodyW, bodyH } = cryptex;

    ctx.save();

    // If solving, animate the split
    if (solveProgress > 0) {
      this.drawSolvingCryptex(cryptex, solveProgress);
      ctx.restore();
      return;
    }

    // Shadow under device
    ctx.save();
    ctx.fillStyle = 'rgba(0,0,0,0.4)';
    ctx.beginPath();
    const shadowRx = bodyW / 2;
    const shadowRy = 12;
    ctx.ellipse(bodyX + bodyW / 2, bodyY + bodyH + 8, shadowRx, shadowRy, 0, 0, Math.PI * 2);
    ctx.fill();
    ctx.restore();

    // Metal end caps
    this.drawEndCap(bodyX - 10, bodyY, 30, bodyH);
    this.drawEndCap(bodyX + bodyW - 20, bodyY, 30, bodyH);

    // Wood body
    this.drawWoodBody(bodyX + 12, bodyY + 5, bodyW - 24, bodyH - 10);

    // Brass frame (top and bottom rails)
    this.drawBrassRail(bodyX + 10, bodyY - 2, bodyW - 20, 14);
    this.drawBrassRail(bodyX + 10, bodyY + bodyH - 12, bodyW - 20, 14);

    // Selection line markers
    const markerY1 = bodyY + bodyH / 2 - LETTER_HEIGHT / 2 - 2;
    const markerY2 = bodyY + bodyH / 2 + LETTER_HEIGHT / 2 + 2;
    ctx.strokeStyle = COLORS.goldDim;
    ctx.lineWidth = 1.5;
    ctx.setLineDash([4, 4]);
    ctx.beginPath();
    ctx.moveTo(bodyX + 30, markerY1);
    ctx.lineTo(bodyX + bodyW - 30, markerY1);
    ctx.moveTo(bodyX + 30, markerY2);
    ctx.lineTo(bodyX + bodyW - 30, markerY2);
    ctx.stroke();
    ctx.setLineDash([]);

    // Small triangle markers on sides
    ctx.fillStyle = COLORS.brassLight;
    const markerCY = bodyY + bodyH / 2;
    // Left
    ctx.beginPath();
    ctx.moveTo(bodyX + 18, markerCY);
    ctx.lineTo(bodyX + 26, markerCY - 6);
    ctx.lineTo(bodyX + 26, markerCY + 6);
    ctx.closePath();
    ctx.fill();
    // Right
    ctx.beginPath();
    ctx.moveTo(bodyX + bodyW - 18, markerCY);
    ctx.lineTo(bodyX + bodyW - 26, markerCY - 6);
    ctx.lineTo(bodyX + bodyW - 26, markerCY + 6);
    ctx.closePath();
    ctx.fill();

    // Wheels
    for (const wheel of cryptex.wheels) {
      this.drawWheel(wheel, cryptex.hintedPositions.has(wheel.index));
    }

    ctx.restore();
  }

  private drawSolvingCryptex(cryptex: Cryptex, progress: number): void {
    const ctx = this.ctx;
    const { bodyX, bodyY, bodyW, bodyH } = cryptex;

    const splitDist = easeOutCubic(Math.min(progress * 2, 1)) * 60;
    const glowAlpha = Math.min(progress * 3, 1) * (1 - Math.max(0, (progress - 0.7) / 0.3));

    // Golden glow from center
    if (glowAlpha > 0) {
      const glow = ctx.createRadialGradient(
        bodyX + bodyW / 2, bodyY + bodyH / 2, 10,
        bodyX + bodyW / 2, bodyY + bodyH / 2, 200
      );
      glow.addColorStop(0, `rgba(255,215,0,${glowAlpha * 0.6})`);
      glow.addColorStop(0.3, `rgba(245,208,97,${glowAlpha * 0.3})`);
      glow.addColorStop(1, 'rgba(255,215,0,0)');
      ctx.fillStyle = glow;
      ctx.fillRect(bodyX - 200, bodyY - 200, bodyW + 400, bodyH + 400);
    }

    // Draw left half
    ctx.save();
    ctx.translate(-splitDist, 0);
    ctx.globalAlpha = 1 - progress * 0.5;
    this.drawEndCap(bodyX - 10, bodyY, 30, bodyH);
    this.drawWoodBody(bodyX + 12, bodyY + 5, bodyW / 2 - 30, bodyH - 10);
    this.drawBrassRail(bodyX + 10, bodyY - 2, bodyW / 2 - 20, 14);
    this.drawBrassRail(bodyX + 10, bodyY + bodyH - 12, bodyW / 2 - 20, 14);
    ctx.restore();

    // Draw right half
    ctx.save();
    ctx.translate(splitDist, 0);
    ctx.globalAlpha = 1 - progress * 0.5;
    this.drawEndCap(bodyX + bodyW - 20, bodyY, 30, bodyH);
    this.drawWoodBody(bodyX + bodyW / 2 + 18, bodyY + 5, bodyW / 2 - 30, bodyH - 10);
    this.drawBrassRail(bodyX + bodyW / 2 + 10, bodyY - 2, bodyW / 2 - 20, 14);
    this.drawBrassRail(bodyX + bodyW / 2 + 10, bodyY + bodyH - 12, bodyW / 2 - 20, 14);
    ctx.restore();

    // Answer text floating up
    if (progress > 0.3) {
      const textAlpha = Math.min((progress - 0.3) / 0.3, 1);
      const textY = bodyY + bodyH / 2 - easeOutCubic(Math.min((progress - 0.3) * 2, 1)) * 20;
      ctx.save();
      ctx.globalAlpha = textAlpha;
      ctx.font = 'bold 48px "Georgia", "Times New Roman", serif';
      ctx.fillStyle = COLORS.gold;
      ctx.textAlign = 'center';
      ctx.textBaseline = 'middle';
      ctx.shadowColor = 'rgba(255,215,0,0.6)';
      ctx.shadowBlur = 20;
      ctx.fillText(cryptex.targetWord, bodyX + bodyW / 2, textY);
      ctx.restore();
    }
  }

  private drawEndCap(x: number, y: number, w: number, h: number): void {
    const ctx = this.ctx;
    const r = 10;

    // Brass gradient
    const grad = ctx.createLinearGradient(x, y, x, y + h);
    grad.addColorStop(0, COLORS.brassHighlight);
    grad.addColorStop(0.2, COLORS.brassLight);
    grad.addColorStop(0.5, COLORS.brass);
    grad.addColorStop(0.8, COLORS.brassDark);
    grad.addColorStop(1, '#6B4E0A');

    ctx.beginPath();
    ctx.moveTo(x + r, y);
    ctx.lineTo(x + w - r, y);
    ctx.arcTo(x + w, y, x + w, y + r, r);
    ctx.lineTo(x + w, y + h - r);
    ctx.arcTo(x + w, y + h, x + w - r, y + h, r);
    ctx.lineTo(x + r, y + h);
    ctx.arcTo(x, y + h, x, y + h - r, r);
    ctx.lineTo(x, y + r);
    ctx.arcTo(x, y, x + r, y, r);
    ctx.closePath();

    ctx.fillStyle = grad;
    ctx.fill();

    // Ornate circles on end cap
    const cx = x + w / 2;
    const cy = y + h / 2;
    ctx.strokeStyle = 'rgba(255,215,0,0.3)';
    ctx.lineWidth = 1;
    ctx.beginPath();
    ctx.arc(cx, cy, Math.min(w, h) * 0.35, 0, Math.PI * 2);
    ctx.stroke();
    ctx.beginPath();
    ctx.arc(cx, cy, Math.min(w, h) * 0.2, 0, Math.PI * 2);
    ctx.stroke();

    // Highlight line on top
    ctx.strokeStyle = 'rgba(255,255,200,0.2)';
    ctx.lineWidth = 1;
    ctx.beginPath();
    ctx.moveTo(x + 4, y + 3);
    ctx.lineTo(x + w - 4, y + 3);
    ctx.stroke();
  }

  private drawWoodBody(x: number, y: number, w: number, h: number): void {
    const ctx = this.ctx;

    // Base wood color
    const woodGrad = ctx.createLinearGradient(x, y, x, y + h);
    woodGrad.addColorStop(0, COLORS.woodLight);
    woodGrad.addColorStop(0.3, COLORS.woodMid);
    woodGrad.addColorStop(0.7, COLORS.wood);
    woodGrad.addColorStop(1, '#2E1B17');

    ctx.fillStyle = woodGrad;
    ctx.fillRect(x, y, w, h);

    // Wood grain lines
    ctx.save();
    ctx.beginPath();
    ctx.rect(x, y, w, h);
    ctx.clip();

    for (let gy = 0; gy < h; gy += 3) {
      const alpha = 0.06 + Math.random() * 0.06;
      ctx.strokeStyle = `rgba(30,15,10,${alpha})`;
      ctx.lineWidth = 0.8;
      ctx.beginPath();
      for (let gx = 0; gx < w; gx += 2) {
        const wave = Math.sin(gx * 0.015 + gy * 0.08) * 1.5 + Math.sin(gx * 0.04) * 0.5;
        if (gx === 0) {
          ctx.moveTo(x + gx, y + gy + wave);
        } else {
          ctx.lineTo(x + gx, y + gy + wave);
        }
      }
      ctx.stroke();
    }
    ctx.restore();
  }

  private drawBrassRail(x: number, y: number, w: number, h: number): void {
    const ctx = this.ctx;

    const grad = ctx.createLinearGradient(x, y, x, y + h);
    grad.addColorStop(0, COLORS.brassHighlight);
    grad.addColorStop(0.3, COLORS.brassLight);
    grad.addColorStop(0.6, COLORS.brass);
    grad.addColorStop(1, COLORS.brassDark);

    ctx.fillStyle = grad;
    ctx.fillRect(x, y, w, h);

    // Subtle engraved line
    ctx.strokeStyle = 'rgba(0,0,0,0.15)';
    ctx.lineWidth = 0.5;
    ctx.beginPath();
    ctx.moveTo(x + 5, y + h / 2);
    ctx.lineTo(x + w - 5, y + h / 2);
    ctx.stroke();

    // Highlight
    ctx.strokeStyle = 'rgba(255,255,200,0.15)';
    ctx.beginPath();
    ctx.moveTo(x + 5, y + 2);
    ctx.lineTo(x + w - 5, y + 2);
    ctx.stroke();
  }

  /** Draw a single letter wheel */
  drawWheel(wheel: import('./types').WheelState, isHinted: boolean): void {
    const ctx = this.ctx;
    const { x, y, currentLetterIndex, animOffset } = wheel;
    const halfW = WHEEL_WIDTH / 2;
    const halfH = WHEEL_HEIGHT / 2;

    ctx.save();

    // Wheel background -- brass disc with cylindrical shading
    const discGrad = ctx.createLinearGradient(x - halfW, y, x + halfW, y);
    discGrad.addColorStop(0, '#7A5E1A');
    discGrad.addColorStop(0.15, COLORS.brass);
    discGrad.addColorStop(0.4, COLORS.brassLight);
    discGrad.addColorStop(0.5, COLORS.brassHighlight);
    discGrad.addColorStop(0.6, COLORS.brassLight);
    discGrad.addColorStop(0.85, COLORS.brass);
    discGrad.addColorStop(1, '#7A5E1A');

    ctx.fillStyle = discGrad;
    ctx.fillRect(x - halfW, y - halfH, WHEEL_WIDTH, WHEEL_HEIGHT);

    // Clip to wheel area
    ctx.save();
    ctx.beginPath();
    ctx.rect(x - halfW + 2, y - halfH + 2, WHEEL_WIDTH - 4, WHEEL_HEIGHT - 4);
    ctx.clip();

    // Horizontal engraving lines on brass (decorative)
    for (let ly = -halfH; ly < halfH; ly += 8) {
      ctx.strokeStyle = `rgba(26,26,46,${0.04 + Math.abs(ly) / halfH * 0.02})`;
      ctx.lineWidth = 0.5;
      ctx.beginPath();
      ctx.moveTo(x - halfW + 4, y + ly);
      ctx.lineTo(x + halfW - 4, y + ly);
      ctx.stroke();
    }

    // Draw letters (prev, current, next) with smooth animation offset
    const offset = animOffset;
    for (let d = -2; d <= 2; d++) {
      const letterIdx = ((currentLetterIndex + d) % ALPHABET_LEN + ALPHABET_LEN) % ALPHABET_LEN;
      const letter = ALPHABET[letterIdx];
      const ly = y + d * LETTER_HEIGHT + offset;

      // Distance from center for fading
      const distFromCenter = Math.abs(ly - y);
      const maxDist = LETTER_HEIGHT * 2;

      if (distFromCenter > maxDist) continue;

      const fade = 1 - distFromCenter / maxDist;
      const scale = 0.6 + fade * 0.4;

      ctx.save();
      ctx.translate(x, ly);
      ctx.scale(scale, scale);

      // Letter shadow (engraved effect)
      if (d === 0 && Math.abs(offset) < 5) {
        // Current letter - bright
        ctx.font = '600 32px "Georgia", "Times New Roman", serif';
        ctx.fillStyle = `rgba(26,26,46,${0.8 * fade})`;
        ctx.textAlign = 'center';
        ctx.textBaseline = 'middle';
        ctx.fillText(letter, 1, 1);

        ctx.fillStyle = isHinted
          ? `rgba(255,215,0,${fade})`
          : `rgba(26,26,46,${fade})`;
        ctx.fillText(letter, 0, 0);

        // Top light
        ctx.fillStyle = `rgba(255,240,200,${0.15 * fade})`;
        ctx.fillText(letter, -0.5, -0.5);
      } else {
        // Adjacent letters - faded
        ctx.font = '600 28px "Georgia", "Times New Roman", serif';
        ctx.fillStyle = `rgba(26,26,46,${0.3 * fade})`;
        ctx.textAlign = 'center';
        ctx.textBaseline = 'middle';
        ctx.fillText(letter, 0, 0);
      }

      ctx.restore();
    }

    ctx.restore(); // un-clip

    // Wheel borders (top/bottom grooves)
    ctx.strokeStyle = 'rgba(0,0,0,0.3)';
    ctx.lineWidth = 1;
    ctx.strokeRect(x - halfW, y - halfH, WHEEL_WIDTH, WHEEL_HEIGHT);

    // Top and bottom gradient fade for clipping effect
    const fadeH = 30;
    const topFade = ctx.createLinearGradient(x, y - halfH, x, y - halfH + fadeH);
    topFade.addColorStop(0, 'rgba(140,110,30,0.9)');
    topFade.addColorStop(1, 'rgba(140,110,30,0)');
    ctx.fillStyle = topFade;
    ctx.fillRect(x - halfW + 1, y - halfH + 1, WHEEL_WIDTH - 2, fadeH);

    const botFade = ctx.createLinearGradient(x, y + halfH - fadeH, x, y + halfH);
    botFade.addColorStop(0, 'rgba(100,80,20,0)');
    botFade.addColorStop(1, 'rgba(100,80,20,0.9)');
    ctx.fillStyle = botFade;
    ctx.fillRect(x - halfW + 1, y + halfH - fadeH, WHEEL_WIDTH - 2, fadeH);

    // Hinted glow
    if (isHinted) {
      const t = Math.sin(this.frameCount * 0.06) * 0.3 + 0.5;
      ctx.strokeStyle = `rgba(255,215,0,${t * 0.6})`;
      ctx.lineWidth = 2;
      ctx.strokeRect(x - halfW - 1, y - halfH - 1, WHEEL_WIDTH + 2, WHEEL_HEIGHT + 2);
    }

    // Drag indicator - subtle highlight when hovering
    if (wheel.isDragging) {
      ctx.fillStyle = 'rgba(255,255,255,0.05)';
      ctx.fillRect(x - halfW, y - halfH, WHEEL_WIDTH, WHEEL_HEIGHT);
    }

    ctx.restore();
  }

  /** Draw the hint button */
  drawHintButton(x: number, y: number, w: number, h: number, hintsUsed: number, maxHints: number): void {
    const ctx = this.ctx;
    const available = hintsUsed < maxHints;

    ctx.save();

    // Button shape
    const r = h / 2;
    ctx.beginPath();
    ctx.moveTo(x + r, y);
    ctx.lineTo(x + w - r, y);
    ctx.arc(x + w - r, y + r, r, -Math.PI / 2, Math.PI / 2);
    ctx.lineTo(x + r, y + h);
    ctx.arc(x + r, y + r, r, Math.PI / 2, -Math.PI / 2);
    ctx.closePath();

    if (available) {
      const grad = ctx.createLinearGradient(x, y, x, y + h);
      grad.addColorStop(0, COLORS.brassLight);
      grad.addColorStop(1, COLORS.brassDark);
      ctx.fillStyle = grad;
    } else {
      ctx.fillStyle = 'rgba(80,60,40,0.5)';
    }
    ctx.fill();

    ctx.strokeStyle = available ? COLORS.brass : 'rgba(80,60,40,0.3)';
    ctx.lineWidth = 1;
    ctx.stroke();

    // Text
    ctx.font = '14px "Georgia", serif';
    ctx.fillStyle = available ? COLORS.letterEngrave : 'rgba(100,80,60,0.5)';
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.fillText(`Suggerimento (${maxHints - hintsUsed})`, x + w / 2, y + h / 2);

    ctx.restore();
  }

  /** Draw timer */
  drawTimer(seconds: number, x: number, y: number): void {
    const ctx = this.ctx;
    const m = Math.floor(seconds / 60);
    const s = Math.floor(seconds % 60);
    const timeStr = `${m}:${s.toString().padStart(2, '0')}`;

    ctx.save();
    ctx.font = '20px "Georgia", serif';
    ctx.fillStyle = COLORS.parchmentDark;
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.fillText(timeStr, x, y);
    ctx.restore();
  }

  /** Draw back button */
  drawBackButton(x: number, y: number, w: number, h: number): void {
    const ctx = this.ctx;

    ctx.save();
    ctx.fillStyle = 'rgba(80,60,40,0.4)';
    ctx.strokeStyle = COLORS.brassDark;
    ctx.lineWidth = 1;

    const r = 4;
    ctx.beginPath();
    ctx.moveTo(x + r, y);
    ctx.lineTo(x + w - r, y);
    ctx.arcTo(x + w, y, x + w, y + r, r);
    ctx.lineTo(x + w, y + h - r);
    ctx.arcTo(x + w, y + h, x + w - r, y + h, r);
    ctx.lineTo(x + r, y + h);
    ctx.arcTo(x, y + h, x, y + h - r, r);
    ctx.lineTo(x, y + r);
    ctx.arcTo(x, y, x + r, y, r);
    ctx.closePath();
    ctx.fill();
    ctx.stroke();

    // Arrow and text
    ctx.font = '14px "Georgia", serif';
    ctx.fillStyle = COLORS.parchmentDark;
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.fillText('\u2190 Indietro', x + w / 2, y + h / 2);

    ctx.restore();
  }

  /** Word wrap helper */
  private wrapText(text: string, maxWidth: number, font: string): string[] {
    const ctx = this.ctx;
    ctx.save();
    ctx.font = font;

    const words = text.split(' ');
    const lines: string[] = [];
    let currentLine = '';

    for (const word of words) {
      const testLine = currentLine ? `${currentLine} ${word}` : word;
      if (ctx.measureText(testLine).width > maxWidth && currentLine) {
        lines.push(currentLine);
        currentLine = word;
      } else {
        currentLine = testLine;
      }
    }
    if (currentLine) lines.push(currentLine);

    ctx.restore();
    return lines;
  }
}
