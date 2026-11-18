import { router } from 'expo-router';
import { useEffect, useState, useMemo } from 'react';
import { Alert, Pressable, RefreshControl, ScrollView, StyleSheet, View } from 'react-native';

import { useAuth } from '@/auth/auth-context';
import { fetchPublicChargers } from '@/api/publicChargers';
import { fetchPublicStation } from '@/api/publicStations';
import { stopDriverChargingSession } from '@/api/chargingSessions';
import { ScreenHero } from '@/components/layout/screen-hero';
import { Button } from '@/components/ui/button';
import { EmptyState, ErrorState } from '@/components/ui/empty-state';
import { Icon } from '@/components/ui/icon';
import { PageLoader } from '@/components/loaders';
import { ScreenContainer, ScreenContent } from '@/components/ui/screen-container';
import { useActiveChargingSession } from '@/hooks/use-active-charging-session';
import { useTheme } from '@/theme';
import { formatConnectorLabel, formatEvseLabel } from '@/utils/charging-session-labels';

import { ActiveSessionCard } from './active-session-card';

export function ActiveSessionScreen() {
  const { theme } = useTheme();
  const styles = useMemo(() => createStyles(theme), [theme]);
  const { token } = useAuth();
  const { session, isLoading, isRefreshing, error, refresh } = useActiveChargingSession({
    token,
  });
  const [stationName, setStationName] = useState<string>();
  const [evseLabel, setEvseLabel] = useState<string>();
  const [connectorLabel, setConnectorLabel] = useState<string>();

  useEffect(() => {
    if (!session) {
      return;
    }

    void (async () => {
      const [station, chargers] = await Promise.all([
        fetchPublicStation(session.stationId),
        fetchPublicChargers({ stationId: session.stationId }),
      ]);

      const charger = chargers.data.find((item) => item.id === session.chargerId);
      const connector = charger?.connectors?.find((item) => item.id === session.connectorId);

      setStationName(station?.name);
      setEvseLabel(formatEvseLabel(undefined, charger?.name, session.evseId));
      setConnectorLabel(formatConnectorLabel(connector, session.connectorId));
    })();
  }, [session]);

  const handleStop = () => {
    if (!token || !session) {
      return;
    }

    Alert.alert(
      'Stop charging?',
      'Your charging session will end. The EVSE will be released for the next driver.',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Stop charging',
          style: 'destructive',
          onPress: () => {
            void (async () => {
              try {
                await stopDriverChargingSession(token, session.id);
                router.replace('/(tabs)/sessions');
              } catch (stopError) {
                Alert.alert(
                  'Unable to stop session',
                  stopError instanceof Error ? stopError.message : 'Please try again.',
                );
              }
            })();
          },
        },
      ],
    );
  };

  const handleBack = () => {
    if (router.canGoBack()) {
      router.back();
    } else {
      router.replace('/');
    }
  };

  return (
    <ScreenContainer edges={[]}>
      <ScreenHero />
      <View style={styles.toolbar}>
        <Pressable
          onPress={handleBack}
          style={styles.backBtn}
          accessibilityRole="button"
          accessibilityLabel="Go back"
          hitSlop={8}
        >
          <Icon name="back" size={22} color={theme.colors.textPrimary} />
        </Pressable>
      </View>
      <ScreenContent>
        {isLoading ? <PageLoader message="Loading your session…" /> : null}

        {error && !isLoading ? (
          <ErrorState
            title="Couldn't load your session"
            message={error}
            primaryActionLabel="Try again"
            onPrimaryAction={() => void refresh()}
          />
        ) : null}

        {!isLoading && !error && !session ? (
          <EmptyState
            title="No active session"
            message="You do not have a charging session in progress right now."
            primaryActionLabel="Find a charger"
            onPrimaryAction={() => router.replace('/(tabs)')}
          />
        ) : null}

        {session ? (
          <ScrollView
            contentContainerStyle={styles.content}
            showsVerticalScrollIndicator={false}
            refreshControl={
              <RefreshControl
                refreshing={isRefreshing}
                onRefresh={() => {
                  void refresh({ showLoading: false });
                }}
                tintColor={theme.colors.primary}
                colors={[theme.colors.primary]}
              />
            }
          >
            <ActiveSessionCard
              session={session}
              stationName={stationName}
              evseLabel={evseLabel}
              connectorLabel={connectorLabel}
            />

            <Button
              label="Stop charging"
              variant="destructive"
              size="lg"
              leadingIcon="stop"
              fullWidth
              onPress={handleStop}
            />
          </ScrollView>
        ) : null}
      </ScreenContent>
    </ScreenContainer>
  );
}

function createStyles(theme: ReturnType<typeof useTheme>['theme']) {
  return StyleSheet.create({
    toolbar: {
      flexDirection: 'row',
      alignItems: 'center',
      paddingHorizontal: theme.spacing.gutter,
      paddingTop: theme.spacing.md,
      paddingBottom: theme.spacing.xs,
    },
    backBtn: {
      width: 40,
      height: 40,
      borderRadius: 20,
      alignItems: 'center',
      justifyContent: 'center',
      backgroundColor: theme.colors.surface,
      borderWidth: StyleSheet.hairlineWidth,
      borderColor: theme.colors.border,
    },
    content: {
      gap: theme.spacing.lg,
      paddingHorizontal: theme.spacing.gutter,
      paddingBottom: theme.spacing.huge,
    },
  });
}
