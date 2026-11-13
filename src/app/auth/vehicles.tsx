import { router, useFocusEffect, useLocalSearchParams, type Href } from 'expo-router';
import { useCallback, useEffect, useMemo, useState } from 'react';
import {
  FlatList,
  Keyboard,
  Modal,
  Platform,
  Pressable,
  StyleSheet,
  View,
} from 'react-native';

import { Text, TextInput } from '@/components/ui/text';
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
import { ButtonLoader } from '@/components/loaders/button-loader';
import { PageLoader } from '@/components/loaders/page-loader';
import { Button } from '@/components/ui/button';
import { ErrorState } from '@/components/ui/empty-state';
import { Icon } from '@/components/ui/icon';
import { ScreenHeader } from '@/components/ui/screen-header';
import {
  RequestStatusBanner,
  useRequestStatus,
} from '@/components/ui/request-status';
import { ScreenContainer } from '@/components/ui/screen-container';
import { useTheme } from '@/theme';
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
  const { theme } = useTheme();
  const styles = useMemo(() => createStyles(theme), [theme]);
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
                            ? theme.colors.primary
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
                          color={theme.colors.textLink}
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
                      <ButtonLoader size={22} color={theme.colors.textLink} />
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
        <ScreenHeader title="Vehicles" onBack={handleBack} />

        {isLoading ? (
          <PageLoader message="Loading vehicles…" />
        ) : loadFailed &&
          catalog.length === 0 &&
          savedVehicles.length === 0 ? (
          <ErrorState
            title="Couldn't load vehicles"
            message={status?.message ?? 'Check your connection and try again.'}
            primaryActionLabel="Try again"
            onPrimaryAction={() => {
              void loadVehicles();
            }}
          />
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
                      <ButtonLoader size={22} color={theme.colors.textLink} />
                    ) : (
                      <View style={styles.addIconWrap}>
                        <Icon
                          name="add"
                          size={18}
                          color={theme.colors.textLink}
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
              <Icon name="checkmark" size={14} color={theme.colors.textLink} />
              <Text style={styles.footerDefaultText} numberOfLines={1}>
                Default: {driverVehicleTitle(defaultVehicle)}
              </Text>
            </View>
          ) : (
            <Text style={styles.footerHint}>
              Select a vehicle to set as your default to continue.
            </Text>
          )}
          <Button
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
                <Button
                  label="Cancel"
                  variant="secondary"
                  size="md"
                  onPress={closePlatePrompt}
                  disabled={busyKey === 'plate'}
                  style={styles.modalButton}
                />
                <Button
                  label={
                    platePrompt.mode === 'edit'
                      ? 'Save'
                      : plateValue.trim()
                        ? 'Add vehicle'
                        : 'Skip & add'
                  }
                  size="md"
                  onPress={() => {
                    void handleSavePlate();
                  }}
                  loading={busyKey === 'plate'}
                  style={styles.modalButton}
                />
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
                <Button
                  label="Cancel"
                  variant="secondary"
                  size="md"
                  onPress={() => setPendingRemoval(null)}
                  disabled={isBusy}
                  style={styles.modalButton}
                />
                <Button
                  label="Remove"
                  variant="destructive"
                  size="md"
                  onPress={() => {
                    void confirmRemoveSaved();
                  }}
                  loading={isBusy}
                  style={styles.modalButton}
                />
              </View>
            </View>
          </View>
        </View>
      </Modal>
    </View>
  );
}

function createStyles(theme: ReturnType<typeof useTheme>['theme']) {
  const card = theme.isDark ? theme.shadows.none : theme.shadows.card;
  return StyleSheet.create({
    root: { flex: 1 },
    screen: { backgroundColor: theme.colors.background },
    list: { flex: 1 },
    listContent: { paddingBottom: theme.spacing.lg },
    garageSection: { marginTop: 4 },
    sectionLabel: {
      fontFamily: theme.typography.fontFamily.bold,
      fontSize: 11,
      color: theme.colors.textMuted,
      letterSpacing: 1.2,
      marginHorizontal: theme.spacing.gutter,
    },
    garageListContent: {
      paddingHorizontal: theme.spacing.gutter,
      paddingVertical: 12,
    },
    garageCard: {
      width: 236,
      backgroundColor: theme.colors.surface,
      borderRadius: theme.radius.xl,
      borderWidth: 1.5,
      borderColor: theme.colors.border,
      padding: 16,
      marginRight: 12,
      ...card,
    },
    garageCardSelected: {
      borderColor: theme.colors.primary,
      backgroundColor: theme.colors.primaryMuted,
    },
    garageCardTop: { flexDirection: 'row', alignItems: 'flex-start', gap: 12 },
    garageIcon: {
      width: 40,
      height: 40,
      borderRadius: 14,
      alignItems: 'center',
      justifyContent: 'center',
      backgroundColor: theme.colors.surfaceSunken,
    },
    garageIconSelected: { backgroundColor: theme.colors.primarySoft },
    garageCopy: { flex: 1, minWidth: 0 },
    garageTitle: {
      fontFamily: theme.typography.fontFamily.brand,
      fontSize: 15,
      letterSpacing: -0.2,
      color: theme.colors.textPrimary,
    },
    garagePlugs: {
      fontFamily: theme.typography.fontFamily.regular,
      fontSize: 11,
      color: theme.colors.textSecondary,
      marginTop: 4,
    },
    garageRemove: {
      width: 30,
      height: 30,
      borderRadius: 15,
      alignItems: 'center',
      justifyContent: 'center',
      backgroundColor: theme.colors.surfaceSunken,
    },
    garageActions: {
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'space-between',
      gap: 8,
      marginTop: 14,
    },
    defaultTag: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: 4,
      paddingHorizontal: 8,
      paddingVertical: 3,
      borderRadius: theme.radius.pill,
      backgroundColor: theme.colors.primarySoft,
    },
    defaultTagLabel: {
      fontFamily: theme.typography.fontFamily.bold,
      fontSize: 11,
      color: theme.colors.primary,
    },
    garageActionLink: {
      fontFamily: theme.typography.fontFamily.semibold,
      fontSize: 12,
      color: theme.colors.textLink,
    },
    garageBusy: {
      ...StyleSheet.absoluteFill,
      alignItems: 'center',
      justifyContent: 'center',
      backgroundColor: theme.colors.overlay,
      borderRadius: theme.radius.xl,
    },
    directoryHeader: {
      flexDirection: 'row',
      justifyContent: 'space-between',
      alignItems: 'center',
      marginHorizontal: theme.spacing.gutter,
      marginTop: 20,
      marginBottom: 10,
    },
    directoryTitle: { marginHorizontal: 0 },
    countPill: {
      backgroundColor: theme.colors.surfaceSunken,
      paddingHorizontal: 10,
      paddingVertical: 3,
      borderRadius: theme.radius.pill,
    },
    countPillText: {
      fontFamily: theme.typography.fontFamily.bold,
      fontSize: 11,
      color: theme.colors.textSecondary,
    },
    searchRow: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: 10,
      height: 50,
      marginHorizontal: theme.spacing.gutter,
      marginBottom: 12,
      paddingHorizontal: 14,
      borderRadius: theme.radius.control,
      backgroundColor: theme.colors.inputBackground,
    },
    searchInput: {
      flex: 1,
      fontFamily: theme.typography.fontFamily.medium,
      fontSize: 15,
      color: theme.colors.textPrimary,
      padding: 0,
    },
    statusWrap: { marginHorizontal: theme.spacing.gutter, marginBottom: 8 },
    catalogRow: {
      minHeight: 56,
      backgroundColor: theme.colors.surface,
      borderRadius: theme.radius.lg,
      borderWidth: StyleSheet.hairlineWidth,
      borderColor: theme.colors.border,
      marginHorizontal: theme.spacing.gutter,
      marginBottom: 8,
      paddingHorizontal: 16,
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'space-between',
      ...card,
    },
    cardDisabled: { opacity: 0.7 },
    catalogTitle: {
      flex: 1,
      fontFamily: theme.typography.fontFamily.semibold,
      fontSize: 14,
      color: theme.colors.textPrimary,
      paddingRight: 10,
    },
    catalogTrailing: { flexDirection: 'row', alignItems: 'center' },
    catalogPlugs: {
      fontFamily: theme.typography.fontFamily.regular,
      fontSize: 12,
      color: theme.colors.textSecondary,
      marginRight: 12,
      maxWidth: 120,
    },
    addIconWrap: {
      width: 30,
      height: 30,
      borderRadius: 11,
      alignItems: 'center',
      justifyContent: 'center',
      backgroundColor: theme.colors.primaryMuted,
    },
    emptyText: {
      fontFamily: theme.typography.fontFamily.regular,
      fontSize: 13,
      color: theme.colors.textMuted,
      textAlign: 'center',
      paddingVertical: 24,
    },
    loadMore: { alignItems: 'center', paddingVertical: 12 },
    loadMoreLabel: {
      fontFamily: theme.typography.fontFamily.bold,
      fontSize: 13,
      color: theme.colors.textLink,
    },
    footerBar: {
      backgroundColor: theme.colors.surface,
      borderTopWidth: StyleSheet.hairlineWidth,
      borderTopColor: theme.colors.border,
      paddingHorizontal: theme.spacing.gutter,
      paddingVertical: 14,
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
      color: theme.colors.successText,
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
      fontFamily: theme.typography.fontFamily.bold,
      fontSize: 13,
      color: theme.colors.textLink,
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
    modalDismiss: { ...StyleSheet.absoluteFill },
    modalSheetWrap: { width: '100%' },
    modalSheet: {
      backgroundColor: theme.colors.surfaceRaised,
      borderTopLeftRadius: theme.radius.xxl,
      borderTopRightRadius: theme.radius.xxl,
      paddingHorizontal: theme.spacing.gutter + 4,
      paddingTop: 24,
      paddingBottom: Platform.OS === 'ios' ? 34 : 24,
      width: '100%',
    },
    modalTitleRow: { flexDirection: 'row', alignItems: 'baseline', marginBottom: 4 },
    modalTitle: {
      fontFamily: theme.typography.fontFamily.brand,
      fontSize: 20,
      letterSpacing: -0.4,
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
      height: 54,
      backgroundColor: theme.colors.inputBackground,
      borderRadius: theme.radius.control,
      borderWidth: 1.5,
      borderColor: theme.colors.primary,
      paddingHorizontal: 16,
      fontFamily: theme.typography.fontFamily.semibold,
      fontSize: 16,
      letterSpacing: 1,
      color: theme.colors.textPrimary,
    },
    modalActions: { flexDirection: 'row', gap: 12, marginTop: 20 },
    modalButton: { flex: 1 },
  });
}
