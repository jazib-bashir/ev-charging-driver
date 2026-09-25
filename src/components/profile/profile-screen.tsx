import { router, type Href, useFocusEffect } from 'expo-router';
import { useCallback, useMemo, useState } from 'react';
import {
  ActivityIndicator,
  Pressable,
  RefreshControl,
  ScrollView,
  StyleSheet,
  Switch,
  Text,
  View,
} from 'react-native';

import { AuthApiError } from '@/api/auth';
import { listDriverChargingSessions } from '@/api/chargingSessions';
import {
  getDriverVehicleDisplayName,
  listDriverVehicles,
  setDefaultDriverVehicle,
} from '@/api/driverVehicles';
import { fetchPublicStation } from '@/api/publicStations';
import { useAuth } from '@/auth/auth-context';
import { AuthPrimaryButton } from '@/components/auth/auth-primary-button';
import { ProfileHero } from '@/components/profile/profile-hero';
import { ProfileSessionPreview } from '@/components/profile/profile-session-preview';
import { ProfileVehicleCard } from '@/components/profile/profile-vehicle-card';
import { StationHeader } from '@/components/station/station-header';
import { Icon } from '@/components/ui/icon';
import {
  RequestStatusBanner,
  useRequestStatus,
} from '@/components/ui/request-status';
import { ScreenContainer } from '@/components/ui/screen-container';
import { useTheme } from '@/theme';
import type { ChargingSession } from '@/types/charging-session';
import type { DriverVehicle } from '@/types/vehicle';

const RECENT_SESSIONS_LIMIT = 3;

type ProfileScreenProps = {
  onLogin: () => void;
};

export function ProfileScreen({ onLogin }: ProfileScreenProps) {
  const {
    user,
    token,
    isAuthenticated,
    isOnboarded,
    logout,
    isLoading,
    refreshUser,
  } = useAuth();
  const { theme, isDark, setMode } = useTheme();
  const styles = useMemo(() => createStyles(theme), [theme]);
  const { status, showError, showSuccess, clearStatus } = useRequestStatus();
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [isLoggingOut, setIsLoggingOut] = useState(false);
  const [vehicles, setVehicles] = useState<DriverVehicle[]>([]);
  const [recentSessions, setRecentSessions] = useState<ChargingSession[]>([]);
  const [sessionStationNames, setSessionStationNames] = useState<
    Record<string, string>
  >({});
  const [busyVehicleId, setBusyVehicleId] = useState<string | null>(null);
  const [isLoadingExtras, setIsLoadingExtras] = useState(true);

  const loadProfileExtras = useCallback(async () => {
    if (!token) {
      setVehicles([]);
      setRecentSessions([]);
      setIsLoadingExtras(false);
      return;
    }

    setIsLoadingExtras(true);

    try {
      const [vehicleList, sessionsResult] = await Promise.all([
        listDriverVehicles(token),
        listDriverChargingSessions(token, {
          page: 1,
          limit: RECENT_SESSIONS_LIMIT,
        }),
      ]);

      setVehicles(vehicleList);
      setRecentSessions(sessionsResult.data);

      const sessionsNeedingNames = sessionsResult.data.filter(
        (session) => !session.stationName,
      );

      if (sessionsNeedingNames.length > 0) {
        const entries = await Promise.all(
          sessionsNeedingNames.map(async (session) => {
            try {
              const station = await fetchPublicStation(session.stationId);
              return [session.id, station?.name ?? 'Charging session'] as const;
            } catch {
              return [session.id, 'Charging session'] as const;
            }
          }),
        );

        setSessionStationNames(Object.fromEntries(entries));
      } else {
        setSessionStationNames({});
      }
    } catch (err) {
      const message =
        err instanceof AuthApiError
          ? err.message
          : 'Unable to load profile details. Please try again.';
      showError(message);
    } finally {
      setIsLoadingExtras(false);
    }
  }, [token, showError]);

  const refreshProfile = useCallback(async () => {
    if (!isAuthenticated) {
      return;
    }

    setIsRefreshing(true);
    clearStatus();

    try {
      const nextUser = await refreshUser();
      if (!nextUser) {
        showError('Unable to refresh your profile. Please sign in again.');
        return;
      }

      await loadProfileExtras();
    } catch {
      showError('Unable to refresh your profile. Please try again.');
    } finally {
      setIsRefreshing(false);
    }
  }, [isAuthenticated, refreshUser, loadProfileExtras, clearStatus, showError]);

  useFocusEffect(
    useCallback(() => {
      if (!isAuthenticated) {
        return;
      }

      void refreshProfile();
    }, [isAuthenticated, refreshProfile]),
  );

  const handleEditDetails = useCallback(() => {
    if (isLoggingOut || isRefreshing) {
      return;
    }

    if (!isOnboarded) {
      router.push('/auth/onboarding' as Href);
      return;
    }

    router.push({
      pathname: '/auth/onboarding',
      params: { mode: 'edit' },
    } as Href);
  }, [isOnboarded, isLoggingOut, isRefreshing]);

  const handleManageVehicles = useCallback(() => {
    if (isLoggingOut || isRefreshing) {
      return;
    }

    router.push({
      pathname: '/auth/vehicles',
      params: { from: 'profile' },
    } as Href);
  }, [isLoggingOut, isRefreshing]);

  const handleAddVehicle = useCallback(() => {
    handleManageVehicles();
  }, [handleManageVehicles]);

  const handleViewAllSessions = useCallback(() => {
    router.push('/(tabs)/sessions' as Href);
  }, []);

  const handleOpenSession = useCallback((session: ChargingSession) => {
    router.push(
      `/sessions/${encodeURIComponent(session.id)}?sessionJson=${encodeURIComponent(JSON.stringify(session))}` as Href,
    );
  }, []);

  const handleMakeDefault = useCallback(
    async (vehicle: DriverVehicle) => {
      if (!token || vehicle.isDefault || busyVehicleId) {
        return;
      }

      setBusyVehicleId(vehicle.id);
      clearStatus();

      try {
        const updated = await setDefaultDriverVehicle(token, vehicle.id);
        setVehicles((current) =>
          current.map((item) => ({
            ...item,
            isDefault: item.id === updated.id,
          })),
        );
        await refreshUser();
        showSuccess(`${getDriverVehicleDisplayName(updated)} set as default.`);
      } catch (err) {
        const message =
          err instanceof AuthApiError
            ? err.message
            : 'Unable to set default vehicle. Please try again.';
        showError(message);
      } finally {
        setBusyVehicleId(null);
      }
    },
    [token, busyVehicleId, clearStatus, refreshUser, showSuccess, showError],
  );

  const handleLogout = useCallback(async () => {
    if (isLoggingOut) {
      return;
    }

    setIsLoggingOut(true);
    clearStatus();

    try {
      await logout();
      showSuccess('Signed out successfully.');
    } catch {
      showError('Unable to sign out. Please try again.');
    } finally {
      setIsLoggingOut(false);
    }
  }, [isLoggingOut, logout, clearStatus, showSuccess, showError]);

  if (isLoading) {
    return (
      <ScreenContainer edges={['top']}>
        <View style={styles.centered}>
          <ActivityIndicator color={theme.colors.brand} />
          <Text style={styles.muted}>Loading profile…</Text>
        </View>
      </ScreenContainer>
    );
  }

  if (!isAuthenticated || !user) {
    return (
      <ScreenContainer edges={['top']}>
        <StationHeader />
        <View style={styles.unauthenticatedContent}>
          <Text style={styles.title}>Profile</Text>
          <Text style={styles.subtitle}>
            Sign in to manage your details and vehicles.
          </Text>
          <RequestStatusBanner status={status} />
          <AuthPrimaryButton label="Sign in" onPress={onLogin} />
        </View>
      </ScreenContainer>
    );
  }

  const actionsDisabled = isLoggingOut || isRefreshing || busyVehicleId !== null;

  return (
    <ScreenContainer edges={['top']}>
      <StationHeader />

      <ScrollView
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
        refreshControl={
          <RefreshControl
            refreshing={isRefreshing}
            onRefresh={() => {
              void refreshProfile();
            }}
            tintColor={theme.colors.brand}
            colors={[theme.colors.brand]}
          />
        }
      >
        <ProfileHero
          name={user.name || 'Driver'}
          email={user.email || '—'}
          phone={user.phoneNumber}
          onEdit={handleEditDetails}
          disabled={actionsDisabled}
        />

        {!isOnboarded ? (
          <Text style={styles.profileHint}>
            Finish your profile to unlock booking.
          </Text>
        ) : null}

        <View style={styles.section}>
          <Text style={styles.sectionTitle}>My Vehicles</Text>

          {isLoadingExtras && vehicles.length === 0 ? (
            <View style={styles.inlineLoader}>
              <ActivityIndicator color={theme.colors.brand} />
            </View>
          ) : vehicles.length === 0 ? (
            <View style={styles.emptyCard}>
              <Text style={styles.emptyTitle}>No vehicles yet</Text>
              <Text style={styles.emptyMessage}>
                Add a vehicle to personalize your charging experience.
              </Text>
            </View>
          ) : (
            <View style={styles.vehicleList}>
              {vehicles.map((vehicle, index) => (
                <ProfileVehicleCard
                  key={vehicle.id}
                  vehicle={vehicle}
                  index={index}
                  isBusy={busyVehicleId === vehicle.id}
                  disabled={actionsDisabled}
                  onMakeDefault={() => {
                    void handleMakeDefault(vehicle);
                  }}
                  onManageVehicles={handleManageVehicles}
                />
              ))}
            </View>
          )}

          <Pressable
            onPress={handleAddVehicle}
            disabled={actionsDisabled}
            style={[
              styles.addVehicleButton,
              actionsDisabled && styles.actionDisabled,
            ]}
            accessibilityRole="button"
            accessibilityLabel="Add vehicle"
          >
            <Icon name="add" size={18} color={theme.colors.textMuted} />
            <Text style={styles.addVehicleLabel}>Add Vehicle</Text>
          </Pressable>
        </View>

        <View style={styles.section}>
          <View style={styles.sectionHeaderRow}>
            <Text style={styles.sectionTitle}>Recent Sessions</Text>
            <Pressable
              onPress={handleViewAllSessions}
              hitSlop={8}
              accessibilityRole="button"
              accessibilityLabel="View all charging sessions"
            >
              <Text style={styles.viewAllLabel}>View All</Text>
            </Pressable>
          </View>

          {isLoadingExtras && recentSessions.length === 0 ? (
            <View style={styles.inlineLoader}>
              <ActivityIndicator color={theme.colors.brand} />
            </View>
          ) : recentSessions.length === 0 ? (
            <View style={styles.emptyCard}>
              <Text style={styles.emptyTitle}>No sessions yet</Text>
              <Text style={styles.emptyMessage}>
                Your charging history will appear here after your first session.
              </Text>
            </View>
          ) : (
            <View style={styles.sessionCard}>
              {recentSessions.map((session, index) => (
                <View key={session.id}>
                  {index > 0 ? <View style={styles.sessionDivider} /> : null}
                  <ProfileSessionPreview
                    session={session}
                    stationName={
                      session.stationName ?? sessionStationNames[session.id]
                    }
                    index={index}
                    onPress={() => handleOpenSession(session)}
                  />
                </View>
              ))}
            </View>
          )}
        </View>

        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Preferences</Text>
          <View style={styles.preferenceCard}>
            <View style={styles.preferenceCopy}>
              <Text style={styles.preferenceTitle}>Dark mode</Text>
              <Text style={styles.preferenceSubtitle}>
                Switch between light and dark appearance
              </Text>
            </View>
            <Switch
              value={isDark}
              onValueChange={(value) => setMode(value ? 'dark' : 'light')}
              trackColor={{
                false: theme.colors.border,
                true: theme.colors.accent,
              }}
              thumbColor={theme.colors.surface}
              ios_backgroundColor={theme.colors.border}
              accessibilityLabel="Toggle dark mode"
            />
          </View>
        </View>

        <RequestStatusBanner status={status} />

        <Pressable
          onPress={() => {
            void handleLogout();
          }}
          disabled={actionsDisabled}
          style={[
            styles.logoutButton,
            actionsDisabled && styles.actionDisabled,
          ]}
          accessibilityRole="button"
          accessibilityLabel="Log out"
          accessibilityState={{ busy: isLoggingOut }}
        >
          {isLoggingOut ? (
            <ActivityIndicator color={theme.colors.notification} />
          ) : (
            <Text style={styles.logoutLabel}>Log out</Text>
          )}
        </Pressable>
      </ScrollView>
    </ScreenContainer>
  );
}

function createStyles(theme: ReturnType<typeof useTheme>['theme']) {
  return StyleSheet.create({
    scrollContent: {
      paddingHorizontal: theme.spacing.lg,
      paddingBottom: theme.spacing.xxl,
      gap: theme.spacing.xl,
    },
    centered: {
      flex: 1,
      alignItems: 'center',
      justifyContent: 'center',
      gap: theme.spacing.md,
    },
    unauthenticatedContent: {
      flex: 1,
      paddingHorizontal: theme.spacing.lg,
      paddingTop: theme.spacing.lg,
      gap: theme.spacing.lg,
    },
    profileHint: {
      marginTop: -theme.spacing.sm,
      fontSize: theme.typography.fontSize.sm,
      color: theme.colors.brand,
      textAlign: 'center',
      lineHeight: theme.typography.lineHeight.normal,
    },
    section: {
      gap: theme.spacing.md,
    },
    sectionTitle: {
      fontSize: theme.typography.fontSize.lg,
      fontWeight: theme.typography.fontWeight.bold,
      color: theme.colors.textPrimary,
      letterSpacing: -0.2,
    },
    sectionHeaderRow: {
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'space-between',
      gap: theme.spacing.md,
    },
    viewAllLabel: {
      fontSize: theme.typography.fontSize.sm,
      fontWeight: theme.typography.fontWeight.semibold,
      color: theme.colors.brand,
    },
    vehicleList: {
      gap: theme.spacing.md,
    },
    addVehicleButton: {
      minHeight: 52,
      borderRadius: theme.radius.lg,
      borderWidth: 1.5,
      borderStyle: 'dashed',
      borderColor: theme.colors.border,
      backgroundColor: theme.colors.surface,
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'center',
      gap: theme.spacing.sm,
    },
    addVehicleLabel: {
      fontSize: theme.typography.fontSize.md,
      fontWeight: theme.typography.fontWeight.semibold,
      color: theme.colors.textSecondary,
    },
    preferenceCard: {
      borderRadius: theme.radius.lg,
      borderWidth: 1,
      borderColor: theme.colors.border,
      backgroundColor: theme.colors.surface,
      paddingHorizontal: theme.spacing.md,
      paddingVertical: theme.spacing.md,
      flexDirection: 'row',
      alignItems: 'center',
      gap: theme.spacing.md,
      ...theme.shadows.card,
    },
    preferenceCopy: {
      flex: 1,
      gap: 2,
    },
    preferenceTitle: {
      fontSize: theme.typography.fontSize.md,
      fontWeight: theme.typography.fontWeight.semibold,
      color: theme.colors.textPrimary,
    },
    preferenceSubtitle: {
      fontSize: theme.typography.fontSize.sm,
      color: theme.colors.textMuted,
      lineHeight: theme.typography.lineHeight.normal,
    },
    sessionCard: {
      borderRadius: theme.radius.lg,
      borderWidth: 1,
      borderColor: theme.colors.border,
      backgroundColor: theme.colors.surface,
      paddingHorizontal: theme.spacing.md,
      ...theme.shadows.card,
    },
    sessionDivider: {
      height: StyleSheet.hairlineWidth,
      backgroundColor: theme.colors.borderLight,
    },
    emptyCard: {
      borderRadius: theme.radius.lg,
      borderWidth: 1,
      borderColor: theme.colors.border,
      backgroundColor: theme.colors.surface,
      padding: theme.spacing.lg,
      gap: theme.spacing.xs,
    },
    emptyTitle: {
      fontSize: theme.typography.fontSize.md,
      fontWeight: theme.typography.fontWeight.semibold,
      color: theme.colors.textPrimary,
    },
    emptyMessage: {
      fontSize: theme.typography.fontSize.sm,
      color: theme.colors.textMuted,
      lineHeight: theme.typography.lineHeight.normal,
    },
    inlineLoader: {
      paddingVertical: theme.spacing.lg,
      alignItems: 'center',
    },
    logoutButton: {
      alignSelf: 'center',
      minHeight: 44,
      alignItems: 'center',
      justifyContent: 'center',
      paddingVertical: theme.spacing.sm,
    },
    logoutLabel: {
      fontSize: theme.typography.fontSize.md,
      fontWeight: theme.typography.fontWeight.semibold,
      color: theme.colors.notification,
    },
    title: {
      fontSize: 28,
      fontWeight: theme.typography.fontWeight.bold,
      color: theme.colors.textPrimary,
      letterSpacing: -0.4,
    },
    subtitle: {
      fontSize: theme.typography.fontSize.md,
      color: theme.colors.textMuted,
      lineHeight: 22,
    },
    muted: {
      fontSize: theme.typography.fontSize.md,
      color: theme.colors.textMuted,
    },
    actionDisabled: {
      opacity: 0.55,
    },
  });
}
