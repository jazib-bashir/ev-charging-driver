import { useMemo } from 'react';
import { ScrollView, StyleSheet, View } from 'react-native';

import { FilterChip } from '@/components/ui/filter-chip';
import { Icon } from '@/components/ui/icon';
import {
  useStationDiscoveryContext,
  type DiscoveryQuickChipId,
} from '@/contexts/station-discovery-context';
import { useTheme } from '@/theme';

import { DISCOVERY_LAYOUT } from './discovery-layout';

const CHIP_GAP = 8;

type ChipDef = {
  id: DiscoveryQuickChipId;
  label: string;
  icon?: 'bolt' | 'check';
};

type DiscoveryFilterChipsProps = {
  floating?: boolean;
};

const CHIPS: ChipDef[] = [
  { id: 'all', label: 'All' },
  { id: 'fast', label: 'Fast', icon: 'bolt' },
  { id: 'available', label: 'Available', icon: 'check' },
  { id: 'distance', label: '< 3 km' },
];

export function DiscoveryFilterChips({ floating = false }: DiscoveryFilterChipsProps) {
  const { theme } = useTheme();
  const styles = useMemo(() => createStyles(floating), [floating]);
  const { filters, toggleQuickChip } = useStationDiscoveryContext();

  const selected = useMemo(() => {
    const next = new Set<DiscoveryQuickChipId>();
    if (filters.fast) next.add('fast');
    if (filters.available) next.add('available');
    if (filters.distance) next.add('distance');
    if (next.size === 0) next.add('all');
    return next;
  }, [filters.available, filters.distance, filters.fast]);

  return (
    <View style={styles.container}>
      <ScrollView
        horizontal
        showsHorizontalScrollIndicator={false}
        contentContainerStyle={styles.content}
      >
        {CHIPS.map((chip) => {
          const active = selected.has(chip.id);

          return (
            <FilterChip
              key={chip.id}
              label={chip.label}
              active={active}
              onPress={() => toggleQuickChip(chip.id)}
              icon={
                chip.icon ? (
                  <Icon
                    name={chip.icon}
                    size={13}
                    color={active ? theme.colors.onPrimary : theme.colors.textSecondary}
                  />
                ) : undefined
              }
            />
          );
        })}
      </ScrollView>
    </View>
  );
}

function createStyles(floating: boolean) {
  return StyleSheet.create({
    container: {
      paddingTop: floating ? 8 : DISCOVERY_LAYOUT.sectionGap,
      paddingBottom: 0,
      marginTop: floating ? 8 : 0,
      backgroundColor: 'transparent',
    },
    content: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: CHIP_GAP,
      paddingHorizontal: DISCOVERY_LAYOUT.edge,
    },
  });
}
