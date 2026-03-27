import { cn } from '@/lib/utils';

interface ProgressBarProps {
  value: number;
  max?: number;
  color?: 'primary' | 'secondary' | 'accent' | 'success' | 'brainlab' | 'wordforge' | 'quizarena';
  size?: 'xs' | 'sm' | 'md';
  showLabel?: boolean;
  className?: string;
}

export function ProgressBar({
  value,
  max = 100,
  color = 'primary',
  size = 'sm',
  showLabel = false,
  className,
}: ProgressBarProps) {
  const percentage = Math.min((value / max) * 100, 100);

  const colors = {
    primary: 'bg-gameflix-primary',
    secondary: 'bg-gameflix-secondary',
    accent: 'bg-gameflix-accent',
    success: 'bg-gameflix-success',
    brainlab: 'bg-brainlab',
    wordforge: 'bg-wordforge',
    quizarena: 'bg-quizarena',
  };

  const sizes = {
    xs: 'h-1',
    sm: 'h-2',
    md: 'h-3',
  };

  return (
    <div className={cn('w-full', className)}>
      <div className={cn('w-full rounded-full bg-gameflix-border overflow-hidden', sizes[size])}>
        <div
          className={cn(
            'rounded-full transition-all duration-500 ease-out',
            colors[color],
            sizes[size]
          )}
          style={{ width: `${percentage}%` }}
        />
      </div>
      {showLabel && (
        <div className="flex justify-between mt-1">
          <span className="text-xs text-gameflix-text-dim">{value}</span>
          <span className="text-xs text-gameflix-text-dim">{max}</span>
        </div>
      )}
    </div>
  );
}
