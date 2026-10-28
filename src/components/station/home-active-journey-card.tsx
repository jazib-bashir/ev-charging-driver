import type { ReactNode } from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';

import { Badge } from '@/components/ui/badge';
import { Icon } from '@/components/ui/icon';
import { theme } from '@/theme';
import type { ChargingSession } from '@/types/charging-session';
import type { QueueMember } from '@/types/queue';
import {
  EMPTY_METRIC,
  formatEnergyKwh,
  formatHomeJourneyDuration,
  formatPowerKw,
} from '@/utils/charging-session-format';
import {
  formatDriversAheadHeadline,
  formatDriversAheadSubtext,
  formatEstimatedTurn,
  formatQueuePositionPadded,
  formatReadyChargerBayNumber,
  formatReadyConnectorBadge,
  homeJourneyActionLabel,
  homeJourneyStatusBadgeLabel,
  resolveHomeJourneyStepIndex,
  resolveHomeJourneyVisualVariant,
} from '@/utils/queue-display';

const JOURNEY_STEPS = ['Queue', 'Arrived', 'Ready', 'Charge'] as const;

const CHARGING_CARD = {
  background: '#0B3D34',
  border: 'rgba(0, 217, 160, 0.35)',
  topAccent: theme.colors.brand,
  textPrimary: '#FFFFFF',
  textMuted: 'rgba(255, 255, 255, 0.72)',
  panelBg: 'rgba(0, 0, 0, 0.22)',
  panelBorder: 'rgba(255, 255, 255, 0.12)',
} as const;

const READY_PANEL = {
  background: '#0D4A42',
  badgeBg: 'rgba(0, 217, 160, 0.2)',
} as const;

type HomeActiveJourneyCardProps = {
  membership?: QueueMember | null;
  session?: ChargingSession | null;
  stationName?: string;
  stationSubtitle?: string | null;
  connectorLabel?: string | null;
  vehicleLabel?: string | null;
  chargingWithoutSession?: boolean;
  onPress?: () => void;
};

function JourneyStepIndicator({
  currentStepIndex,
  dark = false,
}: {
  currentStepIndex: number;
  dark?: boolean;
}) {
  return (
    <View style={styles.stepperRow}>
      {JOURNEY_STEPS.map((label, index) => {
        const isComplete = index < currentStepIndex;
        const isCurrent = index === currentStepIndex;
        const isUpcoming = index > currentStepIndex;
        const connectorActive = index > 0 && index <= currentStepIndex;

        return (
          <View key={label} style={styles.stepperSegment}>
            {index > 0 ? (
              <View
                style={[
                  styles.stepConnector,
                  dark && styles.stepConnectorDark,
                  connectorActive && styles.stepConnectorActive,
                  dark && connectorActive && styles.stepConnectorActiveDark,
                ]}
              />
            ) : null}
            <View style={styles.stepNode}>
              <View
                style={[
                  styles.stepCircle,
                  dark && styles.stepCircleDark,
                  isComplete && styles.stepCircleComplete,
                  isCurrent && styles.stepCircleCurrent,
                  isUpcoming && (dark ? styles.stepCircleUpcomingDark : styles.stepCircleUpcoming),
                ]}
              >
                {isComplete ? (
                  <Icon name="check" size={14} color={theme.colors.textInverse} />
                ) : (
                  <Text
                    style={[
                      styles.stepNumber,
                      isCurrent && styles.stepNumberCurrent,
                      isUpcoming && styles.stepNumberUpcoming,
                      dark && isUpcoming && styles.stepNumberUpcomingDark,
                      dark && isCurrent && styles.stepNumberCurrentDark,
                    ]}
                  >
                    {index + 1}
                  </Text>
                )}
              </View>
              <Text
                style={[
                  styles.stepLabel,
                  dark && styles.stepLabelDark,
                  (isComplete || isCurrent) && styles.stepLabelActive,
                  dark && (isComplete || isCurrent) && styles.stepLabelActiveDark,
                ]}
                numberOfLines={1}
              >
                {label}
              </Text>
            </View>
          </View>
        );
      })}
    </View>
  );
}

function JourneyCardFooter({
  actionLabel,
  dark = false,
}: {
  actionLabel: string;
  dark?: boolean;
}) {
  return (
    <View style={styles.footer}>
      <View style={[styles.footerDivider, dark && styles.footerDividerDark]} />
      <View style={styles.footerRow}>
        <Text style={[styles.footerAction, dark && styles.footerActionDark]}>{actionLabel}</Text>
        <View style={[styles.footerButton, dark && styles.footerButtonDark]}>
          <Icon
            name="chevron-forward"
            size={18}
            color={dark ? CHARGING_CARD.background : theme.colors.textInverse}
          />
        </View>
      </View>
    </View>
  );
}

function ActiveJourneyEyebrow({
  badgeLabel,
  dark = false,
  badgeVariant = 'available',
}: {
  badgeLabel: string;
  dark?: boolean;
  badgeVariant?: 'available' | 'neutral';
}) {
  return (
    <View style={styles.eyebrowRow}>
      <View style={styles.eyebrowLeft}>
        <View style={[styles.eyebrowDot, dark && styles.eyebrowDotDark]} />
        <Text style={[styles.eyebrowLabel, dark && styles.eyebrowLabelDark]}>
          Active journey
        </Text>
      </View>
      <Badge label={badgeLabel} variant={badgeVariant} showDot />
    </View>
  );
}

function QueuedMetricsPanel({ membership }: { membership: QueueMember }) {
  const position = formatQueuePositionPadded(membership);
  const headline = formatDriversAheadHeadline(membership);
  const subtext = formatDriversAheadSubtext(membership);
  const estTurn = formatEstimatedTurn(membership.estimatedTurnAt);

  if (!position && !headline && !estTurn) {
    return null;
  }

  return (
    <View style={styles.insetPanel}>
      {position ? (
        <>
          <View style={styles.insetColumn}>
            <Text style={styles.insetEyebrow}>Queue position</Text>
            <Text style={styles.insetValueLarge}>{position}</Text>
          </View>
          <View style={styles.insetDivider} />
        </>
      ) : null}
      {headline ? (
        <>
          <View style={[styles.insetColumn, styles.insetColumnFlex]}>
            <Text style={styles.insetHeadline}>{headline}</Text>
            {subtext ? <Text style={styles.insetSubtext}>{subtext}</Text> : null}
          </View>
          {estTurn ? <View style={styles.insetDivider} /> : null}
        </>
      ) : null}
      {estTurn ? (
        <View style={styles.insetColumn}>
          <Text style={styles.insetEyebrow}>Est. turn</Text>
          <Text style={styles.insetValue}>{estTurn}</Text>
        </View>
      ) : null}
    </View>
  );
}

function AtStationBody({ membership }: { membership: QueueMember }) {
  return (
    <>
      <View style={styles.messageRow}>
        <View style={styles.messageIconWrap}>
          <Icon name="map-pin" size={20} color={theme.colors.brandDark} />
        </View>
        <View style={styles.messageCopy}>
          <Text style={styles.messageEyebrow}>Arrival confirmed</Text>
          <Text style={styles.messageTitle}>{"You're checked in"}</Text>
          <Text style={styles.messageBody}>
            Stay nearby while the operator prepares your charger.
          </Text>
        </View>
      </View>

      <View style={styles.happeningPanel}>
        <View style={styles.happeningIconWrap}>
          <Icon name="charger" size={18} color={theme.colors.brandDark} />
        </View>
        <View style={styles.happeningCopy}>
          <Text style={styles.happeningEyebrow}>Happening now</Text>
          <Text style={styles.happeningTitle}>
            {membership.needsEvseReassignment
              ? 'Finding a compatible charger'
              : 'Charger preparation in progress'}
          </Text>
        </View>
      </View>
    </>
  );
}

function ReadyBody({ membership }: { membership: QueueMember }) {
  const bayNumber = formatReadyChargerBayNumber(membership.allocation);
  const connector = formatReadyConnectorBadge(membership.allocation);

  return (
    <>
      {bayNumber ? (
        <View style={styles.readyPanel}>
          <View style={styles.readyPanelLeft}>
            <Text style={styles.readyPanelEyebrow}>Charger</Text>
            <Text style={styles.readyPanelNumber}>{bayNumber}</Text>
          </View>
          <View style={styles.readyPanelCenter}>
            <Text style={styles.readyPanelStatusEyebrow}>Your charger is ready</Text>
            <Text style={styles.readyPanelStatusTitle}>Plug in to begin</Text>
            <Text style={styles.readyPanelHint}>
              {`Follow signs to bay ${bayNumber}`}
            </Text>
          </View>
          {connector ? (
            <View style={styles.readyConnectorBadge}>
              <Text style={styles.readyConnectorText}>{connector}</Text>
            </View>
          ) : null}
        </View>
      ) : null}

      <View style={styles.guidanceRow}>
        <Icon name="bolt" size={16} color={theme.colors.textMuted} />
        <Text style={styles.guidanceText}>
          Connect your vehicle, then follow the charger screen
        </Text>
      </View>
    </>
  );
}

function ChargingBody({
  session,
  connectorLabel,
  vehicleLabel,
}: {
  session: ChargingSession;
  connectorLabel?: string | null;
  vehicleLabel?: string | null;
}) {
  const powerRaw = formatPowerKw(session.averagePowerKw ?? session.maxPowerKw);
  const power = powerRaw !== EMPTY_METRIC ? powerRaw : null;
  const energyRaw = formatEnergyKwh(session.energyKwh);
  const energy = energyRaw !== EMPTY_METRIC ? energyRaw : null;
  const duration = formatHomeJourneyDuration(session.durationSeconds, session.startedAt);
  const connector =
    connectorLabel?.trim() ||
    session.connectorLabel?.trim() ||
    null;
  const vehicle =
    vehicleLabel?.trim() ||
    session.vehicleLabel?.trim() ||
    null;

  const metrics: { label: string; value: string }[] = [];
  if (energy) {
    metrics.push({ label: 'Energy delivered', value: energy });
  }
  if (duration) {
    metrics.push({ label: 'Session time', value: duration });
  }
  if (connector) {
    metrics.push({ label: 'Connector', value: connector });
  }

  return (
    <>
      <View style={styles.chargingHeroRow}>
        <View style={styles.chargingBoltWrap}>
          <Icon name="bolt" size={26} color={CHARGING_CARD.background} />
        </View>
        <View style={styles.chargingHeroCopy}>
          <Text style={styles.chargingHeroEyebrow}>Charging now</Text>
          {power ? <Text style={styles.chargingHeroPower}>{power}</Text> : null}
          {vehicle ? <Text style={styles.chargingHeroVehicle}>{vehicle}</Text> : null}
        </View>
      </View>

      {metrics.length > 0 ? (
        <View style={styles.chargingMetricsPanel}>
          {metrics.map((metric, index) => (
            <View key={metric.label} style={styles.chargingMetricWrap}>
              {index > 0 ? <View style={styles.chargingMetricDivider} /> : null}
              <View style={styles.chargingMetricColumn}>
                <Text style={styles.chargingMetricLabel}>{metric.label}</Text>
                <Text style={styles.chargingMetricValue}>{metric.value}</Text>
              </View>
            </View>
          ))}
        </View>
      ) : null}
    </>
  );
}

function SessionPendingBody() {
  return (
    <Text style={styles.pendingText}>
      Your charging session is being connected. This card will update when charging begins.
    </Text>
  );
}

export function HomeActiveJourneyCard({
  membership = null,
  session = null,
  stationName,
  stationSubtitle,
  connectorLabel,
  vehicleLabel,
  chargingWithoutSession = false,
  onPress,
}: HomeActiveJourneyCardProps) {
  const hasActiveSession = session?.status === 'CHARGING';
  const variant = resolveHomeJourneyVisualVariant(membership, {
    hasActiveSession,
    chargingWithoutSession,
  });
  const stepIndex = resolveHomeJourneyStepIndex(variant);
  const badgeLabel = homeJourneyStatusBadgeLabel(variant);
  const actionLabel = homeJourneyActionLabel(variant);
  const isDark = variant === 'charging';
  const badgeVariant =
    variant === 'ready' || variant === 'charging' || variant === 'session-pending'
      ? 'neutral'
      : 'available';

  let body: ReactNode = null;

  if (variant === 'queued' && membership) {
    body = <QueuedMetricsPanel membership={membership} />;
  } else if (variant === 'at-station' && membership) {
    body = <AtStationBody membership={membership} />;
  } else if (variant === 'ready' && membership) {
    body = <ReadyBody membership={membership} />;
  } else if (variant === 'charging' && session) {
    body = (
      <ChargingBody
        session={session}
        connectorLabel={connectorLabel}
        vehicleLabel={vehicleLabel}
      />
    );
  } else if (variant === 'session-pending') {
    body = <SessionPendingBody />;
  }

  const content = (
    <View
      style={[
        styles.card,
        isDark ? styles.cardDark : styles.cardLight,
      ]}
    >
      <View style={[styles.topAccent, isDark && styles.topAccentDark]} />

      <ActiveJourneyEyebrow
        badgeLabel={badgeLabel}
        dark={isDark}
        badgeVariant={badgeVariant}
      />

      {stationName ? (
        <Text style={[styles.stationName, isDark && styles.stationNameDark]}>
          {stationName}
        </Text>
      ) : null}
      {stationSubtitle ? (
        <Text style={[styles.stationSubtitle, isDark && styles.stationSubtitleDark]}>
          {stationSubtitle}
        </Text>
      ) : null}

      <JourneyStepIndicator currentStepIndex={stepIndex} dark={isDark} />

      {body}

      <JourneyCardFooter actionLabel={actionLabel} dark={isDark} />
    </View>
  );

  if (!onPress) {
    return content;
  }

  return (
    <Pressable
      onPress={onPress}
      accessibilityRole="button"
      accessibilityLabel={actionLabel}
      style={({ pressed }) => pressed && styles.pressed}
    >
      {content}
    </Pressable>
  );
}

/** @deprecated Use HomeActiveJourneyCard */
export function HomeActiveQueueCard(
  props: Omit<HomeActiveJourneyCardProps, 'session'> & {
    membership: QueueMember;
  },
) {
  return <HomeActiveJourneyCard {...props} session={null} />;
}

const styles = StyleSheet.create({
  card: {
    borderRadius: theme.radius.lg,
    borderWidth: 1,
    overflow: 'hidden',
    paddingHorizontal: theme.spacing.md,
    paddingBottom: theme.spacing.md,
    gap: theme.spacing.md,
  },
  cardLight: {
    backgroundColor: '#F2FCF8',
    borderColor: theme.colors.selectionBorder,
  },
  cardDark: {
    backgroundColor: CHARGING_CARD.background,
    borderColor: CHARGING_CARD.border,
  },
  topAccent: {
    height: 3,
    marginHorizontal: -theme.spacing.md,
    marginBottom: theme.spacing.xs,
    backgroundColor: theme.colors.brand,
  },
  topAccentDark: {
    backgroundColor: CHARGING_CARD.topAccent,
  },
  pressed: {
    opacity: 0.96,
  },
  eyebrowRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: theme.spacing.sm,
    paddingTop: theme.spacing.sm,
  },
  eyebrowLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  eyebrowDot: {
    width: 7,
    height: 7,
    borderRadius: 4,
    backgroundColor: theme.colors.brand,
  },
  eyebrowDotDark: {
    backgroundColor: theme.colors.brandLight,
  },
  eyebrowLabel: {
    fontSize: 11,
    fontWeight: '700',
    letterSpacing: 0.8,
    textTransform: 'uppercase',
    color: theme.colors.textMuted,
  },
  eyebrowLabelDark: {
    color: CHARGING_CARD.textMuted,
  },
  stationName: {
    fontSize: theme.typography.fontSize.lg,
    fontWeight: '700',
    color: theme.colors.textPrimary,
    lineHeight: 26,
  },
  stationNameDark: {
    color: CHARGING_CARD.textPrimary,
  },
  stationSubtitle: {
    fontSize: theme.typography.fontSize.sm,
    color: theme.colors.textMuted,
    marginTop: -4,
  },
  stationSubtitleDark: {
    color: CHARGING_CARD.textMuted,
  },
  stepperRow: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    paddingVertical: theme.spacing.xs,
  },
  stepperSegment: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'flex-start',
  },
  stepNode: {
    alignItems: 'center',
    minWidth: 52,
  },
  stepConnector: {
    flex: 1,
    height: 2,
    marginTop: 13,
    marginHorizontal: 2,
    backgroundColor: theme.colors.borderLight,
  },
  stepConnectorDark: {
    backgroundColor: 'rgba(255, 255, 255, 0.15)',
  },
  stepConnectorActive: {
    backgroundColor: theme.colors.brandMuted,
  },
  stepConnectorActiveDark: {
    backgroundColor: 'rgba(0, 217, 160, 0.45)',
  },
  stepCircle: {
    width: 28,
    height: 28,
    borderRadius: 14,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: theme.colors.iconBackground,
  },
  stepCircleDark: {
    backgroundColor: 'rgba(255, 255, 255, 0.12)',
  },
  stepCircleComplete: {
    backgroundColor: theme.colors.statusAvailable,
  },
  stepCircleCurrent: {
    backgroundColor: theme.colors.surface,
    borderWidth: 2,
    borderColor: theme.colors.brand,
  },
  stepCircleUpcoming: {
    backgroundColor: theme.colors.iconBackground,
  },
  stepCircleUpcomingDark: {
    backgroundColor: 'rgba(255, 255, 255, 0.1)',
  },
  stepNumber: {
    fontSize: 12,
    fontWeight: '700',
    color: theme.colors.textMuted,
  },
  stepNumberCurrent: {
    color: theme.colors.brandDark,
  },
  stepNumberCurrentDark: {
    color: theme.colors.brandLight,
  },
  stepNumberUpcoming: {
    color: theme.colors.textMuted,
  },
  stepNumberUpcomingDark: {
    color: CHARGING_CARD.textMuted,
  },
  stepLabel: {
    marginTop: 6,
    fontSize: 10,
    fontWeight: '500',
    color: theme.colors.textMuted,
    textAlign: 'center',
  },
  stepLabelDark: {
    color: CHARGING_CARD.textMuted,
  },
  stepLabelActive: {
    fontWeight: '700',
    color: theme.colors.brandDark,
  },
  stepLabelActiveDark: {
    color: theme.colors.brandLight,
  },
  insetPanel: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: theme.colors.iconBackground,
    borderRadius: theme.radius.lg,
    paddingVertical: theme.spacing.md,
    paddingHorizontal: theme.spacing.sm,
  },
  insetColumn: {
    alignItems: 'center',
    paddingHorizontal: theme.spacing.xs,
    minWidth: 72,
  },
  insetColumnFlex: {
    flex: 1,
    alignItems: 'flex-start',
    paddingHorizontal: theme.spacing.sm,
  },
  insetDivider: {
    width: StyleSheet.hairlineWidth,
    alignSelf: 'stretch',
    backgroundColor: theme.colors.border,
    marginVertical: 4,
  },
  insetEyebrow: {
    fontSize: 10,
    fontWeight: '600',
    letterSpacing: 0.6,
    textTransform: 'uppercase',
    color: theme.colors.textMuted,
    marginBottom: 4,
  },
  insetValueLarge: {
    fontSize: 28,
    fontWeight: '700',
    color: theme.colors.statusAvailable,
  },
  insetValue: {
    fontSize: theme.typography.fontSize.md,
    fontWeight: '700',
    color: theme.colors.textPrimary,
  },
  insetHeadline: {
    fontSize: theme.typography.fontSize.sm,
    fontWeight: '700',
    color: theme.colors.textPrimary,
  },
  insetSubtext: {
    fontSize: theme.typography.fontSize.xs,
    color: theme.colors.textMuted,
    marginTop: 2,
  },
  messageRow: {
    flexDirection: 'row',
    gap: theme.spacing.sm,
    alignItems: 'flex-start',
  },
  messageIconWrap: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: theme.colors.brandMuted,
    alignItems: 'center',
    justifyContent: 'center',
  },
  messageCopy: {
    flex: 1,
    gap: 2,
  },
  messageEyebrow: {
    fontSize: 10,
    fontWeight: '600',
    letterSpacing: 0.6,
    textTransform: 'uppercase',
    color: theme.colors.textMuted,
  },
  messageTitle: {
    fontSize: theme.typography.fontSize.md,
    fontWeight: '700',
    color: theme.colors.textPrimary,
  },
  messageBody: {
    fontSize: theme.typography.fontSize.sm,
    color: theme.colors.textMuted,
    lineHeight: 20,
    marginTop: 2,
  },
  happeningPanel: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: theme.spacing.sm,
    backgroundColor: theme.colors.iconBackground,
    borderRadius: theme.radius.lg,
    padding: theme.spacing.md,
  },
  happeningIconWrap: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: theme.colors.surface,
    alignItems: 'center',
    justifyContent: 'center',
  },
  happeningCopy: {
    flex: 1,
    gap: 2,
  },
  happeningEyebrow: {
    fontSize: 10,
    fontWeight: '600',
    letterSpacing: 0.6,
    textTransform: 'uppercase',
    color: theme.colors.textMuted,
  },
  happeningTitle: {
    fontSize: theme.typography.fontSize.sm,
    fontWeight: '600',
    color: theme.colors.textPrimary,
  },
  readyPanel: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: theme.spacing.sm,
    backgroundColor: READY_PANEL.background,
    borderRadius: theme.radius.lg,
    padding: theme.spacing.md,
  },
  readyPanelLeft: {
    alignItems: 'center',
    minWidth: 56,
  },
  readyPanelEyebrow: {
    fontSize: 10,
    fontWeight: '600',
    letterSpacing: 0.6,
    textTransform: 'uppercase',
    color: CHARGING_CARD.textMuted,
  },
  readyPanelNumber: {
    fontSize: 32,
    fontWeight: '700',
    color: CHARGING_CARD.textPrimary,
    lineHeight: 36,
  },
  readyPanelCenter: {
    flex: 1,
    gap: 2,
  },
  readyPanelStatusEyebrow: {
    fontSize: 10,
    fontWeight: '600',
    letterSpacing: 0.5,
    textTransform: 'uppercase',
    color: CHARGING_CARD.textMuted,
  },
  readyPanelStatusTitle: {
    fontSize: theme.typography.fontSize.md,
    fontWeight: '700',
    color: CHARGING_CARD.textPrimary,
  },
  readyPanelHint: {
    fontSize: theme.typography.fontSize.xs,
    color: CHARGING_CARD.textMuted,
    marginTop: 2,
  },
  readyConnectorBadge: {
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: theme.radius.pill,
    backgroundColor: READY_PANEL.badgeBg,
  },
  readyConnectorText: {
    fontSize: 11,
    fontWeight: '700',
    color: theme.colors.brandLight,
  },
  guidanceRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: theme.spacing.sm,
    paddingHorizontal: theme.spacing.xs,
  },
  guidanceText: {
    flex: 1,
    fontSize: theme.typography.fontSize.sm,
    color: theme.colors.textMuted,
    lineHeight: 20,
  },
  chargingHeroRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: theme.spacing.md,
  },
  chargingBoltWrap: {
    width: 56,
    height: 56,
    borderRadius: 28,
    backgroundColor: theme.colors.brand,
    alignItems: 'center',
    justifyContent: 'center',
  },
  chargingHeroCopy: {
    flex: 1,
    gap: 2,
  },
  chargingHeroEyebrow: {
    fontSize: 10,
    fontWeight: '600',
    letterSpacing: 0.6,
    textTransform: 'uppercase',
    color: CHARGING_CARD.textMuted,
  },
  chargingHeroPower: {
    fontSize: 32,
    fontWeight: '700',
    color: CHARGING_CARD.textPrimary,
    lineHeight: 36,
  },
  chargingHeroVehicle: {
    fontSize: theme.typography.fontSize.sm,
    fontWeight: '600',
    color: CHARGING_CARD.textMuted,
  },
  chargingMetricsPanel: {
    flexDirection: 'row',
    backgroundColor: CHARGING_CARD.panelBg,
    borderRadius: theme.radius.lg,
    borderWidth: 1,
    borderColor: CHARGING_CARD.panelBorder,
    paddingVertical: theme.spacing.md,
  },
  chargingMetricWrap: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'stretch',
  },
  chargingMetricDivider: {
    width: StyleSheet.hairlineWidth,
    backgroundColor: CHARGING_CARD.panelBorder,
    marginVertical: 4,
  },
  chargingMetricColumn: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    gap: 4,
    paddingHorizontal: theme.spacing.xs,
  },
  chargingMetricLabel: {
    fontSize: theme.typography.fontSize.xs,
    color: CHARGING_CARD.textMuted,
    textAlign: 'center',
  },
  chargingMetricValue: {
    fontSize: theme.typography.fontSize.sm,
    fontWeight: '700',
    color: CHARGING_CARD.textPrimary,
    textAlign: 'center',
  },
  pendingText: {
    fontSize: theme.typography.fontSize.sm,
    lineHeight: 20,
    color: theme.colors.textMuted,
  },
  footer: {
    gap: theme.spacing.sm,
    marginTop: theme.spacing.xs,
  },
  footerDivider: {
    height: StyleSheet.hairlineWidth,
    backgroundColor: theme.colors.borderLight,
  },
  footerDividerDark: {
    backgroundColor: CHARGING_CARD.panelBorder,
  },
  footerRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: theme.spacing.sm,
  },
  footerAction: {
    flex: 1,
    fontSize: theme.typography.fontSize.sm,
    fontWeight: '700',
    color: theme.colors.brandDark,
  },
  footerActionDark: {
    color: theme.colors.brandLight,
  },
  footerButton: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: theme.colors.brand,
    alignItems: 'center',
    justifyContent: 'center',
  },
  footerButtonDark: {
    backgroundColor: theme.colors.brandLight,
  },
});
