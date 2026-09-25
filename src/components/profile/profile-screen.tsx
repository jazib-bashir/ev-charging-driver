import { router, type Href, useFocusEffect } from 'expo-router';
import { useCallback, useMemo, useState } from 'react';
import {
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
  updateDriverVehicle,
} from '@/api/driverVehicles';
import { fetchPublicStation } from '@/api/publicStations';
import { useAuth } from '@/auth/auth-context';
import { ProfileHero } from '@/components/profile/profile-hero';
import { ProfilePlateSheet } from '@/components/profile/profile-plate-sheet';
import { ProfileSessionPreview } from '@/components/profile/profile-session-preview';
import { ProfileVehicleCard } from '@/components/profile/profile-vehicle-card';
import { StationHeader } from '@/components/station/station-header';
import {
  RequestStatusBanner,
  useRequestStatus,
} from '@/components/ui/request-status';
import { ScreenContainer } from '@/components/ui/screen-container';
import { useTheme } from '@/theme';
import type { ChargingSession } from '@/types/charging-session';
import type { DriverVehicle } from '@/types/vehicle';

const RECENT_SESSIONS_LIMIT = 3;

export function ProfileScreen() {
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
  const [plateVehicle, setPlateVehicle] = useState<DriverVehicle | null>(null);
  const [isSavingPlate, setIsSavingPlate] = useState(false);

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

  const handleOpenPlateEditor = useCallback(
    (vehicle: DriverVehicle) => {
      if (isLoggingOut || isRefreshing || busyVehicleId) {
        return;
      }

      clearStatus();
      setPlateVehicle(vehicle);
    },
    [busyVehicleId, clearStatus, isLoggingOut, isRefreshing],
  );

  const handleClosePlateEditor = useCallback(() => {
    if (isSavingPlate) {
      return;
    }
    setPlateVehicle(null);
  }, [isSavingPlate]);

  const handleSavePlate = useCallback(
    async (plate: string) => {
      if (!token || !plateVehicle || isSavingPlate) {
        return;
      }

      setIsSavingPlate(true);
      clearStatus();

      try {
        const updated = await updateDriverVehicle(token, plateVehicle.id, {
          licensePlate: plate || null,
        });
        setVehicles((current) =>
          current.map((item) =>
            item.id === updated.id
              ? { ...item, licensePlate: updated.licensePlate ?? null }
              : item,
          ),
        );
        setPlateVehicle(null);
        showSuccess(plate ? 'Number plate updated.' : 'Number plate removed.');
      } catch (err) {
        const message =
          err instanceof AuthApiError
            ? err.message
            : 'Unable to save number plate. Please try again.';
        showError(message);
      } finally {
        setIsSavingPlate(false);
      }
    },
    [
      token,
      plateVehicle,
      isSavingPlate,
      clearStatus,
      showSuccess,
      showError,
    ],
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
      <ScreenContainer edges={['top']} style={styles.screen}>
        <View style={styles.centered}>
          <View style={styles.skeletonCard} />
          <Text style={styles.muted}>Loading profile…</Text>
        </View>
      </ScreenContainer>
    );
  }

  if (!isAuthenticated || !user) {
    return null;
  }

  const actionsDisabled = isLoggingOut || isRefreshing || busyVehicleId !== null;

  return (
    <ScreenContainer edges={['top']} style={styles.screen}>
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
            tintColor={theme.colors.accent}
            colors={[theme.colors.accent]}
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
          <View style={styles.sectionHeaderRow}>
            <Text style={styles.sectionTitle}>My Vehicles</Text>
            <Pressable
              onPress={handleAddVehicle}
              disabled={actionsDisabled}
              hitSlop={8}
              style={actionsDisabled ? styles.actionDisabled : undefined}
              accessibilityRole="button"
              accessibilityLabel="Add vehicle"
            >
              <Text style={styles.addLabel}>+ Add</Text>
            </Pressable>
          </View>

          {isLoadingExtras && vehicles.length === 0 ? (
            <View style={styles.skeletonStack}>
              <View style={styles.skeletonCard} />
              <View style={styles.skeletonCard} />
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
                  onEditPlate={() => handleOpenPlateEditor(vehicle)}
                />
              ))}
            </View>
          )}
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
            <View style={styles.skeletonStack}>
              <View style={styles.skeletonRow} />
              <View style={styles.skeletonRow} />
            </View>
          ) : recentSessions.length === 0 ? (
            <View style={styles.emptyCard}>
              <Text style={styles.emptyTitle}>No sessions yet</Text>
              <Text style={styles.emptyMessage}>
                Your charging history will appear here after your first session.
              </Text>
            </View>
          ) : (
            <View>
              {recentSessions.map((session, index) => (
                <ProfileSessionPreview
                  key={session.id}
                  session={session}
                  stationName={
                    session.stationName ?? sessionStationNames[session.id]
                  }
                  index={index}
                  onPress={() => handleOpenSession(session)}
                />
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
          accessibilityLabel="Sign out"
          accessibilityState={{ busy: isLoggingOut }}
        >
          {isLoggingOut ? (
            <Text style={styles.logoutBusy}>Signing out…</Text>
          ) : (
            <Text style={styles.logoutLabel}>Sign Out</Text>
          )}
        </Pressable>
      </ScrollView>

      <ProfilePlateSheet
        visible={plateVehicle !== null}
        vehicle={plateVehicle}
        isSaving={isSavingPlate}
        onClose={handleClosePlateEditor}
        onSave={(plate) => {
          void handleSavePlate(plate);
        }}
      />
    </ScreenContainer>
  );
}

function createStyles(theme: ReturnType<typeof useTheme>['theme']) {
  return StyleSheet.create({
    screen: {
      backgroundColor: theme.colors.background,
    },
    scrollContent: {
      paddingHorizontal: 20,
      paddingBottom: 32,
      gap: 20,
    },
    centered: {
      flex: 1,
      alignItems: 'center',
      justifyContent: 'center',
      gap: theme.spacing.md,
      backgroundColor: theme.colors.background,
    },
    profileHint: {
      marginTop: -8,
      fontFamily: theme.typography.fontFamily.medium,
      fontSize: 13,
      lineHeight: 19.5,
      color: theme.colors.accent,
      textAlign: 'center',
    },
    section: {
      gap: 12,
    },
    sectionTitle: {
      fontFamily: theme.typography.fontFamily.brand,
      fontSize: 16,
      lineHeight: 24,
      color: theme.colors.textPrimary,
    },
    sectionHeaderRow: {
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'space-between',
      gap: 12,
    },
    addLabel: {
      fontFamily: theme.typography.fontFamily.semibold,
      fontSize: 12,
      lineHeight: 18,
      color: theme.colors.accent,
    },
    viewAllLabel: {
      fontFamily: theme.typography.fontFamily.semibold,
      fontSize: 12,
      lineHeight: 18,
      color: theme.colors.accent,
    },
    vehicleList: {
      gap: 0,
    },
    preferenceCard: {
      backgroundColor: theme.colors.surface,
      borderRadius: 14,
      borderWidth: 1,
      borderColor: theme.colors.border,
      padding: 12,
      flexDirection: 'row',
      alignItems: 'center',
      gap: 12,
      ...theme.shadows.card,
      shadowColor: theme.colors.shadow,
    },
    preferenceCopy: {
      flex: 1,
      gap: 2,
    },
    preferenceTitle: {
      fontFamily: theme.typography.fontFamily.medium,
      fontSize: 14,
      lineHeight: 21,
      color: theme.colors.textPrimary,
    },
    preferenceSubtitle: {
      fontFamily: theme.typography.fontFamily.medium,
      fontSize: 12,
      lineHeight: 18,
      color: theme.colors.textMuted,
    },
    emptyCard: {
      backgroundColor: theme.colors.surface,
      borderRadius: 14,
      borderWidth: 1,
      borderColor: theme.colors.border,
      padding: 12,
      gap: 4,
      ...theme.shadows.card,
      shadowColor: theme.colors.shadow,
    },
    emptyTitle: {
      fontFamily: theme.typography.fontFamily.medium,
      fontSize: 14,
      lineHeight: 21,
      color: theme.colors.textPrimary,
    },
    emptyMessage: {
      fontFamily: theme.typography.fontFamily.medium,
      fontSize: 13,
      lineHeight: 19.5,
      color: theme.colors.textMuted,
    },
    skeletonStack: {
      gap: 10,
    },
    skeletonCard: {
      height: 96,
      borderRadius: 14,
      backgroundColor: theme.colors.iconBackground,
      borderWidth: 1,
      borderColor: theme.colors.border,
    },
    skeletonRow: {
      height: 68,
      borderRadius: 14,
      marginBottom: 10,
      backgroundColor: theme.colors.iconBackground,
      borderWidth: 1,
      borderColor: theme.colors.border,
    },
    logoutButton: {
      alignSelf: 'flex-start',
      minHeight: 44,
      alignItems: 'center',
      justifyContent: 'center',
      paddingVertical: 8,
    },
    logoutLabel: {
      fontFamily: theme.typography.fontFamily.medium,
      fontSize: 14,
      lineHeight: 21,
      color: theme.colors.notification,
    },
    logoutBusy: {
      fontFamily: theme.typography.fontFamily.medium,
      fontSize: 14,
      lineHeight: 21,
      color: theme.colors.textMuted,
    },
    muted: {
      fontFamily: theme.typography.fontFamily.medium,
      fontSize: 15,
      color: theme.colors.textMuted,
    },
    actionDisabled: {
      opacity: 0.55,
    },
  });
}
