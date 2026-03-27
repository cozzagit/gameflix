// ============================================================
// TinyEmpire — Dual-Layer Canvas (Fullscreen Pixel Art + Sharp UI)
// ============================================================
//
// The display canvas fills the ENTIRE viewport.
//
// Layer 1 — Game world: rendered on an offscreen 480x270 canvas,
//   then scaled up to fill the display with nearest-neighbour.
//   Pixel art stays crisp because image-rendering: pixelated is set
//   in CSS AND we disable imageSmoothingEnabled on the blit.
//
// Layer 2 — UI/text: drawn directly on the display canvas at its
//   full native resolution using a scale transform that maps
//   480x270 logical coordinates to physical pixels. Text and
//   panels are razor-sharp at any screen size.
// ============================================================

/** Virtual (logical) game resolution — all game code uses this. */
export const CANVAS_WIDTH = 480;
export const CANVAS_HEIGHT = 270;

export interface CanvasHandle {
  canvas: HTMLCanvasElement;
  /** Context for GAME WORLD (480x270 offscreen — pixel art). */
  ctx: CanvasRenderingContext2D;
  /** Context for UI layer (native-res display canvas — sharp text). */
  uiCtx: CanvasRenderingContext2D;
  width: number;
  height: number;
  /** Blit game world to display, then prepare uiCtx for high-res UI drawing. */
  present: () => void;
  getScale: () => number;
}

export function setupCanvas(canvasId: string): CanvasHandle {
  const display = document.getElementById(canvasId) as HTMLCanvasElement | null;
  if (!display) throw new Error(`No <canvas> with id "${canvasId}"`);

  const displayCtx = display.getContext('2d');
  if (!displayCtx) throw new Error('Could not get 2D context');

  // Offscreen canvas at the game's virtual resolution
  const offscreen = document.createElement('canvas');
  offscreen.width = CANVAS_WIDTH;
  offscreen.height = CANVAS_HEIGHT;
  const ctx = offscreen.getContext('2d')!;
  ctx.imageSmoothingEnabled = false;

  let scaleX = 1;
  let scaleY = 1;
  let uniformScale = 1; // for UI coordinate mapping

  const resize = () => {
    const dpr = window.devicePixelRatio || 1;

    // Physical pixel dimensions of the viewport
    const physW = Math.round(window.innerWidth * dpr);
    const physH = Math.round(window.innerHeight * dpr);

    // Display canvas matches viewport exactly (fullscreen)
    display.width = physW;
    display.height = physH;
    display.style.width = '100vw';
    display.style.height = '100vh';
    display.style.position = 'fixed';
    display.style.left = '0';
    display.style.top = '0';
    display.style.transform = 'none';

    // Calculate scale factors for blitting 480x270 → full screen
    scaleX = physW / CANVAS_WIDTH;
    scaleY = physH / CANVAS_HEIGHT;

    // For the UI transform we use uniform scale (min of both)
    // so UI elements maintain their aspect ratio
    uniformScale = Math.min(scaleX, scaleY);
  };

  resize();
  window.addEventListener('resize', resize);

  const present = () => {
    // 1. Clear
    displayCtx.setTransform(1, 0, 0, 1, 0, 0);
    displayCtx.clearRect(0, 0, display.width, display.height);

    // 2. Blit pixel-art world — stretch to fill the entire display
    //    CSS image-rendering: pixelated ensures nearest-neighbour
    displayCtx.imageSmoothingEnabled = false;
    displayCtx.drawImage(
      offscreen,
      0, 0, CANVAS_WIDTH, CANVAS_HEIGHT,
      0, 0, display.width, display.height,
    );

    // 3. Set up transform for UI drawing:
    //    Map 480x270 logical coords → physical display pixels.
    //    Use scaleX/scaleY so UI fills the screen edge-to-edge.
    displayCtx.setTransform(scaleX, 0, 0, scaleY, 0, 0);
    displayCtx.imageSmoothingEnabled = true;
  };

  return {
    canvas: display,
    ctx,
    uiCtx: displayCtx,
    width: CANVAS_WIDTH,
    height: CANVAS_HEIGHT,
    present,
    getScale: () => uniformScale,
  };
}

export function clearCanvas(ctx: CanvasRenderingContext2D, width: number, height: number): void {
  ctx.fillStyle = '#2a3a1a';
  ctx.fillRect(0, 0, width, height);
}
