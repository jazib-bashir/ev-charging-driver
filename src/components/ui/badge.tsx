import { useMemo } from 'react';
import { StyleSheet, View, type ViewStyle } from 'react-native';

import { Text } from '@/components/ui/text';
import { useTheme } from '@/theme';

export type BadgeVariant =
  | 'available'
  | 'unavailable'
  | 'neutral'
  | 'distance'
  | 'warning'
  | 'error'
  | 'info'
  | 'solid';

type BadgeProps = {
  label: string;
  variant?: BadgeVariant;
  showDot?: boolean;
  style?: ViewStyle;
};

/** Status pill: Available / In use / Offline / Fast / Info. Semantic colors only – never Coral/Lime. */
export function Badge({ label, variant = 'neutral', showDot = false, style }: BadgeProps) {
  const { theme } = useTheme();
  const styles = useMemo(() => createStyles(theme), [theme]);
  const c = theme.colors;

  const colors = {
    available: { bg: c.statusAvailableBg, text: c.statusAvailable, dot: c.statusDot },
    unavailable: { bg: c.statusUnavailableBg, text: c.textSecondary, dot: c.statusUnavailable },
    neutral: { bg: c.surfaceSunken, text: c.textSecondary, dot: c.textMuted },
    distance: { bg: c.distanceBadgeBg, text: c.distanceBadgeText, dot: c.statusDot },
    warning: { bg: c.warningBg, text: c.warningText, dot: c.warning },
    error: { bg: c.errorBg, text: c.errorText, dot: c.error },
    info: { bg: c.infoBg, text: c.infoText, dot: c.info },
    solid: { bg: c.primary, text: c.onPrimary, dot: c.onPrimary },
  }[variant];

  return (
    <View
      style={[
        styles.badge,
        variant === 'distance' && styles.distanceBadge,
        { backgroundColor: colors.bg },
        style,
      ]}
    >
      {showDot ? <View style={[styles.dot, { backgroundColor: colors.dot }]} /> : null}
      <Text style={[styles.label, { color: colors.text }]}>{label}</Text>
    </View>
  );
}

function createStyles(theme: ReturnType<typeof useTheme>['theme']) {
  return StyleSheet.create({
    badge: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: 6,
      paddingHorizontal: 10,
      paddingVertical: 5,
      borderRadius: theme.radius.pill,
      alignSelf: 'flex-start',
    },
    distanceBadge: {
      ...theme.shadows.badge,
    },
    dot: {
      width: 6,
      height: 6,
      borderRadius: 3,
    },
    label: {
      fontFamily: theme.typography.fontFamily.bold,
      fontSize: 11,
      letterSpacing: 0.2,
    },
  });
}
