import { router, useLocalSearchParams } from 'expo-router';
import { useMemo } from 'react';
import {
  ActivityIndicator,
  Alert,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from 'react-native';

import { useAuth } from '@/auth/auth-context';
import { stopDriverChargingSession } from '@/api/chargingSessions';
import { Badge } from '@/components/ui/badge';
import { ScreenContainer } from '@/components/ui/screen-container';
import { useChargingSessionDetail } from '@/hooks/use-charging-session-detail';
import { theme } from '@/theme';
import type { ChargingSession } from '@/types/charging-session';
import { formatChargingSessionStatus } from '@/types/charging-session';
import {
  EMPTY_METRIC,
  formatDurationSeconds,
  formatEnergyKwh,
  formatPowerKw,
  formatCurrencyAmount,
  formatCurrencyRate,
  formatSessionDateTime,
  formatStopReason,
  formatTimelineEventLabel,
  hasMetricValue,
} from '@/utils/charging-session-format';
import {
  formatConnectorLabel,
  formatEvseLabel,
  formatVehicleLabel,
  truncateId,
} from '@/utils/charging-session-labels';

import { SessionDetailHeader } from './session-detail-header';

function MetricTile({ label, value }: { label: string; value: string }) {
  const isEmpty = value === EMPTY_METRIC;

  return (
    <View style={styles.metricTile}>
      <Text style={styles.metricTileLabel}>{label}</Text>
      <Text style={[styles.metricTileValue, isEmpty && styles.metricTileValueMuted]}>{value}</Text>
    </View>
  );
}

function DetailRow({ label, value }: { label: string; value: string }) {
  const isEmpty = value === EMPTY_METRIC;

  return (
    <View style={styles.detailRow}>
      <Text style={styles.detailLabel}>{label}</Text>
      <Text
        style={[styles.detailValue, isEmpty && styles.detailValueMuted]}
        numberOfLines={2}
      >
        {value}
      </Text>
    </View>
  );
}

function SectionCard({
  title,
  children,
}: {
  title: string;
  children: React.ReactNode;
}) {
  return (
    <View style={styles.card}>
      <Text style={styles.sectionTitle}>{title}</Text>
      <View style={styles.sectionBody}>{children}</View>
    </View>
  );
}

export function SessionDetailScreen() {
  const { token } = useAuth();
  const params = useLocalSearchParams<{ id: string; sessionJson?: string }>();

  const fallbackSession = useMemo(() => {
    if (!params.sessionJson) {
      return null;
    }

    try {
      return JSON.parse(params.sessionJson) as ChargingSession;
    } catch {
      return null;
    }
  }, [params.sessionJson]);

  const { detail, isLoading, error, refresh } = useChargingSessionDetail({
    token,
    sessionId: params.id,
    fallbackSession,
  });

  const session = detail?.session;
  const isCharging = session?.status === 'CHARGING';

  const stationName =
    typeof detail?.station?.name === 'string' ? detail.station.name : EMPTY_METRIC;
  const chargerName =
    typeof detail?.charger?.name === 'string' ? detail.charger.name : EMPTY_METRIC;
  const evseLabel = formatEvseLabel(
    detail?.evse as { label?: string } | null,
    chargerName !== EMPTY_METRIC ? chargerName : undefined,
    session?.evseId,
  );
  const connectorLabel = formatConnectorLabel(
    detail?.connector as Parameters<typeof formatConnectorLabel>[0],
    session?.connectorId,
  );
  const vehicleLabel = formatVehicleLabel(detail?.vehicle ?? null, session?.vehicleId);

  const showTelemetry =
    hasMetricValue(session?.energyKwh) ||
    hasMetricValue(session?.averagePowerKw) ||
    hasMetricValue(session?.maxPowerKw);
  const showBilling =
    hasMetricValue(session?.pricePerKwh) || hasMetricValue(session?.totalCost);

  const handleStop = () => {
    if (!token || !session) {
      return;
    }

    Alert.alert(
      'Stop charging?',
      'Your charging session will end. The EVSE will be released for the next driver.',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Stop charging',
          style: 'destructive',
          onPress: () => {
            void (async () => {
              try {
                await stopDriverChargingSession(token, session.id);
                router.replace('/(tabs)/sessions');
              } catch (stopError) {
                Alert.alert(
                  'Unable to stop session',
                  stopError instanceof Error ? stopError.message : 'Please try again.',
                );
              }
            })();
          },
        },
      ],
    );
  };

  const renderBody = () => {
    if (isLoading) {
      return (
        <View style={styles.centered}>
          <ActivityIndicator color={theme.colors.brand} size="large" />
        </View>
      );
    }

    if (error && !detail) {
      return (
        <View style={styles.errorBox}>
          <Text style={styles.errorText}>{error}</Text>
          <Pressable onPress={() => void refresh()}>
            <Text style={styles.retryText}>Retry</Text>
          </Pressable>
        </View>
      );
    }

    if (!session || !detail) {
      return null;
    }

    return (
      <ScrollView
        showsVerticalScrollIndicator={false}
        contentContainerStyle={styles.scrollContent}
      >
        <View style={styles.summarySection}>
          <Text style={styles.stationName} numberOfLines={2}>
            {stationName !== EMPTY_METRIC ? stationName : 'Charging session'}
          </Text>

          <View style={styles.statusRow}>
            <Badge
              label={formatChargingSessionStatus(session.status)}
              variant={isCharging ? 'available' : 'neutral'}
              showDot={isCharging}
            />
            <Text style={styles.startedAt}>{formatSessionDateTime(session.startedAt)}</Text>
          </View>

          <View style={styles.metricsRow}>
            <MetricTile
              label="Duration"
              value={formatDurationSeconds(session.durationSeconds, session.startedAt)}
            />
            <MetricTile label="Energy" value={formatEnergyKwh(session.energyKwh)} />
            <MetricTile label="Cost" value={formatCurrencyAmount(session.totalCost)} />
          </View>
        </View>

        <View style={styles.sections}>
          <SectionCard title="Location">
            <DetailRow label="Station" value={stationName} />
            {chargerName !== EMPTY_METRIC ? (
              <DetailRow label="Charger" value={chargerName} />
            ) : null}
            <DetailRow label="EVSE" value={evseLabel} />
            <DetailRow label="Connector" value={connectorLabel} />
          </SectionCard>

          <SectionCard title="Session">
            <DetailRow label="Started" value={formatSessionDateTime(session.startedAt)} />
            {session.endedAt ? (
              <DetailRow label="Ended" value={formatSessionDateTime(session.endedAt)} />
            ) : null}
            {vehicleLabel !== EMPTY_METRIC ? (
              <DetailRow label="Vehicle" value={vehicleLabel} />
            ) : null}
            {session.stopReason ? (
              <DetailRow label="Stop reason" value={formatStopReason(session.stopReason)} />
            ) : null}
          </SectionCard>

          {showTelemetry ? (
            <SectionCard title="Charging data">
              {hasMetricValue(session.energyKwh) ? (
                <DetailRow label="Energy" value={formatEnergyKwh(session.energyKwh)} />
              ) : null}
              {hasMetricValue(session.averagePowerKw) ? (
                <DetailRow label="Average power" value={formatPowerKw(session.averagePowerKw)} />
              ) : null}
              {hasMetricValue(session.maxPowerKw) ? (
                <DetailRow label="Maximum power" value={formatPowerKw(session.maxPowerKw)} />
              ) : null}
            </SectionCard>
          ) : null}

          {showBilling ? (
            <SectionCard title="Billing">
              {hasMetricValue(session.pricePerKwh) ? (
                <DetailRow label="Price per kWh" value={formatCurrencyRate(session.pricePerKwh)} />
              ) : null}
              {hasMetricValue(session.totalCost) ? (
                <DetailRow label="Total cost" value={formatCurrencyAmount(session.totalCost)} />
              ) : null}
            </SectionCard>
          ) : null}

          {detail.timeline.length > 0 ? (
            <SectionCard title="Timeline">
              {detail.timeline.map((event, index) => {
                const isLast = index === detail.timeline.length - 1;

                return (
                  <View key={`${event.type}-${event.at}-${index}`} style={styles.timelineRow}>
                    <View style={styles.timelineRail}>
                      <View style={styles.timelineDot} />
                      {!isLast ? <View style={styles.timelineLine} /> : null}
                    </View>
                    <View style={[styles.timelineContent, isLast && styles.timelineContentLast]}>
                      <Text style={styles.timelineTitle}>
                        {formatTimelineEventLabel(event.type)}
                      </Text>
                      <Text style={styles.timelineMeta}>{formatSessionDateTime(event.at)}</Text>
                    </View>
                  </View>
                );
              })}
            </SectionCard>
          ) : null}

          <View style={styles.sessionIdBox}>
            <Text style={styles.sessionIdLabel}>Session ID</Text>
            <Text style={styles.sessionIdValue}>{truncateId(session.id, 12)}</Text>
          </View>

          {isCharging ? (
            <Pressable style={styles.stopButton} onPress={handleStop}>
              <Text style={styles.stopButtonText}>Stop charging</Text>
            </Pressable>
          ) : null}
        </View>
      </ScrollView>
    );
  };

  return (
    <ScreenContainer edges={['top', 'bottom']}>
      <SessionDetailHeader onBack={() => router.back()} />
      {renderBody()}
    </ScreenContainer>
  );
}

const styles = StyleSheet.create({
  scrollContent: {
    paddingBottom: theme.spacing.lg,
  },
  summarySection: {
    paddingHorizontal: theme.spacing.lg,
    paddingTop: theme.spacing.lg,
    gap: theme.spacing.md,
  },
  stationName: {
    fontSize: theme.typography.fontSize.xl,
    fontWeight: theme.typography.fontWeight.bold,
    color: theme.colors.textPrimary,
    letterSpacing: -0.3,
    lineHeight: 26,
  },
  statusRow: {
    flexDirection: 'row',
    alignItems: 'center',
    flexWrap: 'wrap',
    gap: theme.spacing.sm,
  },
  startedAt: {
    fontSize: theme.typography.fontSize.sm,
    color: theme.colors.textMuted,
    lineHeight: theme.typography.lineHeight.tight,
  },
  metricsRow: {
    flexDirection: 'row',
    gap: theme.spacing.md,
  },
  metricTile: {
    flex: 1,
    backgroundColor: theme.colors.iconBackground,
    borderRadius: theme.radius.md,
    paddingHorizontal: theme.spacing.md,
    paddingVertical: theme.spacing.md,
    gap: 6,
    alignItems: 'center',
  },
  metricTileLabel: {
    fontSize: theme.typography.fontSize.xs,
    fontWeight: theme.typography.fontWeight.semibold,
    letterSpacing: 0.4,
    textTransform: 'uppercase',
    color: theme.colors.textMuted,
  },
  metricTileValue: {
    fontSize: theme.typography.fontSize.md,
    fontWeight: theme.typography.fontWeight.bold,
    color: theme.colors.textPrimary,
    textAlign: 'center',
  },
  metricTileValueMuted: {
    color: theme.colors.textMuted,
    fontWeight: theme.typography.fontWeight.medium,
  },
  sections: {
    paddingHorizontal: theme.spacing.lg,
    paddingTop: theme.spacing.md,
    gap: theme.spacing.md,
  },
  card: {
    borderRadius: theme.radius.lg,
    borderWidth: 1,
    borderColor: theme.colors.border,
    backgroundColor: theme.colors.surface,
    paddingHorizontal: theme.spacing.lg,
    paddingVertical: 14,
    overflow: 'hidden',
    ...theme.shadows.card,
  },
  sectionTitle: {
    fontSize: theme.typography.fontSize.md,
    fontWeight: theme.typography.fontWeight.bold,
    color: theme.colors.textPrimary,
    letterSpacing: -0.2,
    marginBottom: theme.spacing.sm,
  },
  sectionBody: {
    gap: theme.spacing.sm,
  },
  detailRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    gap: theme.spacing.md,
    paddingVertical: 2,
  },
  detailLabel: {
    flex: 1,
    fontSize: theme.typography.fontSize.sm,
    color: theme.colors.textMuted,
    lineHeight: theme.typography.lineHeight.tight,
  },
  detailValue: {
    flex: 1,
    textAlign: 'right',
    fontSize: theme.typography.fontSize.sm,
    fontWeight: theme.typography.fontWeight.semibold,
    color: theme.colors.textPrimary,
    lineHeight: theme.typography.lineHeight.tight,
  },
  detailValueMuted: {
    color: theme.colors.textMuted,
    fontWeight: theme.typography.fontWeight.medium,
  },
  timelineRow: {
    flexDirection: 'row',
    gap: theme.spacing.sm,
  },
  timelineRail: {
    width: 14,
    alignItems: 'center',
  },
  timelineDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: theme.colors.brand,
    marginTop: 5,
  },
  timelineLine: {
    flex: 1,
    width: 2,
    backgroundColor: theme.colors.border,
    marginTop: 4,
    marginBottom: -4,
  },
  timelineContent: {
    flex: 1,
    paddingBottom: theme.spacing.md,
    gap: 2,
  },
  timelineContentLast: {
    paddingBottom: 0,
  },
  timelineTitle: {
    fontSize: theme.typography.fontSize.sm,
    fontWeight: theme.typography.fontWeight.semibold,
    color: theme.colors.textPrimary,
  },
  timelineMeta: {
    fontSize: theme.typography.fontSize.xs,
    color: theme.colors.textMuted,
  },
  sessionIdBox: {
    alignItems: 'center',
    paddingTop: theme.spacing.xs,
    gap: 2,
  },
  sessionIdLabel: {
    fontSize: theme.typography.fontSize.xs,
    fontWeight: theme.typography.fontWeight.semibold,
    letterSpacing: 0.4,
    textTransform: 'uppercase',
    color: theme.colors.textMuted,
  },
  sessionIdValue: {
    fontSize: theme.typography.fontSize.xs,
    color: theme.colors.textMuted,
  },
  stopButton: {
    backgroundColor: theme.colors.brand,
    borderRadius: theme.radius.md,
    paddingVertical: 14,
    alignItems: 'center',
    marginTop: theme.spacing.xs,
  },
  stopButtonText: {
    color: theme.colors.textInverse,
    fontWeight: theme.typography.fontWeight.bold,
    fontSize: theme.typography.fontSize.md,
  },
  centered: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: theme.spacing.xl,
  },
  errorBox: {
    marginHorizontal: theme.spacing.lg,
    marginTop: theme.spacing.lg,
    padding: theme.spacing.lg,
    borderRadius: theme.radius.lg,
    backgroundColor: theme.colors.surface,
    borderWidth: 1,
    borderColor: theme.colors.border,
    gap: theme.spacing.sm,
  },
  errorText: {
    color: theme.colors.textPrimary,
    fontSize: theme.typography.fontSize.sm,
  },
  retryText: {
    color: theme.colors.brand,
    fontWeight: theme.typography.fontWeight.semibold,
    fontSize: theme.typography.fontSize.sm,
  },
});
