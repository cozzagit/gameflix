import { cn } from '@/lib/utils';
import { getDifficultyLabel } from '@/lib/utils';
import type { Difficulty } from '@/lib/types';

interface DifficultyDotsProps {
  difficulty: Difficulty;
  showLabel?: boolean;
  size?: 'sm' | 'md';
  className?: string;
}

export function DifficultyDots({ difficulty, showLabel = false, size = 'sm', className }: DifficultyDotsProps) {
  const dotSize = size === 'sm' ? 'w-1.5 h-1.5' : 'w-2 h-2';

  return (
    <div className={cn('flex items-center gap-1.5', className)}>
      <div className="flex gap-0.5">
        {Array.from({ length: 5 }, (_, i) => (
          <span
            key={i}
            className={cn(
              'rounded-full transition-colors',
              dotSize,
              i < difficulty
                ? difficulty <= 2
                  ? 'bg-gameflix-success'
                  : difficulty <= 3
                    ? 'bg-gameflix-accent'
                    : 'bg-gameflix-danger'
                : 'bg-gameflix-border'
            )}
          />
        ))}
      </div>
      {showLabel && (
        <span className="text-xs text-gameflix-text-dim">{getDifficultyLabel(difficulty)}</span>
      )}
    </div>
  );
}
