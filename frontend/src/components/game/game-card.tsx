'use client';

import Link from 'next/link';
import { Lock, Monitor, Smartphone } from 'lucide-react';
import { cn } from '@/lib/utils';
import { Badge } from '@/components/ui/badge';
import { DifficultyDots } from './difficulty-dots';
import { RatingBadge } from './rating-badge';
import { PlayCount } from './play-count';
import type { Game } from '@/lib/types';

interface GameCardProps {
  game: Game;
  className?: string;
}

export function GameCard({ game, className }: GameCardProps) {
  return (
    <Link href={`/games/${game.slug}`} className="block group">
      <div
        className={cn(
          'bg-gameflix-card rounded-2xl border border-gameflix-border overflow-hidden transition-all duration-200',
          'hover:border-gameflix-primary/30 hover:shadow-lg hover:shadow-gameflix-primary/5 hover:-translate-y-1',
          className
        )}
      >
        <div className="relative aspect-video bg-gameflix-surface overflow-hidden">
          {game.thumbnailUrl ? (
            <img
              src={game.thumbnailUrl}
              alt={game.title}
              className="w-full h-full object-cover transition-transform duration-300 group-hover:scale-105"
            />
          ) : (
            <div
              className="w-full h-full flex items-center justify-center"
              style={{
                background: `linear-gradient(135deg, ${game.categoryColor}33 0%, ${game.categoryColor}11 50%, ${game.categoryColor}22 100%)`,
              }}
            >
              <span
                className="text-5xl font-black select-none opacity-40"
                style={{ color: game.categoryColor }}
              >
                {game.title[0]}
              </span>
            </div>
          )}

          <div className="absolute top-2 left-2 flex gap-1.5">
            {game.isNew && <Badge variant="new">NEW</Badge>}
            {game.isTrending && <Badge variant="trending">TREND</Badge>}
            {game.isPremium && (
              <Badge variant="premium">
                <Lock className="w-3 h-3 mr-0.5" />
                PRO
              </Badge>
            )}
          </div>

          <div className="absolute bottom-2 right-2">
            <Badge variant="category" categorySlug={game.categorySlug} />
          </div>
        </div>

        <div className="p-4">
          <h3 className="font-bold text-gameflix-text-bright group-hover:text-gameflix-primary transition-colors line-clamp-1">
            {game.title}
          </h3>

          <div className="flex items-center justify-between mt-2">
            <DifficultyDots difficulty={game.difficulty} showLabel />
            <RatingBadge percent={game.ratingPercent} />
          </div>

          <div className="flex items-center justify-between mt-2">
            <PlayCount count={game.playCount} />
            <div className="flex items-center gap-1" title={
              game.platforms.includes('desktop') && game.platforms.includes('mobile')
                ? 'Desktop e Mobile'
                : game.platforms.includes('mobile')
                  ? 'Solo Mobile'
                  : 'Solo Desktop'
            }>
              {game.platforms.includes('desktop') && (
                <Monitor className="w-3.5 h-3.5 text-gameflix-text-dim" />
              )}
              {game.platforms.includes('mobile') && (
                <Smartphone className="w-3.5 h-3.5 text-gameflix-text-dim" />
              )}
            </div>
          </div>
        </div>
      </div>
    </Link>
  );
}
