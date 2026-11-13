import { useMemo } from 'react';
import { ScrollView, StyleSheet, View } from 'react-native';

import { Badge } from '@/components/ui/badge';
import { BottomSheet } from '@/components/ui/bottom-sheet';
import { IconBadge } from '@/components/ui/icon-badge';
import { Text } from '@/components/ui/text';
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

  const status = charger ? getChargerStatus(charger) : null;
  const price =
    charger?.effectivePricePerKwh ?? charger?.pricePerKwh ?? stationDefaultPricePerKwh ?? null;
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
    <BottomSheet visible={visible} onClose={onClose} title="Charger details">
      {charger ? (
        <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={styles.scrollContent}>
          <View style={styles.titleBlock}>
            <IconBadge name="bolt" tone="primary" size={52} />
            <View style={styles.titleCopy}>
              <Text style={styles.chargerName}>{getChargerDisplayName(charger)}</Text>
              {stationName ? (
                <Text style={styles.stationName} numberOfLines={2}>
                  {stationName}
                </Text>
              ) : null}
            </View>
            {status ? (
              <Badge
                label={status.label}
                variant={status.variant === 'available' ? 'available' : 'unavailable'}
                showDot
              />
            ) : null}
          </View>

          <View style={styles.card}>
            <DetailRow label="Type" value={getChargerTypeLabel(charger)} styles={styles} />
            <View style={styles.rowDivider} />
            <DetailRow label="Power" value={formatChargerPower(charger.maxPowerKw)} styles={styles} />
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
                <DetailRow label="Hardware" value={manufacturerModel} styles={styles} />
              </>
            ) : null}
            {hasValue(charger.serialNumber) &&
            charger.serialNumber !== getChargerDisplayName(charger) ? (
              <>
                <View style={styles.rowDivider} />
                <DetailRow label="Serial" value={formatText(charger.serialNumber)} styles={styles} />
              </>
            ) : null}
          </View>
        </ScrollView>
      ) : null}
    </BottomSheet>
  );
}

function createStyles(theme: ReturnType<typeof useTheme>['theme']) {
  return StyleSheet.create({
    scrollContent: { paddingBottom: theme.spacing.md, gap: 16 },
    titleBlock: { flexDirection: 'row', alignItems: 'center', gap: 12 },
    titleCopy: { flex: 1, gap: 4, minWidth: 0 },
    chargerName: {
      fontFamily: theme.typography.fontFamily.brand,
      fontSize: 18,
      lineHeight: 24,
      color: theme.colors.textPrimary,
      letterSpacing: -0.4,
    },
    stationName: {
      fontFamily: theme.typography.fontFamily.regular,
      fontSize: 13,
      lineHeight: 19,
      color: theme.colors.textMuted,
    },
    card: {
      borderRadius: theme.radius.xl,
      backgroundColor: theme.colors.surfaceSunken,
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
      lineHeight: 20,
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
