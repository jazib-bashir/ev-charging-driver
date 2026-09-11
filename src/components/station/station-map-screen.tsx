import { StyleSheet, Text, View } from 'react-native';

import { EmptyState } from '@/components/ui/empty-state';
import { SearchInput } from '@/components/ui/search-input';
import { ScreenContainer } from '@/components/ui/screen-container';
import { useStationDiscovery } from '@/hooks/use-station-discovery';
import { theme } from '@/theme';
import { isExpoGoAndroid } from '@/utils/runtime';

import { MapExpoGoNotice } from './map-expo-go-notice';
import { MapLoadingState } from './map-loading-state';
import { StationErrorState } from './station-error-state';
import { StationMap } from './station-map';

export function StationMapScreen() {
  const {
    searchQuery,
    setSearchQuery,
    stations,
    isInitialLoading,
    error,
    hasActiveSearch,
    retry,
  } = useStationDiscovery({ initialViewMode: 'map' });

  const stationCount = stations.length;
  const showExpoGoNotice = isExpoGoAndroid();

  return (
    <ScreenContainer edges={['top']} style={styles.screen}>
      <View style={styles.header}>
        <View>
          <Text style={styles.title}>Station Map</Text>
          {!isInitialLoading && !error ? (
            <Text style={styles.subtitle}>
              {stationCount === 1 ? '1 station' : `${stationCount} stations`}
            </Text>
          ) : null}
        </View>
      </View>

      <View style={styles.searchWrap}>
        <SearchInput
          value={searchQuery}
          onChangeText={setSearchQuery}
          placeholder="Search on map..."
        />
      </View>

      <View style={styles.mapArea}>
        {isInitialLoading ? <MapLoadingState /> : null}

        {!isInitialLoading && error && stations.length === 0 ? (
          <View style={styles.errorWrap}>
            <StationErrorState onRetry={retry} />
          </View>
        ) : null}

        {!isInitialLoading && !error && stations.length === 0 ? (
          <EmptyState
            title={hasActiveSearch ? 'No stations found' : 'No charging stations found'}
            message={
              hasActiveSearch
                ? 'Try a different search term.'
                : 'Check back later for newly added charging locations.'
            }
          />
        ) : null}

        {!isInitialLoading && stations.length > 0 ? (
          <>
            <StationMap stations={stations} variant="fullscreen" />
            {showExpoGoNotice ? <MapExpoGoNotice /> : null}
          </>
        ) : null}
      </View>
    </ScreenContainer>
  );
}

const styles = StyleSheet.create({
  screen: {
    backgroundColor: theme.colors.background,
  },
  header: {
    paddingHorizontal: theme.spacing.lg,
    paddingTop: theme.spacing.sm,
    paddingBottom: theme.spacing.xs,
  },
  title: {
    fontSize: theme.typography.fontSize.xl,
    fontWeight: theme.typography.fontWeight.bold,
    color: theme.colors.textPrimary,
  },
  subtitle: {
    marginTop: 2,
    fontSize: theme.typography.fontSize.sm,
    color: theme.colors.textMuted,
  },
  searchWrap: {
    paddingHorizontal: theme.spacing.lg,
    paddingBottom: theme.spacing.sm,
  },
  mapArea: {
    flex: 1,
    borderTopWidth: StyleSheet.hairlineWidth,
    borderTopColor: theme.colors.border,
    backgroundColor: theme.colors.placeholder,
  },
  errorWrap: {
    flex: 1,
  },
});
