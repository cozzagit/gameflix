'use client';

import Link from 'next/link';
import {
  Brain,
  BookOpen,
  HelpCircle,
  Play,
  CheckCircle,
  Flame,
  Zap,
  Calendar,
} from 'lucide-react';
import { cn, getCategoryColor, getCategoryLabel } from '@/lib/utils';
import { useAuth } from '@/lib/hooks/use-auth';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { StreakCounter } from '@/components/gamification/streak-counter';
import type { CategorySlug } from '@/lib/types';

const DAILY_CHALLENGES = [
  {
    categorySlug: 'brainlab' as CategorySlug,
    gameSlug: 'memory-matrix',
    gameTitle: 'Memory Matrix',
    description: 'Allena la memoria visiva con griglie sempre più complesse.',
    xpReward: 50,
    bonusXp: 25,
    completed: false,
    score: null as number | null,
    icon: Brain,
  },
  {
    categorySlug: 'wordforge' as CategorySlug,
    gameSlug: 'word-chain',
    gameTitle: 'Word Chain',
    description: 'Forma catene di parole collegando lettere adiacenti.',
    xpReward: 50,
    bonusXp: 25,
    completed: false,
    score: null as number | null,
    icon: BookOpen,
  },
  {
    categorySlug: 'quizarena' as CategorySlug,
    gameSlug: 'speed-quiz',
    gameTitle: 'Speed Quiz',
    description: 'Rispondi a domande di cultura generale in tempo record.',
    xpReward: 50,
    bonusXp: 25,
    completed: false,
    score: null as number | null,
    icon: HelpCircle,
  },
];

const WEEK_DAYS = ['Lun', 'Mar', 'Mer', 'Gio', 'Ven', 'Sab', 'Dom'];
const COMPLETED_DAYS = [true, true, true, true, true, false, false];

export default function DailyPage() {
  const { user, isAuthenticated } = useAuth();
  const completedCount = DAILY_CHALLENGES.filter((c) => c.completed).length;
  const allCompleted = completedCount === DAILY_CHALLENGES.length;

  if (!isAuthenticated) {
    return (
      <div className="p-4 md:p-6 lg:p-8 max-w-3xl text-center py-20">
        <Flame className="w-16 h-16 text-gameflix-accent mx-auto mb-4" />
        <h1 className="text-2xl font-bold text-gameflix-text-bright mb-2">Sfide Giornaliere</h1>
        <p className="text-gameflix-text-dim mb-6">
          Accedi per iniziare le tue sfide giornaliere e mantenere la tua streak.
        </p>
        <Link href="/login">
          <Button>Accedi</Button>
        </Link>
      </div>
    );
  }

  return (
    <div className="p-4 md:p-6 lg:p-8 max-w-3xl space-y-8">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gameflix-text-bright flex items-center gap-2">
            <Flame className="w-7 h-7 text-gameflix-accent" />
            Sfide Giornaliere
          </h1>
          <p className="text-sm text-gameflix-text-dim mt-1">
            Completa tutte e 3 le sfide per ottenere XP bonus
          </p>
        </div>
        <StreakCounter streak={user?.streakDays || 0} size="lg" showLabel />
      </div>

      {/* Weekly Progress */}
      <Card>
        <div className="flex items-center gap-2 mb-4">
          <Calendar className="w-5 h-5 text-gameflix-primary" />
          <h2 className="font-bold text-gameflix-text-bright">Questa settimana</h2>
        </div>
        <div className="flex items-center justify-between">
          {WEEK_DAYS.map((day, i) => (
            <div key={day} className="flex flex-col items-center gap-1.5">
              <span className="text-[10px] text-gameflix-text-dim uppercase">{day}</span>
              <div
                className={cn(
                  'w-8 h-8 rounded-full flex items-center justify-center border',
                  COMPLETED_DAYS[i]
                    ? 'bg-gameflix-success/20 border-gameflix-success/30'
                    : i === 5
                      ? 'bg-gameflix-accent/20 border-gameflix-accent/30'
                      : 'bg-gameflix-surface border-gameflix-border'
                )}
              >
                {COMPLETED_DAYS[i] ? (
                  <CheckCircle className="w-4 h-4 text-gameflix-success" />
                ) : i === 5 ? (
                  <span className="text-xs font-bold text-gameflix-accent">!</span>
                ) : (
                  <span className="w-1.5 h-1.5 rounded-full bg-gameflix-border" />
                )}
              </div>
            </div>
          ))}
        </div>
      </Card>

      {/* Progress */}
      <Card className={cn(allCompleted && 'border-gameflix-success/30 bg-gameflix-success/5')}>
        <div className="flex items-center justify-between">
          <div>
            <p className="text-sm font-semibold text-gameflix-text-bright">
              {allCompleted ? 'Tutte completate!' : `${completedCount}/3 completate`}
            </p>
            <p className="text-xs text-gameflix-text-dim">
              {allCompleted
                ? 'Ottimo lavoro! Torna domani per nuove sfide.'
                : 'Completa tutte le sfide per ottenere 75 XP bonus'}
            </p>
          </div>
          {allCompleted && (
            <div className="flex items-center gap-1 text-gameflix-success">
              <Zap className="w-5 h-5" />
              <span className="text-lg font-bold">+75 XP</span>
            </div>
          )}
        </div>
      </Card>

      {/* Challenges */}
      <div className="space-y-4">
        {DAILY_CHALLENGES.map((challenge) => {
          const colors = getCategoryColor(challenge.categorySlug);
          const IconComponent = challenge.icon;
          return (
            <Card key={challenge.categorySlug} hover className="relative overflow-hidden">
              <div className={cn('absolute left-0 top-0 bottom-0 w-1', colors.dot)} />
              <div className="pl-4">
                <div className="flex items-start justify-between gap-4">
                  <div className="flex items-start gap-4">
                    <div className={cn('w-12 h-12 rounded-xl flex items-center justify-center shrink-0', colors.bg)}>
                      <IconComponent className={cn('w-6 h-6', colors.text)} />
                    </div>
                    <div>
                      <div className="flex items-center gap-2 mb-1">
                        <Badge variant="category" categorySlug={challenge.categorySlug} />
                      </div>
                      <h3 className="font-bold text-gameflix-text-bright">{challenge.gameTitle}</h3>
                      <p className="text-sm text-gameflix-text-dim mt-0.5">{challenge.description}</p>
                      <div className="flex items-center gap-3 mt-2">
                        <span className="text-xs text-gameflix-secondary flex items-center gap-1">
                          <Zap className="w-3 h-3" />
                          +{challenge.xpReward} XP
                        </span>
                        <span className="text-xs text-gameflix-text-dim">
                          +{challenge.bonusXp} XP bonus se completate tutte
                        </span>
                      </div>
                    </div>
                  </div>
                  <div className="shrink-0">
                    {challenge.completed ? (
                      <div className="flex flex-col items-center gap-1">
                        <CheckCircle className="w-8 h-8 text-gameflix-success" />
                        <span className="text-xs text-gameflix-success font-medium">
                          {challenge.score} pt
                        </span>
                      </div>
                    ) : (
                      <Link href={`/play/${challenge.gameSlug}?daily=true`}>
                        <Button>
                          <Play className="w-4 h-4" />
                          Gioca
                        </Button>
                      </Link>
                    )}
                  </div>
                </div>
              </div>
            </Card>
          );
        })}
      </div>
    </div>
  );
}
