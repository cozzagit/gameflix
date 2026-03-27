// ============================================================
// TinyEmpire — Entry Point
// ============================================================

import { Game } from './game.ts';

const game = new Game('game');
game.init();
game.start();

// Expose for debugging in the browser console
(window as any).__game = game;
