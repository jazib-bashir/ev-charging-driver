import { useMemo } from 'react';
import { StyleSheet, Text, View, type ViewStyle } from 'react-native';

import { useTheme } from '@/theme';

type BadgeVariant = 'available' | 'unavailable' | 'neutral' | 'distance';

type BadgeProps = {
  label: string;
  variant?: BadgeVariant;
  showDot?: boolean;
  style?: ViewStyle;
};

export function Badge({ label, variant = 'neutral', showDot = false, style }: BadgeProps) {
  const { theme } = useTheme();
  const styles = useMemo(() => createStyles(theme), [theme]);

  const colors = {
    available: {
      bg: theme.colors.statusAvailableBg,
      text: theme.colors.statusAvailable,
      dot: theme.colors.statusAvailable,
    },
    unavailable: {
      bg: theme.colors.statusUnavailableBg,
      text: theme.colors.textInverse,
    },
    neutral: {
      bg: theme.colors.statusUnavailable,
      text: theme.colors.textInverse,
    },
    distance: {
      bg: theme.colors.distanceBadgeBg,
      text: theme.colors.distanceBadgeText,
    },
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
      {showDot ? (
        <View style={[styles.dot, { backgroundColor: colors.dot ?? theme.colors.statusAvailable }]} />
      ) : null}
      <Text style={[styles.label, { color: colors.text }]}>{label}</Text>
    </View>
  );
}

function createStyles(theme: ReturnType<typeof useTheme>['theme']) {
  return StyleSheet.create({
    badge: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: 5,
      paddingHorizontal: 10,
      paddingVertical: 5,
      borderRadius: theme.radius.pill,
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
      fontFamily: theme.typography.fontFamily.semibold,
      fontSize: 11,
      letterSpacing: 0.1,
      fontWeight: '600',
    },
  });
}
