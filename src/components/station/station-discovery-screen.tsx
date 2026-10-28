import { useLocalSearchParams } from 'expo-router';
import { router, type Href } from 'expo-router';
import { useCallback, useEffect, useMemo, useState, type ReactNode } from 'react';
import { StyleSheet, View } from 'react-native';

import { useAuth } from '@/auth/auth-context';
import { useActiveChargingSession } from '@/hooks/use-active-charging-session';
import { useActiveDriverQueueMembership } from '@/hooks/use-active-driver-queue-membership';
import { useChargingSessionDisplayLabels } from '@/hooks/use-charging-session-display-labels';
import { HomeActiveJourneyCard } from '@/components/station/home-active-journey-card';
import { useStationDiscoveryContext } from '@/contexts/station-discovery-context';
import {
  buildAuthJourneySeedKey,
  parseWhoAmIActiveJourney,
} from '@/utils/whoami-active-journey';
import { formatStationDiscoverySubtitle } from '@/utils/station-discovery-format';
import { NoticeToast } from '@/components/ui/notice-toast';
import { ScreenContainer, ScreenContent } from '@/components/ui/screen-container';

import { DiscoveryFilterChips } from './discovery-filter-chips';
import { DISCOVERY_LAYOUT } from './discovery-layout';
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

export function StationDiscoveryScreen() {
  const { token, user } = useAuth();
  const journeyLookupFailed = user?.activeJourneyLookup === 'failed';
  const authJourneySeedKey = useMemo(() => buildAuthJourneySeedKey(user), [user]);
  const whoAmIJourney = useMemo(
    () => parseWhoAmIActiveJourney(user),
    [user?.activeJourney, user?.activeJourneyLookup, user?.id],
  );

  const {
    membership: activeQueueMembership,
    stationName: activeQueueStationName,
    isLoading: isActiveQueueLoading,
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

  const { session: activeSession, isLoading: isActiveSessionLoading } =
    useActiveChargingSession({
      token,
      pollIntervalMs:
        whoAmIJourney?.chargingSession || pendingChargingSessionFromQueue
          ? 15_000
          : null,
      pollWithoutActiveSession:
        pendingChargingSessionFromQueue && !whoAmIJourney?.chargingSession,
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

  const dismissNotice = useCallback(() => {
    setNoticeMessage(null);
  }, []);

  const journeyStationId =
    activeSession?.stationId ?? activeQueueMembership?.stationId ?? null;

  const journeyStationMeta = useMemo(
    () => (journeyStationId ? stations.find((item) => item.id === journeyStationId) : undefined),
    [journeyStationId, stations],
  );

  const journeyStationSubtitle = useMemo(
    () => formatStationDiscoverySubtitle(journeyStationMeta),
    [journeyStationMeta],
  );

  const journeyStationName = useMemo(() => {
    if (hasActiveCharging) {
      return activeSessionLabels.stationName ?? activeSession?.stationName ?? undefined;
    }

    return activeQueueStationName ?? journeyStationMeta?.name;
  }, [
    activeQueueStationName,
    activeSession?.stationName,
    activeSessionLabels.stationName,
    hasActiveCharging,
    journeyStationMeta?.name,
  ]);

  const journeyListHeader = useMemo((): ReactNode => {
    if (!hasActiveCharging && !showQueueJourney) {
      return null;
    }

    return (
      <HomeActiveJourneyCard
        session={hasActiveCharging ? activeSession : null}
        membership={showQueueJourney ? activeQueueMembership : null}
        stationName={journeyStationName}
        stationSubtitle={journeyStationSubtitle}
        connectorLabel={activeSessionLabels.connectorLabel}
        vehicleLabel={activeSession?.vehicleLabel}
        chargingWithoutSession={queueMemberChargingWithoutSession}
        onPress={() => {
          if (hasActiveCharging && activeSession) {
            router.push(`/sessions/${encodeURIComponent(activeSession.id)}` as Href);
            return;
          }

          if (activeQueueMembership) {
            router.push(
              `/stations/${encodeURIComponent(activeQueueMembership.stationId)}` as Href,
            );
          }
        }}
      />
    );
  }, [
    activeQueueMembership,
    activeSession,
    activeSessionLabels.connectorLabel,
    activeSessionLabels.stationName,
    hasActiveCharging,
    journeyStationName,
    journeyStationSubtitle,
    queueMemberChargingWithoutSession,
    showQueueJourney,
  ]);

  const renderContent = () => {
    if (error && stations.length === 0 && !isInitialLoading) {
      return (
        <>
          {journeyListHeader ? (
            <View style={styles.journeyInset}>{journeyListHeader}</View>
          ) : null}
          <StationErrorState onRetry={retry} />
        </>
      );
    }

    if (isInitialLoading) {
      return (
        <>
          {journeyListHeader ? (
            <View style={styles.journeyInset}>{journeyListHeader}</View>
          ) : null}
          <StationLoadingState />
        </>
      );
    }

    return (
      <StationList
        stations={stations}
        isRefreshing={isRefreshing}
        isLoadingMore={isLoadingMore}
        hasMore={hasMore}
        hasActiveSearch={hasActiveSearch}
        hasActiveFilters={hasActiveFilters}
        onRefresh={refresh}
        onEndReached={loadMore}
        onClearAllFilters={clearAllFilters}
        onSearchNearby={searchNearby}
        listHeader={journeyListHeader}
      />
    );
  };

  return (
    <ScreenContainer edges={['top']}>
      <StationHeader />
      {noticeMessage ? (
        <NoticeToast message={noticeMessage} onDismiss={dismissNotice} />
      ) : null}
      <DiscoverySearchToolbar
        value={searchQuery}
        onChangeText={setSearchQuery}
        placeholder="Search charging stations..."
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

      {locationError ? (
        <NoticeToast message={locationError} onDismiss={clearLocationError} />
      ) : null}

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

const styles = StyleSheet.create({
  journeyInset: {
    paddingHorizontal: DISCOVERY_LAYOUT.edge,
    paddingTop: DISCOVERY_LAYOUT.sectionGap,
    marginBottom: DISCOVERY_LAYOUT.cardGap,
  },
});
