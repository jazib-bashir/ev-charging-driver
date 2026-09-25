import { router, useFocusEffect, useLocalSearchParams, type Href } from 'expo-router';
import { useCallback, useEffect, useMemo, useState } from 'react';
import {
  ActivityIndicator,
  FlatList,
  Keyboard,
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
import { Icon } from '@/components/ui/icon';
import {
  RequestStatusBanner,
  useRequestStatus,
} from '@/components/ui/request-status';
import { ScreenContainer } from '@/components/ui/screen-container';
import { theme } from '@/theme';
import type { DriverVehicle, VehicleCatalogItem } from '@/types/vehicle';

type BusyKey = string | null;

/** Rows rendered per page. Swap for API paging when the endpoint supports it. */
const PAGE_SIZE = 12;

/** Plate capture target: a catalog model being added, or a saved vehicle being edited. */
type PlatePrompt =
  | { mode: 'create'; item: VehicleCatalogItem }
  | { mode: 'edit'; vehicle: DriverVehicle };

function connectorsLine(parts: Array<string | null | undefined>): string {
  return parts.filter(Boolean).join(' • ');
}

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
  const [keyboardHeight, setKeyboardHeight] = useState(0);
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

  useEffect(() => {
    if (platePrompt === null) {
      setKeyboardHeight(0);
      return;
    }

    const showEvent =
      Platform.OS === 'ios' ? 'keyboardWillShow' : 'keyboardDidShow';
    const hideEvent =
      Platform.OS === 'ios' ? 'keyboardWillHide' : 'keyboardDidHide';

    const showSub = Keyboard.addListener(showEvent, (event) => {
      setKeyboardHeight(event.endCoordinates.height);
    });
    const hideSub = Keyboard.addListener(hideEvent, () => {
      setKeyboardHeight(0);
    });

    return () => {
      showSub.remove();
      hideSub.remove();
    };
  }, [platePrompt]);

  const filteredCatalog = useMemo(() => {
    const query = searchQuery.trim().toLowerCase();
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
      showError('Set another vehicle as default before removing this one.');
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

  const handleBack = () => {
    if (router.canGoBack()) {
      router.back();
      return;
    }
    router.replace(fromProfile ? '/(tabs)/profile' : ('/' as Href));
  };

  const canContinue = Boolean(defaultVehicle);

  const catalogHeader = (
    <View>
      {savedVehicles.length > 0 ? (
        <View style={styles.garageSection}>
          <Text style={styles.sectionLabel}>YOUR GARAGE</Text>
          <FlatList
            horizontal
            data={savedVehicles}
            keyExtractor={(vehicle) => vehicle.id}
            showsHorizontalScrollIndicator={false}
            contentContainerStyle={styles.garageListContent}
            renderItem={({ item: vehicle }) => {
              const plugs = connectorsLine(
                driverVehicleConnectorsLabel(vehicle).split(' · '),
              );
              const loading =
                busyKey === `saved:${vehicle.id}` ||
                busyKey === `remove:${vehicle.id}`;

              return (
                <View
                  style={[
                    styles.garageCard,
                    vehicle.isDefault && styles.garageCardSelected,
                  ]}
                >
                  <View style={styles.garageCardTop}>
                    <View
                      style={[
                        styles.garageIcon,
                        vehicle.isDefault && styles.garageIconSelected,
                      ]}
                    >
                      <Icon
                        name="car"
                        size={20}
                        color={
                          vehicle.isDefault
                            ? theme.colors.accent
                            : theme.colors.textMuted
                        }
                      />
                    </View>
                    <View style={styles.garageCopy}>
                      <Text style={styles.garageTitle} numberOfLines={2}>
                        {driverVehicleTitle(vehicle)}
                      </Text>
                      {plugs ? (
                        <Text style={styles.garagePlugs} numberOfLines={1}>
                          {plugs}
                        </Text>
                      ) : null}
                    </View>
                    {!vehicle.isDefault ? (
                      <Pressable
                        onPress={() => handleRemoveSaved(vehicle)}
                        disabled={isBusy || loading}
                        hitSlop={8}
                        accessibilityRole="button"
                        accessibilityLabel={`Remove ${driverVehicleTitle(vehicle)}`}
                        style={styles.garageRemove}
                      >
                        <Icon
                          name="trash"
                          size={14}
                          color={theme.colors.textMuted}
                        />
                      </Pressable>
                    ) : null}
                  </View>

                  <View style={styles.garageActions}>
                    {vehicle.isDefault ? (
                      <View style={styles.defaultTag}>
                        <Icon
                          name="star"
                          size={11}
                          color={theme.colors.accent}
                        />
                        <Text style={styles.defaultTagLabel}>Default</Text>
                      </View>
                    ) : (
                      <Pressable
                        onPress={() => {
                          void handleSelectSaved(vehicle);
                        }}
                        disabled={isBusy || loading}
                        hitSlop={6}
                        accessibilityRole="button"
                        accessibilityLabel={`Make ${driverVehicleTitle(vehicle)} default`}
                      >
                        <Text style={styles.garageActionLink}>
                          Make default
                        </Text>
                      </Pressable>
                    )}
                    <Pressable
                      onPress={() =>
                        openPlatePrompt({ mode: 'edit', vehicle })
                      }
                      disabled={isBusy || loading}
                      hitSlop={6}
                      accessibilityRole="button"
                      accessibilityLabel={
                        vehicle.licensePlate
                          ? `Edit plate for ${driverVehicleTitle(vehicle)}`
                          : `Add number plate for ${driverVehicleTitle(vehicle)}`
                      }
                    >
                      <Text style={styles.garageActionLink}>
                        {vehicle.licensePlate
                          ? `Plate ${vehicle.licensePlate}`
                          : '✏️ Add number plate'}
                      </Text>
                    </Pressable>
                  </View>

                  {loading ? (
                    <View style={styles.garageBusy}>
                      <ActivityIndicator
                        size="small"
                        color={theme.colors.accent}
                      />
                    </View>
                  ) : null}
                </View>
              );
            }}
          />
        </View>
      ) : null}

      <View style={styles.directoryHeader}>
        <Text style={[styles.sectionLabel, styles.directoryTitle]}>
          AVAILABLE MODELS
        </Text>
        <View style={styles.countPill}>
          <Text style={styles.countPillText}>{filteredCatalog.length}</Text>
        </View>
      </View>

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
    </View>
  );

  return (
    <View style={styles.root}>
      <ScreenContainer edges={['top', 'bottom']} style={styles.screen}>
        <View style={styles.topBar}>
          <Pressable
            onPress={handleBack}
            hitSlop={8}
            accessibilityRole="button"
            accessibilityLabel="Go back"
            style={styles.backButton}
          >
            <Icon name="back" size={22} color={theme.colors.textPrimary} />
          </Pressable>
        </View>

        <Text style={styles.pageTitle}>Vehicles</Text>

        {isLoading ? (
          <View style={styles.centered}>
            <ActivityIndicator color={theme.colors.accent} />
            <Text style={styles.loadingLabel}>Loading vehicles…</Text>
          </View>
        ) : loadFailed &&
          catalog.length === 0 &&
          savedVehicles.length === 0 ? (
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
          <FlatList
            data={pagedCatalog}
            keyExtractor={(item) => item.id}
            style={styles.list}
            contentContainerStyle={styles.listContent}
            showsVerticalScrollIndicator={false}
            keyboardShouldPersistTaps="handled"
            onEndReachedThreshold={0.4}
            onEndReached={handleLoadMore}
            ListHeaderComponent={catalogHeader}
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
            renderItem={({ item }) => {
              const plugs = connectorsLine([
                item.acConnectorType,
                item.dcConnectorType,
                item.isFastChargingSupported ? 'Fast' : null,
              ]);
              const loading = busyKey === `catalog:${item.id}`;

              return (
                <Pressable
                  onPress={() => handleSelectCatalog(item)}
                  disabled={isBusy || loading}
                  style={[
                    styles.catalogRow,
                    (isBusy || loading) && styles.cardDisabled,
                  ]}
                  accessibilityRole="button"
                  accessibilityLabel={`Add ${item.displayName}`}
                >
                  <Text style={styles.catalogTitle} numberOfLines={1}>
                    {item.displayName}
                  </Text>
                  <View style={styles.catalogTrailing}>
                    {plugs ? (
                      <Text style={styles.catalogPlugs} numberOfLines={1}>
                        {plugs}
                      </Text>
                    ) : null}
                    {loading ? (
                      <ActivityIndicator
                        size="small"
                        color={theme.colors.accent}
                      />
                    ) : (
                      <View style={styles.addIconWrap}>
                        <Icon
                          name="add"
                          size={18}
                          color={theme.colors.accent}
                        />
                      </View>
                    )}
                  </View>
                </Pressable>
              );
            }}
          />
        )}

        <View style={styles.footerBar}>
          {defaultVehicle ? (
            <View style={styles.footerDefaultRow}>
              <Icon name="checkmark" size={14} color={theme.colors.accent} />
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
            style={styles.doneButton}
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
      </ScreenContainer>

      {platePrompt !== null ? (
        <View
          style={[styles.plateOverlay, { paddingBottom: keyboardHeight }]}
        >
          <Pressable style={styles.modalDismiss} onPress={closePlatePrompt} />
          <View style={styles.modalSheetWrap}>
            <View style={styles.modalSheet}>
              {platePrompt.mode === 'edit' ? (
                <Text style={styles.modalTitle}>Number plate</Text>
              ) : (
                <View style={styles.modalTitleRow}>
                  <Text style={styles.modalTitle}>Add Number Plate</Text>
                  <Text style={styles.modalTitleOptional}>(Optional)</Text>
                </View>
              )}
              <Text style={styles.modalSubtitle}>
                {platePrompt.mode === 'edit'
                  ? driverVehicleTitle(platePrompt.vehicle)
                  : platePrompt.item.displayName}
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
                  accessibilityLabel={
                    platePrompt.mode === 'edit'
                      ? 'Save'
                      : plateValue.trim()
                        ? 'Add vehicle'
                        : 'Skip and add'
                  }
                  style={styles.modalConfirm}
                >
                  {busyKey === 'plate' ? (
                    <ActivityIndicator size="small" color="#FFFFFF" />
                  ) : (
                    <Text style={styles.modalConfirmLabel}>
                      {platePrompt.mode === 'edit'
                        ? 'Save'
                        : plateValue.trim()
                          ? 'Add Vehicle'
                          : 'Skip & Add'}
                    </Text>
                  )}
                </Pressable>
              </View>
            </View>
          </View>
        </View>
      ) : null}

      <Modal
        visible={pendingRemoval !== null}
        transparent
        animationType="slide"
        onRequestClose={() => setPendingRemoval(null)}
      >
        <View style={styles.modalOverlay}>
          <Pressable
            style={styles.modalDismiss}
            onPress={() => setPendingRemoval(null)}
          />
          <View style={styles.modalSheetWrap}>
            <View style={styles.modalSheet}>
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
                    <ActivityIndicator size="small" color="#FFFFFF" />
                  ) : (
                    <Text style={styles.modalConfirmLabel}>Remove</Text>
                  )}
                </Pressable>
              </View>
            </View>
          </View>
        </View>
      </Modal>
    </View>
  );
}

const styles = StyleSheet.create({
  root: {
    flex: 1,
  },
  screen: {
    backgroundColor: theme.colors.background,
  },
  topBar: {
    paddingHorizontal: 8,
    paddingTop: 4,
  },
  backButton: {
    width: 40,
    height: 40,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: 'transparent',
  },
  pageTitle: {
    fontFamily: theme.typography.fontFamily.brand,
    fontSize: 24,
    color: theme.colors.textPrimary,
    paddingHorizontal: 16,
    marginTop: 12,
  },
  centered: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    gap: 16,
    paddingHorizontal: 16,
  },
  loadingLabel: {
    fontFamily: theme.typography.fontFamily.regular,
    fontSize: 13,
    color: theme.colors.textMuted,
  },
  list: {
    flex: 1,
  },
  listContent: {
    paddingBottom: 16,
  },
  garageSection: {
    marginTop: 14,
  },
  sectionLabel: {
    fontFamily: theme.typography.fontFamily.brand,
    fontSize: 12,
    color: theme.colors.textSecondary,
    letterSpacing: 0.8,
    marginHorizontal: 16,
  },
  garageListContent: {
    paddingHorizontal: 16,
    paddingVertical: 10,
  },
  garageCard: {
    width: 220,
    backgroundColor: theme.colors.surface,
    borderRadius: 16,
    borderWidth: 1.5,
    borderColor: theme.colors.border,
    padding: 14,
    marginRight: 12,
    ...theme.shadows.card,
    shadowColor: theme.colors.shadow,
  },
  garageCardSelected: {
    borderColor: theme.colors.accent,
    backgroundColor: theme.colors.brandMuted,
  },
  garageCardTop: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: 10,
  },
  garageIcon: {
    width: 36,
    height: 36,
    borderRadius: 10,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: theme.colors.iconBackground,
  },
  garageIconSelected: {
    backgroundColor: 'rgba(0, 217, 160, 0.18)',
  },
  garageCopy: {
    flex: 1,
    minWidth: 0,
  },
  garageTitle: {
    fontFamily: theme.typography.fontFamily.brandSemiBold,
    fontSize: 15,
    color: theme.colors.textPrimary,
  },
  garagePlugs: {
    fontFamily: theme.typography.fontFamily.regular,
    fontSize: 11,
    color: theme.colors.textSecondary,
    marginTop: 4,
  },
  garageRemove: {
    width: 28,
    height: 28,
    borderRadius: 14,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: theme.colors.iconBackground,
  },
  garageActions: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: 8,
    marginTop: 12,
  },
  defaultTag: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  defaultTagLabel: {
    fontFamily: theme.typography.fontFamily.semibold,
    fontSize: 11,
    color: theme.colors.accent,
  },
  garageActionLink: {
    fontFamily: theme.typography.fontFamily.medium,
    fontSize: 11,
    color: theme.colors.textSecondary,
  },
  garageBusy: {
    ...StyleSheet.absoluteFill,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: 'rgba(248, 250, 252, 0.55)',
    borderRadius: 16,
  },
  directoryHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginHorizontal: 16,
    marginTop: 20,
    marginBottom: 8,
  },
  directoryTitle: {
    marginHorizontal: 0,
  },
  countPill: {
    backgroundColor: theme.colors.iconBackground,
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: 10,
  },
  countPillText: {
    fontFamily: theme.typography.fontFamily.semibold,
    fontSize: 11,
    color: theme.colors.textSecondary,
  },
  searchRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    height: 44,
    marginHorizontal: 16,
    marginBottom: 12,
    paddingHorizontal: 12,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: theme.colors.border,
    backgroundColor: theme.colors.surface,
    ...theme.shadows.card,
    shadowColor: theme.colors.shadow,
  },
  searchInput: {
    flex: 1,
    fontFamily: theme.typography.fontFamily.medium,
    fontSize: 14,
    color: theme.colors.textPrimary,
    padding: 0,
  },
  statusWrap: {
    marginHorizontal: 16,
    marginBottom: 8,
  },
  catalogRow: {
    height: 52,
    backgroundColor: theme.colors.surface,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: theme.colors.border,
    marginHorizontal: 16,
    marginBottom: 8,
    paddingHorizontal: 14,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    ...theme.shadows.card,
    shadowColor: theme.colors.shadow,
  },
  cardDisabled: {
    opacity: 0.7,
  },
  catalogTitle: {
    flex: 1,
    fontFamily: theme.typography.fontFamily.brandSemiBold,
    fontSize: 14,
    color: theme.colors.textPrimary,
    paddingRight: 10,
  },
  catalogTrailing: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  catalogPlugs: {
    fontFamily: theme.typography.fontFamily.regular,
    fontSize: 12,
    color: theme.colors.textSecondary,
    marginRight: 12,
    maxWidth: 120,
  },
  addIconWrap: {
    width: 28,
    height: 28,
    borderRadius: 14,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: theme.colors.brandMuted,
  },
  emptyText: {
    fontFamily: theme.typography.fontFamily.regular,
    fontSize: 13,
    color: theme.colors.textMuted,
    textAlign: 'center',
    paddingVertical: 24,
  },
  loadMore: {
    alignItems: 'center',
    paddingVertical: 12,
  },
  loadMoreLabel: {
    fontFamily: theme.typography.fontFamily.semibold,
    fontSize: 13,
    color: theme.colors.accent,
  },
  footerBar: {
    backgroundColor: theme.colors.surface,
    borderTopWidth: 1,
    borderTopColor: theme.colors.borderLight,
    paddingHorizontal: 16,
    paddingVertical: 12,
    gap: 10,
  },
  footerHint: {
    fontFamily: theme.typography.fontFamily.regular,
    fontSize: 13,
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
    fontFamily: theme.typography.fontFamily.semibold,
    fontSize: 13,
    color: theme.colors.statusAvailable,
  },
  doneButton: {
    backgroundColor: theme.colors.accent,
    height: 48,
    borderRadius: 12,
    justifyContent: 'center',
    alignItems: 'center',
  },
  customLinkRow: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    paddingVertical: 4,
  },
  customLinkMuted: {
    fontFamily: theme.typography.fontFamily.regular,
    fontSize: 13,
    color: theme.colors.textMuted,
  },
  customLink: {
    fontFamily: theme.typography.fontFamily.semibold,
    fontSize: 13,
    color: theme.colors.accent,
    textDecorationLine: 'underline',
  },
  plateOverlay: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: theme.colors.overlay,
    justifyContent: 'flex-end',
    zIndex: 9999,
    elevation: 9999,
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: theme.colors.overlay,
    justifyContent: 'flex-end',
  },
  modalDismiss: {
    ...StyleSheet.absoluteFill,
  },
  modalSheetWrap: {
    width: '100%',
  },
  modalSheet: {
    backgroundColor: theme.colors.surface,
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
    paddingHorizontal: 24,
    paddingTop: 24,
    paddingBottom: Platform.OS === 'ios' ? 34 : 24,
    width: '100%',
  },
  modalTitleRow: {
    flexDirection: 'row',
    alignItems: 'baseline',
    marginBottom: 4,
  },
  modalTitle: {
    fontFamily: theme.typography.fontFamily.brand,
    fontSize: 18,
    color: theme.colors.textPrimary,
  },
  modalTitleOptional: {
    fontFamily: theme.typography.fontFamily.regular,
    fontSize: 13,
    color: theme.colors.textMuted,
    marginLeft: 6,
  },
  modalSubtitle: {
    fontFamily: theme.typography.fontFamily.regular,
    fontSize: 13,
    color: theme.colors.textSecondary,
    marginTop: 4,
    marginBottom: 16,
  },
  modalInput: {
    height: 48,
    backgroundColor: theme.colors.background,
    borderRadius: 10,
    borderWidth: 1,
    borderColor: theme.colors.border,
    paddingHorizontal: 14,
    fontFamily: theme.typography.fontFamily.medium,
    fontSize: 14,
    color: theme.colors.textPrimary,
  },
  modalActions: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    gap: 12,
    marginTop: 20,
  },
  modalCancel: {
    flex: 1,
    height: 44,
    borderRadius: 10,
    backgroundColor: theme.colors.iconBackground,
    justifyContent: 'center',
    alignItems: 'center',
  },
  modalCancelLabel: {
    fontFamily: theme.typography.fontFamily.semibold,
    fontSize: 14,
    color: theme.colors.textPrimary,
  },
  modalConfirm: {
    flex: 1,
    height: 44,
    borderRadius: 10,
    backgroundColor: theme.colors.accent,
    justifyContent: 'center',
    alignItems: 'center',
  },
  modalConfirmDanger: {
    backgroundColor: '#EF4444',
  },
  modalConfirmLabel: {
    fontFamily: theme.typography.fontFamily.brand,
    fontSize: 14,
    color: '#FFFFFF',
  },
});
