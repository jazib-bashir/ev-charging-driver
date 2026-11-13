import { useEffect } from 'react';
import { StyleSheet, View, type DimensionValue, type StyleProp, type ViewStyle } from 'react-native';
import Animated, {
  Easing,
  cancelAnimation,
  useAnimatedStyle,
  useReducedMotion,
  useSharedValue,
  withRepeat,
  withTiming,
} from 'react-native-reanimated';

import { useTheme } from '@/theme';

type SkeletonLoaderProps = {
  width?: DimensionValue;
  height?: number;
  radius?: number;
  style?: StyleProp<ViewStyle>;
};

/**
 * Skeleton block with a quiet directional sweep (brand motion guideline for skeletons).
 * Keep using skeletons for station discovery / detail layouts – they preserve layout and
 * feel faster than a spinner.
 */
export function SkeletonLoader({ width = '100%', height = 16, radius = 10, style }: SkeletonLoaderProps) {
  const { theme } = useTheme();
  const reduceMotion = useReducedMotion();
  const progress = useSharedValue(0);

  useEffect(() => {
    if (reduceMotion) {
      return undefined;
    }
    progress.value = 0;
    progress.value = withRepeat(withTiming(1, { duration: 1400, easing: Easing.inOut(Easing.quad) }), -1, false);
    return () => {
      cancelAnimation(progress);
    };
  }, [progress, reduceMotion]);

  const sweepStyle = useAnimatedStyle(() => ({
    transform: [{ translateX: -160 + progress.value * 480 }],
  }));

  return (
    <View
      style={[
        styles.base,
        { width, height, borderRadius: radius, backgroundColor: theme.colors.skeletonBase },
        style,
      ]}
    >
      {reduceMotion ? null : (
        <Animated.View
          pointerEvents="none"
          style={[styles.sweep, { backgroundColor: theme.colors.skeletonHighlight }, sweepStyle]}
        />
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  base: {
    overflow: 'hidden',
  },
  sweep: {
    position: 'absolute',
    top: 0,
    bottom: 0,
    width: 120,
    opacity: 0.7,
    transform: [{ skewX: '-18deg' }],
  },
});
