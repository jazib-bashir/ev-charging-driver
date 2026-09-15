import { Pressable, StyleSheet, Text, View } from 'react-native';

import { Badge } from '@/components/ui/badge';
import { theme } from '@/theme';
import type { ChargingSession } from '@/types/charging-session';
import { formatChargingSessionStatus } from '@/types/charging-session';
import {
  EMPTY_METRIC,
  formatDurationSeconds,
  formatEnergyKwh,
  formatSessionDateTime,
  formatTotalCost,
  hasMetricValue,
} from '@/utils/charging-session-format';

type SessionListItemProps = {
  session: ChargingSession;
  stationName?: string;
  evseLabel?: string;
  connectorLabel?: string;
  onPress: () => void;
};

function StatCell({ label, value }: { label: string; value: string }) {
  const isEmpty = value === EMPTY_METRIC;

  return (
    <View style={styles.statCell}>
      <Text style={styles.statLabel}>{label}</Text>
      <Text style={[styles.statValue, isEmpty && styles.statValueMuted]} numberOfLines={1}>
        {value}
      </Text>
    </View>
  );
}

export function SessionListItem({
  session,
  stationName,
  evseLabel,
  connectorLabel,
  onPress,
}: SessionListItemProps) {
  const hardwareParts = [evseLabel, connectorLabel].filter(
    (part) => part && part !== EMPTY_METRIC,
  );

  return (
    <Pressable
      style={({ pressed }) => [styles.card, pressed && styles.cardPressed]}
      onPress={onPress}
      accessibilityRole="button"
    >
      <View style={styles.header}>
        <View style={styles.headerCopy}>
          <Text style={styles.stationName} numberOfLines={1}>
            {stationName ?? 'Charging session'}
          </Text>
          <Text style={styles.meta}>
            {formatSessionDateTime(session.startedAt)}
            {session.endedAt ? ` · ${formatSessionDateTime(session.endedAt)}` : ''}
          </Text>
        </View>
        <Badge
          label={formatChargingSessionStatus(session.status)}
          variant={session.status === 'CHARGING' ? 'available' : 'neutral'}
        />
      </View>

      <View style={styles.statsRow}>
        <StatCell
          label="Duration"
          value={formatDurationSeconds(session.durationSeconds, session.startedAt)}
        />
        <StatCell label="Energy" value={formatEnergyKwh(session.energyKwh)} />
        <StatCell
          label="Cost"
          value={
            hasMetricValue(session.totalCost)
              ? formatTotalCost(session.totalCost)
              : EMPTY_METRIC
          }
        />
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
    </Pressable>
  );
}

const styles = StyleSheet.create({
  card: {
    borderRadius: theme.radius.lg,
    borderWidth: 1,
    borderColor: theme.colors.border,
    backgroundColor: theme.colors.surface,
    paddingHorizontal: theme.spacing.lg,
    paddingVertical: 14,
    gap: theme.spacing.md,
    overflow: 'hidden',
    ...theme.shadows.card,
  },
  cardPressed: {
    opacity: 0.94,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    justifyContent: 'space-between',
    gap: theme.spacing.sm,
  },
  headerCopy: {
    flex: 1,
    gap: 2,
  },
  stationName: {
    fontSize: theme.typography.fontSize.lg,
    fontWeight: theme.typography.fontWeight.bold,
    color: theme.colors.textPrimary,
    letterSpacing: -0.2,
  },
  meta: {
    fontSize: theme.typography.fontSize.sm,
    color: theme.colors.textMuted,
    lineHeight: theme.typography.lineHeight.tight,
  },
  statsRow: {
    flexDirection: 'row',
    gap: theme.spacing.sm,
    paddingTop: theme.spacing.md,
    borderTopWidth: StyleSheet.hairlineWidth,
    borderTopColor: theme.colors.border,
  },
  statCell: {
    flex: 1,
    gap: 2,
  },
  statLabel: {
    fontSize: 11,
    fontWeight: '600',
    letterSpacing: 0.4,
    textTransform: 'uppercase',
    color: theme.colors.textMuted,
  },
  statValue: {
    fontSize: theme.typography.fontSize.sm,
    fontWeight: '600',
    color: theme.colors.textPrimary,
  },
  statValueMuted: {
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
    borderRadius: theme.radius.sm,
    backgroundColor: theme.colors.iconBackground,
  },
  hardwareText: {
    fontSize: theme.typography.fontSize.xs,
    color: theme.colors.textMuted,
  },
});
