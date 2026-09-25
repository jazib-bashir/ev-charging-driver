import { Pressable, StyleSheet, Text, View } from 'react-native';
import { useMemo } from 'react';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { Icon, type IconName } from '@/components/ui/icon';
import { useTheme } from '@/theme';

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

const TAB_CONTENT_HEIGHT = 64;

const TABS: TabConfig[] = [
  { name: 'index', label: 'Home', icon: 'home-outline' },
  { name: 'map', label: 'Map', icon: 'map-outline' },
  { name: 'sessions', label: 'Sessions', icon: 'document' },
  { name: 'profile', label: 'Profile', icon: 'person-outline' },
];

export function BottomTabBar({ state, navigation }: BottomTabBarProps) {
  const insets = useSafeAreaInsets();
  const { theme } = useTheme();
  const styles = useMemo(() => createStyles(theme), [theme]);
  const bottomPad = Math.max(insets.bottom, 8);

  return (
    <View style={[styles.shell, { paddingBottom: bottomPad }]}>
      <View style={styles.topHairline} />
      <View style={styles.row}>
        {state.routes.map((route: TabRoute, index: number) => {
          const tab = TABS.find((t) => t.name === route.name);
          if (!tab) return null;

          const active = state.index === index;
          const color = active ? theme.colors.accent : theme.colors.tabInactive;

          return (
            <Pressable
              key={route.key}
              onPress={() => navigation.navigate(route.name)}
              style={styles.tab}
              accessibilityRole="button"
              accessibilityState={{ selected: active }}
              accessibilityLabel={tab.label}
            >
              <View style={styles.iconStage}>
                {active ? <View style={styles.activeGlow} /> : null}
                <Icon name={tab.icon} size={22} color={color} />
              </View>
              <Text style={[styles.label, active ? styles.labelActive : styles.labelInactive]}>
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
    shell: {
      backgroundColor: theme.colors.surface,
      shadowColor: theme.isDark ? '#000' : '#0F172A',
      shadowOffset: { width: 0, height: -6 },
      shadowOpacity: theme.isDark ? 0.35 : 0.06,
      shadowRadius: 16,
      elevation: 12,
    },
    topHairline: {
      height: StyleSheet.hairlineWidth,
      backgroundColor: theme.colors.tabBarBorder,
    },
    row: {
      flexDirection: 'row',
      height: TAB_CONTENT_HEIGHT,
      alignItems: 'center',
      paddingHorizontal: 4,
    },
    tab: {
      flex: 1,
      height: '100%',
      alignItems: 'center',
      justifyContent: 'center',
      gap: 5,
      paddingTop: 4,
    },
    iconStage: {
      width: 36,
      height: 28,
      alignItems: 'center',
      justifyContent: 'center',
    },
    activeGlow: {
      position: 'absolute',
      width: 34,
      height: 34,
      borderRadius: 17,
      backgroundColor: 'rgba(0, 217, 160, 0.12)',
    },
    label: {
      fontSize: 10,
      lineHeight: 15,
      letterSpacing: 0,
    },
    labelActive: {
      fontFamily: theme.typography.fontFamily.bold,
      color: theme.colors.accent,
    },
    labelInactive: {
      fontFamily: theme.typography.fontFamily.regular,
      color: theme.colors.tabInactive,
    },
  });
}
