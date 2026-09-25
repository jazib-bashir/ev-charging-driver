import {
  ActivityIndicator,
  Pressable,
  StyleSheet,
  Text,
  type PressableProps,
  type StyleProp,
  type ViewStyle,
} from 'react-native';

import { useTheme } from '@/theme';
import { useMemo } from 'react';

type AuthPrimaryButtonProps = PressableProps & {
  label: string;
  loading?: boolean;
  style?: StyleProp<ViewStyle>;
};

export function AuthPrimaryButton({
  label,
  loading = false,
  disabled,
  style,
  ...props
}: AuthPrimaryButtonProps) {
  const { theme } = useTheme();
  const styles = useMemo(() => createStyles(theme), [theme]);
  const isDisabled = Boolean(disabled || loading);

  return (
    <Pressable
      style={({ pressed }) => [
        styles.button,
        pressed && !isDisabled && styles.buttonPressed,
        typeof style === 'function' ? undefined : style,
      ]}
      disabled={isDisabled}
      accessibilityRole="button"
      accessibilityState={{ disabled: isDisabled }}
      {...props}
    >
      {loading ? (
        <ActivityIndicator color="#FFFFFF" />
      ) : (
        <Text style={styles.label}>{label}</Text>
      )}
    </Pressable>
  );
}

function createStyles(theme: ReturnType<typeof useTheme>['theme']) {
  return StyleSheet.create({
    button: {
      height: 48,
      borderRadius: 12,
      backgroundColor: theme.colors.accent,
      alignItems: 'center',
      justifyContent: 'center',
      opacity: 1,
    },
    buttonPressed: {
      opacity: 0.9,
    },
    label: {
      fontFamily: theme.typography.fontFamily.brand,
      fontSize: 15,
      color: '#FFFFFF',
      includeFontPadding: false,
    },
  });
}
