'use client';

import { cn } from '@/lib/utils';

interface Tab {
  value: string;
  label: string;
  count?: number;
}

interface TabsProps {
  tabs: Tab[];
  activeTab: string;
  onTabChange: (value: string) => void;
  className?: string;
}

export function Tabs({ tabs, activeTab, onTabChange, className }: TabsProps) {
  return (
    <div className={cn('flex gap-1 bg-gameflix-surface rounded-xl p-1', className)}>
      {tabs.map((tab) => (
        <button
          key={tab.value}
          onClick={() => onTabChange(tab.value)}
          className={cn(
            'px-4 py-2 rounded-lg text-sm font-medium transition-all duration-200 cursor-pointer',
            activeTab === tab.value
              ? 'bg-gameflix-primary text-gameflix-bg shadow-md'
              : 'text-gameflix-text-dim hover:text-gameflix-text hover:bg-gameflix-card'
          )}
        >
          {tab.label}
          {tab.count !== undefined && (
            <span
              className={cn(
                'ml-1.5 text-xs',
                activeTab === tab.value ? 'text-gameflix-bg/70' : 'text-gameflix-text-dim'
              )}
            >
              ({tab.count})
            </span>
          )}
        </button>
      ))}
    </div>
  );
}
