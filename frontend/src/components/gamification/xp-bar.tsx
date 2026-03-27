import { cn, getXpProgress, getLevelTitle } from '@/lib/utils';
import { ProgressBar } from '@/components/ui/progress-bar';
import { Zap } from 'lucide-react';

interface XpBarProps {
  totalXp: number;
  currentLevel: number;
  size?: 'sm' | 'md' | 'lg';
  showTitle?: boolean;
  className?: string;
}

export function XpBar({ totalXp, currentLevel, size = 'md', showTitle = false, className }: XpBarProps) {
  const { xpInLevel, xpNeeded, percentage } = getXpProgress(totalXp, currentLevel);

  if (size === 'sm') {
    return (
      <div className={cn('flex items-center gap-2', className)}>
        <div className="flex items-center gap-1 bg-gameflix-secondary/20 rounded-full px-2 py-0.5">
          <Zap className="w-3 h-3 text-gameflix-secondary" />
          <span className="text-xs font-bold text-gameflix-secondary">Lv.{currentLevel}</span>
        </div>
        <div className="w-20">
          <ProgressBar value={percentage} size="xs" color="secondary" />
        </div>
      </div>
    );
  }

  return (
    <div className={cn('space-y-1', className)}>
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <div className="flex items-center gap-1 bg-gameflix-secondary/20 rounded-full px-2.5 py-1">
            <Zap className="w-3.5 h-3.5 text-gameflix-secondary" />
            <span className="text-sm font-bold text-gameflix-secondary">Lv.{currentLevel}</span>
          </div>
          {showTitle && (
            <span className="text-sm text-gameflix-text-dim">{getLevelTitle(currentLevel)}</span>
          )}
        </div>
        <span className="text-xs text-gameflix-text-dim">
          {xpInLevel} / {xpNeeded} XP
        </span>
      </div>
      <ProgressBar
        value={percentage}
        size={size === 'lg' ? 'md' : 'sm'}
        color="secondary"
      />
    </div>
  );
}
