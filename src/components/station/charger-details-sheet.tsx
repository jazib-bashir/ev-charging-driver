import React, { useEffect, useRef } from 'react';
import {
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

import { Icon } from '@/components/ui/icon';
import { theme } from '@/theme';
import type { Charger } from '@/types/charger';
import {
  formatChargerPower,
  formatDetailPricePerKwh,
  getChargerDisplayName,
  getChargerStatus,
  getChargerTypeLabel,
} from '@/utils/charger';
import { formatText, hasValue } from '@/utils/station';

const { height: SCREEN_HEIGHT } = Dimensions.get('window');

type ChargerDetailsSheetProps = {
  visible: boolean;
  charger: Charger | null;
  stationName?: string;
  stationDefaultPricePerKwh?: number | null;
  stationCurrency?: string | null;
  onClose: () => void;
};

function DetailRow({ label, value }: { label: string; value: string }) {
  return (
    <View style={styles.detailRow}>
      <Text style={styles.detailLabel}>{label}</Text>
      <Text style={styles.detailValue}>{value}</Text>
    </View>
  );
}

export function ChargerDetailsSheet({
  visible,
  charger,
  stationName,
  stationDefaultPricePerKwh,
  stationCurrency,
  onClose,
}: ChargerDetailsSheetProps) {
  const insets = useSafeAreaInsets();
  const slideAnim = useRef(new Animated.Value(SCREEN_HEIGHT)).current;
  const fadeAnim = useRef(new Animated.Value(0)).current;

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
  }, [visible, fadeAnim, slideAnim]);

  const status = charger ? getChargerStatus(charger) : null;
  const price =
    charger?.effectivePricePerKwh ??
    charger?.pricePerKwh ??
    stationDefaultPricePerKwh ??
    null;
  const connectors =
    charger?.connectors
      ?.map((connector) =>
        hasValue(connector.displayName)
          ? String(connector.displayName)
          : formatText(connector.connectorType),
      )
      .filter(Boolean)
      .join(', ') || '—';

  const manufacturerModel = [charger?.manufacturer, charger?.model]
    .filter((value) => hasValue(value))
    .join(' · ');

  return (
    <Modal transparent visible={visible} animationType="none" onRequestClose={onClose}>
      <View style={styles.modalRoot}>
        <TouchableWithoutFeedback onPress={onClose}>
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

          <View style={styles.headerRow}>
            <Text style={styles.headerTitle}>Charger details</Text>
            <Pressable
              onPress={onClose}
              hitSlop={8}
              accessibilityRole="button"
              accessibilityLabel="Close charger details"
              style={styles.closeButton}
            >
              <Icon name="close" size={16} color="#64748b" />
            </Pressable>
          </View>

          {charger ? (
            <>
              <ScrollView
                showsVerticalScrollIndicator={false}
                contentContainerStyle={styles.scrollContent}
              >
                <View style={styles.titleBlock}>
                  <View style={styles.iconBadge}>
                    <Icon name="bolt" size={20} color={theme.colors.brand} />
                  </View>
                  <View style={styles.titleCopy}>
                    <Text style={styles.chargerName}>{getChargerDisplayName(charger)}</Text>
                    {stationName ? (
                      <Text style={styles.stationName} numberOfLines={2}>
                        {stationName}
                      </Text>
                    ) : null}
                  </View>
                </View>

                {status ? (
                  <View style={styles.statusPill}>
                    <View
                      style={[
                        styles.statusDot,
                        status.variant === 'available' && styles.statusDotAvailable,
                        status.variant === 'unavailable' && styles.statusDotUnavailable,
                      ]}
                    />
                    <Text
                      style={[
                        styles.statusText,
                        status.variant === 'available' && styles.statusTextAvailable,
                      ]}
                    >
                      {status.label}
                    </Text>
                  </View>
                ) : null}

                <View style={styles.card}>
                  <DetailRow label="Type" value={getChargerTypeLabel(charger)} />
                  <View style={styles.rowDivider} />
                  <DetailRow
                    label="Power"
                    value={formatChargerPower(charger.maxPowerKw)}
                  />
                  <View style={styles.rowDivider} />
                  <DetailRow
                    label="Pricing"
                    value={formatDetailPricePerKwh(price, stationCurrency)}
                  />
                  <View style={styles.rowDivider} />
                  <DetailRow label="Connectors" value={connectors} />
                  {manufacturerModel ? (
                    <>
                      <View style={styles.rowDivider} />
                      <DetailRow label="Hardware" value={manufacturerModel} />
                    </>
                  ) : null}
                  {hasValue(charger.serialNumber) &&
                  charger.serialNumber !== getChargerDisplayName(charger) ? (
                    <>
                      <View style={styles.rowDivider} />
                      <DetailRow label="Serial" value={formatText(charger.serialNumber)} />
                    </>
                  ) : null}
                </View>
              </ScrollView>
            </>
          ) : null}
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
    borderBottomColor: theme.colors.borderLight,
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
    gap: theme.spacing.md,
  },
  titleBlock: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: theme.spacing.md,
  },
  iconBadge: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: theme.colors.brandMuted,
    alignItems: 'center',
    justifyContent: 'center',
  },
  titleCopy: {
    flex: 1,
    gap: 2,
  },
  chargerName: {
    fontSize: theme.typography.fontSize.lg,
    fontWeight: theme.typography.fontWeight.bold,
    color: theme.colors.textPrimary,
  },
  stationName: {
    fontSize: theme.typography.fontSize.sm,
    color: theme.colors.textMuted,
  },
  statusPill: {
    alignSelf: 'flex-start',
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    paddingHorizontal: theme.spacing.sm,
    paddingVertical: 6,
    borderRadius: theme.radius.pill,
    backgroundColor: theme.colors.brandMuted,
  },
  statusDot: {
    width: 7,
    height: 7,
    borderRadius: 4,
    backgroundColor: theme.colors.statusUnavailable,
  },
  statusDotAvailable: {
    backgroundColor: theme.colors.brand,
  },
  statusDotUnavailable: {
    backgroundColor: theme.colors.statusUnavailable,
  },
  statusText: {
    fontSize: theme.typography.fontSize.sm,
    color: theme.colors.textMuted,
    fontWeight: theme.typography.fontWeight.medium,
  },
  statusTextAvailable: {
    color: theme.colors.brand,
  },
  card: {
    borderRadius: theme.radius.lg,
    borderWidth: 1,
    borderColor: theme.colors.border,
    backgroundColor: theme.colors.surface,
    overflow: 'hidden',
  },
  detailRow: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    justifyContent: 'space-between',
    gap: theme.spacing.md,
    paddingHorizontal: theme.spacing.md,
    paddingVertical: theme.spacing.md,
  },
  detailLabel: {
    fontSize: theme.typography.fontSize.sm,
    color: theme.colors.textMuted,
    fontWeight: theme.typography.fontWeight.medium,
  },
  detailValue: {
    flex: 1,
    textAlign: 'right',
    fontSize: theme.typography.fontSize.sm,
    color: theme.colors.textPrimary,
    fontWeight: theme.typography.fontWeight.semibold,
  },
  rowDivider: {
    height: StyleSheet.hairlineWidth,
    backgroundColor: theme.colors.border,
    marginHorizontal: theme.spacing.md,
  },
});
