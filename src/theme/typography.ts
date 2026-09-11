export const typography = {
  fontFamily: {
    regular: undefined,
    medium: undefined,
    semibold: undefined,
    bold: undefined,
  },
  fontSize: {
    xs: 11,
    sm: 13,
    md: 15,
    lg: 17,
    xl: 20,
    xxl: 22,
    brand: 22,
  },
  fontWeight: {
    regular: '400' as const,
    medium: '500' as const,
    semibold: '600' as const,
    bold: '700' as const,
  },
  lineHeight: {
    tight: 18,
    normal: 20,
    relaxed: 22,
  },
} as const;

export type ThemeTypography = typeof typography;
