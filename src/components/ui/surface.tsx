import { useMemo, type ReactNode } from 'react';
import { StyleSheet, View, type StyleProp, type ViewStyle } from 'react-native';

import { useTheme } from '@/theme';

export type SurfaceVariant = 'card' | 'raised' | 'sunken' | 'tinted' | 'hero' | 'outlined';

type SurfaceProps = {
  variant?: SurfaceVariant;
  /** Inner padding in dp (defaults to 16). */
  padding?: number;
  style?: StyleProp<ViewStyle>;
  children?: ReactNode;
};

/**
 * Tiered container used for cards, panels and hero bands.
 * - card: white surface + hairline border + soft elevation
 * - raised: stronger elevation (sheets, floating panels)
 * - sunken: inset well on the canvas (inputs, nested stat groups)
 * - tinted: emerald tint for selected / informational callouts
 * - hero: obsidian panel used selectively (active session, queue, journey)
 * - outlined: border only
 */
export function Surface({ variant = 'card', padding = 16, style, children }: SurfaceProps) {
  const { theme } = useTheme();
  const styles = useMemo(() => createStyles(theme), [theme]);

  return <View style={[styles.base, styles[variant], { padding }, style]}>{children}</View>;
}

function createStyles(theme: ReturnType<typeof useTheme>['theme']) {
  const isDark = theme.isDark;
  return StyleSheet.create({
    base: {
      borderRadius: theme.radius.xl,
      overflow: 'hidden',
    },
    card: {
      backgroundColor: theme.colors.surface,
      borderWidth: StyleSheet.hairlineWidth,
      borderColor: theme.colors.border,
      ...(isDark ? theme.shadows.none : theme.shadows.card),
    },
    raised: {
      backgroundColor: theme.colors.surfaceRaised,
      borderWidth: StyleSheet.hairlineWidth,
      borderColor: theme.colors.border,
      ...(isDark ? theme.shadows.none : theme.shadows.raised),
    },
    sunken: {
      backgroundColor: theme.colors.surfaceSunken,
    },
    tinted: {
      backgroundColor: theme.colors.primaryMuted,
      borderWidth: StyleSheet.hairlineWidth,
      borderColor: theme.colors.selectionBorder,
    },
    hero: {
      backgroundColor: theme.colors.heroBackground,
      borderRadius: theme.radius.xxl,
      borderWidth: StyleSheet.hairlineWidth,
      borderColor: theme.colors.heroBorder,
    },
    outlined: {
      backgroundColor: 'transparent',
      borderWidth: 1,
      borderColor: theme.colors.border,
    },
  });
}
