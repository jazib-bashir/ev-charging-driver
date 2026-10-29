import { useMemo } from 'react';
import {
  ActivityIndicator,
  Pressable,
  StyleSheet,
  Text,
  View,
} from 'react-native';
import Svg, { Circle } from 'react-native-svg';

import { Icon } from '@/components/ui/icon';
import { StationHeader } from '@/components/station/station-header';
import { useTheme, type AppTheme } from '@/theme';
import type { ChargingSession } from '@/types/charging-session';
import type { QueueMember } from '@/types/queue';
import {
  EMPTY_METRIC,
  formatHomeJourneyConnectorLabel,
  formatHomeJourneyDuration,
  formatPowerKw,
} from '@/utils/charging-session-format';
import {
  formatEstimatedWaitRelative,
  formatQueuePositionPadded,
  formatReadyChargerBayNumber,
  formatReadyConnectorBadge,
  getAtStationPreparationHeadline,
  getPeopleAhead,
  homeJourneyActionLabel,
  homeJourneyActionSubtitle,
  homeJourneyStatusBadgeLabel,
  resolveHomeJourneyVisualVariant,
} from '@/utils/queue-display';

const CHARGING_BG = '#0A2F2A';
const EDGE = 20;

type HomeActiveJourneyScreenProps = {
  membership?: QueueMember | null;
  session?: ChargingSession | null;
  stationName?: string;
  stationSubtitle?: string | null;
  connectorLabel?: string | null;
  vehicleLabel?: string | null;
  chargingWithoutSession?: boolean;
  isRefreshing?: boolean;
  isLeavingQueue?: boolean;
  onOpenJourneyDetails: () => void;
  onLeaveQueue?: () => void;
};

export function HomeActiveJourneyScreen({
  membership,
  session,
  stationName,
  stationSubtitle,
  connectorLabel,
  vehicleLabel,
  chargingWithoutSession = false,
  isRefreshing = false,
  isLeavingQueue = false,
  onOpenJourneyDetails,
  onLeaveQueue,
}: HomeActiveJourneyScreenProps) {
  const { theme, isDark } = useTheme();
  const hasActiveSession = session?.status === 'CHARGING';
  const variant = resolveHomeJourneyVisualVariant(membership, {
    hasActiveSession,
    chargingWithoutSession: chargingWithoutSession && !hasActiveSession,
  });
  const isCharging = variant === 'charging';
  /** Dark teal cockpit only when app dark mode is on; light mode uses theme tokens. */
  const chargingDark = isCharging && isDark;
  const styles = useMemo(
    () => createStyles(theme, chargingDark),
    [theme, chargingDark],
  );

  const statusLabel = homeJourneyStatusBadgeLabel(variant);
  const actionTitle = homeJourneyActionLabel(variant);
  const actionSubtitle = homeJourneyActionSubtitle(variant);
  const freshness = isRefreshing ? 'Updating…' : 'Updated now';

  const identitySubtitle = isCharging
    ? buildChargingIdentitySubtitle(session, membership, connectorLabel)
    : stationSubtitle?.trim() || null;

  const identityIcon: 'bolt' | 'map-pin' = isCharging ? 'bolt' : 'map-pin';
  /** Leave only while waiting in line — not after operator calls approach / assigns bay. */
  const canLeaveQueue =
    Boolean(onLeaveQueue) && !isCharging && membership?.state === 'QUEUED';

  return (
    <View style={styles.screen} accessibilityLabel={`Home journey · ${statusLabel}`}>
      <StationHeader appearance={chargingDark ? 'charging' : 'default'} />

      <StationIdentityRow
        name={stationName?.trim() || 'Charging station'}
        subtitle={identitySubtitle}
        statusLabel={statusLabel}
        icon={identityIcon}
        isCharging={isCharging}
        brand={theme.colors.brand}
        styles={styles}
      />

      <View style={styles.body}>
        {variant === 'charging' && session ? (
          <ChargingBody
            session={session}
            vehicleLabel={vehicleLabel}
            freshness={isRefreshing ? 'LIVE · UPDATING' : 'LIVE · UPDATED NOW'}
            brand={theme.colors.brand}
            ringTrackColor={
              chargingDark ? 'rgba(255,255,255,0.12)' : theme.colors.border
            }
            styles={styles}
          />
        ) : variant === 'ready' && membership ? (
          <ReadyBody
            membership={membership}
            connectorLabel={connectorLabel}
            brand={theme.colors.brand}
            styles={styles}
          />
        ) : variant === 'at-station' && membership ? (
          <ArrivedBody membership={membership} brand={theme.colors.brand} styles={styles} />
        ) : variant === 'session-pending' ? (
          <SessionPendingBody brand={theme.colors.brand} styles={styles} />
        ) : membership ? (
          <QueuedBody
            membership={membership}
            freshness={freshness}
            brand={theme.colors.brand}
            styles={styles}
          />
        ) : (
          <View style={styles.pendingWrap}>
            <ActivityIndicator color={theme.colors.brand} />
          </View>
        )}
      </View>

      {canLeaveQueue ? (
        <Pressable
          onPress={onLeaveQueue}
          disabled={isLeavingQueue}
          accessibilityRole="button"
          accessibilityLabel="Leave queue"
          style={({ pressed }) => [
            styles.leaveButton,
            (pressed || isLeavingQueue) && styles.leaveButtonPressed,
          ]}
        >
          {isLeavingQueue ? (
            <ActivityIndicator color={theme.colors.textSecondary} />
          ) : (
            <Text style={styles.leaveButtonText}>Leave queue</Text>
          )}
        </Pressable>
      ) : null}

      <JourneyActionRow
        title={actionTitle}
        subtitle={actionSubtitle}
        isCharging={isCharging}
        brand={theme.colors.brand}
        onPress={onOpenJourneyDetails}
        styles={styles}
      />
    </View>
  );
}


function buildChargingIdentitySubtitle(
  session: ChargingSession | null | undefined,
  membership: QueueMember | null | undefined,
  connectorLabel?: string | null,
): string | null {
  const bay =
    formatReadyChargerBayNumber(membership?.allocation) ||
    session?.evseLabel?.trim() ||
    null;
  const connector = formatHomeJourneyConnectorLabel(
    connectorLabel,
    session?.connectorLabel,
    formatReadyConnectorBadge(membership?.allocation),
  );
  const connectorOk = connector && connector !== EMPTY_METRIC ? connector : null;
  const chargerPart = bay ? `Charger ${bay}` : session?.chargerName?.trim() || null;
  const parts = [chargerPart, connectorOk].filter(Boolean);
  return parts.length > 0 ? parts.join(' · ') : null;
}

function StationIdentityRow({
  name,
  subtitle,
  statusLabel,
  icon,
  isCharging,
  brand,
  styles,
}: {
  name: string;
  subtitle: string | null;
  statusLabel: string;
  icon: 'bolt' | 'map-pin';
  isCharging: boolean;
  brand: string;
  styles: ReturnType<typeof createStyles>;
}) {
  return (
    <View style={styles.identityRow}>
      <View style={[styles.identityIcon, isCharging && styles.identityIconCharging]}>
        <Icon name={icon} size={16} color={isCharging ? brand : brand} />
      </View>
      <View style={styles.identityCopy}>
        <Text style={styles.identityName} numberOfLines={1}>
          {name}
        </Text>
        {subtitle ? (
          <Text style={styles.identitySubtitle} numberOfLines={1}>
            {subtitle}
          </Text>
        ) : null}
      </View>
      <View style={styles.statusBadge}>
        <View style={styles.statusDot} />
        <Text style={styles.statusText}>{statusLabel}</Text>
      </View>
    </View>
  );
}

function JourneyActionRow({
  title,
  subtitle,
  isCharging,
  brand,
  onPress,
  styles,
}: {
  title: string;
  subtitle: string;
  isCharging: boolean;
  brand: string;
  onPress: () => void;
  styles: ReturnType<typeof createStyles>;
}) {
  return (
    <Pressable
      onPress={onPress}
      accessibilityRole="button"
      accessibilityLabel={title}
      style={({ pressed }) => [
        styles.actionRow,
        isCharging && styles.actionRowCharging,
        pressed && styles.actionRowPressed,
      ]}
    >
      <View style={styles.actionCopy}>
        <Text style={styles.actionTitle}>{title}</Text>
        <Text style={styles.actionSubtitle}>{subtitle}</Text>
      </View>
      <View style={[styles.actionButton, { backgroundColor: brand }]}>
        <Icon name="chevron-forward" size={22} color="#0F172A" />
      </View>
    </Pressable>
  );
}

function QueuedBody({
  membership,
  freshness,
  brand,
  styles,
}: {
  membership: QueueMember;
  freshness: string;
  brand: string;
  styles: ReturnType<typeof createStyles>;
}) {
  const position = formatQueuePositionPadded(membership) ?? '—';
  const ahead = getPeopleAhead(membership);
  const wait = formatEstimatedWaitRelative(membership.estimatedTurnAt) ?? '—';
  const centerHint = ahead === 0 ? "You're next" : `${ahead} ahead`;

  return (
    <View style={styles.queuedBody}>
      <View style={styles.queueVizWrap}>
        <View style={[styles.ringOuter, { borderColor: `${brand}55` }]} />
        <View style={[styles.ringMid, { borderColor: `${brand}99` }]} />
        <View style={[styles.ringCore, { backgroundColor: `${brand}22` }]}>
          <Text style={[styles.queueEyebrow, { color: brand }]}>Your position</Text>
          <Text style={styles.queuePosition}>{position}</Text>
          <Text style={[styles.queueHint, { color: brand }]}>{centerHint}</Text>
        </View>
      </View>

      <View style={styles.statsRow}>
        <View style={styles.statCell}>
          <Text style={styles.statLabel}>Drivers ahead</Text>
          <Text style={styles.statValue}>{String(ahead)}</Text>
        </View>
        <View style={styles.statDivider} />
        <View style={styles.statCell}>
          <Text style={styles.statLabel}>Estimated wait</Text>
          <Text style={styles.statValue}>{wait}</Text>
        </View>
      </View>

      <View style={styles.guidanceBand}>
        <View style={[styles.guidanceIcon, { backgroundColor: `${brand}1F` }]}>
          <Icon name="bell" size={16} color={brand} />
        </View>
        <View style={styles.guidanceCopy}>
          <Text style={styles.guidanceTitle}>Nothing to do right now</Text>
          <Text style={styles.guidanceBody}>
            Stay nearby. We’ll alert you when it’s time to arrive.
          </Text>
        </View>
      </View>

      <View style={styles.freshnessRow}>
        <Text style={styles.freshnessLeft}>Estimate based on the current queue</Text>
        <Text style={[styles.freshnessRight, { color: brand }]}>{freshness}</Text>
      </View>
    </View>
  );
}

function ArrivedBody({
  membership,
  brand,
  styles,
}: {
  membership: QueueMember;
  brand: string;
  styles: ReturnType<typeof createStyles>;
}) {
  const headline = getAtStationPreparationHeadline(membership);

  return (
    <View style={styles.arrivedBody}>
      <View style={styles.arrivedVizWrap}>
        <View style={[styles.arrivedRingOuter, { borderColor: `${brand}33` }]} />
        <View style={[styles.arrivedRingMid, { borderColor: `${brand}55` }]} />
        <View style={[styles.arrivedCheck, { backgroundColor: brand }]}>
          <Icon name="check" size={36} color="#0F172A" />
        </View>
      </View>

      <Text style={[styles.arrivedEyebrow, { color: brand }]}>Arrival confirmed</Text>
      <Text style={styles.arrivedTitle}>You’re checked in</Text>
      <Text style={styles.arrivedSubtitle}>The station knows you’re here.</Text>

      <View style={styles.happeningBlock}>
        <Text style={[styles.sectionEyebrow, { color: brand }]}>Happening now</Text>
        <Text style={styles.happeningTitle}>{headline}</Text>
        <View style={styles.segmentRow}>
          {[0, 1, 2, 3].map((index) => (
            <View
              key={index}
              style={[
                styles.segment,
                { backgroundColor: index < 2 ? brand : `${brand}33` },
              ]}
            />
          ))}
        </View>
        <Text style={styles.happeningHint}>
          Remain in the waiting area. We’ll show your bay here as soon as it’s assigned.
        </Text>
      </View>
    </View>
  );
}

function ReadyBody({
  membership,
  connectorLabel,
  brand,
  styles,
}: {
  membership: QueueMember;
  connectorLabel?: string | null;
  brand: string;
  styles: ReturnType<typeof createStyles>;
}) {
  const bayRaw = formatReadyChargerBayNumber(membership.allocation);
  const bayDisplay = bayRaw
    ? /^\d+$/.test(bayRaw)
      ? bayRaw.padStart(2, '0')
      : bayRaw
    : '—';
  const connector =
    formatReadyConnectorBadge(membership.allocation) ||
    (connectorLabel?.trim() ? connectorLabel.trim() : null) ||
    '—';

  return (
    <View style={styles.readyBody}>
      <View style={styles.readyDiagonal} pointerEvents="none" />

      <View style={styles.readyHeroRow}>
        <View style={styles.readyBayCol}>
          <Text style={[styles.sectionEyebrow, { color: brand }]}>Assigned bay</Text>
          <Text style={styles.readyBayNumber}>{bayDisplay}</Text>
          <View style={styles.readyProgressRow}>
            <View style={[styles.readyProgressLine, { backgroundColor: brand }]} />
            {[0, 1, 2].map((index) => (
              <View
                key={index}
                style={[
                  styles.readyProgressDot,
                  {
                    backgroundColor: index === 0 ? brand : themeFallbackMuted(brand),
                  },
                ]}
              />
            ))}
          </View>
        </View>

        <View style={styles.readyConnectorDivider} />

        <View style={styles.readyConnectorCol}>
          <View style={[styles.readyConnectorIcon, { backgroundColor: brand }]}>
            <Icon name="plug" size={22} color="#0F172A" />
          </View>
          <Text style={styles.readyConnectorLabel}>Connector</Text>
          <Text style={styles.readyConnectorValue}>{connector}</Text>
        </View>
      </View>

      <View style={styles.readyNextBlock}>
        <Text style={[styles.sectionEyebrow, { color: brand }]}>Next action</Text>
        <Text style={styles.readyNextTitle}>
          {bayRaw ? `Go to Bay ${bayRaw} and plug in` : 'Go to your bay and plug in'}
        </Text>
        <Text style={styles.readyNextBody}>
          Follow the green bay signs. Charging will begin only after the charger confirms
          your connection.
        </Text>
      </View>
    </View>
  );
}

function themeFallbackMuted(brand: string): string {
  return `${brand}40`;
}

function SessionPendingBody({
  brand,
  styles,
}: {
  brand: string;
  styles: ReturnType<typeof createStyles>;
}) {
  return (
    <View style={styles.pendingWrap}>
      <View style={[styles.pendingIcon, { backgroundColor: `${brand}22` }]}>
        <ActivityIndicator color={brand} />
      </View>
      <Text style={styles.pendingTitle}>Linking your charger</Text>
      <Text style={styles.pendingBody}>
        Your bay is ready. We’re confirming the charging session with the station.
      </Text>
    </View>
  );
}

function ChargingBody({
  session,
  vehicleLabel,
  freshness,
  brand,
  ringTrackColor,
  styles,
}: {
  session: ChargingSession;
  vehicleLabel?: string | null;
  freshness: string;
  brand: string;
  ringTrackColor: string;
  styles: ReturnType<typeof createStyles>;
}) {
  const powerRaw = formatPowerKw(session.averagePowerKw ?? session.maxPowerKw);
  const powerParts = splitPower(powerRaw);
  const energy =
    session.energyKwh != null && !Number.isNaN(session.energyKwh)
      ? `${session.energyKwh.toFixed(1)} kWh`
      : '—';
  const duration = formatHomeJourneyDuration(session.durationSeconds, session.startedAt);
  const vehicle =
    vehicleLabel?.trim() || session.vehicleLabel?.trim() || '—';

  const size = 220;
  const stroke = 14;
  const radius = (size - stroke) / 2;
  const circumference = 2 * Math.PI * radius;
  /** Decorative cockpit arc — not a fabricated SoC / completion %. */
  const progress = 0.72;
  const dashOffset = circumference * (1 - progress);

  const wave = [0.35, 0.55, 0.4, 0.75, 0.5, 0.9, 0.65, 0.45, 0.8, 0.55, 0.7, 0.4];

  return (
    <View style={styles.chargingBody}>
      <View style={styles.chargingRings} pointerEvents="none">
        <View style={styles.chargingRingA} />
        <View style={styles.chargingRingB} />
        <View style={styles.chargingRingC} />
      </View>

      <View style={styles.livePill}>
        <View style={[styles.livePillDot, { backgroundColor: brand }]} />
        <Text style={[styles.livePillText, { color: brand }]}>{freshness}</Text>
      </View>

      <View style={styles.powerRingWrap}>
        <Svg width={size} height={size}>
          <Circle
            cx={size / 2}
            cy={size / 2}
            r={radius}
            stroke={ringTrackColor}
            strokeWidth={stroke}
            fill="none"
          />
          <Circle
            cx={size / 2}
            cy={size / 2}
            r={radius}
            stroke={brand}
            strokeWidth={stroke}
            fill="none"
            strokeLinecap="round"
            strokeDasharray={`${circumference} ${circumference}`}
            strokeDashoffset={dashOffset}
            transform={`rotate(-90 ${size / 2} ${size / 2})`}
          />
        </Svg>
        <View style={styles.powerInner}>
          <Text style={styles.powerEyebrow}>Live power</Text>
          <View style={styles.powerValueRow}>
            <Text style={styles.powerValue}>{powerParts.value}</Text>
            {powerParts.unit ? (
              <Text style={styles.powerUnit}>{powerParts.unit}</Text>
            ) : null}
          </View>
          <View style={styles.waveRow}>
            {wave.map((intensity, index) => (
              <View
                key={`w-${index}`}
                style={[
                  styles.waveBar,
                  {
                    height: Math.max(4, Math.round(intensity * 18)),
                    backgroundColor: brand,
                  },
                ]}
              />
            ))}
          </View>
          <Text style={styles.powerCaption}>Measured at charger</Text>
        </View>
      </View>

      <View style={styles.chargingMetrics}>
        <View style={styles.chargingMetric}>
          <Text style={styles.chargingMetricLabel}>Energy delivered</Text>
          <Text style={styles.chargingMetricValue}>{energy}</Text>
        </View>
        <View style={styles.chargingMetricDivider} />
        <View style={styles.chargingMetric}>
          <Text style={styles.chargingMetricLabel}>Session duration</Text>
          <Text style={styles.chargingMetricValue}>
            {duration === EMPTY_METRIC ? '—' : duration}
          </Text>
        </View>
        <View style={styles.chargingMetricDivider} />
        <View style={styles.chargingMetric}>
          <Text style={styles.chargingMetricLabel}>Vehicle</Text>
          <Text style={styles.chargingMetricValue} numberOfLines={1}>
            {vehicle}
          </Text>
        </View>
      </View>
    </View>
  );
}

function splitPower(raw: string): { value: string; unit: string | null } {
  if (!raw || raw === EMPTY_METRIC) {
    return { value: '—', unit: null };
  }
  const match = raw.trim().match(/^([\d.]+)\s*(.*)$/);
  if (!match) {
    return { value: raw, unit: null };
  }
  return { value: match[1], unit: match[2] || null };
}

function createStyles(theme: AppTheme, chargingDark: boolean) {
  const textPrimary = chargingDark ? '#FFFFFF' : theme.colors.textPrimary;
  const textMuted = chargingDark ? 'rgba(255,255,255,0.62)' : theme.colors.textMuted;
  const brand = theme.colors.brand;
  const metricBorder = chargingDark ? 'rgba(255,255,255,0.14)' : theme.colors.border;
  const powerMuted = chargingDark ? 'rgba(255,255,255,0.55)' : theme.colors.textMuted;
  const powerCaptionColor = chargingDark
    ? 'rgba(255,255,255,0.45)'
    : theme.colors.textMuted;
  const powerPrimary = chargingDark ? '#FFFFFF' : theme.colors.textPrimary;

  return StyleSheet.create({
    screen: {
      flex: 1,
      backgroundColor: chargingDark ? CHARGING_BG : theme.colors.background,
    },
    identityRow: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: 12,
      paddingHorizontal: EDGE,
      paddingTop: 16,
      paddingBottom: 8,
    },
    identityIcon: {
      width: 40,
      height: 40,
      borderRadius: 20,
      alignItems: 'center',
      justifyContent: 'center',
      backgroundColor: theme.colors.brandMuted,
    },
    identityIconCharging: chargingDark
      ? {
          backgroundColor: 'rgba(0, 217, 160, 0.16)',
          borderWidth: 1,
          borderColor: 'rgba(0, 217, 160, 0.35)',
        }
      : {
          backgroundColor: theme.colors.brandMuted,
        },
    identityCopy: {
      flex: 1,
      gap: 2,
      minWidth: 0,
    },
    identityName: {
      fontFamily: theme.typography.fontFamily.bold,
      fontSize: 16,
      fontWeight: '700',
      color: textPrimary,
    },
    identitySubtitle: {
      fontFamily: theme.typography.fontFamily.regular,
      fontSize: 12,
      color: textMuted,
    },
    statusBadge: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: 6,
      flexShrink: 0,
    },
    statusDot: {
      width: 7,
      height: 7,
      borderRadius: 4,
      backgroundColor: brand,
    },
    statusText: {
      fontFamily: theme.typography.fontFamily.bold,
      fontSize: 13,
      fontWeight: '700',
      color: brand,
    },
    body: {
      flex: 1,
      paddingHorizontal: EDGE,
    },
    actionRow: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: 12,
      marginHorizontal: EDGE,
      marginBottom: 10,
      paddingVertical: 14,
      paddingHorizontal: 4,
      borderTopWidth: StyleSheet.hairlineWidth,
      borderBottomWidth: StyleSheet.hairlineWidth,
      borderColor: theme.colors.border,
    },
    actionRowCharging: chargingDark
      ? {
          borderColor: 'rgba(255,255,255,0.14)',
          backgroundColor: 'rgba(0,0,0,0.18)',
          borderRadius: 16,
          borderWidth: 0,
          paddingHorizontal: 14,
          marginBottom: 12,
        }
      : {
          borderColor: theme.colors.border,
          backgroundColor: theme.colors.surface,
          borderRadius: 16,
          borderTopWidth: 1,
          borderBottomWidth: 1,
          paddingHorizontal: 14,
          marginBottom: 12,
        },
    actionRowPressed: {
      opacity: 0.85,
    },
    actionCopy: {
      flex: 1,
      gap: 2,
      minWidth: 0,
    },
    actionTitle: {
      fontFamily: theme.typography.fontFamily.bold,
      fontSize: 16,
      fontWeight: '700',
      color: textPrimary,
    },
    actionSubtitle: {
      fontFamily: theme.typography.fontFamily.regular,
      fontSize: 12,
      color: textMuted,
    },
    actionButton: {
      width: 48,
      height: 48,
      borderRadius: 24,
      alignItems: 'center',
      justifyContent: 'center',
    },
    leaveButton: {
      marginHorizontal: EDGE,
      marginBottom: 8,
      minHeight: 48,
      borderRadius: 14,
      borderWidth: 1,
      borderColor: theme.colors.border,
      backgroundColor: theme.colors.surface,
      alignItems: 'center',
      justifyContent: 'center',
      paddingHorizontal: 16,
    },
    leaveButtonPressed: {
      opacity: 0.7,
    },
    leaveButtonText: {
      fontFamily: theme.typography.fontFamily.semibold,
      fontSize: 15,
      fontWeight: '600',
      color: theme.colors.textSecondary,
    },

    queuedBody: {
      flex: 1,
      alignItems: 'center',
      paddingTop: 8,
    },
    queueVizWrap: {
      width: 236,
      height: 236,
      alignItems: 'center',
      justifyContent: 'center',
      marginTop: 8,
      marginBottom: 18,
    },
    ringOuter: {
      position: 'absolute',
      width: 236,
      height: 236,
      borderRadius: 118,
      borderWidth: 1.5,
      borderStyle: 'dashed',
    },
    ringMid: {
      position: 'absolute',
      width: 200,
      height: 200,
      borderRadius: 100,
      borderWidth: 2,
    },
    ringCore: {
      width: 168,
      height: 168,
      borderRadius: 84,
      alignItems: 'center',
      justifyContent: 'center',
      gap: 2,
    },
    queueEyebrow: {
      fontFamily: theme.typography.fontFamily.bold,
      fontSize: 11,
      fontWeight: '700',
      letterSpacing: 0.9,
      textTransform: 'uppercase',
    },
    queuePosition: {
      fontFamily: theme.typography.fontFamily.bold,
      fontSize: 56,
      fontWeight: '700',
      color: textPrimary,
      letterSpacing: -1.5,
      lineHeight: 62,
    },
    queueHint: {
      fontFamily: theme.typography.fontFamily.bold,
      fontSize: 15,
      fontWeight: '700',
    },
    statsRow: {
      flexDirection: 'row',
      alignItems: 'stretch',
      width: '100%',
      paddingVertical: 14,
      borderTopWidth: StyleSheet.hairlineWidth,
      borderBottomWidth: StyleSheet.hairlineWidth,
      borderColor: theme.colors.border,
    },
    statCell: {
      flex: 1,
      alignItems: 'center',
      gap: 4,
    },
    statDivider: {
      width: StyleSheet.hairlineWidth,
      backgroundColor: theme.colors.border,
    },
    statLabel: {
      fontFamily: theme.typography.fontFamily.medium,
      fontSize: 12,
      color: textMuted,
    },
    statValue: {
      fontFamily: theme.typography.fontFamily.bold,
      fontSize: 20,
      fontWeight: '700',
      color: textPrimary,
    },
    guidanceBand: {
      flexDirection: 'row',
      alignItems: 'flex-start',
      gap: 12,
      width: '100%',
      marginTop: 16,
      paddingVertical: 14,
      paddingHorizontal: 12,
      borderRadius: 14,
      backgroundColor: theme.colors.surface,
      borderWidth: 1,
      borderColor: theme.colors.border,
    },
    guidanceIcon: {
      width: 36,
      height: 36,
      borderRadius: 18,
      alignItems: 'center',
      justifyContent: 'center',
    },
    guidanceCopy: {
      flex: 1,
      gap: 2,
    },
    guidanceTitle: {
      fontFamily: theme.typography.fontFamily.bold,
      fontSize: 14,
      fontWeight: '700',
      color: textPrimary,
    },
    guidanceBody: {
      fontFamily: theme.typography.fontFamily.regular,
      fontSize: 12,
      lineHeight: 17,
      color: textMuted,
    },
    freshnessRow: {
      flexDirection: 'row',
      justifyContent: 'space-between',
      alignItems: 'center',
      width: '100%',
      marginTop: 14,
      gap: 8,
    },
    freshnessLeft: {
      flex: 1,
      fontFamily: theme.typography.fontFamily.regular,
      fontSize: 11,
      color: textMuted,
    },
    freshnessRight: {
      fontFamily: theme.typography.fontFamily.bold,
      fontSize: 11,
      fontWeight: '700',
    },

    arrivedBody: {
      flex: 1,
      alignItems: 'center',
      paddingTop: 12,
    },
    arrivedVizWrap: {
      width: 168,
      height: 168,
      alignItems: 'center',
      justifyContent: 'center',
      marginBottom: 18,
    },
    arrivedRingOuter: {
      position: 'absolute',
      width: 168,
      height: 168,
      borderRadius: 84,
      borderWidth: 1.5,
    },
    arrivedRingMid: {
      position: 'absolute',
      width: 136,
      height: 136,
      borderRadius: 68,
      borderWidth: 1.5,
    },
    arrivedCheck: {
      width: 88,
      height: 88,
      borderRadius: 44,
      alignItems: 'center',
      justifyContent: 'center',
    },
    arrivedEyebrow: {
      fontFamily: theme.typography.fontFamily.bold,
      fontSize: 11,
      fontWeight: '700',
      letterSpacing: 0.9,
      textTransform: 'uppercase',
      marginBottom: 6,
    },
    arrivedTitle: {
      fontFamily: theme.typography.fontFamily.bold,
      fontSize: 26,
      fontWeight: '700',
      color: textPrimary,
      letterSpacing: -0.3,
      textAlign: 'center',
    },
    arrivedSubtitle: {
      fontFamily: theme.typography.fontFamily.regular,
      fontSize: 14,
      color: textMuted,
      marginTop: 6,
      marginBottom: 22,
      textAlign: 'center',
    },
    happeningBlock: {
      width: '100%',
      borderTopWidth: StyleSheet.hairlineWidth,
      borderBottomWidth: StyleSheet.hairlineWidth,
      borderColor: theme.colors.border,
      paddingVertical: 16,
      gap: 8,
    },
    sectionEyebrow: {
      fontFamily: theme.typography.fontFamily.bold,
      fontSize: 11,
      fontWeight: '700',
      letterSpacing: 0.9,
      textTransform: 'uppercase',
    },
    happeningTitle: {
      fontFamily: theme.typography.fontFamily.bold,
      fontSize: 18,
      fontWeight: '700',
      color: textPrimary,
    },
    segmentRow: {
      flexDirection: 'row',
      gap: 6,
      marginVertical: 4,
    },
    segment: {
      flex: 1,
      height: 6,
      borderRadius: 3,
    },
    happeningHint: {
      fontFamily: theme.typography.fontFamily.regular,
      fontSize: 13,
      lineHeight: 18,
      color: textMuted,
    },

    readyBody: {
      flex: 1,
      paddingTop: 28,
      overflow: 'hidden',
    },
    readyDiagonal: {
      position: 'absolute',
      left: -40,
      bottom: 40,
      width: 280,
      height: 1,
      backgroundColor: brand,
      opacity: 0.18,
      transform: [{ rotate: '-28deg' }],
    },
    readyHeroRow: {
      flexDirection: 'row',
      alignItems: 'flex-start',
      gap: 16,
      marginBottom: 28,
    },
    readyBayCol: {
      flex: 1,
      gap: 6,
    },
    readyBayNumber: {
      fontFamily: theme.typography.fontFamily.bold,
      fontSize: 72,
      fontWeight: '700',
      color: textPrimary,
      letterSpacing: -2,
      lineHeight: 78,
    },
    readyProgressRow: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: 8,
      marginTop: 4,
    },
    readyProgressLine: {
      width: 36,
      height: 3,
      borderRadius: 2,
    },
    readyProgressDot: {
      width: 8,
      height: 8,
      borderRadius: 4,
    },
    readyConnectorDivider: {
      width: StyleSheet.hairlineWidth,
      alignSelf: 'stretch',
      backgroundColor: theme.colors.border,
      marginVertical: 8,
    },
    readyConnectorCol: {
      width: 112,
      alignItems: 'center',
      paddingTop: 18,
      gap: 8,
    },
    readyConnectorIcon: {
      width: 52,
      height: 52,
      borderRadius: 26,
      alignItems: 'center',
      justifyContent: 'center',
    },
    readyConnectorLabel: {
      fontFamily: theme.typography.fontFamily.medium,
      fontSize: 12,
      color: textMuted,
    },
    readyConnectorValue: {
      fontFamily: theme.typography.fontFamily.bold,
      fontSize: 18,
      fontWeight: '700',
      color: textPrimary,
    },
    readyNextBlock: {
      borderTopWidth: StyleSheet.hairlineWidth,
      borderColor: theme.colors.border,
      paddingTop: 18,
      gap: 8,
    },
    readyNextTitle: {
      fontFamily: theme.typography.fontFamily.bold,
      fontSize: 20,
      fontWeight: '700',
      color: textPrimary,
    },
    readyNextBody: {
      fontFamily: theme.typography.fontFamily.regular,
      fontSize: 14,
      lineHeight: 20,
      color: textMuted,
    },

    pendingWrap: {
      flex: 1,
      alignItems: 'center',
      justifyContent: 'center',
      gap: 12,
      paddingHorizontal: 24,
    },
    pendingIcon: {
      width: 64,
      height: 64,
      borderRadius: 32,
      alignItems: 'center',
      justifyContent: 'center',
      marginBottom: 4,
    },
    pendingTitle: {
      fontFamily: theme.typography.fontFamily.bold,
      fontSize: 20,
      fontWeight: '700',
      color: textPrimary,
      textAlign: 'center',
    },
    pendingBody: {
      fontFamily: theme.typography.fontFamily.regular,
      fontSize: 14,
      lineHeight: 20,
      color: textMuted,
      textAlign: 'center',
    },

    chargingBody: {
      flex: 1,
      alignItems: 'center',
      justifyContent: 'center',
      paddingBottom: 8,
    },
    chargingRings: {
      ...StyleSheet.absoluteFill,
      alignItems: 'center',
      justifyContent: 'center',
    },
    chargingRingA: {
      position: 'absolute',
      width: 320,
      height: 320,
      borderRadius: 160,
      borderWidth: 1,
      borderColor: chargingDark ? 'rgba(0, 217, 160, 0.08)' : 'rgba(0, 217, 160, 0.14)',
    },
    chargingRingB: {
      position: 'absolute',
      width: 260,
      height: 260,
      borderRadius: 130,
      borderWidth: 1,
      borderColor: chargingDark ? 'rgba(0, 217, 160, 0.1)' : 'rgba(0, 217, 160, 0.18)',
    },
    chargingRingC: {
      position: 'absolute',
      width: 200,
      height: 200,
      borderRadius: 100,
      borderWidth: 1,
      borderColor: chargingDark ? 'rgba(0, 217, 160, 0.12)' : 'rgba(0, 217, 160, 0.22)',
    },
    livePill: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: 6,
      marginBottom: 12,
    },
    livePillDot: {
      width: 6,
      height: 6,
      borderRadius: 3,
    },
    livePillText: {
      fontFamily: theme.typography.fontFamily.bold,
      fontSize: 11,
      fontWeight: '700',
      letterSpacing: 0.7,
      textTransform: 'uppercase',
    },
    powerRingWrap: {
      width: 220,
      height: 220,
      alignItems: 'center',
      justifyContent: 'center',
      marginBottom: 20,
    },
    powerInner: {
      ...StyleSheet.absoluteFill,
      alignItems: 'center',
      justifyContent: 'center',
      gap: 2,
      paddingTop: 8,
    },
    powerEyebrow: {
      fontFamily: theme.typography.fontFamily.semibold,
      fontSize: 11,
      letterSpacing: 0.8,
      textTransform: 'uppercase',
      color: powerMuted,
    },
    powerValueRow: {
      flexDirection: 'row',
      alignItems: 'flex-end',
      gap: 4,
    },
    powerValue: {
      fontFamily: theme.typography.fontFamily.bold,
      fontSize: 52,
      fontWeight: '700',
      color: powerPrimary,
      letterSpacing: -1.5,
      lineHeight: 56,
    },
    powerUnit: {
      fontFamily: theme.typography.fontFamily.bold,
      fontSize: 18,
      fontWeight: '700',
      color: powerPrimary,
      marginBottom: 8,
    },
    waveRow: {
      flexDirection: 'row',
      alignItems: 'flex-end',
      gap: 3,
      height: 20,
      marginTop: 4,
    },
    waveBar: {
      width: 3,
      borderRadius: 1.5,
      opacity: 0.9,
    },
    powerCaption: {
      fontFamily: theme.typography.fontFamily.regular,
      fontSize: 11,
      color: powerCaptionColor,
      marginTop: 6,
    },
    chargingMetrics: {
      flexDirection: 'row',
      alignItems: 'stretch',
      width: '100%',
      borderTopWidth: StyleSheet.hairlineWidth,
      borderBottomWidth: StyleSheet.hairlineWidth,
      borderColor: metricBorder,
      paddingVertical: 14,
    },
    chargingMetric: {
      flex: 1,
      alignItems: 'center',
      gap: 4,
      paddingHorizontal: 4,
    },
    chargingMetricDivider: {
      width: StyleSheet.hairlineWidth,
      backgroundColor: metricBorder,
    },
    chargingMetricLabel: {
      fontFamily: theme.typography.fontFamily.medium,
      fontSize: 11,
      color: powerMuted,
      textAlign: 'center',
    },
    chargingMetricValue: {
      fontFamily: theme.typography.fontFamily.bold,
      fontSize: 15,
      fontWeight: '700',
      color: powerPrimary,
      textAlign: 'center',
    },
  });
}
