import { useEffect } from 'react';
import { X, MessageSquare, AlertCircle, CheckCircle } from 'lucide-react';
import { useToastStore, type ToastKind, type ToastItem } from '../../utils/toast';

// ─── Icons + colours per kind ─────────────────────────────────────────────────

const kindCfg: Record<ToastKind, { Icon: React.ElementType; bar: string; iconCls: string }> = {
  info:    { Icon: MessageSquare, bar: 'bg-brand',          iconCls: 'text-brand'          },
  success: { Icon: CheckCircle,   bar: 'bg-emerald-500',    iconCls: 'text-emerald-500'    },
  error:   { Icon: AlertCircle,   bar: 'bg-red-500',        iconCls: 'text-red-400'        },
};

// ─── Single toast item ────────────────────────────────────────────────────────

function ToastItem({ item }: { item: ToastItem }) {
  const remove = useToastStore(s => s.remove);
  const { Icon, bar, iconCls } = kindCfg[item.kind];

  return (
    <div
      className="relative flex items-start gap-3 w-80 bg-popup border border-theme rounded-xl shadow-2xl px-4 py-3 overflow-hidden animate-toast-in"
      role="alert"
    >
      {/* Accent bar */}
      <span className={`absolute left-0 top-0 bottom-0 w-1 rounded-l-xl ${bar}`} />

      <Icon size={15} className={`shrink-0 mt-0.5 ${iconCls}`} />

      <p className="flex-1 text-sm text-1 leading-snug">{item.message}</p>

      <button
        onClick={() => remove(item.id)}
        className="shrink-0 text-3 hover:text-1 transition-colors mt-0.5"
        aria-label="Dismiss"
      >
        <X size={13} />
      </button>
    </div>
  );
}

// ─── Container (mount once in AppShell) ──────────────────────────────────────

export function Toaster() {
  const toasts = useToastStore(s => s.toasts);

  /* Inject the keyframe once */
  useEffect(() => {
    const styleId = 'toast-keyframes';
    if (document.getElementById(styleId)) return;
    const style = document.createElement('style');
    style.id = styleId;
    style.textContent = `
      @keyframes toast-in {
        from { opacity: 0; transform: translateY(8px) scale(0.97); }
        to   { opacity: 1; transform: translateY(0)   scale(1);    }
      }
      .animate-toast-in { animation: toast-in 0.18s ease-out both; }
    `;
    document.head.appendChild(style);
  }, []);

  if (toasts.length === 0) return null;

  return (
    <div className="fixed bottom-5 right-5 z-200 flex flex-col gap-2 items-end">
      {toasts.map(t => <ToastItem key={t.id} item={t} />)}
    </div>
  );
}