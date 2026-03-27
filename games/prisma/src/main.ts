import { Game } from './game';
import './style.css';

const WIDTH = 1200;
const HEIGHT = 800;

function init(): void {
  const canvas = document.getElementById('game') as HTMLCanvasElement;
  if (!canvas) {
    throw new Error('Canvas element not found');
  }

  canvas.width = WIDTH;
  canvas.height = HEIGHT;

  // Scale canvas to fit viewport, filling width on portrait mobile
  function resize(): void {
    const w = window.innerWidth;
    const h = window.innerHeight;
    const isPortrait = h > w;
    let scale: number;
    if (isPortrait) {
      scale = w / WIDTH;
    } else {
      scale = Math.min(w / WIDTH, h / HEIGHT);
    }
    const displayWidth = WIDTH * scale;
    const displayHeight = HEIGHT * scale;

    canvas.style.width = `${displayWidth}px`;
    canvas.style.height = `${displayHeight}px`;
    canvas.style.position = 'absolute';
    canvas.style.left = `${(w - displayWidth) / 2}px`;
    canvas.style.top = `${Math.max(0, (h - displayHeight) / 2)}px`;
  }

  resize();
  window.addEventListener('resize', resize);

  const game = new Game(canvas);

  function loop(timestamp: number): void {
    game.update(timestamp);
    requestAnimationFrame(loop);
  }

  requestAnimationFrame(loop);
}

if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', init);
} else {
  init();
}
