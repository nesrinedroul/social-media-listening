import { create } from 'zustand';
import type { User } from '../types';

export type Theme = 'light' | 'dark' | 'system';

interface AuthState {
  user: User | null;
  accessToken: string | null;
  refreshToken: string | null;
  theme: Theme;
  setTokens: (access: string, refresh: string) => void;
  setUser: (user: User) => void;
  logout: () => void;
  isAuthenticated: () => boolean;
  setTheme: (t: Theme) => void;
}

function applyTheme(theme: Theme) {
  const root = document.documentElement;
  const prefersDark = window.matchMedia('(prefers-color-scheme: dark)').matches;
  const isDark = theme === 'dark' || (theme === 'system' && prefersDark);
  root.classList.toggle('dark', isDark);
}

export const useAuthStore = create<AuthState>((set, get) => {
  const savedTheme = (localStorage.getItem('theme') as Theme) ?? 'system';
  // Apply on init
  if (typeof document !== 'undefined') applyTheme(savedTheme);

  return {
    user:         null,
    accessToken:  localStorage.getItem('access_token'),
    refreshToken: localStorage.getItem('refresh_token'),
    theme:        savedTheme,

    setTokens: (access, refresh) => {
      localStorage.setItem('access_token', access);
      localStorage.setItem('refresh_token', refresh);
      set({ accessToken: access, refreshToken: refresh });
    },

    setUser: (user) => set({ user }),

    logout: () => {
      localStorage.removeItem('access_token');
      localStorage.removeItem('refresh_token');
      set({ user: null, accessToken: null, refreshToken: null });
    },

    isAuthenticated: () => !!get().accessToken,

    setTheme: (t: Theme) => {
      localStorage.setItem('theme', t);
      applyTheme(t);
      set({ theme: t });
    },
  };
});














// import { create } from 'zustand';
// import type { User } from '../types';

// interface AuthState {
//   user: User | null;
//   accessToken: string | null;
//   refreshToken: string | null;
//   setTokens: (access: string, refresh: string) => void;
//   setUser: (user: User) => void;
//   logout: () => void;
//   isAuthenticated: () => boolean;
// }

// export const useAuthStore = create<AuthState>((set, get) => ({
//   user: null,
//   accessToken: localStorage.getItem('access_token'),
//   refreshToken: localStorage.getItem('refresh_token'),

//   setTokens: (access, refresh) => {
//     localStorage.setItem('access_token', access);
//     localStorage.setItem('refresh_token', refresh);
//     set({ accessToken: access, refreshToken: refresh });
//   },

//   setUser: (user) => set({ user }),

//   logout: () => {
//     localStorage.removeItem('access_token');
//     localStorage.removeItem('refresh_token');
//     set({ user: null, accessToken: null, refreshToken: null });
//   },

//   isAuthenticated: () => !!get().accessToken,
// }));
