import { FlatList, StyleSheet, useWindowDimensions, View } from 'react-native';

import { EmptyState } from '@/components/ui/empty-state';
import { theme } from '@/theme';
import type { Station } from '@/types/station';

import { StationCard } from './station-card';

type StationListProps = {
  stations: Station[];
};

const TABLET_BREAKPOINT = 768;

export function StationList({ stations }: StationListProps) {
  const { width } = useWindowDimensions();
  const isTablet = width >= TABLET_BREAKPOINT;

  if (stations.length === 0) {
    return (
      <EmptyState
        title="No stations found"
        message="Try adjusting your search or filters."
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
});
