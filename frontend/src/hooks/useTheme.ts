import { create } from 'zustand';

export type ThemeMode = 'light' | 'dark' | 'system';

interface ThemeState {
  mode: ThemeMode;
  setMode: (mode: ThemeMode) => void;
  resolvedTheme: () => 'light' | 'dark';
}

function applyTheme(mode: ThemeMode) {
  const root = document.documentElement;
  const prefersDark = window.matchMedia('(prefers-color-scheme: dark)').matches;
  const isDark = mode === 'dark' || (mode === 'system' && prefersDark);
  root.classList.toggle('dark', isDark);
}

const saved = (localStorage.getItem('theme') as ThemeMode) ?? 'system';
applyTheme(saved);

// Listen to system preference changes
window.matchMedia('(prefers-color-scheme: dark)').addEventListener('change', () => {
  const current = (localStorage.getItem('theme') as ThemeMode) ?? 'system';
  if (current === 'system') applyTheme('system');
});

export const useTheme = create<ThemeState>((set, get) => ({
  mode: saved,

  setMode: (mode) => {
    localStorage.setItem('theme', mode);
    applyTheme(mode);
    set({ mode });
  },

  resolvedTheme: () => {
    const mode = get().mode;
    if (mode === 'system') {
      return window.matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light';
    }
    return mode;
  },
}));
