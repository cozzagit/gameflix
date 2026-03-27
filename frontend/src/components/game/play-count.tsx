import { Gamepad2 } from 'lucide-react';
import { cn, formatNumber } from '@/lib/utils';

interface PlayCountProps {
  count: number;
  className?: string;
}

export function PlayCount({ count, className }: PlayCountProps) {
  return (
    <span className={cn('inline-flex items-center gap-1 text-xs text-gameflix-text-dim', className)}>
      <Gamepad2 className="w-3 h-3" />
      {formatNumber(count)} giocate
    </span>
  );
}
