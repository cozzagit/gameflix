/**
 * GameflixSDK Client — Use this in your game to communicate with the platform.
 *
 * Usage:
 *   import { GameflixClient } from '../_sdk/client';
 *   const gf = new GameflixClient();
 *   gf.onInit((data) => { /* start game with user data */ });
 *   gf.submitScore(1500, { level: 5, moves: 12 });
 *   gf.completeGame(1500, { level: 5 });
 */

import type {
  GameflixMessage,
  GameflixInitPayload,
  GameflixScorePayload,
  GameflixCompletePayload,
  GameflixEventPayload,
} from './types';

export class GameflixClient {
  private initCallback: ((data: GameflixInitPayload) => void) | null = null;
  private pauseCallback: (() => void) | null = null;
  private resumeCallback: (() => void) | null = null;
  private exitCallback: (() => void) | null = null;
  private isEmbedded: boolean;

  constructor() {
    this.isEmbedded = window.parent !== window;

    if (this.isEmbedded) {
      window.addEventListener('message', this.handleMessage.bind(this));
      this.send('GAMEFLIX_READY', {});
    }
  }

  private handleMessage(event: MessageEvent): void {
    const msg = event.data as GameflixMessage;
    if (!msg || !msg.type) return;

    switch (msg.type) {
      case 'GAMEFLIX_INIT':
        this.initCallback?.(msg.payload as unknown as GameflixInitPayload);
        break;
      case 'GAMEFLIX_PAUSE':
        this.pauseCallback?.();
        break;
      case 'GAMEFLIX_RESUME':
        this.resumeCallback?.();
        break;
      case 'GAMEFLIX_EXIT':
        this.exitCallback?.();
        break;
    }
  }

  private send(type: string, payload: Record<string, unknown>): void {
    if (this.isEmbedded) {
      window.parent.postMessage({ type, payload }, '*');
    }
  }

  /** Register callback for when platform sends initialization data */
  onInit(callback: (data: GameflixInitPayload) => void): void {
    this.initCallback = callback;
  }

  /** Register callback for when platform requests pause */
  onPause(callback: () => void): void {
    this.pauseCallback = callback;
  }

  /** Register callback for when platform requests resume */
  onResume(callback: () => void): void {
    this.resumeCallback = callback;
  }

  /** Register callback for when user exits */
  onExit(callback: () => void): void {
    this.exitCallback = callback;
  }

  /** Submit a score to the platform */
  submitScore(score: number, metadata?: Record<string, unknown>, isDaily?: boolean): void {
    const payload: GameflixScorePayload = { score, metadata, isDaily };
    this.send('GAMEFLIX_SCORE', payload as unknown as Record<string, unknown>);
  }

  /** Notify the platform that the game/level is complete */
  completeGame(score: number, metadata?: Record<string, unknown>): void {
    const payload: GameflixCompletePayload = { score, metadata };
    this.send('GAMEFLIX_COMPLETE', payload as unknown as Record<string, unknown>);
  }

  /** Track a custom event */
  trackEvent(event: string, data?: Record<string, unknown>): void {
    const payload: GameflixEventPayload = { event, data };
    this.send('GAMEFLIX_EVENT', payload as unknown as Record<string, unknown>);
  }

  /** Check if running inside Gameflix platform */
  get isInPlatform(): boolean {
    return this.isEmbedded;
  }

  /** Destroy the client and remove event listeners */
  destroy(): void {
    window.removeEventListener('message', this.handleMessage.bind(this));
  }
}
