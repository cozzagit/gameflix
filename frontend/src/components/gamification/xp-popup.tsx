'use client';

import { useState, useEffect } from 'react';
import { cn } from '@/lib/utils';
import { Zap } from 'lucide-react';

interface XpPopupProps {
  amount: number;
  show: boolean;
  onDone?: () => void;
  className?: string;
}

export function XpPopup({ amount, show, onDone, className }: XpPopupProps) {
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    if (show) {
      setVisible(true);
      const timer = setTimeout(() => {
        setVisible(false);
        onDone?.();
      }, 1500);
      return () => clearTimeout(timer);
    }
  }, [show, onDone]);

  if (!visible) return null;

  return (
    <div className={cn('fixed top-20 right-8 z-50 pointer-events-none animate-xp-pop', className)}>
      <div className="flex items-center gap-1.5 bg-gameflix-secondary/90 text-white px-4 py-2 rounded-xl shadow-lg shadow-gameflix-secondary/30">
        <Zap className="w-5 h-5" />
        <span className="text-lg font-bold">+{amount} XP</span>
      </div>
    </div>
  );
}
