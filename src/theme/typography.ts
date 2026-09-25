export const typography = {
  fontFamily: {
    /** Inter — default UI typeface from design. */
    regular: 'Inter_400Regular',
    medium: 'Inter_500Medium',
    semibold: 'Inter_600SemiBold',
    bold: 'Inter_700Bold',
    /** Outfit — brand / display. */
    brandSemiBold: 'Outfit_600SemiBold',
    brand: 'Outfit_700Bold',
  },
  fontSize: {
    xs: 11,
    sm: 13,
    md: 15,
    lg: 17,
    xl: 20,
    xxl: 22,
    brand: 15,
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
    brand: 22,
  },
} as const;

export type ThemeTypography = typeof typography;
