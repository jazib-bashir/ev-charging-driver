import { router, useLocalSearchParams, type Href } from 'expo-router';
import { useCallback, useMemo, useState, type ReactNode } from 'react';
import {
  ActivityIndicator,
  Pressable,
  RefreshControl,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from 'react-native';

import { useAuth } from '@/auth/auth-context';
import { JourneyDetailsHeader } from '@/components/journey/journey-details-header';
import {
  JOURNEY_DETAILS_CARD_GAP,
  JOURNEY_DETAILS_GUTTER,
} from '@/components/journey/journey-details-layout';
import { JourneyProgressCard } from '@/components/journey/journey-progress-card';
import { Icon } from '@/components/ui/icon';
import { ScreenContainer } from '@/components/ui/screen-container';
import { useActiveChargingSession } from '@/hooks/use-active-charging-session';
import { useActiveDriverQueueMembership } from '@/hooks/use-active-driver-queue-membership';
import { useChargingSessionDisplayLabels } from '@/hooks/use-charging-session-display-labels';
import { useStationDetails } from '@/hooks/use-station-details';
import { useTheme, type AppTheme } from '@/theme';
import type { ChargingSession } from '@/types/charging-session';
import type { QueueMember } from '@/types/queue';
import type { Station } from '@/types/station';
import {
  EMPTY_METRIC,
  formatHomeJourneyConnectorLabel,
  formatHomeJourneyDuration,
  formatPowerKw,
  formatSessionDateTime,
} from '@/utils/charging-session-format';
import {
  buildJourneyTimelineEvents,
  MOCK_CHARGER_MODEL_LABEL,
  MOCK_CHARGER_PREPARATION,
  MOCK_CHARGING_HEADLINE,
  MOCK_CHECK_IN_AT_LABEL,
  MOCK_COST_UNAVAILABLE,
  MOCK_ESTIMATED_WAIT_LABEL,
  MOCK_POWER_HISTORY,
  MOCK_POWER_HISTORY_WINDOW_LABEL,
  MOCK_STATION_FOOTER,
  MOCK_VEHICLE_LABEL,
  type JourneyTimelineEvent,
} from '@/utils/journey-details-mock';
import { openStationNavigation } from '@/utils/open-station-navigation';
import {
  formatDriversAheadHeadline,
  formatEstimatedWaitRelative,
  formatQueuePositionPadded,
  formatQueuedCenterEyebrow,
  formatReadyChargerBayNumber,
  formatReadyConnectorBadge,
  getPeopleAhead,
  homeJourneyStatusBadgeLabel,
  resolveHomeJourneyStepIndex,
  resolveHomeJourneyVisualVariant,
} from '@/utils/queue-display';
import {
  buildAuthJourneySeedKey,
  parseWhoAmIActiveJourney,
} from '@/utils/whoami-active-journey';

function SectionCard({
  label,
  children,
  styles,
}: {
  label?: string;
  children: ReactNode;
  styles: ReturnType<typeof createStyles>;
}) {
  return (
    <View style={styles.card}>
      {label ? <Text style={styles.sectionLabel}>{label}</Text> : null}
      {children}
    </View>
  );
}

function TimelineCard({
  events,
  styles,
}: {
  events: JourneyTimelineEvent[];
  styles: ReturnType<typeof createStyles>;
}) {
  return (
    <SectionCard label="Journey timeline" styles={styles}>
      <View style={styles.timelineList}>
        {events.map((event, index) => {
          const isLast = index === events.length - 1;
          return (
            <View key={event.id} style={styles.timelineRow}>
              <View style={styles.timelineRailCol}>
                <View style={styles.timelineDot}>
                  <Icon name="check" size={11} color="#FFFFFF" />
                </View>
                {!isLast ? <View style={styles.timelineLine} /> : null}
              </View>
              <View style={styles.timelineCopy}>
                <View style={styles.timelineTitleRow}>
                  <Text style={styles.timelineTitle}>{event.label}</Text>
                  {event.isLatest ? (
                    <View style={styles.latestBadge}>
                      <Text style={styles.latestBadgeText}>Latest</Text>
                    </View>
                  ) : null}
                </View>
                <Text style={styles.timelineTime}>{event.atLabel}</Text>
              </View>
            </View>
          );
        })}
      </View>
    </SectionCard>
  );
}

function StationInfoCard({
  station,
  stationName,
  styles,
}: {
  station: Station | null;
  stationName?: string | null;
  styles: ReturnType<typeof createStyles>;
}) {
  const { theme } = useTheme();
  const name = station?.name ?? stationName ?? 'Charging station';
  const address =
    station?.formattedAddress?.trim() ||
    station?.fullAddress?.trim() ||
    [station?.city, station?.state].filter(Boolean).join(', ') ||
    null;
  const canNavigate =
    typeof station?.latitude === 'number' && typeof station?.longitude === 'number';

  return (
    <SectionCard styles={styles}>
      <View style={styles.stationHeaderRow}>
        <View style={styles.stationCopy}>
          <Text style={styles.stationEyebrow}>Charging at</Text>
          <Text style={styles.stationName}>{name}</Text>
          {address ? <Text style={styles.stationAddress}>{address}</Text> : null}
        </View>
        <Pressable
          disabled={!canNavigate}
          onPress={() => {
            if (station) {
              openStationNavigation(station);
            }
          }}
          accessibilityRole="button"
          accessibilityLabel="Navigate to station"
          style={[styles.navButton, !canNavigate && styles.navButtonDisabled]}
        >
          <Icon name="navigate" size={18} color={theme.colors.brandDark} />
        </Pressable>
      </View>
      <View style={styles.stationDivider} />
      <View style={styles.stationFooterRow}>
        <Text style={styles.stationFooterText}>{MOCK_STATION_FOOTER.hoursLabel}</Text>
        <View style={styles.stationFooterDot} />
        <Text style={styles.stationFooterText}>{MOCK_STATION_FOOTER.operatorLabel}</Text>
      </View>
    </SectionCard>
  );
}

function UpdatesNote({ styles }: { styles: ReturnType<typeof createStyles> }) {
  const { theme } = useTheme();
  return (
    <View style={styles.updatesNote}>
      <Icon name="bell" size={14} color={theme.colors.textMuted} />
      <Text style={styles.updatesNoteText}>
        We’ll send important journey updates to this device
      </Text>
    </View>
  );
}

function QueuedBody({
  membership,
  stepIndex,
  timeline,
  station,
  stationName,
  styles,
  brand,
}: {
  membership: QueueMember;
  stepIndex: number;
  timeline: JourneyTimelineEvent[];
  station: Station | null;
  stationName?: string | null;
  styles: ReturnType<typeof createStyles>;
  brand: string;
}) {
  const position = formatQueuePositionPadded(membership);
  const headline = formatDriversAheadHeadline(membership) ?? "You're next";
  const ahead = getPeopleAhead(membership);
  const aheadSub =
    ahead === 0 ? 'No drivers ahead' : `${ahead} driver${ahead === 1 ? '' : 's'} ahead`;
  const wait =
    formatEstimatedWaitRelative(membership.estimatedTurnAt) ?? MOCK_ESTIMATED_WAIT_LABEL;

  return (
    <>
      <View style={styles.hero}>
        <View style={styles.heroIcon}>
          <Icon name="time" size={28} color={brand} />
        </View>
        <Text style={styles.heroEyebrow}>{formatQueuedCenterEyebrow()}</Text>
        <Text style={styles.heroTitle}>{headline}</Text>
        <Text style={styles.heroBody}>
          Stay nearby. We’ll let you know as soon as a charger is ready.
        </Text>
      </View>

      <JourneyProgressCard currentStepIndex={stepIndex} />

      <SectionCard label="Queue status" styles={styles}>
        <View style={styles.queueStatusRow}>
          <View style={styles.queueStatusLeft}>
            <Text style={styles.metaLabel}>Your position</Text>
            <Text style={styles.queuePosition}>{position ?? '—'}</Text>
          </View>
          <View style={styles.queueStatusDivider} />
          <View style={styles.queueStatusRight}>
            <Text style={styles.queueStatusHeadline}>{headline}</Text>
            <Text style={styles.metaLabel}>{aheadSub}</Text>
            <View style={styles.waitRow}>
              <Icon name="time" size={14} color={brand} />
              <Text style={styles.waitText}>Estimated wait {wait}</Text>
            </View>
          </View>
        </View>
      </SectionCard>

      <SectionCard label="What to do now" styles={styles}>
        <View style={styles.actionItem}>
          <View style={styles.actionIndex}>
            <Text style={styles.actionIndexText}>1</Text>
          </View>
          <View style={styles.actionCopy}>
            <Text style={styles.actionTitle}>Stay within reach</Text>
            <Text style={styles.actionBody}>
              Remain near the station so you can arrive promptly.
            </Text>
          </View>
        </View>
        <View style={styles.itemDivider} />
        <View style={styles.actionItem}>
          <View style={styles.actionIndex}>
            <Text style={styles.actionIndexText}>2</Text>
          </View>
          <View style={styles.actionCopy}>
            <Text style={styles.actionTitle}>Watch for your alert</Text>
            <Text style={styles.actionBody}>
              We’ll notify you when it’s time to check in.
            </Text>
          </View>
        </View>
      </SectionCard>

      <TimelineCard events={timeline} styles={styles} />
      <StationInfoCard station={station} stationName={stationName} styles={styles} />
      <UpdatesNote styles={styles} />
    </>
  );
}

function ArrivedBody({
  membership,
  stepIndex,
  timeline,
  station,
  stationName,
  styles,
  brand,
}: {
  membership: QueueMember;
  stepIndex: number;
  timeline: JourneyTimelineEvent[];
  station: Station | null;
  stationName?: string | null;
  styles: ReturnType<typeof createStyles>;
  brand: string;
}) {
  const prepTitle = membership.needsEvseReassignment
    ? 'Finding a compatible charger'
    : MOCK_CHARGER_PREPARATION.statusLabel;
  const prepDetail = membership.needsEvseReassignment
    ? 'The station is locating another compatible bay.'
    : MOCK_CHARGER_PREPARATION.detail;

  return (
    <>
      <View style={styles.hero}>
        <View style={styles.heroIcon}>
          <Icon name="map-pin" size={28} color={brand} />
        </View>
        <Text style={styles.heroEyebrow}>Arrival confirmed</Text>
        <Text style={styles.heroTitle}>{"You're checked in"}</Text>
        <Text style={styles.heroBody}>
          Park in the waiting area while the operator prepares your charger.
        </Text>
      </View>

      <JourneyProgressCard currentStepIndex={stepIndex} />

      <SectionCard label="While you wait" styles={styles}>
        <View style={styles.infoRow}>
          <View style={styles.infoIconSquare}>
            <Icon name="check" size={16} color={brand} />
          </View>
          <View style={styles.infoCopy}>
            <Text style={styles.metaLabel}>Check-in</Text>
            <Text style={styles.infoTitle}>Confirmed at {MOCK_CHECK_IN_AT_LABEL}</Text>
          </View>
        </View>
        <View style={styles.itemDivider} />
        <View style={styles.infoRow}>
          <View style={styles.infoIconSquare}>
            <Icon name="sparkles" size={16} color={brand} />
          </View>
          <View style={styles.infoCopy}>
            <Text style={styles.metaLabel}>Station status</Text>
            <Text style={styles.infoTitle}>{prepTitle}</Text>
            <Text style={styles.actionBody}>{prepDetail}</Text>
          </View>
        </View>
      </SectionCard>

      <TimelineCard events={timeline} styles={styles} />
      <StationInfoCard station={station} stationName={stationName} styles={styles} />
      <UpdatesNote styles={styles} />
    </>
  );
}

function ReadyBody({
  membership,
  stepIndex,
  timeline,
  station,
  stationName,
  styles,
  brand,
}: {
  membership: QueueMember;
  stepIndex: number;
  timeline: JourneyTimelineEvent[];
  station: Station | null;
  stationName?: string | null;
  styles: ReturnType<typeof createStyles>;
  brand: string;
}) {
  const bay = formatReadyChargerBayNumber(membership.allocation);
  const connector = formatReadyConnectorBadge(membership.allocation);
  const eyebrow = bay ? `Charger ${bay} is ready` : 'Charger is ready';
  const instruction = bay
    ? connector
      ? `Go to Bay ${bay} and connect your vehicle using the ${connector} cable.`
      : `Go to Bay ${bay} and connect your vehicle.`
    : 'Connect your vehicle, then follow the charger screen.';

  return (
    <>
      <View style={styles.hero}>
        <View style={styles.heroIcon}>
          <Icon name="plug" size={28} color={brand} />
        </View>
        <Text style={styles.heroEyebrow}>{eyebrow}</Text>
        <Text style={styles.heroTitle}>Plug in to begin</Text>
        <Text style={styles.heroBody}>{instruction}</Text>
      </View>

      <JourneyProgressCard currentStepIndex={stepIndex} />

      <SectionCard label="Your charger" styles={styles}>
        <View style={styles.chargerGrid}>
          <View style={styles.chargerCell}>
            <Text style={styles.metaLabel}>Assigned bay</Text>
            <Text style={styles.chargerValue}>{bay ?? '—'}</Text>
          </View>
          <View style={styles.chargerGridDivider} />
          <View style={styles.chargerCell}>
            <Text style={styles.metaLabel}>Connector</Text>
            <Text style={styles.chargerValue}>{connector ?? '—'}</Text>
          </View>
        </View>

        <View style={styles.itemDivider} />

        <View style={styles.infoRow}>
          <View style={styles.infoIconSquare}>
            <Icon name="navigate" size={16} color={brand} />
          </View>
          <View style={styles.infoCopy}>
            <Text style={styles.metaLabel}>Next step</Text>
            <Text style={styles.infoTitle}>
              {bay ? `Go to Bay ${bay}` : 'Head to your assigned bay'}
            </Text>
            <Text style={styles.actionBody}>Follow the green bay signs</Text>
          </View>
        </View>
        <View style={styles.itemDivider} />
        <View style={styles.infoRow}>
          <View style={styles.infoIconSquare}>
            <Icon name="plug" size={16} color={brand} />
          </View>
          <View style={styles.infoCopy}>
            <Text style={styles.metaLabel}>At the charger</Text>
            <Text style={styles.infoTitle}>Connect your vehicle</Text>
            <Text style={styles.actionBody}>Then follow the charging screen</Text>
          </View>
        </View>
      </SectionCard>

      <TimelineCard events={timeline} styles={styles} />
      <StationInfoCard station={station} stationName={stationName} styles={styles} />
      <UpdatesNote styles={styles} />
    </>
  );
}

function ChargingBody({
  session,
  membership,
  stepIndex,
  timeline,
  station,
  stationName,
  connectorLabel,
  vehicleLabel,
  styles,
  brand,
}: {
  session: ChargingSession;
  membership: QueueMember | null;
  stepIndex: number;
  timeline: JourneyTimelineEvent[];
  station: Station | null;
  stationName?: string | null;
  connectorLabel?: string | null;
  vehicleLabel?: string | null;
  styles: ReturnType<typeof createStyles>;
  brand: string;
}) {
  const powerRaw = formatPowerKw(session.averagePowerKw ?? session.maxPowerKw);
  const power = powerRaw !== EMPTY_METRIC ? powerRaw : null;
  const energy =
    session.energyKwh != null && !Number.isNaN(session.energyKwh)
      ? `${session.energyKwh.toFixed(1)} kWh`
      : null;
  const duration = formatHomeJourneyDuration(session.durationSeconds, session.startedAt);
  const started = formatSessionDateTime(session.startedAt);
  const startedShort =
    started !== EMPTY_METRIC
      ? new Date(session.startedAt).toLocaleTimeString(undefined, {
          hour: 'numeric',
          minute: '2-digit',
        })
      : null;
  const connectorRaw = formatHomeJourneyConnectorLabel(
    connectorLabel,
    session.connectorLabel,
    formatReadyConnectorBadge(membership?.allocation),
  );
  const connector = connectorRaw !== EMPTY_METRIC && connectorRaw !== '—' ? connectorRaw : null;
  const vehicle = vehicleLabel?.trim() || session.vehicleLabel?.trim() || MOCK_VEHICLE_LABEL;
  const bay =
    formatReadyChargerBayNumber(membership?.allocation) ||
    session.evseLabel?.trim() ||
    null;
  const chargerTitle = session.chargerName?.trim()
    ? bay
      ? `${session.chargerName.trim()} · Bay ${bay}`
      : session.chargerName.trim()
    : bay
      ? `${MOCK_CHARGER_MODEL_LABEL} · Bay ${bay}`
      : MOCK_CHARGER_MODEL_LABEL;
  const costTitle =
    session.totalCost != null
      ? String(session.totalCost)
      : session.pricePerKwh != null
        ? `${session.pricePerKwh.toFixed(2)} / kWh`
        : MOCK_COST_UNAVAILABLE.title;
  const costDetail =
    session.totalCost != null || session.pricePerKwh != null
      ? null
      : MOCK_COST_UNAVAILABLE.detail;

  return (
    <>
      <View style={styles.chargingHero}>
        <View style={styles.chargingHeroTop}>
          <View style={styles.chargingPowerIcon}>
            <Icon name="bolt" size={22} color={styles.chargingBoltColor.color} />
          </View>
          <View style={styles.chargingPowerCopy}>
            {power ? <Text style={styles.chargingPowerValue}>{power}</Text> : null}
            <Text style={styles.chargingPowerLabel}>Live power</Text>
          </View>
        </View>
        <View style={styles.chargingHeroCopy}>
          <Text style={styles.chargingHeroEyebrow}>Charging now</Text>
          <Text style={styles.chargingHeroTitle}>{MOCK_CHARGING_HEADLINE}</Text>
          <Text style={styles.chargingHeroMeta}>
            {[vehicle, bay ? `Charger ${bay}` : null].filter(Boolean).join(' · ')}
          </Text>
        </View>
      </View>

      <JourneyProgressCard currentStepIndex={stepIndex} />

      <SectionCard label="Session snapshot" styles={styles}>
        <View style={styles.snapshotGrid}>
          <View style={styles.snapshotCell}>
            <Text style={styles.metaLabel}>Energy delivered</Text>
            <Text style={styles.snapshotValue}>{energy ?? '—'}</Text>
          </View>
          <View style={[styles.snapshotCell, styles.snapshotCellBorderLeft]}>
            <Text style={styles.metaLabel}>Session time</Text>
            <Text style={styles.snapshotValue}>{duration ?? '—'}</Text>
          </View>
          <View style={[styles.snapshotCell, styles.snapshotCellBorderTop]}>
            <Text style={styles.metaLabel}>Started</Text>
            <Text style={styles.snapshotValue}>{startedShort ?? '—'}</Text>
          </View>
          <View
            style={[
              styles.snapshotCell,
              styles.snapshotCellBorderLeft,
              styles.snapshotCellBorderTop,
            ]}
          >
            <Text style={styles.metaLabel}>Connector</Text>
            <Text style={styles.snapshotValue}>{connector ?? '—'}</Text>
          </View>
        </View>
      </SectionCard>

      <SectionCard styles={styles}>
        <View style={styles.chartHeader}>
          <View>
            <Text style={styles.metaLabel}>Power delivery</Text>
            <Text style={styles.infoTitle}>{MOCK_POWER_HISTORY_WINDOW_LABEL}</Text>
          </View>
          <View style={styles.livePill}>
            <View style={styles.livePillDot} />
            <Text style={styles.livePillText}>Live</Text>
          </View>
        </View>
        <View style={styles.chartRow}>
          {MOCK_POWER_HISTORY.map((sample) => (
            <View key={sample.label} style={styles.chartBarTrack}>
              <View
                style={[
                  styles.chartBar,
                  { height: Math.max(8, Math.round(sample.intensity * 112)) },
                ]}
              />
            </View>
          ))}
        </View>
      </SectionCard>

      <SectionCard styles={styles}>
        <View style={styles.infoRow}>
          <View style={styles.infoIconSquare}>
            <Icon name="car" size={16} color={brand} />
          </View>
          <View style={styles.infoCopy}>
            <Text style={styles.metaLabel}>Vehicle</Text>
            <Text style={styles.infoTitle}>{vehicle}</Text>
            <Text style={styles.actionBody}>Driver vehicle</Text>
          </View>
        </View>
        <View style={styles.itemDivider} />
        <View style={styles.infoRow}>
          <View style={styles.infoIconSquare}>
            <Icon name="bolt" size={16} color={brand} />
          </View>
          <View style={styles.infoCopy}>
            <Text style={styles.metaLabel}>Charger</Text>
            <Text style={styles.infoTitle}>{chargerTitle}</Text>
            <Text style={styles.actionBody}>DC fast charger</Text>
          </View>
        </View>
        <View style={styles.itemDivider} />
        <View style={styles.infoRow}>
          <View style={styles.infoIconSquare}>
            <Icon name="time" size={16} color={brand} />
          </View>
          <View style={styles.infoCopy}>
            <Text style={styles.metaLabel}>Cost</Text>
            <Text style={styles.infoTitle}>{costTitle}</Text>
            {costDetail ? <Text style={styles.actionBody}>{costDetail}</Text> : null}
          </View>
        </View>
      </SectionCard>

      <TimelineCard events={timeline} styles={styles} />
      <StationInfoCard station={station} stationName={stationName} styles={styles} />
      <UpdatesNote styles={styles} />
    </>
  );
}

export function JourneyDetailsScreen() {
  const { theme, isDark } = useTheme();
  const styles = useMemo(() => createStyles(theme, isDark), [theme, isDark]);
  const params = useLocalSearchParams<{
    stationId?: string;
    membershipId?: string;
    sessionId?: string;
  }>();

  const { token, user, isLoading: isAuthLoading } = useAuth();
  const journeyLookupFailed = user?.activeJourneyLookup === 'failed';
  const authJourneySeedKey = useMemo(() => buildAuthJourneySeedKey(user), [user]);
  const whoAmIJourney = useMemo(
    () => parseWhoAmIActiveJourney(user),
    [user?.activeJourney, user?.activeJourneyLookup, user?.id],
  );

  const {
    membership,
    stationName: queueStationName,
    isLoading: isQueueLoading,
    isRefreshing: isQueueRefreshing,
    refresh: refreshQueue,
  } = useActiveDriverQueueMembership({
    token,
    seedMembership: whoAmIJourney ? whoAmIJourney.queueMembership : undefined,
    seedStationName: whoAmIJourney?.queueStationName,
    journeyLookupFailed,
    authJourneySeedKey,
  });

  const pendingCharging =
    whoAmIJourney?.queueMemberChargingWithoutSession ||
    whoAmIJourney?.queueMembership?.state === 'CHARGING' ||
    membership?.state === 'CHARGING';

  const {
    session,
    isLoading: isSessionLoading,
    isRefreshing: isSessionRefreshing,
    refresh: refreshSession,
  } = useActiveChargingSession({
    token,
    seedSession: whoAmIJourney ? whoAmIJourney.chargingSession : undefined,
    journeyLookupFailed,
    authJourneySeedKey,
  });
  const sessionLabels = useChargingSessionDisplayLabels(session);

  const hasActiveCharging = session?.status === 'CHARGING';
  const activeMembership = membership;

  const variant = resolveHomeJourneyVisualVariant(activeMembership, {
    hasActiveSession: hasActiveCharging,
    chargingWithoutSession: Boolean(pendingCharging) && !hasActiveCharging,
  });
  const stepIndex = resolveHomeJourneyStepIndex(variant);

  const stationId =
    (hasActiveCharging ? session?.stationId : null) ??
    activeMembership?.stationId ??
    (typeof params.stationId === 'string' ? params.stationId : undefined);

  const { station, refresh: refreshStation } = useStationDetails(stationId);
  const [isPullRefreshing, setIsPullRefreshing] = useState(false);

  const handlePullRefresh = useCallback(async () => {
    setIsPullRefreshing(true);
    try {
      await Promise.all([
        refreshQueue({ showLoading: false }),
        refreshSession({ showLoading: false }),
        refreshStation(),
      ]);
    } finally {
      setIsPullRefreshing(false);
    }
  }, [refreshQueue, refreshSession, refreshStation]);

  const stationName =
    (hasActiveCharging
      ? sessionLabels.stationName ?? session?.stationName
      : queueStationName) ?? station?.name;

  const bayNumber = formatReadyChargerBayNumber(activeMembership?.allocation);
  const timeline = useMemo(
    () =>
      buildJourneyTimelineEvents({
        variant,
        joinedAt: activeMembership?.joinedAt,
        bayNumber,
      }),
    [activeMembership?.joinedAt, bayNumber, variant],
  );

  const handleBack = () => {
    if (router.canGoBack()) {
      router.back();
      return;
    }
    router.replace('/' as Href);
  };

  const brand = theme.colors.brand;

  const hasJourneyBody =
    (variant === 'charging' && Boolean(session)) || Boolean(activeMembership);

  const isResolvingJourney =
    !hasJourneyBody && (isAuthLoading || isQueueLoading || isSessionLoading);

  let body = null;
  if (isResolvingJourney) {
    body = (
      <View style={styles.loadingState} accessibilityLabel="Loading journey details">
        <ActivityIndicator size="large" color={theme.colors.brand} />
        <Text style={styles.loadingTitle}>Loading journey</Text>
        <Text style={styles.heroBody}>Fetching your latest charging status…</Text>
      </View>
    );
  } else if (variant === 'charging' && session) {
    body = (
      <ChargingBody
        session={session}
        membership={activeMembership}
        stepIndex={stepIndex}
        timeline={timeline}
        station={station}
        stationName={stationName}
        connectorLabel={sessionLabels.connectorLabel}
        vehicleLabel={session?.vehicleLabel}
        styles={styles}
        brand={brand}
      />
    );
  } else if (variant === 'ready' && activeMembership) {
    body = (
      <ReadyBody
        membership={activeMembership}
        stepIndex={stepIndex}
        timeline={timeline}
        station={station}
        stationName={stationName}
        styles={styles}
        brand={brand}
      />
    );
  } else if (variant === 'at-station' && activeMembership) {
    body = (
      <ArrivedBody
        membership={activeMembership}
        stepIndex={stepIndex}
        timeline={timeline}
        station={station}
        stationName={stationName}
        styles={styles}
        brand={brand}
      />
    );
  } else if (activeMembership) {
    body = (
      <QueuedBody
        membership={activeMembership}
        stepIndex={stepIndex}
        timeline={timeline}
        station={station}
        stationName={stationName}
        styles={styles}
        brand={brand}
      />
    );
  } else {
    body = (
      <View style={styles.emptyState}>
        <Text style={styles.heroTitle}>No active journey</Text>
        <Text style={styles.heroBody}>
          Return home to find a station and start charging.
        </Text>
        <Text style={styles.metaLabel}>
          Last known status: {homeJourneyStatusBadgeLabel(variant)}
        </Text>
      </View>
    );
  }

  return (
    <ScreenContainer edges={['top', 'bottom']} style={styles.screen}>
      <JourneyDetailsHeader onBack={handleBack} />
      <ScrollView
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
        refreshControl={
          <RefreshControl
            refreshing={isPullRefreshing || isQueueRefreshing || isSessionRefreshing}
            onRefresh={() => {
              void handlePullRefresh();
            }}
            tintColor={theme.colors.brand}
            colors={[theme.colors.brand]}
          />
        }
      >
        {body}
      </ScrollView>
    </ScreenContainer>
  );
}

function createStyles(theme: AppTheme, isDark: boolean) {
  return StyleSheet.create({
    screen: {
      backgroundColor: theme.colors.background,
    },
    chargingBoltColor: {
      color: isDark ? '#0A2F2A' : theme.colors.textInverse,
    },
    scrollContent: {
      paddingHorizontal: JOURNEY_DETAILS_GUTTER,
      paddingTop: 12,
      paddingBottom: 40,
      gap: JOURNEY_DETAILS_CARD_GAP,
    },
    card: {
      backgroundColor: theme.colors.surface,
      borderRadius: 16,
      borderWidth: 1,
      borderColor: theme.colors.border,
      paddingHorizontal: 16,
      paddingTop: 14,
      paddingBottom: 16,
      gap: 12,
      alignSelf: 'stretch',
    },
    sectionLabel: {
      fontFamily: theme.typography.fontFamily.semibold,
      fontSize: 11,
      fontWeight: '600',
      letterSpacing: 0.8,
      textTransform: 'uppercase',
      color: theme.colors.textMuted,
    },
    hero: {
      alignItems: 'center',
      paddingHorizontal: 12,
      paddingTop: 8,
      paddingBottom: 4,
      gap: 8,
    },
    heroIcon: {
      width: 72,
      height: 72,
      borderRadius: 36,
      alignItems: 'center',
      justifyContent: 'center',
      backgroundColor: theme.colors.brandMuted,
      borderWidth: 1.5,
      borderColor: 'rgba(0, 217, 160, 0.35)',
      marginBottom: 4,
    },
    heroEyebrow: {
      fontFamily: theme.typography.fontFamily.bold,
      fontSize: 11,
      fontWeight: '700',
      letterSpacing: 0.8,
      textTransform: 'uppercase',
      color: theme.colors.brandDark,
      textAlign: 'center',
    },
    heroTitle: {
      fontFamily: theme.typography.fontFamily.bold,
      fontSize: 26,
      fontWeight: '700',
      color: theme.colors.textPrimary,
      textAlign: 'center',
      letterSpacing: -0.3,
    },
    heroBody: {
      fontFamily: theme.typography.fontFamily.regular,
      fontSize: 14,
      lineHeight: 20,
      color: theme.colors.textMuted,
      textAlign: 'center',
      maxWidth: 320,
    },
    metaLabel: {
      fontFamily: theme.typography.fontFamily.medium,
      fontSize: 12,
      color: theme.colors.textMuted,
    },
    queueStatusRow: {
      flexDirection: 'row',
      alignItems: 'stretch',
      gap: 12,
    },
    queueStatusLeft: {
      minWidth: 88,
      justifyContent: 'center',
      gap: 4,
    },
    queuePosition: {
      fontFamily: theme.typography.fontFamily.bold,
      fontSize: 36,
      fontWeight: '700',
      color: theme.colors.brandDark,
      lineHeight: 40,
    },
    queueStatusDivider: {
      width: StyleSheet.hairlineWidth,
      backgroundColor: theme.colors.border,
    },
    queueStatusRight: {
      flex: 1,
      gap: 4,
      justifyContent: 'center',
    },
    queueStatusHeadline: {
      fontFamily: theme.typography.fontFamily.bold,
      fontSize: 16,
      fontWeight: '700',
      color: theme.colors.textPrimary,
    },
    waitRow: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: 6,
      marginTop: 6,
    },
    waitText: {
      fontFamily: theme.typography.fontFamily.bold,
      fontSize: 13,
      fontWeight: '700',
      color: theme.colors.brandDark,
    },
    actionItem: {
      flexDirection: 'row',
      gap: 12,
      alignItems: 'flex-start',
    },
    actionIndex: {
      width: 28,
      height: 28,
      borderRadius: 14,
      alignItems: 'center',
      justifyContent: 'center',
      backgroundColor: theme.colors.brandMuted,
    },
    actionIndexText: {
      fontFamily: theme.typography.fontFamily.bold,
      fontSize: 13,
      fontWeight: '700',
      color: theme.colors.brandDark,
    },
    actionCopy: {
      flex: 1,
      gap: 2,
    },
    actionTitle: {
      fontFamily: theme.typography.fontFamily.bold,
      fontSize: 15,
      fontWeight: '700',
      color: theme.colors.textPrimary,
    },
    actionBody: {
      fontFamily: theme.typography.fontFamily.regular,
      fontSize: 13,
      lineHeight: 18,
      color: theme.colors.textMuted,
    },
    itemDivider: {
      height: StyleSheet.hairlineWidth,
      backgroundColor: theme.colors.borderLight,
      marginVertical: 2,
    },
    infoRow: {
      flexDirection: 'row',
      gap: 12,
      alignItems: 'flex-start',
    },
    infoIconSquare: {
      width: 36,
      height: 36,
      borderRadius: 10,
      alignItems: 'center',
      justifyContent: 'center',
      backgroundColor: theme.colors.brandMuted,
    },
    infoCopy: {
      flex: 1,
      gap: 2,
    },
    infoTitle: {
      fontFamily: theme.typography.fontFamily.bold,
      fontSize: 15,
      fontWeight: '700',
      color: theme.colors.textPrimary,
    },
    timelineList: {
      gap: 0,
    },
    timelineRow: {
      flexDirection: 'row',
      gap: 12,
      minHeight: 48,
    },
    timelineRailCol: {
      width: 24,
      alignItems: 'center',
    },
    timelineDot: {
      width: 22,
      height: 22,
      borderRadius: 11,
      backgroundColor: theme.colors.brand,
      alignItems: 'center',
      justifyContent: 'center',
    },
    timelineLine: {
      flex: 1,
      width: 2,
      backgroundColor: theme.colors.brandMuted,
      marginVertical: 2,
    },
    timelineCopy: {
      flex: 1,
      paddingBottom: 14,
      gap: 2,
    },
    timelineTitleRow: {
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'space-between',
      gap: 8,
    },
    timelineTitle: {
      flex: 1,
      fontFamily: theme.typography.fontFamily.bold,
      fontSize: 14,
      fontWeight: '700',
      color: theme.colors.textPrimary,
    },
    timelineTime: {
      fontFamily: theme.typography.fontFamily.regular,
      fontSize: 12,
      color: theme.colors.textMuted,
    },
    latestBadge: {
      paddingHorizontal: 8,
      paddingVertical: 3,
      borderRadius: theme.radius.pill,
      backgroundColor: theme.colors.brand,
    },
    latestBadgeText: {
      fontFamily: theme.typography.fontFamily.bold,
      fontSize: 10,
      fontWeight: '700',
      letterSpacing: 0.5,
      textTransform: 'uppercase',
      color: '#FFFFFF',
    },
    stationHeaderRow: {
      flexDirection: 'row',
      gap: 12,
      alignItems: 'flex-start',
    },
    stationCopy: {
      flex: 1,
      gap: 3,
    },
    stationEyebrow: {
      fontFamily: theme.typography.fontFamily.medium,
      fontSize: 12,
      color: theme.colors.textMuted,
    },
    stationName: {
      fontFamily: theme.typography.fontFamily.bold,
      fontSize: 17,
      fontWeight: '700',
      color: theme.colors.textPrimary,
    },
    stationAddress: {
      fontFamily: theme.typography.fontFamily.regular,
      fontSize: 13,
      color: theme.colors.textMuted,
      lineHeight: 18,
    },
    navButton: {
      width: 44,
      height: 44,
      borderRadius: 12,
      alignItems: 'center',
      justifyContent: 'center',
      backgroundColor: theme.colors.brandMuted,
    },
    navButtonDisabled: {
      opacity: 0.4,
    },
    stationDivider: {
      height: StyleSheet.hairlineWidth,
      backgroundColor: theme.colors.borderLight,
    },
    stationFooterRow: {
      flexDirection: 'row',
      alignItems: 'center',
      flexWrap: 'wrap',
      gap: 8,
    },
    stationFooterText: {
      fontFamily: theme.typography.fontFamily.medium,
      fontSize: 12,
      color: theme.colors.textMuted,
    },
    stationFooterDot: {
      width: 5,
      height: 5,
      borderRadius: 3,
      backgroundColor: theme.colors.brand,
    },
    updatesNote: {
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'center',
      gap: 8,
      paddingHorizontal: 8,
      paddingTop: 8,
      paddingBottom: 12,
    },
    updatesNoteText: {
      flexShrink: 1,
      fontFamily: theme.typography.fontFamily.regular,
      fontSize: 12,
      color: theme.colors.textMuted,
      lineHeight: 17,
      textAlign: 'center',
    },
    chargerGrid: {
      flexDirection: 'row',
      alignItems: 'stretch',
      backgroundColor: theme.colors.iconBackground,
      borderRadius: 12,
      overflow: 'hidden',
    },
    chargerCell: {
      flex: 1,
      padding: 14,
      gap: 4,
    },
    chargerGridDivider: {
      width: StyleSheet.hairlineWidth,
      backgroundColor: theme.colors.border,
    },
    chargerValue: {
      fontFamily: theme.typography.fontFamily.bold,
      fontSize: 28,
      fontWeight: '700',
      color: theme.colors.brandDark,
      lineHeight: 32,
    },
    chargingHero: {
      backgroundColor: isDark ? '#0A2F2A' : theme.colors.surface,
      borderRadius: 20,
      paddingHorizontal: 18,
      paddingTop: 20,
      paddingBottom: 22,
      gap: 16,
      borderWidth: 1,
      borderColor: isDark ? 'rgba(0, 217, 160, 0.28)' : theme.colors.border,
      alignSelf: 'stretch',
      alignItems: 'center',
    },
    chargingHeroTop: {
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'center',
      gap: 12,
    },
    chargingPowerIcon: {
      width: 48,
      height: 48,
      borderRadius: 24,
      alignItems: 'center',
      justifyContent: 'center',
      backgroundColor: theme.colors.brand,
    },
    chargingPowerCopy: {
      gap: 2,
    },
    chargingPowerValue: {
      fontFamily: theme.typography.fontFamily.bold,
      fontSize: 28,
      fontWeight: '700',
      color: isDark ? theme.colors.brandLight : theme.colors.brandDark,
      lineHeight: 32,
    },
    chargingPowerLabel: {
      fontFamily: theme.typography.fontFamily.semibold,
      fontSize: 11,
      fontWeight: '600',
      letterSpacing: 0.9,
      textTransform: 'uppercase',
      color: isDark ? theme.colors.brandLight : theme.colors.brandDark,
    },
    chargingHeroCopy: {
      alignItems: 'center',
      gap: 4,
      paddingHorizontal: 8,
    },
    chargingHeroEyebrow: {
      fontFamily: theme.typography.fontFamily.bold,
      fontSize: 11,
      fontWeight: '700',
      letterSpacing: 0.8,
      textTransform: 'uppercase',
      color: isDark ? theme.colors.brandLight : theme.colors.brandDark,
      textAlign: 'center',
    },
    chargingHeroTitle: {
      fontFamily: theme.typography.fontFamily.bold,
      fontSize: 26,
      fontWeight: '700',
      color: isDark ? '#FFFFFF' : theme.colors.textPrimary,
      letterSpacing: -0.3,
      textAlign: 'center',
    },
    chargingHeroMeta: {
      fontFamily: theme.typography.fontFamily.medium,
      fontSize: 14,
      color: isDark ? 'rgba(255,255,255,0.78)' : theme.colors.textMuted,
      marginTop: 2,
      textAlign: 'center',
    },
    snapshotGrid: {
      flexDirection: 'row',
      flexWrap: 'wrap',
      borderWidth: StyleSheet.hairlineWidth,
      borderColor: theme.colors.border,
      borderRadius: 12,
      overflow: 'hidden',
    },
    snapshotCell: {
      width: '50%',
      paddingVertical: 14,
      paddingHorizontal: 14,
      gap: 4,
      justifyContent: 'center',
    },
    snapshotCellBorderLeft: {
      borderLeftWidth: StyleSheet.hairlineWidth,
      borderLeftColor: theme.colors.border,
    },
    snapshotCellBorderTop: {
      borderTopWidth: StyleSheet.hairlineWidth,
      borderTopColor: theme.colors.border,
    },
    snapshotValue: {
      fontFamily: theme.typography.fontFamily.bold,
      fontSize: 17,
      fontWeight: '700',
      color: theme.colors.textPrimary,
    },
    chartHeader: {
      flexDirection: 'row',
      justifyContent: 'space-between',
      alignItems: 'flex-start',
      gap: 12,
    },
    livePill: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: 5,
    },
    livePillDot: {
      width: 6,
      height: 6,
      borderRadius: 3,
      backgroundColor: theme.colors.brand,
    },
    livePillText: {
      fontFamily: theme.typography.fontFamily.semibold,
      fontSize: 12,
      color: theme.colors.brandDark,
    },
    chartRow: {
      height: 120,
      flexDirection: 'row',
      alignItems: 'flex-end',
      gap: 6,
      paddingTop: 8,
    },
    chartBarTrack: {
      flex: 1,
      height: '100%',
      justifyContent: 'flex-end',
      borderRadius: 6,
      overflow: 'hidden',
      backgroundColor: theme.colors.iconBackground,
    },
    chartBar: {
      width: '100%',
      borderRadius: 6,
      backgroundColor: theme.colors.brand,
      minHeight: 8,
    },
    emptyState: {
      alignItems: 'center',
      paddingVertical: 48,
      gap: 10,
    },
    loadingState: {
      alignItems: 'center',
      paddingVertical: 64,
      gap: 12,
    },
    loadingTitle: {
      fontFamily: theme.typography.fontFamily.bold,
      fontSize: 18,
      fontWeight: '700',
      color: theme.colors.textPrimary,
      marginTop: 4,
    },
  });
}
