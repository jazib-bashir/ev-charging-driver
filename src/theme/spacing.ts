/** 4/8pt spacing scale. Screen gutter is 20, section rhythm 24–32, in-card rhythm 12–16. */
export const spacing = {
  xxs: 2,
  xs: 4,
  sm: 8,
  md: 12,
  lg: 16,
  xl: 20,
  xxl: 24,
  xxxl: 32,
  huge: 40,
  giant: 56,
  /** Horizontal screen padding. */
  gutter: 20,
} as const;

export type ThemeSpacing = typeof spacing;
