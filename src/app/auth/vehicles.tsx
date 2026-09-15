import { router, useFocusEffect, useLocalSearchParams, type Href } from 'expo-router';
import { useCallback, useMemo, useState } from 'react';
import {
  ActivityIndicator,
  FlatList,
  KeyboardAvoidingView,
  Modal,
  Platform,
  Pressable,
  StyleSheet,
  Text,
  TextInput,
  View,
} from 'react-native';

import { AuthApiError } from '@/api/auth';
import {
  createDriverVehicle,
  deleteDriverVehicle,
  listDriverVehicles,
  setDefaultDriverVehicle,
  updateDriverVehicle,
} from '@/api/driverVehicles';
import {
  fetchPublicVehicleModels,
  PublicVehicleModelsApiError,
} from '@/api/publicVehicleModels';
import { useAuth } from '@/auth/auth-context';
import {
  driverVehicleConnectorsLabel,
  driverVehicleTitle,
  resumeBookingHref,
} from '@/auth/profile-flow';
import { AuthPrimaryButton } from '@/components/auth/auth-primary-button';
import { AuthScreenShell } from '@/components/auth/auth-screen-shell';
import { Icon } from '@/components/ui/icon';
import {
  RequestStatusBanner,
  useRequestStatus,
} from '@/components/ui/request-status';
import { theme } from '@/theme';
import type { DriverVehicle, VehicleCatalogItem } from '@/types/vehicle';

type BusyKey = string | null;

/** Rows rendered per page. Swap for API paging when the endpoint supports it. */
const PAGE_SIZE = 12;

type CatalogRow = { kind: 'catalog'; item: VehicleCatalogItem };
type SavedRow = { kind: 'saved'; vehicle: DriverVehicle };
type HeaderRow = { kind: 'header'; title: string; count?: number };
type ListRow = CatalogRow | SavedRow | HeaderRow;

/** Plate capture target: a catalog model being added, or a saved vehicle being edited. */
type PlatePrompt =
  | { mode: 'create'; item: VehicleCatalogItem }
  | { mode: 'edit'; vehicle: DriverVehicle };

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
  const [searchQuery, setSearchQuery] = useState('');
  const [visibleCount, setVisibleCount] = useState(PAGE_SIZE);
  const [platePrompt, setPlatePrompt] = useState<PlatePrompt | null>(null);
  const [plateValue, setPlateValue] = useState('');
  const [pendingRemoval, setPendingRemoval] = useState<DriverVehicle | null>(
    null,
  );

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

  const filteredCatalog = useMemo(() => {
    const query = searchQuery.trim().toLowerCase();
    // Models already in "Your vehicles" are hidden here to avoid duplicate rows.
    const available = catalog.filter((item) => !savedCatalogIds.has(item.id));

    if (!query) {
      return available;
    }

    return available.filter((item) =>
      [item.displayName, item.make, item.model]
        .filter(Boolean)
        .some((field) => field.toLowerCase().includes(query)),
    );
  }, [catalog, savedCatalogIds, searchQuery]);

  const pagedCatalog = useMemo(
    () => filteredCatalog.slice(0, visibleCount),
    [filteredCatalog, visibleCount],
  );

  const hasMore = pagedCatalog.length < filteredCatalog.length;

  const rows = useMemo<ListRow[]>(() => {
    const next: ListRow[] = [];

    if (savedVehicles.length > 0) {
      next.push({ kind: 'header', title: 'Your vehicles' });
      for (const vehicle of savedVehicles) {
        next.push({ kind: 'saved', vehicle });
      }
    }

    next.push({
      kind: 'header',
      title: 'Available models',
      count: filteredCatalog.length,
    });
    for (const item of pagedCatalog) {
      next.push({ kind: 'catalog', item });
    }

    return next;
  }, [savedVehicles, pagedCatalog, filteredCatalog.length]);

  const handleSearchChange = (value: string) => {
    setSearchQuery(value);
    setVisibleCount(PAGE_SIZE);
  };

  const handleLoadMore = () => {
    if (!hasMore) {
      return;
    }
    setVisibleCount((current) => current + PAGE_SIZE);
  };

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

  const openPlatePrompt = (prompt: PlatePrompt) => {
    if (isBusy) {
      return;
    }

    clearStatus();
    setPlateValue(
      prompt.mode === 'edit' ? (prompt.vehicle.licensePlate ?? '') : '',
    );
    setPlatePrompt(prompt);
  };

  const closePlatePrompt = () => {
    setPlatePrompt(null);
    setPlateValue('');
  };

  const handleSelectCatalog = (item: VehicleCatalogItem) => {
    if (!token || isBusy) {
      return;
    }

    openPlatePrompt({ mode: 'create', item });
  };

  const handleSavePlate = async () => {
    if (!token || !platePrompt || isBusy) {
      return;
    }

    const plate = plateValue.trim().toUpperCase();
    const prompt = platePrompt;

    setBusyKey('plate');

    try {
      if (prompt.mode === 'create') {
        const created = await createDriverVehicle(token, {
          vehicleModelId: prompt.item.id,
          ...(plate ? { licensePlate: plate } : {}),
        });
        // Refetch so the default flag always mirrors the server for every row.
        const vehicles = await listDriverVehicles(token);
        setSavedVehicles(vehicles);
        closePlatePrompt();
        showSuccess(
          created.isDefault
            ? `${prompt.item.displayName} added as your default vehicle.`
            : `${prompt.item.displayName} added to your vehicles.`,
        );
      } else {
        const updated = await updateDriverVehicle(token, prompt.vehicle.id, {
          licensePlate: plate || null,
        });
        setSavedVehicles((current) =>
          current.map((vehicle) =>
            vehicle.id === updated.id
              ? { ...vehicle, licensePlate: updated.licensePlate ?? null }
              : vehicle,
          ),
        );
        closePlatePrompt();
        showSuccess(plate ? 'Number plate updated.' : 'Number plate removed.');
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

  const handleRemoveSaved = (vehicle: DriverVehicle) => {
    if (!token || isBusy) {
      return;
    }

    if (vehicle.isDefault) {
      showError(
        'Set another vehicle as default before removing this one.',
      );
      return;
    }

    clearStatus();
    setPendingRemoval(vehicle);
  };

  const confirmRemoveSaved = async () => {
    if (!token || !pendingRemoval || isBusy) {
      return;
    }

    const vehicle = pendingRemoval;
    const title = driverVehicleTitle(vehicle);

    setBusyKey(`remove:${vehicle.id}`);

    try {
      await deleteDriverVehicle(token, vehicle.id);
      const vehicles = await listDriverVehicles(token);
      setSavedVehicles(vehicles);
      setPendingRemoval(null);
      showSuccess(`${title} removed.`);
    } catch (err) {
      const message =
        err instanceof AuthApiError
          ? err.message
          : 'Unable to remove vehicle. Please try again.';
      setPendingRemoval(null);
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

  const renderRow = ({ item: row }: { item: ListRow }) => {
    if (row.kind === 'header') {
      return (
        <View style={styles.sectionHeader}>
          <Text style={styles.sectionTitle}>{row.title}</Text>
          {typeof row.count === 'number' ? (
            <View style={styles.countPill}>
              <Text style={styles.countPillText}>{row.count}</Text>
            </View>
          ) : null}
        </View>
      );
    }

    if (row.kind === 'saved') {
      const { vehicle } = row;
      const connectors = driverVehicleConnectorsLabel(vehicle);

      return (
        <VehicleCard
          title={driverVehicleTitle(vehicle)}
          specs={connectors ? connectors.split(' · ') : []}
          licensePlate={vehicle.licensePlate}
          selected={vehicle.isDefault}
          badge={vehicle.isDefault ? 'Default' : undefined}
          saved
          showDefaultAction={!vehicle.isDefault}
          loading={
            busyKey === `saved:${vehicle.id}` ||
            busyKey === `remove:${vehicle.id}`
          }
          disabled={isBusy}
          onPress={() => {
            void handleSelectSaved(vehicle);
          }}
          onEditPlate={() => {
            openPlatePrompt({ mode: 'edit', vehicle });
          }}
          onRemove={
            vehicle.isDefault
              ? undefined
              : () => {
                  handleRemoveSaved(vehicle);
                }
          }
        />
      );
    }

    const { item } = row;
    const specs = [item.acConnectorType, item.dcConnectorType].filter(
      (spec): spec is NonNullable<typeof spec> => Boolean(spec),
    );

    return (
      <VehicleCard
        title={item.displayName}
        subtitle={
          item.make && item.model && item.displayName !== `${item.make} ${item.model}`
            ? `${item.make} ${item.model}`
            : undefined
        }
        specs={specs}
        fastCharging={item.isFastChargingSupported}
        loading={busyKey === `catalog:${item.id}`}
        disabled={isBusy}
        onPress={() => {
          handleSelectCatalog(item);
        }}
      />
    );
  };

  return (
    <AuthScreenShell
      title={fromProfile ? 'Select your vehicle' : 'Add Vehicle'}
      subtitle={
        fromProfile
          ? 'Choose a vehicle from the list or add a custom one.'
          : 'Choose your car to enable optimized charging.'
      }
      showBack
      disableScroll
      headerStep={fromProfile ? undefined : 'Step 2 of 2'}
      headerSection={fromProfile ? undefined : 'Vehicle Profile'}
      stickyFooter={
        <View style={styles.footerBar}>
          {defaultVehicle ? (
            <View style={styles.footerDefaultRow}>
              <Icon name="checkmark" size={14} color={theme.colors.brand} />
              <Text style={styles.footerDefaultText} numberOfLines={1}>
                Default: {driverVehicleTitle(defaultVehicle)}
              </Text>
            </View>
          ) : (
            <Text style={styles.footerHint}>
              Select a vehicle to set as your default to continue.
            </Text>
          )}
          <AuthPrimaryButton
            label={fromProfile ? 'Done' : 'Save & Continue'}
            onPress={() => {
              void finishFlow();
            }}
            loading={busyKey === 'continue'}
            disabled={!canContinue || isBusy}
          />
          <Pressable
            onPress={handleAddCustom}
            disabled={isBusy}
            hitSlop={8}
            accessibilityRole="button"
            accessibilityLabel="Enter custom vehicle specs"
            style={styles.customLinkRow}
          >
            <Text style={styles.customLinkMuted}>Can't find your model? </Text>
            <Text style={styles.customLink}>Enter custom specs</Text>
          </Pressable>
        </View>
      }
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
          <View style={styles.searchRow}>
            <Icon name="search" size={18} color={theme.colors.textMuted} />
            <TextInput
              style={styles.searchInput}
              value={searchQuery}
              onChangeText={handleSearchChange}
              placeholder="Search make, model, or trims..."
              placeholderTextColor={theme.colors.textMuted}
              autoCapitalize="none"
              autoCorrect={false}
              returnKeyType="search"
            />
            {searchQuery ? (
              <Pressable
                onPress={() => handleSearchChange('')}
                hitSlop={8}
                accessibilityRole="button"
                accessibilityLabel="Clear search"
              >
                <Icon name="close" size={16} color={theme.colors.textMuted} />
              </Pressable>
            ) : null}
          </View>

          {status ? (
            <View style={styles.statusWrap}>
              <RequestStatusBanner status={status} />
            </View>
          ) : null}

          <FlatList
            data={rows}
            keyExtractor={(row, index) =>
              row.kind === 'header'
                ? `header-${row.title}`
                : row.kind === 'saved'
                  ? `saved-${row.vehicle.id}`
                  : `catalog-${row.item.id}-${index}`
            }
            renderItem={renderRow}
            style={styles.list}
            contentContainerStyle={styles.listContent}
            showsVerticalScrollIndicator={false}
            keyboardShouldPersistTaps="handled"
            onEndReachedThreshold={0.4}
            onEndReached={handleLoadMore}
            ListEmptyComponent={
              <Text style={styles.emptyText}>
                No vehicles match your search.
              </Text>
            }
            ListFooterComponent={
              hasMore ? (
                <Pressable
                  onPress={handleLoadMore}
                  style={styles.loadMore}
                  accessibilityRole="button"
                  accessibilityLabel="Load more vehicles"
                >
                  <Text style={styles.loadMoreLabel}>Load more</Text>
                </Pressable>
              ) : null
            }
          />
        </>
      )}

      <Modal
        visible={platePrompt !== null}
        transparent
        animationType="fade"
        onRequestClose={closePlatePrompt}
      >
        <View style={styles.modalOverlay}>
          <KeyboardAvoidingView
            behavior={Platform.OS === 'ios' ? 'padding' : undefined}
            style={styles.modalCenter}
          >
            <View style={styles.modalCard}>
              <Text style={styles.modalTitle}>
                {platePrompt?.mode === 'edit'
                  ? 'Number plate'
                  : 'Add number plate'}
              </Text>
              <Text style={styles.modalSubtitle}>
                {platePrompt?.mode === 'edit'
                  ? driverVehicleTitle(platePrompt.vehicle)
                  : (platePrompt?.item.displayName ?? '')}
              </Text>

              <TextInput
                style={styles.modalInput}
                value={plateValue}
                onChangeText={(value) => setPlateValue(value.toUpperCase())}
                placeholder="e.g. ABC-123"
                placeholderTextColor={theme.colors.textMuted}
                autoCapitalize="characters"
                autoCorrect={false}
                maxLength={20}
                autoFocus
                editable={busyKey !== 'plate'}
              />
              <Text style={styles.modalHint}>
                Optional. Used to identify your car at the charger.
              </Text>

              <View style={styles.modalActions}>
                <Pressable
                  onPress={closePlatePrompt}
                  disabled={busyKey === 'plate'}
                  accessibilityRole="button"
                  accessibilityLabel="Cancel"
                  style={styles.modalCancel}
                >
                  <Text style={styles.modalCancelLabel}>Cancel</Text>
                </Pressable>
                <Pressable
                  onPress={() => {
                    void handleSavePlate();
                  }}
                  disabled={busyKey === 'plate'}
                  accessibilityRole="button"
                  accessibilityLabel="Save vehicle"
                  style={styles.modalConfirm}
                >
                  {busyKey === 'plate' ? (
                    <ActivityIndicator
                      size="small"
                      color={theme.colors.textInverse}
                    />
                  ) : (
                    <Text style={styles.modalConfirmLabel}>
                      {platePrompt?.mode === 'edit' ? 'Save' : 'Add vehicle'}
                    </Text>
                  )}
                </Pressable>
              </View>
            </View>
          </KeyboardAvoidingView>
        </View>
      </Modal>

      <Modal
        visible={pendingRemoval !== null}
        transparent
        animationType="fade"
        onRequestClose={() => setPendingRemoval(null)}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.modalCenter}>
            <View style={styles.modalCard}>
              <Text style={styles.modalTitle}>Remove vehicle</Text>
              <Text style={styles.modalSubtitle}>
                {pendingRemoval
                  ? `Remove ${driverVehicleTitle(pendingRemoval)} from your vehicles?`
                  : ''}
              </Text>

              <View style={styles.modalActions}>
                <Pressable
                  onPress={() => setPendingRemoval(null)}
                  disabled={isBusy}
                  accessibilityRole="button"
                  accessibilityLabel="Cancel"
                  style={styles.modalCancel}
                >
                  <Text style={styles.modalCancelLabel}>Cancel</Text>
                </Pressable>
                <Pressable
                  onPress={() => {
                    void confirmRemoveSaved();
                  }}
                  disabled={isBusy}
                  accessibilityRole="button"
                  accessibilityLabel="Remove vehicle"
                  style={[styles.modalConfirm, styles.modalConfirmDanger]}
                >
                  {isBusy ? (
                    <ActivityIndicator
                      size="small"
                      color={theme.colors.textInverse}
                    />
                  ) : (
                    <Text style={styles.modalConfirmLabel}>Remove</Text>
                  )}
                </Pressable>
              </View>
            </View>
          </View>
        </View>
      </Modal>
    </AuthScreenShell>
  );
}

type VehicleCardProps = {
  title: string;
  subtitle?: string;
  specs?: string[];
  fastCharging?: boolean;
  licensePlate?: string | null;
  selected?: boolean;
  badge?: string;
  /** Shows the "Make Default" pill for saved vehicles that are not default yet. */
  showDefaultAction?: boolean;
  /** Renders the saved-vehicle footer (plate chip + default action). */
  saved?: boolean;
  loading?: boolean;
  disabled?: boolean;
  onPress: () => void;
  onEditPlate?: () => void;
  onRemove?: () => void;
};

function VehicleCard({
  title,
  subtitle,
  specs = [],
  fastCharging = false,
  licensePlate,
  selected = false,
  badge,
  showDefaultAction = false,
  saved = false,
  loading = false,
  disabled,
  onPress,
  onEditPlate,
  onRemove,
}: VehicleCardProps) {
  const isSaved = saved;
  // Saved rows expose their own buttons, so the card itself must not be
  // pressable — nested pressables swallow the inner taps.
  const Container = isSaved ? View : Pressable;
  const containerProps = isSaved
    ? {}
    : {
        onPress,
        disabled: disabled || loading,
        accessibilityRole: 'button' as const,
        accessibilityState: { selected, busy: loading, disabled },
      };

  return (
    <Container
      {...containerProps}
      style={[
        styles.card,
        selected && styles.cardSelected,
        (disabled || loading) && styles.cardDisabled,
      ]}
    >
      <View style={[styles.cardIcon, selected && styles.cardIconSelected]}>
        <Icon
          name="car"
          size={20}
          color={selected ? theme.colors.brand : theme.colors.textMuted}
        />
      </View>

      <View style={styles.cardBody}>
        <View style={styles.cardTitleRow}>
          <Text style={styles.cardTitle} numberOfLines={1}>
            {title}
          </Text>
          {badge ? (
            <View style={styles.badge}>
              <Text style={styles.badgeText}>{badge}</Text>
            </View>
          ) : null}
        </View>

        {subtitle ? (
          <Text style={styles.cardSubtitle} numberOfLines={1}>
            {subtitle}
          </Text>
        ) : null}

        {specs.length > 0 || fastCharging ? (
          <View style={styles.specRow}>
            {specs.map((spec) => (
              <View key={spec} style={styles.specChip}>
                <Text style={styles.specText}>{spec}</Text>
              </View>
            ))}
            {fastCharging ? (
              <View style={[styles.specChip, styles.specChipAccent]}>
                <Icon name="bolt" size={11} color={theme.colors.brandDark} />
                <Text style={[styles.specText, styles.specTextAccent]}>
                  Fast charging
                </Text>
              </View>
            ) : null}
          </View>
        ) : null}

        {isSaved ? (
          <View style={styles.savedFooter}>
            <Pressable
              onPress={onEditPlate}
              disabled={disabled || loading}
              hitSlop={6}
              accessibilityRole="button"
              accessibilityLabel={
                licensePlate ? `Edit plate for ${title}` : `Add plate for ${title}`
              }
              style={styles.plateChip}
            >
              <Text style={styles.plateLabel}>Plate</Text>
              <Text style={styles.plateValue}>
                {licensePlate || 'Add number'}
              </Text>
            </Pressable>

            {showDefaultAction ? (
              <Pressable
                onPress={onPress}
                disabled={disabled || loading}
                hitSlop={6}
                accessibilityRole="button"
                accessibilityLabel={`Make ${title} default`}
                style={styles.makeDefaultPill}
              >
                <Icon name="star" size={11} color={theme.colors.textSecondary} />
                <Text style={styles.makeDefaultLabel}>Make Default</Text>
              </Pressable>
            ) : (
              <View style={styles.activeRow}>
                <Icon name="checkmark" size={14} color={theme.colors.brand} />
                <Text style={styles.activeLabel}>Active</Text>
              </View>
            )}
          </View>
        ) : null}
      </View>

      <View style={styles.cardTrailing}>
        {loading ? (
          <ActivityIndicator size="small" color={theme.colors.brand} />
        ) : onRemove ? (
          <Pressable
            onPress={onRemove}
            disabled={disabled}
            hitSlop={8}
            accessibilityRole="button"
            accessibilityLabel={`Remove ${title}`}
            style={styles.removeButton}
          >
            <Icon name="trash" size={16} color={theme.colors.textMuted} />
          </Pressable>
        ) : isSaved ? null : (
          <Icon name="add" size={18} color={theme.colors.brand} />
        )}
      </View>
    </Container>
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
  searchRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: theme.spacing.sm + 2,
    paddingHorizontal: theme.spacing.md + 2,
    paddingVertical: 11,
    borderRadius: theme.radius.md,
    borderWidth: 1,
    borderColor: theme.colors.border,
    backgroundColor: theme.colors.surface,
  },
  searchInput: {
    flex: 1,
    fontSize: theme.typography.fontSize.md,
    color: theme.colors.textPrimary,
    padding: 0,
  },
  statusWrap: {
    marginTop: theme.spacing.md,
  },
  list: {
    flex: 1,
  },
  listContent: {
    paddingTop: theme.spacing.lg,
    paddingBottom: theme.spacing.lg,
    gap: theme.spacing.sm,
  },
  sectionHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginTop: theme.spacing.xs,
    marginBottom: theme.spacing.xxs,
  },
  sectionTitle: {
    fontSize: theme.typography.fontSize.sm,
    fontWeight: theme.typography.fontWeight.semibold,
    color: theme.colors.textMuted,
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
  countPill: {
    paddingHorizontal: theme.spacing.sm,
    paddingVertical: 3,
    borderRadius: theme.radius.sm,
    backgroundColor: theme.colors.brandMuted,
  },
  countPillText: {
    fontSize: theme.typography.fontSize.xs,
    fontWeight: theme.typography.fontWeight.semibold,
    color: theme.colors.brandDark,
  },
  card: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: theme.spacing.md,
    padding: theme.spacing.md,
    borderRadius: theme.radius.lg,
    borderWidth: 1.5,
    borderColor: theme.colors.border,
    backgroundColor: theme.colors.surface,
  },
  cardSelected: {
    borderColor: theme.colors.brand,
    backgroundColor: theme.colors.selectionBackground,
  },
  cardDisabled: {
    opacity: 0.7,
  },
  cardIcon: {
    width: 40,
    height: 40,
    borderRadius: theme.radius.md,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: theme.colors.iconBackground,
  },
  cardIconSelected: {
    backgroundColor: theme.colors.brandMuted,
  },
  cardBody: {
    flex: 1,
    gap: 3,
  },
  cardTitleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: theme.spacing.sm,
  },
  cardTitle: {
    flexShrink: 1,
    fontSize: theme.typography.fontSize.md,
    fontWeight: theme.typography.fontWeight.semibold,
    color: theme.colors.textPrimary,
  },
  cardSubtitle: {
    fontSize: theme.typography.fontSize.sm,
    color: theme.colors.textMuted,
  },
  specRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    alignItems: 'center',
    gap: 6,
    marginTop: 2,
  },
  specChip: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    paddingHorizontal: theme.spacing.sm,
    paddingVertical: 3,
    borderRadius: theme.radius.sm,
    backgroundColor: theme.colors.connectorBg,
  },
  specChipAccent: {
    backgroundColor: theme.colors.brandMuted,
  },
  specText: {
    fontSize: theme.typography.fontSize.xs,
    fontWeight: theme.typography.fontWeight.medium,
    color: theme.colors.textSecondary,
  },
  specTextAccent: {
    color: theme.colors.brandDark,
  },
  savedFooter: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: theme.spacing.sm,
    marginTop: 8,
  },
  plateChip: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    paddingHorizontal: theme.spacing.sm,
    paddingVertical: 4,
    borderRadius: theme.radius.sm,
    backgroundColor: theme.colors.connectorBg,
  },
  plateLabel: {
    fontSize: theme.typography.fontSize.xs,
    color: theme.colors.textMuted,
  },
  plateValue: {
    fontSize: theme.typography.fontSize.xs,
    fontWeight: theme.typography.fontWeight.semibold,
    color: theme.colors.textSecondary,
    letterSpacing: 0.4,
  },
  makeDefaultPill: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: theme.radius.pill,
    borderWidth: 1,
    borderColor: theme.colors.border,
    backgroundColor: theme.colors.surface,
  },
  makeDefaultLabel: {
    fontSize: 12,
    fontWeight: theme.typography.fontWeight.semibold,
    color: theme.colors.textSecondary,
  },
  activeRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  activeLabel: {
    fontSize: 13,
    fontWeight: theme.typography.fontWeight.semibold,
    color: theme.colors.brand,
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: theme.colors.overlay,
  },
  modalCenter: {
    flex: 1,
    justifyContent: 'center',
    paddingHorizontal: theme.spacing.lg,
  },
  modalCard: {
    borderRadius: theme.radius.lg,
    backgroundColor: theme.colors.surface,
    padding: theme.spacing.lg,
    gap: theme.spacing.xs,
  },
  modalTitle: {
    fontSize: theme.typography.fontSize.lg,
    fontWeight: theme.typography.fontWeight.bold,
    color: theme.colors.textPrimary,
  },
  modalSubtitle: {
    fontSize: theme.typography.fontSize.sm,
    color: theme.colors.textMuted,
    marginBottom: theme.spacing.sm,
  },
  modalInput: {
    height: 52,
    borderRadius: theme.radius.md,
    borderWidth: 1,
    borderColor: theme.colors.border,
    paddingHorizontal: theme.spacing.md,
    fontSize: theme.typography.fontSize.md,
    fontWeight: theme.typography.fontWeight.semibold,
    letterSpacing: 1,
    color: theme.colors.textPrimary,
  },
  modalHint: {
    fontSize: theme.typography.fontSize.xs,
    color: theme.colors.textMuted,
  },
  modalActions: {
    flexDirection: 'row',
    justifyContent: 'flex-end',
    alignItems: 'center',
    gap: theme.spacing.sm,
    marginTop: theme.spacing.md,
  },
  modalCancel: {
    paddingHorizontal: theme.spacing.md,
    paddingVertical: 10,
  },
  modalCancelLabel: {
    fontSize: theme.typography.fontSize.md,
    fontWeight: theme.typography.fontWeight.medium,
    color: theme.colors.textSecondary,
  },
  modalConfirm: {
    minWidth: 120,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: theme.spacing.lg,
    paddingVertical: 12,
    borderRadius: theme.radius.md,
    backgroundColor: theme.colors.brand,
  },
  modalConfirmDanger: {
    backgroundColor: theme.colors.notification,
  },
  modalConfirmLabel: {
    fontSize: theme.typography.fontSize.md,
    fontWeight: theme.typography.fontWeight.bold,
    color: theme.colors.textInverse,
  },
  cardTrailing: {
    alignItems: 'center',
    gap: theme.spacing.sm,
  },
  removeButton: {
    width: 28,
    height: 28,
    borderRadius: 14,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: theme.colors.iconBackground,
  },
  badge: {
    paddingHorizontal: theme.spacing.sm,
    paddingVertical: 2,
    borderRadius: theme.radius.sm,
    backgroundColor: theme.colors.brandMuted,
  },
  badgeText: {
    fontSize: theme.typography.fontSize.xs,
    fontWeight: theme.typography.fontWeight.semibold,
    color: theme.colors.brandDark,
  },
  emptyText: {
    fontSize: theme.typography.fontSize.sm,
    color: theme.colors.textMuted,
    textAlign: 'center',
    paddingVertical: theme.spacing.xl,
  },
  loadMore: {
    alignItems: 'center',
    paddingVertical: theme.spacing.md,
  },
  loadMoreLabel: {
    fontSize: theme.typography.fontSize.sm,
    fontWeight: theme.typography.fontWeight.semibold,
    color: theme.colors.brand,
  },
  footerBar: {
    gap: theme.spacing.sm,
  },
  footerHint: {
    fontSize: theme.typography.fontSize.sm,
    color: theme.colors.textMuted,
    textAlign: 'center',
  },
  footerDefaultRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
  },
  footerDefaultText: {
    fontSize: theme.typography.fontSize.sm,
    fontWeight: theme.typography.fontWeight.semibold,
    color: theme.colors.brandDark,
  },
  customLinkRow: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    paddingVertical: theme.spacing.xs,
  },
  customLinkMuted: {
    fontSize: theme.typography.fontSize.sm,
    color: theme.colors.textMuted,
  },
  customLink: {
    fontSize: theme.typography.fontSize.sm,
    fontWeight: theme.typography.fontWeight.semibold,
    color: theme.colors.brand,
    textDecorationLine: 'underline',
  },
});
