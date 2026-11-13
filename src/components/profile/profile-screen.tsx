import { router, type Href, useFocusEffect } from 'expo-router';
import { useCallback, useMemo, useState } from 'react';
import {
  RefreshControl,
  ScrollView,
  StyleSheet,
  Switch,
  View,
} from 'react-native';

import { Text } from '@/components/ui/text';
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
import { PageLoader } from '@/components/loaders/page-loader';
import { SkeletonLoader } from '@/components/loaders/skeleton-loader';
import { ScreenHero } from '@/components/layout/screen-hero';
import { Button } from '@/components/ui/button';
import { EmptyState } from '@/components/ui/empty-state';
import { Icon } from '@/components/ui/icon';
import { SectionHeader } from '@/components/ui/section-header';
import { Surface } from '@/components/ui/surface';
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
      <ScreenContainer edges={[]} style={styles.screen}>
        <ScreenHero title="Profile" />
        <PageLoader message="Loading profile…" />
      </ScreenContainer>
    );
  }

  if (!isAuthenticated || !user) {
    return null;
  }

  const actionsDisabled = isLoggingOut || isRefreshing || busyVehicleId !== null;

  return (
    <ScreenContainer edges={[]} style={styles.screen}>
      <ScreenHero title="Profile" subtitle="Account, vehicles, and preferences" />

      <ScrollView
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
        refreshControl={
          <RefreshControl
            refreshing={isRefreshing}
            onRefresh={() => {
              void refreshProfile();
            }}
            tintColor={theme.colors.primary}
            colors={[theme.colors.primary]}
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
          <SectionHeader
            title="My vehicles"
            actionLabel="+ Add"
            onActionPress={actionsDisabled ? undefined : handleAddVehicle}
          />

          {isLoadingExtras && vehicles.length === 0 ? (
            <View style={styles.skeletonStack}>
              <SkeletonLoader height={104} radius={20} />
              <SkeletonLoader height={104} radius={20} />
            </View>
          ) : vehicles.length === 0 ? (
            <Surface variant="outlined">
              <EmptyState
                compact
                title="No vehicles yet"
                message="Add a vehicle to personalize your charging experience."
                primaryActionLabel="Add vehicle"
                onPrimaryAction={handleAddVehicle}
              />
            </Surface>
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
          <SectionHeader
            title="Recent sessions"
            actionLabel="View all"
            onActionPress={handleViewAllSessions}
          />

          {isLoadingExtras && recentSessions.length === 0 ? (
            <View style={styles.skeletonStack}>
              <SkeletonLoader height={116} radius={20} />
              <SkeletonLoader height={116} radius={20} />
            </View>
          ) : recentSessions.length === 0 ? (
            <Surface variant="outlined">
              <EmptyState
                compact
                title="No sessions yet"
                message="Your charging history will appear here after your first session."
              />
            </Surface>
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
          <SectionHeader title="Preferences" />
          <Surface style={styles.preferenceCard}>
            <View style={styles.preferenceIcon}>
              <Icon name={isDark ? 'moon' : 'sun'} size={20} color={theme.colors.primary} />
            </View>
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
                true: theme.colors.primary,
              }}
              thumbColor={theme.colors.onPrimary}
              ios_backgroundColor={theme.colors.border}
              accessibilityLabel="Toggle dark mode"
            />
          </Surface>
        </View>

        <RequestStatusBanner status={status} />

        <Button
          label={isLoggingOut ? 'Signing out…' : 'Sign out'}
          variant="outline"
          leadingIcon="log-out"
          loading={isLoggingOut}
          disabled={actionsDisabled}
          onPress={() => {
            void handleLogout();
          }}
          accessibilityLabel="Sign out"
        />
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
      paddingHorizontal: theme.spacing.gutter,
      paddingTop: theme.spacing.sm,
      paddingBottom: theme.spacing.xl,
      gap: 24,
    },
    profileHint: {
      marginTop: -8,
      fontFamily: theme.typography.fontFamily.medium,
      fontSize: 13,
      lineHeight: 19.5,
      color: theme.colors.textLink,
      textAlign: 'center',
    },
    section: {
      gap: 14,
    },
    vehicleList: {
      gap: 0,
    },
    preferenceCard: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: 14,
    },
    preferenceIcon: {
      width: 44,
      height: 44,
      borderRadius: 14,
      alignItems: 'center',
      justifyContent: 'center',
      backgroundColor: theme.colors.primaryMuted,
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
    skeletonStack: {
      gap: 12,
    },
    actionDisabled: {
      opacity: 0.55,
    },
  });
}


