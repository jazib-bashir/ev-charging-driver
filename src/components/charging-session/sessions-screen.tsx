import { router, type Href } from 'expo-router';
import { useEffect, useMemo, useState } from 'react';
import {
  ActivityIndicator,
  FlatList,
  RefreshControl,
  StyleSheet,
  View,
} from 'react-native';

import { fetchPublicChargers } from '@/api/publicChargers';
import { fetchPublicStation } from '@/api/publicStations';
import { useAuth } from '@/auth/auth-context';
import { EmptyState } from '@/components/ui/empty-state';
import { ScreenContainer, ScreenContent } from '@/components/ui/screen-container';
import { useChargingSessions } from '@/hooks/use-charging-sessions';
import { useTheme } from '@/theme';
import type { ChargingSession, ChargingSessionStatus } from '@/types/charging-session';
import { formatConnectorLabel, formatEvseLabel } from '@/utils/charging-session-labels';

import { SessionListItem } from './session-list-item';
import { SessionStatusFilterRow } from './session-status-filter-row';
import { SessionsScreenHeader } from './sessions-screen-header';

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
        <View style={styles.centered}>
          <ActivityIndicator color={theme.colors.accent} size="large" />
        </View>
      );
    }

    if (error && sessions.length === 0) {
      return (
        <EmptyState
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
            tintColor={theme.colors.accent}
            colors={[theme.colors.accent]}
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
              <ActivityIndicator color={theme.colors.accent} />
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
    <ScreenContainer edges={['top']} style={styles.screen}>
      <SessionsScreenHeader
        onRefresh={() => void refresh()}
        isRefreshing={isRefreshing}
      />
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
    contentArea: {
      marginTop: 0,
    },
    listContent: {
      paddingHorizontal: 20,
      paddingTop: 16,
      paddingBottom: 24,
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
    footerLoader: {
      paddingVertical: 16,
      alignItems: 'center',
    },
  });
}
