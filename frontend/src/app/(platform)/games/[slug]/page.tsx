'use client';

import { use, useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import {
  Play,
  Lock,
  ThumbsUp,
  ThumbsDown,
  Gamepad2,
  ArrowRight,
  ArrowLeft,
  Share2,
} from 'lucide-react';
import { cn, formatNumber, getCategoryColor } from '@/lib/utils';
import { useAuth } from '@/lib/hooks/use-auth';
import { useGameDetail } from '@/lib/hooks/use-games';
import { useGameLeaderboard } from '@/lib/hooks/use-leaderboard';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Skeleton, GameCardSkeleton } from '@/components/ui/skeleton';
import { DifficultyDots } from '@/components/game/difficulty-dots';
import { GameCard } from '@/components/game/game-card';
import { LeaderboardTable } from '@/components/leaderboard/leaderboard-table';
import type { Game } from '@/lib/types';

function GameDetailSkeleton() {
  return (
    <div className="max-w-6xl">
      <div className="relative">
        <Skeleton className="h-48 md:h-64 rounded-none" />
        <div className="relative px-4 md:px-6 lg:px-8 -mt-20">
          <div className="flex flex-col md:flex-row gap-6">
            <Skeleton className="w-32 h-32 md:w-40 md:h-40 rounded-2xl shrink-0" />
            <div className="flex-1 pt-2 space-y-3">
              <div className="flex gap-2">
                <Skeleton className="h-6 w-20 rounded-full" />
                <Skeleton className="h-6 w-16 rounded-full" />
              </div>
              <Skeleton className="h-8 w-64" />
              <div className="flex gap-4">
                <Skeleton className="h-5 w-24" />
                <Skeleton className="h-5 w-16" />
                <Skeleton className="h-5 w-20" />
              </div>
              <Skeleton className="h-12 w-40 rounded-xl" />
            </div>
          </div>
        </div>
      </div>
      <div className="p-4 md:p-6 lg:p-8 space-y-8">
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          <div className="lg:col-span-2 space-y-8">
            <div className="space-y-3">
              <Skeleton className="h-6 w-32" />
              <Skeleton className="h-4 w-full" />
              <Skeleton className="h-4 w-5/6" />
              <Skeleton className="h-4 w-4/6" />
            </div>
            <div className="space-y-3">
              <Skeleton className="h-6 w-40" />
              <Skeleton className="h-24 w-full rounded-xl" />
            </div>
          </div>
          <div className="space-y-3">
            <Skeleton className="h-6 w-24" />
            <Skeleton className="h-64 w-full rounded-xl" />
          </div>
        </div>
      </div>
    </div>
  );
}

export default function GameDetailPage({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = use(params);
  const router = useRouter();
  const { isAuthenticated, isPremium } = useAuth();
  const { data: game, isLoading, isError } = useGameDetail(slug);
  const { data: leaderboardData, isLoading: isLeaderboardLoading } = useGameLeaderboard(slug, 6);

  const [userVote, setUserVote] = useState<'like' | 'dislike' | null>(null);

  if (isLoading) {
    return <GameDetailSkeleton />;
  }

  if (isError || !game) {
    return (
      <div className="max-w-6xl p-8 text-center">
        <Gamepad2 className="w-16 h-16 mx-auto mb-4 text-gameflix-text-dim opacity-50" />
        <h1 className="text-2xl font-bold text-gameflix-text-bright mb-2">Gioco non trovato</h1>
        <p className="text-gameflix-text-dim mb-6">
          Il gioco che stai cercando non esiste o potrebbe essere stato rimosso.
        </p>
        <Button variant="outline" onClick={() => router.push('/explore')}>
          <ArrowLeft className="w-4 h-4" />
          Torna a Esplora
        </Button>
      </div>
    );
  }

  const colors = getCategoryColor(game.categorySlug);
  const isLocked = game.isPremium && !isPremium;
  const leaderboardEntries = leaderboardData?.entries ?? [];
  const similarGames: Game[] = [];

  function handleVote(vote: 'like' | 'dislike') {
    if (!isAuthenticated) {
      router.push('/login');
      return;
    }
    setUserVote((prev) => (prev === vote ? null : vote));
  }

  const displayLikeCount = game.likeCount + (userVote === 'like' ? 1 : 0);
  const displayDislikeCount = (userVote === 'dislike' ? 1 : 0);

  return (
    <div className="max-w-6xl">
      {/* Game Header */}
      <div className="relative">
        <div className={cn('h-48 md:h-64 bg-gradient-to-br', colors.gradient, 'to-gameflix-bg')}>
          {game.bannerUrl && (
            <img src={game.bannerUrl} alt={game.title} className="w-full h-full object-cover" />
          )}
          <div className="absolute inset-0 bg-gradient-to-t from-gameflix-bg via-gameflix-bg/60 to-transparent" />
        </div>

        <div className="relative px-4 md:px-6 lg:px-8 -mt-20">
          <div className="flex flex-col md:flex-row gap-6">
            {/* Thumbnail */}
            <div className="w-32 h-32 md:w-40 md:h-40 rounded-2xl bg-gameflix-card border-2 border-gameflix-border flex items-center justify-center shrink-0 shadow-xl">
              {game.thumbnailUrl ? (
                <img src={game.thumbnailUrl} alt={game.title} className="w-full h-full object-cover rounded-2xl" />
              ) : (
                <Gamepad2 className={cn('w-16 h-16', colors.text)} />
              )}
            </div>

            {/* Game Info */}
            <div className="flex-1 pt-2">
              <div className="flex items-center gap-2 mb-2">
                <Badge variant="category" categorySlug={game.categorySlug} />
                {game.isNew && <Badge variant="new">NEW</Badge>}
                {game.isTrending && <Badge variant="trending">TREND</Badge>}
                {game.isPremium && <Badge variant="premium"><Lock className="w-3 h-3 mr-0.5" />PRO</Badge>}
              </div>

              <h1 className="text-3xl font-bold text-gameflix-text-bright mb-2">{game.title}</h1>

              <div className="flex flex-wrap items-center gap-4 text-sm text-gameflix-text-dim mb-4">
                <DifficultyDots difficulty={game.difficulty} showLabel size="md" />
                <span className="flex items-center gap-1">
                  <ThumbsUp className="w-4 h-4 text-gameflix-success" />
                  {game.ratingPercent}%
                </span>
                <span className="flex items-center gap-1">
                  <Gamepad2 className="w-4 h-4" />
                  {formatNumber(game.playCount)} giocate
                </span>
              </div>

              <div className="flex items-center gap-3">
                {isLocked ? (
                  <Link href="/pricing">
                    <Button variant="accent">
                      <Lock className="w-4 h-4" />
                      Sblocca Premium
                    </Button>
                  </Link>
                ) : (
                  <Link href={`/play/${game.slug}`}>
                    <Button size="lg">
                      <Play className="w-5 h-5" />
                      Gioca ora
                    </Button>
                  </Link>
                )}
                <Button variant="ghost" size="lg">
                  <Share2 className="w-4 h-4" />
                </Button>
              </div>
            </div>
          </div>
        </div>
      </div>

      <div className="p-4 md:p-6 lg:p-8 space-y-8">
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Left column */}
          <div className="lg:col-span-2 space-y-8">
            {/* Description */}
            <section>
              <h2 className="text-lg font-bold text-gameflix-text-bright mb-3">Descrizione</h2>
              <p className="text-sm text-gameflix-text leading-relaxed">{game.description}</p>
            </section>

            {/* Tags */}

            {/* Like/Dislike */}
            <section>
              <h2 className="text-lg font-bold text-gameflix-text-bright mb-3">Ti è piaciuto?</h2>
              <div className="flex gap-3">
                <Button
                  variant={userVote === 'like' ? 'primary' : 'outline'}
                  className="flex-1"
                  onClick={() => handleVote('like')}
                >
                  <ThumbsUp className={cn('w-4 h-4', userVote === 'like' ? '' : 'text-gameflix-success')} />
                  Mi piace ({displayLikeCount})
                </Button>
                <Button
                  variant={userVote === 'dislike' ? 'danger' : 'outline'}
                  className="flex-1"
                  onClick={() => handleVote('dislike')}
                >
                  <ThumbsDown className={cn('w-4 h-4', userVote === 'dislike' ? '' : 'text-gameflix-danger')} />
                  Non mi piace ({displayDislikeCount})
                </Button>
              </div>
            </section>

            {/* Tags */}
            {game.tags.length > 0 && (
              <section>
                <h2 className="text-lg font-bold text-gameflix-text-bright mb-3">Tag</h2>
                <div className="flex flex-wrap gap-2">
                  {game.tags.map((tag) => (
                    <Badge key={tag}>{tag}</Badge>
                  ))}
                </div>
              </section>
            )}
          </div>

          {/* Right column - Leaderboard */}
          <div>
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-lg font-bold text-gameflix-text-bright">Classifica</h2>
              <Link href={`/leaderboard?game=${game.slug}`} className="text-sm text-gameflix-primary hover:underline flex items-center gap-1">
                Completa <ArrowRight className="w-3.5 h-3.5" />
              </Link>
            </div>
            <Card padding="sm">
              <LeaderboardTable entries={leaderboardEntries} isLoading={isLeaderboardLoading} />
            </Card>

            {/* User best score — loaded from leaderboard data */}
          </div>
        </div>

        {/* Similar Games */}
        {similarGames.length > 0 && (
          <section>
            <h2 className="text-lg font-bold text-gameflix-text-bright mb-4">Giochi simili</h2>
            <div className="flex gap-4 overflow-x-auto hide-scrollbar pb-2">
              {similarGames.map((g) => (
                <div key={g.id} className="min-w-[220px] max-w-[260px] shrink-0">
                  <GameCard game={g} />
                </div>
              ))}
            </div>
          </section>
        )}
      </div>
    </div>
  );
}
