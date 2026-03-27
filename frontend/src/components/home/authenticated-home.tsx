'use client';

import Link from 'next/link';
import {
  Flame,
  Zap,
  CheckCircle,
  Play,
  ArrowRight,
  Brain,
  BookOpen,
  HelpCircle,
  TrendingUp,
  Trophy,
} from 'lucide-react';
import { cn, formatNumber, getCategoryColor, getCategoryLabel } from '@/lib/utils';
import { useAuth } from '@/lib/hooks/use-auth';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { GameCard } from '@/components/game/game-card';
import { GameCardFeatured } from '@/components/game/game-card-featured';
import { StreakCounter } from '@/components/gamification/streak-counter';
import { RankBadge } from '@/components/leaderboard/rank-badge';
import type { CategorySlug, Game } from '@/lib/types';

const MOCK_DAILY_CHALLENGES = [
  {
    categorySlug: 'brainlab' as CategorySlug,
    categoryName: 'BrainLab',
    gameSlug: 'memory-matrix',
    gameTitle: 'Memory Matrix',
    completed: false,
    score: null,
    icon: Brain,
  },
  {
    categorySlug: 'wordforge' as CategorySlug,
    categoryName: 'WordForge',
    gameSlug: 'word-chain',
    gameTitle: 'Word Chain',
    completed: false,
    score: null,
    icon: BookOpen,
  },
  {
    categorySlug: 'quizarena' as CategorySlug,
    categoryName: 'QuizArena',
    gameSlug: 'speed-quiz',
    gameTitle: 'Speed Quiz',
    completed: false,
    score: null,
    icon: HelpCircle,
  },
];

const MOCK_TRENDING_GAMES: Game[] = [
  {
    id: '1',
    slug: 'memory-matrix',
    title: 'Memory Matrix',
    description: 'Allena la memoria visiva con griglie sempre più complesse.',
    categoryColor: '#3B82F6',
    estimatedDuration: 5,
    platforms: ['desktop', 'mobile'] as ('desktop' | 'mobile')[],
    categorySlug: 'brainlab',
    categoryName: 'BrainLab',
    difficulty: 3,
    thumbnailUrl: null,
    bannerUrl: null,
    isPremium: false,
    isNew: false,
    isTrending: true,
    playCount: 2450,
    likeCount: 180,
    ratingPercent: 94,
    releasedAt: '2026-03-01',
    tags: ['memoria', 'visivo'],
  },
  {
    id: '2',
    slug: 'number-rush',
    title: 'Number Rush',
    description: 'Risolvi operazioni matematiche prima che scada il tempo.',
    categoryColor: '#3B82F6',
    estimatedDuration: 5,
    platforms: ['desktop', 'mobile'] as ('desktop' | 'mobile')[],
    categorySlug: 'brainlab',
    categoryName: 'BrainLab',
    difficulty: 2,
    thumbnailUrl: null,
    bannerUrl: null,
    isPremium: false,
    isNew: true,
    isTrending: true,
    playCount: 1830,
    likeCount: 140,
    ratingPercent: 89,
    releasedAt: '2026-03-15',
    tags: ['matematica', 'velocità'],
  },
  {
    id: '3',
    slug: 'pattern-pro',
    title: 'Pattern Pro',
    description: 'Individua il pattern nella sequenza e completa la serie.',
    categoryColor: '#3B82F6',
    estimatedDuration: 5,
    platforms: ['desktop', 'mobile'] as ('desktop' | 'mobile')[],
    categorySlug: 'brainlab',
    categoryName: 'BrainLab',
    difficulty: 4,
    thumbnailUrl: null,
    bannerUrl: null,
    isPremium: true,
    isNew: false,
    isTrending: false,
    playCount: 1520,
    likeCount: 120,
    ratingPercent: 94,
    releasedAt: '2026-02-20',
    tags: ['logica', 'pattern'],
  },
  {
    id: '4',
    slug: 'color-match',
    title: 'Color Match',
    description: 'Testa i tuoi riflessi con sfide cromatiche.',
    categoryColor: '#3B82F6',
    estimatedDuration: 5,
    platforms: ['desktop', 'mobile'] as ('desktop' | 'mobile')[],
    categorySlug: 'brainlab',
    categoryName: 'BrainLab',
    difficulty: 1,
    thumbnailUrl: null,
    bannerUrl: null,
    isPremium: false,
    isNew: true,
    isTrending: false,
    playCount: 980,
    likeCount: 90,
    ratingPercent: 95,
    releasedAt: '2026-03-20',
    tags: ['riflessi', 'colori'],
  },
];

const FEATURED_GAME: Game = {
  id: '5',
  slug: 'sequence-master',
  title: 'Sequence Master',
  description: 'Il nuovo gioco della settimana: memorizza sequenze sempre più lunghe e sfida i tuoi amici nella classifica globale.',
  categorySlug: 'brainlab',
  categoryName: 'BrainLab',
  categoryColor: '#3B82F6',
  estimatedDuration: 5,
  difficulty: 3,
  thumbnailUrl: null,
  bannerUrl: null,
  isPremium: false,
  isNew: true,
  isTrending: false,
  playCount: 650,
  likeCount: 75,
  ratingPercent: 96,
  releasedAt: '2026-03-24',
  tags: ['memoria', 'sequenze'],
  platforms: ['desktop', 'mobile'],
};

const MOCK_RANKINGS = [
  { game: 'Memory Matrix', rank: 12, score: 4200 },
  { game: 'Number Rush', rank: 5, score: 3800 },
  { game: 'Pattern Pro', rank: 28, score: 2100 },
];

export function AuthenticatedHome() {
  const { user } = useAuth();
  if (!user) return null;

  const greeting = getGreeting();

  return (
    <div className="p-4 md:p-6 lg:p-8 space-y-8 max-w-6xl">
      {/* Welcome Banner */}
      <Card className="bg-gradient-to-r from-gameflix-primary/10 via-gameflix-card to-gameflix-secondary/10 border-gameflix-primary/20">
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
          <div>
            <h1 className="text-2xl font-bold text-gameflix-text-bright">
              {greeting}, {user.displayName}!
            </h1>
            <p className="text-gameflix-text-dim mt-1">
              Pronto per la tua sessione di allenamento mentale?
            </p>
          </div>
          <div className="flex items-center gap-6">
            <div className="text-center">
              <StreakCounter streak={user.streakDays} size="lg" />
              <p className="text-[10px] text-gameflix-text-dim mt-0.5">Streak</p>
            </div>
            <div className="text-center">
              <div className="flex items-center gap-1 text-gameflix-secondary">
                <Zap className="w-5 h-5" />
                <span className="text-xl font-bold">{formatNumber(user.totalXp)}</span>
              </div>
              <p className="text-[10px] text-gameflix-text-dim mt-0.5">XP totali</p>
            </div>
          </div>
        </div>
      </Card>

      {/* Daily Challenges */}
      <section>
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-lg font-bold text-gameflix-text-bright flex items-center gap-2">
            <Flame className="w-5 h-5 text-gameflix-accent" />
            Sfide Giornaliere
          </h2>
          <span className="text-xs text-gameflix-text-dim">0/3 completate</span>
        </div>
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          {MOCK_DAILY_CHALLENGES.map((challenge) => {
            const colors = getCategoryColor(challenge.categorySlug);
            const IconComponent = challenge.icon;
            return (
              <Card key={challenge.categorySlug} hover className="relative overflow-hidden">
                <div className={cn('absolute inset-0 bg-gradient-to-br opacity-30', colors.gradient)} />
                <div className="relative">
                  <div className="flex items-center gap-2 mb-3">
                    <div className={cn('w-8 h-8 rounded-lg flex items-center justify-center', colors.bg)}>
                      <IconComponent className={cn('w-4 h-4', colors.text)} />
                    </div>
                    <div>
                      <p className={cn('text-xs font-semibold', colors.text)}>
                        Daily {getCategoryLabel(challenge.categorySlug)}
                      </p>
                      <p className="text-sm font-bold text-gameflix-text-bright">
                        {challenge.gameTitle}
                      </p>
                    </div>
                  </div>
                  {challenge.completed ? (
                    <div className="flex items-center gap-2 text-gameflix-success">
                      <CheckCircle className="w-4 h-4" />
                      <span className="text-sm font-medium">
                        Completata! {challenge.score} punti
                      </span>
                    </div>
                  ) : (
                    <Link href={`/play/${challenge.gameSlug}?daily=true`}>
                      <Button size="sm" variant="outline" fullWidth>
                        <Play className="w-4 h-4" />
                        Gioca
                      </Button>
                    </Link>
                  )}
                </div>
              </Card>
            );
          })}
        </div>
      </section>

      {/* New This Week */}
      <section>
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-lg font-bold text-gameflix-text-bright">Novità della settimana</h2>
          <Link
            href="/explore?sort=newest"
            className="text-sm text-gameflix-primary hover:underline flex items-center gap-1"
          >
            Vedi tutte <ArrowRight className="w-3.5 h-3.5" />
          </Link>
        </div>
        <GameCardFeatured game={FEATURED_GAME} label="NUOVO" />
      </section>

      {/* Trending */}
      <section>
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-lg font-bold text-gameflix-text-bright flex items-center gap-2">
            <TrendingUp className="w-5 h-5 text-gameflix-accent" />
            Trending
          </h2>
          <Link
            href="/explore?sort=popular"
            className="text-sm text-gameflix-primary hover:underline flex items-center gap-1"
          >
            Vedi tutti <ArrowRight className="w-3.5 h-3.5" />
          </Link>
        </div>
        <div className="flex gap-4 overflow-x-auto hide-scrollbar pb-2">
          {MOCK_TRENDING_GAMES.map((game) => (
            <div key={game.id} className="min-w-[220px] max-w-[260px] shrink-0">
              <GameCard game={game} />
            </div>
          ))}
        </div>
      </section>

      {/* Your Rankings */}
      <section>
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-lg font-bold text-gameflix-text-bright flex items-center gap-2">
            <Trophy className="w-5 h-5 text-gameflix-accent" />
            Le tue classifiche
          </h2>
          <Link
            href="/leaderboard"
            className="text-sm text-gameflix-primary hover:underline flex items-center gap-1"
          >
            Tutte <ArrowRight className="w-3.5 h-3.5" />
          </Link>
        </div>
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          {MOCK_RANKINGS.map((ranking) => (
            <Card key={ranking.game} hover padding="sm">
              <div className="flex items-center gap-3">
                <RankBadge rank={ranking.rank} />
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-semibold text-gameflix-text-bright truncate">
                    {ranking.game}
                  </p>
                  <p className="text-xs text-gameflix-text-dim">
                    {formatNumber(ranking.score)} punti
                  </p>
                </div>
              </div>
            </Card>
          ))}
        </div>
      </section>
    </div>
  );
}

function getGreeting(): string {
  const hour = new Date().getHours();
  if (hour < 12) return 'Buongiorno';
  if (hour < 18) return 'Buon pomeriggio';
  return 'Buonasera';
}
