import { Pressable, StyleSheet, Text, View } from 'react-native';

import { Icon } from '@/components/ui/icon';
import { Badge } from '@/components/ui/badge';
import { theme } from '@/theme';
import type { ChargingSession } from '@/types/charging-session';
import {
  EMPTY_METRIC,
  formatDurationSeconds,
  formatEnergyKwh,
  formatHomeJourneyDuration,
  formatPowerKw,
  formatCurrencyAmount,
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

function MetricTile({ label, value }: { label: string; value: string }) {
  return (
    <View style={styles.metricTile}>
      <Text style={styles.metricLabel}>{label}</Text>
      <Text style={styles.metricValue}>{value}</Text>
    </View>
  );
}

type HomeMetric = { label: string; value: string };

function collectHomeMetrics(session: ChargingSession): HomeMetric[] {
  const metrics: HomeMetric[] = [];

  const power = formatPowerKw(session.averagePowerKw ?? session.maxPowerKw);
  if (power !== EMPTY_METRIC) {
    metrics.push({ label: 'Power', value: power });
  }

  const energy = formatEnergyKwh(session.energyKwh);
  if (energy !== EMPTY_METRIC) {
    metrics.push({ label: 'Delivered', value: energy });
  }

  const duration = formatHomeJourneyDuration(session.durationSeconds, session.startedAt);
  if (duration) {
    metrics.push({ label: 'Duration', value: duration });
  }

  return metrics;
}

function HomeJourneyCardFooter() {
  return (
    <View style={homeStyles.footer}>
      <View style={homeStyles.footerDivider} />
      <View style={homeStyles.footerRow}>
        <Text style={homeStyles.footerAction}>Open charging session</Text>
        <Icon name="chevron-forward" size={16} color={theme.colors.brandDark} />
      </View>
    </View>
  );
}

export function ActiveSessionCard({
  session,
  stationName,
  evseLabel,
  connectorLabel,
  vehicleLabel,
  variant = 'default',
  onPress,
}: ActiveSessionCardProps) {
  const hardwareParts = [evseLabel, connectorLabel].filter(
    (part) => part && part !== EMPTY_METRIC,
  );

  const vehicleLine =
    vehicleLabel?.trim() ||
    (session.vehicleLabel?.trim() ? session.vehicleLabel.trim() : null);

  const homeMetrics = variant === 'home' ? collectHomeMetrics(session) : null;

  const title =
    variant === 'home'
      ? 'Charging in progress'
      : variant === 'compact'
        ? 'Charging now'
        : 'Active charging session';

  const content =
    variant === 'home' ? (
      <View style={homeStyles.card}>
        <View style={homeStyles.header}>
          <View style={homeStyles.headerIconWrap}>
            <Icon name="bolt" size={20} color={theme.colors.textInverse} />
          </View>
          <View style={homeStyles.headerCopy}>
            <View style={homeStyles.titleRow}>
              <Text style={homeStyles.title}>{title}</Text>
              <Badge label="Charging" variant="neutral" showDot />
            </View>
            {stationName ? <Text style={homeStyles.subtitle}>{stationName}</Text> : null}
          </View>
        </View>

        {vehicleLine ? (
          <View style={homeStyles.vehicleCard}>
            <View style={homeStyles.vehicleRow}>
              <View style={homeStyles.vehicleIconWrap}>
                <Icon name="bolt" size={16} color={theme.colors.textMuted} />
              </View>
              <View style={homeStyles.vehicleCopy}>
                <Text style={homeStyles.vehicleEyebrow}>Charging vehicle</Text>
                <Text style={homeStyles.vehicleTitle}>{vehicleLine}</Text>
              </View>
              <View style={homeStyles.livePill}>
                <View style={homeStyles.liveDot} />
                <Text style={homeStyles.liveText}>Live</Text>
              </View>
            </View>
          </View>
        ) : null}

        {homeMetrics && homeMetrics.length > 0 ? (
          <View style={homeStyles.metricsRow}>
            {homeMetrics.map((metric, index) => (
              <View key={metric.label} style={homeStyles.metricColumnWrap}>
                {index > 0 ? <View style={homeStyles.metricDivider} /> : null}
                <View style={homeStyles.metricColumn}>
                  <Text style={homeStyles.metricLabel}>{metric.label}</Text>
                  <Text style={homeStyles.metricValue}>{metric.value}</Text>
                </View>
              </View>
            ))}
          </View>
        ) : null}

        <HomeJourneyCardFooter />
      </View>
    ) : (
      <View style={styles.card}>
        <View style={styles.header}>
          <View style={styles.iconWrap}>
            <Icon name="bolt" size={18} color={theme.colors.brand} />
          </View>
          <View style={styles.headerCopy}>
            <View style={styles.titleRow}>
              <Text style={styles.title}>{title}</Text>
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
          {variant === 'compact' ? null : (
            <>
              <MetricTile
                label="Power"
                value={formatPowerKw(session.averagePowerKw ?? session.maxPowerKw)}
              />
              {variant === 'default' && hasMetricValue(session.totalCost) ? (
                <MetricTile label="Cost" value={formatCurrencyAmount(session.totalCost)} />
              ) : null}
            </>
          )}
        </View>

        {hardwareParts.length > 0 ? (
          <View style={styles.hardwareRow}>
            {hardwareParts.map((part) => (
              <View key={part} style={styles.hardwarePill}>
                <Text style={styles.hardwareText} numberOfLines={1}>
                  {part}
                </Text>
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
      accessibilityLabel={
        variant === 'home' ? 'Open charging session' : 'View active charging session'
      }
      style={({ pressed }) => pressed && styles.pressed}
    >
      {content}
    </Pressable>
  );
}

const homeStyles = StyleSheet.create({
  card: {
    borderRadius: theme.radius.lg,
    borderWidth: 1,
    borderColor: theme.colors.selectionBorder,
    backgroundColor: theme.colors.brandMuted,
    padding: theme.spacing.md,
    gap: theme.spacing.md,
  },
  header: {
    flexDirection: 'row',
    gap: theme.spacing.sm,
    alignItems: 'flex-start',
  },
  headerIconWrap: {
    width: 40,
    height: 40,
    borderRadius: 20,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: theme.colors.statusAvailable,
  },
  headerCopy: {
    flex: 1,
    gap: 4,
    paddingTop: 2,
  },
  titleRow: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    justifyContent: 'space-between',
    gap: theme.spacing.sm,
  },
  title: {
    flex: 1,
    fontSize: theme.typography.fontSize.md,
    fontWeight: '700',
    color: theme.colors.textPrimary,
    lineHeight: 22,
  },
  subtitle: {
    fontSize: theme.typography.fontSize.sm,
    color: theme.colors.textMuted,
  },
  vehicleCard: {
    borderRadius: theme.radius.lg,
    backgroundColor: theme.colors.surface,
    padding: theme.spacing.md,
  },
  vehicleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: theme.spacing.sm,
  },
  vehicleIconWrap: {
    width: 36,
    height: 36,
    borderRadius: 18,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: theme.colors.iconBackground,
  },
  vehicleCopy: {
    flex: 1,
    gap: 2,
  },
  vehicleEyebrow: {
    fontSize: 10,
    fontWeight: '600',
    letterSpacing: 0.6,
    textTransform: 'uppercase',
    color: theme.colors.textMuted,
  },
  vehicleTitle: {
    fontSize: theme.typography.fontSize.md,
    fontWeight: '700',
    color: theme.colors.textPrimary,
  },
  livePill: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
  },
  liveDot: {
    width: 7,
    height: 7,
    borderRadius: 4,
    backgroundColor: theme.colors.statusAvailable,
  },
  liveText: {
    fontSize: theme.typography.fontSize.sm,
    fontWeight: '600',
    color: theme.colors.statusAvailable,
  },
  metricsRow: {
    flexDirection: 'row',
    alignItems: 'stretch',
    backgroundColor: theme.colors.surface,
    borderRadius: theme.radius.lg,
    paddingVertical: theme.spacing.md,
  },
  metricColumnWrap: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'stretch',
  },
  metricDivider: {
    width: StyleSheet.hairlineWidth,
    backgroundColor: theme.colors.border,
    marginVertical: 2,
  },
  metricColumn: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    gap: 4,
    paddingHorizontal: theme.spacing.xs,
  },
  metricLabel: {
    fontSize: theme.typography.fontSize.xs,
    color: theme.colors.textMuted,
  },
  metricValue: {
    fontSize: theme.typography.fontSize.md,
    fontWeight: '700',
    color: theme.colors.textPrimary,
    textAlign: 'center',
  },
  footer: {
    gap: theme.spacing.sm,
    marginTop: theme.spacing.xs,
  },
  footerDivider: {
    height: StyleSheet.hairlineWidth,
    backgroundColor: theme.colors.selectionBorder,
  },
  footerRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'flex-end',
    gap: 4,
  },
  footerAction: {
    fontSize: theme.typography.fontSize.sm,
    fontWeight: '700',
    color: theme.colors.brandDark,
  },
});

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
