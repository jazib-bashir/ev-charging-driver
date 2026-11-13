import type { TextStyle } from 'react-native';

/**
 * konnectEV typography (shared with the Dashboard + brand guidelines):
 * - Space Grotesk: headings, display text, big numbers, wordmark.
 * - Plus Jakarta Sans: body copy, labels, inputs, buttons and all UI text.
 *
 * Compact second pass: headings step down more than body/caption so hierarchy
 * stays clear without crowding the canvas.
 */
export const typography = {
  fontFamily: {
    /** Plus Jakarta Sans – body / UI */
    regular: 'PlusJakartaSans_400Regular',
    medium: 'PlusJakartaSans_500Medium',
    semibold: 'PlusJakartaSans_600SemiBold',
    bold: 'PlusJakartaSans_700Bold',
    extrabold: 'PlusJakartaSans_800ExtraBold',
    /** Space Grotesk – headings / display */
    displayMedium: 'SpaceGrotesk_500Medium',
    brandSemiBold: 'SpaceGrotesk_600SemiBold',
    brand: 'SpaceGrotesk_700Bold',
  },
  fontSize: {
    xs: 10,
    sm: 11,
    md: 13,
    lg: 15,
    xl: 17,
    xxl: 20,
    display: 26,
    hero: 36,
    brand: 13,
  },
  fontWeight: {
    regular: '400' as const,
    medium: '500' as const,
    semibold: '600' as const,
    bold: '700' as const,
  },
  lineHeight: {
    tight: 18,
    normal: 21,
    relaxed: 24,
    brand: 22,
  },
} as const;

/** Ready-made text styles. Compose with a color from `theme.colors`. */
export const textStyles = {
  display: {
    fontFamily: typography.fontFamily.brand,
    fontSize: 26,
    lineHeight: 32,
    letterSpacing: -0.9,
  },
  h1: {
    fontFamily: typography.fontFamily.brand,
    fontSize: 22,
    lineHeight: 28,
    letterSpacing: -0.6,
  },
  h2: {
    fontFamily: typography.fontFamily.brand,
    fontSize: 18,
    lineHeight: 24,
    letterSpacing: -0.35,
  },
  h3: {
    fontFamily: typography.fontFamily.brandSemiBold,
    fontSize: 15,
    lineHeight: 21,
    letterSpacing: -0.25,
  },
  numeric: {
    fontFamily: typography.fontFamily.brand,
    fontSize: 16,
    lineHeight: 20,
    letterSpacing: -0.35,
  },
  body: {
    fontFamily: typography.fontFamily.regular,
    fontSize: 13,
    lineHeight: 20,
  },
  bodyStrong: {
    fontFamily: typography.fontFamily.semibold,
    fontSize: 13,
    lineHeight: 20,
  },
  label: {
    fontFamily: typography.fontFamily.semibold,
    fontSize: 11,
    lineHeight: 16,
  },
  caption: {
    fontFamily: typography.fontFamily.medium,
    fontSize: 10,
    lineHeight: 14,
  },
  overline: {
    fontFamily: typography.fontFamily.bold,
    fontSize: 10,
    lineHeight: 13,
    letterSpacing: 1.2,
    textTransform: 'uppercase',
  },
} satisfies Record<string, TextStyle>;

export type ThemeTypography = typeof typography;
