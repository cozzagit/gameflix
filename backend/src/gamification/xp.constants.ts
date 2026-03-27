export const XP_VALUES = {
  GAME_COMPLETE: 10,
  DAILY_COMPLETE: 25,
  DAILY_FIRST_PLACE: 50,
  NEW_GAME_TRIED: 15,
  STREAK_DAY: 5,
  STREAK_MILESTONE: 50,
  WEEKLY_CHALLENGE: 100,
} as const;

export const LEVEL_THRESHOLDS = [
  0, 50, 120, 210, 320, 450, 600, 780, 1000, 1260, // 1-10
  1560, 1900, 2300, 2760, 3300, 3920, 4640, 5480, 6460, 7600, // 11-20
  8920, 10440, 12200, 14240, 16600, 19320, 22440, 26020, 30100, 34740, // 21-30
];

export const TITLES: Record<string, [number, number]> = {
  Novizio: [1, 4],
  Giocatore: [5, 9],
  Esperto: [10, 14],
  Maestro: [15, 19],
  Leggenda: [20, 30],
};

export function getLevelForXp(totalXp: number): number {
  for (let i = LEVEL_THRESHOLDS.length - 1; i >= 0; i--) {
    if (totalXp >= LEVEL_THRESHOLDS[i]) {
      return i + 1;
    }
  }
  return 1;
}

export function getTitleForLevel(level: number): string {
  for (const [title, [min, max]] of Object.entries(TITLES)) {
    if (level >= min && level <= max) {
      return title;
    }
  }
  return 'Leggenda';
}

export function getXpForNextLevel(currentLevel: number): number | null {
  if (currentLevel >= LEVEL_THRESHOLDS.length) {
    return null;
  }
  return LEVEL_THRESHOLDS[currentLevel];
}
