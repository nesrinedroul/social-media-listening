import { create } from 'zustand';

// ─── Types ───────────────────────────────────────────────────────────────────

export type ToastKind = 'info' | 'success' | 'error';

interface ToastItem {
  id: string;
  message: string;
  kind: ToastKind;
}

interface ToastStore {
  toasts: ToastItem[];
  push: (message: string, kind?: ToastKind) => void;
  remove: (id: string) => void;
}

// ─── Store ───────────────────────────────────────────────────────────────────

const useToastStore = create<ToastStore>((set) => ({
  toasts: [],
  push: (message, kind = 'info') => {
    const id = Math.random().toString(36).slice(2);
    set(s => ({ toasts: [...s.toasts, { id, message, kind }] }));
    // Auto-dismiss after 5 s
    setTimeout(() => set(s => ({ toasts: s.toasts.filter(t => t.id !== id) })), 5_000);
  },
  remove: (id) => set(s => ({ toasts: s.toasts.filter(t => t.id !== id) })),
}));

/** Call anywhere to show a toast notification. */
export function toast(message: string, kind: ToastKind = 'info') {
  useToastStore.getState().push(message, kind);
}

export { useToastStore, type ToastItem };