import { lightColors, type ThemeColors } from '@/theme/colors';
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

/** Active app theme. Swap `colors` here for dark mode or alternate brands later. */
export const theme: Theme = {
  colors: lightColors,
  spacing,
  typography,
  radius,
  shadows,
};

export { lightColors, radius, shadows, spacing, typography };
export type { ThemeColors, ThemeRadius, ThemeShadows, ThemeSpacing, ThemeTypography };
