// ============================================================
// Machina — Level Registry
// ============================================================

import { MechanismLevel } from '../types';
import { Level1Gears } from './level1-gears';
import { Level2Levers } from './level2-levers';
import { Level3Pipes } from './level3-pipes';
import { Level4Slider } from './level4-slider';
import { Level5Mirrors } from './level5-mirrors';
import { Level6Safe } from './level6-safe';
import { Level7Circuit } from './level7-circuit';
import { Level8Final } from './level8-final';

export function createLevel(id: number): MechanismLevel {
  switch (id) {
    case 1: return new Level1Gears();
    case 2: return new Level2Levers();
    case 3: return new Level3Pipes();
    case 4: return new Level4Slider();
    case 5: return new Level5Mirrors();
    case 6: return new Level6Safe();
    case 7: return new Level7Circuit();
    case 8: return new Level8Final();
    default: return new Level1Gears();
  }
}

export const LEVEL_COUNT = 8;
