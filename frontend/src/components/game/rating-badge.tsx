import { ThumbsUp } from 'lucide-react';
import { cn } from '@/lib/utils';

interface RatingBadgeProps {
  percent: number;
  size?: 'sm' | 'md';
  className?: string;
}

export function RatingBadge({ percent, size = 'sm', className }: RatingBadgeProps) {
  const color =
    percent >= 80
      ? 'text-gameflix-success'
      : percent >= 60
        ? 'text-gameflix-accent'
        : 'text-gameflix-danger';

  return (
    <span className={cn('inline-flex items-center gap-1', color, className)}>
      <ThumbsUp className={size === 'sm' ? 'w-3 h-3' : 'w-4 h-4'} />
      <span className={cn('font-semibold', size === 'sm' ? 'text-xs' : 'text-sm')}>
        {percent}%
      </span>
    </span>
  );
}
