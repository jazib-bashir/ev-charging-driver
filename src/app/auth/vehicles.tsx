import { router, useFocusEffect, useLocalSearchParams, type Href } from 'expo-router';
import { useCallback, useMemo, useState } from 'react';
import {
  ActivityIndicator,
  Pressable,
  StyleSheet,
  Text,
  View,
} from 'react-native';

import { AuthApiError } from '@/api/auth';
import {
  createDriverVehicle,
  listDriverVehicles,
  setDefaultDriverVehicle,
} from '@/api/driverVehicles';
import {
  fetchPublicVehicleModels,
  PublicVehicleModelsApiError,
} from '@/api/publicVehicleModels';
import { useAuth } from '@/auth/auth-context';
import {
  catalogItemConnectors,
  driverVehicleConnectorsLabel,
  driverVehicleTitle,
  resumeBookingHref,
} from '@/auth/profile-flow';
import { AuthPrimaryButton } from '@/components/auth/auth-primary-button';
import { AuthScreenShell } from '@/components/auth/auth-screen-shell';
import {
  RequestStatusBanner,
  useRequestStatus,
} from '@/components/ui/request-status';
import { theme } from '@/theme';
import type { DriverVehicle, VehicleCatalogItem } from '@/types/vehicle';

type BusyKey = string | null;

export default function VehicleSelectionScreen() {
  const { from } = useLocalSearchParams<{ from?: string }>();
  const fromProfile = from === 'profile';
  const { token, pendingBooking, refreshUser } = useAuth();
  const { status, showError, showSuccess, clearStatus } = useRequestStatus();

  const [catalog, setCatalog] = useState<VehicleCatalogItem[]>([]);
  const [savedVehicles, setSavedVehicles] = useState<DriverVehicle[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [busyKey, setBusyKey] = useState<BusyKey>(null);
  const [loadFailed, setLoadFailed] = useState(false);

  const isBusy = busyKey !== null;

  const defaultVehicle = useMemo(
    () => savedVehicles.find((vehicle) => vehicle.isDefault) ?? null,
    [savedVehicles],
  );

  const savedCatalogIds = useMemo(() => {
    const ids = new Set<string>();
    for (const vehicle of savedVehicles) {
      if (vehicle.vehicleModelId) {
        ids.add(vehicle.vehicleModelId);
      }
      if (vehicle.vehicleModel?.id) {
        ids.add(vehicle.vehicleModel.id);
      }
    }
    return ids;
  }, [savedVehicles]);

  const loadVehicles = useCallback(async () => {
    if (!token) {
      setLoadFailed(true);
      setIsLoading(false);
      showError('Your session expired. Please log in again.');
      return;
    }

    setIsLoading(true);
    setLoadFailed(false);
    clearStatus();

    try {
      const [models, vehicles] = await Promise.all([
        fetchPublicVehicleModels({ all: true }),
        listDriverVehicles(token),
      ]);
      setCatalog(models);
      setSavedVehicles(vehicles);
    } catch (err) {
      setLoadFailed(true);
      const message =
        err instanceof AuthApiError || err instanceof PublicVehicleModelsApiError
          ? err.message
          : 'Unable to load vehicles. Please try again.';
      showError(message);
    } finally {
      setIsLoading(false);
    }
  }, [token, showError, clearStatus]);

  useFocusEffect(
    useCallback(() => {
      void loadVehicles();
    }, [loadVehicles]),
  );

  const finishFlow = useCallback(async () => {
    if (isBusy) {
      return;
    }

    setBusyKey('continue');
    clearStatus();

    try {
      await refreshUser();

      if (fromProfile) {
        showSuccess('Vehicle preferences saved.');
        if (router.canGoBack()) {
          router.back();
        } else {
          router.replace('/(tabs)/profile' as Href);
        }
        return;
      }

      if (pendingBooking?.stationId) {
        router.replace(resumeBookingHref(pendingBooking) as Href);
        return;
      }

      router.replace('/' as Href);
    } catch {
      showError('Unable to continue. Please try again.');
    } finally {
      setBusyKey(null);
    }
  }, [
    isBusy,
    clearStatus,
    refreshUser,
    fromProfile,
    pendingBooking,
    showSuccess,
    showError,
  ]);

  const handleSelectCatalog = async (item: VehicleCatalogItem) => {
    if (!token || isBusy) {
      return;
    }

    const existing = savedVehicles.find(
      (vehicle) =>
        vehicle.vehicleModelId === item.id ||
        vehicle.vehicleModel?.id === item.id,
    );

    if (existing?.isDefault) {
      return;
    }

    setBusyKey(`catalog:${item.id}`);
    clearStatus();

    try {
      if (existing) {
        const updated = await setDefaultDriverVehicle(token, existing.id);
        setSavedVehicles((current) =>
          current.map((vehicle) => ({
            ...vehicle,
            isDefault: vehicle.id === updated.id,
          })),
        );
        showSuccess(`${driverVehicleTitle(updated)} set as default.`);
      } else {
        const created = await createDriverVehicle(token, {
          vehicleModelId: item.id,
        });
        setSavedVehicles((current) => {
          const cleared = current.map((vehicle) => ({
            ...vehicle,
            isDefault: false,
          }));
          return [created, ...cleared];
        });
        showSuccess(
          created.isDefault
            ? `${item.displayName} added as your default vehicle.`
            : `${item.displayName} added to your vehicles.`,
        );
      }
    } catch (err) {
      const message =
        err instanceof AuthApiError
          ? err.message
          : 'Unable to save vehicle. Please try again.';
      showError(message);
    } finally {
      setBusyKey(null);
    }
  };

  const handleSelectSaved = async (vehicle: DriverVehicle) => {
    if (!token || isBusy || vehicle.isDefault) {
      return;
    }

    setBusyKey(`saved:${vehicle.id}`);
    clearStatus();

    try {
      const updated = await setDefaultDriverVehicle(token, vehicle.id);
      setSavedVehicles((current) =>
        current.map((item) => ({
          ...item,
          isDefault: item.id === updated.id,
        })),
      );
      showSuccess(`${driverVehicleTitle(updated)} set as default.`);
    } catch (err) {
      const message =
        err instanceof AuthApiError
          ? err.message
          : 'Unable to set default vehicle. Please try again.';
      showError(message);
    } finally {
      setBusyKey(null);
    }
  };

  const handleAddCustom = () => {
    if (isBusy) {
      return;
    }

    router.push({
      pathname: '/auth/custom-vehicle',
      params: fromProfile ? { from: 'profile' } : undefined,
    } as Href);
  };

  const canContinue = Boolean(defaultVehicle);

  return (
    <AuthScreenShell
      title="Select your vehicle"
      subtitle="Choose a vehicle from the list or add a custom one. Your first vehicle becomes the default."
      showBack
    >
      {isLoading ? (
        <View style={styles.centered}>
          <ActivityIndicator color={theme.colors.brand} />
          <Text style={styles.loadingLabel}>Loading vehicles…</Text>
        </View>
      ) : loadFailed && catalog.length === 0 && savedVehicles.length === 0 ? (
        <View style={styles.centered}>
          <RequestStatusBanner status={status} />
          <AuthPrimaryButton
            label="Try again"
            onPress={() => {
              void loadVehicles();
            }}
          />
        </View>
      ) : (
        <>
          {savedVehicles.length > 0 ? (
            <View style={styles.section}>
              <Text style={styles.sectionTitle}>Your vehicles</Text>
              {savedVehicles.map((vehicle) => (
                <VehicleRow
                  key={vehicle.id}
                  title={driverVehicleTitle(vehicle)}
                  subtitle={driverVehicleConnectorsLabel(vehicle)}
                  selected={vehicle.isDefault}
                  badge={vehicle.isDefault ? 'Default' : undefined}
                  loading={busyKey === `saved:${vehicle.id}`}
                  onPress={() => {
                    void handleSelectSaved(vehicle);
                  }}
                  disabled={isBusy}
                />
              ))}
            </View>
          ) : null}

          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Available vehicles</Text>
            {catalog.length === 0 ? (
              <Text style={styles.emptyCatalog}>
                No catalog vehicles available right now.
              </Text>
            ) : (
              catalog.map((item) => {
                const alreadySaved = savedCatalogIds.has(item.id);
                const isDefaultCatalog =
                  defaultVehicle?.vehicleModelId === item.id ||
                  defaultVehicle?.vehicleModel?.id === item.id;

                return (
                  <VehicleRow
                    key={item.id}
                    title={item.displayName}
                    subtitle={catalogItemConnectors(item)}
                    selected={isDefaultCatalog}
                    badge={
                      alreadySaved && !isDefaultCatalog ? 'Added' : undefined
                    }
                    loading={busyKey === `catalog:${item.id}`}
                    onPress={() => {
                      void handleSelectCatalog(item);
                    }}
                    disabled={isBusy}
                  />
                );
              })
            )}
          </View>

          <Pressable
            onPress={handleAddCustom}
            style={[styles.addCustom, isBusy && styles.addCustomDisabled]}
            disabled={isBusy}
            accessibilityRole="button"
            accessibilityLabel="Add custom vehicle"
          >
            <Text style={styles.addCustomLabel}>+ Add custom vehicle</Text>
          </Pressable>

          <RequestStatusBanner status={status} />

          <AuthPrimaryButton
            label={fromProfile ? 'Done' : 'Continue'}
            onPress={() => {
              void finishFlow();
            }}
            loading={busyKey === 'continue'}
            disabled={!canContinue || isBusy}
          />
        </>
      )}
    </AuthScreenShell>
  );
}

type VehicleRowProps = {
  title: string;
  subtitle: string;
  selected?: boolean;
  badge?: string;
  loading?: boolean;
  disabled?: boolean;
  onPress: () => void;
};

function VehicleRow({
  title,
  subtitle,
  selected = false,
  badge,
  loading = false,
  disabled,
  onPress,
}: VehicleRowProps) {
  return (
    <Pressable
      onPress={onPress}
      disabled={disabled || loading}
      style={[
        styles.row,
        selected && styles.rowSelected,
        (disabled || loading) && styles.rowDisabled,
      ]}
      accessibilityRole="button"
      accessibilityState={{ selected, busy: loading, disabled }}
    >
      <View style={styles.rowText}>
        <Text style={[styles.rowTitle, selected && styles.rowTitleSelected]}>
          {title}
        </Text>
        {subtitle ? <Text style={styles.rowSubtitle}>{subtitle}</Text> : null}
      </View>
      {loading ? (
        <ActivityIndicator size="small" color={theme.colors.brand} />
      ) : badge ? (
        <View style={[styles.badge, selected && styles.badgeSelected]}>
          <Text
            style={[styles.badgeText, selected && styles.badgeTextSelected]}
          >
            {badge}
          </Text>
        </View>
      ) : null}
    </Pressable>
  );
}

const styles = StyleSheet.create({
  centered: {
    paddingVertical: theme.spacing.xxl,
    alignItems: 'center',
    gap: theme.spacing.lg,
  },
  loadingLabel: {
    fontSize: theme.typography.fontSize.sm,
    color: theme.colors.textMuted,
  },
  section: {
    gap: theme.spacing.sm,
  },
  sectionTitle: {
    fontSize: theme.typography.fontSize.sm,
    fontWeight: theme.typography.fontWeight.semibold,
    color: theme.colors.textMuted,
    textTransform: 'uppercase',
    letterSpacing: 0.4,
  },
  emptyCatalog: {
    fontSize: theme.typography.fontSize.sm,
    color: theme.colors.textMuted,
  },
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: theme.spacing.md,
    paddingHorizontal: theme.spacing.md,
    paddingVertical: theme.spacing.md,
    borderRadius: theme.radius.md,
    borderWidth: 1,
    borderColor: theme.colors.border,
    backgroundColor: theme.colors.surface,
  },
  rowSelected: {
    borderColor: theme.colors.selectionBorder,
    backgroundColor: theme.colors.selectionBackground,
  },
  rowDisabled: {
    opacity: 0.7,
  },
  rowText: {
    flex: 1,
    gap: 2,
  },
  rowTitle: {
    fontSize: theme.typography.fontSize.md,
    fontWeight: theme.typography.fontWeight.semibold,
    color: theme.colors.textPrimary,
  },
  rowTitleSelected: {
    color: theme.colors.selectionForeground,
  },
  rowSubtitle: {
    fontSize: theme.typography.fontSize.sm,
    color: theme.colors.textMuted,
  },
  badge: {
    paddingHorizontal: theme.spacing.sm,
    paddingVertical: 4,
    borderRadius: theme.radius.sm,
    backgroundColor: theme.colors.iconBackground,
  },
  badgeSelected: {
    backgroundColor: theme.colors.brand,
  },
  badgeText: {
    fontSize: theme.typography.fontSize.xs,
    fontWeight: theme.typography.fontWeight.semibold,
    color: theme.colors.textSecondary,
  },
  badgeTextSelected: {
    color: theme.colors.textInverse,
  },
  addCustom: {
    alignItems: 'center',
    paddingVertical: theme.spacing.sm,
  },
  addCustomDisabled: {
    opacity: 0.5,
  },
  addCustomLabel: {
    fontSize: theme.typography.fontSize.md,
    fontWeight: theme.typography.fontWeight.semibold,
    color: theme.colors.brand,
  },
});
