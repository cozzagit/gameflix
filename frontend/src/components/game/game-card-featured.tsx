'use client';

import Link from 'next/link';
import { Play, Lock } from 'lucide-react';
import { cn } from '@/lib/utils';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { DifficultyDots } from './difficulty-dots';
import { PlayCount } from './play-count';
import { RatingBadge } from './rating-badge';
import type { Game } from '@/lib/types';

interface GameCardFeaturedProps {
  game: Game;
  label?: string;
  className?: string;
}

export function GameCardFeatured({ game, label, className }: GameCardFeaturedProps) {
  return (
    <Link href={`/games/${game.slug}`} className="block group">
      <div
        className={cn(
          'relative bg-gameflix-card rounded-2xl border border-gameflix-border overflow-hidden',
          'hover:border-gameflix-primary/30 hover:shadow-xl hover:shadow-gameflix-primary/10 transition-all duration-300',
          className
        )}
      >
        <div className="flex flex-col md:flex-row">
          <div className="relative md:w-1/2 aspect-video md:aspect-auto overflow-hidden">
            {game.bannerUrl || game.thumbnailUrl ? (
              <img
                src={game.bannerUrl || game.thumbnailUrl || ''}
                alt={game.title}
                className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-105"
              />
            ) : (
              <div className="w-full h-full min-h-[200px] flex items-center justify-center bg-gradient-to-br from-gameflix-primary/20 to-gameflix-secondary/20">
                <span className="text-6xl font-bold text-gameflix-text-dim/20">
                  {game.title[0]}
                </span>
              </div>
            )}

            <div className="absolute inset-0 bg-gradient-to-r from-transparent to-gameflix-card/80 hidden md:block" />
            <div className="absolute inset-0 bg-gradient-to-t from-gameflix-card/80 to-transparent md:hidden" />

            {label && (
              <div className="absolute top-3 left-3">
                <Badge variant="new">{label}</Badge>
              </div>
            )}
          </div>

          <div className="p-6 md:w-1/2 flex flex-col justify-center">
            <div className="flex items-center gap-2 mb-3">
              <Badge variant="category" categorySlug={game.categorySlug} />
              {game.isNew && <Badge variant="new">NEW</Badge>}
              {game.isPremium && (
                <Badge variant="premium">
                  <Lock className="w-3 h-3 mr-0.5" />
                  PRO
                </Badge>
              )}
            </div>

            <h2 className="text-2xl font-bold text-gameflix-text-bright mb-2 group-hover:text-gameflix-primary transition-colors">
              {game.title}
            </h2>

            <p className="text-sm text-gameflix-text-dim mb-4 line-clamp-2">
              {game.description}
            </p>

            <div className="flex items-center gap-4 mb-4">
              <DifficultyDots difficulty={game.difficulty} showLabel size="md" />
              <RatingBadge percent={game.ratingPercent} size="md" />
              <PlayCount count={game.playCount} />
            </div>

            <div>
              <Button size="md">
                <Play className="w-4 h-4" />
                Gioca ora
              </Button>
            </div>
          </div>
        </div>
      </div>
    </Link>
  );
}
