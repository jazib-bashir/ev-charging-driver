import { useMemo } from 'react';
import { StyleSheet, View } from 'react-native';

import { SearchInput } from '@/components/ui/search-input';
import { useTheme } from '@/theme';

import { DISCOVERY_LAYOUT } from './discovery-layout';

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
  const styles = useMemo(
    () =>
      StyleSheet.create({
        wrap: { paddingTop: 8, backgroundColor: 'transparent' },
        wrapFloating: { paddingTop: 8 },
        input: { marginTop: 0, marginHorizontal: DISCOVERY_LAYOUT.edge },
        floatingInput: { ...theme.shadows.raised, borderColor: theme.colors.border },
      }),
    [theme],
  );

  return (
    <View style={[styles.wrap, floating && styles.wrapFloating]}>
      <SearchInput
        value={value}
        onChangeText={onChangeText}
        placeholder={placeholder}
        onFilterPress={onFilterPress}
        activeFilterCount={activeFilterCount}
        containerStyle={[styles.input, floating && styles.floatingInput]}
      />
    </View>
  );
}
