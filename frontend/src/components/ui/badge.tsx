import { cn } from '@/lib/utils';
import type { CategorySlug } from '@/lib/types';
import { getCategoryColor, getCategoryLabel } from '@/lib/utils';

interface BadgeProps {
  variant?: 'default' | 'new' | 'trending' | 'premium' | 'coming-soon' | 'category';
  categorySlug?: CategorySlug;
  className?: string;
  children?: React.ReactNode;
}

export function Badge({ variant = 'default', categorySlug, className, children }: BadgeProps) {
  const variants = {
    default: 'bg-gameflix-border text-gameflix-text',
    new: 'bg-gameflix-success/20 text-gameflix-success border border-gameflix-success/30',
    trending: 'bg-gameflix-accent/20 text-gameflix-accent border border-gameflix-accent/30',
    premium: 'bg-gameflix-secondary/20 text-gameflix-secondary border border-gameflix-secondary/30',
    'coming-soon': 'bg-gameflix-text-dim/20 text-gameflix-text-dim border border-gameflix-text-dim/30',
    category: '',
  };

  if (variant === 'category' && categorySlug) {
    const colors = getCategoryColor(categorySlug);
    return (
      <span
        className={cn(
          'inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-semibold',
          colors.bg,
          colors.text,
          `border ${colors.border}`,
          className
        )}
      >
        <span className={cn('w-1.5 h-1.5 rounded-full', colors.dot)} />
        {children || getCategoryLabel(categorySlug)}
      </span>
    );
  }

  return (
    <span
      className={cn(
        'inline-flex items-center px-2.5 py-1 rounded-full text-xs font-semibold uppercase tracking-wider',
        variants[variant],
        className
      )}
    >
      {children}
    </span>
  );
}
