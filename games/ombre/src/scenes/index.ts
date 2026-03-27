// ─── Scene Registry ──────────────────────────────────────────────────

import { type SceneData } from '../types';
import { createScene1 } from './scene1-desk';
import { createScene2 } from './scene2-library';
import { createScene3 } from './scene3-garden';
import { createScene4 } from './scene4-train';
import { createScene5 } from './scene5-atelier';
import { createScene6 } from './scene6-chapel';
import { createScene7 } from './scene7-harbor';
import { createScene8 } from './scene8-sealed';

const sceneFactories: (() => SceneData)[] = [
  createScene1,
  createScene2,
  createScene3,
  createScene4,
  createScene5,
  createScene6,
  createScene7,
  createScene8,
];

export function getScene(levelIndex: number): SceneData {
  const factory = sceneFactories[levelIndex];
  if (!factory) {
    throw new Error(`Scene ${levelIndex} not found`);
  }
  return factory();
}

export const TOTAL_LEVELS = sceneFactories.length;
