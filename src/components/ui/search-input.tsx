import { useMemo, useState } from 'react';
import {
  Pressable,
  StyleSheet,
  View,
  type StyleProp,
  type TextInputProps,
  type ViewStyle,
} from 'react-native';

import { Icon } from '@/components/ui/icon';
import { Text, TextInput } from '@/components/ui/text';
import { useTheme } from '@/theme';

type SearchInputProps = TextInputProps & {
  showFilterIcon?: boolean;
  onFilterPress?: () => void;
  activeFilterCount?: number;
  embedded?: boolean;
  containerStyle?: StyleProp<ViewStyle>;
};

export function SearchInput({
  showFilterIcon = true,
  onFilterPress,
  activeFilterCount = 0,
  embedded = false,
  containerStyle,
  placeholderTextColor,
  style,
  value,
  onChangeText,
  onFocus,
  onBlur,
  ...props
}: SearchInputProps) {
  const { theme } = useTheme();
  const styles = useMemo(() => createStyles(theme), [theme]);
  const [focused, setFocused] = useState(false);
  const hasActiveFilters = activeFilterCount > 0;
  const hasText = typeof value === 'string' && value.length > 0;

  return (
    <View
      style={[
        styles.container,
        embedded && styles.containerEmbedded,
        focused && styles.containerFocused,
        containerStyle,
      ]}
    >
      <Icon name="search" size={18} color={focused ? theme.colors.primary : theme.colors.textMuted} />
      <TextInput
        style={[styles.input, style]}
        placeholderTextColor={placeholderTextColor ?? theme.colors.inputPlaceholder}
        autoCapitalize="none"
        autoCorrect={false}
        returnKeyType="search"
        value={value}
        onChangeText={onChangeText}
        selectionColor={theme.colors.primary}
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
      {hasText && (
        <Pressable
          onPress={() => onChangeText?.('')}
          hitSlop={8}
          accessibilityRole="button"
          accessibilityLabel="Clear search"
          style={styles.clearButton}
        >
          <Icon name="close" size={14} color={theme.colors.textMuted} />
        </Pressable>
      )}
      {showFilterIcon && (
        <Pressable
          onPress={onFilterPress}
          hitSlop={8}
          accessibilityRole="button"
          accessibilityLabel="Open filters"
          style={[styles.filterButton, hasActiveFilters && styles.filterButtonActive]}
        >
          <Icon
            name="sliders"
            size={18}
            color={hasActiveFilters ? theme.colors.onPrimary : theme.colors.primary}
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

function createStyles(theme: ReturnType<typeof useTheme>['theme']) {
  return StyleSheet.create({
    container: {
      flexDirection: 'row',
      alignItems: 'center',
      height: 52,
      gap: 10,
      marginHorizontal: theme.spacing.xl,
      paddingLeft: 16,
      paddingRight: 6,
      borderRadius: theme.radius.control,
      backgroundColor: theme.colors.surface,
      borderWidth: 1,
      borderColor: theme.colors.border,
      ...(theme.isDark ? theme.shadows.none : theme.shadows.card),
    },
    containerEmbedded: {
      flex: 1,
      marginHorizontal: 0,
      minWidth: 0,
    },
    containerFocused: {
      borderColor: theme.colors.inputBorderFocus,
    },
    input: {
      flex: 1,
      fontFamily: theme.typography.fontFamily.medium,
      fontSize: theme.typography.fontSize.md,
      color: theme.colors.textPrimary,
      padding: 0,
      margin: 0,
    },
    clearButton: {
      width: 24,
      height: 24,
      borderRadius: 12,
      backgroundColor: theme.colors.surfaceSunken,
      alignItems: 'center',
      justifyContent: 'center',
    },
    filterButton: {
      position: 'relative',
      width: 40,
      height: 40,
      borderRadius: theme.radius.md,
      backgroundColor: theme.colors.primaryMuted,
      alignItems: 'center',
      justifyContent: 'center',
    },
    filterButtonActive: {
      backgroundColor: theme.colors.primary,
    },
    badge: {
      position: 'absolute',
      top: -4,
      right: -4,
      minWidth: 17,
      height: 17,
      borderRadius: 9,
      backgroundColor: theme.colors.surface,
      borderWidth: 1.5,
      borderColor: theme.colors.primary,
      alignItems: 'center',
      justifyContent: 'center',
      paddingHorizontal: 3,
    },
    badgeText: {
      color: theme.colors.primary,
      fontFamily: theme.typography.fontFamily.bold,
      fontSize: 9,
    },
  });
}
