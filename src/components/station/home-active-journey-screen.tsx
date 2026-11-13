import { useMemo } from 'react';
import { ScrollView, StyleSheet, View } from 'react-native';

import { WeaveLoader } from '@/components/brand/weave-loader';
import { ChargingRing } from '@/components/charging/charging-ring';
import { QueueRings } from '@/components/charging/queue-rings';
import { Button } from '@/components/ui/button';
import { Icon } from '@/components/ui/icon';
import { StatRow, StatTile } from '@/components/ui/stat-tile';
import { Surface } from '@/components/ui/surface';
import { Text } from '@/components/ui/text';
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
  formatReadyChargerBayNumber,
  formatReadyConnectorBadge,
  getAtStationPreparationHeadline,
  getPeopleAhead,
  getQueueRank,
  homeJourneyActionLabel,
  homeJourneyActionSubtitle,
  homeJourneyStatusBadgeLabel,
  resolveHomeJourneyVisualVariant,
} from '@/utils/queue-display';

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

type JourneyStyles = ReturnType<typeof createStyles>;

/**
 * Home when the driver has an active journey (queued / arrived / ready / charging).
 * Layout: brand header → station identity → obsidian hero panel (variant body) → primary action.
 * All state decisions come from `@/utils/queue-display`; this file only presents them.
 */
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
  const { theme } = useTheme();
  const styles = useMemo(() => createStyles(theme), [theme]);
  const hasActiveSession = session?.status === 'CHARGING';
  const variant = resolveHomeJourneyVisualVariant(membership, {
    hasActiveSession,
    chargingWithoutSession: chargingWithoutSession && !hasActiveSession,
  });
  const isCharging = variant === 'charging';

  const statusLabel = homeJourneyStatusBadgeLabel(variant);
  const actionTitle = homeJourneyActionLabel(variant);
  const actionSubtitle = homeJourneyActionSubtitle(variant);

  const identitySubtitle = isCharging
    ? buildChargingIdentitySubtitle(session, membership, connectorLabel)
    : stationSubtitle?.trim() || null;

  /** Leave only while waiting in line — not after operator calls approach / assigns bay. */
  const canLeaveQueue =
    Boolean(onLeaveQueue) && !isCharging && membership?.state === 'QUEUED';

  return (
    <View style={styles.screen} accessibilityLabel={`Home journey · ${statusLabel}`}>
      <StationHeader />

      <ScrollView
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
      >
        <View style={styles.identityRow}>
          <View style={styles.identityIcon}>
            <Icon name={isCharging ? 'bolt' : 'map-pin'} size={18} color={theme.colors.primary} />
          </View>
          <View style={styles.identityCopy}>
            <Text style={styles.identityName} numberOfLines={1}>
              {stationName?.trim() || 'Charging station'}
            </Text>
            {identitySubtitle ? (
              <Text style={styles.identitySubtitle} numberOfLines={1}>
                {identitySubtitle}
              </Text>
            ) : null}
          </View>
          <View style={styles.statusBadge}>
            <View style={styles.statusDot} />
            <Text style={styles.statusText}>{statusLabel}</Text>
          </View>
        </View>

        <Surface variant="hero" padding={theme.spacing.xl} style={styles.hero}>
          {variant === 'charging' && session ? (
            <ChargingBody
              session={session}
              vehicleLabel={vehicleLabel}
              isRefreshing={isRefreshing}
              styles={styles}
            />
          ) : variant === 'ready' && membership ? (
            <ReadyBody membership={membership} connectorLabel={connectorLabel} styles={styles} />
          ) : variant === 'at-station' && membership ? (
            <ArrivedBody membership={membership} styles={styles} />
          ) : variant === 'session-pending' ? (
            <SessionPendingBody styles={styles} />
          ) : membership ? (
            <QueuedBody membership={membership} isRefreshing={isRefreshing} styles={styles} />
          ) : (
            <View style={styles.pendingWrap}>
              <WeaveLoader size={56} />
            </View>
          )}
        </Surface>

        {variant === 'queued' && membership ? <QueuedGuidance styles={styles} /> : null}
      </ScrollView>

      <View style={styles.footer}>
        {canLeaveQueue ? (
          <Button
            label="Leave queue"
            variant="tertiary"
            size="md"
            onPress={onLeaveQueue}
            loading={isLeavingQueue}
          />
        ) : null}
        <Button
          label={actionTitle}
          onPress={onOpenJourneyDetails}
          trailingIcon="chevron-forward"
          accessibilityLabel={`${actionTitle}. ${actionSubtitle}`}
        />
        <Text style={styles.actionSubtitle}>{actionSubtitle}</Text>
      </View>
    </View>
  );
}

function buildChargingIdentitySubtitle(
  session: ChargingSession | null | undefined,
  membership: QueueMember | null | undefined,
  connectorLabel?: string | null,
): string | null {
  const bay =
    formatReadyChargerBayNumber(membership?.allocation) || session?.evseLabel?.trim() || null;
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

function QueuedBody({
  membership,
  isRefreshing,
  styles,
}: {
  membership: QueueMember;
  isRefreshing: boolean;
  styles: JourneyStyles;
}) {
  const rank = getQueueRank(membership);
  const ahead = getPeopleAhead(membership);
  const wait = formatEstimatedWaitRelative(membership.estimatedTurnAt) ?? '—';

  return (
    <View style={styles.bodyCenter}>
      <QueueRings rank={rank} size={184} caption={ahead === 0 ? "You're next" : `${ahead} ahead`} />

      <StatRow onHero style={styles.fullWidth}>
        <StatTile onHero label="Drivers ahead" value={String(ahead)} />
        <StatTile onHero label="Estimated wait" value={wait} />
      </StatRow>

      <Text style={styles.heroFootnote}>
        Estimate based on the current queue · {isRefreshing ? 'Updating…' : 'Updated now'}
      </Text>
    </View>
  );
}

function QueuedGuidance({ styles }: { styles: JourneyStyles }) {
  const { theme } = useTheme();
  return (
    <Surface variant="tinted" padding={theme.spacing.lg} style={styles.guidance}>
      <View style={styles.guidanceIcon}>
        <Icon name="bell" size={18} color={theme.colors.primary} />
      </View>
      <View style={styles.guidanceCopy}>
        <Text style={styles.guidanceTitle}>Nothing to do right now</Text>
        <Text style={styles.guidanceBody}>
          Stay nearby. We’ll alert you when it’s time to arrive.
        </Text>
      </View>
    </Surface>
  );
}

function ArrivedBody({ membership, styles }: { membership: QueueMember; styles: JourneyStyles }) {
  const { theme } = useTheme();
  const headline = getAtStationPreparationHeadline(membership);

  return (
    <View style={styles.bodyCenter}>
      <View style={styles.checkWrap}>
        <View style={styles.checkRingOuter} />
        <View style={styles.checkRingInner} />
        <View style={styles.checkCore}>
          <Icon name="check" size={34} color={theme.colors.onPrimary} />
        </View>
      </View>

      <Text style={styles.heroEyebrow}>ARRIVAL CONFIRMED</Text>
      <Text style={styles.heroTitle}>You’re checked in</Text>
      <Text style={styles.heroSubtitle}>The station knows you’re here.</Text>

      <View style={styles.happening}>
        <Text style={styles.happeningLabel}>HAPPENING NOW</Text>
        <Text style={styles.happeningTitle}>{headline}</Text>
        <View style={styles.segmentRow}>
          {[0, 1, 2, 3].map((index) => (
            <View
              key={index}
              style={[styles.segment, index < 2 ? styles.segmentOn : styles.segmentOff]}
            />
          ))}
        </View>
        <Text style={styles.heroSubtitleLeft}>
          Remain in the waiting area. We’ll show your bay here as soon as it’s assigned.
        </Text>
      </View>
    </View>
  );
}

function ReadyBody({
  membership,
  connectorLabel,
  styles,
}: {
  membership: QueueMember;
  connectorLabel?: string | null;
  styles: JourneyStyles;
}) {
  const { theme } = useTheme();
  const bayRaw = formatReadyChargerBayNumber(membership.allocation);
  const bayDisplay = bayRaw ? (/^\d+$/.test(bayRaw) ? bayRaw.padStart(2, '0') : bayRaw) : '—';
  const connector =
    formatReadyConnectorBadge(membership.allocation) ||
    (connectorLabel?.trim() ? connectorLabel.trim() : null) ||
    '—';

  return (
    <View>
      <View style={styles.readyRow}>
        <View style={styles.readyBayCol}>
          <Text style={styles.heroEyebrow}>ASSIGNED BAY</Text>
          <Text style={styles.readyBayNumber}>{bayDisplay}</Text>
        </View>

        <View style={styles.readyConnectorCol}>
          <View style={styles.readyConnectorIcon}>
            <Icon name="plug" size={22} color={theme.colors.onPrimary} />
          </View>
          <Text style={styles.readyConnectorLabel}>Connector</Text>
          <Text style={styles.readyConnectorValue} numberOfLines={1}>
            {connector}
          </Text>
        </View>
      </View>

      <View style={styles.readyNext}>
        <Text style={styles.heroEyebrow}>NEXT ACTION</Text>
        <Text style={styles.readyNextTitle}>
          {bayRaw ? `Go to Bay ${bayRaw} and plug in` : 'Go to your bay and plug in'}
        </Text>
        <Text style={styles.heroSubtitleLeft}>
          Follow the bay signs. Charging will begin only after the charger confirms your
          connection.
        </Text>
      </View>
    </View>
  );
}

function SessionPendingBody({ styles }: { styles: JourneyStyles }) {
  return (
    <View style={styles.pendingWrap}>
      <WeaveLoader size={64} />
      <Text style={styles.heroTitle}>Linking your charger</Text>
      <Text style={styles.heroSubtitle}>
        Your bay is ready. We’re confirming the charging session with the station.
      </Text>
    </View>
  );
}

function ChargingBody({
  session,
  vehicleLabel,
  isRefreshing,
  styles,
}: {
  session: ChargingSession;
  vehicleLabel?: string | null;
  isRefreshing: boolean;
  styles: JourneyStyles;
}) {
  const power = splitPower(formatPowerKw(session.averagePowerKw ?? session.maxPowerKw));
  const energy =
    session.energyKwh != null && !Number.isNaN(session.energyKwh)
      ? { value: session.energyKwh.toFixed(1), unit: 'kWh' }
      : { value: '—', unit: undefined };
  const duration = formatHomeJourneyDuration(session.durationSeconds, session.startedAt);
  const vehicle = vehicleLabel?.trim() || session.vehicleLabel?.trim() || '—';

  return (
    <View style={styles.bodyCenter}>
      <View style={styles.livePill}>
        <View style={styles.liveDot} />
        <Text style={styles.liveText}>{isRefreshing ? 'LIVE · UPDATING' : 'LIVE · UPDATED NOW'}</Text>
      </View>

      <ChargingRing
        value={power.value}
        unit={power.unit ?? 'kW'}
        caption="Live power"
        size={208}
        live
        onHero
      />

      <StatRow onHero style={styles.fullWidth}>
        <StatTile onHero label="Delivered" value={energy.value} unit={energy.unit} />
        <StatTile onHero label="Duration" value={!duration || duration === EMPTY_METRIC ? '—' : duration} />
        <StatTile onHero label="Vehicle" value={vehicle} />
      </StatRow>
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

function createStyles(theme: AppTheme) {
  const c = theme.colors;
  const font = theme.typography.fontFamily;

  return StyleSheet.create({
    screen: { flex: 1, backgroundColor: c.background },
    scrollContent: { paddingBottom: theme.spacing.lg },
    identityRow: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: 12,
      paddingHorizontal: EDGE,
      paddingTop: 20,
      paddingBottom: 14,
    },
    identityIcon: {
      width: 44,
      height: 44,
      borderRadius: 16,
      alignItems: 'center',
      justifyContent: 'center',
      backgroundColor: c.primaryMuted,
    },
    identityCopy: { flex: 1, gap: 2, minWidth: 0 },
    identityName: {
      fontFamily: font.brand,
      fontSize: 18,
      letterSpacing: -0.4,
      color: c.textPrimary,
    },
    identitySubtitle: { fontFamily: font.regular, fontSize: 12, color: c.textMuted },
    statusBadge: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: 6,
      paddingHorizontal: 10,
      paddingVertical: 6,
      borderRadius: theme.radius.pill,
      backgroundColor: c.statusAvailableBg,
    },
    statusDot: { width: 7, height: 7, borderRadius: 4, backgroundColor: c.statusDot },
    statusText: { fontFamily: font.bold, fontSize: 12, color: c.statusAvailable },
    hero: { marginHorizontal: EDGE },
    guidance: {
      marginHorizontal: EDGE,
      marginTop: theme.spacing.md,
      flexDirection: 'row',
      alignItems: 'center',
      gap: 12,
    },
    guidanceIcon: {
      width: 38,
      height: 38,
      borderRadius: 14,
      alignItems: 'center',
      justifyContent: 'center',
      backgroundColor: c.primarySoft,
    },
    guidanceCopy: { flex: 1, gap: 2 },
    guidanceTitle: { fontFamily: font.bold, fontSize: 14, color: c.textPrimary },
    guidanceBody: { fontFamily: font.regular, fontSize: 12, lineHeight: 17, color: c.textSecondary },
    footer: {
      paddingHorizontal: EDGE,
      paddingTop: theme.spacing.sm,
      paddingBottom: theme.spacing.sm,
      gap: theme.spacing.sm,
    },
    actionSubtitle: {
      fontFamily: font.regular,
      fontSize: 12,
      color: c.textMuted,
      textAlign: 'center',
    },

    bodyCenter: { alignItems: 'center', gap: theme.spacing.xl },
    fullWidth: { alignSelf: 'stretch' },
    heroFootnote: { fontFamily: font.regular, fontSize: 11, color: c.heroTextMuted, textAlign: 'center' },
    heroEyebrow: { fontFamily: font.bold, fontSize: 11, letterSpacing: 1.3, color: c.heroAccent },
    heroTitle: {
      fontFamily: font.brand,
      fontSize: 20,
      letterSpacing: -0.6,
      color: c.heroText,
      textAlign: 'center',
    },
    heroSubtitle: {
      fontFamily: font.regular,
      fontSize: 14,
      lineHeight: 20,
      color: c.heroTextMuted,
      textAlign: 'center',
    },
    heroSubtitleLeft: { fontFamily: font.regular, fontSize: 13, lineHeight: 19, color: c.heroTextMuted },

    livePill: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: 6,
      paddingHorizontal: 12,
      paddingVertical: 6,
      borderRadius: theme.radius.pill,
      backgroundColor: 'rgba(16, 185, 129, 0.16)',
    },
    liveDot: { width: 6, height: 6, borderRadius: 3, backgroundColor: c.secondary },
    liveText: { fontFamily: font.extrabold, fontSize: 10, letterSpacing: 1, color: c.secondary },

    checkWrap: { width: 156, height: 156, alignItems: 'center', justifyContent: 'center' },
    checkRingOuter: {
      position: 'absolute',
      width: 156,
      height: 156,
      borderRadius: 78,
      borderWidth: 1.5,
      borderColor: c.heroBorder,
    },
    checkRingInner: {
      position: 'absolute',
      width: 120,
      height: 120,
      borderRadius: 60,
      borderWidth: 1.5,
      borderColor: c.secondary,
      opacity: 0.45,
    },
    checkCore: {
      width: 80,
      height: 80,
      borderRadius: 40,
      alignItems: 'center',
      justifyContent: 'center',
      backgroundColor: c.primary,
    },
    happening: {
      alignSelf: 'stretch',
      gap: 8,
      padding: theme.spacing.lg,
      borderRadius: theme.radius.xl,
      backgroundColor: c.heroSurface,
    },
    happeningLabel: { fontFamily: font.bold, fontSize: 11, letterSpacing: 1.3, color: c.heroAccent },
    happeningTitle: { fontFamily: font.brand, fontSize: 18, letterSpacing: -0.3, color: c.heroText },
    segmentRow: { flexDirection: 'row', gap: 6, marginVertical: 4 },
    segment: { flex: 1, height: 6, borderRadius: 3 },
    segmentOn: { backgroundColor: c.secondary },
    segmentOff: { backgroundColor: c.heroBorder },

    readyRow: { flexDirection: 'row', alignItems: 'center', gap: theme.spacing.lg, marginBottom: theme.spacing.xl },
    readyBayCol: { flex: 1, gap: 4 },
    readyBayNumber: {
      fontFamily: font.brand,
      fontSize: 76,
      lineHeight: 82,
      letterSpacing: -3,
      color: c.heroText,
    },
    readyConnectorCol: {
      width: 112,
      alignItems: 'center',
      gap: 8,
      padding: theme.spacing.md,
      borderRadius: theme.radius.xl,
      backgroundColor: c.heroSurface,
    },
    readyConnectorIcon: {
      width: 48,
      height: 48,
      borderRadius: 16,
      alignItems: 'center',
      justifyContent: 'center',
      backgroundColor: c.primary,
    },
    readyConnectorLabel: { fontFamily: font.medium, fontSize: 11, color: c.heroTextMuted },
    readyConnectorValue: { fontFamily: font.brand, fontSize: 16, color: c.heroText },
    readyNext: {
      gap: 8,
      paddingTop: theme.spacing.lg,
      borderTopWidth: StyleSheet.hairlineWidth,
      borderTopColor: c.heroBorder,
    },
    readyNextTitle: { fontFamily: font.brand, fontSize: 20, letterSpacing: -0.4, color: c.heroText },

    pendingWrap: { alignItems: 'center', justifyContent: 'center', gap: 14, paddingVertical: 12 },
  });
}
