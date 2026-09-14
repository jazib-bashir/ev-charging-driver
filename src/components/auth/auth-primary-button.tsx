import {
  ActivityIndicator,
  Pressable,
  StyleSheet,
  Text,
  type PressableProps,
} from 'react-native';

import { theme } from '@/theme';

type AuthPrimaryButtonProps = PressableProps & {
  label: string;
  loading?: boolean;
};

export function AuthPrimaryButton({
  label,
  loading = false,
  disabled,
  style,
  ...props
}: AuthPrimaryButtonProps) {
  const isDisabled = Boolean(disabled || loading);

  return (
    <Pressable
      style={({ pressed }) => [
        styles.button,
        (pressed || isDisabled) && styles.buttonPressed,
        isDisabled && styles.buttonDisabled,
        typeof style === 'function' ? undefined : style,
      ]}
      disabled={isDisabled}
      accessibilityRole="button"
      {...props}
    >
      {loading ? (
        <ActivityIndicator color={theme.colors.textInverse} />
      ) : (
        <Text style={styles.label}>{label}</Text>
      )}
    </Pressable>
  );
}

const styles = StyleSheet.create({
  button: {
    height: 52,
    borderRadius: theme.radius.md,
    backgroundColor: theme.colors.brand,
    alignItems: 'center',
    justifyContent: 'center',
  },
  buttonPressed: {
    opacity: 0.85,
  },
  buttonDisabled: {
    opacity: 0.55,
  },
  label: {
    fontSize: theme.typography.fontSize.md,
    fontWeight: theme.typography.fontWeight.bold,
    color: theme.colors.textInverse,
  },
});
