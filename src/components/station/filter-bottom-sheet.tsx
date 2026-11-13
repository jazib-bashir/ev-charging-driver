import { useEffect, useMemo, useState } from 'react';
import { Pressable, ScrollView, StyleSheet, Switch, View } from 'react-native';

import { Text } from '@/components/ui/text';
import {
  getDriverVehicleDisplayName,
  listDriverVehicles,
} from '@/api/driverVehicles';
import { fetchPublicVehicleModels } from '@/api/publicVehicleModels';
import { ButtonLoader } from '@/components/loaders/button-loader';
import { BottomSheet } from '@/components/ui/bottom-sheet';
import { Button } from '@/components/ui/button';
import { Icon } from '@/components/ui/icon';
import { useTheme } from '@/theme';
import type {
  PublicStationFilterState,
  StationSortBy,
  StationSortOrder,
} from '@/types/station';
import { CONNECTOR_TYPES } from '@/types/vehicle';
import {
  GeolocationError,
  getCurrentCoordinates,
  type LocationPermissionState,
} from '@/utils/geolocation';
import {
  DEFAULT_FALLBACK_CITIES,
  DISTANCE_OPTIONS,
  getCitiesForUser,
} from '@/utils/location-helpers';

const SORT_BY_OPTIONS: { label: string; value: StationSortBy }[] = [
  { label: 'Power', value: 'power' },
  { label: 'Price', value: 'price' },
];

const SORT_ORDER_OPTIONS: { label: string; value: StationSortOrder }[] = [
  { label: 'Ascending', value: 'asc' },
  { label: 'Descending', value: 'desc' },
];

function defaultSortOrderFor(sortBy: StationSortBy): StationSortOrder {
  return sortBy === 'price' ? 'asc' : 'desc';
}

async function loadFilterVehicleOptions(
  authToken: string | null,
): Promise<Array<{ id: string; label: string }>> {
  if (authToken) {
    const items = await listDriverVehicles(authToken);
    return items.map((item) => ({
      id: item.id,
      label: getDriverVehicleDisplayName(item),
    }));
  }

  const items = await fetchPublicVehicleModels({ all: true });
  return items.map((item) => ({
    id: item.id,
    label: item.displayName,
  }));
}

type FilterBottomSheetProps = {
  visible: boolean;
  onClose: () => void;
  appliedFilters: PublicStationFilterState;
  onApplyFilters: (filters: PublicStationFilterState) => void;
  onClearAll: () => void;
  stationCount?: number;
  authToken?: string | null;
  locationPermissionStatus: LocationPermissionState;
  isLocationLoading?: boolean;
  onEnableLocation: () => Promise<void>;
  onOpenLocationSettings: () => Promise<void>;
};

export function FilterBottomSheet({
  visible,
  onClose,
  appliedFilters,
  onApplyFilters,
  onClearAll,
  authToken = null,
  locationPermissionStatus,
  isLocationLoading = false,
  onEnableLocation,
  onOpenLocationSettings,
}: FilterBottomSheetProps) {
  const { theme } = useTheme();
  const styles = useMemo(() => createStyles(theme), [theme]);
  const [draftFilters, setDraftFilters] = useState<PublicStationFilterState>(appliedFilters);
  const [availableCities, setAvailableCities] = useState<string[]>(DEFAULT_FALLBACK_CITIES);
  const [isLoadingCities, setIsLoadingCities] = useState(false);
  const [vehicleOptions, setVehicleOptions] = useState<
    Array<{ id: string; label: string }>
  >([]);
  const [isLoadingVehicles, setIsLoadingVehicles] = useState(false);
  const [isResolvingLocation, setIsResolvingLocation] = useState(false);
  const [locationError, setLocationError] = useState<string | null>(null);

  useEffect(() => {
    let isMounted = true;

    if (visible) {
      setDraftFilters(appliedFilters);
      setLocationError(null);
      setIsResolvingLocation(false);
      setIsLoadingCities(true);
      setIsLoadingVehicles(true);

      getCitiesForUser(appliedFilters.lat, appliedFilters.lng)
        .then((cities) => {
          if (isMounted) {
            setAvailableCities(cities);
            setIsLoadingCities(false);
          }
        })
        .catch(() => {
          if (isMounted) {
            setAvailableCities(DEFAULT_FALLBACK_CITIES);
            setIsLoadingCities(false);
          }
        });

      loadFilterVehicleOptions(authToken ?? null)
        .then((options) => {
          if (isMounted) {
            setVehicleOptions(options);
            setIsLoadingVehicles(false);
          }
        })
        .catch(() => {
          if (isMounted) {
            setVehicleOptions([]);
            setIsLoadingVehicles(false);
          }
        });
    }

    return () => {
      isMounted = false;
    };
  }, [visible, appliedFilters, authToken]);

  const isDistanceFilterLocked = locationPermissionStatus !== 'granted';

  const handleSelectDistance = async (value: number) => {
    setLocationError(null);

    if (draftFilters.radiusKm === value) {
      setDraftFilters((prev) => ({
        ...prev,
        radiusKm: null,
      }));
      return;
    }

    if (isDistanceFilterLocked) {
      try {
        await onEnableLocation();
      } catch (error) {
        const message =
          error instanceof GeolocationError
            ? error.message
            : 'Location access is required to use the distance filter.';
        setLocationError(message);
        return;
      }
    }

    setDraftFilters((prev) => ({
      ...prev,
      radiusKm: value,
      city: null,
    }));
  };

  const handleSelectCity = (cityName: string) => {
    setDraftFilters((prev) => ({
      ...prev,
      city: prev.city === cityName ? null : cityName,
    }));
  };

  const handleToggleFastCharger = (value: boolean) => {
    setDraftFilters((prev) => ({
      ...prev,
      isFastCharger: value ? true : null,
    }));
  };

  const handleSelectVehicle = (vehicleId: string) => {
    setDraftFilters((prev) => ({
      ...prev,
      vehicleId: prev.vehicleId === vehicleId ? null : vehicleId,
    }));
  };

  const handleToggleConnector = (connector: string) => {
    setDraftFilters((prev) => {
      const current = prev.connectorTypes ?? [];
      const exists = current.includes(connector);
      const next = exists
        ? current.filter((item) => item !== connector)
        : [...current, connector];
      return {
        ...prev,
        connectorTypes: next.length > 0 ? next : null,
      };
    });
  };

  const handleSelectSortBy = (value: StationSortBy) => {
    setDraftFilters((prev) => {
      if (prev.sortBy === value) {
        return {
          ...prev,
          sortBy: null,
          sortOrder: null,
        };
      }

      return {
        ...prev,
        sortBy: value,
        sortOrder: prev.sortOrder ?? defaultSortOrderFor(value),
      };
    });
  };

  const handleSelectSortOrder = (value: StationSortOrder) => {
    setDraftFilters((prev) => {
      if (!prev.sortBy) {
        return {
          ...prev,
          sortBy: 'power',
          sortOrder: value,
        };
      }

      return {
        ...prev,
        sortOrder: value,
      };
    });
  };

  const handleClearAll = () => {
    const emptyFilters: PublicStationFilterState = {
      radiusKm: null,
      city: null,
      lat: null,
      lng: null,
      connectorTypes: null,
      isFastCharger: null,
      availableOnly: null,
      queueOpenOnly: null,
      vehicleId: null,
      sortBy: null,
      sortOrder: null,
    };
    setDraftFilters(emptyFilters);
    setLocationError(null);
    onClearAll();
  };

  const handleApply = async () => {
    setLocationError(null);

    const needsLocation =
      typeof draftFilters.radiusKm === 'number' && draftFilters.radiusKm > 0;

    if (!needsLocation) {
      onApplyFilters({
        ...draftFilters,
        radiusKm: null,
      });
      onClose();
      return;
    }

    if (locationPermissionStatus === 'denied') {
      setLocationError(
        'Location access is required to filter stations by distance. Open Settings to allow it.',
      );
      return;
    }

    setIsResolvingLocation(true);
    try {
      if (locationPermissionStatus !== 'granted') {
        await onEnableLocation();
      }

      const coords = await getCurrentCoordinates();

      onApplyFilters({
        ...draftFilters,
        lat: coords.lat,
        lng: coords.lng,
        city: null,
      });
      onClose();
    } catch (error) {
      const message =
        error instanceof GeolocationError
          ? error.message
          : 'Unable to read your current location. Please try again.';
      setLocationError(message);
    } finally {
      setIsResolvingLocation(false);
    }
  };

  const selectedConnectors = draftFilters.connectorTypes ?? [];

  return (
    <BottomSheet
      visible={visible}
      onClose={onClose}
      title="Filters"
      maxHeightRatio={0.9}
      contentStyle={styles.sheetContent}
      headerRight={
        <Pressable
          onPress={handleClearAll}
          hitSlop={8}
          accessibilityRole="button"
          accessibilityLabel="Clear all filters"
        >
          <Text style={styles.clearAllText}>Clear all</Text>
        </Pressable>
      }
    >
          <ScrollView
            showsVerticalScrollIndicator={false}
            contentContainerStyle={styles.scrollContent}
          >
            <View style={styles.section}>
              <Text style={styles.sectionTitle}>Distance</Text>
              <Text style={styles.sectionSubtitle}>
                Find stations within this range of your current location
              </Text>

              {locationPermissionStatus !== 'granted' ? (
                <View style={styles.locationNotice}>
                  <Icon name="location" size={16} color={theme.colors.primary} />
                  <View style={styles.locationNoticeCopy}>
                    <Text style={styles.locationNoticeTitle}>
                      Location access required
                    </Text>
                    <Text style={styles.locationNoticeText}>
                      {locationPermissionStatus === 'denied'
                        ? 'Distance filtering is disabled until location access is enabled in Settings.'
                        : 'Allow location access to filter stations by how far they are from you.'}
                    </Text>
                  </View>
                  <Pressable
                    style={styles.locationNoticeButton}
                    onPress={() => {
                      void (locationPermissionStatus === 'denied'
                        ? onOpenLocationSettings()
                        : onEnableLocation().catch(() => undefined));
                    }}
                    disabled={isLocationLoading || isResolvingLocation}
                    accessibilityRole="button"
                  >
                    <Text style={styles.locationNoticeButtonText}>
                      {locationPermissionStatus === 'denied' ? 'Settings' : 'Allow'}
                    </Text>
                  </Pressable>
                </View>
              ) : null}

              <View style={styles.chipsRow}>
                {DISTANCE_OPTIONS.map((opt) => {
                  const isSelected = draftFilters.radiusKm === opt.value;
                  const isDisabled =
                    isDistanceFilterLocked || isLocationLoading || isResolvingLocation;

                  return (
                    <Pressable
                      key={opt.value}
                      style={[
                        styles.chip,
                        isSelected && styles.chipActive,
                        isDisabled && styles.chipDisabled,
                      ]}
                      onPress={() => {
                        void handleSelectDistance(opt.value);
                      }}
                      disabled={isDisabled}
                      accessibilityRole="button"
                    >
                      <Text
                        style={[
                          styles.chipText,
                          isSelected && styles.chipTextActive,
                          isDisabled && styles.chipTextDisabled,
                        ]}
                      >
                        {opt.label}
                      </Text>
                    </Pressable>
                  );
                })}
              </View>
              {locationError ? (
                <Text style={styles.errorText}>{locationError}</Text>
              ) : null}
            </View>

            <View style={styles.section}>
              <Text style={styles.sectionTitle}>City</Text>
              {isLoadingCities ? (
                <View style={styles.loadingContainer}>
                  <ButtonLoader size={26} color={theme.colors.textLink} />
                  <Text style={styles.loadingText}>Loading cities...</Text>
                </View>
              ) : (
                <View style={styles.chipsRow}>
                  {availableCities.map((cityName) => {
                    const isSelected = draftFilters.city === cityName;
                    return (
                      <Pressable
                        key={cityName}
                        style={[styles.chip, isSelected && styles.chipActive]}
                        onPress={() => handleSelectCity(cityName)}
                        accessibilityRole="button"
                      >
                        {isSelected && (
                          <Icon name="check" size={14} color={theme.colors.onPrimary} />
                        )}
                        <Text
                          style={[
                            styles.chipText,
                            isSelected && styles.chipTextActive,
                          ]}
                        >
                          {cityName}
                        </Text>
                      </Pressable>
                    );
                  })}
                </View>
              )}
            </View>

            <View style={styles.section}>
              <Text style={styles.sectionTitle}>{'Vehicles'}</Text>
              <Text style={styles.sectionSubtitle}>
                {authToken
                  ? 'Show stations compatible with one of your vehicles'
                  : 'Show stations compatible with a vehicle model'}
              </Text>
              {isLoadingVehicles ? (
                <View style={styles.loadingContainer}>
                  <ButtonLoader size={26} color={theme.colors.textLink} />
                  <Text style={styles.loadingText}>
                    {authToken ? 'Loading your vehicles...' : 'Loading vehicles...'}
                  </Text>
                </View>
              ) : vehicleOptions.length === 0 ? (
                <Text style={styles.helperText}>
                  {authToken
                    ? 'No vehicles saved yet. Add a vehicle in your profile to use this filter.'
                    : 'No vehicle models available right now.'}
                </Text>
              ) : (
                <View style={styles.chipsRow}>
                  {vehicleOptions.map((option) => {
                    const isSelected = draftFilters.vehicleId === option.id;
                    return (
                      <Pressable
                        key={option.id}
                        style={[styles.chip, isSelected && styles.chipActive]}
                        onPress={() => handleSelectVehicle(option.id)}
                        accessibilityRole="button"
                      >
                        {isSelected ? (
                          <Icon name="check" size={14} color={theme.colors.onPrimary} />
                        ) : null}
                        <Text
                          style={[
                            styles.chipText,
                            isSelected && styles.chipTextActive,
                          ]}
                        >
                          {option.label}
                        </Text>
                      </Pressable>
                    );
                  })}
                </View>
              )}
            </View>

            <View style={styles.section}>
              <Text style={styles.sectionTitle}>Connector type</Text>
              <View style={styles.chipsRow}>
                {CONNECTOR_TYPES.map((connector) => {
                  const isSelected = selectedConnectors.includes(connector);
                  return (
                    <Pressable
                      key={connector}
                      style={[styles.chip, isSelected && styles.chipActive]}
                      onPress={() => handleToggleConnector(connector)}
                      accessibilityRole="button"
                    >
                      {isSelected && (
                        <Icon name="check" size={14} color={theme.colors.onPrimary} />
                      )}
                      <Text
                        style={[
                          styles.chipText,
                          isSelected && styles.chipTextActive,
                        ]}
                      >
                        {connector}
                      </Text>
                    </Pressable>
                  );
                })}
              </View>
            </View>

            <View style={styles.section}>
              <Text style={styles.sectionTitle}>Sort by</Text>
              <View style={styles.chipsRow}>
                {SORT_BY_OPTIONS.map((opt) => {
                  const isSelected = draftFilters.sortBy === opt.value;
                  return (
                    <Pressable
                      key={opt.value}
                      style={[styles.chip, isSelected && styles.chipActive]}
                      onPress={() => handleSelectSortBy(opt.value)}
                      accessibilityRole="button"
                    >
                      <Text
                        style={[
                          styles.chipText,
                          isSelected && styles.chipTextActive,
                        ]}
                      >
                        {opt.label}
                      </Text>
                    </Pressable>
                  );
                })}
              </View>
            </View>

            <View style={styles.section}>
              <Text style={styles.sectionTitle}>Sort order</Text>
              <View style={styles.chipsRow}>
                {SORT_ORDER_OPTIONS.map((opt) => {
                  const isSelected = draftFilters.sortOrder === opt.value;
                  return (
                    <Pressable
                      key={opt.value}
                      style={[
                        styles.chip,
                        isSelected && styles.chipActive,
                        !draftFilters.sortBy && styles.chipDisabled,
                      ]}
                      onPress={() => handleSelectSortOrder(opt.value)}
                      disabled={!draftFilters.sortBy}
                      accessibilityRole="button"
                    >
                      <Text
                        style={[
                          styles.chipText,
                          isSelected && styles.chipTextActive,
                          !draftFilters.sortBy && styles.chipTextDisabled,
                        ]}
                      >
                        {opt.label}
                      </Text>
                    </Pressable>
                  );
                })}
              </View>
            </View>

            <View style={styles.divider} />

            <View style={styles.toggleRow}>
              <View style={styles.toggleTextContainer}>
                <Text style={styles.toggleTitle}>Fast charging</Text>
                <Text style={styles.toggleSubtitle}>
                  Stations with at least one fast charger
                </Text>
              </View>
              <Switch
                value={Boolean(draftFilters.isFastCharger)}
                onValueChange={handleToggleFastCharger}
                trackColor={{ false: theme.colors.borderStrong, true: theme.colors.primary }}
                thumbColor={theme.colors.onPrimary}
                ios_backgroundColor={theme.colors.borderStrong}
              />
            </View>

          </ScrollView>

      <View style={styles.bottomBar}>
        <Button
          label="Search"
          onPress={() => {
            void handleApply();
          }}
          loading={isResolvingLocation}
          leadingIcon="search"
        />
      </View>
    </BottomSheet>
  );
}

function createStyles(theme: ReturnType<typeof useTheme>['theme']) {
  return StyleSheet.create({
  sheetContent: {
    flexShrink: 1,
  },
  clearAllText: {
    color: theme.colors.textLink,
    fontSize: 14,
    fontFamily: theme.typography.fontFamily.bold,
  },
  scrollContent: {
    paddingTop: theme.spacing.xs,
    paddingBottom: theme.spacing.xl,
  },
  section: {
    marginBottom: theme.spacing.lg,
  },
  sectionTitle: {
    fontFamily: theme.typography.fontFamily.brand,
    fontSize: 16,
    letterSpacing: -0.3,
    color: theme.colors.textPrimary,
    marginBottom: 10,
  },
  sectionSubtitle: {
    fontSize: 13,
    color: theme.colors.textSecondary,
    marginTop: -6,
    marginBottom: 10,
    lineHeight: 18,
  },
  locationNotice: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: theme.spacing.sm,
    marginBottom: theme.spacing.sm,
    padding: theme.spacing.md,
    borderRadius: theme.radius.xl,
    borderWidth: 1,
    borderColor: theme.colors.selectionBorder,
    backgroundColor: theme.colors.primaryMuted,
  },
  locationNoticeCopy: {
    flex: 1,
    gap: 4,
  },
  locationNoticeTitle: {
    fontSize: theme.typography.fontSize.sm,
    fontWeight: theme.typography.fontWeight.bold,
    color: theme.colors.textPrimary,
  },
  locationNoticeText: {
    fontSize: theme.typography.fontSize.xs,
    color: theme.colors.textSecondary,
    lineHeight: 17,
  },
  locationNoticeButton: {
    alignSelf: 'center',
    paddingHorizontal: theme.spacing.md,
    paddingVertical: 8,
    borderRadius: theme.radius.pill,
    backgroundColor: theme.colors.primary,
  },
  locationNoticeButtonText: {
    fontSize: theme.typography.fontSize.xs,
    fontWeight: theme.typography.fontWeight.bold,
    color: theme.colors.onPrimary,
  },
  helperText: {
    fontSize: 13,
    color: theme.colors.textSecondary,
    lineHeight: 18,
  },
  chipsRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
  },
  chip: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    paddingVertical: 10,
    paddingHorizontal: 16,
    borderRadius: theme.radius.pill,
    backgroundColor: theme.colors.surface,
    borderWidth: 1,
    borderColor: theme.colors.border,
  },
  chipActive: {
    backgroundColor: theme.colors.primary,
    borderColor: theme.colors.primary,
  },
  chipDisabled: {
    opacity: 0.45,
  },
  chipText: {
    fontSize: 14,
    fontWeight: theme.typography.fontWeight.medium,
    color: theme.colors.textSecondary,
  },
  chipTextActive: {
    color: theme.colors.onPrimary,
    fontWeight: theme.typography.fontWeight.semibold,
  },
  chipTextDisabled: {
    color: theme.colors.disabledText,
  },
  loadingContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    paddingVertical: 12,
  },
  loadingText: {
    fontSize: 13,
    color: theme.colors.textSecondary,
  },
  errorText: {
    marginTop: 10,
    fontSize: 13,
    color: theme.colors.errorText,
    lineHeight: 18,
  },
  divider: {
    height: StyleSheet.hairlineWidth,
    backgroundColor: theme.colors.border,
    marginVertical: theme.spacing.sm,
  },
  toggleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: theme.spacing.sm,
  },
  toggleTextContainer: {
    flex: 1,
    paddingRight: theme.spacing.md,
  },
  toggleTitle: {
    fontSize: 15,
    fontWeight: theme.typography.fontWeight.semibold,
    color: theme.colors.textPrimary,
    marginBottom: 2,
  },
  toggleSubtitle: {
    fontSize: 13,
    color: theme.colors.textSecondary,
    lineHeight: 18,
  },
  bottomBar: {
    paddingTop: theme.spacing.md,
  },
});
}
