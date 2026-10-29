import { useMemo } from 'react';
import { Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';

import { Icon } from '@/components/ui/icon';
import {
  useStationDiscoveryContext,
  type DiscoveryQuickChipId,
} from '@/contexts/station-discovery-context';
import { useTheme } from '@/theme';

import { DISCOVERY_LAYOUT } from './discovery-layout';

const CHIP_TEXT_SELECTED = '#0F172A';
const CHIP_GAP = 8;
const ICON_TEXT_GAP = 6;

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

function ChipIcon({
  icon,
  active,
  idleColor,
}: {
  icon: NonNullable<ChipDef['icon']>;
  active: boolean;
  idleColor: string;
}) {
  if (icon === 'bolt') {
    return <Icon name="bolt" size={12} color={active ? CHIP_TEXT_SELECTED : idleColor} />;
  }

  return <Icon name="check" size={12} color={active ? CHIP_TEXT_SELECTED : idleColor} />;
}

export function DiscoveryFilterChips({ floating = false }: DiscoveryFilterChipsProps) {
  const { theme } = useTheme();
  const styles = useMemo(() => createStyles(theme, floating), [theme, floating]);
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
            <Pressable
              key={chip.id}
              onPress={() => toggleQuickChip(chip.id)}
              style={[styles.chip, active ? styles.chipActive : styles.chipIdle]}
              accessibilityRole="button"
              accessibilityState={{ selected: active }}
              accessibilityLabel={chip.label}
            >
              {chip.icon ? (
                <ChipIcon
                  icon={chip.icon}
                  active={active}
                  idleColor={theme.colors.textChip}
                />
              ) : null}
              <Text style={[styles.label, active ? styles.labelActive : styles.labelIdle]}>
                {chip.label}
              </Text>
            </Pressable>
          );
        })}
      </ScrollView>
    </View>
  );
}

function createStyles(
  theme: ReturnType<typeof useTheme>['theme'],
  floating: boolean,
) {
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
    chip: {
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'center',
      gap: ICON_TEXT_GAP,
      height: DISCOVERY_LAYOUT.chipHeight,
      paddingHorizontal: 14,
      borderRadius: 20,
      borderWidth: 1,
    },
    chipActive: {
      backgroundColor: theme.colors.accent,
      borderColor: theme.colors.accent,
    },
    chipIdle: {
      backgroundColor: theme.colors.surface,
      borderColor: theme.colors.border,
    },
    label: {
      fontFamily: theme.typography.fontFamily.medium,
      fontSize: 12,
      lineHeight: 18,
      includeFontPadding: false,
    },
    labelActive: {
      color: CHIP_TEXT_SELECTED,
    },
    labelIdle: {
      color: theme.colors.textChip,
    },
  });
}
