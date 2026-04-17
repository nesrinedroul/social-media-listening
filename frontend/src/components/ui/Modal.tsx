import { type ReactNode, useEffect } from 'react';
import { X } from 'lucide-react';

interface ModalProps {
  open: boolean;
  onClose: () => void;
  title: string;
  children: ReactNode;
  width?: string;
}

export function Modal({ open, onClose, title, children, width = 'max-w-md' }: ModalProps) {
  useEffect(() => {
    const handler = (e: KeyboardEvent) => e.key === 'Escape' && onClose();
    document.addEventListener('keydown', handler);
    return () => document.removeEventListener('keydown', handler);
  }, [onClose]);

  if (!open) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      <div
        className="absolute inset-0 backdrop-blur-sm"
        style={{ background: 'rgba(0,0,0,0.45)' }}
        onClick={onClose}
      />
      <div
        className={`relative ${width} w-full rounded-xl shadow-2xl`}
        style={{ background: 'var(--popup)', border: '1px solid var(--border)' }}
      >
        <div
          className="flex items-center justify-between px-5 py-4"
          style={{ borderBottom: '1px solid var(--border)' }}
        >
          <h2 className="text-sm font-semibold text-1">{title}</h2>
          <button
            onClick={onClose}
            className="transition-colors rounded-lg p-0.5"
            style={{ color: 'var(--text-2)' }}
            onMouseEnter={e => (e.currentTarget as HTMLElement).style.color = 'var(--text-1)'}
            onMouseLeave={e => (e.currentTarget as HTMLElement).style.color = 'var(--text-2)'}
          >
            <X size={16} />
          </button>
        </div>
        <div className="p-5">{children}</div>
      </div>
    </div>
  );
}















// import { type ReactNode, useEffect } from 'react';
// import { X } from 'lucide-react';

// interface ModalProps {
//   open: boolean;
//   onClose: () => void;
//   title: string;
//   children: ReactNode;
//   width?: string;
// }

// export function Modal({ open, onClose, title, children, width = 'max-w-md' }: ModalProps) {
//   useEffect(() => {
//     const handler = (e: KeyboardEvent) => e.key === 'Escape' && onClose();
//     document.addEventListener('keydown', handler);
//     return () => document.removeEventListener('keydown', handler);
//   }, [onClose]);

//   if (!open) return null;

//   return (
//     <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
//       <div className="absolute inset-0 bg-black/60 backdrop-blur-sm" onClick={onClose} />
//       <div className={`relative ${width} w-full bg-slate-900 border border-slate-700/60 rounded-xl shadow-2xl`}>
//         <div className="flex items-center justify-between px-5 py-4 border-b border-slate-700/60">
//           <h2 className="text-sm font-semibold text-slate-100">{title}</h2>
//           <button onClick={onClose} className="text-slate-400 hover:text-slate-200 transition-colors">
//             <X size={16} />
//           </button>
//         </div>
//         <div className="p-5">{children}</div>
//       </div>
//     </div>
//   );
// }
