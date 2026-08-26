import { create } from 'zustand';

type Theme = 'light' | 'dark';

interface ThemeState {
  theme: Theme;
  toggleTheme: () => void;
  setTheme: (theme: Theme) => void;
}

const getInitialTheme = (): Theme => {
  if (typeof window !== 'undefined') {
    const stored = localStorage.getItem('maapg-theme') as Theme | null;
    if (stored === 'light' || stored === 'dark') return stored;
  }
  return 'light';
};

export const useThemeStore = create<ThemeState>((set) => ({
  theme: getInitialTheme(),
  toggleTheme: () =>
    set((state) => {
      const next = state.theme === 'light' ? 'dark' : 'light';
      localStorage.setItem('maapg-theme', next);
      return { theme: next };
    }),
  setTheme: (theme) => {
    localStorage.setItem('maapg-theme', theme);
    set({ theme });
  },
}));
