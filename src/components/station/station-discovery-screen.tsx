import { StyleSheet, View } from 'react-native';

import { EmptyState } from '@/components/ui/empty-state';
import { SearchInput } from '@/components/ui/search-input';
import { ScreenContainer, ScreenContent } from '@/components/ui/screen-container';
import { useStationDiscovery } from '@/hooks/use-station-discovery';
import { theme } from '@/theme';

import { FilterRow } from './filter-row';
import { StationHeader } from './station-header';
import { StationList } from './station-list';

export function StationDiscoveryScreen() {
  const {
    searchQuery,
    setSearchQuery,
    filters,
    toggleFilter,
    viewMode,
    setViewMode,
    stations,
  } = useStationDiscovery();

  return (
    <ScreenContainer edges={['top']}>
      <StationHeader />
      <SearchInput
        value={searchQuery}
        onChangeText={setSearchQuery}
        placeholder="Search charging stations..."
      />
      <FilterRow
        filters={filters}
        viewMode={viewMode}
        onToggleFilter={toggleFilter}
        onViewModeChange={setViewMode}
      />

      <ScreenContent style={styles.listArea}>
        {viewMode === 'list' ? (
          <StationList stations={stations} />
        ) : (
          <EmptyState
            title="Map view"
            message="Coming soon"
          />
        )}
      </ScreenContent>
    </ScreenContainer>
  );
}

const styles = StyleSheet.create({
  listArea: {
    marginTop: theme.spacing.sm,
  },
});
