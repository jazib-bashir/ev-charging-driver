import { useMemo } from 'react';
import { StyleSheet, View, useWindowDimensions } from 'react-native';

import { useTheme } from '@/theme';

const TABLET_BREAKPOINT = 768;
const SKELETON_COUNT = 3;

function StationCardSkeleton({
  styles,
}: {
  styles: ReturnType<typeof createStyles>;
}) {
  return (
    <View style={styles.card}>
      <View style={styles.image} />
      <View style={styles.body}>
        <View style={styles.titleLine} />
        <View style={styles.addressLine} />
        <View style={styles.divider} />
        <View style={styles.metaRow}>
          <View style={styles.metaItem} />
          <View style={styles.metaItem} />
          <View style={styles.metaItemWide} />
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
    <View style={[styles.container, isTablet && styles.containerTablet]}>
      {Array.from({ length: SKELETON_COUNT }, (_, index) => (
        <View
          key={`station-skeleton-${index}`}
          style={[styles.item, isTablet && styles.itemTablet]}
        >
          <StationCardSkeleton styles={styles} />
        </View>
      ))}
    </View>
  );
}

function createStyles(theme: ReturnType<typeof useTheme>['theme']) {
  return StyleSheet.create({
    container: {
      paddingHorizontal: theme.spacing.lg,
      paddingTop: theme.spacing.md,
      paddingBottom: theme.spacing.lg,
      gap: theme.spacing.md,
    },
    containerTablet: {
      alignItems: 'center',
    },
    item: {
      marginBottom: theme.spacing.md,
    },
    itemTablet: {
      width: '100%',
      maxWidth: 640,
    },
    card: {
      backgroundColor: theme.colors.surface,
      borderRadius: 16,
      borderWidth: 1,
      borderColor: theme.colors.border,
      overflow: 'hidden',
    },
    image: {
      height: 156,
      backgroundColor: theme.colors.placeholder,
    },
    body: {
      paddingHorizontal: 16,
      paddingTop: 14,
      paddingBottom: 14,
      gap: 10,
    },
    titleLine: {
      height: 18,
      width: '65%',
      borderRadius: 6,
      backgroundColor: theme.colors.placeholder,
    },
    addressLine: {
      height: 14,
      width: '85%',
      borderRadius: 6,
      backgroundColor: theme.colors.placeholder,
    },
    divider: {
      height: StyleSheet.hairlineWidth,
      backgroundColor: theme.colors.border,
      marginVertical: 2,
    },
    metaRow: {
      flexDirection: 'row',
      gap: 12,
    },
    metaItem: {
      height: 14,
      width: 56,
      borderRadius: 6,
      backgroundColor: theme.colors.placeholder,
    },
    metaItemWide: {
      height: 14,
      flex: 1,
      borderRadius: 6,
      backgroundColor: theme.colors.placeholder,
    },
  });
}
