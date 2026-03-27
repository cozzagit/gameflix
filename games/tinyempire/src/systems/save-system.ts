// ============================================================
// TinyEmpire — Save System
// ============================================================
//
// Serialises / deserialises GameState to localStorage.
// Auto-save fires at most once every 30 seconds.
// ============================================================

import type { GameState } from '../types/index.ts';

const SAVE_KEY = 'tinyempire_save';
const AUTO_SAVE_INTERVAL = 30; // seconds

export class SaveSystem {
  /**
   * Serialize the current GameState to JSON and write to localStorage.
   * Updates lastSaveTime on the state.
   */
  save(state: GameState): void {
    state.lastSaveTime = Date.now();
    try {
      const json = JSON.stringify(state);
      localStorage.setItem(SAVE_KEY, json);
    } catch (err) {
      console.error('[SaveSystem] Failed to save game:', err);
    }
  }

  /**
   * Load and deserialize GameState from localStorage.
   * Returns null if no save exists or if the data is corrupted.
   */
  load(): GameState | null {
    try {
      const raw = localStorage.getItem(SAVE_KEY);
      if (raw === null) return null;

      const parsed = JSON.parse(raw) as GameState;

      // Basic sanity check — ensure the top-level structure looks right
      if (
        typeof parsed !== 'object' ||
        parsed === null ||
        typeof parsed.resources !== 'object' ||
        !Array.isArray(parsed.buildings) ||
        !Array.isArray(parsed.units)
      ) {
        console.warn('[SaveSystem] Save data failed sanity check — discarding.');
        return null;
      }

      // Restore Set (keys are serialised as arrays by JSON.stringify)
      // GameState doesn't contain Sets, but guard just in case.

      return parsed;
    } catch (err) {
      console.warn('[SaveSystem] Corrupted save data — discarding.', err);
      return null;
    }
  }

  /**
   * Returns true if a save file exists in localStorage.
   */
  hasSave(): boolean {
    return localStorage.getItem(SAVE_KEY) !== null;
  }

  /**
   * Remove the save file from localStorage.
   */
  deleteSave(): void {
    localStorage.removeItem(SAVE_KEY);
  }

  /**
   * Save only if at least AUTO_SAVE_INTERVAL seconds have elapsed
   * since the last save.  Call this every game tick.
   */
  autoSave(state: GameState): void {
    const nowSec = Date.now() / 1000;
    const lastSaveSec = state.lastSaveTime / 1000;
    if (nowSec - lastSaveSec >= AUTO_SAVE_INTERVAL) {
      this.save(state);
    }
  }
}
