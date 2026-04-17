import { forwardRef, type InputHTMLAttributes } from 'react';

interface InputProps extends InputHTMLAttributes<HTMLInputElement> {
  label?: string;
  error?: string;
}

export const Input = forwardRef<HTMLInputElement, InputProps>(
  ({ label, error, className = '', style, ...props }, ref) => (
    <div className="flex flex-col gap-1">
      {label && (
        <label className="text-xs font-medium uppercase tracking-wide" style={{ color: 'var(--text-2)' }}>
          {label}
        </label>
      )}
      <input
        ref={ref}
        className={`rounded-lg px-3 py-2 text-sm placeholder:text-opacity-50 transition-colors ${className}`}
        style={{
          background: 'var(--input-bg)',
          border: `1px solid ${error ? '#ef4444' : 'var(--border)'}`,
          color: 'var(--text-1)',
          outline: 'none',
          ...style,
        }}
        onFocus={e => (e.target as HTMLInputElement).style.borderColor = error ? '#ef4444' : 'var(--brand)'}
        onBlur={e  => (e.target as HTMLInputElement).style.borderColor = error ? '#ef4444' : 'var(--border)'}
        {...props}
      />
      {error && <p className="text-xs text-red-400">{error}</p>}
    </div>
  )
);
Input.displayName = 'Input';
















// import { forwardRef, type InputHTMLAttributes } from 'react';

// interface InputProps extends InputHTMLAttributes<HTMLInputElement> {
//   label?: string;
//   error?: string;
// }

// export const Input = forwardRef<HTMLInputElement, InputProps>(
//   ({ label, error, className = '', ...props }, ref) => (
//     <div className="flex flex-col gap-1">
//       {label && <label className="text-xs font-medium text-slate-400 uppercase tracking-wide">{label}</label>}
//       <input
//         ref={ref}
//         className={`bg-slate-800 border ${error ? 'border-red-500' : 'border-slate-700'} rounded-lg px-3 py-2 text-sm text-slate-100 placeholder:text-slate-500 outline-none focus:border-blue-500 transition-colors ${className}`}
//         {...props}
//       />
//       {error && <p className="text-xs text-red-400">{error}</p>}
//     </div>
//   )
// );
// Input.displayName = 'Input';
