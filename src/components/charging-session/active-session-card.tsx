import { useMemo } from 'react';
import { Pressable, StyleSheet, View } from 'react-native';

import { ChargingRing } from '@/components/charging/charging-ring';
import { Icon } from '@/components/ui/icon';
import { StatRow, StatTile } from '@/components/ui/stat-tile';
import { Surface } from '@/components/ui/surface';
import { Text } from '@/components/ui/text';
import { useTheme } from '@/theme';
import type { ChargingSession } from '@/types/charging-session';
import {
  EMPTY_METRIC,
  formatCurrencyAmount,
  formatDurationSeconds,
  formatEnergyKwh,
  formatHomeJourneyDuration,
  formatPowerKw,
  hasMetricValue,
} from '@/utils/charging-session-format';

type ActiveSessionCardProps = {
  session: ChargingSession;
  stationName?: string;
  evseLabel?: string;
  connectorLabel?: string;
  vehicleLabel?: string | null;
  variant?: 'default' | 'compact' | 'home';
  onPress?: () => void;
};

/** Splits a formatted metric ("42.8 kW") into its number and unit so the ring can style them apart. */
function splitMetric(formatted: string): { value: string; unit?: string } {
  if (formatted === EMPTY_METRIC) {
    return { value: EMPTY_METRIC };
  }
  const [value, ...rest] = formatted.split(' ');
  return { value, unit: rest.join(' ') || undefined };
}

/**
 * Live charging card. The obsidian hero panel carries the charging ring (power), a stat row
 * (energy / time / cost) and the station + hardware context. `compact` drops the ring for
 * in-page placements (station details); `home` adds the "Open charging session" affordance.
 */
export function ActiveSessionCard({
  session,
  stationName,
  evseLabel,
  connectorLabel,
  vehicleLabel,
  variant = 'default',
  onPress,
}: ActiveSessionCardProps) {
  const { theme } = useTheme();
  const styles = useMemo(() => createStyles(theme), [theme]);

  const hardwareParts = [evseLabel, connectorLabel].filter(
    (part): part is string => Boolean(part) && part !== EMPTY_METRIC,
  );
  const vehicleLine =
    vehicleLabel?.trim() || (session.vehicleLabel?.trim() ? session.vehicleLabel.trim() : null);

  const power = splitMetric(formatPowerKw(session.averagePowerKw ?? session.maxPowerKw));
  const energy = splitMetric(formatEnergyKwh(session.energyKwh));
  const duration =
    variant === 'home'
      ? (formatHomeJourneyDuration(session.durationSeconds, session.startedAt) ?? EMPTY_METRIC)
      : formatDurationSeconds(session.durationSeconds, session.startedAt);
  const showCost = hasMetricValue(session.totalCost);

  const title = variant === 'compact' ? 'Charging now' : 'Charging in progress';

  const content = (
    <Surface variant="hero" padding={theme.spacing.lg} style={styles.card}>
      <View style={styles.header}>
        <View style={styles.headerIcon}>
          <Icon name="bolt" size={18} color={theme.colors.secondary} />
        </View>
        <View style={styles.headerCopy}>
          <Text style={styles.title}>{title}</Text>
          {stationName ? (
            <Text style={styles.subtitle} numberOfLines={1}>
              {stationName}
            </Text>
          ) : null}
        </View>
        <View style={styles.livePill}>
          <View style={styles.liveDot} />
          <Text style={styles.liveText}>LIVE</Text>
        </View>
      </View>

      {variant === 'compact' ? null : (
        <View style={styles.ringWrap}>
          <ChargingRing
            value={power.value}
            unit={power.unit ?? 'kW'}
            caption="Power"
            size={variant === 'home' ? 150 : 184}
            live
            onHero
          />
        </View>
      )}

      <StatRow onHero>
        {variant === 'compact' ? <StatTile onHero label="Power" value={power.value} unit={power.unit} /> : null}
        <StatTile onHero label="Delivered" value={energy.value} unit={energy.unit} />
        <StatTile onHero label="Duration" value={duration} />
        {variant === 'default' && showCost ? (
          <StatTile onHero label="Cost" value={formatCurrencyAmount(session.totalCost)} />
        ) : null}
      </StatRow>

      {vehicleLine || hardwareParts.length > 0 ? (
        <View style={styles.chips}>
          {vehicleLine ? (
            <View style={styles.chip}>
              <Icon name="car" size={13} color={theme.colors.heroTextMuted} />
              <Text style={styles.chipText} numberOfLines={1}>
                {vehicleLine}
              </Text>
            </View>
          ) : null}
          {hardwareParts.map((part) => (
            <View key={part} style={styles.chip}>
              <Text style={styles.chipText} numberOfLines={1}>
                {part}
              </Text>
            </View>
          ))}
        </View>
      ) : null}

      {variant === 'home' ? (
        <View style={styles.footer}>
          <Text style={styles.footerAction}>Open charging session</Text>
          <Icon name="chevron-forward" size={16} color={theme.colors.secondary} />
        </View>
      ) : null}
    </Surface>
  );

  if (!onPress) {
    return content;
  }

  return (
    <Pressable
      onPress={onPress}
      accessibilityRole="button"
      accessibilityLabel={
        variant === 'home' ? 'Open charging session' : 'View active charging session'
      }
      style={({ pressed }) => (pressed ? styles.pressed : null)}
    >
      {content}
    </Pressable>
  );
}

function createStyles(theme: ReturnType<typeof useTheme>['theme']) {
  return StyleSheet.create({
    card: {
      gap: theme.spacing.lg,
    },
    pressed: {
      opacity: 0.92,
      transform: [{ scale: 0.99 }],
    },
    header: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: theme.spacing.md,
    },
    headerIcon: {
      width: 38,
      height: 38,
      borderRadius: 14,
      alignItems: 'center',
      justifyContent: 'center',
      backgroundColor: theme.colors.heroSurface,
    },
    headerCopy: {
      flex: 1,
      gap: 2,
    },
    title: {
      fontFamily: theme.typography.fontFamily.brand,
      fontSize: 17,
      letterSpacing: -0.3,
      color: theme.colors.heroText,
    },
    subtitle: {
      fontFamily: theme.typography.fontFamily.medium,
      fontSize: theme.typography.fontSize.sm,
      color: theme.colors.heroTextMuted,
    },
    livePill: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: 6,
      paddingHorizontal: 10,
      paddingVertical: 5,
      borderRadius: theme.radius.pill,
      backgroundColor: 'rgba(16, 185, 129, 0.16)',
    },
    liveDot: {
      width: 7,
      height: 7,
      borderRadius: 4,
      backgroundColor: theme.colors.secondary,
    },
    liveText: {
      fontFamily: theme.typography.fontFamily.extrabold,
      fontSize: 10,
      letterSpacing: 1,
      color: theme.colors.secondary,
    },
    ringWrap: {
      alignItems: 'center',
      paddingVertical: theme.spacing.xs,
    },
    chips: {
      flexDirection: 'row',
      flexWrap: 'wrap',
      gap: theme.spacing.sm,
    },
    chip: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: 6,
      maxWidth: '100%',
      paddingHorizontal: 12,
      paddingVertical: 6,
      borderRadius: theme.radius.pill,
      backgroundColor: theme.colors.heroSurface,
    },
    chipText: {
      fontFamily: theme.typography.fontFamily.semibold,
      fontSize: theme.typography.fontSize.xs,
      color: theme.colors.heroTextMuted,
    },
    footer: {
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'flex-end',
      gap: 4,
    },
    footerAction: {
      fontFamily: theme.typography.fontFamily.bold,
      fontSize: theme.typography.fontSize.sm,
      color: theme.colors.secondary,
    },
  });
}
