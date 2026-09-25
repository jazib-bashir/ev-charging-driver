import { StyleSheet, View } from 'react-native';

import { SearchInput } from '@/components/ui/search-input';

import { DISCOVERY_LAYOUT } from './discovery-layout';

type DiscoverySearchToolbarProps = {
  value: string;
  onChangeText: (text: string) => void;
  placeholder: string;
  onFilterPress?: () => void;
  activeFilterCount?: number;
};

export function DiscoverySearchToolbar({
  value,
  onChangeText,
  placeholder,
  onFilterPress,
  activeFilterCount = 0,
}: DiscoverySearchToolbarProps) {
  return (
    <View style={styles.wrap}>
      <SearchInput
        value={value}
        onChangeText={onChangeText}
        placeholder={placeholder}
        onFilterPress={onFilterPress}
        activeFilterCount={activeFilterCount}
        containerStyle={styles.input}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  wrap: {
    paddingTop: DISCOVERY_LAYOUT.sectionGap,
    paddingBottom: 0,
  },
  input: {
    marginTop: 0,
    marginHorizontal: DISCOVERY_LAYOUT.edge,
  },
});
