import { ScrollView, StyleSheet, View } from 'react-native';

import { FilterChip } from '@/components/ui/filter-chip';
import { Icon } from '@/components/ui/icon';
import { ViewToggle, type ViewMode } from '@/components/ui/view-toggle';
import { theme } from '@/theme';
import type { StationFilters } from '@/utils/station';

type FilterRowProps = {
  filters: StationFilters;
  viewMode: ViewMode;
  onToggleFilter: (key: keyof StationFilters) => void;
  onViewModeChange: (mode: ViewMode) => void;
};

const FILTER_OPTIONS: { key: keyof StationFilters; label: string; icon?: boolean }[] = [
  { key: 'fast', label: 'Fast', icon: true },
  { key: 'available', label: 'Available' },
  { key: 'tesla', label: 'Tesla' },
  { key: 'ccs', label: 'CCS' },
];

export function FilterRow({ filters, viewMode, onToggleFilter, onViewModeChange }: FilterRowProps) {
  return (
    <View style={styles.container}>
      <ScrollView
        horizontal
        showsHorizontalScrollIndicator={false}
        contentContainerStyle={styles.filtersContent}
        style={styles.filtersScroll}
      >
        {FILTER_OPTIONS.map((option) => {
          const active = filters[option.key];
          return (
            <FilterChip
              key={option.key}
              label={option.label}
              active={active}
              onPress={() => onToggleFilter(option.key)}
              icon={
                option.icon
                  ? (
                    <Icon
                      name="bolt"
                      size={12}
                      color={active ? theme.colors.textInverse : theme.colors.textPrimary}
                    />
                  )
                  : undefined
              }
            />
          );
        })}
      </ScrollView>

      <View style={styles.viewToggle}>
        <ViewToggle value={viewMode} onChange={onViewModeChange} />
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: theme.spacing.md,
    paddingLeft: theme.spacing.lg,
    gap: theme.spacing.sm,
  },
  filtersScroll: {
    flex: 1,
  },
  filtersContent: {
    gap: theme.spacing.sm,
    paddingRight: theme.spacing.sm,
  },
  viewToggle: {
    marginRight: theme.spacing.lg,
  },
});
