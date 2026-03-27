// ============================================================
// TinyEmpire — Animal Renderer
// ============================================================
//
// Draws roaming wildlife with pixel-art style animations.
// Deer: brown body, white tail flash, antlers
// Boar: dark body, tusks, bristly
// ============================================================

import type { Animal } from '../systems/animal-system.ts';

export class AnimalRenderer {
  render(ctx: CanvasRenderingContext2D, animals: Animal[], tick: number): void {
    for (const animal of animals) {
      if (!animal.alive) continue;
      const cx = Math.round(animal.pos.x);
      const cy = Math.round(animal.pos.y);

      ctx.save();

      // Ground shadow
      ctx.globalAlpha = 0.18;
      ctx.fillStyle = '#000000';
      ctx.beginPath();
      ctx.ellipse(cx, cy + 1, 4, 1.5, 0, 0, Math.PI * 2);
      ctx.fill();
      ctx.globalAlpha = 1;

      if (animal.type === 'deer') {
        this.drawDeer(ctx, cx, cy, animal, tick);
      } else {
        this.drawBoar(ctx, cx, cy, animal, tick);
      }

      ctx.restore();
    }
  }

  private drawDeer(
    ctx: CanvasRenderingContext2D,
    cx: number, cy: number,
    animal: Animal, tick: number,
  ): void {
    const dir = animal.facingRight ? 1 : -1;
    const isMoving = animal.targetPos !== null;
    const bob = isMoving ? (animal.animFrame % 2) * 0.5 : 0;

    // Legs (4, alternating when walking)
    ctx.fillStyle = '#6B4E2A';
    if (isMoving) {
      const legOff = (animal.animFrame % 2) * 2 - 1;
      ctx.fillRect(cx - 3 * dir, cy - 1 + legOff, 1, 3);
      ctx.fillRect(cx - 1 * dir, cy - 1 - legOff, 1, 3);
      ctx.fillRect(cx + 1 * dir, cy - 1 + legOff, 1, 3);
      ctx.fillRect(cx + 3 * dir, cy - 1 - legOff, 1, 3);
    } else {
      ctx.fillRect(cx - 3, cy - 1, 1, 2);
      ctx.fillRect(cx - 1, cy - 1, 1, 2);
      ctx.fillRect(cx + 1, cy - 1, 1, 2);
      ctx.fillRect(cx + 3, cy - 1, 1, 2);
    }

    // Body
    ctx.fillStyle = '#9B7B4A';
    ctx.fillRect(cx - 4, cy - 4 - bob, 8, 3);

    // Belly (lighter)
    ctx.fillStyle = '#C8A870';
    ctx.fillRect(cx - 3, cy - 2 - bob, 6, 1);

    // Head
    ctx.fillStyle = '#8B6B3A';
    ctx.fillRect(cx + 4 * dir, cy - 6 - bob, 3 * dir, 3);

    // Eye
    ctx.fillStyle = '#000000';
    ctx.fillRect(cx + 5 * dir, cy - 5 - bob, 1, 1);

    // Antlers (small V shape)
    ctx.strokeStyle = '#6B4E2A';
    ctx.lineWidth = 0.7;
    ctx.beginPath();
    ctx.moveTo(cx + 5 * dir, cy - 7 - bob);
    ctx.lineTo(cx + 6 * dir, cy - 9 - bob);
    ctx.moveTo(cx + 5 * dir, cy - 7 - bob);
    ctx.lineTo(cx + 4 * dir, cy - 9 - bob);
    ctx.stroke();

    // White tail (flashes when fleeing)
    if (animal.fleeTimer > 0 || tick % 40 < 20) {
      ctx.fillStyle = '#F0E8D0';
      ctx.fillRect(cx - 5 * dir, cy - 4 - bob, 1, 2);
    }
  }

  private drawBoar(
    ctx: CanvasRenderingContext2D,
    cx: number, cy: number,
    animal: Animal, _tick: number,
  ): void {
    const dir = animal.facingRight ? 1 : -1;
    const isMoving = animal.targetPos !== null;
    const bob = isMoving ? (animal.animFrame % 2) * 0.5 : 0;

    // Legs
    ctx.fillStyle = '#3A2A1A';
    if (isMoving) {
      const legOff = (animal.animFrame % 2) * 2 - 1;
      ctx.fillRect(cx - 3, cy - 1 + legOff, 1, 3);
      ctx.fillRect(cx - 1, cy - 1 - legOff, 1, 3);
      ctx.fillRect(cx + 1, cy - 1 + legOff, 1, 3);
      ctx.fillRect(cx + 3, cy - 1 - legOff, 1, 3);
    } else {
      for (let i = -3; i <= 3; i += 2) ctx.fillRect(cx + i, cy - 1, 1, 2);
    }

    // Body (wider, darker)
    ctx.fillStyle = '#5A4030';
    ctx.fillRect(cx - 5, cy - 5 - bob, 10, 4);

    // Bristles (darker back ridge)
    ctx.fillStyle = '#3A2A1A';
    ctx.fillRect(cx - 4, cy - 5 - bob, 8, 1);

    // Head
    ctx.fillStyle = '#5A4030';
    ctx.fillRect(cx + 4 * dir, cy - 5 - bob, 3 * dir, 3);

    // Snout
    ctx.fillStyle = '#8B6B4A';
    ctx.fillRect(cx + 6 * dir, cy - 4 - bob, 2 * dir, 2);

    // Tusks
    ctx.fillStyle = '#F0E8D0';
    ctx.fillRect(cx + 7 * dir, cy - 3 - bob, 1, 1);

    // Eye
    ctx.fillStyle = '#FF4040';
    ctx.fillRect(cx + 5 * dir, cy - 5 - bob, 1, 1);
  }
}
