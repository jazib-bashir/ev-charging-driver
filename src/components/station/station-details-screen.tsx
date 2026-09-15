import { Image } from 'expo-image';
import { router, useFocusEffect, type Href } from 'expo-router';
import { useCallback, useEffect, useRef, useState } from 'react';
import {
  ActivityIndicator,
  Alert,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  View,
  useWindowDimensions,
} from 'react-native';

import { resolveHasDefaultVehicle, resolveIsOnboarded } from '@/api/auth';
import { fetchPublicChargers } from '@/api/publicChargers';
import {
  findActiveMembershipForStation,
  leaveQueueMember,
  listDriverQueueMembers,
} from '@/api/stationQueue';
import { useAuth } from '@/auth/auth-context';
import { ActiveSessionCard } from '@/components/charging-session/active-session-card';
import { useActiveChargingSession } from '@/hooks/use-active-charging-session';
import { Icon } from '@/components/ui/icon';
import { ScreenContainer } from '@/components/ui/screen-container';
import { getStationImageSource } from '@/data/station-images';
import { useStationDetails } from '@/hooks/use-station-details';
import { theme } from '@/theme';
import type { Charger } from '@/types/charger';
import type { QueueMember } from '@/types/queue';
import { getQueueRank } from '@/utils/queue-display';
import {
  formatDetailDistance,
  formatDetailPricePerKwh,
} from '@/utils/charger';
import {
  formatText,
  getStationAddress,
  getStationStatus,
  hasValue,
} from '@/utils/station';

import { ChargerDetailsSheet } from './charger-details-sheet';
import { QueueJoinSheet } from './queue-join-sheet';
import { QueueStatusCard } from './queue-status-card';
import { StationAmenitiesSection } from './station-amenities-section';
import { StationChargersSection } from './station-chargers-section';
import { StationDetailsHeader } from './station-details-header';
import { StationDetailsLoadingState } from './station-details-loading-state';

const TABLET_BREAKPOINT = 768;
const MAX_CONTENT_WIDTH = 720;
const HERO_HEIGHT = 220;

type StationDetailsScreenProps = {
  stationId: string;
  resumeChargerId?: string;
  resumeBooking?: boolean;
};

function StationNotFoundState({ onBack }: { onBack: () => void }) {
  return (
    <View style={styles.centeredState}>
      <Text style={styles.stateTitle}>Station not found</Text>
      <Pressable
        style={styles.stateButton}
        onPress={onBack}
        accessibilityRole="button"
        accessibilityLabel="Go back"
      >
        <Text style={styles.stateButtonText}>Go Back</Text>
      </Pressable>
    </View>
  );
}

function StationErrorState({ onRetry }: { onRetry: () => void }) {
  return (
    <View style={styles.centeredState}>
      <Text style={styles.stateTitle}>Unable to load station</Text>
      <Text style={styles.stateMessage}>
        Please check your connection and try again.
      </Text>
      <Pressable
        style={styles.stateButton}
        onPress={onRetry}
        accessibilityRole="button"
        accessibilityLabel="Retry loading station"
      >
        <Text style={styles.stateButtonText}>Retry</Text>
      </Pressable>
    </View>
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
  } = useStationDetails(stationId);

  const [selectedCharger, setSelectedCharger] = useState<Charger | null>(null);
  const [isSheetVisible, setIsSheetVisible] = useState(false);
  const [isBooking, setIsBooking] = useState(false);
  const [isQueueSheetVisible, setIsQueueSheetVisible] = useState(false);
  const [isOpeningQueue, setIsOpeningQueue] = useState(false);
  const [queueMembership, setQueueMembership] = useState<QueueMember | null>(null);
  const [isMembershipLoading, setIsMembershipLoading] = useState(false);
  const [isLeavingQueue, setIsLeavingQueue] = useState(false);
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

  const openChargerSheet = useCallback((charger: Charger) => {
    setSelectedCharger(charger);
    setIsSheetVisible(true);
  }, []);

  const closeChargerSheet = useCallback(() => {
    setIsSheetVisible(false);
  }, []);

  const loadQueueMembership = useCallback(async () => {
    if (!token) {
      setQueueMembership(null);
      setIsMembershipLoading(false);
      return;
    }

    setIsMembershipLoading(true);
    try {
      const members = await listDriverQueueMembers(token);
      setQueueMembership(findActiveMembershipForStation(members, stationId));
    } catch {
      // Keep prior membership if refresh fails; join UX still works from local state.
    } finally {
      setIsMembershipLoading(false);
    }
  }, [token, stationId]);

  useEffect(() => {
    void loadQueueMembership();
  }, [loadQueueMembership]);

  useFocusEffect(
    useCallback(() => {
      void loadQueueMembership();
      void refreshActiveChargingSession();
    }, [loadQueueMembership, refreshActiveChargingSession]),
  );

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

  useEffect(() => {
    if (!token || !queueMembership) {
      return;
    }

    const interval = setInterval(() => {
      void loadQueueMembership();
    }, 15_000);

    return () => clearInterval(interval);
  }, [token, queueMembership?.id, loadQueueMembership]);

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
      Alert.alert(
        'Queue booked',
        `You are #${getQueueRank(member)} in line at this station.`,
      );
    },
    [retryStation, loadQueueMembership],
  );

  const handleLeaveQueue = useCallback(async () => {
    if (!token || !queueMembership || isLeavingQueue) {
      return;
    }

    setIsLeavingQueue(true);

    try {
      await leaveQueueMember(token, queueMembership.id);
      setQueueMembership(null);
      retryStation();
      Alert.alert('Left queue', 'You have been removed from the station queue.');
    } catch {
      Alert.alert('Unable to leave queue', 'Please try again.');
    } finally {
      setIsLeavingQueue(false);
    }
  }, [token, queueMembership, isLeavingQueue, retryStation]);

  const completeBookingPlaceholder = useCallback(() => {
    setPendingBooking(null);
    showBookingComingSoonAlert();
  }, [setPendingBooking]);

  const handleBook = useCallback(async () => {
    if (!selectedCharger || isBooking) {
      return;
    }

    setPendingBooking({
      stationId,
      chargerId: selectedCharger.id,
    });
    setIsBooking(true);

    try {
      let user = await ensureAuthenticatedUser();

      if (!user) {
        setIsSheetVisible(false);
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
        setIsSheetVisible(false);
        router.push('/auth/onboarding' as Href);
        return;
      }

      if (!resolveHasDefaultVehicle(user)) {
        setIsSheetVisible(false);
        router.push('/auth/vehicles' as Href);
        return;
      }

      completeBookingPlaceholder();
    } catch {
      Alert.alert(
        'Unable to book',
        'Something went wrong while starting your booking. Please try again.',
      );
    } finally {
      setIsBooking(false);
    }
  }, [
    selectedCharger,
    isBooking,
    stationId,
    setPendingBooking,
    ensureAuthenticatedUser,
    refreshUser,
    completeBookingPlaceholder,
  ]);

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
      <ScreenContainer edges={['top', 'bottom']}>
        <StationDetailsHeader onBack={handleBack} />
        <StationDetailsLoadingState />
      </ScreenContainer>
    );
  }

  if (isStationError) {
    return (
      <ScreenContainer edges={['top', 'bottom']}>
        <StationDetailsHeader onBack={handleBack} />
        <StationErrorState onRetry={retryStation} />
      </ScreenContainer>
    );
  }

  if (isStationNotFound || !station) {
    return (
      <ScreenContainer edges={['top', 'bottom']}>
        <StationDetailsHeader onBack={handleBack} />
        <StationNotFoundState onBack={handleBack} />
      </ScreenContainer>
    );
  }

  const status = getStationStatus(station);
  const address = getStationAddress(station);
  const imageSource = getStationImageSource(station);
  const showDistance = hasValue(station.distanceMi);

  return (
    <ScreenContainer edges={['top', 'bottom']}>
      <StationDetailsHeader onBack={handleBack} />

      <ScrollView
        showsVerticalScrollIndicator={false}
        contentContainerStyle={[
          styles.scrollContent,
          isTablet && styles.scrollContentTablet,
        ]}
      >
        <View style={styles.heroContainer}>
          <Image
            source={imageSource}
            style={styles.heroImage}
            contentFit="cover"
            transition={200}
          />

          <View style={styles.verifiedBadge}>
            <Icon name="checkmark" size={14} color={theme.colors.statusDot} />
            <Text style={styles.verifiedText}>GridFlow Verified</Text>
          </View>
        </View>

        <View style={styles.summarySection}>
          <View style={styles.titleRow}>
            <Text style={styles.stationName} numberOfLines={2}>
              {formatText(station.name)}
            </Text>

            <View style={styles.distanceBlock}>
              <Text style={styles.distanceValue}>
                {formatDetailDistance(station.distanceMi)}
              </Text>
              {showDistance ? (
                <Text style={styles.distanceLabel}>miles</Text>
              ) : null}
            </View>
          </View>

          <View style={styles.addressRow}>
            <Icon name="location" size={15} color={theme.colors.textMuted} />
            <Text style={styles.addressText} numberOfLines={2}>
              {formatText(address)}
            </Text>
          </View>

          <View style={styles.infoTileRow}>
            <View style={styles.infoTile}>
              <Text style={styles.infoTileLabel}>Status</Text>
              <View style={styles.infoTileValueRow}>
                <View
                  style={[
                    styles.statusDot,
                    status.variant === 'available' && styles.statusDotAvailable,
                  ]}
                />
                <Text
                  style={[
                    styles.infoTileValue,
                    status.variant === 'available' && styles.infoTileValueAvailable,
                  ]}
                >
                  {status.label}
                </Text>
              </View>
            </View>

            <View style={styles.infoTile}>
              <Text style={styles.infoTileLabel}>Pricing</Text>
              <Text style={styles.infoTileValue}>
                {formatDetailPricePerKwh(station.defaultPricePerKwh)}
              </Text>
            </View>
          </View>

          <Pressable
            style={styles.navigateButton}
            accessibilityRole="button"
            accessibilityLabel={`Navigate to ${station.name}`}
          >
            <Icon name="car" size={18} color={theme.colors.textInverse} />
            <Text style={styles.navigateButtonText}>Navigate</Text>
          </Pressable>

          <View style={styles.queueSection}>
            {stationActiveSession ? (
              <ActiveSessionCard
                session={stationActiveSession}
                stationName={station.name}
                connectorLabel={activeConnectorLabel}
                compact
                onPress={() => router.push('/sessions/active' as Href)}
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
              <View style={styles.bookQueueCard}>
                <View style={styles.bookQueueCardHeader}>
                  <View style={styles.bookQueueIconWrap}>
                    <Icon name="list" size={18} color={theme.colors.brand} />
                  </View>
                  <View style={styles.bookQueueCopy}>
                    <View style={styles.bookQueueTitleRow}>
                      <Text style={styles.bookQueueTitle}>Queue available</Text>
                      <View style={styles.availablePill}>
                        <View style={styles.availablePillDot} />
                        <Text style={styles.availablePillText}>Open</Text>
                      </View>
                    </View>
                    <Text style={styles.bookQueueSubtitle}>
                      Reserve your place in line and get notified when a charger
                      is ready for you.
                    </Text>
                  </View>
                </View>
                <Pressable
                  style={({ pressed }) => [
                    styles.bookQueueButton,
                    (pressed || isOpeningQueue || isMembershipLoading) &&
                      styles.bookQueueButtonPressed,
                    (isOpeningQueue || isMembershipLoading) &&
                      styles.bookQueueButtonDisabled,
                  ]}
                  onPress={() => {
                    void handleJoinQueuePress();
                  }}
                  disabled={isOpeningQueue || isMembershipLoading}
                  accessibilityRole="button"
                  accessibilityLabel="Book station queue"
                >
                  {isOpeningQueue || isMembershipLoading ? (
                    <ActivityIndicator color={theme.colors.textInverse} />
                  ) : (
                    <>
                      <Icon name="list" size={16} color={theme.colors.textInverse} />
                      <Text style={styles.bookQueueButtonText}>Book Queue</Text>
                    </>
                  )}
                </Pressable>
              </View>
            ) : !stationActiveSession ? (
              <View style={styles.queueUnavailableCard}>
                <View style={styles.queueUnavailableIconWrap}>
                  <Icon name="list" size={18} color={theme.colors.textMuted} />
                </View>
                <View style={styles.queueUnavailableCopy}>
                  <Text style={styles.queueUnavailableTitle}>
                    Queue not available
                  </Text>
                  <Text style={styles.queueUnavailableSubtitle}>
                    This station is not accepting queue bookings right now.
                  </Text>
                </View>
              </View>
            ) : null}
          </View>
        </View>

        <StationAmenitiesSection />

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
        isBooking={isBooking}
        onClose={closeChargerSheet}
        onBook={handleBook}
      />

      <QueueJoinSheet
        visible={isQueueSheetVisible}
        stationId={stationId}
        stationName={station.name}
        authToken={token}
        onClose={() => setIsQueueSheetVisible(false)}
        onJoined={handleQueueJoined}
      />
    </ScreenContainer>
  );
}

export function StationDetailsScreen(props: StationDetailsScreenProps) {
  return <StationDetailsContent {...props} />;
}

const styles = StyleSheet.create({
  scrollContent: {
    paddingBottom: theme.spacing.lg,
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
  verifiedBadge: {
    position: 'absolute',
    right: theme.spacing.lg,
    bottom: theme.spacing.md,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
    paddingHorizontal: theme.spacing.sm,
    paddingVertical: 6,
    borderRadius: theme.radius.pill,
    backgroundColor: 'rgba(255, 255, 255, 0.92)',
    ...theme.shadows.badge,
  },
  verifiedText: {
    fontSize: theme.typography.fontSize.xs,
    fontWeight: theme.typography.fontWeight.semibold,
    color: theme.colors.textPrimary,
  },
  summarySection: {
    paddingHorizontal: theme.spacing.lg,
    paddingTop: theme.spacing.lg,
    gap: theme.spacing.md,
  },
  titleRow: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    justifyContent: 'space-between',
    gap: theme.spacing.md,
  },
  stationName: {
    flex: 1,
    fontSize: theme.typography.fontSize.xl,
    fontWeight: theme.typography.fontWeight.bold,
    color: theme.colors.textPrimary,
    letterSpacing: -0.3,
    lineHeight: 26,
  },
  distanceBlock: {
    alignItems: 'flex-end',
    gap: 1,
  },
  distanceValue: {
    fontSize: theme.typography.fontSize.lg,
    fontWeight: theme.typography.fontWeight.bold,
    color: theme.colors.brand,
    letterSpacing: -0.2,
  },
  distanceLabel: {
    fontSize: theme.typography.fontSize.xs,
    color: theme.colors.textMuted,
  },
  addressRow: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: 6,
    marginTop: -4,
  },
  addressText: {
    flex: 1,
    fontSize: theme.typography.fontSize.sm,
    color: theme.colors.textMuted,
    lineHeight: 18,
  },
  infoTileRow: {
    flexDirection: 'row',
    gap: theme.spacing.md,
  },
  infoTile: {
    flex: 1,
    backgroundColor: '#f3f5f9',
    borderRadius: theme.radius.md,
    paddingHorizontal: theme.spacing.md,
    paddingVertical: theme.spacing.md,
    gap: 6,
  },
  infoTileLabel: {
    fontSize: theme.typography.fontSize.xs,
    color: theme.colors.textMuted,
    fontWeight: theme.typography.fontWeight.medium,
  },
  infoTileValueRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  infoTileValue: {
    fontSize: theme.typography.fontSize.md,
    fontWeight: theme.typography.fontWeight.bold,
    color: theme.colors.textPrimary,
  },
  infoTileValueAvailable: {
    color: theme.colors.brand,
  },
  statusDot: {
    width: 7,
    height: 7,
    borderRadius: 4,
    backgroundColor: theme.colors.statusUnavailable,
  },
  statusDotAvailable: {
    backgroundColor: theme.colors.brand,
  },
  navigateButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: theme.spacing.sm,
    backgroundColor: theme.colors.brand,
    borderRadius: theme.radius.md,
    paddingVertical: 14,
    marginTop: theme.spacing.xs,
  },
  navigateButtonText: {
    fontSize: theme.typography.fontSize.md,
    fontWeight: theme.typography.fontWeight.bold,
    color: theme.colors.textInverse,
  },
  queueSection: {
    marginTop: theme.spacing.sm,
  },
  bookQueueCard: {
    borderRadius: theme.radius.lg,
    borderWidth: 1,
    borderColor: theme.colors.selectionBorder,
    backgroundColor: theme.colors.brandMuted,
    padding: theme.spacing.md,
    gap: theme.spacing.md,
  },
  bookQueueCardHeader: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: theme.spacing.sm,
  },
  bookQueueIconWrap: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: theme.colors.surface,
    alignItems: 'center',
    justifyContent: 'center',
  },
  bookQueueCopy: {
    flex: 1,
    gap: 4,
  },
  bookQueueTitleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: theme.spacing.sm,
  },
  bookQueueTitle: {
    flexShrink: 1,
    fontSize: theme.typography.fontSize.md,
    fontWeight: theme.typography.fontWeight.bold,
    color: theme.colors.brandDark,
  },
  availablePill: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: theme.radius.pill,
    backgroundColor: theme.colors.surface,
  },
  availablePillDot: {
    width: 6,
    height: 6,
    borderRadius: 3,
    backgroundColor: theme.colors.statusDot,
  },
  availablePillText: {
    fontSize: 11,
    fontWeight: theme.typography.fontWeight.semibold,
    color: theme.colors.brandDark,
  },
  bookQueueSubtitle: {
    fontSize: theme.typography.fontSize.sm,
    color: theme.colors.textMuted,
    lineHeight: 18,
  },
  bookQueueButton: {
    height: 44,
    borderRadius: theme.radius.md,
    backgroundColor: theme.colors.brand,
    alignItems: 'center',
    justifyContent: 'center',
    flexDirection: 'row',
    gap: theme.spacing.sm,
  },
  bookQueueButtonPressed: {
    opacity: 0.85,
  },
  bookQueueButtonDisabled: {
    opacity: 0.7,
  },
  bookQueueButtonText: {
    fontSize: theme.typography.fontSize.md,
    fontWeight: theme.typography.fontWeight.bold,
    color: theme.colors.textInverse,
  },
  queueUnavailableCard: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: theme.spacing.sm,
    borderRadius: theme.radius.lg,
    borderWidth: 1,
    borderColor: theme.colors.border,
    backgroundColor: '#f8fafc',
    padding: theme.spacing.md,
  },
  queueUnavailableIconWrap: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: theme.colors.iconBackground,
    alignItems: 'center',
    justifyContent: 'center',
  },
  queueUnavailableCopy: {
    flex: 1,
    gap: 4,
  },
  queueUnavailableTitle: {
    fontSize: theme.typography.fontSize.md,
    fontWeight: theme.typography.fontWeight.semibold,
    color: theme.colors.textSecondary,
  },
  queueUnavailableSubtitle: {
    fontSize: theme.typography.fontSize.sm,
    color: theme.colors.textMuted,
    lineHeight: 18,
  },
  centeredState: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: theme.spacing.xxl,
    gap: theme.spacing.sm,
  },
  stateTitle: {
    fontSize: theme.typography.fontSize.lg,
    fontWeight: theme.typography.fontWeight.semibold,
    color: theme.colors.textPrimary,
    textAlign: 'center',
  },
  stateMessage: {
    fontSize: theme.typography.fontSize.md,
    color: theme.colors.textMuted,
    textAlign: 'center',
  },
  stateButton: {
    marginTop: theme.spacing.md,
    paddingHorizontal: theme.spacing.xl,
    paddingVertical: theme.spacing.sm,
    borderRadius: theme.radius.md,
    backgroundColor: theme.colors.brand,
  },
  stateButtonText: {
    fontSize: theme.typography.fontSize.md,
    fontWeight: theme.typography.fontWeight.semibold,
    color: theme.colors.textInverse,
  },
});
