import { router } from 'expo-router';
import { useEffect, useState } from 'react';
import {
  ActivityIndicator,
  Alert,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from 'react-native';

import { useAuth } from '@/auth/auth-context';
import { fetchPublicChargers } from '@/api/publicChargers';
import { fetchPublicStation } from '@/api/publicStations';
import { stopDriverChargingSession } from '@/api/chargingSessions';
import { Icon } from '@/components/ui/icon';
import { ScreenContainer, ScreenContent } from '@/components/ui/screen-container';
import { useActiveChargingSession } from '@/hooks/use-active-charging-session';
import { theme } from '@/theme';
import { formatConnectorLabel, formatEvseLabel } from '@/utils/charging-session-labels';

import { ActiveSessionCard } from './active-session-card';

export function ActiveSessionScreen() {
  const { token } = useAuth();
  const { session, isLoading, error, refresh } = useActiveChargingSession({ token });
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

  return (
    <ScreenContainer>
      <ScreenContent>
        <Pressable
          style={styles.backButton}
          onPress={() => router.back()}
          accessibilityRole="button"
        >
          <Icon name="back" size={20} color={theme.colors.textPrimary} />
          <Text style={styles.backLabel}>Back</Text>
        </Pressable>

        <Text style={styles.title}>Active Session</Text>

        {isLoading ? (
          <View style={styles.centered}>
            <ActivityIndicator color={theme.colors.brand} size="large" />
          </View>
        ) : null}

        {error ? (
          <View style={styles.errorBox}>
            <Text style={styles.errorText}>{error}</Text>
            <Pressable onPress={() => void refresh()}>
              <Text style={styles.retryText}>Retry</Text>
            </Pressable>
          </View>
        ) : null}

        {!isLoading && !session ? (
          <View style={styles.emptyBox}>
            <Text style={styles.emptyTitle}>No active session</Text>
            <Text style={styles.emptyMessage}>
              You do not have a charging session in progress right now.
            </Text>
          </View>
        ) : null}

        {session ? (
          <ScrollView contentContainerStyle={styles.content} showsVerticalScrollIndicator={false}>
            <ActiveSessionCard
              session={session}
              stationName={stationName}
              evseLabel={evseLabel}
              connectorLabel={connectorLabel}
            />

            <Pressable style={styles.stopButton} onPress={handleStop}>
              <Text style={styles.stopButtonText}>Stop charging</Text>
            </Pressable>
          </ScrollView>
        ) : null}
      </ScreenContent>
    </ScreenContainer>
  );
}

const styles = StyleSheet.create({
  backButton: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: theme.spacing.xs,
    marginBottom: theme.spacing.lg,
  },
  backLabel: {
    fontSize: theme.typography.fontSize.md,
    color: theme.colors.textPrimary,
  },
  title: {
    fontSize: theme.typography.fontSize.xl,
    fontWeight: '700',
    color: theme.colors.textPrimary,
    marginBottom: theme.spacing.lg,
  },
  centered: {
    paddingVertical: theme.spacing.xl,
    alignItems: 'center',
  },
  errorBox: {
    padding: theme.spacing.lg,
    borderRadius: theme.radius.lg,
    backgroundColor: theme.colors.surface,
    gap: theme.spacing.sm,
  },
  errorText: {
    color: theme.colors.textPrimary,
  },
  retryText: {
    color: theme.colors.brand,
    fontWeight: '600',
  },
  emptyBox: {
    padding: theme.spacing.lg,
    borderRadius: theme.radius.lg,
    backgroundColor: theme.colors.surface,
    gap: theme.spacing.sm,
  },
  emptyTitle: {
    fontSize: theme.typography.fontSize.md,
    fontWeight: '700',
    color: theme.colors.textPrimary,
  },
  emptyMessage: {
    fontSize: theme.typography.fontSize.sm,
    color: theme.colors.textMuted,
  },
  content: {
    gap: theme.spacing.md,
    paddingBottom: theme.spacing.xl,
  },
  stopButton: {
    backgroundColor: theme.colors.brand,
    borderRadius: theme.radius.md,
    paddingVertical: 14,
    alignItems: 'center',
  },
  stopButtonText: {
    color: theme.colors.textInverse,
    fontWeight: '700',
    fontSize: theme.typography.fontSize.md,
  },
});
