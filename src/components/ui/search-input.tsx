import {
  Pressable,
  StyleSheet,
  Text,
  TextInput,
  View,
  type TextInputProps,
  type StyleProp,
  type ViewStyle,
} from 'react-native';

import { Icon } from '@/components/ui/icon';
import { theme } from '@/theme';

type SearchInputProps = TextInputProps & {
  showFilterIcon?: boolean;
  onFilterPress?: () => void;
  activeFilterCount?: number;
  /** Removes outer margins so the field can sit in a horizontal toolbar row. */
  embedded?: boolean;
  containerStyle?: StyleProp<ViewStyle>;
};

export function SearchInput({
  showFilterIcon = true,
  onFilterPress,
  activeFilterCount = 0,
  embedded = false,
  containerStyle,
  placeholderTextColor = theme.colors.textMuted,
  style,
  value,
  onChangeText,
  ...props
}: SearchInputProps) {
  const hasActiveFilters = activeFilterCount > 0;
  const hasText = typeof value === 'string' && value.length > 0;

  return (
    <View
      style={[
        styles.container,
        embedded && styles.containerEmbedded,
        containerStyle,
      ]}
    >
      <Icon name="search" size={18} color={theme.colors.textMuted} />
      <TextInput
        style={[styles.input, style]}
        placeholderTextColor={placeholderTextColor}
        autoCapitalize="none"
        autoCorrect={false}
        returnKeyType="search"
        value={value}
        onChangeText={onChangeText}
        {...props}
      />
      {hasText && (
        <Pressable
          onPress={() => onChangeText?.('')}
          hitSlop={8}
          accessibilityRole="button"
          accessibilityLabel="Clear search"
          style={styles.clearButton}
        >
          <Icon name="close" size={16} color={theme.colors.textMuted} />
        </Pressable>
      )}
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
  containerEmbedded: {
    flex: 1,
    marginHorizontal: 0,
    marginTop: 0,
    minWidth: 0,
  },
  input: {
    flex: 1,
    fontSize: theme.typography.fontSize.md,
    color: theme.colors.textPrimary,
    padding: 0,
  },
  clearButton: {
    width: 24,
    height: 24,
    borderRadius: 12,
    backgroundColor: theme.colors.iconBackground,
    alignItems: 'center',
    justifyContent: 'center',
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
