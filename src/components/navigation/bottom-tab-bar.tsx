import { router, type Href } from 'expo-router';
import { useEffect, useMemo, type ReactNode } from 'react';
import { Pressable, StyleSheet, View } from 'react-native';
import Animated, {
  Easing,
  FadeIn,
  FadeOut,
  ReduceMotion,
  cancelAnimation,
  useAnimatedStyle,
  useReducedMotion,
  useSharedValue,
  withTiming,
} from 'react-native-reanimated';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { useAuth } from '@/auth/auth-context';
import { Icon, type IconName } from '@/components/ui/icon';
import { Text } from '@/components/ui/text';
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
  iconActive: IconName;
};

const TABS: TabConfig[] = [
  { name: 'index', label: 'Home', icon: 'home-outline', iconActive: 'home' },
  { name: 'map', label: 'Map', icon: 'map-outline', iconActive: 'map' },
  { name: 'sessions', label: 'Sessions', icon: 'document', iconActive: 'document-filled' },
  { name: 'profile', label: 'Profile', icon: 'person-outline', iconActive: 'user' },
];

const ICON_SIZE = 22;
const ACTIVE_GROW = 1.9;
const IDLE_GROW = 1;
const PILL_HEIGHT = 46;
const EXPAND_MS = 240;

type TabSlotProps = {
  active: boolean;
  reduceMotion: boolean;
  style: object;
  children: ReactNode;
};

/**
 * One dock slot. Its width is the slot's `flexGrow` (1.9 active / 1 idle) animated on the UI thread.
 *
 * Why not a layout animation or measured widths: on native, `LinearTransition` animates the slot's
 * frame while the children (the Emerald pill is `width: 100%`) are already laid out at the final
 * size, and a re-measure or a quick second tap mid-animation can leave the slot at a stale,
 * partially-expanded width. Animating `flexGrow` instead lets Yoga split the real container width
 * every frame. One slot grows by exactly what another shrinks, so total grow is constant and the
 * other slots never drift. Web behaves identically.
 */
function TabSlot({ active, reduceMotion, style, children }: TabSlotProps) {
  const target = active ? ACTIVE_GROW : IDLE_GROW;
  const grow = useSharedValue(target);

  useEffect(() => {
    if (reduceMotion) {
      cancelAnimation(grow);
      grow.value = target;
      return;
    }
    grow.value = withTiming(target, {
      duration: EXPAND_MS,
      easing: Easing.inOut(Easing.quad),
      reduceMotion: ReduceMotion.Never,
    });
  }, [target, reduceMotion, grow]);

  const animatedStyle = useAnimatedStyle(() => ({ flexGrow: grow.value }));

  return <Animated.View style={[style, animatedStyle]}>{children}</Animated.View>;
}

/**
 * konnectEV floating tab bar — ceramic dock with an expanding Emerald pill.
 * Active slot grows (icon + label); idle slots shrink to icon-only.
 */
export function BottomTabBar({ state, navigation }: BottomTabBarProps) {
  const insets = useSafeAreaInsets();
  const { theme } = useTheme();
  const { isAuthenticated, isLoading } = useAuth();
  const reduceMotion = useReducedMotion();
  const styles = useMemo(() => createStyles(theme), [theme]);
  const bottomPad = Math.max(insets.bottom, 12);

  return (
    <View style={[styles.outer, { paddingBottom: bottomPad }]}>
      <View style={styles.bar}>
        <View style={styles.barInner}>
          {state.routes.map((route: TabRoute, index: number) => {
            const tab = TABS.find((t) => t.name === route.name);
            if (!tab) return null;

            const active = state.index === index;

            return (
              <TabSlot key={route.key} active={active} reduceMotion={reduceMotion} style={styles.slot}>
                <Pressable
                  onPress={() => {
                    if (route.name === 'profile' && !isLoading && !isAuthenticated) {
                      router.push('/auth' as Href);
                      return;
                    }
                    navigation.navigate(route.name);
                  }}
                  style={({ pressed }) => [
                    styles.pressable,
                    active ? styles.pill : styles.idle,
                    pressed && !active && styles.pressed,
                  ]}
                  accessibilityRole="tab"
                  accessibilityState={{ selected: active }}
                  accessibilityLabel={tab.label}
                >
                  <View style={styles.iconBox}>
                    <Icon
                      name={active ? tab.iconActive : tab.icon}
                      size={ICON_SIZE}
                      color={active ? theme.colors.tabActiveIcon : theme.colors.tabInactive}
                    />
                  </View>
                  {active ? (
                    <Animated.View
                      entering={reduceMotion ? undefined : FadeIn.duration(180)}
                      exiting={reduceMotion ? undefined : FadeOut.duration(90)}
                    >
                      <Text
                        style={styles.labelActive}
                        numberOfLines={1}
                        maxFontSizeMultiplier={1.1}
                      >
                        {tab.label}
                      </Text>
                    </Animated.View>
                  ) : null}
                </Pressable>
              </TabSlot>
            );
          })}
        </View>
      </View>
    </View>
  );
}

function createStyles(theme: ReturnType<typeof useTheme>['theme']) {
  return StyleSheet.create({
    outer: {
      paddingHorizontal: theme.sizes.tabBar.floatInset,
      paddingTop: 8,
      backgroundColor: theme.colors.background,
    },
    bar: {
      height: theme.sizes.tabBar.height,
      paddingHorizontal: 8,
      borderRadius: theme.sizes.tabBar.radius,
      backgroundColor: theme.colors.tabBarBackground,
      borderWidth: StyleSheet.hairlineWidth,
      borderColor: theme.colors.tabBarBorder,
      ...theme.shadows.tabBar,
    },
    barInner: {
      flex: 1,
      flexDirection: 'row',
      alignItems: 'center',
    },
    slot: {
      // Width comes entirely from the animated `flexGrow`; basis 0 makes grow the only input.
      flexBasis: 0,
      flexShrink: 1,
      minWidth: 0,
      height: '100%',
      justifyContent: 'center',
      overflow: 'hidden',
    },
    pressable: {
      width: '100%',
      height: PILL_HEIGHT,
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'center',
      overflow: 'hidden',
      borderRadius: 18,
    },
    pill: {
      gap: 8,
      backgroundColor: theme.colors.tabActive,
      paddingHorizontal: 14,
    },
    idle: {
      backgroundColor: 'transparent',
    },
    iconBox: {
      width: ICON_SIZE,
      height: ICON_SIZE,
      alignItems: 'center',
      justifyContent: 'center',
    },
    pressed: {
      opacity: 0.72,
    },
    labelActive: {
      fontFamily: theme.typography.fontFamily.bold,
      fontSize: 13,
      color: theme.colors.tabActiveLabel,
    },
  });
}
