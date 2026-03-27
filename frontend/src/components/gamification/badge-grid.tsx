import { cn } from '@/lib/utils';
import { BadgeCard } from './badge-card';
import type { UserBadge, Badge } from '@/lib/types';

interface BadgeGridProps {
  badges: UserBadge[];
  allBadges?: Badge[];
  className?: string;
}

export function BadgeGrid({ badges, allBadges, className }: BadgeGridProps) {
  const earnedMap = new Map(badges.map((ub) => [ub.badge.id, ub]));
  const displayBadges = allBadges || badges.map((ub) => ub.badge);

  return (
    <div className={cn('grid grid-cols-3 md:grid-cols-4 lg:grid-cols-6 gap-3', className)}>
      {displayBadges.map((badge) => (
        <BadgeCard
          key={badge.id}
          badge={badge}
          earned={earnedMap.get(badge.id)}
        />
      ))}
    </div>
  );
}
