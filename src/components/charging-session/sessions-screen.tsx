import { router, type Href } from 'expo-router';
import { useEffect, useMemo, useState } from 'react';
import {
  FlatList,
  RefreshControl,
  StyleSheet,
  View,
} from 'react-native';

import { fetchPublicChargers } from '@/api/publicChargers';
import { fetchPublicStation } from '@/api/publicStations';
import { useAuth } from '@/auth/auth-context';
import { ButtonLoader } from '@/components/loaders/button-loader';
import { SkeletonLoader } from '@/components/loaders/skeleton-loader';
import { ScreenHero } from '@/components/layout/screen-hero';
import { EmptyState, ErrorState } from '@/components/ui/empty-state';
import { ScreenContainer, ScreenContent } from '@/components/ui/screen-container';
import { Text } from '@/components/ui/text';
import { useChargingSessions } from '@/hooks/use-charging-sessions';
import { useTheme } from '@/theme';
import type { ChargingSession, ChargingSessionStatus } from '@/types/charging-session';
import { formatConnectorLabel, formatEvseLabel } from '@/utils/charging-session-labels';

import { SessionListItem } from './session-list-item';
import { SessionStatusFilterRow } from './session-status-filter-row';

type SessionLabels = {
  stationName?: string;
  evseLabel?: string;
  connectorLabel?: string;
};

async function resolveSessionLabels(session: ChargingSession): Promise<SessionLabels> {
  try {
    const [station, chargers] = await Promise.all([
      fetchPublicStation(session.stationId),
      fetchPublicChargers({ stationId: session.stationId }),
    ]);

    const charger = chargers.data.find((item) => item.id === session.chargerId);
    const connector = charger?.connectors?.find(
      (item) => item.id === session.connectorId,
    );

    return {
      stationName: station?.name,
      evseLabel: formatEvseLabel(undefined, charger?.name, session.evseId),
      connectorLabel: formatConnectorLabel(connector, session.connectorId),
    };
  } catch {
    return {};
  }
}

export function SessionsScreen() {
  const { token } = useAuth();
  const { theme } = useTheme();
  const styles = useMemo(() => createStyles(theme), [theme]);
  const [statusFilter, setStatusFilter] = useState<
    ChargingSessionStatus | undefined
  >();
  const [labelMap, setLabelMap] = useState<Record<string, SessionLabels>>({});

  const {
    sessions,
    isInitialLoading,
    isRefreshing,
    isLoadingMore,
    error,
    hasMore,
    refresh,
    loadMore,
    retry,
  } = useChargingSessions({ token, status: statusFilter });

  useEffect(() => {
    const sessionsNeedingLabels = sessions.filter(
      (session) =>
        !session.stationName || !session.evseLabel || !session.connectorLabel,
    );

    if (sessionsNeedingLabels.length === 0) {
      return;
    }

    void (async () => {
      const entries = await Promise.all(
        sessionsNeedingLabels.map(
          async (session) =>
            [session.id, await resolveSessionLabels(session)] as const,
        ),
      );
      setLabelMap((current) => ({
        ...current,
        ...Object.fromEntries(entries),
      }));
    })();
  }, [sessions]);

  const handleOpenSession = (session: ChargingSession) => {
    router.push(
      `/sessions/${encodeURIComponent(session.id)}?sessionJson=${encodeURIComponent(JSON.stringify(session))}` as Href,
    );
  };

  const renderContent = () => {
    if (!token) {
      return (
        <EmptyState
          title="Sign in to view sessions"
          message="Your charging session history is available after you sign in."
        />
      );
    }

    if (isInitialLoading) {
      return (
        <View style={styles.listContent}>
          {[0, 1, 2, 3].map((index) => (
            <View key={index} style={styles.skeletonCard}>
              <SkeletonLoader width={44} height={44} radius={14} />
              <View style={styles.skeletonBody}>
                <SkeletonLoader width="60%" height={16} />
                <SkeletonLoader width="40%" height={12} />
                <SkeletonLoader width="80%" height={14} />
              </View>
            </View>
          ))}
        </View>
      );
    }

    if (error && sessions.length === 0) {
      return (
        <ErrorState
          title="Unable to load sessions"
          message={error}
          primaryActionLabel="Retry"
          onPrimaryAction={retry}
        />
      );
    }

    if (sessions.length === 0) {
      return (
        <EmptyState
          title="No charging sessions yet"
          message="Your charging history will appear here after your first session."
        />
      );
    }

    return (
      <FlatList
        data={sessions}
        keyExtractor={(item) => item.id}
        contentContainerStyle={styles.listContent}
        showsVerticalScrollIndicator={false}
        keyboardShouldPersistTaps="handled"
        refreshControl={
          <RefreshControl
            refreshing={isRefreshing}
            onRefresh={refresh}
            tintColor={theme.colors.primary}
            colors={[theme.colors.primary]}
          />
        }
        onEndReached={() => {
          if (hasMore && !isLoadingMore) {
            void loadMore();
          }
        }}
        onEndReachedThreshold={0.35}
        ListFooterComponent={
          isLoadingMore ? (
            <View style={styles.footerLoader}>
              <ButtonLoader size={28} color={theme.colors.textLink} />
            </View>
          ) : null
        }
        renderItem={({ item }) => {
          const labels = labelMap[item.id] ?? {};
          return (
            <View style={styles.listItem}>
              <SessionListItem
                session={item}
                stationName={item.stationName ?? labels.stationName}
                evseLabel={item.evseLabel ?? labels.evseLabel}
                connectorLabel={item.connectorLabel ?? labels.connectorLabel}
                onPress={() => handleOpenSession(item)}
              />
            </View>
          );
        }}
      />
    );
  };

  return (
    <ScreenContainer edges={[]} style={styles.screen}>
      <ScreenHero />
      <View style={styles.pageHeading}>
        <Text style={styles.pageTitle} accessibilityRole="header">
          My Sessions
        </Text>
        <Text style={styles.pageSubtitle}>
          Charging history and live status
        </Text>
      </View>
      <SessionStatusFilterRow
        activeStatus={statusFilter}
        onChange={setStatusFilter}
      />
      <ScreenContent style={styles.contentArea}>{renderContent()}</ScreenContent>
    </ScreenContainer>
  );
}

function createStyles(theme: ReturnType<typeof useTheme>['theme']) {
  return StyleSheet.create({
    screen: {
      backgroundColor: theme.colors.background,
    },
    pageHeading: {
      paddingHorizontal: theme.spacing.gutter,
      paddingTop: theme.spacing.md,
      paddingBottom: theme.spacing.xs,
      gap: theme.spacing.xs,
    },
    pageTitle: {
      ...theme.textStyles.h1,
      color: theme.colors.textPrimary,
    },
    pageSubtitle: {
      fontFamily: theme.typography.fontFamily.regular,
      fontSize: theme.typography.fontSize.sm,
      lineHeight: theme.typography.lineHeight.normal,
      color: theme.colors.textSecondary,
    },
    contentArea: {
      marginTop: 0,
    },
    listContent: {
      paddingHorizontal: theme.spacing.gutter,
      paddingTop: theme.spacing.md,
      paddingBottom: theme.spacing.xl,
    },
    listItem: {
      marginBottom: 0,
    },
    centered: {
      flex: 1,
      alignItems: 'center',
      justifyContent: 'center',
      paddingVertical: 24,
    },
    skeletonCard: {
      flexDirection: 'row',
      gap: 14,
      padding: 16,
      marginBottom: 12,
      borderRadius: theme.radius.xl,
      backgroundColor: theme.colors.surface,
      borderWidth: 1,
      borderColor: theme.colors.border,
    },
    skeletonBody: {
      flex: 1,
      gap: 8,
    },
    footerLoader: {
      paddingVertical: 16,
      alignItems: 'center',
    },
  });
}
