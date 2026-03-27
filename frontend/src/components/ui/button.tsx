'use client';

import { forwardRef, type ButtonHTMLAttributes } from 'react';
import { cn } from '@/lib/utils';

interface ButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: 'primary' | 'secondary' | 'ghost' | 'danger' | 'accent' | 'outline';
  size?: 'sm' | 'md' | 'lg';
  isLoading?: boolean;
  fullWidth?: boolean;
}

const Button = forwardRef<HTMLButtonElement, ButtonProps>(
  ({ className, variant = 'primary', size = 'md', isLoading, fullWidth, children, disabled, ...props }, ref) => {
    const baseStyles =
      'inline-flex items-center justify-center gap-2 font-semibold rounded-xl transition-all duration-200 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-offset-gameflix-bg disabled:opacity-50 disabled:cursor-not-allowed cursor-pointer';

    const variants = {
      primary:
        'bg-gameflix-primary text-gameflix-bg hover:bg-gameflix-primary/90 focus:ring-gameflix-primary shadow-lg shadow-gameflix-primary/20',
      secondary:
        'bg-gameflix-secondary text-white hover:bg-gameflix-secondary/90 focus:ring-gameflix-secondary shadow-lg shadow-gameflix-secondary/20',
      ghost:
        'bg-transparent text-gameflix-text hover:bg-gameflix-card focus:ring-gameflix-border',
      danger:
        'bg-gameflix-danger text-white hover:bg-gameflix-danger/90 focus:ring-gameflix-danger shadow-lg shadow-gameflix-danger/20',
      accent:
        'bg-gameflix-accent text-gameflix-bg hover:bg-gameflix-accent/90 focus:ring-gameflix-accent shadow-lg shadow-gameflix-accent/20',
      outline:
        'bg-transparent border border-gameflix-border text-gameflix-text hover:bg-gameflix-card hover:border-gameflix-primary/50 focus:ring-gameflix-primary',
    };

    const sizes = {
      sm: 'px-3 py-1.5 text-sm',
      md: 'px-5 py-2.5 text-sm',
      lg: 'px-7 py-3.5 text-base',
    };

    return (
      <button
        ref={ref}
        className={cn(
          baseStyles,
          variants[variant],
          sizes[size],
          fullWidth && 'w-full',
          className
        )}
        disabled={disabled || isLoading}
        {...props}
      >
        {isLoading && (
          <svg
            className="animate-spin h-4 w-4"
            xmlns="http://www.w3.org/2000/svg"
            fill="none"
            viewBox="0 0 24 24"
          >
            <circle
              className="opacity-25"
              cx="12"
              cy="12"
              r="10"
              stroke="currentColor"
              strokeWidth="4"
            />
            <path
              className="opacity-75"
              fill="currentColor"
              d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
            />
          </svg>
        )}
        {children}
      </button>
    );
  }
);

Button.displayName = 'Button';

export { Button };
export type { ButtonProps };
