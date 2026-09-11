import { StyleSheet, Text, View, type ViewStyle } from 'react-native';

import { theme } from '@/theme';

type BadgeVariant = 'available' | 'unavailable' | 'neutral' | 'distance';

type BadgeProps = {
  label: string;
  variant?: BadgeVariant;
  showDot?: boolean;
  style?: ViewStyle;
};

const VARIANT_STYLES: Record<BadgeVariant, { bg: string; text: string; dot?: string }> = {
  available: {
    bg: theme.colors.statusAvailableBg,
    text: theme.colors.textInverse,
    dot: theme.colors.statusDot,
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
};

export function Badge({ label, variant = 'neutral', showDot = false, style }: BadgeProps) {
  const colors = VARIANT_STYLES[variant];

  return (
    <View
      style={[
        styles.badge,
        variant === 'distance' && styles.distanceBadge,
        { backgroundColor: colors.bg },
        style,
      ]}
    >
      {showDot && (
        <View style={[styles.dot, { backgroundColor: colors.dot ?? theme.colors.statusDot }]} />
      )}
      <Text style={[styles.label, { color: colors.text }]}>{label}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
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
    fontSize: 11,
    fontWeight: theme.typography.fontWeight.semibold,
    letterSpacing: 0.1,
  },
});
