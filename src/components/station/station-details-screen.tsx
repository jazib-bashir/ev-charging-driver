import { Image } from 'expo-image';
import { router, type Href } from 'expo-router';
import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import {
  Alert,
  Pressable,
  RefreshControl,
  ScrollView,
  Share,
  StyleSheet,
  View,
  useWindowDimensions,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { Text } from '@/components/ui/text';
import { AuthApiError, resolveHasDefaultVehicle, resolveIsOnboarded } from '@/api/auth';
import { fetchPublicChargers } from '@/api/publicChargers';
import {
  findActiveMembershipForStation,
  leaveQueueMember,
  listDriverQueueMembers,
} from '@/api/stationQueue';
import { useAuth } from '@/auth/auth-context';
import { ActiveSessionCard } from '@/components/charging-session/active-session-card';
import { useActiveChargingSession } from '@/hooks/use-active-charging-session';
import {
  useDebouncedGridflowRealtimeHandler,
  useGridflowRealtimeReconnectSnapshot,
  useGridflowRealtimeStation,
} from '@/realtime/gridflow-realtime-provider';
import { GridflowRealtimeEventKind } from '@/realtime/gridflow-realtime-types';
import { AvailabilityMeter } from '@/components/charging/availability-meter';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { EmptyState, ErrorState } from '@/components/ui/empty-state';
import { Icon } from '@/components/ui/icon';
import { IconBadge } from '@/components/ui/icon-badge';
import { Surface } from '@/components/ui/surface';
import { ScreenContainer } from '@/components/ui/screen-container';
import { resolveStationAmenities } from '@/constants/station-amenities';
import { getStationImageSource } from '@/data/station-images';
import { useStationDetails } from '@/hooks/use-station-details';
import { useTheme } from '@/theme';
import type { Charger } from '@/types/charger';
import type { QueueMember } from '@/types/queue';
import { formatCurrencyAmount } from '@/utils/charging-session-format';
import { requestQueueMembershipRefresh } from '@/utils/queue-membership-refresh';
import { showUserAlert } from '@/utils/user-prompt';
import { openStationNavigation } from '@/utils/open-station-navigation';
import {
  formatText,
  getStationAddress,
  getStationStatus,
} from '@/utils/station';

import { ChargerDetailsSheet } from './charger-details-sheet';
import { QueueBookingConfirmationSheet } from './queue-booking-confirmation-sheet';
import { QueueJoinSheet } from './queue-join-sheet';
import { QueueStatusCard } from './queue-status-card';
import { StationAmenitiesSection } from './station-amenities-section';
import { StationChargersSection } from './station-chargers-section';
import { StationDetailsBackChrome } from './station-details-back-chrome';
import { StationDetailsLoadingState } from './station-details-loading-state';

const TABLET_BREAKPOINT = 768;
const MAX_CONTENT_WIDTH = 720;
const HERO_HEIGHT = 260;
const LAYOUT_EDGE = 20;
const SECTION_GAP = 16;

type StationDetailsScreenProps = {
  stationId: string;
  resumeChargerId?: string;
  resumeBooking?: boolean;
};

function StationNotFoundState({ onBack }: { onBack: () => void }) {
  return (
    <EmptyState
      title="Station not found"
      message="This station may have been removed or is no longer available."
      iconName="search-off"
      primaryActionLabel="Go back"
      onPrimaryAction={onBack}
    />
  );
}

function StationErrorState({ onRetry }: { onRetry: () => void }) {
  return (
    <ErrorState
      title="Unable to load station"
      message="Please check your connection and try again."
      primaryActionLabel="Retry"
      onPrimaryAction={onRetry}
    />
  );
}

function showBookingComingSoonAlert() {
  Alert.alert(
    'Booking coming soon',
    'Booking will be available soon.',
  );
}

function StationDetailsContent({
  stationId,
  resumeChargerId,
  resumeBooking = false,
}: StationDetailsScreenProps) {
  const { theme } = useTheme();
  const styles = useMemo(() => createStyles(theme), [theme]);
  const insets = useSafeAreaInsets();
  const { width } = useWindowDimensions();
  const isTablet = width >= TABLET_BREAKPOINT;
  const {
    token,
    ensureAuthenticatedUser,
    setPendingBooking,
    refreshUser,
    isLoading: isAuthLoading,
  } = useAuth();

  const {
    station,
    chargers,
    isStationLoading,
    isStationError,
    isStationNotFound,
    isChargersLoading,
    isChargersError,
    retryStation,
    retryChargers,
    refresh: refreshStationDetails,
  } = useStationDetails(stationId);

  const [selectedCharger, setSelectedCharger] = useState<Charger | null>(null);
  const [isSheetVisible, setIsSheetVisible] = useState(false);
  const [isQueueSheetVisible, setIsQueueSheetVisible] = useState(false);
  const [isOpeningQueue, setIsOpeningQueue] = useState(false);
  const [queueMembership, setQueueMembership] = useState<QueueMember | null>(null);
  const [isMembershipLoading, setIsMembershipLoading] = useState(false);
  const [isPullRefreshing, setIsPullRefreshing] = useState(false);
  const [isLeavingQueue, setIsLeavingQueue] = useState(false);
  const [queueConfirmationMember, setQueueConfirmationMember] =
    useState<QueueMember | null>(null);
  const [activeConnectorLabel, setActiveConnectorLabel] = useState<string>();
  const resumeHandledRef = useRef(false);

  const {
    session: activeChargingSession,
    refresh: refreshActiveChargingSession,
  } = useActiveChargingSession({ token });

  const stationActiveSession =
    activeChargingSession?.stationId === stationId ? activeChargingSession : null;

  const handleBack = () => {
    if (router.canGoBack()) {
      router.back();
      return;
    }

    router.replace('/');
  };

  const handleShare = useCallback(async () => {
    if (!station) {
      return;
    }

    const address = getStationAddress(station);
    const message = address
      ? `${station.name}\n${address}`
      : station.name;

    try {
      await Share.share({ message });
    } catch {
      // User cancelled or share unavailable.
    }
  }, [station]);

  const openChargerSheet = useCallback((charger: Charger) => {
    setSelectedCharger(charger);
    setIsSheetVisible(true);
  }, []);

  const closeChargerSheet = useCallback(() => {
    setIsSheetVisible(false);
  }, []);

  const loadQueueMembership = useCallback(
    async (options?: { silent?: boolean }) => {
      if (!token) {
        setQueueMembership(null);
        setIsMembershipLoading(false);
        return;
      }

      if (!options?.silent) {
        setIsMembershipLoading(true);
      }
      try {
        const members = await listDriverQueueMembers(token);
        setQueueMembership(findActiveMembershipForStation(members, stationId));
      } catch {
        // Keep prior membership if refresh fails; join UX still works from local state.
      } finally {
        if (!options?.silent) {
          setIsMembershipLoading(false);
        }
      }
    },
    [token, stationId],
  );

  const handlePullRefresh = useCallback(async () => {
    setIsPullRefreshing(true);
    try {
      await Promise.all([
        refreshStationDetails(),
        loadQueueMembership({ silent: true }),
        refreshActiveChargingSession({ showLoading: false }),
      ]);
    } finally {
      setIsPullRefreshing(false);
    }
  }, [loadQueueMembership, refreshActiveChargingSession, refreshStationDetails]);

  useGridflowRealtimeStation(stationId);

  useDebouncedGridflowRealtimeHandler(
    useCallback(
      (event) => {
        if (event.stationId && event.stationId !== stationId) {
          return;
        }

        if (
          event.kind === GridflowRealtimeEventKind.QUEUE_MEMBERSHIP ||
          event.kind === GridflowRealtimeEventKind.STATION_QUEUE ||
          event.kind === GridflowRealtimeEventKind.STATION_ALLOCATION
        ) {
          void loadQueueMembership({ silent: true });
        }

        if (event.kind === GridflowRealtimeEventKind.ACTIVE_SESSION) {
          void refreshActiveChargingSession({ showLoading: false });
        }
      },
      [loadQueueMembership, refreshActiveChargingSession, stationId],
    ),
  );

  useGridflowRealtimeReconnectSnapshot(
    useCallback(() => {
      void loadQueueMembership({ silent: true });
      void refreshActiveChargingSession({ showLoading: false });
    }, [loadQueueMembership, refreshActiveChargingSession]),
  );

  useEffect(() => {
    void loadQueueMembership();
  }, [loadQueueMembership]);

  useEffect(() => {
    if (!stationActiveSession) {
      setActiveConnectorLabel(undefined);
      return;
    }

    void (async () => {
      try {
        const chargers = await fetchPublicChargers({
          stationId: stationActiveSession.stationId,
        });
        const charger = chargers.data.find(
          (item) => item.id === stationActiveSession.chargerId,
        );
        const connector = charger?.connectors?.find(
          (item) => item.id === stationActiveSession.connectorId,
        );
        setActiveConnectorLabel(
          connector
            ? `${connector.displayName ?? connector.connectorType} #${connector.connectorNumber ?? ''}`
            : stationActiveSession.connectorId,
        );
      } catch {
        setActiveConnectorLabel(stationActiveSession.connectorId);
      }
    })();
  }, [stationActiveSession]);

  const handleJoinQueuePress = useCallback(async () => {
    if (isOpeningQueue || queueMembership || !station?.queue) {
      return;
    }

    setIsOpeningQueue(true);

    try {
      let user = await ensureAuthenticatedUser();

      if (!user) {
        router.push('/auth' as Href);
        return;
      }

      user = (await refreshUser()) ?? user;

      if (!user) {
        Alert.alert(
          'Unable to book queue',
          'We could not verify your account. Please try again.',
        );
        return;
      }

      if (!resolveIsOnboarded(user)) {
        router.push('/auth/onboarding' as Href);
        return;
      }

      setIsQueueSheetVisible(true);
    } catch {
      Alert.alert(
        'Unable to book queue',
        'Something went wrong while preparing your queue request. Please try again.',
      );
    } finally {
      setIsOpeningQueue(false);
    }
  }, [
    isOpeningQueue,
    queueMembership,
    station?.queue,
    ensureAuthenticatedUser,
    refreshUser,
  ]);

  const handleQueueJoined = useCallback(
    (member: QueueMember) => {
      setQueueMembership(member);
      retryStation();
      void loadQueueMembership();
      // Keep Home journey hooks in sync so Queued Home appears after Done / tab switch.
      requestQueueMembershipRefresh();
      void refreshUser();
      setQueueConfirmationMember(member);
    },
    [loadQueueMembership, refreshUser, retryStation],
  );

  const handleQueueConfirmationDone = useCallback(() => {
    setQueueConfirmationMember(null);
    // One refresh path — Home soft-load cooldown collapses focus + subscription storms.
    requestQueueMembershipRefresh();
    void refreshUser();
    router.replace('/' as Href);
  }, [refreshUser]);

  const handleLeaveQueue = useCallback(async () => {
    if (!token || !queueMembership || isLeavingQueue) {
      return;
    }

    setIsLeavingQueue(true);

    try {
      await leaveQueueMember(token, queueMembership.id);
      setQueueMembership(null);
      requestQueueMembershipRefresh();
      void refreshUser();
      retryStation();
      void loadQueueMembership();
      showUserAlert('Left queue', 'You have been removed from the station queue.');
    } catch (error) {
      const message =
        error instanceof AuthApiError && error.message
          ? error.message
          : 'Please try again.';
      showUserAlert('Unable to leave queue', message);
    } finally {
      setIsLeavingQueue(false);
    }
  }, [
    token,
    queueMembership,
    isLeavingQueue,
    retryStation,
    loadQueueMembership,
    refreshUser,
  ]);

  const completeBookingPlaceholder = useCallback(() => {
    setPendingBooking(null);
    showBookingComingSoonAlert();
  }, [setPendingBooking]);

  useEffect(() => {
    if (
      resumeHandledRef.current ||
      !resumeBooking ||
      !resumeChargerId ||
      isAuthLoading ||
      isChargersLoading ||
      chargers.length === 0
    ) {
      return;
    }

    const charger = chargers.find((item) => item.id === resumeChargerId);
    if (!charger) {
      resumeHandledRef.current = true;
      setPendingBooking(null);
      return;
    }

    resumeHandledRef.current = true;
    openChargerSheet(charger);

    (async () => {
      try {
        let user = await ensureAuthenticatedUser();
        if (!user) {
          router.push('/auth' as Href);
          return;
        }

        user = (await refreshUser()) ?? user;

        if (!user) {
          Alert.alert(
            'Unable to book',
            'We could not verify your account. Please try again.',
          );
          return;
        }

        if (!resolveIsOnboarded(user)) {
          router.push('/auth/onboarding' as Href);
          return;
        }

        if (!resolveHasDefaultVehicle(user)) {
          router.push('/auth/vehicles' as Href);
          return;
        }

        completeBookingPlaceholder();
      } catch {
        Alert.alert(
          'Unable to book',
          'Something went wrong while starting your booking. Please try again.',
        );
      }
    })();
  }, [
    resumeBooking,
    resumeChargerId,
    isAuthLoading,
    isChargersLoading,
    chargers,
    openChargerSheet,
    ensureAuthenticatedUser,
    refreshUser,
    completeBookingPlaceholder,
    setPendingBooking,
  ]);

  if (isStationLoading) {
    return (
      <ScreenContainer edges={['bottom']} style={styles.screen}>
        <StationDetailsLoadingState onBack={handleBack} />
      </ScreenContainer>
    );
  }

  if (isStationError) {
    return (
      <ScreenContainer edges={['bottom']} style={styles.screen}>
        <StationDetailsBackChrome onBack={handleBack} placement="bar" />
        <StationErrorState onRetry={retryStation} />
      </ScreenContainer>
    );
  }

  if (isStationNotFound || !station) {
    return (
      <ScreenContainer edges={['bottom']} style={styles.screen}>
        <StationDetailsBackChrome onBack={handleBack} placement="bar" />
        <StationNotFoundState onBack={handleBack} />
      </ScreenContainer>
    );
  }

  const status = getStationStatus(station);
  const address = getStationAddress(station);
  const imageSource = getStationImageSource(station);
  const priceAmount = formatCurrencyAmount(
    station.defaultPricePerKwh,
    station.currency,
  );
  const hasPrice =
    station.defaultPricePerKwh !== null &&
    station.defaultPricePerKwh !== undefined;
  const canNavigate =
    typeof station.latitude === 'number' && typeof station.longitude === 'number';
  const amenities = resolveStationAmenities(station.amenities);
  const heroTopPad = Math.max(insets.top, 12);

  return (
    <ScreenContainer edges={['bottom']} style={styles.screen}>
      <ScrollView
        showsVerticalScrollIndicator={false}
        contentContainerStyle={[
          styles.scrollContent,
          isTablet && styles.scrollContentTablet,
        ]}
        refreshControl={
          <RefreshControl
            refreshing={isPullRefreshing}
            onRefresh={() => {
              void handlePullRefresh();
            }}
            tintColor={theme.colors.primary}
            colors={[theme.colors.primary]}
          />
        }
      >
        <View style={styles.heroContainer}>
          <Image
            source={imageSource}
            style={styles.heroImage}
            contentFit="cover"
            transition={200}
          />
          <View style={styles.heroScrim} pointerEvents="none" />

          <View style={[styles.heroChrome, { paddingTop: heroTopPad }]}>
            <Pressable
              onPress={handleBack}
              style={({ pressed }) => [
                styles.heroIconButton,
                pressed && styles.heroIconButtonPressed,
              ]}
              accessibilityRole="button"
              accessibilityLabel="Go back"
              hitSlop={6}
            >
              <Icon name="back" size={22} color={theme.colors.heroText} />
            </Pressable>

            <Pressable
              onPress={() => {
                void handleShare();
              }}
              style={({ pressed }) => [
                styles.heroIconButton,
                pressed && styles.heroIconButtonPressed,
              ]}
              accessibilityRole="button"
              accessibilityLabel="Share station"
              hitSlop={6}
            >
              <Icon name="share" size={20} color={theme.colors.heroText} />
            </Pressable>
          </View>

          <View style={styles.verifiedBadge}>
            <Icon name="shield" size={12} color={theme.colors.secondary} />
            <Text style={styles.verifiedText}>konnectEVS Verified</Text>
          </View>
        </View>

        <View style={styles.summarySection}>
          <View style={styles.identityBlock}>
            <Text style={styles.stationName} numberOfLines={2}>
              {formatText(station.name)}
            </Text>

            <View style={styles.addressRow}>
              <Icon name="map-pin" size={14} color={theme.colors.textMuted} />
              <Text style={styles.addressText} numberOfLines={2}>
                {formatText(address)}
              </Text>
            </View>
          </View>

          <View style={styles.infoTileRow}>
            <View style={styles.infoTile}>
              <Text style={styles.infoTileLabel}>STATUS</Text>
              <Badge
                label={status.label}
                variant={status.variant}
                showDot={status.variant === 'available'}
                style={styles.statusBadge}
              />
            </View>

            <View style={styles.infoTile}>
              <Text style={styles.infoTileLabel}>PRICING</Text>
              <View style={styles.priceRow}>
                <Text style={styles.priceValue}>{priceAmount}</Text>
                {hasPrice ? <Text style={styles.priceUnit}>/kWh</Text> : null}
              </View>
            </View>
          </View>

          {typeof station.totalEvses === 'number' &&
          typeof station.availableEvses === 'number' &&
          station.totalEvses > 0 ? (
            <Surface variant="card" padding={16}>
              <AvailabilityMeter
                available={station.availableEvses}
                total={station.totalEvses}
              />
            </Surface>
          ) : null}

          <Button
            label="Navigate to Station"
            variant="secondary"
            leadingIcon="navigate"
            disabled={!canNavigate}
            onPress={() => openStationNavigation(station)}
            accessibilityLabel={`Navigate to ${station.name}`}
          />

          <View style={styles.queueSection}>
            {stationActiveSession ? (
              <ActiveSessionCard
                session={stationActiveSession}
                stationName={station.name}
                connectorLabel={activeConnectorLabel}
                variant="compact"
                onPress={() =>
                  router.push(
                    `/sessions/${encodeURIComponent(stationActiveSession.id)}` as Href,
                  )
                }
              />
            ) : null}

            {!stationActiveSession && queueMembership ? (
              <QueueStatusCard
                membership={queueMembership}
                isLeaving={isLeavingQueue}
                onLeave={() => {
                  void handleLeaveQueue();
                }}
              />
            ) : !stationActiveSession && station.queue ? (
              <Surface variant="tinted" padding={18} style={styles.bookQueueCard}>
                <View style={styles.bookQueueHeader}>
                  <IconBadge name="list" tone="primary" size={40} />
                  <View style={styles.bookQueueCopy}>
                    <Text style={styles.bookQueueTitle}>Queue available</Text>
                    <Text style={styles.bookQueueSubtitle}>
                      Reserve your spot and get notified when a charger is ready.
                    </Text>
                  </View>
                  <Badge label="Open" variant="available" showDot />
                </View>
                <Button
                  label="Book Queue Position"
                  leadingIcon="list"
                  loading={isOpeningQueue || isMembershipLoading}
                  onPress={() => {
                    void handleJoinQueuePress();
                  }}
                  accessibilityLabel="Book queue position"
                />
              </Surface>
            ) : !stationActiveSession ? (
              <Surface variant="sunken" padding={16} style={styles.queueUnavailableCard}>
                <Icon name="list" size={18} color={theme.colors.textMuted} />
                <View style={styles.queueUnavailableCopy}>
                  <Text style={styles.queueUnavailableTitle}>Queue not available</Text>
                  <Text style={styles.queueUnavailableSubtitle}>
                    This station is not accepting queue bookings right now.
                  </Text>
                </View>
              </Surface>
            ) : null}
          </View>
        </View>

        <StationAmenitiesSection amenities={amenities} />

        <StationChargersSection
          chargers={chargers}
          isLoading={isChargersLoading}
          isError={isChargersError}
          onRetry={retryChargers}
          onViewCharger={openChargerSheet}
        />
      </ScrollView>

      <ChargerDetailsSheet
        visible={isSheetVisible}
        charger={selectedCharger}
        stationName={station.name}
        stationDefaultPricePerKwh={station.defaultPricePerKwh}
        stationCurrency={station.currency}
        onClose={closeChargerSheet}
      />

      <QueueJoinSheet
        visible={isQueueSheetVisible}
        stationId={stationId}
        stationName={station.name}
        authToken={token}
        onClose={() => setIsQueueSheetVisible(false)}
        onJoined={handleQueueJoined}
      />

      <QueueBookingConfirmationSheet
        visible={queueConfirmationMember !== null}
        stationName={station.name}
        member={queueConfirmationMember}
        onConfirm={handleQueueConfirmationDone}
      />
    </ScreenContainer>
  );
}

export function StationDetailsScreen(props: StationDetailsScreenProps) {
  return <StationDetailsContent {...props} />;
}

function createStyles(theme: ReturnType<typeof useTheme>['theme']) {
  return StyleSheet.create({
    screen: {
      backgroundColor: theme.colors.background,
    },
    scrollContent: {
      paddingBottom: theme.spacing.xxxl,
    },
    scrollContentTablet: {
      alignSelf: 'center',
      width: '100%',
      maxWidth: MAX_CONTENT_WIDTH,
    },
    heroContainer: {
      position: 'relative',
      height: HERO_HEIGHT,
      backgroundColor: theme.colors.placeholder,
    },
    heroImage: {
      width: '100%',
      height: '100%',
    },
    heroScrim: {
      ...StyleSheet.absoluteFill,
      backgroundColor: 'rgba(13, 17, 23, 0.22)',
    },
    heroChrome: {
      position: 'absolute',
      top: 0,
      left: 0,
      right: 0,
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'space-between',
      paddingHorizontal: LAYOUT_EDGE,
      paddingBottom: 8,
    },
    heroIconButton: {
      width: 42,
      height: 42,
      borderRadius: 16,
      alignItems: 'center',
      justifyContent: 'center',
      backgroundColor: 'rgba(13, 17, 23, 0.55)',
      borderWidth: StyleSheet.hairlineWidth,
      borderColor: 'rgba(255, 255, 255, 0.22)',
    },
    heroIconButtonPressed: {
      opacity: 0.85,
    },
    verifiedBadge: {
      position: 'absolute',
      right: LAYOUT_EDGE,
      bottom: 14,
      flexDirection: 'row',
      alignItems: 'center',
      gap: 6,
      paddingHorizontal: 10,
      paddingVertical: 6,
      borderRadius: theme.radius.pill,
      backgroundColor: 'rgba(13, 17, 23, 0.72)',
      borderWidth: StyleSheet.hairlineWidth,
      borderColor: 'rgba(16, 185, 129, 0.45)',
    },
    verifiedText: {
      fontFamily: theme.typography.fontFamily.semibold,
      fontSize: 11,
      lineHeight: 16,
      color: theme.colors.heroText,
    },
    summarySection: {
      paddingHorizontal: LAYOUT_EDGE,
      paddingTop: SECTION_GAP,
      gap: SECTION_GAP,
    },
    identityBlock: {
      gap: 8,
    },
    stationName: {
      fontFamily: theme.typography.fontFamily.brand,
      fontSize: 20,
      lineHeight: 32,
      color: theme.colors.textPrimary,
      letterSpacing: -0.8,
    },
    addressRow: {
      flexDirection: 'row',
      alignItems: 'flex-start',
      gap: 6,
    },
    addressText: {
      flex: 1,
      fontFamily: theme.typography.fontFamily.regular,
      fontSize: 13,
      lineHeight: 19.5,
      color: theme.colors.textMuted,
    },
    infoTileRow: {
      flexDirection: 'row',
      gap: 12,
    },
    infoTile: {
      flex: 1,
      backgroundColor: theme.colors.surface,
      borderRadius: theme.radius.xl,
      borderWidth: StyleSheet.hairlineWidth,
      borderColor: theme.colors.border,
      paddingHorizontal: 16,
      paddingVertical: 14,
      gap: 8,
      ...(theme.isDark ? theme.shadows.none : theme.shadows.card),
    },
    statusBadge: {
      alignSelf: 'flex-start',
    },
    bookQueueCopy: {
      flex: 1,
      gap: 4,
    },
    infoTileLabel: {
      fontFamily: theme.typography.fontFamily.regular,
      fontSize: 11,
      lineHeight: 16.5,
      letterSpacing: 0.6,
      color: theme.colors.textMuted,
    },
    priceRow: {
      flexDirection: 'row',
      alignItems: 'baseline',
      gap: 4,
      flexWrap: 'wrap',
    },
    priceValue: {
      fontFamily: theme.typography.fontFamily.bold,
      fontSize: 15,
      lineHeight: 22.5,
      color: theme.colors.textPrimary,
    },
    priceUnit: {
      fontFamily: theme.typography.fontFamily.regular,
      fontSize: 12,
      lineHeight: 18,
      color: theme.colors.textMuted,
    },
    queueSection: {
      gap: SECTION_GAP,
    },
    bookQueueCard: {
      gap: 16,
    },
    bookQueueHeader: {
      flexDirection: 'row',
      alignItems: 'flex-start',
      gap: 12,
    },
    bookQueueTitle: {
      fontFamily: theme.typography.fontFamily.brand,
      fontSize: 16,
      letterSpacing: -0.3,
      color: theme.colors.textPrimary,
    },
    bookQueueSubtitle: {
      fontFamily: theme.typography.fontFamily.regular,
      fontSize: 13,
      lineHeight: 19,
      color: theme.colors.textSecondary,
    },
    queueUnavailableCard: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: 12,
    },
    queueUnavailableCopy: {
      flex: 1,
      gap: 4,
    },
    queueUnavailableTitle: {
      fontFamily: theme.typography.fontFamily.semibold,
      fontSize: 15,
      lineHeight: 22,
      color: theme.colors.textSecondary,
    },
    queueUnavailableSubtitle: {
      fontFamily: theme.typography.fontFamily.regular,
      fontSize: 13,
      lineHeight: 19.5,
      color: theme.colors.textMuted,
    },
  });
}
