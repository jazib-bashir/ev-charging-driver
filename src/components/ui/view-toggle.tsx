import { useMemo } from 'react';
import { Pressable, StyleSheet, View } from 'react-native';

import { Icon, type IconName } from '@/components/ui/icon';
import { useTheme } from '@/theme';

export type ViewMode = 'list' | 'map';

type ViewToggleProps = {
  value: ViewMode;
  onChange: (mode: ViewMode) => void;
};

const OPTIONS: { mode: ViewMode; icon: IconName; label: string }[] = [
  { mode: 'list', icon: 'list', label: 'List view' },
  { mode: 'map', icon: 'map', label: 'Map view' },
];

export function ViewToggle({ value, onChange }: ViewToggleProps) {
  const { theme } = useTheme();
  const styles = useMemo(() => createStyles(theme), [theme]);

  return (
    <View style={styles.container}>
      {OPTIONS.map(({ mode, icon, label }) => {
        const active = value === mode;
        return (
          <Pressable
            key={mode}
            onPress={() => onChange(mode)}
            style={[styles.button, active && styles.buttonActive]}
            accessibilityRole="button"
            accessibilityLabel={label}
            accessibilityState={{ selected: active }}
          >
            <Icon name={icon} size={18} color={active ? theme.colors.onPrimary : theme.colors.textMuted} />
          </Pressable>
        );
      })}
    </View>
  );
}

function createStyles(theme: ReturnType<typeof useTheme>['theme']) {
  return StyleSheet.create({
    container: {
      flexDirection: 'row',
      alignItems: 'center',
      borderRadius: theme.radius.control,
      backgroundColor: theme.colors.surfaceSunken,
      padding: 3,
      gap: 2,
    },
    button: {
      width: 38,
      height: 34,
      borderRadius: theme.radius.md,
      alignItems: 'center',
      justifyContent: 'center',
    },
    buttonActive: {
      backgroundColor: theme.colors.primary,
    },
  });
}
