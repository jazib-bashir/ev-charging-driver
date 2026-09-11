import { Pressable, StyleSheet, View } from 'react-native';

import { Icon, type IconName } from '@/components/ui/icon';
import { theme } from '@/theme';

export type ViewMode = 'list' | 'map';

type ViewToggleProps = {
  value: ViewMode;
  onChange: (mode: ViewMode) => void;
};

const OPTIONS: { mode: ViewMode; icon: IconName }[] = [
  { mode: 'list', icon: 'list' },
  { mode: 'map', icon: 'map' },
];

export function ViewToggle({ value, onChange }: ViewToggleProps) {
  return (
    <View style={styles.container}>
      {OPTIONS.map(({ mode, icon }) => {
        const active = value === mode;
        return (
          <Pressable
            key={mode}
            onPress={() => onChange(mode)}
            style={[styles.button, active && styles.buttonActive]}
            accessibilityRole="button"
            accessibilityState={{ selected: active }}
          >
            <Icon
              name={icon}
              size={16}
              color={active ? theme.colors.tabActiveIcon : theme.colors.textMuted}
            />
          </Pressable>
        );
      })}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    alignItems: 'center',
    borderRadius: theme.radius.sm + 2,
    borderWidth: 1,
    borderColor: theme.colors.border,
    backgroundColor: theme.colors.surface,
    padding: 2,
    gap: 2,
  },
  button: {
    width: 32,
    height: 28,
    borderRadius: theme.radius.sm,
    alignItems: 'center',
    justifyContent: 'center',
  },
  buttonActive: {
    backgroundColor: theme.colors.tabActive,
  },
});
