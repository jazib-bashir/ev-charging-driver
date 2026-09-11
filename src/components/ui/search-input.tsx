import { StyleSheet, TextInput, View, type TextInputProps } from 'react-native';

import { Icon } from '@/components/ui/icon';
import { theme } from '@/theme';

type SearchInputProps = TextInputProps & {
  showFilterIcon?: boolean;
};

export function SearchInput({
  showFilterIcon = true,
  placeholderTextColor = theme.colors.textMuted,
  style,
  ...props
}: SearchInputProps) {
  return (
    <View style={styles.container}>
      <Icon name="search" size={18} color={theme.colors.textMuted} />
      <TextInput
        style={[styles.input, style]}
        placeholderTextColor={placeholderTextColor}
        autoCapitalize="none"
        autoCorrect={false}
        clearButtonMode="while-editing"
        returnKeyType="search"
        {...props}
      />
      {showFilterIcon && (
        <Icon name="sliders" size={18} color={theme.colors.textMuted} />
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: theme.spacing.sm + 2,
    marginHorizontal: theme.spacing.lg,
    marginTop: theme.spacing.md,
    paddingHorizontal: theme.spacing.md + 2,
    paddingVertical: 11,
    borderRadius: theme.radius.md,
    borderWidth: 1,
    borderColor: theme.colors.border,
    backgroundColor: theme.colors.surface,
  },
  input: {
    flex: 1,
    fontSize: theme.typography.fontSize.md,
    color: theme.colors.textPrimary,
    padding: 0,
  },
});
