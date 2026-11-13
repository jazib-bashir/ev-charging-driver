import { useMemo } from 'react';
import { StyleSheet, View, useWindowDimensions } from 'react-native';

import { SkeletonLoader } from '@/components/loaders/skeleton-loader';
import { useTheme } from '@/theme';

import { StationDetailsBackChrome } from './station-details-back-chrome';

const TABLET_BREAKPOINT = 768;
const MAX_CONTENT_WIDTH = 720;
const HERO_HEIGHT = 260;

function SkeletonBlock({
  width,
  height,
  style,
}: {
  width: number | `${number}%`;
  height: number;
  style?: object;
  blockStyle?: object;
}) {
  return <SkeletonLoader width={width} height={height} radius={height > 40 ? 20 : 9} style={style} />;
}

type StationDetailsLoadingStateProps = {
  onBack: () => void;
};

export function StationDetailsLoadingState({ onBack }: StationDetailsLoadingStateProps) {
  const { theme } = useTheme();
  const styles = useMemo(() => createStyles(theme), [theme]);
  const { width } = useWindowDimensions();
  const isTablet = width >= TABLET_BREAKPOINT;

  return (
    <View style={[styles.container, isTablet && styles.containerTablet]}>
      <View style={styles.heroWrap}>
        <SkeletonBlock
          width="100%"
          height={HERO_HEIGHT}
          style={styles.hero}
          blockStyle={styles.block}
        />
        <StationDetailsBackChrome onBack={onBack} placement="overlay" />
      </View>

      <View style={styles.section}>
        <SkeletonBlock width="72%" height={24} blockStyle={styles.block} />
        <SkeletonBlock width="88%" height={14} blockStyle={styles.block} />

        <View style={styles.tileRow}>
          <SkeletonBlock
            width="48%"
            height={72}
            style={styles.tile}
            blockStyle={styles.block}
          />
          <SkeletonBlock
            width="48%"
            height={72}
            style={styles.tile}
            blockStyle={styles.block}
          />
        </View>

        <SkeletonBlock
          width="100%"
          height={48}
          style={styles.button}
          blockStyle={styles.block}
        />
        <SkeletonBlock
          width="100%"
          height={120}
          style={styles.queue}
          blockStyle={styles.block}
        />
      </View>

      <View style={styles.section}>
        <SkeletonBlock width={100} height={18} blockStyle={styles.block} />
        <View style={styles.amenityRow}>
          {Array.from({ length: 3 }, (_, index) => (
            <SkeletonBlock
              key={`amenity-${index}`}
              width={56}
              height={56}
              style={styles.amenity}
              blockStyle={styles.block}
            />
          ))}
        </View>
      </View>

      <View style={styles.section}>
        <SkeletonBlock width={120} height={18} blockStyle={styles.block} />
        <SkeletonBlock
          width="100%"
          height={160}
          style={styles.chargerCard}
          blockStyle={styles.block}
        />
      </View>
    </View>
  );
}

function createStyles(theme: ReturnType<typeof useTheme>['theme']) {
  return StyleSheet.create({
    container: {
      paddingBottom: theme.spacing.xxxl,
    },
    containerTablet: {
      alignSelf: 'center',
      width: '100%',
      maxWidth: MAX_CONTENT_WIDTH,
    },
    heroWrap: {
      position: 'relative',
      height: HERO_HEIGHT,
    },
    block: {
      borderRadius: theme.radius.sm,
      backgroundColor: theme.colors.placeholder,
    },
    hero: {
      borderRadius: 0,
    },
    section: {
      paddingHorizontal: 20,
      paddingTop: 16,
      gap: 12,
    },
    tileRow: {
      flexDirection: 'row',
      justifyContent: 'space-between',
      gap: 12,
    },
    tile: {
      borderRadius: theme.radius.md,
    },
    button: {
      borderRadius: 12,
    },
    queue: {
      borderRadius: theme.radius.lg,
    },
    amenityRow: {
      flexDirection: 'row',
      gap: 14,
    },
    amenity: {
      borderRadius: 12,
    },
    chargerCard: {
      borderRadius: theme.radius.lg,
    },
  });
}
