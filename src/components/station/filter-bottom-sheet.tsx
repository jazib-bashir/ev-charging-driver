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

import { Icon } from '@/components/ui/icon';
import { theme } from '@/theme';
import type { PublicStationFilterState } from '@/types/station';
import {
  DEFAULT_FALLBACK_CITIES,
  DISTANCE_OPTIONS,
  getCitiesForUser,
} from '@/utils/location-helpers';

const { height: SCREEN_HEIGHT } = Dimensions.get('window');

type FilterBottomSheetProps = {
  visible: boolean;
  onClose: () => void;
  appliedFilters: PublicStationFilterState;
  onApplyFilters: (filters: PublicStationFilterState) => void;
  onClearAll: () => void;
  stationCount?: number;
};

export function FilterBottomSheet({
  visible,
  onClose,
  appliedFilters,
  onApplyFilters,
  onClearAll,
  stationCount,
}: FilterBottomSheetProps) {
  // Local draft state within the bottom sheet
  const [draftFilters, setDraftFilters] = useState<PublicStationFilterState>(appliedFilters);
  const [availableCities, setAvailableCities] = useState<string[]>(DEFAULT_FALLBACK_CITIES);
  const [isLoadingCities, setIsLoadingCities] = useState<boolean>(false);

  const slideAnim = useRef(new Animated.Value(SCREEN_HEIGHT)).current;
  const fadeAnim = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    let isMounted = true;

    if (visible) {
      setDraftFilters(appliedFilters);
      setIsLoadingCities(true);

      getCitiesForUser(appliedFilters.lat, appliedFilters.lng)
        .then((cities) => {
          if (isMounted) {
            setAvailableCities(cities);
            setIsLoadingCities(false);
          }
        })
        .catch(() => {
          if (isMounted) {
            setIsLoadingCities(false);
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
  }, [visible, appliedFilters, fadeAnim, slideAnim]);

  const handleSelectDistance = (value: number) => {
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

  const handleClearAll = () => {
    const emptyFilters: PublicStationFilterState = {
      radiusKm: null,
      city: null,
      isPrimarySite: null,
    };
    setDraftFilters(emptyFilters);
    onClearAll();
  };

  const handleApply = () => {
    onApplyFilters(draftFilters);
    onClose();
  };

  return (
    <Modal
      transparent
      visible={visible}
      animationType="none"
      onRequestClose={onClose}
    >
      <View style={styles.modalRoot}>
        {/* Backdrop */}
        <TouchableWithoutFeedback onPress={onClose}>
          <Animated.View style={[styles.backdrop, { opacity: fadeAnim }]} />
        </TouchableWithoutFeedback>

        {/* Sheet Content */}
        <Animated.View
          style={[
            styles.sheetContainer,
            {
              transform: [{ translateY: slideAnim }],
            },
          ]}
        >
          {/* Top Drag Handle */}
          <View style={styles.handleContainer}>
            <View style={styles.handlePill} />
          </View>

          {/* Header Row */}
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
            {/* Distance Section */}
            <View style={styles.section}>
              <Text style={styles.sectionTitle}>Distance</Text>
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
            </View>

            {/* City Section */}
            <View style={styles.section}>
              <Text style={styles.sectionTitle}>City</Text>
              {isLoadingCities ? (
                <View style={styles.loadingContainer}>
                  <ActivityIndicator size="small" color="#006655" />
                  <Text style={styles.loadingText}>Fetching cities near you...</Text>
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

            <View style={styles.divider} />

            {/* Primary Site Only Toggle */}
            <View style={styles.toggleRow}>
              <View style={styles.toggleTextContainer}>
                <Text style={styles.toggleTitle}>Primary Site Only</Text>
                <Text style={styles.toggleSubtitle}>
                  Show flagship and primary charging locations
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

          {/* Sticky Bottom Button */}
          <View style={styles.bottomBar}>
            <Pressable
              style={({ pressed }) => [
                styles.applyButton,
                pressed && styles.applyButtonPressed,
              ]}
              onPress={handleApply}
              accessibilityRole="button"
            >
              <Text style={styles.applyButtonText}>Search</Text>
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
  chipText: {
    fontSize: 14,
    fontWeight: theme.typography.fontWeight.medium,
    color: '#334155',
  },
  chipTextActive: {
    color: theme.colors.textInverse,
    fontWeight: theme.typography.fontWeight.semibold,
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
  applyButtonText: {
    color: theme.colors.textInverse,
    fontSize: 16,
    fontWeight: theme.typography.fontWeight.bold,
  },
});
