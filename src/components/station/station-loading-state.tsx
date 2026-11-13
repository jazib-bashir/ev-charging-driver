import { useMemo } from 'react';
import { StyleSheet, View, useWindowDimensions } from 'react-native';

import { SkeletonLoader } from '@/components/loaders/skeleton-loader';
import { useTheme } from '@/theme';

import { DISCOVERY_LAYOUT } from './discovery-layout';

const TABLET_BREAKPOINT = 768;
const SKELETON_COUNT = 3;

/** Station card skeleton (shimmering) – discovery keeps skeletons instead of a spinner. */
function StationCardSkeleton({ styles }: { styles: ReturnType<typeof createStyles> }) {
  return (
    <View style={styles.card}>
      <SkeletonLoader height={156} radius={0} />
      <View style={styles.body}>
        <SkeletonLoader width="62%" height={18} radius={8} />
        <SkeletonLoader width="84%" height={13} radius={7} />
        <SkeletonLoader width="100%" height={6} radius={3} style={styles.meter} />
        <View style={styles.metaRow}>
          <SkeletonLoader width="28%" height={30} radius={10} />
          <SkeletonLoader width="28%" height={30} radius={10} />
          <SkeletonLoader width="28%" height={30} radius={10} />
        </View>
      </View>
    </View>
  );
}

export function StationLoadingState() {
  const { theme } = useTheme();
  const styles = useMemo(() => createStyles(theme), [theme]);
  const { width } = useWindowDimensions();
  const isTablet = width >= TABLET_BREAKPOINT;

  return (
    <View
      style={[styles.container, isTablet && styles.containerTablet]}
      accessibilityRole="progressbar"
      accessibilityLabel="Loading stations"
    >
      {Array.from({ length: SKELETON_COUNT }, (_, index) => (
        <View key={`station-skeleton-${index}`} style={[styles.item, isTablet && styles.itemTablet]}>
          <StationCardSkeleton styles={styles} />
        </View>
      ))}
    </View>
  );
}

function createStyles(theme: ReturnType<typeof useTheme>['theme']) {
  return StyleSheet.create({
    container: {
      paddingHorizontal: DISCOVERY_LAYOUT.edge,
      paddingTop: DISCOVERY_LAYOUT.sectionGap,
      paddingBottom: DISCOVERY_LAYOUT.edge,
      gap: DISCOVERY_LAYOUT.cardGap,
    },
    containerTablet: { alignItems: 'center' },
    item: { marginBottom: theme.spacing.xs },
    itemTablet: { width: '100%', maxWidth: 640 },
    card: {
      backgroundColor: theme.colors.surface,
      borderRadius: theme.radius.xl,
      borderWidth: StyleSheet.hairlineWidth,
      borderColor: theme.colors.border,
      overflow: 'hidden',
    },
    body: { padding: 16, gap: 10 },
    meter: { marginTop: 4 },
    metaRow: { flexDirection: 'row', justifyContent: 'space-between' },
  });
}
