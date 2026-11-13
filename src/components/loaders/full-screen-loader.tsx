import { StyleSheet, View } from 'react-native';

import { Text } from '@/components/ui/text';
import { useTheme } from '@/theme';

import { BrandLoader } from './brand-loader';

type FullScreenLoaderProps = {
  /** Short status sentence ("Verifying your code…"). */
  message?: string;
  /**
   * `solid` replaces the screen (initial boot / auth gate). `scrim` dims the content underneath
   * (OTP verification transition) while still blocking touches.
   */
  variant?: 'solid' | 'scrim';
};

/**
 * Blocking, full-screen branded loader. Use ONLY when interaction must be blocked: app boot,
 * authentication verification, OTP verification transition or an existing blocking auth gate.
 * For ordinary data loading use `PageLoader` or a skeleton instead.
 */
export function FullScreenLoader({ message, variant = 'solid' }: FullScreenLoaderProps) {
  const { theme } = useTheme();
  const isScrim = variant === 'scrim';

  return (
    <View
      style={[
        StyleSheet.absoluteFill,
        styles.root,
        { backgroundColor: isScrim ? theme.colors.overlay : theme.colors.background },
      ]}
      accessibilityViewIsModal
      accessibilityRole="progressbar"
      accessibilityLabel={message ?? 'Loading'}
    >
      <View
        style={[
          styles.card,
          isScrim && {
            backgroundColor: theme.colors.surface,
            borderColor: theme.colors.border,
            borderWidth: StyleSheet.hairlineWidth,
            ...theme.shadows.raised,
          },
        ]}
      >
        <BrandLoader size={isScrim ? 64 : 80} />
        {message ? (
          <Text
            style={[
              styles.message,
              { color: theme.colors.textSecondary, fontFamily: theme.typography.fontFamily.medium },
            ]}
          >
            {message}
          </Text>
        ) : null}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  root: {
    alignItems: 'center',
    justifyContent: 'center',
    zIndex: 100,
  },
  card: {
    alignItems: 'center',
    gap: 16,
    paddingHorizontal: 32,
    paddingVertical: 28,
    borderRadius: 24,
  },
  message: {
    fontSize: 14,
    lineHeight: 20,
    textAlign: 'center',
    maxWidth: 240,
  },
});
