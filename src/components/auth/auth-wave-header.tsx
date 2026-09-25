import { Pressable, StyleSheet, View } from 'react-native';
import Svg, { Path } from 'react-native-svg';

import { LoginIllustration } from '@/components/auth/login-illustration';
import { Icon } from '@/components/ui/icon';
import { theme } from '@/theme';

const WAVE_HEIGHT = 260;
const WAVE_VIEWBOX = '0 0 500 260';
const WAVE_PATH = 'M 0 0 L 500 0 L 500 180 Q 200 260, 0 210 Z';

type AuthWaveHeaderProps = {
  onBack: () => void;
};

/**
 * Asymmetrical mint wave hero shared by phone login and OTP verification.
 * Uses a viewBox-scaled path so the curve stays consistent on native and web.
 */
export function AuthWaveHeader({ onBack }: AuthWaveHeaderProps) {
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
        <Path d={WAVE_PATH} fill={theme.colors.accent} />
      </Svg>

      <Pressable
        onPress={onBack}
        hitSlop={8}
        accessibilityRole="button"
        accessibilityLabel="Go back"
        style={styles.backButton}
      >
        <Icon name="back" size={22} color="#FFFFFF" />
      </Pressable>

      <View style={styles.illustration} pointerEvents="none">
        <LoginIllustration width={200} height={130} />
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  wrap: {
    width: '100%',
    height: WAVE_HEIGHT,
    backgroundColor: 'transparent',
    position: 'relative',
    zIndex: 1,
  },
  svg: {
    position: 'absolute',
    top: 0,
    left: 0,
    zIndex: 1,
  },
  backButton: {
    position: 'absolute',
    top: 16,
    left: 16,
    zIndex: 10,
    width: 40,
    height: 40,
    borderRadius: 20,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: 'rgba(255, 255, 255, 0.2)',
  },
  illustration: {
    position: 'absolute',
    top: 45,
    left: 0,
    right: 0,
    alignItems: 'center',
    zIndex: 2,
  },
});
