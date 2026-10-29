import type { ReactNode } from 'react';
import { Fragment, useMemo } from 'react';
import { ActivityIndicator, Pressable, StyleSheet, Text, View } from 'react-native';

import { Icon } from '@/components/ui/icon';
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
  formatDriversAheadHeadline,
  formatDriversAheadSubtext,
  formatEstimatedWaitRelative,
  formatQueuePositionPadded,
  formatQueuedCenterEyebrow,
  formatReadyChargerBayNumber,
  formatReadyConnectorBadge,
  getAtStationPreparationHeadline,
  homeJourneyActionLabel,
  homeJourneyStatusBadgeLabel,
  resolveHomeJourneyStepIndex,
  resolveHomeJourneyVisualVariant,
  type HomeJourneyVisualVariant,
} from '@/utils/queue-display';

const JOURNEY_STEPS = ['Queue', 'Arrived', 'Ready', 'Charging'] as const;
const STEP_COUNT = JOURNEY_STEPS.length;
const STEP_SIZE = 26;
const STEP_RADIUS = STEP_SIZE / 2;

/** Distinctive charging surface — not reused for queue states. */
const CHARGING_SURFACE = {
  background: '#0A2F2A',
  border: 'rgba(0, 217, 160, 0.32)',
  textPrimary: '#FFFFFF',
  textMuted: 'rgba(255, 255, 255, 0.68)',
  panelBg: 'rgba(0, 0, 0, 0.22)',
  panelBorder: 'rgba(255, 255, 255, 0.12)',
} as const;

/** Dark-theme queue journey card (Queued / Arrived / Ready). */
const DARK_JOURNEY_SURFACE = {
  background: '#121E1D',
  border: 'rgba(0, 217, 160, 0.22)',
  textPrimary: '#F4FFFB',
  textMuted: 'rgba(244, 255, 251, 0.62)',
  panelBg: 'rgba(0, 0, 0, 0.28)',
  panelBorder: 'rgba(255, 255, 255, 0.1)',
} as const;

type SurfaceMode = 'light' | 'dark-journey' | 'charging';

type HomeActiveJourneyCardProps = {
  membership?: QueueMember | null;
  session?: ChargingSession | null;
  stationName?: string;
  stationSubtitle?: string | null;
  connectorLabel?: string | null;
  vehicleLabel?: string | null;
  chargingWithoutSession?: boolean;
  isRefreshing?: boolean;
  onPress?: () => void;
};

function resolveSurfaceMode(
  variant: HomeJourneyVisualVariant,
  isThemeDark: boolean,
): SurfaceMode {
  if (variant === 'charging') {
    return 'charging';
  }
  return isThemeDark ? 'dark-journey' : 'light';
}

function JourneyStepIndicator({
  currentStepIndex,
  surface,
  styles,
  activeLabelColor,
}: {
  currentStepIndex: number;
  surface: SurfaceMode;
  styles: ReturnType<typeof createStyles>;
  activeLabelColor: string;
}) {
  const isDark = surface !== 'light';

  return (
    <View style={styles.stepperRow}>
      {JOURNEY_STEPS.map((label, index) => {
        const isComplete = index < currentStepIndex;
        const isCurrent = index === currentStepIndex;
        const isActive = isComplete || isCurrent;
        const leftActive = index > 0 && index <= currentStepIndex;
        const rightActive = index < currentStepIndex;

        return (
          <View key={label} style={styles.stepSlot}>
            {index > 0 ? (
              <View style={styles.stepRailLeftTrack}>
                <View
                  style={[
                    styles.stepRailFill,
                    isDark && styles.stepRailFillDark,
                    leftActive && styles.stepRailFillActive,
                  ]}
                />
              </View>
            ) : null}
            {index < STEP_COUNT - 1 ? (
              <View style={styles.stepRailRightTrack}>
                <View
                  style={[
                    styles.stepRailFill,
                    isDark && styles.stepRailFillDark,
                    rightActive && styles.stepRailFillActive,
                  ]}
                />
              </View>
            ) : null}

            <View
              style={[
                styles.stepCircle,
                isActive && styles.stepCircleFilled,
                !isActive && (isDark ? styles.stepCircleUpcomingDark : styles.stepCircleUpcoming),
              ]}
            >
              {isComplete ? (
                <Icon
                  name="check"
                  size={12}
                  color={surface === 'charging' ? CHARGING_SURFACE.background : '#FFFFFF'}
                />
              ) : (
                <Text
                  style={[
                    styles.stepNumber,
                    isCurrent && styles.stepNumberOnBrand,
                    !isActive && styles.stepNumberUpcoming,
                    isDark && !isActive && styles.stepNumberUpcomingDark,
                  ]}
                >
                  {index + 1}
                </Text>
              )}
            </View>

            <Text
              style={[
                styles.stepLabel,
                isDark && styles.stepLabelDark,
                isActive && { color: activeLabelColor, fontWeight: '700' },
              ]}
              numberOfLines={1}
            >
              {label}
            </Text>
          </View>
        );
      })}
    </View>
  );
}

function StatusBadge({
  label,
  surface,
  filled,
  styles,
}: {
  label: string;
  surface: SurfaceMode;
  filled?: boolean;
  styles: ReturnType<typeof createStyles>;
}) {
  const isDark = surface !== 'light';

  return (
    <View
      style={[
        styles.statusBadge,
        filled && styles.statusBadgeFilled,
        isDark && !filled && styles.statusBadgeDarkSoft,
        isDark && filled && styles.statusBadgeDarkFilled,
      ]}
    >
      <Text
        style={[
          styles.statusBadgeText,
          filled && styles.statusBadgeTextFilled,
          isDark && !filled && styles.statusBadgeTextDarkSoft,
          isDark && filled && styles.statusBadgeTextDarkFilled,
        ]}
      >
        {label}
      </Text>
    </View>
  );
}

function JourneyCardFooter({
  actionLabel,
  surface,
  styles,
}: {
  actionLabel: string;
  surface: SurfaceMode;
  styles: ReturnType<typeof createStyles>;
}) {
  const isDark = surface !== 'light';
  const arrowColor =
    surface === 'charging'
      ? CHARGING_SURFACE.background
      : surface === 'dark-journey'
        ? DARK_JOURNEY_SURFACE.background
        : '#FFFFFF';

  return (
    <View style={styles.footer}>
      <Text style={[styles.footerAction, isDark && styles.footerActionDark]}>{actionLabel}</Text>
      <View style={styles.footerButton}>
        <Icon name="chevron-forward" size={18} color={arrowColor} />
      </View>
    </View>
  );
}

function StationHeaderBlock({
  stationName,
  stationSubtitle,
  stationIdentifier,
  surface,
  styles,
  mutedIconColor,
}: {
  stationName?: string;
  stationSubtitle?: string | null;
  stationIdentifier?: string | null;
  surface: SurfaceMode;
  styles: ReturnType<typeof createStyles>;
  mutedIconColor: string;
}) {
  if (!stationName && !stationIdentifier && !stationSubtitle) {
    return null;
  }

  const isDark = surface !== 'light';

  return (
    <View style={styles.stationBlock}>
      {(stationName || stationIdentifier) && (
        <View style={styles.stationTitleRow}>
          {stationName ? (
            <Text
              style={[styles.stationName, isDark && styles.stationNameDark]}
              numberOfLines={2}
            >
              {stationName}
            </Text>
          ) : (
            <View style={styles.stationNameSpacer} />
          )}
          {stationIdentifier ? (
            <Text
              style={[styles.stationIdentifier, isDark && styles.stationIdentifierDark]}
              numberOfLines={2}
            >
              {stationIdentifier}
            </Text>
          ) : null}
        </View>
      )}

      {stationSubtitle ? (
        <View
          style={[
            styles.subtitleRow,
            stationIdentifier ? styles.subtitleRowWithIdentifier : null,
          ]}
        >
          <Icon name="map-pin" size={14} color={mutedIconColor} />
          <Text
            style={[styles.stationSubtitle, isDark && styles.stationSubtitleDark]}
            numberOfLines={1}
          >
            {stationSubtitle}
          </Text>
        </View>
      ) : null}
    </View>
  );
}

function QueuedMetricsPanel({
  membership,
  styles,
}: {
  membership: QueueMember;
  styles: ReturnType<typeof createStyles>;
}) {
  const position = formatQueuePositionPadded(membership);
  const headline = formatDriversAheadHeadline(membership);
  const subtext = formatDriversAheadSubtext(membership);
  const estWait = formatEstimatedWaitRelative(membership.estimatedTurnAt);

  if (!position && !headline && !estWait) {
    return null;
  }

  return (
    <View style={styles.queuedPanel}>
      {position ? (
        <>
          <View style={styles.queuedSideColumn}>
            <Text style={styles.queuedSideEyebrow}>Position</Text>
            <Text style={styles.queuedPositionValue}>{position}</Text>
          </View>
          <View style={styles.queuedDivider} />
        </>
      ) : null}
      {headline ? (
        <>
          <View style={styles.queuedCenterColumn}>
            <Text style={styles.queuedCenterEyebrow}>{formatQueuedCenterEyebrow()}</Text>
            <Text style={styles.queuedHeadline}>{headline}</Text>
            {subtext ? <Text style={styles.queuedSubtext}>{subtext}</Text> : null}
          </View>
          {estWait ? <View style={styles.queuedDivider} /> : null}
        </>
      ) : null}
      {estWait ? (
        <View style={styles.queuedSideColumn}>
          <Text style={styles.queuedSideEyebrow}>Est. wait</Text>
          <Text style={styles.queuedWaitValue}>{estWait}</Text>
        </View>
      ) : null}
    </View>
  );
}

function AtStationBody({
  membership,
  styles,
  brand,
}: {
  membership: QueueMember;
  styles: ReturnType<typeof createStyles>;
  brand: string;
}) {
  const showPrep = membership.needsEvseReassignment === true;

  return (
    <>
      <View style={styles.infoPanel}>
        <View style={styles.infoIconWrap}>
          <Icon name="map-pin" size={22} color={brand} />
        </View>
        <View style={styles.infoCopy}>
          <Text style={styles.infoEyebrow}>Arrival confirmed</Text>
          <Text style={styles.infoTitle}>{"You're checked in"}</Text>
          <Text style={styles.infoBody}>
            Park in the waiting area while the operator prepares your charger.
          </Text>
        </View>
      </View>

      {showPrep ? (
        <View style={styles.prepPanel}>
          <View style={styles.prepIconWrap}>
            <Icon name="charger" size={18} color={brand} />
          </View>
          <View style={styles.infoCopy}>
            <Text style={styles.infoEyebrow}>Happening now</Text>
            <Text style={styles.prepTitle}>{getAtStationPreparationHeadline(membership)}</Text>
          </View>
        </View>
      ) : null}
    </>
  );
}

function ReadyBody({
  membership,
  styles,
  brand,
}: {
  membership: QueueMember;
  styles: ReturnType<typeof createStyles>;
  brand: string;
}) {
  const bayNumber = formatReadyChargerBayNumber(membership.allocation);
  const connector = formatReadyConnectorBadge(membership.allocation);

  const eyebrow = bayNumber ? `Charger ${bayNumber} is ready` : 'Charger is ready';
  const instruction = bayNumber
    ? connector
      ? `Go to Bay ${bayNumber} and connect your vehicle using the ${connector} cable.`
      : `Go to Bay ${bayNumber} and connect your vehicle.`
    : connector
      ? `Connect your vehicle using the ${connector} cable.`
      : 'Connect your vehicle, then follow the charger screen.';

  return (
    <View style={styles.readyPanel}>
      <View style={styles.readyIconWrap}>
        <Icon name="plug" size={22} color={brand} />
      </View>

      <View style={styles.readyCopy}>
        <Text style={styles.infoEyebrow}>{eyebrow}</Text>
        <Text style={styles.infoTitle}>Plug in to begin</Text>
        <Text style={styles.infoBody}>{instruction}</Text>
      </View>

      {connector ? (
        <View style={styles.connectorBadge}>
          <Text style={styles.connectorBadgeText}>{connector}</Text>
        </View>
      ) : null}
    </View>
  );
}

function ChargingBody({
  session,
  membership,
  connectorLabel,
  vehicleLabel,
  styles,
}: {
  session: ChargingSession;
  membership?: QueueMember | null;
  connectorLabel?: string | null;
  vehicleLabel?: string | null;
  styles: ReturnType<typeof createStyles>;
}) {
  const powerRaw = formatPowerKw(session.averagePowerKw ?? session.maxPowerKw);
  const power = powerRaw !== EMPTY_METRIC ? powerRaw : null;
  const energy =
    session.energyKwh != null && !Number.isNaN(session.energyKwh)
      ? `${session.energyKwh.toFixed(1)} kWh`
      : null;
  const duration = formatHomeJourneyDuration(session.durationSeconds, session.startedAt);
  const connectorRaw = formatHomeJourneyConnectorLabel(
    connectorLabel,
    session.connectorLabel,
    formatReadyConnectorBadge(membership?.allocation),
  );
  const connector = connectorRaw !== EMPTY_METRIC && connectorRaw !== '—' ? connectorRaw : null;
  const vehicle = vehicleLabel?.trim() || session.vehicleLabel?.trim() || null;
  const charger =
    session.evseLabel?.trim() ||
    formatReadyChargerBayNumber(membership?.allocation) ||
    null;
  const chargerLine = charger
    ? /^charger\b/i.test(charger)
      ? charger
      : `Charger ${charger}`
    : null;
  const metaLine = [vehicle, chargerLine].filter(Boolean).join(' · ') || null;

  const metrics: { label: string; value: string }[] = [];
  if (energy) {
    metrics.push({ label: 'Energy', value: energy });
  }
  if (duration) {
    metrics.push({ label: 'Session', value: duration });
  }
  if (connector) {
    metrics.push({ label: 'Connector', value: connector });
  }

  return (
    <>
      <View style={styles.chargingHeroRow}>
        <View style={styles.chargingBoltWrap}>
          <Icon name="bolt" size={26} color={CHARGING_SURFACE.background} />
        </View>
        <View style={styles.chargingHeroCopy}>
          <Text style={styles.chargingHeroEyebrow}>Charging now</Text>
          {power ? (
            <Text style={styles.chargingHeroPower} numberOfLines={1}>
              {power}
            </Text>
          ) : null}
          {metaLine ? (
            <Text style={styles.chargingHeroVehicle} numberOfLines={1}>
              {metaLine}
            </Text>
          ) : null}
        </View>
      </View>

      {metrics.length > 0 ? (
        <View style={styles.chargingMetricsPanel}>
          {metrics.map((metric, index) => (
            <Fragment key={metric.label}>
              {index > 0 ? <View style={styles.chargingMetricDivider} /> : null}
              <View style={styles.chargingMetricColumn}>
                <Text style={styles.chargingMetricLabel} numberOfLines={1}>
                  {metric.label}
                </Text>
                <Text style={styles.chargingMetricValue} numberOfLines={1}>
                  {metric.value}
                </Text>
              </View>
            </Fragment>
          ))}
        </View>
      ) : null}
    </>
  );
}

function SessionPendingBody({
  membership,
  styles,
  brand,
}: {
  membership?: QueueMember | null;
  styles: ReturnType<typeof createStyles>;
  brand: string;
}) {
  const bayNumber = membership ? formatReadyChargerBayNumber(membership.allocation) : null;
  const connector = membership ? formatReadyConnectorBadge(membership.allocation) : null;

  return (
    <View style={styles.infoPanel}>
      <View style={styles.infoIconWrap}>
        <Icon name="bolt" size={22} color={brand} />
      </View>
      <View style={styles.infoCopy}>
        <Text style={styles.infoEyebrow}>Connecting session</Text>
        <Text style={styles.infoTitle}>Linking your charger</Text>
        <Text style={styles.infoBody}>
          Live stats appear here once the session is active.
          {bayNumber ? ` Bay ${bayNumber}.` : ''}
          {connector ? ` ${connector}.` : ''}
        </Text>
      </View>
    </View>
  );
}

function resolveStationIdentifier(
  session: ChargingSession | null,
  membership: QueueMember | null,
): string | null {
  const fromSession = session?.evseLabel?.trim();
  if (fromSession) {
    return fromSession;
  }

  return formatReadyChargerBayNumber(membership?.allocation);
}

export function HomeActiveJourneyCard({
  membership = null,
  session = null,
  stationName,
  stationSubtitle,
  connectorLabel,
  vehicleLabel,
  chargingWithoutSession = false,
  isRefreshing = false,
  onPress,
}: HomeActiveJourneyCardProps) {
  const { theme, isDark: isThemeDark } = useTheme();
  const styles = useMemo(() => createStyles(theme), [theme]);

  const hasActiveSession = session?.status === 'CHARGING';
  const variant = resolveHomeJourneyVisualVariant(membership, {
    hasActiveSession,
    chargingWithoutSession,
  });
  const stepIndex = resolveHomeJourneyStepIndex(variant);
  const badgeLabel = homeJourneyStatusBadgeLabel(variant);
  const actionLabel = homeJourneyActionLabel(variant);
  const surface = resolveSurfaceMode(variant, isThemeDark);
  const isDarkSurface = surface !== 'light';
  const stationIdentifier = resolveStationIdentifier(session, membership);
  const brand = theme.colors.brand;
  const activeLabelColor = isDarkSurface ? theme.colors.brandLight : theme.colors.brandDark;
  const mutedIconColor = isDarkSurface
    ? surface === 'charging'
      ? CHARGING_SURFACE.textMuted
      : DARK_JOURNEY_SURFACE.textMuted
    : '#64748B';
  const filledBadge = variant === 'queued' || variant === 'charging';

  let body: ReactNode = null;

  if (variant === 'queued' && membership) {
    body = <QueuedMetricsPanel membership={membership} styles={styles} />;
  } else if (variant === 'at-station' && membership) {
    body = <AtStationBody membership={membership} styles={styles} brand={brand} />;
  } else if (variant === 'ready' && membership) {
    body = <ReadyBody membership={membership} styles={styles} brand={brand} />;
  } else if (variant === 'charging' && session) {
    body = (
      <ChargingBody
        session={session}
        membership={membership}
        connectorLabel={connectorLabel}
        vehicleLabel={vehicleLabel}
        styles={styles}
      />
    );
  } else if (variant === 'session-pending') {
    body = <SessionPendingBody membership={membership} styles={styles} brand={brand} />;
  }

  const content = (
    <View
      style={[
        styles.card,
        surface === 'light' && styles.cardLight,
        surface === 'dark-journey' && styles.cardDarkJourney,
        surface === 'charging' && styles.cardCharging,
        isRefreshing && styles.cardRefreshing,
      ]}
    >
      {surface === 'light' ? (
        <>
          <View style={styles.topWash} pointerEvents="none" />
          <View style={styles.topAccentLight} />
        </>
      ) : (
        <View style={styles.topAccentDark} />
      )}

      {isRefreshing ? (
        <View
          style={[styles.refreshOverlay, isDarkSurface && styles.refreshOverlayDark]}
          accessibilityLiveRegion="polite"
          accessibilityLabel="Updating journey"
        >
          <ActivityIndicator color={isDarkSurface ? theme.colors.brandLight : theme.colors.brand} />
        </View>
      ) : null}

      <View style={styles.eyebrowRow}>
        <View style={styles.eyebrowLeft}>
          <View style={[styles.eyebrowDot, isDarkSurface && styles.eyebrowDotDark]} />
          <Text style={[styles.eyebrowLabel, isDarkSurface && styles.eyebrowLabelDark]}>
            Active journey
          </Text>
        </View>
        <StatusBadge
          label={badgeLabel}
          surface={surface}
          filled={filledBadge}
          styles={styles}
        />
      </View>

      <StationHeaderBlock
        stationName={stationName}
        stationSubtitle={stationSubtitle}
        stationIdentifier={stationIdentifier}
        surface={surface}
        styles={styles}
        mutedIconColor={mutedIconColor}
      />

      <JourneyStepIndicator
        currentStepIndex={stepIndex}
        surface={surface}
        styles={styles}
        activeLabelColor={activeLabelColor}
      />

      {body}

      <JourneyCardFooter actionLabel={actionLabel} surface={surface} styles={styles} />
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

function createStyles(theme: AppTheme) {
  const isDark = theme.isDark;
  const panelBg = isDark ? DARK_JOURNEY_SURFACE.panelBg : '#EEF7F4';
  const panelBorder = isDark ? DARK_JOURNEY_SURFACE.panelBorder : 'rgba(0, 217, 160, 0.14)';
  const darkText = isDark ? DARK_JOURNEY_SURFACE.textPrimary : theme.colors.textPrimary;
  const mutedText = isDark ? DARK_JOURNEY_SURFACE.textMuted : '#64748B';

  return StyleSheet.create({
    card: {
      borderRadius: 26,
      borderWidth: 1,
      overflow: 'hidden',
      paddingHorizontal: 18,
      paddingTop: 0,
      paddingBottom: 16,
      gap: 16,
      shadowColor: '#0F172A',
      shadowOffset: { width: 0, height: 10 },
      shadowOpacity: 0.06,
      shadowRadius: 18,
      elevation: 3,
    },
    cardLight: {
      backgroundColor: '#FFFFFF',
      borderColor: '#E5EEEA',
    },
    cardDarkJourney: {
      backgroundColor: DARK_JOURNEY_SURFACE.background,
      borderColor: DARK_JOURNEY_SURFACE.border,
    },
    cardCharging: {
      backgroundColor: CHARGING_SURFACE.background,
      borderColor: CHARGING_SURFACE.border,
    },
    cardRefreshing: {
      opacity: 0.9,
    },
    topWash: {
      position: 'absolute',
      top: 0,
      left: 0,
      right: 0,
      height: 72,
      backgroundColor: 'rgba(0, 217, 160, 0.07)',
    },
    topAccentLight: {
      height: 2.5,
      marginHorizontal: -18,
      backgroundColor: theme.colors.brand,
      opacity: 0.85,
    },
    topAccentDark: {
      height: 2.5,
      marginHorizontal: -18,
      backgroundColor: theme.colors.brand,
    },
    refreshOverlay: {
      ...StyleSheet.absoluteFill,
      alignItems: 'center',
      justifyContent: 'center',
      backgroundColor: 'rgba(255, 255, 255, 0.45)',
      zIndex: 2,
    },
    refreshOverlayDark: {
      backgroundColor: 'rgba(10, 47, 42, 0.5)',
    },
    pressed: {
      opacity: 0.97,
    },
    eyebrowRow: {
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'space-between',
      gap: 10,
      paddingTop: 14,
    },
    eyebrowLeft: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: 7,
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
      fontFamily: theme.typography.fontFamily.semibold,
      fontSize: 11,
      fontWeight: '600',
      letterSpacing: 1,
      textTransform: 'uppercase',
      color: '#64748B',
    },
    eyebrowLabelDark: {
      color: 'rgba(244, 255, 251, 0.72)',
    },
    statusBadge: {
      paddingHorizontal: 12,
      paddingVertical: 5,
      borderRadius: theme.radius.pill,
      backgroundColor: 'rgba(0, 217, 160, 0.14)',
    },
    statusBadgeFilled: {
      backgroundColor: theme.colors.brand,
    },
    statusBadgeDarkSoft: {
      backgroundColor: 'rgba(0, 217, 160, 0.16)',
    },
    statusBadgeDarkFilled: {
      backgroundColor: theme.colors.brand,
    },
    statusBadgeText: {
      fontFamily: theme.typography.fontFamily.semibold,
      fontSize: 12,
      fontWeight: '600',
      color: theme.colors.brandDark,
    },
    statusBadgeTextFilled: {
      color: '#FFFFFF',
    },
    statusBadgeTextDarkSoft: {
      color: theme.colors.brandLight,
    },
    statusBadgeTextDarkFilled: {
      color: DARK_JOURNEY_SURFACE.background,
    },
    stationBlock: {
      gap: 6,
    },
    stationTitleRow: {
      flexDirection: 'row',
      alignItems: 'flex-start',
      gap: 12,
    },
    stationName: {
      flex: 1,
      fontFamily: theme.typography.fontFamily.bold,
      fontSize: 19,
      fontWeight: '700',
      color: theme.colors.textPrimary,
      lineHeight: 25,
      letterSpacing: -0.25,
    },
    stationNameDark: {
      color: '#F4FFFB',
    },
    stationNameSpacer: {
      flex: 1,
    },
    stationIdentifier: {
      fontFamily: theme.typography.fontFamily.bold,
      fontSize: 15,
      fontWeight: '700',
      color: '#94A3B8',
      marginTop: 2,
      maxWidth: 78,
      textAlign: 'right',
      lineHeight: 20,
    },
    stationIdentifierDark: {
      color: 'rgba(244, 255, 251, 0.42)',
    },
    subtitleRow: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: 5,
      marginTop: 1,
    },
    subtitleRowWithIdentifier: {
      paddingRight: 78,
    },
    stationSubtitle: {
      flexShrink: 1,
      fontFamily: theme.typography.fontFamily.medium,
      fontSize: 13,
      fontWeight: '500',
      color: '#64748B',
      lineHeight: 18,
    },
    stationSubtitleDark: {
      color: 'rgba(244, 255, 251, 0.62)',
    },
    stepperRow: {
      flexDirection: 'row',
      alignItems: 'flex-start',
      paddingTop: 2,
      paddingBottom: 2,
    },
    stepSlot: {
      flex: 1,
      alignItems: 'center',
      position: 'relative',
    },
    stepRailLeftTrack: {
      position: 'absolute',
      left: 0,
      right: '50%',
      top: STEP_RADIUS - 1,
      height: 2,
      paddingRight: STEP_RADIUS + 2,
      justifyContent: 'center',
    },
    stepRailRightTrack: {
      position: 'absolute',
      left: '50%',
      right: 0,
      top: STEP_RADIUS - 1,
      height: 2,
      paddingLeft: STEP_RADIUS + 2,
      justifyContent: 'center',
    },
    stepRailFill: {
      flex: 1,
      height: 2,
      borderRadius: 1,
      backgroundColor: '#DCE5E1',
    },
    stepRailFillDark: {
      backgroundColor: 'rgba(255, 255, 255, 0.12)',
    },
    stepRailFillActive: {
      backgroundColor: theme.colors.brand,
    },
    stepCircle: {
      width: STEP_SIZE,
      height: STEP_SIZE,
      borderRadius: STEP_RADIUS,
      alignItems: 'center',
      justifyContent: 'center',
      zIndex: 1,
      backgroundColor: theme.colors.brand,
    },
    stepCircleFilled: {
      backgroundColor: theme.colors.brand,
    },
    stepCircleUpcoming: {
      backgroundColor: '#FFFFFF',
      borderWidth: 1.5,
      borderColor: '#D5DEE7',
    },
    stepCircleUpcomingDark: {
      backgroundColor: 'rgba(255, 255, 255, 0.05)',
      borderWidth: 1.5,
      borderColor: 'rgba(255, 255, 255, 0.16)',
    },
    stepNumber: {
      fontFamily: theme.typography.fontFamily.bold,
      fontSize: 12,
      fontWeight: '700',
      color: '#94A3B8',
    },
    stepNumberOnBrand: {
      color: '#FFFFFF',
    },
    stepNumberUpcoming: {
      color: '#94A3B8',
    },
    stepNumberUpcomingDark: {
      color: 'rgba(244, 255, 251, 0.45)',
    },
    stepLabel: {
      marginTop: 8,
      fontFamily: theme.typography.fontFamily.medium,
      fontSize: 11,
      fontWeight: '500',
      color: '#94A3B8',
      textAlign: 'center',
    },
    stepLabelDark: {
      color: 'rgba(244, 255, 251, 0.45)',
    },
    queuedPanel: {
      flexDirection: 'row',
      alignItems: 'center',
      backgroundColor: panelBg,
      borderRadius: 16,
      borderWidth: StyleSheet.hairlineWidth,
      borderColor: panelBorder,
      paddingVertical: 14,
      paddingHorizontal: 8,
      minHeight: 88,
    },
    queuedSideColumn: {
      alignItems: 'center',
      paddingHorizontal: 8,
      minWidth: 64,
    },
    queuedCenterColumn: {
      flex: 1,
      alignItems: 'flex-start',
      paddingHorizontal: 12,
      gap: 3,
    },
    queuedDivider: {
      width: StyleSheet.hairlineWidth,
      alignSelf: 'stretch',
      backgroundColor: isDark ? 'rgba(255,255,255,0.12)' : 'rgba(15, 23, 42, 0.1)',
      marginVertical: 4,
    },
    queuedSideEyebrow: {
      fontFamily: theme.typography.fontFamily.semibold,
      fontSize: 10,
      fontWeight: '600',
      letterSpacing: 0.75,
      textTransform: 'uppercase',
      color: mutedText,
      marginBottom: 4,
    },
    queuedPositionValue: {
      fontFamily: theme.typography.fontFamily.bold,
      fontSize: 28,
      fontWeight: '700',
      color: isDark ? theme.colors.brandLight : theme.colors.textPrimary,
      lineHeight: 32,
    },
    queuedCenterEyebrow: {
      fontFamily: theme.typography.fontFamily.bold,
      fontSize: 10,
      fontWeight: '700',
      letterSpacing: 0.75,
      textTransform: 'uppercase',
      color: isDark ? theme.colors.brandLight : theme.colors.brandDark,
    },
    queuedHeadline: {
      fontFamily: theme.typography.fontFamily.bold,
      fontSize: 16,
      fontWeight: '700',
      color: darkText,
      lineHeight: 21,
    },
    queuedSubtext: {
      fontFamily: theme.typography.fontFamily.regular,
      fontSize: 12,
      color: mutedText,
      lineHeight: 16,
      marginTop: 1,
    },
    queuedWaitValue: {
      fontFamily: theme.typography.fontFamily.bold,
      fontSize: 15,
      fontWeight: '700',
      color: darkText,
    },
    infoPanel: {
      flexDirection: 'row',
      alignItems: 'flex-start',
      gap: 12,
      backgroundColor: isDark ? DARK_JOURNEY_SURFACE.panelBg : '#F2F5F7',
      borderRadius: 16,
      borderWidth: StyleSheet.hairlineWidth,
      borderColor: isDark ? DARK_JOURNEY_SURFACE.panelBorder : '#E6ECF0',
      padding: 14,
    },
    infoIconWrap: {
      width: 48,
      height: 48,
      borderRadius: 24,
      borderWidth: 1.5,
      borderColor: isDark ? 'rgba(0, 217, 160, 0.4)' : 'rgba(0, 217, 160, 0.5)',
      backgroundColor: isDark ? 'rgba(0, 217, 160, 0.08)' : '#FFFFFF',
      alignItems: 'center',
      justifyContent: 'center',
    },
    infoCopy: {
      flex: 1,
      gap: 3,
      minWidth: 0,
      paddingTop: 1,
    },
    infoEyebrow: {
      fontFamily: theme.typography.fontFamily.bold,
      fontSize: 10,
      fontWeight: '700',
      letterSpacing: 0.75,
      textTransform: 'uppercase',
      color: isDark ? theme.colors.brandLight : theme.colors.brandDark,
    },
    infoTitle: {
      fontFamily: theme.typography.fontFamily.bold,
      fontSize: 16,
      fontWeight: '700',
      color: darkText,
      lineHeight: 21,
    },
    infoBody: {
      fontFamily: theme.typography.fontFamily.regular,
      fontSize: 13,
      color: mutedText,
      lineHeight: 18,
      marginTop: 1,
    },
    prepPanel: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: 10,
      backgroundColor: isDark ? 'rgba(0, 0, 0, 0.18)' : theme.colors.brandMuted,
      borderRadius: 16,
      padding: 12,
    },
    prepIconWrap: {
      width: 40,
      height: 40,
      borderRadius: 20,
      backgroundColor: isDark ? 'rgba(255,255,255,0.08)' : '#FFFFFF',
      alignItems: 'center',
      justifyContent: 'center',
    },
    prepTitle: {
      fontFamily: theme.typography.fontFamily.semibold,
      fontSize: 13,
      fontWeight: '600',
      color: darkText,
    },
    readyPanel: {
      flexDirection: 'row',
      alignItems: 'flex-start',
      gap: 12,
      backgroundColor: isDark ? DARK_JOURNEY_SURFACE.panelBg : '#F2F5F7',
      borderRadius: 16,
      borderWidth: StyleSheet.hairlineWidth,
      borderColor: isDark ? DARK_JOURNEY_SURFACE.panelBorder : '#E6ECF0',
      paddingVertical: 14,
      paddingHorizontal: 14,
    },
    readyIconWrap: {
      width: 48,
      height: 48,
      borderRadius: 24,
      borderWidth: 1.5,
      borderColor: 'rgba(0, 217, 160, 0.5)',
      backgroundColor: isDark ? 'rgba(0, 217, 160, 0.08)' : '#FFFFFF',
      alignItems: 'center',
      justifyContent: 'center',
    },
    readyCopy: {
      flex: 1,
      gap: 3,
      minWidth: 0,
      paddingTop: 1,
      paddingRight: 4,
    },
    connectorBadge: {
      alignSelf: 'flex-start',
      marginTop: 2,
      paddingHorizontal: 10,
      paddingVertical: 6,
      borderRadius: theme.radius.pill,
      backgroundColor: theme.colors.brandDark,
    },
    connectorBadgeText: {
      fontFamily: theme.typography.fontFamily.bold,
      fontSize: 11,
      fontWeight: '700',
      color: '#FFFFFF',
    },
    chargingHeroRow: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: 14,
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
      minWidth: 0,
    },
    chargingHeroEyebrow: {
      fontFamily: theme.typography.fontFamily.bold,
      fontSize: 10,
      fontWeight: '700',
      letterSpacing: 0.75,
      textTransform: 'uppercase',
      color: theme.colors.brandLight,
    },
    chargingHeroPower: {
      fontFamily: theme.typography.fontFamily.bold,
      fontSize: 32,
      fontWeight: '700',
      color: CHARGING_SURFACE.textPrimary,
      lineHeight: 36,
    },
    chargingHeroVehicle: {
      fontFamily: theme.typography.fontFamily.semibold,
      fontSize: 13,
      fontWeight: '600',
      color: CHARGING_SURFACE.textMuted,
    },
    chargingMetricsPanel: {
      flexDirection: 'row',
      alignItems: 'stretch',
      backgroundColor: CHARGING_SURFACE.panelBg,
      borderRadius: 16,
      borderWidth: 1,
      borderColor: CHARGING_SURFACE.panelBorder,
      paddingVertical: 14,
      paddingHorizontal: 6,
    },
    chargingMetricDivider: {
      width: StyleSheet.hairlineWidth,
      backgroundColor: CHARGING_SURFACE.panelBorder,
      marginVertical: 2,
    },
    chargingMetricColumn: {
      flex: 1,
      minWidth: 0,
      alignItems: 'center',
      justifyContent: 'center',
      gap: 4,
      paddingHorizontal: 4,
    },
    chargingMetricLabel: {
      fontFamily: theme.typography.fontFamily.medium,
      fontSize: 11,
      color: CHARGING_SURFACE.textMuted,
      textAlign: 'center',
    },
    chargingMetricValue: {
      fontFamily: theme.typography.fontFamily.bold,
      fontSize: 14,
      fontWeight: '700',
      color: CHARGING_SURFACE.textPrimary,
      textAlign: 'center',
    },
    footer: {
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'space-between',
      gap: 12,
      marginTop: 2,
      minHeight: 44,
    },
    footerAction: {
      flex: 1,
      fontFamily: theme.typography.fontFamily.bold,
      fontSize: 14,
      fontWeight: '700',
      color: theme.colors.brandDark,
    },
    footerActionDark: {
      color: theme.colors.brandLight,
    },
    footerButton: {
      width: 44,
      height: 44,
      borderRadius: 22,
      backgroundColor: theme.colors.brand,
      alignItems: 'center',
      justifyContent: 'center',
    },
  });
}
