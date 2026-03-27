import { cn, getLevelTitle } from '@/lib/utils';

interface LevelTitleProps {
  level: number;
  className?: string;
}

export function LevelTitle({ level, className }: LevelTitleProps) {
  const title = getLevelTitle(level);

  const colorByLevel = (l: number) => {
    if (l >= 13) return 'text-gameflix-accent';
    if (l >= 11) return 'text-gameflix-danger';
    if (l >= 9) return 'text-gameflix-secondary';
    if (l >= 7) return 'text-gameflix-primary';
    if (l >= 5) return 'text-gameflix-success';
    return 'text-gameflix-text-dim';
  };

  return (
    <span className={cn('text-sm font-medium', colorByLevel(level), className)}>
      {title}
    </span>
  );
}
