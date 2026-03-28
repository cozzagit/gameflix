import { W, H, COL } from './types';
import type { LevelResult } from './types';
import { LEVELS } from './cave';

export class ScreenRenderer {
  private ctx: CanvasRenderingContext2D;

  constructor(canvas: HTMLCanvasElement) {
    this.ctx = canvas.getContext('2d')!;
  }

  // ── Title screen ──────────────────────────────────────
  drawTitle(time: number): void {
    const ctx = this.ctx;
    ctx.fillStyle = COL.bg;
    ctx.fillRect(0, 0, W, H);

    // Animated sonar rings in background
    for (let i = 0; i < 5; i++) {
      const r = ((time * 60 + i * 160) % 800);
      const alpha = (1 - r / 800) * 0.12;
      ctx.save();
      ctx.strokeStyle = COL.wave;
      ctx.globalAlpha = alpha;
      ctx.lineWidth = 1.5;
      ctx.shadowColor = COL.wave;
      ctx.shadowBlur = 8;
      ctx.beginPath();
      ctx.arc(W / 2, H / 2, r, 0, Math.PI * 2);
      ctx.stroke();
      ctx.restore();
    }

    // Title
    ctx.save();
    ctx.font = 'bold 80px "Segoe UI", system-ui, sans-serif';
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.fillStyle = COL.title;
    ctx.shadowColor = COL.title;
    ctx.shadowBlur = 30;
    ctx.fillText('ECO', W / 2, H / 2 - 60);

    // Subtitle
    ctx.font = '18px "Segoe UI", system-ui, sans-serif';
    ctx.fillStyle = COL.subtitle;
    ctx.shadowBlur = 0;
    ctx.fillText('Ecolocalizzazione nelle profondit\u00E0', W / 2, H / 2);

    // Start prompt
    const blink = 0.4 + Math.sin(time * 3) * 0.6;
    ctx.globalAlpha = blink;
    ctx.font = '16px "Segoe UI", system-ui, sans-serif';
    ctx.fillStyle = COL.hudBright;
    ctx.fillText('Clicca per iniziare', W / 2, H / 2 + 80);
    ctx.restore();

    // Instructions
    ctx.save();
    ctx.font = '13px "Segoe UI", system-ui, sans-serif';
    ctx.fillStyle = COL.hud;
    ctx.globalAlpha = 0.6;
    ctx.textAlign = 'center';
    ctx.fillText('WASD / Frecce: muovi  |  Click: emetti impulso sonoro', W / 2, H - 40);
    ctx.restore();
  }

  // ── Level select ──────────────────────────────────────
  drawLevelSelect(
    time: number,
    results: Map<number, LevelResult>,
    hoveredLevel: number,
  ): void {
    const ctx = this.ctx;
    ctx.fillStyle = COL.bg;
    ctx.fillRect(0, 0, W, H);

    // Title
    ctx.save();
    ctx.font = 'bold 36px "Segoe UI", system-ui, sans-serif';
    ctx.textAlign = 'center';
    ctx.fillStyle = COL.title;
    ctx.shadowColor = COL.title;
    ctx.shadowBlur = 15;
    ctx.fillText('Seleziona Livello', W / 2, 80);
    ctx.restore();

    // Level cards grid: 5 x 2
    const cols = 5;
    const cardW = 160;
    const cardH = 120;
    const gap = 20;
    const startX = (W - (cols * cardW + (cols - 1) * gap)) / 2;
    const startY = 140;

    for (let i = 0; i < LEVELS.length; i++) {
      const row = Math.floor(i / cols);
      const col = i % cols;
      const x = startX + col * (cardW + gap);
      const y = startY + row * (cardH + gap + 40);
      const level = LEVELS[i];
      const result = results.get(i);
      const isHovered = hoveredLevel === i;
      const unlocked = i === 0 || results.has(i - 1);

      ctx.save();

      // Card background
      if (unlocked) {
        ctx.fillStyle = isHovered ? 'rgba(6, 182, 212, 0.12)' : 'rgba(15, 23, 42, 0.6)';
        ctx.strokeStyle = isHovered ? COL.wave : 'rgba(6, 182, 212, 0.2)';
      } else {
        ctx.fillStyle = 'rgba(15, 23, 42, 0.3)';
        ctx.strokeStyle = 'rgba(100, 116, 139, 0.15)';
      }
      ctx.lineWidth = 1;
      roundRect(ctx, x, y, cardW, cardH, 8);
      ctx.fill();
      ctx.stroke();

      if (isHovered && unlocked) {
        ctx.shadowColor = COL.wave;
        ctx.shadowBlur = 15;
        ctx.stroke();
        ctx.shadowBlur = 0;
      }

      // Level number
      ctx.textAlign = 'center';
      ctx.font = 'bold 28px "Segoe UI", system-ui, sans-serif';
      ctx.fillStyle = unlocked ? COL.title : '#475569';
      ctx.fillText(`${i + 1}`, x + cardW / 2, y + 35);

      // Level name
      ctx.font = '12px "Segoe UI", system-ui, sans-serif';
      ctx.fillStyle = unlocked ? COL.subtitle : '#475569';
      ctx.fillText(level.name, x + cardW / 2, y + 60);

      // Stars
      if (result) {
        const starY = y + 85;
        for (let s = 0; s < 3; s++) {
          ctx.font = '18px "Segoe UI", system-ui, sans-serif';
          ctx.fillStyle = s < result.stars ? COL.crystal : '#334155';
          ctx.fillText('\u2605', x + cardW / 2 - 24 + s * 24, starY);
        }
      } else if (!unlocked) {
        ctx.font = '22px "Segoe UI", system-ui, sans-serif';
        ctx.fillStyle = '#475569';
        ctx.fillText('\uD83D\uDD12', x + cardW / 2, y + 88);
      }

      ctx.restore();
    }

    // Back hint
    ctx.save();
    ctx.font = '13px "Segoe UI", system-ui, sans-serif';
    ctx.fillStyle = COL.hud;
    ctx.globalAlpha = 0.5;
    ctx.textAlign = 'center';
    ctx.fillText('Premi ESC per tornare', W / 2, H - 30);
    ctx.restore();
  }

  // ── Level complete ────────────────────────────────────
  drawLevelComplete(result: LevelResult, time: number): void {
    const ctx = this.ctx;

    // Dark overlay
    ctx.fillStyle = 'rgba(2, 2, 8, 0.85)';
    ctx.fillRect(0, 0, W, H);

    ctx.save();
    ctx.textAlign = 'center';

    // Title
    ctx.font = 'bold 42px "Segoe UI", system-ui, sans-serif';
    ctx.fillStyle = COL.exit;
    ctx.shadowColor = COL.exit;
    ctx.shadowBlur = 20;
    ctx.fillText('Livello Completato!', W / 2, 200);
    ctx.shadowBlur = 0;

    // Level name
    ctx.font = '18px "Segoe UI", system-ui, sans-serif';
    ctx.fillStyle = COL.subtitle;
    ctx.fillText(LEVELS[result.level].name, W / 2, 245);

    // Stars
    for (let i = 0; i < 3; i++) {
      ctx.font = '40px "Segoe UI", system-ui, sans-serif';
      ctx.fillStyle = i < result.stars ? COL.crystal : '#334155';
      ctx.shadowColor = i < result.stars ? COL.crystal : 'transparent';
      ctx.shadowBlur = i < result.stars ? 15 : 0;
      ctx.fillText('\u2605', W / 2 - 50 + i * 50, 310);
    }
    ctx.shadowBlur = 0;

    // Stats
    ctx.font = '16px "Segoe UI", system-ui, sans-serif';
    ctx.fillStyle = COL.hudBright;
    const stats = [
      `Cristalli: ${result.crystalsCollected}/${result.crystalsTotal}`,
      `Impulsi rimasti: ${result.pulsesRemaining}`,
      `Tempo: ${Math.floor(result.timeSeconds)}s`,
      `Punteggio: ${result.score}`,
    ];
    stats.forEach((s, i) => {
      ctx.fillText(s, W / 2, 370 + i * 28);
    });

    // Continue prompt
    const blink = 0.4 + Math.sin(time * 3) * 0.6;
    ctx.globalAlpha = blink;
    ctx.fillStyle = COL.wave;
    ctx.font = '16px "Segoe UI", system-ui, sans-serif';
    if (result.level < LEVELS.length - 1) {
      ctx.fillText('Clicca per il prossimo livello', W / 2, 520);
    } else {
      ctx.fillText('Hai completato tutti i livelli! Clicca per continuare.', W / 2, 520);
    }
    ctx.restore();
  }

  // ── Game Over ─────────────────────────────────────────
  drawGameOver(reason: string, time: number): void {
    const ctx = this.ctx;

    ctx.fillStyle = 'rgba(2, 2, 8, 0.85)';
    ctx.fillRect(0, 0, W, H);

    ctx.save();
    ctx.textAlign = 'center';
    ctx.font = 'bold 42px "Segoe UI", system-ui, sans-serif';
    ctx.fillStyle = COL.hazard;
    ctx.shadowColor = COL.hazard;
    ctx.shadowBlur = 20;
    ctx.fillText('Fallito', W / 2, H / 2 - 40);
    ctx.shadowBlur = 0;

    ctx.font = '18px "Segoe UI", system-ui, sans-serif';
    ctx.fillStyle = COL.subtitle;
    ctx.fillText(reason, W / 2, H / 2 + 10);

    const blink = 0.4 + Math.sin(time * 3) * 0.6;
    ctx.globalAlpha = blink;
    ctx.fillStyle = COL.wave;
    ctx.font = '16px "Segoe UI", system-ui, sans-serif';
    ctx.fillText('Clicca per riprovare', W / 2, H / 2 + 70);
    ctx.restore();
  }

  /** Get which level card is hovered */
  getLevelAt(mx: number, my: number): number {
    const cols = 5;
    const cardW = 160;
    const cardH = 120;
    const gap = 20;
    const startX = (W - (cols * cardW + (cols - 1) * gap)) / 2;
    const startY = 140;

    for (let i = 0; i < LEVELS.length; i++) {
      const row = Math.floor(i / cols);
      const col = i % cols;
      const x = startX + col * (cardW + gap);
      const y = startY + row * (cardH + gap + 40);
      if (mx >= x && mx <= x + cardW && my >= y && my <= y + cardH) {
        return i;
      }
    }
    return -1;
  }
}

function roundRect(
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
