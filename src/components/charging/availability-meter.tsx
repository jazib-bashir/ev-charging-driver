import { useMemo } from 'react';
import { StyleSheet, View } from 'react-native';

import { Text } from '@/components/ui/text';
import { useTheme } from '@/theme';

type AvailabilityMeterProps = {
  available: number;
  total: number;
  /** Show the "x of y available" caption. */
  showLabel?: boolean;
  onHero?: boolean;
};

/** Segmented meter – one pill per connector/EVSE; emerald when free, neutral when busy. */
export function AvailabilityMeter({ available, total, showLabel = true, onHero = false }: AvailabilityMeterProps) {
  const { theme } = useTheme();
  const styles = useMemo(() => createStyles(theme, onHero), [theme, onHero]);
  const segments = Math.min(Math.max(total, 0), 12);
  const free = Math.min(Math.max(available, 0), segments);

  if (segments === 0) {
    return null;
  }

  return (
    <View
      style={styles.wrap}
      accessibilityRole="progressbar"
      accessibilityLabel={`${available} of ${total} connectors available`}
    >
      <View style={styles.bar}>
        {Array.from({ length: segments }).map((_, i) => (
          <View key={`seg-${i}`} style={[styles.segment, i < free ? styles.segmentFree : styles.segmentBusy]} />
        ))}
      </View>
      {showLabel ? (
        <Text style={styles.label}>
          <Text style={styles.labelStrong}>{available}</Text> of {total} available
        </Text>
      ) : null}
    </View>
  );
}

function createStyles(theme: ReturnType<typeof useTheme>['theme'], onHero: boolean) {
  return StyleSheet.create({
    wrap: { gap: 6 },
    bar: { flexDirection: 'row', gap: 4 },
    segment: { flex: 1, height: 6, borderRadius: 3 },
    segmentFree: { backgroundColor: theme.colors.secondary },
    segmentBusy: { backgroundColor: onHero ? theme.colors.heroBorder : theme.colors.borderStrong },
    label: {
      fontFamily: theme.typography.fontFamily.medium,
      fontSize: 12,
      color: onHero ? theme.colors.heroTextMuted : theme.colors.textMuted,
    },
    labelStrong: {
      fontFamily: theme.typography.fontFamily.bold,
      color: onHero ? theme.colors.heroText : theme.colors.textPrimary,
    },
  });
}
