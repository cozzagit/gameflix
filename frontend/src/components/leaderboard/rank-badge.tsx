import { cn } from '@/lib/utils';
import { Trophy } from 'lucide-react';

interface RankBadgeProps {
  rank: number;
  size?: 'sm' | 'md' | 'lg';
  className?: string;
}

export function RankBadge({ rank, size = 'md', className }: RankBadgeProps) {
  const getMedalColor = (r: number) => {
    if (r === 1) return 'text-yellow-400 bg-yellow-400/10 border-yellow-400/30';
    if (r === 2) return 'text-gray-300 bg-gray-300/10 border-gray-300/30';
    if (r === 3) return 'text-amber-600 bg-amber-600/10 border-amber-600/30';
    return 'text-gameflix-text-dim bg-gameflix-surface border-gameflix-border';
  };

  const sizes = {
    sm: 'w-6 h-6 text-xs',
    md: 'w-8 h-8 text-sm',
    lg: 'w-10 h-10 text-base',
  };

  if (rank <= 3) {
    return (
      <div
        className={cn(
          'flex items-center justify-center rounded-full border font-bold',
          getMedalColor(rank),
          sizes[size],
          className
        )}
      >
        {rank === 1 ? <Trophy className={cn(size === 'sm' ? 'w-3 h-3' : size === 'md' ? 'w-4 h-4' : 'w-5 h-5')} /> : `#${rank}`}
      </div>
    );
  }

  return (
    <div
      className={cn(
        'flex items-center justify-center rounded-full font-semibold',
        getMedalColor(rank),
        sizes[size],
        className
      )}
    >
      #{rank}
    </div>
  );
}
