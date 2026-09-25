import { router, useLocalSearchParams } from 'expo-router';
import { useMemo, type ReactNode } from 'react';
import {
  ActivityIndicator,
  Alert,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from 'react-native';

import { stopDriverChargingSession } from '@/api/chargingSessions';
import { useAuth } from '@/auth/auth-context';
import { Badge } from '@/components/ui/badge';
import { Icon, type IconName } from '@/components/ui/icon';
import { ScreenContainer } from '@/components/ui/screen-container';
import { useChargingSessionDetail } from '@/hooks/use-charging-session-detail';
import { useTheme } from '@/theme';
import type { ChargingSession } from '@/types/charging-session';
import { formatChargingSessionStatus } from '@/types/charging-session';
import {
  EMPTY_METRIC,
  formatCurrencyAmount,
  formatCurrencyRate,
  formatDurationSeconds,
  formatEnergyKwh,
  formatPowerKw,
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

type Theme = ReturnType<typeof useTheme>['theme'];
type DetailStyles = ReturnType<typeof createStyles>;

function DetailRow({
  label,
  value,
  styles,
  isLast = false,
}: {
  label: string;
  value: string;
  styles: DetailStyles;
  isLast?: boolean;
}) {
  const isEmpty = value === EMPTY_METRIC;

  return (
    <View style={[styles.detailRow, isLast && styles.detailRowLast]}>
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

function StreamSection({
  icon,
  title,
  children,
  styles,
  theme,
  isFirst = false,
}: {
  icon: IconName;
  title: string;
  children: ReactNode;
  styles: DetailStyles;
  theme: Theme;
  isFirst?: boolean;
}) {
  return (
    <View style={[styles.streamSection, !isFirst && styles.streamSectionSpaced]}>
      <View
        style={[styles.streamHeader, !isFirst && styles.streamHeaderSpaced]}
      >
        <View style={styles.streamHeaderIcon}>
          <Icon name={icon} size={16} color={theme.colors.accent} />
        </View>
        <Text style={styles.streamTitle}>{title}</Text>
      </View>
      <View style={styles.streamBody}>{children}</View>
    </View>
  );
}

export function SessionDetailScreen() {
  const { token } = useAuth();
  const { theme } = useTheme();
  const styles = useMemo(() => createStyles(theme), [theme]);
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
    typeof detail?.station?.name === 'string'
      ? detail.station.name
      : EMPTY_METRIC;
  const chargerName =
    typeof detail?.charger?.name === 'string'
      ? detail.charger.name
      : EMPTY_METRIC;
  const evseLabel = formatEvseLabel(
    detail?.evse as { label?: string } | null,
    chargerName !== EMPTY_METRIC ? chargerName : undefined,
    session?.evseId,
  );
  const connectorLabel = formatConnectorLabel(
    detail?.connector as Parameters<typeof formatConnectorLabel>[0],
    session?.connectorId,
  );
  const vehicleLabel = formatVehicleLabel(
    detail?.vehicle ?? null,
    session?.vehicleId,
  );

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
                  stopError instanceof Error
                    ? stopError.message
                    : 'Please try again.',
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
          <ActivityIndicator color={theme.colors.accent} size="large" />
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

    const durationValue = formatDurationSeconds(
      session.durationSeconds,
      session.startedAt,
    );
    const energyValue = formatEnergyKwh(session.energyKwh);
    const costValue = formatCurrencyAmount(session.totalCost);
    const hasCost = hasMetricValue(session.totalCost);

    const locationRows = [
      { label: 'Station', value: stationName },
      ...(chargerName !== EMPTY_METRIC
        ? [{ label: 'Charger', value: chargerName }]
        : []),
      { label: 'EVSE', value: evseLabel },
      { label: 'Connector', value: connectorLabel },
    ];

    const sessionRows = [
      {
        label: 'Started',
        value: formatSessionDateTime(session.startedAt),
      },
      ...(session.endedAt
        ? [
            {
              label: 'Ended',
              value: formatSessionDateTime(session.endedAt),
            },
          ]
        : []),
      ...(vehicleLabel !== EMPTY_METRIC
        ? [{ label: 'Vehicle', value: vehicleLabel }]
        : []),
      ...(session.stopReason
        ? [
            {
              label: 'Stop reason',
              value: formatStopReason(session.stopReason),
            },
          ]
        : []),
    ];

    const chargingRows = [
      ...(hasMetricValue(session.energyKwh)
        ? [{ label: 'Energy', value: formatEnergyKwh(session.energyKwh) }]
        : []),
      ...(hasMetricValue(session.averagePowerKw)
        ? [
            {
              label: 'Average power',
              value: formatPowerKw(session.averagePowerKw),
            },
          ]
        : []),
      ...(hasMetricValue(session.maxPowerKw)
        ? [
            {
              label: 'Maximum power',
              value: formatPowerKw(session.maxPowerKw),
            },
          ]
        : []),
    ];

    return (
      <ScrollView
        showsVerticalScrollIndicator={false}
        style={styles.scroll}
        contentContainerStyle={styles.scrollContent}
      >
        <View style={styles.heroCard}>
          <Text style={styles.heroEyebrow}>TOTAL TRANSACTION COST</Text>
          <Text
            style={[
              styles.heroPrice,
              !hasCost && styles.heroPriceMuted,
            ]}
          >
            {costValue}
          </Text>

          <View style={styles.statusRow}>
            <Badge
              label={formatChargingSessionStatus(session.status)}
              variant={isCharging ? 'available' : 'neutral'}
              showDot={isCharging}
            />
            <Text style={styles.startedAt}>
              {formatSessionDateTime(session.startedAt)}
            </Text>
          </View>

          <View style={styles.heroDivider} />

          <View style={styles.heroStatsRow}>
            <View style={styles.heroStat}>
              <Icon name="time" size={14} color={theme.colors.accent} />
              <Text style={styles.heroStatText}>{durationValue}</Text>
            </View>
            <View style={styles.heroStatDivider} />
            <View style={styles.heroStat}>
              <Icon name="bolt" size={14} color={theme.colors.accent} />
              <Text style={styles.heroStatText}>{energyValue}</Text>
            </View>
          </View>
        </View>

        <View style={styles.streamCard}>
          <StreamSection
            icon="map-pin"
            title="Location"
            styles={styles}
            theme={theme}
            isFirst
          >
            {locationRows.map((row, index) => (
              <DetailRow
                key={row.label}
                label={row.label}
                value={row.value}
                styles={styles}
                isLast={index === locationRows.length - 1}
              />
            ))}
          </StreamSection>

          <StreamSection
            icon="document"
            title="Session"
            styles={styles}
            theme={theme}
          >
            {sessionRows.map((row, index) => (
              <DetailRow
                key={row.label}
                label={row.label}
                value={row.value}
                styles={styles}
                isLast={index === sessionRows.length - 1}
              />
            ))}
          </StreamSection>

          {showTelemetry ? (
            <StreamSection
              icon="bolt"
              title="Charging data"
              styles={styles}
              theme={theme}
            >
              {chargingRows.map((row, index) => (
                <DetailRow
                  key={row.label}
                  label={row.label}
                  value={row.value}
                  styles={styles}
                  isLast={index === chargingRows.length - 1}
                />
              ))}
            </StreamSection>
          ) : null}
        </View>

        {showBilling ? (
          <View style={styles.receiptCard}>
            <View style={styles.streamHeader}>
              <View style={styles.streamHeaderIcon}>
                <Icon name="price" size={16} color={theme.colors.accent} />
              </View>
              <Text style={styles.streamTitle}>Billing & Invoice</Text>
            </View>

            {hasMetricValue(session.pricePerKwh) ? (
              <Text style={styles.receiptSubtitle}>
                Price per kWh · {formatCurrencyRate(session.pricePerKwh)}
              </Text>
            ) : null}

            <View style={styles.receiptDots} />

            <View style={styles.receiptTotalRow}>
              <Text style={styles.receiptTotalLabel}>Total Cost</Text>
              <Text
                style={[
                  styles.receiptTotalValue,
                  !hasCost && styles.detailValueMuted,
                ]}
              >
                {costValue}
              </Text>
            </View>
          </View>
        ) : null}

        {detail.timeline.length > 0 ? (
          <View style={styles.timelineCard}>
            <View style={styles.streamHeader}>
              <View style={styles.streamHeaderIcon}>
                <Icon name="time" size={16} color={theme.colors.accent} />
              </View>
              <Text style={styles.streamTitle}>Timeline</Text>
            </View>

            {detail.timeline.map((event, index) => {
              const isLast = index === detail.timeline.length - 1;

              return (
                <View
                  key={`${event.type}-${event.at}-${index}`}
                  style={styles.timelineRow}
                >
                  <View style={styles.timelineRail}>
                    <View style={styles.timelineDot} />
                    {!isLast ? <View style={styles.timelineLine} /> : null}
                  </View>
                  <View
                    style={[
                      styles.timelineContent,
                      isLast && styles.timelineContentLast,
                    ]}
                  >
                    <Text style={styles.timelineTitle}>
                      {formatTimelineEventLabel(event.type)}
                    </Text>
                    <Text style={styles.timelineMeta}>
                      {formatSessionDateTime(event.at)}
                    </Text>
                  </View>
                </View>
              );
            })}
          </View>
        ) : null}

        <Text style={styles.sessionIdFooter}>
          Session ID · {truncateId(session.id, 12)}
        </Text>

        {isCharging ? (
          <Pressable style={styles.stopButton} onPress={handleStop}>
            <Text style={styles.stopButtonText}>Stop charging</Text>
          </Pressable>
        ) : null}
      </ScrollView>
    );
  };

  return (
    <ScreenContainer edges={['top', 'bottom']} style={styles.screen}>
      <SessionDetailHeader onBack={() => router.back()} />
      {renderBody()}
    </ScreenContainer>
  );
}

function createStyles(theme: Theme) {
  return StyleSheet.create({
    screen: {
      backgroundColor: theme.colors.background,
    },
    scroll: {
      flex: 1,
      backgroundColor: theme.colors.background,
    },
    scrollContent: {
      paddingBottom: 28,
      backgroundColor: theme.colors.background,
    },
    heroCard: {
      backgroundColor: theme.colors.surface,
      borderRadius: 16,
      borderWidth: 1,
      borderColor: theme.colors.border,
      padding: 18,
      marginHorizontal: 16,
      marginTop: 16,
      alignItems: 'center',
      shadowColor: theme.colors.accent,
      shadowOffset: { width: 0, height: 8 },
      shadowOpacity: 0.05,
      shadowRadius: 15,
      elevation: 3,
    },
    heroEyebrow: {
      fontFamily: theme.typography.fontFamily.medium,
      fontSize: 10,
      color: theme.colors.textMuted,
      letterSpacing: 0.8,
    },
    heroPrice: {
      fontFamily: theme.typography.fontFamily.brand,
      fontSize: 32,
      color: theme.colors.statusAvailable,
      marginVertical: 6,
    },
    heroPriceMuted: {
      color: theme.colors.textMuted,
    },
    statusRow: {
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'center',
      flexWrap: 'wrap',
      gap: 8,
      marginBottom: 4,
    },
    startedAt: {
      fontFamily: theme.typography.fontFamily.regular,
      fontSize: 12,
      color: theme.colors.textMuted,
    },
    heroDivider: {
      alignSelf: 'stretch',
      height: StyleSheet.hairlineWidth,
      backgroundColor: theme.colors.border,
      marginTop: 14,
      marginBottom: 14,
    },
    heroStatsRow: {
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'center',
      gap: 16,
    },
    heroStat: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: 6,
    },
    heroStatDivider: {
      width: StyleSheet.hairlineWidth,
      height: 16,
      backgroundColor: theme.colors.border,
    },
    heroStatText: {
      fontFamily: theme.typography.fontFamily.semibold,
      fontSize: 13,
      color: theme.colors.textPrimary,
    },
    streamCard: {
      backgroundColor: theme.colors.surface,
      borderRadius: 16,
      borderWidth: 1,
      borderColor: theme.colors.border,
      marginHorizontal: 16,
      marginTop: 14,
      padding: 16,
      ...theme.shadows.card,
      shadowColor: theme.colors.shadow,
    },
    streamSection: {
      gap: 2,
    },
    streamSectionSpaced: {
      marginTop: 16,
      paddingTop: 0,
      borderTopWidth: 1,
      borderTopColor: theme.colors.borderLight,
    },
    streamHeader: {
      flexDirection: 'row',
      alignItems: 'center',
      marginBottom: 4,
    },
    streamHeaderSpaced: {
      marginTop: 16,
    },
    streamHeaderIcon: {
      marginRight: 6,
    },
    streamTitle: {
      fontFamily: theme.typography.fontFamily.brand,
      fontSize: 14,
      color: theme.colors.textPrimary,
    },
    streamBody: {
      gap: 0,
    },
    detailRow: {
      flexDirection: 'row',
      justifyContent: 'space-between',
      alignItems: 'flex-start',
      paddingVertical: 10,
      borderBottomWidth: 1,
      borderBottomColor: theme.colors.borderLight,
    },
    detailRowLast: {
      borderBottomWidth: 0,
    },
    detailLabel: {
      fontFamily: theme.typography.fontFamily.regular,
      fontSize: 13,
      color: theme.colors.textSecondary,
    },
    detailValue: {
      flex: 1,
      fontFamily: theme.typography.fontFamily.medium,
      fontSize: 13,
      color: theme.colors.textPrimary,
      textAlign: 'right',
      paddingLeft: 20,
    },
    detailValueMuted: {
      color: theme.colors.textMuted,
    },
    receiptCard: {
      backgroundColor: theme.colors.surface,
      borderRadius: 16,
      borderWidth: 1,
      borderColor: theme.colors.border,
      marginHorizontal: 16,
      marginTop: 14,
      padding: 16,
      ...theme.shadows.card,
      shadowColor: theme.colors.shadow,
    },
    receiptSubtitle: {
      fontFamily: theme.typography.fontFamily.regular,
      fontSize: 13,
      color: theme.colors.textSecondary,
      marginTop: 10,
      marginBottom: 4,
    },
    receiptDots: {
      borderTopWidth: 1,
      borderStyle: 'dashed',
      borderColor: theme.colors.border,
      marginVertical: 14,
      width: '100%',
    },
    receiptTotalRow: {
      flexDirection: 'row',
      justifyContent: 'space-between',
      alignItems: 'center',
    },
    receiptTotalLabel: {
      fontFamily: theme.typography.fontFamily.medium,
      fontSize: 13,
      color: theme.colors.textSecondary,
    },
    receiptTotalValue: {
      fontFamily: theme.typography.fontFamily.brand,
      fontSize: 15,
      color: theme.colors.textPrimary,
    },
    timelineCard: {
      backgroundColor: theme.colors.surface,
      borderRadius: 16,
      borderWidth: 1,
      borderColor: theme.colors.border,
      marginHorizontal: 16,
      marginTop: 14,
      padding: 16,
      ...theme.shadows.card,
      shadowColor: theme.colors.shadow,
    },
    timelineRow: {
      flexDirection: 'row',
      gap: 10,
      marginTop: 8,
    },
    timelineRail: {
      width: 14,
      alignItems: 'center',
    },
    timelineDot: {
      width: 8,
      height: 8,
      borderRadius: 4,
      backgroundColor: theme.colors.statusDot,
      marginTop: 5,
    },
    timelineLine: {
      flex: 1,
      width: 1.5,
      backgroundColor: theme.colors.statusDot,
      opacity: 0.35,
      marginTop: 4,
      marginBottom: -4,
    },
    timelineContent: {
      flex: 1,
      paddingBottom: 12,
      gap: 2,
    },
    timelineContentLast: {
      paddingBottom: 0,
    },
    timelineTitle: {
      fontFamily: theme.typography.fontFamily.semibold,
      fontSize: 13,
      color: theme.colors.textPrimary,
    },
    timelineMeta: {
      fontFamily: theme.typography.fontFamily.regular,
      fontSize: 11,
      color: theme.colors.textMuted,
    },
    sessionIdFooter: {
      fontFamily: theme.typography.fontFamily.regular,
      fontSize: 11,
      color: theme.colors.textVersion,
      textAlign: 'center',
      marginTop: 16,
      marginBottom: 8,
      paddingHorizontal: 16,
    },
    stopButton: {
      backgroundColor: theme.colors.accent,
      borderRadius: 12,
      paddingVertical: 14,
      alignItems: 'center',
      marginHorizontal: 16,
      marginTop: 4,
      marginBottom: 8,
    },
    stopButtonText: {
      fontFamily: theme.typography.fontFamily.brand,
      fontSize: 15,
      color: '#FFFFFF',
    },
    centered: {
      flex: 1,
      alignItems: 'center',
      justifyContent: 'center',
      paddingVertical: 24,
      backgroundColor: theme.colors.background,
    },
    errorBox: {
      marginHorizontal: 16,
      marginTop: 16,
      padding: 16,
      borderRadius: 16,
      backgroundColor: theme.colors.surface,
      borderWidth: 1,
      borderColor: theme.colors.border,
      gap: 8,
      ...theme.shadows.card,
      shadowColor: theme.colors.shadow,
    },
    errorText: {
      fontFamily: theme.typography.fontFamily.regular,
      fontSize: 13,
      color: theme.colors.textPrimary,
    },
    retryText: {
      fontFamily: theme.typography.fontFamily.semibold,
      fontSize: 13,
      color: theme.colors.accent,
    },
  });
}
