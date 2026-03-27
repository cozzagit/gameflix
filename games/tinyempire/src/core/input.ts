// ============================================================
// TinyEmpire — Input Manager
// ============================================================

import type { InputState } from '../types/index.ts';

// The game's virtual (internal) canvas resolution.
const VIRTUAL_W = 480;
const VIRTUAL_H = 270;

// How far the pointer must move before a press is considered a drag.
const DRAG_THRESHOLD = 4;

/**
 * Manages mouse, keyboard, and touch input.
 *
 * All coordinates are normalised to canvas-space (0-480, 0-270) regardless
 * of the physical display size.
 */
export class InputManager {
  private canvas: HTMLCanvasElement | null = null;

  // Internal mutable state — getState() returns a shallow copy.
  private state: InputState = {
    mouseX: 0,
    mouseY: 0,
    mouseDown: false,
    rightMouseDown: false,
    dragStartX: 0,
    dragStartY: 0,
    isDragging: false,
    keys: new Set<string>(),
  };

  // Track registered listener functions so we can remove them in destroy().
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  private readonly bound: Array<[string, EventListener]> = [];

  // Touch tracking for pinch-to-zoom.
  private touch0: Touch | null = null;
  private touch1: Touch | null = null;
  private lastPinchDist = 0;

  // Callback fired when the player zooms via wheel or pinch.
  // The delta is a zoom multiplier (e.g. 0.9 = zoom out, 1.1 = zoom in).
  onZoom: ((delta: number) => void) | null = null;

  // Callback fired when a single-finger drag or mouse drag pans the camera.
  // Delta is in canvas-space pixels (not yet divided by zoom).
  onPan: ((dx: number, dy: number) => void) | null = null;

  // ----------------------------------------------------------------
  // Initialisation / teardown
  // ----------------------------------------------------------------

  /** Attach all event listeners to the given canvas element. */
  init(canvas: HTMLCanvasElement): void {
    this.canvas = canvas;

    this.add('mousedown', this.onMouseDown);
    this.add('mouseup', this.onMouseUp);
    this.add('mousemove', this.onMouseMove);
    this.add('wheel', this.onWheel, { passive: false });
    this.add('contextmenu', this.onContextMenu);

    this.add('touchstart', this.onTouchStart, { passive: false });
    this.add('touchmove', this.onTouchMove, { passive: false });
    this.add('touchend', this.onTouchEnd, { passive: false });
    this.add('touchcancel', this.onTouchEnd, { passive: false });

    window.addEventListener('keydown', this.onKeyDown);
    window.addEventListener('keyup', this.onKeyUp);
  }

  /** Remove all attached event listeners. */
  destroy(): void {
    if (this.canvas) {
      for (const [type, handler] of this.bound) {
        this.canvas.removeEventListener(type, handler);
      }
    }
    this.bound.length = 0;
    window.removeEventListener('keydown', this.onKeyDown);
    window.removeEventListener('keyup', this.onKeyUp);
    this.canvas = null;
  }

  /** Return a snapshot of the current input state. */
  getState(): InputState {
    return {
      ...this.state,
      keys: new Set(this.state.keys),
    };
  }

  // ----------------------------------------------------------------
  // Private helpers
  // ----------------------------------------------------------------

  /** Register a listener and remember it for later removal. */
  private add(
    type: string,
    handler: EventListener,
    options?: AddEventListenerOptions,
  ): void {
    this.bound.push([type, handler]);
    this.canvas!.addEventListener(type, handler, options);
  }

  /** Convert a ClientRect-relative position to virtual canvas coordinates. */
  private toCanvasCoords(clientX: number, clientY: number): { x: number; y: number } {
    const rect = this.canvas!.getBoundingClientRect();
    const scaleX = VIRTUAL_W / rect.width;
    const scaleY = VIRTUAL_H / rect.height;
    return {
      x: (clientX - rect.left) * scaleX,
      y: (clientY - rect.top) * scaleY,
    };
  }

  /** Euclidean distance between two Touch objects. */
  private pinchDistance(a: Touch, b: Touch): number {
    const dx = a.clientX - b.clientX;
    const dy = a.clientY - b.clientY;
    return Math.sqrt(dx * dx + dy * dy);
  }

  // ----------------------------------------------------------------
  // Mouse handlers
  // ----------------------------------------------------------------

  private readonly onMouseDown = (e: Event): void => {
    const me = e as MouseEvent;
    const { x, y } = this.toCanvasCoords(me.clientX, me.clientY);
    this.state.mouseX = x;
    this.state.mouseY = y;

    if (me.button === 0) {
      this.state.mouseDown = true;
      this.state.dragStartX = x;
      this.state.dragStartY = y;
      this.state.isDragging = false;
    } else if (me.button === 2) {
      this.state.rightMouseDown = true;
    }
  };

  private readonly onMouseUp = (e: Event): void => {
    const me = e as MouseEvent;
    if (me.button === 0) {
      this.state.mouseDown = false;
      this.state.isDragging = false;
    } else if (me.button === 2) {
      this.state.rightMouseDown = false;
    }
  };

  private readonly onMouseMove = (e: Event): void => {
    const me = e as MouseEvent;
    const { x, y } = this.toCanvasCoords(me.clientX, me.clientY);
    const prevX = this.state.mouseX;
    const prevY = this.state.mouseY;

    this.state.mouseX = x;
    this.state.mouseY = y;

    if (this.state.mouseDown) {
      // Upgrade to drag once the threshold is exceeded.
      if (!this.state.isDragging) {
        const dx = x - this.state.dragStartX;
        const dy = y - this.state.dragStartY;
        if (Math.sqrt(dx * dx + dy * dy) > DRAG_THRESHOLD) {
          this.state.isDragging = true;
        }
      }

      if (this.state.isDragging && this.onPan) {
        this.onPan(prevX - x, prevY - y);
      }
    }
  };

  private readonly onWheel = (e: Event): void => {
    e.preventDefault();
    const we = e as WheelEvent;
    // Normalise delta — browsers report different magnitudes.
    const delta = we.deltaY > 0 ? 0.9 : 1.1;
    if (this.onZoom) this.onZoom(delta);
  };

  private readonly onContextMenu = (e: Event): void => {
    e.preventDefault();
  };

  // ----------------------------------------------------------------
  // Touch handlers
  // ----------------------------------------------------------------

  private readonly onTouchStart = (e: Event): void => {
    e.preventDefault();
    const te = e as TouchEvent;

    if (te.touches.length === 1) {
      this.touch0 = te.touches[0];
      this.touch1 = null;
      const { x, y } = this.toCanvasCoords(this.touch0.clientX, this.touch0.clientY);
      this.state.mouseX = x;
      this.state.mouseY = y;
      this.state.mouseDown = true;
      this.state.dragStartX = x;
      this.state.dragStartY = y;
      this.state.isDragging = false;
    } else if (te.touches.length >= 2) {
      this.touch0 = te.touches[0];
      this.touch1 = te.touches[1];
      this.lastPinchDist = this.pinchDistance(this.touch0, this.touch1);
      // Cancel any single-finger drag state while pinching.
      this.state.mouseDown = false;
      this.state.isDragging = false;
    }
  };

  private readonly onTouchMove = (e: Event): void => {
    e.preventDefault();
    const te = e as TouchEvent;

    if (te.touches.length === 1 && this.touch1 === null) {
      const touch = te.touches[0];
      const { x, y } = this.toCanvasCoords(touch.clientX, touch.clientY);
      const prevX = this.state.mouseX;
      const prevY = this.state.mouseY;
      this.state.mouseX = x;
      this.state.mouseY = y;

      if (this.state.mouseDown) {
        if (!this.state.isDragging) {
          const dx = x - this.state.dragStartX;
          const dy = y - this.state.dragStartY;
          if (Math.sqrt(dx * dx + dy * dy) > DRAG_THRESHOLD) {
            this.state.isDragging = true;
          }
        }
        if (this.state.isDragging && this.onPan) {
          this.onPan(prevX - x, prevY - y);
        }
      }
      this.touch0 = touch;
    } else if (te.touches.length >= 2) {
      const a = te.touches[0];
      const b = te.touches[1];
      const dist = this.pinchDistance(a, b);
      if (this.lastPinchDist > 0 && this.onZoom) {
        this.onZoom(dist / this.lastPinchDist);
      }
      this.lastPinchDist = dist;
      this.touch0 = a;
      this.touch1 = b;
    }
  };

  private readonly onTouchEnd = (e: Event): void => {
    e.preventDefault();
    const te = e as TouchEvent;

    if (te.touches.length === 0) {
      this.state.mouseDown = false;
      this.state.isDragging = false;
      this.touch0 = null;
      this.touch1 = null;
      this.lastPinchDist = 0;
    } else if (te.touches.length === 1) {
      // One finger lifted during a pinch — revert to single-touch pan mode.
      this.touch0 = te.touches[0];
      this.touch1 = null;
      this.lastPinchDist = 0;
    }
  };

  // ----------------------------------------------------------------
  // Keyboard handlers (attached to window so they always fire)
  // ----------------------------------------------------------------

  private readonly onKeyDown = (e: KeyboardEvent): void => {
    this.state.keys.add(e.code);
  };

  private readonly onKeyUp = (e: KeyboardEvent): void => {
    this.state.keys.delete(e.code);
  };
}
