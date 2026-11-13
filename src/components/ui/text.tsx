import { forwardRef } from 'react';
import {
  StyleSheet,
  Text as RNText,
  TextInput as RNTextInput,
  type StyleProp,
  type TextInputProps,
  type TextProps,
  type TextStyle,
} from 'react-native';

import { typography } from '@/theme/typography';

const WEIGHT_TO_FAMILY: Record<string, string> = {
  '100': typography.fontFamily.regular,
  '200': typography.fontFamily.regular,
  '300': typography.fontFamily.regular,
  '400': typography.fontFamily.regular,
  normal: typography.fontFamily.regular,
  '500': typography.fontFamily.medium,
  '600': typography.fontFamily.semibold,
  '700': typography.fontFamily.bold,
  bold: typography.fontFamily.bold,
  '800': typography.fontFamily.extrabold,
  '900': typography.fontFamily.extrabold,
};

/**
 * Resolves the konnectEV font for a style:
 * - No `fontFamily` -> Plus Jakarta Sans picked from `fontWeight` (default UI font).
 * - A konnectEV family is given -> `fontWeight` is dropped so Android does not synthesize faux-bold.
 */
function resolveFont(style: StyleProp<TextStyle>): StyleProp<TextStyle> {
  const flat = StyleSheet.flatten(style) as TextStyle | undefined;

  if (!flat) {
    return { fontFamily: typography.fontFamily.regular };
  }

  if (flat.fontFamily) {
    if (flat.fontWeight && /^(PlusJakartaSans|SpaceGrotesk)_/.test(flat.fontFamily)) {
      const { fontWeight: _ignored, ...rest } = flat;
      return rest;
    }
    return style;
  }

  const weight = flat.fontWeight ? String(flat.fontWeight) : '400';
  const family = WEIGHT_TO_FAMILY[weight] ?? typography.fontFamily.regular;
  const { fontWeight: _weight, ...rest } = flat;
  return { ...rest, fontFamily: family };
}

/** Drop-in replacement for React Native `Text` that always renders konnectEV typography. */
export const Text = forwardRef<RNText, TextProps>(function Text({ style, ...rest }, ref) {
  return <RNText ref={ref} style={resolveFont(style)} {...rest} />;
});

/** Drop-in replacement for React Native `TextInput` that always renders konnectEV typography. */
export const TextInput = forwardRef<RNTextInput, TextInputProps>(function TextInput(
  { style, ...rest },
  ref,
) {
  return <RNTextInput ref={ref} style={resolveFont(style)} {...rest} />;
});
