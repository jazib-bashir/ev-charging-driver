import { useLocalSearchParams } from 'expo-router';
import { router, type Href } from 'expo-router';
import { useCallback, useEffect, useMemo, useState } from 'react';
import { View } from 'react-native';

import { AuthApiError } from '@/api/auth';
import { leaveQueueMember } from '@/api/stationQueue';
import { useAuth } from '@/auth/auth-context';
import { useActiveChargingSession } from '@/hooks/use-active-charging-session';
import { useActiveDriverQueueMembership } from '@/hooks/use-active-driver-queue-membership';
import { useChargingSessionDisplayLabels } from '@/hooks/use-charging-session-display-labels';
import { useTheme } from '@/theme';
import { HomeActiveJourneyScreen } from '@/components/station/home-active-journey-screen';
import { HomeJourneyConnectionIssue } from '@/components/station/home-journey-connection-issue';
import { HomeJourneyLoadingScreen } from '@/components/station/home-journey-loading-screen';
import { useStationDiscoveryContext } from '@/contexts/station-discovery-context';
import { requestQueueMembershipRefresh } from '@/utils/queue-membership-refresh';
import {
  buildAuthJourneySeedKey,
  parseWhoAmIActiveJourney,
} from '@/utils/whoami-active-journey';
import { formatHomeJourneyStationSubtitle } from '@/utils/station-discovery-format';
import { confirmAsync, showUserAlert } from '@/utils/user-prompt';
import { NoticeToast } from '@/components/ui/notice-toast';
import { ScreenContainer, ScreenContent } from '@/components/ui/screen-container';

import { DiscoveryFilterChips } from './discovery-filter-chips';
import { DiscoveryHeroIntro } from './discovery-hero-intro';
import { DiscoverySearchToolbar } from './discovery-search-toolbar';
import { FilterBottomSheet } from './filter-bottom-sheet';
import { LocationPermissionBanner } from './location-permission-banner';
import { StationErrorState } from './station-error-state';
import { StationHeader } from './station-header';
import { StationList } from './station-list';
import { StationLoadingState } from './station-loading-state';

const NOTICE_MESSAGES: Record<string, string> = {
  'profile-incomplete':
    'Complete your profile to book a charger. You can finish it anytime from Profile.',
};

const CHARGING_DARK_BG = '#0A2F2A';

export function StationDiscoveryScreen() {
  const { token, user, isLoading: isAuthLoading, refreshUser } = useAuth();
  const { isDark } = useTheme();
  const journeyLookupFailed = user?.activeJourneyLookup === 'failed';
  const whoAmIConfirmedNoJourney =
    user?.activeJourneyLookup === 'ok' && user.activeJourney == null;
  const authJourneySeedKey = useMemo(() => buildAuthJourneySeedKey(user), [user]);
  const whoAmIJourney = useMemo(
    () => parseWhoAmIActiveJourney(user),
    [user?.activeJourney, user?.activeJourneyLookup, user?.id],
  );

  const {
    membership: activeQueueMembership,
    stationName: activeQueueStationName,
    stationMeta: activeQueueStationMeta,
    isLoading: isActiveQueueLoading,
    isRefreshing: isActiveQueueRefreshing,
    error: activeQueueError,
    refresh: refreshActiveQueue,
  } = useActiveDriverQueueMembership({
    token,
    seedMembership: whoAmIJourney ? whoAmIJourney.queueMembership : undefined,
    seedStationName: whoAmIJourney?.queueStationName,
    journeyLookupFailed,
    authJourneySeedKey,
  });

  const pendingChargingSessionFromQueue = useMemo(() => {
    if (whoAmIJourney?.queueMemberChargingWithoutSession) {
      return true;
    }

    if (whoAmIJourney?.queueMembership?.state === 'CHARGING') {
      return true;
    }

    return activeQueueMembership?.state === 'CHARGING';
  }, [
    activeQueueMembership?.state,
    whoAmIJourney?.queueMemberChargingWithoutSession,
    whoAmIJourney?.queueMembership?.state,
  ]);

  const {
    session: activeSession,
    isLoading: isActiveSessionLoading,
    isRefreshing: isActiveSessionRefreshing,
    error: activeSessionError,
    refresh: refreshActiveSession,
  } = useActiveChargingSession({
    token,
    seedSession: whoAmIJourney ? whoAmIJourney.chargingSession : undefined,
    journeyLookupFailed,
    authJourneySeedKey,
  });
  const activeSessionLabels = useChargingSessionDisplayLabels(activeSession);

  const hasActiveCharging = activeSession?.status === 'CHARGING';
  const queueMemberChargingWithoutSession =
    pendingChargingSessionFromQueue && !hasActiveCharging;
  const showQueueJourney =
    !hasActiveCharging &&
    activeQueueMembership != null &&
    !isActiveQueueLoading &&
    (!isActiveSessionLoading ||
      activeQueueMembership.state === 'CHARGING' ||
      queueMemberChargingWithoutSession);

  const hooksSettled = !isActiveQueueLoading && !isActiveSessionLoading;
  const bothHooksFailed = Boolean(activeQueueError) && Boolean(activeSessionError);
  const incompleteFailedLookup =
    journeyLookupFailed && (Boolean(activeQueueError) || Boolean(activeSessionError));

  const [dismissedConnectionIssue, setDismissedConnectionIssue] = useState(false);
  const [isRetryingJourney, setIsRetryingJourney] = useState(false);

  const showConnectionIssue =
    Boolean(token) &&
    !dismissedConnectionIssue &&
    hooksSettled &&
    !hasActiveCharging &&
    !showQueueJourney &&
    (bothHooksFailed || incompleteFailedLookup);

  const showJourneyLoading =
    isAuthLoading ||
    (Boolean(token) &&
      !whoAmIConfirmedNoJourney &&
      !hooksSettled &&
      !hasActiveCharging &&
      !showQueueJourney &&
      !dismissedConnectionIssue);

  const { notice } = useLocalSearchParams<{ notice?: string }>();
  const [noticeMessage, setNoticeMessage] = useState<string | null>(null);

  const {
    searchQuery,
    setSearchQuery,
    advancedFilters,
    applyAdvancedFilters,
    isFilterSheetOpen,
    openFilterSheet,
    closeFilterSheet,
    clearAllFilters,
    searchNearby,
    enableLocationAccess,
    openLocationSettings,
    locationPermissionStatus,
    isLocationLoading,
    locationError,
    clearLocationError,
    isLocationBannerDismissed,
    dismissLocationBanner,
    hasActiveSearch,
    hasActiveFilters,
    activeFilterCount,
    list,
  } = useStationDiscoveryContext();

  const {
    stations,
    totalCount,
    isInitialLoading,
    isRefreshing,
    isLoadingMore,
    error,
    hasMore,
    refresh,
    loadMore,
    retry,
  } = list;

  useEffect(() => {
    if (notice && NOTICE_MESSAGES[notice]) {
      setNoticeMessage(NOTICE_MESSAGES[notice]);
    }
  }, [notice]);

  useEffect(() => {
    if (hasActiveCharging || showQueueJourney) {
      setDismissedConnectionIssue(false);
    }
  }, [hasActiveCharging, showQueueJourney]);

  const dismissNotice = useCallback(() => {
    setNoticeMessage(null);
  }, []);

  const handleRetryJourneyCheck = useCallback(async () => {
    setIsRetryingJourney(true);
    setDismissedConnectionIssue(false);

    try {
      await refreshUser();
      await Promise.all([
        refreshActiveQueue({ showLoading: true }),
        refreshActiveSession({ showLoading: true }),
      ]);
    } finally {
      setIsRetryingJourney(false);
    }
  }, [refreshActiveQueue, refreshActiveSession, refreshUser]);

  const handleContinueHome = useCallback(() => {
    setDismissedConnectionIssue(true);
  }, []);

  const journeyStationId =
    activeSession?.stationId ?? activeQueueMembership?.stationId ?? null;

  const journeyStationFromList = useMemo(
    () => (journeyStationId ? stations.find((item) => item.id === journeyStationId) : undefined),
    [journeyStationId, stations],
  );

  const journeyStationMeta = useMemo(() => {
    if (hasActiveCharging) {
      return journeyStationFromList ?? activeSessionLabels.stationMeta ?? null;
    }

    return journeyStationFromList ?? activeQueueStationMeta ?? null;
  }, [
    activeQueueStationMeta,
    activeSessionLabels.stationMeta,
    hasActiveCharging,
    journeyStationFromList,
  ]);

  const journeyStationSubtitle = useMemo(
    () => formatHomeJourneyStationSubtitle(journeyStationMeta),
    [journeyStationMeta],
  );

  const journeyStationName = useMemo(() => {
    if (hasActiveCharging) {
      return (
        activeSessionLabels.stationName ??
        activeSession?.stationName ??
        journeyStationMeta?.name ??
        undefined
      );
    }

    return activeQueueStationName ?? journeyStationMeta?.name;
  }, [
    activeQueueStationName,
    activeSession?.stationName,
    activeSessionLabels.stationName,
    hasActiveCharging,
    journeyStationMeta?.name,
  ]);

  const isJourneyRefreshing =
    (showQueueJourney || hasActiveCharging) &&
    (isActiveQueueRefreshing || isActiveSessionRefreshing);

  const hasActiveJourney = hasActiveCharging || showQueueJourney;

  const [isLeavingQueue, setIsLeavingQueue] = useState(false);

  const openJourneyDetails = useCallback(() => {
    const stationId =
      (hasActiveCharging ? activeSession?.stationId : null) ??
      activeQueueMembership?.stationId;
    if (!stationId) {
      return;
    }

    const params = new URLSearchParams({
      stationId,
    });
    if (activeQueueMembership?.id) {
      params.set('membershipId', activeQueueMembership.id);
    }
    if (hasActiveCharging && activeSession?.id) {
      params.set('sessionId', activeSession.id);
    }

    router.push(`/journey/details?${params.toString()}` as Href);
  }, [
    activeQueueMembership?.id,
    activeQueueMembership?.stationId,
    activeSession?.id,
    activeSession?.stationId,
    hasActiveCharging,
  ]);

  const handleLeaveQueue = useCallback(async () => {
    if (!token || !activeQueueMembership || isLeavingQueue) {
      return;
    }

    if (activeQueueMembership.state !== 'QUEUED') {
      showUserAlert(
        'Unable to leave queue',
        'Once the station calls you forward, leaving is no longer available. Contact staff if you need help.',
      );
      return;
    }

    const confirmed = await confirmAsync({
      title: 'Leave queue?',
      message: 'You will lose your place in line at this station.',
      confirmText: 'Leave queue',
      cancelText: 'Stay in queue',
      destructive: true,
    });

    if (!confirmed) {
      return;
    }

    setIsLeavingQueue(true);

    try {
      await leaveQueueMember(token, activeQueueMembership.id);
      requestQueueMembershipRefresh();
      await refreshUser();
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
  }, [activeQueueMembership, isLeavingQueue, refreshUser, token]);

  const discoverySearchChrome = useMemo(
    () => (
      <View>
        <DiscoverySearchToolbar
          value={searchQuery}
          onChangeText={setSearchQuery}
          placeholder="Search stations or areas"
          onFilterPress={openFilterSheet}
          activeFilterCount={activeFilterCount}
        />
        <DiscoveryFilterChips />

        {!isLocationBannerDismissed ? (
          <LocationPermissionBanner
            permissionStatus={locationPermissionStatus}
            isLoading={isLocationLoading}
            onEnableLocation={() => {
              void enableLocationAccess().catch(() => undefined);
            }}
            onOpenSettings={() => {
              void openLocationSettings();
            }}
            onDismiss={dismissLocationBanner}
          />
        ) : null}
      </View>
    ),
    [
      activeFilterCount,
      dismissLocationBanner,
      enableLocationAccess,
      isLocationBannerDismissed,
      isLocationLoading,
      locationPermissionStatus,
      openFilterSheet,
      openLocationSettings,
      searchQuery,
      setSearchQuery,
    ],
  );

  const handleDiscoveryRefresh = useCallback(() => {
    refresh();
    void refreshActiveQueue({ showLoading: false });
    void refreshActiveSession({ showLoading: false });
  }, [refresh, refreshActiveQueue, refreshActiveSession]);

  if (showJourneyLoading) {
    return (
      <ScreenContainer edges={['top', 'bottom']}>
        <HomeJourneyLoadingScreen accountVerified={!isAuthLoading && Boolean(token)} />
      </ScreenContainer>
    );
  }

  if (showConnectionIssue) {
    return (
      <ScreenContainer edges={['top', 'bottom']}>
        <HomeJourneyConnectionIssue
          onRetry={() => {
            void handleRetryJourneyCheck();
          }}
          onContinueHome={handleContinueHome}
          isRetrying={isRetryingJourney}
        />
      </ScreenContainer>
    );
  }

  if (hasActiveJourney) {
    return (
      <ScreenContainer
        edges={['top']}
        style={
          hasActiveCharging && isDark
            ? { backgroundColor: CHARGING_DARK_BG }
            : undefined
        }
      >
        {noticeMessage ? (
          <NoticeToast message={noticeMessage} onDismiss={dismissNotice} />
        ) : null}
        <HomeActiveJourneyScreen
          session={hasActiveCharging ? activeSession : null}
          membership={
            hasActiveCharging || showQueueJourney ? activeQueueMembership : null
          }
          stationName={journeyStationName}
          stationSubtitle={journeyStationSubtitle}
          connectorLabel={activeSessionLabels.connectorLabel}
          vehicleLabel={activeSession?.vehicleLabel}
          chargingWithoutSession={queueMemberChargingWithoutSession}
          isRefreshing={isJourneyRefreshing}
          isLeavingQueue={isLeavingQueue}
          onOpenJourneyDetails={openJourneyDetails}
          onLeaveQueue={() => {
            void handleLeaveQueue();
          }}
        />
      </ScreenContainer>
    );
  }

  const renderContent = () => {
    if (error && stations.length === 0 && !isInitialLoading) {
      return <StationErrorState onRetry={retry} />;
    }

    if (isInitialLoading) {
      return <StationLoadingState />;
    }

    return (
      <StationList
        stations={stations}
        isRefreshing={isRefreshing}
        isLoadingMore={isLoadingMore}
        hasMore={hasMore}
        hasActiveSearch={hasActiveSearch}
        hasActiveFilters={hasActiveFilters}
        onRefresh={handleDiscoveryRefresh}
        onEndReached={loadMore}
        onClearAllFilters={clearAllFilters}
        onSearchNearby={searchNearby}
      />
    );
  };

  return (
    <ScreenContainer edges={['top']}>
      <StationHeader />
      {noticeMessage ? (
        <NoticeToast message={noticeMessage} onDismiss={dismissNotice} />
      ) : null}

      {locationError ? (
        <NoticeToast message={locationError} onDismiss={clearLocationError} />
      ) : null}

      <View>
        <DiscoveryHeroIntro />
        {discoverySearchChrome}
      </View>

      <ScreenContent>{renderContent()}</ScreenContent>

      <FilterBottomSheet
        visible={isFilterSheetOpen}
        onClose={closeFilterSheet}
        appliedFilters={advancedFilters}
        onApplyFilters={applyAdvancedFilters}
        onClearAll={clearAllFilters}
        stationCount={totalCount}
        authToken={token}
        locationPermissionStatus={locationPermissionStatus}
        isLocationLoading={isLocationLoading}
        onEnableLocation={enableLocationAccess}
        onOpenLocationSettings={openLocationSettings}
      />
    </ScreenContainer>
  );
}
