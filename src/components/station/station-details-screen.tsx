import { Image } from 'expo-image';
import { router, useFocusEffect, type Href } from 'expo-router';
import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import {
  ActivityIndicator,
  Alert,
  Pressable,
  ScrollView,
  Share,
  StyleSheet,
  Text,
  View,
  useWindowDimensions,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

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
import { useTheme } from '@/theme';
import type { Charger } from '@/types/charger';
import type { QueueMember } from '@/types/queue';
import { formatCurrencyAmount } from '@/utils/charging-session-format';
import { getQueueRank } from '@/utils/queue-display';
import { openStationNavigation } from '@/utils/open-station-navigation';
import {
  formatText,
  getStationAddress,
  getStationStatus,
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
const HERO_HEIGHT = 260;
/** Dark text on mint CTAs — matches selected chip / design system. */
const ON_ACCENT = '#0F172A';
const LAYOUT_EDGE = 20;
const SECTION_GAP = 16;

type StationDetailsScreenProps = {
  stationId: string;
  resumeChargerId?: string;
  resumeBooking?: boolean;
};

function StationNotFoundState({
  onBack,
  styles,
}: {
  onBack: () => void;
  styles: ReturnType<typeof createStyles>;
}) {
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

function StationErrorState({
  onRetry,
  styles,
}: {
  onRetry: () => void;
  styles: ReturnType<typeof createStyles>;
}) {
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
  } = useStationDetails(stationId);

  const [selectedCharger, setSelectedCharger] = useState<Charger | null>(null);
  const [isSheetVisible, setIsSheetVisible] = useState(false);
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
      <ScreenContainer edges={['top', 'bottom']} style={styles.screen}>
        <StationDetailsHeader onBack={handleBack} />
        <StationDetailsLoadingState />
      </ScreenContainer>
    );
  }

  if (isStationError) {
    return (
      <ScreenContainer edges={['top', 'bottom']} style={styles.screen}>
        <StationDetailsHeader onBack={handleBack} />
        <StationErrorState onRetry={retryStation} styles={styles} />
      </ScreenContainer>
    );
  }

  if (isStationNotFound || !station) {
    return (
      <ScreenContainer edges={['top', 'bottom']} style={styles.screen}>
        <StationDetailsHeader onBack={handleBack} />
        <StationNotFoundState onBack={handleBack} styles={styles} />
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
  const heroTopPad = Math.max(insets.top, 12);

  return (
    <ScreenContainer edges={['bottom']} style={styles.screen}>
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
              <Icon name="back" size={22} color="#FFFFFF" />
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
              <Icon name="share" size={20} color="#FFFFFF" />
            </Pressable>
          </View>

          <View style={styles.verifiedBadge}>
            <Icon name="star" size={12} color={theme.colors.statusAvailable} />
            <Text style={styles.verifiedText}>GridFlow Verified</Text>
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
              <View
                style={[
                  styles.statusPill,
                  status.variant === 'available' && styles.statusPillAvailable,
                ]}
              >
                <View
                  style={[
                    styles.statusDot,
                    status.variant === 'available' && styles.statusDotAvailable,
                  ]}
                />
                <Text
                  style={[
                    styles.statusPillText,
                    status.variant === 'available' && styles.statusPillTextAvailable,
                  ]}
                >
                  {status.label}
                </Text>
              </View>
            </View>

            <View style={styles.infoTile}>
              <Text style={styles.infoTileLabel}>PRICING</Text>
              <View style={styles.priceRow}>
                <Text style={styles.priceValue}>{priceAmount}</Text>
                {hasPrice ? (
                  <Text style={styles.priceUnit}>/kWh</Text>
                ) : null}
              </View>
            </View>
          </View>

          <Pressable
            style={({ pressed }) => [
              styles.navigateButton,
              !canNavigate && styles.navigateButtonDisabled,
              pressed && canNavigate && styles.navigateButtonPressed,
            ]}
            onPress={() => openStationNavigation(station)}
            disabled={!canNavigate}
            accessibilityRole="button"
            accessibilityLabel={`Navigate to ${station.name}`}
          >
            <Icon name="navigate" size={18} color={ON_ACCENT} />
            <Text style={styles.navigateButtonText}>Navigate to Station</Text>
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
                <View style={styles.bookQueueHeader}>
                  <View style={styles.bookQueueTitleRow}>
                    <Icon name="list" size={18} color={theme.colors.accent} />
                    <Text style={styles.bookQueueTitle}>Queue Available</Text>
                  </View>
                  <View style={styles.availablePill}>
                    <View style={styles.availablePillDot} />
                    <Text style={styles.availablePillText}>Open</Text>
                  </View>
                </View>
                <Text style={styles.bookQueueSubtitle}>
                  Reserve your spot and get notified when a charger is ready.
                </Text>
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
                  accessibilityLabel="Book queue position"
                >
                  {isOpeningQueue || isMembershipLoading ? (
                    <ActivityIndicator color={ON_ACCENT} />
                  ) : (
                    <>
                      <Icon name="list" size={16} color={ON_ACCENT} />
                      <Text style={styles.bookQueueButtonText}>
                        Book Queue Position
                      </Text>
                    </>
                  )}
                </Pressable>
              </View>
            ) : !stationActiveSession ? (
              <View style={styles.queueUnavailableCard}>
                <Icon name="list" size={18} color={theme.colors.textMuted} />
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
      backgroundColor: 'rgba(6, 12, 24, 0.18)',
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
      width: 40,
      height: 40,
      borderRadius: 20,
      alignItems: 'center',
      justifyContent: 'center',
      backgroundColor: 'rgba(6, 12, 24, 0.45)',
      borderWidth: 1,
      borderColor: 'rgba(255, 255, 255, 0.18)',
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
      paddingVertical: 5,
      borderRadius: 10,
      backgroundColor: 'rgba(6, 12, 24, 0.72)',
      borderWidth: 1,
      borderColor: 'rgba(0, 217, 160, 0.35)',
    },
    verifiedText: {
      fontFamily: theme.typography.fontFamily.semibold,
      fontSize: 11,
      lineHeight: 16,
      color: theme.colors.statusAvailable,
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
      fontSize: 22,
      lineHeight: 26.4,
      color: theme.colors.textPrimary,
      letterSpacing: -0.2,
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
      borderRadius: theme.radius.md,
      borderWidth: 1,
      borderColor: theme.colors.border,
      paddingHorizontal: 14,
      paddingVertical: 12,
      gap: 8,
    },
    infoTileLabel: {
      fontFamily: theme.typography.fontFamily.regular,
      fontSize: 11,
      lineHeight: 16.5,
      letterSpacing: 0.6,
      color: theme.colors.textMuted,
    },
    statusPill: {
      alignSelf: 'flex-start',
      flexDirection: 'row',
      alignItems: 'center',
      gap: 6,
      paddingHorizontal: 10,
      paddingVertical: 5,
      borderRadius: theme.radius.pill,
      borderWidth: 1,
      borderColor: theme.colors.border,
      backgroundColor: theme.colors.iconBackground,
    },
    statusPillAvailable: {
      borderColor: theme.colors.statusAvailable,
      backgroundColor: theme.colors.statusAvailableBg,
    },
    statusDot: {
      width: 6,
      height: 6,
      borderRadius: 3,
      backgroundColor: theme.colors.statusUnavailable,
    },
    statusDotAvailable: {
      backgroundColor: theme.colors.statusAvailable,
    },
    statusPillText: {
      fontFamily: theme.typography.fontFamily.semibold,
      fontSize: 13,
      lineHeight: 18,
      color: theme.colors.textSecondary,
    },
    statusPillTextAvailable: {
      color: theme.colors.statusAvailable,
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
    navigateButton: {
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'center',
      gap: 8,
      height: 48,
      backgroundColor: theme.colors.accent,
      borderRadius: 12,
      paddingHorizontal: 16,
    },
    navigateButtonPressed: {
      opacity: 0.9,
    },
    navigateButtonDisabled: {
      opacity: 0.55,
    },
    navigateButtonText: {
      fontFamily: theme.typography.fontFamily.bold,
      fontSize: 15,
      lineHeight: 22,
      color: ON_ACCENT,
      includeFontPadding: false,
    },
    queueSection: {
      gap: SECTION_GAP,
    },
    bookQueueCard: {
      borderRadius: theme.radius.lg,
      borderWidth: 1,
      borderColor: theme.colors.selectionBorder,
      backgroundColor: theme.colors.surface,
      padding: 16,
      gap: 12,
    },
    bookQueueHeader: {
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'space-between',
      gap: 12,
    },
    bookQueueTitleRow: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: 8,
      flexShrink: 1,
    },
    bookQueueTitle: {
      fontFamily: theme.typography.fontFamily.bold,
      fontSize: 15,
      lineHeight: 22.5,
      color: theme.colors.accent,
    },
    availablePill: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: 5,
      paddingHorizontal: 8,
      paddingVertical: 4,
      borderRadius: theme.radius.pill,
      backgroundColor: theme.colors.statusAvailableBg,
    },
    availablePillDot: {
      width: 6,
      height: 6,
      borderRadius: 3,
      backgroundColor: theme.colors.statusAvailable,
    },
    availablePillText: {
      fontFamily: theme.typography.fontFamily.semibold,
      fontSize: 11,
      lineHeight: 16,
      color: theme.colors.statusAvailable,
    },
    bookQueueSubtitle: {
      fontFamily: theme.typography.fontFamily.regular,
      fontSize: 13,
      lineHeight: 19.5,
      color: theme.colors.textMuted,
    },
    bookQueueButton: {
      height: 45,
      borderRadius: 10,
      backgroundColor: theme.colors.accent,
      alignItems: 'center',
      justifyContent: 'center',
      flexDirection: 'row',
      gap: 7,
      paddingHorizontal: 12,
    },
    bookQueueButtonPressed: {
      opacity: 0.9,
    },
    bookQueueButtonDisabled: {
      opacity: 0.7,
    },
    bookQueueButtonText: {
      fontFamily: theme.typography.fontFamily.bold,
      fontSize: 14,
      lineHeight: 21,
      color: ON_ACCENT,
      includeFontPadding: false,
    },
    queueUnavailableCard: {
      flexDirection: 'row',
      alignItems: 'flex-start',
      gap: 12,
      borderRadius: theme.radius.lg,
      borderWidth: 1,
      borderColor: theme.colors.border,
      backgroundColor: theme.colors.surface,
      padding: 16,
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
    centeredState: {
      flex: 1,
      alignItems: 'center',
      justifyContent: 'center',
      paddingHorizontal: theme.spacing.xxl,
      gap: theme.spacing.sm,
    },
    stateTitle: {
      fontFamily: theme.typography.fontFamily.semibold,
      fontSize: theme.typography.fontSize.lg,
      color: theme.colors.textPrimary,
      textAlign: 'center',
    },
    stateMessage: {
      fontFamily: theme.typography.fontFamily.regular,
      fontSize: theme.typography.fontSize.md,
      color: theme.colors.textMuted,
      textAlign: 'center',
    },
    stateButton: {
      marginTop: theme.spacing.md,
      paddingHorizontal: theme.spacing.xl,
      paddingVertical: theme.spacing.sm,
      borderRadius: theme.radius.md,
      backgroundColor: theme.colors.accent,
    },
    stateButtonText: {
      fontFamily: theme.typography.fontFamily.semibold,
      fontSize: theme.typography.fontSize.md,
      color: ON_ACCENT,
    },
  });
}
