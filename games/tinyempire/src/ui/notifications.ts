// ============================================================
// TinyEmpire — Toast Notification Manager
// ============================================================
//
// Queues toast messages that slide in from the right side of the
// screen, stack vertically, and auto-dismiss after 2.5 seconds.
// Renders in screen-space above the HUD.
// ============================================================

export type NotificationColor = 'green' | 'red' | 'gold' | 'blue';

const TOAST_W      = 140;
const TOAST_H      = 18;
const TOAST_MARGIN = 3;   // gap between stacked toasts
const TOAST_PAD_X  = 6;   // internal horizontal padding
const ACCENT_W     = 3;   // left color bar width
const SLIDE_TIME   = 0.3; // seconds for slide-in / slide-out
const STAY_TIME    = 2.5; // seconds toast is fully visible
const TOTAL_TIME   = SLIDE_TIME + STAY_TIME + SLIDE_TIME;
const MAX_TOASTS   = 4;

const COLOR_MAP: Record<NotificationColor, string> = {
  green: '#60C040',
  red:   '#E04040',
  gold:  '#FFD040',
  blue:  '#3090D0',
};

interface Toast {
  message: string;
  color: NotificationColor;
  timer: number;  // seconds elapsed since spawn
}

export class NotificationManager {
  private readonly toasts: Toast[] = [];

  /** Queue a new notification toast. */
  add(message: string, color: NotificationColor): void {
    // If already at cap, remove the oldest entry
    if (this.toasts.length >= MAX_TOASTS) {
      this.toasts.shift();
    }
    this.toasts.push({ message, color, timer: 0 });
  }

  /** Advance all toast timers by dt seconds, removing expired ones. */
  update(dt: number): void {
    for (const toast of this.toasts) {
      toast.timer += dt;
    }
    // Remove expired toasts
    let i = this.toasts.length;
    while (i--) {
      if (this.toasts[i].timer >= TOTAL_TIME) {
        this.toasts.splice(i, 1);
      }
    }
  }

  /** Draw all active toasts onto the canvas. */
  render(
    ctx: CanvasRenderingContext2D,
    canvasWidth: number,
    canvasHeight: number,
  ): void {
    if (this.toasts.length === 0) return;

    ctx.save();

    // Toasts stack upward from the bottom-right, with a small margin
    // from the right and bottom edges.
    const baseRightX   = canvasWidth  - 4;          // right edge of toast
    const baseBottomY  = canvasHeight - 14;          // bottom of lowest toast
    const stackUnitH   = TOAST_H + TOAST_MARGIN;

    for (let i = 0; i < this.toasts.length; i++) {
      const toast = this.toasts[i];

      // Slide offset: toast slides in from the right
      let slideOffset: number;
      if (toast.timer < SLIDE_TIME) {
        // Sliding in: starts offscreen, slides to 0
        const progress = toast.timer / SLIDE_TIME;
        slideOffset = TOAST_W * (1 - this.easeOut(progress));
      } else if (toast.timer < SLIDE_TIME + STAY_TIME) {
        slideOffset = 0;
      } else {
        // Sliding out
        const progress = (toast.timer - SLIDE_TIME - STAY_TIME) / SLIDE_TIME;
        slideOffset = TOAST_W * this.easeIn(progress);
      }

      // Position: stack toasts from the bottom upward
      const slotIndex  = i; // 0 = newest (bottom), older = higher
      const toastX = baseRightX - TOAST_W + slideOffset;
      const toastY = baseBottomY - slotIndex * stackUnitH - TOAST_H;

      // Background
      ctx.fillStyle = 'rgba(58, 42, 26, 0.90)';
      ctx.fillRect(toastX, toastY, TOAST_W, TOAST_H);

      // Border
      ctx.strokeStyle = '#C8A050';
      ctx.lineWidth = 1;
      ctx.strokeRect(toastX + 0.5, toastY + 0.5, TOAST_W - 1, TOAST_H - 1);

      // Colored left accent bar
      ctx.fillStyle = COLOR_MAP[toast.color];
      ctx.fillRect(toastX, toastY, ACCENT_W, TOAST_H);

      // Message text
      ctx.fillStyle = '#F0E8D0';
      ctx.font = '7px "Segoe UI", Arial, sans-serif';
      ctx.textBaseline = 'middle';
      ctx.textAlign = 'left';

      // Clip text to fit within the toast (truncate with ellipsis if needed)
      const maxTextW = TOAST_W - ACCENT_W - TOAST_PAD_X * 2;
      const label = this.truncateText(ctx, toast.message, maxTextW);
      ctx.fillText(label, toastX + ACCENT_W + TOAST_PAD_X, toastY + TOAST_H / 2);
    }

    ctx.textAlign = 'left';
    ctx.textBaseline = 'alphabetic';
    ctx.restore();
  }

  // --------------------------------------------------------------------------
  // Helpers
  // --------------------------------------------------------------------------

  private easeOut(t: number): number {
    return 1 - (1 - t) * (1 - t);
  }

  private easeIn(t: number): number {
    return t * t;
  }

  private truncateText(
    ctx: CanvasRenderingContext2D,
    text: string,
    maxWidth: number,
  ): string {
    if (ctx.measureText(text).width <= maxWidth) return text;
    const ellipsis = '...';
    let trimmed = text;
    while (trimmed.length > 0 && ctx.measureText(trimmed + ellipsis).width > maxWidth) {
      trimmed = trimmed.slice(0, -1);
    }
    return trimmed + ellipsis;
  }
}
