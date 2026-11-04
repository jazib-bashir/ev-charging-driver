import { useMemo } from 'react';
import { ActivityIndicator, Pressable, StyleSheet, Text, View } from 'react-native';

import { Icon } from '@/components/ui/icon';
import { useTheme } from '@/theme';
import type { Charger } from '@/types/charger';
import {
  flattenStationEvseBays,
  formatChargerIndex,
  formatChargerPower,
  getEvseBayConnectorSummary,
  getEvseBayStatus,
  type StationEvseBay,
} from '@/utils/charger';

type StationChargersSectionProps = {
  chargers: Charger[];
  isLoading: boolean;
  isError: boolean;
  onRetry: () => void;
  onViewCharger: (charger: Charger) => void;
};

function StatusPill({
  label,
  variant,
  styles,
  theme,
}: {
  label: string;
  variant: 'available' | 'unavailable' | 'neutral';
  styles: ReturnType<typeof createStyles>;
  theme: ReturnType<typeof useTheme>['theme'];
}) {
  const isAvailable = variant === 'available';
  const isCharging = label.toLowerCase().includes('charg') || label.toLowerCase().includes('use');

  return (
    <View
      style={[
        styles.statusPill,
        isAvailable && styles.statusPillAvailable,
        isCharging && styles.statusPillCharging,
        variant === 'unavailable' && styles.statusPillUnavailable,
      ]}
    >
      <View
        style={[
          styles.statusDot,
          isAvailable && styles.statusDotAvailable,
          isCharging && { backgroundColor: theme.colors.brandLight },
          variant === 'unavailable' && styles.statusDotUnavailable,
        ]}
      />
      <Text
        style={[
          styles.statusPillText,
          isAvailable && styles.statusPillTextAvailable,
          isCharging && { color: theme.colors.brandLight },
        ]}
        numberOfLines={1}
      >
        {label}
      </Text>
    </View>
  );
}

function EvseBayRow({
  bay,
  index,
  onViewCharger,
  styles,
  theme,
}: {
  bay: StationEvseBay;
  index: number;
  onViewCharger: (charger: Charger) => void;
  styles: ReturnType<typeof createStyles>;
  theme: ReturnType<typeof useTheme>['theme'];
}) {
  const status = getEvseBayStatus(bay);
  const connectors = getEvseBayConnectorSummary(bay);
  const power = formatChargerPower(bay.maxPowerKw);
  const isAvailable = status.variant === 'available';
  const meta = [connectors, power !== '-' ? power : null].filter(Boolean).join(' · ');

  return (
    <Pressable
      onPress={() => onViewCharger(bay.charger)}
      accessibilityRole="button"
      accessibilityLabel={`${bay.chargerName}${meta ? `, ${meta}` : ''}`}
      style={({ pressed }) => [
        styles.chargerRow,
        status.variant === 'unavailable' && styles.chargerRowUnavailable,
        pressed && styles.chargerRowPressed,
      ]}
    >
      <View
        style={[
          styles.chargerIndex,
          isAvailable && styles.chargerIndexAvailable,
        ]}
      >
        <Text
          style={[
            styles.chargerIndexText,
            isAvailable && styles.chargerIndexTextAvailable,
          ]}
        >
          {formatChargerIndex(index)}
        </Text>
      </View>

      <View style={styles.chargerCopy}>
        <Text style={styles.chargerName} numberOfLines={1}>
          {bay.chargerName}
        </Text>
        {meta ? (
          <Text style={styles.chargerMeta} numberOfLines={2}>
            {meta}
          </Text>
        ) : null}
      </View>

      <View style={styles.chargerTrailing}>
        <StatusPill
          label={status.label}
          variant={status.variant}
          styles={styles}
          theme={theme}
        />
        <Icon name="chevron-forward" size={16} color={theme.colors.textMuted} />
      </View>
    </Pressable>
  );
}

export function StationChargersSection({
  chargers,
  isLoading,
  isError,
  onRetry,
  onViewCharger,
}: StationChargersSectionProps) {
  const { theme } = useTheme();
  const styles = useMemo(() => createStyles(theme), [theme]);
  const bays = useMemo(() => flattenStationEvseBays(chargers), [chargers]);

  return (
    <View style={styles.section}>
      <Text style={styles.heading}>Chargers ({bays.length})</Text>

      {isLoading ? (
        <View style={styles.loadingContainer}>
          <ActivityIndicator color={theme.colors.accent} />
        </View>
      ) : isError ? (
        <View style={styles.errorContainer}>
          <Text style={styles.errorTitle}>Unable to load chargers</Text>
          <Text style={styles.errorMessage}>
            Please check your connection and try again.
          </Text>
          <Pressable
            style={styles.retryButton}
            onPress={onRetry}
            accessibilityRole="button"
            accessibilityLabel="Retry loading chargers"
          >
            <Text style={styles.retryButtonText}>Retry</Text>
          </Pressable>
        </View>
      ) : bays.length === 0 ? (
        <View style={styles.emptyContainer}>
          <Text style={styles.emptyText}>No chargers available</Text>
        </View>
      ) : (
        <View style={styles.groupCard}>
          {bays.map((bay, index) => (
            <View key={bay.evseId}>
              {index > 0 ? <View style={styles.rowDivider} /> : null}
              <EvseBayRow
                bay={bay}
                index={index}
                onViewCharger={onViewCharger}
                styles={styles}
                theme={theme}
              />
            </View>
          ))}
        </View>
      )}
    </View>
  );
}

function createStyles(theme: ReturnType<typeof useTheme>['theme']) {
  return StyleSheet.create({
    section: {
      paddingHorizontal: 20,
      paddingTop: 20,
      paddingBottom: theme.spacing.xxxl,
      gap: 12,
    },
    heading: {
      fontFamily: theme.typography.fontFamily.bold,
      fontSize: 17,
      lineHeight: 22,
      color: theme.colors.textPrimary,
      letterSpacing: -0.2,
    },
    loadingContainer: {
      paddingVertical: theme.spacing.xl,
      alignItems: 'center',
    },
    errorContainer: {
      backgroundColor: theme.colors.surface,
      borderRadius: theme.radius.lg,
      borderWidth: 1,
      borderColor: theme.colors.border,
      padding: theme.spacing.lg,
      gap: theme.spacing.xs,
      alignItems: 'center',
    },
    errorTitle: {
      fontFamily: theme.typography.fontFamily.semibold,
      fontSize: theme.typography.fontSize.md,
      color: theme.colors.textPrimary,
      textAlign: 'center',
    },
    errorMessage: {
      fontFamily: theme.typography.fontFamily.regular,
      fontSize: theme.typography.fontSize.sm,
      color: theme.colors.textMuted,
      textAlign: 'center',
    },
    retryButton: {
      marginTop: theme.spacing.sm,
      paddingHorizontal: theme.spacing.lg,
      paddingVertical: theme.spacing.sm,
      borderRadius: theme.radius.md,
      backgroundColor: theme.colors.accent,
    },
    retryButtonText: {
      fontFamily: theme.typography.fontFamily.semibold,
      fontSize: theme.typography.fontSize.sm,
      color: '#0F172A',
    },
    emptyContainer: {
      backgroundColor: theme.colors.surface,
      borderRadius: theme.radius.lg,
      borderWidth: 1,
      borderColor: theme.colors.border,
      padding: theme.spacing.lg,
      alignItems: 'center',
    },
    emptyText: {
      fontFamily: theme.typography.fontFamily.regular,
      fontSize: theme.typography.fontSize.md,
      color: theme.colors.textMuted,
      textAlign: 'center',
    },
    groupCard: {
      backgroundColor: theme.colors.surface,
      borderRadius: theme.radius.lg,
      borderWidth: 1,
      borderColor: theme.colors.border,
      overflow: 'hidden',
    },
    chargerRow: {
      flexDirection: 'row',
      alignItems: 'center',
      paddingHorizontal: 14,
      paddingVertical: 14,
      gap: 12,
    },
    chargerRowUnavailable: {
      opacity: 0.82,
    },
    chargerRowPressed: {
      backgroundColor: theme.colors.iconBackground,
    },
    rowDivider: {
      height: StyleSheet.hairlineWidth,
      backgroundColor: theme.colors.border,
      marginHorizontal: 14,
    },
    chargerIndex: {
      width: 34,
      height: 34,
      borderRadius: 10,
      borderWidth: 1,
      borderColor: theme.colors.border,
      alignItems: 'center',
      justifyContent: 'center',
      backgroundColor: theme.colors.iconBackground,
      flexShrink: 0,
    },
    chargerIndexAvailable: {
      borderColor: theme.colors.selectionBorder,
      backgroundColor: theme.colors.brandMuted,
    },
    chargerIndexText: {
      fontFamily: theme.typography.fontFamily.semibold,
      fontSize: 12,
      color: theme.colors.textSecondary,
    },
    chargerIndexTextAvailable: {
      color: theme.colors.accent,
    },
    chargerCopy: {
      flex: 1,
      gap: 4,
      minWidth: 0,
    },
    chargerName: {
      fontFamily: theme.typography.fontFamily.semibold,
      fontSize: 15,
      lineHeight: 20,
      color: theme.colors.textPrimary,
    },
    chargerMeta: {
      fontFamily: theme.typography.fontFamily.regular,
      fontSize: 13,
      lineHeight: 18,
      color: theme.colors.textMuted,
    },
    chargerTrailing: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: 6,
      flexShrink: 0,
    },
    statusPill: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: 5,
      paddingHorizontal: 8,
      paddingVertical: 4,
      borderRadius: theme.radius.pill,
      backgroundColor: theme.colors.iconBackground,
      maxWidth: 108,
    },
    statusPillAvailable: {
      backgroundColor: theme.colors.statusAvailableBg,
    },
    statusPillCharging: {
      backgroundColor: theme.colors.brandMuted,
    },
    statusPillUnavailable: {
      backgroundColor: theme.colors.iconBackground,
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
    statusPillText: {
      fontFamily: theme.typography.fontFamily.semibold,
      fontSize: 11,
      lineHeight: 16,
      color: theme.colors.textMuted,
      flexShrink: 1,
    },
    statusPillTextAvailable: {
      color: theme.colors.statusAvailable,
    },
  });
}
