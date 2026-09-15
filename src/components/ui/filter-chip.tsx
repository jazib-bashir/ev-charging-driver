import type { ReactNode } from 'react';
import { Pressable, StyleSheet, Text } from 'react-native';

import { theme } from '@/theme';

type FilterChipProps = {
  label: string;
  active?: boolean;
  icon?: ReactNode;
  onPress?: () => void;
};

export function FilterChip({ label, active = false, icon, onPress }: FilterChipProps) {
  return (
    <Pressable
      onPress={onPress}
      style={[styles.chip, active && styles.chipActive]}
      accessibilityRole="button"
      accessibilityState={{ selected: active }}
    >
      {icon}
      <Text style={[styles.label, active && styles.labelActive]}>{label}</Text>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  chip: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    alignSelf: 'flex-start',
    gap: theme.spacing.xs,
    paddingHorizontal: theme.spacing.md,
    paddingVertical: 8,
    minHeight: 40,
    borderRadius: theme.radius.xl,
    borderWidth: 1,
    borderColor: theme.colors.border,
    backgroundColor: theme.colors.surface,
  },
  chipActive: {
    backgroundColor: theme.colors.selectionForeground,
    borderColor: theme.colors.selectionForeground,
  },
  label: {
    fontSize: theme.typography.fontSize.sm,
    fontWeight: theme.typography.fontWeight.medium,
    color: theme.colors.textPrimary,
  },
  labelActive: {
    color: theme.colors.textInverse,
  },
});
