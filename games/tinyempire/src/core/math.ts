// ============================================================
// TinyEmpire — Core Math Utilities
// ============================================================

import type { Vec2 } from '../types/index.ts';

// --- Vector constructor ---

export function vec2(x: number, y: number): Vec2 {
  return { x, y };
}

// --- Scalar utilities ---

export function lerp(a: number, b: number, t: number): number {
  return a + (b - a) * t;
}

export function clamp(val: number, min: number, max: number): number {
  return val < min ? min : val > max ? max : val;
}

// --- Isometric projection ---
//
// Tile size: 32 wide × 16 tall (2:1 diamond)
// Origin is the screen-space anchor before camera transforms.
//
//   screenX = (col - row) * 16
//   screenY = (col + row) * 8

export function isoToScreen(col: number, row: number): Vec2 {
  return {
    x: (col - row) * 16,
    y: (col + row) * 8,
  };
}

// Inverse:
//   col = (sx/16 + sy/8) / 2
//   row = (sy/8 - sx/16) / 2

export function screenToIso(sx: number, sy: number): Vec2 {
  const a = sx / 16;
  const b = sy / 8;
  return {
    x: (a + b) / 2,   // col (fractional — floor for tile picking)
    y: (b - a) / 2,   // row (fractional)
  };
}

// --- Vec2 distance ---

export function distance(a: Vec2, b: Vec2): number {
  const dx = b.x - a.x;
  const dy = b.y - a.y;
  return Math.sqrt(dx * dx + dy * dy);
}

// --- Random helpers ---

export function randomRange(min: number, max: number): number {
  return min + Math.random() * (max - min);
}

export function randomInt(min: number, max: number): number {
  return Math.floor(randomRange(min, max + 1));
}
