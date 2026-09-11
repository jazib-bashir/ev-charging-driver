import { Pressable, StyleSheet, Text, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { Icon, type IconName } from '@/components/ui/icon';
import { theme } from '@/theme';

type TabRoute = {
  key: string;
  name: string;
};

type BottomTabBarProps = {
  state: {
    index: number;
    routes: TabRoute[];
  };
  navigation: {
    navigate: (name: string) => void;
  };
};

type TabConfig = {
  name: string;
  label: string;
  icon: IconName;
};

const TABS: TabConfig[] = [
  { name: 'index', label: 'Home', icon: 'home' },
  { name: 'map', label: 'Map', icon: 'map' },
  { name: 'sessions', label: 'Sessions', icon: 'charger' },
  { name: 'profile', label: 'Profile', icon: 'user' },
];

export function BottomTabBar({ state, navigation }: BottomTabBarProps) {
  const insets = useSafeAreaInsets();

  return (
    <View style={[styles.container, { paddingBottom: Math.max(insets.bottom, 8) }]}>
      {state.routes.map((route: TabRoute, index: number) => {
        const tab = TABS.find((t) => t.name === route.name);
        if (!tab) return null;

        const active = state.index === index;

        return (
          <Pressable
            key={route.key}
            onPress={() => navigation.navigate(route.name)}
            style={styles.tab}
            accessibilityRole="button"
            accessibilityState={{ selected: active }}
            accessibilityLabel={tab.label}
          >
            <View style={[styles.iconWrap, active && styles.iconWrapActive]}>
              <Icon
                name={tab.icon}
                size={22}
                color={active ? theme.colors.tabActiveIcon : theme.colors.tabInactive}
              />
            </View>
            <Text style={[styles.label, active && styles.labelActive]}>{tab.label}</Text>
          </Pressable>
        );
      })}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    backgroundColor: theme.colors.surface,
    borderTopWidth: StyleSheet.hairlineWidth,
    borderTopColor: theme.colors.border,
    paddingTop: theme.spacing.sm,
    ...theme.shadows.tabBar,
  },
  tab: {
    flex: 1,
    alignItems: 'center',
    gap: theme.spacing.xs,
  },
  iconWrap: {
    width: 44,
    height: 32,
    borderRadius: theme.radius.sm + 2,
    alignItems: 'center',
    justifyContent: 'center',
  },
  iconWrapActive: {
    backgroundColor: theme.colors.tabActive,
  },
  label: {
    fontSize: theme.typography.fontSize.xs,
    color: theme.colors.tabInactive,
    fontWeight: theme.typography.fontWeight.medium,
  },
  labelActive: {
    color: theme.colors.tabActiveIcon,
    fontWeight: theme.typography.fontWeight.semibold,
  },
});
