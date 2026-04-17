import { type ButtonHTMLAttributes } from 'react';

interface ButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: 'primary' | 'secondary' | 'ghost' | 'danger';
  size?: 'sm' | 'md' | 'lg';
  loading?: boolean;
}

const sizeMap = { sm: 'px-3 py-1.5 text-xs', md: 'px-4 py-2 text-sm', lg: 'px-6 py-2.5 text-sm' };

export function Button({
  variant = 'primary', size = 'md', loading, children, className = '', disabled, style, ...props
}: ButtonProps) {
  const base = `inline-flex items-center gap-2 font-medium rounded-lg transition-colors
    disabled:opacity-50 disabled:cursor-not-allowed ${sizeMap[size]} ${className}`;

  const variantStyle: React.CSSProperties =
    variant === 'primary'   ? { background: 'var(--brand)',    color: '#fff' } :
    variant === 'secondary' ? { background: 'var(--active)',   color: 'var(--text-1)', border: '1px solid var(--border)' } :
    variant === 'ghost'     ? { background: 'transparent',     color: 'var(--text-2)' } :
    /* danger */               { background: '#7f1d1d22', color: '#f87171', border: '1px solid #7f1d1d44' };

  return (
    <button
      disabled={disabled ?? loading}
      className={base}
      style={{ ...variantStyle, ...style }}
      {...props}
    >
      {loading && (
        <svg className="animate-spin w-3.5 h-3.5" viewBox="0 0 24 24" fill="none">
          <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"/>
          <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z"/>
        </svg>
      )}
      {children}
    </button>
  );
}
