import { useMemo } from 'react';
import { Pressable, StyleSheet, View } from 'react-native';
import Svg, { Circle, Defs, LinearGradient, Path, Stop } from 'react-native-svg';

import { WeaveMark } from '@/components/brand/weave-mark';
import { Wordmark } from '@/components/brand/wordmark';
import { WORDMARK_KONNECT_CENTER_RATIO } from '@/components/brand/wordmark-paths';
import { Icon } from '@/components/ui/icon';
import { BRAND } from '@/theme/brand';
import { useTheme } from '@/theme';

const WAVE_HEIGHT = 272;
const WAVE_VIEWBOX = '0 0 500 272';
const WAVE_PATH = 'M 0 0 L 500 0 L 500 190 Q 210 280, 0 214 Z';
const WORDMARK_WIDTH = 138;
/** Shift the Weave tile so its center sits over "konnect", not the full wordmark. */
const WEAVE_SHIFT_X = (WORDMARK_KONNECT_CENTER_RATIO - 0.5) * WORDMARK_WIDTH;

type AuthWaveHeaderProps = {
  onBack: () => void;
};

/**
 * Emerald brand header shared by phone login and OTP verification (Figma `authArt`).
 * Explicit SVG sizing (not percentage height) keeps the wave silhouette correct on native.
 * The Weave is aligned to the "konnect" portion of the wordmark.
 */
export function AuthWaveHeader({ onBack }: AuthWaveHeaderProps) {
  const { theme } = useTheme();
  const styles = useMemo(() => createStyles(), []);

  return (
    <View style={styles.wrap}>
      <Svg
        height={WAVE_HEIGHT}
        width="100%"
        viewBox={WAVE_VIEWBOX}
        preserveAspectRatio="none"
        style={styles.svg}
        pointerEvents="none"
      >
        <Defs>
          <LinearGradient id="auth-header-gradient" x1="0" y1="0" x2="1" y2="1">
            <Stop offset="0" stopColor={theme.colors.primary} />
            <Stop offset="1" stopColor={theme.colors.primaryPressed} />
          </LinearGradient>
        </Defs>
        <Path d={WAVE_PATH} fill="url(#auth-header-gradient)" />
        <Circle
          cx="420"
          cy="40"
          r="120"
          fill="none"
          stroke={theme.colors.onPrimary}
          strokeOpacity={0.07}
          strokeWidth="1.5"
        />
        <Circle
          cx="420"
          cy="40"
          r="80"
          fill="none"
          stroke={theme.colors.onPrimary}
          strokeOpacity={0.08}
          strokeWidth="1.5"
        />
        <Circle
          cx="60"
          cy="200"
          r="90"
          fill="none"
          stroke={theme.colors.onPrimary}
          strokeOpacity={0.06}
          strokeWidth="1.5"
        />
      </Svg>

      <Pressable
        onPress={onBack}
        hitSlop={8}
        accessibilityRole="button"
        accessibilityLabel="Go back"
        style={styles.backButton}
      >
        <Icon name="back" size={22} color={theme.colors.onPrimary} />
      </Pressable>

      <View style={styles.brand} pointerEvents="none">
        <View style={[styles.tile, { transform: [{ translateX: WEAVE_SHIFT_X }] }]}>
          <WeaveMark size={52} />
        </View>
        <Wordmark width={WORDMARK_WIDTH} tone="onDark" />
      </View>
    </View>
  );
}

function createStyles() {
  return StyleSheet.create({
    wrap: {
      width: '100%',
      height: WAVE_HEIGHT,
      position: 'relative',
      zIndex: 1,
      backgroundColor: 'transparent',
    },
    svg: {
      position: 'absolute',
      top: 0,
      left: 0,
    },
    backButton: {
      position: 'absolute',
      top: 16,
      left: 16,
      zIndex: 10,
      width: 42,
      height: 42,
      borderRadius: 14,
      alignItems: 'center',
      justifyContent: 'center',
      backgroundColor: 'rgba(255, 255, 255, 0.18)',
    },
    brand: {
      position: 'absolute',
      top: 56,
      left: 0,
      right: 0,
      alignItems: 'center',
      gap: 14,
    },
    tile: {
      width: 88,
      height: 88,
      borderRadius: 28,
      alignItems: 'center',
      justifyContent: 'center',
      backgroundColor: BRAND.obsidian,
      shadowColor: '#000',
      shadowOffset: { width: 0, height: 10 },
      shadowOpacity: 0.28,
      shadowRadius: 18,
      elevation: 10,
    },
  });
}
