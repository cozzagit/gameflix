import { cn, formatNumber } from '@/lib/utils';
import { Avatar } from '@/components/ui/avatar';
import { Trophy, Medal } from 'lucide-react';
import type { LeaderboardEntry } from '@/lib/types';

interface PodiumProps {
  entries: LeaderboardEntry[];
  className?: string;
}

export function Podium({ entries, className }: PodiumProps) {
  if (entries.length < 3) return null;

  const first = entries[0];
  const second = entries[1];
  const third = entries[2];

  return (
    <div className={cn('flex items-end justify-center gap-4 py-8', className)}>
      <PodiumPlace entry={second} place={2} />
      <PodiumPlace entry={first} place={1} />
      <PodiumPlace entry={third} place={3} />
    </div>
  );
}

function PodiumPlace({ entry, place }: { entry: LeaderboardEntry; place: number }) {
  const config = {
    1: {
      height: 'h-28',
      iconColor: 'text-yellow-400',
      borderColor: 'border-yellow-400/30',
      bgColor: 'from-yellow-400/10 to-transparent',
      avatarBorder: 'ring-2 ring-yellow-400',
      size: 'lg' as const,
    },
    2: {
      height: 'h-20',
      iconColor: 'text-gray-300',
      borderColor: 'border-gray-300/30',
      bgColor: 'from-gray-300/10 to-transparent',
      avatarBorder: 'ring-2 ring-gray-300',
      size: 'md' as const,
    },
    3: {
      height: 'h-14',
      iconColor: 'text-amber-600',
      borderColor: 'border-amber-600/30',
      bgColor: 'from-amber-600/10 to-transparent',
      avatarBorder: 'ring-2 ring-amber-600',
      size: 'md' as const,
    },
  }[place]!;

  return (
    <div className="flex flex-col items-center gap-2 w-28">
      <div className="relative">
        <Avatar
          src={entry.avatarUrl}
          alt={entry.displayName}
          size={config.size}
          className={config.avatarBorder}
        />
        <div
          className={cn(
            'absolute -bottom-1 -right-1 w-6 h-6 rounded-full flex items-center justify-center bg-gameflix-bg border',
            config.borderColor
          )}
        >
          {place === 1 ? (
            <Trophy className={cn('w-3.5 h-3.5', config.iconColor)} />
          ) : (
            <Medal className={cn('w-3.5 h-3.5', config.iconColor)} />
          )}
        </div>
      </div>
      <div className="text-center">
        <p className="text-sm font-bold text-gameflix-text-bright truncate max-w-[100px]">
          {entry.displayName}
        </p>
        <p className={cn('text-lg font-bold', config.iconColor)}>
          {formatNumber(entry.score)}
        </p>
      </div>
      <div
        className={cn(
          'w-full rounded-t-xl bg-gradient-to-t border border-b-0',
          config.height,
          config.bgColor,
          config.borderColor
        )}
      />
    </div>
  );
}
