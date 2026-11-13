import { memo, useEffect, useMemo } from 'react';
import { StyleSheet, View } from 'react-native';
import Animated, {
  Easing,
  cancelAnimation,
  useAnimatedStyle,
  useReducedMotion,
  useSharedValue,
  withRepeat,
  withSequence,
  withTiming,
} from 'react-native-reanimated';
import Svg, { Circle, Defs, LinearGradient, Stop } from 'react-native-svg';

import { Text } from '@/components/ui/text';
import { useTheme } from '@/theme';

type ChargingRingProps = {
  /** Primary reading in the middle (e.g. "42.8"). */
  value: string;
  unit?: string;
  caption?: string;
  size?: number;
  /** Fraction (0–1) of the ring that is "filled". When omitted, the ring shows a traveling live arc. */
  progress?: number;
  /** Animate the ring (live sessions). */
  live?: boolean;
  /** Draw on the dark hero panel (uses hero tokens). */
  onHero?: boolean;
};

const ARC_FRACTION = 0.3;

/**
 * Charging ring: a quiet track with an emerald arc traveling around it while the session is live,
 * a soft pulse halo and the primary reading centered. No fake percentage – with no state-of-charge
 * data the arc communicates "energy is flowing", with `progress` it becomes a determinate ring.
 */
function ChargingRingBase({
  value,
  unit,
  caption,
  size = 176,
  progress,
  live = true,
  onHero = false,
}: ChargingRingProps) {
  const { theme } = useTheme();
  const reduceMotion = useReducedMotion();
  const spin = useSharedValue(0);
  const pulse = useSharedValue(0);

  const animate = live && !reduceMotion && progress === undefined;
  const halo = live && !reduceMotion;

  useEffect(() => {
    if (!animate) {
      return undefined;
    }
    spin.value = 0;
    spin.value = withRepeat(withTiming(1, { duration: 3200, easing: Easing.linear }), -1, false);
    return () => cancelAnimation(spin);
  }, [animate, spin]);

  useEffect(() => {
    if (!halo) {
      return undefined;
    }
    pulse.value = withRepeat(
      withSequence(
        withTiming(1, { duration: 1600, easing: Easing.inOut(Easing.quad) }),
        withTiming(0, { duration: 1600, easing: Easing.inOut(Easing.quad) }),
      ),
      -1,
      false,
    );
    return () => cancelAnimation(pulse);
  }, [halo, pulse]);

  const spinStyle = useAnimatedStyle(() => ({
    transform: [{ rotate: `${spin.value * 360}deg` }],
  }));
  const haloStyle = useAnimatedStyle(() => ({
    opacity: 0.35 - pulse.value * 0.25,
    transform: [{ scale: 1 + pulse.value * 0.06 }],
  }));

  const stroke = Math.max(8, Math.round(size * 0.06));
  const radius = (size - stroke) / 2;
  const circumference = 2 * Math.PI * radius;
  const fraction = progress === undefined ? ARC_FRACTION : Math.min(Math.max(progress, 0), 1);
  const dash = circumference * fraction;

  const track = onHero ? theme.colors.heroBorder : theme.colors.surfaceSunken;
  const textColor = onHero ? theme.colors.heroText : theme.colors.textPrimary;
  const mutedColor = onHero ? theme.colors.heroTextMuted : theme.colors.textMuted;
  const styles = useMemo(() => StyleSheet.create({
    wrap: { width: size, height: size, alignItems: 'center', justifyContent: 'center' },
    fill: { ...StyleSheet.absoluteFill },
    center: { alignItems: 'center', justifyContent: 'center', paddingHorizontal: stroke * 2 },
    value: {
      fontFamily: theme.typography.fontFamily.brand,
      fontSize: Math.round(size * 0.24),
      lineHeight: Math.round(size * 0.28),
      letterSpacing: -1,
      color: textColor,
    },
    unit: {
      fontFamily: theme.typography.fontFamily.semibold,
      fontSize: Math.round(size * 0.085),
      color: mutedColor,
      marginTop: -2,
    },
    caption: {
      fontFamily: theme.typography.fontFamily.bold,
      fontSize: 10,
      letterSpacing: 1.1,
      color: mutedColor,
      marginTop: 6,
      textTransform: 'uppercase',
    },
  }), [theme, size, stroke, textColor, mutedColor]);

  return (
    <View style={styles.wrap} accessibilityRole="image" accessibilityLabel={`${value} ${unit ?? ''} ${caption ?? ''}`.trim()}>
      {halo ? (
        <Animated.View
          style={[
            styles.fill,
            { borderRadius: size / 2, backgroundColor: theme.colors.secondary },
            haloStyle,
          ]}
        />
      ) : null}
      <View
        style={[
          styles.fill,
          {
            margin: stroke / 2,
            borderRadius: size / 2,
            backgroundColor: onHero ? theme.colors.heroBackground : theme.colors.surface,
          },
        ]}
      />
      <Svg width={size} height={size} style={styles.fill}>
        <Circle cx={size / 2} cy={size / 2} r={radius} stroke={track} strokeWidth={stroke} fill="none" />
      </Svg>
      <Animated.View style={[styles.fill, animate ? spinStyle : null]}>
        <Svg width={size} height={size}>
          <Defs>
            <LinearGradient id="ringArc" x1="0" y1="0" x2="1" y2="1">
              <Stop offset="0" stopColor={theme.colors.primary} />
              <Stop offset="1" stopColor={theme.colors.secondary} />
            </LinearGradient>
          </Defs>
          <Circle
            cx={size / 2}
            cy={size / 2}
            r={radius}
            stroke="url(#ringArc)"
            strokeWidth={stroke}
            strokeLinecap="round"
            strokeDasharray={`${dash} ${circumference}`}
            fill="none"
            rotation={-90}
            origin={`${size / 2}, ${size / 2}`}
          />
        </Svg>
      </Animated.View>
      <View style={styles.center}>
        <Text style={styles.value} numberOfLines={1} adjustsFontSizeToFit>
          {value}
        </Text>
        {unit ? <Text style={styles.unit}>{unit}</Text> : null}
        {caption ? <Text style={styles.caption}>{caption}</Text> : null}
      </View>
    </View>
  );
}

export const ChargingRing = memo(ChargingRingBase);
