import { cn } from '@/lib/utils';
import { UserRankRow } from './user-rank-row';
import { LeaderboardRowSkeleton } from '@/components/ui/skeleton';
import type { LeaderboardEntry } from '@/lib/types';

interface LeaderboardTableProps {
  entries: LeaderboardEntry[];
  isLoading?: boolean;
  startFromRank?: number;
  className?: string;
}

export function LeaderboardTable({
  entries,
  isLoading,
  className,
}: LeaderboardTableProps) {
  if (isLoading) {
    return (
      <div className={cn('space-y-1', className)}>
        {Array.from({ length: 10 }, (_, i) => (
          <LeaderboardRowSkeleton key={i} />
        ))}
      </div>
    );
  }

  if (entries.length === 0) {
    return (
      <div className="text-center py-12">
        <p className="text-gameflix-text-dim">Nessun dato disponibile</p>
      </div>
    );
  }

  return (
    <div className={cn('space-y-1', className)}>
      {entries.map((entry) => (
        <UserRankRow key={entry.userId} entry={entry} />
      ))}
    </div>
  );
}
