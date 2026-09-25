import { useMemo, useState } from 'react';
import { Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';

import { Icon } from '@/components/ui/icon';
import { useTheme } from '@/theme';

import { DISCOVERY_LAYOUT } from './discovery-layout';

const CHIP_TEXT_SELECTED = '#0F172A';
const CHIP_GAP = 8;
const ICON_TEXT_GAP = 6;

type ChipId = 'all' | 'fast' | 'available' | 'queue' | 'distance';

type ChipDef = {
  id: ChipId;
  label: string;
  icon?: 'bolt' | 'check' | 'queue';
};

type DiscoveryFilterChipsProps = {
  floating?: boolean;
};

const CHIPS: ChipDef[] = [
  { id: 'all', label: 'All' },
  { id: 'fast', label: 'Fast', icon: 'bolt' },
  { id: 'available', label: 'Available', icon: 'check' },
  { id: 'queue', label: 'Queue Open', icon: 'queue' },
  { id: 'distance', label: '< 3 km' },
];

function QueueDotsIcon({ active, borderIdle }: { active: boolean; borderIdle: string }) {
  return (
    <View
      style={{
        flexDirection: 'row',
        alignItems: 'center',
        gap: 2,
        height: 12,
        paddingHorizontal: 4,
        borderRadius: 6,
        borderWidth: 1,
        borderColor: active ? 'rgba(15, 23, 42, 0.25)' : borderIdle,
      }}
    >
      <View style={{ width: 4, height: 4, borderRadius: 2, backgroundColor: '#EF4444' }} />
      <View style={{ width: 4, height: 4, borderRadius: 2, backgroundColor: '#F59E0B' }} />
      <View style={{ width: 4, height: 4, borderRadius: 2, backgroundColor: '#22C55E' }} />
    </View>
  );
}

function ChipIcon({
  icon,
  active,
  idleColor,
}: {
  icon: NonNullable<ChipDef['icon']>;
  active: boolean;
  idleColor: string;
}) {
  if (icon === 'queue') {
    return <QueueDotsIcon active={active} borderIdle={idleColor} />;
  }

  if (icon === 'bolt') {
    return <Icon name="bolt" size={12} color={active ? CHIP_TEXT_SELECTED : idleColor} />;
  }

  return <Icon name="check" size={12} color={active ? CHIP_TEXT_SELECTED : idleColor} />;
}

export function DiscoveryFilterChips({ floating = false }: DiscoveryFilterChipsProps) {
  const { theme } = useTheme();
  const styles = useMemo(() => createStyles(theme, floating), [theme, floating]);
  const [selected, setSelected] = useState<Set<ChipId>>(() => new Set(['all']));

  const selectChip = (id: ChipId) => {
    setSelected((prev) => {
      if (id === 'all') {
        return new Set(['all']);
      }

      const next = new Set(prev);
      next.delete('all');

      if (next.has(id)) {
        next.delete(id);
      } else {
        next.add(id);
      }

      if (next.size === 0) {
        return new Set(['all']);
      }

      return next;
    });
  };

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
              onPress={() => selectChip(chip.id)}
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
      paddingHorizontal: 12,
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
