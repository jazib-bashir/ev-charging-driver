/** Corner radii: controls 14, cards 20, sheets / hero 28, chips + pills fully round. */
export const radius = {
  xs: 6,
  sm: 8,
  md: 12,
  /** Buttons, inputs */
  control: 14,
  lg: 16,
  /** Cards */
  xl: 20,
  /** Sheets, hero panels */
  xxl: 28,
  pill: 999,
} as const;

export type ThemeRadius = typeof radius;
