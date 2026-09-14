import React, { useEffect, useRef, useState } from 'react';
import {
  ActivityIndicator,
  Animated,
  Dimensions,
  Easing,
  Modal,
  Pressable,
  ScrollView,
  StyleSheet,
  Switch,
  Text,
  TouchableWithoutFeedback,
  View,
} from 'react-native';

import {
  getDriverVehicleDisplayName,
  listDriverVehicles,
} from '@/api/driverVehicles';
import { fetchPublicVehicleModels } from '@/api/publicVehicleModels';
import { Icon } from '@/components/ui/icon';
import { theme } from '@/theme';
import type {
  PublicStationFilterState,
  StationSortBy,
  StationSortOrder,
} from '@/types/station';
import { CONNECTOR_TYPES } from '@/types/vehicle';
import { GeolocationError, getCurrentCoordinates } from '@/utils/geolocation';
import {
  DEFAULT_FALLBACK_CITIES,
  DISTANCE_OPTIONS,
  getCitiesForUser,
} from '@/utils/location-helpers';

const { height: SCREEN_HEIGHT } = Dimensions.get('window');

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
};

export function FilterBottomSheet({
  visible,
  onClose,
  appliedFilters,
  onApplyFilters,
  onClearAll,
  authToken = null,
}: FilterBottomSheetProps) {
  const [draftFilters, setDraftFilters] = useState<PublicStationFilterState>(appliedFilters);
  const [availableCities, setAvailableCities] = useState<string[]>(DEFAULT_FALLBACK_CITIES);
  const [isLoadingCities, setIsLoadingCities] = useState(false);
  const [vehicleOptions, setVehicleOptions] = useState<
    Array<{ id: string; label: string }>
  >([]);
  const [isLoadingVehicles, setIsLoadingVehicles] = useState(false);
  const [isResolvingLocation, setIsResolvingLocation] = useState(false);
  const [locationError, setLocationError] = useState<string | null>(null);

  const slideAnim = useRef(new Animated.Value(SCREEN_HEIGHT)).current;
  const fadeAnim = useRef(new Animated.Value(0)).current;

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

      Animated.parallel([
        Animated.timing(fadeAnim, {
          toValue: 1,
          duration: 250,
          easing: Easing.out(Easing.ease),
          useNativeDriver: true,
        }),
        Animated.timing(slideAnim, {
          toValue: 0,
          duration: 300,
          easing: Easing.out(Easing.cubic),
          useNativeDriver: true,
        }),
      ]).start();
    } else {
      Animated.parallel([
        Animated.timing(fadeAnim, {
          toValue: 0,
          duration: 200,
          easing: Easing.in(Easing.ease),
          useNativeDriver: true,
        }),
        Animated.timing(slideAnim, {
          toValue: SCREEN_HEIGHT,
          duration: 250,
          easing: Easing.in(Easing.cubic),
          useNativeDriver: true,
        }),
      ]).start();
    }

    return () => {
      isMounted = false;
    };
  }, [visible, appliedFilters, authToken, fadeAnim, slideAnim]);

  const handleSelectDistance = (value: number) => {
    setLocationError(null);
    setDraftFilters((prev) => ({
      ...prev,
      radiusKm: prev.radiusKm === value ? null : value,
    }));
  };

  const handleSelectCity = (cityName: string) => {
    setDraftFilters((prev) => ({
      ...prev,
      city: prev.city === cityName ? null : cityName,
    }));
  };

  const handleTogglePrimarySite = (value: boolean) => {
    setDraftFilters((prev) => ({
      ...prev,
      isPrimarySite: value ? true : null,
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
      isPrimarySite: null,
      lat: null,
      lng: null,
      connectorTypes: null,
      isFastCharger: null,
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
        lat: null,
        lng: null,
      });
      onClose();
      return;
    }

    setIsResolvingLocation(true);
    try {
      const coords = await getCurrentCoordinates();
      onApplyFilters({
        ...draftFilters,
        lat: coords.lat,
        lng: coords.lng,
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
    <Modal
      transparent
      visible={visible}
      animationType="none"
      onRequestClose={onClose}
    >
      <View style={styles.modalRoot}>
        <TouchableWithoutFeedback onPress={onClose}>
          <Animated.View style={[styles.backdrop, { opacity: fadeAnim }]} />
        </TouchableWithoutFeedback>

        <Animated.View
          style={[
            styles.sheetContainer,
            {
              transform: [{ translateY: slideAnim }],
            },
          ]}
        >
          <View style={styles.handleContainer}>
            <View style={styles.handlePill} />
          </View>

          <View style={styles.headerRow}>
            <Pressable
              onPress={handleClearAll}
              hitSlop={8}
              accessibilityRole="button"
              accessibilityLabel="Clear all filters"
            >
              <Text style={styles.clearAllText}>Clear All</Text>
            </Pressable>

            <Text style={styles.headerTitle}>Filters</Text>

            <Pressable
              onPress={onClose}
              hitSlop={8}
              accessibilityRole="button"
              accessibilityLabel="Close filters"
              style={styles.closeButton}
            >
              <Icon name="close" size={16} color="#64748b" />
            </Pressable>
          </View>

          <ScrollView
            showsVerticalScrollIndicator={false}
            contentContainerStyle={styles.scrollContent}
          >
            <View style={styles.section}>
              <Text style={styles.sectionTitle}>Distance</Text>
              <Text style={styles.sectionSubtitle}>
                Find stations within this range of your current location
              </Text>
              <View style={styles.chipsRow}>
                {DISTANCE_OPTIONS.map((opt) => {
                  const isSelected = draftFilters.radiusKm === opt.value;
                  return (
                    <Pressable
                      key={opt.value}
                      style={[styles.chip, isSelected && styles.chipActive]}
                      onPress={() => handleSelectDistance(opt.value)}
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
              {locationError ? (
                <Text style={styles.errorText}>{locationError}</Text>
              ) : null}
            </View>

            <View style={styles.section}>
              <Text style={styles.sectionTitle}>City</Text>
              {isLoadingCities ? (
                <View style={styles.loadingContainer}>
                  <ActivityIndicator size="small" color="#006655" />
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
                          <Icon name="check" size={14} color="#ffffff" />
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
                  <ActivityIndicator size="small" color="#006655" />
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
                          <Icon name="check" size={14} color="#ffffff" />
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
                        <Icon name="check" size={14} color="#ffffff" />
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
                trackColor={{ false: '#e2e8f0', true: '#006655' }}
                thumbColor="#ffffff"
                ios_backgroundColor="#e2e8f0"
              />
            </View>

            <View style={styles.toggleRow}>
              <View style={styles.toggleTextContainer}>
                <Text style={styles.toggleTitle}>Primary site only</Text>
                <Text style={styles.toggleSubtitle}>
                  Flagship and primary charging locations
                </Text>
              </View>
              <Switch
                value={Boolean(draftFilters.isPrimarySite)}
                onValueChange={handleTogglePrimarySite}
                trackColor={{ false: '#e2e8f0', true: '#006655' }}
                thumbColor="#ffffff"
                ios_backgroundColor="#e2e8f0"
              />
            </View>
          </ScrollView>

          <View style={styles.bottomBar}>
            <Pressable
              style={({ pressed }) => [
                styles.applyButton,
                pressed && styles.applyButtonPressed,
                isResolvingLocation && styles.applyButtonDisabled,
              ]}
              onPress={handleApply}
              disabled={isResolvingLocation}
              accessibilityRole="button"
            >
              {isResolvingLocation ? (
                <View style={styles.applyLoadingRow}>
                  <ActivityIndicator size="small" color="#ffffff" />
                  <Text style={styles.applyButtonText}>Locating...</Text>
                </View>
              ) : (
                <Text style={styles.applyButtonText}>Search</Text>
              )}
            </Pressable>
          </View>
        </Animated.View>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  modalRoot: {
    flex: 1,
    justifyContent: 'flex-end',
  },
  backdrop: {
    ...StyleSheet.absoluteFill,
    backgroundColor: 'rgba(0, 0, 0, 0.45)',
  },
  sheetContainer: {
    backgroundColor: theme.colors.surface,
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    maxHeight: SCREEN_HEIGHT * 0.82,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: -3 },
    shadowOpacity: 0.12,
    shadowRadius: 10,
    elevation: 16,
  },
  handleContainer: {
    alignItems: 'center',
    paddingTop: 10,
    paddingBottom: 6,
  },
  handlePill: {
    width: 44,
    height: 4,
    borderRadius: 2,
    backgroundColor: '#cbd5e1',
  },
  headerRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: theme.spacing.lg,
    paddingVertical: 12,
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: '#f1f5f9',
  },
  clearAllText: {
    color: '#006655',
    fontSize: 15,
    fontWeight: theme.typography.fontWeight.semibold,
  },
  headerTitle: {
    fontSize: 17,
    fontWeight: theme.typography.fontWeight.bold,
    color: theme.colors.textPrimary,
  },
  closeButton: {
    width: 28,
    height: 28,
    borderRadius: 14,
    backgroundColor: '#f1f5f9',
    alignItems: 'center',
    justifyContent: 'center',
  },
  scrollContent: {
    paddingHorizontal: theme.spacing.lg,
    paddingTop: theme.spacing.md,
    paddingBottom: theme.spacing.xl,
  },
  section: {
    marginBottom: theme.spacing.lg,
  },
  sectionTitle: {
    fontSize: 15,
    fontWeight: theme.typography.fontWeight.bold,
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
    paddingVertical: 9,
    paddingHorizontal: 16,
    borderRadius: 10,
    backgroundColor: '#f1f5f9',
    borderWidth: 1,
    borderColor: '#e2e8f0',
  },
  chipActive: {
    backgroundColor: '#006655',
    borderColor: '#006655',
  },
  chipDisabled: {
    opacity: 0.45,
  },
  chipText: {
    fontSize: 14,
    fontWeight: theme.typography.fontWeight.medium,
    color: '#334155',
  },
  chipTextActive: {
    color: theme.colors.textInverse,
    fontWeight: theme.typography.fontWeight.semibold,
  },
  chipTextDisabled: {
    color: '#94a3b8',
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
    color: '#b91c1c',
    lineHeight: 18,
  },
  divider: {
    height: 1,
    backgroundColor: '#f1f5f9',
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
    paddingHorizontal: theme.spacing.lg,
    paddingTop: theme.spacing.sm,
    paddingBottom: theme.spacing.xl,
    borderTopWidth: StyleSheet.hairlineWidth,
    borderTopColor: '#f1f5f9',
    backgroundColor: theme.colors.surface,
  },
  applyButton: {
    backgroundColor: '#006655',
    paddingVertical: 15,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
  },
  applyButtonPressed: {
    opacity: 0.9,
  },
  applyButtonDisabled: {
    opacity: 0.85,
  },
  applyLoadingRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  applyButtonText: {
    color: theme.colors.textInverse,
    fontSize: 16,
    fontWeight: theme.typography.fontWeight.bold,
  },
});
