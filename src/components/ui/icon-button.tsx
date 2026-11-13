import { useMemo } from 'react';
import { Pressable, StyleSheet, type PressableProps, type StyleProp, type ViewStyle } from 'react-native';

import { useTheme } from '@/theme';

type IconButtonProps = Omit<PressableProps, 'style'> & {
  size?: number;
  /** `plain` (no container), `soft` (sunken circle) or `filled` (emerald). */
  appearance?: 'plain' | 'soft' | 'filled';
  style?: StyleProp<ViewStyle>;
};

export function IconButton({
  size = 40,
  appearance = 'plain',
  style,
  children,
  ...props
}: IconButtonProps) {
  const { theme } = useTheme();
  const styles = useMemo(() => createStyles(theme), [theme]);

  return (
    <Pressable
      style={({ pressed }) => [
        styles.button,
        { width: size, height: size, borderRadius: size / 2.6 },
        appearance === 'soft' && styles.soft,
        appearance === 'filled' && styles.filled,
        pressed && styles.pressed,
        style,
      ]}
      accessibilityRole="button"
      hitSlop={Math.max(0, (44 - size) / 2)}
      {...props}
    >
      {children}
    </Pressable>
  );
}

function createStyles(theme: ReturnType<typeof useTheme>['theme']) {
  return StyleSheet.create({
    button: {
      alignItems: 'center',
      justifyContent: 'center',
    },
    soft: {
      backgroundColor: theme.colors.surface,
      borderWidth: StyleSheet.hairlineWidth,
      borderColor: theme.colors.border,
    },
    filled: {
      backgroundColor: theme.colors.primary,
    },
    pressed: {
      opacity: 0.7,
    },
  });
}
