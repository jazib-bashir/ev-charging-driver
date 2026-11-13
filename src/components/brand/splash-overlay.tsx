import * as SplashScreen from 'expo-splash-screen';
import { useCallback, useEffect, useRef, useState } from 'react';
import { Platform, StyleSheet, View } from 'react-native';
import Animated, { FadeIn, FadeOut } from 'react-native-reanimated';

import { Text } from '@/components/ui/text';
import { BRAND, DRIVER_SPLASH_TAGLINE, SPLASH_LAYOUT } from '@/theme/brand';
import { typography } from '@/theme/typography';

import { Wordmark } from './wordmark';
import { WeaveLoader } from './weave-loader';

/** Minimum time the animated splash stays visible once the native launch screen is gone. */
const MIN_DISPLAY_MS = 1100;
const FADE_OUT_MS = 280;
/**
 * The native launch screen is fade-released over this long (see `SplashScreen.setOptions`).
 * Web has no native launch screen, so nothing needs to be waited out there.
 */
const NATIVE_FADE_MS = Platform.OS === 'web' ? 0 : 120;
/** If layout never reports, still release the native splash so the app can never hang on it. */
const REVEAL_FALLBACK_MS = 3000;

const S = SPLASH_LAYOUT.imageWidth / SPLASH_LAYOUT.canvas;

type SplashOverlayProps = {
  /**
   * True once fonts are loaded and the app tree is mounted behind the overlay. The overlay never
   * dismisses before this, so it can safely paint before the app is ready.
   */
  appReady: boolean;
};

/**
 * The approved animated splash: Mobility Weave loader + wordmark + tagline on Obsidian.
 *
 * Seamless native -> custom handoff on both platforms:
 * - The native launch screen (app.json -> `expo-splash-screen`, `konnectev-splash-native.png`) is a
 *   static first frame of this exact composition: the Mobility Weave at loader frame 0 above the
 *   wordmark on Obsidian. It is on screen from the first moment of launch, so there is never a blank
 *   screen.
 * - This overlay is mounted at the very top of the root layout, so it paints as soon as JS starts,
 *   before fonts and the provider tree. It needs no providers, and it lays the loader + wordmark out
 *   with the same proportions as the native image.
 * - The native splash is released only after this overlay has laid out and been composited
 *   (two frames), and only then does the loader start moving, so the swap has no jump. Android
 *   withholds the activity's first draw until `hideAsync()` runs, which is why nothing can show
 *   through in between.
 * - The minimum display time is counted from that reveal (not from mount), so a busy JS thread in a
 *   dev build can never use it up before the overlay is visible.
 */
export function SplashOverlay({ appReady }: SplashOverlayProps) {
  const [revealed, setRevealed] = useState(false);
  const [minElapsed, setMinElapsed] = useState(false);
  const revealRequested = useRef(false);

  const reveal = useCallback(() => {
    if (revealRequested.current) {
      return;
    }
    revealRequested.current = true;
    // Wait two frames so the overlay is composited before the native splash is removed.
    requestAnimationFrame(() => {
      requestAnimationFrame(() => {
        SplashScreen.setOptions({ fade: true, duration: NATIVE_FADE_MS });
        void SplashScreen.hideAsync();
        setRevealed(true);
      });
    });
  }, []);

  useEffect(() => {
    const fallback = setTimeout(reveal, REVEAL_FALLBACK_MS);
    return () => clearTimeout(fallback);
  }, [reveal]);

  useEffect(() => {
    if (!revealed) {
      return undefined;
    }
    const timer = setTimeout(() => setMinElapsed(true), NATIVE_FADE_MS + MIN_DISPLAY_MS);
    return () => clearTimeout(timer);
  }, [revealed]);

  if (minElapsed && appReady) {
    return null;
  }

  return (
    <Animated.View
      pointerEvents="auto"
      exiting={FadeOut.duration(FADE_OUT_MS)}
      style={[StyleSheet.absoluteFill, styles.root]}
      onLayout={reveal}
      accessibilityLabel="konnectEVS"
    >
      <View style={styles.canvas}>
        <View
          style={{
            position: 'absolute',
            left: SPLASH_LAYOUT.symbolX * S,
            top: SPLASH_LAYOUT.symbolY * S,
          }}
        >
          <WeaveLoader
            size={SPLASH_LAYOUT.symbolSize * S}
            playing={revealed}
            accessibilityLabel="Loading konnectEVS"
          />
        </View>
        <View
          style={{
            position: 'absolute',
            left: SPLASH_LAYOUT.wordmarkX * S,
            top: SPLASH_LAYOUT.wordmarkY * S,
          }}
        >
          <Wordmark width={SPLASH_LAYOUT.wordmarkWidth * S} tone="onDark" />
        </View>
        {revealed && appReady ? (
          <Animated.View
            entering={FadeIn.delay(250).duration(500)}
            style={[
              styles.taglineWrap,
              { top: (SPLASH_LAYOUT.wordmarkY + SPLASH_LAYOUT.wordmarkHeight) * S + 20 },
            ]}
          >
            <Text style={styles.tagline}>{DRIVER_SPLASH_TAGLINE}</Text>
          </Animated.View>
        ) : null}
      </View>
    </Animated.View>
  );
}

const styles = StyleSheet.create({
  root: {
    zIndex: 1000,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: BRAND.obsidian,
  },
  canvas: {
    width: SPLASH_LAYOUT.imageWidth,
    height: SPLASH_LAYOUT.imageWidth,
  },
  taglineWrap: {
    position: 'absolute',
    left: -40,
    right: -40,
    alignItems: 'center',
  },
  tagline: {
    fontFamily: typography.fontFamily.brand,
    fontSize: 9.5,
    letterSpacing: 1.6,
    color: BRAND.lime,
    textAlign: 'center',
  },
});
