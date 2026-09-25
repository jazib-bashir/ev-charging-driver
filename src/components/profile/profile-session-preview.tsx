import { useMemo } from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';

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

type ProfileSessionPreviewProps = {
  session: ChargingSession;
  stationName?: string;
  index: number;
  onPress: () => void;
};

function statusBadgeColors(
  status: ChargingSessionStatus,
  theme: ReturnType<typeof useTheme>['theme'],
) {
  switch (status) {
    case 'COMPLETED':
      return {
        bg: 'rgba(0, 217, 160, 0.12)',
        text: theme.isDark ? theme.colors.statusAvailable : '#00A67A',
      };
    case 'CHARGING':
      return {
        bg: 'rgba(0, 217, 160, 0.12)',
        text: theme.colors.accent,
      };
    case 'STOPPED':
    case 'CANCELLED':
    case 'FAILED':
    default:
      return theme.isDark
        ? {
            bg: 'rgba(238, 244, 255, 0.06)',
            text: theme.colors.textSecondary,
          }
        : {
            bg: '#F1F5F9',
            text: '#64748B',
          };
  }
}

export function ProfileSessionPreview({
  session,
  stationName,
  onPress,
}: ProfileSessionPreviewProps) {
  const { theme } = useTheme();
  const styles = useMemo(() => createStyles(theme), [theme]);
  const badge = statusBadgeColors(session.status, theme);

  const title = formatCompactStationName(
    stationName ?? session.stationName ?? undefined,
  );
  const hasEnergy = hasMetricValue(session.energyKwh);
  const hasCost = hasMetricValue(session.totalCost);
  const costIsHighlight = session.status === 'COMPLETED' && hasCost;
  const portMeta = formatChargerPortMeta(
    session.maxPowerKw,
    session.connectorLabel,
    session.evseLabel,
  );

  return (
    <Pressable
      style={({ pressed }) => [styles.card, pressed && styles.cardPressed]}
      onPress={onPress}
      accessibilityRole="button"
      accessibilityLabel={`Open session at ${title}`}
    >
      <View style={styles.colLocation}>
        <Text style={styles.stationName} numberOfLines={1}>
          {title}
        </Text>
        <Text style={styles.meta} numberOfLines={1}>
          {formatDenseSessionMeta(session.startedAt, session.durationSeconds)}
        </Text>
      </View>

      <View style={styles.colEnergy}>
        <Text
          style={[styles.energy, !hasEnergy && styles.mutedValue]}
          numberOfLines={1}
        >
          {hasEnergy ? formatEnergyKwh(session.energyKwh) : EMPTY_METRIC}
        </Text>
        {portMeta ? (
          <Text style={styles.portMeta} numberOfLines={1}>
            {portMeta}
          </Text>
        ) : null}
      </View>

      <View style={styles.colStatus}>
        {hasCost ? (
          <Text
            style={[styles.cost, costIsHighlight && styles.costHighlight]}
            numberOfLines={1}
          >
            {formatCurrencyAmount(session.totalCost)}
          </Text>
        ) : null}
        <View
          style={[
            styles.badge,
            { backgroundColor: badge.bg },
            !hasCost && styles.badgeSolo,
          ]}
        >
          <Text style={[styles.badgeLabel, { color: badge.text }]}>
            {formatChargingSessionStatus(session.status)}
          </Text>
        </View>
      </View>
    </Pressable>
  );
}

function createStyles(theme: ReturnType<typeof useTheme>['theme']) {
  return StyleSheet.create({
    card: {
      flexDirection: 'row',
      alignItems: 'center',
      backgroundColor: theme.colors.surface,
      borderRadius: 14,
      padding: 12,
      marginBottom: 12,
      borderWidth: 1,
      borderColor: theme.colors.border,
      ...theme.shadows.card,
      shadowColor: theme.colors.shadow,
    },
    cardPressed: {
      opacity: 0.94,
    },
    colLocation: {
      flex: 4,
      alignItems: 'flex-start',
      minWidth: 0,
      paddingRight: 8,
    },
    colEnergy: {
      flex: 3.5,
      alignItems: 'center',
      minWidth: 0,
      paddingHorizontal: 4,
    },
    colStatus: {
      flex: 2.5,
      alignItems: 'flex-end',
      minWidth: 0,
      paddingLeft: 4,
    },
    stationName: {
      fontFamily: theme.typography.fontFamily.brandSemiBold,
      fontSize: 14,
      color: theme.colors.textPrimary,
    },
    meta: {
      fontFamily: theme.typography.fontFamily.regular,
      fontSize: 11,
      color: theme.colors.textSecondary,
      marginTop: 4,
    },
    energy: {
      fontFamily: theme.typography.fontFamily.brandSemiBold,
      fontSize: 13,
      color: theme.colors.textPrimary,
      textAlign: 'center',
    },
    portMeta: {
      fontFamily: theme.typography.fontFamily.regular,
      fontSize: 11,
      color: theme.colors.textSecondary,
      marginTop: 4,
      textAlign: 'center',
    },
    cost: {
      fontFamily: theme.typography.fontFamily.brand,
      fontSize: 14,
      color: theme.colors.textPrimary,
      textAlign: 'right',
    },
    costHighlight: {
      color: theme.colors.statusAvailable,
    },
    mutedValue: {
      color: theme.colors.textMuted,
    },
    badge: {
      paddingHorizontal: 8,
      paddingVertical: 3,
      borderRadius: 6,
      marginTop: 6,
    },
    badgeSolo: {
      marginTop: 0,
    },
    badgeLabel: {
      fontFamily: theme.typography.fontFamily.semibold,
      fontSize: 10,
      fontWeight: '600',
    },
  });
}
