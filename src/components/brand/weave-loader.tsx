import { memo, useEffect } from 'react';
import Animated, {
  Easing,
  cancelAnimation,
  useAnimatedProps,
  useReducedMotion,
  useSharedValue,
  withRepeat,
  withTiming,
} from 'react-native-reanimated';
import Svg, { Defs, G, Mask, Path, Rect } from 'react-native-svg';

import { BRAND, WEAVE_PATHS } from '@/theme/brand';

const AnimatedPath = Animated.createAnimatedComponent(Path);

/** Timing from the approved `konnectev-loader.svg`. */
const DURATION_MS = 1650;
const DASH = 44;
const GAP = 90;
const DASH_CYCLE = DASH + GAP; // 134
/** `.lime { animation-delay: -.82s }` expressed as a phase of the 1.65s cycle. */
const LIME_PHASE = 0.82 / 1.65;

/** cubic-bezier(.65, 0, .35, 1) – the loader's easing curve, evaluated on the UI thread. */
function easeInOut(x: number): number {
  'worklet';
  let lo = 0;
  let hi = 1;
  let t = x;
  for (let i = 0; i < 14; i += 1) {
    const mt = 1 - t;
    const bx = 3 * mt * mt * t * 0.65 + 3 * mt * t * t * 0.35 + t * t * t;
    if (bx < x) lo = t;
    else hi = t;
    t = (lo + hi) / 2;
  }
  const mt = 1 - t;
  return 3 * mt * t * t + t * t * t;
}

type WeaveLoaderProps = {
  /** Rendered size in dp (the symbol is square). */
  size?: number;
  /** Opacity of the dim full symbol drawn under the traveling energy pulses (Dashboard behavior). */
  baseOpacity?: number;
  /** Set false to render the full-color static symbol (also used when reduced motion is on). */
  animated?: boolean;
  /**
   * When false the loader holds on frame 0 (the exact pose baked into the native splash image) and
   * only starts traveling once this becomes true. The splash overlay uses this so the animation
   * begins when the user can actually see it, not while Android is still withholding the first draw.
   */
  playing?: boolean;
  accessibilityLabel?: string;
};

/**
 * The approved animated Mobility Weave loader (`konnectev-loader.svg`) rendered with react-native-svg
 * + Reanimated. Each route animates along its own curve (it never rotates like a generic spinner).
 * Animation runs on the UI thread and is cancelled on unmount.
 */
function WeaveLoaderBase({
  size = 48,
  baseOpacity = 0.22,
  animated = true,
  playing = true,
  accessibilityLabel = 'Loading',
}: WeaveLoaderProps) {
  const reduceMotion = useReducedMotion();
  const shouldAnimate = animated && !reduceMotion;
  const t = useSharedValue(0);

  useEffect(() => {
    if (!shouldAnimate || !playing) {
      return undefined;
    }

    t.value = 0;
    t.value = withRepeat(withTiming(1, { duration: DURATION_MS, easing: Easing.linear }), -1, false);
    return () => {
      cancelAnimation(t);
    };
  }, [shouldAnimate, playing, t]);

  const coralProps = useAnimatedProps(() => ({
    strokeDashoffset: DASH_CYCLE * (1 - easeInOut(t.value)),
  }));
  const limeProps = useAnimatedProps(() => ({
    strokeDashoffset: DASH_CYCLE * (1 - easeInOut((t.value + LIME_PHASE) % 1)),
  }));

  return (
    <Svg
      width={size}
      height={size}
      viewBox="0 0 96 96"
      accessibilityRole="progressbar"
      accessibilityLabel={accessibilityLabel}
    >
      <Defs>
        <Mask id="loader-weave-cut" maskUnits="userSpaceOnUse" x="0" y="0" width="96" height="96">
          <Rect width="96" height="96" fill="#fff" />
          <Path
            d={WEAVE_PATHS.coral}
            stroke="#000"
            strokeWidth={WEAVE_PATHS.cutStrokeWidth}
            strokeLinecap="round"
            fill="none"
          />
        </Mask>
      </Defs>

      <G opacity={shouldAnimate ? baseOpacity : 1}>
        <Path
          d={WEAVE_PATHS.lime}
          fill="none"
          stroke={BRAND.lime}
          strokeWidth={WEAVE_PATHS.strokeWidth}
          strokeLinecap="round"
          mask="url(#loader-weave-cut)"
        />
        <Path
          d={WEAVE_PATHS.coral}
          fill="none"
          stroke={BRAND.coral}
          strokeWidth={WEAVE_PATHS.strokeWidth}
          strokeLinecap="round"
        />
      </G>

      {shouldAnimate ? (
        <>
          <AnimatedPath
            animatedProps={limeProps}
            d={WEAVE_PATHS.lime}
            fill="none"
            stroke={BRAND.lime}
            strokeWidth={WEAVE_PATHS.strokeWidth}
            strokeLinecap="round"
            strokeDasharray={[DASH, GAP]}
            mask="url(#loader-weave-cut)"
          />
          <AnimatedPath
            animatedProps={coralProps}
            d={WEAVE_PATHS.coral}
            fill="none"
            stroke={BRAND.coral}
            strokeWidth={WEAVE_PATHS.strokeWidth}
            strokeLinecap="round"
            strokeDasharray={[DASH, GAP]}
          />
        </>
      ) : null}
    </Svg>
  );
}

export const WeaveLoader = memo(WeaveLoaderBase);
