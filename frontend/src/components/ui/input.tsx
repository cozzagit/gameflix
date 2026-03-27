import { forwardRef, type InputHTMLAttributes } from 'react';
import { cn } from '@/lib/utils';

interface InputProps extends InputHTMLAttributes<HTMLInputElement> {
  label?: string;
  error?: string;
  icon?: React.ReactNode;
}

const Input = forwardRef<HTMLInputElement, InputProps>(
  ({ className, label, error, icon, id, ...props }, ref) => {
    const inputId = id || label?.toLowerCase().replace(/\s+/g, '-');

    return (
      <div className="w-full">
        {label && (
          <label
            htmlFor={inputId}
            className="block text-sm font-medium text-gameflix-text mb-1.5"
          >
            {label}
          </label>
        )}
        <div className="relative">
          {icon && (
            <div className="absolute left-3 top-1/2 -translate-y-1/2 text-gameflix-text-dim">
              {icon}
            </div>
          )}
          <input
            ref={ref}
            id={inputId}
            className={cn(
              'w-full bg-gameflix-surface border border-gameflix-border rounded-xl px-4 py-2.5 text-sm text-gameflix-text placeholder:text-gameflix-text-dim',
              'focus:outline-none focus:ring-2 focus:ring-gameflix-primary/50 focus:border-gameflix-primary',
              'transition-all duration-200',
              icon && 'pl-10',
              error && 'border-gameflix-danger focus:ring-gameflix-danger/50 focus:border-gameflix-danger',
              className
            )}
            {...props}
          />
        </div>
        {error && (
          <p className="mt-1.5 text-xs text-gameflix-danger">{error}</p>
        )}
      </div>
    );
  }
);

Input.displayName = 'Input';

export { Input };
