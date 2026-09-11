import {
  ActivityIndicator,
  FlatList,
  RefreshControl,
  StyleSheet,
  useWindowDimensions,
  View,
} from 'react-native';

import { EmptyState } from '@/components/ui/empty-state';
import { theme } from '@/theme';
import type { Station } from '@/types/station';

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
}: StationListProps) {
  const { width } = useWindowDimensions();
  const isTablet = width >= TABLET_BREAKPOINT;

  if (stations.length === 0) {
    const title = hasActiveSearch || hasActiveFilters
      ? 'No stations found'
      : 'No charging stations found';
    const message = hasActiveSearch || hasActiveFilters
      ? 'Try adjusting your search or filters.'
      : 'Check back later for newly added charging locations.';

    return (
      <EmptyState
        title={title}
        message={message}
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

const styles = StyleSheet.create({
  content: {
    paddingHorizontal: theme.spacing.lg,
    paddingTop: theme.spacing.md,
    paddingBottom: theme.spacing.lg,
    gap: theme.spacing.md,
  },
  contentTablet: {
    alignItems: 'center',
  },
  item: {
    marginBottom: theme.spacing.md,
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
