import { Pressable, StyleSheet, Text, View } from 'react-native';

import { Icon } from '@/components/ui/icon';
import { Badge } from '@/components/ui/badge';
import { theme } from '@/theme';
import type { ChargingSession } from '@/types/charging-session';
import {
  EMPTY_METRIC,
  formatDurationSeconds,
  formatEnergyKwh,
  formatPowerKw,
  formatCurrencyAmount,
  hasMetricValue,
} from '@/utils/charging-session-format';

type ActiveSessionCardProps = {
  session: ChargingSession;
  stationName?: string;
  evseLabel?: string;
  connectorLabel?: string;
  compact?: boolean;
  onPress?: () => void;
};

function MetricTile({ label, value }: { label: string; value: string }) {
  const isEmpty = value === EMPTY_METRIC;

  return (
    <View style={styles.metricTile}>
      <Text style={styles.metricLabel}>{label}</Text>
      <Text style={[styles.metricValue, isEmpty && styles.metricValueMuted]}>{value}</Text>
    </View>
  );
}

export function ActiveSessionCard({
  session,
  stationName,
  evseLabel,
  connectorLabel,
  compact = false,
  onPress,
}: ActiveSessionCardProps) {
  const hardwareParts = [evseLabel, connectorLabel].filter(
    (part) => part && part !== EMPTY_METRIC,
  );

  const content = (
    <View style={styles.card}>
      <View style={styles.header}>
        <View style={styles.iconWrap}>
          <Icon name="bolt" size={18} color={theme.colors.brand} />
        </View>
        <View style={styles.headerCopy}>
          <View style={styles.titleRow}>
            <Text style={styles.title}>
              {compact ? 'Charging now' : 'Active charging session'}
            </Text>
            <Badge label="Charging" variant="available" showDot />
          </View>
          {stationName ? <Text style={styles.subtitle}>{stationName}</Text> : null}
        </View>
      </View>

      <View style={styles.metricsRow}>
        <MetricTile
          label="Duration"
          value={formatDurationSeconds(session.durationSeconds, session.startedAt)}
        />
        <MetricTile label="Energy" value={formatEnergyKwh(session.energyKwh)} />
        <MetricTile
          label="Power"
          value={formatPowerKw(session.averagePowerKw ?? session.maxPowerKw)}
        />
        {!compact && hasMetricValue(session.totalCost) ? (
          <MetricTile label="Cost" value={formatCurrencyAmount(session.totalCost)} />
        ) : null}
      </View>

      {hardwareParts.length > 0 ? (
        <View style={styles.hardwareRow}>
          {hardwareParts.map((part) => (
            <View key={part} style={styles.hardwarePill}>
              <Text style={styles.hardwareText} numberOfLines={1}>{part}</Text>
            </View>
          ))}
        </View>
      ) : null}
    </View>
  );

  if (!onPress) {
    return content;
  }

  return (
    <Pressable
      onPress={onPress}
      accessibilityRole="button"
      accessibilityLabel="View active charging session"
      style={({ pressed }) => pressed && styles.pressed}
    >
      {content}
    </Pressable>
  );
}

const styles = StyleSheet.create({
  card: {
    borderRadius: theme.radius.lg,
    borderWidth: 1,
    borderColor: theme.colors.selectionBorder,
    backgroundColor: theme.colors.brandMuted,
    padding: theme.spacing.md,
    gap: theme.spacing.md,
  },
  pressed: {
    opacity: 0.94,
  },
  header: {
    flexDirection: 'row',
    gap: theme.spacing.md,
  },
  iconWrap: {
    width: 36,
    height: 36,
    borderRadius: 18,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: theme.colors.surface,
  },
  headerCopy: {
    flex: 1,
    gap: 4,
  },
  titleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: theme.spacing.sm,
  },
  title: {
    flex: 1,
    fontSize: theme.typography.fontSize.md,
    fontWeight: '700',
    color: theme.colors.textPrimary,
  },
  subtitle: {
    fontSize: theme.typography.fontSize.sm,
    color: theme.colors.textMuted,
  },
  metricsRow: {
    flexDirection: 'row',
    gap: theme.spacing.sm,
  },
  metricTile: {
    flex: 1,
    borderRadius: theme.radius.md,
    backgroundColor: theme.colors.surface,
    paddingVertical: theme.spacing.sm,
    paddingHorizontal: theme.spacing.xs,
    alignItems: 'center',
    gap: 2,
  },
  metricLabel: {
    fontSize: 10,
    fontWeight: '600',
    letterSpacing: 0.4,
    textTransform: 'uppercase',
    color: theme.colors.textMuted,
  },
  metricValue: {
    fontSize: theme.typography.fontSize.sm,
    fontWeight: '700',
    color: theme.colors.textPrimary,
    textAlign: 'center',
  },
  metricValueMuted: {
    color: theme.colors.textMuted,
    fontWeight: '500',
  },
  hardwareRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: theme.spacing.xs,
  },
  hardwarePill: {
    maxWidth: '100%',
    paddingHorizontal: theme.spacing.sm,
    paddingVertical: 4,
    borderRadius: theme.radius.md,
    backgroundColor: theme.colors.surface,
  },
  hardwareText: {
    fontSize: theme.typography.fontSize.xs,
    color: theme.colors.textMuted,
  },
});
