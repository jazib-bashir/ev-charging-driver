import {
  StyleSheet,
  Text,
  TextInput,
  View,
  type TextInputProps,
} from 'react-native';

import { theme } from '@/theme';

type AuthTextFieldProps = TextInputProps & {
  label: string;
  error?: string | null;
};

export function AuthTextField({
  label,
  error,
  style,
  editable = true,
  ...props
}: AuthTextFieldProps) {
  return (
    <View style={styles.container}>
      <Text style={styles.label}>{label}</Text>
      <TextInput
        style={[
          styles.input,
          !editable ? styles.inputDisabled : null,
          error ? styles.inputError : null,
          style,
        ]}
        placeholderTextColor={theme.colors.textMuted}
        editable={editable}
        {...props}
      />
      {error ? <Text style={styles.error}>{error}</Text> : null}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    gap: theme.spacing.xs,
  },
  label: {
    fontSize: theme.typography.fontSize.sm,
    fontWeight: theme.typography.fontWeight.semibold,
    color: theme.colors.textPrimary,
  },
  input: {
    height: 52,
    borderRadius: theme.radius.md,
    borderWidth: 1,
    borderColor: theme.colors.border,
    backgroundColor: theme.colors.surface,
    paddingHorizontal: theme.spacing.md,
    fontSize: theme.typography.fontSize.md,
    color: theme.colors.textPrimary,
  },
  inputDisabled: {
    backgroundColor: theme.colors.background,
    color: theme.colors.textSecondary,
  },
  inputError: {
    borderColor: theme.colors.notification,
  },
  error: {
    fontSize: theme.typography.fontSize.xs,
    color: theme.colors.notification,
  },
});
