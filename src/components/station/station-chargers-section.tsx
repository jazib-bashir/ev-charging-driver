import { useMemo } from 'react';
import { Pressable, StyleSheet, View } from 'react-native';

import { SkeletonLoader } from '@/components/loaders/skeleton-loader';
import { Badge, type BadgeVariant } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Icon } from '@/components/ui/icon';
import { Surface } from '@/components/ui/surface';
import { Text } from '@/components/ui/text';
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

function badgeVariantFor(label: string, variant: 'available' | 'unavailable' | 'neutral'): BadgeVariant {
  if (variant === 'available') return 'available';
  const lower = label.toLowerCase();
  if (lower.includes('charg') || lower.includes('use')) return 'info';
  return variant === 'unavailable' ? 'unavailable' : 'neutral';
}

function EvseBayRow({
  bay,
  index,
  onViewCharger,
  styles,
}: {
  bay: StationEvseBay;
  index: number;
  onViewCharger: (charger: Charger) => void;
  styles: ReturnType<typeof createStyles>;
}) {
  const { theme } = useTheme();
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
      <View style={[styles.chargerIndex, isAvailable && styles.chargerIndexAvailable]}>
        <Text style={[styles.chargerIndexText, isAvailable && styles.chargerIndexTextAvailable]}>
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
        <Badge
          label={status.label}
          variant={badgeVariantFor(status.label, status.variant)}
          showDot
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
        <Surface variant="card" padding={16} style={styles.loadingContainer}>
          {[0, 1, 2].map((key) => (
            <View key={key} style={styles.skeletonRow}>
              <SkeletonLoader width={34} height={34} radius={11} />
              <View style={styles.skeletonCopy}>
                <SkeletonLoader width="55%" height={14} radius={7} />
                <SkeletonLoader width="38%" height={11} radius={6} />
              </View>
              <SkeletonLoader width={64} height={24} radius={12} />
            </View>
          ))}
        </Surface>
      ) : isError ? (
        <Surface variant="card" padding={20} style={styles.errorContainer}>
          <Text style={styles.errorTitle}>Unable to load chargers</Text>
          <Text style={styles.errorMessage}>Please check your connection and try again.</Text>
          <Button
            label="Retry"
            variant="secondary"
            size="sm"
            fullWidth={false}
            onPress={onRetry}
            accessibilityLabel="Retry loading chargers"
          />
        </Surface>
      ) : bays.length === 0 ? (
        <Surface variant="sunken" padding={20} style={styles.emptyContainer}>
          <Text style={styles.emptyText}>No chargers available</Text>
        </Surface>
      ) : (
        <Surface variant="card" padding={0} style={styles.groupCard}>
          {bays.map((bay, index) => (
            <View key={bay.evseId}>
              {index > 0 ? <View style={styles.rowDivider} /> : null}
              <EvseBayRow
                bay={bay}
                index={index}
                onViewCharger={onViewCharger}
                styles={styles}
              />
            </View>
          ))}
        </Surface>
      )}
    </View>
  );
}

function createStyles(theme: ReturnType<typeof useTheme>['theme']) {
  return StyleSheet.create({
    section: {
      paddingHorizontal: 20,
      paddingTop: 24,
      paddingBottom: theme.spacing.xxxl,
      gap: 12,
    },
    heading: {
      fontFamily: theme.typography.fontFamily.brand,
      fontSize: 16,
      lineHeight: 24,
      color: theme.colors.textPrimary,
      letterSpacing: -0.5,
    },
    loadingContainer: { gap: 16 },
    skeletonRow: { flexDirection: 'row', alignItems: 'center', gap: 12 },
    skeletonCopy: { flex: 1, gap: 8 },
    errorContainer: { gap: theme.spacing.xs, alignItems: 'center' },
    errorTitle: {
      fontFamily: theme.typography.fontFamily.brand,
      fontSize: theme.typography.fontSize.md,
      color: theme.colors.textPrimary,
      textAlign: 'center',
    },
    errorMessage: {
      fontFamily: theme.typography.fontFamily.regular,
      fontSize: theme.typography.fontSize.sm,
      color: theme.colors.textMuted,
      textAlign: 'center',
      marginBottom: theme.spacing.sm,
    },
    emptyContainer: { alignItems: 'center' },
    emptyText: {
      fontFamily: theme.typography.fontFamily.regular,
      fontSize: theme.typography.fontSize.md,
      color: theme.colors.textMuted,
      textAlign: 'center',
    },
    groupCard: { overflow: 'hidden' },
    chargerRow: {
      flexDirection: 'row',
      alignItems: 'center',
      paddingHorizontal: 16,
      paddingVertical: 14,
      gap: 12,
    },
    chargerRowUnavailable: { opacity: 0.8 },
    chargerRowPressed: { backgroundColor: theme.colors.surfaceSunken },
    rowDivider: {
      height: StyleSheet.hairlineWidth,
      backgroundColor: theme.colors.border,
      marginHorizontal: 16,
    },
    chargerIndex: {
      width: 36,
      height: 36,
      borderRadius: 12,
      alignItems: 'center',
      justifyContent: 'center',
      backgroundColor: theme.colors.surfaceSunken,
      flexShrink: 0,
    },
    chargerIndexAvailable: { backgroundColor: theme.colors.primarySoft },
    chargerIndexText: {
      fontFamily: theme.typography.fontFamily.brand,
      fontSize: 13,
      color: theme.colors.textSecondary,
    },
    chargerIndexTextAvailable: { color: theme.colors.primary },
    chargerCopy: { flex: 1, gap: 3, minWidth: 0 },
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
    chargerTrailing: { flexDirection: 'row', alignItems: 'center', gap: 6, flexShrink: 0 },
  });
}
