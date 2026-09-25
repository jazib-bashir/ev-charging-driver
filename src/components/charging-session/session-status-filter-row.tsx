import { useMemo } from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';

import { useTheme } from '@/theme';
import type { ChargingSessionStatus } from '@/types/charging-session';
import {
  CHARGING_SESSION_STATUS_FILTERS,
  formatChargingSessionStatus,
} from '@/types/charging-session';

type SessionStatusFilterRowProps = {
  activeStatus?: ChargingSessionStatus;
  onChange: (status?: ChargingSessionStatus) => void;
};

const TABS: { key: ChargingSessionStatus | 'ALL'; label: string }[] = [
  { key: 'ALL', label: 'All' },
  ...CHARGING_SESSION_STATUS_FILTERS.map((status) => ({
    key: status,
    label: formatChargingSessionStatus(status),
  })),
];

export function SessionStatusFilterRow({
  activeStatus,
  onChange,
}: SessionStatusFilterRowProps) {
  const { theme } = useTheme();
  const styles = useMemo(() => createStyles(theme), [theme]);

  return (
    <View style={styles.container}>
      <View style={styles.row}>
        {TABS.map((tab) => {
          const active =
            tab.key === 'ALL' ? !activeStatus : activeStatus === tab.key;

          return (
            <Pressable
              key={tab.key}
              onPress={() =>
                onChange(tab.key === 'ALL' ? undefined : tab.key)
              }
              style={[styles.tab, active && styles.tabActive]}
              accessibilityRole="button"
              accessibilityState={{ selected: active }}
            >
              <Text style={[styles.label, active && styles.labelActive]}>
                {tab.label}
              </Text>
            </Pressable>
          );
        })}
      </View>
    </View>
  );
}

function createStyles(theme: ReturnType<typeof useTheme>['theme']) {
  return StyleSheet.create({
    container: {
      marginTop: 16,
      borderBottomWidth: StyleSheet.hairlineWidth,
      borderBottomColor: theme.colors.border,
    },
    row: {
      flexDirection: 'row',
      alignItems: 'stretch',
      paddingHorizontal: 8,
    },
    tab: {
      flex: 1,
      alignItems: 'center',
      justifyContent: 'center',
      paddingHorizontal: 12,
      paddingVertical: 4,
      minHeight: 44,
      borderBottomWidth: 2,
      borderBottomColor: 'transparent',
    },
    tabActive: {
      borderBottomColor: theme.colors.accent,
    },
    label: {
      fontFamily: theme.typography.fontFamily.regular,
      fontSize: 12,
      lineHeight: 18,
      color: theme.colors.textMuted,
    },
    labelActive: {
      fontFamily: theme.typography.fontFamily.bold,
      color: theme.colors.accent,
    },
  });
}
