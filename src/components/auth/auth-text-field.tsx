import { useMemo, useState } from 'react';
import { StyleSheet, View, type TextInputProps } from 'react-native';

import { Text, TextInput } from '@/components/ui/text';
import { useTheme } from '@/theme';

type AuthTextFieldProps = TextInputProps & {
  label: string;
  error?: string | null;
  helper?: string;
};

/** Labeled input with sunken surface, emerald focus ring and inline validation. */
export function AuthTextField({
  label,
  error,
  helper,
  style,
  editable = true,
  onFocus,
  onBlur,
  ...props
}: AuthTextFieldProps) {
  const { theme } = useTheme();
  const styles = useMemo(() => createStyles(theme), [theme]);
  const [focused, setFocused] = useState(false);

  return (
    <View style={styles.container}>
      <Text style={styles.label}>{label}</Text>
      <TextInput
        style={[
          styles.input,
          focused ? styles.inputFocused : null,
          !editable ? styles.inputDisabled : null,
          error ? styles.inputError : null,
          style,
        ]}
        placeholderTextColor={theme.colors.inputPlaceholder}
        selectionColor={theme.colors.primary}
        editable={editable}
        onFocus={(event) => {
          setFocused(true);
          onFocus?.(event);
        }}
        onBlur={(event) => {
          setFocused(false);
          onBlur?.(event);
        }}
        {...props}
      />
      {error ? (
        <Text style={styles.error}>{error}</Text>
      ) : helper ? (
        <Text style={styles.helper}>{helper}</Text>
      ) : null}
    </View>
  );
}

function createStyles(theme: ReturnType<typeof useTheme>['theme']) {
  return StyleSheet.create({
    container: {
      gap: theme.spacing.sm,
    },
    label: {
      fontFamily: theme.typography.fontFamily.semibold,
      fontSize: theme.typography.fontSize.sm,
      color: theme.colors.textPrimary,
    },
    input: {
      height: theme.sizes.input,
      borderRadius: theme.radius.control,
      borderWidth: 1.5,
      borderColor: theme.colors.inputBorder,
      backgroundColor: theme.colors.inputBackground,
      paddingHorizontal: theme.spacing.lg,
      fontFamily: theme.typography.fontFamily.medium,
      fontSize: theme.typography.fontSize.md,
      color: theme.colors.textPrimary,
    },
    inputFocused: {
      borderColor: theme.colors.inputBorderFocus,
      backgroundColor: theme.colors.surface,
    },
    inputDisabled: {
      opacity: 0.6,
    },
    inputError: {
      borderColor: theme.colors.error,
      backgroundColor: theme.colors.errorBg,
    },
    error: {
      fontFamily: theme.typography.fontFamily.medium,
      fontSize: theme.typography.fontSize.xs,
      color: theme.colors.errorText,
    },
    helper: {
      fontFamily: theme.typography.fontFamily.regular,
      fontSize: theme.typography.fontSize.xs,
      color: theme.colors.textMuted,
    },
  });
}
