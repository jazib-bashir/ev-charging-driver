import { Pressable, StyleSheet, Text, TextInput, View, type TextInputProps } from 'react-native';

import { Icon } from '@/components/ui/icon';
import { theme } from '@/theme';

type SearchInputProps = TextInputProps & {
  showFilterIcon?: boolean;
  onFilterPress?: () => void;
  activeFilterCount?: number;
};

export function SearchInput({
  showFilterIcon = true,
  onFilterPress,
  activeFilterCount = 0,
  placeholderTextColor = theme.colors.textMuted,
  style,
  ...props
}: SearchInputProps) {
  const hasActiveFilters = activeFilterCount > 0;

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
        <Pressable
          onPress={onFilterPress}
          hitSlop={8}
          accessibilityRole="button"
          accessibilityLabel="Open filters"
          style={styles.filterButton}
        >
          <Icon
            name="sliders"
            size={18}
            color={hasActiveFilters ? theme.colors.brandDark : theme.colors.textMuted}
          />
          {hasActiveFilters && (
            <View style={styles.badge}>
              <Text style={styles.badgeText}>{activeFilterCount}</Text>
            </View>
          )}
        </Pressable>
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
  filterButton: {
    position: 'relative',
    padding: 2,
    alignItems: 'center',
    justifyContent: 'center',
  },
  badge: {
    position: 'absolute',
    top: -4,
    right: -6,
    minWidth: 16,
    height: 16,
    borderRadius: 8,
    backgroundColor: theme.colors.brandDark,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 3,
  },
  badgeText: {
    color: theme.colors.textInverse,
    fontSize: 9,
    fontWeight: theme.typography.fontWeight.bold,
  },
});
