import './style.css';
import { Game } from './game';
import { W, H } from './types';

function init(): void {
  const canvas = document.getElementById('game') as HTMLCanvasElement;
  if (!canvas) {
    throw new Error('Canvas element not found');
  }

  canvas.width = W;
  canvas.height = H;

  // Handle resize — maintain aspect ratio
  function resize(): void {
    const windowW = window.innerWidth;
    const windowH = window.innerHeight;
    const scale = Math.min(windowW / W, windowH / H);
    canvas.style.width = `${W * scale}px`;
    canvas.style.height = `${H * scale}px`;
  }

  resize();
  window.addEventListener('resize', resize);

  new Game(canvas);
}

if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', init);
} else {
  init();
}
