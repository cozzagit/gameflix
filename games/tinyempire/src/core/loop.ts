// ============================================================
// TinyEmpire — Fixed-Timestep Game Loop
// ============================================================

/**
 * A classic fixed-timestep loop decoupled from rendering.
 *
 * Logic (update) runs at a fixed rate (default 10 Hz) so game simulation is
 * deterministic regardless of frame rate.  Rendering runs every rAF frame and
 * receives an interpolation factor (0–1) so it can smooth-interpolate between
 * the previous and current tick state.
 *
 * Reference: https://gafferongames.com/post/fix_your_timestep/
 *
 * Example:
 *   const loop = new GameLoop({
 *     update: (dt) => world.tick(dt),
 *     render: (interp) => renderer.draw(interp),
 *     tickRate: 10,
 *   });
 *   loop.start();
 */

export interface GameLoopOptions {
  update: (dt: number) => void;
  render: (interp: number) => void;
  /** Logic updates per second. Default: 10 */
  tickRate?: number;
}

export class GameLoop {
  private readonly update: (dt: number) => void;
  private readonly render: (interp: number) => void;
  private readonly tickRate: number;
  private readonly dt: number; // fixed logic delta (seconds)

  private rafHandle = 0;
  private running = false;

  private lastTimestamp = 0;
  private accumulator = 0;

  // FPS tracking
  private frameCount = 0;
  private fpsTimer = 0;
  private _fps = 0;

  constructor(options: GameLoopOptions) {
    this.update = options.update;
    this.render = options.render;
    this.tickRate = options.tickRate ?? 10;
    this.dt = 1 / this.tickRate;
  }

  /** Current measured render frames-per-second. Updated once per second. */
  get fps(): number {
    return this._fps;
  }

  /** Start the loop. Idempotent — calling while already running is a no-op. */
  start(): void {
    if (this.running) return;
    this.running = true;
    this.lastTimestamp = performance.now();
    this.accumulator = 0;
    this.rafHandle = requestAnimationFrame(this.tick);
  }

  /** Stop the loop. */
  stop(): void {
    if (!this.running) return;
    this.running = false;
    cancelAnimationFrame(this.rafHandle);
    this.rafHandle = 0;
  }

  // ----------------------------------------------------------------
  // Main loop body — bound arrow so it can be passed directly to rAF.
  // ----------------------------------------------------------------

  private readonly tick = (timestamp: number): void => {
    if (!this.running) return;

    // --- Delta time ---
    let elapsed = (timestamp - this.lastTimestamp) / 1000; // seconds
    this.lastTimestamp = timestamp;

    // Guard against excessively large gaps (tab hidden, debugger paused, etc.).
    // Cap at 250 ms to prevent a "spiral of death".
    if (elapsed > 0.25) elapsed = 0.25;

    // --- Logic updates (fixed timestep) ---
    this.accumulator += elapsed;
    while (this.accumulator >= this.dt) {
      this.update(this.dt);
      this.accumulator -= this.dt;
    }

    // --- Render (every frame) ---
    // interp is 0-1: how far we are between the last tick and the next.
    const interp = this.accumulator / this.dt;
    this.render(interp);

    // --- FPS counter ---
    this.frameCount++;
    this.fpsTimer += elapsed;
    if (this.fpsTimer >= 1.0) {
      this._fps = Math.round(this.frameCount / this.fpsTimer);
      this.frameCount = 0;
      this.fpsTimer = 0;
    }

    this.rafHandle = requestAnimationFrame(this.tick);
  };
}
