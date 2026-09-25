import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
  type ReactNode,
} from 'react';

import { darkColors, lightColors, type ThemeColors, type ThemeMode } from '@/theme/colors';
import { radius } from '@/theme/radius';
import { shadows } from '@/theme/shadows';
import { spacing } from '@/theme/spacing';
import { typography } from '@/theme/typography';
import { readThemeMode, saveThemeMode } from '@/theme/theme-storage';

export type AppTheme = {
  colors: ThemeColors;
  spacing: typeof spacing;
  typography: typeof typography;
  radius: typeof radius;
  shadows: typeof shadows;
  mode: ThemeMode;
  isDark: boolean;
};

type ThemeContextValue = {
  theme: AppTheme;
  mode: ThemeMode;
  isDark: boolean;
  setMode: (mode: ThemeMode) => void;
  toggleMode: () => void;
};

const ThemeContext = createContext<ThemeContextValue | null>(null);

function buildTheme(mode: ThemeMode): AppTheme {
  return {
    colors: mode === 'dark' ? (darkColors as ThemeColors) : lightColors,
    spacing,
    typography,
    radius,
    shadows,
    mode,
    isDark: mode === 'dark',
  };
}

export function ThemeProvider({ children }: { children: ReactNode }) {
  const [mode, setModeState] = useState<ThemeMode>('light');

  useEffect(() => {
    let mounted = true;

    void readThemeMode().then((stored) => {
      if (mounted && stored) {
        setModeState(stored);
      }
    });

    return () => {
      mounted = false;
    };
  }, []);

  const setMode = useCallback((next: ThemeMode) => {
    setModeState(next);
    void saveThemeMode(next);
  }, []);

  const toggleMode = useCallback(() => {
    setModeState((prev) => {
      const next: ThemeMode = prev === 'dark' ? 'light' : 'dark';
      void saveThemeMode(next);
      return next;
    });
  }, []);

  const value = useMemo<ThemeContextValue>(() => {
    const appTheme = buildTheme(mode);
    return {
      theme: appTheme,
      mode,
      isDark: appTheme.isDark,
      setMode,
      toggleMode,
    };
  }, [mode, setMode, toggleMode]);

  return <ThemeContext.Provider value={value}>{children}</ThemeContext.Provider>;
}

export function useTheme(): ThemeContextValue {
  const ctx = useContext(ThemeContext);
  if (!ctx) {
    throw new Error('useTheme must be used within ThemeProvider');
  }
  return ctx;
}
