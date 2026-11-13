import { useMemo, type ReactNode } from 'react';
import { Pressable, StyleSheet } from 'react-native';

import { Text } from '@/components/ui/text';
import { useTheme } from '@/theme';

type FilterChipProps = {
  label: string;
  active?: boolean;
  icon?: ReactNode;
  onPress?: () => void;
};

/** Selection chip: neutral surface when idle, solid emerald when selected. */
export function FilterChip({ label, active = false, icon, onPress }: FilterChipProps) {
  const { theme } = useTheme();
  const styles = useMemo(() => createStyles(theme), [theme]);

  return (
    <Pressable
      onPress={onPress}
      style={({ pressed }) => [styles.chip, active && styles.chipActive, pressed && styles.pressed]}
      accessibilityRole="button"
      accessibilityState={{ selected: active }}
    >
      {icon}
      <Text style={[styles.label, active && styles.labelActive]}>{label}</Text>
    </Pressable>
  );
}

function createStyles(theme: ReturnType<typeof useTheme>['theme']) {
  return StyleSheet.create({
    chip: {
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'center',
      alignSelf: 'flex-start',
      gap: theme.spacing.xs,
      paddingHorizontal: 16,
      paddingVertical: 8,
      minHeight: 40,
      borderRadius: theme.radius.pill,
      borderWidth: 1,
      borderColor: theme.colors.border,
      backgroundColor: theme.colors.surface,
    },
    chipActive: {
      backgroundColor: theme.colors.primary,
      borderColor: theme.colors.primary,
    },
    pressed: {
      opacity: 0.85,
    },
    label: {
      fontFamily: theme.typography.fontFamily.semibold,
      fontSize: theme.typography.fontSize.sm,
      color: theme.colors.textChip,
    },
    labelActive: {
      color: theme.colors.onPrimary,
    },
  });
}
