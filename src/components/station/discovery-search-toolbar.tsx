import { StyleSheet, View } from 'react-native';

import { SearchInput } from '@/components/ui/search-input';
import { useTheme } from '@/theme';

type DiscoverySearchToolbarProps = {
  value: string;
  onChangeText: (text: string) => void;
  placeholder: string;
  onFilterPress?: () => void;
  activeFilterCount?: number;
  /** Transparent wrapper + elevated surface field for map overlay. */
  floating?: boolean;
};

export function DiscoverySearchToolbar({
  value,
  onChangeText,
  placeholder,
  onFilterPress,
  activeFilterCount = 0,
  floating = false,
}: DiscoverySearchToolbarProps) {
  const { theme } = useTheme();

  return (
    <View style={[styles.wrap, floating && styles.wrapFloating]}>
      <SearchInput
        value={value}
        onChangeText={onChangeText}
        placeholder={placeholder}
        onFilterPress={onFilterPress}
        activeFilterCount={activeFilterCount}
        containerStyle={[
          styles.input,
          floating && {
            borderRadius: 12,
            borderColor: theme.colors.border,
            backgroundColor: theme.colors.surface,
            shadowColor: theme.colors.shadow,
            shadowOffset: { width: 0, height: 4 },
            shadowOpacity: 1,
            shadowRadius: 10,
            elevation: 4,
          },
        ]}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  wrap: {
    paddingTop: 12,
    paddingBottom: 0,
    backgroundColor: 'transparent',
  },
  wrapFloating: {
    paddingTop: 8,
  },
  input: {
    marginTop: 0,
    marginHorizontal: 12,
  },
});
