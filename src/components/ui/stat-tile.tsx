import { useMemo } from 'react';
import { StyleSheet, View, type StyleProp, type ViewStyle } from 'react-native';

import { Text } from '@/components/ui/text';
import { useTheme } from '@/theme';

type StatTileProps = {
  label: string;
  value: string;
  /** Optional unit rendered smaller next to the value (e.g. "kW"). */
  unit?: string;
  /** Use on dark hero panels. */
  onHero?: boolean;
  align?: 'left' | 'center';
  style?: StyleProp<ViewStyle>;
};

/** Big Space Grotesk number with a quiet caption – used for power, price, ETA, energy, cost. */
export function StatTile({ label, value, unit, onHero = false, align = 'left', style }: StatTileProps) {
  const { theme } = useTheme();
  const styles = useMemo(() => createStyles(theme, onHero, align), [theme, onHero, align]);

  return (
    <View style={[styles.tile, style]}>
      <Text style={styles.value} numberOfLines={1} adjustsFontSizeToFit>
        {value}
        {unit ? <Text style={styles.unit}> {unit}</Text> : null}
      </Text>
      <Text style={styles.label} numberOfLines={1}>
        {label}
      </Text>
    </View>
  );
}

/** Row of equal-width stat tiles separated by hairlines (Figma `mobileStats`). */
export function StatRow({
  children,
  onHero = false,
  style,
}: {
  children: React.ReactNode;
  onHero?: boolean;
  style?: StyleProp<ViewStyle>;
}) {
  const { theme } = useTheme();
  const styles = useMemo(
    () =>
      StyleSheet.create({
        row: {
          flexDirection: 'row',
          borderRadius: theme.radius.xl,
          borderWidth: StyleSheet.hairlineWidth,
          borderColor: onHero ? theme.colors.heroBorder : theme.colors.border,
          backgroundColor: onHero ? theme.colors.heroSurface : theme.colors.surface,
          overflow: 'hidden',
        },
      }),
    [theme, onHero],
  );
  const items = Array.isArray(children) ? children : [children];

  return (
    <View style={[styles.row, style]}>
      {items.map((child, index) => (
        <View
          // eslint-disable-next-line react/no-array-index-key
          key={index}
          style={{
            flex: 1,
            borderLeftWidth: index === 0 ? 0 : StyleSheet.hairlineWidth,
            borderLeftColor: onHero ? theme.colors.heroBorder : theme.colors.border,
          }}
        >
          {child}
        </View>
      ))}
    </View>
  );
}

function createStyles(theme: ReturnType<typeof useTheme>['theme'], onHero: boolean, align: 'left' | 'center') {
  return StyleSheet.create({
    tile: {
      paddingVertical: 14,
      paddingHorizontal: 14,
      gap: 3,
      alignItems: align === 'center' ? 'center' : 'flex-start',
    },
    value: {
      fontFamily: theme.typography.fontFamily.brand,
      fontSize: 16,
      lineHeight: 24,
      letterSpacing: -0.4,
      color: onHero ? theme.colors.heroText : theme.colors.textPrimary,
    },
    unit: {
      fontFamily: theme.typography.fontFamily.medium,
      fontSize: 12,
      letterSpacing: 0,
      color: onHero ? theme.colors.heroTextMuted : theme.colors.textMuted,
    },
    label: {
      fontFamily: theme.typography.fontFamily.medium,
      fontSize: 11,
      color: onHero ? theme.colors.heroTextMuted : theme.colors.textMuted,
    },
  });
}
