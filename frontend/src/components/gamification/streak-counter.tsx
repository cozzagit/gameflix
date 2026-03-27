import { Flame } from 'lucide-react';
import { cn, getStreakTier } from '@/lib/utils';

interface StreakCounterProps {
  streak: number;
  size?: 'sm' | 'md' | 'lg';
  showLabel?: boolean;
  className?: string;
}

export function StreakCounter({ streak, size = 'md', showLabel = false, className }: StreakCounterProps) {
  const tier = getStreakTier(streak);

  const sizes = {
    sm: { icon: 'w-4 h-4', text: 'text-sm', gap: 'gap-0.5' },
    md: { icon: 'w-5 h-5', text: 'text-base', gap: 'gap-1' },
    lg: { icon: 'w-7 h-7', text: 'text-xl', gap: 'gap-1.5' },
  };

  return (
    <div className={cn('flex items-center', sizes[size].gap, className)}>
      <Flame className={cn(sizes[size].icon, tier.color, streak > 0 && 'drop-shadow-sm')} />
      <span className={cn('font-bold tabular-nums', sizes[size].text, tier.color)}>
        {streak}
      </span>
      {showLabel && (
        <span className={cn('text-xs', tier.color)}>{tier.label}</span>
      )}
    </div>
  );
}
