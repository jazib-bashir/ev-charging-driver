import { StyleSheet, View, type StyleProp, type ViewStyle } from 'react-native';

import { Text } from '@/components/ui/text';
import { useTheme } from '@/theme';

import { BrandLoader } from './brand-loader';

type PageLoaderProps = {
  /** Short status sentence shown under the loader. */
  message?: string;
  /** Fill the available space (default). Set false for an inline block inside a scroll view. */
  fill?: boolean;
  size?: number;
  style?: StyleProp<ViewStyle>;
};

/**
 * Page-level API loading indicator. Sits inside the page layout (headers / tab bar stay usable),
 * so it never blocks navigation the way `FullScreenLoader` does.
 */
export function PageLoader({ message, fill = true, size = 64, style }: PageLoaderProps) {
  const { theme } = useTheme();

  return (
    <View
      style={[styles.root, fill ? styles.fill : styles.inline, style]}
      accessibilityRole="progressbar"
      accessibilityLabel={message ?? 'Loading'}
    >
      <BrandLoader size={size} />
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
  );
}

const styles = StyleSheet.create({
  root: {
    alignItems: 'center',
    justifyContent: 'center',
    gap: 16,
    paddingHorizontal: 32,
  },
  fill: {
    flex: 1,
  },
  inline: {
    paddingVertical: 48,
  },
  message: {
    fontSize: 14,
    lineHeight: 20,
    textAlign: 'center',
  },
});
