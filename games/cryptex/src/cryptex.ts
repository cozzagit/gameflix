import {
  WheelState,
  ALPHABET,
  ALPHABET_LEN,
  WHEEL_WIDTH,
  WHEEL_GAP,
  LETTER_SNAP_PX,
  DWELL_TIME_MS,
  clamp,
} from './types';
import { playWheelClick } from './audio';

/**
 * Manages the mechanical cryptex: wheel states, rotation, drag handling,
 * solve detection with dwell time.
 */
export class Cryptex {
  wheels: WheelState[] = [];
  targetWord = '';
  solved = false;
  dwellStart = 0;
  dwellActive = false;
  hintedPositions: Set<number> = new Set();
  bodyX = 0;
  bodyY = 0;
  bodyW = 0;
  bodyH = 0;

  /** Initialize for a new word */
  init(word: string, centerX: number, centerY: number): void {
    this.targetWord = word.toUpperCase();
    this.solved = false;
    this.dwellStart = 0;
    this.dwellActive = false;
    this.hintedPositions = new Set();

    const numWheels = this.targetWord.length;
    const totalW = numWheels * WHEEL_WIDTH + (numWheels - 1) * WHEEL_GAP;
    const startX = centerX - totalW / 2;

    this.bodyW = totalW + 80;
    this.bodyH = 220;
    this.bodyX = centerX - this.bodyW / 2;
    this.bodyY = centerY - this.bodyH / 2;

    this.wheels = [];
    for (let i = 0; i < numWheels; i++) {
      // Start at random letter (not the answer)
      let startIdx: number;
      const correctIdx = ALPHABET.indexOf(this.targetWord[i]);
      do {
        startIdx = Math.floor(Math.random() * ALPHABET_LEN);
      } while (startIdx === correctIdx);

      this.wheels.push({
        index: i,
        currentLetterIndex: startIdx,
        targetLetterIndex: startIdx,
        animOffset: 0,
        isDragging: false,
        dragStartY: 0,
        dragAccum: 0,
        x: startX + i * (WHEEL_WIDTH + WHEEL_GAP) + WHEEL_WIDTH / 2,
        y: centerY,
      });
    }
  }

  /** Get the bounding rect of a wheel for hit testing */
  getWheelRect(w: WheelState): { x: number; y: number; w: number; h: number } {
    return {
      x: w.x - WHEEL_WIDTH / 2,
      y: w.y - 90,
      w: WHEEL_WIDTH,
      h: 180,
    };
  }

  /** Find which wheel (if any) contains point */
  hitTestWheel(px: number, py: number): WheelState | null {
    for (const w of this.wheels) {
      const r = this.getWheelRect(w);
      if (px >= r.x && px <= r.x + r.w && py >= r.y && py <= r.y + r.h) {
        return w;
      }
    }
    return null;
  }

  /** Start dragging a wheel */
  startDrag(wheel: WheelState, y: number): void {
    wheel.isDragging = true;
    wheel.dragStartY = y;
    wheel.dragAccum = 0;
    this.dwellActive = false;
  }

  /** Update drag */
  updateDrag(wheel: WheelState, y: number): boolean {
    if (!wheel.isDragging) return false;

    const dy = y - wheel.dragStartY;
    wheel.dragAccum += dy;
    wheel.dragStartY = y;

    // Smooth visual offset
    wheel.animOffset += dy;

    let clicked = false;
    // Check if we've accumulated enough drag for a letter change
    while (wheel.dragAccum >= LETTER_SNAP_PX) {
      wheel.dragAccum -= LETTER_SNAP_PX;
      wheel.targetLetterIndex = (wheel.targetLetterIndex - 1 + ALPHABET_LEN) % ALPHABET_LEN;
      clicked = true;
    }
    while (wheel.dragAccum <= -LETTER_SNAP_PX) {
      wheel.dragAccum += LETTER_SNAP_PX;
      wheel.targetLetterIndex = (wheel.targetLetterIndex + 1) % ALPHABET_LEN;
      clicked = true;
    }

    if (clicked) {
      playWheelClick();
      this.dwellActive = false;
    }

    return clicked;
  }

  /** End drag */
  endDrag(wheel: WheelState): void {
    wheel.isDragging = false;
    wheel.dragAccum = 0;
  }

  /** Reveal a hint -- set one un-hinted wheel to correct letter */
  revealHint(): boolean {
    // Find wheels not yet hinted and not already correct
    const candidates: number[] = [];
    for (let i = 0; i < this.wheels.length; i++) {
      if (this.hintedPositions.has(i)) continue;
      const correctIdx = ALPHABET.indexOf(this.targetWord[i]);
      if (this.wheels[i].currentLetterIndex !== correctIdx) {
        candidates.push(i);
      }
    }
    if (candidates.length === 0) return false;

    const idx = candidates[Math.floor(Math.random() * candidates.length)];
    const correctIdx = ALPHABET.indexOf(this.targetWord[idx]);
    this.wheels[idx].targetLetterIndex = correctIdx;
    this.hintedPositions.add(idx);
    playWheelClick();
    return true;
  }

  /** Animate wheels toward their targets, return true if any is animating */
  animate(): boolean {
    let animating = false;
    for (const w of this.wheels) {
      // Snap animation offset toward 0 when not dragging
      if (!w.isDragging) {
        w.animOffset *= 0.7;
        if (Math.abs(w.animOffset) < 0.5) {
          w.animOffset = 0;
        }
      }

      // Animate current letter index to target
      if (w.currentLetterIndex !== w.targetLetterIndex) {
        w.currentLetterIndex = w.targetLetterIndex;
        animating = true;
      }
    }
    return animating;
  }

  /** Check if all wheels spell the correct word */
  isCorrect(): boolean {
    for (let i = 0; i < this.wheels.length; i++) {
      const letter = ALPHABET[this.wheels[i].currentLetterIndex];
      if (letter !== this.targetWord[i]) return false;
    }
    return true;
  }

  /** Get the currently spelled word */
  getCurrentWord(): string {
    return this.wheels.map(w => ALPHABET[w.currentLetterIndex]).join('');
  }

  /** Update dwell logic -- returns true if just solved */
  updateDwell(now: number): boolean {
    if (this.solved) return false;

    const anyDragging = this.wheels.some(w => w.isDragging);
    if (anyDragging) {
      this.dwellActive = false;
      return false;
    }

    if (this.isCorrect()) {
      if (!this.dwellActive) {
        this.dwellActive = true;
        this.dwellStart = now;
      } else if (now - this.dwellStart >= DWELL_TIME_MS) {
        this.solved = true;
        return true;
      }
    } else {
      this.dwellActive = false;
    }

    return false;
  }
}
