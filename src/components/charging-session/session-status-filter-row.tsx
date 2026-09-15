import { ScrollView, StyleSheet, View } from 'react-native';

import { FilterChip } from '@/components/ui/filter-chip';
import { theme } from '@/theme';
import type { ChargingSessionStatus } from '@/types/charging-session';
import { CHARGING_SESSION_STATUSES, formatChargingSessionStatus } from '@/types/charging-session';

type SessionStatusFilterRowProps = {
  activeStatus?: ChargingSessionStatus;
  onChange: (status?: ChargingSessionStatus) => void;
};

export function SessionStatusFilterRow({
  activeStatus,
  onChange,
}: SessionStatusFilterRowProps) {
  return (
    <View style={styles.container}>
      <ScrollView
        horizontal
        showsHorizontalScrollIndicator={false}
        contentContainerStyle={styles.filtersContent}
        style={styles.filtersScroll}
      >
        <FilterChip
          label="All"
          active={!activeStatus}
          onPress={() => onChange(undefined)}
        />
        {CHARGING_SESSION_STATUSES.map((status) => (
          <FilterChip
            key={status}
            label={formatChargingSessionStatus(status)}
            active={activeStatus === status}
            onPress={() => onChange(status)}
          />
        ))}
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: theme.spacing.md,
    paddingLeft: theme.spacing.lg,
  },
  filtersScroll: {
    flexGrow: 0,
    flexShrink: 0,
  },
  filtersContent: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: theme.spacing.sm,
    paddingRight: theme.spacing.lg,
  },
});
