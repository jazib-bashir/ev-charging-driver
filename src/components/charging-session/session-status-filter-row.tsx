import { useMemo } from 'react';
import { ScrollView, StyleSheet } from 'react-native';

import { FilterChip } from '@/components/ui/filter-chip';
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
    <ScrollView
      horizontal
      showsHorizontalScrollIndicator={false}
      style={styles.scroller}
      contentContainerStyle={styles.row}
    >
      {TABS.map((tab) => {
        const active = tab.key === 'ALL' ? !activeStatus : activeStatus === tab.key;
        return (
          <FilterChip
            key={tab.key}
            label={tab.label}
            active={active}
            onPress={() => onChange(tab.key === 'ALL' ? undefined : tab.key)}
          />
        );
      })}
    </ScrollView>
  );
}

function createStyles(theme: ReturnType<typeof useTheme>['theme']) {
  return StyleSheet.create({
    scroller: {
      flexGrow: 0,
      marginTop: theme.spacing.sm,
    },
    row: {
      paddingHorizontal: theme.spacing.gutter,
      gap: 8,
      alignItems: 'center',
    },
  });
}
