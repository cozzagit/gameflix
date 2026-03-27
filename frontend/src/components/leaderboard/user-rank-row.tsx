import { cn } from '@/lib/utils';
import { Avatar } from '@/components/ui/avatar';
import { RankBadge } from './rank-badge';
import { StreakCounter } from '@/components/gamification/streak-counter';
import { formatNumber } from '@/lib/utils';
import type { LeaderboardEntry } from '@/lib/types';

interface UserRankRowProps {
  entry: LeaderboardEntry;
  className?: string;
}

export function UserRankRow({ entry, className }: UserRankRowProps) {
  return (
    <div
      className={cn(
        'flex items-center gap-3 p-3 rounded-xl transition-colors',
        entry.isCurrentUser
          ? 'bg-gameflix-primary/10 border border-gameflix-primary/30'
          : 'hover:bg-gameflix-surface',
        className
      )}
    >
      <RankBadge rank={entry.rank} />
      <Avatar src={entry.avatarUrl} alt={entry.displayName} size="sm" />
      <div className="flex-1 min-w-0">
        <p
          className={cn(
            'text-sm font-semibold truncate',
            entry.isCurrentUser ? 'text-gameflix-primary' : 'text-gameflix-text-bright'
          )}
        >
          {entry.displayName}
          {entry.isCurrentUser && (
            <span className="text-xs text-gameflix-primary/70 ml-1">(Tu)</span>
          )}
        </p>
        <p className="text-xs text-gameflix-text-dim">Lv. {entry.level}</p>
      </div>
      <StreakCounter streak={entry.streakDays} size="sm" />
      <div className="text-right min-w-[60px]">
        <p className="text-sm font-bold text-gameflix-text-bright tabular-nums">
          {formatNumber(entry.score)}
        </p>
        <p className="text-[10px] text-gameflix-text-dim">punti</p>
      </div>
    </div>
  );
}
