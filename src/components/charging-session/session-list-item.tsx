import { useMemo } from 'react';
import { Pressable, StyleSheet, View } from 'react-native';

import { Badge, type BadgeVariant } from '@/components/ui/badge';
import { Icon } from '@/components/ui/icon';
import { Text } from '@/components/ui/text';
import { useTheme } from '@/theme';
import type { ChargingSession, ChargingSessionStatus } from '@/types/charging-session';
import { formatChargingSessionStatus } from '@/types/charging-session';
import {
  EMPTY_METRIC,
  formatChargerPortMeta,
  formatCompactStationName,
  formatCurrencyAmount,
  formatDenseSessionMeta,
  formatEnergyKwh,
  hasMetricValue,
} from '@/utils/charging-session-format';

type SessionListItemProps = {
  session: ChargingSession;
  stationName?: string;
  evseLabel?: string;
  connectorLabel?: string;
  onPress: () => void;
};

function statusVariant(status: ChargingSessionStatus): BadgeVariant {
  switch (status) {
    case 'COMPLETED':
      return 'available';
    case 'CHARGING':
      return 'solid';
    case 'FAILED':
      return 'error';
    case 'STOPPED':
    case 'CANCELLED':
    default:
      return 'neutral';
  }
}

export function SessionListItem({
  session,
  stationName,
  evseLabel,
  connectorLabel,
  onPress,
}: SessionListItemProps) {
  const { theme } = useTheme();
  const styles = useMemo(() => createStyles(theme), [theme]);

  const title = formatCompactStationName(
    stationName ?? session.stationName ?? undefined,
  );
  const hasEnergy = hasMetricValue(session.energyKwh);
  const hasCost = hasMetricValue(session.totalCost);
  const isLive = session.status === 'CHARGING';
  const portMeta = formatChargerPortMeta(
    session.maxPowerKw,
    connectorLabel ?? session.connectorLabel,
    evseLabel ?? session.evseLabel,
  );

  return (
    <Pressable
      style={({ pressed }) => [
        styles.card,
        isLive && styles.cardLive,
        pressed && styles.cardPressed,
      ]}
      onPress={onPress}
      accessibilityRole="button"
      accessibilityLabel={`Open session at ${title}`}
    >
      <View style={[styles.iconWrap, isLive && styles.iconWrapLive]}>
        <Icon
          name="bolt"
          size={20}
          color={isLive ? theme.colors.onPrimary : theme.colors.primary}
        />
      </View>

      <View style={styles.body}>
        <View style={styles.topRow}>
          <Text style={styles.stationName} numberOfLines={1}>
            {title}
          </Text>
          <Badge
            label={formatChargingSessionStatus(session.status)}
            variant={statusVariant(session.status)}
            showDot={isLive}
          />
        </View>

        <Text style={styles.meta} numberOfLines={1}>
          {formatDenseSessionMeta(session.startedAt, session.durationSeconds)}
        </Text>

        <View style={styles.bottomRow}>
          <View style={styles.metrics}>
            <Text style={[styles.energy, !hasEnergy && styles.muted]}>
              {hasEnergy ? formatEnergyKwh(session.energyKwh) : EMPTY_METRIC}
            </Text>
            {portMeta ? (
              <Text style={styles.portMeta} numberOfLines={1}>
                {portMeta}
              </Text>
            ) : null}
          </View>
          {hasCost ? (
            <Text
              style={[
                styles.cost,
                session.status === 'COMPLETED' && styles.costHighlight,
              ]}
              numberOfLines={1}
            >
              {formatCurrencyAmount(session.totalCost)}
            </Text>
          ) : null}
        </View>
      </View>
    </Pressable>
  );
}

function createStyles(theme: ReturnType<typeof useTheme>['theme']) {
  return StyleSheet.create({
    card: {
      flexDirection: 'row',
      alignItems: 'flex-start',
      gap: 14,
      backgroundColor: theme.colors.surface,
      borderRadius: theme.radius.xl,
      padding: 16,
      marginBottom: 12,
      borderWidth: 1,
      borderColor: theme.colors.border,
      ...theme.shadows.card,
    },
    cardLive: {
      borderColor: theme.colors.primary,
    },
    cardPressed: {
      opacity: 0.92,
      transform: [{ scale: 0.99 }],
    },
    iconWrap: {
      width: 44,
      height: 44,
      borderRadius: 14,
      alignItems: 'center',
      justifyContent: 'center',
      backgroundColor: theme.colors.primaryMuted,
    },
    iconWrapLive: {
      backgroundColor: theme.colors.primary,
    },
    body: {
      flex: 1,
      minWidth: 0,
      gap: 4,
    },
    topRow: {
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'space-between',
      gap: 8,
    },
    stationName: {
      flex: 1,
      fontFamily: theme.typography.fontFamily.brandSemiBold,
      fontSize: 16,
      letterSpacing: -0.2,
      color: theme.colors.textPrimary,
    },
    meta: {
      fontFamily: theme.typography.fontFamily.regular,
      fontSize: 12,
      color: theme.colors.textSecondary,
    },
    bottomRow: {
      flexDirection: 'row',
      alignItems: 'flex-end',
      justifyContent: 'space-between',
      gap: 8,
      marginTop: 8,
      paddingTop: 10,
      borderTopWidth: StyleSheet.hairlineWidth,
      borderTopColor: theme.colors.border,
    },
    metrics: {
      flex: 1,
      minWidth: 0,
      gap: 2,
    },
    energy: {
      fontFamily: theme.typography.fontFamily.brandSemiBold,
      fontSize: 15,
      color: theme.colors.textPrimary,
    },
    portMeta: {
      fontFamily: theme.typography.fontFamily.regular,
      fontSize: 12,
      color: theme.colors.textMuted,
    },
    cost: {
      fontFamily: theme.typography.fontFamily.brand,
      fontSize: 16,
      color: theme.colors.textPrimary,
    },
    costHighlight: {
      color: theme.colors.primary,
    },
    muted: {
      color: theme.colors.textMuted,
    },
  });
}
