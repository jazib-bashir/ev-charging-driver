import {
  lightColors,
  darkColors,
  ACCENT,
  PRIMARY,
  SECONDARY,
  STATUS_AVAILABLE,
  STATUS_FAST,
  type ThemeColors,
  type ThemeMode,
} from '@/theme/colors';
import { BRAND, BRAND_NAME, BRAND_TAGLINE, DRIVER_SPLASH_TAGLINE, SPLASH_LAYOUT, WEAVE_PATHS } from '@/theme/brand';
import { radius, type ThemeRadius } from '@/theme/radius';
import { shadows, type ThemeShadows } from '@/theme/shadows';
import { sizes, type ThemeSizes } from '@/theme/sizes';
import { spacing, type ThemeSpacing } from '@/theme/spacing';
import { textStyles, typography, type ThemeTypography } from '@/theme/typography';

export type Theme = {
  colors: ThemeColors;
  spacing: ThemeSpacing;
  typography: ThemeTypography;
  radius: ThemeRadius;
  shadows: ThemeShadows;
  sizes: ThemeSizes;
};

/** Static light theme fallback for StyleSheets that cannot use hooks. Prefer `useTheme()`. */
export const theme: Theme = {
  colors: lightColors,
  spacing,
  typography,
  radius,
  shadows,
  sizes,
};

export function getThemeColors(mode: ThemeMode): ThemeColors {
  return mode === 'dark' ? (darkColors as ThemeColors) : lightColors;
}

export {
  lightColors,
  darkColors,
  ACCENT,
  PRIMARY,
  SECONDARY,
  STATUS_AVAILABLE,
  STATUS_FAST,
  BRAND,
  BRAND_NAME,
  BRAND_TAGLINE,
  DRIVER_SPLASH_TAGLINE,
  SPLASH_LAYOUT,
  WEAVE_PATHS,
  radius,
  shadows,
  sizes,
  spacing,
  textStyles,
  typography,
};
export type {
  ThemeColors,
  ThemeMode,
  ThemeRadius,
  ThemeShadows,
  ThemeSizes,
  ThemeSpacing,
  ThemeTypography,
};
export { ThemeProvider, useTheme } from '@/theme/theme-context';
export type { AppTheme } from '@/theme/theme-context';
