import React, { useEffect, useMemo, useRef } from 'react';
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
import { useTheme } from '@/theme';
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
const SHEET_EDGE = 20;

type ChargerDetailsSheetProps = {
  visible: boolean;
  charger: Charger | null;
  stationName?: string;
  stationDefaultPricePerKwh?: number | null;
  stationCurrency?: string | null;
  onClose: () => void;
};

function DetailRow({
  label,
  value,
  styles,
}: {
  label: string;
  value: string;
  styles: ReturnType<typeof createStyles>;
}) {
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
  const { theme } = useTheme();
  const styles = useMemo(() => createStyles(theme), [theme]);
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
              paddingBottom: Math.max(insets.bottom, 16),
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
              <Icon name="close" size={16} color={theme.colors.textMuted} />
            </Pressable>
          </View>

          {charger ? (
            <ScrollView
              showsVerticalScrollIndicator={false}
              contentContainerStyle={styles.scrollContent}
            >
              <View style={styles.titleBlock}>
                <View style={styles.iconBadge}>
                  <Icon name="bolt" size={20} color={theme.colors.accent} />
                </View>
                <View style={styles.titleCopy}>
                  <Text style={styles.chargerName}>
                    {getChargerDisplayName(charger)}
                  </Text>
                  {stationName ? (
                    <Text style={styles.stationName} numberOfLines={2}>
                      {stationName}
                    </Text>
                  ) : null}
                </View>
              </View>

              {status ? (
                <View
                  style={[
                    styles.statusPill,
                    status.variant === 'available' && styles.statusPillAvailable,
                  ]}
                >
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
                <DetailRow
                  label="Type"
                  value={getChargerTypeLabel(charger)}
                  styles={styles}
                />
                <View style={styles.rowDivider} />
                <DetailRow
                  label="Power"
                  value={formatChargerPower(charger.maxPowerKw)}
                  styles={styles}
                />
                <View style={styles.rowDivider} />
                <DetailRow
                  label="Pricing"
                  value={formatDetailPricePerKwh(price, stationCurrency)}
                  styles={styles}
                />
                <View style={styles.rowDivider} />
                <DetailRow label="Connectors" value={connectors} styles={styles} />
                {manufacturerModel ? (
                  <>
                    <View style={styles.rowDivider} />
                    <DetailRow
                      label="Hardware"
                      value={manufacturerModel}
                      styles={styles}
                    />
                  </>
                ) : null}
                {hasValue(charger.serialNumber) &&
                charger.serialNumber !== getChargerDisplayName(charger) ? (
                  <>
                    <View style={styles.rowDivider} />
                    <DetailRow
                      label="Serial"
                      value={formatText(charger.serialNumber)}
                      styles={styles}
                    />
                  </>
                ) : null}
              </View>
            </ScrollView>
          ) : null}
        </Animated.View>
      </View>
    </Modal>
  );
}

function createStyles(theme: ReturnType<typeof useTheme>['theme']) {
  return StyleSheet.create({
    modalRoot: {
      flex: 1,
      justifyContent: 'flex-end',
    },
    backdrop: {
      ...StyleSheet.absoluteFill,
      backgroundColor: theme.colors.overlay,
    },
    sheetContainer: {
      backgroundColor: theme.colors.background,
      borderTopLeftRadius: 24,
      borderTopRightRadius: 24,
      maxHeight: SCREEN_HEIGHT * 0.82,
      ...theme.shadows.card,
      shadowColor: theme.colors.shadow,
      elevation: 16,
    },
    handleContainer: {
      alignItems: 'center',
      paddingTop: 10,
      paddingBottom: 4,
    },
    handlePill: {
      width: 40,
      height: 4,
      borderRadius: 2,
      backgroundColor: theme.colors.border,
    },
    headerRow: {
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'space-between',
      paddingHorizontal: SHEET_EDGE,
      paddingTop: 8,
      paddingBottom: 14,
      borderBottomWidth: StyleSheet.hairlineWidth,
      borderBottomColor: theme.colors.border,
    },
    headerTitle: {
      fontFamily: theme.typography.fontFamily.bold,
      fontSize: 17,
      lineHeight: 22,
      color: theme.colors.textPrimary,
      letterSpacing: -0.2,
    },
    closeButton: {
      width: 32,
      height: 32,
      borderRadius: 16,
      backgroundColor: theme.colors.iconBackground,
      borderWidth: 1,
      borderColor: theme.colors.border,
      alignItems: 'center',
      justifyContent: 'center',
    },
    scrollContent: {
      paddingHorizontal: SHEET_EDGE,
      paddingTop: 16,
      paddingBottom: 20,
      gap: 16,
    },
    titleBlock: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: 12,
    },
    iconBadge: {
      width: 48,
      height: 48,
      borderRadius: 14,
      backgroundColor: theme.colors.brandMuted,
      borderWidth: 1,
      borderColor: theme.colors.selectionBorder,
      alignItems: 'center',
      justifyContent: 'center',
    },
    titleCopy: {
      flex: 1,
      gap: 4,
      minWidth: 0,
    },
    chargerName: {
      fontFamily: theme.typography.fontFamily.bold,
      fontSize: 18,
      lineHeight: 24,
      color: theme.colors.textPrimary,
      letterSpacing: -0.2,
    },
    stationName: {
      fontFamily: theme.typography.fontFamily.regular,
      fontSize: 13,
      lineHeight: 19.5,
      color: theme.colors.textMuted,
    },
    statusPill: {
      alignSelf: 'flex-start',
      flexDirection: 'row',
      alignItems: 'center',
      gap: 6,
      paddingHorizontal: 10,
      paddingVertical: 6,
      borderRadius: theme.radius.pill,
      borderWidth: 1,
      borderColor: theme.colors.border,
      backgroundColor: theme.colors.iconBackground,
    },
    statusPillAvailable: {
      borderColor: theme.colors.statusAvailable,
      backgroundColor: theme.colors.statusAvailableBg,
    },
    statusDot: {
      width: 6,
      height: 6,
      borderRadius: 3,
      backgroundColor: theme.colors.statusUnavailable,
    },
    statusDotAvailable: {
      backgroundColor: theme.colors.statusAvailable,
    },
    statusDotUnavailable: {
      backgroundColor: theme.colors.statusUnavailable,
    },
    statusText: {
      fontFamily: theme.typography.fontFamily.semibold,
      fontSize: 13,
      lineHeight: 18,
      color: theme.colors.textMuted,
    },
    statusTextAvailable: {
      color: theme.colors.statusAvailable,
    },
    card: {
      borderRadius: 14,
      borderWidth: 1,
      borderColor: theme.colors.border,
      backgroundColor: theme.colors.surface,
      overflow: 'hidden',
    },
    detailRow: {
      flexDirection: 'row',
      alignItems: 'flex-start',
      justifyContent: 'space-between',
      gap: 16,
      paddingHorizontal: 16,
      paddingVertical: 14,
    },
    detailLabel: {
      fontFamily: theme.typography.fontFamily.regular,
      fontSize: 13,
      lineHeight: 19.5,
      color: theme.colors.textMuted,
    },
    detailValue: {
      flex: 1,
      textAlign: 'right',
      fontFamily: theme.typography.fontFamily.semibold,
      fontSize: 14,
      lineHeight: 20,
      color: theme.colors.textPrimary,
    },
    rowDivider: {
      height: StyleSheet.hairlineWidth,
      backgroundColor: theme.colors.border,
      marginHorizontal: 16,
    },
  });
}
