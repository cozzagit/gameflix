import { cn } from '@/lib/utils';
import { GameCard } from './game-card';
import { GameCardSkeleton } from '@/components/ui/skeleton';
import type { Game } from '@/lib/types';

interface GameListProps {
  games: Game[];
  isLoading?: boolean;
  skeletonCount?: number;
  className?: string;
}

export function GameList({ games, isLoading, skeletonCount = 8, className }: GameListProps) {
  if (isLoading) {
    return (
      <div className={cn('grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4 md:gap-6', className)}>
        {Array.from({ length: skeletonCount }, (_, i) => (
          <GameCardSkeleton key={i} />
        ))}
      </div>
    );
  }

  if (games.length === 0) {
    return (
      <div className="text-center py-12">
        <p className="text-gameflix-text-dim text-lg">Nessun gioco trovato</p>
      </div>
    );
  }

  return (
    <div className={cn('grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4 md:gap-6', className)}>
      {games.map((game) => (
        <GameCard key={game.id} game={game} />
      ))}
    </div>
  );
}
