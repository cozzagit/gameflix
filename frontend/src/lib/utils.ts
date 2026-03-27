import { clsx, type ClassValue } from 'clsx';
import { twMerge } from 'tailwind-merge';
import { format, formatDistanceToNow } from 'date-fns';
import { it } from 'date-fns/locale';
import type { CategorySlug, Difficulty } from './types';

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

export function formatNumber(num: number): string {
  if (num >= 1_000_000) {
    return `${(num / 1_000_000).toFixed(1).replace(/\.0$/, '')}M`;
  }
  if (num >= 1_000) {
    return `${(num / 1_000).toFixed(1).replace(/\.0$/, '')}K`;
  }
  return num.toString();
}

export function formatDate(dateStr: string): string {
  return format(new Date(dateStr), 'd MMM yyyy', { locale: it });
}

export function formatDateRelative(dateStr: string): string {
  return formatDistanceToNow(new Date(dateStr), { addSuffix: true, locale: it });
}

export function formatDuration(seconds: number): string {
  const mins = Math.floor(seconds / 60);
  const secs = seconds % 60;
  if (mins === 0) return `${secs}s`;
  return `${mins}m ${secs}s`;
}

const LEVEL_TITLES: Record<number, string> = {
  1: 'Principiante',
  2: 'Principiante',
  3: 'Apprendista',
  4: 'Apprendista',
  5: 'Giocatore',
  6: 'Giocatore',
  7: 'Esperto',
  8: 'Esperto',
  9: 'Maestro',
  10: 'Maestro',
  11: 'Campione',
  12: 'Campione',
  13: 'Leggenda',
  14: 'Leggenda',
  15: 'Mito',
};

export function getLevelTitle(level: number): string {
  if (level >= 15) return 'Mito';
  return LEVEL_TITLES[level] ?? 'Principiante';
}

export function getXpForNextLevel(currentLevel: number): number {
  return currentLevel * 500;
}

export function getXpProgress(totalXp: number, currentLevel: number): {
  xpInLevel: number;
  xpNeeded: number;
  percentage: number;
} {
  const xpForPreviousLevels = Array.from({ length: currentLevel - 1 }, (_, i) => (i + 1) * 500).reduce((a, b) => a + b, 0);
  const xpInLevel = totalXp - xpForPreviousLevels;
  const xpNeeded = getXpForNextLevel(currentLevel);
  const percentage = Math.min((xpInLevel / xpNeeded) * 100, 100);
  return { xpInLevel, xpNeeded, percentage };
}

export function getCategoryColor(slug: CategorySlug): {
  bg: string;
  text: string;
  border: string;
  dot: string;
  gradient: string;
} {
  switch (slug) {
    case 'brainlab':
      return {
        bg: 'bg-brainlab/10',
        text: 'text-brainlab-light',
        border: 'border-brainlab/30',
        dot: 'bg-brainlab',
        gradient: 'from-brainlab/20 to-transparent',
      };
    case 'wordforge':
      return {
        bg: 'bg-wordforge/10',
        text: 'text-wordforge-light',
        border: 'border-wordforge/30',
        dot: 'bg-wordforge',
        gradient: 'from-wordforge/20 to-transparent',
      };
    case 'quizarena':
      return {
        bg: 'bg-quizarena/10',
        text: 'text-quizarena-light',
        border: 'border-quizarena/30',
        dot: 'bg-quizarena',
        gradient: 'from-quizarena/20 to-transparent',
      };
    case 'mysterium':
      return {
        bg: 'bg-purple-500/10',
        text: 'text-purple-300',
        border: 'border-purple-500/30',
        dot: 'bg-purple-500',
        gradient: 'from-purple-500/20 to-transparent',
      };
    case 'tinkerfarm':
      return {
        bg: 'bg-emerald-500/10',
        text: 'text-emerald-300',
        border: 'border-emerald-500/30',
        dot: 'bg-emerald-500',
        gradient: 'from-emerald-500/20 to-transparent',
      };
  }
}

export function getCategoryLabel(slug: CategorySlug): string {
  switch (slug) {
    case 'brainlab': return 'BrainLab';
    case 'wordforge': return 'WordForge';
    case 'quizarena': return 'QuizArena';
    case 'mysterium': return 'Mysterium';
    case 'tinkerfarm': return 'TinkerFarm';
  }
}

export function getDifficultyLabel(difficulty: Difficulty): string {
  switch (difficulty) {
    case 1: return 'Facile';
    case 2: return 'Medio-Facile';
    case 3: return 'Medio';
    case 4: return 'Difficile';
    case 5: return 'Estremo';
  }
}

export function getStreakTier(streak: number): {
  color: string;
  label: string;
} {
  if (streak >= 30) return { color: 'text-gameflix-accent', label: 'Infuocato' };
  if (streak >= 14) return { color: 'text-orange-400', label: 'Acceso' };
  if (streak >= 7) return { color: 'text-yellow-400', label: 'Caldo' };
  if (streak >= 3) return { color: 'text-amber-300', label: 'Tiepido' };
  return { color: 'text-gameflix-text-dim', label: 'Inizio' };
}
