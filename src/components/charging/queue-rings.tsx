import { memo, useEffect, useMemo } from 'react';
import { StyleSheet, View } from 'react-native';
import Animated, {
  Easing,
  cancelAnimation,
  useAnimatedStyle,
  useReducedMotion,
  useSharedValue,
  withRepeat,
  withTiming,
} from 'react-native-reanimated';

import { Text } from '@/components/ui/text';
import { useTheme } from '@/theme';

type QueueRingsProps = {
  /** Place in line (1 = next). */
  rank: number;
  size?: number;
  caption?: string;
  onHero?: boolean;
};

const RING_COUNT = 3;

/**
 * Queue hero: concentric rings that gently ripple outward from the driver's position number.
 * The closer the driver is to the front, the stronger the inner ring (rank 1 = fully emerald).
 */
function QueueRingsBase({ rank, size = 172, caption = 'Your place', onHero = true }: QueueRingsProps) {
  const { theme } = useTheme();
  const reduceMotion = useReducedMotion();
  const ripple = useSharedValue(0);

  useEffect(() => {
    if (reduceMotion) {
      return undefined;
    }
    ripple.value = withRepeat(withTiming(1, { duration: 2800, easing: Easing.out(Easing.quad) }), -1, false);
    return () => cancelAnimation(ripple);
  }, [reduceMotion, ripple]);

  const rippleStyle = useAnimatedStyle(() => ({
    opacity: 0.5 * (1 - ripple.value),
    transform: [{ scale: 0.62 + ripple.value * 0.38 }],
  }));

  const textColor = onHero ? theme.colors.heroText : theme.colors.textPrimary;
  const mutedColor = onHero ? theme.colors.heroTextMuted : theme.colors.textMuted;
  const ringBase = onHero ? theme.colors.heroBorder : theme.colors.border;
  const closeness = rank <= 1 ? 1 : rank === 2 ? 0.75 : rank <= 4 ? 0.5 : 0.3;

  const styles = useMemo(
    () =>
      StyleSheet.create({
        wrap: { width: size, height: size, alignItems: 'center', justifyContent: 'center' },
        ring: { position: 'absolute', borderWidth: 1.5, alignItems: 'center', justifyContent: 'center' },
        core: {
          width: size * 0.5,
          height: size * 0.5,
          borderRadius: size * 0.25,
          backgroundColor: theme.colors.primary,
          opacity: 0.18 + closeness * 0.82,
          position: 'absolute',
        },
        rank: {
          fontFamily: theme.typography.fontFamily.brand,
          fontSize: Math.round(size * 0.25),
          letterSpacing: -1,
          color: textColor,
          lineHeight: Math.round(size * 0.29),
        },
        caption: {
          fontFamily: theme.typography.fontFamily.bold,
          fontSize: 10,
          letterSpacing: 1.1,
          textTransform: 'uppercase',
          color: mutedColor,
        },
      }),
    [theme, size, closeness, textColor, mutedColor],
  );

  return (
    <View style={styles.wrap} accessibilityRole="image" accessibilityLabel={`Position ${rank} in the queue`}>
      {Array.from({ length: RING_COUNT }).map((_, i) => {
        const d = size * (1 - i * 0.2);
        return (
          <View
            key={`ring-${i}`}
            style={[
              styles.ring,
              {
                width: d,
                height: d,
                borderRadius: d / 2,
                borderColor: i === RING_COUNT - 1 ? theme.colors.secondary : ringBase,
                opacity: i === RING_COUNT - 1 ? 0.35 + closeness * 0.65 : 1,
              },
            ]}
          />
        );
      })}
      {reduceMotion ? null : (
        <Animated.View
          style={[
            styles.ring,
            { width: size, height: size, borderRadius: size / 2, borderColor: theme.colors.secondary },
            rippleStyle,
          ]}
        />
      )}
      <View style={styles.core} />
      <View style={{ alignItems: 'center' }}>
        <Text style={styles.rank}>#{rank}</Text>
        <Text style={styles.caption}>{caption}</Text>
      </View>
    </View>
  );
}

export const QueueRings = memo(QueueRingsBase);
