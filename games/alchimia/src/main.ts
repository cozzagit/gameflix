import './style.css';
import { createGame } from './game';

const canvas = document.getElementById('game') as HTMLCanvasElement;
if (canvas) {
  createGame(canvas);
}
