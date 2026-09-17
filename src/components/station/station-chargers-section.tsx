import { ActivityIndicator, Pressable, StyleSheet, Text, View } from 'react-native';

import { Icon } from '@/components/ui/icon';
import { theme } from '@/theme';
import type { Charger } from '@/types/charger';
import {
  formatChargerEstimate,
  formatChargerIndex,
  formatChargerPower,
  getChargerDisplayName,
  getChargerListMeta,
  getChargerListTitle,
  getChargerStatus,
  groupChargersByType,
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
}: {
  label: string;
  variant: 'available' | 'unavailable' | 'neutral';
}) {
  const isAvailable = variant === 'available';

  return (
    <View
      style={[
        styles.statusPill,
        isAvailable && styles.statusPillAvailable,
        variant === 'unavailable' && styles.statusPillUnavailable,
      ]}
    >
      <View
        style={[
          styles.statusDot,
          isAvailable && styles.statusDotAvailable,
          variant === 'unavailable' && styles.statusDotUnavailable,
        ]}
      />
      <Text
        style={[
          styles.statusPillText,
          isAvailable && styles.statusPillTextAvailable,
        ]}
        numberOfLines={1}
      >
        {label}
      </Text>
    </View>
  );
}

function ChargerRow({
  charger,
  index,
  onViewCharger,
}: {
  charger: Charger;
  index: number;
  onViewCharger: (charger: Charger) => void;
}) {
  const status = getChargerStatus(charger);
  const estimate = formatChargerEstimate(charger);
  const meta = getChargerListMeta(charger);
  const displayName = getChargerListTitle(charger);

  return (
    <Pressable
      onPress={() => onViewCharger(charger)}
      accessibilityRole="button"
      accessibilityLabel={`Charger details for ${displayName}`}
      style={({ pressed }) => [
        styles.chargerRow,
        status.variant === 'unavailable' && styles.chargerRowUnavailable,
        pressed && styles.chargerRowPressed,
      ]}
    >
      <View style={styles.chargerIndex}>
        <Text style={styles.chargerIndexText}>{formatChargerIndex(index)}</Text>
      </View>

      <View style={styles.chargerCopy}>
        <Text style={styles.chargerName} numberOfLines={2}>
          {displayName}
        </Text>
        {meta ? (
          <Text style={styles.chargerMeta} numberOfLines={2}>
            {meta}
          </Text>
        ) : null}
        {estimate ? <Text style={styles.estimateText}>{estimate}</Text> : null}
      </View>

      <View style={styles.chargerTrailing}>
        <StatusPill label={status.label} variant={status.variant} />
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
  const groups = groupChargersByType(chargers);
  let globalIndex = 0;

  return (
    <View style={styles.section}>
      <Text style={styles.heading}>Chargers ({chargers.length})</Text>

      {isLoading ? (
        <View style={styles.loadingContainer}>
          <ActivityIndicator color={theme.colors.brand} />
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
      ) : chargers.length === 0 ? (
        <View style={styles.emptyContainer}>
          <Text style={styles.emptyText}>No chargers available</Text>
        </View>
      ) : (
        <View style={styles.groups}>
          {groups.map((group) => {
            const groupStartIndex = globalIndex;
            globalIndex += group.chargers.length;

            return (
              <View key={group.key} style={styles.groupCard}>
                <View style={styles.groupHeader}>
                  <View style={styles.groupTitleRow}>
                    <Icon name="bolt" size={16} color={theme.colors.brand} />
                    <Text style={styles.groupTitle}>{group.label}</Text>
                  </View>
                  <View style={styles.powerBadge}>
                    <Text style={styles.powerBadgeText}>
                      {formatChargerPower(group.powerKw)}
                    </Text>
                  </View>
                </View>

                {group.chargers.map((charger, chargerIndex) => (
                  <View key={charger.id}>
                    {chargerIndex > 0 ? <View style={styles.rowDivider} /> : null}
                    <ChargerRow
                      charger={charger}
                      index={groupStartIndex + chargerIndex}
                      onViewCharger={onViewCharger}
                    />
                  </View>
                ))}
              </View>
            );
          })}
        </View>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  section: {
    paddingHorizontal: theme.spacing.lg,
    paddingTop: theme.spacing.xl,
    paddingBottom: theme.spacing.xxxl,
    gap: theme.spacing.md,
  },
  heading: {
    fontSize: theme.typography.fontSize.lg,
    fontWeight: theme.typography.fontWeight.bold,
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
    fontSize: theme.typography.fontSize.md,
    fontWeight: theme.typography.fontWeight.semibold,
    color: theme.colors.textPrimary,
    textAlign: 'center',
  },
  errorMessage: {
    fontSize: theme.typography.fontSize.sm,
    color: theme.colors.textMuted,
    textAlign: 'center',
  },
  retryButton: {
    marginTop: theme.spacing.sm,
    paddingHorizontal: theme.spacing.lg,
    paddingVertical: theme.spacing.sm,
    borderRadius: theme.radius.md,
    backgroundColor: theme.colors.brand,
  },
  retryButtonText: {
    fontSize: theme.typography.fontSize.sm,
    fontWeight: theme.typography.fontWeight.semibold,
    color: theme.colors.textInverse,
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
    fontSize: theme.typography.fontSize.md,
    color: theme.colors.textMuted,
    textAlign: 'center',
  },
  groups: {
    gap: theme.spacing.md,
  },
  groupCard: {
    backgroundColor: theme.colors.surface,
    borderRadius: theme.radius.lg,
    borderWidth: 1,
    borderColor: theme.colors.border,
    overflow: 'hidden',
    ...theme.shadows.card,
  },
  groupHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: theme.spacing.md,
    paddingVertical: theme.spacing.sm,
    backgroundColor: '#f3f5f9',
    gap: theme.spacing.sm,
  },
  groupTitleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: theme.spacing.xs,
    flex: 1,
  },
  groupTitle: {
    fontSize: theme.typography.fontSize.sm,
    fontWeight: theme.typography.fontWeight.semibold,
    color: theme.colors.textPrimary,
  },
  powerBadge: {
    paddingHorizontal: theme.spacing.sm,
    paddingVertical: 4,
    borderRadius: theme.radius.pill,
    backgroundColor: theme.colors.surface,
    borderWidth: 1,
    borderColor: theme.colors.border,
  },
  powerBadgeText: {
    fontSize: theme.typography.fontSize.xs,
    fontWeight: theme.typography.fontWeight.semibold,
    color: theme.colors.textSecondary,
  },
  chargerRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: theme.spacing.md,
    paddingVertical: theme.spacing.md,
    gap: theme.spacing.md,
  },
  chargerRowUnavailable: {
    opacity: 0.82,
  },
  chargerRowPressed: {
    backgroundColor: '#f8fafc',
  },
  rowDivider: {
    height: StyleSheet.hairlineWidth,
    backgroundColor: theme.colors.border,
    marginHorizontal: theme.spacing.md,
  },
  chargerIndex: {
    width: 34,
    height: 34,
    borderRadius: 17,
    borderWidth: 1,
    borderColor: theme.colors.border,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: theme.colors.surface,
    flexShrink: 0,
  },
  chargerIndexText: {
    fontSize: theme.typography.fontSize.sm,
    fontWeight: theme.typography.fontWeight.semibold,
    color: theme.colors.textSecondary,
  },
  chargerCopy: {
    flex: 1,
    gap: 4,
    minWidth: 0,
  },
  chargerName: {
    fontSize: theme.typography.fontSize.md,
    fontWeight: theme.typography.fontWeight.semibold,
    color: theme.colors.textPrimary,
    lineHeight: 20,
  },
  chargerMeta: {
    fontSize: theme.typography.fontSize.sm,
    color: theme.colors.textMuted,
    lineHeight: 18,
  },
  estimateText: {
    fontSize: theme.typography.fontSize.xs,
    color: theme.colors.textMuted,
  },
  chargerTrailing: {
    alignItems: 'flex-end',
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
    backgroundColor: '#f1f5f9',
    maxWidth: 108,
  },
  statusPillAvailable: {
    backgroundColor: theme.colors.brandMuted,
  },
  statusPillUnavailable: {
    backgroundColor: '#f1f5f9',
  },
  statusDot: {
    width: 6,
    height: 6,
    borderRadius: 3,
    backgroundColor: theme.colors.statusUnavailable,
  },
  statusDotAvailable: {
    backgroundColor: theme.colors.brand,
  },
  statusDotUnavailable: {
    backgroundColor: theme.colors.statusUnavailable,
  },
  statusPillText: {
    fontSize: 11,
    fontWeight: theme.typography.fontWeight.semibold,
    color: theme.colors.textMuted,
    flexShrink: 1,
  },
  statusPillTextAvailable: {
    color: theme.colors.brand,
  },
});
