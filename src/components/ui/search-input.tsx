import { useMemo } from 'react';
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
  ...props
}: SearchInputProps) {
  const { theme } = useTheme();
  const styles = useMemo(() => createStyles(theme), [theme]);
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
      <Icon name="search" size={16} color={theme.colors.textMuted} />
      <TextInput
        style={[styles.input, style]}
        placeholderTextColor={placeholderTextColor ?? theme.colors.textMuted}
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
          <Icon name="close" size={14} color={theme.colors.textMuted} />
        </Pressable>
      )}
      {showFilterIcon && (
        <>
          <View style={styles.divider} />
          <Pressable
            onPress={onFilterPress}
            hitSlop={8}
            accessibilityRole="button"
            accessibilityLabel="Open filters"
            style={styles.filterButton}
          >
            <Icon name="filter" size={16} color={theme.colors.accent} />
            {hasActiveFilters && (
              <View style={styles.badge}>
                <Text style={styles.badgeText}>{activeFilterCount}</Text>
              </View>
            )}
          </Pressable>
        </>
      )}
    </View>
  );
}

function createStyles(theme: ReturnType<typeof useTheme>['theme']) {
  return StyleSheet.create({
    container: {
      flexDirection: 'row',
      alignItems: 'center',
      height: 45,
      gap: 10,
      marginHorizontal: theme.spacing.xl,
      marginTop: 0,
      paddingLeft: 14,
      paddingRight: 8,
      borderRadius: 14,
      backgroundColor: theme.colors.surface,
      borderWidth: 1,
      borderColor: theme.colors.border,
    },
    containerEmbedded: {
      flex: 1,
      marginHorizontal: 0,
      marginTop: 0,
      minWidth: 0,
    },
    input: {
      flex: 1,
      fontFamily: theme.typography.fontFamily.regular,
      fontSize: theme.typography.fontSize.sm,
      lineHeight: theme.typography.lineHeight.normal,
      color: theme.colors.textPrimary,
      padding: 0,
      margin: 0,
    },
    clearButton: {
      width: 22,
      height: 22,
      borderRadius: 11,
      backgroundColor: theme.colors.iconBackground,
      alignItems: 'center',
      justifyContent: 'center',
    },
    divider: {
      width: StyleSheet.hairlineWidth,
      height: 18,
      backgroundColor: theme.colors.border,
    },
    filterButton: {
      position: 'relative',
      width: 32,
      height: 32,
      alignItems: 'center',
      justifyContent: 'center',
    },
    badge: {
      position: 'absolute',
      top: 2,
      right: 2,
      minWidth: 14,
      height: 14,
      borderRadius: 7,
      backgroundColor: theme.colors.accent,
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
}
