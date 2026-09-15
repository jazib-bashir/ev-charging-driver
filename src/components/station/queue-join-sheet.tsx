import { router, type Href } from 'expo-router';
import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import {
  ActivityIndicator,
  Animated,
  Dimensions,
  Easing,
  Modal,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  TouchableWithoutFeedback,
  View,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { AuthApiError } from '@/api/auth';
import {
  getDriverVehicleConnectors,
  getDriverVehicleDisplayName,
  listDriverVehicles,
} from '@/api/driverVehicles';
import { joinStationQueue } from '@/api/stationQueue';
import { Icon } from '@/components/ui/icon';
import {
  RequestStatusBanner,
  useRequestStatus,
} from '@/components/ui/request-status';
import { theme } from '@/theme';
import type { ChargingPreference, QueueMember } from '@/types/queue';
import { CHARGING_PREFERENCES } from '@/types/queue';
import type { ConnectorType, DriverVehicle } from '@/types/vehicle';

const { height: SCREEN_HEIGHT } = Dimensions.get('window');

const CHARGING_PREF_COPY: Record<
  ChargingPreference,
  { label: string; description: string }
> = {
  ANY: {
    label: 'Any charger',
    description: 'First compatible spot available',
  },
  FAST: {
    label: 'Fast only',
    description: 'Prefer DC / fast chargers',
  },
};

type QueueJoinSheetProps = {
  visible: boolean;
  stationId: string;
  stationName?: string;
  authToken: string | null;
  onClose: () => void;
  onJoined: (member: QueueMember) => void;
};

export function QueueJoinSheet({
  visible,
  stationId,
  stationName,
  authToken,
  onClose,
  onJoined,
}: QueueJoinSheetProps) {
  const insets = useSafeAreaInsets();
  const slideAnim = useRef(new Animated.Value(SCREEN_HEIGHT)).current;
  const fadeAnim = useRef(new Animated.Value(0)).current;
  const { status, showError, clearStatus } = useRequestStatus();

  const [vehicles, setVehicles] = useState<DriverVehicle[]>([]);
  const [isLoadingVehicles, setIsLoadingVehicles] = useState(false);
  const [vehiclesError, setVehiclesError] = useState<string | null>(null);
  const [selectedVehicleId, setSelectedVehicleId] = useState<string | null>(null);
  const [connectorPreference, setConnectorPreference] =
    useState<ConnectorType | null>(null);
  const [chargingPreference, setChargingPreference] =
    useState<ChargingPreference>('ANY');
  const [isSubmitting, setIsSubmitting] = useState(false);

  const selectedVehicle = useMemo(
    () => vehicles.find((vehicle) => vehicle.id === selectedVehicleId) ?? null,
    [vehicles, selectedVehicleId],
  );

  const connectorOptions = useMemo((): ConnectorType[] => {
    if (!selectedVehicle) {
      return [];
    }
    return getDriverVehicleConnectors(selectedVehicle) as ConnectorType[];
  }, [selectedVehicle]);

  const selectionSummary = useMemo(() => {
    if (!selectedVehicle || !connectorPreference) {
      return null;
    }
    const vehicleName = getDriverVehicleDisplayName(selectedVehicle);
    const chargeLabel = CHARGING_PREF_COPY[chargingPreference].label;
    return `${vehicleName} · ${connectorPreference} · ${chargeLabel}`;
  }, [selectedVehicle, connectorPreference, chargingPreference]);

  const resetSelections = useCallback(() => {
    setSelectedVehicleId(null);
    setConnectorPreference(null);
    setChargingPreference('ANY');
    setVehiclesError(null);
    clearStatus();
  }, [clearStatus]);

  const loadVehicles = useCallback(async () => {
    if (!authToken) {
      setVehicles([]);
      setVehiclesError('Sign in to book a queue.');
      return;
    }

    setIsLoadingVehicles(true);
    setVehiclesError(null);

    try {
      const items = await listDriverVehicles(authToken);
      setVehicles(items);

      const defaultVehicle = items.find((vehicle) => vehicle.isDefault) ?? items[0];
      if (defaultVehicle) {
        setSelectedVehicleId(defaultVehicle.id);
        const connectors = getDriverVehicleConnectors(
          defaultVehicle,
        ) as ConnectorType[];
        setConnectorPreference(connectors[0] ?? null);
      } else {
        setSelectedVehicleId(null);
        setConnectorPreference(null);
      }
    } catch (error) {
      setVehicles([]);
      setVehiclesError(
        error instanceof AuthApiError
          ? error.message
          : 'Unable to load your vehicles. Please try again.',
      );
    } finally {
      setIsLoadingVehicles(false);
    }
  }, [authToken]);

  useEffect(() => {
    if (visible) {
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
      void loadVehicles();
      return;
    }

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
  }, [visible, fadeAnim, slideAnim, loadVehicles]);

  useEffect(() => {
    if (!visible) {
      resetSelections();
      setIsSubmitting(false);
    }
  }, [visible, resetSelections]);

  useEffect(() => {
    if (!selectedVehicle) {
      setConnectorPreference(null);
      return;
    }

    const connectors = getDriverVehicleConnectors(
      selectedVehicle,
    ) as ConnectorType[];
    setConnectorPreference((current) => {
      if (current && connectors.includes(current)) {
        return current;
      }
      return connectors[0] ?? null;
    });
  }, [selectedVehicle]);

  const canSubmit =
    Boolean(authToken) &&
    Boolean(selectedVehicleId) &&
    Boolean(connectorPreference) &&
    !isSubmitting &&
    !isLoadingVehicles &&
    vehicles.length > 0;

  const handleAddVehicle = () => {
    onClose();
    router.push('/auth/vehicles' as Href);
  };

  const handleConfirm = async () => {
    if (!canSubmit || !authToken || !selectedVehicleId || !connectorPreference) {
      return;
    }

    setIsSubmitting(true);
    clearStatus();

    try {
      const member = await joinStationQueue(authToken, stationId, {
        vehicleId: selectedVehicleId,
        connectorPreference,
        chargingPreference,
      });
      onJoined(member);
      onClose();
    } catch (error) {
      showError(
        error instanceof AuthApiError
          ? error.message
          : 'Unable to book the queue. Please try again.',
      );
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <Modal transparent visible={visible} animationType="none" onRequestClose={onClose}>
      <View style={styles.modalRoot}>
        <TouchableWithoutFeedback onPress={isSubmitting ? undefined : onClose}>
          <Animated.View style={[styles.backdrop, { opacity: fadeAnim }]} />
        </TouchableWithoutFeedback>

        <Animated.View
          style={[
            styles.sheetContainer,
            {
              paddingBottom: Math.max(insets.bottom, theme.spacing.md),
              transform: [{ translateY: slideAnim }],
            },
          ]}
        >
          <View style={styles.handleContainer}>
            <View style={styles.handlePill} />
          </View>

          <View style={styles.headerBlock}>
            <View style={styles.headerRow}>
              <Text style={styles.headerTitle}>Book Queue</Text>
              <Pressable
                onPress={onClose}
                hitSlop={8}
                disabled={isSubmitting}
                accessibilityRole="button"
                accessibilityLabel="Close book queue"
                style={styles.closeButton}
              >
                <Icon name="close" size={16} color="#64748b" />
              </Pressable>
            </View>
            <Text style={styles.headerSubtitle}>
              Choose your vehicle and charging preferences for
              {stationName ? ` ${stationName}` : ' this station'}.
            </Text>
          </View>

          <ScrollView
            showsVerticalScrollIndicator={false}
            contentContainerStyle={styles.scrollContent}
            keyboardShouldPersistTaps="handled"
          >
            <RequestStatusBanner status={status} />

            <View style={styles.section}>
              <Text style={styles.sectionTitle}>1. Vehicle</Text>
              <Text style={styles.sectionHint}>Select which EV to charge.</Text>

              {isLoadingVehicles ? (
                <View style={styles.loadingBlock}>
                  <ActivityIndicator color={theme.colors.brand} />
                  <Text style={styles.loadingLabel}>Loading vehicles…</Text>
                </View>
              ) : vehiclesError ? (
                <View style={styles.emptyCard}>
                  <Text style={styles.emptyText}>{vehiclesError}</Text>
                  <Pressable
                    style={styles.secondaryButton}
                    onPress={() => {
                      void loadVehicles();
                    }}
                    accessibilityRole="button"
                    accessibilityLabel="Retry loading vehicles"
                  >
                    <Text style={styles.secondaryButtonText}>Try again</Text>
                  </Pressable>
                </View>
              ) : vehicles.length === 0 ? (
                <View style={styles.emptyCard}>
                  <View style={styles.emptyIconWrap}>
                    <Icon name="car" size={22} color={theme.colors.brand} />
                  </View>
                  <Text style={styles.emptyTitle}>No vehicles yet</Text>
                  <Text style={styles.emptyText}>
                    Add a vehicle to your profile before booking a queue spot.
                  </Text>
                  <Pressable
                    style={styles.secondaryButton}
                    onPress={handleAddVehicle}
                    accessibilityRole="button"
                    accessibilityLabel="Add a vehicle"
                  >
                    <Text style={styles.secondaryButtonText}>Add vehicle</Text>
                  </Pressable>
                </View>
              ) : (
                <View style={styles.vehicleList}>
                  {vehicles.map((vehicle) => {
                    const selected = vehicle.id === selectedVehicleId;
                    const connectors = getDriverVehicleConnectors(vehicle);
                    return (
                      <Pressable
                        key={vehicle.id}
                        onPress={() => setSelectedVehicleId(vehicle.id)}
                        disabled={isSubmitting}
                        style={[
                          styles.vehicleRow,
                          selected && styles.vehicleRowSelected,
                        ]}
                        accessibilityRole="button"
                        accessibilityState={{ selected }}
                        accessibilityLabel={`Select ${getDriverVehicleDisplayName(vehicle)}`}
                      >
                        <View
                          style={[
                            styles.vehicleIconWrap,
                            selected && styles.vehicleIconWrapSelected,
                          ]}
                        >
                          <Icon
                            name="car"
                            size={18}
                            color={
                              selected
                                ? theme.colors.brand
                                : theme.colors.textMuted
                            }
                          />
                        </View>
                        <View style={styles.vehicleCopy}>
                          <View style={styles.vehicleTitleRow}>
                            <Text
                              style={[
                                styles.vehicleTitle,
                                selected && styles.vehicleTitleSelected,
                              ]}
                              numberOfLines={1}
                            >
                              {getDriverVehicleDisplayName(vehicle)}
                            </Text>
                            {vehicle.isDefault ? (
                              <View style={styles.defaultPill}>
                                <Text style={styles.defaultPillText}>Default</Text>
                              </View>
                            ) : null}
                          </View>
                          <Text style={styles.vehicleSubtitle} numberOfLines={1}>
                            {connectors.join(' · ') || 'No connectors'}
                          </Text>
                        </View>
                        <View
                          style={[
                            styles.radioOuter,
                            selected && styles.radioOuterSelected,
                          ]}
                        >
                          {selected ? <View style={styles.radioInner} /> : null}
                        </View>
                      </Pressable>
                    );
                  })}
                </View>
              )}
            </View>

            {vehicles.length > 0 ? (
              <>
                <View style={styles.section}>
                  <Text style={styles.sectionTitle}>2. Connector</Text>
                  <Text style={styles.sectionHint}>
                    Match the plug type for your selected vehicle.
                  </Text>
                  {connectorOptions.length === 0 ? (
                    <Text style={styles.helperText}>
                      This vehicle has no connectors configured.
                    </Text>
                  ) : (
                    <View style={styles.optionGrid}>
                      {connectorOptions.map((connector) => {
                        const selected = connectorPreference === connector;
                        return (
                          <Pressable
                            key={connector}
                            onPress={() => {
                              if (!isSubmitting) {
                                setConnectorPreference(connector);
                              }
                            }}
                            disabled={isSubmitting}
                            style={[
                              styles.optionCard,
                              selected && styles.optionCardSelected,
                            ]}
                            accessibilityRole="button"
                            accessibilityState={{ selected }}
                          >
                            <Text
                              style={[
                                styles.optionCardLabel,
                                selected && styles.optionCardLabelSelected,
                              ]}
                            >
                              {connector}
                            </Text>
                          </Pressable>
                        );
                      })}
                    </View>
                  )}
                </View>

                <View style={styles.section}>
                  <Text style={styles.sectionTitle}>3. Charging preference</Text>
                  <Text style={styles.sectionHint}>
                    How should we allocate a charger for you?
                  </Text>
                  <View style={styles.prefList}>
                    {CHARGING_PREFERENCES.map((preference) => {
                      const selected = chargingPreference === preference;
                      const copy = CHARGING_PREF_COPY[preference];
                      return (
                        <Pressable
                          key={preference}
                          onPress={() => {
                            if (!isSubmitting) {
                              setChargingPreference(preference);
                            }
                          }}
                          disabled={isSubmitting}
                          style={[
                            styles.prefCard,
                            selected && styles.prefCardSelected,
                          ]}
                          accessibilityRole="button"
                          accessibilityState={{ selected }}
                        >
                          <View style={styles.prefCopy}>
                            <Text
                              style={[
                                styles.prefLabel,
                                selected && styles.prefLabelSelected,
                              ]}
                            >
                              {copy.label}
                            </Text>
                            <Text style={styles.prefDescription}>
                              {copy.description}
                            </Text>
                          </View>
                          <View
                            style={[
                              styles.radioOuter,
                              selected && styles.radioOuterSelected,
                            ]}
                          >
                            {selected ? <View style={styles.radioInner} /> : null}
                          </View>
                        </Pressable>
                      );
                    })}
                  </View>
                </View>
              </>
            ) : null}
          </ScrollView>

          <View style={styles.bottomBar}>
            {selectionSummary ? (
              <Text style={styles.summaryText} numberOfLines={2}>
                {selectionSummary}
              </Text>
            ) : (
              <Text style={styles.summaryTextMuted}>
                Select a vehicle and preferences to continue
              </Text>
            )}
            <Pressable
              style={({ pressed }) => [
                styles.confirmButton,
                (pressed || isSubmitting) && styles.confirmButtonPressed,
                !canSubmit && styles.confirmButtonDisabled,
              ]}
              onPress={() => {
                void handleConfirm();
              }}
              disabled={!canSubmit}
              accessibilityRole="button"
              accessibilityLabel="Confirm queue booking"
            >
              {isSubmitting ? (
                <ActivityIndicator color={theme.colors.textInverse} />
              ) : (
                <Text style={styles.confirmButtonText}>Confirm booking</Text>
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
    backgroundColor: theme.colors.overlay,
  },
  sheetContainer: {
    backgroundColor: theme.colors.surface,
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    maxHeight: SCREEN_HEIGHT * 0.9,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: -3 },
    shadowOpacity: 0.12,
    shadowRadius: 10,
    elevation: 16,
  },
  handleContainer: {
    alignItems: 'center',
    paddingTop: 10,
    paddingBottom: 4,
  },
  handlePill: {
    width: 44,
    height: 4,
    borderRadius: 2,
    backgroundColor: '#cbd5e1',
  },
  headerBlock: {
    paddingHorizontal: theme.spacing.lg,
    paddingBottom: theme.spacing.md,
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: theme.colors.borderLight,
    gap: 4,
  },
  headerRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  headerTitle: {
    fontSize: 20,
    fontWeight: theme.typography.fontWeight.bold,
    color: theme.colors.textPrimary,
    letterSpacing: -0.3,
  },
  headerSubtitle: {
    fontSize: theme.typography.fontSize.sm,
    color: theme.colors.textMuted,
    lineHeight: 18,
    paddingRight: 36,
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
    gap: theme.spacing.lg,
  },
  section: {
    gap: theme.spacing.sm,
  },
  sectionTitle: {
    fontSize: theme.typography.fontSize.md,
    fontWeight: theme.typography.fontWeight.bold,
    color: theme.colors.textPrimary,
  },
  sectionHint: {
    fontSize: theme.typography.fontSize.sm,
    color: theme.colors.textMuted,
    marginTop: -4,
  },
  loadingBlock: {
    alignItems: 'center',
    justifyContent: 'center',
    gap: theme.spacing.sm,
    paddingVertical: theme.spacing.lg,
  },
  loadingLabel: {
    fontSize: theme.typography.fontSize.sm,
    color: theme.colors.textMuted,
  },
  emptyCard: {
    alignItems: 'flex-start',
    gap: theme.spacing.sm,
    padding: theme.spacing.md,
    borderRadius: theme.radius.lg,
    borderWidth: 1,
    borderColor: theme.colors.border,
    backgroundColor: '#f8fafc',
  },
  emptyIconWrap: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: theme.colors.brandMuted,
    alignItems: 'center',
    justifyContent: 'center',
  },
  emptyTitle: {
    fontSize: theme.typography.fontSize.md,
    fontWeight: theme.typography.fontWeight.semibold,
    color: theme.colors.textPrimary,
  },
  emptyText: {
    fontSize: theme.typography.fontSize.sm,
    color: theme.colors.textMuted,
    lineHeight: 18,
  },
  helperText: {
    fontSize: theme.typography.fontSize.sm,
    color: theme.colors.textMuted,
  },
  secondaryButton: {
    alignSelf: 'flex-start',
    paddingHorizontal: theme.spacing.md,
    paddingVertical: theme.spacing.sm,
    borderRadius: theme.radius.md,
    backgroundColor: theme.colors.brandMuted,
  },
  secondaryButtonText: {
    fontSize: theme.typography.fontSize.sm,
    fontWeight: theme.typography.fontWeight.semibold,
    color: theme.colors.brandDark,
  },
  vehicleList: {
    gap: theme.spacing.sm,
  },
  vehicleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: theme.spacing.sm,
    paddingHorizontal: theme.spacing.md,
    paddingVertical: 12,
    borderRadius: theme.radius.lg,
    borderWidth: 1.5,
    borderColor: theme.colors.border,
    backgroundColor: theme.colors.surface,
  },
  vehicleRowSelected: {
    borderColor: theme.colors.brand,
    backgroundColor: theme.colors.brandMuted,
  },
  vehicleIconWrap: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: '#f1f5f9',
    alignItems: 'center',
    justifyContent: 'center',
  },
  vehicleIconWrapSelected: {
    backgroundColor: theme.colors.surface,
  },
  vehicleCopy: {
    flex: 1,
    gap: 2,
  },
  vehicleTitleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  vehicleTitle: {
    flexShrink: 1,
    fontSize: theme.typography.fontSize.md,
    fontWeight: theme.typography.fontWeight.semibold,
    color: theme.colors.textPrimary,
  },
  vehicleTitleSelected: {
    color: theme.colors.brandDark,
  },
  defaultPill: {
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: theme.radius.pill,
    backgroundColor: theme.colors.surface,
  },
  defaultPillText: {
    fontSize: 10,
    fontWeight: theme.typography.fontWeight.semibold,
    color: theme.colors.brand,
  },
  vehicleSubtitle: {
    fontSize: theme.typography.fontSize.xs,
    color: theme.colors.textMuted,
  },
  radioOuter: {
    width: 20,
    height: 20,
    borderRadius: 10,
    borderWidth: 2,
    borderColor: '#cbd5e1',
    alignItems: 'center',
    justifyContent: 'center',
  },
  radioOuterSelected: {
    borderColor: theme.colors.brand,
  },
  radioInner: {
    width: 10,
    height: 10,
    borderRadius: 5,
    backgroundColor: theme.colors.brand,
  },
  optionGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: theme.spacing.sm,
  },
  optionCard: {
    minWidth: 88,
    paddingHorizontal: theme.spacing.md,
    paddingVertical: 12,
    borderRadius: theme.radius.md,
    borderWidth: 1.5,
    borderColor: theme.colors.border,
    backgroundColor: theme.colors.surface,
    alignItems: 'center',
  },
  optionCardSelected: {
    borderColor: theme.colors.brand,
    backgroundColor: theme.colors.brandMuted,
  },
  optionCardLabel: {
    fontSize: theme.typography.fontSize.sm,
    fontWeight: theme.typography.fontWeight.semibold,
    color: theme.colors.textPrimary,
  },
  optionCardLabelSelected: {
    color: theme.colors.brandDark,
  },
  prefList: {
    gap: theme.spacing.sm,
  },
  prefCard: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: theme.spacing.sm,
    paddingHorizontal: theme.spacing.md,
    paddingVertical: 12,
    borderRadius: theme.radius.lg,
    borderWidth: 1.5,
    borderColor: theme.colors.border,
    backgroundColor: theme.colors.surface,
  },
  prefCardSelected: {
    borderColor: theme.colors.brand,
    backgroundColor: theme.colors.brandMuted,
  },
  prefCopy: {
    flex: 1,
    gap: 2,
  },
  prefLabel: {
    fontSize: theme.typography.fontSize.md,
    fontWeight: theme.typography.fontWeight.semibold,
    color: theme.colors.textPrimary,
  },
  prefLabelSelected: {
    color: theme.colors.brandDark,
  },
  prefDescription: {
    fontSize: theme.typography.fontSize.xs,
    color: theme.colors.textMuted,
  },
  bottomBar: {
    paddingHorizontal: theme.spacing.lg,
    paddingTop: theme.spacing.sm,
    borderTopWidth: StyleSheet.hairlineWidth,
    borderTopColor: theme.colors.borderLight,
    gap: theme.spacing.sm,
  },
  summaryText: {
    fontSize: theme.typography.fontSize.sm,
    color: theme.colors.textSecondary,
    fontWeight: theme.typography.fontWeight.medium,
  },
  summaryTextMuted: {
    fontSize: theme.typography.fontSize.sm,
    color: theme.colors.textMuted,
  },
  confirmButton: {
    height: 52,
    borderRadius: theme.radius.md,
    backgroundColor: theme.colors.brand,
    alignItems: 'center',
    justifyContent: 'center',
  },
  confirmButtonPressed: {
    opacity: 0.85,
  },
  confirmButtonDisabled: {
    opacity: 0.45,
  },
  confirmButtonText: {
    fontSize: theme.typography.fontSize.md,
    fontWeight: theme.typography.fontWeight.bold,
    color: theme.colors.textInverse,
  },
});
