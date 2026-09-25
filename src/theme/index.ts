import {
  lightColors,
  darkColors,
  ACCENT,
  STATUS_AVAILABLE,
  STATUS_FAST,
  type ThemeColors,
  type ThemeMode,
} from '@/theme/colors';
import { radius, type ThemeRadius } from '@/theme/radius';
import { shadows, type ThemeShadows } from '@/theme/shadows';
import { spacing, type ThemeSpacing } from '@/theme/spacing';
import { typography, type ThemeTypography } from '@/theme/typography';

export type Theme = {
  colors: ThemeColors;
  spacing: ThemeSpacing;
  typography: ThemeTypography;
  radius: ThemeRadius;
  shadows: ThemeShadows;
};

/** Static light theme fallback for StyleSheets that cannot use hooks. Prefer `useTheme()`. */
export const theme: Theme = {
  colors: lightColors,
  spacing,
  typography,
  radius,
  shadows,
};

export function getThemeColors(mode: ThemeMode): ThemeColors {
  return mode === 'dark' ? (darkColors as ThemeColors) : lightColors;
}

export { lightColors, darkColors, ACCENT, STATUS_AVAILABLE, STATUS_FAST, radius, shadows, spacing, typography };
export type { ThemeColors, ThemeMode, ThemeRadius, ThemeShadows, ThemeSpacing, ThemeTypography };
export { ThemeProvider, useTheme } from '@/theme/theme-context';
