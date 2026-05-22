import { cn } from '@/lib/utils';
import { InputHTMLAttributes, forwardRef } from 'react';

interface InputProps extends InputHTMLAttributes<HTMLInputElement> {
  label?: string;
  error?: string;
  hint?: string;
}

export const Input = forwardRef<HTMLInputElement, InputProps>(
  ({ className, label, error, hint, id, required, ...props }, ref) => {
    const inputId = id || (label ? `input-${label.toLowerCase().replace(/\s+/g, '-')}` : undefined);
    const errorId = error && inputId ? `${inputId}-error` : undefined;
    const hintId = hint && !error && inputId ? `${inputId}-hint` : undefined;
    return (
      <div className="flex flex-col gap-1.5">
        {label && (
          <label htmlFor={inputId} className="text-sm font-medium text-gray-700">
            {label} {required && <span className="text-red-500" aria-hidden="true">*</span>}
            {required && <span className="sr-only"> (required)</span>}
          </label>
        )}
        <input
          ref={ref}
          id={inputId}
          required={required}
          aria-invalid={!!error}
          aria-describedby={errorId || hintId || undefined}
          className={cn(
            'px-3 py-2.5 border rounded-lg text-sm bg-white transition-all outline-none',
            'focus:ring-2 focus:ring-teal-500 focus:border-transparent',
            error ? 'border-red-500 focus:ring-red-500' : 'border-gray-300',
            className
          )}
          {...props}
        />
        {error && <p id={errorId} className="text-xs text-red-600" role="alert">{error}</p>}
        {hint && !error && <p id={hintId} className="text-xs text-gray-500">{hint}</p>}
      </div>
    );
  }
);
Input.displayName = 'Input';
