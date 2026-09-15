import { StyleSheet, View } from 'react-native';

import { SearchInput } from '@/components/ui/search-input';
import { ViewToggle, type ViewMode } from '@/components/ui/view-toggle';
import { theme } from '@/theme';

type DiscoverySearchToolbarProps = {
  value: string;
  onChangeText: (text: string) => void;
  placeholder: string;
  viewMode: ViewMode;
  onViewModeChange: (mode: ViewMode) => void;
  onFilterPress?: () => void;
  activeFilterCount?: number;
};

export function DiscoverySearchToolbar({
  value,
  onChangeText,
  placeholder,
  viewMode,
  onViewModeChange,
  onFilterPress,
  activeFilterCount = 0,
}: DiscoverySearchToolbarProps) {
  return (
    <View style={styles.row}>
      <SearchInput
        embedded
        value={value}
        onChangeText={onChangeText}
        placeholder={placeholder}
        onFilterPress={onFilterPress}
        activeFilterCount={activeFilterCount}
      />
      <ViewToggle value={viewMode} onChange={onViewModeChange} />
    </View>
  );
}

const styles = StyleSheet.create({
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: theme.spacing.sm,
    paddingHorizontal: theme.spacing.lg,
    paddingTop: theme.spacing.md,
    paddingBottom: theme.spacing.sm,
  },
});
