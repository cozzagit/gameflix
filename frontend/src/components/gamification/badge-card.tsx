import { cn } from '@/lib/utils';
import { Lock, Award } from 'lucide-react';
import type { Badge as BadgeType, UserBadge } from '@/lib/types';

interface BadgeCardProps {
  badge: BadgeType;
  earned?: UserBadge;
  className?: string;
}

export function BadgeCard({ badge, earned, className }: BadgeCardProps) {
  const isEarned = !!earned;

  return (
    <div
      className={cn(
        'flex flex-col items-center gap-2 p-4 rounded-2xl border transition-all duration-200',
        isEarned
          ? 'bg-gameflix-card border-gameflix-primary/30 hover:border-gameflix-primary/50'
          : 'bg-gameflix-surface border-gameflix-border opacity-50',
        className
      )}
    >
      <div
        className={cn(
          'w-14 h-14 rounded-xl flex items-center justify-center',
          isEarned
            ? 'bg-gradient-to-br from-gameflix-primary/20 to-gameflix-secondary/20'
            : 'bg-gameflix-border/50'
        )}
      >
        {badge.iconUrl ? (
          <img
            src={badge.iconUrl}
            alt={badge.name}
            className={cn('w-8 h-8', !isEarned && 'grayscale')}
          />
        ) : isEarned ? (
          <Award className="w-7 h-7 text-gameflix-primary" />
        ) : (
          <Lock className="w-5 h-5 text-gameflix-text-dim" />
        )}
      </div>
      <div className="text-center">
        <p
          className={cn(
            'text-sm font-semibold',
            isEarned ? 'text-gameflix-text-bright' : 'text-gameflix-text-dim'
          )}
        >
          {badge.name}
        </p>
        <p className="text-[11px] text-gameflix-text-dim mt-0.5 line-clamp-2">
          {badge.description}
        </p>
      </div>
    </div>
  );
}
