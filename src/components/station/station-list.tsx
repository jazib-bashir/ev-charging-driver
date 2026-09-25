import { useMemo } from 'react';
import {
  ActivityIndicator,
  FlatList,
  RefreshControl,
  StyleSheet,
  useWindowDimensions,
  View,
} from 'react-native';

import { EmptyState } from '@/components/ui/empty-state';
import { useTheme } from '@/theme';
import type { Station } from '@/types/station';

import { DISCOVERY_LAYOUT } from './discovery-layout';
import { StationCard } from './station-card';

type StationListProps = {
  stations: Station[];
  isRefreshing?: boolean;
  isLoadingMore?: boolean;
  hasMore?: boolean;
  hasActiveSearch?: boolean;
  hasActiveFilters?: boolean;
  onRefresh?: () => void;
  onEndReached?: () => void;
  onClearAllFilters?: () => void;
  onSearchNearby?: () => void;
};

const TABLET_BREAKPOINT = 768;

export function StationList({
  stations,
  isRefreshing = false,
  isLoadingMore = false,
  hasMore = false,
  hasActiveSearch = false,
  hasActiveFilters = false,
  onRefresh,
  onEndReached,
  onClearAllFilters,
  onSearchNearby,
}: StationListProps) {
  const { theme } = useTheme();
  const styles = useMemo(() => createStyles(theme), [theme]);
  const { width } = useWindowDimensions();
  const isTablet = width >= TABLET_BREAKPOINT;

  if (stations.length === 0) {
    return (
      <EmptyState
        title="No Stations Found"
        message={
          hasActiveSearch || hasActiveFilters
            ? 'Try adjusting your filters or searching in a different area to find a place to charge.'
            : 'Check back later for newly added charging locations.'
        }
        iconName="search-off"
        primaryActionLabel={
          hasActiveSearch || hasActiveFilters ? 'Clear All Filters' : undefined
        }
        onPrimaryAction={onClearAllFilters}
        secondaryActionLabel="Search Nearby"
        onSecondaryAction={onSearchNearby}
      />
    );
  }

  return (
    <FlatList
      data={stations}
      keyExtractor={(item) => item.id}
      renderItem={({ item }) => (
        <View style={[styles.item, isTablet && styles.itemTablet]}>
          <StationCard station={item} />
        </View>
      )}
      contentContainerStyle={[
        styles.content,
        isTablet && styles.contentTablet,
      ]}
      showsVerticalScrollIndicator={false}
      keyboardShouldPersistTaps="handled"
      refreshControl={
        onRefresh
          ? (
            <RefreshControl
              refreshing={isRefreshing}
              onRefresh={onRefresh}
              tintColor={theme.colors.brand}
              colors={[theme.colors.brand]}
            />
          )
          : undefined
      }
      onEndReached={() => {
        if (hasMore && !isLoadingMore) {
          onEndReached?.();
        }
      }}
      onEndReachedThreshold={0.35}
      ListFooterComponent={
        isLoadingMore
          ? (
            <View style={styles.footer}>
              <ActivityIndicator color={theme.colors.brand} />
            </View>
          )
          : null
      }
    />
  );
}

function createStyles(theme: ReturnType<typeof useTheme>['theme']) {
  return StyleSheet.create({
    content: {
      paddingHorizontal: DISCOVERY_LAYOUT.edge,
      paddingTop: DISCOVERY_LAYOUT.sectionGap,
      paddingBottom: DISCOVERY_LAYOUT.edge,
    },
    contentTablet: {
      alignItems: 'center',
    },
    item: {
      marginBottom: DISCOVERY_LAYOUT.cardGap,
    },
    itemTablet: {
      width: '100%',
      maxWidth: 640,
    },
    footer: {
      paddingVertical: theme.spacing.lg,
      alignItems: 'center',
    },
  });
}
