import { useMemo } from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';

import { Icon } from '@/components/ui/icon';
import { useTheme } from '@/theme';
import type { ChargingSession } from '@/types/charging-session';
import {
  formatEnergyKwh,
  formatRecentSessionMeta,
  formatCurrencyAmount,
  hasMetricValue,
} from '@/utils/charging-session-format';

type ProfileSessionPreviewProps = {
  session: ChargingSession;
  stationName?: string;
  index: number;
  onPress: () => void;
};

export function ProfileSessionPreview({
  session,
  stationName,
  index,
  onPress,
}: ProfileSessionPreviewProps) {
  const { theme } = useTheme();
  const styles = useMemo(() => createStyles(theme), [theme]);
  const title = stationName ?? session.stationName ?? 'Charging session';
  const hasEnergy = hasMetricValue(session.energyKwh);
  const hasCost = hasMetricValue(session.totalCost);
  const iconColors = [theme.colors.brand, theme.colors.accent] as const;
  const iconColor = iconColors[index % iconColors.length];

  return (
    <Pressable
      style={({ pressed }) => [styles.row, pressed && styles.rowPressed]}
      onPress={onPress}
      accessibilityRole="button"
      accessibilityLabel={`Open session at ${title}`}
    >
      <View style={[styles.iconWrap, { backgroundColor: `${iconColor}16` }]}>
        <Icon name="bolt" size={18} color={iconColor} />
      </View>

      <View style={styles.copy}>
        <Text style={styles.stationName} numberOfLines={1}>
          {title}
        </Text>
        <Text style={styles.meta} numberOfLines={1}>
          {formatRecentSessionMeta(session.startedAt, session.durationSeconds)}
        </Text>
      </View>

      {hasEnergy || hasCost ? (
        <View style={styles.metrics}>
          {hasEnergy ? (
            <Text style={styles.energy}>{formatEnergyKwh(session.energyKwh)}</Text>
          ) : null}
          {hasCost ? (
            <Text style={styles.cost}>{formatCurrencyAmount(session.totalCost)}</Text>
          ) : null}
        </View>
      ) : null}

      <Icon name="chevron-forward" size={16} color={theme.colors.textMuted} />
    </Pressable>
  );
}

function createStyles(theme: ReturnType<typeof useTheme>['theme']) {
  return StyleSheet.create({
    row: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: theme.spacing.md,
      paddingVertical: theme.spacing.md,
    },
    rowPressed: {
      opacity: 0.92,
    },
    iconWrap: {
      width: 42,
      height: 42,
      borderRadius: theme.radius.md,
      alignItems: 'center',
      justifyContent: 'center',
    },
    copy: {
      flex: 1,
      gap: 3,
      minWidth: 0,
    },
    stationName: {
      fontSize: theme.typography.fontSize.md,
      fontWeight: theme.typography.fontWeight.bold,
      color: theme.colors.textPrimary,
      letterSpacing: -0.1,
    },
    meta: {
      fontSize: theme.typography.fontSize.sm,
      color: theme.colors.textMuted,
      lineHeight: theme.typography.lineHeight.tight,
    },
    metrics: {
      alignItems: 'flex-end',
      gap: 2,
      minWidth: 56,
    },
    energy: {
      fontSize: theme.typography.fontSize.sm,
      fontWeight: theme.typography.fontWeight.semibold,
      color: theme.colors.textPrimary,
    },
    cost: {
      fontSize: theme.typography.fontSize.sm,
      fontWeight: theme.typography.fontWeight.semibold,
      color: theme.colors.brand,
    },
  });
}
