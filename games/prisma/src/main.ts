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

  // Scale canvas to fit viewport while maintaining aspect ratio
  function resize(): void {
    const aspectRatio = WIDTH / HEIGHT;
    let displayWidth = window.innerWidth;
    let displayHeight = window.innerHeight;

    if (displayWidth / displayHeight > aspectRatio) {
      displayWidth = displayHeight * aspectRatio;
    } else {
      displayHeight = displayWidth / aspectRatio;
    }

    canvas.style.width = `${displayWidth}px`;
    canvas.style.height = `${displayHeight}px`;
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
