import { type HTMLAttributes } from 'react';
import { cn } from '@/lib/utils';

interface CardProps extends HTMLAttributes<HTMLDivElement> {
  hover?: boolean;
  padding?: 'none' | 'sm' | 'md' | 'lg';
}

export function Card({ className, hover = false, padding = 'md', children, ...props }: CardProps) {
  const paddings = {
    none: '',
    sm: 'p-3',
    md: 'p-4 md:p-5',
    lg: 'p-6 md:p-8',
  };

  return (
    <div
      className={cn(
        'bg-gameflix-card rounded-2xl border border-gameflix-border',
        hover && 'transition-all duration-200 hover:border-gameflix-primary/30 hover:shadow-lg hover:shadow-gameflix-primary/5 hover:-translate-y-0.5',
        paddings[padding],
        className
      )}
      {...props}
    >
      {children}
    </div>
  );
}

export function CardHeader({ className, children, ...props }: HTMLAttributes<HTMLDivElement>) {
  return (
    <div className={cn('mb-4', className)} {...props}>
      {children}
    </div>
  );
}

export function CardTitle({ className, children, ...props }: HTMLAttributes<HTMLHeadingElement>) {
  return (
    <h3 className={cn('text-lg font-bold text-gameflix-text-bright', className)} {...props}>
      {children}
    </h3>
  );
}
