import { forwardRef, type InputHTMLAttributes } from 'react';

interface InputProps extends InputHTMLAttributes<HTMLInputElement> {
  label?: string;
  error?: string;
}

export const Input = forwardRef<HTMLInputElement, InputProps>(
  ({ label, error, className = '', ...props }, ref) => (
    <div className="flex flex-col gap-1">
      {label && (
        <label className="text-xs font-medium text-2 uppercase tracking-wide">{label}</label>
      )}
      <input
        ref={ref}
        className={`bg-input border ${
          error ? 'border-red-500' : 'border-theme'
        } rounded-lg px-3 py-2 text-sm text-1 placeholder:text-3 outline-none focus:border-brand transition-colors ${className}`}
        {...props}
      />
      {error && <p className="text-xs text-red-500">{error}</p>}
    </div>
  )
);
Input.displayName = 'Input';