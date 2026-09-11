import { StyleSheet, View, useWindowDimensions } from 'react-native';

import { theme } from '@/theme';

const TABLET_BREAKPOINT = 768;
const MAX_CONTENT_WIDTH = 720;

function SkeletonBlock({
  width,
  height,
  style,
}: {
  width: number | `${number}%`;
  height: number;
  style?: object;
}) {
  return <View style={[styles.block, { width, height }, style]} />;
}

export function StationDetailsLoadingState() {
  const { width } = useWindowDimensions();
  const isTablet = width >= TABLET_BREAKPOINT;

  return (
    <View style={[styles.container, isTablet && styles.containerTablet]}>
      <SkeletonBlock width="100%" height={220} style={styles.hero} />

      <View style={styles.section}>
        <View style={styles.titleRow}>
          <SkeletonBlock width="68%" height={22} />
          <SkeletonBlock width={56} height={18} />
        </View>
        <SkeletonBlock width="88%" height={14} style={styles.address} />

        <View style={styles.tileRow}>
          <SkeletonBlock width="48%" height={72} style={styles.tile} />
          <SkeletonBlock width="48%" height={72} style={styles.tile} />
        </View>

        <SkeletonBlock width="100%" height={48} style={styles.button} />
      </View>

      <View style={styles.section}>
        <SkeletonBlock width={100} height={18} />
        <View style={styles.amenityRow}>
          {Array.from({ length: 4 }, (_, index) => (
            <SkeletonBlock key={`amenity-${index}`} width={64} height={64} style={styles.amenity} />
          ))}
        </View>
      </View>

      <View style={styles.section}>
        <SkeletonBlock width={120} height={18} />
        <SkeletonBlock width="100%" height={160} style={styles.chargerCard} />
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    paddingBottom: theme.spacing.xxxl,
  },
  containerTablet: {
    alignSelf: 'center',
    width: '100%',
    maxWidth: MAX_CONTENT_WIDTH,
  },
  block: {
    borderRadius: theme.radius.sm,
    backgroundColor: theme.colors.placeholder,
  },
  hero: {
    borderRadius: 0,
  },
  section: {
    paddingHorizontal: theme.spacing.lg,
    paddingTop: theme.spacing.lg,
    gap: theme.spacing.md,
  },
  titleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: theme.spacing.md,
  },
  address: {
    marginTop: -4,
  },
  tileRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    gap: theme.spacing.md,
  },
  tile: {
    borderRadius: theme.radius.md,
  },
  button: {
    borderRadius: theme.radius.md,
  },
  amenityRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    gap: theme.spacing.sm,
  },
  amenity: {
    borderRadius: theme.radius.pill,
  },
  chargerCard: {
    borderRadius: theme.radius.lg,
  },
});
